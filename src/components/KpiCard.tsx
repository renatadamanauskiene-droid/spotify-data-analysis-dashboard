import type { Indicator } from '@/types'
import { ConfidenceBadge } from './ConfidenceBadge'
import { formatRelativeLt } from '@/lib/format'

const TREND_GLYPH: Record<Indicator['trend'], string> = {
  up: '↑',
  down: '↓',
  flat: '→',
  unknown: '?',
}

const TREND_COLOR: Record<Indicator['trend'], string> = {
  up: 'text-risk-yellow',
  down: 'text-risk-green',
  flat: 'text-base-400',
  unknown: 'text-base-500',
}

export function KpiCard({ indicator, onClick }: { indicator: Indicator; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-base-700 bg-base-850 p-3.5 text-left shadow-panel transition hover:border-base-500 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-base-400">{indicator.label}</span>
        <ConfidenceBadge confidence={indicator.confidence} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-base-100">{indicator.value}</span>
        <span className={`text-sm ${TREND_COLOR[indicator.trend]}`}>{TREND_GLYPH[indicator.trend]}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-base-500">
        <span>{indicator.deltaLabel}</span>
        <span>{formatRelativeLt(indicator.asOf)}</span>
      </div>
    </button>
  )
}
