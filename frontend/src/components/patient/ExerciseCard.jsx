/**
 * ExerciseCard Component
 * Viser en enkelt ovelse i pasientens treningsprogram
 *
 * Displays a single exercise in the patient's exercise program
 */

import _React, { useState } from 'react';
import {
  Play,
  _Pause,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  _Star,
  _MoreVertical,
  Dumbbell,
} from 'lucide-react';

/**
 * ExerciseCard Component
 * Kortkomponent for a vise en ovelse med instruksjoner og parametere
 *
 * @param {Object} props - Component props
 * @param {Object} props.exercise - Exercise data object
 * @param {boolean} props.completed - Whether the exercise is completed
 * @param {boolean} props.completedToday - Whether completed today (for portal)
 * @param {Function} props.onComplete - Callback when exercise is marked complete
 * @param {Function} props.onViewDetails - Callback to view exercise details
 * @param {Function} props.onClick - Callback when card is clicked (for portal navigation)
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {boolean} props.compact - Use compact card style (for lists)
 * @param {string} props.variant - Card variant: 'default' | 'portal' | 'thumbnail'
 * @returns {JSX.Element} Exercise card component
 */
export default function ExerciseCard({
  exercise,
  completed = false,
  completedToday,
  onComplete,
  onViewDetails,
  onClick,
  showActions = true,
  compact = false,
  variant = 'default',
}) {
  // Support both completed and completedToday props
  const isCompleted = completed || completedToday || exercise?.completedToday;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Get difficulty badge color
   * Henter farge for vanskelighetsgrad-merke
   */
  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Get difficulty label in Norwegian
   * Henter vanskelighetsgrad-etikett pa norsk
   */
  const getDifficultyLabel = (level) => {
    const labels = {
      beginner: 'Nybegynner',
      intermediate: 'Middels',
      advanced: 'Avansert',
    };
    return labels[level] || level;
  };

  /**
   * Handle play/pause video
   * Handterer avspilling/pause av video
   */
  const _handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  /**
   * Handle marking exercise as complete
   * Handterer merking av ovelse som fullført
   */
  const handleComplete = () => {
    if (onComplete) {
      onComplete(exercise.id || exercise.exerciseId);
    }
  };

  /**
   * Handle card click for navigation
   */
  const handleClick = () => {
    if (onClick) {
      onClick(exercise);
    }
  };

  /**
   * Get thumbnail image URL
   */
  const getThumbnail = () => {
    return exercise?.thumbnailUrl || exercise?.imageUrl || null;
  };

  // Compact variant for portal lists
  if (compact || variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-3 p-3 bg-white rounded-xl border transition-all hover:shadow-md active:scale-[0.98] ${
          isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        {/* Thumbnail/Icon */}
        <div
          className={`w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden ${
            getThumbnail()
              ? ''
              : 'bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center'
          }`}
        >
          {getThumbnail() ? (
            <img src={getThumbnail()} alt={exercise?.name} className="w-full h-full object-cover" />
          ) : (
            <Dumbbell className="w-6 h-6 text-blue-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-medium text-gray-900 truncate">
            {exercise?.name || 'Ukjent øvelse'}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            {exercise?.sets && <span>{exercise.sets} sett</span>}
            {exercise?.sets && exercise?.reps && <span>-</span>}
            {exercise?.reps && <span>{exercise.reps} rep</span>}
            {exercise?.videoUrl && (
              <span className="flex items-center gap-1 text-blue-600">
                <Play className="w-3 h-3" />
                Video
              </span>
            )}
          </div>
        </div>

        {/* Status/Arrow */}
        {isCompleted ? (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
    );
  }

  // Thumbnail variant for grid displays in portal
  if (variant === 'thumbnail') {
    return (
      <button
        onClick={handleClick}
        className={`w-full text-left bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg active:scale-[0.99] ${
          isCompleted
            ? 'border-green-300 ring-2 ring-green-100'
            : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100">
          {getThumbnail() ? (
            <img src={getThumbnail()} alt={exercise?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center">
              <Dumbbell className="w-12 h-12 text-blue-300" />
            </div>
          )}

          {/* Video badge */}
          {exercise?.videoUrl && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
              <Play className="w-3 h-3" fill="currentColor" />
              Video
            </div>
          )}

          {/* Completion badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-2">
            {exercise?.name || 'Ukjent øvelse'}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {exercise?.category && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {exercise.category}
              </span>
            )}
            {exercise?.difficultyLevel && (
              <span
                className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(exercise.difficultyLevel)}`}
              >
                {getDifficultyLabel(exercise.difficultyLevel)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {exercise?.sets && (
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4 text-gray-400" />
                {exercise.sets} sett
              </span>
            )}
            {exercise?.reps && (
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-gray-400" />
                {exercise.reps} rep
              </span>
            )}
            {exercise?.holdSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                {exercise.holdSeconds}s
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  // Default expandable variant
  return (
    <div
      className={`bg-white rounded-lg border transition-all ${
        isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Card Header / Kortoverskrift */}
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start gap-3">
          {/* Status Indicator / Statusindikator */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-100'
            }`}
          >
            {isCompleted ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <Activity className="w-5 h-5 text-blue-600" />
            )}
          </div>

          {/* Exercise Info / Ovelsesinformasjon */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                {exercise?.name || 'Ukjent øvelse'}
              </h3>
              {exercise?.difficultyLevel && (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(exercise.difficultyLevel)}`}
                >
                  {getDifficultyLabel(exercise.difficultyLevel)}
                </span>
              )}
            </div>

            {/* Category / Kategori */}
            {exercise?.category && (
              <p className="text-sm text-gray-500 mt-0.5">{exercise.category}</p>
            )}

            {/* Parameters / Parametere */}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              {exercise?.sets && (
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-gray-400" />
                  {exercise.sets} sett
                </span>
              )}
              {exercise?.reps && (
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-gray-400" />
                  {exercise.reps} rep
                </span>
              )}
              {exercise?.holdSeconds > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Hold {exercise.holdSeconds} sek
                </span>
              )}
              {exercise?.frequencyPerDay && <span>{exercise.frequencyPerDay}x daglig</span>}
            </div>
          </div>

          {/* Expand Button / Utvid-knapp */}
          <div className="text-gray-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content / Utvidet innhold */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Video/Image / Video/Bilde */}
          {exercise?.videoUrl && (
            <div className="aspect-video bg-gray-100 relative">
              <iframe
                src={exercise.videoUrl}
                className="w-full h-full"
                allowFullScreen
                title={exercise.name}
              />
            </div>
          )}

          {exercise?.imageUrl && !exercise?.videoUrl && (
            <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-48 object-cover" />
          )}

          {/* Instructions / Instruksjoner */}
          <div className="p-4 space-y-4">
            {exercise?.instructions && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Instruksjoner</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{exercise.instructions}</p>
              </div>
            )}

            {/* Custom Instructions / Tilpassede instruksjoner */}
            {exercise?.customInstructions && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Spesielle instruksjoner</h4>
                <p className="text-sm text-blue-800">{exercise.customInstructions}</p>
              </div>
            )}

            {/* Precautions / Forsiktighetsregler */}
            {exercise?.precautions && exercise.precautions.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Forsiktighetsregler</h4>
                    <ul className="text-sm text-yellow-700 mt-1">
                      {exercise.precautions.map((precaution, index) => (
                        <li key={index}>- {precaution}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons / Handlingsknapper */}
            {showActions && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleComplete}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCompleted ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Fullført
                    </span>
                  ) : (
                    'Marker som fullført'
                  )}
                </button>
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(exercise.id)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Detaljer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
