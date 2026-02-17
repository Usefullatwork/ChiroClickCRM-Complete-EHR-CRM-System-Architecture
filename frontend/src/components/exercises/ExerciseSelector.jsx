/**
 * ExerciseSelector Component
 * Filter and select exercises for prescriptions
 *
 * Filtrer og velg ovelser for treningsforskrivninger
 */

import _React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  _ChevronDown,
  Dumbbell,
  Play,
  Check,
  Plus,
  Target,
  Activity,
  Clock,
  Info,
  X,
} from 'lucide-react';

/**
 * ExerciseSelector Component
 * Displays filterable exercise library for selection
 *
 * @param {Object} props
 * @param {Array} props.exercises - All available exercises
 * @param {Array} props.categories - Exercise categories
 * @param {Array} props.selectedExercises - Currently selected exercises
 * @param {Function} props.onSelectExercise - Exercise selection callback
 * @param {boolean} props.loading - Loading state
 */
const ExerciseSelector = ({
  exercises = [],
  categories = [],
  selectedExercises = [],
  onSelectExercise,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [detailExercise, setDetailExercise] = useState(null);

  // Difficulty levels
  const difficultyLevels = [
    { value: 'all', label: 'Alle nivaer' },
    { value: 'beginner', label: 'Nybegynner' },
    { value: 'intermediate', label: 'Middels' },
    { value: 'advanced', label: 'Avansert' },
  ];

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          exercise.name?.toLowerCase().includes(search) ||
          exercise.name_norwegian?.toLowerCase().includes(search) ||
          exercise.description?.toLowerCase().includes(search) ||
          exercise.category?.toLowerCase().includes(search);
        if (!matchesSearch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && exercise.category !== selectedCategory) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && exercise.difficulty_level !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [exercises, searchTerm, selectedCategory, selectedDifficulty]);

  // Check if exercise is selected
  const isSelected = (exerciseId) => {
    return selectedExercises.some((ex) => ex.id === exerciseId || ex.exerciseId === exerciseId);
  };

  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get difficulty label
  const getDifficultyLabel = (level) => {
    const found = difficultyLevels.find((d) => d.value === level);
    return found?.label || level;
  };

  // Handle exercise click
  const handleExerciseClick = (exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ovelsesbibliotek</h2>
          </div>
          <span className="text-sm text-gray-500">{filteredExercises.length} ovelser</span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sok etter ovelser..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.category}
              {cat.exercise_count && (
                <span className="ml-1 opacity-70">({cat.exercise_count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Extra Filters */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-sm border-0 bg-transparent text-gray-600 focus:outline-none focus:ring-0 cursor-pointer"
            >
              {difficultyLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Dumbbell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-medium">Ingen ovelser funnet</p>
            <p className="text-sm text-gray-400">Prov a endre sokekriteriene</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 gap-3">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => handleExerciseClick(exercise)}
                className={`relative p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected(exercise.id)
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Selection indicator */}
                {isSelected(exercise.id) && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Thumbnail */}
                {exercise.thumbnail_url || exercise.image_url ? (
                  <img
                    src={exercise.thumbnail_url || exercise.image_url}
                    alt={exercise.name}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mb-2 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-blue-300" />
                  </div>
                )}

                {/* Exercise Info */}
                <h3 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
                  {exercise.name_norwegian || exercise.name}
                </h3>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${getDifficultyColor(exercise.difficulty_level)}`}
                  >
                    {getDifficultyLabel(exercise.difficulty_level)}
                  </span>
                  {exercise.video_url && (
                    <span className="flex items-center gap-0.5 text-xs text-blue-600">
                      <Play className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  {exercise.sets_default && <span>{exercise.sets_default} sett</span>}
                  {exercise.reps_default && <span>{exercise.reps_default} rep</span>}
                </div>

                {/* Info button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailExercise(exercise);
                  }}
                  className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => handleExerciseClick(exercise)}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                  isSelected(exercise.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Selection checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected(exercise.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {isSelected(exercise.id) && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {exercise.thumbnail_url || exercise.image_url ? (
                    <img
                      src={exercise.thumbnail_url || exercise.image_url}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-blue-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {exercise.name_norwegian || exercise.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{exercise.category}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs ${getDifficultyColor(exercise.difficulty_level)}`}
                    >
                      {getDifficultyLabel(exercise.difficulty_level)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  {exercise.video_url && <Play className="w-4 h-4 text-blue-500" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailExercise(exercise);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedExercises.length > 0 && (
        <div className="p-3 bg-blue-50 border-t border-blue-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              <strong>{selectedExercises.length}</strong> ovelser valgt
            </span>
            <button
              onClick={() => selectedExercises.forEach((ex) => onSelectExercise(ex))}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Fjern alle
            </button>
          </div>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {detailExercise && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailExercise(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {detailExercise.name_norwegian || detailExercise.name}
              </h3>
              <button
                onClick={() => setDetailExercise(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {/* Category tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {detailExercise.category}
                </span>
                {detailExercise.subcategory && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {detailExercise.subcategory}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(detailExercise.difficulty_level)}`}
                >
                  {getDifficultyLabel(detailExercise.difficulty_level)}
                </span>
              </div>

              {/* Description */}
              {detailExercise.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Beskrivelse</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {detailExercise.description_norwegian || detailExercise.description}
                  </p>
                </div>
              )}

              {/* Default Parameters */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Target className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-medium">{detailExercise.sets_default || 3}</p>
                  <p className="text-xs text-gray-500">Sett</p>
                </div>
                <div className="text-center">
                  <Activity className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-medium">{detailExercise.reps_default || 10}</p>
                  <p className="text-xs text-gray-500">Repetisjoner</p>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-medium">{detailExercise.hold_seconds || 0}s</p>
                  <p className="text-xs text-gray-500">Hold</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              {detailExercise.video_url ? (
                <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Play className="w-4 h-4" />
                  Se video
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => {
                  onSelectExercise(detailExercise);
                  setDetailExercise(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isSelected(detailExercise.id)
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSelected(detailExercise.id) ? (
                  <>
                    <X className="w-4 h-4" />
                    Fjern fra program
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Legg til i program
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseSelector;
