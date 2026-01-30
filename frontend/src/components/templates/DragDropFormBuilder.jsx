/**
 * Drag-and-Drop Form Builder Component
 * Visual form creation tool for clinical forms and templates
 */

import React, { useState, useCallback } from 'react'
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
  Plus,
  Trash2,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
  Type,
  AlignLeft,
  CheckSquare,
  Circle,
  List,
  Calendar,
  Hash,
  Star,
  Image,
  Minus,
  FileText,
  Save,
  Eye,
  X,
  Edit2
} from 'lucide-react'

// Available field types
const FIELD_TYPES = [
  { type: 'text', label: 'Tekstfelt', icon: Type, description: 'Kort tekst' },
  { type: 'textarea', label: 'Tekstområde', icon: AlignLeft, description: 'Lang tekst' },
  { type: 'checkbox', label: 'Avkrysning', icon: CheckSquare, description: 'Ja/Nei' },
  { type: 'radio', label: 'Flervalg (én)', icon: Circle, description: 'Velg én' },
  { type: 'select', label: 'Nedtrekksliste', icon: List, description: 'Velg fra liste' },
  { type: 'date', label: 'Dato', icon: Calendar, description: 'Velg dato' },
  { type: 'number', label: 'Tall', icon: Hash, description: 'Numerisk verdi' },
  { type: 'rating', label: 'Vurdering', icon: Star, description: 'Stjerne-skala' },
  { type: 'vas', label: 'VAS-skala', icon: Minus, description: 'Smerteskala 0-10' },
  { type: 'section', label: 'Seksjonsdeler', icon: FileText, description: 'Gruppér felt' },
  { type: 'image', label: 'Bilde', icon: Image, description: 'Last opp bilde' }
]

// Default field properties
const getDefaultFieldProps = (type) => ({
  id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  label: '',
  placeholder: '',
  required: false,
  helpText: '',
  options: type === 'radio' || type === 'select' || type === 'checkbox'
    ? [{ id: '1', value: 'Alternativ 1' }]
    : [],
  validation: {},
  width: 'full', // full, half, third
  min: type === 'number' || type === 'vas' ? 0 : undefined,
  max: type === 'number' ? undefined : type === 'vas' ? 10 : undefined,
  defaultValue: ''
})

// Field Type Selector
const FieldTypeSelector = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Legg til felt
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-2 max-h-80 overflow-y-auto">
            {FIELD_TYPES.map(fieldType => {
              const Icon = fieldType.icon
              return (
                <button
                  key={fieldType.type}
                  onClick={() => {
                    onSelect(fieldType.type)
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 text-left"
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{fieldType.label}</div>
                    <div className="text-xs text-gray-500">{fieldType.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Sortable Field Item
const SortableFieldItem = ({
  field,
  onUpdate,
  onDelete,
  onDuplicate,
  isSelected,
  onSelect
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const fieldTypeInfo = FIELD_TYPES.find(t => t.type === field.type)
  const Icon = fieldTypeInfo?.icon || Type

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(field.id)}
      className={`relative rounded-lg border-2 p-4 mb-3 transition-all cursor-pointer ${
        isDragging
          ? 'shadow-lg border-blue-500 bg-blue-50'
          : isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab hover:text-blue-600"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Field Content */}
      <div className="ml-6">
        {/* Field Header */}
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {field.label || fieldTypeInfo?.label || 'Uten tittel'}
          </span>
          {field.required && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </div>

        {/* Field Preview */}
        <div className="mb-2">
          {field.type === 'text' && (
            <input
              type="text"
              placeholder={field.placeholder || 'Tekstfelt...'}
              className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50"
              disabled
            />
          )}
          {field.type === 'textarea' && (
            <textarea
              placeholder={field.placeholder || 'Tekstområde...'}
              className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 h-20"
              disabled
            />
          )}
          {field.type === 'checkbox' && field.options?.map(opt => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" disabled />
              {opt.value}
            </label>
          ))}
          {field.type === 'radio' && field.options?.map(opt => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="radio" name={field.id} disabled />
              {opt.value}
            </label>
          ))}
          {field.type === 'select' && (
            <select className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50" disabled>
              <option>Velg...</option>
              {field.options?.map(opt => (
                <option key={opt.id}>{opt.value}</option>
              ))}
            </select>
          )}
          {field.type === 'date' && (
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50"
              disabled
            />
          )}
          {field.type === 'number' && (
            <input
              type="number"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50"
              disabled
            />
          )}
          {field.type === 'rating' && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} className="w-6 h-6 text-gray-300" />
              ))}
            </div>
          )}
          {field.type === 'vas' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">0</span>
              <input
                type="range"
                min="0"
                max="10"
                className="flex-1"
                disabled
              />
              <span className="text-xs text-gray-500">10</span>
            </div>
          )}
          {field.type === 'section' && (
            <div className="border-b-2 border-gray-300 pb-1 text-gray-500 text-sm">
              {field.label || 'Seksjonsdeler'}
            </div>
          )}
        </div>

        {/* Help Text */}
        {field.helpText && (
          <p className="text-xs text-gray-500">{field.helpText}</p>
        )}
      </div>

      {/* Actions */}
      {isSelected && (
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(field.id); }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Dupliser"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}
            className="p-1.5 hover:bg-red-100 rounded"
            title="Slett"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  )
}

// Field Properties Editor
const FieldPropertiesEditor = ({ field, onUpdate, onClose }) => {
  const [localField, setLocalField] = useState(field)

  const handleChange = (key, value) => {
    setLocalField(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onUpdate(field.id, localField)
    onClose()
  }

  const addOption = () => {
    const newOption = { id: Date.now().toString(), value: `Alternativ ${(localField.options?.length || 0) + 1}` }
    setLocalField(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption]
    }))
  }

  const updateOption = (id, value) => {
    setLocalField(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? { ...opt, value } : opt)
    }))
  }

  const removeOption = (id) => {
    setLocalField(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Feltegenskaper</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etikett
          </label>
          <input
            type="text"
            value={localField.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Feltets navn..."
          />
        </div>

        {/* Placeholder */}
        {['text', 'textarea', 'number'].includes(localField.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plassholder
            </label>
            <input
              type="text"
              value={localField.placeholder}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hint til brukeren..."
            />
          </div>
        )}

        {/* Help Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hjelpetekst
          </label>
          <input
            type="text"
            value={localField.helpText}
            onChange={(e) => handleChange('helpText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tilleggsinformasjon..."
          />
        </div>

        {/* Options (for select, radio, checkbox) */}
        {['select', 'radio', 'checkbox'].includes(localField.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternativer
            </label>
            <div className="space-y-2">
              {localField.options?.map(opt => (
                <div key={opt.id} className="flex gap-2">
                  <input
                    type="text"
                    value={opt.value}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeOption(opt.id)}
                    className="p-1.5 hover:bg-red-100 rounded"
                    disabled={localField.options.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Plus className="w-3 h-3" />
                Legg til alternativ
              </button>
            </div>
          </div>
        )}

        {/* Number range */}
        {localField.type === 'number' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum
              </label>
              <input
                type="number"
                value={localField.min ?? ''}
                onChange={(e) => handleChange('min', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksimum
              </label>
              <input
                type="number"
                value={localField.max ?? ''}
                onChange={(e) => handleChange('max', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Required */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={localField.required}
            onChange={(e) => handleChange('required', e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="required" className="text-sm text-gray-700">
            Obligatorisk felt
          </label>
        </div>

        {/* Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bredde
          </label>
          <div className="flex gap-2">
            {['full', 'half', 'third'].map(width => (
              <button
                key={width}
                onClick={() => handleChange('width', width)}
                className={`flex-1 py-2 text-sm rounded border ${
                  localField.width === width
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {width === 'full' ? 'Full' : width === 'half' ? '1/2' : '1/3'}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Lagre endringer
        </button>
      </div>
    </div>
  )
}

// Main Component
const DragDropFormBuilder = ({
  initialFields = [],
  onChange,
  onSave,
  formName = 'Nytt skjema'
}) => {
  const [fields, setFields] = useState(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [localFormName, setLocalFormName] = useState(formName)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setFields(items => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        const newFields = arrayMove(items, oldIndex, newIndex)

        if (onChange) {
          onChange(newFields)
        }

        return newFields
      })
    }
  }, [onChange])

  // Add new field
  const addField = useCallback((type) => {
    const newField = getDefaultFieldProps(type)
    setFields(prev => {
      const newFields = [...prev, newField]
      if (onChange) onChange(newFields)
      return newFields
    })
    setSelectedFieldId(newField.id)
  }, [onChange])

  // Update field
  const updateField = useCallback((fieldId, updates) => {
    setFields(prev => {
      const newFields = prev.map(f => f.id === fieldId ? { ...f, ...updates } : f)
      if (onChange) onChange(newFields)
      return newFields
    })
  }, [onChange])

  // Delete field
  const deleteField = useCallback((fieldId) => {
    setFields(prev => {
      const newFields = prev.filter(f => f.id !== fieldId)
      if (onChange) onChange(newFields)
      return newFields
    })
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }, [onChange, selectedFieldId])

  // Duplicate field
  const duplicateField = useCallback((fieldId) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId)
    if (fieldToDuplicate) {
      const newField = {
        ...fieldToDuplicate,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: `${fieldToDuplicate.label} (kopi)`
      }
      setFields(prev => {
        const index = prev.findIndex(f => f.id === fieldId)
        const newFields = [...prev.slice(0, index + 1), newField, ...prev.slice(index + 1)]
        if (onChange) onChange(newFields)
        return newFields
      })
    }
  }, [fields, onChange])

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave({
        name: localFormName,
        fields
      })
    }
  }

  const selectedField = fields.find(f => f.id === selectedFieldId)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={localFormName}
              onChange={(e) => setLocalFormName(e.target.value)}
              className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            />
            <span className="text-sm text-gray-500">{fields.length} felt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showPreview
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              Forhåndsvisning
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Lagre
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form Builder */}
        <div className="flex-1 overflow-y-auto p-6">
          {showPreview ? (
            /* Preview Mode */
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{localFormName}</h2>
              <div className="space-y-4">
                {fields.map(field => (
                  <div key={field.id} className={`${
                    field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'
                  }`}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {/* Render field based on type */}
                    {field.type === 'text' && (
                      <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder={field.placeholder} />
                    )}
                    {field.type === 'textarea' && (
                      <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24" placeholder={field.placeholder} />
                    )}
                    {field.type === 'number' && (
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg" min={field.min} max={field.max} />
                    )}
                    {field.type === 'date' && (
                      <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                    )}
                    {field.type === 'select' && (
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                        <option value="">Velg...</option>
                        {field.options?.map(opt => <option key={opt.id}>{opt.value}</option>)}
                      </select>
                    )}
                    {field.type === 'radio' && (
                      <div className="space-y-1">
                        {field.options?.map(opt => (
                          <label key={opt.id} className="flex items-center gap-2">
                            <input type="radio" name={field.id} />
                            <span className="text-sm">{opt.value}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {field.type === 'checkbox' && (
                      <div className="space-y-1">
                        {field.options?.map(opt => (
                          <label key={opt.id} className="flex items-center gap-2">
                            <input type="checkbox" />
                            <span className="text-sm">{opt.value}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {field.type === 'vas' && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">0</span>
                        <input type="range" min="0" max="10" className="flex-1" />
                        <span className="text-sm text-gray-500">10</span>
                      </div>
                    )}
                    {field.type === 'rating' && (
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} className="p-1 hover:text-yellow-500">
                            <Star className="w-6 h-6" />
                          </button>
                        ))}
                      </div>
                    )}
                    {field.type === 'section' && (
                      <div className="border-b-2 border-gray-300 pb-2 mt-4" />
                    )}
                    {field.helpText && (
                      <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Dra for å endre rekkefølge</h3>
                <FieldTypeSelector onSelect={addField} />
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Ingen felt ennå</p>
                  <p className="text-sm text-gray-400 mb-4">Klikk "Legg til felt" for å komme i gang</p>
                  <FieldTypeSelector onSelect={addField} />
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {fields.map(field => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        onUpdate={updateField}
                        onDelete={deleteField}
                        onDuplicate={duplicateField}
                        isSelected={selectedFieldId === field.id}
                        onSelect={setSelectedFieldId}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedField && !showPreview && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
            <FieldPropertiesEditor
              field={selectedField}
              onUpdate={updateField}
              onClose={() => setSelectedFieldId(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default DragDropFormBuilder
