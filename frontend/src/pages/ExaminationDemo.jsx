/**
 * ExaminationDemo Page
 *
 * Demo page to test all examination components.
 */

import React, { useState } from 'react';
import {
  Activity,
  Brain,
  Zap,
  Target,
  FileText,
  Gauge,
  Move,
  Cable,
  HeadphonesIcon,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Globe,
  RotateCcw,
  ArrowUpDown,
  Ruler,
  User,
  Circle,
  Hand,
  Footprints
} from 'lucide-react';

// Import all examination components
import {
  ManualMuscleTesting,
  CranialNervePanel,
  SensoryExamination,
  PainAssessmentPanel,
  SOAPNoteTemplate,
  DeepTendonReflexPanel,
  CoordinationTestPanel,
  NerveTensionTests,
  HeadacheAssessment,
  TissueAbnormalityMarkers,
  BPPVTestPanel,
  DynamicPositionalTestPanel,
  ActivatorMethodPanel,
  BodyChartPanel,
  RegionalBodyDiagram,
  LowerExtremityDiagram,
  UpperExtremityDiagram,
  ROMTable,
  VisualROMSelector
} from '../components/examination';

// Wrapper component to show all regional diagrams - LARGER SIZE
function RegionalDiagramsDemo({ values = {}, onChange, lang = 'no' }) {
  const regions = ['shoulder', 'knee', 'ankle', 'wrist', 'elbow', 'cervical', 'lumbar', 'hip', 'head'];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        {lang === 'no'
          ? 'Klikk på diagrammene for å markere funn. Velg venstre eller høyre side.'
          : 'Click on diagrams to mark findings. Select left or right side.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {regions.map(region => (
          <div key={region} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <RegionalBodyDiagram
              region={region}
              side="bilateral"
              markers={values[`${region}_markers`] || []}
              onChange={(markers) => onChange({ ...values, [`${region}_markers`]: markers })}
              lang={lang}
              compact={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Wrapper for lower extremity diagram
function LowerExtremityDemo({ values = {}, onChange, lang = 'no' }) {
  // Parse angles to integers
  const slrLeft = values.slrAngleLeft ? parseInt(values.slrAngleLeft) : null;
  const slrRight = values.slrAngleRight ? parseInt(values.slrAngleRight) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {lang === 'no'
          ? 'Underekstremitet diagram med isjiasnerven og dermatomer (L4, L5, S1). Skriv inn SLR-vinkel for å se det på diagrammet.'
          : 'Lower extremity diagram with sciatic nerve and dermatomes (L4, L5, S1). Enter SLR angle to see it on the diagram.'}
      </p>

      {/* SLR Angle inputs - prominent at top */}
      <div className="flex gap-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-red-700">SLR {lang === 'no' ? 'Venstre' : 'Left'}:</label>
          <input
            type="number"
            min="0"
            max="90"
            value={values.slrAngleLeft || ''}
            onChange={(e) => onChange({ ...values, slrAngleLeft: e.target.value })}
            className="w-16 px-2 py-1 border border-red-300 rounded text-sm text-center"
            placeholder="°"
          />
          <span className="text-red-600">°</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-red-700">SLR {lang === 'no' ? 'Høyre' : 'Right'}:</label>
          <input
            type="number"
            min="0"
            max="90"
            value={values.slrAngleRight || ''}
            onChange={(e) => onChange({ ...values, slrAngleRight: e.target.value })}
            className="w-16 px-2 py-1 border border-red-300 rounded text-sm text-center"
            placeholder="°"
          />
          <span className="text-red-600">°</span>
        </div>
        {(slrLeft || slrRight) && (
          <div className="ml-4 text-sm text-red-700 font-semibold">
            SLR: {slrLeft ? `V ${slrLeft}°` : ''} {slrLeft && slrRight ? '|' : ''} {slrRight ? `H ${slrRight}°` : ''}
          </div>
        )}
      </div>

      <LowerExtremityDiagram
        markers={values.markers || []}
        onChange={(markers) => onChange({ ...values, markers })}
        slrAngleLeft={slrLeft}
        slrAngleRight={slrRight}
        lang={lang}
        showDermatomes={true}
        showNerves={true}
      />
    </div>
  );
}

// Wrapper for upper extremity diagram
function UpperExtremityDemo({ values = {}, onChange, lang = 'no' }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {lang === 'no'
          ? 'Overekstremitet diagram med median-, ulnar- og radialisnervene samt dermatomer (C5-T1).'
          : 'Upper extremity diagram with median, ulnar, and radial nerves with dermatomes (C5-T1).'}
      </p>
      <UpperExtremityDiagram
        markers={values.markers || []}
        onChange={(markers) => onChange({ ...values, markers })}
        lang={lang}
        showDermatomes={true}
        showNerves={true}
      />
    </div>
  );
}

// Component configuration
const DEMO_COMPONENTS = [
  {
    id: 'mmt',
    name: 'Manual Muscle Testing',
    nameNo: 'Manuell Muskeltesting',
    icon: Activity,
    color: 'bg-blue-500',
    component: ManualMuscleTesting
  },
  {
    id: 'cranial',
    name: 'Cranial Nerves',
    nameNo: 'Hjernenerver',
    icon: Brain,
    color: 'bg-purple-500',
    component: CranialNervePanel
  },
  {
    id: 'sensory',
    name: 'Sensory Examination',
    nameNo: 'Sensibilitetsundersøkelse',
    icon: Zap,
    color: 'bg-amber-500',
    component: SensoryExamination
  },
  {
    id: 'pain',
    name: 'Pain Assessment',
    nameNo: 'Smertevurdering',
    icon: Target,
    color: 'bg-red-500',
    component: PainAssessmentPanel
  },
  {
    id: 'soap',
    name: 'SOAP Note',
    nameNo: 'SOAP-notat',
    icon: FileText,
    color: 'bg-teal-500',
    component: SOAPNoteTemplate
  },
  {
    id: 'dtr',
    name: 'Deep Tendon Reflexes',
    nameNo: 'Dype Senereflekser',
    icon: Gauge,
    color: 'bg-green-500',
    component: DeepTendonReflexPanel
  },
  {
    id: 'coordination',
    name: 'Coordination Tests',
    nameNo: 'Koordinasjonstester',
    icon: Move,
    color: 'bg-indigo-500',
    component: CoordinationTestPanel
  },
  {
    id: 'nerve_tension',
    name: 'Nerve Tension Tests',
    nameNo: 'Nervestrekkstester',
    icon: Cable,
    color: 'bg-orange-500',
    component: NerveTensionTests
  },
  {
    id: 'headache',
    name: 'Headache Assessment',
    nameNo: 'Hodepineutredning',
    icon: HeadphonesIcon,
    color: 'bg-pink-500',
    component: HeadacheAssessment
  },
  {
    id: 'tissue',
    name: 'Tissue Abnormalities',
    nameNo: 'Vevsabnormaliteter',
    icon: Crosshair,
    color: 'bg-cyan-500',
    component: TissueAbnormalityMarkers
  },
  {
    id: 'bppv',
    name: 'BPPV Testing',
    nameNo: 'BPPV-testing',
    icon: RotateCcw,
    color: 'bg-violet-500',
    component: BPPVTestPanel
  },
  {
    id: 'dynamic_positional',
    name: 'Dynamic Positional Testing',
    nameNo: 'Dynamisk Posisjonstesting',
    icon: ArrowUpDown,
    color: 'bg-rose-500',
    component: DynamicPositionalTestPanel
  },
  {
    id: 'activator',
    name: 'Activator Method',
    nameNo: 'Activator-metoden',
    icon: Ruler,
    color: 'bg-emerald-500',
    component: ActivatorMethodPanel
  },
  {
    id: 'bodychart',
    name: 'Body Chart',
    nameNo: 'Kroppskart',
    icon: User,
    color: 'bg-sky-500',
    component: BodyChartPanel
  },
  {
    id: 'lower_extremity',
    name: 'Lower Extremity (Legs)',
    nameNo: 'Underekstremitet (Ben)',
    icon: Footprints,
    color: 'bg-blue-600',
    component: LowerExtremityDemo
  },
  {
    id: 'upper_extremity',
    name: 'Upper Extremity (Arms)',
    nameNo: 'Overekstremitet (Armer)',
    icon: Hand,
    color: 'bg-purple-600',
    component: UpperExtremityDemo
  },
  {
    id: 'regional_diagrams',
    name: 'Regional Diagrams (All Joints)',
    nameNo: 'Regionale Diagrammer (Alle Ledd)',
    icon: Circle,
    color: 'bg-amber-600',
    component: RegionalDiagramsDemo
  },
  {
    id: 'rom_table',
    name: 'ROM Table (Arc Sliders)',
    nameNo: 'ROM Tabell (Bue-Skyveknapper)',
    icon: Gauge,
    color: 'bg-lime-600',
    component: ROMTable
  },
  {
    id: 'visual_rom',
    name: 'Visual ROM Selector',
    nameNo: 'Visuell ROM Velger',
    icon: Target,
    color: 'bg-fuchsia-600',
    component: VisualROMSelector
  }
];

export default function ExaminationDemo() {
  const [activeComponent, setActiveComponent] = useState('mmt');
  const [lang, setLang] = useState('no');
  const [componentValues, setComponentValues] = useState({});
  const [generatedNarratives, setGeneratedNarratives] = useState({});

  const activeConfig = DEMO_COMPONENTS.find(c => c.id === activeComponent);
  const ActiveComponent = activeConfig?.component;

  const handleValueChange = (componentId, values) => {
    setComponentValues(prev => ({
      ...prev,
      [componentId]: values
    }));
  };

  const handleGenerateNarrative = (componentId, narrative) => {
    setGeneratedNarratives(prev => ({
      ...prev,
      [componentId]: narrative
    }));
  };

  const currentIndex = DEMO_COMPONENTS.findIndex(c => c.id === activeComponent);

  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : DEMO_COMPONENTS.length - 1;
    setActiveComponent(DEMO_COMPONENTS[prevIndex].id);
  };

  const goToNext = () => {
    const nextIndex = currentIndex < DEMO_COMPONENTS.length - 1 ? currentIndex + 1 : 0;
    setActiveComponent(DEMO_COMPONENTS[nextIndex].id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {lang === 'no' ? 'Undersøkelseskomponenter Demo' : 'Examination Components Demo'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'no'
                  ? 'Test alle 19 kliniske undersøkelseskomponenter inkludert ROM-skyveknapper'
                  : 'Test all 19 clinical examination components including ROM arc sliders'}
              </p>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-700">
                  {lang === 'no' ? 'Komponenter' : 'Components'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {currentIndex + 1} / {DEMO_COMPONENTS.length}
                </p>
              </div>

              <nav className="p-2">
                {DEMO_COMPONENTS.map((config, index) => {
                  const Icon = config.icon;
                  const isActive = activeComponent === config.id;
                  const hasData = componentValues[config.id] &&
                    Object.keys(componentValues[config.id]).length > 0;

                  return (
                    <button
                      key={config.id}
                      onClick={() => setActiveComponent(config.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                 text-left transition-colors mb-1
                                 ${isActive
                                   ? 'bg-teal-50 text-teal-700'
                                   : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                      ${isActive ? config.color : 'bg-gray-100'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium block truncate
                                        ${isActive ? 'text-teal-700' : 'text-gray-700'}`}>
                          {lang === 'no' ? config.nameNo : config.name}
                        </span>
                        {hasData && (
                          <span className="text-xs text-green-600">
                            {lang === 'no' ? 'Data registrert' : 'Data entered'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{index + 1}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Navigation buttons */}
              <div className="p-3 border-t border-gray-200 flex gap-2">
                <button
                  onClick={goToPrevious}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2
                            bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {lang === 'no' ? 'Forrige' : 'Prev'}
                </button>
                <button
                  onClick={goToNext}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2
                            bg-teal-600 hover:bg-teal-700 rounded-lg text-sm text-white"
                >
                  {lang === 'no' ? 'Neste' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Component Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Component Header */}
              <div className={`px-6 py-4 ${activeConfig?.color} bg-opacity-10 border-b border-gray-200`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeConfig?.color}`}>
                    {activeConfig && <activeConfig.icon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {lang === 'no' ? activeConfig?.nameNo : activeConfig?.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {lang === 'no' ? 'Komponent' : 'Component'} #{currentIndex + 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Component Content */}
              <div className="p-6">
                {ActiveComponent && (
                  <ActiveComponent
                    values={componentValues[activeComponent] || {}}
                    onChange={(values) => handleValueChange(activeComponent, values)}
                    lang={lang}
                    onGenerateNarrative={(narrative) => handleGenerateNarrative(activeComponent, narrative)}
                    showDetails={true}
                    showTechnique={true}
                    showFindings={true}
                  />
                )}
              </div>
            </div>

            {/* Generated Narrative */}
            {generatedNarratives[activeComponent] && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-green-50 border-b border-green-100">
                  <h3 className="font-semibold text-green-800">
                    {lang === 'no' ? 'Generert Narrativ' : 'Generated Narrative'}
                  </h3>
                </div>
                <div className="p-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-4 rounded-lg">
                    {generatedNarratives[activeComponent]}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedNarratives[activeComponent])}
                    className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg
                              text-sm text-gray-600 transition-colors"
                  >
                    {lang === 'no' ? 'Kopier til utklippstavle' : 'Copy to clipboard'}
                  </button>
                </div>
              </div>
            )}

            {/* Current State Debug (collapsible) */}
            <details className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <summary className="px-6 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100
                                 text-sm font-medium text-gray-600">
                {lang === 'no' ? 'Vis komponentdata (Debug)' : 'Show component data (Debug)'}
              </summary>
              <div className="p-6">
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-64">
                  {JSON.stringify(componentValues[activeComponent] || {}, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            {lang === 'no' ? 'Oversikt over alle komponenter' : 'All Components Overview'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {DEMO_COMPONENTS.map(config => {
              const Icon = config.icon;
              const hasData = componentValues[config.id] &&
                Object.keys(componentValues[config.id]).length > 0;
              const hasNarrative = !!generatedNarratives[config.id];

              return (
                <button
                  key={config.id}
                  onClick={() => setActiveComponent(config.id)}
                  className={`p-4 rounded-lg border-2 transition-colors text-center
                             ${activeComponent === config.id
                               ? 'border-teal-500 bg-teal-50'
                               : hasData
                                 ? 'border-green-300 bg-green-50'
                                 : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center
                                  justify-center ${config.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 block truncate">
                    {lang === 'no' ? config.nameNo : config.name}
                  </span>
                  <div className="flex justify-center gap-1 mt-2">
                    {hasData && (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Has data" />
                    )}
                    {hasNarrative && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" title="Has narrative" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {lang === 'no' ? 'Data registrert' : 'Data entered'}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {lang === 'no' ? 'Narrativ generert' : 'Narrative generated'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
