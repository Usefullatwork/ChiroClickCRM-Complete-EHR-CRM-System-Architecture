import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  User,
  Bell,
  Key,
  Save,
  Loader2,
  Check,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  CreditCard,
  Database,
  AlertCircle,
  Brain,
  Monitor,
  ExternalLink,
  Stethoscope,
  FileText,
  Layers,
  Dumbbell,
  Search,
  Plus,
  Edit3,
  Trash2,
  Video,
  Image,
  X,
  ChevronDown,
  ChevronUp,
  Bone,
  RotateCcw,
} from 'lucide-react';
import { organizationAPI, usersAPI, exercisesAPI, spineTemplatesAPI } from '../services/api';
import { formatDate } from '../lib/utils';
import AISettings from '../components/AISettings';
import { useTranslation } from '../i18n';
import toast from '../utils/toast';

// Adjustment notation methods available in the system
const ADJUSTMENT_NOTATION_METHODS = [
  {
    id: 'segment_listing',
    name: { en: 'Segment Listing', no: 'Segmentlisting' },
    description: {
      en: 'Traditional chiropractic listing notation (e.g., C5 PRS, T4 PL-SP)',
      no: 'Tradisjonell kiropraktisk listingnotasjon (f.eks. C5 PRS, T4 PL-SP)',
    },
    icon: 'list',
  },
  {
    id: 'body_chart',
    name: { en: 'Body Chart', no: 'Kroppskart' },
    description: {
      en: 'Visual body diagram with symptom markers and regions',
      no: 'Visuelt kroppsdiagram med symptommarkører og regioner',
    },
    icon: 'body',
  },
  {
    id: 'anatomical_chart',
    name: { en: 'Anatomical Chart', no: 'Anatomisk Kart' },
    description: {
      en: 'Detailed anatomy with dermatomes, muscles, and trigger points',
      no: 'Detaljert anatomi med dermatomer, muskler og triggerpunkter',
    },
    icon: 'anatomy',
  },
  {
    id: 'soap_narrative',
    name: { en: 'SOAP Narrative', no: 'SOAP Narrativ' },
    description: {
      en: 'Text-based SOAP note format with structured sections',
      no: 'Tekstbasert SOAP-notatformat med strukturerte seksjoner',
    },
    icon: 'text',
  },
  {
    id: 'activator_protocol',
    name: { en: 'Activator Protocol', no: 'Aktivator Protokoll' },
    description: {
      en: 'Activator Methods leg check and isolation testing protocol',
      no: 'Aktivator-metodens beinkontroll og isolasjonstesting',
    },
    icon: 'activator',
  },
  {
    id: 'gonstead_listing',
    name: { en: 'Gonstead Listing', no: 'Gonstead Listing' },
    description: {
      en: 'Gonstead system notation (PR, PL, PRS, PLS, PRI, PLI, AS, AI, etc.)',
      no: 'Gonstead-systemnotasjon (PR, PL, PRS, PLS, PRI, PLI, AS, AI, osv.)',
    },
    icon: 'gonstead',
  },
  {
    id: 'diversified_notation',
    name: { en: 'Diversified Notation', no: 'Diversifisert Notasjon' },
    description: {
      en: 'Standard diversified technique documentation',
      no: 'Standard diversifisert teknikk-dokumentasjon',
    },
    icon: 'diversified',
  },
  {
    id: 'facial_lines',
    name: { en: 'Facial Lines Chart', no: 'Ansiktslinjer Kart' },
    description: {
      en: 'Fascial lines and trigger points for facial/TMJ treatment',
      no: 'Fascielinjer og triggerpunkter for ansikts-/TMJ-behandling',
    },
    icon: 'face',
  },
];

// Default clinical preferences
const DEFAULT_CLINICAL_PREFS = {
  adjustmentNotation: 'segment_listing',
  language: 'no',
  showDermatomes: true,
  showTriggerPoints: true,
  autoGenerateNarrative: true,
  defaultView: 'front',
};

export default function Settings() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('organization');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Clinical preferences state
  const [clinicalPrefs, setClinicalPrefs] = useState(() => {
    const saved = localStorage.getItem('chiroclick_clinical_prefs');
    return saved ? JSON.parse(saved) : DEFAULT_CLINICAL_PREFS;
  });

  // Save clinical preferences to localStorage
  useEffect(() => {
    localStorage.setItem('chiroclick_clinical_prefs', JSON.stringify(clinicalPrefs));
  }, [clinicalPrefs]);

  // Exercise management state
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState('');
  const [exerciseBodyRegionFilter, setExerciseBodyRegionFilter] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseModalMode, setExerciseModalMode] = useState(null); // 'create' | 'edit' | null
  const [exerciseFormData, setExerciseFormData] = useState({});

  // Spine templates state
  const [expandedSpineRegions, setExpandedSpineRegions] = useState({});
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateEditText, setTemplateEditText] = useState('');

  const handleClinicalPrefChange = (key, value) => {
    setClinicalPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const lang = clinicalPrefs.language || 'no';

  // Fetch organization data
  const { data: orgResponse, isLoading: orgLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationAPI.getCurrent(),
  });

  const organization = orgResponse?.data?.organization || {};

  // Fetch current user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => usersAPI.getCurrent(),
  });

  const currentUser = userResponse?.data?.user || {};

  // Fetch organization users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['organization-users'],
    queryFn: () => organizationAPI.getUsers(),
    enabled: activeTab === 'users',
  });

  const organizationUsers = usersResponse?.data?.users || [];

  // Fetch exercises for the exercises tab
  const { data: exercisesResponse, isLoading: exercisesLoading } = useQuery({
    queryKey: ['exercises', exerciseSearch, exerciseCategoryFilter, exerciseBodyRegionFilter],
    queryFn: () =>
      exercisesAPI.getAll({
        search: exerciseSearch || undefined,
        category: exerciseCategoryFilter || undefined,
        bodyRegion: exerciseBodyRegionFilter || undefined,
        limit: 100,
      }),
    enabled: activeTab === 'exercises',
  });

  const exercises = exercisesResponse?.data?.exercises || [];

  // Fetch exercise categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['exercise-categories'],
    queryFn: () => exercisesAPI.getCategories(),
    enabled: activeTab === 'exercises',
  });

  const exerciseCategories = categoriesResponse?.data?.categories || [];

  // Fetch exercise body regions
  const { data: bodyRegionsResponse } = useQuery({
    queryKey: ['exercise-body-regions'],
    queryFn: () => exercisesAPI.getBodyRegions(),
    enabled: activeTab === 'exercises',
  });

  const exerciseBodyRegions = bodyRegionsResponse?.data?.bodyRegions || [];

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: (data) => organizationAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization']);
      setEditMode(false);
      toast.success(t('orgUpdatedSuccess'));
    },
    onError: (error) => {
      toast.error(`${t('orgUpdateFailed')}: ${error.response?.data?.message || error.message}`);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => usersAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      setEditMode(false);
      toast.success(t('profileUpdatedSuccess'));
    },
    onError: (error) => {
      toast.error(`${t('profileUpdateFailed')}: ${error.response?.data?.message || error.message}`);
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: (data) => organizationAPI.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization-users']);
      toast.success(t('userInvitedSuccess'));
    },
    onError: (error) => {
      toast.error(`${t('userInviteFailed')}: ${error.response?.data?.message || error.message}`);
    },
  });

  // Create exercise mutation
  const createExerciseMutation = useMutation({
    mutationFn: (data) => exercisesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
      setExerciseModalMode(null);
      setExerciseFormData({});
      toast.success(lang === 'no' ? 'Øvelse opprettet' : 'Exercise created');
    },
    onError: (error) => {
      toast.error(
        `${lang === 'no' ? 'Kunne ikke opprette øvelse' : 'Failed to create exercise'}: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // Update exercise mutation
  const updateExerciseMutation = useMutation({
    mutationFn: ({ id, data }) => exercisesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
      setExerciseModalMode(null);
      setSelectedExercise(null);
      setExerciseFormData({});
      toast.success(lang === 'no' ? 'Øvelse oppdatert' : 'Exercise updated');
    },
    onError: (error) => {
      toast.error(
        `${lang === 'no' ? 'Kunne ikke oppdatere øvelse' : 'Failed to update exercise'}: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // Delete exercise mutation
  const deleteExerciseMutation = useMutation({
    mutationFn: (id) => exercisesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
      toast.success(lang === 'no' ? 'Øvelse slettet' : 'Exercise deleted');
    },
    onError: (error) => {
      toast.error(
        `${lang === 'no' ? 'Kunne ikke slette øvelse' : 'Failed to delete exercise'}: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // Fetch spine templates for clinical tab
  const { data: spineTemplatesResponse, isLoading: spineTemplatesLoading } = useQuery({
    queryKey: ['spine-templates-grouped'],
    queryFn: () => spineTemplatesAPI.getGrouped(clinicalPrefs.language || 'NO'),
    enabled: activeTab === 'clinical',
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

  // Spine template handlers
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

  const handleResetTemplates = () => {
    if (
      window.confirm(
        lang === 'no'
          ? 'Er du sikker på at du vil tilbakestille alle palpasjonsmaler til standard? Dette kan ikke angres.'
          : 'Are you sure you want to reset all palpation templates to defaults? This cannot be undone.'
      )
    ) {
      resetSpineTemplatesMutation.mutate();
    }
  };

  const handleSave = () => {
    if (activeTab === 'organization') {
      updateOrgMutation.mutate(formData);
    } else if (activeTab === 'profile') {
      updateUserMutation.mutate(formData);
    }
  };

  const handleEdit = (data) => {
    setFormData(data);
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormData({});
    setEditMode(false);
  };

  const handleInviteUser = () => {
    const email = prompt(t('enterEmailToInvite'));
    if (email) {
      const role = prompt(t('enterRole'), 'PRACTITIONER');
      if (role) {
        inviteUserMutation.mutate({ email, role });
      }
    }
  };

  // Exercise handlers
  const handleOpenExerciseCreate = () => {
    setExerciseFormData({
      name_no: '',
      name_en: '',
      category: 'strengthening',
      body_region: 'core',
      difficulty: 'beginner',
      instructions_no: '',
      instructions_en: '',
      contraindications: '',
      precautions: '',
      default_sets: 3,
      default_reps: 10,
      default_hold_seconds: null,
      default_frequency: 'daily',
      video_url: '',
      image_url: '',
      equipment_needed: [],
      tags: [],
    });
    setExerciseModalMode('create');
  };

  const handleOpenExerciseEdit = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseFormData({
      name_no: exercise.name_no || '',
      name_en: exercise.name_en || '',
      category: exercise.category || 'strengthening',
      body_region: exercise.body_region || 'core',
      difficulty: exercise.difficulty || 'beginner',
      instructions_no: exercise.instructions_no || '',
      instructions_en: exercise.instructions_en || '',
      contraindications: exercise.contraindications || '',
      precautions: exercise.precautions || '',
      default_sets: exercise.default_sets || 3,
      default_reps: exercise.default_reps || 10,
      default_hold_seconds: exercise.default_hold_seconds || null,
      default_frequency: exercise.default_frequency || 'daily',
      video_url: exercise.video_url || '',
      image_url: exercise.image_url || '',
      equipment_needed: exercise.equipment_needed || [],
      tags: exercise.tags || [],
    });
    setExerciseModalMode('edit');
  };

  const handleSaveExercise = () => {
    if (exerciseModalMode === 'create') {
      createExerciseMutation.mutate(exerciseFormData);
    } else if (exerciseModalMode === 'edit' && selectedExercise) {
      updateExerciseMutation.mutate({ id: selectedExercise.id, data: exerciseFormData });
    }
  };

  const handleCloseExerciseModal = () => {
    setExerciseModalMode(null);
    setSelectedExercise(null);
    setExerciseFormData({});
  };

  const handleDeleteExercise = (exercise) => {
    if (
      window.confirm(
        lang === 'no'
          ? `Er du sikker på at du vil slette "${exercise.name_no}"?`
          : `Are you sure you want to delete "${exercise.name_en || exercise.name_no}"?`
      )
    ) {
      deleteExerciseMutation.mutate(exercise.id);
    }
  };

  // Helper to extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) {
      return null;
    }
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
    );
    return match ? match[1] : null;
  };

  // Category and body region labels
  const categoryLabels = {
    stretching: { no: 'Tøyning', en: 'Stretching' },
    strengthening: { no: 'Styrke', en: 'Strengthening' },
    mobility: { no: 'Mobilitet', en: 'Mobility' },
    balance: { no: 'Balanse', en: 'Balance' },
    posture: { no: 'Holdning', en: 'Posture' },
    breathing: { no: 'Pust', en: 'Breathing' },
    nerve_glide: { no: 'Nervegliding', en: 'Nerve Glide' },
    vestibular: { no: 'Vestibulær', en: 'Vestibular' },
  };

  const bodyRegionLabels = {
    cervical: { no: 'Nakke', en: 'Cervical' },
    thoracic: { no: 'Brystsøyle', en: 'Thoracic' },
    lumbar: { no: 'Korsrygg', en: 'Lumbar' },
    shoulder: { no: 'Skulder', en: 'Shoulder' },
    hip: { no: 'Hofte', en: 'Hip' },
    knee: { no: 'Kne', en: 'Knee' },
    ankle: { no: 'Ankel', en: 'Ankle' },
    foot: { no: 'Fot', en: 'Foot' },
    core: { no: 'Kjerne', en: 'Core' },
    upper_extremity: { no: 'Overekstremitet', en: 'Upper Extremity' },
    lower_extremity: { no: 'Underekstremitet', en: 'Lower Extremity' },
    full_body: { no: 'Helkropp', en: 'Full Body' },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('manageSettings')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => {
              setActiveTab('organization');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'organization'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t('organization')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('profile')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('users')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('notifications');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t('notifications')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('integrations');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'integrations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              {t('integrations')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('ai');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              {t('aiAssistant')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('clinical');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'clinical'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              {t('clinical')}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('exercises');
              setEditMode(false);
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'exercises'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              {lang === 'no' ? 'Øvelser' : 'Exercises'}
            </div>
          </button>
        </nav>
      </div>

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {orgLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Organization Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('organizationInfo')}
                  </h2>
                  {!editMode ? (
                    <button
                      onClick={() => handleEdit(organization)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t('edit')}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateOrgMutation.isLoading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {updateOrgMutation.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('saving')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {t('save')}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Organization Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        {t('orgName')}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white">
                          {organization.name || '-'}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        {t('email')}
                      </label>
                      {editMode ? (
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {organization.email || '-'}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        {t('clinicPhone')}
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {organization.phone || '-'}
                        </p>
                      )}
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        {t('website')}
                      </label>
                      {editMode ? (
                        <input
                          type="url"
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          {organization.website || '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('clinicAddress')}
                    </label>
                    {editMode ? (
                      <textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        {organization.address || '-'}
                      </p>
                    )}
                  </div>

                  {!editMode && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 dark:text-gray-200">
                        {t('created')}: {formatDate(organization.created_at, 'time')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Kiosk Mode Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('kioskTitle')}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-200">
                        {t('kioskDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-white">
                      {t('kioskLaunchDescription')}
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-white space-y-2 ml-4">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature1')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature2')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature3')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        {t('kioskFeature4')}
                      </li>
                    </ul>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => window.open('/kiosk', '_blank', 'fullscreen=yes')}
                        className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700
                                   transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Monitor className="w-5 h-5" />
                        {t('launchKiosk')}
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/kiosk`);
                          toast.success(t('kioskUrlCopied'));
                        }}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg
                                   hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {t('copyKioskUrl')}
                      </button>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">{t('fullscreenTip')}</p>
                          <p className="text-blue-700 mt-1">
                            {t('fullscreenDescription').replace('{key}', '')}
                            <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">
                              F11
                            </kbd>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {userLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('userProfile')}
                </h2>
                {!editMode ? (
                  <button
                    onClick={() => handleEdit(currentUser)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('edit')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateUserMutation.isLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {updateUserMutation.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {t('save')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('firstName')}
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentUser.first_name || '-'}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('lastName')}
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentUser.last_name || '-'}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('email')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {currentUser.email || '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-200 mt-1">
                      {t('emailCannotChange')}
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('role')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {currentUser.role || '-'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orgUsers')}</h2>
            <button
              onClick={handleInviteUser}
              disabled={inviteUserMutation.isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t('inviteUser')}
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {usersLoading ? (
              <div className="px-6 py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-200 mt-3">{t('loadingUsers')}</p>
              </div>
            ) : organizationUsers.length > 0 ? (
              organizationUsers.map((user) => (
                <div
                  key={user.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-200">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {user.role}
                      </span>
                      {user.status && (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-200">{t('noUsersFound')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('notificationPrefs')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
              {t('manageNotifications')}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('emailNotifications')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-200">
                  {t('emailNotificationsDesc')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Appointment Reminders */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('appointmentReminders')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-200">
                  {t('appointmentRemindersDesc')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Follow-up Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('followUpNotifications')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-200">
                  {t('followUpNotificationsDesc')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('systemUpdates')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-200">{t('systemUpdatesDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="pt-4">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{t('notificationComingSoon')}</p>
                  <p className="text-xs text-blue-700 mt-1">{t('notificationComingSoonDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* SolvIt Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('solvitIntegration')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('solvitDesc')}</p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t('active')}
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white">{t('status')}:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {t('connected')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white">{t('lastSync')}:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(new Date(), 'time')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white">{t('syncMode')}:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {t('automatic')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Drive Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('googleDriveIntegration')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
                  {t('googleDriveDesc')}
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t('active')}
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white">{t('status')}:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {t('connected')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white">{t('trainingDataFolder')}:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {t('configured')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white">{t('autoImport')}:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{t('enabled')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('stripeIntegration')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('stripeDesc')}</p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 rounded">
                {t('notConnected')}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-white mb-4">{t('connectStripeDesc')}</p>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('connectStripe')}
              </button>
            </div>
          </div>

          {/* API Access */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('apiAccess')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('apiAccessDesc')}</p>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{t('apiComingSoon')}</p>
                  <p className="text-xs text-blue-700 mt-1">{t('apiComingSoonDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Tab */}
      {activeTab === 'ai' && <AISettings />}

      {/* Clinical Settings Tab */}
      {activeTab === 'clinical' && (
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
                      onChange={(e) =>
                        handleClinicalPrefChange('adjustmentNotation', e.target.value)
                      }
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
                  <p className="text-sm text-gray-500 dark:text-gray-200">
                    {t('languageSettingDesc')}
                  </p>
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
                    onChange={(e) => handleClinicalPrefChange('language', e.target.value)}
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
                    onChange={(e) => handleClinicalPrefChange('language', e.target.value)}
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
                  <p className="text-sm text-gray-500 dark:text-gray-200">
                    {t('chartDisplayDesc')}
                  </p>
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
                  <p className="text-xs text-gray-500 dark:text-gray-200">
                    {t('showDermatomesDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={clinicalPrefs.showDermatomes}
                    onChange={(e) => handleClinicalPrefChange('showDermatomes', e.target.checked)}
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
                    onChange={(e) =>
                      handleClinicalPrefChange('showTriggerPoints', e.target.checked)
                    }
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
                    onChange={(e) =>
                      handleClinicalPrefChange('autoGenerateNarrative', e.target.checked)
                    }
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
                  {ADJUSTMENT_NOTATION_METHODS.find(
                    (m) => m.id === clinicalPrefs.adjustmentNotation
                  )?.name[lang] ||
                    ADJUSTMENT_NOTATION_METHODS.find(
                      (m) => m.id === clinicalPrefs.adjustmentNotation
                    )?.name.en}
                </p>
                <p className="text-xs text-teal-600 mt-2">{t('activeNotationDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {/* Header with Create Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {lang === 'no' ? 'Øvelsesbibliotek' : 'Exercise Library'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-200">
                      {lang === 'no'
                        ? 'Administrer øvelser, legg til videoer og bilder'
                        : 'Manage exercises, add videos and images'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleOpenExerciseCreate}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'no' ? 'Ny øvelse' : 'New Exercise'}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder={lang === 'no' ? 'Søk etter øvelser...' : 'Search exercises...'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={exerciseCategoryFilter}
                    onChange={(e) => setExerciseCategoryFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{lang === 'no' ? 'Alle kategorier' : 'All Categories'}</option>
                    {exerciseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]?.[lang] || cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Body Region Filter */}
                <div className="relative">
                  <select
                    value={exerciseBodyRegionFilter}
                    onChange={(e) => setExerciseBodyRegionFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{lang === 'no' ? 'Alle regioner' : 'All Regions'}</option>
                    {exerciseBodyRegions.map((region) => (
                      <option key={region} value={region}>
                        {bodyRegionLabels[region]?.[lang] || region}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Exercise List */}
            <div className="divide-y divide-gray-100">
              {exercisesLoading ? (
                <div className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
                  <p className="text-sm text-gray-500 dark:text-gray-200 mt-3">
                    {lang === 'no' ? 'Laster øvelser...' : 'Loading exercises...'}
                  </p>
                </div>
              ) : exercises.length > 0 ? (
                exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Image or Placeholder */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {exercise.image_url ? (
                            <img
                              src={exercise.image_url}
                              alt={exercise.name_no}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Dumbbell className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        {/* Exercise Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {lang === 'no'
                              ? exercise.name_no
                              : exercise.name_en || exercise.name_no}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                              {categoryLabels[exercise.category]?.[lang] || exercise.category}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              {bodyRegionLabels[exercise.body_region]?.[lang] ||
                                exercise.body_region}
                            </span>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {exercise.image_url ? (
                            <div
                              className="flex items-center gap-1 text-green-600"
                              title={lang === 'no' ? 'Har bilde' : 'Has image'}
                            >
                              <Image className="w-4 h-4" />
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <div
                              className="flex items-center gap-1 text-gray-400"
                              title={lang === 'no' ? 'Mangler bilde' : 'No image'}
                            >
                              <Image className="w-4 h-4" />
                              <X className="w-3 h-3" />
                            </div>
                          )}

                          {exercise.video_url ? (
                            <div
                              className="flex items-center gap-1 text-green-600"
                              title={lang === 'no' ? 'Har video' : 'Has video'}
                            >
                              <Video className="w-4 h-4" />
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <div
                              className="flex items-center gap-1 text-gray-400"
                              title={lang === 'no' ? 'Mangler video' : 'No video'}
                            >
                              <Video className="w-4 h-4" />
                              <X className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleOpenExerciseEdit(exercise)}
                          className="p-2 text-gray-500 dark:text-gray-200 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title={lang === 'no' ? 'Rediger' : 'Edit'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!exercise.is_global && (
                          <button
                            onClick={() => handleDeleteExercise(exercise)}
                            className="p-2 text-gray-500 dark:text-gray-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={lang === 'no' ? 'Slett' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-200">
                    {exerciseSearch || exerciseCategoryFilter || exerciseBodyRegionFilter
                      ? lang === 'no'
                        ? 'Ingen øvelser funnet med disse filtrene'
                        : 'No exercises found with these filters'
                      : lang === 'no'
                        ? 'Ingen øvelser lagt til ennå'
                        : 'No exercises added yet'}
                  </p>
                </div>
              )}
            </div>

            {/* Results Summary */}
            {exercises.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 text-sm text-gray-500 dark:text-gray-200">
                {lang === 'no'
                  ? `Viser ${exercises.length} øvelse${exercises.length !== 1 ? 'r' : ''}`
                  : `Showing ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`}
              </div>
            )}
          </div>

          {/* Exercise Modal */}
          {exerciseModalMode && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {exerciseModalMode === 'create'
                      ? lang === 'no'
                        ? 'Ny øvelse'
                        : 'New Exercise'
                      : lang === 'no'
                        ? 'Rediger øvelse'
                        : 'Edit Exercise'}
                  </h3>
                  <button
                    onClick={handleCloseExerciseModal}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Names */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Navn (Norsk)' : 'Name (Norwegian)'} *
                        </label>
                        <input
                          type="text"
                          value={exerciseFormData.name_no || ''}
                          onChange={(e) =>
                            setExerciseFormData({ ...exerciseFormData, name_no: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder={
                            lang === 'no'
                              ? 'f.eks. Kne til bryst tøyning'
                              : 'e.g. Knee to Chest Stretch'
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Navn (Engelsk)' : 'Name (English)'}
                        </label>
                        <input
                          type="text"
                          value={exerciseFormData.name_en || ''}
                          onChange={(e) =>
                            setExerciseFormData({ ...exerciseFormData, name_en: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g. Knee to Chest Stretch"
                        />
                      </div>
                    </div>

                    {/* Category, Body Region, Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Kategori' : 'Category'}
                        </label>
                        <select
                          value={exerciseFormData.category || 'strengthening'}
                          onChange={(e) =>
                            setExerciseFormData({ ...exerciseFormData, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {Object.entries(categoryLabels).map(([key, labels]) => (
                            <option key={key} value={key}>
                              {labels[lang] || key}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Kroppsregion' : 'Body Region'}
                        </label>
                        <select
                          value={exerciseFormData.body_region || 'core'}
                          onChange={(e) =>
                            setExerciseFormData({
                              ...exerciseFormData,
                              body_region: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {Object.entries(bodyRegionLabels).map(([key, labels]) => (
                            <option key={key} value={key}>
                              {labels[lang] || key}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Vanskelighetsgrad' : 'Difficulty'}
                        </label>
                        <select
                          value={exerciseFormData.difficulty || 'beginner'}
                          onChange={(e) =>
                            setExerciseFormData({ ...exerciseFormData, difficulty: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="beginner">
                            {lang === 'no' ? 'Nybegynner' : 'Beginner'}
                          </option>
                          <option value="intermediate">
                            {lang === 'no' ? 'Middels' : 'Intermediate'}
                          </option>
                          <option value="advanced">
                            {lang === 'no' ? 'Avansert' : 'Advanced'}
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        {lang === 'no' ? 'Video URL (YouTube)' : 'Video URL (YouTube)'}
                      </label>
                      <input
                        type="url"
                        value={exerciseFormData.video_url || ''}
                        onChange={(e) =>
                          setExerciseFormData({ ...exerciseFormData, video_url: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      {exerciseFormData.video_url &&
                        getYouTubeVideoId(exerciseFormData.video_url) && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <iframe
                              width="100%"
                              height="200"
                              src={`https://www.youtube.com/embed/${getYouTubeVideoId(exerciseFormData.video_url)}`}
                              title="Video preview"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        {lang === 'no' ? 'Bilde URL' : 'Image URL'}
                      </label>
                      <input
                        type="url"
                        value={exerciseFormData.image_url || ''}
                        onChange={(e) =>
                          setExerciseFormData({ ...exerciseFormData, image_url: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="https://raw.githubusercontent.com/yuhonas/free-exercise-db/..."
                      />
                      {exerciseFormData.image_url && (
                        <div className="mt-2 flex justify-center">
                          <img
                            src={exerciseFormData.image_url}
                            alt="Preview"
                            className="max-h-32 rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Instruksjoner (Norsk)' : 'Instructions (Norwegian)'}
                        </label>
                        <textarea
                          value={exerciseFormData.instructions_no || ''}
                          onChange={(e) =>
                            setExerciseFormData({
                              ...exerciseFormData,
                              instructions_no: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder={
                            lang === 'no'
                              ? 'Detaljerte instruksjoner...'
                              : 'Detailed instructions...'
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Instruksjoner (Engelsk)' : 'Instructions (English)'}
                        </label>
                        <textarea
                          value={exerciseFormData.instructions_en || ''}
                          onChange={(e) =>
                            setExerciseFormData({
                              ...exerciseFormData,
                              instructions_en: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Detailed instructions..."
                        />
                      </div>
                    </div>

                    {/* Contraindications and Precautions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Kontraindikasjoner' : 'Contraindications'}
                        </label>
                        <textarea
                          value={exerciseFormData.contraindications || ''}
                          onChange={(e) =>
                            setExerciseFormData({
                              ...exerciseFormData,
                              contraindications: e.target.value,
                            })
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder={
                            lang === 'no'
                              ? 'Når øvelsen ikke bør utføres...'
                              : 'When the exercise should not be performed...'
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          {lang === 'no' ? 'Forholdsregler' : 'Precautions'}
                        </label>
                        <textarea
                          value={exerciseFormData.precautions || ''}
                          onChange={(e) =>
                            setExerciseFormData({
                              ...exerciseFormData,
                              precautions: e.target.value,
                            })
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder={
                            lang === 'no' ? 'Viktige hensyn...' : 'Important considerations...'
                          }
                        />
                      </div>
                    </div>

                    {/* Dosing Defaults */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        {lang === 'no' ? 'Standard dosering' : 'Default Dosing'}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-200 mb-1">
                            {lang === 'no' ? 'Sett' : 'Sets'}
                          </label>
                          <input
                            type="number"
                            value={exerciseFormData.default_sets || 3}
                            onChange={(e) =>
                              setExerciseFormData({
                                ...exerciseFormData,
                                default_sets: parseInt(e.target.value) || 3,
                              })
                            }
                            min={1}
                            max={10}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-200 mb-1">
                            {lang === 'no' ? 'Reps' : 'Reps'}
                          </label>
                          <input
                            type="number"
                            value={exerciseFormData.default_reps || 10}
                            onChange={(e) =>
                              setExerciseFormData({
                                ...exerciseFormData,
                                default_reps: parseInt(e.target.value) || 10,
                              })
                            }
                            min={1}
                            max={100}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-200 mb-1">
                            {lang === 'no' ? 'Hold (sek)' : 'Hold (sec)'}
                          </label>
                          <input
                            type="number"
                            value={exerciseFormData.default_hold_seconds || ''}
                            onChange={(e) =>
                              setExerciseFormData({
                                ...exerciseFormData,
                                default_hold_seconds: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              })
                            }
                            min={0}
                            max={300}
                            placeholder="-"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-200 mb-1">
                            {lang === 'no' ? 'Frekvens' : 'Frequency'}
                          </label>
                          <select
                            value={exerciseFormData.default_frequency || 'daily'}
                            onChange={(e) =>
                              setExerciseFormData({
                                ...exerciseFormData,
                                default_frequency: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="daily">{lang === 'no' ? 'Daglig' : 'Daily'}</option>
                            <option value="2x_daily">
                              {lang === 'no' ? '2x daglig' : '2x Daily'}
                            </option>
                            <option value="3x_week">
                              {lang === 'no' ? '3x per uke' : '3x Weekly'}
                            </option>
                            <option value="2x_week">
                              {lang === 'no' ? '2x per uke' : '2x Weekly'}
                            </option>
                            <option value="weekly">{lang === 'no' ? 'Ukentlig' : 'Weekly'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={handleCloseExerciseModal}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700"
                  >
                    {lang === 'no' ? 'Avbryt' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveExercise}
                    disabled={
                      !exerciseFormData.name_no ||
                      createExerciseMutation.isLoading ||
                      updateExerciseMutation.isLoading
                    }
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {createExerciseMutation.isLoading || updateExerciseMutation.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {lang === 'no' ? 'Lagrer...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {lang === 'no' ? 'Lagre' : 'Save'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
