/**
 * Medical Codes Hook (ICPC-2, ICD-10)
 */

import { useQuery } from 'react-query';
import { api } from '../api/client';

/**
 * Fetch ICPC-2 codes
 */
export const useICPC2Codes = (params = {}) => {
  return useQuery(
    ['icpc2-codes', params],
    () => api.codes.getICPC2(params),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes (codes rarely change)
      cacheTime: 60 * 60 * 1000, // 1 hour
    }
  );
};

/**
 * Fetch ICPC-2 codes by chapter (L for musculoskeletal, N for neurological)
 */
export const useICPC2ByChapter = (chapter) => {
  return useQuery(
    ['icpc2-codes', 'chapter', chapter],
    () => api.codes.getByChapter(chapter),
    {
      enabled: !!chapter,
      staleTime: 30 * 60 * 1000,
    }
  );
};

/**
 * Search ICPC-2 codes
 */
export const useICPC2Search = (query) => {
  return useQuery(
    ['icpc2-codes', 'search', query],
    () => api.codes.searchICPC2(query),
    {
      enabled: query.length >= 2,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Get chiropractic-relevant codes (L + common N codes)
 */
export const useChiropracticCodes = () => {
  return useQuery(
    ['icpc2-codes', 'chiropractic'],
    async () => {
      const lCodes = await api.codes.getByChapter('L');
      const nCodes = await api.codes.getByChapter('N');

      // Filter common N codes
      const commonNCodes = nCodes.filter(code =>
        ['N01', 'N05', 'N17', 'N89', 'N91', 'N92', 'N93', 'N95'].includes(code.code)
      );

      return [...lCodes, ...commonNCodes];
    },
    {
      staleTime: 30 * 60 * 1000,
    }
  );
};

export default {
  useICPC2Codes,
  useICPC2ByChapter,
  useICPC2Search,
  useChiropracticCodes
};
