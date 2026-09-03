import { useMemo } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { EmptyState } from '@/components/EmptyState'
import { formatRelativeLt } from '@/lib/format'

const KEYWORDS = [
  'satellite', 'palydov', 'imagery', 'overhead', 'aerial', 'maxar', 'planet labs',
  'sentinel', 'copernicus', 'iceye', 'sar image', 'reconnaissance', 'žvalgyb',
  'tank', 'vehicle', 'armor', 'troop build', 'force build', 'telkim', 'stovykl',
  'airfield', 'aerodrom', 'base', 'depo', 'storage', 'warehouse',
]

function matches(text: string): boolean {
  const t = text.toLowerCase()
  return KEYWORDS.some((k) => t.includes(k))
}

export default function SatelliteScreen() {
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
        title="Palydovų pokyčiai"
        subtitle="OSINT palydovinė analizė — filtruota iš srauto"
      />
      <div className="mb-4 rounded-xl border border-base-700 bg-base-900 p-3 text-xs leading-relaxed text-base-400">
        Tikroji palydovinė analizė atliekama OSINT analitikų (Bellingcat, Euromaidan Press, ISW)
        naudojant komercinius vaizdus (Maxar, Planet Labs, ICEYE). Šie pranešimai automatiškai
        surenkomi iš naujienų srauto.
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Palydovinės analizės pranešimų šiuo metu nėra"
          hint="Duomenys atnaujinami kas 3 val. iš Bellingcat, Euromaidan Press ir kt."
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
