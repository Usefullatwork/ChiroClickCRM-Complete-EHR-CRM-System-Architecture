/**
 * SMSConversation Component
 *
 * Two-way SMS chat interface for patient communication.
 * Real conversations, not email forwarding (a major CT complaint).
 *
 * Features:
 * - Real-time conversation view
 * - Quick reply templates
 * - Patient info sidebar
 * - Unread indicators
 * - Message status tracking
 * - Bilingual support (EN/NO)
 */

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Phone,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Search,
  ChevronLeft,
  MoreVertical,
  Paperclip,
  _X,
  RefreshCw,
} from 'lucide-react';
import {
  getConversations,
  sendSMS,
  markConversationRead,
  formatNorwegianPhone,
  MESSAGE_STATUS,
  DEFAULT_TEMPLATES,
  formatMessage,
} from '../../services/messagingService';

// =============================================================================
// SMS CONVERSATION PANEL - Full messaging interface
// =============================================================================

export default function SMSConversation({
  patients = [],
  onPatientSelect,
  language = 'en',
  className = '',
}) {
  const [conversations, setConversations] = useState({});
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = () => {
    const convs = getConversations();
    setConversations(convs);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPhone, conversations]);

  // Mark as read when conversation is selected
  useEffect(() => {
    if (selectedPhone) {
      markConversationRead(selectedPhone);
      loadConversations();
    }
  }, [selectedPhone]);

  const labels = {
    en: {
      title: 'Messages',
      search: 'Search conversations...',
      noConversations: 'No conversations yet',
      noMessages: 'No messages in this conversation',
      typeMessage: 'Type a message...',
      send: 'Send',
      templates: 'Templates',
      today: 'Today',
      yesterday: 'Yesterday',
      online: 'Online',
      delivered: 'Delivered',
      sent: 'Sent',
      failed: 'Failed',
      selectConversation: 'Select a conversation to start messaging',
      quickReplies: 'Quick Replies',
      confirmAppointment: 'Confirm appointment',
      reschedule: 'Reschedule',
      thankYou: 'Thank you',
    },
    no: {
      title: 'Meldinger',
      search: 'Søk i samtaler...',
      noConversations: 'Ingen samtaler ennå',
      noMessages: 'Ingen meldinger i denne samtalen',
      typeMessage: 'Skriv en melding...',
      send: 'Send',
      templates: 'Maler',
      today: 'I dag',
      yesterday: 'I går',
      online: 'Pålogget',
      delivered: 'Levert',
      sent: 'Sendt',
      failed: 'Mislykket',
      selectConversation: 'Velg en samtale for å starte meldinger',
      quickReplies: 'Hurtigsvar',
      confirmAppointment: 'Bekreft time',
      reschedule: 'Endre time',
      thankYou: 'Takk',
    },
  };

  const t = labels[language] || labels.en;

  // Get patient info from phone number
  const getPatientByPhone = (phone) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    return patients.find((p) => {
      const patientPhone = (p.phone || '').replace(/\D/g, '');
      return (
        patientPhone.endsWith(normalizedPhone.slice(-8)) ||
        normalizedPhone.endsWith(patientPhone.slice(-8))
      );
    });
  };

  // Filter conversations by search
  const filteredConversations = Object.values(conversations)
    .filter((conv) => {
      if (!searchTerm) {
        return true;
      }
      const patient = getPatientByPhone(conv.phone);
      const name = patient ? `${patient.first_name} ${patient.last_name}`.toLowerCase() : '';
      return name.includes(searchTerm.toLowerCase()) || conv.phone.includes(searchTerm);
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0;
      const bTime = b.lastMessage?.timestamp || 0;
      return new Date(bTime) - new Date(aTime);
    });

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPhone || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await sendSMS(selectedPhone, newMessage.trim());
      setNewMessage('');
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Insert template
  const handleTemplateSelect = (templateKey) => {
    const patient = getPatientByPhone(selectedPhone);
    const template = DEFAULT_TEMPLATES[templateKey];
    if (template) {
      const content = template.content[language] || template.content.en;
      const formatted = formatMessage(content, {
        firstName: patient?.first_name || '',
        lastName: patient?.last_name || '',
        clinicName: 'ChiroClick Clinic',
        phone: '+47 400 00 000',
      });
      setNewMessage(formatted);
    }
    setShowTemplates(false);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (isYesterday) {
      return t.yesterday;
    }

    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case MESSAGE_STATUS.DELIVERED:
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case MESSAGE_STATUS.SENT:
        return <Check className="w-3 h-3 text-gray-400" />;
      case MESSAGE_STATUS.FAILED:
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-300" />;
    }
  };

  const selectedConversation = selectedPhone ? conversations[selectedPhone] : null;
  const selectedPatient = selectedPhone ? getPatientByPhone(selectedPhone) : null;

  return (
    <div
      className={`flex h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            {t.title}
          </h2>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t.noConversations}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const patient = getPatientByPhone(conv.phone);
              const isSelected = selectedPhone === conv.phone;
              const hasUnread = conv.unreadCount > 0;

              return (
                <button
                  key={conv.phone}
                  onClick={() => setSelectedPhone(conv.phone)}
                  className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left
                    ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}
                      >
                        {patient
                          ? `${patient.first_name} ${patient.last_name}`
                          : formatNorwegianPhone(conv.phone)}
                      </p>
                      <span className="text-xs text-gray-400">
                        {conv.lastMessage?.timestamp && formatTimestamp(conv.lastMessage.timestamp)}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
                    >
                      {conv.lastMessage?.body || '...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedPhone ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPhone(null)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedPatient
                      ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                      : formatNorwegianPhone(selectedPhone)}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {formatNorwegianPhone(selectedPhone)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedPatient && (
                  <button
                    onClick={() => onPatientSelect?.(selectedPatient)}
                    className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    {language === 'no' ? 'Se Pasient' : 'View Patient'}
                  </button>
                )}
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation?.messages?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t.noMessages}</p>
                </div>
              ) : (
                selectedConversation?.messages?.map((msg, idx) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOutbound
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 ${
                            isOutbound ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          <span className="text-xs">{formatTimestamp(msg.timestamp)}</span>
                          {isOutbound && getStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {showTemplates && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 mb-2">{t.quickReplies}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DEFAULT_TEMPLATES)
                    .slice(0, 4)
                    .map(([key, template]) => (
                      <button
                        key={key}
                        onClick={() => handleTemplateSelect(key)}
                        className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-100"
                      >
                        {template.name[language] || template.name.en}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="flex items-end gap-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`p-2 rounded-lg transition-colors ${
                    showTemplates
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={t.templates}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={t.typeMessage}
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t.selectConversation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// UNREAD BADGE - For navigation/header
// =============================================================================

export function UnreadBadge({ className = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const conversations = getConversations();
      const total = Object.values(conversations).reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setCount(total);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// =============================================================================
// CONVERSATION PREVIEW - Compact widget for dashboard
// =============================================================================

export function ConversationPreview({
  limit = 3,
  patients = [],
  onClick,
  language = 'en',
  className = '',
}) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const convs = getConversations();
    const sorted = Object.values(convs)
      .filter((c) => c.lastMessage)
      .sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp))
      .slice(0, limit);
    setConversations(sorted);
  }, [limit]);

  const getPatientByPhone = (phone) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    return patients.find((p) => {
      const patientPhone = (p.phone || '').replace(/\D/g, '');
      return patientPhone.endsWith(normalizedPhone.slice(-8));
    });
  };

  const labels = {
    en: { title: 'Recent Messages', viewAll: 'View All' },
    no: { title: 'Nylige Meldinger', viewAll: 'Se Alle' },
  };

  const t = labels[language] || labels.en;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          {t.title}
        </h3>
        <button onClick={onClick} className="text-xs text-blue-600 hover:text-blue-700">
          {t.viewAll}
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {conversations.map((conv) => {
          const patient = getPatientByPhone(conv.phone);
          return (
            <button
              key={conv.phone}
              onClick={onClick}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {patient ? `${patient.first_name} ${patient.last_name}` : conv.phone}
                </p>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.body}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
