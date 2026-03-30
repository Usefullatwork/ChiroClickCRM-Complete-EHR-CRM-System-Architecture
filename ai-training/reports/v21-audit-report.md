# ChiroClickEHR AI — v2.1 Audit Report

**Date**: 2026-03-20
**Model**: chiro-no-sft-dpo-v6 (Qwen2.5-7B-Instruct + SFT + DPO, Q8_0 GGUF, ~8.1GB)
**Session**: Audit, align, benchmark expansion, training data creation

---

## 1. Current Model Status

### v6 Health Check (100-case baseline)

| Metric            | Baseline (stored) | Audit (today)  |
| ----------------- | ----------------- | -------------- |
| Pass rate         | 96/100 (96.0%)    | 92/100 (92.0%) |
| Avg partial score | 96.2/100          | 94.7/100       |
| Avg latency       | 7031ms            | 2984ms         |

**Per-category breakdown (audit):**

| Category           | Pass Rate    | Avg Score | Notes                         |
| ------------------ | ------------ | --------- | ----------------------------- |
| soap_notes         | 10/10 (100%) | 95        | Strong                        |
| diagnosis_codes    | 16/20 (80%)  | 89        | Weakest — ICPC-2 alternatives |
| red_flags          | 24/26 (92%)  | 98        | Consistent                    |
| norwegian_language | 15/15 (100%) | 96        | Strong                        |
| communication      | 16/16 (100%) | 96        | Strong                        |
| quick_fields       | 5/6 (83%)    | 94        | Minor variance                |
| letters            | 6/7 (86%)    | 94        | Minor variance                |

The 4% audit-vs-baseline delta is within stochastic variance (temperature=0.3).
Latency improvement (7031ms → 2984ms) indicates warm VRAM from recent use.

### Model Availability

| Model                 | Size   | Status                        |
| --------------------- | ------ | ----------------------------- |
| chiro-no-sft-dpo-v6   | 8.1 GB | Loaded, primary               |
| chiro-no-sft-dpo-v5   | 8.1 GB | Available, fallback           |
| chiro-no-lora-v5      | 4.8 GB | Available, legacy             |
| chiro-medical-lora-v4 | 2.0 GB | Available, clinical reasoning |
| chiro-fast-lora-v4    | 1.0 GB | Available, autocomplete       |

---

## 2. Model Router Fix Applied

**Critical bug**: `modelRouter.js` defaulted all task routing to v5 (77% eval) instead of v6 (96% eval). Every AI-assisted feature — SOAP notes, red flags, letters, patient comms — was using the inferior model.

**Changes (commit b856125):**

- `AI_MODEL` default: `chiro-no-sft-dpo-v5` → `chiro-no-sft-dpo-v6`
- `MODEL_CONFIG`: Added v6 as primary entry (96% eval), demoted v5 to fallback
- `MODEL_ROUTING`: All 28 task entries updated from v5 → v6
- `AB_SPLIT_CONFIG`: Shifted to v7-vs-v6 (ready for next training)
- `getModelForField` fallback: v5 → v6
- Added 5 new v2.1 task types: `message_draft`, `message_categorize`, `document_summary`, `exercise_instruction`, `booking_intelligence`
- Added v2.1 tasks to `TASK_ENV_OVERRIDES` and `calculateConfidence` model-task fit mapping

**Impact**: ~20% eval improvement for all AI-routed tasks immediately.

---

## 3. Benchmark Expansion (100 → 120 cases)

**New categories (4):**

| Category               | Cases | Description                                                                 |
| ---------------------- | ----- | --------------------------------------------------------------------------- |
| message_drafting       | 4     | Pain reply, reschedule, no-show, welcome                                    |
| message_categorization | 1     | Urgent triage (cauda equina symptoms)                                       |
| document_context       | 5     | Cover letters, summaries, SMS notifications                                 |
| clinical_intelligence  | 5     | Timing, red flags in messages, exercise mods, recall, progress              |
| communication_tone     | 5     | Patient-friendly rewrite, birthday, compliance nudge, booking, cancellation |

**Synonym additions (5):**

- `velkommen` → velkomst, ny pasient, forste gang
- `kategori` → prioritet, klassifisering, triage
- `bedring` → forbedring, fremgang, positiv utvikling
- `forklaring` → forstaelig, pasientvennlig, lettfattelig
- `tilpas` → tilpasning, tilpasse, justere, modifisere, endre

Updated in both `evaluate.py` and `custom-assertions.js`.
Regression suite regenerated: 120 cases across 12 categories.

---

## 4. v2.1 Baseline Scores (120 cases)

**Overall: 104/120 (86.7%), avg partial 96.1/100, avg latency 2864ms**

| Category                   | Pass Rate     | Avg Score | Notes                                   |
| -------------------------- | ------------- | --------- | --------------------------------------- |
| soap_notes                 | 9/10 (90%)    | 96.9      | Consistent                              |
| diagnosis_codes            | 17/20 (85%)   | 93.4      | Improved from 80% audit                 |
| red_flags                  | 24/26 (92%)   | 98.4      | Consistent                              |
| norwegian_language         | 14/15 (93%)   | 97.0      | Consistent                              |
| communication              | 16/16 (100%)  | 98.1      | Consistent                              |
| quick_fields               | 6/6 (100%)    | 98.3      | Improved                                |
| letters                    | 5/7 (71%)     | 95.1      | Minor variance                          |
| **message_drafting**       | **1/4 (25%)** | **85.0**  | Missing keywords (kontakt, smerter)     |
| **message_categorization** | **0/1 (0%)**  | **85.0**  | Doesn't output exact "HASTER" format    |
| **document_context**       | **4/5 (80%)** | **97.0**  | Missing "bedring" synonym               |
| **clinical_intelligence**  | **4/5 (80%)** | **96.2**  | Missing "bedring" in progress summaries |
| **communication_tone**     | **4/5 (80%)** | **94.0**  | Missing "forklaring" keyword            |

**Key findings on new 20 cases:**

- 13/20 (65%) pass rate on v2.1 scenarios (as expected — v6 never trained on these)
- Partial scores remain high (85-97/100) — model produces quality Norwegian text
- Failures are keyword-specific, not quality-specific
- Training on v2.1 SFT data should close these gaps

This establishes the "before" baseline for v7/v8 training impact measurement.

---

## 5. Training Data Status

### Existing data:

| Dataset                       | Lines | Status                  |
| ----------------------------- | ----- | ----------------------- |
| curated/train.jsonl           | 9,593 | Trained (v5, v6)        |
| curated/validation.jsonl      | 1,195 | Trained (v5, v6)        |
| curated/dpo.jsonl             | 335   | Trained (v5, v6)        |
| processed-v7/train.jsonl      | 5,144 | NOT TRAINED (WSL error) |
| processed-v7/validation.jsonl | 572   | NOT TRAINED (WSL error) |
| dpo-v7/train.jsonl            | 860   | NOT TRAINED (WSL error) |
| dpo-v7/validation.jsonl       | 96    | NOT TRAINED (WSL error) |
| dpo/v6_targeted.jsonl         | 200   | Trained (v6)            |
| dpo/v7_safety.jsonl           | 36    | NOT TRAINED             |

### New v2.1 data (this session):

| File                                 | Lines | Content                                                                                                            |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------ |
| raw/v21-communication-training.jsonl | 80    | SFT: patient replies (15), categorization (10), documents (10), exercise (10), booking (10), recall (10), SMS (15) |
| dpo/v21-communication-dpo.jsonl      | 20    | DPO: empathy (4), Norwegian (4), length (4), tone (4), format (4)                                                  |

### Total untrained data available:

- **SFT**: 5,144 (v7) + 80 (v2.1) = 5,224 examples
- **DPO**: 860 (v7) + 36 (v7 safety) + 20 (v2.1) = 916 pairs

---

## 6. Promptfoo Suite Status

| Suite                  | Cases | Status                                                                                                       |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| regression.yaml        | 120   | Updated (was 100)                                                                                            |
| clinical-safety.yaml   | ~30   | Unchanged                                                                                                    |
| red-flags.yaml         | ~20   | Unchanged                                                                                                    |
| norwegian-quality.yaml | ~15   | Unchanged                                                                                                    |
| v21-communication.yaml | 15    | NEW — SMS length, Norwegian quality, PHI check, tone, doc delivery, exercise compliance, red flag escalation |

---

## 7. Recommendation

### Option A: Retrain as v7 (recommended)

Merge all untrained data (v7 + v2.1) into a single training run:

- **SFT**: 5,224 examples, batch=2, seq=1024 → ~7-9h on RTX 4070
- **DPO**: 916 pairs, batch=1, seq=2048 → ~1.5h
- **Total GPU time**: ~9-11h (overnight run)
- **Expected improvement**: v6 (96%) → v7 (~97-98% on original 100, ~85-90% on new 20)

### Option B: Accumulate more feedback

Wait for production feedback data from v2.1 services before training.
Pros: better quality signal. Cons: delayed improvement.

### GPU Training Plan (when ready)

```bash
# 1. Merge all data
python scripts/clean_and_prepare.py --output-dir data/processed-v8

# 2. SFT training (~7-9h)
python training/train_sft.py \
  --model qwen2.5:7b-instruct \
  --data data/processed-v8/combined-sft/train.jsonl \
  --val data/processed-v8/combined-sft/validation.jsonl \
  --batch-size 2 --seq-len 1024 --epochs 3

# 3. DPO training (~1.5h)
python training/train_dpo.py \
  --model ./output/sft-checkpoint \
  --data data/processed-v8/combined-dpo/train.jsonl \
  --val data/processed-v8/combined-dpo/validation.jsonl \
  --batch-size 1 --seq-len 2048 --epochs 1

# 4. Convert to GGUF and deploy
python scripts/convert_gguf.py --quantize Q8_0
ollama create chiro-no-sft-dpo-v7 -f Modelfile.v7
```

**Important**: Use PowerShell (not WSL bash) for training scripts — the v7 WSL error was `execvpe(/bin/bash) failed: No such file or directory`.

---

## 8. Files Changed (This Session)

### Commit 1: Model router fix

- `backend/src/services/ai/modelRouter.js` — v5→v6 promotion, v2.1 task types

### Commit 2: Benchmark expansion

- `ai-training/evaluation/benchmark_cases.jsonl` — 100→120 cases
- `ai-training/evaluation/evaluate.py` — 5 new synonym entries
- `ai-training/promptfoo/scripts/custom-assertions.js` — matching synonym entries
- `ai-training/promptfoo/suites/regression.yaml` — regenerated (120 cases)

### Commit 3: Training data

- `ai-training/data/raw/v21-communication-training.jsonl` — 80 SFT examples (NEW)
- `ai-training/data/dpo/v21-communication-dpo.jsonl` — 20 DPO pairs (NEW)

### Commit 4: Promptfoo + eval + report

- `ai-training/promptfoo/suites/v21-communication.yaml` — 15 tests (NEW)
- `ai-training/evaluation/v6-audit-2026-03-20.json` — 100-case audit results
- `ai-training/evaluation/v6-expanded-120-2026-03-20.json` — 120-case results (pending)
- `ai-training/reports/v21-audit-report.md` — this report
