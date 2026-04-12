# YouTube Language Detection & Multi-Audio Support

Technical notes on detecting and filtering videos by language in KidTube.
Written 2026-04-12 after extensive research and testing.

## What the YouTube Data API v3 exposes

| Field | What it is | Useful? |
|-------|-----------|---------|
| `snippet.defaultLanguage` | Language of the video's title/description metadata | Weak signal — many uploaders don't set it |
| `snippet.defaultAudioLanguage` | Language of the default audio track | Best official signal, but only the default — no info on additional dubbed tracks |
| `contentDetails.caption` | `"true"` or `"false"` string | Only tells you captions exist, not which languages |
| `localizations` (separate part) | Uploader-provided translations of title/description | Metadata only — unrelated to audio/subtitle availability |
| `captions.list` endpoint | Lists all caption tracks with language codes | **Requires OAuth** — unusable in a client-side app |

**The Data API does NOT expose available audio tracks.** YouTube added multi-language audio (MLA) in 2023 with auto-dubbing expanding to ~60 languages, but never updated the public API.

## What actually works for detecting multi-language support

### Watch page scraping (what KidTube uses)

Fetch `https://www.youtube.com/watch?v=VIDEO_ID` and extract the `ytInitialPlayerResponse` JSON blob from the HTML. This contains:

- **`streamingData.adaptiveFormats[].audioTrack.id`** — Audio track IDs in format `LANGUAGE_CODE.TRACK_NUMBER` (e.g., `fr.2`, `en.1`). Extract the language code before the dot.
- **`captions.playerCaptionsTracklistRenderer.captionTracks[].languageCode`** — All available caption/subtitle languages.

This is implemented in the Cloudflare Worker at `/video-languages`. Key details:
- No API key or quota needed
- Must be server-side (CORS-blocked from browsers)
- Requires consent cookies for EU POPs: `Cookie: CONSENT=PENDING+987; SOCS=CAESEwgDEgk2ODE3MTcwMjQaAmVuIAEaBgiA_LyuBg`
- YouTube rate-limits datacenter IPs after ~10-15 requests (HTTP 429)
- Batch size capped at 3 parallel fetches to stay under rate limits
- Error responses are NOT cached (`Cache-Control: no-store`) to allow quick recovery

### InnerTube direct API (DOES NOT WORK)

`POST https://www.youtube.com/youtubei/v1/player` with various client contexts (WEB, ANDROID, IOS, TVHTML5_SIMPLY_EMBEDDED_PLAYER) — all blocked by YouTube's bot detection. Returns `UNPLAYABLE` or empty responses. This is the cat-and-mouse game that yt-dlp and NewPipe deal with constantly.

### Timedtext endpoint (DOES NOT WORK)

`https://www.youtube.com/api/timedtext?type=list&v=VIDEO_ID` — returns empty responses, likely deprecated or requires session cookies.

### IFrame Player API (limited, client-side)

After playback starts, the undocumented `player.getOption('captions', 'tracklist')` returns available caption tracks. But:
- Only works after playback begins (can't pre-filter search results)
- No equivalent for audio tracks
- Undocumented, could break

## Forcing a specific audio track in embedded player

**Not possible.** Exhaustive research confirms:

- The IFrame Player API has zero audio track methods
- No embed URL parameter exists for audio selection
- The postMessage bridge has no audio track commands
- Undocumented `player.setAudioTrack()` exists on youtube.com's internal API but is cross-origin blocked from iframes
- Browser extensions (ytAudioSelector, etc.) work by injecting scripts into youtube.com's origin — not replicable from an embed

YouTube auto-selects the audio track based on:
1. User's YouTube account language preferences
2. Previous audio track selections (remembered per-session)
3. IP geolocation
4. Browser/OS language settings

### What we CAN control

- `cc_lang_pref: 'fr'` — forces French as the default caption/subtitle language
- `cc_load_policy: 1` — auto-shows captions
- `hl: 'fr'` — sets player UI to French (does NOT influence audio selection despite theories)

## KidTube's filter architecture

Two-pass system to balance speed and accuracy:

1. **Fast pass**: All search results filtered using `defaultAudioLanguage` from the Data API. French videos pass, English/Spanish/etc. are blocked, undeclared videos pass.

2. **Second-chance pass**: Only videos blocked by language in pass 1 get checked via `/video-languages`. If they have French audio tracks or French captions (from watch page data), they're rescued and shown.

This keeps the watch page requests small (typically 0-5 per search) and avoids YouTube rate limits during normal usage.

## Alternatives considered but not implemented

- **Build a custom player with raw streams** (like NewPipe/yt-dlp): Would allow full audio track control, but violates YouTube ToS and breaks the IFrame Player requirement for API compliance.
- **Show native YouTube controls** (`controls: 1`): The gear menu may show an "Audio track" option on multi-audio videos, but also exposes end cards, annotations, and other UI we deliberately block.
- **Channel-level language allow-lists**: Manually curate known multi-language kids channels. Precise but doesn't scale.
