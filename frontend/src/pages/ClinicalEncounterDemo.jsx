/**
 * Clinical Encounter Demo - "Scandi-Clinical Modern" Design
 *
 * A professional, clean interface for Norwegian chiropractors
 * featuring split-pane layout, safety alerts, and efficient SOAP documentation
 */

import _React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  Save,
  User,
  Activity,
  Clock,
  Phone,
  Mail,
  _Star,
  Search,
  X,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RegionalBodyDiagram from '../components/examination/RegionalBodyDiagrams';

// --- MOCK DATA FOR DEMO ---
const mockPatient = {
  name: 'Ola Nordmann',
  initials: 'ON',
  age: 45,
  fnr: '120578-12345',
  phone: '+47 912 34 567',
  email: 'ola.nordmann@email.no',
  redFlags: ['Tidligere prolaps L4/L5 (2022)', 'Går på blodfortynnende (Marevan)'],
  contraindications: ['Osteoporose'],
  lastVisit: {
    date: '14. Okt 2024',
    summary:
      'Justering L5, Cervical mobilisering. Rapporterte bedring i korsrygg, men fortsatt stivhet i nakke. VAS 5/10 → 3/10.',
  },
};

const icpcDiagnoses = [
  { value: 'l02', code: 'L02', label: 'Ryggsmerte' },
  { value: 'l03', code: 'L03', label: 'Korsryggsymptom/plage' },
  { value: 'l84', code: 'L84', label: 'Ryggsyndrom uten utstråling' },
  { value: 'l86', code: 'L86', label: 'Isjias/ryggsmerte med utstråling' },
  { value: 'l01', code: 'L01', label: 'Nakkesymptom/plage' },
  { value: 'l83', code: 'L83', label: 'Nakkesyndrom' },
  { value: 'n01', code: 'N01', label: 'Hodepine' },
  { value: 'l08', code: 'L08', label: 'Skuldersymptom/plage' },
];

const taksterNorwegian = [
  { id: 'l214', code: 'L214', name: 'Manipulasjonsbehandling', price: 450 },
  { id: 'l215', code: 'L215', name: 'Bløtvevsbehandling', price: 350 },
  { id: 'l220', code: 'L220', name: 'Tillegg for øvelser/veiledning', price: 150 },
  { id: 'akutt', code: 'AKUTT', name: 'Akutt-tillegg (samme dag)', price: 200 },
];

const quickPhrases = {
  subjective: [
    'Bedring siden sist',
    'Ingen endring',
    'Verre om morgenen',
    'Smerter ved løft',
    'Stivhet etter hvile',
    'Utstråling til ben',
  ],
  objective: [
    'Normal ROM',
    'Redusert fleksjon',
    'Muskelspasme palperes',
    'Triggerpunkt identifisert',
    'Positiv SLR venstre',
    'Positiv SLR høyre',
  ],
};

// ---------------------------

export default function ClinicalEncounterDemo() {
  const navigate = useNavigate();
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [selectedTakster, setSelectedTakster] = useState(['l214']);
  const [subjectiveNotes, setSubjectiveNotes] = useState('');
  const [objectiveNotes, setObjectiveNotes] = useState('');
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [vasStart, setVasStart] = useState(5);
  const [vasEnd, setVasEnd] = useState(3);
  const [followUpWeeks, setFollowUpWeeks] = useState(2);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  const [showTakster, setShowTakster] = useState(false); // Hidden by default for students
  const [selectedRegion, setSelectedRegion] = useState('shoulder');
  const [bilateralFindings, setBilateralFindings] = useState({ left: {}, right: {} });

  const handleQuickPhrase = (phrase, setter) => {
    setter((prev) => `${prev + (prev ? '\n' : '')}• ${phrase}`);
  };

  const toggleDiagnosis = (diagnosis) => {
    setSelectedDiagnoses((prev) => {
      if (prev.find((d) => d.value === diagnosis.value)) {
        return prev.filter((d) => d.value !== diagnosis.value);
      }
      return [...prev, diagnosis];
    });
    setDiagnosisSearch('');
    setShowDiagnosisDropdown(false);
  };

  const toggleTakst = (takstId) => {
    setSelectedTakster((prev) => {
      if (prev.includes(takstId)) {
        return prev.filter((t) => t !== takstId);
      }
      return [...prev, takstId];
    });
  };

  const filteredDiagnoses = icpcDiagnoses.filter(
    (d) =>
      d.code.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
      d.label.toLowerCase().includes(diagnosisSearch.toLowerCase())
  );

  const totalPrice = taksterNorwegian
    .filter((t) => selectedTakster.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const currentDate = new Date().toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* ═══════════════════════════════════════════════════════════════════
          1. LEFT SIDEBAR - PATIENT CONTEXT & SAFETY (Fixed Width)
          ═══════════════════════════════════════════════════════════════════ */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
        {/* Back Button & Patient Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tilbake
          </button>
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
              {mockPatient.initials}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-slate-800">{mockPatient.name}</h2>
              <p className="text-sm text-slate-500">
                {mockPatient.age} år • Fnr: {mockPatient.fnr.substring(0, 6)}-*****
              </p>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <Phone className="h-3 w-3" />
              Ring
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <Mail className="h-3 w-3" />
              SMS
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ⚠️ SAFETY ALERTS - RED FLAGS */}
          {mockPatient.redFlags.length > 0 && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Kliniske Varsler
              </div>
              <ul className="space-y-1">
                {mockPatient.redFlags.map((flag, idx) => (
                  <li key={idx} className="text-sm text-rose-600 flex items-start gap-2">
                    <span className="text-rose-400 mt-1">•</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contraindications */}
          {mockPatient.contraindications?.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Kontraindikasjoner
              </div>
              <ul className="space-y-1">
                {mockPatient.contraindications.map((item, idx) => (
                  <li key={idx} className="text-sm text-amber-600 flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Previous Visit Summary */}
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" />
                Forrige Konsultasjon
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{mockPatient.lastVisit.date}</p>
            </div>
            <div className="p-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                {mockPatient.lastVisit.summary}
              </p>
            </div>
          </div>

          {/* AI Suggestions Preview */}
          <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
            <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm mb-2">
              <Sparkles className="h-4 w-4" />
              AI-forslag
            </div>
            <p className="text-sm text-purple-600">
              Basert på sykehistorie: Vurder L84 (Ryggsyndrom uten utstråling). Anbefalt:
              Manipulasjon + bløtvevsbehandling.
            </p>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN CONTENT - SOAP DOCUMENTATION
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium border border-teal-200">
              <Calendar className="h-3.5 w-3.5" />
              {currentDate}
            </span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Dr. Hansen
            </span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Oppfølging
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-600 text-xs">
              <Activity className="h-3 w-3" />
              Utkast
            </span>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            SCROLLABLE SOAP FORM
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* ─────────────────────────────────────────────────────────────────
                S - SUBJECTIVE
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-blue-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                    S
                  </span>
                  Subjektivt
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">VAS Start:</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={vasStart}
                    onChange={(e) => setVasStart(parseInt(e.target.value))}
                    className="w-20 h-1.5 accent-blue-600"
                  />
                  <span className="text-sm font-semibold text-blue-600 w-6">{vasStart}</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <textarea
                  placeholder="Pasientens beskrivelse av symptomer i dag..."
                  className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  value={subjectiveNotes}
                  onChange={(e) => setSubjectiveNotes(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5">
                  {quickPhrases.subjective.map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => handleQuickPhrase(phrase, setSubjectiveNotes)}
                      className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────────
                O - OBJECTIVE
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                    O
                  </span>
                  Objektivt
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Bilateral Body Examination */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-700">
                      Leddundersøkelse (Bilateral)
                    </h4>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="shoulder">Skulder</option>
                      <option value="knee">Kne</option>
                      <option value="ankle">Ankel</option>
                      <option value="wrist">Håndledd</option>
                      <option value="elbow">Albue</option>
                      <option value="cervical">Nakke</option>
                      <option value="lumbar">Korsrygg</option>
                      <option value="hip">Hofte</option>
                      <option value="tmj">Hode/TMJ</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Side */}
                    <div className="border border-slate-200 rounded-lg p-3 bg-blue-50/30">
                      <h5 className="text-xs font-semibold text-blue-700 mb-2 text-center">
                        VENSTRE
                      </h5>
                      <RegionalBodyDiagram
                        region={selectedRegion}
                        side="left"
                        findings={bilateralFindings.left[selectedRegion] || {}}
                        onFindingsChange={(findings) => {
                          setBilateralFindings((prev) => ({
                            ...prev,
                            left: { ...prev.left, [selectedRegion]: findings },
                          }));
                        }}
                        compact={false}
                      />
                    </div>

                    {/* Right Side */}
                    <div className="border border-slate-200 rounded-lg p-3 bg-red-50/30">
                      <h5 className="text-xs font-semibold text-red-700 mb-2 text-center">HØYRE</h5>
                      <RegionalBodyDiagram
                        region={selectedRegion}
                        side="right"
                        findings={bilateralFindings.right[selectedRegion] || {}}
                        onFindingsChange={(findings) => {
                          setBilateralFindings((prev) => ({
                            ...prev,
                            right: { ...prev.right, [selectedRegion]: findings },
                          }));
                        }}
                        compact={false}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Orthopedic Tests */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-700">Ortopediske Tester</h4>
                    <div className="space-y-2">
                      {[
                        { name: 'Straight Leg Raise (SLR)', type: 'degrees' },
                        { name: 'Slump Test', type: 'checkbox' },
                        { name: "Kemp's Test", type: 'checkbox' },
                        { name: "Patrick's Test", type: 'checkbox' },
                      ].map((test) => (
                        <div
                          key={test.name}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="text-sm text-slate-700">{test.name}</span>
                          {test.type === 'degrees' ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="V"
                                className="w-12 px-2 py-1 text-xs text-center rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder="H"
                                className="w-12 px-2 py-1 text-xs text-center rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button className="px-2 py-0.5 text-xs rounded bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700">
                                Pos
                              </button>
                              <button className="px-2 py-0.5 text-xs rounded bg-white border border-slate-200 hover:bg-slate-100">
                                Neg
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  placeholder="Ytterligere objektive funn..."
                  className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                  value={objectiveNotes}
                  onChange={(e) => setObjectiveNotes(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5">
                  {quickPhrases.objective.map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => handleQuickPhrase(phrase, setObjectiveNotes)}
                      className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────────
                A - ASSESSMENT / DIAGNOSIS
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-amber-500 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                    A
                  </span>
                  Vurdering & Diagnose
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Diagnosis Search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Søk ICPC-2 kode eller diagnose (f.eks. L02, rygg)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      value={diagnosisSearch}
                      onChange={(e) => {
                        setDiagnosisSearch(e.target.value);
                        setShowDiagnosisDropdown(true);
                      }}
                      onFocus={() => setShowDiagnosisDropdown(true)}
                    />
                  </div>

                  {/* Dropdown */}
                  {showDiagnosisDropdown && diagnosisSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
                      {filteredDiagnoses.length > 0 ? (
                        filteredDiagnoses.map((diagnosis) => (
                          <button
                            key={diagnosis.value}
                            onClick={() => toggleDiagnosis(diagnosis)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 flex items-center justify-between"
                          >
                            <span>
                              <span className="font-mono font-medium text-amber-600">
                                {diagnosis.code}
                              </span>
                              <span className="text-slate-600 ml-2">- {diagnosis.label}</span>
                            </span>
                            {selectedDiagnoses.find((d) => d.value === diagnosis.value) && (
                              <Check className="h-4 w-4 text-amber-600" />
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-sm text-slate-500">Ingen diagnose funnet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Diagnoses */}
                {selectedDiagnoses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDiagnoses.map((diagnosis) => (
                      <span
                        key={diagnosis.value}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium"
                      >
                        <span className="font-mono">{diagnosis.code}</span>
                        <span className="text-amber-600">-</span>
                        {diagnosis.label}
                        <button
                          onClick={() => toggleDiagnosis(diagnosis)}
                          className="ml-1 hover:text-amber-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <textarea
                  placeholder="Klinisk resonnering og vurdering..."
                  className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                />
              </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────────
                P - PLAN & TREATMENT (TAKSTER)
                ───────────────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="bg-purple-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
                    P
                  </span>
                  Plan & Behandling
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">VAS Slutt:</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={vasEnd}
                    onChange={(e) => setVasEnd(parseInt(e.target.value))}
                    className="w-20 h-1.5 accent-purple-600"
                  />
                  <span className="text-sm font-semibold text-purple-600 w-6">{vasEnd}</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Takster Selection - Collapsible for students */}
                <div>
                  <button
                    onClick={() => setShowTakster(!showTakster)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 mb-3"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showTakster ? 'rotate-180' : ''}`}
                    />
                    Takster (behandlingskoder)
                    <span className="text-xs text-slate-400 font-normal">(Kun for behandlere)</span>
                  </button>

                  {showTakster && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {taksterNorwegian.map((takst) => (
                          <button
                            key={takst.id}
                            onClick={() => toggleTakst(takst.id)}
                            className={`
                              flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all
                              ${
                                selectedTakster.includes(takst.id)
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`
                                h-5 w-5 rounded flex items-center justify-center
                                ${
                                  selectedTakster.includes(takst.id)
                                    ? 'bg-purple-600 text-white'
                                    : 'border-2 border-slate-300'
                                }
                              `}
                              >
                                {selectedTakster.includes(takst.id) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{takst.code}</p>
                                <p className="text-xs text-slate-500">{takst.name}</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-slate-600">
                              {takst.price} kr
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="mt-3 flex justify-end">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-800">
                          <span className="text-sm">Totalt:</span>
                          <span className="font-bold">{totalPrice} kr</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Follow-up */}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Oppfølging om:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={followUpWeeks}
                      onChange={(e) => setFollowUpWeeks(parseInt(e.target.value))}
                      className="w-16 px-3 py-1.5 text-center rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <span className="text-sm text-slate-600">uker</span>
                  </div>
                  <button className="ml-auto px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                    + Book time nå
                  </button>
                </div>

                <textarea
                  placeholder="Hjemmeøvelser, råd og videre plan..."
                  className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                />
              </div>
            </section>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            STICKY FOOTER - ACTIONS
            ═══════════════════════════════════════════════════════════════════ */}
        <footer className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Activity className="h-4 w-4 text-amber-500" />
              Utkast lagret automatisk
            </span>
            <span className="text-xs text-slate-400">
              Sist oppdatert:{' '}
              {new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
              Avbryt
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Forhåndsvis
            </button>
            <button className="px-6 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm">
              <Save className="h-4 w-4" />
              Signer og Lås Notat
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
