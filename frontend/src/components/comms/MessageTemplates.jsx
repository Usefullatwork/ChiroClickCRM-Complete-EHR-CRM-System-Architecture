/**
 * MessageTemplates Component
 *
 * Template manager for automated communications.
 * Supports SMS and Email templates with variables like {{patient_name}}, {{appointment_date}}, etc.
 * Norwegian and English language support.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  ChevronDown,
  MessageSquare,
  Calendar,
  Gift,
  Activity,
  Clock,
  Eye,
  Tag,
} from 'lucide-react';
import { communicationsAPI } from '../../services/api';
import toast from '../../utils/toast';

// Template categories
const CATEGORIES = {
  appointment_reminder: {
    id: 'appointment_reminder',
    name: { no: 'Timepaminnelse', en: 'Appointment Reminder' },
    icon: Calendar,
    color: 'blue',
  },
  exercise_reminder: {
    id: 'exercise_reminder',
    name: { no: 'Ovelsespaminnelse', en: 'Exercise Reminder' },
    icon: Activity,
    color: 'green',
  },
  followup_reminder: {
    id: 'followup_reminder',
    name: { no: 'Oppfolgingspaminnelse', en: 'Follow-up Reminder' },
    icon: Clock,
    color: 'orange',
  },
  birthday: {
    id: 'birthday',
    name: { no: 'Bursdag', en: 'Birthday' },
    icon: Gift,
    color: 'purple',
  },
  general: {
    id: 'general',
    name: { no: 'Generell', en: 'General' },
    icon: MessageSquare,
    color: 'gray',
  },
};

// Available template variables
const TEMPLATE_VARIABLES = [
  {
    key: 'patient_name',
    label: { no: 'Pasientnavn', en: 'Patient Name' },
    example: 'Ola Nordmann',
  },
  { key: 'patient_first_name', label: { no: 'Fornavn', en: 'First Name' }, example: 'Ola' },
  {
    key: 'appointment_date',
    label: { no: 'Timedato', en: 'Appointment Date' },
    example: '15. januar 2026',
  },
  {
    key: 'appointment_time',
    label: { no: 'Klokkeslett', en: 'Appointment Time' },
    example: '10:30',
  },
  {
    key: 'provider_name',
    label: { no: 'Behandlernavn', en: 'Provider Name' },
    example: 'Dr. Hansen',
  },
  {
    key: 'clinic_name',
    label: { no: 'Klinikknavn', en: 'Clinic Name' },
    example: 'ChiroClick Klinikk',
  },
  {
    key: 'clinic_phone',
    label: { no: 'Klinikktelefon', en: 'Clinic Phone' },
    example: '+47 123 45 678',
  },
  {
    key: 'days_since_visit',
    label: { no: 'Dager siden besok', en: 'Days Since Visit' },
    example: '30',
  },
  {
    key: 'next_exercise',
    label: { no: 'Neste ovelse', en: 'Next Exercise' },
    example: 'Ryggstrekkoveise',
  },
  {
    key: 'portal_link',
    label: { no: 'Portallenke', en: 'Portal Link' },
    example: 'https://portal.chiroclick.no',
  },
];

// Default templates (Norwegian)
const DEFAULT_TEMPLATES = [
  {
    name: '24-timers paminnelse',
    category: 'appointment_reminder',
    type: 'SMS',
    language: 'NO',
    subject: null,
    body: 'Hei {{patient_first_name}}! Paminnelse om time i morgen {{appointment_date}} kl {{appointment_time}} hos {{provider_name}}. Avbud? Ring {{clinic_phone}}.',
    is_system: true,
  },
  {
    name: '1-times paminnelse',
    category: 'appointment_reminder',
    type: 'SMS',
    language: 'NO',
    subject: null,
    body: 'Hei {{patient_first_name}}! Husk timen din i dag kl {{appointment_time}} hos {{clinic_name}}. Vi gleder oss til a se deg!',
    is_system: true,
  },
  {
    name: 'Ovelsesprogram paminnelse',
    category: 'exercise_reminder',
    type: 'SMS',
    language: 'NO',
    subject: null,
    body: 'Hei {{patient_first_name}}! Vi savner deg! Det er {{days_since_visit}} dager siden sist du logget inn pa ovelsesprogrammet. Logg inn her: {{portal_link}}',
    is_system: true,
  },
  {
    name: 'Oppfolging - bestill ny time',
    category: 'followup_reminder',
    type: 'SMS',
    language: 'NO',
    subject: null,
    body: 'Hei {{patient_first_name}}! Det er pa tide med en oppfolgingstime. Ring oss pa {{clinic_phone}} eller bestill online. Hilsen {{clinic_name}}',
    is_system: true,
  },
  {
    name: 'Gratulerer med dagen!',
    category: 'birthday',
    type: 'SMS',
    language: 'NO',
    subject: null,
    body: 'Gratulerer med dagen, {{patient_first_name}}! Vi onsker deg en fantastisk dag! Hilsen alle oss pa {{clinic_name}}',
    is_system: true,
  },
  {
    name: 'Timebekreftelse e-post',
    category: 'appointment_reminder',
    type: 'EMAIL',
    language: 'NO',
    subject: 'Bekreftelse pa din time hos {{clinic_name}}',
    body: `Kjare {{patient_name}},

Dette er en bekreftelse pa din kommende time:

Dato: {{appointment_date}}
Tid: {{appointment_time}}
Behandler: {{provider_name}}
Sted: {{clinic_name}}

Vennligst gi beskjed minst 24 timer for timen dersom du ma avbestille eller endre tiden.

Telefon: {{clinic_phone}}

Med vennlig hilsen,
{{clinic_name}}`,
    is_system: true,
  },
];

export default function MessageTemplates({ language = 'no' }) {
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showVariables, setShowVariables] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    type: 'SMS',
    language: 'NO',
    subject: '',
    body: '',
  });

  // Labels
  const labels = {
    no: {
      title: 'Meldingsmaler',
      subtitle: 'Administrer maler for automatiserte meldinger',
      createTemplate: 'Opprett mal',
      editTemplate: 'Rediger mal',
      search: 'Sok i maler...',
      allCategories: 'Alle kategorier',
      allTypes: 'Alle typer',
      name: 'Malnavn',
      category: 'Kategori',
      type: 'Type',
      subject: 'Emne',
      body: 'Meldingsinnhold',
      variables: 'Tilgjengelige variabler',
      insertVariable: 'Sett inn variabel',
      preview: 'Forhandsvisning',
      save: 'Lagre',
      cancel: 'Avbryt',
      delete: 'Slett',
      confirmDelete: 'Er du sikker pa at du vil slette denne malen?',
      deleteSuccess: 'Mal slettet',
      saveSuccess: 'Mal lagret',
      copySuccess: 'Mal kopiert',
      noTemplates: 'Ingen maler funnet',
      systemTemplate: 'Systemmal',
      customTemplate: 'Egendefinert',
      characters: 'tegn',
      smsSegments: 'SMS-segmenter',
      emailSubjectRequired: 'Emne er pakrevd for e-post',
    },
    en: {
      title: 'Message Templates',
      subtitle: 'Manage templates for automated messages',
      createTemplate: 'Create Template',
      editTemplate: 'Edit Template',
      search: 'Search templates...',
      allCategories: 'All Categories',
      allTypes: 'All Types',
      name: 'Template Name',
      category: 'Category',
      type: 'Type',
      subject: 'Subject',
      body: 'Message Content',
      variables: 'Available Variables',
      insertVariable: 'Insert Variable',
      preview: 'Preview',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this template?',
      deleteSuccess: 'Template deleted',
      saveSuccess: 'Template saved',
      copySuccess: 'Template copied',
      noTemplates: 'No templates found',
      systemTemplate: 'System Template',
      customTemplate: 'Custom',
      characters: 'characters',
      smsSegments: 'SMS segments',
      emailSubjectRequired: 'Subject is required for email',
    },
  };

  const t = labels[language] || labels.no;

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['message-templates', categoryFilter, typeFilter],
    queryFn: async () => {
      const response = await communicationsAPI.getTemplates();
      return response.data?.templates || [];
    },
  });

  const templates = templatesData || DEFAULT_TEMPLATES;

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesType = typeFilter === 'all' || template.type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data) =>
      communicationsAPI.createTemplate?.(data) || Promise.resolve({ data: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['message-templates']);
      setShowEditor(false);
      resetForm();
      toast.success(t.saveSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create template');
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      communicationsAPI.updateTemplate?.(id, data) || Promise.resolve({ data: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['message-templates']);
      setShowEditor(false);
      setEditingTemplate(null);
      resetForm();
      toast.success(t.saveSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => communicationsAPI.deleteTemplate?.(id) || Promise.resolve({}),
    onSuccess: () => {
      queryClient.invalidateQueries(['message-templates']);
      toast.success(t.deleteSuccess);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'general',
      type: 'SMS',
      language: 'NO',
      subject: '',
      body: '',
    });
  };

  // Handle edit
  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      type: template.type,
      language: template.language || 'NO',
      subject: template.subject || '',
      body: template.body,
    });
    setShowEditor(true);
  };

  // Handle save
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!formData.body.trim()) {
      toast.error('Message content is required');
      return;
    }
    if (formData.type === 'EMAIL' && !formData.subject.trim()) {
      toast.error(t.emailSubjectRequired);
      return;
    }

    if (editingTemplate?.id) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle delete
  const handleDelete = (template) => {
    if (template.is_system) {
      toast.error('Cannot delete system templates');
      return;
    }
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(template.id);
    }
  };

  // Insert variable into body
  const insertVariable = (variableKey) => {
    const variable = `{{${variableKey}}}`;
    const textarea = document.getElementById('template-body');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = formData.body.substring(0, start) + variable + formData.body.substring(end);
      setFormData({ ...formData, body: newBody });
      // Reset cursor position after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    } else {
      setFormData({ ...formData, body: formData.body + variable });
    }
  };

  // Calculate SMS segments
  const getSmsSegments = (text) => {
    if (!text) {
      return 1;
    }
    const length = text.length;
    if (length <= 160) {
      return 1;
    }
    return Math.ceil(length / 153);
  };

  // Preview with sample data
  const getPreviewText = (text) => {
    let preview = text;
    TEMPLATE_VARIABLES.forEach((v) => {
      preview = preview.replace(new RegExp(`{{${v.key}}}`, 'g'), v.example);
    });
    return preview;
  };

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return CATEGORIES[categoryId] || CATEGORIES.general;
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
            setEditingTemplate(null);
            setShowEditor(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t.createTemplate}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t.allCategories}</option>
          {Object.values(CATEGORIES).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name[language]}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t.allTypes}</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">E-post</option>
        </select>
      </div>

      {/* Template List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredTemplates.map((template, index) => {
              const categoryInfo = getCategoryInfo(template.category);
              const CategoryIcon = categoryInfo.icon;

              return (
                <div
                  key={template.id || index}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Category Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg bg-${categoryInfo.color}-100 flex items-center justify-center`}
                      >
                        <CategoryIcon className={`w-5 h-5 text-${categoryInfo.color}-600`} />
                      </div>

                      {/* Template Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              template.type === 'SMS'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {template.type}
                          </span>
                          {template.is_system && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                              {t.systemTemplate}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.body}</p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {categoryInfo.name[language]}
                          </span>
                          {template.type === 'SMS' && (
                            <span>
                              {template.body.length} {t.characters} ({getSmsSegments(template.body)}{' '}
                              {t.smsSegments})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title={t.editTemplate}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!template.is_system && (
                        <button
                          onClick={() => handleDelete(template)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t.noTemplates}</p>
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate ? t.editTemplate : t.createTemplate}
              </h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingTemplate(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.name} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="F.eks. 24-timers paminnelse"
                />
              </div>

              {/* Category and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.category}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(CATEGORIES).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name[language]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.type}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">E-post</option>
                  </select>
                </div>
              </div>

              {/* Subject (Email only) */}
              {formData.type === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.subject} *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="F.eks. Bekreftelse pa din time"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">{t.body} *</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowVariables(!showVariables)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                        showVariables ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {t.variables}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showVariables ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                        previewMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      {t.preview}
                    </button>
                  </div>
                </div>

                {/* Variables Panel */}
                {showVariables && (
                  <div className="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">{t.insertVariable}:</p>
                    <div className="flex flex-wrap gap-2">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <button
                          key={v.key}
                          onClick={() => insertVariable(v.key)}
                          className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
                        >
                          {`{{${v.key}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {previewMode ? (
                  <div
                    className={`w-full px-3 py-2 border border-green-300 rounded-lg bg-green-50 ${
                      formData.type === 'EMAIL' ? 'min-h-[200px]' : 'min-h-[100px]'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                      {getPreviewText(formData.body)}
                    </pre>
                  </div>
                ) : (
                  <textarea
                    id="template-body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                      formData.type === 'EMAIL' ? 'min-h-[200px]' : 'min-h-[100px]'
                    }`}
                    placeholder={
                      formData.type === 'SMS'
                        ? 'Skriv din SMS-melding her...'
                        : 'Skriv din e-postmelding her...'
                    }
                  />
                )}

                {/* Character count for SMS */}
                {formData.type === 'SMS' && (
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span className={formData.body.length > 160 ? 'text-orange-600' : ''}>
                      {formData.body.length} {t.characters}
                    </span>
                    <span>
                      {getSmsSegments(formData.body)} {t.smsSegments}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingTemplate(null);
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
