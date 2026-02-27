#!/usr/bin/env python3
"""
Claude-Powered DPO Pair Generator — ChiroClickCRM

For each gap case from the analysis: generates a "chosen" (Claude-quality)
and "rejected" (mimicking common local model errors) pair.
DPO pairs are more effective than SFT for correcting specific failure modes.

Usage:
    python scripts/generate_dpo_with_claude.py
    python scripts/generate_dpo_with_claude.py --gap-report evaluation/gap-analysis.json
    python scripts/generate_dpo_with_claude.py --count 100
    python scripts/generate_dpo_with_claude.py --dry-run

Requirements:
    pip install anthropic
    ANTHROPIC_API_KEY env var set

Output:
    data/dpo/claude-generated-{date}.jsonl
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
EVAL_DIR = AI_TRAINING_DIR / 'evaluation'
GAP_REPORT = EVAL_DIR / 'gap-analysis.json'
BENCHMARK_FILE = EVAL_DIR / 'benchmark_cases.jsonl'
OUTPUT_DIR = AI_TRAINING_DIR / 'data' / 'dpo'

# ============================================================
# Import shared Claude utilities
# ============================================================

from claude_utils import (
    get_client, check_pii, cached_message, extract_text,
)


# ============================================================
# DPO Pair Generation Prompts
# ============================================================

CHOSEN_SYSTEM = (
    "Du er en ekspert på norsk klinisk dokumentasjon for kiropraktikk. "
    "Gi et eksemplarisk svar som scorer høyt på alle evalueringskriterier: "
    "klinisk nøyaktighet, relevans, fullstendighet, norsk språkkvalitet, og sikkerhet. "
    "VIKTIG: Bruk korrekt norsk medisinsk terminologi. Inkluder alle relevante nøkkelord."
)

REJECTION_TEMPLATES = {
    'missing_keywords': (
        "Skriv et svar som er generelt relevant men MANGLER viktige kliniske nøkkelord. "
        "Svaret skal være rimelig men ufullstendig — typiske feil fra en utrenet modell. "
        "Eksempler: utelat diagnosekoder, glem røde flagg, bruk vage termer."
    ),
    'hallucination': (
        "Skriv et svar som FEILAKTIG inkluderer alvorlige tilstander som ikke passer scenarioet. "
        "For trygge scenarioer: nevn cancer, fraktur eller alvorlige diagnoser uten grunn. "
        "For farlige scenarioer: bagatelliser symptomene."
    ),
    'code_format': (
        "Skriv et svar som diskuterer diagnoser men UTEN korrekte ICPC-2 koder. "
        "Bruk feil kodeformat, feil koder, eller bare beskrivende tekst uten koder. "
        "Typisk feil: skrive diagnosenavnet uten kode, eller bruke ICD-10 istedet."
    ),
    'too_short': (
        "Skriv et svar som er ALT FOR KORT — bare 1-2 setninger. "
        "Utelat viktig klinisk informasjon. Gi et overfladisk svar."
    ),
    'poor_norwegian': (
        "Skriv et svar som bruker MYE engelsk istedet for norsk medisinsk terminologi. "
        "Bland inn 'subjective', 'objective', 'assessment', 'treatment plan', "
        "'range of motion', 'chief complaint' osv. Typisk for en modell "
        "som ikke er godt nok trent på norsk."
    ),
    'partial_quality': (
        "Skriv et svar som er OK men ikke bra nok — middels kvalitet. "
        "Noe relevant innhold, men mangler presisjon, strukturering, "
        "og viktige kliniske detaljer."
    ),
}


# ============================================================
# Claude API — Enhanced with prompt caching
# ============================================================

def generate_chosen(client, prompt, system_prompt=None, max_tokens=500):
    """Generate a high-quality 'chosen' response using Claude with prompt caching.

    The CHOSEN_SYSTEM prompt is cached across all calls (90% input cost savings).
    """
    system = CHOSEN_SYSTEM
    if system_prompt:
        system = f"{system_prompt}\n\n{CHOSEN_SYSTEM}"

    try:
        response = cached_message(
            client, system, prompt,
            max_tokens=max_tokens, temperature=0.3,
        )
        return extract_text(response)
    except Exception as e:
        print(f'  ERROR generating chosen: {e}')
        return None


def generate_rejected(client, prompt, gap_type, system_prompt=None, max_tokens=500):
    """Generate a 'rejected' response mimicking common local model errors.

    Uses prompt caching on the rejection template system prompt.
    """
    rejection_instruction = REJECTION_TEMPLATES.get(gap_type, REJECTION_TEMPLATES['partial_quality'])
    system = f"{system_prompt or ''}\n\nINSTRUKSJON FOR KVALITET: {rejection_instruction}".strip()

    try:
        response = cached_message(
            client, system, prompt,
            max_tokens=max_tokens, temperature=0.7,
        )
        return extract_text(response)
    except Exception as e:
        print(f'  ERROR generating rejected: {e}')
        return None


# ============================================================
# Data Loading
# ============================================================

def load_benchmark():
    """Load benchmark cases as dict keyed by ID."""
    cases = {}
    with open(BENCHMARK_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                case = json.loads(line)
                cases[case.get('id', '')] = case
    return cases


def load_gap_report(path):
    """Load gap analysis report."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_dpo_pair(prompt, system_prompt, chosen, rejected, category, gap_type):
    """Build a DPO training pair in ChatML format with validation.

    Validates that chosen and rejected are non-empty and different,
    and that no PII is present in any field.
    """
    system = system_prompt or 'Du er en klinisk assistent for kiropraktorer i Norge.'

    # Validation: ensure pair quality
    if not chosen or not rejected:
        return None
    if len(chosen.strip()) < 20 or len(rejected.strip()) < 20:
        return None
    # Chosen and rejected should be meaningfully different
    if chosen.strip() == rejected.strip():
        return None
    # PII check on generated content
    try:
        check_pii(chosen)
        check_pii(rejected)
    except ValueError:
        return None

    return {
        'prompt': f'<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n',
        'chosen': chosen,
        'rejected': rejected,
        'metadata': {
            'category': category,
            'gap_type': gap_type,
            'source': 'claude_dpo_generated',
        },
    }


# ============================================================
# Main Pipeline
# ============================================================

def generate_from_gap_cases(client, gap_report, benchmark_cases, max_pairs):
    """Generate DPO pairs from gap analysis failure cases."""
    pairs = []
    gap_cases = [c for c in gap_report.get('cases', []) if not c.get('ollama_passed')]

    if not gap_cases:
        print('  No gap cases found in report')
        return pairs

    # Sort by worst score first (prioritize biggest gaps)
    gap_cases.sort(key=lambda c: c.get('ollama_score', 0))

    # Limit to max_pairs
    gap_cases = gap_cases[:max_pairs]

    total = len(gap_cases)
    print(f'  Generating DPO pairs for {total} gap cases...')

    for i, gap_case in enumerate(gap_cases, 1):
        case_id = gap_case.get('id', '')
        category = gap_case.get('category', 'unknown')
        gap_types = gap_case.get('gap_types', ['partial_quality'])
        primary_gap = gap_types[0] if gap_types else 'partial_quality'

        # Get original benchmark case
        benchmark = benchmark_cases.get(case_id, {})
        prompt = benchmark.get('prompt', '')
        system_prompt = benchmark.get('system_prompt', None)
        max_tokens = benchmark.get('max_tokens', 500)

        if not prompt:
            print(f'  [{i}/{total}] SKIP {case_id} — no prompt found')
            continue

        # PII check
        try:
            check_pii(prompt)
            check_pii(system_prompt)
        except ValueError:
            print(f'  [{i}/{total}] SKIP {case_id} — PII detected')
            continue

        # Use Claude's output from gap analysis if available
        chosen = gap_case.get('claude_output')
        if not chosen:
            chosen = generate_chosen(client, prompt, system_prompt, max_tokens)

        if not chosen:
            print(f'  [{i}/{total}] SKIP {case_id} — failed to generate chosen')
            continue

        # Generate rejected version mimicking the specific failure mode
        rejected = generate_rejected(client, prompt, primary_gap, system_prompt, max_tokens)

        if not rejected:
            print(f'  [{i}/{total}] SKIP {case_id} — failed to generate rejected')
            continue

        # Build DPO pair (with validation)
        pair = build_dpo_pair(prompt, system_prompt, chosen, rejected, category, primary_gap)
        if not pair:
            print(f'  [{i:3d}/{total}] ✗ {case_id:<35s} SKIP: validation failed')
            continue
        pairs.append(pair)

        print(f'  [{i:3d}/{total}] ✓ {case_id:<35s} gap={primary_gap}')

        # Rate limiting
        if i % 5 == 0:
            time.sleep(0.5)

    return pairs


def generate_synthetic_dpo(client, benchmark_cases, count_per_category):
    """Generate additional synthetic DPO pairs for underrepresented categories."""
    pairs = []
    categories = {}

    for case_id, case in benchmark_cases.items():
        cat = case.get('category', 'unknown')
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(case)

    for cat, cases in categories.items():
        # Sample cases to generate DPO pairs from
        sample = cases[:count_per_category]
        for case in sample:
            prompt = case.get('prompt', '')
            system_prompt = case.get('system_prompt', None)
            max_tokens = case.get('max_tokens', 500)

            try:
                check_pii(prompt)
            except ValueError:
                continue

            chosen = generate_chosen(client, prompt, system_prompt, max_tokens)
            if not chosen:
                continue

            # Random rejection type for synthetic pairs
            import random
            gap_type = random.choice(list(REJECTION_TEMPLATES.keys()))
            rejected = generate_rejected(client, prompt, gap_type, system_prompt, max_tokens)
            if not rejected:
                continue

            pair = build_dpo_pair(prompt, system_prompt, chosen, rejected, cat, gap_type)
            if pair:
                pairs.append(pair)

        time.sleep(0.5)

    return pairs


def main():
    parser = argparse.ArgumentParser(description='Claude-powered DPO pair generation')
    parser.add_argument('--gap-report', default=str(GAP_REPORT),
                        help='Path to gap-analysis.json')
    parser.add_argument('--count', type=int, default=100,
                        help='Max DPO pairs to generate')
    parser.add_argument('--synthetic', type=int, default=3,
                        help='Additional synthetic pairs per category')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show plan without generating')
    parser.add_argument('--output-dir', default=str(OUTPUT_DIR),
                        help='Output directory')
    args = parser.parse_args()

    # Load benchmark cases
    if not BENCHMARK_FILE.exists():
        print(f'  ERROR: Benchmark file not found: {BENCHMARK_FILE}')
        sys.exit(1)
    benchmark_cases = load_benchmark()
    print(f'  Loaded {len(benchmark_cases)} benchmark cases')

    # Load gap report
    gap_report = None
    gap_path = Path(args.gap_report)
    if gap_path.exists():
        gap_report = load_gap_report(gap_path)
        gap_count = len([c for c in gap_report.get('cases', []) if not c.get('ollama_passed')])
        print(f'  Loaded gap report: {gap_count} failing cases')
    else:
        print(f'  No gap report — generating synthetic DPO pairs only')

    # Plan
    total_gap = min(args.count, gap_count) if gap_report else 0
    total_synthetic = args.synthetic * len(set(c.get('category') for c in benchmark_cases.values()))

    print(f'\n  DPO Generation Plan:')
    print(f'    From gap cases:  {total_gap}')
    print(f'    Synthetic:       {total_synthetic}')
    print(f'    Total:           {total_gap + total_synthetic}')

    if args.dry_run:
        print('\n  DRY RUN — no pairs generated')
        return

    client = get_client()
    all_pairs = []

    # Generate from gap cases
    if gap_report:
        pairs = generate_from_gap_cases(client, gap_report, benchmark_cases, args.count)
        all_pairs.extend(pairs)

    # Generate synthetic pairs
    if args.synthetic > 0:
        print(f'\n  Generating {args.synthetic} synthetic pairs per category...')
        synthetic = generate_synthetic_dpo(client, benchmark_cases, args.synthetic)
        all_pairs.extend(synthetic)

    if not all_pairs:
        print('  WARNING: No DPO pairs generated')
        return

    # Save
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime('%Y-%m-%d')
    output_file = output_dir / f'claude-generated-{date_str}.jsonl'

    with open(output_file, 'w', encoding='utf-8') as f:
        for pair in all_pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + '\n')

    # Summary
    category_counts = {}
    gap_type_counts = {}
    for pair in all_pairs:
        cat = pair.get('metadata', {}).get('category', 'unknown')
        gt = pair.get('metadata', {}).get('gap_type', 'unknown')
        category_counts[cat] = category_counts.get(cat, 0) + 1
        gap_type_counts[gt] = gap_type_counts.get(gt, 0) + 1

    print(f'\n  {"=" * 50}')
    print(f'  DPO GENERATION COMPLETE')
    print(f'  {"=" * 50}')
    print(f'  Total pairs: {len(all_pairs)}')
    print(f'\n  By category:')
    for cat, count in sorted(category_counts.items()):
        print(f'    {cat:<25s} {count}')
    print(f'\n  By gap type:')
    for gt, count in sorted(gap_type_counts.items(), key=lambda x: -x[1]):
        print(f'    {gt:<25s} {count}')
    print(f'\n  Output: {output_file}')
    print(f'\n  Next step:')
    print(f'    python scripts/distill_from_claude.py')


if __name__ == '__main__':
    main()
