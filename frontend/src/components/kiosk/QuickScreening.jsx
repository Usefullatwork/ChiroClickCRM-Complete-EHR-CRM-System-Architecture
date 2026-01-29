/**
 * QuickScreening - Step 5: Changes since last visit
 *
 * Features:
 * - Large Yes/No buttons
 * - Comparison to last visit (better/same/worse)
 * - New symptoms capture
 * - Skipped for first-time patients
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Minus, TrendingDown } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'Since your last visit',
    lastVisit: 'Last visit',
    comparisonQuestion: 'How do you feel compared to last time?',
    better: 'Better',
    same: 'About the same',
    worse: 'Worse',
    newSymptomsQuestion: 'Any new symptoms?',
    yes: 'Yes',
    no: 'No',
    describePlaceholder: 'Please describe the new symptoms...',
    continueButton: 'Complete Check-In',
    back: 'Back',
    firstVisitMessage: 'Welcome to your first visit!',
    firstVisitSubtext: 'We\'re excited to help you.',
  },
  no: {
    title: 'Siden sist besøk',
    lastVisit: 'Sist besøk',
    comparisonQuestion: 'Hvordan føler du deg sammenlignet med sist?',
    better: 'Bedre',
    same: 'Omtrent det samme',
    worse: 'Verre',
    newSymptomsQuestion: 'Har du nye symptomer?',
    yes: 'Ja',
    no: 'Nei',
    describePlaceholder: 'Vennligst beskriv de nye symptomene...',
    continueButton: 'Fullfør innsjekking',
    back: 'Tilbake',
    firstVisitMessage: 'Velkommen til ditt første besøk!',
    firstVisitSubtext: 'Vi gleder oss til å hjelpe deg.',
  }
};

export default function QuickScreening({
  appointment,
  onNext,
  onBack,
  lang = 'no'
}) {
  const t = TRANSLATIONS[lang];

  const [comparedToLast, setComparedToLast] = useState(null);
  const [newSymptoms, setNewSymptoms] = useState(null);
  const [newSymptomsText, setNewSymptomsText] = useState('');

  // Check if first visit
  const isFirstVisit = !appointment?.lastVisitDate || appointment?.totalVisits === 0;

  // Auto-skip for first visits
  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        onNext({ isFirstVisit: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit, onNext]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleComplete = () => {
    onNext({
      isFirstVisit: false,
      comparedToLast,
      newSymptoms,
      newSymptomsText: newSymptoms ? newSymptomsText : ''
    });
  };

  const canContinue = comparedToLast !== null && newSymptoms !== null &&
    (newSymptoms === false || (newSymptoms === true && newSymptomsText.trim()));

  // First visit screen
  if (isFirstVisit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="text-8xl mb-6 animate-bounce">👋</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">
          {t.firstVisitMessage}
        </h2>
        <p className="text-xl text-slate-500">
          {t.firstVisitSubtext}
        </p>
        <div className="mt-8">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-2 text-slate-500 hover:text-slate-700
                   transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        {t.back}
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          {t.title}
        </h1>
        {appointment?.lastVisitDate && (
          <p className="text-lg text-slate-500">
            {t.lastVisit}: {formatDate(appointment.lastVisitDate)}
          </p>
        )}
      </div>

      {/* Comparison question */}
      <div className="mb-6">
        <p className="text-lg font-medium text-slate-700 mb-4 text-center">
          {t.comparisonQuestion}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setComparedToLast('better')}
            className={`p-4 md:p-5 rounded-2xl border-2 flex flex-col items-center gap-2
              transition-all active:scale-95
              ${comparedToLast === 'better'
                ? 'bg-green-100 border-green-500 ring-2 ring-green-200'
                : 'bg-white border-slate-200 hover:border-green-300'
              }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center
              ${comparedToLast === 'better' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'}`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm md:text-base font-medium text-slate-800">{t.better}</span>
          </button>

          <button
            onClick={() => setComparedToLast('same')}
            className={`p-4 md:p-5 rounded-2xl border-2 flex flex-col items-center gap-2
              transition-all active:scale-95
              ${comparedToLast === 'same'
                ? 'bg-yellow-100 border-yellow-500 ring-2 ring-yellow-200'
                : 'bg-white border-slate-200 hover:border-yellow-300'
              }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center
              ${comparedToLast === 'same' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-600'}`}>
              <Minus className="w-6 h-6" />
            </div>
            <span className="text-sm md:text-base font-medium text-slate-800">{t.same}</span>
          </button>

          <button
            onClick={() => setComparedToLast('worse')}
            className={`p-4 md:p-5 rounded-2xl border-2 flex flex-col items-center gap-2
              transition-all active:scale-95
              ${comparedToLast === 'worse'
                ? 'bg-red-100 border-red-500 ring-2 ring-red-200'
                : 'bg-white border-slate-200 hover:border-red-300'
              }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center
              ${comparedToLast === 'worse' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-sm md:text-base font-medium text-slate-800">{t.worse}</span>
          </button>
        </div>
      </div>

      {/* New symptoms question */}
      <div className="mb-6">
        <p className="text-lg font-medium text-slate-700 mb-4 text-center">
          {t.newSymptomsQuestion}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setNewSymptoms(false)}
            className={`p-5 rounded-2xl border-2 text-xl font-medium
              transition-all active:scale-95
              ${newSymptoms === false
                ? 'bg-green-100 border-green-500 ring-2 ring-green-200 text-green-800'
                : 'bg-white border-slate-200 text-slate-700 hover:border-green-300'
              }`}
          >
            {t.no}
          </button>

          <button
            onClick={() => setNewSymptoms(true)}
            className={`p-5 rounded-2xl border-2 text-xl font-medium
              transition-all active:scale-95
              ${newSymptoms === true
                ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-200 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
              }`}
          >
            {t.yes}
          </button>
        </div>

        {/* New symptoms text input */}
        {newSymptoms === true && (
          <textarea
            value={newSymptomsText}
            onChange={(e) => setNewSymptomsText(e.target.value)}
            placeholder={t.describePlaceholder}
            className="w-full mt-4 p-4 text-lg border-2 border-slate-200 rounded-2xl
                       focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                       outline-none transition-all resize-none"
            rows={3}
            autoFocus
          />
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={!canContinue}
        className="w-full py-5 bg-teal-600 text-white text-xl font-bold
                   rounded-2xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
      >
        {t.continueButton} ✓
      </button>
    </div>
  );
}
