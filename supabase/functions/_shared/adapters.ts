// Šaltinių adapterių registras. Kiekvienas adapteris apibrėžia, KAIP konkretaus šaltinio
// duomenys turi būti gaunami. `feedUrl: null` reiškia "laukia integracijos" — funkcija tokį
// šaltinį praleidžia ir tai aiškiai užfiksuoja ingestion_runs lentelėje; JOKIŲ fiktyvių įrašų
// tokiam šaltiniui nesukuriama.
//
// Naujo šaltinio pridėjimas: (1) įrašas į `sources` lentelę (žr. supabase/seed.sql arba
// migraciją 0003_sources_and_cron.sql), (2) adapteris čia su tikru feedUrl, (3) jei reikia
// specifinio API (ADS-B, palydoviniai vaizdai, NOTAM, GNSS trikdžiai), sukurti atskirą adapterio
// tipą ir atskirą Edge Function (pvz. ingest-gnss) pagal tą patį modelį kaip ingest-rss.
//
// SVARBU: čia esantys feedUrl buvo patikrinti (grąžina galiojantį RSS/XML). Šaltiniai, kuriems
// nemokamo viešo RSS nėra (VSD/KAM oficialaus RSS neteikia dalies skilčių; NATO/ISW blokuoja
// botus; Reuters nebeteikia viešo RSS; LRT turi tik JSON API, ne RSS), palikti `null` su
// paaiškinimu — jie sąmoningai praleidžiami, kad nebūtų kuriamas fiktyvus turinys.

export type AdapterKind = 'rss' | 'json' | 'pending'

export interface SourceAdapter {
  sourceId: string
  kind: AdapterKind
  feedUrl: string | null
  notes?: string
}

export const rssAdapters: SourceAdapter[] = [
  // --- Veikiantys, patikrinti RSS srautai ------------------------------------------------------
  { sourceId: 'kam', kind: 'rss', feedUrl: 'https://kam.lt/feed/', notes: 'Krašto apsaugos ministerijos naujienų RSS.' },
  { sourceId: 'bellingcat', kind: 'rss', feedUrl: 'https://www.bellingcat.com/feed/', notes: 'Bellingcat OSINT tyrimų RSS.' },
  { sourceId: '15min', kind: 'rss', feedUrl: 'https://www.15min.lt/rss', notes: '15min.lt naujienų RSS.' },
  { sourceId: 'delfi', kind: 'rss', feedUrl: 'https://www.delfi.lt/rss/feeds/lithuania.xml', notes: 'Delfi.lt Lietuvos naujienų RSS.' },
  { sourceId: 'bbc-europe', kind: 'rss', feedUrl: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', notes: 'BBC News Europe RSS.' },

  // --- Laukia integracijos (nėra tinkamo viešo RSS) --------------------------------------------
  { sourceId: 'vsd', kind: 'rss', feedUrl: null, notes: 'VSD tinkamo viešo RSS neteikia — reikėtų puslapio nuskaitymo arba oficialaus feed.' },
  { sourceId: 'nato-hq', kind: 'rss', feedUrl: null, notes: 'NATO naujienų puslapis grąžina 404 standartinėms RSS nuorodoms.' },
  { sourceId: 'isw-ctp', kind: 'rss', feedUrl: null, notes: 'ISW/understandingwar.org RSS blokuoja automatines užklausas (HTTP 403).' },
  { sourceId: 'lrt', kind: 'json', feedUrl: null, notes: 'LRT teikia tik JSON API (ne RSS); reikia atskiro JSON adapterio ir parser papildymo.' },
  { sourceId: 'reuters', kind: 'rss', feedUrl: null, notes: 'Reuters nebeteikia viešo RSS (reikia mokamo API rakto).' },
  { sourceId: 'belarusian-hajun', kind: 'json', feedUrl: null, notes: 'Telegram kanalo viešo API/RSS tilto nuoroda dar nenustatyta.' },
]

// Ateities integracijoms — atskiri Edge Functions pagal tą patį modelį:
// - ADS-B: ĮGYVENDINTA — supabase/functions/ingest-aviation kviečia OpenSky serverio pusėje ->
//   live_aircraft_cache.
// - GNSS trikdžiai: ĮGYVENDINTA — supabase/functions/ingest-gnss kasdien atsisiunčia gpsjam.org
//   viešus ADS-B GPS trikdžių duomenis (H3 tinklelis) ir įrašo į `gnss_events` regione.
// - ingest-satellite: palydovinių vaizdų / analizės API -> satellite_observations. NĖRA
//   nemokamo, tam tinkamo realaus laiko šaltinio (žr. src/screens/SatelliteScreen.tsx) —
//   reikėtų komercinio tiekėjo (Sentinel Hub, Planet Labs) API rakto.
// - ingest-notam: NOTAM šaltinis -> notams (nėra nemokamo viešo API šiam regionui).
// - Geležinkeliai / raketinės sistemos: nėra viešo struktūrizuoto realaus laiko šaltinio —
//   šie duomenys reikalauja analitiko peržiūros (žr. UŽDUOTIS, 4 punktas).
