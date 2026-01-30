/**
 * Analytics Page
 * Comprehensive analytics and reporting dashboard for the clinic
 *
 * Analyse og rapporteringsdashbord for klinikken
 *
 * @module pages/Analytics
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  Activity,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Target,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

// Analytics components
import { StatCard, StatCardGrid } from '../components/analytics/StatCard';
import { PatientMetrics } from '../components/analytics/PatientMetrics';
import { AppointmentStats } from '../components/analytics/AppointmentStats';
import { ExerciseStats } from '../components/analytics/ExerciseStats';
import { RevenueChart } from '../components/analytics/RevenueChart';
import { ComplianceOverview } from '../components/analytics/ComplianceOverview';

/**
 * Format Norwegian date range label
 */
const DATE_RANGE_LABELS = {
  week: 'Denne uken',
  month: 'Denne maneden',
  quarter: 'Dette kvartalet',
  year: 'I ar',
  custom: 'Egendefinert'
};

/**
 * Analytics Component
 * Main analytics dashboard with all metrics and charts
 *
 * @returns {JSX.Element} Analytics dashboard page
 */
export default function Analytics() {
  // State for date range filter
  const [dateRange, setDateRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth()
    };
  });

  // Calculate date range for API
  const dateParams = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        startDate = weekStart.toISOString();
        endDate = now.toISOString();
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
        endDate = now.toISOString();
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = now.toISOString();
        break;
      case 'month':
      default:
        startDate = new Date(selectedMonth.year, selectedMonth.month, 1).toISOString();
        endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0).toISOString();
        break;
    }

    return { startDate, endDate };
  }, [dateRange, selectedMonth]);

  // Fetch comprehensive dashboard analytics
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['analytics-dashboard', dateParams],
    queryFn: () => analyticsAPI.getDashboard(dateParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Extract data from response
  const analytics = dashboardData?.data || {};
  const {
    patients = {},
    appointments = {},
    revenue = {},
    exercises = {},
    trends = {}
  } = analytics;

  // Handle month navigation
  const handleMonthChange = (direction) => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;

      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }

      return { year: newYear, month: newMonth };
    });
  };

  // Format current date range for display
  const formatDateRange = () => {
    if (dateRange === 'month') {
      return new Date(selectedMonth.year, selectedMonth.month).toLocaleDateString('no-NO', {
        month: 'long',
        year: 'numeric'
      });
    }
    return DATE_RANGE_LABELS[dateRange];
  };

  // Handle CSV export
  const handleExport = async (type) => {
    try {
      const response = await analyticsAPI.exportCSV(type, dateParams);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyse-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Kunne ikke eksportere data. Vennligst prov igjen.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analyse</h1>
          <p className="text-sm text-gray-500 mt-1">
            Oversikt over klinikkens nokeltall og trender
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Eksporter
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('patients')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Users size={14} /> Pasienter
              </button>
              <button
                onClick={() => handleExport('appointments')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar size={14} /> Avtaler
              </button>
              <button
                onClick={() => handleExport('exercises')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Dumbbell size={14} /> Ovelser
              </button>
              <button
                onClick={() => handleExport('revenue')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <DollarSign size={14} /> Inntekter
              </button>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Oppdater
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Periode:</span>
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'quarter', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {DATE_RANGE_LABELS[range]}
                </button>
              ))}
            </div>
          </div>

          {/* Month Navigator (only shown when month is selected) */}
          {dateRange === 'month' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-900 min-w-[160px] text-center capitalize">
                {formatDateRange()}
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">
            Kunne ikke laste analysedata. Vennligst prov igjen.
          </p>
        </div>
      )}

      {/* Key Metrics Cards */}
      <StatCardGrid columns={4} className="mb-6">
        <StatCard
          title="Totalt pasienter"
          value={patients.totalPatients || 0}
          changePercent={patients.changePercent}
          changeLabel="vs forrige mnd"
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
          loading={isLoading}
        />
        <StatCard
          title="Nye pasienter"
          value={patients.newPatientsThisMonth || 0}
          subtitle={`${patients.newPatientsLastMonth || 0} forrige mnd`}
          icon={UserPlus}
          iconColor="bg-green-100 text-green-600"
          loading={isLoading}
        />
        <StatCard
          title="Fullforte avtaler"
          value={appointments.completedThisMonth || 0}
          subtitle={`${appointments.today?.total || 0} i dag`}
          icon={Calendar}
          iconColor="bg-teal-100 text-teal-600"
          loading={isLoading}
        />
        <StatCard
          title="Etterlevelse"
          value={exercises.compliance?.avgProgressRate || 0}
          subtitle="Gjennomsnittlig ovelsesetterlevelse"
          icon={Target}
          iconColor="bg-indigo-100 text-indigo-600"
          loading={isLoading}
        />
      </StatCardGrid>

      {/* Charts Row 1: Patient Metrics & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PatientMetrics
          data={trends.patientVolume || []}
          stats={patients}
          loading={isLoading}
        />
        <RevenueChart
          data={revenue.dailyRevenue || []}
          stats={revenue}
          loading={isLoading}
        />
      </div>

      {/* Charts Row 2: Appointments & Exercise Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AppointmentStats
          data={appointments}
          loading={isLoading}
        />
        <ComplianceOverview
          data={exercises.compliance || {}}
          loading={isLoading}
        />
      </div>

      {/* Top Prescribed Exercises */}
      <div className="mb-6">
        <ExerciseStats
          data={exercises.topPrescribed || []}
          loading={isLoading}
          limit={10}
        />
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hurtigstatistikk</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Aktive pasienter</p>
            <p className="text-xl font-bold text-gray-900">
              {isLoading ? '-' : patients.activePatients || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Avtaler i dag</p>
            <p className="text-xl font-bold text-gray-900">
              {isLoading ? '-' : appointments.today?.total || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Denne uken</p>
            <p className="text-xl font-bold text-gray-900">
              {isLoading ? '-' : appointments.thisWeek?.total || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">No-show rate</p>
            <p className="text-xl font-bold text-gray-900">
              {isLoading ? '-' : `${
                appointments.thisWeek?.total > 0
                  ? Math.round((appointments.thisWeek?.noShow / appointments.thisWeek?.total) * 100)
                  : 0
              }%`}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Inntekt denne mnd</p>
            <p className="text-xl font-bold text-green-600">
              {isLoading ? '-' : new Intl.NumberFormat('no-NO', {
                style: 'currency',
                currency: 'NOK',
                minimumFractionDigits: 0
              }).format(revenue.thisMonth?.totalRevenue || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Endring inntekt</p>
            <p className={`text-xl font-bold ${
              (revenue.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {isLoading ? '-' : `${revenue.changePercent >= 0 ? '+' : ''}${revenue.changePercent || 0}%`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
