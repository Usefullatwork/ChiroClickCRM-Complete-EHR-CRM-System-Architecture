/**
 * Exercise Library Component
 * Browse, search, and manage exercise library
 *
 * Mobile-optimized with:
 * - Touch-friendly buttons (min 44px)
 * - Responsive grid layouts
 * - Bottom sheet modal on mobile
 * - Collapsible filters
 * - Horizontal scroll for category pills
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search,
  Plus,
  Filter,
  Grid,
  List,
  Play,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Activity,
  Target,
  Clock,
  Check,
  Video,
  Info,
  X
} from 'lucide-react'
import VimeoPlayer from './VimeoPlayer'
import useMediaQuery from '../../hooks/useMediaQuery'

const ExerciseLibrary = ({
  exercises = [],
  categories = [],
  onSelectExercise,
  onCreateExercise,
  onEditExercise,
  onDeleteExercise,
  selectedExercises = [],
  selectionMode = false,
  loading = false
}) => {
  const { isMobile, isTablet, prefersReducedMotion } = useMediaQuery()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBodyRegion, setSelectedBodyRegion] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [viewMode, setViewMode] = useState(isMobile ? 'grid' : 'grid')
  const [showFilters, setShowFilters] = useState(false)
  const [videoExercise, setVideoExercise] = useState(null) // For video modal
  const [detailExercise, setDetailExercise] = useState(null) // For detail modal
  const categoryScrollRef = useRef(null)

  // Difficulty levels with Norwegian translations
  const difficultyLevels = [
    { value: 'all', label: 'Alle nivåer', labelEn: 'All Levels' },
    { value: 'beginner', label: 'Nybegynner', labelEn: 'Beginner' },
    { value: 'intermediate', label: 'Middels', labelEn: 'Intermediate' },
    { value: 'advanced', label: 'Avansert', labelEn: 'Advanced' }
  ]

  // Body regions for filtering
  const bodyRegions = [
    { value: 'all', label: 'Alle områder' },
    { value: 'Neck', label: 'Nakke' },
    { value: 'Upper Back', label: 'Øvre rygg' },
    { value: 'Lower Back', label: 'Korsrygg' },
    { value: 'Shoulder', label: 'Skulder' },
    { value: 'Hip', label: 'Hofte' },
    { value: 'Knee', label: 'Kne' },
    { value: 'Core', label: 'Kjerne' },
    { value: 'Balance', label: 'Balanse' }
  ]

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          exercise.name?.toLowerCase().includes(search) ||
          exercise.name_norwegian?.toLowerCase().includes(search) ||
          exercise.description?.toLowerCase().includes(search) ||
          exercise.category?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory !== 'all' && exercise.category !== selectedCategory) {
        return false
      }

      // Body region filter
      if (selectedBodyRegion !== 'all' && exercise.body_region !== selectedBodyRegion) {
        return false
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && exercise.difficulty_level !== selectedDifficulty) {
        return false
      }

      return true
    })
  }, [exercises, searchTerm, selectedCategory, selectedBodyRegion, selectedDifficulty])

  // Check if exercise is selected
  const isSelected = (exerciseId) => {
    return selectedExercises.some(ex => ex.exerciseId === exerciseId || ex.id === exerciseId)
  }

  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get difficulty label
  const getDifficultyLabel = (level) => {
    const found = difficultyLevels.find(d => d.value === level)
    return found?.label || level
  }

  // Handle exercise click
  const handleExerciseClick = (exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise)
    }
  }

  // Count active filters
  const activeFilterCount = [
    selectedBodyRegion !== 'all',
    selectedDifficulty !== 'all'
  ].filter(Boolean).length

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedBodyRegion('all')
    setSelectedDifficulty('all')
    setSearchTerm('')
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Dumbbell className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              Øvelsesbibliotek
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
              ({filteredExercises.length})
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* View Mode Toggle - Hidden on small mobile */}
            <div className="hidden xs:flex rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
                aria-label="Rutenettvisning"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
                aria-label="Listevisning"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Create Button */}
            {onCreateExercise && (
              <button
                onClick={onCreateExercise}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm min-h-[40px] sm:min-h-[44px] touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ny øvelse</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søk etter øvelser..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Category Filters - Horizontal scroll on mobile */}
          <div className="relative -mx-3 sm:mx-0">
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 px-3 sm:px-0 scrollbar-hide"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 sm:py-1.5 rounded-full text-sm whitespace-nowrap transition-colors min-h-[36px] sm:min-h-[32px] touch-manipulation ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                Alle
              </button>
              {categories.map(cat => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-3 py-2 sm:py-1.5 rounded-full text-sm whitespace-nowrap transition-colors min-h-[36px] sm:min-h-[32px] touch-manipulation ${
                    selectedCategory === cat.category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {cat.category} ({cat.exercise_count})
                </button>
              ))}

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-3 py-2 sm:py-1.5 rounded-full text-sm whitespace-nowrap transition-colors min-h-[36px] sm:min-h-[32px] touch-manipulation ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className={`flex flex-col sm:flex-row flex-wrap gap-3 pt-3 border-t border-gray-100 ${
              prefersReducedMotion ? '' : 'animate-in slide-in-from-top-2'
            }`}>
              {/* Body Region */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Område:</label>
                <select
                  value={selectedBodyRegion}
                  onChange={(e) => setSelectedBodyRegion(e.target.value)}
                  className="px-3 py-2.5 sm:py-1.5 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-[36px]"
                >
                  {bodyRegions.map(region => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Nivå:</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2.5 sm:py-1.5 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-[36px]"
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 underline self-start sm:self-center py-2 min-h-[44px] sm:min-h-[36px] touch-manipulation"
                >
                  Nullstill filtre
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Ingen øvelser funnet</p>
            <p className="text-sm text-gray-400 mb-4">Prøv å endre søkekriteriene</p>
            {(searchTerm || activeFilterCount > 0) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[44px] touch-manipulation"
              >
                Nullstill filtre
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View - Responsive columns */
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => handleExerciseClick(exercise)}
                className={`relative p-3 sm:p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md active:scale-[0.98] touch-manipulation group ${
                  isSelected(exercise.id)
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Selection indicator */}
                {selectionMode && isSelected(exercise.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center z-10">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Thumbnail placeholder */}
                {exercise.thumbnail_url || exercise.image_url ? (
                  <img
                    src={exercise.thumbnail_url || exercise.image_url}
                    alt={exercise.name}
                    className="w-full h-28 sm:h-32 object-cover rounded-lg mb-3"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-28 sm:h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mb-3 flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 text-blue-300" />
                  </div>
                )}

                {/* Exercise Info */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base leading-tight">
                    {exercise.name_norwegian || exercise.name}
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {exercise.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(exercise.difficulty_level)}`}>
                      {getDifficultyLabel(exercise.difficulty_level)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 flex-wrap">
                    {exercise.sets_default && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {exercise.sets_default} sett
                      </span>
                    )}
                    {exercise.reps_default && (
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {exercise.reps_default} rep
                      </span>
                    )}
                    {exercise.hold_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exercise.hold_seconds}s
                      </span>
                    )}
                  </div>

                  {/* Video and Info buttons - Touch-friendly */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                    {exercise.video_url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setVideoExercise(exercise); }}
                        className="flex items-center gap-1 px-3 py-2 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[36px] touch-manipulation"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Se video</span>
                        <span className="xs:hidden">Video</span>
                      </button>
                    )}
                    {exercise.description && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailExercise(exercise); }}
                        className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[36px] touch-manipulation"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Info
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Show on hover (desktop) or always visible (mobile) */}
                {!selectionMode && (onEditExercise || onDeleteExercise) && (
                  <div className={`absolute top-2 right-2 flex gap-1 ${
                    isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity`}>
                    {onEditExercise && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditExercise(exercise); }}
                        className="p-2 bg-white rounded-full shadow hover:bg-gray-50 active:bg-gray-100 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                        aria-label="Rediger"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {onDeleteExercise && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteExercise(exercise); }}
                        className="p-2 bg-white rounded-full shadow hover:bg-red-50 active:bg-red-100 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                        aria-label="Slett"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View - Mobile optimized */
          <div className="space-y-2">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => handleExerciseClick(exercise)}
                className={`flex items-center gap-3 sm:gap-4 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm active:bg-gray-50 touch-manipulation ${
                  isSelected(exercise.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Selection checkbox */}
                {selectionMode && (
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected(exercise.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {isSelected(exercise.id) && <Check className="w-4 h-4 text-white" />}
                  </div>
                )}

                {/* Thumbnail */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {exercise.thumbnail_url || exercise.image_url ? (
                    <img
                      src={exercise.thumbnail_url || exercise.image_url}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                    {exercise.name_norwegian || exercise.name}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {exercise.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(exercise.difficulty_level)}`}>
                      {getDifficultyLabel(exercise.difficulty_level)}
                    </span>
                  </div>
                  {/* Parameters - Hidden on mobile to save space */}
                  <div className="hidden sm:flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {exercise.sets_default && (
                      <span>{exercise.sets_default} sett</span>
                    )}
                    {exercise.reps_default && (
                      <span>{exercise.reps_default} rep</span>
                    )}
                    {exercise.hold_seconds && (
                      <span>{exercise.hold_seconds}s hold</span>
                    )}
                  </div>
                </div>

                {/* Quick actions - Compact on mobile */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {exercise.video_url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setVideoExercise(exercise); }}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
                      aria-label="Se video"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {exercise.description && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailExercise(exercise); }}
                      className="p-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
                      aria-label="Vis detaljer"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Actions - Hidden on mobile, shown on tablet+ */}
                {!selectionMode && (onEditExercise || onDeleteExercise) && (
                  <div className="hidden sm:flex gap-1 flex-shrink-0">
                    {onEditExercise && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditExercise(exercise); }}
                        className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
                        aria-label="Rediger"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {onDeleteExercise && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteExercise(exercise); }}
                        className="p-2 hover:bg-red-50 active:bg-red-100 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
                        aria-label="Slett"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {videoExercise && (
        <VimeoPlayer
          videoUrl={videoExercise.video_url}
          title={videoExercise.name_norwegian || videoExercise.name}
          onClose={() => setVideoExercise(null)}
        />
      )}

      {/* Exercise Detail Modal - Bottom sheet on mobile */}
      {detailExercise && (
        <div
          className={`fixed inset-0 bg-black/50 z-50 ${
            isMobile ? 'flex items-end' : 'flex items-center justify-center p-4'
          }`}
          onClick={() => setDetailExercise(null)}
        >
          <div
            className={`bg-white overflow-hidden ${
              isMobile
                ? 'w-full rounded-t-2xl max-h-[90vh]'
                : 'rounded-xl max-w-2xl w-full max-h-[90vh]'
            } ${prefersReducedMotion ? '' : 'animate-in slide-in-from-bottom duration-300'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar for mobile */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 pr-4 line-clamp-2">
                {detailExercise.name_norwegian || detailExercise.name}
              </h3>
              <button
                onClick={() => setDetailExercise(null)}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 touch-manipulation"
                aria-label="Lukk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: isMobile ? '50vh' : '60vh' }}>
              {/* Category tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {detailExercise.category}
                </span>
                {detailExercise.subcategory && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {detailExercise.subcategory}
                  </span>
                )}
                <span className={`px-3 py-1.5 rounded-full text-sm ${getDifficultyColor(detailExercise.difficulty_level)}`}>
                  {getDifficultyLabel(detailExercise.difficulty_level)}
                </span>
              </div>

              {/* Description */}
              <div className="prose prose-sm max-w-none">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Beskrivelse</h4>
                <p className="text-gray-600 whitespace-pre-line text-sm sm:text-base leading-relaxed">
                  {detailExercise.description_norwegian || detailExercise.description}
                </p>
              </div>

              {/* Parameters */}
              {(detailExercise.sets_default || detailExercise.reps_default || detailExercise.hold_seconds) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Standard parametere</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {detailExercise.sets_default && (
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                        <Target className="w-5 h-5 text-blue-500 mb-1" />
                        <span className="font-semibold text-gray-900">{detailExercise.sets_default}</span>
                        <span className="text-xs text-gray-500">sett</span>
                      </div>
                    )}
                    {detailExercise.reps_default && (
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                        <Activity className="w-5 h-5 text-green-500 mb-1" />
                        <span className="font-semibold text-gray-900">{detailExercise.reps_default}</span>
                        <span className="text-xs text-gray-500">repetisjoner</span>
                      </div>
                    )}
                    {detailExercise.hold_seconds && (
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-500 mb-1" />
                        <span className="font-semibold text-gray-900">{detailExercise.hold_seconds}</span>
                        <span className="text-xs text-gray-500">sek hold</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Stacked buttons on mobile */}
            <div
              className={`p-4 border-t border-gray-200 bg-gray-50 ${
                isMobile ? 'flex flex-col gap-2' : 'flex items-center justify-between'
              }`}
              style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' : undefined }}
            >
              {onSelectExercise && (
                <button
                  onClick={() => { onSelectExercise(detailExercise); setDetailExercise(null); }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation font-medium ${
                    isMobile ? 'w-full order-1' : ''
                  } ${
                    isSelected(detailExercise.id)
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
                      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  {isSelected(detailExercise.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      Fjern fra program
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Legg til i program
                    </>
                  )}
                </button>
              )}
              {detailExercise.video_url && (
                <button
                  onClick={() => { setDetailExercise(null); setVideoExercise(detailExercise); }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation font-medium ${
                    isMobile ? 'w-full order-2' : ''
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Se video
                </button>
              )}
              {!detailExercise.video_url && !onSelectExercise && <div />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseLibrary
