/* eslint-disable no-console */
/**
 * Exercise Sync Hook
 * Provides offline-first exercise data with IndexedDB caching and sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { exercisesAPI } from '../services/api';

// IndexedDB configuration
const DB_NAME = 'ChiroClickExercises';
const DB_VERSION = 1;

// Store names
const STORES = {
  EXERCISES: 'exercises',
  PRESCRIPTIONS: 'prescriptions',
  PENDING_COMPLIANCE: 'pendingCompliance',
  PENDING_PRESCRIPTIONS: 'pendingPrescriptions',
  SYNC_META: 'syncMeta',
};

/**
 * Initialize IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Exercise library cache
      if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
        const exerciseStore = db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
        exerciseStore.createIndex('code', 'code', { unique: false });
        exerciseStore.createIndex('category', 'category', { unique: false });
        exerciseStore.createIndex('body_region', 'body_region', { unique: false });
      }

      // Patient prescriptions cache
      if (!db.objectStoreNames.contains(STORES.PRESCRIPTIONS)) {
        const prescriptionStore = db.createObjectStore(STORES.PRESCRIPTIONS, { keyPath: 'id' });
        prescriptionStore.createIndex('patient_id', 'patient_id', { unique: false });
        prescriptionStore.createIndex('status', 'status', { unique: false });
      }

      // Pending compliance logs (to sync when online)
      if (!db.objectStoreNames.contains(STORES.PENDING_COMPLIANCE)) {
        const complianceStore = db.createObjectStore(STORES.PENDING_COMPLIANCE, {
          keyPath: 'localId',
          autoIncrement: true,
        });
        complianceStore.createIndex('prescription_id', 'prescription_id', { unique: false });
      }

      // Pending prescriptions (to sync when online)
      if (!db.objectStoreNames.contains(STORES.PENDING_PRESCRIPTIONS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_PRESCRIPTIONS, {
          keyPath: 'localId',
          autoIncrement: true,
        });
        pendingStore.createIndex('patient_id', 'patient_id', { unique: false });
      }

      // Sync metadata
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Get all items from a store
 */
const getAllFromStore = async (db, storeName) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Get items by index
 */
const getByIndex = async (db, storeName, indexName, value) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Put item into store
 */
const putItem = async (db, storeName, item) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Put multiple items into store
 */
const putMany = async (db, storeName, items) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    items.forEach((item) => store.put(item));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Delete item from store
 */
const deleteItem = async (db, storeName, key) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Clear all items from store
 */
const clearStore = async (db, storeName) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Main Exercise Sync Hook
 */
export const useExerciseSync = (patientId = null) => {
  const queryClient = useQueryClient();
  const [db, setDb] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const syncIntervalRef = useRef(null);

  // Initialize IndexedDB
  useEffect(() => {
    initDB()
      .then((database) => {
        setDb(database);
        // Get last sync time
        const transaction = database.transaction(STORES.SYNC_META, 'readonly');
        const store = transaction.objectStore(STORES.SYNC_META);
        const request = store.get('lastSync');
        request.onsuccess = () => {
          if (request.result) {
            setLastSyncTime(new Date(request.result.value));
          }
        };
      })
      .catch((error) => {
        console.error('Failed to initialize IndexedDB:', error);
      });

    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if (db) {
        syncPendingData();
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
  }, [db]);

  // Update pending count
  useEffect(() => {
    if (!db) {
      return;
    }

    const updatePendingCount = async () => {
      try {
        const pendingCompliance = await getAllFromStore(db, STORES.PENDING_COMPLIANCE);
        const pendingPrescriptions = await getAllFromStore(db, STORES.PENDING_PRESCRIPTIONS);
        setPendingCount(pendingCompliance.length + pendingPrescriptions.length);
      } catch (error) {
        console.error('Error counting pending items:', error);
      }
    };

    updatePendingCount();
    // Update count every 10 seconds
    const interval = setInterval(updatePendingCount, 10000);
    return () => clearInterval(interval);
  }, [db]);

  // Background sync interval
  useEffect(() => {
    if (!db || !isOnline) {
      return;
    }

    // Sync every 5 minutes
    syncIntervalRef.current = setInterval(
      () => {
        syncExerciseLibrary();
      },
      5 * 60 * 1000
    );

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [db, isOnline]);

  /**
   * Sync exercise library from server
   */
  const syncExerciseLibrary = useCallback(async () => {
    if (!db || !isOnline || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      // Fetch all exercises from server
      const response = await exercisesAPI.getAll({ limit: 500 });
      const exercises = response.data?.data || [];

      if (exercises.length > 0) {
        // Clear and refill the cache
        await clearStore(db, STORES.EXERCISES);
        await putMany(db, STORES.EXERCISES, exercises);
      }

      // Update sync metadata
      const now = new Date().toISOString();
      await putItem(db, STORES.SYNC_META, { key: 'lastSync', value: now });
      setLastSyncTime(new Date(now));

      console.log(`Exercise library synced: ${exercises.length} exercises`);
    } catch (error) {
      console.error('Error syncing exercise library:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [db, isOnline, isSyncing]);

  /**
   * Sync patient prescriptions
   */
  const syncPatientPrescriptions = useCallback(
    async (patientId) => {
      if (!db || !isOnline || !patientId) {
        return;
      }

      try {
        const response = await exercisesAPI.getPatientExercises(patientId, { limit: 100 });
        const prescriptions = response.data?.data || [];

        // Store prescriptions in cache
        for (const prescription of prescriptions) {
          await putItem(db, STORES.PRESCRIPTIONS, prescription);
        }

        console.log(`Patient prescriptions synced: ${prescriptions.length} prescriptions`);
      } catch (error) {
        console.error('Error syncing patient prescriptions:', error);
      }
    },
    [db, isOnline]
  );

  /**
   * Sync pending data to server
   */
  const syncPendingData = useCallback(async () => {
    if (!db || !isOnline || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      // Sync pending compliance logs
      const pendingCompliance = await getAllFromStore(db, STORES.PENDING_COMPLIANCE);
      for (const item of pendingCompliance) {
        try {
          await exercisesAPI.logCompliance(item.prescription_id, item.data);
          await deleteItem(db, STORES.PENDING_COMPLIANCE, item.localId);
          console.log('Synced compliance log:', item.prescription_id);
        } catch (error) {
          console.error('Error syncing compliance log:', error);
        }
      }

      // Sync pending prescriptions
      const pendingPrescriptions = await getAllFromStore(db, STORES.PENDING_PRESCRIPTIONS);
      for (const item of pendingPrescriptions) {
        try {
          await exercisesAPI.prescribeToPatient(item.patient_id, item.data);
          await deleteItem(db, STORES.PENDING_PRESCRIPTIONS, item.localId);
          console.log('Synced prescription:', item.patient_id);
        } catch (error) {
          console.error('Error syncing prescription:', error);
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['exercises']);
      queryClient.invalidateQueries(['patient']);

      // Update pending count
      setPendingCount(0);
    } catch (error) {
      console.error('Error syncing pending data:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [db, isOnline, isSyncing, queryClient]);

  /**
   * Get exercises from cache (for offline use)
   */
  const getCachedExercises = useCallback(
    async (filters = {}) => {
      if (!db) {
        return [];
      }

      try {
        let exercises = await getAllFromStore(db, STORES.EXERCISES);

        // Apply filters
        if (filters.category) {
          exercises = exercises.filter((e) => e.category === filters.category);
        }
        if (filters.body_region) {
          exercises = exercises.filter((e) => e.body_region === filters.body_region);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          exercises = exercises.filter(
            (e) =>
              e.name_no?.toLowerCase().includes(searchLower) ||
              e.name_en?.toLowerCase().includes(searchLower) ||
              e.code?.toLowerCase().includes(searchLower)
          );
        }

        return exercises;
      } catch (error) {
        console.error('Error getting cached exercises:', error);
        return [];
      }
    },
    [db]
  );

  /**
   * Get patient prescriptions from cache
   */
  const getCachedPrescriptions = useCallback(
    async (patientId) => {
      if (!db || !patientId) {
        return [];
      }

      try {
        return await getByIndex(db, STORES.PRESCRIPTIONS, 'patient_id', patientId);
      } catch (error) {
        console.error('Error getting cached prescriptions:', error);
        return [];
      }
    },
    [db]
  );

  /**
   * Queue compliance log for sync (when offline)
   */
  const queueComplianceLog = useCallback(
    async (prescriptionId, data) => {
      if (!db) {
        return false;
      }

      try {
        await putItem(db, STORES.PENDING_COMPLIANCE, {
          prescription_id: prescriptionId,
          data,
          timestamp: new Date().toISOString(),
        });

        // Update the cached prescription locally
        const transaction = db.transaction(STORES.PRESCRIPTIONS, 'readwrite');
        const store = transaction.objectStore(STORES.PRESCRIPTIONS);
        const request = store.get(prescriptionId);

        request.onsuccess = () => {
          if (request.result) {
            const prescription = request.result;
            const dateKey = data.date || new Date().toISOString().split('T')[0];
            prescription.compliance_log = {
              ...prescription.compliance_log,
              [dateKey]: {
                completed: data.completed,
                pain_level: data.pain_level,
                notes: data.notes,
                synced: false,
              },
            };
            store.put(prescription);
          }
        };

        setPendingCount((prev) => prev + 1);

        // Try to sync immediately if online
        if (isOnline) {
          syncPendingData();
        }

        return true;
      } catch (error) {
        console.error('Error queuing compliance log:', error);
        return false;
      }
    },
    [db, isOnline, syncPendingData]
  );

  /**
   * Queue prescription for sync (when offline)
   */
  const queuePrescription = useCallback(
    async (patientId, data) => {
      if (!db) {
        return false;
      }

      try {
        await putItem(db, STORES.PENDING_PRESCRIPTIONS, {
          patient_id: patientId,
          data,
          timestamp: new Date().toISOString(),
        });

        setPendingCount((prev) => prev + 1);

        // Try to sync immediately if online
        if (isOnline) {
          syncPendingData();
        }

        return true;
      } catch (error) {
        console.error('Error queuing prescription:', error);
        return false;
      }
    },
    [db, isOnline, syncPendingData]
  );

  /**
   * Force sync all data
   */
  const forceSync = useCallback(async () => {
    await syncPendingData();
    await syncExerciseLibrary();
    if (patientId) {
      await syncPatientPrescriptions(patientId);
    }
  }, [patientId, syncPendingData, syncExerciseLibrary, syncPatientPrescriptions]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(async () => {
    if (!db) {
      return;
    }

    try {
      await clearStore(db, STORES.EXERCISES);
      await clearStore(db, STORES.PRESCRIPTIONS);
      await clearStore(db, STORES.SYNC_META);
      setLastSyncTime(null);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [db]);

  return {
    // Status
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    isReady: !!db,

    // Data access
    getCachedExercises,
    getCachedPrescriptions,

    // Offline operations
    queueComplianceLog,
    queuePrescription,

    // Sync operations
    syncExerciseLibrary,
    syncPatientPrescriptions,
    syncPendingData,
    forceSync,
    clearCache,
  };
};

export default useExerciseSync;
