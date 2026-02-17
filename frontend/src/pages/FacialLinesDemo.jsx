/**
 * FacialLinesDemo Page
 *
 * Demo page for the Facial Lines Chart with fascial lines,
 * trigger points, and nerve zones for facial treatment.
 */

import _React, { useState, useCallback } from 'react';
import { Globe, Copy, Info, User, Zap, Activity, Layers } from 'lucide-react';
import {
  FacialLinesChart,
  FASCIAL_LINES,
  FACIAL_MUSCLES,
  NERVE_ZONES,
} from '../components/examination';

export default function FacialLinesDemo() {
  const [lang, setLang] = useState('no');
  const [value, setValue] = useState({ markers: [], selectedPoints: [] });
  const [narrative, setNarrative] = useState('');
  const [showInfo, setShowInfo] = useState(true);

  const labels = {
    en: {
      title: 'Facial Lines Chart Demo',
      subtitle: 'Fascial lines and trigger points for facial treatment',
      features: 'Features',
      featureList: [
        'Toggle fascial lines overlay (10+ treatment lines)',
        'View facial muscle trigger points',
        'Trigeminal nerve distribution zones (V1, V2, V3)',
        'Click points to mark treatment areas',
        'Bilingual support (Norwegian/English)',
        'Generate clinical narratives',
      ],
      fascialLineGuide: 'Fascial Line Quick Reference',
      muscleGuide: 'Key Facial Muscles',
      nerveGuide: 'Trigeminal Nerve Zones',
      generatedNarrative: 'Generated Narrative',
      copyNarrative: 'Copy',
      commonConditions: 'Common Conditions',
      conditions: [
        { name: 'TMJ Dysfunction', muscles: ['Masseter', 'Temporalis', 'Medial Pterygoid'] },
        { name: 'Tension Headache', muscles: ['Frontalis', 'Temporalis', 'Corrugator'] },
        { name: 'Facial Pain/Neuralgia', muscles: ['Trigeminal zones', 'SCM upper'] },
      ],
    },
    no: {
      title: 'Ansiktslinjer Kart Demo',
      subtitle: 'Fascielinjer og triggerpunkter for ansiktsbehandling',
      features: 'Funksjoner',
      featureList: [
        'Slå på/av fascielinjer (10+ behandlingslinjer)',
        'Se ansiktsmuskel-triggerpunkter',
        'Trigeminus nervedistribusjon (V1, V2, V3)',
        'Klikk punkter for å markere behandlingsområder',
        'Tospråklig støtte (Norsk/Engelsk)',
        'Generer kliniske narrativer',
      ],
      fascialLineGuide: 'Fascielinje Hurtigreferanse',
      muscleGuide: 'Viktige Ansiktsmuskler',
      nerveGuide: 'Trigeminus Nervesoner',
      generatedNarrative: 'Generert Narrativ',
      copyNarrative: 'Kopier',
      commonConditions: 'Vanlige Tilstander',
      conditions: [
        { name: 'TMJ Dysfunksjon', muscles: ['Masseter', 'Temporalis', 'Medial Pterygoid'] },
        { name: 'Spenningshodepine', muscles: ['Frontalis', 'Temporalis', 'Corrugator'] },
        { name: 'Ansiktssmerte/Nevralgi', muscles: ['Trigeminus-soner', 'SCM øvre'] },
      ],
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

  // Key fascial lines for quick reference
  const keyLines = [
    'superficial_frontal',
    'temporal_masseteric',
    'nasolabial',
    'mandibular',
    'supraorbital',
  ];

  // Key muscles for quick reference
  const keyMuscles = [
    'temporalis',
    'masseter',
    'frontalis',
    'orbicularis_oculi',
    'pterygoid_medial',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
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
                    ? 'bg-rose-100 text-rose-700'
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
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Features */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-500" />
                {t.features}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {t.featureList.map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-rose-500">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fascial Line Reference */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                {t.fascialLineGuide}
              </h3>
              <div className="space-y-2">
                {keyLines.map((id) => {
                  const line = FASCIAL_LINES[id];
                  if (!line) {
                    return null;
                  }
                  return (
                    <div key={id} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded">
                      <span className="w-6 h-1 rounded" style={{ backgroundColor: line.color }} />
                      <span className="text-xs text-gray-700">
                        {line[lang]?.name || line.en?.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Muscle Reference */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                {t.muscleGuide}
              </h3>
              <div className="space-y-2">
                {keyMuscles.map((id) => {
                  const m = FACIAL_MUSCLES[id];
                  if (!m) {
                    return null;
                  }
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

            {/* Nerve Zones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                {t.nerveGuide}
              </h3>
              <div className="space-y-2">
                {Object.entries(NERVE_ZONES).map(([id, zone]) => (
                  <div key={id} className="p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: zone.color.replace('0.3', '0.6') }}
                      />
                      <span className="text-xs font-bold text-gray-700">
                        {zone[lang]?.name || zone.en?.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 ml-5">
                      {zone[lang]?.area || zone.en?.area}
                    </span>
                  </div>
                ))}
              </div>

              {/* Common Conditions */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {t.commonConditions}
                </h4>
                <div className="space-y-2">
                  {t.conditions.map((cond, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-gray-700">{cond.name}:</span>
                      <span className="text-gray-500 ml-1">{cond.muscles.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        <FacialLinesChart
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
