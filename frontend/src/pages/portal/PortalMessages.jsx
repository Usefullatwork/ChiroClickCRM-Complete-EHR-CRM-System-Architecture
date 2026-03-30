/**
 * Portal Messages - Patient messaging inbox
 * View, compose, and reply to messages from the clinic
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
  Send,
  Clock,
} from 'lucide-react';
import { patientPortalAPI } from '../../services/api';
import { useTranslation } from '../../i18n';
import logger from '../../utils/logger';

export default function PortalMessages() {
  const navigate = useNavigate();
  const { t } = useTranslation('portal');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [_unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [view, setView] = useState('inbox'); // inbox | compose | thread
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [composeForm, setComposeForm] = useState({ subject: '', body: '' });
  const [sendStatus, setSendStatus] = useState(null);
  const [replyBody, setReplyBody] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getMessages();
      setMessages(res.data?.messages || []);
      setUnreadCount(res.data?.unread_count || 0);
    } catch (err) {
      logger.error('Failed to load messages:', err);
      setError(t('portalMessagesLoadError', 'Kunne ikke laste meldinger'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!composeForm.body.trim()) {
      return;
    }
    try {
      setSendStatus('sending');
      await patientPortalAPI.sendMessage(composeForm);
      setSendStatus('sent');
      setComposeForm({ subject: '', body: '' });
      setTimeout(() => {
        setView('inbox');
        setSendStatus(null);
        loadMessages();
      }, 1500);
    } catch (err) {
      logger.error('Failed to send message:', err);
      setSendStatus('error');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || !selectedMessage) {
      return;
    }
    try {
      setSendStatus('sending');
      await patientPortalAPI.sendMessage({
        body: replyBody,
        parent_message_id: selectedMessage.parent_message_id || selectedMessage.id,
      });
      setSendStatus(null);
      setReplyBody('');
      loadMessages();
      // Reload thread
      const updated = await patientPortalAPI.getMessages();
      setMessages(updated.data?.messages || []);
    } catch (err) {
      logger.error('Failed to reply:', err);
      setSendStatus('error');
    }
  };

  const openThread = async (msg) => {
    setSelectedMessage(msg);
    setView('thread');
    setReplyBody('');
    if (!msg.is_read && msg.sender_type !== 'PATIENT') {
      try {
        await patientPortalAPI.markMessageRead(msg.id);
      } catch (err) {
        logger.error('Failed to mark message as read:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => {
              if (view !== 'inbox') {
                setView('inbox');
                setSelectedMessage(null);
              } else {
                navigate('/portal');
              }
            }}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">
              {view === 'compose'
                ? t('portalNewMessage', 'Ny melding')
                : view === 'thread'
                  ? t('portalConversation', 'Samtale')
                  : t('portalMyMessages', 'Mine meldinger')}
            </h1>
          </div>
          {view === 'inbox' && (
            <button
              onClick={() => {
                setView('compose');
                setComposeForm({ subject: '', body: '' });
                setSendStatus(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('portalNewMessage', 'Ny melding')}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* INBOX VIEW */}
        {view === 'inbox' &&
          (messages.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">{t('portalNoMessages', 'Ingen meldinger')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('portalNoMessagesDesc', 'Meldinger fra klinikken vises her')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isFromClinic = msg.sender_type !== 'PATIENT';
                const isUnread = isFromClinic && !msg.is_read;
                return (
                  <button
                    key={msg.id}
                    onClick={() => openThread(msg)}
                    className={`w-full bg-white rounded-xl shadow-sm border p-4 text-left hover:bg-gray-50 transition-colors ${
                      isUnread ? 'border-teal-300 bg-teal-50/30' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isUnread && (
                        <div className="w-2.5 h-2.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {isFromClinic
                              ? t('portalFromClinic', 'Klinikk')
                              : t('portalFromYou', 'Du')}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(msg.created_at).toLocaleDateString('nb-NO', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {msg.subject && (
                          <p
                            className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}
                          >
                            {msg.subject}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 truncate">{msg.body}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

        {/* COMPOSE VIEW */}
        {view === 'compose' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            {sendStatus === 'sent' ? (
              <div className="text-center py-6">
                <Send className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-gray-900">
                  {t('portalMessageSent', 'Melding sendt')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('portalSubject', 'Emne')}
                  </label>
                  <input
                    type="text"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder={t('portalSubjectPlaceholder', 'Valgfritt emne')}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('portalMessage', 'Melding')}
                  </label>
                  <textarea
                    value={composeForm.body}
                    onChange={(e) => setComposeForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder={t('portalMessagePlaceholder', 'Skriv din melding her...')}
                    rows={5}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendStatus === 'sending' || !composeForm.body.trim()}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendStatus === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('portalSending', 'Sender...')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('portalSend', 'Send')}
                    </>
                  )}
                </button>
                {sendStatus === 'error' && (
                  <p className="text-sm text-red-600 text-center">
                    {t('portalSendFailed', 'Kunne ikke sende melding')}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* THREAD VIEW */}
        {view === 'thread' && selectedMessage && (
          <div className="space-y-3">
            {messages
              .filter(
                (m) =>
                  m.id === selectedMessage.id ||
                  m.parent_message_id === selectedMessage.id ||
                  (selectedMessage.parent_message_id &&
                    (m.id === selectedMessage.parent_message_id ||
                      m.parent_message_id === selectedMessage.parent_message_id))
              )
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map((msg) => {
                const isYou = msg.sender_type === 'PATIENT';
                return (
                  <div key={msg.id} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        isYou
                          ? 'bg-teal-600 text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.subject && <p className="text-sm font-medium mb-1">{msg.subject}</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      <p className={`text-xs mt-1.5 ${isYou ? 'text-teal-100' : 'text-gray-400'}`}>
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
              })}

            {/* Reply box */}
            <form onSubmit={handleReply} className="flex gap-2 pt-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={t('portalReply', 'Svar...')}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!replyBody.trim() || sendStatus === 'sending'}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
        <p>{t('portalFooterContact', 'Kontakt klinikken for hastehenvendelser')}</p>
      </footer>
    </div>
  );
}
