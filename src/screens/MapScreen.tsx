import { useMemo, useState } from 'react'
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
import { getDataMode } from '@/lib/dataSource'

const LT_BY_CENTER: [number, number] = [54.05, 24.9]

export default function MapScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const [windowLabel, setWindowLabel] = useState<TimeWindow['label']>('72h')
  const hours = TIME_WINDOWS.find((w) => w.label === windowLabel)!.hours

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

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col md:h-[calc(100vh-6rem)]">
      <ScreenHeader
        title="Žemėlapis"
        subtitle="Stebimi objektai Baltarusijoje ir Suvalkų koridoriaus zonoje"
        action={mode === 'demo' ? <DemoBadge /> : undefined}
      />
      <div className="mb-3 flex items-center justify-between gap-2">
        <TimeFilter value={windowLabel} onChange={setWindowLabel} />
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
                          <p className="mt-1.5 text-[11px] text-base-500">
                            Įtaka rizikos vertinimui: {latest.riskWeight >= 1 && latest.confidence !== 'NEPATVIRTINTA' ? 'taip' : 'ne'}
                          </p>
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
        </MapContainer>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="hidden items-center gap-3 text-[11px] text-base-500 md:flex">
      <LegendDot color="#334152" label="Nėra pokyčių" />
      <LegendDot color="#d1a220" label="Signalas" />
      <LegendDot color="#c9483f" label="Stiprus signalas" />
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
