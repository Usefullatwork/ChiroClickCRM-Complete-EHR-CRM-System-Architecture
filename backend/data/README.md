# Clinical Corpus & AI Training System

This directory contains the Norwegian clinical notes corpus and tools for extracting templates and creating AI training data for the ChiroClick CRM system.

## Overview

The clinical corpus system provides:

1. **Template Extraction**: Automatically extract reusable clinical templates from real practice notes
2. **AI Training Data**: Generate structured training examples for fine-tuning AI models
3. **Pattern Analysis**: Analyze common documentation patterns and clinical workflows
4. **GDPR Compliance**: Anonymization support for training data

## Directory Structure

```
backend/data/
├── norwegian_clinical_corpus.txt    # Raw clinical notes corpus
├── corpus_output/                   # Generated output files
│   ├── parsed_corpus.json          # Parsed clinical notes with metadata
│   ├── extracted_templates.json    # Extracted templates
│   ├── corpus_templates.sql        # SQL seed file for templates
│   ├── training_examples.jsonl     # Training data (JSONL format)
│   ├── training_examples.json      # Training data samples (JSON)
│   └── corpus_analysis_report.md   # Comprehensive analysis report
└── README.md                        # This file
```

## Quick Start

### 1. Process Your Clinical Corpus

```bash
# From backend directory
node scripts/processClinicalCorpus.js [corpus-file-path]

# Default (uses data/norwegian_clinical_corpus.txt)
node scripts/processClinicalCorpus.js
```

### 2. Review the Analysis Report

Open `corpus_output/corpus_analysis_report.md` to see:
- Note type distribution
- Anatomical region coverage
- Treatment technique statistics
- Template categories
- Training example types
- Sample templates and examples

### 3. Import Templates to Database

```bash
# Import extracted templates
psql -d chiroclick -f data/corpus_output/corpus_templates.sql
```

### 4. Use Training Data with AI Pipeline

The generated training data is compatible with the existing Ollama training pipeline:

```javascript
import ollamaTraining from './src/services/ollamaTraining.js';

// Training examples are in JSONL format, ready to use
await ollamaTraining.createTrainingDataset();
await ollamaTraining.trainModel('chiroclick-clinical-v1');
```

## Corpus Format

The clinical notes corpus should follow this structure:

```
Journalnotat: [Note Title]
Dato: DD.MM.YYYY
Anamnese: [Patient history and chief complaints]
Undersøkelse: [Examination findings]
Behandling: [Treatment performed]
Konklusjon: [Clinical conclusion]
```

### Supported Sections

- **Anamnese**: Patient history (subjective)
- **Undersøkelse**: Physical examination (objective)
  - Cervical, Lumbal, Skulder, Hofte, etc.
  - Observasjon, Palpasjon, ROM, Reflekser, etc.
- **Behandling**: Treatment performed (plan)
- **Konklusjon**: Clinical conclusion (assessment)

### Recognized Treatment Techniques

The parser automatically recognizes:

- `bvm` - Bløtvevsbehandling/Myofascial Release
- `ims` - Nålebehandling (IMS/Dry Needling)
- `hvla` - Leddmobilisering (HVLA)
- `tgp` - Triggerpunktbehandling
- `inhib` - Inhibering
- `traksjon` - Traksjon
- `mobilisering` - Leddmobilisering
- `gapping` - Gapping
- `got` - General Osteopathic Treatment
- `met` - Muscle Energy Technique
- `eswt` - Trykkbølgebehandling
- `iastm` - Instrument Assisted Soft Tissue Mobilization

## Generated Outputs

### 1. Templates (SQL)

Templates are extracted and formatted for database import:

```sql
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (...)
```

### 2. Training Examples (JSONL)

Training examples are formatted for AI model fine-tuning:

```json
{
  "prompt": "Basert på følgende anamnese, hva ville du forvente å finne ved undersøkelse?\n\nAnamnese: ...",
  "response": "Undersøkelse: ...",
  "metadata": {
    "type": "anamnese_to_exam",
    "regions": ["cervical", "thoracal"],
    "noteId": "note_1"
  }
}
```

#### Training Example Types

1. **anamnese_to_exam**: Anamnesis → Examination predictions
2. **findings_to_conclusion**: Findings → Clinical conclusions
3. **full_note**: Complete SOAP note generation
4. **technique_documentation**: Treatment technique documentation

### 3. Analysis Report (Markdown)

Comprehensive report including:
- Statistical overview
- Distribution charts
- Sample templates
- Sample training examples
- Clinical insights
- Recommendations

## Integration with Existing Systems

### With Clinical Templates System

Templates are automatically categorized for the template picker:

```javascript
// In ClinicalEncounter component
import { getAllTemplates } from './api/templates';

// Templates from corpus are available alongside system templates
const templates = await getAllTemplates({
  category: 'Cervical',
  soapSection: 'objective',
  language: 'NO'
});
```

### With AI Training Pipeline

Use with the existing Ollama training system:

```bash
# 1. Process corpus
node scripts/processClinicalCorpus.js

# 2. Copy training data to training pipeline
cp data/corpus_output/training_examples.jsonl training_data/

# 3. Run AI training
node scripts/trainAI.js
```

### With Anonymization Service

Before using for AI training, anonymize the data:

```javascript
import trainingAnonymization from './src/services/trainingAnonymization.js';
import fs from 'fs';

// Read training examples
const examples = JSON.parse(fs.readFileSync('data/corpus_output/training_examples.json'));

// Anonymize (GDPR compliance)
const anonymized = examples.map(ex => ({
  ...ex,
  prompt: trainingAnonymization.anonymizeSOAPNote(ex.prompt, { aggressive: true }),
  response: trainingAnonymization.anonymizeSOAPNote(ex.response, { aggressive: true })
}));

// Validate anonymization
anonymized.forEach(ex => {
  const validation = trainingAnonymization.validateAnonymization(ex.prompt + ex.response);
  if (!validation.isClean) {
    console.warn('Potential PII found:', validation.warnings);
  }
});
```

## Advanced Usage

### Custom Corpus Processing

You can programmatically use the parser:

```javascript
import corpusParser from './src/services/clinicalCorpusParser.js';
import fs from 'fs';

// Parse a single note
const note = corpusParser.parseClinicalNote(noteText);
console.log(note.regions); // ['cervical', 'thoracal']
console.log(note.techniques); // ['bvm', 'hvla', 'ims']
console.log(note.sections); // { anamnese: '...', behandling: '...' }

// Parse entire corpus
const corpus = corpusParser.parseCorpus(corpusText);
console.log(corpus.statistics);

// Extract templates
const templates = corpusParser.extractTemplates(corpus);

// Create training examples
const trainingExamples = corpusParser.createTrainingExamples(corpus);

// Generate SQL
const sql = corpusParser.generateTemplateSeedSQL(templates);
fs.writeFileSync('custom_templates.sql', sql);
```

### Custom Template Extraction

Filter templates by criteria:

```javascript
// Extract only examination templates
const examTemplates = templates.filter(t =>
  t.soap_section === 'objective' && t.category.includes('undersøkelse')
);

// Extract templates for specific region
const cervicalTemplates = templates.filter(t =>
  t.category === 'Cervical'
);

// Extract treatment technique templates
const treatmentTemplates = templates.filter(t =>
  t.subcategory === 'Behandling'
);
```

### Expand Your Corpus

To add more clinical notes to the corpus:

1. **Format your notes** following the journalnotat structure
2. **Append to corpus file**: `cat new_notes.txt >> norwegian_clinical_corpus.txt`
3. **Reprocess**: `node scripts/processClinicalCorpus.js`
4. **Review new templates** in the analysis report
5. **Import to database** if satisfied

## Best Practices

### For Template Extraction

- ✅ Use real clinical notes from your practice
- ✅ Include diverse case types and regions
- ✅ Maintain consistent formatting
- ✅ Review extracted templates before importing
- ❌ Don't include patient-identifiable information
- ❌ Don't include incomplete or draft notes

### For AI Training

- ✅ Always anonymize data before training
- ✅ Validate anonymization with `validateAnonymization()`
- ✅ Include diverse clinical scenarios
- ✅ Use both positive and negative findings
- ✅ Balance example types (anamnese, exam, treatment, conclusion)
- ❌ Don't train on data with remaining PII
- ❌ Don't use only one type of clinical scenario

### For GDPR Compliance

- ✅ Anonymize all personal data (names, IDs, addresses)
- ✅ Remove or generalize dates
- ✅ Remove or generalize ages to ranges
- ✅ Use aggressive mode for production training
- ✅ Validate anonymization before sharing
- ❌ Don't store unanonymized corpus in cloud storage
- ❌ Don't share raw corpus with third parties

## Corpus Statistics

Based on the current corpus:

- **16 clinical notes** parsed
- **49 sections** extracted
- **18 templates** generated
- **23 training examples** created
- **8 anatomical regions** covered
- **8 treatment techniques** documented

### Coverage

- Most documented region: **Cervical (75% of notes)**
- Most common technique: **BVM (75% of notes)**
- Average sections per note: **3.1**

## Troubleshooting

### Issue: Parser not recognizing sections

**Solution**: Ensure section headers match expected patterns:
```
Anamnese:  (with colon)
Undersøkelse:
Behandling:
Konklusjon:
```

### Issue: No templates extracted

**Solution**:
- Check that notes have multiple sections
- Ensure text is not too short (min 20 chars) or too long (max 2000 chars)
- Verify corpus file encoding is UTF-8

### Issue: Training examples seem repetitive

**Solution**:
- Add more diverse clinical notes to corpus
- Include different case types and presentations
- Ensure variety in treatment approaches

### Issue: Anonymization warnings

**Solution**:
```javascript
// Use aggressive mode
const anonymized = trainingAnonymization.anonymizeSOAPNote(text, {
  aggressive: true,
  preserveDates: false
});

// Validate
const validation = trainingAnonymization.validateAnonymization(anonymized);
if (!validation.isClean) {
  // Manually review and fix
  console.log('Warnings:', validation.warnings);
}
```

## Future Enhancements

Planned features:

- [ ] Multi-language support (English clinical notes)
- [ ] Advanced pattern recognition (ICD/ICPC codes)
- [ ] Automatic diagnosis suggestion learning
- [ ] Treatment outcome correlation
- [ ] Real-time template suggestions in UI
- [ ] Automatic corpus expansion from live encounters
- [ ] Quality scoring for templates
- [ ] Version control for template evolution

## References

- [Clinical Templates Migration](../../migrations/008_clinical_templates.sql)
- [Norwegian Clinical Templates](../../seeds/norwegian_clinical_templates.sql)
- [Ollama Training Service](../../src/services/ollamaTraining.js)
- [Anonymization Service](../../src/services/trainingAnonymization.js)
- [AI Service](../../src/services/ai.js)

## Support

For issues or questions:
1. Check the analysis report for insights
2. Review the troubleshooting section
3. Check existing templates in database
4. Consult the AI training pipeline documentation
5. Contact the development team

## License

Proprietary - ChiroClick CRM System
