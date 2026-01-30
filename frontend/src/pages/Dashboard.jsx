import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  X,
  Phone
} from 'lucide-react'
import { formatDate, formatTime } from '../lib/utils'
import { dashboardAPI, appointmentsAPI, followUpsAPI } from '../services/api'
import { useTranslation, formatDateWithWeekday, formatDateShort, formatTime as i18nFormatTime } from '../i18n'
import toast from '../utils/toast'
import { StatsGridSkeleton, AppointmentsListSkeleton, ListSkeleton } from '../components/ui/Skeleton'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, lang } = useTranslation('dashboard')

  // Fetch dashboard stats from real API
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  })

  // Fetch today's appointments from real API
  const { data: appointmentsResponse, isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => dashboardAPI.getTodayAppointments(),
  })

  // Fetch patients needing follow-up
  const { data: followUpPatientsResponse, isLoading: followUpLoading } = useQuery({
    queryKey: ['patients-needing-followup'],
    queryFn: () => followUpsAPI.getPatientsNeedingFollowUp(),
  })

  const stats = statsResponse?.data
  const appointments = appointmentsResponse?.data?.appointments || []
  const followUpPatients = followUpPatientsResponse?.data || []

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId, patientName) => {
    // Use toast confirmation instead of browser confirm
    toast.promise(
      new Promise((resolve, reject) => {
        const toastId = toast.info(
          `${t('cancelAppointmentConfirm').replace('{name}', patientName)}`,
          {
            action: {
              label: t('confirm') || 'Bekreft',
              onClick: async () => {
                try {
                  await appointmentsAPI.cancel(appointmentId, 'Cancelled by practitioner')
                  refetchAppointments()
                  resolve()
                } catch (error) {
                  reject(error)
                }
              }
            },
            cancel: {
              label: t('cancel') || 'Avbryt',
              onClick: () => reject(new Error('Cancelled'))
            },
            duration: 10000
          }
        )
      }),
      {
        loading: t('cancelling') || 'Avbestiller...',
        success: t('appointmentCancelled') || 'Time avbestilt',
        error: (err) => err.message === 'Cancelled' ? '' : t('cancelFailed')
      }
    )
  }

  // Mark patient as contacted for follow-up
  const markContactedMutation = useMutation({
    mutationFn: ({ patientId, method }) => followUpsAPI.markPatientAsContacted(patientId, method),
    onSuccess: () => {
      queryClient.invalidateQueries(['patients-needing-followup'])
      queryClient.invalidateQueries(['dashboard-stats'])
    }
  })

  const handleMarkContacted = (patient, method) => {
    const patientName = `${patient.first_name} ${patient.last_name}`
    toast.info(
      t('markContactedConfirm').replace('{name}', patientName),
      {
        action: {
          label: t('confirm') || 'Bekreft',
          onClick: () => markContactedMutation.mutate({ patientId: patient.id, method })
        },
        cancel: {
          label: t('cancel') || 'Avbryt',
          onClick: () => {}
        },
        duration: 10000
      }
    )
  }

  // Quick actions
  const quickActions = [
    { name: t('newPatient'), icon: Users, color: 'blue', action: () => navigate('/patients/new') },
    { name: t('newAppointment'), icon: Calendar, color: 'green', action: () => navigate('/appointments/new') },
    { name: t('sendSMS'), icon: MessageSquare, color: 'purple', action: () => navigate('/communications') },
    { name: t('soapNote'), icon: FileText, color: 'orange', action: () => navigate('/patients') }
  ]

  const statCards = [
    { label: t('todaysAppointments'), value: stats?.todayAppointments || 0, icon: Calendar, color: 'blue' },
    { label: t('activePatients'), value: stats?.activePatients || 0, icon: Users, color: 'green' },
    { label: t('pendingFollowUps'), value: stats?.pendingFollowUps || 0, icon: CheckCircle2, color: 'orange' },
    {
      label: t('revenueThisMonth'),
      value: stats?.monthRevenue ? `${(stats.monthRevenue / 1000).toFixed(0)}k kr` : '0 kr',
      icon: TrendingUp,
      color: 'purple'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateWithWeekday(new Date(), lang)}
        </p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <StatsGridSkeleton count={4} className="mb-6" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('todaysSchedule')}</h2>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {t('viewAll')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {appointmentsLoading ? (
                <AppointmentsListSkeleton items={5} />
              ) : appointments && appointments.length > 0 ? (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => navigate(`/patients/${apt.patient_id}`)}
                      >
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {i18nFormatTime(apt.start_time, lang)}
                          </div>
                          <div className="text-xs text-gray-500">{apt.duration_minutes || 30} {t('min')}</div>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.patient_name}</p>
                          <p className="text-xs text-gray-500">{apt.appointment_type || t('appointment')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          apt.status === 'CONFIRMED'
                            ? 'bg-green-50 text-green-700'
                            : apt.status === 'PENDING'
                            ? 'bg-yellow-50 text-yellow-700'
                            : apt.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}>
                          {t(apt.status?.toLowerCase(), apt.status)}
                        </span>
                        {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelAppointment(apt.id, apt.patient_name)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-opacity"
                            title={t('cancelAppointment')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-12 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">{t('noAppointmentsToday')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('quickActions')}</h2>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.name}
                    onClick={action.action}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-${action.color}-50 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${action.color}-600`} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{action.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pending Follow-ups */}
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('patientsNeedingFollowUp')}</h2>
              <button
                onClick={() => navigate('/follow-ups')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {t('viewAll')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {followUpLoading ? (
                <ListSkeleton items={5} showAvatar={false} />
              ) : followUpPatients && followUpPatients.length > 0 ? (
                followUpPatients.slice(0, 5).map((patient) => {
                  const followUpDate = new Date(patient.follow_up_date)
                  const isOverdue = followUpDate < new Date()

                  return (
                    <div key={patient.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex-1 cursor-pointer min-w-0"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {patient.main_problem || t('noProblemSpecified')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                              {isOverdue ? `${t('overdue')}: ` : `${t('due')}: `}
                              {formatDateShort(followUpDate, lang)}
                            </span>
                            {patient.preferred_contact_method && (
                              <span className="text-xs text-gray-400">
                                • {patient.preferred_contact_method}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkContacted(patient, patient.preferred_contact_method || 'SMS')}
                          disabled={markContactedMutation.isPending}
                          className="flex-shrink-0 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          title={t('markAsContacted')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="px-5 py-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('noFollowUpsNeeded')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
