# KidTube

A filtered YouTube wrapper that gives parents control over what their kids watch.

## Why

YouTube's recommendation algorithm is not designed with young children in mind. YouTube Kids exists but is limited and still surfaces questionable content. There's no good middle ground where a parent can set granular rules and a kid can still explore freely within those boundaries. KidTube is that middle ground.

## What it does today

Single HTML file (React via Babel standalone) that talks to the YouTube Data API v3. Runs on a local Python HTTP server.

**Kid-facing:**
- Clean search interface with suggested topics (dinosaurs, lego, science, etc.)
- Search automatically appends "for kids" to queries
- YouTube IFrame Player API with error handling and fallback for non-embeddable videos
- Only videos that pass all active filters are shown

**Parent-facing (PIN-locked settings panel):**
- **Max video duration** — hides anything longer (default: 10 min)
- **Blocked keywords** — comma-separated terms matched against title and description
- **Allowed channels** — if set, only videos from these channels appear
- **SafeSearch** — defaults to strict
- Settings persist in localStorage

## Architecture

Everything lives in `kidtube.html`. No build step, no dependencies beyond CDN-hosted React 18 and Babel standalone. The YouTube Data API v3 is called directly from the browser with the user's API key.

```
kidtube.html       — the entire app
start-kidtube.sh   — launches python3 http server on port 8080
```

## What should come next

Roughly in order of impact:

### High priority

- **Daily watch time limit** — parent sets e.g. 45 min/day, app tracks cumulative viewing time and locks when exceeded. Timer resets at midnight.
- **Viewing history for parents** — log what was watched, when, and for how long. Accessible behind the PIN. Helps parents understand what their kid gravitates toward.
- **Pre-approved playlists** — parent can paste YouTube playlist URLs that show up as curated "channels" on the home screen, so the kid has a good starting point without needing to search.

### Medium priority

- **Split into a proper project** — move from single-file Babel-in-browser to Vite + React. Enables TypeScript, proper component structure, and a real dev workflow.
- **Better channel allowlist UX** — currently you type channel names as comma-separated text. Should be a search-and-add UI that resolves channel IDs properly.
- **Thumbnail preview filtering** — some thumbnails are clickbaity even if the video is fine. Could flag or blur thumbnails with faces showing exaggerated expressions (would need a simple image classifier or heuristic).
- **Multiple kid profiles** — different filter sets for different age groups if you have more than one child.

### Lower priority / exploratory

- **Offline/PWA mode** — cache approved videos for car trips or flights.
- **Content category tags** — use YouTube's category metadata to let parents allow/block entire categories (e.g. allow Education and Entertainment, block Gaming and News).
- **Hosted version** — deploy somewhere so non-technical parents can use it without running a local server. Would need a backend to keep API keys server-side.
- **Browser extension variant** — intercept youtube.com directly and apply filters there, rather than being a separate app.
- **AI-based content screening** — use an LLM to analyze video titles, descriptions, and transcripts for age-appropriateness beyond simple keyword matching.

## How to run

```bash
./start-kidtube.sh
# then open http://localhost:8080/kidtube.html
```

You'll need a YouTube Data API v3 key (free tier, ~10k units/day). The setup screen walks you through getting one from Google Cloud Console.
