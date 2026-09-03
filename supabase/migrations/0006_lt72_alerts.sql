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
