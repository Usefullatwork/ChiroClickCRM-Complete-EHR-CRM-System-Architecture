/**
 * ChiroClick CRM Service Worker
 *
 * Provides offline support:
 * - Cache static assets
 * - Cache API responses
 * - Offline fallback page
 * - Background sync for offline actions
 */

const CACHE_NAME = 'chiroclick-v2';
const OFFLINE_URL = '/offline.html';
const EXERCISE_CACHE_NAME = 'chiroclick-exercises-v1';

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
  '/api/v1/exercises',
  '/api/v1/exercises/categories',
  '/api/v1/exercises/body-regions',
  '/api/v1/exercises/programs',
  '/api/v1/exercises/favorites',
];

// Exercise-related routes that should be aggressively cached
const EXERCISE_CACHE_ROUTES = [
  '/api/v1/exercises',
  '/api/v1/exercises/categories',
  '/api/v1/exercises/body-regions',
  '/api/v1/exercises/programs',
];

// Image/media URLs to cache for offline exercise viewing
const EXERCISE_MEDIA_PATTERNS = [
  /\/exercises\/.*\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /\/images\/exercises\//i,
  /\/thumbnails\//i,
  /i\.ytimg\.com/i, // YouTube thumbnails
];

// =============================================================================
// INSTALL EVENT
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Create exercise cache
      caches.open(EXERCISE_CACHE_NAME).then((_cache) => {
        console.log('[SW] Exercise cache initialized');
      }),
    ])
  );

  // Force waiting service worker to become active
  self.skipWaiting();
});

// =============================================================================
// ACTIVATE EVENT
// =============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  const currentCaches = [CACHE_NAME, EXERCISE_CACHE_NAME];

  event.waitUntil(
    Promise.all([
      // Clean up old caches (except current versions)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
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

  // Exercise media (images, thumbnails): Cache first with long expiry
  if (isExerciseMedia(url)) {
    event.respondWith(exerciseMediaStrategy(request));
    return;
  }

  // Exercise API routes: Network first with aggressive caching
  if (isExerciseApiRoute(url)) {
    event.respondWith(exerciseApiStrategy(request));
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

/**
 * Check if URL is an exercise media resource
 */
function isExerciseMedia(url) {
  return EXERCISE_MEDIA_PATTERNS.some((pattern) => pattern.test(url.href));
}

/**
 * Check if URL is an exercise API route
 */
function isExerciseApiRoute(url) {
  return EXERCISE_CACHE_ROUTES.some(
    (route) => url.pathname.includes(route) || url.pathname.startsWith(route)
  );
}

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

/**
 * Exercise Media Strategy
 * Cache first with long expiry - media changes rarely
 */
async function exerciseMediaStrategy(request) {
  const cache = await caches.open(EXERCISE_CACHE_NAME);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and cache the response
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a placeholder image if available
    const placeholder = await cache.match('/images/exercise-placeholder.png');
    if (placeholder) {
      return placeholder;
    }

    // Return error response
    return new Response('Image not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Exercise API Strategy
 * Network first with aggressive caching and longer cache validity
 */
async function exerciseApiStrategy(request) {
  const cache = await caches.open(EXERCISE_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed - try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache-Status', 'offline');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // No cache available
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Exercise data not available offline. Please sync when online.',
        cached: false,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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

  if (event.tag === 'sync-exercise-prescriptions') {
    event.waitUntil(syncExercisePrescriptions());
  }

  if (event.tag === 'sync-exercise-compliance') {
    event.waitUntil(syncExerciseCompliance());
  }
});

/**
 * Sync pending appointments to server
 */
async function syncAppointments() {
  try {
    const pending = await getFromIndexedDB('pending-appointments');
    if (!pending || pending.length === 0) {
      return;
    }

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
    if (!pending || pending.length === 0) {
      return;
    }

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

/**
 * Sync pending exercise prescriptions to server
 */
async function syncExercisePrescriptions() {
  try {
    const pending = await getFromExerciseDB('pendingPrescriptions');
    if (!pending || pending.length === 0) {
      return;
    }

    console.log(`[SW] Syncing ${pending.length} pending exercise prescriptions`);

    for (const prescription of pending) {
      try {
        await fetch(`/api/v1/patients/${prescription.patient_id}/exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(prescription.data),
        });
        await removeFromExerciseDB('pendingPrescriptions', prescription.localId);
        console.log('[SW] Synced exercise prescription:', prescription.localId);
      } catch (error) {
        console.error('[SW] Failed to sync exercise prescription:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Exercise prescription sync failed:', error);
  }
}

/**
 * Sync pending exercise compliance logs to server
 */
async function syncExerciseCompliance() {
  try {
    const pending = await getFromExerciseDB('pendingCompliance');
    if (!pending || pending.length === 0) {
      return;
    }

    console.log(`[SW] Syncing ${pending.length} pending compliance logs`);

    for (const compliance of pending) {
      try {
        await fetch(`/api/v1/exercises/prescriptions/${compliance.prescription_id}/compliance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(compliance.data),
        });
        await removeFromExerciseDB('pendingCompliance', compliance.localId);
        console.log('[SW] Synced compliance log:', compliance.prescription_id);
      } catch (error) {
        console.error('[SW] Failed to sync compliance log:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Compliance sync failed:', error);
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

// =============================================================================
// EXERCISE-SPECIFIC INDEXED DB HELPERS
// =============================================================================

function getFromExerciseDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChiroClickExercises', 1);

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
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('exercises')) {
        const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
        exerciseStore.createIndex('code', 'code', { unique: false });
        exerciseStore.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains('prescriptions')) {
        const prescriptionStore = db.createObjectStore('prescriptions', { keyPath: 'id' });
        prescriptionStore.createIndex('patient_id', 'patient_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('pendingCompliance')) {
        db.createObjectStore('pendingCompliance', { keyPath: 'localId', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingPrescriptions')) {
        db.createObjectStore('pendingPrescriptions', { keyPath: 'localId', autoIncrement: true });
      }
    };
  });
}

function removeFromExerciseDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChiroClickExercises', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

console.log('[SW] Service worker loaded (v2 with exercise support)');
