/**
 * PatientMessages — Staff-facing chat view for patient messages
 * Displays threaded messages in a chat-style layout
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageSquare, User } from 'lucide-react';
import { portalAPI } from '../../services/api';
import { useTranslation } from '../../i18n';

export default function PatientMessages({ patientId }) {
  const { t } = useTranslation('portal');
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['patient-messages', patientId],
    queryFn: () => portalAPI.getPatientMessages(patientId).then((r) => r.data),
    enabled: !!patientId,
  });

  const sendMutation = useMutation({
    mutationFn: (body) => portalAPI.sendPatientMessage(patientId, { body }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['patient-messages', patientId] });
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage.trim());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('messagesLoadError', 'Kunne ikke laste meldinger')}
      </div>
    );
  }

  const messages = data?.messages || [];

  return (
    <div className="flex flex-col h-[500px]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">{t('noMessages', 'Ingen meldinger enda')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isClinic = msg.sender_type === 'CLINICIAN';
            return (
              <div key={msg.id} className={`flex ${isClinic ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                    isClinic
                      ? 'bg-teal-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3 h-3 opacity-70" />
                    <span className="text-xs font-medium opacity-80">
                      {isClinic
                        ? msg.sender_name || t('clinic', 'Klinikk')
                        : t('patient', 'Pasient')}
                    </span>
                  </div>
                  {msg.subject && <p className="text-sm font-medium mb-1">{msg.subject}</p>}
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <p className={`text-xs mt-1 ${isClinic ? 'text-teal-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleString('nb-NO', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose bar */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 pt-3">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('typeMessage', 'Skriv en melding...')}
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sendMutation.isPending}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 self-end"
        >
          {sendMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
