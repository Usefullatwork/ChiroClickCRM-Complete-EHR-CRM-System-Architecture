import { useState, useRef } from 'react';
import { Printer, Copy, Check, FileText, X, ChevronDown } from 'lucide-react';

/**
 * PrintPreview - Professional narrative document generator
 *
 * The "Attorney Test" - Notes must print as clean, professional documents
 * suitable for personal injury cases, insurance audits, and legal review.
 *
 * Features:
 * - Converts checkbox data into narrative sentences
 * - Professional SOAP format output
 * - Customizable header with practice info
 * - PDF export
 * - Multiple format options
 */

// =============================================================================
// NARRATIVE GENERATORS - Convert checkbox data to professional sentences
// =============================================================================

// Generate subjective narrative from checkbox/quick-select data
function generateSubjectiveNarrative(data) {
  const sentences = [];

  // Chief Complaint
  if (data.subjective?.chief_complaint) {
    sentences.push(data.subjective.chief_complaint);
  }

  // Pain locations
  if (data.pain_locations?.length > 0) {
    const locations = data.pain_locations.join(', ');
    sentences.push(`Patient reports pain in the following regions: ${locations}.`);
  }

  // Pain qualities
  if (data.pain_qualities?.length > 0) {
    const qualities = data.pain_qualities.join(', ');
    sentences.push(`Pain is described as ${qualities}.`);
  }

  // VAS Pain
  if (data.vas_pain_start !== null && data.vas_pain_start !== undefined) {
    sentences.push(`Pain intensity rated at ${data.vas_pain_start}/10 at the start of the visit.`);
  }

  // Aggravating factors
  if (data.aggravating_factors_selected?.length > 0) {
    const factors = data.aggravating_factors_selected.join(', ');
    sentences.push(`Pain is aggravated by ${factors}.`);
  }

  // Relieving factors
  if (data.relieving_factors_selected?.length > 0) {
    const factors = data.relieving_factors_selected.join(', ');
    sentences.push(`Pain is relieved by ${factors}.`);
  }

  // History
  if (data.subjective?.history) {
    sentences.push(data.subjective.history);
  }

  // Onset
  if (data.subjective?.onset) {
    sentences.push(`Onset: ${data.subjective.onset}`);
  }

  return sentences.join(' ');
}

// Generate objective narrative from checkbox/quick-select data
function generateObjectiveNarrative(data) {
  const sentences = [];

  // Observation findings
  if (data.observation_findings?.length > 0) {
    const findings = data.observation_findings.join(', ');
    sentences.push(`Observation revealed ${findings}.`);
  }

  // Palpation findings
  if (data.palpation_findings?.length > 0) {
    const findings = data.palpation_findings.join(', ');
    sentences.push(`Palpation findings: ${findings}.`);
  }

  // Spinal findings (from SpineDiagram)
  if (data.spinal_findings && Object.keys(data.spinal_findings).length > 0) {
    const spinalNarrative = generateSpinalNarrative(data.spinal_findings);
    if (spinalNarrative) {
      sentences.push(spinalNarrative);
    }
  }

  // ROM findings
  if (data.rom_findings?.length > 0) {
    const findings = data.rom_findings.join(', ');
    sentences.push(`Range of motion testing revealed ${findings}.`);
  }

  // Orthopedic tests
  if (data.ortho_tests_selected?.length > 0) {
    const positiveTests = data.ortho_tests_selected.filter(
      (t) => !t.toLowerCase().includes('negative')
    );
    const negativeTests = data.ortho_tests_selected.filter((t) =>
      t.toLowerCase().includes('negative')
    );

    if (positiveTests.length > 0) {
      sentences.push(
        `Orthopedic testing revealed positive findings for: ${positiveTests.join(', ')}.`
      );
    }
    if (negativeTests.length > 0) {
      sentences.push(`The following tests were negative: ${negativeTests.join(', ')}.`);
    }
  }

  // Neurological tests
  if (data.neuro_tests_selected?.length > 0) {
    const findings = data.neuro_tests_selected.join(', ');
    sentences.push(`Neurological examination: ${findings}.`);
  }

  // Free-text objective
  if (data.objective?.observation) {
    sentences.push(data.objective.observation);
  }
  if (data.objective?.palpation) {
    sentences.push(data.objective.palpation);
  }
  if (data.objective?.rom) {
    sentences.push(data.objective.rom);
  }
  if (data.objective?.ortho_tests) {
    sentences.push(data.objective.ortho_tests);
  }
  if (data.objective?.neuro_tests) {
    sentences.push(data.objective.neuro_tests);
  }

  return sentences.join(' ');
}

// Generate spinal findings narrative
function generateSpinalNarrative(spinalFindings) {
  if (!spinalFindings || Object.keys(spinalFindings).length === 0) {
    return '';
  }

  const findingsByType = {};

  Object.entries(spinalFindings).forEach(([vertebra, findings]) => {
    findings.forEach((finding) => {
      const key = `${finding.type}_${finding.side}`;
      if (!findingsByType[key]) {
        findingsByType[key] = [];
      }
      findingsByType[key].push(vertebra);
    });
  });

  const sentences = [];

  // Group subluxations
  Object.entries(findingsByType).forEach(([key, vertebrae]) => {
    const [type, side] = key.split('_');
    const sideText =
      side === 'bilateral' ? 'bilaterally' : side === 'central' ? '' : `on the ${side}`;
    const typeText = type.charAt(0).toUpperCase() + type.slice(1);

    if (vertebrae.length === 1) {
      sentences.push(`${`${typeText} noted at ${vertebrae[0]} ${sideText}`.trim()}.`);
    } else {
      sentences.push(`${`${typeText} noted at ${vertebrae.join(', ')} ${sideText}`.trim()}.`);
    }
  });

  return sentences.length > 0 ? `Spinal examination findings: ${sentences.join(' ')}` : '';
}

// Generate assessment narrative
function generateAssessmentNarrative(data) {
  const sentences = [];

  // Diagnoses
  const diagnoses = [...(data.icpc_codes || []), ...(data.icd10_codes || [])];
  if (diagnoses.length > 0) {
    sentences.push(`Diagnosis: ${diagnoses.join(', ')}.`);
  }

  // Clinical reasoning
  if (data.assessment?.clinical_reasoning) {
    sentences.push(data.assessment.clinical_reasoning);
  }

  // Differential diagnosis
  if (data.assessment?.differential_diagnosis) {
    sentences.push(`Differential: ${data.assessment.differential_diagnosis}`);
  }

  // Prognosis
  if (data.assessment?.prognosis) {
    sentences.push(`Prognosis: ${data.assessment.prognosis}`);
  }

  // Outcome assessment scores
  if (data.outcome_assessment?.score !== null && data.outcome_assessment?.score !== undefined) {
    sentences.push(`${data.outcome_assessment.type} score: ${data.outcome_assessment.score}%.`);
  }

  return sentences.join(' ');
}

// Generate plan narrative
function generatePlanNarrative(data) {
  const sentences = [];

  // Treatments performed
  if (data.treatments_selected?.length > 0) {
    const treatments = data.treatments_selected.join(', ');
    sentences.push(`Treatment provided: ${treatments}.`);
  }

  // Free-text treatment
  if (data.plan?.treatment) {
    sentences.push(data.plan.treatment);
  }

  // Exercises prescribed
  if (data.exercises_selected?.length > 0) {
    const exercises = data.exercises_selected.join(', ');
    sentences.push(`Home exercise program: ${exercises}.`);
  }

  // Free-text exercises
  if (data.plan?.exercises) {
    sentences.push(data.plan.exercises);
  }

  // Advice
  if (data.plan?.advice) {
    sentences.push(`Patient education: ${data.plan.advice}`);
  }

  // Follow-up
  if (data.plan?.follow_up) {
    sentences.push(`Follow-up: ${data.plan.follow_up}`);
  }

  // VAS end
  if (data.vas_pain_end !== null && data.vas_pain_end !== undefined) {
    sentences.push(`Pain intensity at end of visit: ${data.vas_pain_end}/10.`);
  }

  // VAS improvement
  if (data.vas_pain_start !== null && data.vas_pain_end !== null) {
    const improvement = data.vas_pain_start - data.vas_pain_end;
    if (improvement > 0) {
      sentences.push(
        `Patient experienced ${improvement} point improvement in pain level during this visit.`
      );
    }
  }

  return sentences.join(' ');
}

// =============================================================================
// DOCUMENT TEMPLATES
// =============================================================================

const DOCUMENT_TEMPLATES = {
  standard: {
    name: 'Standard SOAP',
    description: 'Professional SOAP format with clear sections',
    headerStyle: 'formal',
  },
  narrative: {
    name: 'Narrative Report',
    description: 'Flowing narrative style for legal/insurance',
    headerStyle: 'formal',
  },
  compact: {
    name: 'Compact',
    description: 'Condensed format for internal use',
    headerStyle: 'minimal',
  },
  pi: {
    name: 'Personal Injury',
    description: 'Detailed format for PI cases',
    headerStyle: 'legal',
  },
};

// =============================================================================
// PRINT PREVIEW COMPONENT
// =============================================================================

export default function PrintPreview({
  encounterData,
  patientData,
  practiceInfo = {},
  isOpen,
  onClose,
}) {
  const [template, setTemplate] = useState('standard');
  const [showHeader, setShowHeader] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  if (!isOpen) {
    return null;
  }

  // Generate narratives
  const subjective = generateSubjectiveNarrative(encounterData);
  const objective = generateObjectiveNarrative(encounterData);
  const assessment = generateAssessmentNarrative(encounterData);
  const plan = generatePlanNarrative(encounterData);

  // Format date
  const encounterDate = encounterData.encounter_date
    ? new Date(encounterData.encounter_date).toLocaleDateString('nb-NO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('nb-NO');

  // Copy to clipboard
  const handleCopy = async () => {
    const text = `
CLINICAL ENCOUNTER NOTES
Date: ${encounterDate}
Patient: ${patientData?.first_name || ''} ${patientData?.last_name || ''}

SUBJECTIVE
${subjective || 'No subjective findings documented.'}

OBJECTIVE
${objective || 'No objective findings documented.'}

ASSESSMENT
${assessment || 'No assessment documented.'}

PLAN
${plan || 'No plan documented.'}
    `.trim();

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print document
  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Encounter - ${patientData?.last_name || 'Patient'}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.5in;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .practice-name {
              font-size: 18pt;
              font-weight: bold;
            }
            .practice-info {
              font-size: 10pt;
              color: #333;
            }
            .patient-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 10px;
              background: #f5f5f5;
            }
            .section-title {
              font-weight: bold;
              font-size: 13pt;
              margin-top: 15px;
              margin-bottom: 5px;
              text-transform: uppercase;
              border-bottom: 1px solid #ccc;
              padding-bottom: 3px;
            }
            .section-content {
              margin-bottom: 15px;
              text-align: justify;
            }
            .signature-block {
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 300px;
              margin-top: 40px;
              padding-top: 5px;
            }
            .footer {
              margin-top: 30px;
              font-size: 9pt;
              color: #666;
              text-align: center;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 0.5in; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Print Preview</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Template Selector */}
            <div className="relative">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white"
              >
                {Object.entries(DOCUMENT_TEMPLATES).map(([key, tmpl]) => (
                  <option key={key} value={key}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Options */}
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showHeader}
                onChange={(e) => setShowHeader(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm">Header</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm">Signature</span>
            </label>

            {/* Actions */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                copied ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div
            ref={printRef}
            className="bg-white shadow-lg mx-auto p-8 max-w-3xl"
            style={{ fontFamily: 'Times New Roman, Times, serif' }}
          >
            {/* Practice Header */}
            {showHeader && (
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <div className="text-xl font-bold">{practiceInfo.name || 'ChiroClick Clinic'}</div>
                <div className="text-sm text-gray-600">
                  {practiceInfo.address || '123 Health Street, Medical City, MC 12345'}
                </div>
                <div className="text-sm text-gray-600">
                  Phone: {practiceInfo.phone || '(555) 123-4567'} | Fax:{' '}
                  {practiceInfo.fax || '(555) 123-4568'}
                </div>
              </div>
            )}

            {/* Patient Info Bar */}
            <div className="flex justify-between bg-gray-100 p-3 mb-6 text-sm">
              <div>
                <strong>Patient:</strong> {patientData?.first_name || ''}{' '}
                {patientData?.last_name || ''}
                {patientData?.date_of_birth && (
                  <span className="ml-4">
                    <strong>DOB:</strong>{' '}
                    {new Date(patientData.date_of_birth).toLocaleDateString('nb-NO')}
                  </span>
                )}
              </div>
              <div>
                <strong>Date:</strong> {encounterDate}
              </div>
            </div>

            {/* Visit Info */}
            <div className="text-center text-lg font-bold mb-6">
              CLINICAL ENCOUNTER NOTES
              {encounterData.encounter_type && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({encounterData.encounter_type})
                </span>
              )}
            </div>

            {/* SUBJECTIVE */}
            <div className="mb-6">
              <div className="font-bold text-base border-b border-gray-300 pb-1 mb-2">
                SUBJECTIVE
              </div>
              <div className="text-justify leading-relaxed">
                {subjective || (
                  <em className="text-gray-400">No subjective findings documented.</em>
                )}
              </div>
            </div>

            {/* OBJECTIVE */}
            <div className="mb-6">
              <div className="font-bold text-base border-b border-gray-300 pb-1 mb-2">
                OBJECTIVE
              </div>
              <div className="text-justify leading-relaxed">
                {objective || <em className="text-gray-400">No objective findings documented.</em>}
              </div>
            </div>

            {/* ASSESSMENT */}
            <div className="mb-6">
              <div className="font-bold text-base border-b border-gray-300 pb-1 mb-2">
                ASSESSMENT
              </div>
              <div className="text-justify leading-relaxed">
                {assessment || <em className="text-gray-400">No assessment documented.</em>}
              </div>
            </div>

            {/* PLAN */}
            <div className="mb-6">
              <div className="font-bold text-base border-b border-gray-300 pb-1 mb-2">PLAN</div>
              <div className="text-justify leading-relaxed">
                {plan || <em className="text-gray-400">No plan documented.</em>}
              </div>
            </div>

            {/* Signature Block */}
            {showSignature && (
              <div className="mt-12">
                <div className="border-t border-black w-72 pt-2">
                  <div className="font-bold">{practiceInfo.provider || 'Provider Name, DC'}</div>
                  <div className="text-sm text-gray-600">
                    {practiceInfo.credentials || 'Doctor of Chiropractic'}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Date: ________________</div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
              This document is confidential and intended solely for the patient named above.
              <br />
              Page 1 of 1 | Generated by ChiroClickCRM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export narrative generators for use elsewhere
export {
  generateSubjectiveNarrative,
  generateObjectiveNarrative,
  generateAssessmentNarrative,
  generatePlanNarrative,
  generateSpinalNarrative,
};
