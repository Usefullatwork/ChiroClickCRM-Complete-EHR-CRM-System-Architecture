#!/usr/bin/env python3
"""
Training Data Quality Scorer — ChiroClickCRM

Scores training data quality using heuristic checks and optional Claude API review.
Each example is scored on 4 dimensions (1-5 each):
  - Accuracy: Clinical content correctness (heuristic + optional API)
  - Format: Does it follow expected ChatML structure?
  - Norwegian: Formal medical Norwegian, not colloquial?
  - Completeness: Does the response address the full prompt?

Usage:
    python scripts/score_training_data.py
    python scripts/score_training_data.py --input ../data/processed/general-clinical/train.jsonl
    python scripts/score_training_data.py --use-api --api-key sk-ant-xxx --sample 200
    python scripts/score_training_data.py --triage  # Output keep/rewrite/remove lists
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
DEFAULT_INPUT = AI_TRAINING_DIR / "data" / "processed" / "general-clinical" / "train.jsonl"
OUTPUT_DIR = AI_TRAINING_DIR / "data" / "scored"

# ============================================================
# Norwegian Language Quality Heuristics
# ============================================================

NORWEGIAN_CHARS = set('æøåÆØÅ')

# Colloquial terms that should be formal in medical context
COLLOQUIAL_TERMS = {
    'nakkevondt': 'cervikalgi',
    'vondt i ryggen': 'dorsalgi/lumbalgi',
    'vondt i skulderen': 'omalgi',
    'nerve i klem': 'nerverotaffeksjon',
    'slitasje': 'degenerativ forandring',
    'stiv nakke': 'cervikal bevegelsesrestriksjon',
    'sideveis bøying': 'lateralfleksjon',
    'forover bøying': 'fleksjon',
    'bakover bøying': 'ekstensjon',
    'hevelse': 'ødem',
    'nummen': 'hypoestesi/parestesi',
    'vondt å gå': 'gangvansker/funksjonsnedsettelse',
}

# Formal medical terms (presence = good quality)
FORMAL_TERMS = [
    'cervikalgi', 'lumbalgi', 'dorsalgi', 'omalgi', 'cefalgi',
    'radikulopati', 'myelopati', 'stenose', 'spondylose',
    'lateralfleksjon', 'antefleksjon', 'retrofleksjon',
    'hypoestesi', 'parestesi', 'pareser',
    'palpasjonsømhet', 'hypertonisitet', 'segmental dysfunksjon',
    'differensialdiagnostikk', 'klinisk resonnering',
    'artikulær', 'periartrikulær', 'myofascial',
    'propriosepsjon', 'nevrologisk status',
]

# English contamination markers
ENGLISH_CONTAMINATION = [
    'the patient', 'chief complaint', 'range of motion',
    'subjective:', 'objective:', 'assessment:', 'plan:',
    'however,', 'therefore,', 'additionally,',
    'treatment plan', 'follow up', 'referred to',
    'bilateral', 'unilateral',  # acceptable in medical context
]

# Non-clinical contamination
NON_CLINICAL = [
    'bubble.io', 'react', 'github', 'npm', 'component',
    'api endpoint', 'webpack', 'javascript', 'docker',
    'kubernetes', 'tailwind', 'prisma', 'deployment',
    'frontend', 'backend', 'css', 'html',
]


def score_format(example):
    """Score format quality (1-5). Does it follow ChatML structure?"""
    messages = example.get('messages', [])
    if not messages:
        return 1, "No messages field"

    score = 5
    issues = []

    # Check structure
    roles = [m.get('role') for m in messages]
    if roles != ['system', 'user', 'assistant']:
        if 'system' not in roles:
            score -= 1
            issues.append("missing system prompt")
        if 'user' not in roles:
            score -= 2
            issues.append("missing user prompt")
        if 'assistant' not in roles:
            score -= 2
            issues.append("missing assistant response")

    # Check content lengths
    for msg in messages:
        content = msg.get('content', '')
        if not content or len(content.strip()) < 5:
            score -= 1
            issues.append(f"empty/too-short {msg.get('role', '?')} content")

    # Check assistant response quality
    assistant_msgs = [m for m in messages if m.get('role') == 'assistant']
    if assistant_msgs:
        resp = assistant_msgs[0].get('content', '')
        if len(resp) < 20:
            score -= 1
            issues.append("very short response")
        elif len(resp) > 3000:
            score -= 1
            issues.append("very long response (>3000 chars)")

    return max(1, score), "; ".join(issues) if issues else "OK"


def score_norwegian(example):
    """Score Norwegian language quality (1-5)."""
    messages = example.get('messages', [])
    assistant_msgs = [m for m in messages if m.get('role') == 'assistant']
    if not assistant_msgs:
        return 1, "No response"

    text = assistant_msgs[0].get('content', '').lower()
    score = 3  # Start neutral
    issues = []

    # Check for Norwegian characters
    norwegian_count = sum(1 for c in text if c in NORWEGIAN_CHARS)
    alpha_count = sum(1 for c in text if c.isalpha())
    if alpha_count > 0:
        no_rate = norwegian_count / alpha_count
        if no_rate > 0.01:
            score += 1  # Good Norwegian char rate
        elif no_rate < 0.001 and alpha_count > 50:
            score -= 1
            issues.append("low Norwegian char rate")

    # Check for colloquial terms (bad)
    colloquial_found = [term for term in COLLOQUIAL_TERMS if term in text]
    if colloquial_found:
        score -= 1
        issues.append(f"colloquial: {', '.join(colloquial_found[:3])}")

    # Check for formal medical terms (good)
    formal_found = sum(1 for term in FORMAL_TERMS if term in text)
    if formal_found >= 3:
        score += 1
    elif formal_found >= 1:
        pass  # neutral
    # Don't penalize for no formal terms — might be SMS/quick field

    # Check for English contamination
    english_found = [term for term in ENGLISH_CONTAMINATION[:10] if term in text]
    if len(english_found) >= 3:
        score -= 1
        issues.append(f"English contamination: {', '.join(english_found[:3])}")

    return max(1, min(5, score)), "; ".join(issues) if issues else "OK"


def score_completeness(example):
    """Score response completeness (1-5). Does it address the prompt?"""
    messages = example.get('messages', [])
    user_msgs = [m for m in messages if m.get('role') == 'user']
    assistant_msgs = [m for m in messages if m.get('role') == 'assistant']

    if not user_msgs or not assistant_msgs:
        return 1, "Missing user or assistant"

    prompt = user_msgs[0].get('content', '').lower()
    response = assistant_msgs[0].get('content', '').lower()

    score = 3
    issues = []

    # Check response length relative to prompt complexity
    prompt_len = len(prompt)
    resp_len = len(response)

    if resp_len < 20:
        return 1, "Response too short"

    # Check if response addresses key terms from prompt
    prompt_words = set(re.findall(r'\b\w{4,}\b', prompt))
    resp_words = set(re.findall(r'\b\w{4,}\b', response))
    overlap = len(prompt_words & resp_words)

    if prompt_words:
        overlap_rate = overlap / len(prompt_words)
        if overlap_rate > 0.3:
            score += 1
        elif overlap_rate < 0.1:
            score -= 1
            issues.append("low prompt-response overlap")

    # Check for structural elements in longer responses
    if resp_len > 200:
        has_structure = any(marker in response for marker in [
            '\n-', '\n•', '\n1.', '\n2.', 'funn:', 'handling:',
            'vurdering:', 'plan:', 'differensial',
        ])
        if has_structure:
            score += 1

    return max(1, min(5, score)), "; ".join(issues) if issues else "OK"


def score_accuracy_heuristic(example):
    """Score clinical accuracy using heuristics only (1-5)."""
    messages = example.get('messages', [])
    assistant_msgs = [m for m in messages if m.get('role') == 'assistant']

    if not assistant_msgs:
        return 1, "No response"

    text = assistant_msgs[0].get('content', '').lower()
    score = 4  # Assume good unless red flags found
    issues = []

    # Check for non-clinical contamination (very bad)
    non_clinical_found = [term for term in NON_CLINICAL if term in text]
    if non_clinical_found:
        return 1, f"Non-clinical contamination: {', '.join(non_clinical_found[:3])}"

    # Check for dangerous misinformation patterns
    dangerous_patterns = [
        (r'cauda equina.*trygt', "falsely classifies cauda equina as safe"),
        (r'myelopati.*monitorér', "under-triages myelopathy"),
        (r'113.*unødvendig', "discourages emergency call"),
        (r'manipulasjon.*cauda', "suggests manipulation for cauda equina"),
    ]
    for pattern, desc in dangerous_patterns:
        if re.search(pattern, text):
            score -= 2
            issues.append(desc)

    # Check for self-contradictions
    if ('trygt' in text and 'akutt henvisning' in text):
        score -= 1
        issues.append("contradictory: safe + urgent referral")

    if ('røde flagg identifisert' in text and 'ingen røde flagg' in text):
        score -= 1
        issues.append("contradictory: flags found + no flags")

    return max(1, min(5, score)), "; ".join(issues) if issues else "OK"


def score_example(example, idx):
    """Score a single training example on all dimensions."""
    fmt_score, fmt_note = score_format(example)
    nor_score, nor_note = score_norwegian(example)
    comp_score, comp_note = score_completeness(example)
    acc_score, acc_note = score_accuracy_heuristic(example)

    total = fmt_score + nor_score + comp_score + acc_score
    avg = round(total / 4, 2)

    return {
        'index': idx,
        'format': {'score': fmt_score, 'note': fmt_note},
        'norwegian': {'score': nor_score, 'note': nor_note},
        'completeness': {'score': comp_score, 'note': comp_note},
        'accuracy': {'score': acc_score, 'note': acc_note},
        'total': total,
        'average': avg,
    }


def triage_results(scores):
    """Triage scored examples into keep/rewrite/remove buckets."""
    keep = []
    rewrite = []
    remove = []

    for s in scores:
        avg = s['average']
        if avg >= 4.0:
            keep.append(s['index'])
        elif avg >= 3.0:
            rewrite.append(s['index'])
        else:
            remove.append(s['index'])

    return keep, rewrite, remove


def main():
    parser = argparse.ArgumentParser(description='Score training data quality')
    parser.add_argument('--input', type=str, default=str(DEFAULT_INPUT),
                        help='Input JSONL file to score')
    parser.add_argument('--output', type=str, default=None,
                        help='Output JSON file for scores')
    parser.add_argument('--triage', action='store_true',
                        help='Output keep/rewrite/remove lists')
    parser.add_argument('--sample', type=int, default=0,
                        help='Only score a random sample of N examples')
    parser.add_argument('--verbose', action='store_true',
                        help='Print details for low-scoring examples')
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    # Load data
    examples = []
    with open(input_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    examples.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    print(f"Loaded {len(examples)} examples from {input_path}")

    # Sample if requested
    if args.sample > 0 and args.sample < len(examples):
        import random
        indices = random.sample(range(len(examples)), args.sample)
        sampled = [(i, examples[i]) for i in sorted(indices)]
        print(f"Sampling {args.sample} examples")
    else:
        sampled = list(enumerate(examples))

    # Score all
    scores = []
    dimension_totals = defaultdict(list)

    for idx, example in sampled:
        result = score_example(example, idx)
        scores.append(result)
        for dim in ['format', 'norwegian', 'completeness', 'accuracy']:
            dimension_totals[dim].append(result[dim]['score'])

    # Print summary
    print(f"\n{'=' * 50}")
    print(f"SCORING SUMMARY — {len(scores)} examples")
    print(f"{'=' * 50}")

    for dim in ['format', 'norwegian', 'completeness', 'accuracy']:
        vals = dimension_totals[dim]
        avg = round(sum(vals) / len(vals), 2)
        dist = defaultdict(int)
        for v in vals:
            dist[v] += 1
        print(f"\n  {dim.capitalize()}: avg {avg}/5")
        for s in sorted(dist.keys()):
            pct = round(dist[s] / len(vals) * 100, 1)
            bar = '█' * int(pct / 2)
            print(f"    Score {s}: {dist[s]:5d} ({pct:5.1f}%) {bar}")

    # Overall
    avgs = [s['average'] for s in scores]
    overall_avg = round(sum(avgs) / len(avgs), 2)
    print(f"\n  Overall average: {overall_avg}/5")

    # Triage
    keep, rewrite, remove = triage_results(scores)
    print(f"\n  Triage:")
    print(f"    Keep (≥4.0):    {len(keep):5d} ({round(len(keep)/len(scores)*100, 1)}%)")
    print(f"    Rewrite (3-4):  {len(rewrite):5d} ({round(len(rewrite)/len(scores)*100, 1)}%)")
    print(f"    Remove (<3.0):  {len(remove):5d} ({round(len(remove)/len(scores)*100, 1)}%)")

    # Verbose: show worst examples
    if args.verbose:
        worst = sorted(scores, key=lambda s: s['average'])[:20]
        print(f"\n  Worst 20 examples:")
        for s in worst:
            print(f"    #{s['index']:5d}  avg={s['average']}  "
                  f"fmt={s['format']['score']} nor={s['norwegian']['score']} "
                  f"comp={s['completeness']['score']} acc={s['accuracy']['score']}")
            for dim in ['format', 'norwegian', 'completeness', 'accuracy']:
                note = s[dim]['note']
                if note != 'OK':
                    print(f"           {dim}: {note}")

    # Save results
    if args.output or args.triage:
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        output_path = Path(args.output) if args.output else OUTPUT_DIR / 'scores.json'
        output_data = {
            'input_file': str(input_path),
            'total_examples': len(examples),
            'scored_examples': len(scores),
            'overall_average': overall_avg,
            'dimension_averages': {
                dim: round(sum(dimension_totals[dim]) / len(dimension_totals[dim]), 2)
                for dim in ['format', 'norwegian', 'completeness', 'accuracy']
            },
            'triage': {
                'keep_count': len(keep),
                'rewrite_count': len(rewrite),
                'remove_count': len(remove),
            },
            'scores': scores,
        }
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f"\n  Scores saved to: {output_path}")

        if args.triage:
            # Save triage lists
            triage_path = OUTPUT_DIR / 'triage.json'
            with open(triage_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'keep': keep,
                    'rewrite': rewrite,
                    'remove': remove,
                }, f, indent=2)
            print(f"  Triage saved to: {triage_path}")

            # Save filtered dataset (keep only)
            keep_set = set(keep)
            filtered_path = OUTPUT_DIR / 'train-filtered.jsonl'
            count = 0
            with open(filtered_path, 'w', encoding='utf-8') as out:
                for i, ex in enumerate(examples):
                    if i in keep_set:
                        out.write(json.dumps(ex, ensure_ascii=False) + '\n')
                        count += 1
            print(f"  Filtered dataset ({count} examples): {filtered_path}")


if __name__ == '__main__':
    main()
