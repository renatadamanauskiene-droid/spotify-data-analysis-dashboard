import { useEffect, useMemo, useState, useCallback } from 'react'
import { ScreenHeader } from '@/components/ScreenHeader'
import { EmptyState } from '@/components/EmptyState'
import { fetchLiveFlights, loadCachedFlights, saveCachedFlights, type LiveFlight } from '@/lib/openSky'
import { getLiveAircraftCache, getDataMode } from '@/lib/dataSource'
import { formatRelativeLt } from '@/lib/format'

const CLIENT_REFRESH_MS = 90_000
const SERVER_REFRESH_MS = 30_000

type CountryFilter = 'visi' | 'baltarusija' | 'rusija' | 'lietuva' | 'kita'

function classifyCountry(originCountry: string): Exclude<CountryFilter, 'visi'> {
  const c = originCountry.toLowerCase()
  if (c.includes('belarus')) return 'baltarusija'
  if (c.includes('russia')) return 'rusija'
  if (c.includes('lithuania')) return 'lietuva'
  return 'kita'
}

const FILTERS: { key: CountryFilter; label: string }[] = [
  { key: 'visi', label: 'Visi' },
  { key: 'baltarusija', label: 'Baltarusija' },
  { key: 'rusija', label: 'Rusija' },
  { key: 'lietuva', label: 'Lietuva' },
  { key: 'kita', label: 'Kita' },
]

/**
 * LIVE (Supabase sukonfigūruotas): pirmiausia bandoma skaityti iš `live_aircraft_cache`, kurią
 * kas 1-2 min. turėtų pildyti serverio pusės Edge Function `ingest-aviation`. Kai kurie debesijos
 * tiekėjai (taip pat ir Supabase Edge Functions) OpenSky gali būti blokuojami IP lygmenyje (ne
 * tik rate limit, o pilna laiko limito klaida) — tokiu atveju, jei serverio talpykla tuščia,
 * ekranas AUTOMATIŠKAI krenta atgal prie tiesioginio kvietimo iš naršyklės, nes naršyklės IP
 * dažnai vis dar pasiekia OpenSky, kai serveris negali. Naudojamas šaltinis visada aiškiai
 * parodomas naudotojui.
 * DEMO (Supabase nesukonfigūruotas): iš karto naudojamas tiesioginis naršyklės kvietimas.
 * Abiem atvejais laikina klaida NEPALIEKA ekrano tuščio — rodomi paskutiniai localStorage
 * išsaugoti sėkmingi duomenys su "pasenę" žyma.
 */
function useLiveFlights() {
  const mode = getDataMode()
  const [flights, setFlights] = useState<LiveFlight[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [source, setSource] = useState<'server' | 'client'>('client')

  const loadClient = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchLiveFlights(undefined, signal)
      setFlights(data)
      saveCachedFlights(data)
      setStatus('ok')
      setIsStale(false)
      setError(null)
      setUpdatedAt(new Date().toISOString())
      setSource('client')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Nepavyko gauti duomenų.'
      const cached = loadCachedFlights()
      if (cached) {
        setFlights(cached.flights)
        setUpdatedAt(cached.fetchedAt)
        setIsStale(true)
        setStatus('ok')
        setError(message)
        setSource('client')
      } else {
        setStatus('error')
        setError(message)
      }
    }
  }, [])

  const loadServerThenClient = useCallback(
    async (signal?: AbortSignal) => {
      const data = await getLiveAircraftCache()
      if (data.length > 0) {
        setFlights(data)
        setStatus('ok')
        setIsStale(false)
        setError(null)
        setUpdatedAt(new Date().toISOString())
        setSource('server')
        return
      }
      // Serverio talpykla tuščia (dar nepaleista arba OpenSky nepasiekiama iš serverio) —
      // bandome tiesiogiai iš naršyklės.
      await loadClient(signal)
    },
    [loadClient],
  )

  useEffect(() => {
    setStatus('loading')
    const controller = new AbortController()
    const load = mode === 'live' ? loadServerThenClient : loadClient
    const refreshMs = mode === 'live' ? SERVER_REFRESH_MS : CLIENT_REFRESH_MS

    const cached = loadCachedFlights()
    if (cached) {
      setFlights(cached.flights)
      setUpdatedAt(cached.fetchedAt)
    }

    load(controller.signal)
    const interval = setInterval(() => load(), refreshMs)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [mode, loadServerThenClient, loadClient])

  return { flights, status, error, updatedAt, isStale, source, reload: () => (mode === 'live' ? loadServerThenClient() : loadClient()) }
}

export default function AviationScreen() {
  const { flights, status, error, updatedAt, isStale, source, reload } = useLiveFlights()
  const [filter, setFilter] = useState<CountryFilter>('visi')

  const filtered = useMemo(() => {
    if (filter === 'visi') return flights
    return flights.filter((f) => classifyCountry(f.originCountry) === filter)
  }, [flights, filter])

  const counts = useMemo(() => {
    const c: Record<CountryFilter, number> = { visi: flights.length, baltarusija: 0, rusija: 0, lietuva: 0, kita: 0 }
    for (const f of flights) c[classifyCountry(f.originCountry)] += 1
    return c
  }, [flights])

  return (
    <div>
      <ScreenHeader
        title="Aviacija"
        subtitle="Gyvi ADS-B duomenys virš Baltarusijos, Kaliningrado ir Lietuvos"
        action={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              isStale ? 'border-risk-yellow/30 bg-risk-yellowBg text-risk-yellow' : 'border-risk-green/30 bg-risk-greenBg text-risk-green'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isStale ? 'bg-risk-yellow' : 'bg-risk-green'}`} />
            {isStale ? 'PASENĘ' : 'LIVE'} — OpenSky Network{source === 'client' ? ' (naršyklė)' : ' (serveris)'}
          </span>
        }
      />

      <div className="mb-4 rounded-xl border border-base-700 bg-base-900 p-3 text-xs leading-relaxed text-base-400">
        Šie duomenys — realaus laiko ADS-B transliacijos iš viešo OpenSky Network tinklo, apimančios{' '}
        <strong className="text-base-300">visus</strong> ADS-B signalą siunčiančius orlaivius stebimoje zonoje, ne vien karinius. Daug karinių
        orlaivių ADS-B netransliuoja arba naudoja neviešus kodus — jų nebuvimas šiame sąraše NEREIŠKIA aktyvumo nebuvimo, o šalies žyma
        („registruota: Rusija/Baltarusija“) yra ICAO24 adreso registracijos šalis, ne patvirtinta orlaivio paskirtis.
        {source === 'client' &&
          ' Duomenys šiuo metu gaunami tiesiai iš tavo naršyklės (serverio talpykla tuščia arba OpenSky jos nepasiekia) — anoniminė prieiga kartais laikinai grąžina klaidą (HTTP 503) piko metu.'}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex flex-wrap rounded-lg border border-base-700 bg-base-900 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === f.key ? 'bg-accent text-white' : 'text-base-400 hover:text-base-200'
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        <button onClick={reload} className="rounded-lg border border-base-700 bg-base-900 px-3 py-1.5 text-xs text-base-300 hover:border-base-500">
          Atnaujinti
        </button>
      </div>

      <p className="mb-3 text-[11px] text-base-500">
        {status === 'loading' && 'Kraunama...'}
        {status === 'ok' && updatedAt && !isStale && `Atnaujinta ${formatRelativeLt(updatedAt)} · automatiškai`}
        {status === 'ok' && updatedAt && isStale && `Paskutiniai žinomi duomenys — ${formatRelativeLt(updatedAt)}. ${error || ''}`}
        {status === 'error' && 'Paskutinis sėkmingas atnaujinimas nepavyko.'}
      </p>

      {status === 'error' && (
        <EmptyState title="Nepavyko prisijungti prie OpenSky API" hint={error || 'Patikrinkite interneto ryšį ir bandykite dar kartą.'} />
      )}

      {status !== 'error' && filtered.length === 0 && status === 'ok' && (
        <EmptyState title="Šiuo metu šioje zonoje ADS-B signalo nefiksuota" hint="Duomenys atnaujinami automatiškai." />
      )}

      {filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered
            .slice()
            .sort((a, b) => (b.baroAltitudeM || 0) - (a.baroAltitudeM || 0))
            .slice(0, 100)
            .map((f) => (
              <li key={f.icao24} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-base-100">{f.callsign || 'Be šaukinio'}</p>
                    <p className="text-xs text-base-500">
                      ICAO24: {f.icao24} · Registruota: {f.originCountry}
                    </p>
                  </div>
                  <span className="rounded-full bg-base-800 px-2 py-0.5 text-[11px] text-base-300">{f.onGround ? 'Ant žemės' : 'Ore'}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-base-400">
                  <span>Aukštis: {f.baroAltitudeM != null ? `${Math.round(f.baroAltitudeM)} m` : '—'}</span>
                  <span>Greitis: {f.velocityMs != null ? `${Math.round(f.velocityMs * 3.6)} km/h` : '—'}</span>
                  <span>Kryptis: {f.headingDeg != null ? `${Math.round(f.headingDeg)}°` : '—'}</span>
                </div>
              </li>
            ))}
        </ul>
      )}

      {filtered.length > 100 && <p className="mt-3 text-center text-xs text-base-500">Rodoma pirmieji 100 iš {filtered.length} orlaivių.</p>}
    </div>
  )
}
