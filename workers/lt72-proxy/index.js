/**
 * Cloudflare Worker: lt72-ingestor
 *
 * Runs every 5 minutes via cron trigger. Fetches lt72.lt RSS feed (Cloudflare
 * edge IPs are not blocked by lt72.lt WAF), parses it, and upserts alerts to
 * Supabase. No external HTTP calls needed — Worker handles everything internally.
 *
 * Required secret (CF Dashboard → Worker → Settings → Variables → Add secret):
 *   SUPABASE_SERVICE_KEY  — Supabase service_role key (bypasses RLS)
 */

const UPSTREAM = 'https://lt72.lt/feed/'
const SUPABASE_URL = 'https://wmhvjwuzxgwlqxgkksfa.supabase.co'

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/\xa0/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function slugFromUrl(url) {
  const parts = url.replace(/\/$/, '').split('/')
  return parts[parts.length - 1] || url
}

function parseCdata(s) {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return m ? m[1] : s
}

async function ingest(env) {
  if (!env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY secret not set in Worker')
  }

  // 1. Fetch lt72.lt RSS (CF edge IPs not blocked by lt72.lt WAF)
  const resp = await fetch(UPSTREAM, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'lt-LT,lt;q=0.9,en;q=0.8',
    },
  })

  if (!resp.ok) {
    throw new Error(`lt72.lt RSS: HTTP ${resp.status}`)
  }

  const xml = await resp.text()

  // 2. Parse RSS items with regex (Workers have no DOMParser)
  const items = []
  const now = new Date().toISOString()
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let m

  while ((m = itemRe.exec(xml)) !== null) {
    const x = m[1]
    const rawLink = (x.match(/<link>([^<]+)<\/link>/) || [])[1] || ''
    const link = rawLink.trim()
    if (!link || !link.startsWith('https://lt72.lt')) continue

    const rawTitle = (x.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''
    const title = stripHtml(parseCdata(rawTitle))
    if (!title) continue

    const rawDesc = (x.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || ''
    let summary = stripHtml(parseCdata(rawDesc))
      .replace(/\s*The post .+? appeared first on .+?\.?\s*$/, '')
      .trim()
    if (summary.length > 500) summary = summary.slice(0, 497) + '…'

    const rawPub = (x.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1] || ''
    let pub = now
    try {
      pub = new Date(rawPub.trim()).toISOString()
    } catch {}

    items.push({
      id: slugFromUrl(link),
      title,
      summary: summary || null,
      published_at: pub,
      url: link,
      fetched_at: now,
    })
  }

  if (items.length === 0) {
    console.log('[lt72] RSS returned 0 items')
    return { count: 0 }
  }

  // 3. Upsert into Supabase (service role bypasses RLS)
  const supaResp = await fetch(`${SUPABASE_URL}/rest/v1/lt72_alerts`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(items),
  })

  if (!supaResp.ok) {
    const body = await supaResp.text()
    throw new Error(`Supabase upsert: HTTP ${supaResp.status} — ${body}`)
  }

  console.log(`[lt72] ✓ Upserted ${items.length} alerts`)
  for (const item of items.slice(0, 3)) {
    console.log(`  · ${item.title.slice(0, 80)}`)
  }
  return { count: items.length }
}

export default {
  // Cron trigger: every 5 minutes
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      ingest(env).catch((e) => console.error('[lt72] Cron error:', e.message)),
    )
  },

  // HTTP GET: manual trigger for testing (visit the Worker URL in browser)
  async fetch(request, env) {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }
    try {
      const result = await ingest(env)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
