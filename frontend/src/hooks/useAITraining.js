/**
 * React Query hooks for AI Training module
 * Covers: data curation, retraining pipeline, RLAIF
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { curationAPI, aiRetrainingAPI } from '../services/api';

// ============================================================================
// DATA CURATION HOOKS
// ============================================================================

export function useCurationFeedback(filters = {}) {
  return useQuery({
    queryKey: ['curation-feedback', filters],
    queryFn: async () => {
      const res = await curationAPI.getFeedback(filters);
      return res.data.data;
    },
    keepPreviousData: true,
  });
}

export function useCurationStats() {
  return useQuery({
    queryKey: ['curation-stats'],
    queryFn: async () => {
      const res = await curationAPI.getStats();
      return res.data.data;
    },
  });
}

export function useApproveFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, editedText }) => curationAPI.approve(id, { editedText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curation-feedback'] });
      qc.invalidateQueries({ queryKey: ['curation-stats'] });
    },
  });
}

export function useRejectFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => curationAPI.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curation-feedback'] });
      qc.invalidateQueries({ queryKey: ['curation-stats'] });
    },
  });
}

export function useBulkCurationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action }) => curationAPI.bulk({ ids, action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curation-feedback'] });
      qc.invalidateQueries({ queryKey: ['curation-stats'] });
    },
  });
}

// ============================================================================
// RETRAINING PIPELINE HOOKS
// ============================================================================

export function useRetrainingStatus(enabled = true) {
  return useQuery({
    queryKey: ['retraining-status'],
    queryFn: async () => {
      const res = await aiRetrainingAPI.getStatus();
      return res.data.data;
    },
    refetchInterval: (data) => {
      // Poll every 5s when pipeline is running
      return data?.status === 'in_progress' ? 5000 : false;
    },
    enabled,
  });
}

export function useRetrainingHistory(limit = 20) {
  return useQuery({
    queryKey: ['retraining-history', limit],
    queryFn: async () => {
      const res = await aiRetrainingAPI.getHistory(limit);
      return res.data.data;
    },
  });
}

export function useTriggerRetraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts) => aiRetrainingAPI.triggerRetraining(opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retraining-status'] });
      qc.invalidateQueries({ queryKey: ['retraining-history'] });
    },
  });
}

export function useRollbackModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version) => aiRetrainingAPI.rollbackModel(version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retraining-status'] });
      qc.invalidateQueries({ queryKey: ['training-status'] });
    },
  });
}

export function useRLAIFStats() {
  return useQuery({
    queryKey: ['rlaif-stats'],
    queryFn: async () => {
      const res = await aiRetrainingAPI.getRLAIFStats();
      return res.data.data;
    },
  });
}

export function useGeneratePreferencePairs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => aiRetrainingAPI.generatePairs(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rlaif-stats'] });
    },
  });
}
