import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '../ui/ConfirmDialog';
import { useTranslation } from '../../i18n';
import {
  Dumbbell,
  Search,
  Plus,
  Edit3,
  Trash2,
  Video,
  Image,
  X,
  Check,
  ChevronDown,
  Loader2,
  Save,
} from 'lucide-react';
import { exercisesAPI } from '../../services/api';
import toast from '../../utils/toast';

// Category and body region translation key maps
const categoryKeys = {
  stretching: 'catStretching',
  strengthening: 'catStrengthening',
  mobility: 'catMobility',
  balance: 'catBalance',
  posture: 'catPosture',
  breathing: 'catBreathing',
  nerve_glide: 'catNerveGlide',
  vestibular: 'catVestibular',
};

const bodyRegionKeys = {
  cervical: 'regionCervical',
  thoracic: 'regionThoracic',
  lumbar: 'regionLumbar',
  shoulder: 'regionShoulder',
  hip: 'regionHip',
  knee: 'regionKnee',
  ankle: 'regionAnkle',
  foot: 'regionFoot',
  core: 'regionCore',
  upper_extremity: 'regionUpperExtremity',
  lower_extremity: 'regionLowerExtremity',
  full_body: 'regionFullBody',
};

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) {
    return null;
  }
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? match[1] : null;
};

export default function ExerciseSettings({ lang }) {
  const { t } = useTranslation('exercises');
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  // Local state
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState('');
  const [exerciseBodyRegionFilter, setExerciseBodyRegionFilter] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseModalMode, setExerciseModalMode] = useState(null);
  const [exerciseFormData, setExerciseFormData] = useState({});

  // Fetch exercises
  const { data: exercisesResponse, isLoading: exercisesLoading } = useQuery({
    queryKey: ['exercises', exerciseSearch, exerciseCategoryFilter, exerciseBodyRegionFilter],
    queryFn: () =>
      exercisesAPI.getAll({
        search: exerciseSearch || undefined,
        category: exerciseCategoryFilter || undefined,
        bodyRegion: exerciseBodyRegionFilter || undefined,
        limit: 100,
      }),
  });

  const exercises = exercisesResponse?.data?.exercises || [];

  // Fetch exercise categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['exercise-categories'],
    queryFn: () => exercisesAPI.getCategories(),
  });

  const exerciseCategories = categoriesResponse?.data?.categories || [];

  // Fetch exercise body regions
  const { data: bodyRegionsResponse } = useQuery({
    queryKey: ['exercise-body-regions'],
    queryFn: () => exercisesAPI.getBodyRegions(),
  });

  const exerciseBodyRegions = bodyRegionsResponse?.data?.bodyRegions || [];

  // Create exercise mutation
  const createExerciseMutation = useMutation({
    mutationFn: (data) => exercisesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
      setExerciseModalMode(null);
      setExerciseFormData({});
      toast.success(t('exerciseCreated', 'Øvelse opprettet'));
    },
    onError: (error) => {
      toast.error(
        `${t('failedToCreateExercise', 'Kunne ikke opprette øvelse')}: ${error.response?.data?.message || error.message}`
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
      toast.success(t('exerciseUpdated', 'Øvelse oppdatert'));
    },
    onError: (error) => {
      toast.error(
        `${t('failedToUpdateExercise', 'Kunne ikke oppdatere øvelse')}: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // Delete exercise mutation
  const deleteExerciseMutation = useMutation({
    mutationFn: (id) => exercisesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
      toast.success(t('exerciseDeleted', 'Øvelse slettet'));
    },
    onError: (error) => {
      toast.error(
        `${t('failedToDeleteExercise', 'Kunne ikke slette øvelse')}: ${error.response?.data?.message || error.message}`
      );
    },
  });

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

  const handleDeleteExercise = async (exercise) => {
    const ok = await confirm({
      title: t('deleteExercise', 'Slett øvelse'),
      description: t(
        'deleteExerciseConfirm',
        `Er du sikker på at du vil slette "${exercise.name_no}"?`
      ).replace('{name}', exercise.name_no),
      variant: 'destructive',
    });
    if (ok) {
      deleteExerciseMutation.mutate(exercise.id);
    }
  };

  return (
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
                  {t('exerciseLibraryTitle', 'Øvelsesbibliotek')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-200">
                  {t('manageExercisesDesc', 'Administrer øvelser, legg til videoer og bilder')}
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenExerciseCreate}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('newExercise', 'Ny øvelse')}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder={t('searchExercises', 'Søk etter øvelser...')}
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
                <option value="">{t('allCategories', 'Alle kategorier')}</option>
                {exerciseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(categoryKeys[cat], cat)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300 pointer-events-none" />
            </div>

            {/* Body Region Filter */}
            <div className="relative">
              <select
                value={exerciseBodyRegionFilter}
                onChange={(e) => setExerciseBodyRegionFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 dark:text-white"
              >
                <option value="">{t('allRegions', 'Alle regioner')}</option>
                {exerciseBodyRegions.map((region) => (
                  <option key={region} value={region}>
                    {t(bodyRegionKeys[region], region)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="divide-y divide-gray-100">
          {exercisesLoading ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-200 mt-3">
                {t('loadingExercisesEllipsis', 'Laster øvelser...')}
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
                        <Dumbbell className="w-6 h-6 text-gray-400 dark:text-gray-300" />
                      )}
                    </div>

                    {/* Exercise Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {lang === 'no' ? exercise.name_no : exercise.name_en || exercise.name_no}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                          {t(categoryKeys[exercise.category], exercise.category)}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {t(bodyRegionKeys[exercise.body_region], exercise.body_region)}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {exercise.image_url ? (
                        <div
                          className="flex items-center gap-1 text-green-600"
                          title={t('hasImage', 'Har bilde')}
                        >
                          <Image className="w-4 h-4" />
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 text-gray-400 dark:text-gray-300"
                          title={t('noImage', 'Mangler bilde')}
                        >
                          <Image className="w-4 h-4" />
                          <X className="w-3 h-3" />
                        </div>
                      )}

                      {exercise.video_url ? (
                        <div
                          className="flex items-center gap-1 text-green-600"
                          title={t('hasVideo', 'Har video')}
                        >
                          <Video className="w-4 h-4" />
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 text-gray-400 dark:text-gray-300"
                          title={t('noVideo', 'Mangler video')}
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
                      title={t('editBtn', 'Rediger')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!exercise.is_global && (
                      <button
                        onClick={() => handleDeleteExercise(exercise)}
                        className="p-2 text-gray-500 dark:text-gray-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('deleteBtn', 'Slett')}
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
                  ? t('noExercisesWithFilters', 'Ingen øvelser funnet med disse filtrene')
                  : t('noExercisesAddedYet', 'Ingen øvelser lagt til ennå')}
              </p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {exercises.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 text-sm text-gray-500 dark:text-gray-200">
            {t('showingExercises', `Viser ${exercises.length} øvelse(r)`).replace(
              '{count}',
              exercises.length
            )}
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
                  ? t('newExercise', 'Ny øvelse')
                  : t('editExerciseTitle', 'Rediger øvelse')}
              </h3>
              <button
                onClick={handleCloseExerciseModal}
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
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
                      {t('nameNorwegian', 'Navn (Norsk)')} *
                    </label>
                    <input
                      type="text"
                      value={exerciseFormData.name_no || ''}
                      onChange={(e) =>
                        setExerciseFormData({ ...exerciseFormData, name_no: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={t('nameNorwegianPlaceholder', 'f.eks. Kne til bryst tøyning')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('nameEnglish', 'Navn (Engelsk)')}
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
                      {t('category', 'Kategori')}
                    </label>
                    <select
                      value={exerciseFormData.category || 'strengthening'}
                      onChange={(e) =>
                        setExerciseFormData({ ...exerciseFormData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {Object.entries(categoryKeys).map(([key, tKey]) => (
                        <option key={key} value={key}>
                          {t(tKey, key)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('bodyRegion', 'Kroppsregion')}
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
                      {Object.entries(bodyRegionKeys).map(([key, tKey]) => (
                        <option key={key} value={key}>
                          {t(tKey, key)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('difficultyLabel', 'Vanskelighetsgrad')}
                    </label>
                    <select
                      value={exerciseFormData.difficulty || 'beginner'}
                      onChange={(e) =>
                        setExerciseFormData({ ...exerciseFormData, difficulty: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="beginner">{t('beginner', 'Nybegynner')}</option>
                      <option value="intermediate">{t('intermediate', 'Middels')}</option>
                      <option value="advanced">{t('advanced', 'Avansert')}</option>
                    </select>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    {t('videoUrlLabel', 'Video URL (YouTube)')}
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
                  {exerciseFormData.video_url && getYouTubeVideoId(exerciseFormData.video_url) && (
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
                    {t('imageUrlLabel', 'Bilde URL')}
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
                      {t('instructionsNorwegian', 'Instruksjoner (Norsk)')}
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
                      placeholder={t('detailedInstructions', 'Detaljerte instruksjoner...')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('instructionsEnglish', 'Instruksjoner (Engelsk)')}
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
                      placeholder={t('detailedInstructionsPlaceholder', 'Detailed instructions...')}
                    />
                  </div>
                </div>

                {/* Contraindications and Precautions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('contraindications', 'Kontraindikasjoner')}
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
                      placeholder={t(
                        'contraindicationsShortPlaceholder',
                        'Når øvelsen ikke bør utføres...'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {t('precautions', 'Forholdsregler')}
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
                      placeholder={t('precautionsShortPlaceholder', 'Viktige hensyn...')}
                    />
                  </div>
                </div>

                {/* Dosing Defaults */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    {t('defaultDosing', 'Standard dosering')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-200 mb-1">
                        {t('setsLabel', 'Sett')}
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
                        {t('repsLabel', 'Reps')}
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
                        {t('holdSec', 'Hold (sek)')}
                      </label>
                      <input
                        type="number"
                        value={exerciseFormData.default_hold_seconds || ''}
                        onChange={(e) =>
                          setExerciseFormData({
                            ...exerciseFormData,
                            default_hold_seconds: e.target.value ? parseInt(e.target.value) : null,
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
                        {t('frequencyLabel', 'Frekvens')}
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
                        <option value="daily">{t('freqDaily', 'Daglig')}</option>
                        <option value="2x_daily">{t('freq2xDaily', '2x daglig')}</option>
                        <option value="3x_week">{t('freq3xWeek', '3x per uke')}</option>
                        <option value="2x_week">{t('freq2xWeek', '2x per uke')}</option>
                        <option value="weekly">{t('freqWeekly', 'Ukentlig')}</option>
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
                {t('cancelBtn', 'Avbryt')}
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
                    {t('savingBtn', 'Lagrer...')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('saveBtn', 'Lagre')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
