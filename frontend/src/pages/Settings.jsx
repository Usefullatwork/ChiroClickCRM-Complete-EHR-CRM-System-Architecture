import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  User,
  Bell,
  Key,
  Save,
  Loader2,
  Check,
  Mail,
  Phone,
  MapPin,
  Globe,
  Settings as SettingsIcon,
  Users,
  CreditCard,
  Database,
  AlertCircle,
  Brain,
  Monitor,
  ExternalLink,
  Stethoscope,
  FileText,
  Activity,
  Layers
} from 'lucide-react'
import { organizationAPI, usersAPI } from '../services/api'
import { formatDate } from '../lib/utils'
import AISettings from '../components/AISettings'
import { useTranslation } from '../i18n'

// Adjustment notation methods available in the system
const ADJUSTMENT_NOTATION_METHODS = [
  {
    id: 'segment_listing',
    name: { en: 'Segment Listing', no: 'Segmentlisting' },
    description: {
      en: 'Traditional chiropractic listing notation (e.g., C5 PRS, T4 PL-SP)',
      no: 'Tradisjonell kiropraktisk listingnotasjon (f.eks. C5 PRS, T4 PL-SP)'
    },
    icon: 'list'
  },
  {
    id: 'body_chart',
    name: { en: 'Body Chart', no: 'Kroppskart' },
    description: {
      en: 'Visual body diagram with symptom markers and regions',
      no: 'Visuelt kroppsdiagram med symptommarkører og regioner'
    },
    icon: 'body'
  },
  {
    id: 'anatomical_chart',
    name: { en: 'Anatomical Chart', no: 'Anatomisk Kart' },
    description: {
      en: 'Detailed anatomy with dermatomes, muscles, and trigger points',
      no: 'Detaljert anatomi med dermatomer, muskler og triggerpunkter'
    },
    icon: 'anatomy'
  },
  {
    id: 'soap_narrative',
    name: { en: 'SOAP Narrative', no: 'SOAP Narrativ' },
    description: {
      en: 'Text-based SOAP note format with structured sections',
      no: 'Tekstbasert SOAP-notatformat med strukturerte seksjoner'
    },
    icon: 'text'
  },
  {
    id: 'activator_protocol',
    name: { en: 'Activator Protocol', no: 'Aktivator Protokoll' },
    description: {
      en: 'Activator Methods leg check and isolation testing protocol',
      no: 'Aktivator-metodens beinkontroll og isolasjonstesting'
    },
    icon: 'activator'
  },
  {
    id: 'gonstead_listing',
    name: { en: 'Gonstead Listing', no: 'Gonstead Listing' },
    description: {
      en: 'Gonstead system notation (PR, PL, PRS, PLS, PRI, PLI, AS, AI, etc.)',
      no: 'Gonstead-systemnotasjon (PR, PL, PRS, PLS, PRI, PLI, AS, AI, osv.)'
    },
    icon: 'gonstead'
  },
  {
    id: 'diversified_notation',
    name: { en: 'Diversified Notation', no: 'Diversifisert Notasjon' },
    description: {
      en: 'Standard diversified technique documentation',
      no: 'Standard diversifisert teknikk-dokumentasjon'
    },
    icon: 'diversified'
  },
  {
    id: 'facial_lines',
    name: { en: 'Facial Lines Chart', no: 'Ansiktslinjer Kart' },
    description: {
      en: 'Fascial lines and trigger points for facial/TMJ treatment',
      no: 'Fascielinjer og triggerpunkter for ansikts-/TMJ-behandling'
    },
    icon: 'face'
  }
]

// Default clinical preferences
const DEFAULT_CLINICAL_PREFS = {
  adjustmentNotation: 'segment_listing',
  language: 'no',
  showDermatomes: true,
  showTriggerPoints: true,
  autoGenerateNarrative: true,
  defaultView: 'front'
}

export default function Settings() {
  const { t, lang: i18nLang } = useTranslation('settings')
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('organization')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})

  // Clinical preferences state
  const [clinicalPrefs, setClinicalPrefs] = useState(() => {
    const saved = localStorage.getItem('chiroclick_clinical_prefs')
    return saved ? JSON.parse(saved) : DEFAULT_CLINICAL_PREFS
  })

  // Save clinical preferences to localStorage
  useEffect(() => {
    localStorage.setItem('chiroclick_clinical_prefs', JSON.stringify(clinicalPrefs))
  }, [clinicalPrefs])

  const handleClinicalPrefChange = (key, value) => {
    setClinicalPrefs(prev => ({ ...prev, [key]: value }))
  }

  const lang = clinicalPrefs.language || 'no'

  // Fetch organization data
  const { data: orgResponse, isLoading: orgLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationAPI.getCurrent(),
  })

  const organization = orgResponse?.data?.organization || {}

  // Fetch current user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => usersAPI.getCurrent(),
  })

  const currentUser = userResponse?.data?.user || {}

  // Fetch organization users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['organization-users'],
    queryFn: () => organizationAPI.getUsers(),
    enabled: activeTab === 'users',
  })

  const organizationUsers = usersResponse?.data?.users || []

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: (data) => organizationAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization'])
      setEditMode(false)
      alert(t('orgUpdatedSuccess'))
    },
    onError: (error) => {
      alert(`${t('orgUpdateFailed')}: ${error.response?.data?.message || error.message}`)
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => usersAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user'])
      setEditMode(false)
      alert(t('profileUpdatedSuccess'))
    },
    onError: (error) => {
      alert(`${t('profileUpdateFailed')}: ${error.response?.data?.message || error.message}`)
    },
  })

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: (data) => organizationAPI.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization-users'])
      alert(t('userInvitedSuccess'))
    },
    onError: (error) => {
      alert(`${t('userInviteFailed')}: ${error.response?.data?.message || error.message}`)
    },
  })

  const handleSave = () => {
    if (activeTab === 'organization') {
      updateOrgMutation.mutate(formData)
    } else if (activeTab === 'profile') {
      updateUserMutation.mutate(formData)
    }
  }

  const handleEdit = (data) => {
    setFormData(data)
    setEditMode(true)
  }

  const handleCancel = () => {
    setFormData({})
    setEditMode(false)
  }

  const handleInviteUser = () => {
    const email = prompt(t('enterEmailToInvite'))
    if (email) {
      const role = prompt(t('enterRole'), 'PRACTITIONER')
      if (role) {
        inviteUserMutation.mutate({ email, role })
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('manageSettings')}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => {
              setActiveTab('organization')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'organization'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t('organization')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('profile')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('profile')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('users')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('users')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('notifications')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t('notifications')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('integrations')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'integrations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              {t('integrations')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('ai')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              {t('aiAssistant')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('clinical')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'clinical'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              {t('clinical')}
            </div>
          </button>
        </nav>
      </div>

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {orgLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Organization Info Card */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('organizationInfo')}
                  </h2>
                  {!editMode ? (
                    <button
                      onClick={() => handleEdit(organization)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t('edit')}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateOrgMutation.isLoading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {updateOrgMutation.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('saving')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {t('save')}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Organization Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('orgName')}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{organization.name || '-'}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('email')}
                      </label>
                      {editMode ? (
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {organization.email || '-'}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clinicPhone')}
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {organization.phone || '-'}
                        </p>
                      )}
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('website')}
                      </label>
                      {editMode ? (
                        <input
                          type="url"
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          {organization.website || '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('clinicAddress')}
                    </label>
                    {editMode ? (
                      <textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        {organization.address || '-'}
                      </p>
                    )}
                  </div>

                  {!editMode && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {t('created')}: {formatDate(organization.created_at, 'time')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Kiosk Mode Card */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {t('kioskTitle')}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {t('kioskDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {t('kioskLaunchDescription')}
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2 ml-4">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature1')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature2')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature3')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature4')}
                      </li>
                    </ul>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => window.open('/kiosk', '_blank', 'fullscreen=yes')}
                        className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700
                                   transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Monitor className="w-5 h-5" />
                        {t('launchKiosk')}
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/kiosk`)
                          alert(t('kioskUrlCopied'))
                        }}
                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg
                                   hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {t('copyKioskUrl')}
                      </button>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">{t('fullscreenTip')}</p>
                          <p className="text-blue-700 mt-1">
                            {t('fullscreenDescription').replace('{key}', '')}
                            <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">F11</kbd>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {userLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('userProfile')}
                </h2>
                {!editMode ? (
                  <button
                    onClick={() => handleEdit(currentUser)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('edit')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateUserMutation.isLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {updateUserMutation.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {t('save')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('firstName')}
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{currentUser.first_name || '-'}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('lastName')}
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{currentUser.last_name || '-'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email')}
                    </label>
                    <p className="text-sm text-gray-900">{currentUser.email || '-'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('emailCannotChange')}
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('role')}
                    </label>
                    <p className="text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {currentUser.role || '-'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('orgUsers')}
            </h2>
            <button
              onClick={handleInviteUser}
              disabled={inviteUserMutation.isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t('inviteUser')}
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {usersLoading ? (
              <div className="px-6 py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 mt-3">{t('loadingUsers')}</p>
              </div>
            ) : organizationUsers.length > 0 ? (
              organizationUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {user.role}
                      </span>
                      {user.status && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          user.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('noUsersFound')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('notificationPrefs')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('manageNotifications')}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('emailNotifications')}</p>
                <p className="text-xs text-gray-500">{t('emailNotificationsDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Appointment Reminders */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('appointmentReminders')}</p>
                <p className="text-xs text-gray-500">{t('appointmentRemindersDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Follow-up Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('followUpNotifications')}</p>
                <p className="text-xs text-gray-500">{t('followUpNotificationsDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('systemUpdates')}</p>
                <p className="text-xs text-gray-500">{t('systemUpdatesDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="pt-4">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t('notificationComingSoon')}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('notificationComingSoonDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* SolvIt Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('solvitIntegration')}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('solvitDesc')}
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t('active')}
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('status')}:</span>
                  <span className="text-gray-900 font-medium">{t('connected')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('lastSync')}:</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(new Date(), 'time')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('syncMode')}:</span>
                  <span className="text-gray-900 font-medium">{t('automatic')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Drive Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('googleDriveIntegration')}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('googleDriveDesc')}
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t('active')}
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('status')}:</span>
                  <span className="text-gray-900 font-medium">{t('connected')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('trainingDataFolder')}:</span>
                  <span className="text-gray-900 font-medium">{t('configured')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('autoImport')}:</span>
                  <span className="text-gray-900 font-medium">{t('enabled')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('stripeIntegration')}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('stripeDesc')}
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded">
                {t('notConnected')}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                {t('connectStripeDesc')}
              </p>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('connectStripe')}
              </button>
            </div>
          </div>

          {/* API Access */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('apiAccess')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('apiAccessDesc')}
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t('apiComingSoon')}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('apiComingSoonDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Tab */}
      {activeTab === 'ai' && (
        <AISettings />
      )}

      {/* Clinical Settings Tab */}
      {activeTab === 'clinical' && (
        <div className="space-y-6">
          {/* Adjustment Notation Method */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('adjustmentNotation')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t('adjustmentNotationDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {ADJUSTMENT_NOTATION_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      clinicalPrefs.adjustmentNotation === method.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustmentNotation"
                      value={method.id}
                      checked={clinicalPrefs.adjustmentNotation === method.id}
                      onChange={(e) => handleClinicalPrefChange('adjustmentNotation', e.target.value)}
                      className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {method.name[lang] || method.name.en}
                        </span>
                        {clinicalPrefs.adjustmentNotation === method.id && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                            {t('activeLabel')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {method.description[lang] || method.description.en}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Language Preference */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('languageSetting')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t('languageSettingDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    clinicalPrefs.language === 'no'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value="no"
                    checked={clinicalPrefs.language === 'no'}
                    onChange={(e) => handleClinicalPrefChange('language', e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Norsk</span>
                    <p className="text-xs text-gray-500">{t('norwegian')}</p>
                  </div>
                </label>

                <label
                  className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    clinicalPrefs.language === 'en'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={clinicalPrefs.language === 'en'}
                    onChange={(e) => handleClinicalPrefChange('language', e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">English</span>
                    <p className="text-xs text-gray-500">{t('english')}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Chart Display Options */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('chartDisplay')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t('chartDisplayDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Show Dermatomes */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('showDermatomes')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('showDermatomesDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={clinicalPrefs.showDermatomes}
                    onChange={(e) => handleClinicalPrefChange('showDermatomes', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Show Trigger Points */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('showTriggerPoints')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('showTriggerPointsDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={clinicalPrefs.showTriggerPoints}
                    onChange={(e) => handleClinicalPrefChange('showTriggerPoints', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Auto Generate Narrative */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('autoGenerateNarrative')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('autoGenerateNarrativeDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={clinicalPrefs.autoGenerateNarrative}
                    onChange={(e) => handleClinicalPrefChange('autoGenerateNarrative', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Current Selection Summary */}
          <div className="bg-teal-50 rounded-lg border border-teal-200 p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-teal-900">
                  {t('activeNotation')}
                </p>
                <p className="text-sm text-teal-700 mt-1">
                  {ADJUSTMENT_NOTATION_METHODS.find(m => m.id === clinicalPrefs.adjustmentNotation)?.name[lang] ||
                   ADJUSTMENT_NOTATION_METHODS.find(m => m.id === clinicalPrefs.adjustmentNotation)?.name.en}
                </p>
                <p className="text-xs text-teal-600 mt-2">
                  {t('activeNotationDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
