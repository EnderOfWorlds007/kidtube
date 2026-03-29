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
- `service-worker.js` — caches static assets (critical on install, CDN opportunistically), network-first for API calls
- `icons/` — PWA icons (192px, 512px)

**Key architecture:**
- **3-tier filter pipeline:** Allow rules (highest priority, bypass all other filters) -> Block rules -> Constraint filters. Each filter is a function returning `"allow"`, `"block"`, or `"pass"`. Add new filters by writing one function and registering it in the appropriate tier array (`ALLOW_FILTERS`, `BLOCK_FILTERS`, `CONSTRAINT_FILTERS`).
- **Views:** Home feed (grid + category chips), search results (vertical list), video player (modal overlay)
- **Parent access:** Triple-tap logo (3 taps within 500ms) -> PIN prompt -> settings modal grouped by filter tier
- **Settings:** Stored in localStorage under `kidtube_settings`

**Data flow:** Search query (+ "for kids" appended) -> YouTube search API (with language bias + safeSearch) -> video details API -> channel details API (subscriber counts) -> 3-tier filter pipeline -> render.

**Design tokens:** YouTube dark mode — `#0f0f0f` background, `#272727` surface, `#ff0000` red accent, `#3ea6ff` blue accent.

**External dependencies (CDN only):** React 18, ReactDOM 18, Babel standalone 7, YouTube IFrame Player API (loaded on-demand).
