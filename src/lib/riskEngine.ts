import type {
  EventItem,
  Source,
  RiskAssessment,
  RiskLevel,
  Region,
  CorrelationSignal,
  IndicatorCategory,
} from '@/types'

const RELIABLE_RELIABILITIES = new Set(['A', 'B'])

function isReliableEvent(event: EventItem, sourcesById: Map<string, Source>): boolean {
  if (event.sourceIds.length === 0) return false
  return event.sourceIds.some((id) => {
    const src = sourcesById.get(id)
    return src ? RELIABLE_RELIABILITIES.has(src.reliability) : false
  })
}

function withinWindow(iso: string, hours: number, now: Date): boolean {
  const t = new Date(iso).getTime()
  return now.getTime() - t <= hours * 60 * 60 * 1000
}

/**
 * Rizikos lygio skaičiavimas pagal specifikaciją:
 * - ŽALIA: įprastas aktyvumas.
 * - GELTONA: bent vienas reikšmingas (TIKĖTINA/PATVIRTINTA) indikatorius arba neįprastas augimas.
 * - RAUDONA: keli (>=3) NEPRIKLAUSOMI patikimi indikatoriai (skirtingos kategorijos, skirtingi
 *   šaltiniai, reliability A/B), niekada vien iš vieno silpno šaltinio.
 */
export function computeRiskAssessment(
  events: EventItem[],
  sources: Source[],
  options: { region: Region; windowHours?: number; correlationDetected?: boolean; now?: Date },
): RiskAssessment {
  const { region, windowHours = 168, correlationDetected = false, now = new Date() } = options
  const sourcesById = new Map(sources.map((s) => [s.id, s]))

  const candidateEvents = events.filter(
    (e) => e.region === region && e.riskWeight >= 1 && e.confidence !== 'NEPATVIRTINTA' && withinWindow(e.occurredAt, windowHours, now),
  )

  const reliableEvents = candidateEvents.filter((e) => isReliableEvent(e, sourcesById))
  const strongReliableEvents = reliableEvents.filter((e) => e.riskWeight === 2)

  const independentCategories = new Set(reliableEvents.map((e) => e.category))
  const independentSources = new Set(reliableEvents.flatMap((e) => e.sourceIds))

  const reasons: string[] = []

  let level: RiskLevel = 'ZALIA'

  const meetsRedThreshold =
    independentCategories.size >= 3 && strongReliableEvents.length >= 2 && independentSources.size >= 2

  if (meetsRedThreshold) {
    level = 'RAUDONA'
    reasons.push(
      `Aptikta ${independentCategories.size} nepriklausomos kategorijos reikšmingų, patikimų (A/B) indikatorių per pastarąsias ${windowHours} val.`,
    )
    if (correlationDetected) {
      reasons.push('Koreliuotas aktyvumas abiejose sienos pusėse sustiprina vertinimą.')
    }
  } else if (candidateEvents.length > 0) {
    level = 'GELTONA'
    if (reliableEvents.length > 0) {
      reasons.push(
        `Užfiksuota ${independentCategories.size} kategorijos neįprasto ar didėjančio aktyvumo indikatorius per pastarąsias ${windowHours} val.`,
      )
    } else {
      reasons.push('Yra tikėtinų signalų, tačiau jie kol kas paremti tik vienu silpnesnio patikimumo (C) šaltiniu — RAUDONA būsenai to nepakanka.')
    }
  } else {
    reasons.push('Reikšmingo, patikimo indikatoriaus per stebimą laikotarpį nenustatyta.')
  }

  if (correlationDetected && level === 'GELTONA') {
    reasons.push('Papildomas signalas: aktyvumas didėja tuo pačiu metu abiejose koridoriaus pusėse.')
  }

  return {
    level,
    reasons,
    independentCategoryCount: independentCategories.size,
    correlationDetected,
  }
}

/**
 * Suwałki koridoriaus abipusio (Kaliningrado ir vakarų Baltarusijos) koreliacijos variklis.
 * Kelia signalą, jei tame pačiame 24-72 val. lange abi pusės rodo augimą keliose kategorijose.
 */
export function computeCorrelationSignal(
  events: EventItem[],
  kaliningradLocationIds: Set<string>,
  belarusWestLocationIds: Set<string>,
  options: { windowHours?: 24 | 72; now?: Date } = {},
): CorrelationSignal | null {
  const { windowHours = 72, now = new Date() } = options

  const inWindow = events.filter(
    (e) => e.riskWeight >= 1 && e.confidence !== 'NEPATVIRTINTA' && withinWindow(e.occurredAt, windowHours, now),
  )

  const kaliningradCategories = new Set<IndicatorCategory>(
    inWindow.filter((e) => e.locationId && kaliningradLocationIds.has(e.locationId)).map((e) => e.category),
  )
  const belarusCategories = new Set<IndicatorCategory>(
    inWindow.filter((e) => e.locationId && belarusWestLocationIds.has(e.locationId)).map((e) => e.category),
  )

  if (kaliningradCategories.size >= 2 && belarusCategories.size >= 2) {
    return {
      id: `correlation-${windowHours}h-${now.toISOString()}`,
      windowHours,
      detectedAt: now.toISOString(),
      kaliningradCategories: Array.from(kaliningradCategories),
      belarusCategories: Array.from(belarusCategories),
      descriptionLt: `Per pastarąsias ${windowHours} val. aktyvumas vienu metu augo tiek Kaliningrado srityje, tiek vakarų Baltarusijoje — keliose skirtingose kategorijose kiekvienoje pusėje.`,
      isDemo: inWindow.some((e) => e.isDemo),
    }
  }

  return null
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  ZALIA: 'ŽALIA',
  GELTONA: 'GELTONA',
  RAUDONA: 'RAUDONA',
}

export const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
  ZALIA: 'Įprastas aktyvumas, reikšmingo telkimo nematoma.',
  GELTONA: 'Neįprastas ar didėjantis aktyvumas, reikalauja dėmesio.',
  RAUDONA: 'Keli nepriklausomi patikimi indikatoriai, suderinami su reikšmingos grupuotės formavimu.',
}
