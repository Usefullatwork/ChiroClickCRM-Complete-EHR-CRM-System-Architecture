/**
 * Appointments Page
 * Manage patient appointments and scheduling
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Plus,
  Clock,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { appointmentsAPI } from '../services/api'
import { useTranslation, formatDate, formatTime } from '../i18n'

export default function Appointments() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, lang } = useTranslation('appointments')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch appointments
  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ['appointments', selectedDate, statusFilter],
    queryFn: () => appointmentsAPI.getAll({
      date: selectedDate,
      status: statusFilter
    })
  })

  const appointments = appointmentsResponse?.data?.appointments || []

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentsAPI.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
    }
  })

  // Confirm appointment mutation
  const confirmMutation = useMutation({
    mutationFn: (id) => appointmentsAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
    }
  })

  const handleCancel = (appointment) => {
    if (!confirm(t('cancelConfirmPrompt').replace('{name}', appointment.patient_name))) return
    const reason = prompt(t('cancellationReasonPrompt'))
    if (reason) {
      cancelMutation.mutate({ id: appointment.id, reason })
    }
  }

  const handleConfirm = (appointment) => {
    confirmMutation.mutate(appointment.id)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('appointmentsOnDate').replace('{count}', appointments.length).replace('{date}', formatDate(selectedDate, lang))}</p>
        </div>
        <button
          onClick={() => navigate('/appointments/new')}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {t('newAppointment')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('date')}</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('status')}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="PENDING">{t('pending')}</option>
            <option value="CONFIRMED">{t('confirmed')}</option>
            <option value="COMPLETED">{t('completed')}</option>
            <option value="CANCELLED">{t('cancelled')}</option>
            <option value="NO_SHOW">{t('noShow')}</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t('noAppointmentsFound')}</p>
          <p className="text-gray-500 mt-2">{t('tryDifferentFilter')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.patient_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(appointment.start_time, lang)} - {formatTime(appointment.end_time, lang)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {appointment.practitioner_name || t('notAssigned')}
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>

                    {appointment.status === 'PENDING' && (
                      <button
                        onClick={() => handleConfirm(appointment)}
                        disabled={confirmMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {t('confirm')}
                      </button>
                    )}

                    {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status) && (
                      <button
                        onClick={() => handleCancel(appointment)}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {t('cancel')}
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/patients/${appointment.patient_id}`)}
                      className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                    >
                      {t('viewPatient')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
