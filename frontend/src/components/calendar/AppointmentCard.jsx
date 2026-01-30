/**
 * AppointmentCard Component - Calendar Appointment Block
 *
 * Features:
 * - Color-coded by appointment type
 * - Status indicator
 * - Compact mode for short appointments
 * - Hover effects and click handling
 * - Norwegian labels
 */

import { format, parseISO } from 'date-fns'
import { Clock, User, CheckCircle, AlertCircle, XCircle, Phone, Video } from 'lucide-react'

// =============================================================================
// STATUS ICONS
// =============================================================================

const STATUS_ICONS = {
  SCHEDULED: Clock,
  CONFIRMED: CheckCircle,
  CHECKED_IN: CheckCircle,
  IN_PROGRESS: AlertCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
}

// =============================================================================
// TYPE ICONS
// =============================================================================

const TYPE_ICONS = {
  PHONE: Phone,
  VIDEO: Video,
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AppointmentCard({
  appointment,
  height,
  onClick,
  typeColors,
  statusColors,
  compact = false
}) {
  const startTime = parseISO(appointment.start_time)
  const endTime = parseISO(appointment.end_time)

  // Get styling from color maps
  const typeColor = typeColors[appointment.appointment_type] || {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-800',
    label: appointment.appointment_type
  }
  const statusColor = statusColors[appointment.status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: appointment.status
  }

  // Get status icon
  const StatusIcon = STATUS_ICONS[appointment.status] || Clock

  // Get type icon (for phone/video)
  const TypeIcon = TYPE_ICONS[appointment.appointment_type]

  // Determine if very compact (15 min slot)
  const isVeryCompact = height < 32
  const isCompact = compact || height < 48

  return (
    <div
      onClick={onClick}
      className={`
        h-full w-full rounded-md overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:z-30
        border-l-4 ${typeColor.border} ${typeColor.bg}
        hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50
      `}
    >
      <div className="h-full p-1.5 flex flex-col">
        {isVeryCompact ? (
          /* Very compact view - just time and name inline */
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">
              {format(startTime, 'HH:mm')}
            </span>
            <span className="text-[10px] text-gray-600 truncate">
              {appointment.patient_name?.split(' ')[0]}
            </span>
          </div>
        ) : isCompact ? (
          /* Compact view - time on top, name below */
          <>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-700">
                {format(startTime, 'HH:mm')}
              </span>
              {TypeIcon && <TypeIcon className="w-3 h-3 text-gray-500" />}
            </div>
            <div className="text-xs text-gray-800 font-medium truncate">
              {appointment.patient_name}
            </div>
          </>
        ) : (
          /* Full view */
          <>
            {/* Time row */}
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span className="font-semibold">
                  {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                </span>
              </div>
              {TypeIcon && <TypeIcon className="w-3.5 h-3.5 text-gray-500" />}
            </div>

            {/* Patient name */}
            <div className="flex items-center gap-1 mb-0.5">
              <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-bold text-gray-900 truncate">
                {appointment.patient_name}
              </span>
            </div>

            {/* Type label - show if enough space */}
            {height >= 56 && (
              <div className={`text-xs font-medium ${typeColor.text} truncate`}>
                {typeColor.label}
              </div>
            )}

            {/* Status badge - show if enough space */}
            {height >= 72 && (
              <div className="mt-auto pt-1">
                <span className={`
                  inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                  ${statusColor.bg} ${statusColor.text}
                `}>
                  <StatusIcon className="w-3 h-3" />
                  {statusColor.label}
                </span>
              </div>
            )}

            {/* Practitioner name - show if lots of space */}
            {height >= 90 && appointment.practitioner_name && (
              <div className="text-[10px] text-gray-500 truncate mt-1">
                {appointment.practitioner_name}
              </div>
            )}
          </>
        )}
      </div>

      {/* Left edge type indicator bar (already have border-l-4 but adding subtle gradient) */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${typeColor.bg} opacity-50`}
        style={{ backgroundColor: 'currentColor' }}
      />
    </div>
  )
}

// =============================================================================
// LIST ITEM VARIANT
// =============================================================================

export function AppointmentListCard({
  appointment,
  onClick,
  typeColors,
  statusColors,
  onConfirm,
  onCancel,
  onCheckIn
}) {
  const startTime = parseISO(appointment.start_time)
  const endTime = parseISO(appointment.end_time)

  const typeColor = typeColors[appointment.appointment_type] || {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-800',
    label: appointment.appointment_type
  }
  const statusColor = statusColors[appointment.status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: appointment.status
  }

  const StatusIcon = STATUS_ICONS[appointment.status] || Clock
  const TypeIcon = TYPE_ICONS[appointment.appointment_type]

  const canConfirm = appointment.status === 'SCHEDULED'
  const canCheckIn = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status)
  const canCancel = !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)

  return (
    <div
      className={`
        p-4 rounded-lg border-l-4 bg-white
        hover:shadow-md transition-shadow cursor-pointer
        ${typeColor.border}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Time and Status */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">
                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </span>
            </div>
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${statusColor.bg} ${statusColor.text}
            `}>
              <StatusIcon className="w-3 h-3" />
              {statusColor.label}
            </span>
          </div>

          {/* Patient Name */}
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-lg font-bold text-gray-900 truncate">
              {appointment.patient_name}
            </span>
          </div>

          {/* Type */}
          <div className="flex items-center gap-2">
            {TypeIcon && <TypeIcon className="w-4 h-4 text-gray-400" />}
            <span className={`text-sm font-medium ${typeColor.text}`}>
              {typeColor.label}
            </span>
          </div>

          {/* Practitioner */}
          {appointment.practitioner_name && (
            <div className="text-sm text-gray-500 mt-1">
              Behandler: {appointment.practitioner_name}
            </div>
          )}

          {/* Notes */}
          {appointment.patient_notes && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {appointment.patient_notes}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          {canConfirm && onConfirm && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onConfirm(appointment)
              }}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              Bekreft
            </button>
          )}
          {canCheckIn && onCheckIn && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCheckIn(appointment)
              }}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Sjekk inn
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancel(appointment)
              }}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Avlys
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
