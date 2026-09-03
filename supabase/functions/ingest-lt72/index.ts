// Edge Function: ingest-lt72
// Tikrina lt72.lt/kategorija/pranesimai/ kas 5 min ir išsaugo naujausius perspėjimus
// (oro pavojus, audros, radiacija ir kt.) į lt72_alerts lentelę.
// LT72 neturi RSS/API — nuskaitomas viešas HTML puslapis.
// Paleidimas: Supabase Dashboard → Edge Functions → Schedule (*/5 * * * *)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const LT72_URL = 'https://lt72.lt/kategorija/pranesimai/'

interface ParsedAlert {
  id: string
  title: string
  summary: string | null
  published_at: string | null
  url: string
}

function parseLt72Html(html: string): ParsedAlert[] {
  const alerts: ParsedAlert[] = []

  // Kiekvienas straipsnis: <h3...><a href="/lt/...">Antraštė</a></h3> ... <p>Tekstas</p> ... <p>Data</p>
  const articleRe = /<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/h3>([\s\S]*?)(?=<h3|<footer|<\/main|$)/gi
  let m: RegExpExecArray | null

  while ((m = articleRe.exec(html)) !== null) {
    const [, href, rawTitle, rest] = m

    // Pirmasis <p> — santrauka
    const pMatch = rest.match(/<p[^>]*>([^<]{5,})<\/p>/)
    const summary = pMatch?.[1]?.trim() ?? null

    // Data iš bet kurio <p> (formatas YYYY-MM-DD)
    const dateMatch = rest.match(/(\d{4}-\d{2}-\d{2})/)
    const published_at = dateMatch ? `${dateMatch[1]}T12:00:00Z` : null

    // Slug = paskutinis URL segmentas
    const slug = href.replace(/\/$/, '').split('/').pop() ?? href.replace(/\W+/g, '-')

    const url = href.startsWith('http') ? href : `https://lt72.lt${href.startsWith('/') ? '' : '/'}${href}`

    if (slug && rawTitle.trim().length > 2) {
      alerts.push({ id: slug, title: rawTitle.trim(), summary, published_at, url })
    }
  }

  return alerts
}

Deno.serve(async () => {
  try {
    const res = await fetch(LT72_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BY-Stebesena/1.0; +https://github.com/renatadamanauskiene-droid)' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${res.status}` }), { status: 200 })
    }

    const html = await res.text()
    const alerts = parseLt72Html(html)

    if (alerts.length === 0) {
      return new Response(JSON.stringify({ parsed: 0, note: 'Nerasta perspėjimų HTML struktūroje' }), { status: 200 })
    }

    const { error } = await supabase
      .from('lt72_alerts')
      .upsert(alerts.map((a) => ({ ...a, fetched_at: new Date().toISOString() })), {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

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
