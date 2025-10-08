const CACHE_VERSION = 'v3';
const STATIC_CACHE_NAME = `tandem-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `tandem-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `tandem-api-${CACHE_VERSION}`;

const staticAssets = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Don't pre-cache fonts to avoid CORS issues during install
const fontsToCache = [];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('SW: Caching static assets');
      return cache.addAll(staticAssets);
    }).then(() => {
      console.log('SW: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Static assets - Cache First
    if (staticAssets.some(asset => url.pathname === asset) || 
        url.pathname.startsWith('/icon-') || 
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.ico')) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME);
    }
    
    // Fonts - Cache First
    if (url.hostname === 'fonts.googleapis.com' || 
        url.hostname === 'fonts.gstatic.com') {
      return await cacheFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // API requests - Network First with fallback (exclude auth endpoints)
    if (url.pathname.startsWith('/api/')) {
      // Don't cache sensitive auth endpoints
      if (url.pathname.startsWith('/api/auth/')) {
        return await fetch(request);
      }
      return await networkFirstStrategy(request, API_CACHE_NAME);
    }
    
    // App shell - Network First with cache fallback
    if (url.origin === location.origin) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // Default: Network only for external resources
    return await fetch(request);
    
  } catch (error) {
    console.log('SW: Fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return await cache.match('/') || new Response('Offline', { status: 200 });
    }
    
    throw error;
  }
}

// Cache First Strategy
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First Strategy
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenses());
  }
});

async function syncExpenses() {
  // This would sync offline expenses when connection is restored
  console.log('SW: Syncing offline expenses...');
  // Implementation would depend on your offline storage strategy
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova notificação do Tandem',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'tandem-notification',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Tandem', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll().then((clientsList) => {
      if (clientsList.length > 0) {
        return clientsList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});