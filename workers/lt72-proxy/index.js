/**
 * Cloudflare Worker: lt72-proxy
 *
 * Proxy for lt72.lt RSS feed. lt72.lt WAF blocks datacenter IPs (GitHub Actions,
 * Supabase Deno Deploy). Cloudflare edge IPs are not blocked.
 *
 * Deploy via Cloudflare dashboard or `npx wrangler deploy`.
 * GitHub Actions calls this Worker URL instead of lt72.lt directly.
 */

const UPSTREAM = 'https://lt72.lt/feed/'

export default {
  async fetch(request) {
    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const resp = await fetch(UPSTREAM, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'lt-LT,lt;q=0.9,en;q=0.8',
      },
    })

    return new Response(resp.body, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'application/rss+xml',
        'Cache-Control': 'public, max-age=240',
      },
    })
  },
}
