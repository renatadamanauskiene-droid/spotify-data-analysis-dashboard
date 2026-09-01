-- Migracija 0005: papildomi ADS-B laukai grėsmės atpažinimui (žr. src/lib/threatEngine.ts).
-- Šie laukai leidžia automatiškai atpažinti karinius orlaivius (naikintuvus, bombonešius,
-- transportą, dronus) ir avarines situacijas, o ekranas juos pažymi ĮSPĖJIMAS / PAVOJUS.

alter table live_aircraft_cache add column if not exists type_code text;
alter table live_aircraft_cache add column if not exists type_desc text;
alter table live_aircraft_cache add column if not exists category text;
alter table live_aircraft_cache add column if not exists db_flags integer;
alter table live_aircraft_cache add column if not exists squawk text;
alter table live_aircraft_cache add column if not exists emergency text;
