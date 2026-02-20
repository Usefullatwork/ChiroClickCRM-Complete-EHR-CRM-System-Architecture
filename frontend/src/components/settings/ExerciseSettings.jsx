import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '../ui/ConfirmDialog';
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

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) {
    return null;
  }
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? match[1] : null;
};

export default function ExerciseSettings({ lang }) {
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
      title: lang === 'no' ? 'Slett øvelse' : 'Delete exercise',
      description:
        lang === 'no'
          ? `Er du sikker på at du vil slette "${exercise.name_no}"?`
          : `Are you sure you want to delete "${exercise.name_en || exercise.name_no}"?`,
      variant: 'destructive',
    });
    if (ok) deleteExerciseMutation.mutate(exercise.id);
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
                        {lang === 'no' ? exercise.name_no : exercise.name_en || exercise.name_no}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                          {categoryLabels[exercise.category]?.[lang] || exercise.category}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {bodyRegionLabels[exercise.body_region]?.[lang] || exercise.body_region}
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
                      <option value="beginner">{lang === 'no' ? 'Nybegynner' : 'Beginner'}</option>
                      <option value="intermediate">
                        {lang === 'no' ? 'Middels' : 'Intermediate'}
                      </option>
                      <option value="advanced">{lang === 'no' ? 'Avansert' : 'Advanced'}</option>
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
                        lang === 'no' ? 'Detaljerte instruksjoner...' : 'Detailed instructions...'
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
                        <option value="2x_daily">{lang === 'no' ? '2x daglig' : '2x Daily'}</option>
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
  );
}
