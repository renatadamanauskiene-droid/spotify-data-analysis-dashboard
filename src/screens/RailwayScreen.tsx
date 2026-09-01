import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import type { RailSignalType } from '@/types'

const SIGNAL_LABEL: Record<RailSignalType, string> = {
  normalus_pratybinis: 'Normalus pratybinis transportas',
  neiprastas_telkimas: 'Neįprastas telkimas',
  masinis_permetimas: 'Masinis permetimas',
}

const SIGNAL_STYLE: Record<RailSignalType, string> = {
  normalus_pratybinis: 'bg-risk-greenBg text-risk-green border-risk-green/30',
  neiprastas_telkimas: 'bg-risk-yellowBg text-risk-yellow border-risk-yellow/30',
  masinis_permetimas: 'bg-risk-redBg text-risk-red border-risk-red/30',
}

export default function RailwayScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const items = [...data.railway].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime())

  return (
    <div>
      <ScreenHeader title="Geležinkeliai" subtitle="Kariniai ešelonai ir technikos kryptis" action={mode === 'demo' ? <DemoBadge /> : undefined} />

      {items.length === 0 ? (
        <EmptyState title="Nepakanka patikimų duomenų" />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => {
            const from = data.locationsById.get(r.fromLocationId)?.name || r.fromLocationId
            const to = data.locationsById.get(r.toLocationId)?.name || r.toLocationId
            return (
              <li key={r.id} className="rounded-xl border border-base-700 bg-base-850 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-base-100">
                    {from} → {to}
                  </p>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${SIGNAL_STYLE[r.signalType]}`}>
                    {SIGNAL_LABEL[r.signalType]}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-base-400">{r.cargoDescription}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-base-500">
                  Kiek patvirtinta: <ConfidenceBadge confidence={r.confirmedLevel} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <SourceList sourceIds={r.sourceIds} sourcesById={data.sourcesById} />
                  <span className="whitespace-nowrap text-[11px] text-base-500">{formatDateTimeLt(r.observedAt)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
