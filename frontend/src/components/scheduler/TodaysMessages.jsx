/**
 * Today's Messages Component
 * Shows SMS/email messages for today with delivery status, filtering, and approve/reject actions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulerAPI } from '../../services/api';

const STATUS_STYLES = {
  sent: { label: 'Sendt', className: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Levert', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Feilet', className: 'bg-red-100 text-red-700' },
  pending: { label: 'Venter', className: 'bg-amber-100 text-amber-700' },
  read: { label: 'Lest', className: 'bg-teal-100 text-teal-700' },
  approved: { label: 'Godkjent', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Avbrutt', className: 'bg-slate-100 text-slate-500' },
};

const TYPE_LABELS = {
  all: 'Alle',
  sms: 'SMS',
  email: 'E-post',
  push: 'Push',
};

const TodaysMessages = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['scheduler-today', typeFilter],
    queryFn: () => schedulerAPI.getTodaysMessages(),
    retry: false,
  });

  const allMessages = messagesData?.data?.messages || messagesData?.data || [];
  const messages =
    typeFilter === 'all' ? allMessages : allMessages.filter((m) => m.type === typeFilter);

  const pendingMessages = messages.filter((m) => m.status === 'pending');

  const sendMutation = useMutation({
    mutationFn: (ids) => schedulerAPI.sendApproved(ids),
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['scheduler-today'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => schedulerAPI.cancelMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-today'] });
    },
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllPending = () => {
    if (selectedIds.size === pendingMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingMessages.map((m) => m.id)));
    }
  };

  const handleSendSelected = () => {
    if (selectedIds.size === 0) return;
    sendMutation.mutate([...selectedIds]);
  };

  const handleCancelMessage = (id) => {
    cancelMutation.mutate(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const statusInfo = (status) => STATUS_STYLES[status] || STATUS_STYLES.pending;

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-800">Dagens meldinger</h3>
        <div className="flex items-center gap-2">
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                typeFilter === key
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {pendingMessages.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllPending}
              className="text-xs px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50"
            >
              {selectedIds.size === pendingMessages.length
                ? 'Fjern valg'
                : `Velg alle (${pendingMessages.length})`}
            </button>
            <span className="text-xs text-amber-700">
              {pendingMessages.length} venter på godkjenning
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendSelected}
              disabled={selectedIds.size === 0 || sendMutation.isPending}
              className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {sendMutation.isPending ? 'Sender...' : `Send valgte (${selectedIds.size})`}
            </button>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">Ingen meldinger i dag.</div>
      ) : (
        <>
          {/* Summary Bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-4 text-xs text-slate-600">
            <span>
              Totalt: <strong>{messages.length}</strong>
            </span>
            <span>
              Levert:{' '}
              <strong>
                {messages.filter((m) => m.status === 'delivered' || m.status === 'read').length}
              </strong>
            </span>
            <span>
              Venter: <strong>{pendingMessages.length}</strong>
            </span>
            <span className="text-red-600">
              Feilet: <strong>{messages.filter((m) => m.status === 'failed').length}</strong>
            </span>
          </div>

          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {messages.map((msg) => {
              const status = statusInfo(msg.status);
              const isPending = msg.status === 'pending';
              return (
                <li
                  key={msg.id}
                  className={`p-3 hover:bg-slate-50 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {isPending && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(msg.id)}
                          onChange={() => toggleSelect(msg.id)}
                          className="mt-1 rounded text-teal-600"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-medium">
                            {msg.type || 'sms'}
                          </span>
                          <span className="text-sm font-medium text-slate-800 truncate">
                            {msg.recipient_name || msg.recipient || 'Ukjent'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {msg.subject || msg.message || msg.content || 'Ingen innhold'}
                        </p>
                        {msg.sent_at && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(msg.sent_at).toLocaleTimeString('no-NO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => sendMutation.mutate([msg.id])}
                            disabled={sendMutation.isPending}
                            className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => handleCancelMessage(msg.id)}
                            disabled={cancelMutation.isPending}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            Avbryt
                          </button>
                        </>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default TodaysMessages;
