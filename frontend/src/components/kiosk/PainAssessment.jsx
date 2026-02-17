/**
 * PainAssessment - Step 4: Visual pain assessment
 *
 * Features:
 * - Interactive body diagram with tap regions
 * - Large VAS pain slider
 * - Pain duration selection
 * - Touch-optimized for kiosk
 */

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'Where does it hurt?',
    subtitle: 'Tap the areas where you feel pain',
    painLevel: 'Current pain level',
    noPain: 'No pain',
    worstPain: 'Worst possible',
    duration: 'How long have you had this pain?',
    continueButton: 'Continue',
    back: 'Back',
    skipButton: 'Skip this step',
  },
  no: {
    title: 'Hvor har du vondt?',
    subtitle: 'Trykk på områdene hvor du har smerter',
    painLevel: 'Smertenivå akkurat nå',
    noPain: 'Ingen smerte',
    worstPain: 'Verst tenkelig',
    duration: 'Hvor lenge har du hatt disse smertene?',
    continueButton: 'Fortsett',
    back: 'Tilbake',
    skipButton: 'Hopp over dette steget',
  },
};

const BODY_REGIONS = {
  en: [
    { id: 'head', label: 'Head', row: 0, col: 1 },
    { id: 'neck', label: 'Neck', row: 1, col: 1 },
    { id: 'shoulder_l', label: 'L. Shoulder', row: 2, col: 0 },
    { id: 'shoulder_r', label: 'R. Shoulder', row: 2, col: 2 },
    { id: 'upper_back', label: 'Upper Back', row: 2, col: 1 },
    { id: 'arm_l', label: 'L. Arm', row: 3, col: 0 },
    { id: 'arm_r', label: 'R. Arm', row: 3, col: 2 },
    { id: 'mid_back', label: 'Mid Back', row: 3, col: 1 },
    { id: 'lower_back', label: 'Lower Back', row: 4, col: 1 },
    { id: 'hip_l', label: 'L. Hip', row: 5, col: 0 },
    { id: 'hip_r', label: 'R. Hip', row: 5, col: 2 },
    { id: 'pelvis', label: 'Pelvis/Sacrum', row: 5, col: 1 },
    { id: 'leg_l', label: 'L. Leg', row: 6, col: 0 },
    { id: 'leg_r', label: 'R. Leg', row: 6, col: 2 },
  ],
  no: [
    { id: 'head', label: 'Hode', row: 0, col: 1 },
    { id: 'neck', label: 'Nakke', row: 1, col: 1 },
    { id: 'shoulder_l', label: 'V. Skulder', row: 2, col: 0 },
    { id: 'shoulder_r', label: 'H. Skulder', row: 2, col: 2 },
    { id: 'upper_back', label: 'Øvre rygg', row: 2, col: 1 },
    { id: 'arm_l', label: 'V. Arm', row: 3, col: 0 },
    { id: 'arm_r', label: 'H. Arm', row: 3, col: 2 },
    { id: 'mid_back', label: 'Midtre rygg', row: 3, col: 1 },
    { id: 'lower_back', label: 'Korsrygg', row: 4, col: 1 },
    { id: 'hip_l', label: 'V. Hofte', row: 5, col: 0 },
    { id: 'hip_r', label: 'H. Hofte', row: 5, col: 2 },
    { id: 'pelvis', label: 'Bekken/Korsben', row: 5, col: 1 },
    { id: 'leg_l', label: 'V. Ben', row: 6, col: 0 },
    { id: 'leg_r', label: 'H. Ben', row: 6, col: 2 },
  ],
};

const DURATION_OPTIONS = {
  en: [
    { id: 'today', label: 'Today' },
    { id: '2_3_days', label: '2-3 days' },
    { id: 'week', label: 'About a week' },
    { id: 'month', label: 'About a month' },
    { id: 'chronic', label: 'Months/years' },
  ],
  no: [
    { id: 'today', label: 'I dag' },
    { id: '2_3_days', label: '2-3 dager' },
    { id: 'week', label: 'Ca. en uke' },
    { id: 'month', label: 'Ca. en måned' },
    { id: 'chronic', label: 'Måneder/år' },
  ],
};

export default function PainAssessment({ onNext, onBack, lang = 'no' }) {
  const t = TRANSLATIONS[lang];
  const regions = BODY_REGIONS[lang];
  const durations = DURATION_OPTIONS[lang];

  const [painLocations, setPainLocations] = useState([]);
  const [painLevel, setPainLevel] = useState(5);
  const [painDuration, setPainDuration] = useState('');

  const toggleRegion = (id) => {
    setPainLocations((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleNext = () => {
    onNext({
      painLocations,
      painLevel,
      painDuration,
    });
  };

  // Get pain level color
  const getPainColor = (level) => {
    if (level <= 3) {
      return 'from-green-400 to-green-500';
    }
    if (level <= 6) {
      return 'from-yellow-400 to-orange-500';
    }
    return 'from-orange-500 to-red-600';
  };

  // Group regions by row for grid layout
  const maxRow = Math.max(...regions.map((r) => r.row));
  const rows = Array.from({ length: maxRow + 1 }, (_, i) => regions.filter((r) => r.row === i));

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
      <div className="text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{t.title}</h1>
        <p className="text-base text-slate-500">{t.subtitle}</p>
      </div>

      {/* Body map - Grid layout */}
      <div className="bg-slate-50 rounded-2xl p-4 mb-4">
        <div className="flex flex-col gap-2">
          {rows.map((rowRegions, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((col) => {
                const region = rowRegions.find((r) => r.col === col);
                if (!region) {
                  return <div key={col} className="h-12" />;
                }
                return (
                  <button
                    key={region.id}
                    onClick={() => toggleRegion(region.id)}
                    className={`h-12 rounded-xl border-2 text-sm font-medium
                      transition-all active:scale-95 transform
                      ${
                        painLocations.includes(region.id)
                          ? 'bg-red-500 border-red-600 text-white shadow-lg'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400'
                      }`}
                  >
                    {region.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* VAS Pain Scale */}
      <div className="mb-4">
        <h2 className="text-lg font-medium text-slate-700 mb-3 text-center">{t.painLevel}</h2>

        <div className="px-2">
          {/* Pain level display */}
          <div className="flex justify-center mb-3">
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${getPainColor(painLevel)}
                           flex items-center justify-center shadow-lg`}
            >
              <span className="text-4xl font-bold text-white">{painLevel}</span>
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer
                       bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
            style={{
              WebkitAppearance: 'none',
            }}
          />

          <div className="flex justify-between mt-2 text-sm text-slate-500">
            <span>0 - {t.noPain}</span>
            <span>10 - {t.worstPain}</span>
          </div>
        </div>
      </div>

      {/* Duration selection */}
      <div className="mb-4">
        <h2 className="text-lg font-medium text-slate-700 mb-3 text-center">{t.duration}</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {durations.map((d) => (
            <button
              key={d.id}
              onClick={() => setPainDuration(d.id)}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-medium
                transition-all active:scale-95
                ${
                  painDuration === d.id
                    ? 'bg-teal-500 border-teal-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400'
                }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={handleNext}
        className="w-full py-5 bg-teal-600 text-white text-xl font-bold
                   rounded-2xl hover:bg-teal-700 transition-colors
                   flex items-center justify-center gap-2 mt-auto"
      >
        {t.continueButton} →
      </button>
    </div>
  );
}
