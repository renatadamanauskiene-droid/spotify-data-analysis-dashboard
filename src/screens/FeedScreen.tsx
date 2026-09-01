import { useMemo, useState } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceReliabilityBadge } from '@/components/SourceReliabilityBadge'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { formatRelativeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'

const SOURCE_TYPE_LABEL: Record<string, string> = {
  oficialus_lt: 'Lietuvos institucija',
  oficialus_nato: 'NATO',
  oficialus_uzsienio: 'Užsienio institucija',
  analitinis_osint: 'Analitinis / OSINT',
  zeleznodorozny_osint: 'Geležinkelių OSINT',
  ziniasklaida: 'Žiniasklaida',
  kitas: 'Kita',
}

export default function FeedScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const [regionFilter, setRegionFilter] = useState<'visi' | 'baltarusija' | 'suvalku_koridorius'>('visi')

  const items = useMemo(() => {
    return [...data.news]
      .filter((n) => regionFilter === 'visi' || n.region === regionFilter || n.region === 'abu')
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  }, [data.news, regionFilter])

  return (
    <div>
      <ScreenHeader title="Naujienų ir OSINT srautas" subtitle="Agreguoti patikimi šaltiniai" action={mode === 'demo' ? <DemoBadge /> : undefined} />

      <div className="mb-4 inline-flex rounded-lg border border-base-700 bg-base-900 p-0.5">
        {(
          [
            { key: 'visi', label: 'Visi' },
            { key: 'baltarusija', label: 'Baltarusija' },
            { key: 'suvalku_koridorius', label: 'Suvalkų koridorius' },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setRegionFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              regionFilter === f.key ? 'bg-accent text-white' : 'text-base-400 hover:text-base-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState title="Nepakanka patikimų duomenų" />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const src = data.sourcesById.get(n.sourceId)
            return (
              <li key={n.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-base-100">{n.title}</p>
                  <ConfidenceBadge confidence={n.confidence} />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-base-400">{n.summaryLt}</p>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-base-500">
                  <div className="flex items-center gap-1.5">
                    {src && <SourceReliabilityBadge reliability={src.reliability} />}
                    <span>{src?.name || n.sourceId}</span>
                    <span className="text-base-700">·</span>
                    <span>{SOURCE_TYPE_LABEL[src?.type || ''] || '—'}</span>
                  </div>
                  <span>{formatRelativeLt(n.publishedAt)}</span>
                </div>
                {n.originalUrl && (
                  <a
                    href={n.originalUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-block text-xs text-accent hover:underline"
                  >
                    Originalo nuoroda →
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
