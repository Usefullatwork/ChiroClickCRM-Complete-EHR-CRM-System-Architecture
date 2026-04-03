/**
 * ReferralLetterGenerator - Medical Referral Letter Generator
 *
 * Creates professional referral letters for:
 * - General Practitioners (Fastlege)
 * - Specialists (Orthopedic, Neurology)
 * - Radiology (X-ray, MRI, CT)
 * - Physiotherapy
 *
 * Supports bilingual output (English/Norwegian).
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n';
import {
  FileText,
  User,
  Building2,
  Send,
  Stethoscope,
  ImageIcon,
  Activity,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
  AlertCircle,
  Clock,
  FileDown,
} from 'lucide-react';
import { pdfAPI } from '../../services/api/billing';

// Referral types
const REFERRAL_TYPES = {
  gp: { icon: Stethoscope, color: 'blue' },
  orthopedic: { icon: Activity, color: 'purple' },
  neurology: { icon: Activity, color: 'indigo' },
  radiology: { icon: ImageIcon, color: 'green' },
  physio: { icon: Activity, color: 'orange' },
};

// Common imaging request options
const IMAGING_OPTIONS = [
  { value: 'xray_cervical', label: { en: 'X-Ray Cervical Spine', no: 'Røntgen cervicalcolumna' } },
  { value: 'xray_thoracic', label: { en: 'X-Ray Thoracic Spine', no: 'Røntgen thoracalcolumna' } },
  { value: 'xray_lumbar', label: { en: 'X-Ray Lumbar Spine', no: 'Røntgen lumbalcolumna' } },
  { value: 'xray_pelvis', label: { en: 'X-Ray Pelvis/SI Joints', no: 'Røntgen bekken/SI-ledd' } },
  { value: 'xray_shoulder', label: { en: 'X-Ray Shoulder', no: 'Røntgen skulder' } },
  { value: 'xray_knee', label: { en: 'X-Ray Knee', no: 'Røntgen kne' } },
  { value: 'mri_cervical', label: { en: 'MRI Cervical Spine', no: 'MR cervicalcolumna' } },
  { value: 'mri_thoracic', label: { en: 'MRI Thoracic Spine', no: 'MR thoracalcolumna' } },
  { value: 'mri_lumbar', label: { en: 'MRI Lumbar Spine', no: 'MR lumbalcolumna' } },
  { value: 'mri_shoulder', label: { en: 'MRI Shoulder', no: 'MR skulder' } },
  { value: 'mri_knee', label: { en: 'MRI Knee', no: 'MR kne' } },
  { value: 'mri_brain', label: { en: 'MRI Brain', no: 'MR caput' } },
  { value: 'ct_cervical', label: { en: 'CT Cervical Spine', no: 'CT cervicalcolumna' } },
  { value: 'ct_lumbar', label: { en: 'CT Lumbar Spine', no: 'CT lumbalcolumna' } },
  { value: 'ultrasound_shoulder', label: { en: 'Ultrasound Shoulder', no: 'Ultralyd skulder' } },
];

// Priority levels
const PRIORITY_OPTIONS = [
  { value: 'routine', label: { en: 'Routine', no: 'Rutinemessig' }, color: 'gray' },
  { value: 'soon', label: { en: 'Soon (2-4 weeks)', no: 'Snart (2-4 uker)' }, color: 'yellow' },
  { value: 'urgent', label: { en: 'Urgent', no: 'Haster' }, color: 'red' },
];

// Default referral data
const getDefaultReferralData = () => ({
  // Referral type
  type: 'gp',
  priority: 'routine',

  // Recipient
  recipient: {
    name: '',
    specialty: '',
    clinic: '',
    address: '',
    phone: '',
    fax: '',
  },

  // Patient info
  patient: {
    name: '',
    personalId: '',
    dateOfBirth: '',
    address: '',
    phone: '',
  },

  // Clinical information
  clinical: {
    reasonForReferral: '',
    currentComplaints: '',
    duration: '',
    relevantHistory: '',
    examinationFindings: '',
    treatmentToDate: '',
    response: '',
  },

  // For radiology referrals
  imaging: {
    type: '',
    bodyPart: '',
    clinicalIndication: '',
    specificQuestions: '',
    contrast: false,
    urgency: '',
  },

  // Request
  request: {
    action: 'opinion', // opinion, investigation, sharedCare, takeOver
    specificRequest: '',
  },

  // Sender info
  sender: {
    name: '',
    title: 'Kiropraktor',
    hprNumber: '',
    clinicName: '',
    clinicAddress: '',
    phone: '',
    email: '',
  },

  // Date
  date: new Date().toISOString().split('T')[0],
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
  rows,
}) {
  const Component = rows ? 'textarea' : 'input';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Component
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

// Main Component
export default function ReferralLetterGenerator({
  _language = 'no',
  initialData = null,
  patientData = null,
  senderData = null,
  patientId,
  encounterId,
  onSave,
  _onSend,
}) {
  const { t, lang } = useTranslation('assessment');

  const [data, setData] = useState(() => {
    const defaultData = initialData || getDefaultReferralData();
    if (patientData) {
      defaultData.patient = { ...defaultData.patient, ...patientData };
    }
    if (senderData) {
      defaultData.sender = { ...defaultData.sender, ...senderData };
    }
    return defaultData;
  });

  const [showPreview, setShowPreview] = useState(false);

  // Update nested data
  const updateSection = useCallback((section, key, value) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  }, []);

  // Get referral type label — bilingual data lookup, kept as-is
  const getTypeLabel = useCallback(
    (type) => {
      const labels = {
        gp: { en: 'General Practitioner', no: 'Fastlege' },
        orthopedic: { en: 'Orthopedic Specialist', no: 'Ortoped' },
        neurology: { en: 'Neurologist', no: 'Nevrolog' },
        radiology: { en: 'Radiology/Imaging', no: 'Bildediagnostikk' },
        physio: { en: 'Physiotherapist', no: 'Fysioterapeut' },
      };
      return labels[type]?.[lang] || type;
    },
    [lang]
  );

  // Generate document text
  const generateDocument = useCallback(() => {
    const isRadiology = data.type === 'radiology';
    const today = new Date().toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-GB');

    const priorityLabel =
      PRIORITY_OPTIONS.find((p) => p.value === data.priority)?.label[lang] || '';

    let document = `
${t('referralDocHeading', 'HENVISNING')}
${'='.repeat(60)}

${t('referralDocTo', 'TIL')}: ${data.recipient.name || getTypeLabel(data.type)}
${data.recipient.specialty ? `${t('referralDocSpecialty', 'Spesialitet')}: ${data.recipient.specialty}` : ''}
${data.recipient.clinic ? `${t('referralDocClinic', 'Klinikk')}: ${data.recipient.clinic}` : ''}

${t('referralDocPriority', 'PRIORITET')}: ${priorityLabel}

${t('referralDocRegarding', 'GJELDER')}
${'-'.repeat(30)}
${t('referralPatientDetails', 'Pasientopplysninger')}:
${t('referralDocName', 'Navn')}: ${data.patient.name}
${t('referralDocPersonalId', 'Fødselsnummer')}: ${data.patient.personalId}
${t('referralDocDateOfBirth', 'Fødselsdato')}: ${data.patient.dateOfBirth}
${data.patient.address ? `${t('referralDocAddress', 'Adresse')}: ${data.patient.address}` : ''}
${data.patient.phone ? `${t('referralDocPhone', 'Telefon')}: ${data.patient.phone}` : ''}

${t('referralReasonForReferral', 'Henvisningsårsak').toUpperCase()}
${'-'.repeat(30)}
${data.clinical.reasonForReferral}
`;

    if (isRadiology) {
      const imagingLabel =
        IMAGING_OPTIONS.find((i) => i.value === data.imaging.type)?.label[lang] ||
        data.imaging.type;
      document += `
${t('referralDocRequestedImaging', 'ØNSKET UNDERSØKELSE')}
${'-'.repeat(30)}
${t('referralDocType', 'Type')}: ${imagingLabel}
${t('referralDocClinicalIndication', 'Klinisk indikasjon')}: ${data.imaging.clinicalIndication}
${data.imaging.specificQuestions ? `${t('referralDocSpecificQuestions', 'Spesifikke spørsmål')}:\n${data.imaging.specificQuestions}` : ''}
`;
    }

    document += `
${t('referralCurrentComplaints', 'Nåværende plager').toUpperCase()}
${'-'.repeat(30)}
${data.clinical.currentComplaints}
${data.clinical.duration ? `${t('referralDocDuration', 'Varighet')}: ${data.clinical.duration}` : ''}

${
  data.clinical.relevantHistory
    ? `${t('referralRelevantHistory', 'Relevant sykehistorie').toUpperCase()}
${'-'.repeat(30)}
${data.clinical.relevantHistory}
`
    : ''
}

${t('referralExaminationFindings', 'Undersøkelsesfunn').toUpperCase()}
${'-'.repeat(30)}
${data.clinical.examinationFindings}

${
  data.clinical.treatmentToDate
    ? `${t('referralTreatmentToDate', 'Behandling så langt').toUpperCase()}
${'-'.repeat(30)}
${data.clinical.treatmentToDate}
${data.clinical.response ? `${t('referralResponse', 'Respons på behandling')}: ${data.clinical.response}` : ''}
`
    : ''
}

${
  data.request.specificRequest
    ? `${t('referralRequestedAction', 'Ønsket tiltak').toUpperCase()}
${'-'.repeat(30)}
${data.request.specificRequest}
`
    : ''
}

${t('referralThankYou', 'Takk for at du ser denne pasienten')}.
${t('referralAvailableForDiscussion', 'Tilgjengelig for diskusjon ved behov')}.

${'='.repeat(60)}

${t('referralFrom', 'Fra').toUpperCase()}
${data.sender.name}
${data.sender.title}
HPR: ${data.sender.hprNumber}
${data.sender.clinicName}
${data.sender.clinicAddress}
${t('referralDocPhone', 'Telefon')}: ${data.sender.phone}
${data.sender.email ? `E-post: ${data.sender.email}` : ''}

${t('referralDocDate', 'Dato')}: ${today}
    `.trim();

    return document;
  }, [data, lang, getTypeLabel, t]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(generateDocument());
  }, [generateDocument]);

  // Print
  const printDocument = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('referralTitle', 'Henvisning')}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; line-height: 1.5; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body><pre>${generateDocument()}</pre></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [generateDocument, t]);

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleGeneratePDF = useCallback(async () => {
    if (!patientId || !encounterId) return;
    try {
      setPdfLoading(true);
      const response = await pdfAPI.generateReferralLetter({
        patientId,
        encounterId,
        recipientName: data.recipient?.name,
        recipientAddress: [data.recipient?.clinic, data.recipient?.address]
          .filter(Boolean)
          .join(', '),
        reasonForReferral: data.clinical?.reasonForReferral,
        relevantFindings: data.clinical?.examinationFindings,
        relevantTestResults: data.clinical?.treatmentToDate,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'henvisning.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Let the shared apiClient error interceptor handle it
    } finally {
      setPdfLoading(false);
    }
  }, [patientId, encounterId, data]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-7 h-7 text-indigo-600" />
              {t('referralTitle', 'Henvisning')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('referralSubtitle', 'Profesjonell medisinsk henvisning')}
            </p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showPreview
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('referralPreview', 'Forhåndsvis')}
          </button>
        </div>

        {/* Referral Type Selection */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {Object.entries(REFERRAL_TYPES).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setData((prev) => ({ ...prev, type }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  data.type === type
                    ? `bg-${config.color}-600 text-white`
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                style={
                  data.type === type
                    ? { backgroundColor: `var(--${config.color}-600, #4f46e5)` }
                    : {}
                }
              >
                <Icon className="w-4 h-4" />
                {getTypeLabel(type)}
              </button>
            );
          })}
        </div>

        {/* Priority */}
        <div className="flex gap-2 mt-3">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setData((prev) => ({ ...prev, priority: option.value }))}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                data.priority === option.value
                  ? option.value === 'urgent'
                    ? 'bg-red-100 text-red-700 ring-1 ring-red-500'
                    : option.value === 'soon'
                      ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-500'
                      : 'bg-gray-100 text-gray-700 ring-1 ring-gray-400'
                  : 'bg-white text-gray-500 dark:text-gray-400 border border-gray-200'
              }`}
            >
              {option.value === 'urgent' && <AlertCircle className="w-3 h-3" />}
              {option.value === 'soon' && <Clock className="w-3 h-3" />}
              {option.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {showPreview ? (
          <div className="bg-gray-50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
              {generateDocument()}
            </pre>
          </div>
        ) : (
          <>
            {/* Recipient */}
            <Section
              title={t('referralTo', 'Til')}
              icon={Building2}
              defaultOpen={data.type !== 'radiology'}
            >
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={t('referralNameDepartment', 'Navn/Avdeling')}
                  value={data.recipient.name}
                  onChange={(v) => updateSection('recipient', 'name', v)}
                  placeholder={getTypeLabel(data.type)}
                />
                <InputField
                  label={t('referralClinicHospital', 'Klinikk/Sykehus')}
                  value={data.recipient.clinic}
                  onChange={(v) => updateSection('recipient', 'clinic', v)}
                />
              </div>
            </Section>

            {/* Patient */}
            <Section title={t('referralPatientDetails', 'Pasientopplysninger')} icon={User}>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={t('referralPatientName', 'Navn')}
                  value={data.patient.name}
                  onChange={(v) => updateSection('patient', 'name', v)}
                  required
                />
                <InputField
                  label={t('referralPersonalId', 'Fødselsnummer')}
                  value={data.patient.personalId}
                  onChange={(v) => updateSection('patient', 'personalId', v)}
                  required
                />
                <InputField
                  label={t('referralDateOfBirth', 'Fødselsdato')}
                  type="date"
                  value={data.patient.dateOfBirth}
                  onChange={(v) => updateSection('patient', 'dateOfBirth', v)}
                />
                <InputField
                  label={t('referralPhone', 'Telefon')}
                  value={data.patient.phone}
                  onChange={(v) => updateSection('patient', 'phone', v)}
                />
              </div>
            </Section>

            {/* Imaging (for radiology) */}
            {data.type === 'radiology' && (
              <Section title={t('referralImagingRequest', 'Bildediagnostikk')} icon={ImageIcon}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('referralImagingType', 'Type undersøkelse')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={data.imaging.type}
                      onChange={(e) => updateSection('imaging', 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">{t('referralSelectOption', 'Velg...')}</option>
                      {IMAGING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputField
                    label={t('referralClinicalIndication', 'Klinisk indikasjon')}
                    value={data.imaging.clinicalIndication}
                    onChange={(v) => updateSection('imaging', 'clinicalIndication', v)}
                    rows={2}
                    required
                  />
                  <InputField
                    label={t('referralSpecificQuestions', 'Spesifikke spørsmål')}
                    value={data.imaging.specificQuestions}
                    onChange={(v) => updateSection('imaging', 'specificQuestions', v)}
                    rows={2}
                    placeholder={t('referralWhatAnswered', 'Hva ønsker du svar på?')}
                  />
                </div>
              </Section>
            )}

            {/* Clinical Information */}
            <Section title={t('referralReasonForReferral', 'Henvisningsårsak')} icon={FileText}>
              <div className="space-y-4">
                <InputField
                  label={t('referralReasonForReferral', 'Henvisningsårsak')}
                  value={data.clinical.reasonForReferral}
                  onChange={(v) => updateSection('clinical', 'reasonForReferral', v)}
                  rows={2}
                  required
                />
                <InputField
                  label={t('referralCurrentComplaints', 'Nåværende plager')}
                  value={data.clinical.currentComplaints}
                  onChange={(v) => updateSection('clinical', 'currentComplaints', v)}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label={t('referralDuration', 'Varighet')}
                    value={data.clinical.duration}
                    onChange={(v) => updateSection('clinical', 'duration', v)}
                    placeholder={t('referralDurationPlaceholder', 'f.eks. 3 uker')}
                  />
                </div>
                <InputField
                  label={t('referralRelevantHistory', 'Relevant sykehistorie')}
                  value={data.clinical.relevantHistory}
                  onChange={(v) => updateSection('clinical', 'relevantHistory', v)}
                  rows={2}
                />
                <InputField
                  label={t('referralExaminationFindings', 'Undersøkelsesfunn')}
                  value={data.clinical.examinationFindings}
                  onChange={(v) => updateSection('clinical', 'examinationFindings', v)}
                  rows={3}
                />
                <InputField
                  label={t('referralTreatmentToDate', 'Behandling så langt')}
                  value={data.clinical.treatmentToDate}
                  onChange={(v) => updateSection('clinical', 'treatmentToDate', v)}
                  rows={2}
                />
                <InputField
                  label={t('referralResponse', 'Respons på behandling')}
                  value={data.clinical.response}
                  onChange={(v) => updateSection('clinical', 'response', v)}
                />
              </div>
            </Section>

            {/* Sender */}
            <Section title={t('referralFrom', 'Fra')} icon={User} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={t('referralSenderName', 'Navn')}
                  value={data.sender.name}
                  onChange={(v) => updateSection('sender', 'name', v)}
                  required
                />
                <InputField
                  label="HPR-nummer"
                  value={data.sender.hprNumber}
                  onChange={(v) => updateSection('sender', 'hprNumber', v)}
                  required
                />
                <InputField
                  label={t('referralClinicName', 'Klinikknavn')}
                  value={data.sender.clinicName}
                  onChange={(v) => updateSection('sender', 'clinicName', v)}
                />
                <InputField
                  label={t('referralSenderPhone', 'Telefon')}
                  value={data.sender.phone}
                  onChange={(v) => updateSection('sender', 'phone', v)}
                />
                <InputField
                  label={t('referralSenderAddress', 'Adresse')}
                  value={data.sender.clinicAddress}
                  onChange={(v) => updateSection('sender', 'clinicAddress', v)}
                />
                <InputField
                  label="E-post"
                  type="email"
                  value={data.sender.email}
                  onChange={(v) => updateSection('sender', 'email', v)}
                />
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Footer */}
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
            onClick={printDocument}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            {t('print', 'Skriv ut')}
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={!patientId || !encounterId || pdfLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !patientId || !encounterId
                ? t('pdfRequiresEncounter', 'PDF krever aktiv konsultasjon')
                : ''
            }
          >
            <FileDown className="w-4 h-4" />
            {pdfLoading ? t('generating', 'Genererer...') : t('downloadPDF', 'Last ned PDF')}
          </button>
        </div>
        <button
          onClick={() => onSave?.(data)}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <Send className="w-4 h-4" />
          {t('save', 'Lagre')}
        </button>
      </div>
    </div>
  );
}

export { getDefaultReferralData, IMAGING_OPTIONS };
