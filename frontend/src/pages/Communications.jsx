import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Search,
  X,
  FileText,
  Clock,
  User,
  Filter,
  Mail,
  Smartphone,
  Calendar,
  Stethoscope,
  RefreshCw,
  CreditCard,
  Heart,
  AlertTriangle,
  Star,
  ChevronDown
} from 'lucide-react'
import { communicationsAPI, patientsAPI } from '../services/api'
import { formatDate, formatPhone } from '../lib/utils'
import toast from '../utils/toast'
import {
  TONES,
  CATEGORIES,
  TEMPLATES,
  EMAIL_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByTone,
  substituteVariables
} from '../data/communicationTemplates'

// Icon map for categories
const categoryIcons = {
  appointments: Calendar,
  clinical: Stethoscope,
  recalls: RefreshCw,
  billing: CreditCard,
  engagement: Heart,
  urgent: AlertTriangle
}

// Get user's preferred language (would come from settings in production)
const getLanguage = () => {
  // Check for Norwegian browser language or use 'no' for Norwegian, 'en' for English
  const browserLang = navigator.language || 'en'
  return browserLang.startsWith('no') || browserLang.startsWith('nb') || browserLang.startsWith('nn') ? 'no' : 'en'
}

export default function Communications() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('compose')
  const [messageType, setMessageType] = useState('sms')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showPatientSearch, setShowPatientSearch] = useState(false)
  const [copied, setCopied] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('')

  // New state for template browser
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTone, setSelectedTone] = useState('direct')
  const [language, setLanguage] = useState(getLanguage())
  const [favoriteTemplates, setFavoriteTemplates] = useState(() => {
    const saved = localStorage.getItem('favoriteTemplates')
    return saved ? JSON.parse(saved) : []
  })

  // Fetch templates
  const { data: templatesResponse } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: () => communicationsAPI.getTemplates(),
  })

  const templates = templatesResponse?.data?.templates || []

  // Fetch communications history
  const { data: historyResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['communications-history', historyFilter],
    queryFn: () => communicationsAPI.getAll({
      type: historyFilter || undefined,
      limit: 50,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }),
    enabled: activeTab === 'history',
  })

  const history = historyResponse?.data?.communications || []

  // Search patients
  const { data: searchResponse, isLoading: searchLoading } = useQuery({
    queryKey: ['patient-search', searchTerm],
    queryFn: () => patientsAPI.search(searchTerm),
    enabled: searchTerm.length >= 2,
  })

  const searchResults = searchResponse?.data?.patients || []

  // Character counter for SMS
  const maxSmsLength = 160
  const remainingChars = maxSmsLength - message.length
  const smsCount = Math.ceil(message.length / maxSmsLength) || 1

  // Get filtered templates based on category and tone
  const getFilteredTemplates = () => {
    let templateList = messageType === 'email' ? EMAIL_TEMPLATES : TEMPLATES

    // Filter by category
    if (selectedCategory !== 'all') {
      templateList = templateList.filter(t => t.category === selectedCategory)
    }

    // Filter by tone
    templateList = templateList.filter(t => t.tone === selectedTone)

    return templateList
  }

  // Toggle favorite template
  const toggleFavorite = (templateId) => {
    const newFavorites = favoriteTemplates.includes(templateId)
      ? favoriteTemplates.filter(id => id !== templateId)
      : [...favoriteTemplates, templateId]
    setFavoriteTemplates(newFavorites)
    localStorage.setItem('favoriteTemplates', JSON.stringify(newFavorites))
  }

  // Apply template from new system
  const applyLocalTemplate = (template) => {
    setSelectedTemplate(template)

    // Get content in selected language
    const content = messageType === 'email'
      ? template.body?.[language] || template.body?.en || ''
      : template.content?.[language] || template.content?.en || ''

    // Prepare variables from patient data
    const variables = {}
    if (selectedPatient) {
      variables.firstName = selectedPatient.first_name
      variables.lastName = selectedPatient.last_name
      variables.fullName = `${selectedPatient.first_name} ${selectedPatient.last_name}`
      variables.phone = formatPhone(selectedPatient.phone) || ''
      variables.email = selectedPatient.email || ''
    }

    // Substitute variables
    const finalContent = substituteVariables(content, variables)
    setMessage(finalContent)
  }

  // Apply template (legacy API templates)
  const applyTemplate = (template) => {
    setSelectedTemplate(template)
    let content = template.content

    // Replace placeholders with patient data
    if (selectedPatient) {
      content = content.replace('{{first_name}}', selectedPatient.first_name)
      content = content.replace('{{last_name}}', selectedPatient.last_name)
      content = content.replace('{{full_name}}', `${selectedPatient.first_name} ${selectedPatient.last_name}`)
    }

    setMessage(content)
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (data) => {
      if (messageType === 'sms') {
        return communicationsAPI.sendSMS(data)
      } else {
        return communicationsAPI.sendEmail(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communications-history'])
      setMessage('')
      setSelectedPatient(null)
      setSelectedTemplate(null)
      toast.success(`${messageType.toUpperCase()} logged successfully! Copy the message and send manually.`)
    },
    onError: (error) => {
      toast.error(`Failed to log ${messageType}: ${error.response?.data?.message || error.message}`)
    },
  })

  const handleSend = () => {
    if (!selectedPatient) {
      toast.warning('Please select a patient')
      return
    }

    if (!message.trim()) {
      toast.warning('Please enter a message')
      return
    }

    const data = {
      patient_id: selectedPatient.id,
      message: message.trim(),
      template_id: selectedTemplate?.id,
    }

    sendMutation.mutate(data)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Communications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Send SMS and email messages to patients
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'compose'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Compose
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              History
            </div>
          </button>
        </nav>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Composer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message Type Selector */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Message Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setMessageType('sms')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    messageType === 'sms'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="font-medium">SMS</span>
                </button>
                <button
                  onClick={() => setMessageType('email')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    messageType === 'email'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Email</span>
                </button>
              </div>
            </div>

            {/* Patient Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recipient
              </label>

              {selectedPatient ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {messageType === 'sms'
                          ? formatPhone(selectedPatient.phone)
                          : selectedPatient.email || 'No email on file'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-1 rounded-lg hover:bg-blue-100 text-blue-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search patients by name, phone, or email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowPatientSearch(true)
                    }}
                    onFocus={() => setShowPatientSearch(true)}
                  />

                  {/* Search Results Dropdown */}
                  {showPatientSearch && searchTerm.length >= 2 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((patient) => (
                          <button
                            key={patient.id}
                            onClick={() => {
                              setSelectedPatient(patient)
                              setSearchTerm('')
                              setShowPatientSearch(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatPhone(patient.phone)} • {patient.email}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No patients found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Composer */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Type your ${messageType} message here...`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={messageType === 'sms' ? 6 : 10}
              />

              {/* Character Counter (SMS only) */}
              {messageType === 'sms' && (
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className={`${
                    remainingChars < 0
                      ? 'text-red-600 font-medium'
                      : remainingChars < 20
                      ? 'text-orange-600'
                      : 'text-gray-500'
                  }`}>
                    {remainingChars} characters remaining
                  </span>
                  <span className="text-gray-500">
                    {smsCount} SMS {smsCount > 1 ? 'messages' : 'message'}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={copyToClipboard}
                  disabled={!message.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!selectedPatient || !message.trim() || sendMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sendMutation.isLoading ? 'Logging...' : 'Log Message'}
                </button>
              </div>

              {messageType === 'sms' && (
                <p className="text-xs text-gray-500 mt-3">
                  Note: Messages are logged in the system. Copy and send manually via your SMS provider.
                </p>
              )}
            </div>
          </div>

          {/* Templates Sidebar - Enhanced */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tone Selector */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                {language === 'no' ? 'Tone' : 'Tone'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(TONES).map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      selectedTone === tone.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    title={tone.description[language]}
                  >
                    {tone.name[language]}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Toggle */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                {language === 'no' ? 'Språk' : 'Language'}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('no')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    language === 'no'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  🇳🇴 Norsk
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    language === 'en'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                {language === 'no' ? 'Kategori' : 'Category'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    selectedCategory === 'all'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {language === 'no' ? 'Alle' : 'All'}
                </button>
                {Object.values(CATEGORIES).map((cat) => {
                  const IconComponent = categoryIcons[cat.id] || FileText
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selectedCategory === cat.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="w-3 h-3" />
                      {cat.name[language]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Template List */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {language === 'no' ? 'Maler' : 'Templates'}
                <span className="text-xs text-gray-400">
                  ({getFilteredTemplates().length})
                </span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredTemplates().length > 0 ? (
                  getFilteredTemplates().map((template) => {
                    const isFavorite = favoriteTemplates.includes(template.id)
                    const displayContent = messageType === 'email'
                      ? template.subject?.[language] || template.subject?.en || ''
                      : template.content?.[language] || template.content?.en || ''

                    return (
                      <div
                        key={template.id}
                        className={`relative p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => applyLocalTemplate(template)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(template.id)
                          }}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        </button>
                        <div className="pr-6">
                          <div className="font-medium text-sm text-gray-900">
                            {template.name[language]}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {displayContent}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {CATEGORIES[template.category]?.name[language]}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 text-sm text-gray-500">
                    {language === 'no' ? 'Ingen maler funnet' : 'No templates found'}
                  </div>
                )}
              </div>
            </div>

            {/* Legacy API Templates (if any) */}
            {templates.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {language === 'no' ? 'Egendefinerte Maler' : 'Custom Templates'}
                </h3>
                <div className="space-y-2">
                  {templates
                    .filter(t => !messageType || t.type === messageType.toUpperCase())
                    .map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.content}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Filter */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Messages</option>
                <option value="SMS">SMS Only</option>
                <option value="EMAIL">Email Only</option>
              </select>
            </div>
          </div>

          {/* History List */}
          <div className="divide-y divide-gray-100">
            {historyLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">Loading history...</p>
              </div>
            ) : history.length > 0 ? (
              history.map((comm) => (
                <div key={comm.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        comm.type === 'SMS' ? 'bg-purple-50' : 'bg-blue-50'
                      }`}>
                        {comm.type === 'SMS' ? (
                          <Smartphone className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Mail className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {comm.patient_name}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            comm.type === 'SMS'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {comm.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {comm.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatDate(comm.created_at, 'time')}</span>
                          {comm.template_name && (
                            <span>Template: {comm.template_name}</span>
                          )}
                          <span>By: {comm.sent_by_name || 'System'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No messages sent yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
