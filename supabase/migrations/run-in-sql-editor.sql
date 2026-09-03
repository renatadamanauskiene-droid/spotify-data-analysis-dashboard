-- ============================================================
-- SUPABASE SQL EDITOR — paleiskite šį skriptą VIENĄ KARTĄ
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. LT72 perspėjimų lentelė
create table if not exists lt72_alerts (
  id text primary key,
  title text not null,
  summary text,
  published_at timestamptz,
  url text not null,
  fetched_at timestamptz not null default now()
);

alter table lt72_alerts enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'lt72_alerts' and policyname = 'Vieša skaitymo prieiga'
  ) then
    create policy "Vieša skaitymo prieiga" on lt72_alerts for select using (true);
  end if;
end $$;

create index if not exists lt72_alerts_published_idx on lt72_alerts (published_at desc);

-- 2. pg_cron grafikas: ingest-lt72 kas 5 min
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

-- 3. (Neprivaloma) Iš karto paleisti ingest-lt72 nenorint laukti 5 min
-- Atkomentuo žemiau esančias eilutes:
/*
select net.http_post(
  url := 'https://wmhvjwuzxgwlqxgkksfa.supabase.co/functions/v1/ingest-lt72',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaHZqd3V6eGd3bHF4Z2trc2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY5ODgsImV4cCI6MjEwMzgxMjk4OH0.KfE6ZH6AjCUrm4C0BkPs7ER2HNbx1YT-RW_4FDQcRPA'
  ),
  body := '{}'::jsonb
);
*/

-- 4. Patikrinti cron grafikus
select jobname, schedule, command from cron.job order by jobname;
