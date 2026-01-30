/**
 * VNGModule - Video Nystagmography Assessment Component
 *
 * Comprehensive vestibular testing interface based on clinical VNG protocols.
 * Supports bilingual documentation (English/Norwegian).
 *
 * Tests included:
 * - Spontaneous Nystagmus
 * - Gaze Testing (Light/Dark)
 * - Positional Testing
 * - Smooth Pursuit
 * - Saccades (Pro/Anti)
 * - Optokinetic Response (OPK)
 * - Cerebellar Assessment
 * - Balance Tests (Romberg, etc.)
 */

import React, { useState, useCallback } from 'react';
import { t } from './translations';
import {
  Eye, Activity, Target, Brain, ArrowUpDown, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp,
  FileText, Printer, Copy, Save
} from 'lucide-react';

// Result options for tests
const RESULT_OPTIONS = {
  normal: { value: 'normal', icon: CheckCircle2, color: 'text-green-600' },
  abnormal: { value: 'abnormal', icon: XCircle, color: 'text-red-600' },
  notTested: { value: 'not_tested', icon: AlertCircle, color: 'text-gray-400' }
};

// Default VNG data structure
const getDefaultVNGData = () => ({
  // Spontaneous Nystagmus
  spontaneousNystagmus: {
    present: false,
    direction: '',
    notes: ''
  },

  // Gaze Tests
  gazeLight: {
    center: 'normal',
    left: 'normal',
    right: 'normal',
    up: 'normal',
    down: 'normal',
    notes: ''
  },
  gazeDark: {
    center: 'normal',
    left: 'normal',
    right: 'normal',
    up: 'normal',
    down: 'normal',
    notes: ''
  },

  // Positional Testing
  positional: {
    headRight: 'normal',
    headLeft: 'normal',
    bow: 'normal',
    lean: 'normal',
    notes: ''
  },

  // Smooth Pursuit
  smoothPursuit: {
    horizontal: 'normal',
    vertical: 'normal',
    notes: ''
  },

  // Saccades
  saccades: {
    prosaccade: {
      latency: '',
      velocity: '',
      accuracy: '',
      result: 'normal'
    },
    antisaccade: {
      latency: '',
      velocity: '',
      accuracy: '',
      result: 'normal'
    },
    notes: ''
  },

  // OPK
  opk: {
    left10: 'normal',
    right10: 'normal',
    left20: 'normal',
    right20: 'normal',
    up10: 'normal',
    down10: 'normal',
    up20: 'normal',
    down20: 'normal',
    notes: ''
  },

  // Cerebellar Assessment
  cerebellar: {
    romberg7Step: 'normal',
    oneLegStanding: 'normal',
    fingerToNose: 'normal',
    fingerToFinger: 'normal',
    rapidSupination: 'normal',
    fingerTapping: 'normal',
    dualTasking: 'normal',
    notes: ''
  },

  // VOR/HIT
  vor: {
    vorTest: 'normal',
    hipTest: 'normal',
    headShakeNystagmus: 'normal',
    notes: ''
  },

  // Eye Tests
  eyeTests: {
    convergence: 'normal',
    pupilSize: 'normal',
    lightReflex: 'normal',
    gazeHold: 'normal',
    notes: ''
  },

  // Vitals
  vitals: {
    bloodPressureLeft: '',
    bloodPressureRight: '',
    pulseLeft: '',
    pulseRight: '',
    capillaryRefill: 'normal'
  },

  // BPPV Assessment
  bppv: {
    dixHallpikeRight: 'normal',
    dixHallpikeLeft: 'normal',
    affectedCanal: '',
    type: '', // canalithiasis or cupulolithiasis
    notes: ''
  },

  // Summary
  interpretation: '',
  recommendations: ''
});

// Result Button Component
function ResultButton({ value, currentValue, onChange, language }) {
  const option = RESULT_OPTIONS[value];
  const Icon = option.icon;
  const isSelected = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
        transition-colors duration-150
        ${isSelected
          ? `${option.color} bg-gray-100 ring-1 ring-current`
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {t('vng', value, language)}
    </button>
  );
}

// Test Row Component
function TestRow({ label, testKey, value, onChange, language }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        <ResultButton
          value="normal"
          currentValue={value}
          onChange={(v) => onChange(testKey, v)}
          language={language}
        />
        <ResultButton
          value="abnormal"
          currentValue={value}
          onChange={(v) => onChange(testKey, v)}
          language={language}
        />
      </div>
    </div>
  );
}

// Collapsible Section Component
function Section({ title, icon: Icon, children, defaultOpen = true, language }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// Main VNG Module Component
export default function VNGModule({
  language = 'en',
  initialData = null,
  onSave,
  onGenerateReport,
  patientName = '',
  examDate = new Date().toISOString().split('T')[0]
}) {
  const [data, setData] = useState(initialData || getDefaultVNGData());
  const [activeTab, setActiveTab] = useState('assessment');

  // Update nested data
  const updateSection = useCallback((section, key, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  }, []);

  // Update saccade data
  const updateSaccade = useCallback((type, key, value) => {
    setData(prev => ({
      ...prev,
      saccades: {
        ...prev.saccades,
        [type]: {
          ...prev.saccades[type],
          [key]: value
        }
      }
    }));
  }, []);

  // Generate narrative report
  const generateNarrative = useCallback(() => {
    const sections = [];

    // Gaze testing narrative
    const gazeAbnormal = Object.entries(data.gazeLight)
      .filter(([k, v]) => k !== 'notes' && v === 'abnormal')
      .map(([k]) => t('vng', k, language));

    if (gazeAbnormal.length > 0) {
      sections.push(language === 'no'
        ? `Blikktest viser avvik i: ${gazeAbnormal.join(', ')}.`
        : `Gaze testing shows abnormality in: ${gazeAbnormal.join(', ')}.`
      );
    } else {
      sections.push(language === 'no'
        ? 'Blikktest er normal i alle retninger.'
        : 'Gaze testing is normal in all directions.'
      );
    }

    // Cerebellar assessment narrative
    const cerebellarAbnormal = Object.entries(data.cerebellar)
      .filter(([k, v]) => k !== 'notes' && v === 'abnormal')
      .map(([k]) => t('vng', k, language));

    if (cerebellarAbnormal.length > 0) {
      sections.push(language === 'no'
        ? `Cerebellum-vurdering viser avvik i: ${cerebellarAbnormal.join(', ')}.`
        : `Cerebellar assessment shows abnormality in: ${cerebellarAbnormal.join(', ')}.`
      );
    } else {
      sections.push(language === 'no'
        ? 'Cerebellum-vurdering er normal.'
        : 'Cerebellar assessment is normal.'
      );
    }

    // VOR narrative
    if (data.vor.vorTest === 'abnormal' || data.vor.hipTest === 'abnormal') {
      sections.push(language === 'no'
        ? 'VOR/Hodeimpulstest viser avvik.'
        : 'VOR/Head impulse testing shows abnormality.'
      );
    }

    // BPPV narrative
    if (data.bppv.dixHallpikeRight === 'abnormal' || data.bppv.dixHallpikeLeft === 'abnormal') {
      const side = data.bppv.dixHallpikeRight === 'abnormal'
        ? (language === 'no' ? 'høyre' : 'right')
        : (language === 'no' ? 'venstre' : 'left');
      sections.push(language === 'no'
        ? `Dix-Hallpike positiv på ${side} side. ${data.bppv.affectedCanal ? `Påvirket buegang: ${data.bppv.affectedCanal}.` : ''}`
        : `Dix-Hallpike positive on ${side} side. ${data.bppv.affectedCanal ? `Affected canal: ${data.bppv.affectedCanal}.` : ''}`
      );
    }

    return sections.join('\n\n');
  }, [data, language]);

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    const narrative = generateNarrative();
    navigator.clipboard.writeText(narrative);
  }, [generateNarrative]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(data);
    }
  }, [data, onSave]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-7 h-7 text-blue-600" />
              {t('vng', 'title', language)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('vng', 'subtitle', language)}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            {patientName && <div className="font-medium">{patientName}</div>}
            <div>{examDate}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'assessment'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('vng', 'protocol', language)}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'report'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('vng', 'results', language)}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'assessment' ? (
          <>
            {/* Spontaneous Nystagmus */}
            <Section
              title={t('vng', 'spontaneousNystagmus', language)}
              icon={Eye}
              language={language}
            >
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.spontaneousNystagmus.present}
                    onChange={(e) => updateSection('spontaneousNystagmus', 'present', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{t('vng', 'nystagmusPresent', language)}</span>
                </label>
              </div>
              {data.spontaneousNystagmus.present && (
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    {language === 'no' ? 'Retning/Karakteristikk' : 'Direction/Characteristics'}
                  </label>
                  <select
                    value={data.spontaneousNystagmus.direction}
                    onChange={(e) => updateSection('spontaneousNystagmus', 'direction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
                    <option value="upBeating">{t('vng', 'upBeating', language)}</option>
                    <option value="downBeating">{t('vng', 'downBeating', language)}</option>
                    <option value="rightBeating">{t('vng', 'rightBeating', language)}</option>
                    <option value="leftBeating">{t('vng', 'leftBeating', language)}</option>
                    <option value="torsional">{t('vng', 'torsional', language)}</option>
                  </select>
                </div>
              )}
            </Section>

            {/* Gaze Testing - Light */}
            <Section
              title={t('vng', 'gazeLight', language)}
              icon={Eye}
              language={language}
            >
              <TestRow
                label={t('vng', 'center', language)}
                testKey="center"
                value={data.gazeLight.center}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'left', language)}
                testKey="left"
                value={data.gazeLight.left}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'right', language)}
                testKey="right"
                value={data.gazeLight.right}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'up', language)}
                testKey="up"
                value={data.gazeLight.up}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'down', language)}
                testKey="down"
                value={data.gazeLight.down}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
                language={language}
              />
            </Section>

            {/* Gaze Testing - Dark */}
            <Section
              title={t('vng', 'gazeDark', language)}
              icon={Eye}
              defaultOpen={false}
              language={language}
            >
              <TestRow
                label={t('vng', 'center', language)}
                testKey="center"
                value={data.gazeDark.center}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'left', language)}
                testKey="left"
                value={data.gazeDark.left}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'right', language)}
                testKey="right"
                value={data.gazeDark.right}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'up', language)}
                testKey="up"
                value={data.gazeDark.up}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'down', language)}
                testKey="down"
                value={data.gazeDark.down}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
                language={language}
              />
            </Section>

            {/* Positional Testing */}
            <Section
              title={t('vng', 'positionalTest', language)}
              icon={RotateCcw}
              language={language}
            >
              <TestRow
                label={t('vng', 'headRight', language)}
                testKey="headRight"
                value={data.positional.headRight}
                onChange={(k, v) => updateSection('positional', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'headLeft', language)}
                testKey="headLeft"
                value={data.positional.headLeft}
                onChange={(k, v) => updateSection('positional', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'bow', language)}
                testKey="bow"
                value={data.positional.bow}
                onChange={(k, v) => updateSection('positional', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'lean', language)}
                testKey="lean"
                value={data.positional.lean}
                onChange={(k, v) => updateSection('positional', k, v)}
                language={language}
              />
            </Section>

            {/* Smooth Pursuit */}
            <Section
              title={t('vng', 'smoothPursuit', language)}
              icon={ArrowUpDown}
              defaultOpen={false}
              language={language}
            >
              <TestRow
                label={language === 'no' ? 'Horisontal' : 'Horizontal'}
                testKey="horizontal"
                value={data.smoothPursuit.horizontal}
                onChange={(k, v) => updateSection('smoothPursuit', k, v)}
                language={language}
              />
              <TestRow
                label={language === 'no' ? 'Vertikal' : 'Vertical'}
                testKey="vertical"
                value={data.smoothPursuit.vertical}
                onChange={(k, v) => updateSection('smoothPursuit', k, v)}
                language={language}
              />
            </Section>

            {/* Saccades */}
            <Section
              title={t('vng', 'saccades', language)}
              icon={Target}
              defaultOpen={false}
              language={language}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Prosaccade */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    {t('vng', 'prosaccade', language)}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">{t('vng', 'latency', language)} ({t('vng', 'ms', language)})</label>
                      <input
                        type="number"
                        value={data.saccades.prosaccade.latency}
                        onChange={(e) => updateSaccade('prosaccade', 'latency', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="ms"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('vng', 'velocity', language)} ({t('vng', 'degPerSec', language)})</label>
                      <input
                        type="number"
                        value={data.saccades.prosaccade.velocity}
                        onChange={(e) => updateSaccade('prosaccade', 'velocity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="°/s"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('vng', 'accuracy', language)} ({t('vng', 'percent', language)})</label>
                      <input
                        type="number"
                        value={data.saccades.prosaccade.accuracy}
                        onChange={(e) => updateSaccade('prosaccade', 'accuracy', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="%"
                      />
                    </div>
                  </div>
                </div>

                {/* Antisaccade */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    {t('vng', 'antisaccade', language)}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">{t('vng', 'latency', language)} ({t('vng', 'ms', language)})</label>
                      <input
                        type="number"
                        value={data.saccades.antisaccade.latency}
                        onChange={(e) => updateSaccade('antisaccade', 'latency', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="ms"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('vng', 'velocity', language)} ({t('vng', 'degPerSec', language)})</label>
                      <input
                        type="number"
                        value={data.saccades.antisaccade.velocity}
                        onChange={(e) => updateSaccade('antisaccade', 'velocity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="°/s"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('vng', 'accuracy', language)} ({t('vng', 'percent', language)})</label>
                      <input
                        type="number"
                        value={data.saccades.antisaccade.accuracy}
                        onChange={(e) => updateSaccade('antisaccade', 'accuracy', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="%"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Cerebellar Assessment */}
            <Section
              title={t('vng', 'cerebellumAssessment', language)}
              icon={Brain}
              language={language}
            >
              <TestRow
                label={t('vng', 'romberg7Step', language)}
                testKey="romberg7Step"
                value={data.cerebellar.romberg7Step}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'oneLegStanding', language)}
                testKey="oneLegStanding"
                value={data.cerebellar.oneLegStanding}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'fingerToNose', language)}
                testKey="fingerToNose"
                value={data.cerebellar.fingerToNose}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'fingerToFinger', language)}
                testKey="fingerToFinger"
                value={data.cerebellar.fingerToFinger}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'rapidSupination', language)}
                testKey="rapidSupination"
                value={data.cerebellar.rapidSupination}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'fingerTapping', language)}
                testKey="fingerTapping"
                value={data.cerebellar.fingerTapping}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'dualTasking', language)}
                testKey="dualTasking"
                value={data.cerebellar.dualTasking}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
                language={language}
              />
            </Section>

            {/* VOR / HIT */}
            <Section
              title={t('vng', 'vor', language)}
              icon={Activity}
              language={language}
            >
              <TestRow
                label={t('vng', 'vorTest', language)}
                testKey="vorTest"
                value={data.vor.vorTest}
                onChange={(k, v) => updateSection('vor', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'hipTest', language)}
                testKey="hipTest"
                value={data.vor.hipTest}
                onChange={(k, v) => updateSection('vor', k, v)}
                language={language}
              />
              <TestRow
                label={t('vng', 'headShakeNystagmus', language)}
                testKey="headShakeNystagmus"
                value={data.vor.headShakeNystagmus}
                onChange={(k, v) => updateSection('vor', k, v)}
                language={language}
              />
            </Section>

            {/* Dix-Hallpike / BPPV */}
            <Section
              title={t('vng', 'dix', language)}
              icon={RotateCcw}
              language={language}
            >
              <TestRow
                label={`${t('vng', 'dix', language)} - ${t('vng', 'right', language)}`}
                testKey="dixHallpikeRight"
                value={data.bppv.dixHallpikeRight}
                onChange={(k, v) => updateSection('bppv', k, v)}
                language={language}
              />
              <TestRow
                label={`${t('vng', 'dix', language)} - ${t('vng', 'left', language)}`}
                testKey="dixHallpikeLeft"
                value={data.bppv.dixHallpikeLeft}
                onChange={(k, v) => updateSection('bppv', k, v)}
                language={language}
              />

              {(data.bppv.dixHallpikeRight === 'abnormal' || data.bppv.dixHallpikeLeft === 'abnormal') && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        {language === 'no' ? 'Påvirket buegang' : 'Affected Canal'}
                      </label>
                      <select
                        value={data.bppv.affectedCanal}
                        onChange={(e) => updateSection('bppv', 'affectedCanal', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
                        <option value="posterior">{t('vng', 'posteriorCanal', language)}</option>
                        <option value="anterior">{t('vng', 'anteriorCanal', language)}</option>
                        <option value="horizontal">{t('vng', 'horizontalCanal', language)}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        {language === 'no' ? 'Type' : 'Type'}
                      </label>
                      <select
                        value={data.bppv.type}
                        onChange={(e) => updateSection('bppv', 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
                        <option value="canalithiasis">{t('vng', 'canalithiasis', language)}</option>
                        <option value="cupulolithiasis">{t('vng', 'cupulolithiasis', language)}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* Vitals */}
            <Section
              title={language === 'no' ? 'Vitalia' : 'Vitals'}
              icon={Activity}
              defaultOpen={false}
              language={language}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('vng', 'bloodPressure', language)} ({t('vng', 'left', language)})
                  </label>
                  <input
                    type="text"
                    value={data.vitals.bloodPressureLeft}
                    onChange={(e) => updateSection('vitals', 'bloodPressureLeft', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('vng', 'bloodPressure', language)} ({t('vng', 'right', language)})
                  </label>
                  <input
                    type="text"
                    value={data.vitals.bloodPressureRight}
                    onChange={(e) => updateSection('vitals', 'bloodPressureRight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('vng', 'pulse', language)} ({t('vng', 'left', language)})
                  </label>
                  <input
                    type="text"
                    value={data.vitals.pulseLeft}
                    onChange={(e) => updateSection('vitals', 'pulseLeft', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="72 bpm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('vng', 'pulse', language)} ({t('vng', 'right', language)})
                  </label>
                  <input
                    type="text"
                    value={data.vitals.pulseRight}
                    onChange={(e) => updateSection('vitals', 'pulseRight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="72 bpm"
                  />
                </div>
              </div>
            </Section>

            {/* Interpretation & Recommendations */}
            <Section
              title={t('vng', 'interpretation', language)}
              icon={FileText}
              language={language}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vng', 'interpretation', language)}
                  </label>
                  <textarea
                    value={data.interpretation}
                    onChange={(e) => setData(prev => ({ ...prev, interpretation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                    placeholder={language === 'no'
                      ? 'Klinisk tolkning av funnene...'
                      : 'Clinical interpretation of findings...'
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vng', 'recommendations', language)}
                  </label>
                  <textarea
                    value={data.recommendations}
                    onChange={(e) => setData(prev => ({ ...prev, recommendations: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                    placeholder={language === 'no'
                      ? 'Anbefalinger og videre tiltak...'
                      : 'Recommendations and further actions...'
                    }
                  />
                </div>
              </div>
            </Section>
          </>
        ) : (
          /* Report Tab */
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {language === 'no' ? 'Generert rapport' : 'Generated Report'}
              </h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {generateNarrative()}
              </pre>
            </div>

            {data.interpretation && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {t('vng', 'interpretation', language)}
                </h4>
                <p className="text-sm text-blue-800">{data.interpretation}</p>
              </div>
            )}

            {data.recommendations && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  {t('vng', 'recommendations', language)}
                </h4>
                <p className="text-sm text-green-800">{data.recommendations}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between">
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" />
            {t('common', 'copy', language)}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            {t('common', 'print', language)}
          </button>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          {t('common', 'save', language)}
        </button>
      </div>
    </div>
  );
}

// Export helper to get default data
export { getDefaultVNGData };
