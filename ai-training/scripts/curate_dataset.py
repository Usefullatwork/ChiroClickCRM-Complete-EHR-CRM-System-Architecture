#!/usr/bin/env python3
"""
Dataset Curation Pipeline — ChiroClickCRM

Merges all data sources (existing processed + Claude-generated + distilled + DPO),
enforces category balancing (the v3 regression root cause was imbalance),
deduplicates, quality-filters, and outputs balanced train/val/test splits.

Usage:
    python scripts/curate_dataset.py
    python scripts/curate_dataset.py --max-per-category 30
    python scripts/curate_dataset.py --min-quality 4
    python scripts/curate_dataset.py --dry-run

Output:
    data/curated/train.jsonl
    data/curated/validation.jsonl
    data/curated/test.jsonl
    data/curated/composition-report.json
"""

import argparse
import hashlib
import json
import math
import os
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
DATA_DIR = AI_TRAINING_DIR / 'data'
OUTPUT_DIR = DATA_DIR / 'curated'

# Data source directories
PROCESSED_DIR = DATA_DIR / 'processed' / 'all-clean'
PROCESSED_V4_DIR = DATA_DIR / 'processed-v4' / 'general-clinical'
CLAUDE_GENERATED_DIR = DATA_DIR / 'claude-generated'
DISTILLED_DIR = DATA_DIR / 'distilled'
DPO_DIR = DATA_DIR / 'dpo'

NORWEGIAN_CHARS = set('æøåÆØÅ')

# ============================================================
# Import shared Claude utilities
# ============================================================

from claude_utils import (
    has_pii, get_client, build_batch_request, submit_batch,
    extract_batch_tool_use, QUALITY_JUDGE_TOOL,
)


# ============================================================
# Category balancing configuration
# v3 regression root cause: imbalanced categories
# ============================================================

CATEGORY_LIMITS = {
    # Max percentage of total dataset from any single category
    'max_pct': 30,
    # Minimum percentage for weak categories (identified by gap analysis)
    'min_pct': 10,
    # Weak categories that need guaranteed representation
    'boost_categories': ['diagnosis_codes', 'red_flags', 'letters', 'communication'],
}

# Quality threshold: only include examples scoring >= this
DEFAULT_MIN_QUALITY = 3


# ============================================================
# Data Loading
# ============================================================

def load_jsonl(path, source_label='unknown'):
    """Load examples from a JSONL file, tagging with source."""
    examples = []
    if not path.exists():
        return examples

    with open(path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue

            # Normalize: extract category from various formats
            example = normalize_example(data, source_label)
            if example:
                examples.append(example)

    return examples


def normalize_example(data, source_label):
    """Normalize different data formats into a standard structure."""
    # ChatML format (messages array)
    if 'messages' in data:
        messages = data['messages']
        if len(messages) < 2:
            return None

        # Extract category from metadata
        meta = data.get('metadata', {})
        category = meta.get('category', infer_category(messages))
        quality = meta.get('quality_score', 3)
        source = meta.get('source', source_label)

        return {
            'messages': messages,
            'category': category,
            'quality_score': quality,
            'source': source,
            'format': 'chatml',
        }

    # Instruction format (instruction/input/output)
    if 'instruction' in data and 'output' in data:
        category = data.get('category', 'general')
        quality = data.get('quality_score', 3)
        source = data.get('source', source_label)

        # Convert to ChatML
        system = 'Du er en klinisk assistent for kiropraktorer i Norge.'
        user = data['instruction']
        if data.get('input'):
            user += f"\n\n{data['input']}"

        return {
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': user},
                {'role': 'assistant', 'content': data['output']},
            ],
            'category': category,
            'quality_score': quality,
            'source': source,
            'format': 'chatml',
        }

    # DPO format (prompt/chosen/rejected)
    if 'prompt' in data and 'chosen' in data and 'rejected' in data:
        meta = data.get('metadata', {})
        category = meta.get('category', 'general')
        source = meta.get('source', source_label)

        return {
            'prompt': data['prompt'],
            'chosen': data['chosen'],
            'rejected': data['rejected'],
            'category': category,
            'source': source,
            'format': 'dpo',
        }

    return None


def infer_category(messages):
    """Infer category from message content."""
    text = ' '.join(m.get('content', '') for m in messages).lower()

    if 'icpc' in text or 'diagnosekod' in text:
        return 'diagnosis_codes'
    if 'røde flagg' in text or 'vurder risiko' in text:
        return 'red_flags'
    if 'soap' in text or 'subjektiv' in text and 'objektiv' in text:
        return 'soap_notes'
    if 'henvisning' in text or 'fastlege' in text or 'epikriser' in text:
        return 'letters'
    if 'sms' in text or 'e-post' in text or 'påminnelse' in text:
        return 'communication'
    if 'terminologi' in text or 'norsk' in text:
        return 'norwegian_language'
    if len(text) < 500:
        return 'quick_fields'
    return 'general'


# ============================================================
# Deduplication
# ============================================================

def compute_fingerprint(example):
    """Compute a content fingerprint for deduplication."""
    if example['format'] == 'dpo':
        text = example['prompt'] + example['chosen']
    else:
        # Use user message + first 200 chars of assistant response
        parts = []
        for m in example.get('messages', []):
            if m['role'] == 'user':
                parts.append(m['content'])
            elif m['role'] == 'assistant':
                parts.append(m['content'][:200])
        text = ' '.join(parts)

    # Normalize for dedup
    text = text.lower().strip()
    text = re.sub(r'\s+', ' ', text)
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def deduplicate(examples):
    """Remove duplicates by content fingerprint."""
    seen = set()
    unique = []
    dupes = 0

    for ex in examples:
        fp = compute_fingerprint(ex)
        if fp not in seen:
            seen.add(fp)
            unique.append(ex)
        else:
            dupes += 1

    return unique, dupes


# ============================================================
# Quality Filtering
# ============================================================

def passes_quality(example, min_quality):
    """Check if an example meets quality threshold."""
    quality = example.get('quality_score', 3)
    if isinstance(quality, str):
        try:
            quality = float(quality)
        except ValueError:
            quality = 3.0
    return quality >= min_quality


def passes_pii_check(example):
    """Check for PII in example content."""
    if example['format'] == 'dpo':
        return not (has_pii(example['prompt']) or
                    has_pii(example['chosen']) or
                    has_pii(example['rejected']))
    else:
        for m in example.get('messages', []):
            if has_pii(m.get('content', '')):
                return False
    return True


# ============================================================
# Claude Quality Gate (Batch API)
# ============================================================

def run_quality_gate(examples, model='claude-haiku-4-5'):
    """Run Claude-as-judge quality gate on all examples via Batch API.

    Submits all examples for binary classification (ACCEPT/REJECT).
    Uses Haiku for cost efficiency.

    Returns list of examples that pass the quality gate (score >= 3/5).
    """
    client = get_client()
    batch_requests = []

    quality_system = (
        "Du er en kvalitetsvurdering-ekspert for AI-treningsdata for norsk kiropraktikk. "
        "Vurder om dette eksempelet er godt nok for å trene en klinisk AI-modell. "
        "ACCEPT eksempler som er klinisk korrekte, godt formulert på norsk, "
        "og relevante for kiropraktisk praksis. "
        "REJECT eksempler med feil, dårlig norsk, eller irrelevant innhold."
    )

    for idx, ex in enumerate(examples):
        # Build content summary for judging
        if ex['format'] == 'dpo':
            content = f"Prompt: {ex['prompt'][:300]}\nChosen: {ex['chosen'][:300]}"
        else:
            msgs = ex.get('messages', [])
            parts = []
            for m in msgs:
                if m['role'] in ('user', 'assistant'):
                    parts.append(f"{m['role'].upper()}: {m['content'][:200]}")
            content = '\n'.join(parts)

        user_prompt = (
            f"Kategori: {ex.get('category', 'unknown')}\n"
            f"Kilde: {ex.get('source', 'unknown')}\n\n"
            f"{content}\n\n"
            "Vurder kvaliteten. Bruk quality_judgment-verktøyet."
        )

        req = build_batch_request(
            custom_id=f'qg_{idx}',
            system_prompt=quality_system,
            user_content=user_prompt,
            model=model,
            max_tokens=256,
            tools=[QUALITY_JUDGE_TOOL],
            tool_choice={'type': 'tool', 'name': 'quality_judgment'},
        )
        batch_requests.append(req)

    print(f'  Quality gate: submitting {len(batch_requests)} examples to Claude...')
    results = submit_batch(client, batch_requests, poll_interval=15)

    # Process results
    accepted_indices = set()
    rejected_count = 0
    for custom_id, result in results:
        idx = int(custom_id.split('_')[1])
        parsed = extract_batch_tool_use(result, 'quality_judgment')
        if parsed and parsed.get('verdict') == 'ACCEPT' and parsed.get('quality_score', 0) >= 3:
            accepted_indices.add(idx)
        else:
            rejected_count += 1

    accepted = [ex for i, ex in enumerate(examples) if i in accepted_indices]
    # Also keep examples that weren't processed (batch errors)
    unprocessed = [ex for i, ex in enumerate(examples)
                   if i not in accepted_indices and i >= len(results)]
    accepted.extend(unprocessed)

    print(f'  Quality gate: {len(accepted)} accepted, {rejected_count} rejected')
    return accepted


# ============================================================
# Diversity Scoring (TF-IDF cosine similarity)
# ============================================================

def compute_tfidf_vectors(texts):
    """Compute TF-IDF vectors for a list of texts.

    Simple implementation without external dependencies (no sklearn needed).
    Returns list of dicts mapping term -> tfidf score.
    """
    # Tokenize
    tokenized = []
    for text in texts:
        tokens = re.findall(r'\w+', text.lower())
        tokenized.append(tokens)

    # Document frequency
    df = defaultdict(int)
    for tokens in tokenized:
        unique = set(tokens)
        for t in unique:
            df[t] += 1

    n_docs = len(texts)
    vectors = []

    for tokens in tokenized:
        # Term frequency
        tf = defaultdict(int)
        for t in tokens:
            tf[t] += 1

        # TF-IDF
        vec = {}
        for t, count in tf.items():
            idf = math.log((n_docs + 1) / (df[t] + 1)) + 1
            vec[t] = (count / max(len(tokens), 1)) * idf
        vectors.append(vec)

    return vectors


def cosine_similarity(vec_a, vec_b):
    """Compute cosine similarity between two sparse vectors (dicts)."""
    common = set(vec_a.keys()) & set(vec_b.keys())
    if not common:
        return 0.0

    dot = sum(vec_a[k] * vec_b[k] for k in common)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))

    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def deduplicate_by_diversity(examples, similarity_threshold=0.85):
    """Remove near-duplicate examples within each category using TF-IDF cosine.

    For clusters of >5 near-duplicate instructions, keeps only the highest-quality one.
    Returns deduplicated examples and count of removed items.
    """
    by_category = defaultdict(list)
    for i, ex in enumerate(examples):
        by_category[ex.get('category', 'general')].append((i, ex))

    keep_indices = set(range(len(examples)))
    removed = 0

    for cat, cat_items in by_category.items():
        if len(cat_items) < 3:
            continue

        # Extract instruction text for comparison
        texts = []
        for idx, ex in cat_items:
            if ex['format'] == 'dpo':
                texts.append(ex.get('prompt', ''))
            else:
                user_msgs = [m['content'] for m in ex.get('messages', []) if m['role'] == 'user']
                texts.append(' '.join(user_msgs))

        vectors = compute_tfidf_vectors(texts)

        # Find clusters of similar items
        used = set()
        for i in range(len(cat_items)):
            if i in used:
                continue
            cluster = [i]
            for j in range(i + 1, len(cat_items)):
                if j in used:
                    continue
                sim = cosine_similarity(vectors[i], vectors[j])
                if sim >= similarity_threshold:
                    cluster.append(j)

            if len(cluster) > 1:
                # Keep the highest quality one, remove the rest
                best_idx = max(cluster, key=lambda ci: cat_items[ci][1].get('quality_score', 3))
                for ci in cluster:
                    if ci != best_idx:
                        orig_idx = cat_items[ci][0]
                        keep_indices.discard(orig_idx)
                        removed += 1
                        used.add(ci)

    result = [ex for i, ex in enumerate(examples) if i in keep_indices]
    return result, removed


# ============================================================
# Category Balancing
# ============================================================

def balance_categories(sft_examples, max_pct, min_pct, boost_categories):
    """Balance categories to prevent any single category from dominating.

    This is the key fix for the v3 regression — where imbalanced data
    caused the model to excel in overrepresented categories while
    regressing in underrepresented ones.
    """
    total = len(sft_examples)
    if total == 0:
        return sft_examples

    max_per_cat = int(total * max_pct / 100)
    min_per_cat = int(total * min_pct / 100)

    # Group by category
    by_category = defaultdict(list)
    for ex in sft_examples:
        by_category[ex['category']].append(ex)

    balanced = []

    # Phase 1: Ensure minimum representation for boost categories
    for cat in boost_categories:
        if cat in by_category:
            available = by_category[cat]
            needed = min(min_per_cat, len(available))
            # Prefer higher quality examples
            available.sort(key=lambda x: x.get('quality_score', 3), reverse=True)
            selected = available[:needed]
            balanced.extend(selected)
            by_category[cat] = available[needed:]

    # Phase 2: Fill remaining from all categories, respecting max
    remaining_budget = total - len(balanced)
    cats_with_data = [c for c in by_category if by_category[c]]

    # Distribute proportionally
    per_cat_budget = remaining_budget // max(len(cats_with_data), 1)

    for cat in cats_with_data:
        available = by_category[cat]
        allowed = min(max_per_cat - sum(1 for b in balanced if b['category'] == cat),
                      per_cat_budget, len(available))
        if allowed > 0:
            available.sort(key=lambda x: x.get('quality_score', 3), reverse=True)
            balanced.extend(available[:allowed])

    # Phase 3: Fill any remaining budget with highest quality from any category
    current = len(balanced)
    if current < total:
        remaining = []
        for cat_examples in by_category.values():
            remaining.extend(cat_examples)
        remaining.sort(key=lambda x: x.get('quality_score', 3), reverse=True)

        for ex in remaining:
            if ex not in balanced:
                cat_count = sum(1 for b in balanced if b['category'] == ex['category'])
                if cat_count < max_per_cat:
                    balanced.append(ex)
                    if len(balanced) >= total:
                        break

    return balanced


# ============================================================
# Train/Val/Test Split
# ============================================================

def split_dataset(examples, val_ratio=0.1, test_ratio=0.1):
    """Split examples into train/val/test sets, stratified by category."""
    by_category = defaultdict(list)
    for ex in examples:
        by_category[ex['category']].append(ex)

    train, val, test = [], [], []

    for cat, cat_examples in by_category.items():
        random.shuffle(cat_examples)
        n = len(cat_examples)
        n_test = max(1, int(n * test_ratio))
        n_val = max(1, int(n * val_ratio))

        test.extend(cat_examples[:n_test])
        val.extend(cat_examples[n_test:n_test + n_val])
        train.extend(cat_examples[n_test + n_val:])

    random.shuffle(train)
    random.shuffle(val)
    random.shuffle(test)

    return train, val, test


# ============================================================
# Reporting
# ============================================================

def build_composition_report(train, val, test, dpo, dedup_count, filtered_count, pii_count):
    """Build a detailed composition report."""
    all_sft = train + val + test
    total = len(all_sft)

    # Category breakdown
    cat_counts = defaultdict(int)
    source_counts = defaultdict(int)
    quality_scores = []

    for ex in all_sft:
        cat_counts[ex['category']] += 1
        source_counts[ex['source']] += 1
        quality_scores.append(ex.get('quality_score', 3))

    report = {
        'timestamp': __import__('time').strftime('%Y-%m-%dT%H:%M:%SZ', __import__('time').gmtime()),
        'total_examples': total,
        'splits': {
            'train': len(train),
            'validation': len(val),
            'test': len(test),
            'dpo': len(dpo),
        },
        'filtering': {
            'duplicates_removed': dedup_count,
            'quality_filtered': filtered_count,
            'pii_filtered': pii_count,
        },
        'by_category': {},
        'by_source': {},
        'quality': {
            'mean': round(sum(quality_scores) / max(len(quality_scores), 1), 2),
            'min': min(quality_scores) if quality_scores else 0,
            'max': max(quality_scores) if quality_scores else 0,
        },
    }

    for cat, count in sorted(cat_counts.items()):
        pct = round(count / max(total, 1) * 100, 1)
        report['by_category'][cat] = {'count': count, 'pct': pct}

    for source, count in sorted(source_counts.items()):
        pct = round(count / max(total, 1) * 100, 1)
        report['by_source'][source] = {'count': count, 'pct': pct}

    return report


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Dataset curation pipeline')
    parser.add_argument('--max-per-category', type=int, default=CATEGORY_LIMITS['max_pct'],
                        help='Max %% of total from any single category')
    parser.add_argument('--min-per-category', type=int, default=CATEGORY_LIMITS['min_pct'],
                        help='Min %% from weak categories')
    parser.add_argument('--min-quality', type=float, default=DEFAULT_MIN_QUALITY,
                        help='Min quality score threshold')
    parser.add_argument('--seed', type=int, default=42,
                        help='Random seed for reproducibility')
    parser.add_argument('--quality-gate', action='store_true',
                        help='Run Claude quality gate (Batch API, uses Haiku)')
    parser.add_argument('--diversity', action='store_true',
                        help='Run TF-IDF diversity dedup (remove near-duplicates)')
    parser.add_argument('--similarity-threshold', type=float, default=0.85,
                        help='Cosine similarity threshold for diversity dedup')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show composition without saving')
    parser.add_argument('--output-dir', default=str(OUTPUT_DIR),
                        help='Output directory')
    args = parser.parse_args()

    random.seed(args.seed)

    # ── Load all data sources ──
    print('  Loading data sources...')

    all_sft = []
    all_dpo = []

    # 1. Existing processed data
    for jsonl in sorted(PROCESSED_DIR.glob('*.jsonl')):
        if 'train' in jsonl.name:
            examples = load_jsonl(jsonl, 'template_processed')
            print(f'    {jsonl.name}: {len(examples)} examples')
            all_sft.extend(examples)

    for jsonl in sorted(PROCESSED_V4_DIR.glob('*.jsonl')):
        if 'train' in jsonl.name:
            examples = load_jsonl(jsonl, 'template_v4')
            print(f'    {jsonl.name}: {len(examples)} examples')
            all_sft.extend(examples)

    # 2. Claude-generated data
    if CLAUDE_GENERATED_DIR.exists():
        for jsonl in sorted(CLAUDE_GENERATED_DIR.glob('batch-*.jsonl')):
            examples = load_jsonl(jsonl, 'claude_generated')
            print(f'    {jsonl.name}: {len(examples)} examples')
            all_sft.extend(examples)

    # 3. Distilled data
    if DISTILLED_DIR.exists():
        for jsonl in sorted(DISTILLED_DIR.glob('*.jsonl')):
            examples = load_jsonl(jsonl, 'distilled')
            print(f'    {jsonl.name}: {len(examples)} examples')
            all_sft.extend(examples)

    # 4. DPO data (separate pipeline)
    if DPO_DIR.exists():
        for jsonl in sorted(DPO_DIR.glob('*.jsonl')):
            examples = load_jsonl(jsonl, 'dpo')
            dpo = [e for e in examples if e['format'] == 'dpo']
            sft = [e for e in examples if e['format'] == 'chatml']
            print(f'    {jsonl.name}: {len(dpo)} DPO + {len(sft)} SFT')
            all_dpo.extend(dpo)
            all_sft.extend(sft)

    print(f'\n  Raw totals: {len(all_sft)} SFT + {len(all_dpo)} DPO')

    # ── PII filtering ──
    pii_count = 0
    clean_sft = []
    for ex in all_sft:
        if passes_pii_check(ex):
            clean_sft.append(ex)
        else:
            pii_count += 1
    all_sft = clean_sft

    clean_dpo = []
    for ex in all_dpo:
        if passes_pii_check(ex):
            clean_dpo.append(ex)
        else:
            pii_count += 1
    all_dpo = clean_dpo

    if pii_count > 0:
        print(f'  PII filtered: {pii_count} examples removed')

    # ── Deduplication ──
    all_sft, dedup_sft = deduplicate(all_sft)
    all_dpo, dedup_dpo = deduplicate(all_dpo)
    dedup_count = dedup_sft + dedup_dpo
    print(f'  Deduplication: removed {dedup_count} ({dedup_sft} SFT + {dedup_dpo} DPO)')

    # ── Quality filtering ──
    filtered_count = 0
    quality_sft = []
    for ex in all_sft:
        if passes_quality(ex, args.min_quality):
            quality_sft.append(ex)
        else:
            filtered_count += 1
    all_sft = quality_sft
    print(f'  Quality filter (>={args.min_quality}): removed {filtered_count}, kept {len(all_sft)}')

    # ── Diversity dedup (TF-IDF cosine) ──
    diversity_removed = 0
    if args.diversity:
        all_sft, diversity_removed = deduplicate_by_diversity(
            all_sft, similarity_threshold=args.similarity_threshold
        )
        print(f'  Diversity dedup (>={args.similarity_threshold}): '
              f'removed {diversity_removed}, kept {len(all_sft)}')

    # ── Claude quality gate ──
    quality_gate_rejected = 0
    if args.quality_gate and not args.dry_run:
        pre_gate = len(all_sft)
        all_sft = run_quality_gate(all_sft)
        quality_gate_rejected = pre_gate - len(all_sft)
        print(f'  Claude quality gate: rejected {quality_gate_rejected}, kept {len(all_sft)}')

    # ── Category balancing ──
    all_sft = balance_categories(
        all_sft,
        max_pct=args.max_per_category,
        min_pct=args.min_per_category,
        boost_categories=CATEGORY_LIMITS['boost_categories'],
    )
    print(f'  After balancing: {len(all_sft)} SFT examples')

    # ── Split ──
    train, val, test = split_dataset(all_sft)

    # ── Report ──
    report = build_composition_report(train, val, test, all_dpo, dedup_count, filtered_count, pii_count)
    # Add diversity and quality gate stats to report
    report['filtering']['diversity_removed'] = diversity_removed
    report['filtering']['quality_gate_rejected'] = quality_gate_rejected if args.quality_gate else 0

    print(f'\n  {"=" * 60}')
    print(f'  CURATED DATASET COMPOSITION')
    print(f'  {"=" * 60}')
    print(f'  Total SFT: {report["total_examples"]}')
    print(f'    Train:      {report["splits"]["train"]}')
    print(f'    Validation: {report["splits"]["validation"]}')
    print(f'    Test:       {report["splits"]["test"]}')
    print(f'  DPO pairs: {report["splits"]["dpo"]}')
    print(f'\n  Quality: mean {report["quality"]["mean"]}/5, '
          f'min {report["quality"]["min"]}/5')

    print(f'\n  By category:')
    print(f'  {"Category":<25s} {"Count":>7s} {"Pct":>7s}')
    print(f'  {"─" * 42}')
    for cat, data in sorted(report['by_category'].items()):
        print(f'  {cat:<25s} {data["count"]:>7d} {data["pct"]:>6.1f}%')

    print(f'\n  By source:')
    print(f'  {"Source":<25s} {"Count":>7s} {"Pct":>7s}')
    print(f'  {"─" * 42}')
    for source, data in sorted(report['by_source'].items()):
        print(f'  {source:<25s} {data["count"]:>7d} {data["pct"]:>6.1f}%')

    print(f'\n  Filtered:')
    print(f'    Duplicates: {report["filtering"]["duplicates_removed"]}')
    print(f'    Quality:    {report["filtering"]["quality_filtered"]}')
    print(f'    PII:        {report["filtering"]["pii_filtered"]}')

    if args.dry_run:
        print('\n  DRY RUN — no files saved')
        return

    # ── Save ──
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    def save_jsonl(examples, filename):
        path = output_dir / filename
        with open(path, 'w', encoding='utf-8') as f:
            for ex in examples:
                # Save only the training-relevant fields
                if ex['format'] == 'dpo':
                    out = {
                        'prompt': ex['prompt'],
                        'chosen': ex['chosen'],
                        'rejected': ex['rejected'],
                    }
                else:
                    out = {'messages': ex['messages']}
                    if 'metadata' in ex:
                        out['metadata'] = {
                            'category': ex.get('category'),
                            'source': ex.get('source'),
                        }
                f.write(json.dumps(out, ensure_ascii=False) + '\n')
        return path

    train_path = save_jsonl(train, 'train.jsonl')
    val_path = save_jsonl(val, 'validation.jsonl')
    test_path = save_jsonl(test, 'test.jsonl')

    # Save DPO separately
    if all_dpo:
        dpo_path = save_jsonl(all_dpo, 'dpo.jsonl')
        print(f'  DPO:        {dpo_path} ({len(all_dpo)} pairs)')

    # Save composition report
    report_path = output_dir / 'composition-report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f'\n  Files saved:')
    print(f'    Train:      {train_path} ({len(train)} examples)')
    print(f'    Validation: {val_path} ({len(val)} examples)')
    print(f'    Test:       {test_path} ({len(test)} examples)')
    print(f'    Report:     {report_path}')
    print(f'\n  Next step (train v5):')
    print(f'    python training/train_unsloth.py --model default --data-dir ../data/curated')


if __name__ == '__main__':
    main()
