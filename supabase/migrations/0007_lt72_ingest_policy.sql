-- Migracija 0007: lt72_alerts lentelėje pridedami INSERT ir UPDATE leidimai.
-- Reikalinga GitHub Actions workflow'ui, kuris rašo tiesiogiai per Supabase REST API
-- su anon raktu (Edge Function yra blokuojama lt72.lt WAF dėl cloud IP).
-- lt72 perspėjimai yra viešas valdžios turinys — atvira rašymo prieiga priimtina.

create policy if not exists "Vieša įterpimo prieiga" on lt72_alerts
  for insert with check (true);

create policy if not exists "Vieša atnaujinimo prieiga" on lt72_alerts
  for update using (true) with check (true);
