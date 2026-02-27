#!/usr/bin/env python3
"""
Gap Analysis Script — ChiroClickCRM AI Models

Runs all benchmark cases through both the local Ollama model AND Claude,
compares results, and produces a gap report showing exactly where the
local model fails relative to Claude.

This enables targeted training data generation instead of blind dataset expansion.

Usage:
    python scripts/analyze_gaps.py
    python scripts/analyze_gaps.py --model chiro-no-lora-v2
    python scripts/analyze_gaps.py --model chiro-no-lora-v2 --skip-claude
    python scripts/analyze_gaps.py --category red_flags --verbose

Requirements:
    pip install anthropic requests
    ANTHROPIC_API_KEY env var set (for Claude comparison)
    Ollama running at localhost:11434

Output:
    evaluation/gap-analysis.json
"""

import argparse
import json
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'requests', '-q'])
    import requests

# ============================================================
# Paths
# ============================================================

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
EVAL_DIR = AI_TRAINING_DIR / 'evaluation'
BENCHMARK_FILE = EVAL_DIR / 'benchmark_cases.jsonl'
OUTPUT_FILE = EVAL_DIR / 'gap-analysis.json'
OLLAMA_URL = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')

# ============================================================
# Import evaluation functions from evaluate.py
# ============================================================

sys.path.insert(0, str(EVAL_DIR))
from evaluate import (
    evaluate_case,
    compute_partial_score,
    keyword_present,
    SYNONYMS,
)

# ============================================================
# GDPR: Refuse to process data with real PII
# ============================================================

FNUMMER_PATTERN = re.compile(r'\b\d{6}\s?\d{5}\b')


def check_pii(text):
    """Check for Norwegian fødselsnummer patterns. Refuse if found."""
    if text and FNUMMER_PATTERN.search(text):
        raise ValueError("PII detected (fødselsnummer pattern). Refusing to process.")
    return True


# ============================================================
# Model Query Functions
# ============================================================

def query_ollama(model, prompt, system_prompt=None, max_tokens=500, temperature=0.3):
    """Send prompt to Ollama, return (response, latency_ms, error)."""
    payload = {
        'model': model,
        'prompt': f'{system_prompt}\n\n{prompt}' if system_prompt else prompt,
        'stream': False,
        'options': {
            'temperature': temperature,
            'num_predict': max_tokens,
        },
    }
    start = time.time()
    try:
        resp = requests.post(f'{OLLAMA_URL}/api/generate', json=payload, timeout=120)
        latency_ms = round((time.time() - start) * 1000)
        if resp.status_code != 200:
            return None, latency_ms, f'HTTP {resp.status_code}'
        data = resp.json()
        return data.get('response', ''), latency_ms, None
    except requests.exceptions.Timeout:
        return None, 120000, 'timeout'
    except requests.exceptions.ConnectionError:
        return None, 0, 'connection_error'
    except Exception as e:
        return None, 0, str(e)


def query_claude(prompt, system_prompt=None, max_tokens=500, temperature=0.3):
    """Send prompt to Claude via Anthropic SDK, return (response, latency_ms, error)."""
    try:
        import anthropic
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'anthropic', '-q'])
        import anthropic

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        return None, 0, 'ANTHROPIC_API_KEY not set'

    client = anthropic.Anthropic(api_key=api_key)

    messages = [{'role': 'user', 'content': prompt}]
    kwargs = {
        'model': 'claude-sonnet-4-6',
        'max_tokens': max_tokens,
        'messages': messages,
        'temperature': temperature,
    }
    if system_prompt:
        kwargs['system'] = system_prompt

    start = time.time()
    try:
        response = client.messages.create(**kwargs)
        latency_ms = round((time.time() - start) * 1000)
        text = ''.join(b.text for b in response.content if b.type == 'text')
        return text, latency_ms, None
    except Exception as e:
        latency_ms = round((time.time() - start) * 1000)
        return None, latency_ms, str(e)


def grade_with_claude(prompt, ollama_output, claude_output):
    """Use Claude to grade both outputs side-by-side on clinical quality.

    Returns dict with svar_a (ollama) and svar_b (claude) grades.
    """
    try:
        import anthropic
    except ImportError:
        return None

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        return None

    grading_system = (
        "Du er en erfaren klinisk evaluator. Grader AI-generert klinisk innhold "
        "på en skala fra 1-5 for hver kategori:\n\n"
        "1. Klinisk nøyaktighet (accuracy, 1-5)\n"
        "2. Relevans (relevance, 1-5)\n"
        "3. Fullstendighet (completeness, 1-5)\n"
        "4. Språkkvalitet (language, 1-5)\n"
        "5. Sikkerhet (safety, 1-5) — røde flagg og kontraindikasjoner\n\n"
        "Svar BARE som JSON:\n"
        '{"svar_a": {"accuracy": N, "relevance": N, "completeness": N, '
        '"language": N, "safety": N, "overall": N}, '
        '"svar_b": {"accuracy": N, "relevance": N, "completeness": N, '
        '"language": N, "safety": N, "overall": N}, '
        '"winner": "A"|"B"|"tie", "reasoning": "kort forklaring"}'
    )

    grading_prompt = (
        f"Klinisk prompt:\n{prompt}\n\n"
        f"--- Svar A (Lokal modell) ---\n{ollama_output}\n\n"
        f"--- Svar B (Claude) ---\n{claude_output}\n\n"
        "Grader begge svar separat."
    )

    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1024,
            system=grading_system,
            messages=[{'role': 'user', 'content': grading_prompt}],
        )
        text = ''.join(b.text for b in response.content if b.type == 'text')
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group())
    except Exception:
        pass
    return None


# ============================================================
# Gap Classification
# ============================================================

def classify_gap(case, ollama_result, claude_result):
    """Classify the type of gap between ollama and claude results."""
    gaps = []

    o_checks = ollama_result.get('checks', {})
    c_checks = claude_result.get('checks', {}) if claude_result else {}

    # Missing keywords (most common failure mode)
    o_kw = o_checks.get('keywords_present', {})
    if o_kw and not o_kw.get('pass', True):
        gaps.append('missing_keywords')

    # Forbidden keywords present (hallucination)
    o_absent = o_checks.get('keywords_absent', {})
    if o_absent and not o_absent.get('pass', True):
        gaps.append('hallucination')

    # Wrong code format
    o_code = o_checks.get('code_format', {})
    if o_code and not o_code.get('pass', True):
        gaps.append('code_format')

    # Response too short/long
    o_len = o_checks.get('response_length', {})
    if o_len and not o_len.get('pass', True):
        actual = o_len.get('actual', 0)
        expected = o_len.get('expected_range', [10, 5000])
        if actual < expected[0]:
            gaps.append('too_short')
        elif actual > expected[1]:
            gaps.append('too_long')

    # Norwegian quality issues
    o_no = o_checks.get('norwegian_quality', {})
    if o_no and o_no.get('char_rate', 0) < 0.001:
        gaps.append('poor_norwegian')

    if not gaps:
        gaps.append('partial_quality')

    return gaps


# ============================================================
# Main Analysis
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


def run_gap_analysis(model, cases, skip_claude=False, verbose=False):
    """Run gap analysis comparing Ollama model vs Claude on all cases."""
    results = []
    categories = defaultdict(lambda: {
        'ollama_passed': 0, 'claude_passed': 0, 'total': 0,
        'ollama_partial': [], 'claude_partial': [],
        'gap_cases': [], 'gap_types': defaultdict(int),
    })

    total = len(cases)
    print(f'\n  Gap Analysis: {model} vs Claude')
    print(f'  Cases: {total}')
    print(f'  {"─" * 60}')

    for i, case in enumerate(cases, 1):
        prompt = case.get('prompt', '')
        system_prompt = case.get('system_prompt', None)
        max_tokens = case.get('max_tokens', 500)
        cat = case.get('category', 'unknown')
        case_id = case.get('id', f'case_{i}')

        # PII check on benchmark data
        check_pii(prompt)
        check_pii(system_prompt)

        # --- Ollama ---
        o_response, o_latency, o_error = query_ollama(
            model, prompt, system_prompt, max_tokens
        )
        if o_error:
            o_result = {'id': case_id, 'category': cat, 'passed': False,
                        'error': o_error, 'latency_ms': o_latency, 'checks': {}}
        else:
            o_result = evaluate_case(case, o_response, o_latency)

        # --- Claude ---
        c_result = None
        c_response = None
        if not skip_claude:
            c_response, c_latency, c_error = query_claude(
                prompt, system_prompt, max_tokens
            )
            if c_error:
                c_result = {'id': case_id, 'category': cat, 'passed': False,
                            'error': c_error, 'latency_ms': c_latency, 'checks': {}}
            else:
                c_result = evaluate_case(case, c_response, c_latency)

        # --- Claude Grading ---
        grade = None
        if o_response and c_response and not skip_claude:
            grade = grade_with_claude(prompt, o_response, c_response)

        # --- Gap Classification ---
        o_passed = o_result.get('passed', False)
        c_passed = c_result.get('passed', False) if c_result else None
        o_partial = o_result.get('partial_score', 0)
        c_partial = c_result.get('partial_score', 0) if c_result else None

        gap_types = classify_gap(case, o_result, c_result) if not o_passed else []

        # Status display
        o_status = '✓' if o_passed else '✗'
        c_status = ('✓' if c_passed else '✗') if c_result else '—'
        print(f'  [{i:3d}/{total}] {o_status}/{c_status}  {case_id:<35s} '
              f'ollama={o_partial:5.1f}  claude={c_partial if c_partial is not None else "—":>5}')

        if verbose and not o_passed:
            for gap in gap_types:
                print(f'           gap: {gap}')
            for check_name, check_data in o_result.get('checks', {}).items():
                if not check_data.get('pass', True):
                    print(f'           FAIL: {check_name}')

        # Aggregate per category
        cat_data = categories[cat]
        cat_data['total'] += 1
        if o_passed:
            cat_data['ollama_passed'] += 1
        else:
            cat_data['gap_cases'].append(case_id)
            for gap in gap_types:
                cat_data['gap_types'][gap] += 1
        cat_data['ollama_partial'].append(o_partial)

        if c_result:
            if c_passed:
                cat_data['claude_passed'] += 1
            cat_data['claude_partial'].append(c_partial)

        # Build result entry
        entry = {
            'id': case_id,
            'category': cat,
            'ollama_passed': o_passed,
            'ollama_score': o_partial,
            'ollama_latency_ms': o_result.get('latency_ms', 0),
            'gap_types': gap_types,
        }
        if c_result:
            entry['claude_passed'] = c_passed
            entry['claude_score'] = c_partial
            entry['claude_latency_ms'] = c_result.get('latency_ms', 0)
        if c_response:
            entry['claude_output'] = c_response[:2000]  # Truncate for storage
        if grade:
            entry['claude_grade'] = grade

        # Store check details for gap cases
        if not o_passed:
            entry['ollama_checks'] = o_result.get('checks', {})
            if o_response:
                entry['ollama_output_preview'] = o_response[:500]

        results.append(entry)

    return results, dict(categories)


def build_report(model, results, categories, skip_claude):
    """Build the gap analysis JSON report."""
    total = len(results)
    ollama_passed = sum(1 for r in results if r.get('ollama_passed'))
    claude_passed = sum(1 for r in results if r.get('claude_passed')) if not skip_claude else None

    # Overall gap types
    all_gap_types = defaultdict(int)
    for r in results:
        if not r.get('ollama_passed'):
            for gap in r.get('gap_types', []):
                all_gap_types[gap] += 1

    report = {
        'model': model,
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'summary': {
            'total_cases': total,
            'ollama_pass': ollama_passed,
            'ollama_pass_rate': round(ollama_passed / max(total, 1) * 100, 1),
            'ollama_avg_partial': round(
                sum(r.get('ollama_score', 0) for r in results) / max(total, 1), 1
            ),
            'gap_cases_count': total - ollama_passed,
            'gap_type_breakdown': dict(all_gap_types),
        },
        'by_category': {},
        'cases': results,
    }

    if not skip_claude:
        report['summary']['claude_pass'] = claude_passed
        report['summary']['claude_pass_rate'] = round(
            claude_passed / max(total, 1) * 100, 1
        ) if claude_passed is not None else None

    # Per-category breakdown
    for cat, data in sorted(categories.items()):
        cat_total = data['total']
        o_rate = round(data['ollama_passed'] / max(cat_total, 1) * 100, 1)
        o_avg = round(sum(data['ollama_partial']) / max(len(data['ollama_partial']), 1), 1)

        cat_entry = {
            'total': cat_total,
            'ollama_passed': data['ollama_passed'],
            'ollama_pass_rate': o_rate,
            'ollama_avg_partial': o_avg,
            'gap_cases': data['gap_cases'],
            'gap_types': dict(data['gap_types']),
        }

        if data['claude_partial']:
            c_rate = round(data['claude_passed'] / max(cat_total, 1) * 100, 1)
            c_avg = round(sum(data['claude_partial']) / max(len(data['claude_partial']), 1), 1)
            cat_entry['claude_passed'] = data['claude_passed']
            cat_entry['claude_pass_rate'] = c_rate
            cat_entry['claude_avg_partial'] = c_avg

        report['by_category'][cat] = cat_entry

    return report


# ============================================================
# Entry Point
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Gap analysis: Ollama vs Claude')
    parser.add_argument('--model', default='chiro-no-lora-v2',
                        help='Ollama model name (default: chiro-no-lora-v2)')
    parser.add_argument('--skip-claude', action='store_true',
                        help='Skip Claude comparison (Ollama-only eval)')
    parser.add_argument('--category', default=None,
                        help='Filter to specific category')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Show detailed failure info')
    parser.add_argument('--output', default=str(OUTPUT_FILE),
                        help='Output JSON file path')
    args = parser.parse_args()

    if not BENCHMARK_FILE.exists():
        print(f'  ERROR: Benchmark file not found: {BENCHMARK_FILE}')
        sys.exit(1)

    cases = load_benchmark(args.category)
    if not cases:
        print(f'  ERROR: No benchmark cases loaded')
        sys.exit(1)

    print(f'  Loaded {len(cases)} benchmark cases')

    results, categories = run_gap_analysis(
        args.model, cases, args.skip_claude, args.verbose
    )

    report = build_report(args.model, results, categories, args.skip_claude)

    # Print summary
    s = report['summary']
    print(f'\n  {"=" * 60}')
    print(f'  GAP ANALYSIS SUMMARY')
    print(f'  {"=" * 60}')
    print(f'  Model:        {args.model}')
    print(f'  Ollama pass:  {s["ollama_pass"]}/{s["total_cases"]} ({s["ollama_pass_rate"]}%)')
    if not args.skip_claude and s.get('claude_pass') is not None:
        print(f'  Claude pass:  {s["claude_pass"]}/{s["total_cases"]} ({s["claude_pass_rate"]}%)')
    print(f'  Avg partial:  {s["ollama_avg_partial"]}/100')
    print(f'  Gap cases:    {s["gap_cases_count"]}')
    if s['gap_type_breakdown']:
        print(f'\n  Gap types:')
        for gap_type, count in sorted(s['gap_type_breakdown'].items(), key=lambda x: -x[1]):
            print(f'    {gap_type:<25s} {count}')

    print(f'\n  Per-category breakdown:')
    print(f'  {"Category":<25s} {"Ollama":>8s} {"Claude":>8s} {"Gap":>5s}')
    print(f'  {"─" * 50}')
    for cat, data in sorted(report['by_category'].items(), key=lambda x: x[1]['ollama_pass_rate']):
        o_str = f'{data["ollama_pass_rate"]}%'
        c_str = f'{data.get("claude_pass_rate", "—")}%' if 'claude_pass_rate' in data else '—'
        gap = len(data['gap_cases'])
        print(f'  {cat:<25s} {o_str:>8s} {c_str:>8s} {gap:>5d}')

    # Write report
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f'\n  Report saved to: {output_path}')
    print(f'  Run generation next:')
    print(f'    python scripts/generate_with_claude.py --gap-report {output_path}')


if __name__ == '__main__':
    main()
