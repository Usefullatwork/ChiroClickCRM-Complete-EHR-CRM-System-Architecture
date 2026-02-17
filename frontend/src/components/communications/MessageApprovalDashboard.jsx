/**
 * MessageApprovalDashboard - Review and approve queued messages before sending
 *
 * Features:
 * - View all pending messages
 * - Edit message content before sending
 * - Approve/reject individual or bulk messages
 * - Filter by type (no-show, follow-up, reminder)
 * - Preview how message will appear to patient
 */
import _React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Phone,
  Mail,
  Check,
  X,
  Edit2,
  _AlertCircle,
  Clock,
  User,
  _Calendar,
  ChevronDown,
  ChevronUp,
  _Send,
  Filter,
  RefreshCw,
  CheckCircle2,
  _XCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { schedulerAPI } from '../../services/api';

// Message categories
const MESSAGE_CATEGORIES = {
  all: { label: 'Alle', color: 'gray' },
  no_show: { label: 'No-show', color: 'red' },
  follow_up: { label: 'Oppfølging', color: 'purple' },
  reminder: { label: 'Påminnelse', color: 'amber' },
  recall: { label: 'Recall', color: 'blue' },
};

// Single message card component
function MessageCard({
  message,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
  onEdit,
  isProcessing,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleSaveEdit = () => {
    onEdit(message.id, editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const TypeIcon = message.type === 'SMS' ? Phone : Mail;
  const categoryColor = MESSAGE_CATEGORIES[message.category]?.color || 'gray';

  return (
    <div
      className={`border rounded-lg transition-all ${
        isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => onToggleExpand(message.id)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${message.type === 'SMS' ? 'blue' : 'purple'}-50`}>
            <TypeIcon
              className={`w-4 h-4 text-${message.type === 'SMS' ? 'blue' : 'purple'}-600`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{message.patient_name}</span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${categoryColor}-100 text-${categoryColor}-700`}
              >
                {MESSAGE_CATEGORIES[message.category]?.label || message.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
              <span>{message.type}</span>
              <span>•</span>
              <span>{message.recipient}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <div className="text-gray-500">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: nb })}
            </div>
            {message.trigger_event && (
              <div className="text-xs text-gray-400">{message.trigger_event}</div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Message content */}
          <div className="p-4 bg-gray-50">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Lagre endringer
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">{message.content}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600"
                  title="Rediger"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Message preview (phone mockup) */}
          {message.type === 'SMS' && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Forhåndsvisning:</p>
              <div className="max-w-xs mx-auto">
                <div className="bg-gray-900 rounded-2xl p-2">
                  <div className="bg-white rounded-xl p-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Klinikken</span>
                    </div>
                    <div className="pt-2">
                      <div className="inline-block bg-blue-500 text-white text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[85%]">
                        {editedContent || message.content}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {format(new Date(), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Opprettet {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onReject(message.id)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Avvis
              </button>
              <button
                onClick={() => onApprove(message.id)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Godkjenn & Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main dashboard component
export default function MessageApprovalDashboard({ className = '' }) {
  const queryClient = useQueryClient();

  // State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());

  // Fetch pending messages from scheduler
  const {
    data: messagesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['pending-messages', selectedCategory],
    queryFn: async () => {
      const response = await schedulerAPI.getTodaysMessages();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const messages = messagesData?.data || [];

  // Filter messages by category
  const filteredMessages = useMemo(() => {
    if (selectedCategory === 'all') {
      return messages;
    }
    return messages.filter((m) => m.category === selectedCategory);
  }, [messages, selectedCategory]);

  // Approve mutation — send approved message via scheduler
  const approveMutation = useMutation({
    mutationFn: async (messageId) => {
      const response = await schedulerAPI.sendApproved([messageId]);
      return response.data;
    },
    onMutate: (messageId) => {
      setProcessingIds((prev) => new Set([...prev, messageId]));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-messages'] });
      setExpandedMessageId(null);
    },
    onSettled: (_, __, messageId) => {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    },
  });

  // Reject mutation — cancel scheduled message
  const rejectMutation = useMutation({
    mutationFn: async (messageId) => {
      const response = await schedulerAPI.cancelMessage(messageId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-messages'] });
      setExpandedMessageId(null);
    },
  });

  // Edit mutation — update message content then refetch
  const editMutation = useMutation({
    mutationFn: async ({ messageId, content }) => {
      // Scheduler doesn't have a direct edit endpoint, so we cancel and re-schedule
      await schedulerAPI.cancelMessage(messageId);
      const response = await schedulerAPI.schedule({ content, messageId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-messages'] });
    },
  });

  // Bulk approve
  const handleBulkApprove = async () => {
    for (const message of filteredMessages) {
      await approveMutation.mutateAsync(message.id);
    }
  };

  // Toggle expand
  const handleToggleExpand = useCallback((messageId) => {
    setExpandedMessageId((prev) => (prev === messageId ? null : messageId));
  }, []);

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts = { all: messages.length };
    messages.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [messages]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Meldingsgodkjenning</h1>
            <p className="text-sm text-gray-500">
              {filteredMessages.length} melding{filteredMessages.length !== 1 ? 'er' : ''} venter på
              godkjenning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Oppdater"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {filteredMessages.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Godkjenn alle ({filteredMessages.length})
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gray-50">
        <Filter className="w-4 h-4 text-gray-400" />
        {Object.entries(MESSAGE_CATEGORIES).map(([key, config]) => {
          const count = categoryCounts[key] || 0;
          const isActive = selectedCategory === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? `bg-${config.color}-100 text-${config.color}-700 border border-${config.color}-200`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {config.label}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? `bg-${config.color}-200` : 'bg-gray-200'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Messages list */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500">Ingen meldinger venter på godkjenning</p>
            <p className="text-sm text-gray-400 mt-1">Nye meldinger vil vises her automatisk</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              isExpanded={expandedMessageId === message.id}
              onToggleExpand={handleToggleExpand}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
              onEdit={(id, content) => editMutation.mutate({ messageId: id, content })}
              isProcessing={processingIds.has(message.id)}
            />
          ))
        )}
      </div>

      {/* Stats footer */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {messages.filter((m) => m.type === 'SMS').length} SMS
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {messages.filter((m) => m.type === 'EMAIL').length} e-post
            </span>
          </div>
          <p className="text-xs text-gray-400">Oppdateres automatisk hvert 30. sekund</p>
        </div>
      )}
    </div>
  );
}
