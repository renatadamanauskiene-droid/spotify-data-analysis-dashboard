import { useMemo } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { EmptyState } from '@/components/EmptyState'
import { formatRelativeLt } from '@/lib/format'

const KEYWORDS = [
  'geležink', 'gelezink', 'railway', 'railcar', 'ešelon', 'echelon',
  'convoy', 'perveži', 'krovini', 'traukin', 'logistik', 'tiekimo linij',
  'rail', 'cargo train', 'military train',
]

function matches(text: string): boolean {
  const t = text.toLowerCase()
  return KEYWORDS.some((k) => t.includes(k))
}

export default function RailwayScreen() {
  const data = useAppData()

  const items = useMemo(
    () =>
      [...data.news]
        .filter((n) => matches(`${n.title} ${n.summaryLt}`))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [data.news],
  )

  return (
    <div>
      <ScreenHeader
        title="Geležinkeliai"
        subtitle="Kariniai pervežimai ir logistika — filtruota iš OSINT srauto"
      />

      {items.length === 0 ? (
        <EmptyState
          title="Šiuo metu geležinkelių pranešimų nėra"
          hint="Duomenys atnaujinami kas 3 val. iš Euromaidan Press, Ukrinform, Baltic Defence ir kt."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <a href={item.originalUrl} target="_blank" rel="noopener noreferrer" className="block">
                <p className="text-sm font-medium text-base-200 hover:text-accent">{item.title}</p>
                {item.summaryLt && (
                  <p className="mt-1 line-clamp-2 text-xs text-base-500">{item.summaryLt}</p>
                )}
                <p className="mt-1.5 text-[11px] text-base-600">{formatRelativeLt(item.publishedAt)}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
