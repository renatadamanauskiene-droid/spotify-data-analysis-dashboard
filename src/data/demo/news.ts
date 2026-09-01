import type { NewsItem, AlertItem, DailySnapshot } from '@/types'
import { demoSourcesById } from './sources'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 3600 * 1000).toISOString()

function urlFor(sourceId: string): string {
  return demoSourcesById.get(sourceId)?.url || ''
}

export const demoNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Analitikai fiksuoja padidėjusį geležinkelio aktyvumą vakarų Baltarusijoje',
    summaryLt: 'DEMO scenarijus: OSINT geležinkelių stebėtojai praneša apie didesnį vagonų skaičių kelių mazgų kryptimi per pastarąją savaitę.',
    publishedAt: hoursAgo(19),
    sourceId: 'belarusian-hajun',
    confidence: 'TIKETINA',
    originalUrl: urlFor('belarusian-hajun'),
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'news-2',
    title: 'KAM: reikšmingo Rusijos karių skaičiaus pokyčio Baltarusijoje nefiksuota',
    summaryLt: 'DEMO scenarijus: oficialus komentaras patvirtina, kad karių skaičiaus vertinimas per pastarąją savaitę reikšmingai nepakito.',
    publishedAt: hoursAgo(4),
    sourceId: 'kam',
    confidence: 'PATVIRTINTA',
    originalUrl: urlFor('kam'),
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'news-3',
    title: 'ISW/Critical Threats: aviacijos aktyvumo augimas Lydos ir Kaliningrado kryptimis',
    summaryLt: 'DEMO scenarijus: analitinė apžvalga nurodo dažnesnius kovinės aviacijos skrydžius abiejose zonose per pastarąją parą.',
    publishedAt: hoursAgo(9),
    sourceId: 'isw-ctp',
    confidence: 'TIKETINA',
    originalUrl: urlFor('isw-ctp'),
    region: 'suvalku_koridorius',
    isDemo: true,
  },
  {
    id: 'news-4',
    title: 'NATO patvirtina naujos oro gynybos pozicijos dislokavimą prie Ašmenos',
    summaryLt: 'DEMO scenarijus: oficialus pranešimas patvirtina naują oro gynybos poziciją, remiantis dviem nepriklausomais šaltiniais.',
    publishedAt: hoursAgo(22),
    sourceId: 'nato-hq',
    confidence: 'PATVIRTINTA',
    originalUrl: urlFor('nato-hq'),
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'news-5',
    title: 'Bellingcat tipo analizė: technikos koncentracija Gomelio geležinkelio mazge',
    summaryLt: 'DEMO scenarijus: viešai prieinama palydovinė analizė nurodo daugiau technikos platformų nei prieš savaitę.',
    publishedAt: daysAgo(6),
    sourceId: 'bellingcat',
    confidence: 'TIKETINA',
    originalUrl: urlFor('bellingcat'),
    region: 'baltarusija',
    isDemo: true,
  },
  {
    id: 'news-6',
    title: 'LRT: Lietuvos institucijos toliau stebi situaciją prie sienos',
    summaryLt: 'DEMO scenarijus: žiniasklaidos pranešimas apibendrina oficialius komentarus dėl situacijos pasienyje.',
    publishedAt: hoursAgo(3),
    sourceId: 'lrt',
    confidence: 'PATVIRTINTA',
    originalUrl: urlFor('lrt'),
    region: 'baltarusija',
    isDemo: true,
  },
]

export const demoAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    level: 'GELTONA',
    title: 'Kelios kategorijos neįprasto aktyvumo per 72 val.',
    body: 'DEMO scenarijus: geležinkelių, aviacijos ir GNSS trikdžių kategorijose per pastarąsias 72 val. fiksuota daugiau nei įprasta. Nė vienas atskiras signalas nepasiekia RAUDONOS ribos.',
    createdAt: hoursAgo(14),
    region: 'baltarusija',
    relatedEventId: 'ev-gnss-siena',
    isDemo: true,
  },
  {
    id: 'alert-2',
    level: 'GELTONA',
    title: 'Suvalkų koridoriuje aptiktas koreliuotas aktyvumas',
    body: 'DEMO scenarijus: tuo pačiu 72 val. langu aktyvumas augo tiek Kaliningrado srityje, tiek vakarų Baltarusijoje — keliose skirtingose kategorijose.',
    createdAt: hoursAgo(9),
    region: 'suvalku_koridorius',
    relatedEventId: 'ev-suwalki-air-kaliningrad',
    isDemo: true,
  },
  {
    id: 'alert-3',
    level: 'INFO',
    title: 'Nauja oro gynybos pozicija patvirtinta',
    body: 'DEMO scenarijus: du nepriklausomi patikimi šaltiniai patvirtino naujos oro gynybos pozicijos dislokavimą prie Ašmenos.',
    createdAt: hoursAgo(22),
    region: 'baltarusija',
    relatedEventId: 'ev-adpos-asmena',
    isDemo: true,
  },
]

export const demoSnapshots: DailySnapshot[] = Array.from({ length: 7 }).map((_, i) => {
  const dayOffset = 6 - i
  const date = new Date(Date.now() - dayOffset * 24 * 3600 * 1000)
  return {
    date: date.toISOString().slice(0, 10),
    riskLevel: dayOffset <= 2 ? 'GELTONA' : 'ZALIA',
    suwalkiRiskLevel: dayOffset <= 1 ? 'GELTONA' : 'ZALIA',
    summaryLt:
      dayOffset <= 2
        ? 'DEMO scenarijus: keli neįprasto aktyvumo indikatoriai, RAUDONOS ribos nepasiekta.'
        : 'DEMO scenarijus: įprastas aktyvumo lygis.',
    createdAt: date.toISOString(),
  }
})
