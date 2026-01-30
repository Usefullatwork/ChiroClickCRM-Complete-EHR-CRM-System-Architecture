/**
 * Patient Intake Hook
 * Manages patient intake form data
 */

import { useState, useCallback } from 'react';

export const usePatientIntake = (patientId) => {
  const [intakeData, setIntakeData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchIntake = useCallback(async () => {
    setLoading(true);
    // Placeholder - would fetch from API
    setLoading(false);
  }, [patientId]);

  return {
    intakeData,
    loading,
    fetchIntake,
    hasIntake: !!intakeData,
  };
};

export default usePatientIntake;
