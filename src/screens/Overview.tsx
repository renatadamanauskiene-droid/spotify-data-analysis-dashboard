import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '@/lib/AppDataContext'
import { computeRiskAssessment, computeCorrelationSignal, RISK_DESCRIPTIONS } from '@/lib/riskEngine'
import { kaliningradLocationIds, belarusWestLocationIds } from '@/data/demo/locations'
import { RiskBadge } from '@/components/RiskBadge'
import { KpiCard } from '@/components/KpiCard'
import { ConfidenceBadge } from '@/components/ConfidenceBadge'
import { EmptyState } from '@/components/EmptyState'
import { ScreenHeader } from '@/components/ScreenHeader'
import { DemoBadge } from '@/components/DemoBadge'
import { CorridorIcon, ClockIcon, ChevronRightIcon } from '@/components/icons'
import { changeTypeLabel, formatRelativeLt, formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import type { EventItem } from '@/types'

export default function Overview() {
  const data = useAppData()
  const navigate = useNavigate()
  const mode = getDataMode()

  const belarusEvents = useMemo(() => data.events.filter((e) => e.region === 'baltarusija'), [data.events])
  const events24 = useMemo(() => filterSince(belarusEvents, 24), [belarusEvents])
  const events72 = useMemo(() => filterSince(belarusEvents, 72), [belarusEvents])

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
  const unusualBuildup = belarusRisk.independentCategoryCount >= 2

  const summarySentences = buildSummary({
    level: belarusRisk.level,
    changes24: events24.length,
    changes72: events72.length,
    unusualBuildup,
    correlationDetected: Boolean(correlation),
  })

  const indicators = data.indicators.filter((i) => i.region === 'baltarusija')

  const enabledSources = data.sources.filter((s) => s.enabled).length

  if (data.loading) {
    return <ScreenSkeleton />
  }

  return (
    <div>
      <ScreenHeader
        title="Dabar"
        subtitle="Šiandienos bendra ankstyvojo perspėjimo situacija Lietuvai"
        action={mode === 'demo' ? <DemoBadge /> : undefined}
      />

      <section className="rounded-2xl border border-base-700 bg-base-850 p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-base-500">Bendras rizikos lygis — Baltarusija</p>
            <div className="mt-2">
              <RiskBadge level={belarusRisk.level} size="lg" />
            </div>
          </div>
          <p className="max-w-[220px] text-right text-xs text-base-500">{RISK_DESCRIPTIONS[belarusRisk.level]}</p>
        </div>

        <div className="mt-4 space-y-1.5 border-t border-base-800 pt-4">
          {summarySentences.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed text-base-300">
              {s}
            </p>
          ))}
        </div>

        {belarusRisk.reasons.length > 0 && (
          <div className="mt-4 space-y-1 border-t border-base-800 pt-3">
            {belarusRisk.reasons.map((r, i) => (
              <p key={i} className="text-xs text-base-500">
                • {r}
              </p>
            ))}
          </div>
        )}
      </section>

      <button
        onClick={() => navigate('/suvalkai')}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-base-700 bg-base-850 p-4 text-left shadow-panel transition hover:border-base-500"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <CorridorIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-base-200">Suvalkų koridoriaus rizika</p>
            <p className="text-xs text-base-500">
              Paskutinis pokytis {suwalkiRisk.reasons[0] ? formatRelativeLt(mostRecentOccurredAt(data.events, 'suvalku_koridorius')) : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={suwalkiRisk.level} size="sm" />
          <ChevronRightIcon className="h-4 w-4 text-base-500" />
        </div>
      </button>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-base-300">Pagrindiniai rodikliai</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {indicators.map((ind) => (
          <KpiCard key={ind.id} indicator={ind} />
        ))}
      </div>

      <h2 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-base-300">
        <ClockIcon className="h-4 w-4" /> Kas naujo nuo vakar
      </h2>
      {significant24.length === 0 ? (
        <EmptyState title="Nėra reikšmingų pokyčių" hint="Per pastarąsias 24 val. reikšmingo, patikimo pokyčio nenustatyta." />
      ) : (
        <ul className="space-y-2">
          {significant24.map((e) => (
            <li key={e.id} className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-base-200">{e.title}</p>
                <ConfidenceBadge confidence={e.confidence} />
              </div>
              <p className="mt-1 text-xs text-base-500">{e.summaryLt}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-base-500">
                <span className="rounded-full bg-base-800 px-2 py-0.5">{changeTypeLabel(e.changeType)}</span>
                <span>{formatDateTimeLt(e.occurredAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-base-800 pt-4 text-xs text-base-500">
        <span>Paskutinis duomenų atnaujinimas: {data.loadedAt ? formatDateTimeLt(data.loadedAt) : '—'}</span>
        <button onClick={() => navigate('/saltiniai')} className="text-accent hover:underline">
          Šaltinių būklė: {enabledSources}/{data.sources.length} aktyvūs →
        </button>
      </div>
      {data.offline && (
        <p className="mt-2 text-xs text-risk-yellow">Rodomi paskutiniai žinomi duomenys — įrenginys šiuo metu neprisijungęs.</p>
      )}
    </div>
  )
}

function filterSince(events: EventItem[], hours: number): EventItem[] {
  const now = Date.now()
  return events.filter((e) => now - new Date(e.occurredAt).getTime() <= hours * 3600 * 1000)
}

function mostRecentOccurredAt(events: EventItem[], region: string): string {
  const filtered = events.filter((e) => e.region === region)
  if (filtered.length === 0) return new Date().toISOString()
  return filtered.reduce((latest, e) => (new Date(e.occurredAt) > new Date(latest) ? e.occurredAt : latest), filtered[0].occurredAt)
}

function buildSummary(opts: {
  level: string
  changes24: number
  changes72: number
  unusualBuildup: boolean
  correlationDetected: boolean
}): string[] {
  const { level, changes24, changes72, unusualBuildup, correlationDetected } = opts
  const sentences: string[] = []

  if (changes24 === 0 && changes72 === 0) {
    sentences.push('Per pastarąsias 24 ir 72 valandas reikšmingų, patikimų pokyčių nenustatyta.')
  } else {
    sentences.push(`Per pastarąsias 24 val. užfiksuota ${changes24} įvykių, per 72 val. — ${changes72}.`)
  }

  sentences.push(
    unusualBuildup
      ? 'Matomas keleto skirtingų kategorijų aktyvumo augimas, tačiau kol kas jis neatitinka RAUDONOS būsenos kriterijų.'
      : 'Neįprasto, keliomis kategorijomis paremto telkimo šiuo metu nematoma.',
  )

  if (correlationDetected) {
    sentences.push('Aktyvumas vienu metu didėja tiek Kaliningrado srityje, tiek vakarų Baltarusijoje — tai stebima kaip papildomas signalas.')
  }

  if (level === 'RAUDONA') {
    sentences.push('Situacija vertinama kaip reikšminga: keli nepriklausomi patikimi šaltiniai patvirtina suderintus pokyčius.')
  } else if (level === 'GELTONA') {
    sentences.push('Situacija stebima atidžiau nei įprastai, tačiau vienareikšmio pavojaus signalo nėra.')
  } else {
    sentences.push('Bendra situacija vertinama kaip įprasta.')
  }

  return sentences.slice(0, 5)
}

function ScreenSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-28 rounded-2xl bg-base-850" />
      <div className="h-16 rounded-2xl bg-base-850" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-base-850" />
        ))}
      </div>
    </div>
  )
}
