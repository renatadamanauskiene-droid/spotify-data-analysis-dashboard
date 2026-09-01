-- Baltarusijos karinė stebėsena — pradinė duomenų bazės schema.
-- Principas: viešas (anon) skaitymas dashboard'ui, rašymas tik service_role (backend ingest).
-- RLS įjungtas visose lentelėse; kadangi žemiau apibrėžiamos tik SELECT politikos,
-- INSERT/UPDATE/DELETE anon/authenticated rolėms automatiškai draudžiamas (RLS numatytasis
-- elgesys), o service_role visada apeina RLS ir gali rašyti.

create extension if not exists "pgcrypto";

-- ==================================================================================
-- ENUM TIPAI
-- ==================================================================================

create type confidence_level as enum ('PATVIRTINTA', 'TIKETINA', 'NEPATVIRTINTA');
create type source_reliability as enum ('A', 'B', 'C');
create type source_type as enum (
  'oficialus_lt', 'oficialus_nato', 'oficialus_uzsienio',
  'analitinis_osint', 'zeleznodorozny_osint', 'ziniasklaida', 'kitas'
);
create type source_status as enum ('veikia', 'sutrikimas', 'laukia_integracijos');
create type risk_region as enum ('baltarusija', 'suvalku_koridorius');
create type risk_level as enum ('ZALIA', 'GELTONA', 'RAUDONA');
create type change_type as enum ('nauja', 'padidejo', 'sumazejo', 'nepakito', 'nepatvirtinta');
create type indicator_category as enum (
  'kariai', 'gelezinkeliai', 'aviacija', 'raketines_sistemos', 'poligonai',
  'palydoviniai_pokyciai', 'gnss_trikdziai', 'notam_oro_erdve',
  'sausumos_pajegos', 'nato_lt_pl_atsakas'
);
create type location_category as enum (
  'aerodromas', 'poligonas', 'gelezinkelio_mazgas', 'raketine_pozicija', 'oro_gynyba',
  'nauja_stovykla', 'palydovinis_pokytis', 'incidentas', 'miestas', 'pasienio_punktas', 'siena'
);
create type aircraft_country as enum ('baltarusija', 'rusija', 'lietuva', 'lenkija', 'nato');
create type rail_signal_type as enum ('normalus_pratybinis', 'neiprastas_telkimas', 'masinis_permetimas');
create type missile_system as enum ('Iskander', 'S-300', 'S-400', 'Kita raketinė sistema');
create type missile_change_type as enum ('nauja_dislokacija', 'perkelimas', 'grizimas', 'pratybinis_aktyvumas');
create type gnss_event_type as enum ('jamming', 'spoofing');
create type gnss_intensity as enum ('zemas', 'vidutinis', 'aukstas');
create type alert_level as enum ('RAUDONA', 'GELTONA', 'INFO');
create type ingestion_status as enum ('sekminga', 'nepavyko', 'is_dalies');

-- ==================================================================================
-- SOURCES — visų duomenų šaltinių registras
-- ==================================================================================

create table sources (
  id text primary key,
  name text not null,
  type source_type not null,
  reliability source_reliability not null,
  url text not null default '',
  enabled boolean not null default true,
  last_successful_fetch timestamptz,
  status source_status not null default 'laukia_integracijos',
  notes text,
  created_at timestamptz not null default now()
);

-- ==================================================================================
-- LOCATIONS — stebimi geografiniai objektai
-- ==================================================================================

create table locations (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  category location_category not null,
  region text not null, -- 'baltarusija' | 'suvalku_koridorius' | 'abu'
  description text,
  distance_to_lt_border_km numeric,
  distance_to_vilnius_km numeric,
  created_at timestamptz not null default now()
);

-- ==================================================================================
-- EVENTS — bendras normalizuotas įvykių modelis (ingest'o pagrindinė lentelė)
-- ==================================================================================

create table events (
  id uuid primary key default gen_random_uuid(),
  raw_title text not null,
  summary_lt text not null,
  category indicator_category not null,
  confidence confidence_level not null,
  change_type change_type not null,
  risk_weight smallint not null default 0 check (risk_weight in (0, 1, 2)),
  region risk_region not null,
  location_id text references locations(id),
  observed_at timestamptz not null,
  published_at timestamptz not null,
  source_ids text[] not null default '{}',
  source_url text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique, -- URL + title hash + published_at, žr. ingest funkciją
  created_at timestamptz not null default now()
);

create index events_observed_at_idx on events (observed_at desc);
create index events_region_idx on events (region);
create index events_category_idx on events (category);

-- ==================================================================================
-- INDICATORS — Overview KPI kortelių paskutinės reikšmės
-- ==================================================================================

create table indicators (
  id text primary key,
  key text not null,
  category indicator_category not null,
  label text not null,
  value text not null,
  unit text,
  delta_label text not null,
  trend text not null default 'unknown' check (trend in ('up', 'down', 'flat', 'unknown')),
  confidence confidence_level not null,
  as_of timestamptz not null,
  region risk_region not null,
  source_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ==================================================================================
-- SATELLITE_OBSERVATIONS
-- ==================================================================================

create table satellite_observations (
  id uuid primary key default gen_random_uuid(),
  location_id text references locations(id),
  title text not null,
  observed_at timestamptz not null,
  published_at timestamptz not null default now(),
  what_we_see text[] not null default '{}',
  before_image_url text,
  after_image_url text,
  confidence confidence_level not null,
  region risk_region not null,
  source_ids text[] not null default '{}',
  source_url text,
  summary_lt text,
  raw_title text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index satellite_observed_at_idx on satellite_observations (observed_at desc);

-- ==================================================================================
-- AVIATION_OBSERVATIONS
-- ==================================================================================

create table aviation_observations (
  id uuid primary key default gen_random_uuid(),
  country aircraft_country not null,
  aircraft_type text not null,
  activity text not null,
  location_id text references locations(id),
  observed_at timestamptz not null,
  published_at timestamptz not null default now(),
  confidence confidence_level not null,
  region risk_region not null,
  source_ids text[] not null default '{}',
  source_url text,
  summary_lt text,
  raw_title text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index aviation_observed_at_idx on aviation_observations (observed_at desc);

-- ==================================================================================
-- RAILWAY_OBSERVATIONS
-- ==================================================================================

create table railway_observations (
  id uuid primary key default gen_random_uuid(),
  from_location_id text references locations(id),
  to_location_id text references locations(id),
  cargo_description text not null,
  confirmed_level confidence_level not null,
  signal_type rail_signal_type not null,
  observed_at timestamptz not null,
  published_at timestamptz not null default now(),
  region risk_region not null,
  source_ids text[] not null default '{}',
  source_url text,
  summary_lt text,
  raw_title text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index railway_observed_at_idx on railway_observations (observed_at desc);

-- ==================================================================================
-- MISSILE_AIRDEFENSE_OBSERVATIONS
-- ==================================================================================

create table missile_airdefense_observations (
  id uuid primary key default gen_random_uuid(),
  system missile_system not null,
  location_id text references locations(id),
  change_type missile_change_type not null,
  observed_at timestamptz not null,
  published_at timestamptz not null default now(),
  confidence confidence_level not null,
  region risk_region not null,
  source_ids text[] not null default '{}',
  source_url text,
  summary_lt text,
  raw_title text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index missile_observed_at_idx on missile_airdefense_observations (observed_at desc);

-- ==================================================================================
-- GNSS_EVENTS
-- ==================================================================================

create table gnss_events (
  id uuid primary key default gen_random_uuid(),
  area_name text not null,
  lat double precision not null,
  lng double precision not null,
  radius_km numeric,
  type gnss_event_type not null,
  intensity gnss_intensity not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  published_at timestamptz not null default now(),
  confidence confidence_level not null,
  region risk_region not null,
  source_ids text[] not null default '{}',
  source_url text,
  summary_lt text,
  raw_title text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index gnss_started_at_idx on gnss_events (started_at desc);

-- ==================================================================================
-- NOTAMS
-- ==================================================================================

create table notams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text not null,
  restriction_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  published_at timestamptz not null default now(),
  confidence confidence_level not null,
  region risk_region not null,
  source_ids text[] not null default '{}',
  source_url text,
  summary_lt text,
  raw_title text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index notams_starts_at_idx on notams (starts_at desc);

-- ==================================================================================
-- EXERCISES
-- ==================================================================================

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sides text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_ids text[] not null default '{}',
  scale text not null,
  personnel_remained_after boolean,
  published_at timestamptz not null default now(),
  confidence confidence_level not null,
  region risk_region not null,
  source_ids text[] not null default '{}',
  source_url text,
  summary_lt text,
  raw_title text,
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index exercises_starts_at_idx on exercises (starts_at desc);

-- ==================================================================================
-- NEWS_ITEMS — Naujienų / OSINT srauto santraukos (nuoroda į originalą, ne pilnas tekstas)
-- ==================================================================================

create table news_items (
  id uuid primary key default gen_random_uuid(),
  raw_title text not null,
  summary_lt text not null,
  published_at timestamptz not null,
  source_id text not null references sources(id),
  source_url text not null,
  confidence confidence_level not null,
  region text not null default 'abu',
  status text not null default 'aktyvus',
  tags text[] not null default '{}',
  dedup_key text unique,
  created_at timestamptz not null default now()
);

create index news_published_at_idx on news_items (published_at desc);

-- ==================================================================================
-- DAILY_SNAPSHOTS — kasdieniai duomenų pjūviai palyginimams ("kas pasikeitė")
-- ==================================================================================

create table daily_snapshots (
  date date primary key,
  risk_level risk_level not null,
  suwalki_risk_level risk_level not null,
  summary_lt text not null,
  created_at timestamptz not null default now()
);

-- ==================================================================================
-- ALERTS — Alert Center įrašai (generuojami backend'o, kai pasikeičia rizikos lygis)
-- ==================================================================================

create table alerts (
  id uuid primary key default gen_random_uuid(),
  level alert_level not null,
  title text not null,
  body text not null,
  region risk_region not null,
  related_event_id uuid references events(id),
  created_at timestamptz not null default now()
);

create index alerts_created_at_idx on alerts (created_at desc);

-- ==================================================================================
-- INGESTION_RUNS — ingest proceso vykdymo istorija (Admin/Sources ekranui)
-- ==================================================================================

create table ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id text references sources(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status ingestion_status,
  items_seen integer not null default 0,
  items_inserted integer not null default 0,
  items_deduplicated integer not null default 0,
  error_message text
);

create index ingestion_runs_source_idx on ingestion_runs (source_id, started_at desc);

-- ==================================================================================
-- PUSH_SUBSCRIPTIONS — vartotojo įrenginio Web Push prenumerata ir pranešimų nuostatos
-- ==================================================================================

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  notification_preference text not null default 'geltona_raudona'
    check (notification_preference in ('raudona', 'geltona_raudona', 'visi')),
  quiet_hours_enabled boolean not null default false,
  quiet_from time,
  quiet_to time,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- ==================================================================================
-- ROW LEVEL SECURITY
-- ==================================================================================

alter table sources enable row level security;
alter table locations enable row level security;
alter table events enable row level security;
alter table indicators enable row level security;
alter table satellite_observations enable row level security;
alter table aviation_observations enable row level security;
alter table railway_observations enable row level security;
alter table missile_airdefense_observations enable row level security;
alter table gnss_events enable row level security;
alter table notams enable row level security;
alter table exercises enable row level security;
alter table news_items enable row level security;
alter table daily_snapshots enable row level security;
alter table alerts enable row level security;
alter table ingestion_runs enable row level security;
alter table push_subscriptions enable row level security;

-- Viešas (anon + authenticated) skaitymas dashboard'ui. Rašymą atlieka tik service_role
-- (Edge Functions), kuris RLS visada apeina — jokių papildomų write politikų nereikia.
create policy "Vieša skaitymo prieiga" on sources for select using (true);
create policy "Vieša skaitymo prieiga" on locations for select using (true);
create policy "Vieša skaitymo prieiga" on events for select using (true);
create policy "Vieša skaitymo prieiga" on indicators for select using (true);
create policy "Vieša skaitymo prieiga" on satellite_observations for select using (true);
create policy "Vieša skaitymo prieiga" on aviation_observations for select using (true);
create policy "Vieša skaitymo prieiga" on railway_observations for select using (true);
create policy "Vieša skaitymo prieiga" on missile_airdefense_observations for select using (true);
create policy "Vieša skaitymo prieiga" on gnss_events for select using (true);
create policy "Vieša skaitymo prieiga" on notams for select using (true);
create policy "Vieša skaitymo prieiga" on exercises for select using (true);
create policy "Vieša skaitymo prieiga" on news_items for select using (true);
create policy "Vieša skaitymo prieiga" on daily_snapshots for select using (true);
create policy "Vieša skaitymo prieiga" on alerts for select using (true);
create policy "Vieša skaitymo prieiga" on ingestion_runs for select using (true);

-- push_subscriptions: PRIVATU. Nėra SELECT politikos anon/authenticated rolėms (tik service_role
-- gali skaityti siųsdamas push). Klientas gali sukurti/atnaujinti TIK savo prenumeratą per
-- Edge Function su service_role raktu — ne tiesiogiai iš naršyklės su anon raktu — todėl čia
-- taip pat nesuteikiama jokia anon INSERT politika.
