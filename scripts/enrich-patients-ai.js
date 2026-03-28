/**
 * Enrich patient records with AI-generated realistic clinical data.
 * Uses chiro-no-sft-dpo-v6 Ollama model for Norwegian chiropractic context.
 */
import http from 'http';

const OLLAMA_URL = 'http://localhost:11434';
const API_URL = 'http://localhost:3000/api/v1';
const MODEL = 'chiro-no-sft-dpo-v6';

// Norwegian chiropractic problems weighted by real clinic distribution
const MAIN_PROBLEMS = [
  'Korsryggsmerter', 'Korsryggsmerter', 'Korsryggsmerter',  // most common
  'Nakkesmerter', 'Nakkesmerter', 'Nakkesmerter',
  'Hodepine', 'Hodepine',
  'Skuldersmerter', 'Skuldersmerter',
  'Svimmelhet',
  'Knesmerter',
  'Hoftesmerter',
  'Kjeveleddssmerter',
  'Tennisalbue',
  'Isjias',
  'Thorax-smerter',
  'Bekkenplager',
  'Ankelplager',
  'Fotplager',
];

const GENDERS = ['MALE', 'FEMALE', 'FEMALE', 'FEMALE']; // slight female skew for chiro

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function askOllama(prompt) {
  const res = await httpRequest(`${OLLAMA_URL}/api/generate`, 'POST', {
    model: MODEL,
    prompt,
    stream: false,
    options: { temperature: 0.8, num_predict: 300 },
  });
  return res.data?.response || '';
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  const prefixes = ['4', '9'];
  const prefix = randomFrom(prefixes);
  let num = prefix;
  for (let i = 0; i < 7; i++) num += Math.floor(Math.random() * 10);
  return '+47' + num;
}

function randomEmail(first, last) {
  const clean = (s) => s.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z]/g, '');
  const domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'online.no', 'yahoo.no'];
  return `${clean(first)}.${clean(last)}@${randomFrom(domains)}`;
}

async function enrichPatient(patient) {
  const mainProblem = randomFrom(MAIN_PROBLEMS);
  const gender = randomFrom(GENDERS);
  const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();

  // Ask AI for a brief medical history and internal notes
  const aiPrompt = `Du er kiropraktor. Skriv en kort internnotat (2-3 setninger) for en ${gender === 'FEMALE' ? 'kvinnelig' : 'mannlig'} pasient, ${age} år, med hovedplage: ${mainProblem}. Inkluder relevant sykehistorie og kliniske funn. Kun norsk. Kort og konsist.`;

  let internalNotes = '';
  try {
    internalNotes = await askOllama(aiPrompt);
    // Clean up - take first 2-3 sentences
    internalNotes = internalNotes.split('\n').filter(l => l.trim()).slice(0, 3).join(' ').substring(0, 500);
  } catch (err) {
    internalNotes = `${mainProblem}. Ingen kjente kontraindikasjoner.`;
  }

  // Build update payload
  const update = {
    gender,
    phone: randomPhone(),
    email: randomEmail(patient.first_name, patient.last_name),
    main_problem: mainProblem,
    internal_notes: internalNotes,
    preferred_contact_method: randomFrom(['SMS', 'EMAIL', 'PHONE']),
    referral_source: randomFrom(['Google', 'Anbefaling', 'Fastlege', 'Forsikring', 'Tidligere pasient', 'Walk-in']),
    treatment_pref_adjustments: Math.random() > 0.2,
    treatment_pref_needles: Math.random() > 0.6,
    treatment_pref_neck_adjustments: Math.random() > 0.3,
  };

  return update;
}

async function main() {
  process.stdout.write('Fetching patients...\n');

  // Get all patients
  const res = await httpRequest(`${API_URL}/patients?limit=100`, 'GET');
  const patients = res.data?.patients || [];
  process.stdout.write(`Found ${patients.length} patients. Enriching with AI...\n\n`);

  let ok = 0;
  let fail = 0;

  for (const patient of patients) {
    // Skip if already has main_problem (already enriched)
    if (patient.main_problem) {
      process.stdout.write(`  SKIP ${patient.first_name} ${patient.last_name} (already enriched)\n`);
      ok++;
      continue;
    }

    try {
      await sleep(500); // avoid rate limiting
      const update = await enrichPatient(patient);
      const patchRes = await httpRequest(`${API_URL}/patients/${patient.id}`, 'PATCH', update);

      if (patchRes.status === 200) {
        ok++;
        process.stdout.write(`  OK   ${patient.first_name} ${patient.last_name} — ${update.main_problem}\n`);
      } else {
        fail++;
        process.stdout.write(`  FAIL ${patient.first_name} ${patient.last_name} — ${patchRes.status}: ${JSON.stringify(patchRes.data).substring(0, 100)}\n`);
      }
    } catch (err) {
      fail++;
      process.stdout.write(`  ERR  ${patient.first_name} ${patient.last_name} — ${err.message}\n`);
    }
  }

  process.stdout.write(`\nDone: ${ok} OK, ${fail} failed out of ${patients.length}\n`);
}

main().catch(err => {
  process.stderr.write('Fatal: ' + err.message + '\n');
  process.exit(1);
});
