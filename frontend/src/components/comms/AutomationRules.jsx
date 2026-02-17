/**
 * AutomationRules Component
 *
 * Set up automation triggers for patient communications.
 * Supports:
 * - Appointment reminders (24h, 1h before)
 * - Exercise program reminders (if not logged in X days)
 * - Follow-up scheduling reminders
 * - Birthday greetings
 *
 * Norwegian and English language support.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Clock,
  Calendar,
  Gift,
  Activity,
  Bell,
  _Settings,
  ChevronDown,
  _ChevronRight,
  Save,
  X,
  _AlertCircle,
  _CheckCircle,
  _Users,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { automationsAPI, communicationsAPI } from '../../services/api';
import toast from '../../utils/toast';

// Automation trigger types
const TRIGGER_TYPES = {
  APPOINTMENT_24H: {
    id: 'APPOINTMENT_24H',
    name: { no: '24 timer for time', en: '24 hours before appointment' },
    description: {
      no: 'Send paminnelse 24 timer for timen',
      en: 'Send reminder 24 hours before appointment',
    },
    icon: Calendar,
    color: 'blue',
    category: 'appointment',
  },
  APPOINTMENT_1H: {
    id: 'APPOINTMENT_1H',
    name: { no: '1 time for time', en: '1 hour before appointment' },
    description: {
      no: 'Send paminnelse 1 time for timen',
      en: 'Send reminder 1 hour before appointment',
    },
    icon: Clock,
    color: 'green',
    category: 'appointment',
  },
  EXERCISE_INACTIVE: {
    id: 'EXERCISE_INACTIVE',
    name: { no: 'Inaktiv pa ovelser', en: 'Exercise program inactive' },
    description: {
      no: 'Send paminnelse hvis pasient ikke har logget inn',
      en: 'Send reminder if patient has not logged in',
    },
    icon: Activity,
    color: 'orange',
    category: 'exercise',
  },
  FOLLOWUP_DUE: {
    id: 'FOLLOWUP_DUE',
    name: { no: 'Oppfolging forfaller', en: 'Follow-up due' },
    description: {
      no: 'Send paminnelse nar oppfolging er forfalt',
      en: 'Send reminder when follow-up is due',
    },
    icon: Bell,
    color: 'purple',
    category: 'followup',
  },
  BIRTHDAY: {
    id: 'BIRTHDAY',
    name: { no: 'Bursdag', en: 'Birthday' },
    description: { no: 'Send gratulasjon pa bursdagen', en: 'Send birthday greeting' },
    icon: Gift,
    color: 'pink',
    category: 'engagement',
  },
  DAYS_SINCE_VISIT: {
    id: 'DAYS_SINCE_VISIT',
    name: { no: 'Dager siden besok', en: 'Days since last visit' },
    description: {
      no: 'Send innkalling etter X dager uten besok',
      en: 'Send recall after X days without visit',
    },
    icon: Clock,
    color: 'yellow',
    category: 'recall',
  },
};

// Message types
const MESSAGE_TYPES = [
  { id: 'SMS', name: 'SMS', icon: MessageSquare },
  { id: 'EMAIL', name: 'E-post', icon: Mail },
];

export default function AutomationRules({ language = 'no' }) {
  const queryClient = useQueryClient();

  // State
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [expandedRule, setExpandedRule] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'APPOINTMENT_24H',
    message_type: 'SMS',
    template_id: null,
    is_active: true,
    settings: {
      days_threshold: 7, // For EXERCISE_INACTIVE and DAYS_SINCE_VISIT
      send_time: '09:00', // For BIRTHDAY
      include_weekends: false,
    },
  });

  // Labels
  const labels = {
    no: {
      title: 'Automatiseringsregler',
      subtitle: 'Sett opp automatiske paminnelser og meldinger',
      createRule: 'Opprett regel',
      editRule: 'Rediger regel',
      ruleName: 'Regelnavn',
      triggerType: 'Triggertype',
      messageType: 'Meldingstype',
      template: 'Mal',
      selectTemplate: 'Velg mal',
      settings: 'Innstillinger',
      daysThreshold: 'Antall dager',
      sendTime: 'Sendetidspunkt',
      includeWeekends: 'Inkluder helger',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      save: 'Lagre',
      cancel: 'Avbryt',
      delete: 'Slett',
      confirmDelete: 'Er du sikker pa at du vil slette denne regelen?',
      deleteSuccess: 'Regel slettet',
      saveSuccess: 'Regel lagret',
      toggleSuccess: 'Regel oppdatert',
      noRules: 'Ingen regler opprettet enna',
      noRulesDesc: 'Opprett din forste automatiseringsregel for a starte automatisk kommunikasjon.',
      category: {
        appointment: 'Timepaminnelser',
        exercise: 'Ovelsespaminnelser',
        followup: 'Oppfolging',
        engagement: 'Engasjement',
        recall: 'Innkalling',
      },
      lastTriggered: 'Sist utlost',
      totalSent: 'Totalt sendt',
      never: 'Aldri',
      patientsAffected: 'pasienter',
    },
    en: {
      title: 'Automation Rules',
      subtitle: 'Set up automatic reminders and messages',
      createRule: 'Create Rule',
      editRule: 'Edit Rule',
      ruleName: 'Rule Name',
      triggerType: 'Trigger Type',
      messageType: 'Message Type',
      template: 'Template',
      selectTemplate: 'Select Template',
      settings: 'Settings',
      daysThreshold: 'Number of days',
      sendTime: 'Send time',
      includeWeekends: 'Include weekends',
      active: 'Active',
      inactive: 'Inactive',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this rule?',
      deleteSuccess: 'Rule deleted',
      saveSuccess: 'Rule saved',
      toggleSuccess: 'Rule updated',
      noRules: 'No rules created yet',
      noRulesDesc: 'Create your first automation rule to start automatic communication.',
      category: {
        appointment: 'Appointment Reminders',
        exercise: 'Exercise Reminders',
        followup: 'Follow-up',
        engagement: 'Engagement',
        recall: 'Recall',
      },
      lastTriggered: 'Last triggered',
      totalSent: 'Total sent',
      never: 'Never',
      patientsAffected: 'patients',
    },
  };

  const t = labels[language] || labels.no;

  // Fetch automation rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      try {
        const response = await automationsAPI.getWorkflows({ limit: 100 });
        // Filter for communication automations
        return (
          response.data?.workflows?.filter((w) =>
            Object.keys(TRIGGER_TYPES).includes(w.trigger_type)
          ) || []
        );
      } catch {
        return [];
      }
    },
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['message-templates-for-rules'],
    queryFn: async () => {
      try {
        const response = await communicationsAPI.getTemplates();
        return response.data?.templates || [];
      } catch {
        return [];
      }
    },
  });

  const rules = rulesData || [];
  const templates = templatesData || [];

  // Create rule mutation
  const createMutation = useMutation({
    mutationFn: (data) => automationsAPI.createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      setShowEditor(false);
      resetForm();
      toast.success(t.saveSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create rule');
    },
  });

  // Update rule mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => automationsAPI.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      setShowEditor(false);
      setEditingRule(null);
      resetForm();
      toast.success(t.saveSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update rule');
    },
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => automationsAPI.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      toast.success(t.deleteSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete rule');
    },
  });

  // Toggle rule mutation
  const toggleMutation = useMutation({
    mutationFn: (id) => automationsAPI.toggleWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      toast.success(t.toggleSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to toggle rule');
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      trigger_type: 'APPOINTMENT_24H',
      message_type: 'SMS',
      template_id: null,
      is_active: true,
      settings: {
        days_threshold: 7,
        send_time: '09:00',
        include_weekends: false,
      },
    });
  };

  // Handle edit
  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      trigger_type: rule.trigger_type,
      message_type: rule.actions?.[0]?.type || 'SMS',
      template_id: rule.actions?.[0]?.template_id || null,
      is_active: rule.is_active,
      settings: {
        days_threshold: rule.trigger_config?.days_threshold || 7,
        send_time: rule.trigger_config?.send_time || '09:00',
        include_weekends: rule.trigger_config?.include_weekends || false,
      },
    });
    setShowEditor(true);
  };

  // Handle save
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    const workflowData = {
      name: formData.name,
      trigger_type: formData.trigger_type,
      trigger_config: {
        ...formData.settings,
      },
      actions: [
        {
          type: formData.message_type === 'SMS' ? 'SEND_SMS' : 'SEND_EMAIL',
          config: {
            template_id: formData.template_id,
          },
        },
      ],
      is_active: formData.is_active,
    };

    if (editingRule?.id) {
      updateMutation.mutate({ id: editingRule.id, data: workflowData });
    } else {
      createMutation.mutate(workflowData);
    }
  };

  // Handle delete
  const handleDelete = (rule) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(rule.id);
    }
  };

  // Group rules by category
  const groupedRules = rules.reduce((acc, rule) => {
    const triggerInfo = TRIGGER_TYPES[rule.trigger_type];
    const category = triggerInfo?.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rule);
    return acc;
  }, {});

  // Get trigger info
  const getTriggerInfo = (triggerType) => {
    return (
      TRIGGER_TYPES[triggerType] || {
        id: triggerType,
        name: { no: triggerType, en: triggerType },
        icon: Zap,
        color: 'gray',
      }
    );
  };

  // Get filtered templates based on trigger type
  const getFilteredTemplates = () => {
    const triggerInfo = TRIGGER_TYPES[formData.trigger_type];
    if (!triggerInfo) {
      return templates;
    }

    // Map trigger categories to template categories
    const categoryMap = {
      appointment: 'appointment_reminder',
      exercise: 'exercise_reminder',
      followup: 'followup_reminder',
      engagement: 'birthday',
      recall: 'followup_reminder',
    };

    const templateCategory = categoryMap[triggerInfo.category];
    if (!templateCategory) {
      return templates;
    }

    // Return filtered templates, but also include all if none match
    const filtered = templates.filter((t) => t.category === templateCategory);
    return filtered.length > 0 ? filtered : templates;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingRule(null);
            setShowEditor(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t.createRule}
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-6">
        {rulesLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : rules.length > 0 ? (
          Object.entries(groupedRules).map(([category, categoryRules]) => (
            <div
              key={category}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Category Header */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">{t.category[category] || category}</h3>
              </div>

              {/* Rules */}
              <div className="divide-y divide-gray-100">
                {categoryRules.map((rule) => {
                  const triggerInfo = getTriggerInfo(rule.trigger_type);
                  const TriggerIcon = triggerInfo.icon;
                  const isExpanded = expandedRule === rule.id;

                  return (
                    <div key={rule.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Trigger Icon */}
                          <div
                            className={`w-10 h-10 rounded-lg bg-${triggerInfo.color}-100 flex items-center justify-center`}
                          >
                            <TriggerIcon className={`w-5 h-5 text-${triggerInfo.color}-600`} />
                          </div>

                          {/* Rule Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{rule.name}</h4>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  rule.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {rule.is_active ? t.active : t.inactive}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {triggerInfo.description[language]}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {rule.execution_count || 0}
                              </div>
                              <div className="text-xs">{t.totalSent}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {rule.last_execution
                                  ? new Date(rule.last_execution).toLocaleDateString('no-NO')
                                  : t.never}
                              </div>
                              <div className="text-xs">{t.lastTriggered}</div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {/* Toggle */}
                          <button
                            onClick={() => toggleMutation.mutate(rule.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              rule.is_active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={rule.is_active ? 'Deaktiver' : 'Aktiver'}
                          >
                            {rule.is_active ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(rule)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          {/* Expand */}
                          <button
                            onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <ChevronDown
                              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(rule)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">{t.triggerType}:</span>
                              <p className="font-medium">{triggerInfo.name[language]}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">{t.messageType}:</span>
                              <p className="font-medium">
                                {rule.actions?.[0]?.type === 'SEND_SMS' ? 'SMS' : 'E-post'}
                              </p>
                            </div>
                            {rule.trigger_config?.days_threshold && (
                              <div>
                                <span className="text-gray-500">{t.daysThreshold}:</span>
                                <p className="font-medium">
                                  {rule.trigger_config.days_threshold} dager
                                </p>
                              </div>
                            )}
                            {rule.trigger_config?.send_time && (
                              <div>
                                <span className="text-gray-500">{t.sendTime}:</span>
                                <p className="font-medium">{rule.trigger_config.send_time}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">{t.noRules}</h3>
            <p className="text-sm text-gray-500 mt-1">{t.noRulesDesc}</p>
            <button
              onClick={() => {
                resetForm();
                setShowEditor(true);
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Plus className="w-4 h-4" />
              {t.createRule}
            </button>
          </div>
        )}
      </div>

      {/* Quick Setup Cards for Empty State */}
      {rules.length === 0 && !rulesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(TRIGGER_TYPES).map((trigger) => {
            const TriggerIcon = trigger.icon;
            return (
              <button
                key={trigger.id}
                onClick={() => {
                  setFormData({
                    ...formData,
                    name: trigger.name[language],
                    trigger_type: trigger.id,
                  });
                  setShowEditor(true);
                }}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-${trigger.color}-100 flex items-center justify-center mb-3`}
                >
                  <TriggerIcon className={`w-5 h-5 text-${trigger.color}-600`} />
                </div>
                <h4 className="font-medium text-gray-900">{trigger.name[language]}</h4>
                <p className="text-sm text-gray-500 mt-1">{trigger.description[language]}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Rule Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRule ? t.editRule : t.createRule}
              </h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.ruleName} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="F.eks. 24-timers paminnelse"
                />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.triggerType}
                </label>
                <select
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(TRIGGER_TYPES).map((trigger) => (
                    <option key={trigger.id} value={trigger.id}>
                      {trigger.name[language]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Settings based on trigger type */}
              {(formData.trigger_type === 'EXERCISE_INACTIVE' ||
                formData.trigger_type === 'DAYS_SINCE_VISIT') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.daysThreshold}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.settings.days_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          days_threshold: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formData.trigger_type === 'BIRTHDAY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.sendTime}
                  </label>
                  <input
                    type="time"
                    value={formData.settings.send_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, send_time: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.messageType}
                </label>
                <div className="flex gap-4">
                  {MESSAGE_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, message_type: type.id })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                          formData.message_type === type.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <TypeIcon className="w-5 h-5" />
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.template}</label>
                <select
                  value={formData.template_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, template_id: e.target.value || null })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.selectTemplate}</option>
                  {getFilteredTemplates()
                    .filter((t) => t.type === formData.message_type)
                    .map((template) => (
                      <option key={template.id || template.name} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">
                    {formData.is_active ? t.active : t.inactive}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formData.is_active
                      ? language === 'no'
                        ? 'Regelen vil kjore automatisk'
                        : 'Rule will run automatically'
                      : language === 'no'
                        ? 'Regelen er pauset'
                        : 'Rule is paused'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
