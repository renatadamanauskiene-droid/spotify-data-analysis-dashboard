import type { RailwayObservation, MissileAirDefenseObservation, GnssEvent, Notam, Exercise } from '@/types'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString()
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600 * 1000).toISOString()

// Palydovinių ir aviacijos DEMO masyvų čia sąmoningai nėra: Aviacijos ekranas naudoja realų
// viešą OpenSky Network ADS-B API tiesiogiai iš naršyklės (žr. src/lib/openSky.ts), o Palydovų
// ekranas visada rodo sąžiningą paaiškinimą, kodėl realaus laiko palydovinių vaizdų API
// (nemokamo ir tam tinkamo) šiuo metu nėra — jokio fiktyvaus turinio jiems negeneruojama.

export const demoRailwayObservations: RailwayObservation[] = [
  {
    id: 'rail-gomelis-baranovicai',
    fromLocationId: 'gomelis',
    toLocationId: 'baranovicai',
    cargoDescription: 'Krovinio pobūdis nepatvirtintas (galimai technikos platformos)',
    confirmedLevel: 'TIKETINA',
    signalType: 'neiprastas_telkimas',
    observedAt: hoursAgo(20),
    sourceIds: ['belarusian-hajun'],
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'rail-baranovicai-gardinas',
    fromLocationId: 'baranovicai',
    toLocationId: 'gardinas',
    cargoDescription: 'Papildomi vagonai vakarų kryptimi, Suvalkų koridoriaus zonoje',
    confirmedLevel: 'TIKETINA',
    signalType: 'neiprastas_telkimas',
    observedAt: hoursAgo(22),
    sourceIds: ['belarusian-hajun'],
    region: 'suvalku_koridorius',
    isDemo: true,
  },
  {
    id: 'rail-gomelis-luninecas',
    fromLocationId: 'gomelis',
    toLocationId: 'luninecas',
    cargoDescription: 'Įprastas pratybinis transportas',
    confirmedLevel: 'PATVIRTINTA',
    signalType: 'normalus_pratybinis',
    observedAt: hoursAgo(80),
    sourceIds: ['kam'],
    region: 'baltarusija',
    isDemo: true,
  },
]

export const demoMissileObservations: MissileAirDefenseObservation[] = [
  {
    id: 'missile-asmena-s400',
    system: 'S-400',
    locationId: 'asmena',
    changeType: 'nauja_dislokacija',
    observedAt: hoursAgo(25),
    confidence: 'PATVIRTINTA',
    sourceIds: ['kam', 'nato-hq'],
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'missile-obuz-iskander',
    system: 'Iskander',
    locationId: 'obuz-lesnovskij',
    changeType: 'pratybinis_aktyvumas',
    observedAt: hoursAgo(60),
    confidence: 'TIKETINA',
    sourceIds: ['isw-ctp'],
    region: 'baltarusija',
    isDemo: true,
  },
]

export const demoGnssEvents: GnssEvent[] = [
  {
    id: 'gnss-pietryciu-lt',
    areaName: 'Pietryčių Lietuva ir pasienio ruožas',
    lat: 54.3,
    lng: 25.6,
    radiusKm: 60,
    type: 'jamming',
    intensity: 'vidutinis',
    startedAt: hoursAgo(15),
    confidence: 'TIKETINA',
    sourceIds: ['isw-ctp'],
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'gnss-kaliningrad-suvalkai',
    areaName: 'Kaliningrado–Suvalkų zona',
    lat: 54.4,
    lng: 21.9,
    radiusKm: 90,
    type: 'jamming',
    intensity: 'vidutinis',
    startedAt: hoursAgo(10),
    confidence: 'TIKETINA',
    sourceIds: ['isw-ctp'],
    region: 'suvalku_koridorius',
    isDemo: true,
  },
]

export const demoNotams: Notam[] = [
  {
    id: 'notam-gardinas-1',
    title: 'Laikinas oro erdvės apribojimas virš vakarų Baltarusijos',
    area: 'Gardino regionas',
    restrictionType: 'Laikinas draudimas / apribojimas',
    startsAt: hoursAgo(72),
    endsAt: hoursFromNow(96),
    confidence: 'PATVIRTINTA',
    sourceIds: ['nato-hq'],
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'notam-kaliningrad-1',
    title: 'NOTAM dėl mokymų zonos Kaliningrado srityje',
    area: 'Kaliningrado sritis',
    restrictionType: 'Mokymų / šaudymo zona',
    startsAt: hoursAgo(40),
    endsAt: hoursFromNow(48),
    confidence: 'TIKETINA',
    sourceIds: ['isw-ctp'],
    region: 'suvalku_koridorius',
    isDemo: true,
  },
]

export const demoExercises: Exercise[] = [
  {
    id: 'exercise-ruduo',
    name: 'Planinės rudens pratybos (regioninis ciklas)',
    sides: ['Baltarusija', 'Rusija'],
    startsAt: hoursAgo(200),
    endsAt: hoursAgo(40),
    locationIds: ['gozhskij', 'losvido'],
    scale: 'Regioninis, keli tūkstančiai dalyvių (viešai skelbta)',
    personnelRemainedAfter: false,
    confidence: 'PATVIRTINTA',
    sourceIds: ['kam'],
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'exercise-nato-air-policing',
    name: 'Bendros NATO oro policijos pratybos',
    sides: ['NATO', 'Lietuva', 'Lenkija'],
    startsAt: hoursAgo(100),
    endsAt: hoursAgo(4),
    locationIds: ['marijampole'],
    scale: 'Nedidelis, rotacinis dalinys',
    personnelRemainedAfter: false,
    confidence: 'PATVIRTINTA',
    sourceIds: ['nato-hq'],
    region: 'suvalku_koridorius',
    isDemo: true,
  },
  {
    id: 'exercise-vasara-liko',
    name: 'Vasaros bendros pratybos',
    sides: ['Baltarusija', 'Rusija'],
    startsAt: hoursAgo(400),
    endsAt: hoursAgo(300),
    locationIds: ['obuz-lesnovskij'],
    scale: 'Vidutinis mastas',
    personnelRemainedAfter: true,
    confidence: 'TIKETINA',
    sourceIds: ['isw-ctp'],
    region: 'baltarusija',
    isDemo: true,
  },
]
