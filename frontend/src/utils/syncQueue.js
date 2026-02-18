/**
 * Sync Queue Utility
 *
 * Manages a queue for syncing offline changes when the user comes back online.
 * Handles:
 * - Exercise completion logs
 * - Progress updates
 * - Feedback submissions
 *
 * Uses IndexedDB for persistence and Background Sync API when available.
 *
 * Bilingual: English/Norwegian
 */

import { openDatabase, STORES } from './offlineStorage';

import logger from '../utils/logger';
// =============================================================================
// QUEUE ITEM TYPES
// =============================================================================

export const SYNC_TYPES = {
  EXERCISE_PROGRESS: 'exercise-progress',
  FEEDBACK: 'feedback',
  PRESCRIPTION_VIEW: 'prescription-view',
};

// =============================================================================
// QUEUE MANAGEMENT
// =============================================================================

/**
 * Add an item to the sync queue
 * @param {object} item - Item to queue
 * @param {string} item.type - Type of sync item (SYNC_TYPES)
 * @param {string} item.url - API endpoint URL
 * @param {string} item.method - HTTP method
 * @param {object} item.body - Request body
 * @param {object} item.headers - Request headers
 * @param {object} item.metadata - Additional metadata
 * @returns {Promise<string>} Queue item ID
 */
export async function addToSyncQueue(item) {
  const db = await openDatabase();

  const queueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...item,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastAttempt: null,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.put(queueItem);

    request.onsuccess = () => {
      logger.debug(`[SyncQueue] Added item ${queueItem.id} to queue`);

      // Request background sync if available
      requestBackgroundSync();

      resolve(queueItem.id);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending items in the sync queue
 * @returns {Promise<object[]>} Pending queue items
 */
export async function getPendingItems() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result.filter((item) => item.status === 'pending');
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items in the sync queue (including processed)
 * @returns {Promise<object[]>} All queue items
 */
export async function getAllQueueItems() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update a queue item's status
 * @param {string} id - Queue item ID
 * @param {string} status - New status ('pending', 'processing', 'completed', 'failed')
 * @param {object} additionalData - Additional data to merge
 * @returns {Promise<void>}
 */
export async function updateQueueItem(id, status, additionalData = {}) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        const updatedItem = {
          ...item,
          ...additionalData,
          status,
          lastAttempt: new Date().toISOString(),
          attempts: item.attempts + 1,
        };

        const putRequest = store.put(updatedItem);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Remove an item from the sync queue
 * @param {string} id - Queue item ID
 * @returns {Promise<void>}
 */
export async function removeFromQueue(id) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.delete(id);

    request.onsuccess = () => {
      logger.debug(`[SyncQueue] Removed item ${id} from queue`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear completed items from the queue
 * @returns {Promise<number>} Number of items cleared
 */
export async function clearCompletedItems() {
  const _db = await openDatabase();
  const items = await getAllQueueItems();
  const completedItems = items.filter((item) => item.status === 'completed');

  for (const item of completedItems) {
    await removeFromQueue(item.id);
  }

  logger.debug(`[SyncQueue] Cleared ${completedItems.length} completed items`);
  return completedItems.length;
}

/**
 * Clear all items from the queue
 * @returns {Promise<void>}
 */
export async function clearQueue() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.clear();

    request.onsuccess = () => {
      logger.debug('[SyncQueue] Queue cleared');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// SYNC EXECUTION
// =============================================================================

/**
 * Process the sync queue
 * @param {object} options - Sync options
 * @param {function} options.onProgress - Progress callback (current, total)
 * @param {function} options.onItemComplete - Item complete callback (item, success)
 * @param {function} options.onError - Error callback (item, error)
 * @returns {Promise<object>} Sync result { synced, failed, remaining }
 */
export async function processSyncQueue(options = {}) {
  const { onProgress, onItemComplete, onError } = options;

  logger.debug('[SyncQueue] Processing sync queue...');

  const pendingItems = await getPendingItems();

  if (pendingItems.length === 0) {
    logger.debug('[SyncQueue] No pending items to sync');
    return { synced: 0, failed: 0, remaining: 0 };
  }

  logger.debug(`[SyncQueue] Found ${pendingItems.length} items to sync`);

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];

    if (onProgress) {
      onProgress(i + 1, pendingItems.length);
    }

    try {
      // Mark as processing
      await updateQueueItem(item.id, 'processing');

      // Execute the request
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...item.headers,
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (response.ok) {
        // Success - remove from queue
        await removeFromQueue(item.id);
        synced++;

        if (onItemComplete) {
          onItemComplete(item, true);
        }

        logger.debug(`[SyncQueue] Successfully synced item ${item.id}`);
      } else {
        // API error - mark as failed
        const errorData = await response.json().catch(() => ({}));

        await updateQueueItem(item.id, 'failed', {
          error: errorData.message || `HTTP ${response.status}`,
          statusCode: response.status,
        });
        failed++;

        if (onError) {
          onError(item, new Error(errorData.message || `HTTP ${response.status}`));
        }

        logger.error(`[SyncQueue] Failed to sync item ${item.id}:`, response.status);
      }
    } catch (error) {
      // Network error - keep in queue for retry
      if (item.attempts < 5) {
        await updateQueueItem(item.id, 'pending', {
          error: error.message,
        });
      } else {
        // Too many attempts - mark as failed
        await updateQueueItem(item.id, 'failed', {
          error: error.message,
        });
        failed++;
      }

      if (onError) {
        onError(item, error);
      }

      logger.error(`[SyncQueue] Error syncing item ${item.id}:`, error);
    }
  }

  const remaining = pendingItems.length - synced - failed;

  logger.debug(
    `[SyncQueue] Sync complete: ${synced} synced, ${failed} failed, ${remaining} remaining`
  );

  return { synced, failed, remaining };
}

/**
 * Request background sync via service worker
 */
async function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-exercise-progress');
      logger.debug('[SyncQueue] Background sync registered');
    } catch (error) {
      logger.warn('[SyncQueue] Background sync not available:', error);
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Queue an exercise progress update
 * @param {string} token - Portal access token
 * @param {string} prescriptionId - Prescription ID
 * @param {string} exerciseId - Exercise ID
 * @param {object} progressData - Progress data
 * @returns {Promise<string>} Queue item ID
 */
export async function queueExerciseProgress(token, prescriptionId, exerciseId, progressData) {
  const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api/v1';

  return addToSyncQueue({
    type: SYNC_TYPES.EXERCISE_PROGRESS,
    url: `${API_BASE}/patient-portal/${token}/prescriptions/${prescriptionId}/exercises/${exerciseId}/progress`,
    method: 'POST',
    body: progressData,
    headers: {},
    metadata: {
      prescriptionId,
      exerciseId,
      ...progressData,
    },
  });
}

/**
 * Queue exercise feedback
 * @param {string} token - Portal access token
 * @param {string} prescriptionId - Prescription ID
 * @param {string} exerciseId - Exercise ID
 * @param {object} feedbackData - Feedback data
 * @returns {Promise<string>} Queue item ID
 */
export async function queueExerciseFeedback(token, prescriptionId, exerciseId, feedbackData) {
  const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api/v1';

  return addToSyncQueue({
    type: SYNC_TYPES.FEEDBACK,
    url: `${API_BASE}/patient-portal/${token}/prescriptions/${prescriptionId}/exercises/${exerciseId}/feedback`,
    method: 'POST',
    body: feedbackData,
    headers: {},
    metadata: {
      prescriptionId,
      exerciseId,
      ...feedbackData,
    },
  });
}

// =============================================================================
// SYNC STATUS
// =============================================================================

/**
 * Get sync queue statistics
 * @returns {Promise<object>} Queue statistics
 */
export async function getSyncQueueStats() {
  const items = await getAllQueueItems();

  return {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    processing: items.filter((i) => i.status === 'processing').length,
    completed: items.filter((i) => i.status === 'completed').length,
    failed: items.filter((i) => i.status === 'failed').length,
    byType: items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    oldestPending:
      items
        .filter((i) => i.status === 'pending')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0]?.createdAt || null,
  };
}

/**
 * Check if there are pending items to sync
 * @returns {Promise<boolean>}
 */
export async function hasPendingSync() {
  const pending = await getPendingItems();
  return pending.length > 0;
}

// =============================================================================
// AUTO-SYNC ON ONLINE
// =============================================================================

let autoSyncEnabled = false;
let syncInProgress = false;

/**
 * Enable auto-sync when coming back online
 * @param {object} options - Sync options for processSyncQueue
 */
export function enableAutoSync(options = {}) {
  if (autoSyncEnabled) {
    return;
  }

  const handleOnline = async () => {
    if (syncInProgress) {
      return;
    }

    logger.debug('[SyncQueue] Online - starting auto-sync');
    syncInProgress = true;

    try {
      await processSyncQueue(options);
    } finally {
      syncInProgress = false;
    }
  };

  window.addEventListener('online', handleOnline);
  autoSyncEnabled = true;

  logger.debug('[SyncQueue] Auto-sync enabled');

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    autoSyncEnabled = false;
    logger.debug('[SyncQueue] Auto-sync disabled');
  };
}

/**
 * Manually trigger sync if online
 * @param {object} options - Sync options
 * @returns {Promise<object|null>} Sync result or null if offline
 */
export async function triggerSync(options = {}) {
  if (!navigator.onLine) {
    logger.debug('[SyncQueue] Cannot sync - offline');
    return null;
  }

  if (syncInProgress) {
    logger.debug('[SyncQueue] Sync already in progress');
    return null;
  }

  syncInProgress = true;

  try {
    return await processSyncQueue(options);
  } finally {
    syncInProgress = false;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
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
  triggerSync,
};
