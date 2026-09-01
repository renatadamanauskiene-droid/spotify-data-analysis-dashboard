// Edge Function: ingest-aviation
// Paskirtis: VIENAS serverio kvietimas į OpenSky Network kas 1-2 min., rezultatas įrašomas į
// `live_aircraft_cache` lentelę. Frontend'as (Aviacijos ekranas) tada skaito iš Supabase, o ne
// kviečia OpenSky iš kiekvieno naudotojo naršyklės — tai išsprendžia anoniminės OpenSky prieigos
// apribojimus (rate limit / periodiškai grąžinamą HTTP 503 pikinio apkrovimo metu) ir nesukelia
// vieno IP adreso limito viršijimo tūkstančiams vartotojų vienu metu.
//
// Paleidimas pagal grafiką: Supabase Dashboard -> Edge Functions -> Schedule, kas 1-2 min., arba
// pg_cron + pg_net.
//
// Neprivalomi aplinkos kintamieji OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET — jei nustatyti,
// naudojamas OAuth2 client_credentials srautas (žymiai didesnės kvotos nei anoniminė prieiga,
// žr. https://opensky-network.org/apidoc/rest.html). Registracija nemokama.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENSKY_CLIENT_ID = Deno.env.get('OPENSKY_CLIENT_ID')
const OPENSKY_CLIENT_SECRET = Deno.env.get('OPENSKY_CLIENT_SECRET')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const OPENSKY_TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'
const OPENSKY_STATES_URL = 'https://opensky-network.org/api/states/all'

// Apima Baltarusiją, Kaliningrado sritį, Lietuvą ir šiaurės rytų Lenkiją (ta pati zona kaip
// src/lib/openSky.ts kliento pusės atsarginiame kelyje).
const BBOX = { lamin: 51.0, lomin: 19.5, lamax: 56.5, lomax: 32.5 }

async function getAccessToken(): Promise<string | null> {
  if (!OPENSKY_CLIENT_ID || !OPENSKY_CLIENT_SECRET) return null
  const res = await fetch(OPENSKY_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: OPENSKY_CLIENT_ID,
      client_secret: OPENSKY_CLIENT_SECRET,
    }),
  })
  if (!res.ok) throw new Error(`OpenSky autentifikacijos klaida: HTTP ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

Deno.serve(async () => {
  const startedAt = new Date().toISOString()

  try {
    const token = await getAccessToken()

    const params = new URLSearchParams({
      lamin: String(BBOX.lamin),
      lomin: String(BBOX.lomin),
      lamax: String(BBOX.lamax),
      lomax: String(BBOX.lomax),
    })

    const res = await fetch(`${OPENSKY_STATES_URL}?${params.toString()}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })

    if (!res.ok) {
      throw new Error(`OpenSky API klaida: HTTP ${res.status}${res.status === 503 ? ' (serveris perkrautas / rate limit)' : ''}`)
    }

    const data = await res.json()
    const states: (string | number | boolean | null)[][] = data.states || []

    const rows = states
      .map((s) => ({
        icao24: String(s[0] ?? '').trim(),
        callsign: s[1] ? String(s[1]).trim() || null : null,
        origin_country: String(s[2] ?? 'Nežinoma'),
        lng: typeof s[5] === 'number' ? s[5] : null,
        lat: typeof s[6] === 'number' ? s[6] : null,
        baro_altitude_m: typeof s[7] === 'number' ? s[7] : null,
        on_ground: Boolean(s[8]),
        velocity_ms: typeof s[9] === 'number' ? s[9] : null,
        heading_deg: typeof s[10] === 'number' ? s[10] : null,
        last_contact: new Date(((typeof s[4] === 'number' ? s[4] : data.time) || data.time) * 1000).toISOString(),
        fetched_at: startedAt,
      }))
      .filter((r) => r.icao24)

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
      items_seen: states.length,
      items_inserted: rows.length,
    })

    return new Response(JSON.stringify({ ok: true, count: rows.length, usedOAuth: Boolean(token) }), {
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
