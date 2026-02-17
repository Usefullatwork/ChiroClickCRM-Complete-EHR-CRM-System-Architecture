/**
 * VestibularAssessment Component
 * Skjema for vestibular vurdering (svimmelhet, balanse, okulomotorisk funksjon)
 *
 * Form for vestibular assessment (dizziness, balance, oculomotor function)
 */

import _React, { useState, useCallback } from 'react';
import {
  Eye,
  Activity,
  AlertTriangle,
  Save,
  Lock,
  ChevronDown,
  ChevronUp,
  _Check,
  _X,
  _Plus,
  _Minus,
  HelpCircle,
  Clock,
  Target,
} from 'lucide-react';

/**
 * VestibularAssessment Component
 * Komponent for vestibular vurdering og dokumentasjon
 *
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial assessment data
 * @param {Object} props.patient - Patient information
 * @param {Function} props.onSave - Callback when assessment is saved
 * @param {Function} props.onLock - Callback when assessment is locked
 * @param {boolean} props.readOnly - Whether the form is read-only
 * @returns {JSX.Element} Vestibular assessment component
 */
export default function VestibularAssessment({
  initialData,
  patient,
  onSave,
  onLock,
  readOnly = false,
}) {
  // State for assessment data
  // Tilstand for vurderingsdata
  const [assessment, setAssessment] = useState(
    initialData || {
      // Symptomer / Symptoms
      symptoms: {
        dizzinessType: '', // vertigo, lightheadedness, disequilibrium, presyncope
        onset: '',
        duration: '',
        frequency: '',
        triggers: [],
        associatedSymptoms: [],
      },
      // Okulomotorisk undersokelse / Oculomotor examination
      oculomotor: {
        pursuits: { horizontal: '', vertical: '', notes: '' },
        saccades: { horizontal: '', vertical: '', notes: '' },
        convergence: { nearPoint: '', notes: '' },
        vrORVerifiability: '',
        spontaneousNystagmus: { present: false, direction: '', notes: '' },
        gazeStability: '',
      },
      // Vestibulare tester / Vestibular tests
      vestibularTests: {
        dixHallpike: { right: '', left: '', notes: '' },
        supineRoll: { right: '', left: '', notes: '' },
        headImpulseTest: { right: '', left: '', notes: '' },
        headShakeNystagmus: { present: false, direction: '', notes: '' },
        dynamicVisualAcuity: { result: '', notes: '' },
      },
      // Balanse / Balance
      balance: {
        romberg: { eyesOpen: '', eyesClosed: '', notes: '' },
        tandemStance: { eyesOpen: '', eyesClosed: '', notes: '' },
        singleLegStance: { right: '', left: '', notes: '' },
        functionalgaitAssessment: '',
        bergs: { score: '', notes: '' },
      },
      // Vurdering / Assessment
      clinicalAssessment: {
        diagnosis: '',
        differentialDiagnosis: '',
        redFlags: [],
        prognosis: '',
      },
      // Plan
      plan: {
        treatment: '',
        vestibularRehabilitation: '',
        homeExercises: '',
        followUp: '',
        referrals: '',
      },
    }
  );

  const [expandedSections, setExpandedSections] = useState({
    symptoms: true,
    oculomotor: true,
    vestibular: true,
    balance: true,
    assessment: true,
    plan: true,
  });

  const [saving, setSaving] = useState(false);

  /**
   * Toggle section expansion
   * Veksle seksjonsutviding
   */
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /**
   * Update assessment field
   * Oppdater vurderingsfelt
   */
  const updateField = useCallback(
    (section, field, value) => {
      if (readOnly) {
        return;
      }
      setAssessment((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    },
    [readOnly]
  );

  /**
   * Update nested field
   * Oppdater nestet felt
   */
  const updateNestedField = useCallback(
    (section, parent, field, value) => {
      if (readOnly) {
        return;
      }
      setAssessment((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [parent]: {
            ...prev[section][parent],
            [field]: value,
          },
        },
      }));
    },
    [readOnly]
  );

  /**
   * Handle save
   * Handter lagring
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      if (onSave) {
        await onSave(assessment);
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Get result badge color
   * Henter resultatmerke-farge
   */
  const getResultColor = (result) => {
    switch (result) {
      case 'normal':
      case 'negative':
        return 'bg-green-100 text-green-800';
      case 'abnormal':
      case 'positive':
        return 'bg-red-100 text-red-800';
      case 'inconclusive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Section component
   * Seksjonskomponent
   */
  const Section = ({ id, title, icon: Icon, color, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between p-4 bg-${color}-50 border-b border-${color}-100`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`w-4 h-4 text-${color}-600`} />
          </div>
          <h3 className={`font-semibold text-${color}-900`}>{title}</h3>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {expandedSections[id] && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );

  /**
   * Test result selector
   * Testresultat-velger
   */
  const TestResultSelector = ({ label, value, onChange, options }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        {(options || ['normal', 'abnormal', 'not_tested']).map((opt) => (
          <button
            key={opt}
            onClick={() => !readOnly && onChange(opt)}
            disabled={readOnly}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              value === opt
                ? getResultColor(opt)
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {opt === 'normal' && 'Normal'}
            {opt === 'abnormal' && 'Unormal'}
            {opt === 'positive' && 'Positiv'}
            {opt === 'negative' && 'Negativ'}
            {opt === 'not_tested' && 'Ikke testet'}
          </button>
        ))}
      </div>
    </div>
  );

  /**
   * Bilateral test component
   * Bilateral testkomponent
   */
  const BilateralTest = ({ label, data, section, testName, helpText }) => (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{label}</h4>
        {helpText && (
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg z-10">
              {helpText}
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TestResultSelector
          label="Hoyre"
          value={data?.right}
          onChange={(v) => updateNestedField(section, testName, 'right', v)}
          options={['normal', 'positive', 'negative', 'not_tested']}
        />
        <TestResultSelector
          label="Venstre"
          value={data?.left}
          onChange={(v) => updateNestedField(section, testName, 'left', v)}
          options={['normal', 'positive', 'negative', 'not_tested']}
        />
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notater</label>
        <input
          type="text"
          value={data?.notes || ''}
          onChange={(e) => updateNestedField(section, testName, 'notes', e.target.value)}
          disabled={readOnly}
          placeholder="Ytterligere observasjoner..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Common dizziness triggers / Vanlige svimmelhetsutlosere
  const dizzinessTriggers = [
    'Hodebevegelse',
    'Snur seg i sengen',
    'Blikk opp/ned',
    'Visuell stimulering',
    'Stress',
    'Tretthet',
    'Ortostatisk',
  ];

  // Associated symptoms / Assosierte symptomer
  const associatedSymptomsList = [
    'Kvalme',
    'Oppkast',
    'Hodepine',
    'Horselstap',
    'Tinnitus',
    'Aural fylde',
    'Synsforstyrrelser',
    'Ustodighet',
  ];

  return (
    <div className="space-y-6">
      {/* Header / Overskrift */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vestibular Vurdering</h2>
          {patient && (
            <p className="text-sm text-gray-500 mt-0.5">
              {patient.firstName} {patient.lastName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Lagrer...' : 'Lagre'}
              </button>
              <button
                onClick={onLock}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Lock className="w-4 h-4" />
                Signer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Symptoms Section / Symptom-seksjon */}
      <Section id="symptoms" title="Symptomer" icon={Activity} color="blue">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type svimmelhet</label>
            <select
              value={assessment.symptoms.dizzinessType}
              onChange={(e) => updateField('symptoms', 'dizzinessType', e.target.value)}
              disabled={readOnly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Velg...</option>
              <option value="vertigo">Vertigo (roterende)</option>
              <option value="lightheadedness">Ustodighet/lett i hodet</option>
              <option value="disequilibrium">Disequilibrium (balanse)</option>
              <option value="presyncope">Presynkope (nesten besvimelse)</option>
              <option value="mixed">Blandet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debut</label>
            <input
              type="text"
              value={assessment.symptoms.onset}
              onChange={(e) => updateField('symptoms', 'onset', e.target.value)}
              disabled={readOnly}
              placeholder="Na r startet symptomene?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Varighet per episode
            </label>
            <input
              type="text"
              value={assessment.symptoms.duration}
              onChange={(e) => updateField('symptoms', 'duration', e.target.value)}
              disabled={readOnly}
              placeholder="Sekunder, minutter, timer..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frekvens</label>
            <input
              type="text"
              value={assessment.symptoms.frequency}
              onChange={(e) => updateField('symptoms', 'frequency', e.target.value)}
              disabled={readOnly}
              placeholder="Hvor ofte?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Triggers / Utlosere */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Utlosende faktorer</label>
          <div className="flex flex-wrap gap-2">
            {dizzinessTriggers.map((trigger) => {
              const isSelected = assessment.symptoms.triggers?.includes(trigger);
              return (
                <button
                  key={trigger}
                  onClick={() => {
                    if (readOnly) {
                      return;
                    }
                    const current = assessment.symptoms.triggers || [];
                    const updated = isSelected
                      ? current.filter((t) => t !== trigger)
                      : [...current, trigger];
                    updateField('symptoms', 'triggers', updated);
                  }}
                  disabled={readOnly}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {trigger}
                </button>
              );
            })}
          </div>
        </div>

        {/* Associated Symptoms / Assosierte symptomer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ledsagende symptomer
          </label>
          <div className="flex flex-wrap gap-2">
            {associatedSymptomsList.map((symptom) => {
              const isSelected = assessment.symptoms.associatedSymptoms?.includes(symptom);
              return (
                <button
                  key={symptom}
                  onClick={() => {
                    if (readOnly) {
                      return;
                    }
                    const current = assessment.symptoms.associatedSymptoms || [];
                    const updated = isSelected
                      ? current.filter((s) => s !== symptom)
                      : [...current, symptom];
                    updateField('symptoms', 'associatedSymptoms', updated);
                  }}
                  disabled={readOnly}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Oculomotor Section / Okulomotorisk seksjon */}
      <Section id="oculomotor" title="Okulomotorisk undersokelse" icon={Eye} color="teal">
        <div className="grid grid-cols-2 gap-4">
          <TestResultSelector
            label="Pursuits - Horisontale"
            value={assessment.oculomotor.pursuits?.horizontal}
            onChange={(v) => updateNestedField('oculomotor', 'pursuits', 'horizontal', v)}
          />
          <TestResultSelector
            label="Pursuits - Vertikale"
            value={assessment.oculomotor.pursuits?.vertical}
            onChange={(v) => updateNestedField('oculomotor', 'pursuits', 'vertical', v)}
          />
          <TestResultSelector
            label="Saccader - Horisontale"
            value={assessment.oculomotor.saccades?.horizontal}
            onChange={(v) => updateNestedField('oculomotor', 'saccades', 'horizontal', v)}
          />
          <TestResultSelector
            label="Saccader - Vertikale"
            value={assessment.oculomotor.saccades?.vertical}
            onChange={(v) => updateNestedField('oculomotor', 'saccades', 'vertical', v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konvergens - N rpunkt (cm)
            </label>
            <input
              type="number"
              value={assessment.oculomotor.convergence?.nearPoint || ''}
              onChange={(e) =>
                updateNestedField('oculomotor', 'convergence', 'nearPoint', e.target.value)
              }
              disabled={readOnly}
              placeholder="Normal: 6-10 cm"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <TestResultSelector
            label="VOR-suppressjon"
            value={assessment.oculomotor.vrORVerifiability}
            onChange={(v) => updateField('oculomotor', 'vrORVerifiability', v)}
          />
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assessment.oculomotor.spontaneousNystagmus?.present || false}
                onChange={(e) =>
                  updateNestedField(
                    'oculomotor',
                    'spontaneousNystagmus',
                    'present',
                    e.target.checked
                  )
                }
                disabled={readOnly}
                className="rounded border-gray-300"
              />
              <span className="font-medium text-gray-700">Spontan nystagmus tilstede</span>
            </label>
          </div>
          {assessment.oculomotor.spontaneousNystagmus?.present && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retning</label>
                <input
                  type="text"
                  value={assessment.oculomotor.spontaneousNystagmus?.direction || ''}
                  onChange={(e) =>
                    updateNestedField(
                      'oculomotor',
                      'spontaneousNystagmus',
                      'direction',
                      e.target.value
                    )
                  }
                  disabled={readOnly}
                  placeholder="Venstre, hoyre, vertikal..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notater</label>
                <input
                  type="text"
                  value={assessment.oculomotor.spontaneousNystagmus?.notes || ''}
                  onChange={(e) =>
                    updateNestedField('oculomotor', 'spontaneousNystagmus', 'notes', e.target.value)
                  }
                  disabled={readOnly}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Vestibular Tests Section / Vestibulare tester-seksjon */}
      <Section id="vestibular" title="Vestibulare tester" icon={Target} color="purple">
        <BilateralTest
          label="Dix-Hallpike"
          data={assessment.vestibularTests.dixHallpike}
          section="vestibularTests"
          testName="dixHallpike"
          helpText="Positiv ved BPPV i bakre buegang. Se etter rotatorisk nystagmus med torsjonell komponent."
        />
        <BilateralTest
          label="Supine Roll Test"
          data={assessment.vestibularTests.supineRoll}
          section="vestibularTests"
          testName="supineRoll"
          helpText="Positiv ved BPPV i lateral buegang. Se etter geotropisk eller apogeotropisk nystagmus."
        />
        <BilateralTest
          label="Head Impulse Test (HIT)"
          data={assessment.vestibularTests.headImpulseTest}
          section="vestibularTests"
          testName="headImpulseTest"
          helpText="Positiv (korrektiv saccade) indikerer vestibulart tap pa testet side."
        />
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Dynamisk synsskarhet (DVA)</h4>
          <div className="grid grid-cols-2 gap-4">
            <TestResultSelector
              label="Resultat"
              value={assessment.vestibularTests.dynamicVisualAcuity?.result}
              onChange={(v) =>
                updateNestedField('vestibularTests', 'dynamicVisualAcuity', 'result', v)
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notater</label>
              <input
                type="text"
                value={assessment.vestibularTests.dynamicVisualAcuity?.notes || ''}
                onChange={(e) =>
                  updateNestedField(
                    'vestibularTests',
                    'dynamicVisualAcuity',
                    'notes',
                    e.target.value
                  )
                }
                disabled={readOnly}
                placeholder="Linjetap eller observasjoner..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Balance Section / Balanse-seksjon */}
      <Section id="balance" title="Balanse" icon={Activity} color="green">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Romberg</h4>
            <TestResultSelector
              label="Oyne apne"
              value={assessment.balance.romberg?.eyesOpen}
              onChange={(v) => updateNestedField('balance', 'romberg', 'eyesOpen', v)}
            />
            <div className="mt-3">
              <TestResultSelector
                label="Oyne lukket"
                value={assessment.balance.romberg?.eyesClosed}
                onChange={(v) => updateNestedField('balance', 'romberg', 'eyesClosed', v)}
              />
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Tandem sta</h4>
            <TestResultSelector
              label="Oyne apne"
              value={assessment.balance.tandemStance?.eyesOpen}
              onChange={(v) => updateNestedField('balance', 'tandemStance', 'eyesOpen', v)}
            />
            <div className="mt-3">
              <TestResultSelector
                label="Oyne lukket"
                value={assessment.balance.tandemStance?.eyesClosed}
                onChange={(v) => updateNestedField('balance', 'tandemStance', 'eyesClosed', v)}
              />
            </div>
          </div>
        </div>
        <BilateralTest
          label="Etbensta"
          data={assessment.balance.singleLegStance}
          section="balance"
          testName="singleLegStance"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funksjonell gangvurdering
          </label>
          <textarea
            value={assessment.balance.functionalgaitAssessment || ''}
            onChange={(e) => updateField('balance', 'functionalgaitAssessment', e.target.value)}
            disabled={readOnly}
            placeholder="Observasjoner under gange, snuing, tandemgange..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </Section>

      {/* Assessment Section / Vurderingsseksjon */}
      <Section id="assessment" title="Klinisk vurdering" icon={AlertTriangle} color="orange">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnose</label>
          <input
            type="text"
            value={assessment.clinicalAssessment.diagnosis || ''}
            onChange={(e) => updateField('clinicalAssessment', 'diagnosis', e.target.value)}
            disabled={readOnly}
            placeholder="Prim r diagnose..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Differensialdiagnoser
          </label>
          <textarea
            value={assessment.clinicalAssessment.differentialDiagnosis || ''}
            onChange={(e) =>
              updateField('clinicalAssessment', 'differentialDiagnosis', e.target.value)
            }
            disabled={readOnly}
            placeholder="Andre mulige diagnoser..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prognose</label>
          <textarea
            value={assessment.clinicalAssessment.prognosis || ''}
            onChange={(e) => updateField('clinicalAssessment', 'prognosis', e.target.value)}
            disabled={readOnly}
            placeholder="Forventet forlop..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </Section>

      {/* Plan Section / Planseksjon */}
      <Section id="plan" title="Behandlingsplan" icon={Clock} color="indigo">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Behandling utfort</label>
          <textarea
            value={assessment.plan.treatment || ''}
            onChange={(e) => updateField('plan', 'treatment', e.target.value)}
            disabled={readOnly}
            placeholder="Behandling/manovre utfort i dag..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vestibular rehabilitering
          </label>
          <textarea
            value={assessment.plan.vestibularRehabilitation || ''}
            onChange={(e) => updateField('plan', 'vestibularRehabilitation', e.target.value)}
            disabled={readOnly}
            placeholder="VRT-protokoll, habituation, gaze stabilization..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hjemmeovelser</label>
          <textarea
            value={assessment.plan.homeExercises || ''}
            onChange={(e) => updateField('plan', 'homeExercises', e.target.value)}
            disabled={readOnly}
            placeholder="Ovelser foreskrevet for hjemmebruk..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oppfolging</label>
            <input
              type="text"
              value={assessment.plan.followUp || ''}
              onChange={(e) => updateField('plan', 'followUp', e.target.value)}
              disabled={readOnly}
              placeholder="Neste time..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Henvisninger</label>
            <input
              type="text"
              value={assessment.plan.referrals || ''}
              onChange={(e) => updateField('plan', 'referrals', e.target.value)}
              disabled={readOnly}
              placeholder="ONH, fysioterapeut, etc..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
