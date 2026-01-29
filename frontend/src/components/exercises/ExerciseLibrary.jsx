/**
 * Exercise Library Component
 * Full-page browser for exercise library management
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exercisesAPI } from '../../services/api';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Play,
  Image as ImageIcon,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  X,
  Save,
  Loader2,
  Star,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';

// Body region labels in Norwegian
const BODY_REGION_LABELS = {
  cervical: 'Nakke',
  thoracic: 'Brystsøyle',
  lumbar: 'Korsrygg',
  shoulder: 'Skulder',
  hip: 'Hofte',
  knee: 'Kne',
  ankle: 'Ankel',
  core: 'Kjerne',
  full_body: 'Helkropp',
  upper_extremity: 'Overekstremitet',
  lower_extremity: 'Underekstremitet'
};

// Category labels in Norwegian
const CATEGORY_LABELS = {
  stretching: 'Tøyning',
  strengthening: 'Styrke',
  mobility: 'Mobilitet',
  balance: 'Balanse',
  vestibular: 'Vestibulær',
  breathing: 'Pust',
  posture: 'Holdning',
  nerve_glide: 'Nervegliding'
};

// Difficulty labels in Norwegian
const DIFFICULTY_LABELS = {
  beginner: 'Lett',
  intermediate: 'Middels',
  advanced: 'Vanskelig'
};

/**
 * Exercise Form Modal
 */
const ExerciseFormModal = ({ exercise, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    code: exercise?.code || '',
    name_no: exercise?.name_no || '',
    name_en: exercise?.name_en || '',
    category: exercise?.category || 'stretching',
    body_region: exercise?.body_region || 'cervical',
    difficulty: exercise?.difficulty || 'beginner',
    instructions_no: exercise?.instructions_no || '',
    instructions_en: exercise?.instructions_en || '',
    contraindications: exercise?.contraindications || '',
    precautions: exercise?.precautions || '',
    video_url: exercise?.video_url || '',
    image_url: exercise?.image_url || '',
    default_sets: exercise?.default_sets || 3,
    default_reps: exercise?.default_reps || 10,
    default_hold_seconds: exercise?.default_hold_seconds || null,
    default_frequency: exercise?.default_frequency || 'daily',
    tags: exercise?.tags?.join(', ') || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      default_hold_seconds: formData.default_hold_seconds || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {exercise ? 'Rediger øvelse' : 'Ny øvelse'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kode *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                placeholder="f.eks. NECK-STRETCH-001"
              />
            </div>

            {/* Name NO */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Navn (norsk) *
              </label>
              <input
                type="text"
                value={formData.name_no}
                onChange={(e) => setFormData({ ...formData, name_no: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Name EN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Navn (engelsk)
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Body Region */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kroppsregion *
              </label>
              <select
                value={formData.body_region}
                onChange={(e) => setFormData({ ...formData, body_region: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(BODY_REGION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vanskelighetsgrad
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Instructions NO */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instruksjoner (norsk) *
            </label>
            <textarea
              value={formData.instructions_no}
              onChange={(e) => setFormData({ ...formData, instructions_no: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              required
            />
          </div>

          {/* Contraindications */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kontraindikasjoner
            </label>
            <textarea
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={2}
            />
          </div>

          {/* Default Dosing */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sett
              </label>
              <input
                type="number"
                value={formData.default_sets}
                onChange={(e) => setFormData({ ...formData, default_sets: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reps
              </label>
              <input
                type="number"
                value={formData.default_reps}
                onChange={(e) => setFormData({ ...formData, default_reps: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hold (sek)
              </label>
              <input
                type="number"
                value={formData.default_hold_seconds || ''}
                onChange={(e) => setFormData({ ...formData, default_hold_seconds: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                min="1"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frekvens
              </label>
              <select
                value={formData.default_frequency}
                onChange={(e) => setFormData({ ...formData, default_frequency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="daily">Daglig</option>
                <option value="2x_daily">2x daglig</option>
                <option value="3x_week">3x/uke</option>
                <option value="weekly">Ukentlig</option>
              </select>
            </div>
          </div>

          {/* Media URLs */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bilde URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags (kommaseparert)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="f.eks. mcgill, core, rygg"
            />
          </div>
        </form>

        <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
  );
};

/**
 * Exercise Library Component
 */
export const ExerciseLibrary = ({ onSelectExercise }) => {
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [editingExercise, setEditingExercise] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const limit = 24;

  // Fetch exercises
  const { data: exercisesData, isLoading } = useQuery({
    queryKey: ['exercises', { search: searchTerm, category: selectedCategory, bodyRegion: selectedBodyRegion, page }],
    queryFn: () => exercisesAPI.getAll({
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
      bodyRegion: selectedBodyRegion || undefined,
      page,
      limit
    }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['exercises', 'stats'],
    queryFn: () => exercisesAPI.getStats(),
    staleTime: 10 * 60 * 1000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => exercisesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
      setShowCreateModal(false);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => exercisesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
      setEditingExercise(null);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => exercisesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
    }
  });

  const exercises = exercisesData?.data?.data || [];
  const pagination = exercisesData?.data?.pagination || { total: 0, page: 1, totalPages: 1 };
  const stats = statsData?.data || {};

  const handleDelete = async (exercise) => {
    if (window.confirm(`Er du sikker på at du vil slette "${exercise.name_no}"?`)) {
      deleteMutation.mutate(exercise.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Øvelsesbibliotek</h1>
            <p className="text-sm text-slate-500 mt-1">
              {stats.total_exercises || 0} øvelser | {stats.active_prescriptions || 0} aktive foreskrivninger
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ny øvelse
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Søk øvelser..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedBodyRegion}
            onChange={(e) => {
              setSelectedBodyRegion(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 min-w-[160px]"
          >
            <option value="">Alle regioner</option>
            {Object.entries(BODY_REGION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 min-w-[160px]"
          >
            <option value="">Alle kategorier</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* View mode toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 ${viewMode === 'list' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Ingen øvelser funnet</h3>
            <p className="text-sm text-slate-400 mt-1">Prøv å endre søkekriteriene</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="h-32 bg-slate-100 flex items-center justify-center">
                  {exercise.thumbnail_url || exercise.image_url ? (
                    <img
                      src={exercise.thumbnail_url || exercise.image_url}
                      alt={exercise.name_no}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Dumbbell className="w-12 h-12 text-slate-300" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-slate-800 truncate">{exercise.name_no}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {BODY_REGION_LABELS[exercise.body_region]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-600">
                      {CATEGORY_LABELS[exercise.category]}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {exercise.default_sets}x{exercise.default_reps}
                    {exercise.default_hold_seconds && ` | Hold: ${exercise.default_hold_seconds}s`}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    {onSelectExercise && (
                      <button
                        onClick={() => onSelectExercise(exercise)}
                        className="flex-1 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Velg
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedExercise(exercise)}
                      className="p-1.5 rounded hover:bg-slate-100"
                      title="Vis detaljer"
                    >
                      <Info className="w-4 h-4 text-slate-400" />
                    </button>
                    {!exercise.is_global && (
                      <>
                        <button
                          onClick={() => setEditingExercise(exercise)}
                          className="p-1.5 rounded hover:bg-slate-100"
                          title="Rediger"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(exercise)}
                          className="p-1.5 rounded hover:bg-red-50"
                          title="Slett"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Øvelse</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Region</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Kategori</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Dosering</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exercises.map((exercise) => (
                  <tr key={exercise.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {exercise.thumbnail_url ? (
                            <img src={exercise.thumbnail_url} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <Dumbbell className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-slate-800">{exercise.name_no}</span>
                          {exercise.is_global && (
                            <span className="ml-2 text-xs text-purple-600">(Global)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {BODY_REGION_LABELS[exercise.body_region]}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {CATEGORY_LABELS[exercise.category]}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {exercise.default_sets}x{exercise.default_reps}
                      {exercise.default_hold_seconds && ` | ${exercise.default_hold_seconds}s`}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onSelectExercise && (
                          <button
                            onClick={() => onSelectExercise(exercise)}
                            className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Velg
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedExercise(exercise)}
                          className="p-1.5 rounded hover:bg-slate-100"
                        >
                          <Info className="w-4 h-4 text-slate-400" />
                        </button>
                        {!exercise.is_global && (
                          <>
                            <button
                              onClick={() => setEditingExercise(exercise)}
                              className="p-1.5 rounded hover:bg-slate-100"
                            >
                              <Edit2 className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(exercise)}
                              className="p-1.5 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-600">
              Side {page} av {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <ExerciseFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {editingExercise && (
        <ExerciseFormModal
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={(data) => updateMutation.mutate({ id: editingExercise.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{selectedExercise.name_no}</h2>
              <button onClick={() => setSelectedExercise(null)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Image */}
              {selectedExercise.image_url && (
                <img
                  src={selectedExercise.image_url}
                  alt={selectedExercise.name_no}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              {/* Meta */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-sm">
                  {BODY_REGION_LABELS[selectedExercise.body_region]}
                </span>
                <span className="px-2 py-1 rounded bg-purple-100 text-purple-600 text-sm">
                  {CATEGORY_LABELS[selectedExercise.category]}
                </span>
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-600 text-sm">
                  {DIFFICULTY_LABELS[selectedExercise.difficulty]}
                </span>
              </div>

              {/* Instructions */}
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">Instruksjoner</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {selectedExercise.instructions_no}
                </p>
              </div>

              {/* Dosing */}
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">Standard dosering</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Sett:</span>
                    <span className="ml-2 font-medium">{selectedExercise.default_sets}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Reps:</span>
                    <span className="ml-2 font-medium">{selectedExercise.default_reps}</span>
                  </div>
                  {selectedExercise.default_hold_seconds && (
                    <div>
                      <span className="text-slate-500">Hold:</span>
                      <span className="ml-2 font-medium">{selectedExercise.default_hold_seconds}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contraindications */}
              {selectedExercise.contraindications && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-700 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Kontraindikasjoner
                  </h4>
                  <p className="text-sm text-red-600">{selectedExercise.contraindications}</p>
                </div>
              )}

              {/* Video link */}
              {selectedExercise.video_url && (
                <a
                  href={selectedExercise.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Play className="w-4 h-4" />
                  Se video
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
