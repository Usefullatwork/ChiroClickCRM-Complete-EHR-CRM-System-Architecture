/**
 * AnatomicalBodyChart - Detailed anatomical body diagram with layers
 *
 * Features:
 * - Detailed anatomical SVG with proper proportions
 * - Dermatome overlay (C2-S5 nerve distribution)
 * - Muscle anatomy layer with trigger points
 * - Toggle controls for each layer
 * - Bilingual support (Norwegian/English)
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Zap,
  Activity,
  Circle,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// =============================================================================
// BILINGUAL LABELS
// =============================================================================
const LABELS = {
  en: {
    title: 'Anatomical Body Chart',
    layers: 'Layers',
    outline: 'Body Outline',
    dermatomes: 'Dermatomes',
    muscles: 'Muscles',
    triggerPoints: 'Trigger Points',
    front: 'Anterior',
    back: 'Posterior',
    left: 'Left Lateral',
    right: 'Right Lateral',
    showAll: 'Show All',
    hideAll: 'Hide All',
    dermatomeInfo: 'Dermatome Map',
    muscleInfo: 'Muscle Anatomy',
    clickToMark: 'Click to mark symptoms',
    selectedDermatome: 'Selected Dermatome',
    selectedMuscle: 'Selected Muscle',
    noSelection: 'Click on a region to see details',
    generateNarrative: 'Generate Narrative',
    clearAll: 'Clear All',
  },
  no: {
    title: 'Anatomisk Kroppskart',
    layers: 'Lag',
    outline: 'Kroppsomriss',
    dermatomes: 'Dermatomer',
    muscles: 'Muskler',
    triggerPoints: 'Triggerpunkter',
    front: 'Anterior',
    back: 'Posterior',
    left: 'Venstre Side',
    right: 'Høyre Side',
    showAll: 'Vis Alle',
    hideAll: 'Skjul Alle',
    dermatomeInfo: 'Dermatomkart',
    muscleInfo: 'Muskelanatomi',
    clickToMark: 'Klikk for å markere symptomer',
    selectedDermatome: 'Valgt Dermatom',
    selectedMuscle: 'Valgt Muskel',
    noSelection: 'Klikk på et område for detaljer',
    generateNarrative: 'Generer Narrativ',
    clearAll: 'Fjern Alle',
  },
};

// =============================================================================
// DERMATOME DATA - Nerve root distributions
// =============================================================================
const DERMATOMES = {
  // Cervical
  C2: {
    en: { name: 'C2', area: 'Posterior skull, upper neck' },
    no: { name: 'C2', area: 'Bakhodet, øvre nakke' },
    color: '#FF6B6B',
    regions: ['head_posterior', 'neck_upper'],
  },
  C3: {
    en: { name: 'C3', area: 'Lower neck, upper trapezius' },
    no: { name: 'C3', area: 'Nedre nakke, øvre trapezius' },
    color: '#FF8E72',
    regions: ['neck_lower', 'trapezius_upper'],
  },
  C4: {
    en: { name: 'C4', area: 'Upper shoulder, clavicle area' },
    no: { name: 'C4', area: 'Øvre skulder, kragebeinsområdet' },
    color: '#FFB347',
    regions: ['shoulder_upper', 'clavicle'],
  },
  C5: {
    en: { name: 'C5', area: 'Lateral shoulder, lateral arm' },
    no: { name: 'C5', area: 'Lateral skulder, lateral arm' },
    color: '#FFD93D',
    regions: ['deltoid', 'lateral_arm_upper'],
  },
  C6: {
    en: { name: 'C6', area: 'Lateral forearm, thumb, index finger' },
    no: { name: 'C6', area: 'Lateral underarm, tommel, pekefinger' },
    color: '#C9E265',
    regions: ['lateral_forearm', 'thumb', 'index_finger'],
  },
  C7: {
    en: { name: 'C7', area: 'Middle finger, posterior arm' },
    no: { name: 'C7', area: 'Langfinger, bakside arm' },
    color: '#6BCB77',
    regions: ['middle_finger', 'posterior_arm'],
  },
  C8: {
    en: { name: 'C8', area: 'Medial forearm, ring & little finger' },
    no: { name: 'C8', area: 'Medial underarm, ring- og lillefinger' },
    color: '#4D96FF',
    regions: ['medial_forearm', 'ring_finger', 'little_finger'],
  },
  // Thoracic
  T1: {
    en: { name: 'T1', area: 'Medial arm, axilla' },
    no: { name: 'T1', area: 'Medial arm, armhule' },
    color: '#6665DD',
    regions: ['medial_arm', 'axilla'],
  },
  T2: {
    en: { name: 'T2', area: 'Upper chest, axilla' },
    no: { name: 'T2', area: 'Øvre bryst, armhule' },
    color: '#9B5DE5',
    regions: ['chest_t2'],
  },
  T3: {
    en: { name: 'T3', area: 'T3 dermatome band' },
    no: { name: 'T3', area: 'T3 dermatomband' },
    color: '#A855F7',
    regions: ['chest_t3'],
  },
  T4: {
    en: { name: 'T4', area: 'Nipple level' },
    no: { name: 'T4', area: 'Brystvortenivå' },
    color: '#C084FC',
    regions: ['chest_t4'],
  },
  T5: {
    en: { name: 'T5', area: 'T5 dermatome band' },
    no: { name: 'T5', area: 'T5 dermatomband' },
    color: '#D8B4FE',
    regions: ['chest_t5'],
  },
  T6: {
    en: { name: 'T6', area: 'Xiphoid process level' },
    no: { name: 'T6', area: 'Xiphoid-nivå' },
    color: '#E9D5FF',
    regions: ['chest_t6'],
  },
  T7: {
    en: { name: 'T7', area: 'T7 dermatome band' },
    no: { name: 'T7', area: 'T7 dermatomband' },
    color: '#F0ABFC',
    regions: ['abdomen_t7'],
  },
  T8: {
    en: { name: 'T8', area: 'T8 dermatome band' },
    no: { name: 'T8', area: 'T8 dermatomband' },
    color: '#F472B6',
    regions: ['abdomen_t8'],
  },
  T9: {
    en: { name: 'T9', area: 'T9 dermatome band' },
    no: { name: 'T9', area: 'T9 dermatomband' },
    color: '#FB7185',
    regions: ['abdomen_t9'],
  },
  T10: {
    en: { name: 'T10', area: 'Umbilicus level' },
    no: { name: 'T10', area: 'Navlenivå' },
    color: '#FDA4AF',
    regions: ['abdomen_t10'],
  },
  T11: {
    en: { name: 'T11', area: 'T11 dermatome band' },
    no: { name: 'T11', area: 'T11 dermatomband' },
    color: '#FECDD3',
    regions: ['abdomen_t11'],
  },
  T12: {
    en: { name: 'T12', area: 'Above inguinal ligament' },
    no: { name: 'T12', area: 'Over lyskebåndet' },
    color: '#FFE4E6',
    regions: ['abdomen_t12'],
  },
  // Lumbar
  L1: {
    en: { name: 'L1', area: 'Inguinal region, upper buttock' },
    no: { name: 'L1', area: 'Lyskeregion, øvre sete' },
    color: '#FEF3C7',
    regions: ['inguinal', 'upper_buttock'],
  },
  L2: {
    en: { name: 'L2', area: 'Anterior thigh' },
    no: { name: 'L2', area: 'Fremre lår' },
    color: '#FDE68A',
    regions: ['anterior_thigh_upper'],
  },
  L3: {
    en: { name: 'L3', area: 'Anterior thigh, knee' },
    no: { name: 'L3', area: 'Fremre lår, kne' },
    color: '#FCD34D',
    regions: ['anterior_thigh_lower', 'knee_anterior'],
  },
  L4: {
    en: { name: 'L4', area: 'Medial leg, medial foot' },
    no: { name: 'L4', area: 'Medial legg, medial fot' },
    color: '#FBBF24',
    regions: ['medial_leg', 'medial_foot'],
  },
  L5: {
    en: { name: 'L5', area: 'Lateral leg, dorsum of foot, big toe' },
    no: { name: 'L5', area: 'Lateral legg, fotryggen, stortå' },
    color: '#F59E0B',
    regions: ['lateral_leg', 'dorsum_foot', 'big_toe'],
  },
  // Sacral
  S1: {
    en: { name: 'S1', area: 'Posterior leg, lateral foot, small toe' },
    no: { name: 'S1', area: 'Bakside legg, lateral fot, lilletå' },
    color: '#D97706',
    regions: ['posterior_leg', 'lateral_foot', 'small_toe'],
  },
  S2: {
    en: { name: 'S2', area: 'Posterior thigh, popliteal fossa' },
    no: { name: 'S2', area: 'Bakside lår, knehase' },
    color: '#B45309',
    regions: ['posterior_thigh', 'popliteal'],
  },
  S3: {
    en: { name: 'S3', area: 'Perianal area' },
    no: { name: 'S3', area: 'Perianal område' },
    color: '#92400E',
    regions: ['perianal'],
  },
  S4: {
    en: { name: 'S4', area: 'Perineum' },
    no: { name: 'S4', area: 'Perineum' },
    color: '#78350F',
    regions: ['perineum'],
  },
  S5: {
    en: { name: 'S5', area: 'Perianal skin' },
    no: { name: 'S5', area: 'Perianal hud' },
    color: '#713F12',
    regions: ['perianal_skin'],
  },
};

// =============================================================================
// MUSCLE DATA - Comprehensive muscle groups with trigger points
// Based on Travell & Simons' Myofascial Pain and Dysfunction
// Bilingual referral patterns (English/Norwegian)
// =============================================================================
const MUSCLES = {
  // ===========================================================================
  // HEAD & FACE
  // ===========================================================================
  temporalis: {
    en: { name: 'Temporalis', abbr: 'Temp' },
    no: { name: 'Temporalis', abbr: 'Temp' },
    color: '#DC2626',
    triggerPoints: [
      {
        id: 'temp_1',
        cx: 80,
        cy: 30,
        referral: {
          en: 'Temporal headache, upper teeth pain',
          no: 'Tinninghodepine, smerter i øvre tenner',
        },
      },
      {
        id: 'temp_2',
        cx: 120,
        cy: 30,
        referral: {
          en: 'Temporal headache, upper teeth pain',
          no: 'Tinninghodepine, smerter i øvre tenner',
        },
      },
      {
        id: 'temp_3',
        cx: 75,
        cy: 40,
        referral: { en: 'Eyebrow pain, temple sensitivity', no: 'Øyebrynsmerte, tinningømhet' },
      },
      {
        id: 'temp_4',
        cx: 125,
        cy: 40,
        referral: { en: 'Eyebrow pain, temple sensitivity', no: 'Øyebrynsmerte, tinningømhet' },
      },
    ],
  },
  masseter: {
    en: { name: 'Masseter', abbr: 'Mass' },
    no: { name: 'Masseter', abbr: 'Mass' },
    color: '#B91C1C',
    triggerPoints: [
      {
        id: 'mass_1',
        cx: 78,
        cy: 50,
        referral: {
          en: 'TMJ pain, jaw pain, tinnitus',
          no: 'Kjeveleddsmerte, kjevesmerte, tinnitus',
        },
      },
      {
        id: 'mass_2',
        cx: 122,
        cy: 50,
        referral: {
          en: 'TMJ pain, jaw pain, tinnitus',
          no: 'Kjeveleddsmerte, kjevesmerte, tinnitus',
        },
      },
      {
        id: 'mass_3',
        cx: 80,
        cy: 55,
        referral: { en: 'Lower molar pain, ear pain', no: 'Smerter i nedre jeksler, øresmerter' },
      },
      {
        id: 'mass_4',
        cx: 120,
        cy: 55,
        referral: { en: 'Lower molar pain, ear pain', no: 'Smerter i nedre jeksler, øresmerter' },
      },
    ],
  },
  pterygoid_lateral: {
    en: { name: 'Lateral Pterygoid', abbr: 'LatPter' },
    no: { name: 'Lateral Pterygoid', abbr: 'LatPter' },
    color: '#991B1B',
    triggerPoints: [
      {
        id: 'latpter_1',
        cx: 85,
        cy: 48,
        referral: {
          en: 'TMJ pain, cheek pain, sinus pain',
          no: 'Kjeveleddsmerte, kinnsmerte, bihulesmerte',
        },
      },
      {
        id: 'latpter_2',
        cx: 115,
        cy: 48,
        referral: {
          en: 'TMJ pain, cheek pain, sinus pain',
          no: 'Kjeveleddsmerte, kinnsmerte, bihulesmerte',
        },
      },
    ],
  },
  pterygoid_medial: {
    en: { name: 'Medial Pterygoid', abbr: 'MedPter' },
    no: { name: 'Medial Pterygoid', abbr: 'MedPter' },
    color: '#7F1D1D',
    triggerPoints: [
      {
        id: 'medpter_1',
        cx: 88,
        cy: 52,
        referral: {
          en: 'TMJ, throat, ear, hard palate pain',
          no: 'Kjeveledd, hals, øre, gane-smerte',
        },
      },
      {
        id: 'medpter_2',
        cx: 112,
        cy: 52,
        referral: {
          en: 'TMJ, throat, ear, hard palate pain',
          no: 'Kjeveledd, hals, øre, gane-smerte',
        },
      },
    ],
  },

  // ===========================================================================
  // NECK - POSTERIOR
  // ===========================================================================
  suboccipitals: {
    en: { name: 'Suboccipitals', abbr: 'SubOcc' },
    no: { name: 'Suboccipitale', abbr: 'SubOcc' },
    color: '#EF4444',
    triggerPoints: [
      {
        id: 'subocc_1',
        cx: 88,
        cy: 58,
        referral: {
          en: 'Occipital headache, eye pain, wrapping head pain',
          no: 'Bakhodeshodepine, øyesmerte, omsluttende hodesmerte',
        },
      },
      {
        id: 'subocc_2',
        cx: 112,
        cy: 58,
        referral: {
          en: 'Occipital headache, eye pain, wrapping head pain',
          no: 'Bakhodeshodepine, øyesmerte, omsluttende hodesmerte',
        },
      },
    ],
  },
  splenius_capitis: {
    en: { name: 'Splenius Capitis', abbr: 'SplCap' },
    no: { name: 'Splenius Capitis', abbr: 'SplCap' },
    color: '#F87171',
    triggerPoints: [
      {
        id: 'splcap_1',
        cx: 82,
        cy: 65,
        referral: { en: 'Vertex headache, eye pain', no: 'Issesmerte, øyesmerte' },
      },
      {
        id: 'splcap_2',
        cx: 118,
        cy: 65,
        referral: { en: 'Vertex headache, eye pain', no: 'Issesmerte, øyesmerte' },
      },
    ],
  },
  splenius_cervicis: {
    en: { name: 'Splenius Cervicis', abbr: 'SplCerv' },
    no: { name: 'Splenius Cervicis', abbr: 'SplCerv' },
    color: '#FCA5A5',
    triggerPoints: [
      {
        id: 'splcerv_1',
        cx: 78,
        cy: 78,
        referral: {
          en: 'Neck pain, occipital pain, eye pain',
          no: 'Nakkesmerte, bakhodesmerte, øyesmerte',
        },
      },
      {
        id: 'splcerv_2',
        cx: 122,
        cy: 78,
        referral: {
          en: 'Neck pain, occipital pain, eye pain',
          no: 'Nakkesmerte, bakhodesmerte, øyesmerte',
        },
      },
    ],
  },
  semispinalis_capitis: {
    en: { name: 'Semispinalis Capitis', abbr: 'SemiCap' },
    no: { name: 'Semispinalis Capitis', abbr: 'SemiCap' },
    color: '#FECACA',
    triggerPoints: [
      {
        id: 'semicap_1',
        cx: 92,
        cy: 68,
        referral: {
          en: 'Temporal headache, hemicranial pattern',
          no: 'Tinninghodepine, halvsidig hodemønster',
        },
      },
      {
        id: 'semicap_2',
        cx: 108,
        cy: 68,
        referral: {
          en: 'Temporal headache, hemicranial pattern',
          no: 'Tinninghodepine, halvsidig hodemønster',
        },
      },
    ],
  },

  // ===========================================================================
  // NECK - ANTERIOR & LATERAL
  // ===========================================================================
  sternocleidomastoid: {
    en: { name: 'Sternocleidomastoid', abbr: 'SCM' },
    no: { name: 'Sternocleidomastoid', abbr: 'SCM' },
    color: '#EF4444',
    triggerPoints: [
      {
        id: 'scm_sternal_1',
        cx: 90,
        cy: 72,
        referral: {
          en: 'Frontal headache, eye pain, visual disturbances',
          no: 'Pannehodepine, øyesmerte, synsforstyrrelser',
        },
      },
      {
        id: 'scm_sternal_2',
        cx: 110,
        cy: 72,
        referral: {
          en: 'Frontal headache, eye pain, visual disturbances',
          no: 'Pannehodepine, øyesmerte, synsforstyrrelser',
        },
      },
      {
        id: 'scm_clav_1',
        cx: 85,
        cy: 80,
        referral: {
          en: 'Ear pain, cheek pain, forehead pain',
          no: 'Øresmerter, kinnsmerte, pannesmerte',
        },
      },
      {
        id: 'scm_clav_2',
        cx: 115,
        cy: 80,
        referral: {
          en: 'Ear pain, cheek pain, forehead pain',
          no: 'Øresmerter, kinnsmerte, pannesmerte',
        },
      },
    ],
  },
  scalene_anterior: {
    en: { name: 'Scalene Anterior', abbr: 'ScalAnt' },
    no: { name: 'Scalene Anterior', abbr: 'ScalAnt' },
    color: '#F97316',
    triggerPoints: [
      {
        id: 'scalant_1',
        cx: 88,
        cy: 78,
        referral: {
          en: 'Chest pain, upper back, arm, hand pain',
          no: 'Brystsmerte, øvre rygg, arm, håndsmerte',
        },
      },
      {
        id: 'scalant_2',
        cx: 112,
        cy: 78,
        referral: {
          en: 'Chest pain, upper back, arm, hand pain',
          no: 'Brystsmerte, øvre rygg, arm, håndsmerte',
        },
      },
    ],
  },
  scalene_medius: {
    en: { name: 'Scalene Medius', abbr: 'ScalMed' },
    no: { name: 'Scalene Medius', abbr: 'ScalMed' },
    color: '#FB923C',
    triggerPoints: [
      {
        id: 'scalmed_1',
        cx: 82,
        cy: 82,
        referral: {
          en: 'Arm pain to thumb and index finger',
          no: 'Armsmerte til tommel og pekefinger',
        },
      },
      {
        id: 'scalmed_2',
        cx: 118,
        cy: 82,
        referral: {
          en: 'Arm pain to thumb and index finger',
          no: 'Armsmerte til tommel og pekefinger',
        },
      },
    ],
  },
  scalene_posterior: {
    en: { name: 'Scalene Posterior', abbr: 'ScalPost' },
    no: { name: 'Scalene Posterior', abbr: 'ScalPost' },
    color: '#FDBA74',
    triggerPoints: [
      {
        id: 'scalpost_1',
        cx: 78,
        cy: 85,
        referral: {
          en: 'Interscapular pain, arm pain',
          no: 'Smerte mellom skulderbladene, armsmerte',
        },
      },
      {
        id: 'scalpost_2',
        cx: 122,
        cy: 85,
        referral: {
          en: 'Interscapular pain, arm pain',
          no: 'Smerte mellom skulderbladene, armsmerte',
        },
      },
    ],
  },
  longus_colli: {
    en: { name: 'Longus Colli', abbr: 'LongCol' },
    no: { name: 'Longus Colli', abbr: 'LongCol' },
    color: '#FED7AA',
    triggerPoints: [
      {
        id: 'longcol_1',
        cx: 95,
        cy: 75,
        referral: { en: 'Throat pain, difficulty swallowing', no: 'Halssmerter, svelgevansker' },
      },
      {
        id: 'longcol_2',
        cx: 105,
        cy: 75,
        referral: { en: 'Throat pain, difficulty swallowing', no: 'Halssmerter, svelgevansker' },
      },
    ],
  },

  // ===========================================================================
  // UPPER TRAPEZIUS & NECK/SHOULDER
  // ===========================================================================
  upper_trapezius: {
    en: { name: 'Upper Trapezius', abbr: 'UT' },
    no: { name: 'Øvre Trapezius', abbr: 'ØT' },
    color: '#F97316',
    triggerPoints: [
      {
        id: 'ut_1',
        cx: 70,
        cy: 92,
        referral: {
          en: 'Temple headache, jaw pain, neck pain',
          no: 'Tinninghodepine, kjevesmerte, nakkesmerte',
        },
      },
      {
        id: 'ut_2',
        cx: 130,
        cy: 92,
        referral: {
          en: 'Temple headache, jaw pain, neck pain',
          no: 'Tinninghodepine, kjevesmerte, nakkesmerte',
        },
      },
      {
        id: 'ut_3',
        cx: 62,
        cy: 95,
        referral: {
          en: 'Posterolateral neck, temple region',
          no: 'Bakre-lateral nakke, tinningregion',
        },
      },
      {
        id: 'ut_4',
        cx: 138,
        cy: 95,
        referral: {
          en: 'Posterolateral neck, temple region',
          no: 'Bakre-lateral nakke, tinningregion',
        },
      },
    ],
  },
  middle_trapezius: {
    en: { name: 'Middle Trapezius', abbr: 'MT' },
    no: { name: 'Midtre Trapezius', abbr: 'MT' },
    color: '#EA580C',
    triggerPoints: [
      {
        id: 'mt_1',
        cx: 65,
        cy: 115,
        referral: {
          en: 'Interscapular burning pain',
          no: 'Brennende smerte mellom skulderbladene',
        },
      },
      {
        id: 'mt_2',
        cx: 135,
        cy: 115,
        referral: {
          en: 'Interscapular burning pain',
          no: 'Brennende smerte mellom skulderbladene',
        },
      },
    ],
  },
  lower_trapezius: {
    en: { name: 'Lower Trapezius', abbr: 'LT' },
    no: { name: 'Nedre Trapezius', abbr: 'NT' },
    color: '#C2410C',
    triggerPoints: [
      {
        id: 'lt_1',
        cx: 80,
        cy: 145,
        referral: {
          en: 'Mid-back, neck, upper shoulder pain',
          no: 'Midtre rygg, nakke, øvre skuldersmerte',
        },
      },
      {
        id: 'lt_2',
        cx: 120,
        cy: 145,
        referral: {
          en: 'Mid-back, neck, upper shoulder pain',
          no: 'Midtre rygg, nakke, øvre skuldersmerte',
        },
      },
    ],
  },
  levator_scapulae: {
    en: { name: 'Levator Scapulae', abbr: 'LS' },
    no: { name: 'Levator Scapulae', abbr: 'LS' },
    color: '#EAB308',
    triggerPoints: [
      {
        id: 'ls_1',
        cx: 65,
        cy: 98,
        referral: {
          en: 'Stiff neck, angle of neck/shoulder pain',
          no: 'Stiv nakke, smerte i nakke/skuldervinkel',
        },
      },
      {
        id: 'ls_2',
        cx: 135,
        cy: 98,
        referral: {
          en: 'Stiff neck, angle of neck/shoulder pain',
          no: 'Stiv nakke, smerte i nakke/skuldervinkel',
        },
      },
      {
        id: 'ls_3',
        cx: 60,
        cy: 105,
        referral: { en: 'Medial scapular border pain', no: 'Smerte langs medial skulderbladskant' },
      },
      {
        id: 'ls_4',
        cx: 140,
        cy: 105,
        referral: { en: 'Medial scapular border pain', no: 'Smerte langs medial skulderbladskant' },
      },
    ],
  },

  // ===========================================================================
  // SHOULDER - ROTATOR CUFF & DELTOID
  // ===========================================================================
  supraspinatus: {
    en: { name: 'Supraspinatus', abbr: 'Supra' },
    no: { name: 'Supraspinatus', abbr: 'Supra' },
    color: '#14B8A6',
    triggerPoints: [
      {
        id: 'supra_1',
        cx: 55,
        cy: 102,
        referral: {
          en: 'Deep lateral deltoid pain, lateral arm',
          no: 'Dyp lateral deltoidsmerte, lateral arm',
        },
      },
      {
        id: 'supra_2',
        cx: 145,
        cy: 102,
        referral: {
          en: 'Deep lateral deltoid pain, lateral arm',
          no: 'Dyp lateral deltoidsmerte, lateral arm',
        },
      },
      {
        id: 'supra_3',
        cx: 60,
        cy: 108,
        referral: { en: 'Lateral epicondyle, wrist pain', no: 'Lateral epikondyl, håndleddsmerte' },
      },
      {
        id: 'supra_4',
        cx: 140,
        cy: 108,
        referral: { en: 'Lateral epicondyle, wrist pain', no: 'Lateral epikondyl, håndleddsmerte' },
      },
    ],
  },
  infraspinatus: {
    en: { name: 'Infraspinatus', abbr: 'Infra' },
    no: { name: 'Infraspinatus', abbr: 'Infra' },
    color: '#06B6D4',
    triggerPoints: [
      {
        id: 'infra_1',
        cx: 55,
        cy: 125,
        referral: {
          en: 'Anterior deltoid pain, biceps area',
          no: 'Fremre deltoidsmerte, bicepsområde',
        },
      },
      {
        id: 'infra_2',
        cx: 145,
        cy: 125,
        referral: {
          en: 'Anterior deltoid pain, biceps area',
          no: 'Fremre deltoidsmerte, bicepsområde',
        },
      },
      {
        id: 'infra_3',
        cx: 60,
        cy: 130,
        referral: {
          en: 'Lateral arm, forearm, hand pain',
          no: 'Lateral arm, underarm, håndsmerte',
        },
      },
      {
        id: 'infra_4',
        cx: 140,
        cy: 130,
        referral: {
          en: 'Lateral arm, forearm, hand pain',
          no: 'Lateral arm, underarm, håndsmerte',
        },
      },
    ],
  },
  teres_minor: {
    en: { name: 'Teres Minor', abbr: 'TMin' },
    no: { name: 'Teres Minor', abbr: 'TMin' },
    color: '#0891B2',
    triggerPoints: [
      {
        id: 'tmin_1',
        cx: 52,
        cy: 135,
        referral: { en: 'Sharp posterior deltoid pain', no: 'Skarp bakre deltoidsmerte' },
      },
      {
        id: 'tmin_2',
        cx: 148,
        cy: 135,
        referral: { en: 'Sharp posterior deltoid pain', no: 'Skarp bakre deltoidsmerte' },
      },
    ],
  },
  teres_major: {
    en: { name: 'Teres Major', abbr: 'TMaj' },
    no: { name: 'Teres Major', abbr: 'TMaj' },
    color: '#0E7490',
    triggerPoints: [
      {
        id: 'tmaj_1',
        cx: 50,
        cy: 145,
        referral: {
          en: 'Posterior deltoid, triceps, dorsal forearm',
          no: 'Bakre deltoid, triceps, dorsal underarm',
        },
      },
      {
        id: 'tmaj_2',
        cx: 150,
        cy: 145,
        referral: {
          en: 'Posterior deltoid, triceps, dorsal forearm',
          no: 'Bakre deltoid, triceps, dorsal underarm',
        },
      },
    ],
  },
  subscapularis: {
    en: { name: 'Subscapularis', abbr: 'SubScap' },
    no: { name: 'Subscapularis', abbr: 'SubScap' },
    color: '#155E75',
    triggerPoints: [
      {
        id: 'subscap_1',
        cx: 58,
        cy: 122,
        referral: {
          en: 'Posterior shoulder, wrist band pain',
          no: 'Bakre skulder, håndleddssmerte',
        },
      },
      {
        id: 'subscap_2',
        cx: 142,
        cy: 122,
        referral: {
          en: 'Posterior shoulder, wrist band pain',
          no: 'Bakre skulder, håndleddssmerte',
        },
      },
    ],
  },
  deltoid: {
    en: { name: 'Deltoid', abbr: 'Delt' },
    no: { name: 'Deltoid', abbr: 'Delt' },
    color: '#22C55E',
    triggerPoints: [
      {
        id: 'delt_ant_1',
        cx: 48,
        cy: 110,
        referral: { en: 'Local anterior shoulder pain', no: 'Lokal fremre skuldersmerte' },
      },
      {
        id: 'delt_ant_2',
        cx: 152,
        cy: 110,
        referral: { en: 'Local anterior shoulder pain', no: 'Lokal fremre skuldersmerte' },
      },
      {
        id: 'delt_mid_1',
        cx: 42,
        cy: 118,
        referral: { en: 'Local lateral shoulder pain', no: 'Lokal lateral skuldersmerte' },
      },
      {
        id: 'delt_mid_2',
        cx: 158,
        cy: 118,
        referral: { en: 'Local lateral shoulder pain', no: 'Lokal lateral skuldersmerte' },
      },
      {
        id: 'delt_post_1',
        cx: 48,
        cy: 125,
        referral: { en: 'Local posterior shoulder pain', no: 'Lokal bakre skuldersmerte' },
      },
      {
        id: 'delt_post_2',
        cx: 152,
        cy: 125,
        referral: { en: 'Local posterior shoulder pain', no: 'Lokal bakre skuldersmerte' },
      },
    ],
  },

  // ===========================================================================
  // CHEST & ANTERIOR TRUNK
  // ===========================================================================
  pectoralis_major: {
    en: { name: 'Pectoralis Major', abbr: 'PecMaj' },
    no: { name: 'Pectoralis Major', abbr: 'PecMaj' },
    color: '#DC2626',
    triggerPoints: [
      {
        id: 'pecmaj_clav_1',
        cx: 78,
        cy: 98,
        referral: { en: 'Anterior deltoid, arm pain', no: 'Fremre deltoid, armsmerte' },
      },
      {
        id: 'pecmaj_clav_2',
        cx: 122,
        cy: 98,
        referral: { en: 'Anterior deltoid, arm pain', no: 'Fremre deltoid, armsmerte' },
      },
      {
        id: 'pecmaj_stern_1',
        cx: 80,
        cy: 115,
        referral: { en: 'Chest pain, breast pain', no: 'Brystsmerte, brystsmerte' },
      },
      {
        id: 'pecmaj_stern_2',
        cx: 120,
        cy: 115,
        referral: { en: 'Chest pain, breast pain', no: 'Brystsmerte, brystsmerte' },
      },
      {
        id: 'pecmaj_cost_1',
        cx: 72,
        cy: 125,
        referral: { en: 'Cardiac arrhythmia-like symptoms', no: 'Hjertearytmi-lignende symptomer' },
      },
      {
        id: 'pecmaj_cost_2',
        cx: 128,
        cy: 125,
        referral: { en: 'Cardiac arrhythmia-like symptoms', no: 'Hjertearytmi-lignende symptomer' },
      },
    ],
  },
  pectoralis_minor: {
    en: { name: 'Pectoralis Minor', abbr: 'PecMin' },
    no: { name: 'Pectoralis Minor', abbr: 'PecMin' },
    color: '#B91C1C',
    triggerPoints: [
      {
        id: 'pecmin_1',
        cx: 75,
        cy: 108,
        referral: { en: 'Anterior chest, arm, hand pain', no: 'Fremre bryst, arm, håndsmerte' },
      },
      {
        id: 'pecmin_2',
        cx: 125,
        cy: 108,
        referral: { en: 'Anterior chest, arm, hand pain', no: 'Fremre bryst, arm, håndsmerte' },
      },
    ],
  },
  subclavius: {
    en: { name: 'Subclavius', abbr: 'Subclav' },
    no: { name: 'Subclavius', abbr: 'Subclav' },
    color: '#991B1B',
    triggerPoints: [
      {
        id: 'subclav_1',
        cx: 82,
        cy: 92,
        referral: {
          en: 'Arm pain, hand pain, TOS-like symptoms',
          no: 'Armsmerte, håndsmerte, TOS-lignende symptomer',
        },
      },
      {
        id: 'subclav_2',
        cx: 118,
        cy: 92,
        referral: {
          en: 'Arm pain, hand pain, TOS-like symptoms',
          no: 'Armsmerte, håndsmerte, TOS-lignende symptomer',
        },
      },
    ],
  },
  serratus_anterior: {
    en: { name: 'Serratus Anterior', abbr: 'SerAnt' },
    no: { name: 'Serratus Anterior', abbr: 'SerAnt' },
    color: '#7F1D1D',
    triggerPoints: [
      {
        id: 'serant_1',
        cx: 60,
        cy: 145,
        referral: {
          en: 'Side chest, shortness of breath sensation',
          no: 'Sidesmerte i brystet, kortpustethet',
        },
      },
      {
        id: 'serant_2',
        cx: 140,
        cy: 145,
        referral: {
          en: 'Side chest, shortness of breath sensation',
          no: 'Sidesmerte i brystet, kortpustethet',
        },
      },
      {
        id: 'serant_3',
        cx: 55,
        cy: 155,
        referral: { en: 'Medial arm, ulnar hand pain', no: 'Medial arm, ulnar håndsmerte' },
      },
      {
        id: 'serant_4',
        cx: 145,
        cy: 155,
        referral: { en: 'Medial arm, ulnar hand pain', no: 'Medial arm, ulnar håndsmerte' },
      },
    ],
  },

  // ===========================================================================
  // BACK - UPPER & MID
  // ===========================================================================
  rhomboid_major: {
    en: { name: 'Rhomboid Major', abbr: 'RhomMaj' },
    no: { name: 'Rhomboid Major', abbr: 'RhomMaj' },
    color: '#3B82F6',
    triggerPoints: [
      {
        id: 'rhommaj_1',
        cx: 78,
        cy: 130,
        referral: { en: 'Medial scapular border pain', no: 'Smerte langs medial skulderbladskant' },
      },
      {
        id: 'rhommaj_2',
        cx: 122,
        cy: 130,
        referral: { en: 'Medial scapular border pain', no: 'Smerte langs medial skulderbladskant' },
      },
    ],
  },
  rhomboid_minor: {
    en: { name: 'Rhomboid Minor', abbr: 'RhomMin' },
    no: { name: 'Rhomboid Minor', abbr: 'RhomMin' },
    color: '#2563EB',
    triggerPoints: [
      {
        id: 'rhommin_1',
        cx: 80,
        cy: 120,
        referral: { en: 'Upper medial scapular pain', no: 'Øvre medial skulderbladssmerte' },
      },
      {
        id: 'rhommin_2',
        cx: 120,
        cy: 120,
        referral: { en: 'Upper medial scapular pain', no: 'Øvre medial skulderbladssmerte' },
      },
    ],
  },
  latissimus_dorsi: {
    en: { name: 'Latissimus Dorsi', abbr: 'Lat' },
    no: { name: 'Latissimus Dorsi', abbr: 'Lat' },
    color: '#6366F1',
    triggerPoints: [
      {
        id: 'lat_1',
        cx: 55,
        cy: 165,
        referral: { en: 'Inferior scapula angle pain', no: 'Smerte i nedre skulderbladsvinkel' },
      },
      {
        id: 'lat_2',
        cx: 145,
        cy: 165,
        referral: { en: 'Inferior scapula angle pain', no: 'Smerte i nedre skulderbladsvinkel' },
      },
      {
        id: 'lat_3',
        cx: 52,
        cy: 180,
        referral: {
          en: 'Medial arm, ulnar hand, 4th-5th fingers',
          no: 'Medial arm, ulnar hånd, 4.-5. finger',
        },
      },
      {
        id: 'lat_4',
        cx: 148,
        cy: 180,
        referral: {
          en: 'Medial arm, ulnar hand, 4th-5th fingers',
          no: 'Medial arm, ulnar hånd, 4.-5. finger',
        },
      },
    ],
  },
  serratus_posterior_superior: {
    en: { name: 'Serratus Post. Superior', abbr: 'SPS' },
    no: { name: 'Serratus Post. Superior', abbr: 'SPS' },
    color: '#4F46E5',
    triggerPoints: [
      {
        id: 'sps_1',
        cx: 70,
        cy: 125,
        referral: {
          en: 'Deep ache under scapula, posterior shoulder',
          no: 'Dyp smerte under skulderblad, bakre skulder',
        },
      },
      {
        id: 'sps_2',
        cx: 130,
        cy: 125,
        referral: {
          en: 'Deep ache under scapula, posterior shoulder',
          no: 'Dyp smerte under skulderblad, bakre skulder',
        },
      },
    ],
  },
  serratus_posterior_inferior: {
    en: { name: 'Serratus Post. Inferior', abbr: 'SPI' },
    no: { name: 'Serratus Post. Inferior', abbr: 'SPI' },
    color: '#4338CA',
    triggerPoints: [
      {
        id: 'spi_1',
        cx: 68,
        cy: 195,
        referral: { en: 'Lower back, uncertain location pain', no: 'Korsrygg, diffus smerte' },
      },
      {
        id: 'spi_2',
        cx: 132,
        cy: 195,
        referral: { en: 'Lower back, uncertain location pain', no: 'Korsrygg, diffus smerte' },
      },
    ],
  },

  // ===========================================================================
  // BACK - PARASPINALS
  // ===========================================================================
  iliocostalis_thoracis: {
    en: { name: 'Iliocostalis Thoracis', abbr: 'IlioTh' },
    no: { name: 'Iliocostalis Thoracis', abbr: 'IlioTh' },
    color: '#8B5CF6',
    triggerPoints: [
      {
        id: 'ilioth_1',
        cx: 85,
        cy: 140,
        referral: { en: 'Lateral thoracic spine pain', no: 'Lateral thorakalsmerte' },
      },
      {
        id: 'ilioth_2',
        cx: 115,
        cy: 140,
        referral: { en: 'Lateral thoracic spine pain', no: 'Lateral thorakalsmerte' },
      },
    ],
  },
  iliocostalis_lumborum: {
    en: { name: 'Iliocostalis Lumborum', abbr: 'IlioLumb' },
    no: { name: 'Iliocostalis Lumborum', abbr: 'IlioLumb' },
    color: '#7C3AED',
    triggerPoints: [
      {
        id: 'iliolumb_1',
        cx: 82,
        cy: 195,
        referral: {
          en: 'Low back pain, buttock referral',
          no: 'Korsryggssmerte, referering til sete',
        },
      },
      {
        id: 'iliolumb_2',
        cx: 118,
        cy: 195,
        referral: {
          en: 'Low back pain, buttock referral',
          no: 'Korsryggssmerte, referering til sete',
        },
      },
    ],
  },
  longissimus_thoracis: {
    en: { name: 'Longissimus Thoracis', abbr: 'LongTh' },
    no: { name: 'Longissimus Thoracis', abbr: 'LongTh' },
    color: '#6D28D9',
    triggerPoints: [
      {
        id: 'longth_1',
        cx: 92,
        cy: 155,
        referral: { en: 'Local thoracic pain', no: 'Lokal thorakalsmerte' },
      },
      {
        id: 'longth_2',
        cx: 108,
        cy: 155,
        referral: { en: 'Local thoracic pain', no: 'Lokal thorakalsmerte' },
      },
    ],
  },
  multifidus: {
    en: { name: 'Multifidus', abbr: 'Multi' },
    no: { name: 'Multifidus', abbr: 'Multi' },
    color: '#5B21B6',
    triggerPoints: [
      {
        id: 'multi_1',
        cx: 95,
        cy: 170,
        referral: {
          en: 'Local spine pain, adjacent segments',
          no: 'Lokal ryggsmerte, tilstøtende segmenter',
        },
      },
      {
        id: 'multi_2',
        cx: 105,
        cy: 170,
        referral: {
          en: 'Local spine pain, adjacent segments',
          no: 'Lokal ryggsmerte, tilstøtende segmenter',
        },
      },
      {
        id: 'multi_3',
        cx: 95,
        cy: 210,
        referral: { en: 'Sacral, gluteal pain', no: 'Sakral, sete-smerte' },
      },
      {
        id: 'multi_4',
        cx: 105,
        cy: 210,
        referral: { en: 'Sacral, gluteal pain', no: 'Sakral, sete-smerte' },
      },
    ],
  },
  erector_spinae: {
    en: { name: 'Erector Spinae', abbr: 'ES' },
    no: { name: 'Erector Spinae', abbr: 'ES' },
    color: '#A855F7',
    triggerPoints: [
      {
        id: 'es_upper_1',
        cx: 88,
        cy: 145,
        referral: { en: 'Local mid-back pain', no: 'Lokal midtre ryggsmerte' },
      },
      {
        id: 'es_upper_2',
        cx: 112,
        cy: 145,
        referral: { en: 'Local mid-back pain', no: 'Lokal midtre ryggsmerte' },
      },
      {
        id: 'es_mid_1',
        cx: 88,
        cy: 175,
        referral: { en: 'Lower thoracic pain', no: 'Nedre thorakalsmerte' },
      },
      {
        id: 'es_mid_2',
        cx: 112,
        cy: 175,
        referral: { en: 'Lower thoracic pain', no: 'Nedre thorakalsmerte' },
      },
      {
        id: 'es_low_1',
        cx: 88,
        cy: 205,
        referral: { en: 'Lumbar pain, buttock referral', no: 'Lumbalsmerte, referering til sete' },
      },
      {
        id: 'es_low_2',
        cx: 112,
        cy: 205,
        referral: { en: 'Lumbar pain, buttock referral', no: 'Lumbalsmerte, referering til sete' },
      },
    ],
  },

  // ===========================================================================
  // BACK - LUMBAR
  // ===========================================================================
  quadratus_lumborum: {
    en: { name: 'Quadratus Lumborum', abbr: 'QL' },
    no: { name: 'Quadratus Lumborum', abbr: 'QL' },
    color: '#C026D3',
    triggerPoints: [
      {
        id: 'ql_sup_1',
        cx: 72,
        cy: 200,
        referral: {
          en: 'Hip crest, greater trochanter pain',
          no: 'Hoftekam, trochanter major smerte',
        },
      },
      {
        id: 'ql_sup_2',
        cx: 128,
        cy: 200,
        referral: {
          en: 'Hip crest, greater trochanter pain',
          no: 'Hoftekam, trochanter major smerte',
        },
      },
      {
        id: 'ql_deep_1',
        cx: 75,
        cy: 215,
        referral: { en: 'SI joint, lower buttock pain', no: 'SI-ledd, nedre setesmerte' },
      },
      {
        id: 'ql_deep_2',
        cx: 125,
        cy: 215,
        referral: { en: 'SI joint, lower buttock pain', no: 'SI-ledd, nedre setesmerte' },
      },
    ],
  },
  psoas_major: {
    en: { name: 'Psoas Major', abbr: 'Psoas' },
    no: { name: 'Psoas Major', abbr: 'Psoas' },
    color: '#A21CAF',
    triggerPoints: [
      {
        id: 'psoas_1',
        cx: 85,
        cy: 210,
        referral: {
          en: 'Low back (vertical band), upper thigh',
          no: 'Korsrygg (vertikalt bånd), øvre lår',
        },
      },
      {
        id: 'psoas_2',
        cx: 115,
        cy: 210,
        referral: {
          en: 'Low back (vertical band), upper thigh',
          no: 'Korsrygg (vertikalt bånd), øvre lår',
        },
      },
    ],
  },
  iliacus: {
    en: { name: 'Iliacus', abbr: 'Iliac' },
    no: { name: 'Iliacus', abbr: 'Iliac' },
    color: '#86198F',
    triggerPoints: [
      {
        id: 'iliac_1',
        cx: 78,
        cy: 230,
        referral: {
          en: 'Low back, anterior thigh, groin pain',
          no: 'Korsrygg, fremre lår, lyskesmerte',
        },
      },
      {
        id: 'iliac_2',
        cx: 122,
        cy: 230,
        referral: {
          en: 'Low back, anterior thigh, groin pain',
          no: 'Korsrygg, fremre lår, lyskesmerte',
        },
      },
    ],
  },

  // ===========================================================================
  // ARM - UPPER
  // ===========================================================================
  biceps_brachii: {
    en: { name: 'Biceps Brachii', abbr: 'Biceps' },
    no: { name: 'Biceps Brachii', abbr: 'Biceps' },
    color: '#059669',
    triggerPoints: [
      {
        id: 'biceps_1',
        cx: 38,
        cy: 145,
        referral: {
          en: 'Anterior shoulder, bicipital groove pain',
          no: 'Fremre skulder, bicepssmerte',
        },
      },
      {
        id: 'biceps_2',
        cx: 162,
        cy: 145,
        referral: {
          en: 'Anterior shoulder, bicipital groove pain',
          no: 'Fremre skulder, bicepssmerte',
        },
      },
    ],
  },
  triceps_brachii: {
    en: { name: 'Triceps Brachii', abbr: 'Triceps' },
    no: { name: 'Triceps Brachii', abbr: 'Triceps' },
    color: '#047857',
    triggerPoints: [
      {
        id: 'triceps_long_1',
        cx: 42,
        cy: 150,
        referral: {
          en: 'Posterior arm, lateral epicondyle',
          no: 'Bakre overarm, lateral epikondyl',
        },
      },
      {
        id: 'triceps_long_2',
        cx: 158,
        cy: 150,
        referral: {
          en: 'Posterior arm, lateral epicondyle',
          no: 'Bakre overarm, lateral epikondyl',
        },
      },
      {
        id: 'triceps_lat_1',
        cx: 40,
        cy: 165,
        referral: {
          en: 'Lateral epicondyle, 4th-5th fingers',
          no: 'Lateral epikondyl, 4.-5. finger',
        },
      },
      {
        id: 'triceps_lat_2',
        cx: 160,
        cy: 165,
        referral: {
          en: 'Lateral epicondyle, 4th-5th fingers',
          no: 'Lateral epikondyl, 4.-5. finger',
        },
      },
    ],
  },
  brachialis: {
    en: { name: 'Brachialis', abbr: 'Brach' },
    no: { name: 'Brachialis', abbr: 'Brach' },
    color: '#065F46',
    triggerPoints: [
      {
        id: 'brach_1',
        cx: 35,
        cy: 160,
        referral: {
          en: 'Base of thumb pain, anterior elbow',
          no: 'Tommelrotssmerte, fremre albue',
        },
      },
      {
        id: 'brach_2',
        cx: 165,
        cy: 160,
        referral: {
          en: 'Base of thumb pain, anterior elbow',
          no: 'Tommelrotssmerte, fremre albue',
        },
      },
    ],
  },
  coracobrachialis: {
    en: { name: 'Coracobrachialis', abbr: 'Coraco' },
    no: { name: 'Coracobrachialis', abbr: 'Coraco' },
    color: '#064E3B',
    triggerPoints: [
      {
        id: 'coraco_1',
        cx: 45,
        cy: 130,
        referral: {
          en: 'Anterior deltoid, triceps, dorsal forearm',
          no: 'Fremre deltoid, triceps, dorsale underarm',
        },
      },
      {
        id: 'coraco_2',
        cx: 155,
        cy: 130,
        referral: {
          en: 'Anterior deltoid, triceps, dorsal forearm',
          no: 'Fremre deltoid, triceps, dorsale underarm',
        },
      },
    ],
  },

  // ===========================================================================
  // ARM - FOREARM
  // ===========================================================================
  brachioradialis: {
    en: { name: 'Brachioradialis', abbr: 'BrachioR' },
    no: { name: 'Brachioradialis', abbr: 'BrachioR' },
    color: '#0D9488',
    triggerPoints: [
      {
        id: 'brachior_1',
        cx: 30,
        cy: 180,
        referral: {
          en: 'Lateral epicondyle, dorsal web thumb',
          no: 'Lateral epikondyl, dorsal tommelhudfold',
        },
      },
      {
        id: 'brachior_2',
        cx: 170,
        cy: 180,
        referral: {
          en: 'Lateral epicondyle, dorsal web thumb',
          no: 'Lateral epikondyl, dorsal tommelhudfold',
        },
      },
    ],
  },
  extensor_carpi_radialis: {
    en: { name: 'Ext. Carpi Radialis', abbr: 'ECR' },
    no: { name: 'Ext. Carpi Radialis', abbr: 'ECR' },
    color: '#0F766E',
    triggerPoints: [
      {
        id: 'ecr_1',
        cx: 28,
        cy: 195,
        referral: {
          en: 'Lateral epicondyle, dorsal wrist, hand',
          no: 'Lateral epikondyl, dorsal håndledd, hånd',
        },
      },
      {
        id: 'ecr_2',
        cx: 172,
        cy: 195,
        referral: {
          en: 'Lateral epicondyle, dorsal wrist, hand',
          no: 'Lateral epikondyl, dorsal håndledd, hånd',
        },
      },
    ],
  },
  extensor_carpi_ulnaris: {
    en: { name: 'Ext. Carpi Ulnaris', abbr: 'ECU' },
    no: { name: 'Ext. Carpi Ulnaris', abbr: 'ECU' },
    color: '#115E59',
    triggerPoints: [
      {
        id: 'ecu_1',
        cx: 32,
        cy: 205,
        referral: { en: 'Ulnar dorsal wrist pain', no: 'Ulnar dorsal håndleddsmerte' },
      },
      {
        id: 'ecu_2',
        cx: 168,
        cy: 205,
        referral: { en: 'Ulnar dorsal wrist pain', no: 'Ulnar dorsal håndleddsmerte' },
      },
    ],
  },
  extensor_digitorum: {
    en: { name: 'Ext. Digitorum', abbr: 'ED' },
    no: { name: 'Ext. Digitorum', abbr: 'ED' },
    color: '#134E4A',
    triggerPoints: [
      {
        id: 'ed_1',
        cx: 30,
        cy: 210,
        referral: { en: 'Finger pain, lateral epicondyle', no: 'Fingersmerte, lateral epikondyl' },
      },
      {
        id: 'ed_2',
        cx: 170,
        cy: 210,
        referral: { en: 'Finger pain, lateral epicondyle', no: 'Fingersmerte, lateral epikondyl' },
      },
    ],
  },
  flexor_carpi_radialis: {
    en: { name: 'Flex. Carpi Radialis', abbr: 'FCR' },
    no: { name: 'Flex. Carpi Radialis', abbr: 'FCR' },
    color: '#0E7490',
    triggerPoints: [
      {
        id: 'fcr_1',
        cx: 25,
        cy: 192,
        referral: { en: 'Volar wrist pain', no: 'Volar håndleddsmerte' },
      },
      {
        id: 'fcr_2',
        cx: 175,
        cy: 192,
        referral: { en: 'Volar wrist pain', no: 'Volar håndleddsmerte' },
      },
    ],
  },
  flexor_carpi_ulnaris: {
    en: { name: 'Flex. Carpi Ulnaris', abbr: 'FCU' },
    no: { name: 'Flex. Carpi Ulnaris', abbr: 'FCU' },
    color: '#155E75',
    triggerPoints: [
      {
        id: 'fcu_1',
        cx: 22,
        cy: 202,
        referral: { en: 'Ulnar volar wrist pain', no: 'Ulnar volar håndleddsmerte' },
      },
      {
        id: 'fcu_2',
        cx: 178,
        cy: 202,
        referral: { en: 'Ulnar volar wrist pain', no: 'Ulnar volar håndleddsmerte' },
      },
    ],
  },
  pronator_teres: {
    en: { name: 'Pronator Teres', abbr: 'PT' },
    no: { name: 'Pronator Teres', abbr: 'PT' },
    color: '#164E63',
    triggerPoints: [
      {
        id: 'pt_1',
        cx: 28,
        cy: 185,
        referral: {
          en: 'Volar forearm, radial wrist pain',
          no: 'Volar underarm, radial håndleddsmerte',
        },
      },
      {
        id: 'pt_2',
        cx: 172,
        cy: 185,
        referral: {
          en: 'Volar forearm, radial wrist pain',
          no: 'Volar underarm, radial håndleddsmerte',
        },
      },
    ],
  },
  supinator: {
    en: { name: 'Supinator', abbr: 'Supin' },
    no: { name: 'Supinator', abbr: 'Supin' },
    color: '#083344',
    triggerPoints: [
      {
        id: 'supin_1',
        cx: 30,
        cy: 175,
        referral: {
          en: 'Lateral epicondyle, web of thumb',
          no: 'Lateral epikondyl, tommelhudfold',
        },
      },
      {
        id: 'supin_2',
        cx: 170,
        cy: 175,
        referral: {
          en: 'Lateral epicondyle, web of thumb',
          no: 'Lateral epikondyl, tommelhudfold',
        },
      },
    ],
  },

  // ===========================================================================
  // HAND
  // ===========================================================================
  opponens_pollicis: {
    en: { name: 'Opponens Pollicis', abbr: 'OppPoll' },
    no: { name: 'Opponens Pollicis', abbr: 'OppPoll' },
    color: '#1E3A8A',
    triggerPoints: [
      {
        id: 'opppoll_1',
        cx: 18,
        cy: 245,
        referral: { en: 'Thumb pain, palmar base of thumb', no: 'Tommelsmerte, volar tommelrot' },
      },
      {
        id: 'opppoll_2',
        cx: 182,
        cy: 245,
        referral: { en: 'Thumb pain, palmar base of thumb', no: 'Tommelsmerte, volar tommelrot' },
      },
    ],
  },
  adductor_pollicis: {
    en: { name: 'Adductor Pollicis', abbr: 'AddPoll' },
    no: { name: 'Adductor Pollicis', abbr: 'AddPoll' },
    color: '#1E40AF',
    triggerPoints: [
      {
        id: 'addpoll_1',
        cx: 15,
        cy: 252,
        referral: { en: 'Base of thumb, CMC joint pain', no: 'Tommelrot, CMC-leddsmerte' },
      },
      {
        id: 'addpoll_2',
        cx: 185,
        cy: 252,
        referral: { en: 'Base of thumb, CMC joint pain', no: 'Tommelrot, CMC-leddsmerte' },
      },
    ],
  },
  interossei: {
    en: { name: 'Interossei', abbr: 'IO' },
    no: { name: 'Interossei', abbr: 'IO' },
    color: '#1D4ED8',
    triggerPoints: [
      {
        id: 'io_1',
        cx: 18,
        cy: 260,
        referral: { en: 'Adjacent fingers, finger pain', no: 'Tilstøtende fingre, fingersmerte' },
      },
      {
        id: 'io_2',
        cx: 182,
        cy: 260,
        referral: { en: 'Adjacent fingers, finger pain', no: 'Tilstøtende fingre, fingersmerte' },
      },
    ],
  },

  // ===========================================================================
  // GLUTEAL & HIP
  // ===========================================================================
  gluteus_maximus: {
    en: { name: 'Gluteus Maximus', abbr: 'GMax' },
    no: { name: 'Gluteus Maximus', abbr: 'GMax' },
    color: '#EC4899',
    triggerPoints: [
      {
        id: 'gmax_1',
        cx: 68,
        cy: 242,
        referral: { en: 'Local buttock pain, coccyx pain', no: 'Lokal setesmerte, halesmerte' },
      },
      {
        id: 'gmax_2',
        cx: 132,
        cy: 242,
        referral: { en: 'Local buttock pain, coccyx pain', no: 'Lokal setesmerte, halesmerte' },
      },
      {
        id: 'gmax_3',
        cx: 72,
        cy: 252,
        referral: { en: 'Lower buttock, posterior thigh', no: 'Nedre sete, bakre lår' },
      },
      {
        id: 'gmax_4',
        cx: 128,
        cy: 252,
        referral: { en: 'Lower buttock, posterior thigh', no: 'Nedre sete, bakre lår' },
      },
    ],
  },
  gluteus_medius: {
    en: { name: 'Gluteus Medius', abbr: 'GMed' },
    no: { name: 'Gluteus Medius', abbr: 'GMed' },
    color: '#F43F5E',
    triggerPoints: [
      {
        id: 'gmed_post_1',
        cx: 62,
        cy: 232,
        referral: {
          en: 'Posterior crest, sacrum, buttock pain',
          no: 'Bakre hoftekam, sacrum, setesmerte',
        },
      },
      {
        id: 'gmed_post_2',
        cx: 138,
        cy: 232,
        referral: {
          en: 'Posterior crest, sacrum, buttock pain',
          no: 'Bakre hoftekam, sacrum, setesmerte',
        },
      },
      {
        id: 'gmed_ant_1',
        cx: 58,
        cy: 245,
        referral: {
          en: 'Low back, hip, lateral thigh pain',
          no: 'Korsrygg, hofte, lateral lårsmerte',
        },
      },
      {
        id: 'gmed_ant_2',
        cx: 142,
        cy: 245,
        referral: {
          en: 'Low back, hip, lateral thigh pain',
          no: 'Korsrygg, hofte, lateral lårsmerte',
        },
      },
    ],
  },
  gluteus_minimus: {
    en: { name: 'Gluteus Minimus', abbr: 'GMin' },
    no: { name: 'Gluteus Minimus', abbr: 'GMin' },
    color: '#E11D48',
    triggerPoints: [
      {
        id: 'gmin_ant_1',
        cx: 55,
        cy: 248,
        referral: {
          en: 'Lateral thigh, leg to ankle (L5-like)',
          no: 'Lateral lår, legg til ankel (L5-lignende)',
        },
      },
      {
        id: 'gmin_ant_2',
        cx: 145,
        cy: 248,
        referral: {
          en: 'Lateral thigh, leg to ankle (L5-like)',
          no: 'Lateral lår, legg til ankel (L5-lignende)',
        },
      },
      {
        id: 'gmin_post_1',
        cx: 58,
        cy: 255,
        referral: { en: 'Posterior thigh, calf (S1-like)', no: 'Bakre lår, legg (S1-lignende)' },
      },
      {
        id: 'gmin_post_2',
        cx: 142,
        cy: 255,
        referral: { en: 'Posterior thigh, calf (S1-like)', no: 'Bakre lår, legg (S1-lignende)' },
      },
    ],
  },
  piriformis: {
    en: { name: 'Piriformis', abbr: 'Piri' },
    no: { name: 'Piriformis', abbr: 'Piri' },
    color: '#FB7185',
    triggerPoints: [
      {
        id: 'piri_1',
        cx: 72,
        cy: 248,
        referral: {
          en: 'Buttock pain, posterior thigh, SI joint pain',
          no: 'Setesmerte, bakre lår, SI-leddsmerte',
        },
      },
      {
        id: 'piri_2',
        cx: 128,
        cy: 248,
        referral: {
          en: 'Buttock pain, posterior thigh, SI joint pain',
          no: 'Setesmerte, bakre lår, SI-leddsmerte',
        },
      },
      {
        id: 'piri_3',
        cx: 78,
        cy: 255,
        referral: { en: 'Sciatic-like leg pain', no: 'Isjiaslignende beinsmerte' },
      },
      {
        id: 'piri_4',
        cx: 122,
        cy: 255,
        referral: { en: 'Sciatic-like leg pain', no: 'Isjiaslignende beinsmerte' },
      },
    ],
  },
  tensor_fascia_latae: {
    en: { name: 'Tensor Fascia Latae', abbr: 'TFL' },
    no: { name: 'Tensor Fascia Latae', abbr: 'TFL' },
    color: '#FDA4AF',
    triggerPoints: [
      {
        id: 'tfl_1',
        cx: 55,
        cy: 260,
        referral: { en: 'Lateral hip, thigh pain', no: 'Lateral hofte, lårsmerte' },
      },
      {
        id: 'tfl_2',
        cx: 145,
        cy: 260,
        referral: { en: 'Lateral hip, thigh pain', no: 'Lateral hofte, lårsmerte' },
      },
    ],
  },
  obturator_internus: {
    en: { name: 'Obturator Internus', abbr: 'ObtInt' },
    no: { name: 'Obturator Internus', abbr: 'ObtInt' },
    color: '#FECDD3',
    triggerPoints: [
      {
        id: 'obtint_1',
        cx: 85,
        cy: 258,
        referral: {
          en: 'Coccyx, posterior thigh, vaginal/rectal fullness',
          no: 'Halebeinet, bakre lår, vaginal/rektal fylde',
        },
      },
      {
        id: 'obtint_2',
        cx: 115,
        cy: 258,
        referral: {
          en: 'Coccyx, posterior thigh, vaginal/rectal fullness',
          no: 'Halebeinet, bakre lår, vaginal/rektal fylde',
        },
      },
    ],
  },

  // ===========================================================================
  // THIGH - ANTERIOR
  // ===========================================================================
  rectus_femoris: {
    en: { name: 'Rectus Femoris', abbr: 'RecFem' },
    no: { name: 'Rectus Femoris', abbr: 'RecFem' },
    color: '#84CC16',
    triggerPoints: [
      {
        id: 'recfem_1',
        cx: 78,
        cy: 275,
        referral: {
          en: 'Deep knee pain (anterior), night pain',
          no: 'Dyp knesmerte (fremre), nattsmerte',
        },
      },
      {
        id: 'recfem_2',
        cx: 122,
        cy: 275,
        referral: {
          en: 'Deep knee pain (anterior), night pain',
          no: 'Dyp knesmerte (fremre), nattsmerte',
        },
      },
      {
        id: 'recfem_3',
        cx: 78,
        cy: 295,
        referral: { en: 'Anterior thigh, knee weakness', no: 'Fremre lår, knesvakhet' },
      },
      {
        id: 'recfem_4',
        cx: 122,
        cy: 295,
        referral: { en: 'Anterior thigh, knee weakness', no: 'Fremre lår, knesvakhet' },
      },
    ],
  },
  vastus_lateralis: {
    en: { name: 'Vastus Lateralis', abbr: 'VL' },
    no: { name: 'Vastus Lateralis', abbr: 'VL' },
    color: '#65A30D',
    triggerPoints: [
      {
        id: 'vl_1',
        cx: 62,
        cy: 285,
        referral: { en: 'Lateral thigh pain to knee', no: 'Lateral lårsmerte til kne' },
      },
      {
        id: 'vl_2',
        cx: 138,
        cy: 285,
        referral: { en: 'Lateral thigh pain to knee', no: 'Lateral lårsmerte til kne' },
      },
      {
        id: 'vl_3',
        cx: 60,
        cy: 310,
        referral: {
          en: 'Lateral knee pain, walking difficulty',
          no: 'Lateral knesmerte, gangvansker',
        },
      },
      {
        id: 'vl_4',
        cx: 140,
        cy: 310,
        referral: {
          en: 'Lateral knee pain, walking difficulty',
          no: 'Lateral knesmerte, gangvansker',
        },
      },
    ],
  },
  vastus_medialis: {
    en: { name: 'Vastus Medialis', abbr: 'VM' },
    no: { name: 'Vastus Medialis', abbr: 'VM' },
    color: '#4D7C0F',
    triggerPoints: [
      {
        id: 'vm_1',
        cx: 85,
        cy: 320,
        referral: { en: 'Medial knee pain, knee buckling', no: 'Medial knesmerte, knekk i kneet' },
      },
      {
        id: 'vm_2',
        cx: 115,
        cy: 320,
        referral: { en: 'Medial knee pain, knee buckling', no: 'Medial knesmerte, knekk i kneet' },
      },
    ],
  },
  vastus_intermedius: {
    en: { name: 'Vastus Intermedius', abbr: 'VI' },
    no: { name: 'Vastus Intermedius', abbr: 'VI' },
    color: '#3F6212',
    triggerPoints: [
      {
        id: 'vi_1',
        cx: 78,
        cy: 305,
        referral: {
          en: 'Anterior thigh, difficulty climbing stairs',
          no: 'Fremre lår, vansker med trappegåing',
        },
      },
      {
        id: 'vi_2',
        cx: 122,
        cy: 305,
        referral: {
          en: 'Anterior thigh, difficulty climbing stairs',
          no: 'Fremre lår, vansker med trappegåing',
        },
      },
    ],
  },
  sartorius: {
    en: { name: 'Sartorius', abbr: 'Sart' },
    no: { name: 'Sartorius', abbr: 'Sart' },
    color: '#365314',
    triggerPoints: [
      {
        id: 'sart_1',
        cx: 72,
        cy: 270,
        referral: {
          en: 'Superficial stinging, burning along muscle',
          no: 'Overflatisk stikkende, brennende langs muskelen',
        },
      },
      {
        id: 'sart_2',
        cx: 128,
        cy: 270,
        referral: {
          en: 'Superficial stinging, burning along muscle',
          no: 'Overflatisk stikkende, brennende langs muskelen',
        },
      },
    ],
  },

  // ===========================================================================
  // THIGH - POSTERIOR (HAMSTRINGS)
  // ===========================================================================
  biceps_femoris: {
    en: { name: 'Biceps Femoris', abbr: 'BicFem' },
    no: { name: 'Biceps Femoris', abbr: 'BicFem' },
    color: '#16A34A',
    triggerPoints: [
      {
        id: 'bicfem_1',
        cx: 62,
        cy: 290,
        referral: {
          en: 'Posterior knee, posterolateral thigh pain',
          no: 'Bakre kne, posterolateral lårsmerte',
        },
      },
      {
        id: 'bicfem_2',
        cx: 138,
        cy: 290,
        referral: {
          en: 'Posterior knee, posterolateral thigh pain',
          no: 'Bakre kne, posterolateral lårsmerte',
        },
      },
      {
        id: 'bicfem_3',
        cx: 65,
        cy: 320,
        referral: { en: 'Lower posterolateral thigh', no: 'Nedre posterolateral lår' },
      },
      {
        id: 'bicfem_4',
        cx: 135,
        cy: 320,
        referral: { en: 'Lower posterolateral thigh', no: 'Nedre posterolateral lår' },
      },
    ],
  },
  semitendinosus: {
    en: { name: 'Semitendinosus', abbr: 'SemiT' },
    no: { name: 'Semitendinosus', abbr: 'SemiT' },
    color: '#15803D',
    triggerPoints: [
      {
        id: 'semit_1',
        cx: 80,
        cy: 305,
        referral: { en: 'Posterior thigh, medial knee pain', no: 'Bakre lår, medial knesmerte' },
      },
      {
        id: 'semit_2',
        cx: 120,
        cy: 305,
        referral: { en: 'Posterior thigh, medial knee pain', no: 'Bakre lår, medial knesmerte' },
      },
    ],
  },
  semimembranosus: {
    en: { name: 'Semimembranosus', abbr: 'SemiM' },
    no: { name: 'Semimembranosus', abbr: 'SemiM' },
    color: '#166534',
    triggerPoints: [
      {
        id: 'semim_1',
        cx: 82,
        cy: 318,
        referral: { en: 'Posterior knee, medial calf pain', no: 'Bakre kne, medial leggsmerte' },
      },
      {
        id: 'semim_2',
        cx: 118,
        cy: 318,
        referral: { en: 'Posterior knee, medial calf pain', no: 'Bakre kne, medial leggsmerte' },
      },
    ],
  },

  // ===========================================================================
  // THIGH - ADDUCTORS
  // ===========================================================================
  adductor_longus: {
    en: { name: 'Adductor Longus', abbr: 'AddLong' },
    no: { name: 'Adductor Longus', abbr: 'AddLong' },
    color: '#22C55E',
    triggerPoints: [
      {
        id: 'addlong_1',
        cx: 88,
        cy: 275,
        referral: { en: 'Groin pain, anteromedial thigh', no: 'Lyskesmerte, anteromedial lår' },
      },
      {
        id: 'addlong_2',
        cx: 112,
        cy: 275,
        referral: { en: 'Groin pain, anteromedial thigh', no: 'Lyskesmerte, anteromedial lår' },
      },
    ],
  },
  adductor_magnus: {
    en: { name: 'Adductor Magnus', abbr: 'AddMag' },
    no: { name: 'Adductor Magnus', abbr: 'AddMag' },
    color: '#4ADE80',
    triggerPoints: [
      {
        id: 'addmag_1',
        cx: 85,
        cy: 285,
        referral: { en: 'Medial thigh, groin, pelvis pain', no: 'Medial lår, lyske, bekkensmerte' },
      },
      {
        id: 'addmag_2',
        cx: 115,
        cy: 285,
        referral: { en: 'Medial thigh, groin, pelvis pain', no: 'Medial lår, lyske, bekkensmerte' },
      },
      {
        id: 'addmag_3',
        cx: 85,
        cy: 305,
        referral: { en: 'Deep pelvic pain', no: 'Dyp bekkensmerte' },
      },
      {
        id: 'addmag_4',
        cx: 115,
        cy: 305,
        referral: { en: 'Deep pelvic pain', no: 'Dyp bekkensmerte' },
      },
    ],
  },
  gracilis: {
    en: { name: 'Gracilis', abbr: 'Grac' },
    no: { name: 'Gracilis', abbr: 'Grac' },
    color: '#86EFAC',
    triggerPoints: [
      {
        id: 'grac_1',
        cx: 90,
        cy: 300,
        referral: { en: 'Hot, stinging medial thigh pain', no: 'Varm, stikkende medial lårsmerte' },
      },
      {
        id: 'grac_2',
        cx: 110,
        cy: 300,
        referral: { en: 'Hot, stinging medial thigh pain', no: 'Varm, stikkende medial lårsmerte' },
      },
    ],
  },
  pectineus: {
    en: { name: 'Pectineus', abbr: 'Pect' },
    no: { name: 'Pectineus', abbr: 'Pect' },
    color: '#BBF7D0',
    triggerPoints: [
      { id: 'pect_1', cx: 85, cy: 262, referral: { en: 'Deep groin pain', no: 'Dyp lyskesmerte' } },
      {
        id: 'pect_2',
        cx: 115,
        cy: 262,
        referral: { en: 'Deep groin pain', no: 'Dyp lyskesmerte' },
      },
    ],
  },

  // ===========================================================================
  // IT BAND / LATERAL THIGH
  // ===========================================================================
  iliotibial_band: {
    en: { name: 'IT Band / TFL', abbr: 'ITB' },
    no: { name: 'IT-båndet / TFL', abbr: 'ITB' },
    color: '#A3E635',
    triggerPoints: [
      {
        id: 'itb_1',
        cx: 55,
        cy: 295,
        referral: { en: 'Lateral thigh pain', no: 'Lateral lårsmerte' },
      },
      {
        id: 'itb_2',
        cx: 145,
        cy: 295,
        referral: { en: 'Lateral thigh pain', no: 'Lateral lårsmerte' },
      },
      {
        id: 'itb_3',
        cx: 58,
        cy: 330,
        referral: { en: 'Lateral knee pain', no: 'Lateral knesmerte' },
      },
      {
        id: 'itb_4',
        cx: 142,
        cy: 330,
        referral: { en: 'Lateral knee pain', no: 'Lateral knesmerte' },
      },
    ],
  },

  // ===========================================================================
  // KNEE
  // ===========================================================================
  popliteus: {
    en: { name: 'Popliteus', abbr: 'Poplit' },
    no: { name: 'Popliteus', abbr: 'Poplit' },
    color: '#0EA5E9',
    triggerPoints: [
      {
        id: 'poplit_1',
        cx: 78,
        cy: 345,
        referral: {
          en: 'Posterior knee pain, walking downhill',
          no: 'Bakre knesmerte, gange nedover',
        },
      },
      {
        id: 'poplit_2',
        cx: 122,
        cy: 345,
        referral: {
          en: 'Posterior knee pain, walking downhill',
          no: 'Bakre knesmerte, gange nedover',
        },
      },
    ],
  },

  // ===========================================================================
  // LOWER LEG - ANTERIOR
  // ===========================================================================
  tibialis_anterior: {
    en: { name: 'Tibialis Anterior', abbr: 'TA' },
    no: { name: 'Tibialis Anterior', abbr: 'TA' },
    color: '#0369A1',
    triggerPoints: [
      {
        id: 'ta_1',
        cx: 82,
        cy: 375,
        referral: { en: 'Anterior ankle, big toe pain', no: 'Fremre ankel, stortåsmerte' },
      },
      {
        id: 'ta_2',
        cx: 118,
        cy: 375,
        referral: { en: 'Anterior ankle, big toe pain', no: 'Fremre ankel, stortåsmerte' },
      },
    ],
  },
  extensor_digitorum_longus: {
    en: { name: 'Ext. Digitorum Longus', abbr: 'EDL' },
    no: { name: 'Ext. Digitorum Longus', abbr: 'EDL' },
    color: '#0284C7',
    triggerPoints: [
      {
        id: 'edl_1',
        cx: 78,
        cy: 382,
        referral: { en: 'Dorsum foot, 2nd-4th toes pain', no: 'Fotryggen, 2.-4. tå smerte' },
      },
      {
        id: 'edl_2',
        cx: 122,
        cy: 382,
        referral: { en: 'Dorsum foot, 2nd-4th toes pain', no: 'Fotryggen, 2.-4. tå smerte' },
      },
    ],
  },
  extensor_hallucis_longus: {
    en: { name: 'Ext. Hallucis Longus', abbr: 'EHL' },
    no: { name: 'Ext. Hallucis Longus', abbr: 'EHL' },
    color: '#0EA5E9',
    triggerPoints: [
      {
        id: 'ehl_1',
        cx: 80,
        cy: 390,
        referral: { en: 'Dorsum foot, big toe pain', no: 'Fotryggen, stortåsmerte' },
      },
      {
        id: 'ehl_2',
        cx: 120,
        cy: 390,
        referral: { en: 'Dorsum foot, big toe pain', no: 'Fotryggen, stortåsmerte' },
      },
    ],
  },

  // ===========================================================================
  // LOWER LEG - LATERAL
  // ===========================================================================
  peroneus_longus: {
    en: { name: 'Peroneus Longus', abbr: 'PerL' },
    no: { name: 'Peroneus Longus', abbr: 'PerL' },
    color: '#38BDF8',
    triggerPoints: [
      {
        id: 'perl_1',
        cx: 68,
        cy: 378,
        referral: { en: 'Lateral ankle, lateral malleolus', no: 'Lateral ankel, laterale malleol' },
      },
      {
        id: 'perl_2',
        cx: 132,
        cy: 378,
        referral: { en: 'Lateral ankle, lateral malleolus', no: 'Lateral ankel, laterale malleol' },
      },
    ],
  },
  peroneus_brevis: {
    en: { name: 'Peroneus Brevis', abbr: 'PerB' },
    no: { name: 'Peroneus Brevis', abbr: 'PerB' },
    color: '#7DD3FC',
    triggerPoints: [
      {
        id: 'perb_1',
        cx: 65,
        cy: 395,
        referral: { en: 'Lateral ankle, 5th metatarsal', no: 'Lateral ankel, 5. metatarsal' },
      },
      {
        id: 'perb_2',
        cx: 135,
        cy: 395,
        referral: { en: 'Lateral ankle, 5th metatarsal', no: 'Lateral ankel, 5. metatarsal' },
      },
    ],
  },
  peroneus_tertius: {
    en: { name: 'Peroneus Tertius', abbr: 'PerT' },
    no: { name: 'Peroneus Tertius', abbr: 'PerT' },
    color: '#BAE6FD',
    triggerPoints: [
      {
        id: 'pert_1',
        cx: 68,
        cy: 410,
        referral: { en: 'Anterolateral ankle pain', no: 'Anterolateral ankelsmerte' },
      },
      {
        id: 'pert_2',
        cx: 132,
        cy: 410,
        referral: { en: 'Anterolateral ankle pain', no: 'Anterolateral ankelsmerte' },
      },
    ],
  },

  // ===========================================================================
  // LOWER LEG - POSTERIOR
  // ===========================================================================
  gastrocnemius: {
    en: { name: 'Gastrocnemius', abbr: 'Gastroc' },
    no: { name: 'Gastrocnemius', abbr: 'Gastroc' },
    color: '#0891B2',
    triggerPoints: [
      {
        id: 'gastroc_med_1',
        cx: 82,
        cy: 365,
        referral: {
          en: 'Calf cramp, medial calf, instep pain',
          no: 'Leggkrampe, medial legg, vristsmerte',
        },
      },
      {
        id: 'gastroc_med_2',
        cx: 118,
        cy: 365,
        referral: {
          en: 'Calf cramp, medial calf, instep pain',
          no: 'Leggkrampe, medial legg, vristsmerte',
        },
      },
      {
        id: 'gastroc_lat_1',
        cx: 72,
        cy: 375,
        referral: { en: 'Posterior knee, lateral calf pain', no: 'Bakre kne, lateral leggsmerte' },
      },
      {
        id: 'gastroc_lat_2',
        cx: 128,
        cy: 375,
        referral: { en: 'Posterior knee, lateral calf pain', no: 'Bakre kne, lateral leggsmerte' },
      },
    ],
  },
  soleus: {
    en: { name: 'Soleus', abbr: 'Sol' },
    no: { name: 'Soleus', abbr: 'Sol' },
    color: '#06B6D4',
    triggerPoints: [
      {
        id: 'sol_1',
        cx: 78,
        cy: 395,
        referral: {
          en: 'Heel pain, plantar fascia, calf pain',
          no: 'Hælsmerte, plantar fascia, leggsmerte',
        },
      },
      {
        id: 'sol_2',
        cx: 122,
        cy: 395,
        referral: {
          en: 'Heel pain, plantar fascia, calf pain',
          no: 'Hælsmerte, plantar fascia, leggsmerte',
        },
      },
      {
        id: 'sol_3',
        cx: 78,
        cy: 410,
        referral: {
          en: 'SI joint referral, ipsilateral cheek',
          no: 'SI-ledd referanse, ipsilateral kinn',
        },
      },
      {
        id: 'sol_4',
        cx: 122,
        cy: 410,
        referral: {
          en: 'SI joint referral, ipsilateral cheek',
          no: 'SI-ledd referanse, ipsilateral kinn',
        },
      },
    ],
  },
  plantaris: {
    en: { name: 'Plantaris', abbr: 'Plant' },
    no: { name: 'Plantaris', abbr: 'Plant' },
    color: '#14B8A6',
    triggerPoints: [
      {
        id: 'plant_1',
        cx: 82,
        cy: 355,
        referral: { en: 'Posterior knee, calf pain', no: 'Bakre kne, leggsmerte' },
      },
      {
        id: 'plant_2',
        cx: 118,
        cy: 355,
        referral: { en: 'Posterior knee, calf pain', no: 'Bakre kne, leggsmerte' },
      },
    ],
  },

  // ===========================================================================
  // LOWER LEG - DEEP POSTERIOR
  // ===========================================================================
  tibialis_posterior: {
    en: { name: 'Tibialis Posterior', abbr: 'TP' },
    no: { name: 'Tibialis Posterior', abbr: 'TP' },
    color: '#2DD4BF',
    triggerPoints: [
      {
        id: 'tp_1',
        cx: 82,
        cy: 405,
        referral: {
          en: 'Achilles area, plantar surface pain',
          no: 'Akillesområdet, plantar flatesmerte',
        },
      },
      {
        id: 'tp_2',
        cx: 118,
        cy: 405,
        referral: {
          en: 'Achilles area, plantar surface pain',
          no: 'Akillesområdet, plantar flatesmerte',
        },
      },
    ],
  },
  flexor_digitorum_longus: {
    en: { name: 'Flex. Digitorum Longus', abbr: 'FDL' },
    no: { name: 'Flex. Digitorum Longus', abbr: 'FDL' },
    color: '#5EEAD4',
    triggerPoints: [
      {
        id: 'fdl_1',
        cx: 85,
        cy: 420,
        referral: { en: 'Plantar foot, toe pain', no: 'Plantar fot, tåsmerte' },
      },
      {
        id: 'fdl_2',
        cx: 115,
        cy: 420,
        referral: { en: 'Plantar foot, toe pain', no: 'Plantar fot, tåsmerte' },
      },
    ],
  },
  flexor_hallucis_longus: {
    en: { name: 'Flex. Hallucis Longus', abbr: 'FHL' },
    no: { name: 'Flex. Hallucis Longus', abbr: 'FHL' },
    color: '#99F6E4',
    triggerPoints: [
      {
        id: 'fhl_1',
        cx: 82,
        cy: 430,
        referral: { en: 'Big toe, plantar fascia pain', no: 'Stortå, plantar fascia smerte' },
      },
      {
        id: 'fhl_2',
        cx: 118,
        cy: 430,
        referral: { en: 'Big toe, plantar fascia pain', no: 'Stortå, plantar fascia smerte' },
      },
    ],
  },

  // ===========================================================================
  // FOOT - INTRINSIC
  // ===========================================================================
  abductor_hallucis: {
    en: { name: 'Abductor Hallucis', abbr: 'AbdHall' },
    no: { name: 'Abductor Hallucis', abbr: 'AbdHall' },
    color: '#F472B6',
    triggerPoints: [
      {
        id: 'abdhall_1',
        cx: 72,
        cy: 465,
        referral: { en: 'Medial heel, instep pain', no: 'Medial hæl, vristsmerte' },
      },
      {
        id: 'abdhall_2',
        cx: 128,
        cy: 465,
        referral: { en: 'Medial heel, instep pain', no: 'Medial hæl, vristsmerte' },
      },
    ],
  },
  flexor_digitorum_brevis: {
    en: { name: 'Flex. Digitorum Brevis', abbr: 'FDB' },
    no: { name: 'Flex. Digitorum Brevis', abbr: 'FDB' },
    color: '#EC4899',
    triggerPoints: [
      {
        id: 'fdb_1',
        cx: 75,
        cy: 472,
        referral: { en: 'Plantar pain, metatarsal heads', no: 'Plantar smerte, metatarsalhoder' },
      },
      {
        id: 'fdb_2',
        cx: 125,
        cy: 472,
        referral: { en: 'Plantar pain, metatarsal heads', no: 'Plantar smerte, metatarsalhoder' },
      },
    ],
  },
  quadratus_plantae: {
    en: { name: 'Quadratus Plantae', abbr: 'QP' },
    no: { name: 'Quadratus Plantae', abbr: 'QP' },
    color: '#DB2777',
    triggerPoints: [
      {
        id: 'qp_1',
        cx: 78,
        cy: 468,
        referral: { en: 'Plantar heel pain', no: 'Plantar hælsmerte' },
      },
      {
        id: 'qp_2',
        cx: 122,
        cy: 468,
        referral: { en: 'Plantar heel pain', no: 'Plantar hælsmerte' },
      },
    ],
  },
  abductor_digiti_minimi: {
    en: { name: 'Abductor Digiti Minimi', abbr: 'AbdDM' },
    no: { name: 'Abductor Digiti Minimi', abbr: 'AbdDM' },
    color: '#BE185D',
    triggerPoints: [
      {
        id: 'abddigmin_1',
        cx: 68,
        cy: 475,
        referral: {
          en: 'Lateral plantar, 5th metatarsal pain',
          no: 'Lateral plantar, 5. metatarsal smerte',
        },
      },
      {
        id: 'abddigmin_2',
        cx: 132,
        cy: 475,
        referral: {
          en: 'Lateral plantar, 5th metatarsal pain',
          no: 'Lateral plantar, 5. metatarsal smerte',
        },
      },
    ],
  },
  extensor_digitorum_brevis: {
    en: { name: 'Ext. Digitorum Brevis', abbr: 'EDB' },
    no: { name: 'Ext. Digitorum Brevis', abbr: 'EDB' },
    color: '#9D174D',
    triggerPoints: [
      {
        id: 'edb_1',
        cx: 70,
        cy: 458,
        referral: { en: 'Dorsum foot, toe pain', no: 'Fotryggen, tåsmerte' },
      },
      {
        id: 'edb_2',
        cx: 130,
        cy: 458,
        referral: { en: 'Dorsum foot, toe pain', no: 'Fotryggen, tåsmerte' },
      },
    ],
  },

  // ===========================================================================
  // ABDOMINAL
  // ===========================================================================
  rectus_abdominis: {
    en: { name: 'Rectus Abdominis', abbr: 'RA' },
    no: { name: 'Rectus Abdominis', abbr: 'RA' },
    color: '#F59E0B',
    triggerPoints: [
      {
        id: 'ra_upper_1',
        cx: 92,
        cy: 155,
        referral: {
          en: 'Mid-back pain, heartburn-like',
          no: 'Midtre ryggsmerte, halsbrannlignende',
        },
      },
      {
        id: 'ra_upper_2',
        cx: 108,
        cy: 155,
        referral: {
          en: 'Mid-back pain, heartburn-like',
          no: 'Midtre ryggsmerte, halsbrannlignende',
        },
      },
      {
        id: 'ra_mid_1',
        cx: 92,
        cy: 180,
        referral: {
          en: 'Abdominal cramps, dysmenorrhea-like',
          no: 'Magekramper, menstruasjonslignende',
        },
      },
      {
        id: 'ra_mid_2',
        cx: 108,
        cy: 180,
        referral: {
          en: 'Abdominal cramps, dysmenorrhea-like',
          no: 'Magekramper, menstruasjonslignende',
        },
      },
      {
        id: 'ra_low_1',
        cx: 92,
        cy: 205,
        referral: {
          en: 'Low abdominal pain, bladder symptoms',
          no: 'Nedre magesmerter, blæresymptomer',
        },
      },
      {
        id: 'ra_low_2',
        cx: 108,
        cy: 205,
        referral: {
          en: 'Low abdominal pain, bladder symptoms',
          no: 'Nedre magesmerter, blæresymptomer',
        },
      },
    ],
  },
  obliques_external: {
    en: { name: 'External Obliques', abbr: 'ExtObl' },
    no: { name: 'Ytre Skråmuskler', abbr: 'YtreSkrå' },
    color: '#FBBF24',
    triggerPoints: [
      {
        id: 'extobl_1',
        cx: 65,
        cy: 175,
        referral: { en: 'Groin, testicular, bladder pain', no: 'Lyske, testikkel, blæresmerte' },
      },
      {
        id: 'extobl_2',
        cx: 135,
        cy: 175,
        referral: { en: 'Groin, testicular, bladder pain', no: 'Lyske, testikkel, blæresmerte' },
      },
    ],
  },
  obliques_internal: {
    en: { name: 'Internal Obliques', abbr: 'IntObl' },
    no: { name: 'Indre Skråmuskler', abbr: 'IndreSkrå' },
    color: '#FCD34D',
    triggerPoints: [
      {
        id: 'intobl_1',
        cx: 68,
        cy: 195,
        referral: { en: 'Groin, bladder, abdominal pain', no: 'Lyske, blære, magesmerter' },
      },
      {
        id: 'intobl_2',
        cx: 132,
        cy: 195,
        referral: { en: 'Groin, bladder, abdominal pain', no: 'Lyske, blære, magesmerter' },
      },
    ],
  },
  transversus_abdominis: {
    en: { name: 'Transversus Abdominis', abbr: 'TA' },
    no: { name: 'Transversus Abdominis', abbr: 'TA' },
    color: '#FDE68A',
    triggerPoints: [
      {
        id: 'transabs_1',
        cx: 70,
        cy: 188,
        referral: {
          en: 'Visceral pain, bloating sensation',
          no: 'Visceral smerte, oppblåsthetsfølelse',
        },
      },
      {
        id: 'transabs_2',
        cx: 130,
        cy: 188,
        referral: {
          en: 'Visceral pain, bloating sensation',
          no: 'Visceral smerte, oppblåsthetsfølelse',
        },
      },
    ],
  },
};

// =============================================================================
// DETAILED ANATOMICAL SVG PATHS
// =============================================================================
const ANATOMICAL_PATHS = {
  front: {
    // Main body outline - detailed anatomical proportions
    outline: `
      M 100 15
      C 85 15, 75 25, 75 40
      C 75 55, 85 65, 100 65
      C 115 65, 125 55, 125 40
      C 125 25, 115 15, 100 15
      M 100 65
      L 100 75
      M 85 75 L 115 75
      M 85 75 C 70 80, 55 85, 45 95
      M 115 75 C 130 80, 145 85, 155 95
      M 45 95 C 35 105, 30 120, 25 140
      C 20 160, 18 180, 15 200
      C 12 220, 10 240, 12 260
      L 20 270
      M 155 95 C 165 105, 170 120, 175 140
      C 180 160, 182 180, 185 200
      C 188 220, 190 240, 188 260
      L 180 270
      M 85 75 L 85 95
      C 80 110, 75 130, 70 150
      C 65 170, 63 190, 65 210
      L 70 230
      M 115 75 L 115 95
      C 120 110, 125 130, 130 150
      C 135 170, 137 190, 135 210
      L 130 230
      M 70 230 C 68 250, 70 270, 75 290
      C 78 310, 80 330, 80 350
      C 80 370, 78 390, 75 410
      C 72 430, 70 450, 68 470
      L 65 485
      M 130 230 C 132 250, 130 270, 125 290
      C 122 310, 120 330, 120 350
      C 120 370, 122 390, 125 410
      C 128 430, 130 450, 132 470
      L 135 485
    `,
    // Clavicle lines
    clavicle: `M 60 90 Q 100 85, 140 90`,
    // Chest muscles outline
    pectoralis: `
      M 70 100 Q 85 95, 100 100 Q 115 95, 130 100
      Q 135 120, 130 140 Q 115 145, 100 140 Q 85 145, 70 140
      Q 65 120, 70 100
    `,
    // Abdominal lines
    abdominals: `
      M 85 145 L 85 220
      M 115 145 L 115 220
      M 80 165 L 120 165
      M 80 185 L 120 185
      M 80 205 L 120 205
    `,
    // Hip bones
    pelvis: `
      M 65 220 Q 75 215, 85 225 L 100 235 L 115 225 Q 125 215, 135 220
      Q 140 240, 130 250 L 100 260 L 70 250 Q 60 240, 65 220
    `,
  },
  back: {
    outline: `
      M 100 15
      C 85 15, 75 25, 75 40
      C 75 55, 85 65, 100 65
      C 115 65, 125 55, 125 40
      C 125 25, 115 15, 100 15
      M 100 65 L 100 75
      M 85 75 L 115 75
      M 85 75 C 70 80, 55 85, 45 95
      M 115 75 C 130 80, 145 85, 155 95
      M 45 95 C 35 105, 30 120, 25 140
      C 20 160, 18 180, 15 200
      C 12 220, 10 240, 12 260
      L 20 270
      M 155 95 C 165 105, 170 120, 175 140
      C 180 160, 182 180, 185 200
      C 188 220, 190 240, 188 260
      L 180 270
      M 85 75 L 85 95
      C 80 110, 75 130, 70 150
      C 65 170, 63 190, 65 210
      L 70 230
      M 115 75 L 115 95
      C 120 110, 125 130, 130 150
      C 135 170, 137 190, 135 210
      L 130 230
      M 70 230 C 68 250, 70 270, 75 290
      C 78 310, 80 330, 80 350
      C 80 370, 78 390, 75 410
      C 72 430, 70 450, 68 470
      L 65 485
      M 130 230 C 132 250, 130 270, 125 290
      C 122 310, 120 330, 120 350
      C 120 370, 122 390, 125 410
      C 128 430, 130 450, 132 470
      L 135 485
    `,
    // Spine
    spine: `
      M 100 70 L 100 75
      M 100 80 L 100 85
      M 100 90 L 100 95
      M 100 100 L 100 105
      M 100 110 L 100 115
      M 100 120 L 100 125
      M 100 130 L 100 135
      M 100 140 L 100 145
      M 100 150 L 100 155
      M 100 160 L 100 165
      M 100 170 L 100 175
      M 100 180 L 100 185
      M 100 190 L 100 195
      M 100 200 L 100 205
      M 100 210 L 100 215
      M 100 220 L 100 225
      M 100 230 L 100 235
    `,
    // Scapulae
    scapulae: `
      M 60 100 Q 70 95, 80 105 L 85 130 Q 80 145, 70 140 L 60 120 Q 55 110, 60 100
      M 140 100 Q 130 95, 120 105 L 115 130 Q 120 145, 130 140 L 140 120 Q 145 110, 140 100
    `,
    // Sacrum
    sacrum: `
      M 90 235 Q 100 230, 110 235 L 110 255 Q 100 265, 90 255 L 90 235
    `,
  },
};

// =============================================================================
// DERMATOME REGION PATHS (simplified polygons for each dermatome area)
// =============================================================================
const DERMATOME_REGIONS = {
  front: {
    C5: { path: 'M 40 100 L 60 90 L 75 100 L 75 120 L 55 130 L 35 115 Z', cx: 55, cy: 110 },
    C6: { path: 'M 25 140 L 40 130 L 50 145 L 45 175 L 25 185 L 15 165 Z', cx: 32, cy: 158 },
    C7: { path: 'M 15 200 L 30 190 L 35 220 L 25 250 L 10 240 Z', cx: 22, cy: 220 },
    C8: { path: 'M 10 255 L 25 250 L 28 275 L 18 285 L 8 275 Z', cx: 18, cy: 268 },
    T1: { path: 'M 45 130 L 60 120 L 70 135 L 65 150 L 50 145 Z', cx: 58, cy: 136 },
    T4: { path: 'M 70 140 L 130 140 L 130 160 L 70 160 Z', cx: 100, cy: 150 },
    T10: { path: 'M 75 190 L 125 190 L 125 210 L 75 210 Z', cx: 100, cy: 200 },
    L1: { path: 'M 70 215 L 85 220 L 85 235 L 70 240 L 60 230 Z', cx: 75, cy: 228 },
    L2: { path: 'M 70 270 L 85 260 L 90 290 L 80 310 L 65 295 Z', cx: 78, cy: 285 },
    L3: { path: 'M 70 315 L 85 305 L 90 340 L 80 355 L 65 340 Z', cx: 78, cy: 330 },
    L4: { path: 'M 80 360 L 95 355 L 95 400 L 85 420 L 75 400 Z', cx: 86, cy: 385 },
    L5: { path: 'M 65 400 L 80 395 L 85 440 L 75 460 L 60 445 Z', cx: 73, cy: 425 },
    S1: { path: 'M 55 450 L 70 445 L 75 475 L 65 490 L 50 480 Z', cx: 63, cy: 465 },
  },
  back: {
    C2: { path: 'M 85 30 L 115 30 L 115 50 L 85 50 Z', cx: 100, cy: 40 },
    C3: { path: 'M 80 55 L 120 55 L 120 70 L 80 70 Z', cx: 100, cy: 62 },
    C4: { path: 'M 70 75 L 130 75 L 130 90 L 70 90 Z', cx: 100, cy: 82 },
    T1: { path: 'M 80 95 L 120 95 L 120 110 L 80 110 Z', cx: 100, cy: 102 },
    T6: { path: 'M 80 155 L 120 155 L 120 170 L 80 170 Z', cx: 100, cy: 162 },
    T12: { path: 'M 80 210 L 120 210 L 120 225 L 80 225 Z', cx: 100, cy: 217 },
    L1: { path: 'M 80 230 L 120 230 L 120 245 L 80 245 Z', cx: 100, cy: 237 },
    L5: { path: 'M 85 250 L 115 250 L 115 265 L 85 265 Z', cx: 100, cy: 257 },
    S1: { path: 'M 70 270 L 85 265 L 85 310 L 70 320 Z', cx: 78, cy: 292 },
    S2: { path: 'M 70 280 L 85 275 L 90 330 L 75 345 Z', cx: 80, cy: 310 },
  },
};

// =============================================================================
// SYMPTOM COLORS (reuse from BodyChartPanel)
// =============================================================================
const SYMPTOM_COLORS = {
  pain: '#EF4444',
  aching: '#F97316',
  sharp: '#DC2626',
  burning: '#F59E0B',
  numbness: '#3B82F6',
  tingling: '#8B5CF6',
  weakness: '#6B7280',
  stiffness: '#10B981',
  swelling: '#EC4899',
  tenderness: '#F472B6',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function AnatomicalBodyChart({
  value = { markers: [], selectedRegions: [] },
  onChange,
  onGenerateNarrative,
  lang = 'en',
  className = '',
}) {
  const t = LABELS[lang] || LABELS.en;

  // View state
  const [view, setView] = useState('front');

  // Layer visibility
  const [layers, setLayers] = useState({
    outline: true,
    dermatomes: false,
    muscles: false,
    triggerPoints: false,
  });

  // Layer panel expanded
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);

  // Selected info
  const [selectedDermatome, setSelectedDermatome] = useState(null);
  const [_selectedMuscle, setSelectedMuscle] = useState(null);
  const [selectedTriggerPoint, setSelectedTriggerPoint] = useState(null);

  // Symptom selection
  const [selectedSymptom, setSelectedSymptom] = useState('pain');
  const [intensity, _setIntensity] = useState(5);

  // Toggle layer
  const toggleLayer = useCallback((layer) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Handle dermatome click
  const handleDermatomeClick = useCallback((dermatomeId) => {
    setSelectedDermatome(dermatomeId);
    setSelectedMuscle(null);
    setSelectedTriggerPoint(null);
  }, []);

  // Handle muscle click
  const _handleMuscleClick = useCallback((muscleId) => {
    setSelectedMuscle(muscleId);
    setSelectedDermatome(null);
    setSelectedTriggerPoint(null);
  }, []);

  // Handle trigger point click - add marker
  const handleTriggerPointClick = useCallback(
    (muscle, triggerPoint) => {
      setSelectedTriggerPoint({ muscle, triggerPoint });

      // Add marker at trigger point location
      const newMarker = {
        id: Date.now(),
        regionId: `tp_${triggerPoint.id}`,
        view,
        symptom: selectedSymptom,
        intensity,
        description:
          typeof triggerPoint.referral === 'object'
            ? triggerPoint.referral[lang] || triggerPoint.referral.en
            : triggerPoint.referral,
        cx: triggerPoint.cx,
        cy: triggerPoint.cy,
        isTriggerPoint: true,
        muscle: muscle,
      };

      const newMarkers = [...(value.markers || []), newMarker];
      onChange({ ...value, markers: newMarkers });
    },
    [view, selectedSymptom, intensity, value, onChange]
  );

  // Remove marker
  const removeMarker = useCallback(
    (markerId) => {
      const newMarkers = (value.markers || []).filter((m) => m.id !== markerId);
      onChange({ ...value, markers: newMarkers });
    },
    [value, onChange]
  );

  // Clear all
  const clearAll = useCallback(() => {
    onChange({ markers: [], selectedRegions: [] });
    setSelectedDermatome(null);
    setSelectedMuscle(null);
    setSelectedTriggerPoint(null);
  }, [onChange]);

  // Generate narrative
  const generateNarrative = useCallback(() => {
    const markers = value.markers || [];
    if (markers.length === 0) {
      return '';
    }

    const parts = [];

    // Group by trigger points vs regular markers
    const tpMarkers = markers.filter((m) => m.isTriggerPoint);
    const regularMarkers = markers.filter((m) => !m.isTriggerPoint);

    if (tpMarkers.length > 0) {
      const tpList = tpMarkers.map((m) => {
        const muscle = MUSCLES[m.muscle];
        const muscleName = muscle ? muscle[lang]?.name || muscle.en.name : m.muscle;
        return `${muscleName} (${m.description})`;
      });

      parts.push(
        lang === 'no'
          ? `Triggerpunkter identifisert: ${tpList.join(', ')}.`
          : `Trigger points identified: ${tpList.join(', ')}.`
      );
    }

    if (regularMarkers.length > 0) {
      const regionList = regularMarkers.map((m) => {
        const symptomLabel =
          lang === 'no'
            ? {
                pain: 'smerte',
                aching: 'verkende',
                sharp: 'stikkende',
                burning: 'brennende',
                numbness: 'nummenhet',
                tingling: 'prikking',
                weakness: 'svakhet',
                stiffness: 'stivhet',
                swelling: 'hevelse',
                tenderness: 'ømhet',
              }[m.symptom]
            : m.symptom;
        return `${m.regionId} (${symptomLabel}, ${m.intensity}/10)`;
      });

      parts.push(
        lang === 'no'
          ? `Symptomområder: ${regionList.join(', ')}.`
          : `Symptom areas: ${regionList.join(', ')}.`
      );
    }

    const narrative = parts.join(' ');
    if (onGenerateNarrative) {
      onGenerateNarrative(narrative);
    }
    return narrative;
  }, [value.markers, lang, onGenerateNarrative]);

  // Get current view markers
  const currentMarkers = useMemo(
    () => (value.markers || []).filter((m) => m.view === view),
    [value.markers, view]
  );

  // Render dermatome regions
  const renderDermatomes = () => {
    const regions = DERMATOME_REGIONS[view] || {};
    return Object.entries(regions).map(([id, region]) => {
      const dermatome = DERMATOMES[id];
      if (!dermatome) {
        return null;
      }

      const isSelected = selectedDermatome === id;

      return (
        <g key={id}>
          <path
            d={region.path}
            fill={dermatome.color}
            fillOpacity={isSelected ? 0.6 : 0.3}
            stroke={isSelected ? '#000' : dermatome.color}
            strokeWidth={isSelected ? 2 : 1}
            className="cursor-pointer transition-all hover:fill-opacity-50"
            onClick={() => handleDermatomeClick(id)}
          />
          <text
            x={region.cx}
            y={region.cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#333"
            className="pointer-events-none"
          >
            {id}
          </text>
        </g>
      );
    });
  };

  // Render trigger points
  const renderTriggerPoints = () => {
    return Object.entries(MUSCLES).map(([muscleId, muscle]) => {
      return muscle.triggerPoints.map((tp) => {
        const isSelected = selectedTriggerPoint?.triggerPoint?.id === tp.id;
        const hasMarker = currentMarkers.some((m) => m.regionId === `tp_${tp.id}`);

        return (
          <g key={tp.id}>
            <circle
              cx={tp.cx}
              cy={tp.cy}
              r={isSelected ? 8 : 6}
              fill={hasMarker ? SYMPTOM_COLORS[selectedSymptom] : muscle.color}
              fillOpacity={hasMarker ? 0.9 : 0.7}
              stroke={isSelected ? '#000' : '#fff'}
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer transition-all hover:r-8"
              onClick={() => handleTriggerPointClick(muscleId, tp)}
            />
            {hasMarker && (
              <text
                x={tp.cx}
                y={tp.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fontWeight="bold"
                fill="#fff"
                className="pointer-events-none"
              >
                X
              </text>
            )}
          </g>
        );
      });
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            {t.title}
          </h3>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {['front', 'back'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t[v]}
                </button>
              ))}
            </div>

            {currentMarkers.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <RotateCcw className="w-4 h-4" />
                {t.clearAll}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Layer Controls Panel */}
        <div className="w-56 border-r border-gray-200 bg-gray-50">
          {/* Layer toggles */}
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={() => setLayerPanelOpen(!layerPanelOpen)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-700"
            >
              {t.layers}
              {layerPanelOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {layerPanelOpen && (
              <div className="mt-3 space-y-2">
                {[
                  { key: 'outline', icon: Circle, label: t.outline },
                  { key: 'dermatomes', icon: Zap, label: t.dermatomes },
                  { key: 'muscles', icon: Activity, label: t.muscles },
                  { key: 'triggerPoints', icon: Circle, label: t.triggerPoints },
                ].map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      layers[key]
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {layers[key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Symptom selector */}
          <div className="p-3 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">Symptom</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(SYMPTOM_COLORS)
                .slice(0, 6)
                .map(([symptom, color]) => (
                  <button
                    key={symptom}
                    onClick={() => setSelectedSymptom(symptom)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      selectedSymptom === symptom
                        ? 'bg-gray-200 ring-2 ring-blue-500'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    {symptom}
                  </button>
                ))}
            </div>
          </div>

          {/* Info panel */}
          <div className="p-3">
            {selectedDermatome && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500">{t.selectedDermatome}</p>
                <p className="font-bold text-gray-900">{selectedDermatome}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {DERMATOMES[selectedDermatome]?.[lang]?.area ||
                    DERMATOMES[selectedDermatome]?.en?.area}
                </p>
              </div>
            )}

            {selectedTriggerPoint && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500">{t.selectedMuscle}</p>
                <p className="font-bold text-gray-900">
                  {MUSCLES[selectedTriggerPoint.muscle]?.[lang]?.name ||
                    MUSCLES[selectedTriggerPoint.muscle]?.en?.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {typeof selectedTriggerPoint.triggerPoint.referral === 'object'
                    ? selectedTriggerPoint.triggerPoint.referral[lang] ||
                      selectedTriggerPoint.triggerPoint.referral.en
                    : selectedTriggerPoint.triggerPoint.referral}
                </p>
              </div>
            )}

            {!selectedDermatome && !selectedTriggerPoint && (
              <p className="text-sm text-gray-500 text-center">{t.noSelection}</p>
            )}
          </div>
        </div>

        {/* SVG Body Diagram */}
        <div className="flex-1 p-4">
          <svg viewBox="0 0 200 500" className="w-full max-w-md mx-auto">
            {/* Body outline */}
            {layers.outline && (
              <g className="body-outline">
                <path
                  d={ANATOMICAL_PATHS[view]?.outline}
                  fill="none"
                  stroke="#374151"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {view === 'front' && (
                  <>
                    <path
                      d={ANATOMICAL_PATHS.front.clavicle}
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="1"
                    />
                    <path
                      d={ANATOMICAL_PATHS.front.pectoralis}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="0.5"
                    />
                    <path
                      d={ANATOMICAL_PATHS.front.abdominals}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="0.5"
                    />
                  </>
                )}
                {view === 'back' && (
                  <>
                    <path
                      d={ANATOMICAL_PATHS.back.spine}
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <path
                      d={ANATOMICAL_PATHS.back.scapulae}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="0.5"
                    />
                    <path
                      d={ANATOMICAL_PATHS.back.sacrum}
                      fill="#F3F4F6"
                      stroke="#D1D5DB"
                      strokeWidth="0.5"
                    />
                  </>
                )}
              </g>
            )}

            {/* Dermatome layer */}
            {layers.dermatomes && <g className="dermatomes-layer">{renderDermatomes()}</g>}

            {/* Trigger points layer */}
            {layers.triggerPoints && (
              <g className="trigger-points-layer">{renderTriggerPoints()}</g>
            )}

            {/* Markers */}
            {currentMarkers
              .filter((m) => !m.isTriggerPoint)
              .map((marker) => (
                <g key={marker.id}>
                  <circle
                    cx={marker.cx || 100}
                    cy={marker.cy || 100}
                    r="10"
                    fill={SYMPTOM_COLORS[marker.symptom]}
                    fillOpacity="0.8"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={marker.cx || 100}
                    y={marker.cy || 100}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#fff"
                  >
                    {marker.intensity}
                  </text>
                </g>
              ))}
          </svg>
        </div>

        {/* Marker Legend */}
        <div className="w-64 border-l border-gray-200 p-3">
          <h4 className="font-medium text-gray-700 mb-3">{t.triggerPoints}</h4>

          {currentMarkers.length === 0 ? (
            <p className="text-sm text-gray-500">{t.clickToMark}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {currentMarkers.map((marker) => (
                <div key={marker.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <span
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: SYMPTOM_COLORS[marker.symptom] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {marker.isTriggerPoint
                        ? MUSCLES[marker.muscle]?.[lang]?.name || marker.muscle
                        : marker.regionId}
                    </p>
                    <p className="text-xs text-gray-500">{marker.description}</p>
                  </div>
                  <button
                    onClick={() => removeMarker(marker.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {currentMarkers.length > 0 && (
            <button
              onClick={generateNarrative}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t.generateNarrative}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Export data for use elsewhere
export { DERMATOMES, MUSCLES, DERMATOME_REGIONS, ANATOMICAL_PATHS };
