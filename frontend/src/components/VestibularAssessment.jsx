import { useState } from 'react';
import { Activity, Eye, Brain, Target, RotateCw, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Comprehensive Vestibular Assessment Component
 * For BPPV testing, VNG, balance testing, and vestibular rehabilitation planning
 */
export default function VestibularAssessment({ data, onChange, readOnly = false }) {
  const [activeSection, setActiveSection] = useState('anamnese');
  const [expandedTests, setExpandedTests] = useState({
    bppv: true,
    balance: false,
    oculomotor: false,
    vng: false
  });

  // Initialize default data structure
  const defaultData = {
    // Anamnese
    dizziness_type: [],
    dizziness_description: '',
    onset_date: '',
    onset_description: '',
    onset_trigger: '',
    duration_description: '',
    triggers: {},
    associated_symptoms: {},
    ear_symptoms: {},

    // Cerebellare/Balanse tester
    fukuda_test: {},
    rhomberg_test: {},
    tandem_rhomberg: 'ua',
    parietal_arm_test: 'ua',
    coordination: { ftn: 'ua', diadochokinesi: 'ua' },

    // Oculomotoriske tester
    saccades: { horizontal: 'ua', vertical: 'ua' },
    smooth_pursuits: { horizontal: 'ua', vertical: 'ua' },
    convergence: { result: 'ua' },
    gaze_nystagmus: 'Ingen',
    hit_test: { result: 'ua' },

    // BPPV Testing
    dix_hallpike_right: { nystagmus: false },
    dix_hallpike_left: { nystagmus: false },
    supine_roll_right: { nystagmus: false },
    supine_roll_left: { nystagmus: false },
    deep_head_hang: { nystagmus: false },
    lean_test: {},

    // VNG
    vng_performed: false,
    vng_results: {},

    // Diagnoser
    primary_diagnosis: '',
    bppv_details: {},

    // Behandling
    maneuvers_performed: [],
    vrt_exercises: [],
    home_exercises: '',

    // Outcome
    dhi_score: null,
    follow_up_plan: '',
    referral_needed: false,
    referral_to: '',

    ...data
  };

  const assessmentData = { ...defaultData, ...data };

  const handleChange = (field, value) => {
    if (!readOnly && onChange) {
      onChange({ ...assessmentData, [field]: value });
    }
  };

  const handleNestedChange = (parent, field, value) => {
    if (!readOnly && onChange) {
      const updated = {
        ...assessmentData,
        [parent]: {
          ...assessmentData[parent],
          [field]: value
        }
      };
      onChange(updated);
    }
  };

  const toggleSection = (section) => {
    setExpandedTests(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const tabs = [
    { id: 'anamnese', label: 'Anamnese', icon: Brain },
    { id: 'testing', label: 'Testing', icon: Activity },
    { id: 'diagnosis', label: 'Diagnose', icon: Target },
    { id: 'treatment', label: 'Behandling', icon: RotateCw }
  ];

  return (
    <div className="vestibular-assessment bg-white rounded-lg shadow-sm border">
      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeSection === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {/* ANAMNESE */}
        {activeSection === 'anamnese' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Sykehistorie - Svimmelhet
            </h3>

            {/* Type Svimmelhet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type Svimmelhet (flere valg mulig)
              </label>
              <div className="space-y-2">
                {[
                  { value: 'karusell', label: 'Karusellsvimmelhet / Rotatorisk vertigo' },
                  { value: 'nautisk', label: 'Nautisk / Båtfølelse / Gynget' },
                  { value: 'uvelhet', label: 'Uvelhet / Uggen / Småfull' },
                  { value: 'lysomfintlig', label: 'Lysømfintlig / Lydømfintlig' },
                  { value: 'hjernetåke', label: 'Hjernetåke / Tung i hodet' },
                  { value: 'visuell', label: 'Synsforstyrrelser / Flirring' }
                ].map(type => (
                  <label key={type.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assessmentData.dizziness_type?.includes(type.value) || false}
                      onChange={(e) => {
                        const current = assessmentData.dizziness_type || [];
                        const updated = e.target.checked
                          ? [...current, type.value]
                          : current.filter(t => t !== type.value);
                        handleChange('dizziness_type', updated);
                      }}
                      disabled={readOnly}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fritekst beskrivelse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse (pasientens egne ord)
              </label>
              <textarea
                value={assessmentData.dizziness_description || ''}
                onChange={(e) => handleChange('dizziness_description', e.target.value)}
                disabled={readOnly}
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder='"Rommet spinner", "Som å stå på en båt", etc.'
              />
            </div>

            {/* Debut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debut Dato
                </label>
                <input
                  type="date"
                  value={assessmentData.onset_date || ''}
                  onChange={(e) => handleChange('onset_date', e.target.value)}
                  disabled={readOnly}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hvordan oppstått
                </label>
                <select
                  value={assessmentData.onset_description || ''}
                  onChange={(e) => handleChange('onset_description', e.target.value)}
                  disabled={readOnly}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Velg...</option>
                  <option value="akutt">Akutt oppstått</option>
                  <option value="gradvis">Gradvis forverring</option>
                  <option value="våknet">Våknet med det</option>
                  <option value="etter_bevegelse">Etter bevegelse</option>
                </select>
              </div>
            </div>

            {/* Utløsende hendelse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utløsende Hendelse
              </label>
              <select
                value={assessmentData.onset_trigger || ''}
                onChange={(e) => handleChange('onset_trigger', e.target.value)}
                disabled={readOnly}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Velg...</option>
                <option value="traume">Traume (fall, slag mot hodet)</option>
                <option value="virus">Virus / Influensa / COVID-19</option>
                <option value="ørebetennelse">Ørebetennelse</option>
                <option value="stress">Stress / Overbelastning</option>
                <option value="ukjent">Ukjent årsak</option>
              </select>
            </div>

            {/* Tilleggsplager */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tilleggsplager
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'hodepine', label: 'Hodepine' },
                  { key: 'nakkesmerter', label: 'Nakkesmerter/stivhet' },
                  { key: 'tinnitus', label: 'Tinnitus/Øresus' },
                  { key: 'trykk_ore', label: 'Trykk i øret' },
                  { key: 'kvalme', label: 'Kvalme/Oppkast' },
                  { key: 'nummenhet', label: 'Nummenhet' },
                  { key: 'lysomfintlig', label: 'Lysømfintlig' },
                  { key: 'lydømfintlig', label: 'Lydømfintlig' }
                ].map(symptom => (
                  <label key={symptom.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assessmentData.associated_symptoms?.[symptom.key] || false}
                      onChange={(e) => handleNestedChange('associated_symptoms', symptom.key, e.target.checked)}
                      disabled={readOnly}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{symptom.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TESTING */}
        {activeSection === 'testing' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Klinisk Testing
            </h3>

            {/* BPPV Testing */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('bppv')}
                className="w-full flex items-center justify-between p-4 font-medium hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  BPPV Testing (Posisjonstester)
                </span>
                {expandedTests.bppv ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedTests.bppv && (
                <div className="p-4 border-t space-y-4">
                  {/* Dix-Hallpike */}
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium mb-3">Dix-Hallpike Test (Bakre/Fremre Buegang)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Høyre */}
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium mb-2">Høyre Side</h5>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={assessmentData.dix_hallpike_right?.nystagmus || false}
                            onChange={(e) => handleNestedChange('dix_hallpike_right', 'nystagmus', e.target.checked)}
                            disabled={readOnly}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">Nystagmus observert</span>
                        </label>

                        {assessmentData.dix_hallpike_right?.nystagmus && (
                          <div className="space-y-2 ml-6">
                            <div>
                              <label className="text-xs text-gray-600">Type</label>
                              <select
                                value={assessmentData.dix_hallpike_right?.type || ''}
                                onChange={(e) => handleNestedChange('dix_hallpike_right', 'type', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="torsjon_geotrop">Torsjon geotropisk</option>
                                <option value="upbeat">Upbeat (vertikal opp)</option>
                                <option value="downbeat">Downbeat (vertikal ned)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Intensitet</label>
                              <select
                                value={assessmentData.dix_hallpike_right?.intensity || ''}
                                onChange={(e) => handleNestedChange('dix_hallpike_right', 'intensity', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="mild">Mild</option>
                                <option value="moderat">Moderat</option>
                                <option value="kraftig">Kraftig</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Karakter</label>
                              <select
                                value={assessmentData.dix_hallpike_right?.character || ''}
                                onChange={(e) => handleNestedChange('dix_hallpike_right', 'character', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="uttrettbar">Uttrettbar (kanalithiasis)</option>
                                <option value="vedvarende">Vedvarende (cupololithiasis)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Venstre */}
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium mb-2">Venstre Side</h5>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={assessmentData.dix_hallpike_left?.nystagmus || false}
                            onChange={(e) => handleNestedChange('dix_hallpike_left', 'nystagmus', e.target.checked)}
                            disabled={readOnly}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">Nystagmus observert</span>
                        </label>

                        {assessmentData.dix_hallpike_left?.nystagmus && (
                          <div className="space-y-2 ml-6">
                            <div>
                              <label className="text-xs text-gray-600">Type</label>
                              <select
                                value={assessmentData.dix_hallpike_left?.type || ''}
                                onChange={(e) => handleNestedChange('dix_hallpike_left', 'type', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="torsjon_geotrop">Torsjon geotropisk</option>
                                <option value="upbeat">Upbeat (vertikal opp)</option>
                                <option value="downbeat">Downbeat (vertikal ned)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Intensitet</label>
                              <select
                                value={assessmentData.dix_hallpike_left?.intensity || ''}
                                onChange={(e) => handleNestedChange('dix_hallpike_left', 'intensity', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="mild">Mild</option>
                                <option value="moderat">Moderat</option>
                                <option value="kraftig">Kraftig</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Karakter</label>
                              <select
                                value={assessmentData.dix_hallpike_left?.character || ''}
                                onChange={(e) => handleNestedChange('dix_hallpike_left', 'character', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="uttrettbar">Uttrettbar (kanalithiasis)</option>
                                <option value="vedvarende">Vedvarende (cupololithiasis)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Supine Roll Test */}
                  <div className="bg-green-50 p-4 rounded-md">
                    <h4 className="font-medium mb-3">Supine Roll Test (Horisontal Buegang)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Høyre */}
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium mb-2">Høyre Rotasjon</h5>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={assessmentData.supine_roll_right?.nystagmus || false}
                            onChange={(e) => handleNestedChange('supine_roll_right', 'nystagmus', e.target.checked)}
                            disabled={readOnly}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">Nystagmus observert</span>
                        </label>

                        {assessmentData.supine_roll_right?.nystagmus && (
                          <div className="space-y-2 ml-6">
                            <div>
                              <label className="text-xs text-gray-600">Retning</label>
                              <select
                                value={assessmentData.supine_roll_right?.direction || ''}
                                onChange={(e) => handleNestedChange('supine_roll_right', 'direction', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="geotrop">Geotropisk (mot bakken)</option>
                                <option value="apogeotrop">Apogeotropisk (mot taket)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Intensitet</label>
                              <select
                                value={assessmentData.supine_roll_right?.intensity || ''}
                                onChange={(e) => handleNestedChange('supine_roll_right', 'intensity', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="mild">Mild</option>
                                <option value="moderat">Moderat</option>
                                <option value="kraftig">Kraftig</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Venstre */}
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium mb-2">Venstre Rotasjon</h5>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={assessmentData.supine_roll_left?.nystagmus || false}
                            onChange={(e) => handleNestedChange('supine_roll_left', 'nystagmus', e.target.checked)}
                            disabled={readOnly}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">Nystagmus observert</span>
                        </label>

                        {assessmentData.supine_roll_left?.nystagmus && (
                          <div className="space-y-2 ml-6">
                            <div>
                              <label className="text-xs text-gray-600">Retning</label>
                              <select
                                value={assessmentData.supine_roll_left?.direction || ''}
                                onChange={(e) => handleNestedChange('supine_roll_left', 'direction', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="geotrop">Geotropisk (mot bakken)</option>
                                <option value="apogeotrop">Apogeotropisk (mot taket)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Intensitet</label>
                              <select
                                value={assessmentData.supine_roll_left?.intensity || ''}
                                onChange={(e) => handleNestedChange('supine_roll_left', 'intensity', e.target.value)}
                                disabled={readOnly}
                                className="w-full text-sm p-1 border rounded"
                              >
                                <option value="">Velg...</option>
                                <option value="mild">Mild</option>
                                <option value="moderat">Moderat</option>
                                <option value="kraftig">Kraftig</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deep Head Hang */}
                  <div className="bg-purple-50 p-4 rounded-md">
                    <h4 className="font-medium mb-3">Deep Head Hang (Fremre Buegang)</h4>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={assessmentData.deep_head_hang?.nystagmus || false}
                        onChange={(e) => handleNestedChange('deep_head_hang', 'nystagmus', e.target.checked)}
                        disabled={readOnly}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Downbeat nystagmus observert</span>
                    </label>
                    {assessmentData.deep_head_hang?.nystagmus && (
                      <textarea
                        value={assessmentData.deep_head_hang?.notes || ''}
                        onChange={(e) => handleNestedChange('deep_head_hang', 'notes', e.target.value)}
                        disabled={readOnly}
                        rows={2}
                        className="w-full p-2 border rounded text-sm mt-2"
                        placeholder="Notater..."
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Balance Testing */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('balance')}
                className="w-full flex items-center justify-between p-4 font-medium hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Balanse & Cerebellare Tester
                </span>
                {expandedTests.balance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedTests.balance && (
                <div className="p-4 border-t space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Fukuda's Test */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Fukuda's Test (Step test)</label>
                      <select
                        value={assessmentData.fukuda_test?.result || 'ua'}
                        onChange={(e) => handleNestedChange('fukuda_test', 'result', e.target.value)}
                        disabled={readOnly}
                        className="w-full p-2 border rounded"
                      >
                        <option value="ua">ua (ingen rotasjon)</option>
                        <option value="rotasjon">Rotasjon observert</option>
                      </select>
                      {assessmentData.fukuda_test?.result === 'rotasjon' && (
                        <input
                          type="text"
                          value={assessmentData.fukuda_test?.details || ''}
                          onChange={(e) => handleNestedChange('fukuda_test', 'details', e.target.value)}
                          disabled={readOnly}
                          className="w-full p-2 border rounded mt-2 text-sm"
                          placeholder="f.eks. '45 gr rot hø'"
                        />
                      )}
                    </div>

                    {/* Rhomberg's Test */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Rhomberg's Test</label>
                      <select
                        value={assessmentData.rhomberg_test?.result || 'ua'}
                        onChange={(e) => handleNestedChange('rhomberg_test', 'result', e.target.value)}
                        disabled={readOnly}
                        className="w-full p-2 border rounded"
                      >
                        <option value="ua">ua (stabil)</option>
                        <option value="ustø">Ustø / Falltendens</option>
                      </select>
                      {assessmentData.rhomberg_test?.result === 'ustø' && (
                        <input
                          type="text"
                          value={assessmentData.rhomberg_test?.direction || ''}
                          onChange={(e) => handleNestedChange('rhomberg_test', 'direction', e.target.value)}
                          disabled={readOnly}
                          className="w-full p-2 border rounded mt-2 text-sm"
                          placeholder="Retning: hø/ve"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Oculomotor Testing */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('oculomotor')}
                className="w-full flex items-center justify-between p-4 font-medium hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Oculomotoriske Tester
                </span>
                {expandedTests.oculomotor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedTests.oculomotor && (
                <div className="p-4 border-t space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Sakkader</label>
                      <select
                        value={assessmentData.saccades?.horizontal || 'ua'}
                        onChange={(e) => handleNestedChange('saccades', 'horizontal', e.target.value)}
                        disabled={readOnly}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="ua">ua</option>
                        <option value="hypometriske">Hypometriske</option>
                        <option value="hypermetriske">Hypermetriske</option>
                        <option value="trege">Trege</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Smooth Pursuits</label>
                      <select
                        value={assessmentData.smooth_pursuits?.horizontal || 'ua'}
                        onChange={(e) => handleNestedChange('smooth_pursuits', 'horizontal', e.target.value)}
                        disabled={readOnly}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="ua">ua (glatte)</option>
                        <option value="saccadic">Saccadic</option>
                        <option value="catch-up">Catch-up sakkader</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">HIT (Halmagyi)</label>
                      <select
                        value={assessmentData.hit_test?.result || 'ua'}
                        onChange={(e) => handleNestedChange('hit_test', 'result', e.target.value)}
                        disabled={readOnly}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="ua">ua bilateral</option>
                        <option value="positiv_hø">Positiv høyre</option>
                        <option value="positiv_ve">Positiv venstre</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DIAGNOSIS */}
        {activeSection === 'diagnosis' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Diagnose & Vurdering
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primærdiagnose
              </label>
              <select
                value={assessmentData.primary_diagnosis || ''}
                onChange={(e) => handleChange('primary_diagnosis', e.target.value)}
                disabled={readOnly}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Velg diagnose...</option>
                <optgroup label="BPPV">
                  <option value="BPPV bakre hø">BPPV bakre buegang høyre</option>
                  <option value="BPPV bakre ve">BPPV bakre buegang venstre</option>
                  <option value="BPPV horisontal hø">BPPV horisontal buegang høyre</option>
                  <option value="BPPV horisontal ve">BPPV horisontal buegang venstre</option>
                  <option value="BPPV fremre">BPPV fremre buegang</option>
                  <option value="BPPV bilateral">BPPV bilateral/multikanal</option>
                </optgroup>
                <optgroup label="Andre vestibulære">
                  <option value="Vestibularis nevritt">Vestibularis nevritt</option>
                  <option value="Labyrintitt">Labyrintitt</option>
                  <option value="Ménières">Ménières sykdom</option>
                  <option value="Vestibulær migrene">Vestibulær migrene</option>
                  <option value="PPPD">PPPD (Persistent Postural-Perceptual Dizziness)</option>
                  <option value="Cervikogen svimmelhet">Cervikogen svimmelhet</option>
                </optgroup>
              </select>
            </div>

            {/* BPPV Details */}
            {assessmentData.primary_diagnosis?.includes('BPPV') && (
              <div className="bg-blue-50 p-4 rounded-md space-y-3">
                <h4 className="font-medium">BPPV Detaljer</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Kanal</label>
                    <select
                      value={assessmentData.bppv_details?.kanal || ''}
                      onChange={(e) => handleNestedChange('bppv_details', 'kanal', e.target.value)}
                      disabled={readOnly}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Velg...</option>
                      <option value="bakre">Bakre (Posterior)</option>
                      <option value="horisontal">Horisontal (Lateral)</option>
                      <option value="fremre">Fremre (Anterior)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Type</label>
                    <select
                      value={assessmentData.bppv_details?.type || ''}
                      onChange={(e) => handleNestedChange('bppv_details', 'type', e.target.value)}
                      disabled={readOnly}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Velg...</option>
                      <option value="kanalithiasis">Kanalithiasis (løse krystaller)</option>
                      <option value="cupololithiasis">Cupololithiasis (festede krystaller)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Side</label>
                    <select
                      value={assessmentData.bppv_details?.side || ''}
                      onChange={(e) => handleNestedChange('bppv_details', 'side', e.target.value)}
                      disabled={readOnly}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Velg...</option>
                      <option value="hø">Høyre</option>
                      <option value="ve">Venstre</option>
                      <option value="bilat">Bilateral</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* DHI Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DHI Score (Dizziness Handicap Inventory 0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={assessmentData.dhi_score || ''}
                onChange={(e) => handleChange('dhi_score', parseInt(e.target.value) || null)}
                disabled={readOnly}
                className="w-full p-2 border rounded-md"
              />
              {assessmentData.dhi_score !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  {assessmentData.dhi_score <= 30 && 'Mild funksjonsnedsettelse'}
                  {assessmentData.dhi_score > 30 && assessmentData.dhi_score <= 60 && 'Moderat funksjonsnedsettelse'}
                  {assessmentData.dhi_score > 60 && 'Alvorlig funksjonsnedsettelse'}
                </p>
              )}
            </div>

            {/* Referral */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={assessmentData.referral_needed || false}
                  onChange={(e) => handleChange('referral_needed', e.target.checked)}
                  disabled={readOnly}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Henvisning nødvendig</span>
              </label>
              {assessmentData.referral_needed && (
                <select
                  value={assessmentData.referral_to || ''}
                  onChange={(e) => handleChange('referral_to', e.target.value)}
                  disabled={readOnly}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Velg spesialist...</option>
                  <option value="ØNH">ØNH (Øre-Nese-Hals)</option>
                  <option value="Nevrolog">Nevrolog</option>
                  <option value="Fastlege">Fastlege</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* TREATMENT */}
        {activeSection === 'treatment' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <RotateCw className="w-5 h-5" />
              Behandling & Oppfølging
            </h3>

            {/* Maneuvers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reposisjonsmanøvrer Utført
              </label>
              <div className="space-y-2">
                {[
                  { value: 'epleys_hø', label: 'Epleys manøver høyre' },
                  { value: 'epleys_ve', label: 'Epleys manøver venstre' },
                  { value: 'bbq_hø', label: 'BBQ Roll høyre' },
                  { value: 'bbq_ve', label: 'BBQ Roll venstre' },
                  { value: 'deep_head_hang', label: 'Deep Head Hang (fremre buegang)' },
                  { value: 'semont_hø', label: 'Semont manøver høyre' },
                  { value: 'semont_ve', label: 'Semont manøver venstre' },
                  { value: 'gufoni', label: 'Gufoni manøver' }
                ].map(maneuver => (
                  <label key={maneuver.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assessmentData.maneuvers_performed?.some(m => m.type === maneuver.value) || false}
                      onChange={(e) => {
                        const current = assessmentData.maneuvers_performed || [];
                        const updated = e.target.checked
                          ? [...current, { type: maneuver.value, success: true }]
                          : current.filter(m => m.type !== maneuver.value);
                        handleChange('maneuvers_performed', updated);
                      }}
                      disabled={readOnly}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{maneuver.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* VRT Exercises */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VRT Øvelser (Vestibulær Rehabilitering)
              </label>
              <div className="space-y-2">
                {[
                  { value: 'gaze_stability', label: 'Gaze Stability (feste blikket)' },
                  { value: 'balance', label: 'Balansetrening' },
                  { value: 'opk', label: 'OPK-stimulering (YouTube/app)' },
                  { value: 'brandt_daroff', label: 'Brandt-Daroff habituering' }
                ].map(exercise => (
                  <label key={exercise.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assessmentData.vrt_exercises?.some(e => e.type === exercise.value) || false}
                      onChange={(e) => {
                        const current = assessmentData.vrt_exercises || [];
                        const updated = e.target.checked
                          ? [...current, { type: exercise.value }]
                          : current.filter(ex => ex.type !== exercise.value);
                        handleChange('vrt_exercises', updated);
                      }}
                      disabled={readOnly}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{exercise.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Home Exercises */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hjemmeøvelser / Instruksjoner
              </label>
              <textarea
                value={assessmentData.home_exercises || ''}
                onChange={(e) => handleChange('home_exercises', e.target.value)}
                disabled={readOnly}
                rows={4}
                className="w-full p-2 border rounded-md"
                placeholder="Detaljerte instruksjoner til pasienten..."
              />
            </div>

            {/* Follow-up Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oppfølgingsplan
              </label>
              <textarea
                value={assessmentData.follow_up_plan || ''}
                onChange={(e) => handleChange('follow_up_plan', e.target.value)}
                disabled={readOnly}
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="Kontroll om X dager, reevaluering, etc."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
