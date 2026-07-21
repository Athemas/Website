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

  // Scroll distance threshold: 10rem = 160px (at 16px base font size)
  const SCROLL_FADE_THRESHOLD = 500;
  
  // onScroll: track scroll position and fade intro content when scrolled 10rem down
  function onScroll() {
    lastY = window.scrollY || document.documentElement.scrollTop;
    
    // Hide intro content when scrolled down 10rem, show when back at top
    if (lastY > SCROLL_FADE_THRESHOLD && !intro.classList.contains('content-hidden')) {
      intro.classList.add('content-hidden');
    } else if (lastY <= SCROLL_FADE_THRESHOLD && intro.classList.contains('content-hidden')) {
      intro.classList.remove('content-hidden');
    }
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
      // Check if button has a data-target attribute
      const target = btn.getAttribute('data-target');
      if (target === 'about-me') {
        const aboutSection = document.querySelector('.about-me');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
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

  // Attach scroll listener to count scrolls and hide intro content after 6 scrolls
  window.addEventListener('scroll', onScroll, { passive: true });

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

    // Handle the large play button overlay (video-play-btn-start)
    const videoPlayBtnStart = document.querySelector('.video-play-btn-start');
    if (videoPlayBtnStart) {
      videoPlayBtnStart.addEventListener('click', function () {
        introVideo.muted = false;
        introVideo.volume = parseFloat(volumeSlider ? volumeSlider.value : '0.8');
        introVideo.play().then(hideVideoFallback).catch(() => {
          showVideoFallback();
        });
        // Hide the play button completely after clicking
        videoPlayBtnStart.classList.add('hidden');
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
      youtubeId: '_QiZwGyCAWM',
      poster: 'images/Waar Het Stil Wordt.png',
      title: 'Waar Het Stil Wordt (Where It Becomes Silent)',
      alt: 'Waar Het Stil Wordt',
      category: 'Documentary',
      desc: 'Currently in Post-Production. Waar Het Stil Wordt is a documentary about the ocean and its dual nature. Ambient sounds and pads where used to recreate the vastness of the ocean. The final mix emphasises the peaceful nature of the ocean, while also showing the power that it holds.'
    },
    {
      youtubeId: 'FWcGBk-DW-g',
      poster: 'images/Alice.png',
      title: 'Alice',
      alt: 'Alice',
      category: 'Short Film',
      desc: 'Alice is a Short Film about loss, the passing of time and the fear of moving forward. A modern sci-fi soundscape was created by the use of synthesized sounds. The sound design conveys the harshness of the protagonist’s journey.'
    },
    {
      youtubeId: 'jwI6lVz4-OU',
      poster: 'images/Licht.png',
      title: 'Licht (Light)',
      alt: 'Licht',
      category: 'Short Film',
      desc: 'Licht is a Cosmic Horror Short Film about Light. The sound design combines the religious themes of light with the radiation it can produce as while as the electricity which can create it. This combination creates a powerful and ominous soundscape that reflects the film’s themes of power, danger, and the unknown.'
    },
    {
      youtubeId: 'Tt8j1GbDJOg',
      poster: 'images/Textiel Fabriek.png',
      title: 'Textiel Fabriek (Textile Factory)',
      alt: 'Textiel Fabriek',
      category: 'School Project',
      desc: 'Originally a silent video of a Textile Factory. I added sound design to it as a excersise. The sounds all stem from various cat sounds that i manipulated to recreate factory sounds.'
    }
  ];

  const recordingProjectItems = [
    {
      poster: 'images/Henny en de Hamer.jpg',
      title: 'Henny en de Hamer (Henny and the Hammer)',
      alt: 'Henny en de Hamer',
      category: 'Documentary',
      desc: 'Currently in Post-Production. Henny en de Hamer is a documentary about the small village of Cruquius and its battle against the local government. It explores why Henny, who was born and raised in Cruquius and was always the biggest opponent of the local government, suddenly gave in to their demands.'
    },
    {
      poster: 'images/Natte Tosti.jpg',
      title: 'Natte Tosti (Wet Toast)',
      alt: 'Natte Tosti',
      category: 'Short Film',
      desc: 'Currently in Production. Natte Tosti is a short film about a student who is forced to work at a farm.'
    },
    {
      poster: 'images/25 Dagen.jpg',
      title: '25 Dagen (25 Days)',
      alt: '25 Dagen',
      category: 'Short Film',
      desc: 'Currently in Post-Production. 25 Dagen is a short film about two people who start a relationship, but they aren’t right for each other.'
    },
    {
      poster: 'images/Titel Hier.jpg',
      title: 'Titel Hier (Title Here)',
      alt: 'Titel Hier',
      category: 'Documentary',
      desc: 'Currently in Post-Production. Titel Hier explores the idea of truth in documentaries and how it can be manipulated.'
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
    if (item.youtubeId) {
      const youtubeUrl = `https://www.youtube.com/embed/${item.youtubeId}`;
      projectVideo.setAttribute('src', youtubeUrl);
      projectVideo.setAttribute('title', item.title);
    }
    const titleEl = document.querySelector('.project-video-title'); if (titleEl) titleEl.textContent = item.title;
    const categoryEl = document.querySelector('.project-category'); if (categoryEl) categoryEl.textContent = item.category || '';
    const altEl = document.querySelector('.project-alt'); if (altEl) altEl.textContent = item.alt;
    const descEl = document.querySelector('.project-desc'); if (descEl) descEl.textContent = item.desc;
    currentProjectIndex = index;
    updateProjectButtons(index);
    requestAnimationFrame(syncArrowHeight);
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
    
    // Set the poster image
    const posterImg = recordingProjectMedia ? recordingProjectMedia.querySelector('.project-poster') : null;
    if (posterImg && item.poster) {
      posterImg.src = item.poster;
      posterImg.alt = item.alt || item.title || 'Project Poster';
    }
    
    // Handle video iframe visibility
    if (item.youtubeId) {
      const youtubeUrl = `https://www.youtube.com/embed/${item.youtubeId}`;
      recordingProjectVideo.setAttribute('src', youtubeUrl);
      recordingProjectVideo.setAttribute('title', item.title);
      recordingProjectVideo.style.display = 'block';
      // Position iframe absolutely over the poster
      recordingProjectVideo.style.position = 'absolute';
      recordingProjectVideo.style.top = '0';
      recordingProjectVideo.style.left = '0';
      recordingProjectVideo.style.width = '100%';
      recordingProjectVideo.style.height = '100%';
    } else {
      // No video - hide the iframe so poster shows through
      recordingProjectVideo.setAttribute('src', '');
      recordingProjectVideo.style.display = 'none';
    }
    
    if (recordingProjectTitle) recordingProjectTitle.textContent = item.title;
    if (recordingProjectCategory) recordingProjectCategory.textContent = item.category || '';
    if (recordingProjectDesc) recordingProjectDesc.textContent = item.desc;
    currentRecordingProjectIndex = index;
    updateRecordingProjectButtons(index);
    requestAnimationFrame(recordingSyncArrowHeight);
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
    // YouTube iframe handles its own play/pause controls
  }

  if (recordingProjectProgress) {
    // YouTube iframe handles its own progress bar
  }

  if (recordingProjectVolume) {
    // YouTube iframe handles its own volume controls
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
    // YouTube iframe handles its own play/pause controls
  }

  if (projectProgress) {
    // YouTube iframe handles its own progress bar
  }

  if (projectVolume) {
    // YouTube iframe handles its own volume controls
  }

  setProjectVideo(currentProjectIndex, false);
  window.addEventListener('resize', function () { requestAnimationFrame(syncArrowHeight); });
  
  // YouTube iframe handles all its own events and controls

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

  document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");

  const button = form.querySelector("button");

  form.addEventListener("submit", async (e) => {
    console.log("SUBMIT"); // <-- hier

    e.preventDefault();

    button.disabled = true;
    button.textContent = "Sending...";

    const formData = new FormData(form);

    const res = await fetch("https://contact-form.j-o-d-konijnendijk.workers.dev/submit", {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      button.textContent = "✔ Message sent!";
      form.reset();
    } else {
      button.textContent = "❌ Error";
    }

    setTimeout(() => {
      button.disabled = false;
      button.textContent = "Send Message";
    }, 2000);
  });
});

  const compositionItems = [
    {
      title: 'Lost In Descent',
      artist: 'Jack Konijnendijk',
      cover: 'images/Lost In Descent NEW NEW.jpg',
      audio: ''
    },
    {
      title: 'Polaris',
      artist: 'Jack Konijnendijk',
      cover: 'images/Polaris.jpg',
      audio: ''
    }
  ];

  const compositionPrev = document.querySelector('.composition-prev');
  const compositionNext = document.querySelector('.composition-next');
  const compositionCover = document.querySelector('.composition-cover');
  const compositionCard = document.querySelector('.composition-player-card');
  const compositionTitle = document.querySelector('.composition-title');
  const compositionArtist = document.querySelector('.composition-artist');
  const compositionPlayBtn = document.querySelector('.composition-play-btn');
  const compositionAudio = document.querySelector('.composition-audio');

  let currentCompositionIndex = 0;
  let isCompositionPlaying = false;

  function applyCompositionTheme(src) {
    if (!compositionCard) return;

    const image = new Image();
    image.onload = function () {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      const maxDim = 120;
      const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.floor(image.width * scale));
      canvas.height = Math.max(1, Math.floor(image.height * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let red = 0;
      let green = 0;
      let blue = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 128) continue;
        red += data[i];
        green += data[i + 1];
        blue += data[i + 2];
        pixelCount += 1;
      }

      if (!pixelCount) return;

      red = Math.floor(red / pixelCount);
      green = Math.floor(green / pixelCount);
      blue = Math.floor(blue / pixelCount);

      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const textColor = luminance > 160 ? '#111111' : '#ffffff';
      const borderColor = luminance > 160 ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.28)';
      const controlBg = `rgba(${red}, ${green}, ${blue}, 0.26)`;

      compositionCard.style.background = `linear-gradient(145deg, rgba(${red}, ${green}, ${blue}, 0.95), rgba(10, 10, 12, 0.95))`;
      compositionCard.style.borderColor = borderColor;
      compositionCard.style.setProperty('--composition-accent', `rgb(${red}, ${green}, ${blue})`);
      compositionCard.style.setProperty('--composition-accent-border', borderColor);
      compositionCard.style.setProperty('--composition-control-bg', controlBg);
      compositionCard.style.setProperty('--composition-control-text', textColor);
    };

    image.src = src || 'images/AudioJack SoundDesign.jpg';
  }

  function updateCompositionUI(index) {
    const item = compositionItems[index] || compositionItems[0];
    if (!item) return;

    if (compositionCover) {
      const coverSrc = item.cover || 'images/AudioJack SoundDesign.jpg';
      compositionCover.src = coverSrc;
      compositionCover.alt = `${item.title || 'Composition'} cover`;
      if (compositionCover.complete) {
        applyCompositionTheme(coverSrc);
      } else {
        compositionCover.onload = () => applyCompositionTheme(coverSrc);
      }
    }

    if (compositionTitle) {
      compositionTitle.textContent = item.title || 'Untitled Track';
    }

    if (compositionArtist) {
      compositionArtist.textContent = item.artist || 'Artist';
    }

    if (compositionPlayBtn) {
      compositionPlayBtn.textContent = isCompositionPlaying ? '⏸' : '▶';
      compositionPlayBtn.disabled = !item.audio;
    }

    if (compositionAudio) {
      if (!item.audio) {
        compositionAudio.pause();
        compositionAudio.removeAttribute('src');
        compositionAudio.load();
      } else if (compositionAudio.getAttribute('src') !== item.audio) {
        compositionAudio.src = item.audio;
        compositionAudio.load();
      }
    }
  }

  function setCompositionTrack(index, shouldPlay = false) {
    if (!compositionItems.length) return;

    currentCompositionIndex = (index + compositionItems.length) % compositionItems.length;
    const item = compositionItems[currentCompositionIndex];
    updateCompositionUI(currentCompositionIndex);

    if (compositionAudio && shouldPlay && item && item.audio) {
      compositionAudio.play().then(() => {
        isCompositionPlaying = true;
        if (compositionPlayBtn) {
          compositionPlayBtn.textContent = 'Pause';
        }
      }).catch(() => {
        isCompositionPlaying = false;
        if (compositionPlayBtn) {
          compositionPlayBtn.textContent = 'Play';
        }
      });
    } else {
      isCompositionPlaying = false;
      if (compositionPlayBtn) {
        compositionPlayBtn.textContent = 'Play';
      }
    }
  }

  if (compositionPrev && compositionNext && compositionPlayBtn && compositionAudio) {
    compositionPrev.addEventListener('click', function () {
      const previousIndex = (currentCompositionIndex - 1 + compositionItems.length) % compositionItems.length;
      setCompositionTrack(previousIndex, true);
    });

    compositionNext.addEventListener('click', function () {
      const nextIndex = (currentCompositionIndex + 1) % compositionItems.length;
      setCompositionTrack(nextIndex, true);
    });

    compositionPlayBtn.addEventListener('click', function () {
      const item = compositionItems[currentCompositionIndex];
      if (!item || !item.audio) return;

      if (compositionAudio.paused) {
        compositionAudio.play().then(() => {
          isCompositionPlaying = true;
          compositionPlayBtn.textContent = '⏸';
        }).catch(() => {
          isCompositionPlaying = false;
          compositionPlayBtn.textContent = '▶';
        });
      } else {
        compositionAudio.pause();
        isCompositionPlaying = false;
        compositionPlayBtn.textContent = '▶';
      }
    });
  }

  if (compositionAudio) {
    compositionAudio.addEventListener('ended', function () {
      const nextIndex = (currentCompositionIndex + 1) % compositionItems.length;
      setCompositionTrack(nextIndex, true);
    });
  }

  setCompositionTrack(0, false);

  // Attach only the scroll indicator click and keep the intro visible until the user chooses to enter.
  // No intro fade behavior on normal scrolling.
})();
