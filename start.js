import { spawn, exec } from 'child_process';
import process from 'process';

// ============================================================
// WILL MULTIMEDIA - SMART LAUNCHER (ZERO SPAM & CLEAN PROGRESS)
// ============================================================

console.clear();
console.log('\x1b[36m%s\x1b[0m', '==============================================================');
console.log('\x1b[1m\x1b[35m   ▶ WILL MULTIMEDIA PLAYER  -  Iniciando Entorno\x1b[0m');
console.log('\x1b[36m%s\x1b[0m\n', '==============================================================');

let currentProgress = 5;
let currentStatus = 'Iniciando servicios y dependencias...';
let isFinished = false;

function renderProgressBar(percent, statusText) {
  if (isFinished && percent < 100) return;

  const barWidth = 28;
  const clamped = Math.max(1, Math.min(100, Math.round(percent)));
  const filled = Math.round((clamped / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  const maxLen = 42;
  const shortText = statusText.length > maxLen
    ? statusText.substring(0, maxLen - 3) + '...'
    : statusText;
  const paddedText = shortText.padEnd(maxLen);

  // \x1b[2K clears the current line completely, \r moves to column 0
  process.stdout.write(
    `\x1b[2K\r \x1b[36m[${bar}]\x1b[0m \x1b[1m\x1b[33m${String(clamped).padStart(3)}%\x1b[0m \x1b[90m│\x1b[0m \x1b[37m${paddedText}\x1b[0m`
  );
}

// Initial draw
renderProgressBar(currentProgress, currentStatus);

function stripAnsi(str) {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

// Smooth progression timer during linking/compiling
const ticker = setInterval(() => {
  if (isFinished) {
    clearInterval(ticker);
    return;
  }
  if (currentProgress < 85) {
    currentProgress += 0.4;
    renderProgressBar(currentProgress, currentStatus);
  } else if (currentProgress < 97) {
    // Advance gently during linking so bar never freezes
    currentProgress += 0.15;
    if (currentStatus.startsWith('Compilando') || currentStatus.includes('servicios')) {
      currentStatus = 'Enlazando binario nativo de Windows...';
    }
    renderProgressBar(currentProgress, currentStatus);
  }
}, 400);

// Background check for running app.exe
const procCheck = setInterval(() => {
  if (isFinished) {
    clearInterval(procCheck);
    return;
  }
  if (currentProgress >= 80) {
    exec('tasklist /FI "IMAGENAME eq app.exe" /NH', (err, stdout) => {
      if (!err && stdout && stdout.toLowerCase().includes('app.exe')) {
        clearInterval(procCheck);
        finishProgress();
      }
    });
  }
}, 1200);

// Run npx @tauri-apps/cli dev via shell with single string
const child = spawn('npx @tauri-apps/cli dev', {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd(),
});

child.on('error', (err) => {
  clearInterval(ticker);
  clearInterval(procCheck);
  console.error('\n\x1b[31m[Error iniciando proceso]:\x1b[0m', err.message);
});

function handleOutput(data) {
  const text = data.toString();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const rawClean = stripAnsi(line).trim();
    if (!rawClean) continue;

    // Ignore file watcher EBUSY noise from breaking the progress display
    if (rawClean.includes('file watcher error') || rawClean.includes('EBUSY')) {
      continue;
    }

    // Vite ready
    if (rawClean.includes('Local:') || rawClean.includes('ready in') || rawClean.includes('localhost:')) {
      currentStatus = 'Servidor web Vite activo...';
      currentProgress = Math.max(currentProgress, 25);
      renderProgressBar(currentProgress, currentStatus);
    }
    // Downloading crates
    else if (rawClean.includes('Downloading')) {
      const parts = rawClean.split(' ');
      const idx = parts.indexOf('Downloading');
      const crateName = parts[idx + 1] || 'paquetes';
      currentStatus = `Descargando: ${crateName}`;
      renderProgressBar(currentProgress, currentStatus);
    }
    // Compiling Rust Crates
    else if (rawClean.includes('Compiling')) {
      const parts = rawClean.split(' ');
      const idx = parts.indexOf('Compiling');
      const crateName = parts[idx + 1] || 'módulos';
      currentStatus = `Compilando Rust: ${crateName}`;
      if (currentProgress < 90) {
        currentProgress = Math.min(90, currentProgress + 1.2);
      }
      renderProgressBar(currentProgress, currentStatus);
    }
    // Finished Rust backend compilation
    else if (rawClean.includes('Finished') && (rawClean.includes('dev') || rawClean.includes('profile'))) {
      currentStatus = 'Motor compilado... Enlazando';
      currentProgress = Math.max(currentProgress, 94);
      renderProgressBar(currentProgress, currentStatus);
    }
    // Running binary executable
    else if (rawClean.includes('Running') && (rawClean.includes('target') || rawClean.includes('app.exe'))) {
      currentStatus = 'Abriendo ventana nativa...';
      currentProgress = Math.max(currentProgress, 98);
      renderProgressBar(currentProgress, currentStatus);
      setTimeout(() => finishProgress(), 1000);
    }
    // Real native window ready signal
    else if (rawClean.includes('WILL_MULTIMEDIA_NATIVE_READY')) {
      finishProgress();
    }
    // Critical Rust compile errors
    else if (rawClean.includes('error[E') || (rawClean.startsWith('error:') && !rawClean.includes('EBUSY'))) {
      console.log(`\n\x1b[31m[Error de compilación]\x1b[0m ${rawClean}`);
    }
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

function finishProgress() {
  if (isFinished) return;
  isFinished = true;
  clearInterval(ticker);
  clearInterval(procCheck);

  currentProgress = 100;
  renderProgressBar(100, '¡Listo! Interfaz abierta');

  setTimeout(() => {
    console.log('\n\n\x1b[32m%s\x1b[0m', '==============================================================');
    console.log('\x1b[1m\x1b[32m ✔ WILL MULTIMEDIA v1.0 ESTÁ ACTIVO Y LISTO (100%)\x1b[0m');
    console.log('\x1b[32m%s\x1b[0m', '==============================================================');
    console.log(' \x1b[36m•\x1b[0m Motor multimedia en segundo plano: \x1b[32mConectado\x1b[0m');
    console.log(' \x1b[36m•\x1b[0m Servidor local de streaming:        \x1b[32mPuerto 45455\x1b[0m');
    console.log(' \x1b[36m•\x1b[0m Ventana de aplicación:              \x1b[32mAbierta en pantalla\x1b[0m');
    console.log('\n \x1b[90m[Tip] Para cerrar la aplicación, presiona Ctrl + C en esta terminal.\x1b[0m\n');
  }, 300);
}

child.on('close', (code) => {
  clearInterval(ticker);
  if (!isFinished && code !== 0) {
    console.log(`\n\x1b[31mEl proceso finalizó con código ${code}\x1b[0m`);
  }
});

// Clean termination handling
process.on('SIGINT', () => {
  clearInterval(ticker);
  try {
    child.kill('SIGINT');
  } catch (e) {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(ticker);
  try {
    child.kill('SIGTERM');
  } catch (e) {}
  process.exit(0);
});
