/**
 * Training Data Preparation Script
 *
 * Converts extracted clinical documentation into formats suitable for:
 * 1. JSONL format for fine-tuning (OpenAI, Llama, etc.)
 * 2. Ollama Modelfile with embedded system prompt
 * 3. RAG-ready chunks for vector databases
 *
 * Usage: node scripts/prepare-training-data.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  inputDir: 'D:\\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\\training-data-extracted',
  outputDir: 'D:\\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\\ai-training',
  ollamaModelName: 'chiro-no'
};

// Statistics
const stats = {
  filesProcessed: 0,
  trainingPairs: 0,
  totalChars: 0,
  categories: {}
};

/**
 * Read all extracted text files
 */
async function readExtractedFiles() {
  const files = [];

  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.name.endsWith('.txt') && !entry.name.includes('README')) {
        const content = await fs.readFile(fullPath, 'utf8');
        // Remove the header added during extraction
        const cleanContent = content.replace(/^={80}\nSOURCE:.*\nEXTRACTED:.*\nCHARACTERS:.*\n={80}\n\n/s, '');

        files.push({
          path: fullPath,
          name: entry.name,
          content: cleanContent,
          category: categorizeFile(entry.name, fullPath)
        });
      }
    }
  }

  await scanDir(CONFIG.inputDir);
  return files;
}

/**
 * Categorize file based on name and path
 */
function categorizeFile(name, fullPath) {
  const nameLower = name.toLowerCase();
  const pathLower = fullPath.toLowerCase();

  if (pathLower.includes('vng') || nameLower.includes('vestibul') || nameLower.includes('svimmel') || nameLower.includes('nystagmus')) {
    return 'vestibular';
  }
  if (nameLower.includes('sope') || nameLower.includes('soap') || nameLower.includes('analyse')) {
    return 'soap_templates';
  }
  if (nameLower.includes('undersøkelse') || nameLower.includes('undersokelse')) {
    return 'examination';
  }
  if (nameLower.includes('kiropraktor') || nameLower.includes('bh') || nameLower.includes('ny -')) {
    return 'clinical_cases';
  }
  if (nameLower.includes('fraser') || nameLower.includes('gemini')) {
    return 'phrases';
  }
  return 'general';
}

/**
 * Extract SOAP sections from clinical text
 */
function extractSOAPSections(text) {
  const sections = {
    subjective: [],
    objective: [],
    assessment: [],
    plan: []
  };

  // Common Norwegian SOAP section markers
  const sectionMarkers = {
    subjective: ['Anamnese', 'Subjective', 'Sykehistorie', 'Hovedklage', 'Pasienten presenterer', 'Pasienten rapporterer'],
    objective: ['Undersøkelse', 'Objective', 'Observasjon', 'Palpasjon', 'ROM', 'Tester'],
    assessment: ['Behandling', 'Assessment', 'Vurdering', 'Diagnose', 'Klinisk'],
    plan: ['Konklusjon', 'Plan', 'Oppfølging', 'Videre', 'Øvelser', 'Råd']
  };

  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);

  for (const para of paragraphs) {
    for (const [section, markers] of Object.entries(sectionMarkers)) {
      if (markers.some(m => para.toLowerCase().includes(m.toLowerCase()))) {
        sections[section].push(para.trim());
        break;
      }
    }
  }

  return sections;
}

/**
 * Generate training pairs from content
 */
function generateTrainingPairs(files) {
  const pairs = [];

  // System prompts for different tasks
  const systemPrompts = {
    subjective: 'Du er en klinisk dokumentasjonsassistent for kiropraktorer. Generer profesjonell subjektiv dokumentasjon basert på pasientinformasjon.',
    objective: 'Du er en klinisk dokumentasjonsassistent for kiropraktorer. Generer profesjonell objektiv dokumentasjon basert på undersøkelsesfunn.',
    assessment: 'Du er en klinisk dokumentasjonsassistent for kiropraktorer. Generer profesjonell vurdering med diagnose og klinisk resonnement.',
    plan: 'Du er en klinisk dokumentasjonsassistent for kiropraktorer. Generer profesjonell behandlingsplan med øvelser og oppfølging.',
    vestibular: 'Du er en klinisk dokumentasjonsassistent spesialisert på vestibulær vurdering. Generer profesjonell VNG-dokumentasjon.',
    general: 'Du er en klinisk dokumentasjonsassistent for kiropraktorer i Norge. Generer profesjonell klinisk dokumentasjon på norsk.'
  };

  for (const file of files) {
    stats.filesProcessed++;
    stats.totalChars += file.content.length;
    stats.categories[file.category] = (stats.categories[file.category] || 0) + 1;

    // Extract SOAP sections
    const sections = extractSOAPSections(file.content);

    // Generate pairs from SOAP sections
    for (const [sectionName, contents] of Object.entries(sections)) {
      for (const content of contents) {
        if (content.length > 50 && content.length < 5000) {
          // Create instruction-following pair
          pairs.push({
            system: systemPrompts[sectionName] || systemPrompts.general,
            instruction: getInstructionForSection(sectionName),
            input: extractContext(content),
            output: content
          });
          stats.trainingPairs++;
        }
      }
    }

    // Generate phrase completion pairs from phrase files
    if (file.category === 'phrases' || file.category === 'soap_templates') {
      const phrasePairs = extractPhrasePairs(file.content);
      pairs.push(...phrasePairs);
      stats.trainingPairs += phrasePairs.length;
    }

    // Generate case-based pairs from clinical cases
    if (file.category === 'clinical_cases') {
      const casePairs = extractCasePairs(file.content);
      pairs.push(...casePairs);
      stats.trainingPairs += casePairs.length;
    }
  }

  return pairs;
}

/**
 * Get instruction for SOAP section
 */
function getInstructionForSection(section) {
  const instructions = {
    subjective: 'Skriv den subjektive delen av et SOPE-notat for en pasient med følgende informasjon:',
    objective: 'Skriv den objektive delen av et SOPE-notat basert på følgende undersøkelsesfunn:',
    assessment: 'Skriv vurderingsdelen av et SOPE-notat med diagnose og klinisk resonnement:',
    plan: 'Skriv plandelen av et SOPE-notat med behandling og oppfølging:'
  };
  return instructions[section] || 'Generer klinisk dokumentasjon:';
}

/**
 * Extract context from content (first few words as prompt)
 */
function extractContext(content) {
  // Extract key terms as context
  const keyTerms = [];

  if (content.includes('nakke')) keyTerms.push('nakkesmerter');
  if (content.includes('rygg') || content.includes('lumbal')) keyTerms.push('ryggsmerter');
  if (content.includes('skulder')) keyTerms.push('skuldersmerter');
  if (content.includes('hofte')) keyTerms.push('hoftesmerter');
  if (content.includes('svimmel') || content.includes('vertigo')) keyTerms.push('svimmelhet');
  if (content.includes('hodepine')) keyTerms.push('hodepine');

  if (keyTerms.length > 0) {
    return `Pasient med ${keyTerms.join(', ')}`;
  }

  // Return first sentence as context
  const firstSentence = content.split(/[.!?]/)[0];
  return firstSentence.length > 10 ? firstSentence.substring(0, 100) : 'Pasient presenterer seg med plager';
}

/**
 * Extract phrase pairs from phrase template files
 */
function extractPhrasePairs(content) {
  const pairs = [];
  const lines = content.split('\n').filter(l => l.trim().length > 10);

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();

    // Look for template patterns with placeholders
    if (line.includes('[') && line.includes(']')) {
      pairs.push({
        system: 'Du er en klinisk dokumentasjonsassistent. Fullfør den kliniske frasen.',
        instruction: 'Fullfør følgende kliniske frase:',
        input: line.replace(/\[.*?\]/g, '___'),
        output: line
      });
    }

    // Look for category headers followed by examples
    if (line.endsWith(':') && lines[i + 1] && !lines[i + 1].endsWith(':')) {
      const category = line.replace(':', '');
      const example = lines[i + 1].trim();

      if (example.length > 20) {
        pairs.push({
          system: 'Du er en klinisk dokumentasjonsassistent for kiropraktorer.',
          instruction: `Skriv et eksempel på ${category.toLowerCase()}:`,
          input: '',
          output: example
        });
      }
    }
  }

  return pairs;
}

/**
 * Extract case-based pairs from clinical case files
 */
function extractCasePairs(content) {
  const pairs = [];

  // Split by common case delimiters
  const cases = content.split(/(?=Ny pasient|Konsultasjon|Dato:|Journal)/i);

  for (const caseText of cases) {
    if (caseText.length > 200 && caseText.length < 10000) {
      // Extract chief complaint if present
      const ccMatch = caseText.match(/(?:hovedklage|presenterer seg med|kommer inn med)[:\s]*([^.]+)/i);
      const chiefComplaint = ccMatch ? ccMatch[1].trim() : 'kliniske plager';

      pairs.push({
        system: 'Du er en klinisk dokumentasjonsassistent for kiropraktorer i Norge. Generer fullstendig SOPE-notat.',
        instruction: 'Skriv et fullstendig SOPE-notat for følgende pasient:',
        input: `Pasient med ${chiefComplaint}`,
        output: caseText.trim().substring(0, 4000) // Limit length
      });
    }
  }

  return pairs;
}

/**
 * Generate JSONL file for fine-tuning
 */
async function generateJSONL(pairs, outputPath) {
  const lines = pairs.map(pair => {
    // OpenAI/Llama chat format
    return JSON.stringify({
      messages: [
        { role: 'system', content: pair.system },
        { role: 'user', content: pair.instruction + (pair.input ? `\n\n${pair.input}` : '') },
        { role: 'assistant', content: pair.output }
      ]
    });
  });

  await fs.writeFile(outputPath, lines.join('\n'), 'utf8');
  console.log(`  ✓ Generated JSONL: ${outputPath} (${lines.length} examples)`);
}

/**
 * Generate Alpaca format for Llama fine-tuning
 */
async function generateAlpacaFormat(pairs, outputPath) {
  const data = pairs.map(pair => ({
    instruction: pair.instruction,
    input: pair.input,
    output: pair.output
  }));

  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓ Generated Alpaca format: ${outputPath}`);
}

/**
 * Generate Ollama Modelfile with embedded knowledge
 */
async function generateOllamaModelfile(pairs, outputPath) {
  // Collect key phrases and templates
  const knowledgeBase = [];

  // Add SOAP templates
  knowledgeBase.push(`
## SOPE/SOAP Dokumentasjonsstruktur

### Subjektiv (S) - Anamnese
- Pasienten presenterer seg med [hovedklage]
- Symptomene startet [tidspunkt] og har vart i [varighet]
- Smertene beskrives som [kvalitet]: stikkende, verkende, brennende, murrende
- Forverrende faktorer: sitting, stående, løfting, bøying
- Lindrende faktorer: hvile, bevegelse, varme, kulde
- VAS smerteskala: [0-10]

### Objektiv (O) - Undersøkelse
- Observasjon: holdning, gangmønster, muskeltonus
- Palpasjon: ømhet, triggerpunkter, temperatur
- ROM: fleksjon, ekstensjon, rotasjon, lateralfleksjon
- Ortopediske tester: Spurling, Kemp, Lasegue, Faber, etc.
- Nevrologiske funn: reflekser, sensibilitet, kraft

### Vurdering (A) - Assessment
- Klinisk diagnose med ICPC-2 kode
- Differensialdiagnoser vurdert
- Røde flagg vurdert og ekskludert
- Prognose: god, moderat, forbeholden

### Plan (P) - Behandling og oppfølging
- Behandling utført: leddmobilisering, myofascial release, triggerpunktbehandling
- Hjemmeøvelser instruert
- Ergonomiske råd gitt
- Oppfølging planlagt
`);

  // Add VNG/vestibular templates
  knowledgeBase.push(`
## Vestibulær Vurdering (VNG)

### Tester inkludert:
- Spontan nystagmus: tilstede/fraværende, retning
- Blikktest lys/mørke: senter, venstre, høyre, opp, ned
- Stillingstest: hode høyre/venstre, bøy, len
- Smooth pursuit: horisontal, vertikal
- Sakkader: prosakkade, antisakkade (latens, hastighet, nøyaktighet)
- OPK: optokinetisk respons
- VOR/HIT: vestibulo-okulær refleks, hodeimpulstest
- Dix-Hallpike: BPPV-vurdering

### Cerebellum-tester:
- Romberg 7-steg
- Ettbeinstående balanse
- Finger til nese
- Raske vekslende bevegelser
- Fingertrykking
- Dobbeltoppgave

### BPPV typer:
- Kanalolithiasis: symptomer < 30 sek, latens 2-30 sek, reversering
- Cupulolithiasis: vedvarende symptomer, ingen latens, ingen reversering
- Påvirkede bueganger: bakre, fremre, horisontal
`);

  // Add common treatment phrases
  knowledgeBase.push(`
## Vanlige behandlingsfraser

### Manuell terapi:
- Leddmobilisering (HVLA) utført på [segment], god respons
- Myofascial release (BVM) på [muskel], slipper godt
- Triggerpunktbehandling på [muskel], god twitching-reaksjon
- Artikulering av [ledd]
- Traksjon av [område]

### Nålebehandling (IMS):
- Nålebehandling utført på [muskel] bilateralt
- God lokal twitch-respons oppnådd
- Området desinfisert før behandling

### Øvelser:
- Instruert i McKenzie-øvelser
- Instruert i strekkøvelser for [muskelgruppe]
- Instruert i styrkeøvelser for [muskelgruppe]
- Instruert i balanseøvelser
- Instruert i vestibulære rehabiliteringsøvelser

### Råd:
- Ergonomiske råd gitt
- Unngå langvarig sitting
- Bruk lendestøtte
- Gå korte turer flere ganger daglig
- Varme/kulde etter behov
`);

  const modelfile = `# Ollama Modelfile for Norwegian Chiropractic Documentation AI
# Generated: ${new Date().toISOString()}
# Training examples: ${pairs.length}

FROM llama3.2

# Set parameters for clinical documentation
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER num_predict 500
PARAMETER stop "<|eot_id|>"
PARAMETER stop "<|end_of_text|>"

# Norwegian chiropractic clinical documentation system prompt
SYSTEM """Du er en klinisk dokumentasjonsassistent for kiropraktorer i Norge.

Din oppgave er å hjelpe med profesjonell klinisk dokumentasjon på norsk, inkludert:
- SOPE/SOAP-notater (Subjektiv, Objektiv, Plan/Evaluering)
- Vestibulær vurdering og VNG-dokumentasjon
- Henvisninger og sykemeldinger
- Kliniske fraser og maler

VIKTIGE RETNINGSLINJER:
1. Bruk alltid profesjonelt medisinsk språk
2. Vær presis og konsis
3. Inkluder relevante ICPC-2 diagnosekoder
4. Dokumenter alltid røde flagg-vurdering
5. Bruk standardiserte kliniske termer

${knowledgeBase.join('\n\n')}

Svar alltid på norsk med profesjonell klinisk dokumentasjon."""

# License notice
LICENSE """
This model is trained on Norwegian chiropractic clinical documentation.
For educational and clinical documentation assistance purposes only.
Not a substitute for professional clinical judgment.
"""
`;

  await fs.writeFile(outputPath, modelfile, 'utf8');
  console.log(`  ✓ Generated Ollama Modelfile: ${outputPath}`);
}

/**
 * Generate RAG-ready chunks
 */
async function generateRAGChunks(files, outputPath) {
  const chunks = [];
  const chunkSize = 500; // tokens approx

  for (const file of files) {
    const paragraphs = file.content.split(/\n\n+/).filter(p => p.trim().length > 50);

    for (const para of paragraphs) {
      if (para.length > 100 && para.length < 2000) {
        chunks.push({
          id: `${file.category}_${chunks.length}`,
          category: file.category,
          source: file.name,
          content: para.trim(),
          metadata: {
            charCount: para.length,
            hasSOAP: /anamnese|undersøkelse|behandling|konklusjon/i.test(para),
            hasVNG: /vng|vestibul|nystagmus|svimmel/i.test(para)
          }
        });
      }
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(chunks, null, 2), 'utf8');
  console.log(`  ✓ Generated RAG chunks: ${outputPath} (${chunks.length} chunks)`);
}

/**
 * Generate shell script to create Ollama model
 */
async function generateBuildScript(outputDir) {
  const script = `#!/bin/bash
# Build script for chiro-no Ollama model
# Run this script after generating the Modelfile

echo "Building chiro-no model for Ollama..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Error: Ollama is not running. Start it with 'ollama serve'"
    exit 1
fi

# Create the model
cd "${outputDir.replace(/\\/g, '/')}"
ollama create chiro-no -f Modelfile

echo ""
echo "Model created successfully!"
echo "Test it with: ollama run chiro-no"
echo ""
echo "Example prompts:"
echo "  - Skriv en subjektiv seksjon for en pasient med nakkesmerter"
echo "  - Generer et SOPE-notat for en pasient med korsryggsmerter"
echo "  - Dokumenter VNG-funn for en pasient med BPPV"
`;

  const batScript = `@echo off
REM Build script for chiro-no Ollama model
REM Run this script after generating the Modelfile

echo Building chiro-no model for Ollama...

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo Error: Ollama is not running. Start it with 'ollama serve'
    exit /b 1
)

REM Create the model
cd /d "${outputDir}"
ollama create chiro-no -f Modelfile

echo.
echo Model created successfully!
echo Test it with: ollama run chiro-no
echo.
echo Example prompts:
echo   - Skriv en subjektiv seksjon for en pasient med nakkesmerter
echo   - Generer et SOPE-notat for en pasient med korsryggsmerter
echo   - Dokumenter VNG-funn for en pasient med BPPV
`;

  await fs.writeFile(path.join(outputDir, 'build-model.sh'), script, 'utf8');
  await fs.writeFile(path.join(outputDir, 'build-model.bat'), batScript, 'utf8');
  console.log(`  ✓ Generated build scripts: build-model.sh, build-model.bat`);
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     AI Training Data Preparation                           ║');
  console.log('║     Norwegian Chiropractic Documentation                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Create output directory
  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  // Read extracted files
  console.log('Reading extracted training data...');
  const files = await readExtractedFiles();
  console.log(`Found ${files.length} text files\n`);

  // Generate training pairs
  console.log('Generating training pairs...');
  const pairs = generateTrainingPairs(files);
  console.log(`Generated ${pairs.length} training pairs\n`);

  // Generate output files
  console.log('Generating output files...');

  await generateJSONL(pairs, path.join(CONFIG.outputDir, 'training-data.jsonl'));
  await generateAlpacaFormat(pairs, path.join(CONFIG.outputDir, 'training-data-alpaca.json'));
  await generateOllamaModelfile(pairs, path.join(CONFIG.outputDir, 'Modelfile'));
  await generateRAGChunks(files, path.join(CONFIG.outputDir, 'rag-chunks.json'));
  await generateBuildScript(CONFIG.outputDir);

  // Generate summary
  const summary = {
    generated: new Date().toISOString(),
    statistics: {
      filesProcessed: stats.filesProcessed,
      trainingPairs: stats.trainingPairs,
      totalCharacters: stats.totalChars,
      categories: stats.categories
    },
    outputs: [
      'training-data.jsonl - OpenAI/Llama chat format',
      'training-data-alpaca.json - Alpaca instruction format',
      'Modelfile - Ollama model definition',
      'rag-chunks.json - RAG-ready document chunks',
      'build-model.bat - Windows build script',
      'build-model.sh - Linux/Mac build script'
    ],
    usage: {
      ollama: 'Run build-model.bat to create the chiro-no model',
      test: 'ollama run chiro-no "Skriv et SOPE-notat for en pasient med nakkesmerter"'
    }
  };

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'training-summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    PREPARATION COMPLETE                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`  Files processed:  ${stats.filesProcessed}`);
  console.log(`  Training pairs:   ${stats.trainingPairs}`);
  console.log(`  Total characters: ${(stats.totalChars / 1000000).toFixed(2)}M`);
  console.log('');
  console.log('Categories:');
  for (const [cat, count] of Object.entries(stats.categories)) {
    console.log(`  - ${cat}: ${count} files`);
  }
  console.log('');
  console.log(`Output directory: ${CONFIG.outputDir}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run: build-model.bat (Windows) or ./build-model.sh (Linux/Mac)');
  console.log('  2. Test: ollama run chiro-no');
  console.log('');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
