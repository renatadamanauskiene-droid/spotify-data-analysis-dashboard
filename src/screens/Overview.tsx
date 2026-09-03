import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '@/lib/AppDataContext'
import { computeRiskAssessment, computeCorrelationSignal, RISK_DESCRIPTIONS, RISK_LABELS } from '@/lib/riskEngine'
import { kaliningradLocationIds, belarusWestLocationIds } from '@/data/demo/locations'
import { KpiCard } from '@/components/KpiCard'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { EmptyState } from '@/components/EmptyState'
import { DemoBadge } from '@/components/DemoBadge'
import { CorridorIcon, AlertTriangleIcon, ClockIcon, ChevronRightIcon } from '@/components/icons'
import { changeTypeLabel, formatRelativeLt, formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import type { EventItem, RiskLevel, Lt72Alert } from '@/types'

// ---------------------------------------------------------------------------
// Risk level theme tokens
// ---------------------------------------------------------------------------

const RISK_THEME: Record<RiskLevel, { container: string; text: string; muted: string; secondary: string; dot: string; divider: string }> = {
  ZALIA: {
    container: 'border-risk-green/30 bg-risk-greenBg',
    text: 'text-risk-green',
    muted: 'text-risk-green/60',
    secondary: 'text-risk-green/75',
    dot: 'bg-risk-green',
    divider: 'border-risk-green/20',
  },
  GELTONA: {
    container: 'border-risk-yellow/30 bg-risk-yellowBg',
    text: 'text-risk-yellow',
    muted: 'text-risk-yellow/60',
    secondary: 'text-risk-yellow/75',
    dot: 'bg-risk-yellow',
    divider: 'border-risk-yellow/20',
  },
  RAUDONA: {
    container: 'border-risk-red/30 bg-risk-redBg',
    text: 'text-risk-red',
    muted: 'text-risk-red/60',
    secondary: 'text-risk-red/75',
    dot: 'bg-risk-red',
    divider: 'border-risk-red/20',
  },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuickStat({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-base font-bold leading-none ${alert ? 'text-risk-red' : 'text-base-200'}`}>{value}</span>
      <span className="text-[10px] text-base-500">{label}</span>
    </div>
  )
}

function ThreatHero({
  risk,
  events24h,
  lt72Count,
  srcCount,
}: {
  risk: { level: RiskLevel; reasons: string[] }
  events24h: number
  lt72Count: number
  srcCount: number
}) {
  const theme = RISK_THEME[risk.level]

  return (
    <div className={`rounded-2xl border p-5 shadow-panel ${theme.container}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest ${theme.muted}`}>Grėsmės vertinimas · Baltarusija</p>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="relative flex h-3 w-3 shrink-0">
          {risk.level === 'RAUDONA' && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${theme.dot}`} />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${theme.dot}`} />
        </span>
        <span className={`text-2xl font-black tracking-tight ${theme.text}`}>{RISK_LABELS[risk.level]}</span>
      </div>

      <p className={`mt-2 text-sm leading-relaxed ${theme.secondary}`}>{RISK_DESCRIPTIONS[risk.level]}</p>

      {risk.reasons.length > 0 && (
        <div className="mt-3 space-y-1">
          {risk.reasons.slice(0, 2).map((r, i) => (
            <p key={i} className={`text-xs ${theme.muted}`}>
              · {r}
            </p>
          ))}
        </div>
      )}

      <div className={`mt-4 flex gap-6 border-t pt-3 ${theme.divider}`}>
        <QuickStat label="Įvykiai 24h" value={String(events24h)} />
        <QuickStat label="LT72" value={lt72Count > 0 ? `${lt72Count} aktyvūs` : 'Nėra'} alert={lt72Count > 0} />
        <QuickStat label="Šaltiniai" value={`${srcCount} aktyvūs`} />
      </div>
    </div>
  )
}

function Lt72TopBanner({ alert, onNavigate }: { alert: Lt72Alert; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="flex w-full items-center gap-3 rounded-xl border border-risk-red/30 bg-risk-redBg p-3.5 text-left shadow-panel transition active:scale-[0.99]"
    >
      <AlertTriangleIcon className="h-5 w-5 shrink-0 text-risk-red" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-risk-red">LT72 oficialus perspėjimas</p>
        <p className="mt-0.5 truncate text-sm font-medium text-risk-red/90">{alert.title}</p>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-risk-red/50" />
    </button>
  )
}

function CorridorButton({
  level,
  lastChange,
  onNavigate,
}: {
  level: RiskLevel
  lastChange: string
  onNavigate: () => void
}) {
  const theme = RISK_THEME[level]
  return (
    <button
      onClick={onNavigate}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-base-700 bg-base-850 p-4 text-left shadow-panel transition hover:border-base-600 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <CorridorIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-medium text-base-200">Suvalkų koridorius</p>
          <p className="text-xs text-base-500">Paskutinis pokytis: {lastChange}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${theme.container} ${theme.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
          {RISK_LABELS[level]}
        </span>
        <ChevronRightIcon className="h-4 w-4 text-base-500" />
      </div>
    </button>
  )
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <li className="rounded-xl border border-base-700 bg-base-850 p-4 shadow-panel">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-base-200">{event.title}</p>
        <ConfidenceBadge confidence={event.confidence} />
      </div>
      {event.summaryLt && <p className="mt-1.5 text-xs leading-relaxed text-base-400">{event.summaryLt}</p>}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="rounded-full bg-base-800 px-2 py-0.5 text-[11px] text-base-400">{changeTypeLabel(event.changeType)}</span>
        <span className="flex items-center gap-1 text-[11px] text-base-500">
          <ClockIcon className="h-3 w-3" />
          {formatRelativeLt(event.occurredAt)}
        </span>
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function Overview() {
  const data = useAppData()
  const navigate = useNavigate()
  const mode = getDataMode()

  const belarusEvents = useMemo(() => data.events.filter((e) => e.region === 'baltarusija'), [data.events])
  const events24 = useMemo(() => filterSince(belarusEvents, 24), [belarusEvents])

  const correlation = useMemo(
    () => computeCorrelationSignal(data.events, kaliningradLocationIds, belarusWestLocationIds, { windowHours: 72 }),
    [data.events],
  )

  const belarusRisk = useMemo(
    () => computeRiskAssessment(data.events, data.sources, { region: 'baltarusija', windowHours: 72, correlationDetected: Boolean(correlation) }),
    [data.events, data.sources, correlation],
  )

  const suwalkiRisk = useMemo(
    () => computeRiskAssessment(data.events, data.sources, { region: 'suvalku_koridorius', windowHours: 72, correlationDetected: Boolean(correlation) }),
    [data.events, data.sources, correlation],
  )

  const significant24 = events24.filter((e) => e.riskWeight >= 1 && e.confidence !== 'NEPATVIRTINTA')
  const indicators = data.indicators.filter((i) => i.region === 'baltarusija')
  const enabledSources = data.sources.filter((s) => s.enabled).length

  const topLt72 = useMemo(
    () =>
      [...data.lt72]
        .filter((a) => a.publishedAt)
        .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())[0] ?? null,
    [data.lt72],
  )

  const corridorLastChange = mostRecentOccurredAt(data.events, 'suvalku_koridorius')

  if (data.loading) {
    return <ScreenSkeleton />
  }

  return (
    <div className="space-y-3">
      {/* Demo badge — slim chip above hero */}
      {mode === 'demo' && (
        <div className="flex justify-end">
          <DemoBadge />
        </div>
      )}

      {/* LEVEL 1 — Threat hero */}
      <ThreatHero
        risk={belarusRisk}
        events24h={events24.length}
        lt72Count={data.lt72.length}
        srcCount={enabledSources}
      />

      {/* LEVEL 2 — Aktyvus LT72 perspėjimas */}
      {topLt72 && <Lt72TopBanner alert={topLt72} onNavigate={() => navigate('/signalai')} />}

      {/* Suvalkų koridoriaus rizika */}
      <CorridorButton
        level={suwalkiRisk.level}
        lastChange={corridorLastChange ? formatRelativeLt(corridorLastChange) : '—'}
        onNavigate={() => navigate('/suvalkai')}
      />

      {/* LEVEL 3 — Recent significant events */}
      <section>
        <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-500">
          <ClockIcon className="h-3.5 w-3.5" />
          Kas naujo nuo vakar
        </h2>
        {significant24.length === 0 ? (
          <EmptyState title="Reikšmingų pokyčių nėra" hint="Per pastarąsias 24 val. patikimų pokyčių nenustatyta." />
        ) : (
          <ul className="space-y-2">
            {significant24.slice(0, 5).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </ul>
        )}
      </section>

      {/* LEVEL 4 — KPI indicators */}
      {indicators.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-base-500">Pagrindiniai rodikliai</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {indicators.map((ind) => (
              <KpiCard key={ind.id} indicator={ind} />
            ))}
          </div>
        </section>
      )}

      {/* Offline warning */}
      {data.offline && (
        <div className="rounded-xl border border-risk-yellow/30 bg-risk-yellowBg px-4 py-3">
          <p className="text-xs font-medium text-risk-yellow">
            Rodomi paskutiniai žinomi duomenys — šiuo metu nėra interneto ryšio.
          </p>
        </div>
      )}

      {/* Footer — data freshness */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-800 pt-3 text-xs text-base-500">
        <span>Atnaujinta: {data.loadedAt ? formatDateTimeLt(data.loadedAt) : '—'}</span>
        <button onClick={() => navigate('/saltiniai')} className="text-accent hover:underline">
          Šaltiniai {enabledSources}/{data.sources.length} →
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterSince(events: EventItem[], hours: number): EventItem[] {
  const now = Date.now()
  return events.filter((e) => now - new Date(e.occurredAt).getTime() <= hours * 3600 * 1000)
}

function mostRecentOccurredAt(events: EventItem[], region: string): string {
  const filtered = events.filter((e) => e.region === region)
  if (filtered.length === 0) return ''
  return filtered.reduce((latest, e) => (new Date(e.occurredAt) > new Date(latest) ? e.occurredAt : latest), filtered[0].occurredAt)
}

function ScreenSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-40 rounded-2xl bg-base-850" />
      <div className="h-14 rounded-xl bg-base-850" />
      <div className="h-14 rounded-xl bg-base-850" />
      <div className="h-6 w-32 rounded-lg bg-base-850" />
      <div className="space-y-2">
        <div className="h-20 rounded-xl bg-base-850" />
        <div className="h-20 rounded-xl bg-base-850" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-base-850" />
        ))}
      </div>
    </div>
  )
}
