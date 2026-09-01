// Vieninga duomenų sluoksnio sąsaja. Kai Supabase sukonfigūruotas (žr. src/lib/supabase.ts),
// visi get* metodai skaito iš realių lentelių. Kai nesukonfigūruotas, grąžinami aiškiai
// pažymėti DEMO duomenys. SVARBU: jei LIVE režimu užklausa nepavyksta, NIEKADA negrąžiname
// demo duomenų vietoje jų — grąžinamas tuščias masyvas, o ekranai turi rodyti
// "Nepakanka patikimų duomenų", kad niekada nebūtų parodytas fiktyvus turinys kaip realus.

import { supabase, dataMode } from './supabase'
import * as demo from '@/data/demo'
import type { LiveFlight } from './openSky'
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
  DataMode,
} from '@/types'

export function getDataMode(): DataMode {
  return dataMode
}

const FETCH_TIMEOUT_MS = 10_000

// SVARBU: užklausai visada uždedamas laiko limitas. Be jo, jei Supabase pasiekiamas lėtai arba
// visai nepasiekiamas (tinklo problema, sustabdytas projektas), Promise.all AppDataContext'e
// kabėtų amžinai ir programėlė niekada neišeitų iš įkėlimo būsenos — vietoje honest empty/offline
// būsenos vartotojas matytų begalinį "kraunasi" ekraną.
async function fetchTable<T>(table: string, mapRow: (row: Record<string, unknown>) => T, orderCol?: string): Promise<T[]> {
  if (!supabase) return []
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    let query = supabase.from(table).select('*').abortSignal(controller.signal)
    if (orderCol) query = query.order(orderCol, { ascending: false })
    const { data, error } = await query
    if (error || !data) {
      console.warn(`[dataSource] Nepavyko gauti duomenų iš "${table}":`, error?.message)
      return []
    }
    return data.map(mapRow)
  } catch (err) {
    console.warn(`[dataSource] Užklausa į "${table}" nepavyko arba viršijo laiko limitą:`, err instanceof Error ? err.message : err)
    return []
  } finally {
    clearTimeout(timeout)
  }
}

// --- Mappers (snake_case DB stulpeliai -> camelCase domeno tipai) -----------------------------

const mapSource = (r: Record<string, unknown>): Source => ({
  id: r.id as string,
  name: r.name as string,
  type: r.type as Source['type'],
  reliability: r.reliability as Source['reliability'],
  url: (r.url as string) || '',
  enabled: Boolean(r.enabled),
  lastSuccessfulFetch: (r.last_successful_fetch as string) || null,
  status: r.status as Source['status'],
  notes: (r.notes as string) || undefined,
})

const mapLocation = (r: Record<string, unknown>): LocationPoint => ({
  id: r.id as string,
  name: r.name as string,
  lat: Number(r.lat),
  lng: Number(r.lng),
  category: r.category as LocationPoint['category'],
  region: r.region as LocationPoint['region'],
  description: (r.description as string) || undefined,
  distanceToLtBorderKm: r.distance_to_lt_border_km != null ? Number(r.distance_to_lt_border_km) : undefined,
  distanceToVilniusKm: r.distance_to_vilnius_km != null ? Number(r.distance_to_vilnius_km) : undefined,
})

const mapEvent = (r: Record<string, unknown>): EventItem => ({
  id: r.id as string,
  title: r.raw_title as string,
  summaryLt: r.summary_lt as string,
  occurredAt: r.observed_at as string,
  publishedAt: r.published_at as string,
  locationId: (r.location_id as string) || undefined,
  category: r.category as EventItem['category'],
  confidence: r.confidence as EventItem['confidence'],
  changeType: r.change_type as EventItem['changeType'],
  sourceIds: (r.source_ids as string[]) || [],
  region: r.region as EventItem['region'],
  riskWeight: (r.risk_weight as EventItem['riskWeight']) ?? 0,
  isDemo: false,
})

const mapIndicator = (r: Record<string, unknown>): Indicator => ({
  id: r.id as string,
  key: r.key as string,
  category: r.category as Indicator['category'],
  label: r.label as string,
  value: r.value as string,
  unit: (r.unit as string) || undefined,
  deltaLabel: r.delta_label as string,
  trend: r.trend as Indicator['trend'],
  confidence: r.confidence as Indicator['confidence'],
  asOf: r.as_of as string,
  region: r.region as Indicator['region'],
  sourceIds: (r.source_ids as string[]) || [],
  isDemo: false,
})

const mapSatellite = (r: Record<string, unknown>): SatelliteObservation => ({
  id: r.id as string,
  locationId: r.location_id as string,
  title: r.title as string,
  observedAt: r.observed_at as string,
  whatWeSee: (r.what_we_see as string[]) || [],
  beforeImageUrl: (r.before_image_url as string) || undefined,
  afterImageUrl: (r.after_image_url as string) || undefined,
  sourceIds: (r.source_ids as string[]) || [],
  confidence: r.confidence as SatelliteObservation['confidence'],
  region: r.region as SatelliteObservation['region'],
  isDemo: false,
})

const mapAviation = (r: Record<string, unknown>): AviationObservation => ({
  id: r.id as string,
  country: r.country as AviationObservation['country'],
  aircraftType: r.aircraft_type as string,
  activity: r.activity as string,
  locationId: r.location_id as string,
  observedAt: r.observed_at as string,
  confidence: r.confidence as AviationObservation['confidence'],
  sourceIds: (r.source_ids as string[]) || [],
  region: r.region as AviationObservation['region'],
  isDemo: false,
})

const mapRailway = (r: Record<string, unknown>): RailwayObservation => ({
  id: r.id as string,
  fromLocationId: r.from_location_id as string,
  toLocationId: r.to_location_id as string,
  cargoDescription: r.cargo_description as string,
  confirmedLevel: r.confirmed_level as RailwayObservation['confirmedLevel'],
  signalType: r.signal_type as RailwayObservation['signalType'],
  observedAt: r.observed_at as string,
  sourceIds: (r.source_ids as string[]) || [],
  region: r.region as RailwayObservation['region'],
  isDemo: false,
})

const mapMissile = (r: Record<string, unknown>): MissileAirDefenseObservation => ({
  id: r.id as string,
  system: r.system as MissileAirDefenseObservation['system'],
  locationId: r.location_id as string,
  changeType: r.change_type as MissileAirDefenseObservation['changeType'],
  observedAt: r.observed_at as string,
  confidence: r.confidence as MissileAirDefenseObservation['confidence'],
  sourceIds: (r.source_ids as string[]) || [],
  region: r.region as MissileAirDefenseObservation['region'],
  isDemo: false,
})

const mapGnss = (r: Record<string, unknown>): GnssEvent => ({
  id: r.id as string,
  areaName: r.area_name as string,
  lat: Number(r.lat),
  lng: Number(r.lng),
  radiusKm: r.radius_km != null ? Number(r.radius_km) : undefined,
  type: r.type as GnssEvent['type'],
  intensity: r.intensity as GnssEvent['intensity'],
  startedAt: r.started_at as string,
  endedAt: (r.ended_at as string) || undefined,
  confidence: r.confidence as GnssEvent['confidence'],
  sourceIds: (r.source_ids as string[]) || [],
  region: r.region as GnssEvent['region'],
  isDemo: false,
})

const mapNotam = (r: Record<string, unknown>): Notam => ({
  id: r.id as string,
  title: r.title as string,
  area: r.area as string,
  restrictionType: r.restriction_type as string,
  startsAt: r.starts_at as string,
  endsAt: r.ends_at as string,
  confidence: r.confidence as Notam['confidence'],
  sourceIds: (r.source_ids as string[]) || [],
  region: r.region as Notam['region'],
  isDemo: false,
})

const mapExercise = (r: Record<string, unknown>): Exercise => ({
  id: r.id as string,
  name: r.name as string,
  sides: (r.sides as string[]) || [],
  startsAt: r.starts_at as string,
  endsAt: r.ends_at as string,
  locationIds: (r.location_ids as string[]) || [],
  scale: r.scale as string,
  personnelRemainedAfter: r.personnel_remained_after as boolean | null,
  confidence: r.confidence as Exercise['confidence'],
  sourceIds: (r.source_ids as string[]) || [],
  region: r.region as Exercise['region'],
  isDemo: false,
})

const mapNews = (r: Record<string, unknown>): NewsItem => ({
  id: r.id as string,
  title: r.raw_title as string,
  summaryLt: r.summary_lt as string,
  publishedAt: r.published_at as string,
  sourceId: r.source_id as string,
  confidence: r.confidence as NewsItem['confidence'],
  originalUrl: r.source_url as string,
  region: r.region as NewsItem['region'],
  isDemo: false,
})

const mapAlert = (r: Record<string, unknown>): AlertItem => ({
  id: r.id as string,
  level: r.level as AlertItem['level'],
  title: r.title as string,
  body: r.body as string,
  createdAt: r.created_at as string,
  region: r.region as AlertItem['region'],
  relatedEventId: (r.related_event_id as string) || undefined,
  isDemo: false,
})

const mapSnapshot = (r: Record<string, unknown>): DailySnapshot => ({
  date: r.date as string,
  riskLevel: r.risk_level as DailySnapshot['riskLevel'],
  suwalkiRiskLevel: r.suwalki_risk_level as DailySnapshot['riskLevel'],
  summaryLt: r.summary_lt as string,
  createdAt: r.created_at as string,
})

// --- Vieša sąsaja -------------------------------------------------------------------------------

export const getSources = () => (dataMode === 'demo' ? Promise.resolve(demo.demoSources) : fetchTable('sources', mapSource, 'name'))

export const getLocations = () =>
  dataMode === 'demo' ? Promise.resolve(demo.demoLocations) : fetchTable('locations', mapLocation)

export const getEvents = () =>
  dataMode === 'demo' ? Promise.resolve(demo.demoEvents) : fetchTable('events', mapEvent, 'observed_at')

export const getIndicators = () =>
  dataMode === 'demo' ? Promise.resolve(demo.demoIndicators) : fetchTable('indicators', mapIndicator, 'as_of')

// Palydovinių vaizdų DEMO turinio sąmoningai nėra (žr. src/screens/SatelliteScreen.tsx) —
// demo režimu visada grąžinamas tuščias masyvas, kol nesukonfigūruotas realus tiekėjas.
export const getSatelliteObservations = () =>
  dataMode === 'demo' ? Promise.resolve([]) : fetchTable('satellite_observations', mapSatellite, 'observed_at')

// Aviacijos ekranas naudoja realų OpenSky Network API tiesiogiai (žr. src/lib/openSky.ts),
// nepriklausomai nuo šio demo/live perjungimo — čia demo režimu grąžinamas tuščias masyvas.
export const getAviationObservations = () =>
  dataMode === 'demo' ? Promise.resolve([]) : fetchTable('aviation_observations', mapAviation, 'observed_at')

export const getRailwayObservations = () =>
  dataMode === 'demo' ? Promise.resolve(demo.demoRailwayObservations) : fetchTable('railway_observations', mapRailway, 'observed_at')

export const getMissileObservations = () =>
  dataMode === 'demo'
    ? Promise.resolve(demo.demoMissileObservations)
    : fetchTable('missile_airdefense_observations', mapMissile, 'observed_at')

export const getGnssEvents = () =>
  dataMode === 'demo' ? Promise.resolve(demo.demoGnssEvents) : fetchTable('gnss_events', mapGnss, 'started_at')

export const getNotams = () => (dataMode === 'demo' ? Promise.resolve(demo.demoNotams) : fetchTable('notams', mapNotam, 'starts_at'))

export const getExercises = () =>
  dataMode === 'demo' ? Promise.resolve(demo.demoExercises) : fetchTable('exercises', mapExercise, 'starts_at')

export const getNews = () => (dataMode === 'demo' ? Promise.resolve(demo.demoNews) : fetchTable('news_items', mapNews, 'published_at'))

export const getAlerts = () => (dataMode === 'demo' ? Promise.resolve(demo.demoAlerts) : fetchTable('alerts', mapAlert, 'created_at'))

export const getSnapshots = () =>
  dataMode === 'demo' ? Promise.resolve(demo.demoSnapshots) : fetchTable('daily_snapshots', mapSnapshot, 'date')

const mapLiveAircraft = (r: Record<string, unknown>): LiveFlight => ({
  icao24: r.icao24 as string,
  callsign: (r.callsign as string) || null,
  originCountry: r.origin_country as string,
  lat: r.lat != null ? Number(r.lat) : null,
  lng: r.lng != null ? Number(r.lng) : null,
  baroAltitudeM: r.baro_altitude_m != null ? Number(r.baro_altitude_m) : null,
  velocityMs: r.velocity_ms != null ? Number(r.velocity_ms) : null,
  headingDeg: r.heading_deg != null ? Number(r.heading_deg) : null,
  onGround: Boolean(r.on_ground),
  lastContact: r.last_contact as string,
})

// Serverio pusėje kaupiama OpenSky talpykla (žr. supabase/functions/ingest-aviation). Naudojama
// TIK live režimu — demo režimu (Supabase nesukonfigūruotas) Aviacijos ekranas pats krenta atgal
// prie tiesioginio OpenSky kvietimo iš naršyklės (žr. src/lib/openSky.ts).
export const getLiveAircraftCache = () =>
  dataMode === 'demo' ? Promise.resolve([]) : fetchTable('live_aircraft_cache', mapLiveAircraft, 'fetched_at')
