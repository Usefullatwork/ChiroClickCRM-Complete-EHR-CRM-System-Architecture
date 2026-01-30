/**
 * NotesList Component
 * Liste over kliniske notater for en pasient
 *
 * List of clinical notes for a patient
 */

import React from 'react'
import {
  FileText,
  Calendar,
  User,
  Clock,
  ChevronRight,
  Edit,
  Trash2,
  Lock,
  Eye,
  Printer,
  Download,
  Plus,
  AlertTriangle
} from 'lucide-react'

/**
 * NotesList Component
 * Viser en liste over kliniske notater
 *
 * @param {Object} props - Component props
 * @param {Array} props.notes - List of notes to display
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onViewNote - Callback when viewing note
 * @param {Function} props.onEditNote - Callback when editing note
 * @param {Function} props.onDeleteNote - Callback when deleting note
 * @param {Function} props.onPrintNote - Callback when printing note
 * @param {Function} props.onExportNote - Callback when exporting note
 * @param {string} props.selectedPatientId - Selected patient ID
 * @param {Function} props.getNoteTypeBadge - Function to get badge style
 * @param {Function} props.getNoteTypeLabel - Function to get type label
 * @returns {JSX.Element} Notes list component
 */
export default function NotesList({
  notes = [],
  isLoading = false,
  onViewNote,
  onEditNote,
  onDeleteNote,
  onPrintNote,
  onExportNote,
  selectedPatientId,
  getNoteTypeBadge,
  getNoteTypeLabel
}) {
  /**
   * Format date for display
   * Formater dato for visning
   */
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Format time for display
   * Formater tid for visning
   */
  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get status badge
   * Henter statusmerke
   */
  const getStatusBadge = (note) => {
    if (note.signed_at) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
          <Lock className="w-3 h-3" />
          Signert
        </span>
      )
    }
    if (note.is_draft) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
          Utkast
        </span>
      )
    }
    return null
  }

  /**
   * Get diagnosis codes display
   * Henter diagnosekoder for visning
   */
  const getDiagnosisCodes = (note) => {
    const codes = []
    if (note.icd10_codes?.length > 0) {
      codes.push(...note.icd10_codes)
    }
    if (note.icpc_codes?.length > 0) {
      codes.push(...note.icpc_codes)
    }
    return codes.slice(0, 3)
  }

  /**
   * Get chief complaint preview
   * Henter hovedklage-forhandsvisning
   */
  const getChiefComplaint = (note) => {
    try {
      const subjective = typeof note.subjective === 'string'
        ? JSON.parse(note.subjective)
        : note.subjective

      return subjective?.chiefComplaint ||
             subjective?.chief_complaint ||
             subjective?.hovedklage ||
             null
    } catch {
      return null
    }
  }

  // Show empty state if no patient selected
  if (!selectedPatientId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Ingen pasient valgt</h3>
        <p className="text-sm text-gray-500">
          Velg en pasient for a se deres kliniske notater
        </p>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-3">Laster notater...</p>
      </div>
    )
  }

  // Show empty state if no notes
  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Ingen notater</h3>
        <p className="text-sm text-gray-500 mb-4">
          Det er ingen kliniske notater for denne pasienten enna
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header / Overskrift */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Notater ({notes.length})
        </h2>
      </div>

      {/* Notes List / Notatliste */}
      <div className="divide-y divide-gray-100">
        {notes.map((note) => {
          const chiefComplaint = getChiefComplaint(note)
          const diagnosisCodes = getDiagnosisCodes(note)
          const isLocked = !!note.signed_at

          return (
            <div
              key={note.id}
              className="group hover:bg-gray-50 transition-colors"
            >
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  {/* Note Info / Notatinformasjon */}
                  <div
                    className="flex items-start gap-4 flex-1 cursor-pointer"
                    onClick={() => onViewNote(note.id)}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isLocked ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-gray-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Top row - Date and Type */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {formatDate(note.note_date)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          getNoteTypeBadge(note.template_type)
                        }`}>
                          {getNoteTypeLabel(note.template_type)}
                        </span>
                        {getStatusBadge(note)}
                      </div>

                      {/* Chief Complaint / Hovedklage */}
                      {chiefComplaint && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {chiefComplaint}
                        </p>
                      )}

                      {/* Diagnosis Codes / Diagnosekoder */}
                      {diagnosisCodes.length > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          {diagnosisCodes.map((code, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {code}
                            </span>
                          ))}
                          {(note.icd10_codes?.length + note.icpc_codes?.length) > 3 && (
                            <span className="text-xs text-gray-400">
                              +{(note.icd10_codes?.length + note.icpc_codes?.length) - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(note.note_date)}
                        </span>
                        {note.practitioner_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {note.practitioner_name}
                          </span>
                        )}
                        {note.duration_minutes && (
                          <span>
                            {note.duration_minutes} min
                          </span>
                        )}
                        {note.vas_pain_start != null && note.vas_pain_end != null && (
                          <span className="flex items-center gap-1">
                            VAS: {note.vas_pain_start} {'->'} {note.vas_pain_end}
                          </span>
                        )}
                      </div>

                      {/* Red flags warning / Rode flagg-advarsel */}
                      {note.assessment?.redFlags?.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          {note.assessment.redFlags.length} rode flagg
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Handlinger */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewNote(note.id)
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Se notat"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!isLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditNote(note)
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Rediger notat"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPrintNote(note.id)
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Skriv ut"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onExportNote(note.id)
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Last ned"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!isLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteNote(note.id)
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Slett notat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More / Last flere */}
      {notes.length >= 20 && (
        <div className="px-6 py-4 border-t border-gray-100 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Last flere notater...
          </button>
        </div>
      )}
    </div>
  )
}
