import { invoke, convertFileSrc } from '@tauri-apps/api/core';

// ============================================================
// APPLICATION STATE
// ============================================================
const state = {
  streamPort: 45455,
  currentSection: 'home', // 'home' | 'audio' | 'video' | 'image'

  // Dedicated Queues
  audioPlaylist: [],
  audioFilteredPlaylist: [],
  audioIndex: -1,
  audioFolder: null,

  videoPlaylist: [],
  videoFilteredPlaylist: [],
  videoIndex: -1,
  videoFolder: null,

  // Dedicated Images Queue
  imagePlaylist: [],
  imageIndex: -1,
  imageFolder: null,
  imageZoom: 1.0,
  imageRotation: 0,
  imageFlipH: 1,
  imagePanX: 0,
  imagePanY: 0,
  isPanningImage: false,
  panStartX: 0,
  panStartY: 0,
  isSlideshowActive: false,
  slideshowTimer: null,

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

  lastActiveSection: 'video', // 'video' | 'audio' | 'image'
  lastSavedPos: 0,

  isTauri: typeof window.__TAURI_INTERNALS__ !== 'undefined',
  cachedSession: null,

  // Editor State
  activeEditorMode: null, // 'image' | 'video' | 'audio'
  editorImageCanvas: null,
  editorImageSource: null,
  editorCropMode: 'original',
  editorImgRotation: 0,
  editorImgFlipH: 1,
  editorFilters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
  },
  editorAudioBuffer: null,
  editorAudioCtx: null,
  editorAudioSourceNode: null,
  editorAudioIsPlaying: false,

  // iPhone Trimmer State
  videoTrimStartVal: 0,
  videoTrimEndVal: 0,
  audioTrimStartVal: 0,
  audioTrimEndVal: 0,
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
  headerImage: document.getElementById('headerImage'),
  btnShortcuts: document.getElementById('btnShortcuts'),
  btnBackFromAudio: document.getElementById('btnBackFromAudio'),
  btnBackFromVideo: document.getElementById('btnBackFromVideo'),
  btnBackFromImage: document.getElementById('btnBackFromImage'),
  audioHeaderFolder: document.getElementById('audioHeaderFolder'),
  videoHeaderTitle: document.getElementById('videoHeaderTitle'),
  imageHeaderTitle: document.getElementById('imageHeaderTitle'),

  // Header Actions
  btnAudioOpenFiles: document.getElementById('btnAudioOpenFiles'),
  btnAudioOpenFolder: document.getElementById('btnAudioOpenFolder'),
  btnAudioAddToQueue: document.getElementById('btnAudioAddToQueue'),
  btnAudioEdit: document.getElementById('btnAudioEdit'),

  btnVideoOpenFiles: document.getElementById('btnVideoOpenFiles'),
  btnVideoOpenFolder: document.getElementById('btnVideoOpenFolder'),
  btnVideoAddToQueue: document.getElementById('btnVideoAddToQueue'),
  btnVideoEdit: document.getElementById('btnVideoEdit'),
  btnHudVideoEdit: document.getElementById('btnHudVideoEdit'),
  btnVideoQueueToggle: document.getElementById('btnVideoQueueToggle'),
  videoQueueBadge: document.getElementById('videoQueueBadge'),

  btnImageOpenFiles: document.getElementById('btnImageOpenFiles'),
  btnImageOpenFolder: document.getElementById('btnImageOpenFolder'),
  btnImageEdit: document.getElementById('btnImageEdit'),

  // Views
  homeView: document.getElementById('homeView'),
  audioView: document.getElementById('audioView'),
  videoView: document.getElementById('videoView'),
  imageView: document.getElementById('imageView'),

  // Home Screen Elements
  btnEnterAudio: document.getElementById('btnEnterAudio'),
  btnEnterVideo: document.getElementById('btnEnterVideo'),
  btnEnterImage: document.getElementById('btnEnterImage'),
  cardEnterAudio: document.getElementById('cardEnterAudio'),
  cardEnterVideo: document.getElementById('cardEnterVideo'),
  cardEnterImage: document.getElementById('cardEnterImage'),
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

  // Image View Elements
  btnImagePrev: document.getElementById('btnImagePrev'),
  btnImageNext: document.getElementById('btnImageNext'),
  imageCounterBadge: document.getElementById('imageCounterBadge'),
  btnImageSlideshow: document.getElementById('btnImageSlideshow'),
  imageSlideshowIcon: document.getElementById('imageSlideshowIcon'),
  imageSlideshowBadge: document.getElementById('imageSlideshowBadge'),
  btnImageZoomIn: document.getElementById('btnImageZoomIn'),
  btnImageZoomOut: document.getElementById('btnImageZoomOut'),
  btnImageResetZoom: document.getElementById('btnImageResetZoom'),
  imageZoomLabel: document.getElementById('imageZoomLabel'),
  btnImageRotateLeft: document.getElementById('btnImageRotateLeft'),
  btnImageRotateRight: document.getElementById('btnImageRotateRight'),
  btnImageFlipH: document.getElementById('btnImageFlipH'),
  btnImageStageEdit: document.getElementById('btnImageStageEdit'),
  imageViewport: document.getElementById('imageViewport'),
  imageCanvasContainer: document.getElementById('imageCanvasContainer'),
  mainImageDisplay: document.getElementById('mainImageDisplay'),
  imageEmptyPlaceholder: document.getElementById('imageEmptyPlaceholder'),
  imageFilmstripBar: document.getElementById('imageFilmstripBar'),
  imageFilmstripList: document.getElementById('imageFilmstripList'),

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

  // Editors Modal
  editorModal: document.getElementById('editorModal'),
  btnCloseEditorModal: document.getElementById('btnCloseEditorModal'),
  editorModalTitle: document.getElementById('editorModalTitle'),
  editorBadgeType: document.getElementById('editorBadgeType'),
  editorImagePanel: document.getElementById('editorImagePanel'),
  editorVideoPanel: document.getElementById('editorVideoPanel'),
  editorAudioPanel: document.getElementById('editorAudioPanel'),

  // Image Editor Controls
  imageEditorCanvas: document.getElementById('imageEditorCanvas'),
  btnEditorRotL: document.getElementById('btnEditorRotL'),
  btnEditorRotR: document.getElementById('btnEditorRotR'),
  btnEditorFlipH: document.getElementById('btnEditorFlipH'),
  filterBrightness: document.getElementById('filterBrightness'),
  filterContrast: document.getElementById('filterContrast'),
  filterSaturation: document.getElementById('filterSaturation'),
  filterGrayscale: document.getElementById('filterGrayscale'),
  filterSepia: document.getElementById('filterSepia'),
  valBrightness: document.getElementById('valBrightness'),
  valContrast: document.getElementById('valContrast'),
  valSaturation: document.getElementById('valSaturation'),
  valGrayscale: document.getElementById('valGrayscale'),
  valSepia: document.getElementById('valSepia'),
  btnResetImageFilter: document.getElementById('btnResetImageFilter'),
  btnSaveDirectImage: document.getElementById('btnSaveDirectImage'),
  btnSaveEditedImage: document.getElementById('btnSaveEditedImage'),

  // iPhone Video Trimmer Controls
  videoEditorPreview: document.getElementById('videoEditorPreview'),
  btnOverlayVideoPlay: document.getElementById('btnOverlayVideoPlay'),
  overlayVideoPlayIcon: document.getElementById('overlayVideoPlayIcon'),
  videoTrimStartBadge: document.getElementById('videoTrimStartBadge'),
  videoTrimEndBadge: document.getElementById('videoTrimEndBadge'),
  btnPreviewVideoClip: document.getElementById('btnPreviewVideoClip'),
  videoClipPlayIcon: document.getElementById('videoClipPlayIcon'),
  videoClipPlayText: document.getElementById('videoClipPlayText'),
  videoTimelineTrack: document.getElementById('videoTimelineTrack'),
  videoTrimFrame: document.getElementById('videoTrimFrame'),
  videoHandleLeft: document.getElementById('videoHandleLeft'),
  videoHandleRight: document.getElementById('videoHandleRight'),
  videoPlayhead: document.getElementById('videoPlayhead'),
  videoDimLeft: document.getElementById('videoDimLeft'),
  videoDimRight: document.getElementById('videoDimRight'),
  btnVideoStartMinus: document.getElementById('btnVideoStartMinus'),
  btnVideoStartPlus: document.getElementById('btnVideoStartPlus'),
  btnVideoEndMinus: document.getElementById('btnVideoEndMinus'),
  btnVideoEndPlus: document.getElementById('btnVideoEndPlus'),
  videoTrimDuration: document.getElementById('videoTrimDuration'),
  videoTrimStart: document.getElementById('videoTrimStart'),
  videoTrimEnd: document.getElementById('videoTrimEnd'),
  btnSaveDirectVideo: document.getElementById('btnSaveDirectVideo'),
  btnSaveEditedVideo: document.getElementById('btnSaveEditedVideo'),

  // iPhone Audio Trimmer Controls
  audioEditorWaveform: document.getElementById('audioEditorWaveform'),
  audioTrimStartBadge: document.getElementById('audioTrimStartBadge'),
  audioTrimEndBadge: document.getElementById('audioTrimEndBadge'),
  btnPreviewAudioClip: document.getElementById('btnPreviewAudioClip'),
  audioClipPlayIcon: document.getElementById('audioClipPlayIcon'),
  audioClipPlayText: document.getElementById('audioClipPlayText'),
  audioTimelineTrack: document.getElementById('audioTimelineTrack'),
  audioTrimFrame: document.getElementById('audioTrimFrame'),
  audioHandleLeft: document.getElementById('audioHandleLeft'),
  audioHandleRight: document.getElementById('audioHandleRight'),
  audioPlayhead: document.getElementById('audioPlayhead'),
  audioDimLeft: document.getElementById('audioDimLeft'),
  audioDimRight: document.getElementById('audioDimRight'),
  btnAudioStartMinus: document.getElementById('btnAudioStartMinus'),
  btnAudioStartPlus: document.getElementById('btnAudioStartPlus'),
  btnAudioEndMinus: document.getElementById('btnAudioEndMinus'),
  btnAudioEndPlus: document.getElementById('btnAudioEndPlus'),
  audioTrimDuration: document.getElementById('audioTrimDuration'),
  audioTrimStart: document.getElementById('audioTrimStart'),
  audioTrimEnd: document.getElementById('audioTrimEnd'),
  audioFadeIn: document.getElementById('audioFadeIn'),
  audioFadeOut: document.getElementById('audioFadeOut'),
  btnSaveDirectAudio: document.getElementById('btnSaveDirectAudio'),
  btnSaveEditedAudio: document.getElementById('btnSaveEditedAudio'),
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
// ============================================================
// AUDIO VISUALIZER (DYNAMIC SPECTRUM RHYTHM - OPTIMIZED)
// ============================================================
let animFrameId = null;

function pauseAudioVisualizer() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

function drawStaticVisualizer() {
  const canvas = el.visualizerCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const barCount = 36;
  const barWidth = (canvas.width / barCount) - 3;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
  grad.addColorStop(0, '#06b6d4');
  grad.addColorStop(0.5, '#3b82f6');
  grad.addColorStop(1, '#8b5cf6');

  ctx.fillStyle = grad;
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(6, 182, 212, 0.35)';

  let x = 2;
  for (let i = 0; i < barCount; i++) {
    const percent = Math.sin(i * 0.25) * 0.10 + 0.15;
    const barHeight = Math.max(4, percent * (canvas.height - 8));
    ctx.beginPath();
    ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
    ctx.fill();
    x += barWidth + 3;
  }
}

function setupAudioVisualizer() {
  if (state.currentSection !== 'audio') {
    pauseAudioVisualizer();
    return;
  }
  if (!state.isPlaying) {
    pauseAudioVisualizer();
    drawStaticVisualizer();
    return;
  }
  if (animFrameId) return;
  renderVisualizer();
}

function renderVisualizer() {
  const canvas = el.visualizerCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const barCount = 36;
  const barWidth = (canvas.width / barCount) - 3;

  // Cache gradient outside the animation loop to eliminate garbage collection pressure
  const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
  grad.addColorStop(0, '#06b6d4');
  grad.addColorStop(0.5, '#3b82f6');
  grad.addColorStop(1, '#8b5cf6');

  function draw() {
    if (state.currentSection !== 'audio' || !state.isPlaying) {
      pauseAudioVisualizer();
      if (state.currentSection === 'audio') drawStaticVisualizer();
      return;
    }

    animFrameId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();
    let x = 2;

    ctx.fillStyle = grad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.45)';

    for (let i = 0; i < barCount; i++) {
      const baseFreq = Math.sin((now / 180) + (i * 0.45)) * 0.35 + 0.45;
      const beatPulse = Math.pow(Math.sin(now / 350), 4) * 0.4;
      const curve = 1.0 - Math.abs((i - (barCount * 0.35)) / (barCount * 0.7));
      const percent = Math.max(0.08, Math.min(0.95, (baseFreq + beatPulse) * curve));
      const barHeight = Math.max(4, percent * (canvas.height - 8));

      ctx.beginPath();
      ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
      ctx.fill();

      x += barWidth + 3;
    }
  }

  animFrameId = requestAnimationFrame(draw);
}


// ============================================================
// VIDEO AMBIENT LIGHTING & HUD TIMER
// ============================================================
let ambientCanvasCtx = null;
let videoAmbientInterval = null;
let hudTimeout = null;

function startVideoAmbient() {
  if (state.currentSection !== 'video' || !state.isPlaying || el.mainVideoPlayer.paused) {
    stopVideoAmbient();
    return;
  }
  if (!el.ambientVideoCanvas) return;
  if (!ambientCanvasCtx) {
    ambientCanvasCtx = el.ambientVideoCanvas.getContext('2d');
    el.ambientVideoCanvas.width = 64;
    el.ambientVideoCanvas.height = 36;
  }

  if (videoAmbientInterval) return;
  videoAmbientInterval = setInterval(() => {
    if (state.currentSection === 'video' && state.isPlaying && !el.mainVideoPlayer.paused) {
      try {
        ambientCanvasCtx.drawImage(el.mainVideoPlayer, 0, 0, 64, 36);
      } catch (err) {
        // Ignored
      }
    } else {
      stopVideoAmbient();
    }
  }, 150);
}

function stopVideoAmbient() {
  if (videoAmbientInterval) {
    clearInterval(videoAmbientInterval);
    videoAmbientInterval = null;
  }
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

  if (state.currentSection === 'image' && targetSection !== 'image') {
    stopImageSlideshow();
  }

  state.currentSection = targetSection;

  if (targetSection === 'home') {
    pauseAudioVisualizer();
    stopVideoAmbient();
    // Show Home
    el.headerHome.classList.remove('hidden');
    el.headerAudio.classList.add('hidden');
    el.headerVideo.classList.add('hidden');
    el.headerImage.classList.add('hidden');

    el.homeView.classList.remove('hidden');
    el.audioView.classList.add('hidden');
    el.videoView.classList.add('hidden');
    el.imageView.classList.add('hidden');
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
    stopVideoAmbient();
    state.lastActiveSection = 'audio';
    // Pause video cleanly
    el.mainVideoPlayer.pause();

    // Show Audio Section
    el.headerHome.classList.add('hidden');
    el.headerAudio.classList.remove('hidden');
    el.headerVideo.classList.add('hidden');
    el.headerImage.classList.add('hidden');

    el.homeView.classList.add('hidden');
    el.audioView.classList.remove('hidden');
    el.videoView.classList.add('hidden');
    el.imageView.classList.add('hidden');
    el.bottomPlayerBar.classList.remove('hidden');
    el.ambientGlow.classList.remove('video-mode');

    setupAudioVisualizer();
    renderAudioPlaylist();

    // If queue has items and none playing, play current or first
    if (loadMedia && !el.mainAudioPlayer.src && state.audioPlaylist.length > 0 && state.audioIndex >= 0) {
      loadAudioItem(state.audioIndex, false, state.playbackPosition);
    }

  } else if (targetSection === 'video') {
    pauseAudioVisualizer();
    state.lastActiveSection = 'video';
    // Pause audio cleanly
    el.mainAudioPlayer.pause();

    // Show Video Section
    el.headerHome.classList.add('hidden');
    el.headerAudio.classList.add('hidden');
    el.headerVideo.classList.remove('hidden');
    el.headerImage.classList.add('hidden');

    el.homeView.classList.add('hidden');
    el.audioView.classList.add('hidden');
    el.videoView.classList.remove('hidden');
    el.imageView.classList.add('hidden');
    el.bottomPlayerBar.classList.add('hidden');
    el.ambientGlow.classList.add('video-mode');

    renderVideoPlaylist();

    if (loadMedia && !el.mainVideoPlayer.src && state.videoPlaylist.length > 0 && state.videoIndex >= 0) {
      loadVideoItem(state.videoIndex, false, state.playbackPosition);
    }

    if (state.isPlaying) {
      startVideoAmbient();
    }
  } else if (targetSection === 'image') {
    pauseAudioVisualizer();
    stopVideoAmbient();
    el.mainAudioPlayer.pause();
    el.mainVideoPlayer.pause();
    setPlayingState(false);

    // Show Image Section
    el.headerHome.classList.add('hidden');
    el.headerAudio.classList.add('hidden');
    el.headerVideo.classList.add('hidden');
    el.headerImage.classList.remove('hidden');

    el.homeView.classList.add('hidden');
    el.audioView.classList.add('hidden');
    el.videoView.classList.add('hidden');
    el.imageView.classList.remove('hidden');
    el.bottomPlayerBar.classList.add('hidden');
    el.ambientGlow.classList.remove('video-mode');

    renderImageFilmstrip();

    if (loadMedia && state.imagePlaylist.length > 0 && state.imageIndex >= 0) {
      loadImageItem(state.imageIndex);
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
    imagePlaylist: state.imagePlaylist,
    imageIndex: state.imageIndex,
    imageFolder: state.imageFolder,
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
      if (data.imagePlaylist) state.imagePlaylist = data.imagePlaylist;
      state.audioIndex = data.audioIndex ?? -1;
      state.videoIndex = data.videoIndex ?? -1;
      state.imageIndex = data.imageIndex ?? -1;
      state.audioFolder = data.audioFolder;
      state.videoFolder = data.videoFolder;
      state.imageFolder = data.imageFolder;
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
  const fragment = document.createDocumentFragment();

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

    fragment.appendChild(div);
  });

  el.audioPlaylistList.appendChild(fragment);
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
  const fragment = document.createDocumentFragment();

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

    fragment.appendChild(div);
  });

  el.videoPlaylistList.appendChild(fragment);
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
    if (isPlaying) {
      setupAudioVisualizer();
    } else {
      pauseAudioVisualizer();
      drawStaticVisualizer();
    }
  } else if (state.currentSection === 'video') {
    resetHudTimer();
    if (isPlaying) {
      startVideoAmbient();
    } else {
      stopVideoAmbient();
    }
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

let splashTimeout = null;

function showSplashFeedback(isPlaying) {
  if (state.currentSection !== 'video' || !el.hudCenterSplash) return;
  const playIcon = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  const pauseIcon = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  el.hudCenterSplash.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${isPlaying ? playIcon : pauseIcon}</svg>`;
  el.hudCenterSplash.classList.remove('animate');
  void el.hudCenterSplash.offsetWidth; // Force instant reflow
  el.hudCenterSplash.classList.add('animate');

  if (splashTimeout) clearTimeout(splashTimeout);
  splashTimeout = setTimeout(() => {
    el.hudCenterSplash.classList.remove('animate');
  }, 450);
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
// IMAGE SECTION (VIEWER & GALLERY OPERATIONS)
// ============================================================
async function openImageFiles(addToQueue = false) {
  if (!state.isTauri) return;
  try {
    const filePaths = await invoke('open_files_dialog', { filterType: 'image' });
    if (!filePaths || filePaths.length === 0) return;

    const newItems = [];
    for (const filePath of filePaths) {
      const item = await invoke('scan_file', { filePath });
      newItems.push(item);
    }

    if (addToQueue) {
      state.imagePlaylist.push(...newItems);
      showToast(`Añadidas ${newItems.length} fotos`);
    } else {
      state.imageFolder = null;
      state.imagePlaylist = naturalSortItems(newItems, true);
      goToSection('image');
      loadImageItem(0);
      showToast(`Cargadas ${newItems.length} fotos`);
    }

    renderImageFilmstrip();
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err}`);
  }
}

async function openImageFolder() {
  if (!state.isTauri) return;
  try {
    const folderPath = await invoke('open_folder_dialog');
    if (!folderPath) return;

    state.imageFolder = folderPath;
    const items = await invoke('scan_folder', {
      folderPath,
      mediaType: 'image',
    });

    if (items.length === 0) {
      showToast('No se encontraron imágenes en esa carpeta');
      return;
    }

    state.imagePlaylist = naturalSortItems(items, true);
    goToSection('image');
    renderImageFilmstrip();
    loadImageItem(0);
    showToast(`Cargadas ${items.length} imágenes ordenadas naturalmente`);
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err}`);
  }
}

function loadImageItem(index) {
  if (index < 0 || index >= state.imagePlaylist.length) return;

  state.imageIndex = index;
  const item = state.imagePlaylist[index];
  const streamUrl = getMediaStreamUrl(item.path);

  // Fallback to native Tauri v2 convertFileSrc if loopback stream fails
  el.mainImageDisplay.onerror = () => {
    try {
      const assetUrl = convertFileSrc(item.path);
      if (el.mainImageDisplay.src !== assetUrl) {
        el.mainImageDisplay.src = assetUrl;
      }
    } catch (e) {
      console.warn('Fallback imagen error:', e);
    }
  };

  el.mainImageDisplay.onload = () => {
    el.mainImageDisplay.classList.remove('hidden');
    el.imageEmptyPlaceholder.classList.add('hidden');
  };

  el.mainImageDisplay.src = streamUrl;
  el.mainImageDisplay.classList.remove('hidden');
  el.imageEmptyPlaceholder.classList.add('hidden');

  el.imageHeaderTitle.textContent = item.name;
  el.imageCounterBadge.textContent = `${index + 1} / ${state.imagePlaylist.length}`;

  // Reset viewport transforms
  state.imageZoom = 1.0;
  state.imageRotation = 0;
  state.imageFlipH = 1;
  state.imagePanX = 0;
  state.imagePanY = 0;
  updateImageTransform();

  // Highlight active thumb in filmstrip
  const thumbs = el.imageFilmstripList.querySelectorAll('.filmstrip-thumb');
  thumbs.forEach((th, idx) => {
    th.classList.toggle('active', idx === index);
    if (idx === index) {
      th.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });

  saveSession();
}

function toggleImageSlideshow() {
  if (state.isSlideshowActive) {
    stopImageSlideshow();
  } else {
    startImageSlideshow();
  }
}

function startImageSlideshow() {
  if (state.imagePlaylist.length <= 1) {
    showToast('Abre más fotos para iniciar el pase de diapositivas');
    return;
  }
  state.isSlideshowActive = true;
  if (el.btnImageSlideshow) el.btnImageSlideshow.classList.add('active');
  if (el.imageSlideshowBadge) el.imageSlideshowBadge.classList.remove('hidden');
  if (el.imageSlideshowIcon) {
    el.imageSlideshowIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  }
  showToast('▶ Pase de fotos iniciado (cambio cada 3s)');

  if (state.slideshowTimer) clearInterval(state.slideshowTimer);
  state.slideshowTimer = setInterval(() => {
    if (state.currentSection !== 'image') {
      stopImageSlideshow();
      return;
    }
    nextImage();
  }, 3000);
}

function stopImageSlideshow() {
  state.isSlideshowActive = false;
  if (state.slideshowTimer) {
    clearInterval(state.slideshowTimer);
    state.slideshowTimer = null;
  }
  if (el.btnImageSlideshow) el.btnImageSlideshow.classList.remove('active');
  if (el.imageSlideshowBadge) el.imageSlideshowBadge.classList.add('hidden');
  if (el.imageSlideshowIcon) {
    el.imageSlideshowIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }
}

function updateImageTransform() {
  el.imageCanvasContainer.style.transform = `translate(${state.imagePanX}px, ${state.imagePanY}px) scale(${state.imageZoom}) rotate(${state.imageRotation}deg) scaleX(${state.imageFlipH})`;
  el.imageZoomLabel.textContent = `${Math.round(state.imageZoom * 100)}%`;
}

function renderImageFilmstrip() {
  el.imageFilmstripList.innerHTML = '';
  const fragment = document.createDocumentFragment();

  state.imagePlaylist.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = `filmstrip-thumb ${index === state.imageIndex ? 'active' : ''}`;
    div.title = item.name;
    const img = document.createElement('img');
    img.src = getMediaStreamUrl(item.path);
    img.loading = 'lazy';
    img.draggable = false;
    div.appendChild(img);

    div.addEventListener('click', () => {
      loadImageItem(index);
    });

    fragment.appendChild(div);
  });

  el.imageFilmstripList.appendChild(fragment);
}

function prevImage() {
  if (state.imagePlaylist.length === 0) return;
  const newIndex = (state.imageIndex - 1 + state.imagePlaylist.length) % state.imagePlaylist.length;
  loadImageItem(newIndex);
}

function nextImage() {
  if (state.imagePlaylist.length === 0) return;
  const newIndex = (state.imageIndex + 1) % state.imagePlaylist.length;
  loadImageItem(newIndex);
}

async function handleOpenFileFromLaunch(launchPath) {
  if (!launchPath) return;
  try {
    const item = await invoke('scan_file', { filePath: launchPath });
    if (!item) return;

    if (item.media_type === 'image') {
      state.imagePlaylist = [item];
      goToSection('image');
      loadImageItem(0);
      showToast(`Abriendo imagen: ${item.name}`);
    } else if (item.media_type === 'video') {
      state.videoPlaylist = [item];
      goToSection('video');
      loadVideoItem(0, true);
      showToast(`Abriendo video: ${item.name}`);
    } else if (item.media_type === 'audio') {
      state.audioPlaylist = [item];
      goToSection('audio');
      loadAudioItem(0, true);
      showToast(`Abriendo audio: ${item.name}`);
    }
  } catch (err) {
    console.warn('Error al procesar archivo de inicio:', err);
  }
}

// ============================================================
// MULTIMEDIA EDITORS (IMAGE, VIDEO, AUDIO)
// ============================================================
function openEditorModal(mode) {
  state.activeEditorMode = mode;
  el.editorModal.classList.remove('hidden');

  el.editorImagePanel.classList.add('hidden');
  el.editorVideoPanel.classList.add('hidden');
  el.editorAudioPanel.classList.add('hidden');

  if (mode === 'image') {
    el.editorModalTitle.textContent = 'Editor de Imagen y Fotografía';
    el.editorBadgeType.textContent = 'FOTOS';
    el.editorImagePanel.classList.remove('hidden');
    initImageEditor();
  } else if (mode === 'video') {
    el.editorModalTitle.textContent = 'Editor y Recorte de Video';
    el.editorBadgeType.textContent = 'VIDEO';
    el.editorVideoPanel.classList.remove('hidden');
    initVideoEditor();
  } else if (mode === 'audio') {
    el.editorModalTitle.textContent = 'Editor y Corte de Audio';
    el.editorBadgeType.textContent = 'AUDIO';
    el.editorAudioPanel.classList.remove('hidden');
    initAudioEditor();
  }
}

function closeEditorModal() {
  el.editorModal.classList.add('hidden');
  if (el.videoEditorPreview) {
    el.videoEditorPreview.pause();
    isVideoTrimmerPlaying = false;
    updateVideoTrimmerPlayBtn(false);
  }
  stopAudioTrimmerPlay();
  state.activeEditorMode = null;
}

// 1. IMAGE EDITOR
function initImageEditor() {
  const currentItem = state.imagePlaylist[state.imageIndex];
  if (!currentItem) {
    showToast('Abre una foto antes de editar');
    closeEditorModal();
    return;
  }

  // Reset filters
  state.editorCropMode = 'original';
  state.editorImgRotation = 0;
  state.editorImgFlipH = 1;
  state.editorFilters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
  };

  el.filterBrightness.value = 100;
  el.filterContrast.value = 100;
  el.filterSaturation.value = 100;
  el.filterGrayscale.value = 0;
  el.filterSepia.value = 0;
  updateFilterLabels();

  // Reset active crop button
  document.querySelectorAll('#editorImagePanel [data-crop]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.crop === 'original');
  });

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.editorImageSource = img;
    renderImageEditorCanvas();
  };
  img.src = getMediaStreamUrl(currentItem.path);
}

function updateFilterLabels() {
  el.valBrightness.textContent = `${el.filterBrightness.value}%`;
  el.valContrast.textContent = `${el.filterContrast.value}%`;
  el.valSaturation.textContent = `${el.filterSaturation.value}%`;
  el.valGrayscale.textContent = `${el.filterGrayscale.value}%`;
  el.valSepia.textContent = `${el.filterSepia.value}%`;
}

function renderImageEditorCanvas() {
  const img = state.editorImageSource;
  if (!img) return;

  const canvas = el.imageEditorCanvas;
  const ctx = canvas.getContext('2d');

  let sX = 0, sY = 0, sW = img.naturalWidth, sH = img.naturalHeight;

  // Aspect ratio crop calculation
  if (state.editorCropMode === '1:1') {
    const size = Math.min(sW, sH);
    sX = (sW - size) / 2;
    sY = (sH - size) / 2;
    sW = size;
    sH = size;
  } else if (state.editorCropMode === '4:3') {
    let targetW = sW;
    let targetH = sW * (3 / 4);
    if (targetH > sH) {
      targetH = sH;
      targetW = sH * (4 / 3);
    }
    sX = (sW - targetW) / 2;
    sY = (sH - targetH) / 2;
    sW = targetW;
    sH = targetH;
  } else if (state.editorCropMode === '16:9') {
    let targetW = sW;
    let targetH = sW * (9 / 16);
    if (targetH > sH) {
      targetH = sH;
      targetW = sH * (16 / 9);
    }
    sX = (sW - targetW) / 2;
    sY = (sH - targetH) / 2;
    sW = targetW;
    sH = targetH;
  }

  const isRotated90or270 = state.editorImgRotation === 90 || state.editorImgRotation === 270;
  canvas.width = isRotated90or270 ? sH : sW;
  canvas.height = isRotated90or270 ? sW : sH;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  // Apply filters
  const f = state.editorFilters;
  ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) grayscale(${f.grayscale}%) sepia(${f.sepia}%)`;

  // Center and rotate
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((state.editorImgRotation * Math.PI) / 180);
  ctx.scale(state.editorImgFlipH, 1);

  ctx.drawImage(img, sX, sY, sW, sH, -sW / 2, -sH / 2, sW, sH);
  ctx.restore();
}

function formatFineTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = secs.toFixed(1).padStart(4, '0');
  return `${mm}:${ss}`;
}

async function saveDirectImage() {
  const canvas = el.imageEditorCanvas;
  if (!canvas || canvas.width === 0) return;

  const currentItem = state.imagePlaylist[state.imageIndex];
  if (!currentItem) return;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1];

    showToast('Sobrescribiendo archivo original...');
    await invoke('overwrite_binary_file', {
      targetPath: currentItem.path,
      base64Data,
    });

    showToast(`Archivo actualizado: ${currentItem.name}`);
    closeEditorModal();
    // Force reload image display and filmstrip
    el.mainImageDisplay.src = `${convertFileSrc(currentItem.path)}?t=${Date.now()}`;
    renderImageFilmstrip();
  } catch (err) {
    console.error(err);
    showToast(`Error guardando en archivo: ${err}`);
  }
}

async function saveEditedImage() {
  const canvas = el.imageEditorCanvas;
  if (!canvas || canvas.width === 0) return;

  const currentItem = state.imagePlaylist[state.imageIndex];
  const baseName = currentItem ? currentItem.name.replace(/\.[^/.]+$/, "") : "foto";
  const defaultName = `${baseName}_editada.png`;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1];

    const savedPath = await invoke('save_binary_file', {
      defaultName,
      base64Data,
      filterType: 'image',
    });

    if (savedPath) {
      showToast(`Copia guardada: ${savedPath}`);
      closeEditorModal();
    }
  } catch (err) {
    console.error(err);
    showToast(`Error guardando imagen: ${err}`);
  }
}

// ============================================================
// 2. VIDEO EDITOR (IPHONE-STYLE TRIMMER)
// ============================================================
let isVideoTrimmerPlaying = false;
let isDraggingVideoLeft = false;
let isDraggingVideoRight = false;

function initVideoEditor() {
  const currentItem = state.videoPlaylist[state.videoIndex];
  if (!currentItem) {
    showToast('Abre un video antes de recortar');
    closeEditorModal();
    return;
  }

  const preview = el.videoEditorPreview;
  preview.src = getMediaStreamUrl(currentItem.path);

  preview.onloadedmetadata = () => {
    const dur = preview.duration || 10;
    state.videoTrimStartVal = 0;
    state.videoTrimEndVal = dur;
    updateVideoTrimmerUI();
  };

  preview.ontimeupdate = () => {
    const cur = preview.currentTime;
    const start = state.videoTrimStartVal;
    const end = state.videoTrimEndVal;

    // Position playhead within the trim frame
    const selDur = Math.max(0.1, end - start);
    const rel = Math.max(0, Math.min(1, (cur - start) / selDur));
    if (el.videoPlayhead) {
      el.videoPlayhead.style.left = `${rel * 100}%`;
    }

    if (isVideoTrimmerPlaying && cur >= end) {
      preview.currentTime = start;
    }
  };

  preview.onended = () => {
    isVideoTrimmerPlaying = false;
    updateVideoTrimmerPlayBtn(false);
  };

  preview.onpause = () => {
    isVideoTrimmerPlaying = false;
    updateVideoTrimmerPlayBtn(false);
  };

  setupVideoTrimmerInteractions();
}

function updateVideoTrimmerUI() {
  const dur = el.videoEditorPreview.duration || 10;
  const start = Math.max(0, Math.min(state.videoTrimStartVal, dur));
  const end = Math.max(start + 0.1, Math.min(state.videoTrimEndVal, dur));

  state.videoTrimStartVal = start;
  state.videoTrimEndVal = end;

  const sPct = (start / dur) * 100;
  const ePct = (end / dur) * 100;

  if (el.videoTrimFrame) {
    el.videoTrimFrame.style.left = `${sPct}%`;
    el.videoTrimFrame.style.width = `${Math.max(2, ePct - sPct)}%`;
  }
  if (el.videoDimLeft) el.videoDimLeft.style.width = `${sPct}%`;
  if (el.videoDimRight) el.videoDimRight.style.width = `${100 - ePct}%`;

  if (el.videoTrimStartBadge) el.videoTrimStartBadge.textContent = formatFineTime(start);
  if (el.videoTrimEndBadge) el.videoTrimEndBadge.textContent = formatFineTime(end);
  if (el.videoTrimDuration) el.videoTrimDuration.textContent = formatFineTime(end - start);
  if (el.videoTrimStart) el.videoTrimStart.value = start.toFixed(2);
  if (el.videoTrimEnd) el.videoTrimEnd.value = end.toFixed(2);
}

function setupVideoTrimmerInteractions() {
  const track = el.videoTimelineTrack;
  if (!track) return;

  function handlePointerMove(e) {
    const rect = track.getBoundingClientRect();
    const dur = el.videoEditorPreview.duration || 10;
    const posRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = posRatio * dur;

    if (isDraggingVideoLeft) {
      state.videoTrimStartVal = Math.max(0, Math.min(targetTime, state.videoTrimEndVal - 0.2));
      updateVideoTrimmerUI();
      el.videoEditorPreview.currentTime = state.videoTrimStartVal;
    } else if (isDraggingVideoRight) {
      state.videoTrimEndVal = Math.min(dur, Math.max(targetTime, state.videoTrimStartVal + 0.2));
      updateVideoTrimmerUI();
      el.videoEditorPreview.currentTime = state.videoTrimEndVal;
    }
  }

  function handlePointerUp() {
    isDraggingVideoLeft = false;
    isDraggingVideoRight = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }

  if (el.videoHandleLeft) {
    el.videoHandleLeft.onpointerdown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingVideoLeft = true;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };
  }

  if (el.videoHandleRight) {
    el.videoHandleRight.onpointerdown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingVideoRight = true;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };
  }

  track.onclick = (e) => {
    if (e.target.closest('.iphone-handle')) return;
    const rect = track.getBoundingClientRect();
    const dur = el.videoEditorPreview.duration || 10;
    const posRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickTime = posRatio * dur;
    el.videoEditorPreview.currentTime = Math.max(state.videoTrimStartVal, Math.min(clickTime, state.videoTrimEndVal));
  };
}

function updateVideoTrimmerPlayBtn(playing) {
  if (el.videoClipPlayIcon) {
    el.videoClipPlayIcon.innerHTML = playing
      ? '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'
      : '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }
  if (el.videoClipPlayText) {
    el.videoClipPlayText.textContent = playing ? 'Pausar Corte' : 'Reproducir Fragmento';
  }
  if (el.overlayVideoPlayIcon) {
    el.overlayVideoPlayIcon.innerHTML = playing
      ? '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'
      : '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }
}

function toggleVideoTrimmerPlay() {
  const preview = el.videoEditorPreview;
  if (!preview) return;

  if (isVideoTrimmerPlaying) {
    preview.pause();
    isVideoTrimmerPlaying = false;
    updateVideoTrimmerPlayBtn(false);
    return;
  }

  const start = state.videoTrimStartVal;
  const end = state.videoTrimEndVal;

  if (preview.currentTime < start || preview.currentTime >= end - 0.1) {
    preview.currentTime = start;
  }

  preview.play().then(() => {
    isVideoTrimmerPlaying = true;
    updateVideoTrimmerPlayBtn(true);
  }).catch(e => console.warn(e));
}

async function saveDirectVideo() {
  const currentItem = state.videoPlaylist[state.videoIndex];
  if (!currentItem) return;

  const start = state.videoTrimStartVal;
  const end = state.videoTrimEndVal;

  if (end <= start) {
    showToast('El punto final debe ser mayor que el inicial');
    return;
  }

  showToast('Grabando corte y reemplazando archivo original...');
  const preview = el.videoEditorPreview;

  try {
    const stream = preview.captureStream ? preview.captureStream() : preview.mozCaptureStream();
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        try {
          await invoke('overwrite_binary_file', {
            targetPath: currentItem.path,
            base64Data,
          });
          showToast(`Archivo original de video actualizado: ${currentItem.name}`);
          closeEditorModal();
          loadVideoItem(state.videoIndex, false, 0);
        } catch (err) {
          showToast(`Error: ${err}`);
        }
      };
      reader.readAsDataURL(blob);
    };

    preview.currentTime = start;
    await preview.play();
    mediaRecorder.start();

    const durationMs = (end - start) * 1000;
    setTimeout(() => {
      mediaRecorder.stop();
      preview.pause();
    }, durationMs);

  } catch (err) {
    console.warn(err);
    showToast('Error al capturar fragmento de video');
  }
}

async function saveEditedVideo() {
  const currentItem = state.videoPlaylist[state.videoIndex];
  if (!currentItem) return;

  const start = state.videoTrimStartVal;
  const end = state.videoTrimEndVal;

  if (end <= start) {
    showToast('El punto final debe ser mayor que el inicial');
    return;
  }

  showToast('Grabando copia de fragmento...');
  const preview = el.videoEditorPreview;

  try {
    const stream = preview.captureStream ? preview.captureStream() : preview.mozCaptureStream();
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const defaultName = `${currentItem.name.replace(/\.[^/.]+$/, "")}_corte.webm`;
        try {
          const saved = await invoke('save_binary_file', {
            defaultName,
            base64Data,
            filterType: 'video',
          });
          if (saved) {
            showToast('Video recortado guardado exitosamente');
            closeEditorModal();
          }
        } catch (err) {
          showToast(`Error: ${err}`);
        }
      };
      reader.readAsDataURL(blob);
    };

    preview.currentTime = start;
    await preview.play();
    mediaRecorder.start();

    const durationMs = (end - start) * 1000;
    setTimeout(() => {
      mediaRecorder.stop();
      preview.pause();
    }, durationMs);

  } catch (err) {
    console.warn(err);
    showToast('Formato de captura no compatible en este sistema');
  }
}

// ============================================================
// 3. AUDIO EDITOR (IPHONE-STYLE TRIMMER)
// ============================================================
let isAudioTrimmerPlaying = false;
let audioTrimmerSourceNode = null;
let audioTrimmerStartTime = 0;
let audioTrimmerAnimId = null;
let isDraggingAudioLeft = false;
let isDraggingAudioRight = false;

async function initAudioEditor() {
  const currentItem = state.audioPlaylist[state.audioIndex];
  if (!currentItem) {
    showToast('Abre una pista de audio antes de recortar');
    closeEditorModal();
    return;
  }

  showToast('Cargando y analizando audio...');

  try {
    const response = await fetch(getMediaStreamUrl(currentItem.path));
    const arrayBuffer = await response.arrayBuffer();

    if (!state.editorAudioCtx) {
      state.editorAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    state.editorAudioBuffer = await state.editorAudioCtx.decodeAudioData(arrayBuffer);
    const dur = state.editorAudioBuffer.duration || 10;

    state.audioTrimStartVal = 0;
    state.audioTrimEndVal = dur;
    updateAudioTrimmerUI();

    drawAudioWaveform(state.editorAudioBuffer);
    setupAudioTrimmerInteractions();
    showToast('Audio listo para recortar con estilo iPhone');
  } catch (err) {
    console.error(err);
    showToast(`Error decodificando audio: ${err}`);
  }
}

function updateAudioTrimmerUI() {
  if (!state.editorAudioBuffer) return;
  const dur = state.editorAudioBuffer.duration || 10;
  const start = Math.max(0, Math.min(state.audioTrimStartVal, dur));
  const end = Math.max(start + 0.1, Math.min(state.audioTrimEndVal, dur));

  state.audioTrimStartVal = start;
  state.audioTrimEndVal = end;

  const sPct = (start / dur) * 100;
  const ePct = (end / dur) * 100;

  if (el.audioTrimFrame) {
    el.audioTrimFrame.style.left = `${sPct}%`;
    el.audioTrimFrame.style.width = `${Math.max(2, ePct - sPct)}%`;
  }
  if (el.audioDimLeft) el.audioDimLeft.style.width = `${sPct}%`;
  if (el.audioDimRight) el.audioDimRight.style.width = `${100 - ePct}%`;

  if (el.audioTrimStartBadge) el.audioTrimStartBadge.textContent = formatFineTime(start);
  if (el.audioTrimEndBadge) el.audioTrimEndBadge.textContent = formatFineTime(end);
  if (el.audioTrimDuration) el.audioTrimDuration.textContent = formatFineTime(end - start);
  if (el.audioTrimStart) el.audioTrimStart.value = start.toFixed(2);
  if (el.audioTrimEnd) el.audioTrimEnd.value = end.toFixed(2);
}

function setupAudioTrimmerInteractions() {
  const track = el.audioTimelineTrack;
  if (!track) return;

  function handlePointerMove(e) {
    if (!state.editorAudioBuffer) return;
    const rect = track.getBoundingClientRect();
    const dur = state.editorAudioBuffer.duration || 10;
    const posRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = posRatio * dur;

    if (isDraggingAudioLeft) {
      state.audioTrimStartVal = Math.max(0, Math.min(targetTime, state.audioTrimEndVal - 0.2));
      updateAudioTrimmerUI();
    } else if (isDraggingAudioRight) {
      state.audioTrimEndVal = Math.min(dur, Math.max(targetTime, state.audioTrimStartVal + 0.2));
      updateAudioTrimmerUI();
    }
  }

  function handlePointerUp() {
    isDraggingAudioLeft = false;
    isDraggingAudioRight = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }

  if (el.audioHandleLeft) {
    el.audioHandleLeft.onpointerdown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingAudioLeft = true;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };
  }

  if (el.audioHandleRight) {
    el.audioHandleRight.onpointerdown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingAudioRight = true;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };
  }
}

function drawAudioWaveform(buffer) {
  const canvas = el.audioEditorWaveform;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const rawData = buffer.getChannelData(0);
  const step = Math.ceil(rawData.length / width);
  const amp = height / 2;

  ctx.fillStyle = 'rgba(234, 179, 8, 0.75)';

  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = rawData[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.fillRect(i, (1 + min) * amp, 1, Math.max(2, (max - min) * amp));
  }
}

function updateAudioTrimmerPlayBtn(playing) {
  if (el.audioClipPlayIcon) {
    el.audioClipPlayIcon.innerHTML = playing
      ? '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'
      : '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }
  if (el.audioClipPlayText) {
    el.audioClipPlayText.textContent = playing ? 'Detener Fragmento' : 'Escuchar Fragmento';
  }
}

function toggleAudioTrimmerPlay() {
  if (!state.editorAudioBuffer || !state.editorAudioCtx) return;

  if (isAudioTrimmerPlaying) {
    stopAudioTrimmerPlay();
    return;
  }

  const start = state.audioTrimStartVal;
  const end = state.audioTrimEndVal;
  const dur = Math.max(0.1, end - start);

  const source = state.editorAudioCtx.createBufferSource();
  source.buffer = state.editorAudioBuffer;
  source.connect(state.editorAudioCtx.destination);
  source.start(0, start, dur);

  audioTrimmerSourceNode = source;
  isAudioTrimmerPlaying = true;
  audioTrimmerStartTime = state.editorAudioCtx.currentTime;
  updateAudioTrimmerPlayBtn(true);

  function trackAudioPlayhead() {
    if (!isAudioTrimmerPlaying) return;
    const elapsed = state.editorAudioCtx.currentTime - audioTrimmerStartTime;
    const relPos = Math.max(0, Math.min(1, elapsed / dur));
    if (el.audioPlayhead) {
      el.audioPlayhead.style.left = `${relPos * 100}%`;
    }
    if (elapsed < dur) {
      audioTrimmerAnimId = requestAnimationFrame(trackAudioPlayhead);
    } else {
      stopAudioTrimmerPlay();
    }
  }
  audioTrimmerAnimId = requestAnimationFrame(trackAudioPlayhead);

  source.onended = () => {
    stopAudioTrimmerPlay();
  };
}

function stopAudioTrimmerPlay() {
  if (audioTrimmerSourceNode) {
    try { audioTrimmerSourceNode.stop(); } catch (e) {}
    audioTrimmerSourceNode = null;
  }
  if (audioTrimmerAnimId) {
    cancelAnimationFrame(audioTrimmerAnimId);
    audioTrimmerAnimId = null;
  }
  isAudioTrimmerPlaying = false;
  updateAudioTrimmerPlayBtn(false);
  if (el.audioPlayhead) el.audioPlayhead.style.left = '0%';
}

async function saveDirectAudio() {
  if (!state.editorAudioBuffer) {
    showToast('No hay datos de audio cargados');
    return;
  }

  const currentItem = state.audioPlaylist[state.audioIndex];
  if (!currentItem) return;

  const start = state.audioTrimStartVal;
  const end = state.audioTrimEndVal;

  if (end <= start) {
    showToast('El punto B (fin) debe ser mayor que el punto A (inicio)');
    return;
  }

  showToast('Sobrescribiendo archivo original de audio...');

  try {
    const wavBuffer = encodeWAV(
      state.editorAudioBuffer,
      start,
      end,
      el.audioFadeIn.checked,
      el.audioFadeOut.checked
    );

    const base64Data = arrayBufferToBase64(wavBuffer);
    await invoke('overwrite_binary_file', {
      targetPath: currentItem.path,
      base64Data,
    });

    showToast(`Archivo original actualizado: ${currentItem.name}`);
    closeEditorModal();
    loadAudioItem(state.audioIndex, false, 0);
  } catch (err) {
    console.error(err);
    showToast(`Error al sobrescribir audio: ${err}`);
  }
}

async function saveEditedAudio() {
  if (!state.editorAudioBuffer) {
    showToast('No hay datos de audio cargados');
    return;
  }

  const currentItem = state.audioPlaylist[state.audioIndex];
  const start = state.audioTrimStartVal;
  const end = state.audioTrimEndVal;

  if (end <= start) {
    showToast('El punto B (fin) debe ser mayor que el punto A (inicio)');
    return;
  }

  showToast('Generando nueva copia en WAV...');

  try {
    const wavBuffer = encodeWAV(
      state.editorAudioBuffer,
      start,
      end,
      el.audioFadeIn.checked,
      el.audioFadeOut.checked
    );

    const base64Data = arrayBufferToBase64(wavBuffer);
    const defaultName = `${currentItem ? currentItem.title || currentItem.name : 'audio'}_corte.wav`;

    const saved = await invoke('save_binary_file', {
      defaultName,
      base64Data,
      filterType: 'audio',
    });

    if (saved) {
      showToast('Audio exportado y guardado correctamente');
      closeEditorModal();
    }
  } catch (err) {
    console.error(err);
    showToast(`Error exportando audio: ${err}`);
  }
}

// 16-bit PCM WAV Encoder in Pure JS
function encodeWAV(audioBuffer, startSec, endSec, applyFadeIn, applyFadeOut) {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endSec * sampleRate));
  const numSamples = Math.max(0, endSample - startSample);

  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  // format chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  const fadeInSamples = Math.min(numSamples / 2, sampleRate * 1.5);
  const fadeOutSamples = Math.min(numSamples / 2, sampleRate * 1.5);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let fade = 1.0;
    if (applyFadeIn && i < fadeInSamples) {
      fade *= i / fadeInSamples;
    }
    if (applyFadeOut && i > (numSamples - fadeOutSamples)) {
      fade *= (numSamples - i) / fadeOutSamples;
    }

    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][startSample + i] * fade));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// ============================================================
// EVENT LISTENERS & SETUP
// ============================================================
function initEventListeners() {
  // Navigation from Home
  el.btnEnterAudio.addEventListener('click', () => goToSection('audio'));
  el.btnEnterVideo.addEventListener('click', () => goToSection('video'));
  el.btnEnterImage.addEventListener('click', () => goToSection('image'));
  el.cardEnterAudio.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    goToSection('audio');
  });
  el.cardEnterVideo.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    goToSection('video');
  });
  el.cardEnterImage.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    goToSection('image');
  });

  // Back to Home
  el.btnBackFromAudio.addEventListener('click', () => goToSection('home'));
  el.btnBackFromVideo.addEventListener('click', () => goToSection('home'));
  el.btnBackFromImage.addEventListener('click', () => goToSection('home'));

  // Resume Session from Home
  el.btnResumeSession.addEventListener('click', restoreSession);

  // Audio Section Actions
  el.btnAudioOpenFiles.addEventListener('click', () => openAudioFiles(false));
  el.btnAudioOpenFolder.addEventListener('click', openAudioFolder);
  el.btnAudioAddToQueue.addEventListener('click', () => openAudioFiles(true));
  el.btnAudioEdit.addEventListener('click', () => openEditorModal('audio'));
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
  el.btnVideoEdit.addEventListener('click', () => openEditorModal('video'));
  if (el.btnHudVideoEdit) {
    el.btnHudVideoEdit.addEventListener('click', () => openEditorModal('video'));
  }
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

  // Image Section Actions
  el.btnImageOpenFiles.addEventListener('click', () => openImageFiles(false));
  el.btnImageOpenFolder.addEventListener('click', openImageFolder);
  el.btnImageEdit.addEventListener('click', () => openEditorModal('image'));
  el.btnImageStageEdit.addEventListener('click', () => openEditorModal('image'));
  el.btnImagePrev.addEventListener('click', prevImage);
  el.btnImageNext.addEventListener('click', nextImage);
  el.btnImageZoomIn.addEventListener('click', () => {
    state.imageZoom = Math.min(8, state.imageZoom * 1.25);
    updateImageTransform();
  });
  el.btnImageZoomOut.addEventListener('click', () => {
    state.imageZoom = Math.max(0.2, state.imageZoom / 1.25);
    updateImageTransform();
  });
  el.btnImageResetZoom.addEventListener('click', () => {
    state.imageZoom = 1.0;
    state.imageRotation = 0;
    state.imageFlipH = 1;
    state.imagePanX = 0;
    state.imagePanY = 0;
    updateImageTransform();
  });
  el.btnImageRotateLeft.addEventListener('click', () => {
    state.imageRotation = (state.imageRotation - 90 + 360) % 360;
    updateImageTransform();
  });
  el.btnImageRotateRight.addEventListener('click', () => {
    state.imageRotation = (state.imageRotation + 90) % 360;
    updateImageTransform();
  });
  el.btnImageFlipH.addEventListener('click', () => {
    state.imageFlipH *= -1;
    updateImageTransform();
  });

  // Image Viewport Mouse Pan & Wheel Zoom
  el.imageViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    state.imageZoom = Math.max(0.2, Math.min(8, state.imageZoom * factor));
    updateImageTransform();
  }, { passive: false });

  el.imageViewport.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      state.isPanningImage = true;
      state.panStartX = e.clientX - state.imagePanX;
      state.panStartY = e.clientY - state.imagePanY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (state.isPanningImage) {
      state.imagePanX = e.clientX - state.panStartX;
      state.imagePanY = e.clientY - state.panStartY;
      updateImageTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    state.isPanningImage = false;
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
  if (el.vinylWrap) {
    el.vinylWrap.addEventListener('click', togglePlayPause);
  }
  el.btnAudioNext.addEventListener('click', playNext);
  el.btnAudioPrev.addEventListener('click', playPrev);
  el.btnShuffle.addEventListener('click', toggleShuffle);
  el.btnRepeat.addEventListener('click', cycleRepeat);
  el.btnAudioMute.addEventListener('click', toggleMute);
  el.audioVolumeSlider.addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));

  // Video Playback Controls
  el.btnVideoPlayPause.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });
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

  let cinemaClickTimeout = null;
  el.cinemaContainer.addEventListener('click', (e) => {
    if (e.target.closest('.hud-top') || e.target.closest('.hud-bottom') || e.target.closest('.video-playlist-drawer')) {
      return;
    }
    if (cinemaClickTimeout) {
      clearTimeout(cinemaClickTimeout);
      cinemaClickTimeout = null;
      return;
    }
    cinemaClickTimeout = setTimeout(() => {
      cinemaClickTimeout = null;
      togglePlayPause();
    }, 220);
  });

  el.cinemaContainer.addEventListener('dblclick', (e) => {
    if (e.target.closest('.hud-top') || e.target.closest('.hud-bottom') || e.target.closest('.video-playlist-drawer')) {
      return;
    }
    if (cinemaClickTimeout) {
      clearTimeout(cinemaClickTimeout);
      cinemaClickTimeout = null;
    }
    toggleFullscreen();
  });

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

  // Editor Modal Events
  el.btnCloseEditorModal.addEventListener('click', closeEditorModal);
  el.editorModal.addEventListener('click', (e) => {
    if (e.target === el.editorModal) closeEditorModal();
  });

  // Image Editor Handlers
  document.querySelectorAll('#editorImagePanel [data-crop]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#editorImagePanel [data-crop]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.editorCropMode = btn.dataset.crop;
      renderImageEditorCanvas();
    });
  });

  el.btnEditorRotL.addEventListener('click', () => {
    state.editorImgRotation = (state.editorImgRotation - 90 + 360) % 360;
    renderImageEditorCanvas();
  });
  el.btnEditorRotR.addEventListener('click', () => {
    state.editorImgRotation = (state.editorImgRotation + 90) % 360;
    renderImageEditorCanvas();
  });
  el.btnEditorFlipH.addEventListener('click', () => {
    state.editorImgFlipH *= -1;
    renderImageEditorCanvas();
  });

  [el.filterBrightness, el.filterContrast, el.filterSaturation, el.filterGrayscale, el.filterSepia].forEach(slider => {
    slider.addEventListener('input', () => {
      state.editorFilters.brightness = parseInt(el.filterBrightness.value);
      state.editorFilters.contrast = parseInt(el.filterContrast.value);
      state.editorFilters.saturation = parseInt(el.filterSaturation.value);
      state.editorFilters.grayscale = parseInt(el.filterGrayscale.value);
      state.editorFilters.sepia = parseInt(el.filterSepia.value);
      updateFilterLabels();
      renderImageEditorCanvas();
    });
  });

  el.btnResetImageFilter.addEventListener('click', () => {
    el.filterBrightness.value = 100;
    el.filterContrast.value = 100;
    el.filterSaturation.value = 100;
    el.filterGrayscale.value = 0;
    el.filterSepia.value = 0;
    state.editorImgRotation = 0;
    state.editorImgFlipH = 1;
    state.editorCropMode = 'original';
    document.querySelectorAll('#editorImagePanel [data-crop]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.crop === 'original');
    });
    updateFilterLabels();
    renderImageEditorCanvas();
  });

  if (el.btnImageSlideshow) {
    el.btnImageSlideshow.addEventListener('click', toggleImageSlideshow);
  }
  if (el.btnSaveDirectImage) {
    el.btnSaveDirectImage.addEventListener('click', saveDirectImage);
  }
  if (el.btnSaveEditedImage) {
    el.btnSaveEditedImage.addEventListener('click', saveEditedImage);
  }

  // iPhone Video Trimmer Listeners
  if (el.btnPreviewVideoClip) {
    el.btnPreviewVideoClip.addEventListener('click', toggleVideoTrimmerPlay);
  }
  if (el.btnOverlayVideoPlay) {
    el.btnOverlayVideoPlay.addEventListener('click', toggleVideoTrimmerPlay);
  }
  if (el.videoEditorPreview) {
    el.videoEditorPreview.addEventListener('click', toggleVideoTrimmerPlay);
  }
  if (el.btnVideoStartMinus) {
    el.btnVideoStartMinus.addEventListener('click', () => {
      state.videoTrimStartVal = Math.max(0, state.videoTrimStartVal - 0.1);
      updateVideoTrimmerUI();
      el.videoEditorPreview.currentTime = state.videoTrimStartVal;
    });
  }
  if (el.btnVideoStartPlus) {
    el.btnVideoStartPlus.addEventListener('click', () => {
      state.videoTrimStartVal = Math.min(state.videoTrimEndVal - 0.2, state.videoTrimStartVal + 0.1);
      updateVideoTrimmerUI();
      el.videoEditorPreview.currentTime = state.videoTrimStartVal;
    });
  }
  if (el.btnVideoEndMinus) {
    el.btnVideoEndMinus.addEventListener('click', () => {
      state.videoTrimEndVal = Math.max(state.videoTrimStartVal + 0.2, state.videoTrimEndVal - 0.1);
      updateVideoTrimmerUI();
      el.videoEditorPreview.currentTime = state.videoTrimEndVal;
    });
  }
  if (el.btnVideoEndPlus) {
    el.btnVideoEndPlus.addEventListener('click', () => {
      const dur = el.videoEditorPreview.duration || 10;
      state.videoTrimEndVal = Math.min(dur, state.videoTrimEndVal + 0.1);
      updateVideoTrimmerUI();
      el.videoEditorPreview.currentTime = state.videoTrimEndVal;
    });
  }
  if (el.btnSaveDirectVideo) {
    el.btnSaveDirectVideo.addEventListener('click', saveDirectVideo);
  }
  if (el.btnSaveEditedVideo) {
    el.btnSaveEditedVideo.addEventListener('click', saveEditedVideo);
  }

  // iPhone Audio Trimmer Listeners
  if (el.btnPreviewAudioClip) {
    el.btnPreviewAudioClip.addEventListener('click', toggleAudioTrimmerPlay);
  }
  if (el.btnAudioStartMinus) {
    el.btnAudioStartMinus.addEventListener('click', () => {
      state.audioTrimStartVal = Math.max(0, state.audioTrimStartVal - 0.1);
      updateAudioTrimmerUI();
    });
  }
  if (el.btnAudioStartPlus) {
    el.btnAudioStartPlus.addEventListener('click', () => {
      state.audioTrimStartVal = Math.min(state.audioTrimEndVal - 0.2, state.audioTrimStartVal + 0.1);
      updateAudioTrimmerUI();
    });
  }
  if (el.btnAudioEndMinus) {
    el.btnAudioEndMinus.addEventListener('click', () => {
      state.audioTrimEndVal = Math.max(state.audioTrimStartVal + 0.2, state.audioTrimEndVal - 0.1);
      updateAudioTrimmerUI();
    });
  }
  if (el.btnAudioEndPlus) {
    el.btnAudioEndPlus.addEventListener('click', () => {
      const dur = state.editorAudioBuffer ? state.editorAudioBuffer.duration : 10;
      state.audioTrimEndVal = Math.min(dur, state.audioTrimEndVal + 0.1);
      updateAudioTrimmerUI();
    });
  }
  if (el.btnSaveDirectAudio) {
    el.btnSaveDirectAudio.addEventListener('click', saveDirectAudio);
  }
  if (el.btnSaveEditedAudio) {
    el.btnSaveEditedAudio.addEventListener('click', saveEditedAudio);
  }

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
      if (state.currentSection === 'image') {
        toggleImageSlideshow();
      } else {
        togglePlayPause();
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (state.currentSection === 'image') {
        nextImage();
      } else {
        seekRelative(e.shiftKey ? 10 : 5);
      }
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (state.currentSection === 'image') {
        prevImage();
      } else {
        seekRelative(e.shiftKey ? -10 : -5);
      }
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
      if (state.currentSection === 'image') nextImage();
      else playNext();
      break;
    case 'KeyP':
      if (state.currentSection === 'image') prevImage();
      else playPrev();
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
      closeEditorModal();
      break;
  }
}

// ============================================================
// INITIALIZATION
// ============================================================
async function init() {
  initEventListeners();

  if (state.isTauri) {
    try {
      const port = await invoke('get_stream_port');
      if (port) state.streamPort = port;
    } catch (e) {
      console.warn('Error obteniendo puerto:', e);
    }

    // Auto-register file associations for Windows Open With / Default Apps
    try {
      invoke('register_windows_associations').catch(err => console.warn('Reg assoc error:', err));
    } catch (e) {
      console.warn('Error registrando asociaciones:', e);
    }

    // Check if app was launched with a file argument ("Abrir con..." or double click)
    try {
      const launchPath = await invoke('get_launch_file');
      if (launchPath) {
        await handleOpenFileFromLaunch(launchPath);
      }
    } catch (e) {
      console.warn('Error con launch file:', e);
    }
  }

  await loadSession();

  window.addEventListener('beforeunload', () => saveSession());
  window.addEventListener('pagehide', () => saveSession());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveSession();
      if (state.isTauri) invoke('trim_memory').catch(() => {});
    }
  });

  window.addEventListener('blur', () => {
    if (state.isTauri) invoke('trim_memory').catch(() => {});
  });

  // Initial startup trim after DOM & session are ready
  if (state.isTauri) {
    setTimeout(() => {
      invoke('trim_memory').catch(() => {});
    }, 2500);
    setTimeout(() => {
      invoke('trim_memory').catch(() => {});
    }, 6000);
  }
}

window.addEventListener('DOMContentLoaded', init);

