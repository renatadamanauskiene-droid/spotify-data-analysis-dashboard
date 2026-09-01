// Edge Function: compute-risk-and-notify
// Paskirtis: perskaičiuoti rizikos lygį (Baltarusija + Suvalkų koridorius) pagal patikimus
// events, palyginti su vakarykščiu daily_snapshots įrašu, ir jei lygis pakilo iki GELTONOS
// ar RAUDONOS — sukurti `alerts` įrašą bei nusiųsti Web Push pranešimus prenumeratoriams
// (pagal jų notification_preference ir quiet hours). Ta pati rizikos logika kaip
// src/lib/riskEngine.ts kliento pusėje (tyčia dubliuota — Edge Function veikia Deno aplinkoje).
//
// Paleidimas pagal grafiką: po ingest-rss / po kitų ingest funkcijų (Supabase Dashboard Schedule
// arba pg_cron), pvz. kas valandą.
//
// Reikalingi aplinkos kintamieji: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (pvz. "mailto:admin@example.lt").
// Jei VAPID raktai nesukonfigūruoti, alerts vis tiek generuojami, tačiau push nesiunčiamas.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.lt'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const pushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
if (pushConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!)
}

type RiskLevel = 'ZALIA' | 'GELTONA' | 'RAUDONA'
type Region = 'baltarusija' | 'suvalku_koridorius'

interface EventRow {
  category: string
  confidence: string
  risk_weight: number
  region: string
  observed_at: string
  source_ids: string[]
}

function computeRisk(events: EventRow[], reliableSourceIds: Set<string>, region: Region, windowHours: number): { level: RiskLevel; reasons: string[] } {
  const now = Date.now()
  const candidates = events.filter(
    (e) =>
      e.region === region &&
      e.risk_weight >= 1 &&
      e.confidence !== 'NEPATVIRTINTA' &&
      now - new Date(e.observed_at).getTime() <= windowHours * 3600 * 1000,
  )
  const reliable = candidates.filter((e) => e.source_ids.some((id) => reliableSourceIds.has(id)))
  const strongReliable = reliable.filter((e) => e.risk_weight === 2)
  const categories = new Set(reliable.map((e) => e.category))
  const sourceCount = new Set(reliable.flatMap((e) => e.source_ids)).size

  if (categories.size >= 3 && strongReliable.length >= 2 && sourceCount >= 2) {
    return { level: 'RAUDONA', reasons: [`${categories.size} nepriklausomos patikimos kategorijos, ${strongReliable.length} stiprūs signalai.`] }
  }
  if (candidates.length > 0) {
    return { level: 'GELTONA', reasons: [`${categories.size} kategorijos neįprasto aktyvumo per ${windowHours} val.`] }
  }
  return { level: 'ZALIA', reasons: ['Reikšmingo indikatoriaus nenustatyta.'] }
}

const RISK_RANK: Record<RiskLevel, number> = { ZALIA: 0, GELTONA: 1, RAUDONA: 2 }

Deno.serve(async () => {
  const [{ data: events, error: eventsError }, { data: sources, error: sourcesError }, { data: lastSnapshot }] = await Promise.all([
    supabase.from('events').select('category, confidence, risk_weight, region, observed_at, source_ids').gte('observed_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
    supabase.from('sources').select('id, reliability'),
    supabase.from('daily_snapshots').select('*').order('date', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (eventsError || sourcesError) {
    return new Response(JSON.stringify({ error: eventsError?.message || sourcesError?.message }), { status: 500 })
  }

  const reliableSourceIds = new Set((sources || []).filter((s) => s.reliability === 'A' || s.reliability === 'B').map((s) => s.id))

  const belarus = computeRisk((events as EventRow[]) || [], reliableSourceIds, 'baltarusija', 72)
  const suwalki = computeRisk((events as EventRow[]) || [], reliableSourceIds, 'suvalku_koridorius', 72)

  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('daily_snapshots').upsert({
    date: today,
    risk_level: belarus.level,
    suwalki_risk_level: suwalki.level,
    summary_lt: `Baltarusija: ${belarus.reasons[0]} Suvalkų koridorius: ${suwalki.reasons[0]}`,
  })

  const previousBelarus: RiskLevel = lastSnapshot?.risk_level || 'ZALIA'
  const previousSuwalki: RiskLevel = lastSnapshot?.suwalki_risk_level || 'ZALIA'

  const newAlerts: { level: 'RAUDONA' | 'GELTONA'; title: string; body: string; region: Region }[] = []

  if (belarus.level !== 'ZALIA' && RISK_RANK[belarus.level] > RISK_RANK[previousBelarus]) {
    newAlerts.push({
      level: belarus.level as 'RAUDONA' | 'GELTONA',
      title: `Rizikos lygis Baltarusijoje pakilo iki ${belarus.level}`,
      body: belarus.reasons.join(' '),
      region: 'baltarusija',
    })
  }
  if (suwalki.level !== 'ZALIA' && RISK_RANK[suwalki.level] > RISK_RANK[previousSuwalki]) {
    newAlerts.push({
      level: suwalki.level as 'RAUDONA' | 'GELTONA',
      title: `Rizikos lygis Suvalkų koridoriuje pakilo iki ${suwalki.level}`,
      body: suwalki.reasons.join(' '),
      region: 'suvalku_koridorius',
    })
  }

  for (const alert of newAlerts) {
    await supabase.from('alerts').insert(alert)
  }

  let pushResults: unknown = 'VAPID nesukonfigūruotas — push praleistas.'
  if (pushConfigured && newAlerts.length > 0) {
    const { data: subs } = await supabase.from('push_subscriptions').select('*')
    const nowHm = new Date().toISOString().slice(11, 16)
    let sent = 0
    let skipped = 0

    for (const sub of subs || []) {
      const wantsLevel = (level: 'RAUDONA' | 'GELTONA') =>
        sub.notification_preference === 'visi' ||
        (sub.notification_preference === 'geltona_raudona') ||
        (sub.notification_preference === 'raudona' && level === 'RAUDONA')

      const inQuietHours = sub.quiet_hours_enabled && sub.quiet_from && sub.quiet_to && isWithinQuiet(nowHm, sub.quiet_from, sub.quiet_to)

      for (const alert of newAlerts) {
        if (!wantsLevel(alert.level) || (inQuietHours && alert.level !== 'RAUDONA')) {
          skipped += 1
          continue
        }
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: alert.title, body: alert.body, level: alert.level, url: '/signalai' }),
          )
          sent += 1
        } catch {
          // Negaliojanti prenumerata (pvz. naršyklė ją atšaukė) — praleidžiama tyliai.
        }
      }
    }
    pushResults = { sent, skipped }
  }

  return new Response(JSON.stringify({ belarus, suwalki, newAlerts, pushResults }, null, 2), {
    headers: { 'content-type': 'application/json' },
  })
})

function isWithinQuiet(nowHm: string, from: string, to: string): boolean {
  if (from <= to) return nowHm >= from && nowHm <= to
  return nowHm >= from || nowHm <= to // laikotarpis kertantis vidurnaktį
}
