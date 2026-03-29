# YouTube API Compliance Review — KidTube

**Application name:** KidTube
**Live URL:** https://enderofworlds007.github.io/kidtube/kidtube.html
**Source code:** https://github.com/EnderOfWorlds007/kidtube
**API product used:** YouTube Data API v3, YouTube IFrame Player API
**Date:** 2026-03-28

---

## 1. Overview

KidTube is a personal/family project — a parental-controlled YouTube browser built for parents who want to give their young children access to YouTube content in a safer, curated environment.

The app is a single HTML file deployed as a static GitHub Pages site. It wraps the YouTube Data API to search for kid-appropriate videos and plays them through the official YouTube IFrame Player API. A parent sets a PIN on first launch; all content-filter settings are locked behind that PIN. Children interact with the app's search and browse interface; they cannot reach any YouTube settings, recommendations, or unrelated content.

The app has no backend, no user accounts, no database, and collects no data from anyone. It is not a commercial product and has no monetisation.

---

## 2. YouTube API Services Used

### 2.1 `search` (GET /youtube/v3/search)

**Purpose:** Retrieve a list of videos matching a search query or topic category.

**Parameters sent:**
- `part=snippet` — title, channel name, thumbnail URLs, publish date, description
- `q` — user's search query, augmented with a language-appropriate "for kids" suffix (e.g. `"dinosaurs pour enfants"`)
- `type=video` — videos only, no playlists or channels
- `safeSearch=strict` (default) — Google's SafeSearch filter applied at the API level
- `maxResults` — 8 or 24 depending on call context
- `relevanceLanguage` — the parent's configured primary language
- `regionCode` — derived from the primary language
- `videoDuration=short|medium` — optional, inferred from the parent's max-duration setting
- `publishedAfter` — ISO 8601 timestamp, used in the "recent" pass of the two-pass search strategy
- `order=date|relevance` — date for the recent pass, relevance for the all-time pass
- `pageToken` — used for infinite scroll / load more

**Data returned and used:** video IDs, titles, channel names, thumbnail URLs, publish dates, descriptions. These are displayed directly in the UI.

**Data not used:** `etag`, `regionRestriction`, `liveBroadcastContent`, `nextPageToken` (consumed internally for pagination only).

### 2.2 `videos.list` (GET /youtube/v3/videos)

**Purpose:** Fetch detailed metadata for a batch of video IDs returned by the search call.

**Parameters sent:**
- `part=contentDetails,snippet,statistics`
- `id` — comma-separated list of video IDs (up to 24 per call)

**Data returned and used:**
- `contentDetails.duration` — ISO 8601 duration, parsed to seconds and displayed as `M:SS`; used by the max-duration constraint filter
- `snippet.title`, `snippet.channelTitle`, `snippet.thumbnails`, `snippet.publishedAt`, `snippet.description` — displayed in the video card and player info panel
- `statistics.viewCount`, `statistics.likeCount` — displayed as formatted counts (e.g. "1.2M views") in the video card and player badge

**Data not used:** `statistics.commentCount`, `statistics.favoriteCount`, `localizations`, `topicDetails`.

### 2.3 `channels.list` (GET /youtube/v3/channels)

**Purpose:** Fetch subscriber counts for the set of channels found in a search result batch.

**Parameters sent:**
- `part=statistics`
- `id` — deduplicated list of channel IDs from the current result set

**Data returned and used:**
- `statistics.subscriberCount` — displayed as a formatted count (e.g. "4.2M subscribers") in the player info panel below the video

**Data not used:** `statistics.videoCount`, `statistics.commentCount`, `snippet`, `brandingSettings`.

### 2.4 YouTube IFrame Player API

**Purpose:** Play videos in-browser using the official embedded player.

**How it is used:** The script `https://www.youtube.com/iframe_api` is loaded on demand (only when the user taps a video card). A `YT.Player` instance is created targeting a `<div>` element with `videoId` set to the selected video. No custom media pipeline, download, or re-streaming is involved.

**Player configuration:**
- `rel=0` — suppresses related-video suggestions from other channels after playback
- `modestbranding=1` — reduced YouTube branding
- `controls=0` — native controls hidden; KidTube renders its own play/pause, seek bar, and ±10-second skip buttons via the IFrame API's JavaScript interface
- `iv_load_policy=3` — annotations disabled
- `autoplay=1` — video starts on open
- `disablekb=1` — keyboard shortcuts in the iframe disabled

The player closes automatically when the video ends (`onStateChange` event, state `0`). Ads are served natively by the IFrame player — KidTube does not attempt to skip, block, or modify ads.

---

## 3. Data Handling

| Data category | Source | Where it goes | Stored? |
|---|---|---|---|
| Video metadata (title, thumbnail, view count, duration) | YouTube Data API v3 | Rendered to DOM | No |
| Video IDs of watched videos | Computed locally | `localStorage` on the user's device | Device-local only, max 500 entries |
| Parent settings (PIN hash, filter rules) | Entered by parent | `localStorage` on the user's device | Device-local only |
| API key (when user supplies own) | Entered by parent | `localStorage` on the user's device | Device-local only |
| API key (proxy mode) | Cloudflare Worker env var | Never leaves the Worker | Never reaches browser |

**No YouTube data is stored on any server.** The Cloudflare Worker is a pure pass-through proxy; it reads the request, injects the API key, forwards to Google, and streams the response back. It does not log, cache, or persist anything.

**No analytics, tracking, or telemetry** of any kind is implemented. There are no third-party analytics scripts. The app does not transmit user behaviour data anywhere.

**No user authentication** is required or performed. The app has no accounts, no OAuth flow, and does not access any user's YouTube account data.

---

## 4. API Key Security

The production deployment uses a Cloudflare Worker as a server-side API proxy hosted at `https://kidtube-api.enderofworlds007.workers.dev`.

**How it works:**

1. The browser sends a request to the Worker URL (e.g. `/youtube/v3/search?q=dinosaurs+pour+enfants&...`). The `key` parameter is absent from the browser request.
2. The Worker validates that the path is one of three whitelisted endpoints (`/youtube/v3/search`, `/youtube/v3/videos`, `/youtube/v3/channels`). Any other path returns HTTP 404.
3. The Worker appends the API key from a Cloudflare environment secret (`env.YOUTUBE_API_KEY`) and forwards the request to `https://www.googleapis.com`.
4. The Worker streams the JSON response back to the browser with appropriate CORS headers.

**The API key is never present in the HTML, JavaScript, or any client-side asset.** It exists only as an encrypted Cloudflare Worker secret.

The app also supports a fallback mode where a user supplies their own API key (stored in `localStorage`), intended for developers who clone and self-host the app. In that mode the key travels from the browser directly to `googleapis.com` over HTTPS. This is explicitly documented as a self-hosting scenario, not the default production path.

---

## 5. User Experience

### 5.1 Browse / Home Feed

On first load KidTube selects three random topic chips from the configured language's topic list (e.g. Dinosaures, Espace, Lego for French) and issues parallel searches. Results are displayed in a **4-column responsive grid** of video cards. Each card shows:

- **Thumbnail** (medium quality, 16:9, sourced from `snippet.thumbnails`)
- **Title** (2-line clamp)
- **Channel name**
- **View count** and **publish date** (relative, e.g. "3 months ago")
- **Duration badge** (bottom-right of thumbnail)
- **Watched indicator** (red bar along the bottom of the thumbnail, opacity dim)

### 5.2 Search

The search bar appends a language-appropriate "for kids" phrase to every query before sending it to the API. Results are displayed in a **vertical list** with a larger thumbnail, title, channel, view count, description snippet, and duration badge. Filter chips (All / Short / Recently uploaded) allow post-search sorting client-side.

### 5.3 Player

Clicking a video card opens a modal overlay with the **YouTube IFrame Player** embedded at 16:9. KidTube renders its own control bar (play/pause, ±10 s skip, progress bar with scrubbing, elapsed / total time) on top of the iframe. Below the player the title, channel name, subscriber count, like count, view count, and publish date are displayed. When a video ends the overlay closes automatically.

If a video's owner has disabled embedded playback (IFrame API error 101/150), the player area shows an error message and a link to watch on YouTube.com directly.

---

## 6. Content Filtering

KidTube applies a **3-tier client-side filter pipeline** to every batch of API results before displaying them. Filtering happens in JavaScript after the API response is received; no filtered content is ever shown to the child.

**Tier 1 — Allow rules** (checked first; a match causes the video to be shown regardless of block rules):
- **Allowed channels:** if the parent has configured a channel allow-list (e.g. "Cocomelon, SciShow Kids"), any video from a matching channel bypasses the block and constraint tiers.

**Tier 2 — Block rules** (a match causes the video to be hidden):
- **Blocked keywords:** if the video's title or description contains any keyword from the parent's block list (e.g. "prank, scary, violence"), the video is removed.
- **Blocked channels:** if the video's channel name matches any channel in the parent's block list, the video is removed.

**Tier 3 — Constraints** (video must pass all constraints):
- **Max duration:** videos longer than the parent's configured limit (default 15 min) are removed. The API-level `videoDuration` parameter pre-filters to `short` (<4 min) or `medium` (<20 min) where applicable, reducing the number of results that need to be discarded client-side.

Additionally, **SafeSearch** is sent as an API parameter (`strict` by default), and a **"for kids"** suffix is appended to every search query, so Google-side filtering is applied before KidTube's own pipeline runs.

A **videos-per-approval** counter can be configured: after the child watches N videos, a parent PIN prompt appears before the next video plays. Setting it to 0 disables the limit.

---

## 7. Compliance with YouTube Terms of Service

| Requirement | How KidTube complies |
|---|---|
| Display YouTube content via the IFrame Player API | All video playback uses `YT.Player` from `https://www.youtube.com/iframe_api`. No custom player, no media URL extraction. |
| Do not download or store video content | No video bytes are fetched by KidTube. The IFrame player streams directly from YouTube's CDN. |
| Do not modify video content | The video plays unmodified inside the IFrame. KidTube overlays its own controls on top of the iframe's DOM element but does not alter the video stream or frames. |
| Do not circumvent ads | KidTube does not attempt to detect, skip, or block ads. The IFrame player handles ad serving natively. |
| Attribute YouTube | The YouTube logo (SVG) is displayed in the header at all times. The player links to `youtube.com/watch?v=...` when embedded playback is unavailable. |
| Do not scrape or cache API responses server-side | The Cloudflare Worker is a stateless pass-through. It does not cache, log, or store any API response. |
| No bulk data harvesting | Calls are made only in response to direct user actions (page load, search, chip tap, scroll-to-load-more). No background polling. |
| SafeSearch | `safeSearch=strict` is sent on every search call. Parents can lower it to `moderate` or `none` in settings. |
| API key not exposed | Key lives in a Cloudflare Worker secret; never transmitted to the browser. |

---

## 8. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  User's browser (kidtube.html — static GitHub Pages)                │
│                                                                      │
│  React app (Babel/UMD, no build step)                               │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐ │
│  │  Search / Browse │    │  Video Player overlay                   │ │
│  │  (Data API calls)│    │  (IFrame Player API)                    │ │
│  └────────┬─────────┘    └──────────────────┬──────────────────────┘ │
│           │                                 │                        │
└───────────┼─────────────────────────────────┼────────────────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐       ┌────────────────────────────────────┐
│  Cloudflare Worker      │       │  YouTube IFrame Player API         │
│  (kidtube-api.          │       │  https://www.youtube.com/          │
│   enderofworlds007.     │       │  iframe_api                        │
│   workers.dev)          │       │                                    │
│                         │       │  Streams video directly from       │
│  - Validates path       │       │  YouTube CDN to browser.           │
│  - Injects API key      │       │  Handles ads natively.             │
│    from env secret      │       └────────────────────────────────────┘
│  - Forwards request     │
│  - Returns raw JSON     │
└────────────┬────────────┘
             │
             ▼
┌────────────────────────────────┐
│  YouTube Data API v3           │
│  https://www.googleapis.com/   │
│  youtube/v3/                   │
│                                │
│  /search                       │
│  /videos                       │
│  /channels                     │
└────────────────────────────────┘
```

**Service worker** (`service-worker.js`): caches `kidtube.html` and `manifest.json` for offline shell loading. YouTube API calls bypass the cache (network-first strategy). No API responses are persisted by the service worker.

---

## 9. Quota Usage Estimates

The YouTube Data API v3 default quota is **10,000 units per day**.

### Per-call costs

| Call | Units |
|---|---|
| `search` | 100 units |
| `videos.list` | 1 unit |
| `channels.list` | 1 unit |

### Cost per user action

**Home feed load** (mixed 3-topic feed):
- Up to 6 `search` calls (3 topics × 2 passes: recent + all-time) = 600 units
- Up to 6 `videos.list` calls (one per search batch) = 6 units
- 1 `channels.list` call (deduplicated) = 1 unit
- **Worst case: ~607 units per home feed load**
- **Typical case (3 searches suffice): ~303 units**

**User search** (explicit query):
- 1–2 `search` calls (recent pass, then all-time pass if < 8 results) = 100–200 units
- 1–2 `videos.list` calls = 1–2 units
- 1 `channels.list` call = 1 unit
- **Worst case: ~203 units per search**
- **Typical case: ~102 units**

**Infinite scroll / load more:**
- 1 `search` + 1 `videos.list` = 101 units per page

**Topic chip tap:**
- Same as user search: 102–203 units

### Daily quota headroom

| Scenario | Searches | Est. units |
|---|---|---|
| 1 home feed + 5 searches + 3 load-more | 11 | ~1,400 |
| 5 home feeds (family shares device) | 5 | ~1,700 |
| 10 home feeds + 20 searches | 30 | ~8,100 |

The app is a single-family tool. A realistic daily usage of 1–3 home feed loads and 5–15 searches stays well within 3,000–4,000 units — roughly 30–40% of the default 10,000-unit quota. The app has no server-side caching and no background refresh, so quota is consumed only by direct user interactions.

**Requested quota:** The default 10,000 units/day is sufficient for personal/family use. No increase is requested at this time.
