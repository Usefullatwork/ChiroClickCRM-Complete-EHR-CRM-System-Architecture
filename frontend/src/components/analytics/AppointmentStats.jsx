/**
 * AppointmentStats Component
 * Appointment analytics and statistics visualization
 *
 * @module components/analytics/AppointmentStats
 */

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserX,
  TrendingUp
} from 'lucide-react';

/**
 * Status colors for appointment states
 */
const STATUS_COLORS = {
  CONFIRMED: '#10b981', // green
  COMPLETED: '#3b82f6', // blue
  PENDING: '#f59e0b',   // amber
  CANCELLED: '#ef4444', // red
  NO_SHOW: '#6b7280'    // gray
};

/**
 * Status labels in Norwegian
 */
const STATUS_LABELS = {
  CONFIRMED: 'Bekreftet',
  COMPLETED: 'Fullfort',
  PENDING: 'Venter',
  CANCELLED: 'Avlyst',
  NO_SHOW: 'Ikke mott'
};

/**
 * AppointmentStats - Displays appointment statistics and analytics
 *
 * @param {Object} data - Appointment statistics data
 * @param {boolean} loading - Loading state
 */
export const AppointmentStats = ({
  data = {},
  loading = false
}) => {
  // Prepare data for status pie chart
  const statusPieData = useMemo(() => {
    const today = data.today || {};
    const thisWeek = data.thisWeek || {};

    return [
      { name: 'Fullfort', value: thisWeek.completed || 0, color: STATUS_COLORS.COMPLETED },
      { name: 'Bekreftet', value: today.confirmed || 0, color: STATUS_COLORS.CONFIRMED },
      { name: 'Venter', value: today.pending || 0, color: STATUS_COLORS.PENDING },
      { name: 'Avlyst', value: thisWeek.cancelled || 0, color: STATUS_COLORS.CANCELLED },
      { name: 'Ikke mott', value: thisWeek.noShow || 0, color: STATUS_COLORS.NO_SHOW }
    ].filter(item => item.value > 0);
  }, [data]);

  // Calculate completion rate
  const completionRate = useMemo(() => {
    const thisWeek = data.thisWeek || {};
    const total = thisWeek.total || 0;
    const completed = thisWeek.completed || 0;

    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [data]);

  // Calculate no-show rate
  const noShowRate = useMemo(() => {
    const thisWeek = data.thisWeek || {};
    const total = thisWeek.total || 0;
    const noShow = thisWeek.noShow || 0;

    if (total === 0) return 0;
    return Math.round((noShow / total) * 100);
  }, [data]);

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm font-medium text-gray-900">{data.name}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{data.value} avtaler</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-gray-100 rounded"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
          </div>
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
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Calendar size={20} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Avtalestatistikk</h3>
              <p className="text-sm text-gray-500">Denne uken</p>
            </div>
          </div>

          {/* Completion rate badge */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              completionRate >= 80
                ? 'bg-green-100 text-green-700'
                : completionRate >= 60
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {completionRate}% fullforingsrate
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex flex-col items-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Ingen avtaler denne uken</p>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusPieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
            {/* Today's appointments */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">I dag</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.today?.total || 0}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <span className="text-green-600">{data.today?.completed || 0} fullfort</span>
                  <br />
                  <span className="text-yellow-600">{data.today?.pending || 0} venter</span>
                </div>
              </div>
            </div>

            {/* Week completed */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Fullfort denne uken</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.thisWeek?.completed || 0}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  av {data.thisWeek?.total || 0} totalt
                </div>
              </div>
            </div>

            {/* Month completed */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Fullfort denne mnd</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.completedThisMonth || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation & No-show rates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-xs text-red-700">Avlyst</span>
                </div>
                <p className="text-lg font-bold text-red-700">
                  {data.thisWeek?.cancelled || 0}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserX size={14} className="text-orange-500" />
                  <span className="text-xs text-orange-700">Ikke mott</span>
                </div>
                <p className="text-lg font-bold text-orange-700">
                  {data.thisWeek?.noShow || 0}
                  {noShowRate > 0 && (
                    <span className="text-sm font-normal ml-1">({noShowRate}%)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming appointments today */}
      {data.upcomingToday && data.upcomingToday.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Kommende avtaler i dag ({data.upcomingToday.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.upcomingToday.slice(0, 5).map((apt, index) => (
              <div
                key={apt.id || index}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(apt.startTime).toLocaleTimeString('no-NO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {apt.patientName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {apt.appointmentType || 'Konsultasjon'} ({apt.durationMinutes || 30} min)
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  apt.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {STATUS_LABELS[apt.status] || apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AppointmentStatsCompact - Compact version for sidebars
 */
export const AppointmentStatsCompact = ({ data = {}, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-gray-100 rounded"></div>
        <div className="h-10 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">I dag</span>
        <span className="text-lg font-bold text-gray-900">
          {data.today?.total || 0}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Denne uken</span>
        <span className="text-lg font-bold text-gray-900">
          {data.thisWeek?.total || 0}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Denne mnd</span>
        <span className="text-lg font-bold text-gray-900">
          {data.completedThisMonth || 0}
        </span>
      </div>
    </div>
  );
};

export default AppointmentStats;
