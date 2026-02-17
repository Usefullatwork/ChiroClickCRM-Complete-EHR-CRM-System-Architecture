/**
 * PatientLookup - Step 1: Find patient's appointment
 *
 * Features:
 * - Search by last name or phone number
 * - Shows today's appointments only
 * - Large touch-friendly buttons
 * - Bilingual support
 */

import { useState, useCallback } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'Check In',
    subtitle: 'Enter your last name or phone number',
    placeholder: 'Last name or phone...',
    searchButton: 'Search',
    searching: 'Searching...',
    noResults: 'No appointment found for today',
    tryAgain: 'Please check with reception',
    selectAppointment: 'Select your appointment',
    appointmentAt: 'Appointment at',
  },
  no: {
    title: 'Sjekk inn',
    subtitle: 'Skriv inn etternavn eller telefonnummer',
    placeholder: 'Etternavn eller telefon...',
    searchButton: 'Søk',
    searching: 'Søker...',
    noResults: 'Ingen avtale funnet for i dag',
    tryAgain: 'Vennligst sjekk med resepsjonen',
    selectAppointment: 'Velg din avtale',
    appointmentAt: 'Avtale kl.',
  },
};

const APPOINTMENT_TYPE_LABELS = {
  en: {
    INITIAL: 'New Patient',
    FOLLOWUP: 'Follow-up',
    FOLLOW_UP: 'Follow-up',
    MAINTENANCE: 'Maintenance',
    ACUTE: 'Acute',
    REEXAM: 'Re-examination',
    EMERGENCY: 'Emergency',
  },
  no: {
    INITIAL: 'Ny pasient',
    FOLLOWUP: 'Oppfølging',
    FOLLOW_UP: 'Oppfølging',
    MAINTENANCE: 'Vedlikehold',
    ACUTE: 'Akutt',
    REEXAM: 'Reundersøkelse',
    EMERGENCY: 'Akutt',
  },
};

export default function PatientLookup({ onSelect, lang = 'no', apiBase = '/api/v1' }) {
  const t = TRANSLATIONS[lang];
  const typeLabels = APPOINTMENT_TYPE_LABELS[lang];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang === 'no' ? 'nb-NO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const search = useCallback(async () => {
    if (query.length < 2) {
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`${apiBase}/kiosk/lookup?q=${encodeURIComponent(query)}`);

      if (!res.ok) {
        throw new Error('Search failed');
      }

      const data = await res.json();
      setResults(data.appointments || []);
    } catch (err) {
      console.error('Kiosk lookup error:', err);
      setError(lang === 'no' ? 'Søk mislyktes. Prøv igjen.' : 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, apiBase, lang]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.length >= 2) {
      search();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">{t.title}</h1>
        <p className="text-xl text-slate-500">{t.subtitle}</p>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          className="w-full text-2xl md:text-3xl p-5 md:p-6 border-2 border-slate-200 rounded-2xl
                     text-center focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                     outline-none transition-all"
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
        />
      </div>

      {/* Search button */}
      <button
        onClick={search}
        disabled={query.length < 2 || loading}
        className="w-full py-5 md:py-6 bg-teal-600 text-white text-xl md:text-2xl font-bold
                   rounded-2xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            {t.searching}
          </>
        ) : (
          <>
            <Search className="w-6 h-6" />
            {t.searchButton}
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <p className="text-lg text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8 flex-1 overflow-y-auto">
          <p className="text-lg text-slate-600 mb-4 text-center">{t.selectAppointment}</p>
          <div className="space-y-3">
            {results.map((apt) => (
              <button
                key={apt.id}
                onClick={() => onSelect(apt)}
                className="w-full p-5 md:p-6 bg-slate-50 rounded-2xl border-2 border-slate-200
                           hover:border-teal-500 hover:bg-teal-50 transition-all text-left
                           active:scale-[0.98] transform"
              >
                <div className="text-2xl font-bold text-slate-800">
                  {apt.firstName} {apt.lastName}
                </div>
                <div className="text-lg text-slate-500 mt-1 flex items-center gap-2">
                  <span className="font-medium">
                    {t.appointmentAt} {formatTime(apt.startTime)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{typeLabels[apt.appointmentType] || apt.appointmentType}</span>
                </div>
                {apt.phoneLastFour && (
                  <div className="text-sm text-slate-400 mt-1">
                    {lang === 'no' ? 'Telefon slutter på' : 'Phone ends with'} ...
                    {apt.phoneLastFour}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {results.length === 0 && searched && !loading && !error && (
        <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center">
          <div className="text-4xl mb-3">🤔</div>
          <p className="text-xl text-amber-800 font-medium">{t.noResults}</p>
          <p className="text-lg text-amber-600 mt-2">{t.tryAgain}</p>
        </div>
      )}
    </div>
  );
}
