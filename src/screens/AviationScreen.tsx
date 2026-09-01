import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import type { AircraftCountry, AviationObservation } from '@/types'

const GROUPS: { country: AircraftCountry; label: string }[] = [
  { country: 'baltarusija', label: 'Baltarusijos orlaiviai' },
  { country: 'rusija', label: 'Rusijos orlaiviai' },
]

export default function AviationScreen() {
  const data = useAppData()
  const mode = getDataMode()

  return (
    <div>
      <ScreenHeader title="Aviacija" subtitle="Stebimas karinės aviacijos aktyvumas" action={mode === 'demo' ? <DemoBadge /> : undefined} />

      <div className="mb-4 rounded-xl border border-base-700 bg-base-900 p-3 text-xs text-base-400">
        Realaus ADS-B šaltinio integracija dar neatlikta. Rodomas tik apibendrintas, viešai stebimas aktyvumo lygis — jokie konkretūs, nepatvirtinti
        skrydžiai nerodomi.
      </div>

      {GROUPS.map((g) => {
        const items = data.aviation.filter((a) => a.country === g.country)
        return (
          <div key={g.country} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-base-300">{g.label}</h2>
            {items.length === 0 ? (
              <EmptyState title="Duomenų nėra / nepatvirtinta" />
            ) : (
              <ul className="space-y-2">
                {items.map((a) => (
                  <AviationCard key={a.id} obs={a} locationName={data.locationsById.get(a.locationId)?.name} sourcesById={data.sourcesById} />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AviationCard({
  obs,
  locationName,
  sourcesById,
}: {
  obs: AviationObservation
  locationName?: string
  sourcesById: ReturnType<typeof useAppData>['sourcesById']
}) {
  return (
    <li className="rounded-xl border border-base-700 bg-base-850 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-base-200">{obs.activity}</p>
          <p className="text-xs text-base-500">
            {obs.aircraftType} · {locationName || obs.locationId}
          </p>
        </div>
        <ConfidenceBadge confidence={obs.confidence} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <SourceList sourceIds={obs.sourceIds} sourcesById={sourcesById} />
        <span className="whitespace-nowrap text-[11px] text-base-500">{formatDateTimeLt(obs.observedAt)}</span>
      </div>
    </li>
  )
}
