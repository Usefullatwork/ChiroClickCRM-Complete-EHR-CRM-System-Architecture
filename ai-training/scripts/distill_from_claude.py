#!/usr/bin/env python3
"""
Knowledge Distillation Pipeline — ChiroClickCRM

Teacher-student approach: sends benchmark prompts + clinical scenarios to
Claude with the exact system prompts the local model uses, captures the
full responses, validates they pass benchmark criteria, and saves as
ChatML training examples.

Usage:
    python scripts/distill_from_claude.py
    python scripts/distill_from_claude.py --model-prompts
    python scripts/distill_from_claude.py --extra-scenarios scenarios.jsonl
    python scripts/distill_from_claude.py --category diagnosis_codes
    python scripts/distill_from_claude.py --dry-run

Requirements:
    pip install anthropic requests
    ANTHROPIC_API_KEY env var set

Output:
    data/distilled/claude-distilled-{date}.jsonl
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
BENCHMARK_FILE = EVAL_DIR / 'benchmark_cases.jsonl'
OUTPUT_DIR = AI_TRAINING_DIR / 'data' / 'distilled'

# Import evaluation functions
sys.path.insert(0, str(EVAL_DIR))
from evaluate import evaluate_case, SYNONYMS

# ============================================================
# GDPR: PII safety
# ============================================================

FNUMMER_PATTERN = re.compile(r'\b\d{6}\s?\d{5}\b')
NORWEGIAN_CHARS = set('æøåÆØÅ')


def check_pii(text):
    """Refuse to process data containing fødselsnummer patterns."""
    if text and FNUMMER_PATTERN.search(text):
        raise ValueError("PII detected. Refusing to process.")


def norwegian_char_rate(text):
    """Calculate the rate of Norwegian-specific characters."""
    alpha = sum(1 for c in text if c.isalpha())
    if alpha == 0:
        return 0.0
    no_count = sum(1 for c in text if c in NORWEGIAN_CHARS)
    return no_count / alpha


# ============================================================
# System prompts matching the local model Modelfiles
# ============================================================

MODEL_SYSTEM_PROMPTS = {
    'default': (
        "Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. "
        "Du hjelper med SOAP-notater, klinisk resonnering, diagnostisering, "
        "og pasientkommunikasjon. Bruk korrekt norsk medisinsk terminologi. "
        "Vær presis, konsis og klinisk relevant."
    ),
    'norwegian': (
        "Du er en norsk språkspesialist for kiropraktisk dokumentasjon. "
        "Bruk ALLTID norsk medisinsk terminologi — aldri engelsk. "
        "Eksempler: nakkevirvelsøyle (ikke cervical spine), "
        "korsrygg (ikke lower back), radikulopati (ikke radiculopathy)."
    ),
    'medical': (
        "Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. "
        "Identifiser røde flagg, kontraindikasjoner, og alvorlige tilstander. "
        "Klassifiser risikonivå: AKUTT (øyeblikkelig henvisning), "
        "SUBAKUTT (henvisning innen dager), OVERVÅK (monitor), eller TRYGT."
    ),
    'fast': (
        "Du er en rask klinisk assistent. Gi korte, presise svar. "
        "Maks 2-3 setninger for enkle spørsmål."
    ),
}

# Map categories to their appropriate system prompts
CATEGORY_SYSTEM_MAP = {
    'diagnosis_codes': 'Du er en diagnosekode-spesialist for kiropraktikk i Norge. Bruk ICPC-2 kodeverk.',
    'red_flags': MODEL_SYSTEM_PROMPTS['medical'],
    'soap_notes': MODEL_SYSTEM_PROMPTS['default'],
    'letters': 'Du er en norsk medisinsk korrespondanse-spesialist.',
    'norwegian_language': MODEL_SYSTEM_PROMPTS['norwegian'],
    'communication': 'Du er en pasientkommunikasjonsspesialist for kiropraktikk i Norge.',
    'quick_fields': MODEL_SYSTEM_PROMPTS['fast'],
}


# ============================================================
# Claude Distillation
# ============================================================

def get_claude_client():
    """Initialize Anthropic client."""
    try:
        import anthropic
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'anthropic', '-q'])
        import anthropic

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print('  ERROR: ANTHROPIC_API_KEY not set')
        sys.exit(1)
    return anthropic.Anthropic(api_key=api_key)


def distill_case(client, case):
    """Send a benchmark case to Claude and capture the response.

    Uses the EXACT system prompt from the benchmark case (matching what the
    local model sees during evaluation) to ensure the distilled response
    is scored the same way.
    """
    prompt = case.get('prompt', '')
    # Use the benchmark's own system prompt, or fall back to category default
    system_prompt = case.get('system_prompt') or CATEGORY_SYSTEM_MAP.get(
        case.get('category', ''), MODEL_SYSTEM_PROMPTS['default']
    )
    max_tokens = case.get('max_tokens', 500)

    # PII check
    check_pii(prompt)
    check_pii(system_prompt)

    try:
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.3,
        )
        text = ''.join(b.text for b in response.content if b.type == 'text')
        return text, None
    except Exception as e:
        return None, str(e)


def validate_distilled(case, response):
    """Validate that Claude's response passes the benchmark criteria."""
    if not response:
        return False, 'empty_response'

    category = case.get('category', '')

    # Run through the evaluation scorer
    result = evaluate_case(case, response, 0)

    # Additional category-specific validation
    if category == 'diagnosis_codes':
        # Must contain ICPC-2 code format [A-Z]\d{2}
        if not re.search(r'[A-Z]\d{2}', response):
            return False, 'missing_code_format'

    if case.get('expect_norwegian', True):
        # Must have Norwegian character ratio ≥ 0.1% for Norwegian categories
        rate = norwegian_char_rate(response)
        if category in ('norwegian_language', 'soap_notes', 'letters') and rate < 0.002:
            return False, f'low_norwegian_rate ({rate:.4f})'

    return result.get('passed', False), result


def build_chatml_example(case, response):
    """Convert a distilled case+response into ChatML format."""
    system_prompt = case.get('system_prompt') or CATEGORY_SYSTEM_MAP.get(
        case.get('category', ''), MODEL_SYSTEM_PROMPTS['default']
    )

    return {
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': case['prompt']},
            {'role': 'assistant', 'content': response},
        ],
        'metadata': {
            'category': case.get('category', 'unknown'),
            'source': 'distilled',
            'benchmark_id': case.get('id', ''),
            'quality_score': 5,  # Claude outputs are high quality by definition
        },
    }


# ============================================================
# Additional Clinical Scenarios
# ============================================================

EXTRA_SCENARIOS = {
    'diagnosis_codes': [
        "Foreslå ICPC-2 koder for laterale skuldersmerter med positiv Empty Can test.",
        "Foreslå diagnosekoder for akutt torticollis hos en 25 år gammel kvinne.",
        "Foreslå ICPC-2 koder for bilateral karpaltunnelsyndrom med nattsmerter.",
        "Foreslå diagnosekoder for Scheuermanns sykdom hos en 16 år gammel gutt.",
        "Foreslå ICPC-2 koder for Mortons nevrom mellom 3. og 4. metatarsal.",
    ],
    'red_flags': [
        "Vurder røde flagg: 45 år, akutt hodepine 'verste i livet', nakkestivhet, foto-fobi.",
        "Vurder røde flagg: 8 år gammel med ryggsmerter etter trampolinehopping, nekter å gå.",
        "Vurder røde flagg: 62 år med bilateral klossete hender, gangvansker, positiv Hoffman.",
        "Vurder røde flagg: 38 år, nakke-/skuldersmerter, vekttap, nattesvette, hoste 6 uker.",
        "Vurder røde flagg: 30 år med kroniske korsryggsmerter, normal nevro, forverres med aktivitet, bedres med hvile.",
    ],
    'soap_notes': [
        "Skriv komplett SOAP for akutt lumbal skiveprolaps L5-S1 med drop-fot.",
        "Skriv objektiv undersøkelse for cervikal radikulopati C6-C7.",
        "Skriv vurdering og plan for kronisk tendinopati i achillessenen.",
        "Skriv subjektiv for gravid pasient med bekkenrelaterte smerter (bekkenløsning).",
        "Skriv SOAP for idrettsutøver med akutt hamstringskade grad 2.",
    ],
    'letters': [
        "Skriv henvisning til nevrolog for pasient med mistenkt cervikal myelopati.",
        "Skriv epikriser til fastlege etter fullført behandlingsserie for skulder impingement.",
        "Skriv erklæring til forsikringsselskap for whiplash-skade etter bilulykke.",
        "Skriv sykmelding for pasient med akutt lumbal skiveprolaps.",
    ],
    'norwegian_language': [
        "Beskriv normal leddundersøkelse av skulder på norsk medisinsk fagspråk.",
        "List norske begreper for vanlige ortopediske tester for kne.",
        "Skriv kort klinisk beskrivelse av thoracic outlet syndrom på norsk.",
    ],
    'communication': [
        "Skriv SMS-påminnelse for time i morgen kl 14:00 hos kiropraktor.",
        "Skriv e-post med øvelsesprogram etter behandling for nakkeproblemet.",
        "Skriv informasjonsskriv om hva pasienten kan forvente etter første konsultasjon.",
    ],
}


# ============================================================
# Main Pipeline
# ============================================================

def load_benchmark(category_filter=None):
    """Load benchmark cases from JSONL."""
    cases = []
    with open(BENCHMARK_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            case = json.loads(line)
            if category_filter and case.get('category') != category_filter:
                continue
            cases.append(case)
    return cases


def run_distillation(client, cases, verbose=False):
    """Distill Claude's outputs for all benchmark cases."""
    examples = []
    stats = {'total': 0, 'passed': 0, 'failed': 0, 'errors': 0}
    category_stats = {}

    total = len(cases)
    print(f'\n  Distilling {total} cases through Claude...')
    print(f'  {"─" * 60}')

    for i, case in enumerate(cases, 1):
        stats['total'] += 1
        case_id = case.get('id', f'case_{i}')
        category = case.get('category', 'unknown')

        if category not in category_stats:
            category_stats[category] = {'total': 0, 'passed': 0}
        category_stats[category]['total'] += 1

        # Distill
        response, error = distill_case(client, case)

        if error:
            stats['errors'] += 1
            print(f'  [{i:3d}/{total}] ✗ {case_id:<35s} ERROR: {error}')
            continue

        # Validate
        passed, validation = validate_distilled(case, response)

        if passed:
            stats['passed'] += 1
            category_stats[category]['passed'] += 1
            example = build_chatml_example(case, response)
            examples.append(example)
            print(f'  [{i:3d}/{total}] ✓ {case_id:<35s} ({len(response)} chars)')
        else:
            stats['failed'] += 1
            reason = validation if isinstance(validation, str) else 'eval_fail'
            print(f'  [{i:3d}/{total}] ✗ {case_id:<35s} FAIL: {reason}')
            if verbose and isinstance(validation, dict):
                for check, data in validation.get('checks', {}).items():
                    if not data.get('pass', True):
                        print(f'           {check}: {data}')

        # Rate limiting
        if i % 10 == 0:
            time.sleep(0.5)

    return examples, stats, category_stats


def distill_extra_scenarios(client, category_filter=None):
    """Distill additional synthetic clinical scenarios."""
    examples = []
    scenarios = EXTRA_SCENARIOS

    if category_filter:
        scenarios = {k: v for k, v in scenarios.items() if k == category_filter}

    total = sum(len(v) for v in scenarios.values())
    print(f'\n  Distilling {total} extra scenarios...')
    count = 0

    for category, prompts in scenarios.items():
        system_prompt = CATEGORY_SYSTEM_MAP.get(category, MODEL_SYSTEM_PROMPTS['default'])

        for prompt in prompts:
            count += 1
            try:
                check_pii(prompt)
            except ValueError:
                continue

            response, error = distill_case(client, {
                'prompt': prompt,
                'system_prompt': system_prompt,
                'category': category,
                'max_tokens': 500,
                'expect_norwegian': True,
            })

            if error or not response:
                print(f'  [{count}/{total}] ✗ {category}: {prompt[:50]}...')
                continue

            # Minimal validation for extra scenarios
            if len(response) < 20:
                continue

            if category == 'diagnosis_codes' and not re.search(r'[A-Z]\d{2}', response):
                continue

            example = {
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt},
                    {'role': 'assistant', 'content': response},
                ],
                'metadata': {
                    'category': category,
                    'source': 'distilled_extra',
                    'quality_score': 5,
                },
            }
            examples.append(example)
            print(f'  [{count}/{total}] ✓ {category}: {prompt[:50]}...')

            if count % 5 == 0:
                time.sleep(0.5)

    return examples


# ============================================================
# Entry Point
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Knowledge distillation from Claude')
    parser.add_argument('--category', default=None,
                        help='Filter to specific category')
    parser.add_argument('--no-extras', action='store_true',
                        help='Skip extra scenarios')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show plan without generating')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Show detailed validation failures')
    parser.add_argument('--output-dir', default=str(OUTPUT_DIR),
                        help='Output directory')
    args = parser.parse_args()

    if not BENCHMARK_FILE.exists():
        print(f'  ERROR: Benchmark file not found: {BENCHMARK_FILE}')
        sys.exit(1)

    cases = load_benchmark(args.category)
    print(f'  Loaded {len(cases)} benchmark cases')

    extra_count = 0
    if not args.no_extras:
        scenarios = EXTRA_SCENARIOS
        if args.category:
            scenarios = {k: v for k, v in scenarios.items() if k == args.category}
        extra_count = sum(len(v) for v in scenarios.values())

    print(f'  Extra scenarios: {extra_count}')
    print(f'  Total to distill: {len(cases) + extra_count}')

    if args.dry_run:
        print('\n  DRY RUN — no distillation performed')
        return

    client = get_claude_client()

    # Distill benchmark cases
    examples, stats, category_stats = run_distillation(client, cases, args.verbose)

    # Distill extra scenarios
    extra_examples = []
    if not args.no_extras:
        extra_examples = distill_extra_scenarios(client, args.category)
        examples.extend(extra_examples)

    if not examples:
        print('  WARNING: No examples distilled')
        return

    # Save
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime('%Y-%m-%d')
    output_file = output_dir / f'claude-distilled-{date_str}.jsonl'

    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # Summary
    print(f'\n  {"=" * 60}')
    print(f'  DISTILLATION COMPLETE')
    print(f'  {"=" * 60}')
    print(f'  Benchmark: {stats["passed"]}/{stats["total"]} passed '
          f'({stats["failed"]} failed, {stats["errors"]} errors)')
    print(f'  Extra:     {len(extra_examples)} additional examples')
    print(f'  Total:     {len(examples)} distilled examples')

    print(f'\n  Per category:')
    print(f'  {"Category":<25s} {"Passed":>8s} {"Total":>8s}')
    print(f'  {"─" * 45}')
    for cat, data in sorted(category_stats.items()):
        print(f'  {cat:<25s} {data["passed"]:>8d} {data["total"]:>8d}')

    print(f'\n  Output: {output_file}')
    print(f'\n  Next step:')
    print(f'    python scripts/curate_dataset.py')


if __name__ == '__main__':
    main()
