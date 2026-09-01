-- Migracija 0004: tikslinis OSINT srautas + aviacijos (ADS-B) surinkimas.
--
-- Po šios migracijos ir funkcijų įdiegimo:
--   - Srautas pildomas TIK relevantiškomis naujienomis (Baltarusijos pratybos, žvalgyba, NATO
--     įspėjimai, geležinkeliai, oro erdvės incidentai) iš tikslinių Google News užklausų.
--   - Aviacija pildoma iš nemokamo ADS-B (adsb.fi/adsb.lol) kas 5 min.

-- 1) Išvalom seną, nefiltruotą (nesusijusį) naujienų turinį — bus perpildyta filtruotai ----------
delete from news_items;

-- 2) Nauji tiksliniai Google News OSINT šaltiniai --------------------------------------------------
insert into sources (id, name, type, reliability, url, enabled, status, notes) values
  ('gn-by-mil-lt', 'Google News — Baltarusijos karinis aktyvumas (LT)', 'analitinis_osint', 'B', 'https://news.google.com', true, 'laukia_integracijos', 'Tikslinė Google News RSS užklausa (pratybos, kariuomenė, mobilizacija).'),
  ('gn-by-mil-en', 'Google News — Belarus military (EN)', 'analitinis_osint', 'B', 'https://news.google.com', true, 'laukia_integracijos', 'Tikslinė Google News RSS užklausa anglų k.'),
  ('gn-nato-baltic', 'Google News — NATO / Baltijos grėsmės', 'analitinis_osint', 'B', 'https://news.google.com', true, 'laukia_integracijos', 'NATO įspėjimai, Baltijos šalių grėsmė, Suvalkų koridorius, Kaliningradas.'),
  ('gn-by-rail', 'Google News — Baltarusijos geležinkeliai / kariniai pervežimai', 'zeleznodorozny_osint', 'B', 'https://news.google.com', true, 'laukia_integracijos', 'Geležinkelių ir karinio transporto aktyvumas.'),
  ('gn-baltics-incidents', 'Google News — oro erdvės / incidentai Baltijos šalyse', 'analitinis_osint', 'B', 'https://news.google.com', true, 'laukia_integracijos', 'Dronai, oro erdvės pažeidimai, provokacijos, diversijos Estijoje/Latvijoje/Lietuvoje.')
on conflict (id) do nothing;

-- 3) Atnaujinam aviacijos šaltinio aprašą (dabar adsb.fi/adsb.lol, ne OpenSky) ---------------------
update sources
set name = 'adsb.fi / adsb.lol (viešas ADS-B)',
    notes = 'Nemokamas, be rakto ADS-B agregatorius. Serverio pusėje kaupiama per ingest-aviation kas 5 min. į live_aircraft_cache.'
where id = 'opensky-network';

-- 4) Grafikas -------------------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Naujienos: dažniau nei kartą per parą (kas 3 val.). cron.schedule upsertina pagal pavadinimą.
select cron.schedule(
  'ingest-rss-daily',
  '0 */3 * * *',
  $$
  select net.http_post(
    url := 'https://wmhvjwuzxgwlqxgkksfa.supabase.co/functions/v1/ingest-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaHZqd3V6eGd3bHF4Z2trc2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY5ODgsImV4cCI6MjEwMzgxMjk4OH0.KfE6ZH6AjCUrm4C0BkPs7ER2HNbx1YT-RW_4FDQcRPA'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Aviacija: kas 5 min. (momentinė ADS-B būsena).
select cron.schedule(
  'ingest-aviation-5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://wmhvjwuzxgwlqxgkksfa.supabase.co/functions/v1/ingest-aviation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaHZqd3V6eGd3bHF4Z2trc2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY5ODgsImV4cCI6MjEwMzgxMjk4OH0.KfE6ZH6AjCUrm4C0BkPs7ER2HNbx1YT-RW_4FDQcRPA'
    ),
    body := '{}'::jsonb
  );
  $$
);
