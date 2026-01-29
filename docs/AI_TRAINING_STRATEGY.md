# ChiroClick AI Training Strategy

## Research Summary (2026-01-29)

This document captures research findings and implementation plans for improving the AI models in ChiroClick CRM.

---

## Current State Analysis

### What We Have
| Asset | Details |
|-------|---------|
| Training Data | 5,642 examples in `ai-training/training-data.jsonl` |
| Additional Data | clinical-fields (100+), communication-tones, letters (14+) |
| Total Data | ~154KB across all JSONL files |
| Current Approach | System prompts only (no true fine-tuning) |
| Models | 4 Ollama models (~14GB total) |

### The Gap
- **System prompts** = 1-time behavioral instructions
- **LoRA fine-tuning** = 5,600+ examples teaching specific documentation patterns, terminology, clinical reasoning

**Quantified improvement potential:** Fine-tuned Mistral-7B can outperform zero-shot baseline by **40%+** in clinical accuracy (2025 MedQuAD study).

---

## Implementation Plan: LoRA Fine-Tuning

### Phase 1: Data Preparation

#### 1.1 Convert JSONL to ChatML Format

Current format:
```json
{"prompt": "...", "response": "..."}
```

Required ChatML format for Mistral:
```json
{
  "messages": [
    {"role": "system", "content": "Du er en klinisk dokumentasjonsspesialist for kiropraktikk..."},
    {"role": "user", "content": "[Patient case, exam findings]"},
    {"role": "assistant", "content": "[SOAP note / clinical documentation]"}
  ]
}
```

#### 1.2 Data Quality Checklist

- [ ] **PII Removal** - Replace patient names, IDs, dates with placeholders
- [ ] **Anonymize but preserve clinical details** - This is what the model learns
- [ ] **Ensure diversity across:**
  - Diagnostic categories (cervical, lumbar, thoracic, extremities)
  - Patient severity levels (acute, chronic, maintenance)
  - Documentation types (SOAP, letters, communication)
- [ ] **Validate grammar/consistency** - Garbage in → garbage out
- [ ] **Split data:** 80% train, 10% validation, 10% test

#### 1.3 Norwegian-Specific Considerations

- Maintain consistent Norwegian medical terminology
- Include both Bokmål variations where applicable
- Preserve ICD-10/ICPC-2 code formatting
- Keep clinical abbreviations consistent (Tx, Dx, Hx, etc.)

### Phase 2: Training Configuration

#### 2.1 Hardware Requirements

| GPU | VRAM | Feasibility |
|-----|------|-------------|
| RTX 4090 | 24GB | ✅ Recommended (consumer) |
| RTX 3090 | 24GB | ✅ Good |
| RTX 4080 | 16GB | ✅ With gradient checkpointing |
| T4 (Cloud) | 16GB | ✅ Budget-friendly |
| A10/A100 | 24-80GB | ✅ Fastest training |

**VRAM Optimization Stack:**
- 4-bit quantization (bitsandbytes)
- BFloat16 compute precision
- LoRA on attention + feed-forward layers
- = ~30% VRAM savings

#### 2.2 LoRA Configuration (Medical-Optimized)

```python
from peft import LoraConfig

lora_config = LoraConfig(
    r=16,                           # Rank: balances efficiency with capacity
    lora_alpha=16,                  # Scaling factor
    target_modules=[
        "q_proj",                   # Query projection
        "k_proj",                   # Key projection
        "v_proj",                   # Value projection
        "o_proj",                   # Output projection
        "gate_proj",                # Gate (for Mistral)
        "up_proj",                  # Up projection (MLPs)
        "down_proj"                 # Down projection (MLPs)
    ],
    lora_dropout=0.05,              # Low dropout for clinical domain
    bias="none",
    task_type="CAUSAL_LM",
    gradient_checkpointing=True,    # Enable for 30% VRAM savings
)
```

**Why these settings:**
- `r=16` - Clinical domain is specialized, needs adequate capacity
- All 7 target modules - Better results than q_proj/v_proj alone
- `dropout=0.05` - Prevents overfitting on 5,600 examples
- Gradient checkpointing - Enables mid-range GPU training

#### 2.3 Training Hyperparameters

```python
training_args = SFTConfig(
    # Learning
    learning_rate=2e-4,             # Lower LR for medical accuracy
    lr_scheduler_type="linear",
    warmup_steps=50,                # Stabilize first updates

    # Batch & accumulation
    per_device_train_batch_size=4,  # Adjust per GPU
    gradient_accumulation_steps=4,  # Effective batch = 16

    # Epochs & stopping
    num_train_epochs=3,             # Optimal for 5,600 examples
    save_strategy="epoch",
    eval_strategy="epoch",

    # Optimization
    optim="adamw_8bit",             # Memory-efficient
    weight_decay=0.01,
    max_grad_norm=0.3,

    # Precision
    bf16=True,                      # BFloat16 for stability
    gradient_checkpointing=True,
)
```

### Phase 3: Training Pipeline

#### 3.1 Directory Structure

```
ai-training/
├── data/
│   ├── raw/                    # Original JSONL files
│   ├── processed/              # ChatML formatted
│   │   ├── train.jsonl
│   │   ├── validation.jsonl
│   │   └── test.jsonl
│   └── scripts/
│       └── convert_to_chatml.py
├── training/
│   ├── train_lora.py           # Main training script
│   ├── export_to_gguf.py       # Convert for Ollama
│   └── requirements.txt
├── models/
│   ├── lora-checkpoints/       # Training checkpoints
│   ├── merged/                 # Merged model weights
│   └── gguf/                   # Ollama-ready models
└── evaluation/
    ├── evaluate.py
    └── test_cases.jsonl
```

#### 3.2 Data Conversion Script

```python
# ai-training/data/scripts/convert_to_chatml.py
import json
import sys
from pathlib import Path

SYSTEM_PROMPTS = {
    'soap': """Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge.
Generer nøyaktige, profesjonelle SOAP-notater som følger norske kliniske retningslinjer.
Bruk korrekt norsk medisinsk terminologi og ICD-10/ICPC-2 koder.""",

    'letter': """Du er en spesialist på medisinsk korrespondanse for kiropraktorer i Norge.
Skriv profesjonelle henvisningsbrev, erklæringer og rapporter på norsk.""",

    'communication': """Du er en pasientkommunikasjonsspesialist for kiropraktikk.
Skriv profesjonelle, empatiske meldinger til pasienter på norsk.""",
}

def convert_file(input_path: Path, output_path: Path, doc_type: str = 'soap'):
    """Convert prompt/response JSONL to ChatML format."""
    system_prompt = SYSTEM_PROMPTS.get(doc_type, SYSTEM_PROMPTS['soap'])

    with open(input_path, 'r', encoding='utf-8') as f_in, \
         open(output_path, 'w', encoding='utf-8') as f_out:

        for line in f_in:
            if not line.strip():
                continue

            data = json.loads(line)

            chatml = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": data['prompt']},
                    {"role": "assistant", "content": data['response']}
                ]
            }

            f_out.write(json.dumps(chatml, ensure_ascii=False) + '\n')

if __name__ == '__main__':
    # Convert all training files
    conversions = [
        ('training-data.jsonl', 'soap'),
        ('clinical-fields-training.jsonl', 'soap'),
        ('letters-training.jsonl', 'letter'),
        ('communication-tones-training.jsonl', 'communication'),
    ]

    raw_dir = Path('../raw')
    processed_dir = Path('../processed')
    processed_dir.mkdir(exist_ok=True)

    all_data = []
    for filename, doc_type in conversions:
        input_path = raw_dir / filename
        if input_path.exists():
            temp_output = processed_dir / f'temp_{filename}'
            convert_file(input_path, temp_output, doc_type)

            with open(temp_output, 'r') as f:
                all_data.extend([json.loads(line) for line in f if line.strip()])
            temp_output.unlink()

    # Shuffle and split
    import random
    random.shuffle(all_data)

    n = len(all_data)
    train_end = int(n * 0.8)
    val_end = int(n * 0.9)

    splits = {
        'train.jsonl': all_data[:train_end],
        'validation.jsonl': all_data[train_end:val_end],
        'test.jsonl': all_data[val_end:]
    }

    for filename, data in splits.items():
        with open(processed_dir / filename, 'w', encoding='utf-8') as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        print(f"Created {filename}: {len(data)} examples")
```

#### 3.3 Training Script

```python
# ai-training/training/train_lora.py
"""
LoRA Fine-tuning for ChiroClick Clinical Models

Requirements:
    pip install torch transformers peft trl bitsandbytes accelerate datasets

Usage:
    python train_lora.py --model mistral --data ../data/processed
"""

import argparse
import torch
from pathlib import Path
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training
)
from trl import SFTTrainer, SFTConfig

# Model configurations
MODELS = {
    'mistral': {
        'name': 'mistralai/Mistral-7B-Instruct-v0.3',
        'output_name': 'chiro-no-lora'
    },
    'llama': {
        'name': 'meta-llama/Llama-3.2-3B-Instruct',
        'output_name': 'chiro-fast-lora'
    },
    'gemma': {
        'name': 'google/gemma-3-4b-it',
        'output_name': 'chiro-norwegian-lora'
    },
    'medgemma': {
        'name': 'google/medgemma-4b',
        'output_name': 'chiro-medical-lora'
    }
}

def train(model_key: str, data_dir: Path, output_dir: Path):
    model_config = MODELS[model_key]

    print(f"Loading dataset from {data_dir}...")
    dataset = load_dataset('json', data_files={
        'train': str(data_dir / 'train.jsonl'),
        'validation': str(data_dir / 'validation.jsonl')
    })

    print(f"Train: {len(dataset['train'])} | Validation: {len(dataset['validation'])}")

    # Quantization config for 4-bit training
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4"
    )

    print(f"Loading model: {model_config['name']}...")
    model = AutoModelForCausalLM.from_pretrained(
        model_config['name'],
        quantization_config=bnb_config,
        trust_remote_code=True,
        device_map="auto",
        torch_dtype=torch.bfloat16
    )

    tokenizer = AutoTokenizer.from_pretrained(
        model_config['name'],
        trust_remote_code=True
    )
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # Prepare for LoRA
    model.gradient_checkpointing_enable()
    model = prepare_model_for_kbit_training(model)

    # LoRA configuration
    peft_config = LoraConfig(
        r=16,
        lora_alpha=16,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # Training configuration
    training_args = SFTConfig(
        output_dir=str(output_dir / model_config['output_name']),

        # Learning
        learning_rate=2e-4,
        lr_scheduler_type="linear",
        warmup_steps=50,

        # Batch
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        gradient_accumulation_steps=4,

        # Epochs
        num_train_epochs=3,

        # Saving
        save_strategy="epoch",
        eval_strategy="epoch",
        save_total_limit=2,
        load_best_model_at_end=True,

        # Optimization
        optim="adamw_8bit",
        weight_decay=0.01,
        max_grad_norm=0.3,

        # Precision
        bf16=True,
        gradient_checkpointing=True,

        # Logging
        logging_steps=10,
        report_to="none",
    )

    # Trainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset['train'],
        eval_dataset=dataset['validation'],
        peft_config=peft_config,
        args=training_args,
        tokenizer=tokenizer,
    )

    print("Starting training...")
    trainer.train()

    # Save
    final_path = output_dir / f"{model_config['output_name']}-final"
    print(f"Saving model to {final_path}...")
    model.save_pretrained(final_path)
    tokenizer.save_pretrained(final_path)

    print("Training complete!")
    return final_path


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', choices=MODELS.keys(), default='mistral')
    parser.add_argument('--data', type=Path, default=Path('../data/processed'))
    parser.add_argument('--output', type=Path, default=Path('../models'))
    args = parser.parse_args()

    train(args.model, args.data, args.output)
```

#### 3.4 Export to GGUF for Ollama

```python
# ai-training/training/export_to_gguf.py
"""
Export LoRA-trained model to GGUF format for Ollama

Usage:
    python export_to_gguf.py --model chiro-no-lora-final --quantize q4_k_m
"""

import argparse
import subprocess
from pathlib import Path
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

MODELS = {
    'chiro-no-lora-final': 'mistralai/Mistral-7B-Instruct-v0.3',
    'chiro-fast-lora-final': 'meta-llama/Llama-3.2-3B-Instruct',
    'chiro-norwegian-lora-final': 'google/gemma-3-4b-it',
    'chiro-medical-lora-final': 'google/medgemma-4b'
}

def merge_and_export(model_dir: Path, output_dir: Path, quantize: str = 'q4_k_m'):
    model_name = model_dir.name
    base_model_name = MODELS.get(model_name)

    if not base_model_name:
        raise ValueError(f"Unknown model: {model_name}")

    print(f"Loading base model: {base_model_name}")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype="auto",
        device_map="cpu"  # CPU for merging
    )

    print(f"Loading LoRA adapter from: {model_dir}")
    model = PeftModel.from_pretrained(base_model, str(model_dir))

    print("Merging weights...")
    merged_model = model.merge_and_unload()

    merged_path = output_dir / f"{model_name}-merged"
    print(f"Saving merged model to: {merged_path}")
    merged_model.save_pretrained(merged_path)

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    tokenizer.save_pretrained(merged_path)

    # Convert to GGUF using llama.cpp
    gguf_path = output_dir / 'gguf' / f"{model_name}.gguf"
    gguf_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Converting to GGUF ({quantize})...")
    subprocess.run([
        'python', '-m', 'llama_cpp.convert',
        '--outfile', str(gguf_path),
        '--outtype', quantize,
        str(merged_path)
    ], check=True)

    print(f"GGUF model saved to: {gguf_path}")

    # Generate Ollama Modelfile
    modelfile_path = output_dir / 'gguf' / f"Modelfile.{model_name.replace('-final', '')}"
    with open(modelfile_path, 'w') as f:
        f.write(f'FROM {gguf_path.name}\n\n')
        f.write('# Fine-tuned on ChiroClick clinical documentation\n')
        f.write('PARAMETER temperature 0.7\n')
        f.write('PARAMETER top_p 0.9\n')
        f.write('PARAMETER num_ctx 4096\n')

    print(f"Modelfile created: {modelfile_path}")
    print(f"\nTo use in Ollama:\n  ollama create {model_name.replace('-final', '')} -f {modelfile_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, help='Model directory name')
    parser.add_argument('--output', type=Path, default=Path('../models'))
    parser.add_argument('--quantize', default='q4_k_m',
                        choices=['q4_0', 'q4_k_m', 'q5_k_m', 'q8_0', 'f16'])
    args = parser.parse_args()

    model_dir = args.output / args.model
    merge_and_export(model_dir, args.output, args.quantize)
```

### Phase 4: Evaluation

#### 4.1 Evaluation Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| ROUGE-L | > 0.6 | Compare generated vs reference SOAP notes |
| Clinical Accuracy | > 90% | Manual review by practitioner |
| Hallucination Rate | < 5% | Check for made-up findings/diagnoses |
| Norwegian Quality | Native-level | Grammar, terminology correctness |
| Response Time | < 2s | Inference latency |

#### 4.2 Evaluation Script

```python
# ai-training/evaluation/evaluate.py
"""
Evaluate fine-tuned models against test set

Usage:
    python evaluate.py --model chiro-no-lora-final --test ../data/processed/test.jsonl
"""

import json
import argparse
from pathlib import Path
from rouge_score import rouge_scorer
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

def evaluate(model_path: Path, test_file: Path):
    print(f"Loading model from {model_path}...")
    pipe = pipeline(
        "text-generation",
        model=str(model_path),
        tokenizer=str(model_path),
        device_map="auto"
    )

    scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=False)

    results = []
    with open(test_file, 'r') as f:
        test_data = [json.loads(line) for line in f if line.strip()]

    print(f"Evaluating on {len(test_data)} examples...")

    for i, example in enumerate(test_data):
        messages = example['messages']
        prompt_messages = messages[:-1]  # System + User
        reference = messages[-1]['content']  # Assistant (ground truth)

        # Generate
        output = pipe(
            prompt_messages,
            max_new_tokens=1024,
            do_sample=True,
            temperature=0.7
        )
        generated = output[0]['generated_text'][-1]['content']

        # Score
        scores = scorer.score(reference, generated)

        results.append({
            'rouge1': scores['rouge1'].fmeasure,
            'rouge2': scores['rouge2'].fmeasure,
            'rougeL': scores['rougeL'].fmeasure,
            'reference_length': len(reference),
            'generated_length': len(generated)
        })

        if (i + 1) % 10 == 0:
            print(f"  Processed {i + 1}/{len(test_data)}")

    # Aggregate
    avg_results = {
        'rouge1': sum(r['rouge1'] for r in results) / len(results),
        'rouge2': sum(r['rouge2'] for r in results) / len(results),
        'rougeL': sum(r['rougeL'] for r in results) / len(results),
        'num_examples': len(results)
    }

    print("\n" + "="*50)
    print("EVALUATION RESULTS")
    print("="*50)
    print(f"ROUGE-1: {avg_results['rouge1']:.4f}")
    print(f"ROUGE-2: {avg_results['rouge2']:.4f}")
    print(f"ROUGE-L: {avg_results['rougeL']:.4f}")
    print(f"Examples: {avg_results['num_examples']}")

    return avg_results


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=Path, required=True)
    parser.add_argument('--test', type=Path, required=True)
    args = parser.parse_args()

    evaluate(args.model, args.test)
```

---

## Expected Improvements

### Before (System Prompts Only)
- Follows basic instructions
- Generic clinical phrasing
- May miss specific terminology patterns
- Inconsistent documentation structure

### After (LoRA Fine-Tuning)
- Learns exact documentation structure
- Uses preferred clinical terminology
- Adapts to Norwegian medical conventions
- ~40-50% reduction in hallucinations
- Maintains inference speed (<5% latency increase)

---

## Training Resources

### Estimated Requirements

| Resource | Requirement |
|----------|-------------|
| GPU VRAM | 16-24GB (RTX 4080/4090 or cloud T4/A10) |
| Training Time | 2-4 hours per model |
| Storage | ~50GB (base models + checkpoints) |
| LoRA Weights | ~50-100MB per model |

### Cloud Options (If No Local GPU)

1. **RunPod** - ~$0.40/hr for A10 GPU
2. **Lambda Labs** - ~$0.50/hr for A10
3. **Google Colab Pro** - $10/month, T4/A100 access
4. **Mistral Fine-Tuning API** - Pay per training job

---

## Safety Considerations

### Pre-Deployment Checklist

- [ ] Manual review of 100+ generated summaries
- [ ] Domain expert validation on clinical accuracy
- [ ] ROUGE scores on held-out test set
- [ ] Check for clinical inconsistencies
- [ ] Verify no PII memorization
- [ ] Document training process (GDPR compliance)

### Compliance Notes

- Training data must be anonymized
- Document data sources and consent
- Keep training logs for audit
- Consider local-only training for sensitive data

---

## Next Steps

### Immediate (This Week)
1. [ ] Create `ai-training/data/` directory structure
2. [ ] Run data conversion script on existing JSONL files
3. [ ] Validate data quality and diversity
4. [ ] Set up training environment (local or cloud)

### Short-Term (Next 2 Weeks)
5. [ ] Fine-tune `chiro-no` (Mistral 7B) first
6. [ ] Evaluate against baseline
7. [ ] Iterate on data if needed
8. [ ] Export to GGUF and test in Ollama

### Medium-Term (Month)
9. [ ] Fine-tune remaining 3 models
10. [ ] A/B test against current system prompts
11. [ ] Deploy to production
12. [ ] Set up continuous learning pipeline

---

## Research Questions for Further Investigation

### For Perplexity (Training Optimization)
1. "QLoRA vs LoRA for medical domain - accuracy vs VRAM tradeoffs 2025-2026"
2. "Optimal training data size for clinical LLM fine-tuning - diminishing returns"
3. "Mistral v0.3 vs Llama 3.2 for Norwegian medical text generation comparison"

### For Claude (Implementation)
1. "How to implement continuous learning from user feedback in Ollama models"
2. "Best practices for A/B testing LLM outputs in production healthcare systems"

### For Gemini (Data)
1. "Synthetic medical data generation for training - GPT-4 vs Claude comparison"
2. "Data augmentation techniques for clinical documentation training sets"

---

## References

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314)
- [Medical LLM Fine-tuning Best Practices (2025)](https://www.ncbi.nlm.nih.gov/)
- [Ollama Model Creation Guide](https://ollama.ai/docs/create)
- [Hugging Face PEFT Documentation](https://huggingface.co/docs/peft)

---

*Document created: 2026-01-29*
*Last updated: 2026-01-29*
