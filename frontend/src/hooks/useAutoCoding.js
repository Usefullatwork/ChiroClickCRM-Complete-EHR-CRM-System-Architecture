/**
 * Auto-coding hook: derives CMT procedure codes and diagnosis suggestions
 * from confirmed anatomy spine findings.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { encountersAPI } from '../services/api';
import { SPINAL_REGION_PATTERN } from '../components/encounter/encounterConstants';

export function useAutoCoding(anatomySpineFindings) {
  const confirmedRegions = useMemo(() => {
    const findings = anatomySpineFindings || {};
    return Object.values(findings)
      .filter((f) => f.confirmed !== false)
      .map((f) => f.body_region);
  }, [anatomySpineFindings]);

  const suggestedCMTCode = useMemo(() => {
    const treatedRegions = new Set();
    for (const region of confirmedRegions) {
      if (SPINAL_REGION_PATTERN.test(region)) {
        treatedRegions.add(region[0]);
      }
    }
    const count = treatedRegions.size;
    if (count === 0) {
      return null;
    }
    if (count <= 2) {
      return { code: '98940', name: 'CMT 1-2 regioner', regions: count };
    }
    if (count <= 4) {
      return { code: '98941', name: 'CMT 3-4 regioner', regions: count };
    }
    return { code: '98942', name: 'CMT 5+ regioner', regions: count };
  }, [confirmedRegions]);

  const { data: suggestedCodes } = useQuery({
    queryKey: ['codes-from-findings', confirmedRegions],
    queryFn: async () => {
      const response = await encountersAPI.getCodesFromFindings(confirmedRegions);
      return response?.data?.data || [];
    },
    enabled: confirmedRegions.length > 0,
    staleTime: 10000,
  });

  return { confirmedRegions, suggestedCMTCode, suggestedCodes };
}
