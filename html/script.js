/* Intro fade + scroll indicator + removal on scroll/wheel/touch/click
   Works when opened via file:// and when served by a local server.
*/

(function () {
  const intro = document.getElementById('intro');
  if (!intro) return; // nothing to do

  const introCenter = intro.querySelector('.intro-center');
  const main = document.getElementById('main');
  const YEAR = document.getElementById('year');
  if (YEAR) YEAR.textContent = new Date().getFullYear();

  // create a small scroll indicator button (clicking it scrolls to main)
  const indicator = document.createElement('button');
  indicator.className = 'scroll-indicator';
  indicator.setAttribute('aria-label', 'Scroll to content');
  indicator.innerHTML = '<span class="arrow" aria-hidden="true"></span>';
  intro.appendChild(indicator);

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

  // If user scrolls, adjust opacity. When past threshold, hide intro.
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const t = 1 - Math.min(y / fadePoint, 1);
    intro.style.opacity = t;

    // subtle fade/shift for the center text
    if (introCenter) {
      introCenter.style.opacity = String(0.6 + 0.4 * t); // between 0.6 and 1.0
      introCenter.style.transform = `translateY(${ -6 * (1 - t) }px)`;
    }

    // Apply main content background when intro fades (same settings as intro screen)
    if (main) {
      if (y >= fadePoint) {
        main.style.backgroundImage = "url('images/pixelartbg2.png')";
        main.style.backgroundSize = "cover";
        main.style.backgroundPosition = "center";
        main.style.backgroundAttachment = "fixed";
        main.style.imageRendering = "pixelated";
      } else {
        main.style.backgroundImage = "none";
      }
    }

    // Toggle intro-hidden based on scroll position. We update the visual
    // opacity/transform immediately, but debounce the class toggle that
    // hides/shows the intro to avoid rapid flicker when hovering the
    // threshold value.
    lastY = y;

    // If this is the first run (page load), set the visible/hidden state
    // immediately so the UI matches the current scroll position.
    if (firstRun) {
      firstRun = false;
      if (y >= fadePoint) {
        intro.classList.add('intro-hidden');
      } else {
        intro.classList.remove('intro-hidden');
      }
    } else {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (lastY >= fadePoint) {
          intro.classList.add('intro-hidden');
        } else {
          intro.classList.remove('intro-hidden');
        }
      }, debounceDelay);
    }
  }

  // Allow immediate removal on wheel/key/touch for discoverability
  function onUserInteract() {
    // Hide the intro immediately, but keep the scroll listener active so
    // the intro can reappear when the user scrolls back to the very top.
    intro.classList.add('intro-hidden');
    intro.style.opacity = 0;
    if (introCenter) {
      introCenter.style.opacity = '0';
      introCenter.style.transform = 'translateY(-8px)';
    }
    window.removeEventListener('wheel', onUserInteract);
    window.removeEventListener('keydown', onUserInteract);
    window.removeEventListener('touchstart', onUserInteract);
    // Cancel any pending debounce so the class state remains consistent.
    clearTimeout(debounceTimer);
  }

  // clicking the indicator scrolls to the main content and hides intro
  indicator.addEventListener('click', function () {
    if (main) main.scrollIntoView({ behavior: 'smooth' });
    onUserInteract();
  });

  // create debug indicator if requested
  createThresholdIndicator();

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

  // Attach click handlers to cards
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('click', function () {
      const large = card.dataset.large || (card.querySelector('.card-thumb') && card.querySelector('.card-thumb').src);
      const title = card.dataset.title || (card.querySelector('h4') && card.querySelector('h4').textContent);
      const desc = card.dataset.desc || (card.querySelector('p') && card.querySelector('p').textContent);
      if (large) openViewer(large, title, desc);
    });
  });

  // Attach listeners
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onUserInteract, { passive: true });
  window.addEventListener('keydown', onUserInteract, { passive: true });
  window.addEventListener('touchstart', onUserInteract, { passive: true });

  // If user loads the page already scrolled (rare), run once:
  onScroll();
})();
