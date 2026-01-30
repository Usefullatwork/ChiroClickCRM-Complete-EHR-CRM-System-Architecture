/**
 * Draggable SOAP Sections Component
 * Allows users to reorder SOAP note sections via drag-and-drop
 */

import React, { useState, useCallback, useEffect } from 'react'
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
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react'

// Default SOAP sections with Norwegian labels
const DEFAULT_SECTIONS = [
  {
    id: 'subjective',
    key: 'subjective',
    label: 'Subjektiv',
    labelEn: 'Subjective',
    icon: 'S',
    color: 'blue',
    description: 'Pasientens symptomer og historie'
  },
  {
    id: 'objective',
    key: 'objective',
    label: 'Objektiv',
    labelEn: 'Objective',
    icon: 'O',
    color: 'green',
    description: 'Kliniske funn og undersøkelse'
  },
  {
    id: 'assessment',
    key: 'assessment',
    label: 'Vurdering',
    labelEn: 'Assessment',
    icon: 'A',
    color: 'orange',
    description: 'Diagnose og vurdering'
  },
  {
    id: 'plan',
    key: 'plan',
    label: 'Plan',
    labelEn: 'Plan',
    icon: 'P',
    color: 'purple',
    description: 'Behandling og oppfølging'
  }
]

// Get color classes
const getColorClasses = (color, isActive = false) => {
  const colors = {
    blue: isActive ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-blue-50 border-blue-200 text-blue-600',
    green: isActive ? 'bg-green-100 border-green-500 text-green-700' : 'bg-green-50 border-green-200 text-green-600',
    orange: isActive ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-orange-50 border-orange-200 text-orange-600',
    purple: isActive ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-purple-50 border-purple-200 text-purple-600'
  }
  return colors[color] || colors.blue
}

// Sortable Section Item
const SortableSectionItem = ({
  section,
  content,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isHidden,
  onToggleHidden,
  isActive,
  onFocus,
  readOnly
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  }

  const colorClasses = getColorClasses(section.color, isActive)

  if (isHidden) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-2 opacity-50">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-sm ${colorClasses}`}>
          {section.icon}
        </div>
        <span className="flex-1 text-gray-500 line-through">{section.label}</span>
        <button
          onClick={() => onToggleHidden(section.id)}
          className="p-1 hover:bg-gray-200 rounded text-gray-400"
          title="Vis seksjon"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 rounded-lg border-2 overflow-hidden transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      } ${colorClasses.split(' ').slice(0, 2).join(' ')}`}
    >
      {/* Section Header */}
      <div className={`flex items-center gap-2 p-3 ${colorClasses}`}>
        <div {...attributes} {...listeners} className="cursor-grab hover:text-gray-700">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg bg-white shadow-sm`}>
          {section.icon}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">{section.label}</h3>
          {section.description && (
            <p className="text-xs opacity-75">{section.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleHidden(section.id)}
            className="p-1.5 hover:bg-white/50 rounded"
            title="Skjul seksjon"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleCollapse(section.id)}
            className="p-1.5 hover:bg-white/50 rounded"
            title={isCollapsed ? 'Utvid' : 'Minimer'}
          >
            {isCollapsed ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-3 bg-white">
          <textarea
            value={content || ''}
            onChange={(e) => onChange(section.key, e.target.value)}
            onFocus={() => onFocus && onFocus(section.key)}
            placeholder={`Skriv ${section.label.toLowerCase()} her...`}
            className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  )
}

// Main Component
const DraggableSoapSections = ({
  values = {},
  onChange,
  onSectionFocus,
  readOnly = false,
  sectionOrder: initialOrder,
  onOrderChange,
  collapsedSections: initialCollapsed,
  hiddenSections: initialHidden
}) => {
  // State
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const [collapsedSections, setCollapsedSections] = useState(new Set(initialCollapsed || []))
  const [hiddenSections, setHiddenSections] = useState(new Set(initialHidden || []))
  const [activeSection, setActiveSection] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Apply initial order
  useEffect(() => {
    if (initialOrder && initialOrder.length > 0) {
      setSections(prev => {
        const orderedSections = []
        initialOrder.forEach(id => {
          const section = prev.find(s => s.id === id)
          if (section) orderedSections.push(section)
        })
        // Add any sections not in the order
        prev.forEach(section => {
          if (!orderedSections.find(s => s.id === section.id)) {
            orderedSections.push(section)
          }
        })
        return orderedSections
      })
    }
  }, [initialOrder])

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setSections(items => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)

        // Notify parent of order change
        if (onOrderChange) {
          onOrderChange(newOrder.map(s => s.id))
        }

        return newOrder
      })
    }
  }, [onOrderChange])

  // Toggle section collapse
  const toggleCollapse = useCallback((sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }, [])

  // Toggle section hidden
  const toggleHidden = useCallback((sectionId) => {
    setHiddenSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }, [])

  // Handle content change
  const handleContentChange = useCallback((sectionKey, value) => {
    if (onChange) {
      onChange(sectionKey, value)
    }
  }, [onChange])

  // Handle section focus
  const handleFocus = useCallback((sectionKey) => {
    setActiveSection(sectionKey)
    if (onSectionFocus) {
      onSectionFocus(sectionKey)
    }
  }, [onSectionFocus])

  // Reset to defaults
  const handleReset = useCallback(() => {
    setSections(DEFAULT_SECTIONS)
    setCollapsedSections(new Set())
    setHiddenSections(new Set())
    if (onOrderChange) {
      onOrderChange(DEFAULT_SECTIONS.map(s => s.id))
    }
  }, [onOrderChange])

  // Expand all
  const expandAll = useCallback(() => {
    setCollapsedSections(new Set())
  }, [])

  // Collapse all
  const collapseAll = useCallback(() => {
    setCollapsedSections(new Set(sections.map(s => s.id)))
  }, [sections])

  // Show all hidden
  const showAllHidden = useCallback(() => {
    setHiddenSections(new Set())
  }, [])

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">SOAP-notater</h3>

        <div className="flex items-center gap-2">
          {hiddenSections.size > 0 && (
            <button
              onClick={showAllHidden}
              className="text-xs text-blue-600 hover:underline"
            >
              Vis skjulte ({hiddenSections.size})
            </button>
          )}

          <div className="flex rounded-lg border border-gray-200">
            <button
              onClick={expandAll}
              className="p-1.5 hover:bg-gray-100 rounded-l-lg border-r border-gray-200"
              title="Utvid alle"
            >
              <Maximize2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 hover:bg-gray-100 rounded-r-lg"
              title="Minimer alle"
            >
              <Minimize2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg ${
              showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Innstillinger"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Tilpass seksjoner</h4>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="w-3 h-3" />
              Tilbakestill
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Dra seksjonene for å endre rekkefølge. Klikk på øye-ikonet for å skjule.
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map(section => (
              <div
                key={section.id}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                  hiddenSections.has(section.id)
                    ? 'bg-gray-200 text-gray-500 line-through'
                    : getColorClasses(section.color)
                }`}
              >
                <span className="font-bold">{section.icon}</span>
                <span>{section.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sortable Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map(section => (
            <SortableSectionItem
              key={section.id}
              section={section}
              content={values[section.key]}
              onChange={handleContentChange}
              isCollapsed={collapsedSections.has(section.id)}
              onToggleCollapse={toggleCollapse}
              isHidden={hiddenSections.has(section.id)}
              onToggleHidden={toggleHidden}
              isActive={activeSection === section.key}
              onFocus={handleFocus}
              readOnly={readOnly}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Hidden sections indicator */}
      {hiddenSections.size > 0 && (
        <div className="mt-2 p-2 bg-gray-100 rounded-lg text-center">
          <button
            onClick={showAllHidden}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {hiddenSections.size} seksjon{hiddenSections.size !== 1 ? 'er' : ''} skjult - klikk for å vise
          </button>
        </div>
      )}
    </div>
  )
}

export default DraggableSoapSections
