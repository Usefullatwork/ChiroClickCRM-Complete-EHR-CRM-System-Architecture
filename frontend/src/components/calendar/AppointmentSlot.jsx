/**
 * AppointmentSlot Component
 *
 * Individual appointment block displayed in calendar views
 * Color-coded by type, shows patient name and time
 */

import { format, parseISO } from 'date-fns'
import { User, Clock } from 'lucide-react'

export default function AppointmentSlot({
  appointment,
  top,
  height,
  typeStyle,
  statusStyle,
  onClick,
  translations,
  compact = false
}) {
  const startTime = parseISO(appointment.start_time)
  const endTime = parseISO(appointment.end_time)

  // Determine if we should show compact view
  const isCompact = compact || height < 40

  return (
    <div
      className={`absolute left-1 right-1 rounded-md overflow-hidden cursor-pointer
        pointer-events-auto transition-all hover:shadow-lg hover:z-30 border-l-4
        ${typeStyle.bgLight} ${typeStyle.borderColor}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '24px'
      }}
      onClick={onClick}
    >
      <div className="h-full p-1.5 flex flex-col">
        {/* Compact View - just time and name */}
        {isCompact ? (
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              {format(startTime, 'HH:mm')}
            </span>
            <span className="text-xs text-gray-600 truncate">
              {appointment.patient_name}
            </span>
          </div>
        ) : (
          <>
            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span className="font-medium">
                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </span>
            </div>

            {/* Patient Name */}
            <div className="flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800 truncate">
                {appointment.patient_name}
              </span>
            </div>

            {/* Type (if space allows) */}
            {height >= 64 && (
              <div className="mt-auto">
                <span className={`text-xs font-medium ${typeStyle.textColor}`}>
                  {typeStyle.label || appointment.appointment_type}
                </span>
              </div>
            )}

            {/* Status Badge (if space allows) */}
            {height >= 80 && (
              <div className="mt-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusStyle.color}`}>
                  {translations.statuses[appointment.status] || appointment.status}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Visual indicator for type on left edge */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${typeStyle.color}`}
      />
    </div>
  )
}

// Simplified version for list views
export function AppointmentListItem({
  appointment,
  typeStyle,
  statusStyle,
  onClick,
  translations,
  onConfirm,
  onCancel,
  onCheckIn
}) {
  const startTime = parseISO(appointment.start_time)
  const endTime = parseISO(appointment.end_time)
  const StatusIcon = statusStyle?.icon

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${typeStyle.bgLight} ${typeStyle.borderColor}
        hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Time and Status */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.color}`}>
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {translations.statuses[appointment.status] || appointment.status}
            </span>
          </div>

          {/* Patient Name */}
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-semibold text-gray-900">
              {appointment.patient_name}
            </span>
          </div>

          {/* Appointment Type */}
          <div className={`text-sm ${typeStyle.textColor}`}>
            {typeStyle.label || appointment.appointment_type}
          </div>

          {/* Notes */}
          {appointment.patient_notes && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {appointment.patient_notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          {appointment.status === 'PENDING' && onConfirm && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onConfirm(appointment)
              }}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
            >
              {translations.confirm}
            </button>
          )}
          {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && onCheckIn && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCheckIn(appointment)
              }}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              {translations.checkIn}
            </button>
          )}
          {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status) && onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancel(appointment)
              }}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              {translations.cancel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
