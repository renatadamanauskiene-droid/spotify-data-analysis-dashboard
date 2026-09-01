// Šaltinių adapterių registras. Kiekvienas adapteris apibrėžia, KAIP konkretaus šaltinio
// duomenys gaunami. `feedUrl: null` reiškia "laukia integracijos" — praleidžiama.
//
// ingest-rss pats UŽREGISTRUOJA šaltinį `sources` lentelėje (jei dar nėra) pagal čia nurodytus
// name/type/reliability laukus — todėl naują šaltinį pridėti pakanka ČIA, be atskiros SQL
// migracijos.
//
// SVARBU: visi feedUrl patikrinti, kad grąžina galiojantį RSS/XML IR yra pasiekiami iš serverio
// (debesijos IP). Google News ir OpenSky iš Supabase Edge Function grąžina HTTP 503/blokuoja
// datacentro IP, todėl NENAUDOJAMI — vietoje jų parinkti tiesioginiai leidinių RSS, susiję su
// Baltarusijos / Baltijos regiono karine tematika. Bendram triukšmui atmesti ingest-rss taiko
// RELEVANCE_KEYWORDS filtrą (žr. ingest-rss/index.ts).

export type AdapterKind = 'rss' | 'json' | 'pending'
export type SourceReliability = 'A' | 'B' | 'C'
export type SourceType =
  | 'oficialus_lt'
  | 'oficialus_nato'
  | 'oficialus_uzsienio'
  | 'analitinis_osint'
  | 'zeleznodorozny_osint'
  | 'ziniasklaida'
  | 'kitas'

export interface SourceAdapter {
  sourceId: string
  kind: AdapterKind
  feedUrl: string | null
  // Šaltinio metaduomenys automatinei registracijai `sources` lentelėje:
  name?: string
  type?: SourceType
  reliability?: SourceReliability
  notes?: string
}

export const rssAdapters: SourceAdapter[] = [
  // --- Regiono / karinės tematikos leidiniai (pasiekiami iš serverio) --------------------------
  {
    sourceId: 'meduza-en',
    kind: 'rss',
    feedUrl: 'https://meduza.io/rss/en/all',
    name: 'Meduza (EN)',
    type: 'ziniasklaida',
    reliability: 'B',
    notes: 'Nepriklausoma rusų/regiono žiniasklaida (anglų k.).',
  },
  {
    sourceId: 'euromaidan',
    kind: 'rss',
    feedUrl: 'https://euromaidanpress.com/feed/',
    name: 'Euromaidan Press',
    type: 'analitinis_osint',
    reliability: 'B',
    notes: 'Karo / Rusijos / Baltarusijos OSINT analizė.',
  },
  {
    sourceId: 'moscowtimes',
    kind: 'rss',
    feedUrl: 'https://www.themoscowtimes.com/rss/news',
    name: 'The Moscow Times',
    type: 'ziniasklaida',
    reliability: 'B',
    notes: 'Nepriklausoma Rusijos žiniasklaida (anglų k.).',
  },
  {
    sourceId: 'notesfrompoland',
    kind: 'rss',
    feedUrl: 'https://notesfrompoland.com/feed/',
    name: 'Notes from Poland',
    type: 'ziniasklaida',
    reliability: 'B',
    notes: 'Lenkijos naujienos (Suvalkų koridorius, siena, NATO).',
  },
  {
    sourceId: 'err-ee',
    kind: 'rss',
    feedUrl: 'https://news.err.ee/rss',
    name: 'ERR (Estija, EN)',
    type: 'ziniasklaida',
    reliability: 'B',
    notes: 'Estijos nacionalinis transliuotojas (oro erdvė, incidentai).',
  },
  {
    sourceId: 'lsm-lv',
    kind: 'rss',
    feedUrl: 'https://eng.lsm.lv/rss/',
    name: 'LSM (Latvija, EN)',
    type: 'ziniasklaida',
    reliability: 'B',
    notes: 'Latvijos nacionalinis transliuotojas (oro erdvė, incidentai).',
  },
  {
    sourceId: 'defence-blog',
    kind: 'rss',
    feedUrl: 'https://defence-blog.com/feed/',
    name: 'The Defence Blog',
    type: 'analitinis_osint',
    reliability: 'B',
    notes: 'Gynybos / karinės technikos naujienos.',
  },
  {
    sourceId: 'ukrinform',
    kind: 'rss',
    feedUrl: 'https://www.ukrinform.net/rss/block-lastnews',
    name: 'Ukrinform (EN)',
    type: 'ziniasklaida',
    reliability: 'B',
    notes: 'Ukrainos naujienų agentūra (anglų k.).',
  },
  // Jamestown blokuoja serverio IP (HTTP 403) — feedUrl=null, nebus raudonas sutrikimas.
  { sourceId: 'jamestown', kind: 'pending', feedUrl: null, name: 'Jamestown Foundation', type: 'analitinis_osint', reliability: 'B', notes: 'jamestown.org blokuoja serverio IP (HTTP 403).' },

  // --- Papildomi šaltiniai (filtruojami pagal temą) --------------------------------------------
  { sourceId: 'bellingcat', kind: 'rss', feedUrl: 'https://www.bellingcat.com/feed/', name: 'Bellingcat', type: 'analitinis_osint', reliability: 'B', notes: 'OSINT tyrimai.' },
  // KAM blokuoja debesijos (Supabase) IP diapazonus — HTTP 403. feedUrl=null sustabdo bandymus,
  // ingest-rss atstatys statusą į 'laukia_integracijos' vietoje 'sutrikimas'.
  { sourceId: 'kam', kind: 'pending', feedUrl: null, name: 'Krašto apsaugos ministerija (KAM)', type: 'oficialus_lt', reliability: 'A', notes: 'kam.lt/feed/ blokuoja serverio (debesijos) IP — HTTP 403. Laukia alternatyvaus priėjimo.' },
  { sourceId: '15min', kind: 'rss', feedUrl: 'https://www.15min.lt/rss', name: '15min.lt', type: 'ziniasklaida', reliability: 'B', notes: 'Bendras LT feed (filtruojama pagal temą).' },
  { sourceId: 'delfi', kind: 'rss', feedUrl: 'https://www.delfi.lt/rss/feeds/lithuania.xml', name: 'Delfi.lt', type: 'ziniasklaida', reliability: 'B', notes: 'Bendras LT feed (filtruojama pagal temą).' },
  { sourceId: 'bbc-europe', kind: 'rss', feedUrl: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', name: 'BBC News (Europa)', type: 'ziniasklaida', reliability: 'B', notes: 'Bendras EN feed (filtruojama pagal temą).' },
  // Šaltiniai registruoti DB, dabar prijungti per RSS adapterius:
  // NATO: tikrinami du URL — pirmasis /rss.xml, jei 404 bandyti kitą.
  { sourceId: 'nato-hq', kind: 'rss', feedUrl: 'https://www.nato.int/rss.xml', name: 'NATO oficialūs pranešimai', type: 'oficialus_nato', reliability: 'A', notes: 'NATO oficialūs pranešimai (anglų k.).' },
  // ISW blokuoja serverio IP (HTTP 403) — laukia integracijos.
  { sourceId: 'isw-ctp', kind: 'pending', feedUrl: null, name: 'ISW / Critical Threats', type: 'analitinis_osint', reliability: 'A', notes: 'understandingwar.org blokuoja serverio IP (HTTP 403). Laukia alternatyvaus priėjimo.' },
  { sourceId: 'lrt', kind: 'rss', feedUrl: 'https://www.lrt.lt/rss/naujienos', name: 'LRT naujienos', type: 'ziniasklaida', reliability: 'B', notes: 'LRT lietuviškos naujienos (filtruojama pagal temą).' },
  // Reuters feeds.reuters.com DNS nebeegzistuoja — laukia integracijos.
  { sourceId: 'reuters', kind: 'pending', feedUrl: null, name: 'Reuters', type: 'ziniasklaida', reliability: 'B', notes: 'feeds.reuters.com DNS neišsprendžiamas iš serverio — Reuters RSS nutraukė viešą prieigą.' },
]

// Ateities integracijoms — atskiri Edge Functions pagal tą patį modelį:
// - ADS-B aviacija: ĮGYVENDINTA — ingest-aviation (adsb.fi/adsb.lol) -> live_aircraft_cache.
// - GNSS trikdžiai: ĮGYVENDINTA — ingest-gnss (gpsjam.org) -> gnss_events.
// - Palydovai / geležinkelių „apkrova" / raketinės pozicijos: nėra nemokamo struktūrizuoto
//   realaus laiko šaltinio; geležinkelių / karinio pervežimo TEMA dengiama per naujienų srautą
//   (Euromaidan, Meduza, Ukrinform ir kt.), o struktūrizuoti įvykiai lieka analitiko įvedimui.
