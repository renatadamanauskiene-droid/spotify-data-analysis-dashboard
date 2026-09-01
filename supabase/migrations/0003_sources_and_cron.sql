-- Migracija 0003: nauji naujienų šaltiniai + GPSJAM (GNSS) šaltinis, ir kasdienis automatinis
-- duomenų surinkimas per pg_cron -> pg_net (kviečia Edge Functions).
--
-- Po šios migracijos ir funkcijų įdiegimo (supabase functions deploy) sistema kasdien:
--   05:00 UTC  ingest-rss                -> news_items (Srautas)
--   05:15 UTC  ingest-gnss               -> gnss_events (GPS/GNSS ekranas)
--   05:30 UTC  compute-risk-and-notify   -> daily_snapshots + alerts (+ push)

-- 1) Nauji šaltiniai --------------------------------------------------------------------------
insert into sources (id, name, type, reliability, url, enabled, status, notes) values
  ('15min', '15min.lt', 'ziniasklaida', 'B', 'https://www.15min.lt', true, 'laukia_integracijos', 'Automatinis RSS surinkimas per ingest-rss.'),
  ('delfi', 'Delfi.lt', 'ziniasklaida', 'B', 'https://www.delfi.lt', true, 'laukia_integracijos', 'Automatinis RSS surinkimas per ingest-rss (Lietuvos naujienų feed).'),
  ('bbc-europe', 'BBC News (Europa)', 'ziniasklaida', 'B', 'https://www.bbc.com/news/world/europe', true, 'laukia_integracijos', 'Automatinis RSS surinkimas per ingest-rss.'),
  ('gpsjam', 'GPSJAM (ADS-B GPS/GNSS trikdžiai)', 'analitinis_osint', 'B', 'https://gpsjam.org', true, 'laukia_integracijos', 'Kasdien automatiškai surenkama per ingest-gnss (viešas ADS-B agreguotas GPS trikdžių tinklelis).')
on conflict (id) do nothing;

-- 2) Plėtiniai kasdieniam grafikui ------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 3) Kasdienis grafikas -----------------------------------------------------------------------
-- pg_cron >= 1.4: cron.schedule(jobname, ...) atnaujina esamą darbą pagal pavadinimą (idempotent).
-- Autorizacijai naudojamas VIEŠAS anon raktas (jis skirtas būti viešas; verify_jwt tik patikrina,
-- kad JWT galiojantis). Pačios funkcijos viduje rašymui naudojamas SERVICE_ROLE raktas iš env.

select cron.schedule(
  'ingest-rss-daily',
  '0 5 * * *',
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

select cron.schedule(
  'ingest-gnss-daily',
  '15 5 * * *',
  $$
  select net.http_post(
    url := 'https://wmhvjwuzxgwlqxgkksfa.supabase.co/functions/v1/ingest-gnss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaHZqd3V6eGd3bHF4Z2trc2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY5ODgsImV4cCI6MjEwMzgxMjk4OH0.KfE6ZH6AjCUrm4C0BkPs7ER2HNbx1YT-RW_4FDQcRPA'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'compute-risk-daily',
  '30 5 * * *',
  $$
  select net.http_post(
    url := 'https://wmhvjwuzxgwlqxgkksfa.supabase.co/functions/v1/compute-risk-and-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaHZqd3V6eGd3bHF4Z2trc2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY5ODgsImV4cCI6MjEwMzgxMjk4OH0.KfE6ZH6AjCUrm4C0BkPs7ER2HNbx1YT-RW_4FDQcRPA'
    ),
    body := '{}'::jsonb
  );
  $$
);
