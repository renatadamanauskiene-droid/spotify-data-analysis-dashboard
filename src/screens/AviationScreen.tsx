import { useEffect, useMemo, useState, useCallback } from 'react'
import { ScreenHeader } from '@/components/ScreenHeader'
import { EmptyState } from '@/components/EmptyState'
import { fetchLiveFlights, loadCachedFlights, saveCachedFlights, type LiveFlight } from '@/lib/openSky'
import { getLiveAircraftCache, getDataMode } from '@/lib/dataSource'
import { formatRelativeLt } from '@/lib/format'
import { assessThreat, summarizeThreats, threatRank, type ThreatLevel } from '@/lib/threatEngine'

const THREAT_STYLES: Record<ThreatLevel, { badge: string; label: string }> = {
  PAVOJUS: { badge: 'border-risk-red/40 bg-risk-redBg text-risk-red', label: 'PAVOJUS' },
  ISPEJIMAS: { badge: 'border-risk-yellow/40 bg-risk-yellowBg text-risk-yellow', label: 'ĮSPĖJIMAS' },
  INFO: { badge: 'border-base-700 bg-base-800 text-base-400', label: 'Civilinis' },
}

function estimateRegion(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return ''
  if (lat >= 54.1 && lat <= 55.2 && lng >= 19.3 && lng <= 22.9) return 'Kaliningradas'
  if (lng >= 25.0 && lat >= 51.3 && lat <= 56.2) return 'Baltarusija'
  if (lat >= 53.9 && lat <= 56.5 && lng >= 20.9 && lng <= 27.0) return 'Lietuva'
  if (lat >= 55.7 && lat <= 58.1 && lng >= 21.0 && lng <= 28.3) return 'Latvija'
  if (lat >= 57.5 && lat <= 59.7 && lng >= 21.8 && lng <= 28.2) return 'Estija'
  if (lat >= 49.0 && lat <= 54.9 && lng >= 14.1 && lng <= 24.2) return 'Lenkija'
  return `${lat.toFixed(1)}°N ${lng.toFixed(1)}°E`
}

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

  const threat = useMemo(() => summarizeThreats(flights), [flights])

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
            {isStale ? 'PASENĘ' : 'LIVE'} — ADS-B (adsb.fi){source === 'client' ? ' (naršyklė)' : ' (serveris)'}
          </span>
        }
      />

      {/* Grėsmės santrauka — automatiškai atpažinti kariniai orlaiviai zonoje. */}
      {status === 'ok' && (
        <div
          className={`mb-4 rounded-xl border p-3.5 ${
            threat.pavojus > 0
              ? 'border-risk-red/40 bg-risk-redBg'
              : threat.ispejimas > 0
                ? 'border-risk-yellow/40 bg-risk-yellowBg'
                : 'border-risk-green/30 bg-risk-greenBg'
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              threat.pavojus > 0 ? 'text-risk-red' : threat.ispejimas > 0 ? 'text-risk-yellow' : 'text-risk-green'
            }`}
          >
            {threat.pavojus > 0
              ? `PAVOJUS — ${threat.pavojus} potencialiai pavojingas (-ų) objektas (-ai)`
              : threat.ispejimas > 0
                ? `ĮSPĖJIMAS — ${threat.military} karinis (-ių) orlaivis (-ių) zonoje`
                : 'Karinių orlaivių ADS-B signalo šiuo metu nefiksuota'}
          </p>
          {threat.topClasses.length > 0 && (
            <p className="mt-1 text-xs text-base-300">{threat.topClasses.join(' · ')}</p>
          )}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-base-700 bg-base-900 p-3 text-xs leading-relaxed text-base-400">
        Šie duomenys — realaus laiko ADS-B transliacijos iš viešo <strong className="text-base-300">adsb.fi / adsb.lol</strong> tinklo,
        apimančios <strong className="text-base-300">visus</strong> ADS-B signalą siunčiančius orlaivius zonoje. Grėsmės žyma
        (ĮSPĖJIMAS/PAVOJUS) nustatoma pagal orlaivio <strong className="text-base-300">tipą</strong> (naikintuvas, bombonešis, transportas,
        dronas) ir karinio orlaivio žymę — tai tik ankstyvo dėmesio indikatorius, NE patvirtinta grėsmė. Daug karinių orlaivių ADS-B
        netransliuoja, o <strong className="text-base-300">Shahed tipo dronai ir raketos ADS-B nesiunčia</strong> — jų čia nebus (žr. Srautą).
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
        <EmptyState title="Nepavyko prisijungti prie ADS-B API" hint={error || 'Patikrinkite interneto ryšį ir bandykite dar kartą.'} />
      )}

      {status !== 'error' && filtered.length === 0 && status === 'ok' && (
        <EmptyState title="Šiuo metu šioje zonoje ADS-B signalo nefiksuota" hint="Duomenys atnaujinami automatiškai." />
      )}

      {filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered
            .slice()
            .sort((a, b) => threatRank(b) - threatRank(a) || (b.baroAltitudeM || 0) - (a.baroAltitudeM || 0))
            .slice(0, 100)
            .map((f) => {
              const a = assessThreat(f)
              const style = THREAT_STYLES[a.level]
              return (
                <li
                  key={f.icao24}
                  className={`rounded-xl border bg-base-850 p-3.5 ${
                    a.level === 'PAVOJUS' ? 'border-risk-red/50' : a.level === 'ISPEJIMAS' ? 'border-risk-yellow/40' : 'border-base-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-base-100">{f.callsign || 'Be šaukinio'}</p>
                        {a.isMilitary && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}>
                            {a.badgeLabel}
                          </span>
                        )}
                        {a.isMilitary && <span className="text-[11px] font-medium text-base-300">{a.classLabel}</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-base-500">
                        ICAO24: {f.icao24} · Registruota: {f.originCountry}
                        {f.typeDesc ? ` · ${f.typeDesc}` : f.typeCode ? ` · ${f.typeCode}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-base-800 px-2 py-0.5 text-[11px] text-base-300">
                      {f.onGround ? 'Ant žemės' : 'Ore'}
                    </span>
                  </div>
                  {a.isMilitary && a.reasons.length > 0 && (
                    <p className="mt-1.5 text-[11px] text-base-400">{a.reasons.join(' · ')}</p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-base-400">
                    <span>Aukštis: {f.baroAltitudeM != null ? `${Math.round(f.baroAltitudeM)} m` : '—'}</span>
                    <span>Greitis: {f.velocityMs != null ? `${Math.round(f.velocityMs * 3.6)} km/h` : '—'}</span>
                    <span>Kryptis: {f.headingDeg != null ? `${Math.round(f.headingDeg)}°` : '—'}</span>
                    {estimateRegion(f.lat, f.lng) && (
                      <span className="font-medium text-base-300">Vieta: {estimateRegion(f.lat, f.lng)}</span>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      )}

      {filtered.length > 100 && <p className="mt-3 text-center text-xs text-base-500">Rodoma pirmieji 100 iš {filtered.length} orlaivių.</p>}
    </div>
  )
}
