/**
 * DayView Component - Single Day Calendar View
 *
 * Features:
 * - Full day time grid from 8:00 to 18:00
 * - Click time slot to book
 * - Color-coded appointments by type
 * - Norwegian date formatting
 * - Current time indicator
 * - Sidebar with appointment list
 */

import { useMemo, useRef, useEffect } from 'react'
import { format, parseISO, isToday, differenceInMinutes } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Calendar as CalendarIcon, Plus, Clock, User } from 'lucide-react'
import AppointmentCard from './AppointmentCard'

// =============================================================================
// CONSTANTS
// =============================================================================

const HOUR_HEIGHT = 64 // pixels per hour
const SLOT_HEIGHT = HOUR_HEIGHT / 4 // 15 minute slots

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getAppointmentStyle(appointment, workHours) {
  const startTime = parseISO(appointment.start_time)
  const endTime = parseISO(appointment.end_time)

  const startHour = startTime.getHours()
  const startMinute = startTime.getMinutes()

  const minutesFromStart = (startHour - workHours.start) * 60 + startMinute
  const top = (minutesFromStart / 60) * HOUR_HEIGHT

  const durationMinutes = differenceInMinutes(endTime, startTime)
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 32)

  return { top, height }
}

function generateTimeSlots(workHours) {
  const slots = []
  for (let hour = workHours.start; hour < workHours.end; hour++) {
    slots.push({ hour, minute: 0 })
    slots.push({ hour, minute: 15 })
    slots.push({ hour, minute: 30 })
    slots.push({ hour, minute: 45 })
  }
  return slots
}

// =============================================================================
// APPOINTMENT LIST ITEM
// =============================================================================

function AppointmentListItem({ appointment, typeColors, statusColors, onClick }) {
  const startTime = parseISO(appointment.start_time)
  const endTime = parseISO(appointment.end_time)
  const typeColor = typeColors[appointment.appointment_type] || typeColors.FOLLOWUP
  const statusColor = statusColors[appointment.status] || statusColors.SCHEDULED

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border-l-4 bg-white cursor-pointer hover:shadow-md transition-all ${typeColor.border}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="font-medium">
            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
          {statusColor.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-gray-900">{appointment.patient_name}</span>
      </div>
      <div className={`text-xs mt-1 ${typeColor.text}`}>
        {typeColor.label}
      </div>
      {appointment.patient_notes && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {appointment.patient_notes}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// CURRENT TIME INDICATOR
// =============================================================================

function CurrentTimeIndicator({ workHours }) {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  if (currentHour < workHours.start || currentHour >= workHours.end) {
    return null
  }

  const top = ((currentHour - workHours.start) * 60 + currentMinute) / 60 * HOUR_HEIGHT

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  )
}

// =============================================================================
// MAIN DAY VIEW COMPONENT
// =============================================================================

export default function DayView({
  date,
  appointments,
  workHours,
  slotDuration,
  onSlotClick,
  onAppointmentClick,
  typeColors,
  statusColors,
  isLoading
}) {
  const scrollContainerRef = useRef(null)
  const isTodayDate = isToday(date)
  const slots = generateTimeSlots(workHours)

  // Filter out cancelled/no-show for grid
  const visibleAppointments = useMemo(() => {
    return appointments.filter(apt => !['CANCELLED', 'NO_SHOW'].includes(apt.status))
  }, [appointments])

  // Position appointments with overlap handling
  const positionedAppointments = useMemo(() => {
    if (!visibleAppointments || visibleAppointments.length === 0) return []

    const sorted = [...visibleAppointments].sort((a, b) =>
      new Date(a.start_time) - new Date(b.start_time)
    )

    const positioned = []
    const columns = []

    sorted.forEach((apt) => {
      const aptStart = parseISO(apt.start_time)
      const aptEnd = parseISO(apt.end_time)

      let columnIndex = 0
      while (columns[columnIndex]) {
        const lastInColumn = columns[columnIndex][columns[columnIndex].length - 1]
        const lastEnd = parseISO(lastInColumn.end_time)
        if (aptStart >= lastEnd) {
          break
        }
        columnIndex++
      }

      if (!columns[columnIndex]) {
        columns[columnIndex] = []
      }
      columns[columnIndex].push(apt)

      positioned.push({
        ...apt,
        columnIndex,
        totalColumns: 0
      })
    })

    return positioned.map((apt) => ({
      ...apt,
      totalColumns: columns.length
    }))
  }, [visibleAppointments])

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current && isTodayDate) {
      const now = new Date()
      const currentHour = now.getHours()

      if (currentHour >= workHours.start && currentHour < workHours.end) {
        const scrollPosition = Math.max(0, ((currentHour - workHours.start - 1) * HOUR_HEIGHT))
        scrollContainerRef.current.scrollTop = scrollPosition
      }
    }
  }, [workHours, isTodayDate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Laster dag...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-white">
      {/* Main time grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day header */}
        <div className={`px-6 py-4 border-b border-gray-200 ${isTodayDate ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <h2 className={`text-xl font-bold capitalize ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
            {format(date, 'EEEE d. MMMM yyyy', { locale: nb })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {appointments.length} {appointments.length === 1 ? 'avtale' : 'avtaler'}
          </p>
        </div>

        {/* Time grid */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          <div className="flex">
            {/* Time column */}
            <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
              {Array.from({ length: workHours.end - workHours.start }).map((_, i) => {
                const hour = workHours.start + i
                return (
                  <div
                    key={hour}
                    className="relative"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="absolute top-0 right-3 -translate-y-1/2 text-sm text-gray-500 font-medium">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Appointments column */}
            <div
              className={`flex-1 relative ${isTodayDate ? 'bg-blue-50/20' : ''}`}
              style={{ height: `${(workHours.end - workHours.start) * HOUR_HEIGHT}px` }}
            >
              {/* Hour grid lines */}
              {Array.from({ length: workHours.end - workHours.start }).map((_, i) => (
                <div key={i}>
                  <div
                    className="absolute w-full border-b border-gray-200"
                    style={{ top: `${(i + 1) * HOUR_HEIGHT}px` }}
                  />
                  <div
                    className="absolute w-full border-b border-dashed border-gray-100"
                    style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                  />
                </div>
              ))}

              {/* Clickable time slots */}
              {slots.map(({ hour, minute }) => {
                const slotTop = ((hour - workHours.start) * 60 + minute) / 60 * HOUR_HEIGHT
                return (
                  <div
                    key={`${hour}-${minute}`}
                    className="absolute w-full cursor-pointer hover:bg-blue-50/50 transition-colors"
                    style={{
                      top: `${slotTop}px`,
                      height: `${SLOT_HEIGHT}px`
                    }}
                    onClick={() => onSlotClick(date, hour, minute)}
                  />
                )
              })}

              {/* Current time indicator */}
              {isTodayDate && <CurrentTimeIndicator workHours={workHours} />}

              {/* Appointments */}
              {positionedAppointments.map((apt) => {
                const style = getAppointmentStyle(apt, workHours)
                const width = apt.totalColumns > 1
                  ? `calc(${100 / apt.totalColumns}% - 8px)`
                  : 'calc(100% - 16px)'
                const left = apt.totalColumns > 1
                  ? `calc(${(apt.columnIndex / apt.totalColumns) * 100}% + 8px)`
                  : '8px'

                return (
                  <div
                    key={apt.id}
                    className="absolute"
                    style={{
                      top: `${style.top}px`,
                      height: `${style.height}px`,
                      width,
                      left,
                      zIndex: 10
                    }}
                  >
                    <AppointmentCard
                      appointment={apt}
                      height={style.height}
                      onClick={() => onAppointmentClick(apt)}
                      typeColors={typeColors}
                      statusColors={statusColors}
                      compact={style.height < 50}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar with appointment list */}
      <div className="w-80 border-l border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Dagens avtaler</h3>
            <button
              onClick={() => onSlotClick(date, 9, 0)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ny avtale"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Ingen avtaler denne dagen</p>
              <button
                onClick={() => onSlotClick(date, 9, 0)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ny avtale
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <AppointmentListItem
                  key={apt.id}
                  appointment={apt}
                  typeColors={typeColors}
                  statusColors={statusColors}
                  onClick={() => onAppointmentClick(apt)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
