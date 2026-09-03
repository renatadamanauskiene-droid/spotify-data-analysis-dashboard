import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { RelatedFeedSection } from '@/components/RelatedFeedSection'
import { formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import type { MissileChangeType } from '@/types'

const MISSILE_KEYWORDS = [
  'raket', 'missile', 'iskander', 's-300', 's-400', 'kinzhal', 'kalibr',
  'oro gynyb', 'air defense', 'antiaircraft', 'buk', 'tor ', 'pantsir',
  'branduolin', 'nuclear', 'warhead', 'smūg', 'strike', 'launch',
]

const CHANGE_LABEL: Record<MissileChangeType, string> = {
  nauja_dislokacija: 'Nauja dislokacija',
  perkelimas: 'Perkėlimas',
  grizimas: 'Grįžimas',
  pratybinis_aktyvumas: 'Pratybinis aktyvumas',
}

export default function MissilesScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const items = [...data.missiles].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime())

  return (
    <div>
      <ScreenHeader
        title="Raketos ir oro gynyba"
        subtitle="Iskander, S-300, S-400 ir kitų sistemų pokyčiai"
        action={mode === 'demo' ? <DemoBadge /> : undefined}
      />
      <p className="mb-4 text-xs text-base-500">Žymima tik tada, kai yra bent vienas patikimas viešas šaltinis.</p>

      {items.length === 0 ? (
        <>
          <EmptyState title="Struktūrizuotų stebėjimų nėra" hint="Raketų sistemų pokyčiai fiksuojami rankiniu būdu iš palydovinių/OSINT šaltinių. Susiję pranešimai:" />
          <RelatedFeedSection keywords={MISSILE_KEYWORDS} />
        </>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => {
            const loc = data.locationsById.get(m.locationId)
            return (
              <li key={m.id} className="rounded-xl border border-base-700 bg-base-850 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-base-100">{m.system}</p>
                    <p className="text-xs text-base-500">{loc?.name || m.locationId}</p>
                  </div>
                  <ConfidenceBadge confidence={m.confidence} />
                </div>
                <span className="mt-2 inline-block rounded-full bg-base-800 px-2 py-0.5 text-[11px] text-base-300">{CHANGE_LABEL[m.changeType]}</span>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <SourceList sourceIds={m.sourceIds} sourcesById={data.sourcesById} />
                  <span className="whitespace-nowrap text-[11px] text-base-500">{formatDateTimeLt(m.observedAt)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
