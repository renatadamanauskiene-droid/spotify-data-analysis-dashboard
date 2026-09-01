-- Serverio pusėje kaupiamas OpenSky Network ADS-B momentinės būsenos talpyklos (cache) lentelė.
-- Paskirtis: VIENAS serverio (Edge Function) kvietimas į OpenSky kas 1-2 min. aptarnauja VISUS
-- programėlės vartotojus, o ne kiekvieno naršyklė kviečia OpenSky atskirai — tai išsprendžia ir
-- anoniminės OpenSky prieigos ribojimus (rate limit / 503 pikinio apkrovimo metu), ir sumažina
-- bendrą apkrovą OpenSky serveriams. Duomenys visada pilnai perrašomi kiekvieno ingest paleidimo
-- metu (žr. supabase/functions/ingest-aviation) — tai momentinės būsenos, ne istorinis archyvas.

create table live_aircraft_cache (
  icao24 text primary key,
  callsign text,
  origin_country text not null,
  lat double precision,
  lng double precision,
  baro_altitude_m numeric,
  velocity_ms numeric,
  heading_deg numeric,
  on_ground boolean not null default false,
  last_contact timestamptz not null,
  fetched_at timestamptz not null default now()
);

create index live_aircraft_fetched_at_idx on live_aircraft_cache (fetched_at desc);

alter table live_aircraft_cache enable row level security;

create policy "Vieša skaitymo prieiga" on live_aircraft_cache for select using (true);
