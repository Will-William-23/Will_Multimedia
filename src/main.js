import { invoke } from '@tauri-apps/api/core';

// ============================================================
// APPLICATION STATE
// ============================================================
const state = {
  streamPort: 45455,
  currentSection: 'home', // 'home' | 'audio' | 'video'

  // Dedicated Queues
  audioPlaylist: [],
  audioFilteredPlaylist: [],
  audioIndex: -1,
  audioFolder: null,

  videoPlaylist: [],
  videoFilteredPlaylist: [],
  videoIndex: -1,
  videoFolder: null,

  // Playback state
  isPlaying: false,
  playbackPosition: 0,
  duration: 0,
  volume: 0.9,
  isMuted: false,
  shuffle: false,
  repeatMode: 'none', // 'none' | 'all' | 'one'
  speed: 1.0,

  // Search & Sorting
  audioSearchQuery: '',
  audioSortAsc: true,
  videoSearchQuery: '',
  videoSortAsc: true,

  lastActiveSection: 'video', // 'video' | 'audio'
  lastSavedPos: 0,

  isTauri: typeof window.__TAURI_INTERNALS__ !== 'undefined',
  cachedSession: null,
};

// ============================================================
// DOM ELEMENTS
// ============================================================
const el = {
  ambientGlow: document.getElementById('ambientGlow'),

  // Headers
  headerHome: document.getElementById('headerHome'),
  headerAudio: document.getElementById('headerAudio'),
  headerVideo: document.getElementById('headerVideo'),
  btnShortcuts: document.getElementById('btnShortcuts'),
  btnBackFromAudio: document.getElementById('btnBackFromAudio'),
  btnBackFromVideo: document.getElementById('btnBackFromVideo'),
  audioHeaderFolder: document.getElementById('audioHeaderFolder'),
  videoHeaderTitle: document.getElementById('videoHeaderTitle'),

  // Header Actions
  btnAudioOpenFiles: document.getElementById('btnAudioOpenFiles'),
  btnAudioOpenFolder: document.getElementById('btnAudioOpenFolder'),
  btnAudioAddToQueue: document.getElementById('btnAudioAddToQueue'),
  btnVideoOpenFiles: document.getElementById('btnVideoOpenFiles'),
  btnVideoOpenFolder: document.getElementById('btnVideoOpenFolder'),
  btnVideoAddToQueue: document.getElementById('btnVideoAddToQueue'),
  btnVideoQueueToggle: document.getElementById('btnVideoQueueToggle'),
  videoQueueBadge: document.getElementById('videoQueueBadge'),

  // Views
  homeView: document.getElementById('homeView'),
  audioView: document.getElementById('audioView'),
  videoView: document.getElementById('videoView'),

  // Home Screen Elements
  btnEnterAudio: document.getElementById('btnEnterAudio'),
  btnEnterVideo: document.getElementById('btnEnterVideo'),
  cardEnterAudio: document.getElementById('cardEnterAudio'),
  cardEnterVideo: document.getElementById('cardEnterVideo'),
  resumeBox: document.getElementById('resumeBox'),
  resumeItemTitle: document.getElementById('resumeItemTitle'),
  resumeTimeInfo: document.getElementById('resumeTimeInfo'),
  btnResumeSession: document.getElementById('btnResumeSession'),

  // Audio View Elements
  vinylWrap: document.getElementById('vinylWrap'),
  vinylDisc: document.getElementById('vinylDisc'),
  audioTrackTitle: document.getElementById('audioTrackTitle'),
  audioFolderTag: document.getElementById('audioFolderTag'),
  audioFormatBadge: document.getElementById('audioFormatBadge'),
  audioSizeBadge: document.getElementById('audioSizeBadge'),
  audioIndexBadge: document.getElementById('audioIndexBadge'),
  visualizerCanvas: document.getElementById('visualizerCanvas'),
  audioPlaylistCountBadge: document.getElementById('audioPlaylistCountBadge'),
  btnSortAudioQueue: document.getElementById('btnSortAudioQueue'),
  btnClearAudioPlaylist: document.getElementById('btnClearAudioPlaylist'),
  audioPlaylistSearch: document.getElementById('audioPlaylistSearch'),
  btnAudioSearchClear: document.getElementById('btnAudioSearchClear'),
  audioPlaylistList: document.getElementById('audioPlaylistList'),

  // Video View Elements
  cinemaContainer: document.getElementById('cinemaContainer'),
  ambientVideoCanvas: document.getElementById('ambientVideoCanvas'),
  mainVideoPlayer: document.getElementById('mainVideoPlayer'),
  videoHud: document.getElementById('videoHud'),
  videoTitleDisplay: document.getElementById('videoTitleDisplay'),
  btnPip: document.getElementById('btnPip'),
  btnFullscreen: document.getElementById('btnFullscreen'),
  hudCenterSplash: document.getElementById('hudCenterSplash'),
  videoScrubContainer: document.getElementById('videoScrubContainer'),
  videoScrubBuffer: document.getElementById('videoScrubBuffer'),
  videoScrubProgress: document.getElementById('videoScrubProgress'),
  videoScrubThumb: document.getElementById('videoScrubThumb'),
  videoScrubTooltip: document.getElementById('videoScrubTooltip'),
  btnVideoPrev: document.getElementById('btnVideoPrev'),
  btnVideoPlayPause: document.getElementById('btnVideoPlayPause'),
  videoPlayPauseIcon: document.getElementById('videoPlayPauseIcon'),
  btnVideoNext: document.getElementById('btnVideoNext'),
  btnVideoSkipBack: document.getElementById('btnVideoSkipBack'),
  btnVideoSkipForward: document.getElementById('btnVideoSkipForward'),
  videoCurrentTime: document.getElementById('videoCurrentTime'),
  videoDurationTime: document.getElementById('videoDurationTime'),
  btnVideoMute: document.getElementById('btnVideoMute'),
  videoMuteIcon: document.getElementById('videoMuteIcon'),
  videoVolumeSlider: document.getElementById('videoVolumeSlider'),
  btnSpeedMenu: document.getElementById('btnSpeedMenu'),
  videoSpeedLabel: document.getElementById('videoSpeedLabel'),
  speedDropdown: document.getElementById('speedDropdown'),
  videoPlaylistDrawer: document.getElementById('videoPlaylistDrawer'),
  videoPlaylistCountBadge: document.getElementById('videoPlaylistCountBadge'),
  btnSortVideoQueue: document.getElementById('btnSortVideoQueue'),
  btnClearVideoPlaylist: document.getElementById('btnClearVideoPlaylist'),
  btnCloseVideoDrawer: document.getElementById('btnCloseVideoDrawer'),
  videoPlaylistSearch: document.getElementById('videoPlaylistSearch'),
  videoPlaylistList: document.getElementById('videoPlaylistList'),

  // Bottom Audio Dock Bar
  bottomPlayerBar: document.getElementById('bottomPlayerBar'),
  barCover: document.getElementById('barCover'),
  barTrackTitle: document.getElementById('barTrackTitle'),
  barTrackSub: document.getElementById('barTrackSub'),
  btnShuffle: document.getElementById('btnShuffle'),
  btnAudioPrev: document.getElementById('btnAudioPrev'),
  btnAudioPlayPause: document.getElementById('btnAudioPlayPause'),
  barPlayPauseIcon: document.getElementById('barPlayPauseIcon'),
  btnAudioNext: document.getElementById('btnAudioNext'),
  btnRepeat: document.getElementById('btnRepeat'),
  iconRepeat: document.getElementById('iconRepeat'),
  audioCurrentTime: document.getElementById('audioCurrentTime'),
  audioDurationTime: document.getElementById('audioDurationTime'),
  audioScrubContainer: document.getElementById('audioScrubContainer'),
  audioScrubProgress: document.getElementById('audioScrubProgress'),
  audioScrubThumb: document.getElementById('audioScrubThumb'),
  btnAudioMute: document.getElementById('btnAudioMute'),
  audioMuteIcon: document.getElementById('audioMuteIcon'),
  audioVolumeSlider: document.getElementById('audioVolumeSlider'),

  // Players
  mainAudioPlayer: document.getElementById('mainAudioPlayer'),

  // Toasts & Modals
  toastNotification: document.getElementById('toastNotification'),
  toastMessage: document.getElementById('toastMessage'),
  shortcutsModal: document.getElementById('shortcutsModal'),
  btnCloseShortcuts: document.getElementById('btnCloseShortcuts'),
};

// ============================================================
// NATURAL SORT HELPER (1, 2, 3 ... 9, 10, 11)
// ============================================================
function naturalSortItems(list, asc = true) {
  return [...list].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    return asc ? cmp : -cmp;
  });
}

// ============================================================
// AUDIO VISUALIZER (DYNAMIC SPECTRUM RHYTHM)
// ============================================================
let animFrameId = null;

function setupAudioVisualizer() {
  if (animFrameId) return;
  renderVisualizer();
}

function renderVisualizer() {
  const canvas = el.visualizerCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const barCount = 36;
  const barWidth = (canvas.width / barCount) - 3;

  function draw() {
    animFrameId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();
    let x = 2;

    for (let i = 0; i < barCount; i++) {
      let percent = 0;

      if (state.isPlaying && state.currentSection === 'audio') {
        // Dynamic rhythmic spectrum bars reacting to playback tempo and frequencies
        const baseFreq = Math.sin((now / 180) + (i * 0.45)) * 0.35 + 0.45;
        const beatPulse = Math.pow(Math.sin(now / 350), 4) * 0.4;
        const curve = 1.0 - Math.abs((i - (barCount * 0.35)) / (barCount * 0.7));
        percent = Math.max(0.08, Math.min(0.95, (baseFreq + beatPulse) * curve));
      } else {
        // Gentle resting wave when paused
        percent = (Math.sin((now / 600) + (i * 0.25)) * 0.12 + 0.18);
      }

      const barHeight = Math.max(4, percent * (canvas.height - 8));

      const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1, '#8b5cf6');

      ctx.fillStyle = grad;
      ctx.shadowBlur = state.isPlaying ? 10 : 4;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.45)';
      ctx.beginPath();
      ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
      ctx.fill();

      x += barWidth + 3;
    }
  }

  draw();
}

// ============================================================
// VIDEO AMBIENT LIGHTING & HUD TIMER
// ============================================================
let ambientCanvasCtx = null;
let videoAmbientInterval = null;
let hudTimeout = null;

function setupVideoAmbient() {
  if (!el.ambientVideoCanvas) return;
  ambientCanvasCtx = el.ambientVideoCanvas.getContext('2d');
  el.ambientVideoCanvas.width = 64;
  el.ambientVideoCanvas.height = 36;

  if (videoAmbientInterval) clearInterval(videoAmbientInterval);
  videoAmbientInterval = setInterval(() => {
    if (state.currentSection === 'video' && state.isPlaying && !el.mainVideoPlayer.paused) {
      try {
        ambientCanvasCtx.drawImage(el.mainVideoPlayer, 0, 0, 64, 36);
      } catch (err) {
        // Ignored
      }
    }
  }, 120);
}

function resetHudTimer() {
  if (state.currentSection !== 'video') return;
  el.videoHud.classList.remove('hud-hidden');
  if (hudTimeout) clearTimeout(hudTimeout);

  if (state.isPlaying) {
    hudTimeout = setTimeout(() => {
      if (state.isPlaying && el.speedDropdown.classList.contains('hidden')) {
        el.videoHud.classList.add('hud-hidden');
      }
    }, 2800);
  }
}

// ============================================================
// NAVIGATION BETWEEN SECTIONS (HOME / AUDIO / VIDEO)
// ============================================================
function goToSection(targetSection, loadMedia = true) {
  // Capture current playback position before switching or pausing
  if (state.currentSection === 'video') {
    if (!isSeekingPending && !isNaN(el.mainVideoPlayer.currentTime) && el.mainVideoPlayer.currentTime > 0) {
      state.playbackPosition = el.mainVideoPlayer.currentTime;
    }
    state.lastActiveSection = 'video';
  } else if (state.currentSection === 'audio') {
    if (!isSeekingPending && !isNaN(el.mainAudioPlayer.currentTime) && el.mainAudioPlayer.currentTime > 0) {
      state.playbackPosition = el.mainAudioPlayer.currentTime;
    }
    state.lastActiveSection = 'audio';
  }

  state.currentSection = targetSection;

  if (targetSection === 'home') {
    // Show Home
    el.headerHome.classList.remove('hidden');
    el.headerAudio.classList.add('hidden');
    el.headerVideo.classList.add('hidden');

    el.homeView.classList.remove('hidden');
    el.audioView.classList.add('hidden');
    el.videoView.classList.add('hidden');
    el.bottomPlayerBar.classList.add('hidden');
    el.ambientGlow.classList.remove('video-mode');

    // Pause players cleanly WITHOUT clearing src to avoid firing unload timeupdate(0)
    el.mainAudioPlayer.pause();
    el.mainVideoPlayer.pause();
    setPlayingState(false);

    // Save state and refresh Resume Box immediately
    saveSession();
    updateResumeBoxUI();

  } else if (targetSection === 'audio') {
    state.lastActiveSection = 'audio';
    // Pause video cleanly
    el.mainVideoPlayer.pause();

    // Show Audio Section
    el.headerHome.classList.add('hidden');
    el.headerAudio.classList.remove('hidden');
    el.headerVideo.classList.add('hidden');

    el.homeView.classList.add('hidden');
    el.audioView.classList.remove('hidden');
    el.videoView.classList.add('hidden');
    el.bottomPlayerBar.classList.remove('hidden');
    el.ambientGlow.classList.remove('video-mode');

    setupAudioVisualizer();
    renderAudioPlaylist();

    // If queue has items and none playing, play current or first
    if (loadMedia && !el.mainAudioPlayer.src && state.audioPlaylist.length > 0 && state.audioIndex >= 0) {
      loadAudioItem(state.audioIndex, false, state.playbackPosition);
    }

  } else if (targetSection === 'video') {
    state.lastActiveSection = 'video';
    // Pause audio cleanly
    el.mainAudioPlayer.pause();

    // Show Video Section
    el.headerHome.classList.add('hidden');
    el.headerAudio.classList.add('hidden');
    el.headerVideo.classList.remove('hidden');

    el.homeView.classList.add('hidden');
    el.audioView.classList.add('hidden');
    el.videoView.classList.remove('hidden');
    el.bottomPlayerBar.classList.add('hidden');
    el.ambientGlow.classList.add('video-mode');

    renderVideoPlaylist();

    if (loadMedia && !el.mainVideoPlayer.src && state.videoPlaylist.length > 0 && state.videoIndex >= 0) {
      loadVideoItem(state.videoIndex, false, state.playbackPosition);
    }
  }

  saveSession();
}

// ============================================================
// UTILITIES & FORMATTING (HH:MM:SS)
// ============================================================
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const hh = String(hrs).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

let isSeekingPending = false;
let pendingSeekTime = 0;

function applySeek(player, targetTime) {
  if (targetTime <= 0) return;
  isSeekingPending = true;
  pendingSeekTime = targetTime;
  state.playbackPosition = targetTime;

  const performSeek = () => {
    try {
      if (player.readyState >= 1) { // HAVE_METADATA or higher
        player.currentTime = targetTime;
      }
    } catch (err) {
      console.warn('Seek error:', err);
    }
  };

  if (player.readyState >= 1) {
    performSeek();
  } else {
    player.addEventListener('loadedmetadata', performSeek, { once: true });
    player.addEventListener('canplay', performSeek, { once: true });
  }

  const onSeeked = () => {
    isSeekingPending = false;
    state.playbackPosition = player.currentTime;
    saveSession();
  };
  player.addEventListener('seeked', onSeeked, { once: true });
}

function showToast(message) {
  el.toastMessage.textContent = message;
  el.toastNotification.classList.remove('hidden');
  setTimeout(() => {
    el.toastNotification.classList.add('hidden');
  }, 3200);
}

function getMediaStreamUrl(filePath) {
  return `http://127.0.0.1:${state.streamPort}/stream?path=${encodeURIComponent(filePath)}`;
}

function getFolderName(path) {
  if (!path) return 'Ninguna';
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

// ============================================================
// CACHE / STATE PERSISTENCE
// ============================================================
async function saveSession() {
  const section = state.lastActiveSection || (state.currentSection !== 'home' ? state.currentSection : 'video');

  const currentItem = section === 'video'
    ? (state.videoPlaylist[state.videoIndex] || null)
    : (state.audioPlaylist[state.audioIndex] || null);

  if (!isSeekingPending) {
    const activePlayer = section === 'video' ? el.mainVideoPlayer : el.mainAudioPlayer;
    if (activePlayer && !isNaN(activePlayer.currentTime) && activePlayer.currentTime > 0) {
      state.playbackPosition = activePlayer.currentTime;
    }
  }

  const title = currentItem ? (currentItem.title || currentItem.name) : (state.cachedSession?.lastTitle || null);

  const payload = {
    currentSection: section,
    lastActiveSection: section,
    audioPlaylist: state.audioPlaylist,
    audioIndex: state.audioIndex,
    audioFolder: state.audioFolder,
    videoPlaylist: state.videoPlaylist,
    videoIndex: state.videoIndex,
    videoFolder: state.videoFolder,
    lastTitle: title,
    playbackPosition: state.playbackPosition,
    volume: state.volume,
    isMuted: state.isMuted,
    shuffle: state.shuffle,
    repeatMode: state.repeatMode,
    timestamp: Date.now(),
  };

  state.cachedSession = payload;
  const jsonStr = JSON.stringify(payload);
  localStorage.setItem('will_multimedia_session_cache', jsonStr);

  if (state.isTauri) {
    try {
      await invoke('save_cache', { cacheData: jsonStr });
    } catch (e) {
      console.warn('Error guardando sesión:', e);
    }
  }

  updateResumeBoxUI();
}

function updateResumeBoxUI() {
  if (!state.cachedSession) {
    el.resumeBox.classList.add('hidden');
    return;
  }

  const data = state.cachedSession;
  const section = data.lastActiveSection || (data.currentSection === 'audio' ? 'audio' : 'video');
  const item = section === 'video'
    ? (data.videoPlaylist ? data.videoPlaylist[data.videoIndex] : null)
    : (data.audioPlaylist ? data.audioPlaylist[data.audioIndex] : null);

  const title = (item ? (item.title || item.name) : null) || data.lastTitle;

  if (title) {
    el.resumeItemTitle.textContent = title;
    const pos = typeof data.playbackPosition === 'number' ? data.playbackPosition : (state.playbackPosition || 0);
    const posFormatted = formatTime(pos);
    const sectionLabel = section === 'video' ? 'Sección Video' : 'Sección Audio';
    el.resumeTimeInfo.textContent = `En ${posFormatted} • ${sectionLabel}`;
    el.resumeBox.classList.remove('hidden');
  } else {
    el.resumeBox.classList.add('hidden');
  }
}

async function loadSession() {
  let jsonStr = null;

  if (state.isTauri) {
    try {
      jsonStr = await invoke('load_cache');
    } catch (e) {
      console.warn('Error leyendo caché:', e);
    }
  }

  if (!jsonStr) {
    jsonStr = localStorage.getItem('will_multimedia_session_cache');
  }

  if (jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      state.cachedSession = data;

      if (data.audioPlaylist) state.audioPlaylist = data.audioPlaylist;
      if (data.videoPlaylist) state.videoPlaylist = data.videoPlaylist;
      state.audioIndex = data.audioIndex ?? -1;
      state.videoIndex = data.videoIndex ?? -1;
      state.audioFolder = data.audioFolder;
      state.videoFolder = data.videoFolder;
      state.playbackPosition = typeof data.playbackPosition === 'number' ? data.playbackPosition : 0;
      state.volume = data.volume ?? 0.9;
      state.isMuted = data.isMuted ?? false;
      state.shuffle = data.shuffle ?? false;
      state.repeatMode = data.repeatMode || 'none';
      state.lastActiveSection = data.lastActiveSection || (data.currentSection === 'audio' ? 'audio' : 'video');

      updateResumeBoxUI();
    } catch (e) {
      console.warn('Caché no legible:', e);
    }
  }
}

function restoreSession() {
  if (!state.cachedSession) return;
  const targetSection = state.cachedSession.lastActiveSection || (state.cachedSession.currentSection === 'audio' ? 'audio' : 'video');
  const targetTime = typeof state.cachedSession.playbackPosition === 'number' && state.cachedSession.playbackPosition > 0
    ? state.cachedSession.playbackPosition
    : (state.playbackPosition || 0);

  // Set position before switching sections so nothing resets it
  state.playbackPosition = targetTime;

  // Switch to target view UI without triggering redundant media load
  goToSection(targetSection, false);

  if (targetSection === 'audio' && state.audioIndex >= 0) {
    loadAudioItem(state.audioIndex, true, targetTime);
  } else if (targetSection === 'video' && state.videoIndex >= 0) {
    loadVideoItem(state.videoIndex, true, targetTime);
  }
  showToast(`Reanudando en ${formatTime(targetTime)}`);
}

// ============================================================
// AUDIO PLAYBACK LOGIC
// ============================================================
function loadAudioItem(index, autoPlay = true, seekTime = 0) {
  if (index < 0 || index >= state.audioPlaylist.length) return;

  state.audioIndex = index;
  state.lastActiveSection = 'audio';
  const item = state.audioPlaylist[index];
  const streamUrl = getMediaStreamUrl(item.path);

  if (el.mainAudioPlayer.src !== streamUrl) {
    el.mainAudioPlayer.src = streamUrl;
  }
  el.mainAudioPlayer.volume = state.isMuted ? 0 : state.volume;
  el.mainAudioPlayer.playbackRate = state.speed;

  if (seekTime > 0) {
    applySeek(el.mainAudioPlayer, seekTime);
  } else {
    isSeekingPending = false;
    el.mainAudioPlayer.currentTime = 0;
    state.playbackPosition = 0;
  }

  el.audioTrackTitle.textContent = item.title;
  el.audioFolderTag.textContent = state.audioFolder ? `Carpeta: ${getFolderName(state.audioFolder)}` : 'Archivos seleccionados';
  el.audioHeaderFolder.textContent = state.audioFolder ? getFolderName(state.audioFolder) : item.name;
  el.audioFormatBadge.textContent = item.extension.toUpperCase();
  el.audioSizeBadge.textContent = item.size_formatted;
  el.audioIndexBadge.textContent = `Pista ${index + 1}/${state.audioPlaylist.length}`;

  el.barTrackTitle.textContent = item.title;
  el.barTrackSub.textContent = item.name;

  renderAudioPlaylist();

  if (autoPlay) {
    setupAudioVisualizer();
    el.mainAudioPlayer.play().then(() => {
      setPlayingState(true);
      if (seekTime > 0 && Math.abs(el.mainAudioPlayer.currentTime - seekTime) > 1.5) {
        applySeek(el.mainAudioPlayer, seekTime);
      }
    }).catch(e => {
      console.warn('Audio play error:', e);
      setPlayingState(false);
    });
  } else {
    setPlayingState(false);
  }

  saveSession();
}

function renderAudioPlaylist() {
  const query = state.audioSearchQuery.toLowerCase().trim();
  state.audioFilteredPlaylist = state.audioPlaylist.filter(item =>
    item.name.toLowerCase().includes(query) || item.title.toLowerCase().includes(query)
  );

  el.audioPlaylistCountBadge.textContent = `${state.audioPlaylist.length} Pistas`;
  el.audioPlaylistList.innerHTML = '';

  state.audioFilteredPlaylist.forEach(item => {
    const originalIndex = state.audioPlaylist.findIndex(p => p.id === item.id);
    const isActive = originalIndex === state.audioIndex;

    const div = document.createElement('div');
    div.className = `queue-item ${isActive ? 'active' : ''}`;
    div.innerHTML = `
      <div class="queue-index">
        ${isActive && state.isPlaying ? `
          <div class="eq-bars">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
        ` : (originalIndex + 1)}
      </div>
      <div class="queue-info">
        <div class="queue-name">${item.title}</div>
        <div class="queue-sub">${item.size_formatted} • .${item.extension.toUpperCase()}</div>
      </div>
      <button class="queue-delete" title="Quitar de la cola">&times;</button>
    `;

    div.querySelector('.queue-info').addEventListener('click', () => {
      loadAudioItem(originalIndex, true);
    });

    div.querySelector('.queue-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      removeAudioItem(originalIndex);
    });

    el.audioPlaylistList.appendChild(div);
  });
}

function removeAudioItem(index) {
  if (index < 0 || index >= state.audioPlaylist.length) return;
  state.audioPlaylist.splice(index, 1);
  if (state.audioIndex === index) {
    if (state.audioPlaylist.length > 0) {
      loadAudioItem(Math.min(index, state.audioPlaylist.length - 1), true);
    } else {
      el.mainAudioPlayer.pause();
      state.audioIndex = -1;
      setPlayingState(false);
    }
  } else if (state.audioIndex > index) {
    state.audioIndex--;
  }
  renderAudioPlaylist();
  saveSession();
}

// ============================================================
// VIDEO PLAYBACK LOGIC
// ============================================================
function loadVideoItem(index, autoPlay = true, seekTime = 0) {
  if (index < 0 || index >= state.videoPlaylist.length) return;

  state.videoIndex = index;
  state.lastActiveSection = 'video';
  const item = state.videoPlaylist[index];
  const streamUrl = getMediaStreamUrl(item.path);

  if (el.mainVideoPlayer.src !== streamUrl) {
    el.mainVideoPlayer.src = streamUrl;
  }
  el.mainVideoPlayer.volume = state.isMuted ? 0 : state.volume;
  el.mainVideoPlayer.playbackRate = state.speed;

  if (seekTime > 0) {
    applySeek(el.mainVideoPlayer, seekTime);
  } else {
    isSeekingPending = false;
    el.mainVideoPlayer.currentTime = 0;
    state.playbackPosition = 0;
  }

  el.videoTitleDisplay.textContent = item.name;
  el.videoHeaderTitle.textContent = item.name;
  el.videoQueueBadge.textContent = `${index + 1}/${state.videoPlaylist.length}`;

  renderVideoPlaylist();

  if (autoPlay) {
    el.mainVideoPlayer.play().then(() => {
      setPlayingState(true);
      if (seekTime > 0 && Math.abs(el.mainVideoPlayer.currentTime - seekTime) > 1.5) {
        applySeek(el.mainVideoPlayer, seekTime);
      }
    }).catch(e => {
      console.warn('Video play error:', e);
      setPlayingState(false);
    });
  } else {
    setPlayingState(false);
  }

  saveSession();
}

function renderVideoPlaylist() {
  const query = state.videoSearchQuery.toLowerCase().trim();
  state.videoFilteredPlaylist = state.videoPlaylist.filter(item =>
    item.name.toLowerCase().includes(query) || item.title.toLowerCase().includes(query)
  );

  el.videoPlaylistCountBadge.textContent = `${state.videoPlaylist.length} Videos`;
  el.videoQueueBadge.textContent = state.videoPlaylist.length > 0 ? `${state.videoIndex + 1}/${state.videoPlaylist.length}` : '0';
  el.videoPlaylistList.innerHTML = '';

  state.videoFilteredPlaylist.forEach(item => {
    const originalIndex = state.videoPlaylist.findIndex(p => p.id === item.id);
    const isActive = originalIndex === state.videoIndex;

    const div = document.createElement('div');
    div.className = `queue-item ${isActive ? 'active' : ''}`;
    div.innerHTML = `
      <div class="queue-index">${originalIndex + 1}</div>
      <div class="queue-info">
        <div class="queue-name">${item.name}</div>
        <div class="queue-sub">${item.size_formatted} • .${item.extension.toUpperCase()}</div>
      </div>
      <button class="queue-delete" title="Quitar de la cola">&times;</button>
    `;

    div.querySelector('.queue-info').addEventListener('click', () => {
      loadVideoItem(originalIndex, true);
    });

    div.querySelector('.queue-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      removeVideoItem(originalIndex);
    });

    el.videoPlaylistList.appendChild(div);
  });
}

function removeVideoItem(index) {
  if (index < 0 || index >= state.videoPlaylist.length) return;
  state.videoPlaylist.splice(index, 1);
  if (state.videoIndex === index) {
    if (state.videoPlaylist.length > 0) {
      loadVideoItem(Math.min(index, state.videoPlaylist.length - 1), true);
    } else {
      el.mainVideoPlayer.pause();
      state.videoIndex = -1;
      setPlayingState(false);
    }
  } else if (state.videoIndex > index) {
    state.videoIndex--;
  }
  renderVideoPlaylist();
  saveSession();
}

// ============================================================
// PLAYBACK CONTROLS (PLAY/PAUSE/SEEK/VOLUME)
// ============================================================
function getCurrentPlayer() {
  return state.currentSection === 'video' ? el.mainVideoPlayer : el.mainAudioPlayer;
}

let playPromise = null;

function updateAudioPlaylistActiveState(isPlaying) {
  const items = el.audioPlaylistList.querySelectorAll('.queue-item');
  items.forEach((item, idx) => {
    const isActive = idx === state.audioIndex;
    const eqContainer = item.querySelector('.queue-index');
    if (isActive) {
      item.classList.add('active');
      if (eqContainer) {
        eqContainer.innerHTML = isPlaying ? `
          <div class="eq-bars">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
        ` : `${idx + 1}`;
      }
    } else {
      item.classList.remove('active');
      if (eqContainer) {
        eqContainer.textContent = `${idx + 1}`;
      }
    }
  });
}

function setPlayingState(isPlaying) {
  state.isPlaying = isPlaying;

  const playIcon = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  const pauseIcon = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';

  el.barPlayPauseIcon.innerHTML = isPlaying ? pauseIcon : playIcon;
  el.videoPlayPauseIcon.innerHTML = isPlaying ? pauseIcon : playIcon;

  if (isPlaying && state.currentSection === 'audio') {
    el.vinylDisc.classList.add('spinning');
    el.vinylWrap.classList.add('playing');
  } else {
    el.vinylDisc.classList.remove('spinning');
    el.vinylWrap.classList.remove('playing');
  }

  if (state.currentSection === 'audio') {
    updateAudioPlaylistActiveState(isPlaying);
  } else if (state.currentSection === 'video') {
    resetHudTimer();
  }
}

async function togglePlayPause() {
  const player = getCurrentPlayer();
  if (!player.src) {
    if (state.currentSection === 'audio' && state.audioPlaylist.length > 0) {
      loadAudioItem(state.audioIndex >= 0 ? state.audioIndex : 0, true);
    } else if (state.currentSection === 'video' && state.videoPlaylist.length > 0) {
      loadVideoItem(state.videoIndex >= 0 ? state.videoIndex : 0, true);
    }
    return;
  }

  if (state.currentSection === 'audio') {
    setupAudioVisualizer();
  }

  if (player.paused) {
    // Instant visual feedback (0ms latency)
    setPlayingState(true);
    showSplashFeedback(true);

    try {
      playPromise = player.play();
      await playPromise;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Play error:', err);
      }
      setPlayingState(!player.paused);
    } finally {
      playPromise = null;
    }
  } else {
    // Instant visual feedback (0ms latency)
    setPlayingState(false);
    showSplashFeedback(false);

    if (playPromise) {
      try {
        await playPromise;
      } catch (_) {}
    }
    player.pause();
  }
}

function showSplashFeedback(isPlaying) {
  if (state.currentSection !== 'video' || !el.hudCenterSplash) return;
  const playIcon = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  const pauseIcon = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  el.hudCenterSplash.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${isPlaying ? playIcon : pauseIcon}</svg>`;
  el.hudCenterSplash.classList.remove('animate');
  void el.hudCenterSplash.offsetWidth; // Force instant reflow
  el.hudCenterSplash.classList.add('animate');
}

function playNext() {
  if (state.currentSection === 'audio') {
    if (state.audioPlaylist.length === 0) return;
    if (state.shuffle) {
      let rand = Math.floor(Math.random() * state.audioPlaylist.length);
      loadAudioItem(rand, true);
      return;
    }
    if (state.audioIndex + 1 < state.audioPlaylist.length) {
      loadAudioItem(state.audioIndex + 1, true);
    } else if (state.repeatMode === 'all') {
      loadAudioItem(0, true);
    } else {
      showToast('Fin de la cola de audio');
    }
  } else if (state.currentSection === 'video') {
    if (state.videoPlaylist.length === 0) return;
    if (state.videoIndex + 1 < state.videoPlaylist.length) {
      loadVideoItem(state.videoIndex + 1, true);
    } else if (state.repeatMode === 'all') {
      loadVideoItem(0, true);
    } else {
      showToast('Fin de la cola de video');
    }
  }
}

function playPrev() {
  const player = getCurrentPlayer();
  if (player.currentTime > 3) {
    player.currentTime = 0;
    return;
  }

  if (state.currentSection === 'audio') {
    if (state.audioPlaylist.length === 0) return;
    if (state.audioIndex > 0) {
      loadAudioItem(state.audioIndex - 1, true);
    } else if (state.repeatMode === 'all') {
      loadAudioItem(state.audioPlaylist.length - 1, true);
    }
  } else if (state.currentSection === 'video') {
    if (state.videoPlaylist.length === 0) return;
    if (state.videoIndex > 0) {
      loadVideoItem(state.videoIndex - 1, true);
    } else if (state.repeatMode === 'all') {
      loadVideoItem(state.videoPlaylist.length - 1, true);
    }
  }
}

function seekRelative(offset) {
  const player = getCurrentPlayer();
  if (!player.duration) return;
  player.currentTime = Math.max(0, Math.min(player.duration, player.currentTime + offset));
  showToast(offset > 0 ? `+${offset}s` : `${offset}s`);
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  const player = getCurrentPlayer();
  player.volume = state.isMuted ? 0 : state.volume;
  updateVolumeIcons();
  saveSession();
}

function setVolume(newVol) {
  state.volume = Math.max(0, Math.min(1, newVol));
  state.isMuted = false;
  const player = getCurrentPlayer();
  player.volume = state.volume;

  el.audioVolumeSlider.value = state.volume;
  el.videoVolumeSlider.value = state.volume;
  updateVolumeIcons();
  saveSession();
}

function updateVolumeIcons() {
  const highIcon = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
  const mutedIcon = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';

  const iconContent = (state.isMuted || state.volume === 0) ? mutedIcon : highIcon;
  el.audioMuteIcon.innerHTML = iconContent;
  el.videoMuteIcon.innerHTML = iconContent;
}

function cycleRepeat() {
  if (state.repeatMode === 'none') {
    state.repeatMode = 'all';
    el.btnRepeat.classList.add('active');
    showToast('Repetición: Toda la lista');
  } else if (state.repeatMode === 'all') {
    state.repeatMode = 'one';
    el.btnRepeat.classList.add('active');
    showToast('Repetición: Pista actual');
  } else {
    state.repeatMode = 'none';
    el.btnRepeat.classList.remove('active');
    showToast('Repetición: Desactivada');
  }
  saveSession();
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  if (state.shuffle) {
    el.btnShuffle.classList.add('active');
    showToast('Modo Aleatorio Activado');
  } else {
    el.btnShuffle.classList.remove('active');
    showToast('Modo Aleatorio Desactivado');
  }
  saveSession();
}

// ============================================================
// FILE & FOLDER OPERATIONS (SEPARATED AUDIO VS VIDEO)
// ============================================================
async function openAudioFiles(addToQueue = false) {
  if (!state.isTauri) return;
  try {
    const filePaths = await invoke('open_files_dialog', { filterType: 'audio' });
    if (!filePaths || filePaths.length === 0) return;

    const newItems = [];
    for (const filePath of filePaths) {
      const item = await invoke('scan_file', { filePath });
      newItems.push(item);
    }

    if (addToQueue) {
      state.audioPlaylist.push(...newItems);
      state.audioPlaylist = naturalSortItems(state.audioPlaylist, state.audioSortAsc);
      showToast(`Añadidas ${newItems.length} pistas a la cola`);
    } else {
      state.audioFolder = null;
      state.audioPlaylist = naturalSortItems(newItems, state.audioSortAsc);
      loadAudioItem(0, true);
      showToast(`Cargadas ${newItems.length} pistas de audio`);
    }

    renderAudioPlaylist();
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err}`);
  }
}

async function openAudioFolder() {
  if (!state.isTauri) return;
  try {
    const folderPath = await invoke('open_folder_dialog');
    if (!folderPath) return;

    state.audioFolder = folderPath;
    const items = await invoke('scan_folder', {
      folderPath,
      mediaType: 'audio',
    });

    if (items.length === 0) {
      showToast('No se encontraron archivos de audio en esa carpeta');
      return;
    }

    state.audioPlaylist = naturalSortItems(items, state.audioSortAsc);
    renderAudioPlaylist();
    loadAudioItem(0, true);
    showToast(`Cargadas ${items.length} canciones ordenadas naturalmente`);
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err}`);
  }
}

async function openVideoFiles(addToQueue = false) {
  if (!state.isTauri) return;
  try {
    const filePaths = await invoke('open_files_dialog', { filterType: 'video' });
    if (!filePaths || filePaths.length === 0) return;

    const newItems = [];
    for (const filePath of filePaths) {
      const item = await invoke('scan_file', { filePath });
      newItems.push(item);
    }

    if (addToQueue) {
      state.videoPlaylist.push(...newItems);
      state.videoPlaylist = naturalSortItems(state.videoPlaylist, state.videoSortAsc);
      showToast(`Añadidos ${newItems.length} videos a la cola`);
    } else {
      state.videoFolder = null;
      state.videoPlaylist = naturalSortItems(newItems, state.videoSortAsc);
      loadVideoItem(0, true);
      showToast(`Cargados ${newItems.length} videos`);
    }

    renderVideoPlaylist();
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err}`);
  }
}

async function openVideoFolder() {
  if (!state.isTauri) return;
  try {
    const folderPath = await invoke('open_folder_dialog');
    if (!folderPath) return;

    state.videoFolder = folderPath;
    const items = await invoke('scan_folder', {
      folderPath,
      mediaType: 'video',
    });

    if (items.length === 0) {
      showToast('No se encontraron archivos de video en esa carpeta');
      return;
    }

    // Natural sort: 1.mp4, 2.mp4 ... 10.mp4
    state.videoPlaylist = naturalSortItems(items, state.videoSortAsc);
    renderVideoPlaylist();
    loadVideoItem(0, true);
    showToast(`Cargados ${items.length} videos ordenados correctamente (1, 2, 3...)`);
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err}`);
  }
}

// ============================================================
// EVENT LISTENERS & SETUP
// ============================================================
function initEventListeners() {
  // Navigation from Home
  el.btnEnterAudio.addEventListener('click', () => goToSection('audio'));
  el.btnEnterVideo.addEventListener('click', () => goToSection('video'));
  el.cardEnterAudio.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    goToSection('audio');
  });
  el.cardEnterVideo.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    goToSection('video');
  });

  // Back to Home
  el.btnBackFromAudio.addEventListener('click', () => goToSection('home'));
  el.btnBackFromVideo.addEventListener('click', () => goToSection('home'));

  // Resume Session from Home
  el.btnResumeSession.addEventListener('click', restoreSession);

  // Audio Section Actions
  el.btnAudioOpenFiles.addEventListener('click', () => openAudioFiles(false));
  el.btnAudioOpenFolder.addEventListener('click', openAudioFolder);
  el.btnAudioAddToQueue.addEventListener('click', () => openAudioFiles(true));
  el.btnClearAudioPlaylist.addEventListener('click', () => {
    state.audioPlaylist = [];
    state.audioIndex = -1;
    el.mainAudioPlayer.pause();
    setPlayingState(false);
    renderAudioPlaylist();
    saveSession();
  });
  el.btnSortAudioQueue.addEventListener('click', () => {
    state.audioSortAsc = !state.audioSortAsc;
    state.audioPlaylist = naturalSortItems(state.audioPlaylist, state.audioSortAsc);
    renderAudioPlaylist();
    showToast(state.audioSortAsc ? 'Orden Natural (1, 2, 3...)' : 'Orden Invertido');
  });

  // Video Section Actions
  el.btnVideoOpenFiles.addEventListener('click', () => openVideoFiles(false));
  el.btnVideoOpenFolder.addEventListener('click', openVideoFolder);
  el.btnVideoAddToQueue.addEventListener('click', () => openVideoFiles(true));
  el.btnVideoQueueToggle.addEventListener('click', () => {
    el.videoPlaylistDrawer.classList.toggle('hidden');
  });
  el.btnCloseVideoDrawer.addEventListener('click', () => {
    el.videoPlaylistDrawer.classList.add('hidden');
  });
  el.btnClearVideoPlaylist.addEventListener('click', () => {
    state.videoPlaylist = [];
    state.videoIndex = -1;
    el.mainVideoPlayer.pause();
    setPlayingState(false);
    renderVideoPlaylist();
    saveSession();
  });
  el.btnSortVideoQueue.addEventListener('click', () => {
    state.videoSortAsc = !state.videoSortAsc;
    state.videoPlaylist = naturalSortItems(state.videoPlaylist, state.videoSortAsc);
    renderVideoPlaylist();
    showToast(state.videoSortAsc ? 'Orden Natural (1, 2, 3...)' : 'Orden Invertido');
  });

  // Search Filters
  el.audioPlaylistSearch.addEventListener('input', (e) => {
    state.audioSearchQuery = e.target.value;
    el.btnAudioSearchClear.classList.toggle('hidden', state.audioSearchQuery === '');
    renderAudioPlaylist();
  });
  el.btnAudioSearchClear.addEventListener('click', () => {
    state.audioSearchQuery = '';
    el.audioPlaylistSearch.value = '';
    el.btnAudioSearchClear.classList.add('hidden');
    renderAudioPlaylist();
  });
  el.videoPlaylistSearch.addEventListener('input', (e) => {
    state.videoSearchQuery = e.target.value;
    renderVideoPlaylist();
  });

  // Audio Playback Controls
  el.btnAudioPlayPause.addEventListener('click', togglePlayPause);
  el.btnAudioNext.addEventListener('click', playNext);
  el.btnAudioPrev.addEventListener('click', playPrev);
  el.btnShuffle.addEventListener('click', toggleShuffle);
  el.btnRepeat.addEventListener('click', cycleRepeat);
  el.btnAudioMute.addEventListener('click', toggleMute);
  el.audioVolumeSlider.addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));

  // Video Playback Controls
  el.btnVideoPlayPause.addEventListener('click', togglePlayPause);
  el.btnVideoNext.addEventListener('click', playNext);
  el.btnVideoPrev.addEventListener('click', playPrev);
  el.btnVideoSkipBack.addEventListener('click', () => seekRelative(-10));
  el.btnVideoSkipForward.addEventListener('click', () => seekRelative(10));
  el.btnVideoMute.addEventListener('click', toggleMute);
  el.videoVolumeSlider.addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));

  // Video Speed Selector
  el.btnSpeedMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    el.speedDropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => el.speedDropdown.classList.add('hidden'));

  el.speedDropdown.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const spd = parseFloat(btn.dataset.speed);
      state.speed = spd;
      getCurrentPlayer().playbackRate = spd;
      el.videoSpeedLabel.textContent = `${spd}x`;
      el.speedDropdown.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Fullscreen & PiP
  el.btnFullscreen.addEventListener('click', toggleFullscreen);
  el.btnPip.addEventListener('click', async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (el.mainVideoPlayer.requestPictureInPicture) {
      await el.mainVideoPlayer.requestPictureInPicture();
    }
  });

  el.cinemaContainer.addEventListener('mousemove', resetHudTimer);
  el.cinemaContainer.addEventListener('click', (e) => {
    if (e.target.closest('.video-hud') || e.target.closest('.video-playlist-drawer')) return;
    togglePlayPause();
  });
  el.cinemaContainer.addEventListener('dblclick', toggleFullscreen);

  // Scrubbing
  setupScrubbing(el.audioScrubContainer, el.audioScrubProgress, el.audioScrubThumb, el.mainAudioPlayer);
  setupScrubbing(el.videoScrubContainer, el.videoScrubProgress, el.videoScrubThumb, el.mainVideoPlayer, el.videoScrubTooltip);

  // Player Events
  [el.mainAudioPlayer, el.mainVideoPlayer].forEach(player => {
    player.addEventListener('timeupdate', () => {
      const cur = player.currentTime;
      const dur = player.duration || 0;

      // Ignore spurious timeupdate(0) during a pending seek
      if (isSeekingPending) {
        if (Math.abs(cur - pendingSeekTime) <= 1.0) {
          isSeekingPending = false;
        } else {
          return;
        }
      }

      // Only process timeupdate for the player of the active section
      const isVideoActive = state.currentSection === 'video' && player === el.mainVideoPlayer;
      const isAudioActive = state.currentSection === 'audio' && player === el.mainAudioPlayer;
      if (!isVideoActive && !isAudioActive) return;

      // Don't overwrite if cur and dur are 0 (unloaded)
      if (cur === 0 && dur === 0) return;

      state.playbackPosition = cur;
      state.duration = dur;
      const percent = dur > 0 ? (cur / dur) * 100 : 0;

      if (state.currentSection === 'audio') {
        el.audioCurrentTime.textContent = formatTime(cur);
        el.audioDurationTime.textContent = formatTime(dur);
        el.audioScrubProgress.style.width = `${percent}%`;
        el.audioScrubThumb.style.left = `${percent}%`;
      } else if (state.currentSection === 'video') {
        el.videoCurrentTime.textContent = formatTime(cur);
        el.videoDurationTime.textContent = formatTime(dur);
        el.videoScrubProgress.style.width = `${percent}%`;
        el.videoScrubThumb.style.left = `${percent}%`;

        if (player.buffered.length > 0) {
          const bufEnd = player.buffered.end(player.buffered.length - 1);
          el.videoScrubBuffer.style.width = `${(bufEnd / dur) * 100}%`;
        }
      }

      // Throttle saving session every 1.5 seconds so cached time is always fresh
      if (Math.abs(cur - (state.lastSavedPos || 0)) >= 1.5) {
        state.lastSavedPos = cur;
        saveSession();
      }
    });

    player.addEventListener('ended', () => {
      if (state.repeatMode === 'one') {
        player.currentTime = 0;
        player.play();
      } else {
        playNext();
      }
    });

    player.addEventListener('play', () => setPlayingState(true));
    player.addEventListener('pause', () => {
      setPlayingState(false);
      saveSession();
    });
  });

  // Shortcuts
  el.btnShortcuts.addEventListener('click', () => el.shortcutsModal.classList.remove('hidden'));
  el.btnCloseShortcuts.addEventListener('click', () => el.shortcutsModal.classList.add('hidden'));
  el.shortcutsModal.addEventListener('click', (e) => {
    if (e.target === el.shortcutsModal) el.shortcutsModal.classList.add('hidden');
  });

  window.addEventListener('keydown', handleKeyboardShortcuts);
}

function setupScrubbing(container, progressBar, thumb, player, tooltip = null) {
  let isDragging = false;

  function updateScrub(e) {
    const rect = container.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (player.duration || 0);

    progressBar.style.width = `${pos * 100}%`;
    thumb.style.left = `${pos * 100}%`;

    if (tooltip) {
      tooltip.style.left = `${pos * 100}%`;
      tooltip.textContent = formatTime(targetTime);
    }

    if (isDragging) {
      player.currentTime = targetTime;
      state.playbackPosition = targetTime;
    }
  }

  container.addEventListener('mousemove', (e) => {
    if (tooltip && !isDragging) {
      const rect = container.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      tooltip.style.left = `${pos * 100}%`;
      tooltip.textContent = formatTime(pos * (player.duration || 0));
    }
  });

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateScrub(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) updateScrub(e);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      state.playbackPosition = player.currentTime;
      saveSession();
    }
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    el.cinemaContainer.requestFullscreen().catch(err => console.warn(err));
  } else {
    document.exitFullscreen().catch(err => console.warn(err));
  }
}

function handleKeyboardShortcuts(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlayPause();
      break;
    case 'ArrowRight':
      e.preventDefault();
      seekRelative(e.shiftKey ? 10 : 5);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      seekRelative(e.shiftKey ? -10 : -5);
      break;
    case 'ArrowUp':
      e.preventDefault();
      setVolume(state.volume + 0.05);
      break;
    case 'ArrowDown':
      e.preventDefault();
      setVolume(state.volume - 0.05);
      break;
    case 'KeyM':
      toggleMute();
      break;
    case 'KeyF':
      if (state.currentSection === 'video') toggleFullscreen();
      break;
    case 'KeyN':
      playNext();
      break;
    case 'KeyP':
      playPrev();
      break;
    case 'KeyL':
      cycleRepeat();
      break;
    case 'KeyS':
      toggleShuffle();
      break;
    case 'Escape':
      el.shortcutsModal.classList.add('hidden');
      el.videoPlaylistDrawer.classList.add('hidden');
      break;
  }
}

// ============================================================
// INITIALIZATION
// ============================================================
async function init() {
  initEventListeners();
  setupVideoAmbient();

  if (state.isTauri) {
    try {
      const port = await invoke('get_stream_port');
      if (port) state.streamPort = port;
    } catch (e) {
      console.warn('Error obteniendo puerto:', e);
    }
  }

  await loadSession();

  window.addEventListener('beforeunload', () => saveSession());
  window.addEventListener('pagehide', () => saveSession());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveSession();
  });
}

window.addEventListener('DOMContentLoaded', init);
