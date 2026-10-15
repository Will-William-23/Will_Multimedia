import { spawn } from 'child_process';
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

// Smooth progression timer during linking/compiling
const ticker = setInterval(() => {
  if (isFinished) {
    clearInterval(ticker);
    return;
  }
  if (currentProgress < 85) {
    currentProgress += 0.3;
    renderProgressBar(currentProgress, currentStatus);
  }
}, 400);

// Run npx @tauri-apps/cli dev via shell with single string (avoids DEP0190 and EINVAL on Node 22/24)
const child = spawn('npx @tauri-apps/cli dev', {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd(),
});

child.on('error', (err) => {
  clearInterval(ticker);
  console.error('\n\x1b[31m[Error iniciando proceso]:\x1b[0m', err.message);
});

function handleOutput(data) {
  const text = data.toString();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Ignore file watcher EBUSY noise from breaking the progress display
    if (trimmed.includes('file watcher error') || trimmed.includes('EBUSY')) {
      continue;
    }

    // Vite ready
    if (trimmed.includes('Local:') || trimmed.includes('ready in')) {
      currentStatus = 'Servidor web Vite activo...';
      currentProgress = Math.max(currentProgress, 25);
      renderProgressBar(currentProgress, currentStatus);
    }
    // Downloading crates
    else if (trimmed.startsWith('Downloading ')) {
      const parts = trimmed.split(' ');
      const crateName = parts[1] || 'paquete';
      currentStatus = `Descargando: ${crateName}`;
      renderProgressBar(currentProgress, currentStatus);
    }
    // Compiling Rust Crates
    else if (trimmed.startsWith('Compiling ')) {
      const parts = trimmed.split(' ');
      const crateName = parts[1] || 'motor';
      currentStatus = `Compilando Rust: ${crateName}`;
      if (currentProgress < 88) {
        currentProgress = Math.min(88, currentProgress + 0.8);
      }
      renderProgressBar(currentProgress, currentStatus);
    }
    // Finished Rust backend compilation
    else if (trimmed.includes('Finished dev') || trimmed.includes('Finished `dev`')) {
      currentStatus = 'Motor Rust compilado... Enlazando';
      currentProgress = Math.max(currentProgress, 92);
      renderProgressBar(currentProgress, currentStatus);
    }
    // Running binary executable
    else if (trimmed.includes('Running target') || trimmed.includes('Running `target')) {
      currentStatus = 'Abriendo ventana nativa...';
      currentProgress = Math.max(currentProgress, 96);
      renderProgressBar(currentProgress, currentStatus);
      setTimeout(() => finishProgress(), 1500);
    }
    // Real native window ready signal
    else if (trimmed.includes('WILL_MULTIMEDIA_NATIVE_READY')) {
      finishProgress();
    }
    // Critical Rust compile errors
    else if (trimmed.includes('error[E') || (trimmed.startsWith('error:') && !trimmed.includes('EBUSY'))) {
      console.log(`\n\x1b[31m[Error de compilación]\x1b[0m ${trimmed}`);
    }
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

function finishProgress() {
  if (isFinished) return;
  isFinished = true;
  clearInterval(ticker);

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
