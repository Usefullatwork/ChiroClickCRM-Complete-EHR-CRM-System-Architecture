/**
 * BodyChartDemo Page
 *
 * Standalone demo page for the Body Chart component.
 * Demonstrates interactive body diagrams for marking pain and symptoms.
 */

import _React, { useState, useCallback } from 'react';
import { Globe, Copy, Trash2, FileText, User, _Eye, Maximize2, Info } from 'lucide-react';
import { BodyChartPanel, QuickRegionButtons } from '../components/examination';

// Symptom type reference
const SYMPTOM_TYPES = [
  { id: 'pain', en: 'Pain', no: 'Smerte', color: '#EF4444' },
  { id: 'aching', en: 'Aching', no: 'Verkende', color: '#F97316' },
  { id: 'sharp', en: 'Sharp', no: 'Stikkende', color: '#DC2626' },
  { id: 'burning', en: 'Burning', no: 'Brennende', color: '#F59E0B' },
  { id: 'numbness', en: 'Numbness', no: 'Nummenhet', color: '#3B82F6' },
  { id: 'tingling', en: 'Tingling', no: 'Prikking', color: '#8B5CF6' },
  { id: 'weakness', en: 'Weakness', no: 'Svakhet', color: '#6B7280' },
  { id: 'stiffness', en: 'Stiffness', no: 'Stivhet', color: '#10B981' },
  { id: 'swelling', en: 'Swelling', no: 'Hevelse', color: '#EC4899' },
  { id: 'tenderness', en: 'Tenderness', no: 'Ømhet', color: '#F472B6' },
];

// Sample patient scenarios with correct marker format
// Markers need: id, regionId, view (front/back), symptom, intensity, description
const SAMPLE_SCENARIOS = {
  en: [
    {
      name: 'Low Back Pain with Radiculopathy',
      description: 'Classic L5 dermatomal pattern',
      markers: [
        {
          id: 1,
          regionId: 'lumbar',
          view: 'back',
          symptom: 'pain',
          intensity: 7,
          description: 'Central lower back pain',
        },
        {
          id: 2,
          regionId: 'l_thigh',
          view: 'front',
          symptom: 'aching',
          intensity: 5,
          description: 'Referred pain',
        },
        {
          id: 3,
          regionId: 'l_lower_leg',
          view: 'front',
          symptom: 'numbness',
          intensity: 4,
          description: 'L5 dermatomal numbness',
        },
        {
          id: 4,
          regionId: 'l_foot',
          view: 'front',
          symptom: 'tingling',
          intensity: 3,
          description: 'Foot paresthesia',
        },
      ],
    },
    {
      name: 'Cervicogenic Headache',
      description: 'Upper cervical dysfunction with referral',
      markers: [
        {
          id: 5,
          regionId: 'cervical',
          view: 'back',
          symptom: 'stiffness',
          intensity: 6,
          description: 'Upper cervical restriction',
        },
        {
          id: 6,
          regionId: 'head',
          view: 'front',
          symptom: 'pain',
          intensity: 5,
          description: 'Unilateral temporal headache',
        },
        {
          id: 7,
          regionId: 'r_shoulder',
          view: 'back',
          symptom: 'tenderness',
          intensity: 4,
          description: 'Upper trapezius trigger point',
        },
      ],
    },
    {
      name: 'Thoracic Outlet Syndrome',
      description: 'Brachial plexus compression pattern',
      markers: [
        {
          id: 8,
          regionId: 'neck',
          view: 'front',
          symptom: 'pain',
          intensity: 4,
          description: 'Scalene pain',
        },
        {
          id: 9,
          regionId: 'r_shoulder',
          view: 'front',
          symptom: 'aching',
          intensity: 5,
          description: 'Shoulder pain',
        },
        {
          id: 10,
          regionId: 'r_arm_upper',
          view: 'front',
          symptom: 'numbness',
          intensity: 6,
          description: 'Arm numbness',
        },
        {
          id: 11,
          regionId: 'r_hand',
          view: 'front',
          symptom: 'tingling',
          intensity: 7,
          description: 'Hand paresthesia',
        },
        {
          id: 12,
          regionId: 'r_forearm',
          view: 'front',
          symptom: 'weakness',
          intensity: 4,
          description: 'Grip weakness',
        },
      ],
    },
  ],
  no: [
    {
      name: 'Korsryggsmerte med Radikulopati',
      description: 'Klassisk L5 dermatomalt mønster',
      markers: [
        {
          id: 1,
          regionId: 'lumbar',
          view: 'back',
          symptom: 'pain',
          intensity: 7,
          description: 'Sentral korsryggsmerte',
        },
        {
          id: 2,
          regionId: 'l_thigh',
          view: 'front',
          symptom: 'aching',
          intensity: 5,
          description: 'Referert smerte',
        },
        {
          id: 3,
          regionId: 'l_lower_leg',
          view: 'front',
          symptom: 'numbness',
          intensity: 4,
          description: 'L5 dermatom nummenhet',
        },
        {
          id: 4,
          regionId: 'l_foot',
          view: 'front',
          symptom: 'tingling',
          intensity: 3,
          description: 'Fot parestesi',
        },
      ],
    },
    {
      name: 'Cervikogen Hodepine',
      description: 'Øvre cervikal dysfunksjon med referering',
      markers: [
        {
          id: 5,
          regionId: 'cervical',
          view: 'back',
          symptom: 'stiffness',
          intensity: 6,
          description: 'Øvre cervikal restriksjon',
        },
        {
          id: 6,
          regionId: 'head',
          view: 'front',
          symptom: 'pain',
          intensity: 5,
          description: 'Unilateral temporal hodepine',
        },
        {
          id: 7,
          regionId: 'r_shoulder',
          view: 'back',
          symptom: 'tenderness',
          intensity: 4,
          description: 'Øvre trapezius triggerpunkt',
        },
      ],
    },
    {
      name: 'Thoracic Outlet Syndrom',
      description: 'Brachial plexus kompresjon mønster',
      markers: [
        {
          id: 8,
          regionId: 'neck',
          view: 'front',
          symptom: 'pain',
          intensity: 4,
          description: 'Scalene smerte',
        },
        {
          id: 9,
          regionId: 'r_shoulder',
          view: 'front',
          symptom: 'aching',
          intensity: 5,
          description: 'Skuldersmerte',
        },
        {
          id: 10,
          regionId: 'r_arm_upper',
          view: 'front',
          symptom: 'numbness',
          intensity: 6,
          description: 'Arm nummenhet',
        },
        {
          id: 11,
          regionId: 'r_hand',
          view: 'front',
          symptom: 'tingling',
          intensity: 7,
          description: 'Hånd parestesi',
        },
        {
          id: 12,
          regionId: 'r_forearm',
          view: 'front',
          symptom: 'weakness',
          intensity: 4,
          description: 'Grep svakhet',
        },
      ],
    },
  ],
};

export default function BodyChartDemo() {
  const [lang, setLang] = useState('no');
  const [value, setValue] = useState({ markers: [], selectedRegions: [] });
  const [narrative, setNarrative] = useState('');
  const [showReference, setShowReference] = useState(false);

  const labels = {
    en: {
      title: 'Body Chart Demo',
      subtitle: 'Interactive body diagram for marking pain and symptoms',
      loadScenario: 'Load Scenario',
      clearAll: 'Clear All',
      generateNarrative: 'Generate Narrative',
      copyNarrative: 'Copy Narrative',
      reference: 'Symptom Type Reference',
      hideReference: 'Hide Reference',
      showReference: 'Show Reference',
      instructions: 'Instructions',
      instructionsList: [
        'Select a symptom type from the toolbar',
        'Click on body regions to add markers',
        'Adjust intensity using the slider',
        'Add descriptions for each marker',
        'Generate narrative for clinical notes',
      ],
      markersCount: 'markers',
      noMarkers: 'No markers added yet',
      generatedNarrative: 'Generated Narrative',
    },
    no: {
      title: 'Kroppskart Demo',
      subtitle: 'Interaktivt kroppsdiagram for markering av smerte og symptomer',
      loadScenario: 'Last Scenario',
      clearAll: 'Fjern Alle',
      generateNarrative: 'Generer Narrativ',
      copyNarrative: 'Kopier Narrativ',
      reference: 'Symptomtype Referanse',
      hideReference: 'Skjul Referanse',
      showReference: 'Vis Referanse',
      instructions: 'Instruksjoner',
      instructionsList: [
        'Velg en symptomtype fra verktøylinjen',
        'Klikk på kroppsregioner for å legge til markører',
        'Juster intensitet med glidebryteren',
        'Legg til beskrivelser for hver markør',
        'Generer narrativ for kliniske notater',
      ],
      markersCount: 'markører',
      noMarkers: 'Ingen markører lagt til ennå',
      generatedNarrative: 'Generert Narrativ',
    },
  };

  const t = labels[lang];
  const scenarios = SAMPLE_SCENARIOS[lang];

  const handleValueChange = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  const handleGenerateNarrative = useCallback((generatedNarrative) => {
    setNarrative(generatedNarrative);
  }, []);

  const handleLoadScenario = (scenario) => {
    setValue({ markers: scenario.markers, selectedRegions: [] });
  };

  const handleClearAll = () => {
    setValue({ markers: [], selectedRegions: [] });
    setNarrative('');
  };

  const handleCopyNarrative = () => {
    if (narrative) {
      navigator.clipboard.writeText(narrative);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
                <p className="text-sm text-gray-500">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Reference Toggle */}
              <button
                onClick={() => setShowReference(!showReference)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200
                          rounded-lg transition-colors text-sm"
              >
                <Info className="w-4 h-4" />
                {showReference ? t.hideReference : t.showReference}
              </button>

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
          {/* Left Column - Controls */}
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                {t.instructions}
              </h3>
              <ol className="space-y-2 text-sm text-gray-600">
                {t.instructionsList.map((instruction, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="w-5 h-5 bg-sky-100 text-sky-600 rounded-full flex items-center
                                    justify-center text-xs font-medium flex-shrink-0"
                    >
                      {i + 1}
                    </span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            {/* Sample Scenarios */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{t.loadScenario}</h3>
              <div className="space-y-2">
                {scenarios.map((scenario, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadScenario(scenario)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-sky-50 rounded-lg
                              border border-gray-200 hover:border-sky-300 transition-colors"
                  >
                    <span className="font-medium text-gray-800 block">{scenario.name}</span>
                    <span className="text-xs text-gray-500">{scenario.description}</span>
                    <span className="text-xs text-sky-600 mt-1 block">
                      {scenario.markers.length} {t.markersCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="space-y-2">
                <button
                  onClick={handleClearAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2
                            bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.clearAll}
                </button>
              </div>
            </div>

            {/* Symptom Reference */}
            {showReference && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">{t.reference}</h3>
                <div className="space-y-2">
                  {SYMPTOM_TYPES.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm text-gray-700">
                        {lang === 'no' ? type.no : type.en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Body Chart */}
          <div className="lg:col-span-2">
            <BodyChartPanel
              value={value}
              onChange={handleValueChange}
              onGenerateNarrative={handleGenerateNarrative}
              lang={lang}
              className="mb-4"
            />

            {/* Generated Narrative */}
            {narrative && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

        {/* Quick Region Buttons Demo */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-sky-500" />
            {lang === 'no' ? 'Hurtigknapper for Regioner' : 'Quick Region Buttons'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {lang === 'no'
              ? 'Klikk på en knapp for å raskt legge til en markør i den regionen.'
              : 'Click a button to quickly add a marker in that region.'}
          </p>
          <QuickRegionButtons
            value={value}
            onChange={handleValueChange}
            symptom="pain"
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
}
