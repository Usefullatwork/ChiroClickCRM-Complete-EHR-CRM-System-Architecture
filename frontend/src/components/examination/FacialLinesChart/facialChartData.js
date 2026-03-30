/**
 * FacialLinesChart Data - Fascial lines, facial muscles, nerve zones, labels
 *
 * Extracted from FacialLinesChart.jsx for modularity.
 */

// =============================================================================
// BILINGUAL LABELS
// =============================================================================
export const LABELS = {
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
    technique: 'Technique',
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
    technique: 'Teknikk',
  },
};

// =============================================================================
// FASCIAL LINES DATA - Based on myofascial chains of the face
// =============================================================================
export const FASCIAL_LINES = {
  superficial_frontal: {
    en: {
      name: 'Superficial Frontal Line',
      description: 'Runs from galea aponeurotica through frontalis to orbicularis oculi',
      technique: 'Light fascial glide from hairline to eyebrows',
    },
    no: {
      name: 'Overfladisk Frontallinje',
      description: 'Går fra galea aponeurotica gjennom frontalis til orbicularis oculi',
      technique: 'Lett fascieglidning fra hårfeste til øyenbryn',
    },
    color: '#3B82F6',
    path: 'M100,20 C100,35 95,50 95,65 C95,75 100,85 100,95',
    points: [
      { id: 'sfl_1', cx: 100, cy: 20, label: 'Galea' },
      { id: 'sfl_2', cx: 97, cy: 55, label: 'Frontalis' },
      { id: 'sfl_3', cx: 100, cy: 95, label: 'Glabella' },
    ],
  },
  temporal_masseteric: {
    en: {
      name: 'Temporal-Masseteric Line',
      description: 'Connects temporalis through zygomatic arch to masseter',
      technique: 'Cross-fiber massage along zygomatic arch',
    },
    no: {
      name: 'Temporal-Masseter Linje',
      description: 'Forbinder temporalis gjennom kinnbuen til masseter',
      technique: 'Tverrfibermassasje langs kinnbuen',
    },
    color: '#EF4444',
    path: 'M55,45 C55,75 60,100 70,140',
    points: [
      { id: 'tml_1', cx: 55, cy: 45, label: 'Temporalis' },
      { id: 'tml_2', cx: 58, cy: 85, label: 'Zygomatic' },
      { id: 'tml_3', cx: 70, cy: 140, label: 'Masseter' },
    ],
  },
  temporal_masseteric_r: {
    en: {
      name: 'Temporal-Masseteric Line (R)',
      description: 'Connects temporalis through zygomatic arch to masseter',
      technique: 'Cross-fiber massage along zygomatic arch',
    },
    no: {
      name: 'Temporal-Masseter Linje (H)',
      description: 'Forbinder temporalis gjennom kinnbuen til masseter',
      technique: 'Tverrfibermassasje langs kinnbuen',
    },
    color: '#EF4444',
    path: 'M145,45 C145,75 140,100 130,140',
    points: [
      { id: 'tml_r1', cx: 145, cy: 45, label: 'Temporalis' },
      { id: 'tml_r2', cx: 142, cy: 85, label: 'Zygomatic' },
      { id: 'tml_r3', cx: 130, cy: 140, label: 'Masseter' },
    ],
  },
  lateral_orbital: {
    en: {
      name: 'Lateral Orbital Line',
      description: 'Orbicularis oculi to zygomaticus major',
      technique: 'Gentle circular release around orbital rim',
    },
    no: {
      name: 'Lateral Orbital Linje',
      description: 'Orbicularis oculi til zygomaticus major',
      technique: 'Forsiktig sirkulær frigjøring rundt orbitalranden',
    },
    color: '#8B5CF6',
    path: 'M65,90 C55,100 55,115 60,130',
    points: [
      { id: 'lol_1', cx: 65, cy: 90, label: 'Orb. Oculi' },
      { id: 'lol_2', cx: 60, cy: 130, label: 'Zygomaticus' },
    ],
  },
  lateral_orbital_r: {
    en: {
      name: 'Lateral Orbital Line (R)',
      description: 'Orbicularis oculi to zygomaticus major',
      technique: 'Gentle circular release around orbital rim',
    },
    no: {
      name: 'Lateral Orbital Linje (H)',
      description: 'Orbicularis oculi til zygomaticus major',
      technique: 'Forsiktig sirkulær frigjøring rundt orbitalranden',
    },
    color: '#8B5CF6',
    path: 'M135,90 C145,100 145,115 140,130',
    points: [
      { id: 'lol_r1', cx: 135, cy: 90, label: 'Orb. Oculi' },
      { id: 'lol_r2', cx: 140, cy: 130, label: 'Zygomaticus' },
    ],
  },
  nasolabial: {
    en: {
      name: 'Nasolabial Line',
      description: 'Levator labii to orbicularis oris along nasolabial fold',
      technique: 'Myofascial release along nasolabial fold',
    },
    no: {
      name: 'Nasolabial Linje',
      description: 'Levator labii til orbicularis oris langs nasolabialfuren',
      technique: 'Myofascial frigjøring langs nasolabialfuren',
    },
    color: '#10B981',
    path: 'M80,115 C75,135 75,155 85,175',
    points: [
      { id: 'nl_1', cx: 80, cy: 115, label: 'Levator Labii' },
      { id: 'nl_2', cx: 77, cy: 145, label: 'Nasolabial' },
      { id: 'nl_3', cx: 85, cy: 175, label: 'Orb. Oris' },
    ],
  },
  nasolabial_r: {
    en: {
      name: 'Nasolabial Line (R)',
      description: 'Levator labii to orbicularis oris along nasolabial fold',
      technique: 'Myofascial release along nasolabial fold',
    },
    no: {
      name: 'Nasolabial Linje (H)',
      description: 'Levator labii til orbicularis oris langs nasolabialfuren',
      technique: 'Myofascial frigjøring langs nasolabialfuren',
    },
    color: '#10B981',
    path: 'M120,115 C125,135 125,155 115,175',
    points: [
      { id: 'nl_r1', cx: 120, cy: 115, label: 'Levator Labii' },
      { id: 'nl_r2', cx: 123, cy: 145, label: 'Nasolabial' },
      { id: 'nl_r3', cx: 115, cy: 175, label: 'Orb. Oris' },
    ],
  },
  mandibular: {
    en: {
      name: 'Mandibular Line',
      description: 'Follows the mandible from angle to mentalis',
      technique: 'Periosteal release along mandibular border',
    },
    no: {
      name: 'Mandibulær Linje',
      description: 'Følger mandibelen fra vinkel til mentalis',
      technique: 'Periosteal frigjøring langs mandibulær kant',
    },
    color: '#F59E0B',
    path: 'M55,160 C65,185 85,200 100,210',
    points: [
      { id: 'ml_1', cx: 55, cy: 160, label: 'Angle' },
      { id: 'ml_2', cx: 80, cy: 195, label: 'Body' },
      { id: 'ml_3', cx: 100, cy: 210, label: 'Mentalis' },
    ],
  },
  mandibular_r: {
    en: {
      name: 'Mandibular Line (R)',
      description: 'Follows the mandible from angle to mentalis',
      technique: 'Periosteal release along mandibular border',
    },
    no: {
      name: 'Mandibulær Linje (H)',
      description: 'Følger mandibelen fra vinkel til mentalis',
      technique: 'Periosteal frigjøring langs mandibulær kant',
    },
    color: '#F59E0B',
    path: 'M145,160 C135,185 115,200 100,210',
    points: [
      { id: 'ml_r1', cx: 145, cy: 160, label: 'Angle' },
      { id: 'ml_r2', cx: 120, cy: 195, label: 'Body' },
      { id: 'ml_r3', cx: 100, cy: 210, label: 'Mentalis' },
    ],
  },
  supraorbital: {
    en: {
      name: 'Supraorbital Line',
      description: 'Corrugator supercilii through procerus to nasalis',
      technique: 'Pincer technique along corrugator, gentle nasalis release',
    },
    no: {
      name: 'Supraorbital Linje',
      description: 'Corrugator supercilii gjennom procerus til nasalis',
      technique: 'Pinsetteknikk langs corrugator, forsiktig nasalis frigjøring',
    },
    color: '#EC4899',
    path: 'M70,80 C85,85 100,90 100,120',
    points: [
      { id: 'sol_1', cx: 70, cy: 80, label: 'Corrugator' },
      { id: 'sol_2', cx: 100, cy: 90, label: 'Procerus' },
      { id: 'sol_3', cx: 100, cy: 120, label: 'Nasalis' },
    ],
  },
};

// =============================================================================
// FACIAL MUSCLES DATA - With trigger points and referral patterns
// =============================================================================
export const FACIAL_MUSCLES = {
  frontalis: {
    en: { name: 'Frontalis', description: 'Raises eyebrows, wrinkles forehead' },
    no: { name: 'Frontalis', description: 'Hever øyebryn, rynker pannen' },
    color: '#3B82F6',
    triggerPoints: [
      {
        id: 'front_1',
        cx: 85,
        cy: 50,
        referral: { en: 'Frontal headache, forehead pain', no: 'Pannehodepine, pannesmerter' },
      },
      {
        id: 'front_2',
        cx: 115,
        cy: 50,
        referral: { en: 'Frontal headache, forehead pain', no: 'Pannehodepine, pannesmerter' },
      },
      {
        id: 'front_3',
        cx: 100,
        cy: 40,
        referral: { en: 'Central forehead tension', no: 'Sentral pannespenning' },
      },
    ],
  },
  orbicularis_oculi: {
    en: { name: 'Orbicularis Oculi', description: 'Closes eyelids, produces tears' },
    no: { name: 'Orbicularis Oculi', description: 'Lukker øyelokk, produserer tårer' },
    color: '#8B5CF6',
    triggerPoints: [
      {
        id: 'orb_oc_1',
        cx: 75,
        cy: 85,
        referral: { en: 'Periorbital pain, eye strain', no: 'Periorbital smerte, øyebelastning' },
      },
      {
        id: 'orb_oc_2',
        cx: 125,
        cy: 85,
        referral: { en: 'Periorbital pain, eye strain', no: 'Periorbital smerte, øyebelastning' },
      },
      {
        id: 'orb_oc_3',
        cx: 65,
        cy: 95,
        referral: {
          en: "Lateral eye pain, crow's feet area",
          no: 'Lateral øyesmerte, krakeføtter-området',
        },
      },
      {
        id: 'orb_oc_4',
        cx: 135,
        cy: 95,
        referral: {
          en: "Lateral eye pain, crow's feet area",
          no: 'Lateral øyesmerte, krakeføtter-området',
        },
      },
    ],
  },
  temporalis: {
    en: { name: 'Temporalis', description: 'Elevates and retracts mandible' },
    no: { name: 'Temporalis', description: 'Hever og trekker tilbake mandibelen' },
    color: '#EF4444',
    triggerPoints: [
      {
        id: 'temp_f1',
        cx: 55,
        cy: 50,
        referral: {
          en: 'Temporal headache, upper teeth pain',
          no: 'Tinninghodepine, smerter i øvre tenner',
        },
      },
      {
        id: 'temp_f2',
        cx: 145,
        cy: 50,
        referral: {
          en: 'Temporal headache, upper teeth pain',
          no: 'Tinninghodepine, smerter i øvre tenner',
        },
      },
      {
        id: 'temp_f3',
        cx: 50,
        cy: 70,
        referral: {
          en: 'Temple sensitivity, jaw clenching pain',
          no: 'Tinningømhet, smerte ved kjevepressing',
        },
      },
      {
        id: 'temp_f4',
        cx: 150,
        cy: 70,
        referral: {
          en: 'Temple sensitivity, jaw clenching pain',
          no: 'Tinningømhet, smerte ved kjevepressing',
        },
      },
    ],
  },
  masseter: {
    en: { name: 'Masseter', description: 'Primary jaw elevator for chewing' },
    no: { name: 'Masseter', description: 'Primær kjevehever for tygging' },
    color: '#DC2626',
    triggerPoints: [
      {
        id: 'mass_1',
        cx: 60,
        cy: 130,
        referral: {
          en: 'Jaw pain, molar tooth pain, ear fullness',
          no: 'Kjevesmerte, jekselsmerte, ørefullhet',
        },
      },
      {
        id: 'mass_2',
        cx: 140,
        cy: 130,
        referral: {
          en: 'Jaw pain, molar tooth pain, ear fullness',
          no: 'Kjevesmerte, jekselsmerte, ørefullhet',
        },
      },
      {
        id: 'mass_3',
        cx: 65,
        cy: 150,
        referral: {
          en: 'Lower jaw pain, mandibular angle',
          no: 'Nedre kjevesmerte, mandibulær vinkel',
        },
      },
      {
        id: 'mass_4',
        cx: 135,
        cy: 150,
        referral: {
          en: 'Lower jaw pain, mandibular angle',
          no: 'Nedre kjevesmerte, mandibulær vinkel',
        },
      },
    ],
  },
  zygomaticus_major: {
    en: { name: 'Zygomaticus Major', description: 'Draws mouth angle up and laterally (smiling)' },
    no: { name: 'Zygomaticus Major', description: 'Trekker munnviken opp og lateralt (smil)' },
    color: '#F472B6',
    triggerPoints: [
      {
        id: 'zyg_1',
        cx: 70,
        cy: 120,
        referral: { en: 'Cheek pain, facial tension', no: 'Kinnsmerter, ansiktsspenning' },
      },
      {
        id: 'zyg_2',
        cx: 130,
        cy: 120,
        referral: { en: 'Cheek pain, facial tension', no: 'Kinnsmerter, ansiktsspenning' },
      },
    ],
  },
  levator_labii: {
    en: { name: 'Levator Labii Superioris', description: 'Elevates upper lip' },
    no: { name: 'Levator Labii Superioris', description: 'Hever overleppen' },
    color: '#10B981',
    triggerPoints: [
      {
        id: 'lev_1',
        cx: 85,
        cy: 115,
        referral: { en: 'Upper lip pain, nasal bridge', no: 'Overleppesmerte, neseryggen' },
      },
      {
        id: 'lev_2',
        cx: 115,
        cy: 115,
        referral: { en: 'Upper lip pain, nasal bridge', no: 'Overleppesmerte, neseryggen' },
      },
    ],
  },
  orbicularis_oris: {
    en: { name: 'Orbicularis Oris', description: 'Closes and protrudes lips' },
    no: { name: 'Orbicularis Oris', description: 'Lukker og skyver frem leppene' },
    color: '#F59E0B',
    triggerPoints: [
      {
        id: 'orb_or_1',
        cx: 100,
        cy: 160,
        referral: { en: 'Lip pain, perioral tension', no: 'Leppesmerte, perioral spenning' },
      },
      { id: 'orb_or_2', cx: 90, cy: 165, referral: { en: 'Lip corner pain', no: 'Munnviksmerte' } },
      {
        id: 'orb_or_3',
        cx: 110,
        cy: 165,
        referral: { en: 'Lip corner pain', no: 'Munnviksmerte' },
      },
    ],
  },
  mentalis: {
    en: { name: 'Mentalis', description: 'Elevates and protrudes lower lip' },
    no: { name: 'Mentalis', description: 'Hever og skyver frem underleppen' },
    color: '#6366F1',
    triggerPoints: [
      {
        id: 'ment_1',
        cx: 100,
        cy: 195,
        referral: {
          en: 'Chin pain, lower teeth sensitivity',
          no: 'Hakesmerte, ømhet i nedre tenner',
        },
      },
    ],
  },
  pterygoid_medial: {
    en: { name: 'Medial Pterygoid', description: 'Elevates mandible, lateral jaw movement' },
    no: { name: 'Medial Pterygoid', description: 'Hever mandibelen, lateral kjevebevegelse' },
    color: '#7C3AED',
    triggerPoints: [
      {
        id: 'pter_m1',
        cx: 70,
        cy: 145,
        referral: {
          en: 'TMJ pain, ear pain, throat discomfort',
          no: 'TMJ-smerte, øresmerter, halsube',
        },
      },
      {
        id: 'pter_m2',
        cx: 130,
        cy: 145,
        referral: {
          en: 'TMJ pain, ear pain, throat discomfort',
          no: 'TMJ-smerte, øresmerter, halsube',
        },
      },
    ],
  },
  buccinator: {
    en: { name: 'Buccinator', description: 'Compresses cheek, aids chewing' },
    no: { name: 'Buccinator', description: 'Komprimerer kinnet, hjelper tygging' },
    color: '#06B6D4',
    triggerPoints: [
      {
        id: 'bucc_1',
        cx: 65,
        cy: 140,
        referral: { en: 'Cheek pain, difficulty chewing', no: 'Kinnsmerter, vanskelig å tygge' },
      },
      {
        id: 'bucc_2',
        cx: 135,
        cy: 140,
        referral: { en: 'Cheek pain, difficulty chewing', no: 'Kinnsmerter, vanskelig å tygge' },
      },
    ],
  },
  procerus: {
    en: { name: 'Procerus', description: 'Pulls eyebrows down, wrinkles nose bridge' },
    no: { name: 'Procerus', description: 'Trekker øyebrynene ned, rynker neseryggen' },
    color: '#14B8A6',
    triggerPoints: [
      {
        id: 'proc_1',
        cx: 100,
        cy: 95,
        referral: {
          en: 'Nose bridge pain, glabellar headache',
          no: 'Neseryggsmerte, glabellar hodepine',
        },
      },
    ],
  },
  corrugator: {
    en: { name: 'Corrugator Supercilii', description: 'Draws eyebrows medially (frowning)' },
    no: { name: 'Corrugator Supercilii', description: 'Trekker øyebrynene medialt (rynking)' },
    color: '#0EA5E9',
    triggerPoints: [
      {
        id: 'corr_1',
        cx: 80,
        cy: 78,
        referral: { en: 'Forehead tension, eyebrow pain', no: 'Pannespenning, øyebrynsmerte' },
      },
      {
        id: 'corr_2',
        cx: 120,
        cy: 78,
        referral: { en: 'Forehead tension, eyebrow pain', no: 'Pannespenning, øyebrynsmerte' },
      },
    ],
  },
  nasalis: {
    en: { name: 'Nasalis', description: 'Compresses and flares nostrils' },
    no: { name: 'Nasalis', description: 'Komprimerer og utvider nesebor' },
    color: '#84CC16',
    triggerPoints: [
      {
        id: 'nas_1',
        cx: 92,
        cy: 125,
        referral: {
          en: 'Nasal bridge discomfort, sinus pressure feeling',
          no: 'Neseryggsubehag, følelse av bihulepres',
        },
      },
      {
        id: 'nas_2',
        cx: 108,
        cy: 125,
        referral: {
          en: 'Nasal bridge discomfort, sinus pressure feeling',
          no: 'Neseryggsubehag, følelse av bihulepres',
        },
      },
    ],
  },
  sternocleidomastoid_upper: {
    en: {
      name: 'SCM (Upper Attachment)',
      description: 'Mastoid process attachment - key for facial/head symptoms',
    },
    no: {
      name: 'SCM (Øvre feste)',
      description: 'Mastoid-feste - viktig for ansikts-/hodesymptomer',
    },
    color: '#A855F7',
    triggerPoints: [
      {
        id: 'scm_u1',
        cx: 45,
        cy: 100,
        referral: {
          en: 'Facial pain, eye symptoms, dizziness',
          no: 'Ansiktssmerte, øyesymptomer, svimmelhet',
        },
      },
      {
        id: 'scm_u2',
        cx: 155,
        cy: 100,
        referral: {
          en: 'Facial pain, eye symptoms, dizziness',
          no: 'Ansiktssmerte, øyesymptomer, svimmelhet',
        },
      },
    ],
  },
};

// =============================================================================
// CRANIAL NERVE ZONES - Trigeminal distribution
// =============================================================================
export const NERVE_ZONES = {
  V1_ophthalmic: {
    en: { name: 'V1 - Ophthalmic', area: 'Forehead, upper eyelid, nose bridge' },
    no: { name: 'V1 - Oftalmisk', area: 'Panne, øvre øyelokk, neseryggen' },
    color: 'rgba(239, 68, 68, 0.3)',
    path: 'M50,25 Q100,15 150,25 L145,95 Q100,85 55,95 Z',
  },
  V2_maxillary: {
    en: { name: 'V2 - Maxillary', area: 'Lower eyelid, cheek, upper lip, nose' },
    no: { name: 'V2 - Maksillar', area: 'Nedre øyelokk, kinn, overleppe, nese' },
    color: 'rgba(34, 197, 94, 0.3)',
    path: 'M55,95 Q100,85 145,95 L140,160 Q100,150 60,160 Z',
  },
  V3_mandibular: {
    en: { name: 'V3 - Mandibular', area: 'Lower lip, chin, jaw, anterior ear' },
    no: { name: 'V3 - Mandibulær', area: 'Underleppe, hake, kjeve, fremre øre' },
    color: 'rgba(59, 130, 246, 0.3)',
    path: 'M60,160 Q100,150 140,160 L130,220 Q100,230 70,220 Z',
  },
};
