/**
 * Red Flag Auto-Screening Service
 *
 * Automatically screens patient data for clinical red flags that may indicate
 * serious pathology requiring immediate attention or referral.
 *
 * Based on evidence-based guidelines for musculoskeletal red flags in
 * chiropractic and manual therapy practice.
 *
 * Categories:
 * - Cauda Equina Syndrome
 * - Spinal Cord Compression
 * - Vertebral Fracture
 * - Malignancy
 * - Infection
 * - Vascular (AAA, Vertebral Artery)
 * - Inflammatory Arthropathy
 * - Cardiac
 * - Cervical Arterial Dysfunction
 */

// Severity levels
export const SEVERITY = {
  CRITICAL: 'CRITICAL', // Immediate referral/emergency
  HIGH: 'HIGH',         // Urgent evaluation needed
  MEDIUM: 'MEDIUM',     // Should be investigated
  LOW: 'LOW'            // Monitor/note
};

// Red flag categories
export const CATEGORIES = {
  CAUDA_EQUINA: 'cauda_equina',
  CORD_COMPRESSION: 'cord_compression',
  FRACTURE: 'fracture',
  MALIGNANCY: 'malignancy',
  INFECTION: 'infection',
  VASCULAR: 'vascular',
  INFLAMMATORY: 'inflammatory',
  CARDIAC: 'cardiac',
  CERVICAL_ARTERY: 'cervical_artery',
  NEUROLOGICAL: 'neurological',
  SYSTEMIC: 'systemic'
};

// Bilingual category names
const CATEGORY_LABELS = {
  en: {
    [CATEGORIES.CAUDA_EQUINA]: 'Cauda Equina Syndrome',
    [CATEGORIES.CORD_COMPRESSION]: 'Spinal Cord Compression',
    [CATEGORIES.FRACTURE]: 'Vertebral Fracture',
    [CATEGORIES.MALIGNANCY]: 'Malignancy',
    [CATEGORIES.INFECTION]: 'Infection',
    [CATEGORIES.VASCULAR]: 'Vascular',
    [CATEGORIES.INFLAMMATORY]: 'Inflammatory Disease',
    [CATEGORIES.CARDIAC]: 'Cardiac',
    [CATEGORIES.CERVICAL_ARTERY]: 'Cervical Arterial Dysfunction',
    [CATEGORIES.NEUROLOGICAL]: 'Neurological',
    [CATEGORIES.SYSTEMIC]: 'Systemic Disease'
  },
  no: {
    [CATEGORIES.CAUDA_EQUINA]: 'Cauda Equina Syndrom',
    [CATEGORIES.CORD_COMPRESSION]: 'Ryggmargskompresjon',
    [CATEGORIES.FRACTURE]: 'Vertebral Fraktur',
    [CATEGORIES.MALIGNANCY]: 'Malignitet',
    [CATEGORIES.INFECTION]: 'Infeksjon',
    [CATEGORIES.VASCULAR]: 'Vaskulær',
    [CATEGORIES.INFLAMMATORY]: 'Inflammatorisk Sykdom',
    [CATEGORIES.CARDIAC]: 'Kardial',
    [CATEGORIES.CERVICAL_ARTERY]: 'Cervikal Arteriell Dysfunksjon',
    [CATEGORIES.NEUROLOGICAL]: 'Nevrologisk',
    [CATEGORIES.SYSTEMIC]: 'Systemisk Sykdom'
  }
};

// Comprehensive red flag definitions
const RED_FLAG_DEFINITIONS = [
  // === CAUDA EQUINA SYNDROME ===
  {
    id: 'ces_saddle',
    category: CATEGORIES.CAUDA_EQUINA,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['saddle anesthesia', 'saddle numbness', 'perineal numbness', 'groin numbness', 'genital numbness'],
      no: ['setelanestesi', 'nummenhet i skrittet', 'perineal nummenhet', 'nummenhet i lysken', 'genital nummenhet']
    },
    description: {
      en: 'Saddle anesthesia - loss of sensation in perineal area',
      no: 'Setelanestesi - tap av følelse i perinealområdet'
    },
    action: {
      en: 'EMERGENCY: Immediate referral to emergency department for MRI and surgical evaluation',
      no: 'AKUTT: Umiddelbar henvisning til akuttmottak for MR og kirurgisk vurdering'
    }
  },
  {
    id: 'ces_bladder',
    category: CATEGORIES.CAUDA_EQUINA,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['urinary retention', 'bladder dysfunction', 'incontinence', 'cannot urinate', 'loss of bladder', 'urinary incontinence'],
      no: ['urinretensjon', 'blæredysfunksjon', 'inkontinens', 'kan ikke urinere', 'tap av blærekontroll', 'urininkontinens']
    },
    description: {
      en: 'Bladder dysfunction - retention or incontinence',
      no: 'Blæredysfunksjon - retensjon eller inkontinens'
    },
    action: {
      en: 'EMERGENCY: Immediate referral - Cauda Equina Syndrome must be ruled out within 24-48 hours',
      no: 'AKUTT: Umiddelbar henvisning - Cauda Equina Syndrom må utelukkes innen 24-48 timer'
    }
  },
  {
    id: 'ces_bowel',
    category: CATEGORIES.CAUDA_EQUINA,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['fecal incontinence', 'bowel incontinence', 'loss of bowel', 'bowel dysfunction', 'anal sphincter'],
      no: ['fekal inkontinens', 'avføringsinkontinens', 'tap av tarmkontroll', 'tarmdysfunksjon', 'anal sfinkter']
    },
    description: {
      en: 'Bowel dysfunction - fecal incontinence',
      no: 'Tarmdysfunksjon - fekal inkontinens'
    },
    action: {
      en: 'EMERGENCY: Immediate referral for Cauda Equina evaluation',
      no: 'AKUTT: Umiddelbar henvisning for Cauda Equina vurdering'
    }
  },
  {
    id: 'ces_bilateral',
    category: CATEGORIES.CAUDA_EQUINA,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['bilateral leg weakness', 'bilateral leg numbness', 'both legs weak', 'both legs numb', 'progressive bilateral'],
      no: ['bilateral beinsvakhet', 'bilateral beinnummenhet', 'svakhet i begge bein', 'nummenhet i begge bein', 'progressiv bilateral']
    },
    description: {
      en: 'Bilateral leg symptoms - weakness or numbness in both legs',
      no: 'Bilaterale beinsymptomer - svakhet eller nummenhet i begge bein'
    },
    action: {
      en: 'URGENT: Evaluate for Cauda Equina or cord compression',
      no: 'HASTER: Vurder for Cauda Equina eller ryggmargskompresjon'
    }
  },

  // === SPINAL CORD COMPRESSION ===
  {
    id: 'cord_gait',
    category: CATEGORIES.CORD_COMPRESSION,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['gait disturbance', 'ataxic gait', 'spastic gait', 'unsteady walking', 'difficulty walking', 'balance problems'],
      no: ['gangforstyrrelse', 'ataktisk gange', 'spastisk gange', 'ustø gange', 'vanskeligheter med å gå', 'balanseproblemer']
    },
    description: {
      en: 'Gait disturbance suggesting upper motor neuron involvement',
      no: 'Gangforstyrrelse som tyder på øvre motornevron-affeksjon'
    },
    action: {
      en: 'URGENT: Neurological examination and consider MRI spine',
      no: 'HASTER: Nevrologisk undersøkelse og vurder MR ryggrad'
    }
  },
  {
    id: 'cord_clonus',
    category: CATEGORIES.CORD_COMPRESSION,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['clonus', 'hyperreflexia', 'babinski positive', 'upgoing toes', 'hoffman positive', 'spasticity'],
      no: ['klonus', 'hyperrefleksi', 'babinski positiv', 'oppadgående tær', 'hoffman positiv', 'spastisitet']
    },
    description: {
      en: 'Upper motor neuron signs - clonus, hyperreflexia, positive Babinski',
      no: 'Øvre motornevron-tegn - klonus, hyperrefleksi, positiv Babinski'
    },
    action: {
      en: 'URGENT: Refer for neurological evaluation and imaging',
      no: 'HASTER: Henvis for nevrologisk vurdering og bildediagnostikk'
    }
  },
  {
    id: 'cord_lhermitte',
    category: CATEGORIES.CORD_COMPRESSION,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['lhermitte', "lhermitte's sign", 'electric shock spine', 'shock down spine', 'electric sensation flexion'],
      no: ['lhermitte', 'lhermittes tegn', 'elektrisk støt ryggrad', 'støt nedover ryggen', 'elektrisk følelse fleksjon']
    },
    description: {
      en: "Lhermitte's sign - electric shock sensation with neck flexion",
      no: 'Lhermittes tegn - elektrisk støtfølelse ved nakkefleksjon'
    },
    action: {
      en: 'Refer for cervical MRI to evaluate cord compression or demyelination',
      no: 'Henvis for cervikal MR for å evaluere ryggmargskompresjon eller demyelinisering'
    }
  },

  // === VERTEBRAL FRACTURE ===
  {
    id: 'fracture_trauma',
    category: CATEGORIES.FRACTURE,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['major trauma', 'car accident', 'fall from height', 'significant fall', 'motor vehicle accident', 'mva'],
      no: ['alvorlig traume', 'bilulykke', 'fall fra høyde', 'betydelig fall', 'trafikkulykke']
    },
    description: {
      en: 'History of significant trauma',
      no: 'Anamnese med betydelig traume'
    },
    action: {
      en: 'Imaging required before any manual therapy - X-ray or CT spine',
      no: 'Bildediagnostikk påkrevd før manuell behandling - Røntgen eller CT ryggrad'
    }
  },
  {
    id: 'fracture_osteoporosis',
    category: CATEGORIES.FRACTURE,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['osteoporosis', 'osteopenia', 'steroid use', 'corticosteroid', 'minor trauma severe pain', 'compression fracture'],
      no: ['osteoporose', 'osteopeni', 'steroidbruk', 'kortikosteroid', 'mindre traume sterk smerte', 'kompresjonsbrudd']
    },
    description: {
      en: 'Risk factors for pathological fracture - osteoporosis, steroid use',
      no: 'Risikofaktorer for patologisk fraktur - osteoporose, steroidbruk'
    },
    action: {
      en: 'Consider imaging, modify treatment intensity, bone density evaluation',
      no: 'Vurder bildediagnostikk, modifiser behandlingsintensitet, bentetthetsvurdering'
    }
  },
  {
    id: 'fracture_age',
    category: CATEGORIES.FRACTURE,
    severity: SEVERITY.MEDIUM,
    keywords: {
      en: ['elderly', 'over 70', 'over 75', 'age 70', 'age 75', 'post-menopausal'],
      no: ['eldre', 'over 70', 'over 75', 'alder 70', 'alder 75', 'postmenopausal']
    },
    description: {
      en: 'Advanced age increases fracture risk',
      no: 'Høy alder øker frakturrisiko'
    },
    action: {
      en: 'Consider bone health, modify treatment approach',
      no: 'Vurder beinhelse, tilpass behandlingstilnærming'
    },
    ageThreshold: 70
  },

  // === MALIGNANCY ===
  {
    id: 'malig_history',
    category: CATEGORIES.MALIGNANCY,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['cancer history', 'previous cancer', 'history of malignancy', 'oncology', 'chemotherapy', 'radiation therapy', 'tumor', 'metastasis'],
      no: ['krefthistorie', 'tidligere kreft', 'malignitet i anamnesen', 'onkologi', 'kjemoterapi', 'strålebehandling', 'tumor', 'svulst', 'metastase']
    },
    description: {
      en: 'History of cancer - potential metastatic disease',
      no: 'Krefthistorie - mulig metastatisk sykdom'
    },
    action: {
      en: 'Consider imaging to rule out metastases before manual therapy',
      no: 'Vurder bildediagnostikk for å utelukke metastaser før manuell behandling'
    }
  },
  {
    id: 'malig_weight',
    category: CATEGORIES.MALIGNANCY,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['unexplained weight loss', 'unintentional weight loss', 'lost weight', 'weight loss', 'losing weight unexplained'],
      no: ['uforklarlig vekttap', 'utilsiktet vekttap', 'tapt vekt', 'vekttap', 'mister vekt uforklarlig']
    },
    description: {
      en: 'Unexplained weight loss - potential malignancy',
      no: 'Uforklarlig vekttap - mulig malignitet'
    },
    action: {
      en: 'Medical evaluation to rule out systemic disease',
      no: 'Medisinsk utredning for å utelukke systemsykdom'
    }
  },
  {
    id: 'malig_night',
    category: CATEGORIES.MALIGNANCY,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['night pain', 'pain at night', 'wakes from sleep', 'constant pain', 'unrelenting pain', 'pain worse at night'],
      no: ['nattesmerte', 'smerte om natten', 'våkner av smerte', 'konstant smerte', 'uopphørlig smerte', 'smerte verre om natten']
    },
    description: {
      en: 'Night pain that wakes patient - concerning for malignancy',
      no: 'Nattesmerte som vekker pasienten - bekymringsfullt for malignitet'
    },
    action: {
      en: 'Investigate with imaging and blood work',
      no: 'Utred med bildediagnostikk og blodprøver'
    }
  },
  {
    id: 'malig_age_onset',
    category: CATEGORIES.MALIGNANCY,
    severity: SEVERITY.MEDIUM,
    keywords: {
      en: ['first episode over 50', 'new onset over 50', 'first back pain 50'],
      no: ['første episode over 50', 'nyoppstått over 50', 'første ryggsmerte 50']
    },
    description: {
      en: 'First episode of back pain after age 50',
      no: 'Første episode av ryggsmerte etter 50 år'
    },
    action: {
      en: 'Consider additional screening for serious pathology',
      no: 'Vurder ytterligere screening for alvorlig patologi'
    },
    ageThreshold: 50
  },

  // === INFECTION ===
  {
    id: 'infection_fever',
    category: CATEGORIES.INFECTION,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['fever', 'febrile', 'chills', 'night sweats', 'elevated temperature', 'high temperature'],
      no: ['feber', 'febril', 'frysninger', 'nattesvette', 'forhøyet temperatur', 'høy temperatur']
    },
    description: {
      en: 'Fever with spinal pain - possible spinal infection',
      no: 'Feber med ryggsmerter - mulig spinal infeksjon'
    },
    action: {
      en: 'URGENT: Blood tests (CRP, ESR, WBC) and consider MRI',
      no: 'HASTER: Blodprøver (CRP, SR, hvite) og vurder MR'
    }
  },
  {
    id: 'infection_iv_drug',
    category: CATEGORIES.INFECTION,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['iv drug use', 'intravenous drug', 'injection drug', 'drug abuse', 'heroin', 'needle use'],
      no: ['iv narkotikabruk', 'intravenøs', 'injeksjonsbruk', 'narkotikamisbruk', 'heroin', 'nålebruk']
    },
    description: {
      en: 'IV drug use - high risk for spinal infection',
      no: 'IV narkotikabruk - høy risiko for spinal infeksjon'
    },
    action: {
      en: 'Screen for infection, imaging recommended',
      no: 'Screen for infeksjon, bildediagnostikk anbefalt'
    }
  },
  {
    id: 'infection_immuno',
    category: CATEGORIES.INFECTION,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['immunocompromised', 'immunosuppressed', 'hiv', 'aids', 'transplant', 'chemotherapy', 'diabetes'],
      no: ['immunsvekket', 'immunsupprimert', 'hiv', 'aids', 'transplantasjon', 'kjemoterapi', 'diabetes']
    },
    description: {
      en: 'Immunocompromised state increases infection risk',
      no: 'Immunsvekket tilstand øker infeksjonsrisiko'
    },
    action: {
      en: 'Lower threshold for investigation of infection',
      no: 'Lavere terskel for utredning av infeksjon'
    }
  },
  {
    id: 'infection_recent',
    category: CATEGORIES.INFECTION,
    severity: SEVERITY.MEDIUM,
    keywords: {
      en: ['recent infection', 'recent surgery', 'dental procedure', 'urinary tract infection', 'skin infection'],
      no: ['nylig infeksjon', 'nylig kirurgi', 'tannprosedyre', 'urinveisinfeksjon', 'hudinfeksjon']
    },
    description: {
      en: 'Recent infection or procedure - source for hematogenous spread',
      no: 'Nylig infeksjon eller prosedyre - kilde for hematogen spredning'
    },
    action: {
      en: 'Monitor for signs of spinal infection',
      no: 'Overvåk for tegn på spinal infeksjon'
    }
  },

  // === VASCULAR ===
  {
    id: 'vascular_aaa',
    category: CATEGORIES.VASCULAR,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['abdominal aortic', 'pulsatile mass', 'aortic aneurysm', 'aaa', 'throbbing abdominal'],
      no: ['abdominalt aortaaneurisme', 'pulserende masse', 'aortaaneurisme', 'aaa', 'bankende abdominal']
    },
    description: {
      en: 'Suspected abdominal aortic aneurysm',
      no: 'Mistenkt abdominalt aortaaneurisme'
    },
    action: {
      en: 'EMERGENCY: Immediate vascular surgery referral if symptomatic',
      no: 'AKUTT: Umiddelbar karkirurgisk henvisning hvis symptomatisk'
    }
  },
  {
    id: 'vascular_dvt',
    category: CATEGORIES.VASCULAR,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['leg swelling unilateral', 'calf pain swelling', 'dvt', 'deep vein', 'red hot swollen leg'],
      no: ['unilateral legghevelse', 'leggsmerte hevelse', 'dvt', 'dyp venetrombose', 'rød varm hoven legg']
    },
    description: {
      en: 'Signs of deep vein thrombosis',
      no: 'Tegn på dyp venetrombose'
    },
    action: {
      en: 'URGENT: D-dimer and ultrasound, consider anticoagulation',
      no: 'HASTER: D-dimer og ultralyd, vurder antikoagulasjon'
    }
  },

  // === CERVICAL ARTERIAL DYSFUNCTION ===
  {
    id: 'cad_5d',
    category: CATEGORIES.CERVICAL_ARTERY,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['dizziness', 'diplopia', 'dysarthria', 'dysphagia', 'drop attack', 'ataxia', 'nausea', 'nystagmus', 'numbness face'],
      no: ['svimmelhet', 'diplopi', 'dysartri', 'dysfagi', 'fall-anfall', 'ataksi', 'kvalme', 'nystagmus', 'nummenhet ansikt']
    },
    description: {
      en: '5Ds and 3Ns of cervical arterial dysfunction',
      no: '5D og 3N ved cervikal arteriell dysfunksjon'
    },
    action: {
      en: 'DO NOT perform cervical manipulation. Refer for vascular evaluation',
      no: 'IKKE utfør cervikal manipulasjon. Henvis for vaskulær utredning'
    }
  },
  {
    id: 'cad_trauma',
    category: CATEGORIES.CERVICAL_ARTERY,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['neck trauma', 'whiplash', 'cervical trauma', 'neck injury recent', 'head injury'],
      no: ['nakketraume', 'whiplash', 'cervikalt traume', 'nylig nakkeskade', 'hodeskade']
    },
    description: {
      en: 'Recent cervical trauma - risk of arterial injury',
      no: 'Nylig cervikalt traume - risiko for arterieskade'
    },
    action: {
      en: 'Screen for cervical arterial dysfunction before manipulation',
      no: 'Screen for cervikal arteriell dysfunksjon før manipulasjon'
    }
  },
  {
    id: 'cad_headache',
    category: CATEGORIES.CERVICAL_ARTERY,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['thunderclap headache', 'worst headache', 'sudden severe headache', 'new headache type'],
      no: ['tordenslagshodepine', 'verste hodepine', 'plutselig alvorlig hodepine', 'ny hodepinetype']
    },
    description: {
      en: 'Thunderclap or worst-ever headache',
      no: 'Tordenskrall eller verste hodepine noensinne'
    },
    action: {
      en: 'EMERGENCY: Rule out subarachnoid hemorrhage or dissection',
      no: 'AKUTT: Utelukk subaraknoidalblødning eller disseksjon'
    }
  },

  // === INFLAMMATORY ===
  {
    id: 'inflam_morning',
    category: CATEGORIES.INFLAMMATORY,
    severity: SEVERITY.MEDIUM,
    keywords: {
      en: ['morning stiffness', 'stiffness over 1 hour', 'prolonged stiffness', 'better with movement'],
      no: ['morgenstivhet', 'stivhet over 1 time', 'langvarig stivhet', 'bedre ved bevegelse']
    },
    description: {
      en: 'Prolonged morning stiffness >1 hour - inflammatory pattern',
      no: 'Langvarig morgenstivhet >1 time - inflammatorisk mønster'
    },
    action: {
      en: 'Consider inflammatory markers and rheumatology referral',
      no: 'Vurder inflammasjonsmarkører og revmatologisk henvisning'
    }
  },
  {
    id: 'inflam_young',
    category: CATEGORIES.INFLAMMATORY,
    severity: SEVERITY.MEDIUM,
    keywords: {
      en: ['young onset', 'under 40', 'insidious onset', 'gradual onset', 'alternating buttock pain'],
      no: ['ung debut', 'under 40', 'snikende start', 'gradvis start', 'alternerende setemerter']
    },
    description: {
      en: 'Young onset (<40) with insidious symptoms - possible spondyloarthropathy',
      no: 'Ung debut (<40) med snikende symptomer - mulig spondyloartropati'
    },
    action: {
      en: 'Screen for inflammatory back pain criteria, HLA-B27',
      no: 'Screen for inflammatorisk ryggsmerte-kriterier, HLA-B27'
    },
    ageThreshold: 40,
    ageDirection: 'under'
  },

  // === CARDIAC ===
  {
    id: 'cardiac_chest',
    category: CATEGORIES.CARDIAC,
    severity: SEVERITY.CRITICAL,
    keywords: {
      en: ['chest pain', 'crushing pain', 'pressure chest', 'radiating arm', 'jaw pain', 'shortness of breath', 'diaphoresis'],
      no: ['brystsmerte', 'trykkende smerte', 'trykk i brystet', 'utstråling til arm', 'kjevesmerte', 'tungpust', 'diaforese', 'svette']
    },
    description: {
      en: 'Cardiac symptoms - possible acute coronary syndrome',
      no: 'Kardiale symptomer - mulig akutt koronarsyndrom'
    },
    action: {
      en: 'EMERGENCY: Immediate cardiac evaluation, call emergency services',
      no: 'AKUTT: Umiddelbar kardial vurdering, ring 113'
    }
  },

  // === NEUROLOGICAL ===
  {
    id: 'neuro_progressive',
    category: CATEGORIES.NEUROLOGICAL,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['progressive weakness', 'progressive numbness', 'getting worse', 'spreading numbness', 'rapid deterioration'],
      no: ['progressiv svakhet', 'progressiv nummenhet', 'blir verre', 'sprer seg nummenhet', 'rask forverring']
    },
    description: {
      en: 'Progressive neurological deficit',
      no: 'Progressivt nevrologisk utfall'
    },
    action: {
      en: 'URGENT: Neurological evaluation and imaging',
      no: 'HASTER: Nevrologisk vurdering og bildediagnostikk'
    }
  },
  {
    id: 'neuro_multifocal',
    category: CATEGORIES.NEUROLOGICAL,
    severity: SEVERITY.HIGH,
    keywords: {
      en: ['multiple levels', 'multifocal', 'multiple nerve roots', 'widespread weakness'],
      no: ['flere nivåer', 'multifokal', 'flere nerverøtter', 'utbredt svakhet']
    },
    description: {
      en: 'Multifocal neurological signs - not single root pattern',
      no: 'Multifokale nevrologiske tegn - ikke enkelt rotmønster'
    },
    action: {
      en: 'Consider central pathology, systemic disease',
      no: 'Vurder sentral patologi, systemsykdom'
    }
  }
];

/**
 * Screen text for red flag keywords
 * @param {string} text - Text to screen
 * @param {string} lang - Language code ('en' or 'no')
 * @returns {Array} Array of detected red flags
 */
export function screenText(text, lang = 'en') {
  if (!text || typeof text !== 'string') return [];

  const normalizedText = text.toLowerCase();
  const detectedFlags = [];

  RED_FLAG_DEFINITIONS.forEach(flag => {
    const keywords = flag.keywords[lang] || flag.keywords.en;
    const found = keywords.some(keyword =>
      normalizedText.includes(keyword.toLowerCase())
    );

    if (found) {
      detectedFlags.push({
        id: flag.id,
        category: flag.category,
        categoryLabel: CATEGORY_LABELS[lang]?.[flag.category] || flag.category,
        severity: flag.severity,
        description: flag.description[lang] || flag.description.en,
        action: flag.action[lang] || flag.action.en,
        matchedKeywords: keywords.filter(k => normalizedText.includes(k.toLowerCase()))
      });
    }
  });

  return detectedFlags;
}

/**
 * Screen patient demographics for age-related red flags
 * @param {number} age - Patient age
 * @param {string} lang - Language code
 * @returns {Array} Age-related red flags
 */
export function screenAge(age, lang = 'en') {
  if (!age || typeof age !== 'number') return [];

  const detectedFlags = [];

  RED_FLAG_DEFINITIONS.forEach(flag => {
    if (flag.ageThreshold) {
      const direction = flag.ageDirection || 'over';
      const matches = direction === 'over'
        ? age >= flag.ageThreshold
        : age < flag.ageThreshold;

      if (matches) {
        detectedFlags.push({
          id: flag.id,
          category: flag.category,
          categoryLabel: CATEGORY_LABELS[lang]?.[flag.category] || flag.category,
          severity: flag.severity,
          description: flag.description[lang] || flag.description.en,
          action: flag.action[lang] || flag.action.en,
          ageRelated: true
        });
      }
    }
  });

  return detectedFlags;
}

/**
 * Screen examination findings for red flags
 * @param {Object} findings - Examination findings object
 * @param {string} lang - Language code
 * @returns {Array} Detected red flags
 */
export function screenExaminationFindings(findings, lang = 'en') {
  const detectedFlags = [];

  // Check neurological findings
  if (findings.reflexes) {
    // Check for hyperreflexia
    const hyperreflexia = Object.values(findings.reflexes).some(
      r => r === '3+' || r === '4+' || r === 'hyperactive'
    );
    if (hyperreflexia) {
      const flag = RED_FLAG_DEFINITIONS.find(f => f.id === 'cord_clonus');
      if (flag) {
        detectedFlags.push({
          id: flag.id,
          category: flag.category,
          categoryLabel: CATEGORY_LABELS[lang]?.[flag.category],
          severity: flag.severity,
          description: flag.description[lang] || flag.description.en,
          action: flag.action[lang] || flag.action.en,
          source: 'examination'
        });
      }
    }
  }

  // Check for positive Babinski
  if (findings.babinski_left === 'positive' || findings.babinski_right === 'positive') {
    const flag = RED_FLAG_DEFINITIONS.find(f => f.id === 'cord_clonus');
    if (flag && !detectedFlags.find(f => f.id === 'cord_clonus')) {
      detectedFlags.push({
        id: flag.id,
        category: flag.category,
        categoryLabel: CATEGORY_LABELS[lang]?.[flag.category],
        severity: flag.severity,
        description: flag.description[lang] || flag.description.en,
        action: flag.action[lang] || flag.action.en,
        source: 'examination'
      });
    }
  }

  // Check for clonus
  if (findings.clonus_left || findings.clonus_right ||
      findings.clonus === 'positive' || findings.clonus === true) {
    const flag = RED_FLAG_DEFINITIONS.find(f => f.id === 'cord_clonus');
    if (flag && !detectedFlags.find(f => f.id === 'cord_clonus')) {
      detectedFlags.push({
        id: flag.id,
        category: flag.category,
        categoryLabel: CATEGORY_LABELS[lang]?.[flag.category],
        severity: flag.severity,
        description: flag.description[lang] || flag.description.en,
        action: flag.action[lang] || flag.action.en,
        source: 'examination'
      });
    }
  }

  // Check sensory findings for saddle anesthesia pattern
  if (findings.sensory) {
    const saddleAreas = ['perineal', 'saddle', 's2', 's3', 's4', 's5'];
    const hasSaddleLoss = saddleAreas.some(area =>
      findings.sensory[area] === 'absent' || findings.sensory[area] === 'decreased'
    );
    if (hasSaddleLoss) {
      const flag = RED_FLAG_DEFINITIONS.find(f => f.id === 'ces_saddle');
      if (flag) {
        detectedFlags.push({
          id: flag.id,
          category: flag.category,
          categoryLabel: CATEGORY_LABELS[lang]?.[flag.category],
          severity: flag.severity,
          description: flag.description[lang] || flag.description.en,
          action: flag.action[lang] || flag.action.en,
          source: 'examination'
        });
      }
    }
  }

  // Check muscle testing for bilateral weakness
  if (findings.muscleStrength) {
    const leftWeakness = Object.entries(findings.muscleStrength)
      .filter(([key]) => key.includes('left') || key.includes('L'))
      .some(([, value]) => parseInt(value) <= 3);
    const rightWeakness = Object.entries(findings.muscleStrength)
      .filter(([key]) => key.includes('right') || key.includes('R'))
      .some(([, value]) => parseInt(value) <= 3);

    if (leftWeakness && rightWeakness) {
      const flag = RED_FLAG_DEFINITIONS.find(f => f.id === 'ces_bilateral');
      if (flag) {
        detectedFlags.push({
          id: flag.id,
          category: flag.category,
          categoryLabel: CATEGORY_LABELS[lang]?.[flag.category],
          severity: flag.severity,
          description: flag.description[lang] || flag.description.en,
          action: flag.action[lang] || flag.action.en,
          source: 'examination'
        });
      }
    }
  }

  return detectedFlags;
}

/**
 * Screen vital signs for red flags
 * @param {Object} vitals - Vital signs object
 * @param {string} lang - Language code
 * @returns {Array} Detected red flags
 */
export function screenVitalSigns(vitals, lang = 'en') {
  const detectedFlags = [];

  // Fever
  if (vitals.temperature && parseFloat(vitals.temperature) >= 38.0) {
    const flag = RED_FLAG_DEFINITIONS.find(f => f.id === 'infection_fever');
    if (flag) {
      detectedFlags.push({
        id: flag.id,
        category: flag.category,
        categoryLabel: CATEGORY_LABELS[lang]?.[flag.category],
        severity: flag.severity,
        description: flag.description[lang] || flag.description.en,
        action: flag.action[lang] || flag.action.en,
        source: 'vitals',
        value: vitals.temperature
      });
    }
  }

  return detectedFlags;
}

/**
 * Comprehensive patient screening
 * @param {Object} patientData - All patient data
 * @param {string} lang - Language code
 * @returns {Object} Screening results
 */
export function screenPatient(patientData, lang = 'en') {
  const allFlags = [];

  // Screen subjective data (chief complaint, history)
  if (patientData.subjective) {
    const textToScreen = [
      patientData.subjective.chief_complaint,
      patientData.subjective.history,
      patientData.subjective.present_illness
    ].filter(Boolean).join(' ');

    allFlags.push(...screenText(textToScreen, lang));
  }

  // Screen any free text fields
  const textFields = ['notes', 'comments', 'objective', 'assessment', 'plan'];
  textFields.forEach(field => {
    if (patientData[field] && typeof patientData[field] === 'string') {
      allFlags.push(...screenText(patientData[field], lang));
    }
  });

  // Screen age
  if (patientData.age) {
    allFlags.push(...screenAge(patientData.age, lang));
  }

  // Screen examination findings
  if (patientData.examination) {
    allFlags.push(...screenExaminationFindings(patientData.examination, lang));
  }

  // Screen vitals
  if (patientData.vitals) {
    allFlags.push(...screenVitalSigns(patientData.vitals, lang));
  }

  // Remove duplicates
  const uniqueFlags = allFlags.reduce((acc, flag) => {
    if (!acc.find(f => f.id === flag.id)) {
      acc.push(flag);
    }
    return acc;
  }, []);

  // Sort by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  uniqueFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Calculate summary
  const summary = {
    total: uniqueFlags.length,
    critical: uniqueFlags.filter(f => f.severity === SEVERITY.CRITICAL).length,
    high: uniqueFlags.filter(f => f.severity === SEVERITY.HIGH).length,
    medium: uniqueFlags.filter(f => f.severity === SEVERITY.MEDIUM).length,
    low: uniqueFlags.filter(f => f.severity === SEVERITY.LOW).length,
    requiresImmediateAction: uniqueFlags.some(f => f.severity === SEVERITY.CRITICAL),
    categories: [...new Set(uniqueFlags.map(f => f.category))]
  };

  return {
    flags: uniqueFlags,
    summary,
    screenedAt: new Date().toISOString()
  };
}

/**
 * Get all red flag definitions (for reference/display)
 */
export function getAllRedFlagDefinitions(lang = 'en') {
  return RED_FLAG_DEFINITIONS.map(flag => ({
    id: flag.id,
    category: flag.category,
    categoryLabel: CATEGORY_LABELS[lang]?.[flag.category] || flag.category,
    severity: flag.severity,
    description: flag.description[lang] || flag.description.en,
    action: flag.action[lang] || flag.action.en,
    keywords: flag.keywords[lang] || flag.keywords.en
  }));
}

/**
 * Get category labels
 */
export function getCategoryLabels(lang = 'en') {
  return CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;
}

export default {
  screenText,
  screenAge,
  screenExaminationFindings,
  screenVitalSigns,
  screenPatient,
  getAllRedFlagDefinitions,
  getCategoryLabels,
  SEVERITY,
  CATEGORIES
};
