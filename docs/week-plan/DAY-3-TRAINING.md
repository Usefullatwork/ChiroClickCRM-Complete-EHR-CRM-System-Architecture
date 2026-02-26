# Day 3 (Wednesday): Train v4 + Deploy + Evaluate

**Time estimate**: 1h active coding + 5-7h unattended GPU training
**Goal**: Train v4 SFT model, deploy to Ollama, evaluate against v2

---

## Task 3.1: SFT v4 Training (~5-7h unattended)

### Pre-Training Checklist

1. **Kill Ollama** to free GPU VRAM:

```bash
"/c/Windows/System32/taskkill.exe" //F //IM ollama.exe 2>/dev/null
"/c/Windows/System32/taskkill.exe" //F //IM ollama_llama_server.exe 2>/dev/null
```

2. **Kill non-essential GPU apps** (Edge, OneDrive, Razer Synapse, etc.)
   - **NEVER KILL**: `nvcontainer.exe`, `dwm.exe`, `csrss.exe`, `explorer.exe`
   - Killing `nvcontainer.exe` causes 10x slowdown (NVIDIA CUDA runtime)

3. **Verify dataset**:

```bash
wc -l /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training/data/processed/general-clinical/train.jsonl
# Must be ~5,000-5,200 (NOT 10,000+)
```

### Training Command

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training

PYTHONIOENCODING=utf-8 PYTHONUNBUFFERED=1 ml-env/Scripts/python.exe training/train_unsloth.py \
  --model default \
  --epochs 1 \
  --batch-size 2 \
  --no-packing \
  --max-seq-length 1024 \
  --lr 1.5e-4 \
  --data-dir data/processed/general-clinical \
  --output ../models \
  --log-dir ../logs \
  --quantize q4_k_m
```

### Training Config — MUST Match v2 Exactly

| Parameter               | Value               | Why                                            |
| ----------------------- | ------------------- | ---------------------------------------------- |
| `--model default`       | Qwen2.5-7B-Instruct | Same base as v2                                |
| `--epochs 1`            | Single epoch        | v2 used 1 epoch                                |
| `--batch-size 2`        | Batch of 2          | RTX 4070 VRAM limit (~11.9GB)                  |
| `--no-packing`          | Disabled            | Packing changes training dynamics + causes OOM |
| `--max-seq-length 1024` | 1024 tokens         | v2 setting                                     |
| `--lr 1.5e-4`           | Learning rate       | v2 setting                                     |
| `--quantize q4_k_m`     | 4-bit quantization  | For GGUF export                                |

### Expected Training Behavior

| Metric         | Expected                                            |
| -------------- | --------------------------------------------------- |
| Steps          | ~1,300 (dataset_size / batch_size / gradient_accum) |
| Time per step  | ~15-20s                                             |
| Total time     | ~5-7 hours                                          |
| VRAM usage     | ~11.9GB                                             |
| Final loss     | ~1.0-1.1                                            |
| Final accuracy | ~78-80%                                             |

### Set Process Priority (Optional)

After training starts, boost Python's priority:

```bash
# Find the PID
wmic.exe process where "name='python.exe'" get processid
# Set to High priority
wmic.exe process where processid=XXXX CALL setpriority 128
```

### Monitor Training

Training logs go to `ai-training/logs/`. Watch with:

```bash
tail -f /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training/logs/*.log
```

### While Training Runs

Use this time for Day 4 tasks (tests, i18n) — they don't need GPU.

---

## Task 3.2: Deploy v4 to Ollama (~10 min)

### After Training Completes

#### Step 1: Convert LoRA Adapter to GGUF

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training

PYTHONIOENCODING=utf-8 ml-env/Scripts/python.exe llama-cpp-convert/convert_lora_to_gguf.py \
  models/chiro-no-lora \
  --outfile models/gguf/chiro-no-lora-adapter-v4.gguf \
  --outtype f16 \
  --base /c/Users/MadsF/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/snapshots/a09a35458c702b33eeacc393d103063234e8bc28
```

Expected output: `models/gguf/chiro-no-lora-adapter-v4.gguf` (~78MB)

#### Step 2: Create Modelfile

```bash
cat > models/gguf/Modelfile.chiro-no-lora-v4 << 'MODELFILE'
FROM qwen2.5:7b-instruct
ADAPTER ./chiro-no-lora-adapter-v4.gguf

TEMPLATE """{{- if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{- range .Messages }}<|im_start|>{{ .Role }}
{{ .Content }}<|im_end|>
{{ end }}<|im_start|>assistant
"""

PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.1
PARAMETER stop <|im_end|>
PARAMETER stop <|im_start|>

SYSTEM """Du er en spesialisert klinisk assistent for kiropraktorer i Norge med kunnskap om SOAP-notater, diagnosekoding (ICPC-2), røde flagg, behandlingsplanlegging, og norsk medisinsk fagspråk. Bruk ICPC-2 koder (L01-L98, N01-N93) ved diagnoser. Klassifiser røde flagg som AKUTT/HENVIS/MONITORÉR/TRYGT. Svar alltid på norsk."""
MODELFILE
```

#### Step 3: Start Ollama with Local Storage and Deploy

```bash
# Start Ollama with portable model storage
export OLLAMA_MODELS="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/data/ollama"
"/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe" serve &
sleep 5

# Deploy the model
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training/models/gguf
"/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe" create chiro-no-lora-v4 -f Modelfile.chiro-no-lora-v4
```

#### Step 4: Smoke Test

```bash
"/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe" run chiro-no-lora-v4 "Diagnose for pasient med korsryggsmerter: gi ICPC-2 kode"
```

Expected: Response containing `L03` or `L86` with Norwegian explanation.

---

## Task 3.3: Evaluate v4 vs v2 (~10 min)

### Run Evaluation

```bash
cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training

PYTHONIOENCODING=utf-8 ml-env/Scripts/python.exe evaluation/evaluate.py \
  --model chiro-no-lora-v4 \
  --compare --model-b chiro-no-lora-v2 \
  --verbose \
  --output evaluation/baseline/chiro-no-lora-v4.json
```

### Decision Matrix

| v4 Overall Score | Diagnosis Codes | Action                                                   |
| ---------------- | --------------- | -------------------------------------------------------- |
| > 82%            | Any             | **Use v4**: Update `.env` to `AI_MODEL=chiro-no-lora-v4` |
| 79-82%           | > 70%           | **Use v4**: Diagnosis improved, overall maintained       |
| 79-82%           | <= 60%          | **Keep v2**: Diagnosis didn't improve                    |
| < 79%            | Any             | **Keep v2**: 79% is production-viable                    |

### If v4 Wins — Update .env

```bash
# Update backend/.env
sed -i 's/AI_MODEL=chiro-no-lora-v2/AI_MODEL=chiro-no-lora-v4/' \
  /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend/.env

# Update backend/.env.example
sed -i 's/AI_MODEL=chiro-no-lora-v2/AI_MODEL=chiro-no-lora-v4/' \
  /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend/.env.example

# Update MODEL_ROUTING in ai.js (all references)
# Replace chiro-no-lora-v2 with chiro-no-lora-v4 in lines 349-376
```

### If v2 Wins — No Changes

Keep `.env` as-is with `AI_MODEL=chiro-no-lora-v2`. The v4 adapter stays in `models/gguf/` for reference but isn't deployed.

---

## Day 3 Checklist

- [ ] Training started with correct config (matching v2 exactly)
- [ ] Training log shows steps progressing at ~15-20s/step
- [ ] Final loss ~1.0-1.1
- [ ] GGUF adapter exported (~78MB)
- [ ] Modelfile created for v4
- [ ] Deployed to local Ollama storage (`data/ollama/`)
- [ ] Smoke test passes (Norwegian clinical response)
- [ ] Evaluation results saved to `evaluation/baseline/chiro-no-lora-v4.json`
- [ ] Decision made: v4 or keep v2
- [ ] `.env` and `.env.example` updated with best model name
- [ ] Commit: `git commit -m "feat: v4 model training + evaluation results"`
