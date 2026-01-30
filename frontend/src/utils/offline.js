/**
 * Offline Utilities Index
 *
 * Central export point for all offline-related functionality.
 * Use this to import offline utilities in a clean way:
 *
 * import { useOffline, offlineStorage, syncQueue } from '@/utils/offline';
 *
 * Or import specific functions:
 *
 * import {
 *   cachePrescription,
 *   queueExerciseProgress,
 *   triggerSync
 * } from '@/utils/offline';
 */

// =============================================================================
// OFFLINE STORAGE
// =============================================================================

export {
  openDatabase,
  closeDatabase,
  cachePrescription,
  getCachedPrescription,
  getCachedPrescriptionsByToken,
  getAllCachedPrescriptions,
  removeCachedPrescription,
  getCachedExercise,
  getExercisesByPrescription,
  saveProgress,
  getUnsyncedProgress,
  markProgressSynced,
  getProgressForExercise,
  getTodaysProgress,
  trackCachedVideo,
  removeCachedVideoTracking,
  getAllCachedVideos,
  isVideoCached,
  getCachedVideoSize,
  saveSetting,
  getSetting,
  deleteSetting,
  clearAllOfflineData,
  getStorageStats,
  isIndexedDBAvailable,
  STORES
} from './offlineStorage';

// Default export as namespace
import * as offlineStorage from './offlineStorage';
export { offlineStorage };

// =============================================================================
// SYNC QUEUE
// =============================================================================

export {
  SYNC_TYPES,
  addToSyncQueue,
  getPendingItems,
  getAllQueueItems,
  updateQueueItem,
  removeFromQueue,
  clearCompletedItems,
  clearQueue,
  processSyncQueue,
  queueExerciseProgress,
  queueExerciseFeedback,
  getSyncQueueStats,
  hasPendingSync,
  enableAutoSync,
  triggerSync
} from './syncQueue';

// Default export as namespace
import * as syncQueue from './syncQueue';
export { syncQueue };

// =============================================================================
// HOOK EXPORT
// =============================================================================

export { useOffline } from '../hooks/useOffline';

// =============================================================================
// SERVICE WORKER HELPERS
// =============================================================================

/**
 * Register the service worker
 * Call this in your app's main entry point (main.jsx or App.jsx)
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[Offline] Service worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour

      return registration;
    } catch (error) {
      console.error('[Offline] Service worker registration failed:', error);
      return null;
    }
  }

  console.warn('[Offline] Service workers not supported');
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
    console.log('[Offline] Service workers unregistered');
  }
}

/**
 * Send a message to the service worker
 * @param {object} message - Message to send
 */
export function sendMessageToSW(message) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Request to cache a video via service worker
 * @param {string} url - Video URL
 */
export function requestVideoCaching(url) {
  sendMessageToSW({
    type: 'CACHE_VIDEO',
    payload: { url }
  });
}

/**
 * Request to remove a cached video
 * @param {string} url - Video URL
 */
export function requestVideoRemoval(url) {
  sendMessageToSW({
    type: 'REMOVE_CACHED_VIDEO',
    payload: { url }
  });
}

/**
 * Request cache status from service worker
 */
export function requestCacheStatus() {
  sendMessageToSW({ type: 'GET_CACHE_STATUS' });
}

/**
 * Request to clear all caches
 */
export function requestCacheClear() {
  sendMessageToSW({ type: 'CLEAR_CACHE' });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if the browser supports offline functionality
 * @returns {object} Support status for various features
 */
export function checkOfflineSupport() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    cacheAPI: 'caches' in window,
    backgroundSync: 'SyncManager' in window,
    pushNotifications: 'PushManager' in window,
    onlineDetection: 'onLine' in navigator
  };
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if currently online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Check if currently offline
 * @returns {boolean}
 */
export function isOffline() {
  return !navigator.onLine;
}
