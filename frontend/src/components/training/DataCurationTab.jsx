/**
 * DataCurationTab — Curate AI feedback into training data
 *
 * Features:
 * - Stats bar: pending / approved / rejected / by type
 * - Filter row: type, rating range, status, date range
 * - Paginated table with expand, approve, edit & approve, reject
 * - Bulk selection with bulk action bar
 */

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  ChevronDown,
  ChevronRight,
  Database,
  Filter,
  BarChart3,
} from 'lucide-react';
import {
  useCurationFeedback,
  useCurationStats,
  useApproveFeedback,
  useRejectFeedback,
  useBulkCurationAction,
} from '../../hooks/useAITraining';

const SUGGESTION_TYPES = [
  { value: '', label: 'Alle typer' },
  { value: 'soap_subjective', label: 'Subjektiv' },
  { value: 'soap_objective', label: 'Objektiv' },
  { value: 'soap_assessment', label: 'Vurdering' },
  { value: 'soap_plan', label: 'Plan' },
  { value: 'diagnosis_code', label: 'Diagnose' },
  { value: 'red_flag', label: 'Red flag' },
  { value: 'spelling', label: 'Stavekontroll' },
  { value: 'communication', label: 'Kommunikasjon' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Ventende' },
  { value: 'approved', label: 'Godkjent' },
  { value: 'rejected', label: 'Avvist' },
  { value: 'exported', label: 'Eksportert' },
  { value: 'all', label: 'Alle' },
];

export default function DataCurationTab() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    minRating: '',
    status: 'pending',
    startDate: '',
    endDate: '',
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      ...(filters.type && { type: filters.type }),
      ...(filters.minRating && { minRating: filters.minRating }),
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    }),
    [page, filters]
  );

  const feedbackQuery = useCurationFeedback(queryParams);
  const statsQuery = useCurationStats();
  const approveMutation = useApproveFeedback();
  const rejectMutation = useRejectFeedback();
  const bulkMutation = useBulkCurationAction();

  const feedback = feedbackQuery.data?.data || [];
  const totalPages = feedbackQuery.data?.totalPages || 1;
  const stats = statsQuery.data;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === feedback.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(feedback.map((f) => f.id)));
    }
  };

  const handleApprove = (id) => {
    approveMutation.mutate({ id });
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleEditApprove = (id) => {
    approveMutation.mutate({ id, editedText: editText });
    setEditingId(null);
    setEditText('');
  };

  const handleReject = (id) => {
    rejectMutation.mutate(id);
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleBulk = (action) => {
    bulkMutation.mutate({ ids: [...selectedIds], action });
    setSelectedIds(new Set());
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.user_correction || item.original_suggestion);
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatBadge label="Ventende" value={stats.pending} color="yellow" />
          <StatBadge label="Godkjent" value={stats.approved} color="green" />
          <StatBadge label="Avvist" value={stats.rejected} color="red" />
          <StatBadge label="Eksportert" value={stats.exported} color="blue" />
          <StatBadge label="Totalt" value={stats.total} color="gray" />
        </div>
      )}

      {/* Type Distribution */}
      {stats?.byType?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Fordeling etter type
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.byType.map((t) => (
              <span key={t.suggestion_type} className="px-2 py-1 bg-gray-100 rounded text-xs">
                {t.suggestion_type}: {t.count} ({t.pending} ventende)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {SUGGESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Alle vurderinger</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-800 font-medium">{selectedIds.size} valgt</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulk('approve')}
              disabled={bulkMutation.isPending}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400"
            >
              Godkjenn alle
            </button>
            <button
              onClick={() => handleBulk('reject')}
              disabled={bulkMutation.isPending}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-400"
            >
              Avvis alle
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {feedbackQuery.isLoading ? (
          <div className="p-6 text-gray-500">Laster...</div>
        ) : feedback.length === 0 ? (
          <div className="p-6 text-gray-500 text-center">
            <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Ingen tilbakemeldinger funnet med valgte filtre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-3 px-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === feedback.length && feedback.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-3 text-left font-medium text-gray-600">Type</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-600">Original</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-600">Korreksjon</th>
                  <th className="py-3 px-3 text-right font-medium text-gray-600">Vurdering</th>
                  <th className="py-3 px-3 text-right font-medium text-gray-600">Konfidens</th>
                  <th className="py-3 px-3 text-left font-medium text-gray-600">Dato</th>
                  <th className="py-3 px-3 text-right font-medium text-gray-600">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item) => (
                  <FeedbackRow
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    expanded={expandedId === item.id}
                    editing={editingId === item.id}
                    editText={editText}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onApprove={() => handleApprove(item.id)}
                    onReject={() => handleReject(item.id)}
                    onStartEdit={() => startEdit(item)}
                    onEditChange={setEditText}
                    onEditApprove={() => handleEditApprove(item.id)}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditText('');
                    }}
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
          >
            Forrige
          </button>
          <span className="text-sm text-gray-600">
            Side {page} av {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
          >
            Neste
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackRow({
  item,
  selected,
  expanded,
  editing,
  editText,
  onToggleSelect,
  onToggleExpand,
  onApprove,
  onReject,
  onStartEdit,
  onEditChange,
  onEditApprove,
  onCancelEdit,
  isApproving,
  isRejecting,
}) {
  const truncate = (text, len = 60) =>
    text && text.length > len ? `${text.slice(0, len)}...` : text || '-';

  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="py-3 px-3">
          <input type="checkbox" checked={selected} onChange={onToggleSelect} className="rounded" />
        </td>
        <td className="py-3 px-3">
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{item.suggestion_type}</span>
        </td>
        <td className="py-3 px-3 max-w-xs">
          <button onClick={onToggleExpand} className="flex items-center gap-1 text-left">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="text-sm">{truncate(item.original_suggestion)}</span>
          </button>
        </td>
        <td className="py-3 px-3 max-w-xs text-sm">{truncate(item.user_correction)}</td>
        <td className="py-3 px-3 text-right text-sm">
          {item.user_rating ? `${item.user_rating}/5` : '-'}
        </td>
        <td className="py-3 px-3 text-right text-sm">
          {item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}%` : '-'}
        </td>
        <td className="py-3 px-3 text-sm text-gray-600">
          {new Date(item.created_at).toLocaleDateString('nb-NO', {
            month: 'short',
            day: 'numeric',
          })}
        </td>
        <td className="py-3 px-3 text-right">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={onApprove}
              disabled={isApproving}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
              title="Godkjenn"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              onClick={onStartEdit}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              title="Rediger og godkjenn"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onReject}
              disabled={isRejecting}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
              title="Avvis"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Row */}
      {expanded && (
        <tr className="bg-gray-50 border-b">
          <td colSpan={8} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Original forslag</p>
                <div className="p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                  {item.original_suggestion}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Brukerens korreksjon</p>
                <div className="p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                  {item.user_correction || <span className="text-gray-400">Ingen korreksjon</span>}
                </div>
              </div>
            </div>
            {item.feedback_notes && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Notater</p>
                <p className="text-sm">{item.feedback_notes}</p>
              </div>
            )}
            {item.model_name && (
              <p className="mt-2 text-xs text-gray-500">Modell: {item.model_name}</p>
            )}
          </td>
        </tr>
      )}

      {/* Edit Row */}
      {editing && (
        <tr className="bg-blue-50 border-b">
          <td colSpan={8} className="p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Rediger tekst for treningsdata:
            </p>
            <textarea
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={onEditApprove}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Godkjenn med endring
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Avbryt
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatBadge({ label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
  };
  return (
    <div className={`border rounded-lg p-3 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value || 0}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
