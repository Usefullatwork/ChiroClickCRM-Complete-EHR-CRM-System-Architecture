/**
 * VoiceInputButton - Standalone voice input component
 *
 * Can be used with any text input to add voice dictation capability.
 * Uses browser's Web Speech API with Norwegian language support.
 *
 * Features:
 * - Norwegian (nb-NO) and English (en-US) language support
 * - Visual feedback when recording
 * - Interim transcript display
 * - Error handling with Norwegian messages
 * - Accessible design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, AlertCircle } from 'lucide-react';

// Check if browser supports speech recognition
const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

/**
 * @param {function} onTranscript - Callback with final transcript text
 * @param {function} onInterim - Callback with interim (partial) transcript
 * @param {string} language - Language code ('nb-NO' for Norwegian, 'en-US' for English)
 * @param {boolean} continuous - Keep listening after pauses (default true)
 * @param {boolean} disabled - Disable the button
 * @param {string} size - Button size: 'sm', 'md', 'lg' (default 'md')
 * @param {string} variant - Style variant: 'default', 'minimal', 'pill' (default 'default')
 * @param {string} className - Additional CSS classes
 */
export default function VoiceInputButton({
  onTranscript,
  onInterim,
  language = 'nb-NO',
  continuous = true,
  disabled = false,
  size = 'md',
  variant = 'default',
  className = ''
}) {
  const recognitionRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);

  // Check support on mount
  useEffect(() => {
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setInterimText('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Update interim text
      setInterimText(interim);
      onInterim?.(interim);

      // Send final transcript
      if (final) {
        onTranscript?.(final);
        setInterimText('');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      // Norwegian error messages
      const errorMessages = {
        'not-allowed': 'Mikrofontilgang nektet. Sjekk nettleserinnstillinger.',
        'no-speech': 'Ingen tale oppdaget. Prøv igjen.',
        'audio-capture': 'Ingen mikrofon funnet.',
        'network': 'Nettverksfeil. Sjekk internettforbindelse.',
        'aborted': 'Talegjenkjenning avbrutt.',
        'service-not-allowed': 'Talegjenkjenning ikke tillatt for denne siden.'
      };

      setError(errorMessages[event.error] || `Feil: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    return recognition;
  }, [language, continuous, onTranscript, onInterim]);

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      // Reinitialize to pick up any language changes
      recognitionRef.current = initRecognition();

      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
        setError('Kunne ikke starte talegjenkjenning');
      }
    }
  }, [isListening, initRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: 'p-1 w-7 h-7',
    md: 'p-1.5 w-9 h-9',
    lg: 'p-2 w-11 h-11'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Variant classes
  const variantClasses = {
    default: isListening
      ? 'bg-red-500 text-white shadow-lg hover:bg-red-600'
      : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500',
    minimal: isListening
      ? 'text-red-500 bg-red-50'
      : 'text-gray-400 hover:text-red-500',
    pill: isListening
      ? 'bg-red-500 text-white px-3 rounded-full'
      : 'bg-gray-100 text-gray-600 px-3 rounded-full hover:bg-red-50 hover:text-red-500'
  };

  // Not supported
  if (!isSupported) {
    return (
      <div className={`flex items-center gap-1 text-gray-400 text-xs ${className}`}>
        <MicOff className="w-4 h-4" />
        <span>Tale ikke støttet</span>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Main button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          flex items-center justify-center rounded-lg transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isListening ? 'animate-pulse' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-red-300
        `}
        title={isListening ? 'Stopp diktering (Esc)' : 'Start diktering'}
        aria-label={isListening ? 'Stopp diktering' : 'Start diktering'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <Square className={iconSizes[size]} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}

        {/* Pill variant shows text */}
        {variant === 'pill' && (
          <span className="ml-1.5 text-xs font-medium">
            {isListening ? 'Stopp' : 'Dikter'}
          </span>
        )}
      </button>

      {/* Recording indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5">
          <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75" />
          <span className="absolute w-full h-full bg-red-500 rounded-full" />
        </div>
      )}

      {/* Interim transcript tooltip */}
      {interimText && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg max-w-xs whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="italic">{interimText}...</span>
          </div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook version for more control
 */
export function useVoiceInput(options = {}) {
  const {
    language = 'nb-NO',
    continuous = true,
    onTranscript,
    onInterim,
    onError
  } = options;

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsSupported(!!SpeechRecognition);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      setInterimText(interim);
      onInterim?.(interim);

      if (final) {
        setTranscript(prev => prev + final);
        onTranscript?.(final);
      }
    };

    recognition.onerror = (event) => {
      const msg = event.error;
      setError(msg);
      onError?.(msg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, continuous, isListening, onTranscript, onInterim, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setError(null);
  }, [stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimText,
    error,
    start,
    stop,
    toggle,
    reset
  };
}
