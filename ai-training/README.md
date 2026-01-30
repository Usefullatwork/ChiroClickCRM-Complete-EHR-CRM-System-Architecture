# ChiroClick AI Models - Standalone Setup

Run AI models locally without backend access or special permissions. Just Ollama.

## Quick Start

### 1. Install Ollama
Download from https://ollama.ai and install.

### 2. Build All Models
```batch
cd ai-training
build-all-models.bat
```

### 3. Test Models
```batch
test-models.bat
```

## Models

| Model | Size | Purpose | Speed |
|-------|------|---------|-------|
| `chiro-fast` | ~2GB | Quick autocomplete (chief complaint, onset) | ⚡ Fast |
| `chiro-norwegian` | ~4GB | Norwegian narratives (history, subjective) | 🔵 Medium |
| `chiro-medical` | ~5GB | Clinical reasoning (diagnosis, palpation) | 🔴 Slower |
| `chiro-no` | ~4GB | Default balanced model | 🔵 Medium |

## Usage Without Backend

### Command Line (No app needed)
```bash
# Quick field generation
ollama run chiro-fast "Generer hovedklage for nakkesmerter"

# Full SOAP note
ollama run chiro-norwegian "Skriv SOAP-notat for akutt korsryggsmerte"

# Clinical reasoning
ollama run chiro-medical "Generer klinisk resonnering for cervikogen hodepine"

# Safety assessment
ollama run chiro-medical "Generer sikkerhetsvurdering for lumbalcolumna"
```

### API Access (No authentication)
```bash
# Streaming response
curl http://localhost:11434/api/generate -d '{
  "model": "chiro-fast",
  "prompt": "Generer hovedklage for skuldersmerter",
  "stream": true
}'

# Non-streaming
curl http://localhost:11434/api/generate -d '{
  "model": "chiro-norwegian",
  "prompt": "Skriv subjektiv for nakkepasient",
  "stream": false
}'
```

### Python (Simple script)
```python
import requests

def generate_clinical_text(prompt, model="chiro-fast"):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": model, "prompt": prompt, "stream": False}
    )
    return response.json()["response"]

# Example
text = generate_clinical_text("Generer hovedklage for korsryggsmerter")
print(text)
```

## Field Types & Recommended Models

| Field | Model | Example Prompt |
|-------|-------|----------------|
| Chief Complaint | chiro-fast | "Generer hovedklage for [condition]" |
| Onset | chiro-fast | "Generer symptomstart for [condition]" |
| History | chiro-norwegian | "Generer sykehistorie for [condition]" |
| Pain Quality | chiro-fast | "Generer smertekvalitet for [condition]" |
| Aggravating Factors | chiro-fast | "Generer forverrende faktorer for [condition]" |
| Relieving Factors | chiro-fast | "Generer lindrende faktorer for [condition]" |
| Observation | chiro-fast | "Generer observasjon for [patient type]" |
| Palpation | chiro-medical | "Generer palpasjon for [condition]" |
| ROM | chiro-fast | "Generer bevegelsesutslag for [region]" |
| Ortho Tests | chiro-fast | "Generer ortopediske tester for [region]" |
| Neuro Tests | chiro-fast | "Generer nevrologiske tester for [region]" |
| Clinical Reasoning | chiro-medical | "Generer klinisk resonnering for [condition]" |
| Diagnosis | chiro-medical | "Generer diagnose for [condition]" |
| Treatment | chiro-fast | "Generer behandling for [condition]" |
| Follow-up | chiro-fast | "Generer oppfølging for [condition]" |
| Safety Assessment | chiro-medical | "Generer sikkerhetsvurdering for [region]" |

## Training Data Files

| File | Description |
|------|-------------|
| `Modelfile` | Main balanced model (chiro-no) |
| `Modelfile-fast` | Quick autocomplete model |
| `Modelfile-norwegian` | Norwegian narrative model |
| `Modelfile-medical` | Clinical reasoning model |
| `clinical-fields-training.jsonl` | 100+ field-specific examples |
| `communication-tones-training.jsonl` | SMS/email templates |

## System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: ~15GB for all models
- **OS**: Windows, macOS, or Linux
- **No internet** required after initial download

## Troubleshooting

### "Ollama is not running"
Start Ollama:
- Windows: Run "Ollama" from Start Menu
- macOS: `ollama serve`
- Linux: `systemctl start ollama`

### Model not found
Rebuild the specific model:
```bash
ollama create chiro-fast -f Modelfile-fast
```

### Slow responses
Use chiro-fast for simple fields. Only use chiro-medical for complex clinical reasoning.

### Out of memory
Close other applications or use smaller models:
```bash
ollama pull llama3.2:1b
```

## Adding Custom Training

Add examples to Modelfiles using MESSAGE format:
```
MESSAGE user "Your prompt"
MESSAGE assistant "Expected response"
```

Then rebuild:
```bash
ollama create chiro-no -f Modelfile
```

## License

For clinical documentation assistance only. Not a substitute for professional clinical judgment.
