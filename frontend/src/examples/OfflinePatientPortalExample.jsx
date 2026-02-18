/**
 * Offline Patient Portal Example
 *
 * This file demonstrates how to integrate offline support into the Patient Portal.
 * Copy relevant patterns to your actual portal pages.
 *
 * Features demonstrated:
 * 1. Offline indicator in header
 * 2. Data caching for offline access
 * 3. Offline-capable progress tracking
 * 4. Video caching controls
 * 5. Graceful degradation when offline
 *
 * IMPORTANT: This is an example file. Integrate these patterns into your actual pages.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Dumbbell,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CloudOff,
  Cloud,
  Download,
} from 'lucide-react';

// Import offline utilities
import { useOffline } from '../hooks/useOffline';
import { OfflineIndicator } from '../components/ui/OfflineIndicator';
import { VideoOfflineManager, VideoOfflineToggle } from '../components/patient/VideoOfflineToggle';

// Import your existing patient API
import { patientApi, getStoredToken } from '../api/patientApi';

// Import your existing components
import ExerciseCard from '../components/patient/ExerciseCard';

import logger from '../utils/logger';
/**
 * Example: Offline-Enabled My Exercises Page
 */
export default function OfflineMyExercisesExample() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get token
  const token = searchParams.get('token') || getStoredToken();

  // Initialize offline hook with token
  const {
    isOnline,
    isOffline,
    isSyncing,
    _syncStatus,
    pendingSyncCount,
    _lastSyncTime,
    _cachedVideoCount,
    triggerSync,
    cachePrescriptionOffline,
    getCachedPrescriptionData,
    getCachedPrescriptions,
    recordExerciseProgress,
    getTodayProgress,
  } = useOffline({ token, autoSync: true });

  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [todayProgress, setTodayProgress] = useState([]);
  const [error, setError] = useState(null);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // =============================================================================
  // DATA LOADING - WITH OFFLINE FALLBACK
  // =============================================================================

  const loadData = useCallback(async () => {
    if (!token) {
      navigate('/portal/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // ONLINE: Fetch from API and cache
        const response = await patientApi.getPrescriptions(token);

        if (response.success) {
          setData(response.data);
          setUsingCachedData(false);

          // Cache for offline use
          if (response.data.prescriptions?.length > 0) {
            for (const prescription of response.data.prescriptions) {
              try {
                const detail = await patientApi.getPrescription(token, prescription.id);
                if (detail.success) {
                  await cachePrescriptionOffline(detail.data);
                }
              } catch (e) {
                logger.warn('Failed to cache prescription:', e);
              }
            }
          }
        }
      } else {
        // OFFLINE: Load from cache
        const cachedPrescriptions = await getCachedPrescriptions();

        if (cachedPrescriptions.length > 0) {
          // Reconstruct data structure from cache
          setData({
            prescriptions: cachedPrescriptions.map((p) => p.prescription),
            clinic: cachedPrescriptions[0]?.clinic || null,
            patient: cachedPrescriptions[0]?.patient || null,
          });
          setUsingCachedData(true);
        } else {
          setError('Ingen data tilgjengelig frakoblet. Koble til internett for a laste data.');
        }
      }
    } catch (err) {
      logger.error('Error loading data:', err);

      // On error, try cache
      if (!isOnline) {
        const cachedPrescriptions = await getCachedPrescriptions();
        if (cachedPrescriptions.length > 0) {
          setData({
            prescriptions: cachedPrescriptions.map((p) => p.prescription),
            clinic: cachedPrescriptions[0]?.clinic || null,
            patient: cachedPrescriptions[0]?.patient || null,
          });
          setUsingCachedData(true);
        } else {
          setError(err.message || 'Kunne ikke laste data');
        }
      } else {
        setError(err.message || 'Kunne ikke laste data');
      }
    } finally {
      setLoading(false);
    }
  }, [token, isOnline, cachePrescriptionOffline, getCachedPrescriptions, navigate]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when coming back online
  useEffect(() => {
    if (isOnline && usingCachedData) {
      loadData();
    }
  }, [isOnline, usingCachedData, loadData]);

  // =============================================================================
  // PRESCRIPTION SELECTION - WITH OFFLINE SUPPORT
  // =============================================================================

  const _loadPrescriptionDetail = useCallback(
    async (prescriptionId) => {
      try {
        let prescriptionData = null;

        if (isOnline) {
          // Online: Fetch fresh data
          const response = await patientApi.getPrescription(token, prescriptionId);
          if (response.success) {
            prescriptionData = response.data;
            // Update cache
            await cachePrescriptionOffline(prescriptionData);
          }
        } else {
          // Offline: Use cached data
          prescriptionData = await getCachedPrescriptionData(prescriptionId);
        }

        if (prescriptionData) {
          setSelectedPrescription(prescriptionData);

          // Load today's progress (from local storage)
          const progress = await getTodayProgress(prescriptionId);
          setTodayProgress(progress);
        }
      } catch (err) {
        logger.error('Error loading prescription:', err);

        // Try cache on error
        const cached = await getCachedPrescriptionData(prescriptionId);
        if (cached) {
          setSelectedPrescription(cached);
          const progress = await getTodayProgress(prescriptionId);
          setTodayProgress(progress);
        }
      }
    },
    [token, isOnline, cachePrescriptionOffline, getCachedPrescriptionData, getTodayProgress]
  );

  // =============================================================================
  // EXERCISE COMPLETION - WORKS OFFLINE
  // =============================================================================

  const handleExerciseComplete = useCallback(
    async (exerciseId, progressData) => {
      if (!selectedPrescription) {
        return;
      }

      const prescriptionId = selectedPrescription.prescription.id;

      // Record progress - this works offline!
      const success = await recordExerciseProgress(prescriptionId, exerciseId, progressData);

      if (success) {
        // Update local state
        setTodayProgress((prev) => [
          ...prev,
          {
            exerciseId,
            ...progressData,
            completedAt: new Date().toISOString(),
          },
        ]);

        // Progress recorded
      }
    },
    [selectedPrescription, recordExerciseProgress, isOffline]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {isOffline ? 'Laster fra hurtigbuffer...' : 'Laster ovelser...'}
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isOffline ? (
              <CloudOff className="w-8 h-8 text-amber-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {isOffline ? 'Frakoblet' : 'Kunne ikke laste ovelsene'}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Prov igjen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* OFFLINE INDICATOR - Shows when offline or syncing */}
      <OfflineIndicator
        lang="no"
        variant="banner"
        showWhenOnline={true}
        dismissable={true}
        onSync={triggerSync}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  {data?.clinic?.name || 'Pasientportalen'}
                </h1>
                <p className="text-sm text-gray-500">
                  {data?.patient?.firstName ? `Hei, ${data.patient.firstName}!` : 'Mine ovelser'}
                  {usingCachedData && <span className="ml-2 text-amber-600">(frakoblet)</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sync button */}
              {pendingSyncCount > 0 && isOnline && (
                <button
                  onClick={triggerSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Synk ({pendingSyncCount})
                </button>
              )}

              {/* Refresh button */}
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Oppdater"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Offline status icon */}
              <div className={`p-2 rounded-lg ${isOnline ? 'text-green-500' : 'text-amber-500'}`}>
                {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Video Offline Manager - Let patients download videos */}
        {selectedPrescription?.exercises?.some((e) => e.videoUrl) && (
          <div className="mb-6">
            <VideoOfflineManager exercises={selectedPrescription.exercises} lang="no" />
          </div>
        )}

        {/* Progress Summary with offline data */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Din fremgang i dag</h2>
            {usingCachedData && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Frakoblet data
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                style={{
                  width: `${
                    selectedPrescription?.exercises?.length
                      ? (todayProgress.length / selectedPrescription.exercises.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {todayProgress.length} / {selectedPrescription?.exercises?.length || 0}
            </span>
          </div>

          {pendingSyncCount > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              {pendingSyncCount} {pendingSyncCount === 1 ? 'endring' : 'endringer'} venter pa
              synkronisering
            </p>
          )}
        </div>

        {/* Exercise List */}
        {selectedPrescription?.exercises?.map((exercise) => {
          const isCompletedToday = todayProgress.some(
            (p) => p.exerciseId === (exercise.exerciseId || exercise.id)
          );

          return (
            <div key={exercise.id} className="mb-4">
              <ExerciseCard
                exercise={exercise}
                completedToday={isCompletedToday}
                onComplete={(exerciseId) => {
                  handleExerciseComplete(exerciseId, {
                    setsCompleted: exercise.sets || 3,
                    repsCompleted: exercise.reps || 10,
                    difficultyRating: 3,
                    painRating: 0,
                  });
                }}
                showActions={true}
              />

              {/* Individual video download toggle */}
              {exercise.videoUrl && (
                <div className="mt-2 ml-13">
                  <VideoOfflineToggle
                    videoUrl={exercise.videoUrl}
                    exerciseId={exercise.exerciseId || exercise.id}
                    exerciseName={exercise.name}
                    lang="no"
                    variant="toggle"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Offline notice footer */}
        <div className="mt-8 p-4 bg-gray-100 rounded-xl">
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Frakoblet tilgang
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Ovelsene dine er tilgjengelige nar du er frakoblet. Fremgangen din lagres lokalt og
            synkroniseres automatisk nar du er tilkoblet igjen.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>- Se ovelser og instruksjoner</li>
            <li>- Registrer fremgang (synkroniseres senere)</li>
            <li>- Last ned videoer for frakoblet avspilling</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

/**
 * INTEGRATION CHECKLIST:
 *
 * 1. Add OfflineIndicator to your page header:
 *    <OfflineIndicator lang="no" variant="banner" />
 *
 * 2. Use useOffline hook for offline-aware data fetching:
 *    const { isOnline, cachePrescriptionOffline, getCachedPrescriptions } = useOffline({ token });
 *
 * 3. Cache data when online:
 *    if (isOnline) {
 *      const data = await fetchFromAPI();
 *      await cachePrescriptionOffline(data);
 *    }
 *
 * 4. Fall back to cache when offline:
 *    if (!isOnline) {
 *      const data = await getCachedPrescriptions();
 *    }
 *
 * 5. Use recordExerciseProgress for offline-capable progress tracking:
 *    await recordExerciseProgress(prescriptionId, exerciseId, progressData);
 *
 * 6. Add VideoOfflineManager for user-controlled video caching:
 *    <VideoOfflineManager exercises={exercises} lang="no" />
 *
 * 7. Register service worker in your app entry (main.jsx):
 *    import { registerServiceWorker } from '@/utils/offline';
 *    registerServiceWorker();
 */
