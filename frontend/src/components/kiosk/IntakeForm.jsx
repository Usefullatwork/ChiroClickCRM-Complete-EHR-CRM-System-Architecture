/**
 * IntakeForm - Kiosk Step: Basic health questionnaire for first-visit patients
 * Large touch targets, consent checkboxes, Norwegian UI
 */

import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckSquare, Square } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'Health Questionnaire',
    subtitle: 'Please answer a few questions about your health',
    allergies: 'Do you have any allergies?',
    medications: 'Are you currently taking any medications?',
    surgeries: 'Have you had any surgeries in the last 5 years?',
    pregnant: 'Are you pregnant or might be pregnant?',
    yes: 'Yes',
    no: 'No',
    pleaseSpecify: 'Please specify...',
    consent: 'I consent to chiropractic examination and treatment',
    privacy: 'I have read and accept the privacy policy',
    submit: 'Submit & Continue',
    back: 'Back',
    consentRequired: 'Consent is required to proceed',
  },
  no: {
    title: 'Helseskjema',
    subtitle: 'Vennligst svar pa noen sporsmal om din helse',
    allergies: 'Har du noen allergier?',
    medications: 'Bruker du noen medisiner?',
    surgeries: 'Har du hatt noen operasjoner de siste 5 arene?',
    pregnant: 'Er du gravid eller kan du vaere gravid?',
    yes: 'Ja',
    no: 'Nei',
    pleaseSpecify: 'Vennligst spesifiser...',
    consent: 'Jeg samtykker til kiropraktisk undersokelse og behandling',
    privacy: 'Jeg har lest og aksepterer personvernerkleringen',
    submit: 'Send og fortsett',
    back: 'Tilbake',
    consentRequired: 'Samtykke er palikreved for a fortsette',
  },
};

const YesNoQuestion = ({ label, value, onChange, detailValue, onDetailChange, lang }) => {
  const t = TRANSLATIONS[lang];
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <p className="text-lg font-medium text-slate-800 mb-3">{label}</p>
      <div className="flex gap-3 mb-2">
        <button
          onClick={() => onChange(true)}
          className={`flex-1 py-3 text-lg font-medium rounded-xl transition-all ${
            value === true
              ? 'bg-teal-600 text-white'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          {t.yes}
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 py-3 text-lg font-medium rounded-xl transition-all ${
            value === false
              ? 'bg-teal-600 text-white'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          {t.no}
        </button>
      </div>
      {value === true && (
        <textarea
          value={detailValue || ''}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={t.pleaseSpecify}
          className="w-full mt-2 px-3 py-3 text-base border-2 border-slate-200 rounded-xl resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
          rows={2}
        />
      )}
    </div>
  );
};

export default function IntakeForm({ lang = 'no', onNext, onBack }) {
  const t = TRANSLATIONS[lang];
  const [form, setForm] = useState({
    allergies: null,
    allergiesDetail: '',
    medications: null,
    medicationsDetail: '',
    surgeries: null,
    surgeriesDetail: '',
    pregnant: null,
  });
  const [consentExam, setConsentExam] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const allAnswered =
    form.allergies !== null &&
    form.medications !== null &&
    form.surgeries !== null &&
    form.pregnant !== null;
  const hasConsent = consentExam && consentPrivacy;
  const canSubmit = allAnswered && hasConsent;

  const handleSubmit = () => {
    onNext({
      healthHistory: form,
      consentExam,
      consentPrivacy,
      completedAt: new Date().toISOString(),
    });
  };

  const ConsentCheckbox = ({ checked, onChange, label }) => (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
    >
      {checked ? (
        <CheckSquare className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
      ) : (
        <Square className="w-6 h-6 text-slate-300 flex-shrink-0 mt-0.5" />
      )}
      <span className="text-base text-slate-700">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{t.title}</h1>
        <p className="text-lg text-slate-500">{t.subtitle}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <YesNoQuestion
          label={t.allergies}
          value={form.allergies}
          onChange={(v) => updateField('allergies', v)}
          detailValue={form.allergiesDetail}
          onDetailChange={(v) => updateField('allergiesDetail', v)}
          lang={lang}
        />
        <YesNoQuestion
          label={t.medications}
          value={form.medications}
          onChange={(v) => updateField('medications', v)}
          detailValue={form.medicationsDetail}
          onDetailChange={(v) => updateField('medicationsDetail', v)}
          lang={lang}
        />
        <YesNoQuestion
          label={t.surgeries}
          value={form.surgeries}
          onChange={(v) => updateField('surgeries', v)}
          detailValue={form.surgeriesDetail}
          onDetailChange={(v) => updateField('surgeriesDetail', v)}
          lang={lang}
        />
        <YesNoQuestion
          label={t.pregnant}
          value={form.pregnant}
          onChange={(v) => updateField('pregnant', v)}
          lang={lang}
        />

        {/* Consent section */}
        <div className="border-t border-slate-200 pt-4 mt-4">
          <ConsentCheckbox checked={consentExam} onChange={setConsentExam} label={t.consent} />
          <ConsentCheckbox
            checked={consentPrivacy}
            onChange={setConsentPrivacy}
            label={t.privacy}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-4 bg-slate-100 text-slate-600 text-lg font-medium rounded-2xl hover:bg-slate-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.back}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 py-4 bg-teal-600 text-white text-xl font-bold rounded-2xl hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {t.submit}
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
