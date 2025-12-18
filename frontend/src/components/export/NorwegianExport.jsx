/**
 * NorwegianExport Component
 *
 * Export clinical notes and patient data in Norwegian-compliant formats.
 * Designed to integrate with other Norwegian healthcare systems.
 *
 * Features:
 * - Export to multiple formats (PDF, XML, JSON, CSV)
 * - Norwegian date/number formatting
 * - ICPC-2 and Takster code formatting
 * - Journal entry format (Journalnotat)
 * - Batch export capabilities
 * - Bilingual labels (EN/NO)
 */

import { useState } from 'react';
import {
  Download,
  FileText,
  FileJson,
  Table,
  Printer,
  Check,
  AlertCircle,
  Calendar,
  User,
  Clipboard,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  Copy,
  X,
} from 'lucide-react';

// Export formats
export const EXPORT_FORMATS = {
  PDF: {
    id: 'pdf',
    name: 'PDF',
    icon: FileText,
    extension: '.pdf',
    mimeType: 'application/pdf',
  },
  JSON: {
    id: 'json',
    name: 'JSON',
    icon: FileJson,
    extension: '.json',
    mimeType: 'application/json',
  },
  CSV: {
    id: 'csv',
    name: 'CSV',
    icon: Table,
    extension: '.csv',
    mimeType: 'text/csv',
  },
  XML: {
    id: 'xml',
    name: 'XML (KITH)',
    icon: FileText,
    extension: '.xml',
    mimeType: 'application/xml',
  },
  TEXT: {
    id: 'text',
    name: 'Plain Text',
    icon: FileText,
    extension: '.txt',
    mimeType: 'text/plain',
  },
};

// Norwegian date format options
const DATE_FORMATS = {
  NO_STANDARD: { value: 'no-standard', label: 'DD.MM.YYYY', example: '18.12.2025' },
  ISO: { value: 'iso', label: 'YYYY-MM-DD', example: '2025-12-18' },
  NO_FULL: { value: 'no-full', label: 'D. MMMM YYYY', example: '18. desember 2025' },
};

// Export templates
export const EXPORT_TEMPLATES = {
  JOURNAL_ENTRY: {
    id: 'journal_entry',
    name: { en: 'Journal Entry', no: 'Journalnotat' },
    description: { en: 'Standard clinical note format', no: 'Standard journalnotat format' },
  },
  SOAP_NOTE: {
    id: 'soap_note',
    name: { en: 'SOAP Note', no: 'SOAP Notat' },
    description: { en: 'Subjective, Objective, Assessment, Plan', no: 'Subjektiv, Objektiv, Vurdering, Plan' },
  },
  REFERRAL: {
    id: 'referral',
    name: { en: 'Referral Letter', no: 'Henvisning' },
    description: { en: 'Referral to specialist', no: 'Henvisning til spesialist' },
  },
  SUMMARY: {
    id: 'summary',
    name: { en: 'Treatment Summary', no: 'Behandlingsoppsummering' },
    description: { en: 'Summary of treatment course', no: 'Oppsummering av behandlingsforløp' },
  },
  INSURANCE: {
    id: 'insurance',
    name: { en: 'Insurance Report', no: 'Forsikringsrapport' },
    description: { en: 'Report for insurance claims', no: 'Rapport for forsikringskrav' },
  },
};

// =============================================================================
// NORWEGIAN EXPORT PANEL
// =============================================================================

export default function NorwegianExport({
  encounterData,
  patientData,
  practiceInfo = {},
  allEncounters = [],
  language = 'no',
  onExport,
  className = '',
}) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedTemplate, setSelectedTemplate] = useState('journal_entry');
  const [dateFormat, setDateFormat] = useState('no-standard');
  const [includePatientInfo, setIncludePatientInfo] = useState(true);
  const [includeCodes, setIncludeCodes] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [exportAll, setExportAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const labels = {
    en: {
      title: 'Export Clinical Notes',
      subtitle: 'Norwegian healthcare format export',
      format: 'Export Format',
      template: 'Document Template',
      dateFormat: 'Date Format',
      options: 'Export Options',
      includePatient: 'Include patient information',
      includeCodes: 'Include diagnosis codes (ICPC-2/ICD-10)',
      includeSignature: 'Include digital signature block',
      exportAll: 'Export all encounters for this patient',
      preview: 'Preview',
      export: 'Export',
      exporting: 'Exporting...',
      copied: 'Copied!',
      copyToClipboard: 'Copy to Clipboard',
      close: 'Close',
      journalHeader: 'JOURNAL ENTRY',
      patient: 'Patient',
      dob: 'Date of Birth',
      date: 'Date',
      provider: 'Provider',
      diagnoses: 'Diagnoses',
      subjective: 'SUBJECTIVE',
      objective: 'OBJECTIVE',
      assessment: 'ASSESSMENT',
      plan: 'PLAN',
      signature: 'Digital Signature',
      signedBy: 'Signed by',
      generatedOn: 'Generated on',
    },
    no: {
      title: 'Eksporter Kliniske Notater',
      subtitle: 'Norsk helsevesen format eksport',
      format: 'Eksportformat',
      template: 'Dokumentmal',
      dateFormat: 'Datoformat',
      options: 'Eksportalternativer',
      includePatient: 'Inkluder pasientinformasjon',
      includeCodes: 'Inkluder diagnosekoder (ICPC-2/ICD-10)',
      includeSignature: 'Inkluder digital signaturblokk',
      exportAll: 'Eksporter alle konsultasjoner for denne pasienten',
      preview: 'Forhåndsvisning',
      export: 'Eksporter',
      exporting: 'Eksporterer...',
      copied: 'Kopiert!',
      copyToClipboard: 'Kopier til Utklippstavle',
      close: 'Lukk',
      journalHeader: 'JOURNALNOTAT',
      patient: 'Pasient',
      dob: 'Fødselsdato',
      date: 'Dato',
      provider: 'Behandler',
      diagnoses: 'Diagnoser',
      subjective: 'SUBJEKTIVT',
      objective: 'OBJEKTIVT',
      assessment: 'VURDERING',
      plan: 'PLAN',
      signature: 'Digital Signatur',
      signedBy: 'Signert av',
      generatedOn: 'Generert',
    },
  };

  const t = labels[language] || labels.no;

  // Format date according to Norwegian standards
  const formatNorwegianDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);

    if (dateFormat === 'iso') {
      return date.toISOString().split('T')[0];
    }

    if (dateFormat === 'no-full') {
      return date.toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    // Default: DD.MM.YYYY
    return date.toLocaleDateString('nb-NO');
  };

  // Generate export content
  const generateExportContent = () => {
    const content = {
      header: {
        title: t.journalHeader,
        date: formatNorwegianDate(encounterData?.encounter_date || new Date()),
        practice: practiceInfo.name || 'ChiroClick Clinic',
      },
      patient: includePatientInfo ? {
        name: `${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim(),
        dob: patientData?.date_of_birth ? formatNorwegianDate(patientData.date_of_birth) : '',
        id: patientData?.national_id || patientData?.id || '',
      } : null,
      encounter: {
        type: encounterData?.encounter_type || 'FOLLOWUP',
        duration: encounterData?.duration_minutes || 30,
      },
      soap: {
        subjective: formatSubjective(encounterData),
        objective: formatObjective(encounterData),
        assessment: formatAssessment(encounterData),
        plan: formatPlan(encounterData),
      },
      codes: includeCodes ? {
        icpc: encounterData?.icpc_codes || [],
        icd10: encounterData?.icd10_codes || [],
        takster: encounterData?.takster_codes || [],
      } : null,
      signature: includeSignature ? {
        provider: practiceInfo.provider || 'Behandler',
        credentials: practiceInfo.credentials || 'Kiropraktor',
        date: formatNorwegianDate(new Date()),
      } : null,
    };

    return content;
  };

  // Format helpers for SOAP sections
  const formatSubjective = (data) => {
    if (!data) return '';
    const parts = [];

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

    if (data.vas_pain_start !== null) {
      parts.push(`VAS smerte ved start: ${data.vas_pain_start}/10`);
    }

    return parts.join('\n');
  };

  const formatObjective = (data) => {
    if (!data) return '';
    const parts = [];

    if (data.observation_findings?.length) {
      parts.push(`Observasjon: ${data.observation_findings.join(', ')}`);
    }

    if (data.palpation_findings?.length) {
      parts.push(`Palpasjon: ${data.palpation_findings.join(', ')}`);
    }

    if (data.rom_findings?.length) {
      parts.push(`ROM: ${data.rom_findings.join(', ')}`);
    }

    if (data.spinal_findings && Object.keys(data.spinal_findings).length) {
      const spinalParts = Object.entries(data.spinal_findings)
        .filter(([_, v]) => v.subluxation)
        .map(([segment, findings]) => {
          let desc = segment;
          if (findings.tenderness) desc += ' (øm)';
          if (findings.restricted) desc += ' (begr.)';
          return desc;
        });
      if (spinalParts.length) {
        parts.push(`Spinalfunn: ${spinalParts.join(', ')}`);
      }
    }

    if (data.objective?.observation) {
      parts.push(data.objective.observation);
    }

    if (data.vas_pain_end !== null) {
      parts.push(`VAS smerte ved slutt: ${data.vas_pain_end}/10`);
    }

    return parts.join('\n');
  };

  const formatAssessment = (data) => {
    if (!data) return '';
    const parts = [];

    if (data.icpc_codes?.length) {
      parts.push(`Diagnoser: ${data.icpc_codes.join(', ')}`);
    }

    if (data.assessment?.clinical_reasoning) {
      parts.push(data.assessment.clinical_reasoning);
    }

    if (data.assessment?.prognosis) {
      parts.push(`Prognose: ${data.assessment.prognosis}`);
    }

    return parts.join('\n');
  };

  const formatPlan = (data) => {
    if (!data) return '';
    const parts = [];

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

    return parts.join('\n');
  };

  // Generate text output
  const generateTextOutput = () => {
    const content = generateExportContent();
    const lines = [];

    // Header
    lines.push('═'.repeat(60));
    lines.push(content.header.title);
    lines.push(`${t.date}: ${content.header.date}`);
    lines.push(content.header.practice);
    lines.push('═'.repeat(60));
    lines.push('');

    // Patient info
    if (content.patient) {
      lines.push(`${t.patient}: ${content.patient.name}`);
      if (content.patient.dob) {
        lines.push(`${t.dob}: ${content.patient.dob}`);
      }
      lines.push('');
    }

    // SOAP sections
    lines.push(`── ${t.subjective} ──`);
    lines.push(content.soap.subjective || '-');
    lines.push('');

    lines.push(`── ${t.objective} ──`);
    lines.push(content.soap.objective || '-');
    lines.push('');

    lines.push(`── ${t.assessment} ──`);
    lines.push(content.soap.assessment || '-');
    lines.push('');

    lines.push(`── ${t.plan} ──`);
    lines.push(content.soap.plan || '-');
    lines.push('');

    // Codes
    if (content.codes) {
      lines.push(`── ${t.diagnoses} ──`);
      if (content.codes.icpc.length) {
        lines.push(`ICPC-2: ${content.codes.icpc.join(', ')}`);
      }
      if (content.codes.icd10.length) {
        lines.push(`ICD-10: ${content.codes.icd10.join(', ')}`);
      }
      lines.push('');
    }

    // Signature
    if (content.signature) {
      lines.push('─'.repeat(60));
      lines.push(`${t.signedBy}: ${content.signature.provider}, ${content.signature.credentials}`);
      lines.push(`${t.generatedOn}: ${content.signature.date}`);
    }

    return lines.join('\n');
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      const content = generateExportContent();
      let blob;
      let filename = `journal_${patientData?.last_name || 'patient'}_${formatNorwegianDate(new Date()).replace(/\./g, '-')}`;

      switch (selectedFormat) {
        case 'json':
          blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
          filename += '.json';
          break;

        case 'csv':
          blob = new Blob([generateCSV(content)], { type: 'text/csv' });
          filename += '.csv';
          break;

        case 'xml':
          blob = new Blob([generateXML(content)], { type: 'application/xml' });
          filename += '.xml';
          break;

        case 'text':
        default:
          blob = new Blob([generateTextOutput()], { type: 'text/plain' });
          filename += '.txt';
          break;
      }

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onExport?.({ format: selectedFormat, filename, content });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to clipboard
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(generateTextOutput());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.format}</label>
          <div className="grid grid-cols-5 gap-2">
            {Object.values(EXPORT_FORMATS).map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors
                    ${selectedFormat === format.id
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{format.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.template}</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {Object.values(EXPORT_TEMPLATES).map((template) => (
              <option key={template.id} value={template.id}>
                {template.name[language] || template.name.no} - {template.description[language] || template.description.no}
              </option>
            ))}
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.dateFormat}</label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {Object.values(DATE_FORMATS).map((format) => (
              <option key={format.value} value={format.value}>
                {format.label} ({format.example})
              </option>
            ))}
          </select>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.options}</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePatientInfo}
                onChange={(e) => setIncludePatientInfo(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">{t.includePatient}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeCodes}
                onChange={(e) => setIncludeCodes(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">{t.includeCodes}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">{t.includeSignature}</span>
            </label>
            {allEncounters.length > 1 && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportAll}
                  onChange={(e) => setExportAll(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">{t.exportAll} ({allEncounters.length})</span>
              </label>
            )}
          </div>
        </div>

        {/* Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {t.preview}
        </button>

        {/* Preview */}
        {showPreview && (
          <div className="relative">
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-400 hover:text-gray-600 bg-white rounded shadow-sm"
                title={t.copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono max-h-80">
              {generateTextOutput()}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <Copy className="w-4 h-4" />
          {copied ? t.copied : t.copyToClipboard}
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? t.exporting : t.export}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate CSV output
 */
function generateCSV(content) {
  const rows = [
    ['Field', 'Value'],
    ['Date', content.header.date],
    ['Practice', content.header.practice],
  ];

  if (content.patient) {
    rows.push(['Patient Name', content.patient.name]);
    rows.push(['Date of Birth', content.patient.dob]);
  }

  rows.push(['Subjective', `"${content.soap.subjective.replace(/"/g, '""')}"`]);
  rows.push(['Objective', `"${content.soap.objective.replace(/"/g, '""')}"`]);
  rows.push(['Assessment', `"${content.soap.assessment.replace(/"/g, '""')}"`]);
  rows.push(['Plan', `"${content.soap.plan.replace(/"/g, '""')}"`]);

  if (content.codes) {
    rows.push(['ICPC-2 Codes', content.codes.icpc.join('; ')]);
    rows.push(['ICD-10 Codes', content.codes.icd10.join('; ')]);
  }

  return rows.map((row) => row.join(',')).join('\n');
}

/**
 * Generate XML output (KITH-inspired format)
 */
function generateXML(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<JournalNotat xmlns="http://www.kith.no/xmlstds/epj/2008-02-20">
  <Header>
    <Title>${content.header.title}</Title>
    <Date>${content.header.date}</Date>
    <Practice>${content.header.practice}</Practice>
  </Header>
  ${content.patient ? `
  <Patient>
    <Name>${content.patient.name}</Name>
    <DateOfBirth>${content.patient.dob}</DateOfBirth>
    <ID>${content.patient.id}</ID>
  </Patient>` : ''}
  <SOAP>
    <Subjective><![CDATA[${content.soap.subjective}]]></Subjective>
    <Objective><![CDATA[${content.soap.objective}]]></Objective>
    <Assessment><![CDATA[${content.soap.assessment}]]></Assessment>
    <Plan><![CDATA[${content.soap.plan}]]></Plan>
  </SOAP>
  ${content.codes ? `
  <Diagnoses>
    ${content.codes.icpc.map((c) => `<ICPC2>${c}</ICPC2>`).join('\n    ')}
    ${content.codes.icd10.map((c) => `<ICD10>${c}</ICD10>`).join('\n    ')}
  </Diagnoses>` : ''}
  ${content.signature ? `
  <Signature>
    <Provider>${content.signature.provider}</Provider>
    <Credentials>${content.signature.credentials}</Credentials>
    <Date>${content.signature.date}</Date>
  </Signature>` : ''}
</JournalNotat>`;
}

// =============================================================================
// COMPACT EXPORT BUTTON
// =============================================================================

export function ExportButton({
  onClick,
  language = 'no',
  className = '',
}) {
  const label = language === 'no' ? 'Eksporter' : 'Export';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 text-sm font-medium ${className}`}
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}
