/**
 * TemplateSelector Component
 * Velg og last inn forhåndsdefinerte treningsprogrammer
 *
 * Select and load predefined exercise program templates
 */

import React, { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  FolderOpen,
  Clock,
  Dumbbell,
  ChevronRight,
  Star,
  StarOff,
  Plus,
  Check,
  X,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react'

/**
 * TemplateSelector Component
 * Viser tilgjengelige maler for treningsprogrammer
 *
 * @param {Object} props
 * @param {Array} props.templates - Available templates
 * @param {Function} props.onSelectTemplate - Template selection callback
 * @param {Function} props.onSaveAsTemplate - Save current program as template callback
 * @param {Array} props.currentExercises - Current selected exercises (for save as template)
 * @param {boolean} props.loading - Loading state
 */
const TemplateSelector = ({
  templates = [],
  onSelectTemplate,
  onSaveAsTemplate,
  currentExercises = [],
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Extract unique categories from templates
  const categories = useMemo(() => {
    const cats = [...new Set(templates.map(t => t.category).filter(Boolean))]
    return cats.sort()
  }, [templates])

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          template.name?.toLowerCase().includes(search) ||
          template.description?.toLowerCase().includes(search) ||
          template.category?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false
      }

      return true
    })
  }, [templates, searchTerm, selectedCategory])

  // Handle template selection
  const handleSelectTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template)
    }
  }

  // Handle save as template
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) return

    try {
      setSaving(true)
      await onSaveAsTemplate({
        name: newTemplateName,
        category: newTemplateCategory || 'Egendefinert',
        description: newTemplateDescription,
        exercises: currentExercises.map((ex, index) => ({
          exerciseId: ex.exerciseId || ex.id,
          sets: ex.sets,
          reps: ex.reps,
          holdSeconds: ex.holdSeconds,
          frequencyPerDay: ex.frequencyPerDay,
          frequencyPerWeek: ex.frequencyPerWeek,
          displayOrder: index
        }))
      })
      setShowSaveModal(false)
      setNewTemplateName('')
      setNewTemplateCategory('')
      setNewTemplateDescription('')
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  // Get estimated time for a template
  const getEstimatedTime = (template) => {
    if (!template.exercises) return 0
    return template.exercises.reduce((total, ex) => {
      const setsTime = (ex.sets || 3) * (ex.reps || 10) * 3
      const holdTime = (ex.holdSeconds || 0) * (ex.sets || 3)
      return total + setsTime + holdTime + 30
    }, 0)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Programmal</h2>
          </div>
          {currentExercises.length > 0 && onSaveAsTemplate && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Save className="w-4 h-4" />
              Lagre som mal
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Søk i maler..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle maler
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-500">Laster maler...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <FolderOpen className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-600">Ingen maler funnet</p>
            <p className="text-sm text-gray-400 text-center mt-1">
              {searchTerm
                ? 'Prøv å endre søkekriteriene'
                : 'Lag et program og lagre det som mal for å komme i gang'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <h3 className="font-medium text-gray-900 truncate">
                        {template.name}
                      </h3>
                      {template.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">
                        {template.category || 'Generell'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" />
                        {template.exercises?.length || 0} øvelser
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{Math.ceil(getEstimatedTime(template) / 60)} min
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0 ml-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Built-in templates hint */}
      {templates.length > 0 && (
        <div className="p-3 bg-purple-50 border-t border-purple-200 text-sm text-purple-700">
          <p>
            <strong>{templates.length}</strong> maler tilgjengelig. Klikk for å laste inn et program.
          </p>
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Lagre som mal
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Malnavn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="F.eks. Nakke- og skulderprogram"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  placeholder="F.eks. Nakke, Rygg, Rehabilitering"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrivelse
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Beskriv når denne malen skal brukes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{currentExercises.length}</strong> øvelser vil bli lagret i denne malen.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={!newTemplateName.trim() || saving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lagre mal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateSelector
