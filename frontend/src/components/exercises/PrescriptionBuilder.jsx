/**
 * PrescriptionBuilder Component
 * Drag-and-drop program builder for exercise prescriptions
 *
 * Dra-og-slipp programbygger for treningsforskrivninger
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Plus,
  Dumbbell,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  Play,
  Info,
  X
} from 'lucide-react'
import PrescriptionCard from './PrescriptionCard'

/**
 * PrescriptionBuilder Component
 * Builds exercise prescription with drag-drop reordering
 *
 * @param {Object} props
 * @param {Array} props.exercises - Selected exercises with parameters
 * @param {Function} props.onRemove - Remove exercise callback
 * @param {Function} props.onUpdate - Update exercise parameters callback
 * @param {Function} props.onReorder - Reorder exercises callback
 * @param {Function} props.onAddClick - Add exercise button callback
 */
const PrescriptionBuilder = ({
  exercises = [],
  onRemove,
  onUpdate,
  onReorder,
  onAddClick
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [expandedIndex, setExpandedIndex] = useState(null)
  const dragRef = useRef(null)

  /**
   * Handle drag start
   */
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index)
    // Add some styling to the dragged element
    setTimeout(() => {
      if (dragRef.current) {
        dragRef.current.style.opacity = '0.5'
      }
    }, 0)
  }

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    if (dragRef.current) {
      dragRef.current.style.opacity = '1'
    }
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  /**
   * Handle drop
   */
  const handleDrop = (e, toIndex) => {
    e.preventDefault()
    const fromIndex = draggedIndex
    if (fromIndex !== null && fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  /**
   * Move exercise up in order
   */
  const handleMoveUp = (index) => {
    if (index > 0 && onReorder) {
      onReorder(index, index - 1)
    }
  }

  /**
   * Move exercise down in order
   */
  const handleMoveDown = (index) => {
    if (index < exercises.length - 1 && onReorder) {
      onReorder(index, index + 1)
    }
  }

  /**
   * Toggle expanded view
   */
  const handleToggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  /**
   * Get difficulty color classes
   */
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200'
      case 'intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'advanced': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  /**
   * Get difficulty label in Norwegian
   */
  const getDifficultyLabel = (level) => {
    switch (level) {
      case 'beginner': return 'Nybegynner'
      case 'intermediate': return 'Middels'
      case 'advanced': return 'Avansert'
      default: return level
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Ovelser ({exercises.length})
            </h2>
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Legg til ovelse
          </button>
        </div>
        {exercises.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Dra for a endre rekkefolge, eller bruk pilene
          </p>
        )}
      </div>

      {/* Exercise List */}
      <div className="divide-y divide-gray-100">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-600 font-medium mb-1">Ingen ovelser valgt</h3>
            <p className="text-sm text-gray-400 text-center mb-4">
              Velg ovelser fra biblioteket til hoyre for a bygge treningsprogrammet
            </p>
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Velg ovelser
            </button>
          </div>
        ) : (
          exercises.map((exercise, index) => (
            <div
              key={`${exercise.id || exercise.exerciseId}-${index}`}
              ref={draggedIndex === index ? dragRef : null}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                transition-all duration-200
                ${dragOverIndex === index ? 'bg-blue-50 border-t-2 border-blue-400' : ''}
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              <PrescriptionCard
                exercise={exercise}
                index={index}
                isExpanded={expandedIndex === index}
                onToggleExpand={() => handleToggleExpand(index)}
                onUpdate={(field, value) => onUpdate(index, field, value)}
                onRemove={() => onRemove(index)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                canMoveUp={index > 0}
                canMoveDown={index < exercises.length - 1}
                getDifficultyColor={getDifficultyColor}
                getDifficultyLabel={getDifficultyLabel}
              />
            </div>
          ))
        )}
      </div>

      {/* Quick Add Tip */}
      {exercises.length > 0 && exercises.length < 3 && (
        <div className="p-4 bg-amber-50 border-t border-amber-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Tips</p>
              <p className="text-amber-700">
                Et godt treningsprogram inneholder vanligvis 3-6 ovelser.
                Start enkelt og ok gradvis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrescriptionBuilder
