# Fysioterapi AI-Trening & Template System

## Oversikt

Dette systemet lar deg trene en lokal AI-modell på dine egne fysioterapi-notater og bruke strukturerte SOPE-templates for bedre dokumentasjon.

## 🎯 Komponenter

### 1. Kliniske Templates (`backend/seeds/physiotherapy_clinical_templates.sql`)

Omfattende SOPE-templates for fysioterapi organisert i kategorier:

#### Hovedkategorier:
- **Skulder**: Rotator cuff, frosen skulder, impingement
- **Nakke/Cervikal**: Cervikal/thorakal problematikk
- **Kne**: Hoffas fettpute, menisk, patellofemoral
- **Ankel/Fot**: Ligamentskader, Severs syndrom, Achilles
- **Hofte/Lyske**: FAI, adduktor-problematikk
- **Rygg**: Lumbago, prolaps, biopsykososial overbelastning
- **Behandling**: Manuell terapi, taping (KT/LT), mobilisering
- **Øvelser**: Område-spesifikke rehabiliteringsøvelser

#### SOPE-Struktur:
- **S**ubjektivt: Anamnese, provoserende/lindrende faktorer
- **O**bjektivt: Holdning, ROM, Muskelstyrke, Spesialtester, Palpasjon
- **P**lan/Tiltak: KT/LT taping, øvelser, behandling
- **E**valuering: Diagnose/konklusjon

### 2. AI Treningsdata (`training_data/physiotherapy_training_dataset.jsonl`)

Anonymisert treningsdatasett med 20+ eksempler som dekker:

- Subjektivt → Objektivt prediksjoner
- Funn → Diagnose vurderinger
- Behandlingsplaner basert på SOPE-notater
- Spesialtester og deres tolkninger
- Differensialdiagnostikk
- Behandlingsprotokoller

## 📋 Installasjon

### 1. Last inn kliniske templates

```bash
# Fra backend-mappen
cd backend

# Last templates inn i database
psql -d your_database_name -f seeds/physiotherapy_clinical_templates.sql
```

Dette vil opprette **260+ fysioterapi-spesifikke templates** i systemet ditt.

### 2. Verifiser template-opplasting

```sql
-- Sjekk antall templates
SELECT category, COUNT(*)
FROM clinical_templates
WHERE is_system = true
GROUP BY category;

-- Se alle skulder-templates
SELECT template_name, soap_section
FROM clinical_templates
WHERE category = 'Skulder';
```

## 🤖 AI-Trening

### Forbered treningsdata

Systemet har allerede et anonymisert treningsdatasett basert på dine notater. For å legge til egne notater:

1. **Samle notater**: Eksporter dine journalnotater til en mappe
2. **Anonymiser**: Bruk systemets anonymiseringstjeneste

```javascript
// backend/src/services/trainingAnonymization.js
import { anonymizeSOAPNote } from './trainingAnonymization.js';

const anonymizedNote = anonymizeSOAPNote(yourNote, {
  preserveDates: false,
  aggressive: true // Fjerner alle potensielle PII
});
```

### Tren lokal AI-modell med Ollama

```bash
# Sørg for at Ollama er installert
ollama --version

# Last ned base-modellen
ollama pull gemma2:27b

# Opprett Modelfile
cat > Modelfile.physio << EOF
FROM gemma2:27b
SYSTEM "Du er en erfaren norsk fysioterapeut som hjelper med journalføring og klinisk vurdering. Du bruker SOPE-struktur (Subjektivt, Objektivt, Plan, Evaluering) og norsk medisinsk terminologi."
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
EOF

# Tren modellen
ollama create physio-assistant -f Modelfile.physio
```

### Bruk AI-modellen via API

```javascript
// backend/src/services/ai.js
import axios from 'axios';

const generateSOAPNote = async (subjective) => {
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'physio-assistant',
    prompt: `Basert på følgende subjektive funn, hva ville du forvente å finne ved objektiv undersøkelse?\n\nSubjektivt: ${subjective}`,
    stream: false
  });

  return response.data.response;
};
```

## 📝 Bruke Templates i Praksis

### I Frontend

```jsx
// frontend/src/components/TemplatePicker.jsx
import { useState, useEffect } from 'react';

const TemplatePicker = ({ category, onSelect }) => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    // Hent templates for kategori
    fetch(`/api/templates?category=${category}&soap_section=objective`)
      .then(res => res.json())
      .then(data => setTemplates(data));
  }, [category]);

  return (
    <div>
      <h3>Velg template:</h3>
      {templates.map(template => (
        <button
          key={template.id}
          onClick={() => onSelect(template.template_text)}
        >
          {template.template_name}
        </button>
      ))}
    </div>
  );
};
```

### Eksempel: Skulder-undersøkelse

```javascript
// Hent "Rotator Cuff Undersøkelse" template
const template = await getTemplate('Skulder', 'Rotator Cuff Undersøkelse');

// Fyll ut med pasientdata
const objective = template.template_text
  .replace('[___]°', '120°')
  .replace('[ve/hø]', 'høyre')
  .replace('[___]/5', '3/5');

// Lagre i journal
await saveEncounter({
  subjective: "...",
  objective: objective,
  assessment: "...",
  plan: "..."
});
```

## 🔄 Kontinuerlig Forbedring

### Samle egne notater for bedre AI

```javascript
// backend/src/controllers/training.js
import * as ollamaTraining from '../services/ollamaTraining.js';

// Hent alle dine encounters
const encounters = await db.query(`
  SELECT subjective, objective, assessment, plan
  FROM clinical_encounters
  WHERE created_by = $1
  AND created_at > NOW() - INTERVAL '1 year'
`, [userId]);

// Anonymiser og lag treningsdatasett
const dataset = await ollamaTraining.createTrainingDataset(encounters);

// Tren modellen
await ollamaTraining.trainModel('physio-assistant-personalized');
```

### Feedback-loop

1. **Bruk AI**: Generer SOPE-notater med AI
2. **Rediger**: Gjør nødvendige justeringer
3. **Lagre**: Lagre forbedrede notater
4. **Re-tren**: Periodisk re-tren modellen med nye data

## 📊 Template-kategorier Oversikt

| Kategori | Antall Templates | SOPE-seksjoner |
|----------|------------------|----------------|
| Skulder | 40+ | S, O, P, E |
| Nakke | 35+ | S, O, P, E |
| Kne | 45+ | S, O, P, E |
| Ankel/Fot | 40+ | S, O, P, E |
| Hofte | 35+ | S, O, P, E |
| Rygg | 40+ | S, O, P, E |
| Behandling | 30+ | P |
| Øvelser | 35+ | P |

## 🎓 Beste Praksis

### 1. Konsistent Terminologi
Bruk templates for å sikre konsistent medisinsk terminologi:
- Oxford skala (0-5) for muskelstyrke
- AROM/PROM for bevegelsesutslag
- Bilat/ve/hø for side-indikasjon

### 2. Strukturerte Notater
Følg SOPE-strukturen konsekvent:
```
S: Pasientens subjektive opplevelse
O: Dine objektive funn
P: Behandlingsplan
E: Din kliniske vurdering/diagnose
```

### 3. Bruk Spesialtester
Templates inkluderer over 50+ spesialtester med korrekt utførelse og tolkning:
- Spurling's (cervikal nerverot)
- McMurray (menisk)
- FABER (SIJ/hofte)
- Skuffetest (ankel ligamenter)
- Hoffas Squeeze (fettpute)

### 4. Progresjon og Dosering
Øvelses-templates inkluderer:
- Repetisjoner og sett
- Progresjonskriterier
- Frekvens
- Modifikasjoner

## 🔐 Personvern & GDPR

### Anonymisering

Systemet anonymiserer automatisk:
- Personnummer
- Telefonnumre
- E-postadresser
- Adresser
- Navn
- Datoer (kan generaliseres)
- Aldre (til intervaller)

```javascript
import { validateAnonymization } from './trainingAnonymization.js';

// Valider at tekst er anonymisert
const validation = validateAnonymization(anonymizedText);
if (!validation.isClean) {
  console.warn('Mulig PII funnet:', validation.warnings);
}
```

## 🚀 Fremtidige Forbedringer

### Planlagte Features:
1. **Auto-suggest**: AI foreslår objektive funn basert på subjektivt
2. **Differential diagnosis**: AI lister mulige differensialdiagnoser
3. **Exercise prescription**: AI foreslår passende øvelser
4. **Progress tracking**: Automatisk sammenligning med tidligere notater
5. **Voice-to-text**: Dikter notater direkte til SOPE-struktur

## 📞 Support

For spørsmål eller problemer:
1. Sjekk `backend/src/services/ollamaTraining.js` for AI-funksjoner
2. Sjekk `backend/src/services/templates.js` for template-funksjoner
3. Se `backend/src/controllers/training.js` for API-endepunkter

## 📚 Ressurser

- [Ollama Documentation](https://ollama.ai/docs)
- [SOPE Journalføring](https://www.helsenorge.no)
- [ICPC-2 Koder](https://www.kith.no)
- [Oxford Muskelstyrke Skala](https://www.physio-pedia.com)

---

**Laget av:** Arne Martin Vik (AMV)
**Sist oppdatert:** 2025-11-19
**Versjon:** 1.0
