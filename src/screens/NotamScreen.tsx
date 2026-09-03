import { useMemo } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { EmptyState } from '@/components/EmptyState'
import { formatRelativeLt } from '@/lib/format'

const NOTAM_KEYWORDS = [
  'notam', 'oro erdv', 'airspace', 'flight restriction', 'no-fly', 'tfr',
  'skrydž', 'dron', 'balloon', 'oro policij', 'air policing', 'intercept', 'scramble',
]

const EXERCISE_KEYWORDS = [
  'pratybos', 'pratyb', 'exercise', 'maneuver', 'training', 'drill',
  'zapad', 'iron wolf', 'griffin', 'saber', 'allied', 'joint',
  'karinis maneuvr', 'combined arms', 'military exercise',
]

function matchesAny(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase()
  return keywords.some((k) => t.includes(k))
}

function NewsCard({ title, summaryLt, publishedAt, originalUrl }: {
  title: string; summaryLt: string; publishedAt: string; originalUrl: string
}) {
  return (
    <li className="rounded-xl border border-base-700 bg-base-850 p-3.5">
      <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="block">
        <p className="text-sm font-medium text-base-200 hover:text-accent">{title}</p>
        {summaryLt && <p className="mt-1 line-clamp-2 text-xs text-base-500">{summaryLt}</p>}
        <p className="mt-1.5 text-[11px] text-base-600">{formatRelativeLt(publishedAt)}</p>
      </a>
    </li>
  )
}

export default function NotamScreen() {
  const data = useAppData()

  const notamNews = useMemo(
    () =>
      [...data.news]
        .filter((n) => matchesAny(`${n.title} ${n.summaryLt}`, NOTAM_KEYWORDS))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [data.news],
  )

  const exerciseNews = useMemo(
    () =>
      [...data.news]
        .filter((n) => matchesAny(`${n.title} ${n.summaryLt}`, EXERCISE_KEYWORDS))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [data.news],
  )

  return (
    <div>
      <ScreenHeader
        title="NOTAM / oro erdvė / pratybos"
        subtitle="Oro erdvės apribojimai ir pratybų naujienos — filtruota iš OSINT srauto"
      />

      <h2 className="mb-2 text-sm font-semibold text-base-300">Oro erdvės apribojimai</h2>
      {notamNews.length === 0 ? (
        <EmptyState title="Oro erdvės pranešimų šiuo metu nėra" hint="Atnaujinama kas 3 val." />
      ) : (
        <ul className="mb-6 space-y-2">
          {notamNews.map((n) => (
            <NewsCard key={n.id} title={n.title} summaryLt={n.summaryLt} publishedAt={n.publishedAt} originalUrl={n.originalUrl} />
          ))}
        </ul>
      )}

      <h2 className="mb-2 text-sm font-semibold text-base-300">Pratybos ir kariniai manevrai</h2>
      {exerciseNews.length === 0 ? (
        <EmptyState title="Pratybų pranešimų šiuo metu nėra" hint="Atnaujinama kas 3 val." />
      ) : (
        <ul className="space-y-2">
          {exerciseNews.map((n) => (
            <NewsCard key={n.id} title={n.title} summaryLt={n.summaryLt} publishedAt={n.publishedAt} originalUrl={n.originalUrl} />
          ))}
        </ul>
      )}
    </div>
  )
}
