-- LT72 oficialių perspėjimų lentelė.
-- Pildoma ingest-lt72 Edge Function, kuri kas 5 min tikrina lt72.lt/kategorija/pranesimai/
-- ir išsaugo naujausius perspėjimus (oro pavojus, audros, radiacija ir kt.).
-- Prioritetas: AUKŠČIAU už OSINT ir ADS-B interpretacijas UI.

create table if not exists lt72_alerts (
  id text primary key,           -- slug iš URL (pvz. "oro-pavojus-2026-06-13")
  title text not null,
  summary text,
  published_at timestamptz,
  url text not null,
  fetched_at timestamptz not null default now()
);

alter table lt72_alerts enable row level security;
create policy "Vieša skaitymo prieiga" on lt72_alerts for select using (true);

create index if not exists lt72_alerts_published_idx on lt72_alerts (published_at desc);

-- pg_cron grafikas: kas 5 min kviečia ingest-lt72 Edge Function
-- (pg_cron ir pg_net plėtiniai jau aktyvuoti 0003 migracijoje)
select cron.schedule(
  'ingest-lt72-every5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://wmhvjwuzxgwlqxgkksfa.supabase.co/functions/v1/ingest-lt72',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaHZqd3V6eGd3bHF4Z2trc2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY5ODgsImV4cCI6MjEwMzgxMjk4OH0.KfE6ZH6AjCUrm4C0BkPs7ER2HNbx1YT-RW_4FDQcRPA'
    ),
    body := '{}'::jsonb
  );
  $$
);
