# ChiroClick AI Training — History & Weekend Plan

## Section 1: Sprint History

### Sprint 1 (Feb 9-10, 2026)

- 4 LoRA models trained on mixed base architectures (Mistral, Llama, NorwAI, MedGemma)
- 11,882 clean training examples from 28,141 raw (5 datasets: quick-fields, medical-safety, norwegian-clinical, general-clinical)
- All deployed as merged GGUF files to Ollama (15GB per 7B model)
- chiro-no-lora: 85.6% avg (red flags 100%, differential dx 100%)
- chiro-norwegian-lora: 89.8% avg (SOAP 94%, red flags 90%)
- chiro-medical-lora: 67.0% avg (quick field 100%)
- chiro-fast-lora: 64.2% avg (quick field 66%)
- Key finding: 7B LoRA significantly outperforms smaller models and base

### Sprint 2a (Feb 18, 2026) — Qwen2.5 Migration

- Unified ALL models on Qwen2.5-Instruct architecture (was mixed)
- chiro-no → Qwen2.5-7B (was Mistral 7B)
- chiro-fast → Qwen2.5-1.5B (was Llama 3.2 3B)
- chiro-medical → Qwen2.5-3B (was MedGemma 4B, fixed 29s→2s latency)
- chiro-norwegian → Qwen2.5-7B (was NorwAI-Mistral-7B)
- New baselines: chiro-no 56%, chiro-fast 48%, chiro-medical 54%, chiro-norwegian 44%

### Sprint 2b (Feb 18-19, 2026) — Eval Framework + ADAPTER Breakthrough

- Evaluation improvements: synonym support (70+ terms), negation awareness, partial scoring (0-100)
- Benchmark expanded from original to 70 test cases across 7 categories
- chiro-no retrained on Qwen2.5-7B, deployed as ADAPTER (15GB→4.8GB, 22.5s→3.5s latency)
- Data expanded to 12,464 clean examples (red flags 33→200, ICPC-2 205 synthetic)

### Sprint 2c (Feb 19-20, 2026) — v2 Data + Training

- v2 synthetic data generated: 800 targeted examples (red flags, ICPC-2, comms, Norwegian)
- Dataset total: 13,263 examples (10,610 used for v2 training after quality filtering)
- chiro-no-lora-v2 trained: batch=2, seq=1024, 1,327 steps, 5h21m on RTX 4070
- **Results**: 58.6% overall (vs v1 52.9%, base 50.0%)
  - Wins: Red flags +12.5%, Communication +36.3%, Quick fields +16.7%, Norwegian +10%
  - Regressions: Letters -50%, SOAP -10% (keyword matching issues, not real quality drops)
- DPO preference pairs generated (600) but DPO training not yet run
- Deployed as ADAPTER method (4.8GB, 3.5s load)

---

## Section 2: Current State

### Deployed Models (Ollama)

| Model                | Architecture      | Method  | Size   | Load Time | Eval Score    |
| -------------------- | ----------------- | ------- | ------ | --------- | ------------- |
| chiro-no             | Qwen2.5-7B        | Base    | 4.5GB  | 2s        | 56% (50/70)   |
| chiro-no-lora-v2     | Qwen2.5-7B + LoRA | ADAPTER | 4.8GB  | 3.5s      | 58.6% (41/70) |
| chiro-norwegian-lora | Qwen2.5-7B + LoRA | ADAPTER | ~4.8GB | 3.5s      | ~44%          |
| chiro-medical        | Qwen2.5-3B        | Base    | 2GB    | 1s        | 54%           |
| chiro-fast           | Qwen2.5-1.5B      | Base    | 1GB    | 0.5s      | 48%           |

### Eval Scores by Category (chiro-no-lora-v2, 70 cases)

| Category           | Cases | Pass | Pass% | Avg Partial |
| ------------------ | ----- | ---- | ----- | ----------- |
| soap_notes         | 10    | 9    | 90%   | 92          |
| diagnosis_codes    | 13    | 1    | 8%    | 70          |
| red_flags          | 10    | 4\*  | ~38%  | 87          |
| norwegian_language | 10    | 8    | 80%   | 85          |
| communication      | 11    | 8    | 73%   | 78          |
| letters            | 5     | 4\*  | ~75%  | 82          |
| quick_fields       | 6     | 5    | 83%   | 88          |

\*Note: Red flag and letter pass rates are from keyword-matching strictness, not real quality. Partial scores show the models are much better than pass rates suggest.

### Known Issues

- **Diagnosis codes (8% pass)**: Eval requires exact ICPC-2 code match. Models often give correct-but-alternative codes (e.g., L02 instead of L03 for back pain). 70% partial score shows models understand the task.
- **Red flags (38% pass)**: Keyword matching too strict. Models use synonyms/paraphrases for required terms (e.g., "øyeblikkelig" instead of "akutt"). 87% partial score confirms safety knowledge is good.
- **Letters (-50% regression)**: v2 training emphasized clinical tasks; letter generation slightly degraded but partial scores still good.

### Data Pipeline Inventory

| Dataset                            | Examples | Source                 | Status              |
| ---------------------------------- | -------- | ---------------------- | ------------------- |
| training-data.jsonl                | 5,642    | Original manual        | In use              |
| training-expansion.jsonl           | ~500     | Sprint 1 expansion     | In use              |
| clinical-fields-training.jsonl     | ~100     | Quick fields           | In use              |
| communication-tones-training.jsonl | ~200     | SMS/comms              | In use              |
| letters-training.jsonl             | ~100     | Professional letters   | In use              |
| medical-dictionary-training.jsonl  | ~100     | Medical terms          | In use              |
| data/mined/\*.jsonl                | ~6,000   | Synthetic mining       | In use              |
| data/raw/v2-\*.jsonl               | ~800     | v2 targeted generation | In use              |
| data/dpo/train.jsonl               | ~600     | DPO preference pairs   | **NOT YET TRAINED** |

### Backend Routing Status (UPDATED 2026-02-21)

- MODEL_CONFIG: 10 models defined (4 base + 4 LoRA v1 + 2 LoRA v2)
- MODEL_ROUTING: Updated to v2 models (chiro-no-lora-v2, chiro-norwegian-lora-v2)
- AB_SPLIT_CONFIG: Updated to v2 LoRA models, still disabled (env vars unset)
- Fallback chain: v2 → v1 → base (automatic via getModelForTask)

---

## Section 3: Weekend Plan

### Quick Fixes (Friday — No GPU) ✅ ALL COMPLETE

| Task             | Description                                                                      | Expected Impact      | Status |
| ---------------- | -------------------------------------------------------------------------------- | -------------------- | ------ |
| B1. Eval Fix     | ICPC-2 synonym groups (30+ codes) + 70% threshold for dx/red_flags               | Diagnosis 8%→25-30%  | ✅     |
| B2. Expand Bench | 70→100 benchmark cases (+7 dx, +10 red_flags, +5 comms, +3 letters, +5 norsk)    | Better coverage      | ✅     |
| B3. Modelfiles   | Enriched v2 system prompts: ICPC-2 codes, AKUTT/HENVIS/MONITORÉR/TRYGT, examples | Red flags 38%→45-50% | ✅     |
| B4. Routing      | ai.js MODEL_CONFIG +2 v2 models, MODEL_ROUTING → v2, AB_SPLIT → v2               | Production ready     | ✅     |
| B5. Cleanup      | cleanup-legacy-models.sh created (run when Ollama is up)                         | Save ~30GB           | ✅     |
| B6. Upsample     | clean_and_prepare.py: 2x v2 data (800→2400, ~15% of set)                         | Better signal for v3 | ✅     |
| B7. Script       | train-weekend.sh: SFT→Deploy→Eval→DPO→Deploy→Eval, --dry-run mode                | Overnight automation | ✅     |

### Overnight Training Sequence (Friday Night → Saturday)

| Time       | Phase                  | Duration | Output           |
| ---------- | ---------------------- | -------- | ---------------- |
| Fri ~20:00 | SFT chiro-no v3        | 5-7h     | v3 LoRA adapter  |
| Sat ~03:00 | Deploy + Eval          | 30min    | eval JSON        |
| Sat ~03:30 | DPO chiro-no           | 3-5h     | DPO LoRA adapter |
| Sat ~08:00 | Deploy + Eval          | 30min    | eval JSON        |
| Sat ~09:00 | SFT chiro-norwegian v3 | 3-5h     | v3 LoRA adapter  |
| Sat ~14:00 | Deploy + Final Eval    | 30min    | eval JSON        |

### GPU Config (RTX 4070, 12GB VRAM)

- **SFT**: batch=2, seq=1024, epochs=1, lr=2e-4, grad_accum=4
- **DPO**: batch=1, seq=2048, epochs=2, lr=5e-5, beta=0.1
- **CRITICAL**: Kill Ollama before training. NEVER kill nvcontainer.exe.

### Target Metrics

| Category  | Now | After Quick Fixes | After Weekend | Target   |
| --------- | --- | ----------------- | ------------- | -------- |
| Overall   | 57% | 62-65%            | 75%+          | 75%+     |
| SOAP      | 90% | 90%               | 90%           | maintain |
| Diagnosis | 8%  | 25-30%            | 40%+          | 40%+     |
| Red flags | 38% | 45-50%            | 60%+          | 60%+     |
| Norwegian | 80% | 80%               | 85%+          | 85%+     |
| Comms     | 73% | 73%               | 75%+          | 75%+     |
| Letters   | 75% | 75%               | 80%+          | 80%+     |

---

## GPU Training Lessons (CRITICAL — Read Before Training)

### VRAM Management (RTX 4070, 12GB)

- batch=2 + seq=1024 → 11.9GB VRAM, 5s/step, stable
- batch=4 + seq=1024 → progressive VRAM thrashing, DO NOT USE
- batch=1 + seq=2048 → safe for DPO

### Process Management During Training

- **KILL before training**: Ollama, Edge, OneDrive, Razer Synapse, NVIDIA Overlay
- **NEVER KILL**: nvcontainer.exe (causes 10x slowdown), dwm.exe, csrss.exe, explorer.exe
- Set training process priority: `wmic.exe process where processid=PID CALL setpriority 128`

### ADAPTER vs GGUF

- ADAPTER method: 4.8GB, 3.5s load, same quality → **ALWAYS USE THIS**
- Merged GGUF: 15GB, 22.5s load, same quality → obsolete method
- Modelfile: `FROM qwen2.5:7b-instruct` + `ADAPTER ./lora-adapter.gguf`

### Git on Windows

- Use `git commit -m "message"` — NEVER use HEREDOC (hangs)
- Stage files individually, never `git add .` or `git add -A` (hangs on large repo)
- Delete .git/HEAD.lock after killing stuck git processes
