/**
 * ClinicalNoteGenerator Component
 *
 * AI-powered generator for clinical notes and referrals.
 * Specialized for vestibular and headache referrals with specific clinical fields.
 */

import { useState, useEffect } from 'react';
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
  Send,
  Clipboard,
  Brain,
  Eye,
  Activity,
} from 'lucide-react';

// Referral types with Norwegian labels
const REFERRAL_TYPES = [
  {
    id: 'CLINICAL_NOTE',
    name: 'Klinisk notat',
    nameEn: 'Clinical Note',
    description: 'Detaljert notat til spesialist eller annen behandler',
    icon: FileText,
    category: 'note',
  },
  {
    id: 'VESTIBULAR_REFERRAL',
    name: 'Svimmelhet henvisning',
    nameEn: 'Vestibular Referral',
    description: 'Henvisning for BPPV, vestibularisnevritt, svimmelhet',
    icon: Eye,
    category: 'vestibular',
  },
  {
    id: 'HEADACHE_REFERRAL',
    name: 'Hodepine henvisning',
    nameEn: 'Headache Referral',
    description: 'Henvisning for migrene, tensjon, klasehodepine',
    icon: Brain,
    category: 'headache',
  },
  {
    id: 'REFERRAL',
    name: 'Generell henvisning',
    nameEn: 'General Referral',
    description: 'Henvisning til spesialist eller bildediagnostikk',
    icon: Send,
    category: 'general',
  },
];

// Vestibular test options
const VESTIBULAR_TESTS = {
  dix_hallpike: [
    'Negativ',
    'Positiv høyre - oppslående, torsjonell nystagmus',
    'Positiv venstre - oppslående, torsjonell nystagmus',
    'Atypisk respons',
  ],
  hit_test: [
    'Normal bilateralt',
    'Catch-up sakkade høyre',
    'Catch-up sakkade venstre',
    'Bilateral svakhet',
  ],
  romberg: [
    'Normal',
    'Svak balanse - øyne lukket',
    'Fall mot høyre',
    'Fall mot venstre',
    'Ustabil begge retninger',
  ],
};

// Headache types
const HEADACHE_TYPES = [
  'Migrene uten aura',
  'Migrene med aura',
  'Tensjon-type hodepine',
  'Klasehodepine',
  'Cervikogen hodepine',
  'Medikamentoverforbrukshodepine',
  'Annet',
];

export default function ClinicalNoteGenerator({
  patientData,
  encounterData,
  practiceInfo,
  providerInfo,
  language = 'no',
  onGenerate,
  onSave,
  className = '',
}) {
  const [selectedType, setSelectedType] = useState('CLINICAL_NOTE');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Clinical fields
  const [clinicalFields, setClinicalFields] = useState({
    recipient: '',
    institution: '',
    history: '',
    // Vestibular specific
    dix_hallpike: '',
    hit_test: '',
    romberg: '',
    vng_notes: '',
    // Headache specific
    headache_type: '',
    frequency: '',
    intensity: '',
    triggers: '',
    red_flags: 'Ingen røde flagg identifisert',
    // General
    question: '',
  });

  const labels = {
    no: {
      title: 'Generer Notat/Henvisning',
      subtitle: 'AI-assistert klinisk dokumentasjon',
      selectType: 'Velg dokumenttype',
      generate: 'Generer med AI',
      regenerate: 'Generer på nytt',
      copy: 'Kopier',
      copied: 'Kopiert!',
      download: 'Last ned',
      save: 'Lagre',
      preview: 'Forhåndsvisning',
      generating: 'Genererer...',
      recipient: 'Mottaker',
      institution: 'Institusjon/Avdeling',
      history: 'Sykehistorie',
      vestibularTests: 'Vestibulære tester',
      dixHallpike: 'Dix-Hallpike',
      hitTest: 'HIT-test',
      romberg: 'Romberg',
      vngNotes: 'VNG-notater',
      headacheDetails: 'Hodepinedetaljer',
      headacheType: 'Hodepinetype',
      frequency: 'Frekvens',
      intensity: 'Intensitet (VAS)',
      triggers: 'Triggere/ledsagende',
      redFlags: 'Røde flagg',
      question: 'Spørsmålsstilling',
      errorGenerating: 'Kunne ikke generere. Prøv igjen.',
      noPatient: 'Velg en pasient først',
    },
    en: {
      title: 'Generate Note/Referral',
      subtitle: 'AI-assisted clinical documentation',
      selectType: 'Select document type',
      generate: 'Generate with AI',
      regenerate: 'Regenerate',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      save: 'Save',
      preview: 'Preview',
      generating: 'Generating...',
      recipient: 'Recipient',
      institution: 'Institution/Department',
      history: 'Medical History',
      vestibularTests: 'Vestibular Tests',
      dixHallpike: 'Dix-Hallpike',
      hitTest: 'HIT Test',
      romberg: 'Romberg',
      vngNotes: 'VNG Notes',
      headacheDetails: 'Headache Details',
      headacheType: 'Headache Type',
      frequency: 'Frequency',
      intensity: 'Intensity (VAS)',
      triggers: 'Triggers/Associated',
      redFlags: 'Red Flags',
      question: 'Clinical Question',
      errorGenerating: 'Could not generate. Please try again.',
      noPatient: 'Select a patient first',
    },
  };

  const t = labels[language] || labels.no;
  const selectedTypeConfig = REFERRAL_TYPES.find((type) => type.id === selectedType);

  // Auto-populate from encounter data
  useEffect(() => {
    if (encounterData) {
      setClinicalFields((prev) => ({
        ...prev,
        history: encounterData.subjective?.history || encounterData.subjective?.chief_complaint || '',
      }));
    }
  }, [encounterData]);

  // Generate referral/note via API
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
            recipient: clinicalFields.recipient,
            provider: providerInfo,
            clinic: practiceInfo,
            // Vestibular data
            vngResults: clinicalFields.vng_notes,
            symptoms: clinicalFields.history,
          },
          additionalInfo: {
            institution: clinicalFields.institution,
            // Vestibular
            dix_hallpike: clinicalFields.dix_hallpike,
            hit_test: clinicalFields.hit_test,
            romberg: clinicalFields.romberg,
            // Headache
            headacheType: clinicalFields.headache_type,
            frequency: clinicalFields.frequency,
            triggers: clinicalFields.triggers,
            redFlags: clinicalFields.red_flags,
            // General
            question: clinicalFields.question,
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
      console.error('Generation error:', err);
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

  // Render type-specific fields
  const renderSpecificFields = () => {
    if (selectedTypeConfig?.category === 'vestibular') {
      return (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-900">{t.vestibularTests}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.dixHallpike}</label>
              <select
                value={clinicalFields.dix_hallpike}
                onChange={(e) => setClinicalFields({ ...clinicalFields, dix_hallpike: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Velg...</option>
                {VESTIBULAR_TESTS.dix_hallpike.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.hitTest}</label>
              <select
                value={clinicalFields.hit_test}
                onChange={(e) => setClinicalFields({ ...clinicalFields, hit_test: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Velg...</option>
                {VESTIBULAR_TESTS.hit_test.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.romberg}</label>
              <select
                value={clinicalFields.romberg}
                onChange={(e) => setClinicalFields({ ...clinicalFields, romberg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Velg...</option>
                {VESTIBULAR_TESTS.romberg.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.vngNotes}</label>
            <textarea
              value={clinicalFields.vng_notes}
              onChange={(e) => setClinicalFields({ ...clinicalFields, vng_notes: e.target.value })}
              placeholder="VNG-funn, nystagmus karakteristikk..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      );
    }

    if (selectedTypeConfig?.category === 'headache') {
      return (
        <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
          <p className="text-sm font-medium text-orange-900">{t.headacheDetails}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.headacheType}</label>
              <select
                value={clinicalFields.headache_type}
                onChange={(e) => setClinicalFields({ ...clinicalFields, headache_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Velg...</option>
                {HEADACHE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.frequency}</label>
              <input
                type="text"
                value={clinicalFields.frequency}
                onChange={(e) => setClinicalFields({ ...clinicalFields, frequency: e.target.value })}
                placeholder="F.eks. 3-4 ganger/uke"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.intensity}</label>
              <input
                type="text"
                value={clinicalFields.intensity}
                onChange={(e) => setClinicalFields({ ...clinicalFields, intensity: e.target.value })}
                placeholder="F.eks. 7-8/10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.triggers}</label>
            <textarea
              value={clinicalFields.triggers}
              onChange={(e) => setClinicalFields({ ...clinicalFields, triggers: e.target.value })}
              placeholder="Triggere, forverrende faktorer, ledsagende symptomer..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.redFlags}</label>
            <textarea
              value={clinicalFields.red_flags}
              onChange={(e) => setClinicalFields({ ...clinicalFields, red_flags: e.target.value })}
              placeholder="Røde flagg vurdering..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Document Type Selection */}
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
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTypeDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                {REFERRAL_TYPES.map((type) => (
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

        {/* Recipient/Institution */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.recipient}</label>
            <input
              type="text"
              value={clinicalFields.recipient}
              onChange={(e) => setClinicalFields({ ...clinicalFields, recipient: e.target.value })}
              placeholder="F.eks. ØNH-avdeling"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.institution}</label>
            <input
              type="text"
              value={clinicalFields.institution}
              onChange={(e) => setClinicalFields({ ...clinicalFields, institution: e.target.value })}
              placeholder="F.eks. Oslo universitetssykehus"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* History */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.history}</label>
          <textarea
            value={clinicalFields.history}
            onChange={(e) => setClinicalFields({ ...clinicalFields, history: e.target.value })}
            placeholder="Sykehistorie, symptombeskrivelse..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type-specific fields */}
        {renderSpecificFields()}

        {/* Clinical question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.question}</label>
          <textarea
            value={clinicalFields.question}
            onChange={(e) => setClinicalFields({ ...clinicalFields, question: e.target.value })}
            placeholder="Spørsmålsstilling/ønske om vurdering..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
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
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
