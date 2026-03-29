// Cloudflare Worker: YouTube API proxy
// Keeps the API key server-side — the browser never sees it.

const ALLOWED_PATHS = [
  '/youtube/v3/search',
  '/youtube/v3/videos',
  '/youtube/v3/channels',
];

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Only proxy allowed YouTube API paths
    if (!ALLOWED_PATHS.includes(path)) {
      return jsonResponse({ error: 'Not found' }, 404, request);
    }

    // Build YouTube API URL with the secret key
    const ytUrl = new URL('https://www.googleapis.com' + path);
    // Forward all query params except 'key' (we inject our own)
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
