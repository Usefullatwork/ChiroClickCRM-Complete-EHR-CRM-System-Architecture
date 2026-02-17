/**
 * PatientMetrics Component
 * Patient volume charts and statistics
 *
 * @module components/analytics/PatientMetrics
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react';

/**
 * PatientMetrics - Displays patient volume trends and statistics
 *
 * @param {Array} data - Patient volume trend data
 * @param {Object} stats - Patient statistics
 * @param {boolean} loading - Loading state
 */
export const PatientMetrics = ({ data = [], stats = {}, loading = false }) => {
  // Format data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      month: item.month
        ? new Date(item.month).toLocaleDateString('no-NO', { month: 'short', year: '2-digit' })
        : item.label,
      Besok: item.totalVisits || item.visits || 0,
      'Unike pasienter': item.uniquePatients || item.patients || 0,
    }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">{entry.value}</span>
            </div>
          ))}
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
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pasientvolum</h3>
              <p className="text-sm text-gray-500">Siste 12 maneder</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">Totalt aktive</p>
              <p className="text-lg font-bold text-gray-900">{stats.activePatients || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Nye denne mnd</p>
              <p className="text-lg font-bold text-green-600">+{stats.newPatientsThisMonth || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '14px' }}
              />
              <Area
                type="monotone"
                dataKey="Besok"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVisits)"
              />
              <Area
                type="monotone"
                dataKey="Unike pasienter"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPatients)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Activity size={48} className="mx-auto mb-2 opacity-50" />
              <p>Ingen data tilgjengelig</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Users size={14} />
              <span className="text-xs">Totalt</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.totalPatients || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <UserPlus size={14} />
              <span className="text-xs">Nye (denne mnd)</span>
            </div>
            <p className="text-xl font-bold text-green-600">{stats.newPatientsThisMonth || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Activity size={14} />
              <span className="text-xs">Aktive (90 dager)</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{stats.activePatients || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs">Endring</span>
            </div>
            <p
              className={`text-xl font-bold ${(stats.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {(stats.changePercent || 0) >= 0 ? '+' : ''}
              {stats.changePercent || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PatientMetricsCompact - Compact version for smaller spaces
 */
export const PatientMetricsCompact = ({ data = [], loading = false }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return data.slice(-6).map((item) => ({
      name: item.month
        ? new Date(item.month).toLocaleDateString('no-NO', { month: 'short' })
        : item.label,
      value: item.totalVisits || item.visits || 0,
    }));
  }, [data]);

  if (loading) {
    return <div className="h-32 bg-gray-100 rounded animate-pulse"></div>;
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [value, 'Besok']}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PatientMetrics;
