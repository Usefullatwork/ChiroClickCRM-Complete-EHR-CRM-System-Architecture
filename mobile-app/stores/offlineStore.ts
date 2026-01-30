/**
 * Offline Store
 * Manages offline data queue and sync status
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../services/api';

type OperationType = 'workout_log' | 'profile_update' | 'favorite_toggle';

interface QueuedOperation {
  id: string;
  type: OperationType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface DownloadedVideo {
  exerciseId: string;
  videoId: string;
  localPath: string;
  downloadedAt: number;
  sizeBytes: number;
}

interface OfflineState {
  // Connection status
  isConnected: boolean;
  connectionType: string;

  // Queue
  operationQueue: QueuedOperation[];
  isSyncing: boolean;
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;

  // Downloaded content
  downloadedVideos: DownloadedVideo[];
  totalDownloadSize: number;

  // Settings
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  maxQueueSize: number;

  // Actions
  setConnectionStatus: (isConnected: boolean, type: string) => void;
  addToQueue: (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromQueue: (operationId: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  addDownloadedVideo: (video: DownloadedVideo) => void;
  removeDownloadedVideo: (exerciseId: string) => void;
  clearDownloadedVideos: () => void;
  isVideoDownloaded: (exerciseId: string) => boolean;
  getVideoLocalPath: (exerciseId: string) => string | null;
  getQueueSize: () => number;
  setAutoSync: (enabled: boolean) => void;
  setSyncOnWifiOnly: (enabled: boolean) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Initial State
      isConnected: true,
      connectionType: 'unknown',
      operationQueue: [],
      isSyncing: false,
      lastSyncAttempt: null,
      lastSuccessfulSync: null,
      downloadedVideos: [],
      totalDownloadSize: 0,
      autoSync: true,
      syncOnWifiOnly: false,
      maxQueueSize: 100,

      // Set connection status
      setConnectionStatus: (isConnected: boolean, type: string) => {
        const wasOffline = !get().isConnected;
        set({ isConnected, connectionType: type });

        // Auto-sync when coming back online
        if (wasOffline && isConnected && get().autoSync) {
          get().processQueue();
        }
      },

      // Add operation to queue
      addToQueue: (operation) => {
        const { operationQueue, maxQueueSize, isConnected } = get();

        // If online and auto-sync, try to execute immediately
        if (isConnected && get().autoSync) {
          get().processQueue();
        }

        // Check queue size
        if (operationQueue.length >= maxQueueSize) {
          // Remove oldest operation
          const sorted = [...operationQueue].sort((a, b) => a.timestamp - b.timestamp);
          sorted.shift();
          set({ operationQueue: sorted });
        }

        const newOperation: QueuedOperation = {
          ...operation,
          id: generateId(),
          timestamp: Date.now(),
          retryCount: 0
        };

        set(state => ({
          operationQueue: [...state.operationQueue, newOperation]
        }));
      },

      // Remove operation from queue
      removeFromQueue: (operationId: string) => {
        set(state => ({
          operationQueue: state.operationQueue.filter(op => op.id !== operationId)
        }));
      },

      // Process queue
      processQueue: async () => {
        const { operationQueue, isConnected, syncOnWifiOnly, connectionType, isSyncing } = get();

        // Check if we can sync
        if (!isConnected || isSyncing || operationQueue.length === 0) {
          return;
        }

        // Check wifi-only setting
        if (syncOnWifiOnly && connectionType !== 'wifi') {
          return;
        }

        set({ isSyncing: true, lastSyncAttempt: Date.now() });

        const failedOperations: QueuedOperation[] = [];

        for (const operation of operationQueue) {
          try {
            // Execute the operation
            await executeOperation(operation);

            // Success - operation will be removed from queue
          } catch (error) {
            // Increment retry count
            operation.retryCount += 1;

            // Check if max retries reached
            if (operation.retryCount < operation.maxRetries) {
              failedOperations.push(operation);
            }
            // If max retries reached, operation is dropped
          }
        }

        set({
          operationQueue: failedOperations,
          isSyncing: false,
          lastSuccessfulSync: failedOperations.length === 0 ? Date.now() : get().lastSuccessfulSync
        });
      },

      // Clear queue
      clearQueue: () => {
        set({ operationQueue: [] });
      },

      // Add downloaded video
      addDownloadedVideo: (video: DownloadedVideo) => {
        set(state => ({
          downloadedVideos: [...state.downloadedVideos, video],
          totalDownloadSize: state.totalDownloadSize + video.sizeBytes
        }));
      },

      // Remove downloaded video
      removeDownloadedVideo: (exerciseId: string) => {
        const video = get().downloadedVideos.find(v => v.exerciseId === exerciseId);
        if (video) {
          set(state => ({
            downloadedVideos: state.downloadedVideos.filter(v => v.exerciseId !== exerciseId),
            totalDownloadSize: state.totalDownloadSize - video.sizeBytes
          }));
        }
      },

      // Clear all downloaded videos
      clearDownloadedVideos: () => {
        set({ downloadedVideos: [], totalDownloadSize: 0 });
      },

      // Check if video is downloaded
      isVideoDownloaded: (exerciseId: string) => {
        return get().downloadedVideos.some(v => v.exerciseId === exerciseId);
      },

      // Get video local path
      getVideoLocalPath: (exerciseId: string) => {
        const video = get().downloadedVideos.find(v => v.exerciseId === exerciseId);
        return video?.localPath || null;
      },

      // Get queue size
      getQueueSize: () => {
        return get().operationQueue.length;
      },

      // Set auto sync
      setAutoSync: (enabled: boolean) => {
        set({ autoSync: enabled });
      },

      // Set sync on wifi only
      setSyncOnWifiOnly: (enabled: boolean) => {
        set({ syncOnWifiOnly: enabled });
      }
    }),
    {
      name: 'chiroclick-offline-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        operationQueue: state.operationQueue,
        downloadedVideos: state.downloadedVideos,
        totalDownloadSize: state.totalDownloadSize,
        autoSync: state.autoSync,
        syncOnWifiOnly: state.syncOnWifiOnly,
        lastSuccessfulSync: state.lastSuccessfulSync
      })
    }
  )
);

// Helper function to execute a queued operation
async function executeOperation(operation: QueuedOperation): Promise<void> {
  const response = await fetch(operation.endpoint, {
    method: operation.method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(operation.data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Initialize network listener
export function initNetworkListener() {
  return NetInfo.addEventListener(state => {
    useOfflineStore.getState().setConnectionStatus(
      state.isConnected ?? false,
      state.type
    );
  });
}

// Format bytes for display
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default useOfflineStore;
