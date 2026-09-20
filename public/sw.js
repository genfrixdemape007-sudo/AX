// Intentionally minimal: this app's content (products, prices, settings) comes live from
// Supabase, so we don't want to serve stale cached data. This service worker exists mainly
// to satisfy "installability" requirements for Add to Home Screen — it just passes requests
// straight through to the network.
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Pass-through — no caching, always hit the network.
  event.respondWith(fetch(event.request))
})
