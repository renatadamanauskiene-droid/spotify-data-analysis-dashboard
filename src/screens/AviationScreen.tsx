import { useEffect, useMemo, useState, useCallback } from 'react'
import { ScreenHeader } from '@/components/ScreenHeader'
import { EmptyState } from '@/components/EmptyState'
import { fetchLiveFlights, type LiveFlight } from '@/lib/openSky'
import { formatRelativeLt } from '@/lib/format'

const REFRESH_MS = 60_000

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

function useLiveFlights() {
  const [flights, setFlights] = useState<LiveFlight[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus((prev) => (prev === 'ok' ? 'ok' : 'loading'))
    try {
      const data = await fetchLiveFlights(undefined, signal)
      setFlights(data)
      setStatus('ok')
      setError(null)
      setUpdatedAt(new Date().toISOString())
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Nepavyko gauti duomenų.')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    const interval = setInterval(() => load(), REFRESH_MS)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [load])

  return { flights, status, error, updatedAt, reload: () => load() }
}

export default function AviationScreen() {
  const { flights, status, error, updatedAt, reload } = useLiveFlights()
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-risk-green/30 bg-risk-greenBg px-2.5 py-1 text-[11px] font-semibold text-risk-green">
            <span className="h-1.5 w-1.5 rounded-full bg-risk-green" /> LIVE — OpenSky Network
          </span>
        }
      />

      <div className="mb-4 rounded-xl border border-base-700 bg-base-900 p-3 text-xs leading-relaxed text-base-400">
        Šie duomenys — realaus laiko ADS-B transliacijos iš viešo OpenSky Network tinklo, apimančios{' '}
        <strong className="text-base-300">visus</strong> ADS-B signalą siunčiančius orlaivius stebimoje zonoje, ne vien karinius. Daug karinių
        orlaivių ADS-B netransliuoja arba naudoja neviešus kodus — jų nebuvimas šiame sąraše NEREIŠKIA aktyvumo nebuvimo, o šalies žyma
        („registruota: Rusija/Baltarusija“) yra ICAO24 adreso registracijos šalis, ne patvirtinta orlaivio paskirtis.
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
        {status === 'ok' && updatedAt && `Atnaujinta ${formatRelativeLt(updatedAt)} · automatiškai kas 60 s`}
        {status === 'error' && 'Paskutinis sėkmingas atnaujinimas nepavyko.'}
      </p>

      {status === 'error' && (
        <EmptyState title="Nepavyko prisijungti prie OpenSky API" hint={error || 'Patikrinkite interneto ryšį ir bandykite dar kartą.'} />
      )}

      {status !== 'error' && filtered.length === 0 && status === 'ok' && (
        <EmptyState title="Šiuo metu šioje zonoje ADS-B signalo nefiksuota" hint="Duomenys atnaujinami automatiškai kas 60 sekundžių." />
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
