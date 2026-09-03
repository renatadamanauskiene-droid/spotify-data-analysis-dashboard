import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  Source,
  LocationPoint,
  EventItem,
  Indicator,
  SatelliteObservation,
  AviationObservation,
  RailwayObservation,
  MissileAirDefenseObservation,
  GnssEvent,
  Notam,
  Exercise,
  NewsItem,
  AlertItem,
  DailySnapshot,
  Lt72Alert,
} from '@/types'
import {
  getSources,
  getLocations,
  getEvents,
  getIndicators,
  getSatelliteObservations,
  getAviationObservations,
  getRailwayObservations,
  getMissileObservations,
  getGnssEvents,
  getNotams,
  getExercises,
  getNews,
  getAlerts,
  getSnapshots,
  getLt72Alerts,
  getDataMode,
} from './dataSource'

interface AppData {
  loading: boolean
  loadedAt: string | null
  offline: boolean
  sources: Source[]
  sourcesById: Map<string, Source>
  locations: LocationPoint[]
  locationsById: Map<string, LocationPoint>
  events: EventItem[]
  indicators: Indicator[]
  satellite: SatelliteObservation[]
  aviation: AviationObservation[]
  railway: RailwayObservation[]
  missiles: MissileAirDefenseObservation[]
  gnss: GnssEvent[]
  notams: Notam[]
  exercises: Exercise[]
  news: NewsItem[]
  alerts: AlertItem[]
  snapshots: DailySnapshot[]
  lt72: Lt72Alert[]
}

const EMPTY: AppData = {
  loading: true,
  loadedAt: null,
  offline: false,
  sources: [],
  sourcesById: new Map(),
  locations: [],
  locationsById: new Map(),
  events: [],
  indicators: [],
  satellite: [],
  aviation: [],
  railway: [],
  missiles: [],
  gnss: [],
  notams: [],
  exercises: [],
  news: [],
  alerts: [],
  snapshots: [],
  lt72: [],
}

const AppDataCtx = createContext<AppData>(EMPTY)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [sources, locations, events, indicators, satellite, aviation, railway, missiles, gnss, notams, exercises, news, alerts, snapshots, lt72] =
        await Promise.all([
          getSources(),
          getLocations(),
          getEvents(),
          getIndicators(),
          getSatelliteObservations(),
          getAviationObservations(),
          getRailwayObservations(),
          getMissileObservations(),
          getGnssEvents(),
          getNotams(),
          getExercises(),
          getNews(),
          getAlerts(),
          getSnapshots(),
          getLt72Alerts(),
        ])
      if (cancelled) return
      setData({
        loading: false,
        loadedAt: new Date().toISOString(),
        offline: false,
        sources,
        sourcesById: new Map(sources.map((s) => [s.id, s])),
        locations,
        locationsById: new Map(locations.map((l) => [l.id, l])),
        events,
        indicators,
        satellite,
        aviation,
        railway,
        missiles,
        gnss,
        notams,
        exercises,
        news,
        alerts,
        snapshots,
        lt72,
      })

      try {
        localStorage.setItem(
          'by-stebesena:last-snapshot',
          JSON.stringify({ savedAt: new Date().toISOString(), events, indicators, alerts, mode: getDataMode() }),
        )
      } catch {
        // localStorage gali būti nepasiekiama (privatus režimas) — praleidžiama tyliai.
      }
    }
    load().catch((err) => {
      console.error('[AppDataProvider] Nepavyko įkelti duomenų, bandoma naudoti paskutinį žinomą snapshot’ą:', err)
      if (cancelled) return
      try {
        const cached = localStorage.getItem('by-stebesena:last-snapshot')
        if (cached) {
          const parsed = JSON.parse(cached)
          setData((d) => ({
            ...d,
            loading: false,
            offline: true,
            loadedAt: parsed.savedAt,
            events: parsed.events || [],
            indicators: parsed.indicators || [],
            alerts: parsed.alerts || [],
          }))
          return
        }
      } catch {
        // nėra ką atkurti
      }
      setData((d) => ({ ...d, loading: false, offline: true }))
    })
    return () => {
      cancelled = true
    }
  }, [])

  return <AppDataCtx.Provider value={data}>{children}</AppDataCtx.Provider>
}

export function useAppData() {
  return useContext(AppDataCtx)
}
