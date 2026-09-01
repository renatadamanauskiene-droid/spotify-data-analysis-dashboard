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
  // --- TIKSLINĖS Google News užklausos (pagrindinis OSINT srautas) -----------------------------
  // Google News RSS paieška grąžina tik su tema susijusius straipsnius iš daugybės leidinių, todėl
  // srautas lieka relevantiškas (Baltarusijos pratybos, žvalgyba, NATO įspėjimai, geležinkeliai,
  // oro erdvės incidentai), o ne bendros naujienos. hl=kalba, gl/ceid=regionas.
  {
    sourceId: 'gn-by-mil-lt',
    kind: 'rss',
    feedUrl:
      'https://news.google.com/rss/search?q=Baltarusija%20(pratybos%20OR%20kariuomen%C4%97%20OR%20mobilizacija%20OR%20Zapad%20OR%20Astravas%20OR%20karin%C4%97)&hl=lt&gl=LT&ceid=LT:lt',
    notes: 'Google News LT — Baltarusijos karinis aktyvumas, pratybos.',
  },
  {
    sourceId: 'gn-by-mil-en',
    kind: 'rss',
    feedUrl:
      'https://news.google.com/rss/search?q=Belarus%20(military%20OR%20troops%20OR%20Zapad%20OR%20mobilization%20OR%20drills%20OR%20Wagner)&hl=en-US&gl=US&ceid=US:en',
    notes: 'Google News EN — Belarus military activity, exercises.',
  },
  {
    sourceId: 'gn-nato-baltic',
    kind: 'rss',
    feedUrl:
      'https://news.google.com/rss/search?q=(NATO%20OR%20Baltijos%20%C5%A1alys%20OR%20Baltic%20states)%20(gr%C4%97sm%C4%97%20OR%20threat%20OR%20warning%20OR%20%C4%AFsp%C4%97jimas%20OR%20Suvalk%C5%B3%20OR%20Suwalki%20OR%20Kaliningrad)&hl=lt&gl=LT&ceid=LT:lt',
    notes: 'Google News — NATO / Baltijos šalių grėsmės ir įspėjimai, Suvalkų koridorius, Kaliningradas.',
  },
  {
    sourceId: 'gn-by-rail',
    kind: 'rss',
    feedUrl:
      'https://news.google.com/rss/search?q=Belarus%20(railway%20OR%20railcar%20OR%20echelon%20OR%20troop%20transport)%20OR%20Baltarusija%20gele%C5%BEinkelis%20kariuomen%C4%97&hl=en-US&gl=US&ceid=US:en',
    notes: 'Google News — Baltarusijos geležinkelių / karinio pervežimo aktyvumas.',
  },
  {
    sourceId: 'gn-baltics-incidents',
    kind: 'rss',
    feedUrl:
      'https://news.google.com/rss/search?q=(Estija%20OR%20Latvija%20OR%20Lietuva%20OR%20Estonia%20OR%20Latvia)%20(dronas%20OR%20drone%20OR%20oro%20erdv%C4%97%20OR%20airspace%20OR%20provokacija%20OR%20incidentas%20OR%20sabotage%20OR%20diversija)&hl=lt&gl=LT&ceid=LT:lt',
    notes: 'Google News — oro erdvės pažeidimai, dronai, incidentai Baltijos šalyse.',
  },

  // --- Papildomi teminiai OSINT / institucijų šaltiniai ----------------------------------------
  { sourceId: 'kam', kind: 'rss', feedUrl: 'https://kam.lt/feed/', notes: 'Krašto apsaugos ministerijos naujienų RSS.' },
  { sourceId: 'bellingcat', kind: 'rss', feedUrl: 'https://www.bellingcat.com/feed/', notes: 'Bellingcat OSINT tyrimų RSS.' },
  // Bendri LT/EN naujienų feed'ai — paliekami, bet ingest-rss taiko RELEVANTIŠKUMO filtrą
  // (žr. RELEVANCE_KEYWORDS), todėl įrašomi tik su tema susiję straipsniai, o bendras triukšmas
  // (pvz. sportas, orai, nesusijusios pasaulio naujienos) atmetamas.
  { sourceId: '15min', kind: 'rss', feedUrl: 'https://www.15min.lt/rss', notes: '15min.lt RSS (filtruojama pagal temą).' },
  { sourceId: 'delfi', kind: 'rss', feedUrl: 'https://www.delfi.lt/rss/feeds/lithuania.xml', notes: 'Delfi.lt RSS (filtruojama pagal temą).' },
  { sourceId: 'bbc-europe', kind: 'rss', feedUrl: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', notes: 'BBC Europe RSS (filtruojama pagal temą).' },

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
