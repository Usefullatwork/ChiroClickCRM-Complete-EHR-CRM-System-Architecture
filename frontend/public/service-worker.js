/**
 * ChiroClickCRM Patient Portal Service Worker
 *
 * Provides offline support for the patient portal:
 * - Caches static assets (app shell)
 * - Caches exercise data for offline viewing
 * - Optionally caches exercise videos (user choice)
 * - Queues exercise completion logs when offline
 * - Syncs when back online
 *
 * Bilingual: English/Norwegian
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `chiroclickcrm-static-${CACHE_VERSION}`;
const DATA_CACHE = `chiroclickcrm-data-${CACHE_VERSION}`;
const VIDEO_CACHE = `chiroclickcrm-videos-${CACHE_VERSION}`;

// Static assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Portal pages - these will be served from cache when offline
  '/portal/mine-ovelser',
  '/portal/ovelse',
];

// API endpoints to cache for offline use
const CACHEABLE_API_PATTERNS = [
  /\/api\/v1\/patient-portal\/[^/]+\/prescriptions/,
  /\/api\/v1\/patient-portal\/[^/]+\/prescriptions\/[^/]+$/,
  /\/api\/v1\/patient-portal\/[^/]+\/prescriptions\/[^/]+\/exercises/,
  /\/api\/v1\/exercises\/categories/,
];

// Video file extensions
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

// =============================================================================
// INSTALL EVENT
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        // Don't fail installation if some assets fail to cache
        return Promise.allSettled(
          STATIC_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`[Service Worker] Failed to cache ${asset}:`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
  );
});

// =============================================================================
// ACTIVATE EVENT
// =============================================================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches
              return cacheName.startsWith('chiroclickcrm-') &&
                     cacheName !== STATIC_CACHE &&
                     cacheName !== DATA_CACHE &&
                     cacheName !== VIDEO_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// =============================================================================
// FETCH EVENT
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (they'll be handled by sync queue)
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle video requests
  if (isVideoRequest(url)) {
    event.respondWith(handleVideoRequest(request));
    return;
  }

  // Handle static assets and navigation
  event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API requests - Network first, fallback to cache
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this is a cacheable API endpoint
  const isCacheable = CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses for cacheable endpoints
    if (networkResponse.ok && isCacheable) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed for API, checking cache:', url.pathname);

    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Returning cached API response');
      return cachedResponse;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        message: 'Du er frakoblet. Data er ikke tilgjengelig offline.',
        messageEn: 'You are offline. Data is not available offline.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle video requests - Cache first for cached videos
 */
async function handleVideoRequest(request) {
  // Check cache first for videos (they're large, so we cache-first)
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[Service Worker] Returning cached video');
    return cachedResponse;
  }

  // Try network
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Video not available offline');

    // Return offline placeholder response
    return new Response(
      'Video ikke tilgjengelig offline',
      {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}

/**
 * Handle static requests - Stale-while-revalidate
 */
async function handleStaticRequest(request) {
  const url = new URL(request.url);

  // For navigation requests, serve index.html (SPA)
  if (request.mode === 'navigate') {
    const cachedIndex = await caches.match('/index.html');

    // Try network first for navigation
    try {
      const networkResponse = await fetch(request);
      return networkResponse;
    } catch (error) {
      // Offline - serve cached index.html
      if (cachedIndex) {
        console.log('[Service Worker] Serving cached index.html for navigation');
        return cachedIndex;
      }
    }
  }

  // For other static assets, use stale-while-revalidate
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      // Update cache with new response
      if (networkResponse.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed, will use cache
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Nothing available - return offline page for HTML requests
  if (request.headers.get('Accept')?.includes('text/html')) {
    return caches.match('/index.html');
  }

  return new Response('Not available offline', { status: 503 });
}

/**
 * Check if request is for a video file
 */
function isVideoRequest(url) {
  const path = url.pathname.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

// =============================================================================
// BACKGROUND SYNC
// =============================================================================

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);

  if (event.tag === 'sync-exercise-progress') {
    event.waitUntil(syncExerciseProgress());
  }
});

/**
 * Sync exercise progress from IndexedDB queue
 */
async function syncExerciseProgress() {
  console.log('[Service Worker] Syncing exercise progress...');

  try {
    // Open IndexedDB
    const db = await openDB();
    const tx = db.transaction('sync-queue', 'readonly');
    const store = tx.objectStore('sync-queue');
    const items = await getAllFromStore(store);

    if (items.length === 0) {
      console.log('[Service Worker] No items to sync');
      return;
    }

    console.log(`[Service Worker] Syncing ${items.length} items`);

    // Process each item
    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body ? JSON.stringify(item.body) : undefined
        });

        if (response.ok) {
          // Remove from queue
          const deleteTx = db.transaction('sync-queue', 'readwrite');
          const deleteStore = deleteTx.objectStore('sync-queue');
          await deleteFromStore(deleteStore, item.id);
          console.log(`[Service Worker] Synced item ${item.id}`);

          // Notify clients
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                itemId: item.id
              });
            });
          });
        }
      } catch (error) {
        console.error(`[Service Worker] Failed to sync item ${item.id}:`, error);
      }
    }

    console.log('[Service Worker] Sync complete');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// =============================================================================
// MESSAGE HANDLING
// =============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_VIDEO':
      cacheVideo(payload.url);
      break;

    case 'REMOVE_CACHED_VIDEO':
      removeCachedVideo(payload.url);
      break;

    case 'CACHE_EXERCISE_DATA':
      cacheExerciseData(payload);
      break;

    case 'CLEAR_CACHE':
      clearAllCaches();
      break;

    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.source.postMessage({
          type: 'CACHE_STATUS',
          payload: status
        });
      });
      break;
  }
});

/**
 * Cache a video for offline use
 */
async function cacheVideo(url) {
  console.log('[Service Worker] Caching video:', url);

  try {
    const cache = await caches.open(VIDEO_CACHE);
    const response = await fetch(url);

    if (response.ok) {
      await cache.put(url, response);
      console.log('[Service Worker] Video cached successfully');

      // Notify clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'VIDEO_CACHED',
            payload: { url }
          });
        });
      });
    }
  } catch (error) {
    console.error('[Service Worker] Failed to cache video:', error);

    // Notify clients of failure
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'VIDEO_CACHE_FAILED',
          payload: { url, error: error.message }
        });
      });
    });
  }
}

/**
 * Remove a cached video
 */
async function removeCachedVideo(url) {
  console.log('[Service Worker] Removing cached video:', url);

  try {
    const cache = await caches.open(VIDEO_CACHE);
    await cache.delete(url);
    console.log('[Service Worker] Video removed from cache');
  } catch (error) {
    console.error('[Service Worker] Failed to remove video:', error);
  }
}

/**
 * Cache exercise data for offline use
 */
async function cacheExerciseData(data) {
  console.log('[Service Worker] Caching exercise data');

  try {
    const cache = await caches.open(DATA_CACHE);

    // Create a Response object from the data
    const response = new Response(JSON.stringify(data.response), {
      headers: { 'Content-Type': 'application/json' }
    });

    await cache.put(data.url, response);
    console.log('[Service Worker] Exercise data cached');
  } catch (error) {
    console.error('[Service Worker] Failed to cache exercise data:', error);
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  console.log('[Service Worker] Clearing all caches');

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('chiroclickcrm-'))
      .map((name) => caches.delete(name))
  );

  console.log('[Service Worker] All caches cleared');
}

/**
 * Get cache status for UI
 */
async function getCacheStatus() {
  const status = {
    staticCached: false,
    dataCached: false,
    cachedVideos: []
  };

  try {
    const staticCache = await caches.open(STATIC_CACHE);
    const staticKeys = await staticCache.keys();
    status.staticCached = staticKeys.length > 0;

    const dataCache = await caches.open(DATA_CACHE);
    const dataKeys = await dataCache.keys();
    status.dataCached = dataKeys.length > 0;

    const videoCache = await caches.open(VIDEO_CACHE);
    const videoKeys = await videoCache.keys();
    status.cachedVideos = videoKeys.map((request) => request.url);
  } catch (error) {
    console.error('[Service Worker] Failed to get cache status:', error);
  }

  return status;
}

// =============================================================================
// INDEXEDDB HELPERS
// =============================================================================

const DB_NAME = 'ChiroClickOffline';
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Sync queue store
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id' });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(store, key) {
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// =============================================================================
// PUSH NOTIFICATIONS (Future Enhancement)
// =============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'Husk ovelsene dine i dag!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'exercise-reminder',
      data: {
        url: data.url || '/portal/mine-ovelser'
      }
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'ChiroClick - Treningspaminnelse',
        options
      )
    );
  } catch (error) {
    console.error('[Service Worker] Push notification error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/portal/mine-ovelser';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if a window is already open
      for (const client of clients) {
        if (client.url.includes('/portal') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
