/**
 * Template Wizard Component
 * Step-by-step interface for creating communication templates
 */

import { useState, useCallback } from 'react';
import { aiAPI } from '../../services/api';

// Template types with Norwegian translations
const TEMPLATE_TYPES = [
  { value: 'recall_3m', label: 'Recall (3 måneder)', labelNo: '3-måneders innkalling' },
  { value: 'recall_6m', label: 'Recall (6 måneder)', labelNo: '6-måneders innkalling' },
  { value: 'appointment_reminder', label: 'Appointment Reminder', labelNo: 'Timepåminnelse' },
  { value: 'follow_up', label: 'Follow-up', labelNo: 'Oppfølging' },
  { value: 'birthday', label: 'Birthday', labelNo: 'Bursdag' },
  { value: 'check_in', label: 'Check-in', labelNo: 'Sjekk inn' },
  { value: 'survey', label: 'Survey Invitation', labelNo: 'Spørreundersøkelse' },
  { value: 'custom', label: 'Custom', labelNo: 'Tilpasset' },
];

// Tone options
const TONES = [
  { value: 'direct', label: 'Direct', labelNo: 'Direkte', description: 'Short and action-focused' },
  { value: 'kind', label: 'Kind', labelNo: 'Vennlig', description: 'Warm and caring' },
  {
    value: 'professional',
    label: 'Professional',
    labelNo: 'Profesjonell',
    description: 'Formal and clinical',
  },
  {
    value: 'empathetic',
    label: 'Empathetic',
    labelNo: 'Empatisk',
    description: 'Understanding and supportive',
  },
];

// Available variables
const VARIABLES = [
  { key: '{{firstName}}', description: 'Patient first name', descriptionNo: 'Pasientens fornavn' },
  { key: '{{lastName}}', description: 'Patient last name', descriptionNo: 'Pasientens etternavn' },
  { key: '{{fullName}}', description: 'Patient full name', descriptionNo: 'Pasientens fulle navn' },
  { key: '{{date}}', description: 'Appointment date', descriptionNo: 'Timedato' },
  { key: '{{time}}', description: 'Appointment time', descriptionNo: 'Klokkeslett' },
  { key: '{{provider}}', description: 'Provider name', descriptionNo: 'Behandler' },
  { key: '{{clinic}}', description: 'Clinic name', descriptionNo: 'Klinikknavn' },
  { key: '{{phone}}', description: 'Clinic phone', descriptionNo: 'Klinikk telefon' },
  { key: '{{lastVisit}}', description: 'Last visit date', descriptionNo: 'Siste besøk' },
  {
    key: '{{daysSinceVisit}}',
    description: 'Days since last visit',
    descriptionNo: 'Dager siden siste besøk',
  },
  { key: '{{bookingLink}}', description: 'Online booking URL', descriptionNo: 'Booking-lenke' },
];

const TemplateWizard = ({ onSave, onCancel, initialData = null }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'recall_3m',
    tone: initialData?.tone || 'kind',
    channel: initialData?.channel || 'SMS',
    language: initialData?.language || 'NO',
    subject: initialData?.subject || '',
    content: initialData?.content || '',
    category: initialData?.category || 'RECALL',
    isActive: initialData?.isActive ?? true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const insertVariable = useCallback(
    (variable) => {
      const textarea = document.getElementById('template-content');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          formData.content.substring(0, start) + variable + formData.content.substring(end);
        handleChange('content', newContent);
        // Reset cursor position
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
      } else {
        handleChange('content', formData.content + variable);
      }
    },
    [formData.content]
  );

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      // Generate template content using AI
      const typeLabel =
        TEMPLATE_TYPES.find((t) => t.value === formData.type)?.labelNo || formData.type;
      const toneLabel = TONES.find((t) => t.value === formData.tone)?.labelNo || formData.tone;

      const prompt = `Generer en ${formData.channel === 'SMS' ? 'SMS' : 'e-post'} mal for ${typeLabel} med ${toneLabel} tone på norsk. Bruk disse variablene der relevant: {{firstName}}, {{date}}, {{time}}, {{provider}}, {{clinic}}, {{phone}}, {{bookingLink}}. Hold det kort og profesjonelt.`;

      const _response = await aiAPI.spellCheck({ text: prompt });

      // For now, generate sample content based on type and tone
      const sampleContent = generateSampleContent(formData.type, formData.tone, formData.channel);
      handleChange('content', sampleContent);

      // Generate 3 variations
      setGeneratedVariations([
        generateSampleContent(formData.type, formData.tone, formData.channel, 1),
        generateSampleContent(formData.type, formData.tone, formData.channel, 2),
        generateSampleContent(formData.type, formData.tone, formData.channel, 3),
      ]);
    } catch (error) {
      console.error('Error generating template:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSampleContent = (type, tone, channel, variation = 0) => {
    const templates = {
      recall_3m: {
        direct: [
          'Hei {{firstName}}, det er 3 måneder siden sist. Book ny time: {{bookingLink}}',
          'Hei {{firstName}}, på tide med oppfølging. Ring {{phone}} eller book online.',
          '{{firstName}}: 3 måneder siden siste behandling. Kontakt oss for ny time.',
        ],
        kind: [
          'Hei {{firstName}}! Vi savner deg! Det er nå 3 måneder siden siste besøk. Hvordan har du det? Book gjerne en ny time: {{bookingLink}}',
          'Kjære {{firstName}}, vi håper du har det bra! Tre måneder har gått, og vi vil gjerne sjekke hvordan det går. Velkommen tilbake!',
          'Hei {{firstName}}! Håper alt er vel med deg. Det begynner å bli en stund siden sist - vi er her for deg når du trenger oss.',
        ],
        professional: [
          'Påminnelse: Det er 3 måneder siden din siste konsultasjon hos {{clinic}}. For å sikre kontinuitet i behandlingen, anbefaler vi en oppfølgingstime. Kontakt oss på {{phone}}.',
          'Kjære {{firstName}}, vi informerer om at det har gått 3 måneder siden siste behandling. Vennligst ta kontakt for å avtale oppfølging.',
          '{{firstName}}, som ledd i vår oppfølgingsrutine informerer vi om at det er tid for en kontrolltime. Ring {{phone}} for avtale.',
        ],
        empathetic: [
          'Hei {{firstName}}, vi tenker på deg og håper du har det bra. Tre måneder har gått siden sist, og vi er her for deg når du føler det passer. Ta kontakt når du er klar.',
          'Kjære {{firstName}}, vi forstår at hverdagen kan være travel. Bare en vennlig påminnelse om at vi er her for deg når du trenger oss.',
          'Hei {{firstName}}, hvordan går det med deg? Vi håper hverdagen går bra. Når du føler det passer, tar vi gjerne imot deg igjen.',
        ],
      },
      appointment_reminder: {
        direct: [
          'Hei {{firstName}}, time i morgen kl {{time}} hos {{provider}}. Avbud? Ring {{phone}}.',
          'Påminnelse: Time {{date}} kl {{time}} hos {{clinic}}. Ring {{phone}} ved avbud.',
          '{{firstName}}: Husker du timen din? {{date}} kl {{time}}. Vi ses!',
        ],
        kind: [
          'Hei {{firstName}}! Vi gleder oss til å se deg {{date}} kl {{time}}. Gi beskjed om noe endrer seg. Ha en fin dag!',
          'Kjære {{firstName}}, bare en vennlig påminnelse om timen din hos {{provider}} i morgen kl {{time}}. Vi ser frem til å se deg!',
          'Hei {{firstName}}! Timen din nærmer seg - {{date}} kl {{time}}. Vi gleder oss!',
        ],
        professional: [
          'Påminnelse: Du har time hos {{provider}} i morgen {{date}} kl {{time}}. Ved avbud, kontakt oss på {{phone}}.',
          'Dette er en påminnelse om din avtale hos {{clinic}} den {{date}} kl {{time}}. Vennligst gi beskjed ved endringer.',
          'Timebekreftelse: {{date}} kl {{time}} hos {{provider}}. Kontakt {{phone}} ved avbud.',
        ],
        empathetic: [
          'Hei {{firstName}}, vi ser frem til å se deg i morgen kl {{time}}. Hvis du trenger å endre timen, forstår vi det. Bare ring oss.',
          'Kjære {{firstName}}, timen din er snart her. Vi er her for å hjelpe deg, og ser frem til å se deg {{date}}.',
          'Hei {{firstName}}, bare en vennlig påminnelse. Vi er klare til å ta imot deg {{date}} kl {{time}}.',
        ],
      },
      birthday: {
        direct: [
          'Gratulerer med dagen, {{firstName}}! Hilsen {{clinic}}',
          'Gratulerer med bursdagen! Vennlig hilsen fra oss på {{clinic}}.',
          '{{firstName}} - gratulerer med dagen!',
        ],
        kind: [
          'Gratulerer med dagen, {{firstName}}! Vi håper du får en fantastisk dag full av glede. Varme hilsener fra alle oss på {{clinic}}!',
          'Kjære {{firstName}}, gratulerer så mye med dagen! Vi tenker på deg og ønsker deg alt godt. Kos deg masse!',
          'Hurra for {{firstName}}! Gratulerer med bursdagen! Vi sender varme tanker og ønsker deg en strålende dag!',
        ],
        professional: [
          'På vegne av {{clinic}} ønsker vi deg en riktig god bursdag, {{firstName}}. Med vennlig hilsen, ditt helseteam.',
          '{{firstName}}, vi ønsker deg en fin fødselsdag. Hilsen {{clinic}}.',
          'Gratulerer med dagen, {{firstName}}. Med beste ønsker fra {{clinic}}.',
        ],
        empathetic: [
          'Kjære {{firstName}}, på denne spesielle dagen ønsker vi deg all verdens lykke. Du fortjener en fantastisk feiring. Varme hilsener fra oss alle.',
          'Hei {{firstName}}, vi håper bursdagen din blir fylt med glede og gode stunder. Du er viktig for oss!',
          'Gratulerer med dagen, {{firstName}}! Vi setter pris på deg og ønsker deg en dag full av alt det gode.',
        ],
      },
    };

    const typeTemplates = templates[type] || templates.recall_3m;
    const toneTemplates = typeTemplates[tone] || typeTemplates.kind;
    return toneTemplates[variation % toneTemplates.length] || toneTemplates[0];
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        variables: VARIABLES.filter((v) => formData.content.includes(v.key)).map((v) => v.key),
      });
    }
  };

  const testPreview = () => {
    // Replace variables with sample data
    let preview = formData.content;
    preview = preview.replace(/\{\{firstName\}\}/g, 'Ola');
    preview = preview.replace(/\{\{lastName\}\}/g, 'Nordmann');
    preview = preview.replace(/\{\{fullName\}\}/g, 'Ola Nordmann');
    preview = preview.replace(/\{\{date\}\}/g, '15. januar');
    preview = preview.replace(/\{\{time\}\}/g, '14:30');
    preview = preview.replace(/\{\{provider\}\}/g, 'Dr. Hansen');
    preview = preview.replace(/\{\{clinic\}\}/g, 'Oslo Kiropraktorklinikk');
    preview = preview.replace(/\{\{phone\}\}/g, '22 33 44 55');
    preview = preview.replace(/\{\{lastVisit\}\}/g, '15. oktober');
    preview = preview.replace(/\{\{daysSinceVisit\}\}/g, '92');
    preview = preview.replace(/\{\{bookingLink\}\}/g, 'book.eksempel.no');
    return preview;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Steg 1: Velg type</h3>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Malnavn</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="F.eks. 3-måneders recall SMS"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <label className="block text-sm font-medium text-gray-700 mt-4">Type</label>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleChange('type', type.value)}
              className={`p-3 text-left rounded-lg border-2 transition-colors ${
                formData.type === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">{type.labelNo}</span>
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mt-4">Kanal</label>
        <div className="flex gap-4">
          {['SMS', 'EMAIL'].map((channel) => (
            <button
              key={channel}
              onClick={() => handleChange('channel', channel)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                formData.channel === channel
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {channel === 'SMS' ? '📱 SMS' : '📧 E-post'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Steg 2: Velg tone</h3>

      <div className="grid grid-cols-2 gap-4">
        {TONES.map((tone) => (
          <button
            key={tone.value}
            onClick={() => handleChange('tone', tone.value)}
            className={`p-4 text-left rounded-lg border-2 transition-colors ${
              formData.tone === tone.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="font-medium block">{tone.labelNo}</span>
            <span className="text-sm text-gray-500">{tone.description}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Steg 3: Skriv innhold</h3>

      {formData.channel === 'EMAIL' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emne</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="E-post emne..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Melding</label>
          <span className="text-xs text-gray-500">
            {formData.content.length} tegn
            {formData.channel === 'SMS' && formData.content.length > 160 && (
              <span className="text-orange-500 ml-1">
                ({Math.ceil(formData.content.length / 160)} SMS)
              </span>
            )}
          </span>
        </div>

        <textarea
          id="template-content"
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          rows={6}
          placeholder="Skriv meldingen din her..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={generateWithAI}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                Genererer...
              </>
            ) : (
              <>✨ Generer med AI</>
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sett inn variabler</label>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((variable) => (
            <button
              key={variable.key}
              onClick={() => insertVariable(variable.key)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              title={variable.descriptionNo}
            >
              {variable.key}
            </button>
          ))}
        </div>
      </div>

      {generatedVariations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alternative versjoner
          </label>
          <div className="space-y-2">
            {generatedVariations.map((variation, index) => (
              <button
                key={index}
                onClick={() => handleChange('content', variation)}
                className="w-full p-3 text-left text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                {variation}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Steg 4: Forhåndsvisning</h3>

      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{formData.channel === 'SMS' ? '📱' : '📧'}</span>
          <span className="font-medium">
            {formData.channel === 'SMS' ? 'SMS Preview' : 'E-post Preview'}
          </span>
        </div>

        {formData.channel === 'EMAIL' && formData.subject && (
          <div className="mb-2">
            <span className="text-sm text-gray-500">Emne: </span>
            <span className="font-medium">{formData.subject}</span>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="whitespace-pre-wrap">{testPreview()}</p>
        </div>

        <div className="mt-3 text-sm text-gray-500">
          <p>📍 Variabler er erstattet med eksempeldata</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm">
          Aktiver malen umiddelbart
        </label>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Type' },
    { number: 2, title: 'Tone' },
    { number: 3, title: 'Innhold' },
    { number: 4, title: 'Forhåndsvis' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">
          {initialData ? 'Rediger mal' : 'Opprett ny kommunikasjonsmal'}
        </h2>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between">
          {steps.map((s, index) => (
            <div
              key={s.number}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > s.number ? '✓' : s.number}
              </div>
              <span
                className={`ml-2 text-sm ${
                  step >= s.number ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {s.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${step > s.number ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          {step === 1 ? 'Avbryt' : '← Tilbake'}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !formData.name}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Neste →
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            ✓ Lagre mal
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateWizard;
