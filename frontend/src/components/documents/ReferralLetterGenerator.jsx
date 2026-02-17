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
import { t } from '../assessment/translations';
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
} from 'lucide-react';

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
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
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
  language = 'no',
  initialData = null,
  patientData = null,
  senderData = null,
  onSave,
  _onSend,
}) {
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

  // Get referral type label
  const getTypeLabel = useCallback(
    (type) => {
      const labels = {
        gp: { en: 'General Practitioner', no: 'Fastlege' },
        orthopedic: { en: 'Orthopedic Specialist', no: 'Ortoped' },
        neurology: { en: 'Neurologist', no: 'Nevrolog' },
        radiology: { en: 'Radiology/Imaging', no: 'Bildediagnostikk' },
        physio: { en: 'Physiotherapist', no: 'Fysioterapeut' },
      };
      return labels[type]?.[language] || type;
    },
    [language]
  );

  // Generate document text
  const generateDocument = useCallback(() => {
    const isRadiology = data.type === 'radiology';
    const today = new Date().toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-GB');

    const priorityLabel =
      PRIORITY_OPTIONS.find((p) => p.value === data.priority)?.label[language] || '';

    let document = `
${language === 'no' ? 'HENVISNING' : 'REFERRAL LETTER'}
${'='.repeat(60)}

${language === 'no' ? 'TIL' : 'TO'}: ${data.recipient.name || getTypeLabel(data.type)}
${data.recipient.specialty ? `${language === 'no' ? 'Spesialitet' : 'Specialty'}: ${data.recipient.specialty}` : ''}
${data.recipient.clinic ? `${language === 'no' ? 'Klinikk' : 'Clinic'}: ${data.recipient.clinic}` : ''}

${language === 'no' ? 'PRIORITET' : 'PRIORITY'}: ${priorityLabel}

${language === 'no' ? 'GJELDER' : 'REGARDING'}
${'-'.repeat(30)}
${t('referral', 'patientDetails', language)}:
${language === 'no' ? 'Navn' : 'Name'}: ${data.patient.name}
${language === 'no' ? 'Fødselsnummer' : 'Personal ID'}: ${data.patient.personalId}
${language === 'no' ? 'Fødselsdato' : 'Date of Birth'}: ${data.patient.dateOfBirth}
${data.patient.address ? `${language === 'no' ? 'Adresse' : 'Address'}: ${data.patient.address}` : ''}
${data.patient.phone ? `${language === 'no' ? 'Telefon' : 'Phone'}: ${data.patient.phone}` : ''}

${t('referral', 'reasonForReferral', language).toUpperCase()}
${'-'.repeat(30)}
${data.clinical.reasonForReferral}
`;

    if (isRadiology) {
      const imagingLabel =
        IMAGING_OPTIONS.find((i) => i.value === data.imaging.type)?.label[language] ||
        data.imaging.type;
      document += `
${language === 'no' ? 'ØNSKET UNDERSØKELSE' : 'REQUESTED IMAGING'}
${'-'.repeat(30)}
${language === 'no' ? 'Type' : 'Type'}: ${imagingLabel}
${language === 'no' ? 'Klinisk indikasjon' : 'Clinical Indication'}: ${data.imaging.clinicalIndication}
${data.imaging.specificQuestions ? `${language === 'no' ? 'Spesifikke spørsmål' : 'Specific Questions'}:\n${data.imaging.specificQuestions}` : ''}
`;
    }

    document += `
${t('referral', 'currentComplaints', language).toUpperCase()}
${'-'.repeat(30)}
${data.clinical.currentComplaints}
${data.clinical.duration ? `${language === 'no' ? 'Varighet' : 'Duration'}: ${data.clinical.duration}` : ''}

${
  data.clinical.relevantHistory
    ? `${t('referral', 'relevantHistory', language).toUpperCase()}
${'-'.repeat(30)}
${data.clinical.relevantHistory}
`
    : ''
}

${t('referral', 'examinationFindings', language).toUpperCase()}
${'-'.repeat(30)}
${data.clinical.examinationFindings}

${
  data.clinical.treatmentToDate
    ? `${t('referral', 'treatmentToDate', language).toUpperCase()}
${'-'.repeat(30)}
${data.clinical.treatmentToDate}
${data.clinical.response ? `${t('referral', 'response', language)}: ${data.clinical.response}` : ''}
`
    : ''
}

${
  data.request.specificRequest
    ? `${t('referral', 'requestedAction', language).toUpperCase()}
${'-'.repeat(30)}
${data.request.specificRequest}
`
    : ''
}

${t('referral', 'thankYou', language)}.
${t('referral', 'availableForDiscussion', language)}.

${'='.repeat(60)}

${t('referral', 'from', language).toUpperCase()}
${data.sender.name}
${data.sender.title}
HPR: ${data.sender.hprNumber}
${data.sender.clinicName}
${data.sender.clinicAddress}
${language === 'no' ? 'Telefon' : 'Phone'}: ${data.sender.phone}
${data.sender.email ? `E-post: ${data.sender.email}` : ''}

${language === 'no' ? 'Dato' : 'Date'}: ${today}
    `.trim();

    return document;
  }, [data, language, getTypeLabel]);

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
          <title>${language === 'no' ? 'Henvisning' : 'Referral Letter'}</title>
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
  }, [generateDocument, language]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-7 h-7 text-indigo-600" />
              {t('referral', 'title', language)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t('referral', 'subtitle', language)}</p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showPreview
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {language === 'no' ? 'Forhåndsvis' : 'Preview'}
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
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {option.value === 'urgent' && <AlertCircle className="w-3 h-3" />}
              {option.value === 'soon' && <Clock className="w-3 h-3" />}
              {option.label[language]}
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
              title={t('referral', 'to', language)}
              icon={Building2}
              defaultOpen={data.type !== 'radiology'}
            >
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={language === 'no' ? 'Navn/Avdeling' : 'Name/Department'}
                  value={data.recipient.name}
                  onChange={(v) => updateSection('recipient', 'name', v)}
                  placeholder={getTypeLabel(data.type)}
                />
                <InputField
                  label={language === 'no' ? 'Klinikk/Sykehus' : 'Clinic/Hospital'}
                  value={data.recipient.clinic}
                  onChange={(v) => updateSection('recipient', 'clinic', v)}
                />
              </div>
            </Section>

            {/* Patient */}
            <Section title={t('referral', 'patientDetails', language)} icon={User}>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={language === 'no' ? 'Navn' : 'Name'}
                  value={data.patient.name}
                  onChange={(v) => updateSection('patient', 'name', v)}
                  required
                />
                <InputField
                  label={language === 'no' ? 'Fødselsnummer' : 'Personal ID'}
                  value={data.patient.personalId}
                  onChange={(v) => updateSection('patient', 'personalId', v)}
                  required
                />
                <InputField
                  label={language === 'no' ? 'Fødselsdato' : 'Date of Birth'}
                  type="date"
                  value={data.patient.dateOfBirth}
                  onChange={(v) => updateSection('patient', 'dateOfBirth', v)}
                />
                <InputField
                  label={language === 'no' ? 'Telefon' : 'Phone'}
                  value={data.patient.phone}
                  onChange={(v) => updateSection('patient', 'phone', v)}
                />
              </div>
            </Section>

            {/* Imaging (for radiology) */}
            {data.type === 'radiology' && (
              <Section
                title={language === 'no' ? 'Bildediagnostikk' : 'Imaging Request'}
                icon={ImageIcon}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'no' ? 'Type undersøkelse' : 'Imaging Type'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={data.imaging.type}
                      onChange={(e) => updateSection('imaging', 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">{language === 'no' ? 'Velg...' : 'Select...'}</option>
                      {IMAGING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label[language]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputField
                    label={language === 'no' ? 'Klinisk indikasjon' : 'Clinical Indication'}
                    value={data.imaging.clinicalIndication}
                    onChange={(v) => updateSection('imaging', 'clinicalIndication', v)}
                    rows={2}
                    required
                  />
                  <InputField
                    label={language === 'no' ? 'Spesifikke spørsmål' : 'Specific Questions'}
                    value={data.imaging.specificQuestions}
                    onChange={(v) => updateSection('imaging', 'specificQuestions', v)}
                    rows={2}
                    placeholder={
                      language === 'no' ? 'Hva ønsker du svar på?' : 'What do you want answered?'
                    }
                  />
                </div>
              </Section>
            )}

            {/* Clinical Information */}
            <Section title={t('referral', 'reasonForReferral', language)} icon={FileText}>
              <div className="space-y-4">
                <InputField
                  label={t('referral', 'reasonForReferral', language)}
                  value={data.clinical.reasonForReferral}
                  onChange={(v) => updateSection('clinical', 'reasonForReferral', v)}
                  rows={2}
                  required
                />
                <InputField
                  label={t('referral', 'currentComplaints', language)}
                  value={data.clinical.currentComplaints}
                  onChange={(v) => updateSection('clinical', 'currentComplaints', v)}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label={language === 'no' ? 'Varighet' : 'Duration'}
                    value={data.clinical.duration}
                    onChange={(v) => updateSection('clinical', 'duration', v)}
                    placeholder={language === 'no' ? 'f.eks. 3 uker' : 'e.g. 3 weeks'}
                  />
                </div>
                <InputField
                  label={t('referral', 'relevantHistory', language)}
                  value={data.clinical.relevantHistory}
                  onChange={(v) => updateSection('clinical', 'relevantHistory', v)}
                  rows={2}
                />
                <InputField
                  label={t('referral', 'examinationFindings', language)}
                  value={data.clinical.examinationFindings}
                  onChange={(v) => updateSection('clinical', 'examinationFindings', v)}
                  rows={3}
                />
                <InputField
                  label={t('referral', 'treatmentToDate', language)}
                  value={data.clinical.treatmentToDate}
                  onChange={(v) => updateSection('clinical', 'treatmentToDate', v)}
                  rows={2}
                />
                <InputField
                  label={t('referral', 'response', language)}
                  value={data.clinical.response}
                  onChange={(v) => updateSection('clinical', 'response', v)}
                />
              </div>
            </Section>

            {/* Sender */}
            <Section title={t('referral', 'from', language)} icon={User} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={language === 'no' ? 'Navn' : 'Name'}
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
                  label={language === 'no' ? 'Klinikknavn' : 'Clinic Name'}
                  value={data.sender.clinicName}
                  onChange={(v) => updateSection('sender', 'clinicName', v)}
                />
                <InputField
                  label={language === 'no' ? 'Telefon' : 'Phone'}
                  value={data.sender.phone}
                  onChange={(v) => updateSection('sender', 'phone', v)}
                />
                <InputField
                  label={language === 'no' ? 'Adresse' : 'Address'}
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
            {t('common', 'copy', language)}
          </button>
          <button
            onClick={printDocument}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            {t('common', 'print', language)}
          </button>
        </div>
        <button
          onClick={() => onSave?.(data)}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <Send className="w-4 h-4" />
          {t('common', 'save', language)}
        </button>
      </div>
    </div>
  );
}

export { getDefaultReferralData, IMAGING_OPTIONS };
