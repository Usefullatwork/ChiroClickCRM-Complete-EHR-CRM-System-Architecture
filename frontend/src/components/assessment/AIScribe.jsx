/**
 * AIScribe Component
 *
 * Voice-to-note ambient clinical documentation.
 * Inspired by ChiroTouch Rheo and Jane App AI Scribe.
 *
 * Features:
 * - Real-time voice transcription (browser Speech API + optional Whisper)
 * - Automatic SOAP section parsing
 * - Live transcript display with edit capability
 * - Bilingual support (EN/NO)
 * - Privacy-first: all processing local via Ollama
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Wifi,
  WifiOff,
  Volume2,
  FileText,
  Sparkles,
  Clock,
  Edit3,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  checkOllamaStatus,
  parseTranscriptionToSOAP,
  createSpeechRecognition,
  getAIConfig,
} from '../../services/aiService';

// =============================================================================
// AI SCRIBE BUTTON - Compact trigger for voice recording
// =============================================================================

export function AIScribeButton({
  onTranscript,
  language = 'en',
  disabled = false,
  className = '',
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const sr = createSpeechRecognition({
      language: language === 'no' ? 'nb-NO' : 'en-US',
      onResult: (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + ' ' + finalTranscript);
        }
      },
      onError: (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    setRecognition(sr);

    return () => {
      if (sr) {
        try { sr.stop(); } catch (e) { /* ignore */ }
      }
    };
  }, [language]);

  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      if (transcript.trim()) {
        onTranscript?.(transcript.trim());
      }
      setTranscript('');
    } else {
      setTranscript('');
      recognition.start();
    }
    setIsRecording(!isRecording);
  };

  const labels = {
    en: { record: 'Voice Note', stop: 'Stop' },
    no: { record: 'Stemmenotat', stop: 'Stopp' },
  };

  const t = labels[language] || labels.en;

  if (!recognition) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          bg-gray-100 text-gray-400 cursor-not-allowed ${className}`}
        title="Speech recognition not supported"
      >
        <MicOff className="w-4 h-4" />
        {t.record}
      </button>
    );
  }

  return (
    <button
      onClick={toggleRecording}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
        ${isRecording
          ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
    >
      {isRecording ? (
        <>
          <Square className="w-4 h-4" />
          {t.stop}
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          {t.record}
        </>
      )}
    </button>
  );
}

// =============================================================================
// AI SCRIBE PANEL - Full recording and parsing interface
// =============================================================================

export default function AIScribe({
  onApplySOAP,
  onApplyTranscript,
  language = 'en',
  className = '',
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedSOAP, setParsedSOAP] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [aiStatus, setAiStatus] = useState({ connected: false });
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Check AI status on mount
  useEffect(() => {
    checkOllamaStatus().then(setAiStatus);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const sr = createSpeechRecognition({
      language: language === 'no' ? 'nb-NO' : 'en-US',
      continuous: true,
      interimResults: true,
      onResult: (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final);
        }
        setInterimTranscript(interim);
      },
      onError: (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError(language === 'no'
            ? 'Mikrofontilgang nektet. Vennligst aktiver i nettleserinnstillinger.'
            : 'Microphone access denied. Please enable in browser settings.');
        }
        stopRecording();
      },
      onEnd: () => {
        // Auto-restart if still recording and not paused
        if (isRecording && !isPaused && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started, ignore
          }
        }
      },
    });

    recognitionRef.current = sr;

    return () => {
      if (sr) {
        try { sr.stop(); } catch (e) { /* ignore */ }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [language, isRecording, isPaused]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError(language === 'no'
        ? 'Talegjenkjenning ikke støttet i denne nettleseren'
        : 'Speech recognition not supported in this browser');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setParsedSOAP(null);
    setDuration(0);

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (e) {
      setError(e.message);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setInterimTranscript('');
  };

  const togglePause = () => {
    if (isPaused) {
      try {
        recognitionRef.current?.start();
        timerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);
      } catch (e) { /* ignore */ }
    } else {
      try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  };

  const parseToSOAP = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseTranscriptionToSOAP(transcript, language);

      if (result.success && result.sections) {
        setParsedSOAP(result.sections);
      } else {
        setError(result.error || 'Failed to parse transcript');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplySOAP = () => {
    if (parsedSOAP) {
      onApplySOAP?.(parsedSOAP);
    }
  };

  const handleApplyTranscript = () => {
    if (transcript.trim()) {
      onApplyTranscript?.(transcript.trim());
    }
  };

  const clearAll = () => {
    setTranscript('');
    setInterimTranscript('');
    setParsedSOAP(null);
    setDuration(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const labels = {
    en: {
      title: 'AI Scribe',
      subtitle: 'Voice-to-SOAP documentation',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      pause: 'Pause',
      resume: 'Resume',
      parseToSOAP: 'Parse to SOAP',
      parsing: 'Parsing...',
      transcript: 'Transcript',
      listening: 'Listening...',
      paused: 'Paused',
      noTranscript: 'Start recording to capture the encounter',
      parsedSOAP: 'Parsed SOAP Sections',
      applySOAP: 'Apply SOAP',
      applyTranscript: 'Apply as Text',
      clear: 'Clear',
      edit: 'Edit',
      copy: 'Copy',
      aiOffline: 'AI Offline - Parse unavailable',
      micRequired: 'Microphone access required',
      subjective: 'Subjective',
      objective: 'Objective',
      assessment: 'Assessment',
      plan: 'Plan',
    },
    no: {
      title: 'AI Skriver',
      subtitle: 'Stemme-til-SOAP dokumentasjon',
      startRecording: 'Start Opptak',
      stopRecording: 'Stopp Opptak',
      pause: 'Pause',
      resume: 'Fortsett',
      parseToSOAP: 'Parser til SOAP',
      parsing: 'Parser...',
      transcript: 'Transkripsjon',
      listening: 'Lytter...',
      paused: 'Pauset',
      noTranscript: 'Start opptak for å fange konsultasjonen',
      parsedSOAP: 'Parsede SOAP-seksjoner',
      applySOAP: 'Bruk SOAP',
      applyTranscript: 'Bruk som Tekst',
      clear: 'Tøm',
      edit: 'Rediger',
      copy: 'Kopier',
      aiOffline: 'AI Frakoblet - Parsing utilgjengelig',
      micRequired: 'Mikrofontilgang kreves',
      subjective: 'Subjektivt',
      objective: 'Objektivt',
      assessment: 'Vurdering',
      plan: 'Plan',
    },
  };

  const t = labels[language] || labels.en;

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-100' : 'bg-blue-100'}`}>
              {isRecording ? (
                <Volume2 className="w-5 h-5 text-red-600 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.subtitle}</p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            {isRecording && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-gray-600">{formatDuration(duration)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                  ${isPaused ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {isPaused ? t.paused : t.listening}
                </span>
              </div>
            )}

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              ${aiStatus.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {aiStatus.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {aiStatus.connected ? 'AI' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full
                font-medium hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all"
            >
              <Mic className="w-5 h-5" />
              {t.startRecording}
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className={`p-3 rounded-full transition-colors
                  ${isPaused
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                title={isPaused ? t.resume : t.pause}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full
                  font-medium hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
              >
                <Square className="w-5 h-5" />
                {t.stopRecording}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      {/* Transcript Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-700">{t.transcript}</h4>
          {transcript && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                title={t.edit}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(transcript)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                title={t.copy}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={clearAll}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                title={t.clear}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full h-40 p-4 border border-gray-200 rounded-lg text-sm resize-none
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t.noTranscript}
          />
        ) : (
          <div className={`min-h-[120px] p-4 rounded-lg border transition-colors
            ${isRecording
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-50 border-gray-200'}`}>
            {transcript || interimTranscript ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-400 italic">{interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">{t.noTranscript}</p>
            )}
          </div>
        )}

        {/* Parse to SOAP Button */}
        {transcript && !isRecording && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={parseToSOAP}
              disabled={isProcessing || !aiStatus.connected}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg
                font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isProcessing ? t.parsing : t.parseToSOAP}
            </button>

            {!aiStatus.connected && (
              <span className="text-xs text-amber-600">{t.aiOffline}</span>
            )}

            <button
              onClick={handleApplyTranscript}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg
                hover:bg-gray-200"
            >
              <FileText className="w-4 h-4" />
              {t.applyTranscript}
            </button>
          </div>
        )}
      </div>

      {/* Parsed SOAP Display */}
      {parsedSOAP && (
        <div className="px-6 pb-6">
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700">{t.parsedSOAP}</h4>
              <button
                onClick={handleApplySOAP}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg
                  font-medium hover:bg-green-600"
              >
                <Check className="w-4 h-4" />
                {t.applySOAP}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['subjective', 'objective', 'assessment', 'plan'].map((section) => (
                <div key={section} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {t[section]}
                  </h5>
                  <p className="text-sm text-gray-700">
                    {parsedSOAP[section] || parsedSOAP.raw || '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT AI SCRIBE - Inline recording widget
// =============================================================================

export function AIScribeCompact({
  onTranscript,
  language = 'en',
  className = '',
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const sr = createSpeechRecognition({
      language: language === 'no' ? 'nb-NO' : 'en-US',
      continuous: true,
      onResult: (event) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          }
        }
        if (final) {
          setTranscript((prev) => prev + final);
        }
      },
      onEnd: () => {
        if (isRecording && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
        }
      },
    });

    recognitionRef.current = sr;

    return () => {
      if (sr) try { sr.stop(); } catch (e) { /* ignore */ }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [language, isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (transcript.trim()) {
        onTranscript?.(transcript.trim());
      }
      setTranscript('');
      setDuration(0);
    } else {
      setTranscript('');
      setDuration(0);
      recognitionRef.current?.start();
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    setIsRecording(!isRecording);
  };

  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!recognitionRef.current) return null;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleRecording}
        className={`p-2 rounded-full transition-colors
          ${isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        title={isRecording ? 'Stop' : 'Record'}
      >
        {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
      {isRecording && (
        <span className="text-xs font-mono text-gray-500">{formatDuration(duration)}</span>
      )}
    </div>
  );
}
