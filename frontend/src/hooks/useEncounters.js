/**
 * Clinical Encounters Data Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Fetch patient encounters
 */
export const useEncounters = (patientId, params = {}) => {
  return useQuery(
    ['encounters', patientId, params],
    () => api.encounters.getAll(patientId, params),
    {
      enabled: !!patientId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

/**
 * Fetch single encounter
 */
export const useEncounter = (encounterId) => {
  return useQuery(['encounter', encounterId], () => api.encounters.getById(encounterId), {
    enabled: !!encounterId,
    staleTime: 2 * 60 * 1000,
    onSuccess: (_data) => {
      // Log encounter access
      api.audit.logAction('encounter_view', 'encounter', encounterId);
    },
  });
};

/**
 * Create encounter mutation
 */
export const useCreateEncounter = () => {
  const queryClient = useQueryClient();

  return useMutation((data) => api.encounters.create(data), {
    onSuccess: (data) => {
      // Invalidate encounters list for this patient
      queryClient.invalidateQueries(['encounters', data.patientId]);

      // Log creation
      api.audit.logAction('encounter_create', 'encounter', data.id);
    },
  });
};

/**
 * Update encounter mutation
 */
export const useUpdateEncounter = () => {
  const queryClient = useQueryClient();

  return useMutation(({ id, data }) => api.encounters.update(id, data), {
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['encounter', variables.id], data);
      queryClient.invalidateQueries(['encounters', data.patientId]);
    },
  });
};

/**
 * Sign encounter mutation
 */
export const useSignEncounter = () => {
  const queryClient = useQueryClient();

  return useMutation((encounterId) => api.encounters.sign(encounterId), {
    onSuccess: (data) => {
      queryClient.setQueryData(['encounter', data.id], data);
      queryClient.invalidateQueries(['encounters', data.patientId]);

      // Log signing
      api.audit.logAction('encounter_sign', 'encounter', data.id);
    },
  });
};

/**
 * Get encounter versions (for versioning/audit trail)
 */
export const useEncounterVersions = (encounterId) => {
  return useQuery(
    ['encounter-versions', encounterId],
    () => api.encounters.getVersions(encounterId),
    {
      enabled: !!encounterId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export default {
  useEncounters,
  useEncounter,
  useCreateEncounter,
  useUpdateEncounter,
  useSignEncounter,
  useEncounterVersions,
};
