# YouTube UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite KidTube to be visually indistinguishable from YouTube (dark mode) while retaining hidden parental controls, with PWA support for iPhone/iPad deployment.

**Architecture:** Single-file React app (kidtube.html) with Babel-in-browser compilation. No build step. PWA manifest and service worker as separate files. All parent controls hidden behind triple-tap logo gesture. Extensible 3-tier filter pipeline (allow → block → constraint).

**Tech Stack:** React 18 (CDN), Babel standalone (CDN), YouTube Data API v3, YouTube IFrame Player API, Service Worker API, Web App Manifest.

**Testing approach:** This is a zero-tooling single-file browser app — no test runner, no npm. Each task includes manual browser verification steps: launch `./start-kidtube.sh`, open `http://localhost:8080/kidtube.html`, verify specific behavior. Screenshots are taken via the browser to confirm rendering.

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `kidtube.html` | Rewrite | Entire app: CSS, React components, filter pipeline, YouTube API |
| `manifest.json` | Create | PWA manifest for "Add to Home Screen" |
| `service-worker.js` | Create | Asset caching, offline shell |
| `icons/icon-192.png` | Create | PWA icon (192x192) |
| `icons/icon-512.png` | Create | PWA icon (512x512) |
| `start-kidtube.sh` | Unchanged | Local dev server |

---

## Task 1: Create PWA Files

**Files:**
- Create: `manifest.json`
- Create: `service-worker.js`
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`

These are independent of kidtube.html and can be built first.

- [ ] **Step 1: Create manifest.json**

```json
{
  "name": "YouTube",
  "short_name": "YouTube",
  "description": "YouTube",
  "start_url": "/kidtube.html",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#0f0f0f",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Create service-worker.js**

```javascript
const CACHE_NAME = 'kidtube-v1';
const STATIC_ASSETS = [
  '/kidtube.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for YouTube API calls
  if (url.hostname === 'www.googleapis.com') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

- [ ] **Step 3: Generate PWA icons**

Create placeholder YouTube-style icons. Use an inline SVG-to-PNG approach or a simple red play button icon. Create the `icons/` directory and generate both sizes.

Generate icons using a small HTML canvas script, or create simple red-background PNG files with a white play triangle. The icons should look like the YouTube app icon: red rounded rectangle with white play button.

Run:
```bash
mkdir -p icons
```

Then create a small helper script that generates the PNGs using Python + Pillow, or use ImageMagick, or simply create them with an SVG converted to PNG. If neither tool is available, create a minimal valid PNG with the correct dimensions as a placeholder — the user can replace them with proper icons later.

- [ ] **Step 4: Verify PWA files exist**

Run:
```bash
ls -la manifest.json service-worker.js icons/
```

Expected: all three files/directory present.

- [ ] **Step 5: Commit**

```bash
git add manifest.json service-worker.js icons/
git commit -m "Add PWA manifest, service worker, and icons"
```

---

## Task 2: Rewrite HTML Head + CSS Design Tokens

**Files:**
- Modify: `kidtube.html` (replace everything from `<!DOCTYPE html>` through `</style>`)

This task replaces the entire `<head>` and `<style>` block with YouTube dark mode theming, PWA meta tags, and responsive base styles. The `<body>` is left unchanged for now — later tasks will replace the React components.

- [ ] **Step 1: Replace the HTML head and CSS**

Replace everything from line 1 (`<!DOCTYPE html>`) through line 413 (`</style>`) with the new head and CSS. Keep the closing `</head>` and everything from `<body>` onward untouched.

New `<head>` section:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#0f0f0f" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<link rel="manifest" href="/manifest.json" />
<title>YouTube</title>
```

New `<style>` block — YouTube dark mode design tokens and full CSS:

```css
<style>
  :root {
    --bg: #0f0f0f;
    --surface: #272727;
    --elevated: #181818;
    --border: #303030;
    --text-primary: #ffffff;
    --text-secondary: #aaaaaa;
    --text-tertiary: #717171;
    --accent-red: #ff0000;
    --accent-blue: #3ea6ff;
    --chip-active-bg: #ffffff;
    --chip-active-text: #0f0f0f;
    --chip-bg: #272727;
    --chip-text: #ffffff;
    --search-bg: #121212;
    --search-border: #303030;
    --search-btn-bg: #222222;
    --radius: 12px;
    --radius-sm: 8px;
    --radius-full: 9999px;
    --header-height: 56px;
    /* Filter tier colors */
    --allow-color: #48bb78;
    --block-color: #fc8181;
    --constraint-color: #7c9bf5;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Roboto', Arial, sans-serif;
    background: var(--bg);
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Header ── */
  .header {
    background: var(--bg);
    height: var(--header-height);
    padding: 0 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--border);
  }
  .header-logo {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }
  .header-logo svg { height: 20px; }
  .header-search {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  .header-search-inner {
    display: flex;
    max-width: 540px;
    width: 100%;
  }
  .search-input {
    flex: 1;
    background: var(--search-bg);
    border: 1px solid var(--search-border);
    border-right: none;
    border-radius: 20px 0 0 20px;
    padding: 8px 16px;
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    font-family: inherit;
  }
  .search-input::placeholder { color: var(--text-tertiary); }
  .search-input:focus { border-color: #1c62b9; }
  .search-btn {
    background: var(--search-btn-bg);
    border: 1px solid var(--search-border);
    border-radius: 0 20px 20px 0;
    padding: 0 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .search-btn svg { fill: var(--text-primary); }
  .mic-btn {
    background: var(--elevated);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-left: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .mic-btn svg { fill: var(--text-primary); }
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4285f4, #34a853);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 500;
  }
  /* Mobile search icon (shown < 640px) */
  .search-icon-btn {
    display: none;
    background: none;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .search-icon-btn svg { fill: var(--text-primary); }
  /* Mobile search overlay */
  .mobile-search-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-height);
    background: var(--bg);
    z-index: 150;
    padding: 8px;
    align-items: center;
    gap: 8px;
  }
  .mobile-search-overlay.active { display: flex; }
  .mobile-search-back {
    background: none;
    border: none;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .mobile-search-back svg { fill: var(--text-primary); }

  /* ── Category Chips ── */
  .chips-bar {
    padding: 12px 16px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    border-bottom: 1px solid var(--border);
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .chips-bar::-webkit-scrollbar { display: none; }
  .chip {
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
  }
  .chip.active {
    background: var(--chip-active-bg);
    color: var(--chip-active-text);
  }
  .chip:not(.active) {
    background: var(--chip-bg);
    color: var(--chip-text);
  }
  .chip:not(.active):hover {
    background: #3d3d3d;
  }

  /* ── Main Content ── */
  main { padding: 16px; max-width: 1284px; margin: 0 auto; }

  /* ── Video Grid (Home Feed) ── */
  .video-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .video-card {
    cursor: pointer;
  }
  .video-card:hover .video-title { color: var(--text-primary); }
  .thumb-wrap {
    position: relative;
    border-radius: var(--radius);
    overflow: hidden;
  }
  .thumb-wrap img {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
    display: block;
  }
  .duration-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: rgba(0,0,0,0.8);
    color: #fff;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
  .video-meta {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .channel-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--surface);
    flex-shrink: 0;
  }
  .video-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--text-primary);
  }
  .video-channel {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
  .video-stats {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* ── Search Results (Vertical List) ── */
  .search-results {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .search-result {
    display: flex;
    gap: 16px;
    cursor: pointer;
  }
  .search-result .thumb-wrap {
    flex-shrink: 0;
    width: 360px;
  }
  .search-result-info {
    flex: 1;
    min-width: 0;
  }
  .search-result-title {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--text-primary);
  }
  .search-result-stats {
    color: var(--text-secondary);
    font-size: 12px;
    margin-top: 6px;
  }
  .search-result-channel {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
  .search-result-channel .channel-avatar {
    width: 24px;
    height: 24px;
  }
  .search-result-channel span {
    color: var(--text-secondary);
    font-size: 12px;
  }
  .search-result-desc {
    color: var(--text-secondary);
    font-size: 12px;
    margin-top: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── Player Overlay ── */
  .player-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 20px;
  }
  .player-container {
    width: 100%;
    max-width: 680px;
  }
  .player-close {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  .player-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    border: none;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .player-close-btn:hover { background: rgba(255,255,255,0.2); }
  .player-body {
    background: #000;
    border-radius: var(--radius);
    overflow: hidden;
  }
  .player-body iframe,
  .player-body #yt-player-target {
    width: 100%;
    aspect-ratio: 16/9;
    display: block;
    border: none;
  }
  .player-info {
    padding: 16px;
  }
  .player-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--text-primary);
  }
  .player-channel-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
  }
  .player-channel-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }
  .player-channel-subs {
    font-size: 12px;
    color: var(--text-secondary);
  }
  .player-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
  .player-badge {
    background: var(--surface);
    padding: 6px 14px;
    border-radius: var(--radius-full);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 500;
  }
  .player-error {
    aspect-ratio: 16/9;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1a1a2e;
    color: white;
    padding: 20px;
    text-align: center;
    gap: 16px;
  }
  .player-error a {
    padding: 10px 24px;
    background: var(--accent-red);
    color: white;
    border-radius: var(--radius-sm);
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
  }

  /* ── Modal Overlay (Settings/PIN) ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    padding: 20px;
  }
  .modal {
    background: var(--elevated);
    border-radius: var(--radius);
    padding: 32px;
    max-width: 540px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    color: var(--text-primary);
  }
  .modal h2 { font-size: 20px; font-weight: 600; }
  .modal .subtitle {
    color: var(--text-secondary);
    font-size: 13px;
    margin-top: 4px;
    margin-bottom: 24px;
  }
  /* Filter tier sections in settings */
  .settings-tier {
    margin-bottom: 24px;
  }
  .settings-tier-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .settings-tier-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .settings-tier-title {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .settings-tier-hint {
    color: var(--text-tertiary);
    font-size: 11px;
  }
  .settings-tier-body {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .settings-label {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .settings-input,
  .settings-textarea,
  .settings-select {
    width: 100%;
    background: var(--search-bg);
    border: 1px solid var(--search-border);
    border-radius: 6px;
    padding: 10px 12px;
    color: var(--text-primary);
    font-size: 13px;
    font-family: inherit;
    outline: none;
  }
  .settings-textarea {
    resize: vertical;
    min-height: 60px;
  }
  .settings-input:focus,
  .settings-textarea:focus,
  .settings-select:focus {
    border-color: var(--accent-blue);
  }
  .settings-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .settings-row .settings-input {
    width: 80px;
    text-align: center;
  }
  .settings-btn-row {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    margin-top: 8px;
  }
  .btn-cancel {
    padding: 8px 20px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-cancel:hover { background: var(--surface); }
  .btn-save {
    padding: 8px 20px;
    background: var(--accent-blue);
    border: none;
    border-radius: var(--radius-full);
    color: var(--bg);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-save:hover { opacity: 0.9; }

  /* ── PIN Prompt ── */
  .pin-prompt { text-align: center; }
  .pin-prompt input {
    max-width: 200px;
    margin: 16px auto;
    text-align: center;
    font-size: 24px;
    letter-spacing: 8px;
    background: var(--search-bg);
    border: 1px solid var(--search-border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 10px;
    outline: none;
    display: block;
  }
  .pin-prompt input:focus { border-color: var(--accent-blue); }
  .pin-error {
    color: var(--block-color);
    font-size: 13px;
    margin-top: 8px;
  }

  /* ── Setup Screen ── */
  .setup-screen {
    max-width: 560px;
    margin: 80px auto;
    padding: 40px;
    background: var(--elevated);
    border-radius: var(--radius);
    text-align: center;
  }
  .setup-screen h2 { font-size: 24px; margin-bottom: 8px; }
  .setup-screen p { color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6; }
  .setup-screen input {
    width: 100%;
    padding: 12px 16px;
    background: var(--search-bg);
    border: 1px solid var(--search-border);
    border-radius: 10px;
    font-size: 15px;
    color: var(--text-primary);
    outline: none;
    margin-bottom: 16px;
  }
  .setup-screen input:focus { border-color: var(--accent-blue); }
  .setup-screen .instructions {
    text-align: left;
    background: var(--bg);
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 24px;
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-secondary);
  }
  .setup-screen .instructions strong { color: var(--text-primary); }
  .setup-screen .instructions code {
    background: var(--surface);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--accent-blue);
  }
  .setup-screen .instructions ol { padding-left: 20px; }
  .setup-screen .instructions a { color: var(--accent-blue); }
  .btn-primary {
    padding: 12px 32px;
    background: var(--accent-blue);
    color: var(--bg);
    border: none;
    border-radius: var(--radius-full);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-primary:hover { opacity: 0.9; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Loading / Status ── */
  .status-msg {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
    font-size: 16px;
  }
  .status-msg .emoji { font-size: 48px; display: block; margin-bottom: 16px; }

  /* ── Language list (parent settings) ── */
  .lang-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lang-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--search-bg);
    border: 1px solid var(--search-border);
    border-radius: 6px;
    padding: 6px 10px;
  }
  .lang-item-label {
    flex: 1;
    font-size: 13px;
    color: var(--text-primary);
  }
  .lang-item-priority {
    font-size: 11px;
    color: var(--text-tertiary);
  }
  .lang-item button {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 16px;
    padding: 2px 4px;
  }
  .lang-item button:hover { color: var(--text-primary); }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .video-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .video-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .video-grid { grid-template-columns: 1fr; }
    .header-search { display: none; }
    .search-icon-btn { display: flex; }
    .search-result { flex-direction: column; }
    .search-result .thumb-wrap { width: 100%; }
    .modal { padding: 20px; border-radius: var(--radius) var(--radius) 0 0; }
    .player-container { max-width: 100%; }
    .player-overlay { padding: 0; align-items: flex-start; }
    .player-close { position: absolute; top: 8px; right: 8px; z-index: 10; }
    .setup-screen { margin: 20px 16px; padding: 24px; }
  }
</style>
</head>
```

- [ ] **Step 2: Verify the page still loads**

Run: `./start-kidtube.sh` and open `http://localhost:8080/kidtube.html`

Expected: Page loads (dark background), existing React components render (they'll look broken since old CSS class names are gone — that's fine, we're replacing components next).

- [ ] **Step 3: Commit**

```bash
git add kidtube.html
git commit -m "Rewrite HTML head and CSS for YouTube dark mode theme"
```

---

## Task 3: Helper Functions + Filter Pipeline

**Files:**
- Modify: `kidtube.html` (replace the helper functions and add filter pipeline inside the `<script type="text/babel">` block)

This task replaces the existing helper functions and adds the new 3-tier filter pipeline. The components will be replaced in subsequent tasks.

- [ ] **Step 1: Replace helper functions and constants**

Replace the section from `const { useState, useEffect, useRef, useCallback } = React;` through the `function getBlockedList(str)` function (lines 424–468 of the original) with:

```jsx
const { useState, useEffect, useRef, useCallback } = React;

/* ─── Constants ─── */
const DEFAULT_SETTINGS = {
  apiKey: '',
  parentPin: '1234',
  maxDuration: 10,
  blockedKeywords: '',
  blockedChannels: '',
  allowedChannels: '',
  safeSearch: 'strict',
  languages: [],  // ordered list of language codes, e.g. ['fr', 'en']
};

const TOPICS = [
  'Dinosaurs', 'Space', 'Lego', 'Animals', 'Science',
  'Drawing', 'Music', 'Magic Tricks', 'Nature', 'Cartoons',
];

/* ─── Settings persistence ─── */
function loadSettings() {
  try {
    const raw = localStorage.getItem('kidtube_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) {
  localStorage.setItem('kidtube_settings', JSON.stringify(s));
}

/* ─── Duration helpers ─── */
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
}
function fmtDuration(seconds) {
  const h = Math.floor(seconds/3600);
  const m = Math.floor((seconds%3600)/60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

/* ─── View count formatter ─── */
function fmtViews(n) {
  if (!n) return '';
  const num = parseInt(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M views';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K views';
  return num + ' views';
}

/* ─── Relative time ─── */
function fmtTimeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = [
    [31536000, 'year'], [2592000, 'month'], [604800, 'week'],
    [86400, 'day'], [3600, 'hour'], [60, 'minute'],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/* ─── CSV parsing ─── */
function parseList(str) {
  return (str || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

/* ─── 3-Tier Filter Pipeline ─── */

// Tier 1: Allow rules — return 'allow' to bypass all other filters
const ALLOW_FILTERS = [
  function allowedChannels(video, settings) {
    const allowed = parseList(settings.allowedChannels);
    if (allowed.length === 0) return 'pass';
    const ch = video.snippet.channelTitle.toLowerCase();
    return allowed.some(a => ch.includes(a) || a.includes(ch)) ? 'allow' : 'pass';
  },
];

// Tier 2: Block rules — return 'block' to reject
const BLOCK_FILTERS = [
  function blockedKeywords(video, settings) {
    const blocked = parseList(settings.blockedKeywords);
    if (blocked.length === 0) return 'pass';
    const text = (video.snippet.title + ' ' + (video.snippet.description || '')).toLowerCase();
    return blocked.some(kw => text.includes(kw)) ? 'block' : 'pass';
  },
  function blockedChannels(video, settings) {
    const blocked = parseList(settings.blockedChannels);
    if (blocked.length === 0) return 'pass';
    const ch = video.snippet.channelTitle.toLowerCase();
    return blocked.some(b => ch.includes(b) || b.includes(ch)) ? 'block' : 'pass';
  },
];

// Tier 3: Constraint filters — return 'block' if constraint fails, 'pass' if ok
const CONSTRAINT_FILTERS = [
  function maxDuration(video, settings) {
    const maxSec = (settings.maxDuration || 10) * 60;
    return video.durationSec > maxSec ? 'block' : 'pass';
  },
  function languageFilter(video, settings) {
    const langs = settings.languages || [];
    if (langs.length === 0) return 'pass';
    const videoLang = (video.snippet.defaultLanguage || video.snippet.defaultAudioLanguage || '').toLowerCase();
    if (!videoLang) return 'pass'; // no language metadata, let it through
    return langs.some(l => videoLang.startsWith(l.toLowerCase())) ? 'pass' : 'block';
  },
];

function runFilterPipeline(videos, settings) {
  return videos.filter(video => {
    // Tier 1: Allow rules
    for (const fn of ALLOW_FILTERS) {
      if (fn(video, settings) === 'allow') return true;
    }
    // Tier 2: Block rules
    for (const fn of BLOCK_FILTERS) {
      if (fn(video, settings) === 'block') return false;
    }
    // Tier 3: Constraints (must pass all)
    for (const fn of CONSTRAINT_FILTERS) {
      if (fn(video, settings) === 'block') return false;
    }
    return true;
  });
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: Open `http://localhost:8080/kidtube.html` in the browser, open DevTools console (Cmd+Option+J).

Expected: No Babel compilation errors. The page may look broken (components not yet updated) but no red console errors about the helper/filter code.

- [ ] **Step 3: Commit**

```bash
git add kidtube.html
git commit -m "Add 3-tier filter pipeline and updated helper functions"
```

---

## Task 4: YouTube API Functions

**Files:**
- Modify: `kidtube.html` (replace the YouTube API functions)

Update the API functions to support the language parameter and return richer data.

- [ ] **Step 1: Replace YouTube API functions**

Replace the existing `searchYouTube` and `getVideoDetails` functions with:

```jsx
/* ─── YouTube API ─── */
async function searchYouTube(apiKey, query, settings, pageToken = '') {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query + ' for kids',
    type: 'video',
    maxResults: '24',
    safeSearch: settings.safeSearch || 'strict',
    key: apiKey,
    ...(pageToken ? { pageToken } : {}),
  });
  // Bias results toward first preferred language
  const langs = settings.languages || [];
  if (langs.length > 0) {
    params.set('relevanceLanguage', langs[0]);
  }
  const resp = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!resp.ok) throw new Error(`YouTube search failed (${resp.status})`);
  return resp.json();
}

async function getVideoDetails(apiKey, ids) {
  const params = new URLSearchParams({
    part: 'contentDetails,snippet,statistics',
    id: ids.join(','),
    key: apiKey,
  });
  const resp = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!resp.ok) throw new Error(`YouTube details failed (${resp.status})`);
  return resp.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add kidtube.html
git commit -m "Update YouTube API functions with language and safeSearch support"
```

---

## Task 5: React Components — Header + Triple-Tap

**Files:**
- Modify: `kidtube.html` (replace the `Logo` component, add `Header` component)

- [ ] **Step 1: Replace Logo and add Header component**

Remove the existing `Logo` component. Add these components in its place (after the YouTube API functions, before any other components):

```jsx
/* ─── Components ─── */

function YTLogo({ onTripleTap }) {
  const tapRef = useRef([]);

  function handleTap() {
    const now = Date.now();
    tapRef.current.push(now);
    // Keep only taps within 500ms window
    tapRef.current = tapRef.current.filter(t => now - t < 500);
    if (tapRef.current.length >= 3) {
      tapRef.current = [];
      onTripleTap();
    }
  }

  return (
    <div className="header-logo" onClick={handleTap}>
      <svg viewBox="0 0 90 20" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="28" height="20" rx="4" fill="#ff0000"/>
        <polygon points="11,4 11,16 21,10" fill="white"/>
        <text x="33" y="15" fill="white" fontSize="16" fontWeight="700" fontFamily="Roboto, Arial, sans-serif">YouTube</text>
      </svg>
    </div>
  );
}

function Header({ query, onQueryChange, onSearch, onTripleTap }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch();
    setMobileSearchOpen(false);
  }

  return (
    <>
      <header className="header">
        <YTLogo onTripleTap={onTripleTap} />

        <div className="header-search">
          <form className="header-search-inner" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              placeholder="Search"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
            />
            <button className="search-btn" type="submit">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
            <button className="mic-btn" type="button" tabIndex={-1}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            </button>
          </form>
        </div>

        {/* Mobile search icon (visible < 640px) */}
        <button className="search-icon-btn" onClick={() => setMobileSearchOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>

        <div className="header-right">
          <div className="avatar">K</div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="mobile-search-overlay active">
          <button className="mobile-search-back" onClick={() => setMobileSearchOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          </button>
          <form style={{flex:1, display:'flex'}} onSubmit={handleSubmit}>
            <input
              ref={mobileInputRef}
              className="search-input"
              style={{borderRadius:20, borderRight:'1px solid var(--search-border)'}}
              type="text"
              placeholder="Search YouTube"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
            />
          </form>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add kidtube.html
git commit -m "Add YouTube-style header with triple-tap logo and mobile search"
```

---

## Task 6: React Components — Setup Screen + PIN Prompt

**Files:**
- Modify: `kidtube.html` (replace `SetupScreen` and `PinPrompt` components)

- [ ] **Step 1: Replace SetupScreen and PinPrompt**

Replace the existing `SetupScreen` and `PinPrompt` components with dark-themed versions:

```jsx
function SetupScreen({ onSave }) {
  const [key, setKey] = useState('');
  const [pin, setPin] = useState('1234');
  return (
    <div className="setup-screen">
      <h2>Welcome to YouTube</h2>
      <p>Let's get set up — this only takes a minute.</p>
      <div className="instructions">
        <strong>How to get a free YouTube API key:</strong>
        <ol>
          <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener">console.cloud.google.com</a></li>
          <li>Create a new project (or pick an existing one)</li>
          <li>Go to <strong>APIs &amp; Services → Library</strong></li>
          <li>Search for <code>YouTube Data API v3</code> and <strong>Enable</strong> it</li>
          <li>Go to <strong>APIs &amp; Services → Credentials</strong></li>
          <li>Click <strong>Create Credentials → API Key</strong></li>
          <li>Copy the key and paste it below</li>
        </ol>
        <p style={{marginTop:'10px'}}>The free tier gives you ~10,000 units/day — plenty for casual use.</p>
      </div>
      <input
        type="text"
        placeholder="Paste your YouTube API key here"
        value={key}
        onChange={e => setKey(e.target.value)}
      />
      <label style={{display:'block', textAlign:'left', fontWeight:600, fontSize:14, marginBottom:6, color:'var(--text-secondary)'}}>
        Parent PIN (to access settings later)
      </label>
      <input
        type="password"
        placeholder="4-digit PIN"
        maxLength={6}
        value={pin}
        onChange={e => setPin(e.target.value)}
        style={{maxWidth:200, margin:'0 auto 16px', textAlign:'center', letterSpacing:6, fontSize:20}}
      />
      <br/>
      <button
        className="btn-primary"
        disabled={!key.trim()}
        onClick={() => {
          const settings = { ...DEFAULT_SETTINGS, apiKey: key.trim(), parentPin: pin || '1234' };
          saveSettings(settings);
          onSave(settings);
        }}
      >
        Get Started
      </button>
    </div>
  );
}

function PinPrompt({ onSuccess, onCancel, correctPin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal pin-prompt" onClick={e => e.stopPropagation()}>
        <h2>Parent Access</h2>
        <p style={{color:'var(--text-secondary)', marginTop:4}}>Enter your PIN to open settings</p>
        <input
          type="password"
          maxLength={6}
          value={pin}
          autoFocus
          onChange={e => { setPin(e.target.value); setError(''); }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (pin === correctPin) onSuccess();
              else setError('Wrong PIN, try again');
            }
          }}
        />
        {error && <div className="pin-error">{error}</div>}
        <div className="settings-btn-row" style={{justifyContent:'center', borderTop:'none', paddingTop:0}}>
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-save" onClick={() => {
            if (pin === correctPin) onSuccess();
            else setError('Wrong PIN, try again');
          }}>Unlock</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add kidtube.html
git commit -m "Add dark-themed setup screen and PIN prompt"
```

---

## Task 7: React Components — Settings Modal

**Files:**
- Modify: `kidtube.html` (replace `SettingsModal` component)

- [ ] **Step 1: Replace SettingsModal with tier-grouped version**

Replace the existing `SettingsModal` component:

```jsx
function LanguageList({ languages, onChange }) {
  function addLang() {
    const code = prompt('Enter language code (e.g. fr, en, es, de):');
    if (code && code.trim()) {
      onChange([...languages, code.trim().toLowerCase()]);
    }
  }
  function removeLang(idx) {
    onChange(languages.filter((_, i) => i !== idx));
  }
  function moveLang(idx, dir) {
    const arr = [...languages];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange(arr);
  }

  const LANG_NAMES = {
    en:'English', fr:'French', es:'Spanish', de:'German', it:'Italian',
    pt:'Portuguese', nl:'Dutch', ru:'Russian', ja:'Japanese', ko:'Korean',
    zh:'Chinese', ar:'Arabic', hi:'Hindi', sv:'Swedish', pl:'Polish',
    ro:'Romanian', tr:'Turkish',
  };

  return (
    <div>
      <div className="lang-list">
        {languages.map((lang, i) => (
          <div key={i} className="lang-item">
            <span className="lang-item-label">{LANG_NAMES[lang] || lang}</span>
            <span className="lang-item-priority">{i === 0 ? 'primary' : 'fallback'}</span>
            <button onClick={() => moveLang(i, -1)} title="Move up">↑</button>
            <button onClick={() => moveLang(i, 1)} title="Move down">↓</button>
            <button onClick={() => removeLang(i)} title="Remove">×</button>
          </div>
        ))}
      </div>
      <button
        onClick={addLang}
        style={{
          marginTop:8, padding:'6px 14px', background:'var(--surface)',
          border:'1px solid var(--border)', borderRadius:6, color:'var(--text-secondary)',
          fontSize:12, cursor:'pointer', fontFamily:'inherit',
        }}
      >+ Add language</button>
    </div>
  );
}

function SettingsModal({ settings, onSave, onCancel }) {
  const [s, setS] = useState({ ...settings });
  const upd = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Parent Settings</h2>
        <div className="subtitle">Control what your kid can see</div>

        {/* Tier 1: Allow Rules */}
        <div className="settings-tier">
          <div className="settings-tier-header">
            <div className="settings-tier-dot" style={{background:'var(--allow-color)'}}></div>
            <div className="settings-tier-title" style={{color:'var(--allow-color)'}}>Allow Rules</div>
            <div className="settings-tier-hint">(always shown, override blocks)</div>
          </div>
          <div className="settings-tier-body">
            <div>
              <div className="settings-label">Allowed Channels</div>
              <textarea className="settings-textarea" value={s.allowedChannels}
                onChange={e => upd('allowedChannels', e.target.value)}
                placeholder="e.g. Cocomelon, National Geographic Kids, SciShow Kids" />
            </div>
          </div>
        </div>

        {/* Tier 2: Block Rules */}
        <div className="settings-tier">
          <div className="settings-tier-header">
            <div className="settings-tier-dot" style={{background:'var(--block-color)'}}></div>
            <div className="settings-tier-title" style={{color:'var(--block-color)'}}>Block Rules</div>
            <div className="settings-tier-hint">(hidden from results)</div>
          </div>
          <div className="settings-tier-body">
            <div>
              <div className="settings-label">Blocked Keywords</div>
              <textarea className="settings-textarea" value={s.blockedKeywords}
                onChange={e => upd('blockedKeywords', e.target.value)}
                placeholder="e.g. prank, unboxing, scary, horror, gun, violence" />
            </div>
            <div>
              <div className="settings-label">Blocked Channels</div>
              <textarea className="settings-textarea" value={s.blockedChannels || ''}
                onChange={e => upd('blockedChannels', e.target.value)}
                placeholder="e.g. 5-Minute Crafts, Troom Troom" />
            </div>
          </div>
        </div>

        {/* Tier 3: Constraints */}
        <div className="settings-tier">
          <div className="settings-tier-header">
            <div className="settings-tier-dot" style={{background:'var(--constraint-color)'}}></div>
            <div className="settings-tier-title" style={{color:'var(--constraint-color)'}}>Constraints</div>
            <div className="settings-tier-hint">(must pass all)</div>
          </div>
          <div className="settings-tier-body">
            <div className="settings-row">
              <div className="settings-label" style={{marginBottom:0}}>Max Duration (min)</div>
              <input className="settings-input" type="number" min={1} max={120}
                value={s.maxDuration}
                onChange={e => upd('maxDuration', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <div className="settings-label">Languages (ordered by priority)</div>
              <LanguageList
                languages={s.languages || []}
                onChange={langs => upd('languages', langs)}
              />
            </div>
            <div className="settings-row">
              <div className="settings-label" style={{marginBottom:0}}>SafeSearch</div>
              <select className="settings-select" style={{width:'auto'}}
                value={s.safeSearch} onChange={e => upd('safeSearch', e.target.value)}>
                <option value="strict">Strict</option>
                <option value="moderate">Moderate</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* System */}
        <div className="settings-tier">
          <div className="settings-tier-header">
            <div className="settings-tier-dot" style={{background:'var(--text-tertiary)'}}></div>
            <div className="settings-tier-title" style={{color:'var(--text-tertiary)'}}>System</div>
          </div>
          <div className="settings-tier-body">
            <div>
              <div className="settings-label">YouTube API Key</div>
              <input className="settings-input" type="text" value={s.apiKey}
                onChange={e => upd('apiKey', e.target.value)} />
            </div>
            <div>
              <div className="settings-label">Parent PIN</div>
              <input className="settings-input" type="password" value={s.parentPin}
                onChange={e => upd('parentPin', e.target.value)}
                style={{maxWidth:200, letterSpacing:6}} maxLength={6} />
            </div>
          </div>
        </div>

        <div className="settings-btn-row">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-save" onClick={() => { saveSettings(s); onSave(s); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add kidtube.html
git commit -m "Add tier-grouped settings modal with language priority list"
```

---

## Task 8: React Components — Video Cards + Category Chips

**Files:**
- Modify: `kidtube.html` (replace `VideoCard`, `FilterBar` components, add `ChipsBar`)

- [ ] **Step 1: Replace VideoCard and add ChipsBar**

Remove the existing `VideoCard` and `FilterBar` components. Add these in their place:

```jsx
function VideoCard({ video, onClick }) {
  return (
    <div className="video-card" onClick={() => onClick(video.id)}>
      <div className="thumb-wrap">
        <img
          src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url}
          alt={video.snippet.title}
          loading="lazy" />
        {video.durationSec != null && (
          <div className="duration-badge">{fmtDuration(video.durationSec)}</div>
        )}
      </div>
      <div className="video-meta">
        <div className="channel-avatar"></div>
        <div>
          <div className="video-title">{video.snippet.title}</div>
          <div className="video-channel">{video.snippet.channelTitle}</div>
          <div className="video-stats">
            {fmtViews(video.statistics?.viewCount)}
            {video.snippet.publishedAt ? ` · ${fmtTimeAgo(video.snippet.publishedAt)}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResult({ video, onClick }) {
  return (
    <div className="search-result" onClick={() => onClick(video.id)}>
      <div className="thumb-wrap">
        <img
          src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url}
          alt={video.snippet.title}
          loading="lazy" />
        {video.durationSec != null && (
          <div className="duration-badge">{fmtDuration(video.durationSec)}</div>
        )}
      </div>
      <div className="search-result-info">
        <div className="search-result-title">{video.snippet.title}</div>
        <div className="search-result-stats">
          {fmtViews(video.statistics?.viewCount)}
          {video.snippet.publishedAt ? ` · ${fmtTimeAgo(video.snippet.publishedAt)}` : ''}
        </div>
        <div className="search-result-channel">
          <div className="channel-avatar"></div>
          <span>{video.snippet.channelTitle}</span>
        </div>
        {video.snippet.description && (
          <div className="search-result-desc">{video.snippet.description}</div>
        )}
      </div>
    </div>
  );
}

function ChipsBar({ topics, activeTopic, onSelect }) {
  return (
    <div className="chips-bar">
      <button
        className={'chip' + (activeTopic === null ? ' active' : '')}
        onClick={() => onSelect(null)}
      >All</button>
      {topics.map(t => (
        <button
          key={t}
          className={'chip' + (activeTopic === t ? ' active' : '')}
          onClick={() => onSelect(t)}
        >{t}</button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add kidtube.html
git commit -m "Add YouTube-style video cards, search results, and category chips"
```

---

## Task 9: React Components — Player Modal

**Files:**
- Modify: `kidtube.html` (replace `PlayerOverlay` component)

- [ ] **Step 1: Replace PlayerOverlay**

Replace the existing `PlayerOverlay` component:

```jsx
function PlayerOverlay({ video, onClose }) {
  const playerRef = useRef(null);
  const [playerError, setPlayerError] = useState(null);

  useEffect(() => {
    setPlayerError(null);

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    function createPlayer() {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }
      playerRef.current = new window.YT.Player('yt-player-target', {
        videoId: video.id,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onError: (event) => {
            const code = event.data;
            if (code === 101 || code === 150) setPlayerError('embed');
            else if (code === 100) setPlayerError('notfound');
            else setPlayerError('generic');
          },
        },
      });
    }

    if (window.YT && window.YT.Player) createPlayer();
    else window.onYouTubeIframeAPIReady = createPlayer;

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [video.id]);

  const ytLink = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <div className="player-overlay" onClick={onClose}>
      <div className="player-container" onClick={e => e.stopPropagation()}>
        <div className="player-close">
          <button className="player-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="player-body">
          {playerError ? (
            <div className="player-error">
              <div style={{fontSize:'36px'}}>
                {playerError === 'embed' ? '🔒' : playerError === 'notfound' ? '🔍' : '⚠️'}
              </div>
              <div style={{fontSize:'16px', maxWidth:'400px', lineHeight:'1.5'}}>
                {playerError === 'embed'
                  ? "This video doesn't allow embedded playback."
                  : playerError === 'notfound'
                  ? "This video wasn't found or has been removed."
                  : "Something went wrong loading this video."}
              </div>
              {playerError === 'embed' && (
                <a href={ytLink} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube.com
                </a>
              )}
            </div>
          ) : (
            <div id="yt-player-target" style={{width:'100%', aspectRatio:'16/9'}} />
          )}
          <div className="player-info">
            <div className="player-title">{video.snippet.title}</div>
            <div className="player-channel-row">
              <div className="channel-avatar"></div>
              <div>
                <div className="player-channel-name">{video.snippet.channelTitle}</div>
              </div>
            </div>
            <div className="player-badges">
              {video.statistics?.likeCount && (
                <span className="player-badge">👍 {fmtViews(video.statistics.likeCount).replace(' views','')}</span>
              )}
              {video.statistics?.viewCount && (
                <span className="player-badge">{fmtViews(video.statistics.viewCount)}</span>
              )}
              {video.snippet.publishedAt && (
                <span className="player-badge">{fmtTimeAgo(video.snippet.publishedAt)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add kidtube.html
git commit -m "Add enhanced player modal with video info and metadata badges"
```

---

## Task 10: React Components — App (Root Component)

**Files:**
- Modify: `kidtube.html` (replace the `App` component and the `ReactDOM.createRoot` call)

This is the main wiring task — connects all components, manages state, handles search + chip navigation + view switching.

- [ ] **Step 1: Replace the App component**

Replace everything from `function App()` through `ReactDOM.createRoot(document.getElementById('app')).render(<App />);` with:

```jsx
function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const [isSearchView, setIsSearchView] = useState(false);
  const [searchFilter, setSearchFilter] = useState('all');
  const [initialLoaded, setInitialLoaded] = useState(false);

  const isSetup = Boolean(settings.apiKey);

  /* ── Search logic ── */
  const doSearch = useCallback(async (q, isTopicSearch = false) => {
    if (!q.trim() || !settings.apiKey) return;
    setLoading(true);
    setError('');
    try {
      const searchResp = await searchYouTube(settings.apiKey, q, settings);
      const ids = searchResp.items.map(i => i.id.videoId).filter(Boolean);
      if (!ids.length) { setVideos([]); setLoading(false); return; }
      const detailResp = await getVideoDetails(settings.apiKey, ids);
      const enriched = detailResp.items.map(item => ({
        ...item,
        durationSec: parseDuration(item.contentDetails.duration),
      }));
      setVideos(runFilterPipeline(enriched, settings));
      if (!isTopicSearch) setIsSearchView(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  }, [settings]);

  /* ── Initial load: pick random topic ── */
  useEffect(() => {
    if (isSetup && !initialLoaded) {
      setInitialLoaded(true);
      const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      setActiveTopic(null); // "All" chip active
      doSearch(randomTopic, true);
    }
  }, [isSetup, initialLoaded, doSearch]);

  /* ── Chip selection ── */
  function handleChipSelect(topic) {
    setActiveTopic(topic);
    setIsSearchView(false);
    setSearchFilter('all');
    const q = topic || TOPICS[Math.floor(Math.random() * TOPICS.length)];
    doSearch(q, true);
  }

  /* ── User search ── */
  function handleSearch() {
    if (query.trim()) {
      setActiveTopic(null);
      doSearch(query, false);
    }
  }

  /* ── Search result filter chips ── */
  function getFilteredVideos() {
    if (searchFilter === 'short') return videos.filter(v => v.durationSec <= 240);
    if (searchFilter === 'recent') {
      return [...videos].sort((a, b) =>
        new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
      );
    }
    return videos;
  }

  /* ── Keyboard: Escape ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (playingVideo) setPlayingVideo(null);
        else if (showSettings) setShowSettings(false);
        else if (showPin) setShowPin(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playingVideo, showSettings, showPin]);

  /* ── Find full video object for player ── */
  function handleVideoClick(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (video) setPlayingVideo(video);
  }

  /* ── Not set up ── */
  if (!isSetup) {
    return <SetupScreen onSave={(s) => setSettings(s)} />;
  }

  const displayVideos = getFilteredVideos();

  return (
    <>
      <Header
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onTripleTap={() => setShowPin(true)}
      />

      <ChipsBar
        topics={TOPICS}
        activeTopic={activeTopic}
        onSelect={handleChipSelect}
      />

      <main>
        {loading && (
          <div className="status-msg">
            <span className="emoji">⏳</span>Finding great videos...
          </div>
        )}

        {error && (
          <div className="status-msg" style={{color:'var(--block-color)'}}>
            <span className="emoji">😕</span>{error}
          </div>
        )}

        {!loading && !error && videos.length === 0 && initialLoaded && (
          <div className="status-msg">
            <span className="emoji">🔍</span>No videos found. Try a different search!
          </div>
        )}

        {!loading && !error && displayVideos.length > 0 && isSearchView && (
          <>
            <div className="chips-bar" style={{padding:'0 0 16px', borderBottom:'none'}}>
              {['all', 'short', 'recent'].map(f => (
                <button
                  key={f}
                  className={'chip' + (searchFilter === f ? ' active' : '')}
                  onClick={() => setSearchFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'short' ? 'Short (< 4 min)' : 'Recently uploaded'}
                </button>
              ))}
            </div>
            <div className="search-results">
              {displayVideos.map(v => (
                <SearchResult key={v.id} video={v} onClick={handleVideoClick} />
              ))}
            </div>
          </>
        )}

        {!loading && !error && displayVideos.length > 0 && !isSearchView && (
          <div className="video-grid">
            {displayVideos.map(v => (
              <VideoCard key={v.id} video={v} onClick={handleVideoClick} />
            ))}
          </div>
        )}
      </main>

      {playingVideo && (
        <PlayerOverlay video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}

      {showPin && !showSettings && (
        <PinPrompt
          correctPin={settings.parentPin}
          onSuccess={() => { setShowPin(false); setShowSettings(true); }}
          onCancel={() => setShowPin(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={(s) => { setSettings(s); setShowSettings(false); }}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
```

- [ ] **Step 2: Add service worker registration at the end of the file**

Just before the closing `</script>` tag (but outside the Babel script block), add a new plain script block. Place it after the closing `</script>` of the Babel block and before `</body>`:

```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
}
</script>
```

- [ ] **Step 3: Verify the full app works**

Run: `./start-kidtube.sh` and open `http://localhost:8080/kidtube.html`

Verify:
1. If no API key stored: setup screen appears in dark theme
2. After entering API key: home feed loads with random topic, category chips visible
3. Click a chip: grid updates with that topic's videos
4. Type a search: results show in vertical list layout
5. Click a video: player modal opens with video info below
6. Escape closes modal
7. Triple-tap the YouTube logo: PIN prompt appears
8. Enter PIN: settings modal shows with tier-grouped filters
9. On mobile viewport (DevTools responsive mode, 375px): search icon replaces search bar, grid becomes 1 column

- [ ] **Step 4: Commit**

```bash
git add kidtube.html
git commit -m "Wire up App component with home feed, search, and all views"
```

---

## Task 11: Generate PWA Icons

**Files:**
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`

- [ ] **Step 1: Generate YouTube-style icons**

Create a small Python script to generate the icons using Pillow, or create them with ImageMagick. The icon should be a red rounded rectangle (#ff0000) with a white play triangle — matching the YouTube app icon.

Using Python + Pillow:

```python
# generate-icons.py (temporary, delete after)
from PIL import Image, ImageDraw
import os

os.makedirs('icons', exist_ok=True)

for size in [192, 512]:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = size * 0.1
    r = size * 0.15
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=r, fill='#ff0000'
    )
    # Play triangle
    cx, cy = size / 2, size / 2
    tri_size = size * 0.22
    draw.polygon([
        (cx - tri_size * 0.4, cy - tri_size),
        (cx - tri_size * 0.4, cy + tri_size),
        (cx + tri_size * 0.8, cy),
    ], fill='white')
    img.save(f'icons/icon-{size}.png')
    print(f'Created icons/icon-{size}.png')
```

Run:
```bash
python3 generate-icons.py
rm generate-icons.py
```

If Pillow is not installed, try: `pip3 install Pillow` first, or use ImageMagick as a fallback:
```bash
convert -size 192x192 xc:none -fill '#ff0000' -draw 'roundrectangle 19,19 173,173 29,29' -fill white -draw 'polygon 72,38 72,154 154,96' icons/icon-192.png
convert -size 512x512 xc:none -fill '#ff0000' -draw 'roundrectangle 51,51 461,461 77,77' -fill white -draw 'polygon 192,102 192,410 410,256' icons/icon-512.png
```

- [ ] **Step 2: Verify icons exist and look correct**

Run:
```bash
ls -la icons/
file icons/icon-192.png icons/icon-512.png
```

Expected: Two PNG files, 192x192 and 512x512.

- [ ] **Step 3: Commit**

```bash
git add icons/
git commit -m "Add PWA icons"
```

---

## Task 12: Final Verification + CLAUDE.md Update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md to reflect new architecture**

Update CLAUDE.md to describe the redesigned app:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

KidTube is a filtered YouTube wrapper for parents, disguised as YouTube. Single-page React app (Babel-in-browser, no build step) that calls the YouTube Data API v3 directly from the client. Parent controls are hidden behind a triple-tap gesture on the logo and protected by PIN.

## Running

```bash
./start-kidtube.sh
# Opens at http://localhost:8080/kidtube.html
```

Requires a YouTube Data API v3 key (entered on first launch, stored in localStorage).

## Architecture

**kidtube.html** is the entire app — CSS, React components, filter pipeline, and YouTube API integration. No build system, no bundler, no package manager.

**Supporting files:**
- `manifest.json` — PWA manifest for "Add to Home Screen"
- `service-worker.js` — caches static assets, network-first for API calls
- `icons/` — PWA icons (192px, 512px)

**Key architecture:**
- **3-tier filter pipeline:** Allow rules (highest priority, bypass all other filters) → Block rules → Constraint filters. Each filter is a function returning `"allow"`, `"block"`, or `"pass"`. Add new filters by writing one function and registering it in the appropriate tier array.
- **Views:** Home feed (grid + category chips), search results (vertical list), video player (modal overlay)
- **Parent access:** Triple-tap logo (3 taps within 500ms) → PIN prompt → settings modal grouped by filter tier
- **Settings:** Stored in localStorage under `kidtube_settings`

**Design tokens:** YouTube dark mode — `#0f0f0f` background, `#272727` surface, `#ff0000` red accent, `#3ea6ff` blue accent.

**External dependencies (CDN only):** React 18, ReactDOM 18, Babel standalone 7, YouTube IFrame Player API (loaded on-demand).
```

- [ ] **Step 2: Full browser verification**

Open `http://localhost:8080/kidtube.html` and verify:

1. **Setup flow:** Clear localStorage, refresh — dark setup screen appears
2. **Home feed:** After API key entry, grid of videos with category chips
3. **Chip navigation:** Click a chip, grid updates
4. **Search:** Type query, submit — vertical list results with filter chips
5. **Player:** Click video — modal opens, video plays, info + badges below
6. **Player error:** Test with a known non-embeddable video ID if possible
7. **Triple-tap:** Tap logo 3 times fast — PIN prompt appears
8. **Settings:** Enter PIN — settings modal with green/red/blue tier sections
9. **Language list:** Add/remove/reorder languages in settings
10. **Filter pipeline:** Add a blocked keyword, search — matching videos hidden
11. **Allow override:** Add a channel to allow list, add keyword from that channel's video to block list — video still shows
12. **Mobile responsive:** DevTools responsive mode at 375px — 1 col grid, search icon, stacked search results
13. **PWA:** Check DevTools → Application → Manifest — manifest loads, service worker registered

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md for YouTube UX redesign"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | PWA files (manifest, service worker, icons dir) | manifest.json, service-worker.js, icons/ |
| 2 | HTML head + CSS design tokens + all styles | kidtube.html (head + style) |
| 3 | Helper functions + 3-tier filter pipeline | kidtube.html (script) |
| 4 | YouTube API functions (language + safeSearch) | kidtube.html (script) |
| 5 | Header + triple-tap + mobile search | kidtube.html (script) |
| 6 | Setup screen + PIN prompt | kidtube.html (script) |
| 7 | Settings modal (tier-grouped + language list) | kidtube.html (script) |
| 8 | Video cards + search results + category chips | kidtube.html (script) |
| 9 | Player modal (enhanced with info + badges) | kidtube.html (script) |
| 10 | App root component (wiring + all views) + SW registration | kidtube.html (script) |
| 11 | Generate PWA icons | icons/icon-192.png, icons/icon-512.png |
| 12 | CLAUDE.md update + full verification | CLAUDE.md |
