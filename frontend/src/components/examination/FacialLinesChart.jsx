/**
 * FacialLinesChart - Detailed facial anatomy chart with treatment lines
 *
 * Features:
 * - Detailed SVG face diagram (anterior and lateral views)
 * - Fascial lines overlay for manual therapy
 * - Facial muscle trigger points
 * - Cranial nerve distribution zones
 * - Toggle controls for each layer
 * - Bilingual support (Norwegian/English)
 *
 * Based on fascial line concepts and facial myofascial treatment protocols
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Layers, Eye, EyeOff, Zap, Activity, Circle,
  RotateCcw, FileText, ChevronDown, ChevronUp, User
} from 'lucide-react';

// =============================================================================
// BILINGUAL LABELS
// =============================================================================
const LABELS = {
  en: {
    title: 'Facial Lines Chart',
    subtitle: 'Fascial lines and treatment points',
    layers: 'Layers',
    outline: 'Face Outline',
    fascialLines: 'Fascial Lines',
    muscles: 'Muscles',
    triggerPoints: 'Trigger Points',
    nerves: 'Nerve Zones',
    anterior: 'Anterior View',
    lateral: 'Lateral View',
    showAll: 'Show All',
    hideAll: 'Hide All',
    selectedPoint: 'Selected Point',
    selectedLine: 'Selected Line',
    noSelection: 'Click on a point or line for details',
    generateNarrative: 'Generate Narrative',
    clearAll: 'Clear All',
    treatment: 'Treatment Notes',
    muscleInfo: 'Muscle Info',
    referralPattern: 'Referral Pattern',
    technique: 'Technique'
  },
  no: {
    title: 'Ansiktslinjer Kart',
    subtitle: 'Fascielinjer og behandlingspunkter',
    layers: 'Lag',
    outline: 'Ansiktsomriss',
    fascialLines: 'Fascielinjer',
    muscles: 'Muskler',
    triggerPoints: 'Triggerpunkter',
    nerves: 'Nervesoner',
    anterior: 'Forfra',
    lateral: 'Sidesyn',
    showAll: 'Vis Alle',
    hideAll: 'Skjul Alle',
    selectedPoint: 'Valgt Punkt',
    selectedLine: 'Valgt Linje',
    noSelection: 'Klikk på et punkt eller linje for detaljer',
    generateNarrative: 'Generer Narrativ',
    clearAll: 'Fjern Alle',
    treatment: 'Behandlingsnotater',
    muscleInfo: 'Muskelinfo',
    referralPattern: 'Referansemønster',
    technique: 'Teknikk'
  }
};

// =============================================================================
// FASCIAL LINES DATA - Based on myofascial chains of the face
// =============================================================================
export const FASCIAL_LINES = {
  superficial_frontal: {
    en: {
      name: 'Superficial Frontal Line',
      description: 'Runs from galea aponeurotica through frontalis to orbicularis oculi',
      technique: 'Light fascial glide from hairline to eyebrows'
    },
    no: {
      name: 'Overfladisk Frontallinje',
      description: 'Går fra galea aponeurotica gjennom frontalis til orbicularis oculi',
      technique: 'Lett fascieglidning fra hårfeste til øyenbryn'
    },
    color: '#3B82F6',
    path: 'M100,20 C100,35 95,50 95,65 C95,75 100,85 100,95',
    points: [
      { id: 'sfl_1', cx: 100, cy: 20, label: 'Galea' },
      { id: 'sfl_2', cx: 97, cy: 55, label: 'Frontalis' },
      { id: 'sfl_3', cx: 100, cy: 95, label: 'Glabella' }
    ]
  },
  temporal_masseteric: {
    en: {
      name: 'Temporal-Masseteric Line',
      description: 'Connects temporalis through zygomatic arch to masseter',
      technique: 'Cross-fiber massage along zygomatic arch'
    },
    no: {
      name: 'Temporal-Masseter Linje',
      description: 'Forbinder temporalis gjennom kinnbuen til masseter',
      technique: 'Tverrfibermassasje langs kinnbuen'
    },
    color: '#EF4444',
    path: 'M55,45 C55,75 60,100 70,140',
    points: [
      { id: 'tml_1', cx: 55, cy: 45, label: 'Temporalis' },
      { id: 'tml_2', cx: 58, cy: 85, label: 'Zygomatic' },
      { id: 'tml_3', cx: 70, cy: 140, label: 'Masseter' }
    ]
  },
  temporal_masseteric_r: {
    en: {
      name: 'Temporal-Masseteric Line (R)',
      description: 'Connects temporalis through zygomatic arch to masseter',
      technique: 'Cross-fiber massage along zygomatic arch'
    },
    no: {
      name: 'Temporal-Masseter Linje (H)',
      description: 'Forbinder temporalis gjennom kinnbuen til masseter',
      technique: 'Tverrfibermassasje langs kinnbuen'
    },
    color: '#EF4444',
    path: 'M145,45 C145,75 140,100 130,140',
    points: [
      { id: 'tml_r1', cx: 145, cy: 45, label: 'Temporalis' },
      { id: 'tml_r2', cx: 142, cy: 85, label: 'Zygomatic' },
      { id: 'tml_r3', cx: 130, cy: 140, label: 'Masseter' }
    ]
  },
  lateral_orbital: {
    en: {
      name: 'Lateral Orbital Line',
      description: 'Orbicularis oculi to zygomaticus major',
      technique: 'Gentle circular release around orbital rim'
    },
    no: {
      name: 'Lateral Orbital Linje',
      description: 'Orbicularis oculi til zygomaticus major',
      technique: 'Forsiktig sirkulær frigjøring rundt orbitalranden'
    },
    color: '#8B5CF6',
    path: 'M65,90 C55,100 55,115 60,130',
    points: [
      { id: 'lol_1', cx: 65, cy: 90, label: 'Orb. Oculi' },
      { id: 'lol_2', cx: 60, cy: 130, label: 'Zygomaticus' }
    ]
  },
  lateral_orbital_r: {
    en: {
      name: 'Lateral Orbital Line (R)',
      description: 'Orbicularis oculi to zygomaticus major',
      technique: 'Gentle circular release around orbital rim'
    },
    no: {
      name: 'Lateral Orbital Linje (H)',
      description: 'Orbicularis oculi til zygomaticus major',
      technique: 'Forsiktig sirkulær frigjøring rundt orbitalranden'
    },
    color: '#8B5CF6',
    path: 'M135,90 C145,100 145,115 140,130',
    points: [
      { id: 'lol_r1', cx: 135, cy: 90, label: 'Orb. Oculi' },
      { id: 'lol_r2', cx: 140, cy: 130, label: 'Zygomaticus' }
    ]
  },
  nasolabial: {
    en: {
      name: 'Nasolabial Line',
      description: 'Levator labii to orbicularis oris along nasolabial fold',
      technique: 'Myofascial release along nasolabial fold'
    },
    no: {
      name: 'Nasolabial Linje',
      description: 'Levator labii til orbicularis oris langs nasolabialfuren',
      technique: 'Myofascial frigjøring langs nasolabialfuren'
    },
    color: '#10B981',
    path: 'M80,115 C75,135 75,155 85,175',
    points: [
      { id: 'nl_1', cx: 80, cy: 115, label: 'Levator Labii' },
      { id: 'nl_2', cx: 77, cy: 145, label: 'Nasolabial' },
      { id: 'nl_3', cx: 85, cy: 175, label: 'Orb. Oris' }
    ]
  },
  nasolabial_r: {
    en: {
      name: 'Nasolabial Line (R)',
      description: 'Levator labii to orbicularis oris along nasolabial fold',
      technique: 'Myofascial release along nasolabial fold'
    },
    no: {
      name: 'Nasolabial Linje (H)',
      description: 'Levator labii til orbicularis oris langs nasolabialfuren',
      technique: 'Myofascial frigjøring langs nasolabialfuren'
    },
    color: '#10B981',
    path: 'M120,115 C125,135 125,155 115,175',
    points: [
      { id: 'nl_r1', cx: 120, cy: 115, label: 'Levator Labii' },
      { id: 'nl_r2', cx: 123, cy: 145, label: 'Nasolabial' },
      { id: 'nl_r3', cx: 115, cy: 175, label: 'Orb. Oris' }
    ]
  },
  mandibular: {
    en: {
      name: 'Mandibular Line',
      description: 'Follows the mandible from angle to mentalis',
      technique: 'Periosteal release along mandibular border'
    },
    no: {
      name: 'Mandibulær Linje',
      description: 'Følger mandibelen fra vinkel til mentalis',
      technique: 'Periosteal frigjøring langs mandibulær kant'
    },
    color: '#F59E0B',
    path: 'M55,160 C65,185 85,200 100,210',
    points: [
      { id: 'ml_1', cx: 55, cy: 160, label: 'Angle' },
      { id: 'ml_2', cx: 80, cy: 195, label: 'Body' },
      { id: 'ml_3', cx: 100, cy: 210, label: 'Mentalis' }
    ]
  },
  mandibular_r: {
    en: {
      name: 'Mandibular Line (R)',
      description: 'Follows the mandible from angle to mentalis',
      technique: 'Periosteal release along mandibular border'
    },
    no: {
      name: 'Mandibulær Linje (H)',
      description: 'Følger mandibelen fra vinkel til mentalis',
      technique: 'Periosteal frigjøring langs mandibulær kant'
    },
    color: '#F59E0B',
    path: 'M145,160 C135,185 115,200 100,210',
    points: [
      { id: 'ml_r1', cx: 145, cy: 160, label: 'Angle' },
      { id: 'ml_r2', cx: 120, cy: 195, label: 'Body' },
      { id: 'ml_r3', cx: 100, cy: 210, label: 'Mentalis' }
    ]
  },
  supraorbital: {
    en: {
      name: 'Supraorbital Line',
      description: 'Corrugator supercilii through procerus to nasalis',
      technique: 'Pincer technique along corrugator, gentle nasalis release'
    },
    no: {
      name: 'Supraorbital Linje',
      description: 'Corrugator supercilii gjennom procerus til nasalis',
      technique: 'Pinsetteknikk langs corrugator, forsiktig nasalis frigjøring'
    },
    color: '#EC4899',
    path: 'M70,80 C85,85 100,90 100,120',
    points: [
      { id: 'sol_1', cx: 70, cy: 80, label: 'Corrugator' },
      { id: 'sol_2', cx: 100, cy: 90, label: 'Procerus' },
      { id: 'sol_3', cx: 100, cy: 120, label: 'Nasalis' }
    ]
  }
};

// =============================================================================
// FACIAL MUSCLES DATA - With trigger points and referral patterns
// =============================================================================
export const FACIAL_MUSCLES = {
  frontalis: {
    en: {
      name: 'Frontalis',
      description: 'Raises eyebrows, wrinkles forehead'
    },
    no: {
      name: 'Frontalis',
      description: 'Hever øyebryn, rynker pannen'
    },
    color: '#3B82F6',
    triggerPoints: [
      { id: 'front_1', cx: 85, cy: 50, referral: { en: 'Frontal headache, forehead pain', no: 'Pannehodepine, pannesmerter' } },
      { id: 'front_2', cx: 115, cy: 50, referral: { en: 'Frontal headache, forehead pain', no: 'Pannehodepine, pannesmerter' } },
      { id: 'front_3', cx: 100, cy: 40, referral: { en: 'Central forehead tension', no: 'Sentral pannespenning' } }
    ]
  },
  orbicularis_oculi: {
    en: {
      name: 'Orbicularis Oculi',
      description: 'Closes eyelids, produces tears'
    },
    no: {
      name: 'Orbicularis Oculi',
      description: 'Lukker øyelokk, produserer tårer'
    },
    color: '#8B5CF6',
    triggerPoints: [
      { id: 'orb_oc_1', cx: 75, cy: 85, referral: { en: 'Periorbital pain, eye strain', no: 'Periorbital smerte, øyebelastning' } },
      { id: 'orb_oc_2', cx: 125, cy: 85, referral: { en: 'Periorbital pain, eye strain', no: 'Periorbital smerte, øyebelastning' } },
      { id: 'orb_oc_3', cx: 65, cy: 95, referral: { en: 'Lateral eye pain, crow\'s feet area', no: 'Lateral øyesmerte, krakeføtter-området' } },
      { id: 'orb_oc_4', cx: 135, cy: 95, referral: { en: 'Lateral eye pain, crow\'s feet area', no: 'Lateral øyesmerte, krakeføtter-området' } }
    ]
  },
  temporalis: {
    en: {
      name: 'Temporalis',
      description: 'Elevates and retracts mandible'
    },
    no: {
      name: 'Temporalis',
      description: 'Hever og trekker tilbake mandibelen'
    },
    color: '#EF4444',
    triggerPoints: [
      { id: 'temp_f1', cx: 55, cy: 50, referral: { en: 'Temporal headache, upper teeth pain', no: 'Tinninghodepine, smerter i øvre tenner' } },
      { id: 'temp_f2', cx: 145, cy: 50, referral: { en: 'Temporal headache, upper teeth pain', no: 'Tinninghodepine, smerter i øvre tenner' } },
      { id: 'temp_f3', cx: 50, cy: 70, referral: { en: 'Temple sensitivity, jaw clenching pain', no: 'Tinningømhet, smerte ved kjevepressing' } },
      { id: 'temp_f4', cx: 150, cy: 70, referral: { en: 'Temple sensitivity, jaw clenching pain', no: 'Tinningømhet, smerte ved kjevepressing' } }
    ]
  },
  masseter: {
    en: {
      name: 'Masseter',
      description: 'Primary jaw elevator for chewing'
    },
    no: {
      name: 'Masseter',
      description: 'Primær kjevehever for tygging'
    },
    color: '#DC2626',
    triggerPoints: [
      { id: 'mass_1', cx: 60, cy: 130, referral: { en: 'Jaw pain, molar tooth pain, ear fullness', no: 'Kjevesmerte, jekselsmerte, ørefullhet' } },
      { id: 'mass_2', cx: 140, cy: 130, referral: { en: 'Jaw pain, molar tooth pain, ear fullness', no: 'Kjevesmerte, jekselsmerte, ørefullhet' } },
      { id: 'mass_3', cx: 65, cy: 150, referral: { en: 'Lower jaw pain, mandibular angle', no: 'Nedre kjevesmerte, mandibulær vinkel' } },
      { id: 'mass_4', cx: 135, cy: 150, referral: { en: 'Lower jaw pain, mandibular angle', no: 'Nedre kjevesmerte, mandibulær vinkel' } }
    ]
  },
  zygomaticus_major: {
    en: {
      name: 'Zygomaticus Major',
      description: 'Draws mouth angle up and laterally (smiling)'
    },
    no: {
      name: 'Zygomaticus Major',
      description: 'Trekker munnviken opp og lateralt (smil)'
    },
    color: '#F472B6',
    triggerPoints: [
      { id: 'zyg_1', cx: 70, cy: 120, referral: { en: 'Cheek pain, facial tension', no: 'Kinnsmerter, ansiktsspenning' } },
      { id: 'zyg_2', cx: 130, cy: 120, referral: { en: 'Cheek pain, facial tension', no: 'Kinnsmerter, ansiktsspenning' } }
    ]
  },
  levator_labii: {
    en: {
      name: 'Levator Labii Superioris',
      description: 'Elevates upper lip'
    },
    no: {
      name: 'Levator Labii Superioris',
      description: 'Hever overleppen'
    },
    color: '#10B981',
    triggerPoints: [
      { id: 'lev_1', cx: 85, cy: 115, referral: { en: 'Upper lip pain, nasal bridge', no: 'Overleppesmerte, neseryggen' } },
      { id: 'lev_2', cx: 115, cy: 115, referral: { en: 'Upper lip pain, nasal bridge', no: 'Overleppesmerte, neseryggen' } }
    ]
  },
  orbicularis_oris: {
    en: {
      name: 'Orbicularis Oris',
      description: 'Closes and protrudes lips'
    },
    no: {
      name: 'Orbicularis Oris',
      description: 'Lukker og skyver frem leppene'
    },
    color: '#F59E0B',
    triggerPoints: [
      { id: 'orb_or_1', cx: 100, cy: 160, referral: { en: 'Lip pain, perioral tension', no: 'Leppesmerte, perioral spenning' } },
      { id: 'orb_or_2', cx: 90, cy: 165, referral: { en: 'Lip corner pain', no: 'Munnviksmerte' } },
      { id: 'orb_or_3', cx: 110, cy: 165, referral: { en: 'Lip corner pain', no: 'Munnviksmerte' } }
    ]
  },
  mentalis: {
    en: {
      name: 'Mentalis',
      description: 'Elevates and protrudes lower lip'
    },
    no: {
      name: 'Mentalis',
      description: 'Hever og skyver frem underleppen'
    },
    color: '#6366F1',
    triggerPoints: [
      { id: 'ment_1', cx: 100, cy: 195, referral: { en: 'Chin pain, lower teeth sensitivity', no: 'Hakesmerte, ømhet i nedre tenner' } }
    ]
  },
  pterygoid_medial: {
    en: {
      name: 'Medial Pterygoid',
      description: 'Elevates mandible, lateral jaw movement'
    },
    no: {
      name: 'Medial Pterygoid',
      description: 'Hever mandibelen, lateral kjevebevegelse'
    },
    color: '#7C3AED',
    triggerPoints: [
      { id: 'pter_m1', cx: 70, cy: 145, referral: { en: 'TMJ pain, ear pain, throat discomfort', no: 'TMJ-smerte, øresmerter, halsube' } },
      { id: 'pter_m2', cx: 130, cy: 145, referral: { en: 'TMJ pain, ear pain, throat discomfort', no: 'TMJ-smerte, øresmerter, halsube' } }
    ]
  },
  buccinator: {
    en: {
      name: 'Buccinator',
      description: 'Compresses cheek, aids chewing'
    },
    no: {
      name: 'Buccinator',
      description: 'Komprimerer kinnet, hjelper tygging'
    },
    color: '#06B6D4',
    triggerPoints: [
      { id: 'bucc_1', cx: 65, cy: 140, referral: { en: 'Cheek pain, difficulty chewing', no: 'Kinnsmerter, vanskelig å tygge' } },
      { id: 'bucc_2', cx: 135, cy: 140, referral: { en: 'Cheek pain, difficulty chewing', no: 'Kinnsmerter, vanskelig å tygge' } }
    ]
  },
  procerus: {
    en: {
      name: 'Procerus',
      description: 'Pulls eyebrows down, wrinkles nose bridge'
    },
    no: {
      name: 'Procerus',
      description: 'Trekker øyebrynene ned, rynker neseryggen'
    },
    color: '#14B8A6',
    triggerPoints: [
      { id: 'proc_1', cx: 100, cy: 95, referral: { en: 'Nose bridge pain, glabellar headache', no: 'Neseryggsmerte, glabellar hodepine' } }
    ]
  },
  corrugator: {
    en: {
      name: 'Corrugator Supercilii',
      description: 'Draws eyebrows medially (frowning)'
    },
    no: {
      name: 'Corrugator Supercilii',
      description: 'Trekker øyebrynene medialt (rynking)'
    },
    color: '#0EA5E9',
    triggerPoints: [
      { id: 'corr_1', cx: 80, cy: 78, referral: { en: 'Forehead tension, eyebrow pain', no: 'Pannespenning, øyebrynsmerte' } },
      { id: 'corr_2', cx: 120, cy: 78, referral: { en: 'Forehead tension, eyebrow pain', no: 'Pannespenning, øyebrynsmerte' } }
    ]
  },
  nasalis: {
    en: {
      name: 'Nasalis',
      description: 'Compresses and flares nostrils'
    },
    no: {
      name: 'Nasalis',
      description: 'Komprimerer og utvider nesebor'
    },
    color: '#84CC16',
    triggerPoints: [
      { id: 'nas_1', cx: 92, cy: 125, referral: { en: 'Nasal bridge discomfort, sinus pressure feeling', no: 'Neseryggsubehag, følelse av bihulepres' } },
      { id: 'nas_2', cx: 108, cy: 125, referral: { en: 'Nasal bridge discomfort, sinus pressure feeling', no: 'Neseryggsubehag, følelse av bihulepres' } }
    ]
  },
  sternocleidomastoid_upper: {
    en: {
      name: 'SCM (Upper Attachment)',
      description: 'Mastoid process attachment - key for facial/head symptoms'
    },
    no: {
      name: 'SCM (Øvre feste)',
      description: 'Mastoid-feste - viktig for ansikts-/hodesymptomer'
    },
    color: '#A855F7',
    triggerPoints: [
      { id: 'scm_u1', cx: 45, cy: 100, referral: { en: 'Facial pain, eye symptoms, dizziness', no: 'Ansiktssmerte, øyesymptomer, svimmelhet' } },
      { id: 'scm_u2', cx: 155, cy: 100, referral: { en: 'Facial pain, eye symptoms, dizziness', no: 'Ansiktssmerte, øyesymptomer, svimmelhet' } }
    ]
  }
};

// =============================================================================
// CRANIAL NERVE ZONES - Trigeminal distribution
// =============================================================================
export const NERVE_ZONES = {
  V1_ophthalmic: {
    en: { name: 'V1 - Ophthalmic', area: 'Forehead, upper eyelid, nose bridge' },
    no: { name: 'V1 - Oftalmisk', area: 'Panne, øvre øyelokk, neseryggen' },
    color: 'rgba(239, 68, 68, 0.3)',
    path: 'M50,25 Q100,15 150,25 L145,95 Q100,85 55,95 Z'
  },
  V2_maxillary: {
    en: { name: 'V2 - Maxillary', area: 'Lower eyelid, cheek, upper lip, nose' },
    no: { name: 'V2 - Maksillar', area: 'Nedre øyelokk, kinn, overleppe, nese' },
    color: 'rgba(34, 197, 94, 0.3)',
    path: 'M55,95 Q100,85 145,95 L140,160 Q100,150 60,160 Z'
  },
  V3_mandibular: {
    en: { name: 'V3 - Mandibular', area: 'Lower lip, chin, jaw, anterior ear' },
    no: { name: 'V3 - Mandibulær', area: 'Underleppe, hake, kjeve, fremre øre' },
    color: 'rgba(59, 130, 246, 0.3)',
    path: 'M60,160 Q100,150 140,160 L130,220 Q100,230 70,220 Z'
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function FacialLinesChart({
  value = { markers: [], selectedPoints: [] },
  onChange,
  onGenerateNarrative,
  lang = 'no',
  className = ''
}) {
  const t = LABELS[lang];

  // Layer visibility states
  const [showOutline, setShowOutline] = useState(true);
  const [showFascialLines, setShowFascialLines] = useState(true);
  const [showMuscles, setShowMuscles] = useState(false);
  const [showTriggerPoints, setShowTriggerPoints] = useState(true);
  const [showNerves, setShowNerves] = useState(false);

  // UI states
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedTriggerPoint, setSelectedTriggerPoint] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  // Handle trigger point click
  const handleTriggerPointClick = useCallback((muscle, triggerPoint) => {
    setSelectedTriggerPoint({ muscle, triggerPoint });
    setSelectedLine(null);

    // Add marker if onChange is provided
    if (onChange) {
      const newMarker = {
        id: Date.now(),
        type: 'triggerPoint',
        muscleId: muscle.en.name,
        pointId: triggerPoint.id,
        description: typeof triggerPoint.referral === 'object'
          ? (triggerPoint.referral[lang] || triggerPoint.referral.en)
          : triggerPoint.referral,
        muscle: muscle[lang]?.name || muscle.en.name
      };

      onChange({
        ...value,
        markers: [...(value.markers || []), newMarker]
      });
    }
  }, [onChange, value, lang]);

  // Handle fascial line click
  const handleLineClick = useCallback((lineId, line) => {
    setSelectedLine({ id: lineId, ...line });
    setSelectedTriggerPoint(null);
  }, []);

  // Generate narrative
  const handleGenerateNarrative = useCallback(() => {
    if (!value.markers || value.markers.length === 0) return;

    const narrativeLines = [];

    // Group by type
    const triggerPointMarkers = value.markers.filter(m => m.type === 'triggerPoint');
    const lineMarkers = value.markers.filter(m => m.type === 'fascialLine');

    if (triggerPointMarkers.length > 0) {
      const header = lang === 'no'
        ? 'Ansikts-triggerpunkter identifisert:'
        : 'Facial trigger points identified:';

      const points = triggerPointMarkers.map(m =>
        `${m.muscle} (${m.description})`
      ).join(', ');

      narrativeLines.push(`${header} ${points}.`);
    }

    if (lineMarkers.length > 0) {
      const header = lang === 'no'
        ? 'Fascielinjer behandlet:'
        : 'Fascial lines treated:';

      const lines = lineMarkers.map(m => m.lineName).join(', ');
      narrativeLines.push(`${header} ${lines}.`);
    }

    const narrative = narrativeLines.join('\n\n');

    if (onGenerateNarrative) {
      onGenerateNarrative(narrative);
    }
  }, [value.markers, lang, onGenerateNarrative]);

  // Clear all
  const handleClearAll = useCallback(() => {
    if (onChange) {
      onChange({ markers: [], selectedPoints: [] });
    }
    setSelectedLine(null);
    setSelectedTriggerPoint(null);
  }, [onChange]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{t.title}</h3>
              <p className="text-xs text-gray-500">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateNarrative}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200
                        text-rose-700 rounded-lg text-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {t.generateNarrative}
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200
                        text-gray-600 rounded-lg text-sm transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.clearAll}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Panel - Layer Controls */}
        <div className="w-56 border-r border-gray-200 p-3 space-y-3 bg-gray-50">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t.layers}
            </h4>
            <div className="space-y-1.5">
              {/* Outline Toggle */}
              <button
                onClick={() => setShowOutline(!showOutline)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
                  ${showOutline ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                {showOutline ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{t.outline}</span>
              </button>

              {/* Fascial Lines Toggle */}
              <button
                onClick={() => setShowFascialLines(!showFascialLines)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
                  ${showFascialLines ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                {showFascialLines ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{t.fascialLines}</span>
              </button>

              {/* Muscles Toggle */}
              <button
                onClick={() => setShowMuscles(!showMuscles)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
                  ${showMuscles ? 'bg-red-100 text-red-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                {showMuscles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{t.muscles}</span>
              </button>

              {/* Trigger Points Toggle */}
              <button
                onClick={() => setShowTriggerPoints(!showTriggerPoints)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
                  ${showTriggerPoints ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                {showTriggerPoints ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{t.triggerPoints}</span>
              </button>

              {/* Nerves Toggle */}
              <button
                onClick={() => setShowNerves(!showNerves)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
                  ${showNerves ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                {showNerves ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{t.nerves}</span>
              </button>
            </div>
          </div>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-white rounded-lg
                      text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Legend
            </span>
            {showLegend ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Legend Content */}
          {showLegend && (
            <div className="bg-white rounded-lg p-3 space-y-3">
              {/* Fascial Lines Legend */}
              {showFascialLines && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-1.5">{t.fascialLines}</h5>
                  <div className="space-y-1">
                    {Object.entries(FASCIAL_LINES).slice(0, 5).map(([id, line]) => (
                      <div key={id} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 rounded" style={{ backgroundColor: line.color }} />
                        <span className="text-gray-600 truncate">
                          {line[lang]?.name || line.en.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nerve Zones Legend */}
              {showNerves && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-1.5">{t.nerves}</h5>
                  <div className="space-y-1">
                    {Object.entries(NERVE_ZONES).map(([id, zone]) => (
                      <div key={id} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: zone.color.replace('0.3', '0.6') }}
                        />
                        <span className="text-gray-600">{zone[lang]?.name || zone.en.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Markers Count */}
          {value.markers && value.markers.length > 0 && (
            <div className="bg-rose-50 rounded-lg p-3">
              <div className="text-xs font-medium text-rose-700">
                {value.markers.length} {lang === 'no' ? 'punkt markert' : 'points marked'}
              </div>
            </div>
          )}
        </div>

        {/* Center - SVG Face Diagram */}
        <div className="flex-1 p-4">
          <div className="flex justify-center">
            <svg
              viewBox="0 0 200 250"
              className="w-full max-w-md h-auto"
              style={{ maxHeight: '500px' }}
            >
              {/* Nerve Zones Layer */}
              {showNerves && Object.entries(NERVE_ZONES).map(([id, zone]) => (
                <path
                  key={id}
                  d={zone.path}
                  fill={zone.color}
                  stroke={zone.color.replace('0.3', '0.6')}
                  strokeWidth="1"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />
              ))}

              {/* Face Outline */}
              {showOutline && (
                <g className="face-outline" stroke="#94A3B8" strokeWidth="1.5" fill="none">
                  {/* Head shape */}
                  <ellipse cx="100" cy="110" rx="60" ry="80" fill="#FEF3C7" fillOpacity="0.3" />

                  {/* Ears */}
                  <ellipse cx="40" cy="100" rx="8" ry="15" fill="#FEF3C7" fillOpacity="0.3" />
                  <ellipse cx="160" cy="100" rx="8" ry="15" fill="#FEF3C7" fillOpacity="0.3" />

                  {/* Hair line suggestion */}
                  <path d="M50,50 Q100,25 150,50" strokeDasharray="3,3" />

                  {/* Eyes */}
                  <ellipse cx="75" cy="90" rx="12" ry="6" fill="white" stroke="#64748B" />
                  <ellipse cx="125" cy="90" rx="12" ry="6" fill="white" stroke="#64748B" />
                  <circle cx="75" cy="90" r="3" fill="#374151" />
                  <circle cx="125" cy="90" r="3" fill="#374151" />

                  {/* Eyebrows */}
                  <path d="M60,78 Q75,73 88,78" stroke="#64748B" strokeWidth="2" fill="none" />
                  <path d="M112,78 Q125,73 140,78" stroke="#64748B" strokeWidth="2" fill="none" />

                  {/* Nose */}
                  <path d="M100,95 L100,130 M92,135 Q100,142 108,135" stroke="#64748B" />

                  {/* Mouth */}
                  <path d="M85,160 Q100,170 115,160" stroke="#64748B" strokeWidth="1.5" />
                  <path d="M85,160 Q100,155 115,160" stroke="#64748B" strokeWidth="0.5" />

                  {/* Jaw line */}
                  <path d="M45,130 Q50,180 100,195 Q150,180 155,130" stroke="#94A3B8" strokeWidth="1" />

                  {/* Neck suggestion */}
                  <path d="M75,190 L70,240 M125,190 L130,240" stroke="#94A3B8" strokeDasharray="2,2" />
                </g>
              )}

              {/* Fascial Lines Layer */}
              {showFascialLines && Object.entries(FASCIAL_LINES).map(([id, line]) => (
                <g key={id} className="fascial-line">
                  <path
                    d={line.path}
                    stroke={line.color}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:stroke-width-4"
                    style={{ filter: selectedLine?.id === id ? 'drop-shadow(0 0 4px ' + line.color + ')' : 'none' }}
                    onClick={() => handleLineClick(id, line)}
                  />
                  {/* Line points */}
                  {line.points.map(point => (
                    <circle
                      key={point.id}
                      cx={point.cx}
                      cy={point.cy}
                      r="4"
                      fill={line.color}
                      stroke="white"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-transform hover:scale-125"
                      onClick={() => handleLineClick(id, line)}
                    />
                  ))}
                </g>
              ))}

              {/* Trigger Points Layer */}
              {showTriggerPoints && Object.entries(FACIAL_MUSCLES).map(([muscleId, muscle]) => (
                <g key={muscleId} className="muscle-trigger-points">
                  {muscle.triggerPoints.map(tp => (
                    <g key={tp.id}>
                      {/* Outer glow for selected */}
                      {selectedTriggerPoint?.triggerPoint.id === tp.id && (
                        <circle
                          cx={tp.cx}
                          cy={tp.cy}
                          r="10"
                          fill="none"
                          stroke={muscle.color}
                          strokeWidth="2"
                          opacity="0.5"
                        />
                      )}
                      {/* Trigger point */}
                      <circle
                        cx={tp.cx}
                        cy={tp.cy}
                        r="5"
                        fill={muscle.color}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer transition-all hover:r-6"
                        style={{
                          filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.3))`,
                          transform: selectedTriggerPoint?.triggerPoint.id === tp.id ? 'scale(1.2)' : 'scale(1)',
                          transformOrigin: `${tp.cx}px ${tp.cy}px`
                        }}
                        onClick={() => handleTriggerPointClick(muscle, tp)}
                      />
                      {/* X pattern inside */}
                      <g
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="pointer-events-none"
                      >
                        <line x1={tp.cx - 2} y1={tp.cy - 2} x2={tp.cx + 2} y2={tp.cy + 2} />
                        <line x1={tp.cx + 2} y1={tp.cy - 2} x2={tp.cx - 2} y2={tp.cy + 2} />
                      </g>
                    </g>
                  ))}
                </g>
              ))}

              {/* Markers from value */}
              {value.markers && value.markers.map((marker, idx) => (
                <circle
                  key={marker.id || idx}
                  cx={marker.cx || 100}
                  cy={marker.cy || 100}
                  r="6"
                  fill="#22C55E"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.8"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Right Panel - Info */}
        <div className="w-72 border-l border-gray-200 p-3 bg-gray-50">
          {/* Selected Trigger Point Info */}
          {selectedTriggerPoint && (
            <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
              <h4 className="font-medium text-gray-800 text-sm mb-2 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedTriggerPoint.muscle.color }}
                />
                {selectedTriggerPoint.muscle[lang]?.name || selectedTriggerPoint.muscle.en.name}
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">{t.muscleInfo}</span>
                  <p className="text-sm text-gray-700">
                    {selectedTriggerPoint.muscle[lang]?.description || selectedTriggerPoint.muscle.en.description}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{t.referralPattern}</span>
                  <p className="text-sm text-gray-700 font-medium">
                    {typeof selectedTriggerPoint.triggerPoint.referral === 'object'
                      ? (selectedTriggerPoint.triggerPoint.referral[lang] || selectedTriggerPoint.triggerPoint.referral.en)
                      : selectedTriggerPoint.triggerPoint.referral}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Line Info */}
          {selectedLine && (
            <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
              <h4 className="font-medium text-gray-800 text-sm mb-2 flex items-center gap-2">
                <div
                  className="w-8 h-1 rounded"
                  style={{ backgroundColor: selectedLine.color }}
                />
                {selectedLine[lang]?.name || selectedLine.en.name}
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Description</span>
                  <p className="text-sm text-gray-700">
                    {selectedLine[lang]?.description || selectedLine.en.description}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{t.technique}</span>
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedLine[lang]?.technique || selectedLine.en.technique}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Selection */}
          {!selectedTriggerPoint && !selectedLine && (
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{t.noSelection}</p>
            </div>
          )}

          {/* Marked Points List */}
          {value.markers && value.markers.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {lang === 'no' ? 'Markerte punkter' : 'Marked Points'}
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {value.markers.map((marker, idx) => (
                  <div
                    key={marker.id || idx}
                    className="bg-white rounded p-2 text-xs border border-gray-200"
                  >
                    <div className="font-medium text-gray-800">{marker.muscle}</div>
                    <div className="text-gray-500 truncate">{marker.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export data for external use
export { LABELS as FACIAL_LABELS };
