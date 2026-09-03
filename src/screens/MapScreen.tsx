import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { TimeFilter } from '@/components/TimeFilter'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { buildDivIcon, type MarkerUrgency } from '@/lib/mapIcons'
import { formatDateTimeLt, formatDistanceKm, locationCategoryLabel, changeTypeLabel } from '@/lib/format'
import { TIME_WINDOWS } from '@/types'
import type { TimeWindow, EventItem } from '@/types'
import { getDataMode, getLiveAircraftCache } from '@/lib/dataSource'
import { fetchLiveFlights, type LiveFlight } from '@/lib/openSky'
import { assessThreat } from '@/lib/threatEngine'

const LT_BY_CENTER: [number, number] = [54.05, 24.9]

const AIRCRAFT_COLOR: Record<string, string> = {
  PAVOJUS: '#c9483f',
  ISPEJIMAS: '#d1a220',
  INFO: '#3d5266',
}

function aircraftIcon(heading: number | null, color: string, size: number): L.DivIcon {
  const deg = heading ?? 0
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;filter:drop-shadow(0 0 2px rgba(0,0,0,0.8))">
      <g transform="rotate(${deg} 12 12)">
        <path fill="${color}" stroke="#000" stroke-width="0.7" stroke-linejoin="round"
          d="M12 3 L8.5 14 L12 11.5 L15.5 14 Z"/>
        <path fill="${color}" stroke="#000" stroke-width="0.7" stroke-linejoin="round"
          d="M10.5 13.5 L10 20 L12 18 L14 20 L13.5 13.5 Z"/>
      </g>
    </svg>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

interface AircraftState {
  aircraft: LiveFlight[]
  lastUpdatedAt: Date | null
  isStale: boolean
}

function useMapAircraft(): AircraftState {
  const mode = getDataMode()
  const [state, setState] = useState<AircraftState>({ aircraft: [], lastUpdatedAt: null, isStale: false })

  useEffect(() => {
    async function load() {
      let data: LiveFlight[] = []
      if (mode === 'live') {
        data = await getLiveAircraftCache()
      }
      if (data.length === 0) {
        try { data = await fetchLiveFlights() } catch {}
      }
      if (data.length > 0) {
        setState({ aircraft: data, lastUpdatedAt: new Date(), isStale: false })
      }
    }

    load()
    const ms = mode === 'live' ? 30_000 : 90_000
    const interval = setInterval(load, ms)

    // Mark stale if not updated in 15 min
    const staleCheck = setInterval(() => {
      setState((s) => {
        if (s.lastUpdatedAt && Date.now() - s.lastUpdatedAt.getTime() > 15 * 60 * 1000) {
          return { ...s, isStale: true }
        }
        return s
      })
    }, 60_000)

    return () => {
      clearInterval(interval)
      clearInterval(staleCheck)
    }
  }, [mode])

  return state
}

export default function MapScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const [windowLabel, setWindowLabel] = useState<TimeWindow['label']>('72h')
  const hours = TIME_WINDOWS.find((w) => w.label === windowLabel)!.hours
  const { aircraft, lastUpdatedAt, isStale } = useMapAircraft()
  const [showCivilian, setShowCivilian] = useState(false)
  const [showGnss, setShowGnss] = useState(true)

  const eventsByLocation = useMemo(() => {
    const map = new Map<string, EventItem[]>()
    const now = Date.now()
    for (const e of data.events) {
      if (!e.locationId) continue
      if (now - new Date(e.occurredAt).getTime() > hours * 3600 * 1000) continue
      const list = map.get(e.locationId) || []
      list.push(e)
      map.set(e.locationId, list)
    }
    for (const list of map.values()) list.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    return map
  }, [data.events, hours])

  const { militaryAircraft, civilianAircraft } = useMemo(() => {
    const mil: LiveFlight[] = []
    const civ: LiveFlight[] = []
    for (const f of aircraft) {
      if (f.lat == null || f.lng == null) continue
      assessThreat(f).isMilitary ? mil.push(f) : civ.push(f)
    }
    return { militaryAircraft: mil, civilianAircraft: civ }
  }, [aircraft])

  const adsb_age = lastUpdatedAt
    ? Math.round((Date.now() - lastUpdatedAt.getTime()) / 1000)
    : null

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col md:h-[calc(100vh-6rem)]">
      <ScreenHeader
        title="Žemėlapis"
        subtitle="Stebimi objektai · ADS-B pažymėti kariniai orlaiviai"
        action={mode === 'demo' ? <DemoBadge /> : undefined}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TimeFilter value={windowLabel} onChange={setWindowLabel} />
          <button
            onClick={() => setShowCivilian((v) => !v)}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
              showCivilian
                ? 'border-accent/40 bg-accent-soft text-accent'
                : 'border-base-700 bg-base-900 text-base-400 hover:border-base-500'
            }`}
          >
            {showCivilian
              ? `Visi ADS-B (${aircraft.length})`
              : `ADS-B pažymėti kariniai (${militaryAircraft.length})`}
          </button>
          <button
            onClick={() => setShowGnss((v) => !v)}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
              showGnss
                ? 'border-risk-yellow/40 bg-risk-yellowBg text-risk-yellow'
                : 'border-base-700 bg-base-900 text-base-400 hover:border-base-500'
            }`}
          >
            GNSS trikdžiai ({data.gnss.length})
          </button>
        </div>
        <Legend />
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-base-700">
        <MapContainer center={LT_BY_CENTER} zoom={7} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <CircleMarker center={[54.6872, 25.2797]} radius={4} pathOptions={{ color: '#3d8bfd', fillColor: '#3d8bfd', fillOpacity: 1 }}>
            <Popup>Vilnius — atskaitos taškas</Popup>
          </CircleMarker>

          {data.locations.map((loc) => {
            const locEvents = eventsByLocation.get(loc.id) || []
            const latest = locEvents[0]
            const urgency: MarkerUrgency =
              latest && latest.confidence !== 'NEPATVIRTINTA' && latest.riskWeight === 2
                ? 'raudona'
                : latest && latest.confidence !== 'NEPATVIRTINTA' && latest.riskWeight === 1
                  ? 'geltona'
                  : 'neutral'
            return (
              <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={buildDivIcon(loc.category, urgency)}>
                <Popup minWidth={260}>
                  <div className="space-y-2 text-base-100">
                    <div>
                      <p className="text-sm font-semibold">{loc.name}</p>
                      <p className="text-xs text-base-400">{locationCategoryLabel(loc.category)}</p>
                    </div>
                    {loc.description && <p className="text-xs text-base-300">{loc.description}</p>}
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-base-400">
                      <span>Iki LT sienos: {formatDistanceKm(loc.distanceToLtBorderKm)}</span>
                      <span>Iki Vilniaus: {formatDistanceKm(loc.distanceToVilniusKm)}</span>
                    </div>
                    <div className="border-t border-base-700 pt-2">
                      {latest ? (
                        <>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="rounded-full bg-base-800 px-2 py-0.5 text-[11px]">{changeTypeLabel(latest.changeType)}</span>
                            <ConfidenceBadge confidence={latest.confidence} />
                          </div>
                          <p className="text-xs text-base-300">{latest.summaryLt}</p>
                          <p className="mt-1 text-[11px] text-base-500">Atnaujinta: {formatDateTimeLt(latest.occurredAt)}</p>
                          <div className="mt-1.5">
                            <SourceList sourceIds={latest.sourceIds} sourcesById={data.sourcesById} />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-base-500">Pasirinktu laikotarpiu pokyčių nefiksuota.</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Kariniai orlaiviai — kryptinis simbolis */}
          {militaryAircraft.map((f) => {
            const a = assessThreat(f)
            const color = AIRCRAFT_COLOR[a.level] ?? AIRCRAFT_COLOR.ISPEJIMAS
            const size = a.level === 'PAVOJUS' ? 22 : 18
            return (
              <Marker key={f.icao24} position={[f.lat!, f.lng!]} icon={aircraftIcon(f.headingDeg, color, size)}>
                <Popup>
                  <p className="text-sm font-semibold">{f.callsign || f.icao24}</p>
                  <p className="text-xs font-medium" style={{ color }}>
                    {a.badgeLabel} · {a.classLabel}
                  </p>
                  <p className="text-xs text-base-400">{f.originCountry}</p>
                  {f.typeDesc && <p className="text-xs text-base-400">{f.typeDesc}</p>}
                  {a.reasons.length > 0 && (
                    <p className="mt-1 text-[11px] text-base-500">{a.reasons.join(' · ')}</p>
                  )}
                  <div className="mt-1 text-[11px] text-base-500">
                    {f.baroAltitudeM != null && <span>↑ {Math.round(f.baroAltitudeM)} m · </span>}
                    {f.velocityMs != null && <span>{Math.round(f.velocityMs * 3.6)} km/h · </span>}
                    {f.headingDeg != null && <span>{Math.round(f.headingDeg)}°</span>}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Civiliniai orlaiviai — maži taškai (tik jei įjungta) */}
          {showCivilian &&
            civilianAircraft.map((f) => (
              <CircleMarker
                key={f.icao24}
                center={[f.lat!, f.lng!]}
                radius={3}
                pathOptions={{ color: AIRCRAFT_COLOR.INFO, fillColor: AIRCRAFT_COLOR.INFO, fillOpacity: 0.4, weight: 0.5 }}
              >
                <Popup>
                  <p className="text-sm">{f.callsign || f.icao24}</p>
                  <p className="text-xs text-base-400">{f.originCountry}</p>
                  {f.baroAltitudeM != null && <p className="text-[11px] text-base-500">↑ {Math.round(f.baroAltitudeM)} m</p>}
                </Popup>
              </CircleMarker>
            ))}

          {/* GNSS trikdžių zonos — geltoni ratai */}
          {showGnss &&
            data.gnss.map((g) => {
              const intensityColor = g.intensity === 'aukstas' ? '#c9483f' : g.intensity === 'vidutinis' ? '#d1a220' : '#3d6b9c'
              const r = Math.max(8, Math.min(40, (g.radiusKm ?? 40) * 0.7))
              return (
                <CircleMarker
                  key={g.id}
                  center={[g.lat, g.lng]}
                  radius={r}
                  pathOptions={{ color: intensityColor, fillColor: intensityColor, fillOpacity: 0.12, weight: 1.5, dashArray: '4 4' }}
                >
                  <Popup>
                    <p className="text-sm font-semibold">{g.areaName}</p>
                    <p className="text-xs font-medium" style={{ color: intensityColor }}>
                      {g.type === 'jamming' ? 'Trikdymas (jamming)' : 'Klaidinimas (spoofing)'} ·{' '}
                      {g.intensity === 'aukstas' ? 'Aukštas' : g.intensity === 'vidutinis' ? 'Vidutinis' : 'Žemas'} intensyvumas
                    </p>
                    {g.radiusKm && <p className="text-[11px] text-base-500">Spindulys: ~{g.radiusKm} km</p>}
                  </Popup>
                </CircleMarker>
              )
            })}
        </MapContainer>

        {/* ADS-B šviežumo žyma */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-[1000]">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] backdrop-blur-sm ${
              isStale
                ? 'border-risk-yellow/40 bg-risk-yellowBg/80 text-risk-yellow'
                : lastUpdatedAt
                  ? 'border-risk-green/30 bg-risk-greenBg/80 text-risk-green'
                  : 'border-base-700 bg-base-900/80 text-base-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isStale ? 'bg-risk-yellow' : lastUpdatedAt ? 'bg-risk-green' : 'bg-base-600'
              }`}
            />
            {isStale
              ? 'ADS-B: PASENĘ (>15 min)'
              : adsb_age != null
                ? `ADS-B: prieš ${adsb_age < 60 ? `${adsb_age}s` : `${Math.round(adsb_age / 60)} min`}`
                : 'ADS-B: kraunama...'}
          </span>
        </div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="hidden flex-wrap items-center gap-3 text-[11px] text-base-500 md:flex">
      <LegendItem color="#c9483f" shape="arrow" label="Pavojus (RU/BY tipas)" />
      <LegendItem color="#d1a220" shape="arrow" label="Stebimas karinis" />
      <LegendItem color="#d1a220" label="NATO / sąjungininkai" />
      <LegendItem color="#334152" label="Nėra pokyčių" />
    </div>
  )
}

function LegendItem({ color, label, shape }: { color: string; label: string; shape?: 'arrow' | 'dot' }) {
  return (
    <span className="flex items-center gap-1.5">
      {shape === 'arrow' ? (
        <svg width="10" height="12" viewBox="0 0 24 24">
          <path fill={color} d="M12 3 L8.5 14 L12 11.5 L15.5 14 Z" />
        </svg>
      ) : (
        <span className="h-2.5 w-2.5 rounded-full border" style={{ borderColor: color, background: '#131a22' }} />
      )}
      {label}
    </span>
  )
}
