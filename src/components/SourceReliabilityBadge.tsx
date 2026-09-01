import type { SourceReliability } from '@/types'

export function SourceReliabilityBadge({ reliability }: { reliability: SourceReliability }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded border border-base-600 bg-base-800 text-[11px] font-semibold text-base-200"
      title={`Šaltinio patikimumo lygis ${reliability}`}
    >
      {reliability}
    </span>
  )
}
