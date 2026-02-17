/**
 * Today's Messages Component
 * Shows SMS/email messages for today with delivery status and filtering.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../services/api';

const STATUS_STYLES = {
  sent: { label: 'Sendt', className: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Levert', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Feilet', className: 'bg-red-100 text-red-700' },
  pending: { label: 'Venter', className: 'bg-amber-100 text-amber-700' },
  read: { label: 'Lest', className: 'bg-teal-100 text-teal-700' },
};

const TYPE_LABELS = {
  sms: 'SMS',
  email: 'E-post',
  push: 'Push',
  all: 'Alle',
};

const TodaysMessages = () => {
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['notifications-today', typeFilter],
    queryFn: () =>
      notificationsAPI.getAll({
        date: new Date().toISOString().split('T')[0],
        type: typeFilter !== 'all' ? typeFilter : undefined,
      }),
    retry: false,
  });

  const messages = messagesData?.data || [];

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
            <span className="text-red-600">
              Feilet: <strong>{messages.filter((m) => m.status === 'failed').length}</strong>
            </span>
          </div>

          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {messages.map((msg) => {
              const status = statusInfo(msg.status);
              return (
                <li key={msg.id} className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
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
                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
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
