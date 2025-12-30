/**
 * ICPC-2 Codes (International Classification of Primary Care, 2nd edition)
 * Norwegian chiropractic-relevant codes
 *
 * Source: WHO-FIC / Norwegian Directorate of Health
 * Category: Musculoskeletal (L codes) + related codes
 */

export const ICPC2_CODES = {
  // ============================================================================
  // L - MUSCULOSKELETAL (Primary for chiropractic)
  // ============================================================================

  // Symptoms and complaints
  'L01': 'Neck symptom/complaint',
  'L02': 'Back symptom/complaint',
  'L03': 'Low back symptom/complaint',
  'L04': 'Chest symptom/complaint',
  'L05': 'Flank/axilla symptom/complaint',
  'L07': 'Jaw symptom/complaint',
  'L08': 'Shoulder symptom/complaint',
  'L09': 'Arm symptom/complaint',
  'L10': 'Elbow symptom/complaint',
  'L11': 'Wrist symptom/complaint',
  'L12': 'Hand/finger symptom/complaint',
  'L13': 'Hip symptom/complaint',
  'L14': 'Leg/thigh symptom/complaint',
  'L15': 'Knee symptom/complaint',
  'L16': 'Ankle symptom/complaint',
  'L17': 'Foot/toe symptom/complaint',
  'L18': 'Muscle pain',
  'L19': 'Muscle symptom/complaint NOS',
  'L20': 'Joint symptom/complaint NOS',
  'L26': 'Fear of cancer musculoskeletal',
  'L27': 'Fear of musculoskeletal disease',
  'L28': 'Limited function/disability (L)',
  'L29': 'Musculoskeletal symptom/complaint other',

  // Diagnostic, screening, prevention
  'L30': 'Signs/symptoms musculoskeletal system',
  'L31': 'Investigation results musculoskeletal',
  'L40': 'X-ray spine',
  'L41': 'X-ray musculoskeletal NOS',

  // Injuries
  'L70': 'Infection musculoskeletal system',
  'L71': 'Malignancy musculoskeletal',
  'L72': 'Fracture radius/ulna',
  'L73': 'Fracture tibia/fibula',
  'L74': 'Fracture hand/foot bone',
  'L75': 'Fracture femur',
  'L76': 'Fracture other',
  'L77': 'Sprain/strain ankle',
  'L78': 'Sprain/strain knee',
  'L79': 'Sprain/strain joint NOS',
  'L80': 'Dislocation/subluxation',

  // Diseases and syndromes (most relevant for chiropractic)
  'L81': 'Injury musculoskeletal NOS',
  'L82': 'Congenital anomaly musculoskeletal',
  'L83': 'Neck syndrome',
  'L84': 'Back syndrome without radiating pain',
  'L85': 'Acquired deformity of spine',
  'L86': 'Back syndrome with radiating pain',
  'L87': 'Bursitis/tendinitis/synovitis NOS',
  'L88': 'Rheumatoid/seropositive arthritis',
  'L89': 'Osteoarthrosis hip',
  'L90': 'Osteoarthrosis knee',
  'L91': 'Osteoarthrosis other',
  'L92': 'Shoulder syndrome',
  'L93': 'Tennis elbow',
  'L94': 'Osteochondrosis',
  'L95': 'Osteoporosis',
  'L96': 'Acute internal damage knee',
  'L97': 'Chronic internal damage knee',
  'L98': 'Acquired musculoskeletal deformity',
  'L99': 'Musculoskeletal disease other',

  // ============================================================================
  // N - NEUROLOGICAL (Relevant for nerve-related issues)
  // ============================================================================
  'N01': 'Headache',
  'N03': 'Face pain',
  'N04': 'Restless legs',
  'N05': 'Tingling fingers/feet/toes',
  'N06': 'Sensation disturbance other',
  'N17': 'Vertigo/dizziness',
  'N70': 'Poliomyelitis',
  'N71': 'Meningitis/encephalitis',
  'N72': 'Tetanus',
  'N73': 'Neurological infection other',
  'N74': 'Malignancy nervous system',
  'N75': 'Benign neoplasm nervous system',
  'N79': 'Concussion',
  'N80': 'Head injury other',
  'N81': 'Injury nervous system other',
  'N86': 'Multiple sclerosis',
  'N87': 'Parkinsonism',
  'N88': 'Epilepsy',
  'N89': 'Migraine',
  'N90': 'Cluster headache',
  'N91': 'Facial paralysis/Bell palsy',
  'N92': 'Trigeminal neuralgia',
  'N93': 'Carpal tunnel syndrome',
  'N94': 'Peripheral nerve disease other',
  'N95': 'Tension headache',
  'N99': 'Neurological disease other',

  // ============================================================================
  // A - GENERAL AND UNSPECIFIED
  // ============================================================================
  'A01': 'Pain general/multiple sites',
  'A02': 'Chills',
  'A03': 'Fever',
  'A04': 'Weakness/tiredness general',
  'A05': 'Feeling ill',
  'A29': 'General symptom/complaint other',

  // ============================================================================
  // R - RESPIRATORY (Sometimes related)
  // ============================================================================
  'R01': 'Pain respiratory system',
  'R02': 'Shortness of breath/dyspnea',
  'R29': 'Respiratory symptom/complaint other',

  // ============================================================================
  // NORWEGIAN-SPECIFIC ADDITIONS (if applicable)
  // ============================================================================
  // Add Norwegian-specific codes here if needed
};

/**
 * Get ICPC-2 description by code
 * @param {string} code - ICPC-2 code (e.g., 'L03')
 * @returns {string} - Description in English (or Norwegian if available)
 */
export const getICPC2Description = (code) => {
  if (!code) return null;

  const upperCode = code.toUpperCase().trim();
  return ICPC2_CODES[upperCode] || null;
};

/**
 * Search ICPC-2 codes by description
 * @param {string} query - Search term
 * @param {number} limit - Maximum results
 * @returns {Array} - Array of {code, description} objects
 */
export const searchICPC2Codes = (query, limit = 10) => {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const results = [];

  for (const [code, description] of Object.entries(ICPC2_CODES)) {
    if (description.toLowerCase().includes(lowerQuery)) {
      results.push({ code, description });

      if (results.length >= limit) break;
    }
  }

  return results;
};

/**
 * Get all codes for a specific chapter (e.g., 'L' for musculoskeletal)
 * @param {string} chapter - Chapter letter (A, L, N, R, etc.)
 * @returns {Object} - Object with code: description pairs
 */
export const getICPC2ByChapter = (chapter) => {
  if (!chapter) return {};

  const upperChapter = chapter.toUpperCase();
  const filtered = {};

  for (const [code, description] of Object.entries(ICPC2_CODES)) {
    if (code.startsWith(upperChapter)) {
      filtered[code] = description;
    }
  }

  return filtered;
};

/**
 * Validate if code exists in ICPC-2
 * @param {string} code - ICPC-2 code
 * @returns {boolean} - True if code exists
 */
export const isValidICPC2Code = (code) => {
  if (!code) return false;
  const upperCode = code.toUpperCase().trim();
  return ICPC2_CODES.hasOwnProperty(upperCode);
};

/**
 * Get chiropractic-relevant codes (L codes + common N codes)
 * @returns {Object} - Object with code: description pairs
 */
export const getChiropracticRelevantCodes = () => {
  const lCodes = getICPC2ByChapter('L'); // Musculoskeletal
  const nCodes = {
    'N01': ICPC2_CODES['N01'], // Headache
    'N05': ICPC2_CODES['N05'], // Tingling
    'N17': ICPC2_CODES['N17'], // Vertigo
    'N89': ICPC2_CODES['N89'], // Migraine
    'N91': ICPC2_CODES['N91'], // Facial paralysis
    'N92': ICPC2_CODES['N92'], // Trigeminal neuralgia
    'N93': ICPC2_CODES['N93'], // Carpal tunnel
    'N95': ICPC2_CODES['N95']  // Tension headache
  };

  return { ...lCodes, ...nCodes };
};

export default {
  ICPC2_CODES,
  getICPC2Description,
  searchICPC2Codes,
  getICPC2ByChapter,
  isValidICPC2Code,
  getChiropracticRelevantCodes
};
