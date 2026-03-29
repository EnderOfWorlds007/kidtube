# KidTube — Screencast Guide for YouTube API Review

Since the app is publicly accessible, reviewers can try it directly:

**Live URL:** https://enderofworlds007.github.io/kidtube/kidtube.html

## App Walkthrough

### Screen 1: Setup (first launch)
- User sets a 4-digit parent PIN (confirmed twice)
- Optional: enter own YouTube API key (not needed if proxy is active)
- Click "Get Started"

### Screen 2: Home Feed
- YouTube-style dark mode interface
- Header: YouTube logo, search bar, microphone icon, avatar
- Category chips: All, Dinosaures, Espace, Lego, Animaux, Science, Dessin, Musique, Tours de magie, Nature, Dessins animés
- Video grid (4 columns desktop, 1 column mobile): thumbnail with duration badge, channel avatar, title, channel name, view count, time ago
- Watched videos show a red progress bar under the thumbnail and are dimmed
- Clicking "All" loads a mix of 3 random topics; clicking a specific chip loads that topic

### Screen 3: Search Results
- User types a query in the search bar
- Results display as a vertical list (YouTube search style)
- Filter chips: All, Short (< 4 min), Recently uploaded
- Each result: large thumbnail, title, view count, channel info, description snippet
- Infinite scroll loads more results

### Screen 4: Video Player
- Click a video → modal overlay opens
- YouTube IFrame Player API renders the video
- Custom controls overlay (blocks YouTube's end-screen recommendations):
  - Play/pause button (center)
  - Progress bar with red scrubber (seekable)
  - Skip back/forward 10 seconds
  - Time display
- Controls auto-hide after 3 seconds
- Player closes when video ends (state ENDED)

### Screen 5: Video Approval Gate
- After watching 1 video (configurable), the next click triggers a PIN prompt
- Parent enters PIN → child can watch one more video
- Prevents unsupervised binge-watching

### Screen 6: Parent Settings (triple-tap logo)
- Triple-tap the YouTube logo → PIN prompt
- Settings grouped by filter tier:
  - **Allow Rules (green):** Allowed channels
  - **Block Rules (red):** Blocked keywords, blocked channels
  - **Constraints (blue):** Max duration, languages (ordered list), SafeSearch
  - **System (gray):** API key, proxy URL, change PIN
- Videos per approval setting

### YouTube API Data Usage

| Data Field | Source | How Displayed |
|-----------|--------|---------------|
| Video title | search/videos.list | Shown as text in cards and player |
| Thumbnail | search/videos.list | Displayed as image in video cards |
| Channel name | search/videos.list | Shown below video title |
| View count | videos.list (statistics) | Formatted as "1.2M views" |
| Like count | videos.list (statistics) | Shown as badge in player |
| Duration | videos.list (contentDetails) | Shown as badge on thumbnail, used for filtering |
| Published date | search/videos.list | Formatted as "3 months ago" |
| Description | search | Shown as snippet in search results |
| Video playback | YouTube IFrame Player API | Embedded player with official API |

No YouTube data is stored, exported, or transmitted to any third party. All data is fetched on-demand and displayed in the browser only.
