/**
 * NoShowImporter - Import no-shows and auto-generate follow-up messages
 *
 * Features:
 * - Upload CSV/list of no-shows
 * - Match patients by phone/email/ID
 * - Preview matched patients
 * - Auto-generate SMS messages from templates
 * - Queue messages for approval
 */
import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Check, AlertCircle, Phone, Mail, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { patientsAPI, communicationsAPI } from '../../services/api';

// Message templates for no-shows
const NO_SHOW_TEMPLATES = {
  direct: {
    label: 'Direkte',
    description: 'Kort og saklig melding',
    content:
      'Hei {{firstName}}, du møtte ikke til timen din {{date}} kl. {{time}}. Ring oss på {{clinicPhone}} for å avtale ny time.',
  },
  kind: {
    label: 'Vennlig',
    description: 'Myk og forståelsesfull',
    content:
      'Hei {{firstName}}, vi savnet deg på timen i dag! Håper alt er bra med deg. Ring oss på {{clinicPhone}} hvis du ønsker å booke ny time. Vennlig hilsen {{clinicName}}',
  },
  empathetic: {
    label: 'Empatisk',
    description: 'Fokus på pasienten',
    content:
      'Hei {{firstName}}, vi merket at du ikke kunne komme på timen i dag. Vi håper alt er vel med deg. Ikke nøl med å ta kontakt på {{clinicPhone}} når du er klar for en ny time. Ta vare på deg selv!',
  },
};

// Parse uploaded data
function parseNoShowData(text) {
  const lines = text.trim().split('\n');
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (i === 0 && line.toLowerCase().includes('telefon'))) {
      continue;
    } // Skip header

    // Try to parse as CSV or detect format
    const _parts = line.split(/[,;\t]/);

    const entry = {
      lineNumber: i + 1,
      raw: line,
      identifier: null,
      identifierType: null,
      date: null,
      time: null,
      matched: false,
      patient: null,
      error: null,
    };

    // Try to extract phone number
    const phoneMatch = line.match(/(\+?47)?[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{3})/);
    if (phoneMatch) {
      entry.identifier = phoneMatch[0].replace(/[\s-]/g, '');
      entry.identifierType = 'phone';
    }

    // Try to extract email
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && !entry.identifier) {
      entry.identifier = emailMatch[0];
      entry.identifierType = 'email';
    }

    // Try to extract date (formats: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)
    const dateMatch = line.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (dateMatch) {
      entry.date = `${dateMatch[1].padStart(2, '0')}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3]}`;
    }

    // Try to extract time
    const timeMatch = line.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      entry.time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }

    if (!entry.identifier) {
      entry.error = 'Kunne ikke finne telefon eller e-post';
    }

    results.push(entry);
  }

  return results;
}

// Render template with variables
function renderTemplate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
}

export default function NoShowImporter({
  isOpen,
  onClose,
  clinicName = 'Klinikken',
  clinicPhone = '12345678',
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // State
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Configure, 4: Done
  const [rawData, setRawData] = useState('');
  const [parsedEntries, setParsedEntries] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('kind');
  const [sendToApproval, setSendToApproval] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setRawData(text);
        const parsed = parseNoShowData(text);
        setParsedEntries(parsed);
        setStep(2);
      }
    };
    reader.readAsText(file);
  }, []);

  // Handle text paste
  const handleTextPaste = useCallback((e) => {
    const text = e.target.value;
    setRawData(text);
  }, []);

  // Parse pasted text
  const handleParseText = useCallback(() => {
    if (!rawData.trim()) {
      return;
    }
    const parsed = parseNoShowData(rawData);
    setParsedEntries(parsed);
    setStep(2);
  }, [rawData]);

  // Match patients by searching each identifier against the patients API
  const matchPatients = useCallback(async () => {
    const updated = await Promise.all(
      parsedEntries.map(async (entry) => {
        if (entry.error || !entry.identifier) {
          return { ...entry, matched: false, patient: null };
        }
        try {
          const response = await patientsAPI.getAll({ search: entry.identifier, limit: 1 });
          const patients = response.data?.patients || response.data?.data || [];
          if (patients.length > 0) {
            return { ...entry, matched: true, patient: patients[0] };
          }
          return { ...entry, matched: false, patient: null };
        } catch {
          return { ...entry, matched: false, patient: null };
        }
      })
    );

    setParsedEntries(updated);
    setStep(3);
  }, [parsedEntries]);

  // Import and queue messages
  const importMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);

      const matchedEntries = parsedEntries.filter((e) => e.matched && e.patient);
      const template = NO_SHOW_TEMPLATES[selectedTemplate].content;

      const messages = matchedEntries.map((entry) => {
        const content = renderTemplate(template, {
          firstName: entry.patient.first_name,
          date: entry.date || format(new Date(), 'dd.MM.yyyy', { locale: nb }),
          time: entry.time || 'timen',
          clinicName,
          clinicPhone,
        });

        return {
          patient_id: entry.patient.id,
          type: 'SMS',
          recipient: entry.identifier,
          content,
          category: 'no_show',
          approval_status: sendToApproval ? 'pending' : 'approved',
          trigger_event: `No-show ${entry.date || 'i dag'}`,
        };
      });

      // Send each message via the communications API
      for (const msg of messages) {
        await communicationsAPI.sendSMS({
          patient_id: msg.patient_id,
          content: msg.content,
          category: msg.category,
          approval_status: msg.approval_status,
        });
      }

      return { count: messages.length };
    },
    onSuccess: (_data) => {
      setStep(4);
      queryClient.invalidateQueries(['pending-messages']);
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  // Reset and close
  const handleClose = useCallback(() => {
    setStep(1);
    setRawData('');
    setParsedEntries([]);
    setSelectedTemplate('kind');
    setSendToApproval(true);
    onClose();
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  const matchedCount = parsedEntries.filter((e) => e.matched).length;
  const unmatchedCount = parsedEntries.filter((e) => !e.matched && !e.error).length;
  const errorCount = parsedEntries.filter((e) => e.error).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Upload className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Importer No-Shows</h2>
              <p className="text-sm text-gray-500">Steg {step} av 4</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              {/* File upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-colors"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700">Dra fil hit eller klikk for å laste opp</p>
                <p className="text-sm text-gray-500 mt-1">CSV eller tekstfil med telefonnumre</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">eller</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Text paste */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lim inn telefonnumre (ett per linje)
                </label>
                <textarea
                  value={rawData}
                  onChange={handleTextPaste}
                  placeholder="+47 912 34 567&#10;987 65 432&#10;Ola Nordmann, 12345678, 29.01.2026"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 resize-none font-mono text-sm"
                  rows={6}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Støttede formater:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • Telefonnummer per linje:{' '}
                    <code className="bg-blue-100 px-1 rounded">912 34 567</code>
                  </li>
                  <li>
                    • Med dato/tid:{' '}
                    <code className="bg-blue-100 px-1 rounded">912 34 567, 29.01.2026, 14:00</code>
                  </li>
                  <li>• CSV med kolonner: telefon, dato, tid</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Preview parsed data */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Funnet {parsedEntries.length} oppføring{parsedEntries.length !== 1 ? 'er' : ''}
                </h3>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Tilbake
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {parsedEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 ${
                      entry.error ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {entry.error ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : entry.identifierType === 'phone' ? (
                        <Phone className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Mail className="w-5 h-5 text-purple-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{entry.identifier || entry.raw}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {entry.date && <span>{entry.date}</span>}
                          {entry.time && <span>{entry.time}</span>}
                          {entry.error && <span className="text-red-500">{entry.error}</span>}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        entry.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {entry.error ? 'Feil' : 'OK'}
                    </span>
                  </div>
                ))}
              </div>

              {errorCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {errorCount} oppføring{errorCount !== 1 ? 'er' : ''} kunne ikke leses og vil bli
                  hoppet over
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configure messages */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <Check className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{matchedCount}</p>
                  <p className="text-xs text-green-600">Matchet</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-700">{unmatchedCount}</p>
                  <p className="text-xs text-amber-600">Ikke funnet</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <X className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                  <p className="text-xs text-red-600">Feil</p>
                </div>
              </div>

              {/* Template selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Velg meldingsmal
                </label>
                <div className="space-y-2">
                  {Object.entries(NO_SHOW_TEMPLATES).map(([key, template]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === key
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={key}
                        checked={selectedTemplate === key}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="mt-1 text-red-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{template.label}</p>
                        <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                        <p className="text-sm text-gray-600 bg-white/50 p-2 rounded border border-gray-100">
                          {renderTemplate(template.content, {
                            firstName: 'Ola',
                            date: format(new Date(), 'dd.MM.yyyy', { locale: nb }),
                            time: '14:00',
                            clinicName,
                            clinicPhone,
                          })}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Approval toggle */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToApproval}
                    onChange={(e) => setSendToApproval(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <div>
                    <p className="font-medium text-amber-800">Send til godkjenningskø (anbefalt)</p>
                    <p className="text-xs text-amber-600">
                      Du kan se gjennom og redigere hver melding før den sendes
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {matchedCount} melding{matchedCount !== 1 ? 'er' : ''} lagt i kø
              </h3>
              <p className="text-gray-500 mb-6">
                {sendToApproval
                  ? 'Meldingene venter nå på godkjenning.'
                  : 'Meldingene sendes ut snart.'}
              </p>
              {sendToApproval && (
                <a
                  href="/communications/approval"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gå til godkjenning
                  <ChevronRight className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 4 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Avbryt
            </button>

            {step === 1 && (
              <button
                onClick={handleParseText}
                disabled={!rawData.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Neste
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={matchPatients}
                disabled={parsedEntries.filter((e) => !e.error).length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              >
                Match pasienter
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => importMutation.mutate()}
                disabled={matchedCount === 0 || isProcessing}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importerer...
                  </>
                ) : (
                  <>
                    Importer {matchedCount} melding{matchedCount !== 1 ? 'er' : ''}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
