import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Filter,
  Search,
  X,
  Clock,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { followUpsAPI, patientsAPI } from '../services/api'
import { formatPhone } from '../lib/utils'
import { useTranslation, formatDate } from '../i18n'
import toast from '../utils/toast'

export default function FollowUps() {
  const { t, lang } = useTranslation('appointments')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  })
  const [activeTab, setActiveTab] = useState('all')

  // Fetch follow-ups
  const { data: followUpsResponse, isLoading } = useQuery({
    queryKey: ['followups', filters],
    queryFn: () => followUpsAPI.getAll({
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      search: filters.search || undefined,
      limit: 100,
      sortBy: 'due_date',
      sortOrder: 'asc'
    }),
  })

  // Fetch patients needing follow-up
  const { data: patientsResponse, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients-needing-followup'],
    queryFn: () => patientsAPI.getAll({
      should_be_followed_up: true,
      limit: 50,
      sortBy: 'last_visit_date',
      sortOrder: 'asc'
    }),
    enabled: activeTab === 'needed',
  })

  const followUps = followUpsResponse?.data?.followups || []
  const patientsNeedingFollowUp = patientsResponse?.data?.patients || []

  // Complete follow-up mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, notes }) => followUpsAPI.complete(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['followups'])
      queryClient.invalidateQueries(['dashboard-stats'])
    },
    onError: (error) => {
      toast.error(`${t('failedComplete')}: ${error.response?.data?.message || error.message}`)
    },
  })

  // Skip follow-up mutation
  const skipMutation = useMutation({
    mutationFn: ({ id, reason }) => followUpsAPI.skip(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['followups'])
    },
    onError: (error) => {
      toast.error(`${t('failedSkip')}: ${error.response?.data?.message || error.message}`)
    },
  })

  const handleComplete = (followUp) => {
    const notes = prompt('Add completion notes (optional):')
    if (notes !== null) { // User didn't cancel
      completeMutation.mutate({ id: followUp.id, notes: notes || '' })
    }
  }

  const handleSkip = (followUp) => {
    const reason = prompt('Reason for skipping this follow-up:')
    if (reason) {
      skipMutation.mutate({ id: followUp.id, reason })
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'MEDIUM':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'LOW':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="w-4 h-4" />
      case 'MEDIUM':
        return <AlertTriangle className="w-4 h-4" />
      case 'LOW':
        return <Circle className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      case 'SKIPPED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const filteredFollowUps = followUps.filter(fu => {
    if (activeTab === 'pending') return fu.status === 'PENDING'
    if (activeTab === 'completed') return fu.status === 'COMPLETED'
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('followUps')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('followUpsSubtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('allFollowUps')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('pending')}
              {followUps.filter(fu => fu.status === 'PENDING').length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  {followUps.filter(fu => fu.status === 'PENDING').length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t('completed')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('needed')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'needed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t('patientsNeedingFollowUp')}
              {patientsNeedingFollowUp.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {patientsNeedingFollowUp.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      {activeTab !== 'needed' && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{t('filters')}:</span>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="PENDING">{t('pending')}</option>
              <option value="COMPLETED">{t('completed')}</option>
              <option value="CANCELLED">{t('cancelled')}</option>
              <option value="SKIPPED">{t('skipped')}</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allPriorities')}</option>
              <option value="HIGH">{t('highPriority')}</option>
              <option value="MEDIUM">{t('mediumPriority')}</option>
              <option value="LOW">{t('lowPriority')}</option>
            </select>

            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('searchFollowUps')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(filters.status || filters.priority || filters.search) && (
              <button
                onClick={() => setFilters({ status: '', priority: '', search: '' })}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'needed' ? (
        /* Patients Needing Follow-up List */
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('patientsFlagged')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('patientsFlaggedDesc')}
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {patientsLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">{t('loadingPatients')}</p>
              </div>
            ) : patientsNeedingFollowUp.length > 0 ? (
              patientsNeedingFollowUp.map((patient) => (
                <div
                  key={patient.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            {t('followUpNeeded')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {formatPhone(patient.phone)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {t('lastVisit')}: {formatDate(patient.last_visit_date, lang)}
                          </span>
                        </div>
                        {patient.follow_up_reason && (
                          <p className="text-sm text-gray-600 mt-2">
                            {t('reasonLabel')}: {patient.follow_up_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        {t('viewPatient')}
                      </button>
                      <button
                        onClick={() => navigate('/communications', { state: { patientId: patient.id } })}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {t('contact')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('noPatientsNeedFollowUp')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Follow-ups List */
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">{t('loadingFollowUps')}</p>
              </div>
            ) : filteredFollowUps.length > 0 ? (
              filteredFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${getPriorityColor(followUp.priority)}`}>
                        {getPriorityIcon(followUp.priority)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => navigate(`/patients/${followUp.patient_id}`)}
                          >
                            {followUp.patient_name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(followUp.status)}`}>
                            {followUp.status}
                          </span>
                          {isOverdue(followUp.due_date) && followUp.status === 'PENDING' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                              {t('overdue')}
                            </span>
                          )}
                        </div>

                        {followUp.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            {followUp.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t('dueLabel')}: {formatDate(followUp.due_date, lang)}
                          </span>
                          {followUp.follow_up_type && (
                            <span>{t('typeLabel')}: {followUp.follow_up_type}</span>
                          )}
                          {followUp.assigned_to_name && (
                            <span>{t('assignedTo')}: {followUp.assigned_to_name}</span>
                          )}
                        </div>

                        {followUp.completion_notes && (
                          <p className="text-xs text-green-600 mt-2">
                            {t('completionNotes')}: {followUp.completion_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {followUp.status === 'PENDING' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleComplete(followUp)}
                          disabled={completeMutation.isLoading}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {t('complete')}
                        </button>
                        <button
                          onClick={() => handleSkip(followUp)}
                          disabled={skipMutation.isLoading}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {t('skip')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {filters.status || filters.priority || filters.search
                    ? t('noFollowUpsMatch')
                    : t('noFollowUpsFound')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
