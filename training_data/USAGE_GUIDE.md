# Brukerveiledning - AI Treningsdatasett

## Oversikt
Dette dokumentet forklarer hvordan du bruker det kliniske treningsdatasettet for å trene AI-modeller i ChiroClickCRM.

## Filer i dette datasettet

```
training_data/
├── clinical_cases_katrine.jsonl     # 32 kliniske treningseksempler
├── Modelfile.chiropractor-assistant # Ollama modelkonfigurasjon
├── validate_dataset.py              # Valideringsskript
├── README.md                         # Dokumentasjon
└── USAGE_GUIDE.md                   # Denne guiden
```

## Metode 1: Trene med Ollama (Anbefalt)

### Steg 1: Installer Ollama
```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# macOS
brew install ollama

# Windows
# Last ned fra https://ollama.com/download
```

### Steg 2: Last ned base-modell
```bash
ollama pull gemini-3-pro-preview:7b
# eller
ollama pull mistral:7b
# eller
ollama pull llama3.2:latest
```

### Steg 3: Opprett modell med Modelfile
```bash
cd training_data
ollama create chiropractor-assistant -f Modelfile.chiropractor-assistant
```

### Steg 4: Test modellen
```bash
ollama run chiropractor-assistant
```

Eksempel prompt:
```
Pasient: 45 år mann. Akutt korsryggsmerter etter løft av tung gjenstand.
Smerte ved fleksjon og rotasjon. Stråler ned i høyre ben til kneet.
Hva finner du ved undersøkelse og hvordan behandler du?
```

## Metode 2: Trene via ChiroClickCRM API

### Via Training UI (Frontend)
1. Gå til `/training` i applikasjonen
2. Velg "Upload Training Dataset"
3. Last opp `clinical_cases_katrine.jsonl`
4. Klikk "Start Training Pipeline"
5. Vent på at modellen blir trent (dette kan ta tid)

### Via API direkte
```javascript
// Opprett treningsdatasett
const response = await fetch('/api/training/create-dataset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicalEncounters: [] // Tom hvis du bruker eksisterende JSONL-fil
  })
});

// Start full treningspipeline
const trainingResponse = await fetch('/api/training/run-pipeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    googleDriveFolderId: 'OPTIONAL_GOOGLE_DRIVE_FOLDER_ID',
    modelName: 'chiropractor-assistant-v1',
    options: {
      temperature: 0.7,
      systemPrompt: 'Du er en erfaren norsk kiropraktor...'
    }
  })
});
```

## Metode 3: Fine-tune med OpenAI/GPT-4

Hvis du vil bruke OpenAI's fine-tuning API i stedet for Ollama:

### Steg 1: Konverter til OpenAI-format
```python
import json

# Les JSONL
with open('clinical_cases_katrine.jsonl', 'r') as f:
    examples = [json.loads(line) for line in f]

# Konverter til OpenAI fine-tuning format
openai_examples = []
for ex in examples:
    openai_examples.append({
        "messages": [
            {"role": "system", "content": "Du er en erfaren norsk kiropraktor..."},
            {"role": "user", "content": ex['prompt']},
            {"role": "assistant", "content": ex['response']}
        ]
    })

# Lagre
with open('training_openai.jsonl', 'w') as f:
    for ex in openai_examples:
        f.write(json.dumps(ex, ensure_ascii=False) + '\n')
```

### Steg 2: Last opp til OpenAI
```bash
openai api files.create -f training_openai.jsonl -p fine-tune
```

### Steg 3: Start fine-tuning
```bash
openai api fine_tunes.create -t <FILE_ID> -m gpt-4o-mini
```

## Validering og Testing

### Valider datasett
```bash
cd training_data
python3 validate_dataset.py clinical_cases_katrine.jsonl
```

### Test modellen
```bash
# Ollama
ollama run chiropractor-assistant "Pasient med nakkesmerter..."

# Via API
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "chiropractor-assistant",
  "prompt": "Pasient med nakkesmerter etter bilulykke. Hva finner du?",
  "stream": false
}'
```

## Beste Praksis

### 1. Start med en liten modell
- Bruk 7B-modeller (Mistral, Llama 3.2) for rask iterasjon
- Oppgrader til større modeller (13B, 70B) når du er fornøyd med resultatene

### 2. Iterativ forbedring
```
1. Tren modell → 2. Test på reelle cases → 3. Samle feedback →
4. Legg til flere eksempler → 5. Gjenta
```

### 3. Evaluer kvalitet
Test modellen på:
- ✅ Konsistens i journalføring
- ✅ Korrekt medisinsk terminologi
- ✅ Passende behandlingsforslag
- ✅ Identifisering av røde flagg

### 4. Utvid datasettet
Når du samler flere anonymiserte journaler:
```bash
# Legg til nye eksempler i JSONL-filen
echo '{"prompt": "...", "response": "..."}' >> clinical_cases_katrine.jsonl

# Valider igjen
python3 validate_dataset.py clinical_cases_katrine.jsonl

# Tren ny versjon
ollama create chiropractor-assistant-v2 -f Modelfile.chiropractor-assistant
```

## Feilsøking

### Ollama-modellen gir dårlige svar
- **Problem**: Modellen hallusinerer eller gir ulogiske svar
- **Løsning**: Reduser `temperature` i Modelfile (prøv 0.5 i stedet for 0.7)

### Modellen svarer på engelsk
- **Problem**: Base-modellen er trent på engelsk
- **Løsning**: Legg til flere norske eksempler eller bruk en norsk base-modell

### Training feiler
- **Problem**: Ikke nok minne/ressurser
- **Løsning**: Bruk en mindre base-modell (3B i stedet for 7B)

### Modellen tar for lang tid å svare
- **Problem**: Stor modell på svak hardware
- **Løsning**: Bruk quantized modeller (Q4_K_M, Q5_K_M)

## Neste Steg

1. ✅ Valider datasettet
2. ✅ Tren modellen
3. ⬜ Test på reelle cases
4. ⬜ Samle tilbakemeldinger
5. ⬜ Utvid datasettet med flere eksempler
6. ⬜ Integrer i ChiroClickCRM produksjon

## Support

For spørsmål eller problemer, se:
- README.md - Komplett dokumentasjon
- backend/src/services/ollamaTraining.js - Kildekode
- https://ollama.com/docs - Ollama dokumentasjon
