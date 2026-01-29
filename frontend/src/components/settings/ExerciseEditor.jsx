import { useState, useEffect } from 'react'
import {
  X,
  Save,
  Loader2,
  Video,
  Image,
  AlertCircle,
  Plus
} from 'lucide-react'

/**
 * ExerciseEditor - Modal component for creating and editing exercises
 *
 * @param {Object} props
 * @param {Object} props.exercise - Exercise data (null for create mode)
 * @param {string} props.mode - 'create' | 'edit'
 * @param {Function} props.onSave - Called with exercise data on save
 * @param {Function} props.onClose - Called when modal is closed
 * @param {boolean} props.isSaving - Loading state for save button
 * @param {string} props.lang - Language code ('no' | 'en')
 */
export default function ExerciseEditor({
  exercise = null,
  mode = 'create',
  onSave,
  onClose,
  isSaving = false,
  lang = 'no'
}) {
  // Form state
  const [formData, setFormData] = useState({
    name_no: '',
    name_en: '',
    category: 'strengthening',
    body_region: 'core',
    difficulty: 'beginner',
    instructions_no: '',
    instructions_en: '',
    contraindications: '',
    precautions: '',
    default_sets: 3,
    default_reps: 10,
    default_hold_seconds: null,
    default_frequency: 'daily',
    video_url: '',
    image_url: '',
    equipment_needed: [],
    tags: []
  })

  const [tagInput, setTagInput] = useState('')

  // Initialize form data when exercise prop changes
  useEffect(() => {
    if (exercise) {
      setFormData({
        name_no: exercise.name_no || '',
        name_en: exercise.name_en || '',
        category: exercise.category || 'strengthening',
        body_region: exercise.body_region || 'core',
        difficulty: exercise.difficulty || 'beginner',
        instructions_no: exercise.instructions_no || '',
        instructions_en: exercise.instructions_en || '',
        contraindications: exercise.contraindications || '',
        precautions: exercise.precautions || '',
        default_sets: exercise.default_sets || 3,
        default_reps: exercise.default_reps || 10,
        default_hold_seconds: exercise.default_hold_seconds || null,
        default_frequency: exercise.default_frequency || 'daily',
        video_url: exercise.video_url || '',
        image_url: exercise.image_url || '',
        equipment_needed: exercise.equipment_needed || [],
        tags: exercise.tags || []
      })
    }
  }, [exercise])

  // Category and body region labels
  const categoryLabels = {
    stretching: { no: 'Tøyning', en: 'Stretching' },
    strengthening: { no: 'Styrke', en: 'Strengthening' },
    mobility: { no: 'Mobilitet', en: 'Mobility' },
    balance: { no: 'Balanse', en: 'Balance' },
    posture: { no: 'Holdning', en: 'Posture' },
    breathing: { no: 'Pust', en: 'Breathing' },
    nerve_glide: { no: 'Nervegliding', en: 'Nerve Glide' },
    vestibular: { no: 'Vestibulær', en: 'Vestibular' }
  }

  const bodyRegionLabels = {
    cervical: { no: 'Nakke', en: 'Cervical' },
    thoracic: { no: 'Brystsøyle', en: 'Thoracic' },
    lumbar: { no: 'Korsrygg', en: 'Lumbar' },
    shoulder: { no: 'Skulder', en: 'Shoulder' },
    hip: { no: 'Hofte', en: 'Hip' },
    knee: { no: 'Kne', en: 'Knee' },
    ankle: { no: 'Ankel', en: 'Ankle' },
    foot: { no: 'Fot', en: 'Foot' },
    core: { no: 'Kjerne', en: 'Core' },
    upper_extremity: { no: 'Overekstremitet', en: 'Upper Extremity' },
    lower_extremity: { no: 'Underekstremitet', en: 'Lower Extremity' },
    full_body: { no: 'Helkropp', en: 'Full Body' }
  }

  const equipmentOptions = [
    { value: 'none', label: { no: 'Ingen', en: 'None' } },
    { value: 'yoga_mat', label: { no: 'Yogamatte', en: 'Yoga Mat' } },
    { value: 'resistance_band', label: { no: 'Elastikk', en: 'Resistance Band' } },
    { value: 'foam_roller', label: { no: 'Skumrull', en: 'Foam Roller' } },
    { value: 'chair', label: { no: 'Stol', en: 'Chair' } },
    { value: 'towel', label: { no: 'Håndkle', en: 'Towel' } },
    { value: 'doorway', label: { no: 'Døråpning', en: 'Doorway' } },
    { value: 'marbles', label: { no: 'Kuler', en: 'Marbles' } },
    { value: 'dumbbell', label: { no: 'Manualer', en: 'Dumbbells' } },
    { value: 'balance_board', label: { no: 'Balansebrett', en: 'Balance Board' } }
  ]

  // Helper to extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) {
      return null
    }
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/)
    return match ? match[1] : null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name_no) {
      return
    }
    onSave(formData)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim().toLowerCase()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleToggleEquipment = (equipment) => {
    const current = formData.equipment_needed || []
    if (current.includes(equipment)) {
      setFormData({
        ...formData,
        equipment_needed: current.filter(e => e !== equipment)
      })
    } else {
      setFormData({
        ...formData,
        equipment_needed: [...current, equipment]
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'create'
              ? (lang === 'no' ? 'Ny øvelse' : 'New Exercise')
              : (lang === 'no' ? 'Rediger øvelse' : 'Edit Exercise')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'no' ? 'Navn (Norsk)' : 'Name (Norwegian)'} *
                </label>
                <input
                  type="text"
                  value={formData.name_no}
                  onChange={(e) => setFormData({ ...formData, name_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={lang === 'no' ? 'f.eks. Kne til bryst tøyning' : 'e.g. Knee to Chest Stretch'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'no' ? 'Navn (Engelsk)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Knee to Chest Stretch"
                />
              </div>
            </div>

            {/* Category, Body Region, Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'no' ? 'Kategori' : 'Category'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(categoryLabels).map(([key, labels]) => (
                    <option key={key} value={key}>{labels[lang] || key}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'no' ? 'Kroppsregion' : 'Body Region'}
                </label>
                <select
                  value={formData.body_region}
                  onChange={(e) => setFormData({ ...formData, body_region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(bodyRegionLabels).map(([key, labels]) => (
                    <option key={key} value={key}>{labels[lang] || key}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'no' ? 'Vanskelighetsgrad' : 'Difficulty'}
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="beginner">{lang === 'no' ? 'Nybegynner' : 'Beginner'}</option>
                  <option value="intermediate">{lang === 'no' ? 'Middels' : 'Intermediate'}</option>
                  <option value="advanced">{lang === 'no' ? 'Avansert' : 'Advanced'}</option>
                </select>
              </div>
            </div>

            {/* Video URL with Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Video className="w-4 h-4 inline mr-1" />
                {lang === 'no' ? 'Video URL (YouTube)' : 'Video URL (YouTube)'}
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {formData.video_url && getYouTubeVideoId(formData.video_url) && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.video_url)}`}
                    title="Video preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Image URL with Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Image className="w-4 h-4 inline mr-1" />
                {lang === 'no' ? 'Bilde URL' : 'Image URL'}
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://raw.githubusercontent.com/yuhonas/free-exercise-db/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {lang === 'no'
                  ? 'Tips: Bruk bilder fra Free Exercise DB eller last opp til egen server'
                  : 'Tip: Use images from Free Exercise DB or upload to your own server'}
              </p>
              {formData.image_url && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="max-h-40 rounded-lg border border-gray-200"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'no' ? 'Instruksjoner (Norsk)' : 'Instructions (Norwegian)'}
                </label>
                <textarea
                  value={formData.instructions_no}
                  onChange={(e) => setFormData({ ...formData, instructions_no: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={lang === 'no' ? 'Detaljerte trinn-for-trinn instruksjoner...' : 'Detailed step-by-step instructions...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'no' ? 'Instruksjoner (Engelsk)' : 'Instructions (English)'}
                </label>
                <textarea
                  value={formData.instructions_en}
                  onChange={(e) => setFormData({ ...formData, instructions_en: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Detailed step-by-step instructions..."
                />
              </div>
            </div>

            {/* Contraindications and Precautions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-red-500" />
                  {lang === 'no' ? 'Kontraindikasjoner' : 'Contraindications'}
                </label>
                <textarea
                  value={formData.contraindications}
                  onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={lang === 'no' ? 'Når øvelsen IKKE bør utføres...' : 'When the exercise should NOT be performed...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-yellow-500" />
                  {lang === 'no' ? 'Forholdsregler' : 'Precautions'}
                </label>
                <textarea
                  value={formData.precautions}
                  onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={lang === 'no' ? 'Viktige hensyn og advarsler...' : 'Important considerations and warnings...'}
                />
              </div>
            </div>

            {/* Dosing Defaults */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'no' ? 'Standard dosering' : 'Default Dosing'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {lang === 'no' ? 'Sett' : 'Sets'}
                  </label>
                  <input
                    type="number"
                    value={formData.default_sets}
                    onChange={(e) => setFormData({ ...formData, default_sets: parseInt(e.target.value) || 3 })}
                    min={1}
                    max={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {lang === 'no' ? 'Reps' : 'Reps'}
                  </label>
                  <input
                    type="number"
                    value={formData.default_reps}
                    onChange={(e) => setFormData({ ...formData, default_reps: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {lang === 'no' ? 'Hold (sek)' : 'Hold (sec)'}
                  </label>
                  <input
                    type="number"
                    value={formData.default_hold_seconds || ''}
                    onChange={(e) => setFormData({ ...formData, default_hold_seconds: e.target.value ? parseInt(e.target.value) : null })}
                    min={0}
                    max={300}
                    placeholder="-"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {lang === 'no' ? 'Frekvens' : 'Frequency'}
                  </label>
                  <select
                    value={formData.default_frequency}
                    onChange={(e) => setFormData({ ...formData, default_frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="daily">{lang === 'no' ? 'Daglig' : 'Daily'}</option>
                    <option value="2x_daily">{lang === 'no' ? '2x daglig' : '2x Daily'}</option>
                    <option value="3x_daily">{lang === 'no' ? '3x daglig' : '3x Daily'}</option>
                    <option value="3x_week">{lang === 'no' ? '3x per uke' : '3x Weekly'}</option>
                    <option value="2x_week">{lang === 'no' ? '2x per uke' : '2x Weekly'}</option>
                    <option value="weekly">{lang === 'no' ? 'Ukentlig' : 'Weekly'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Equipment Needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'no' ? 'Utstyr som trengs' : 'Equipment Needed'}
              </label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((equip) => (
                  <button
                    key={equip.value}
                    type="button"
                    onClick={() => handleToggleEquipment(equip.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      (formData.equipment_needed || []).includes(equip.value)
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {equip.label[lang] || equip.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'no' ? 'Tagger' : 'Tags'}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={lang === 'no' ? 'Legg til tag...' : 'Add tag...'}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {lang === 'no' ? 'Avbryt' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!formData.name_no || isSaving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {lang === 'no' ? 'Lagrer...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {lang === 'no' ? 'Lagre øvelse' : 'Save Exercise'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
