import { useState } from 'react';

/**
 * Panel visibility toggles for all exam/tool panels in ClinicalEncounter.
 * Each panel has a `show*` boolean and `setShow*` setter.
 */
export function usePanelVisibility() {
  // Core panels
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showNeuroExam, setShowNeuroExam] = useState(false);
  const [showOrthoExam, setShowOrthoExam] = useState(false);
  const [showExamProtocol, setShowExamProtocol] = useState(false);
  const [showClusterTests, setShowClusterTests] = useState(false);
  const [showBodyDiagram, setShowBodyDiagram] = useState(false);
  const [showROMTable, setShowROMTable] = useState(false);
  const [showNeurologicalExam, setShowNeurologicalExam] = useState(false);
  const [showOutcomeMeasures, setShowOutcomeMeasures] = useState(false);
  const [showRegionalExam, setShowRegionalExam] = useState(false);
  const [showExercisePanel, setShowExercisePanel] = useState(false);

  // Specialized exam panels
  const [showMMT, setShowMMT] = useState(false);
  const [showCranialNerves, setShowCranialNerves] = useState(false);
  const [showSensoryExam, setShowSensoryExam] = useState(false);
  const [showPainAssessment, setShowPainAssessment] = useState(false);
  const [showDTR, setShowDTR] = useState(false);
  const [showCoordination, setShowCoordination] = useState(false);
  const [showNerveTension, setShowNerveTension] = useState(false);
  const [showRegionalDiagrams, setShowRegionalDiagrams] = useState(false);
  const [showHeadacheAssessment, setShowHeadacheAssessment] = useState(false);
  const [showTissueMarkers, setShowTissueMarkers] = useState(false);
  const [showAnatomyPanel, setShowAnatomyPanel] = useState(false);

  // UI/UX toggles
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  const [showMacroHint, setShowMacroHint] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showSALTBanner, setShowSALTBanner] = useState(true);
  const [saltBannerExpanded, setSaltBannerExpanded] = useState(false);
  const [showAIDiagnosisSidebar, setShowAIDiagnosisSidebar] = useState(false);

  return {
    showAIAssistant,
    setShowAIAssistant,
    showTemplatePicker,
    setShowTemplatePicker,
    showNeuroExam,
    setShowNeuroExam,
    showOrthoExam,
    setShowOrthoExam,
    showExamProtocol,
    setShowExamProtocol,
    showClusterTests,
    setShowClusterTests,
    showBodyDiagram,
    setShowBodyDiagram,
    showROMTable,
    setShowROMTable,
    showNeurologicalExam,
    setShowNeurologicalExam,
    showOutcomeMeasures,
    setShowOutcomeMeasures,
    showRegionalExam,
    setShowRegionalExam,
    showExercisePanel,
    setShowExercisePanel,
    showMMT,
    setShowMMT,
    showCranialNerves,
    setShowCranialNerves,
    showSensoryExam,
    setShowSensoryExam,
    showPainAssessment,
    setShowPainAssessment,
    showDTR,
    setShowDTR,
    showCoordination,
    setShowCoordination,
    showNerveTension,
    setShowNerveTension,
    showRegionalDiagrams,
    setShowRegionalDiagrams,
    showHeadacheAssessment,
    setShowHeadacheAssessment,
    showTissueMarkers,
    setShowTissueMarkers,
    showAnatomyPanel,
    setShowAnatomyPanel,
    showDiagnosisDropdown,
    setShowDiagnosisDropdown,
    showMacroHint,
    setShowMacroHint,
    showKeyboardHelp,
    setShowKeyboardHelp,
    showSALTBanner,
    setShowSALTBanner,
    saltBannerExpanded,
    setSaltBannerExpanded,
    showAIDiagnosisSidebar,
    setShowAIDiagnosisSidebar,
  };
}
