/**
 * ChiefComplaintCapture - Step 3: "What brings you in today?"
 *
 * Features:
 * - Common complaint categories as large tap buttons
 * - Free text option
 * - Multi-select support
 * - Generates narrative for SOAP
 */

import { useState } from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'What brings you in today?',
    subtitle: 'Select all that apply',
    customPlaceholder: 'Describe your concern...',
    continueButton: 'Continue',
    back: 'Back',
  },
  no: {
    title: 'Hva er grunnen til besøket?',
    subtitle: 'Velg alle som passer',
    customPlaceholder: 'Beskriv ditt problem...',
    continueButton: 'Fortsett',
    back: 'Tilbake',
  },
};

const COMMON_COMPLAINTS = {
  en: [
    {
      id: 'low_back',
      label: 'Lower back pain',
      icon: '🔻',
      description: 'Pain in the lower spine area',
    },
    {
      id: 'neck',
      label: 'Neck pain/stiffness',
      icon: '🔺',
      description: 'Neck discomfort or limited movement',
    },
    { id: 'headache', label: 'Headaches', icon: '🤕', description: 'Head pain or migraines' },
    {
      id: 'shoulder',
      label: 'Shoulder pain',
      icon: '💪',
      description: 'Shoulder or upper arm pain',
    },
    {
      id: 'sciatica',
      label: 'Leg pain/sciatica',
      icon: '🦵',
      description: 'Pain radiating down the leg',
    },
    {
      id: 'upper_back',
      label: 'Upper back pain',
      icon: '🔙',
      description: 'Pain between the shoulders',
    },
    {
      id: 'maintenance',
      label: 'Maintenance visit',
      icon: '✅',
      description: 'Regular wellness check',
    },
    {
      id: 'followup',
      label: 'Follow-up (same issue)',
      icon: '🔄',
      description: 'Continuing previous treatment',
    },
    { id: 'other', label: 'Other...', icon: '✏️', description: 'Something else' },
  ],
  no: [
    {
      id: 'low_back',
      label: 'Korsryggssmerter',
      icon: '🔻',
      description: 'Smerter i nedre del av ryggen',
    },
    {
      id: 'neck',
      label: 'Nakkesmerter/stivhet',
      icon: '🔺',
      description: 'Ubehag eller stivhet i nakken',
    },
    { id: 'headache', label: 'Hodepine', icon: '🤕', description: 'Hodepine eller migrene' },
    {
      id: 'shoulder',
      label: 'Skuldersmerter',
      icon: '💪',
      description: 'Smerter i skulder eller overarm',
    },
    {
      id: 'sciatica',
      label: 'Bensmerter/isjias',
      icon: '🦵',
      description: 'Smerter som stråler ned i benet',
    },
    {
      id: 'upper_back',
      label: 'Øvre ryggplager',
      icon: '🔙',
      description: 'Smerter mellom skulderbladene',
    },
    {
      id: 'maintenance',
      label: 'Vedlikeholdstime',
      icon: '✅',
      description: 'Regelmessig velvære-sjekk',
    },
    {
      id: 'followup',
      label: 'Oppfølging (samme problem)',
      icon: '🔄',
      description: 'Fortsetter tidligere behandling',
    },
    { id: 'other', label: 'Annet...', icon: '✏️', description: 'Noe annet' },
  ],
};

export default function ChiefComplaintCapture({ onNext, onBack, lang = 'no' }) {
  const t = TRANSLATIONS[lang];
  const complaints = COMMON_COMPLAINTS[lang];

  const [selected, setSelected] = useState([]);
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const toggle = (id) => {
    if (id === 'other') {
      setShowCustom(true);
      if (!selected.includes('other')) {
        setSelected((prev) => [...prev, 'other']);
      }
      return;
    }

    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleNext = () => {
    // Generate narrative from selections
    const selectedLabels = selected
      .filter((id) => id !== 'other')
      .map((id) => complaints.find((c) => c.id === id)?.label)
      .filter(Boolean);

    let narrative = '';
    if (selectedLabels.length > 0) {
      narrative =
        lang === 'no'
          ? `Pasient kommer inn for: ${selectedLabels.join(', ')}.`
          : `Patient presents for: ${selectedLabels.join(', ')}.`;
    }

    if (customText.trim()) {
      narrative += narrative ? '\n' : '';
      narrative +=
        lang === 'no'
          ? `Pasientens beskrivelse: "${customText.trim()}"`
          : `Patient description: "${customText.trim()}"`;
    }

    onNext({
      complaintCategories: selected.filter((id) => id !== 'other'),
      chiefComplaint: customText.trim(),
      narrative,
    });
  };

  const canContinue = selected.length > 0 || customText.trim();

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
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{t.title}</h1>
        <p className="text-lg text-slate-500">{t.subtitle}</p>
      </div>

      {/* Complaint buttons - 2 column grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 flex-1 overflow-y-auto">
        {complaints.map((c) => (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all
              active:scale-[0.98] transform
              ${
                selected.includes(c.id)
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <span className="text-base md:text-lg font-medium text-slate-800 block">
                  {c.label}
                </span>
                <span className="text-xs text-slate-500 hidden md:block">{c.description}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom text input */}
      {showCustom && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">
              {lang === 'no' ? 'Beskriv problemet' : 'Describe your concern'}
            </span>
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={t.customPlaceholder}
            className="w-full p-4 text-lg border-2 border-slate-200 rounded-2xl
                       focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                       outline-none transition-all resize-none"
            rows={3}
            autoFocus
          />
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={handleNext}
        disabled={!canContinue}
        className="w-full py-5 bg-teal-600 text-white text-xl font-bold
                   rounded-2xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
      >
        {t.continueButton} →
      </button>
    </div>
  );
}
