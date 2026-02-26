#!/usr/bin/env node
/**
 * extract-website-training-v2.js
 *
 * Mine clinical content from TheBackROM website (~740 HTML pages) into
 * ChatML JSONL training data for ChiroClickCRM AI models.
 *
 * Improvements over v1 (mine_website_content.py):
 *   - Balanced-brace div matching (handles nested HTML)
 *   - Catches both red-flag-alert AND red-flag-box
 *   - Strips CTA / promotional content from assistant output
 *   - MD5 dedup against all existing mined/*.jsonl
 *   - 5 distinct task types with proper metadata
 *   - Min 20 / max 2000 char assistant responses
 *
 * Zero external dependencies — only fs, path, crypto.
 *
 * Usage:
 *   node ai-training/scripts/extract-website-training-v2.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// Configuration
// ============================================================

const WEBSITE_DIR = 'E:/TheBackROM/website';
const PROJECT_DIR = path.resolve(__dirname, '../..');
const OUTPUT_FILE = path.join(PROJECT_DIR, 'ai-training/data/mined/website-conditions-v2.jsonl');
const MINED_DIR = path.join(PROJECT_DIR, 'ai-training/data/mined');

const SCAN_DIRS = [
  { dir: 'plager', lang: 'no', recursive: true },
  { dir: 'en/conditions', lang: 'en', recursive: true },
  { dir: 'blogg', lang: 'no', recursive: false },
  { dir: 'en/blog', lang: 'en', recursive: false },
];

const MIN_ASSISTANT_LEN = 20;
const MAX_ASSISTANT_LEN = 2000;

// System prompts per model target
const SYSTEM_PROMPTS = {
  no: {
    education: 'Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. Generer nøyaktige, profesjonelle pasientforklaringer. Bruk korrekt norsk medisinsk terminologi.',
    safety: 'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. Prioriter alltid pasientsikkerhet.',
    communication: 'Du er en klinisk kommunikasjonsassistent for kiropraktorer i Norge. Svar klart og empatisk på pasientspørsmål. Bruk korrekt norsk medisinsk terminologi.',
    summary: 'Du er en rask klinisk tekstassistent. Generer korte, presise kliniske oppsummeringer for kiropraktisk dokumentasjon.',
    differential: 'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. Gi differensialdiagnostikk basert på symptomer og kliniske funn. Prioriter alltid pasientsikkerhet.',
  },
  en: {
    education: 'You are a clinical documentation specialist for chiropractic. Generate accurate, professional patient explanations using correct medical terminology.',
    safety: 'You are a medical safety advisor for chiropractic. Identify red flags, provide differential diagnosis and clinical reasoning. Always prioritize patient safety.',
    communication: 'You are a clinical communication assistant for chiropractors. Answer patient questions clearly and empathetically using correct medical terminology.',
    summary: 'You are a quick clinical text assistant. Generate concise clinical summaries for chiropractic documentation.',
    differential: 'You are a medical safety advisor for chiropractic. Provide differential diagnosis based on symptoms and clinical findings. Always prioritize patient safety.',
  },
};

// Model assignments per task type
const TASK_MODELS = {
  patient_education: 'chiro-norwegian-lora-v2',
  red_flag_analysis: 'chiro-no-lora-v2',
  patient_communication: 'chiro-norwegian-lora-v2',
  clinical_summary: 'chiro-norwegian-lora-v2',
  differential_diagnosis: 'chiro-no-lora-v2',
};

// CTA patterns to strip from assistant content
const CTA_PATTERNS = [
  /bestill\s+time\s*(online)?/gi,
  /book\s+(appointment|online|now)/gi,
  /ring\s*:?\s*\+?\d[\d\s]{6,}/gi,           // phone numbers
  /\+47\s*\d[\d\s]+/g,                         // Norwegian phone
  /\d{3}\s*\d{2}\s*\d{3}/g,                    // phone pattern NNN NN NNN
  /\d[\s.]?\d{3}\s*kr\b/gi,                    // prices like "1 140 kr"
  /\b\d{2,4}\s*kr\b/gi,                         // prices like "795 kr", "45 kr"
  /\d+\s*kroner/gi,
  /førstegangskonsultasjon[^.]*\./gi,
  /oppfølgingstime[^.]*\./gi,
  /oppfølging[^.]*\d+\s*(min|kr)[^.]*/gi,
  /prisene\s+varierer[^.]*\./gi,
  /prices\s+vary[^.]*\./gi,
  /onlinebooking\.solvitjournal\.no[^\s"]*/g,
  /https?:\/\/onlinebooking[^\s"]*/g,
  /kiropraktor\s+mads\s+finstad[^.]*/gi,
  /chiropractor\s+mads\s+finstad[^.]*/gi,
  /[^.]*mads\s+finstad[^.]*/gi,
  /klinikk\s+for\s+alle[^.]*majorstu[^.]*/gi,
  /du\s+trenger\s+ingen\s+henvisning[^.]*/gi,
  /you\s+don'?t\s+need\s+a\s+referral[^.]*/gi,
  /trygderefusjon[^.]*/gi,
  /insurance\s+reimbursement[^.]*/gi,
  /(?:hos oss|hos thebackrom)[^.]*/gi,
  /thebackrom\s+(on|på)\s+majorstu[^.]*/gi,
  /(?:vi tilbyr|we offer)[^.]*(?:time|appointment)[^.]*/gi,
  /(?:samme dag|neste dag|same day|next day)[^.]*time[^.]*/gi,
  /(?:Tid|Time)\s+(?:samme|neste)\s+dag[^.]*/gi,
  /\(\d+\s*min(?:utter|utes)?\)/g,
];

// ============================================================
// HTML Parsing Utilities
// ============================================================

/**
 * Extract text content from HTML, stripping tags.
 * Preserves paragraph breaks as \n.
 */
function htmlToText(html) {
  if (!html) return '';

  let text = html
    // Remove script/style/noscript blocks
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove hub-cta blocks (promotional)
    .replace(/<div[^>]*class="hub-cta"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '')
    // Remove booking links
    .replace(/<a[^>]*onlinebooking[^>]*>[\s\S]*?<\/a>/gi, '')
    // Remove btn/button links inside content
    .replace(/<a[^>]*class="btn[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    // Convert block elements to newlines
    .replace(/<\/(p|li|h[1-6]|div|br|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    // Normalize whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return text;
}

/**
 * Extract all div/section blocks with a specific class using balanced-brace matching.
 * Handles nested divs correctly.
 */
function extractBlocksByClass(html, tagName, className) {
  const results = [];
  // Match opening tags with the class
  const openPattern = new RegExp(
    `<${tagName}[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>`,
    'gi'
  );

  let match;
  while ((match = openPattern.exec(html)) !== null) {
    const startIdx = match.index;
    const afterOpen = startIdx + match[0].length;

    // Count nested tags to find the matching close
    let depth = 1;
    let i = afterOpen;
    const closeTag = `</${tagName}>`;
    const openTagRe = new RegExp(`<${tagName}[\\s>]`, 'gi');

    while (depth > 0 && i < html.length) {
      // Check for closing tag
      if (html.substring(i, i + closeTag.length).toLowerCase() === closeTag.toLowerCase()) {
        depth--;
        if (depth === 0) {
          const innerHtml = html.substring(afterOpen, i);
          results.push(innerHtml);
          break;
        }
        i += closeTag.length;
        continue;
      }

      // Check for opening tag of same type
      openTagRe.lastIndex = i;
      const openMatch = openTagRe.exec(html);
      if (openMatch && openMatch.index === i) {
        depth++;
        i = openMatch.index + openMatch[0].length;
        continue;
      }

      i++;
    }
  }

  return results;
}

/**
 * Extract sections (which use <section> tag).
 */
function extractSections(html) {
  return extractBlocksByClass(html, 'section', 'hub-section');
}

/**
 * Extract the page title from <h1>.
 */
function extractTitle(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? htmlToText(m[1]).replace(/\s*[-–—|].*/g, '').trim() : null;
}

/**
 * Extract the condition name from the title (shorter form for prompts).
 */
function extractConditionName(title) {
  if (!title) return null;
  // Remove common suffixes
  return title
    .replace(/\s*[-–—]\s*(årsaker|symptomer|behandling|causes|symptoms|treatment|guide|komplett).*/i, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();
}

/**
 * Detect page language from <html lang="...">.
 */
function detectLanguage(html) {
  const m = html.match(/<html\s+lang="([^"]+)"/i);
  if (m) {
    const lang = m[1].toLowerCase();
    if (['nb', 'no', 'nn'].includes(lang)) return 'no';
    if (lang === 'en') return 'en';
  }
  return 'no'; // default
}

/**
 * Check if page is a redirect stub.
 */
function isRedirectStub(html) {
  return /<meta\s+http-equiv="refresh"/i.test(html);
}

/**
 * Extract h2 title from a section block.
 */
function extractSectionTitle(sectionHtml) {
  const m = sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  return m ? htmlToText(m[1]).trim() : null;
}

/**
 * Strip CTA/promotional content from text.
 */
function stripCTA(text) {
  let cleaned = text;
  for (const pattern of CTA_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    cleaned = cleaned.replace(pattern, '');
  }
  // Clean up orphaned whitespace/punctuation from removals
  cleaned = cleaned
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\.\s*\./g, '.')
    .replace(/:\s*$/gm, '')
    .trim();
  return cleaned;
}

/**
 * Truncate text to max length at a sentence boundary.
 */
function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  // Try to cut at sentence boundary
  const truncated = text.substring(0, maxLen);
  const lastPeriod = truncated.lastIndexOf('.');
  if (lastPeriod > maxLen * 0.6) {
    return truncated.substring(0, lastPeriod + 1);
  }
  return truncated.trimEnd() + '...';
}

/**
 * Compute MD5 hash for deduplication (same as clean_and_prepare.py).
 * Hashes user + assistant content, ignoring system prompt.
 */
function contentHash(userContent, assistantContent) {
  const text = `user:${userContent.trim()}||assistant:${assistantContent.trim()}`;
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

// ============================================================
// Content Extractors (by task type)
// ============================================================

/**
 * Task 1: patient_education — intro + summary + treatment sections
 */
function extractPatientEducation(html, condition, lang) {
  const examples = [];
  const systemPrompt = SYSTEM_PROMPTS[lang].education;

  // Extract intro-text
  const intros = extractBlocksByClass(html, 'div', 'intro-text');
  for (const intro of intros) {
    const text = stripCTA(htmlToText(intro));
    if (text.length >= MIN_ASSISTANT_LEN) {
      const userPrompt = lang === 'no'
        ? `Forklar ${condition} for en pasient.`
        : `Explain ${condition} to a patient.`;
      examples.push(makeExample(systemPrompt, userPrompt, truncate(text, MAX_ASSISTANT_LEN), {
        task_type: 'patient_education',
        lang,
        condition,
        source: 'intro-text',
      }));
    }
  }

  // Extract treatment/prognosis sections
  const sections = extractSections(html);
  const treatmentKeywords = lang === 'no'
    ? ['behandling', 'terapi', 'manuell', 'kiropraktisk', 'prognose', 'forløp', 'bedring', 'trening', 'øvelser', 'forebygg']
    : ['treatment', 'therapy', 'chiropractic', 'prognosis', 'recovery', 'exercise', 'prevention', 'management'];

  for (const section of sections) {
    const title = extractSectionTitle(section);
    if (!title) continue;
    const titleLower = title.toLowerCase();
    if (!treatmentKeywords.some(kw => titleLower.includes(kw))) continue;

    let text = stripCTA(htmlToText(section));
    // Remove section number prefix
    text = text.replace(/^\d+\s*\n/, '');
    if (text.length < 50) continue;

    const userPrompt = lang === 'no'
      ? `Forklar ${title.toLowerCase()} for ${condition}.`
      : `Explain ${title.toLowerCase()} for ${condition}.`;

    examples.push(makeExample(systemPrompt, userPrompt, truncate(text, MAX_ASSISTANT_LEN), {
      task_type: 'patient_education',
      lang,
      condition,
      source: 'hub-section',
    }));
  }

  return examples;
}

/**
 * Task 2: red_flag_analysis — red-flag-alert + red-flag-box
 */
function extractRedFlags(html, condition, lang) {
  const examples = [];
  const systemPrompt = SYSTEM_PROMPTS[lang].safety;

  // Both red-flag-alert and red-flag-box
  const alertBlocks = extractBlocksByClass(html, 'div', 'red-flag-alert');
  const boxBlocks = extractBlocksByClass(html, 'div', 'red-flag-box');
  const allBlocks = [...alertBlocks, ...boxBlocks];

  for (const block of allBlocks) {
    const text = stripCTA(htmlToText(block));
    if (text.length < MIN_ASSISTANT_LEN) continue;

    // Primary prompt
    const userPrompt = lang === 'no'
      ? `Røde flagg ved ${condition}?`
      : `Red flags for ${condition}?`;

    examples.push(makeExample(systemPrompt, userPrompt, truncate(text, MAX_ASSISTANT_LEN), {
      task_type: 'red_flag_analysis',
      lang,
      condition,
      source: 'red-flag',
    }));

    // Secondary prompt (different phrasing)
    const userPrompt2 = lang === 'no'
      ? `Hvilke faresignaler bør man være oppmerksom på ved ${condition}?`
      : `What warning signs should be monitored for ${condition}?`;

    examples.push(makeExample(systemPrompt, userPrompt2, truncate(text, MAX_ASSISTANT_LEN), {
      task_type: 'red_flag_analysis',
      lang,
      condition,
      source: 'red-flag',
    }));
  }

  // Also check hub-sections with red flag keywords
  const sections = extractSections(html);
  const rfKeywords = lang === 'no'
    ? ['røde flagg', 'faresignal', 'advarsel', 'akutt', 'legevakt', '113']
    : ['red flag', 'warning sign', 'emergency', 'urgent', 'seek medical'];

  for (const section of sections) {
    const title = extractSectionTitle(section);
    if (!title) continue;
    if (!rfKeywords.some(kw => title.toLowerCase().includes(kw))) continue;

    // Avoid duplicating content already captured from red-flag boxes
    const text = stripCTA(htmlToText(section)).replace(/^\d+\s*\n/, '');
    if (text.length < 50) continue;

    const userPrompt = lang === 'no'
      ? `Identifiser røde flagg for ${condition}.`
      : `Identify red flags for ${condition}.`;

    examples.push(makeExample(systemPrompt, userPrompt, truncate(text, MAX_ASSISTANT_LEN), {
      task_type: 'red_flag_analysis',
      lang,
      condition,
      source: 'hub-section',
    }));
  }

  return examples;
}

/**
 * Task 3: patient_communication — FAQ items
 */
function extractFAQs(html, condition, lang) {
  const examples = [];
  const systemPrompt = SYSTEM_PROMPTS[lang].communication;

  const faqBlocks = extractBlocksByClass(html, 'div', 'faq-item');

  for (const block of faqBlocks) {
    // Extract question from h3
    const qMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    // Extract answer from faq-answer div or next <p>/<div>
    const aMatch = block.match(/<div[^>]*class="faq-answer"[^>]*>([\s\S]*?)<\/div>/i)
      || block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

    if (!qMatch || !aMatch) continue;

    const question = htmlToText(qMatch[1]).trim();
    const answer = stripCTA(htmlToText(aMatch[1])).trim();

    if (question.length < 5 || answer.length < MIN_ASSISTANT_LEN) continue;

    const userPrompt = lang === 'no'
      ? `Pasient spør: "${question}"`
      : `Patient asks: "${question}"`;

    examples.push(makeExample(systemPrompt, userPrompt, truncate(answer, MAX_ASSISTANT_LEN), {
      task_type: 'patient_communication',
      lang,
      condition,
      source: 'faq-item',
    }));
  }

  // Also extract from JSON-LD FAQPage schema
  const jsonLdPattern = /<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi;
  let jsonMatch;
  while ((jsonMatch = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data['@type'] !== 'FAQPage' || !data.mainEntity) continue;
      for (const item of data.mainEntity) {
        if (item['@type'] !== 'Question') continue;
        const q = (item.name || '').trim();
        const a = stripCTA((item.acceptedAnswer?.text || '').trim());
        if (q.length < 5 || a.length < MIN_ASSISTANT_LEN) continue;

        const userPrompt = lang === 'no'
          ? `Pasient spør: "${q}"`
          : `Patient asks: "${q}"`;

        examples.push(makeExample(systemPrompt, userPrompt, truncate(a, MAX_ASSISTANT_LEN), {
          task_type: 'patient_communication',
          lang,
          condition,
          source: 'jsonld-faq',
        }));
      }
    } catch { /* skip invalid JSON-LD */ }
  }

  return examples;
}

/**
 * Task 4: clinical_summary — premium-summary-card + section headers
 */
function extractClinicalSummaries(html, condition, lang) {
  const examples = [];
  const systemPrompt = SYSTEM_PROMPTS[lang].summary;

  // Premium summary card
  const summaryBlocks = extractBlocksByClass(html, 'div', 'premium-summary-card');
  for (const block of summaryBlocks) {
    // Strip the booking button that often appears inside
    let cleaned = block.replace(/<a[^>]*class="btn[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    let text = stripCTA(htmlToText(cleaned));
    if (text.length < MIN_ASSISTANT_LEN) continue;

    const userPrompt = lang === 'no'
      ? `Klinisk oppsummering av ${condition}.`
      : `Clinical summary of ${condition}.`;

    examples.push(makeExample(systemPrompt, userPrompt, truncate(text, MAX_ASSISTANT_LEN), {
      task_type: 'clinical_summary',
      lang,
      condition,
      source: 'premium-summary-card',
    }));
  }

  // Collect section titles + first paragraph for a multi-section summary
  const sections = extractSections(html);
  if (sections.length >= 3) {
    const sectionSummaries = [];
    for (const section of sections) {
      const title = extractSectionTitle(section);
      if (!title) continue;
      // Get first paragraph
      const pMatch = section.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch) {
        const pText = htmlToText(pMatch[1]).trim();
        if (pText.length > 20) {
          sectionSummaries.push(`${title}: ${pText}`);
        }
      }
    }
    if (sectionSummaries.length >= 3) {
      const combined = stripCTA(sectionSummaries.join('\n\n'));
      const userPrompt = lang === 'no'
        ? `Gi en strukturert klinisk oversikt over ${condition}.`
        : `Provide a structured clinical overview of ${condition}.`;

      examples.push(makeExample(systemPrompt, userPrompt, truncate(combined, MAX_ASSISTANT_LEN), {
        task_type: 'clinical_summary',
        lang,
        condition,
        source: 'section-headers',
      }));
    }
  }

  return examples;
}

/**
 * Task 5: differential_diagnosis — symptom/cause sections + condition cards
 */
function extractDifferentialDiagnosis(html, condition, lang) {
  const examples = [];
  const systemPrompt = SYSTEM_PROMPTS[lang].differential;

  const sections = extractSections(html);
  const diagKeywords = lang === 'no'
    ? ['årsak', 'differensial', 'diagnos', 'symptom', 'kjennetegn', 'undersøk', 'typer', 'former']
    : ['cause', 'differential', 'diagnos', 'symptom', 'sign', 'examin', 'type', 'form'];

  for (const section of sections) {
    const title = extractSectionTitle(section);
    if (!title) continue;
    const titleLower = title.toLowerCase();
    if (!diagKeywords.some(kw => titleLower.includes(kw))) continue;

    // Extract condition cards within this section
    const cards = extractBlocksByClass(section, 'div', 'condition-card');
    if (cards.length >= 2) {
      // Multiple condition cards = differential diagnosis list
      const cardTexts = [];
      for (const card of cards) {
        const cardTitle = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
        const cardContent = htmlToText(card).trim();
        if (cardTitle && cardContent.length > 20) {
          cardTexts.push(stripCTA(cardContent));
        }
      }

      if (cardTexts.length >= 2) {
        const combined = cardTexts.join('\n\n');
        const userPrompt = lang === 'no'
          ? `Differensialdiagnoser ved ${condition}?`
          : `Differential diagnoses for ${condition}?`;

        examples.push(makeExample(systemPrompt, userPrompt, truncate(combined, MAX_ASSISTANT_LEN), {
          task_type: 'differential_diagnosis',
          lang,
          condition,
          source: 'condition-cards',
        }));
      }
    }

    // Also the full section content for cause/symptom sections
    let text = stripCTA(htmlToText(section)).replace(/^\d+\s*\n/, '');
    if (text.length < 80) continue;

    const userPrompt = lang === 'no'
      ? `Beskriv ${title.toLowerCase()} for ${condition}.`
      : `Describe ${title.toLowerCase()} for ${condition}.`;

    examples.push(makeExample(systemPrompt, userPrompt, truncate(text, MAX_ASSISTANT_LEN), {
      task_type: 'differential_diagnosis',
      lang,
      condition,
      source: 'hub-section',
    }));
  }

  return examples;
}

// ============================================================
// Example Builder
// ============================================================

function makeExample(system, user, assistant, metadata) {
  return {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
      { role: 'assistant', content: assistant },
    ],
    metadata: {
      ...metadata,
      model: TASK_MODELS[metadata.task_type] || 'chiro-no-lora-v2',
    },
  };
}

// ============================================================
// File Discovery
// ============================================================

function findHtmlFiles(websiteDir) {
  const files = [];

  for (const { dir, lang, recursive } of SCAN_DIRS) {
    const fullDir = path.join(websiteDir, dir);
    if (!fs.existsSync(fullDir)) {
      console.warn(`  WARN: Directory not found: ${fullDir}`);
      continue;
    }

    const walk = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory() && recursive) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html') {
          files.push({ path: fullPath, lang });
        }
      }
    };

    walk(fullDir);
  }

  return files;
}

// ============================================================
// Deduplication: Load existing hashes
// ============================================================

function loadExistingHashes() {
  const hashes = new Set();
  if (!fs.existsSync(MINED_DIR)) return hashes;

  const files = fs.readdirSync(MINED_DIR).filter(f => f.endsWith('.jsonl'));
  for (const file of files) {
    // Skip our own output file to allow re-runs
    if (file === 'website-conditions-v2.jsonl') continue;

    const filePath = path.join(MINED_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        const msgs = item.messages || [];
        const userMsg = msgs.find(m => m.role === 'user');
        const assistantMsg = msgs.find(m => m.role === 'assistant');
        if (userMsg && assistantMsg) {
          hashes.add(contentHash(userMsg.content, assistantMsg.content));
        }
      } catch { /* skip malformed lines */ }
    }
  }

  return hashes;
}

// ============================================================
// Main Processing
// ============================================================

function processFile(filePath, lang) {
  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  // Skip redirect stubs
  if (isRedirectStub(html)) return [];

  // Detect language from HTML if available, fall back to directory-based
  const detectedLang = detectLanguage(html);
  const effectiveLang = detectedLang || lang;

  const title = extractTitle(html);
  if (!title) return [];

  const condition = extractConditionName(title) || title;

  const examples = [];

  // Extract all 5 task types
  examples.push(...extractPatientEducation(html, condition, effectiveLang));
  examples.push(...extractRedFlags(html, condition, effectiveLang));
  examples.push(...extractFAQs(html, condition, effectiveLang));
  examples.push(...extractClinicalSummaries(html, condition, effectiveLang));
  examples.push(...extractDifferentialDiagnosis(html, condition, effectiveLang));

  return examples;
}

function main() {
  console.log('=== Website Training Data Extractor v2 ===\n');

  // Step 1: Find all HTML files
  console.log(`Scanning: ${WEBSITE_DIR}`);
  const htmlFiles = findHtmlFiles(WEBSITE_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  // Step 2: Load existing hashes for dedup
  console.log('Loading existing hashes for deduplication...');
  const existingHashes = loadExistingHashes();
  console.log(`  ${existingHashes.size} existing hashes loaded\n`);

  // Step 3: Process all files
  const stats = {
    filesProcessed: 0,
    filesSkipped: 0,
    totalExtracted: 0,
    duplicatesSkipped: 0,
    tooShort: 0,
    byTaskType: {},
    byLang: {},
    bySource: {},
  };

  const allExamples = [];
  const newHashes = new Set();

  for (const file of htmlFiles) {
    const examples = processFile(file.path, file.lang);

    if (examples.length === 0) {
      stats.filesSkipped++;
      continue;
    }

    stats.filesProcessed++;

    for (const ex of examples) {
      const userMsg = ex.messages.find(m => m.role === 'user');
      const assistantMsg = ex.messages.find(m => m.role === 'assistant');

      // Length check
      if (assistantMsg.content.length < MIN_ASSISTANT_LEN) {
        stats.tooShort++;
        continue;
      }

      // Dedup check
      const hash = contentHash(userMsg.content, assistantMsg.content);
      if (existingHashes.has(hash) || newHashes.has(hash)) {
        stats.duplicatesSkipped++;
        continue;
      }

      newHashes.add(hash);
      allExamples.push(ex);
      stats.totalExtracted++;

      // Track stats
      const taskType = ex.metadata.task_type;
      const lang = ex.metadata.lang;
      const source = ex.metadata.source;
      stats.byTaskType[taskType] = (stats.byTaskType[taskType] || 0) + 1;
      stats.byLang[lang] = (stats.byLang[lang] || 0) + 1;
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    }
  }

  // Step 4: Write output
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  const outputLines = allExamples.map(ex => JSON.stringify(ex, null, 0));
  fs.writeFileSync(OUTPUT_FILE, outputLines.join('\n') + '\n', 'utf8');

  // Step 5: Print stats
  console.log('=== Results ===\n');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files skipped (no content/redirect): ${stats.filesSkipped}`);
  console.log(`Total examples extracted: ${stats.totalExtracted}`);
  console.log(`Duplicates skipped: ${stats.duplicatesSkipped}`);
  console.log(`Too short (< ${MIN_ASSISTANT_LEN} chars): ${stats.tooShort}`);

  console.log('\n--- By Task Type ---');
  for (const [type, count] of Object.entries(stats.byTaskType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\n--- By Language ---');
  for (const [lang, count] of Object.entries(stats.byLang).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${lang}: ${count}`);
  }

  console.log('\n--- By Source ---');
  for (const [source, count] of Object.entries(stats.bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source}: ${count}`);
  }

  console.log(`\nOutput: ${OUTPUT_FILE}`);
  console.log(`Lines: ${allExamples.length}`);

  // Step 6: Spot-check samples
  console.log('\n=== Sample Examples ===\n');
  const sampleIdxs = [0, Math.floor(allExamples.length / 4), Math.floor(allExamples.length / 2)];
  for (const idx of sampleIdxs) {
    if (idx >= allExamples.length) continue;
    const ex = allExamples[idx];
    console.log(`[${idx}] ${ex.metadata.task_type} | ${ex.metadata.lang} | ${ex.metadata.condition}`);
    console.log(`  User: ${ex.messages[1].content.substring(0, 80)}...`);
    console.log(`  Assistant: ${ex.messages[2].content.substring(0, 120)}...`);
    console.log();
  }
}

main();
