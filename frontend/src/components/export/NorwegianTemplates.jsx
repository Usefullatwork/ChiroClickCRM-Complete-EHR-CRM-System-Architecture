/**
 * NorwegianTemplates Component
 *
 * Norwegian healthcare document templates for clinical documentation.
 * Formats follow Norwegian healthcare standards and conventions.
 *
 * Templates:
 * - Journalnotat (Journal Entry)
 * - Epikrisenotat (Discharge Summary)
 * - Henvisning (Referral Letter)
 * - Sykmelding (Sick Leave Certificate)
 * - Behandlingsoppsummering (Treatment Summary)
 * - Forsikringsrapport (Insurance Report)
 */

import { useState } from 'react';
import {
  FileText,
  _Calendar,
  _User,
  _Building,
  _Clipboard,
  _Send,
  _AlertCircle,
  Check,
  Copy,
  Download,
  _Eye,
} from 'lucide-react';

// =============================================================================
// DOCUMENT TEMPLATES
// =============================================================================

export const DOCUMENT_TEMPLATES = {
  // Standard Journal Entry
  JOURNAL_ENTRY: {
    id: 'journal_entry',
    name: { en: 'Journal Entry', no: 'Journalnotat' },
    description: {
      en: 'Standard clinical note for patient encounters',
      no: 'Standard klinisk notat for pasientkonsultasjoner',
    },
    sections: ['header', 'patient', 'soap', 'codes', 'signature'],
    template: (data, lang) =>
      `
${data.practice?.name || 'Klinikk'}
${data.practice?.address || ''}
Tlf: ${data.practice?.phone || ''}
${'─'.repeat(50)}

JOURNALNOTAT

Dato: ${formatNorwegianDate(data.encounter?.date)}
Pasient: ${data.patient?.name || ''}
Fødselsdato: ${formatNorwegianDate(data.patient?.dateOfBirth)}
${data.patient?.personnummer ? `Personnummer: ${formatPersonnummer(data.patient.personnummer)}` : ''}

Konsultasjonstype: ${translateEncounterType(data.encounter?.type, lang)}
Varighet: ${data.encounter?.duration || 30} minutter

${'─'.repeat(50)}

SUBJEKTIVT
${data.soap?.subjective || 'Ingen subjektive funn dokumentert.'}

OBJEKTIVT
${data.soap?.objective || 'Ingen objektive funn dokumentert.'}

VURDERING
${data.codes?.length ? `Diagnoser: ${data.codes.join(', ')}` : ''}
${data.soap?.assessment || 'Ingen vurdering dokumentert.'}

PLAN
${data.soap?.plan || 'Ingen plan dokumentert.'}

${'─'.repeat(50)}

Behandler: ${data.provider?.name || ''}
${data.provider?.credentials || 'Kiropraktor'}
HPR-nr: ${data.provider?.hprNumber || ''}

Signert elektronisk: ${formatNorwegianDate(new Date())}
`.trim(),
  },

  // Referral Letter
  REFERRAL: {
    id: 'referral',
    name: { en: 'Referral Letter', no: 'Henvisning' },
    description: {
      en: 'Referral to specialist or imaging',
      no: 'Henvisning til spesialist eller bildediagnostikk',
    },
    sections: ['header', 'recipient', 'patient', 'reason', 'history', 'findings', 'request'],
    template: (data, _lang) =>
      `
${data.practice?.name || 'Klinikk'}
${data.practice?.address || ''}
Tlf: ${data.practice?.phone || ''}

${'─'.repeat(50)}
HENVISNING
${'─'.repeat(50)}

Til: ${data.referral?.recipient || '[Mottaker]'}
${data.referral?.department || ''}
${data.referral?.address || ''}

Dato: ${formatNorwegianDate(new Date())}
Hastegrad: ${data.referral?.priority || 'Normal'}

PASIENTOPPLYSNINGER
Navn: ${data.patient?.name || ''}
Fødselsdato: ${formatNorwegianDate(data.patient?.dateOfBirth)}
Adresse: ${data.patient?.address || ''}
Telefon: ${formatNorwegianPhone(data.patient?.phone)}

HENVISNINGSÅRSAK
${data.referral?.reason || '[Beskriv henvisningsårsak]'}

SYKEHISTORIE
${data.referral?.history || data.soap?.subjective || '[Relevant sykehistorie]'}

KLINISKE FUNN
${data.referral?.findings || data.soap?.objective || '[Relevante kliniske funn]'}

AKTUELLE DIAGNOSER
${data.codes?.length ? data.codes.join('\n') : '[Diagnosekoder]'}

PROBLEMSTILLING / ØNSKE OM VURDERING
${data.referral?.request || '[Spesifiser ønsket vurdering eller undersøkelse]'}

${'─'.repeat(50)}

Med vennlig hilsen,

${data.provider?.name || ''}
${data.provider?.credentials || 'Kiropraktor'}
HPR-nr: ${data.provider?.hprNumber || ''}
`.trim(),
  },

  // Treatment Summary
  TREATMENT_SUMMARY: {
    id: 'treatment_summary',
    name: { en: 'Treatment Summary', no: 'Behandlingsoppsummering' },
    description: {
      en: 'Summary of treatment course for patient or third party',
      no: 'Oppsummering av behandlingsforløp for pasient eller tredjepart',
    },
    sections: [
      'header',
      'patient',
      'period',
      'diagnosis',
      'treatment',
      'outcome',
      'recommendations',
    ],
    template: (data, _lang) =>
      `
${data.practice?.name || 'Klinikk'}
${data.practice?.address || ''}
${'─'.repeat(50)}

BEHANDLINGSOPPSUMMERING

Pasient: ${data.patient?.name || ''}
Fødselsdato: ${formatNorwegianDate(data.patient?.dateOfBirth)}

Behandlingsperiode: ${formatNorwegianDate(data.summary?.startDate)} - ${formatNorwegianDate(data.summary?.endDate || new Date())}
Antall behandlinger: ${data.summary?.visitCount || 0}

DIAGNOSER
${data.codes?.length ? data.codes.map((c) => `• ${c}`).join('\n') : 'Ingen diagnoser registrert'}

BEHANDLINGSFORLØP
${data.summary?.course || 'Pasienten har mottatt kiropraktorbehandling i henhold til behandlingsplan.'}

UTFØRT BEHANDLING
${data.summary?.treatments?.length ? data.summary.treatments.map((t) => `• ${t}`).join('\n') : '• Spinal manipulasjon\n• Bløtvevsbehandling\n• Øvelsesinstruksjon'}

BEHANDLINGSRESULTAT
${data.summary?.outcome || 'Pasienten rapporterer bedring av symptomer.'}

VAS Smerteskala:
- Ved oppstart: ${data.summary?.vasStart || 'N/A'}/10
- Ved avslutning: ${data.summary?.vasEnd || 'N/A'}/10

ANBEFALINGER
${data.summary?.recommendations || '• Fortsette med hjemmeøvelser\n• Ergonomiske tilpasninger\n• Oppfølging ved behov'}

${'─'.repeat(50)}

Utstedt av:
${data.provider?.name || ''}
${data.provider?.credentials || 'Kiropraktor'}
Dato: ${formatNorwegianDate(new Date())}
`.trim(),
  },

  // Insurance Report
  INSURANCE_REPORT: {
    id: 'insurance_report',
    name: { en: 'Insurance Report', no: 'Forsikringsrapport' },
    description: {
      en: 'Detailed report for insurance claims',
      no: 'Detaljert rapport for forsikringskrav',
    },
    sections: ['header', 'patient', 'injury', 'treatment', 'prognosis', 'functional'],
    template: (data, _lang) =>
      `
${data.practice?.name || 'Klinikk'}
${data.practice?.address || ''}
Org.nr: ${data.practice?.orgNumber || ''}
${'═'.repeat(60)}

FORSIKRINGSRAPPORT
MEDISINSK ERKLÆRING

${'═'.repeat(60)}

1. PASIENTOPPLYSNINGER
Navn: ${data.patient?.name || ''}
Fødselsdato: ${formatNorwegianDate(data.patient?.dateOfBirth)}
Personnummer: ${formatPersonnummer(data.patient?.personnummer)}
Adresse: ${data.patient?.address || ''}

2. SKADETIDSPUNKT OG HENDELSE
Skadedato: ${formatNorwegianDate(data.insurance?.injuryDate)}
Hendelsesforløp:
${data.insurance?.incidentDescription || '[Beskriv hendelsen som førte til skade]'}

3. DIAGNOSER
${data.codes?.length ? data.codes.map((c, i) => `${i + 1}. ${c}`).join('\n') : '[Diagnosekoder]'}

4. SYMPTOMER OG FUNN
Subjektive plager:
${data.soap?.subjective || '[Pasientens beskrivelse av plager]'}

Objektive funn:
${data.soap?.objective || '[Kliniske funn ved undersøkelse]'}

5. BEHANDLING GITT
Behandlingsperiode: ${formatNorwegianDate(data.insurance?.treatmentStart)} - ${formatNorwegianDate(data.insurance?.treatmentEnd || new Date())}
Antall behandlinger: ${data.insurance?.visitCount || 0}

Behandlingsmetoder:
${data.insurance?.methods || '• Spinal manipulasjon\n• Bløtvevsbehandling\n• Rehabiliteringsøvelser'}

6. FUNKSJONSVURDERING
Nåværende funksjonsnivå:
${data.insurance?.functionalStatus || '[Beskriv pasientens funksjonsnivå]'}

Begrensninger i daglige aktiviteter:
${data.insurance?.limitations || '[Beskriv eventuelle begrensninger]'}

Arbeidsevne:
${data.insurance?.workCapacity || '[Vurder arbeidsevne]'}

7. PROGNOSE
${data.insurance?.prognosis || '[Forventet utvikling og varighet av plager]'}

8. ÅRSAKSSAMMENHENG
Vurdering av sammenheng mellom skade og nåværende plager:
${data.insurance?.causation || '[Vurder årsakssammenheng]'}

${'═'.repeat(60)}

Jeg bekrefter at opplysningene i denne rapporten er korrekte
etter beste medisinsk-faglige skjønn.

Behandler: ${data.provider?.name || ''}
Profesjon: ${data.provider?.credentials || 'Kiropraktor'}
HPR-nummer: ${data.provider?.hprNumber || ''}
Autorisasjonsdato: ${data.provider?.authDate || ''}

Sted og dato: ${data.practice?.city || ''}, ${formatNorwegianDate(new Date())}

Signatur: _______________________________
`.trim(),
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format date in Norwegian format (DD.MM.YYYY)
 */
export function formatNorwegianDate(date) {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format Norwegian phone number
 */
export function formatNorwegianPhone(phone) {
  if (!phone) {
    return '';
  }

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as +47 XXX XX XXX
  if (digits.length === 8) {
    return `+47 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  }

  if (digits.length === 10 && digits.startsWith('47')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Format Norwegian personnummer (national ID)
 */
export function formatPersonnummer(personnummer) {
  if (!personnummer) {
    return '';
  }

  const digits = personnummer.replace(/\D/g, '');

  if (digits.length === 11) {
    return `${digits.slice(0, 6)} ${digits.slice(6)}`;
  }

  return personnummer;
}

/**
 * Translate encounter type to Norwegian
 */
function translateEncounterType(type, lang = 'no') {
  const translations = {
    INITIAL: { en: 'Initial Consultation', no: 'Førstegangskonsultasjon' },
    FOLLOWUP: { en: 'Follow-up', no: 'Oppfølging' },
    REEXAM: { en: 'Re-examination', no: 'Re-undersøkelse' },
    EMERGENCY: { en: 'Emergency', no: 'Akutt' },
  };

  return translations[type]?.[lang] || type || 'Konsultasjon';
}

/**
 * Generate document from template
 */
export function generateDocument(templateId, data, language = 'no') {
  const template = DOCUMENT_TEMPLATES[templateId.toUpperCase()];
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  return template.template(data, language);
}

// =============================================================================
// NORWEGIAN TEMPLATES COMPONENT
// =============================================================================

export default function NorwegianDocumentTemplates({
  encounterData,
  patientData,
  practiceInfo = {},
  providerInfo = {},
  language = 'no',
  onGenerate,
  className = '',
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('JOURNAL_ENTRY');
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Additional data for specific templates
  const [referralData, setReferralData] = useState({
    recipient: '',
    department: '',
    priority: 'Normal',
    reason: '',
    request: '',
  });

  const [insuranceData, _setInsuranceData] = useState({
    injuryDate: '',
    incidentDescription: '',
    functionalStatus: '',
    limitations: '',
    workCapacity: '',
    prognosis: '',
    causation: '',
  });

  const labels = {
    en: {
      title: 'Document Templates',
      subtitle: 'Norwegian healthcare document formats',
      selectTemplate: 'Select Template',
      generate: 'Generate Document',
      preview: 'Preview',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      additionalInfo: 'Additional Information',
    },
    no: {
      title: 'Dokumentmaler',
      subtitle: 'Norske helsevesen dokumentformater',
      selectTemplate: 'Velg Mal',
      generate: 'Generer Dokument',
      preview: 'Forhåndsvisning',
      copy: 'Kopier',
      copied: 'Kopiert!',
      download: 'Last ned',
      additionalInfo: 'Tilleggsinformasjon',
    },
  };

  const t = labels[language] || labels.no;

  const handleGenerate = () => {
    const data = {
      practice: practiceInfo,
      provider: providerInfo,
      patient: {
        name: `${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim(),
        dateOfBirth: patientData?.date_of_birth,
        personnummer: patientData?.national_id,
        address: patientData?.address,
        phone: patientData?.phone,
      },
      encounter: {
        date: encounterData?.encounter_date,
        type: encounterData?.encounter_type,
        duration: encounterData?.duration_minutes,
      },
      soap: {
        subjective: formatSOAPSection(encounterData, 'subjective'),
        objective: formatSOAPSection(encounterData, 'objective'),
        assessment: formatSOAPSection(encounterData, 'assessment'),
        plan: formatSOAPSection(encounterData, 'plan'),
      },
      codes: encounterData?.icpc_codes || [],
      referral: referralData,
      insurance: insuranceData,
      summary: {
        startDate: encounterData?.treatment_start_date,
        visitCount: encounterData?.visit_count,
        vasStart: encounterData?.vas_pain_start,
        vasEnd: encounterData?.vas_pain_end,
      },
    };

    const document = generateDocument(selectedTemplate, data, language);
    setGeneratedDocument(document);
    setShowPreview(true);
    onGenerate?.({ template: selectedTemplate, document });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.toLowerCase()}_${formatNorwegianDate(new Date()).replace(/\./g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          {t.title}
        </h3>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectTemplate}</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DOCUMENT_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setSelectedTemplate(key)}
                className={`p-4 rounded-lg border text-left transition-colors
                  ${
                    selectedTemplate === key
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <p className="font-medium text-gray-900">
                  {template.name[language] || template.name.no}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {template.description[language] || template.description.no}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Additional fields for Referral */}
        {selectedTemplate === 'REFERRAL' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">{t.additionalInfo}</p>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={language === 'no' ? 'Mottaker (f.eks. Radiologi)' : 'Recipient'}
                value={referralData.recipient}
                onChange={(e) => setReferralData({ ...referralData, recipient: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={referralData.priority}
                onChange={(e) => setReferralData({ ...referralData, priority: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Normal">Normal</option>
                <option value="Haster">{language === 'no' ? 'Haster' : 'Urgent'}</option>
                <option value="Øyeblikkelig">
                  {language === 'no' ? 'Øyeblikkelig' : 'Immediate'}
                </option>
              </select>
            </div>
            <textarea
              placeholder={language === 'no' ? 'Henvisningsårsak' : 'Reason for referral'}
              value={referralData.reason}
              onChange={(e) => setReferralData({ ...referralData, reason: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" />
          {t.generate}
        </button>

        {/* Preview */}
        {showPreview && generatedDocument && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t.preview}</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? t.copied : t.copy}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  {t.download}
                </button>
              </div>
            </div>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-auto whitespace-pre-wrap font-mono max-h-96">
              {generatedDocument}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPER - Format SOAP sections
// =============================================================================

function formatSOAPSection(data, section) {
  if (!data) {
    return '';
  }

  const parts = [];

  if (section === 'subjective') {
    if (data.subjective?.chief_complaint) {
      parts.push(data.subjective.chief_complaint);
    }
    if (data.pain_qualities?.length) {
      parts.push(`Smertekvalitet: ${data.pain_qualities.join(', ')}`);
    }
    if (data.pain_locations?.length) {
      parts.push(`Lokalisering: ${data.pain_locations.join(', ')}`);
    }
    if (data.subjective?.history) {
      parts.push(data.subjective.history);
    }
    if (data.vas_pain_start !== null && data.vas_pain_start !== undefined) {
      parts.push(`VAS ved start: ${data.vas_pain_start}/10`);
    }
  }

  if (section === 'objective') {
    if (data.observation_findings?.length) {
      parts.push(`Observasjon: ${data.observation_findings.join(', ')}`);
    }
    if (data.palpation_findings?.length) {
      parts.push(`Palpasjon: ${data.palpation_findings.join(', ')}`);
    }
    if (data.rom_findings?.length) {
      parts.push(`ROM: ${data.rom_findings.join(', ')}`);
    }
    if (data.objective?.observation) {
      parts.push(data.objective.observation);
    }
    if (data.objective?.palpation) {
      parts.push(data.objective.palpation);
    }
    if (data.vas_pain_end !== null && data.vas_pain_end !== undefined) {
      parts.push(`VAS ved slutt: ${data.vas_pain_end}/10`);
    }
  }

  if (section === 'assessment') {
    if (data.assessment?.clinical_reasoning) {
      parts.push(data.assessment.clinical_reasoning);
    }
    if (data.assessment?.prognosis) {
      parts.push(`Prognose: ${data.assessment.prognosis}`);
    }
  }

  if (section === 'plan') {
    if (data.treatments_selected?.length) {
      parts.push(`Behandling: ${data.treatments_selected.join(', ')}`);
    }
    if (data.plan?.treatment) {
      parts.push(data.plan.treatment);
    }
    if (data.exercises_selected?.length) {
      parts.push(`Øvelser: ${data.exercises_selected.join(', ')}`);
    }
    if (data.plan?.follow_up) {
      parts.push(`Oppfølging: ${data.plan.follow_up}`);
    }
  }

  return parts.join('\n');
}
