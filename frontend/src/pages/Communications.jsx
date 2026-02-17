import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { communicationsAPI, patientsAPI } from '../services/api';
import { formatPhone } from '../lib/utils';
import { useTranslation, formatDate } from '../i18n';
import toast from '../utils/toast';

export default function Communications() {
  const { t, lang } = useTranslation('communications');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('compose');
  const [messageType, setMessageType] = useState('sms');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');

  // Fetch templates
  const { data: templatesResponse } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: () => communicationsAPI.getTemplates(),
  });

  const templates = templatesResponse?.data?.templates || [];

  // Fetch communications history
  const { data: historyResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['communications-history', historyFilter],
    queryFn: () =>
      communicationsAPI.getAll({
        type: historyFilter || undefined,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'desc',
      }),
    enabled: activeTab === 'history',
  });

  const history = historyResponse?.data?.communications || [];

  // Search patients
  const { data: searchResponse, isLoading: searchLoading } = useQuery({
    queryKey: ['patient-search', searchTerm],
    queryFn: () => patientsAPI.search(searchTerm),
    enabled: searchTerm.length >= 2,
  });

  const searchResults = searchResponse?.data?.patients || [];

  // Character counter for SMS
  const maxSmsLength = 160;
  const remainingChars = maxSmsLength - message.length;
  const smsCount = Math.ceil(message.length / maxSmsLength) || 1;

  // Apply template
  const applyTemplate = (template) => {
    setSelectedTemplate(template);
    let content = template.content;

    // Replace placeholders with patient data
    if (selectedPatient) {
      content = content.replace('{{first_name}}', selectedPatient.first_name);
      content = content.replace('{{last_name}}', selectedPatient.last_name);
      content = content.replace(
        '{{full_name}}',
        `${selectedPatient.first_name} ${selectedPatient.last_name}`
      );
    }

    setMessage(content);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (data) => {
      if (messageType === 'sms') {
        return communicationsAPI.sendSMS(data);
      } else {
        return communicationsAPI.sendEmail(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communications-history']);
      setMessage('');
      setSelectedPatient(null);
      setSelectedTemplate(null);
      toast.success(t('loggedSuccess').replace('{type}', messageType.toUpperCase()));
    },
    onError: (error) => {
      toast.error(
        `${t('logFailed').replace('{type}', messageType)}: ${error.response?.data?.message || error.message}`
      );
    },
  });

  const handleSend = () => {
    if (!selectedPatient) {
      toast.warning(t('selectPatientWarning'));
      return;
    }

    if (!message.trim()) {
      toast.warning(t('enterMessageWarning'));
      return;
    }

    const data = {
      patient_id: selectedPatient.id,
      message: message.trim(),
      template_id: selectedTemplate?.id,
    };

    sendMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
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
              {t('compose')}
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
              {t('history')}
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
                {t('messageType')}
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
                  <span className="font-medium">{t('sendEmail').replace('Send ', '')}</span>
                </button>
              </div>
            </div>

            {/* Patient Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('recipient')}
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
                          : selectedPatient.email || t('noEmailOnFile')}
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
                    placeholder={t('searchPatients')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowPatientSearch(true);
                    }}
                    onFocus={() => setShowPatientSearch(true)}
                  />

                  {/* Search Results Dropdown */}
                  {showPatientSearch && searchTerm.length >= 2 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          {t('searching')}
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((patient) => (
                          <button
                            key={patient.id}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setSearchTerm('');
                              setShowPatientSearch(false);
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
                          {t('noPatientsFound')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Composer */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('message')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={messageType === 'sms' ? t('typeMessageSms') : t('typeMessageEmail')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={messageType === 'sms' ? 6 : 10}
              />

              {/* Character Counter (SMS only) */}
              {messageType === 'sms' && (
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span
                    className={`${
                      remainingChars < 0
                        ? 'text-red-600 font-medium'
                        : remainingChars < 20
                          ? 'text-orange-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {t('charactersRemaining').replace('{count}', remainingChars)}
                  </span>
                  <span className="text-gray-500">
                    {smsCount > 1
                      ? t('smsCountPlural').replace('{count}', smsCount)
                      : t('smsCount').replace('{count}', smsCount)}
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
                      <span className="text-green-600">{t('copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t('copyToClipboard')}
                    </>
                  )}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!selectedPatient || !message.trim() || sendMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sendMutation.isLoading ? t('logging') : t('logMessage')}
                </button>
              </div>

              {messageType === 'sms' && (
                <p className="text-xs text-gray-500 mt-3">{t('smsNote')}</p>
              )}
            </div>
          </div>

          {/* Templates Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('messageTemplates')}
              </h3>

              <div className="space-y-2">
                {templates.length > 0 ? (
                  templates
                    .filter((tmpl) => !messageType || tmpl.type === messageType.toUpperCase())
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
                        <div className="font-medium text-sm text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.content}
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="text-center py-6 text-sm text-gray-500">{t('noTemplates')}</div>
                )}
              </div>
            </div>
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
                <option value="">{t('allMessages')}</option>
                <option value="SMS">{t('smsOnly')}</option>
                <option value="EMAIL">{t('emailOnly')}</option>
              </select>
            </div>
          </div>

          {/* History List */}
          <div className="divide-y divide-gray-100">
            {historyLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">{t('loadingHistory')}</p>
              </div>
            ) : history.length > 0 ? (
              history.map((comm) => (
                <div key={comm.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          comm.type === 'SMS' ? 'bg-purple-50' : 'bg-blue-50'
                        }`}
                      >
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
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              comm.type === 'SMS'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {comm.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{comm.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            {formatDate(comm.created_at, lang, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {comm.template_name && (
                            <span>
                              {t('templateLabel')}: {comm.template_name}
                            </span>
                          )}
                          <span>
                            {t('byLabel')}: {comm.sent_by_name || t('system')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('noMessagesSent')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
