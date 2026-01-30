/**
 * ComplianceOverview Component
 * Patient exercise compliance rates visualization
 *
 * @module components/analytics/ComplianceOverview
 */

import React, { useMemo } from 'react';
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
  Legend,
  Cell
} from 'recharts';
import {
  Activity,
  CheckCircle,
  PauseCircle,
  XCircle,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';

/**
 * Status colors for compliance states
 */
const STATUS_COLORS = {
  completed: '#10b981', // green
  active: '#3b82f6',    // blue
  paused: '#f59e0b',    // amber
  cancelled: '#ef4444'  // red
};

/**
 * ComplianceOverview - Displays exercise compliance statistics
 *
 * @param {Object} data - Compliance data from API
 * @param {boolean} loading - Loading state
 */
export const ComplianceOverview = ({
  data = {},
  loading = false
}) => {
  // Prepare status distribution data for chart
  const statusDistribution = useMemo(() => {
    return [
      { name: 'Fullfort', value: data.completed || 0, color: STATUS_COLORS.completed },
      { name: 'Aktiv', value: data.active || 0, color: STATUS_COLORS.active },
      { name: 'Pause', value: data.paused || 0, color: STATUS_COLORS.paused },
      { name: 'Avbrutt', value: data.cancelled || 0, color: STATUS_COLORS.cancelled }
    ].filter(item => item.value > 0);
  }, [data]);

  // Format weekly trend data
  const weeklyTrendData = useMemo(() => {
    if (!data.weeklyTrend || data.weeklyTrend.length === 0) return [];

    return data.weeklyTrend.map(item => ({
      week: item.week
        ? new Date(item.week).toLocaleDateString('no-NO', {
            day: 'numeric',
            month: 'short'
          })
        : item.label,
      'Etterlevelse': item.avgRate || 0,
      'Totalt': item.total || 0,
      'Fullfort': item.completed || 0
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
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">
                {entry.name === 'Etterlevelse' ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Determine compliance level and color
  const getComplianceLevel = (rate) => {
    if (rate >= 80) return { label: 'Utmerket', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (rate >= 60) return { label: 'God', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (rate >= 40) return { label: 'Moderat', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Lav', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const completionRate = data.completionRate || 0;
  const avgProgressRate = data.avgProgressRate || 0;
  const complianceLevel = getComplianceLevel(avgProgressRate);

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
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Target size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pasientetterlevelse</h3>
              <p className="text-sm text-gray-500">Ovelsesforeskrivninger (90 dager)</p>
            </div>
          </div>

          {/* Compliance badge */}
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${complianceLevel.bgColor} ${complianceLevel.color}`}>
            <div className="flex items-center gap-1">
              <Award size={14} />
              {complianceLevel.label}
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Fullforingsrate</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-700">{completionRate}%</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {data.completed || 0} av {data.totalPrescriptions || 0} foreskrivninger
            </p>
          </div>

          {/* Average Progress */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Gj.snitt fremgang</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-700">{avgProgressRate}%</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Gjennomsnittlig okt/fullforte
            </p>
          </div>

          {/* Active Prescriptions */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Aktive pagaende</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-purple-700">{data.active || 0}</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {data.paused || 0} pa pause
            </p>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Ukentlig etterlevelse (12 uker)</h4>
          {weeklyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Etterlevelse"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompliance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Activity size={48} className="mx-auto mb-2 opacity-50" />
                <p>Ingen trenddata tilgjengelig</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Statusfordeling</h4>
          <span className="text-sm text-gray-500">
            Totalt: {data.totalPrescriptions || 0}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-3">
          {/* Completed */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-xs text-gray-600">Fullfort</span>
            </div>
            <p className="text-lg font-bold text-green-600">{data.completed || 0}</p>
          </div>

          {/* Active */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity size={14} className="text-blue-500" />
              <span className="text-xs text-gray-600">Aktiv</span>
            </div>
            <p className="text-lg font-bold text-blue-600">{data.active || 0}</p>
          </div>

          {/* Paused */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PauseCircle size={14} className="text-yellow-500" />
              <span className="text-xs text-gray-600">Pause</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">{data.paused || 0}</p>
          </div>

          {/* Cancelled */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle size={14} className="text-red-500" />
              <span className="text-xs text-gray-600">Avbrutt</span>
            </div>
            <p className="text-lg font-bold text-red-600">{data.cancelled || 0}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
            {statusDistribution.map((item, index) => {
              const total = data.totalPrescriptions || 1;
              const percentage = (item.value / total) * 100;
              return (
                <div
                  key={index}
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color
                  }}
                  title={`${item.name}: ${item.value} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ComplianceGauge - Simple gauge for compliance rate
 */
export const ComplianceGauge = ({ rate = 0, size = 'md', loading = false }) => {
  const sizes = {
    sm: { container: 'w-16 h-16', text: 'text-lg' },
    md: { container: 'w-24 h-24', text: 'text-2xl' },
    lg: { container: 'w-32 h-32', text: 'text-3xl' }
  };

  const sizeConfig = sizes[size] || sizes.md;

  if (loading) {
    return (
      <div className={`${sizeConfig.container} rounded-full bg-gray-100 animate-pulse`}></div>
    );
  }

  // Calculate stroke dash for progress circle
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  const color = rate >= 80 ? '#10b981' : rate >= 60 ? '#3b82f6' : rate >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className={`${sizeConfig.container} relative`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${sizeConfig.text} font-bold text-gray-900`}>
          {rate}%
        </span>
      </div>
    </div>
  );
};

export default ComplianceOverview;
