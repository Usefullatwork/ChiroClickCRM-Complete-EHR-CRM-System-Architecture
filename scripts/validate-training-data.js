import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ── Configuration ──────────────────────────────────────────────

const DATA_FILES = [
  'ai-training/training-data.jsonl',
  'training_data/clinical_cases_katrine.jsonl',
  'training_data/physiotherapy_training_dataset.jsonl',
];

const MIN_PROMPT_LENGTH = 10;
const MIN_RESPONSE_LENGTH = 20;

const BODY_REGION_PATTERNS = {
  'rygg/lumbal': /\b(rygg|lumbal|korsrygg|lavrygg|lower back|lumbago|l[1-5]|sacro|bekken)\b/i,
  'nakke/cervikal': /\b(nakke|cervikal|cervical|nakkesmerter|c[1-7]|whiplash|hodepine relatert til nakke)\b/i,
  'skulder': /\b(skulder|shoulder|rotator|supraspinatus|impingement|frozen shoulder|skulderledd)\b/i,
  'hofte': /\b(hofte|hip|hofteledd|coxartrose|hoftefleksjon|iliosacral|si-?ledd)\b/i,
  'kne': /\b(kne|knee|patella|menisk|korsbånd|cruciate|kneleddet)\b/i,
  'albue': /\b(albue|elbow|tennis\s?albue|epicondyl|lateral epicondylitt)\b/i,
  'ankel': /\b(ankel|ankle|fotledd|akillessene|plantar|hæl)\b/i,
  'thorakal': /\b(thorakal|thoracic|brystygg|t[1-9]|t1[0-2]|mellomrygg|costae|ribbe)\b/i,
};

const TYPE_PATTERNS = {
  'SOAP': /\b(soap|subjektiv|objektiv|assessment|plan|s:|o:|a:|p:)\b/i,
  'assessment': /\b(vurdering|assessment|diagnos|differensial|klinisk vurdering|funn)\b/i,
  'treatment': /\b(behandling|treatment|manipulasjon|mobilisering|terapi|justering|adjustment)\b/i,
  'exercise': /\b(øvelse|exercise|trening|hjemmeøvelse|egentrening|tøying|stretching|styrke)\b/i,
  'communication': /\b(kommunikasjon|pasientinfo|forklaring|informer|rådgi|samtale|motivasjon)\b/i,
  'autocomplete': /\b(autofullfør|autocomplete|forslag|fullføring|snippet)\b/i,
  'anamnese': /\b(anamnese|sykehistorie|history|hva plager|hvor lenge|symptom)\b/i,
  'journal': /\b(journal|journalnotat|epikrise|notat|dokumentasjon)\b/i,
};

// ── PII Detection ──────────────────────────────────────────────

const PII_PATTERNS = [
  { name: 'phone', pattern: /\b(\+47\s?)?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/ },
  { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ },
  { name: 'norwegian_id', pattern: /\b\d{6}\s?\d{5}\b/ },   // fødselsnummer: 6+5 digits
];

// ── Helpers ─────────────────────────────────────────────────────

function classifyBodyRegion(text) {
  const regions = [];
  for (const [region, regex] of Object.entries(BODY_REGION_PATTERNS)) {
    if (regex.test(text)) regions.push(region);
  }
  return regions.length > 0 ? regions : ['other'];
}

function classifyType(text) {
  const types = [];
  for (const [type, regex] of Object.entries(TYPE_PATTERNS)) {
    if (regex.test(text)) types.push(type);
  }
  return types.length > 0 ? types : ['other'];
}

function detectPII(text) {
  const found = [];
  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(text)) found.push(name);
  }
  return found;
}

function simpleHash(str) {
  // Normalize: lowercase, collapse whitespace, trim
  const norm = str.toLowerCase().replace(/\s+/g, ' ').trim();
  // Simple hash for dedup detection
  let h = 0;
  for (let i = 0; i < norm.length; i++) {
    h = ((h << 5) - h + norm.charCodeAt(i)) | 0;
  }
  return h;
}

// ── Main ────────────────────────────────────────────────────────

const stats = {
  totalEntries: 0,
  validEntries: 0,
  invalidJSON: 0,
  missingFields: 0,
  tooShortPrompt: 0,
  tooShortResponse: 0,
  piiDetected: [],
  bodyRegionCounts: {},
  typeCounts: {},
  promptLengths: [],
  responseLengths: [],
  duplicates: 0,
  fileStats: {},
};

const seenHashes = new Map(); // hash -> { file, line }

for (const relPath of DATA_FILES) {
  const fullPath = path.join(projectRoot, relPath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`ADVARSEL: Fil ikke funnet - ${relPath}`);
    stats.fileStats[relPath] = { status: 'not found' };
    continue;
  }

  const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').filter(l => l.trim());
  const fileStat = { total: lines.length, valid: 0, issues: [] };

  for (let i = 0; i < lines.length; i++) {
    stats.totalEntries++;
    const lineNum = i + 1;

    // Parse JSON
    let entry;
    try {
      entry = JSON.parse(lines[i]);
    } catch {
      stats.invalidJSON++;
      fileStat.issues.push(`Line ${lineNum}: Invalid JSON`);
      continue;
    }

    // Check required fields
    const prompt = entry.prompt ?? entry.instruction ?? entry.input ?? '';
    const response = entry.response ?? entry.output ?? entry.completion ?? '';

    if (!prompt && !response) {
      stats.missingFields++;
      fileStat.issues.push(`Line ${lineNum}: Missing prompt/response fields`);
      continue;
    }

    // Length checks
    if (prompt.length < MIN_PROMPT_LENGTH) {
      stats.tooShortPrompt++;
      fileStat.issues.push(`Line ${lineNum}: Prompt too short (${prompt.length} chars)`);
    }
    if (response.length < MIN_RESPONSE_LENGTH) {
      stats.tooShortResponse++;
      fileStat.issues.push(`Line ${lineNum}: Response too short (${response.length} chars)`);
    }

    // PII detection
    const combinedText = `${prompt} ${response}`;
    const pii = detectPII(combinedText);
    if (pii.length > 0) {
      stats.piiDetected.push({ file: relPath, line: lineNum, types: pii });
    }

    // Body region classification
    const regions = classifyBodyRegion(combinedText);
    for (const r of regions) {
      stats.bodyRegionCounts[r] = (stats.bodyRegionCounts[r] || 0) + 1;
    }

    // Type classification
    const types = classifyType(combinedText);
    for (const t of types) {
      stats.typeCounts[t] = (stats.typeCounts[t] || 0) + 1;
    }

    // Length stats
    stats.promptLengths.push(prompt.length);
    stats.responseLengths.push(response.length);

    // Duplicate detection
    const hash = simpleHash(prompt + '|||' + response);
    if (seenHashes.has(hash)) {
      stats.duplicates++;
      const prev = seenHashes.get(hash);
      fileStat.issues.push(`Line ${lineNum}: Possible duplicate of ${prev.file}:${prev.line}`);
    } else {
      seenHashes.set(hash, { file: relPath, line: lineNum });
    }

    fileStat.valid++;
    stats.validEntries++;
  }

  stats.fileStats[relPath] = fileStat;
}

// ── Reporting ───────────────────────────────────────────────────

function avg(arr) {
  return arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function sortedEntries(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

console.log('\n' + '='.repeat(64));
console.log('  ChiroClick Training Data Validation Report');
console.log('='.repeat(64));

// Per-file summary
console.log('\n--- Filer / Files ---');
for (const [file, info] of Object.entries(stats.fileStats)) {
  if (info.status === 'not found') {
    console.log(`  ${file}: IKKE FUNNET`);
  } else {
    console.log(`  ${file}: ${info.valid}/${info.total} valid entries`);
    if (info.issues.length > 0) {
      const shown = info.issues.slice(0, 10);
      for (const issue of shown) {
        console.log(`    - ${issue}`);
      }
      if (info.issues.length > 10) {
        console.log(`    ... og ${info.issues.length - 10} flere issues`);
      }
    }
  }
}

// Overall stats
console.log('\n--- Totalt / Totals ---');
console.log(`  Total entries:        ${stats.totalEntries}`);
console.log(`  Valid entries:         ${stats.validEntries}`);
console.log(`  Invalid JSON:         ${stats.invalidJSON}`);
console.log(`  Missing fields:       ${stats.missingFields}`);
console.log(`  Prompt too short:     ${stats.tooShortPrompt}`);
console.log(`  Response too short:   ${stats.tooShortResponse}`);
console.log(`  Duplicates:           ${stats.duplicates}`);

// Length stats
console.log('\n--- Lengdestatistikk / Length Stats ---');
console.log(`  Prompt  - avg: ${avg(stats.promptLengths)} chars, median: ${median(stats.promptLengths)}, min: ${Math.min(...stats.promptLengths) || 0}, max: ${Math.max(...stats.promptLengths) || 0}`);
console.log(`  Response - avg: ${avg(stats.responseLengths)} chars, median: ${median(stats.responseLengths)}, min: ${Math.min(...stats.responseLengths) || 0}, max: ${Math.max(...stats.responseLengths) || 0}`);

// Body region distribution
console.log('\n--- Kroppsregioner / Body Regions ---');
for (const [region, count] of sortedEntries(stats.bodyRegionCounts)) {
  const pct = ((count / stats.validEntries) * 100).toFixed(1);
  const bar = '#'.repeat(Math.round(count / stats.validEntries * 30));
  console.log(`  ${region.padEnd(18)} ${String(count).padStart(5)}  (${pct.padStart(5)}%)  ${bar}`);
}

// Type distribution
console.log('\n--- Typer / Categories ---');
for (const [type, count] of sortedEntries(stats.typeCounts)) {
  const pct = ((count / stats.validEntries) * 100).toFixed(1);
  const bar = '#'.repeat(Math.round(count / stats.validEntries * 30));
  console.log(`  ${type.padEnd(18)} ${String(count).padStart(5)}  (${pct.padStart(5)}%)  ${bar}`);
}

// PII warnings
console.log('\n--- PII Advarsler / PII Warnings ---');
if (stats.piiDetected.length === 0) {
  console.log('  Ingen PII oppdaget. Bra!');
} else {
  console.log(`  ADVARSEL: ${stats.piiDetected.length} entries med mulig PII:`);
  for (const item of stats.piiDetected.slice(0, 20)) {
    console.log(`    ${item.file}:${item.line} - ${item.types.join(', ')}`);
  }
  if (stats.piiDetected.length > 20) {
    console.log(`    ... og ${stats.piiDetected.length - 20} flere`);
  }
}

// Quality summary
console.log('\n--- Kvalitetssammendrag / Quality Summary ---');
const qualityIssues = stats.invalidJSON + stats.missingFields + stats.tooShortPrompt + stats.tooShortResponse + stats.duplicates + stats.piiDetected.length;
if (qualityIssues === 0) {
  console.log('  Ingen kvalitetsproblemer funnet! Datasettet ser bra ut.');
} else {
  console.log(`  ${qualityIssues} totale kvalitetsproblemer funnet.`);
  if (stats.piiDetected.length > 0) console.log('  KRITISK: PII maa fjernes foer trening!');
  if (stats.duplicates > 0) console.log(`  Vurder aa fjerne ${stats.duplicates} duplikater.`);
}

console.log('\n' + '='.repeat(64));
console.log('  Validering fullfoert / Validation complete');
console.log('='.repeat(64) + '\n');
