# Baltarusijos karinė stebėsena

**Ankstyvojo perspėjimo situacijos centras Lietuvai**

Mobile-first PWA, skirta kasdieniam stebėjimui: Rusijos ir Baltarusijos karinių pajėgų aktyvumas Baltarusijoje, galimas poveikis Lietuvai ir NATO rytiniam flangui, bei atskiras Suvalkų koridoriaus (Kaliningradas–Baltarusija–Lietuva–Lenkija) modulis.

Pagrindiniai principai: aiškumas, faktinis tikslumas, jokio sensacionalizmo, kiekvienas faktas žymimas patikimumu (**PATVIRTINTA / TIKĖTINA / NEPATVIRTINTA**) ir šaltinio patikimumo lygiu (**A/B/C**). Programėlė niekada nerodo fiktyvių duomenų kaip realių — kol realus šaltinis neintegruotas, ekranas aiškiai rodo "duomenų nėra / laukia integracijos".

## Technologijos

- React + TypeScript + Vite
- Tailwind CSS (tamsus režimas numatytas)
- React Router (mobile bottom nav / desktop sidebar)
- Leaflet + OpenStreetMap (žemėlapis)
- Supabase (Postgres + RLS + Edge Functions) — backend/duomenų bazė
- vite-plugin-pwa (`injectManifest` strategija) — įdiegiama PWA su custom service worker ir Web Push

## Paleidimas lokaliai

```bash
npm install
npm run dev
```

Be jokios konfigūracijos programėlė veikia **DEMO režimu** — visi duomenys aiškiai pažymėti kaip pavyzdiniai (`DemoBadge`, DEMO juosta viršuje), realių žvalgybos faktų nėra.

## Perjungimas į LIVE (Supabase) režimą

1. Sukurti Supabase projektą.
2. Paleisti schemą: `supabase/migrations/0001_init.sql` (lentelės, enum tipai, RLS politikos).
3. Užpildyti atskaitos duomenis: `supabase/seed.sql` (tik lokacijos ir šaltinių registras — **jokių demo įvykių** į realią DB nededama).
4. Nukopijuoti `.env.example` į `.env` ir įrašyti:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Perkrauti programėlę — `src/lib/supabase.ts` automatiškai aptinka konfigūraciją ir perjungia `dataMode` į `'live'`. Nuo šio momento visi `get*()` metodai (`src/lib/dataSource.ts`) skaito iš Supabase lentelių, o ne iš demo masyvų.

**Svarbu:** jei LIVE režimu užklausa Supabase nepavyksta, programėlė **niekada** negrąžina demo duomenų vietoje jų — rodomas tuščias, aiškiai pažymėtas "Nepakanka patikimų duomenų" būsenas.

## Duomenų surinkimas (ingest)

Serverio pusės (Deno) Edge Functions `supabase/functions/`:

- `ingest-rss` — RSS/Atom naujienų surinkimas į `news_items`, su dedup pagal `sha256(šaltinis|nuoroda|antraštė|data)`. Adapterių registras: `supabase/functions/_shared/adapters.ts` — kol konkretaus šaltinio `feedUrl` nenustatytas, jis aiškiai praleidžiamas ir tai fiksuojama `ingestion_runs` lentelėje (**jokio fiktyvaus turinio negeneruojama**).
- `compute-risk-and-notify` — perskaičiuoja rizikos lygį (ta pati logika kaip `src/lib/riskEngine.ts`), atnaujina `daily_snapshots`, sukuria `alerts` įrašus ir siunčia Web Push pranešimus per VAPID raktus.
- `register-push-subscription` — priima kliento Web Push prenumeratą ir nustatymus, išsaugo `push_subscriptions` (privati lentelė, be anon skaitymo/rašymo).

Paleidimas pagal grafiką: Supabase Dashboard → Edge Functions → Schedule, arba `pg_cron` + `pg_net`.

### Vėlesnei integracijai paruošti adapteriai

- Realus ADS-B / aviacijos OSINT šaltinis → `aviation_observations`
- Palydovinių vaizdų / analizės API → `satellite_observations`
- NOTAM šaltinis → `notams`
- GNSS trikdžių šaltinis → `gnss_events`
- Naudotojo AI (pvz. ChatGPT) santraukų endpointas → `events` / `news_items`

Kiekvienas naujas adapteris turi sekti tą patį modelį kaip `ingest-rss`: server-side fetch, normalizacija į bendrą modelį, dedup, `ingestion_runs` įrašas — **niekada** kliento naršyklės scraping.

## Rizikos vertinimo logika

`src/lib/riskEngine.ts` (klientas) ir `supabase/functions/compute-risk-and-notify` (backend, ta pati logika):

- **ŽALIA** — įprastas aktyvumas.
- **GELTONA** — bent vienas reikšmingas (TIKĖTINA/PATVIRTINTA), patikimu (A/B) šaltiniu paremtas indikatorius.
- **RAUDONA** — ≥3 nepriklausomos kategorijos, ≥2 "stiprūs" (riskWeight=2) patikimi signalai, ≥2 nepriklausomi šaltiniai. Niekada iš vieno silpno (C) šaltinio.
- **Cross-border koreliacijos variklis** — jei per 72 val. langą aktyvumas vienu metu auga ≥2 kategorijomis Kaliningrado srityje IR ≥2 kategorijomis vakarų Baltarusijoje, keliamas papildomas "Koreliuotas aktyvumas" signalas (žr. Suvalkų koridoriaus modulį).

## PWA / Push

- `vite-plugin-pwa` su `injectManifest` strategija — custom service worker `src/sw.ts` (precache, runtime caching OSM plytelėms ir Supabase API, `push` / `notificationclick` handleriai).
- Web Push prenumerata: `src/lib/pushNotifications.ts` (reikia `VITE_VAPID_PUBLIC_KEY`).
- Offline: paskutinis sėkmingai gautas duomenų pjūvis saugomas `localStorage` (`src/lib/AppDataContext.tsx`) ir liks matomas be interneto ryšio.

## Struktūra

```
src/
  types/            Domeno tipai
  lib/               riskEngine, dataSource, supabase, format, navigation, preferences, push...
  data/demo/         Aiškiai pažymėti DEMO duomenys (naudojami, kai Supabase nesukonfigūruotas)
  components/        Bendri UI komponentai (RiskBadge, ConfidenceBadge, žemėlapio žymekliai...)
  screens/           Dabar, Žemėlapis, Signalai, Srautas, Suvalkų koridorius, Palydovai, Aviacija...
  sw.ts              Custom service worker (push, offline caching)
supabase/
  migrations/        DB schema + RLS
  seed.sql           Lokacijos + šaltinių registras (be demo įvykių)
  functions/         Edge Functions (ingest-rss, compute-risk-and-notify, register-push-subscription)
```

## Autorius

[Renata]
