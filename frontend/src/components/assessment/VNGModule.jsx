/**
 * VNGModule - Video Nystagmography Assessment Component
 *
 * Comprehensive vestibular testing interface based on clinical VNG protocols.
 * Supports bilingual documentation (English/Norwegian) via centralized i18n.
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

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n';
import {
  Eye,
  Activity,
  Target,
  Brain,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  Copy,
  Save,
} from 'lucide-react';

// Result options for tests
const RESULT_OPTIONS = {
  normal: { value: 'normal', icon: CheckCircle2, color: 'text-green-600' },
  abnormal: { value: 'abnormal', icon: XCircle, color: 'text-red-600' },
  notTested: { value: 'not_tested', icon: AlertCircle, color: 'text-gray-400 dark:text-gray-300' },
};

// Default VNG data structure
const getDefaultVNGData = () => ({
  // Spontaneous Nystagmus
  spontaneousNystagmus: {
    present: false,
    direction: '',
    notes: '',
  },

  // Gaze Tests
  gazeLight: {
    center: 'normal',
    left: 'normal',
    right: 'normal',
    up: 'normal',
    down: 'normal',
    notes: '',
  },
  gazeDark: {
    center: 'normal',
    left: 'normal',
    right: 'normal',
    up: 'normal',
    down: 'normal',
    notes: '',
  },

  // Positional Testing
  positional: {
    headRight: 'normal',
    headLeft: 'normal',
    bow: 'normal',
    lean: 'normal',
    notes: '',
  },

  // Smooth Pursuit
  smoothPursuit: {
    horizontal: 'normal',
    vertical: 'normal',
    notes: '',
  },

  // Saccades
  saccades: {
    prosaccade: {
      latency: '',
      velocity: '',
      accuracy: '',
      result: 'normal',
    },
    antisaccade: {
      latency: '',
      velocity: '',
      accuracy: '',
      result: 'normal',
    },
    notes: '',
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
    notes: '',
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
    notes: '',
  },

  // VOR/HIT
  vor: {
    vorTest: 'normal',
    hipTest: 'normal',
    headShakeNystagmus: 'normal',
    notes: '',
  },

  // Eye Tests
  eyeTests: {
    convergence: 'normal',
    pupilSize: 'normal',
    lightReflex: 'normal',
    gazeHold: 'normal',
    notes: '',
  },

  // Vitals
  vitals: {
    bloodPressureLeft: '',
    bloodPressureRight: '',
    pulseLeft: '',
    pulseRight: '',
    capillaryRefill: 'normal',
  },

  // BPPV Assessment
  bppv: {
    dixHallpikeRight: 'normal',
    dixHallpikeLeft: 'normal',
    affectedCanal: '',
    type: '', // canalithiasis or cupulolithiasis
    notes: '',
  },

  // Summary
  interpretation: '',
  recommendations: '',
});

// Mapping from result option value to i18n key
const RESULT_KEY_MAP = {
  normal: 'vngNormal',
  abnormal: 'vngAbnormal',
  not_tested: 'vngNotTested',
};

// Mapping from gaze/cerebellar data keys to i18n keys for narrative labels
const VNG_KEY_MAP = {
  center: 'vngCenter',
  left: 'vngLeft',
  right: 'vngRight',
  up: 'vngUp',
  down: 'vngDown',
  romberg7Step: 'vngRomberg7Step',
  oneLegStanding: 'vngOneLegStanding',
  fingerToNose: 'vngFingerToNose',
  fingerToFinger: 'vngFingerToFinger',
  rapidSupination: 'vngRapidSupination',
  fingerTapping: 'vngFingerTapping',
  dualTasking: 'vngDualTasking',
};

// Result Button Component
function ResultButton({ value, currentValue, onChange }) {
  const { t } = useTranslation('assessment');
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
        ${
          isSelected
            ? `${option.color} bg-gray-100 ring-1 ring-current`
            : 'text-gray-400 dark:text-gray-300 hover:text-gray-600 hover:bg-gray-50'
        }
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {t(RESULT_KEY_MAP[value] || `vng${value.charAt(0).toUpperCase()}${value.slice(1)}`, value)}
    </button>
  );
}

// Test Row Component
function TestRow({ label, testKey, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        <ResultButton value="normal" currentValue={value} onChange={(v) => onChange(testKey, v)} />
        <ResultButton
          value="abnormal"
          currentValue={value}
          onChange={(v) => onChange(testKey, v)}
        />
      </div>
    </div>
  );
}

// Collapsible Section Component
function Section({ title, icon: Icon, children, defaultOpen = true }) {
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
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isOpen && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

// Main VNG Module Component
export default function VNGModule({
  language = 'en',
  initialData = null,
  onSave,
  _onGenerateReport,
  patientName = '',
  examDate = new Date().toISOString().split('T')[0],
}) {
  const { t, lang } = useTranslation('assessment');
  const [data, setData] = useState(initialData || getDefaultVNGData());
  const [activeTab, setActiveTab] = useState('assessment');

  // Update nested data
  const updateSection = useCallback((section, key, value) => {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }, []);

  // Update saccade data
  const updateSaccade = useCallback((type, key, value) => {
    setData((prev) => ({
      ...prev,
      saccades: {
        ...prev.saccades,
        [type]: {
          ...prev.saccades[type],
          [key]: value,
        },
      },
    }));
  }, []);

  // Generate narrative report
  const generateNarrative = useCallback(() => {
    const sections = [];

    // Gaze testing narrative
    const gazeAbnormal = Object.entries(data.gazeLight)
      .filter(([k, v]) => k !== 'notes' && v === 'abnormal')
      .map(([k]) => t(VNG_KEY_MAP[k] || k, k));

    if (gazeAbnormal.length > 0) {
      sections.push(
        `${t('vngGazeAbnormal', 'Blikktest viser avvik i:')} ${gazeAbnormal.join(', ')}.`
      );
    } else {
      sections.push(t('vngGazeNormalAll', 'Blikktest er normal i alle retninger.'));
    }

    // Cerebellar assessment narrative
    const cerebellarAbnormal = Object.entries(data.cerebellar)
      .filter(([k, v]) => k !== 'notes' && v === 'abnormal')
      .map(([k]) => t(VNG_KEY_MAP[k] || k, k));

    if (cerebellarAbnormal.length > 0) {
      sections.push(
        `${t('vngCerebellumAbnormal', 'Cerebellum-vurdering viser avvik i:')} ${cerebellarAbnormal.join(', ')}.`
      );
    } else {
      sections.push(t('vngCerebellumNormal', 'Cerebellum-vurdering er normal.'));
    }

    // VOR narrative
    if (data.vor.vorTest === 'abnormal' || data.vor.hipTest === 'abnormal') {
      sections.push(t('vngVorAbnormal', 'VOR/Hodeimpulstest viser avvik.'));
    }

    // BPPV narrative
    if (data.bppv.dixHallpikeRight === 'abnormal' || data.bppv.dixHallpikeLeft === 'abnormal') {
      const side =
        data.bppv.dixHallpikeRight === 'abnormal'
          ? t('vngRight', 'Høyre').toLowerCase()
          : t('vngLeft', 'Venstre').toLowerCase();
      const dixText = t('vngDixPositive', 'Dix-Hallpike positiv på {side} side.').replace(
        '{side}',
        side
      );
      const canalText = data.bppv.affectedCanal
        ? ` ${t('vngAffectedCanalPrefix', 'Påvirket buegang:')} ${data.bppv.affectedCanal}.`
        : '';
      sections.push(`${dixText}${canalText}`);
    }

    return sections.join('\n\n');
  }, [data, t]);

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
              {t('vngTitle', 'VNG-undersøkelse')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('vngSubtitle', 'Omfattende vestibulær testprotokoll')}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600 dark:text-gray-300">
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
                : 'bg-gray-100 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('vngProtocol', 'Undersøkelsesprotokoll')}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'report'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('vngResults', 'Resultater og rapport')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'assessment' ? (
          <>
            {/* Spontaneous Nystagmus */}
            <Section title={t('vngSpontaneousNystagmus', 'Spontan nystagmus')} icon={Eye}>
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.spontaneousNystagmus.present}
                    onChange={(e) =>
                      updateSection('spontaneousNystagmus', 'present', e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{t('vngNystagmusPresent', 'Nystagmus til stede')}</span>
                </label>
              </div>
              {data.spontaneousNystagmus.present && (
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('vngDirectionCharacteristics', 'Retning/Karakteristikk')}
                  </label>
                  <select
                    value={data.spontaneousNystagmus.direction}
                    onChange={(e) =>
                      updateSection('spontaneousNystagmus', 'direction', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">{t('vngSelectOption', 'Velg...')}</option>
                    <option value="upBeating">{t('vngUpBeating', 'Oppslående')}</option>
                    <option value="downBeating">{t('vngDownBeating', 'Nedslående')}</option>
                    <option value="rightBeating">{t('vngRightBeating', 'Høyreslående')}</option>
                    <option value="leftBeating">{t('vngLeftBeating', 'Venstreslående')}</option>
                    <option value="torsional">{t('vngTorsional', 'Torsjonell')}</option>
                  </select>
                </div>
              )}
            </Section>

            {/* Gaze Testing - Light */}
            <Section title={t('vngGazeLight', 'Blikktest (lys)')} icon={Eye}>
              <TestRow
                label={t('vngCenter', 'Senter')}
                testKey="center"
                value={data.gazeLight.center}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
              />
              <TestRow
                label={t('vngLeft', 'Venstre')}
                testKey="left"
                value={data.gazeLight.left}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
              />
              <TestRow
                label={t('vngRight', 'Høyre')}
                testKey="right"
                value={data.gazeLight.right}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
              />
              <TestRow
                label={t('vngUp', 'Opp')}
                testKey="up"
                value={data.gazeLight.up}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
              />
              <TestRow
                label={t('vngDown', 'Ned')}
                testKey="down"
                value={data.gazeLight.down}
                onChange={(k, v) => updateSection('gazeLight', k, v)}
              />
            </Section>

            {/* Gaze Testing - Dark */}
            <Section title={t('vngGazeDark', 'Blikktest (mørke)')} icon={Eye} defaultOpen={false}>
              <TestRow
                label={t('vngCenter', 'Senter')}
                testKey="center"
                value={data.gazeDark.center}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
              />
              <TestRow
                label={t('vngLeft', 'Venstre')}
                testKey="left"
                value={data.gazeDark.left}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
              />
              <TestRow
                label={t('vngRight', 'Høyre')}
                testKey="right"
                value={data.gazeDark.right}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
              />
              <TestRow
                label={t('vngUp', 'Opp')}
                testKey="up"
                value={data.gazeDark.up}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
              />
              <TestRow
                label={t('vngDown', 'Ned')}
                testKey="down"
                value={data.gazeDark.down}
                onChange={(k, v) => updateSection('gazeDark', k, v)}
              />
            </Section>

            {/* Positional Testing */}
            <Section title={t('vngPositionalTest', 'Posisjonstest')} icon={RotateCcw}>
              <TestRow
                label={t('vngHeadRight', 'Hode høyre')}
                testKey="headRight"
                value={data.positional.headRight}
                onChange={(k, v) => updateSection('positional', k, v)}
              />
              <TestRow
                label={t('vngHeadLeft', 'Hode venstre')}
                testKey="headLeft"
                value={data.positional.headLeft}
                onChange={(k, v) => updateSection('positional', k, v)}
              />
              <TestRow
                label={t('vngBow', 'Foroverbøyd')}
                testKey="bow"
                value={data.positional.bow}
                onChange={(k, v) => updateSection('positional', k, v)}
              />
              <TestRow
                label={t('vngLean', 'Bakoverbøyd')}
                testKey="lean"
                value={data.positional.lean}
                onChange={(k, v) => updateSection('positional', k, v)}
              />
            </Section>

            {/* Smooth Pursuit */}
            <Section
              title={t('vngSmoothPursuit', 'Glatt følgebevegelse')}
              icon={ArrowUpDown}
              defaultOpen={false}
            >
              <TestRow
                label={t('vngHorizontal', 'Horisontal')}
                testKey="horizontal"
                value={data.smoothPursuit.horizontal}
                onChange={(k, v) => updateSection('smoothPursuit', k, v)}
              />
              <TestRow
                label={t('vngVertical', 'Vertikal')}
                testKey="vertical"
                value={data.smoothPursuit.vertical}
                onChange={(k, v) => updateSection('smoothPursuit', k, v)}
              />
            </Section>

            {/* Saccades */}
            <Section title={t('vngSaccades', 'Sakkader')} icon={Target} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-4">
                {/* Prosaccade */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    {t('vngProsaccade', 'Prosakkade')}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('vngLatency', 'Latens')} ({t('vngMs', 'ms')})
                      </label>
                      <input
                        type="number"
                        value={data.saccades.prosaccade.latency}
                        onChange={(e) => updateSaccade('prosaccade', 'latency', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="ms"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('vngVelocity', 'Hastighet')} ({t('vngDegPerSec', '°/s')})
                      </label>
                      <input
                        type="number"
                        value={data.saccades.prosaccade.velocity}
                        onChange={(e) => updateSaccade('prosaccade', 'velocity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="°/s"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('vngAccuracy', 'Nøyaktighet')} ({t('vngPercent', '%')})
                      </label>
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
                    {t('vngAntisaccade', 'Antisakkade')}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('vngLatency', 'Latens')} ({t('vngMs', 'ms')})
                      </label>
                      <input
                        type="number"
                        value={data.saccades.antisaccade.latency}
                        onChange={(e) => updateSaccade('antisaccade', 'latency', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="ms"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('vngVelocity', 'Hastighet')} ({t('vngDegPerSec', '°/s')})
                      </label>
                      <input
                        type="number"
                        value={data.saccades.antisaccade.velocity}
                        onChange={(e) => updateSaccade('antisaccade', 'velocity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="°/s"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('vngAccuracy', 'Nøyaktighet')} ({t('vngPercent', '%')})
                      </label>
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
            <Section title={t('vngCerebellumAssessment', 'Cerebellum-vurdering')} icon={Brain}>
              <TestRow
                label={t('vngRomberg7Step', '7-trinns Romberg')}
                testKey="romberg7Step"
                value={data.cerebellar.romberg7Step}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
              />
              <TestRow
                label={t('vngOneLegStanding', 'Ett-bens stående')}
                testKey="oneLegStanding"
                value={data.cerebellar.oneLegStanding}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
              />
              <TestRow
                label={t('vngFingerToNose', 'Finger til nese')}
                testKey="fingerToNose"
                value={data.cerebellar.fingerToNose}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
              />
              <TestRow
                label={t('vngFingerToFinger', 'Finger til finger')}
                testKey="fingerToFinger"
                value={data.cerebellar.fingerToFinger}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
              />
              <TestRow
                label={t('vngRapidSupination', 'Rask supinasjon')}
                testKey="rapidSupination"
                value={data.cerebellar.rapidSupination}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
              />
              <TestRow
                label={t('vngFingerTapping', 'Fingertapping')}
                testKey="fingerTapping"
                value={data.cerebellar.fingerTapping}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
              />
              <TestRow
                label={t('vngDualTasking', 'Dobbeltoppgave')}
                testKey="dualTasking"
                value={data.cerebellar.dualTasking}
                onChange={(k, v) => updateSection('cerebellar', k, v)}
              />
            </Section>

            {/* VOR / HIT */}
            <Section title={t('vngVor', 'VOR / Hodeimpuls')} icon={Activity}>
              <TestRow
                label={t('vngVorTest', 'VOR-test')}
                testKey="vorTest"
                value={data.vor.vorTest}
                onChange={(k, v) => updateSection('vor', k, v)}
              />
              <TestRow
                label={t('vngHipTest', 'Hodeimpulstest (HIT)')}
                testKey="hipTest"
                value={data.vor.hipTest}
                onChange={(k, v) => updateSection('vor', k, v)}
              />
              <TestRow
                label={t('vngHeadShakeNystagmus', 'Hoderisting-nystagmus')}
                testKey="headShakeNystagmus"
                value={data.vor.headShakeNystagmus}
                onChange={(k, v) => updateSection('vor', k, v)}
              />
            </Section>

            {/* Dix-Hallpike / BPPV */}
            <Section title={t('vngDix', 'Dix-Hallpike')} icon={RotateCcw}>
              <TestRow
                label={`${t('vngDix', 'Dix-Hallpike')} - ${t('vngRight', 'Høyre')}`}
                testKey="dixHallpikeRight"
                value={data.bppv.dixHallpikeRight}
                onChange={(k, v) => updateSection('bppv', k, v)}
              />
              <TestRow
                label={`${t('vngDix', 'Dix-Hallpike')} - ${t('vngLeft', 'Venstre')}`}
                testKey="dixHallpikeLeft"
                value={data.bppv.dixHallpikeLeft}
                onChange={(k, v) => updateSection('bppv', k, v)}
              />

              {(data.bppv.dixHallpikeRight === 'abnormal' ||
                data.bppv.dixHallpikeLeft === 'abnormal') && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {t('vngAffectedCanal', 'Påvirket buegang')}
                      </label>
                      <select
                        value={data.bppv.affectedCanal}
                        onChange={(e) => updateSection('bppv', 'affectedCanal', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">{t('vngSelectOption', 'Velg...')}</option>
                        <option value="posterior">{t('vngPosteriorCanal', 'Bakre buegang')}</option>
                        <option value="anterior">{t('vngAnteriorCanal', 'Fremre buegang')}</option>
                        <option value="horizontal">
                          {t('vngHorizontalCanal', 'Horisontal buegang')}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {t('vngBppvType', 'Type')}
                      </label>
                      <select
                        value={data.bppv.type}
                        onChange={(e) => updateSection('bppv', 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">{t('vngSelectOption', 'Velg...')}</option>
                        <option value="canalithiasis">
                          {t('vngCanalithiasis', 'Kanalitiasis')}
                        </option>
                        <option value="cupulolithiasis">
                          {t('vngCupulolithiasis', 'Kupulolitiasis')}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* Vitals */}
            <Section title={t('vngVitals', 'Vitalia')} icon={Activity} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('vngBloodPressure', 'Blodtrykk')} ({t('vngLeft', 'Venstre')})
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
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('vngBloodPressure', 'Blodtrykk')} ({t('vngRight', 'Høyre')})
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
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('vngPulse', 'Puls')} ({t('vngLeft', 'Venstre')})
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
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {t('vngPulse', 'Puls')} ({t('vngRight', 'Høyre')})
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
            <Section title={t('vngInterpretation', 'Tolkning')} icon={FileText}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vngInterpretation', 'Tolkning')}
                  </label>
                  <textarea
                    value={data.interpretation}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, interpretation: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                    placeholder={t(
                      'vngInterpretationPlaceholder',
                      'Klinisk tolkning av funnene...'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vngRecommendations', 'Anbefalinger')}
                  </label>
                  <textarea
                    value={data.recommendations}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, recommendations: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                    placeholder={t(
                      'vngRecommendationsPlaceholder',
                      'Anbefalinger og videre tiltak...'
                    )}
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
                {t('vngGeneratedReport', 'Generert rapport')}
              </h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {generateNarrative()}
              </pre>
            </div>

            {data.interpretation && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {t('vngInterpretation', 'Tolkning')}
                </h4>
                <p className="text-sm text-blue-800">{data.interpretation}</p>
              </div>
            )}

            {data.recommendations && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  {t('vngRecommendations', 'Anbefalinger')}
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
            {t('copy', 'Kopier')}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            {t('print', 'Skriv ut')}
          </button>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          {t('save', 'Lagre')}
        </button>
      </div>
    </div>
  );
}

// Export helper to get default data
export { getDefaultVNGData };
