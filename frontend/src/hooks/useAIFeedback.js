/**
 * useAIFeedback Hook
 *
 * React hook for AI feedback operations:
 * - submitFeedback(data)
 * - getMyFeedbackStats()
 * - Integration with backend aiLearning.js service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

// API endpoints for AI feedback
const AI_FEEDBACK_API = {
  submit: (data) => apiClient.post('/ai/feedback', data),
  getMyFeedback: (params) => apiClient.get('/ai/feedback/mine', { params }),
  getMyStats: () => apiClient.get('/ai/feedback/stats'),
  getPerformanceMetrics: (params) => apiClient.get('/ai/feedback/metrics', { params }),
  getSuggestionsNeedingReview: (limit) => apiClient.get('/ai/feedback/review-needed', { params: { limit } }),
  exportFeedback: (params) => apiClient.get('/ai/feedback/export', { params, responseType: 'blob' }),
  getRetrainingStatus: () => apiClient.get('/ai/feedback/retraining-status'),
};

/**
 * Submit AI feedback
 *
 * Sends user feedback on an AI suggestion to the backend
 * for continuous learning and model improvement
 *
 * @returns {object} Mutation result with submit function
 */
export const useSubmitAIFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (feedbackData) => {
      const response = await AI_FEEDBACK_API.submit(feedbackData);
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries(['ai-feedback']);
        queryClient.invalidateQueries(['ai-feedback-stats']);
        queryClient.invalidateQueries(['ai-performance-metrics']);
      },
      onError: (error) => {
        console.error('Failed to submit AI feedback:', error);
        throw error;
      },
    }
  );
};

/**
 * Get user's feedback history
 *
 * Fetches the current user's past AI feedback submissions
 *
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum items to fetch
 * @param {number} options.offset - Pagination offset
 * @param {string} options.suggestionType - Filter by type
 * @param {string} options.startDate - Filter start date
 * @param {string} options.endDate - Filter end date
 * @returns {object} Query result with feedback list
 */
export const useMyAIFeedback = (options = {}) => {
  const {
    limit = 50,
    offset = 0,
    suggestionType = null,
    startDate = null,
    endDate = null,
    enabled = true,
  } = options;

  return useQuery(
    ['ai-feedback', 'mine', { limit, offset, suggestionType, startDate, endDate }],
    async () => {
      const params = { limit, offset };
      if (suggestionType) params.suggestionType = suggestionType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await AI_FEEDBACK_API.getMyFeedback(params);
      return response.data;
    },
    {
      enabled,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnMount: true,
    }
  );
};

/**
 * Get user's feedback statistics
 *
 * Fetches aggregated statistics about the user's AI feedback
 * including acceptance rate, average rating, etc.
 *
 * @returns {object} Query result with stats
 */
export const useMyAIFeedbackStats = () => {
  return useQuery(
    ['ai-feedback-stats', 'mine'],
    async () => {
      const response = await AI_FEEDBACK_API.getMyStats();
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

/**
 * Get AI performance metrics
 *
 * Fetches overall AI performance metrics for dashboard display
 * Includes acceptance rates, trends, and breakdown by type
 *
 * @param {object} options - Query options
 * @param {string} options.groupBy - Grouping: 'day', 'week', 'month'
 * @param {string} options.startDate - Start date for range
 * @param {string} options.endDate - End date for range
 * @param {string} options.suggestionType - Filter by suggestion type
 * @returns {object} Query result with metrics
 */
export const useAIPerformanceMetrics = (options = {}) => {
  const {
    groupBy = 'day',
    startDate = null,
    endDate = null,
    suggestionType = null,
    enabled = true,
  } = options;

  return useQuery(
    ['ai-performance-metrics', { groupBy, startDate, endDate, suggestionType }],
    async () => {
      const params = { groupBy };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (suggestionType) params.suggestionType = suggestionType;

      const response = await AI_FEEDBACK_API.getPerformanceMetrics(params);
      return response.data;
    },
    {
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

/**
 * Get suggestions needing review
 *
 * Fetches AI suggestions that have low confidence or high rejection rate
 * and may need manual review or model adjustment
 *
 * @param {number} limit - Maximum items to fetch
 * @returns {object} Query result with suggestions
 */
export const useSuggestionsNeedingReview = (limit = 20) => {
  return useQuery(
    ['ai-suggestions-review', limit],
    async () => {
      const response = await AI_FEEDBACK_API.getSuggestionsNeedingReview(limit);
      return response.data;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );
};

/**
 * Get AI retraining status
 *
 * Fetches the current status of AI model retraining
 * including last training date, pending feedback count, etc.
 *
 * @returns {object} Query result with retraining status
 */
export const useAIRetrainingStatus = () => {
  return useQuery(
    ['ai-retraining-status'],
    async () => {
      const response = await AI_FEEDBACK_API.getRetrainingStatus();
      return response.data;
    },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
};

/**
 * Export feedback data
 *
 * Mutation hook to export feedback data as CSV or JSON
 *
 * @returns {object} Mutation result with export function
 */
export const useExportAIFeedback = () => {
  return useMutation(
    async ({ format = 'csv', startDate, endDate, suggestionType }) => {
      const params = { format };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (suggestionType) params.suggestionType = suggestionType;

      const response = await AI_FEEDBACK_API.exportFeedback(params);

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-feedback-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
    {
      onError: (error) => {
        console.error('Failed to export AI feedback:', error);
        throw error;
      },
    }
  );
};

/**
 * Combined hook for common AI feedback operations
 *
 * Provides a convenient single hook for components that need
 * multiple AI feedback related operations
 *
 * @param {object} options - Configuration options
 * @returns {object} Combined feedback operations and data
 */
export const useAIFeedback = (options = {}) => {
  const { fetchHistory = true, fetchStats = true, feedbackOptions = {} } = options;

  // Mutations
  const submitFeedbackMutation = useSubmitAIFeedback();

  // Queries
  const feedbackHistory = useMyAIFeedback({
    ...feedbackOptions,
    enabled: fetchHistory,
  });
  const feedbackStats = useMyAIFeedbackStats();

  // Derived state
  const isLoading = feedbackHistory.isLoading || feedbackStats.isLoading;
  const isSubmitting = submitFeedbackMutation.isLoading;

  return {
    // Data
    feedbackList: feedbackHistory.data?.feedback || [],
    stats: feedbackStats.data || {
      totalFeedback: 0,
      acceptanceRate: 0,
      avgRating: 0,
      avgDecisionTime: 0,
    },

    // Status
    isLoading,
    isSubmitting,
    isError: feedbackHistory.isError || feedbackStats.isError,
    error: feedbackHistory.error || feedbackStats.error,

    // Actions
    submitFeedback: submitFeedbackMutation.mutateAsync,
    refetchHistory: feedbackHistory.refetch,
    refetchStats: feedbackStats.refetch,
    refetchAll: () => {
      feedbackHistory.refetch();
      feedbackStats.refetch();
    },
  };
};

export default useAIFeedback;
