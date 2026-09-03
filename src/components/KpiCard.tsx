import type { Indicator } from '@/types'
import { ConfidenceBadge } from './ConfidenceBadge'
import { formatRelativeLt } from '@/lib/format'

const TREND_GLYPH: Record<Indicator['trend'], string> = {
  up: '↑',
  down: '↓',
  flat: '—',
  unknown: '?',
}

const TREND_COLOR: Record<Indicator['trend'], string> = {
  up: 'text-risk-yellow',
  down: 'text-risk-green',
  flat: 'text-base-400',
  unknown: 'text-base-500',
}

const TREND_BG: Record<Indicator['trend'], string> = {
  up: 'bg-risk-yellowBg border-risk-yellow/20',
  down: 'bg-risk-greenBg border-risk-green/20',
  flat: 'bg-base-800 border-base-700',
  unknown: 'bg-base-800 border-base-700',
}

export function KpiCard({ indicator, onClick }: { indicator: Indicator; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-base-700 bg-base-850 p-3.5 text-left shadow-panel transition hover:border-base-600 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="line-clamp-2 text-[11px] font-medium leading-tight text-base-400">{indicator.label}</span>
        <ConfidenceBadge confidence={indicator.confidence} />
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-xl font-bold leading-none text-base-100">{indicator.value}</span>
        <span
          className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${TREND_BG[indicator.trend]} ${TREND_COLOR[indicator.trend]}`}
        >
          {TREND_GLYPH[indicator.trend]} {indicator.deltaLabel}
        </span>
      </div>

      <p className="text-[10px] text-base-500">{formatRelativeLt(indicator.asOf)}</p>
    </button>
  )
}
