/**
 * Orthopedic Examination Definitions
 * Cluster-based diagnostic testing for musculoskeletal conditions
 *
 * Each cluster contains tests with evidence-based sensitivity/specificity
 * Positive cluster = threshold met for clinical diagnosis
 */

export const ORTHO_EXAM_CLUSTERS = {
  // ============================================================================
  // SHOULDER CLUSTERS
  // ============================================================================

  ROTATOR_CUFF: {
    id: 'ROTATOR_CUFF',
    name: { no: 'Rotator Cuff Patologi', en: 'Rotator Cuff Pathology' },
    region: 'SHOULDER',
    description: {
      no: 'Tester for rotator cuff skade/tendinopati',
      en: 'Tests for rotator cuff tear/tendinopathy'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 7,
      interpretation: {
        no: '≥3 positive tester indikerer rotator cuff patologi',
        en: '≥3 positive tests indicate rotator cuff pathology'
      }
    },
    tests: [
      {
        id: 'empty_can',
        name: { no: 'Empty Can Test (Jobe)', en: 'Empty Can Test (Jobe)' },
        target: 'Supraspinatus',
        procedure: {
          no: 'Arm 90° abduksjon, 30° horisontal fleksjon, tommel ned. Motstand mot abduksjon.',
          en: 'Arm 90° abduction, 30° horizontal flexion, thumb down. Resist abduction.'
        },
        positive: {
          no: 'Smerte eller svakhet',
          en: 'Pain or weakness'
        },
        sensitivity: 0.69,
        specificity: 0.62
      },
      {
        id: 'full_can',
        name: { no: 'Full Can Test', en: 'Full Can Test' },
        target: 'Supraspinatus',
        procedure: {
          no: 'Arm 90° abduksjon, 30° horisontal fleksjon, tommel opp. Motstand mot abduksjon.',
          en: 'Arm 90° abduction, 30° horizontal flexion, thumb up. Resist abduction.'
        },
        positive: {
          no: 'Smerte eller svakhet',
          en: 'Pain or weakness'
        },
        sensitivity: 0.77,
        specificity: 0.68
      },
      {
        id: 'drop_arm',
        name: { no: 'Drop Arm Test', en: 'Drop Arm Test' },
        target: 'Supraspinatus (full thickness tear)',
        procedure: {
          no: 'Passiv abduksjon til 90°, pasient senker langsomt.',
          en: 'Passive abduction to 90°, patient lowers slowly.'
        },
        positive: {
          no: 'Arm faller ukontrollert',
          en: 'Arm drops uncontrollably'
        },
        sensitivity: 0.27,
        specificity: 0.88,
        redFlag: true,
        redFlagCondition: 'Complete rotator cuff tear'
      },
      {
        id: 'infraspinatus_test',
        name: { no: 'Infraspinatus Test', en: 'Infraspinatus Test' },
        target: 'Infraspinatus',
        procedure: {
          no: 'Albue 90° fleksjon ved siden, motstand mot utadrotasjon.',
          en: 'Elbow 90° flexion at side, resist external rotation.'
        },
        positive: {
          no: 'Smerte eller svakhet i utadrotasjon',
          en: 'Pain or weakness in external rotation'
        },
        sensitivity: 0.84,
        specificity: 0.53
      },
      {
        id: 'lift_off',
        name: { no: 'Lift-Off Test (Gerber)', en: 'Lift-Off Test (Gerber)' },
        target: 'Subscapularis',
        procedure: {
          no: 'Hånd bak rygg, løft hånd vekk fra rygg.',
          en: 'Hand behind back, lift hand away from back.'
        },
        positive: {
          no: 'Kan ikke løfte hånd fra rygg',
          en: 'Cannot lift hand off back'
        },
        sensitivity: 0.62,
        specificity: 0.97
      },
      {
        id: 'belly_press',
        name: { no: 'Belly Press Test', en: 'Belly Press Test' },
        target: 'Subscapularis',
        procedure: {
          no: 'Press håndflate mot mage, hold albue foran kroppen.',
          en: 'Press palm against belly, keep elbow in front of body.'
        },
        positive: {
          no: 'Albue faller bakover',
          en: 'Elbow falls backward'
        },
        sensitivity: 0.40,
        specificity: 0.98
      },
      {
        id: 'hornblower',
        name: { no: 'Hornblower Sign', en: 'Hornblower Sign' },
        target: 'Teres minor',
        procedure: {
          no: 'Hånd til munn med albue hevet. Vurder utadrotasjon.',
          en: 'Hand to mouth with elbow raised. Assess external rotation.'
        },
        positive: {
          no: 'Må heve albue over hånd',
          en: 'Must raise elbow above hand'
        },
        sensitivity: 0.93,
        specificity: 0.94
      }
    ]
  },

  SHOULDER_IMPINGEMENT: {
    id: 'SHOULDER_IMPINGEMENT',
    name: { no: 'Skulder Impingement', en: 'Shoulder Impingement' },
    region: 'SHOULDER',
    description: {
      no: 'Subacromial impingement syndrom',
      en: 'Subacromial impingement syndrome'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive tester bekrefter impingement',
        en: '≥3 positive tests confirm impingement'
      }
    },
    tests: [
      {
        id: 'neer',
        name: { no: 'Neer Impingement Test', en: 'Neer Impingement Test' },
        procedure: {
          no: 'Stabiliser scapula, passiv fleksjon av innadrotert arm.',
          en: 'Stabilize scapula, passive flexion of internally rotated arm.'
        },
        positive: {
          no: 'Smerte ved full fleksjon',
          en: 'Pain at full flexion'
        },
        sensitivity: 0.79,
        specificity: 0.53
      },
      {
        id: 'hawkins_kennedy',
        name: { no: 'Hawkins-Kennedy Test', en: 'Hawkins-Kennedy Test' },
        procedure: {
          no: 'Arm 90° fleksjon, passiv innadrotasjon.',
          en: 'Arm 90° flexion, passive internal rotation.'
        },
        positive: {
          no: 'Smerte ved innadrotasjon',
          en: 'Pain with internal rotation'
        },
        sensitivity: 0.80,
        specificity: 0.56
      },
      {
        id: 'painful_arc',
        name: { no: 'Painful Arc', en: 'Painful Arc' },
        procedure: {
          no: 'Aktiv abduksjon gjennom full ROM.',
          en: 'Active abduction through full ROM.'
        },
        positive: {
          no: 'Smerte mellom 60-120°',
          en: 'Pain between 60-120°'
        },
        sensitivity: 0.74,
        specificity: 0.81
      },
      {
        id: 'coracoid_impingement',
        name: { no: 'Coracoid Impingement Test', en: 'Coracoid Impingement Test' },
        procedure: {
          no: 'Arm fleksjon, adduksjon og innadrotasjon.',
          en: 'Arm flexion, adduction and internal rotation.'
        },
        positive: {
          no: 'Smerte anteriort ved coracoid',
          en: 'Anterior pain at coracoid'
        },
        sensitivity: 0.62,
        specificity: 0.70
      },
      {
        id: 'cross_body_adduction',
        name: { no: 'Cross-Body Adduksjon', en: 'Cross-Body Adduction' },
        procedure: {
          no: 'Passiv horisontal adduksjon over brystet.',
          en: 'Passive horizontal adduction across chest.'
        },
        positive: {
          no: 'Smerte i AC-ledd eller posteriort',
          en: 'Pain at AC joint or posterior'
        },
        sensitivity: 0.77,
        specificity: 0.79
      }
    ]
  },

  SHOULDER_INSTABILITY: {
    id: 'SHOULDER_INSTABILITY',
    name: { no: 'Skulder Instabilitet', en: 'Shoulder Instability' },
    region: 'SHOULDER',
    description: {
      no: 'Glenohumeral instabilitet/luksasjon',
      en: 'Glenohumeral instability/dislocation'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 5,
      interpretation: {
        no: '≥2 positive tester indikerer instabilitet',
        en: '≥2 positive tests indicate instability'
      }
    },
    tests: [
      {
        id: 'apprehension',
        name: { no: 'Apprehension Test', en: 'Apprehension Test' },
        procedure: {
          no: 'Ryggliggende, arm 90° abduksjon/utadrotasjon.',
          en: 'Supine, arm 90° abduction/external rotation.'
        },
        positive: {
          no: 'Frykt/ubehag for luksasjon',
          en: 'Fear/apprehension of dislocation'
        },
        sensitivity: 0.72,
        specificity: 0.96
      },
      {
        id: 'relocation',
        name: { no: 'Relocation Test', en: 'Relocation Test' },
        procedure: {
          no: 'Etter positiv apprehension, press posteriort på humerushode.',
          en: 'After positive apprehension, push posteriorly on humeral head.'
        },
        positive: {
          no: 'Redusert apprehension',
          en: 'Decreased apprehension'
        },
        sensitivity: 0.68,
        specificity: 0.92
      },
      {
        id: 'anterior_drawer',
        name: { no: 'Anterior Drawer (Skulder)', en: 'Anterior Drawer (Shoulder)' },
        procedure: {
          no: 'Stabiliser scapula, dra humerushode anteriort.',
          en: 'Stabilize scapula, pull humeral head anteriorly.'
        },
        positive: {
          no: 'Økt anterior translasjon vs. kontralateral',
          en: 'Increased anterior translation vs. contralateral'
        },
        sensitivity: 0.53,
        specificity: 0.85
      },
      {
        id: 'sulcus_sign',
        name: { no: 'Sulcus Sign', en: 'Sulcus Sign' },
        procedure: {
          no: 'Sittende, dra arm inferiort.',
          en: 'Sitting, pull arm inferiorly.'
        },
        positive: {
          no: 'Synlig sulcus under acromion (>2cm = grad 3)',
          en: 'Visible sulcus under acromion (>2cm = grade 3)'
        },
        sensitivity: 0.72,
        specificity: 0.85,
        grading: {
          grade1: '<1cm',
          grade2: '1-2cm',
          grade3: '>2cm'
        }
      },
      {
        id: 'load_shift',
        name: { no: 'Load and Shift Test', en: 'Load and Shift Test' },
        procedure: {
          no: 'Stabiliser scapula, load humerushode i glenoid, skyv anterior/posterior.',
          en: 'Stabilize scapula, load humeral head in glenoid, push anterior/posterior.'
        },
        positive: {
          no: 'Økt translasjon (grad 1-3)',
          en: 'Increased translation (grade 1-3)'
        },
        sensitivity: 0.50,
        specificity: 0.90
      }
    ]
  },

  LABRAL_TEAR: {
    id: 'LABRAL_TEAR',
    name: { no: 'Labrum Skade (SLAP)', en: 'Labral Tear (SLAP)' },
    region: 'SHOULDER',
    description: {
      no: 'Superior labrum anterior-posterior lesjon',
      en: 'Superior labrum anterior-posterior lesion'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive tester indikerer labrum lesjon',
        en: '≥2 positive tests indicate labral lesion'
      }
    },
    tests: [
      {
        id: 'obriens',
        name: { no: "O'Brien's Test", en: "O'Brien's Test" },
        procedure: {
          no: 'Arm 90° fleksjon, 10° adduksjon, innadrotert. Motstand ned, deretter supinert.',
          en: 'Arm 90° flexion, 10° adduction, internally rotated. Resist down, then supinated.'
        },
        positive: {
          no: 'Smerte med pronasjon, lettelse med supinasjon',
          en: 'Pain with pronation, relief with supination'
        },
        sensitivity: 0.67,
        specificity: 0.37
      },
      {
        id: 'biceps_load_2',
        name: { no: 'Biceps Load II Test', en: 'Biceps Load II Test' },
        procedure: {
          no: 'Ryggliggende, arm 120° abduksjon, albue 90° fleksjon. Motstand mot biceps.',
          en: 'Supine, arm 120° abduction, elbow 90° flexion. Resist biceps.'
        },
        positive: {
          no: 'Smerte øker med biceps kontraksjon',
          en: 'Pain increases with biceps contraction'
        },
        sensitivity: 0.90,
        specificity: 0.97
      },
      {
        id: 'crank_test',
        name: { no: 'Crank Test', en: 'Crank Test' },
        procedure: {
          no: 'Arm 160° elevasjon, aksial kompresjon + rotasjon.',
          en: 'Arm 160° elevation, axial compression + rotation.'
        },
        positive: {
          no: 'Smerte eller klikk',
          en: 'Pain or click'
        },
        sensitivity: 0.91,
        specificity: 0.93
      },
      {
        id: 'anterior_slide',
        name: { no: 'Anterior Slide Test', en: 'Anterior Slide Test' },
        procedure: {
          no: 'Hånd på hofte, press albue anteriort og superiort.',
          en: 'Hand on hip, push elbow anteriorly and superiorly.'
        },
        positive: {
          no: 'Smerte eller klikk anteriort',
          en: 'Pain or click anteriorly'
        },
        sensitivity: 0.78,
        specificity: 0.91
      }
    ]
  },

  // ============================================================================
  // ELBOW CLUSTERS
  // ============================================================================

  LATERAL_EPICONDYLITIS: {
    id: 'LATERAL_EPICONDYLITIS',
    name: { no: 'Lateral Epicondylitt (Tennis Elbow)', en: 'Lateral Epicondylitis (Tennis Elbow)' },
    region: 'ELBOW',
    description: {
      no: 'Ekstensor tendinopati',
      en: 'Extensor tendinopathy'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive tester bekrefter lateral epicondylitt',
        en: '≥2 positive tests confirm lateral epicondylitis'
      }
    },
    tests: [
      {
        id: 'cozen',
        name: { no: "Cozen's Test", en: "Cozen's Test" },
        procedure: {
          no: 'Albue flektert, underarm pronert, motstand mot håndleddsekstensjon.',
          en: 'Elbow flexed, forearm pronated, resist wrist extension.'
        },
        positive: {
          no: 'Smerte ved lateral epicondyl',
          en: 'Pain at lateral epicondyle'
        },
        sensitivity: 0.84,
        specificity: 0.75
      },
      {
        id: 'mill',
        name: { no: "Mill's Test", en: "Mill's Test" },
        procedure: {
          no: 'Albue ekstendert, håndledd passivt flektert og pronert.',
          en: 'Elbow extended, wrist passively flexed and pronated.'
        },
        positive: {
          no: 'Smerte ved lateral epicondyl',
          en: 'Pain at lateral epicondyle'
        },
        sensitivity: 0.76,
        specificity: 0.82
      },
      {
        id: 'maudsley',
        name: { no: "Maudsley's Test", en: "Maudsley's Test" },
        procedure: {
          no: 'Motstand mot ekstensjon av 3. finger.',
          en: 'Resist extension of middle finger.'
        },
        positive: {
          no: 'Smerte ved lateral epicondyl',
          en: 'Pain at lateral epicondyle'
        },
        sensitivity: 0.88,
        specificity: 0.70
      },
      {
        id: 'lateral_epicondyle_palpation',
        name: { no: 'Palpasjon Lateral Epicondyl', en: 'Lateral Epicondyle Palpation' },
        procedure: {
          no: 'Direkte palpasjon av lateral epicondyl og ECRB-feste.',
          en: 'Direct palpation of lateral epicondyle and ECRB attachment.'
        },
        positive: {
          no: 'Lokal ømhet',
          en: 'Local tenderness'
        },
        sensitivity: 0.95,
        specificity: 0.55
      }
    ]
  },

  MEDIAL_EPICONDYLITIS: {
    id: 'MEDIAL_EPICONDYLITIS',
    name: { no: 'Medial Epicondylitt (Golfer Elbow)', en: 'Medial Epicondylitis (Golfer Elbow)' },
    region: 'ELBOW',
    description: {
      no: 'Flexor/pronator tendinopati',
      en: 'Flexor/pronator tendinopathy'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester bekrefter medial epicondylitt',
        en: '≥2 positive tests confirm medial epicondylitis'
      }
    },
    tests: [
      {
        id: 'reverse_cozen',
        name: { no: 'Reverse Cozen Test', en: 'Reverse Cozen Test' },
        procedure: {
          no: 'Albue ekstendert, motstand mot håndleddsfleksjon og pronasjon.',
          en: 'Elbow extended, resist wrist flexion and pronation.'
        },
        positive: {
          no: 'Smerte ved medial epicondyl',
          en: 'Pain at medial epicondyle'
        },
        sensitivity: 0.89,
        specificity: 0.68
      },
      {
        id: 'medial_epicondyle_palpation',
        name: { no: 'Palpasjon Medial Epicondyl', en: 'Medial Epicondyle Palpation' },
        procedure: {
          no: 'Direkte palpasjon av medial epicondyl og flexor-feste.',
          en: 'Direct palpation of medial epicondyle and flexor attachment.'
        },
        positive: {
          no: 'Lokal ømhet',
          en: 'Local tenderness'
        },
        sensitivity: 0.92,
        specificity: 0.50
      },
      {
        id: 'resisted_pronation',
        name: { no: 'Motstand Pronasjon', en: 'Resisted Pronation' },
        procedure: {
          no: 'Albue 90° fleksjon, motstand mot pronasjon.',
          en: 'Elbow 90° flexion, resist pronation.'
        },
        positive: {
          no: 'Smerte medialt',
          en: 'Medial pain'
        },
        sensitivity: 0.75,
        specificity: 0.78
      }
    ]
  },

  ELBOW_LIGAMENT: {
    id: 'ELBOW_LIGAMENT',
    name: { no: 'Albue Ligament Instabilitet', en: 'Elbow Ligament Instability' },
    region: 'ELBOW',
    description: {
      no: 'MCL/LCL skade',
      en: 'MCL/LCL injury'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 3,
      interpretation: {
        no: 'Positiv valgus/varus stress indikerer ligamentskade',
        en: 'Positive valgus/varus stress indicates ligament damage'
      }
    },
    tests: [
      {
        id: 'valgus_stress',
        name: { no: 'Valgus Stress Test (MCL)', en: 'Valgus Stress Test (MCL)' },
        procedure: {
          no: 'Albue 20-30° fleksjon, valgus stress.',
          en: 'Elbow 20-30° flexion, valgus stress.'
        },
        positive: {
          no: 'Smerte eller økt laxitet medialt',
          en: 'Pain or increased laxity medially'
        },
        sensitivity: 0.66,
        specificity: 0.90
      },
      {
        id: 'varus_stress',
        name: { no: 'Varus Stress Test (LCL)', en: 'Varus Stress Test (LCL)' },
        procedure: {
          no: 'Albue 20-30° fleksjon, varus stress.',
          en: 'Elbow 20-30° flexion, varus stress.'
        },
        positive: {
          no: 'Smerte eller økt laxitet lateralt',
          en: 'Pain or increased laxity laterally'
        },
        sensitivity: 0.65,
        specificity: 0.88
      },
      {
        id: 'posterolateral_pivot',
        name: { no: 'Posterolateral Rotatory Pivot', en: 'Posterolateral Rotatory Pivot' },
        procedure: {
          no: 'Ryggliggende, arm over hodet, valgus + supinasjon + aksial kompresjon ved fleksjon.',
          en: 'Supine, arm overhead, valgus + supination + axial compression during flexion.'
        },
        positive: {
          no: 'Apprehension eller klikk',
          en: 'Apprehension or clunk'
        },
        sensitivity: 0.38,
        specificity: 0.95
      }
    ]
  },

  // ============================================================================
  // WRIST/HAND CLUSTERS
  // ============================================================================

  CARPAL_TUNNEL: {
    id: 'CARPAL_TUNNEL',
    name: { no: 'Karpaltunnel Syndrom', en: 'Carpal Tunnel Syndrome' },
    region: 'WRIST_HAND',
    description: {
      no: 'N. medianus kompresjon',
      en: 'Median nerve compression'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive tester indikerer karpaltunnel syndrom',
        en: '≥2 positive tests indicate carpal tunnel syndrome'
      }
    },
    tests: [
      {
        id: 'phalen',
        name: { no: "Phalen's Test", en: "Phalen's Test" },
        procedure: {
          no: 'Maksimal håndleddsfleksjon i 60 sekunder.',
          en: 'Maximal wrist flexion for 60 seconds.'
        },
        positive: {
          no: 'Parestesier i n. medianus distribusjon',
          en: 'Paresthesia in median nerve distribution'
        },
        sensitivity: 0.68,
        specificity: 0.73
      },
      {
        id: 'reverse_phalen',
        name: { no: 'Reverse Phalen (Prayer)', en: 'Reverse Phalen (Prayer)' },
        procedure: {
          no: 'Maksimal håndleddsekstensjon i 60 sekunder.',
          en: 'Maximal wrist extension for 60 seconds.'
        },
        positive: {
          no: 'Parestesier i n. medianus distribusjon',
          en: 'Paresthesia in median nerve distribution'
        },
        sensitivity: 0.54,
        specificity: 0.75
      },
      {
        id: 'tinel_wrist',
        name: { no: "Tinel's Test (Håndledd)", en: "Tinel's Test (Wrist)" },
        procedure: {
          no: 'Perkusjon over karpaltunnelen.',
          en: 'Percussion over carpal tunnel.'
        },
        positive: {
          no: 'Utstrålende parestesier distalt',
          en: 'Radiating paresthesia distally'
        },
        sensitivity: 0.50,
        specificity: 0.77
      },
      {
        id: 'carpal_compression',
        name: { no: 'Carpal Compression Test', en: 'Carpal Compression Test' },
        procedure: {
          no: 'Direkte press over karpaltunnelen i 30 sek.',
          en: 'Direct pressure over carpal tunnel for 30 sec.'
        },
        positive: {
          no: 'Parestesier i n. medianus distribusjon',
          en: 'Paresthesia in median nerve distribution'
        },
        sensitivity: 0.87,
        specificity: 0.90
      }
    ]
  },

  DE_QUERVAIN: {
    id: 'DE_QUERVAIN',
    name: { no: "De Quervain's Tenosynovitt", en: "De Quervain's Tenosynovitis" },
    region: 'WRIST_HAND',
    description: {
      no: 'Stenoserende tenosynovitt 1. dorsal kompartment',
      en: 'Stenosing tenosynovitis 1st dorsal compartment'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester bekrefter De Quervains',
        en: '≥2 positive tests confirm De Quervains'
      }
    },
    tests: [
      {
        id: 'finkelstein',
        name: { no: 'Finkelstein Test', en: 'Finkelstein Test' },
        procedure: {
          no: 'Tommel i håndflate, knytt neve, ulnar deviasjon.',
          en: 'Thumb in palm, make fist, ulnar deviation.'
        },
        positive: {
          no: 'Skarp smerte over radiale styloid',
          en: 'Sharp pain over radial styloid'
        },
        sensitivity: 0.89,
        specificity: 0.85
      },
      {
        id: 'eichhoff',
        name: { no: 'Eichhoff Test', en: 'Eichhoff Test' },
        procedure: {
          no: 'Modifisert Finkelstein - aktiv ulnar deviasjon.',
          en: 'Modified Finkelstein - active ulnar deviation.'
        },
        positive: {
          no: 'Smerte over 1. dorsale kompartment',
          en: 'Pain over 1st dorsal compartment'
        },
        sensitivity: 0.91,
        specificity: 0.79
      },
      {
        id: 'first_dorsal_palpation',
        name: { no: 'Palpasjon 1. Dorsale Kompartment', en: '1st Dorsal Compartment Palpation' },
        procedure: {
          no: 'Palper APL og EPB sener over radiale styloid.',
          en: 'Palpate APL and EPB tendons over radial styloid.'
        },
        positive: {
          no: 'Lokal ømhet og hevelse',
          en: 'Local tenderness and swelling'
        },
        sensitivity: 0.95,
        specificity: 0.60
      }
    ]
  },

  TFCC_INJURY: {
    id: 'TFCC_INJURY',
    name: { no: 'TFCC Skade', en: 'TFCC Injury' },
    region: 'WRIST_HAND',
    description: {
      no: 'Triangular fibrocartilage complex lesjon',
      en: 'Triangular fibrocartilage complex lesion'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester indikerer TFCC skade',
        en: '≥2 positive tests indicate TFCC injury'
      }
    },
    tests: [
      {
        id: 'tfcc_compression',
        name: { no: 'TFCC Kompresjon', en: 'TFCC Compression' },
        procedure: {
          no: 'Aksial kompresjon + ulnar deviasjon.',
          en: 'Axial compression + ulnar deviation.'
        },
        positive: {
          no: 'Smerte ulnart',
          en: 'Ulnar pain'
        },
        sensitivity: 0.66,
        specificity: 0.64
      },
      {
        id: 'piano_key',
        name: { no: 'Piano Key Test', en: 'Piano Key Test' },
        procedure: {
          no: 'Press distale ulna ned som en pianotangent.',
          en: 'Press distal ulna down like a piano key.'
        },
        positive: {
          no: 'Økt bevegelse vs. kontralateral, smerte',
          en: 'Increased movement vs. contralateral, pain'
        },
        sensitivity: 0.59,
        specificity: 0.72
      },
      {
        id: 'fovea_sign',
        name: { no: 'Fovea Sign', en: 'Fovea Sign' },
        procedure: {
          no: 'Palper fovea mellom FCU og ulnar styloid.',
          en: 'Palpate fovea between FCU and ulnar styloid.'
        },
        positive: {
          no: 'Lokal ømhet',
          en: 'Local tenderness'
        },
        sensitivity: 0.95,
        specificity: 0.87
      }
    ]
  },

  // ============================================================================
  // HIP CLUSTERS
  // ============================================================================

  HIP_LABRAL: {
    id: 'HIP_LABRAL',
    name: { no: 'Hofte Labrum Skade', en: 'Hip Labral Tear' },
    region: 'HIP',
    description: {
      no: 'Acetabulær labrum lesjon',
      en: 'Acetabular labrum lesion'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive tester indikerer labrum skade',
        en: '≥2 positive tests indicate labral tear'
      }
    },
    tests: [
      {
        id: 'fadir',
        name: { no: 'FADIR Test', en: 'FADIR Test' },
        procedure: {
          no: 'Fleksjon 90°, adduksjon, innadrotasjon.',
          en: 'Flexion 90°, adduction, internal rotation.'
        },
        positive: {
          no: 'Lyskesmerte anteriort',
          en: 'Anterior groin pain'
        },
        sensitivity: 0.96,
        specificity: 0.17
      },
      {
        id: 'faber',
        name: { no: 'FABER Test (Patrick)', en: 'FABER Test (Patrick)' },
        procedure: {
          no: 'Fleksjon, abduksjon, utadrotasjon (4-tall posisjon).',
          en: 'Flexion, abduction, external rotation (figure-4 position).'
        },
        positive: {
          no: 'Lyskesmerte eller posteriort bekkensmerter',
          en: 'Groin pain or posterior pelvic pain'
        },
        sensitivity: 0.82,
        specificity: 0.25
      },
      {
        id: 'scour',
        name: { no: 'Scour Test', en: 'Scour Test' },
        procedure: {
          no: 'Fleksjon 90°, aksial kompresjon + sirkulær bevegelse.',
          en: 'Flexion 90°, axial compression + circular motion.'
        },
        positive: {
          no: 'Smerte eller klikk',
          en: 'Pain or click'
        },
        sensitivity: 0.91,
        specificity: 0.29
      },
      {
        id: 'resisted_slr',
        name: { no: 'Motstand SLR', en: 'Resisted SLR' },
        procedure: {
          no: 'Motstand mot SLR ved 15° fleksjon.',
          en: 'Resist SLR at 15° flexion.'
        },
        positive: {
          no: 'Lyskesmerte',
          en: 'Groin pain'
        },
        sensitivity: 0.59,
        specificity: 0.32
      }
    ]
  },

  FAI: {
    id: 'FAI',
    name: { no: 'Femoroacetabulær Impingement', en: 'Femoroacetabular Impingement' },
    region: 'HIP',
    description: {
      no: 'Cam/Pincer impingement',
      en: 'Cam/Pincer impingement'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester indikerer FAI',
        en: '≥2 positive tests indicate FAI'
      }
    },
    tests: [
      {
        id: 'fadir_fai',
        name: { no: 'FADIR (FAI)', en: 'FADIR (FAI)' },
        procedure: {
          no: 'Fleksjon 90°, adduksjon, innadrotasjon - noter ROM begrensning.',
          en: 'Flexion 90°, adduction, internal rotation - note ROM limitation.'
        },
        positive: {
          no: 'Smerte + redusert innadrotasjon (<20°)',
          en: 'Pain + reduced internal rotation (<20°)'
        },
        sensitivity: 0.94,
        specificity: 0.08
      },
      {
        id: 'log_roll',
        name: { no: 'Log Roll Test', en: 'Log Roll Test' },
        procedure: {
          no: 'Ryggliggende, passiv inn/utadrotasjon av hele benet.',
          en: 'Supine, passive internal/external rotation of whole leg.'
        },
        positive: {
          no: 'Smerte ved rotasjon',
          en: 'Pain with rotation'
        },
        sensitivity: 0.56,
        specificity: 0.52
      },
      {
        id: 'posterior_impingement',
        name: { no: 'Posterior Impingement', en: 'Posterior Impingement' },
        procedure: {
          no: 'Hofte i ekstensjon + utadrotasjon ved bordkant.',
          en: 'Hip in extension + external rotation at table edge.'
        },
        positive: {
          no: 'Posterior hofte/sete smerte',
          en: 'Posterior hip/buttock pain'
        },
        sensitivity: 0.72,
        specificity: 0.46
      }
    ]
  },

  HIP_OA: {
    id: 'HIP_OA',
    name: { no: 'Hofte Artrose', en: 'Hip Osteoarthritis' },
    region: 'HIP',
    description: {
      no: 'Degenerativ hoftelidelse',
      en: 'Degenerative hip disease'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive tester indikerer hofteartrose',
        en: '≥3 positive tests indicate hip osteoarthritis'
      }
    },
    tests: [
      {
        id: 'squat_test',
        name: { no: 'Squat Test', en: 'Squat Test' },
        procedure: {
          no: 'Dyp knebøy.',
          en: 'Deep squat.'
        },
        positive: {
          no: 'Lyskesmerte',
          en: 'Groin pain'
        },
        sensitivity: 0.78,
        specificity: 0.54
      },
      {
        id: 'internal_rotation_oa',
        name: { no: 'Innadrotasjon <15°', en: 'Internal Rotation <15°' },
        procedure: {
          no: 'Passiv innadrotasjon i 90° hoftefleksjon.',
          en: 'Passive internal rotation in 90° hip flexion.'
        },
        positive: {
          no: 'ROM <15°',
          en: 'ROM <15°'
        },
        sensitivity: 0.66,
        specificity: 0.79
      },
      {
        id: 'flexion_less_115',
        name: { no: 'Fleksjon <115°', en: 'Flexion <115°' },
        procedure: {
          no: 'Passiv hoftefleksjon.',
          en: 'Passive hip flexion.'
        },
        positive: {
          no: 'ROM <115°',
          en: 'ROM <115°'
        },
        sensitivity: 0.76,
        specificity: 0.58
      },
      {
        id: 'morning_stiffness',
        name: { no: 'Morgenstivhet <60 min', en: 'Morning Stiffness <60 min' },
        procedure: {
          no: 'Anamnese om morgenstivhet.',
          en: 'History of morning stiffness.'
        },
        positive: {
          no: 'Stivhet som varer <60 minutter',
          en: 'Stiffness lasting <60 minutes'
        },
        sensitivity: 0.64,
        specificity: 0.61
      },
      {
        id: 'age_over_50',
        name: { no: 'Alder >50', en: 'Age >50' },
        procedure: {
          no: 'Pasientens alder.',
          en: "Patient's age."
        },
        positive: {
          no: 'Alder over 50 år',
          en: 'Age over 50 years'
        },
        sensitivity: 0.83,
        specificity: 0.59
      }
    ]
  },

  // ============================================================================
  // KNEE CLUSTERS
  // ============================================================================

  MENISCUS: {
    id: 'MENISCUS',
    name: { no: 'Menisk Skade', en: 'Meniscus Injury' },
    region: 'KNEE',
    description: {
      no: 'Medial/lateral menisk lesjon',
      en: 'Medial/lateral meniscus lesion'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive tester indikerer menisk skade',
        en: '≥3 positive tests indicate meniscus injury'
      }
    },
    tests: [
      {
        id: 'mcmurray',
        name: { no: 'McMurray Test', en: 'McMurray Test' },
        procedure: {
          no: 'Ryggliggende, fleksjon/ekstensjon med rotasjon og varus/valgus.',
          en: 'Supine, flexion/extension with rotation and varus/valgus.'
        },
        positive: {
          no: 'Klikk eller smerte ved leddlinjen',
          en: 'Click or pain at joint line'
        },
        sensitivity: 0.71,
        specificity: 0.71,
        variants: {
          medial: 'Utadrotasjon + valgus',
          lateral: 'Innadrotasjon + varus'
        }
      },
      {
        id: 'apley_compression',
        name: { no: 'Apley Kompresjon', en: 'Apley Compression' },
        procedure: {
          no: 'Mageliggende, kne 90° fleksjon, aksial kompresjon + rotasjon.',
          en: 'Prone, knee 90° flexion, axial compression + rotation.'
        },
        positive: {
          no: 'Smerte ved kompresjon (menisk) vs. distraksjon (ligament)',
          en: 'Pain with compression (meniscus) vs. distraction (ligament)'
        },
        sensitivity: 0.61,
        specificity: 0.70
      },
      {
        id: 'thessaly',
        name: { no: 'Thessaly Test', en: 'Thessaly Test' },
        procedure: {
          no: 'Stående på ett ben, 20° knefleksjon, roter kroppen.',
          en: 'Standing on one leg, 20° knee flexion, rotate body.'
        },
        positive: {
          no: 'Smerte eller låsning ved leddlinjen',
          en: 'Pain or locking at joint line'
        },
        sensitivity: 0.89,
        specificity: 0.97
      },
      {
        id: 'joint_line_tenderness',
        name: { no: 'Leddlinje Palpasjon', en: 'Joint Line Tenderness' },
        procedure: {
          no: 'Palper mediale og laterale leddlinje.',
          en: 'Palpate medial and lateral joint lines.'
        },
        positive: {
          no: 'Lokal ømhet ved leddlinjen',
          en: 'Local tenderness at joint line'
        },
        sensitivity: 0.83,
        specificity: 0.43
      },
      {
        id: 'ege',
        name: { no: 'Ege Test', en: 'Ege Test' },
        procedure: {
          no: 'Dyp knebøy med føttene rotert (ut for medial, inn for lateral).',
          en: 'Deep squat with feet rotated (out for medial, in for lateral).'
        },
        positive: {
          no: 'Smerte eller klikk ved leddlinjen',
          en: 'Pain or click at joint line'
        },
        sensitivity: 0.72,
        specificity: 0.68
      }
    ]
  },

  ACL: {
    id: 'ACL',
    name: { no: 'Fremre Korsbånd (ACL)', en: 'Anterior Cruciate Ligament' },
    region: 'KNEE',
    description: {
      no: 'ACL ruptur/skade',
      en: 'ACL rupture/injury'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester indikerer ACL skade',
        en: '≥2 positive tests indicate ACL injury'
      }
    },
    redFlagCluster: true,
    tests: [
      {
        id: 'lachman',
        name: { no: 'Lachman Test', en: 'Lachman Test' },
        procedure: {
          no: 'Kne 20-30° fleksjon, stabiliser femur, dra tibia anteriort.',
          en: 'Knee 20-30° flexion, stabilize femur, pull tibia anteriorly.'
        },
        positive: {
          no: 'Økt anterior translasjon, bløt endepunkt',
          en: 'Increased anterior translation, soft endpoint'
        },
        sensitivity: 0.85,
        specificity: 0.94,
        grading: {
          grade1: '3-5mm',
          grade2: '5-10mm',
          grade3: '>10mm'
        }
      },
      {
        id: 'anterior_drawer_knee',
        name: { no: 'Anterior Drawer (Kne)', en: 'Anterior Drawer (Knee)' },
        procedure: {
          no: 'Kne 90° fleksjon, sittende på fot, dra tibia anteriort.',
          en: 'Knee 90° flexion, sitting on foot, pull tibia anteriorly.'
        },
        positive: {
          no: 'Økt anterior translasjon',
          en: 'Increased anterior translation'
        },
        sensitivity: 0.55,
        specificity: 0.92
      },
      {
        id: 'pivot_shift',
        name: { no: 'Pivot Shift Test', en: 'Pivot Shift Test' },
        procedure: {
          no: 'Ekstensjon, innadrotasjon + valgus, deretter fleksjon.',
          en: 'Extension, internal rotation + valgus, then flexion.'
        },
        positive: {
          no: 'Plutselig subluksasjon/reduksjon ved ~30°',
          en: 'Sudden subluxation/reduction at ~30°'
        },
        sensitivity: 0.28,
        specificity: 0.98
      }
    ]
  },

  PCL: {
    id: 'PCL',
    name: { no: 'Bakre Korsbånd (PCL)', en: 'Posterior Cruciate Ligament' },
    region: 'KNEE',
    description: {
      no: 'PCL ruptur/skade',
      en: 'PCL rupture/injury'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester indikerer PCL skade',
        en: '≥2 positive tests indicate PCL injury'
      }
    },
    tests: [
      {
        id: 'posterior_drawer',
        name: { no: 'Posterior Drawer', en: 'Posterior Drawer' },
        procedure: {
          no: 'Kne 90° fleksjon, skyv tibia posteriort.',
          en: 'Knee 90° flexion, push tibia posteriorly.'
        },
        positive: {
          no: 'Økt posterior translasjon',
          en: 'Increased posterior translation'
        },
        sensitivity: 0.90,
        specificity: 0.99
      },
      {
        id: 'posterior_sag',
        name: { no: 'Posterior Sag Sign', en: 'Posterior Sag Sign' },
        procedure: {
          no: 'Ryggliggende, hofte og kne 90° fleksjon, observer tibia fra siden.',
          en: 'Supine, hip and knee 90° flexion, observe tibia from side.'
        },
        positive: {
          no: 'Tibia siger posteriort',
          en: 'Tibia sags posteriorly'
        },
        sensitivity: 0.79,
        specificity: 1.00
      },
      {
        id: 'quadriceps_active',
        name: { no: 'Quadriceps Active Test', en: 'Quadriceps Active Test' },
        procedure: {
          no: 'Kne 90° fleksjon, foten stabilisert, kontraher quadriceps.',
          en: 'Knee 90° flexion, foot stabilized, contract quadriceps.'
        },
        positive: {
          no: 'Tibia beveger seg anteriort',
          en: 'Tibia moves anteriorly'
        },
        sensitivity: 0.54,
        specificity: 0.97
      }
    ]
  },

  MCL: {
    id: 'MCL',
    name: { no: 'Medialt Kollateralligament (MCL)', en: 'Medial Collateral Ligament' },
    region: 'KNEE',
    description: {
      no: 'MCL skade',
      en: 'MCL injury'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 2,
      interpretation: {
        no: 'Positiv valgus stress bekrefter MCL skade',
        en: 'Positive valgus stress confirms MCL injury'
      }
    },
    tests: [
      {
        id: 'valgus_stress_knee_0',
        name: { no: 'Valgus Stress 0°', en: 'Valgus Stress 0°' },
        procedure: {
          no: 'Kne i full ekstensjon, valgus stress.',
          en: 'Knee in full extension, valgus stress.'
        },
        positive: {
          no: 'Gaping medialt (indikerer også posterior kapsel/ACL skade)',
          en: 'Medial gaping (also indicates posterior capsule/ACL injury)'
        },
        sensitivity: 0.56,
        specificity: 0.91
      },
      {
        id: 'valgus_stress_knee_30',
        name: { no: 'Valgus Stress 30°', en: 'Valgus Stress 30°' },
        procedure: {
          no: 'Kne 30° fleksjon, valgus stress.',
          en: 'Knee 30° flexion, valgus stress.'
        },
        positive: {
          no: 'Gaping medialt (isolert MCL)',
          en: 'Medial gaping (isolated MCL)'
        },
        sensitivity: 0.86,
        specificity: 0.94,
        grading: {
          grade1: '0-5mm gaping',
          grade2: '5-10mm gaping',
          grade3: '>10mm gaping'
        }
      }
    ]
  },

  PATELLOFEMORAL: {
    id: 'PATELLOFEMORAL',
    name: { no: 'Patellofemoralt Syndrom', en: 'Patellofemoral Syndrome' },
    region: 'KNEE',
    description: {
      no: 'Anterior knesmerter/chondromalaci',
      en: 'Anterior knee pain/chondromalacia'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive tester indikerer patellofemoralt syndrom',
        en: '≥3 positive tests indicate patellofemoral syndrome'
      }
    },
    tests: [
      {
        id: 'clarke',
        name: { no: "Clarke's Test (Patella Grinding)", en: "Clarke's Test (Patella Grinding)" },
        procedure: {
          no: 'Press patella distalt, pasient kontrahere quadriceps.',
          en: 'Press patella distally, patient contracts quadriceps.'
        },
        positive: {
          no: 'Smerte under patella',
          en: 'Pain under patella'
        },
        sensitivity: 0.49,
        specificity: 0.67
      },
      {
        id: 'patellar_tilt',
        name: { no: 'Patella Tilt Test', en: 'Patella Tilt Test' },
        procedure: {
          no: 'Kne ekstendert, løft lateral patellakant.',
          en: 'Knee extended, lift lateral patellar edge.'
        },
        positive: {
          no: 'Kan ikke tilte til nøytral eller smerte',
          en: 'Cannot tilt to neutral or pain'
        },
        sensitivity: 0.43,
        specificity: 0.92
      },
      {
        id: 'patellar_apprehension',
        name: { no: 'Patella Apprehension', en: 'Patella Apprehension' },
        procedure: {
          no: 'Press patella lateralt med kne i lett fleksjon.',
          en: 'Push patella laterally with knee in slight flexion.'
        },
        positive: {
          no: 'Frykt for luksasjon',
          en: 'Fear of dislocation'
        },
        sensitivity: 0.39,
        specificity: 0.67
      },
      {
        id: 'squat_pain',
        name: { no: 'Smerte ved Knebøy', en: 'Pain with Squat' },
        procedure: {
          no: 'Dyp knebøy eller sitte-til-stå.',
          en: 'Deep squat or sit-to-stand.'
        },
        positive: {
          no: 'Anterior knesmerte',
          en: 'Anterior knee pain'
        },
        sensitivity: 0.91,
        specificity: 0.50
      },
      {
        id: 'stairs_pain',
        name: { no: 'Smerte ved Trapper', en: 'Pain with Stairs' },
        procedure: {
          no: 'Gå opp/ned trapper.',
          en: 'Walking up/down stairs.'
        },
        positive: {
          no: 'Smerte, spesielt ned trapper',
          en: 'Pain, especially going down'
        },
        sensitivity: 0.87,
        specificity: 0.45
      }
    ]
  },

  // ============================================================================
  // ANKLE/FOOT CLUSTERS
  // ============================================================================

  ANKLE_SPRAIN: {
    id: 'ANKLE_SPRAIN',
    name: { no: 'Ankel Forstuing (Lateral)', en: 'Ankle Sprain (Lateral)' },
    region: 'ANKLE_FOOT',
    description: {
      no: 'ATFL/CFL skade',
      en: 'ATFL/CFL injury'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive tester bekrefter lateral ankelskade',
        en: '≥2 positive tests confirm lateral ankle injury'
      }
    },
    tests: [
      {
        id: 'anterior_drawer_ankle',
        name: { no: 'Anterior Drawer (Ankel)', en: 'Anterior Drawer (Ankle)' },
        procedure: {
          no: 'Stabiliser tibia, dra calcaneus anteriort.',
          en: 'Stabilize tibia, pull calcaneus anteriorly.'
        },
        positive: {
          no: 'Økt anterior translasjon (ATFL)',
          en: 'Increased anterior translation (ATFL)'
        },
        sensitivity: 0.58,
        specificity: 0.84
      },
      {
        id: 'talar_tilt',
        name: { no: 'Talar Tilt Test', en: 'Talar Tilt Test' },
        procedure: {
          no: 'Stabiliser tibia, inverter calcaneus.',
          en: 'Stabilize tibia, invert calcaneus.'
        },
        positive: {
          no: 'Økt inversjon (CFL)',
          en: 'Increased inversion (CFL)'
        },
        sensitivity: 0.52,
        specificity: 0.88
      },
      {
        id: 'atfl_palpation',
        name: { no: 'ATFL Palpasjon', en: 'ATFL Palpation' },
        procedure: {
          no: 'Palper ATFL anteriort for lateral malleol.',
          en: 'Palpate ATFL anterior to lateral malleolus.'
        },
        positive: {
          no: 'Lokal ømhet',
          en: 'Local tenderness'
        },
        sensitivity: 0.92,
        specificity: 0.65
      },
      {
        id: 'ottawa_ankle',
        name: { no: 'Ottawa Ankel Regler', en: 'Ottawa Ankle Rules' },
        procedure: {
          no: 'Sjekk indikasjoner for røntgen.',
          en: 'Check indications for X-ray.'
        },
        positive: {
          no: 'Ømhet over malleol bakre kant, naviculare, eller metatarsal 5 base',
          en: 'Tenderness over malleolar posterior edge, navicular, or metatarsal 5 base'
        },
        sensitivity: 0.98,
        specificity: 0.40,
        redFlag: true,
        redFlagCondition: 'Possible fracture - requires imaging'
      }
    ]
  },

  ACHILLES: {
    id: 'ACHILLES',
    name: { no: 'Achilles Tendinopati/Ruptur', en: 'Achilles Tendinopathy/Rupture' },
    region: 'ANKLE_FOOT',
    description: {
      no: 'Achillessene patologi',
      en: 'Achilles tendon pathology'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive tester indikerer Achilles patologi',
        en: '≥2 positive tests indicate Achilles pathology'
      }
    },
    tests: [
      {
        id: 'thompson',
        name: { no: "Thompson's Test (Simmonds)", en: "Thompson's Test (Simmonds)" },
        procedure: {
          no: 'Mageliggende, klem leggmuskel.',
          en: 'Prone, squeeze calf muscle.'
        },
        positive: {
          no: 'Ingen plantar fleksjon = komplett ruptur',
          en: 'No plantar flexion = complete rupture'
        },
        sensitivity: 0.96,
        specificity: 0.93,
        redFlag: true,
        redFlagCondition: 'Complete Achilles rupture - urgent referral'
      },
      {
        id: 'matles',
        name: { no: "Matles' Test", en: "Matles' Test" },
        procedure: {
          no: 'Mageliggende, kne 90° fleksjon, observer ankelposisjon.',
          en: 'Prone, knee 90° flexion, observe ankle position.'
        },
        positive: {
          no: 'Ankelen faller i dorsifleksjon (ruptur)',
          en: 'Ankle falls into dorsiflexion (rupture)'
        },
        sensitivity: 0.88,
        specificity: 0.85
      },
      {
        id: 'achilles_palpation',
        name: { no: 'Achilles Palpasjon', en: 'Achilles Palpation' },
        procedure: {
          no: 'Palper langs Achillessenen.',
          en: 'Palpate along Achilles tendon.'
        },
        positive: {
          no: 'Ømhet, fortykkelse, eller gap',
          en: 'Tenderness, thickening, or gap'
        },
        sensitivity: 0.89,
        specificity: 0.70
      },
      {
        id: 'royal_london',
        name: { no: 'Royal London Hospital Test', en: 'Royal London Hospital Test' },
        procedure: {
          no: 'Palper ømmeste punkt i dorsifleksjon vs. plantar fleksjon.',
          en: 'Palpate most tender point in dorsiflexion vs. plantar flexion.'
        },
        positive: {
          no: 'Ømhet forsvinner ved plantar fleksjon (tendinopati)',
          en: 'Tenderness disappears in plantar flexion (tendinopathy)'
        },
        sensitivity: 0.84,
        specificity: 0.83
      }
    ]
  },

  PLANTAR_FASCIITIS: {
    id: 'PLANTAR_FASCIITIS',
    name: { no: 'Plantar Fascitt', en: 'Plantar Fasciitis' },
    region: 'ANKLE_FOOT',
    description: {
      no: 'Plantar fascie smerte',
      en: 'Plantar fascia pain'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 4,
      interpretation: {
        no: '≥3 positive tester bekrefter plantar fascitt',
        en: '≥3 positive tests confirm plantar fasciitis'
      }
    },
    tests: [
      {
        id: 'windlass',
        name: { no: 'Windlass Test', en: 'Windlass Test' },
        procedure: {
          no: 'Passiv dorsifleksjon av stortå.',
          en: 'Passive dorsiflexion of great toe.'
        },
        positive: {
          no: 'Smerte i plantar fascie',
          en: 'Pain in plantar fascia'
        },
        sensitivity: 0.32,
        specificity: 1.00
      },
      {
        id: 'first_step_pain',
        name: { no: 'Første Skritt Smerte', en: 'First Step Pain' },
        procedure: {
          no: 'Anamnese om smerte ved første skritt om morgenen.',
          en: 'History of pain with first steps in morning.'
        },
        positive: {
          no: 'Klassisk morgenstivhet/smerte',
          en: 'Classic morning stiffness/pain'
        },
        sensitivity: 0.99,
        specificity: 0.77
      },
      {
        id: 'plantar_palpation',
        name: { no: 'Plantar Palpasjon', en: 'Plantar Palpation' },
        procedure: {
          no: 'Palper medial calcaneal tuberkel.',
          en: 'Palpate medial calcaneal tuberosity.'
        },
        positive: {
          no: 'Lokal ømhet ved fasciefeste',
          en: 'Local tenderness at fascia attachment'
        },
        sensitivity: 0.91,
        specificity: 0.68
      },
      {
        id: 'prolonged_standing_pain',
        name: { no: 'Smerte ved Langvarig Ståing', en: 'Pain with Prolonged Standing' },
        procedure: {
          no: 'Anamnese om smerte etter langvarig belastning.',
          en: 'History of pain after prolonged weight-bearing.'
        },
        positive: {
          no: 'Smerte øker gjennom dagen',
          en: 'Pain increases throughout day'
        },
        sensitivity: 0.87,
        specificity: 0.54
      }
    ]
  },

  // ============================================================================
  // LUMBAR SPINE CLUSTERS
  // ============================================================================

  LUMBAR_DISC: {
    id: 'LUMBAR_DISC',
    name: { no: 'Lumbal Diskusprolaps', en: 'Lumbar Disc Herniation' },
    region: 'LUMBAR',
    description: {
      no: 'Diskogen radikulopati',
      en: 'Discogenic radiculopathy'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive tester indikerer diskusprolaps',
        en: '≥3 positive tests indicate disc herniation'
      }
    },
    tests: [
      {
        id: 'slr',
        name: { no: 'SLR (Straight Leg Raise)', en: 'SLR (Straight Leg Raise)' },
        procedure: {
          no: 'Ryggliggende, løft strakt ben.',
          en: 'Supine, lift straight leg.'
        },
        positive: {
          no: 'Radierende smerte <70° (positiv ved 30-70°)',
          en: 'Radiating pain <70° (positive at 30-70°)'
        },
        sensitivity: 0.91,
        specificity: 0.26
      },
      {
        id: 'crossed_slr',
        name: { no: 'Krysset SLR', en: 'Crossed SLR' },
        procedure: {
          no: 'SLR på frisk side gir smerte i affisert side.',
          en: 'SLR on unaffected side causes pain in affected side.'
        },
        positive: {
          no: 'Smerte i kontralateral ben',
          en: 'Pain in contralateral leg'
        },
        sensitivity: 0.29,
        specificity: 0.88
      },
      {
        id: 'slump',
        name: { no: 'Slump Test', en: 'Slump Test' },
        procedure: {
          no: 'Sittende, flekter nakke, ekstender kne, dorsiflecter fot.',
          en: 'Sitting, flex neck, extend knee, dorsiflex foot.'
        },
        positive: {
          no: 'Radierende smerte reprodusert',
          en: 'Radiating pain reproduced'
        },
        sensitivity: 0.84,
        specificity: 0.83
      },
      {
        id: 'femoral_stretch',
        name: { no: 'Femoral Stretch (L2-L4)', en: 'Femoral Stretch (L2-L4)' },
        procedure: {
          no: 'Mageliggende, knefleksjon, hofteekstensjon.',
          en: 'Prone, knee flexion, hip extension.'
        },
        positive: {
          no: 'Smerte i fremre lår (høyere lumbal prolaps)',
          en: 'Pain in anterior thigh (upper lumbar herniation)'
        },
        sensitivity: 0.84,
        specificity: 0.95
      },
      {
        id: 'dermatomal_deficit',
        name: { no: 'Dermatomalt Utfall', en: 'Dermatomal Deficit' },
        procedure: {
          no: 'Test sensibilitet i L4, L5, S1 dermatomer.',
          en: 'Test sensation in L4, L5, S1 dermatomes.'
        },
        positive: {
          no: 'Redusert sensibilitet i spesifikt dermatom',
          en: 'Decreased sensation in specific dermatome'
        },
        sensitivity: 0.50,
        specificity: 0.90
      }
    ]
  },

  LUMBAR_FACET: {
    id: 'LUMBAR_FACET',
    name: { no: 'Lumbal Fasettleddssyndrom', en: 'Lumbar Facet Syndrome' },
    region: 'LUMBAR',
    description: {
      no: 'Fasettledd dysfunksjon',
      en: 'Facet joint dysfunction'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive tester indikerer fasettleddssyndrom',
        en: '≥3 positive tests indicate facet syndrome'
      }
    },
    tests: [
      {
        id: 'kemp',
        name: { no: "Kemp's Test", en: "Kemp's Test" },
        procedure: {
          no: 'Ekstensjon + rotasjon + sidebøy til affisert side.',
          en: 'Extension + rotation + sidebend to affected side.'
        },
        positive: {
          no: 'Lokal smerte (fasett) vs. radierende (disk)',
          en: 'Local pain (facet) vs. radiating (disc)'
        },
        sensitivity: 0.76,
        specificity: 0.71
      },
      {
        id: 'facet_palpation',
        name: { no: 'Fasett Palpasjon', en: 'Facet Palpation' },
        procedure: {
          no: 'Palper over fasettleddene paravertebralt.',
          en: 'Palpate over facet joints paravertebrally.'
        },
        positive: {
          no: 'Lokal ømhet ved fasettledd',
          en: 'Local tenderness at facet joint'
        },
        sensitivity: 0.82,
        specificity: 0.48
      },
      {
        id: 'extension_pain',
        name: { no: 'Ekstensjon Smerte', en: 'Extension Pain' },
        procedure: {
          no: 'Aktiv lumbal ekstensjon.',
          en: 'Active lumbar extension.'
        },
        positive: {
          no: 'Smerte ved ekstensjon',
          en: 'Pain with extension'
        },
        sensitivity: 0.79,
        specificity: 0.50
      },
      {
        id: 'no_radicular_signs',
        name: { no: 'Fravær av Radikulære Tegn', en: 'Absence of Radicular Signs' },
        procedure: {
          no: 'Negativ SLR og normal nevrologi.',
          en: 'Negative SLR and normal neurology.'
        },
        positive: {
          no: 'SLR negativ, reflekser normale',
          en: 'SLR negative, reflexes normal'
        },
        sensitivity: 0.85,
        specificity: 0.60
      },
      {
        id: 'morning_stiffness_short',
        name: { no: 'Kort Morgenstivhet', en: 'Short Morning Stiffness' },
        procedure: {
          no: 'Anamnese om morgenstivhet <30 min.',
          en: 'History of morning stiffness <30 min.'
        },
        positive: {
          no: 'Stivhet som letter raskt',
          en: 'Stiffness that resolves quickly'
        },
        sensitivity: 0.68,
        specificity: 0.55
      }
    ]
  },

  SACROILIAC: {
    id: 'SACROILIAC',
    name: { no: 'Sacroiliacaledd Dysfunksjon', en: 'Sacroiliac Joint Dysfunction' },
    region: 'SACROILIAC',
    description: {
      no: 'SI-ledd smerte/dysfunksjon',
      en: 'SI joint pain/dysfunction'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive provokasjonstester indikerer SI-ledd dysfunksjon',
        en: '≥3 positive provocation tests indicate SI joint dysfunction'
      }
    },
    tests: [
      {
        id: 'distraction',
        name: { no: 'Distraksjonstest', en: 'Distraction Test' },
        procedure: {
          no: 'Ryggliggende, press SIAS lateralt.',
          en: 'Supine, press ASIS laterally.'
        },
        positive: {
          no: 'Smerte posteriort ved SI-ledd',
          en: 'Pain posteriorly at SI joint'
        },
        sensitivity: 0.60,
        specificity: 0.81
      },
      {
        id: 'compression',
        name: { no: 'Kompresjon Test', en: 'Compression Test' },
        procedure: {
          no: 'Sideliggende, press nedover på ilium.',
          en: 'Sidelying, press down on ilium.'
        },
        positive: {
          no: 'Smerte ved SI-ledd',
          en: 'Pain at SI joint'
        },
        sensitivity: 0.69,
        specificity: 0.69
      },
      {
        id: 'thigh_thrust',
        name: { no: 'Thigh Thrust (Posterior Shear)', en: 'Thigh Thrust (Posterior Shear)' },
        procedure: {
          no: 'Ryggliggende, hofte 90° fleksjon, aksial kompresjon gjennom femur.',
          en: 'Supine, hip 90° flexion, axial compression through femur.'
        },
        positive: {
          no: 'Smerte ved SI-ledd',
          en: 'Pain at SI joint'
        },
        sensitivity: 0.88,
        specificity: 0.69
      },
      {
        id: 'sacral_thrust',
        name: { no: 'Sacral Thrust', en: 'Sacral Thrust' },
        procedure: {
          no: 'Mageliggende, press anteriort på sacrum.',
          en: 'Prone, press anteriorly on sacrum.'
        },
        positive: {
          no: 'Smerte ved SI-ledd',
          en: 'Pain at SI joint'
        },
        sensitivity: 0.63,
        specificity: 0.75
      },
      {
        id: 'gaenslen',
        name: { no: "Gaenslen's Test", en: "Gaenslen's Test" },
        procedure: {
          no: 'Ryggliggende ved bordkant, ett ben over kanten, det andre mot brystet.',
          en: 'Supine at table edge, one leg over edge, other to chest.'
        },
        positive: {
          no: 'Smerte ved SI-ledd',
          en: 'Pain at SI joint'
        },
        sensitivity: 0.53,
        specificity: 0.71
      },
      {
        id: 'faber_si',
        name: { no: 'FABER (SI)', en: 'FABER (SI)' },
        procedure: {
          no: 'Fleksjon, abduksjon, utadrotasjon - noter posterior bekkensmerte.',
          en: 'Flexion, abduction, external rotation - note posterior pelvic pain.'
        },
        positive: {
          no: 'Smerte posteriort i bekken (ikke lyske)',
          en: 'Pain posteriorly in pelvis (not groin)'
        },
        sensitivity: 0.77,
        specificity: 0.50
      }
    ]
  },

  // ============================================================================
  // CERVICAL SPINE CLUSTERS (from Protocol v2.0)
  // ============================================================================

  CERVICAL_RADICULOPATHY: {
    id: 'CERVICAL_RADICULOPATHY',
    name: { no: "Cervikal Radikulopati (Wainner's Cluster)", en: "Cervical Radiculopathy (Wainner's Cluster)" },
    region: 'CERVICAL',
    description: {
      no: 'Nerverotaffeksjon cervikalt - 4 test klynge med høy diagnostisk nøyaktighet',
      en: 'Cervical nerve root involvement - 4 test cluster with high diagnostic accuracy'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 4,
      interpretation: {
        no: '3/4 positive = LR+ 6.1, 4/4 positive = LR+ 30.3 (99% sannsynlighet)',
        en: '3/4 positive = LR+ 6.1, 4/4 positive = LR+ 30.3 (99% probability)'
      }
    },
    tests: [
      {
        id: 'ultt_a',
        name: { no: 'ULTT A (Medianus)', en: 'ULTT A (Median Nerve)' },
        procedure: {
          no: 'Ryggliggende. Skulder depresjon, abduksjon 110°, supinasjon, håndledds/fingerekstensjon, albueekstensjon, cervikal sidebøy bort.',
          en: 'Supine. Shoulder depression, abduction 110°, supination, wrist/finger extension, elbow extension, cervical sidebend away.'
        },
        positive: {
          no: 'Reproduksjon av symptomer, redusert ROM vs. frisk side',
          en: 'Reproduction of symptoms, reduced ROM vs. unaffected side'
        },
        sensitivity: 0.97,
        specificity: 0.22,
        clinicalNote: {
          no: 'Høy sensitivitet - negativ test utelukker radikulopati',
          en: 'High sensitivity - negative test rules out radiculopathy'
        }
      },
      {
        id: 'spurling_a',
        name: { no: "Spurling's Test A", en: "Spurling's Test A" },
        procedure: {
          no: 'Sittende. Cervikal ekstensjon, sidebøy og rotasjon mot affisert side, aksial kompresjon.',
          en: 'Seated. Cervical extension, sidebend and rotation to affected side, axial compression.'
        },
        positive: {
          no: 'Reproduksjon av radierende armsmerter',
          en: 'Reproduction of radiating arm pain'
        },
        sensitivity: 0.50,
        specificity: 0.86,
        clinicalNote: {
          no: 'Høy spesifisitet - positiv test bekrefter radikulopati',
          en: 'High specificity - positive test confirms radiculopathy'
        }
      },
      {
        id: 'cervical_distraction',
        name: { no: 'Distraksjonstest', en: 'Distraction Test' },
        procedure: {
          no: 'Ryggliggende. Løft hodet med aksial distraksjon.',
          en: 'Supine. Lift head with axial distraction.'
        },
        positive: {
          no: 'Lindring av symptomer',
          en: 'Relief of symptoms'
        },
        sensitivity: 0.44,
        specificity: 0.90,
        clinicalNote: {
          no: 'Høy spesifisitet - lindring er positivt funn',
          en: 'High specificity - relief is positive finding'
        }
      },
      {
        id: 'rotation_rom',
        name: { no: 'Rotasjon < 60°', en: 'Rotation < 60°' },
        procedure: {
          no: 'Aktiv cervikal rotasjon til affisert side.',
          en: 'Active cervical rotation to affected side.'
        },
        positive: {
          no: 'ROM < 60° til affisert side',
          en: 'ROM < 60° to affected side'
        },
        sensitivity: 0.64,
        specificity: 0.69
      }
    ]
  },

  CERVICAL_SCREENING: {
    id: 'CERVICAL_SCREENING',
    name: { no: 'Canadian C-Spine Rule (CCR)', en: 'Canadian C-Spine Rule (CCR)' },
    region: 'CERVICAL',
    description: {
      no: 'Screening for cervikalfraktur etter traume - sensitivitet 99-100%',
      en: 'Screening for cervical fracture after trauma - sensitivity 99-100%'
    },
    redFlagCluster: true,
    diagnosticCriteria: {
      threshold: 1,
      total: 3,
      interpretation: {
        no: 'Høyrisiko = Bildediagnostikk påkrevd. Lavrisiko + kan rotere 45° = Ingen røntgen',
        en: 'High risk = Imaging required. Low risk + can rotate 45° = No X-ray needed'
      }
    },
    tests: [
      {
        id: 'ccr_high_risk',
        name: { no: 'Høyrisikofaktorer', en: 'High Risk Factors' },
        procedure: {
          no: 'Alder ≥65 ELLER farlig mekanisme (fall >1m, bilulykke >100km/t) ELLER parestesier i ekstremiteter',
          en: 'Age ≥65 OR dangerous mechanism (fall >1m, MVA >100km/h) OR paresthesias in extremities'
        },
        positive: {
          no: 'En eller flere høyrisikofaktorer tilstede',
          en: 'One or more high risk factors present'
        },
        redFlag: true,
        redFlagCondition: 'Cervical imaging required'
      },
      {
        id: 'ccr_low_risk',
        name: { no: 'Lavrisikofaktorer', en: 'Low Risk Factors' },
        procedure: {
          no: 'Enkel påkjørsel bakfra, sittende i mottak, oppegående, forsinket smerte, ingen midtlinjeømhet',
          en: 'Simple rear-end collision, sitting in ED, ambulatory, delayed pain onset, no midline tenderness'
        },
        positive: {
          no: 'Lavrisikofaktorer tilstede (tillater ROM-testing)',
          en: 'Low risk factors present (allows ROM testing)'
        },
        sensitivity: 0.99,
        specificity: 0.45
      },
      {
        id: 'ccr_rotation_test',
        name: { no: 'Kan rotere 45° bilateralt?', en: 'Can rotate 45° bilaterally?' },
        procedure: {
          no: 'Aktiv cervikal rotasjon 45° til venstre og høyre.',
          en: 'Active cervical rotation 45° to left and right.'
        },
        positive: {
          no: 'Kan IKKE rotere 45° = Bildediagnostikk',
          en: 'CANNOT rotate 45° = Imaging needed'
        },
        sensitivity: 0.99,
        specificity: 0.45
      }
    ]
  },

  THORACIC_OUTLET: {
    id: 'THORACIC_OUTLET',
    name: { no: 'Thoracic Outlet Syndrom (TOS)', en: 'Thoracic Outlet Syndrome (TOS)' },
    region: 'CERVICAL',
    description: {
      no: 'Kompresjon av neurovaskulære strukturer - kombiner tester for bedre nøyaktighet',
      en: 'Compression of neurovascular structures - combine tests for better accuracy'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester styrker TOS diagnose (Adson alene har lav validitet)',
        en: '≥2 positive tests strengthen TOS diagnosis (Adson alone has low validity)'
      }
    },
    tests: [
      {
        id: 'adson',
        name: { no: "Adson's Test", en: "Adson's Test" },
        procedure: {
          no: 'Sittende, arm i lett abduksjon. Roter hodet mot affisert side, ekstender nakke, dyp inspirasjon. Palper radialispuls.',
          en: 'Seated, arm slightly abducted. Rotate head to affected side, extend neck, deep inspiration. Palpate radial pulse.'
        },
        positive: {
          no: 'Redusert/fraværende puls og/eller symptomreproduksjon',
          en: 'Diminished/absent pulse and/or symptom reproduction'
        },
        sensitivity: 0.79,
        specificity: 0.74,
        clinicalNote: {
          no: 'Mange falske positive - ikke bruk alene',
          en: 'Many false positives - do not use alone'
        }
      },
      {
        id: 'roos',
        name: { no: 'Roos Test (EAST)', en: 'Roos Test (EAST)' },
        procedure: {
          no: 'Sittende, skulder 90° abduksjon + utadrotasjon, albue 90°. Åpne og lukk hendene i 3 minutter.',
          en: 'Seated, shoulder 90° abduction + external rotation, elbow 90°. Open and close hands for 3 minutes.'
        },
        positive: {
          no: 'Symptomreproduksjon, tretthet, eller kan ikke fullføre',
          en: 'Symptom reproduction, fatigue, or unable to complete'
        },
        sensitivity: 0.84,
        specificity: 0.30
      },
      {
        id: 'wright',
        name: { no: "Wright's Test", en: "Wright's Test" },
        procedure: {
          no: 'Sittende, skulder 90° abduksjon + full utadrotasjon. Palper radialispuls.',
          en: 'Seated, shoulder 90° abduction + full external rotation. Palpate radial pulse.'
        },
        positive: {
          no: 'Redusert puls og/eller symptomreproduksjon',
          en: 'Diminished pulse and/or symptom reproduction'
        },
        sensitivity: 0.70,
        specificity: 0.53
      }
    ]
  },

  ARM_SQUEEZE: {
    id: 'ARM_SQUEEZE',
    name: { no: 'Arm Squeeze Test (DDx)', en: 'Arm Squeeze Test (DDx)' },
    region: 'CERVICAL',
    description: {
      no: 'Differensialdiagnose: Skulder vs. Nakke',
      en: 'Differential diagnosis: Shoulder vs. Neck'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 1,
      interpretation: {
        no: 'Smerte ved klem på overarm (men ikke skulderbevegelse) = cervikal radikulopati C5-T1',
        en: 'Pain with arm squeeze (but not shoulder movement) = cervical radiculopathy C5-T1'
      }
    },
    tests: [
      {
        id: 'arm_squeeze',
        name: { no: 'Arm Squeeze Test', en: 'Arm Squeeze Test' },
        procedure: {
          no: 'Klem på midtre del av overarmen bilateralt.',
          en: 'Squeeze middle portion of upper arm bilaterally.'
        },
        positive: {
          no: 'Smerte ved klem (sammenlign med skuldertester)',
          en: 'Pain with squeeze (compare with shoulder tests)'
        },
        sensitivity: 0.96,
        specificity: 0.91
      }
    ]
  },

  // ============================================================================
  // LUMBAR ADDITIONS (from Protocol v2.0)
  // ============================================================================

  LUMBAR_STENOSIS: {
    id: 'LUMBAR_STENOSIS',
    name: { no: "Spinal Stenose (Cook's Cluster)", en: "Spinal Stenosis (Cook's Cluster)" },
    region: 'LUMBAR',
    description: {
      no: 'Skille stenose fra diskusprolaps',
      en: 'Differentiate stenosis from disc herniation'
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 5,
      interpretation: {
        no: '4/5 positive = LR+ 4.6, Spesifisitet 98%',
        en: '4/5 positive = LR+ 4.6, Specificity 98%'
      }
    },
    tests: [
      {
        id: 'bilateral_symptoms',
        name: { no: 'Bilaterale symptomer', en: 'Bilateral Symptoms' },
        procedure: {
          no: 'Anamnese: Symptomer i begge ben?',
          en: 'History: Symptoms in both legs?'
        },
        positive: {
          no: 'Symptomer i begge underekstremiteter',
          en: 'Symptoms in both lower extremities'
        }
      },
      {
        id: 'leg_more_than_back',
        name: { no: 'Leggsmerter > Ryggsmerter', en: 'Leg Pain > Back Pain' },
        procedure: {
          no: 'Anamnese: Er leggsmerter verre enn ryggsmerter?',
          en: 'History: Is leg pain worse than back pain?'
        },
        positive: {
          no: 'Leggsmerter dominerer',
          en: 'Leg pain predominates'
        }
      },
      {
        id: 'pain_with_standing',
        name: { no: 'Smerte ved gange/ståing', en: 'Pain with Walking/Standing' },
        procedure: {
          no: 'Anamnese: Forverres symptomer ved gange eller lengre ståing?',
          en: 'History: Do symptoms worsen with walking or prolonged standing?'
        },
        positive: {
          no: 'Neurogen klaudikasjon ved belastning',
          en: 'Neurogenic claudication with loading'
        }
      },
      {
        id: 'relief_with_sitting',
        name: { no: 'Lindring ved sitting', en: 'Relief with Sitting' },
        procedure: {
          no: 'Anamnese: Lindres symptomer ved sitting (fleksjon)?',
          en: 'History: Do symptoms improve with sitting (flexion)?'
        },
        positive: {
          no: 'Fleksjon åpner spinalkanalen og gir lindring',
          en: 'Flexion opens spinal canal providing relief'
        }
      },
      {
        id: 'age_over_48',
        name: { no: 'Alder > 48 år', en: 'Age > 48 years' },
        procedure: {
          no: 'Pasientens alder.',
          en: "Patient's age."
        },
        positive: {
          no: 'Alder over 48 år',
          en: 'Age over 48 years'
        }
      }
    ]
  },

  LUMBAR_INSTABILITY: {
    id: 'LUMBAR_INSTABILITY',
    name: { no: 'Lumbal Instabilitet', en: 'Lumbar Instability' },
    region: 'LUMBAR',
    description: {
      no: 'Funksjonell vs. strukturell instabilitet',
      en: 'Functional vs. structural instability'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 2,
      interpretation: {
        no: 'PIT positiv = funksjonell instabilitet (respons på trening). Passiv ekstensjon = strukturell.',
        en: 'PIT positive = functional instability (responds to training). Passive extension = structural.'
      }
    },
    tests: [
      {
        id: 'prone_instability',
        name: { no: 'Prone Instability Test (PIT)', en: 'Prone Instability Test (PIT)' },
        procedure: {
          no: 'Mageliggende over bordkant. Trykk på smertefullt segment i hvile, deretter med løftede ben (muskelaktivering).',
          en: 'Prone over table edge. Press on painful segment at rest, then with legs lifted (muscle activation).'
        },
        positive: {
          no: 'Smerte i hvile som forsvinner med muskelaktivering',
          en: 'Pain at rest that disappears with muscle activation'
        },
        sensitivity: 0.72,
        specificity: 0.58,
        clinicalNote: {
          no: 'Indikerer funksjonell instabilitet - god respons på stabiliseringstrening',
          en: 'Indicates functional instability - good response to stabilization training'
        }
      },
      {
        id: 'passive_lumbar_extension',
        name: { no: 'Passiv Lumbal Ekstensjon', en: 'Passive Lumbar Extension' },
        procedure: {
          no: 'Mageliggende, løft begge ben passivt. Observer for smerte/sviktfølelse.',
          en: 'Prone, lift both legs passively. Observe for pain/giving way sensation.'
        },
        positive: {
          no: 'Smerte eller følelse av strukturell svikt',
          en: 'Pain or sensation of structural giving way'
        },
        clinicalNote: {
          no: 'Indikerer strukturell instabilitet',
          en: 'Indicates structural instability'
        }
      }
    ]
  },

  // ============================================================================
  // ANKLE ADDITIONS (from Protocol v2.0 + Additional Tests)
  // ============================================================================

  ANKLE_SYNDESMOSE: {
    id: 'ANKLE_SYNDESMOSE',
    name: { no: 'Syndesmose ("High Ankle Sprain")', en: 'Syndesmosis ("High Ankle Sprain")' },
    region: 'ANKLE_FOOT',
    description: {
      no: 'Skade på tibiofibulare ligamenter',
      en: 'Injury to tibiofibular ligaments'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester indikerer syndesmosskade',
        en: '≥2 positive tests indicate syndesmosis injury'
      }
    },
    tests: [
      {
        id: 'squeeze_test',
        name: { no: 'Squeeze Test', en: 'Squeeze Test' },
        procedure: {
          no: 'Komprimer tibia og fibula på midt-legg nivå.',
          en: 'Compress tibia and fibula at mid-calf level.'
        },
        positive: {
          no: 'Smerte distalt i syndesmosen',
          en: 'Pain distally in syndesmosis'
        },
        sensitivity: 0.30,
        specificity: 0.94
      },
      {
        id: 'kleiger',
        name: { no: "Kleiger's Test (External Rotation)", en: "Kleiger's Test (External Rotation)" },
        procedure: {
          no: 'Sittende, kne 90°, fot i nøytral. Utadroter foten mens tibia stabiliseres.',
          en: 'Seated, knee 90°, foot neutral. Externally rotate foot while stabilizing tibia.'
        },
        positive: {
          no: 'Smerte i syndesmosen',
          en: 'Pain in syndesmosis'
        },
        sensitivity: 0.71,
        specificity: 0.63
      },
      {
        id: 'cotton_test',
        name: { no: 'Cotton Test', en: 'Cotton Test' },
        procedure: {
          no: 'Stabiliser tibia, beveg talus lateralt.',
          en: 'Stabilize tibia, move talus laterally.'
        },
        positive: {
          no: 'Økt lateral bevegelse vs. kontralateral side',
          en: 'Increased lateral movement vs. contralateral side'
        },
        sensitivity: 0.64,
        specificity: 0.82
      }
    ]
  },

  TARSAL_TUNNEL: {
    id: 'TARSAL_TUNNEL',
    name: { no: 'Tarsal Tunnel Syndrom', en: 'Tarsal Tunnel Syndrome' },
    region: 'ANKLE_FOOT',
    description: {
      no: 'N. tibialis posterior kompresjon',
      en: 'Posterior tibial nerve compression'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester indikerer tarsal tunnel syndrom',
        en: '≥2 positive tests indicate tarsal tunnel syndrome'
      }
    },
    tests: [
      {
        id: 'tinel_foot',
        name: { no: "Tinel's Foot Sign", en: "Tinel's Foot Sign" },
        procedure: {
          no: 'Perkuter over n. tibialis posterior bak mediale malleol.',
          en: 'Tap over posterior tibial nerve behind medial malleolus.'
        },
        positive: {
          no: 'Tingling eller parestesi distalt',
          en: 'Tingling or paresthesia distally'
        },
        sensitivity: 0.58,
        specificity: 0.93
      },
      {
        id: 'dorsiflexion_eversion',
        name: { no: 'Dorsifleksjon-Eversjon', en: 'Dorsiflexion-Eversion' },
        procedure: {
          no: 'Maksimal dorsifleksjon + eversjon i 30 sekunder.',
          en: 'Maximum dorsiflexion + eversion for 30 seconds.'
        },
        positive: {
          no: 'Reproduksjon av symptomer',
          en: 'Reproduction of symptoms'
        },
        sensitivity: 0.81,
        specificity: 0.85
      },
      {
        id: 'tarsal_compression',
        name: { no: 'Tarsal Tunnel Kompresjon', en: 'Tarsal Tunnel Compression' },
        procedure: {
          no: 'Direkte press over tarsal tunnel i 30 sekunder.',
          en: 'Direct pressure over tarsal tunnel for 30 seconds.'
        },
        positive: {
          no: 'Parestesi i fotsåle',
          en: 'Paresthesia in sole of foot'
        },
        sensitivity: 0.86,
        specificity: 0.88
      }
    ]
  },

  METATARSAL_PATHOLOGY: {
    id: 'METATARSAL_PATHOLOGY',
    name: { no: 'Metatarsal Patologi', en: 'Metatarsal Pathology' },
    region: 'ANKLE_FOOT',
    description: {
      no: "Morton's neurom, metatarsalgi",
      en: "Morton's neuroma, metatarsalgia"
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive tester indikerer metatarsal patologi',
        en: '≥2 positive tests indicate metatarsal pathology'
      }
    },
    tests: [
      {
        id: 'morton_test',
        name: { no: "Morton's Test", en: "Morton's Test" },
        procedure: {
          no: 'Grip rundt metatarsalhodene og komprimer dem sammen.',
          en: 'Grasp around metatarsal heads and compress them together.'
        },
        positive: {
          no: 'Skarp smerte eller klikk (Mulder\'s click)',
          en: 'Sharp pain or click (Mulder\'s click)'
        },
        sensitivity: 0.62,
        specificity: 0.95
      },
      {
        id: 'strunsky',
        name: { no: "Strunsky's Sign", en: "Strunsky's Sign" },
        procedure: {
          no: 'Grip tærne og flekter dem passivt.',
          en: 'Grasp toes and flex them passively.'
        },
        positive: {
          no: 'Smerte eller verkende følelse',
          en: 'Pain or aching sensation'
        },
        sensitivity: 0.85,
        specificity: 0.70
      },
      {
        id: 'metatarsal_palpation',
        name: { no: 'Metatarsalhode Palpasjon', en: 'Metatarsal Head Palpation' },
        procedure: {
          no: 'Palper hvert metatarsalhode med vektbæring fremover.',
          en: 'Palpate each metatarsal head with weight bearing forward.'
        },
        positive: {
          no: 'Lokal ømhet',
          en: 'Local tenderness'
        },
        sensitivity: 0.90,
        specificity: 0.55
      }
    ]
  },

  VASCULAR_LOWER: {
    id: 'VASCULAR_LOWER',
    name: { no: 'Vaskulær Undersøkelse (Underekstremitet)', en: 'Vascular Assessment (Lower Extremity)' },
    region: 'ANKLE_FOOT',
    description: {
      no: 'Vaskulære problemer - trombose, arteriell okklusjon',
      en: 'Vascular problems - thrombosis, arterial occlusion'
    },
    redFlagCluster: true,
    diagnosticCriteria: {
      threshold: 1,
      total: 3,
      interpretation: {
        no: 'Positiv vaskulær test = umiddelbar medisinsk vurdering',
        en: 'Positive vascular test = immediate medical evaluation'
      }
    },
    tests: [
      {
        id: 'homan',
        name: { no: "Homan's Sign", en: "Homan's Sign" },
        procedure: {
          no: 'Ryggliggende, kne ekstendert. Løft ben 30-50°, dorsiflecter fot og klem leggmuskel.',
          en: 'Supine, knee extended. Elevate leg 30-50°, dorsiflex foot and squeeze calf.'
        },
        positive: {
          no: 'Dyp smerte i bakre legg',
          en: 'Deep pain in posterior leg'
        },
        sensitivity: 0.48,
        specificity: 0.41,
        redFlag: true,
        redFlagCondition: 'Possible deep vein thrombosis (DVT) - urgent referral',
        clinicalNote: {
          no: 'Lav spesifisitet - ikke bruk alene. Kombiner med klinisk vurdering.',
          en: 'Low specificity - do not use alone. Combine with clinical assessment.'
        }
      },
      {
        id: 'buerger',
        name: { no: "Buerger's Test", en: "Buerger's Test" },
        procedure: {
          no: 'Ryggliggende, løft strakt ben 45° i 3 minutter. Deretter sitt med ben hengende over bordkant.',
          en: 'Supine, raise straight leg 45° for 3 minutes. Then sit with legs hanging over table edge.'
        },
        positive: {
          no: 'Foten blekner og vener kollapser elevat ELLER rødcyanose og venetyngde tar 1-2 min',
          en: 'Foot blanches and veins collapse elevated OR reddish cyanosis and venous engorgement takes 1-2 min'
        },
        redFlag: true,
        redFlagCondition: 'Peripheral arterial disease - vascular referral'
      },
      {
        id: 'claudication_test',
        name: { no: 'Klaudikasjonstest', en: 'Claudication Test' },
        procedure: {
          no: 'Gå i 1 minutt med 2 skritt per sekund. Noter tid til symptomer.',
          en: 'Walk for 1 minute at 2 steps per second. Note time to symptoms.'
        },
        positive: {
          no: 'Verkende smerte eller fargeendring i huden',
          en: 'Aching pain or skin color change'
        },
        redFlag: true,
        redFlagCondition: 'Arterial occlusion - vascular evaluation needed'
      }
    ]
  },

  FOOT_STRUCTURAL: {
    id: 'FOOT_STRUCTURAL',
    name: { no: 'Fot Strukturelle Tester', en: 'Foot Structural Tests' },
    region: 'ANKLE_FOOT',
    description: {
      no: 'Pronasjon, frakturer, Achilles integritet',
      en: 'Pronation, fractures, Achilles integrity'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 4,
      interpretation: {
        no: 'Positiv test indikerer spesifikk patologi',
        en: 'Positive test indicates specific pathology'
      }
    },
    tests: [
      {
        id: 'helbing',
        name: { no: "Helbing's Sign", en: "Helbing's Sign" },
        procedure: {
          no: 'Observer Achillessenen bakfra ved belastning.',
          en: 'Observe Achilles tendon from behind with weight bearing.'
        },
        positive: {
          no: 'Medial bøyning av Achillessenen',
          en: 'Medial bowing of Achilles tendon'
        },
        clinicalNote: {
          no: 'Indikerer overdreven pronasjon (pes planus)',
          en: 'Indicates excessive pronation (pes planus)'
        }
      },
      {
        id: 'hoffa_foot',
        name: { no: "Hoffa's Test (Fot)", en: "Hoffa's Test (Foot)" },
        procedure: {
          no: 'Mageliggende med føtter over bordkant. Palper Achillessenen.',
          en: 'Prone with feet over table edge. Palpate Achilles tendon.'
        },
        positive: {
          no: 'Tap av integritet eller fot henger i dorsifleksjon vs. motsatt side',
          en: 'Loss of integrity or foot hangs in dorsiflexion vs. opposite side'
        },
        redFlag: true,
        redFlagCondition: 'Calcaneal fracture at Achilles insertion'
      },
      {
        id: 'keen',
        name: { no: "Keen's Sign", en: "Keen's Sign" },
        procedure: {
          no: 'Mål omkrets av legg ved malleolnivå bilateralt.',
          en: 'Measure calf circumference at malleolar level bilaterally.'
        },
        positive: {
          no: 'Økt omkrets på affisert side (uten åpenbar hevelse)',
          en: 'Increased circumference on affected side (without obvious swelling)'
        },
        redFlag: true,
        redFlagCondition: 'Suspect fibula fracture'
      },
      {
        id: 'duchenne',
        name: { no: "Duchenne's Test", en: "Duchenne's Test" },
        procedure: {
          no: 'Press på 1. metatarsalhode mens pasient plantarflekterer foten.',
          en: 'Press on 1st metatarsal head while patient plantar flexes foot.'
        },
        positive: {
          no: 'Mediale fot går i dorsifleksjon mens lateral er i plantarfleksjon',
          en: 'Medial foot goes into dorsiflexion while lateral is in plantar flexion'
        },
        clinicalNote: {
          no: 'Superficial peroneal nerve entrapment - ofte ved midt-legg',
          en: 'Superficial peroneal nerve entrapment - often at mid-calf'
        }
      }
    ]
  },

  // ============================================================================
  // KNEE ADDITIONS
  // ============================================================================

  KNEE_OTTAWA: {
    id: 'KNEE_OTTAWA',
    name: { no: 'Ottawa Knee Rules', en: 'Ottawa Knee Rules' },
    region: 'KNEE',
    description: {
      no: 'Røntgenindikasjon etter akutt knetraume',
      en: 'X-ray indication after acute knee trauma'
    },
    redFlagCluster: true,
    diagnosticCriteria: {
      threshold: 1,
      total: 4,
      interpretation: {
        no: 'En eller flere positive = Røntgen indisert',
        en: 'One or more positive = X-ray indicated'
      }
    },
    tests: [
      {
        id: 'age_55_plus',
        name: { no: 'Alder ≥ 55 år', en: 'Age ≥ 55 years' },
        procedure: { no: 'Pasientens alder.', en: "Patient's age." },
        positive: { no: 'Alder 55 eller eldre', en: 'Age 55 or older' },
        redFlag: true
      },
      {
        id: 'patella_tenderness',
        name: { no: 'Isolert Patella Ømhet', en: 'Isolated Patella Tenderness' },
        procedure: {
          no: 'Palper patella - isolert ømhet uten annen ømhet.',
          en: 'Palpate patella - isolated tenderness without other tenderness.'
        },
        positive: { no: 'Isolert ømhet på patella', en: 'Isolated patella tenderness' },
        redFlag: true
      },
      {
        id: 'fibula_head_tenderness',
        name: { no: 'Fibulahode Ømhet', en: 'Fibula Head Tenderness' },
        procedure: {
          no: 'Palper fibulahodet.',
          en: 'Palpate fibula head.'
        },
        positive: { no: 'Ømhet over fibulahodet', en: 'Tenderness over fibula head' },
        redFlag: true
      },
      {
        id: 'unable_flex_90',
        name: { no: 'Kan ikke flektere 90°', en: 'Unable to flex 90°' },
        procedure: {
          no: 'Be pasient flektere kne til 90°.',
          en: 'Ask patient to flex knee to 90°.'
        },
        positive: { no: 'Kan ikke oppnå 90° fleksjon', en: 'Cannot achieve 90° flexion' },
        redFlag: true
      },
      {
        id: 'unable_bear_weight',
        name: { no: 'Kan ikke belaste', en: 'Unable to Bear Weight' },
        procedure: {
          no: 'Be pasient ta 4 skritt (rett etter skade og nå).',
          en: 'Ask patient to take 4 steps (immediately after injury and now).'
        },
        positive: { no: 'Kunne ikke ta 4 skritt', en: 'Unable to take 4 steps' },
        redFlag: true
      }
    ]
  },

  KNEE_ADDITIONAL: {
    id: 'KNEE_ADDITIONAL',
    name: { no: 'Kne Tilleggstester', en: 'Knee Additional Tests' },
    region: 'KNEE',
    description: {
      no: 'Supplerende knetester',
      en: 'Supplementary knee tests'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 3,
      interpretation: {
        no: 'Positiv test indikerer spesifikk patologi',
        en: 'Positive test indicates specific pathology'
      }
    },
    tests: [
      {
        id: 'lever_sign',
        name: { no: "Lever Sign (Lelli's)", en: "Lever Sign (Lelli's)" },
        procedure: {
          no: 'Ryggliggende. Plasser knyttneve under proksimale legg og press ned på distale lår.',
          en: 'Supine. Place fist under proximal calf and press down on distal thigh.'
        },
        positive: {
          no: 'Hælen løfter seg IKKE fra bordet (ACL ruptur)',
          en: 'Heel does NOT lift from table (ACL rupture)'
        },
        sensitivity: 0.94,
        specificity: 0.97,
        clinicalNote: {
          no: 'Nyere test med høy nøyaktighet for ACL',
          en: 'Newer test with high accuracy for ACL'
        }
      },
      {
        id: 'dreyer',
        name: { no: "Dreyer's Sign", en: "Dreyer's Sign" },
        procedure: {
          no: 'Pasient kan ikke løfte benet. Grip over patella og komprimer quadriceps. Be pasient løfte benet.',
          en: 'Patient cannot raise leg. Grip above patella and compress quadriceps. Ask patient to raise leg.'
        },
        positive: {
          no: 'Evne til å løfte benet indikerer mulig patellafraktur',
          en: 'Ability to raise leg indicates possible patellar fracture'
        },
        redFlag: true,
        redFlagCondition: 'Possible patellar fracture'
      },
      {
        id: 'bounce_home',
        name: { no: 'Bounce Home Test', en: 'Bounce Home Test' },
        procedure: {
          no: 'Ryggliggende med kne flektert. Hold hælen og la benet falle til ekstensjon.',
          en: 'Supine with knee flexed. Hold heel and let leg drop to extension.'
        },
        positive: {
          no: 'Ufullstendig ekstensjon eller gummiert endefølelse',
          en: 'Incomplete extension or rubbery end feel'
        },
        clinicalNote: {
          no: 'Indikerer meniskskade eller intraartikulær patologi',
          en: 'Indicates meniscal injury or intra-articular pathology'
        }
      }
    ]
  },

  // ============================================================================
  // HIP ADDITIONS
  // ============================================================================

  HIP_STRESS_FRACTURE: {
    id: 'HIP_STRESS_FRACTURE',
    name: { no: 'Stressfraktur (Femur/Lårhals)', en: 'Stress Fracture (Femur/Femoral Neck)' },
    region: 'HIP',
    description: {
      no: 'Stressfraktur hos idrettsutøvere',
      en: 'Stress fracture in athletes'
    },
    redFlagCluster: true,
    diagnosticCriteria: {
      threshold: 1,
      total: 2,
      interpretation: {
        no: 'Positiv test = MR anbefalt for bekreftelse',
        en: 'Positive test = MRI recommended for confirmation'
      }
    },
    tests: [
      {
        id: 'fulcrum',
        name: { no: 'Fulcrum Test', en: 'Fulcrum Test' },
        procedure: {
          no: 'Sittende. Plasser underarm under låret som vektstang og press ned på kneet.',
          en: 'Seated. Place forearm under thigh as fulcrum and press down on knee.'
        },
        positive: {
          no: 'Skarp smerte i lår/hofte',
          en: 'Sharp pain in thigh/hip'
        },
        sensitivity: 0.93,
        specificity: 0.75,
        redFlag: true,
        redFlagCondition: 'Suspect femoral stress fracture - restrict activity, order MRI'
      },
      {
        id: 'hop_test_stress',
        name: { no: 'Single Leg Hop (Stress)', en: 'Single Leg Hop (Stress)' },
        procedure: {
          no: 'Hopp på ett ben 10 ganger.',
          en: 'Hop on one leg 10 times.'
        },
        positive: {
          no: 'Smerte i hofte/lår som forverres ved hopping',
          en: 'Pain in hip/thigh that worsens with hopping'
        },
        redFlag: true
      }
    ]
  },

  // ============================================================================
  // WRIST ADDITIONS
  // ============================================================================

  CTS_CPR: {
    id: 'CTS_CPR',
    name: { no: "Karpaltunnel CPR (Wainner)", en: "Carpal Tunnel CPR (Wainner)" },
    region: 'WRIST_HAND',
    description: {
      no: 'Klinisk prediksjon for karpaltunnel - mer presist enn enkelt tester',
      en: 'Clinical prediction for carpal tunnel - more accurate than single tests'
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 5,
      interpretation: {
        no: '4/5 positive = høy sannsynlighet CTS. 5/5 = LR+ 18.3',
        en: '4/5 positive = high probability CTS. 5/5 = LR+ 18.3'
      }
    },
    tests: [
      {
        id: 'flick_sign',
        name: { no: 'Flick Sign', en: 'Flick Sign' },
        procedure: {
          no: 'Anamnese: Rister du hendene for å få lindring om natten?',
          en: 'History: Do you shake your hands for relief at night?'
        },
        positive: {
          no: 'Risting av hendene gir lindring',
          en: 'Shaking hands provides relief'
        },
        sensitivity: 0.93,
        specificity: 0.96
      },
      {
        id: 'wrist_ratio',
        name: { no: 'Wrist-Ratio Index > 0.67', en: 'Wrist-Ratio Index > 0.67' },
        procedure: {
          no: 'Mål håndleddets dybde/bredde. Dybde ÷ Bredde > 0.67',
          en: 'Measure wrist depth/width. Depth ÷ Width > 0.67'
        },
        positive: {
          no: 'Ratio over 0.67 (tykt/smalt håndledd)',
          en: 'Ratio above 0.67 (thick/narrow wrist)'
        }
      },
      {
        id: 'sss_score',
        name: { no: 'Symptom Severity Score > 1.9', en: 'Symptom Severity Score > 1.9' },
        procedure: {
          no: 'Bruk Boston Carpal Tunnel Questionnaire.',
          en: 'Use Boston Carpal Tunnel Questionnaire.'
        },
        positive: {
          no: 'Score over 1.9',
          en: 'Score above 1.9'
        }
      },
      {
        id: 'thumb_sensation',
        name: { no: 'Redusert Tommelfølelse', en: 'Reduced Thumb Sensation' },
        procedure: {
          no: 'Test lett berøring på tommelens palmarside.',
          en: 'Test light touch on palmar aspect of thumb.'
        },
        positive: {
          no: 'Redusert sensibilitet vs. 5. finger',
          en: 'Reduced sensation vs. 5th finger'
        }
      },
      {
        id: 'age_over_45',
        name: { no: 'Alder > 45 år', en: 'Age > 45 years' },
        procedure: { no: 'Pasientens alder.', en: "Patient's age." },
        positive: { no: 'Alder over 45 år', en: 'Age over 45 years' }
      }
    ]
  },

  SL_INSTABILITY: {
    id: 'SL_INSTABILITY',
    name: { no: 'Scapholunær Instabilitet', en: 'Scapholunate Instability' },
    region: 'WRIST_HAND',
    description: {
      no: 'SL ligamentskade',
      en: 'SL ligament injury'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 2,
      interpretation: {
        no: 'Watson positiv = SL instabilitet (sammenlign med frisk side)',
        en: 'Watson positive = SL instability (compare with unaffected side)'
      }
    },
    tests: [
      {
        id: 'watson',
        name: { no: 'Watson Scaphoid Shift Test', en: 'Watson Scaphoid Shift Test' },
        procedure: {
          no: 'Press på scaphoid tuberkel mens håndleddet beveger seg fra ulnar til radial deviasjon.',
          en: 'Press on scaphoid tubercle while wrist moves from ulnar to radial deviation.'
        },
        positive: {
          no: 'Smerte, klikk eller subluksasjon av scaphoid',
          en: 'Pain, click or subluxation of scaphoid'
        },
        sensitivity: 0.69,
        specificity: 0.66,
        clinicalNote: {
          no: 'Moderat verdi - sammenlign alltid med frisk side. LR- 0.25 for å utelukke.',
          en: 'Moderate value - always compare with unaffected side. LR- 0.25 to rule out.'
        }
      },
      {
        id: 'sl_palpation',
        name: { no: 'SL Intervall Palpasjon', en: 'SL Interval Palpation' },
        procedure: {
          no: 'Palper SL intervallet dorsalt (ca 1 cm distalt for Lister\'s tuberkel).',
          en: 'Palpate SL interval dorsally (approx 1 cm distal to Lister\'s tubercle).'
        },
        positive: {
          no: 'Lokal ømhet',
          en: 'Local tenderness'
        },
        sensitivity: 0.82,
        specificity: 0.55
      }
    ]
  },

  // ============================================================================
  // FUNCTIONAL TESTING (from Protocol v2.0)
  // ============================================================================

  FUNCTIONAL_LOWER: {
    id: 'FUNCTIONAL_LOWER',
    name: { no: 'Funksjonell Testing (Underekstremitet)', en: 'Functional Testing (Lower Extremity)' },
    region: 'FUNCTIONAL',
    description: {
      no: 'Return to Sport tester - LSI > 90% er målet',
      en: 'Return to Sport tests - LSI > 90% is the goal'
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 5,
      interpretation: {
        no: 'LSI > 90% på alle tester = klar for idrett',
        en: 'LSI > 90% on all tests = ready for sport'
      }
    },
    tests: [
      {
        id: 'single_leg_hop',
        name: { no: 'Single Leg Hop', en: 'Single Leg Hop' },
        procedure: {
          no: 'Hopp så langt som mulig på ett ben. Mål distanse. Beregn LSI (affisert/frisk × 100).',
          en: 'Hop as far as possible on one leg. Measure distance. Calculate LSI (affected/unaffected × 100).'
        },
        positive: {
          no: 'LSI < 90%',
          en: 'LSI < 90%'
        }
      },
      {
        id: 'triple_hop',
        name: { no: 'Triple Hop', en: 'Triple Hop' },
        procedure: {
          no: '3 påfølgende hopp på ett ben. Mål total distanse.',
          en: '3 consecutive hops on one leg. Measure total distance.'
        },
        positive: {
          no: 'LSI < 90%',
          en: 'LSI < 90%'
        }
      },
      {
        id: 'crossover_hop',
        name: { no: 'Crossover Hop', en: 'Crossover Hop' },
        procedure: {
          no: '3 hopp over en linje (sideveis).',
          en: '3 hops crossing a line (laterally).'
        },
        positive: {
          no: 'LSI < 90%',
          en: 'LSI < 90%'
        }
      },
      {
        id: 'timed_hop_6m',
        name: { no: '6m Timed Hop', en: '6m Timed Hop' },
        procedure: {
          no: 'Hopp 6 meter på ett ben så raskt som mulig. Mål tid.',
          en: 'Hop 6 meters on one leg as fast as possible. Measure time.'
        },
        positive: {
          no: 'LSI < 90%',
          en: 'LSI < 90%'
        }
      },
      {
        id: 'step_down',
        name: { no: 'Step Down Test', en: 'Step Down Test' },
        procedure: {
          no: 'Stå på 20cm trinn. Senk deg ned på ett ben til motsatt hæl berører gulvet. Observer knekontroll.',
          en: 'Stand on 20cm step. Lower on one leg until opposite heel touches floor. Observe knee control.'
        },
        positive: {
          no: 'Valguskollaps, bekkendropp, eller dårlig kontroll',
          en: 'Valgus collapse, pelvic drop, or poor control'
        },
        clinicalNote: {
          no: 'Kvalitativ vurdering av knekontroll og bekkenstabilitet',
          en: 'Qualitative assessment of knee control and pelvic stability'
        }
      }
    ]
  },

  FUNCTIONAL_UPPER: {
    id: 'FUNCTIONAL_UPPER',
    name: { no: 'Funksjonell Testing (Overekstremitet)', en: 'Functional Testing (Upper Extremity)' },
    region: 'FUNCTIONAL',
    description: {
      no: 'Return to Sport tester for skulder/arm',
      en: 'Return to Sport tests for shoulder/arm'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 2,
      interpretation: {
        no: 'Begge tester normale = klar for idrett',
        en: 'Both tests normal = ready for sport'
      }
    },
    tests: [
      {
        id: 'ckcuest',
        name: { no: 'CKCUEST', en: 'CKCUEST' },
        procedure: {
          no: 'Push-up posisjon. Touch motsatt hånd alternerende i 15 sek. Tell touches.',
          en: 'Push-up position. Touch opposite hand alternating for 15 sec. Count touches.'
        },
        positive: {
          no: '< 21 touches (menn) eller < 18 touches (kvinner)',
          en: '< 21 touches (men) or < 18 touches (women)'
        },
        clinicalNote: {
          no: 'Måler stabilitet og utholdenhet',
          en: 'Measures stability and endurance'
        }
      },
      {
        id: 'seated_shot_put',
        name: { no: 'Seated Shot Put', en: 'Seated Shot Put' },
        procedure: {
          no: 'Sittende, kast 3kg medisinball unilateralt. Mål distanse.',
          en: 'Seated, throw 3kg medicine ball unilaterally. Measure distance.'
        },
        positive: {
          no: 'LSI < 90% vs. frisk side',
          en: 'LSI < 90% vs. unaffected side'
        },
        clinicalNote: {
          no: 'Måler eksplosiv kraft',
          en: 'Measures explosive power'
        }
      }
    ]
  },

  // ============================================================================
  // HEADACHE RED FLAGS (SNOOP)
  // ============================================================================

  HEADACHE_SNOOP: {
    id: 'HEADACHE_SNOOP',
    name: { no: 'Hodepine Røde Flagg (SNOOP)', en: 'Headache Red Flags (SNOOP)' },
    region: 'NEUROLOGICAL',
    description: {
      no: 'Indikasjon for bildediagnostikk ved hodepine',
      en: 'Indication for imaging in headache'
    },
    redFlagCluster: true,
    urgency: 'URGENT',
    diagnosticCriteria: {
      threshold: 1,
      total: 5,
      interpretation: {
        no: 'En eller flere positive = bildediagnostikk/henvisning',
        en: 'One or more positive = imaging/referral'
      }
    },
    tests: [
      {
        id: 'systemic',
        name: { no: 'Systemiske symptomer', en: 'Systemic Symptoms' },
        procedure: {
          no: 'Anamnese: Feber, vekttap, malaise?',
          en: 'History: Fever, weight loss, malaise?'
        },
        positive: {
          no: 'Tilstedeværelse av systemiske symptomer',
          en: 'Presence of systemic symptoms'
        },
        redFlag: true
      },
      {
        id: 'neurologic',
        name: { no: 'Nevrologiske tegn', en: 'Neurologic Signs' },
        procedure: {
          no: 'Forvirring, bevissthetstap, fokale utfall?',
          en: 'Confusion, loss of consciousness, focal deficits?'
        },
        positive: {
          no: 'Tilstedeværelse av nevrologiske tegn',
          en: 'Presence of neurologic signs'
        },
        redFlag: true
      },
      {
        id: 'onset_sudden',
        name: { no: 'Plutselig innsettende', en: 'Sudden Onset' },
        procedure: {
          no: '"Tordenskrall" hodepine - verste hodepine i livet som når max på sekunder.',
          en: '"Thunderclap" headache - worst headache of life reaching max in seconds.'
        },
        positive: {
          no: 'Plutselig, voldsom hodepine',
          en: 'Sudden, severe headache'
        },
        redFlag: true,
        redFlagCondition: 'Possible subarachnoid hemorrhage - EMERGENCY'
      },
      {
        id: 'older_age',
        name: { no: 'Ny hodepine > 50 år', en: 'New headache > 50 years' },
        procedure: {
          no: 'Ny type hodepine hos pasient over 50 år.',
          en: 'New type headache in patient over 50 years.'
        },
        positive: {
          no: 'Første hodepine av denne typen etter 50 år',
          en: 'First headache of this type after 50 years'
        },
        redFlag: true
      },
      {
        id: 'pattern_change',
        name: { no: 'Endret mønster', en: 'Pattern Change' },
        procedure: {
          no: 'Progressivt forverrende eller endret karakter av kjent hodepine.',
          en: 'Progressively worsening or changed character of known headache.'
        },
        positive: {
          no: 'Endret karakter eller progressiv forverring',
          en: 'Changed character or progressive worsening'
        },
        redFlag: true
      }
    ]
  },

  // ============================================================================
  // RED FLAG CLUSTERS
  // ============================================================================

  CAUDA_EQUINA: {
    id: 'CAUDA_EQUINA',
    name: { no: 'Cauda Equina Syndrom', en: 'Cauda Equina Syndrome' },
    region: 'LUMBAR',
    description: {
      no: 'Akutt nevrologisk nødsituasjon',
      en: 'Acute neurological emergency'
    },
    redFlagCluster: true,
    urgency: 'IMMEDIATE',
    diagnosticCriteria: {
      threshold: 2,
      total: 5,
      interpretation: {
        no: '≥2 positive tegn = AKUTT HENVISNING',
        en: '≥2 positive signs = IMMEDIATE REFERRAL'
      }
    },
    tests: [
      {
        id: 'saddle_anesthesia',
        name: { no: 'Sadel Anestesi', en: 'Saddle Anesthesia' },
        procedure: {
          no: 'Test sensibilitet i perineum/perianal område.',
          en: 'Test sensation in perineum/perianal area.'
        },
        positive: {
          no: 'Redusert/absent sensibilitet',
          en: 'Decreased/absent sensation'
        },
        redFlag: true
      },
      {
        id: 'bladder_dysfunction',
        name: { no: 'Blæredysfunksjon', en: 'Bladder Dysfunction' },
        procedure: {
          no: 'Anamnese om urinretensjon eller inkontinens.',
          en: 'History of urinary retention or incontinence.'
        },
        positive: {
          no: 'Retensjon, inkontinens, eller redusert følelse',
          en: 'Retention, incontinence, or decreased sensation'
        },
        redFlag: true
      },
      {
        id: 'bowel_dysfunction',
        name: { no: 'Tarm Dysfunksjon', en: 'Bowel Dysfunction' },
        procedure: {
          no: 'Anamnese om fekal inkontinens eller forstoppelse.',
          en: 'History of fecal incontinence or constipation.'
        },
        positive: {
          no: 'Inkontinens eller nyoppstått alvorlig forstoppelse',
          en: 'Incontinence or new severe constipation'
        },
        redFlag: true
      },
      {
        id: 'bilateral_leg_symptoms',
        name: { no: 'Bilaterale Bensymptomer', en: 'Bilateral Leg Symptoms' },
        procedure: {
          no: 'Vurder symptomer i begge ben.',
          en: 'Assess symptoms in both legs.'
        },
        positive: {
          no: 'Bilateral smerte, svakhet, eller nummenhet',
          en: 'Bilateral pain, weakness, or numbness'
        },
        redFlag: true
      },
      {
        id: 'progressive_weakness',
        name: { no: 'Progressiv Svakhet', en: 'Progressive Weakness' },
        procedure: {
          no: 'Vurder om motorisk svakhet er tiltagende.',
          en: 'Assess if motor weakness is progressing.'
        },
        positive: {
          no: 'Raskt progredierende svakhet i ben',
          en: 'Rapidly progressing weakness in legs'
        },
        redFlag: true
      }
    ]
  },

  // ============================================================================
  // VBI / STROKE SCREENING (from textbook Head & Neck section)
  // ============================================================================

  VBI_STROKE: {
    id: 'VBI_STROKE',
    name: { no: 'VBI / Slag Screening (5Ds & 3Ns)', en: 'VBI / Stroke Screening (5Ds & 3Ns)' },
    region: 'CERVICAL',
    description: {
      no: 'Vertebrobasilær insuffisiens screening - 5 Ds og 3 Ns',
      en: 'Vertebrobasilar insufficiency screening - 5 Ds and 3 Ns'
    },
    redFlagCluster: true,
    urgency: 'IMMEDIATE',
    diagnosticCriteria: {
      threshold: 2,
      total: 8,
      interpretation: {
        no: '≥2 positive tegn = AKUTT HENVISNING til legevakt/sykehus',
        en: '≥2 positive signs = IMMEDIATE REFERRAL to emergency'
      }
    },
    tests: [
      {
        id: 'dizziness',
        name: { no: 'Dizziness/Vertigo', en: 'Dizziness/Vertigo' },
        procedure: {
          no: 'Spør om svimmelhet, vertigo eller ustøhet.',
          en: 'Ask about dizziness, vertigo or unsteadiness.'
        },
        positive: {
          no: 'Nyoppstått svimmelhet eller vertigo',
          en: 'New onset dizziness or vertigo'
        },
        redFlag: true
      },
      {
        id: 'drop_attacks',
        name: { no: 'Drop Attacks', en: 'Drop Attacks' },
        procedure: {
          no: 'Spør om plutselige fall eller tap av bevissthet.',
          en: 'Ask about sudden falls or loss of consciousness.'
        },
        positive: {
          no: 'Synkope eller plutselig bensvakhet',
          en: 'Syncope or sudden leg weakness'
        },
        redFlag: true
      },
      {
        id: 'diplopia',
        name: { no: 'Diplopi', en: 'Diplopia' },
        procedure: {
          no: 'Spør om dobbeltsyn eller synsforstyrrelser.',
          en: 'Ask about double vision or visual disturbances.'
        },
        positive: {
          no: 'Dobbeltsyn, tåkesyn eller lysglimt',
          en: 'Double vision, foggy vision or light flashes'
        },
        redFlag: true
      },
      {
        id: 'dysarthria',
        name: { no: 'Dysartri', en: 'Dysarthria' },
        procedure: {
          no: 'Vurder taleevne og artikulasjon.',
          en: 'Assess speech ability and articulation.'
        },
        positive: {
          no: 'Utydelig tale eller vanskeligheter med artikulasjon',
          en: 'Slurred speech or difficulty with articulation'
        },
        redFlag: true
      },
      {
        id: 'dysphagia',
        name: { no: 'Dysfagi', en: 'Dysphagia' },
        procedure: {
          no: 'Spør om svelgevansker eller heshet.',
          en: 'Ask about swallowing difficulties or hoarseness.'
        },
        positive: {
          no: 'Svelgevansker eller heshet',
          en: 'Swallowing difficulties or hoarseness'
        },
        redFlag: true
      },
      {
        id: 'ataxia',
        name: { no: 'Ataksi', en: 'Ataxia' },
        procedure: {
          no: 'Vurder koordinasjon og gangfunksjon (Romberg, fingernesetest).',
          en: 'Assess coordination and gait (Romberg, finger-nose test).'
        },
        positive: {
          no: 'Ustø gange, dårlig koordinasjon',
          en: 'Unsteady gait, poor coordination'
        },
        redFlag: true
      },
      {
        id: 'nausea_vbi',
        name: { no: 'Kvalme/Oppkast', en: 'Nausea/Vomiting' },
        procedure: {
          no: 'Spør om kvalme eller oppkast relatert til posisjonsendring.',
          en: 'Ask about nausea or vomiting related to position change.'
        },
        positive: {
          no: 'Kvalme eller oppkast med hodebevegelse',
          en: 'Nausea or vomiting with head movement'
        },
        redFlag: true
      },
      {
        id: 'numbness_facial',
        name: { no: 'Ansikts Nummenhet', en: 'Facial Numbness' },
        procedure: {
          no: 'Test sensibilitet i ansikt unilateralt.',
          en: 'Test facial sensation unilaterally.'
        },
        positive: {
          no: 'Ensidig nummenhet eller parestesier i ansikt',
          en: 'Unilateral numbness or paresthesias in face'
        },
        redFlag: true
      },
      {
        id: 'nystagmus',
        name: { no: 'Nystagmus', en: 'Nystagmus' },
        procedure: {
          no: 'Observer øyebevegelser ved blikkfølging.',
          en: 'Observe eye movements during gaze tracking.'
        },
        positive: {
          no: 'Spontan nystagmus eller vertikal nystagmus',
          en: 'Spontaneous nystagmus or vertical nystagmus'
        },
        redFlag: true
      }
    ]
  },

  // ============================================================================
  // TMJ DYSFUNCTION (from textbook TMJ Syndrome section)
  // ============================================================================

  TMJ_DYSFUNCTION: {
    id: 'TMJ_DYSFUNCTION',
    name: { no: 'TMJ Dysfunksjon', en: 'TMJ Dysfunction' },
    region: 'CERVICAL',
    description: {
      no: 'Temporomandibulær leddsdysfunksjon',
      en: 'Temporomandibular joint dysfunction'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive tester indikerer TMJ dysfunksjon',
        en: '≥3 positive tests indicate TMJ dysfunction'
      }
    },
    tests: [
      {
        id: 'three_knuckle',
        name: { no: '3-Knoke Test', en: '3-Knuckle Test' },
        procedure: {
          no: 'Pasient forsøker å sette 3 knoker mellom tennene. Normal åpning ~40mm.',
          en: 'Patient attempts to place 3 knuckles between teeth. Normal opening ~40mm.'
        },
        positive: {
          no: 'Redusert åpning (<40mm eller <3 knoker)',
          en: 'Reduced opening (<40mm or <3 knuckles)'
        },
        sensitivity: 0.85,
        specificity: 0.72
      },
      {
        id: 'tmj_palpation',
        name: { no: 'TMJ Palpasjon', en: 'TMJ Palpation' },
        procedure: {
          no: 'Palper TMJ lateralt og via ekstern gehørgang under åpning/lukking.',
          en: 'Palpate TMJ laterally and via external auditory meatus during opening/closing.'
        },
        positive: {
          no: 'Ømhet ved palpasjon',
          en: 'Tenderness on palpation'
        },
        sensitivity: 0.80,
        specificity: 0.65
      },
      {
        id: 'tmj_sounds',
        name: { no: 'TMJ Lyder', en: 'TMJ Sounds' },
        procedure: {
          no: 'Auskultasjon/palpasjon av TMJ under åpning/lukking.',
          en: 'Auscultation/palpation of TMJ during opening/closing.'
        },
        positive: {
          no: 'Klikking, knasing eller krepitasjon',
          en: 'Clicking, grinding or crepitation'
        },
        sensitivity: 0.75,
        specificity: 0.70
      },
      {
        id: 'jaw_deviation',
        name: { no: 'Kjeve Deviasjon', en: 'Jaw Deviation' },
        procedure: {
          no: 'Observer mandibulær bevegelse under åpning.',
          en: 'Observe mandibular movement during opening.'
        },
        positive: {
          no: 'Lateral deviasjon ved åpning',
          en: 'Lateral deviation on opening'
        },
        sensitivity: 0.68,
        specificity: 0.82
      },
      {
        id: 'masseter_palpation',
        name: { no: 'Masseter Palpasjon', en: 'Masseter Palpation' },
        procedure: {
          no: 'Palper masseter og temporalis muskler.',
          en: 'Palpate masseter and temporalis muscles.'
        },
        positive: {
          no: 'Ømhet, triggerpunkter eller hypertoni',
          en: 'Tenderness, trigger points or hypertonicity'
        },
        sensitivity: 0.88,
        specificity: 0.55
      },
      {
        id: 'pterygoid_palpation',
        name: { no: 'Pterygoid Palpasjon (Intraoral)', en: 'Pterygoid Palpation (Intraoral)' },
        procedure: {
          no: 'Intraoral palpasjon av medial pterygoid.',
          en: 'Intraoral palpation of medial pterygoid.'
        },
        positive: {
          no: 'Ømhet eller myospasme',
          en: 'Tenderness or myospasm'
        },
        sensitivity: 0.78,
        specificity: 0.75
      }
    ]
  },

  // ============================================================================
  // BPPV / VESTIBULAR (from textbook BPV section)
  // ============================================================================

  BPPV_VESTIBULAR: {
    id: 'BPPV_VESTIBULAR',
    name: { no: 'BPPV / Vestibulær Dysfunksjon', en: 'BPPV / Vestibular Dysfunction' },
    region: 'CERVICAL',
    description: {
      no: 'Benign paroksysmal posisjonsvertigo og vestibulær testing',
      en: 'Benign paroxysmal positional vertigo and vestibular testing'
    },
    diagnosticCriteria: {
      threshold: 1,
      total: 4,
      interpretation: {
        no: 'Positiv Dix-Hallpike = BPPV diagnose. Behandle med Epley/Semont.',
        en: 'Positive Dix-Hallpike = BPPV diagnosis. Treat with Epley/Semont.'
      }
    },
    tests: [
      {
        id: 'dix_hallpike',
        name: { no: 'Dix-Hallpike Manøver', en: 'Dix-Hallpike Maneuver' },
        procedure: {
          no: 'Sittende pasient. Roter hode 45° til siden. Legg raskt tilbake med hodet under horisontalen. Hold 30 sek. Observer øyne for nystagmus.',
          en: 'Seated patient. Rotate head 45° to side. Quickly lower to supine with head below horizontal. Hold 30 sec. Observe eyes for nystagmus.'
        },
        positive: {
          no: 'Rotatorisk nystagmus med latens (2-40 sek), utmattbar. Vertigo.',
          en: 'Rotatory nystagmus with latency (2-40 sec), fatigable. Vertigo.'
        },
        sensitivity: 0.79,
        specificity: 0.75,
        clinicalNote: {
          no: 'Nystagmus mot affisert side. Behandle med Epley eller Semont manøver.',
          en: 'Nystagmus toward affected side. Treat with Epley or Semont maneuver.'
        }
      },
      {
        id: 'head_impulse',
        name: { no: 'Head Impulse Test (HIT)', en: 'Head Impulse Test (HIT)' },
        procedure: {
          no: 'Pasient fikserer på din nese. Raske, små hode-rotasjoner. Observer for korrigerende sakkader.',
          en: 'Patient fixates on your nose. Quick, small head rotations. Observe for corrective saccades.'
        },
        positive: {
          no: 'Korrigerende sakkade etter hodebevegelse = perifer vestibulær lesjon',
          en: 'Corrective saccade after head movement = peripheral vestibular lesion'
        },
        sensitivity: 0.84,
        specificity: 0.82,
        clinicalNote: {
          no: 'Del av HINTS protokoll. Normal HIT + spontan nystagmus = sentral årsak.',
          en: 'Part of HINTS protocol. Normal HIT + spontaneous nystagmus = central cause.'
        }
      },
      {
        id: 'romberg',
        name: { no: 'Romberg Test', en: 'Romberg Test' },
        procedure: {
          no: 'Stående med føttene sammen, armer krysset. Øyne lukket i 30 sek.',
          en: 'Standing with feet together, arms crossed. Eyes closed for 30 sec.'
        },
        positive: {
          no: 'Tap av balanse eller svaing med lukkede øyne',
          en: 'Loss of balance or sway with eyes closed'
        },
        sensitivity: 0.68,
        specificity: 0.70
      },
      {
        id: 'unterberger',
        name: { no: 'Unterberger/Fukuda Test', en: 'Unterberger/Fukuda Test' },
        procedure: {
          no: 'March på stedet med lukkede øyne, 50 steg. Observer rotasjon.',
          en: 'March in place with eyes closed, 50 steps. Observe rotation.'
        },
        positive: {
          no: 'Rotasjon >45° til en side indikerer vestibulær hypofunction',
          en: 'Rotation >45° to one side indicates vestibular hypofunction'
        },
        sensitivity: 0.63,
        specificity: 0.75
      }
    ]
  },

  // ============================================================================
  // CONCUSSION SCREENING (from textbook Concussion section)
  // ============================================================================

  CONCUSSION: {
    id: 'CONCUSSION',
    name: { no: 'Hjernerystelse Screening', en: 'Concussion Screening' },
    region: 'NEUROLOGICAL',
    description: {
      no: 'Hjernerystelse/mild traumatisk hjerneskade vurdering',
      en: 'Concussion/mild traumatic brain injury assessment'
    },
    redFlagCluster: true,
    urgency: 'URGENT',
    diagnosticCriteria: {
      threshold: 3,
      total: 8,
      interpretation: {
        no: '≥3 positive tegn etter hodetraume = hjernerystelse. IKKE returner til aktivitet.',
        en: '≥3 positive signs after head trauma = concussion. DO NOT return to activity.'
      }
    },
    tests: [
      {
        id: 'loc',
        name: { no: 'Bevissthetstap (LOC)', en: 'Loss of Consciousness (LOC)' },
        procedure: {
          no: 'Spør om tap av bevissthet etter traume.',
          en: 'Ask about loss of consciousness after trauma.'
        },
        positive: {
          no: 'Enhver periode med bevissthetstap',
          en: 'Any period of loss of consciousness'
        },
        redFlag: true
      },
      {
        id: 'amnesia',
        name: { no: 'Amnesi', en: 'Amnesia' },
        procedure: {
          no: 'Test retrograd (før skade) og anterograd (etter skade) hukommelse.',
          en: 'Test retrograde (before injury) and anterograde (after injury) memory.'
        },
        positive: {
          no: 'Hukommelsestap for hendelsen eller etterfølgende',
          en: 'Memory loss for the event or subsequent'
        },
        redFlag: true
      },
      {
        id: 'confusion',
        name: { no: 'Forvirring/Desorientering', en: 'Confusion/Disorientation' },
        procedure: {
          no: 'Spør om tid, sted, person, situasjon.',
          en: 'Ask about time, place, person, situation.'
        },
        positive: {
          no: 'Forvirring om tid, sted eller hendelser',
          en: 'Confusion about time, place or events'
        },
        redFlag: true
      },
      {
        id: 'headache_post',
        name: { no: 'Hodepine', en: 'Headache' },
        procedure: {
          no: 'Spør om hodepine etter traume.',
          en: 'Ask about headache after trauma.'
        },
        positive: {
          no: 'Vedvarende eller forverrende hodepine',
          en: 'Persistent or worsening headache'
        },
        redFlag: true
      },
      {
        id: 'nausea_vomiting',
        name: { no: 'Kvalme/Oppkast', en: 'Nausea/Vomiting' },
        procedure: {
          no: 'Spør om kvalme eller oppkast etter traume.',
          en: 'Ask about nausea or vomiting after trauma.'
        },
        positive: {
          no: 'Vedvarende oppkast = alvorlig rødt flagg',
          en: 'Persistent vomiting = serious red flag'
        },
        redFlag: true
      },
      {
        id: 'balance_test',
        name: { no: 'Balansetest', en: 'Balance Test' },
        procedure: {
          no: 'BESS test eller Romberg med lukkkede øyne.',
          en: 'BESS test or Romberg with eyes closed.'
        },
        positive: {
          no: 'Ustøhet eller tap av balanse',
          en: 'Unsteadiness or loss of balance'
        }
      },
      {
        id: 'concentration',
        name: { no: 'Konsentrasjon', en: 'Concentration' },
        procedure: {
          no: 'Tell baklengs fra 100, månedens dager baklengs.',
          en: 'Count backwards from 100, months of year backwards.'
        },
        positive: {
          no: 'Vanskeligheter med konsentrasjon/fokus',
          en: 'Difficulty with concentration/focus'
        }
      },
      {
        id: 'gcs',
        name: { no: 'Glasgow Coma Scale', en: 'Glasgow Coma Scale' },
        procedure: {
          no: 'Vurder øye-åpning (4), verbal respons (5), motorisk respons (6). Total 3-15.',
          en: 'Assess eye opening (4), verbal response (5), motor response (6). Total 3-15.'
        },
        positive: {
          no: 'GCS <15 = hjernerystelse. GCS <13 = moderat/alvorlig TBI',
          en: 'GCS <15 = concussion. GCS <13 = moderate/severe TBI'
        },
        redFlag: true,
        grading: {
          mild: '13-15',
          moderate: '9-12',
          severe: '3-8'
        }
      }
    ]
  },

  // ============================================================================
  // UPPER CERVICAL INSTABILITY (from textbook C1-C2 Instability section)
  // ============================================================================

  UPPER_CERVICAL_INSTABILITY: {
    id: 'UPPER_CERVICAL_INSTABILITY',
    name: { no: 'Øvre Cervikal Instabilitet', en: 'Upper Cervical Instability' },
    region: 'CERVICAL',
    description: {
      no: 'C0-C1-C2 instabilitet og ligamentær integritet',
      en: 'C0-C1-C2 instability and ligamentous integrity'
    },
    redFlagCluster: true,
    urgency: 'URGENT',
    diagnosticCriteria: {
      threshold: 1,
      total: 4,
      interpretation: {
        no: 'Positiv test = KONTRAINDIKASJON for cervikal manipulasjon. Bildediagnostikk.',
        en: 'Positive test = CONTRAINDICATION for cervical manipulation. Imaging required.'
      }
    },
    tests: [
      {
        id: 'sharp_purser',
        name: { no: 'Sharp-Purser Test', en: 'Sharp-Purser Test' },
        procedure: {
          no: 'Sittende. Stabiliser C2 spinosus med en hånd. Flekter cervikalcolumna, trykk posteriort på pannen.',
          en: 'Sitting. Stabilize C2 spinous with one hand. Flex cervical spine, push posteriorly on forehead.'
        },
        positive: {
          no: 'Glidebevegelse eller klunk = C1-C2 instabilitet (transversalt ligament)',
          en: 'Sliding motion or clunk = C1-C2 instability (transverse ligament)'
        },
        sensitivity: 0.88,
        specificity: 0.96,
        redFlag: true,
        clinicalNote: {
          no: 'Brukes ved RA eller mistanke om odontoid skade.',
          en: 'Used in RA or suspected odontoid injury.'
        }
      },
      {
        id: 'alar_ligament',
        name: { no: 'Alar Ligament Stress Test', en: 'Alar Ligament Stress Test' },
        procedure: {
          no: 'Stabiliser C2 spinosus. Lateral fleksjon av hode. Normal: minimal bevegelse.',
          en: 'Stabilize C2 spinous. Lateral flexion of head. Normal: minimal movement.'
        },
        positive: {
          no: 'Overdreven lateralfleksjon >8-10° uten C2 bevegelse = alar lig. ruptur',
          en: 'Excessive lateral flexion >8-10° without C2 movement = alar lig. rupture'
        },
        sensitivity: 0.82,
        specificity: 0.90,
        redFlag: true
      },
      {
        id: 'transverse_ligament',
        name: { no: 'Transversalt Ligament Stress Test', en: 'Transverse Ligament Stress Test' },
        procedure: {
          no: 'Ryggliggende. Flektert posisjon. Anteroposterior kraft på C1.',
          en: 'Supine. Flexed position. Anteroposterior force on C1.'
        },
        positive: {
          no: 'Gaping følelse eller soft endfeel = ligament insuffisiens',
          en: 'Gaping sensation or soft end-feel = ligament insufficiency'
        },
        sensitivity: 0.70,
        specificity: 0.95,
        redFlag: true
      },
      {
        id: 'lateral_shear',
        name: { no: 'Lateral Shear Test', en: 'Lateral Shear Test' },
        procedure: {
          no: 'Ryggliggende. Lateral translasjon kraft på C1 relativt til C2.',
          en: 'Supine. Lateral translation force on C1 relative to C2.'
        },
        positive: {
          no: 'Overdreven bevegelse eller reprodusert symptom',
          en: 'Excessive motion or reproduced symptoms'
        },
        sensitivity: 0.65,
        specificity: 0.88,
        redFlag: true
      }
    ]
  },

  // ============================================================================
  // CERVICOGENIC HEADACHE (from textbook Headache section)
  // ============================================================================

  CERVICOGENIC_HEADACHE: {
    id: 'CERVICOGENIC_HEADACHE',
    name: { no: 'Cervikogen Hodepine', en: 'Cervicogenic Headache' },
    region: 'CERVICAL',
    description: {
      no: 'Hodepine fra cervikal opprinnelse (C1-C3)',
      en: 'Headache of cervical origin (C1-C3)'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive kriterier indikerer cervikogen hodepine',
        en: '≥3 positive criteria indicate cervicogenic headache'
      }
    },
    tests: [
      {
        id: 'unilateral_pain',
        name: { no: 'Unilateral Smerte', en: 'Unilateral Pain' },
        procedure: {
          no: 'Vurder om hodepine er ensidig og ikke skifter side.',
          en: 'Assess if headache is unilateral and does not shift sides.'
        },
        positive: {
          no: 'Konstant ensidig hodepine',
          en: 'Constant unilateral headache'
        }
      },
      {
        id: 'neck_movement_trigger',
        name: { no: 'Nakkebevegelse Trigger', en: 'Neck Movement Trigger' },
        procedure: {
          no: 'Vurder om hodepine provoseres av nakkebevegelser eller stillinger.',
          en: 'Assess if headache is provoked by neck movements or positions.'
        },
        positive: {
          no: 'Hodepine forverres med spesifikke nakkebevegelser/stillinger',
          en: 'Headache worsens with specific neck movements/positions'
        }
      },
      {
        id: 'cervical_rom_limited',
        name: { no: 'Redusert Cervikal ROM', en: 'Reduced Cervical ROM' },
        procedure: {
          no: 'Test aktiv cervikal ROM. Observer for reduksjon.',
          en: 'Test active cervical ROM. Observe for reduction.'
        },
        positive: {
          no: 'Redusert ROM spesielt i ekstensjon og rotasjon',
          en: 'Reduced ROM especially in extension and rotation'
        },
        sensitivity: 0.78,
        specificity: 0.72
      },
      {
        id: 'upper_cervical_palpation',
        name: { no: 'Øvre Cervikal Palpasjon', en: 'Upper Cervical Palpation' },
        procedure: {
          no: 'Palper C0-C3 region, suboccipitale muskler.',
          en: 'Palpate C0-C3 region, suboccipital muscles.'
        },
        positive: {
          no: 'Ømhet eller triggerpunkter som reproduserer hodepine',
          en: 'Tenderness or trigger points that reproduce headache'
        },
        sensitivity: 0.85,
        specificity: 0.65
      },
      {
        id: 'flexion_rotation_test',
        name: { no: 'Fleksjon-Rotasjon Test', en: 'Flexion-Rotation Test' },
        procedure: {
          no: 'Full cervikal fleksjon (lås nedre C-sp). Roter til hver side. Normal >44°.',
          en: 'Full cervical flexion (lock lower C-sp). Rotate each side. Normal >44°.'
        },
        positive: {
          no: 'Rotasjon <32° = C1-C2 restriksjon/dysfunksjon',
          en: 'Rotation <32° = C1-C2 restriction/dysfunction'
        },
        sensitivity: 0.91,
        specificity: 0.90
      },
      {
        id: 'no_autonomic',
        name: { no: 'Ingen Autonom Aktivering', en: 'No Autonomic Activation' },
        procedure: {
          no: 'Vurder fravær av tåreflod, nasal tetthet, øyeinjeksjon.',
          en: 'Assess absence of tearing, nasal congestion, eye injection.'
        },
        positive: {
          no: 'Ingen eller minimal autonom aktivering (skiller fra cluster)',
          en: 'No or minimal autonomic activation (differentiates from cluster)'
        }
      }
    ]
  },

  // ============================================================================
  // THORACIC / RIB DYSFUNCTION (from textbook T-spine & Ribs section)
  // ============================================================================

  THORACIC_RIB: {
    id: 'THORACIC_RIB',
    name: { no: 'Thorax / Ribben Dysfunksjon', en: 'Thoracic / Rib Dysfunction' },
    region: 'LUMBAR',
    description: {
      no: 'Thorakalkolumna og costovertebralledd dysfunksjon',
      en: 'Thoracic spine and costovertebral joint dysfunction'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive funn indikerer thorakal/ribben dysfunksjon',
        en: '≥3 positive findings indicate thoracic/rib dysfunction'
      }
    },
    tests: [
      {
        id: 'rib_spring',
        name: { no: 'Ribben Spring Test', en: 'Rib Spring Test' },
        procedure: {
          no: 'Mageleie. Press anteriort på ribben. Vurder bevegelse og smerte.',
          en: 'Prone. Press anteriorly on rib. Assess movement and pain.'
        },
        positive: {
          no: 'Smerte eller redusert fjæring vs. kontralateral',
          en: 'Pain or reduced springing vs. contralateral'
        },
        sensitivity: 0.72,
        specificity: 0.78
      },
      {
        id: 'first_rib_test',
        name: { no: '1. Ribben Test', en: 'First Rib Test' },
        procedure: {
          no: 'Palper 1. ribben i supraklavikulær region. Sammenlign høyde bilateralt.',
          en: 'Palpate 1st rib in supraclavicular region. Compare height bilaterally.'
        },
        positive: {
          no: 'Asymmetri i høyde, ømhet, restriksjon',
          en: 'Asymmetry in height, tenderness, restriction'
        },
        sensitivity: 0.68,
        specificity: 0.75
      },
      {
        id: 'thoracic_spring',
        name: { no: 'Thorakal Spring Test', en: 'Thoracic Spring Test' },
        procedure: {
          no: 'Mageleie. PA press på thorakal spinosus. Vurder joint play.',
          en: 'Prone. PA pressure on thoracic spinous. Assess joint play.'
        },
        positive: {
          no: 'Hypomobilitet eller smerte ved spesifikt segment',
          en: 'Hypomobility or pain at specific segment'
        },
        sensitivity: 0.75,
        specificity: 0.70
      },
      {
        id: 'rib_compression',
        name: { no: 'Ribben Kompresjon', en: 'Rib Compression' },
        procedure: {
          no: 'Anteroposterior og lateral kompresjon av thorax.',
          en: 'Anteroposterior and lateral compression of thorax.'
        },
        positive: {
          no: 'Lokalisert smerte = mulig fraktur eller dysfunksjon',
          en: 'Localized pain = possible fracture or dysfunction'
        },
        sensitivity: 0.82,
        specificity: 0.65,
        redFlagCondition: 'Rib fracture'
      },
      {
        id: 'deep_breath_pain',
        name: { no: 'Dyp Pust Smerte', en: 'Deep Breath Pain' },
        procedure: {
          no: 'Pasient tar dyp innånding. Vurder smerte lokalisering.',
          en: 'Patient takes deep inspiration. Assess pain location.'
        },
        positive: {
          no: 'Lokal thorakal/ribben smerte ved inspirasjon',
          en: 'Local thoracic/rib pain on inspiration'
        }
      },
      {
        id: 'scapular_winging',
        name: { no: 'Scapula Winging', en: 'Scapula Winging' },
        procedure: {
          no: 'Pasient presser mot vegg. Observer scapula.',
          en: 'Patient pushes against wall. Observe scapula.'
        },
        positive: {
          no: 'Scapula løfter fra thorax = serratus anterior svakhet (n. thoracicus longus)',
          en: 'Scapula lifts from thorax = serratus anterior weakness (long thoracic n.)'
        }
      }
    ]
  },

  // ============================================================================
  // LUMBAR RADICULOPATHY (from textbook L-spine section)
  // ============================================================================

  LUMBAR_RADICULOPATHY: {
    id: 'LUMBAR_RADICULOPATHY',
    name: { no: 'Lumbal Radikulopati', en: 'Lumbar Radiculopathy' },
    region: 'LUMBAR',
    description: {
      no: 'Nerverot kompresjon i lumbalkolumna',
      en: 'Nerve root compression in lumbar spine'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive tester indikerer lumbal radikulopati',
        en: '≥3 positive tests indicate lumbar radiculopathy'
      }
    },
    tests: [
      {
        id: 'slr',
        name: { no: 'Straight Leg Raise (SLR/Lasègue)', en: 'Straight Leg Raise (SLR/Lasègue)' },
        procedure: {
          no: 'Ryggliggende. Passiv heving av strakt ben. Positiv mellom 30-70°.',
          en: 'Supine. Passive raising of straight leg. Positive between 30-70°.'
        },
        positive: {
          no: 'Radierende smerte ned benet (ikke bare hamstring strekk)',
          en: 'Radiating pain down leg (not just hamstring stretch)'
        },
        sensitivity: 0.91,
        specificity: 0.26
      },
      {
        id: 'crossed_slr',
        name: { no: 'Krysset SLR (Fajersztajn)', en: 'Crossed SLR (Fajersztajn)' },
        procedure: {
          no: 'SLR av det uaffiserte benet reproduserer symptomer i det affiserte.',
          en: 'SLR of unaffected leg reproduces symptoms in affected leg.'
        },
        positive: {
          no: 'Symptomer i motsatt ben',
          en: 'Symptoms in opposite leg'
        },
        sensitivity: 0.29,
        specificity: 0.88
      },
      {
        id: 'slump',
        name: { no: 'Slump Test', en: 'Slump Test' },
        procedure: {
          no: 'Sittende. Flekter thorakal, så cervikalkolumna. Ekstender kne, dorsalflek ankel.',
          en: 'Sitting. Flex thoracic, then cervical spine. Extend knee, dorsiflex ankle.'
        },
        positive: {
          no: 'Radierende smerte. Lindres med cervikalekstensjn.',
          en: 'Radiating pain. Relieved with cervical extension.'
        },
        sensitivity: 0.84,
        specificity: 0.83
      },
      {
        id: 'bowstring',
        name: { no: 'Bowstring Sign (Cram Test)', en: 'Bowstring Sign (Cram Test)' },
        procedure: {
          no: 'SLR til symptomer, senk litt. Press på popliteafossa.',
          en: 'SLR to symptoms, lower slightly. Press on popliteal fossa.'
        },
        positive: {
          no: 'Symptomer reproduseres',
          en: 'Symptoms reproduced'
        },
        sensitivity: 0.40,
        specificity: 0.90
      },
      {
        id: 'femoral_nerve_stretch',
        name: { no: 'Femoral Nerve Stretch', en: 'Femoral Nerve Stretch' },
        procedure: {
          no: 'Mageleie. Flekter kne, ekstender hofte (reverse SLR).',
          en: 'Prone. Flex knee, extend hip (reverse SLR).'
        },
        positive: {
          no: 'Smerte i anterior lår = L2-L4 radikulopati',
          en: 'Pain in anterior thigh = L2-L4 radiculopathy'
        },
        sensitivity: 0.50,
        specificity: 0.75
      },
      {
        id: 'ankle_reflex',
        name: { no: 'Redusert Akillesrefleks', en: 'Reduced Achilles Reflex' },
        procedure: {
          no: 'Test akillesrefleks. Sammenlign bilateralt.',
          en: 'Test Achilles reflex. Compare bilaterally.'
        },
        positive: {
          no: 'Redusert/absent refleks = S1 radikulopati',
          en: 'Reduced/absent reflex = S1 radiculopathy'
        },
        sensitivity: 0.50,
        specificity: 0.85
      }
    ]
  },

  // ============================================================================
  // THORACIC SPINE & RIB ADDITIONS (from Vizniak Orthopedic Conditions)
  // ============================================================================

  SCOLIOSIS: {
    id: 'SCOLIOSIS',
    name: { no: 'Skoliose Screening', en: 'Scoliosis Screening' },
    region: 'THORACIC',
    description: {
      no: 'Lateral kurvatur av ryggraden med rotasjonskomponent',
      en: 'Lateral curvature of spine with rotational component'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive funn = henvisning til røntgen/spesialist. Cobb vinkel >10° bekrefter diagnose.',
        en: '≥2 positive findings = referral for x-ray/specialist. Cobb angle >10° confirms diagnosis.'
      }
    },
    tests: [
      {
        id: 'adams_forward_bend',
        name: { no: "Adam's Forward Bend Test", en: "Adam's Forward Bend Test" },
        procedure: {
          no: 'Pasient bøyer seg fremover med strakte knær, armer hengende. Observer ryggen bakfra.',
          en: 'Patient bends forward with straight knees, arms hanging. Observe back from behind.'
        },
        positive: {
          no: 'Ribbeforhøyning (rib hump) eller lumbal prominens på én side',
          en: 'Rib hump or lumbar prominence on one side'
        },
        sensitivity: 0.84,
        specificity: 0.93,
        clinicalNote: {
          no: 'Gullstandard screening. Bruk skoliometer - >5° ATR indikerer henvisning.',
          en: 'Gold standard screening. Use scoliometer - >5° ATR indicates referral.'
        }
      },
      {
        id: 'shoulder_height_asymmetry',
        name: { no: 'Skulderhøyde Asymmetri', en: 'Shoulder Height Asymmetry' },
        procedure: {
          no: 'Observer skulderhøyde bakfra i stående stilling.',
          en: 'Observe shoulder height from behind in standing position.'
        },
        positive: {
          no: 'Merkbar høydeforskjell mellom skuldrene',
          en: 'Notable height difference between shoulders'
        }
      },
      {
        id: 'scapular_asymmetry',
        name: { no: 'Scapula Asymmetri', en: 'Scapular Asymmetry' },
        procedure: {
          no: 'Observer scapulaposisjon - én mer prominent eller vinging.',
          en: 'Observe scapula position - one more prominent or winging.'
        },
        positive: {
          no: 'Asymmetrisk scapulaposisjon',
          en: 'Asymmetric scapula position'
        }
      },
      {
        id: 'waist_crease_asymmetry',
        name: { no: 'Midje/Flanke Asymmetri', en: 'Waist Crease Asymmetry' },
        procedure: {
          no: 'Observer avstand mellom arm og midje på hver side.',
          en: 'Observe distance between arm and waist on each side.'
        },
        positive: {
          no: 'Ulik avstand/vinkel mellom arm og midje',
          en: 'Unequal distance/angle between arm and waist'
        }
      }
    ]
  },

  SCHEUERMANN: {
    id: 'SCHEUERMANN',
    name: { no: "Scheuermann's Sykdom", en: "Scheuermann's Disease" },
    region: 'THORACIC',
    description: {
      no: 'Strukturell kyfose hos ungdom med vertebral wedging',
      en: 'Structural kyphosis in adolescents with vertebral wedging'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive funn + alder 12-17 = røntgen anbefalt. Diagnostiske kriterier: ≥3 påfølgende virvler med ≥5° wedging.',
        en: '≥3 positive findings + age 12-17 = x-ray recommended. Diagnostic criteria: ≥3 consecutive vertebrae with ≥5° wedging.'
      }
    },
    tests: [
      {
        id: 'fixed_kyphosis',
        name: { no: 'Fiksert Kyfose', en: 'Fixed Kyphosis' },
        procedure: {
          no: 'Observér thorakal kyfose. Test om den korrigeres med ekstensjon eller mageleie.',
          en: 'Observe thoracic kyphosis. Test if it corrects with extension or prone position.'
        },
        positive: {
          no: 'Kyfose som IKKE korrigeres (strukturell vs. postural)',
          en: 'Kyphosis that does NOT correct (structural vs. postural)'
        },
        clinicalNote: {
          no: 'Postural kyfose korrigeres, Scheuermann korrigeres ikke.',
          en: 'Postural kyphosis corrects, Scheuermann does not.'
        }
      },
      {
        id: 'thoracic_pain_adolescent',
        name: { no: 'Thorakal Smerte (Ungdom)', en: 'Thoracic Pain (Adolescent)' },
        procedure: {
          no: 'Anamnese: midtrygg/inter-scapulær smerte hos ungdom 12-17 år.',
          en: 'History: mid-back/inter-scapular pain in adolescent 12-17 years.'
        },
        positive: {
          no: 'Vedvarende thorakal smerte, verre med aktivitet',
          en: 'Persistent thoracic pain, worse with activity'
        }
      },
      {
        id: 'tight_hamstrings',
        name: { no: 'Stramme Hamstrings', en: 'Tight Hamstrings' },
        procedure: {
          no: 'SLR eller 90-90 hamstring test.',
          en: 'SLR or 90-90 hamstring test.'
        },
        positive: {
          no: 'Markant hamstring stramhet (vanlig ved Scheuermann)',
          en: 'Marked hamstring tightness (common in Scheuermann)'
        }
      },
      {
        id: 'limited_thoracic_extension',
        name: { no: 'Begrenset Thorakal Ekstensjon', en: 'Limited Thoracic Extension' },
        procedure: {
          no: 'Aktiv thorakal ekstensjon i sittende eller stående.',
          en: 'Active thoracic extension in sitting or standing.'
        },
        positive: {
          no: 'Sterkt begrenset ekstensjon sammenlignet med normalt',
          en: 'Severely limited extension compared to normal'
        }
      },
      {
        id: 'apex_tenderness',
        name: { no: 'Apex Ømhet', en: 'Apex Tenderness' },
        procedure: {
          no: 'Palpér spinøse prosesser ved kyfosens apex (T7-T9 typisk).',
          en: 'Palpate spinous processes at kyphosis apex (T7-T9 typical).'
        },
        positive: {
          no: 'Lokal ømhet ved apex av kyfosen',
          en: 'Local tenderness at apex of kyphosis'
        }
      }
    ]
  },

  COSTOCHONDRITIS: {
    id: 'COSTOCHONDRITIS',
    name: { no: 'Costochondritt', en: 'Costochondritis' },
    region: 'THORACIC',
    description: {
      no: 'Inflammasjon av costochondrale ledd - vanlig årsak til brystsmerter',
      en: 'Inflammation of costochondral joints - common cause of chest pain'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig costochondritt. VIKTIG: Utelukk kardiale årsaker først!',
        en: '≥3 positive = probable costochondritis. IMPORTANT: Rule out cardiac causes first!'
      }
    },
    tests: [
      {
        id: 'costochondral_tenderness',
        name: { no: 'Costochondral Ømhet', en: 'Costochondral Tenderness' },
        procedure: {
          no: 'Palpér costochondrale ledd (ribben 2-5 ved sternum).',
          en: 'Palpate costochondral junctions (ribs 2-5 at sternum).'
        },
        positive: {
          no: 'Reproduksjon av pasientens brystsmerte med palpasjon',
          en: 'Reproduction of patient\'s chest pain with palpation'
        },
        sensitivity: 0.77,
        specificity: 0.68,
        clinicalNote: {
          no: 'Tietze syndrom = costochondritt + synlig hevelse',
          en: 'Tietze syndrome = costochondritis + visible swelling'
        }
      },
      {
        id: 'crowing_rooster',
        name: { no: 'Crowing Rooster Manøver', en: 'Crowing Rooster Maneuver' },
        procedure: {
          no: 'Pasient plasserer hender bak hodet, ekstenderer nakke og presser albuer bakover.',
          en: 'Patient places hands behind head, extends neck and presses elbows backward.'
        },
        positive: {
          no: 'Reproduksjon av brystsmerte',
          en: 'Reproduction of chest pain'
        }
      },
      {
        id: 'chest_compression',
        name: { no: 'Brystkompresjon', en: 'Chest Compression' },
        procedure: {
          no: 'Lateral kompresjon av brystkassen (hands på sidene).',
          en: 'Lateral compression of chest cage (hands on sides).'
        },
        positive: {
          no: 'Smerte ved costochondrale ledd (ikke diffus)',
          en: 'Pain at costochondral joints (not diffuse)'
        }
      },
      {
        id: 'deep_breath_pain',
        name: { no: 'Smerte ved Dyp Inspirasjon', en: 'Pain with Deep Inspiration' },
        procedure: {
          no: 'Be pasient ta dyp innånding.',
          en: 'Ask patient to take deep breath.'
        },
        positive: {
          no: 'Lokalisert sternal/parasternal smerte (ikke diffus brystsmerte)',
          en: 'Localized sternal/parasternal pain (not diffuse chest pain)'
        }
      },
      {
        id: 'cough_sneeze_pain',
        name: { no: 'Smerte ved Hoste/Nysing', en: 'Pain with Cough/Sneeze' },
        procedure: {
          no: 'Anamnese: Forverres smerten ved hoste eller nysing?',
          en: 'History: Does pain worsen with coughing or sneezing?'
        },
        positive: {
          no: 'Ja, lokalisert til costochondrale områder',
          en: 'Yes, localized to costochondral areas'
        }
      }
    ]
  },

  POSTURAL_SYNDROME: {
    id: 'POSTURAL_SYNDROME',
    name: { no: 'Posturalt Syndrom (Upper/Lower Cross)', en: 'Postural Syndrome (Upper/Lower Cross)' },
    region: 'THORACIC',
    description: {
      no: 'Muskelubalanse med karakteristiske mønstere - Upper og Lower Cross Syndrom',
      en: 'Muscle imbalance with characteristic patterns - Upper and Lower Cross Syndrome'
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 8,
      interpretation: {
        no: '≥4 positive funn = posturalt syndrom. Identifiser hovedmønster for behandlingsplan.',
        en: '≥4 positive findings = postural syndrome. Identify main pattern for treatment plan.'
      }
    },
    tests: [
      {
        id: 'forward_head_posture',
        name: { no: 'Forward Head Posture', en: 'Forward Head Posture' },
        procedure: {
          no: 'Observer hodeposisjon fra siden - øre skal være over skulder.',
          en: 'Observe head position from side - ear should be over shoulder.'
        },
        positive: {
          no: 'Øret er anteriort for skulderleddet',
          en: 'Ear is anterior to shoulder joint'
        },
        clinicalNote: {
          no: 'Upper Cross: Stramme øvre trapezius, levator, pectoralis + svake dype nakkefleksorer, lower trap',
          en: 'Upper Cross: Tight upper trapezius, levator, pectoralis + weak deep neck flexors, lower trap'
        }
      },
      {
        id: 'rounded_shoulders',
        name: { no: 'Protraherte Skuldre', en: 'Rounded Shoulders' },
        procedure: {
          no: 'Observer skulderposisjon - skal hender peke fremover eller bakover?',
          en: 'Observe shoulder position - do hands point forward or backward?'
        },
        positive: {
          no: 'Tydelig protraksjon av skuldre, hender peker fremover',
          en: 'Clear protraction of shoulders, hands point forward'
        }
      },
      {
        id: 'increased_thoracic_kyphosis',
        name: { no: 'Økt Thorakal Kyfose', en: 'Increased Thoracic Kyphosis' },
        procedure: {
          no: 'Observer thorakalkolumna fra siden.',
          en: 'Observe thoracic spine from the side.'
        },
        positive: {
          no: 'Hyperkyfose som korrigeres ved aktiv holdningskorreksjon',
          en: 'Hyperkyphosis that corrects with active postural correction'
        }
      },
      {
        id: 'lumbar_hyperlordosis',
        name: { no: 'Lumbal Hyperlordose', en: 'Lumbar Hyperlordosis' },
        procedure: {
          no: 'Observer lumbalkolumna fra siden.',
          en: 'Observe lumbar spine from side.'
        },
        positive: {
          no: 'Økt lumbal lordose (anterior pelvic tilt)',
          en: 'Increased lumbar lordosis (anterior pelvic tilt)'
        },
        clinicalNote: {
          no: 'Lower Cross: Stramme hoftefleksorer, erector spinae + svake glutealer, abdominale',
          en: 'Lower Cross: Tight hip flexors, erector spinae + weak gluteals, abdominals'
        }
      },
      {
        id: 'tight_hip_flexors',
        name: { no: 'Stramme Hoftefleksorer (Thomas)', en: 'Tight Hip Flexors (Thomas)' },
        procedure: {
          no: 'Thomas test: Ryggliggende, trekk ett kne til brystet, observer motstående lår.',
          en: 'Thomas test: Supine, pull one knee to chest, observe opposite thigh.'
        },
        positive: {
          no: 'Motstående lår hever seg fra benken',
          en: 'Opposite thigh rises from table'
        },
        sensitivity: 0.89,
        specificity: 0.92
      },
      {
        id: 'weak_deep_neck_flexors',
        name: { no: 'Svake Dype Nakkefleksorer', en: 'Weak Deep Neck Flexors' },
        procedure: {
          no: 'Ryggliggende, be pasient løfte hodet. Observer hakeposisjon.',
          en: 'Supine, ask patient to lift head. Observe chin position.'
        },
        positive: {
          no: 'Haken peker opp istedenfor å trekkes inn (chin poke)',
          en: 'Chin points up instead of tucking in (chin poke)'
        }
      },
      {
        id: 'weak_glutes',
        name: { no: 'Svake Glutealer', en: 'Weak Gluteals' },
        procedure: {
          no: 'Mageleie, hofteekstensjon. Palper aktiveringssekvens.',
          en: 'Prone, hip extension. Palpate activation sequence.'
        },
        positive: {
          no: 'Hamstrings/erector aktiveres før gluteus maximus',
          en: 'Hamstrings/erector activate before gluteus maximus'
        }
      },
      {
        id: 'tight_pectorals',
        name: { no: 'Stramme Pectoralis', en: 'Tight Pectorals' },
        procedure: {
          no: 'Ryggliggende, armer ut til 90°. Skal underarmer hvile på benken?',
          en: 'Supine, arms out at 90°. Should forearms rest on table?'
        },
        positive: {
          no: 'Underarmer hviler ikke på benken (pec minor/major stramhet)',
          en: 'Forearms do not rest on table (pec minor/major tightness)'
        }
      }
    ]
  },

  MYOCARDIAL_INFARCTION_SCREEN: {
    id: 'MYOCARDIAL_INFARCTION_SCREEN',
    name: { no: 'Hjerteinfarkt Røde Flagg', en: 'Myocardial Infarction Red Flags' },
    region: 'THORACIC',
    description: {
      no: 'KRITISK: Røde flagg for kardial årsak til brystsmerte',
      en: 'CRITICAL: Red flags for cardiac cause of chest pain'
    },
    redFlagCluster: true,
    urgency: 'IMMEDIATE',
    diagnosticCriteria: {
      threshold: 2,
      total: 6,
      interpretation: {
        no: '≥2 positive = UMIDDELBAR KARDIAL EVALUERING. Ring 113!',
        en: '≥2 positive = IMMEDIATE CARDIAC EVALUATION. Call emergency services!'
      }
    },
    tests: [
      {
        id: 'crushing_substernal_pain',
        name: { no: 'Knusende Substernal Smerte', en: 'Crushing Substernal Pain' },
        procedure: {
          no: 'Beskriv smerten: knusende, pressende, tung følelse på brystet?',
          en: 'Describe pain: crushing, pressure, heavy feeling on chest?'
        },
        positive: {
          no: 'Ja, substernal trykk/knusing som "elefant på brystet"',
          en: 'Yes, substernal pressure/crushing like "elephant on chest"'
        },
        redFlag: true,
        redFlagCondition: 'Cardinal symptom of MI - immediate evaluation'
      },
      {
        id: 'left_arm_jaw_radiation',
        name: { no: 'Utstråling til Venstre Arm/Kjeve', en: 'Left Arm/Jaw Radiation' },
        procedure: {
          no: 'Stråler smerten til venstre arm, kjeve, nakke eller rygg?',
          en: 'Does pain radiate to left arm, jaw, neck or back?'
        },
        positive: {
          no: 'Ja, klassisk utstrålingsmønster',
          en: 'Yes, classic radiation pattern'
        },
        redFlag: true
      },
      {
        id: 'associated_symptoms',
        name: { no: 'Assosierte Symptomer', en: 'Associated Symptoms' },
        procedure: {
          no: 'Kvalme, svette, dyspné, svimmelhet?',
          en: 'Nausea, sweating, dyspnea, lightheadedness?'
        },
        positive: {
          no: 'Ett eller flere av disse symptomene tilstede',
          en: 'One or more of these symptoms present'
        },
        redFlag: true
      },
      {
        id: 'exertional_onset',
        name: { no: 'Anstrengelsesutløst', en: 'Exertional Onset' },
        procedure: {
          no: 'Startet smerten under eller rett etter fysisk anstrengelse?',
          en: 'Did pain start during or right after physical exertion?'
        },
        positive: {
          no: 'Ja, klar sammenheng med anstrengelse',
          en: 'Yes, clear relationship with exertion'
        },
        redFlag: true
      },
      {
        id: 'risk_factors_present',
        name: { no: 'Kardiale Risikofaktorer', en: 'Cardiac Risk Factors' },
        procedure: {
          no: 'Alder >50, diabetes, hypertensjon, røyking, familiehistorie, hyperkolesterolemi?',
          en: 'Age >50, diabetes, hypertension, smoking, family history, hypercholesterolemia?'
        },
        positive: {
          no: '≥2 risikofaktorer tilstede',
          en: '≥2 risk factors present'
        },
        redFlag: true
      },
      {
        id: 'pain_not_reproducible',
        name: { no: 'Smerte Ikke Reproduserbar', en: 'Pain Not Reproducible' },
        procedure: {
          no: 'Kan brystsmerten reproduseres med palpasjon eller bevegelse?',
          en: 'Can chest pain be reproduced with palpation or movement?'
        },
        positive: {
          no: 'NEI - smerten kan ikke reproduseres mekanisk',
          en: 'NO - pain cannot be reproduced mechanically'
        },
        clinicalNote: {
          no: 'Hvis smerte KAN reproduseres = mindre sannsynlig kardial årsak',
          en: 'If pain CAN be reproduced = less likely cardiac cause'
        }
      }
    ]
  },

  // ============================================================================
  // LUMBAR & PELVIS ADDITIONS
  // ============================================================================

  LEG_LENGTH_INEQUALITY: {
    id: 'LEG_LENGTH_INEQUALITY',
    name: { no: 'Benlengdeforskjell', en: 'Leg Length Inequality' },
    region: 'LUMBAR_PELVIS',
    description: {
      no: 'Anatomisk eller funksjonell benlengdeforskjell',
      en: 'Anatomical or functional leg length discrepancy'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive = sannsynlig LLI. Differensier anatomisk vs. funksjonell.',
        en: '≥2 positive = probable LLI. Differentiate anatomical vs. functional.'
      }
    },
    tests: [
      {
        id: 'standing_iliac_crest',
        name: { no: 'Stående Crista Iliaca Høyde', en: 'Standing Iliac Crest Height' },
        procedure: {
          no: 'Palper crista iliaca bilateralt i stående stilling.',
          en: 'Palpate iliac crests bilaterally in standing position.'
        },
        positive: {
          no: 'Ulik høyde på crista iliaca',
          en: 'Unequal iliac crest height'
        },
        clinicalNote: {
          no: 'Bruk blokker under kort ben til crista er jevn for å estimere forskjell.',
          en: 'Use blocks under short leg until crests level to estimate difference.'
        }
      },
      {
        id: 'supine_malleoli',
        name: { no: 'Ryggliggende Malleoli Sammenligning', en: 'Supine Malleoli Comparison' },
        procedure: {
          no: 'Ryggliggende, hold begge ankler og sammenlign mediale malleoli.',
          en: 'Supine, hold both ankles and compare medial malleoli.'
        },
        positive: {
          no: 'Ulik lengde observert',
          en: 'Unequal length observed'
        }
      },
      {
        id: 'tape_measure_asis_malleolus',
        name: { no: 'ASIS til Malleolus Måling', en: 'ASIS to Malleolus Measurement' },
        procedure: {
          no: 'Mål fra ASIS til medial malleolus bilateralt med målebånd.',
          en: 'Measure from ASIS to medial malleolus bilaterally with tape measure.'
        },
        positive: {
          no: 'Forskjell >1 cm = klinisk signifikant',
          en: 'Difference >1 cm = clinically significant'
        }
      },
      {
        id: 'functional_vs_anatomical',
        name: { no: 'Funksjonell vs. Anatomisk Test', en: 'Functional vs. Anatomical Test' },
        procedure: {
          no: 'Sammenlign stående vs. sittende. Funksjonell LLI forsvinner i sittende.',
          en: 'Compare standing vs. sitting. Functional LLI disappears in sitting.'
        },
        positive: {
          no: 'Forskjell i stående som IKKE er tilstede i sittende = funksjonell',
          en: 'Difference in standing that is NOT present in sitting = functional'
        },
        clinicalNote: {
          no: 'Funksjonell: SI-dysfunksjon, muskelubalanse. Anatomisk: Benstrukturforskjell.',
          en: 'Functional: SI dysfunction, muscle imbalance. Anatomical: Bone structure difference.'
        }
      }
    ]
  },

  SPONDYLOLISTHESIS: {
    id: 'SPONDYLOLISTHESIS',
    name: { no: 'Spondylolistese', en: 'Spondylolisthesis' },
    region: 'LUMBAR_PELVIS',
    description: {
      no: 'Anterior glidning av en virvel over den nedenfor - oftest L5 over S1',
      en: 'Anterior slippage of one vertebra over the one below - most often L5 over S1'
    },
    redFlagCluster: false,
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig spondylolistese. Røntgen bekrefter. Grad I-IV (Meyerding).',
        en: '≥3 positive = probable spondylolisthesis. X-ray confirms. Grade I-IV (Meyerding).'
      }
    },
    tests: [
      {
        id: 'step_off_deformity',
        name: { no: 'Step-Off Deformitet', en: 'Step-Off Deformity' },
        procedure: {
          no: 'Palper spinøse prosesser. Kjenn etter "trapp" der en virvel glir frem.',
          en: 'Palpate spinous processes. Feel for "step" where one vertebra slips forward.'
        },
        positive: {
          no: 'Palpabel step-off, oftest L4-L5 eller L5-S1',
          en: 'Palpable step-off, most often L4-L5 or L5-S1'
        }
      },
      {
        id: 'hyperlordosis_spondy',
        name: { no: 'Kompensatorisk Hyperlordose', en: 'Compensatory Hyperlordosis' },
        procedure: {
          no: 'Observer lumbal lordose i stående.',
          en: 'Observe lumbar lordosis in standing.'
        },
        positive: {
          no: 'Økt lumbal lordose som kompensasjon for glidning',
          en: 'Increased lumbar lordosis as compensation for slippage'
        }
      },
      {
        id: 'tight_hamstrings_spondy',
        name: { no: 'Stramme Hamstrings', en: 'Tight Hamstrings' },
        procedure: {
          no: 'SLR for hamstringlengde (ikke radikulopati).',
          en: 'SLR for hamstring length (not radiculopathy).'
        },
        positive: {
          no: 'Markant hamstring stramhet (reflex beskyttelse)',
          en: 'Marked hamstring tightness (reflex protection)'
        },
        clinicalNote: {
          no: 'Stramme hamstrings er vanlig kompensatorisk funn.',
          en: 'Tight hamstrings are a common compensatory finding.'
        }
      },
      {
        id: 'extension_pain',
        name: { no: 'Smerte med Ekstensjon', en: 'Pain with Extension' },
        procedure: {
          no: 'Aktiv lumbal ekstensjon i stående.',
          en: 'Active lumbar extension in standing.'
        },
        positive: {
          no: 'Lumbal smerte forverres med ekstensjon',
          en: 'Lumbar pain worsens with extension'
        }
      },
      {
        id: 'one_leg_hyperextension',
        name: { no: 'Ett-Bens Hyperekstensjon (Stork)', en: 'One-Leg Hyperextension (Stork)' },
        procedure: {
          no: 'Stående på ett ben, ekstender lumbal mot samme side.',
          en: 'Standing on one leg, extend lumbar toward same side.'
        },
        positive: {
          no: 'Smerte i lumbal, mulig radikulær komponent',
          en: 'Pain in lumbar, possible radicular component'
        },
        sensitivity: 0.73,
        specificity: 0.84,
        clinicalNote: {
          no: 'Også kjent som Stork test - stresser pars interarticularis.',
          en: 'Also known as Stork test - stresses pars interarticularis.'
        }
      }
    ]
  },

  // ============================================================================
  // SHOULDER ADDITIONS
  // ============================================================================

  ADHESIVE_CAPSULITIS: {
    id: 'ADHESIVE_CAPSULITIS',
    name: { no: 'Adhesiv Kapsulitt (Frozen Shoulder)', en: 'Adhesive Capsulitis (Frozen Shoulder)' },
    region: 'SHOULDER',
    description: {
      no: 'Progressiv stivhet med kapsulært mønster: ER > ABD > IR',
      en: 'Progressive stiffness with capsular pattern: ER > ABD > IR'
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 6,
      interpretation: {
        no: '≥4 positive = sannsynlig frozen shoulder. Tre stadier: freezing, frozen, thawing.',
        en: '≥4 positive = probable frozen shoulder. Three stages: freezing, frozen, thawing.'
      }
    },
    tests: [
      {
        id: 'capsular_pattern',
        name: { no: 'Kapsulært Mønster', en: 'Capsular Pattern' },
        procedure: {
          no: 'Test PROM: Utadrotasjon, abduksjon, innadrotasjon. Alle begrenset?',
          en: 'Test PROM: External rotation, abduction, internal rotation. All limited?'
        },
        positive: {
          no: 'Begrensning i kapsulært mønster: ER > ABD > IR',
          en: 'Limitation in capsular pattern: ER > ABD > IR'
        },
        clinicalNote: {
          no: 'Hvis bare én retning begrenset = sannsynligvis IKKE frozen shoulder.',
          en: 'If only one direction limited = probably NOT frozen shoulder.'
        }
      },
      {
        id: 'passive_er_loss',
        name: { no: 'Passiv ER Tap >50%', en: 'Passive ER Loss >50%' },
        procedure: {
          no: 'Sammenlign passiv utadrotasjon bilateralt med albue ved siden.',
          en: 'Compare passive external rotation bilaterally with elbow at side.'
        },
        positive: {
          no: '>50% tap av ER sammenlignet med frisk side',
          en: '>50% loss of ER compared to unaffected side'
        }
      },
      {
        id: 'global_stiffness',
        name: { no: 'Global Stivhet (Alle Retninger)', en: 'Global Stiffness (All Directions)' },
        procedure: {
          no: 'Test AROM og PROM i alle retninger.',
          en: 'Test AROM and PROM in all directions.'
        },
        positive: {
          no: 'Begrenset bevegelse i ALLE retninger, ikke bare én',
          en: 'Limited motion in ALL directions, not just one'
        }
      },
      {
        id: 'night_pain_frozen',
        name: { no: 'Nattesmerte', en: 'Night Pain' },
        procedure: {
          no: 'Anamnese: Vekkes du av skuldersmerte om natten?',
          en: 'History: Do you wake up with shoulder pain at night?'
        },
        positive: {
          no: 'Ja, spesielt ved ligge på affisert side',
          en: 'Yes, especially when lying on affected side'
        }
      },
      {
        id: 'insidious_onset',
        name: { no: 'Snikende Debut', en: 'Insidious Onset' },
        procedure: {
          no: 'Anamnese: Gradvis debut uten spesifikk skade?',
          en: 'History: Gradual onset without specific injury?'
        },
        positive: {
          no: 'Ja, ingen spesifikk traumatisk hendelse',
          en: 'Yes, no specific traumatic event'
        }
      },
      {
        id: 'diabetes_risk',
        name: { no: 'Diabetes/Risikofaktorer', en: 'Diabetes/Risk Factors' },
        procedure: {
          no: 'Diabetes, thyroid-sykdom, 40-60 år, kvinne?',
          en: 'Diabetes, thyroid disease, 40-60 years, female?'
        },
        positive: {
          no: 'En eller flere risikofaktorer tilstede',
          en: 'One or more risk factors present'
        },
        clinicalNote: {
          no: 'Diabetes gir 2-4x økt risiko for frozen shoulder.',
          en: 'Diabetes gives 2-4x increased risk for frozen shoulder.'
        }
      }
    ]
  },

  AC_SPRAIN: {
    id: 'AC_SPRAIN',
    name: { no: 'AC-Leddspreng', en: 'AC Joint Sprain' },
    region: 'SHOULDER',
    description: {
      no: 'Skade på acromioclavicular-leddet - Rockwood klassifikasjon I-VI',
      en: 'Injury to acromioclavicular joint - Rockwood classification I-VI'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig AC-skade. Gradering I-VI basert på kliniske/radiologiske funn.',
        en: '≥3 positive = probable AC injury. Grading I-VI based on clinical/radiological findings.'
      }
    },
    tests: [
      {
        id: 'ac_palpation',
        name: { no: 'AC-Ledd Palpasjon', en: 'AC Joint Palpation' },
        procedure: {
          no: 'Direkte palpasjon over AC-leddet.',
          en: 'Direct palpation over AC joint.'
        },
        positive: {
          no: 'Lokal ømhet og mulig step-off/hevelse',
          en: 'Local tenderness and possible step-off/swelling'
        },
        sensitivity: 0.96,
        specificity: 0.10
      },
      {
        id: 'cross_body_adduction',
        name: { no: 'Cross-Body Adduksjon', en: 'Cross-Body Adduction' },
        procedure: {
          no: 'Passiv horisontal adduksjon av armen over kroppen.',
          en: 'Passive horizontal adduction of arm across body.'
        },
        positive: {
          no: 'Smerte lokalisert til AC-leddet',
          en: 'Pain localized to AC joint'
        },
        sensitivity: 0.77,
        specificity: 0.79
      },
      {
        id: 'piano_key_sign',
        name: { no: 'Piano Key Sign', en: 'Piano Key Sign' },
        procedure: {
          no: 'Press ned på distale clavicula. Observer om den "spretter" opp.',
          en: 'Press down on distal clavicle. Observe if it "springs" back up.'
        },
        positive: {
          no: 'Clavicula spretter opp som en pianotast = Type III+',
          en: 'Clavicle springs up like piano key = Type III+'
        },
        clinicalNote: {
          no: 'Type III+: Komplett ruptur av AC og CC ligamenter.',
          en: 'Type III+: Complete rupture of AC and CC ligaments.'
        }
      },
      {
        id: 'trauma_history_ac',
        name: { no: 'Traumehistorie', en: 'Trauma History' },
        procedure: {
          no: 'Fall på skulderen eller direkte traume mot AC-området?',
          en: 'Fall on shoulder or direct trauma to AC area?'
        },
        positive: {
          no: 'Ja, typisk fall på utstrakt arm eller direkte slag',
          en: 'Yes, typical fall on outstretched arm or direct blow'
        }
      },
      {
        id: 'active_compression_ac',
        name: { no: "O'Brien's Active Compression", en: "O'Brien's Active Compression" },
        procedure: {
          no: "Arm 90° fleksjon, 10° adduksjon, tommel ned. Motstand. Sammenlign med tommel opp.",
          en: "Arm 90° flexion, 10° adduction, thumb down. Resist. Compare with thumb up."
        },
        positive: {
          no: 'Smerte med tommel ned som lindres med tommel opp = AC patologi',
          en: 'Pain with thumb down that improves with thumb up = AC pathology'
        },
        sensitivity: 0.90,
        specificity: 0.85
      }
    ]
  },

  BICIPITAL_TENDINOPATHY: {
    id: 'BICIPITAL_TENDINOPATHY',
    name: { no: 'Bicepstendinopati', en: 'Bicipital Tendinopathy' },
    region: 'SHOULDER',
    description: {
      no: 'Patologi i lange bicepssenens originasjon/forløp i bicipitalgropen',
      en: 'Pathology of long head biceps tendon origin/course in bicipital groove'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig bicepstendinopati. Ofte assosiert med rotator cuff patologi.',
        en: '≥3 positive = probable biceps tendinopathy. Often associated with rotator cuff pathology.'
      }
    },
    tests: [
      {
        id: 'bicipital_groove_tenderness',
        name: { no: 'Bicipital Groove Ømhet', en: 'Bicipital Groove Tenderness' },
        procedure: {
          no: 'Palper bicipitalgropen med skulder i 10° innadrotasjon.',
          en: 'Palpate bicipital groove with shoulder in 10° internal rotation.'
        },
        positive: {
          no: 'Direkte ømhet over lange bicepssenen i gropen',
          en: 'Direct tenderness over long head biceps tendon in groove'
        },
        sensitivity: 0.53,
        specificity: 0.54
      },
      {
        id: 'speed_test',
        name: { no: "Speed's Test", en: "Speed's Test" },
        procedure: {
          no: 'Arm 90° fleksjon, supinert underarm, strakt albue. Motstand mot fleksjon.',
          en: 'Arm 90° flexion, supinated forearm, extended elbow. Resist flexion.'
        },
        positive: {
          no: 'Smerte i bicipitalgropen',
          en: 'Pain in bicipital groove'
        },
        sensitivity: 0.32,
        specificity: 0.75
      },
      {
        id: 'yergason_test',
        name: { no: "Yergason's Test", en: "Yergason's Test" },
        procedure: {
          no: 'Albue 90° fleksjon, pronert underarm. Motstand mot supinasjon og utadrotasjon.',
          en: 'Elbow 90° flexion, pronated forearm. Resist supination and external rotation.'
        },
        positive: {
          no: 'Smerte i bicipitalgropen',
          en: 'Pain in bicipital groove'
        },
        sensitivity: 0.43,
        specificity: 0.79
      },
      {
        id: 'anterior_shoulder_pain',
        name: { no: 'Anterior Skuldersmerte', en: 'Anterior Shoulder Pain' },
        procedure: {
          no: 'Anamnese: Smerte foran på skulderen, spesielt med overhead-aktiviteter?',
          en: 'History: Pain in front of shoulder, especially with overhead activities?'
        },
        positive: {
          no: 'Ja, klassisk lokalisasjon anterior',
          en: 'Yes, classic anterior location'
        }
      },
      {
        id: 'popeye_deformity',
        name: { no: 'Popeye Deformitet', en: 'Popeye Deformity' },
        procedure: {
          no: 'Inspeksjon av overarmens kontur. Sammenlign bilateralt.',
          en: 'Inspection of upper arm contour. Compare bilaterally.'
        },
        positive: {
          no: 'Synlig "ball" i distale overarm = ruptur av lange bicepssene',
          en: 'Visible "ball" in distal upper arm = rupture of long head biceps'
        },
        clinicalNote: {
          no: 'Ved ruptur: Akutt smerte, deretter ofte mindre smerter men kosmisk deformitet.',
          en: 'With rupture: Acute pain, then often less pain but cosmetic deformity.'
        }
      }
    ]
  },

  // ============================================================================
  // ELBOW ADDITIONS
  // ============================================================================

  CUBITAL_TUNNEL: {
    id: 'CUBITAL_TUNNEL',
    name: { no: 'Kubitaltunnel Syndrom', en: 'Cubital Tunnel Syndrome' },
    region: 'ELBOW_FOREARM',
    description: {
      no: 'Kompresjon av ulnarisnerven ved albuen - nest vanligste kompresjonsneuropati',
      en: 'Compression of ulnar nerve at elbow - second most common compression neuropathy'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig kubitaltunnel syndrom. Vurder EMG ved vedvarende symptomer.',
        en: '≥3 positive = probable cubital tunnel syndrome. Consider EMG for persistent symptoms.'
      }
    },
    tests: [
      {
        id: 'tinel_elbow',
        name: { no: "Tinel's ved Albue", en: "Tinel's at Elbow" },
        procedure: {
          no: 'Perkuter over ulnarisnerven i sulcus ulnaris (bak mediale epicondyl).',
          en: 'Percuss over ulnar nerve in ulnar groove (behind medial epicondyle).'
        },
        positive: {
          no: 'Utstråling av parestesier til 4. og 5. finger',
          en: 'Radiation of paresthesias to 4th and 5th fingers'
        },
        sensitivity: 0.70,
        specificity: 0.98
      },
      {
        id: 'elbow_flexion_test',
        name: { no: 'Albuefleksjonstest', en: 'Elbow Flexion Test' },
        procedure: {
          no: 'Maksimal albuefleksjon med ekstendert håndledd i 3 minutter.',
          en: 'Maximum elbow flexion with extended wrist for 3 minutes.'
        },
        positive: {
          no: 'Parestesier i ulnar distribusjon (4. og 5. finger)',
          en: 'Paresthesias in ulnar distribution (4th and 5th fingers)'
        },
        sensitivity: 0.75,
        specificity: 0.99,
        clinicalNote: {
          no: 'Mest sensitive test for kubitaltunnel syndrom.',
          en: 'Most sensitive test for cubital tunnel syndrome.'
        }
      },
      {
        id: 'froment_sign',
        name: { no: "Froment's Sign", en: "Froment's Sign" },
        procedure: {
          no: 'Be pasient holde papir mellom tommel og pekefinger. Trekk i papiret.',
          en: 'Ask patient to hold paper between thumb and index finger. Pull on paper.'
        },
        positive: {
          no: 'Pasient flekterer IP-ledd for å kompensere for svak adductor pollicis',
          en: 'Patient flexes IP joint to compensate for weak adductor pollicis'
        },
        clinicalNote: {
          no: 'Indikerer ulnarisnerve svakhet.',
          en: 'Indicates ulnar nerve weakness.'
        }
      },
      {
        id: 'sensory_loss_ulnar',
        name: { no: 'Sensorisk Tap Ulnart', en: 'Sensory Loss Ulnar' },
        procedure: {
          no: 'Test lett berøring på palmar og dorsal side av 4. og 5. finger.',
          en: 'Test light touch on palmar and dorsal side of 4th and 5th fingers.'
        },
        positive: {
          no: 'Redusert sensibilitet i ulnar distribusjon',
          en: 'Reduced sensation in ulnar distribution'
        }
      },
      {
        id: 'interossei_weakness',
        name: { no: 'Interossei Svakhet', en: 'Interossei Weakness' },
        procedure: {
          no: 'Test finger abduksjon og adduksjon mot motstand.',
          en: 'Test finger abduction and adduction against resistance.'
        },
        positive: {
          no: 'Svakhet i finger spreading/sammenklemming',
          en: 'Weakness in finger spreading/squeezing'
        }
      }
    ]
  },

  // ============================================================================
  // WRIST & HAND ADDITIONS
  // ============================================================================

  SCAPHOID_FRACTURE: {
    id: 'SCAPHOID_FRACTURE',
    name: { no: 'Scaphoid Fraktur Screening', en: 'Scaphoid Fracture Screening' },
    region: 'WRIST_HAND',
    description: {
      no: 'Screening for scaphoid fraktur - ofte mist på initial røntgen',
      en: 'Screening for scaphoid fracture - often missed on initial x-ray'
    },
    redFlagCluster: true,
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive = høy mistenke. Immobiliser og repeter røntgen om 10-14 dager, eller MR.',
        en: '≥2 positive = high suspicion. Immobilize and repeat x-ray in 10-14 days, or MRI.'
      }
    },
    tests: [
      {
        id: 'anatomical_snuffbox',
        name: { no: 'Anatomisk Snusboks Ømhet', en: 'Anatomical Snuffbox Tenderness' },
        procedure: {
          no: 'Palper i anatomisk snusboks (mellom EPL og EPB) med håndledd i ulnardeviasjon.',
          en: 'Palpate in anatomical snuffbox (between EPL and EPB) with wrist in ulnar deviation.'
        },
        positive: {
          no: 'Ømhet over scaphoid',
          en: 'Tenderness over scaphoid'
        },
        sensitivity: 0.90,
        specificity: 0.40,
        clinicalNote: {
          no: 'Høy sensitivitet men lav spesifisitet - god til å utelukke.',
          en: 'High sensitivity but low specificity - good for ruling out.'
        }
      },
      {
        id: 'scaphoid_tubercle',
        name: { no: 'Scaphoid Tuberkel Ømhet', en: 'Scaphoid Tubercle Tenderness' },
        procedure: {
          no: 'Palper scaphoid tuberkel volart (ved thenareminensen).',
          en: 'Palpate scaphoid tubercle on volar side (at thenar eminence).'
        },
        positive: {
          no: 'Ømhet over scaphoid tuberkel',
          en: 'Tenderness over scaphoid tubercle'
        },
        sensitivity: 0.87,
        specificity: 0.57
      },
      {
        id: 'thumb_axial_compression',
        name: { no: 'Tommel Aksial Kompresjon', en: 'Thumb Axial Compression' },
        procedure: {
          no: 'Aksial kompresjon langs tommelens lengdeakse.',
          en: 'Axial compression along the longitudinal axis of the thumb.'
        },
        positive: {
          no: 'Smerte i håndleddet/scaphoid',
          en: 'Pain in wrist/scaphoid area'
        },
        sensitivity: 0.80,
        specificity: 0.48
      },
      {
        id: 'foosh_history',
        name: { no: 'FOOSH Mekanisme', en: 'FOOSH Mechanism' },
        procedure: {
          no: 'Anamnese: Fall On OutStretched Hand?',
          en: 'History: Fall On OutStretched Hand?'
        },
        positive: {
          no: 'Ja, klassisk skadevmekanisme',
          en: 'Yes, classic injury mechanism'
        },
        redFlag: true,
        redFlagCondition: 'High risk mechanism for scaphoid fracture'
      }
    ]
  },

  CARPAL_INSTABILITY: {
    id: 'CARPAL_INSTABILITY',
    name: { no: 'Karpal Instabilitet', en: 'Carpal Instability' },
    region: 'WRIST_HAND',
    description: {
      no: 'Ligamentær instabilitet mellom karpalbein - SL, LT eller midkarpal',
      en: 'Ligamentous instability between carpal bones - SL, LT or midcarpal'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 4,
      interpretation: {
        no: '≥2 positive = sannsynlig karpal instabilitet. MR eller artroskopi for bekreftelse.',
        en: '≥2 positive = probable carpal instability. MRI or arthroscopy for confirmation.'
      }
    },
    tests: [
      {
        id: 'watson_shift',
        name: { no: 'Watson Scaphoid Shift', en: 'Watson Scaphoid Shift' },
        procedure: {
          no: 'Press på scaphoid tuberkel, beveg håndledd fra ulnar til radial deviasjon.',
          en: 'Press on scaphoid tubercle, move wrist from ulnar to radial deviation.'
        },
        positive: {
          no: 'Smertefullt klikk eller subluksasjon av scaphoid',
          en: 'Painful click or subluxation of scaphoid'
        },
        sensitivity: 0.69,
        specificity: 0.66,
        clinicalNote: {
          no: 'Test for scapholunær instabilitet. Sammenlign med frisk side!',
          en: 'Test for scapholunate instability. Compare with unaffected side!'
        }
      },
      {
        id: 'ballottement_lt',
        name: { no: 'Lunotriquetral Ballottement', en: 'Lunotriquetral Ballottement' },
        procedure: {
          no: 'Stabiliser lunatum, flytt triquetrum dorsalt og volart.',
          en: 'Stabilize lunate, move triquetrum dorsally and volarly.'
        },
        positive: {
          no: 'Smerte, krepitasjon eller økt bevegelse',
          en: 'Pain, crepitus or increased movement'
        }
      },
      {
        id: 'midcarpal_shift',
        name: { no: 'Midkarpal Shift Test', en: 'Midcarpal Shift Test' },
        procedure: {
          no: 'Aksial kompresjon med ulnardeviasjon fra nøytral.',
          en: 'Axial compression with ulnar deviation from neutral.'
        },
        positive: {
          no: 'Smertefullt "clunk" ved midkarpal rekke',
          en: 'Painful "clunk" at midcarpal row'
        }
      },
      {
        id: 'dorsal_wrist_pain',
        name: { no: 'Dorsal Håndleddssmerte', en: 'Dorsal Wrist Pain' },
        procedure: {
          no: 'Anamnese: Smerte dorsalt på håndleddet, spesielt med belastning?',
          en: 'History: Pain on dorsal wrist, especially with loading?'
        },
        positive: {
          no: 'Ja, typisk lokalisasjon for ligamentær patologi',
          en: 'Yes, typical location for ligamentous pathology'
        }
      }
    ]
  },

  GAMEKEEPER_THUMB: {
    id: 'GAMEKEEPER_THUMB',
    name: { no: "Gamekeeper's Thumb (UCL Tommel)", en: "Gamekeeper's Thumb (UCL Thumb)" },
    region: 'WRIST_HAND',
    description: {
      no: 'Skade på ulnar collateral ligament i tommelens MCP-ledd',
      en: 'Injury to ulnar collateral ligament of thumb MCP joint'
    },
    diagnosticCriteria: {
      threshold: 2,
      total: 3,
      interpretation: {
        no: '≥2 positive = sannsynlig UCL skade. >30° valgus laksitet eller uten endepunkt = kirurgisk vurdering.',
        en: '≥2 positive = probable UCL injury. >30° valgus laxity or no endpoint = surgical evaluation.'
      }
    },
    tests: [
      {
        id: 'ucl_valgus_stress',
        name: { no: 'UCL Valgus Stress Test', en: 'UCL Valgus Stress Test' },
        procedure: {
          no: 'Stabiliser 1. metacarpal, appliser valgus stress på MCP-leddet (30° og 0° fleksjon).',
          en: 'Stabilize 1st metacarpal, apply valgus stress to MCP joint (30° and 0° flexion).'
        },
        positive: {
          no: '>30° åpning eller intet endepunkt. Sammenlign med frisk side.',
          en: '>30° opening or no endpoint. Compare with unaffected side.'
        },
        sensitivity: 0.83,
        specificity: 0.81,
        clinicalNote: {
          no: 'Stener lesjon: Adductor aponeurose interponerer - krever kirurgi.',
          en: 'Stener lesion: Adductor aponeurosis interposes - requires surgery.'
        }
      },
      {
        id: 'ucl_palpation',
        name: { no: 'UCL Palpasjon', en: 'UCL Palpation' },
        procedure: {
          no: 'Palper over ulnar side av tommelens MCP-ledd.',
          en: 'Palpate over ulnar side of thumb MCP joint.'
        },
        positive: {
          no: 'Lokal ømhet og mulig hevelse over UCL',
          en: 'Local tenderness and possible swelling over UCL'
        }
      },
      {
        id: 'ski_pole_history',
        name: { no: 'Skistav/Valgustrauma Historie', en: 'Ski Pole/Valgus Trauma History' },
        procedure: {
          no: 'Fall med skistav, ballkast som treffer tommelen, eller annen valgusmekanisme?',
          en: 'Fall with ski pole, ball hitting thumb, or other valgus mechanism?'
        },
        positive: {
          no: 'Ja, klassisk skadevmekanisme for UCL',
          en: 'Yes, classic injury mechanism for UCL'
        }
      }
    ]
  },

  // ============================================================================
  // HIP ADDITIONS (from new textbook content)
  // ============================================================================

  PIRIFORMIS_SYNDROME: {
    id: 'PIRIFORMIS_SYNDROME',
    name: { no: 'Piriformis Syndrom', en: 'Piriformis Syndrome' },
    region: 'HIP',
    description: {
      no: 'Kompresjon/irritasjon av iskiasnerven av piriformis - pseudoischias',
      en: 'Compression/irritation of sciatic nerve by piriformis - pseudosciatica'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig piriformis syndrom. Differensier fra lumbal radikulopati.',
        en: '≥3 positive = probable piriformis syndrome. Differentiate from lumbar radiculopathy.'
      }
    },
    tests: [
      {
        id: 'freiberg_test',
        name: { no: "Freiberg's Manøver", en: "Freiberg's Maneuver" },
        procedure: {
          no: 'Ryggliggende. Forcefu horisontal adduksjon av flektert hofte.',
          en: 'Supine. Forceful horizontal adduction of flexed hip.'
        },
        positive: {
          no: 'Smerte i glutealregionen (strekker piriformis)',
          en: 'Pain in gluteal region (stretches piriformis)'
        },
        sensitivity: 0.65,
        specificity: 0.78
      },
      {
        id: 'pace_test',
        name: { no: 'PACE Test', en: 'PACE Test' },
        procedure: {
          no: 'Sittende. Motstand mot abduksjon og utadrotasjon av hofte.',
          en: 'Sitting. Resist abduction and external rotation of hip.'
        },
        positive: {
          no: 'Smerte og svakhet i gluteal region',
          en: 'Pain and weakness in gluteal region'
        }
      },
      {
        id: 'hibbs_test',
        name: { no: "Hibb's Test", en: "Hibb's Test" },
        procedure: {
          no: 'Mageleie, kne 90° fleksjon. Stabiliser bekken, dytt ankelen lateralt (innadrotasjon av hofte).',
          en: 'Prone, knee 90° flexion. Stabilize pelvis, push ankle laterally (internal rotation of hip).'
        },
        positive: {
          no: 'Smerte i glutealregionen',
          en: 'Pain in gluteal region'
        }
      },
      {
        id: 'piriformis_palpation',
        name: { no: 'Piriformis Palpasjon', en: 'Piriformis Palpation' },
        procedure: {
          no: 'Dyp palpasjon av piriformis (mellom PSIS og greater trochanter).',
          en: 'Deep palpation of piriformis (between PSIS and greater trochanter).'
        },
        positive: {
          no: 'Ømhet og reproduksjon av symptomer',
          en: 'Tenderness and reproduction of symptoms'
        }
      },
      {
        id: 'lumbar_rom_normal',
        name: { no: 'Normal Lumbal ROM', en: 'Normal Lumbar ROM' },
        procedure: {
          no: 'Vurder lumbal ROM - skal være normal ved piriformis syndrom.',
          en: 'Assess lumbar ROM - should be normal in piriformis syndrome.'
        },
        positive: {
          no: 'Normal lumbal ROM (hjelper differensiere fra lumbal radikulopati)',
          en: 'Normal lumbar ROM (helps differentiate from lumbar radiculopathy)'
        }
      }
    ]
  },

  HIP_DJD: {
    id: 'HIP_DJD',
    name: { no: 'Hofte Osteoartrose', en: 'Hip Osteoarthritis' },
    region: 'HIP',
    description: {
      no: 'Degenerativ leddsykdom i hofteleddet',
      en: 'Degenerative joint disease of the hip'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig hofte OA. ACR kriterier: hofte smerte + 2 av 3 (ESR<20, osteofytter rx, leddspaltereduksjon).',
        en: '≥3 positive = probable hip OA. ACR criteria: hip pain + 2 of 3 (ESR<20, osteophytes xr, joint space narrowing).'
      }
    },
    tests: [
      {
        id: 'hip_scour',
        name: { no: 'Scour Test (Quadrant)', en: 'Scour Test (Quadrant)' },
        procedure: {
          no: 'Flekter hofte og kne til 90°, aksial kompresjon og sirkelbevegelse.',
          en: 'Flex hip and knee to 90°, axial compression and circular motion.'
        },
        positive: {
          no: 'Smerte og/eller krepitasjon i hofteleddet',
          en: 'Pain and/or crepitus in hip joint'
        },
        sensitivity: 0.62,
        specificity: 0.75
      },
      {
        id: 'patrick_faber',
        name: { no: "Patrick's (FABER) Test", en: "Patrick's (FABER) Test" },
        procedure: {
          no: 'Fleksjon, Abduksjon, Ekstern Rotasjon av hofte.',
          en: 'Flexion, Abduction, External Rotation of hip.'
        },
        positive: {
          no: 'Smerte i lyske/hofte (ikke SI-leddet)',
          en: 'Pain in groin/hip (not SI joint)'
        },
        sensitivity: 0.57,
        specificity: 0.71
      },
      {
        id: 'capsular_pattern_hip',
        name: { no: 'Kapsulært Mønster', en: 'Capsular Pattern' },
        procedure: {
          no: 'Test PROM: IR > EXT > ABD begrenset.',
          en: 'Test PROM: IR > EXT > ABD limited.'
        },
        positive: {
          no: 'Begrensning i kapsulært mønster',
          en: 'Limitation in capsular pattern'
        }
      },
      {
        id: 'morning_stiffness_hip',
        name: { no: 'Morgenstivhet <30 min', en: 'Morning Stiffness <30 min' },
        procedure: {
          no: 'Anamnese: Stivhet om morgenen som varer <30 minutter?',
          en: 'History: Stiffness in morning lasting <30 minutes?'
        },
        positive: {
          no: 'Ja (<30 min = OA, >30 min = inflammatorisk)',
          en: 'Yes (<30 min = OA, >30 min = inflammatory)'
        }
      },
      {
        id: 'age_over_50',
        name: { no: 'Alder >50 år', en: 'Age >50 years' },
        procedure: { no: 'Pasientens alder.', en: "Patient's age." },
        positive: { no: 'Alder over 50 år', en: 'Age over 50 years' }
      }
    ]
  },

  // ============================================================================
  // PERIPHERAL NERVE INJURY CLUSTERS (from Vizniak Peripheral Neuro)
  // ============================================================================

  RADIAL_NERVE_INJURY: {
    id: 'RADIAL_NERVE_INJURY',
    name: { no: 'Radialisnerve Skade', en: 'Radial Nerve Injury' },
    region: 'UPPER_EXTREMITY',
    description: {
      no: 'Skade på radialisnerven - triangulært rom, radial groove, eller albue',
      en: 'Radial nerve injury - triangular space, radial groove, or elbow'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig radialisnerve patologi. Lokaliser nivå basert på funn.',
        en: '≥3 positive = probable radial nerve pathology. Localize level based on findings.'
      }
    },
    tests: [
      {
        id: 'wrist_drop',
        name: { no: 'Wrist Drop', en: 'Wrist Drop' },
        procedure: {
          no: 'Be pasient ekstendere håndleddet mot tyngdekraften.',
          en: 'Ask patient to extend wrist against gravity.'
        },
        positive: {
          no: 'Manglende evne til håndleddsekstensjon',
          en: 'Inability to extend wrist'
        },
        clinicalNote: {
          no: 'Klassisk tegn på høy radialisskade.',
          en: 'Classic sign of high radial nerve injury.'
        }
      },
      {
        id: 'finger_extension_weakness',
        name: { no: 'Svak Fingerekstensjon', en: 'Weak Finger Extension' },
        procedure: {
          no: 'Test MCP-ledd ekstensjon mot motstand.',
          en: 'Test MCP joint extension against resistance.'
        },
        positive: {
          no: 'Svakhet i fingerekstensjon',
          en: 'Weakness in finger extension'
        }
      },
      {
        id: 'triceps_weakness',
        name: { no: 'Triceps Svakhet', en: 'Triceps Weakness' },
        procedure: {
          no: 'Test albueekstensjon mot motstand.',
          en: 'Test elbow extension against resistance.'
        },
        positive: {
          no: 'Svakhet = høy lesjon (triangulært rom)',
          en: 'Weakness = high lesion (triangular space)'
        },
        clinicalNote: {
          no: 'Hvis triceps er sterk men wrist drop = radial groove skade.',
          en: 'If triceps is strong but wrist drop = radial groove injury.'
        }
      },
      {
        id: 'triceps_reflex_radial',
        name: { no: 'Tricepsrefleks', en: 'Triceps Reflex' },
        procedure: {
          no: 'Test tricepsrefleks med reflekshammer.',
          en: 'Test triceps reflex with reflex hammer.'
        },
        positive: {
          no: 'Redusert eller fraværende tricepsrefleks',
          en: 'Reduced or absent triceps reflex'
        }
      },
      {
        id: 'sensory_loss_radial',
        name: { no: 'Sensorisk Tap (Radial)', en: 'Sensory Loss (Radial)' },
        procedure: {
          no: 'Test sensibilitet over posterior arm, underarm, og dorsal hånd (lateral 3½ fingre til DIP).',
          en: 'Test sensation over posterior arm, forearm, and dorsal hand (lateral 3½ fingers to DIP).'
        },
        positive: {
          no: 'Redusert sensibilitet i radial distribusjon',
          en: 'Reduced sensation in radial distribution'
        }
      }
    ]
  },

  MEDIAN_NERVE_INJURY: {
    id: 'MEDIAN_NERVE_INJURY',
    name: { no: 'Medianusnerve Skade', en: 'Median Nerve Injury' },
    region: 'UPPER_EXTREMITY',
    description: {
      no: 'Skade på medianusnerven - albue, pronator teres, eller håndledd',
      en: 'Median nerve injury - elbow, pronator teres, or wrist'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive = sannsynlig medianusnerve patologi.',
        en: '≥3 positive = probable median nerve pathology.'
      }
    },
    tests: [
      {
        id: 'ape_hand_deformity',
        name: { no: 'Ape Hand Deformitet', en: 'Ape Hand Deformity' },
        procedure: {
          no: 'Inspeksjon av thenareminensen. Sammenlign bilateralt.',
          en: 'Inspection of thenar eminence. Compare bilaterally.'
        },
        positive: {
          no: 'Atrofi av thenareminensen',
          en: 'Atrophy of thenar eminence'
        },
        clinicalNote: {
          no: 'Tommelen ligger i samme plan som de andre fingrene.',
          en: 'Thumb lies in same plane as other fingers.'
        }
      },
      {
        id: 'thumb_opposition_weakness',
        name: { no: 'Svak Tommelopposisjon', en: 'Weak Thumb Opposition' },
        procedure: {
          no: 'Be pasient berøre lillefingertuppens base med tommeltuppens palmarside.',
          en: 'Ask patient to touch base of little finger tip with palmar side of thumb tip.'
        },
        positive: {
          no: 'Svakhet eller manglende evne til opposisjon',
          en: 'Weakness or inability to perform opposition'
        }
      },
      {
        id: 'pronator_weakness',
        name: { no: 'Svak Pronasjon', en: 'Weak Pronation' },
        procedure: {
          no: 'Test underarmspronasjon mot motstand.',
          en: 'Test forearm pronation against resistance.'
        },
        positive: {
          no: 'Svakhet i pronasjon = høy lesjon (albue/pronator teres)',
          en: 'Weakness in pronation = high lesion (elbow/pronator teres)'
        }
      },
      {
        id: 'wrist_flexion_weakness_median',
        name: { no: 'Svak Håndleddsfleksjon (Radial)', en: 'Weak Wrist Flexion (Radial)' },
        procedure: {
          no: 'Test håndleddsfleksjon med radial deviasjon (FCR).',
          en: 'Test wrist flexion with radial deviation (FCR).'
        },
        positive: {
          no: 'Svakhet i radial håndleddsfleksjon',
          en: 'Weakness in radial wrist flexion'
        }
      },
      {
        id: 'sensory_loss_median',
        name: { no: 'Sensorisk Tap (Median)', en: 'Sensory Loss (Median)' },
        procedure: {
          no: 'Test sensibilitet over palmar overflate av lateral 3½ fingre inkludert posterior DIP.',
          en: 'Test sensation over palmar surface of lateral 3½ fingers including posterior DIPs.'
        },
        positive: {
          no: 'Redusert sensibilitet i median distribusjon',
          en: 'Reduced sensation in median distribution'
        },
        clinicalNote: {
          no: 'CTS: sparer håndflaten. Høy lesjon: inkluderer håndflaten.',
          en: 'CTS: spares palm. High lesion: includes palm.'
        }
      },
      {
        id: 'ok_sign_test',
        name: { no: 'OK-Tegn Test', en: 'OK Sign Test' },
        procedure: {
          no: 'Be pasient lage "OK" tegn med tommel og pekefinger.',
          en: 'Ask patient to make "OK" sign with thumb and index finger.'
        },
        positive: {
          no: 'Manglende evne til å lage rund sirkel (FPL/FDP svakhet)',
          en: 'Inability to make round circle (FPL/FDP weakness)'
        }
      }
    ]
  },

  ULNAR_NERVE_INJURY: {
    id: 'ULNAR_NERVE_INJURY',
    name: { no: 'Ulnarisnerve Skade', en: 'Ulnar Nerve Injury' },
    region: 'UPPER_EXTREMITY',
    description: {
      no: 'Skade på ulnarisnerven - kubitaltunnel eller Guyons kanal',
      en: 'Ulnar nerve injury - cubital tunnel or Guyon\'s canal'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive = sannsynlig ulnarisnerve patologi.',
        en: '≥3 positive = probable ulnar nerve pathology.'
      }
    },
    tests: [
      {
        id: 'claw_hand_deformity',
        name: { no: 'Kløhånd Deformitet', en: 'Claw Hand Deformity' },
        procedure: {
          no: 'Inspeksjon av hånd i hvile. MCP hyperekstensjon, IP fleksjon av 4. og 5. finger.',
          en: 'Inspection of hand at rest. MCP hyperextension, IP flexion of 4th and 5th fingers.'
        },
        positive: {
          no: 'Kløhånd deformitet (ulnar paradox: verre ved lav lesjon)',
          en: 'Claw hand deformity (ulnar paradox: worse with low lesion)'
        }
      },
      {
        id: 'froment_sign',
        name: { no: "Froment's Sign", en: "Froment's Sign" },
        procedure: {
          no: 'Be pasient holde papir mellom tommel og pekefinger. Trekk i papiret.',
          en: 'Ask patient to hold paper between thumb and index finger. Pull on paper.'
        },
        positive: {
          no: 'Fleksjon av tommelens IP-ledd for å kompensere for svak adductor pollicis',
          en: 'Flexion of thumb IP joint to compensate for weak adductor pollicis'
        },
        sensitivity: 0.82,
        specificity: 0.89
      },
      {
        id: 'wartenberg_sign',
        name: { no: "Wartenberg's Sign", en: "Wartenberg's Sign" },
        procedure: {
          no: 'Be pasient addusere fingrene. Observer lillefinger.',
          en: 'Ask patient to adduct fingers. Observe little finger.'
        },
        positive: {
          no: 'Lillefinger forblir abdusert (svak 3. palmar interosseus)',
          en: 'Little finger remains abducted (weak 3rd palmar interosseous)'
        }
      },
      {
        id: 'interossei_weakness',
        name: { no: 'Interossei Svakhet', en: 'Interossei Weakness' },
        procedure: {
          no: 'Test finger abduksjon og adduksjon mot motstand.',
          en: 'Test finger abduction and adduction against resistance.'
        },
        positive: {
          no: 'Svakhet i finger spreading/sammenklemming',
          en: 'Weakness in finger spreading/squeezing'
        }
      },
      {
        id: 'hypothenar_atrophy',
        name: { no: 'Hypothenar Atrofi', en: 'Hypothenar Atrophy' },
        procedure: {
          no: 'Inspeksjon av hypothenareminensen. Sammenlign bilateralt.',
          en: 'Inspection of hypothenar eminence. Compare bilaterally.'
        },
        positive: {
          no: 'Synlig atrofi av hypothenarmuskulatur',
          en: 'Visible atrophy of hypothenar muscles'
        }
      },
      {
        id: 'sensory_loss_ulnar',
        name: { no: 'Sensorisk Tap (Ulnar)', en: 'Sensory Loss (Ulnar)' },
        procedure: {
          no: 'Test sensibilitet over medial 1½ finger (palmar og dorsal).',
          en: 'Test sensation over medial 1½ fingers (palmar and dorsal).'
        },
        positive: {
          no: 'Redusert sensibilitet i ulnar distribusjon',
          en: 'Reduced sensation in ulnar distribution'
        }
      }
    ]
  },

  COMMON_PERONEAL_INJURY: {
    id: 'COMMON_PERONEAL_INJURY',
    name: { no: 'Peroneusnerve Skade', en: 'Common Peroneal Nerve Injury' },
    region: 'LOWER_EXTREMITY',
    description: {
      no: 'Skade på n. peroneus communis ved fibulahodet - vanligste nerveentrapment i underekstremitet',
      en: 'Common peroneal nerve injury at fibular head - most common nerve entrapment in lower extremity'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig peroneus skade. Vanlige årsaker: krysset ben, fibulabrudd, stramme støvler.',
        en: '≥3 positive = probable peroneal injury. Common causes: crossed legs, fibular fracture, tight boots.'
      }
    },
    tests: [
      {
        id: 'foot_drop',
        name: { no: 'Foot Drop', en: 'Foot Drop' },
        procedure: {
          no: 'Observer gange. Be pasient dorsiflektere foten.',
          en: 'Observe gait. Ask patient to dorsiflex foot.'
        },
        positive: {
          no: 'Manglende evne til dorsifleksjon, steppage gait',
          en: 'Inability to dorsiflex, steppage gait'
        },
        clinicalNote: {
          no: 'Steppage gait: løfter kneet høyt for å unngå å dra foten.',
          en: 'Steppage gait: lifts knee high to avoid dragging foot.'
        }
      },
      {
        id: 'tibialis_anterior_weakness',
        name: { no: 'Tibialis Anterior Svakhet', en: 'Tibialis Anterior Weakness' },
        procedure: {
          no: 'Test ankel dorsifleksjon mot motstand.',
          en: 'Test ankle dorsiflexion against resistance.'
        },
        positive: {
          no: 'Svakhet i dorsifleksjon (L4-L5)',
          en: 'Weakness in dorsiflexion (L4-L5)'
        }
      },
      {
        id: 'toe_extension_weakness',
        name: { no: 'Svak Tåekstensjon', en: 'Weak Toe Extension' },
        procedure: {
          no: 'Test EHL og EDL mot motstand.',
          en: 'Test EHL and EDL against resistance.'
        },
        positive: {
          no: 'Svakhet i tåekstensjon',
          en: 'Weakness in toe extension'
        }
      },
      {
        id: 'eversion_weakness',
        name: { no: 'Svak Eversjon', en: 'Weak Eversion' },
        procedure: {
          no: 'Test ankel eversjon mot motstand (peroneus longus/brevis).',
          en: 'Test ankle eversion against resistance (peroneus longus/brevis).'
        },
        positive: {
          no: 'Svakhet i eversjon (superfisiell gren)',
          en: 'Weakness in eversion (superficial branch)'
        }
      },
      {
        id: 'sensory_loss_peroneal',
        name: { no: 'Sensorisk Tap (Peroneal)', en: 'Sensory Loss (Peroneal)' },
        procedure: {
          no: 'Test sensibilitet over lateral legg og fotrygg.',
          en: 'Test sensation over lateral leg and dorsum of foot.'
        },
        positive: {
          no: 'Redusert sensibilitet i peroneal distribusjon',
          en: 'Reduced sensation in peroneal distribution'
        },
        clinicalNote: {
          no: 'Dyp gren: kun 1.-2. tå webspace. Superfisiell: lateral legg og fotrygg.',
          en: 'Deep branch: only 1st-2nd toe webspace. Superficial: lateral leg and dorsum.'
        }
      }
    ]
  },

  MERALGIA_PARESTHETICA: {
    id: 'MERALGIA_PARESTHETICA',
    name: { no: 'Meralgia Paresthetica', en: 'Meralgia Paresthetica' },
    region: 'LOWER_EXTREMITY',
    description: {
      no: 'Entrapment av n. cutaneus femoris lateralis ved inguinalligamentet',
      en: 'Entrapment of lateral femoral cutaneous nerve at inguinal ligament'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 4,
      interpretation: {
        no: '≥3 positive = sannsynlig meralgia paresthetica. Vanlige årsaker: stramme belter, fedme, graviditet.',
        en: '≥3 positive = probable meralgia paresthetica. Common causes: tight belts, obesity, pregnancy.'
      }
    },
    tests: [
      {
        id: 'lateral_thigh_paresthesia',
        name: { no: 'Anterolateral Lår Parestesi', en: 'Anterolateral Thigh Paresthesia' },
        procedure: {
          no: 'Anamnese: brennende, stikkende følelse på utsiden av låret?',
          en: 'History: burning, tingling sensation on outer thigh?'
        },
        positive: {
          no: 'Ja, typisk lokalisasjon for LFCN',
          en: 'Yes, typical location for LFCN'
        }
      },
      {
        id: 'sensory_only_deficit',
        name: { no: 'Kun Sensorisk Tap', en: 'Sensory Only Deficit' },
        procedure: {
          no: 'Test sensibilitet over anterolateral lår. Test motorstyrke.',
          en: 'Test sensation over anterolateral thigh. Test motor strength.'
        },
        positive: {
          no: 'Redusert sensibilitet MEN normal motorstyrke',
          en: 'Reduced sensation BUT normal motor strength'
        },
        clinicalNote: {
          no: 'LFCN er kun sensorisk - ingen motortap.',
          en: 'LFCN is sensory only - no motor loss.'
        }
      },
      {
        id: 'tight_clothing_history',
        name: { no: 'Stramme Klær/Belter', en: 'Tight Clothing/Belts' },
        procedure: {
          no: 'Anamnese: bruker stramme bukser, verktøybelter, eller politiuniform?',
          en: 'History: wears tight pants, tool belts, or police uniform?'
        },
        positive: {
          no: 'Ja, eller andre risikofaktorer (fedme, graviditet)',
          en: 'Yes, or other risk factors (obesity, pregnancy)'
        }
      },
      {
        id: 'asis_tenderness',
        name: { no: 'ASIS Ømhet', en: 'ASIS Tenderness' },
        procedure: {
          no: 'Palpér 1-2 cm medialt for ASIS der LFCN passerer under inguinalligamentet.',
          en: 'Palpate 1-2 cm medial to ASIS where LFCN passes under inguinal ligament.'
        },
        positive: {
          no: 'Ømhet og reproduksjon av parestesier',
          en: 'Tenderness and reproduction of paresthesias'
        }
      }
    ]
  },

  BRACHIAL_PLEXUS_LESION: {
    id: 'BRACHIAL_PLEXUS_LESION',
    name: { no: 'Brachial Plexus Lesjon', en: 'Brachial Plexus Lesion' },
    region: 'UPPER_EXTREMITY',
    description: {
      no: 'Skade på brachialplexus - øvre (Erb-Duchenne) eller nedre (Klumpke)',
      en: 'Brachial plexus injury - upper (Erb-Duchenne) or lower (Klumpke)'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive = sannsynlig plexus lesjon. Differensier øvre vs. nedre basert på mønster.',
        en: '≥3 positive = probable plexus lesion. Differentiate upper vs. lower based on pattern.'
      }
    },
    tests: [
      {
        id: 'waiters_tip_posture',
        name: { no: "Waiter's Tip Postur", en: "Waiter's Tip Posture" },
        procedure: {
          no: 'Observer armposisjon. Skulder innadrotert, albue ekstendert, underarm pronert?',
          en: 'Observe arm position. Shoulder internally rotated, elbow extended, forearm pronated?'
        },
        positive: {
          no: "Ja, klassisk 'waiter's tip' = øvre plexus (C5-C6, Erb)",
          en: "Yes, classic 'waiter's tip' = upper plexus (C5-C6, Erb)"
        },
        clinicalNote: {
          no: 'Vanlig etter motorsykkelulykker eller fødselsskade.',
          en: 'Common after motorcycle accidents or birth injury.'
        }
      },
      {
        id: 'deltoid_biceps_weakness',
        name: { no: 'Deltoid/Biceps Svakhet', en: 'Deltoid/Biceps Weakness' },
        procedure: {
          no: 'Test skulderabduksjon og albuefleksjon.',
          en: 'Test shoulder abduction and elbow flexion.'
        },
        positive: {
          no: 'Svakhet i begge = øvre plexus (C5-C6)',
          en: 'Weakness in both = upper plexus (C5-C6)'
        }
      },
      {
        id: 'claw_hand_plexus',
        name: { no: 'Kløhånd (Plexus)', en: 'Claw Hand (Plexus)' },
        procedure: {
          no: 'Inspeksjon av hånd. MCP hyperekstensjon med IP fleksjon?',
          en: 'Inspection of hand. MCP hyperextension with IP flexion?'
        },
        positive: {
          no: 'Kløhånd = nedre plexus (C8-T1, Klumpke)',
          en: 'Claw hand = lower plexus (C8-T1, Klumpke)'
        }
      },
      {
        id: 'intrinsic_hand_weakness',
        name: { no: 'Intrinsik Håndmuskel Svakhet', en: 'Intrinsic Hand Muscle Weakness' },
        procedure: {
          no: 'Test interossei, thenar, og hypothenar muskler.',
          en: 'Test interossei, thenar, and hypothenar muscles.'
        },
        positive: {
          no: 'Generell svakhet i intrinsikk muskler = nedre plexus',
          en: 'General weakness in intrinsic muscles = lower plexus'
        }
      },
      {
        id: 'horner_syndrome',
        name: { no: 'Horners Syndrom', en: 'Horner Syndrome' },
        procedure: {
          no: 'Observer for ptose, miose, og anhydrose på samme side.',
          en: 'Observe for ptosis, miosis, and anhydrosis on same side.'
        },
        positive: {
          no: 'Tilstede = nedre plexus med T1 involvering',
          en: 'Present = lower plexus with T1 involvement'
        },
        redFlag: true,
        redFlagCondition: 'Indicates T1 root avulsion - severe injury'
      },
      {
        id: 'trauma_mechanism',
        name: { no: 'Traumemekanisme', en: 'Trauma Mechanism' },
        procedure: {
          no: 'Fall fra motorsykkel/hest, fødselstrauma, eller arm trukket opp?',
          en: 'Fall from motorcycle/horse, birth trauma, or arm pulled upward?'
        },
        positive: {
          no: 'Ja, typisk skadevmekanisme for plexusskade',
          en: 'Yes, typical injury mechanism for plexus injury'
        }
      }
    ]
  },

  // ============================================================================
  // ADDITIONAL PERIPHERAL NERVE CLUSTERS
  // ============================================================================

  SCIATIC_NERVE_INJURY: {
    id: 'SCIATIC_NERVE_INJURY',
    name: { no: 'Iskiasnerve Skade', en: 'Sciatic Nerve Injury' },
    region: 'LOWER_EXTREMITY',
    description: {
      no: 'Skade på n. ischiadicus - fra glutealregion til poplitea',
      en: 'Sciatic nerve injury - from gluteal region to popliteal fossa'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        no: '≥3 positive = sannsynlig iskiasskade. Differensier fra lumbal radikulopati og piriformis.',
        en: '≥3 positive = probable sciatic injury. Differentiate from lumbar radiculopathy and piriformis.'
      }
    },
    tests: [
      {
        id: 'combined_foot_drop_plantar',
        name: { no: 'Kombinert Foot Drop + Plantarfleksjon Svakhet', en: 'Combined Foot Drop + Plantar Flexion Weakness' },
        procedure: {
          no: 'Test både dorsifleksjon OG plantarfleksjon av ankel.',
          en: 'Test both dorsiflexion AND plantar flexion of ankle.'
        },
        positive: {
          no: 'Svakhet i begge retninger (både tibial og peroneal komponenter)',
          en: 'Weakness in both directions (both tibial and peroneal components)'
        },
        clinicalNote: {
          no: 'Isolert foot drop = peroneal. Kombinert = høyere iskiasskade.',
          en: 'Isolated foot drop = peroneal. Combined = higher sciatic injury.'
        }
      },
      {
        id: 'hamstring_weakness',
        name: { no: 'Hamstring Svakhet', en: 'Hamstring Weakness' },
        procedure: {
          no: 'Test knefleksjon mot motstand i mageleie.',
          en: 'Test knee flexion against resistance in prone.'
        },
        positive: {
          no: 'Svakhet i knefleksjon (semimembranosus, semitendinosus, biceps femoris)',
          en: 'Weakness in knee flexion (semimembranosus, semitendinosus, biceps femoris)'
        }
      },
      {
        id: 'sensory_loss_posterior_leg',
        name: { no: 'Sensorisk Tap Posterior Lår/Legg', en: 'Sensory Loss Posterior Thigh/Leg' },
        procedure: {
          no: 'Test sensibilitet over posterior lår, legg, og hele foten.',
          en: 'Test sensation over posterior thigh, leg, and entire foot.'
        },
        positive: {
          no: 'Redusert sensibilitet i iskias distribusjon',
          en: 'Reduced sensation in sciatic distribution'
        }
      },
      {
        id: 'achilles_reflex_absent',
        name: { no: 'Akillesrefleks Fraværende', en: 'Achilles Reflex Absent' },
        procedure: {
          no: 'Test akillesrefleks bilateralt.',
          en: 'Test Achilles reflex bilaterally.'
        },
        positive: {
          no: 'Fraværende eller markant redusert akillesrefleks',
          en: 'Absent or markedly reduced Achilles reflex'
        }
      },
      {
        id: 'trauma_gluteal_region',
        name: { no: 'Traume til Glutealregion', en: 'Trauma to Gluteal Region' },
        procedure: {
          no: 'Historie: intramuskulær injeksjon, hoftebrudd, hofteluksasjon, eller direkte traume?',
          en: 'History: intramuscular injection, hip fracture, hip dislocation, or direct trauma?'
        },
        positive: {
          no: 'Ja, typisk mekanisme for iskiasskade',
          en: 'Yes, typical mechanism for sciatic injury'
        }
      },
      {
        id: 'slr_positive_sciatic',
        name: { no: 'SLR Positiv', en: 'SLR Positive' },
        procedure: {
          no: 'Straight Leg Raise test.',
          en: 'Straight Leg Raise test.'
        },
        positive: {
          no: 'Radierende smerte langs iskias forløp',
          en: 'Radiating pain along sciatic course'
        },
        clinicalNote: {
          no: 'Differensier fra lumbal diskusprolaps med nevrologisk undersøkelse.',
          en: 'Differentiate from lumbar disc herniation with neurological exam.'
        }
      }
    ]
  },

  AXILLARY_NERVE_INJURY: {
    id: 'AXILLARY_NERVE_INJURY',
    name: { no: 'Axillarisnerve Skade', en: 'Axillary Nerve Injury' },
    region: 'UPPER_EXTREMITY',
    description: {
      no: 'Skade på n. axillaris i quadrangulært rom - ofte ved skulderluksasjon',
      en: 'Axillary nerve injury in quadrangular space - often with shoulder dislocation'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 4,
      interpretation: {
        no: '≥3 positive = sannsynlig axillarisskade. Vanlig komplikasjon ved anterior skulderluksasjon.',
        en: '≥3 positive = probable axillary injury. Common complication of anterior shoulder dislocation.'
      }
    },
    tests: [
      {
        id: 'deltoid_weakness',
        name: { no: 'Deltoid Svakhet', en: 'Deltoid Weakness' },
        procedure: {
          no: 'Test skulderabduksjon mot motstand (0-90°).',
          en: 'Test shoulder abduction against resistance (0-90°).'
        },
        positive: {
          no: 'Markant svakhet i skulderabduksjon',
          en: 'Marked weakness in shoulder abduction'
        }
      },
      {
        id: 'deltoid_atrophy',
        name: { no: 'Deltoid Atrofi', en: 'Deltoid Atrophy' },
        procedure: {
          no: 'Inspeksjon av skulderkontur. Sammenlign bilateralt.',
          en: 'Inspection of shoulder contour. Compare bilaterally.'
        },
        positive: {
          no: 'Flat skulderkontur, synlig atrofi av deltoid',
          en: 'Flat shoulder contour, visible deltoid atrophy'
        }
      },
      {
        id: 'regimental_badge_sensory',
        name: { no: 'Regimental Badge Sensorisk Tap', en: 'Regimental Badge Sensory Loss' },
        procedure: {
          no: 'Test sensibilitet over lateral skulder (regimental badge area).',
          en: 'Test sensation over lateral shoulder (regimental badge area).'
        },
        positive: {
          no: 'Redusert sensibilitet over lateral skulder',
          en: 'Reduced sensation over lateral shoulder'
        },
        clinicalNote: {
          no: 'Patognomonisk for axillarisskade.',
          en: 'Pathognomonic for axillary nerve injury.'
        }
      },
      {
        id: 'shoulder_dislocation_history',
        name: { no: 'Skulderluksasjon i Anamnesen', en: 'Shoulder Dislocation History' },
        procedure: {
          no: 'Historie: nylig skulderluksasjon, humerusfraktur, eller direkte traume?',
          en: 'History: recent shoulder dislocation, humeral fracture, or direct trauma?'
        },
        positive: {
          no: 'Ja, typisk skadevmekanisme',
          en: 'Yes, typical injury mechanism'
        }
      }
    ]
  },

  FEMORAL_NERVE_INJURY: {
    id: 'FEMORAL_NERVE_INJURY',
    name: { no: 'Femoralnerve Skade', en: 'Femoral Nerve Injury' },
    region: 'LOWER_EXTREMITY',
    description: {
      no: 'Skade på n. femoralis - hoftefleksjon og kneekstensjon affisert',
      en: 'Femoral nerve injury - hip flexion and knee extension affected'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig femoralnerve skade.',
        en: '≥3 positive = probable femoral nerve injury.'
      }
    },
    tests: [
      {
        id: 'quadriceps_weakness',
        name: { no: 'Quadriceps Svakhet', en: 'Quadriceps Weakness' },
        procedure: {
          no: 'Test kneekstensjon mot motstand i sittende.',
          en: 'Test knee extension against resistance while seated.'
        },
        positive: {
          no: 'Markant svakhet i kneekstensjon',
          en: 'Marked weakness in knee extension'
        }
      },
      {
        id: 'knee_buckling',
        name: { no: 'Kne Gir Etter', en: 'Knee Buckling' },
        procedure: {
          no: 'Observer gange. Spør om kneet gir etter ved trapper.',
          en: 'Observe gait. Ask if knee buckles on stairs.'
        },
        positive: {
          no: 'Kneet gir etter, spesielt ved trapper',
          en: 'Knee gives way, especially on stairs'
        }
      },
      {
        id: 'patellar_reflex_absent',
        name: { no: 'Patellarrefleks Fraværende', en: 'Patellar Reflex Absent' },
        procedure: {
          no: 'Test patellarrefleks (L4).',
          en: 'Test patellar reflex (L4).'
        },
        positive: {
          no: 'Fraværende eller markant redusert patellarrefleks',
          en: 'Absent or markedly reduced patellar reflex'
        }
      },
      {
        id: 'sensory_loss_anterior_thigh',
        name: { no: 'Sensorisk Tap Anterior Lår', en: 'Sensory Loss Anterior Thigh' },
        procedure: {
          no: 'Test sensibilitet over anterior lår og medial legg (saphenous).',
          en: 'Test sensation over anterior thigh and medial leg (saphenous).'
        },
        positive: {
          no: 'Redusert sensibilitet i femoral/saphenous distribusjon',
          en: 'Reduced sensation in femoral/saphenous distribution'
        }
      },
      {
        id: 'hip_flexion_weakness',
        name: { no: 'Hoftefleksjon Svakhet', en: 'Hip Flexion Weakness' },
        procedure: {
          no: 'Test hoftefleksjon mot motstand (iliopsoas).',
          en: 'Test hip flexion against resistance (iliopsoas).'
        },
        positive: {
          no: 'Svakhet i hoftefleksjon',
          en: 'Weakness in hip flexion'
        }
      }
    ]
  },

  TIBIAL_NERVE_INJURY: {
    id: 'TIBIAL_NERVE_INJURY',
    name: { no: 'Tibialnerve Skade', en: 'Tibial Nerve Injury' },
    region: 'LOWER_EXTREMITY',
    description: {
      no: 'Skade på n. tibialis - plantarfleksjon og fotsensibilitet affisert',
      en: 'Tibial nerve injury - plantar flexion and foot sensation affected'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = sannsynlig tibialnerve skade.',
        en: '≥3 positive = probable tibial nerve injury.'
      }
    },
    tests: [
      {
        id: 'plantar_flexion_weakness',
        name: { no: 'Plantarfleksjon Svakhet', en: 'Plantar Flexion Weakness' },
        procedure: {
          no: 'Test ankel plantarfleksjon mot motstand. Be pasient gå på tå.',
          en: 'Test ankle plantar flexion against resistance. Ask patient to walk on toes.'
        },
        positive: {
          no: 'Svakhet i plantarfleksjon, kan ikke gå på tå',
          en: 'Weakness in plantar flexion, cannot walk on toes'
        }
      },
      {
        id: 'toe_flexion_weakness',
        name: { no: 'Tåfleksjon Svakhet', en: 'Toe Flexion Weakness' },
        procedure: {
          no: 'Test fleksjon av tærne mot motstand.',
          en: 'Test toe flexion against resistance.'
        },
        positive: {
          no: 'Svakhet i tåfleksjon (FDL, FHL)',
          en: 'Weakness in toe flexion (FDL, FHL)'
        }
      },
      {
        id: 'sensory_loss_sole',
        name: { no: 'Sensorisk Tap Fotsåle', en: 'Sensory Loss Sole of Foot' },
        procedure: {
          no: 'Test sensibilitet over fotsålen (medial og lateral plantar).',
          en: 'Test sensation over sole of foot (medial and lateral plantar).'
        },
        positive: {
          no: 'Redusert sensibilitet over fotsålen',
          en: 'Reduced sensation over sole of foot'
        }
      },
      {
        id: 'achilles_reflex_tibial',
        name: { no: 'Akillesrefleks', en: 'Achilles Reflex' },
        procedure: {
          no: 'Test akillesrefleks.',
          en: 'Test Achilles reflex.'
        },
        positive: {
          no: 'Fraværende eller redusert akillesrefleks',
          en: 'Absent or reduced Achilles reflex'
        }
      },
      {
        id: 'intrinsic_foot_weakness',
        name: { no: 'Intrinsikk Fotmuskel Svakhet', en: 'Intrinsic Foot Muscle Weakness' },
        procedure: {
          no: 'Test tå abduksjon og adduksjon.',
          en: 'Test toe abduction and adduction.'
        },
        positive: {
          no: 'Svakhet og mulig atrofi av intrinsikk fotmuskler',
          en: 'Weakness and possible atrophy of intrinsic foot muscles'
        }
      }
    ]
  },

  // ============================================================================
  // ADDITIONAL ELBOW CLUSTERS
  // ============================================================================

  OLECRANON_BURSITIS: {
    id: 'OLECRANON_BURSITIS',
    name: { no: 'Olecranon Bursitt', en: 'Olecranon Bursitis' },
    region: 'ELBOW_FOREARM',
    description: {
      no: 'Inflammasjon av bursa over olecranon - "student elbow"',
      en: 'Inflammation of bursa over olecranon - "student elbow"'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 4,
      interpretation: {
        no: '≥3 positive = sannsynlig olecranon bursitt. Utelukk septisk bursitt!',
        en: '≥3 positive = probable olecranon bursitis. Rule out septic bursitis!'
      }
    },
    tests: [
      {
        id: 'olecranon_swelling',
        name: { no: 'Olecranon Hevelse', en: 'Olecranon Swelling' },
        procedure: {
          no: 'Inspeksjon av posterior albue. Sammenlign bilateralt.',
          en: 'Inspection of posterior elbow. Compare bilaterally.'
        },
        positive: {
          no: 'Synlig, avgrenset hevelse over olecranon',
          en: 'Visible, localized swelling over olecranon'
        }
      },
      {
        id: 'fluctuant_mass',
        name: { no: 'Fluktuerend Masse', en: 'Fluctuant Mass' },
        procedure: {
          no: 'Palpér hevelsen over olecranon.',
          en: 'Palpate swelling over olecranon.'
        },
        positive: {
          no: 'Myk, fluktuerend masse (væskefylt)',
          en: 'Soft, fluctuant mass (fluid-filled)'
        }
      },
      {
        id: 'rom_preserved',
        name: { no: 'ROM Bevart', en: 'ROM Preserved' },
        procedure: {
          no: 'Test albue ROM - fleksjon og ekstensjon.',
          en: 'Test elbow ROM - flexion and extension.'
        },
        positive: {
          no: 'Full ROM bevart (bursa er ekstraartikulær)',
          en: 'Full ROM preserved (bursa is extra-articular)'
        },
        clinicalNote: {
          no: 'Bevart ROM differensierer fra intraartikulær patologi.',
          en: 'Preserved ROM differentiates from intra-articular pathology.'
        }
      },
      {
        id: 'septic_signs',
        name: { no: 'Septiske Tegn (Rødt Flagg)', en: 'Septic Signs (Red Flag)' },
        procedure: {
          no: 'Erythem, varme, feber, eller åpen sår?',
          en: 'Erythema, warmth, fever, or open wound?'
        },
        positive: {
          no: 'Tilstede = mulig septisk bursitt, krever aspirasjon',
          en: 'Present = possible septic bursitis, requires aspiration'
        },
        redFlag: true,
        redFlagCondition: 'Suspect septic bursitis - aspiration and culture needed'
      }
    ]
  },

  ELBOW_OCD: {
    id: 'ELBOW_OCD',
    name: { no: 'Osteochondritis Dissecans (Albue)', en: 'Osteochondritis Dissecans (Elbow)' },
    region: 'ELBOW_FOREARM',
    description: {
      no: 'OCD av capitellum - vanlig hos unge kastere og gymnaster',
      en: 'OCD of capitellum - common in young throwers and gymnasts'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive hos ung atlet = MR anbefalt. Tidlig diagnose viktig for prognose.',
        en: '≥3 positive in young athlete = MRI recommended. Early diagnosis important for prognosis.'
      }
    },
    tests: [
      {
        id: 'lateral_elbow_pain',
        name: { no: 'Lateral Albuesmerte', en: 'Lateral Elbow Pain' },
        procedure: {
          no: 'Anamnese: smerte over lateral albue, spesielt ved aktivitet?',
          en: 'History: pain over lateral elbow, especially with activity?'
        },
        positive: {
          no: 'Ja, lokalisert til capitellum/radiocapitellar ledd',
          en: 'Yes, localized to capitellum/radiocapitellar joint'
        }
      },
      {
        id: 'loss_of_extension',
        name: { no: 'Tap av Full Ekstensjon', en: 'Loss of Full Extension' },
        procedure: {
          no: 'Test albue ROM. Sammenlign bilateralt.',
          en: 'Test elbow ROM. Compare bilaterally.'
        },
        positive: {
          no: 'Manglende full ekstensjon (fleksjons kontraktur)',
          en: 'Lacking full extension (flexion contracture)'
        }
      },
      {
        id: 'mechanical_symptoms_elbow',
        name: { no: 'Mekaniske Symptomer', en: 'Mechanical Symptoms' },
        procedure: {
          no: 'Anamnese: låsing, klikking, eller catching i albuen?',
          en: 'History: locking, clicking, or catching in elbow?'
        },
        positive: {
          no: 'Ja = mulig løs kropp',
          en: 'Yes = possible loose body'
        }
      },
      {
        id: 'radiocapitellar_tenderness',
        name: { no: 'Radiocapitellar Ømhet', en: 'Radiocapitellar Tenderness' },
        procedure: {
          no: 'Palpér radiocapitellare leddet med albue i 90° fleksjon.',
          en: 'Palpate radiocapitellar joint with elbow in 90° flexion.'
        },
        positive: {
          no: 'Lokal ømhet over capitellum',
          en: 'Local tenderness over capitellum'
        }
      },
      {
        id: 'young_overhead_athlete',
        name: { no: 'Ung Overhead Atlet', en: 'Young Overhead Athlete' },
        procedure: {
          no: 'Alder 10-16, kaster (baseball), gymnast, eller tennis?',
          en: 'Age 10-16, thrower (baseball), gymnast, or tennis?'
        },
        positive: {
          no: 'Ja, typisk demografi for OCD',
          en: 'Yes, typical demographics for OCD'
        }
      }
    ]
  },

  // ============================================================================
  // ADDITIONAL WRIST/HAND CLUSTERS
  // ============================================================================

  KIENBOCK_LUNATE: {
    id: 'KIENBOCK_LUNATE',
    name: { no: "Kienböck's Sykdom / Lunatum Patologi", en: "Kienböck's Disease / Lunate Pathology" },
    region: 'WRIST_HAND',
    description: {
      no: 'Avaskulær nekrose av lunatum - progressiv håndleddssmerte',
      en: 'Avascular necrosis of lunate - progressive wrist pain'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = MR/CT anbefalt. Lichtman staging for behandlingsvalg.',
        en: '≥3 positive = MRI/CT recommended. Lichtman staging for treatment decisions.'
      }
    },
    tests: [
      {
        id: 'dorsal_wrist_pain_lunate',
        name: { no: 'Dorsal Sentral Håndleddssmerte', en: 'Dorsal Central Wrist Pain' },
        procedure: {
          no: 'Anamnese: snikende smerte dorsalt sentralt på håndleddet?',
          en: 'History: insidious pain dorsally central on wrist?'
        },
        positive: {
          no: 'Ja, gradvis debut uten spesifikt traume',
          en: 'Yes, gradual onset without specific trauma'
        }
      },
      {
        id: 'lunate_tenderness',
        name: { no: 'Lunatum Ømhet', en: 'Lunate Tenderness' },
        procedure: {
          no: 'Palpér lunatum dorsalt (i linje med 3. metacarpal, proksimalt for capitatum).',
          en: 'Palpate lunate dorsally (in line with 3rd metacarpal, proximal to capitate).'
        },
        positive: {
          no: 'Lokal ømhet over lunatum',
          en: 'Local tenderness over lunate'
        }
      },
      {
        id: 'decreased_grip_strength',
        name: { no: 'Redusert Gripestyrke', en: 'Decreased Grip Strength' },
        procedure: {
          no: 'Test gripestyrke med dynamometer. Sammenlign bilateralt.',
          en: 'Test grip strength with dynamometer. Compare bilaterally.'
        },
        positive: {
          no: 'Markant redusert gripestyrke',
          en: 'Markedly reduced grip strength'
        }
      },
      {
        id: 'wrist_rom_limited',
        name: { no: 'Begrenset Håndledds ROM', en: 'Limited Wrist ROM' },
        procedure: {
          no: 'Test håndledds fleksjon/ekstensjon.',
          en: 'Test wrist flexion/extension.'
        },
        positive: {
          no: 'Begrenset ROM, spesielt ekstensjon',
          en: 'Limited ROM, especially extension'
        }
      },
      {
        id: 'ulnar_minus_variance',
        name: { no: 'Ulna Minus Varians', en: 'Ulna Minus Variance' },
        procedure: {
          no: 'Kort ulna relativt til radius (ses på røntgen).',
          en: 'Short ulna relative to radius (seen on x-ray).'
        },
        positive: {
          no: 'Ulna minus = risikofaktor for Kienböck',
          en: 'Ulna minus = risk factor for Kienböck'
        },
        clinicalNote: {
          no: 'Økt belastning på lunatum ved kort ulna.',
          en: 'Increased load on lunate with short ulna.'
        }
      }
    ]
  },

  // ============================================================================
  // ADDITIONAL SHOULDER CLUSTERS
  // ============================================================================

  GLENOHUMERAL_ARTHRITIS: {
    id: 'GLENOHUMERAL_ARTHRITIS',
    name: { no: 'Glenohumeral Artrose', en: 'Glenohumeral Arthritis' },
    region: 'SHOULDER',
    description: {
      no: 'Degenerativ leddsykdom i glenohumeralleddet',
      en: 'Degenerative joint disease of glenohumeral joint'
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 6,
      interpretation: {
        no: '≥4 positive = sannsynlig GH artrose. Røntgen bekrefter.',
        en: '≥4 positive = probable GH arthritis. X-ray confirms.'
      }
    },
    tests: [
      {
        id: 'glenohumeral_crepitus',
        name: { no: 'Glenohumeral Krepitasjon', en: 'Glenohumeral Crepitus' },
        procedure: {
          no: 'Palpér GH-leddet under passiv ROM.',
          en: 'Palpate GH joint during passive ROM.'
        },
        positive: {
          no: 'Palpabel/hørbar krepitasjon',
          en: 'Palpable/audible crepitus'
        }
      },
      {
        id: 'global_rom_loss_shoulder',
        name: { no: 'Global ROM Tap', en: 'Global ROM Loss' },
        procedure: {
          no: 'Test AROM og PROM i alle retninger.',
          en: 'Test AROM and PROM in all directions.'
        },
        positive: {
          no: 'Begrenset bevegelse i alle retninger, kapsulært mønster',
          en: 'Limited motion in all directions, capsular pattern'
        }
      },
      {
        id: 'posterior_joint_line_tenderness',
        name: { no: 'Posterior Leddlinje Ømhet', en: 'Posterior Joint Line Tenderness' },
        procedure: {
          no: 'Palpér posterior GH-leddlinje.',
          en: 'Palpate posterior GH joint line.'
        },
        positive: {
          no: 'Ømhet over posterior leddspalte',
          en: 'Tenderness over posterior joint line'
        }
      },
      {
        id: 'age_over_60_shoulder',
        name: { no: 'Alder >60 år', en: 'Age >60 years' },
        procedure: { no: 'Pasientens alder.', en: "Patient's age." },
        positive: { no: 'Alder over 60 år', en: 'Age over 60 years' }
      },
      {
        id: 'gradual_onset_shoulder',
        name: { no: 'Gradvis Debut', en: 'Gradual Onset' },
        procedure: {
          no: 'Anamnese: gradvis økende stivhet og smerte over måneder/år?',
          en: 'History: gradually increasing stiffness and pain over months/years?'
        },
        positive: {
          no: 'Ja, typisk for degenerativ prosess',
          en: 'Yes, typical for degenerative process'
        }
      },
      {
        id: 'night_pain_oa',
        name: { no: 'Nattesmerte', en: 'Night Pain' },
        procedure: {
          no: 'Anamnese: smerte om natten, spesielt ved ligge på affisert side?',
          en: 'History: pain at night, especially when lying on affected side?'
        },
        positive: {
          no: 'Ja, forstyrrer søvn',
          en: 'Yes, disturbs sleep'
        }
      }
    ]
  },

  CALCIFIC_TENDINOPATHY: {
    id: 'CALCIFIC_TENDINOPATHY',
    name: { no: 'Kalsifiserende Tendinopati', en: 'Calcific Tendinopathy' },
    region: 'SHOULDER',
    description: {
      no: 'Kalsiumavleiring i rotator cuff sener - oftest supraspinatus',
      en: 'Calcium deposit in rotator cuff tendons - most often supraspinatus'
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 5,
      interpretation: {
        no: '≥3 positive = røntgen anbefalt. Behandling avhenger av fase (formativ, resorptiv).',
        en: '≥3 positive = x-ray recommended. Treatment depends on phase (formative, resorptive).'
      }
    },
    tests: [
      {
        id: 'acute_severe_pain',
        name: { no: 'Akutt Intens Smerte', en: 'Acute Severe Pain' },
        procedure: {
          no: 'Anamnese: plutselig intens skuldersmerte uten traume?',
          en: 'History: sudden intense shoulder pain without trauma?'
        },
        positive: {
          no: 'Ja, spesielt om natten (resorptiv fase)',
          en: 'Yes, especially at night (resorptive phase)'
        },
        clinicalNote: {
          no: 'Resorptiv fase: akutt, intens smerte. Formativ: kronisk, mild smerte.',
          en: 'Resorptive phase: acute, intense pain. Formative: chronic, mild pain.'
        }
      },
      {
        id: 'supraspinatus_tenderness',
        name: { no: 'Supraspinatus Ømhet', en: 'Supraspinatus Tenderness' },
        procedure: {
          no: 'Palpér supraspinatus sene anteriort til acromion.',
          en: 'Palpate supraspinatus tendon anterior to acromion.'
        },
        positive: {
          no: 'Lokal ømhet over supraspinatus insertasjon',
          en: 'Local tenderness over supraspinatus insertion'
        }
      },
      {
        id: 'painful_arc_calcific',
        name: { no: 'Painful Arc', en: 'Painful Arc' },
        procedure: {
          no: 'Aktiv abduksjon gjennom full ROM.',
          en: 'Active abduction through full ROM.'
        },
        positive: {
          no: 'Smerte mellom 60-120° (subacromial impingement)',
          en: 'Pain between 60-120° (subacromial impingement)'
        }
      },
      {
        id: 'limited_abduction_acute',
        name: { no: 'Begrenset Abduksjon (Akutt)', en: 'Limited Abduction (Acute)' },
        procedure: {
          no: 'Test aktiv skulderabduksjon.',
          en: 'Test active shoulder abduction.'
        },
        positive: {
          no: 'Sterkt begrenset pga smerte i akutt fase',
          en: 'Severely limited due to pain in acute phase'
        }
      },
      {
        id: 'age_40_60',
        name: { no: 'Alder 40-60 år', en: 'Age 40-60 years' },
        procedure: { no: 'Pasientens alder.', en: "Patient's age." },
        positive: {
          no: 'Alder 40-60, kvinne > mann',
          en: 'Age 40-60, female > male'
        }
      }
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate cluster score based on test results
 */
export function calculateOrthoClusterScore(clusterId, testResults) {
  const cluster = ORTHO_EXAM_CLUSTERS[clusterId];
  if (!cluster) return null;

  const positiveTests = cluster.tests.filter(test =>
    testResults[test.id]?.result === 'positive'
  );

  const score = {
    clusterId,
    clusterName: cluster.name,
    positive: positiveTests.length,
    total: cluster.tests.length,
    threshold: cluster.diagnosticCriteria.threshold,
    meetsThreshold: positiveTests.length >= cluster.diagnosticCriteria.threshold,
    interpretation: cluster.diagnosticCriteria.interpretation,
    positiveTests: positiveTests.map(t => t.name),
    isRedFlagCluster: cluster.redFlagCluster || false
  };

  return score;
}

/**
 * Check for red flags in test results
 */
export function checkOrthoRedFlags(testResults) {
  const redFlags = [];

  Object.entries(ORTHO_EXAM_CLUSTERS).forEach(([clusterId, cluster]) => {
    cluster.tests.forEach(test => {
      if (test.redFlag && testResults[test.id]?.result === 'positive') {
        redFlags.push({
          clusterId,
          testId: test.id,
          testName: test.name,
          condition: test.redFlagCondition,
          urgency: cluster.urgency || 'URGENT',
          action: cluster.urgency === 'IMMEDIATE'
            ? 'AKUTT HENVISNING - Ring legevakt/ambulanse'
            : 'Henvisning til bildediagnostikk/spesialist'
        });
      }
    });

    // Check if red flag cluster threshold is met
    if (cluster.redFlagCluster) {
      const score = calculateOrthoClusterScore(clusterId, testResults);
      if (score?.meetsThreshold) {
        redFlags.push({
          clusterId,
          clusterName: cluster.name,
          urgency: cluster.urgency || 'URGENT',
          action: cluster.urgency === 'IMMEDIATE'
            ? 'AKUTT HENVISNING PÅKREVD'
            : 'Henvisning til spesialist anbefalt'
        });
      }
    }
  });

  return redFlags;
}

/**
 * Generate clinical narrative from orthopedic exam
 */
export function generateOrthoNarrative(examData, language = 'no') {
  const lines = [];
  const lang = language === 'no' ? 'no' : 'en';

  Object.entries(examData.clusterResults || {}).forEach(([clusterId, results]) => {
    const cluster = ORTHO_EXAM_CLUSTERS[clusterId];
    if (!cluster) return;

    const score = calculateOrthoClusterScore(clusterId, results);
    if (!score) return;

    // Cluster header
    lines.push(`\n**${cluster.name[lang]}** (${score.positive}/${score.total}):`);

    // List positive tests
    cluster.tests.forEach(test => {
      const result = results[test.id];
      if (result?.result === 'positive') {
        let testLine = `- ${test.name[lang]}: ${lang === 'no' ? 'Positiv' : 'Positive'}`;
        if (result.side) {
          testLine += ` (${result.side})`;
        }
        if (result.notes) {
          testLine += ` - ${result.notes}`;
        }
        lines.push(testLine);
      } else if (result?.result === 'negative') {
        lines.push(`- ${test.name[lang]}: ${lang === 'no' ? 'Negativ' : 'Negative'}`);
      }
    });

    // Add interpretation if threshold met
    if (score.meetsThreshold) {
      lines.push(`\n*${score.interpretation[lang]}*`);
    }
  });

  // Add red flag warnings
  if (examData.redFlags?.length > 0) {
    lines.push(`\n⚠️ **${lang === 'no' ? 'RØDE FLAGG' : 'RED FLAGS'}:**`);
    examData.redFlags.forEach(rf => {
      lines.push(`- ${rf.testName?.[lang] || rf.clusterName?.[lang]}: ${rf.action}`);
    });
  }

  return lines.join('\n');
}

/**
 * Get clusters by body region
 */
export function getClustersByRegion(region) {
  return Object.values(ORTHO_EXAM_CLUSTERS).filter(c => c.region === region);
}

/**
 * Get all available body regions
 */
export function getAvailableRegions() {
  const regions = new Set();
  Object.values(ORTHO_EXAM_CLUSTERS).forEach(c => regions.add(c.region));
  return Array.from(regions);
}

export default ORTHO_EXAM_CLUSTERS;
