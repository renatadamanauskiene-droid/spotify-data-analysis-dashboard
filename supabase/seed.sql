-- Pradinis atskaitos duomenų užpildymas. SVARBU: čia užpildomos TIK realios geografinės
-- lokacijos ir šaltinių registras (tai nėra "faktai" — vien pavadinimai/koordinatės/nuorodos).
-- JOKIŲ demonstracinių įvykių, palydovinių įrašų ar kitų "faktų" į realią (live) duomenų bazę
-- NEDEDAMA — demo turinys egzistuoja tik src/data/demo kliento pusėje ir niekada nepasiekia
-- šios schemos, kad live diegime nebūtų jokios rizikos fiktyvų turinį parodyti kaip realų.

insert into locations (id, name, lat, lng, category, region, description, distance_to_lt_border_km, distance_to_vilnius_km) values
  ('vilnius', 'Vilnius', 54.6872, 25.2797, 'miestas', 'abu', 'Lietuvos sostinė, atskaitos taškas atstumams.', null, 0),
  ('siena-medininkai', 'Lietuvos–Baltarusijos siena (Medininkai)', 54.5747, 25.9585, 'siena', 'baltarusija', null, 0, 38),
  ('gardinas', 'Gardinas', 53.6884, 23.8258, 'aerodromas', 'baltarusija', 'Regioninis centras, karinis aerodromas netoliese.', 32, 165),
  ('asmena', 'Ašmena', 54.4229, 25.9502, 'miestas', 'baltarusija', null, 12, 68),
  ('lyda', 'Lyda', 53.8898, 25.2996, 'aerodromas', 'baltarusija', 'Karinis aerodromas.', 45, 140),
  ('brestas', 'Brestas', 52.0975, 23.7341, 'gelezinkelio_mazgas', 'baltarusija', 'Svarbus geležinkelio mazgas prie ES sienos.', 290, 400),
  ('baranovicai', 'Baranovičiai', 53.1325, 26.0159, 'aerodromas', 'baltarusija', 'Karinis aerodromas.', 165, 280),
  ('maciuliscai', 'Mačiuliščiai', 53.8419, 27.5031, 'aerodromas', 'baltarusija', 'Karinis aerodromas netoli Minsko.', 190, 215),
  ('luninecas', 'Luninecas', 52.2492, 26.7969, 'aerodromas', 'baltarusija', null, 260, 370),
  ('zyabrovka', 'Zyabrovka', 52.3667, 30.9333, 'aerodromas', 'baltarusija', 'Karinis aerodromas prie Gomelio.', 420, 460),
  ('gozhskij', 'Gožskij poligonas', 53.5833, 24.6333, 'poligonas', 'baltarusija', 'Pratybų poligonas netoli Gardino.', 40, 155),
  ('obuz-lesnovskij', 'Obuz-Lesnovskij', 52.9333, 25.75, 'raketine_pozicija', 'baltarusija', 'Raketinių pajėgų bazė netoli Baranovičių.', 175, 290),
  ('losvido', 'Losvido poligonas', 55.2, 30.05, 'poligonas', 'baltarusija', 'Pratybų poligonas prie Vitebsko.', 210, 300),
  ('gomelis', 'Gomelis', 52.4345, 30.9754, 'gelezinkelio_mazgas', 'baltarusija', 'Regiono centras, geležinkelio mazgas.', 430, 470),
  ('suvalkai', 'Suvalkai (Suwałki)', 54.1017, 22.9309, 'miestas', 'suvalku_koridorius', null, null, 210),
  ('augustavas', 'Augustavas (Augustów)', 53.8433, 22.9797, 'miestas', 'suvalku_koridorius', null, null, 250),
  ('seinai', 'Seinai (Sejny)', 54.1167, 23.35, 'miestas', 'suvalku_koridorius', null, null, 195),
  ('lazdijai', 'Lazdijai', 54.2333, 23.5167, 'miestas', 'suvalku_koridorius', null, null, 165),
  ('druskininkai', 'Druskininkai', 54.0167, 23.9667, 'miestas', 'suvalku_koridorius', null, null, 130),
  ('kalvarija', 'Kalvarija', 54.4167, 23.2167, 'miestas', 'suvalku_koridorius', null, null, 130),
  ('marijampole', 'Marijampolė', 54.5667, 23.35, 'miestas', 'suvalku_koridorius', null, null, 105),
  ('kaliningradas', 'Kaliningrado sritis (Černiachovskas)', 54.6333, 21.8167, 'aerodromas', 'suvalku_koridorius', 'Karinis aerodromas Kaliningrado srityje.', null, 320)
on conflict (id) do nothing;

insert into sources (id, name, type, reliability, url, enabled, status, notes) values
  ('vsd', 'Valstybės saugumo departamentas (VSD)', 'oficialus_lt', 'A', 'https://www.vsd.lt', true, 'laukia_integracijos', 'RSS/skelbimų sąrašo integracija dar nesukonfigūruota.'),
  ('kam', 'Krašto apsaugos ministerija (KAM)', 'oficialus_lt', 'A', 'https://kam.lt', true, 'laukia_integracijos', null),
  ('nato-hq', 'NATO oficialūs pranešimai', 'oficialus_nato', 'A', 'https://www.nato.int', true, 'laukia_integracijos', null),
  ('isw-ctp', 'ISW / Critical Threats', 'analitinis_osint', 'A', 'https://www.understandingwar.org', true, 'laukia_integracijos', null),
  ('belarusian-hajun', 'Belarusian Hajun (geležinkelių/karinis stebėjimas)', 'zeleznodorozny_osint', 'B', 'https://t.me/hajunbelarus', true, 'laukia_integracijos', null),
  ('bellingcat', 'Bellingcat tipo OSINT analizė', 'analitinis_osint', 'B', 'https://www.bellingcat.com', true, 'laukia_integracijos', null),
  ('lrt', 'LRT naujienos', 'ziniasklaida', 'B', 'https://www.lrt.lt', true, 'laukia_integracijos', null),
  ('reuters', 'Reuters', 'ziniasklaida', 'B', 'https://www.reuters.com', true, 'laukia_integracijos', null),
  ('osint-aviation-trackers', 'Neoficialūs ADS-B / OSINT skrydžių stebėtojai', 'analitinis_osint', 'C', '', false, 'laukia_integracijos', 'Realaus ADS-B šaltinio integracija dar neatlikta.'),
  ('unverified-telegram', 'Nepatvirtinti vietiniai Telegram kanalai', 'kitas', 'C', '', false, 'laukia_integracijos', null)
on conflict (id) do nothing;
