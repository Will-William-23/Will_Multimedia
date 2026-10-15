use std::cmp::Ordering as CmpOrdering;
use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU16, Ordering};
use std::sync::Arc;
use tiny_http::{Header, Response, Server, StatusCode};

static SERVER_PORT: AtomicU16 = AtomicU16::new(0);

const AUDIO_EXTENSIONS: &[&str] = &[
    "mp3", "wav", "ogg", "oga", "flac", "m4a", "aac", "wma", "opus", "aiff", "alac", "mid", "midi"
];

const VIDEO_EXTENSIONS: &[&str] = &[
    "mp4", "mkv", "webm", "avi", "mov", "flv", "wmv", "m4v", "ts", "3gp", "ogv", "vob"
];

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct MediaItem {
    pub id: String,
    pub name: String,
    pub title: String,
    pub path: String,
    pub size: u64,
    pub size_formatted: String,
    pub extension: String,
    pub media_type: String,
}

fn format_file_size(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;

    let b = bytes as f64;
    if b >= GB {
        format!("{:.1} GB", b / GB)
    } else if b >= MB {
        format!("{:.1} MB", b / MB)
    } else if b >= KB {
        format!("{:.1} KB", b / KB)
    } else {
        format!("{} B", bytes)
    }
}

fn is_audio_ext(ext: &str) -> bool {
    AUDIO_EXTENSIONS.contains(&ext)
}

fn is_video_ext(ext: &str) -> bool {
    VIDEO_EXTENSIONS.contains(&ext)
}

/// Natural sorting comparison (e.g. "1.mp4", "2.mp4", "10.mp4")
fn natural_compare(a: &str, b: &str) -> CmpOrdering {
    let mut a_chars = a.chars().peekable();
    let mut b_chars = b.chars().peekable();

    while let (Some(&ac), Some(&bc)) = (a_chars.peek(), b_chars.peek()) {
        if ac.is_ascii_digit() && bc.is_ascii_digit() {
            let mut a_num: u64 = 0;
            while let Some(&d) = a_chars.peek() {
                if d.is_ascii_digit() {
                    a_num = a_num.saturating_mul(10).saturating_add(d.to_digit(10).unwrap_or(0) as u64);
                    a_chars.next();
                } else {
                    break;
                }
            }

            let mut b_num: u64 = 0;
            while let Some(&d) = b_chars.peek() {
                if d.is_ascii_digit() {
                    b_num = b_num.saturating_mul(10).saturating_add(d.to_digit(10).unwrap_or(0) as u64);
                    b_chars.next();
                } else {
                    break;
                }
            }

            match a_num.cmp(&b_num) {
                CmpOrdering::Equal => continue,
                other => return other,
            }
        } else {
            let ac_lower = ac.to_lowercase().next().unwrap_or(ac);
            let bc_lower = bc.to_lowercase().next().unwrap_or(bc);
            match ac_lower.cmp(&bc_lower) {
                CmpOrdering::Equal => {
                    a_chars.next();
                    b_chars.next();
                }
                other => return other,
            }
        }
    }

    a.len().cmp(&b.len())
}

fn parse_bytes_range(header_value: &str, file_len: u64) -> Option<(u64, u64)> {
    let header_value = header_value.trim();
    if !header_value.starts_with("bytes=") {
        return None;
    }
    let range_part = &header_value[6..];
    let parts: Vec<&str> = range_part.split('-').collect();
    if parts.len() != 2 {
        return None;
    }

    let start = parts[0].trim();
    let end = parts[1].trim();

    if start.is_empty() && !end.is_empty() {
        let length: u64 = end.parse().ok()?;
        if length == 0 {
            return None;
        }
        let start = file_len.saturating_sub(length);
        Some((start, file_len - 1))
    } else if !start.is_empty() && end.is_empty() {
        let start: u64 = start.parse().ok()?;
        if start >= file_len {
            return None;
        }
        Some((start, file_len - 1))
    } else if !start.is_empty() && !end.is_empty() {
        let start: u64 = start.parse().ok()?;
        let mut end: u64 = end.parse().ok()?;
        if start >= file_len || start > end {
            return None;
        }
        if end >= file_len {
            end = file_len - 1;
        }
        Some((start, end))
    } else {
        None
    }
}

fn handle_stream_request(request: tiny_http::Request) {
    let url_str = request.url().to_string();

    // CORS preflight OPTIONS
    if request.method() == &tiny_http::Method::Options {
        let headers = vec![
            Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
            Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, OPTIONS"[..]).unwrap(),
            Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Range, Content-Type"[..]).unwrap(),
        ];
        let response = Response::new(StatusCode(200), headers, std::io::empty(), Some(0), None);
        let _ = request.respond(response);
        return;
    }

    if url_str.starts_with("/stream") {
        let query = if let Some(idx) = url_str.find('?') {
            &url_str[idx + 1..]
        } else {
            ""
        };

        let mut raw_path = String::new();
        for pair in query.split('&') {
            let mut parts = pair.splitn(2, '=');
            if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
                if k == "path" {
                    raw_path = urlencoding::decode(v).unwrap_or_default().to_string();
                    break;
                }
            }
        }

        if raw_path.is_empty() {
            let resp = Response::from_string("Missing path query parameter").with_status_code(400);
            let _ = request.respond(resp);
            return;
        }

        let path = Path::new(&raw_path);
        if !path.exists() || !path.is_file() {
            let resp = Response::from_string("File not found").with_status_code(404);
            let _ = request.respond(resp);
            return;
        }

        let file = match File::open(&path) {
            Ok(f) => f,
            Err(e) => {
                let resp = Response::from_string(format!("Failed to open file: {}", e)).with_status_code(500);
                let _ = request.respond(resp);
                return;
            }
        };

        let file_len = match file.metadata() {
            Ok(m) => m.len(),
            Err(_) => {
                let resp = Response::from_string("Cannot read metadata").with_status_code(500);
                let _ = request.respond(resp);
                return;
            }
        };

        let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
        let mime = match ext.as_str() {
            "mp3" => "audio/mpeg",
            "wav" => "audio/wav",
            "ogg" | "oga" => "audio/ogg",
            "flac" => "audio/flac",
            "m4a" | "aac" => "audio/mp4",
            "opus" => "audio/opus",
            "wma" => "audio/x-ms-wma",
            "aiff" => "audio/aiff",
            "mp4" | "m4v" => "video/mp4",
            "webm" => "video/webm",
            "mkv" => "video/x-matroska",
            "avi" => "video/x-msvideo",
            "mov" => "video/quicktime",
            "wmv" => "video/x-ms-wmv",
            "flv" => "video/x-flv",
            "ts" => "video/mp2t",
            "3gp" => "video/3gpp",
            "ogv" => "video/ogg",
            _ => {
                if is_audio_ext(&ext) {
                    "audio/mpeg"
                } else if is_video_ext(&ext) {
                    "video/mp4"
                } else {
                    "application/octet-stream"
                }
            }
        };

        let range_header = request.headers().iter().find(|h| h.field.as_str().as_bytes().eq_ignore_ascii_case(b"range"));

        let mut start_byte = 0;
        let mut end_byte = file_len.saturating_sub(1);
        let mut is_partial = false;

        if let Some(header) = range_header {
            if let Some(vals) = parse_bytes_range(header.value.as_str(), file_len) {
                start_byte = vals.0;
                end_byte = vals.1;
                is_partial = true;
            }
        }

        let content_length = if end_byte >= start_byte {
            end_byte - start_byte + 1
        } else {
            0
        };

        let mut file_reader = file;
        if let Err(_) = file_reader.seek(SeekFrom::Start(start_byte)) {
            let resp = Response::from_string("Range Not Satisfiable").with_status_code(416);
            let _ = request.respond(resp);
            return;
        }

        let limited_reader = file_reader.take(content_length);

        let mut headers = vec![
            Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]).unwrap(),
            Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()).unwrap(),
            Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
            Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, OPTIONS, HEAD"[..]).unwrap(),
            Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Range, Content-Type, Accept, Origin"[..]).unwrap(),
            Header::from_bytes(&b"Access-Control-Expose-Headers"[..], &b"Content-Range, Accept-Ranges, Content-Length"[..]).unwrap(),
        ];

        let status_code = if is_partial {
            let content_range = format!("bytes {}-{}/{}", start_byte, end_byte, file_len);
            headers.push(Header::from_bytes(&b"Content-Range"[..], content_range.as_bytes()).unwrap());
            StatusCode(206)
        } else {
            StatusCode(200)
        };

        let response = Response::new(
            status_code,
            headers,
            limited_reader,
            Some(content_length as usize),
            None,
        );

        let _ = request.respond(response);
    } else {
        let resp = Response::from_string("Will Multimedia Streamer").with_status_code(200);
        let _ = request.respond(resp);
    }
}

fn start_streaming_server() -> u16 {
    let server = match Server::http("127.0.0.1:45455") {
        Ok(s) => s,
        Err(_) => Server::http("127.0.0.1:0").expect("Failed to bind streaming server on any port"),
    };
    let port = server.server_addr().to_ip().map(|ip| ip.port()).unwrap_or(45455);
    SERVER_PORT.store(port, Ordering::SeqCst);

    let server_arc = Arc::new(server);
    let s_clone = Arc::clone(&server_arc);

    // Concurrent multi-threaded streaming server: never blocks audio or video requests!
    std::thread::spawn(move || {
        for request in s_clone.incoming_requests() {
            std::thread::spawn(move || {
                handle_stream_request(request);
            });
        }
    });

    port
}

fn get_cache_file_path() -> PathBuf {
    let base = dirs_fallback();
    let app_dir = base.join("WillMultimedia");
    let _ = fs::create_dir_all(&app_dir);
    app_dir.join("session_cache.json")
}

fn dirs_fallback() -> PathBuf {
    if let Ok(appdata) = std::env::var("APPDATA") {
        PathBuf::from(appdata)
    } else if let Ok(home) = std::env::var("USERPROFILE") {
        PathBuf::from(home).join("AppData").join("Roaming")
    } else {
        PathBuf::from(".")
    }
}

#[tauri::command]
fn get_stream_port() -> u16 {
    SERVER_PORT.load(Ordering::SeqCst)
}

#[tauri::command]
fn open_files_dialog(filter_type: String) -> Result<Vec<String>, String> {
    let mut dialog = rfd::FileDialog::new();
    match filter_type.as_str() {
        "audio" => {
            dialog = dialog
                .add_filter("Audios (*.mp3, *.wav, *.flac, *.ogg, *.m4a, *.aac, *.opus)", AUDIO_EXTENSIONS)
                .add_filter("Todos los archivos (*.*)", &["*"]);
        }
        "video" => {
            dialog = dialog
                .add_filter("Videos (*.mp4, *.mkv, *.webm, *.avi, *.mov, *.wmv)", VIDEO_EXTENSIONS)
                .add_filter("Todos los archivos (*.*)", &["*"]);
        }
        _ => {
            let mut all_exts = Vec::new();
            all_exts.extend_from_slice(AUDIO_EXTENSIONS);
            all_exts.extend_from_slice(VIDEO_EXTENSIONS);
            dialog = dialog
                .add_filter("Multimedia", &all_exts)
                .add_filter("Todos los archivos (*.*)", &["*"]);
        }
    }

    let files = dialog.pick_files()
        .unwrap_or_default()
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    Ok(files)
}

#[tauri::command]
fn open_folder_dialog() -> Result<Option<String>, String> {
    let folder = rfd::FileDialog::new().pick_folder().map(|p| p.to_string_lossy().to_string());
    Ok(folder)
}

#[tauri::command]
fn scan_folder(folder_path: String, media_type: String) -> Result<Vec<MediaItem>, String> {
    let path = Path::new(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Err("La carpeta especificada no existe".to_string());
    }

    let entries = fs::read_dir(path).map_err(|e| format!("Error al leer la carpeta: {}", e))?;
    let mut items = Vec::new();

    for entry in entries.flatten() {
        let entry_path = entry.path();
        if entry_path.is_file() {
            let ext = entry_path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
            let is_audio = is_audio_ext(&ext);
            let is_video = is_video_ext(&ext);

            let matches = match media_type.as_str() {
                "audio" => is_audio,
                "video" => is_video,
                _ => is_audio || is_video,
            };

            if matches {
                let name = entry_path.file_name().and_then(|s| s.to_str()).unwrap_or("Desconocido").to_string();
                let title = entry_path.file_stem().and_then(|s| s.to_str()).unwrap_or(&name).to_string();
                let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                let size_formatted = format_file_size(size);
                let path_str = entry_path.to_string_lossy().to_string();
                let id = format!("{:x}", md5_hash(&path_str));
                let resolved_type = if is_audio { "audio" } else { "video" }.to_string();

                items.push(MediaItem {
                    id,
                    name,
                    title,
                    path: path_str,
                    size,
                    size_formatted,
                    extension: ext,
                    media_type: resolved_type,
                });
            }
        }
    }

    // Natural numeric sort: 1.mp4, 2.mp4, 3.mp4 ... 10.mp4, 11.mp4!
    items.sort_by(|a, b| natural_compare(&a.name, &b.name));

    Ok(items)
}

#[tauri::command]
fn scan_file(file_path: String) -> Result<MediaItem, String> {
    let path = Path::new(&file_path);
    if !path.exists() || !path.is_file() {
        return Err("El archivo no existe".to_string());
    }

    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
    let name = path.file_name().and_then(|s| s.to_str()).unwrap_or("Desconocido").to_string();
    let title = path.file_stem().and_then(|s| s.to_str()).unwrap_or(&name).to_string();
    let size = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    let size_formatted = format_file_size(size);
    let path_str = path.to_string_lossy().to_string();
    let id = format!("{:x}", md5_hash(&path_str));
    let resolved_type = if is_audio_ext(&ext) { "audio" } else { "video" }.to_string();

    Ok(MediaItem {
        id,
        name,
        title,
        path: path_str,
        size,
        size_formatted,
        extension: ext,
        media_type: resolved_type,
    })
}

#[tauri::command]
fn save_cache(cache_data: String) -> Result<(), String> {
    let cache_path = get_cache_file_path();
    fs::write(&cache_path, cache_data).map_err(|e| format!("Error al guardar caché: {}", e))?;
    Ok(())
}

#[tauri::command]
fn load_cache() -> Result<Option<String>, String> {
    let cache_path = get_cache_file_path();
    if !cache_path.exists() {
        return Ok(None);
    }
    let data = fs::read_to_string(&cache_path).map_err(|e| format!("Error al cargar caché: {}", e))?;
    Ok(Some(data))
}

fn md5_hash(input: &str) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in input.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _port = start_streaming_server();
    println!(">>> WILL_MULTIMEDIA_NATIVE_READY <<<");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_stream_port,
            open_files_dialog,
            open_folder_dialog,
            scan_folder,
            scan_file,
            save_cache,
            load_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running will multimedia player");
}
