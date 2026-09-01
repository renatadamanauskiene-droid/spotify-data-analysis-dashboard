// Grėsmės atpažinimo variklis orlaiviams (ADS-B). Įvertina KIEKVIENĄ orlaivį pagal ICAO tipo
// kodą (`t`), karinio orlaivio žymę (`dbFlags` bitas 1), avarinį kodą (`squawk`) ir šaukinį,
// ir priskiria grėsmės lygį: INFO (civilinis) / ĮSPĖJIMAS / PAVOJUS.
//
// SVARBU (atsakingas naudojimas): ADS-B buvimas NĖRA patvirtinta karinė grėsmė. Daug karinių
// orlaivių ADS-B išvis netransliuoja arba slepia duomenis, o civilinis orlaivis iš Rusijos/
// Baltarusijos NĖRA grėsmė. Grėsmės lygis grindžiamas orlaivio TIPU (ne vien registracijos
// šalimi) ir yra tik ankstyvo dėmesio žyma analitikui, ne galutinis vertinimas. Shahed tipo
// dronai ir raketos ADS-B netransliuoja — jų čia NEBUS (žr. naujienų srautą / oro pavojaus
// šaltinius).

import type { LiveFlight } from './openSky'

export type ThreatLevel = 'INFO' | 'ISPEJIMAS' | 'PAVOJUS'

export type AircraftClass =
  | 'naikintuvas'
  | 'bombonesis'
  | 'karinis_transportas'
  | 'zvalgybinis'
  | 'kuro_papildymo'
  | 'karinis_sraigtasparnis'
  | 'dronas'
  | 'karinis_kita'
  | 'civilinis'

export interface ThreatAssessment {
  isMilitary: boolean
  cls: AircraftClass
  classLabel: string
  level: ThreatLevel
  reasons: string[]
}

// ICAO tipo designatoriai (dažniausi šio regiono kontekste). Naudojami rusiški/NATO tipai.
const FIGHTERS = new Set([
  'F16', 'F15', 'F18', 'F22', 'F35', 'F14', 'F4', 'EUFI', 'TYPH', 'TYP', 'GRIP', 'JAS39', 'J39', 'RAFL',
  'MIR2', 'SU24', 'SU25', 'SU27', 'SU30', 'SU34', 'SU35', 'SU57', 'MG29', 'MG31', 'MG25', 'A10', 'JH7',
])
const BOMBERS = new Set(['TU95', 'TU16', 'TU22', 'TU160', 'T160', 'B52', 'B1', 'B2', 'B21', 'H6'])
const DRONES = new Set(['RQ4', 'MQ9', 'MQ1', 'MQ4', 'TB2', 'SHDW', 'RQ7', 'GHWK', 'RQ170'])
const RECON = new Set([
  'E3TF', 'E3CF', 'E3', 'A50', 'RC135', 'RJ', 'P8', 'P3', 'EP3', 'U2', 'E8', 'E6', 'GLF5', 'GL5T',
  'C560', 'SENT', 'ASTO', 'RC12', 'MC12', 'E11', 'C135',
])
const TANKERS = new Set(['KC135', 'K35R', 'KC10', 'KC30', 'KC46', 'A332', 'IL78', 'VOYA', 'A310M'])
const TRANSPORT = new Set([
  'C17', 'C130', 'C160', 'C5', 'C5M', 'A400', 'IL76', 'A124', 'AN12', 'AN22', 'AN24', 'AN26', 'AN30',
  'AN32', 'AN72', 'AN124', 'AN225', 'C27J', 'C295', 'CN35', 'KC130', 'A40',
])
const MIL_HELI = new Set([
  'MI8', 'MI17', 'MI24', 'MI28', 'MI35', 'MI26', 'KA52', 'KA27', 'AH64', 'UH60', 'H60', 'CH47', 'H47',
  'NH90', 'H145M', 'A139',
])

const CLASS_LABELS: Record<AircraftClass, string> = {
  naikintuvas: 'Naikintuvas',
  bombonesis: 'Bombonešis',
  karinis_transportas: 'Karinis transportas',
  zvalgybinis: 'Žvalgybinis / AWACS',
  kuro_papildymo: 'Kuro papildymo lėktuvas',
  karinis_sraigtasparnis: 'Karinis sraigtasparnis',
  dronas: 'Karinis dronas',
  karinis_kita: 'Karinis orlaivis',
  civilinis: 'Civilinis',
}

function classifyType(t?: string | null): AircraftClass | null {
  if (!t) return null
  const c = t.toUpperCase().trim()
  if (FIGHTERS.has(c)) return 'naikintuvas'
  if (BOMBERS.has(c)) return 'bombonesis'
  if (DRONES.has(c)) return 'dronas'
  if (RECON.has(c)) return 'zvalgybinis'
  if (TANKERS.has(c)) return 'kuro_papildymo'
  if (TRANSPORT.has(c)) return 'karinis_transportas'
  if (MIL_HELI.has(c)) return 'karinis_sraigtasparnis'
  return null
}

// Kai kurie kariniai šaukiniai (kai tipas nežinomas). Konservatyvu — tik aiškūs prefiksai.
function militaryCallsign(callsign?: string | null): boolean {
  if (!callsign) return false
  const c = callsign.toUpperCase().trim()
  return /^(RCH|RRR|RFR|FORTE|HOMER|JAKE|REDEYE|NATO|BAF|GAF|IAM|LAGR|HKY|CFC|ASCOT|RSD|RFF|BRK|DUKE|MMF)/.test(c)
}

// PAVOJINGOS klasės — potencialiai puolamosios / ginkluotos.
const HIGH_THREAT: AircraftClass[] = ['naikintuvas', 'bombonesis', 'dronas']

export function assessThreat(f: LiveFlight): ThreatAssessment {
  const reasons: string[] = []
  const typeClass = classifyType(f.typeCode)
  const flaggedMil = ((f.dbFlags ?? 0) & 1) === 1
  const milCall = militaryCallsign(f.callsign)
  const isMilitary = Boolean(typeClass) || flaggedMil || milCall

  const cls: AircraftClass = typeClass ?? (isMilitary ? 'karinis_kita' : 'civilinis')

  if (f.typeCode && typeClass) reasons.push(`Tipas: ${f.typeDesc || f.typeCode} (${CLASS_LABELS[typeClass].toLowerCase()})`)
  if (flaggedMil) reasons.push('ADS-B duomenų bazėje pažymėtas kaip karinis')
  if (milCall) reasons.push(`Karinio tipo šaukinys (${f.callsign?.trim()})`)

  // Avariniai kodai — nepriklauso nuo karinio statuso.
  const emergencySquawk = f.squawk === '7700' || f.squawk === '7500' || f.squawk === '7600'
  const hasEmergency = Boolean(f.emergency && f.emergency !== 'none') || emergencySquawk

  let level: ThreatLevel = 'INFO'
  if (isMilitary) level = 'ISPEJIMAS'
  if (HIGH_THREAT.includes(cls)) {
    level = 'PAVOJUS'
    reasons.push('Potencialiai ginkluotas / puolamasis tipas')
  }
  if (hasEmergency) {
    level = 'PAVOJUS'
    reasons.push(emergencySquawk ? `Avarinis atsakiklio kodas (squawk ${f.squawk})` : 'Paskelbta avarinė situacija')
  }

  // Registracijos šalies kontekstas (NE savarankiškas pagrindas grėsmei).
  const country = (f.originCountry || '').toLowerCase()
  if (isMilitary && (country.includes('russia') || country.includes('belarus'))) {
    reasons.push(`Registruota: ${f.originCountry}`)
  }

  return { isMilitary, cls, classLabel: CLASS_LABELS[cls], level, reasons }
}

export interface ThreatSummary {
  pavojus: number
  ispejimas: number
  military: number
  total: number
  topClasses: string[]
}

export function summarizeThreats(flights: LiveFlight[]): ThreatSummary {
  let pavojus = 0
  let ispejimas = 0
  let military = 0
  const classCounts = new Map<string, number>()
  for (const f of flights) {
    const a = assessThreat(f)
    if (a.isMilitary) military += 1
    if (a.level === 'PAVOJUS') pavojus += 1
    else if (a.level === 'ISPEJIMAS') ispejimas += 1
    if (a.isMilitary) classCounts.set(a.classLabel, (classCounts.get(a.classLabel) ?? 0) + 1)
  }
  const topClasses = [...classCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => `${label}: ${n}`)
  return { pavojus, ispejimas, military, total: flights.length, topClasses }
}

// Rikiavimas: pavojingiausi viršuje.
const LEVEL_RANK: Record<ThreatLevel, number> = { PAVOJUS: 2, ISPEJIMAS: 1, INFO: 0 }
export function threatRank(f: LiveFlight): number {
  return LEVEL_RANK[assessThreat(f).level]
}
