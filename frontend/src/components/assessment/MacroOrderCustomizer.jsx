/**
 * Macro Order Customizer Component
 * Allows users to drag-and-drop macros and categories to customize their order
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Star,
  StarOff,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
  Settings,
  X,
  Check,
  Folder,
  FileText
} from 'lucide-react'
import api from '../../services/api'

// Sortable Category Item
const SortableCategoryItem = ({
  category,
  isExpanded,
  onToggleExpand,
  onToggleHidden,
  macros,
  onMacroReorder,
  onToggleFavorite
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.name })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 ${category.isHidden ? 'opacity-50' : ''}`}
    >
      {/* Category Header */}
      <div className={`flex items-center gap-2 p-3 bg-gray-50 rounded-lg border ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}>
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>

        <button
          onClick={() => onToggleExpand(category.name)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <Folder className="w-4 h-4 text-blue-500" />

        <span className="flex-1 font-medium text-gray-900">{category.name}</span>

        <span className="text-xs text-gray-500">
          {macros.filter(m => m.category === category.name).length} macros
        </span>

        <button
          onClick={() => onToggleHidden(category.name)}
          className={`p-1 rounded hover:bg-gray-200 ${
            category.isHidden ? 'text-red-500' : 'text-gray-400'
          }`}
          title={category.isHidden ? 'Vis kategori' : 'Skjul kategori'}
        >
          {category.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Macros in Category */}
      {isExpanded && !category.isHidden && (
        <div className="ml-6 mt-1 space-y-1">
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor),
              useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates
              })
            )}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onMacroReorder(category.name, event)}
          >
            <SortableContext
              items={macros.filter(m => m.category === category.name).map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {macros
                .filter(m => m.category === category.name)
                .map(macro => (
                  <SortableMacroItem
                    key={macro.id}
                    macro={macro}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

// Sortable Macro Item
const SortableMacroItem = ({ macro, onToggleFavorite }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: macro.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-white rounded border ${
        isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500">
        <GripVertical className="w-3 h-3" />
      </div>

      <FileText className="w-3 h-3 text-gray-400" />

      <span className="flex-1 text-sm text-gray-700 truncate" title={macro.macro_text}>
        {macro.macro_name}
      </span>

      <button
        onClick={() => onToggleFavorite(macro.id)}
        className={`p-1 rounded hover:bg-gray-100 ${
          macro.is_favorite ? 'text-yellow-500' : 'text-gray-300'
        }`}
        title={macro.is_favorite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
      >
        {macro.is_favorite ? <Star className="w-3 h-3 fill-current" /> : <StarOff className="w-3 h-3" />}
      </button>
    </div>
  )
}

// Main Component
const MacroOrderCustomizer = ({
  isOpen,
  onClose,
  onSave
}) => {
  // State
  const [categories, setCategories] = useState([])
  const [macros, setMacros] = useState([])
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('categories')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Load data
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load macros
      const macrosResponse = await api.get('/macros')
      const loadedMacros = macrosResponse.data.data || []
      setMacros(loadedMacros)

      // Extract unique categories
      const uniqueCategories = [...new Set(loadedMacros.map(m => m.category))]
        .filter(Boolean)
        .map(name => ({
          name,
          isHidden: false,
          displayOrder: 0
        }))
      setCategories(uniqueCategories)

      // Load user preferences
      try {
        const prefsResponse = await api.get('/macros/preferences')
        if (prefsResponse.data.data) {
          const prefs = prefsResponse.data.data

          // Apply category order
          if (prefs.category_order && prefs.category_order.length > 0) {
            setCategories(prevCats => {
              const orderedCats = []
              prefs.category_order.forEach(catName => {
                const cat = prevCats.find(c => c.name === catName)
                if (cat) orderedCats.push(cat)
              })
              // Add any new categories not in saved order
              prevCats.forEach(cat => {
                if (!orderedCats.find(c => c.name === cat.name)) {
                  orderedCats.push(cat)
                }
              })
              return orderedCats
            })
          }

          // Apply hidden categories
          if (prefs.hidden_categories) {
            setCategories(prevCats =>
              prevCats.map(cat => ({
                ...cat,
                isHidden: prefs.hidden_categories.includes(cat.name)
              }))
            )
          }

          // Apply favorite macro order
          if (prefs.favorite_macro_order) {
            // Reorder favorite macros
            setMacros(prevMacros => {
              const favoriteMacros = prevMacros.filter(m => m.is_favorite)
              const nonFavoriteMacros = prevMacros.filter(m => !m.is_favorite)

              const orderedFavorites = []
              prefs.favorite_macro_order.forEach(id => {
                const macro = favoriteMacros.find(m => m.id === id)
                if (macro) orderedFavorites.push(macro)
              })
              // Add any favorites not in saved order
              favoriteMacros.forEach(macro => {
                if (!orderedFavorites.find(m => m.id === macro.id)) {
                  orderedFavorites.push(macro)
                }
              })

              return [...orderedFavorites, ...nonFavoriteMacros]
            })
          }
        }
      } catch (err) {
        // Preferences might not exist yet, that's okay
        console.log('No saved preferences found')
      }
    } catch (error) {
      console.error('Error loading macro data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle category drag end
  const handleCategoryDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setCategories(items => {
        const oldIndex = items.findIndex(i => i.name === active.id)
        const newIndex = items.findIndex(i => i.name === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setHasChanges(true)
    }
  }

  // Handle macro drag end within a category
  const handleMacroDragEnd = (categoryName, event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setMacros(items => {
        const categoryMacros = items.filter(m => m.category === categoryName)
        const otherMacros = items.filter(m => m.category !== categoryName)

        const oldIndex = categoryMacros.findIndex(m => m.id === active.id)
        const newIndex = categoryMacros.findIndex(m => m.id === over.id)

        const reorderedCategoryMacros = arrayMove(categoryMacros, oldIndex, newIndex)

        // Reconstruct full list
        return [...reorderedCategoryMacros, ...otherMacros]
      })
      setHasChanges(true)
    }
  }

  // Toggle category expansion
  const toggleExpand = (categoryName) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  // Toggle category hidden
  const toggleHidden = (categoryName) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.name === categoryName
          ? { ...cat, isHidden: !cat.isHidden }
          : cat
      )
    )
    setHasChanges(true)
  }

  // Toggle macro favorite
  const toggleFavorite = async (macroId) => {
    setMacros(prev =>
      prev.map(macro =>
        macro.id === macroId
          ? { ...macro, is_favorite: !macro.is_favorite }
          : macro
      )
    )
    setHasChanges(true)
  }

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true)

      const preferences = {
        categoryOrder: categories.map(c => c.name),
        hiddenCategories: categories.filter(c => c.isHidden).map(c => c.name),
        favoriteMacroOrder: macros.filter(m => m.is_favorite).map(m => m.id)
      }

      await api.put('/macros/preferences', preferences)

      // Update favorite status for individual macros
      const favoriteMacros = macros.filter(m => m.is_favorite)
      const nonFavoriteMacros = macros.filter(m => !m.is_favorite)

      // Batch update favorites (simplified - would need proper endpoint)
      for (const macro of favoriteMacros) {
        if (!macro._originalIsFavorite) {
          await api.patch(`/macros/${macro.id}`, { isFavorite: true })
        }
      }

      setHasChanges(false)

      if (onSave) {
        onSave(preferences)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const handleReset = () => {
    loadData()
    setHasChanges(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tilpass makroer</h2>
              <p className="text-sm text-gray-500">Dra og slipp for å endre rekkefølge</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Kategorier
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'favorites'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Favoritter
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'categories' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={categories.map(c => c.name)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map(category => (
                  <SortableCategoryItem
                    key={category.name}
                    category={category}
                    isExpanded={expandedCategories.has(category.name)}
                    onToggleExpand={toggleExpand}
                    onToggleHidden={toggleHidden}
                    macros={macros}
                    onMacroReorder={handleMacroDragEnd}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            /* Favorites Tab */
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">
                Dra for å endre rekkefølgen på favorittmakroene dine.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event
                  if (active.id !== over.id) {
                    setMacros(items => {
                      const favorites = items.filter(m => m.is_favorite)
                      const nonFavorites = items.filter(m => !m.is_favorite)

                      const oldIndex = favorites.findIndex(m => m.id === active.id)
                      const newIndex = favorites.findIndex(m => m.id === over.id)

                      const reordered = arrayMove(favorites, oldIndex, newIndex)
                      return [...reordered, ...nonFavorites]
                    })
                    setHasChanges(true)
                  }
                }}
              >
                <SortableContext
                  items={macros.filter(m => m.is_favorite).map(m => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {macros.filter(m => m.is_favorite).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>Ingen favorittmakroer</p>
                      <p className="text-sm">Klikk på stjernen ved en makro for å legge den til</p>
                    </div>
                  ) : (
                    macros.filter(m => m.is_favorite).map(macro => (
                      <SortableMacroItem
                        key={macro.id}
                        macro={macro}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))
                  )}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Tilbakestill
          </button>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-orange-600">Ulagrede endringer</span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lagre
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MacroOrderCustomizer
