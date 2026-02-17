/**
 * SystemicExamFlow.jsx
 * Comprehensive systemic examination flow component
 * Provides structured assessment for systemic conditions
 */

import _React, { useState, useCallback } from 'react';

// ============================================================================
// SYSTEMIC EXAM SECTIONS
// ============================================================================

const EXAM_SECTIONS = {
  vitals: {
    title: { en: 'Vital Signs', no: 'Vitale Tegn' },
    icon: '🫀',
    fields: [
      {
        id: 'temperature',
        label: { en: 'Temperature', no: 'Temperatur' },
        unit: '°C',
        normal: '37.0',
      },
      { id: 'pulse', label: { en: 'Pulse', no: 'Puls' }, unit: 'bpm', normal: '60-100' },
      {
        id: 'respiration',
        label: { en: 'Respiration', no: 'Respirasjon' },
        unit: 'bpm',
        normal: '12-20',
      },
      {
        id: 'bpRight',
        label: { en: 'BP Right Arm', no: 'BT Høyre Arm' },
        unit: 'mmHg',
        normal: '<120/80',
      },
      {
        id: 'bpLeft',
        label: { en: 'BP Left Arm', no: 'BT Venstre Arm' },
        unit: 'mmHg',
        normal: '<120/80',
      },
      {
        id: 'o2Sat',
        label: { en: 'O2 Saturation', no: 'O2 Metning' },
        unit: '%',
        normal: '95-100',
      },
    ],
  },
  anthropometrics: {
    title: { en: 'Anthropometrics', no: 'Antropometri' },
    icon: '📏',
    fields: [
      { id: 'height', label: { en: 'Height', no: 'Høyde' }, unit: 'cm' },
      { id: 'weight', label: { en: 'Weight', no: 'Vekt' }, unit: 'kg' },
      { id: 'bmi', label: { en: 'BMI', no: 'BMI' }, unit: 'kg/m²', calculated: true },
      { id: 'waist', label: { en: 'Waist Circumference', no: 'Midjemål' }, unit: 'cm' },
    ],
  },
  cranialNerves: {
    title: { en: 'Cranial Nerves', no: 'Hjernenerver' },
    icon: '🧠',
    fields: [
      {
        id: 'cn1',
        label: { en: 'CN I (Olfactory) - Smell', no: 'CN I (Olfaktorius) - Lukt' },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn2',
        label: { en: 'CN II (Optic) - Vision', no: 'CN II (Optikus) - Syn' },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn3456',
        label: { en: 'CN III, IV, VI - Eye Movement', no: 'CN III, IV, VI - Øyebevegelse' },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn5',
        label: {
          en: 'CN V (Trigeminal) - Sensation/Bite',
          no: 'CN V (Trigeminus) - Sensasjon/Bitt',
        },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn7',
        label: { en: 'CN VII (Facial) - Expression', no: 'CN VII (Facialis) - Uttrykk' },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn8',
        label: {
          en: 'CN VIII (Vestibulocochlear) - Hearing',
          no: 'CN VIII (Vestibulocochlearis) - Hørsel',
        },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn910',
        label: { en: 'CN IX, X (Glossopharyngeal/Vagus)', no: 'CN IX, X (Glossopharyngeus/Vagus)' },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn11',
        label: {
          en: 'CN XI (Accessory) - SCM/Trapezius',
          no: 'CN XI (Accessorius) - SCM/Trapezius',
        },
        options: ['Intact', 'Impaired', 'Absent'],
      },
      {
        id: 'cn12',
        label: { en: 'CN XII (Hypoglossal) - Tongue', no: 'CN XII (Hypoglossus) - Tunge' },
        options: ['Intact', 'Impaired', 'Absent'],
      },
    ],
  },
  upperExtremityNeuro: {
    title: { en: 'Upper Extremity Neurological', no: 'Øvre Ekstremitet Nevrologisk' },
    icon: '💪',
    subsections: {
      reflexes: {
        title: { en: 'Deep Tendon Reflexes', no: 'Dype Senereflekser' },
        fields: [
          {
            id: 'bicepsL',
            label: { en: 'Biceps (C5) Left', no: 'Biceps (C5) Venstre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'bicepsR',
            label: { en: 'Biceps (C5) Right', no: 'Biceps (C5) Høyre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'brachioradL',
            label: { en: 'Brachioradialis (C6) Left', no: 'Brachioradialis (C6) Venstre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'brachioradR',
            label: { en: 'Brachioradialis (C6) Right', no: 'Brachioradialis (C6) Høyre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'tricepsL',
            label: { en: 'Triceps (C7) Left', no: 'Triceps (C7) Venstre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'tricepsR',
            label: { en: 'Triceps (C7) Right', no: 'Triceps (C7) Høyre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
        ],
      },
      motor: {
        title: { en: 'Motor Strength', no: 'Motorisk Styrke' },
        fields: [
          {
            id: 'deltoidL',
            label: { en: 'Deltoid (C5-C6) Left', no: 'Deltoid (C5-C6) Venstre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'deltoidR',
            label: { en: 'Deltoid (C5-C6) Right', no: 'Deltoid (C5-C6) Høyre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'wristExtL',
            label: {
              en: 'Wrist Extensors (C6-C7) Left',
              no: 'Håndleddsekstensorer (C6-C7) Venstre',
            },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'wristExtR',
            label: {
              en: 'Wrist Extensors (C6-C7) Right',
              no: 'Håndleddsekstensorer (C6-C7) Høyre',
            },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'fingerFlexL',
            label: { en: 'Finger Flexors (C8) Left', no: 'Fingerfleksorer (C8) Venstre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'fingerFlexR',
            label: { en: 'Finger Flexors (C8) Right', no: 'Fingerfleksorer (C8) Høyre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'interosseiL',
            label: { en: 'Interossei (T1) Left', no: 'Interossei (T1) Venstre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'interosseiR',
            label: { en: 'Interossei (T1) Right', no: 'Interossei (T1) Høyre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
        ],
      },
      sensory: {
        title: { en: 'Sensory', no: 'Sensorisk' },
        fields: [
          {
            id: 'lightTouchUE',
            label: { en: 'Light Touch', no: 'Lett Berøring' },
            options: ['Intact', 'Decreased', 'Absent'],
          },
          {
            id: 'sharpDullUE',
            label: { en: 'Sharp/Dull', no: 'Skarp/Stump' },
            options: ['Intact', 'Decreased', 'Absent'],
          },
          {
            id: 'vibrationUE',
            label: { en: 'Vibration', no: 'Vibrasjon' },
            options: ['Intact', 'Decreased', 'Absent'],
          },
        ],
      },
    },
  },
  lowerExtremityNeuro: {
    title: { en: 'Lower Extremity Neurological', no: 'Nedre Ekstremitet Nevrologisk' },
    icon: '🦵',
    subsections: {
      reflexes: {
        title: { en: 'Deep Tendon Reflexes', no: 'Dype Senereflekser' },
        fields: [
          {
            id: 'patellaL',
            label: { en: 'Patellar (L4) Left', no: 'Patellær (L4) Venstre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'patellaR',
            label: { en: 'Patellar (L4) Right', no: 'Patellær (L4) Høyre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'achillesL',
            label: { en: 'Achilles (S1) Left', no: 'Achilles (S1) Venstre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
          {
            id: 'achillesR',
            label: { en: 'Achilles (S1) Right', no: 'Achilles (S1) Høyre' },
            options: ['0', '1+', '2+', '3+', '4+'],
          },
        ],
      },
      motor: {
        title: { en: 'Motor Strength', no: 'Motorisk Styrke' },
        fields: [
          {
            id: 'hipFlexL',
            label: { en: 'Hip Flexion (L2-L3) Left', no: 'Hoftefleksjon (L2-L3) Venstre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'hipFlexR',
            label: { en: 'Hip Flexion (L2-L3) Right', no: 'Hoftefleksjon (L2-L3) Høyre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'kneeExtL',
            label: { en: 'Knee Extension (L3-L4) Left', no: 'Kneekstensjon (L3-L4) Venstre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'kneeExtR',
            label: { en: 'Knee Extension (L3-L4) Right', no: 'Kneekstensjon (L3-L4) Høyre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'ankleDorsiL',
            label: {
              en: 'Ankle Dorsiflexion (L4-L5) Left',
              no: 'Ankeldorsifleksjon (L4-L5) Venstre',
            },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'ankleDorsiR',
            label: {
              en: 'Ankle Dorsiflexion (L4-L5) Right',
              no: 'Ankeldorsifleksjon (L4-L5) Høyre',
            },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'ehlL',
            label: { en: 'Great Toe Extension (L5) Left', no: 'Stortåekstensjon (L5) Venstre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'ehlR',
            label: { en: 'Great Toe Extension (L5) Right', no: 'Stortåekstensjon (L5) Høyre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'anklePlantarL',
            label: {
              en: 'Ankle Plantarflexion (S1) Left',
              no: 'Ankelplantarfleksjon (S1) Venstre',
            },
            options: ['0', '1', '2', '3', '4', '5'],
          },
          {
            id: 'anklePlantarR',
            label: { en: 'Ankle Plantarflexion (S1) Right', no: 'Ankelplantarfleksjon (S1) Høyre' },
            options: ['0', '1', '2', '3', '4', '5'],
          },
        ],
      },
      pathological: {
        title: { en: 'Pathological Reflexes', no: 'Patologiske Reflekser' },
        fields: [
          {
            id: 'babinskiL',
            label: { en: 'Babinski Left', no: 'Babinski Venstre' },
            options: ['Negative', 'Positive', 'Equivocal'],
          },
          {
            id: 'babinskiR',
            label: { en: 'Babinski Right', no: 'Babinski Høyre' },
            options: ['Negative', 'Positive', 'Equivocal'],
          },
          {
            id: 'clonusL',
            label: { en: 'Clonus Left', no: 'Klonus Venstre' },
            options: ['Absent', 'Present'],
          },
          {
            id: 'clonusR',
            label: { en: 'Clonus Right', no: 'Klonus Høyre' },
            options: ['Absent', 'Present'],
          },
        ],
      },
    },
  },
  cardiovascular: {
    title: { en: 'Cardiovascular', no: 'Kardiovaskulær' },
    icon: '❤️',
    fields: [
      {
        id: 'heartSounds',
        label: { en: 'Heart Sounds', no: 'Hjertelyder' },
        options: ['Normal S1/S2', 'Murmur', 'Gallop', 'Rub'],
      },
      {
        id: 'carotidBruit',
        label: { en: 'Carotid Bruit', no: 'Carotis Bilyd' },
        options: ['Absent', 'Present Right', 'Present Left', 'Present Bilateral'],
      },
      {
        id: 'jvd',
        label: { en: 'Jugular Venous Distension', no: 'Jugular Venetrykk' },
        options: ['Normal', 'Elevated'],
      },
      {
        id: 'edemaLE',
        label: { en: 'Lower Extremity Edema', no: 'Ødem Nedre Ekstremitet' },
        options: ['None', 'Trace', '1+', '2+', '3+', '4+'],
      },
      {
        id: 'dorsalisPedisL',
        label: { en: 'Dorsalis Pedis Pulse Left', no: 'Dorsalis Pedis Puls Venstre' },
        options: ['0', '1+', '2+', '3+'],
      },
      {
        id: 'dorsalisPedisR',
        label: { en: 'Dorsalis Pedis Pulse Right', no: 'Dorsalis Pedis Puls Høyre' },
        options: ['0', '1+', '2+', '3+'],
      },
      {
        id: 'posteriorTibialL',
        label: { en: 'Posterior Tibial Pulse Left', no: 'Posterior Tibial Puls Venstre' },
        options: ['0', '1+', '2+', '3+'],
      },
      {
        id: 'posteriorTibialR',
        label: { en: 'Posterior Tibial Pulse Right', no: 'Posterior Tibial Puls Høyre' },
        options: ['0', '1+', '2+', '3+'],
      },
    ],
  },
  respiratory: {
    title: { en: 'Respiratory', no: 'Respiratorisk' },
    icon: '🫁',
    fields: [
      {
        id: 'breathSounds',
        label: { en: 'Breath Sounds', no: 'Respirasjonslyder' },
        options: ['Clear', 'Wheezes', 'Crackles', 'Rhonchi', 'Diminished'],
      },
      {
        id: 'chestExpansion',
        label: { en: 'Chest Expansion', no: 'Brystekspansjon' },
        options: ['Symmetric', 'Asymmetric'],
      },
      {
        id: 'percussion',
        label: { en: 'Percussion', no: 'Perkusjon' },
        options: ['Resonant', 'Dull', 'Hyperresonant'],
      },
      {
        id: 'respiratoryEffort',
        label: { en: 'Respiratory Effort', no: 'Respiratorisk Anstrengelse' },
        options: ['Normal', 'Labored', 'Accessory Muscle Use'],
      },
    ],
  },
  abdominal: {
    title: { en: 'Abdominal', no: 'Abdominal' },
    icon: '🩺',
    fields: [
      {
        id: 'bowelSounds',
        label: { en: 'Bowel Sounds', no: 'Tarmlyder' },
        options: ['Normal', 'Hyperactive', 'Hypoactive', 'Absent'],
      },
      {
        id: 'tenderness',
        label: { en: 'Tenderness', no: 'Ømhet' },
        options: [
          'None',
          'RUQ',
          'LUQ',
          'RLQ',
          'LLQ',
          'Epigastric',
          'Periumbilical',
          'Suprapubic',
          'Diffuse',
        ],
      },
      {
        id: 'guarding',
        label: { en: 'Guarding/Rigidity', no: 'Muskeldefense/Rigiditet' },
        options: ['Absent', 'Voluntary', 'Involuntary'],
      },
      {
        id: 'hepatomegaly',
        label: { en: 'Hepatomegaly', no: 'Hepatomegali' },
        options: ['Absent', 'Present'],
      },
      {
        id: 'splenomegaly',
        label: { en: 'Splenomegaly', no: 'Splenomegali' },
        options: ['Absent', 'Present'],
      },
      {
        id: 'aorticPulsation',
        label: { en: 'Aortic Pulsation', no: 'Aortapulsasjon' },
        options: ['Normal', 'Widened/Pulsatile'],
      },
      {
        id: 'abdominalBruit',
        label: { en: 'Abdominal Bruit', no: 'Abdominal Bilyd' },
        options: ['Absent', 'Present'],
      },
    ],
  },
};

// ============================================================================
// SYSTEMIC CONDITIONS
// ============================================================================

const SYSTEMIC_CONDITIONS = {
  aaa: {
    name: { en: 'Abdominal Aortic Aneurysm', no: 'Abdominalt Aortaaneurisme' },
    redFlags: ['Pulsatile abdominal mass', 'Hypotension', 'Back/flank pain', 'Syncope'],
    riskFactors: ['Age >50', 'Male', 'Smoking', 'Hypertension', 'Family history', 'COPD'],
  },
  alzheimers: {
    name: { en: "Alzheimer's Disease", no: 'Alzheimers Sykdom' },
    screeningTool: 'MMSE',
    redFlags: ['Rapid cognitive decline', 'Focal neurological signs', 'Early personality change'],
  },
  ankylosingSpondylitis: {
    name: { en: 'Ankylosing Spondylitis', no: 'Bekhterevs Sykdom' },
    criteria: [
      'Age <40',
      'Insidious onset',
      'Morning stiffness >30min',
      'Improves with exercise',
      'No improvement with rest',
    ],
    tests: ["Schober's Test", 'Chest expansion', 'SI joint tenderness'],
  },
  bipolar: {
    name: { en: 'Bipolar Disorder', no: 'Bipolar Lidelse' },
    phases: ['Manic', 'Depressive', 'Euthymic', 'Mixed'],
    screeningRequired: true,
  },
  cfs: {
    name: { en: 'Chronic Fatigue Syndrome', no: 'Kronisk Utmattelsessyndrom' },
    criteria: [
      'Fatigue >6 months',
      'Post-exertional malaise',
      'Unrefreshing sleep',
      'Cognitive difficulties',
    ],
  },
  crps: {
    name: { en: 'Complex Regional Pain Syndrome', no: 'Komplekst Regionalt Smertesyndrom' },
    stages: ['Stage 1 (1-3 months)', 'Stage 2 (3-6 months)', 'Stage 3 (>6 months)'],
    signs: ['Allodynia', 'Hyperalgesia', 'Edema', 'Skin changes', 'Temperature asymmetry'],
  },
  depression: {
    name: { en: 'Major Depressive Disorder', no: 'Alvorlig Depressiv Lidelse' },
    screeningTool: 'PHQ-9',
    suicideRiskAssessment: true,
  },
  diabetes: {
    name: { en: 'Diabetes Mellitus', no: 'Diabetes Mellitus' },
    types: ['Type 1', 'Type 2', 'Gestational', 'Pre-diabetes'],
    complications: ['Retinopathy', 'Nephropathy', 'Neuropathy', 'Cardiovascular'],
  },
  dyslipidemia: {
    name: { en: 'Dyslipidemia', no: 'Dyslipidemi' },
    targets: { LDL: '<100', HDL: '>40/50', TG: '<150', TC: '<200' },
  },
  fibromyalgia: {
    name: { en: 'Fibromyalgia', no: 'Fibromyalgi' },
    tenderPoints: 18,
    diagnosticThreshold: 11,
  },
  gout: {
    name: { en: 'Gout', no: 'Urinsyregikt' },
    classicPresentation: '1st MTP (podagra)',
    triggers: ['Alcohol', 'Purine-rich foods', 'Dehydration', 'Trauma'],
  },
  hypertension: {
    name: { en: 'Hypertension', no: 'Hypertensjon' },
    classification: [
      { stage: 'Normal', systolic: '<120', diastolic: '<80' },
      { stage: 'Elevated', systolic: '120-129', diastolic: '<80' },
      { stage: 'Stage 1', systolic: '130-139', diastolic: '80-89' },
      { stage: 'Stage 2', systolic: '>=140', diastolic: '>=90' },
    ],
  },
  osteoarthritis: {
    name: { en: 'Osteoarthritis', no: 'Artrose' },
    commonJoints: ['Knee', 'Hip', 'Spine', 'Hands'],
    findings: ['Crepitus', 'Joint enlargement', 'Reduced ROM', 'Pain with activity'],
  },
  osteoporosis: {
    name: { en: 'Osteoporosis', no: 'Osteoporose' },
    screening: 'DEXA scan',
    riskFactors: ['Age', 'Female', 'Low body weight', 'Smoking', 'Steroid use', 'Family history'],
  },
  psoriaticArthritis: {
    name: { en: 'Psoriatic Arthritis', no: 'Psoriasisartritt' },
    criteria: 'CASPAR',
    findings: ['Dactylitis', 'Nail changes', 'Enthesitis', 'Skin lesions'],
  },
  reactiveArthritis: {
    name: { en: 'Reactive Arthritis', no: 'Reaktiv Artritt' },
    triad: ['Conjunctivitis', 'Urethritis', 'Arthritis'],
    precedingInfection: ['GU (Chlamydia)', 'GI (Salmonella, Shigella, Yersinia, Campylobacter)'],
  },
  rheumatoidArthritis: {
    name: { en: 'Rheumatoid Arthritis', no: 'Revmatoid Artritt' },
    criteria: 'ACR/EULAR 2010',
    findings: ['Symmetric polyarthritis', 'Morning stiffness >1hr', 'RF+', 'Anti-CCP+'],
  },
  schizophrenia: {
    name: { en: 'Schizophrenia', no: 'Schizofreni' },
    symptoms: ['Delusions', 'Hallucinations', 'Disorganized speech', 'Negative symptoms'],
    referralRequired: true,
  },
  sle: {
    name: { en: 'Systemic Lupus Erythematosus', no: 'Systemisk Lupus Erythematosus' },
    criteria: 'SLICC',
    findings: ['Malar rash', 'Photosensitivity', 'Oral ulcers', 'Arthritis', 'Serositis'],
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SystemicExamFlow = ({
  language = 'en',
  onComplete,
  onFieldChange,
  initialData = {},
  readOnly = false,
}) => {
  const [_activeSection, setActiveSection] = useState('vitals');
  const [examData, setExamData] = useState(initialData);
  const [expandedSections, setExpandedSections] = useState(['vitals']);
  const [selectedConditions, setSelectedConditions] = useState([]);

  // Handle field value change
  const handleFieldChange = useCallback(
    (sectionId, fieldId, value) => {
      setExamData((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [fieldId]: value,
        },
      }));

      if (onFieldChange) {
        onFieldChange(sectionId, fieldId, value);
      }
    },
    [onFieldChange]
  );

  // Toggle section expansion
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
    setActiveSection(sectionId);
  }, []);

  // Calculate BMI
  const calculateBMI = useCallback(() => {
    const height = parseFloat(examData.anthropometrics?.height);
    const weight = parseFloat(examData.anthropometrics?.weight);
    if (height && weight) {
      const heightM = height / 100;
      return (weight / (heightM * heightM)).toFixed(1);
    }
    return '';
  }, [examData.anthropometrics?.height, examData.anthropometrics?.weight]);

  // Generate clinical narrative
  const generateNarrative = useCallback(() => {
    let narrative = 'SYSTEMIC EXAMINATION:\n\n';

    // Vitals
    if (examData.vitals) {
      narrative += 'VITAL SIGNS:\n';
      const v = examData.vitals;
      if (v.temperature) {
        narrative += `Temperature: ${v.temperature}°C\n`;
      }
      if (v.pulse) {
        narrative += `Pulse: ${v.pulse} bpm\n`;
      }
      if (v.respiration) {
        narrative += `Respiration: ${v.respiration} bpm\n`;
      }
      if (v.bpRight) {
        narrative += `BP Right Arm: ${v.bpRight} mmHg\n`;
      }
      if (v.bpLeft) {
        narrative += `BP Left Arm: ${v.bpLeft} mmHg\n`;
      }
      if (v.o2Sat) {
        narrative += `O2 Saturation: ${v.o2Sat}%\n`;
      }
      narrative += '\n';
    }

    // Anthropometrics
    if (examData.anthropometrics) {
      narrative += 'ANTHROPOMETRICS:\n';
      const a = examData.anthropometrics;
      if (a.height) {
        narrative += `Height: ${a.height} cm\n`;
      }
      if (a.weight) {
        narrative += `Weight: ${a.weight} kg\n`;
      }
      const bmi = calculateBMI();
      if (bmi) {
        narrative += `BMI: ${bmi} kg/m²\n`;
      }
      narrative += '\n';
    }

    // Add other sections as needed
    Object.entries(EXAM_SECTIONS).forEach(([sectionId, section]) => {
      if (sectionId === 'vitals' || sectionId === 'anthropometrics') {
        return;
      }

      const sectionData = examData[sectionId];
      if (sectionData && Object.keys(sectionData).length > 0) {
        narrative += `${section.title[language].toUpperCase()}:\n`;

        if (section.subsections) {
          Object.entries(section.subsections).forEach(([_subId, subsection]) => {
            narrative += `  ${subsection.title[language]}:\n`;
            subsection.fields.forEach((field) => {
              if (sectionData[field.id]) {
                narrative += `    ${field.label[language]}: ${sectionData[field.id]}\n`;
              }
            });
          });
        } else {
          section.fields.forEach((field) => {
            if (sectionData[field.id]) {
              narrative += `  ${field.label[language]}: ${sectionData[field.id]}\n`;
            }
          });
        }
        narrative += '\n';
      }
    });

    return narrative;
  }, [examData, language, calculateBMI]);

  // Render field input
  const renderField = (sectionId, field) => {
    const value = examData[sectionId]?.[field.id] || '';

    if (field.options) {
      return (
        <select
          value={value}
          onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
          disabled={readOnly}
          style={styles.select}
        >
          <option value="">-- Select --</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (field.calculated && field.id === 'bmi') {
      return (
        <input
          type="text"
          value={calculateBMI()}
          readOnly
          style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
        placeholder={field.normal ? `Normal: ${field.normal}` : ''}
        disabled={readOnly}
        style={styles.input}
      />
    );
  };

  // Render section
  const renderSection = (sectionId, section) => {
    const isExpanded = expandedSections.includes(sectionId);

    return (
      <div key={sectionId} style={styles.section}>
        <div style={styles.sectionHeader} onClick={() => toggleSection(sectionId)}>
          <span style={styles.sectionIcon}>{section.icon}</span>
          <span style={styles.sectionTitle}>{section.title[language]}</span>
          <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>

        {isExpanded && (
          <div style={styles.sectionContent}>
            {section.subsections ? (
              Object.entries(section.subsections).map(([subId, subsection]) => (
                <div key={subId} style={styles.subsection}>
                  <h4 style={styles.subsectionTitle}>{subsection.title[language]}</h4>
                  <div style={styles.fieldGrid}>
                    {subsection.fields.map((field) => (
                      <div key={field.id} style={styles.fieldContainer}>
                        <label style={styles.label}>{field.label[language]}</label>
                        {renderField(sectionId, field)}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.fieldGrid}>
                {section.fields.map((field) => (
                  <div key={field.id} style={styles.fieldContainer}>
                    <label style={styles.label}>
                      {field.label[language]}
                      {field.unit && <span style={styles.unit}> ({field.unit})</span>}
                    </label>
                    {renderField(sectionId, field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {language === 'en' ? 'Systemic Examination Flow' : 'Systemisk Undersøkelsesflyt'}
        </h2>
        <p style={styles.subtitle}>
          {language === 'en'
            ? 'Complete physical examination protocol for systemic assessment'
            : 'Komplett fysisk undersøkelsesprotokoll for systemisk vurdering'}
        </p>
      </div>

      <div style={styles.sectionsContainer}>
        {Object.entries(EXAM_SECTIONS).map(([sectionId, section]) =>
          renderSection(sectionId, section)
        )}
      </div>

      {/* Condition Quick Select */}
      <div style={styles.conditionsSection}>
        <h3 style={styles.conditionsTitle}>
          {language === 'en' ? 'Systemic Conditions Assessment' : 'Systemisk Tilstandsvurdering'}
        </h3>
        <div style={styles.conditionsGrid}>
          {Object.entries(SYSTEMIC_CONDITIONS).map(([condId, condition]) => (
            <button
              key={condId}
              style={{
                ...styles.conditionButton,
                ...(selectedConditions.includes(condId) ? styles.conditionButtonActive : {}),
              }}
              onClick={() => {
                setSelectedConditions((prev) =>
                  prev.includes(condId) ? prev.filter((id) => id !== condId) : [...prev, condId]
                );
              }}
            >
              {condition.name[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          style={styles.generateButton}
          onClick={() => {
            const narrative = generateNarrative();
            if (onComplete) {
              onComplete(narrative, examData, selectedConditions);
            }
          }}
        >
          {language === 'en' ? 'Generate Clinical Note' : 'Generer Klinisk Notat'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  header: {
    marginBottom: '24px',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#212529',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d',
    margin: 0,
  },
  sectionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    borderBottom: '1px solid #dee2e6',
  },
  sectionIcon: {
    fontSize: '20px',
    marginRight: '12px',
  },
  sectionTitle: {
    flex: 1,
    fontSize: '16px',
    fontWeight: '600',
    color: '#212529',
  },
  expandIcon: {
    color: '#6c757d',
    fontSize: '12px',
  },
  sectionContent: {
    padding: '16px',
  },
  subsection: {
    marginBottom: '20px',
  },
  subsectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '12px',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: '8px',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  },
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#495057',
    marginBottom: '4px',
  },
  unit: {
    fontWeight: '400',
    color: '#6c757d',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    outline: 'none',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  conditionsSection: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  conditionsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212529',
    marginBottom: '16px',
  },
  conditionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  conditionButton: {
    padding: '8px 16px',
    fontSize: '13px',
    border: '1px solid #dee2e6',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  conditionButtonActive: {
    backgroundColor: '#0d6efd',
    color: '#ffffff',
    borderColor: '#0d6efd',
  },
  actions: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  generateButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#0d6efd',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default SystemicExamFlow;
export { EXAM_SECTIONS, SYSTEMIC_CONDITIONS };
