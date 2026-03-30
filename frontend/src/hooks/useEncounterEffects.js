/**
 * Side-effect hooks for ClinicalEncounter: elapsed timer, keyboard shortcuts,
 * and red-flag SOAP text screening.
 */
import { useEffect } from 'react';

export function useEncounterEffects({
  encounterStartTime,
  setElapsedTime,
  timerIntervalRef,
  isSigned,
  encounterId,
  handleSave,
  signMutation,
  sectionRefs,
  setShowTemplatePicker,
  setShowAIAssistant,
  setShowKeyboardHelp,
  setShowAmendmentForm,
  handleSALT,
  encounterData,
  screenForRedFlags,
}) {
  // Elapsed timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - encounterStartTime) / 1000);
      const mins = String(Math.floor(diff / 60)).padStart(2, '0');
      const secs = String(diff % 60).padStart(2, '0');
      setElapsedTime(`${mins}:${secs}`);
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [encounterStartTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (!isSigned) {
          handleSave();
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (!isSigned && encounterId) {
          handleSave();
          setTimeout(() => signMutation.mutate(encounterId), 500);
        }
      }
      if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const sections = ['subjective', 'objective', 'assessment', 'plan'];
        const ref = sectionRefs.current[sections[parseInt(e.key) - 1]];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowTemplatePicker(true);
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (!isSigned) {
          handleSALT();
        }
      }
      if (e.key === 'Escape') {
        setShowTemplatePicker(false);
        setShowAIAssistant(false);
        setShowKeyboardHelp(false);
        setShowAmendmentForm(false);
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardHelp((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSigned, encounterId]);

  // Screen SOAP text for red flags when subjective/assessment fields change
  useEffect(() => {
    const textToScreen = [
      encounterData.subjective?.chief_complaint,
      encounterData.subjective?.history,
      encounterData.assessment?.clinical_reasoning,
    ]
      .filter(Boolean)
      .join(' ');

    if (textToScreen.length > 10) {
      screenForRedFlags(textToScreen);
    }
  }, [
    encounterData.subjective?.chief_complaint,
    encounterData.subjective?.history,
    encounterData.assessment?.clinical_reasoning,
    screenForRedFlags,
  ]);
}
