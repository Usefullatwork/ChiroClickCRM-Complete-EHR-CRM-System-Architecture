import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Analytics Hooks
 *
 * React Query hooks for fetching and managing analytics/KPI data
 */

/**
 * Fetch KPI data for a given time range
 *
 * @param {string} timeRange - 'month' or 'year'
 * @param {object} selectedDate - { year, month }
 * @returns {object} Query result with current and previous period KPIs
 */
export const useKPIs = (timeRange, selectedDate) => {
  return useQuery(
    ['kpis', timeRange, selectedDate.year, selectedDate.month],
    async () => {
      const params = {
        timeRange,
        year: selectedDate.year
      };

      if (timeRange === 'month') {
        params.month = selectedDate.month;
      }

      const response = await api.analytics.getKPIs(params);
      return response;
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnMount: true,
      enabled: !!selectedDate.year
    }
  );
};

/**
 * Fetch detailed patient metrics for charting
 *
 * @param {string} timeRange - 'month' or 'year'
 * @param {object} selectedDate - { year, month }
 * @returns {object} Query result with trend data
 */
export const usePatientMetrics = (timeRange, selectedDate) => {
  return useQuery(
    ['patient-metrics', timeRange, selectedDate.year, selectedDate.month],
    async () => {
      const params = {
        timeRange,
        year: selectedDate.year
      };

      if (timeRange === 'month') {
        params.month = selectedDate.month;
      }

      const response = await api.analytics.getPatientMetrics(params);
      return response;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!selectedDate.year
    }
  );
};

/**
 * Fetch reactivation opportunities
 *
 * Returns list of patients who haven't visited in 60-90 days
 * and are good candidates for reactivation campaigns
 *
 * @returns {object} Query result with reactivation candidates
 */
export const useReactivationOpportunities = () => {
  return useQuery(
    ['reactivation-opportunities'],
    async () => {
      const response = await api.analytics.getReactivationOpportunities();
      return response;
    },
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );
};

/**
 * Fetch message statistics
 *
 * Returns breakdown of messages sent by type, status, and time
 *
 * @param {object} dateRange - { startDate, endDate }
 * @returns {object} Query result with message stats
 */
export const useMessageStats = (dateRange) => {
  return useQuery(
    ['message-stats', dateRange.startDate, dateRange.endDate],
    async () => {
      const response = await api.analytics.getMessageStats(dateRange);
      return response;
    },
    {
      staleTime: 5 * 60 * 1000,
      enabled: !!(dateRange?.startDate && dateRange?.endDate)
    }
  );
};

/**
 * Fetch appointment analytics
 *
 * Returns detailed appointment metrics including:
 * - Show rate
 * - Cancellation rate
 * - No-show rate
 * - Average time between appointments
 * - Peak booking times
 *
 * @param {object} params - { year, month }
 * @returns {object} Query result with appointment analytics
 */
export const useAppointmentAnalytics = (params) => {
  return useQuery(
    ['appointment-analytics', params.year, params.month],
    async () => {
      const response = await api.analytics.getAppointmentAnalytics(params);
      return response;
    },
    {
      staleTime: 5 * 60 * 1000,
      enabled: !!params.year
    }
  );
};

/**
 * Fetch practitioner performance metrics
 *
 * Returns KPIs per practitioner:
 * - Patient visits
 * - Average appointment duration
 * - Patient satisfaction (if available)
 * - Revenue (if available)
 *
 * @param {object} params - { year, month, practitionerId }
 * @returns {object} Query result with practitioner metrics
 */
export const usePractitionerMetrics = (params) => {
  return useQuery(
    ['practitioner-metrics', params.year, params.month, params.practitionerId],
    async () => {
      const response = await api.analytics.getPractitionerMetrics(params);
      return response;
    },
    {
      staleTime: 5 * 60 * 1000,
      enabled: !!params.year
    }
  );
};

/**
 * Send KPI report via email
 *
 * Mutation hook for sending formatted KPI reports to clinic leads
 *
 * @returns {object} Mutation result
 */
export const useSendKPIReport = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ recipients, subject, message, kpiData, dateRange, timeRange }) => {
      const response = await api.analytics.sendKPIReport({
        recipients,
        subject,
        message,
        kpiData,
        dateRange,
        timeRange
      });
      return response;
    },
    {
      onSuccess: () => {
        // Log the email send for audit trail
        queryClient.invalidateQueries(['audit-logs']);
      },
      onError: (error) => {
        console.error('Failed to send KPI report:', error);
        throw error;
      }
    }
  );
};

/**
 * Export KPI data to CSV
 *
 * @param {object} params - { year, month, timeRange }
 * @returns {object} Mutation result
 */
export const useExportKPIData = () => {
  return useMutation(
    async ({ year, month, timeRange }) => {
      const response = await api.analytics.exportKPIData({
        year,
        month,
        timeRange
      });
      return response;
    }
  );
};

/**
 * Fetch dashboard summary
 *
 * Returns high-level summary for the main dashboard
 * Includes today's appointments, recent alerts, quick stats
 *
 * @returns {object} Query result with dashboard data
 */
export const useDashboardSummary = () => {
  return useQuery(
    ['dashboard-summary'],
    async () => {
      const response = await api.analytics.getDashboardSummary();
      return response;
    },
    {
      staleTime: 1 * 60 * 1000, // 1 minute (dashboard needs fresh data)
      refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    }
  );
};

/**
 * Fetch patient retention cohort analysis
 *
 * Returns cohort data showing patient retention over time
 * Grouped by month of first visit
 *
 * @param {number} year - Year to analyze
 * @returns {object} Query result with cohort data
 */
export const useRetentionCohorts = (year) => {
  return useQuery(
    ['retention-cohorts', year],
    async () => {
      const response = await api.analytics.getRetentionCohorts({ year });
      return response;
    },
    {
      staleTime: 60 * 60 * 1000, // 1 hour (cohort data changes slowly)
      enabled: !!year
    }
  );
};

/**
 * Fetch weekend differential analytics
 *
 * Returns analysis of Saturday visits and geographic correlation
 * Key metrics:
 * - Weekday vs. Saturday visit breakdown
 * - Oslo vs. non-Oslo patient distribution
 * - Saturday + non-Oslo correlation
 * - PVA differentials (weekday PVA vs. Saturday PVA)
 *
 * @param {string} timeRange - 'month' or 'year'
 * @param {object} selectedDate - { year, month }
 * @returns {object} Query result with weekend differential data
 */
export const useWeekendDifferentials = (timeRange, selectedDate) => {
  return useQuery(
    ['weekend-differentials', timeRange, selectedDate.year, selectedDate.month],
    async () => {
      const params = {
        timeRange,
        year: selectedDate.year
      };

      if (timeRange === 'month') {
        params.month = selectedDate.month;
      }

      const response = await api.analytics.getWeekendDifferentials(params);
      return response;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!selectedDate.year
    }
  );
};

/**
 * Fetch Saturday visit details for correlation analysis
 *
 * Returns list of all Saturday visits with patient location data
 * for detailed analysis and email reports
 *
 * @param {object} params - { year, month }
 * @returns {object} Query result with Saturday visit list
 */
export const useSaturdayVisits = (params) => {
  return useQuery(
    ['saturday-visits', params.year, params.month],
    async () => {
      const response = await api.analytics.getSaturdayVisits(params);
      return response;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!params.year
    }
  );
};
