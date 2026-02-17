/**
 * Patients Data Hook
 * Uses React Query for data fetching and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Fetch all patients
 */
export const usePatients = (params = {}) => {
  return useQuery(['patients', params], () => api.patients.getAll(params), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch single patient
 */
export const usePatient = (id) => {
  return useQuery(['patient', id], () => api.patients.getById(id), {
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    onSuccess: (_data) => {
      // Log patient access for audit trail
      api.audit.logAction('patient_view', 'patient', id);
    },
  });
};

/**
 * Create patient mutation
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation((data) => api.patients.create(data), {
    onSuccess: () => {
      // Invalidate patients list to refetch
      queryClient.invalidateQueries('patients');
    },
  });
};

/**
 * Update patient mutation
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation(({ id, data }) => api.patients.update(id, data), {
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(['patient', variables.id], data);
      queryClient.invalidateQueries('patients');
    },
  });
};

/**
 * Delete patient mutation
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation((id) => api.patients.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('patients');
    },
  });
};

/**
 * Search patients
 */
export const usePatientSearch = (query) => {
  return useQuery(['patients', 'search', query], () => api.patients.search(query), {
    enabled: query.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export default {
  usePatients,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  usePatientSearch,
};
