/**
 * Data-fetching queries for ClinicalEncounter: patient, intake, existing encounter,
 * diagnoses, previous encounters, and anatomy findings.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { encountersAPI, patientsAPI, diagnosisAPI } from '../services/api';
import { usePatientIntake } from './usePatientIntake';

export function useEncounterQueries({
  patientId,
  encounterId,
  setEncounterData,
  examData,
  setRedFlagAlerts,
  setClinicalWarnings,
  kioskDataApplied,
  setKioskDataApplied,
}) {
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId),
    enabled: !!patientId,
  });

  const appointmentId = patient?.currentAppointmentId || null;
  const {
    intake: kioskIntake,
    subjectiveNarrative: kioskSubjective,
    hasIntake: hasKioskIntake,
  } = usePatientIntake(appointmentId);

  useEffect(() => {
    if (hasKioskIntake && kioskSubjective && !kioskDataApplied && !encounterId) {
      setEncounterData((prev) => ({
        ...prev,
        subjective: { ...prev.subjective, chief_complaint: kioskSubjective },
        vas_pain_start: kioskIntake?.painLevel ?? prev.vas_pain_start,
      }));
      setKioskDataApplied(true);
    }
  }, [hasKioskIntake, kioskSubjective, kioskIntake, kioskDataApplied, encounterId]);

  const { data: existingEncounter } = useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: () => encountersAPI.getById(encounterId),
    enabled: !!encounterId,
  });

  useEffect(() => {
    if (existingEncounter?.data) {
      setEncounterData((prev) => ({
        ...prev,
        ...existingEncounter.data,
        encounter_date: new Date(existingEncounter.data.encounter_date).toISOString().split('T')[0],
      }));
      setRedFlagAlerts(existingEncounter.data.redFlagAlerts || []);
      setClinicalWarnings(existingEncounter.data.clinicalWarnings || []);
    }
  }, [existingEncounter]);

  const { data: commonDiagnoses } = useQuery({
    queryKey: ['diagnosis', 'common'],
    queryFn: () => diagnosisAPI.getCommon(),
  });

  const { data: previousEncounters } = useQuery({
    queryKey: ['encounters', 'patient', patientId, 'previous'],
    queryFn: async () => {
      const response = await encountersAPI.getAll({ patientId, signed: true, limit: 10 });
      const encounters = response?.data?.encounters || response?.data?.data || response?.data || [];
      const previous = encounters
        .filter((e) => e.id !== encounterId)
        .sort((a, b) => new Date(b.encounter_date) - new Date(a.encounter_date));
      return previous[0] || null;
    },
    enabled: !!patientId,
  });

  const { data: latestAnatomyFindings } = useQuery({
    queryKey: ['anatomy-findings', 'latest', patientId],
    queryFn: async () => {
      const response = await encountersAPI.getLatestAnatomyFindings(patientId);
      return response?.data?.data || [];
    },
    enabled: !!patientId && !encounterId,
  });

  const { data: existingAnatomyFindings } = useQuery({
    queryKey: ['anatomy-findings', encounterId],
    queryFn: async () => {
      const response = await encountersAPI.getAnatomyFindings(encounterId);
      return response?.data?.data || [];
    },
    enabled: !!encounterId,
  });

  useEffect(() => {
    if (existingAnatomyFindings?.length > 0) {
      const findingsMap = {};
      for (const f of existingAnatomyFindings) {
        findingsMap[f.body_region] = f;
      }
      examData.setAnatomySpineFindings(findingsMap);
    }
  }, [existingAnatomyFindings]);

  return {
    patient,
    patientLoading,
    kioskIntake,
    hasKioskIntake,
    kioskSubjective,
    existingEncounter,
    commonDiagnoses,
    previousEncounters,
    latestAnatomyFindings,
    existingAnatomyFindings,
  };
}
