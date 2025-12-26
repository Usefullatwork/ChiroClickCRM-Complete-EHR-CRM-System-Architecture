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
