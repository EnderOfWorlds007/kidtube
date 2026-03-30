// Cloudflare Worker: YouTube API + RSS proxy
// Rotates through multiple API keys. On 403, tries the next key.

const ALLOWED_API_PATHS = [
  '/youtube/v3/search',
  '/youtube/v3/videos',
  '/youtube/v3/channels',
];

// Keys are stored as YOUTUBE_API_KEY, YOUTUBE_API_KEY_2, YOUTUBE_API_KEY_3, etc.
function getApiKeys(env) {
  const keys = [];
  if (env.YOUTUBE_API_KEY) keys.push(env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const k = env[`YOUTUBE_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  return keys;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // RSS feed proxy: /rss?channel_id=XXX
    if (path === '/rss') {
      const channelId = url.searchParams.get('channel_id');
      if (!channelId || !/^UC[\w-]{22}$/.test(channelId)) {
        return jsonResponse({ error: 'Invalid channel_id' }, 400, request);
      }
      try {
        const rssResp = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        const data = await rssResp.text();
        return new Response(data, {
          status: rssResp.status,
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=900',
            ...corsHeaders(request),
          },
        });
      } catch (err) {
        return jsonResponse({ error: 'RSS fetch failed: ' + err.message }, 502, request);
      }
    }

    // YouTube Data API proxy with key rotation
    if (!ALLOWED_API_PATHS.includes(path)) {
      return jsonResponse({ error: 'Not found' }, 404, request);
    }

    const keys = getApiKeys(env);
    if (!keys.length) {
      return jsonResponse({ error: 'No API keys configured' }, 500, request);
    }

    // Start from a random key to spread load evenly
    const startIdx = Math.floor(Math.random() * keys.length);
    let lastResp;

    for (let i = 0; i < keys.length; i++) {
      const keyIdx = (startIdx + i) % keys.length;
      const ytUrl = new URL('https://www.googleapis.com' + path);
      for (const [k, v] of url.searchParams) {
        if (k !== 'key') ytUrl.searchParams.set(k, v);
      }
      ytUrl.searchParams.set('key', keys[keyIdx]);

      try {
        const ytResp = await fetch(ytUrl.toString());
        // If not a quota error, return immediately
        if (ytResp.status !== 403) {
          const data = await ytResp.text();
          return new Response(data, {
            status: ytResp.status,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders(request),
            },
          });
        }
        // 403 — might be quota. Check if it's actually quota before rotating.
        const body = await ytResp.text();
        if (body.includes('quotaExceeded')) {
          lastResp = new Response(body, { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } });
          continue; // try next key
        }
        // 403 but not quota (e.g. forbidden video) — return as-is
        return new Response(body, {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
        });
      } catch (err) {
        lastResp = jsonResponse({ error: 'Proxy error: ' + err.message }, 502, request);
      }
    }

    // All keys exhausted
    return lastResp || jsonResponse({ error: 'All API keys exhausted' }, 403, request);
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}
