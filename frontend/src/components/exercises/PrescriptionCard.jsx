/**
 * PrescriptionCard Component
 * Individual exercise card in prescription with sets/reps configuration
 *
 * Individuelt ovelseskort i forskrivning med sett/repetisjoner konfigurasjon
 */

import { useState } from 'react';
import {
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Play,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  Minus,
  Plus,
} from 'lucide-react';

/**
 * PrescriptionCard Component
 * Displays a single exercise with editable parameters
 *
 * @param {Object} props
 * @param {Object} props.exercise - Exercise data
 * @param {number} props.index - Exercise index in list
 * @param {boolean} props.isExpanded - Whether card is expanded
 * @param {Function} props.onToggleExpand - Toggle expand callback
 * @param {Function} props.onUpdate - Update exercise callback
 * @param {Function} props.onRemove - Remove exercise callback
 * @param {Function} props.onMoveUp - Move up callback
 * @param {Function} props.onMoveDown - Move down callback
 * @param {boolean} props.canMoveUp - Can move up flag
 * @param {boolean} props.canMoveDown - Can move down flag
 * @param {Function} props.getDifficultyColor - Get difficulty color helper
 * @param {Function} props.getDifficultyLabel - Get difficulty label helper
 */
const PrescriptionCard = ({
  exercise,
  index,
  isExpanded = false,
  onToggleExpand,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  getDifficultyColor,
  getDifficultyLabel,
}) => {
  const [_showNotes, _setShowNotes] = useState(false);

  // Helper to increment/decrement values
  const adjustValue = (field, currentValue, delta, min = 1, max = 100) => {
    const newValue = Math.max(min, Math.min(max, (currentValue || 0) + delta));
    onUpdate(field, newValue);
  };

  // Get default difficulty helpers if not provided
  const difficultyColor = getDifficultyColor
    ? getDifficultyColor(exercise.difficulty_level)
    : exercise.difficulty_level === 'beginner'
      ? 'text-green-600 bg-green-50'
      : exercise.difficulty_level === 'intermediate'
        ? 'text-yellow-600 bg-yellow-50'
        : exercise.difficulty_level === 'advanced'
          ? 'text-red-600 bg-red-50'
          : 'text-gray-600 bg-gray-50';

  const difficultyLabel = getDifficultyLabel
    ? getDifficultyLabel(exercise.difficulty_level)
    : exercise.difficulty_level === 'beginner'
      ? 'Nybegynner'
      : exercise.difficulty_level === 'intermediate'
        ? 'Middels'
        : exercise.difficulty_level === 'advanced'
          ? 'Avansert'
          : exercise.difficulty_level;

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Main Card Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="text-gray-400 cursor-grab hover:text-gray-600 pt-1">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Order Number */}
          <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white text-sm font-semibold rounded-full flex-shrink-0">
            {index + 1}
          </div>

          {/* Exercise Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-gray-900">
                  {exercise.name_norwegian || exercise.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500">{exercise.category}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColor}`}>
                    {difficultyLabel}
                  </span>
                  {exercise.video_url && (
                    <span className="flex items-center gap-0.5 text-xs text-blue-600">
                      <Play className="w-3 h-3" />
                      Video
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Flytt opp"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Flytt ned"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={onToggleExpand}
                  className={`p-1.5 rounded transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Rediger"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onRemove}
                  className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                  title="Fjern"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Parameters Row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {/* Sets */}
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-gray-400" />
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => adjustValue('sets', exercise.sets, -1, 1, 10)}
                    className="px-2 py-1 hover:bg-gray-100 text-gray-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    value={exercise.sets || 3}
                    onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 1)}
                    className="w-10 text-center text-sm font-medium border-x border-gray-200 py-1 focus:outline-none"
                    min="1"
                    max="10"
                  />
                  <button
                    onClick={() => adjustValue('sets', exercise.sets, 1, 1, 10)}
                    className="px-2 py-1 hover:bg-gray-100 text-gray-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">sett</span>
              </div>

              {/* Reps */}
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-gray-400" />
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => adjustValue('reps', exercise.reps, -1, 1, 100)}
                    className="px-2 py-1 hover:bg-gray-100 text-gray-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    value={exercise.reps || 10}
                    onChange={(e) => onUpdate('reps', parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-sm font-medium border-x border-gray-200 py-1 focus:outline-none"
                    min="1"
                    max="100"
                  />
                  <button
                    onClick={() => adjustValue('reps', exercise.reps, 1, 1, 100)}
                    className="px-2 py-1 hover:bg-gray-100 text-gray-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">rep</span>
              </div>

              {/* Hold Seconds (only if exercise has hold) */}
              {(exercise.hold_seconds > 0 || exercise.holdSeconds > 0) && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => adjustValue('holdSeconds', exercise.holdSeconds, -5, 0, 300)}
                      className="px-2 py-1 hover:bg-gray-100 text-gray-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={exercise.holdSeconds || exercise.hold_seconds || 0}
                      onChange={(e) => onUpdate('holdSeconds', parseInt(e.target.value) || 0)}
                      className="w-12 text-center text-sm font-medium border-x border-gray-200 py-1 focus:outline-none"
                      min="0"
                      max="300"
                    />
                    <button
                      onClick={() => adjustValue('holdSeconds', exercise.holdSeconds, 5, 0, 300)}
                      className="px-2 py-1 hover:bg-gray-100 text-gray-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">sek</span>
                </div>
              )}

              {/* Frequency */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">x</span>
                <select
                  value={exercise.frequencyPerDay || 1}
                  onChange={(e) => onUpdate('frequencyPerDay', parseInt(e.target.value))}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1x/dag</option>
                  <option value={2}>2x/dag</option>
                  <option value={3}>3x/dag</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 bg-gray-50 border-t border-gray-100">
          {/* Instructions */}
          {(exercise.instructions_norwegian || exercise.instructions) && (
            <div className="pt-4">
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Standard instruksjoner
              </h5>
              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                {exercise.instructions_norwegian || exercise.instructions}
              </p>
            </div>
          )}

          {/* Custom Instructions */}
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Spesielle instruksjoner til pasienten
            </h5>
            <textarea
              value={exercise.customInstructions || ''}
              onChange={(e) => onUpdate('customInstructions', e.target.value)}
              placeholder="Legg til egne instruksjoner eller tilpasninger for denne pasienten..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Weekly Frequency */}
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Ukentlig frekvens
            </h5>
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  onClick={() => onUpdate('frequencyPerWeek', day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (exercise.frequencyPerWeek || 7) >= day
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-400'
                  }`}
                >
                  {day}
                </button>
              ))}
              <span className="text-sm text-gray-500 ml-2">dager per uke</span>
            </div>
          </div>

          {/* Precautions */}
          {exercise.precautions && exercise.precautions.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-medium text-amber-800 uppercase tracking-wider mb-1">
                    Forsiktighetsregler
                  </h5>
                  <ul className="text-sm text-amber-700 space-y-0.5">
                    {exercise.precautions.map((p, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>-</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Video Preview */}
          {exercise.video_url && (
            <div>
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Instruksjonsvideo
              </h5>
              <a
                href={exercise.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Play className="w-4 h-4" />
                Se video
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionCard;
