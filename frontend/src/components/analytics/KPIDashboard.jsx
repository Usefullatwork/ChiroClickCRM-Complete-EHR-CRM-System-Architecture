import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MessageSquare,
  Activity,
  Mail,
  Download,
  Filter,
  BarChart3,
  MapPin
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useKPIs, usePatientMetrics } from '../../hooks/useAnalytics';
import { KPIChart } from './KPIChart';
import { EmailReportModal } from './EmailReportModal';
import { WeekendDifferentialAnalysis } from './WeekendDifferentialAnalysis';

/**
 * KPI Dashboard Component
 *
 * Displays key performance indicators for the clinic:
 * - Patient visits (PVA - Patient Visit Average)
 * - Reactivations
 * - Messages sent
 * - Active patients
 * - Appointment statistics
 * - Weekend differential analysis (Saturday vs. weekday, Oslo vs. non-Oslo)
 *
 * Features:
 * - Monthly/yearly filtering
 * - Trend comparisons
 * - Chart visualizations
 * - Email reports to clinic leads
 * - Weekend/geographic segmentation
 */
export const KPIDashboard = () => {
  const [timeRange, setTimeRange] = useState('month'); // 'month' or 'year'
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'weekend'

  // Fetch KPI data
  const { data: kpis, isLoading } = useKPIs(timeRange, selectedDate);
  const { data: metrics } = usePatientMetrics(timeRange, selectedDate);

  // Calculate trends
  const trends = useMemo(() => {
    if (!kpis?.current || !kpis?.previous) return {};

    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) return { percent: 0, direction: 'neutral' };
      const percent = ((current - previous) / previous) * 100;
      return {
        percent: Math.abs(percent).toFixed(1),
        direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral'
      };
    };

    return {
      visits: calculateChange(kpis.current.totalVisits, kpis.previous.totalVisits),
      reactivations: calculateChange(kpis.current.reactivations, kpis.previous.reactivations),
      messages: calculateChange(kpis.current.messagesSent, kpis.previous.messagesSent),
      activePatients: calculateChange(kpis.current.activePatients, kpis.previous.activePatients)
    };
  }, [kpis]);

  // Handle date changes
  const handleMonthChange = (direction) => {
    setSelectedDate(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { year: newYear, month: newMonth };
    });
  };

  const handleYearChange = (direction) => {
    setSelectedDate(prev => ({
      ...prev,
      year: prev.year + direction
    }));
  };

  // Format date for display
  const formatDateRange = () => {
    if (timeRange === 'month') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[selectedDate.month - 1]} ${selectedDate.year}`;
    } else {
      return `${selectedDate.year}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const currentKPIs = kpis?.current || {};

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Key performance indicators and clinic metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmailModal(true)}
            icon={Mail}
          >
            Email Report
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Export to CSV
              const data = [
                ['Metric', 'Value', 'Change'],
                ['Total Visits', currentKPIs.totalVisits, `${trends.visits?.percent}%`],
                ['Reactivations', currentKPIs.reactivations, `${trends.reactivations?.percent}%`],
                ['Messages Sent', currentKPIs.messagesSent, `${trends.messages?.percent}%`],
                ['Active Patients', currentKPIs.activePatients, `${trends.activePatients?.percent}%`]
              ];
              const csv = data.map(row => row.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `kpi-report-${formatDateRange()}.csv`;
              a.click();
            }}
            icon={Download}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* View Mode & Time Range Selector */}
      <Card>
        <Card.Body>
          <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Analytics View:</span>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'standard' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('standard')}
                >
                  Standard KPIs
                </Button>
                <Button
                  variant={viewMode === 'weekend' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('weekend')}
                  icon={MapPin}
                >
                  Weekend Differential
                </Button>
              </div>
            </div>

            {/* Time Range & Date Navigator */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Time Range:</span>
                <div className="flex gap-2">
                  <Button
                    variant={timeRange === 'month' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('month')}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={timeRange === 'year' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('year')}
                  >
                    Yearly
                  </Button>
                </div>
              </div>

              {/* Date navigator */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => timeRange === 'month' ? handleMonthChange(-1) : handleYearChange(-1)}
                >
                  ← Previous
                </Button>
                <span className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
                  {formatDateRange()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => timeRange === 'month' ? handleMonthChange(1) : handleYearChange(1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'weekend' ? (
        /* Weekend Differential Analysis */
        <WeekendDifferentialAnalysis
          timeRange={timeRange}
          selectedDate={selectedDate}
        />
      ) : (
        /* Standard KPI View */
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Visits */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Visits</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {currentKPIs.totalVisits || 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {trends.visits?.direction === 'up' ? (
                    <TrendingUp size={16} className="text-green-600" />
                  ) : trends.visits?.direction === 'down' ? (
                    <TrendingDown size={16} className="text-red-600" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    trends.visits?.direction === 'up' ? 'text-green-600' :
                    trends.visits?.direction === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {trends.visits?.percent}% vs previous {timeRange}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <Calendar size={24} className="text-teal-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Reactivations */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Reactivations</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {currentKPIs.reactivations || 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {trends.reactivations?.direction === 'up' ? (
                    <TrendingUp size={16} className="text-green-600" />
                  ) : trends.reactivations?.direction === 'down' ? (
                    <TrendingDown size={16} className="text-red-600" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    trends.reactivations?.direction === 'up' ? 'text-green-600' :
                    trends.reactivations?.direction === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {trends.reactivations?.percent}% vs previous {timeRange}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity size={24} className="text-blue-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Messages Sent */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Messages Sent</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {currentKPIs.messagesSent || 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {trends.messages?.direction === 'up' ? (
                    <TrendingUp size={16} className="text-green-600" />
                  ) : trends.messages?.direction === 'down' ? (
                    <TrendingDown size={16} className="text-red-600" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    trends.messages?.direction === 'up' ? 'text-green-600' :
                    trends.messages?.direction === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {trends.messages?.percent}% vs previous {timeRange}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare size={24} className="text-purple-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Active Patients */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Patients</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {currentKPIs.activePatients || 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {trends.activePatients?.direction === 'up' ? (
                    <TrendingUp size={16} className="text-green-600" />
                  ) : trends.activePatients?.direction === 'down' ? (
                    <TrendingDown size={16} className="text-red-600" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    trends.activePatients?.direction === 'up' ? 'text-green-600' :
                    trends.activePatients?.direction === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {trends.activePatients?.percent}% vs previous {timeRange}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* PVA and Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-slate-900">PVA (Patient Visit Average)</h3>
          </Card.Header>
          <Card.Body>
            <div className="text-center">
              <p className="text-4xl font-bold text-teal-600">
                {currentKPIs.pva ? currentKPIs.pva.toFixed(1) : '0.0'}
              </p>
              <p className="text-sm text-slate-600 mt-2">visits per active patient</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Visits:</span>
                <span className="font-semibold text-slate-900">{currentKPIs.totalVisits || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600">Active Patients:</span>
                <span className="font-semibold text-slate-900">{currentKPIs.activePatients || 0}</span>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-slate-900">Appointment Stats</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Scheduled:</span>
                <Badge variant="primary">{currentKPIs.appointmentsScheduled || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Completed:</span>
                <Badge variant="success">{currentKPIs.appointmentsCompleted || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Cancelled:</span>
                <Badge variant="warning">{currentKPIs.appointmentsCancelled || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">No-Show:</span>
                <Badge variant="danger">{currentKPIs.appointmentsNoShow || 0}</Badge>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Show Rate:</span>
                  <span className="text-lg font-bold text-teal-600">
                    {currentKPIs.showRate ? `${currentKPIs.showRate.toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-slate-900">Patient Demographics</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">New Patients:</span>
                <Badge variant="primary">{currentKPIs.newPatients || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Returning:</span>
                <Badge variant="info">{currentKPIs.returningPatients || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Inactive (90+ days):</span>
                <Badge variant="warning">{currentKPIs.inactivePatients || 0}</Badge>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Retention Rate:</span>
                  <span className="text-lg font-bold text-teal-600">
                    {currentKPIs.retentionRate ? `${currentKPIs.retentionRate.toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-teal-600" />
                <h3 className="text-lg font-semibold text-slate-900">Visit Trends</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <KPIChart
                data={metrics.visitTrends}
                type="line"
                color="#14b8a6"
                label="Visits"
              />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Reactivation Trends</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <KPIChart
                data={metrics.reactivationTrends}
                type="bar"
                color="#3b82f6"
                label="Reactivations"
              />
            </Card.Body>
          </Card>
        </div>
      )}
        </>
      )}

      {/* Email Report Modal */}
      {showEmailModal && (
        <EmailReportModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          kpiData={currentKPIs}
          dateRange={formatDateRange()}
          timeRange={timeRange}
        />
      )}
    </div>
  );
};
