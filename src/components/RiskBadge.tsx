import type { RiskLevel } from '@/types'
import { RISK_LABELS } from '@/lib/riskEngine'

const STYLES: Record<RiskLevel, string> = {
  ZALIA: 'bg-risk-greenBg text-risk-green border-risk-green/40',
  GELTONA: 'bg-risk-yellowBg text-risk-yellow border-risk-yellow/40',
  RAUDONA: 'bg-risk-redBg text-risk-red border-risk-red/40',
}

const DOT_STYLES: Record<RiskLevel, string> = {
  ZALIA: 'bg-risk-green',
  GELTONA: 'bg-risk-yellow',
  RAUDONA: 'bg-risk-red',
}

export function RiskBadge({ level, size = 'md' }: { level: RiskLevel; size?: 'sm' | 'md' | 'lg' }) {
  const sizeCls = size === 'lg' ? 'text-base px-4 py-1.5' : size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${STYLES[level]} ${sizeCls}`}>
      <span className={`h-2 w-2 rounded-full ${DOT_STYLES[level]}`} aria-hidden />
      {RISK_LABELS[level]}
    </span>
  )
}
