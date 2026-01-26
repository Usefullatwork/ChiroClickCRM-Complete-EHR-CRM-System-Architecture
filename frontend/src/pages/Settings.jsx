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
  Layers,
  Zap,
  Upload,
  CalendarClock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit3,
  RotateCcw,
  Target
} from 'lucide-react'
import { organizationAPI, usersAPI, spineTemplatesAPI, clinicalSettingsAPI } from '../services/api'
import { formatDate } from '../lib/utils'
import AISettings from '../components/AISettings'
import SchedulerDecisions from '../components/scheduler/SchedulerDecisions'
import AppointmentImporter from '../components/scheduler/AppointmentImporter'
import TodaysMessages from '../components/scheduler/TodaysMessages'

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

// Spine Templates Editor Component
function SpineTemplatesEditor({ lang }) {
  const queryClient = useQueryClient()
  const [expandedSegment, setExpandedSegment] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editText, setEditText] = useState('')

  // Fetch grouped templates
  const { data: templatesData, isLoading, refetch } = useQuery({
    queryKey: ['spine-templates', 'grouped', lang === 'en' ? 'EN' : 'NO'],
    queryFn: () => spineTemplatesAPI.getGrouped(lang === 'en' ? 'EN' : 'NO'),
    staleTime: 5 * 60 * 1000
  })

  const templates = templatesData?.data?.data || {}

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => spineTemplatesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['spine-templates'])
      setEditingTemplate(null)
      setEditText('')
    }
  })

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: () => spineTemplatesAPI.resetToDefaults(lang === 'en' ? 'EN' : 'NO'),
    onSuccess: () => {
      queryClient.invalidateQueries(['spine-templates'])
      alert(lang === 'no' ? 'Maler tilbakestilt til standard' : 'Templates reset to defaults')
    }
  })

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setEditText(template.text_template)
  }

  const handleSave = () => {
    if (!editingTemplate || !editText.trim()) return
    updateMutation.mutate({
      segment: editingTemplate.segment,
      direction: editingTemplate.direction,
      finding_type: editingTemplate.finding_type || 'palpation',
      text_template: editText,
      language: lang === 'en' ? 'EN' : 'NO'
    })
  }

  const handleCancel = () => {
    setEditingTemplate(null)
    setEditText('')
  }

  // Group segments by region
  const regions = {
    cervical: ['C0-C1', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    thoracic: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    lumbar: ['L1', 'L2', 'L3', 'L4', 'L5'],
    sacral: ['Sacrum', 'SI-L', 'SI-R', 'Coccyx'],
    muscle: ['C-para', 'T-para', 'L-para', 'QL', 'Piriformis']
  }

  const regionLabels = {
    cervical: lang === 'no' ? 'Cervical' : 'Cervical',
    thoracic: lang === 'no' ? 'Thoracal' : 'Thoracic',
    lumbar: lang === 'no' ? 'Lumbal' : 'Lumbar',
    sacral: lang === 'no' ? 'Sakrum/Bekken' : 'Sacrum/Pelvis',
    muscle: lang === 'no' ? 'Muskulatur' : 'Muscles'
  }

  const directionLabels = {
    left: lang === 'no' ? 'Venstre' : 'Left',
    right: lang === 'no' ? 'Høyre' : 'Right',
    bilateral: lang === 'no' ? 'Bilateral' : 'Bilateral',
    posterior: lang === 'no' ? 'Posterior' : 'Posterior',
    anterior: lang === 'no' ? 'Anterior' : 'Anterior',
    superior: lang === 'no' ? 'Superior' : 'Superior',
    inferior: lang === 'no' ? 'Inferior' : 'Inferior',
    inflare: lang === 'no' ? 'Inflare' : 'Inflare',
    outflare: lang === 'no' ? 'Outflare' : 'Outflare'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {lang === 'no' ? 'Palpasjonsmaler (Rask-klikk)' : 'Palpation Templates (Quick-Click)'}
              </h2>
              <p className="text-sm text-gray-500">
                {lang === 'no'
                  ? 'Tilpass teksten som settes inn ved rask-klikk på ryggsøylen'
                  : 'Customize the text inserted by quick-click spine buttons'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm(lang === 'no' ? 'Tilbakestille alle maler til standard?' : 'Reset all templates to defaults?')) {
                resetMutation.mutate()
              }
            }}
            disabled={resetMutation.isLoading}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {lang === 'no' ? 'Tilbakestill' : 'Reset'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(regions).map(([regionKey, segments]) => {
              const hasTemplates = segments.some(seg => templates[seg]?.length > 0)
              if (!hasTemplates) return null

              return (
                <div key={regionKey} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSegment(expandedSegment === regionKey ? null : regionKey)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100"
                  >
                    <span className="text-sm font-medium text-gray-700">{regionLabels[regionKey]}</span>
                    {expandedSegment === regionKey ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  {expandedSegment === regionKey && (
                    <div className="p-3 space-y-2 bg-white">
                      {segments.map(segment => {
                        const segmentTemplates = templates[segment] || []
                        if (segmentTemplates.length === 0) return null

                        return (
                          <div key={segment} className="border border-gray-100 rounded-lg p-2">
                            <p className="text-xs font-semibold text-gray-600 mb-1.5">{segment}</p>
                            <div className="space-y-1">
                              {segmentTemplates.map(template => (
                                <div
                                  key={`${template.segment}-${template.direction}`}
                                  className={`flex items-start gap-2 p-2 rounded ${
                                    editingTemplate?.segment === template.segment &&
                                    editingTemplate?.direction === template.direction
                                      ? 'bg-emerald-50 border border-emerald-200'
                                      : 'bg-gray-50'
                                  }`}
                                >
                                  <span className="text-xs font-medium text-gray-500 w-16 shrink-0">
                                    {directionLabels[template.direction] || template.direction}
                                  </span>

                                  {editingTemplate?.segment === template.segment &&
                                   editingTemplate?.direction === template.direction ? (
                                    <div className="flex-1 space-y-2">
                                      <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 resize-none"
                                        rows={2}
                                      />
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={handleSave}
                                          disabled={updateMutation.isLoading}
                                          className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                          {updateMutation.isLoading ? '...' : (lang === 'no' ? 'Lagre' : 'Save')}
                                        </button>
                                        <button
                                          onClick={handleCancel}
                                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                          {lang === 'no' ? 'Avbryt' : 'Cancel'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="flex-1 text-xs text-gray-700 truncate" title={template.text_template}>
                                        {template.text_template}
                                      </p>
                                      <button
                                        onClick={() => handleEdit(template)}
                                        className="p-1 text-gray-400 hover:text-emerald-600 rounded"
                                        title={lang === 'no' ? 'Rediger' : 'Edit'}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      {!template.is_default && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded">
                                          {lang === 'no' ? 'Tilpasset' : 'Custom'}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3 text-center">
          {lang === 'no'
            ? 'Klikk på "Rediger" for å tilpasse tekstmalen for hvert segment og retning.'
            : 'Click "Edit" to customize the text template for each segment and direction.'}
        </p>
      </div>
    </div>
  )
}

export default function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('organization')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})

  // ============================================
  // CLINICAL SETTINGS (Backend-powered)
  // ============================================

  // Fetch clinical settings from backend
  const { data: clinicalSettingsResponse, isLoading: clinicalSettingsLoading } = useQuery({
    queryKey: ['clinical-settings'],
    queryFn: () => clinicalSettingsAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get clinical settings with defaults
  const clinicalSettings = clinicalSettingsResponse?.data || DEFAULT_CLINICAL_PREFS

  // For backwards compatibility, map to the old clinicalPrefs structure
  const clinicalPrefs = {
    adjustmentNotation: clinicalSettings.adjustment?.style || 'segment_listing',
    language: clinicalSettings.display?.language || 'no',
    showDermatomes: clinicalSettings.display?.showDermatomes ?? true,
    showTriggerPoints: clinicalSettings.display?.showTriggerPoints ?? true,
    autoGenerateNarrative: clinicalSettings.display?.autoGenerateNarrative ?? true,
    defaultView: clinicalSettings.display?.defaultView || 'front',
    // Extended settings
    gonsteadSettings: clinicalSettings.adjustment?.gonstead || {},
    diversifiedSettings: clinicalSettings.adjustment?.diversified || {},
    testSettings: clinicalSettings.tests || {},
    letterSettings: clinicalSettings.letters || {},
    soapSettings: clinicalSettings.soap || {},
  }

  // Update clinical settings mutation
  const updateClinicalSettingsMutation = useMutation({
    mutationFn: (updates) => clinicalSettingsAPI.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-settings'])
    },
    onError: (error) => {
      console.error('Failed to update clinical settings:', error)
    },
  })

  // Reset clinical settings mutation
  const resetClinicalSettingsMutation = useMutation({
    mutationFn: () => clinicalSettingsAPI.reset(),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-settings'])
      alert(lang === 'no' ? 'Kliniske innstillinger tilbakestilt' : 'Clinical settings reset to defaults')
    },
    onError: (error) => {
      alert(`Failed to reset settings: ${error.response?.data?.message || error.message}`)
    },
  })

  // Handle clinical preference change - updates backend
  const handleClinicalPrefChange = (key, value) => {
    // Map the key to the correct nested structure
    let updates = {}
    if (key === 'adjustmentNotation') {
      updates = { adjustment: { style: value } }
    } else if (key === 'language') {
      updates = { display: { language: value } }
    } else if (key === 'showDermatomes' || key === 'showTriggerPoints' || key === 'autoGenerateNarrative' || key === 'defaultView') {
      updates = { display: { [key]: value } }
    } else {
      updates = { [key]: value }
    }
    updateClinicalSettingsMutation.mutate(updates)
  }

  // Handle nested settings updates
  const handleNestedSettingsChange = (section, subsection, key, value) => {
    const updates = {
      [section]: {
        [subsection]: {
          [key]: value
        }
      }
    }
    updateClinicalSettingsMutation.mutate(updates)
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
      alert('Organization settings updated successfully')
    },
    onError: (error) => {
      alert(`Failed to update organization: ${error.response?.data?.message || error.message}`)
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => usersAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user'])
      setEditMode(false)
      alert('Profile updated successfully')
    },
    onError: (error) => {
      alert(`Failed to update profile: ${error.response?.data?.message || error.message}`)
    },
  })

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: (data) => organizationAPI.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization-users'])
      alert('User invited successfully')
    },
    onError: (error) => {
      alert(`Failed to invite user: ${error.response?.data?.message || error.message}`)
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
    const email = prompt('Enter email address to invite:')
    if (email) {
      const role = prompt('Enter role (ADMIN, PRACTITIONER, STAFF):', 'PRACTITIONER')
      if (role) {
        inviteUserMutation.mutate({ email, role })
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your organization and profile settings
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
              Organization
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
              Profile
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
              Users
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
              Notifications
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
              Integrations
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
              AI Assistant
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
              Clinical
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('automation')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'automation'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Automatisering
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
                    Organization Information
                  </h2>
                  {!editMode ? (
                    <button
                      onClick={() => handleEdit(organization)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateOrgMutation.isLoading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {updateOrgMutation.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save
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
                        Organization Name
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
                        Email
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
                        Phone
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
                        Website
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
                      Address
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
                        Created: {formatDate(organization.created_at, 'time')}
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
                        Patient Self-Check-In Kiosk
                      </h2>
                      <p className="text-sm text-gray-500">
                        Touch-friendly check-in for waiting room tablets
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Launch kiosk mode for patient self-check-in. Patients can:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2 ml-4">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        Find their appointment by name or phone
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        Verify identity with date of birth
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        Enter chief complaint and pain level
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        Auto-populate SOAP notes for provider
                      </li>
                    </ul>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => window.open('/kiosk', '_blank', 'fullscreen=yes')}
                        className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700
                                   transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Monitor className="w-5 h-5" />
                        Launch Kiosk Mode
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/kiosk`)
                          alert('Kiosk URL copied to clipboard!')
                        }}
                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg
                                   hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        Copy Kiosk URL
                      </button>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">Tip: Full-screen mode</p>
                          <p className="text-blue-700 mt-1">
                            For the best experience, press <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">F11</kbd> after
                            launching to enter full-screen mode on the kiosk device.
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
                  User Profile
                </h2>
                {!editMode ? (
                  <button
                    onClick={() => handleEdit(currentUser)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateUserMutation.isLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {updateUserMutation.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
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
                      First Name
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
                      Last Name
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
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{currentUser.email || '-'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed here
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
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
              Organization Users
            </h2>
            <button
              onClick={handleInviteUser}
              disabled={inviteUserMutation.isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Invite User
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {usersLoading ? (
              <div className="px-6 py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 mt-3">Loading users...</p>
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
                <p className="text-sm text-gray-500">No users found</p>
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
              Notification Preferences
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage how you receive notifications
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Appointment Reminders */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Appointment Reminders</p>
                <p className="text-xs text-gray-500">Get reminders for upcoming appointments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Follow-up Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Follow-up Notifications</p>
                <p className="text-xs text-gray-500">Get notified about pending follow-ups</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">System Updates</p>
                <p className="text-xs text-gray-500">Receive notifications about system updates</p>
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
                    Notification preferences are coming soon
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We're working on implementing full notification preferences. For now, these are display-only.
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
                <h2 className="text-lg font-semibold text-gray-900">SolvIt Integration</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Patient management system integration
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                Active
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(new Date(), 'time')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sync Mode:</span>
                  <span className="text-gray-900 font-medium">Automatic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Drive Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google Drive Integration</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Cloud storage for training data and documents
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                Active
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Data Folder:</span>
                  <span className="text-gray-900 font-medium">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto Import:</span>
                  <span className="text-gray-900 font-medium">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stripe Integration</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Payment processing (Coming soon)
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded">
                Not Connected
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Connect Stripe to process payments directly in ChiroClickCRM.
              </p>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Connect Stripe (Coming Soon)
              </button>
            </div>
          </div>

          {/* API Access */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">API Access</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage API keys for external integrations
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    API access coming soon
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We're working on implementing API key management for external integrations.
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
          {/* Loading state */}
          {clinicalSettingsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="ml-3 text-gray-600">
                {lang === 'no' ? 'Laster innstillinger...' : 'Loading settings...'}
              </span>
            </div>
          )}

          {/* Adjustment Notation Method */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {lang === 'no' ? 'Justeringsnotasjon' : 'Adjustment Notation'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {lang === 'no'
                      ? 'Velg foretrukket metode for å dokumentere justeringer'
                      : 'Select your preferred method for documenting adjustments'}
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
                            {lang === 'no' ? 'Aktiv' : 'Active'}
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

          {/* Gonstead Settings - Show when Gonstead is selected */}
          {clinicalPrefs.adjustmentNotation === 'gonstead_listing' && (
            <div className="bg-white rounded-lg border-2 border-amber-200">
              <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {lang === 'no' ? 'Gonstead Innstillinger' : 'Gonstead Settings'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {lang === 'no'
                        ? 'Tilpass Gonstead-listingnotasjon'
                        : 'Customize Gonstead listing notation'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Full notation toggle */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lang === 'no' ? 'Full notasjon' : 'Full Notation'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === 'no'
                        ? 'Bruk full notasjon (f.eks. "C5 PRS-SP" vs "PRS")'
                        : 'Use full notation (e.g., "C5 PRS-SP" vs "PRS")'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={clinicalPrefs.gonsteadSettings?.useFullNotation ?? true}
                      onChange={(e) => handleNestedSettingsChange('adjustment', 'gonstead', 'useFullNotation', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Include direction toggle */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lang === 'no' ? 'Inkluder retning' : 'Include Direction'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === 'no'
                        ? 'Inkluder retningsbeskrivelse i listingen'
                        : 'Include direction description in listing'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={clinicalPrefs.gonsteadSettings?.includeDirection ?? true}
                      onChange={(e) => handleNestedSettingsChange('adjustment', 'gonstead', 'includeDirection', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Gonstead listings reference */}
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    {lang === 'no' ? 'Gonstead Listing Referanse:' : 'Gonstead Listing Reference:'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs text-amber-800">
                    <div>
                      <p className="font-semibold mb-1">{lang === 'no' ? 'Posterior Rotasjon' : 'Posterior Rotation'}:</p>
                      <ul className="space-y-0.5">
                        <li><code className="bg-amber-100 px-1 rounded">PR</code> - Posterior Right</li>
                        <li><code className="bg-amber-100 px-1 rounded">PL</code> - Posterior Left</li>
                        <li><code className="bg-amber-100 px-1 rounded">PRS</code> - Posterior Right Superior</li>
                        <li><code className="bg-amber-100 px-1 rounded">PLS</code> - Posterior Left Superior</li>
                        <li><code className="bg-amber-100 px-1 rounded">PRI</code> - Posterior Right Inferior</li>
                        <li><code className="bg-amber-100 px-1 rounded">PLI</code> - Posterior Left Inferior</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">{lang === 'no' ? 'Sakrum/Bekken' : 'Sacrum/Pelvis'}:</p>
                      <ul className="space-y-0.5">
                        <li><code className="bg-amber-100 px-1 rounded">AS</code> - Anterior Superior</li>
                        <li><code className="bg-amber-100 px-1 rounded">AI</code> - Anterior Inferior</li>
                        <li><code className="bg-amber-100 px-1 rounded">PI</code> - Posterior Inferior</li>
                        <li><code className="bg-amber-100 px-1 rounded">IN</code> - Inflare</li>
                        <li><code className="bg-amber-100 px-1 rounded">EX</code> - Outflare</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diversified Settings - Show when Diversified is selected */}
          {clinicalPrefs.adjustmentNotation === 'diversified_notation' && (
            <div className="bg-white rounded-lg border-2 border-indigo-200">
              <div className="px-6 py-4 border-b border-indigo-200 bg-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {lang === 'no' ? 'Diversifisert Innstillinger' : 'Diversified Settings'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {lang === 'no'
                        ? 'Tilpass diversifisert teknikk-dokumentasjon'
                        : 'Customize diversified technique documentation'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Anatomical terms toggle */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lang === 'no' ? 'Anatomiske termer' : 'Anatomical Terms'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === 'no'
                        ? 'Bruk full anatomisk terminologi'
                        : 'Use full anatomical terminology'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={clinicalPrefs.diversifiedSettings?.useAnatomicalTerms ?? true}
                      onChange={(e) => handleNestedSettingsChange('adjustment', 'diversified', 'useAnatomicalTerms', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                {/* Include restriction type */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lang === 'no' ? 'Inkluder restriksjonstype' : 'Include Restriction Type'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === 'no'
                        ? 'Spesifiser type bevegelsesrestriksjon'
                        : 'Specify type of motion restriction'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={clinicalPrefs.diversifiedSettings?.includeRestriction ?? true}
                      onChange={(e) => handleNestedSettingsChange('adjustment', 'diversified', 'includeRestriction', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                {/* Diversified terminology reference */}
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-900 mb-2">
                    {lang === 'no' ? 'Diversifisert Terminologi:' : 'Diversified Terminology:'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs text-indigo-800">
                    <div>
                      <p className="font-semibold mb-1">{lang === 'no' ? 'Restriksjonstyper' : 'Restriction Types'}:</p>
                      <ul className="space-y-0.5">
                        <li><code className="bg-indigo-100 px-1 rounded">Hypomobil</code> - {lang === 'no' ? 'Redusert bevegelse' : 'Reduced motion'}</li>
                        <li><code className="bg-indigo-100 px-1 rounded">Fiksasjon</code> - {lang === 'no' ? 'Låst segment' : 'Locked segment'}</li>
                        <li><code className="bg-indigo-100 px-1 rounded">Subluksasjon</code> - {lang === 'no' ? 'Dysfunksjon' : 'Dysfunction'}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">{lang === 'no' ? 'Bevegelsesretninger' : 'Motion Directions'}:</p>
                      <ul className="space-y-0.5">
                        <li><code className="bg-indigo-100 px-1 rounded">Fleksjon</code> / <code className="bg-indigo-100 px-1 rounded">Ekstensjon</code></li>
                        <li><code className="bg-indigo-100 px-1 rounded">Lateral fleksjon</code> (H/V)</li>
                        <li><code className="bg-indigo-100 px-1 rounded">Rotasjon</code> (H/V)</li>
                        <li><code className="bg-indigo-100 px-1 rounded">Kombinert</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Documentation Settings */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {lang === 'no' ? 'Testdokumentasjon' : 'Test Documentation'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {lang === 'no'
                      ? 'Innstillinger for kliniske tester og undersøkelser'
                      : 'Settings for clinical tests and examinations'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Orthopedic Test Format */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {lang === 'no' ? 'Ortopediske tester - Resultatformat' : 'Orthopedic Tests - Result Format'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'plus_minus', label: '+/-', desc: lang === 'no' ? 'Pluss/minus' : 'Plus/minus' },
                    { id: 'pos_neg', label: 'Pos/Neg', desc: lang === 'no' ? 'Positiv/negativ' : 'Positive/negative' },
                    { id: 'numeric', label: '0-3', desc: lang === 'no' ? 'Numerisk skala' : 'Numeric scale' },
                    { id: 'descriptive', label: lang === 'no' ? 'Beskrivende' : 'Descriptive', desc: lang === 'no' ? 'Full tekst' : 'Full text' },
                  ].map(format => (
                    <label
                      key={format.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                        (clinicalPrefs.testSettings?.orthopedic?.resultFormat || 'plus_minus') === format.id
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="orthoResultFormat"
                        value={format.id}
                        className="sr-only"
                        checked={(clinicalPrefs.testSettings?.orthopedic?.resultFormat || 'plus_minus') === format.id}
                        onChange={(e) => handleNestedSettingsChange('tests', 'orthopedic', 'resultFormat', e.target.value)}
                      />
                      <p className="font-medium text-gray-900">{format.label}</p>
                      <p className="text-xs text-gray-500">{format.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Neurological Test Format */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {lang === 'no' ? 'Refleksgradering' : 'Reflex Grading'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'numeric', label: '0-4', desc: lang === 'no' ? 'Standard numerisk' : 'Standard numeric' },
                    { id: 'plus_minus', label: '+/++/+++', desc: lang === 'no' ? 'Pluss-system' : 'Plus system' },
                    { id: 'descriptive', label: lang === 'no' ? 'Beskrivende' : 'Descriptive', desc: lang === 'no' ? 'Absent/normal/hyperaktiv' : 'Absent/normal/hyperactive' },
                  ].map(format => (
                    <label
                      key={format.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                        (clinicalPrefs.testSettings?.neurological?.reflexGrading || 'numeric') === format.id
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reflexGrading"
                        value={format.id}
                        className="sr-only"
                        checked={(clinicalPrefs.testSettings?.neurological?.reflexGrading || 'numeric') === format.id}
                        onChange={(e) => handleNestedSettingsChange('tests', 'neurological', 'reflexGrading', e.target.value)}
                      />
                      <p className="font-medium text-gray-900">{format.label}</p>
                      <p className="text-xs text-gray-500">{format.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* ROM Format */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {lang === 'no' ? 'Bevegelighet (ROM) - Format' : 'Range of Motion (ROM) - Format'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'degrees', label: lang === 'no' ? 'Grader' : 'Degrees', desc: '45°, 90°' },
                    { id: 'percentage', label: '%', desc: '50%, 75%' },
                    { id: 'descriptive', label: lang === 'no' ? 'Beskrivende' : 'Descriptive', desc: lang === 'no' ? 'Normal/redusert' : 'Normal/reduced' },
                    { id: 'aga', label: 'AGA', desc: lang === 'no' ? 'AGA-skala' : 'AGA scale' },
                  ].map(format => (
                    <label
                      key={format.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                        (clinicalPrefs.testSettings?.rom?.format || 'degrees') === format.id
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="romFormat"
                        value={format.id}
                        className="sr-only"
                        checked={(clinicalPrefs.testSettings?.rom?.format || 'degrees') === format.id}
                        onChange={(e) => handleNestedSettingsChange('tests', 'rom', 'format', e.target.value)}
                      />
                      <p className="font-medium text-gray-900">{format.label}</p>
                      <p className="text-xs text-gray-500">{format.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional test options */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lang === 'no' ? 'Inkluder normalverdier' : 'Include Normal Values'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === 'no' ? 'Vis referanseverdier ved ROM' : 'Show reference values for ROM'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={clinicalPrefs.testSettings?.rom?.includeNormal ?? true}
                      onChange={(e) => handleNestedSettingsChange('tests', 'rom', 'includeNormal', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lang === 'no' ? 'Inkluder dermatomer' : 'Include Dermatomes'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === 'no' ? 'Vis dermatomreferanse i nevrologiske tester' : 'Show dermatome reference in neuro tests'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={clinicalPrefs.testSettings?.neurological?.includeDermatomes ?? true}
                      onChange={(e) => handleNestedSettingsChange('tests', 'neurological', 'includeDermatomes', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
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
                    {lang === 'no' ? 'Språk' : 'Language'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {lang === 'no'
                      ? 'Velg språk for kliniske komponenter'
                      : 'Select language for clinical components'}
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
                    <p className="text-xs text-gray-500">Norwegian</p>
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
                    <p className="text-xs text-gray-500">Engelsk</p>
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
                    {lang === 'no' ? 'Kartvisning' : 'Chart Display'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {lang === 'no'
                      ? 'Standardinnstillinger for anatomiske kart'
                      : 'Default settings for anatomical charts'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Show Dermatomes */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {lang === 'no' ? 'Vis dermatomer' : 'Show Dermatomes'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === 'no'
                      ? 'Vis nerverotsfordelinger på anatomisk kart'
                      : 'Display nerve root distributions on anatomical charts'}
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
                    {lang === 'no' ? 'Vis triggerpunkter' : 'Show Trigger Points'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === 'no'
                      ? 'Vis myofascielle triggerpunkter på kart'
                      : 'Display myofascial trigger points on charts'}
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
                    {lang === 'no' ? 'Auto-generer narrativ' : 'Auto-generate Narrative'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === 'no'
                      ? 'Generer klinisk narrativ automatisk ved lagring'
                      : 'Automatically generate clinical narrative on save'}
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

          {/* Spine Templates (Quick Palpation) */}
          <SpineTemplatesEditor lang={lang} />

          {/* Current Settings Summary */}
          <div className="bg-teal-50 rounded-lg border border-teal-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-teal-900">
                    {lang === 'no' ? 'Aktive innstillinger' : 'Active Settings'}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-teal-700">
                      <span className="font-medium">{lang === 'no' ? 'Notasjon:' : 'Notation:'}</span>{' '}
                      {ADJUSTMENT_NOTATION_METHODS.find(m => m.id === clinicalPrefs.adjustmentNotation)?.name[lang] ||
                       ADJUSTMENT_NOTATION_METHODS.find(m => m.id === clinicalPrefs.adjustmentNotation)?.name.en}
                    </p>
                    <p className="text-sm text-teal-700">
                      <span className="font-medium">{lang === 'no' ? 'Ortopediske tester:' : 'Ortho tests:'}</span>{' '}
                      {clinicalPrefs.testSettings?.orthopedic?.resultFormat === 'plus_minus' ? '+/-' :
                       clinicalPrefs.testSettings?.orthopedic?.resultFormat === 'pos_neg' ? 'Pos/Neg' :
                       clinicalPrefs.testSettings?.orthopedic?.resultFormat === 'numeric' ? '0-3' : lang === 'no' ? 'Beskrivende' : 'Descriptive'}
                    </p>
                    <p className="text-sm text-teal-700">
                      <span className="font-medium">{lang === 'no' ? 'ROM:' : 'ROM:'}</span>{' '}
                      {clinicalPrefs.testSettings?.rom?.format === 'degrees' ? (lang === 'no' ? 'Grader' : 'Degrees') :
                       clinicalPrefs.testSettings?.rom?.format === 'percentage' ? '%' :
                       clinicalPrefs.testSettings?.rom?.format === 'aga' ? 'AGA' : lang === 'no' ? 'Beskrivende' : 'Descriptive'}
                    </p>
                  </div>
                  <p className="text-xs text-teal-600 mt-3">
                    {updateClinicalSettingsMutation.isPending ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {lang === 'no' ? 'Lagrer...' : 'Saving...'}
                      </span>
                    ) : (
                      lang === 'no'
                        ? 'Innstillingene synkroniseres automatisk til serveren.'
                        : 'Settings are automatically synced to the server.'
                    )}
                  </p>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  if (confirm(lang === 'no'
                    ? 'Tilbakestille alle kliniske innstillinger til standard?'
                    : 'Reset all clinical settings to defaults?')) {
                    resetClinicalSettingsMutation.mutate()
                  }
                }}
                disabled={resetClinicalSettingsMutation.isPending}
                className="px-3 py-1.5 text-sm border border-teal-300 rounded-lg text-teal-700 hover:bg-teal-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {lang === 'no' ? 'Tilbakestill' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          {/* Today's Messages - Main Focus */}
          <div className="bg-white rounded-lg border-2 border-green-200 shadow-sm">
            <div className="px-6 py-4 border-b border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Dagens Meldinger
                  </h2>
                  <p className="text-sm text-gray-600">
                    Se over og godkjenn meldinger før de sendes
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <TodaysMessages />
            </div>
          </div>

          {/* Appointment Import */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Importer Timer fra SolvitJournal
                  </h2>
                  <p className="text-sm text-gray-500">
                    Lim inn fra SolvitJournal kalender eller last opp Excel
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AppointmentImporter onImportComplete={() => {
                window.location.reload()
              }} />
            </div>
          </div>

          {/* Conflict Decisions - Secondary */}
          <details className="bg-white rounded-lg border border-gray-200">
            <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Konflikter & Utsettelser
                  </h2>
                  <p className="text-sm text-gray-500">
                    Når pasienter booker ny time før planlagt SMS
                  </p>
                </div>
              </div>
            </summary>
            <div className="p-6 border-t">
              <SchedulerDecisions />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
