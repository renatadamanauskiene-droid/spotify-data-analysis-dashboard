import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { RelatedFeedSection } from '@/components/RelatedFeedSection'
import { AlertTriangleIcon } from '@/components/icons'
import { formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'

const NOTAM_KEYWORDS = [
  'notam', 'oro erdv', 'airspace', 'pratybos', 'pratyb', 'exercise', 'maneuver',
  'skrydž', 'flight restriction', 'tfr', 'no-fly', 'suvalk', 'suwalki',
  'oro policij', 'air policing', 'intercept', 'scramble', 'dron', 'balloon',
]

const EXERCISE_KEYWORDS = [
  'pratybos', 'pratyb', 'exercise', 'maneuver', 'training', 'drill',
  'zapad', 'allied', 'nato exercise', 'iron wolf', 'griffin', 'saber',
  'karinis', 'military exercise', 'joint', 'combined arms',
]

export default function NotamScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const notams = [...data.notams].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
  const exercises = [...data.exercises].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  return (
    <div>
      <ScreenHeader title="NOTAM / oro erdvė / pratybos" subtitle="Oro erdvės apribojimai ir pratybų kalendorius" action={mode === 'demo' ? <DemoBadge /> : undefined} />

      <h2 className="mb-2 text-sm font-semibold text-base-300">Aktyvūs / nauji apribojimai</h2>
      {notams.length === 0 ? (
        <>
          <EmptyState title="Struktūrizuotų NOTAM įrašų nėra" hint="NOTAM duomenys įvedami rankiniu būdu. Susiję pranešimai:" />
          <RelatedFeedSection keywords={NOTAM_KEYWORDS} />
        </>
      ) : (
        <ul className="mb-6 space-y-2">
          {notams.map((n) => (
            <li key={n.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-base-200">{n.title}</p>
                  <p className="text-xs text-base-500">
                    {n.area} · {n.restrictionType}
                  </p>
                </div>
                <ConfidenceBadge confidence={n.confidence} />
              </div>
              <p className="mt-2 text-[11px] text-base-500">
                {formatDateTimeLt(n.startsAt)} – {formatDateTimeLt(n.endsAt)}
              </p>
              <div className="mt-2">
                <SourceList sourceIds={n.sourceIds} sourcesById={data.sourcesById} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 text-sm font-semibold text-base-300">Pratybų kalendorius</h2>
      {exercises.length === 0 ? (
        <>
          <EmptyState title="Struktūrizuotų pratybų įrašų nėra" hint="Pratybų kalendorius pildomas rankiniu būdu. Susiję pranešimai:" />
          <RelatedFeedSection keywords={EXERCISE_KEYWORDS} />
        </>
      ) : (
        <ul className="space-y-2">
          {exercises.map((ex) => (
            <li key={ex.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-base-200">{ex.name}</p>
                  <p className="text-xs text-base-500">{ex.sides.join(' • ')}</p>
                </div>
                <ConfidenceBadge confidence={ex.confidence} />
              </div>
              <p className="mt-1.5 text-xs text-base-400">Mastas: {ex.scale}</p>
              <p className="mt-1 text-[11px] text-base-500">
                {formatDateTimeLt(ex.startsAt)} – {formatDateTimeLt(ex.endsAt)}
              </p>
              <p className="mt-1 text-[11px] text-base-500">
                Vietos: {ex.locationIds.map((id) => data.locationsById.get(id)?.name || id).join(', ')}
              </p>

              {ex.personnelRemainedAfter === true && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-risk-red/30 bg-risk-redBg px-2.5 py-2 text-xs text-risk-red">
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Kritinis indikatorius: po oficialios pratybų pabaigos technika ir/ar personalas liko Baltarusijoje.</span>
                </div>
              )}
              {ex.personnelRemainedAfter === false && (
                <p className="mt-2 text-[11px] text-risk-green">Po pratybų pabaigos pasilikimo nefiksuota.</p>
              )}

              <div className="mt-2">
                <SourceList sourceIds={ex.sourceIds} sourcesById={data.sourcesById} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
