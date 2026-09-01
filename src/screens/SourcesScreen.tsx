import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { SourceReliabilityBadge } from '@/components/SourceReliabilityBadge'
import { DemoBadge } from '@/components/DemoBadge'
import { formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import { useLocalSourceToggles } from '@/lib/preferences'

const TYPE_LABEL: Record<string, string> = {
  oficialus_lt: 'Lietuvos institucija',
  oficialus_nato: 'NATO',
  oficialus_uzsienio: 'Užsienio institucija',
  analitinis_osint: 'Analitinis / OSINT',
  zeleznodorozny_osint: 'Geležinkelių OSINT',
  ziniasklaida: 'Žiniasklaida',
  kitas: 'Kita',
}

const STATUS_LABEL: Record<string, string> = {
  veikia: 'Veikia',
  sutrikimas: 'Sutrikimas',
  laukia_integracijos: 'Laukia integracijos',
}

const STATUS_STYLE: Record<string, string> = {
  veikia: 'text-risk-green',
  sutrikimas: 'text-risk-red',
  laukia_integracijos: 'text-base-500',
}

export default function SourcesScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const { overrides, toggle } = useLocalSourceToggles()

  return (
    <div>
      <ScreenHeader title="Šaltiniai" subtitle="Šaltinių būklė ir valdymas" action={mode === 'demo' ? <DemoBadge /> : undefined} />

      {mode === 'demo' && (
        <p className="mb-4 text-xs text-base-500">
          DEMO režime šaltinių įjungimas / išjungimas išsaugomas tik šiame įrenginyje ir neturi įtakos realiam duomenų surinkimui. Realiame diegime
          šis veiksmas keičia <code className="text-base-400">sources.enabled</code> Supabase lentelėje ir gali atlikti tik service-role backend.
        </p>
      )}

      <ul className="space-y-2">
        {data.sources.map((s) => {
          const enabled = overrides[s.id] === undefined ? s.enabled : overrides[s.id]
          return (
            <li key={s.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <SourceReliabilityBadge reliability={s.reliability} />
                  <div>
                    <p className="text-sm font-medium text-base-200">{s.name}</p>
                    <p className="text-xs text-base-500">{TYPE_LABEL[s.type] || s.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggle(s.id, enabled)}
                  className={`h-6 w-11 shrink-0 rounded-full transition ${enabled ? 'bg-accent' : 'bg-base-700'}`}
                  aria-label={enabled ? 'Išjungti šaltinį' : 'Įjungti šaltinį'}
                >
                  <span className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-base-500">
                <span className={STATUS_STYLE[s.status]}>{STATUS_LABEL[s.status]}</span>
                <span>{s.lastSuccessfulFetch ? `Paskutinis atnaujinimas: ${formatDateTimeLt(s.lastSuccessfulFetch)}` : 'Dar nebuvo atnaujintas'}</span>
              </div>
              {s.notes && <p className="mt-1.5 text-[11px] text-base-500">{s.notes}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
