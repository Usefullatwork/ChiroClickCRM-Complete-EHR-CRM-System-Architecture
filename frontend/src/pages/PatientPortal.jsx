/**
 * Patient Portal Page
 * Public-facing page for patients to view their exercise prescriptions
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Dumbbell,
  Play,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  Phone,
  Calendar,
  User,
  X,
  Loader2,
} from 'lucide-react';
import axios from 'axios';

import logger from '../utils/logger';
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const PatientPortal = () => {
  const { token } = useParams();

  // State
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(null);
  const [_progressHistory, setProgressHistory] = useState([]);

  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    setsCompleted: 0,
    repsCompleted: 0,
    difficultyRating: 3,
    painRating: 0,
    notes: '',
  });

  // Load prescription
  useEffect(() => {
    loadPrescription();
  }, [token]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE}/portal/exercises/${token}`);
      setPrescription(response.data.data);

      // Load progress history
      loadProgressHistory();
    } catch (err) {
      logger.error('Error loading prescription:', err);
      setError(err.response?.data?.message || 'Kunne ikke laste øvelsesprogrammet');
    } finally {
      setLoading(false);
    }
  };

  const loadProgressHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/portal/exercises/${token}/progress`);
      setProgressHistory(response.data.data || []);

      // Mark exercises as completed if done today
      const today = new Date().toISOString().split('T')[0];
      const completedToday = new Set();
      response.data.data?.forEach((entry) => {
        if (entry.completedAt?.startsWith(today)) {
          completedToday.add(entry.exerciseId);
        }
      });
      setCompletedExercises(completedToday);
    } catch (err) {
      logger.error('Error loading progress:', err);
    }
  };

  // Record exercise completion
  const handleRecordProgress = async () => {
    if (!showFeedbackModal) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/portal/exercises/${token}/progress`, {
        exerciseId: showFeedbackModal.exerciseId,
        ...feedbackData,
      });

      // Mark as completed
      setCompletedExercises((prev) => new Set([...prev, showFeedbackModal.exerciseId]));

      // Reset and close
      setShowFeedbackModal(null);
      setFeedbackData({
        setsCompleted: 0,
        repsCompleted: 0,
        difficultyRating: 3,
        painRating: 0,
        notes: '',
      });

      // Refresh progress
      loadProgressHistory();
    } catch (err) {
      logger.error('Error recording progress:', err);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get difficulty label
  const getDifficultyLabel = (level) => {
    switch (level) {
      case 'beginner':
        return 'Nybegynner';
      case 'intermediate':
        return 'Middels';
      case 'advanced':
        return 'Avansert';
      default:
        return level;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laster øvelser...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Øvelsene er ikke tilgjengelige
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Kontakt klinikken for å få en ny lenke til øvelsene dine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{prescription?.clinicName}</h1>
              <p className="text-sm text-gray-500">Ditt øvelsesprogram</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Prescription Info */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Foreskrevet av: {prescription?.prescribedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(prescription?.prescribedAt).toLocaleDateString('nb-NO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            {prescription?.clinicPhone && (
              <a
                href={`tel:${prescription.clinicPhone}`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Phone className="w-4 h-4" />
                {prescription.clinicPhone}
              </a>
            )}
          </div>

          {prescription?.patientInstructions && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Instruksjoner:</p>
              <p className="text-sm text-blue-800">{prescription.patientInstructions}</p>
            </div>
          )}
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="font-medium text-gray-900 mb-3">Din fremgang i dag</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div
                className="bg-green-500 h-full rounded-full transition-all"
                style={{
                  width: `${(completedExercises.size / (prescription?.exercises?.length || 1)) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {completedExercises.size} / {prescription?.exercises?.length || 0}
            </span>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">
            Øvelser ({prescription?.exercises?.length})
          </h2>

          {prescription?.exercises?.map((exercise, index) => (
            <div
              key={exercise.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
                completedExercises.has(exercise.exerciseId) ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {/* Exercise Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedExercise(expandedExercise === index ? null : index)}
              >
                <div className="flex items-start gap-3">
                  {/* Number/Check */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      completedExercises.has(exercise.exerciseId) ? 'bg-green-500' : 'bg-blue-100'
                    }`}
                  >
                    {completedExercises.has(exercise.exerciseId) ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-blue-700 font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{exercise.category}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(exercise.difficultyLevel)}`}
                      >
                        {getDifficultyLabel(exercise.difficultyLevel)}
                      </span>
                      {exercise.videoUrl && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Play className="w-3 h-3" />
                          Video
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Button */}
                  <div className="text-gray-400">
                    {expandedExercise === index ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Parameters */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                  {exercise.sets && (
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-gray-400" />
                      {exercise.sets} sett
                    </span>
                  )}
                  {exercise.reps && (
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4 text-gray-400" />
                      {exercise.reps} rep
                    </span>
                  )}
                  {exercise.holdSeconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Hold {exercise.holdSeconds} sek
                    </span>
                  )}
                  {exercise.frequencyPerDay && (
                    <span className="flex items-center gap-1">
                      {exercise.frequencyPerDay}× daglig
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedExercise === index && (
                <div className="border-t border-gray-100">
                  {/* Image/Video */}
                  {exercise.videoUrl && (
                    <div className="aspect-video bg-gray-100">
                      <iframe
                        src={exercise.videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title={exercise.name}
                      />
                    </div>
                  )}

                  {exercise.imageUrl && !exercise.videoUrl && (
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  {/* Instructions */}
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Instruksjoner</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {exercise.instructions}
                      </p>
                    </div>

                    {exercise.customInstructions && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          Spesielle instruksjoner
                        </h4>
                        <p className="text-sm text-blue-800">{exercise.customInstructions}</p>
                      </div>
                    )}

                    {exercise.precautions && exercise.precautions.length > 0 && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">
                              Forsiktighetsregler
                            </h4>
                            <ul className="text-sm text-yellow-700 mt-1">
                              {exercise.precautions.map((p, i) => (
                                <li key={i}>• {p}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Complete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedbackData({
                          setsCompleted: exercise.sets || 3,
                          repsCompleted: exercise.reps || 10,
                          difficultyRating: 3,
                          painRating: 0,
                          notes: '',
                        });
                        setShowFeedbackModal({
                          exerciseId: exercise.exerciseId || exercise.id,
                          name: exercise.name,
                          sets: exercise.sets,
                          reps: exercise.reps,
                        });
                      }}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        completedExercises.has(exercise.exerciseId)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {completedExercises.has(exercise.exerciseId) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Fullført i dag
                        </span>
                      ) : (
                        'Marker som fullført'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 text-center text-sm text-gray-500">
          <p>Stopp øvelsene hvis du opplever økt smerte og kontakt klinikken.</p>
          <p className="mt-2">Dette programmet er personlig tilpasset deg.</p>
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Registrer fremgang</h3>
              <button
                onClick={() => setShowFeedbackModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{showFeedbackModal.name}</p>

            <div className="space-y-4">
              {/* Sets/Reps Completed */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sett fullført
                  </label>
                  <input
                    type="number"
                    value={feedbackData.setsCompleted}
                    onChange={(e) =>
                      setFeedbackData((prev) => ({
                        ...prev,
                        setsCompleted: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    min="0"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repetisjoner
                  </label>
                  <input
                    type="number"
                    value={feedbackData.repsCompleted}
                    onChange={(e) =>
                      setFeedbackData((prev) => ({
                        ...prev,
                        repsCompleted: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Difficulty Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hvor vanskelig var øvelsen?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() =>
                        setFeedbackData((prev) => ({ ...prev, difficultyRating: rating }))
                      }
                      className={`flex-1 py-2 rounded-lg border transition-colors ${
                        feedbackData.difficultyRating === rating
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lett</span>
                  <span>Vanskelig</span>
                </div>
              </div>

              {/* Pain Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Smertenivå under øvelsen (0-10)
                </label>
                <input
                  type="range"
                  value={feedbackData.painRating}
                  onChange={(e) =>
                    setFeedbackData((prev) => ({
                      ...prev,
                      painRating: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                  min="0"
                  max="10"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Ingen smerte</span>
                  <span className="font-medium">{feedbackData.painRating}</span>
                  <span>Verst tenkelig</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notater (valgfritt)
                </label>
                <textarea
                  value={feedbackData.notes}
                  onChange={(e) => setFeedbackData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  rows={2}
                  placeholder="Hvordan føltes øvelsen?"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleRecordProgress}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Registrer fremgang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;
