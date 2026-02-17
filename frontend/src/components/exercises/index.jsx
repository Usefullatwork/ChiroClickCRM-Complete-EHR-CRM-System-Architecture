/**
 * Exercise Components Index
 * Components for exercise prescription and documentation
 */

import _React, { useState, useEffect, _useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exercisesAPI } from '../../services/api';
import {
  Search,
  Filter,
  X,
  Plus,
  Check,
  _ChevronDown,
  _ChevronUp,
  Play,
  Clock,
  Dumbbell,
  Star,
  Loader2,
  _AlertCircle,
  Info,
  Image as _ImageIcon,
} from 'lucide-react';

// Body region labels in Norwegian
const BODY_REGION_LABELS = {
  cervical: 'Nakke',
  thoracic: 'Brystsøyle',
  lumbar: 'Korsrygg',
  shoulder: 'Skulder',
  hip: 'Hofte',
  knee: 'Kne',
  ankle: 'Ankel',
  core: 'Kjerne',
  full_body: 'Helkropp',
  upper_extremity: 'Overekstremitet',
  lower_extremity: 'Underekstremitet',
};

// Category labels in Norwegian
const CATEGORY_LABELS = {
  stretching: 'Tøyning',
  strengthening: 'Styrke',
  mobility: 'Mobilitet',
  balance: 'Balanse',
  vestibular: 'Vestibulær',
  breathing: 'Pust',
  posture: 'Holdning',
  nerve_glide: 'Nervegliding',
};

// Difficulty labels in Norwegian
const _DIFFICULTY_LABELS = {
  beginner: 'Lett',
  intermediate: 'Middels',
  advanced: 'Vanskelig',
};

// Frequency labels in Norwegian
const FREQUENCY_LABELS = {
  daily: 'Daglig',
  '2x_daily': '2 ganger daglig',
  '3x_week': '3 ganger per uke',
  weekly: 'Ukentlig',
};

/**
 * Individual Exercise Card Component
 */
const ExerciseCard = ({ exercise, onSelect, isSelected, compact = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`border rounded-lg p-3 transition-all ${
        isSelected
          ? 'border-green-500 bg-green-50'
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {exercise.thumbnail_url || exercise.image_url ? (
            <img
              src={exercise.thumbnail_url || exercise.image_url}
              alt={exercise.name_no}
              className="w-full h-full object-cover"
            />
          ) : (
            <Dumbbell className="w-5 h-5 text-slate-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm text-slate-800 truncate">{exercise.name_no}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {BODY_REGION_LABELS[exercise.body_region] || exercise.body_region}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                  {CATEGORY_LABELS[exercise.category] || exercise.category}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400"
                title="Vis detaljer"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSelect(exercise)}
                className={`p-1.5 rounded ${
                  isSelected
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600'
                }`}
                title={isSelected ? 'Valgt' : 'Legg til'}
              >
                {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Default dosing */}
          {!compact && (
            <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
              <span>
                {exercise.default_sets || 3}x{exercise.default_reps || 10}
              </span>
              {exercise.default_hold_seconds && <span>Hold: {exercise.default_hold_seconds}s</span>}
              <span>
                {FREQUENCY_LABELS[exercise.default_frequency] || exercise.default_frequency}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600 leading-relaxed">{exercise.instructions_no}</p>
          {exercise.contraindications && (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
              <strong>Kontraindikasjoner:</strong> {exercise.contraindications}
            </div>
          )}
          {exercise.video_url && (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Play className="w-3 h-3" />
              Se video
            </a>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Selected Exercise Item with Dosing Controls
 */
const SelectedExerciseItem = ({ exercise, onRemove, onUpdate, readOnly = false }) => {
  const [sets, setSets] = useState(exercise.sets || exercise.default_sets || 3);
  const [reps, setReps] = useState(exercise.reps || exercise.default_reps || 10);
  const [holdSeconds, _setHoldSeconds] = useState(
    exercise.hold_seconds || exercise.default_hold_seconds || null
  );
  const [frequency, setFrequency] = useState(
    exercise.frequency || exercise.default_frequency || 'daily'
  );

  useEffect(() => {
    onUpdate({
      ...exercise,
      sets,
      reps,
      hold_seconds: holdSeconds,
      frequency,
    });
  }, [sets, reps, holdSeconds, frequency]);

  return (
    <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-800 truncate block">
          {exercise.name_no}
        </span>
      </div>

      {/* Dosing controls */}
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(parseInt(e.target.value) || 3)}
            className="w-10 px-1 py-0.5 border rounded text-center"
            min="1"
            max="10"
            disabled={readOnly}
          />
          <span className="text-slate-500">x</span>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 10)}
            className="w-12 px-1 py-0.5 border rounded text-center"
            min="1"
            max="100"
            disabled={readOnly}
          />
        </div>

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="px-1 py-0.5 border rounded text-xs bg-white"
          disabled={readOnly}
        >
          <option value="daily">Daglig</option>
          <option value="2x_daily">2x daglig</option>
          <option value="3x_week">3x/uke</option>
          <option value="weekly">Ukentlig</option>
        </select>
      </div>

      {/* Remove button */}
      {!readOnly && (
        <button
          onClick={() => onRemove(exercise)}
          className="p-1 rounded hover:bg-red-100 text-red-500"
          title="Fjern"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * Main Exercise Panel Component
 */
export const ExercisePanel = ({
  patientId,
  encounterId,
  onExercisesChange,
  compact = false,
  className = '',
  ...props
}) => {
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'favorites', 'programs'

  // Fetch exercises
  const { data: exercisesData, isLoading: loadingExercises } = useQuery({
    queryKey: [
      'exercises',
      { search: searchTerm, category: selectedCategory, bodyRegion: selectedBodyRegion },
    ],
    queryFn: () =>
      exercisesAPI.getAll({
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        bodyRegion: selectedBodyRegion || undefined,
        limit: 50,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch favorites
  const { data: favoritesData } = useQuery({
    queryKey: ['exercises', 'favorites'],
    queryFn: () => exercisesAPI.getFavorites(10),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch programs
  const { data: programsData } = useQuery({
    queryKey: ['exercises', 'programs'],
    queryFn: () => exercisesAPI.getPrograms({ limit: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch patient's existing exercises
  const { data: patientExercisesData } = useQuery({
    queryKey: ['patient', patientId, 'exercises'],
    queryFn: () => exercisesAPI.getPatientExercises(patientId, { status: 'active' }),
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000,
  });

  // Prescribe mutation
  const prescribeMutation = useMutation({
    mutationFn: ({ patientId, data }) => exercisesAPI.prescribeToPatient(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient', patientId, 'exercises']);
    },
  });

  // Get exercises array from response
  const exercises = exercisesData?.data?.data || [];
  const favorites = favoritesData?.data || [];
  const programs = programsData?.data?.data || [];
  const patientExercises = patientExercisesData?.data?.data || [];

  // Handle exercise selection
  const handleSelectExercise = useCallback((exercise) => {
    setSelectedExercises((prev) => {
      const isSelected = prev.some((e) => e.id === exercise.id || e.code === exercise.code);
      if (isSelected) {
        return prev.filter((e) => e.id !== exercise.id && e.code !== exercise.code);
      }
      return [
        ...prev,
        {
          ...exercise,
          sets: exercise.default_sets || 3,
          reps: exercise.default_reps || 10,
          hold_seconds: exercise.default_hold_seconds,
          frequency: exercise.default_frequency || 'daily',
        },
      ];
    });
  }, []);

  // Handle exercise update
  const handleUpdateExercise = useCallback((updatedExercise) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.id === updatedExercise.id ? updatedExercise : e))
    );
  }, []);

  // Handle exercise removal
  const handleRemoveExercise = useCallback((exercise) => {
    setSelectedExercises((prev) =>
      prev.filter((e) => e.id !== exercise.id && e.code !== exercise.code)
    );
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onExercisesChange) {
      onExercisesChange(selectedExercises);
    }
  }, [selectedExercises, onExercisesChange]);

  // Apply program
  const handleApplyProgram = useCallback((program) => {
    if (program.exercises && Array.isArray(program.exercises)) {
      const newExercises = program.exercises.map((pe) => ({
        id: pe.exercise_id,
        code: pe.exercise_code,
        name_no: pe.exercise_name,
        sets: pe.sets || 3,
        reps: pe.reps || 10,
        hold_seconds: pe.hold_seconds,
        frequency: pe.frequency || 'daily',
      }));
      setSelectedExercises((prev) => {
        // Avoid duplicates
        const existingCodes = prev.map((e) => e.code);
        const uniqueNew = newExercises.filter((e) => !existingCodes.includes(e.code));
        return [...prev, ...uniqueNew];
      });
    }
  }, []);

  // Check if exercise is selected
  const isExerciseSelected = useCallback(
    (exercise) => {
      return selectedExercises.some((e) => e.id === exercise.id || e.code === exercise.code);
    },
    [selectedExercises]
  );

  // Prescribe selected exercises
  const handlePrescribeAll = async () => {
    if (!patientId || selectedExercises.length === 0) {
      return;
    }

    for (const exercise of selectedExercises) {
      await prescribeMutation.mutateAsync({
        patientId,
        data: {
          exercise_id: exercise.id,
          exercise_code: exercise.code,
          exercise_name: exercise.name_no,
          exercise_instructions: exercise.instructions_no,
          sets: exercise.sets,
          reps: exercise.reps,
          hold_seconds: exercise.hold_seconds,
          frequency: exercise.frequency,
          encounter_id: encounterId,
        },
      });
    }
  };

  return (
    <div className={`bg-white ${className}`} {...props}>
      {/* Header with tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'library'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Bibliotek
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'favorites'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Star className="w-3.5 h-3.5 inline mr-1" />
            Favoritter
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'programs'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Programmer
          </button>
        </div>
      </div>

      {/* Search and filters */}
      {activeTab === 'library' && (
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Søk øvelser..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showFilters || selectedCategory || selectedBodyRegion
                  ? 'border-green-500 bg-green-50 text-green-600'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filter dropdowns */}
          {showFilters && (
            <div className="mt-2 flex gap-2">
              <select
                value={selectedBodyRegion}
                onChange={(e) => setSelectedBodyRegion(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Alle regioner</option>
                {Object.entries(BODY_REGION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Alle kategorier</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {activeTab === 'library' && (
          <div className="p-3 space-y-2">
            {loadingExercises ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">Ingen øvelser funnet</div>
            ) : (
              exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={handleSelectExercise}
                  isSelected={isExerciseSelected(exercise)}
                  compact={compact}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="p-3 space-y-2">
            {favorites.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>Ingen favoritter ennå</p>
                <p className="text-xs mt-1">Øvelser du bruker ofte vil vises her</p>
              </div>
            ) : (
              favorites.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={handleSelectExercise}
                  isSelected={isExerciseSelected(exercise)}
                  compact={compact}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="p-3 space-y-2">
            {programs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Ingen programmer tilgjengelig
              </div>
            ) : (
              programs.map((program) => (
                <div
                  key={program.id}
                  className="border border-slate-200 rounded-lg p-3 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm text-slate-800">{program.name_no}</h4>
                      {program.description_no && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {program.description_no}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{program.exercise_count || 0} øvelser</span>
                        <span>{program.duration_weeks || 6} uker</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyProgram(program)}
                      className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      Bruk
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected exercises */}
      {selectedExercises.length > 0 && (
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Valgte øvelser ({selectedExercises.length})
            </span>
            <button
              onClick={() => setSelectedExercises([])}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Fjern alle
            </button>
          </div>
          <div className="space-y-1.5">
            {selectedExercises.map((exercise) => (
              <SelectedExerciseItem
                key={exercise.id || exercise.code}
                exercise={exercise}
                onRemove={handleRemoveExercise}
                onUpdate={handleUpdateExercise}
              />
            ))}
          </div>

          {/* Prescribe button */}
          {patientId && (
            <button
              onClick={handlePrescribeAll}
              disabled={prescribeMutation.isPending}
              className="mt-3 w-full py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {prescribeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Lagre øvelser til pasient
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Patient's existing exercises */}
      {patientExercises.length > 0 && !compact && (
        <div className="border-t border-slate-200 p-3 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Aktive øvelser ({patientExercises.length})
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            {patientExercises.slice(0, 3).map((prescription) => (
              <div key={prescription.id} className="flex items-center justify-between">
                <span className="truncate">{prescription.exercise_name}</span>
                <span>
                  {prescription.sets}x{prescription.reps}
                </span>
              </div>
            ))}
            {patientExercises.length > 3 && (
              <span className="text-slate-400">+ {patientExercises.length - 3} flere...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisePanel;
