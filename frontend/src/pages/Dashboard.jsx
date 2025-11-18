import { useQuery } from '@tanstack/react-query'
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
  X
} from 'lucide-react'
import { formatDate, formatTime } from '../lib/utils'
import { dashboardAPI, appointmentsAPI } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()

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

  const stats = statsResponse?.data
  const appointments = appointmentsResponse?.data?.appointments || []

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId, patientName) => {
    if (!confirm(`Cancel appointment for ${patientName}?`)) return

    const reason = prompt('Cancellation reason (optional):')

    try {
      await appointmentsAPI.cancel(appointmentId, reason || 'Cancelled by practitioner')
      refetchAppointments()
    } catch (error) {
      alert('Failed to cancel appointment. Please try again.')
      console.error('Cancel error:', error)
    }
  }

  // Quick actions
  const quickActions = [
    {
      name: 'New Patient',
      icon: Users,
      color: 'blue',
      action: () => navigate('/patients/new')
    },
    {
      name: 'New Appointment',
      icon: Calendar,
      color: 'green',
      action: () => navigate('/appointments/new')
    },
    {
      name: 'Send SMS',
      icon: MessageSquare,
      color: 'purple',
      action: () => navigate('/communications')
    },
    {
      name: 'SOAP Note',
      icon: FileText,
      color: 'orange',
      action: () => navigate('/patients')
    }
  ]

  const statCards = [
    {
      label: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'blue'
    },
    {
      label: 'Active Patients',
      value: stats?.activePatients || 0,
      icon: Users,
      color: 'green'
    },
    {
      label: 'Pending Follow-ups',
      value: stats?.pendingFollowUps || 0,
      icon: CheckCircle2,
      color: 'orange'
    },
    {
      label: 'Revenue (This Month)',
      value: stats?.monthRevenue ? `${(stats.monthRevenue / 1000).toFixed(0)}k kr` : '0 kr',
      icon: TrendingUp,
      color: 'purple'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('no-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {appointmentsLoading ? (
                <div className="px-5 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-3">Loading appointments...</p>
                </div>
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
                            {new Date(apt.start_time).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-500">{apt.duration_minutes || 30} min</div>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.patient_name}</p>
                          <p className="text-xs text-gray-500">{apt.appointment_type || 'Appointment'}</p>
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
                          {apt.status}
                        </span>
                        {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelAppointment(apt.id, apt.patient_name)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-opacity"
                            title="Cancel appointment"
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
                  <p className="text-sm text-gray-500">No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
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
              <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
              <span className="text-sm text-gray-500">{stats?.pendingFollowUps || 0}</span>
            </div>
            <div className="p-4">
              <button
                onClick={() => navigate('/follow-ups')}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                View all follow-ups
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
