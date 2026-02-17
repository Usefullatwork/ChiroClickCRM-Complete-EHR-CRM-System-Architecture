/**
 * SOAPNoteTemplate Component
 *
 * Structured SOAP note template for clinical documentation.
 * Subjective, Objective, Assessment, Plan format.
 */

import _React, { useMemo, useState } from 'react';
import {
  MessageSquare,
  Stethoscope,
  ClipboardCheck,
  ListTodo,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  _AlertCircle,
  CheckCircle,
} from 'lucide-react';

// Pre-defined templates for common sections
const SUBJECTIVE_TEMPLATES = {
  initial: {
    name: 'Initial Visit',
    nameNo: 'Førstegangsbesøk',
    template: {
      en: 'Patient presents with {chief_complaint} for {duration}. Pain is {intensity}/10. {aggravating_factors} aggravate symptoms. {relieving_factors} provide relief.',
      no: 'Pasienten kommer med {chief_complaint} i {duration}. Smerte er {intensity}/10. {aggravating_factors} forverrer symptomene. {relieving_factors} gir lindring.',
    },
  },
  followUp: {
    name: 'Follow-up Visit',
    nameNo: 'Oppfølgingsbesøk',
    template: {
      en: 'Patient returns for follow-up. Reports {progress}% improvement since last visit. Current pain level is {intensity}/10.',
      no: 'Pasienten kommer til oppfølging. Rapporterer {progress}% bedring siden forrige besøk. Nåværende smertenivå er {intensity}/10.',
    },
  },
  maintenance: {
    name: 'Maintenance Visit',
    nameNo: 'Vedlikeholdsbesøk',
    template: {
      en: 'Routine maintenance visit. Patient reports stable condition with {intensity}/10 pain level.',
      no: 'Rutinemessig vedlikeholdsbesøk. Pasienten rapporterer stabil tilstand med {intensity}/10 smertenivå.',
    },
  },
};

const ASSESSMENT_TEMPLATES = {
  improving: {
    name: 'Improving',
    nameNo: 'Bedring',
    template: {
      en: 'Patient is responding well to treatment. Objective findings show improvement in {findings}. Continue current treatment plan.',
      no: 'Pasienten responderer godt på behandling. Objektive funn viser bedring i {findings}. Fortsett nåværende behandlingsplan.',
    },
  },
  stable: {
    name: 'Stable',
    nameNo: 'Stabil',
    template: {
      en: 'Condition remains stable. No significant changes noted since last visit. Monitoring recommended.',
      no: 'Tilstanden er stabil. Ingen betydelige endringer siden forrige besøk. Overvåkning anbefales.',
    },
  },
  worsening: {
    name: 'Worsening',
    nameNo: 'Forverring',
    template: {
      en: 'Patient shows signs of worsening. Consider modifying treatment approach or additional diagnostics.',
      no: 'Pasienten viser tegn på forverring. Vurder å endre behandlingstilnærming eller tilleggsdiagnostikk.',
    },
  },
};

// Phase of care options
const CARE_PHASES = [
  { id: 'acute', name: 'Acute/Initial', nameNo: 'Akutt/Initial', color: 'bg-red-100 text-red-700' },
  {
    id: 'corrective',
    name: 'Corrective',
    nameNo: 'Korrigerende',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    nameNo: 'Vedlikehold',
    color: 'bg-green-100 text-green-700',
  },
  { id: 'wellness', name: 'Wellness', nameNo: 'Velvære', color: 'bg-blue-100 text-blue-700' },
];

// Treatment options
const TREATMENT_OPTIONS = [
  { id: 'smt', name: 'Spinal Manipulation', nameNo: 'Spinal manipulasjon' },
  { id: 'mobilization', name: 'Mobilization', nameNo: 'Mobilisering' },
  { id: 'soft_tissue', name: 'Soft Tissue Therapy', nameNo: 'Bløtvevsbehandling' },
  { id: 'exercise', name: 'Therapeutic Exercise', nameNo: 'Terapeutiske øvelser' },
  { id: 'stretching', name: 'Stretching', nameNo: 'Tøying' },
  { id: 'heat', name: 'Heat Therapy', nameNo: 'Varmebehandling' },
  { id: 'ice', name: 'Ice/Cryotherapy', nameNo: 'Is/Kryoterapi' },
  { id: 'ultrasound', name: 'Ultrasound', nameNo: 'Ultralyd' },
  { id: 'tens', name: 'TENS', nameNo: 'TENS' },
  { id: 'traction', name: 'Traction', nameNo: 'Traksjon' },
  { id: 'dry_needling', name: 'Dry Needling', nameNo: 'Tørrnåling' },
  { id: 'taping', name: 'Kinesio Taping', nameNo: 'Kinesiotaping' },
  { id: 'ergonomic', name: 'Ergonomic Advice', nameNo: 'Ergonomisk rådgivning' },
  { id: 'education', name: 'Patient Education', nameNo: 'Pasientopplæring' },
];

/**
 * Section header component
 */
function SectionHeader({ icon: Icon, title, titleNo, lang, expanded, onToggle, hasContent }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-t-lg
                 ${hasContent ? 'bg-teal-50' : 'bg-gray-50'} hover:bg-opacity-80 transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${hasContent ? 'bg-teal-100' : 'bg-gray-200'}`}
        >
          <Icon className={`w-4 h-4 ${hasContent ? 'text-teal-600' : 'text-gray-500'}`} />
        </div>
        <span className="font-semibold text-gray-700">{lang === 'no' ? titleNo : title}</span>
        {hasContent && <CheckCircle className="w-4 h-4 text-green-500" />}
      </div>
      {expanded ? (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );
}

/**
 * Template selector buttons
 */
function TemplateSelector({ templates, onSelect, lang }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="text-xs text-gray-500 self-center mr-1">
        {lang === 'no' ? 'Maler:' : 'Templates:'}
      </span>
      {Object.entries(templates).map(([key, template]) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(template.template[lang === 'no' ? 'no' : 'en'])}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600
                    rounded transition-colors"
        >
          {lang === 'no' ? template.nameNo : template.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Subjective section
 */
function SubjectiveSection({ values, onChange, lang, expanded, onToggle }) {
  const hasContent = !!(values.chiefComplaint || values.history || values.symptoms);

  const handleTemplateSelect = (template) => {
    onChange({ ...values, history: (values.history || '') + template });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <SectionHeader
        icon={MessageSquare}
        title="Subjective"
        titleNo="Subjektiv"
        lang={lang}
        expanded={expanded}
        onToggle={onToggle}
        hasContent={hasContent}
      />

      {expanded && (
        <div className="p-4 space-y-4 bg-white">
          <TemplateSelector
            templates={SUBJECTIVE_TEMPLATES}
            onSelect={handleTemplateSelect}
            lang={lang}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Hovedklage' : 'Chief Complaint'}
            </label>
            <input
              type="text"
              value={values.chiefComplaint || ''}
              onChange={(e) => onChange({ ...values, chiefComplaint: e.target.value })}
              placeholder={
                lang === 'no' ? 'Pasientens hovedproblem...' : "Patient's main problem..."
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Sykehistorie' : 'History of Present Illness'}
            </label>
            <textarea
              value={values.history || ''}
              onChange={(e) => onChange({ ...values, history: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Beskriv symptomenes utvikling...'
                  : 'Describe symptom progression...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={4}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'no' ? 'Smerteintensitet (VAS)' : 'Pain Intensity (VAS)'}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={values.painLevel || ''}
                onChange={(e) => onChange({ ...values, painLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="0-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'no' ? 'Varighet' : 'Duration'}
              </label>
              <input
                type="text"
                value={values.duration || ''}
                onChange={(e) => onChange({ ...values, duration: e.target.value })}
                placeholder={lang === 'no' ? 'f.eks. 2 uker' : 'e.g. 2 weeks'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Pasientens mål' : "Patient's Goals"}
            </label>
            <input
              type="text"
              value={values.patientGoals || ''}
              onChange={(e) => onChange({ ...values, patientGoals: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Hva ønsker pasienten å oppnå?'
                  : 'What does the patient want to achieve?'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Objective section
 */
function ObjectiveSection({ values, onChange, lang, expanded, onToggle }) {
  const hasContent = !!(
    values.vitalSigns ||
    values.observation ||
    values.palpation ||
    values.rom ||
    values.orthopedic ||
    values.neurological
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <SectionHeader
        icon={Stethoscope}
        title="Objective"
        titleNo="Objektiv"
        lang={lang}
        expanded={expanded}
        onToggle={onToggle}
        hasContent={hasContent}
      />

      {expanded && (
        <div className="p-4 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Observasjon' : 'Observation'}
            </label>
            <textarea
              value={values.observation || ''}
              onChange={(e) => onChange({ ...values, observation: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Holdning, gange, bevegelsesmønster...'
                  : 'Posture, gait, movement patterns...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Palpasjon' : 'Palpation'}
            </label>
            <textarea
              value={values.palpation || ''}
              onChange={(e) => onChange({ ...values, palpation: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Muskelspenning, triggerpunkter, leddblokkeringer...'
                  : 'Muscle tension, trigger points, joint restrictions...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Leddutslag (ROM)' : 'Range of Motion'}
            </label>
            <textarea
              value={values.rom || ''}
              onChange={(e) => onChange({ ...values, rom: e.target.value })}
              placeholder={
                lang === 'no' ? 'Beskrivelse av ROM-funn...' : 'Description of ROM findings...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Ortopediske tester' : 'Orthopedic Tests'}
            </label>
            <textarea
              value={values.orthopedic || ''}
              onChange={(e) => onChange({ ...values, orthopedic: e.target.value })}
              placeholder={
                lang === 'no' ? 'Utførte tester og resultater...' : 'Tests performed and results...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Nevrologisk undersøkelse' : 'Neurological Examination'}
            </label>
            <textarea
              value={values.neurological || ''}
              onChange={(e) => onChange({ ...values, neurological: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Reflekser, sensibilitet, muskelkraft...'
                  : 'Reflexes, sensation, muscle strength...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Assessment section
 */
function AssessmentSection({ values, onChange, lang, expanded, onToggle }) {
  const hasContent = !!(values.diagnosis || values.clinicalImpression || values.prognosis);

  const handleTemplateSelect = (template) => {
    onChange({ ...values, clinicalImpression: (values.clinicalImpression || '') + template });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <SectionHeader
        icon={ClipboardCheck}
        title="Assessment"
        titleNo="Vurdering"
        lang={lang}
        expanded={expanded}
        onToggle={onToggle}
        hasContent={hasContent}
      />

      {expanded && (
        <div className="p-4 space-y-4 bg-white">
          <TemplateSelector
            templates={ASSESSMENT_TEMPLATES}
            onSelect={handleTemplateSelect}
            lang={lang}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Diagnose(r)' : 'Diagnosis/Diagnoses'}
            </label>
            <input
              type="text"
              value={values.diagnosis || ''}
              onChange={(e) => onChange({ ...values, diagnosis: e.target.value })}
              placeholder={
                lang === 'no' ? 'ICD-10 eller ICPC kode(r)...' : 'ICD-10 or ICPC code(s)...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Klinisk vurdering' : 'Clinical Impression'}
            </label>
            <textarea
              value={values.clinicalImpression || ''}
              onChange={(e) => onChange({ ...values, clinicalImpression: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Sammendrag av funn og vurdering...'
                  : 'Summary of findings and assessment...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'no' ? 'Behandlingsfase' : 'Phase of Care'}
              </label>
              <div className="flex flex-wrap gap-2">
                {CARE_PHASES.map((phase) => (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => onChange({ ...values, carePhase: phase.id })}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors
                               ${values.carePhase === phase.id ? `${phase.color} border-current` : 'bg-white border-gray-200 text-gray-600'}`}
                  >
                    {lang === 'no' ? phase.nameNo : phase.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'no' ? 'Prognose' : 'Prognosis'}
              </label>
              <select
                value={values.prognosis || ''}
                onChange={(e) => onChange({ ...values, prognosis: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">{lang === 'no' ? '-- Velg --' : '-- Select --'}</option>
                <option value="excellent">{lang === 'no' ? 'Utmerket' : 'Excellent'}</option>
                <option value="good">{lang === 'no' ? 'God' : 'Good'}</option>
                <option value="fair">{lang === 'no' ? 'Moderat' : 'Fair'}</option>
                <option value="guarded">{lang === 'no' ? 'Usikker' : 'Guarded'}</option>
                <option value="poor">{lang === 'no' ? 'Dårlig' : 'Poor'}</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Plan section
 */
function PlanSection({ values, onChange, lang, expanded, onToggle }) {
  const hasContent = !!(
    values.treatmentGiven?.length ||
    values.homeInstructions ||
    values.followUp
  );

  const toggleTreatment = (id) => {
    const current = values.treatmentGiven || [];
    if (current.includes(id)) {
      onChange({ ...values, treatmentGiven: current.filter((t) => t !== id) });
    } else {
      onChange({ ...values, treatmentGiven: [...current, id] });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <SectionHeader
        icon={ListTodo}
        title="Plan"
        titleNo="Plan"
        lang={lang}
        expanded={expanded}
        onToggle={onToggle}
        hasContent={hasContent}
      />

      {expanded && (
        <div className="p-4 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'no' ? 'Behandling utført' : 'Treatment Given'}
            </label>
            <div className="flex flex-wrap gap-2">
              {TREATMENT_OPTIONS.map((treatment) => (
                <button
                  key={treatment.id}
                  type="button"
                  onClick={() => toggleTreatment(treatment.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors
                             ${
                               (values.treatmentGiven || []).includes(treatment.id)
                                 ? 'bg-teal-100 border-teal-300 text-teal-700'
                                 : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                             }`}
                >
                  {lang === 'no' ? treatment.nameNo : treatment.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Behandlingsnotater' : 'Treatment Notes'}
            </label>
            <textarea
              value={values.treatmentNotes || ''}
              onChange={(e) => onChange({ ...values, treatmentNotes: e.target.value })}
              placeholder={
                lang === 'no' ? 'Detaljer om behandlingen...' : 'Details about treatment...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Hjemmeøvelser / Instruksjoner' : 'Home Exercises / Instructions'}
            </label>
            <textarea
              value={values.homeInstructions || ''}
              onChange={(e) => onChange({ ...values, homeInstructions: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Øvelser, is/varme, aktivitetsmodifisering...'
                  : 'Exercises, ice/heat, activity modification...'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'no' ? 'Neste time' : 'Follow-up'}
              </label>
              <input
                type="text"
                value={values.followUp || ''}
                onChange={(e) => onChange({ ...values, followUp: e.target.value })}
                placeholder={lang === 'no' ? 'f.eks. om 1 uke' : 'e.g. in 1 week'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'no' ? 'Antall behandlinger anbefalt' : 'Recommended Visits'}
              </label>
              <input
                type="text"
                value={values.recommendedVisits || ''}
                onChange={(e) => onChange({ ...values, recommendedVisits: e.target.value })}
                placeholder={lang === 'no' ? 'f.eks. 6-8 behandlinger' : 'e.g. 6-8 visits'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'no' ? 'Henvisning / Tiltak' : 'Referral / Actions'}
            </label>
            <textarea
              value={values.referral || ''}
              onChange={(e) => onChange({ ...values, referral: e.target.value })}
              placeholder={
                lang === 'no'
                  ? 'Eventuell henvisning til annen behandler, bildediagnostikk, etc.'
                  : 'Any referral to other provider, imaging, etc.'
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main SOAPNoteTemplate component
 */
export default function SOAPNoteTemplate({
  values = {},
  onChange,
  lang = 'no',
  _readOnly = false,
  onGenerateNarrative,
}) {
  const [expandedSections, setExpandedSections] = useState(
    new Set(['subjective', 'objective', 'assessment', 'plan'])
  );

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionChange = (section, sectionValues) => {
    onChange({ ...values, [section]: sectionValues });
  };

  // Generate complete SOAP narrative
  const generateNarrative = useMemo(() => {
    const parts = [];

    // Subjective
    if (values.subjective?.chiefComplaint || values.subjective?.history) {
      let s = `S: `;
      if (values.subjective.chiefComplaint) {
        s += `${values.subjective.chiefComplaint}. `;
      }
      if (values.subjective.history) {
        s += values.subjective.history;
      }
      if (values.subjective.painLevel) {
        s += ` VAS: ${values.subjective.painLevel}/10.`;
      }
      parts.push(s.trim());
    }

    // Objective
    if (values.objective?.observation || values.objective?.palpation || values.objective?.rom) {
      let o = `O: `;
      if (values.objective.observation) {
        o += `${values.objective.observation} `;
      }
      if (values.objective.palpation) {
        o += `${values.objective.palpation} `;
      }
      if (values.objective.rom) {
        o += `ROM: ${values.objective.rom} `;
      }
      if (values.objective.orthopedic) {
        o += `${values.objective.orthopedic} `;
      }
      if (values.objective.neurological) {
        o += values.objective.neurological;
      }
      parts.push(o.trim());
    }

    // Assessment
    if (values.assessment?.diagnosis || values.assessment?.clinicalImpression) {
      let a = `A: `;
      if (values.assessment.diagnosis) {
        a += `${values.assessment.diagnosis}. `;
      }
      if (values.assessment.clinicalImpression) {
        a += values.assessment.clinicalImpression;
      }
      parts.push(a.trim());
    }

    // Plan
    if (values.plan?.treatmentGiven?.length || values.plan?.homeInstructions) {
      let p = `P: `;
      if (values.plan.treatmentGiven?.length) {
        const treatments = values.plan.treatmentGiven
          .map((id) => TREATMENT_OPTIONS.find((t) => t.id === id))
          .filter(Boolean)
          .map((t) => (lang === 'no' ? t.nameNo : t.name))
          .join(', ');
        p += `${lang === 'no' ? 'Behandling' : 'Treatment'}: ${treatments}. `;
      }
      if (values.plan.homeInstructions) {
        p += `${lang === 'no' ? 'Hjemmeøvelser' : 'Home exercises'}: ${values.plan.homeInstructions} `;
      }
      if (values.plan.followUp) {
        p += `${lang === 'no' ? 'Oppfølging' : 'Follow-up'}: ${values.plan.followUp}`;
      }
      parts.push(p.trim());
    }

    return parts.join('\n\n');
  }, [values, lang]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateNarrative);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'SOAP-notat' : 'SOAP Note'}
          </h3>
          <p className="text-sm text-gray-500">
            {lang === 'no'
              ? 'Strukturert klinisk dokumentasjon'
              : 'Structured clinical documentation'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg
                      hover:bg-gray-50 flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            {lang === 'no' ? 'Kopier' : 'Copy'}
          </button>
          {onGenerateNarrative && (
            <button
              onClick={() => onGenerateNarrative(generateNarrative)}
              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg
                        hover:bg-teal-700 flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              {lang === 'no' ? 'Generer tekst' : 'Generate Text'}
            </button>
          )}
        </div>
      </div>

      {/* SOAP Sections */}
      <div className="space-y-3">
        <SubjectiveSection
          values={values.subjective || {}}
          onChange={(v) => handleSectionChange('subjective', v)}
          lang={lang}
          expanded={expandedSections.has('subjective')}
          onToggle={() => toggleSection('subjective')}
        />

        <ObjectiveSection
          values={values.objective || {}}
          onChange={(v) => handleSectionChange('objective', v)}
          lang={lang}
          expanded={expandedSections.has('objective')}
          onToggle={() => toggleSection('objective')}
        />

        <AssessmentSection
          values={values.assessment || {}}
          onChange={(v) => handleSectionChange('assessment', v)}
          lang={lang}
          expanded={expandedSections.has('assessment')}
          onToggle={() => toggleSection('assessment')}
        />

        <PlanSection
          values={values.plan || {}}
          onChange={(v) => handleSectionChange('plan', v)}
          lang={lang}
          expanded={expandedSections.has('plan')}
          onToggle={() => toggleSection('plan')}
        />
      </div>

      {/* Preview */}
      {generateNarrative && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {lang === 'no' ? 'Forhåndsvisning' : 'Preview'}
          </h4>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
            {generateNarrative}
          </pre>
        </div>
      )}
    </div>
  );
}

export { SUBJECTIVE_TEMPLATES, ASSESSMENT_TEMPLATES, CARE_PHASES, TREATMENT_OPTIONS };
