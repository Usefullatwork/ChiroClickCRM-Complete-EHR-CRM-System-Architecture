/**
 * useOffline Hook
 *
 * Comprehensive hook for managing offline functionality in the Patient Portal.
 * Provides:
 * - Online/offline status detection
 * - Service worker management
 * - Sync queue status
 * - Video caching controls
 * - Offline data management
 *
 * Bilingual: English/Norwegian
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  cachePrescription,
  getCachedPrescription,
  getCachedPrescriptionsByToken,
  getAllCachedVideos,
  getCachedVideoSize,
  isVideoCached,
  trackCachedVideo,
  removeCachedVideoTracking,
  saveProgress,
  getTodaysProgress,
  getStorageStats,
  saveSetting,
  getSetting,
  clearAllOfflineData,
} from '../utils/offlineStorage';
import {
  processSyncQueue,
  getSyncQueueStats,
  queueExerciseProgress,
  enableAutoSync,
  _SYNC_TYPES,
} from '../utils/syncQueue';
import logger from '../utils/logger';

const log = logger.scope('Offline');

// =============================================================================
// CONSTANTS
// =============================================================================

const SERVICE_WORKER_PATH = '/service-worker.js';
const SYNC_DEBOUNCE_MS = 2000;

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * useOffline Hook
 *
 * @param {object} options
 * @param {string} options.token - Portal access token (for data fetching)
 * @param {boolean} options.autoSync - Enable automatic sync when coming online
 * @param {function} options.onSyncStart - Callback when sync starts
 * @param {function} options.onSyncComplete - Callback when sync completes
 * @param {function} options.onSyncError - Callback when sync fails
 * @param {function} options.onOffline - Callback when going offline
 * @param {function} options.onOnline - Callback when coming online
 * @returns {object} Offline state and functions
 */
export function useOffline(options = {}) {
  const {
    token,
    autoSync = true,
    onSyncStart,
    onSyncComplete,
    onSyncError,
    onOffline,
    onOnline,
  } = options;

  // =============================================================================
  // STATE
  // =============================================================================

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [_swRegistration, setSwRegistration] = useState(null);
  const [swReady, setSwReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'success', 'error', null
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [cachedVideoCount, setCachedVideoCount] = useState(0);
  const [cachedVideoSize, setCachedVideoSize] = useState(0);
  const [storageStats, setStorageStats] = useState(null);

  // Refs
  const syncTimeoutRef = useRef(null);
  const autoSyncCleanupRef = useRef(null);

  // =============================================================================
  // SERVICE WORKER REGISTRATION
  // =============================================================================

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register(SERVICE_WORKER_PATH)
        .then((registration) => {
          log.debug(' Service worker registered');
          setSwRegistration(registration);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  log.debug(' New service worker available');
                }
              });
            }
          });
        })
        .catch((error) => {
          log.error(' Service worker registration failed:', error);
        });

      // Wait for service worker to be ready
      navigator.serviceWorker.ready.then(() => {
        log.debug(' Service worker ready');
        setSwReady(true);
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleSwMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle messages from service worker
  const handleSwMessage = useCallback((event) => {
    const { type, payload } = event.data || {};

    switch (type) {
      case 'SYNC_SUCCESS':
        log.debug(' Sync success for item:', payload?.itemId);
        updatePendingCount();
        break;

      case 'VIDEO_CACHED':
        log.debug(' Video cached:', payload?.url);
        updateCachedVideoStats();
        break;

      case 'VIDEO_CACHE_FAILED':
        log.error(' Video cache failed:', payload?.url, payload?.error);
        break;

      case 'CACHE_STATUS':
        log.debug(' Cache status:', payload);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============================================================================
  // ONLINE/OFFLINE DETECTION
  // =============================================================================

  useEffect(() => {
    const handleOnline = () => {
      log.debug(' Now online');
      setIsOnline(true);
      setSyncStatus(null);

      if (onOnline) {
        onOnline();
      }

      // Debounced sync
      if (autoSync) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          triggerSync();
        }, SYNC_DEBOUNCE_MS);
      }
    };

    const handleOffline = () => {
      log.debug(' Now offline');
      setIsOnline(false);

      if (onOffline) {
        onOffline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, onOnline, onOffline]);

  // =============================================================================
  // AUTO SYNC
  // =============================================================================

  useEffect(() => {
    if (autoSync) {
      autoSyncCleanupRef.current = enableAutoSync({
        onProgress: (current, total) => {
          log.debug('Sync progress', { current, total });
        },
        onItemComplete: (item, success) => {
          if (success) {
            updatePendingCount();
          }
        },
        onError: (item, error) => {
          log.error(' Sync error:', error);
        },
      });

      return () => {
        if (autoSyncCleanupRef.current) {
          autoSyncCleanupRef.current();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync]);

  // =============================================================================
  // STATS UPDATES
  // =============================================================================

  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    try {
      const stats = await getSyncQueueStats();
      setPendingSyncCount(stats.pending);
    } catch (error) {
      log.error(' Error getting sync stats:', error);
    }
  }, []);

  // Update cached video stats
  const updateCachedVideoStats = useCallback(async () => {
    try {
      const videos = await getAllCachedVideos();
      const size = await getCachedVideoSize();
      setCachedVideoCount(videos.length);
      setCachedVideoSize(size);
    } catch (error) {
      log.error(' Error getting video stats:', error);
    }
  }, []);

  // Update all storage stats
  const updateStorageStats = useCallback(async () => {
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
      setPendingSyncCount(stats.unsyncedProgress + stats.pendingSyncItems);
      setCachedVideoCount(stats.cachedVideos);
    } catch (error) {
      log.error(' Error getting storage stats:', error);
    }
  }, []);

  // Initial stats load
  useEffect(() => {
    updateStorageStats();

    // Get last sync time from storage
    getSetting('lastSyncTime').then((time) => {
      if (time) {
        setLastSyncTime(new Date(time));
      }
    });
  }, [updateStorageStats]);

  // =============================================================================
  // SYNC FUNCTIONS
  // =============================================================================

  /**
   * Trigger a manual sync
   */
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      log.debug(' Cannot sync - offline');
      return { success: false, reason: 'offline' };
    }

    if (isSyncing) {
      log.debug(' Sync already in progress');
      return { success: false, reason: 'in_progress' };
    }

    setIsSyncing(true);
    setSyncStatus(null);

    if (onSyncStart) {
      onSyncStart();
    }

    try {
      const result = await processSyncQueue({
        onProgress: (current, total) => {
          log.debug('Sync progress', { current, total });
        },
      });

      const now = new Date();
      setLastSyncTime(now);
      await saveSetting('lastSyncTime', now.toISOString());

      if (result.failed > 0) {
        setSyncStatus('error');
        if (onSyncError) {
          onSyncError(new Error(`${result.failed} items failed to sync`));
        }
      } else {
        setSyncStatus('success');
        if (onSyncComplete) {
          onSyncComplete(result);
        }
      }

      await updatePendingCount();

      return { success: true, result };
    } catch (error) {
      log.error(' Sync failed:', error);
      setSyncStatus('error');

      if (onSyncError) {
        onSyncError(error);
      }

      return { success: false, error };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, onSyncStart, onSyncComplete, onSyncError, updatePendingCount]);

  // =============================================================================
  // DATA CACHING FUNCTIONS
  // =============================================================================

  /**
   * Cache a prescription for offline use
   */
  const cachePrescriptionOffline = useCallback(
    async (prescriptionData) => {
      if (!token) {
        log.error(' No token provided');
        return false;
      }

      try {
        await cachePrescription(token, prescriptionData);
        await updateStorageStats();
        return true;
      } catch (error) {
        log.error(' Error caching prescription:', error);
        return false;
      }
    },
    [token, updateStorageStats]
  );

  /**
   * Get cached prescription data
   */
  const getCachedPrescriptionData = useCallback(async (prescriptionId) => {
    try {
      return await getCachedPrescription(prescriptionId);
    } catch (error) {
      log.error(' Error getting cached prescription:', error);
      return null;
    }
  }, []);

  /**
   * Get all cached prescriptions for current token
   */
  const getCachedPrescriptions = useCallback(async () => {
    if (!token) {
      return [];
    }

    try {
      return await getCachedPrescriptionsByToken(token);
    } catch (error) {
      log.error(' Error getting cached prescriptions:', error);
      return [];
    }
  }, [token]);

  // =============================================================================
  // VIDEO CACHING FUNCTIONS
  // =============================================================================

  /**
   * Cache a video for offline use
   */
  const cacheVideo = useCallback(
    async (url, exerciseId) => {
      if (!swReady || !navigator.serviceWorker.controller) {
        log.warn(' Service worker not ready');
        return false;
      }

      try {
        // Send message to service worker to cache video
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_VIDEO',
          payload: { url },
        });

        // Track in IndexedDB
        // Size will be updated when video is actually cached
        await trackCachedVideo(url, exerciseId, 0);
        await updateCachedVideoStats();

        return true;
      } catch (error) {
        log.error(' Error caching video:', error);
        return false;
      }
    },
    [swReady, updateCachedVideoStats]
  );

  /**
   * Remove a cached video
   */
  const removeCachedVideo = useCallback(
    async (url) => {
      if (!swReady || !navigator.serviceWorker.controller) {
        return false;
      }

      try {
        // Send message to service worker to remove video
        navigator.serviceWorker.controller.postMessage({
          type: 'REMOVE_CACHED_VIDEO',
          payload: { url },
        });

        // Remove from tracking
        await removeCachedVideoTracking(url);
        await updateCachedVideoStats();

        return true;
      } catch (error) {
        log.error(' Error removing cached video:', error);
        return false;
      }
    },
    [swReady, updateCachedVideoStats]
  );

  /**
   * Check if a video is cached
   */
  const checkVideoCached = useCallback(async (url) => {
    try {
      return await isVideoCached(url);
    } catch (error) {
      log.error(' Error checking video cache:', error);
      return false;
    }
  }, []);

  // =============================================================================
  // PROGRESS TRACKING FUNCTIONS
  // =============================================================================

  /**
   * Record exercise progress (works offline)
   */
  const recordExerciseProgress = useCallback(
    async (prescriptionId, exerciseId, progressData) => {
      try {
        // Save locally first
        await saveProgress({
          prescriptionId,
          exerciseId,
          ...progressData,
        });

        // If online, queue for sync
        if (isOnline && token) {
          await queueExerciseProgress(token, prescriptionId, exerciseId, progressData);
          // Trigger sync after a delay
          setTimeout(() => triggerSync(), 1000);
        } else {
          // Queue for later sync
          await queueExerciseProgress(token, prescriptionId, exerciseId, progressData);
          await updatePendingCount();
        }

        return true;
      } catch (error) {
        log.error(' Error recording progress:', error);
        return false;
      }
    },
    [isOnline, token, triggerSync, updatePendingCount]
  );

  /**
   * Get today's progress for a prescription
   */
  const getTodayProgress = useCallback(async (prescriptionId) => {
    try {
      return await getTodaysProgress(prescriptionId);
    } catch (error) {
      log.error(' Error getting today progress:', error);
      return [];
    }
  }, []);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Clear all offline data
   */
  const clearOfflineData = useCallback(async () => {
    try {
      await clearAllOfflineData();

      // Clear service worker caches
      if (swReady && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE',
        });
      }

      await updateStorageStats();
      return true;
    } catch (error) {
      log.error(' Error clearing offline data:', error);
      return false;
    }
  }, [swReady, updateStorageStats]);

  /**
   * Get cache status from service worker
   */
  const getCacheStatus = useCallback(() => {
    if (!swReady || !navigator.serviceWorker.controller) {
      return null;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'GET_CACHE_STATUS',
    });
  }, [swReady]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // Status
    isOnline,
    isOffline: !isOnline,
    swReady,
    isSyncing,
    syncStatus,
    lastSyncTime,
    pendingSyncCount,
    cachedVideoCount,
    cachedVideoSize,
    storageStats,

    // Sync functions
    triggerSync,

    // Data caching
    cachePrescriptionOffline,
    getCachedPrescriptionData,
    getCachedPrescriptions,

    // Video caching
    cacheVideo,
    removeCachedVideo,
    checkVideoCached,

    // Progress tracking
    recordExerciseProgress,
    getTodayProgress,

    // Utilities
    clearOfflineData,
    getCacheStatus,
    updateStorageStats,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useOffline;
