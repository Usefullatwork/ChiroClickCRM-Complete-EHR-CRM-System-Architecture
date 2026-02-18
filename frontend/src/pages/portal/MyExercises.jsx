/**
 * My Exercises Page
 * Patient portal page showing prescribed exercises
 * Mobile-responsive with Norwegian text
 *
 * Optimized for mobile devices with:
 * - Touch-friendly targets (min 44px)
 * - Safe area support for notched devices
 * - Responsive layouts for all screen sizes
 * - Pull-to-refresh gesture support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Dumbbell,
  Loader2,
  AlertTriangle,
  Phone,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  LogOut,
  TrendingUp,
  CheckCircle2,
  ArrowUp,
} from 'lucide-react';
import { patientApi, getStoredToken, clearStoredToken } from '../../api/patientApi';
import ExerciseCard from '../../components/patient/ExerciseCard';
import useMediaQuery from '../../hooks/useMediaQuery';

import logger from '../../utils/logger';
const MyExercises = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { _isMobile, isTouchDevice, prefersReducedMotion } = useMediaQuery();
  const mainRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);

  // Get token
  const token = searchParams.get('token') || getStoredToken();

  // Load data on mount
  useEffect(() => {
    if (!token) {
      navigate('/portal/login');
      return;
    }
    loadPrescriptions();
  }, [token]);

  // Track scroll position for "scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback(
    (e) => {
      if (window.scrollY === 0 && !refreshing) {
        touchStartY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    },
    [refreshing]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isPulling || refreshing) {
        return;
      }
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartY.current);
      setPullDistance(Math.min(distance * 0.5, 80)); // Max 80px with resistance
    },
    [isPulling, refreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60 && !refreshing) {
      handleRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, refreshing]);

  // Load prescriptions
  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await patientApi.getPrescriptions(token);

      if (response.success) {
        setData(response.data);

        // Auto-select first prescription if only one
        if (response.data.prescriptions?.length === 1) {
          loadPrescriptionDetail(response.data.prescriptions[0].id);
        }
      }
    } catch (err) {
      logger.error('Error loading prescriptions:', err);
      if (err.status === 401) {
        // Token expired - redirect to login
        clearStoredToken();
        navigate('/portal/login');
        return;
      }
      setError(err.message || 'Kunne ikke laste øvelsene');
    } finally {
      setLoading(false);
    }
  };

  // Load specific prescription detail
  const loadPrescriptionDetail = async (prescriptionId) => {
    try {
      setRefreshing(true);

      const [prescriptionResponse, summaryResponse] = await Promise.all([
        patientApi.getPrescription(token, prescriptionId),
        patientApi.getDailySummary(token, prescriptionId),
      ]);

      if (prescriptionResponse.success) {
        setSelectedPrescription(prescriptionResponse.data);
      }

      if (summaryResponse.success) {
        setDailySummary(summaryResponse.data);
      }
    } catch (err) {
      logger.error('Error loading prescription detail:', err);
      setError(err.message || 'Kunne ikke laste øvelsene');
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedPrescription) {
      loadPrescriptionDetail(selectedPrescription.prescription.id);
    } else {
      loadPrescriptions();
    }
  };

  // Navigate to exercise detail
  const handleExerciseClick = (exercise) => {
    navigate(
      `/portal/ovelse/${selectedPrescription.prescription.id}/${exercise.exerciseId}?token=${token}`
    );
  };

  // Handle logout
  const handleLogout = () => {
    clearStoredToken();
    navigate('/portal/login');
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">Laster øvelser...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4 safe-area-inset">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            Kunne ikke laste øvelsene
          </h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium min-h-[48px] touch-manipulation"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-gray-50"
      onTouchStart={isTouchDevice ? handleTouchStart : undefined}
      onTouchMove={isTouchDevice ? handleTouchMove : undefined}
      onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
          style={{
            transform: `translateY(${pullDistance - 40}px)`,
            opacity: Math.min(pullDistance / 60, 1),
          }}
        >
          <div className="bg-white rounded-full p-2 shadow-lg">
            <RefreshCw
              className={`w-6 h-6 text-blue-600 ${pullDistance > 60 ? 'animate-spin' : ''}`}
              style={{
                transform: `rotate(${pullDistance * 3}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className="bg-white border-b border-gray-200 sticky top-0 z-40"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {data?.clinic?.name || 'Pasientportalen'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {data?.patient?.firstName ? `Hei, ${data.patient.firstName}!` : 'Mine øvelser'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 sm:p-3 text-gray-500 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                title="Oppdater"
                aria-label="Oppdater"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 sm:p-3 text-gray-500 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                title="Logg ut"
                aria-label="Logg ut"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        ref={mainRef}
        className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
      >
        {/* Prescription Selector (if multiple) */}
        {data?.prescriptions?.length > 1 && !selectedPrescription && (
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Dine øvelsesprogrammer
            </h2>
            <div className="space-y-3">
              {data.prescriptions.map((prescription) => (
                <button
                  key={prescription.id}
                  onClick={() => loadPrescriptionDetail(prescription.id)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 active:bg-gray-50 hover:shadow-md transition-all text-left min-h-[72px] touch-manipulation"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-1">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(prescription.prescribedAt).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {prescription.exerciseCount} øvelser
                    </p>
                    {prescription.prescribedBy && (
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Av: {prescription.prescribedBy}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {prescription.completedToday}/{prescription.exerciseCount}
                      </p>
                      <p className="text-xs text-gray-500">i dag</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Prescription Content */}
        {selectedPrescription && (
          <>
            {/* Back button if multiple prescriptions */}
            {data?.prescriptions?.length > 1 && (
              <button
                onClick={() => setSelectedPrescription(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 active:text-blue-800 mb-4 py-2 -ml-1 min-h-[44px] touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Tilbake til oversikt</span>
              </button>
            )}

            {/* Progress Summary */}
            {dailySummary && (
              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-medium text-gray-900 text-sm sm:text-base">
                    Din fremgang i dag
                  </h2>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-semibold">
                      {dailySummary.completionPercentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex-1 bg-gray-100 rounded-full h-3 sm:h-4 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full ${
                        prefersReducedMotion ? '' : 'transition-all duration-500'
                      }`}
                      style={{ width: `${dailySummary.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    {dailySummary.exercisesCompleted} / {dailySummary.totalExercises}
                  </span>
                </div>

                {/* Stats - Stack on very small screens */}
                {(dailySummary.totalSets > 0 || dailySummary.totalReps > 0) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs sm:text-sm text-gray-500">
                    {dailySummary.totalSets > 0 && (
                      <span>{dailySummary.totalSets} sett fullført</span>
                    )}
                    {dailySummary.totalReps > 0 && (
                      <span>{dailySummary.totalReps} repetisjoner</span>
                    )}
                  </div>
                )}

                {/* Completion message */}
                {dailySummary.completionPercentage === 100 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-start sm:items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-sm text-green-800 font-medium">
                      Bra jobbet! Du har fullført alle øvelsene for i dag.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Prescription Info */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
              {/* Stack info items on mobile */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
                {selectedPrescription.prescription.prescribedBy && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      Foreskrevet av: {selectedPrescription.prescription.prescribedBy}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {new Date(selectedPrescription.prescription.prescribedAt).toLocaleDateString(
                      'nb-NO',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}
                  </span>
                </div>
                {data?.clinic?.phone && (
                  <a
                    href={`tel:${data.clinic.phone}`}
                    className="flex items-center gap-2 text-blue-600 hover:underline active:text-blue-700 py-1 min-h-[44px] sm:min-h-0 touch-manipulation"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{data.clinic.phone}</span>
                  </a>
                )}
              </div>

              {selectedPrescription.prescription.patientInstructions && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Instruksjoner:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-line">
                    {selectedPrescription.prescription.patientInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Exercise List */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
                Øvelser ({selectedPrescription.exercises?.length || 0})
              </h2>

              {selectedPrescription.exercises?.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Ingen øvelser funnet</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedPrescription.exercises?.map((exercise, _index) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onClick={handleExerciseClick}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* No prescriptions */}
        {data?.prescriptions?.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Ingen øvelsesprogrammer
            </h2>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              Du har ingen aktive ovelsesprogrammer for øyeblikket.
            </p>
            {data?.clinic?.phone && (
              <a
                href={`tel:${data.clinic.phone}`}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium min-h-[48px] touch-manipulation"
              >
                <Phone className="w-5 h-5" />
                Ring klinikken
              </a>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 p-4 text-center text-xs sm:text-sm text-gray-500">
          <p>Stopp øvelsene hvis du opplever økt smerte og kontakt klinikken.</p>
          <p className="mt-2">Dette programmet er personlig tilpasset deg.</p>
        </div>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-4 sm:right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center z-30 touch-manipulation ${
            prefersReducedMotion ? '' : 'animate-fade-in'
          }`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
          aria-label="Scroll til toppen"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default MyExercises;
