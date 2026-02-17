/**
 * MacroManager - Full CRUD UI for clinical text macros
 * Lists macros with category filter + search, create/edit modal, delete with confirmation
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Star,
  X,
  Zap,
  Filter,
  Copy,
  Keyboard,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { macrosAPI } from '../../services/api';
import toast from '../../utils/toast';

const CATEGORIES = [
  { value: '', label: 'Alle kategorier' },
  { value: 'SOAP', label: 'SOAP' },
  { value: 'Treatment', label: 'Behandling' },
  { value: 'Billing', label: 'Fakturering' },
  { value: 'General', label: 'Generelt' },
];

const CATEGORY_COLORS = {
  SOAP: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    header: 'bg-blue-100',
    badge: 'bg-blue-100 text-blue-700',
  },
  Treatment: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    header: 'bg-green-100',
    badge: 'bg-green-100 text-green-700',
  },
  Billing: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    header: 'bg-amber-100',
    badge: 'bg-amber-100 text-amber-700',
  },
  General: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    header: 'bg-gray-100',
    badge: 'bg-gray-100 text-gray-700',
  },
};

const SOAP_SECTIONS = [
  { value: '', label: 'Ingen' },
  { value: 'subjective', label: 'Subjektiv' },
  { value: 'objective', label: 'Objektiv' },
  { value: 'assessment', label: 'Vurdering' },
  { value: 'plan', label: 'Plan' },
];

export default function MacroManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMacro, setEditingMacro] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  // Fetch all macros
  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['macros-matrix'],
    queryFn: async () => {
      const res = await macrosAPI.getMatrix();
      return res.data.data;
    },
  });

  // Flatten matrix into array for display
  const allMacros = useMemo(() => {
    if (!matrixData) {
      return [];
    }
    const macros = [];
    for (const [category, catData] of Object.entries(matrixData)) {
      for (const macro of catData.macros || []) {
        macros.push({ ...macro, category });
      }
      for (const [subcat, subcatMacros] of Object.entries(catData.subcategories || {})) {
        for (const macro of subcatMacros) {
          macros.push({ ...macro, category, subcategory: subcat });
        }
      }
    }
    return macros;
  }, [matrixData]);

  // Filter macros
  const filteredMacros = useMemo(() => {
    let result = allMacros;
    if (categoryFilter) {
      result = result.filter((m) => m.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.text?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allMacros, categoryFilter, searchQuery]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => macrosAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macros-matrix'] });
      toast.success('Makro opprettet');
      setShowModal(false);
      setEditingMacro(null);
    },
    onError: (err) => toast.error(`Feil: ${err.response?.data?.error || err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => macrosAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macros-matrix'] });
      toast.success('Makro oppdatert');
      setShowModal(false);
      setEditingMacro(null);
    },
    onError: (err) => toast.error(`Feil: ${err.response?.data?.error || err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => macrosAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macros-matrix'] });
      toast.success('Makro slettet');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(`Feil: ${err.response?.data?.error || err.message}`),
  });

  const favoriteMutation = useMutation({
    mutationFn: (id) => macrosAPI.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macros-matrix'] });
    },
  });

  const handleEdit = (macro) => {
    setEditingMacro(macro);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingMacro(null);
    setShowModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Kopiert til utklippstavle');
  };

  // Category stats
  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const m of allMacros) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [allMacros]);

  // Group filtered macros by category
  const groupedMacros = useMemo(() => {
    const groups = {};
    for (const macro of filteredMacros) {
      const cat = macro.category || 'General';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(macro);
    }
    return groups;
  }, [filteredMacros]);

  // Toggle category expand/collapse
  const toggleCategory = useCallback((category) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Keyboard shortcuts: Ctrl+1 through Ctrl+9 to copy the first 9 macros
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const index = num - 1;
        if (index < filteredMacros.length) {
          e.preventDefault();
          const macro = filteredMacros[index];
          navigator.clipboard.writeText(macro.text);
          toast.info(`Makro "${macro.name}" kopiert (Ctrl+${num})`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredMacros]);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{allMacros.length}</div>
          <div className="text-sm text-gray-500">Totalt makroer</div>
        </div>
        {CATEGORIES.filter((c) => c.value).map((cat) => (
          <div key={cat.value} className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{categoryCounts[cat.value] || 0}</div>
            <div className="text-sm text-gray-500">{cat.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter + Create */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sok i makroer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Ny makro
          </button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      {filteredMacros.length > 0 && (
        <div className="bg-white rounded-lg shadow p-3 flex items-center gap-2 text-xs text-gray-500">
          <Keyboard className="w-4 h-4" />
          <span>Ctrl+1 til Ctrl+9 kopierer de forste 9 makroene raskt</span>
        </div>
      )}

      {/* Macro list grouped by category */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Laster makroer...
          </div>
        ) : filteredMacros.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchQuery || categoryFilter
                ? 'Ingen makroer matcher filteret.'
                : 'Ingen makroer opprettet enda.'}
            </p>
            {!searchQuery && !categoryFilter && (
              <button
                onClick={handleCreate}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Opprett din forste makro
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedMacros).map(([category, macros]) => {
            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
            const isCollapsed = collapsedCategories.has(category);
            const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category;

            // Calculate the global index offset for Ctrl+N shortcut display
            let globalIndexOffset = 0;
            const categoryOrder = Object.keys(groupedMacros);
            for (const cat of categoryOrder) {
              if (cat === category) {
                break;
              }
              globalIndexOffset += groupedMacros[cat].length;
            }

            return (
              <div
                key={category}
                className={`bg-white rounded-lg shadow overflow-hidden border ${colors.border}`}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${colors.header} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className={`w-4 h-4 ${colors.text}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${colors.text}`} />
                    )}
                    <h3 className={`font-semibold text-sm ${colors.text}`}>{categoryLabel}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
                    >
                      {macros.length}
                    </span>
                  </div>
                </button>

                {/* Macro Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {macros.map((macro, idx) => {
                      const globalIdx = globalIndexOffset + idx;
                      return (
                        <div
                          key={macro.id}
                          className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 text-sm">{macro.name}</h3>
                              {macro.soapSection && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                  {macro.soapSection}
                                </span>
                              )}
                              {macro.shortcutKey && (
                                <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded flex items-center gap-1">
                                  <Keyboard className="w-3 h-3" />
                                  {macro.shortcutKey}
                                </span>
                              )}
                              {globalIdx < 9 && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-xs rounded flex items-center gap-1">
                                  <Keyboard className="w-3 h-3" />
                                  Ctrl+{globalIdx + 1}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{macro.text}</p>
                            {macro.usageCount > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Brukt {macro.usageCount} ganger
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => favoriteMutation.mutate(macro.id)}
                              className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                                macro.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                              }`}
                              title="Favoritt"
                            >
                              <Star
                                className="w-4 h-4"
                                fill={macro.isFavorite ? 'currentColor' : 'none'}
                              />
                            </button>
                            <button
                              onClick={() => copyToClipboard(macro.text)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Kopier"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(macro)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Rediger"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(macro)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                              title="Slett"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <MacroModal
          macro={editingMacro}
          onSave={(data) => {
            if (editingMacro) {
              updateMutation.mutate({ id: editingMacro.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onClose={() => {
            setShowModal(false);
            setEditingMacro(null);
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Slett makro</h3>
            <p className="text-sm text-gray-600 mb-4">
              Er du sikker pa at du vil slette &quot;{deleteTarget.name}&quot;? Denne handlingen kan
              ikke angres.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {deleteMutation.isPending ? 'Sletter...' : 'Slett'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroModal({ macro, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({
    name: macro?.name || '',
    text: macro?.text || '',
    category: macro?.category || 'General',
    subcategory: macro?.subcategory || '',
    shortcutKey: macro?.shortcutKey || '',
    soapSection: macro?.soapSection || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.warning('Navn og tekst er obligatorisk');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">{macro ? 'Rediger makro' : 'Ny makro'}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="f.eks. Nakkesmerter - Subjektiv"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Makrotekst *</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={5}
              placeholder="Skriv inn makroteksten. Bruk {{patient.fullName}} for variabler."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Variabler: {'{{patient.fullName}}'}, {'{{today}}'}, {'{{provider.name}}'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SOAP-seksjon</label>
              <select
                value={form.soapSection}
                onChange={(e) => setForm({ ...form, soapSection: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {SOAP_SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Underkategori</label>
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                placeholder="Valgfritt"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hurtigtast</label>
              <input
                type="text"
                value={form.shortcutKey}
                onChange={(e) => setForm({ ...form, shortcutKey: e.target.value })}
                placeholder="f.eks. Ctrl+Shift+N"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {isSaving ? 'Lagrer...' : macro ? 'Oppdater' : 'Opprett'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
