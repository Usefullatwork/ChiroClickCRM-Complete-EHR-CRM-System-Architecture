/**
 * ExerciseLog Component
 * Logg over pasientens fullforte ovelser
 *
 * Log of patient's completed exercises
 */

import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Star,
  Filter,
  Download
} from 'lucide-react'

/**
 * ExerciseLog Component
 * Viser historikk over fullforte ovelser med detaljer
 *
 * @param {Object} props - Component props
 * @param {Array} props.logs - Array of exercise log entries
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onLoadMore - Callback to load more entries
 * @param {Function} props.onFilterChange - Callback when filter changes
 * @returns {JSX.Element} Exercise log component
 */
export default function ExerciseLog({
  logs = [],
  isLoading = false,
  onLoadMore,
  onFilterChange
}) {
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc')

  /**
   * Format date in Norwegian
   * Formaterer dato pa norsk
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('no-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Format time
   * Formaterer tid
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get pain level color
   * Henter smerteniva-farge
   */
  const getPainColor = (level) => {
    if (level <= 3) return 'text-green-600 bg-green-100'
    if (level <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  /**
   * Get difficulty rating display
   * Henter vanskelighetsgrad-visning
   */
  const getDifficultyStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  /**
   * Handle filter change
   * Handterer filterendring
   */
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    if (onFilterChange) {
      onFilterChange(newFilter)
    }
  }

  /**
   * Group logs by date
   * Grupperer logger etter dato
   */
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.completedAt).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(log)
    return groups
  }, {})

  /**
   * Export logs
   * Eksporterer logger
   */
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting exercise logs')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header / Overskrift */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Treningslogg</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Historikk over fullforte ovelser
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Eksporter
            </button>
          </div>
        </div>

        {/* Filters / Filtre */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Vis:</span>
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Alle' },
              { value: 'completed', label: 'Fullfort' },
              { value: 'partial', label: 'Delvis' },
              { value: 'skipped', label: 'Hoppet over' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Entries / Loggoppforinger */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">Laster treningslogg...</p>
          </div>
        ) : Object.keys(groupedLogs).length > 0 ? (
          Object.entries(groupedLogs)
            .sort(([a], [b]) => sortOrder === 'desc'
              ? new Date(b) - new Date(a)
              : new Date(a) - new Date(b)
            )
            .map(([date, dayLogs]) => (
              <div key={date}>
                {/* Date Header / Datooverskrift */}
                <div className="px-6 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700 capitalize">
                      {formatDate(date)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({dayLogs.length} {dayLogs.length === 1 ? 'ovelse' : 'ovelser'})
                    </span>
                  </div>
                </div>

                {/* Day's Entries / Dagens oppforinger */}
                {dayLogs.map((log, index) => (
                  <div
                    key={log.id || index}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedEntry(
                        expandedEntry === log.id ? null : log.id
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {/* Status Icon / Statusikon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            log.completed
                              ? 'bg-green-100'
                              : 'bg-yellow-100'
                          }`}>
                            {log.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>

                          {/* Exercise Info / Ovelsesinformasjon */}
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {log.exerciseName || 'Ukjent ovelse'}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(log.completedAt)}
                              </span>
                              {log.setsCompleted && (
                                <span>
                                  {log.setsCompleted}/{log.setsTarget || '?'} sett
                                </span>
                              )}
                              {log.repsCompleted && (
                                <span>
                                  {log.repsCompleted}/{log.repsTarget || '?'} rep
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expand Button / Utvid-knapp */}
                        <div className="flex items-center gap-2">
                          {log.painRating !== undefined && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPainColor(log.painRating)}`}>
                              Smerte: {log.painRating}/10
                            </span>
                          )}
                          {expandedEntry === log.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details / Utvidede detaljer */}
                    {expandedEntry === log.id && (
                      <div className="mt-4 ml-11 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Difficulty Rating / Vanskelighetsgrad */}
                          {log.difficultyRating !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Vanskelighetsgrad</p>
                              <div className="flex items-center gap-1">
                                {getDifficultyStars(log.difficultyRating)}
                              </div>
                            </div>
                          )}

                          {/* Pain Level / Smerteniva */}
                          {log.painRating !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Smerteniva</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                  <div
                                    className={`h-full rounded-full ${
                                      log.painRating <= 3 ? 'bg-green-500' :
                                      log.painRating <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${log.painRating * 10}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{log.painRating}/10</span>
                              </div>
                            </div>
                          )}

                          {/* Sets/Reps Completed / Sett/Rep fullfort */}
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Fullfort</p>
                            <p className="font-medium">
                              {log.setsCompleted || 0} sett, {log.repsCompleted || 0} repetisjoner
                            </p>
                          </div>

                          {/* Duration / Varighet */}
                          {log.duration && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Varighet</p>
                              <p className="font-medium">{log.duration} minutter</p>
                            </div>
                          )}
                        </div>

                        {/* Notes / Notater */}
                        {log.notes && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Pasientens notater</p>
                                <p className="text-sm text-gray-700">{log.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
        ) : (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Ingen treningslogg</h3>
            <p className="text-sm text-gray-500">
              Pasienten har ikke fullfort noen ovelser enna
            </p>
          </div>
        )}
      </div>

      {/* Load More / Last flere */}
      {logs.length > 0 && onLoadMore && (
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onLoadMore}
            className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Last flere oppforinger
          </button>
        </div>
      )}
    </div>
  )
}
