// Bendri domeno tipai visai programėlei.
// Confidence žymi kiek galima pasitikėti KONKREČIU faktu (skirtingai nuo Source reliability,
// kuri žymi paties šaltinio bendrą patikimumą).

export type Confidence = 'PATVIRTINTA' | 'TIKETINA' | 'NEPATVIRTINTA'

export type SourceReliability = 'A' | 'B' | 'C'

export type SourceType =
  | 'oficialus_lt'
  | 'oficialus_nato'
  | 'oficialus_uzsienio'
  | 'analitinis_osint'
  | 'zeleznodorozny_osint'
  | 'ziniasklaida'
  | 'kitas'

export type RiskLevel = 'ZALIA' | 'GELTONA' | 'RAUDONA'

export type Region = 'baltarusija' | 'suvalku_koridorius'

export type DataMode = 'demo' | 'live'

export type ChangeType = 'nauja' | 'padidejo' | 'sumazejo' | 'nepakito' | 'nepatvirtinta'

export type IndicatorCategory =
  | 'kariai'
  | 'gelezinkeliai'
  | 'aviacija'
  | 'raketines_sistemos'
  | 'poligonai'
  | 'palydoviniai_pokyciai'
  | 'gnss_trikdziai'
  | 'notam_oro_erdve'
  | 'sausumos_pajegos'
  | 'nato_lt_pl_atsakas'

export interface Source {
  id: string
  name: string
  type: SourceType
  reliability: SourceReliability
  url: string
  enabled: boolean
  lastSuccessfulFetch: string | null
  status: 'veikia' | 'sutrikimas' | 'laukia_integracijos'
  notes?: string
}

export type LocationCategory =
  | 'aerodromas'
  | 'poligonas'
  | 'gelezinkelio_mazgas'
  | 'raketine_pozicija'
  | 'oro_gynyba'
  | 'nauja_stovykla'
  | 'palydovinis_pokytis'
  | 'incidentas'
  | 'miestas'
  | 'pasienio_punktas'
  | 'siena'

export interface LocationPoint {
  id: string
  name: string
  lat: number
  lng: number
  category: LocationCategory
  region: Region | 'abu'
  description?: string
  distanceToLtBorderKm?: number
  distanceToVilniusKm?: number
}

export interface Indicator {
  id: string
  key: string
  category: IndicatorCategory
  label: string
  value: string
  unit?: string
  deltaLabel: string
  trend: 'up' | 'down' | 'flat' | 'unknown'
  confidence: Confidence
  asOf: string
  region: Region
  sourceIds: string[]
  isDemo: boolean
}

export interface EventItem {
  id: string
  title: string
  summaryLt: string
  occurredAt: string
  publishedAt: string
  locationId?: string
  category: IndicatorCategory
  confidence: Confidence
  changeType: ChangeType
  sourceIds: string[]
  region: Region
  riskWeight: 0 | 1 | 2
  isDemo: boolean
}

export interface SatelliteObservation {
  id: string
  locationId: string
  title: string
  observedAt: string
  whatWeSee: string[]
  beforeImageUrl?: string
  afterImageUrl?: string
  sourceIds: string[]
  confidence: Confidence
  region: Region
  isDemo: boolean
}

export type AircraftCountry = 'baltarusija' | 'rusija' | 'lietuva' | 'lenkija' | 'nato'

export interface AviationObservation {
  id: string
  country: AircraftCountry
  aircraftType: string
  activity: string
  locationId: string
  observedAt: string
  confidence: Confidence
  sourceIds: string[]
  region: Region
  isDemo: boolean
}

export type RailSignalType = 'normalus_pratybinis' | 'neiprastas_telkimas' | 'masinis_permetimas'

export interface RailwayObservation {
  id: string
  fromLocationId: string
  toLocationId: string
  cargoDescription: string
  confirmedLevel: Confidence
  signalType: RailSignalType
  observedAt: string
  sourceIds: string[]
  region: Region
  isDemo: boolean
}

export type MissileSystem = 'Iskander' | 'S-300' | 'S-400' | 'Kita raketinė sistema'
export type MissileChangeType = 'nauja_dislokacija' | 'perkelimas' | 'grizimas' | 'pratybinis_aktyvumas'

export interface MissileAirDefenseObservation {
  id: string
  system: MissileSystem
  locationId: string
  changeType: MissileChangeType
  observedAt: string
  confidence: Confidence
  sourceIds: string[]
  region: Region
  isDemo: boolean
}

export type GnssEventType = 'jamming' | 'spoofing'

export interface GnssEvent {
  id: string
  areaName: string
  lat: number
  lng: number
  radiusKm?: number
  type: GnssEventType
  intensity: 'zemas' | 'vidutinis' | 'aukstas'
  startedAt: string
  endedAt?: string
  confidence: Confidence
  sourceIds: string[]
  region: Region
  isDemo: boolean
}

export interface Notam {
  id: string
  title: string
  area: string
  restrictionType: string
  startsAt: string
  endsAt: string
  confidence: Confidence
  sourceIds: string[]
  region: Region
  isDemo: boolean
}

export interface Exercise {
  id: string
  name: string
  sides: string[]
  startsAt: string
  endsAt: string
  locationIds: string[]
  scale: string
  personnelRemainedAfter: boolean | null
  confidence: Confidence
  sourceIds: string[]
  region: Region
  isDemo: boolean
}

export interface DailySnapshot {
  date: string
  riskLevel: RiskLevel
  suwalkiRiskLevel: RiskLevel
  summaryLt: string
  createdAt: string
}

export type AlertLevel = 'RAUDONA' | 'GELTONA' | 'INFO'

export interface AlertItem {
  id: string
  level: AlertLevel
  title: string
  body: string
  createdAt: string
  region: Region
  relatedEventId?: string
  isDemo: boolean
}

export type NotificationPreference = 'raudona' | 'geltona_raudona' | 'visi'

export interface QuietHours {
  enabled: boolean
  from: string
  to: string
}

export interface NewsItem {
  id: string
  title: string
  summaryLt: string
  publishedAt: string
  sourceId: string
  confidence: Confidence
  originalUrl: string
  region: Region | 'abu'
  isDemo: boolean
}

export interface CorrelationSignal {
  id: string
  windowHours: 24 | 72
  detectedAt: string
  kaliningradCategories: IndicatorCategory[]
  belarusCategories: IndicatorCategory[]
  descriptionLt: string
  isDemo: boolean
}

export interface RiskAssessment {
  level: RiskLevel
  reasons: string[]
  independentCategoryCount: number
  correlationDetected: boolean
}

export interface TimeWindow {
  label: '24h' | '72h' | '7d' | '30d'
  hours: number
}

export const TIME_WINDOWS: TimeWindow[] = [
  { label: '24h', hours: 24 },
  { label: '72h', hours: 72 },
  { label: '7d', hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
]

// LT72 oficialūs perspėjimai (https://lt72.lt/kategorija/pranesimai/)
export interface Lt72Alert {
  id: string
  title: string
  summary: string | null
  publishedAt: string | null
  url: string
  fetchedAt: string
}
