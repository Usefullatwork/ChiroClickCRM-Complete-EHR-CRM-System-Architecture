/**
 * Exercise Detail Page
 * Single exercise view with video playback and completion logging
 * Mobile-responsive with Norwegian text
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Play,
  Check,
  Clock,
  Target,
  Activity,
  Phone,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react'
import { patientApi, getStoredToken, clearStoredToken } from '../../api/patientApi'
import VimeoPlayer from '../../components/exercises/VimeoPlayer'

const ExerciseDetail = () => {
  const navigate = useNavigate()
  const { prescriptionId, exerciseId } = useParams()
  const [searchParams] = useSearchParams()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [showVideo, setShowVideo] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    setsCompleted: 3,
    repsCompleted: 10,
    difficultyRating: 3,
    painRating: 0,
    notes: ''
  })

  // Get token
  const token = searchParams.get('token') || getStoredToken()

  // Load exercise data on mount
  useEffect(() => {
    if (!token) {
      navigate('/portal/login')
      return
    }
    loadExercise()
  }, [token, prescriptionId, exerciseId])

  // Load exercise detail
  const loadExercise = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await patientApi.getExercise(token, prescriptionId, exerciseId)

      if (response.success) {
        setData(response.data)
        // Pre-fill feedback with exercise defaults
        setFeedbackData(prev => ({
          ...prev,
          setsCompleted: response.data.exercise.sets || 3,
          repsCompleted: response.data.exercise.reps || 10
        }))
      }
    } catch (err) {
      console.error('Error loading exercise:', err)
      if (err.status === 401) {
        clearStoredToken()
        navigate('/portal/login')
        return
      }
      setError(err.message || 'Kunne ikke laste øvelsen')
    } finally {
      setLoading(false)
    }
  }

  // Submit progress
  const handleSubmitProgress = async () => {
    try {
      setSubmitting(true)

      const response = await patientApi.recordProgress(
        token,
        prescriptionId,
        exerciseId,
        feedbackData
      )

      if (response.success) {
        setShowFeedbackModal(false)
        // Refresh to show updated completion status
        loadExercise()
      }
    } catch (err) {
      console.error('Error recording progress:', err)
      setError(err.message || 'Kunne ikke registrere fremgang')
    } finally {
      setSubmitting(false)
    }
  }

  // Go back
  const handleBack = () => {
    navigate(`/portal/mine-øvelser?token=${token}`)
  }

  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get difficulty label
  const getDifficultyLabel = (level) => {
    switch (level) {
      case 'beginner': return 'Nybegynner'
      case 'intermediate': return 'Middels'
      case 'advanced': return 'Avansert'
      default: return level
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laster ovelse...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Kunne ikke laste øvelsen
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tilbake til øvelser
          </button>
        </div>
      </div>
    )
  }

  const exercise = data?.exercise

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-900 truncate">
                {exercise?.name || 'Ovelse'}
              </h1>
              <p className="text-sm text-gray-500">{data?.clinic?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto">
        {/* Video/Image Section */}
        <div className="bg-gray-900 aspect-video relative">
          {exercise?.videoUrl ? (
            <>
              {/* Video Thumbnail with Play Button */}
              <div
                className="w-full h-full flex items-center justify-center cursor-pointer group"
                onClick={() => setShowVideo(true)}
              >
                {exercise?.thumbnailUrl ? (
                  <img
                    src={exercise.thumbnailUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900" />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" />
                  </div>
                </div>
                <p className="absolute bottom-4 left-4 text-white text-sm font-medium">
                  Trykk for å se video
                </p>
              </div>
            </>
          ) : exercise?.imageUrl ? (
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-800 to-indigo-900 flex items-center justify-center">
              <Activity className="w-16 h-16 text-white/50" />
            </div>
          )}
        </div>

        {/* Exercise Info */}
        <div className="p-4 bg-white border-b border-gray-200">
          {/* Title and Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {exercise?.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {exercise.category}
              </span>
            )}
            {exercise?.difficultyLevel && (
              <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(exercise.difficultyLevel)}`}>
                {getDifficultyLabel(exercise.difficultyLevel)}
              </span>
            )}
            {exercise?.completedToday && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <Check className="w-3 h-3" />
                Fullført i dag
              </span>
            )}
          </div>

          {/* Parameters */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {exercise?.sets && (
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4 text-gray-400" />
                {exercise.sets} sett
              </span>
            )}
            {exercise?.reps && (
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-gray-400" />
                {exercise.reps} rep
              </span>
            )}
            {exercise?.holdSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                Hold {exercise.holdSeconds} sek
              </span>
            )}
            {exercise?.frequencyPerDay && (
              <span>{exercise.frequencyPerDay}x daglig</span>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-4 space-y-4">
          {/* Custom Instructions */}
          {exercise?.customInstructions && (
            <div className="p-4 bg-blue-50 rounded-xl">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Spesielle instruksjoner
              </h3>
              <p className="text-sm text-blue-800 whitespace-pre-line">
                {exercise.customInstructions}
              </p>
            </div>
          )}

          {/* Instructions */}
          {exercise?.instructions && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">Instruksjoner</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {exercise.instructions}
              </p>
            </div>
          )}

          {/* Description */}
          {exercise?.description && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">Beskrivelse</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {exercise.description}
              </p>
            </div>
          )}

          {/* Precautions */}
          {exercise?.precautions && exercise.precautions.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 mb-1">Forsiktighetsregler</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {exercise.precautions.map((p, i) => (
                      <li key={i}>- {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Contraindications */}
          {exercise?.contraindications && exercise.contraindications.length > 0 && (
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 mb-1">Kontraindikasjoner</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {exercise.contraindications.map((c, i) => (
                      <li key={i}>- {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Progress History */}
          {exercise?.progressHistory && exercise.progressHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">Fremgangshistorikk</span>
                  <span className="text-sm text-gray-500">
                    ({exercise.progressHistory.length})
                  </span>
                </div>
                {showHistory ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showHistory && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {exercise.progressHistory.map((entry, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(entry.completedAt).toLocaleDateString('nb-NO', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= entry.difficultyRating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {entry.setsCompleted && <span>{entry.setsCompleted} sett</span>}
                        {entry.repsCompleted && <span>{entry.repsCompleted} rep</span>}
                        {entry.painRating > 0 && (
                          <span className="text-orange-600">Smerte: {entry.painRating}/10</span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
          <div className="max-w-3xl mx-auto flex gap-3">
            {exercise?.videoUrl && (
              <button
                onClick={() => setShowVideo(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <Play className="w-5 h-5" />
                Se video
              </button>
            )}
            <button
              onClick={() => setShowFeedbackModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                exercise?.completedToday
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {exercise?.completedToday ? (
                <>
                  <Check className="w-5 h-5" />
                  Fullført
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Marker fullført
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="p-4 text-center text-sm text-gray-500 pb-24">
          <p>
            Stopp øvelsen hvis du opplever økt smerte.
          </p>
          {data?.clinic?.phone && (
            <a
              href={`tel:${data.clinic.phone}`}
              className="flex items-center justify-center gap-2 mt-2 text-blue-600 hover:underline"
            >
              <Phone className="w-4 h-4" />
              Kontakt klinikken: {data.clinic.phone}
            </a>
          )}
        </div>
      </main>

      {/* Video Player Modal */}
      {showVideo && exercise?.videoUrl && (
        <VimeoPlayer
          videoUrl={exercise.videoUrl}
          title={exercise.name}
          onClose={() => setShowVideo(false)}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Registrer fremgang</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-5">
              <p className="text-sm text-gray-600">{exercise?.name}</p>

              {/* Sets/Reps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sett fullført
                  </label>
                  <input
                    type="number"
                    value={feedbackData.setsCompleted}
                    onChange={(e) => setFeedbackData(prev => ({
                      ...prev,
                      setsCompleted: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setFeedbackData(prev => ({
                      ...prev,
                      repsCompleted: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackData(prev => ({ ...prev, difficultyRating: rating }))}
                      className={`flex-1 py-2.5 rounded-lg border transition-colors ${
                        feedbackData.difficultyRating === rating
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
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
                  onChange={(e) => setFeedbackData(prev => ({
                    ...prev,
                    painRating: parseInt(e.target.value)
                  }))}
                  className="w-full accent-blue-600"
                  min="0"
                  max="10"
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>Ingen smerte</span>
                  <span className="font-semibold text-gray-700">{feedbackData.painRating}</span>
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
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Hvordan føltes øvelsen?"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitProgress}
                disabled={submitting}
                className="w-full py-3.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Registrer fremgang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseDetail
