#!/usr/bin/env python3
"""
Convert ChiroClickEHR training data to nanochat format.

Reads:
  - ai-training/training-data-alpaca.json (5,642 SFT examples, Alpaca format)
  - ai-training/data/sft/*.jsonl (74 ChatML examples)
  - ai-training/data/dpo/train.jsonl (720 DPO pairs)
  - ai-training/data/dpo/v6_targeted.jsonl (200 DPO pairs)

Writes:
  - ai-training/nanochat/data/sft_train.jsonl (ChatML format for nanochat SFT)
  - ai-training/nanochat/data/sft_val.jsonl (10% holdout)
  - ai-training/nanochat/data/dpo_train.jsonl (nanochat DPO format)
  - ai-training/nanochat/data/dpo_val.jsonl (10% holdout)

ChatML template (Qwen2.5-Instruct):
  <|im_start|>system\n{system}<|im_end|>\n
  <|im_start|>user\n{user}<|im_end|>\n
  <|im_start|>assistant\n{assistant}<|im_end|>

Usage: python ai-training/nanochat/scripts/prepare-data.py
"""

import json
import os
import random
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
ALPACA_FILE = BASE_DIR / 'training-data-alpaca.json'
SFT_DIR = BASE_DIR / 'data' / 'sft'
DPO_DIR = BASE_DIR / 'data' / 'dpo'
OUTPUT_DIR = Path(__file__).parent.parent / 'data'

SYSTEM_PROMPT = "Du er en klinisk AI-assistent for kiropraktikk i Norge. Svar alltid på norsk med korrekt medisinsk terminologi."

VALIDATION_SPLIT = 0.1
RANDOM_SEED = 42


def alpaca_to_chatml(example):
    """Convert Alpaca format to ChatML messages."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    user_content = example['instruction']
    if example.get('input'):
        user_content += f"\n\n{example['input']}"

    messages.append({"role": "user", "content": user_content})
    messages.append({"role": "assistant", "content": example['output']})

    return {"messages": messages}


def load_alpaca():
    """Load and convert Alpaca format SFT data."""
    if not ALPACA_FILE.exists():
        print(f"  Warning: {ALPACA_FILE} not found, skipping")
        return []

    with open(ALPACA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    converted = []
    for ex in data:
        if not ex.get('output') or len(ex['output'].strip()) < 10:
            continue
        converted.append(alpaca_to_chatml(ex))

    print(f"  Alpaca: {len(converted)} examples converted")
    return converted


def load_chatml_sft():
    """Load ChatML format SFT data from JSONL files."""
    examples = []
    if not SFT_DIR.exists():
        return examples

    for jsonl_file in SFT_DIR.glob('*.jsonl'):
        with open(jsonl_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                ex = json.loads(line)
                if 'messages' in ex:
                    examples.append(ex)

    print(f"  ChatML SFT: {len(examples)} examples loaded")
    return examples


def load_dpo():
    """Load DPO training data."""
    examples = []
    dpo_files = ['train.jsonl', 'v6_targeted.jsonl']

    for filename in dpo_files:
        filepath = DPO_DIR / filename
        if not filepath.exists():
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                ex = json.loads(line)
                if 'prompt' in ex and 'chosen' in ex and 'rejected' in ex:
                    # Convert to nanochat DPO format
                    converted = {
                        "prompt": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": ex['prompt']},
                        ],
                        "chosen": [
                            {"role": "assistant", "content": ex['chosen']},
                        ],
                        "rejected": [
                            {"role": "assistant", "content": ex['rejected']},
                        ],
                    }
                    examples.append(converted)

    print(f"  DPO: {len(examples)} pairs loaded")
    return examples


def split_data(data, val_ratio=VALIDATION_SPLIT):
    """Split data into train/validation sets."""
    random.seed(RANDOM_SEED)
    random.shuffle(data)
    split_idx = int(len(data) * (1 - val_ratio))
    return data[:split_idx], data[split_idx:]


def write_jsonl(data, filepath):
    """Write data as JSONL."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    print(f"  Wrote {len(data)} examples to {filepath}")


def verify_norwegian(data, sample_size=10):
    """Quick check that data contains Norwegian characters."""
    norwegian_chars = set('æøåÆØÅ')
    sample = random.sample(data, min(sample_size, len(data)))
    norwegian_count = 0

    for item in sample:
        text = json.dumps(item, ensure_ascii=False)
        if any(c in norwegian_chars for c in text):
            norwegian_count += 1

    rate = norwegian_count / len(sample) * 100
    print(f"  Norwegian char check: {rate:.0f}% of samples contain æøå")
    if rate < 80:
        print("  WARNING: Low Norwegian content rate — verify data quality")


def main():
    print("ChiroClickEHR → nanochat data preparation")
    print("=" * 50)

    # Load SFT data
    print("\n1. Loading SFT data...")
    sft_data = load_alpaca() + load_chatml_sft()
    print(f"   Total SFT: {len(sft_data)} examples")

    # Load DPO data
    print("\n2. Loading DPO data...")
    dpo_data = load_dpo()
    print(f"   Total DPO: {len(dpo_data)} pairs")

    # Split into train/val
    print("\n3. Splitting train/validation ({:.0f}% / {:.0f}%)...".format(
        (1 - VALIDATION_SPLIT) * 100, VALIDATION_SPLIT * 100
    ))
    sft_train, sft_val = split_data(sft_data)
    dpo_train, dpo_val = split_data(dpo_data)

    # Write output
    print("\n4. Writing output files...")
    write_jsonl(sft_train, OUTPUT_DIR / 'sft_train.jsonl')
    write_jsonl(sft_val, OUTPUT_DIR / 'sft_val.jsonl')
    write_jsonl(dpo_train, OUTPUT_DIR / 'dpo_train.jsonl')
    write_jsonl(dpo_val, OUTPUT_DIR / 'dpo_val.jsonl')

    # Verify
    print("\n5. Verification...")
    verify_norwegian(sft_data)

    # Summary
    print("\n" + "=" * 50)
    print(f"SFT: {len(sft_train)} train + {len(sft_val)} val = {len(sft_data)} total")
    print(f"DPO: {len(dpo_train)} train + {len(dpo_val)} val = {len(dpo_data)} total")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    print("Ready for nanochat training!")


if __name__ == '__main__':
    main()
