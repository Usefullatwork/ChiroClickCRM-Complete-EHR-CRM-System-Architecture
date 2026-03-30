/**
 * BulkSender Component (Orchestrator)
 *
 * Bulk SMS/Email sender for ChiroClickEHR.
 * Sub-components: RecipientSelector, MessageComposer, SendProgress, BulkHistory
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

import RecipientSelector from './BulkSender/RecipientSelector';
import MessageComposer from './BulkSender/MessageComposer';
import BulkHistory from './BulkSender/BulkHistory';
import SendProgress from './BulkSender/SendProgress';

// API functions
const bulkCommunicationAPI = {
  getPatients: async (filters) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/v1/bulk-communications/patients?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }
    return response.json();
  },
  getTemplates: async (type) => {
    const params = type ? `?type=${type}` : '';
    const response = await fetch(`/api/v1/bulk-communications/templates${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    return response.json();
  },
  getVariables: async () => {
    const response = await fetch('/api/v1/bulk-communications/variables');
    if (!response.ok) {
      throw new Error('Failed to fetch variables');
    }
    return response.json();
  },
  previewMessage: async (data) => {
    const response = await fetch('/api/v1/bulk-communications/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to preview message');
    }
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
    if (!response.ok) {
      throw new Error('Failed to fetch batch status');
    }
    return response.json();
  },
  cancelBatch: async (batchId) => {
    const response = await fetch(`/api/v1/bulk-communications/queue/cancel/${batchId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to cancel batch');
    }
    return response.json();
  },
};

// Labels
const LABELS = {
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

export default function BulkSender({ clinicInfo = {}, language = 'no', className = '', onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [communicationType, setCommunicationType] = useState('SMS');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [showPreview, setShowPreview] = useState(false);
  const [previewPatientId, setPreviewPatientId] = useState(null);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [showVariables, setShowVariables] = useState(false);

  const t = LABELS[language] || LABELS.no;

  // Queries
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['bulk-patients', communicationType],
    queryFn: () =>
      bulkCommunicationAPI.getPatients({
        type: communicationType,
        hasConsent: 'true',
        limit: '500',
      }),
  });
  const { data: templatesData } = useQuery({
    queryKey: ['bulk-templates', communicationType],
    queryFn: () => bulkCommunicationAPI.getTemplates(communicationType),
  });
  const { data: variablesData } = useQuery({
    queryKey: ['template-variables'],
    queryFn: bulkCommunicationAPI.getVariables,
  });

  const getMessageContent = useCallback(() => {
    if (selectedTemplateId) {
      const template = templatesData?.data?.find((tmpl) => tmpl.id === selectedTemplateId);
      return template?.body || '';
    }
    return customMessage;
  }, [selectedTemplateId, templatesData, customMessage]);

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
    refetchInterval: activeBatchId ? 2000 : false,
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

  const messageStats = useMemo(() => {
    const content = getMessageContent();
    return { charCount: content.length, smsSegments: Math.ceil(content.length / 160) || 1 };
  }, [getMessageContent]);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templatesData?.data?.find((tmpl) => tmpl.id === templateId);
      if (template) {
        setCustomMessage(template.body);
        if (template.subject) {
          setCustomSubject(template.subject);
        }
      }
    }
  };

  const insertVariable = (variable) => {
    setCustomMessage((prev) => prev + variable);
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        if (selectedPatients.length === 0) {
          return t.warnings.noPatients;
        }
        if (selectedPatients.length > 1000) {
          return t.warnings.maxPatients;
        }
        return null;
      case 2:
        if (!getMessageContent().trim()) {
          return t.warnings.noMessage;
        }
        if (communicationType === 'EMAIL' && !customSubject.trim()) {
          return t.warnings.noSubject;
        }
        return null;
      default:
        return null;
    }
  };

  const canProceed = !validateStep(step);

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

  const progressPercentage = batchStatus?.data?.progressPercentage || 0;
  const isComplete =
    batchStatus?.data?.status === 'COMPLETED' ||
    batchStatus?.data?.status === 'COMPLETED_WITH_ERRORS' ||
    batchStatus?.data?.status === 'CANCELLED';

  useEffect(() => {
    if (isComplete) {
      queryClient.invalidateQueries(['batch-status', activeBatchId]);
    }
  }, [isComplete, activeBatchId, queryClient]);

  return (
    <div
      className={`bg-white rounded-xl shadow-xl border border-gray-200 max-w-4xl w-full ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              {t.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.subtitle}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                      : 'bg-gray-200 text-gray-500 dark:text-gray-400'
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
            {step === 1 && t.step1}
            {step === 2 && t.step2}
            {step === 3 && t.step3}
            {step === 4 && t.step4}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 1 && (
          <RecipientSelector
            communicationType={communicationType}
            setCommunicationType={setCommunicationType}
            selectedPatients={selectedPatients}
            setSelectedPatients={setSelectedPatients}
            patientsData={patientsData}
            patientsLoading={patientsLoading}
            language={language}
            t={t}
          />
        )}
        {step === 2 && (
          <MessageComposer
            communicationType={communicationType}
            selectedTemplateId={selectedTemplateId}
            handleTemplateSelect={handleTemplateSelect}
            templatesData={templatesData}
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            customSubject={customSubject}
            setCustomSubject={setCustomSubject}
            scheduleType={scheduleType}
            setScheduleType={setScheduleType}
            scheduledDateTime={scheduledDateTime}
            setScheduledDateTime={setScheduledDateTime}
            priority={priority}
            setPriority={setPriority}
            showVariables={showVariables}
            setShowVariables={setShowVariables}
            variablesData={variablesData}
            insertVariable={insertVariable}
            messageStats={messageStats}
            t={t}
          />
        )}
        {step === 3 && (
          <BulkHistory
            selectedPatients={selectedPatients}
            communicationType={communicationType}
            scheduleType={scheduleType}
            scheduledDateTime={scheduledDateTime}
            customSubject={customSubject}
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            previewPatientId={previewPatientId}
            setPreviewPatientId={setPreviewPatientId}
            previewData={previewData}
            previewLoading={previewLoading}
            patientsData={patientsData}
            getMessageContent={getMessageContent}
            language={language}
            t={t}
          />
        )}
        {step === 4 && (
          <SendProgress
            batchStatus={batchStatus}
            progressPercentage={progressPercentage}
            isComplete={isComplete}
            activeBatchId={activeBatchId}
            cancelMutation={cancelMutation}
            language={language}
            t={t}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
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
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
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
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
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
  const btnT = labels[language] || labels.no;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${className}`}
    >
      <Send className="w-4 h-4" />
      {btnT.label}
    </button>
  );
}
