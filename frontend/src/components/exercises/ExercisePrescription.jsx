/**
 * Exercise Prescription Component
 * Create and manage exercise prescriptions for patients
 */

import React, { useState, useCallback } from 'react'
import {
  Plus,
  Minus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Send,
  FileText,
  Mail,
  MessageSquare,
  Dumbbell,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  Check,
  X,
  Edit2
} from 'lucide-react'

const ExercisePrescription = ({
  patient,
  encounterId,
  selectedExercises = [],
  onExercisesChange,
  onSave,
  onSendEmail,
  onSendSMS,
  onGeneratePDF,
  saving = false,
  sending = false
}) => {
  const [patientInstructions, setPatientInstructions] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false)

  // Move exercise up in order
  const moveExerciseUp = (index) => {
    if (index === 0) return
    const newExercises = [...selectedExercises]
    ;[newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]]
    onExercisesChange(newExercises)
  }

  // Move exercise down in order
  const moveExerciseDown = (index) => {
    if (index === selectedExercises.length - 1) return
    const newExercises = [...selectedExercises]
    ;[newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]]
    onExercisesChange(newExercises)
  }

  // Remove exercise from prescription
  const removeExercise = (index) => {
    const newExercises = selectedExercises.filter((_, i) => i !== index)
    onExercisesChange(newExercises)
  }

  // Update exercise parameters
  const updateExerciseParams = (index, field, value) => {
    const newExercises = [...selectedExercises]
    newExercises[index] = {
      ...newExercises[index],
      [field]: value
    }
    onExercisesChange(newExercises)
  }

  // Handle save
  const handleSave = async () => {
    if (onSave) {
      await onSave({
        patientId: patient?.id,
        encounterId,
        patientInstructions,
        clinicalNotes,
        exercises: selectedExercises.map((ex, index) => ({
          exerciseId: ex.exerciseId || ex.id,
          sets: ex.sets || ex.sets_default,
          reps: ex.reps || ex.reps_default,
          holdSeconds: ex.holdSeconds || ex.hold_seconds,
          frequencyPerDay: ex.frequencyPerDay || ex.frequency_per_day,
          frequencyPerWeek: ex.frequencyPerWeek || ex.frequency_per_week,
          customInstructions: ex.customInstructions,
          displayOrder: index
        }))
      })
    }
  }

  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-50'
      case 'intermediate': return 'text-yellow-600 bg-yellow-50'
      case 'advanced': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Øvelsesprogram</h2>
          </div>
          {patient && (
            <div className="text-sm text-gray-600">
              Pasient: <span className="font-medium">{patient.first_name} {patient.last_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Exercises */}
      <div className="flex-1 overflow-y-auto">
        {selectedExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Dumbbell className="w-12 h-12 text-gray-300 mb-3" />
            <p>Ingen øvelser valgt</p>
            <p className="text-sm text-gray-400">Velg øvelser fra biblioteket til venstre</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {selectedExercises.map((exercise, index) => (
              <div
                key={`${exercise.id}-${index}`}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Exercise Header */}
                <div className="flex items-center gap-2 p-3 bg-gray-50">
                  {/* Drag Handle */}
                  <div className="text-gray-400 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Order Number */}
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-sm font-medium rounded-full">
                    {index + 1}
                  </span>

                  {/* Exercise Name */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {exercise.name_norwegian || exercise.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{exercise.category}</span>
                      <span className={`px-1.5 py-0.5 rounded ${getDifficultyColor(exercise.difficulty_level)}`}>
                        {exercise.difficulty_level === 'beginner' ? 'Nybegynner' :
                         exercise.difficulty_level === 'intermediate' ? 'Middels' : 'Avansert'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveExerciseUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveExerciseDown(index)}
                      disabled={index === selectedExercises.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedExercise(expandedExercise === index ? null : index)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => removeExercise(index)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Parameters (Quick View) */}
                <div className="flex items-center gap-4 px-3 py-2 bg-white border-t border-gray-100 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Target className="w-3.5 h-3.5" />
                    <input
                      type="number"
                      value={exercise.sets || exercise.sets_default || 3}
                      onChange={(e) => updateExerciseParams(index, 'sets', parseInt(e.target.value))}
                      className="w-12 px-1 py-0.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                    <span className="text-gray-500">sett</span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-600">
                    <Activity className="w-3.5 h-3.5" />
                    <input
                      type="number"
                      value={exercise.reps || exercise.reps_default || 10}
                      onChange={(e) => updateExerciseParams(index, 'reps', parseInt(e.target.value))}
                      className="w-12 px-1 py-0.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="1"
                      max="100"
                    />
                    <span className="text-gray-500">rep</span>
                  </div>

                  {(exercise.hold_seconds || exercise.holdSeconds) && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      <input
                        type="number"
                        value={exercise.holdSeconds || exercise.hold_seconds || 0}
                        onChange={(e) => updateExerciseParams(index, 'holdSeconds', parseInt(e.target.value))}
                        className="w-12 px-1 py-0.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="300"
                      />
                      <span className="text-gray-500">sek</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="text-gray-500">×</span>
                    <input
                      type="number"
                      value={exercise.frequencyPerDay || exercise.frequency_per_day || 1}
                      onChange={(e) => updateExerciseParams(index, 'frequencyPerDay', parseInt(e.target.value))}
                      className="w-10 px-1 py-0.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                    <span className="text-gray-500">/dag</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedExercise === index && (
                  <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-3">
                    {/* Instructions */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Instruksjoner
                      </label>
                      <p className="text-sm text-gray-700">
                        {exercise.instructions_norwegian || exercise.instructions}
                      </p>
                    </div>

                    {/* Custom Instructions */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Spesielle instruksjoner for pasient
                      </label>
                      <textarea
                        value={exercise.customInstructions || ''}
                        onChange={(e) => updateExerciseParams(index, 'customInstructions', e.target.value)}
                        placeholder="Legg til spesielle instruksjoner..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>

                    {/* Precautions */}
                    {exercise.precautions && exercise.precautions.length > 0 && (
                      <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-yellow-700">Forsiktighetsregler:</span>
                          <ul className="text-xs text-yellow-600 mt-1">
                            {exercise.precautions.map((p, i) => (
                              <li key={i}>• {p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions & Notes */}
      {selectedExercises.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instruksjoner til pasient
            </label>
            <textarea
              value={patientInstructions}
              onChange={(e) => setPatientInstructions(e.target.value)}
              placeholder="F.eks. 'Gjør øvelsene morgen og kveld. Stopp hvis du opplever økt smerte.'"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kliniske notater (kun for journal)
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Interne notater som ikke sendes til pasient..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedExercises.length} øvelser valgt
          </div>

          <div className="flex items-center gap-2">
            {/* Delivery Options */}
            <div className="relative">
              <button
                onClick={() => setShowDeliveryOptions(!showDeliveryOptions)}
                disabled={selectedExercises.length === 0 || sending}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Send className="w-4 h-4" />
                Send til pasient
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showDeliveryOptions && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => { onSendEmail?.(); setShowDeliveryOptions(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Mail className="w-4 h-4" />
                    Send på e-post
                  </button>
                  <button
                    onClick={() => { onSendSMS?.(); setShowDeliveryOptions(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send SMS-lenke
                  </button>
                  <button
                    onClick={() => { onGeneratePDF?.(); setShowDeliveryOptions(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4" />
                    Last ned PDF
                  </button>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={selectedExercises.length === 0 || saving}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lagre program
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExercisePrescription
