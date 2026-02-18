/**
 * PWA Hook
 *
 * Manages Progressive Web App functionality:
 * - Service worker registration
 * - Install prompt handling
 * - Online/offline status
 * - Background sync
 * - Update notifications
 *
 * Bilingual: English/Norwegian
 */

import { useState, useEffect, useCallback } from 'react';

import logger from '../utils/logger';
// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  en: {
    installPrompt: 'Install ChiroClick for quick access',
    install: 'Install',
    later: 'Later',
    offline: 'You are offline',
    online: 'Back online',
    updateAvailable: 'Update available',
    update: 'Update Now',
    dismiss: 'Dismiss',
    syncing: 'Syncing...',
    syncComplete: 'Sync complete',
    syncFailed: 'Sync failed',
  },
  no: {
    installPrompt: 'Installer ChiroClick for rask tilgang',
    install: 'Installer',
    later: 'Senere',
    offline: 'Du er frakoblet',
    online: 'Tilbake online',
    updateAvailable: 'Oppdatering tilgjengelig',
    update: 'Oppdater nå',
    dismiss: 'Avvis',
    syncing: 'Synkroniserer...',
    syncComplete: 'Synkronisering fullført',
    syncFailed: 'Synkronisering feilet',
  },
};

// =============================================================================
// SERVICE WORKER REGISTRATION
// =============================================================================

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      logger.debug('[PWA] Service worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000
      ); // Every hour

      return registration;
    } catch (error) {
      logger.error('[PWA] Service worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    logger.debug('[PWA] Service workers unregistered');
  }
}

// =============================================================================
// PWA HOOK
// =============================================================================

export function usePWA(lang = 'en') {
  const t = TRANSLATIONS[lang];

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Check if already installed
  useEffect(() => {
    // Check if running as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);
  }, []);

  // Register service worker
  useEffect(() => {
    registerServiceWorker().then((reg) => {
      setRegistration(reg);

      if (reg) {
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      }
    });
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger background sync
      if (registration && 'sync' in registration) {
        registration.sync.register('sync-appointments');
        registration.sync.register('sync-notes');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registration]);

  // Install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install the PWA
  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  }, [deferredPrompt]);

  // Apply update
  const applyUpdate = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Dismiss install prompt
  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  }, []);

  // Check if we should show install prompt
  const shouldShowInstall = useCallback(() => {
    if (!isInstallable || isInstalled) {
      return false;
    }

    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      return daysSinceDismissed > 7;
    }

    return true;
  }, [isInstallable, isInstalled]);

  return {
    // Status
    isOnline,
    isOffline: !isOnline,
    isInstallable,
    isInstalled,
    updateAvailable,
    shouldShowInstall: shouldShowInstall(),

    // Actions
    install,
    dismissInstall,
    applyUpdate,

    // Translations
    t,
  };
}

// =============================================================================
// OFFLINE STORAGE HELPERS
// =============================================================================

const DB_NAME = 'ChiroClickOffline';
const DB_VERSION = 1;

/**
 * Open IndexedDB database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Pending appointments store
      if (!db.objectStoreNames.contains('pending-appointments')) {
        db.createObjectStore('pending-appointments', { keyPath: 'id' });
      }

      // Pending notes store
      if (!db.objectStoreNames.contains('pending-notes')) {
        db.createObjectStore('pending-notes', { keyPath: 'id' });
      }

      // Cached patients store
      if (!db.objectStoreNames.contains('cached-patients')) {
        const store = db.createObjectStore('cached-patients', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Save item to offline storage
 */
export async function saveOffline(storeName, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get item from offline storage
 */
export async function getOffline(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items from offline storage
 */
export async function getAllOffline(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete item from offline storage
 */
export async function deleteOffline(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items from a store
 */
export async function clearOffline(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// OFFLINE-FIRST API WRAPPER
// =============================================================================

/**
 * Offline-first fetch wrapper
 * Tries network first, falls back to cache, queues writes for sync
 */
export async function offlineFetch(url, options = {}) {
  const { method = 'GET', body, offlineKey } = options;

  // For GET requests, try network then cache
  if (method === 'GET') {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        // Update cache
        const data = await response.json();
        if (offlineKey) {
          await saveOffline('cached-patients', { id: offlineKey, data, timestamp: Date.now() });
        }
        return data;
      }
    } catch (error) {
      // Network failed, try cache
      if (offlineKey) {
        const cached = await getOffline('cached-patients', offlineKey);
        if (cached) {
          return cached.data;
        }
      }
      throw error;
    }
  }

  // For write operations, queue for sync if offline
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!navigator.onLine) {
      // Queue for background sync
      const pendingItem = {
        id: `${Date.now()}-${Math.random()}`,
        url,
        method,
        body,
        timestamp: Date.now(),
      };

      const storeName = url.includes('/appointments') ? 'pending-appointments' : 'pending-notes';

      await saveOffline(storeName, pendingItem);

      // Request background sync
      if ('serviceWorker' in navigator && 'sync' in window.SyncManager) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(`sync-${storeName.replace('pending-', '')}`);
      }

      return { queued: true, id: pendingItem.id };
    }

    // Online, proceed normally
    return fetch(url, options).then((r) => r.json());
  }

  return fetch(url, options).then((r) => r.json());
}

// =============================================================================
// EXPORTS
// =============================================================================

export default usePWA;
