/**
 * Red Flag Screening Demo Page
 *
 * Interactive demonstration of the real-time red flag auto-screening system.
 */

import _React, { useState, useMemo } from 'react';
import {
  Globe,
  Shield,
  AlertTriangle,
  _Activity,
  FileText,
  _Thermometer,
  User,
  _Calendar,
  BookOpen,
} from 'lucide-react';
import RedFlagScreeningPanel from '../components/assessment/RedFlagScreeningPanel';
import { useRedFlagScreening, useTextFieldScreening } from '../hooks/useRedFlagScreening';
import {
  getAllRedFlagDefinitions,
  getCategoryLabels,
  _SEVERITY,
  _CATEGORIES,
} from '../services/redFlagScreeningService';

// Example scenarios for testing
const TEST_SCENARIOS = {
  en: [
    {
      name: 'Cauda Equina Syndrome',
      text: 'Patient reports saddle anesthesia with urinary retention. Has been experiencing progressive bilateral leg weakness over the past 24 hours.',
      severity: 'critical',
    },
    {
      name: 'Suspected Malignancy',
      text: 'Patient has a history of breast cancer and now presents with new onset back pain. Reports unexplained weight loss of 10kg over 2 months. Night pain wakes her from sleep.',
      severity: 'high',
    },
    {
      name: 'Possible Infection',
      text: 'Patient is immunocompromised due to chemotherapy. Presents with fever and severe back pain. Recent urinary tract infection 2 weeks ago.',
      severity: 'high',
    },
    {
      name: 'Cervical Arterial Dysfunction',
      text: 'After neck rotation, patient experienced sudden dizziness, diplopia, and numbness in the face. Thunderclap headache described as worst headache ever.',
      severity: 'critical',
    },
    {
      name: 'Normal Presentation',
      text: 'Patient presents with mechanical low back pain, worse with prolonged sitting, better with walking. No radiation. No night pain. Good general health.',
      severity: 'none',
    },
  ],
  no: [
    {
      name: 'Cauda Equina Syndrom',
      text: 'Pasienten rapporterer setelanestesi med urinretensjon. Har opplevd progressiv bilateral beinsvakhet de siste 24 timene.',
      severity: 'critical',
    },
    {
      name: 'Mistenkt Malignitet',
      text: 'Pasienten har krefthistorie med brystkreft og presenterer nå med ny ryggsmerte. Rapporterer uforklarlig vekttap på 10kg over 2 måneder. Nattesmerte vekker henne.',
      severity: 'high',
    },
    {
      name: 'Mulig Infeksjon',
      text: 'Pasienten er immunsvekket på grunn av kjemoterapi. Presenterer med feber og alvorlige ryggsmerter. Nylig urinveisinfeksjon for 2 uker siden.',
      severity: 'high',
    },
    {
      name: 'Cervikal Arteriell Dysfunksjon',
      text: 'Etter nakkerotasjon opplevde pasienten plutselig svimmelhet, diplopi og nummenhet i ansiktet. Tordenskrallhodepine beskrevet som verste hodepine noensinne.',
      severity: 'critical',
    },
    {
      name: 'Normal Presentasjon',
      text: 'Pasienten presenterer med mekanisk korsryggsmerte, verre ved langvarig sitting, bedre ved gange. Ingen utstråling. Ingen nattesmerte. God generell helse.',
      severity: 'none',
    },
  ],
};

export default function RedFlagDemo() {
  const [lang, setLang] = useState('no');
  const [activeTab, setActiveTab] = useState('interactive');

  // Interactive text screening
  const {
    value: textValue,
    setValue: setTextValue,
    flags: textFlags,
    hasCritical,
    hasHigh,
    hasFlags,
  } = useTextFieldScreening('', lang);

  // Patient data screening
  const [patientData, setPatientData] = useState({
    age: 45,
    subjective: {
      chief_complaint: '',
    },
    examination: {
      reflexes: {},
      babinski_left: 'negative',
      babinski_right: 'negative',
    },
    vitals: {
      temperature: '36.5',
    },
  });

  // Full screening hook
  const { _screenFullPatient, flags: _patientFlags, _summary } = useRedFlagScreening({ lang });

  // Get all red flag definitions for reference
  const allDefinitions = useMemo(() => getAllRedFlagDefinitions(lang), [lang]);
  const categoryLabels = useMemo(() => getCategoryLabels(lang), [lang]);

  // Grouped definitions by category
  const definitionsByCategory = useMemo(() => {
    const grouped = {};
    allDefinitions.forEach((def) => {
      if (!grouped[def.category]) {
        grouped[def.category] = [];
      }
      grouped[def.category].push(def);
    });
    return grouped;
  }, [allDefinitions]);

  const t =
    lang === 'no'
      ? {
          title: 'Rødt Flagg Screening Demo',
          subtitle: 'Automatisk oppdagelse av alvorlige patologi-indikatorer',
          tabs: {
            interactive: 'Interaktiv Test',
            scenarios: 'Test Scenarioer',
            reference: 'Referanse',
          },
          interactive: {
            title: 'Skriv inn pasientinformasjon',
            placeholder:
              'Skriv inn pasientens symptomer, historie eller funn her for å se sanntids rødt flagg-screening...',
            detected: 'Røde flagg oppdaget i teksten:',
            noFlags: 'Ingen røde flagg oppdaget',
          },
          scenarios: {
            title: 'Klikk på et scenario for å teste',
            loadScenario: 'Last Scenario',
          },
          reference: {
            title: 'Alle Røde Flagg Definisjoner',
            keywords: 'Nøkkelord',
            action: 'Anbefalt handling',
          },
          patientInfo: {
            age: 'Alder',
            temperature: 'Temperatur',
            reflexes: 'Reflekser',
          },
        }
      : {
          title: 'Red Flag Screening Demo',
          subtitle: 'Automatic detection of serious pathology indicators',
          tabs: {
            interactive: 'Interactive Test',
            scenarios: 'Test Scenarios',
            reference: 'Reference',
          },
          interactive: {
            title: 'Enter patient information',
            placeholder:
              'Type patient symptoms, history, or findings here to see real-time red flag screening...',
            detected: 'Red flags detected in text:',
            noFlags: 'No red flags detected',
          },
          scenarios: {
            title: 'Click a scenario to test',
            loadScenario: 'Load Scenario',
          },
          reference: {
            title: 'All Red Flag Definitions',
            keywords: 'Keywords',
            action: 'Recommended action',
          },
          patientInfo: {
            age: 'Age',
            temperature: 'Temperature',
            reflexes: 'Reflexes',
          },
        };

  const scenarios = TEST_SCENARIOS[lang] || TEST_SCENARIOS.en;

  const loadScenario = (scenario) => {
    setTextValue(scenario.text);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-500" />
                {t.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  hasCritical
                    ? 'bg-red-100 text-red-700'
                    : hasHigh
                      ? 'bg-orange-100 text-orange-700'
                      : hasFlags
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {textFlags.length} {lang === 'no' ? 'flagg' : 'flags'}
                </span>
              </div>

              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{lang === 'no' ? 'Norsk' : 'English'}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            {['interactive', 'scenarios', 'reference'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.tabs[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Interactive Tab */}
        {activeTab === 'interactive' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t.interactive.title}
                  </h2>
                </div>
                <div className="p-4">
                  <textarea
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder={t.interactive.placeholder}
                    className={`w-full h-48 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 transition-all ${
                      hasCritical
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : hasHigh
                          ? 'border-orange-500 focus:ring-orange-500 bg-orange-50'
                          : hasFlags
                            ? 'border-yellow-500 focus:ring-yellow-500 bg-yellow-50'
                            : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />

                  {/* Inline flags display */}
                  {textFlags.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {t.interactive.detected}
                      </p>
                      <div className="space-y-2">
                        {textFlags.map((flag, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border-l-4 ${
                              flag.severity === 'CRITICAL'
                                ? 'bg-red-50 border-red-500'
                                : flag.severity === 'HIGH'
                                  ? 'bg-orange-50 border-orange-500'
                                  : flag.severity === 'MEDIUM'
                                    ? 'bg-yellow-50 border-yellow-500'
                                    : 'bg-blue-50 border-blue-400'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <AlertTriangle
                                className={`w-4 h-4 mt-0.5 ${
                                  flag.severity === 'CRITICAL'
                                    ? 'text-red-600'
                                    : flag.severity === 'HIGH'
                                      ? 'text-orange-600'
                                      : 'text-yellow-600'
                                }`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 text-xs font-bold rounded ${
                                      flag.severity === 'CRITICAL'
                                        ? 'bg-red-600 text-white'
                                        : flag.severity === 'HIGH'
                                          ? 'bg-orange-500 text-white'
                                          : 'bg-yellow-500 text-white'
                                    }`}
                                  >
                                    {flag.severity}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {flag.categoryLabel}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mt-1">{flag.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {textValue && textFlags.length === 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">{t.interactive.noFlags}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Info Quick Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {lang === 'no' ? 'Pasientinformasjon' : 'Patient Information'}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.patientInfo.age}</label>
                    <input
                      type="number"
                      value={patientData.age}
                      onChange={(e) =>
                        setPatientData((prev) => ({ ...prev, age: parseInt(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {t.patientInfo.temperature}
                    </label>
                    <input
                      type="text"
                      value={patientData.vitals.temperature}
                      onChange={(e) =>
                        setPatientData((prev) => ({
                          ...prev,
                          vitals: { ...prev.vitals, temperature: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Babinski</label>
                    <select
                      value={patientData.examination.babinski_left}
                      onChange={(e) =>
                        setPatientData((prev) => ({
                          ...prev,
                          examination: {
                            ...prev.examination,
                            babinski_left: e.target.value,
                            babinski_right: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="negative">{lang === 'no' ? 'Negativ' : 'Negative'}</option>
                      <option value="positive">{lang === 'no' ? 'Positiv' : 'Positive'}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Screening Panel */}
            <div>
              <RedFlagScreeningPanel
                textToScreen={textValue}
                patientData={{
                  ...patientData,
                  subjective: { chief_complaint: textValue },
                }}
                lang={lang}
              />
            </div>
          </div>
        )}

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden cursor-pointer hover:shadow-md transition-all ${
                  scenario.severity === 'critical'
                    ? 'border-red-300'
                    : scenario.severity === 'high'
                      ? 'border-orange-300'
                      : scenario.severity === 'none'
                        ? 'border-green-300'
                        : 'border-gray-200'
                }`}
                onClick={() => {
                  loadScenario(scenario);
                  setActiveTab('interactive');
                }}
              >
                <div
                  className={`px-4 py-3 ${
                    scenario.severity === 'critical'
                      ? 'bg-red-50'
                      : scenario.severity === 'high'
                        ? 'bg-orange-50'
                        : scenario.severity === 'none'
                          ? 'bg-green-50'
                          : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{scenario.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        scenario.severity === 'critical'
                          ? 'bg-red-600 text-white'
                          : scenario.severity === 'high'
                            ? 'bg-orange-500 text-white'
                            : scenario.severity === 'none'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-500 text-white'
                      }`}
                    >
                      {scenario.severity === 'none'
                        ? lang === 'no'
                          ? 'Normal'
                          : 'Normal'
                        : scenario.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{scenario.text}</p>
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    {t.scenarios.loadScenario} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reference Tab */}
        {activeTab === 'reference' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {t.reference.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {lang === 'no'
                  ? `Totalt ${allDefinitions.length} røde flagg-definisjoner på tvers av ${Object.keys(definitionsByCategory).length} kategorier.`
                  : `Total of ${allDefinitions.length} red flag definitions across ${Object.keys(definitionsByCategory).length} categories.`}
              </p>
            </div>

            {Object.entries(definitionsByCategory).map(([category, defs]) => (
              <div
                key={category}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">
                    {categoryLabels[category] || category} ({defs.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {defs.map((def) => (
                    <div key={def.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded flex-shrink-0 ${
                            def.severity === 'CRITICAL'
                              ? 'bg-red-600 text-white'
                              : def.severity === 'HIGH'
                                ? 'bg-orange-500 text-white'
                                : def.severity === 'MEDIUM'
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-blue-500 text-white'
                          }`}
                        >
                          {def.severity}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{def.description}</p>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">{t.reference.keywords}:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {def.keywords.slice(0, 5).map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                >
                                  {kw}
                                </span>
                              ))}
                              {def.keywords.length > 5 && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                                  +{def.keywords.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">{t.reference.action}:</span>
                            <p className="text-sm text-gray-700 mt-1">{def.action}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
