/**
 * WeekView Component - Weekly Calendar Grid
 *
 * Features:
 * - Time grid from 8:00 to 18:00 (configurable work hours)
 * - 15-minute slot intervals for precise booking
 * - Click empty slot to book new appointment
 * - Color-coded appointments by type
 * - Norwegian day names
 * - Current time indicator (red line)
 * - Overlapping appointment handling
 */

import { useMemo, useRef, useEffect } from 'react';
import { format, parseISO, isToday, differenceInMinutes, _isSameDay } from 'date-fns';
import { _nb } from 'date-fns/locale';
import AppointmentCard from './AppointmentCard';

// =============================================================================
// CONSTANTS
// =============================================================================

const HOUR_HEIGHT = 64; // pixels per hour (4rem)
const SLOT_HEIGHT = HOUR_HEIGHT / 4; // 15 minute slots = 16px

// Norwegian day names (abbreviated)
const NORWEGIAN_DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor', 'Son'];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate appointment position and height based on time
 */
function getAppointmentStyle(appointment, workHours) {
  const startTime = parseISO(appointment.start_time);
  const endTime = parseISO(appointment.end_time);

  const startHour = startTime.getHours();
  const startMinute = startTime.getMinutes();

  // Calculate top position (minutes from work start)
  const minutesFromStart = (startHour - workHours.start) * 60 + startMinute;
  const top = (minutesFromStart / 60) * HOUR_HEIGHT;

  // Calculate height
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24); // minimum 24px

  return { top, height };
}

/**
 * Generate time slots for the day
 */
function generateTimeSlots(workHours) {
  const slots = [];
  for (let hour = workHours.start; hour < workHours.end; hour++) {
    slots.push({ hour, minute: 0 });
    slots.push({ hour, minute: 15 });
    slots.push({ hour, minute: 30 });
    slots.push({ hour, minute: 45 });
  }
  return slots;
}

// =============================================================================
// TIME COLUMN COMPONENT
// =============================================================================

function TimeColumn({ workHours }) {
  const hours = [];
  for (let h = workHours.start; h <= workHours.end; h++) {
    hours.push(h);
  }

  return (
    <div className="flex-shrink-0 w-16 border-r border-gray-200 bg-gray-50">
      {/* Header spacer */}
      <div className="h-14 border-b border-gray-200" />

      {/* Time labels */}
      <div className="relative">
        {hours.slice(0, -1).map((hour) => (
          <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
            <span className="absolute -top-2.5 right-2 text-xs text-gray-500 font-medium">
              {String(hour).padStart(2, '0')}:00
            </span>
            {/* Half hour mark */}
            <span className="absolute top-[29px] right-2 text-[10px] text-gray-400">:30</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// DAY COLUMN COMPONENT
// =============================================================================

function DayColumn({
  date,
  appointments,
  workHours,
  onSlotClick,
  onAppointmentClick,
  typeColors,
  statusColors,
}) {
  const dayOfWeek = date.getDay();
  const isTodayDate = isToday(date);
  const dayName = NORWEGIAN_DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

  // Generate clickable time slots
  const slots = generateTimeSlots(workHours);

  // Calculate current time indicator position
  const currentTimePosition = useMemo(() => {
    if (!isTodayDate) {
      return null;
    }
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < workHours.start || currentHour >= workHours.end) {
      return null;
    }

    const minutesFromStart = (currentHour - workHours.start) * 60 + currentMinute;
    return (minutesFromStart / 60) * HOUR_HEIGHT;
  }, [isTodayDate, workHours]);

  // Handle collision detection - stack overlapping appointments
  const positionedAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return [];
    }

    // Filter out cancelled and no-show appointments
    const visibleAppointments = appointments.filter(
      (apt) => !['CANCELLED', 'NO_SHOW'].includes(apt.status)
    );

    const sorted = [...visibleAppointments].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    );

    const positioned = [];
    const columns = [];

    sorted.forEach((apt) => {
      const aptStart = parseISO(apt.start_time);
      const _aptEnd = parseISO(apt.end_time);

      // Find the first column where this appointment fits
      let columnIndex = 0;
      while (columns[columnIndex]) {
        const lastInColumn = columns[columnIndex][columns[columnIndex].length - 1];
        const lastEnd = parseISO(lastInColumn.end_time);
        if (aptStart >= lastEnd) {
          break;
        }
        columnIndex++;
      }

      if (!columns[columnIndex]) {
        columns[columnIndex] = [];
      }
      columns[columnIndex].push(apt);

      positioned.push({
        ...apt,
        columnIndex,
        totalColumns: 0, // Will be updated
      });
    });

    // Update total columns for width calculation
    return positioned.map((apt) => ({
      ...apt,
      totalColumns: columns.length,
    }));
  }, [appointments]);

  return (
    <div className="flex-1 min-w-[140px] border-r border-gray-200 last:border-r-0">
      {/* Day header */}
      <div
        className={`h-14 border-b border-gray-200 p-2 text-center sticky top-0 z-10 ${
          isTodayDate ? 'bg-blue-50' : 'bg-white'
        }`}
      >
        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{dayName}</div>
        <div
          className={`text-lg font-bold mt-0.5 ${
            isTodayDate
              ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
              : 'text-gray-900'
          }`}
        >
          {format(date, 'd')}
        </div>
      </div>

      {/* Time grid */}
      <div
        className="relative"
        style={{ height: `${(workHours.end - workHours.start) * HOUR_HEIGHT}px` }}
      >
        {/* Hour grid lines */}
        {Array.from({ length: workHours.end - workHours.start }).map((_, i) => (
          <div key={i}>
            {/* Full hour line */}
            <div
              className="absolute w-full border-b border-gray-200"
              style={{ top: `${(i + 1) * HOUR_HEIGHT}px` }}
            />
            {/* Half hour line */}
            <div
              className="absolute w-full border-b border-dashed border-gray-100"
              style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
            />
          </div>
        ))}

        {/* Clickable time slots */}
        {slots.map(({ hour, minute }) => {
          const slotTop = (((hour - workHours.start) * 60 + minute) / 60) * HOUR_HEIGHT;
          return (
            <div
              key={`${hour}-${minute}`}
              className="absolute w-full cursor-pointer hover:bg-blue-50/50 transition-colors"
              style={{
                top: `${slotTop}px`,
                height: `${SLOT_HEIGHT}px`,
              }}
              onClick={() => onSlotClick(date, hour, minute)}
            />
          );
        })}

        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          </div>
        )}

        {/* Appointments */}
        {positionedAppointments.map((apt) => {
          const style = getAppointmentStyle(apt, workHours);
          const width =
            apt.totalColumns > 1 ? `calc(${100 / apt.totalColumns}% - 4px)` : 'calc(100% - 8px)';
          const left =
            apt.totalColumns > 1
              ? `calc(${(apt.columnIndex / apt.totalColumns) * 100}% + 4px)`
              : '4px';

          return (
            <div
              key={apt.id}
              className="absolute"
              style={{
                top: `${style.top}px`,
                height: `${style.height}px`,
                width,
                left,
                right: apt.totalColumns > 1 ? undefined : '4px',
                zIndex: 10,
              }}
            >
              <AppointmentCard
                appointment={apt}
                height={style.height}
                onClick={() => onAppointmentClick(apt)}
                typeColors={typeColors}
                statusColors={statusColors}
                compact={style.height < 40}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN WEEK VIEW COMPONENT
// =============================================================================

export default function WeekView({
  weekDates,
  appointments,
  workHours,
  _slotDuration,
  onSlotClick,
  onAppointmentClick,
  typeColors,
  statusColors,
  isLoading,
}) {
  const scrollContainerRef = useRef(null);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= workHours.start && currentHour < workHours.end) {
        // Scroll to show current time in the upper third of the view
        const scrollPosition = Math.max(0, (currentHour - workHours.start - 1) * HOUR_HEIGHT);
        scrollContainerRef.current.scrollTop = scrollPosition;
      }
    }
  }, [workHours]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Laster kalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div className="flex min-w-max">
          {/* Time column */}
          <TimeColumn workHours={workHours} />

          {/* Day columns */}
          {weekDates.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayAppointments = appointments[dateKey] || [];

            return (
              <DayColumn
                key={dateKey}
                date={date}
                appointments={dayAppointments}
                workHours={workHours}
                onSlotClick={onSlotClick}
                onAppointmentClick={onAppointmentClick}
                typeColors={typeColors}
                statusColors={statusColors}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
