/**
 * Scheduler Decisions Component
 *
 * Displays AI scheduling recommendations with approve/dismiss actions,
 * conflict warnings, smart time suggestions, and auto-accept rule matches.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { schedulerAPI } from '../../services/api';
import { formatRelativeTime } from '../../lib/utils';

const DECISION_TYPE_CONFIG = {
  conflict: { icon: AlertTriangle, color: 'red', label: 'Konflikt' },
  suggestion: { icon: Clock, color: 'blue', label: 'Forslag' },
  auto_accept: { icon: Zap, color: 'green', label: 'Auto-godkjent' },
  recall: { icon: Calendar, color: 'orange', label: 'Tilbakekalling' },
  followup: { icon: MessageSquare, color: 'purple', label: 'Oppfolging' },
};

const CHANNEL_ICONS = {
  sms: MessageSquare,
  email: Mail,
};

const SchedulerDecisions = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [showTodaysMessages, setShowTodaysMessages] = useState(true);

  // Decisions query
  const { data: decisionsData, isLoading } = useQuery({
    queryKey: ['scheduler-decisions', filter],
    queryFn: () => schedulerAPI.getDecisions({ status: filter }),
    retry: false,
  });

  // Today's messages query
  const { data: todaysData, isLoading: todaysLoading } = useQuery({
    queryKey: ['scheduler-today'],
    queryFn: () => schedulerAPI.getTodaysMessages(),
    retry: false,
  });

  // Pending stats query
  const { data: pendingData } = useQuery({
    queryKey: ['scheduler-pending'],
    queryFn: () => schedulerAPI.getPending(),
    retry: false,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }) => schedulerAPI.resolveDecision(id, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-decisions'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-pending'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (messageIds) => schedulerAPI.sendApproved(messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-today'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-pending'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => schedulerAPI.cancelMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-today'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-pending'] });
    },
  });

  const handleApprove = (id) => resolveMutation.mutate({ id, action: 'approve' });
  const handleDismiss = (id) => resolveMutation.mutate({ id, action: 'dismiss' });

  const handleBatchApprove = () => {
    const decisions = decisionsData?.data || [];
    decisions.forEach((d) => {
      if (d.status === 'pending') {
        resolveMutation.mutate({ id: d.id, action: 'approve' });
      }
    });
  };

  const handleSendAll = () => {
    const messages = todaysMessages.filter((m) => m.status === 'approved');
    if (messages.length > 0) {
      sendMutation.mutate(messages.map((m) => m.id));
    }
  };

  const decisions = decisionsData?.data || [];
  const todaysMessages = todaysData?.messages || todaysData?.data || [];
  const stats = pendingData?.stats || {};

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg bg-gray-50 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBadge
            label="Ventende"
            value={stats.pending_count || decisions.filter((d) => d.status === 'pending').length}
            color="yellow"
          />
          <StatBadge label="Godkjent i dag" value={stats.approved_today || 0} color="green" />
          <StatBadge
            label="Konflikter"
            value={stats.conflict_count || decisions.filter((d) => d.type === 'conflict').length}
            color="red"
          />
          <StatBadge label="Auto-godkjent" value={stats.auto_accepted || 0} color="teal" />
        </div>
      )}

      {/* Decisions Panel */}
      <div className="border rounded-lg bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-800">Planleggingsbeslutninger</h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded px-2 py-1"
            >
              <option value="pending">Ventende</option>
              <option value="approved">Godkjent</option>
              <option value="dismissed">Avvist</option>
            </select>
            {filter === 'pending' && decisions.length > 0 && (
              <button
                onClick={handleBatchApprove}
                disabled={resolveMutation.isPending}
                className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                Godkjenn alle
              </button>
            )}
          </div>
        </div>

        {decisions.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            {filter === 'pending'
              ? 'Ingen ventende beslutninger.'
              : `Ingen ${filter === 'approved' ? 'godkjente' : 'avviste'} beslutninger.`}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {decisions.map((decision) => {
              const typeConfig =
                DECISION_TYPE_CONFIG[decision.type] || DECISION_TYPE_CONFIG.suggestion;
              const TypeIcon = typeConfig.icon;
              const isExpanded = expandedId === decision.id;

              return (
                <li key={decision.id} className="hover:bg-slate-50 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Type indicator */}
                        <div
                          className={`w-10 h-10 rounded-lg bg-${typeConfig.color}-50 flex items-center justify-center flex-shrink-0`}
                        >
                          <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-600`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800">
                              {decision.title || decision.type || 'Anbefaling'}
                            </p>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded bg-${typeConfig.color}-100 text-${typeConfig.color}-700`}
                            >
                              {typeConfig.label}
                            </span>
                            {decision.auto_accepted && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Auto
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {decision.description || decision.reason || 'Ingen beskrivelse'}
                          </p>

                          {/* Patient and time info */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            {decision.patient_name && <span>Pasient: {decision.patient_name}</span>}
                            {decision.suggested_time && (
                              <span className="text-teal-600">
                                Foreslatt:{' '}
                                {new Date(decision.suggested_time).toLocaleString('no-NO')}
                              </span>
                            )}
                            {decision.created_at && (
                              <span>{formatRelativeTime(decision.created_at)}</span>
                            )}
                          </div>

                          {/* Conflict details (expandable) */}
                          {decision.type === 'conflict' && decision.conflicts && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                              className="mt-2 text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              {decision.conflicts.length} konflikter
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {filter === 'pending' && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(decision.id)}
                            disabled={resolveMutation.isPending}
                            className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            Godkjenn
                          </button>
                          <button
                            onClick={() => handleDismiss(decision.id)}
                            disabled={resolveMutation.isPending}
                            className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            Avvis
                          </button>
                        </div>
                      )}
                      {filter !== 'pending' && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            filter === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {filter === 'approved' ? 'Godkjent' : 'Avvist'}
                        </span>
                      )}
                    </div>

                    {/* Expanded conflict details */}
                    {isExpanded && decision.conflicts && (
                      <div className="mt-3 ml-13 pl-4 border-l-2 border-red-200 space-y-2">
                        {decision.conflicts.map((conflict, idx) => (
                          <div key={idx} className="text-xs text-slate-600 bg-red-50 rounded p-2">
                            <p className="font-medium">{conflict.type || 'Overlapping'}</p>
                            <p>
                              {conflict.existing_appointment ||
                                conflict.description ||
                                'Eksisterende time i tidsrommet'}
                            </p>
                            {conflict.suggested_alternative && (
                              <p className="text-teal-600 mt-1">
                                Alternativ:{' '}
                                {new Date(conflict.suggested_alternative).toLocaleString('no-NO')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Today's Messages Panel */}
      <div className="border rounded-lg bg-white shadow-sm">
        <button
          onClick={() => setShowTodaysMessages(!showTodaysMessages)}
          className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-teal-600" />
            <h3 className="text-base font-medium text-slate-800">Dagens meldinger</h3>
            {todaysMessages.length > 0 && (
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                {todaysMessages.length}
              </span>
            )}
          </div>
          {showTodaysMessages ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showTodaysMessages && (
          <div>
            {todaysLoading ? (
              <div className="p-4 text-center text-sm text-slate-400">Laster meldinger...</div>
            ) : todaysMessages.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Ingen planlagte meldinger i dag.
              </div>
            ) : (
              <>
                {/* Bulk send button */}
                {todaysMessages.some((m) => m.status === 'approved') && (
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {todaysMessages.filter((m) => m.status === 'approved').length} godkjente
                      meldinger klare
                    </span>
                    <button
                      onClick={handleSendAll}
                      disabled={sendMutation.isPending}
                      className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Send alle
                    </button>
                  </div>
                )}

                <ul className="divide-y divide-slate-100">
                  {todaysMessages.map((msg) => {
                    const ChannelIcon = CHANNEL_ICONS[msg.channel] || MessageSquare;
                    return (
                      <li key={msg.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <ChannelIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-700 truncate">
                                {msg.patient_name || 'Ukjent pasient'}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {msg.message || msg.subject || 'Melding'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400">
                              {msg.scheduled_at
                                ? new Date(msg.scheduled_at).toLocaleTimeString('no-NO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                msg.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : msg.status === 'sent'
                                    ? 'bg-blue-100 text-blue-700'
                                    : msg.status === 'failed'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {msg.status === 'approved'
                                ? 'Klar'
                                : msg.status === 'sent'
                                  ? 'Sendt'
                                  : msg.status === 'failed'
                                    ? 'Feilet'
                                    : 'Venter'}
                            </span>
                            {msg.status !== 'sent' && msg.status !== 'cancelled' && (
                              <button
                                onClick={() => cancelMutation.mutate(msg.id)}
                                disabled={cancelMutation.isPending}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                title="Avbryt"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Small stat badge sub-component
function StatBadge({ label, value, color }) {
  return (
    <div className={`px-3 py-2 rounded-lg bg-${color}-50 border border-${color}-200`}>
      <div className={`text-lg font-bold text-${color}-700`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default SchedulerDecisions;
