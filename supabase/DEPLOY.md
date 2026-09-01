# Automatinio duomenų surinkimo įdiegimas

Šis dokumentas — kaip įjungti kasdienį automatinį duomenų surinkimą (naujienų Srautas + GPS/GNSS
trikdžiai). Reikia atlikti **3 žingsnius**. Duomenų bazės lentelės (0001, 0002) jau įdiegtos.

## 1. Įdiegti Edge Functions (per GitHub Actions — CLI nereikia)

1. Supabase Dashboard → **Account → Access Tokens** → sukurk naują token.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Vardas: `SUPABASE_ACCESS_TOKEN`
   - Reikšmė: nukopijuotas token.
3. GitHub repo → **Actions → „Deploy Supabase Edge Functions" → Run workflow** (arba tiesiog
   įkelk šią šaką į `main` — workflow pasileis pats).

Tai įdiegs: `ingest-rss`, `ingest-gnss`, `compute-risk-and-notify` (ir esamas `ingest-aviation`,
`register-push-subscription`).

## 2. Paleisti migraciją 0003 (šaltiniai + kasdienis grafikas)

Supabase Dashboard → **SQL Editor** → įklijuok ir paleisk visą
`supabase/migrations/0003_sources_and_cron.sql` turinį.

Tai prideda šaltinius (15min, Delfi, BBC, GPSJAM) ir sukuria kasdienį `pg_cron` grafiką, kuris
kviečia funkcijas:

| Laikas (UTC) | Funkcija | Rezultatas |
|---|---|---|
| 05:00 | ingest-rss | `news_items` → **Srautas** |
| 05:15 | ingest-gnss | `gnss_events` → **GPS/GNSS** |
| 05:30 | compute-risk-and-notify | `daily_snapshots` + `alerts` |

> Svarbu: 1 žingsnį (funkcijų įdiegimą) atlik **prieš** 2 žingsnį, kad cron turėtų ką kviesti.

## 3. (Nebūtina) Iškart užpildyti duomenis, nelaukiant ryto

Kad nereikėtų laukti kito 05:00 UTC, funkcijas galima paleisti rankiniu būdu vieną kartą.
SQL Editoriuje:

```sql
select net.http_post(
  url := 'https://wmhvjwuzxgwlqxgkksfa.supabase.co/functions/v1/ingest-rss',
  headers := jsonb_build_object('Content-Type','application/json',
    'Authorization','Bearer <ANON_KEY>'),
  body := '{}'::jsonb);
```

(Tą patį su `/ingest-gnss` ir `/compute-risk-and-notify`. `<ANON_KEY>` — tas pats viešas anon
raktas, kuris jau naudojamas 0003 migracijoje.)

Po to atsidaryk programėlę → **Srautas** ir **GPS/GNSS** ekranai turi pasipildyti.

---

## Ko šis surinkimas NEautomatizuoja (sąmoningai)

- **Palydovų nuotraukos** — nėra nemokamo realaus laiko tiekėjo (reikia Sentinel Hub / Planet Labs
  API rakto ir atskiros `ingest-satellite` funkcijos).
- **Geležinkeliai, Raketos/oro gynyba, NOTAM** — nėra viešo struktūrizuoto realaus laiko šaltinio.
  Šios kategorijos suprojektuotos **analitiko rankiniam įvedimui** su patikimumo lygiu, kad
  nebūtų generuojami nepatikrinti karinės grėsmės signalai. Automatinis šių kategorijų pildymas
  reikalautų atskiro, atsakingai suprojektuoto sprendimo (žr. UŽDUOTIS, 4 punktas).
