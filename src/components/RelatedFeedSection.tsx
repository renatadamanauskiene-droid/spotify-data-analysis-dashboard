import { useMemo } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { formatRelativeLt } from '@/lib/format'
import type { NewsItem } from '@/types'

interface Props {
  keywords: string[]
  limit?: number
}

function matches(item: NewsItem, keywords: string[]): boolean {
  const t = `${item.title} ${item.summaryLt}`.toLowerCase()
  return keywords.some((k) => t.includes(k.toLowerCase()))
}

export function RelatedFeedSection({ keywords, limit = 6 }: Props) {
  const data = useAppData()

  const related = useMemo(
    () =>
      [...data.news]
        .filter((item) => matches(item, keywords))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, limit),
    [data.news, keywords, limit],
  )

  if (related.length === 0) return null

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-500">Susiję pranešimai iš Srauto</p>
      <ul className="space-y-2">
        {related.map((item) => (
          <li key={item.id} className="rounded-xl border border-base-700 bg-base-850 p-3">
            <a href={item.originalUrl} target="_blank" rel="noopener noreferrer" className="block">
              <p className="text-sm font-medium text-base-200 hover:text-accent">{item.title}</p>
              {item.summaryLt && <p className="mt-0.5 line-clamp-2 text-xs text-base-500">{item.summaryLt}</p>}
              <p className="mt-1.5 text-[11px] text-base-600">{formatRelativeLt(item.publishedAt)}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
