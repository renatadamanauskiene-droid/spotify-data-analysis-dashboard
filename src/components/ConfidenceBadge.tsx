import type { Confidence } from '@/types'
import { confidenceLabel } from '@/lib/format'

const STYLES: Record<Confidence, string> = {
  PATVIRTINTA: 'bg-risk-greenBg text-risk-green border-risk-green/30',
  TIKETINA: 'bg-risk-yellowBg text-risk-yellow border-risk-yellow/30',
  NEPATVIRTINTA: 'bg-base-800 text-base-400 border-base-600',
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STYLES[confidence]}`}>
      {confidenceLabel(confidence)}
    </span>
  )
}
