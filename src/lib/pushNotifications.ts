// PWA push pranešimų architektūra (klientinė pusė).
// Realiam veikimui reikia: 1) backend/Edge Function, generuojantis GELTONĄ/RAUDONĄ signalą ir
// siunčiantį Web Push per VAPID raktus; 2) VITE_VAPID_PUBLIC_KEY aplinkos kintamojo su viešu raktu.
// Kol tai nesukonfigūruota, prenumerata negalima — tai aiškiai rodoma naudotojui, jokia push
// prenumerata neapsimetinėjama sukurta.

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

export function isPushBackendConfigured(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY)
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!isPushSupported() || !vapidKey) return null

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  })
}

// Nusiunčia prenumeratą + pasirinktus nustatymus į Edge Function, kuri juos išsaugo
// `push_subscriptions` lentelėje (klientas neturi tiesioginės rašymo teisės į tą lentelę).
export async function registerSubscriptionWithBackend(
  subscription: PushSubscription,
  preference: 'raudona' | 'geltona_raudona' | 'visi',
  quietHours: { enabled: boolean; from: string; to: string },
): Promise<boolean> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!supabaseUrl || !anonKey) return false

  const json = subscription.toJSON()
  const res = await fetch(`${supabaseUrl}/functions/v1/register-push-subscription`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: anonKey, authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      notificationPreference: preference,
      quietHours,
    }),
  })
  return res.ok
}
