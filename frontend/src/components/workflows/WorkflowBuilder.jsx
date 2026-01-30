/**
 * WorkflowBuilder Component
 *
 * Visual builder for creating and editing automation workflows.
 * Supports trigger configuration, condition building, and action sequencing.
 *
 * Features:
 * - Trigger type selector with configuration
 * - Condition builder with AND/OR logic
 * - Action sequence builder with delays
 * - Preview and test functionality
 * - Enable/disable toggle
 * - Execution history panel
 * - Bilingual support (EN/NO)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  MessageSquare,
  UserPlus,
  Tag,
  Bell,
  Calendar,
  Gift,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  History,
  Save,
  RefreshCw,
  Zap,
  ArrowRight,
  GripVertical,
} from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

const TRIGGER_TYPES = {
  PATIENT_CREATED: {
    id: 'PATIENT_CREATED',
    label: { en: 'Patient Created', no: 'Ny pasient opprettet' },
    icon: UserPlus,
    color: 'blue',
    description: { en: 'Triggered when a new patient is created', no: 'Utloses nar en ny pasient opprettes' }
  },
  APPOINTMENT_SCHEDULED: {
    id: 'APPOINTMENT_SCHEDULED',
    label: { en: 'Appointment Scheduled', no: 'Time bestilt' },
    icon: Calendar,
    color: 'green',
    description: { en: 'Triggered when an appointment is booked', no: 'Utloses nar en time bestilles' }
  },
  APPOINTMENT_COMPLETED: {
    id: 'APPOINTMENT_COMPLETED',
    label: { en: 'Appointment Completed', no: 'Time fullfort' },
    icon: CheckCircle,
    color: 'emerald',
    description: { en: 'Triggered when an appointment is completed', no: 'Utloses nar en time er fullfort' }
  },
  APPOINTMENT_MISSED: {
    id: 'APPOINTMENT_MISSED',
    label: { en: 'Appointment Missed', no: 'Uteblitt fra time' },
    icon: XCircle,
    color: 'red',
    description: { en: 'Triggered when patient misses appointment', no: 'Utloses nar pasient uteblir' }
  },
  DAYS_SINCE_VISIT: {
    id: 'DAYS_SINCE_VISIT',
    label: { en: 'Days Since Last Visit', no: 'Dager siden siste besok' },
    icon: Clock,
    color: 'orange',
    description: { en: 'Triggered after X days without visit', no: 'Utloses etter X dager uten besok' }
  },
  BIRTHDAY: {
    id: 'BIRTHDAY',
    label: { en: 'Patient Birthday', no: 'Pasientens bursdag' },
    icon: Gift,
    color: 'purple',
    description: { en: 'Triggered on patient birthday', no: 'Utloses pa pasientens bursdag' }
  },
  LIFECYCLE_CHANGE: {
    id: 'LIFECYCLE_CHANGE',
    label: { en: 'Lifecycle Stage Changed', no: 'Livssyklusstatus endret' },
    icon: RefreshCw,
    color: 'indigo',
    description: { en: 'Triggered when lifecycle stage changes', no: 'Utloses nar livssyklusstatus endres' }
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: { en: 'Custom Trigger', no: 'Egendefinert trigger' },
    icon: Zap,
    color: 'gray',
    description: { en: 'Custom event trigger', no: 'Egendefinert hendelsestrigger' }
  }
};

const ACTION_TYPES = {
  SEND_SMS: {
    id: 'SEND_SMS',
    label: { en: 'Send SMS', no: 'Send SMS' },
    icon: MessageSquare,
    color: 'green'
  },
  SEND_EMAIL: {
    id: 'SEND_EMAIL',
    label: { en: 'Send Email', no: 'Send e-post' },
    icon: Mail,
    color: 'blue'
  },
  CREATE_FOLLOW_UP: {
    id: 'CREATE_FOLLOW_UP',
    label: { en: 'Create Follow-up', no: 'Opprett oppfolging' },
    icon: Calendar,
    color: 'orange'
  },
  UPDATE_STATUS: {
    id: 'UPDATE_STATUS',
    label: { en: 'Update Status', no: 'Oppdater status' },
    icon: RefreshCw,
    color: 'purple'
  },
  UPDATE_LIFECYCLE: {
    id: 'UPDATE_LIFECYCLE',
    label: { en: 'Update Lifecycle', no: 'Oppdater livssyklus' },
    icon: Users,
    color: 'indigo'
  },
  NOTIFY_STAFF: {
    id: 'NOTIFY_STAFF',
    label: { en: 'Notify Staff', no: 'Varsle ansatte' },
    icon: Bell,
    color: 'yellow'
  },
  ADD_TAG: {
    id: 'ADD_TAG',
    label: { en: 'Add Tag', no: 'Legg til etikett' },
    icon: Tag,
    color: 'pink'
  }
};

const CONDITION_FIELDS = [
  { id: 'status', label: { en: 'Patient Status', no: 'Pasientstatus' }, type: 'select', options: ['ACTIVE', 'INACTIVE', 'FINISHED'] },
  { id: 'lifecycle_stage', label: { en: 'Lifecycle Stage', no: 'Livssyklusstatus' }, type: 'select', options: ['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'] },
  { id: 'total_visits', label: { en: 'Total Visits', no: 'Totalt besok' }, type: 'number' },
  { id: 'consent_sms', label: { en: 'SMS Consent', no: 'SMS-samtykke' }, type: 'boolean' },
  { id: 'consent_email', label: { en: 'Email Consent', no: 'E-post-samtykke' }, type: 'boolean' },
  { id: 'is_vip', label: { en: 'VIP Patient', no: 'VIP-pasient' }, type: 'boolean' },
  { id: 'preferred_contact_method', label: { en: 'Preferred Contact', no: 'Foretrukket kontakt' }, type: 'select', options: ['SMS', 'EMAIL', 'PHONE'] }
];

const OPERATORS = {
  equals: { label: { en: 'Equals', no: 'Er lik' } },
  not_equals: { label: { en: 'Not Equals', no: 'Er ikke lik' } },
  greater_than: { label: { en: 'Greater Than', no: 'Storre enn' } },
  less_than: { label: { en: 'Less Than', no: 'Mindre enn' } },
  contains: { label: { en: 'Contains', no: 'Inneholder' } },
  is_empty: { label: { en: 'Is Empty', no: 'Er tom' } },
  is_not_empty: { label: { en: 'Is Not Empty', no: 'Er ikke tom' } }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function WorkflowBuilder({
  workflow = null,
  onSave,
  onTest,
  onCancel,
  testPatients = [],
  templates = [],
  staff = [],
  language = 'en',
  className = ''
}) {
  // Workflow state
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || '');
  const [triggerConfig, setTriggerConfig] = useState(workflow?.trigger_config || {});
  const [conditions, setConditions] = useState(workflow?.conditions || []);
  const [actions, setActions] = useState(workflow?.actions || []);
  const [isActive, setIsActive] = useState(workflow?.is_active !== false);
  const [maxRunsPerPatient, setMaxRunsPerPatient] = useState(workflow?.max_runs_per_patient || 1);

  // UI state
  const [activeSection, setActiveSection] = useState('trigger');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPatientId, setTestPatientId] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errors, setErrors] = useState({});

  // Labels
  const labels = {
    en: {
      title: workflow ? 'Edit Workflow' : 'Create Workflow',
      name: 'Workflow Name',
      namePlaceholder: 'e.g., Welcome New Patients',
      description: 'Description',
      descriptionPlaceholder: 'Describe what this workflow does...',
      trigger: 'Trigger',
      triggerSection: 'When should this workflow run?',
      selectTrigger: 'Select a trigger',
      conditions: 'Conditions',
      conditionsSection: 'Filter which patients this applies to',
      addCondition: 'Add Condition',
      actions: 'Actions',
      actionsSection: 'What should happen?',
      addAction: 'Add Action',
      settings: 'Settings',
      maxRuns: 'Max runs per patient',
      maxRunsHelp: '0 = unlimited',
      enabled: 'Enabled',
      save: 'Save Workflow',
      cancel: 'Cancel',
      test: 'Test Workflow',
      preview: 'Preview',
      selectPatient: 'Select test patient',
      runTest: 'Run Test',
      testResults: 'Test Results',
      conditionsPassed: 'Conditions Passed',
      conditionsFailed: 'Conditions Failed',
      actionsPreview: 'Actions that would execute',
      noActions: 'No actions configured',
      delayHours: 'Delay (hours)',
      message: 'Message',
      subject: 'Subject',
      body: 'Body',
      priority: 'Priority',
      dueInDays: 'Due in (days)',
      assignTo: 'Assign to',
      notifyRoles: 'Notify roles',
      tag: 'Tag',
      newValue: 'New value',
      field: 'Field',
      operator: 'Operator',
      value: 'Value',
      and: 'AND',
      or: 'OR',
      days: 'Days',
      daysBefore: 'Days before',
      appointmentType: 'Appointment type',
      fromStage: 'From stage',
      toStage: 'To stage',
      variables: 'Available variables: {firstName}, {lastName}, {phone}, {email}',
      required: 'Required',
      errorName: 'Workflow name is required',
      errorTrigger: 'Please select a trigger type',
      errorActions: 'Add at least one action'
    },
    no: {
      title: workflow ? 'Rediger arbeidsflyt' : 'Opprett arbeidsflyt',
      name: 'Navn pa arbeidsflyt',
      namePlaceholder: 'f.eks. Velkommen nye pasienter',
      description: 'Beskrivelse',
      descriptionPlaceholder: 'Beskriv hva denne arbeidsflyten gjor...',
      trigger: 'Trigger',
      triggerSection: 'Nar skal denne arbeidsflyten kjore?',
      selectTrigger: 'Velg en trigger',
      conditions: 'Betingelser',
      conditionsSection: 'Filtrer hvilke pasienter dette gjelder',
      addCondition: 'Legg til betingelse',
      actions: 'Handlinger',
      actionsSection: 'Hva skal skje?',
      addAction: 'Legg til handling',
      settings: 'Innstillinger',
      maxRuns: 'Maks kjoringer per pasient',
      maxRunsHelp: '0 = ubegrenset',
      enabled: 'Aktivert',
      save: 'Lagre arbeidsflyt',
      cancel: 'Avbryt',
      test: 'Test arbeidsflyt',
      preview: 'Forhandsvisning',
      selectPatient: 'Velg testpasient',
      runTest: 'Kjor test',
      testResults: 'Testresultater',
      conditionsPassed: 'Betingelser oppfylt',
      conditionsFailed: 'Betingelser ikke oppfylt',
      actionsPreview: 'Handlinger som ville utfores',
      noActions: 'Ingen handlinger konfigurert',
      delayHours: 'Forsinkelse (timer)',
      message: 'Melding',
      subject: 'Emne',
      body: 'Innhold',
      priority: 'Prioritet',
      dueInDays: 'Forfall om (dager)',
      assignTo: 'Tildel til',
      notifyRoles: 'Varsle roller',
      tag: 'Etikett',
      newValue: 'Ny verdi',
      field: 'Felt',
      operator: 'Operator',
      value: 'Verdi',
      and: 'OG',
      or: 'ELLER',
      days: 'Dager',
      daysBefore: 'Dager for',
      appointmentType: 'Timetype',
      fromStage: 'Fra status',
      toStage: 'Til status',
      variables: 'Tilgjengelige variabler: {firstName}, {lastName}, {phone}, {email}',
      required: 'Pakrevd',
      errorName: 'Arbeidsflytens navn er pakrevd',
      errorTrigger: 'Velg en triggertype',
      errorActions: 'Legg til minst en handling'
    }
  };

  const t = labels[language] || labels.en;

  // Validation
  const validate = useCallback(() => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = t.errorName;
    }

    if (!triggerType) {
      newErrors.trigger = t.errorTrigger;
    }

    if (actions.length === 0) {
      newErrors.actions = t.errorActions;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, triggerType, actions, t]);

  // Handle save
  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const workflowData = {
        name,
        description,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        conditions,
        actions,
        is_active: isActive,
        max_runs_per_patient: maxRunsPerPatient
      };

      if (workflow?.id) {
        workflowData.id = workflow.id;
      }

      await onSave?.(workflowData);
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle test
  const handleTest = async () => {
    if (!testPatientId) return;

    setIsTesting(true);
    try {
      const result = await onTest?.({
        workflow: {
          name,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          conditions,
          actions
        },
        patient_id: testPatientId
      });
      setTestResult(result);
    } catch (error) {
      console.error('Error testing workflow:', error);
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Add condition
  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: '', operator: 'equals', value: '' }
    ]);
  };

  // Remove condition
  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // Update condition
  const updateCondition = (index, updates) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  // Add action
  const addAction = (type) => {
    const newAction = { type, delay_hours: 0 };

    // Set default config based on type
    switch (type) {
      case 'SEND_SMS':
        newAction.message = '';
        break;
      case 'SEND_EMAIL':
        newAction.subject = '';
        newAction.body = '';
        break;
      case 'CREATE_FOLLOW_UP':
        newAction.follow_up_type = 'CUSTOM';
        newAction.reason = '';
        newAction.priority = 'MEDIUM';
        newAction.due_in_days = 7;
        break;
      case 'UPDATE_STATUS':
      case 'UPDATE_LIFECYCLE':
        newAction.value = '';
        break;
      case 'NOTIFY_STAFF':
        newAction.message = '';
        newAction.roles = ['ADMIN', 'PRACTITIONER'];
        newAction.priority = 'MEDIUM';
        break;
      case 'ADD_TAG':
        newAction.tag = '';
        break;
    }

    setActions([...actions, newAction]);
  };

  // Remove action
  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  // Update action
  const updateAction = (index, updates) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  // Move action
  const moveAction = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= actions.length) return;

    const newActions = [...actions];
    [newActions[index], newActions[newIndex]] = [newActions[newIndex], newActions[index]];
    setActions(newActions);
  };

  // Render trigger config
  const renderTriggerConfig = () => {
    if (!triggerType) return null;

    switch (triggerType) {
      case 'DAYS_SINCE_VISIT':
        return (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.days}
              </label>
              <input
                type="number"
                value={triggerConfig.days || 42}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>
        );

      case 'BIRTHDAY':
        return (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.daysBefore}
              </label>
              <input
                type="number"
                value={triggerConfig.days_before || 0}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, days_before: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        );

      case 'APPOINTMENT_SCHEDULED':
      case 'APPOINTMENT_COMPLETED':
        return (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.appointmentType} ({language === 'no' ? 'valgfritt' : 'optional'})
              </label>
              <select
                value={triggerConfig.appointment_type || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, appointment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'no' ? 'Alle typer' : 'All types'}</option>
                <option value="INITIAL">{language === 'no' ? 'Forstegangstime' : 'Initial'}</option>
                <option value="FOLLOWUP">{language === 'no' ? 'Oppfolgingstime' : 'Follow-up'}</option>
                <option value="MAINTENANCE">{language === 'no' ? 'Vedlikeholdstime' : 'Maintenance'}</option>
              </select>
            </div>
          </div>
        );

      case 'LIFECYCLE_CHANGE':
        return (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.fromStage} ({language === 'no' ? 'valgfritt' : 'optional'})
              </label>
              <select
                value={triggerConfig.from_stage || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, from_stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'no' ? 'Alle' : 'Any'}</option>
                {['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'].map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.toStage} ({language === 'no' ? 'valgfritt' : 'optional'})
              </label>
              <select
                value={triggerConfig.to_stage || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, to_stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'no' ? 'Alle' : 'Any'}</option>
                {['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'].map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render action config
  const renderActionConfig = (action, index) => {
    const actionType = ACTION_TYPES[action.type];
    if (!actionType) return null;

    return (
      <div className="space-y-3">
        {/* Delay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.delayHours}
          </label>
          <input
            type="number"
            value={action.delay_hours || 0}
            onChange={(e) => updateAction(index, { delay_hours: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>

        {/* Type-specific config */}
        {action.type === 'SEND_SMS' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.message} *
            </label>
            <textarea
              value={action.message || ''}
              onChange={(e) => updateAction(index, { message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'no' ? 'Hei {firstName}...' : 'Hi {firstName}...'}
            />
            <p className="mt-1 text-xs text-gray-500">{t.variables}</p>
          </div>
        )}

        {action.type === 'SEND_EMAIL' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.subject} *
              </label>
              <input
                type="text"
                value={action.subject || ''}
                onChange={(e) => updateAction(index, { subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.body} *
              </label>
              <textarea
                value={action.body || ''}
                onChange={(e) => updateAction(index, { body: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">{t.variables}</p>
            </div>
          </>
        )}

        {action.type === 'CREATE_FOLLOW_UP' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.priority}
                </label>
                <select
                  value={action.priority || 'MEDIUM'}
                  onChange={(e) => updateAction(index, { priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HIGH">{language === 'no' ? 'Hoy' : 'High'}</option>
                  <option value="MEDIUM">{language === 'no' ? 'Medium' : 'Medium'}</option>
                  <option value="LOW">{language === 'no' ? 'Lav' : 'Low'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.dueInDays}
                </label>
                <input
                  type="number"
                  value={action.due_in_days || 7}
                  onChange={(e) => updateAction(index, { due_in_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'no' ? 'Arsak' : 'Reason'}
              </label>
              <input
                type="text"
                value={action.reason || ''}
                onChange={(e) => updateAction(index, { reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {staff.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.assignTo}
                </label>
                <select
                  value={action.assigned_to || ''}
                  onChange={(e) => updateAction(index, { assigned_to: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'no' ? 'Ikke tildelt' : 'Unassigned'}</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {(action.type === 'UPDATE_STATUS' || action.type === 'UPDATE_LIFECYCLE') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.newValue} *
            </label>
            <select
              value={action.value || ''}
              onChange={(e) => updateAction(index, { value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
              {action.type === 'UPDATE_STATUS' ? (
                <>
                  <option value="ACTIVE">{language === 'no' ? 'Aktiv' : 'Active'}</option>
                  <option value="INACTIVE">{language === 'no' ? 'Inaktiv' : 'Inactive'}</option>
                  <option value="FINISHED">{language === 'no' ? 'Ferdig' : 'Finished'}</option>
                </>
              ) : (
                <>
                  {['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'].map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}

        {action.type === 'NOTIFY_STAFF' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.message} *
              </label>
              <textarea
                value={action.message || ''}
                onChange={(e) => updateAction(index, { message: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.notifyRoles}
              </label>
              <div className="flex gap-3">
                {['ADMIN', 'PRACTITIONER', 'ASSISTANT'].map(role => (
                  <label key={role} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(action.roles || []).includes(role)}
                      onChange={(e) => {
                        const roles = action.roles || [];
                        if (e.target.checked) {
                          updateAction(index, { roles: [...roles, role] });
                        } else {
                          updateAction(index, { roles: roles.filter(r => r !== role) });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {action.type === 'ADD_TAG' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.tag} *
            </label>
            <input
              type="text"
              value={action.tag || ''}
              onChange={(e) => updateAction(index, { tag: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'no' ? 'f.eks. VIP' : 'e.g., VIP'}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-600" />
          {t.title}
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className={isActive ? 'text-green-600' : 'text-gray-500'}>
              {t.enabled}
            </span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Name & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.name} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t.namePlaceholder}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.description}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={t.descriptionPlaceholder}
            />
          </div>
        </div>

        {/* Trigger Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setActiveSection(activeSection === 'trigger' ? '' : 'trigger')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t.trigger}</h3>
                <p className="text-sm text-gray-500">{t.triggerSection}</p>
              </div>
            </div>
            {activeSection === 'trigger' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {activeSection === 'trigger' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.values(TRIGGER_TYPES).map((trigger) => {
                  const Icon = trigger.icon;
                  const isSelected = triggerType === trigger.id;

                  return (
                    <button
                      key={trigger.id}
                      onClick={() => {
                        setTriggerType(trigger.id);
                        setTriggerConfig({});
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? `border-${trigger.color}-500 bg-${trigger.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${
                        isSelected ? `text-${trigger.color}-600` : 'text-gray-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isSelected ? `text-${trigger.color}-900` : 'text-gray-700'
                      }`}>
                        {trigger.label[language] || trigger.label.en}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {trigger.description[language] || trigger.description.en}
                      </p>
                    </button>
                  );
                })}
              </div>

              {errors.trigger && (
                <p className="mt-2 text-sm text-red-600">{errors.trigger}</p>
              )}

              {renderTriggerConfig()}
            </div>
          )}
        </div>

        {/* Conditions Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setActiveSection(activeSection === 'conditions' ? '' : 'conditions')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t.conditions}</h3>
                <p className="text-sm text-gray-500">{t.conditionsSection}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {conditions.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                  {conditions.length}
                </span>
              )}
              {activeSection === 'conditions' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {activeSection === 'conditions' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-4 space-y-3">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {index > 0 && (
                      <span className="text-xs font-medium text-gray-500">{t.and}</span>
                    )}
                    <select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, { field: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t.field}...</option>
                      {CONDITION_FIELDS.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.label[language] || field.label.en}
                        </option>
                      ))}
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, { operator: e.target.value })}
                      className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(OPERATORS).map(([key, op]) => (
                        <option key={key} value={key}>
                          {op.label[language] || op.label.en}
                        </option>
                      ))}
                    </select>
                    {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder={t.value}
                      />
                    )}
                    <button
                      onClick={() => removeCondition(index)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addCondition}
                className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                {t.addCondition}
              </button>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setActiveSection(activeSection === 'actions' ? '' : 'actions')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t.actions}</h3>
                <p className="text-sm text-gray-500">{t.actionsSection}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  {actions.length}
                </span>
              )}
              {activeSection === 'actions' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {activeSection === 'actions' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              {/* Action List */}
              <div className="mt-4 space-y-4">
                {actions.map((action, index) => {
                  const actionType = ACTION_TYPES[action.type];
                  if (!actionType) return null;
                  const Icon = actionType.icon;

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-gray-400">
                            <button
                              onClick={() => moveAction(index, -1)}
                              disabled={index === 0}
                              className="p-1 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveAction(index, 1)}
                              disabled={index === actions.length - 1}
                              className="p-1 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          <div className={`w-8 h-8 rounded-lg bg-${actionType.color}-100 flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 text-${actionType.color}-600`} />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {index + 1}. {actionType.label[language] || actionType.label.en}
                            </span>
                            {action.delay_hours > 0 && (
                              <span className="ml-2 text-xs text-gray-500">
                                (+{action.delay_hours}h)
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeAction(index)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {renderActionConfig(action, index)}
                    </div>
                  );
                })}

                {actions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">{t.noActions}</p>
                )}
              </div>

              {errors.actions && (
                <p className="mt-2 text-sm text-red-600">{errors.actions}</p>
              )}

              {/* Add Action Buttons */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{t.addAction}:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(ACTION_TYPES).map((actionType) => {
                    const Icon = actionType.icon;
                    return (
                      <button
                        key={actionType.id}
                        onClick={() => addAction(actionType.id)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors`}
                      >
                        <Icon className={`w-4 h-4 text-${actionType.color}-600`} />
                        {actionType.label[language] || actionType.label.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setActiveSection(activeSection === 'settings' ? '' : 'settings')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t.settings}</h3>
              </div>
            </div>
            {activeSection === 'settings' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {activeSection === 'settings' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.maxRuns}
                </label>
                <input
                  type="number"
                  value={maxRunsPerPatient}
                  onChange={(e) => setMaxRunsPerPatient(parseInt(e.target.value) || 0)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">{t.maxRunsHelp}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => setShowTestModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Eye className="w-4 h-4" />
          {t.test}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? (language === 'no' ? 'Lagrer...' : 'Saving...') : t.save}
          </button>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t.test}</h3>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestResult(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.selectPatient}
                </label>
                <select
                  value={testPatientId}
                  onChange={(e) => setTestPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
                  {testPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${
                  testResult.success && testResult.conditions_pass
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success && testResult.conditions_pass ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      testResult.success && testResult.conditions_pass ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResult.conditions_pass ? t.conditionsPassed : t.conditionsFailed}
                    </span>
                  </div>

                  {testResult.actions && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{t.actionsPreview}:</p>
                      <div className="space-y-2">
                        {testResult.actions.map((action, idx) => (
                          <div key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                            <strong>{action.type}</strong>
                            {action.delay_hours > 0 && ` (+${action.delay_hours}h)`}
                            {action.preview && (
                              <pre className="mt-1 text-xs bg-white/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(action.preview, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestResult(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleTest}
                disabled={!testPatientId || isTesting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isTesting ? (language === 'no' ? 'Tester...' : 'Testing...') : t.runTest}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
