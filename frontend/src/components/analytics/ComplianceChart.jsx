/**
 * ComplianceChart Component
 * Patient exercise compliance visualization
 *
 * @module components/analytics/ComplianceChart
 */

import _React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  _AreaChart,
  _Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CheckCircle2, Activity, Clock, _XCircle, PauseCircle, TrendingUp } from 'lucide-react';

/**
 * Status colors for pie chart
 */
const STATUS_COLORS = {
  completed: '#10b981', // green
  active: '#3b82f6', // blue
  paused: '#f59e0b', // amber
  cancelled: '#ef4444', // red
};

/**
 * ComplianceChart - Displays patient exercise compliance rates
 *
 * @param {Object} data - Compliance statistics
 * @param {boolean} loading - Loading state
 */
export const ComplianceChart = ({ data = {}, loading = false }) => {
  // Format pie chart data
  const pieData = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      { name: 'Fullfort', value: data.completed || 0, color: STATUS_COLORS.completed },
      { name: 'Aktiv', value: data.active || 0, color: STATUS_COLORS.active },
      { name: 'Pauset', value: data.paused || 0, color: STATUS_COLORS.paused },
      { name: 'Kansellert', value: data.cancelled || 0, color: STATUS_COLORS.cancelled },
    ].filter((item) => item.value > 0);
  }, [data]);

  // Format trend data
  const trendData = useMemo(() => {
    if (!data.weeklyTrend || data.weeklyTrend.length === 0) {
      return [];
    }

    return data.weeklyTrend.map((item) => ({
      week: item.week
        ? new Date(item.week).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
        : item.label,
      'Etterlevelse (%)': item.avgRate || 0,
      Totalt: item.total || 0,
    }));
  }, [data.weeklyTrend]);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.payload.color }} />
            <span className="text-sm text-gray-700">{item.name}:</span>
            <span className="text-sm font-bold text-gray-900">{item.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const LineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">
                {entry.name.includes('%') ? `${entry.value}%` : entry.value}
              </span>
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

  const completionRate = data.completionRate || 0;
  const avgProgressRate = data.avgProgressRate || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pasientetterlevelse</h3>
              <p className="text-sm text-gray-500">Ovelsesprogrammer siste 90 dager</p>
            </div>
          </div>

          {/* Main compliance rate */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Etterlevelsesrate</p>
            <p
              className={`text-2xl font-bold ${
                completionRate >= 70
                  ? 'text-green-600'
                  : completionRate >= 50
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            >
              {completionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart - Status distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Statusfordeling</h4>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                <p>Ingen data</p>
              </div>
            )}
          </div>

          {/* Line chart - Weekly trend */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Ukentlig trend</h4>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Etterlevelse (%)"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                <p>Ingen trenddata</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Activity size={14} />
              <span className="text-xs">Totalt</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{data.totalPrescriptions || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <CheckCircle2 size={14} />
              <span className="text-xs">Fullfort</span>
            </div>
            <p className="text-lg font-bold text-green-600">{data.completed || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Clock size={14} />
              <span className="text-xs">Aktive</span>
            </div>
            <p className="text-lg font-bold text-blue-600">{data.active || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <PauseCircle size={14} />
              <span className="text-xs">Pauset</span>
            </div>
            <p className="text-lg font-bold text-amber-600">{data.paused || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs">Gj.snitt progresjon</span>
            </div>
            <p className="text-lg font-bold text-teal-600">{avgProgressRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ComplianceGauge - Simple gauge display for compliance rate
 */
export const ComplianceGauge = ({ rate = 0, label = 'Etterlevelse', loading = false }) => {
  const getColor = () => {
    if (rate >= 70) {
      return '#10b981';
    }
    if (rate >= 50) {
      return '#f59e0b';
    }
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="space-y-1">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Circular gauge */}
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={getColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(rate / 100) * 175.93} 175.93`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color: getColor() }}>
            {rate}%
          </span>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">
          {rate >= 70 ? 'Utmerket' : rate >= 50 ? 'Middels' : 'Lav'}
        </p>
      </div>
    </div>
  );
};

export default ComplianceChart;
