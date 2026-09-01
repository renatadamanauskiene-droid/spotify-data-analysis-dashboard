// Edge Function: ingest-rss
// Paskirtis: server-side (NIEKADA kliento naršyklėje) periodiškai gauti RSS/Atom naujienas iš
// patikimų šaltinių, normalizuoti į bendrą `news_items` modelį, atlikti dedup pagal
// URL + antraštės maišą + published_at, ir įrašyti rezultatą. Kiekvienas paleidimas fiksuojamas
// `ingestion_runs` lentelėje — tiek sėkmingas, tiek nepavykęs, tiek praleistas dėl trūkstamos
// konfigūracijos (žr. _shared/adapters.ts).
//
// SVARBU dėl klasifikacijos: šis MVP ingest'as užpildo tik `news_items` (bendrą OSINT/naujienų
// srautą su santrauka ir nuoroda į originalą). Įvykio priskyrimas konkrečiai rizikos kategorijai
// (aviacija, geležinkeliai, raketinės sistemos...), riskWeight ir regionui reikalauja arba
// analitiko peržiūros, arba atskiro, tam skirto adapterio/klasifikatoriaus — jokia automatinė
// spėjimo logika čia netaikoma, kad nebūtų sukuriami nepagrįsti rizikos signalai.
//
// Paleidimas pagal grafiką: Supabase Dashboard -> Edge Functions -> Schedule (arba pg_cron +
// pg_net `select cron.schedule('ingest-rss-hourly', '0 * * * *', $$ select net.http_post(...) $$)`).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { rssAdapters } from '../_shared/adapters.ts'
import { parseFeed } from '../_shared/rssParser.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Šaltinio reliability lemia pradinį (konservatyvų) confidence lygį naujam, dar neperžiūrėtam
// naujienos įrašui — tai NĖRA konkretaus fakto teisingumo vertinimas, o atsargus numatytasis.
function defaultConfidenceForReliability(reliability: string): 'PATVIRTINTA' | 'TIKETINA' | 'NEPATVIRTINTA' {
  if (reliability === 'A') return 'TIKETINA'
  if (reliability === 'B') return 'TIKETINA'
  return 'NEPATVIRTINTA'
}

// RELEVANTIŠKUMO filtras. Įrašomi TIK straipsniai, susiję su stebėsenos tema (Baltarusijos
// karinis aktyvumas, pratybos, žvalgyba, NATO/Baltijos grėsmės, geležinkeliai, oro erdvės
// incidentai, raketinės/oro gynybos sistemos). Bendras triukšmas (sportas, orai, nesusijusios
// pasaulio naujienos) atmetamas. Google News tiksliniai feed'ai jau relevantiški — filtras
// pirmiausia išvalo bendrus LT/EN feed'us (15min, Delfi, BBC).
const RELEVANCE_KEYWORDS = [
  'baltarus', 'belarus', 'беларус', 'lukašen', 'lukashen', 'minsk', 'minsko', 'astrav',
  'zapad', 'pratyb', 'kariuom', 'karin', 'military', 'troops', 'army', 'mobiliz',
  'nato', 'baltijos', 'baltic', 'suvalk', 'suwałki', 'suwalki', 'kaliningrad', 'karaliauč',
  'iskander', 'raket', 'missile', 'oro erdv', 'airspace', 'dron', 'drone', 'provokac',
  'pasien', 'siena', 'border', 'geležink', 'gelezink', 'railway', 'railcar', 'ešelon', 'echelon',
  'wagner', 'žvalgyb', 'zvalgyb', 'intelligence', 'reconnaissance', 'sabotag', 'sabotaž', 'diversij',
  'estijoj', 'estonia', 'estij', 'latvijoj', 'latvia', 'latvij', 'gnss', 'glušin', 'jamming',
  'oro gynyb', 'air defen', 'putin', 'rusijos kariuomen', 'russian troops', 'okupac',
]

function isRelevant(text: string): boolean {
  const t = text.toLowerCase()
  return RELEVANCE_KEYWORDS.some((k) => t.includes(k))
}

// Regiono žymėjimas pagal raktažodžius (news_items.region — laisvas tekstas). 'suvalku_koridorius'
// kai minimas Suvalkų koridorius / Kaliningradas; kitu atveju 'baltarusija' jei susiję su
// Baltarusija; likusiais atvejais 'abu'.
function detectRegion(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('suvalk') || t.includes('suwałki') || t.includes('suwalki') || t.includes('kaliningrad') || t.includes('karaliauč')) {
    return 'suvalku_koridorius'
  }
  if (t.includes('baltarus') || t.includes('belarus') || t.includes('minsk') || t.includes('lukašen') || t.includes('lukashen')) {
    return 'baltarusija'
  }
  return 'abu'
}

Deno.serve(async () => {
  // Automatinė šaltinių registracija: sukuriam trūkstamus `sources` įrašus pagal adapterių
  // metaduomenis (name/type/reliability). ignoreDuplicates — esamų neperrašom (išsaugom statusą
  // ir last_successful_fetch). Taip naują feed'ą pridėti pakanka adapters.ts, be SQL migracijos.
  const sourceRows = rssAdapters
    .filter((a) => a.name && a.type && a.reliability)
    .map((a) => ({
      id: a.sourceId,
      name: a.name!,
      type: a.type!,
      reliability: a.reliability!,
      url: '',
      enabled: true,
      status: 'laukia_integracijos',
      notes: a.notes ?? null,
    }))
  if (sourceRows.length > 0) {
    await supabase.from('sources').upsert(sourceRows, { onConflict: 'id', ignoreDuplicates: true })
  }

  const { data: sources, error: sourcesError } = await supabase.from('sources').select('id, reliability, enabled')
  if (sourcesError) {
    return new Response(JSON.stringify({ error: sourcesError.message }), { status: 500 })
  }

  const sourcesById = new Map((sources || []).map((s) => [s.id, s]))
  const results: Record<string, unknown> = {}

  for (const adapter of rssAdapters) {
    const startedAt = new Date().toISOString()
    const source = sourcesById.get(adapter.sourceId)

    if (!source || !source.enabled || !adapter.feedUrl) {
      await supabase.from('ingestion_runs').insert({
        source_id: adapter.sourceId,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: 'nepavyko',
        items_seen: 0,
        items_inserted: 0,
        items_deduplicated: 0,
        error_message: !source
          ? 'Šaltinis neregistruotas sources lentelėje.'
          : !source.enabled
            ? 'Šaltinis išjungtas (sources.enabled = false).'
            : `Adapteris dar neturi sukonfigūruoto feedUrl. ${adapter.notes || ''}`.trim(),
      })
      results[adapter.sourceId] = 'praleista — laukia integracijos'
      continue
    }

    try {
      const res = await fetch(adapter.feedUrl, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xml = await res.text()
      const items = parseFeed(xml)

      let inserted = 0
      let deduped = 0
      let skipped = 0

      for (const item of items) {
        // RELEVANTIŠKUMO filtras — atmetama, kas nesusiję su tema (išvalo bendrus feed'us).
        if (!isRelevant(`${item.title} ${item.description}`)) {
          skipped += 1
          continue
        }

        const publishedAt = item.publishedAt || new Date().toISOString()
        const dedupKey = await sha256Hex(`${adapter.sourceId}|${item.link}|${item.title}|${publishedAt.slice(0, 10)}`)

        const { error: insertError, count } = await supabase
          .from('news_items')
          .insert(
            {
              raw_title: item.title,
              summary_lt: item.description.slice(0, 400),
              published_at: publishedAt,
              source_id: adapter.sourceId,
              source_url: item.link,
              confidence: defaultConfidenceForReliability(source.reliability),
              region: detectRegion(`${item.title} ${item.description}`),
              dedup_key: dedupKey,
            },
            { count: 'exact' },
          )
          .select()
          .single()

        if (insertError) {
          if (insertError.code === '23505') {
            deduped += 1
          } else {
            throw insertError
          }
        } else if (count) {
          inserted += 1
        }
      }

      await supabase.from('sources').update({ last_successful_fetch: new Date().toISOString(), status: 'veikia' }).eq('id', adapter.sourceId)

      await supabase.from('ingestion_runs').insert({
        source_id: adapter.sourceId,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: 'sekminga',
        items_seen: items.length,
        items_inserted: inserted,
        items_deduplicated: deduped,
      })

      results[adapter.sourceId] = { seen: items.length, inserted, deduped, skippedIrrelevant: skipped }
    } catch (err) {
      await supabase.from('sources').update({ status: 'sutrikimas' }).eq('id', adapter.sourceId)
      await supabase.from('ingestion_runs').insert({
        source_id: adapter.sourceId,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: 'nepavyko',
        error_message: err instanceof Error ? err.message : String(err),
      })
      results[adapter.sourceId] = { error: err instanceof Error ? err.message : String(err) }
    }
  }

  return new Response(JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2), {
    headers: { 'content-type': 'application/json' },
  })
})
