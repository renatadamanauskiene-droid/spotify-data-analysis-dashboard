// Edge Function: register-push-subscription
// Klientas (PWA) čia siunčia savo Web Push prenumeratą + pasirinktus pranešimų nustatymus.
// Naudoja service_role raktą serverio pusėje, todėl push_subscriptions lentelė gali likti be
// jokios anon INSERT RLS politikos (prenumeratos privačios, prieinamos tik backend'ui).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, authorization, apikey',
  'access-control-allow-methods': 'POST, OPTIONS',
}

interface RequestBody {
  endpoint: string
  keys: { p256dh: string; auth: string }
  notificationPreference?: 'raudona' | 'geltona_raudona' | 'visi'
  quietHours?: { enabled: boolean; from: string; to: string }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Netinkamas JSON.' }), { status: 400, headers: corsHeaders })
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return new Response(JSON.stringify({ error: 'Trūksta endpoint/keys.' }), { status: 400, headers: corsHeaders })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      notification_preference: body.notificationPreference || 'geltona_raudona',
      quiet_hours_enabled: body.quietHours?.enabled ?? false,
      quiet_from: body.quietHours?.enabled ? body.quietHours.from : null,
      quiet_to: body.quietHours?.enabled ? body.quietHours.to : null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'content-type': 'application/json' } })
})
