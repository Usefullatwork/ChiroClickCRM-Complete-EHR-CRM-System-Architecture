/**
 * PrescriptionPreview Component
 * Forhandsvisning av treningsforskrivning som den vil vises for pasienten
 *
 * Preview of exercise prescription as it will appear to the patient
 */

import React, { useState } from 'react'
import {
  Dumbbell,
  User,
  Calendar,
  Phone,
  Play,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Tablet,
  Monitor,
  X,
  Copy,
  Check,
  Mail,
  Download,
  Info
} from 'lucide-react'

/**
 * PrescriptionPreview Component
 * Viser hvordan forskrivningen vil se ut for pasienten
 *
 * @param {Object} props - Component props
 * @param {Object} props.prescription - Prescription data to preview
 * @param {string} props.patientName - Patient name
 * @param {Object} props.clinic - Clinic information
 * @param {Function} props.onClose - Callback to close preview
 * @param {Function} props.onSendEmail - Callback to send email
 * @param {Function} props.onDownloadPDF - Callback to download PDF
 * @returns {JSX.Element} Prescription preview component
 */
export default function PrescriptionPreview({
  prescription,
  patientName = 'Pasient',
  patient,
  clinic,
  onClose,
  onConfirm,
  onSendEmail,
  onDownloadPDF
}) {
  const [viewMode, setViewMode] = useState('mobile')
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [copied, setCopied] = useState(false)

  // Use patient name from patient object if available
  const displayPatientName = patient?.name || patientName

  // Get exercises from prescription
  const exercises = prescription?.exercises || []

  /**
   * Get difficulty color
   * Henter vanskelighetsgrad-farge
   */
  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  /**
   * Get difficulty label in Norwegian
   * Henter vanskelighetsgrad-etikett pa norsk
   */
  const getDifficultyLabel = (level) => {
    const labels = {
      beginner: 'Nybegynner',
      intermediate: 'Middels',
      advanced: 'Avansert'
    }
    return labels[level] || level
  }

  /**
   * Format date for display
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Calculate estimated time
   */
  const calculateEstimatedTime = () => {
    return exercises.reduce((total, ex) => {
      const setsTime = (ex.sets || 3) * (ex.reps || 10) * 3
      const holdTime = (ex.holdSeconds || 0) * (ex.sets || 3)
      return total + setsTime + holdTime + 30
    }, 0)
  }

  /**
   * Handle copy link
   * Handterer kopiering av lenke
   */
  const handleCopyLink = () => {
    const link = `${window.location.origin}/portal/exercises/${prescription?.token || 'preview'}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /**
   * Get preview container class based on view mode
   * Henter forhandsvisningsbeholder-klasse basert pa visningsmodus
   */
  const getPreviewContainerClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'w-[375px] h-[667px]'
      case 'tablet':
        return 'w-[768px] h-[600px]'
      case 'desktop':
        return 'w-full h-full max-w-4xl'
      default:
        return 'w-[375px] h-[667px]'
    }
  }

  const totalTimeEstimate = calculateEstimatedTime()

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header / Overskrift */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Forhandsvisning</h2>
            <p className="text-sm text-gray-500">Slik vil programmet se ut for pasienten</p>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Selector / Visningsmoduvelger */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded-lg ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                title="Mobil"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`p-2 rounded-lg ${viewMode === 'tablet' ? 'bg-white shadow-sm' : ''}`}
                title="Nettbrett"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded-lg ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Copy Link / Kopier lenke */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopier lenke</span>
                </>
              )}
            </button>

            {/* Close Button / Lukk-knapp */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area / Forhandsvisningsomrade */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
          <div className={`bg-gray-800 rounded-[2rem] p-3 shadow-xl overflow-hidden ${
            viewMode === 'desktop' ? 'w-full max-w-4xl' : ''
          }`}>
            <div className={`bg-white rounded-[1.5rem] overflow-auto ${getPreviewContainerClass()}`}>
              {/* Patient Portal Preview / Pasientportal-forhandsvisning */}
              <div className="min-h-full bg-gray-50">
                {/* Portal Header / Portaloverskrift */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h1 className="font-semibold text-gray-900">
                          {clinic?.name || 'Klinikk'}
                        </h1>
                        <p className="text-sm text-gray-500">Ditt treningsprogram</p>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Portal Content / Portalinnhold */}
                <main className="p-4 space-y-4">
                  {/* Prescription Info / Forskrivningsinformasjon */}
                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <h2 className="font-semibold text-gray-900 mb-3">
                      Treningsprogram
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>For: {displayPatientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4" />
                        <span>{exercises.length} ovelser</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>~{Math.ceil(totalTimeEstimate / 60)} min</span>
                      </div>
                    </div>
                    {prescription?.patientInstructions && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">Instruksjoner:</p>
                            <p className="text-sm text-blue-800">{prescription.patientInstructions}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Summary / Fremgangssammendrag */}
                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Din fremgang i dag</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: '0%' }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        0 / {exercises.length}
                      </span>
                    </div>
                  </div>

                  {/* Exercise List / Ovelsesliste */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Ovelser ({exercises.length})
                    </h3>
                    <div className="space-y-3">
                      {exercises.length > 0 ? exercises.map((exercise, index) => (
                        <div
                          key={exercise.id || exercise.exerciseId || index}
                          className="bg-white rounded-xl shadow-sm overflow-hidden"
                        >
                          {/* Exercise Header / Ovelsesoverskrift */}
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedExercise(
                              expandedExercise === index ? null : index
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 font-medium">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900">
                                  {exercise.name_norwegian || exercise.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {exercise.category && (
                                    <span className="text-xs text-gray-500">{exercise.category}</span>
                                  )}
                                  {exercise.difficulty_level && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(exercise.difficulty_level)}`}>
                                      {getDifficultyLabel(exercise.difficulty_level)}
                                    </span>
                                  )}
                                  {exercise.video_url && (
                                    <span className="flex items-center gap-1 text-xs text-blue-600">
                                      <Play className="w-3 h-3" />
                                      Video
                                    </span>
                                  )}
                                </div>
                                {/* Parameters / Parametere */}
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Target className="w-4 h-4 text-gray-400" />
                                    {exercise.sets || 3} sett
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Activity className="w-4 h-4 text-gray-400" />
                                    {exercise.reps || 10} rep
                                  </span>
                                  {exercise.holdSeconds > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      {exercise.holdSeconds} sek
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-gray-400">
                                {expandedExercise === index ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content / Utvidet innhold */}
                          {expandedExercise === index && (
                            <div className="border-t border-gray-100 p-4">
                              {(exercise.instructions_norwegian || exercise.instructions) && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-1">
                                    Instruksjoner
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {exercise.instructions_norwegian || exercise.instructions}
                                  </p>
                                </div>
                              )}
                              {exercise.customInstructions && (
                                <div className="p-3 bg-blue-50 rounded-lg mb-3">
                                  <p className="text-sm text-blue-800">
                                    {exercise.customInstructions}
                                  </p>
                                </div>
                              )}
                              {exercise.precautions && exercise.precautions.length > 0 && (
                                <div className="p-3 bg-yellow-50 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-yellow-800">
                                        Forsiktighetsregler
                                      </p>
                                      <ul className="text-sm text-yellow-700 mt-1">
                                        {exercise.precautions.map((p, i) => (
                                          <li key={i}>- {p}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <button className="w-full mt-3 py-2.5 bg-blue-600 text-white rounded-lg font-medium">
                                Marker som fullfort
                              </button>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          Ingen ovelser i programmet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Program Duration */}
                  {(prescription?.startDate || prescription?.endDate) && (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <h3 className="font-medium text-gray-900">Programvarighet</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {prescription.startDate && (
                          <>Start: <strong>{formatDate(prescription.startDate)}</strong></>
                        )}
                        {prescription.startDate && prescription.endDate && ' - '}
                        {prescription.endDate && (
                          <>Slutt: <strong>{formatDate(prescription.endDate)}</strong></>
                        )}
                        {!prescription.endDate && prescription.startDate && (
                          <> (lopende program)</>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Footer Warning / Bunntekst-advarsel */}
                  <div className="text-center text-sm text-gray-500 pt-4 pb-8">
                    <p>
                      Stopp ovelsene hvis du opplever okt smerte og kontakt klinikken.
                    </p>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Bunntekst */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            Forhandsvisning - dette er hva pasienten vil se
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Lukk
            </button>
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Last ned PDF
              </button>
            )}
            {onSendEmail && (
              <button
                onClick={onSendEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Mail className="w-4 h-4" />
                Send pa e-post
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Bekreft og send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
