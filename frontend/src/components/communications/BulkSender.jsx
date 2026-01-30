/**
 * BulkSender Component
 *
 * Bulk SMS/Email sender for ChiroClickCRM.
 * Allows sending personalized messages to multiple patients at once.
 *
 * Features:
 * - Patient selection with advanced filtering
 * - Template selection and customization
 * - Communication type toggle (SMS/Email)
 * - Scheduled send time picker
 * - Message preview with personalization
 * - Real-time progress tracking
 * - Norwegian translations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Mail,
  MessageSquare,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Pause,
  Play,
  X,
  FileText,
  Edit3,
  Info,
  Zap,
} from 'lucide-react';
import PatientFilter from './PatientFilter';

// API functions
const bulkCommunicationAPI = {
  getPatients: async (filters) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/v1/bulk-communications/patients?${params}`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },
  getTemplates: async (type) => {
    const params = type ? `?type=${type}` : '';
    const response = await fetch(`/api/v1/bulk-communications/templates${params}`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },
  getVariables: async () => {
    const response = await fetch('/api/v1/bulk-communications/variables');
    if (!response.ok) throw new Error('Failed to fetch variables');
    return response.json();
  },
  previewMessage: async (data) => {
    const response = await fetch('/api/v1/bulk-communications/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to preview message');
    return response.json();
  },
  queueBulkSend: async (data) => {
    const response = await fetch('/api/v1/bulk-communications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to queue messages');
    }
    return response.json();
  },
  getBatchStatus: async (batchId) => {
    const response = await fetch(`/api/v1/bulk-communications/queue/status/${batchId}`);
    if (!response.ok) throw new Error('Failed to fetch batch status');
    return response.json();
  },
  cancelBatch: async (batchId) => {
    const response = await fetch(`/api/v1/bulk-communications/queue/cancel/${batchId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to cancel batch');
    return response.json();
  },
};

export default function BulkSender({
  clinicInfo = {},
  language = 'no',
  className = '',
  onClose,
}) {
  const queryClient = useQueryClient();

  // State
  const [step, setStep] = useState(1); // 1: Select patients, 2: Compose message, 3: Review, 4: Progress
  const [communicationType, setCommunicationType] = useState('SMS');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate'); // 'immediate' or 'scheduled'
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [showPreview, setShowPreview] = useState(false);
  const [previewPatientId, setPreviewPatientId] = useState(null);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [showVariables, setShowVariables] = useState(false);

  // Labels
  const labels = {
    en: {
      title: 'Bulk Communication',
      subtitle: 'Send personalized messages to multiple patients',
      step1: 'Select Patients',
      step2: 'Compose Message',
      step3: 'Review & Send',
      step4: 'Sending Progress',
      communicationType: 'Communication Type',
      sms: 'SMS',
      email: 'Email',
      selectTemplate: 'Select Template',
      noTemplate: 'No template (custom message)',
      customMessage: 'Custom Message',
      subject: 'Subject',
      messagePlaceholder: 'Enter your message here...',
      subjectPlaceholder: 'Enter email subject...',
      availableVariables: 'Available Variables',
      variableHelp: 'Click to insert variable',
      schedule: 'Schedule',
      sendImmediately: 'Send Immediately',
      scheduleForLater: 'Schedule for Later',
      scheduledTime: 'Scheduled Time',
      priority: 'Priority',
      priorityHigh: 'High',
      priorityNormal: 'Normal',
      priorityLow: 'Low',
      preview: 'Preview',
      previewMessage: 'Preview Message',
      hidePreview: 'Hide Preview',
      selectPatientForPreview: 'Select a patient to preview personalized message',
      characterCount: 'characters',
      smsSegments: 'SMS segments',
      back: 'Back',
      next: 'Next',
      send: 'Send',
      cancel: 'Cancel',
      sending: 'Sending...',
      queued: 'Messages Queued',
      reviewing: 'Review Your Message',
      selectedPatients: 'Selected Patients',
      messagePreview: 'Message Preview',
      confirmSend: 'Confirm & Send',
      scheduledFor: 'Scheduled for',
      progress: 'Progress',
      sent: 'Sent',
      failed: 'Failed',
      pending: 'Pending',
      completed: 'Completed',
      completedWithErrors: 'Completed with errors',
      cancelBatch: 'Cancel Batch',
      viewDetails: 'View Details',
      estimatedCompletion: 'Estimated completion',
      skippedPatients: 'Skipped Patients',
      skippedReason: 'Reason',
      close: 'Close',
      newBatch: 'New Batch',
      warnings: {
        noPatients: 'Please select at least one patient',
        noMessage: 'Please enter a message or select a template',
        noSubject: 'Please enter an email subject',
        maxPatients: 'Maximum 1000 patients per batch',
      },
    },
    no: {
      title: 'Massekommunikasjon',
      subtitle: 'Send personlige meldinger til flere pasienter',
      step1: 'Velg Pasienter',
      step2: 'Skriv Melding',
      step3: 'Gjennomga & Send',
      step4: 'Sendingsfremgang',
      communicationType: 'Kommunikasjonstype',
      sms: 'SMS',
      email: 'E-post',
      selectTemplate: 'Velg Mal',
      noTemplate: 'Ingen mal (egendefinert melding)',
      customMessage: 'Egendefinert Melding',
      subject: 'Emne',
      messagePlaceholder: 'Skriv din melding her...',
      subjectPlaceholder: 'Skriv e-postemne...',
      availableVariables: 'Tilgjengelige Variabler',
      variableHelp: 'Klikk for a sette inn variabel',
      schedule: 'Planlegging',
      sendImmediately: 'Send Umiddelbart',
      scheduleForLater: 'Planlegg for Senere',
      scheduledTime: 'Planlagt Tidspunkt',
      priority: 'Prioritet',
      priorityHigh: 'Hoy',
      priorityNormal: 'Normal',
      priorityLow: 'Lav',
      preview: 'Forhandsvis',
      previewMessage: 'Forhandsvis Melding',
      hidePreview: 'Skjul Forhandsvisning',
      selectPatientForPreview: 'Velg en pasient for a forhandsvise personlig melding',
      characterCount: 'tegn',
      smsSegments: 'SMS-segmenter',
      back: 'Tilbake',
      next: 'Neste',
      send: 'Send',
      cancel: 'Avbryt',
      sending: 'Sender...',
      queued: 'Meldinger i Ko',
      reviewing: 'Gjennomga Din Melding',
      selectedPatients: 'Valgte Pasienter',
      messagePreview: 'Meldingsforhandsvisning',
      confirmSend: 'Bekreft & Send',
      scheduledFor: 'Planlagt for',
      progress: 'Fremgang',
      sent: 'Sendt',
      failed: 'Feilet',
      pending: 'Venter',
      completed: 'Fullfort',
      completedWithErrors: 'Fullfort med feil',
      cancelBatch: 'Avbryt Batch',
      viewDetails: 'Vis Detaljer',
      estimatedCompletion: 'Estimert fullforelse',
      skippedPatients: 'Hoppet over Pasienter',
      skippedReason: 'Arsak',
      close: 'Lukk',
      newBatch: 'Ny Batch',
      warnings: {
        noPatients: 'Velg minst en pasient',
        noMessage: 'Skriv en melding eller velg en mal',
        noSubject: 'Skriv et e-postemne',
        maxPatients: 'Maksimalt 1000 pasienter per batch',
      },
    },
  };

  const t = labels[language] || labels.no;

  // Queries
  const {
    data: patientsData,
    isLoading: patientsLoading,
  } = useQuery({
    queryKey: ['bulk-patients', communicationType],
    queryFn: () =>
      bulkCommunicationAPI.getPatients({
        type: communicationType,
        hasConsent: 'true',
        limit: '500',
      }),
  });

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['bulk-templates', communicationType],
    queryFn: () => bulkCommunicationAPI.getTemplates(communicationType),
  });

  const { data: variablesData } = useQuery({
    queryKey: ['template-variables'],
    queryFn: bulkCommunicationAPI.getVariables,
  });

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['message-preview', previewPatientId, customMessage, selectedTemplateId],
    queryFn: () =>
      bulkCommunicationAPI.previewMessage({
        patientId: previewPatientId,
        templateContent: getMessageContent(),
        clinicInfo,
      }),
    enabled: !!previewPatientId && showPreview,
  });

  const { data: batchStatus, refetch: refetchBatchStatus } = useQuery({
    queryKey: ['batch-status', activeBatchId],
    queryFn: () => bulkCommunicationAPI.getBatchStatus(activeBatchId),
    enabled: !!activeBatchId,
    refetchInterval: activeBatchId ? 2000 : false, // Poll every 2 seconds when active
  });

  // Mutations
  const queueMutation = useMutation({
    mutationFn: bulkCommunicationAPI.queueBulkSend,
    onSuccess: (data) => {
      setActiveBatchId(data.data.batchId);
      setStep(4);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: bulkCommunicationAPI.cancelBatch,
    onSuccess: () => {
      refetchBatchStatus();
    },
  });

  // Get message content (from template or custom)
  const getMessageContent = useCallback(() => {
    if (selectedTemplateId) {
      const template = templatesData?.data?.find((t) => t.id === selectedTemplateId);
      return template?.body || '';
    }
    return customMessage;
  }, [selectedTemplateId, templatesData, customMessage]);

  // Calculate message stats
  const messageStats = useMemo(() => {
    const content = getMessageContent();
    const charCount = content.length;
    const smsSegments = Math.ceil(charCount / 160) || 1;
    return { charCount, smsSegments };
  }, [getMessageContent]);

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templatesData?.data?.find((t) => t.id === templateId);
      if (template) {
        setCustomMessage(template.body);
        if (template.subject) {
          setCustomSubject(template.subject);
        }
      }
    }
  };

  // Insert variable into message
  const insertVariable = (variable) => {
    setCustomMessage((prev) => prev + variable);
  };

  // Validation
  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        if (selectedPatients.length === 0) return t.warnings.noPatients;
        if (selectedPatients.length > 1000) return t.warnings.maxPatients;
        return null;
      case 2:
        if (!getMessageContent().trim()) return t.warnings.noMessage;
        if (communicationType === 'EMAIL' && !customSubject.trim()) return t.warnings.noSubject;
        return null;
      default:
        return null;
    }
  };

  const canProceed = !validateStep(step);

  // Handle send
  const handleSend = () => {
    queueMutation.mutate({
      patientIds: selectedPatients,
      templateId: selectedTemplateId,
      type: communicationType,
      scheduledAt: scheduleType === 'scheduled' ? scheduledDateTime : null,
      priority,
      customSubject: communicationType === 'EMAIL' ? customSubject : null,
      customMessage: customMessage || null,
      clinicInfo,
    });
  };

  // Reset form for new batch
  const handleNewBatch = () => {
    setStep(1);
    setSelectedPatients([]);
    setSelectedTemplateId(null);
    setCustomMessage('');
    setCustomSubject('');
    setScheduleType('immediate');
    setScheduledDateTime('');
    setActiveBatchId(null);
  };

  // Progress calculations
  const progressPercentage = batchStatus?.data?.progressPercentage || 0;
  const isComplete = batchStatus?.data?.status === 'COMPLETED' ||
    batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS' ||
    batchStatus?.data?.status === 'CANCELLED';

  // Stop polling when complete
  useEffect(() => {
    if (isComplete) {
      queryClient.invalidateQueries(['batch-status', activeBatchId]);
    }
  }, [isComplete, activeBatchId, queryClient]);

  return (
    <div className={`bg-white rounded-xl shadow-xl border border-gray-200 max-w-4xl w-full ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              {t.title}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{t.subtitle}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-3 text-sm text-gray-600">
            {step === 1 && t.step1}
            {step === 2 && t.step2}
            {step === 3 && t.step3}
            {step === 4 && t.step4}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Step 1: Select Patients */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Communication Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.communicationType}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCommunicationType('SMS');
                    setSelectedPatients([]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    communicationType === 'SMS'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {t.sms}
                </button>
                <button
                  onClick={() => {
                    setCommunicationType('EMAIL');
                    setSelectedPatients([]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    communicationType === 'EMAIL'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  {t.email}
                </button>
              </div>
            </div>

            {/* Patient Filter */}
            <PatientFilter
              patients={patientsData?.data?.patients || []}
              selectedPatients={selectedPatients}
              onSelectionChange={setSelectedPatients}
              communicationType={communicationType}
              language={language}
              isLoading={patientsLoading}
              showConsentFilter={true}
              maxSelection={1000}
            />
          </div>
        )}

        {/* Step 2: Compose Message */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.selectTemplate}
              </label>
              <select
                value={selectedTemplateId || ''}
                onChange={(e) => handleTemplateSelect(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.noTemplate}</option>
                {templatesData?.data?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Subject (for email only) */}
            {communicationType === 'EMAIL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.subject}
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={t.subjectPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Message Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.customMessage}
                </label>
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  {t.availableVariables}
                  {showVariables ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Variables Panel */}
              {showVariables && variablesData?.data && (
                <div className="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">{t.variableHelp}</p>
                  <div className="flex flex-wrap gap-1">
                    {variablesData.data.map((v) => (
                      <button
                        key={v.variable}
                        onClick={() => insertVariable(v.variable)}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300"
                        title={v.description}
                      >
                        {v.variable}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Character count */}
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>
                  {messageStats.charCount} {t.characterCount}
                  {communicationType === 'SMS' && ` (${messageStats.smsSegments} ${t.smsSegments})`}
                </span>
              </div>
            </div>

            {/* Schedule Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.schedule}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setScheduleType('immediate')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    scheduleType === 'immediate'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {t.sendImmediately}
                </button>
                <button
                  onClick={() => setScheduleType('scheduled')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    scheduleType === 'scheduled'
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {t.scheduleForLater}
                </button>
              </div>

              {scheduleType === 'scheduled' && (
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">{t.scheduledTime}</label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.priority}
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'HIGH', label: t.priorityHigh, color: 'red' },
                  { value: 'NORMAL', label: t.priorityNormal, color: 'blue' },
                  { value: 'LOW', label: t.priorityLow, color: 'gray' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      priority === p.value
                        ? `bg-${p.color}-50 border-${p.color}-300 text-${p.color}-700`
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t.reviewing}</h3>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-700">{t.selectedPatients}</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{selectedPatients.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {communicationType === 'SMS' ? (
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Mail className="w-5 h-5 text-purple-600" />
                    )}
                    <span className="text-sm text-purple-700">{t.communicationType}</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {communicationType === 'SMS' ? t.sms : t.email}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">{t.schedule}</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    {scheduleType === 'immediate'
                      ? t.sendImmediately
                      : new Date(scheduledDateTime).toLocaleString(language === 'no' ? 'nb-NO' : 'en-US')}
                  </p>
                </div>
              </div>

              {/* Message Preview */}
              <div className="border border-gray-200 rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t.messagePreview}</span>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        {t.hidePreview}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        {t.previewMessage}
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4">
                  {communicationType === 'EMAIL' && customSubject && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500">{t.subject}:</span>
                      <p className="font-medium text-gray-900">{customSubject}</p>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-3 rounded">
                      {getMessageContent()}
                    </pre>
                  </div>

                  {/* Personalized Preview */}
                  {showPreview && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm text-gray-600 mb-2">
                        {t.selectPatientForPreview}
                      </label>
                      <select
                        value={previewPatientId || ''}
                        onChange={(e) => setPreviewPatientId(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">-- {t.selectPatientForPreview} --</option>
                        {patientsData?.data?.patients
                          ?.filter((p) => selectedPatients.includes(p.id))
                          .slice(0, 20)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.firstName} {p.lastName}
                            </option>
                          ))}
                      </select>

                      {previewLoading ? (
                        <div className="mt-3 flex items-center gap-2 text-gray-500">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Loading preview...
                        </div>
                      ) : previewData?.data ? (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900 font-medium mb-1">
                            {previewData.data.patientName}
                          </p>
                          <pre className="whitespace-pre-wrap font-sans text-sm text-blue-800">
                            {previewData.data.personalizedContent}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Progress */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="text-center">
              {batchStatus?.data?.status === 'COMPLETED' ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              ) : batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS' ? (
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
              ) : batchStatus?.data?.status === 'CANCELLED' ? (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
              ) : (
                <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-3 animate-spin" />
              )}
              <h3 className="text-lg font-medium text-gray-900">
                {batchStatus?.data?.status === 'COMPLETED'
                  ? t.completed
                  : batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS'
                  ? t.completedWithErrors
                  : batchStatus?.data?.status === 'CANCELLED'
                  ? t.cancel
                  : t.sending}
              </h3>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-600">{t.progress}</span>
                <span className="font-medium text-gray-900">{progressPercentage}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    batchStatus?.data?.status === 'COMPLETED'
                      ? 'bg-green-500'
                      : batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            {batchStatus?.data?.stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {batchStatus.data.stats.sent || 0}
                  </p>
                  <p className="text-sm text-green-700">{t.sent}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {batchStatus.data.stats.failed || 0}
                  </p>
                  <p className="text-sm text-red-700">{t.failed}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-600">
                    {batchStatus.data.stats.pending || 0}
                  </p>
                  <p className="text-sm text-gray-700">{t.pending}</p>
                </div>
              </div>
            )}

            {/* Estimated Completion */}
            {batchStatus?.data?.estimatedCompletionTime && !isComplete && (
              <div className="text-center text-sm text-gray-500">
                {t.estimatedCompletion}:{' '}
                {new Date(batchStatus.data.estimatedCompletionTime).toLocaleTimeString(
                  language === 'no' ? 'nb-NO' : 'en-US'
                )}
              </div>
            )}

            {/* Skipped Patients */}
            {batchStatus?.data?.skippedPatients?.length > 0 && (
              <div className="border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="px-4 py-3 border-b border-yellow-200">
                  <span className="font-medium text-yellow-800">{t.skippedPatients}</span>
                </div>
                <div className="max-h-[150px] overflow-y-auto divide-y divide-yellow-100">
                  {batchStatus.data.skippedPatients.map((p, idx) => (
                    <div key={idx} className="px-4 py-2 flex items-center justify-between">
                      <span className="text-sm text-yellow-900">{p.name}</span>
                      <span className="text-xs text-yellow-700">{p.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel Button */}
            {!isComplete && (
              <div className="flex justify-center">
                <button
                  onClick={() => cancelMutation.mutate(activeBatchId)}
                  disabled={cancelMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                >
                  <Pause className="w-4 h-4" />
                  {t.cancelBatch}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        {/* Validation Error */}
        {validateStep(step) && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {validateStep(step)}
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {step < 4 && (
            <>
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                >
                  {t.back}
                </button>
              )}
              {step < 3 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.next}
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleSend}
                  disabled={queueMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {queueMutation.isPending ? t.sending : t.confirmSend}
                </button>
              )}
            </>
          )}
          {step === 4 && isComplete && (
            <button
              onClick={handleNewBatch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              {t.newBatch}
            </button>
          )}
          {onClose && step === 4 && isComplete && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              {t.close}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact trigger button for embedding in other components
export function BulkSenderButton({ onClick, language = 'no', className = '' }) {
  const labels = {
    en: { label: 'Bulk Send' },
    no: { label: 'Masseutsending' },
  };
  const t = labels[language] || labels.no;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${className}`}
    >
      <Send className="w-4 h-4" />
      {t.label}
    </button>
  );
}
