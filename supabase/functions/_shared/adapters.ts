// Šaltinių adapterių registras. Kiekvienas adapteris apibrėžia, KAIP konkretaus šaltinio
// duomenys turi būti gaunami. `feedUrl: null` reiškia "laukia integracijos" — funkcija tokį
// šaltinį praleidžia ir tai aiškiai užfiksuoja ingestion_runs lentelėje; JOKIŲ fiktyvių įrašų
// tokiam šaltiniui nesukuriama.
//
// Naujo šaltinio pridėjimas: (1) įrašas į `sources` lentelę (žr. supabase/seed.sql),
// (2) adapteris čia su tikru feedUrl, (3) jei reikia specifinio API (ADS-B, palydoviniai vaizdai,
// NOTAM, GNSS trikdžiai), sukurti atskirą adapterio tipą ir atskirą Edge Function
// (pvz. ingest-adsb, ingest-notam, ingest-gnss) pagal tą patį modelį kaip ingest-rss.

export type AdapterKind = 'rss' | 'json' | 'pending'

export interface SourceAdapter {
  sourceId: string
  kind: AdapterKind
  feedUrl: string | null
  notes?: string
}

export const rssAdapters: SourceAdapter[] = [
  { sourceId: 'vsd', kind: 'rss', feedUrl: null, notes: 'VSD RSS/skelbimų sąrašo nuoroda dar nenustatyta.' },
  { sourceId: 'kam', kind: 'rss', feedUrl: null, notes: 'KAM RSS nuoroda dar nenustatyta.' },
  { sourceId: 'nato-hq', kind: 'rss', feedUrl: null, notes: 'NATO naujienų RSS nuoroda dar nenustatyta.' },
  { sourceId: 'isw-ctp', kind: 'rss', feedUrl: null, notes: 'ISW/Critical Threats RSS nuoroda dar nenustatyta.' },
  { sourceId: 'lrt', kind: 'rss', feedUrl: null, notes: 'LRT RSS nuoroda dar nenustatyta.' },
  { sourceId: 'reuters', kind: 'rss', feedUrl: null, notes: 'Reuters RSS nuoroda dar nenustatyta (gali reikėti API rakto).' },
  { sourceId: 'bellingcat', kind: 'rss', feedUrl: null, notes: 'Bellingcat RSS nuoroda dar nenustatyta.' },
  { sourceId: 'belarusian-hajun', kind: 'json', feedUrl: null, notes: 'Telegram kanalo viešo API/RSS tilto nuoroda dar nenustatyta.' },
]

// Ateities integracijoms (žr. UŽDUOTIES 18 skyrių) — atskiri Edge Functions pagal tą patį modelį:
// - ADS-B: realaus laiko duomenys jau integruoti KLIENTO pusėje per viešą OpenSky Network API
//   (žr. src/lib/openSky.ts, Aviacijos ekranas) — atskiro server-side ingest-adsb nereikia
//   pačiam ekranui, tačiau serverio pusės ingest-adsb prasmingas norint kaupti istoriją į
//   aviation_observations (šiuo metu ta lentelė lieka tuščia realiu ekranu nenaudojama).
// - ingest-satellite: palydovinių vaizdų / analizės API -> satellite_observations. NĖRA
//   nemokamo, tam tinkamo realaus laiko šaltinio (žr. src/screens/SatelliteScreen.tsx) —
//   reikėtų komercinio tiekėjo (Sentinel Hub, Planet Labs) API rakto.
// - ingest-notam: NOTAM šaltinis -> notams
// - ingest-gnss: GNSS trikdžių šaltinis -> gnss_events
// - ingest-ai-summary: naudotojo AI (pvz. ChatGPT) santraukų endpointas -> events / news_items
