/**
 * Offline Storage Utility
 *
 * IndexedDB wrapper for storing exercise data offline in the Patient Portal.
 * Handles:
 * - Exercise prescriptions and data
 * - Video caching preferences
 * - Offline progress queue
 * - User settings
 *
 * Bilingual: English/Norwegian
 */

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================

import logger from '../utils/logger';

const DB_NAME = 'ChiroClickOffline';
const DB_VERSION = 2;

const STORES = {
  EXERCISES: 'exercises',
  PRESCRIPTIONS: 'prescriptions',
  PROGRESS: 'progress',
  SYNC_QUEUE: 'sync-queue',
  CACHED_VIDEOS: 'cached-videos',
  SETTINGS: 'settings',
};

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

let dbInstance = null;

/**
 * Open and initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function openDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('[OfflineStorage] Database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      logger.debug('[OfflineStorage] Database opened successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      logger.debug('[OfflineStorage] Upgrading database...');

      // Exercises store - cache individual exercises
      if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
        const exercisesStore = db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
        exercisesStore.createIndex('category', 'category', { unique: false });
        exercisesStore.createIndex('prescriptionId', 'prescriptionId', { unique: false });
      }

      // Prescriptions store - cache prescription data
      if (!db.objectStoreNames.contains(STORES.PRESCRIPTIONS)) {
        const prescriptionsStore = db.createObjectStore(STORES.PRESCRIPTIONS, { keyPath: 'id' });
        prescriptionsStore.createIndex('token', 'token', { unique: false });
        prescriptionsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      // Progress store - locally completed exercises (before sync)
      if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.PROGRESS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        progressStore.createIndex('exerciseId', 'exerciseId', { unique: false });
        progressStore.createIndex('prescriptionId', 'prescriptionId', { unique: false });
        progressStore.createIndex('completedAt', 'completedAt', { unique: false });
        progressStore.createIndex('synced', 'synced', { unique: false });
      }

      // Sync queue - items waiting to be synced
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // Cached videos tracking
      if (!db.objectStoreNames.contains(STORES.CACHED_VIDEOS)) {
        const videosStore = db.createObjectStore(STORES.CACHED_VIDEOS, { keyPath: 'url' });
        videosStore.createIndex('exerciseId', 'exerciseId', { unique: false });
        videosStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        videosStore.createIndex('size', 'size', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    logger.debug('[OfflineStorage] Database closed');
  }
}

// =============================================================================
// GENERIC CRUD OPERATIONS
// =============================================================================

/**
 * Save an item to a store
 * @param {string} storeName - Store name
 * @param {object} item - Item to save
 * @returns {Promise<any>} Saved item key
 */
async function saveItem(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get an item from a store by key
 * @param {string} storeName - Store name
 * @param {any} key - Item key
 * @returns {Promise<any>} Retrieved item
 */
async function getItem(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items from a store
 * @param {string} storeName - Store name
 * @returns {Promise<any[]>} All items
 */
async function getAllItems(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get items by index
 * @param {string} storeName - Store name
 * @param {string} indexName - Index name
 * @param {any} value - Index value
 * @returns {Promise<any[]>} Matching items
 */
async function getItemsByIndex(storeName, indexName, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an item from a store
 * @param {string} storeName - Store name
 * @param {any} key - Item key
 * @returns {Promise<void>}
 */
async function deleteItem(storeName, key) {
  const db = await openDatabase();
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
 * @param {string} storeName - Store name
 * @returns {Promise<void>}
 */
async function clearStore(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// PRESCRIPTION STORAGE
// =============================================================================

/**
 * Cache a prescription with its exercises for offline use
 * @param {string} token - Portal access token
 * @param {object} prescriptionData - Prescription data from API
 * @returns {Promise<void>}
 */
export async function cachePrescription(token, prescriptionData) {
  const { prescription, exercises } = prescriptionData;

  // Save prescription
  await saveItem(STORES.PRESCRIPTIONS, {
    id: prescription.id,
    token,
    data: prescriptionData,
    cachedAt: new Date().toISOString(),
  });

  // Save individual exercises
  if (exercises?.length > 0) {
    for (const exercise of exercises) {
      await saveItem(STORES.EXERCISES, {
        ...exercise,
        prescriptionId: prescription.id,
        cachedAt: new Date().toISOString(),
      });
    }
  }

  logger.debug(
    `[OfflineStorage] Cached prescription ${prescription.id} with ${exercises?.length || 0} exercises`
  );
}

/**
 * Get cached prescription by ID
 * @param {string} prescriptionId - Prescription ID
 * @returns {Promise<object|null>} Cached prescription data
 */
export async function getCachedPrescription(prescriptionId) {
  const cached = await getItem(STORES.PRESCRIPTIONS, prescriptionId);
  return cached?.data || null;
}

/**
 * Get cached prescription by token
 * @param {string} token - Portal access token
 * @returns {Promise<object[]>} Cached prescriptions
 */
export async function getCachedPrescriptionsByToken(token) {
  const prescriptions = await getItemsByIndex(STORES.PRESCRIPTIONS, 'token', token);
  return prescriptions.map((p) => p.data);
}

/**
 * Get all cached prescriptions
 * @returns {Promise<object[]>} All cached prescriptions
 */
export async function getAllCachedPrescriptions() {
  const prescriptions = await getAllItems(STORES.PRESCRIPTIONS);
  return prescriptions.map((p) => p.data);
}

/**
 * Remove a cached prescription
 * @param {string} prescriptionId - Prescription ID
 * @returns {Promise<void>}
 */
export async function removeCachedPrescription(prescriptionId) {
  // Remove prescription
  await deleteItem(STORES.PRESCRIPTIONS, prescriptionId);

  // Remove associated exercises
  const exercises = await getItemsByIndex(STORES.EXERCISES, 'prescriptionId', prescriptionId);
  for (const exercise of exercises) {
    await deleteItem(STORES.EXERCISES, exercise.id);
  }

  logger.debug(`[OfflineStorage] Removed cached prescription ${prescriptionId}`);
}

// =============================================================================
// EXERCISE STORAGE
// =============================================================================

/**
 * Get a cached exercise by ID
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<object|null>} Cached exercise
 */
export async function getCachedExercise(exerciseId) {
  return getItem(STORES.EXERCISES, exerciseId);
}

/**
 * Get all exercises for a prescription
 * @param {string} prescriptionId - Prescription ID
 * @returns {Promise<object[]>} Exercises
 */
export async function getExercisesByPrescription(prescriptionId) {
  return getItemsByIndex(STORES.EXERCISES, 'prescriptionId', prescriptionId);
}

// =============================================================================
// PROGRESS STORAGE
// =============================================================================

/**
 * Save exercise progress locally
 * @param {object} progressData - Progress data
 * @returns {Promise<number>} Progress record ID
 */
export async function saveProgress(progressData) {
  const record = {
    ...progressData,
    completedAt: new Date().toISOString(),
    synced: false,
  };

  const id = await saveItem(STORES.PROGRESS, record);
  logger.debug(`[OfflineStorage] Saved progress record ${id}`);
  return id;
}

/**
 * Get all unsynced progress records
 * @returns {Promise<object[]>} Unsynced progress records
 */
export async function getUnsyncedProgress() {
  return getItemsByIndex(STORES.PROGRESS, 'synced', false);
}

/**
 * Mark progress record as synced
 * @param {number} id - Progress record ID
 * @returns {Promise<void>}
 */
export async function markProgressSynced(id) {
  const record = await getItem(STORES.PROGRESS, id);
  if (record) {
    record.synced = true;
    record.syncedAt = new Date().toISOString();
    await saveItem(STORES.PROGRESS, record);
  }
}

/**
 * Get progress for a specific exercise on a specific day
 * @param {string} exerciseId - Exercise ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<object[]>} Progress records
 */
export async function getProgressForExercise(exerciseId, date) {
  const allProgress = await getItemsByIndex(STORES.PROGRESS, 'exerciseId', exerciseId);
  return allProgress.filter((p) => p.completedAt.startsWith(date));
}

/**
 * Get today's progress for all exercises in a prescription
 * @param {string} prescriptionId - Prescription ID
 * @returns {Promise<object[]>} Today's progress
 */
export async function getTodaysProgress(prescriptionId) {
  const today = new Date().toISOString().split('T')[0];
  const allProgress = await getItemsByIndex(STORES.PROGRESS, 'prescriptionId', prescriptionId);
  return allProgress.filter((p) => p.completedAt.startsWith(today));
}

// =============================================================================
// VIDEO CACHING
// =============================================================================

/**
 * Track a cached video
 * @param {string} url - Video URL
 * @param {string} exerciseId - Exercise ID
 * @param {number} size - File size in bytes
 * @returns {Promise<void>}
 */
export async function trackCachedVideo(url, exerciseId, size) {
  await saveItem(STORES.CACHED_VIDEOS, {
    url,
    exerciseId,
    size,
    cachedAt: new Date().toISOString(),
  });
  logger.debug(`[OfflineStorage] Tracked cached video: ${url}`);
}

/**
 * Remove video tracking
 * @param {string} url - Video URL
 * @returns {Promise<void>}
 */
export async function removeCachedVideoTracking(url) {
  await deleteItem(STORES.CACHED_VIDEOS, url);
}

/**
 * Get all cached videos
 * @returns {Promise<object[]>} Cached video records
 */
export async function getAllCachedVideos() {
  return getAllItems(STORES.CACHED_VIDEOS);
}

/**
 * Check if a video is cached
 * @param {string} url - Video URL
 * @returns {Promise<boolean>} Whether video is cached
 */
export async function isVideoCached(url) {
  const cached = await getItem(STORES.CACHED_VIDEOS, url);
  return !!cached;
}

/**
 * Get total cached video size
 * @returns {Promise<number>} Total size in bytes
 */
export async function getCachedVideoSize() {
  const videos = await getAllCachedVideos();
  return videos.reduce((total, video) => total + (video.size || 0), 0);
}

// =============================================================================
// SETTINGS
// =============================================================================

/**
 * Save a setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<void>}
 */
export async function saveSetting(key, value) {
  await saveItem(STORES.SETTINGS, { key, value });
}

/**
 * Get a setting
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @returns {Promise<any>} Setting value
 */
export async function getSetting(key, defaultValue = null) {
  const setting = await getItem(STORES.SETTINGS, key);
  return setting?.value ?? defaultValue;
}

/**
 * Delete a setting
 * @param {string} key - Setting key
 * @returns {Promise<void>}
 */
export async function deleteSetting(key) {
  await deleteItem(STORES.SETTINGS, key);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clear all offline data
 * @returns {Promise<void>}
 */
export async function clearAllOfflineData() {
  await clearStore(STORES.EXERCISES);
  await clearStore(STORES.PRESCRIPTIONS);
  await clearStore(STORES.PROGRESS);
  await clearStore(STORES.SYNC_QUEUE);
  await clearStore(STORES.CACHED_VIDEOS);
  logger.debug('[OfflineStorage] All offline data cleared');
}

/**
 * Get offline storage statistics
 * @returns {Promise<object>} Storage statistics
 */
export async function getStorageStats() {
  const prescriptions = await getAllItems(STORES.PRESCRIPTIONS);
  const exercises = await getAllItems(STORES.EXERCISES);
  const progress = await getAllItems(STORES.PROGRESS);
  const syncQueue = await getAllItems(STORES.SYNC_QUEUE);
  const cachedVideos = await getAllCachedVideos();
  const totalVideoSize = cachedVideos.reduce((sum, v) => sum + (v.size || 0), 0);

  return {
    prescriptions: prescriptions.length,
    exercises: exercises.length,
    progressRecords: progress.length,
    unsyncedProgress: progress.filter((p) => !p.synced).length,
    pendingSyncItems: syncQueue.length,
    cachedVideos: cachedVideos.length,
    totalVideoSizeMB: (totalVideoSize / (1024 * 1024)).toFixed(2),
    lastUpdated:
      prescriptions.length > 0
        ? prescriptions.sort((a, b) => new Date(b.cachedAt) - new Date(a.cachedAt))[0]?.cachedAt
        : null,
  };
}

/**
 * Check if IndexedDB is available
 * @returns {boolean}
 */
export function isIndexedDBAvailable() {
  return 'indexedDB' in window;
}

// =============================================================================
// EXPORT STORE NAMES FOR EXTERNAL USE
// =============================================================================

export { STORES };

export default {
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
  STORES,
};
