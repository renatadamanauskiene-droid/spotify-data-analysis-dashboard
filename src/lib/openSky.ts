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

const OPENSKY_STATES_URL = 'https://opensky-network.org/api/states/all'

// Apima Baltarusiją, Kaliningrado sritį, Lietuvą ir šiaurės rytų Lenkiją.
export const MONITORED_BBOX = { lamin: 51.0, lomin: 19.5, lamax: 56.5, lomax: 32.5 }

interface OpenSkyResponse {
  time: number
  states: (string | number | boolean | null)[][] | null
}

export async function fetchLiveFlights(
  bbox: { lamin: number; lomin: number; lamax: number; lomax: number } = MONITORED_BBOX,
  signal?: AbortSignal,
): Promise<LiveFlight[]> {
  const params = new URLSearchParams({
    lamin: String(bbox.lamin),
    lomin: String(bbox.lomin),
    lamax: String(bbox.lamax),
    lomax: String(bbox.lomax),
  })

  const res = await fetch(`${OPENSKY_STATES_URL}?${params.toString()}`, { signal })

  if (res.status === 429) {
    throw new Error('OpenSky API užklausų limitas šiuo metu viršytas. Bandykite po kelių minučių.')
  }
  if (res.status === 503) {
    throw new Error(
      'OpenSky serveris šiuo metu perkrautas (HTTP 503) — tai žinomas anoniminės prieigos apribojimas, ne programėlės klaida. Rodomi paskutiniai žinomi duomenys, jei yra.',
    )
  }
  if (!res.ok) {
    throw new Error(`OpenSky API klaida (HTTP ${res.status}).`)
  }

  const data = (await res.json()) as OpenSkyResponse
  const states = data.states || []

  return states
    .map((s): LiveFlight => ({
      icao24: String(s[0] ?? '').trim(),
      callsign: s[1] ? String(s[1]).trim() || null : null,
      originCountry: String(s[2] ?? 'Nežinoma'),
      lng: typeof s[5] === 'number' ? s[5] : null,
      lat: typeof s[6] === 'number' ? s[6] : null,
      baroAltitudeM: typeof s[7] === 'number' ? s[7] : null,
      onGround: Boolean(s[8]),
      velocityMs: typeof s[9] === 'number' ? s[9] : null,
      headingDeg: typeof s[10] === 'number' ? s[10] : null,
      lastContact: new Date(((typeof s[4] === 'number' ? s[4] : data.time) || data.time) * 1000).toISOString(),
    }))
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
