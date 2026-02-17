/**
 * LiveAppointmentBoard
 * Real-time appointment board with WebSocket updates
 * Day view showing time slots with colored appointment blocks
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { appointmentsAPI } from '../../services/api';
import { useSocketEvent, useSocketStatus } from '../../services/socket';

const TIME_SLOTS = [];
for (let h = 8; h <= 17; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}
// Add 18:00 as last slot
TIME_SLOTS.push('18:00');

const STATUS_COLORS = {
  scheduled: {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    text: 'text-blue-800',
    label: 'Planlagt',
  },
  confirmed: {
    bg: 'bg-blue-200',
    border: 'border-blue-500',
    text: 'text-blue-900',
    label: 'Bekreftet',
  },
  checked_in: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    label: 'Innsjekket',
  },
  in_progress: {
    bg: 'bg-green-100',
    border: 'border-green-400',
    text: 'text-green-800',
    label: 'Under behandling',
  },
  completed: {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-600',
    label: 'Fullfort',
  },
  cancelled: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-600', label: 'Avlyst' },
  no_show: {
    bg: 'bg-red-200',
    border: 'border-red-400',
    text: 'text-red-700',
    label: 'Ikke oppmott',
  },
};

const TYPE_ICONS = {
  initial: '1',
  follow_up: 'F',
  acute: 'A',
  reassessment: 'R',
};

function formatDate(date) {
  const d = new Date(date);
  const days = ['Son', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor'];
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'mai',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'des',
  ];
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function toDateString(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTimeFromISO(isoString) {
  if (!isoString) {
    return '08:00';
  }
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function _getSlotIndex(time) {
  const [h, m] = time.split(':').map(Number);
  return (h - 8) * 4 + Math.floor(m / 15);
}

function getDurationSlots(durationMinutes) {
  return Math.max(1, Math.ceil((durationMinutes || 30) / 15));
}

export default function LiveAppointmentBoard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const connected = useSocketStatus();

  const dateStr = useMemo(() => toDateString(selectedDate), [selectedDate]);

  // Fetch appointments for selected date
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAll({
        startDate: dateStr,
        endDate: dateStr,
        limit: 200,
      });
      const data = res.data;
      setAppointments(data.appointments || data.data || data || []);
    } catch (err) {
      // Appointment load failed — show empty state
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // WebSocket: appointment created
  useSocketEvent('appointment:created', (data) => {
    if (!data?.appointment) {
      return;
    }
    const apptDate = toDateString(data.appointment.start_time || data.appointment.appointment_date);
    if (apptDate === dateStr) {
      setAppointments((prev) => [...prev, data.appointment]);
    }
  });

  // WebSocket: appointment updated
  useSocketEvent('appointment:updated', (data) => {
    if (!data?.appointment) {
      return;
    }
    const appt = data.appointment;
    setAppointments((prev) => {
      const idx = prev.findIndex((a) => a.id === appt.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = appt;
        return updated;
      }
      // Might be a newly relevant appointment for this date
      const apptDate = toDateString(appt.start_time || appt.appointment_date);
      if (apptDate === dateStr) {
        return [...prev, appt];
      }
      return prev;
    });
  });

  // WebSocket: appointment cancelled
  useSocketEvent('appointment:cancelled', (data) => {
    if (!data?.appointmentId) {
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === data.appointmentId ? { ...a, status: 'cancelled' } : a))
    );
  });

  // Navigate dates
  const goToDay = (offset) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  };

  const goToToday = () => setSelectedDate(new Date());

  const isToday = toDateString(selectedDate) === toDateString(new Date());

  // Sort appointments by time for the queue sidebar
  const sortedAppointments = useMemo(() => {
    return [...appointments]
      .filter((a) => a.status !== 'cancelled')
      .sort((a, b) => {
        const tA = a.start_time || a.appointment_date || '';
        const tB = b.start_time || b.appointment_date || '';
        return tA.localeCompare(tB);
      });
  }, [appointments]);

  // Upcoming queue (not yet completed)
  const upcomingQueue = useMemo(() => {
    return sortedAppointments.filter((a) => !['completed', 'no_show'].includes(a.status));
  }, [sortedAppointments]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">Dagstavle</h2>
          <div className="flex items-center gap-1">
            {connected ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <WifiOff className="w-3 h-3" /> Frakoblet
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToDay(-1)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            aria-label="Forrige dag"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isToday ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            I dag
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
            {formatDate(selectedDate)}
          </span>
          <button
            onClick={() => goToDay(1)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            aria-label="Neste dag"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={fetchAppointments}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors ml-2"
            aria-label="Oppdater"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Body: Schedule + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Laster...
            </div>
          ) : (
            <div className="relative">
              {TIME_SLOTS.map((time, _i) => {
                const isHour = time.endsWith(':00');
                const slotAppointments = sortedAppointments.filter((a) => {
                  const apptTime = getTimeFromISO(a.start_time || a.appointment_date);
                  return apptTime === time;
                });

                return (
                  <div
                    key={time}
                    className={`flex min-h-[40px] border-b ${
                      isHour ? 'border-gray-300' : 'border-gray-100'
                    }`}
                  >
                    {/* Time label */}
                    <div
                      className={`w-16 flex-shrink-0 text-right pr-2 py-1 ${
                        isHour ? 'text-xs font-medium text-gray-600' : 'text-[10px] text-gray-400'
                      }`}
                    >
                      {isHour || time.endsWith(':30') ? time : ''}
                    </div>

                    {/* Appointment slots */}
                    <div className="flex-1 flex gap-1 px-1 py-0.5">
                      {slotAppointments.map((appt) => {
                        const status = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
                        const durationSlots = getDurationSlots(appt.duration_minutes);
                        const height = durationSlots * 40 - 4;
                        const typeIcon = TYPE_ICONS[appt.appointment_type] || '';

                        return (
                          <button
                            key={appt.id}
                            onClick={() =>
                              setSelectedAppointment(
                                selectedAppointment?.id === appt.id ? null : appt
                              )
                            }
                            className={`relative flex-1 max-w-[280px] rounded-md border-l-4 px-2 py-1 text-left transition-all hover:shadow-md cursor-pointer ${status.bg} ${status.border} ${status.text}`}
                            style={{ minHeight: `${height}px` }}
                          >
                            <div className="flex items-center gap-1">
                              {typeIcon && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/50 text-[10px] font-bold">
                                  {typeIcon}
                                </span>
                              )}
                              <span className="text-xs font-semibold truncate">
                                {appt.patient_name || `Pasient`}
                              </span>
                            </div>
                            <div className="text-[10px] opacity-75 truncate">
                              {appt.appointment_type || appt.type || 'Konsultasjon'}
                              {appt.practitioner_name ? ` - ${appt.practitioner_name}` : ''}
                            </div>
                            {selectedAppointment?.id === appt.id && (
                              <div className="mt-1 pt-1 border-t border-current/20 text-[10px]">
                                <div>Status: {status.label}</div>
                                {appt.duration_minutes && (
                                  <div>Varighet: {appt.duration_minutes} min</div>
                                )}
                                {appt.notes && <div className="truncate">Notat: {appt.notes}</div>}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Today's queue */}
        <div className="w-64 border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="px-3 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Ko ({upcomingQueue.length})
            </h3>
          </div>
          {upcomingQueue.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">Ingen avtaler i ko</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {upcomingQueue.map((appt) => {
                const status = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
                const time = getTimeFromISO(appt.start_time || appt.appointment_date);

                return (
                  <button
                    key={appt.id}
                    onClick={() =>
                      setSelectedAppointment(selectedAppointment?.id === appt.id ? null : appt)
                    }
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                      selectedAppointment?.id === appt.id ? 'bg-teal-50 ring-1 ring-teal-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500 w-10">{time}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {appt.patient_name || 'Pasient'}
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${status.bg} ${status.border} border`}
                          />
                          <span className={`text-[10px] ${status.text}`}>{status.label}</span>
                        </div>
                      </div>
                      {appt.status === 'checked_in' && (
                        <CheckCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                      {appt.status === 'in_progress' && (
                        <AlertCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="px-3 py-2 border-t border-gray-200 mt-auto">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white rounded p-1.5">
                <div className="text-lg font-bold text-gray-800">{sortedAppointments.length}</div>
                <div className="text-[10px] text-gray-500">Totalt</div>
              </div>
              <div className="bg-white rounded p-1.5">
                <div className="text-lg font-bold text-green-600">
                  {sortedAppointments.filter((a) => a.status === 'completed').length}
                </div>
                <div className="text-[10px] text-gray-500">Fullfort</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
