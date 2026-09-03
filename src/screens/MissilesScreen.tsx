import { useMemo } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { EmptyState } from '@/components/EmptyState'
import { formatRelativeLt } from '@/lib/format'

const KEYWORDS = [
  'raket', 'missile', 'iskander', 's-300', 's-400', 'kinzhal', 'kalibr',
  'oro gynyb', 'air defense', 'antiaircraft', 'buk', 'tor ', 'pantsir',
  'branduolin', 'nuclear', 'warhead', 'smūg', 'strike', 'launch',
  'hypersonic', 'zirkon', 'dagger', 'sarmat', 'yars',
]

function matches(text: string): boolean {
  const t = text.toLowerCase()
  return KEYWORDS.some((k) => t.includes(k))
}

export default function MissilesScreen() {
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
        title="Raketos ir oro gynyba"
        subtitle="Raketų sistemos ir oro gynybos pokyčiai — filtruota iš OSINT srauto"
      />
      <div className="mb-4 rounded-xl border border-base-700 bg-base-900 p-3 text-xs leading-relaxed text-base-400">
        Iskander, S-300/400, Kalibr ir kt. sistemų dislokacijos pokyčiai fiksuojami palydovinės
        OSINT analizės ataskaitose (Bellingcat, Euromaidan Press, ISW). Šie pranešimai automatiškai
        surenkomi iš naujienų srauto.{' '}
        <strong className="text-base-300">Shahed tipo dronai ir sparnuotosios raketos
        ADS-B nesiunčia</strong> — jų judėjimą galima sekti tik iš naujienų.
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Šiuo metu raketų sistemų pranešimų nėra"
          hint="Duomenys atnaujinami kas 3 val. iš Euromaidan Press, Ukrinform, Defence Blog ir kt."
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
