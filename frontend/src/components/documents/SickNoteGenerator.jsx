/**
 * SickNoteGenerator - Norwegian Sick Note (Sykemelding) Generator
 *
 * Creates NAV-compliant sick note documentation for chiropractors.
 * Supports bilingual output (English/Norwegian).
 *
 * Norwegian chiropractors have the authority to issue sick notes
 * for musculoskeletal conditions within their scope of practice.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '../../i18n';
import {
  FileText,
  User,
  Calendar,
  Building2,
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle,
  Printer,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Common ICPC-2 codes for chiropractic practice
const COMMON_DIAGNOSES = [
  { code: 'L01', name: { en: 'Neck symptoms/complaints', no: 'Nakkeplager' } },
  { code: 'L02', name: { en: 'Back symptoms/complaints', no: 'Ryggplager' } },
  { code: 'L03', name: { en: 'Low back symptoms/complaints', no: 'Korsryggplager' } },
  { code: 'L04', name: { en: 'Chest symptoms/complaints', no: 'Brystplager' } },
  { code: 'L08', name: { en: 'Shoulder symptoms/complaints', no: 'Skulderplager' } },
  { code: 'L09', name: { en: 'Arm symptoms/complaints', no: 'Armplager' } },
  { code: 'L12', name: { en: 'Hand/finger symptoms/complaints', no: 'Hånd/fingerplager' } },
  { code: 'L13', name: { en: 'Hip symptoms/complaints', no: 'Hofteplager' } },
  { code: 'L14', name: { en: 'Leg/thigh symptoms/complaints', no: 'Ben/lårplager' } },
  { code: 'L15', name: { en: 'Knee symptoms/complaints', no: 'Kneplager' } },
  { code: 'L83', name: { en: 'Neck syndrome', no: 'Nakkesyndrom' } },
  {
    code: 'L84',
    name: { en: 'Back syndrome without radiating pain', no: 'Ryggsyndrom uten utstråling' },
  },
  {
    code: 'L86',
    name: { en: 'Back syndrome with radiating pain', no: 'Ryggsyndrom med utstråling' },
  },
  { code: 'L87', name: { en: 'Bursitis/tendinitis/synovitis', no: 'Bursitt/tendinitt/synovitt' } },
  { code: 'L92', name: { en: 'Shoulder syndrome', no: 'Skuldersyndrom' } },
  { code: 'N01', name: { en: 'Headache', no: 'Hodepine' } },
  { code: 'N89', name: { en: 'Migraine', no: 'Migrene' } },
  { code: 'H82', name: { en: 'Vertigo syndrome/dizziness', no: 'Svimmelhetsyndrom' } },
];

// Work capacity options
const WORK_CAPACITY_OPTIONS = [
  { value: 100, label: { en: '100% - Full absence', no: '100% - Full sykemelding' } },
  { value: 80, label: { en: '80% absence', no: '80% sykemelding' } },
  { value: 60, label: { en: '60% absence', no: '60% sykemelding' } },
  { value: 50, label: { en: '50% absence', no: '50% sykemelding' } },
  { value: 40, label: { en: '40% absence', no: '40% sykemelding' } },
  { value: 20, label: { en: '20% absence', no: '20% sykemelding' } },
];

// Default sick note data
const getDefaultSickNoteData = () => ({
  // Patient info
  patient: {
    name: '',
    personalId: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    employer: '',
    occupation: '',
  },

  // Clinical info
  clinical: {
    mainDiagnosis: '',
    mainDiagnosisCode: '',
    secondaryDiagnosis: '',
    secondaryDiagnosisCode: '',
    clinicalFindings: '',
    treatmentGiven: '',
  },

  // Sick note period
  period: {
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    workCapacity: 100,
    isRetroactive: false,
    retroactiveFrom: '',
    firstDayAbsent: '',
  },

  // Work restrictions
  restrictions: {
    cannotWork: true,
    restrictedDuties: false,
    restrictionDetails: '',
    ergonomicAdvice: '',
    activityRestrictions: '',
  },

  // Follow-up
  followUp: {
    expectedRecovery: '',
    followUpDate: '',
    treatmentPlan: '',
    referralNeeded: false,
    referralTo: '',
  },

  // Practitioner info (typically pre-filled from settings)
  practitioner: {
    name: '',
    hprNumber: '',
    clinicName: '',
    clinicAddress: '',
    phone: '',
    email: '',
  },
});

// Section Component
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

// Input Field Component
function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 text-gray-500 dark:text-gray-400' : 'bg-white'}
        `}
      />
    </div>
  );
}

// Main SickNoteGenerator Component
export default function SickNoteGenerator({
  language = 'no', // Kept for backwards compat
  initialData = null,
  patientData = null,
  practitionerData = null,
  onSave,
  onSend,
}) {
  const { t, lang } = useTranslation('assessment');

  const [data, setData] = useState(() => {
    const defaultData = initialData || getDefaultSickNoteData();

    // Pre-fill patient data if provided
    if (patientData) {
      defaultData.patient = { ...defaultData.patient, ...patientData };
    }

    // Pre-fill practitioner data if provided
    if (practitionerData) {
      defaultData.practitioner = { ...defaultData.practitioner, ...practitionerData };
    }

    return defaultData;
  });

  const [showPreview, setShowPreview] = useState(false);

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

  // Calculate duration in days
  const durationDays = useMemo(() => {
    if (!data.period.startDate || !data.period.endDate) {
      return 0;
    }
    const start = new Date(data.period.startDate);
    const end = new Date(data.period.endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [data.period.startDate, data.period.endDate]);

  // Get diagnosis display name
  const getDiagnosisName = useCallback(
    (code) => {
      const diagnosis = COMMON_DIAGNOSES.find((d) => d.code === code);
      return diagnosis ? diagnosis.name[lang] : code;
    },
    [lang]
  );

  // Generate printable document
  const generateDocument = useCallback(() => {
    const today = new Date().toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-GB');

    return `
${t('sickNoteTitle', 'Sykemelding').toUpperCase()}
${'='.repeat(60)}

${t('sickNotePatientInfo', 'Pasientopplysninger').toUpperCase()}
${'-'.repeat(30)}
${t('sickNoteName', 'Navn')}: ${data.patient.name}
${t('sickNotePersonalId', 'Fødselsnummer')}: ${data.patient.personalId}
${t('sickNoteDateOfBirth', 'Fødselsdato')}: ${data.patient.dateOfBirth}
${t('sickNoteAddress', 'Adresse')}: ${data.patient.address}
${t('sickNoteEmployer', 'Arbeidsgiver')}: ${data.patient.employer}
${t('sickNoteOccupation', 'Yrke')}: ${data.patient.occupation}

${t('sickNoteDiagnosis', 'Diagnose').toUpperCase()}
${'-'.repeat(30)}
${t('sickNoteMainDiagnosis', 'Hoveddiagnose')}: ${data.clinical.mainDiagnosisCode} - ${getDiagnosisName(data.clinical.mainDiagnosisCode)}
${data.clinical.secondaryDiagnosisCode ? `${t('sickNoteSecondaryDiagnosis', 'Bidiagnose')}: ${data.clinical.secondaryDiagnosisCode} - ${getDiagnosisName(data.clinical.secondaryDiagnosisCode)}` : ''}

${t('sickNoteClinicalFindings', 'Kliniske funn')}:
${data.clinical.clinicalFindings}

${t('sickNotePeriod', 'Sykmeldingsperiode').toUpperCase()}
${'-'.repeat(30)}
${t('sickNoteStartDate', 'Startdato')}: ${data.period.startDate}
${t('sickNoteEndDate', 'Sluttdato')}: ${data.period.endDate}
${t('sickNoteDuration', 'Varighet')}: ${durationDays} ${t('sickNoteDays', 'dager')}
${t('sickNoteWorkCapacity', 'Arbeidsevne')}: ${data.period.workCapacity}%

${data.period.isRetroactive ? `${t('sickNoteRetroactive', 'Tilbakedatert')}: ${data.period.retroactiveFrom}` : ''}

${t('sickNoteActivityRestrictions', 'Aktivitetsbegrensninger').toUpperCase()}
${'-'.repeat(30)}
${
  data.restrictions.cannotWork
    ? t('sickNoteCannotWorkStatement', 'Pasienten kan ikke jobbe i sykmeldingsperioden.')
    : t('sickNoteCanWorkStatement', 'Pasienten kan jobbe med tilrettelegging.')
}

${data.restrictions.restrictionDetails ? `${t('sickNoteActivityRestrictions', 'Aktivitetsbegrensninger')}:\n${data.restrictions.restrictionDetails}` : ''}

${data.restrictions.ergonomicAdvice ? `${t('sickNoteErgonomicAdvice', 'Ergonomiske råd')}:\n${data.restrictions.ergonomicAdvice}` : ''}

${t('sickNoteFollowUp', 'Oppfølging').toUpperCase()}
${'-'.repeat(30)}
${t('sickNoteExpectedRecovery', 'Forventet bedring')}: ${data.followUp.expectedRecovery}
${data.followUp.followUpDate ? `${t('sickNoteFollowUpDate', 'Oppfølgingsdato')}: ${data.followUp.followUpDate}` : ''}
${data.followUp.treatmentPlan ? `${t('sickNoteTreatmentPlan', 'Behandlingsplan')}:\n${data.followUp.treatmentPlan}` : ''}

${t('sickNoteAttestation', 'Behandlerattestasjon').toUpperCase()}
${'-'.repeat(30)}
${data.practitioner.name}
${t('sickNoteChiropractor', 'Kiropraktor')}
${t('sickNoteLicenseNumber', 'HPR-nummer')}: ${data.practitioner.hprNumber}
${data.practitioner.clinicName}
${data.practitioner.clinicAddress}
${t('sickNotePhone', 'Telefon')}: ${data.practitioner.phone}

${t('sickNoteDate', 'Dato')}: ${today}

${'='.repeat(60)}
    `.trim();
  }, [data, lang, t, durationDays, getDiagnosisName]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(generateDocument());
  }, [generateDocument]);

  // Print document
  const printDocument = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('sickNoteTitle', 'Sykemelding')}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <pre>${generateDocument()}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [generateDocument, t]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(data);
    }
  }, [data, onSave]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-blue-600" />
              {t('sickNoteTitle', 'Sykemelding')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('sickNoteSubtitle', 'NAV-kompatibel sykmeldingsdokumentasjon')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPreview
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t('sickNotePreview', 'Forhåndsvis')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {showPreview ? (
          /* Preview Mode */
          <div className="bg-gray-50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {generateDocument()}
            </pre>
          </div>
        ) : (
          /* Edit Mode */
          <>
            {/* Patient Information */}
            <Section title={t('sickNotePatientInfo', 'Pasientopplysninger')} icon={User}>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={t('sickNoteName', 'Navn')}
                  value={data.patient.name}
                  onChange={(v) => updateSection('patient', 'name', v)}
                  required
                />
                <InputField
                  label={t('sickNotePersonalId', 'Fødselsnummer')}
                  value={data.patient.personalId}
                  onChange={(v) => updateSection('patient', 'personalId', v)}
                  placeholder={t('sickNotePersonalIdPlaceholder', '11 siffer')}
                  required
                />
                <InputField
                  label={t('sickNoteDateOfBirth', 'Fødselsdato')}
                  type="date"
                  value={data.patient.dateOfBirth}
                  onChange={(v) => updateSection('patient', 'dateOfBirth', v)}
                />
                <InputField
                  label={t('sickNoteAddress', 'Adresse')}
                  value={data.patient.address}
                  onChange={(v) => updateSection('patient', 'address', v)}
                />
                <InputField
                  label={t('sickNoteEmployer', 'Arbeidsgiver')}
                  value={data.patient.employer}
                  onChange={(v) => updateSection('patient', 'employer', v)}
                />
                <InputField
                  label={t('sickNoteOccupation', 'Yrke')}
                  value={data.patient.occupation}
                  onChange={(v) => updateSection('patient', 'occupation', v)}
                />
              </div>
            </Section>

            {/* Diagnosis */}
            <Section title={t('sickNoteDiagnosis', 'Diagnose')} icon={Stethoscope}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('sickNoteMainDiagnosis', 'Hoveddiagnose')} (ICPC-2)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={data.clinical.mainDiagnosisCode}
                      onChange={(e) =>
                        updateSection('clinical', 'mainDiagnosisCode', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">{t('sickNoteSelectDiagnosis', 'Velg diagnose...')}</option>
                      {COMMON_DIAGNOSES.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('sickNoteSecondaryDiagnosis', 'Bidiagnose')} (ICPC-2)
                    </label>
                    <select
                      value={data.clinical.secondaryDiagnosisCode}
                      onChange={(e) =>
                        updateSection('clinical', 'secondaryDiagnosisCode', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">{t('none', 'Ingen')}</option>
                      {COMMON_DIAGNOSES.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sickNoteClinicalFindings', 'Kliniske funn')}
                  </label>
                  <textarea
                    value={data.clinical.clinicalFindings}
                    onChange={(e) => updateSection('clinical', 'clinicalFindings', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                    placeholder={t(
                      'sickNoteClinicalFindingsPlaceholder',
                      'Beskriv kliniske funn som støtter diagnosen...'
                    )}
                  />
                </div>
              </div>
            </Section>

            {/* Period */}
            <Section title={t('sickNotePeriod', 'Sykmeldingsperiode')} icon={Calendar}>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <InputField
                    label={t('sickNoteStartDate', 'Startdato')}
                    type="date"
                    value={data.period.startDate}
                    onChange={(v) => updateSection('period', 'startDate', v)}
                    required
                  />
                  <InputField
                    label={t('sickNoteEndDate', 'Sluttdato')}
                    type="date"
                    value={data.period.endDate}
                    onChange={(v) => updateSection('period', 'endDate', v)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('sickNoteDuration', 'Varighet')}
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
                      {durationDays} {t('sickNoteDays', 'dager')}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sickNoteWorkCapacity', 'Arbeidsevne')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WORK_CAPACITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateSection('period', 'workCapacity', option.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          data.period.workCapacity === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label[lang]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.period.isRetroactive}
                      onChange={(e) => updateSection('period', 'isRetroactive', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{t('sickNoteRetroactive', 'Tilbakedatert')}</span>
                  </label>
                  {data.period.isRetroactive && (
                    <InputField
                      label=""
                      type="date"
                      value={data.period.retroactiveFrom}
                      onChange={(v) => updateSection('period', 'retroactiveFrom', v)}
                    />
                  )}
                </div>
              </div>
            </Section>

            {/* Work Restrictions */}
            <Section
              title={t('sickNoteActivityRestrictions', 'Aktivitetsbegrensninger')}
              icon={AlertTriangle}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="workStatus"
                      checked={data.restrictions.cannotWork}
                      onChange={() => {
                        updateSection('restrictions', 'cannotWork', true);
                        updateSection('restrictions', 'restrictedDuties', false);
                      }}
                      className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{t('sickNoteCannotWork', 'Kan ikke jobbe')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="workStatus"
                      checked={data.restrictions.restrictedDuties}
                      onChange={() => {
                        updateSection('restrictions', 'cannotWork', false);
                        updateSection('restrictions', 'restrictedDuties', true);
                      }}
                      className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      {t('sickNoteRestrictedDuties', 'Tilrettelagte oppgaver')}
                    </span>
                  </label>
                </div>

                {data.restrictions.restrictedDuties && (
                  <textarea
                    value={data.restrictions.restrictionDetails}
                    onChange={(e) =>
                      updateSection('restrictions', 'restrictionDetails', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                    placeholder={t(
                      'sickNoteRestrictionDetailsPlaceholder',
                      'Beskriv hvilke arbeidsoppgaver pasienten kan utføre...'
                    )}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sickNoteErgonomicAdvice', 'Ergonomiske råd')}
                  </label>
                  <textarea
                    value={data.restrictions.ergonomicAdvice}
                    onChange={(e) =>
                      updateSection('restrictions', 'ergonomicAdvice', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                    placeholder={t(
                      'sickNoteErgonomicAdvicePlaceholder',
                      'Ergonomiske råd til arbeidsgiver...'
                    )}
                  />
                </div>
              </div>
            </Section>

            {/* Follow-up */}
            <Section title={t('sickNoteFollowUp', 'Oppfølging')} icon={Clock} defaultOpen={false}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('sickNoteExpectedRecovery', 'Forventet bedring')}
                    </label>
                    <select
                      value={data.followUp.expectedRecovery}
                      onChange={(e) =>
                        updateSection('followUp', 'expectedRecovery', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">{t('sickNoteSelectOption', 'Velg...')}</option>
                      <option value="1-2-weeks">{t('sickNote1to2Weeks', '1-2 uker')}</option>
                      <option value="2-4-weeks">{t('sickNote2to4Weeks', '2-4 uker')}</option>
                      <option value="4-8-weeks">{t('sickNote4to8Weeks', '4-8 uker')}</option>
                      <option value="8-12-weeks">{t('sickNote8to12Weeks', '8-12 uker')}</option>
                      <option value="uncertain">{t('sickNoteUncertain', 'Usikkert')}</option>
                    </select>
                  </div>
                  <InputField
                    label={t('sickNoteFollowUpDate', 'Oppfølgingsdato')}
                    type="date"
                    value={data.followUp.followUpDate}
                    onChange={(v) => updateSection('followUp', 'followUpDate', v)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sickNoteTreatmentPlan', 'Behandlingsplan')}
                  </label>
                  <textarea
                    value={data.followUp.treatmentPlan}
                    onChange={(e) => updateSection('followUp', 'treatmentPlan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                    placeholder={t('sickNoteTreatmentPlanPlaceholder', 'Videre behandlingsplan...')}
                  />
                </div>
              </div>
            </Section>

            {/* Practitioner Info */}
            <Section
              title={t('sickNoteAttestation', 'Behandlerattestasjon')}
              icon={Building2}
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={t('sickNoteAttestedBy', 'Attestert av')}
                  value={data.practitioner.name}
                  onChange={(v) => updateSection('practitioner', 'name', v)}
                  required
                />
                <InputField
                  label={t('sickNoteLicenseNumber', 'HPR-nummer')}
                  value={data.practitioner.hprNumber}
                  onChange={(v) => updateSection('practitioner', 'hprNumber', v)}
                  placeholder="HPR-nummer"
                  required
                />
                <InputField
                  label={t('sickNoteClinicName', 'Klinikknavn')}
                  value={data.practitioner.clinicName}
                  onChange={(v) => updateSection('practitioner', 'clinicName', v)}
                />
                <InputField
                  label={t('sickNoteClinicAddress', 'Klinikkadresse')}
                  value={data.practitioner.clinicAddress}
                  onChange={(v) => updateSection('practitioner', 'clinicAddress', v)}
                />
                <InputField
                  label={t('sickNotePhone', 'Telefon')}
                  value={data.practitioner.phone}
                  onChange={(v) => updateSection('practitioner', 'phone', v)}
                />
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" />
              {t('copy', 'Kopier')}
            </button>
            <button
              onClick={printDocument}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              {t('sickNotePrint', 'Skriv ut')}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4" />
              {t('save', 'Lagre')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export helper
export { getDefaultSickNoteData, COMMON_DIAGNOSES };
