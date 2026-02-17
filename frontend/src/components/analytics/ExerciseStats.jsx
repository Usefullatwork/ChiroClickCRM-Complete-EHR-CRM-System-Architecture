/**
 * ExerciseStats Component
 * Most prescribed exercises visualization
 *
 * @module components/analytics/ExerciseStats
 */

import _React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Dumbbell, Users, TrendingUp, Activity } from 'lucide-react';

/**
 * Color palette for bars
 */
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
];

/**
 * ExerciseStats - Displays most prescribed exercises
 *
 * @param {Array} data - Top exercises data
 * @param {boolean} loading - Loading state
 * @param {number} limit - Number of exercises to show
 */
export const ExerciseStats = ({ data = [], loading = false, limit = 10 }) => {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'list'

  // Format data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.slice(0, limit).map((item, index) => ({
      name: item.nameNo || item.nameEn || item.name || `Ovelse ${index + 1}`,
      shortName:
        (item.nameNo || item.nameEn || item.name || '').substring(0, 20) +
        ((item.nameNo || item.nameEn || item.name || '').length > 20 ? '...' : ''),
      foreskrivninger: item.prescriptionCount || 0,
      pasienter: item.patientCount || 0,
      category: item.category || 'Annet',
      bodyRegion: item.bodyRegion || 'Ukjent',
      color: COLORS[index % COLORS.length],
    }));
  }, [data, limit]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!data || data.length === 0) {
      return { prescriptions: 0, patients: 0 };
    }

    return data.reduce(
      (acc, item) => ({
        prescriptions: acc.prescriptions + (item.prescriptionCount || 0),
        patients: acc.patients + (item.patientCount || 0),
      }),
      { prescriptions: 0, patients: 0 }
    );
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200 max-w-xs">
          <p className="text-sm font-semibold text-gray-900 mb-2">{item.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Foreskrivninger:</span>
              <span className="font-semibold text-gray-900">{item.foreskrivninger}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Pasienter:</span>
              <span className="font-semibold text-gray-900">{item.pasienter}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Kategori:</span>
              <span className="font-medium text-gray-700">{item.category}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Kroppsregion:</span>
              <span className="font-medium text-gray-700">{item.bodyRegion}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Dumbbell size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mest foreskrevne ovelser</h3>
              <p className="text-sm text-gray-500">Topp {limit} siste 90 dager</p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'chart'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Graf
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {chartData.length > 0 ? (
          viewMode === 'chart' ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={140}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="foreskrivninger" name="Foreskrivninger" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-2 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.category} - {item.bodyRegion}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{item.foreskrivninger}</p>
                      <p className="text-xs text-gray-500">foreskrivninger</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{item.pasienter}</p>
                      <p className="text-xs text-gray-500">pasienter</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Dumbbell size={48} className="mx-auto mb-2 opacity-50" />
              <p>Ingen ovelsesdata tilgjengelig</p>
              <p className="text-sm mt-1">Foreskrivninger vil vises her</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {chartData.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Activity size={14} />
                <span className="text-xs">Unike ovelser</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{chartData.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <TrendingUp size={14} />
                <span className="text-xs">Totalt foreskrivninger</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{totals.prescriptions}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Users size={14} />
                <span className="text-xs">Pasienter</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{totals.patients}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ExerciseStatsCompact - Compact version showing top 5
 */
export const ExerciseStatsCompact = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-2">
            <div className="w-2 h-6 bg-gray-200 rounded"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: COLORS[index] }} />
          <span className="flex-1 text-sm text-gray-700 truncate">
            {item.nameNo || item.nameEn || item.name}
          </span>
          <span className="text-sm font-medium text-gray-900">{item.prescriptionCount}</span>
        </div>
      ))}
    </div>
  );
};

export default ExerciseStats;
