/**
 * Appointment Calendar - Visual Week/Day View
 *
 * Jane App-style visual calendar:
 * - Week view with day columns
 * - Day view with time slots
 * - Drag-and-drop scheduling
 * - Color-coded appointment types
 * - Provider filtering
 *
 * Bilingual: English/Norwegian
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  en: {
    calendar: 'Calendar',
    today: 'Today',
    week: 'Week',
    day: 'Day',
    newAppointment: 'New Appointment',
    noAppointments: 'No appointments',
    allProviders: 'All Providers',
    provider: 'Provider',
    patient: 'Patient',
    type: 'Type',
    time: 'Time',
    duration: 'Duration',
    minutes: 'min',
    cancel: 'Cancel',
    confirm: 'Confirm',
    checkIn: 'Check In',
    start: 'Start',
    reschedule: 'Reschedule',
    viewPatient: 'View Patient',
    walkin: 'Walk-in',
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
    inProgress: 'In Progress',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekDaysFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  no: {
    calendar: 'Kalender',
    today: 'I dag',
    week: 'Uke',
    day: 'Dag',
    newAppointment: 'Ny avtale',
    noAppointments: 'Ingen avtaler',
    allProviders: 'Alle behandlere',
    provider: 'Behandler',
    patient: 'Pasient',
    type: 'Type',
    time: 'Tid',
    duration: 'Varighet',
    minutes: 'min',
    cancel: 'Avlys',
    confirm: 'Bekreft',
    checkIn: 'Sjekk inn',
    start: 'Start',
    reschedule: 'Endre tid',
    viewPatient: 'Se pasient',
    walkin: 'Drop-in',
    confirmed: 'Bekreftet',
    pending: 'Venter',
    completed: 'Fullført',
    cancelled: 'Avlyst',
    noShow: 'Uteblitt',
    inProgress: 'Pågår',
    weekDays: ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'],
    weekDaysFull: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
    months: ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'],
  },
};

// =============================================================================
// CONSTANTS
// =============================================================================

const APPOINTMENT_TYPES = {
  NEW_PATIENT: { color: 'bg-blue-500', label: { en: 'New Patient', no: 'Ny pasient' } },
  FOLLOW_UP: { color: 'bg-green-500', label: { en: 'Follow-up', no: 'Oppfølging' } },
  ACUTE: { color: 'bg-red-500', label: { en: 'Acute', no: 'Akutt' } },
  MAINTENANCE: { color: 'bg-purple-500', label: { en: 'Maintenance', no: 'Vedlikehold' } },
  XRAY: { color: 'bg-orange-500', label: { en: 'X-Ray', no: 'Røntgen' } },
  EXAM: { color: 'bg-cyan-500', label: { en: 'Examination', no: 'Undersøkelse' } },
};

const WORK_HOURS = {
  start: 8, // 8 AM
  end: 18, // 6 PM
  slotDuration: 15, // minutes
};

// Mock providers - replace with real API data
const MOCK_PROVIDERS = [
  { id: 1, name: 'Dr. Olsen', color: 'blue' },
  { id: 2, name: 'Dr. Hansen', color: 'green' },
];

// Mock appointments - replace with real API data
const generateMockAppointments = (weekStart) => {
  const appointments = [];
  const baseDate = new Date(weekStart);

  const mockPatients = [
    { id: 101, name: 'Erik Hansen' },
    { id: 102, name: 'Maria Johansen' },
    { id: 103, name: 'Lars Pedersen' },
    { id: 104, name: 'Anne Kristiansen' },
    { id: 105, name: 'Knut Berg' },
    { id: 106, name: 'Ingrid Nilsen' },
  ];

  const types = Object.keys(APPOINTMENT_TYPES);
  const statuses = ['CONFIRMED', 'PENDING', 'COMPLETED'];

  // Generate some random appointments for the week
  for (let day = 1; day <= 5; day++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + day);

    const numAppointments = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < numAppointments; i++) {
      const hour = 8 + Math.floor(Math.random() * 9);
      const minute = Math.floor(Math.random() * 4) * 15;
      const patient = mockPatients[Math.floor(Math.random() * mockPatients.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const duration = [15, 30, 45, 60][Math.floor(Math.random() * 4)];

      appointments.push({
        id: `${day}-${i}`,
        date: date.toISOString().split('T')[0],
        startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        duration,
        patient,
        type,
        providerId: MOCK_PROVIDERS[Math.floor(Math.random() * MOCK_PROVIDERS.length)].id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  }

  return appointments;
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

function formatDate(date, lang) {
  const d = new Date(date);
  return d.toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getStatusStyle(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'border-l-green-500';
    case 'PENDING':
      return 'border-l-yellow-500';
    case 'COMPLETED':
      return 'border-l-blue-500';
    case 'CANCELLED':
      return 'border-l-red-500 opacity-50';
    case 'NO_SHOW':
      return 'border-l-gray-500 opacity-50';
    case 'IN_PROGRESS':
      return 'border-l-purple-500';
    default:
      return 'border-l-gray-300';
  }
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Time Column - Shows hours of the day
 */
function TimeColumn() {
  const hours = [];
  for (let h = WORK_HOURS.start; h <= WORK_HOURS.end; h++) {
    hours.push(h);
  }

  return (
    <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
      <div className="h-12 border-b border-gray-200 dark:border-gray-700" /> {/* Header space */}
      {hours.map((hour) => (
        <div
          key={hour}
          className="h-16 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 pr-2 text-right"
        >
          {String(hour).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
}

/**
 * Day Column - Shows a single day with appointments
 */
function DayColumn({ date, appointments, lang, isToday, onSlotClick, onAppointmentClick }) {
  const t = TRANSLATIONS[lang];
  const dayOfWeek = new Date(date).getDay();

  // Calculate slot positions
  const getSlotPosition = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = (hours - WORK_HOURS.start) * 60 + minutes;
    return (totalMinutes / 60) * 64; // 64px per hour (h-16 = 4rem = 64px)
  };

  const getSlotHeight = (duration) => {
    return (duration / 60) * 64;
  };

  return (
    <div className="flex-1 min-w-[120px] border-r border-gray-200 dark:border-gray-700 last:border-r-0">
      {/* Day Header */}
      <div
        className={`h-12 border-b border-gray-200 dark:border-gray-700 p-2 text-center ${
          isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
      >
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t.weekDays[dayOfWeek]}
        </div>
        <div
          className={`text-sm font-semibold ${
            isToday
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {new Date(date).getDate()}
        </div>
      </div>

      {/* Time Slots */}
      <div className="relative" style={{ height: `${(WORK_HOURS.end - WORK_HOURS.start + 1) * 64}px` }}>
        {/* Hour grid lines */}
        {Array.from({ length: WORK_HOURS.end - WORK_HOURS.start + 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-16 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
            style={{ top: `${i * 64}px` }}
            onClick={() => onSlotClick?.(date, WORK_HOURS.start + i)}
          />
        ))}

        {/* Appointments */}
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className={`absolute left-1 right-1 rounded-md p-1 cursor-pointer transition-all hover:shadow-md border-l-4 ${getStatusStyle(apt.status)} ${
              APPOINTMENT_TYPES[apt.type]?.color || 'bg-gray-200'
            } bg-opacity-20 dark:bg-opacity-30`}
            style={{
              top: `${getSlotPosition(apt.startTime)}px`,
              height: `${Math.max(getSlotHeight(apt.duration), 24)}px`,
            }}
            onClick={() => onAppointmentClick?.(apt)}
          >
            <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {apt.patient.name}
            </div>
            {apt.duration >= 30 && (
              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {apt.startTime} • {apt.duration}{t.minutes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Appointment Detail Modal
 */
function AppointmentModal({ appointment, lang, onClose, onAction }) {
  const t = TRANSLATIONS[lang];
  if (!appointment) return null;

  const typeInfo = APPOINTMENT_TYPES[appointment.type] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className={`p-4 rounded-t-xl ${typeInfo.color} bg-opacity-20`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {appointment.patient.name}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {typeInfo.label?.[lang] || appointment.type}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t.time}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {appointment.startTime} ({appointment.duration} {t.minutes})
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t.provider}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {MOCK_PROVIDERS.find((p) => p.id === appointment.providerId)?.name || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
              appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              appointment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {t[appointment.status?.toLowerCase()] || appointment.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
          {appointment.status === 'PENDING' && (
            <button
              onClick={() => onAction?.('confirm', appointment)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t.confirm}
            </button>
          )}
          {appointment.status === 'CONFIRMED' && (
            <button
              onClick={() => onAction?.('checkin', appointment)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.checkIn}
            </button>
          )}
          {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
            <>
              <button
                onClick={() => onAction?.('reschedule', appointment)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t.reschedule}
              </button>
              <button
                onClick={() => onAction?.('cancel', appointment)}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                {t.cancel}
              </button>
            </>
          )}
          <Link
            to={`/patients/${appointment.patient.id}`}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            {t.viewPatient}
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN CALENDAR COMPONENT
// =============================================================================

export default function AppointmentCalendar({
  lang = 'en',
  appointments: externalAppointments,
  providers = MOCK_PROVIDERS,
  onAppointmentAction,
  onNewAppointment,
}) {
  const t = TRANSLATIONS[lang];
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Get week start date
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [weekStart]);

  // Use external appointments or generate mock data
  const appointments = useMemo(() => {
    if (externalAppointments) return externalAppointments;
    return generateMockAppointments(weekStart);
  }, [externalAppointments, weekStart]);

  // Filter appointments by provider
  const filteredAppointments = useMemo(() => {
    if (!selectedProvider) return appointments;
    return appointments.filter((apt) => apt.providerId === selectedProvider);
  }, [appointments, selectedProvider]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    weekDates.forEach((date) => {
      grouped[date] = filteredAppointments.filter((apt) => apt.date === date);
    });
    return grouped;
  }, [filteredAppointments, weekDates]);

  // Navigation
  const goToToday = () => setCurrentDate(new Date());
  const goToPrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentDate(newDate);
  };
  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentDate(newDate);
  };

  // Check if a date is today
  const today = new Date().toISOString().split('T')[0];

  // Handle slot click for new appointment
  const handleSlotClick = useCallback((date, hour) => {
    if (onNewAppointment) {
      onNewAppointment({ date, time: `${String(hour).padStart(2, '0')}:00` });
    } else {
      navigate(`/appointments/new?date=${date}&time=${hour}:00`);
    }
  }, [onNewAppointment, navigate]);

  // Handle appointment action
  const handleAppointmentAction = useCallback((action, apt) => {
    setSelectedAppointment(null);
    if (onAppointmentAction) {
      onAppointmentAction(action, apt);
    } else {
      // Default behavior
      console.log('Action:', action, apt);
    }
  }, [onAppointmentAction]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Title and Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrev}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg"
            >
              {t.today}
            </button>
            <button
              onClick={goToNext}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              →
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.months[weekStart.getMonth()]} {weekStart.getFullYear()}
            </h2>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex items-center gap-3">
            {/* Provider Filter */}
            <select
              value={selectedProvider || ''}
              onChange={(e) => setSelectedProvider(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t.allProviders}</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {t.week}
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {t.day}
              </button>
            </div>

            {/* New Appointment Button */}
            <button
              onClick={() => handleSlotClick(today, 9)}
              className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + {t.newAppointment}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex overflow-x-auto">
        <TimeColumn />
        {viewMode === 'week' ? (
          weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              appointments={appointmentsByDate[date] || []}
              lang={lang}
              isToday={date === today}
              onSlotClick={handleSlotClick}
              onAppointmentClick={setSelectedAppointment}
            />
          ))
        ) : (
          <DayColumn
            date={currentDate.toISOString().split('T')[0]}
            appointments={appointmentsByDate[currentDate.toISOString().split('T')[0]] || []}
            lang={lang}
            isToday={currentDate.toISOString().split('T')[0] === today}
            onSlotClick={handleSlotClick}
            onAppointmentClick={setSelectedAppointment}
          />
        )}
      </div>

      {/* Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          lang={lang}
          onClose={() => setSelectedAppointment(null)}
          onAction={handleAppointmentAction}
        />
      )}
    </div>
  );
}

// Named exports
export { AppointmentModal, DayColumn, TimeColumn, APPOINTMENT_TYPES, WORK_HOURS };
