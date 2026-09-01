// Realus, viešas ADS-B duomenų šaltinis: OpenSky Network (https://opensky-network.org).
// Kviečiama TIESIOGIAI iš naršyklės (klientas), nes tai vieša, be autorizacijos raktų
// prieinama REST API, palaikanti CORS. SVARBU dėl klasifikacijos: OpenSky rodo VISUS
// orlaivius, kurie transliuoja ADS-B signalą pasirinktoje zonoje — tai NĖRA "karinių skrydžių"
// sąrašas. Daug karinių orlaivių apskritai netransliuoja ADS-B arba naudoja neviešus kodus,
// todėl jų nebuvimas čia NEREIŠKIA aktyvumo nebuvimo, o buvimas (net jei registruota
// Baltarusijoje/Rusijoje) NEREIŠKIA, kad orlaivis karinis. `originCountry` yra ICAO24 adreso
// registracijos šalis, ne patvirtinta orlaivio priklausomybė ar paskirtis.

export interface LiveFlight {
  icao24: string
  callsign: string | null
  originCountry: string
  lat: number | null
  lng: number | null
  baroAltitudeM: number | null
  velocityMs: number | null
  headingDeg: number | null
  onGround: boolean
  lastContact: string
}

// Nemokamos, be rakto ADS-B API (CORS palaikomas) — adsb.fi, atsarginis adsb.lol. Pakeitė
// OpenSky, kuri anoniminei prieigai dažnai grąžindavo HTTP 503 ir nebuvo patikima.
const ADSB_ENDPOINTS = [
  'https://opendata.adsb.fi/api/v2/lat/53.75/lon/26/dist/250',
  'https://api.adsb.lol/v2/lat/53.75/lon/26/dist/250',
]

// Apima Baltarusiją, Kaliningrado sritį, Lietuvą ir šiaurės rytų Lenkiją.
export const MONITORED_BBOX = { lamin: 51.0, lomin: 19.5, lamax: 56.5, lomax: 32.5 }

interface AdsbAircraft {
  hex?: string
  flight?: string
  r?: string
  lat?: number
  lon?: number
  alt_baro?: number | string
  gs?: number
  track?: number
  seen?: number
}

// origin_country iš registracijos prefikso arba ICAO24 hex diapazono (registracijos šalis, NE
// patvirtinta orlaivio paskirtis). Anglišku pavadinimu — pagal jį klasifikuoja AviationScreen.
function deriveCountry(reg: string | undefined, hex: string): string {
  const r = (reg ?? '').toUpperCase()
  if (r.startsWith('EW') || r.startsWith('EV')) return 'Belarus'
  if (r.startsWith('RA') || r.startsWith('RF')) return 'Russian Federation'
  if (r.startsWith('LY')) return 'Lithuania'
  if (r.startsWith('SP') || r.startsWith('SN')) return 'Poland'
  if (r.startsWith('YL')) return 'Latvia'
  if (r.startsWith('ES')) return 'Estonia'
  if (r.startsWith('UR')) return 'Ukraine'
  const h = parseInt(hex, 16)
  if (!Number.isNaN(h)) {
    if (h >= 0x510000 && h <= 0x5103ff) return 'Belarus'
    if (h >= 0x100000 && h <= 0x1fffff) return 'Russian Federation'
    if (h >= 0x503c00 && h <= 0x503fff) return 'Lithuania'
    if (h >= 0x488000 && h <= 0x48ffff) return 'Poland'
  }
  return 'Kita'
}

export async function fetchLiveFlights(
  bbox: { lamin: number; lomin: number; lamax: number; lomax: number } = MONITORED_BBOX,
  signal?: AbortSignal,
): Promise<LiveFlight[]> {
  let aircraft: AdsbAircraft[] | null = null
  let lastStatus = 0
  for (const endpoint of ADSB_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, { signal })
      lastStatus = res.status
      if (!res.ok) continue
      const data = await res.json()
      aircraft = (data.aircraft || data.ac || []) as AdsbAircraft[]
      break
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
    }
  }

  if (!aircraft) {
    throw new Error(`Nepavyko gauti ADS-B duomenų (HTTP ${lastStatus || 'ryšio klaida'}). Rodomi paskutiniai žinomi duomenys, jei yra.`)
  }

  const now = Date.now()
  return aircraft
    .filter((a) => a.hex && typeof a.lat === 'number' && typeof a.lon === 'number')
    .filter((a) => a.lat! >= bbox.lamin && a.lat! <= bbox.lamax && a.lon! >= bbox.lomin && a.lon! <= bbox.lomax)
    .map((a): LiveFlight => {
      const altFt = typeof a.alt_baro === 'number' ? a.alt_baro : null
      return {
        icao24: String(a.hex).trim(),
        callsign: a.flight ? a.flight.trim() || null : null,
        originCountry: deriveCountry(a.r, String(a.hex)),
        lng: a.lon ?? null,
        lat: a.lat ?? null,
        baroAltitudeM: altFt != null ? Math.round(altFt * 0.3048) : null,
        onGround: a.alt_baro === 'ground',
        velocityMs: typeof a.gs === 'number' ? Math.round(a.gs * 0.514444 * 10) / 10 : null,
        headingDeg: typeof a.track === 'number' ? a.track : null,
        lastContact: new Date(now - (typeof a.seen === 'number' ? a.seen * 1000 : 0)).toISOString(),
      }
    })
    .filter((f) => f.icao24)
}

// Paskutinis sėkmingas kliento pusės OpenSky atsakymas laikomas localStorage, kad laikina
// klaida (pvz. 503 pikinio apkrovimo metu) nepaliktų ekrano tuščio — vietoje to rodomi
// paskutiniai žinomi duomenys su aiškia "pasenę" žyma.
const CACHE_KEY = 'by-stebesena:opensky-cache'

export interface CachedFlights {
  fetchedAt: string
  flights: LiveFlight[]
}

export function saveCachedFlights(flights: LiveFlight[]): void {
  try {
    const payload: CachedFlights = { fetchedAt: new Date().toISOString(), flights }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage gali būti nepasiekiama — praleidžiama tyliai.
  }
}

export function loadCachedFlights(): CachedFlights | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as CachedFlights) : null
  } catch {
    return null
  }
}
