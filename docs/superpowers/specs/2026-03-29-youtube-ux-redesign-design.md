# KidTube YouTube UX Redesign

Redesign KidTube to look and feel identical to YouTube (dark mode), while keeping hidden parental controls. The app should be indistinguishable from YouTube to a child.

## Decisions

- **Branding:** App displays as "YouTube" with the real YouTube logo styling. No "KidTube" branding visible to the child.
- **Views:** Home feed, search results, modal video player. No sidebar navigation.
- **Theme:** YouTube dark mode only (#0f0f0f). No light mode, no toggle.
- **Parent access:** Triple-tap the logo to open PIN-locked settings. No visible gear icon or settings button.
- **Architecture:** Single-file app (kidtube.html) with Babel-in-browser React. No build step. PWA files alongside.
- **Player:** Enhanced modal overlay (not a full watch page). Closing returns to previous view.

## Home Feed

Category chips bar at the top, horizontally scrollable. First chip is "All" (active/white by default). Remaining chips are kid-friendly topics. Clicking a chip auto-searches that topic via the YouTube API (with "for kids" appended silently).

The video grid below uses YouTube's card layout:
- Rounded thumbnail (16:9) with duration badge (bottom-right)
- Channel avatar (circle) to the left of the text
- Title (2-line clamp, white)
- Channel name (gray)
- View count + relative time (gray)

Grid columns: 1 on mobile, 2-3 on tablet, 4 on desktop.

On first load with no topic selected, "All" triggers a search for a randomly picked topic from the chip list so the home screen is never empty.

## Search Results

Triggered when the user types in the search bar and submits. Layout switches from grid to vertical list (matching YouTube's search results):
- Large thumbnail on the left (360px on desktop, full-width stacked on mobile)
- Title, view count + age, channel avatar + name, description snippet (2-line clamp) on the right
- Filter chips above results: "All", "Short (< 4 min)", "Recently uploaded" — these filter client-side from already-fetched results

The search query has "for kids" appended silently. All parent filters apply invisibly.

## Video Player Modal

Click a video card or search result to open the modal:
- Dark overlay (rgba(0,0,0,0.88)) over the current view
- Centered container with close button (top-right, circular)
- YouTube IFrame Player API (autoplay, rel=0, modestbranding)
- Below the player: title, channel avatar + name + subscriber count, pill-shaped metadata badges (likes, views, age)
- Error handling for non-embeddable videos with "Watch on YouTube.com" fallback link
- Escape key closes the modal

**Mobile:** Player goes full-width, info scrolls below. Close button at top-right.

## Header

Matches YouTube's dark mode header exactly:
- **Left:** YouTube logo (red play button + "YouTube" text). Triple-tap (3 taps within 500ms) opens parent settings.
- **Center:** Pill-shaped search bar with search icon button on the right side + separate circular mic button. On mobile (< 640px), search bar collapses to a search icon; tapping it expands the bar.
- **Right:** Circular avatar with kid's initial and gradient background.

Height: 56px. Background: #0f0f0f. Bottom border: 1px solid #272727.

## Filter Architecture

Three-tier pipeline. Each filter is a function: `(video, settings) → "allow" | "block" | "pass"`.

Videos are run through filters in this order:

### Tier 1: Allow Rules (highest priority)
If a video matches any allow rule, it passes immediately — skips all other filters.
- **Allowed channels:** List of channel names. Video's channel matches → allow.

### Tier 2: Block Rules
If a video matches any block rule, it's rejected.
- **Blocked keywords:** Comma-separated terms. Matched against title + description (case-insensitive).
- **Blocked channels:** List of channel names. Video's channel matches → block.

### Tier 3: Constraint Filters
Video must pass ALL active constraints to be shown.
- **Max duration:** Videos longer than N minutes are filtered out.
- **Language:** Ordered list of language codes (e.g. ["fr", "en"]). First language is used as YouTube API's `relevanceLanguage` parameter to bias results. Client-side, videos in any listed language pass. Videos not matching any listed language are filtered out. Empty list = no language filtering.
- **SafeSearch:** strict (default), moderate, or none. Applied as YouTube API parameter.

### Adding new filters
To add a new filter type: write a function matching the `(video, settings) → allow|block|pass` signature, add it to the appropriate tier array, and add a UI field to the corresponding section in parent settings. No other changes needed.

## Parent Settings

Accessed by triple-tapping the YouTube logo. Opens PIN prompt first, then settings modal.

Settings modal groups filters visually by tier with color coding:
- **Allow Rules (green, #48bb78):** Allowed channels textarea
- **Block Rules (red, #fc8181):** Blocked keywords textarea, blocked channels textarea
- **Constraints (blue, #7c9bf5):** Max duration (number input), language (ordered list with drag-to-reorder or up/down arrows), SafeSearch (dropdown)
- **System:** YouTube API key (text input), parent PIN (password input)

Buttons: Cancel (outline) and Save (blue, #3ea6ff) — YouTube-style pill buttons.

All settings persist in localStorage under `kidtube_settings`.

## Responsive Design

### Mobile (< 640px)
- Video grid: 1 column
- Search bar: collapses to icon, expands on tap (full-width overlay)
- Category chips: horizontal scroll, no wrapping
- Search results: stacked layout (thumbnail on top, info below)
- Player modal: full-width, info scrolls below player
- Parent settings: full-screen modal

### Tablet (640–1024px)
- Video grid: 2-3 columns
- Search bar: visible, narrower max-width
- Search results: horizontal layout (thumbnail left, info right)
- Player modal: centered with padding

### Desktop (> 1024px)
- Video grid: 4 columns
- Search bar: full width (max 540px)
- Search results: horizontal layout with 360px thumbnails
- Player modal: centered, max-width 680px

## PWA

### manifest.json
- `name`: "YouTube"
- `short_name`: "YouTube"
- `display`: "standalone"
- `theme_color`: "#0f0f0f"
- `background_color`: "#0f0f0f"
- `start_url`: "/kidtube.html"
- `icons`: 192px and 512px PNG icons

### service-worker.js
- Cache kidtube.html, manifest.json, and CDN assets (React, ReactDOM, Babel) on install
- Network-first strategy for YouTube API calls
- Cache-first for static assets
- Enables "Add to Home Screen" on iOS and Android

### iOS meta tags (in kidtube.html head)
- `apple-mobile-web-app-capable`: yes
- `apple-mobile-web-app-status-bar-style`: black
- `apple-touch-icon`: link to 192px icon
- `viewport`: width=device-width, initial-scale=1, maximum-scale=1 (prevent pinch zoom)

## File Structure

```
kidtube.html          ← the entire app (rewritten)
manifest.json         ← PWA manifest
service-worker.js     ← caching + offline shell
icons/
  icon-192.png        ← PWA icon
  icon-512.png        ← PWA icon
start-kidtube.sh      ← local dev server (unchanged)
KIDTUBE.md            ← project docs (unchanged)
CLAUDE.md             ← Claude Code guidance (update after)
```

## Design Tokens (YouTube Dark Mode)

```
Background:           #0f0f0f
Surface:              #272727
Elevated surface:     #181818
Border:               #303030
Text primary:         #ffffff
Text secondary:       #aaaaaa
Text tertiary:        #717171
Accent (red):         #ff0000
Accent (blue):        #3ea6ff
Active chip bg:       #ffffff
Active chip text:     #0f0f0f
Inactive chip bg:     #272727
Inactive chip text:   #ffffff
Search bar bg:        #121212
Search bar border:    #303030
Search button bg:     #222222
```

## What's NOT Changing

- YouTube Data API v3 integration (search + video details)
- API key stored in localStorage
- "for kids" appended to all search queries
- Local Python dev server (start-kidtube.sh)
- Single-file React-via-Babel architecture
