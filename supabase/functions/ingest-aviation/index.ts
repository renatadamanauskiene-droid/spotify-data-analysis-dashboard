// Edge Function: ingest-aviation
// Paskirtis: VIENAS serverio kvietimas į nemokamą, be rakto prieinamą ADS-B tinklą kas kelias
// minutes; rezultatas įrašomas į `live_aircraft_cache`. Frontend'as skaito iš Supabase, o ne
// kviečia API iš kiekvieno naršyklės.
//
// KODĖL NE OpenSky: OpenSky anoniminė prieiga blokuoja debesijos (Supabase) IP diapazonus (pilnas
// TCP timeout, ne tik rate limit), todėl serverio pusėje ji nepatikima. adsb.fi ir adsb.lol yra
// nemokami, atviri ADS-B agregatoriai su vieša REST API BE rakto ir leidžia serverio prieigą.
// Naudojamas adsb.fi, o nepavykus — atsarginis adsb.lol.
//
// SVARBU dėl klasifikacijos: rodomi VISI ADS-B signalą transliuojantys orlaiviai zonoje, ne vien
// kariniai. `origin_country` nustatoma iš registracijos prefikso (patikimiausia) arba ICAO24 hex
// diapazono — tai registracijos šalis, NE patvirtinta orlaivio paskirtis ar priklausomybė.
//
// Paleidimas pagal grafiką: pg_cron kas ~5 min. (žr. migraciją 0004_osint_targeting.sql).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Stebima zona: Baltarusija, Kaliningrado sritis, Lietuva, š. r. Lenkija. adsb.fi ima centrą +
// spindulį (jūrmyliai, maks. 250). Centras ~ zonos vidurys.
const CENTER = { lat: 53.75, lon: 26.0, distNm: 250 }
const BBOX = { latMin: 51.0, latMax: 56.5, lngMin: 19.5, lngMax: 32.5 }

const ADSB_ENDPOINTS = [
  `https://opendata.adsb.fi/api/v2/lat/${CENTER.lat}/lon/${CENTER.lon}/dist/${CENTER.distNm}`,
  `https://api.adsb.lol/v2/lat/${CENTER.lat}/lon/${CENTER.lon}/dist/${CENTER.distNm}`,
]

interface AdsbAircraft {
  hex?: string
  flight?: string
  r?: string
  t?: string
  desc?: string
  category?: string
  dbFlags?: number
  squawk?: string
  emergency?: string
  lat?: number
  lon?: number
  alt_baro?: number | string
  gs?: number
  track?: number
  seen?: number
}

// Registracijos prefiksas (patikimiausia) -> šalis; anglišku pavadinimu, nes frontend'as klasifikuoja
// pagal 'belarus'/'russia'/'lithuania' poeilutes (žr. src/screens/AviationScreen.tsx).
function countryFromReg(reg: string): string | null {
  const r = reg.toUpperCase()
  if (r.startsWith('EW') || r.startsWith('EV')) return 'Belarus'
  if (r.startsWith('RA') || r.startsWith('RF')) return 'Russian Federation'
  if (r.startsWith('LY')) return 'Lithuania'
  if (r.startsWith('SP') || r.startsWith('SN')) return 'Poland'
  if (r.startsWith('YL')) return 'Latvia'
  if (r.startsWith('ES')) return 'Estonia'
  if (r.startsWith('UR')) return 'Ukraine'
  return null
}

// ICAO24 hex diapazonas -> šalis (atsarginis būdas, kai registracija paslėpta, dažnai kariniams).
function countryFromHex(hex: string): string | null {
  const h = parseInt(hex, 16)
  if (Number.isNaN(h)) return null
  if (h >= 0x510000 && h <= 0x5103ff) return 'Belarus'
  if (h >= 0x100000 && h <= 0x1fffff) return 'Russian Federation'
  if (h >= 0x503c00 && h <= 0x503fff) return 'Lithuania'
  if (h >= 0x488000 && h <= 0x48ffff) return 'Poland'
  if (h >= 0x502c00 && h <= 0x502fff) return 'Latvia'
  if (h >= 0x511000 && h <= 0x5113ff) return 'Estonia'
  return null
}

function deriveCountry(reg: string | undefined, hex: string): string {
  return (reg ? countryFromReg(reg) : null) || countryFromHex(hex) || 'Kita'
}

async function fetchAdsb(): Promise<{ aircraft: AdsbAircraft[]; endpoint: string } | null> {
  for (const endpoint of ADSB_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        headers: { 'user-agent': 'baltarusijos-karine-stebesena/1.0 (+github pages OSINT dashboard)' },
      })
      if (!res.ok) continue
      const data = await res.json()
      const aircraft: AdsbAircraft[] = data.aircraft || data.ac || []
      return { aircraft, endpoint }
    } catch (_) {
      // bandome kitą endpointą
    }
  }
  return null
}

Deno.serve(async () => {
  const startedAt = new Date().toISOString()
  try {
    const result = await fetchAdsb()
    if (!result) throw new Error('Nei adsb.fi, nei adsb.lol nepavyko pasiekti.')
    const { aircraft, endpoint } = result

    const nowMs = Date.now()
    const rows = aircraft
      .filter((a) => a.hex && typeof a.lat === 'number' && typeof a.lon === 'number')
      .filter((a) => a.lat! >= BBOX.latMin && a.lat! <= BBOX.latMax && a.lon! >= BBOX.lngMin && a.lon! <= BBOX.lngMax)
      .map((a) => {
        const onGround = a.alt_baro === 'ground'
        const altFt = typeof a.alt_baro === 'number' ? a.alt_baro : null
        return {
          icao24: String(a.hex).trim(),
          callsign: a.flight ? a.flight.trim() || null : null,
          origin_country: deriveCountry(a.r, String(a.hex)),
          lat: a.lat!,
          lng: a.lon!,
          baro_altitude_m: altFt != null ? Math.round(altFt * 0.3048) : null, // pėdos -> metrai
          velocity_ms: typeof a.gs === 'number' ? Math.round(a.gs * 0.514444 * 10) / 10 : null, // mazgai -> m/s
          heading_deg: typeof a.track === 'number' ? a.track : null,
          on_ground: onGround,
          last_contact: new Date(nowMs - (typeof a.seen === 'number' ? a.seen * 1000 : 0)).toISOString(),
          type_code: a.t ?? null,
          type_desc: a.desc ?? null,
          category: a.category ?? null,
          db_flags: typeof a.dbFlags === 'number' ? a.dbFlags : null,
          squawk: a.squawk ?? null,
          emergency: a.emergency ?? null,
          fetched_at: startedAt,
        }
      })

    // Momentinė būsena — senas turinys visada pilnai pakeičiamas nauju paleidimu.
    await supabase.from('live_aircraft_cache').delete().neq('icao24', '')
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('live_aircraft_cache').insert(rows)
      if (insertError) throw insertError
    }

    await supabase.from('sources').update({ last_successful_fetch: new Date().toISOString(), status: 'veikia' }).eq('id', 'opensky-network')

    await supabase.from('ingestion_runs').insert({
      source_id: 'opensky-network',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: 'sekminga',
      items_seen: aircraft.length,
      items_inserted: rows.length,
    })

    return new Response(JSON.stringify({ ok: true, count: rows.length, endpoint }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase.from('sources').update({ status: 'sutrikimas' }).eq('id', 'opensky-network')
    await supabase.from('ingestion_runs').insert({
      source_id: 'opensky-network',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: 'nepavyko',
      error_message: message,
    })
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
})
