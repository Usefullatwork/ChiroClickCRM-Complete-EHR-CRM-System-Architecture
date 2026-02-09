/**
 * Patient Intake Hook
 * Manages patient intake form data
 */

import { useState, useCallback } from 'react';
import { kioskAPI } from '../services/api';

export const usePatientIntake = (appointmentId) => {
  const [intakeData, setIntakeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIntake = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await kioskAPI.getIntake(appointmentId);
      setIntakeData(response.data?.data || response.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setIntakeData(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  return {
    intakeData,
    loading,
    error,
    fetchIntake,
    hasIntake: !!intakeData,
  };
};

export default usePatientIntake;
