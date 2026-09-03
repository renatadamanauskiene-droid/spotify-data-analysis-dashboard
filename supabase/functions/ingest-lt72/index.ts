// Edge Function: ingest-lt72
// Tikrina lt72.lt WordPress REST API kas 5 min ir išsaugo perspėjimus į lt72_alerts.
// Naudojamas WordPress JSON API (ne HTML scraping) — veikia iš cloud serverių.
// Svarbiausios kategorijos: 49=pranesimai, 72=svarbi-informacija, 81=rekomendacijos-oro-pavojaus

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const WP_API_URL =
  'https://lt72.lt/wp-json/wp/v2/posts?categories=49,72,81&per_page=20&orderby=date&order=desc&_fields=id,slug,title,excerpt,date,link'

interface WpPost {
  id: number
  slug: string
  title: { rendered: string }
  excerpt: { rendered: string }
  date: string
  link: string
}

interface ParsedAlert {
  id: string
  title: string
  summary: string | null
  published_at: string
  url: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parsePosts(posts: WpPost[]): ParsedAlert[] {
  return posts.map((p) => ({
    id: p.slug || String(p.id),
    title: stripHtml(p.title.rendered),
    summary: p.excerpt?.rendered ? stripHtml(p.excerpt.rendered).slice(0, 500) || null : null,
    published_at: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
    url: p.link,
  }))
}

Deno.serve(async () => {
  try {
    const res = await fetch(WP_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'lt-LT,lt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${res.status}` }), { status: 200 })
    }

    const posts: WpPost[] = await res.json()
    if (!Array.isArray(posts) || posts.length === 0) {
      return new Response(JSON.stringify({ parsed: 0, note: 'WP API grąžino tuščią masyvą' }), { status: 200 })
    }

    const alerts = parsePosts(posts)

    const { error } = await supabase
      .from('lt72_alerts')
      .upsert(
        alerts.map((a) => ({ ...a, fetched_at: new Date().toISOString() })),
        { onConflict: 'id', ignoreDuplicates: false },
      )

    if (error) throw error

    console.log(`[ingest-lt72] Upsert: ${alerts.length} perspėjimų`)
    return new Response(JSON.stringify({ parsed: alerts.length, titles: alerts.slice(0, 3).map((a) => a.title) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[ingest-lt72]', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
