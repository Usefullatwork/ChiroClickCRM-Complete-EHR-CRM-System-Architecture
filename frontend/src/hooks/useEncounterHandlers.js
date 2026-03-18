import { useCallback } from 'react';
import toast from '../utils/toast';
import { useTranslation } from '../i18n';
import { taksterNorwegian } from '../components/encounter/TaksterPanel';

export function useEncounterHandlers({
  encounterData,
  setEncounterData,
  examData,
  activeField,
  palpationRef,
  previousEncounters,
  latestAnatomyFindings,
  setRedFlagAlerts,
  setAutoSaveStatus,
  setSelectedTakster,
}) {
  const { t } = useTranslation('clinical');

  const updateField = useCallback(
    (section, field, value) => {
      setEncounterData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    },
    [setEncounterData]
  );

  const handleQuickPhrase = useCallback(
    (phrase, section, field) => {
      const currentValue = encounterData[section][field] || '';
      updateField(section, field, `${currentValue + (currentValue ? '\n' : '')}\u2022 ${phrase}`);
    },
    [encounterData, updateField]
  );

  const handleTemplateSelect = useCallback(
    (templateText) => {
      if (!activeField) {
        return;
      }
      const [section, field] = activeField.split('.');
      const currentValue = encounterData[section]?.[field] || '';
      updateField(section, field, currentValue + (currentValue ? '\n' : '') + templateText);
    },
    [activeField, encounterData, updateField]
  );

  const handleSpineTextInsert = useCallback(
    (text) => {
      const currentValue = encounterData.objective.palpation || '';
      const newValue =
        currentValue + (currentValue && !currentValue.endsWith(' ') ? ' ' : '') + text;
      setEncounterData((prev) => ({
        ...prev,
        objective: { ...prev.objective, palpation: newValue },
      }));
      setAutoSaveStatus('unsaved');
      if (palpationRef.current) {
        palpationRef.current.focus();
        setTimeout(() => {
          if (palpationRef.current) {
            palpationRef.current.selectionStart = palpationRef.current.value.length;
            palpationRef.current.selectionEnd = palpationRef.current.value.length;
          }
        }, 0);
      }
    },
    [encounterData.objective.palpation, setEncounterData, setAutoSaveStatus, palpationRef]
  );

  const handleCarryForward = useCallback(() => {
    if (!latestAnatomyFindings || latestAnatomyFindings.length === 0) {
      return;
    }

    const carriedFindings = {};
    for (const f of latestAnatomyFindings) {
      carriedFindings[f.body_region] = {
        ...f,
        source: 'carried_forward',
        confirmed: false,
      };
    }
    examData.setAnatomySpineFindings(carriedFindings);
    setAutoSaveStatus('unsaved');
  }, [latestAnatomyFindings, examData, setAutoSaveStatus]);

  const handleNeuroExamChange = useCallback(
    (neuroResult) => {
      examData.setNeuroExamData(neuroResult);
      if (neuroResult?.narrative) {
        updateField('objective', 'neuro_tests', neuroResult.narrative);
      }
      if (neuroResult?.redFlags?.length > 0) {
        const neuroRedFlags = neuroResult.redFlags.map(
          (rf) => `NEURO: ${rf.description} - ${rf.action}`
        );
        setRedFlagAlerts((prev) => [
          ...prev.filter((a) => !a.startsWith('NEURO:')),
          ...neuroRedFlags,
        ]);
      }
    },
    [examData, updateField, setRedFlagAlerts]
  );

  const handleOrthoExamChange = useCallback(
    (orthoResult) => {
      examData.setOrthoExamData(orthoResult);
      if (orthoResult?.narrative) {
        updateField('objective', 'ortho_tests', orthoResult.narrative);
      }
      if (orthoResult?.redFlags?.length > 0) {
        const orthoRedFlags = orthoResult.redFlags.map(
          (rf) => `ORTHO: ${rf.testName?.no || rf.clusterName?.no} - ${rf.action}`
        );
        setRedFlagAlerts((prev) => [
          ...prev.filter((a) => !a.startsWith('ORTHO:')),
          ...orthoRedFlags,
        ]);
      }
    },
    [examData, updateField, setRedFlagAlerts]
  );

  const applyEncounterTypeDefaults = useCallback(
    (type) => {
      setEncounterData((prev) => {
        const updates = { ...prev, encounter_type: type };
        switch (type) {
          case 'INITIAL':
            updates.duration_minutes = 45;
            break;
          case 'FOLLOWUP':
            updates.duration_minutes = 20;
            break;
          case 'MAINTENANCE':
            updates.duration_minutes = 15;
            break;
          case 'REEXAM':
            updates.duration_minutes = 30;
            break;
          case 'EMERGENCY':
            updates.duration_minutes = 30;
            break;
          default:
            break;
        }
        return updates;
      });
    },
    [setEncounterData]
  );

  const handleSALT = useCallback(
    (section = null) => {
      if (!previousEncounters) {
        toast.info(t('noPreviousEncounter'));
        return;
      }
      const prev = previousEncounters;
      if (section) {
        if (prev[section]) {
          setEncounterData((current) => ({
            ...current,
            [section]: { ...current[section], ...prev[section] },
          }));
        }
      } else {
        setEncounterData((current) => ({
          ...current,
          subjective: prev.subjective || current.subjective,
          objective: prev.objective || current.objective,
          assessment: prev.assessment || current.assessment,
          plan: prev.plan || current.plan,
          vas_pain_start: prev.vas_pain_end || current.vas_pain_start,
        }));
        if (prev.treatments?.length > 0) {
          const prevTakstIds = prev.treatments
            .map((tr) => taksterNorwegian.find((tak) => tak.code === tr.code)?.id)
            .filter(Boolean);
          if (prevTakstIds.length > 0) {
            setSelectedTakster(prevTakstIds);
          }
        }
      }
      setAutoSaveStatus('unsaved');
    },
    [previousEncounters, t, setEncounterData, setSelectedTakster, setAutoSaveStatus]
  );

  return {
    updateField,
    handleQuickPhrase,
    handleTemplateSelect,
    handleSpineTextInsert,
    handleCarryForward,
    handleNeuroExamChange,
    handleOrthoExamChange,
    applyEncounterTypeDefaults,
    handleSALT,
  };
}
