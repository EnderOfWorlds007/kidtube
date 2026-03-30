// Cloudflare Worker: YouTube API + RSS proxy
// Keeps the API key server-side and adds CORS to RSS feeds.

const ALLOWED_API_PATHS = [
  '/youtube/v3/search',
  '/youtube/v3/videos',
  '/youtube/v3/channels',
];

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
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const rssResp = await fetch(rssUrl);
        const data = await rssResp.text();
        return new Response(data, {
          status: rssResp.status,
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=900', // cache 15 min
            ...corsHeaders(request),
          },
        });
      } catch (err) {
        return jsonResponse({ error: 'RSS fetch failed: ' + err.message }, 502, request);
      }
    }

    // YouTube Data API proxy
    if (!ALLOWED_API_PATHS.includes(path)) {
      return jsonResponse({ error: 'Not found' }, 404, request);
    }

    const ytUrl = new URL('https://www.googleapis.com' + path);
    for (const [k, v] of url.searchParams) {
      if (k !== 'key') ytUrl.searchParams.set(k, v);
    }
    ytUrl.searchParams.set('key', env.YOUTUBE_API_KEY);

    try {
      const ytResp = await fetch(ytUrl.toString());
      const data = await ytResp.text();
      return new Response(data, {
        status: ytResp.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
        },
      });
    } catch (err) {
      return jsonResponse({ error: 'Proxy error: ' + err.message }, 502, request);
    }
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
