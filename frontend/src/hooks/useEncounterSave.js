import { useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { encountersAPI } from '../services/api';
import { taksterNorwegian } from '../components/encounter/TaksterPanel';

function cleanEmptyStrings(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const cleanedNested = cleanEmptyStrings(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function useEncounterSave({
  encounterId,
  patientId,
  encounterData,
  selectedTakster,
  isSigned,
  examData,
  navigate,
  setAutoSaveStatus,
  setLastSaved,
  setEncounterData,
  autoSaveTimerRef,
  // Amendment state
  amendmentContent,
  amendmentType,
  amendmentReason,
  setShowAmendmentForm,
  setAmendmentContent,
  setAmendmentReason,
  refetchAmendments,
  // Compliance
  setShowComplianceScan,
}) {
  const queryClient = useQueryClient();

  const buildSavePayload = useCallback(() => {
    // Use authenticated user ID; fall back to desktop default practitioner
    const userId = localStorage.getItem('userId') || 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    const baseData = {
      patient_id: patientId,
      practitioner_id: userId,
      encounter_date: encounterData.encounter_date,
      encounter_type: encounterData.encounter_type,
      duration_minutes: encounterData.duration_minutes,
      vas_pain_start: encounterData.vas_pain_start,
      vas_pain_end: encounterData.vas_pain_end,
      status: 'DRAFT',
    };
    const subjective = cleanEmptyStrings(encounterData.subjective);
    const objective = cleanEmptyStrings(encounterData.objective);
    const assessment = cleanEmptyStrings(encounterData.assessment);
    const plan = cleanEmptyStrings(encounterData.plan);
    const treatments = selectedTakster
      .map((id) => {
        const takst = taksterNorwegian.find((t) => t.id === id);
        return takst
          ? { code: takst.code, name: takst.name, price: takst.price, type: 'CHIROPRACTIC' }
          : null;
      })
      .filter(Boolean);
    return {
      ...baseData,
      ...(Object.keys(subjective).length > 0 && { subjective }),
      ...(Object.keys(objective).length > 0 && { objective }),
      ...(Object.keys(assessment).length > 0 && { assessment }),
      ...(Object.keys(plan).length > 0 && { plan }),
      treatments,
      icpc_codes: encounterData.icpc_codes || [],
      icd10_codes: encounterData.icd10_codes || [],
    };
  }, [encounterData, selectedTakster, patientId]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (encounterId) {
        return encountersAPI.update(encounterId, data);
      }
      return encountersAPI.create(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['encounters']);
      queryClient.invalidateQueries(['patient', patientId]);
      setAutoSaveStatus('saved');
      setLastSaved(new Date());

      const savedEncounterId = encounterId || response?.data?.id;
      const findings = examData.anatomySpineFindings;
      if (savedEncounterId && findings && Object.keys(findings).length > 0) {
        const findingsArray = Object.values(findings).map((f) => ({
          body_region: f.body_region,
          finding_type: f.finding_type || 'palpation',
          laterality: f.laterality || 'bilateral',
          severity: f.severity || 'moderate',
          direction: f.direction || null,
          note_text: f.note_text || null,
          is_positive: f.is_positive !== false,
          source: f.source || 'manual',
          confirmed: f.confirmed !== false,
        }));
        encountersAPI.saveAnatomyFindings(savedEncounterId, findingsArray).catch(() => {
          // Non-blocking
        });
      }

      if (!encounterId && response?.data?.id) {
        navigate(`/patients/${patientId}/encounter/${response.data.id}`, { replace: true });
      }
    },
    onError: () => setAutoSaveStatus('unsaved'),
  });

  const signMutation = useMutation({
    mutationFn: (id) => encountersAPI.sign(id),
    onSuccess: () => {
      setEncounterData((prev) => ({ ...prev, signed_at: new Date().toISOString() }));
      queryClient.invalidateQueries(['encounter', encounterId]);
      queryClient.invalidateQueries(['encounters']);
    },
  });

  const createAmendmentMutation = useMutation({
    mutationFn: (data) => encountersAPI.createAmendment(encounterId, data),
    onSuccess: () => {
      setShowAmendmentForm(false);
      setAmendmentContent('');
      setAmendmentReason('');
      refetchAmendments();
      queryClient.invalidateQueries(['amendments', encounterId]);
    },
  });

  const signAmendmentMutation = useMutation({
    mutationFn: (amendmentId) => encountersAPI.signAmendment(encounterId, amendmentId),
    onSuccess: () => {
      refetchAmendments();
      queryClient.invalidateQueries(['amendments', encounterId]);
    },
  });

  const handleSave = useCallback(
    () => saveMutation.mutate(buildSavePayload()),
    [saveMutation, buildSavePayload]
  );

  const handlePreSign = useCallback(() => setShowComplianceScan(true), [setShowComplianceScan]);

  const handleSignAndLock = useCallback(async () => {
    setShowComplianceScan(false);
    if (!encounterId) {
      try {
        const response = await encountersAPI.create(buildSavePayload());
        const newId = response?.data?.id;
        if (newId) {
          await encountersAPI.sign(newId);
          queryClient.invalidateQueries(['encounters']);
          navigate(`/patients/${patientId}/encounter/${newId}`, { replace: true });
        }
      } catch {
        // Error handled by mutation onError
      }
    } else {
      handleSave();
      setTimeout(() => signMutation.mutate(encounterId), 500);
    }
  }, [
    encounterId,
    buildSavePayload,
    queryClient,
    navigate,
    patientId,
    handleSave,
    signMutation,
    setShowComplianceScan,
  ]);

  const handleCreateAmendment = useCallback(() => {
    if (!amendmentContent.trim()) {
      return;
    }
    createAmendmentMutation.mutate({
      amendment_type: amendmentType,
      reason: amendmentReason,
      content: amendmentContent,
    });
  }, [amendmentContent, amendmentType, amendmentReason, createAmendmentMutation]);

  const triggerAutoSave = useCallback(() => {
    if (isSigned) {
      return;
    }
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (encounterId && !isSigned) {
        setAutoSaveStatus('saving');
        handleSave();
      }
    }, 3000);
  }, [isSigned, autoSaveTimerRef, encounterId, setAutoSaveStatus, handleSave]);

  // Auto-save effect
  useEffect(() => {
    if (encounterId && !isSigned) {
      setAutoSaveStatus('unsaved');
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [encounterData, selectedTakster]);

  return {
    saveMutation,
    signMutation,
    createAmendmentMutation,
    signAmendmentMutation,
    handleSave,
    handlePreSign,
    handleSignAndLock,
    handleCreateAmendment,
    triggerAutoSave,
  };
}
