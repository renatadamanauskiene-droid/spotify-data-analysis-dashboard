import type { Source } from '@/types'
import { SourceReliabilityBadge } from './SourceReliabilityBadge'

export function SourceList({ sourceIds, sourcesById }: { sourceIds: string[]; sourcesById: Map<string, Source> }) {
  if (sourceIds.length === 0) {
    return <span className="text-xs text-base-500">Šaltinis nenurodytas</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sourceIds.map((id) => {
        const src = sourcesById.get(id)
        if (!src) return null
        return (
          <span key={id} className="inline-flex items-center gap-1 rounded-md border border-base-700 bg-base-900 px-1.5 py-0.5 text-xs text-base-300">
            <SourceReliabilityBadge reliability={src.reliability} />
            {src.name}
          </span>
        )
      })}
    </div>
  )
}
