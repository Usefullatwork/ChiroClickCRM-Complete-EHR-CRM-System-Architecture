/**
 * Template Data for Anatomy Components
 * Quick-insert templates for MuscleMap and AnatomicalSpine
 */

// Muscle-specific templates for quick documentation
export const MUSCLE_TEMPLATES = {
  // Neck muscles
  sternocleidomastoid_r: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP SCM høyre med referering til øye og tinning' },
      { type: 'hypertonicity', text: 'Hypertont SCM høyre, økt ved rotasjon venstre' },
      { type: 'shortness', text: 'Forkortet SCM høyre, begrenset rotasjon venstre' }
    ],
    treatments: [
      'Ischemic compression SCM TrP',
      'PIR stretching SCM',
      'Muscle energy technique cervical rotasjon'
    ]
  },
  upper_trapezius_r: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP øvre trapezius høyre med referert smerte suboccipitalt' },
      { type: 'hypertonicity', text: 'Markert hypertonus øvre trapezius høyre' },
      { type: 'trigger_point', text: 'Latente TrP ved skulder-nakke overgang' }
    ],
    treatments: [
      'Myofascial release øvre trapezius',
      'Ischemic compression TrP',
      'Cross-fiber friction',
      'Upper trapezius stretch veiledning'
    ]
  },
  upper_trapezius_l: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP øvre trapezius venstre med referert smerte suboccipitalt' },
      { type: 'hypertonicity', text: 'Markert hypertonus øvre trapezius venstre' }
    ],
    treatments: [
      'Myofascial release øvre trapezius',
      'Ischemic compression TrP'
    ]
  },
  levator_scapulae_r: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP levator scapulae høyre ved scapula angulus' },
      { type: 'shortness', text: 'Forkortet levator scapulae høyre med elvation av scapula' },
      { type: 'hypertonicity', text: 'Hypertont levator scapulae med nakkestivhet' }
    ],
    treatments: [
      'Ischemic compression levator scapulae TrP',
      'PIR stretch levator scapulae',
      'Active release technique',
      'Levator stretch veiledning (45 grader rotasjon)'
    ]
  },
  suboccipitals: {
    findings: [
      { type: 'trigger_point', text: 'Bilaterale TrP suboccipitaler med cervikogen hodepine' },
      { type: 'hypertonicity', text: 'Markert hypertonus suboccipitale muskler' },
      { type: 'shortness', text: 'Forkortede suboccipitaler med fremoverskutt hode' }
    ],
    treatments: [
      'Suboccipital release supine',
      'Inhibisjonsteknikk occipital base',
      'Cranio-cervical flexion exercise veiledning'
    ]
  },

  // Back muscles
  erector_spinae_r: {
    findings: [
      { type: 'hypertonicity', text: 'Hypertont erector spinae høyre L1-S1' },
      { type: 'trigger_point', text: 'Multiple TrP erector spinae thorakolumbalt' },
      { type: 'adhesion', text: 'Fasciale adhesjoner thorakolumbal fascie høyre' }
    ],
    treatments: [
      'Muscle stripping erector spinae',
      'Myofascial release thorakolumbal fascie',
      'Cross-fiber friction paraspinals',
      'Foam roller veiledning'
    ]
  },
  erector_spinae_l: {
    findings: [
      { type: 'hypertonicity', text: 'Hypertont erector spinae venstre L1-S1' },
      { type: 'trigger_point', text: 'Multiple TrP erector spinae thorakolumbalt' }
    ],
    treatments: [
      'Muscle stripping erector spinae',
      'Myofascial release thorakolumbal fascie'
    ]
  },
  quadratus_lumborum_r: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP QL høyre med referering til SI-ledd og lateral hofte' },
      { type: 'hypertonicity', text: 'Hypertont QL høyre, bekkenelevation høyre' },
      { type: 'shortness', text: 'Forkortet QL høyre med lateral shift' }
    ],
    treatments: [
      'Ischemic compression QL TrP',
      'Side-lying QL stretch',
      'PIR QL release',
      'Lateral shift korrigering'
    ]
  },
  quadratus_lumborum_l: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP QL venstre med referering til SI-ledd' },
      { type: 'hypertonicity', text: 'Hypertont QL venstre' }
    ],
    treatments: [
      'Ischemic compression QL TrP',
      'Side-lying QL stretch'
    ]
  },
  multifidus_r: {
    findings: [
      { type: 'weakness', text: 'Atrofisk multifidus høyre L4-L5, dårlig segmentell kontroll' },
      { type: 'trigger_point', text: 'Latente TrP multifidus L4-S1 høyre' },
      { type: 'weakness', text: 'Inhibert multifidus med forsinket aktivering' }
    ],
    treatments: [
      'Transverse friction multifidus',
      'Segmentell stabiliseringstrening',
      'Multifidus aktivering øvelser'
    ]
  },
  multifidus_l: {
    findings: [
      { type: 'weakness', text: 'Atrofisk multifidus venstre L4-L5' },
      { type: 'trigger_point', text: 'Latente TrP multifidus L4-S1 venstre' }
    ],
    treatments: [
      'Transverse friction multifidus',
      'Segmentell stabiliseringstrening'
    ]
  },

  // Hip muscles
  iliopsoas_r: {
    findings: [
      { type: 'shortness', text: 'Forkortet iliopsoas høyre med positiv Thomas test' },
      { type: 'trigger_point', text: 'TrP iliopsoas høyre med korsryggsmerter' },
      { type: 'hypertonicity', text: 'Stram/overaktiv iliopsoas høyre' }
    ],
    treatments: [
      'Myofascial release iliopsoas',
      'Contract-relax stretching',
      'Hip flexor lengthening',
      'Kneeling hip flexor stretch veiledning'
    ]
  },
  iliopsoas_l: {
    findings: [
      { type: 'shortness', text: 'Forkortet iliopsoas venstre med positiv Thomas test' },
      { type: 'trigger_point', text: 'TrP iliopsoas venstre' }
    ],
    treatments: [
      'Myofascial release iliopsoas',
      'Contract-relax stretching'
    ]
  },
  piriformis_r: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP piriformis høyre med pseudoisjias' },
      { type: 'hypertonicity', text: 'Hypertont piriformis høyre, positiv FAIR test' },
      { type: 'shortness', text: 'Forkortet piriformis med begrenset innadrotasjon' }
    ],
    treatments: [
      'Piriformis release supine',
      'Contract-relax piriformis',
      'Figure-4 stretch veiledning',
      'Piriformis MET'
    ]
  },
  piriformis_l: {
    findings: [
      { type: 'trigger_point', text: 'Aktive TrP piriformis venstre' },
      { type: 'hypertonicity', text: 'Hypertont piriformis venstre' }
    ],
    treatments: [
      'Piriformis release supine',
      'Contract-relax piriformis'
    ]
  },
  gluteus_maximus_r: {
    findings: [
      { type: 'weakness', text: 'Svak/inhibert gluteus maximus høyre, forsinket aktivering' },
      { type: 'trigger_point', text: 'Latente TrP gluteus maximus høyre' },
      { type: 'weakness', text: 'Gluteal amnesi med hamstrings dominans' }
    ],
    treatments: [
      'Gluteal activation exercises',
      'Bridge progressjoner',
      'Hip thrust veiledning',
      'Clamshell øvelser'
    ]
  },
  gluteus_maximus_l: {
    findings: [
      { type: 'weakness', text: 'Svak gluteus maximus venstre' },
      { type: 'trigger_point', text: 'Latente TrP gluteus maximus venstre' }
    ],
    treatments: [
      'Gluteal activation exercises',
      'Bridge progressjoner'
    ]
  },
  gluteus_medius_r: {
    findings: [
      { type: 'weakness', text: 'Svak gluteus medius høyre, positiv Trendelenburg' },
      { type: 'trigger_point', text: 'Aktive TrP gluteus medius høyre med lateral hofte smerte' },
      { type: 'weakness', text: 'Dårlig frontalplan stabilitet' }
    ],
    treatments: [
      'Gluteus medius aktivering',
      'Side-lying hip abduction',
      'Single leg balance trening',
      'Banded walks'
    ]
  },
  gluteus_medius_l: {
    findings: [
      { type: 'weakness', text: 'Svak gluteus medius venstre' },
      { type: 'trigger_point', text: 'Aktive TrP gluteus medius venstre' }
    ],
    treatments: [
      'Gluteus medius aktivering',
      'Side-lying hip abduction'
    ]
  },

  // Thigh muscles
  quadriceps_r: {
    findings: [
      { type: 'shortness', text: 'Forkortet rectus femoris høyre med positiv Ely test' },
      { type: 'trigger_point', text: 'TrP vastus lateralis høyre med knesmerte' },
      { type: 'hypertonicity', text: 'Overaktiv quadriceps med patellofemoral tracking issue' }
    ],
    treatments: [
      'Quadriceps stretching',
      'Myofascial release vastus lateralis',
      'Foam rolling quadriceps',
      'Rectus femoris stretch veiledning'
    ]
  },
  hamstrings_r: {
    findings: [
      { type: 'shortness', text: 'Stramme hamstrings høyre, SLR 55 grader' },
      { type: 'trigger_point', text: 'TrP biceps femoris høyre proksimalt' },
      { type: 'hypertonicity', text: 'Overaktiv hamstrings kompenserende for svak gluteus' }
    ],
    treatments: [
      'Hamstring lengthening',
      'Active isolated stretching',
      'Sciatic nerve flossing',
      'Nordic hamstring veiledning'
    ]
  },
  hamstrings_l: {
    findings: [
      { type: 'shortness', text: 'Stramme hamstrings venstre, SLR 60 grader' },
      { type: 'trigger_point', text: 'TrP biceps femoris venstre' }
    ],
    treatments: [
      'Hamstring lengthening',
      'Active isolated stretching'
    ]
  },

  // Calf muscles
  gastrocnemius_r: {
    findings: [
      { type: 'shortness', text: 'Forkortet gastrocnemius høyre, begrenset dorsifleksjon' },
      { type: 'trigger_point', text: 'TrP gastrocnemius med leggkramper' },
      { type: 'hypertonicity', text: 'Hypertont gastrocnemius' }
    ],
    treatments: [
      'Gastroc stretching med knestrekk',
      'Eccentric calf raises',
      'Foam rolling calf',
      'Ankle mobility drills'
    ]
  },
  gastrocnemius_l: {
    findings: [
      { type: 'shortness', text: 'Forkortet gastrocnemius venstre' },
      { type: 'trigger_point', text: 'TrP gastrocnemius venstre' }
    ],
    treatments: [
      'Gastroc stretching',
      'Eccentric calf raises'
    ]
  },
  soleus_r: {
    findings: [
      { type: 'shortness', text: 'Stram soleus høyre, begrenset dorsifleksjon med bøyd kne' },
      { type: 'trigger_point', text: 'TrP soleus med hælsmerte' }
    ],
    treatments: [
      'Soleus stretch med bøyd kne',
      'Heel drops',
      'Achilles tendon loading'
    ]
  }
};

// Spinal segment templates
export const SPINE_TEMPLATES = {
  // Cervical
  C1: {
    subluxation: {
      listings: ['Atlas ASLA', 'Atlas ASRA', 'Atlas lateral venstre', 'Atlas lateral høyre'],
      narrative: 'C1 subluksasjon med {listing}, redusert intersegmentell bevegelse og positiv motion palpation'
    },
    adjustment: 'Toggle recoil C1 {side} lateral',
    associated: ['Cervikogen hodepine', 'Øvre cervical stivhet', 'Vertigo']
  },
  C2: {
    subluxation: {
      listings: ['Axis posterior body', 'Axis rotasjon høyre', 'Axis rotasjon venstre'],
      narrative: 'C2 subluksasjon med {listing}, fasettledd fiksasjon og paravertebral hypertonus'
    },
    adjustment: 'Rotary adjustment C2 {side}',
    associated: ['Nakkehodepine', 'Redusert rotasjon', 'Suboccipital spenning']
  },
  C5: {
    subluxation: {
      listings: ['C5 PSR', 'C5 PSL', 'C5 posterior'],
      narrative: 'C5 subluksasjon {listing} med segmentell fiksasjon'
    },
    adjustment: 'Diversified prone C5 {listing}',
    associated: ['C5 radikulopati', 'Deltoid svakhet', 'Lateral arm parestesier']
  },
  C6: {
    subluxation: {
      listings: ['C6 PSR', 'C6 PSL', 'C6 posterior bilateral'],
      narrative: 'C6 subluksasjon {listing} med assosiert foraminal stenose tegn'
    },
    adjustment: 'Diversified prone C6 {listing}',
    associated: ['C6 radikulopati', 'Biceps svakhet', 'Tommel parestesier']
  },

  // Thoracic
  T4: {
    subluxation: {
      listings: ['T4 posterior bilateral', 'T4 PR', 'T4 PL'],
      narrative: 'T4 subluksasjon {listing} med costovertebral involvering'
    },
    adjustment: 'Cross-arm anterior thoracic T4 eller prone diversified',
    associated: ['Interskapulær smerte', 'Thorakal stivhet', 'Respiratorisk dysfunksjon']
  },
  T6: {
    subluxation: {
      listings: ['T6 rotasjon høyre', 'T6 rotasjon venstre', 'T6 posterior'],
      narrative: 'T6 subluksasjon med {listing} og rib involvement'
    },
    adjustment: 'Prone diversified T6 {side} rotasjon',
    associated: ['Midtrygg smerte', 'Rib dysfunksjon', 'Referert brystkasse smerte']
  },
  T12: {
    subluxation: {
      listings: ['T12 posterior', 'T12 PIL', 'T12 PIR'],
      narrative: 'Thorakolumbal overgang T12 subluksasjon {listing}'
    },
    adjustment: 'Prone diversified T12 eller knee-chest',
    associated: ['Thorakolumbal smerte', 'Flanke smerte', 'Abdominal referering']
  },

  // Lumbar
  L3: {
    subluxation: {
      listings: ['L3 PR', 'L3 PL', 'L3 posterior bilateral'],
      narrative: 'L3 subluksasjon {listing} med redusert segmentell bevegelse'
    },
    adjustment: 'Side-posture rotary L3 eller prone diversified',
    associated: ['Midtlumbar smerte', 'Anterior thigh referering', 'L3 dermatomal symptomer']
  },
  L4: {
    subluxation: {
      listings: ['L4 posterior bilateral', 'L4 PR', 'L4 PL', 'L4 extension fixation'],
      narrative: 'L4 subluksasjon {listing} med fasettledd låsning og paravertebral spasme'
    },
    adjustment: 'Side-posture L4 eller flexion-distraction',
    associated: ['Nedre rygg smerte', 'L4 radikulopati', 'Medial legg smerte']
  },
  L5: {
    subluxation: {
      listings: ['L5 AI bilateral', 'L5 posterior', 'L5-S1 fiksasjon'],
      narrative: 'L5 subluksasjon {listing} med lumbosacral junction involvering'
    },
    adjustment: 'Flexion-distraction L5-S1 eller side-posture',
    associated: ['Lumbosacral smerte', 'L5 radikulopati', 'Stor tå svakhet']
  },

  // Sacral
  S1: {
    subluxation: {
      listings: ['Sacral base anterior høyre', 'Sacral base anterior venstre', 'Sacral torsjon'],
      narrative: 'Sacral subluksasjon med {listing}'
    },
    adjustment: 'Thompson drop sacral eller prone diversified',
    associated: ['SI-ledd smerte', 'Bekken skjevhet', 'Benlengeforskjell']
  }
};

// Disc finding templates
export const DISC_TEMPLATES = {
  'C5-C6': {
    bulge: 'Posterior-lateral disc bulge C5-C6 {side} med C6 nerverotsaffeksjon',
    herniation: 'Disc herniering C5-C6 {side} med radikulopati',
    degeneration: 'Degenerative forandringer C5-C6 nivå'
  },
  'C6-C7': {
    bulge: 'Posterior-lateral disc bulge C6-C7 {side} med C7 nerverotsaffeksjon',
    herniation: 'Disc herniering C6-C7 {side}',
    degeneration: 'Degenerative forandringer C6-C7 nivå'
  },
  'L4-L5': {
    bulge: 'Posterior-lateral disc bulge L4-L5 {side} med L5 nerverotsirritasjon',
    herniation: 'Disc herniering L4-L5 {side} med radikulopati',
    degeneration: 'Degenerative disc disease L4-L5',
    protrusion: 'Disc protrusjon L4-L5 {side}'
  },
  'L5-S1': {
    bulge: 'Posterior-lateral disc bulge L5-S1 {side} med S1 nerverotsaffeksjon',
    herniation: 'Disc herniering L5-S1 {side}',
    degeneration: 'Degenerative forandringer L5-S1 nivå'
  }
};

// Common clinical patterns
export const CLINICAL_PATTERNS = {
  upper_crossed: {
    name: 'Upper Crossed Syndrome',
    tight: ['upper_trapezius_r', 'upper_trapezius_l', 'levator_scapulae_r', 'levator_scapulae_l', 'pectoralis_major_r', 'pectoralis_major_l', 'suboccipitals'],
    weak: ['rhomboids_r', 'rhomboids_l', 'lower_trapezius_r', 'lower_trapezius_l', 'middle_trapezius_r', 'middle_trapezius_l'],
    spineInvolved: ['C0', 'C1', 'C2', 'T4', 'T5', 'T6'],
    narrative: 'Upper crossed syndrome med hypertone øvre trapezius, levator scapulae og pectoraler, samt inhiberte rhomboider og nedre/midtre trapezius. Assosiert med fremoverskutt hode, økt cervical lordose og thorakal kyfose.'
  },
  lower_crossed: {
    name: 'Lower Crossed Syndrome',
    tight: ['iliopsoas_r', 'iliopsoas_l', 'erector_spinae_r', 'erector_spinae_l', 'quadriceps_r', 'quadriceps_l'],
    weak: ['gluteus_maximus_r', 'gluteus_maximus_l', 'gluteus_medius_r', 'gluteus_medius_l', 'rectus_abdominis'],
    spineInvolved: ['L3', 'L4', 'L5', 'S1'],
    narrative: 'Lower crossed syndrome med stramme hoftefleksorer og erector spinae, samt svake glutealer og abdominal muskulatur. Assosiert med anterior bekkentilt og økt lumbal lordose.'
  },
  layer_syndrome: {
    name: 'Layer Syndrome',
    tight: ['upper_trapezius_r', 'upper_trapezius_l', 'erector_spinae_r', 'erector_spinae_l', 'iliopsoas_r', 'iliopsoas_l', 'hamstrings_r', 'hamstrings_l'],
    weak: ['rhomboids_r', 'rhomboids_l', 'lower_trapezius_r', 'lower_trapezius_l', 'gluteus_maximus_r', 'gluteus_maximus_l', 'rectus_abdominis'],
    spineInvolved: ['C1', 'C2', 'T4', 'T5', 'T6', 'L4', 'L5', 'S1'],
    narrative: 'Layer syndrome - kombinert upper og lower crossed pattern med alternerende hyper- og hypotone lag gjennom columna. Krever omfattende behandlingstilnærming.'
  }
};

// Treatment protocol templates
export const TREATMENT_PROTOCOLS = {
  cervical_adjustment: {
    name: 'Cervical Justering Protokoll',
    steps: [
      'Pre-adjustment myofascial release cervical paraspinals',
      'Motion palpation for subluxation identifikasjon',
      'Cervikal justering med appropriate technique',
      'Post-adjustment ROM retest',
      'Home exercise instruction'
    ]
  },
  lumbar_stabilization: {
    name: 'Lumbal Stabilisering Protokoll',
    steps: [
      'Core activation assessment',
      'Myofascial release paraspinals og QL',
      'Lumbal justering/mobilisering',
      'Core bracing instruction',
      'McGill Big 3 exercises',
      'Progressive stabilization program'
    ]
  },
  trigger_point_release: {
    name: 'Trigger Point Release Protokoll',
    steps: [
      'Palpasjon og identifikasjon av aktive TrP',
      'Ischemic compression 30-90 sekunder',
      'Post-isometric relaxation',
      'Reciprocal inhibition stretching',
      'Home self-release instruction'
    ]
  }
};

export default {
  MUSCLE_TEMPLATES,
  SPINE_TEMPLATES,
  DISC_TEMPLATES,
  CLINICAL_PATTERNS,
  TREATMENT_PROTOCOLS
};
