/**
 * QuickNotePanel - Quick notes, tasks, and follow-up reminders for patient files
 *
 * Features:
 * - Add quick notes directly from patient detail or SOAP note
 * - Create tasks with due dates
 * - Set follow-up reminders
 * - Optionally send SMS/email (queues for approval)
 * - View history of notes
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  CheckSquare,
  Bell,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  AlertCircle,
  Check,
  X,
  Plus,
  Calendar,
  User,
} from 'lucide-react';
import { format, formatDistanceToNow, addDays, addWeeks } from 'date-fns';
import { nb } from 'date-fns/locale';
import { followUpsAPI } from '../../services/api';

// Note types
const NOTE_TYPES = {
  note: { label: 'Notat', icon: MessageSquare, color: 'blue' },
  task: { label: 'Oppgave', icon: CheckSquare, color: 'green' },
  reminder: { label: 'Påminnelse', icon: Bell, color: 'amber' },
  follow_up: { label: 'Oppfølging', icon: Phone, color: 'purple' },
};

// Priority levels
const PRIORITIES = {
  low: { label: 'Lav', color: 'gray' },
  normal: { label: 'Normal', color: 'blue' },
  high: { label: 'Høy', color: 'orange' },
  urgent: { label: 'Haster', color: 'red' },
};

// Quick date options
const QUICK_DATES = [
  { label: 'I dag', getValue: () => new Date() },
  { label: 'I morgen', getValue: () => addDays(new Date(), 1) },
  { label: '1 uke', getValue: () => addWeeks(new Date(), 1) },
  { label: '2 uker', getValue: () => addWeeks(new Date(), 2) },
  { label: '1 måned', getValue: () => addWeeks(new Date(), 4) },
];

// Quick note templates
const QUICK_TEMPLATES = [
  {
    label: 'Ring om 2 uker',
    content: 'Ring pasient for oppfølging',
    dueOffset: 14,
    type: 'follow_up',
  },
  { label: 'Sjekk røntgen', content: 'Sjekk røntgenresultater', dueOffset: 3, type: 'task' },
  {
    label: 'Venter på svar',
    content: 'Venter på tilbakemelding fra pasient',
    dueOffset: 7,
    type: 'reminder',
  },
  {
    label: 'Henvis fastlege',
    content: 'Henvise til fastlege for videre utredning',
    dueOffset: 0,
    type: 'task',
  },
];

export default function QuickNotePanel({
  patientId,
  encounterId = null,
  patientName = '',
  patientPhone = '',
  patientEmail = '',
  onNoteSaved,
  compact = false,
  className = '',
}) {
  const queryClient = useQueryClient();

  // State
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [noteType, setNoteType] = useState('note');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch existing notes/follow-ups for this patient
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: async () => {
      const response = await followUpsAPI.getAll({ patientId, limit: 20 });
      return response.data;
    },
    enabled: !!patientId && showHistory,
  });

  const notes = notesData?.followUps || notesData?.data || [];

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      const response = await followUpsAPI.create(noteData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
      resetForm();
      if (onNoteSaved) onNoteSaved();
    },
  });

  // Reset form
  const resetForm = useCallback(() => {
    setContent('');
    setPriority('normal');
    setDueDate('');
    setSendSms(false);
    setSendEmail(false);
  }, []);

  // Handle quick template click
  const handleQuickTemplate = useCallback((template) => {
    setNoteType(template.type);
    setContent(template.content);
    if (template.dueOffset > 0) {
      setDueDate(format(addDays(new Date(), template.dueOffset), 'yyyy-MM-dd'));
    }
  }, []);

  // Handle quick date selection
  const handleQuickDate = useCallback((quickDate) => {
    setDueDate(format(quickDate.getValue(), 'yyyy-MM-dd'));
  }, []);

  // Submit note
  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();

      if (!content.trim()) return;

      const noteData = {
        patient_id: patientId,
        encounter_id: encounterId,
        note_type: noteType,
        content: content.trim(),
        priority,
        due_date: dueDate || null,
        send_method: sendSms ? 'sms' : sendEmail ? 'email' : null,
        message_status: sendSms || sendEmail ? 'pending_approval' : null,
      };

      createNoteMutation.mutate(noteData);
    },
    [
      patientId,
      encounterId,
      noteType,
      content,
      priority,
      dueDate,
      sendSms,
      sendEmail,
      createNoteMutation,
    ]
  );

  // Toggle complete (for tasks)
  const completeMutation = useMutation({
    mutationFn: async (noteId) => {
      const response = await followUpsAPI.complete(noteId, '');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
    },
  });

  const handleToggleComplete = useCallback(
    (noteId) => {
      completeMutation.mutate(noteId);
    },
    [completeMutation]
  );

  const NoteTypeConfig = NOTE_TYPES[noteType];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 rounded-t-lg hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">Hurtignotater</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Type selector */}
          <div className="flex gap-1">
            {Object.entries(NOTE_TYPES).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = noteType === key;
              return (
                <button
                  key={key}
                  onClick={() => setNoteType(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? `bg-${config.color}-100 text-${config.color}-700 border border-${config.color}-300`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick templates */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickTemplate(template)}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                {template.label}
              </button>
            ))}
          </div>

          {/* Content input */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Skriv ${NOTE_TYPES[noteType].label.toLowerCase()}...`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Options row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prioritet</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PRIORITIES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Forfallsdato</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick date buttons */}
          <div className="flex flex-wrap gap-1">
            {QUICK_DATES.map((qd, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickDate(qd)}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                {qd.label}
              </button>
            ))}
          </div>

          {/* Send options */}
          {(patientPhone || patientEmail) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-medium text-amber-800 mb-2">
                Send melding til pasient (krever godkjenning)
              </p>
              <div className="flex gap-4">
                {patientPhone && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => {
                        setSendSms(e.target.checked);
                        if (e.target.checked) setSendEmail(false);
                      }}
                      className="rounded text-blue-600"
                    />
                    <Phone className="w-4 h-4 text-gray-400" />
                    SMS
                  </label>
                )}
                {patientEmail && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => {
                        setSendEmail(e.target.checked);
                        if (e.target.checked) setSendSms(false);
                      }}
                      className="rounded text-blue-600"
                    />
                    <Mail className="w-4 h-4 text-gray-400" />
                    E-post
                  </label>
                )}
              </div>
              {(sendSms || sendEmail) && (
                <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Meldingen sendes til godkjenningskø før den sendes
                </p>
              )}
            </div>
          )}

          {/* Submit button */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || createNoteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {createNoteMutation.isPending ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {sendSms || sendEmail ? 'Lagre & kø melding' : 'Lagre'}
                </>
              )}
            </button>

            {content && (
              <button
                onClick={resetForm}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full text-xs text-gray-500 hover:text-gray-700 py-2"
          >
            {showHistory ? 'Skjul historikk' : 'Vis tidligere notater'}
          </button>

          {/* Notes history */}
          {showHistory && (
            <div className="border-t border-gray-200 pt-3 space-y-2 max-h-64 overflow-y-auto">
              {notesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Ingen notater ennå</p>
              ) : (
                notes.map((note) => {
                  const TypeConfig = NOTE_TYPES[note.note_type] || NOTE_TYPES.note;
                  const Icon = TypeConfig.icon;
                  const isCompleted = !!note.completed_at;

                  return (
                    <div
                      key={note.id}
                      className={`p-2 rounded-lg border ${
                        isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon
                          className={`w-4 h-4 mt-0.5 text-${TypeConfig.color}-500 ${isCompleted ? 'opacity-50' : ''}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                          >
                            {note.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>
                              {format(new Date(note.created_at), 'dd.MM.yy', { locale: nb })}
                            </span>
                            {note.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(note.due_date), 'dd.MM', { locale: nb })}
                              </span>
                            )}
                            {note.message_status === 'sent' && (
                              <span className="flex items-center gap-1 text-green-500">
                                <Send className="w-3 h-3" />
                                Sendt
                              </span>
                            )}
                          </div>
                        </div>
                        {note.note_type === 'task' && !isCompleted && (
                          <button
                            onClick={() => handleToggleComplete(note.id)}
                            className="p-1 text-gray-400 hover:text-green-500"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline version for SOAP note footer
export function QuickNoteInline({ patientId, encounterId, onAction }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Hurtighandlinger:</span>
      <button
        onClick={() => onAction?.('sms')}
        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
      >
        <Phone className="w-3.5 h-3.5" />
        SMS
      </button>
      <button
        onClick={() => onAction?.('email')}
        className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
      >
        <Mail className="w-3.5 h-3.5" />
        E-post
      </button>
      <button
        onClick={() => onAction?.('appointment')}
        className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
      >
        <Calendar className="w-3.5 h-3.5" />
        Neste time
      </button>
      <button
        onClick={() => onAction?.('note')}
        className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Notat
      </button>
    </div>
  );
}
