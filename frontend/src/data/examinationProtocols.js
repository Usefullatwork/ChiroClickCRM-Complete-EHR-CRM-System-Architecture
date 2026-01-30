/**
 * Examination Protocols Data
 *
 * Comprehensive clinical examination protocols based on Norwegian clinical guidelines.
 * Includes cluster testing systems for improved diagnostic accuracy.
 */

// Red flag severity levels
export const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MODERATE: 'MODERATE',
  LOW: 'LOW'
};

// Cluster test thresholds
export const CLUSTER_THRESHOLDS = {
  cerebellar: { positive: 4, total: 8, label: 'Cerebellær dysfunksjon' },
  vestibular: { positive: 3, total: 6, label: 'Perifert vestibulært tap' },
  cervicogenic: { positive: 4, total: 7, label: 'Cervikogen svimmelhet' },
  tmj: { positive: 3, total: 7, label: 'TMJ dysfunksjon' },
  upperCervicalInstability: { positive: 4, total: 7, label: 'Upper cervical instabilitet' },
  myelopathy: { positive: 3, total: 6, label: 'Myelopati' }
};

// BPPV Canal Types
export const BPPV_TYPES = {
  POSTERIOR: 'posterior',
  LATERAL_GEOTROPIC: 'lateral_geotropic',
  LATERAL_AGEOTROPIC: 'lateral_ageotropic',
  ANTERIOR: 'anterior'
};

// Examination sections by body region
export const EXAMINATION_REGIONS = {
  cervical: {
    id: 'cervical',
    name: 'Cervikalcolumna',
    nameEn: 'Cervical Spine',
    icon: 'spine',
    sections: [
      {
        id: 'observation',
        title: 'Observasjon & positur',
        titleEn: 'Observation & Posture',
        items: [
          { id: 'atrofi', label: 'Atrofi', labelEn: 'Atrophy', type: 'checkbox' },
          { id: 'fascikulasjoner', label: 'Fascikulasjoner', labelEn: 'Fasciculations', type: 'checkbox' },
          { id: 'tremor', label: 'Tremor', labelEn: 'Tremor', type: 'checkbox' },
          { id: 'head_posture', label: 'Hodepositur', labelEn: 'Head posture', type: 'select',
            options: ['Normal', 'Forward head', 'Lateral tilt H', 'Lateral tilt V'] }
        ]
      },
      {
        id: 'gait_myelopathy',
        title: 'Gange (Myelopatitegn)',
        titleEn: 'Gait (Myelopathy Signs)',
        redFlag: true,
        items: [
          { id: 'balance_loss', label: 'Tap av balanse', labelEn: 'Loss of balance', type: 'checkbox', redFlag: true },
          { id: 'stiffness', label: 'Stivhet', labelEn: 'Stiffness', type: 'checkbox' },
          { id: 'wide_gait', label: 'Bred gange', labelEn: 'Wide gait', type: 'checkbox', redFlag: true },
          { id: 'toe_scraping', label: 'Skraping av tær', labelEn: 'Toe scraping', type: 'checkbox', redFlag: true },
          { id: 'hyperreflexia', label: 'Hyperrefleksi', labelEn: 'Hyperreflexia', type: 'checkbox', redFlag: true }
        ],
        alert: {
          condition: 3,
          message: 'MYELOPATI MISTANKE - Henvis for MR',
          messageEn: 'MYELOPATHY SUSPECTED - Refer for MRI',
          severity: SEVERITY.CRITICAL
        }
      },
      {
        id: 'palpation',
        title: 'Palpasjon',
        titleEn: 'Palpation',
        items: [
          { id: 'bone_tenderness', label: 'Beinømhet', labelEn: 'Bone tenderness', type: 'checkbox' },
          { id: 'soft_tissue', label: 'Bløtvevsømhet', labelEn: 'Soft tissue tenderness', type: 'checkbox' },
          { id: 'muscle_spasm', label: 'Muskelspasme', labelEn: 'Muscle spasm', type: 'text' }
        ]
      },
      {
        id: 'rom',
        title: 'Aktiv ROM',
        titleEn: 'Active ROM',
        items: [
          { id: 'flexion', label: 'Fleksjon', labelEn: 'Flexion', type: 'rom', normal: 50 },
          { id: 'extension', label: 'Ekstensjon', labelEn: 'Extension', type: 'rom', normal: 60 },
          { id: 'lat_flex_left', label: 'Lateral fleksjon V', labelEn: 'Lateral flexion L', type: 'rom', normal: 45 },
          { id: 'lat_flex_right', label: 'Lateral fleksjon H', labelEn: 'Lateral flexion R', type: 'rom', normal: 45 },
          { id: 'rotation_left', label: 'Rotasjon V', labelEn: 'Rotation L', type: 'rom', normal: 80 },
          { id: 'rotation_right', label: 'Rotasjon H', labelEn: 'Rotation R', type: 'rom', normal: 80 }
        ]
      },
      {
        id: 'provocation',
        title: 'Provokasjonstester',
        titleEn: 'Provocation Tests',
        items: [
          { id: 'spurlings', label: "Spurling's test", type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H', 'Positiv bilateral'],
            interpretation: 'Nerverotaffeksjon ved positiv' },
          { id: 'cervical_distraction', label: 'Cervikal distraksjonstest', type: 'test',
            options: ['Negativ', 'Positiv (lindring)'],
            interpretation: 'Radikulopati/skiveprolaps' },
          { id: 'foraminal_compression', label: 'Foraminal kompresjonstest', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Nerverot irritasjon' },
          { id: 'bakodys', label: "Bakody's test (skulder abduksjon)", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Radikulær irritasjon' },
          { id: 'shoulder_depression', label: 'Skulder depresjonstest', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Radikulær irritasjon' },
          { id: 'lhermittes', label: "Lhermitte's test", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Patologi i columna, cervikal traume, akutt myelitt',
            redFlag: true }
        ]
      },
      {
        id: 'tos_cluster',
        title: 'TOS-tester (Thoracic Outlet)',
        titleEn: 'TOS Tests (Thoracic Outlet)',
        items: [
          { id: 'roos', label: "Roo's test", type: 'test', options: ['Negativ', 'Positiv'] },
          { id: 'adsons', label: "Adson's test", type: 'test', options: ['Negativ', 'Positiv', 'Redusert puls'] },
          { id: 'reverse_adsons', label: "Reversert Adson's", type: 'test', options: ['Negativ', 'Positiv'] },
          { id: 'hyperabduction', label: 'Hyperabduksjonstest', type: 'test', options: ['Negativ', 'Positiv'] },
          { id: 'costoclavicular', label: 'Costoclavicular test', type: 'test', options: ['Negativ', 'Positiv'] }
        ],
        alert: {
          condition: 2,
          message: 'TOS sannsynlig (2+ positive)',
          messageEn: 'TOS likely (2+ positive)',
          severity: SEVERITY.MODERATE
        }
      }
    ]
  },

  lumbar: {
    id: 'lumbar',
    name: 'Lumbalcolumna',
    nameEn: 'Lumbar Spine',
    icon: 'spine-lumbar',
    redFlags: [
      { pattern: 'alder < 20 eller > 55', severity: SEVERITY.HIGH },
      { pattern: 'konstante smerter', severity: SEVERITY.HIGH },
      { pattern: 'hvile/nattlige smerter', severity: SEVERITY.HIGH },
      { pattern: 'torakale smerter', severity: SEVERITY.HIGH },
      { pattern: 'vekttap', severity: SEVERITY.CRITICAL },
      { pattern: 'utbredt nevrologisk utfall', severity: SEVERITY.CRITICAL },
      { pattern: 'tidligere kreft', severity: SEVERITY.CRITICAL }
    ],
    sections: [
      {
        id: 'observation',
        title: 'Observasjon & positur',
        titleEn: 'Observation & Posture',
        items: [
          { id: 'lateral_deviation', label: 'Lateral deviasjon', labelEn: 'Lateral deviation', type: 'checkbox' },
          { id: 'lumbar_lordosis', label: 'Lumbal lordose', labelEn: 'Lumbar lordosis', type: 'select',
            options: ['Normal', 'Økt', 'Redusert', 'Flat'] },
          { id: 'pelvic_tilt', label: 'Bekkenhevning', labelEn: 'Pelvic tilt', type: 'select',
            options: ['Normal', 'Venstre høy', 'Høyre høy'] },
          { id: 'antalgic_posture', label: 'Avvergeholdning', labelEn: 'Antalgic posture', type: 'checkbox' }
        ]
      },
      {
        id: 'rom',
        title: 'Aktiv ROM',
        titleEn: 'Active ROM',
        items: [
          { id: 'flexion', label: 'Fleksjon', labelEn: 'Flexion', type: 'rom', normal: 60 },
          { id: 'extension', label: 'Ekstensjon', labelEn: 'Extension', type: 'rom', normal: 25 },
          { id: 'lat_flex_left', label: 'Lateral fleksjon V', labelEn: 'Lateral flexion L', type: 'rom', normal: 25 },
          { id: 'lat_flex_right', label: 'Lateral fleksjon H', labelEn: 'Lateral flexion R', type: 'rom', normal: 25 },
          { id: 'rotation_left', label: 'Rotasjon V', labelEn: 'Rotation L', type: 'rom', normal: 30 },
          { id: 'rotation_right', label: 'Rotasjon H', labelEn: 'Rotation R', type: 'rom', normal: 30 }
        ]
      },
      {
        id: 'special_tests',
        title: 'Spesialtester',
        titleEn: 'Special Tests',
        items: [
          { id: 'schobers', label: "Schober's test", type: 'measurement', unit: 'cm', normal: '>5',
            interpretation: 'Mangelfull lumbal fleksjon ved <5cm - Ankyloserende spondylitt' },
          { id: 'finger_floor', label: 'Finger til gulv', type: 'measurement', unit: 'cm' },
          { id: 'single_leg_extension', label: 'Et-bens-hyperekstensjonstest', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Spondylose, fasettleddsmerter' },
          { id: 'kemps', label: "Kemp's test", type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Fasettleddsmerter lumbalcolumna' }
        ]
      },
      {
        id: 'nerve_tests',
        title: 'Nervetester',
        titleEn: 'Nerve Tests',
        items: [
          { id: 'slr', label: 'Strak beinhevning (Lasègue)', type: 'test',
            options: ['Negativ', '10° (Demianoff)', '0-60° radikulær', '>40° myalgi'],
            interpretation: 'Nerverotaffeksjon' },
          { id: 'crossed_slr', label: 'Krysset Lasègue', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Posteromedial skiveprolaps - sterkt positiv' },
          { id: 'slump', label: 'Slump test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Neural tension' }
        ]
      },
      {
        id: 'si_joint',
        title: 'Iliosakralledd',
        titleEn: 'SI Joint',
        items: [
          { id: 'gaenslen', label: 'Gaenslen test', type: 'test', options: ['Negativ', 'Positiv V', 'Positiv H'] },
          { id: 'si_distraction', label: 'IS-ledd distraksjon', type: 'test', options: ['Negativ', 'Positiv'] },
          { id: 'si_compression', label: 'IS-ledd kompresjon', type: 'test', options: ['Negativ', 'Positiv'] },
          { id: 'thigh_thrust', label: 'Thigh thrust', type: 'test', options: ['Negativ', 'Positiv V', 'Positiv H'] },
          { id: 'faber', label: 'FABER test', type: 'test', options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'IS-ledd eller hoftepatologi' }
        ],
        alert: {
          condition: 3,
          message: 'IS-ledd dysfunksjon sannsynlig (3+ positive)',
          messageEn: 'SI joint dysfunction likely (3+ positive)',
          severity: SEVERITY.LOW
        }
      }
    ]
  },

  shoulder: {
    id: 'shoulder',
    name: 'Skulder',
    nameEn: 'Shoulder',
    icon: 'shoulder',
    sections: [
      {
        id: 'observation',
        title: 'Observasjon & positur',
        titleEn: 'Observation & Posture',
        items: [
          { id: 'sulcus_sign', label: 'Sulcus tegn', labelEn: 'Sulcus sign', type: 'checkbox',
            interpretation: 'Glenohumeral instabilitet' },
          { id: 'winging_scapula', label: 'Skapula alatal/vingeskapula', type: 'checkbox',
            interpretation: 'N. thoracicus longus lesjon' },
          { id: 'ac_separation', label: 'AC-ledd seperasjon', type: 'checkbox' },
          { id: 'atrophy', label: 'Atrofi', type: 'text' },
          { id: 'biceps_rupture', label: 'Biceps sene rift/ruptur', type: 'checkbox' }
        ]
      },
      {
        id: 'rom',
        title: 'ROM (+ Apley test)',
        titleEn: 'ROM (+ Apley test)',
        items: [
          { id: 'flexion', label: 'Fleksjon', type: 'rom', normal: 180 },
          { id: 'extension', label: 'Ekstensjon', type: 'rom', normal: 60 },
          { id: 'abduction', label: 'Abduksjon', type: 'rom', normal: 180 },
          { id: 'internal_rotation', label: 'Intern rotasjon', type: 'rom', normal: 70 },
          { id: 'external_rotation', label: 'Ekstern rotasjon', type: 'rom', normal: 90 }
        ]
      },
      {
        id: 'impingement',
        title: 'Impingement tester',
        titleEn: 'Impingement Tests',
        items: [
          { id: 'hawkins_kennedy', label: 'Modifisert Hawkin-Kennedy', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Supraspinatus sene impingement' },
          { id: 'neers', label: "Neer's test", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Subacromial impingement' },
          { id: 'jobe', label: 'Jobe test (empty can)', type: 'test',
            options: ['Negativ', 'Positiv', 'Svakhet'],
            interpretation: 'Supraspinatus patologi' }
        ]
      },
      {
        id: 'rotator_cuff',
        title: 'Rotator cuff tester',
        titleEn: 'Rotator Cuff Tests',
        items: [
          { id: 'speeds', label: 'Speeds test', type: 'test', options: ['Negativ', 'Positiv'],
            interpretation: 'Supraspinatus rift/ruptur, labrum ruptur' },
          { id: 'lift_off', label: 'Lift off test', type: 'test', options: ['Negativ', 'Positiv'],
            interpretation: 'M. subscapularis dysfunksjon/rift' },
          { id: 'napoleon', label: 'Napoleon test', type: 'test', options: ['Negativ', 'Positiv'],
            interpretation: 'M. subscapularis ruptur' },
          { id: 'bear_hug', label: 'Bear hug test', type: 'test', options: ['Negativ', 'Positiv'],
            interpretation: 'M. subscapularis full tykkelse ruptur' },
          { id: 'rents', label: "Rent's test", type: 'test', options: ['Negativ', 'Positiv'],
            interpretation: 'Full tykkelse ruptur' }
        ]
      },
      {
        id: 'labrum',
        title: 'Labrum/SLAP tester',
        titleEn: 'Labrum/SLAP Tests',
        items: [
          { id: 'active_compression', label: 'Aktiv kompresjonstest', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Biceps patologi og SLAP lesjon' },
          { id: 'obriens', label: "O'Brien's test", type: 'test', options: ['Negativ', 'Positiv'],
            interpretation: 'SLAP lesjon' },
          { id: 'passive_distraction', label: 'Passiv distraksjonstest (PDT)', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Labrum patologi - SLAP lesjon' }
        ]
      },
      {
        id: 'instability',
        title: 'Instabilitetstester',
        titleEn: 'Instability Tests',
        items: [
          { id: 'anterior_apprehension', label: 'Fremre apprehension test', type: 'test',
            options: ['Negativ', 'Positiv'] },
          { id: 'posterior_apprehension', label: 'Posterior apprehension test', type: 'test',
            options: ['Negativ', 'Positiv'] },
          { id: 'load_and_shift', label: 'Translokasjonstest (load and shift)', type: 'test',
            options: ['Negativ', 'Grade 1', 'Grade 2', 'Grade 3'],
            interpretation: 'Bankart lesjon ved økt translasjon' },
          { id: 'beighton', label: 'Beighton hypermobilitetstest', type: 'score', max: 9,
            interpretation: 'Hypermobilitet ved 5+' }
        ]
      }
    ]
  },

  hip: {
    id: 'hip',
    name: 'Hofteledd',
    nameEn: 'Hip Joint',
    icon: 'hip',
    sections: [
      {
        id: 'observation',
        title: 'Observasjon & gange',
        titleEn: 'Observation & Gait',
        items: [
          { id: 'antalgic_gait', label: 'Avvergegange/halting', type: 'checkbox' },
          { id: 'trendelenburg_gait', label: 'Trendelenburg gange', type: 'checkbox' },
          { id: 'externally_rotated', label: 'Utover rotert U.E', type: 'checkbox' }
        ]
      },
      {
        id: 'rom',
        title: 'Aktiv ROM',
        titleEn: 'Active ROM',
        items: [
          { id: 'flexion', label: 'Fleksjon', type: 'rom', normal: 120 },
          { id: 'extension', label: 'Ekstensjon', type: 'rom', normal: 30 },
          { id: 'abduction', label: 'Abduksjon', type: 'rom', normal: 45 },
          { id: 'adduction', label: 'Adduksjon', type: 'rom', normal: 30 },
          { id: 'internal_rotation', label: 'Intern rotasjon', type: 'rom', normal: 35 },
          { id: 'external_rotation', label: 'Ekstern rotasjon', type: 'rom', normal: 45 }
        ]
      },
      {
        id: 'special_tests',
        title: 'Spesialtester',
        titleEn: 'Special Tests',
        items: [
          { id: 'trendelenburg', label: 'Trendelenburg test', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Svakhet m. gluteus medius/minimus' },
          { id: 'thomas', label: 'Thomas test', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Stram m. iliopsoas' },
          { id: 'fadir', label: 'FADIR test', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Fremre impingement, FAI, labrumskade' },
          { id: 'faber', label: 'FABER test', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Bakre impingement, generell hoftepatologi' },
          { id: 'quadrant', label: 'Quadrant-test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Hoftepatologi: hofteartrose, FAI' },
          { id: 'leg_rolling', label: 'Leg rolling test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Hoftefraktur, intraartikulær patologi' },
          { id: 'anvil', label: 'Anvil test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Lårbeinsfraktur, hoftepatologi' }
        ]
      },
      {
        id: 'prone_tests',
        title: 'Mageliggende tester',
        titleEn: 'Prone Tests',
        items: [
          { id: 'duncan_ely', label: 'Duncan Ely (rec fem kontraktur)', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Kontraktur m. rectus femoris' },
          { id: 'obers', label: "Ober's test (ITB kontraktur)", type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'ITB/TFL kontraktur - trokanterbursitt, løperkne' },
          { id: 'piriformis', label: 'Piriformis syndrom test', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Piriformis kan klemme på isjasnerven' }
        ]
      }
    ]
  },

  knee: {
    id: 'knee',
    name: 'Kne',
    nameEn: 'Knee',
    icon: 'knee',
    sections: [
      {
        id: 'observation',
        title: 'Observasjon',
        titleEn: 'Observation',
        items: [
          { id: 'osgood_schlatter', label: 'Osgood-Schlatter deformitet', type: 'checkbox' },
          { id: 'effusion', label: 'Hematom/hevelse', type: 'checkbox' },
          { id: 'bursitis', label: 'Bursitt', type: 'checkbox' },
          { id: 'baker_cyst', label: 'Baker cyste', type: 'checkbox' },
          { id: 'atrophy', label: 'Muskelatrofi', type: 'checkbox' },
          { id: 'genu_valgum', label: 'Genu valgum (kalvbent)', type: 'checkbox' },
          { id: 'genu_varum', label: 'Genu varum (hjulbent)', type: 'checkbox' }
        ]
      },
      {
        id: 'rom',
        title: 'ROM',
        titleEn: 'ROM',
        items: [
          { id: 'flexion', label: 'Fleksjon', type: 'rom', normal: 135 },
          { id: 'extension', label: 'Ekstensjon', type: 'rom', normal: 0 }
        ]
      },
      {
        id: 'meniscus',
        title: 'Menisktester',
        titleEn: 'Meniscus Tests',
        items: [
          { id: 'thessaly', label: 'Thessaly test', type: 'test',
            options: ['Negativ', 'Positiv medial', 'Positiv lateral'],
            interpretation: 'Meniskruptur' },
          { id: 'mcmurray', label: 'McMurray test', type: 'test',
            options: ['Negativ', 'Positiv medial', 'Positiv lateral'],
            interpretation: 'Meniskruptur - klikkelyder og smerter' },
          { id: 'apleys_compression', label: "Apley's kompresjon", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Meniskpatologi' }
        ]
      },
      {
        id: 'ligament',
        title: 'Ligamenttester',
        titleEn: 'Ligament Tests',
        items: [
          { id: 'lachman', label: 'Lachmanns test', type: 'test',
            options: ['Negativ', 'Positiv (svakt endepunkt)'],
            interpretation: 'ACL skade' },
          { id: 'anterior_drawer', label: 'Anterior draw test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'ACL ruptur' },
          { id: 'pivot_shift', label: 'Pivot shift test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'ACL patologi' },
          { id: 'posterior_drawer', label: 'Bakre skuffetest', type: 'test',
            options: ['Negativ', 'Positiv (>5mm)'],
            interpretation: 'PCL patologi' },
          { id: 'tibial_sag', label: 'Tibial sagging', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'PCL ruptur' },
          { id: 'valgus_stress', label: 'Valgus stress test', type: 'test',
            options: ['Negativ', 'Positiv 0°', 'Positiv 30°'],
            interpretation: 'MCL patologi' },
          { id: 'varus_stress', label: 'Varus stress test', type: 'test',
            options: ['Negativ', 'Positiv 0°', 'Positiv 30°'],
            interpretation: 'LCL patologi' }
        ]
      },
      {
        id: 'patella',
        title: 'Patellofemorale tester',
        titleEn: 'Patellofemoral Tests',
        items: [
          { id: 'q_angle', label: 'Q-vinkel', type: 'measurement', unit: '°', normal: '14-18',
            interpretation: 'Økt: kondromalasi, patellofemoral smertesyndrom' },
          { id: 'patellar_grind', label: 'Patellar femoral grind test', type: 'test',
            options: ['Negativ', 'Positiv (krepitasjon)'],
            interpretation: 'Kondromalasi, artrose' },
          { id: 'patellar_apprehension', label: 'Patella apprehension test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Patella instabilitet' },
          { id: 'stroke_test', label: 'Stroke test (effusjon)', type: 'test',
            options: ['Negativ', 'Trace', 'Mild', 'Moderate'],
            interpretation: 'Leddvæske' }
        ]
      }
    ]
  },

  ankle: {
    id: 'ankle',
    name: 'Ankel og fot',
    nameEn: 'Ankle and Foot',
    icon: 'foot',
    ottawaRules: {
      title: 'Ottawa-kriterier for ankelskader',
      titleEn: 'Ottawa Ankle Rules',
      ankleXray: [
        'Benet palpasjonsømhet over posteriore laterale malleol (distale 6cm av fibula)',
        'Benet palpasjonsømhet over posteriore mediale malleol (distale 6cm av tibia)',
        'Manglende evne til belastning (4 steg) umiddelbart etter og under vurdering'
      ],
      footXray: [
        'Benet palpasjonsømhet over basis av femte metatars',
        'Benet palpasjonsømhet over os naviculare',
        'Manglende evne til belastning (4 steg) umiddelbart etter og under vurdering'
      ]
    },
    sections: [
      {
        id: 'observation',
        title: 'Observasjon',
        titleEn: 'Observation',
        items: [
          { id: 'footwear', label: 'Fottøy slitasje', type: 'text' },
          { id: 'swelling', label: 'Hevelse', type: 'select', options: ['Ingen', 'Mild', 'Moderat', 'Alvorlig'] },
          { id: 'ecchymosis', label: 'Hematom', type: 'checkbox' }
        ]
      },
      {
        id: 'rom',
        title: 'ROM',
        titleEn: 'ROM',
        items: [
          { id: 'dorsiflexion', label: 'Dorsalfleksjon', type: 'rom', normal: 20 },
          { id: 'plantarflexion', label: 'Plantarfleksjon', type: 'rom', normal: 50 },
          { id: 'inversion', label: 'Inversjon', type: 'rom', normal: 35 },
          { id: 'eversion', label: 'Eversjon', type: 'rom', normal: 15 }
        ]
      },
      {
        id: 'ligament',
        title: 'Ligamenttester',
        titleEn: 'Ligament Tests',
        items: [
          { id: 'anterior_drawer', label: 'Fremre skuffe test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'ATFL instabilitet, fotballankel' },
          { id: 'talar_tilt', label: 'Talar tilt test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'CFL, ATFL patologi (90% inversjons-traume)' },
          { id: 'deltoid_stress', label: 'Lig. deltoideum stress test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Eversjonsstraume' },
          { id: 'syndesmosis', label: 'Syndesmose stress test (lateral rotasjon)', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Syndesmoseskade' },
          { id: 'squeeze_test', label: 'Squeeze test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Syndesmoseskade' }
        ]
      },
      {
        id: 'special',
        title: 'Spesialtester',
        titleEn: 'Special Tests',
        items: [
          { id: 'morton_neuroma', label: "Morton nevrom/Mulder's test", type: 'test',
            options: ['Negativ', 'Positiv (smerte)', 'Mulder tegn (klikk)'],
            interpretation: 'Morton nevrom' },
          { id: 'tarsal_tunnel', label: 'Dorsalfleksjon-eversjon (tarsal tunnel)', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Tarsal tunnel syndrom' },
          { id: 'thompson', label: 'Thompson test (squeeze)', type: 'test',
            options: ['Negativ', 'Positiv (ingen plantarfleksjon)'],
            interpretation: 'Achilles sene ruptur' },
          { id: 'cotton', label: 'Cotton test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: "Pott's fraktur" }
        ]
      },
      {
        id: 'circulation',
        title: 'Sirkulasjon',
        titleEn: 'Circulation',
        items: [
          { id: 'dorsalis_pedis', label: 'A. dorsalis pedis', type: 'select',
            options: ['Normal', 'Svak', 'Fraværende'] },
          { id: 'tibialis_posterior', label: 'A. tibialis posterior', type: 'select',
            options: ['Normal', 'Svak', 'Fraværende'] },
          { id: 'capillary_refill', label: 'Kapillær refill tær', type: 'select',
            options: ['<3 sek (normal)', '>3 sek'] }
        ]
      }
    ]
  },

  thoracic: {
    id: 'thoracic',
    name: 'Thorakalcolumna',
    nameEn: 'Thoracic Spine',
    icon: 'spine-thoracic',
    sections: [
      {
        id: 'observation',
        title: 'Observasjon & positur',
        titleEn: 'Observation & Posture',
        items: [
          { id: 'kyphosis', label: 'Kyfose', labelEn: 'Kyphosis', type: 'select',
            options: ['Normal', 'Økt', 'Redusert', 'Scheuermanns'] },
          { id: 'scoliosis', label: 'Skoliose', labelEn: 'Scoliosis', type: 'select',
            options: ['Ingen', 'Venstre-konveks', 'Høyre-konveks', 'S-kurve'] },
          { id: 'adams_test', label: "Adam's forward bend test", type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Strukturell skoliose ved ribbebue asymmetri' },
          { id: 'rib_hump', label: 'Ribbebue prominens', type: 'checkbox' },
          { id: 'posture', label: 'Holdning', type: 'select',
            options: ['Normal', 'Forward head', 'Rounded shoulders', 'Flat back'] }
        ]
      },
      {
        id: 'rom',
        title: 'Aktiv ROM',
        titleEn: 'Active ROM',
        items: [
          { id: 'flexion', label: 'Fleksjon', labelEn: 'Flexion', type: 'rom', normal: 40 },
          { id: 'extension', label: 'Ekstensjon', labelEn: 'Extension', type: 'rom', normal: 25 },
          { id: 'lat_flex_left', label: 'Lateral fleksjon V', labelEn: 'Lateral flexion L', type: 'rom', normal: 30 },
          { id: 'lat_flex_right', label: 'Lateral fleksjon H', labelEn: 'Lateral flexion R', type: 'rom', normal: 30 },
          { id: 'rotation_left', label: 'Rotasjon V', labelEn: 'Rotation L', type: 'rom', normal: 35 },
          { id: 'rotation_right', label: 'Rotasjon H', labelEn: 'Rotation R', type: 'rom', normal: 35 }
        ]
      },
      {
        id: 'palpation',
        title: 'Palpasjon',
        titleEn: 'Palpation',
        items: [
          { id: 'spinous_tenderness', label: 'Processus spinosus ømhet', type: 'text' },
          { id: 'paraspinal_tenderness', label: 'Paravertebral ømhet', type: 'select',
            options: ['Ingen', 'V side', 'H side', 'Bilateral'] },
          { id: 'costotransverse', label: 'Costotransversalt ledd ømhet', type: 'text' },
          { id: 'rib_spring', label: 'Ribbefjæring', type: 'select',
            options: ['Normal', 'Økt motstand V', 'Økt motstand H'] },
          { id: 'trigger_points', label: 'Triggerpunkter', type: 'text' }
        ]
      },
      {
        id: 'special_tests',
        title: 'Spesialtester',
        titleEn: 'Special Tests',
        items: [
          { id: 'first_rib', label: 'Første ribbetest', type: 'test',
            options: ['Negativ', 'Positiv V', 'Positiv H'],
            interpretation: 'Elevering av første ribbe, TOS bidrag' },
          { id: 'rib_compression', label: 'Ribbebue kompresjon', type: 'test',
            options: ['Negativ', 'Positiv (lokal smerte)', 'Positiv (referert)'],
            interpretation: 'Costochondral/costotransversal dysfunksjon' },
          { id: 'segmental_exam', label: 'Segmental bevegelighetstesting', type: 'text' },
          { id: 'springing', label: 'Springing test (PA)', type: 'test',
            options: ['Normal', 'Hypomobil', 'Hypermobil'],
            interpretation: 'Segmental dysfunksjon' }
        ]
      },
      {
        id: 'respiratory',
        title: 'Respirasjon',
        titleEn: 'Respiration',
        items: [
          { id: 'breathing_pattern', label: 'Pustemønster', type: 'select',
            options: ['Normal diafragma', 'Apikal/thorakal', 'Paradoks'] },
          { id: 'chest_expansion', label: 'Brystveggsekspansjon', type: 'measurement', unit: 'cm', normal: '>5',
            interpretation: 'Redusert ved ankyloserende spondylitt' },
          { id: 'diaphragm_excursion', label: 'Diafragma ekskursjon', type: 'select',
            options: ['Normal', 'Redusert V', 'Redusert H', 'Redusert bilateral'] }
        ]
      },
      {
        id: 'red_flags',
        title: 'Røde flagg',
        titleEn: 'Red Flags',
        redFlag: true,
        items: [
          { id: 'night_pain', label: 'Nattlig smerte', type: 'checkbox', redFlag: true },
          { id: 'weight_loss', label: 'Uforklarlig vekttap', type: 'checkbox', redFlag: true },
          { id: 'fever', label: 'Feber', type: 'checkbox', redFlag: true },
          { id: 'trauma', label: 'Nylig traume', type: 'checkbox', redFlag: true },
          { id: 'cancer_history', label: 'Kreft i anamnese', type: 'checkbox', redFlag: true },
          { id: 'immunocompromised', label: 'Immunsuppresjon', type: 'checkbox', redFlag: true }
        ],
        alert: {
          condition: 1,
          message: 'RØDT FLAGG - Vurder henvisning',
          messageEn: 'RED FLAG - Consider referral',
          severity: SEVERITY.CRITICAL
        }
      }
    ]
  },

  elbow: {
    id: 'elbow',
    name: 'Albue',
    nameEn: 'Elbow',
    icon: 'elbow',
    sections: [
      {
        id: 'observation',
        title: 'Observasjon',
        titleEn: 'Observation',
        items: [
          { id: 'carrying_angle', label: 'Carrying angle', type: 'select',
            options: ['Normal (5-15°)', 'Cubitus valgus', 'Cubitus varus'] },
          { id: 'swelling', label: 'Hevelse', type: 'select',
            options: ['Ingen', 'Mild', 'Moderat', 'Alvorlig'] },
          { id: 'olecranon_bursitis', label: 'Olecranon bursitt', type: 'checkbox' },
          { id: 'deformity', label: 'Deformitet', type: 'checkbox' },
          { id: 'atrophy', label: 'Muskelatrofi', type: 'text' }
        ]
      },
      {
        id: 'rom',
        title: 'ROM',
        titleEn: 'ROM',
        items: [
          { id: 'flexion', label: 'Fleksjon', type: 'rom', normal: 145 },
          { id: 'extension', label: 'Ekstensjon', type: 'rom', normal: 0 },
          { id: 'supination', label: 'Supinasjon', type: 'rom', normal: 85 },
          { id: 'pronation', label: 'Pronasjon', type: 'rom', normal: 75 }
        ]
      },
      {
        id: 'epicondylitis',
        title: 'Epicondylitt tester',
        titleEn: 'Epicondylitis Tests',
        items: [
          { id: 'cozen', label: "Cozen's test (lateral epikondylitt)", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Tennisalbue - ECRB tendinopati' },
          { id: 'mills', label: "Mill's test", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Lateral epikondylitt' },
          { id: 'maudsley', label: "Maudsley's test (langfinger ekstensjon)", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Lateral epikondylitt - ECRB' },
          { id: 'golfers_elbow', label: 'Medial epikondylitt test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Golferalbue - pronator/fleksor tendinopati' },
          { id: 'palpation_lateral', label: 'Palpasjon lateral epikondyl', type: 'select',
            options: ['Ikke øm', 'Mild øm', 'Moderat øm', 'Svært øm'] },
          { id: 'palpation_medial', label: 'Palpasjon medial epikondyl', type: 'select',
            options: ['Ikke øm', 'Mild øm', 'Moderat øm', 'Svært øm'] }
        ]
      },
      {
        id: 'nerve_tests',
        title: 'Nervetester',
        titleEn: 'Nerve Tests',
        items: [
          { id: 'tinels_ulnar', label: "Tinel's test (n. ulnaris)", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Ulnar nerve entrapment ved cubitaltunnel' },
          { id: 'elbow_flexion_test', label: 'Albuebøyningstest (3 min)', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Cubitaltunnelsyndrom' },
          { id: 'pin_test', label: 'PIN test (supinasjon mot motstand)', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Posterior interosseous nerve syndrome' }
        ]
      },
      {
        id: 'stability',
        title: 'Stabilitetstester',
        titleEn: 'Stability Tests',
        items: [
          { id: 'valgus_stress', label: 'Valgus stress test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'MCL instabilitet' },
          { id: 'varus_stress', label: 'Varus stress test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'LCL instabilitet' },
          { id: 'posterolateral_rotary', label: 'Posterolateral rotatorisk apprehension', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Posterolateral rotatorisk instabilitet' }
        ]
      }
    ]
  },

  wrist: {
    id: 'wrist',
    name: 'Håndledd og hånd',
    nameEn: 'Wrist and Hand',
    icon: 'hand',
    sections: [
      {
        id: 'observation',
        title: 'Observasjon',
        titleEn: 'Observation',
        items: [
          { id: 'deformity', label: 'Deformitet', type: 'text' },
          { id: 'swelling', label: 'Hevelse', type: 'select',
            options: ['Ingen', 'Mild', 'Moderat', 'Alvorlig'] },
          { id: 'ganglion', label: 'Ganglion', type: 'checkbox' },
          { id: 'atrophy_thenar', label: 'Thenar atrofi', type: 'checkbox',
            interpretation: 'Median nerve kompresjon' },
          { id: 'atrophy_hypothenar', label: 'Hypothenar atrofi', type: 'checkbox',
            interpretation: 'Ulnar nerve kompresjon' },
          { id: 'dupuytren', label: "Dupuytren's kontraktur", type: 'checkbox' }
        ]
      },
      {
        id: 'rom',
        title: 'ROM',
        titleEn: 'ROM',
        items: [
          { id: 'flexion', label: 'Fleksjon', type: 'rom', normal: 80 },
          { id: 'extension', label: 'Ekstensjon', type: 'rom', normal: 70 },
          { id: 'radial_deviation', label: 'Radial deviasjon', type: 'rom', normal: 20 },
          { id: 'ulnar_deviation', label: 'Ulnar deviasjon', type: 'rom', normal: 30 }
        ]
      },
      {
        id: 'carpal_tunnel',
        title: 'Karpaltunnelsyndrom',
        titleEn: 'Carpal Tunnel Syndrome',
        items: [
          { id: 'phalen', label: "Phalen's test (1 min)", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Karpaltunnelsyndrom' },
          { id: 'reverse_phalen', label: "Reverse Phalen's", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Karpaltunnelsyndrom' },
          { id: 'tinel_wrist', label: "Tinel's test (håndledd)", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'N. medianus irritasjon' },
          { id: 'durkan', label: "Durkan's compression test", type: 'test',
            options: ['Negativ', 'Positiv (30s)'],
            interpretation: 'Karpaltunnelsyndrom - mest sensitiv' },
          { id: 'hand_elevation', label: 'Håndelevering test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Karpaltunnelsyndrom' }
        ],
        alert: {
          condition: 3,
          message: 'Karpaltunnelsyndrom sannsynlig (3+ positive)',
          messageEn: 'Carpal tunnel syndrome likely (3+ positive)',
          severity: SEVERITY.MODERATE
        }
      },
      {
        id: 'scaphoid',
        title: 'Scaphoid/Båtbeinsbrudd',
        titleEn: 'Scaphoid Fracture',
        items: [
          { id: 'anatomical_snuffbox', label: 'Anatomisk snusdåse ømhet', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Mulig scaphoidfraktur' },
          { id: 'scaphoid_tubercle', label: 'Scaphoid tuberkel ømhet', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Mulig scaphoidfraktur' },
          { id: 'axial_compression', label: 'Aksialt kompresjonstest (tommel)', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Mulig scaphoidfraktur' },
          { id: 'wrist_trauma', label: 'Falltraume på utstrakt hånd', type: 'checkbox' }
        ],
        alert: {
          condition: 2,
          message: 'Scaphoidfraktur må utelukkes - Henvis rtg + MR ved neg rtg',
          messageEn: 'Rule out scaphoid fracture - X-ray + MRI if negative',
          severity: SEVERITY.HIGH
        }
      },
      {
        id: 'tfcc_ulnar',
        title: 'TFCC og ulnar smerte',
        titleEn: 'TFCC and Ulnar Pain',
        items: [
          { id: 'piano_key', label: 'Piano key test (ulnar foveapress)', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'TFCC skade' },
          { id: 'fovea_sign', label: 'Fovea sign', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'TFCC eller LT ligament skade' },
          { id: 'ulnar_grind', label: 'Ulnocarpal grind test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'TFCC patologi' },
          { id: 'supination_lift', label: 'Supination lift test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'ECU subluksasjon' }
        ]
      },
      {
        id: 'tendon_tests',
        title: 'Senetester',
        titleEn: 'Tendon Tests',
        items: [
          { id: 'finkelstein', label: "Finkelstein's test", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'De Quervain tenosynovitt' },
          { id: 'eichhoff', label: "Eichhoff's test", type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'De Quervain tenosynovitt' },
          { id: 'trigger_finger', label: 'Triggerfinger', type: 'test',
            options: ['Ingen', 'Catching', 'Låsing'],
            interpretation: 'Stenoserende tenosynovitt' },
          { id: 'boutonniere', label: 'Boutonniere test', type: 'test',
            options: ['Negativ', 'Positiv'],
            interpretation: 'Sentralslip ruptur' },
          { id: 'mallet_finger', label: 'Mallet finger', type: 'checkbox',
            interpretation: 'Ekstensor sene avulsjon DIP' }
        ]
      },
      {
        id: 'grip_strength',
        title: 'Gripestyrke',
        titleEn: 'Grip Strength',
        items: [
          { id: 'grip_right', label: 'Gripestyrke høyre', type: 'measurement', unit: 'kg' },
          { id: 'grip_left', label: 'Gripestyrke venstre', type: 'measurement', unit: 'kg' },
          { id: 'pinch_right', label: 'Pinsetgrep høyre', type: 'measurement', unit: 'kg' },
          { id: 'pinch_left', label: 'Pinsetgrep venstre', type: 'measurement', unit: 'kg' }
        ]
      }
    ]
  },

  tmj: {
    id: 'tmj',
    name: 'TMJ/Kjeveledd',
    nameEn: 'TMJ',
    icon: 'jaw',
    sections: [
      {
        id: 'observation',
        title: 'Inspeksjon',
        titleEn: 'Inspection',
        items: [
          { id: 'symmetry', label: 'Normal symmetri', type: 'checkbox' },
          { id: 'mandible_deviation', label: 'Lateral mandibel deviasjon', type: 'select',
            options: ['Ingen', 'Høyre', 'Venstre'] },
          { id: 'facial_asymmetry', label: 'Asymmetri ansikt', type: 'checkbox' },
          { id: 'masseter_hypertrophy', label: 'Hypertrofi masseter', type: 'select',
            options: ['Ingen', 'Høyre', 'Venstre', 'Bilateral'] }
        ]
      },
      {
        id: 'palpation',
        title: 'Palpasjon TMJ',
        titleEn: 'TMJ Palpation',
        items: [
          { id: 'tmj_right', label: 'Høyre TMJ', type: 'select', options: ['Ikke øm', 'Øm', 'Svært øm'] },
          { id: 'tmj_left', label: 'Venstre TMJ', type: 'select', options: ['Ikke øm', 'Øm', 'Svært øm'] },
          { id: 'click_right', label: 'Klikking høyre ved åpning', type: 'checkbox' },
          { id: 'click_left', label: 'Klikking venstre ved åpning', type: 'checkbox' },
          { id: 'crepitus_right', label: 'Krepitasjon høyre', type: 'checkbox' },
          { id: 'crepitus_left', label: 'Krepitasjon venstre', type: 'checkbox' }
        ]
      },
      {
        id: 'rom',
        title: 'Kjeve ROM',
        titleEn: 'Jaw ROM',
        items: [
          { id: 'opening', label: 'Maksimal åpning', type: 'measurement', unit: 'mm', normal: '>40' },
          { id: 'opening_deviation', label: 'Deviasjon ved åpning', type: 'select',
            options: ['Ingen', 'C-kurve H', 'C-kurve V', 'S-kurve'] },
          { id: 'lateral_right', label: 'Lateral deviasjon høyre', type: 'measurement', unit: 'mm' },
          { id: 'lateral_left', label: 'Lateral deviasjon venstre', type: 'measurement', unit: 'mm' },
          { id: 'protrusion', label: 'Protrusion', type: 'measurement', unit: 'mm' }
        ]
      },
      {
        id: 'muscle_palpation',
        title: 'Muskelpalpasjon',
        titleEn: 'Muscle Palpation',
        items: [
          { id: 'masseter_right', label: 'Masseter høyre', type: 'select',
            options: ['Ikke øm', 'Øm', 'Triggerpunkt'] },
          { id: 'masseter_left', label: 'Masseter venstre', type: 'select',
            options: ['Ikke øm', 'Øm', 'Triggerpunkt'] },
          { id: 'temporalis_right', label: 'Temporalis høyre', type: 'select',
            options: ['Ikke øm', 'Øm', 'Triggerpunkt'] },
          { id: 'temporalis_left', label: 'Temporalis venstre', type: 'select',
            options: ['Ikke øm', 'Øm', 'Triggerpunkt'] },
          { id: 'pterygoid_right', label: 'Lateral pterygoid høyre (intraoral)', type: 'select',
            options: ['Ikke øm', 'Øm'] },
          { id: 'pterygoid_left', label: 'Lateral pterygoid venstre (intraoral)', type: 'select',
            options: ['Ikke øm', 'Øm'] }
        ]
      }
    ]
  },

  dynamicPositional: {
    id: 'dynamicPositional',
    name: 'Dynamisk posisjonell testing',
    nameEn: 'Dynamic Positional Testing',
    icon: 'activity',
    description: 'Muskelstyrketesting i ulike posisjoner for å identifisere dysfunksjonelle områder',
    sections: [
      {
        id: 'baseline',
        title: 'Baseline testing',
        titleEn: 'Baseline Testing',
        items: [
          { id: 'baseline_deltoid', label: 'Baseline deltoid anterior', type: 'select',
            options: ['Sterk/låst', 'Svak/ikke-låst'],
            interpretation: 'Etablerer baseline før challenge-testing' }
        ]
      },
      {
        id: 'cervical_challenges',
        title: 'Cervical challenges',
        titleEn: 'Cervical Challenges',
        items: [
          { id: 'cervical_flexion_challenge', label: 'Cervical fleksjon challenge', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: Suboksipital/øvre cervical dysfunksjon' },
          { id: 'cervical_extension_challenge', label: 'Cervical ekstensjon challenge', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: Nedre cervical/thoracic overgang dysfunksjon' },
          { id: 'cervical_rotation_right', label: 'Cervical rotasjon høyre challenge', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: C1-C2 dysfunksjon, vertebral arterie' },
          { id: 'cervical_rotation_left', label: 'Cervical rotasjon venstre challenge', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: C1-C2 dysfunksjon, vertebral arterie' }
        ]
      },
      {
        id: 'tmj_challenges',
        title: 'TMJ challenges',
        titleEn: 'TMJ Challenges',
        items: [
          { id: 'jaw_opening_challenge', label: 'Kjeve maksimal åpning challenge', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: TMJ dysfunksjon, C1-C2 instabilitet' },
          { id: 'mandible_deviation_right', label: 'Lateral mandibel deviasjon høyre', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: Ipsilateral TMJ, SCM, scalene dysfunksjon' },
          { id: 'mandible_deviation_left', label: 'Lateral mandibel deviasjon venstre', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: Ipsilateral TMJ, SCM, scalene dysfunksjon' }
        ]
      },
      {
        id: 'visual_challenges',
        title: 'Visuelle challenges',
        titleEn: 'Visual Challenges',
        items: [
          { id: 'eyes_closed_challenge', label: 'Øyne lukket challenge', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: Visuell-vestibulær integrasjon dysfunksjon' },
          { id: 'gaze_right_challenge', label: 'Øyne maksimal høyre gaze', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: Okulomotorisk dysfunksjon' },
          { id: 'gaze_left_challenge', label: 'Øyne maksimal venstre gaze', type: 'test',
            options: ['Sterk', 'Svak'],
            interpretation: 'Svak: Okulomotorisk dysfunksjon' }
        ]
      }
    ]
  },

  activatorMethod: {
    id: 'activatorMethod',
    name: 'Aktivator metode',
    nameEn: 'Activator Method',
    icon: 'zap',
    description: 'Benlengde-analyse og spinal screening ved hjelp av Aktivator-protokollen',
    sections: [
      {
        id: 'leg_length',
        title: 'Benlengdeanalyse',
        titleEn: 'Leg Length Analysis',
        items: [
          { id: 'static_leg_length', label: 'Statisk benlengde', type: 'select',
            options: ['Lik', 'Høyre kort', 'Venstre kort'],
            interpretation: 'Anatomisk vs funksjonell benlengdeforskjell' },
          { id: 'leg_length_difference', label: 'Differanse', type: 'measurement', unit: 'mm' }
        ]
      },
      {
        id: 'dynamic_head',
        title: 'Dynamisk hodetest',
        titleEn: 'Dynamic Head Test',
        items: [
          { id: 'dynamic_head_lift', label: 'Dynamisk hodeløft', type: 'select',
            options: ['Ingen endring', 'Høyre forkortes', 'Venstre forkortes', 'Forlenges'],
            interpretation: 'Cervical dysfunksjon indikert ved benlengdeendring' },
          { id: 'dynamic_head_rotation_right', label: 'Dynamisk hoderotasjon høyre', type: 'select',
            options: ['Ingen endring', 'Høyre forkortes', 'Venstre forkortes'],
            interpretation: 'C1-C2 dysfunksjon' },
          { id: 'dynamic_head_rotation_left', label: 'Dynamisk hoderotasjon venstre', type: 'select',
            options: ['Ingen endring', 'Høyre forkortes', 'Venstre forkortes'],
            interpretation: 'C1-C2 dysfunksjon' }
        ]
      },
      {
        id: 'palpation_screening',
        title: 'Palpasjonsscreening',
        titleEn: 'Palpation Screening',
        items: [
          { id: 'c0_c1_palpation', label: 'C0-C1 palpasjon', type: 'select',
            options: ['Normal', 'Restriksjon'],
            interpretation: 'Occipitocervical dysfunksjon' },
          { id: 'c1_c2_palpation', label: 'C1-C2 palpasjon', type: 'select',
            options: ['Normal', 'Restriksjon'],
            interpretation: 'Atlantoaxial dysfunksjon' },
          { id: 'c2_c7_palpation', label: 'C2-C7 palpasjon', type: 'text',
            interpretation: 'Segmental dysfunksjon - spesifiser nivå' }
        ]
      }
    ]
  }
};

// Cluster testing protocols
export const CLUSTER_TESTS = {
  cerebellar: {
    id: 'cerebellar',
    name: 'Cerebellær dysfunksjon',
    nameEn: 'Cerebellar Dysfunction',
    threshold: 4,
    total: 8,
    criteria: {
      high: { score: 4, message: 'Høy sannsynlighet for cerebellær patologi', action: 'Henvis til nevrolog, MR caput' },
      moderate: { score: 2, message: 'Moderat sannsynlighet, vurder videre utredning', action: 'Følg opp om 4-6 uker' },
      low: { score: 0, message: 'Lav sannsynlighet', action: 'Ingen handling nødvendig' }
    },
    tests: [
      { id: 'saccade_overshoot', name: 'Sakkade overshoots (VNG/VOG)',
        criteria: 'Bilateral horisontal/vertikal overshoot >10%',
        interpretation: 'Fastigial nucleus/OMV dysfunksjon',
        findings: [
          { id: 'normal', label: 'Normal' },
          { id: 'overshoot_bilateral', label: 'Overshoots bilateral >10%' },
          { id: 'overshoot_right', label: 'Overshoots høyre' },
          { id: 'overshoot_left', label: 'Overshoots venstre' }
        ] },
      { id: 'smooth_pursuit', name: 'Smooth pursuit med catch-up sakkader',
        criteria: 'Pursuit gain <0.7, >5 catch-up sakkader/30s',
        interpretation: 'Flocculus/paraflocculus dysfunksjon',
        findings: [
          { id: 'normal', label: 'Normal (gain 0.9-1.0)' },
          { id: 'catchup_bilateral', label: 'Catch-up sakkader bilateral' },
          { id: 'saccadic', label: 'Sakkadisk pursuit' }
        ] },
      { id: 'gaze_evoked_nystagmus', name: 'Gaze-evoked nystagmus',
        criteria: 'Horisontal/vertikal gaze-evoked ved 20°',
        interpretation: 'Neural integrator dysfunksjon',
        findings: [
          { id: 'none', label: 'Ingen' },
          { id: 'horizontal', label: 'Horisontal gaze-evoked' },
          { id: 'vertical', label: 'Vertikal gaze-evoked' },
          { id: 'rebound', label: 'Rebound nystagmus' }
        ] },
      { id: 'finger_nose_right', name: 'Finger-nese-finger høyre',
        criteria: 'Dysmetri, intention tremor, dekomponert',
        interpretation: 'Høyre cerebellær hemisphære',
        findings: [
          { id: 'normal', label: 'Normal' },
          { id: 'dysmetria', label: 'Dysmetri' },
          { id: 'intention_tremor', label: 'Intention tremor' },
          { id: 'decomposed', label: 'Dekomponert' }
        ] },
      { id: 'finger_nose_left', name: 'Finger-nese-finger venstre',
        criteria: 'Dysmetri, intention tremor, dekomponert',
        interpretation: 'Venstre cerebellær hemisphære',
        findings: [
          { id: 'normal', label: 'Normal' },
          { id: 'dysmetria', label: 'Dysmetri' },
          { id: 'intention_tremor', label: 'Intention tremor' },
          { id: 'decomposed', label: 'Dekomponert' }
        ] },
      { id: 'dysdiadochokinesia_right', name: 'Dysdiadokokinesi høyre',
        criteria: '<10 bevegelser/5s, irregulær/arytmisk',
        interpretation: 'Høyre cerebellær hemisphære',
        findings: [
          { id: 'normal', label: 'Normal rytme' },
          { id: 'slow', label: 'Redusert hastighet' },
          { id: 'irregular', label: 'Irregulær' },
          { id: 'arrhythmic', label: 'Arytmisk' }
        ] },
      { id: 'dysdiadochokinesia_left', name: 'Dysdiadokokinesi venstre',
        criteria: '<10 bevegelser/5s, irregulær/arytmisk',
        interpretation: 'Venstre cerebellær hemisphære',
        findings: [
          { id: 'normal', label: 'Normal rytme' },
          { id: 'slow', label: 'Redusert hastighet' },
          { id: 'irregular', label: 'Irregulær' },
          { id: 'arrhythmic', label: 'Arytmisk' }
        ] },
      { id: 'tandem_gait', name: 'Tandem gange',
        criteria: 'Lateral svaing >10cm, korrigerende steg',
        interpretation: 'Vermis/flocculonodular',
        findings: [
          { id: 'normal', label: 'Normal' },
          { id: 'lateral_sway', label: 'Lateral svaing' },
          { id: 'truncal_ataxia', label: 'Truncal ataksi' },
          { id: 'unable', label: 'Ikke i stand' }
        ] },
      { id: 'romberg_modified', name: 'Romberg (modifisert)',
        criteria: 'Ustabilitet med åpne øyne',
        interpretation: 'Midline cerebellum (vermis)',
        findings: [
          { id: 'stable_both', label: 'Stabil begge' },
          { id: 'unstable_open', label: 'Ustabil åpne øyne (cerebellær)' },
          { id: 'unstable_closed', label: 'Ustabil lukkede (proprioseptiv)' }
        ] },
      { id: 'heel_knee_shin_right', name: 'Hel-kne-legg høyre',
        criteria: 'Ataksi, tremor',
        interpretation: 'Høyre cerebellær hemisphære',
        findings: [
          { id: 'normal', label: 'Normal' },
          { id: 'ataxia', label: 'Ataksi' },
          { id: 'tremor', label: 'Tremor' }
        ] },
      { id: 'heel_knee_shin_left', name: 'Hel-kne-legg venstre',
        criteria: 'Ataksi, tremor',
        interpretation: 'Venstre cerebellær hemisphære',
        findings: [
          { id: 'normal', label: 'Normal' },
          { id: 'ataxia', label: 'Ataksi' },
          { id: 'tremor', label: 'Tremor' }
        ] },
      { id: 'truncal_stability', name: 'Truncal stabilitet',
        criteria: 'Ustabilitet sittende',
        interpretation: 'Midline cerebellum',
        findings: [
          { id: 'normal', label: 'Normal' },
          { id: 'sway_sitting', label: 'Svaing sittende' },
          { id: 'needs_support', label: 'Trenger støtte' }
        ] }
    ]
  },

  vestibular: {
    id: 'vestibular',
    name: 'Perifert vestibulært tap',
    nameEn: 'Peripheral Vestibular Loss',
    threshold: 3,
    total: 6,
    sensitivity: 85,
    specificity: 90,
    tests: [
      { id: 'spontaneous_nystagmus', name: 'Spontan nystagmus (fikseringsblokk)',
        criteria: 'Horisontal-torsjonell mot frisk side, SPV >6°/s',
        interpretation: 'Akutt perifert vestibulært tap' },
      { id: 'head_impulse', name: 'Head Impulse Test (Halmagyi)',
        criteria: 'Positiv (corrective saccade)',
        interpretation: 'Ipsilateral superior canal dysfunction' },
      { id: 'caloric', name: 'Caloric Test (VNG)',
        criteria: 'Unilateral weakness >25%',
        interpretation: 'Perifert tap samme side' },
      { id: 'skew_deviation', name: 'Test av skew (vertical misalignment)',
        criteria: 'Vertikal diplopi, cover-uncover positiv',
        interpretation: 'Positiv = SENTRAL lesjon (ikke perifert)',
        invertedLogic: true },
      { id: 'gait_head_movement', name: 'Gangtest med hodebevegelser',
        criteria: 'Avvergegange mot affisert side, Romberg fall',
        interpretation: 'Perifert vestibulært tap' },
      { id: 'dynamic_visual_acuity', name: 'Dynamic Visual Acuity',
        criteria: '>3 linjer tap på Snellen ved hoderotasjon',
        interpretation: 'Bilateral vestibulær tap ved bilateral funn' }
    ],
    hintsPlus: {
      name: 'HINTS-PLUS protokoll (ekskluder hjerneslag)',
      redFlags: [
        { id: 'hi_normal', name: 'Head Impulse NORMAL', meaning: 'Dårlig tegn - indikerer SENTRAL' },
        { id: 'nystagmus_direction_changing', name: 'Nystagmus vertikal/retningsendrede', meaning: 'Dårlig tegn - SENTRAL' },
        { id: 'skew_positive', name: 'Test of Skew POSITIV', meaning: 'Dårlig tegn - SENTRAL' },
        { id: 'hearing_loss', name: 'Hørselstap ipsilateral', meaning: 'Bekrefter PERIFERT', good: true }
      ],
      action: 'HINTS+ positiv for SENTRAL lesjon → Akutt henvisning nevrolog/ØNH'
    }
  },

  cervicogenic: {
    id: 'cervicogenic',
    name: 'Cervikogen svimmelhet',
    nameEn: 'Cervicogenic Dizziness',
    threshold: 4,
    total: 7,
    note: 'Alltid ekskluder vestibulær og cerebellær patologi først',
    tests: [
      { id: 'cervical_rom', name: 'Cervical ROM',
        criteria: 'Begrenset rotasjon <60° bilateral, provoserer svimmelhet',
        interpretation: 'Redusert proprioseptiv input fra C1-C3' },
      { id: 'smooth_pursuit_neck_torsion', name: 'Smooth Pursuit Neck Torsion Test',
        criteria: 'Redusert pursuit gain med nakke rotert 45°, gain forskjell >0.1',
        interpretation: 'Cervical proprioseptiv dysfunksjon' },
      { id: 'cervical_flexion_rotation', name: 'Cervical Flexion-Rotation Test (C1-C2)',
        criteria: 'Begrenset rotasjon <32°, asymmetri >10°',
        interpretation: 'Upper cervical dysfunksjon (C1-C2)' },
      { id: 'vertebral_artery', name: 'Vertebral Artery Testing',
        criteria: 'De Kleyn, Maigne, Hautant, Underberg positive',
        interpretation: 'Vertebrobasilar insuffisiens (VBI)',
        redFlag: true },
      { id: 'joint_position_error', name: 'Cervical Joint Position Error (JPE)',
        criteria: '>4.5° feil ved relokalisering',
        interpretation: 'Proprioseptiv dysfunksjon' },
      { id: 'palpation_segmental', name: 'Palpasjon og segmental testing',
        criteria: 'C1-C2 restriksjon, suboksipital hypertoni',
        interpretation: 'Muskuloskeletal dysfunksjon' },
      { id: 'provocation', name: 'Provokasjonstest',
        criteria: 'Svimmelhet ved sustained posisjon/isometrisk motstand',
        interpretation: 'Cervikogen årsak (ikke BPPV)' }
    ],
    redFlags: [
      '5 D\'s og 3 N\'s tilstede (VBI)',
      'Drop attacks',
      'Diplopi, dysartri, dysfagi',
      'Nystagmus (vertikal/retningsendrede)'
    ]
  },

  myelopathy: {
    id: 'myelopathy',
    name: 'Myelopati (cervical spinal cord compression)',
    nameEn: 'Myelopathy',
    threshold: 3,
    total: 6,
    critical: true,
    action: 'STOPP kiropraktisk behandling. Akutt henvisning nevrolog/nevrokirurg. MR cervical med høy prioritet.',
    tests: [
      { id: 'hoffmanns', name: "Hoffmann's Sign",
        criteria: 'Positiv (fleksjon av tommel/pekefinger ved flicking)',
        interpretation: 'Kortikal disinhibisjon, øvre motorneuron lesjon' },
      { id: 'hyperreflexia', name: 'Hyperrefleksi',
        criteria: 'Biceps/triceps/patella/achilles 3+ eller mer, klonus ≥5 slag',
        interpretation: 'Øvre motorneuron lesjon' },
      { id: 'babinski', name: 'Babinski Sign',
        criteria: 'Ekstensor plantarrefleks (stortå opp)',
        interpretation: 'Patologisk, øvre motorneuron' },
      { id: 'lhermittes', name: "Lhermitte's Sign",
        criteria: '"Elektrisk" følelse ned ryggen ved nakke fleksjon',
        interpretation: 'Ryggmargskompresjon eller demyelinisering' },
      { id: 'gait_coordination', name: 'Gange og koordinasjon',
        criteria: 'Ataktisk/spastisk gange, fotsmell, tap av balanse',
        interpretation: 'Myelopatisk gange' },
      { id: 'hand_function', name: 'Hånd funksjontest',
        criteria: 'Kan ikke kneppe knapper, <20 grip-release/10s',
        interpretation: 'Myelopati med upper extremity involvement' }
    ],
    differentials: [
      'Cervical spondylotic myelopathy (degenerativ)',
      'OPLL (ossification posterior longitudinal ligament)',
      'Rheumatoid myelopati',
      'Tumor (intradural/extradural)',
      'Multipel sklerose'
    ]
  },

  upperCervicalInstability: {
    id: 'upperCervicalInstability',
    name: 'Upper cervical instabilitet',
    nameEn: 'Upper Cervical Instability',
    threshold: 4,
    total: 7,
    critical: true,
    action: 'INGEN HVLA manipulasjon. Henvis til MR cervical med fleksjon-ekstensjon. ADI >3mm voksen = patologisk.',
    tests: [
      { id: 'sharp_purser', name: 'Sharp-Purser Test',
        criteria: 'Positiv: Clunk, symptomreduksjon ved anterior glide C1',
        interpretation: 'Atlantoaxial instabilitet' },
      { id: 'alar_ligament', name: 'Alar Ligament Stress Test',
        criteria: 'Økt bevegelse >45°, ingen motstand',
        interpretation: 'Alar ligament insuffisiens' },
      { id: 'transverse_ligament', name: 'Transverse Ligament Test',
        criteria: 'Ustabilitetsfølelse, neurologiske symptomer ved anterior shear',
        interpretation: 'Transvers ligament insuffisiens' },
      { id: 'membrana_tectoria', name: 'Membrana Tectoria Test',
        criteria: 'Positiv ved cervikal fleksjon + aksial belastning',
        interpretation: 'Membrana tectoria insuffisiens' },
      { id: 'flexion_rotation', name: 'Cervical Flexion-Rotation Test',
        criteria: '<32° rotasjon bilateral, empty end-feel',
        interpretation: 'Upper cervical dysfunction' },
      { id: 'self_support', name: 'Selftesting',
        criteria: 'Holder hode med hender, ustabilitetsfølelse, frykt',
        interpretation: 'Subjektiv instabilitet' },
      { id: 'neurological', name: 'Neurologiske tegn',
        criteria: "Upper motor neuron signs, Lhermitte's, Hoffmann's, Babinski",
        interpretation: 'Cord compression' }
    ],
    redFlags: [
      'Trauma i anamnese (whiplash, fall)',
      'Revmatoid artritt (50% har C1-C2 instabilitet)',
      'Down syndrom',
      'Ehlers-Danlos syndrom (hypermobilitet)',
      'Myelopatiske tegn'
    ]
  },

  tmj: {
    id: 'tmj',
    name: 'TMJ dysfunksjon med cervical involvering',
    nameEn: 'TMJ Dysfunction with Cervical Involvement',
    threshold: 3,
    total: 7,
    sensitivity: 78,
    specificity: 82,
    note: 'TMJ og cervikalcolumna er funksjonelt sammenkoblet - vurder alltid begge regioner',
    tests: [
      { id: 'tmj_palpation', name: 'TMJ palpasjon',
        criteria: 'Lateral pol ømhet (0-3 VAS), Posterior attachment ømhet, Krepitasjon/klikking ved åpning',
        interpretation: 'Intraartikulær TMJ patologi, diskusforskyvning' },
      { id: 'masseter_temporalis', name: 'Masseter/Temporalis palpasjon',
        criteria: 'Triggerpunkter i masseter/temporalis, VAS ≥4, Referert smerte til temporal region',
        interpretation: 'Myofascial pain dysfunction (MPD), bruksisme' },
      { id: 'mandibular_rom', name: 'Mandibulær ROM',
        criteria: 'Åpning <40mm, Assistert åpning øker <5mm, Deviasjon >2mm, C-kurve ved åpning',
        interpretation: 'Begrenset åpning: muskelspasme eller diskuslåsing' },
      { id: 'cervical_mandibular', name: 'Cervical-mandibulær interaksjon',
        criteria: 'Kjeve åpning/lukking endres med nakke posisjon, TMJ smerte ved nakke rotasjon',
        interpretation: 'Funksjonell kobling mellom cervikal og TMJ' },
      { id: 'dynamic_muscle_test', name: 'Dynamisk muskeltest',
        criteria: 'Indikatormuskel svekkes ved kjeve åpning/lateral deviasjon, Asymmetrisk respons',
        interpretation: 'Nevromuskulær dysfunksjon, proprioseptiv forstyrrelse' },
      { id: 'upper_cervical_tmj', name: 'Upper cervical screening',
        criteria: 'C1-C2 rotasjon <32° bilateral, Suboksipital triggerpunkter, Occipital hodepine',
        interpretation: 'Upper cervical dysfunksjon bidrar til TMJ symptomer' },
      { id: 'otalgia_referred', name: 'Otalgia og referert smerte',
        criteria: 'Øresmerter uten otologisk funn, Tinnitus som endres med TMJ bevegelse, "Fullhet" i øret',
        interpretation: 'Referert smerte fra TMJ/masticatory muskler' }
    ],
    differentials: [
      'Intern diskusforskyvning (med/uten reduksjon)',
      'Myofascial pain dysfunction (MPD)',
      'Osteoartritt i TMJ',
      'Cervikogen hodepine med TMJ involvering',
      'Trigeminal nevralgi',
      'Bruksisme/tanngnissing'
    ],
    redFlags: [
      'Akutt låsing (kan ikke åpne munnen)',
      'Progressiv asymmetri i ansiktet',
      'Uforklarlig vekttap med kjeveleddsmerter',
      'Nummenhet/parestesier i V3 distribusjon',
      'Trismus etter tannbehandling/infeksjon'
    ]
  }
};

// BPPV Testing Protocol
export const BPPV_PROTOCOLS = {
  posteriorCanal: {
    name: 'Posterior kanal BPPV (80-90%)',
    prevalence: '80-90% av alle BPPV tilfeller',
    tests: {
      dixHallpikeRight: {
        id: 'dix_hallpike_right',
        name: 'Dix-Hallpike høyre',
        findings: [
          { id: 'negative', label: 'Negativ' },
          { id: 'geotropic_torsional', label: 'Geotropisk torsjonell nystagmus' },
          { id: 'ageotropic', label: 'Ageotropisk nystagmus' },
          { id: 'vertical', label: 'Vertikal nystagmus' }
        ],
        characteristics: [
          { id: 'latency', label: 'Latency <5 sekunder', type: 'checkbox' },
          { id: 'duration', label: 'Varighet <60 sekunder', type: 'checkbox' },
          { id: 'fatiguable', label: 'Fatiguable ved repetisjon', type: 'checkbox' }
        ],
        interpretation: 'Posterior canal BPPV høyre side'
      },
      dixHallpikeLeft: {
        id: 'dix_hallpike_left',
        name: 'Dix-Hallpike venstre',
        findings: [
          { id: 'negative', label: 'Negativ' },
          { id: 'geotropic_torsional', label: 'Geotropisk torsjonell nystagmus' },
          { id: 'ageotropic', label: 'Ageotropisk nystagmus' },
          { id: 'vertical', label: 'Vertikal nystagmus' }
        ],
        characteristics: [
          { id: 'latency', label: 'Latency <5 sekunder', type: 'checkbox' },
          { id: 'duration', label: 'Varighet <60 sekunder', type: 'checkbox' },
          { id: 'fatiguable', label: 'Fatiguable ved repetisjon', type: 'checkbox' }
        ],
        interpretation: 'Posterior canal BPPV venstre side'
      }
    }
  },
  lateralCanal: {
    geotropic: {
      name: 'Lateral kanal BPPV - Geotropisk (Canalolithiasis)',
      tests: {
        supineRollRight: {
          id: 'supine_roll_right',
          name: 'Supine roll høyre',
          findings: [
            { id: 'negative', label: 'Negativ' },
            { id: 'geotropic_horizontal', label: 'Geotropisk horisontal nystagmus' },
            { id: 'ageotropic', label: 'Ageotropisk nystagmus' }
          ],
          intensity: ['Svak', 'Moderat', 'Sterk'],
          interpretation: 'Sammenlign intensitet med venstre side'
        },
        supineRollLeft: {
          id: 'supine_roll_left',
          name: 'Supine roll venstre',
          findings: [
            { id: 'negative', label: 'Negativ' },
            { id: 'geotropic_horizontal', label: 'Geotropisk horisontal nystagmus' },
            { id: 'ageotropic', label: 'Ageotropisk nystagmus' }
          ],
          intensity: ['Svak', 'Moderat', 'Sterk'],
          interpretation: 'Sterkest side = affisert side ved geotropisk'
        },
        bowAndLean: {
          name: 'Bow and Lean Test',
          positive: ['Downbeat ved bow', 'Upbeat ved lean']
        }
      },
      sideAffected: 'Side med sterkest nystagmus i undermost posisjon',
      treatment: ['Gufoni manøver', 'BBQ roll', 'Forced prolonged position']
    },
    ageotropic: {
      name: 'Lateral kanal BPPV - Ageotropisk (Cupulolithiasis)',
      tests: {
        supineRollRight: {
          id: 'supine_roll_right_ageo',
          name: 'Supine roll høyre',
          findings: [
            { id: 'negative', label: 'Negativ' },
            { id: 'ageotropic', label: 'Ageotropisk horisontal nystagmus' }
          ],
          intensity: ['Svak', 'Moderat', 'Sterk'],
          interpretation: 'Sammenlign med venstre side'
        },
        supineRollLeft: {
          id: 'supine_roll_left_ageo',
          name: 'Supine roll venstre',
          findings: [
            { id: 'negative', label: 'Negativ' },
            { id: 'ageotropic', label: 'Ageotropisk horisontal nystagmus' }
          ],
          intensity: ['Svak', 'Moderat', 'Sterk'],
          interpretation: 'SVAKEST side = affisert side ved ageotropisk'
        },
        bowAndLean: {
          name: 'Bow and Lean Test',
          positive: ['Upbeat ved bow', 'Downbeat ved lean']
        }
      },
      sideAffected: 'Side med SVAKEST nystagmus i undermost posisjon',
      treatment: ['Modifisert Gufoni', 'Head-shaking', 'Mastoid vibration'],
      note: 'Vanskeligere å behandle enn geotropisk variant'
    }
  },
  anteriorCanal: {
    name: 'Anterior kanal BPPV (<5%, sjelden)',
    tests: {
      deepHeadHanging: {
        name: 'Deep Head Hanging (Yacovino)',
        positive: ['Downbeating nystagmus', 'Torsjonell komponent mot affisert side', 'Latency <5s']
      }
    },
    treatment: ['Yacovino manøver', 'Reverse Epley']
  },
  // Treatment protocols for all canals
  treatmentProtocols: {
    epley: {
      name: 'Epley manøver',
      indication: 'Posterior canal BPPV',
      steps: [
        'Pasient sittende, hode rotert 45° mot affisert side',
        'Legg raskt bakover, hode hengende 30° under benk (2 min)',
        'Rotér hodet 90° mot motsatt side (2 min)',
        'Rotér kropp til sidelliggende, hode 45° ned (2 min)',
        'Sitt langsomt opp med hodet lett bøyd fremover'
      ]
    },
    semont: {
      name: 'Semont manøver',
      indication: 'Posterior canal BPPV',
      steps: [
        'Pasient sittende, hode rotert 45° bort fra affisert side',
        'Rask bevegelse til sideliggende på affisert side (2 min)',
        'Rask bevegelse gjennom sittende til motsatt side (2 min)',
        'Sitt langsomt opp'
      ]
    },
    gufoni: {
      name: 'Gufoni manøver',
      indication: 'Lateral canal BPPV (geotropisk)',
      steps: [
        'Pasient sittende',
        'Rask bevegelse til sideliggende på IKKE-affisert side (1 min)',
        'Rotér hodet 45° ned mot gulv (2 min)',
        'Sitt langsomt opp'
      ]
    },
    bbqRoll: {
      name: 'BBQ Roll (Lempert)',
      indication: 'Lateral canal BPPV (geotropisk)',
      steps: [
        'Pasient ryggliggende, hode høyre',
        'Rotér 90° steg for steg bort fra affisert side',
        'Hold hvert steg 30-60 sekunder',
        'Fortsett til pasient er tilbake til start (360°)'
      ]
    },
    yacovino: {
      name: 'Yacovino manøver',
      indication: 'Anterior canal BPPV',
      steps: [
        'Pasient sittende',
        'Legg bakover til deep head hanging posisjon (2 min)',
        'Bring hodet til hake-mot-bryst posisjon (2 min)',
        'Sitt langsomt opp'
      ]
    }
  },
  // Clinical form for UI
  clinicalForm: {
    sections: [
      {
        id: 'posterior_canal_tests',
        title: 'Posterior kanal tester',
        tests: ['dixHallpikeRight', 'dixHallpikeLeft']
      },
      {
        id: 'lateral_canal_tests',
        title: 'Lateral kanal tester',
        tests: ['supineRollRight', 'supineRollLeft', 'bowAndLean']
      },
      {
        id: 'anterior_canal_tests',
        title: 'Anterior kanal tester',
        tests: ['deepHeadHanging']
      }
    ],
    redFlags: [
      { id: 'central_nystagmus', label: 'Vertikal nystagmus uten torsjon', severity: 'HIGH' },
      { id: 'direction_changing', label: 'Retningsendring nystagmus', severity: 'MODERATE' },
      { id: 'no_fatigue', label: 'Ingen fatigering ved repetisjon', severity: 'HIGH' },
      { id: 'prolonged', label: 'Varighet >60 sekunder', severity: 'MODERATE' },
      { id: 'no_latency', label: 'Ingen latency', severity: 'HIGH' },
      { id: 'neurological', label: 'Ledsagende nevrologiske symptomer', severity: 'CRITICAL' }
    ]
  }
};

// VNG/Oculomotor examination
// VNG/Oculomotor examination - Enhanced with clinical interpretations
export const VNG_EXAMINATION = {
  spontaneousNystagmus: {
    name: 'Spontan nystagmus',
    nameEn: 'Spontaneous Nystagmus',
    conditions: ['Øyne åpne', 'Fikseringsblokk (Frenzel)'],
    threshold: '<4°/s er normalt',
    findings: [
      { id: 'none', label: 'Ingen nystagmus (<4°/s)', interpretation: 'Normal' },
      { id: 'right', label: 'Høyre-rettet nystagmus', interpretation: 'Perifert vestibulært tap venstre side' },
      { id: 'left', label: 'Venstre-rettet nystagmus', interpretation: 'Perifert vestibulært tap høyre side' },
      { id: 'vertical_up', label: 'Upbeat nystagmus', interpretation: 'SENTRAL lesjon - medulla/pontin' },
      { id: 'vertical_down', label: 'Downbeat nystagmus', interpretation: 'SENTRAL lesjon - craniocervikal overgang' },
      { id: 'pendular', label: 'Pendulær nystagmus', interpretation: 'Kongenital eller ervervet CNS lesjon' }
    ],
    characteristics: [
      { id: 'increases_frenzel', label: 'Øker med Frenzel', interpretation: 'Perifert vestibulært' },
      { id: 'decreases_frenzel', label: 'Minsker med Frenzel', interpretation: 'Sentralt' },
      { id: 'constant', label: 'Konstant retning', interpretation: 'Perifert' },
      { id: 'direction_changing', label: 'Retningsendring', interpretation: 'SENTRAL - umiddelbar henvisning' }
    ],
    spv: {
      label: 'Slow Phase Velocity (SPV)',
      unit: '°/s',
      normal: '<4',
      mild: '4-10',
      moderate: '10-20',
      severe: '>20'
    }
  },
  gazeHorizontal: {
    name: 'Gaze testing - Horisontal',
    nameEn: 'Horizontal Gaze Testing',
    eccentricity: '20-30°',
    findings: [
      { id: 'none', label: 'Ingen gaze-evoked nystagmus', interpretation: 'Normal' },
      { id: 'right', label: 'Høyre gaze-evoked nystagmus', interpretation: 'Neural integrator dysfunksjon' },
      { id: 'left', label: 'Venstre gaze-evoked nystagmus', interpretation: 'Neural integrator dysfunksjon' },
      { id: 'bilateral', label: 'Bilateral gaze-evoked nystagmus', interpretation: 'Flocculus/cerebellær dysfunksjon' },
      { id: 'rebound', label: 'Rebound nystagmus', interpretation: 'Cerebellær patologi' }
    ],
    pathology: 'Neural integrator (nucleus prepositus hypoglossi/flocculus)'
  },
  gazeVertical: {
    name: 'Gaze testing - Vertikal',
    nameEn: 'Vertical Gaze Testing',
    findings: [
      { id: 'none', label: 'Ingen vertikal gaze nystagmus', interpretation: 'Normal' },
      { id: 'upbeat', label: 'Upbeat nystagmus', interpretation: 'Medulla lesjon' },
      { id: 'downbeat', label: 'Downbeat nystagmus', interpretation: 'Craniocervikal overgang lesjon' },
      { id: 'torsional', label: 'Torsjonell komponent', interpretation: 'Vestibulær eller sentral' }
    ],
    redFlag: true,
    pathology: 'Sentral lesjon - henvisning nevrolog'
  },
  saccadesHorizontal: {
    name: 'Sakkader - Horisontal',
    nameEn: 'Horizontal Saccades',
    normalGain: { min: 0.9, max: 1.0 },
    normalLatency: { max: 260, unit: 'ms' },
    findings: [
      { id: 'normal', label: 'Normal (gain 0.9-1.0)', interpretation: 'Normal sakkade funksjon' },
      { id: 'overshoot_bilateral', label: 'Overshoots bilateral (>10%)', interpretation: 'Cerebellær dysfunksjon (fastigial nucleus)' },
      { id: 'overshoot_right', label: 'Overshoots høyre', interpretation: 'Ipsilateral cerebellær hemisphære' },
      { id: 'overshoot_left', label: 'Overshoots venstre', interpretation: 'Ipsilateral cerebellær hemisphære' },
      { id: 'hypometric_bilateral', label: 'Hypometri bilateral', interpretation: 'Cerebellær eller basal ganglia dysfunksjon' },
      { id: 'catchup_bilateral', label: 'Catch-up sakkader bilateral', interpretation: 'Kompensasjon for hypometri' },
      { id: 'catchup_right', label: 'Catch-up sakkader høyre', interpretation: 'Ipsilateral patologi' },
      { id: 'catchup_left', label: 'Catch-up sakkader venstre', interpretation: 'Ipsilateral patologi' },
      { id: 'prolonged_latency', label: 'Forlenget latency (>260ms)', interpretation: 'Frontal cortex eller superior colliculus' },
      { id: 'slowed', label: 'Redusert hastighet', interpretation: 'Brainstem reticular formation' }
    ],
    pathology: 'Cerebellær dysfunksjon (fastigial nucleus, vermis)'
  },
  saccadesVertical: {
    name: 'Sakkader - Vertikal',
    nameEn: 'Vertical Saccades',
    findings: [
      { id: 'normal', label: 'Normal', interpretation: 'Normal vertikal sakkade funksjon' },
      { id: 'overshoot', label: 'Overshoots (>10%)', interpretation: 'Cerebellær dysfunksjon (vermis)' },
      { id: 'catchup', label: 'Catch-up sakkader', interpretation: 'Kompensasjon for hypometri' },
      { id: 'slowed_up', label: 'Redusert hastighet oppover', interpretation: 'Progressive supranuclear palsy' },
      { id: 'slowed_down', label: 'Redusert hastighet nedover', interpretation: 'Brainstem patologi' }
    ],
    pathology: 'Cerebellær dysfunksjon (vermis)'
  },
  smoothPursuit: {
    name: 'Smooth Pursuit',
    nameEn: 'Smooth Pursuit',
    normalGain: { min: 0.9, max: 1.0 },
    threshold: '>5 catch-up sakkader per 30 sekunder = patologisk',
    horizontal: [
      { id: 'normal', label: 'Normal (gain 0.9-1.0)', interpretation: 'Normal pursuit funksjon' },
      { id: 'catchup_right', label: 'Catch-up sakkader høyre', interpretation: 'Ipsilateral parietal/cerebellær' },
      { id: 'catchup_left', label: 'Catch-up sakkader venstre', interpretation: 'Ipsilateral parietal/cerebellær' },
      { id: 'saccadic', label: 'Saccadic pursuit bilateral', interpretation: 'Diffus cerebellær/parietal dysfunksjon' },
      { id: 'asymmetric', label: 'Asymmetrisk pursuit', interpretation: 'Unilateral parietal lesjon' }
    ],
    vertical: [
      { id: 'normal', label: 'Normal', interpretation: 'Normal vertikal pursuit' },
      { id: 'catchup_up', label: 'Catch-up sakkader oppover', interpretation: 'Cerebellum/brainstem' },
      { id: 'catchup_down', label: 'Catch-up sakkader nedover', interpretation: 'Cerebellum/brainstem' },
      { id: 'saccadic_vertical', label: 'Saccadic pursuit vertikal', interpretation: 'Cerebellær dysfunksjon' }
    ],
    pathology: 'Flocculus/paraflocculus, parietal cortex'
  },
  opk: {
    name: 'Optokinetisk nystagmus (OPK)',
    nameEn: 'Optokinetic Nystagmus',
    horizontal: [
      { id: 'normal_horizontal', label: 'Normal OPK horisontal', interpretation: 'Symmetrisk respons' },
      { id: 'asymmetric_right', label: 'Asymmetrisk - redusert høyre', interpretation: 'Høyre parietal lesjon' },
      { id: 'asymmetric_left', label: 'Asymmetrisk - redusert venstre', interpretation: 'Venstre parietal lesjon' },
      { id: 'absent', label: 'Fraværende OPK', interpretation: 'Alvorlig vestibulær/cerebellær dysfunksjon' }
    ],
    vertical: [
      { id: 'normal_vertical', label: 'Normal OPK vertikal', interpretation: 'Normal vertikal respons' },
      { id: 'reduced_up', label: 'Redusert oppover', interpretation: 'Brainstem/mesencephalon' },
      { id: 'reduced_down', label: 'Redusert nedover', interpretation: 'Brainstem patologi' }
    ],
    symptoms: [
      { id: 'no_symptoms', label: 'Ingen symptomer', interpretation: 'Godt tolerert' },
      { id: 'mild_discomfort', label: 'Mildt ubehag', interpretation: 'Normal respons' },
      { id: 'provokes_vertigo', label: 'Provoserer vertigo', interpretation: 'Vestibulær hypersensitivitet' },
      { id: 'provokes_nausea', label: 'Provoserer kvalme', interpretation: 'Visuell-vestibulær konflikt' }
    ],
    pathology: 'Cerebellær/vestibulær'
  }
};

// Neurological examination
export const NEUROLOGICAL_EXAM = {
  muscleStrengthGrading: {
    0: 'Ingen muskelkontraksjon',
    1: 'Synlig muskelkontraksjon uten bevegelseseffekt',
    2: 'Bevegelse kun ved eliminasjon av tyngdekraften',
    3: 'Bevegelse kun mot tyngdekraft',
    4: 'Redusert kraft, men beveger mot motstand',
    5: 'Normal kraft mot motstand'
  },
  reflexGrading: {
    0: '0 - Manglende',
    1: '+ - Nedsatt/svak',
    2: '++ - Normal',
    3: '+++ - Forøket/livlig',
    4: '++++ - Klonus'
  },
  upperMotorNeuronSigns: [
    'Spastisk parese',
    'Forhøyet tonus',
    'Forhøyede dype senereflekser',
    'Positiv Babinski tegn',
    'Ingen atrofi',
    'Ingen fascikulasjoner'
  ],
  lowerMotorNeuronSigns: [
    'Slapp parese',
    'Svekket tonus',
    'Svekkede dype senereflekser',
    'Atrofi',
    'Fascikulasjoner og fibrillasjon'
  ],
  dermatomes: {
    upper: ['C5', 'C6', 'C7', 'C8', 'T1'],
    lower: ['L2', 'L3', 'L4', 'L5', 'S1']
  },
  reflexes: {
    upper: [
      { name: 'Biceps', level: 'C5/6', nerve: 'n. musculocutaneus' },
      { name: 'Brachioradialis', level: 'C5/6', nerve: 'n. radialis' },
      { name: 'Triceps', level: 'C7', nerve: 'n. radialis' },
      { name: 'Fingerbøyerne', level: 'C8', nerve: 'n. medianus & ulnaris' }
    ],
    lower: [
      { name: 'Patella', level: 'L4', nerve: 'n. femoralis' },
      { name: 'Mediale hamstring', level: 'L5', nerve: 'n. tibialis' },
      { name: 'Achilles', level: 'S1', nerve: 'n. tibialis' },
      { name: 'Plantarrefleks', level: '-', nerve: '-' }
    ]
  }
};

// Cranial nerve examination
export const CRANIAL_NERVES = {
  cn2346: {
    name: 'CN 2,3,4,6 - Syn og øyebevegelser',
    tests: [
      { id: 'visual_fields', name: 'Perifert synsfelt (Donders)', cn: '2' },
      { id: 'scotoma', name: 'Synsutfall (Skotom)', cn: '2' },
      { id: 'fundoscopy', name: 'Fundoskopi', cn: '2' },
      { id: 'pupil_response', name: 'Pupille respons', cn: '2,3' },
      { id: 'h_test', name: 'H-test (følgebevegelser)', cn: '3,4,6' },
      { id: 'accommodation', name: 'Nærstillingsrespons', cn: '3' },
      { id: 'saccades', name: 'Test av sakkader', cn: '3,4,6' }
    ]
  },
  cn57: {
    name: 'CN 5,7 - Fjes og kjeve',
    tests: [
      { id: 'trigeminal_sensibility', name: 'Sensibilitet (V1, V2, V3)', cn: '5' },
      { id: 'jaw_opening', name: 'Kjeve åpning (muskelstyrke)', cn: '5' },
      { id: 'jaw_reflex', name: 'Kjeverefleks', cn: '5' },
      { id: 'corneal_reflex', name: 'Cornea refleks', cn: '5,7' },
      { id: 'facial_movements', name: 'Aktive ansiktsbevegelser', cn: '7' },
      { id: 'facial_isometric', name: 'Isometriske ansiktsbevegelser', cn: '7' }
    ]
  },
  cn8: {
    name: 'CN 8 - Hørsel',
    tests: [
      { id: 'hearing_screening', name: 'Kartlegging av hørsel', cn: '8' },
      { id: 'weber', name: "Weber's prøve", cn: '8' },
      { id: 'rinne', name: "Rinne's prøve", cn: '8' }
    ]
  }
};

export default {
  EXAMINATION_REGIONS,
  CLUSTER_TESTS,
  CLUSTER_THRESHOLDS,
  BPPV_PROTOCOLS,
  VNG_EXAMINATION,
  NEUROLOGICAL_EXAM,
  CRANIAL_NERVES,
  SEVERITY
};
