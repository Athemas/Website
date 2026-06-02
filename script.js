/* Intro fade + scroll indicator + removal on scroll/wheel/touch/click
   Works when opened via file:// and when served by a local server.
*/

(function () {
  // Site menu toggle functionality
  const menuToggle = document.querySelector('.site-menu-toggle');
  const menu = document.querySelector('.site-menu');
  
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function () {
      menu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', menu.classList.contains('open'));
      menu.setAttribute('aria-hidden', !menu.classList.contains('open'));
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      });
    });
  }

  const intro = document.getElementById('intro');
  if (!intro) return; // nothing to do

  const introCenter = intro.querySelector('.intro-center');
  const main = document.getElementById('main');
  const YEAR = document.getElementById('year');
  if (YEAR) YEAR.textContent = new Date().getFullYear();

  // Note: scroll-indicator buttons are placed in HTML for each section.
  // We'll wire them up below so each one scrolls to the bottom of the next section.

  // fadePoint controls how much scroll (in px) fades the intro
  // Allow configuration via `data-fadepoint` and `data-debounce` on #intro
  const fadePoint = parseInt(intro.dataset.fadepoint, 10) || 180;
  const debounceDelay = parseInt(intro.dataset.debounce, 10) || 120; // ms
  let debounceTimer = null;
  let lastY = 0;
  let firstRun = true;
  
  // Optional visual threshold indicator for debugging. Shown when
  // `data-show-threshold="true"` is present on the #intro element.
  let thresholdEl = null;
  let thresholdLabel = null;
  function createThresholdIndicator() {
    if (intro.dataset.showThreshold !== 'true') return;
    thresholdEl = document.createElement('div');
    thresholdEl.className = 'threshold-indicator';
    thresholdLabel = document.createElement('div');
    thresholdLabel.className = 'threshold-label';
    thresholdLabel.textContent = `${fadePoint}px`;
    document.body.appendChild(thresholdEl);
    document.body.appendChild(thresholdLabel);
    positionThreshold();
    window.addEventListener('resize', positionThreshold);
  }

  function positionThreshold() {
    if (!thresholdEl || !thresholdLabel) return;
    const topPx = Math.max(0, Math.min(window.innerHeight, fadePoint));
    thresholdEl.style.top = `${topPx}px`;
    thresholdLabel.style.top = `${topPx}px`;
  }

  function removeThresholdIndicator() {
    if (thresholdEl) thresholdEl.remove();
    if (thresholdLabel) thresholdLabel.remove();
    thresholdEl = null;
    thresholdLabel = null;
    window.removeEventListener('resize', positionThreshold);
  }

  // onScroll no-op: do not fade or hide the intro while scrolling.
  function onScroll() {
    lastY = window.scrollY || document.documentElement.scrollTop;
  }

  // Allow immediate removal on wheel/key/touch for discoverability
  function onUserInteract() {
    // Do not hide or fade the intro; simply remove one-time listeners.
    window.removeEventListener('wheel', onUserInteract);
    window.removeEventListener('keydown', onUserInteract);
    window.removeEventListener('touchstart', onUserInteract);
    clearTimeout(debounceTimer);
  }

  // Wire up any `.scroll-indicator` buttons in the document so they
  // scroll to center the next `.section` in the viewport.
  document.querySelectorAll('.scroll-indicator').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      // Check if button is in the intro
      const isInIntro = btn.closest('#intro');
      if (isInIntro) {
        // Scroll to center the first .section (Sound Design section)
        const firstSection = document.querySelector('.section');
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      const section = btn.closest('.section');
      if (!section) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        return;
      }
      // find next sibling section
      let next = section.nextElementSibling;
      while (next && !next.classList.contains('section')) next = next.nextElementSibling;
      if (next) {
        next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
  });

  // create debug indicator if requested
  createThresholdIndicator();

  // Attempt to autoplay the intro video with sound. Browser policies may
  // block autoplay with audio, so we show a fallback button if needed.
  const introVideo = document.getElementById('intro-video');
  const videoFallback = document.getElementById('video-fallback');
  const videoPlayBtn = videoFallback && videoFallback.querySelector('.video-play-btn');

  function showVideoFallback() {
    if (videoFallback) {
      videoFallback.classList.add('active');
      videoFallback.setAttribute('aria-hidden', 'false');
    }
  }

  function hideVideoFallback() {
    if (videoFallback) {
      videoFallback.classList.remove('active');
      videoFallback.setAttribute('aria-hidden', 'true');
    }
  }

  function attemptIntroVideoPlay() {
    if (!introVideo) return;
    introVideo.volume = 0.8;
    introVideo.muted = false;
    const playPromise = introVideo.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        hideVideoFallback();
      }).catch(() => {
        showVideoFallback();
      });
    }
  }

  const muteButton = document.getElementById('video-mute');
  const volumeSlider = document.getElementById('video-volume');

  function updateAudioControls() {
    if (!introVideo || !muteButton || !volumeSlider) return;
    const muted = introVideo.muted || introVideo.volume === 0;
    muteButton.textContent = muted ? 'Unmute' : 'Mute';
    muteButton.setAttribute('aria-pressed', String(muted));
    const currentVolume = introVideo.volume;
    if (Number.isFinite(currentVolume) && volumeSlider.value !== String(currentVolume)) {
      volumeSlider.value = String(currentVolume);
    }
  }

  if (introVideo) {
    attemptIntroVideoPlay();
    if (videoPlayBtn) {
      videoPlayBtn.addEventListener('click', function () {
        introVideo.muted = false;
        introVideo.volume = parseFloat(volumeSlider ? volumeSlider.value : '0.8');
        introVideo.play().then(hideVideoFallback).catch(() => {
          showVideoFallback();
        });
      });
    }

    if (muteButton) {
      muteButton.addEventListener('click', function () {
        introVideo.muted = !introVideo.muted;
        if (!introVideo.muted && introVideo.volume === 0) {
          introVideo.volume = 0.8;
        }
        if (volumeSlider) {
          volumeSlider.value = introVideo.muted ? '0' : String(introVideo.volume);
        }
        updateAudioControls();
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', function () {
        const volume = parseFloat(volumeSlider.value);
        if (Number.isFinite(volume)) {
          introVideo.volume = volume;
          introVideo.muted = volume === 0;
          updateAudioControls();
        }
      });
    }

    updateAudioControls();
  }

  const introStartBtn = document.getElementById('intro-start');
  const introPauseBtn = document.getElementById('intro-pause');
  const introReplayBtn = document.getElementById('intro-replay');

  function showIntroScreen() {
    if (!intro) return;
    intro.classList.remove('intro-hidden');
    intro.style.opacity = '1';
  }

  function playIntroVideo(reset = false) {
    if (!introVideo) return;
    showIntroScreen();
    if (reset) introVideo.currentTime = 0;
    introVideo.muted = false;
    introVideo.play().then(hideVideoFallback).catch(() => {
      showVideoFallback();
    });
  }

  function pauseIntroVideo() {
    if (!introVideo) return;
    introVideo.pause();
  }

  if (introStartBtn) {
    introStartBtn.addEventListener('click', function () {
      if (!introVideo) return;
      if (!introVideo.paused && !introVideo.ended) {
        return;
      }
      if (introVideo.ended) {
        playIntroVideo(true);
      } else {
        playIntroVideo(false);
      }
    });
  }

  if (introPauseBtn) {
    introPauseBtn.addEventListener('click', function () {
      pauseIntroVideo();
    });
  }

  if (introReplayBtn) {
    introReplayBtn.addEventListener('click', function () {
      playIntroVideo(true);
    });
  }

  // Project video player: pause intro audio while playing, provide prev/next hooks

  // Project video player: pause intro audio while playing, provide prev/next hooks
  let introWasPlaying = false;
  const projectVideo = document.getElementById('project-video');
  const projectPrev = document.querySelector('.project-prev');
  const projectNext = document.querySelector('.project-next');
  const projectContainer = document.querySelector('.project-video-container');
  const projectMedia = document.querySelector('.project-media');
  const projectPlayPause = document.getElementById('project-play-pause');
  const projectProgress = document.getElementById('project-progress');
  const projectTime = document.getElementById('project-time');
  const projectVolume = document.getElementById('project-volume-control');

  const projectItems = [
    {
      src: 'videos/Waar Het Stil Wordt.mp4',
      poster: 'images/Waar Het Stil Wordt.png',
      title: 'Waar Het Stil Wordt',
      alt: 'Waar Het Stil Wordt',
      category: 'Documentary',
      desc: 'Currently in Post-Production. The sound design emphasises the peaceful nature of the ocean, while also showing the power that it holds.'
    },
    {
      src: 'videos/Alice.mp4',
      poster: 'images/Alice.png',
      title: 'Alice',
      alt: 'Alice',
      category: 'Short Film',
      desc: 'The sound design conveys the freezing of time, with the dread to move forward.'
    },
    {
      src: 'videos/Licht Short.mp4',
      poster: 'images/Licht.png',
      title: 'Licht',
      alt: 'Licht',
      category: 'Short Film',
      desc: 'The sound design combines the religious themes of light with the radiation it can produce as while as the electricity which can create it. This combination creates a powerful and ominous soundscape that reflects the film’s themes of power, danger, and the unknown.'
    },
    {
      src: 'videos/Textiel Fabriek.mp4',
      poster: 'images/Textiel Fabriek.png',
      title: 'Textiel Fabriek',
      alt: 'Textiel Fabriek',
      category: 'School Project',
      desc: 'Originally a silent video of a Textile Factory. I added sound design to it as a excersise. The sounds all stem from various cat sounds that i manipulated to recreate factory sounds.'
    }
  ];

  const recordingProjectItems = [
    {
      src: 'videos/recording-1.mp4',
      poster: 'images/Henny en de Hamer.jpg',
      title: 'Henny en de Hamer',
      alt: 'Henny en de Hamer',
      category: 'Documentary',
      desc: 'Currently in Post-Production.'
    },
    {
      src: 'videos/recording-2.mp4',
      poster: 'images/Natte Tosti.jpg',
      title: 'Natte Tosti',
      alt: 'Natte Tosti',
      category: 'Short Film',
      desc: 'Currently in Production'
    },
    {
      src: 'videos/recording-2.mp4',
      poster: 'images/25 Dagen.jpg',
      title: '25 Dagen',
      alt: '25 Dagen',
      category: 'Short Film',
      desc: 'Currently in Post-Production.'
    },
    {
      src: 'videos/recording-2.mp4',
      poster: 'images/Titel Hier.jpg',
      title: 'Titel Hier',
      alt: 'Titel Hier',
      category: 'Documentary',
      desc: 'Currently in Post-Production'
    }
  ];

  let currentProjectIndex = 0;
  let currentRecordingProjectIndex = 0;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function updateProgressBackground(percent) {
    if (!projectProgress) return;
    projectProgress.style.background = `linear-gradient(to right, rgba(255,129,214,0.95) 0%, rgba(255,129,214,0.95) ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`;
  }

  function updateProjectControls() {
    if (!projectVideo) return;
    const duration = projectVideo.duration || 0;
    const currentTime = projectVideo.currentTime || 0;
    const percent = duration ? (currentTime / duration) * 100 : 0;
    if (projectProgress) {
      projectProgress.max = duration ? '100' : '0';
      projectProgress.value = percent;
      updateProgressBackground(percent);
    }
    if (projectTime) {
      projectTime.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
    if (projectPlayPause) {
      projectPlayPause.textContent = projectVideo.paused || projectVideo.ended ? 'Play' : 'Pause';
      projectPlayPause.setAttribute('aria-label', projectVideo.paused || projectVideo.ended ? 'Play project video' : 'Pause project video');
    }
    if (projectVolume) {
      const volumeValue = Number.isFinite(projectVideo.volume) ? projectVideo.volume : 1;
      if (projectVolume.value !== String(volumeValue)) projectVolume.value = String(volumeValue);
    }
  }

  function updateProjectButtons(index) {
    const prevIndex = (index - 1 + projectItems.length) % projectItems.length;
    const nextIndex = (index + 1) % projectItems.length;
    if (projectPrev) projectPrev.dataset.targetIndex = String(prevIndex);
    if (projectNext) projectNext.dataset.targetIndex = String(nextIndex);
    if (projectContainer) projectContainer.dataset.current = String(index);
  }

  function syncArrowHeight() {
    if (!projectVideo) return;
    const videoRect = projectVideo.getBoundingClientRect();
    const height = Math.round(videoRect.height);
    [projectPrev, projectNext].forEach(btn => {
      if (btn) {
        btn.style.height = `${height}px`;
      }
    });
  }

  function updateProjectContent(index, playOnLoad = false) {
    if (!projectVideo || !projectItems[index]) return;
    const item = projectItems[index];
    const sourceEl = projectVideo.querySelector('source');
    if (sourceEl) sourceEl.src = item.src;
    if (item.poster) projectVideo.poster = item.poster;
    projectVideo.load();
    const titleEl = document.querySelector('.project-video-title'); if (titleEl) titleEl.textContent = item.title;
    const categoryEl = document.querySelector('.project-category'); if (categoryEl) categoryEl.textContent = item.category || '';
    const altEl = document.querySelector('.project-alt'); if (altEl) altEl.textContent = item.alt;
    const descEl = document.querySelector('.project-desc'); if (descEl) descEl.textContent = item.desc;
    currentProjectIndex = index;
    updateProjectButtons(index);
    requestAnimationFrame(syncArrowHeight);
    if (playOnLoad) {
      projectVideo.muted = false;
      projectVideo.play().catch(() => {});
    }
  }

  function setProjectVideo(index, playOnLoad = false, direction = 'next') {
    if (!projectVideo || !projectItems[index]) return;
    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    if (projectMedia) {
      projectMedia.classList.add(outClass);
      window.setTimeout(() => {
        projectMedia.classList.remove(outClass);
        updateProjectContent(index, playOnLoad);
        projectMedia.classList.add(inClass);
        requestAnimationFrame(() => {
          projectMedia.classList.remove(inClass);
        });
      }, 230);
    } else {
      updateProjectContent(index, playOnLoad);
    }
  }

  const recordingProjectVideo = document.getElementById('recording-project-video');
  const recordingProjectWrapper = recordingProjectVideo ? recordingProjectVideo.closest('.project-video-wrap') : null;
  const recordingProjectPrev = recordingProjectWrapper ? recordingProjectWrapper.querySelector('.project-prev') : null;
  const recordingProjectNext = recordingProjectWrapper ? recordingProjectWrapper.querySelector('.project-next') : null;
  const recordingProjectContainer = recordingProjectWrapper ? recordingProjectWrapper.querySelector('.project-video-container') : null;
  const recordingProjectMedia = recordingProjectWrapper ? recordingProjectWrapper.querySelector('.project-media') : null;
  const recordingProjectPlayPause = document.getElementById('recording-project-play-pause');
  const recordingProjectProgress = document.getElementById('recording-project-progress');
  const recordingProjectTime = document.getElementById('recording-project-time');
  const recordingProjectVolume = document.getElementById('recording-project-volume-control');
  const recordingProjectTitle = recordingProjectWrapper ? recordingProjectWrapper.querySelector('.project-video-title') : null;
  const recordingProjectCategory = recordingProjectWrapper ? recordingProjectWrapper.querySelector('.project-category') : null;
  const recordingProjectDesc = recordingProjectWrapper ? recordingProjectWrapper.querySelector('.project-desc') : null;

  function updateRecordingProjectButtons(index) {
    const prevIndex = (index - 1 + recordingProjectItems.length) % recordingProjectItems.length;
    const nextIndex = (index + 1) % recordingProjectItems.length;
    if (recordingProjectPrev) recordingProjectPrev.dataset.targetIndex = String(prevIndex);
    if (recordingProjectNext) recordingProjectNext.dataset.targetIndex = String(nextIndex);
    if (recordingProjectContainer) recordingProjectContainer.dataset.current = String(index);
  }

  function recordingSyncArrowHeight() {
    if (!recordingProjectVideo) return;
    const videoRect = recordingProjectVideo.getBoundingClientRect();
    const height = Math.round(videoRect.height);
    [recordingProjectPrev, recordingProjectNext].forEach(btn => {
      if (btn) {
        btn.style.height = `${height}px`;
      }
    });
  }

  function updateRecordingProjectContent(index, playOnLoad = false) {
    if (!recordingProjectVideo || !recordingProjectItems[index]) return;
    const item = recordingProjectItems[index];
    const sourceEl = recordingProjectVideo.querySelector('source');
    if (sourceEl) sourceEl.src = item.src;
    if (item.poster) recordingProjectVideo.poster = item.poster;
    recordingProjectVideo.load();
    if (recordingProjectTitle) recordingProjectTitle.textContent = item.title;
    if (recordingProjectCategory) recordingProjectCategory.textContent = item.category || '';
    if (recordingProjectDesc) recordingProjectDesc.textContent = item.desc;
    currentRecordingProjectIndex = index;
    updateRecordingProjectButtons(index);
    requestAnimationFrame(recordingSyncArrowHeight);
    if (playOnLoad) {
      recordingProjectVideo.muted = false;
      recordingProjectVideo.play().catch(() => {});
    }
  }

  function setRecordingProjectVideo(index, playOnLoad = false, direction = 'next') {
    if (!recordingProjectVideo || !recordingProjectItems[index]) return;
    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    if (recordingProjectMedia) {
      recordingProjectMedia.classList.add(outClass);
      window.setTimeout(() => {
        recordingProjectMedia.classList.remove(outClass);
        updateRecordingProjectContent(index, playOnLoad);
        recordingProjectMedia.classList.add(inClass);
        requestAnimationFrame(() => {
          recordingProjectMedia.classList.remove(inClass);
        });
      }, 230);
    } else {
      updateRecordingProjectContent(index, playOnLoad);
    }
  }

  if (recordingProjectPrev) {
    recordingProjectPrev.addEventListener('click', function () {
      const index = parseInt(this.dataset.targetIndex, 10);
      if (!Number.isNaN(index)) setRecordingProjectVideo(index, true, 'prev');
    });
  }
  if (recordingProjectNext) {
    recordingProjectNext.addEventListener('click', function () {
      const index = parseInt(this.dataset.targetIndex, 10);
      if (!Number.isNaN(index)) setRecordingProjectVideo(index, true, 'next');
    });
  }

  if (recordingProjectPlayPause) {
    recordingProjectPlayPause.addEventListener('click', function () {
      if (!recordingProjectVideo) return;
      if (recordingProjectVideo.paused || recordingProjectVideo.ended) {
        recordingProjectVideo.play().catch(() => {});
      } else {
        recordingProjectVideo.pause();
      }
      recordingProjectTime.textContent = `${formatTime(recordingProjectVideo.currentTime || 0)} / ${formatTime(recordingProjectVideo.duration || 0)}`;
      recordingProjectPlayPause.textContent = recordingProjectVideo.paused || recordingProjectVideo.ended ? 'Play' : 'Pause';
    });
  }

  if (recordingProjectProgress) {
    recordingProjectProgress.addEventListener('input', function () {
      if (!recordingProjectVideo || !recordingProjectVideo.duration) return;
      const percent = parseFloat(recordingProjectProgress.value);
      recordingProjectVideo.currentTime = (percent / 100) * recordingProjectVideo.duration;
      recordingProjectProgress.style.background = `linear-gradient(to right, rgba(255,129,214,0.95) 0%, rgba(255,129,214,0.95) ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`;
      recordingProjectTime.textContent = `${formatTime(recordingProjectVideo.currentTime || 0)} / ${formatTime(recordingProjectVideo.duration || 0)}`;
    });
  }

  if (recordingProjectVolume) {
    recordingProjectVolume.addEventListener('input', function () {
      if (!recordingProjectVideo) return;
      const volume = parseFloat(recordingProjectVolume.value);
      recordingProjectVideo.volume = Number.isFinite(volume) ? volume : 1;
      if (recordingProjectVideo.volume > 0) recordingProjectVideo.muted = false;
    });
  }

  if (recordingProjectVideo) {
    recordingProjectVideo.addEventListener('loadedmetadata', function () {
      recordingSyncArrowHeight();
      recordingProjectTime.textContent = `${formatTime(recordingProjectVideo.currentTime || 0)} / ${formatTime(recordingProjectVideo.duration || 0)}`;
    });
    recordingProjectVideo.addEventListener('timeupdate', function () {
      const duration = recordingProjectVideo.duration || 0;
      const currentTime = recordingProjectVideo.currentTime || 0;
      const percent = duration ? (currentTime / duration) * 100 : 0;
      if (recordingProjectProgress) {
        recordingProjectProgress.value = percent;
        recordingProjectProgress.style.background = `linear-gradient(to right, rgba(255,129,214,0.95) 0%, rgba(255,129,214,0.95) ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`;
      }
      if (recordingProjectTime) {
        recordingProjectTime.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
      }
    });
    recordingProjectVideo.addEventListener('pause', function () {
      if (recordingProjectPlayPause) recordingProjectPlayPause.textContent = 'Play';
    });
    recordingProjectVideo.addEventListener('play', function () {
      if (recordingProjectPlayPause) recordingProjectPlayPause.textContent = 'Pause';
    });
    recordingProjectVideo.addEventListener('ended', function () {
      if (recordingProjectPlayPause) recordingProjectPlayPause.textContent = 'Play';
    });
    recordingProjectVideo.addEventListener('click', function () {
      if (recordingProjectVideo.paused) {
        recordingProjectVideo.play().catch(() => {});
      } else {
        recordingProjectVideo.pause();
      }
    });
  }

  if (recordingProjectVideo && recordingProjectWrapper) {
    window.addEventListener('resize', function () { requestAnimationFrame(recordingSyncArrowHeight); });
  }

  setRecordingProjectVideo(currentRecordingProjectIndex, false);

  if (projectPrev) {
    projectPrev.addEventListener('click', function () {
      const index = parseInt(this.dataset.targetIndex, 10);
      if (!Number.isNaN(index)) setProjectVideo(index, true, 'prev');
    });
  }
  if (projectNext) {
    projectNext.addEventListener('click', function () {
      const index = parseInt(this.dataset.targetIndex, 10);
      if (!Number.isNaN(index)) setProjectVideo(index, true, 'next');
    });
  }

  if (projectPlayPause) {
    projectPlayPause.addEventListener('click', function () {
      if (!projectVideo) return;
      if (projectVideo.paused || projectVideo.ended) {
        projectVideo.play().catch(() => {});
      } else {
        projectVideo.pause();
      }
      updateProjectControls();
    });
  }

  if (projectProgress) {
    projectProgress.addEventListener('input', function () {
      if (!projectVideo || !projectVideo.duration) return;
      const percent = parseFloat(projectProgress.value);
      projectVideo.currentTime = (percent / 100) * projectVideo.duration;
      updateProgressBackground(percent);
      updateProjectControls();
    });
  }

  if (projectVolume) {
    projectVolume.addEventListener('input', function () {
      if (!projectVideo) return;
      const volume = parseFloat(projectVolume.value);
      projectVideo.volume = Number.isFinite(volume) ? volume : 1;
      if (projectVideo.volume > 0) projectVideo.muted = false;
      updateProjectControls();
    });
  }

  setProjectVideo(currentProjectIndex, false);
  window.addEventListener('resize', function () { requestAnimationFrame(syncArrowHeight); });
  if (projectVideo) {
    projectVideo.addEventListener('loadedmetadata', function () {
      syncArrowHeight();
      updateProjectControls();
    });
    projectVideo.addEventListener('timeupdate', updateProjectControls);
    projectVideo.addEventListener('pause', updateProjectControls);
    projectVideo.addEventListener('play', updateProjectControls);
    projectVideo.addEventListener('ended', updateProjectControls);
  }

  if (projectVideo) {
    projectVideo.addEventListener('play', () => {
      if (introVideo && !introVideo.paused) {
        introWasPlaying = true;
        introVideo.pause();
      } else {
        introWasPlaying = false;
      }
    });

    projectVideo.addEventListener('ended', () => {
      if (introVideo && introWasPlaying) {
        introVideo.play().catch(() => {});
      }
    });

    projectVideo.addEventListener('click', () => {
      if (projectVideo.paused) {
        projectVideo.muted = false;
        projectVideo.play().catch(() => {});
      } else {
        projectVideo.pause();
      }
    });
  }

  /* ---- Image viewer: open card in center and blur rest ---- */
  const viewer = document.createElement('div');
  viewer.id = 'viewer';
  viewer.className = 'viewer';
  viewer.innerHTML = `
    <div class="viewer-backdrop" data-role="backdrop"></div>
    <div class="viewer-inner">
      <div class="viewer-box">
        <img id="viewer-img" src="" alt="" />
        <div class="viewer-caption"><h4 id="viewer-title"></h4><p id="viewer-desc"></p></div>
        <button id="viewer-close" aria-label="Close viewer">×</button>
      </div>
    </div>
  `;
  document.body.appendChild(viewer);

  const viewerImg = document.getElementById('viewer-img');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerDesc = document.getElementById('viewer-desc');
  const viewerClose = document.getElementById('viewer-close');

  // FLIP-enabled open and close so the image appears to zoom from the
  // thumbnail into the full-bleed viewer and back.
  let lastThumb = null;
  let isAnimating = false;
  let lastThumbSrc = '';

  function openViewer(src, title, desc, thumbEl) {
    if (!src) return;
    lastThumb = thumbEl || null;
    lastThumbSrc = (thumbEl && thumbEl.src) || '';
    viewerImg.src = src;
    viewerImg.alt = title || '';
    viewerTitle.textContent = title || '';
    viewerDesc.textContent = desc || '';
    viewer.classList.add('active');
    document.body.classList.add('viewer-active');
    viewer.setAttribute('aria-hidden', 'false');
    // Perform FLIP to the centered viewer box.
    const box = viewer.querySelector('.viewer-box');
    if (thumbEl && thumbEl instanceof Element && box) {
      const thumbRect = thumbEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Compute target box size (respecting CSS min/max): prefer 1024x620 but
      // shrink to fit viewport with some margin.
      // Use the viewer box target size (match CSS): up to 1280px, aspect 1280/775
      const maxW = Math.min(1280, Math.floor(vw * 0.96));
      const aspect = 1280 / 775;
      let targetW = maxW;
      let targetH = Math.round(targetW / aspect);
      if (targetH > Math.floor(vh * 0.92)) {
        targetH = Math.floor(vh * 0.92);
        targetW = Math.round(targetH * aspect);
      }

      // Center of thumbnail vs center of viewport (target center)
      const thumbCenterX = thumbRect.left + thumbRect.width / 2;
      const thumbCenterY = thumbRect.top + thumbRect.height / 2;
      const targetCenterX = vw / 2;
      const targetCenterY = vh / 2;
      const deltaX = thumbCenterX - targetCenterX;
      const deltaY = thumbCenterY - targetCenterY;

      // uniform scale from thumbnail -> target box
      const scale = thumbRect.width / targetW;

      // Apply initial transform so the viewer image matches the thumbnail
      viewerImg.style.transition = 'none';
      viewerImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
      viewerImg.style.opacity = '1';

      // Force layout then animate to centered box (identity transform)
        requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          viewerImg.style.transition = 'transform 1000ms cubic-bezier(0.2,0.8,0.2,1), opacity 500ms ease';
          viewerImg.style.transform = 'translate(0px, 0px) scale(1)';
        });
      });
    } else {
      // No FLIP source — just show the image centered
      viewerImg.style.transform = 'translate(0px, 0px) scale(1)';
      viewerImg.style.opacity = '1';
    }
  }

  function closeViewer() {
    if (isAnimating) return;
    isAnimating = true;

    // If we have a thumb to animate back to, compute its rect and animate
    if (lastThumb && lastThumb instanceof Element) {
      const thumbRect = lastThumb.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Compute target box size the same way as openViewer
      // Use the same target size calculations for close animation
      const maxW = Math.min(1280, Math.floor(vw * 0.96));
      const aspect = 1280 / 775;
      let targetW = maxW;
      let targetH = Math.round(targetW / aspect);
      if (targetH > Math.floor(vh * 0.92)) {
        targetH = Math.floor(vh * 0.92);
        targetW = Math.round(targetH * aspect);
      }

      const thumbCenterX = thumbRect.left + thumbRect.width / 2;
      const thumbCenterY = thumbRect.top + thumbRect.height / 2;
      const targetCenterX = vw / 2;
      const targetCenterY = vh / 2;
      const deltaX = thumbCenterX - targetCenterX;
      const deltaY = thumbCenterY - targetCenterY;
      const scale = thumbRect.width / targetW;

      // Animate transform back to thumbnail and then hide
      viewerImg.style.transition = 'transform 1000ms cubic-bezier(0.2,0.8,0.2,1), opacity 500ms ease';
      viewerImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
      viewerImg.style.opacity = '0.98';

      // Wait for the transform transition to finish then cleanup
      const onEnd = function () {
        viewerImg.removeEventListener('transitionend', onEnd);
        viewer.classList.remove('active');
        document.body.classList.remove('viewer-active');
        viewer.setAttribute('aria-hidden', 'true');
        viewerImg.src = '';
        isAnimating = false;
      };
      viewerImg.addEventListener('transitionend', onEnd);
    } else {
      // No thumb — fade out
      viewerImg.style.transition = 'opacity 500ms ease';
      viewerImg.style.opacity = '0';
      setTimeout(function () {
        viewer.classList.remove('active');
        document.body.classList.remove('viewer-active');
        viewer.setAttribute('aria-hidden', 'true');
        viewerImg.src = '';
        isAnimating = false;
      }, 520);
    }
  }

  // If large image fails to load, fallback to thumbnail src (if available)
  viewerImg.addEventListener('error', function () {
    if (lastThumbSrc) {
      console.warn('Large image failed to load, falling back to thumbnail');
      viewerImg.removeEventListener('error', arguments.callee);
      viewerImg.src = lastThumbSrc;
    }
  });

  viewerClose.addEventListener('click', closeViewer);
  viewer.querySelector('[data-role="backdrop"]').addEventListener('click', closeViewer);
  // Click outside the viewer-box (anywhere inside the viewer but not
  // inside the box) should also close the viewer. This handles clicks on
  // the empty area and works regardless of backdrop stacking.
  viewer.addEventListener('click', function (e) {
    if (!e.target.closest('.viewer-box')) {
      closeViewer();
    }
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeViewer();
  });

  // Attach click handlers to cards (but not to links)
  document.querySelectorAll('.card:not(a)').forEach(function (card) {
    card.addEventListener('click', function () {
      const large = card.dataset.large || (card.querySelector('.card-thumb') && card.querySelector('.card-thumb').src);
      const title = card.dataset.title || (card.querySelector('h4') && card.querySelector('h4').textContent);
      const desc = card.dataset.desc || (card.querySelector('p') && card.querySelector('p').textContent);
      if (large) openViewer(large, title, desc);
    });
  });

  // Attach image click handlers in project pages
  document.querySelectorAll('.project-image img').forEach(function (img) {
    img.addEventListener('click', function () {
      const large = img.dataset.large || img.src;
      const title = img.dataset.title || '';
      const desc = img.dataset.desc || '';
      if (large) openViewer(large, title, desc, img);
    });
  });

  // About Me role toggle (Sound Designer / Sound Recorder)
  const roleBtns = document.querySelectorAll('.about-me-role-btn');
  const roleText = document.querySelector('.about-me-role-text');
  const aboutImages = document.querySelectorAll('.about-me-image img');

  roleBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const role = btn.dataset.role;
      
      // Update buttons
      roleBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      
      // Update text
      if (roleText) {
        roleText.textContent = role === 'designer' ? 'Sound Designer' : 'Sound Recorder';
      }
      
      // Update images
      aboutImages.forEach(function(img) {
        if (role === 'designer' && img.alt.includes('Sound Designer')) {
          img.classList.add('active');
        } else if (role === 'recorder' && img.alt.includes('Sound Recorder')) {
          img.classList.add('active');
        } else {
          img.classList.remove('active');
        }
      });
    });
  });

  // Attach only the scroll indicator click and keep the intro visible until the user chooses to enter.
  // No intro fade behavior on normal scrolling.
})();
