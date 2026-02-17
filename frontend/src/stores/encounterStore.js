/**
 * Zustand Encounter Store
 * Consolidates all encounter state from EncounterContext and ClinicalEncounter
 * into a single, performant store with slices.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Default SOAP structure
const DEFAULT_ENCOUNTER_DATA = {
  patient_id: null,
  encounter_date: new Date().toISOString().split('T')[0],
  encounter_type: 'FOLLOWUP',
  duration_minutes: 30,
  subjective: {
    chief_complaint: '',
    history: '',
    onset: '',
    pain_description: '',
    aggravating_factors: '',
    relieving_factors: '',
  },
  objective: {
    observation: '',
    palpation: '',
    rom: '',
    ortho_tests: '',
    neuro_tests: '',
    posture: '',
  },
  assessment: {
    clinical_reasoning: '',
    differential_diagnosis: '',
    prognosis: '',
    red_flags_checked: true,
  },
  plan: {
    treatment: '',
    exercises: '',
    advice: '',
    follow_up: '',
    referrals: '',
  },
  icpc_codes: [],
  icd10_codes: [],
  treatments: [],
  vas_pain_start: 5,
  vas_pain_end: 3,
  signed_at: null,
};

// All exam visibility toggles with defaults
const DEFAULT_EXAM_STATE = {
  showNeuroExam: false,
  showOrthoExam: false,
  showExamProtocol: false,
  showClusterTests: false,
  showBodyDiagram: false,
  showROMTable: false,
  showRegionalExam: false,
  showNeurologicalExam: false,
  showOutcomeMeasures: false,
  showMMT: false,
  showCranialNerves: false,
  showSensoryExam: false,
  showPainAssessment: false,
  showDTR: false,
  showCoordination: false,
  showNerveTension: false,
  showRegionalDiagrams: false,
  showHeadacheAssessment: false,
  showTissueMarkers: false,
  showExercisePanel: false,
  // Exam data holders
  neuroExamData: null,
  orthoExamData: null,
  examProtocolData: {},
  clusterTestData: {},
  bodyDiagramMarkers: [],
  romTableData: {},
  neurologicalExamData: {},
  outcomeMeasureType: 'ndi',
  outcomeMeasureData: {},
  regionalExamData: {},
  mmtData: {},
  cranialNerveData: {},
  sensoryExamData: {},
  painAssessmentData: {},
  dtrData: {},
  coordinationData: {},
  nerveTensionData: {},
  regionalDiagramData: {},
  headacheData: {},
  tissueMarkerData: {},
  selectedRegion: 'shoulder',
};

const DEFAULT_UI_STATE = {
  activeSection: null,
  activeField: null,
  showAIAssistant: false,
  showTemplatePicker: false,
  showTakster: false,
  showAmendmentForm: false,
  showDiagnosisDropdown: false,
  showSALTBanner: true,
  showAIDiagnosisSidebar: false,
  showMacroHint: false,
  showKeyboardHelp: false,
  diagnosisSearch: '',
  errors: {},
  isLoading: false,
};

const DEFAULT_AUTOSAVE_STATE = {
  isDirty: false,
  lastSaved: null,
  isSaving: false,
  autoSaveStatus: 'saved', // 'saved' | 'saving' | 'unsaved'
};

// Takster data
const TAKSTER_NORWEGIAN = [
  { id: 'l214', code: 'L214', name: 'Manipulasjonsbehandling', price: 450 },
  { id: 'l215', code: 'L215', name: 'Bløtvevsbehandling', price: 350 },
  { id: 'l220', code: 'L220', name: 'Tillegg for øvelser/veiledning', price: 150 },
  { id: 'akutt', code: 'AKUTT', name: 'Akutt-tillegg (samme dag)', price: 200 },
];

const useEncounterStore = create(
  subscribeWithSelector((set, get) => ({
    // --- Encounter Data Slice ---
    encounterData: { ...DEFAULT_ENCOUNTER_DATA },
    selectedTakster: ['l214'],
    taksterNorwegian: TAKSTER_NORWEGIAN,
    redFlagAlerts: [],
    clinicalWarnings: [],
    aiSuggestions: null,
    aiLoading: false,
    // Amendment state
    amendmentContent: '',
    amendmentType: 'ADDENDUM',
    amendmentReason: '',

    // --- Exam State Slice ---
    ...DEFAULT_EXAM_STATE,

    // --- UI State Slice ---
    ...DEFAULT_UI_STATE,

    // --- AutoSave State Slice ---
    ...DEFAULT_AUTOSAVE_STATE,

    // --- Computed ---
    get isSigned() {
      return !!get().encounterData.signed_at;
    },

    get totalPrice() {
      const state = get();
      return state.taksterNorwegian
        .filter((t) => state.selectedTakster.includes(t.id))
        .reduce((sum, t) => sum + t.price, 0);
    },

    // --- Encounter Data Actions ---
    setEncounterData: (dataOrUpdater) =>
      set((state) => {
        const newData =
          typeof dataOrUpdater === 'function' ? dataOrUpdater(state.encounterData) : dataOrUpdater;
        return { encounterData: newData, isDirty: true, autoSaveStatus: 'unsaved' };
      }),

    updateField: (section, field, value) =>
      set((state) => ({
        encounterData: {
          ...state.encounterData,
          [section]: { ...state.encounterData[section], [field]: value },
        },
        isDirty: true,
        autoSaveStatus: 'unsaved',
      })),

    setEncounterType: (type) =>
      set((state) => ({
        encounterData: { ...state.encounterData, encounter_type: type },
        isDirty: true,
        autoSaveStatus: 'unsaved',
      })),

    addDiagnosis: (codeType, code) =>
      set((state) => {
        const key = codeType === 'icpc' ? 'icpc_codes' : 'icd10_codes';
        const existing = state.encounterData[key] || [];
        if (existing.some((c) => c.code === code.code)) {
          return state;
        }
        return {
          encounterData: {
            ...state.encounterData,
            [key]: [...existing, code],
          },
          isDirty: true,
          autoSaveStatus: 'unsaved',
        };
      }),

    removeDiagnosis: (codeType, codeValue) =>
      set((state) => {
        const key = codeType === 'icpc' ? 'icpc_codes' : 'icd10_codes';
        return {
          encounterData: {
            ...state.encounterData,
            [key]: (state.encounterData[key] || []).filter((c) => c.code !== codeValue),
          },
          isDirty: true,
          autoSaveStatus: 'unsaved',
        };
      }),

    setRedFlagAlerts: (alerts) => set({ redFlagAlerts: alerts }),
    setClinicalWarnings: (warnings) => set({ clinicalWarnings: warnings }),
    setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),
    setAiLoading: (loading) => set({ aiLoading: loading }),

    // Takster actions
    setSelectedTakster: (taksterOrUpdater) =>
      set((state) => ({
        selectedTakster:
          typeof taksterOrUpdater === 'function'
            ? taksterOrUpdater(state.selectedTakster)
            : taksterOrUpdater,
        isDirty: true,
        autoSaveStatus: 'unsaved',
      })),

    toggleTakst: (takstId) =>
      set((state) => ({
        selectedTakster: state.selectedTakster.includes(takstId)
          ? state.selectedTakster.filter((t) => t !== takstId)
          : [...state.selectedTakster, takstId],
        isDirty: true,
        autoSaveStatus: 'unsaved',
      })),

    // Amendment actions
    setAmendmentContent: (content) => set({ amendmentContent: content }),
    setAmendmentType: (type) => set({ amendmentType: type }),
    setAmendmentReason: (reason) => set({ amendmentReason: reason }),
    resetAmendmentForm: () =>
      set({
        showAmendmentForm: false,
        amendmentContent: '',
        amendmentReason: '',
      }),

    // --- Exam State Actions ---
    toggleExamPanel: (panelName) =>
      set((state) => ({
        [panelName]: !state[panelName],
      })),

    setExamData: (dataKey, data) => set({ [dataKey]: data }),

    setSelectedRegion: (region) => set({ selectedRegion: region }),

    // --- UI State Actions ---
    setActiveField: (field) => set({ activeField: field }),
    setActiveSection: (section) => set({ activeSection: section }),
    setShowAIAssistant: (show) => set({ showAIAssistant: show }),
    setShowTemplatePicker: (show) => set({ showTemplatePicker: show }),
    setShowTakster: (show) => set({ showTakster: show }),
    setShowAmendmentForm: (show) => set({ showAmendmentForm: show }),
    setShowDiagnosisDropdown: (show) => set({ showDiagnosisDropdown: show }),
    setDiagnosisSearch: (search) => set({ diagnosisSearch: search }),
    setErrors: (errors) => set({ errors }),
    setIsLoading: (loading) => set({ isLoading: loading }),

    // Generic UI toggle
    setUIFlag: (key, value) => set({ [key]: value }),

    // --- AutoSave Actions ---
    setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),
    setLastSaved: (date) => set({ lastSaved: date }),
    setIsSaving: (saving) => set({ isSaving: saving }),
    markSaved: () =>
      set({
        isDirty: false,
        autoSaveStatus: 'saved',
        lastSaved: new Date(),
        isSaving: false,
      }),
    markSaving: () => set({ isSaving: true, autoSaveStatus: 'saving' }),
    markUnsaved: () => set({ isDirty: true, autoSaveStatus: 'unsaved', isSaving: false }),

    // --- Reset ---
    resetEncounter: (patientId) =>
      set({
        encounterData: { ...DEFAULT_ENCOUNTER_DATA, patient_id: patientId },
        selectedTakster: ['l214'],
        redFlagAlerts: [],
        clinicalWarnings: [],
        aiSuggestions: null,
        aiLoading: false,
        ...DEFAULT_EXAM_STATE,
        ...DEFAULT_UI_STATE,
        ...DEFAULT_AUTOSAVE_STATE,
      }),

    // Load existing encounter data (from API response)
    loadEncounter: (data) =>
      set((state) => ({
        encounterData: {
          ...state.encounterData,
          ...data,
          encounter_date: data.encounter_date
            ? new Date(data.encounter_date).toISOString().split('T')[0]
            : state.encounterData.encounter_date,
        },
        redFlagAlerts: data.redFlagAlerts || [],
        clinicalWarnings: data.clinicalWarnings || [],
        isDirty: false,
        autoSaveStatus: 'saved',
      })),
  }))
);

// Selector helpers for optimized re-renders
export const selectEncounterData = (state) => state.encounterData;
export const selectSubjective = (state) => state.encounterData.subjective;
export const selectObjective = (state) => state.encounterData.objective;
export const selectAssessment = (state) => state.encounterData.assessment;
export const selectPlan = (state) => state.encounterData.plan;
export const selectIsSigned = (state) => !!state.encounterData.signed_at;
export const selectAutoSave = (state) => ({
  isDirty: state.isDirty,
  lastSaved: state.lastSaved,
  isSaving: state.isSaving,
  autoSaveStatus: state.autoSaveStatus,
});
export const selectTotalPrice = (state) =>
  state.taksterNorwegian
    .filter((t) => state.selectedTakster.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);
export const selectDiagnoses = (state) => ({
  icpc: state.encounterData.icpc_codes || [],
  icd10: state.encounterData.icd10_codes || [],
});

export { DEFAULT_ENCOUNTER_DATA, TAKSTER_NORWEGIAN };
export default useEncounterStore;
