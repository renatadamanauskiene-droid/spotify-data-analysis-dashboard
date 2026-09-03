import { useEffect, useMemo, useState } from 'react'
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

function useMapAircraft(): LiveFlight[] {
  const mode = getDataMode()
  const [aircraft, setAircraft] = useState<LiveFlight[]>([])

  useEffect(() => {
    async function load() {
      if (mode === 'live') {
        const data = await getLiveAircraftCache()
        if (data.length > 0) { setAircraft(data); return }
      }
      try {
        const data = await fetchLiveFlights()
        setAircraft(data)
      } catch {}
    }
    load()
    const ms = mode === 'live' ? 30_000 : 90_000
    const id = setInterval(load, ms)
    return () => clearInterval(id)
  }, [mode])

  return aircraft
}

export default function MapScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const [windowLabel, setWindowLabel] = useState<TimeWindow['label']>('72h')
  const hours = TIME_WINDOWS.find((w) => w.label === windowLabel)!.hours
  const aircraft = useMapAircraft()
  const [showCivilian, setShowCivilian] = useState(false)

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

  const visibleAircraft = useMemo(
    () =>
      aircraft.filter((f) => {
        if (f.lat == null || f.lng == null) return false
        if (!showCivilian) return assessThreat(f).isMilitary
        return true
      }),
    [aircraft, showCivilian],
  )

  const militaryCount = useMemo(() => aircraft.filter((f) => assessThreat(f).isMilitary).length, [aircraft])

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col md:h-[calc(100vh-6rem)]">
      <ScreenHeader
        title="Žemėlapis"
        subtitle="Stebimi objektai ir live ADS-B orlaiviai"
        action={mode === 'demo' ? <DemoBadge /> : undefined}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <TimeFilter value={windowLabel} onChange={setWindowLabel} />
          <button
            onClick={() => setShowCivilian((v) => !v)}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
              showCivilian
                ? 'border-accent/40 bg-accent-soft text-accent'
                : 'border-base-700 bg-base-900 text-base-400 hover:border-base-500'
            }`}
          >
            {showCivilian ? `Visi orlaiviai (${aircraft.length})` : `Kariniai (${militaryCount})`}
          </button>
        </div>
        <Legend />
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-base-700">
        <MapContainer center={LT_BY_CENTER} zoom={7} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> autoriai'
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

          {visibleAircraft.map((f) => {
            const a = assessThreat(f)
            const color = AIRCRAFT_COLOR[a.level] ?? AIRCRAFT_COLOR.INFO
            return (
              <CircleMarker
                key={f.icao24}
                center={[f.lat!, f.lng!]}
                radius={a.isMilitary ? 8 : 4}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: a.isMilitary ? 0.75 : 0.3,
                  weight: a.isMilitary ? 1.5 : 0.5,
                }}
              >
                <Popup>
                  <p className="text-sm font-semibold">{f.callsign || f.icao24}</p>
                  {a.isMilitary && (
                    <p className="text-xs font-medium" style={{ color }}>
                      {a.level === 'ISPEJIMAS' ? 'ĮSPĖJIMAS' : a.level} · {a.classLabel}
                    </p>
                  )}
                  <p className="text-xs text-base-400">{f.originCountry}</p>
                  {f.typeDesc && <p className="text-xs text-base-400">{f.typeDesc}</p>}
                  <div className="mt-1 text-[11px] text-base-500">
                    {f.baroAltitudeM != null && <span>Aukštis: {Math.round(f.baroAltitudeM)} m · </span>}
                    {f.velocityMs != null && <span>Greitis: {Math.round(f.velocityMs * 3.6)} km/h · </span>}
                    {f.headingDeg != null && <span>Kryptis: {Math.round(f.headingDeg)}°</span>}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-base-500">
      <LegendDot color="#334152" label="Nėra pokyčių" />
      <LegendDot color="#d1a220" label="Signalas / karinis" />
      <LegendDot color="#c9483f" label="Pavojus" />
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full border" style={{ borderColor: color, background: '#131a22' }} />
      {label}
    </span>
  )
}
