/**
 * SALT Demo Page
 *
 * Demonstrates the Same As Last Treatment functionality with mock data.
 */

import _React, { useState } from 'react';
import { Globe, FileText, Copy, Clock, _User, Calendar, RotateCcw } from 'lucide-react';
import SALTButton, { SALTButtonCompact, SALTQuickBar } from '../components/assessment/SALTButton';

// Mock previous encounters
const MOCK_ENCOUNTERS = [
  {
    id: 'enc-001',
    encounter_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    subjective: {
      chief_complaint:
        'Patient presents with lower back pain radiating to the left leg. Pain rated 6/10. Onset was gradual, approximately 2 weeks ago. Pain is worse with prolonged sitting and bending forward.',
      history: 'No previous episodes. Works at desk job 8 hours/day.',
    },
    objective: {
      observation: 'Antalgic gait noted. Forward head posture. Decreased lumbar lordosis.',
      palpation:
        'Tenderness at L4-L5 and L5-S1 segments. Paravertebral muscle spasm noted bilaterally.',
    },
    pain_locations: ['lower_back', 'left_leg'],
    pain_qualities: ['aching', 'radiating'],
    aggravating_factors_selected: ['sitting', 'bending'],
    relieving_factors_selected: ['lying_down', 'walking'],
    observation_findings: ['antalgic_gait', 'forward_head_posture'],
    palpation_findings: ['tenderness_l4l5', 'muscle_spasm'],
    rom_findings: ['decreased_lumbar_flexion', 'decreased_lumbar_extension'],
    ortho_tests_selected: ['slr_positive_left', 'kemp_positive_left'],
    neuro_tests_selected: ['dtr_normal', 'sensation_intact'],
    spinal_findings: {
      L4: { restriction: 'PR', tenderness: true },
      L5: { restriction: 'PL', tenderness: true },
      S1: { restriction: 'AS', tenderness: false },
    },
    treatments_selected: ['lumbar_adjustment', 'flexion_distraction', 'muscle_stim'],
    exercises_selected: ['cat_camel', 'bird_dog', 'prone_press_up'],
    icpc_codes: ['L86'],
    icd10_codes: ['M54.5', 'M54.41'],
    plan: {
      treatment:
        'Diversified lumbar adjustment L4-L5, L5-S1. Flexion-distraction 10 minutes. Muscle stimulation 15 minutes.',
      exercises: 'Cat-camel, bird-dog, and prone press-ups. 2 sets of 10 reps, 2x daily.',
    },
  },
  {
    id: 'enc-002',
    encounter_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    subjective: {
      chief_complaint:
        'Initial evaluation for lower back pain. Pain rated 7/10. Difficulty with daily activities.',
      history: 'First episode. Sedentary lifestyle.',
    },
    objective: {
      observation: 'Guarded movements. Limited trunk rotation.',
      palpation: 'Significant muscle spasm at lumbar spine.',
    },
    pain_locations: ['lower_back'],
    pain_qualities: ['aching', 'sharp'],
    spinal_findings: {
      L4: { restriction: 'PR', tenderness: true },
      L5: { restriction: 'PL', tenderness: true },
    },
    treatments_selected: ['lumbar_adjustment', 'ice_therapy'],
    icpc_codes: ['L86'],
    icd10_codes: ['M54.5'],
    plan: {
      treatment: 'Gentle lumbar mobilization. Ice therapy 15 minutes.',
    },
  },
  {
    id: 'enc-003',
    encounter_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
    subjective: {
      chief_complaint: 'Neck pain with headaches. Pain rated 5/10.',
      history: 'Chronic condition, exacerbated by computer work.',
    },
    objective: {
      observation: 'Forward head posture. Elevated right shoulder.',
      palpation: 'Upper trapezius tightness bilateral.',
    },
    pain_locations: ['neck', 'head'],
    spinal_findings: {
      C5: { restriction: 'PR', tenderness: true },
      C6: { restriction: 'PL', tenderness: false },
    },
    treatments_selected: ['cervical_adjustment', 'massage'],
    icpc_codes: ['L83'],
    icd10_codes: ['M54.2'],
  },
];

export default function SALTDemo() {
  const [lang, setLang] = useState('no');
  const [currentNote, setCurrentNote] = useState({
    subjective: { chief_complaint: '' },
    objective: { observation: '' },
    spinal_findings: {},
    treatments_selected: [],
    icpc_codes: [],
    icd10_codes: [],
  });
  const [appliedCount, setAppliedCount] = useState(0);

  const handleApply = (clonedData) => {
    setCurrentNote((prev) => ({
      ...prev,
      ...clonedData,
    }));
    setAppliedCount((prev) => prev + 1);
  };

  const handleReset = () => {
    setCurrentNote({
      subjective: { chief_complaint: '' },
      objective: { observation: '' },
      spinal_findings: {},
      treatments_selected: [],
      icpc_codes: [],
      icd10_codes: [],
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Copy className="w-6 h-6 text-amber-500" />
                {lang === 'no' ? 'SALT Demo' : 'SALT Demo'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'no'
                  ? 'Samme Som Forrige Behandling - Effektiv kloning av konsultasjoner'
                  : 'Same As Last Treatment - Efficient encounter cloning'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                <Copy className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  {appliedCount} {lang === 'no' ? 'kloninger' : 'clones'}
                </span>
              </div>

              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200
                          rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{lang === 'no' ? 'Norsk' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Previous Encounters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {lang === 'no' ? 'Tidligere Konsultasjoner' : 'Previous Encounters'}
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {MOCK_ENCOUNTERS.map((enc, idx) => (
                  <div key={enc.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Calendar className="w-4 h-4" />
                        {formatDate(enc.encounter_date)}
                      </span>
                      {idx === 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {lang === 'no' ? 'Siste' : 'Latest'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {enc.subjective?.chief_complaint}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {enc.treatments_selected?.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
                        >
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SALT Controls & Current Note */}
          <div className="lg:col-span-2 space-y-6">
            {/* SALT Button Variants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                <h2 className="font-semibold text-amber-800">
                  {lang === 'no' ? 'SALT Varianter' : 'SALT Variants'}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Main SALT Button */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {lang === 'no'
                      ? 'Full SALT-knapp med alternativer'
                      : 'Full SALT Button with options'}
                  </label>
                  <SALTButton
                    previousEncounter={MOCK_ENCOUNTERS[0]}
                    previousEncounters={MOCK_ENCOUNTERS}
                    onApply={handleApply}
                    lang={lang}
                  />
                </div>

                {/* Compact SALT Button */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {lang === 'no' ? 'Kompakt verktøylinje-versjon' : 'Compact toolbar version'}
                  </label>
                  <SALTButtonCompact
                    previousEncounter={MOCK_ENCOUNTERS[0]}
                    onApply={handleApply}
                    lang={lang}
                  />
                </div>

                {/* Quick Bar */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {lang === 'no'
                      ? 'Hurtig SALT-linje med forhåndsinnstilte modifikatorer'
                      : 'Quick SALT bar with preset modifiers'}
                  </label>
                  <SALTQuickBar
                    previousEncounter={MOCK_ENCOUNTERS[0]}
                    onApply={handleApply}
                    lang={lang}
                  />
                </div>
              </div>
            </div>

            {/* Current Note Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {lang === 'no' ? 'Gjeldende Notat' : 'Current Note'}
                </h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === 'no' ? 'Nullstill' : 'Reset'}
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Subjective */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    S - {lang === 'no' ? 'Subjektivt' : 'Subjective'}
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg min-h-[80px]">
                    {currentNote.subjective?.chief_complaint ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {currentNote.subjective.chief_complaint}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {lang === 'no'
                          ? 'Ingen data - bruk SALT for å klone'
                          : 'No data - use SALT to clone'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Objective */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    O - {lang === 'no' ? 'Objektivt' : 'Objective'}
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg min-h-[60px]">
                    {currentNote.objective?.observation ? (
                      <p className="text-sm text-gray-700">{currentNote.objective.observation}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {lang === 'no' ? 'Ingen data' : 'No data'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Spinal Findings */}
                {Object.keys(currentNote.spinal_findings || {}).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      {lang === 'no' ? 'Spinalfunn' : 'Spinal Findings'}
                    </h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(currentNote.spinal_findings).map(([segment, findings]) => (
                          <span
                            key={segment}
                            className={`px-2 py-1 text-xs rounded-lg ${
                              findings.tenderness
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {segment}: {findings.restriction}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Treatments */}
                {currentNote.treatments_selected?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      {lang === 'no' ? 'Behandlinger' : 'Treatments'}
                    </h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {currentNote.treatments_selected.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg"
                          >
                            {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Diagnoses */}
                {(currentNote.icpc_codes?.length > 0 || currentNote.icd10_codes?.length > 0) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      {lang === 'no' ? 'Diagnoser' : 'Diagnoses'}
                    </h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {currentNote.icpc_codes?.map((code, i) => (
                          <span
                            key={`icpc-${i}`}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg"
                          >
                            ICPC: {code}
                          </span>
                        ))}
                        {currentNote.icd10_codes?.map((code, i) => (
                          <span
                            key={`icd-${i}`}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg"
                          >
                            ICD-10: {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                {lang === 'no' ? 'Slik bruker du SALT' : 'How to use SALT'}
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  {lang === 'no'
                    ? '• Klikk SALT-knappen for å åpne kloningsalternativer'
                    : '• Click the SALT button to open cloning options'}
                </li>
                <li>
                  {lang === 'no'
                    ? '• Velg pasientstatus (bedre, uendret, verre)'
                    : '• Select patient status (better, unchanged, worse)'}
                </li>
                <li>
                  {lang === 'no'
                    ? '• Velg hvilke seksjoner som skal klones'
                    : '• Choose which sections to clone'}
                </li>
                <li>
                  {lang === 'no'
                    ? '• Klikk "Bruk SALT" for å fylle ut felter'
                    : '• Click "Apply SALT" to populate fields'}
                </li>
                <li>
                  {lang === 'no'
                    ? '• Rediger det klonede innholdet etter behov'
                    : '• Edit the cloned content as needed'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
