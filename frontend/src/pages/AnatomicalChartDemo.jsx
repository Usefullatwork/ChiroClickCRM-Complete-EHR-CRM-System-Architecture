/**
 * AnatomicalChartDemo Page
 *
 * Demo page for the Anatomical Body Chart with dermatomes,
 * muscles, and trigger points.
 */

import { useState, useCallback } from 'react';
import { Globe, Copy, Layers, Zap, Activity, Info } from 'lucide-react';
import { AnatomicalBodyChart, DERMATOMES, MUSCLES } from '../components/examination';

export default function AnatomicalChartDemo() {
  const [lang, setLang] = useState('no');
  const [value, setValue] = useState({ markers: [], selectedRegions: [] });
  const [narrative, setNarrative] = useState('');
  const [showInfo, setShowInfo] = useState(true);

  const labels = {
    en: {
      title: 'Anatomical Body Chart Demo',
      subtitle: 'Interactive anatomy with dermatomes, muscles, and trigger points',
      features: 'Features',
      featureList: [
        'Toggle dermatome overlay (C2-S5 nerve distributions)',
        'View trigger point locations for major muscle groups',
        'Click trigger points to mark symptoms with referral patterns',
        'Bilingual support (Norwegian/English)',
        'Generate clinical narratives',
      ],
      dermatomeGuide: 'Dermatome Quick Reference',
      muscleGuide: 'Trigger Point Quick Reference',
      generatedNarrative: 'Generated Narrative',
      copyNarrative: 'Copy',
    },
    no: {
      title: 'Anatomisk Kroppskart Demo',
      subtitle: 'Interaktiv anatomi med dermatomer, muskler og triggerpunkter',
      features: 'Funksjoner',
      featureList: [
        'Slå på/av dermatomoverlegg (C2-S5 nervedistribusjoner)',
        'Se triggerpunktlokasjoner for store muskelgrupper',
        'Klikk triggerpunkter for å markere symptomer med referansemønstre',
        'Tospråklig støtte (Norsk/Engelsk)',
        'Generer kliniske narrativer',
      ],
      dermatomeGuide: 'Dermatom Hurtigreferanse',
      muscleGuide: 'Triggerpunkt Hurtigreferanse',
      generatedNarrative: 'Generert Narrativ',
      copyNarrative: 'Kopier',
    },
  };

  const t = labels[lang];

  const handleValueChange = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  const handleGenerateNarrative = useCallback((generatedNarrative) => {
    setNarrative(generatedNarrative);
  }, []);

  const handleCopyNarrative = () => {
    if (narrative) {
      navigator.clipboard.writeText(narrative);
    }
  };

  // Key dermatomes for quick reference
  const keyDermatomes = ['C5', 'C6', 'C7', 'C8', 'T1', 'T4', 'T10', 'L4', 'L5', 'S1'];

  // Key muscles for quick reference
  const keyMuscles = [
    'upper_trapezius',
    'levator_scapulae',
    'infraspinatus',
    'quadratus_lumborum',
    'piriformis',
    'gluteus_medius',
    'gastrocnemius',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
                <p className="text-sm text-gray-500">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  showInfo
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Info className="w-4 h-4" />
                {showInfo ? 'Hide Info' : 'Show Info'}
              </button>

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
        {/* Info Panel */}
        {showInfo && (
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Features */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                {t.features}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {t.featureList.map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-indigo-500">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dermatome Reference */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                {t.dermatomeGuide}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {keyDermatomes.map((id) => {
                  const d = DERMATOMES[id];
                  return (
                    <div key={id} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: d.color }} />
                      <div>
                        <span className="text-xs font-bold text-gray-700">{id}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          {d[lang]?.area?.split(',')[0] || d.en?.area?.split(',')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Muscle Reference */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" />
                {t.muscleGuide}
              </h3>
              <div className="space-y-1.5">
                {keyMuscles.map((id) => {
                  const m = MUSCLES[id];
                  return (
                    <div key={id} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-xs font-medium text-gray-700">
                        {m[lang]?.name || m.en?.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        <AnatomicalBodyChart
          value={value}
          onChange={handleValueChange}
          onGenerateNarrative={handleGenerateNarrative}
          lang={lang}
        />

        {/* Generated Narrative */}
        {narrative && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <h3 className="font-semibold text-green-800">{t.generatedNarrative}</h3>
              <button
                onClick={handleCopyNarrative}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200
                          text-green-700 rounded-lg text-sm transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {t.copyNarrative}
              </button>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-4 rounded-lg">
                {narrative}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
