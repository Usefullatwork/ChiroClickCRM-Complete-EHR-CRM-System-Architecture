/**
 * MedicalCertificateGenerator Component
 *
 * AI-powered generator for Norwegian medical certificates and declarations.
 * Supports multiple letter types: medical certificates, university letters,
 * membership freeze declarations, and work declarations.
 */

import { useState, _useEffect } from 'react';
import {
  FileText,
  Wand2,
  Copy,
  Download,
  Check,
  Loader2,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  User,
  Building,
  _Calendar,
  FileCheck,
} from 'lucide-react';

// Letter types with Norwegian labels
const CERTIFICATE_TYPES = [
  {
    id: 'MEDICAL_CERTIFICATE',
    name: 'Medisinsk erklæring',
    nameEn: 'Medical Certificate',
    description: 'Generell medisinsk erklæring for diverse formål',
    icon: FileCheck,
  },
  {
    id: 'UNIVERSITY_LETTER',
    name: 'Universitetsbrev',
    nameEn: 'University Letter',
    description: 'Brev for utsatt eksamen eller studietilpasninger',
    icon: Building,
  },
  {
    id: 'MEMBERSHIP_FREEZE',
    name: 'Treningssentererklæring',
    nameEn: 'Gym Membership Freeze',
    description: 'Erklæring for frys av treningsmedlemskap',
    icon: User,
  },
  {
    id: 'WORK_DECLARATION',
    name: 'Arbeidsgivererklæring',
    nameEn: 'Work Declaration',
    description: 'Erklæring til arbeidsgiver om funksjon og tilrettelegging',
    icon: FileText,
  },
];

export default function MedicalCertificateGenerator({
  patientData,
  encounterData,
  practiceInfo,
  providerInfo,
  language = 'no',
  onGenerate,
  onSave,
  className = '',
}) {
  const [selectedType, setSelectedType] = useState('MEDICAL_CERTIFICATE');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Additional input fields for specific letter types
  const [additionalFields, setAdditionalFields] = useState({
    recipient: '',
    institution: '',
    purpose: '',
    duration: '',
    workCapacity: '',
    restrictions: '',
  });

  const labels = {
    no: {
      title: 'Generer Erklæring',
      subtitle: 'AI-assistert brevgenerering',
      selectType: 'Velg type erklæring',
      generate: 'Generer med AI',
      regenerate: 'Generer på nytt',
      copy: 'Kopier',
      copied: 'Kopiert!',
      download: 'Last ned',
      save: 'Lagre',
      preview: 'Forhåndsvisning',
      generating: 'Genererer...',
      recipient: 'Mottaker',
      institution: 'Institusjon',
      purpose: 'Formål',
      duration: 'Varighet',
      workCapacity: 'Arbeidsevne',
      restrictions: 'Restriksjoner/Tilrettelegging',
      additionalInfo: 'Tilleggsinformasjon',
      patientInfo: 'Pasientinformasjon',
      clinicalContext: 'Klinisk kontekst',
      errorGenerating: 'Kunne ikke generere brev. Prøv igjen.',
      noPatient: 'Velg en pasient først',
    },
    en: {
      title: 'Generate Certificate',
      subtitle: 'AI-assisted letter generation',
      selectType: 'Select certificate type',
      generate: 'Generate with AI',
      regenerate: 'Regenerate',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      save: 'Save',
      preview: 'Preview',
      generating: 'Generating...',
      recipient: 'Recipient',
      institution: 'Institution',
      purpose: 'Purpose',
      duration: 'Duration',
      workCapacity: 'Work Capacity',
      restrictions: 'Restrictions/Accommodations',
      additionalInfo: 'Additional Information',
      patientInfo: 'Patient Information',
      clinicalContext: 'Clinical Context',
      errorGenerating: 'Could not generate letter. Please try again.',
      noPatient: 'Select a patient first',
    },
  };

  const t = labels[language] || labels.no;
  const selectedTypeConfig = CERTIFICATE_TYPES.find((type) => type.id === selectedType);

  // Generate letter via API
  const handleGenerate = async () => {
    if (!patientData) {
      setError(t.noPatient);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/generate-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          letterType: selectedType,
          patientData: {
            name: `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim(),
            dateOfBirth: patientData.date_of_birth,
            address: patientData.address,
            phone: patientData.phone,
          },
          clinicalContext: {
            diagnosis: encounterData?.icpc_codes?.join(', ') || '',
            findings: encounterData?.objective?.observation || '',
            purpose: additionalFields.purpose,
            recipient: additionalFields.recipient,
            provider: providerInfo,
            clinic: practiceInfo,
          },
          additionalInfo: {
            institution: additionalFields.institution,
            duration: additionalFields.duration,
            workCapacity: additionalFields.workCapacity,
            restrictions: additionalFields.restrictions,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedContent(data.content);
      onGenerate?.({ type: selectedType, content: data.content });
    } catch (err) {
      console.error('Letter generation error:', err);
      setError(t.errorGenerating);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as text file
  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `${selectedType.toLowerCase()}_${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save to patient record
  const handleSave = async () => {
    if (!generatedContent || !patientData?.id) {
      return;
    }

    try {
      const response = await fetch('/api/v1/ai/letters/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          patientId: patientData.id,
          letterData: {
            letterType: selectedType,
            letterTypeName: selectedTypeConfig?.name,
            content: generatedContent,
            generatedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        onSave?.({ type: selectedType, content: generatedContent });
      }
    } catch (err) {
      console.error('Error saving letter:', err);
    }
  };

  // Render additional fields based on letter type
  const renderAdditionalFields = () => {
    switch (selectedType) {
      case 'UNIVERSITY_LETTER':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.institution}
              </label>
              <input
                type="text"
                value={additionalFields.institution}
                onChange={(e) =>
                  setAdditionalFields({ ...additionalFields, institution: e.target.value })
                }
                placeholder="F.eks. Universitetet i Oslo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.purpose}</label>
              <input
                type="text"
                value={additionalFields.purpose}
                onChange={(e) =>
                  setAdditionalFields({ ...additionalFields, purpose: e.target.value })
                }
                placeholder="F.eks. Utsatt eksamen i PSYC1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        );

      case 'MEMBERSHIP_FREEZE':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.recipient}</label>
              <input
                type="text"
                value={additionalFields.recipient}
                onChange={(e) =>
                  setAdditionalFields({ ...additionalFields, recipient: e.target.value })
                }
                placeholder="F.eks. SATS Majorstuen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.duration}</label>
              <input
                type="text"
                value={additionalFields.duration}
                onChange={(e) =>
                  setAdditionalFields({ ...additionalFields, duration: e.target.value })
                }
                placeholder="F.eks. 6 uker"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        );

      case 'WORK_DECLARATION':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.workCapacity}
              </label>
              <select
                value={additionalFields.workCapacity}
                onChange={(e) =>
                  setAdditionalFields({ ...additionalFields, workCapacity: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Velg arbeidsevne</option>
                <option value="full">Full arbeidsevne</option>
                <option value="partial">Delvis arbeidsevne</option>
                <option value="none">Ingen arbeidsevne</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.restrictions}
              </label>
              <textarea
                value={additionalFields.restrictions}
                onChange={(e) =>
                  setAdditionalFields({ ...additionalFields, restrictions: e.target.value })
                }
                placeholder="F.eks. Unngå tunge løft, behov for hyppige pauser"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.duration}</label>
              <input
                type="text"
                value={additionalFields.duration}
                onChange={(e) =>
                  setAdditionalFields({ ...additionalFields, duration: e.target.value })
                }
                placeholder="F.eks. 2-4 uker"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.purpose}</label>
            <textarea
              value={additionalFields.purpose}
              onChange={(e) =>
                setAdditionalFields({ ...additionalFields, purpose: e.target.value })
              }
              placeholder="Beskriv formålet med erklæringen..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Letter Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectType}</label>
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {selectedTypeConfig && (
                  <selectedTypeConfig.icon className="w-5 h-5 text-gray-500" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedTypeConfig?.name}</p>
                  <p className="text-xs text-gray-500">{selectedTypeConfig?.description}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showTypeDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                {CERTIFICATE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setShowTypeDropdown(false);
                      setGeneratedContent('');
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg
                      ${selectedType === type.id ? 'bg-blue-50' : ''}`}
                  >
                    <type.icon className="w-5 h-5 text-gray-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{type.name}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Info Summary */}
        {patientData && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              {t.patientInfo}: {patientData.first_name} {patientData.last_name}
            </p>
            {patientData.date_of_birth && (
              <p className="text-xs text-blue-700 mt-1">
                Født: {new Date(patientData.date_of_birth).toLocaleDateString('nb-NO')}
              </p>
            )}
          </div>
        )}

        {/* Additional Fields */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">{t.additionalInfo}</p>
          {renderAdditionalFields()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !patientData}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.generating}
            </>
          ) : generatedContent ? (
            <>
              <RefreshCw className="w-5 h-5" />
              {t.regenerate}
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              {t.generate}
            </>
          )}
        </button>

        {/* Generated Content Preview */}
        {generatedContent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t.preview}</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t.copy}
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t.download}
                </button>
                {patientData?.id && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 bg-green-50 rounded-lg transition-colors"
                  >
                    <FileCheck className="w-4 h-4" />
                    {t.save}
                  </button>
                )}
              </div>
            </div>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-auto whitespace-pre-wrap font-mono max-h-96">
              {generatedContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
