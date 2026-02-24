/**
 * DashboardAnalytics
 *
 * Advanced dashboard charts: revenue trend, utilization heatmap,
 * no-show rate, patient flow. Uses Recharts for visualization.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
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
import { TrendingUp, Grid3X3, UserX, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { dashboardAPI } from '../../services/api';

const PERIOD_OPTIONS = [
  { value: '30', label: '30 dager' },
  { value: '90', label: '90 dager' },
  { value: '365', label: '1 ar' },
];

const DAY_LABELS = ['Son', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 - 18:00

export default function DashboardAnalytics() {
  const [revenuePeriod, setRevenuePeriod] = useState('30');
  const [noShowPeriod, setNoShowPeriod] = useState('90');
  const [patientFlowPeriod, setPatientFlowPeriod] = useState('90');
  const [utilizationPeriod, setUtilizationPeriod] = useState('30');
  const [expandedSection, setExpandedSection] = useState('revenue');

  // Data queries
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue', revenuePeriod],
    queryFn: () =>
      dashboardAPI.getRevenueTrend({
        period: revenuePeriod,
        groupBy: revenuePeriod === '365' ? 'month' : revenuePeriod === '90' ? 'week' : 'day',
      }),
  });

  const { data: utilizationData, isLoading: utilizationLoading } = useQuery({
    queryKey: ['dashboard-utilization', utilizationPeriod],
    queryFn: () => dashboardAPI.getUtilization({ period: utilizationPeriod }),
  });

  const { data: noShowData, isLoading: noShowLoading } = useQuery({
    queryKey: ['dashboard-noshow', noShowPeriod],
    queryFn: () =>
      dashboardAPI.getNoShowTrend({
        period: noShowPeriod,
        groupBy: noShowPeriod === '365' ? 'month' : 'week',
      }),
  });

  const { data: patientFlowData, isLoading: patientFlowLoading } = useQuery({
    queryKey: ['dashboard-patient-flow', patientFlowPeriod],
    queryFn: () =>
      dashboardAPI.getPatientFlow({
        period: patientFlowPeriod,
        groupBy: patientFlowPeriod === '365' ? 'month' : 'week',
      }),
  });

  const revenue = revenueData?.data || [];
  const utilization = utilizationData?.data || [];
  const noShow = noShowData?.data || [];
  const patientFlow = patientFlowData?.data || [];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      {/* Revenue Trend */}
      <AnalyticsPanel
        title="Inntektstrend"
        icon={TrendingUp}
        iconColor="text-green-600"
        bgColor="bg-green-50"
        expanded={expandedSection === 'revenue'}
        onToggle={() => toggleSection('revenue')}
        period={revenuePeriod}
        onPeriodChange={setRevenuePeriod}
      >
        {revenueLoading ? (
          <ChartSkeleton />
        ) : revenue.length === 0 ? (
          <EmptyChart message="Ingen inntektsdata i perioden" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => {
                  if (v.includes('-W') || v.length === 7) {
                    return v;
                  }
                  return v.slice(5); // MM-DD
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString('no-NO')} kr`, 'Inntekt']}
                labelStyle={{ color: '#475569' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="amount" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Inntekt" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </AnalyticsPanel>

      {/* Utilization Heatmap */}
      <AnalyticsPanel
        title="Kapasitetsutnyttelse"
        icon={Grid3X3}
        iconColor="text-blue-600"
        bgColor="bg-blue-50"
        expanded={expandedSection === 'utilization'}
        onToggle={() => toggleSection('utilization')}
        period={utilizationPeriod}
        onPeriodChange={setUtilizationPeriod}
      >
        {utilizationLoading ? (
          <ChartSkeleton />
        ) : utilization.length === 0 ? (
          <EmptyChart message="Ingen timebokdata i perioden" />
        ) : (
          <UtilizationHeatmap data={utilization} />
        )}
      </AnalyticsPanel>

      {/* No-Show Trend */}
      <AnalyticsPanel
        title="Uteblivelsestrend"
        icon={UserX}
        iconColor="text-red-600"
        bgColor="bg-red-50"
        expanded={expandedSection === 'noshow'}
        onToggle={() => toggleSection('noshow')}
        period={noShowPeriod}
        onPeriodChange={setNoShowPeriod}
      >
        {noShowLoading ? (
          <ChartSkeleton />
        ) : noShow.length === 0 ? (
          <EmptyChart message="Ingen uteblivelsesdata i perioden" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={noShow} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'rate') {
                    return [`${value}%`, 'Uteblivelsesrate'];
                  }
                  if (name === 'noShows') {
                    return [value, 'Uteblivelser'];
                  }
                  return [value, name];
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend
                formatter={(value) => {
                  if (value === 'rate') {
                    return 'Rate (%)';
                  }
                  if (value === 'noShows') {
                    return 'Antall';
                  }
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="noShows"
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </AnalyticsPanel>

      {/* Patient Flow */}
      <AnalyticsPanel
        title="Pasientflyt"
        icon={Users}
        iconColor="text-purple-600"
        bgColor="bg-purple-50"
        expanded={expandedSection === 'flow'}
        onToggle={() => toggleSection('flow')}
        period={patientFlowPeriod}
        onPeriodChange={setPatientFlowPeriod}
      >
        {patientFlowLoading ? (
          <ChartSkeleton />
        ) : patientFlow.length === 0 ? (
          <EmptyChart message="Ingen pasientflytdata i perioden" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={patientFlow} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'newPatients') {
                    return [value, 'Nye pasienter'];
                  }
                  if (name === 'returningPatients') {
                    return [value, 'Gjenbesokende'];
                  }
                  if (name === 'totalVisits') {
                    return [value, 'Totale besok'];
                  }
                  return [value, name];
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend
                formatter={(value) => {
                  if (value === 'newPatients') {
                    return 'Nye';
                  }
                  if (value === 'returningPatients') {
                    return 'Gjenbesokende';
                  }
                  return value;
                }}
              />
              <Area
                type="monotone"
                dataKey="returningPatients"
                stackId="1"
                stroke="#8b5cf6"
                fill="#c4b5fd"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="newPatients"
                stackId="1"
                stroke="#14b8a6"
                fill="#99f6e4"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </AnalyticsPanel>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function AnalyticsPanel({
  title,
  icon: Icon,
  iconColor,
  bgColor,
  expanded,
  onToggle,
  period,
  onPeriodChange,
  children,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm">
      <button
        onClick={onToggle}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <select
              value={period}
              onChange={(e) => {
                e.stopPropagation();
                onPeriodChange(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4">{children}</div>
      )}
    </div>
  );
}

function UtilizationHeatmap({ data }) {
  // Build a lookup: {dayOfWeek-hour} => utilization
  const lookup = {};
  let maxCount = 0;
  for (const item of data) {
    const key = `${item.dayOfWeek}-${item.hour}`;
    lookup[key] = item;
    if (item.count > maxCount) {
      maxCount = item.count;
    }
  }

  const getColor = (count) => {
    if (!count || count === 0) {
      return 'bg-gray-100 dark:bg-gray-700';
    }
    const intensity = Math.min(count / Math.max(maxCount, 1), 1);
    if (intensity < 0.25) {
      return 'bg-teal-100';
    }
    if (intensity < 0.5) {
      return 'bg-teal-200';
    }
    if (intensity < 0.75) {
      return 'bg-teal-400';
    }
    return 'bg-teal-600';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Header row */}
        <div className="flex items-center gap-1 mb-1">
          <div className="w-10 text-xs text-gray-400 flex-shrink-0" />
          {HOURS.map((hour) => (
            <div key={hour} className="flex-1 text-center text-[10px] text-gray-400 font-mono">
              {String(hour).padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Day rows (Mon-Fri, skip Sun=0 and Sat=6) */}
        {[1, 2, 3, 4, 5].map((dow) => (
          <div key={dow} className="flex items-center gap-1 mb-1">
            <div className="w-10 text-xs text-gray-500 flex-shrink-0">{DAY_LABELS[dow]}</div>
            {HOURS.map((hour) => {
              const item = lookup[`${dow}-${hour}`];
              const count = item?.count || 0;
              return (
                <div
                  key={hour}
                  className={`flex-1 h-8 rounded ${getColor(count)} transition-colors cursor-default`}
                  title={`${DAY_LABELS[dow]} kl ${hour}:00 — ${count} timer`}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end text-[10px] text-gray-400">
          <span>Lav</span>
          <div className="w-4 h-4 rounded bg-gray-100" />
          <div className="w-4 h-4 rounded bg-teal-100" />
          <div className="w-4 h-4 rounded bg-teal-200" />
          <div className="w-4 h-4 rounded bg-teal-400" />
          <div className="w-4 h-4 rounded bg-teal-600" />
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex items-end gap-2 h-[200px]">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded mx-auto" />
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
      {message}
    </div>
  );
}
