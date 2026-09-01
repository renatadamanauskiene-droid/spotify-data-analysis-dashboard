/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Supabase / API atsakymai: pirmenybė tinklui, bet laikomas paskutinis sėkmingas atsakymas
// atveju, jei įrenginys neprisijungęs — tenkina "offline: paskutinis snapshot'as matomas" reikalavimą.
registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1') || url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 6,
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 })],
  }),
)

// OSM žemėlapio plyteles patogu laikyti ilgiau, kad žemėlapis liktų naudingas be ryšio.
registerRoute(
  ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'osm-tiles',
    plugins: [new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 14 })],
  }),
)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// --- Push pranešimų architektūra ---------------------------------------------------------------
// Kai backend (Supabase Edge Function) nustato naują GELTONĄ arba RAUDONĄ signalą, jis siunčia
// Web Push pranešimą per prenumeratą, sukurtą naudotojo įrenginyje (žr. src/lib/pushNotifications.ts).
// Šis handleris tik atvaizduoja gautą pranešimą — vartotojo pasirinkti filtrai (tik RAUDONA /
// GELTONA+RAUDONA / visi, quiet hours) turi būti taikomi siuntimo pusėje (backend), nes push
// pranešimas gali ateiti net kai puslapis uždarytas.

interface PushPayload {
  title: string
  body: string
  level?: 'RAUDONA' | 'GELTONA' | 'INFO'
  url?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = { title: 'Baltarusijos karinė stebėsena', body: 'Naujas atnaujinimas.' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    if (event.data) payload.body = event.data.text()
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.level || 'info',
    data: { url: payload.url || '/signalai' },
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/signalai'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
