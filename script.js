/* Site menu, intro video, and composing player. */

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

  const projectCategories = {
    'sound-design': 'Sound Design',
    mixing: 'Mixing',
    recording: 'Recording',
    composing: 'composing'
  };
  const projectLibrary = document.getElementById('project-library');
  if (projectLibrary) {
    const projectDefinitions = Array.from(projectLibrary.content.querySelectorAll('.project-card'));
    document.querySelectorAll('[data-project-category]').forEach(function (grid) {
      const category = grid.dataset.projectCategory;
      projectDefinitions.forEach(function (project) {
        const tags = (project.dataset.tags || '')
          .split(',')
          .map(function (tag) { return tag.trim(); })
          .filter(function (tag) { return Object.values(projectCategories).includes(tag); });
        const belongsInGrid = category === 'all'
          ? tags.length > 0
          : tags.includes(projectCategories[category]);

        if (belongsInGrid) grid.appendChild(project.cloneNode(true));
      });
    });
  }

  const projectCards = Array.from(document.querySelectorAll('.project-card[aria-haspopup="dialog"]'));
  const projectDialog = document.getElementById('project-dialog');
  if (projectDialog && projectCards.length) {
    const projectDialogTitle = projectDialog.querySelector('.project-dialog-title');
    const projectDialogTags = projectDialog.querySelector('.project-dialog-tags');
    const projectDialogDescription = projectDialog.querySelector('.project-dialog-description');
    const projectDialogVideo = projectDialog.querySelector('.project-dialog-video iframe');
    const projectDialogVideoPlaceholder = projectDialog.querySelector('.project-dialog-video-placeholder');
    let activeProjectCard = null;

    function openProjectDialog(card) {
      const title = card.querySelector('.project-card-title');
      if (!title || !projectDialogTitle || !projectDialogTags || !projectDialogDescription || !projectDialogVideo || !projectDialogVideoPlaceholder) return;

      activeProjectCard = card;
      projectDialogTitle.textContent = title.textContent.trim();
      projectDialogTags.replaceChildren();
      (card.dataset.tags || '')
        .split(',')
        .map(function (tag) { return tag.trim(); })
        .filter(function (tag) { return Object.values(projectCategories).includes(tag); })
        .forEach(function (tag) {
          const tagElement = document.createElement('span');
          tagElement.className = 'project-dialog-tag';
          tagElement.textContent = tag;
          projectDialogTags.appendChild(tagElement);
        });
      projectDialogDescription.textContent = card.dataset.description || 'Project details will be added here.';

      const youtubeId = card.dataset.youtubeId;
      const vimeoUrl = card.dataset.vimeoLink || card.dataset.vimeoUrl || card.dataset.vimeoId || '';
      let videoSrc = '';
      let videoTitle = 'Project video';

      if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
        videoSrc = 'https://www.youtube-nocookie.com/embed/' + youtubeId;
        videoTitle = 'Project YouTube video';
      } else if (vimeoUrl) {
        const trimmedVimeoUrl = vimeoUrl.trim();
        const vimeoMatch = trimmedVimeoUrl.match(/(?:vimeo\.com\/(?:video\/)?)(\d+)/i) || trimmedVimeoUrl.match(/^(\d+)$/);
        if (vimeoMatch && vimeoMatch[1]) {
          videoSrc = 'https://player.vimeo.com/video/' + vimeoMatch[1] + '?title=0&byline=0&portrait=0';
          videoTitle = 'Project Vimeo video';
        }
      }

      if (videoSrc) {
        projectDialogVideo.src = videoSrc;
        projectDialogVideo.title = videoTitle;
        projectDialogVideo.hidden = false;
        projectDialogVideoPlaceholder.hidden = true;
      } else {
        projectDialogVideo.removeAttribute('src');
        projectDialogVideo.title = 'Project video';
        projectDialogVideo.hidden = true;
        projectDialogVideoPlaceholder.hidden = false;
      }

      projectDialog.showModal();
      const closeButton = projectDialog.querySelector('.project-dialog-close');
      if (closeButton) closeButton.focus();
    }

    function closeProjectDialog() {
      if (projectDialog.open) projectDialog.close();
    }

    projectCards.forEach(function (card) {
      card.addEventListener('click', function () {
        openProjectDialog(card);
      });
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openProjectDialog(card);
        }
      });
    });

    projectDialog.querySelectorAll('[data-close-project-dialog]').forEach(function (button) {
      button.addEventListener('click', closeProjectDialog);
    });
    projectDialog.addEventListener('click', function (event) {
      if (event.target === projectDialog) closeProjectDialog();
    });
    projectDialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeProjectDialog();
    });
    projectDialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeProjectDialog();
      }
    });
    projectDialog.addEventListener('close', function () {
      projectDialogVideo.removeAttribute('src');
      projectDialogVideo.hidden = true;
      projectDialogVideoPlaceholder.hidden = false;
      if (activeProjectCard) activeProjectCard.focus();
      activeProjectCard = null;
    });
  }

  const composingTabs = Array.from(document.querySelectorAll('.composing-tab[role="tab"]'));
  const composingPanels = composingTabs.map(function (tab) {
    return document.getElementById(tab.getAttribute('aria-controls'));
  });

  function activatecomposingTab(index, moveFocus) {
    if (index < 0 || index >= composingTabs.length) return;

    composingTabs.forEach(function (tab, tabIndex) {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (composingPanels[tabIndex]) {
        composingPanels[tabIndex].hidden = !selected;
      }
    });

    const selectedTab = composingTabs[index];
    const title = selectedTab.dataset.title;
    const background = selectedTab.dataset.background;
    const titleElement = document.querySelector('.content-page-title');
    if (titleElement && title) {
      titleElement.textContent = title;
      document.title = title + ' - Jack On Demand';
    }
    if (background !== undefined) {
      document.body.style.setProperty('--page-background', background === 'none' ? 'none' : "url('" + background + "')");
    }

    if (moveFocus) composingTabs[index].focus();
  }

  composingTabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      activatecomposingTab(index, false);
      if (tab.dataset.section) {
        window.history.pushState(null, '', '#' + tab.dataset.section);
      }
    });
    tab.addEventListener('keydown', function (event) {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % composingTabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + composingTabs.length) % composingTabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = composingTabs.length - 1;
      else return;

      event.preventDefault();
      activatecomposingTab(nextIndex, true);
    });
  });
  if (composingTabs.length) {
    function activateTabFromLocation() {
      const section = window.location.hash.slice(1);
      const hashIndex = composingTabs.findIndex(tab => tab.dataset.section === section);
      const selectedIndex = composingTabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
      activatecomposingTab(hashIndex >= 0 ? hashIndex : selectedIndex < 0 ? 0 : selectedIndex, false);
    }

    activateTabFromLocation();
    window.addEventListener('popstate', activateTabFromLocation);
    window.addEventListener('hashchange', activateTabFromLocation);
  }

  const intro = document.getElementById('intro');
  if (intro) {

    let introAudioFaded = false;
    const SCROLL_FADE_THRESHOLD = 500;
    const INTRO_AUDIO_FADE_DURATION = 5000;

    function fadeIntroAudio() {
      if (!introVideo || introAudioFaded) return;
      introAudioFaded = true;

      const startVolume = introVideo.volume;
      const startTime = performance.now();

      function step(currentTime) {
        const progress = Math.min(1, (currentTime - startTime) / INTRO_AUDIO_FADE_DURATION);
        introVideo.volume = startVolume * (1 - progress);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }

    function onScroll() {
      fadeIntroAudio();
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;

      if (scrollPosition > SCROLL_FADE_THRESHOLD && !intro.classList.contains('content-hidden')) {
        intro.classList.add('content-hidden');
      } else if (scrollPosition <= SCROLL_FADE_THRESHOLD && intro.classList.contains('content-hidden')) {
        intro.classList.remove('content-hidden');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Attempt to autoplay the intro video with sound. Browser policies may
    // block autoplay with audio, so we show a fallback button if needed.
    const introVideo = document.getElementById('intro-video');
    const videoFallback = document.getElementById('video-fallback');
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

    function playIntroVideo(reset = false) {
      if (!introVideo) return;
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
  }

  if (document.querySelector('.composing-track-list')) {
    const composingItems = [
    {
      title: 'Hypomnesic Dissociation',
      artist: 'Jack Konijnendijk',
      cover: 'images/Hypomnesic Dissociation.jpeg',
      audio: 'https://media.jackondemand.nl/Hypomnesic_Dissociation_Short.mp3',
      link: 'https://ffm.to/hypomnesic-dissociation'
    },
    {
      title: 'Lost In Descent',
      artist: 'Jack Konijnendijk',
      cover: 'images/Lost In Descent NEW NEW.jpg',
      audio: 'https://media.jackondemand.nl/Lost_In_Descent.mp3',
      link: 'https://ffm.to/lost-in-descent'
    },
    {
      title: 'Polaris',
      artist: 'Jack Konijnendijk',
      cover: 'images/Polaris.jpg',
      audio: 'https://media.jackondemand.nl/Polaris_Short.mp3',
      link: 'https://ffm.to/polaris-jk'
    }
    ];

  const composingPrev = document.querySelector('.composing-prev');
  const composingNext = document.querySelector('.composing-next');
  const composingLinkBtn = document.querySelector('.composing-link-btn');
  const composingCover = document.querySelector('.composing-cover');
  const composingCard = document.querySelector('.composing-player-card');
  const composingTitle = document.querySelector('.composing-title');
  const composingArtist = document.querySelector('.composing-artist');
  const composingPlayBtn = document.querySelector('.composing-play-btn');
  const composingAudio = document.querySelector('.composing-audio');
  const composingTrackList = document.querySelector('.composing-track-list');
  const trackButtons = [];

  composingItems.forEach(function (item, index) {
    if (!composingTrackList) return;
    const button = document.createElement('button');
    button.className = 'composing-track-item';
    button.type = 'button';
    button.dataset.index = String(index);
    button.textContent = item.title;
    composingTrackList.appendChild(button);
    trackButtons.push(button);
  });

  let currentcomposingIndex = 0;
  let iscomposingPlaying = false;

  function applycomposingTheme(src) {
    if (!composingCard) return;

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

      composingCard.style.background = `linear-gradient(145deg, rgba(${red}, ${green}, ${blue}, 0.95), rgba(10, 10, 12, 0.95))`;
      composingCard.style.borderColor = borderColor;
      composingCard.style.setProperty('--composing-accent', `rgb(${red}, ${green}, ${blue})`);
      composingCard.style.setProperty('--composing-accent-border', borderColor);
      composingCard.style.setProperty('--composing-control-bg', controlBg);
      composingCard.style.setProperty('--composing-control-text', textColor);
    };

    image.src = src || 'images/AudioJack SoundDesign.jpg';
  }

  function updatecomposingUI(index) {
    const item = composingItems[index] || composingItems[0];
    if (!item) return;

    if (composingCover) {
      const coverSrc = item.cover || 'images/AudioJack SoundDesign.jpg';
      composingCover.src = coverSrc;
      composingCover.alt = `${item.title || 'composing'} cover`;
      if (composingCover.complete) {
        applycomposingTheme(coverSrc);
      } else {
        composingCover.onload = () => applycomposingTheme(coverSrc);
      }
    }

    if (composingTitle) {
      composingTitle.textContent = item.title || 'Untitled Track';
    }

    if (composingArtist) {
      composingArtist.textContent = item.artist || 'Artist';
    }

    trackButtons.forEach(function (button) {
      const isActive = Number(button.dataset.index) === currentcomposingIndex;
      button.classList.toggle('active', isActive);
    });

    if (composingLinkBtn) {
      composingLinkBtn.href = item.link || 'https://distrokid.com/hyperfollow/jackkonijnendijk/lost-in-descent-2';
    }

    if (composingPlayBtn) {
      composingPlayBtn.textContent = iscomposingPlaying ? '⏸' : '◀';
      composingPlayBtn.disabled = !item.audio;
    }

    if (composingAudio) {
      if (!item.audio) {
        composingAudio.pause();
        composingAudio.removeAttribute('src');
        composingAudio.load();
      } else if (composingAudio.getAttribute('src') !== item.audio) {
        composingAudio.src = item.audio;
        composingAudio.load();
      }
    }
  }

  function setcomposingTrack(index, shouldPlay = false) {
    if (!composingItems.length) return;

    currentcomposingIndex = (index + composingItems.length) % composingItems.length;
    const item = composingItems[currentcomposingIndex];
    updatecomposingUI(currentcomposingIndex);

    if (composingAudio && shouldPlay && item && item.audio) {
      composingAudio.play().then(() => {
        iscomposingPlaying = true;
        if (composingPlayBtn) {
          composingPlayBtn.textContent = '⏸';
        }
      }).catch(() => {
        iscomposingPlaying = false;
        if (composingPlayBtn) {
          composingPlayBtn.textContent = '▶';
        }
      });
    } else {
      iscomposingPlaying = false;
      if (composingPlayBtn) {
        composingPlayBtn.textContent = '▶';
      }
    }
  }

  if (composingPrev && composingNext && composingPlayBtn && composingAudio) {
    composingPrev.addEventListener('click', function () {
      const previousIndex = (currentcomposingIndex - 1 + composingItems.length) % composingItems.length;
      setcomposingTrack(previousIndex, true);
    });

    composingNext.addEventListener('click', function () {
      const nextIndex = (currentcomposingIndex + 1) % composingItems.length;
      setcomposingTrack(nextIndex, true);
    });

    trackButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const index = Number(button.dataset.index);
        if (Number.isFinite(index)) {
          setcomposingTrack(index, false);
        }
      });
    });

    composingPlayBtn.addEventListener('click', function () {
      const item = composingItems[currentcomposingIndex];
      if (!item || !item.audio) return;

      if (composingAudio.paused) {
        composingAudio.play().then(() => {
          iscomposingPlaying = true;
          composingPlayBtn.textContent = '⏸';
        }).catch(() => {
          iscomposingPlaying = false;
          composingPlayBtn.textContent = '▶';
        });
      } else {
        composingAudio.pause();
        iscomposingPlaying = false;
        composingPlayBtn.textContent = '▶';
      }
    });
  }

  if (composingAudio) {
    composingAudio.addEventListener('ended', function () {
      const nextIndex = (currentcomposingIndex + 1) % composingItems.length;
      setcomposingTrack(nextIndex, true);
    });
  }

    setcomposingTrack(0, false);
  }

})();
