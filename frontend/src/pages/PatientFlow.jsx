/**
 * PatientFlow Page - Visual Kanban patient flow dashboard
 *
 * Displays today's appointments in a drag-and-drop Kanban board
 * for easy patient status tracking and workflow management.
 */

import _React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, _Filter, Monitor, Users } from 'lucide-react';
import PatientFlowBoard from '../components/PatientFlowBoard';
import { appointmentsAPI } from '../services/api';
import { useTranslation, formatDate, _formatTime } from '../i18n';

export default function PatientFlow() {
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation('appointments');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProvider, _setSelectedProvider] = useState(null);

  // Format date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  // Fetch today's appointments
  const {
    data: appointmentsResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['appointments', 'flow', dateString],
    queryFn: async () => {
      const response = await appointmentsAPI.getAll({
        date: dateString,
        includePatient: true,
      });
      return response;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }) => {
      return appointmentsAPI.updateStatus(appointmentId, status);
    },
    onMutate: async ({ appointmentId, status }) => {
      // Optimistic update
      await queryClient.cancelQueries(['appointments', 'flow', dateString]);

      const previousData = queryClient.getQueryData(['appointments', 'flow', dateString]);

      queryClient.setQueryData(['appointments', 'flow', dateString], (old) => {
        if (!old?.data?.appointments) {
          return old;
        }
        return {
          ...old,
          data: {
            ...old.data,
            appointments: old.data.appointments.map((apt) =>
              apt.id === appointmentId ? { ...apt, status } : apt
            ),
          },
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['appointments', 'flow', dateString], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['appointments', 'flow', dateString]);
      queryClient.invalidateQueries(['dashboard-stats']);
    },
  });

  // Get appointments from response
  const appointments = useMemo(() => {
    const data =
      appointmentsResponse?.data?.appointments ||
      appointmentsResponse?.data?.data ||
      appointmentsResponse?.data ||
      [];

    // Filter by provider if selected
    if (selectedProvider) {
      return data.filter(
        (apt) => apt.practitioner_id === selectedProvider || apt.providerId === selectedProvider
      );
    }

    // Filter out cancelled/no-show for main view
    return data.filter((apt) => !['CANCELLED', 'NO_SHOW'].includes(apt.status));
  }, [appointmentsResponse, selectedProvider]);

  // Handle status change
  const handleStatusChange = (appointmentId, newStatus) => {
    updateStatusMutation.mutate({ appointmentId, status: newStatus });
  };

  // Date navigation
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = dateString === new Date().toISOString().split('T')[0];

  // Format date for display
  const formattedDate = formatDate(selectedDate, lang, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goToToday}
              className={`px-4 py-2 rounded-lg font-medium transition-colors
                ${isToday ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{isToday ? t('today') : formattedDate}</span>
              </div>
            </button>

            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Date display when not today */}
          {!isToday && <span className="text-lg font-medium text-gray-700">{formattedDate}</span>}
        </div>

        <div className="flex items-center gap-3">
          {/* View calendar link */}
          <Link
            to="/calendar"
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg
                       hover:bg-gray-50 transition-colors flex items-center gap-2
                       text-gray-700"
          >
            <Calendar className="w-4 h-4" />
            {t('calendar')}
          </Link>

          {/* Kiosk mode link */}
          <button
            onClick={() => window.open('/kiosk', '_blank', 'fullscreen=yes')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg
                       hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Monitor className="w-4 h-4" />
            {t('launchKiosk')}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-12 h-12 border-4 border-teal-500 border-t-transparent
                           rounded-full animate-spin mx-auto mb-4"
            />
            <p className="text-gray-500">{t('loadingPatientFlow')}</p>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('noAppointments')}</h2>
            <p className="text-gray-500 mb-4">
              {t('noAppointmentsScheduledFor').replace(
                '{date}',
                isToday ? t('today').toLowerCase() : formattedDate
              )}
            </p>
            <Link
              to="/appointments/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600
                         text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {t('createAppointment')}
            </Link>
          </div>
        </div>
      ) : (
        /* Kanban Board */
        <PatientFlowBoard
          appointments={appointments}
          lang={lang}
          onStatusChange={handleStatusChange}
          onRefresh={refetch}
          isLoading={updateStatusMutation.isLoading}
        />
      )}
    </div>
  );
}
