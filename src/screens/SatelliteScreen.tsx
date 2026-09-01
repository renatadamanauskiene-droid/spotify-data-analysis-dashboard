import { useState } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { TimeFilter } from '@/components/TimeFilter'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { formatDateTimeLt } from '@/lib/format'
import { TIME_WINDOWS } from '@/types'
import type { TimeWindow } from '@/types'
import { getDataMode } from '@/lib/dataSource'

export default function SatelliteScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const [windowLabel, setWindowLabel] = useState<TimeWindow['label']>('30d')
  const hours = TIME_WINDOWS.find((w) => w.label === windowLabel)!.hours

  const now = Date.now()
  const items = data.satellite
    .filter((s) => now - new Date(s.observedAt).getTime() <= hours * 3600 * 1000)
    .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime())

  return (
    <div>
      <ScreenHeader title="Palydovų pokyčiai" subtitle="Viešai prieinama palydovinė OSINT analizė" action={mode === 'demo' ? <DemoBadge /> : undefined} />
      <div className="mb-4">
        <TimeFilter value={windowLabel} onChange={setWindowLabel} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Naujo patikimo palydovinio vaizdo nėra"
          hint="Pasirinktu laikotarpiu viešai prieinamų, patikimų palydovinių įrašų nerasta."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((s) => {
            const loc = data.locationsById.get(s.locationId)
            return (
              <li key={s.id} className="rounded-xl border border-base-700 bg-base-850 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-base-100">{s.title}</p>
                    <p className="text-xs text-base-500">{loc?.name || s.locationId}</p>
                  </div>
                  <ConfidenceBadge confidence={s.confidence} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <ImagePlaceholder label="Prieš" available={Boolean(s.beforeImageUrl)} />
                  <ImagePlaceholder label="Po" available={Boolean(s.afterImageUrl)} />
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-base-400">Ką matome:</p>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-base-300">
                    {s.whatWeSee.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <SourceList sourceIds={s.sourceIds} sourcesById={data.sourcesById} />
                  <span className="whitespace-nowrap text-[11px] text-base-500">{formatDateTimeLt(s.observedAt)}</span>
                </div>
                {s.isDemo && (
                  <div className="mt-2">
                    <DemoBadge />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ImagePlaceholder({ label, available }: { label: string; available: boolean }) {
  return (
    <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-base-700 bg-base-900 text-center">
      <span className="text-[11px] font-medium text-base-500">{label}</span>
      <span className="mt-0.5 px-2 text-[10px] text-base-600">{available ? 'Vaizdas prieinamas' : 'Vaizdas nepateiktas (demo)'}</span>
    </div>
  )
}
