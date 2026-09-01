import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useAppData } from '@/lib/AppDataContext'
import { computeRiskAssessment, computeCorrelationSignal, RISK_DESCRIPTIONS } from '@/lib/riskEngine'
import { kaliningradLocationIds, belarusWestLocationIds } from '@/data/demo/locations'
import { RiskBadge } from '@/components/RiskBadge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { TimeFilter } from '@/components/TimeFilter'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { SourceList } from '@/components/SourceList'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { buildDivIcon } from '@/lib/mapIcons'
import { categoryLabel, changeTypeLabel, formatDateTimeLt } from '@/lib/format'
import { TIME_WINDOWS } from '@/types'
import type { TimeWindow } from '@/types'
import { getDataMode } from '@/lib/dataSource'

const CORRIDOR_LOCATION_IDS = new Set([
  'suvalkai',
  'augustavas',
  'seinai',
  'lazdijai',
  'druskininkai',
  'kalvarija',
  'marijampole',
  'kaliningradas',
  'gardinas',
  'asmena',
  'lyda',
  'gozhskij',
])

export default function SuwalkiScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const [windowLabel, setWindowLabel] = useState<TimeWindow['label']>('72h')
  const hours = TIME_WINDOWS.find((w) => w.label === windowLabel)!.hours

  const corridorEvents = useMemo(() => data.events.filter((e) => e.region === 'suvalku_koridorius'), [data.events])

  const eventsInWindow = useMemo(() => {
    const now = Date.now()
    return corridorEvents
      .filter((e) => now - new Date(e.occurredAt).getTime() <= hours * 3600 * 1000)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  }, [corridorEvents, hours])

  const events24 = useMemo(() => filterSince(corridorEvents, 24), [corridorEvents])
  const events72 = useMemo(() => filterSince(corridorEvents, 72), [corridorEvents])
  const events7d = useMemo(() => filterSince(corridorEvents, 24 * 7), [corridorEvents])

  const correlation = useMemo(
    () => computeCorrelationSignal(data.events, kaliningradLocationIds, belarusWestLocationIds, { windowHours: 72 }),
    [data.events],
  )

  const risk = useMemo(
    () => computeRiskAssessment(data.events, data.sources, { region: 'suvalku_koridorius', windowHours: 72, correlationDetected: Boolean(correlation) }),
    [data.events, data.sources, correlation],
  )

  const corridorLocations = data.locations.filter((l) => CORRIDOR_LOCATION_IDS.has(l.id))

  return (
    <div>
      <ScreenHeader title="Suvalkų koridorius" subtitle="Kaliningrado–Baltarusijos–Lietuvos–Lenkijos ašies stebėsena" action={mode === 'demo' ? <DemoBadge /> : undefined} />

      <section className="rounded-2xl border border-base-700 bg-base-850 p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-base-500">Bendras rizikos lygis — Suvalkų koridorius</p>
            <div className="mt-2">
              <RiskBadge level={risk.level} size="lg" />
            </div>
          </div>
          <p className="max-w-[220px] text-right text-xs text-base-500">{RISK_DESCRIPTIONS[risk.level]}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-base-800 pt-4 text-center">
          <WindowStat label="24 val." count={events24.length} />
          <WindowStat label="72 val." count={events72.length} />
          <WindowStat label="7 d." count={events7d.length} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-base-300">
          {events72.length === 0
            ? 'Per pastarąsias 72 val. reikšmingų pokyčių Kaliningrado, Gardino ar Suvalkų kryptimis nenustatyta.'
            : `Per pastarąsias 72 val. užfiksuota ${events72.length} įvykių, susijusių su Kaliningrado, Gardino ir Suvalkų kryptimis.`}
        </p>

        {risk.reasons.map((r, i) => (
          <p key={i} className="mt-1.5 text-xs text-base-500">
            • {r}
          </p>
        ))}

        {correlation && (
          <div className="mt-3 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2.5">
            <p className="text-xs font-medium text-accent">Koreliuotas aktyvumas aptiktas</p>
            <p className="mt-1 text-xs text-base-300">{correlation.descriptionLt}</p>
          </div>
        )}
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-300">Stebimos zonos</h2>
        <TimeFilter value={windowLabel} onChange={setWindowLabel} />
      </div>
      <div className="h-72 overflow-hidden rounded-2xl border border-base-700">
        <MapContainer center={[54.15, 23.2]} zoom={7} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> autoriai'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {corridorLocations.map((loc) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={buildDivIcon(loc.category, 'neutral')}>
              <Popup>{loc.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-base-300">Kariniai ir civiliniai indikatoriai</h2>
      {eventsInWindow.length === 0 ? (
        <EmptyState title="Nėra reikšmingų pokyčių" hint="Pasirinktu laikotarpiu koridoriaus zonoje pokyčių nefiksuota." />
      ) : (
        <ul className="space-y-2">
          {eventsInWindow.map((e) => (
            <li key={e.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-base-200">{e.title}</p>
                  <p className="text-xs text-base-500">{categoryLabel(e.category)}</p>
                </div>
                <ConfidenceBadge confidence={e.confidence} />
              </div>
              <p className="mt-1.5 text-xs text-base-400">{e.summaryLt}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-base-800 px-2 py-0.5 text-[11px] text-base-300">{changeTypeLabel(e.changeType)}</span>
                <span className="text-[11px] text-base-500">{formatDateTimeLt(e.occurredAt)}</span>
              </div>
              <div className="mt-2">
                <SourceList sourceIds={e.sourceIds} sourcesById={data.sourcesById} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-base-500">
        NATO, Lietuvos ir Lenkijos pusės pokyčiai rodomi tik remiantis viešai paskelbtais oficialiais pranešimais. Operacinio jautraus detalumo ar
        realaus laiko pozicijų, kurios nėra oficialiai viešos, ši programėlė nerodo.
      </p>
    </div>
  )
}

function WindowStat({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg bg-base-900 py-2">
      <p className="text-lg font-semibold text-base-100">{count}</p>
      <p className="text-[11px] text-base-500">{label}</p>
    </div>
  )
}

function filterSince(events: { occurredAt: string }[], hours: number) {
  const now = Date.now()
  return events.filter((e) => now - new Date(e.occurredAt).getTime() <= hours * 3600 * 1000)
}
