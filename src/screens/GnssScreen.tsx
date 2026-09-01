import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import type { GnssEvent } from '@/types'

const INTENSITY_COLOR: Record<GnssEvent['intensity'], string> = {
  zemas: '#2f9e5b',
  vidutinis: '#d1a220',
  aukstas: '#c9483f',
}

export default function GnssScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const items = [...data.gnss].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

  return (
    <div>
      <ScreenHeader
        title="GPS / GNSS ir elektroninė kova"
        subtitle="Viešai prieinami trikdžių ir spoofing indikatoriai"
        action={mode === 'demo' ? <DemoBadge /> : undefined}
      />

      <div className="mb-4 h-64 overflow-hidden rounded-2xl border border-base-700">
        <MapContainer center={[54.3, 23.8]} zoom={6} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> autoriai'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {items.map((g) => (
            <Circle
              key={g.id}
              center={[g.lat, g.lng]}
              radius={(g.radiusKm || 40) * 1000}
              pathOptions={{ color: INTENSITY_COLOR[g.intensity], fillColor: INTENSITY_COLOR[g.intensity], fillOpacity: 0.18, weight: 1.5 }}
            >
              <Popup>
                <p className="text-sm font-medium">{g.areaName}</p>
                <p className="text-xs">{g.type === 'jamming' ? 'Trikdymas (jamming)' : 'Klastojimas (spoofing)'}</p>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Nepakanka patikimų duomenų" />
      ) : (
        <ul className="space-y-2">
          {items.map((g) => (
            <li key={g.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-base-200">{g.areaName}</p>
                  <p className="text-xs text-base-500">
                    {g.type === 'jamming' ? 'Trikdymas (jamming)' : 'Klastojimas (spoofing)'} · intensyvumas: {g.intensity}
                  </p>
                </div>
                <ConfidenceBadge confidence={g.confidence} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <SourceList sourceIds={g.sourceIds} sourcesById={data.sourcesById} />
                <span className="whitespace-nowrap text-[11px] text-base-500">{formatDateTimeLt(g.startedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
