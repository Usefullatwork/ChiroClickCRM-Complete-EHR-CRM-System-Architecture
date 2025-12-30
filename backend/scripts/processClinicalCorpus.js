#!/usr/bin/env node
/**
 * Process Clinical Corpus Script
 * Parse Norwegian clinical notes corpus and generate:
 * 1. Template SQL seed file
 * 2. Training examples for AI
 * 3. Statistics and analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import corpusParser from '../src/services/clinicalCorpusParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CORPUS_FILE = process.argv[2] || path.join(__dirname, '../data/norwegian_clinical_corpus.txt');
const OUTPUT_DIR = path.join(__dirname, '../data/corpus_output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Main processing function
 */
async function processCorpus() {
  console.log('🏥 ChiroClick Clinical Corpus Processor\n');
  console.log(`Reading corpus from: ${CORPUS_FILE}`);

  // Read corpus file
  if (!fs.existsSync(CORPUS_FILE)) {
    console.error(`❌ Error: Corpus file not found: ${CORPUS_FILE}`);
    console.log('\nUsage: node processClinic alCorpus.js [corpus-file-path]');
    process.exit(1);
  }

  const corpusText = fs.readFileSync(CORPUS_FILE, 'utf-8');
  console.log(`📄 Corpus size: ${(corpusText.length / 1024).toFixed(2)} KB\n`);

  // Step 1: Parse corpus
  console.log('🔍 Step 1: Parsing clinical notes...');
  const parsedCorpus = corpusParser.parseCorpus(corpusText);
  console.log(`✅ Parsed ${parsedCorpus.totalNotes} clinical notes`);
  console.log(`   Statistics:`, parsedCorpus.statistics);

  // Save parsed corpus
  const parsedFile = path.join(OUTPUT_DIR, 'parsed_corpus.json');
  fs.writeFileSync(parsedFile, JSON.stringify(parsedCorpus, null, 2));
  console.log(`   Saved to: ${parsedFile}\n`);

  // Step 2: Extract templates
  console.log('📝 Step 2: Extracting clinical templates...');
  const templates = corpusParser.extractTemplates(parsedCorpus);
  console.log(`✅ Extracted ${templates.length} unique templates`);

  // Save templates JSON
  const templatesFile = path.join(OUTPUT_DIR, 'extracted_templates.json');
  fs.writeFileSync(templatesFile, JSON.stringify(templates, null, 2));
  console.log(`   Saved to: ${templatesFile}`);

  // Generate SQL seed file
  const sqlSeed = corpusParser.generateTemplateSeedSQL(templates);
  const sqlFile = path.join(OUTPUT_DIR, 'corpus_templates.sql');
  fs.writeFileSync(sqlFile, sqlSeed);
  console.log(`   SQL seed file: ${sqlFile}\n`);

  // Step 3: Create training examples
  console.log('🎯 Step 3: Creating AI training examples...');
  const trainingExamples = corpusParser.createTrainingExamples(parsedCorpus);
  console.log(`✅ Created ${trainingExamples.length} training examples`);

  // Save training examples (JSONL format for Ollama)
  const trainFile = path.join(OUTPUT_DIR, 'training_examples.jsonl');
  const jsonlContent = trainingExamples.map(ex => JSON.stringify(ex)).join('\n');
  fs.writeFileSync(trainFile, jsonlContent);
  console.log(`   Saved to: ${trainFile}`);

  // Save training examples (JSON for inspection)
  const trainJsonFile = path.join(OUTPUT_DIR, 'training_examples.json');
  fs.writeFileSync(trainJsonFile, JSON.stringify(trainingExamples.slice(0, 50), null, 2)); // Sample
  console.log(`   Sample JSON: ${trainJsonFile}\n`);

  // Step 4: Generate analysis report
  console.log('📊 Step 4: Generating analysis report...');
  const report = generateAnalysisReport(parsedCorpus, templates, trainingExamples);
  const reportFile = path.join(OUTPUT_DIR, 'corpus_analysis_report.md');
  fs.writeFileSync(reportFile, report);
  console.log(`✅ Analysis report: ${reportFile}\n`);

  // Summary
  console.log('🎉 Processing complete!\n');
  console.log('Summary:');
  console.log(`  • Clinical notes parsed: ${parsedCorpus.totalNotes}`);
  console.log(`  • Templates extracted: ${templates.length}`);
  console.log(`  • Training examples: ${trainingExamples.length}`);
  console.log(`  • Output directory: ${OUTPUT_DIR}\n`);

  console.log('Next steps:');
  console.log('  1. Review the analysis report');
  console.log('  2. Run SQL seed file to populate templates:');
  console.log(`     psql -d chiroclick -f ${sqlFile}`);
  console.log('  3. Use training examples for AI model fine-tuning');
}

/**
 * Generate markdown analysis report
 */
function generateAnalysisReport(parsedCorpus, templates, trainingExamples) {
  const { statistics } = parsedCorpus;

  let report = `# Clinical Corpus Analysis Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += `## Overview\n\n`;
  report += `- **Total Clinical Notes**: ${parsedCorpus.totalNotes}\n`;
  report += `- **Total Sections Extracted**: ${statistics.totalSections}\n`;
  report += `- **Templates Extracted**: ${templates.length}\n`;
  report += `- **Training Examples Created**: ${trainingExamples.length}\n\n`;

  report += `## Note Type Distribution\n\n`;
  report += `| Note Type | Count | Percentage |\n`;
  report += `|-----------|-------|------------|\n`;
  Object.entries(statistics.noteTypes).forEach(([type, count]) => {
    const percentage = ((count / parsedCorpus.totalNotes) * 100).toFixed(1);
    report += `| ${type} | ${count} | ${percentage}% |\n`;
  });
  report += `\n`;

  report += `## Anatomical Region Coverage\n\n`;
  report += `| Region | Occurrences |\n`;
  report += `|--------|-------------|\n`;
  Object.entries(statistics.regions)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      report += `| ${region} | ${count} |\n`;
    });
  report += `\n`;

  report += `## Treatment Techniques Used\n\n`;
  report += `| Technique | Occurrences | Description |\n`;
  report += `|-----------|-------------|-------------|\n`;
  const techniqueDescriptions = {
    bvm: 'Bløtvevsbehandling/Myofascial Release',
    ims: 'Nålebehandling (IMS/Dry Needling)',
    hvla: 'Leddmobilisering (HVLA)',
    tgp: 'Triggerpunktbehandling',
    inhib: 'Inhibering',
    traksjon: 'Traksjon',
    mobilisering: 'Leddmobilisering',
    gapping: 'Gapping',
    got: 'General Osteopathic Treatment',
    met: 'Muscle Energy Technique',
    eswt: 'Trykkbølgebehandling',
    iastm: 'Instrument Assisted Soft Tissue Mobilization'
  };

  Object.entries(statistics.techniques)
    .sort((a, b) => b[1] - a[1])
    .forEach(([technique, count]) => {
      const desc = techniqueDescriptions[technique] || technique.toUpperCase();
      report += `| ${technique} | ${count} | ${desc} |\n`;
    });
  report += `\n`;

  report += `## Template Categories\n\n`;
  const templatesByCategory = {};
  templates.forEach(t => {
    templatesByCategory[t.category] = (templatesByCategory[t.category] || 0) + 1;
  });

  report += `| Category | Templates |\n`;
  report += `|----------|----------|\n`;
  Object.entries(templatesByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      report += `| ${category} | ${count} |\n`;
    });
  report += `\n`;

  report += `## Training Example Types\n\n`;
  const examplesByType = {};
  trainingExamples.forEach(ex => {
    const type = ex.metadata?.type || 'unknown';
    examplesByType[type] = (examplesByType[type] || 0) + 1;
  });

  report += `| Type | Count | Description |\n`;
  report += `|------|-------|-------------|\n`;
  const typeDescriptions = {
    anamnese_to_exam: 'Anamnese → Examination findings',
    findings_to_conclusion: 'Findings → Clinical conclusion',
    full_note: 'Complete SOAP note generation',
    technique_documentation: 'Treatment technique documentation'
  };

  Object.entries(examplesByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const desc = typeDescriptions[type] || type;
      report += `| ${type} | ${count} | ${desc} |\n`;
    });
  report += `\n`;

  report += `## Sample Templates\n\n`;
  templates.slice(0, 5).forEach((template, index) => {
    report += `### ${index + 1}. ${template.category} - ${template.subcategory}\n\n`;
    report += `**SOAP Section**: ${template.soap_section}\n\n`;
    report += `\`\`\`\n${template.template_text.substring(0, 300)}${template.template_text.length > 300 ? '...' : ''}\n\`\`\`\n\n`;
  });

  report += `## Sample Training Examples\n\n`;
  trainingExamples.slice(0, 3).forEach((example, index) => {
    report += `### Example ${index + 1}: ${example.metadata?.type || 'Unknown'}\n\n`;
    report += `**Prompt**:\n\`\`\`\n${example.prompt.substring(0, 200)}${example.prompt.length > 200 ? '...' : ''}\n\`\`\`\n\n`;
    report += `**Response**:\n\`\`\`\n${example.response.substring(0, 200)}${example.response.length > 200 ? '...' : ''}\n\`\`\`\n\n`;
  });

  report += `## Recommendations\n\n`;
  report += `### For Template System\n`;
  report += `- Import ${templates.length} extracted templates into database\n`;
  report += `- Templates cover ${Object.keys(templatesByCategory).length} anatomical categories\n`;
  report += `- Consider organizing by SOAP section for easy access\n\n`;

  report += `### For AI Training\n`;
  report += `- ${trainingExamples.length} examples ready for model fine-tuning\n`;
  report += `- Examples cover multiple clinical reasoning pathways\n`;
  report += `- Recommended: Anonymize before training (GDPR compliance)\n`;
  report += `- Use with existing Ollama training pipeline\n\n`;

  report += `### Clinical Insights\n`;
  const topRegion = Object.entries(statistics.regions).sort((a, b) => b[1] - a[1])[0];
  const topTechnique = Object.entries(statistics.techniques).sort((a, b) => b[1] - a[1])[0];

  report += `- Most documented region: **${topRegion[0]}** (${topRegion[1]} occurrences)\n`;
  report += `- Most common technique: **${topTechnique[0]}** (${topTechnique[1]} occurrences)\n`;
  report += `- Average sections per note: ${(statistics.totalSections / parsedCorpus.totalNotes).toFixed(1)}\n`;

  return report;
}

// Run the processor
processCorpus().catch(error => {
  console.error('\n❌ Error processing corpus:', error);
  process.exit(1);
});
