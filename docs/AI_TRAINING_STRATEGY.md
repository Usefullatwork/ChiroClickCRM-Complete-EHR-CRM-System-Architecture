# ChiroClick AI Training Strategy

## Comprehensive Implementation Plan (2026-01-29)

This document consolidates all research findings (topics 1-18) into an actionable implementation plan for the ChiroClick AI system.

---

## Executive Summary

### Key Decisions Based on Research

| Component | Current | Recommended | Why |
|-----------|---------|-------------|-----|
| Norwegian Model | Gemma 3 4B | **NorwAI-Mistral-7B** | 95% vs 82% accuracy after fine-tuning |
| Medical Model | MedGemma 4B | **MedGemma 4B** (keep) | Best for 12GB RAM, 85-88% after tuning |
| Fast Model | Llama 3.2 3B | **Llama 3.2 3B** (keep) | Good for autocomplete |
| Default Model | Mistral 7B | **Mistral 7B** (keep) | General clinical documentation |
| Vector DB | None (full-text only) | **pgvector** | 471 QPS, fits existing PostgreSQL |
| Embeddings | None | **e5-multilingual + NorDeClin** | Best Norwegian medical semantics |
| Training | System prompts | **LoRA fine-tuning** | 40%+ improvement in accuracy |

### RAM Constraint (12GB)

All models fit with Q4_K_M quantization:

| Model | Quantized Size | Use Case |
|-------|---------------|----------|
| NorwAI-Mistral-7B | ~4.5GB | Norwegian clinical documentation |
| MedGemma 4B | ~2.5GB | Red flags, clinical safety |
| Llama 3.2 3B | ~2GB | Quick autocomplete |
| Mistral 7B | ~4.5GB | General clinical |

**Strategy:** Load one model at a time via task routing (your current approach works well).

---

## Part 1: Model Selection (Research Topics 1, 3, 4)

### 1.1 Norwegian Language Model

**CHANGE: Gemma 3 4B → NorwAI-Mistral-7B**

| Model | Norwegian Baseline | After Fine-tuning | Why |
|-------|-------------------|-------------------|-----|
| Gemma 3 4B | ~70% | ~82-85% | Limited Norwegian training (~2-3%) |
| **NorwAI-Mistral-7B** | ~90% | **~95%** | 88B Norwegian tokens, healthcare-aware |
| Viking 7B | ~78% | ~88-90% | Good alternative for multilingual |

**Key findings from NorwAI Technical Report (January 2026):**
- NorwAI-Mistral-7B continually pretrained on 88B Norwegian tokens
- Healthcare-aware training (NRK/Schibsted partnership includes medical content)
- Custom Norwegian-aware tokenizer (64k-158k vocab)
- Competitive with GPT-4 baseline on Norwegian tasks

**Implementation:**
```bash
# Get NorwAI-Mistral-7B
ollama pull NorwAI/NorwAI-Mistral-7B-Instruct

# Or from HuggingFace for fine-tuning
MODEL_NAME = "NorwAI/NorwAI-Mistral-7B-Instruct"
```

### 1.2 Medical Model

**KEEP: MedGemma 4B** (RAM constraint prevents 27B)

| Model | MedQA Score | After Fine-tuning | RAM (Q4_K_M) |
|-------|-------------|-------------------|--------------|
| MedGemma 27B | 87.7% | ~92-94% | ~5.5GB (too large) |
| **MedGemma 4B** | 64.4% | **~85-88%** | ~2.5GB ✅ |
| BioMistral 7B | ~65-70% | ~75-80% | ~4.5GB |

**Why MedGemma 4B is sufficient:**
- Fine-tuning adds +15-25 percentage points
- Low hallucination rate with proper training
- Fits comfortably in 12GB alongside other models

### 1.3 Model Configuration Summary

```javascript
// Updated model routing for ai.js
const MODEL_CONFIG = {
  'chiro-norwegian': {
    base: 'NorwAI/NorwAI-Mistral-7B-Instruct',  // CHANGED
    quantization: 'q4_k_m',
    size: '4.5GB',
    tasks: ['norwegian_text', 'patient_communication', 'referral_letter', 'soap_notes']
  },
  'chiro-medical': {
    base: 'google/medgemma-4b',
    quantization: 'q4_k_m',
    size: '2.5GB',
    tasks: ['red_flag_analysis', 'differential_diagnosis', 'treatment_safety']
  },
  'chiro-fast': {
    base: 'meta-llama/Llama-3.2-3B-Instruct',
    quantization: 'q4_k_m',
    size: '2GB',
    tasks: ['autocomplete', 'spell_check', 'quick_suggestion']
  },
  'chiro-no': {
    base: 'mistralai/Mistral-7B-Instruct-v0.3',
    quantization: 'q4_k_m',
    size: '4.5GB',
    tasks: ['clinical_summary', 'diagnosis_suggestion', 'general']
  }
};
```

---

## Part 2: Training Pipeline (Research Topics 1, 2)

### 2.1 Why LoRA Fine-Tuning

**Current state:** System prompts only (1-time behavioral instructions)
**After LoRA:** 5,600+ examples teaching specific patterns, terminology, clinical reasoning

**Quantified improvements (2025 medical AI study):**
- Fine-tuned Mistral-7B outperformed zero-shot by **40%+** in clinical accuracy
- Combined fine-tuning + RAG achieved even better results
- LoRA uses only 1-10% of trainable parameters

### 2.2 Training Configuration

**LoRA Configuration (Medical-Optimized):**
```python
lora_config = LoraConfig(
    r=16,                    # Rank: clinical domain needs adequate capacity
    lora_alpha=16,           # Scaling factor
    target_modules=[         # All 7 modules for best results
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    lora_dropout=0.05,       # Low dropout for clinical
    bias="none",
    task_type="CAUSAL_LM",
)
```

**Training Hyperparameters:**
```python
training_args = SFTConfig(
    learning_rate=2e-4,              # Lower LR for medical accuracy
    lr_scheduler_type="linear",
    warmup_steps=50,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,   # Effective batch = 16
    num_train_epochs=3,              # Optimal for 5,600 examples
    bf16=True,
    gradient_checkpointing=True,
    optim="adamw_8bit",
)
```

### 2.3 Data Format (ChatML)

**Convert existing JSONL to ChatML:**

```json
{
  "messages": [
    {"role": "system", "content": "Du er en klinisk dokumentasjonsspesialist..."},
    {"role": "user", "content": "[Patient case, exam findings]"},
    {"role": "assistant", "content": "[SOAP note / clinical documentation]"}
  ]
}
```

### 2.4 Training Pipeline with Unsloth

Unsloth provides 2-5x faster training with direct GGUF export:

```python
# finetune_clinical.py (Unsloth version)
from unsloth import FastLanguageModel, is_bfloat16_supported
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

MODEL_NAME = "NorwAI/NorwAI-Mistral-7B-Instruct"

# Load with LoRA
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=2048,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    use_rslora=True,  # Rank-Stabilized LoRA
)

# Train
trainer = SFTTrainer(
    model=model,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    args=SFTConfig(
        learning_rate=2e-4,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        bf16=is_bfloat16_supported(),
        gradient_checkpointing=True,
    ),
)

trainer.train()

# Merge and export to GGUF
model = model.merge_and_unload()
model.save_pretrained_gguf(
    "chiro-norwegian.gguf",
    tokenizer,
    quantization_method="q4_k_m"
)
```

### 2.5 Expected Results

| Metric | Before (System Prompts) | After (LoRA Fine-tuning) |
|--------|------------------------|-------------------------|
| Clinical Accuracy | ~60-70% | ~85-95% |
| Terminology Consistency | ~70% | ~98% |
| Hallucination Rate | ~8-12% | ~2-3% |
| Documentation Structure | Inconsistent | Matches your style |

---

## Part 3: RAG Implementation (Research Topics 5, 6, 7)

### 3.1 Vector Database: pgvector

**Why pgvector over alternatives:**

| Database | QPS @ 50M vectors | Cost/Month | Your Setup |
|----------|-------------------|------------|------------|
| **pgvector** | 471 | ~$200-300 | Already have PostgreSQL ✅ |
| Pinecone | 40 | ~$1,000+ | New infrastructure |
| Weaviate | 25 | ~$400-600 | New infrastructure |
| Chroma | 12 | Free (local) | Limited scale |

**pgvectorscale (May 2025):** 11.4x performance improvement with DiskANN index.

### 3.2 Schema for Clinical Chunks

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Clinical chunks table
CREATE TABLE clinical_chunks (
    chunk_id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    visit_date DATE NOT NULL,
    note_type VARCHAR(100),
    soap_section VARCHAR(50),  -- 'Subjective', 'Objective', 'Assessment', 'Plan'
    chunk_index INT,
    chunk_text TEXT NOT NULL,
    embedding vector(1024) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Full-text search for hybrid
    tsvector_column tsvector GENERATED ALWAYS AS (
        to_tsvector('norwegian', chunk_text)
    ) STORED
);

-- Vector index (HNSW)
CREATE INDEX idx_chunk_embedding ON clinical_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-text index
CREATE INDEX idx_chunk_tsvector ON clinical_chunks
USING GIN (tsvector_column);
```

### 3.3 SOAP-Aware Chunking

**The problem with naive chunking:** Splits SOAP sections in wrong places.

**Solution: Hierarchical + SOAP-aware chunking (CLI-RAG framework):**

```python
class SOAPChunker:
    """Hierarchical chunking respecting SOAP structure"""

    CHUNK_CONFIG = {
        'Subjective': {'target_tokens': 500, 'overlap': 50},
        'Objective': {'target_tokens': 600, 'overlap': 75},
        'Assessment': {'target_tokens': 400, 'overlap': 50},
        'Plan': {'target_tokens': 300, 'overlap': 25},
    }

    def chunk_note(self, note: str, patient_id: str, visit_date: str):
        # 1. Parse SOAP structure
        sections = self.parse_soap_structure(note)

        # 2. Chunk within each section
        chunks = []
        for section_name, section_text in sections.items():
            config = self.CHUNK_CONFIG.get(section_name, {'target_tokens': 500, 'overlap': 50})
            sub_chunks = self.chunk_section(section_text, **config)

            for i, chunk_text in enumerate(sub_chunks):
                chunks.append({
                    'patient_id': patient_id,
                    'visit_date': visit_date,
                    'section': section_name,
                    'chunk_index': i,
                    'text': chunk_text,
                })

        return chunks
```

### 3.4 Norwegian Medical Embeddings

**Best option: e5-multilingual-large + NorDeClin-BERT ensemble**

| Model | Norwegian Score | Medical Specialization |
|-------|----------------|----------------------|
| e5-multilingual-large | 82.3% | Standard domain |
| **e5-multilingual + medical finetune** | 87.6% | Medical-specific |
| **NorDeClin-BERT** | 89.2% | Norwegian clinical |

**Ensemble approach (60% e5, 40% NorDeClin):**

```python
class MedicalEmbeddingEnsemble:
    def embed_text(self, text: str, weights=(0.6, 0.4)):
        e5_emb = self.e5_model.encode(f"Represent this medical document: {text}")
        nordeclin_emb = self.nordeclin_model.encode(text)

        # Ensemble
        ensemble = weights[0] * e5_emb + weights[1] * nordeclin_emb
        return ensemble / np.linalg.norm(ensemble)
```

### 3.5 Hybrid Search (BM25 + Vector)

```sql
-- Hybrid query with alpha=0.7 (70% vector, 30% keyword)
WITH vector_search AS (
    SELECT chunk_id, chunk_text, soap_section,
           1 - (embedding <-> $1) as vector_score
    FROM clinical_chunks
    ORDER BY embedding <-> $1
    LIMIT 10
),
keyword_search AS (
    SELECT chunk_id, chunk_text, soap_section,
           ts_rank(tsvector_column, plainto_tsquery('norwegian', $2)) as keyword_score
    FROM clinical_chunks
    WHERE tsvector_column @@ plainto_tsquery('norwegian', $2)
    LIMIT 10
)
SELECT chunk_id, chunk_text,
       0.7 * COALESCE(v.vector_score, 0) + 0.3 * COALESCE(k.keyword_score, 0) as hybrid_score
FROM vector_search v
FULL OUTER JOIN keyword_search k USING (chunk_id)
ORDER BY hybrid_score DESC
LIMIT 5;
```

---

## Part 4: Safety & Quality (Research Topics 9-12)

### 4.1 Input Guardrails (NeMo Guardrails)

**Three-level input filtering:**

```yaml
# guardrails_config.yml
rails:
  input:
    flows:
      - check_hipaa           # Block patient data access attempts
      - check_unauthorized_diagnosis  # Block diagnosis requests
      - check_medication_advice       # Block medication recommendations
      - check_jailbreak              # Block prompt injection
```

**Implementation:**
```python
class ClinicalInputGuardrails:
    def validate_input(self, user_input: str):
        # Level 1: Regex (fast)
        if self._regex_check(user_input):
            return False, "Blocked by pattern match"

        # Level 2: NeMo ML classifier
        if self._nemo_check(user_input):
            return False, "Blocked by policy"

        # Level 3: Clinical heuristics
        if self._clinical_heuristics_check(user_input):
            return False, "Blocked by clinical safety"

        return True, "Safe"
```

### 4.2 Hallucination Detection (CHECK Framework)

**Fact-checking against EHR:**

```python
class ClinicalFactChecker:
    def check_generated_summary(self, generated: str, source_ehr: str):
        # 1. Decompose to atomic propositions
        propositions = self.decompose(generated)

        # 2. Extract facts from source EHR
        ehr_facts = self.extract_ehr_facts(source_ehr)

        # 3. Check each proposition
        results = []
        for prop in propositions:
            result = self.check_proposition(prop, ehr_facts)
            results.append(result)

        hallucination_score = sum(1 for r in results if not r.is_supported) / len(results)
        return results, hallucination_score
```

**Validation types:**
- Temporal consistency (timeline logic)
- Numerical accuracy (dosages, lab values)
- Logical coherence (diagnosis implies symptoms)
- Semantic validity (real medical terms)

### 4.3 Multi-Model Routing (MoMA)

**Intelligent routing based on query characteristics:**

```python
class MoMARouter:
    def route_query(self, query: str, optimization_target="balanced"):
        # Extract query features
        features = {
            'complexity': self.estimate_complexity(query),
            'domain_specificity': self.detect_domain(query),
            'requires_reasoning': self.detect_reasoning_need(query),
            'documentation_focus': self.detect_doc_focus(query),
        }

        # Score each model
        model_scores = {}
        for model_name, profile in self.models.items():
            score = self.score_model(features, profile)
            model_scores[model_name] = score

        # Select based on optimization target
        if optimization_target == "quality":
            return max(model_scores, key=model_scores.get)
        elif optimization_target == "cost":
            return min(model_scores, key=lambda m: self.models[m].cost)
        else:  # balanced
            return max(model_scores, key=lambda m: model_scores[m] / self.models[m].cost)
```

### 4.4 Confidence Calibration

**Problem:** Raw model confidence doesn't match actual accuracy.

**Solution: Temperature scaling + clinical risk factors:**

```python
class ClinicalConfidenceCalibrator:
    RISK_FACTORS = {
        'involves_medication': -0.15,
        'involves_diagnosis': -0.20,
        'involves_dose_adjustment': -0.25,
        'multiple_conflicting_sources': -0.12,
    }

    def calibrate(self, raw_confidence: float, task_type: str, clinical_factors: dict):
        # Temperature scaling
        temperature = self.temperature_by_task[task_type]
        calibrated = self.temperature_scale(raw_confidence, temperature)

        # Apply risk factors
        for factor, present in clinical_factors.items():
            if present and factor in self.RISK_FACTORS:
                calibrated += self.RISK_FACTORS[factor]

        return max(0, min(1, calibrated))
```

---

## Part 5: Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] **Data Preparation**
  - [ ] Convert JSONL to ChatML format
  - [ ] Validate data quality and diversity
  - [ ] Split: 80% train, 10% val, 10% test
  - [ ] Remove PII, anonymize clinical details

- [ ] **Environment Setup**
  - [ ] Install Unsloth + dependencies
  - [ ] Set up training GPU (cloud or local)
  - [ ] Configure pgvector extension in PostgreSQL

### Phase 2: Training (Week 2-3)

- [ ] **Fine-tune NorwAI-Mistral-7B** (Norwegian)
  - [ ] Train with LoRA (3 epochs)
  - [ ] Evaluate on test set
  - [ ] Export to GGUF (Q4_K_M)
  - [ ] Deploy to Ollama

- [ ] **Fine-tune MedGemma 4B** (Medical)
  - [ ] Same pipeline
  - [ ] Focus on red flag detection accuracy

### Phase 3: RAG (Week 3-4)

- [ ] **pgvector Setup**
  - [ ] Create clinical_chunks table
  - [ ] Implement SOAP-aware chunking
  - [ ] Set up e5-multilingual embeddings

- [ ] **Hybrid Search**
  - [ ] Implement BM25 + vector search
  - [ ] Add clinical reranking heuristics
  - [ ] Test retrieval quality

### Phase 4: Safety (Week 4-5)

- [ ] **Input Guardrails**
  - [ ] Implement regex patterns for HIPAA/diagnosis/medication
  - [ ] Add NeMo Guardrails ML classifier
  - [ ] Test with adversarial inputs

- [ ] **Hallucination Detection**
  - [ ] Implement fact-checking module
  - [ ] Connect to EHR data for verification
  - [ ] Set up confidence calibration

### Phase 5: Integration (Week 5-6)

- [ ] **Update ai.js Service**
  - [ ] Update MODEL_ROUTING with new models
  - [ ] Add RAG retrieval to generateCompletion
  - [ ] Integrate safety pipeline

- [ ] **A/B Testing**
  - [ ] Compare old vs new system
  - [ ] Gather clinician feedback
  - [ ] Iterate on problem areas

---

## File Structure

```
ai-training/
├── data/
│   ├── raw/                     # Original JSONL (5,600+ examples)
│   ├── processed/               # ChatML formatted
│   │   ├── train.jsonl
│   │   ├── validation.jsonl
│   │   └── test.jsonl
│   └── scripts/
│       ├── convert_to_chatml.py
│       └── soap_chunker.py
├── training/
│   ├── train_lora.py            # Standard transformers
│   ├── train_unsloth.py         # Unsloth (faster)
│   ├── export_to_gguf.py
│   └── requirements.txt
├── rag/
│   ├── embeddings.py            # e5 + NorDeClin ensemble
│   ├── chunker.py               # SOAP-aware chunking
│   └── retriever.py             # Hybrid search
├── safety/
│   ├── guardrails.py            # Input validation
│   ├── fact_checker.py          # Hallucination detection
│   ├── confidence.py            # Calibration
│   └── guardrails_config.yml    # NeMo config
├── models/
│   ├── lora-checkpoints/
│   ├── merged/
│   └── gguf/
└── evaluation/
    ├── evaluate.py
    └── test_cases.jsonl
```

---

## Quick Reference: Commands

```bash
# 1. Convert data
cd ai-training/data/scripts
python convert_to_chatml.py

# 2. Train (with Unsloth)
cd ai-training/training
pip install -r requirements.txt
python train_unsloth.py --model norwegian --data ../data/processed

# 3. Export to GGUF
python export_to_gguf.py --model chiro-norwegian-lora-final --quantize q4_k_m

# 4. Deploy to Ollama
ollama create chiro-norwegian -f models/gguf/Modelfile.chiro-norwegian

# 5. Test
ollama run chiro-norwegian "Skriv SOAP-notat for pasient med BPPV høyre bakre kanal"
```

---

## Expected Outcomes

| Metric | Current | Target |
|--------|---------|--------|
| Norwegian clinical accuracy | ~70% | ~95% |
| Medical safety (red flags) | ~80% | ~95% |
| Hallucination rate | ~8-12% | ~2-3% |
| RAG retrieval relevance | N/A | >85% |
| Response latency | ~500ms | <1s (with RAG) |
| Cost per 1k tokens | Base | 30-40% savings via routing |

---

## References

### Research Papers
- LoRA: Low-Rank Adaptation of Large Language Models (2021)
- QLoRA: Efficient Finetuning of Quantized LLMs (2023)
- CLI-RAG: Clinical RAG Framework for SOAP Notes (2025)
- CHECK: Continuous Hallucination Monitoring (Nature, 2025)
- MoMA: Mixture of Models & Agents (2025)

### Technical Reports
- NorwAI Technical Report (January 2026)
- pgvectorscale Benchmarks (May 2025)
- MedGemma Release Notes (January 2026)

### Documentation
- [Ollama Model Creation](https://ollama.ai/docs/create)
- [Hugging Face PEFT](https://huggingface.co/docs/peft)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails)

---

*Document created: 2026-01-29*
*Last updated: 2026-01-29*
*Research topics covered: 1-18*
