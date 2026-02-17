/**
 * Appointment Calendar View
 * Monthly and weekly calendar with appointment management
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  _Filter,
  Grid,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useTranslation, _formatDate, _formatTime } from '../i18n';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';

export default function Calendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation('appointments');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week' or 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch appointments for the current month
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', format(currentDate, 'yyyy-MM')],
    queryFn: () =>
      appointmentsAPI.getAll({
        startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
      }),
  });

  const appointments = appointmentsData?.data?.appointments || [];

  // Appointment status mutation
  const confirmMutation = useMutation({
    mutationFn: (id) => appointmentsAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentsAPI.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
    },
  });

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    return appointments
      .filter((apt) => isSameDay(parseISO(apt.start_time), date))
      .filter((apt) => statusFilter === 'ALL' || apt.status === statusFilter)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const today = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-3 h-3" />;
      case 'CANCELLED':
        return <XCircle className="w-3 h-3" />;
      case 'PENDING':
        return <Clock className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('calendar')}</h1>
          <p className="text-gray-600">{format(currentDate, 'MMMM yyyy')}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">{t('allStatus')}</option>
            <option value="PENDING">{t('pending')}</option>
            <option value="CONFIRMED">{t('confirmed')}</option>
            <option value="CANCELLED">{t('cancelled')}</option>
            <option value="COMPLETED">{t('completed')}</option>
            <option value="NO_SHOW">{t('noShow')}</option>
          </select>

          <button
            onClick={() => navigate('/appointments/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {t('newAppointment')}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={today}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t('today')}
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-lg font-semibold text-gray-900">
          {view === 'month' && format(currentDate, 'MMMM yyyy')}
          {view === 'week' && t('weekOf').replace('{date}', format(weekDays[0], 'MMM d, yyyy'))}
          {view === 'day' && format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>

        <div className="w-[200px]"></div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {(() => {
              const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
              return Array.from({ length: 7 }, (_, i) => {
                const d = addDays(weekStart, i);
                const label = d.toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US', {
                  weekday: 'short',
                });
                return (
                  <div
                    key={i}
                    className="px-2 py-3 text-center text-sm font-semibold text-gray-700"
                  >
                    {label}
                  </div>
                );
              });
            })()}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelectedDay = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedDate(day);
                    setView('day');
                  }}
                  className={`min-h-[120px] border-b border-r p-2 cursor-pointer transition-colors ${
                    !isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                  } ${isSelectedDay ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      !isCurrentMonth
                        ? 'text-gray-400'
                        : isTodayDate
                          ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                          : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Appointments */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-xs px-1.5 py-0.5 rounded border truncate ${getStatusColor(apt.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/appointments/${apt.id}`);
                        }}
                      >
                        {format(parseISO(apt.start_time), 'HH:mm')} {apt.patient_name}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 px-1.5">
                        {t('moreAppointments').replace('{count}', dayAppointments.length - 3)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div
                key={day.toString()}
                className={`p-4 text-center border-r ${isToday(day) ? 'bg-blue-50' : ''}`}
              >
                <div className="text-sm font-semibold text-gray-700">{format(day, 'EEE')}</div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="grid grid-cols-7">
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              return (
                <div key={day.toString()} className="border-r min-h-[400px] p-2">
                  <div className="space-y-2">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => navigate(`/appointments/${apt.id}`)}
                        className={`p-2 rounded border cursor-pointer ${getStatusColor(apt.status)}`}
                      >
                        <div className="flex items-center gap-1 text-xs font-semibold mb-1">
                          {getStatusIcon(apt.status)}
                          {format(parseISO(apt.start_time), 'HH:mm')}
                        </div>
                        <div className="text-sm font-medium truncate">{apt.patient_name}</div>
                        <div className="text-xs truncate">{apt.appointment_type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : getAppointmentsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('noAppointmentsScheduled')}</p>
                <button
                  onClick={() => navigate('/appointments/new')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  {t('scheduleAppointment')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {getAppointmentsForDate(selectedDate).map((apt) => (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(apt.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(apt.status)}
                          <span className="text-sm font-semibold uppercase">{apt.status}</span>
                        </div>

                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-1">
                          <User className="w-5 h-5" />
                          {apt.patient_name}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(parseISO(apt.start_time), 'HH:mm')} -{' '}
                            {format(parseISO(apt.end_time), 'HH:mm')}
                          </div>
                          <div>
                            {t('type')}: {apt.appointment_type}
                          </div>
                        </div>

                        {apt.notes && <p className="text-sm text-gray-600 mt-2">{apt.notes}</p>}
                      </div>

                      <div className="flex gap-2">
                        {apt.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => confirmMutation.mutate(apt.id)}
                              disabled={confirmMutation.isPending}
                              className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 disabled:opacity-50"
                            >
                              {t('confirm')}
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt(t('cancellationReasonPrompt'));
                                if (reason) {
                                  cancelMutation.mutate({ id: apt.id, reason });
                                }
                              }}
                              disabled={cancelMutation.isPending}
                              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 disabled:opacity-50"
                            >
                              {t('cancel')}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/appointments/${apt.id}`)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100"
                        >
                          {t('viewDetails')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
