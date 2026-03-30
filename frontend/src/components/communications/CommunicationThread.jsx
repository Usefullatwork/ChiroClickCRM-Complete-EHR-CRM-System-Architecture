import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Mail, Phone, User } from 'lucide-react';
import { useTranslation, formatDate } from '../../i18n';

const CHANNEL_ICONS = {
  SMS: MessageSquare,
  EMAIL: Mail,
  PHONE: Phone,
};

const STATUS_STYLES = {
  sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  delivered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

function PatientGroup({ patientName, messages, lang }) {
  const [expanded, setExpanded] = useState(false);

  const lastMessage = messages[0];
  const lastDate = lastMessage?.created_at || lastMessage?.sent_at;

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          )}
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {patientName || 'Ukjent'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {messages.length} {messages.length === 1 ? 'melding' : 'meldinger'}
          </span>
          {lastDate && (
            <span className="text-xs text-gray-400 dark:text-gray-300">
              {formatDate(lastDate, lang, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="ml-4 mt-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-1">
          {messages.map((comm) => {
            const ChannelIcon = CHANNEL_ICONS[comm.type] || MessageSquare;
            const statusClass =
              STATUS_STYLES[(comm.status || '').toLowerCase()] ||
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            const date = comm.created_at || comm.sent_at;

            return (
              <div
                key={comm.id}
                className="flex items-start gap-3 py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                    comm.type === 'SMS'
                      ? 'bg-purple-50 dark:bg-purple-900/30'
                      : comm.type === 'EMAIL'
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <ChannelIcon
                    className={`w-3.5 h-3.5 ${
                      comm.type === 'SMS'
                        ? 'text-purple-600 dark:text-purple-400'
                        : comm.type === 'EMAIL'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {comm.message}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {comm.status && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${statusClass}`}
                    >
                      {comm.status}
                    </span>
                  )}
                  {date && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(date, lang, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CommunicationThread({ communications }) {
  const { lang } = useTranslation('communications');

  const grouped = useMemo(() => {
    const map = new Map();

    for (const comm of communications) {
      const key = comm.patient_id || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
          patientName: comm.patient_name || null,
          messages: [],
        });
      }
      map.get(key).messages.push(comm);
    }

    // Sort groups by most recent message first
    return Array.from(map.values()).sort((a, b) => {
      const dateA = a.messages[0]?.created_at || a.messages[0]?.sent_at || '';
      const dateB = b.messages[0]?.created_at || b.messages[0]?.sent_at || '';
      return new Date(dateB) - new Date(dateA);
    });
  }, [communications]);

  if (grouped.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Ingen meldinger funnet</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-1">
      {grouped.map((group, index) => (
        <PatientGroup
          key={group.messages[0]?.patient_id || index}
          patientName={group.patientName}
          messages={group.messages}
          lang={lang}
        />
      ))}
    </div>
  );
}
