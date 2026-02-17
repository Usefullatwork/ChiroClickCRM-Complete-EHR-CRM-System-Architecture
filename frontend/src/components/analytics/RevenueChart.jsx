/**
 * RevenueChart Component
 * Revenue over time visualization
 *
 * @module components/analytics/RevenueChart
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Format currency in Norwegian format
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return '0 kr';
  }
  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format large numbers (e.g., 1000 -> 1k)
 */
const formatShortNumber = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

/**
 * RevenueChart - Displays revenue trends over time
 *
 * @param {Array} data - Daily revenue data
 * @param {Object} stats - Revenue statistics
 * @param {string} chartType - 'area' or 'bar'
 * @param {boolean} loading - Loading state
 */
export const RevenueChart = ({ data = [], stats = {}, chartType = 'area', loading = false }) => {
  // Format data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      date: item.date
        ? new Date(item.date).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
        : item.label,
      Inntekt: item.revenue || 0,
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
              <span className="font-semibold text-gray-900">{formatCurrency(entry.value)}</span>
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

  const changePercent = stats.changePercent || 0;
  const isPositiveChange = changePercent >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inntekter</h3>
              <p className="text-sm text-gray-500">Siste 30 dager</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">Denne maned</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats.thisMonth?.totalRevenue || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Endring</p>
              <div
                className={`flex items-center gap-1 justify-end ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}
              >
                {isPositiveChange ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="text-lg font-bold">
                  {isPositiveChange ? '+' : ''}
                  {changePercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={formatShortNumber}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Inntekt" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={formatShortNumber}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Inntekt"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
              <p>Ingen inntektsdata tilgjengelig</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Totalt (denne mnd)</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(stats.thisMonth?.totalRevenue || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Pasientandel</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(stats.thisMonth?.patientRevenue || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Forsikring</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(stats.thisMonth?.insuranceRevenue || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Transaksjoner</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.thisMonth?.transactionCount || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * RevenueCompact - Compact revenue display for smaller spaces
 */
export const RevenueCompact = ({ totalRevenue = 0, changePercent = 0, loading = false }) => {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
        <div className="h-4 bg-gray-100 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
      <div
        className={`flex items-center gap-1 text-sm ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
      >
        {changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span className="font-medium">
          {changePercent >= 0 ? '+' : ''}
          {changePercent}%
        </span>
        <span className="text-gray-500">vs forrige mnd</span>
      </div>
    </div>
  );
};

export default RevenueChart;
