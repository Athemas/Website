<!-- Copilot instructions for the "Jack On Demand" static website -->
# Copilot Instructions

**Purpose**: Help AI coding agents make safe, targeted edits to this small static website. The project is a static HTML/CSS/JS site (no build tools). Changes should preserve simple, file-based structure and relative linking.

**Key Files**
- `index.html`: main page and example of card/list structure and the intro screen.
- `script.js`: DOM behavior (intro fade, scroll indicator, card viewer with FLIP animation, year injector).
- `style.css`: layout and visual patterns (full-bleed grid trick, intro styling, viewer styles).
- `projects.html`, `sound-projects.html`: currently empty placeholders — keep relative links consistent when adding pages.
- `images/`: holds all media assets referenced by pages.

**High-level architecture & rationale**
- Static, file-first site: pages are plain HTML, CSS and a single JS file. There is intentionally no bundler or backend; prefer minimal, client-side changes.
- UX: an intro fullscreen overlay (`#intro`) sits above the `main` content which is pushed down via `margin-top: 100vh` in `style.css`. The intro is faded/hidden based on scroll and user interaction to keep the page discoverable both via `file://` and via a static server.
- Cards: content items are represented as `.card` elements in the markup. Each `.card` uses `data-*` attributes to supply metadata for the viewer (see examples below).

**Project-specific patterns (concrete examples)**
- Config via data-attributes: `#intro` supports `data-fadepoint` and `data-debounce` (see `index.html` + `script.js`). Example: `<div id="intro" data-fadepoint="180" data-debounce="120">`.
- Card-to-viewer wiring: Cards use `data-large`, `data-title`, and `data-desc`. The JS opens the large image using `card.dataset.large` and falls back to `.card-thumb`'s `src` if absent. Keep this pattern when adding cards:

  `<article class="card" data-title="Title" data-desc="..." data-large="images/large.jpg">`\n  `<img class="card-thumb" src="images/thumb.jpg">`...

- Viewer FLIP animation: `script.js` performs a FLIP-style transform from thumbnail to the centered viewer. If you change element sizes/structure, preserve `.card-thumb` and `.viewer-box` selectors so FLIP calculations remain valid.
- Full-bleed grid trick: `.grid` uses `width: 100vw` plus `margin-left: calc(50% - 50vw)` to make content edge-to-edge while internal wrap content stays centered. Avoid removing this unless adjusting the whole site layout.
- Year injection: `script.js` sets `#year` to the current year — rely on this instead of hardcoding the year in HTML.

**Conventions & constraints**
- Keep changes minimal and static: avoid introducing build steps (Webpack, etc.) unless the maintainer asks.
- Use relative URLs for links and assets (e.g., `images/…`, `projects.html`) so hosting on GitHub Pages / Cloudflare Pages works out-of-the-box.
- Accessibility: the code uses `aria-*` attributes (e.g., viewer `aria-hidden` and indicator `aria-label`). Preserve or improve these where appropriate. Focus management (moving keyboard focus into the viewer) is not implemented — if you add it, ensure it degrades gracefully.

**Developer workflows & commands**
- No build step. To preview locally use a static HTTP server (recommended over `file://` for consistent behavior):

```powershell
python -m http.server 8000
# or
npx http-server -c-1 .
```

- Deployment: copy files to any static host (GitHub Pages or Cloudflare Pages). The footer already mentions those platforms.

**When modifying JS (`script.js`)**
- Preserve these selectors and behaviors: `#intro`, `.intro-center`, `#main`, `.card`, `.card-thumb`, `#viewer`, `.viewer-box`, `body.viewer-active`.
- Keep passive scroll listeners where used (`{ passive: true }`) to avoid performance regressions.
- If you refactor the viewer FLIP logic, ensure the opening/closing transitions and `transitionend` handling remain robust — the code assumes `viewerImg` transitions to detect animation end.

**When adding pages**
- Add HTML files at project root and link them with relative URLs (e.g., `projects.html`). Mirror the same `.card` markup pattern to reuse the viewer behavior.

**What NOT to change lightly**
- Do not remove the `margin-top: 100vh` on `.main-content` without also handling intro layout behavior in `script.js`.
- Avoid renaming `data-*` keys or class names referenced by `script.js` unless you update the selectors in the same change.

If anything in these notes is unclear or you'd like the instructions to be more prescriptive (e.g., add unit tests, lint rules, or a build step), tell me which area to expand and I will iterate.
