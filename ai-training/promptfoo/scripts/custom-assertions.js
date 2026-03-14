/**
 * Custom Assertions for promptfoo
 * Ports evaluate.py synonym map, negation-aware checks, Norwegian quality,
 * ICPC format validation, and partial credit scoring.
 */

// ============================================================
// Synonym map for Norwegian medical terms (175 entries from evaluate.py)
// Keys are the benchmark keyword; values are acceptable alternatives.
// ============================================================
const SYNONYMS = {
  'cauda equina': ['cauda equina', 'cauda equina syndrom', 'hestehalesyndrom', 'cauda equina-syndrom'],
  'henvisning': ['henvisning', 'henvis', 'referer', 'akutt overgang', 'hastehenvisning', '113', 'legevakt', 'øyeblikkelig hjelp', 'akuttmottak', 'sykehus'],
  'myelopati': ['myelopati', 'ryggmargsaffeksjon', 'myelopatisk', 'cervikal myelopati'],
  'vertebrobasilær': ['vertebrobasilær', 'vbi', 'vertebrobasilær insuffisiens', 'vertebrobasil'],
  'mekanisk': ['mekanisk', 'mekaniske', 'muskuloskeletalt', 'bevegelsesrelatert', 'trygt', 'ingen røde flagg', 'lav risiko', 'ikke-alvorlig', 'godartet', 'benign', 'trygt behandlingsområde', 'trygt for behandling', 'ufarlig'],
  'metastas': ['metastas', 'spredning', 'sekundær tumor', 'metastase'],
  'bildediagnostikk': ['bildediagnostikk', 'billeddiagnostikk', 'røntgen', 'mr', 'ct', 'mri'],
  'infeksjon': ['infeksjon', 'infeksiøs', 'septisk', 'bakteriell'],
  'feber': ['feber', 'febril', 'temperaturforhøyelse', 'pyreksi'],
  'akutt': ['akutt', 'umiddelbar', 'øyeblikkelig', 'haster'],
  'prolaps': ['prolaps', 'skiveprolaps', 'diskusprolaps', 'herniering', 'herniert'],
  'radikulopati': ['radikulopati', 'nerverotaffeksjon', 'radikulær', 'rotaffeksjon'],
  'stenose': ['stenose', 'trang spinalkanal', 'spinal stenose'],
  'sykemelding': ['sykemelding', 'sykmelding', 'sykemeldt', 'sykmeldt'],
  'avbestill': ['avbestill', 'avbestilt', 'avbestille', 'avbestilling', 'kanseller', 'kansellert', 'avlys', 'avlyst'],
  'gratulerer': ['gratulerer', 'gratulasjon', 'bursdagsønske', 'gratulere', 'bursdag', 'fødselsdag'],
  'nakkevirvelsøyle': ['nakkevirvelsøyle', 'cervikalcolumna', 'cervikalsøylen', 'nakkevirvler', 'halsvirvelsøyle', 'cervikal', 'cervical', 'nakken'],
  'brystvirvelsøyle': ['brystvirvelsøyle', 'torakalcolumna', 'thorakalcolumna', 'brystvirvler', 'torakalsøylen', 'torakal', 'thorakal', 'brystrygg'],
  'bekkenleddet': ['bekkenleddet', 'iliosakralleddet', 'si-leddet', 'sacroiliacaleddet', 'si-ledd'],
  'bppv': ['bppv', 'krystallsyke', 'benign paroksysmal', 'posisjonsvertigo', 'posisjonssvimmelhet'],
  'subjektiv': ['Subjektiv', 'subjektiv', 'S:', 'S :', 'Subjektivt'],
  'objektiv': ['Objektiv', 'objektiv', 'O:', 'O :', 'Objektivt'],
  'vurdering': ['Vurdering', 'vurdering', 'A:', 'Analyse', 'analyse', 'Assessment'],
  'plan': ['Plan', 'plan', 'P:', 'Behandlingsplan', 'behandlingsplan'],
  'hofte': ['hofte', 'hofteledd', 'hoftesmerte', 'coxartrose', 'hofteartrose'],
  'bekken': ['bekken', 'bekkenledd', 'bekkenledds', 'bekkensmerter', 'bekkenring', 'bekkenbelte'],
  'barn': ['barn', 'gutt', 'jente', 'pediatrisk', 'barnet', 'ungdom'],
  'whiplash': ['whiplash', 'nakkesleng', 'nakkeskade', 'wad', 'piskesnert'],
  'patologisk': ['patologisk', 'malign', 'kreft', 'tumor', 'onkologisk', 'malignt'],
  'ledig': ['ledig', 'tilgjengelig', 'åpnet', 'blitt ledig', 'fri time'],
  'funksjonsevne': ['funksjonsevne', 'funksjonsnivå', 'funksjonsgrad', 'funksjon', 'adl'],
  // ICPC-2 code synonyms
  'L03': ['L03', 'L02', 'L86'],
  'L86': ['L86', 'L03', 'L84'],
  'L02': ['L02', 'L03', 'L86'],
  'L83': ['L83', 'L01', 'L83.1'],
  'L01': ['L01', 'L83'],
  'L92': ['L92', 'L08', 'L92.0', 'L92.1'],
  'L96': ['L96', 'L15', 'L96.0'],
  'L89': ['L89', 'L13', 'L89.0'],
  'N02': ['N02', 'N01', 'N89'],
  'N17': ['N17', 'H82', 'N17.1'],
  'H82': ['H82', 'N17', 'H81'],
  'L04': ['L04', 'L02', 'L84'],
  'L18': ['L18', 'D20', 'L19', 'L86', 'L99'],
  'L77': ['L77', 'L16', 'L78'],
  'L93': ['L93', 'L10', 'L93.0'],
  'L98': ['L98', 'L17', 'L87'],
  'L12': ['L12', 'L93', 'N93'],
  'L94': ['L94', 'L12'],
  'L18.1': ['L18.1', 'L18', 'L99'],
  'N89': ['N89', 'N02', 'N01'],
  'L86.1': ['L86.1', 'L86', 'L03'],
  'L03.SI': ['L03', 'L02', 'L86', 'L76'],
  'L85': ['L85', 'L84', 'L99'],
  'N93': ['N93', 'L12', 'N94', 'L94'],
  // Communication keywords
  'øvelse': ['øvelse', 'øvelser', 'trening', 'treningsøvelse', 'hjemmeøvelse', 'hjemmeøvelser', 'treningsøvelser'],
  'forsikring': ['forsikring', 'forsikringsselskap', 'forsikringsdokument', 'forsikringssak', 'forsikringserkl'],
  'kontroll': ['kontroll', 'årskontroll', 'oppfølging', 'vedlikeholdstime', 'kontrolltime', 'oppfølgingstime'],
  'operasjon': ['operasjon', 'kirurgi', 'kirurgisk', 'inngrep', 'operert'],
  // Letter-specific keywords
  'rehabilitering': ['rehabilitering', 'opptrening', 'gjenopptrening', 'rehab'],
  'fysioterapeut': ['fysioterapeut', 'fysioterapi', 'fysikalsk behandling', 'manuellterapeut'],
  'fastlege': ['fastlege', 'primærlege', 'allmennlege', 'lege', 'behandlende lege'],
  'MR': ['MR', 'MRI', 'magnetisk resonans', 'MR-undersøkelse', 'MR-henvisning'],
  // Quick field terms
  'manipulasjon': ['manipulasjon', 'manipulering', 'SMT', 'leddmanipulasjon', 'justering', 'spinal manipulativ'],
  // Diagnosis terms
  'spenningshodepine': ['spenningshodepine', 'tensjonshodepine', 'tension-type', 'spennings-hodepine', 'tensjon', 'stresshodepine', 'muskulær hodepine'],
  'tendinopati': ['tendinopati', 'tendinitt', 'senebetennelse', 'tendinose', 'impingement'],
  // Norwegian inflection forms
  'skulder': ['skulder', 'rotator cuff', 'rotatorcuff', 'rotator'],
  // Vertebral level notation
  'Th5': ['Th5', 'T5', 'T5-T6', 'T5-T7'],
  'Th4': ['Th4', 'T4'],
  // Neck pain terms
  'nakke': ['nakke', 'cervikalgi', 'cervikalt', 'cervikale'],
};

// Negation words — if a forbidden keyword is preceded by one of these, skip it
const NEGATION_WORDS = [
  'ikke', 'ingen', 'uten', 'utelukk', 'utelukker', 'utelukkes',
  'fravær', 'negativ', 'avkrefter',
  'no ', 'not ', 'rules out', 'ruled out', 'absence', 'negative',
  'unlikely', 'usannsynlig',
];

const NORWEGIAN_CHARS = new Set('æøåÆØÅ');

// Relaxed categories: 70% keyword match threshold
const RELAXED_CATEGORIES = new Set(['diagnosis_codes', 'red_flags', 'norwegian_language']);

/**
 * Check if a keyword (or any synonym) is present in the response
 */
function keywordPresent(keyword, responseLower) {
  const kwLower = keyword.toLowerCase();
  // Case-insensitive key lookup in SYNONYMS
  let synonyms = null;
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    if (key.toLowerCase() === kwLower) {
      synonyms = vals;
      break;
    }
  }
  if (!synonyms) synonyms = [keyword];

  for (const syn of synonyms) {
    if (responseLower.includes(syn.toLowerCase())) return true;
  }
  return false;
}

/**
 * Check if every occurrence of a keyword is negated (within 120 chars)
 */
function isNegated(keyword, responseLower) {
  const kwLower = keyword.toLowerCase();
  const occurrences = [];
  let idx = 0;
  while (true) {
    const pos = responseLower.indexOf(kwLower, idx);
    if (pos === -1) break;
    occurrences.push(pos);
    idx = pos + 1;
  }
  if (occurrences.length === 0) return false;

  for (const pos of occurrences) {
    const windowStart = Math.max(0, pos - 120);
    const window = responseLower.slice(windowStart, pos);
    const negated = NEGATION_WORDS.some(neg => window.includes(neg));
    if (!negated) return false;
  }
  return true;
}

/**
 * Calculate Norwegian character rate
 */
function norwegianCharRate(text) {
  let alpha = 0;
  let norwegian = 0;
  for (const c of text) {
    if (/[a-zA-ZæøåÆØÅ]/.test(c)) {
      alpha++;
      if (NORWEGIAN_CHARS.has(c)) norwegian++;
    }
  }
  return alpha === 0 ? 0 : norwegian / alpha;
}

// ============================================================
// promptfoo assertion functions
// Each returns { pass: boolean, score: number, reason: string }
// ============================================================

/**
 * Keywords present assertion — checks required keywords with synonym support
 * Usage in YAML: javascript:file://scripts/custom-assertions.js:keywordsPresent
 * Pass vars.required_keywords as JSON array and vars.category
 */
function keywordsPresent(output, context) {
  const required = JSON.parse(context.vars.required_keywords || '[]');
  const category = context.vars.category || '';
  if (required.length === 0) return { pass: true, score: 1, reason: 'No required keywords' };

  const responseLower = output.toLowerCase();
  const threshold = RELAXED_CATEGORIES.has(category) ? 0.7 : 1.0;

  const present = [];
  const missing = [];
  for (const kw of required) {
    if (keywordPresent(kw, responseLower)) {
      present.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const score = present.length / required.length;
  const pass = score >= threshold;
  const reason = pass
    ? `${present.length}/${required.length} keywords found (threshold: ${threshold * 100}%)`
    : `Missing keywords: ${missing.join(', ')} (${present.length}/${required.length}, need ${threshold * 100}%)`;

  return { pass, score, reason };
}

/**
 * Keywords absent assertion — negation-aware forbidden keyword check
 */
function keywordsAbsent(output, context) {
  const forbidden = JSON.parse(context.vars.forbidden_keywords || '[]');
  if (forbidden.length === 0) return { pass: true, score: 1, reason: 'No forbidden keywords' };

  const responseLower = output.toLowerCase();
  const found = [];
  for (const kw of forbidden) {
    if (responseLower.includes(kw.toLowerCase())) {
      if (!isNegated(kw, responseLower)) {
        found.push(kw);
      }
    }
  }

  const pass = found.length === 0;
  const score = forbidden.length > 0 ? 1 - (found.length / forbidden.length) : 1;
  const reason = pass
    ? 'No forbidden keywords found (negation-aware)'
    : `Found forbidden keywords: ${found.join(', ')}`;

  return { pass, score, reason };
}

/**
 * Norwegian quality assertion
 */
function norwegianQuality(output, context) {
  const expectNorwegian = context.vars.expect_norwegian !== 'false';
  if (!expectNorwegian) return { pass: true, score: 1, reason: 'Norwegian not required' };

  const rate = norwegianCharRate(output);
  let pass, score;
  if (rate > 0.005) {
    pass = true;
    score = 1;
  } else if (rate > 0.001) {
    pass = true;
    score = 0.7;
  } else if (rate > 0) {
    pass = true;
    score = 0.3;
  } else {
    pass = false;
    score = 0;
  }

  return { pass, score, reason: `Norwegian char rate: ${(rate * 100).toFixed(2)}%` };
}

/**
 * Response length range assertion
 */
function responseLengthRange(output, context) {
  const min = parseInt(context.vars.min_response_length || '10', 10);
  const max = parseInt(context.vars.max_response_length || '5000', 10);
  const actual = output.length;
  const pass = actual >= min && actual <= max;

  let score = pass ? 1 : 0;
  if (!pass) {
    const mid = (min + max) / 2;
    const distance = Math.abs(actual - mid) / Math.max(mid, 1);
    score = Math.max(0, 1 - distance);
  }

  return {
    pass,
    score,
    reason: `Length ${actual} chars (expected ${min}-${max})`,
  };
}

/**
 * ICPC/ICD code format assertion
 */
function codeFormat(output) {
  const hasCode = /[A-Z]\d{2}(\.\d)?/.test(output);
  return {
    pass: hasCode,
    score: hasCode ? 1 : 0,
    reason: hasCode ? 'Contains ICD-10/ICPC-2 format code' : 'No ICD-10/ICPC-2 code found',
  };
}

module.exports = {
  keywordsPresent,
  keywordsAbsent,
  norwegianQuality,
  responseLengthRange,
  codeFormat,
  // Expose internals for testing
  SYNONYMS,
  NEGATION_WORDS,
  keywordPresent,
  isNegated,
  norwegianCharRate,
};
