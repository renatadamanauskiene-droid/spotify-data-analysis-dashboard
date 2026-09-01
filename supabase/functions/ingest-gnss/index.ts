// Edge Function: ingest-gnss
// Paskirtis: kasdien atsisiųsti VIEŠUS gpsjam.org ADS-B GPS/GNSS trikdžių duomenis (agreguoti
// pagal H3 heksagonų tinklelį) ir įrašyti reikšmingus trikdžius į `gnss_events` mūsų stebimame
// regione (Baltarusija, Kaliningrado sritis, Lietuva, Suvalkų koridorius).
//
// KAS TAI PER DUOMENYS: gpsjam.org kaupia orlaivių ADS-B pranešimus ir kiekvienam H3 (res-4)
// langeliui suskaičiuoja, kiek orlaivių praneša GERĄ ir kiek PRASTĄ navigacijos tikslumą (NIC/NACp).
// Didelis „blogų" orlaivių santykis rodo GPS/GNSS trikdymą (jamming) toje zonoje. Tai yra
// FAKTINIS, tikrinamas agreguotas matavimas — NE grėsmės teiginys, todėl confidence = TIKETINA.
// Spoofing nuo jamming šiais duomenimis atskirti negalima, todėl type = 'jamming'.
//
// Paleidimas pagal grafiką: kartą per parą (žr. migraciją 0003_sources_and_cron.sql — pg_cron).
// Reikalingi aplinkos kintamieji: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Supabase juos suteikia
// Edge Function aplinkai automatiškai).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cellToLatLng } from 'https://esm.sh/h3-js@4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const SOURCE_ID = 'gpsjam'

// Ta pati stebėjimo zona kaip ingest-aviation / src/lib/openSky.ts.
const BBOX = { latMin: 51.0, latMax: 56.5, lngMin: 19.5, lngMax: 32.5 }

// Filtravimo slenksčiai — konservatyvūs, kad mažas orlaivių skaičius langelyje nesukeltų triukšmo.
const MIN_AIRCRAFT = 8 // mažiausiai orlaivių langelyje, kad santykis būtų statistiškai prasmingas
const MIN_BAD_RATIO = 0.35 // mažiausias „blogų" santykis, kad įvykis būtų laikomas trikdžiu
const MAX_EVENTS_PER_DAY = 80 // apsauga nuo per didelio įrašų kiekio

function intensityFor(ratio: number): 'zemas' | 'vidutinis' | 'aukstas' {
  if (ratio >= 0.7) return 'aukstas'
  if (ratio >= 0.5) return 'vidutinis'
  return 'zemas'
}

// Regionų mūsų schemoje tik du. Vakarinė dalis (Kaliningradas / Suvalkų koridorius / vakarų
// Lietuva) -> 'suvalku_koridorius'; likusi (Baltarusija ir rytų Lietuva) -> 'baltarusija'.
function regionFor(lng: number): 'baltarusija' | 'suvalku_koridorius' {
  return lng < 23.5 ? 'suvalku_koridorius' : 'baltarusija'
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

// gpsjam publikuoja parą po jos pabaigos; einamosios dienos failo dar gali nebūti. Bandome
// vakar, užvakar, ir prieš 3 dienas — pasiimame pirmą realiai turintį duomenų.
async function fetchGpsjamCsv(): Promise<{ date: string; csv: string } | null> {
  for (const days of [1, 2, 3]) {
    const date = isoDaysAgo(days)
    const url = `https://gpsjam.org/data/${date}-h3_4.csv`
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'baltarusijos-karine-stebesena-ingest/1.0' } })
      if (!res.ok) continue
      const csv = await res.text()
      if (csv.length > 100 && csv.includes('hex,')) return { date, csv }
    } catch (_) {
      // bandome kitą datą
    }
  }
  return null
}

Deno.serve(async () => {
  const startedAt = new Date().toISOString()

  const fetched = await fetchGpsjamCsv()
  if (!fetched) {
    await supabase.from('ingestion_runs').insert({
      source_id: SOURCE_ID,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: 'nepavyko',
      error_message: 'gpsjam.org duomenų nepavyko gauti (nei vienos iš paskutinių 3 parų failo).',
    })
    return new Response(JSON.stringify({ error: 'no gpsjam data' }), { status: 502 })
  }

  const { date, csv } = fetched
  const lines = csv.split('\n')
  const rows: { hex: string; lat: number; lng: number; ratio: number; total: number }[] = []
  let seen = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const [hex, goodStr, badStr] = line.split(',')
    const good = Number(goodStr)
    const bad = Number(badStr)
    if (!hex || !Number.isFinite(good) || !Number.isFinite(bad)) continue
    const total = good + bad
    if (total < MIN_AIRCRAFT) continue

    let lat: number, lng: number
    try {
      ;[lat, lng] = cellToLatLng(hex)
    } catch (_) {
      continue
    }
    if (lat < BBOX.latMin || lat > BBOX.latMax || lng < BBOX.lngMin || lng > BBOX.lngMax) continue
    seen++

    const ratio = bad / total
    if (ratio < MIN_BAD_RATIO) continue
    rows.push({ hex, lat, lng, ratio, total })
  }

  // Stipriausi trikdžiai pirmiausia; apribojame kiekį.
  rows.sort((a, b) => b.ratio - a.ratio)
  const selected = rows.slice(0, MAX_EVENTS_PER_DAY)

  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`

  const records = selected.map((r) => {
    const pct = Math.round(r.ratio * 100)
    return {
      area_name: `GNSS trikdžiai ~ ${r.lat.toFixed(2)}, ${r.lng.toFixed(2)}`,
      lat: r.lat,
      lng: r.lng,
      radius_km: 30, // apytikslis H3 res-4 langelio spindulys
      type: 'jamming' as const,
      intensity: intensityFor(r.ratio),
      started_at: startOfDay,
      ended_at: endOfDay,
      confidence: 'TIKETINA' as const,
      region: regionFor(r.lng),
      source_ids: [SOURCE_ID],
      source_url: `https://gpsjam.org/?date=${date}`,
      summary_lt: `Padidėjęs GPS/GNSS signalo trikdymas: ${pct}% orlaivių langelyje praneša prastą navigacijos tikslumą (iš viso ${r.total} orlaivių, ${date}).`,
      raw_title: `GNSS trikdžiai (${pct}% orlaivių) ties ${r.lat.toFixed(2)}, ${r.lng.toFixed(2)}`,
      status: 'aktyvus',
      tags: ['gpsjam', 'ads-b', 'automatinis'],
      dedup_key: `gpsjam|${date}|${r.hex}`,
    }
  })

  let inserted = 0
  if (records.length > 0) {
    const { data, error } = await supabase
      .from('gnss_events')
      .upsert(records, { onConflict: 'dedup_key', ignoreDuplicates: true })
      .select('id')
    if (error) {
      await supabase.from('ingestion_runs').insert({
        source_id: SOURCE_ID,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: 'nepavyko',
        items_seen: seen,
        error_message: error.message,
      })
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    inserted = data?.length ?? 0
  }

  await supabase.from('sources').update({ last_successful_fetch: new Date().toISOString(), status: 'veikia' }).eq('id', SOURCE_ID)

  await supabase.from('ingestion_runs').insert({
    source_id: SOURCE_ID,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    status: 'sekminga',
    items_seen: seen,
    items_inserted: inserted,
    items_deduplicated: records.length - inserted,
  })

  return new Response(
    JSON.stringify({ date, cellsInRegion: seen, matchedThreshold: rows.length, written: records.length, inserted }, null, 2),
    { headers: { 'content-type': 'application/json' } },
  )
})
