// Service Worker for Brain Dumping PWA
const CACHE_NAME = 'brain-dump-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg'
]

// Install Event - Cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Install event')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return
  }
  
  // API requests - Network only (always fresh data)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - API not available' }), 
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        )
      })
    )
    return
  }
  
  // Static assets and pages - Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone the response before caching
        const responseToCache = response.clone()
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache)
          })
        }
        
        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then(cached => {
          if (cached) {
            console.log('[SW] Serving from cache:', request.url)
            return cached
          }
          
          // No cache available
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          })
        })
      })
  )
})

// Background Sync (future feature)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    console.log('[SW] Background sync triggered')
    event.waitUntil(
      // Sync offline tasks when online
      Promise.resolve()
    )
  }
})

// Push Notification (future feature)
self.addEventListener('push', event => {
  if (!event.data) {
    return
  }
  
  const data = event.data.json()
  const options = {
    body: data.body || 'Brain Dumping 알림',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Brain Dumping', options)
  )
})

// Notification Click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  const url = event.notification.data.url || '/'
  
  event.waitUntil(
    clients.openWindow(url)
  )
})
