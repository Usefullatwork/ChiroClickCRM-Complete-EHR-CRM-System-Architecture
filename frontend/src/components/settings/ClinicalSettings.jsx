import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '../ui/ConfirmDialog';
import {
  FileText,
  Globe,
  Layers,
  Bone,
  Check,
  X,
  Edit3,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { spineTemplatesAPI } from '../../services/api';
import toast from '../../utils/toast';

// Adjustment notation methods available in the system
const ADJUSTMENT_NOTATION_METHODS = [
  {
    id: 'segment_listing',
    name: { en: 'Segment Listing', no: 'Segmentlisting' },
    description: {
      en: 'Traditional chiropractic listing notation (e.g., C5 PRS, T4 PL-SP)',
      no: 'Tradisjonell kiropraktisk listingnotasjon (f.eks. C5 PRS, T4 PL-SP)',
    },
  },
  {
    id: 'body_chart',
    name: { en: 'Body Chart', no: 'Kroppskart' },
    description: {
      en: 'Visual body diagram with symptom markers and regions',
      no: 'Visuelt kroppsdiagram med symptommarkører og regioner',
    },
  },
  {
    id: 'anatomical_chart',
    name: { en: 'Anatomical Chart', no: 'Anatomisk Kart' },
    description: {
      en: 'Detailed anatomy with dermatomes, muscles, and trigger points',
      no: 'Detaljert anatomi med dermatomer, muskler og triggerpunkter',
    },
  },
  {
    id: 'soap_narrative',
    name: { en: 'SOAP Narrative', no: 'SOAP Narrativ' },
    description: {
      en: 'Text-based SOAP note format with structured sections',
      no: 'Tekstbasert SOAP-notatformat med strukturerte seksjoner',
    },
  },
  {
    id: 'activator_protocol',
    name: { en: 'Activator Protocol', no: 'Aktivator Protokoll' },
    description: {
      en: 'Activator Methods leg check and isolation testing protocol',
      no: 'Aktivator-metodens beinkontroll og isolasjonstesting',
    },
  },
  {
    id: 'gonstead_listing',
    name: { en: 'Gonstead Listing', no: 'Gonstead Listing' },
    description: {
      en: 'Gonstead system notation (PR, PL, PRS, PLS, PRI, PLI, AS, AI, etc.)',
      no: 'Gonstead-systemnotasjon (PR, PL, PRS, PLS, PRI, PLI, AS, AI, osv.)',
    },
  },
  {
    id: 'diversified_notation',
    name: { en: 'Diversified Notation', no: 'Diversifisert Notasjon' },
    description: {
      en: 'Standard diversified technique documentation',
      no: 'Standard diversifisert teknikk-dokumentasjon',
    },
  },
  {
    id: 'facial_lines',
    name: { en: 'Facial Lines Chart', no: 'Ansiktslinjer Kart' },
    description: {
      en: 'Fascial lines and trigger points for facial/TMJ treatment',
      no: 'Fascielinjer og triggerpunkter for ansikts-/TMJ-behandling',
    },
  },
];

export default function ClinicalSettings({ t, clinicalPrefs, onClinicalPrefChange }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const lang = clinicalPrefs.language || 'no';

  // Spine templates state
  const [expandedSpineRegions, setExpandedSpineRegions] = useState({});
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateEditText, setTemplateEditText] = useState('');

  // Fetch spine templates
  const { data: spineTemplatesResponse, isLoading: spineTemplatesLoading } = useQuery({
    queryKey: ['spine-templates-grouped'],
    queryFn: () => spineTemplatesAPI.getGrouped(clinicalPrefs.language || 'NO'),
  });

  const spineTemplates = spineTemplatesResponse?.data || {};

  // Spine template regions for display
  const SPINE_REGIONS_CONFIG = {
    cervical: {
      label: lang === 'no' ? 'Cervical (nakke)' : 'Cervical',
      segments: ['C0-C1', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    },
    thoracic: {
      label: lang === 'no' ? 'Thoracal (bryst)' : 'Thoracic',
      segments: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    },
    lumbar: {
      label: lang === 'no' ? 'Lumbal (korsrygg)' : 'Lumbar',
      segments: ['L1', 'L2', 'L3', 'L4', 'L5'],
    },
    sacral: {
      label: lang === 'no' ? 'Sakral/Bekken' : 'Sacral/Pelvis',
      segments: ['Sacrum', 'SI-L', 'SI-R', 'Coccyx'],
    },
    muscle: {
      label: lang === 'no' ? 'Muskulatur' : 'Muscles',
      segments: ['C-para', 'T-para', 'L-para', 'QL', 'Piriformis'],
    },
  };

  // Update spine template mutation
  const updateSpineTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => spineTemplatesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['spine-templates-grouped']);
      setEditingTemplate(null);
      setTemplateEditText('');
      toast.success(lang === 'no' ? 'Mal oppdatert' : 'Template updated');
    },
    onError: (error) => {
      toast.error(
        `${lang === 'no' ? 'Kunne ikke oppdatere mal' : 'Failed to update template'}: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // Reset spine templates mutation
  const resetSpineTemplatesMutation = useMutation({
    mutationFn: () => spineTemplatesAPI.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries(['spine-templates-grouped']);
      toast.success(
        lang === 'no' ? 'Maler tilbakestilt til standard' : 'Templates reset to defaults'
      );
    },
    onError: (error) => {
      toast.error(
        `${lang === 'no' ? 'Kunne ikke tilbakestille maler' : 'Failed to reset templates'}: ${error.response?.data?.message || error.message}`
      );
    },
  });

  const toggleSpineRegion = (region) => {
    setExpandedSpineRegions((prev) => ({ ...prev, [region]: !prev[region] }));
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateEditText(template.text_template);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate && templateEditText.trim()) {
      updateSpineTemplateMutation.mutate({
        id: editingTemplate.id,
        data: { text_template: templateEditText.trim() },
      });
    }
  };

  const handleCancelTemplateEdit = () => {
    setEditingTemplate(null);
    setTemplateEditText('');
  };

  const handleResetTemplates = async () => {
    const ok = await confirm({
      title: lang === 'no' ? 'Tilbakestill maler' : 'Reset templates',
      description:
        lang === 'no'
          ? 'Er du sikker på at du vil tilbakestille alle palpasjonsmaler til standard? Dette kan ikke angres.'
          : 'Are you sure you want to reset all palpation templates to defaults? This cannot be undone.',
      variant: 'destructive',
    });
    if (ok) resetSpineTemplatesMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Adjustment Notation Method */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('adjustmentNotation')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-200">
                {t('adjustmentNotationDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {ADJUSTMENT_NOTATION_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  clinicalPrefs.adjustmentNotation === method.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="adjustmentNotation"
                  value={method.id}
                  checked={clinicalPrefs.adjustmentNotation === method.id}
                  onChange={(e) => onClinicalPrefChange('adjustmentNotation', e.target.value)}
                  className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {method.name[lang] || method.name.en}
                    </span>
                    {clinicalPrefs.adjustmentNotation === method.id && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                        {t('activeLabel')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
                    {method.description[lang] || method.description.en}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Language Preference */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('languageSetting')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-200">{t('languageSettingDesc')}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                clinicalPrefs.language === 'no'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="language"
                value="no"
                checked={clinicalPrefs.language === 'no'}
                onChange={(e) => onClinicalPrefChange('language', e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Norsk</span>
                <p className="text-xs text-gray-500 dark:text-gray-200">{t('norwegian')}</p>
              </div>
            </label>

            <label
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                clinicalPrefs.language === 'en'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="language"
                value="en"
                checked={clinicalPrefs.language === 'en'}
                onChange={(e) => onClinicalPrefChange('language', e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">English</span>
                <p className="text-xs text-gray-500 dark:text-gray-200">{t('english')}</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Chart Display Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('chartDisplay')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-200">{t('chartDisplayDesc')}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Show Dermatomes */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('showDermatomes')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-200">{t('showDermatomesDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={clinicalPrefs.showDermatomes}
                onChange={(e) => onClinicalPrefChange('showDermatomes', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Show Trigger Points */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('showTriggerPoints')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-200">
                {t('showTriggerPointsDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={clinicalPrefs.showTriggerPoints}
                onChange={(e) => onClinicalPrefChange('showTriggerPoints', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Auto Generate Narrative */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('autoGenerateNarrative')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-200">
                {t('autoGenerateNarrativeDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={clinicalPrefs.autoGenerateNarrative}
                onChange={(e) => onClinicalPrefChange('autoGenerateNarrative', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Spine Palpation Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Bone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {lang === 'no'
                    ? 'Palpasjonsmaler (Rask-klikk)'
                    : 'Palpation Templates (Quick-Click)'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-200">
                  {lang === 'no'
                    ? 'Tilpass tekstmaler for rask palpasjonsdokumentasjon'
                    : 'Customize text templates for rapid palpation documentation'}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetTemplates}
              disabled={resetSpineTemplatesMutation.isPending}
              className="px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {lang === 'no' ? 'Tilbakestill' : 'Reset'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {spineTemplatesLoading ? (
            <div className="px-6 py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-200 mt-2">
                {lang === 'no' ? 'Laster maler...' : 'Loading templates...'}
              </p>
            </div>
          ) : (
            Object.entries(SPINE_REGIONS_CONFIG).map(([regionKey, regionConfig]) => (
              <div key={regionKey}>
                {/* Region Header */}
                <button
                  onClick={() => toggleSpineRegion(regionKey)}
                  className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {regionConfig.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-200">
                      {regionConfig.segments.length} {lang === 'no' ? 'segmenter' : 'segments'}
                    </span>
                    {expandedSpineRegions[regionKey] ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Templates */}
                {expandedSpineRegions[regionKey] && (
                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 space-y-2">
                    {regionConfig.segments.map((segment) => {
                      const segmentTemplates = spineTemplates[segment] || [];
                      return (
                        <div
                          key={segment}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-white">
                              {segment}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {segmentTemplates.map((template) => (
                              <div
                                key={template.id}
                                className="flex items-center gap-2 text-xs group"
                              >
                                <span className="w-16 text-gray-500 dark:text-gray-200 uppercase">
                                  {template.direction === 'left' &&
                                    (lang === 'no' ? 'Venstre' : 'Left')}
                                  {template.direction === 'right' &&
                                    (lang === 'no' ? 'Høyre' : 'Right')}
                                  {template.direction === 'bilateral' && 'Bilateral'}
                                  {template.direction === 'posterior' && 'Posterior'}
                                  {template.direction === 'anterior' && 'Anterior'}
                                  {template.direction === 'superior' && 'Superior'}
                                  {template.direction === 'inferior' && 'Inferior'}
                                  {template.direction === 'inflare' && 'Inflare'}
                                  {template.direction === 'outflare' && 'Outflare'}
                                </span>
                                {editingTemplate?.id === template.id ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={templateEditText}
                                      onChange={(e) => setTemplateEditText(e.target.value)}
                                      className="flex-1 px-2 py-1 text-xs border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                      autoFocus
                                    />
                                    <button
                                      onClick={handleSaveTemplate}
                                      disabled={updateSpineTemplateMutation.isPending}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={handleCancelTemplateEdit}
                                      className="p-1 text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700 rounded"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1 text-gray-600 dark:text-white truncate">
                                      {template.text_template}
                                    </span>
                                    <button
                                      onClick={() => handleEditTemplate(template)}
                                      className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title={lang === 'no' ? 'Rediger' : 'Edit'}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                            {segmentTemplates.length === 0 && (
                              <p className="text-xs text-gray-400 italic">
                                {lang === 'no' ? 'Ingen maler funnet' : 'No templates found'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Current Selection Summary */}
      <div className="bg-teal-50 rounded-lg border border-teal-200 p-4">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-teal-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-teal-900">{t('activeNotation')}</p>
            <p className="text-sm text-teal-700 mt-1">
              {ADJUSTMENT_NOTATION_METHODS.find((m) => m.id === clinicalPrefs.adjustmentNotation)
                ?.name[lang] ||
                ADJUSTMENT_NOTATION_METHODS.find((m) => m.id === clinicalPrefs.adjustmentNotation)
                  ?.name.en}
            </p>
            <p className="text-xs text-teal-600 mt-2">{t('activeNotationDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
