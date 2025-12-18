/**
 * ChiroClick CRM Service Worker
 *
 * Provides offline support:
 * - Cache static assets
 * - Cache API responses
 * - Offline fallback page
 * - Background sync for offline actions
 */

const CACHE_NAME = 'chiroclick-v1';
const OFFLINE_URL = '/offline.html';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = [
  '/api/patients',
  '/api/appointments',
  '/api/dashboard',
];

// =============================================================================
// INSTALL EVENT
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Force waiting service worker to become active
  self.skipWaiting();
});

// =============================================================================
// ACTIVATE EVENT
// =============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

// =============================================================================
// FETCH EVENT
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests: Network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets and pages: Cache first, fall back to network
  event.respondWith(cacheFirstStrategy(request));
});

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

/**
 * Cache First Strategy
 * Try cache first, fall back to network, update cache in background
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetchAndCache(request, cache);
    return cachedResponse;
  }

  // Try network
  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, fall back to cache
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response for API requests
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline. Please check your connection.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Fetch and update cache in background
 */
async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail - we already have cached response
  }
}

// =============================================================================
// BACKGROUND SYNC
// =============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }

  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

/**
 * Sync pending appointments to server
 */
async function syncAppointments() {
  try {
    const pending = await getFromIndexedDB('pending-appointments');
    if (!pending || pending.length === 0) return;

    for (const appointment of pending) {
      try {
        await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointment),
        });
        await removeFromIndexedDB('pending-appointments', appointment.id);
      } catch (error) {
        console.error('[SW] Failed to sync appointment:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * Sync pending SOAP notes to server
 */
async function syncNotes() {
  try {
    const pending = await getFromIndexedDB('pending-notes');
    if (!pending || pending.length === 0) return;

    for (const note of pending) {
      try {
        await fetch(`/api/patients/${note.patientId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note),
        });
        await removeFromIndexedDB('pending-notes', note.id);
      } catch (error) {
        console.error('[SW] Failed to sync note:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = { title: 'ChiroClick', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  // Navigate to relevant page based on notification data
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if possible
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// =============================================================================
// INDEXED DB HELPERS (for background sync)
// =============================================================================

function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChiroClickOffline', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }

      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-appointments')) {
        db.createObjectStore('pending-appointments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-notes')) {
        db.createObjectStore('pending-notes', { keyPath: 'id' });
      }
    };
  });
}

function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChiroClickOffline', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

console.log('[SW] Service worker loaded');
