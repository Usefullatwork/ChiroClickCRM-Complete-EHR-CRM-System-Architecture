// Assessment Components - Easy-to-use clinical assessment interface
// Inspired by Jane App, DrChrono, and ChiroTouch

// Quick checkbox grids for findings
export { default as QuickCheckboxGrid } from './QuickCheckboxGrid';
export {
  PAIN_QUALITY_OPTIONS,
  AGGRAVATING_FACTORS_OPTIONS,
  RELIEVING_FACTORS_OPTIONS,
  OBSERVATION_FINDINGS_OPTIONS,
  PALPATION_FINDINGS_OPTIONS,
  ROM_FINDINGS_OPTIONS,
  ORTHO_TESTS_OPTIONS,
  NEURO_TESTS_OPTIONS,
  TREATMENT_OPTIONS,
  EXERCISE_OPTIONS
} from './QuickCheckboxGrid';

// Smart text inputs with phrase macros
export { default as SmartTextInput } from './SmartTextInput';
export {
  CHIEF_COMPLAINT_PHRASES,
  ONSET_PHRASES,
  HISTORY_PHRASES,
  CLINICAL_REASONING_PHRASES,
  FOLLOW_UP_PHRASES,
  ADVICE_PHRASES
} from './SmartTextInput';

// Body diagram for pain location
export { default as BodyDiagram, QuickRegionSelect } from './BodyDiagram';

// Spine diagram with vertebra-level subluxation markers
export { default as SpineDiagram, QuickVertebraSelect } from './SpineDiagram';

// VAS Pain Scale
export { default as VASPainScale, VASComparisonDisplay } from './VASPainScale';

// Outcome assessments (ODI, NDI, PSFS)
export { default as OutcomeAssessment, QUESTIONNAIRE_TYPES } from './OutcomeAssessment';

// Problem list panel
export { default as ProblemList, ProblemListCompact } from './ProblemList';

// Treatment plan tracker
export { default as TreatmentPlanTracker, VisitCounter } from './TreatmentPlanTracker';

// Narrative generator
export {
  default as NarrativeGenerator,
  generateSubjectiveNarrative,
  generateObjectiveNarrative,
  generateAssessmentNarrative,
  generatePlanNarrative,
  generateFullNarrative,
  generateEncounterSummary
} from './NarrativeGenerator';

// Interactive Body Chart with drawing tools (Jane App style)
export {
  default as BodyChart,
  BodyChartCompact,
  BodyChartGallery,
  BODY_VIEWS,
  CHART_COLORS
} from './BodyChart';

// Template Library with discipline categories (Jane App style)
export {
  default as TemplateLibrary,
  TemplateLibraryCompact,
  DISCIPLINES,
  TEMPLATE_DATABASE
} from './TemplateLibrary';

// =============================================================================
// PHASE 1: "15-Second Note" Engine Components
// =============================================================================

// SALT - Same As Last Treatment (ChiroTouch style)
export {
  default as SALTButton,
  SALTButtonCompact
} from './SALTButton';

// Hot Button Macro Matrix (ChiroTouch style)
export {
  default as MacroMatrix,
  MacroMatrixInline,
  DEFAULT_MACROS
} from './MacroMatrix';

// Slash Commands text expansion (Jane App style)
export {
  default as SlashCommandTextArea,
  useSlashCommands,
  SlashCommandMenu,
  SlashCommandReference,
  DEFAULT_COMMANDS
} from './SlashCommands';

// =============================================================================
// COMPLIANCE & DOCUMENTATION ENGINE
// =============================================================================

// Compliance Engine with conditional logic gates
export {
  default as CompliancePanel,
  ComplianceIndicator,
  checkCompliance,
  TREATMENT_QUALIFIERS,
  DIAGNOSIS_TREATMENT_RULES,
  RED_FLAGS
} from './ComplianceEngine';

// Print Preview with narrative formatting (Attorney Test)
export {
  default as PrintPreview,
  generateSubjectiveNarrative as generatePrintSubjective,
  generateObjectiveNarrative as generatePrintObjective,
  generateAssessmentNarrative as generatePrintAssessment,
  generatePlanNarrative as generatePrintPlan,
  generateSpinalNarrative
} from './PrintPreview';
