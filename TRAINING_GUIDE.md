# AI Training Guide - Kliniske Notater til Treningsdata

Dette dokumentet forklarer hvordan du bruker dine kliniske notater til å trene og forbedre AI-assistenten i ChiroClick CRM.

## 📋 Oversikt

Systemet konverterer ustrukturerte kliniske notater til strukturert treningsdata som kan brukes til:

1. **Fine-tuning av AI-modeller** (Ollama/Claude)
2. **Opprettelse av realistiske kliniske templates**
3. **Læring av kliniske mønstre**: Symptomer → Funn → Behandling → Utfall

## 🚀 Kom i gang

### Steg 1: Forbered dine kliniske notater

Opprett en tekstfil (`clinical_notes.txt`) med dine notater. Systemet gjenkjenner automatisk følgende struktur:

```
Pasient 1 (Korsrygg):
Anamnese: [Pasientens hovedplage og sykehistorie]

Undersøkelse:
- Inspeksjon: [Funn]
- ROM: [Funn]
- Palpasjon: [Funn]
- O/N: [Ortopediske/nevrologiske tester]

Behandling: Leddjustering [segmenter]. Trp [muskler]. Øvelser: [liste].

Konklusjon: [Diagnose og vurdering]

Oppfølging: [Status ved neste konsultasjon]
```

**Tips:**
- Du kan bruke norske forkortelser (Trp, bvm, ART, bilat., hø, ve, etc.)
- Systemet parser automatisk positive funn `(+)` og negative funn `(-)`
- Kategori-inndeling skjer automatisk basert på anatomisk region og nøkkelord

### Steg 2: Generer treningsdata

Kjør scriptet for å konvertere notatene:

```bash
cd backend
node src/scripts/generateTrainingData.js /path/to/clinical_notes.txt ./training_output
```

**Output:**
```
training_output/
├── training_data.json          # Strukturert data (alle cases)
├── training_data.jsonl         # JSONL format for fine-tuning
├── statistics.json             # Statistikk over datasettet
├── training_data_cervical.json # Cases per kategori
├── training_data_lumbar.json
├── training_data_pelvis.json
└── [flere kategorier...]
```

### Steg 3: Importer templates til databasen

De nye, realistiske templatesene ligger i:
```
backend/seeds/realistic_clinical_templates.sql
```

Kjør følgende for å importere:

```bash
psql -d chiroclick -f backend/seeds/realistic_clinical_templates.sql
```

**Eller via Docker:**
```bash
docker exec -i chiroclick-db psql -U postgres -d chiroclick < backend/seeds/realistic_clinical_templates.sql
```

### Steg 4: Fine-tune AI-modellen (Valgfritt)

#### Med Ollama (Lokal)

1. **Opprett en Modelfile:**
```bash
cat > Modelfile << EOF
FROM gemini-3-pro-preview:7b

# Systemmelding
SYSTEM """
Du er en erfaren kiropraktor i Norge. Du skal generere strukturerte kliniske notater basert på pasientens symptomer og funn.
Følg alltid SOAP-format (Subjektivt, Objektivt, Vurdering, Plan).
"""

# Treningsdata
ADAPTER ./training_output/training_data.jsonl

# Parametre
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
EOF
```

2. **Tren modellen:**
```bash
ollama create chiropractor-assistant -f Modelfile
```

3. **Test modellen:**
```bash
ollama run chiropractor-assistant "Pasient med akutte korsryggssmerter etter løft. Generer SOAP-notat."
```

4. **Oppdater .env:**
```env
AI_MODEL=chiropractor-assistant
```

#### Med Claude (API)

Send `training_data.jsonl` til Anthropic for fine-tuning via deres API.

## 📊 Datastruktur

### Input-format (JSONL for training)

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Du er en erfaren kiropraktor i Norge..."
    },
    {
      "role": "user",
      "content": "Hovedplage: Akutt korsryggsmerte\nSymptomer: smerte i LS overgang, stivhet\nRegion: Lumbar"
    },
    {
      "role": "assistant",
      "content": "{\"subjective\": \"...\", \"objective\": {...}, \"assessment\": \"...\", \"plan\": {...}}"
    }
  ]
}
```

### Output fra parser

```json
{
  "input": {
    "chief_complaint": "Akutt vondt i korsryggen for 3 dager siden",
    "symptoms": ["smerte i LS overgang", "smerte ved nys"],
    "region": ["Lumbar"],
    "category": "Lumbar"
  },
  "output": {
    "subjective": "...",
    "objective": {
      "inspection": "Avvergestilling",
      "rom": "Nedsatt fleksjon og ekstensjon",
      "palpation": "Hypomob. L4/L5",
      "ortho_tests": "(-)SLR, (+)Kemps",
      "positive_findings": ["Hypomob. L4/L5", "Økt tonus QL"],
      "negative_findings": ["SLR"]
    },
    "assessment": "Fasettleddsdysfunksjon og myalgier",
    "plan": {
      "manipulation": ["L5 PL", "L4 PR"],
      "soft_tissue": ["bilat. QL", "gl.med"],
      "exercises": ["katt-kamel", "rotasjonsmobilisering"],
      "advice": ["bevegelse", "unngå langvarig sittende"]
    }
  },
  "metadata": {
    "classification": {
      "region": ["Lumbar"],
      "pathology": ["Fasettleddsdysfunksjon", "Myalgi"],
      "category": "Lumbar"
    },
    "has_followup": true,
    "outcome": {
      "status": "improved",
      "improvement": "significant"
    }
  }
}
```

## 🎯 Bruksområder

### 1. AI-assistert notatskriving

Med de nye templatesene og den trenede modellen kan systemet:

- **Auto-fullføre SOAP-notater** basert på hovedplage
- **Foreslå objektive funn** basert på symptomer
- **Anbefale behandlingsplan** basert på funn
- **Lære fra utfall** for kontinuerlig forbedring

**Eksempel i frontend:**

```javascript
// I ClinicalEncounter.jsx
const suggestSOAP = async (chiefComplaint) => {
  const response = await fetch('/api/v1/ai/soap-suggestion', {
    method: 'POST',
    body: JSON.stringify({
      chiefComplaint,
      section: 'objective'
    })
  });

  const { suggestion } = await response.json();
  // Sett forslag i editor
};
```

### 2. Template-basert dokumentasjon

Bruk de nye, realistiske templatesene i din dokumentasjon:

```sql
-- Hent templates for en spesifikk tilstand
SELECT template_text
FROM clinical_templates
WHERE category = 'Korsrygg'
  AND template_name LIKE '%Akutt Lumbago%';
```

### 3. Klinisk beslutningsstøtte

Systemet kan nå gi bedre forslag basert på reelle cases:

```javascript
// Analyser røde flagg
const checkRedFlags = async (patientData, soapData) => {
  const response = await fetch('/api/v1/ai/red-flags', {
    method: 'POST',
    body: JSON.stringify({ patientData, soapData })
  });

  const { riskLevel, canTreat } = await response.json();
};
```

## 📈 Statistikk og analyse

Etter å ha generert treningsdata, se `statistics.json`:

```json
{
  "total_cases": 85,
  "by_region": {
    "Lumbar": 25,
    "Cervical": 18,
    "Pelvis": 12,
    "Shoulder": 8,
    ...
  },
  "by_pathology": {
    "Fasettleddsdysfunksjon": 30,
    "Myalgi": 42,
    "Bekkenleddsdysfunksjon": 12,
    ...
  },
  "with_followup": 68,
  "with_positive_outcome": 61,
  "average_symptoms": "3.2",
  "average_findings": "6.8"
}
```

## 🔄 Kontinuerlig læring

### Lagre utfall fra behandling

Systemet lærer fra faktiske behandlingsresultater:

```javascript
// Når pasient kommer til oppfølging
const recordOutcome = async (encounterId, outcome) => {
  await fetch('/api/v1/ai/learn', {
    method: 'POST',
    body: JSON.stringify({
      encounterId,
      outcomeData: {
        status: 'improved',       // 'improved', 'unchanged', 'worse'
        pain_reduction: 60,       // Prosent (0-100)
        functional_improvement: 'significant',
        patient_satisfaction: 9,  // 0-10
        comments: 'God bedring, fortsetter øvelser'
      }
    })
  });
};
```

## 🛠️ Avansert bruk

### Lag egne parsere for spesifikke mønstre

Eksempel: Parse spesifikke tester for skulder

```javascript
import { parseClinicalCase } from './services/clinicalDataParser.js';

const parseShoulderTests = (text) => {
  const tests = {
    hawkins: null,
    neer: null,
    empty_can: null
  };

  if (text.includes('(+)Hawkins')) tests.hawkins = 'positive';
  if (text.includes('(-)Hawkins')) tests.hawkins = 'negative';
  // ... etc

  return tests;
};
```

### Eksporter data for ekstern analyse

```bash
# Eksporter til CSV for statistisk analyse
node -e "
const data = require('./training_output/training_data.json');
console.log('Region,Pathology,Outcome');
data.forEach(d => {
  console.log(\`\${d.metadata.classification.region[0]},\${d.metadata.classification.pathology[0]},\${d.metadata.outcome?.status}\`);
});
" > analysis.csv
```

## ❓ FAQ

**Q: Hvor mange cases trenger jeg for god AI-trening?**
A: Minimum 50-100 cases per kategori for god kvalitet. Mer er bedre.

**Q: Kan jeg bruke data fra flere behandlere?**
A: Ja! Mer variasjon gir bedre generalisering.

**Q: Hva hvis parseren ikke fanger opp alt?**
A: Du kan manuelt justere `training_data.json` før du kjører fine-tuning.

**Q: Er dette GDPR-compliant?**
A: Ja, så lenge du anonymiserer pasientdata (fjern navn, datoer, fødselsnummer). Systemet anonymiserer automatisk, men dobbeltsjekk.

## 📚 Neste steg

1. ✅ Parse dine notater
2. ✅ Generer treningsdata
3. ✅ Importer templates
4. ⏳ Fine-tune modell (valgfritt)
5. ⏳ Test i produksjon
6. ⏳ Samle feedback fra bruk
7. ⏳ Iterer og forbedre

## 🤝 Bidrag

Har du forbedringer til parseren eller nye template-ideer?
Se `backend/src/services/clinicalDataParser.js` og `backend/seeds/realistic_clinical_templates.sql`.

## 📞 Support

Spørsmål? Se [README.md](README.md) eller dokumentasjonen i `/docs`.

---

**Laget med ❤️ for bedre klinisk dokumentasjon**
