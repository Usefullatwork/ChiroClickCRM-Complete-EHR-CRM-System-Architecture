#!/usr/bin/env python3
"""
Comprehensive Model Evaluation with Claude Grading — ChiroClickCRM

Hybrid evaluation combining:
1. Fast keyword-based scoring (from evaluate.py) — deterministic, free
2. Claude structured grading (via Batch API) — nuanced, catches quality issues

Runs all benchmark cases through the local model, then submits outputs to
Claude Batch API for per-dimension structured grading using the clinical_grading tool.

Usage:
    python scripts/evaluate_with_claude.py --model chiro-no-lora-v5
    python scripts/evaluate_with_claude.py --model chiro-no-lora-v5 --category red_flags
    python scripts/evaluate_with_claude.py --model chiro-no-lora-v5 --skip-batch
    python scripts/evaluate_with_claude.py --model chiro-no-lora-v5 --output eval-v5.json

Requirements:
    pip install anthropic requests
    ANTHROPIC_API_KEY env var set
    Ollama running at localhost:11434

Output:
    evaluation/claude-eval-{model}-{date}.json
"""

import argparse
import json
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime
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
OLLAMA_URL = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')

# Import keyword-based evaluation
sys.path.insert(0, str(EVAL_DIR))
from evaluate import evaluate_case, compute_partial_score

# Import shared Claude utilities
from claude_utils import (
    get_client, check_pii, build_batch_request, submit_batch,
    extract_batch_tool_use, CLINICAL_GRADING_TOOL,
)


# ============================================================
# Ollama Query
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


# ============================================================
# Grading System Prompt
# ============================================================

GRADING_SYSTEM = (
    "Du er en erfaren klinisk evaluator for norsk kiropraktikk-AI. "
    "Du grader AI-generert klinisk innhold på flere dimensjoner (0-100). "
    "Vær streng men rettferdig. Fokuser på:\n"
    "- Klinisk nøyaktighet: Er informasjonen medisinsk korrekt?\n"
    "- Nøkkelord-dekning: Inneholder svaret forventede kliniske termer?\n"
    "- Sikkerhet: Er røde flagg, kontraindikasjoner og varsler korrekt håndtert?\n"
    "- Norsk kvalitet: Brukes korrekt norsk medisinsk terminologi (ikke engelsk)?\n"
    "Identifiser spesifikke svakheter for å målrette videre trening."
)


# ============================================================
# Main Evaluation Pipeline
# ============================================================

def run_evaluation(model, cases, verbose=False):
    """Run all benchmark cases through Ollama and collect responses."""
    results = []
    total = len(cases)

    print(f'\n  Phase 1: Running {total} benchmark cases through {model}...')
    print(f'  {"─" * 60}')

    for i, case in enumerate(cases, 1):
        prompt = case.get('prompt', '')
        system_prompt = case.get('system_prompt', None)
        max_tokens = case.get('max_tokens', 500)
        case_id = case.get('id', f'case_{i}')
        cat = case.get('category', 'unknown')

        # PII check
        check_pii(prompt)
        check_pii(system_prompt)

        # Query Ollama
        response, latency_ms, error = query_ollama(
            model, prompt, system_prompt, max_tokens
        )

        if error:
            keyword_result = {
                'id': case_id, 'category': cat, 'passed': False,
                'error': error, 'latency_ms': latency_ms, 'checks': {},
                'partial_score': 0,
            }
            print(f'  [{i:3d}/{total}] ✗ {case_id:<35s} ERROR: {error}')
        else:
            keyword_result = evaluate_case(case, response, latency_ms)
            status = '✓' if keyword_result['passed'] else '✗'
            score = keyword_result.get('partial_score', 0)
            print(f'  [{i:3d}/{total}] {status} {case_id:<35s} '
                  f'kw_score={score:5.1f}  {latency_ms}ms')

            if verbose and not keyword_result['passed']:
                for check_name, check_data in keyword_result.get('checks', {}).items():
                    if not check_data.get('pass', True):
                        print(f'           FAIL: {check_name}')

        results.append({
            'case': case,
            'response': response,
            'latency_ms': latency_ms,
            'keyword_result': keyword_result,
        })

    return results


def run_claude_grading(results):
    """Submit all model outputs to Claude Batch API for structured grading.

    Returns dict mapping case_id to structured grade.
    """
    client = get_client()
    batch_requests = []

    # Only grade cases that have responses
    gradable = [(i, r) for i, r in enumerate(results) if r['response']]

    print(f'\n  Phase 2: Claude grading {len(gradable)} responses via Batch API...')

    for i, r in gradable:
        case = r['case']
        case_id = case.get('id', f'case_{i}')
        prompt = case.get('prompt', '')
        response = r['response']

        user_content = (
            f"Kategori: {case.get('category', 'unknown')}\n"
            f"Klinisk prompt:\n{prompt}\n\n"
            f"--- AI-modellens svar ---\n{response[:2000]}\n\n"
            "Grader dette svaret. Bruk clinical_grading-verktøyet."
        )

        req = build_batch_request(
            custom_id=case_id,
            system_prompt=GRADING_SYSTEM,
            user_content=user_content,
            max_tokens=1024,
            tools=[CLINICAL_GRADING_TOOL],
            tool_choice={'type': 'tool', 'name': 'clinical_grading'},
        )
        batch_requests.append(req)

    if not batch_requests:
        return {}

    batch_results = submit_batch(client, batch_requests, poll_interval=15)

    grades = {}
    for custom_id, result in batch_results:
        parsed = extract_batch_tool_use(result, 'clinical_grading')
        if parsed:
            grades[custom_id] = parsed

    return grades


def build_report(model, results, claude_grades):
    """Build comprehensive evaluation report combining keyword + Claude grades."""
    total = len(results)

    # Keyword-based stats
    kw_passed = sum(1 for r in results if r['keyword_result'].get('passed'))
    kw_scores = [r['keyword_result'].get('partial_score', 0) for r in results]

    # Claude-based stats
    claude_passed = 0
    claude_dimensions = defaultdict(list)

    # Per-category breakdown
    cat_data = defaultdict(lambda: {
        'total': 0, 'kw_passed': 0, 'claude_passed': 0,
        'kw_scores': [], 'claude_scores': defaultdict(list),
        'gap_types': defaultdict(int),
    })

    case_details = []

    for r in results:
        case = r['case']
        case_id = case.get('id', 'unknown')
        cat = case.get('category', 'unknown')
        kw = r['keyword_result']

        cat_data[cat]['total'] += 1
        cat_data[cat]['kw_scores'].append(kw.get('partial_score', 0))

        if kw.get('passed'):
            cat_data[cat]['kw_passed'] += 1

        detail = {
            'id': case_id,
            'category': cat,
            'keyword_passed': kw.get('passed', False),
            'keyword_score': kw.get('partial_score', 0),
            'latency_ms': r['latency_ms'],
        }

        # Add Claude grade if available
        grade = claude_grades.get(case_id)
        if grade:
            detail['claude_grade'] = grade
            detail['claude_passed'] = grade.get('overall_pass', False)

            if grade.get('overall_pass'):
                claude_passed += 1
                cat_data[cat]['claude_passed'] += 1

            for dim in ('clinical_accuracy', 'keyword_coverage',
                        'safety_completeness', 'norwegian_quality'):
                val = grade.get(dim, 0)
                claude_dimensions[dim].append(val)
                cat_data[cat]['claude_scores'][dim].append(val)

            for gt in grade.get('gap_types', []):
                cat_data[cat]['gap_types'][gt] += 1

        case_details.append(detail)

    # Build report
    report = {
        'model': model,
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'summary': {
            'total_cases': total,
            'keyword_pass': kw_passed,
            'keyword_pass_rate': round(kw_passed / max(total, 1) * 100, 1),
            'keyword_avg_score': round(sum(kw_scores) / max(len(kw_scores), 1), 1),
        },
        'by_category': {},
        'cases': case_details,
    }

    # Add Claude summary if grades available
    if claude_grades:
        report['summary']['claude_pass'] = claude_passed
        report['summary']['claude_pass_rate'] = round(
            claude_passed / max(total, 1) * 100, 1
        )
        report['summary']['claude_dimensions'] = {}
        for dim, scores in claude_dimensions.items():
            report['summary']['claude_dimensions'][dim] = round(
                sum(scores) / max(len(scores), 1), 1
            )

    # Per-category
    for cat, data in sorted(cat_data.items()):
        n = data['total']
        entry = {
            'total': n,
            'keyword_passed': data['kw_passed'],
            'keyword_pass_rate': round(data['kw_passed'] / max(n, 1) * 100, 1),
            'keyword_avg_score': round(
                sum(data['kw_scores']) / max(len(data['kw_scores']), 1), 1
            ),
        }

        if data['claude_scores']:
            entry['claude_passed'] = data['claude_passed']
            entry['claude_pass_rate'] = round(data['claude_passed'] / max(n, 1) * 100, 1)
            entry['claude_dimensions'] = {}
            for dim, scores in data['claude_scores'].items():
                entry['claude_dimensions'][dim] = round(
                    sum(scores) / max(len(scores), 1), 1
                )

        if data['gap_types']:
            entry['gap_types'] = dict(data['gap_types'])

        report['by_category'][cat] = entry

    return report


def print_report(report):
    """Print formatted evaluation report."""
    s = report['summary']

    print(f'\n  {"=" * 70}')
    print(f'  COMPREHENSIVE EVALUATION: {report["model"]}')
    print(f'  {"=" * 70}')
    print(f'  Keyword pass:  {s["keyword_pass"]}/{s["total_cases"]} ({s["keyword_pass_rate"]}%)')
    print(f'  Keyword avg:   {s["keyword_avg_score"]}/100')

    if 'claude_pass' in s:
        print(f'  Claude pass:   {s["claude_pass"]}/{s["total_cases"]} ({s["claude_pass_rate"]}%)')
        if 'claude_dimensions' in s:
            print(f'\n  Claude per-dimension averages:')
            for dim, score in s['claude_dimensions'].items():
                bar = '█' * int(score / 5) + '░' * (20 - int(score / 5))
                print(f'    {dim:<25s} {score:5.1f}/100 {bar}')

    print(f'\n  Per-category breakdown:')
    header = f'  {"Category":<25s} {"KW Pass":>8s} {"KW Avg":>7s}'
    if 'claude_pass' in s:
        header += f' {"CL Pass":>8s} {"Acc":>5s} {"Safe":>5s} {"NO":>5s}'
    print(header)
    print(f'  {"─" * 75}')

    for cat, data in sorted(report['by_category'].items(),
                            key=lambda x: x[1].get('keyword_pass_rate', 0)):
        line = f'  {cat:<25s} {data["keyword_pass_rate"]:>7.1f}% {data["keyword_avg_score"]:>6.1f}'
        if 'claude_pass_rate' in data:
            dims = data.get('claude_dimensions', {})
            acc = dims.get('clinical_accuracy', 0)
            safe = dims.get('safety_completeness', 0)
            no = dims.get('norwegian_quality', 0)
            line += f' {data["claude_pass_rate"]:>7.1f}% {acc:>4.0f} {safe:>4.0f} {no:>4.0f}'
        print(line)

    # Gap type breakdown
    all_gaps = defaultdict(int)
    for data in report['by_category'].values():
        for gt, count in data.get('gap_types', {}).items():
            all_gaps[gt] += count

    if all_gaps:
        print(f'\n  Gap types (from Claude grading):')
        for gt, count in sorted(all_gaps.items(), key=lambda x: -x[1]):
            print(f'    {gt:<25s} {count}')


# ============================================================
# Entry Point
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description='Comprehensive model evaluation with Claude grading'
    )
    parser.add_argument('--model', default='chiro-no-lora-v5',
                        help='Ollama model name to evaluate')
    parser.add_argument('--category', default=None,
                        help='Filter to specific category')
    parser.add_argument('--skip-batch', action='store_true',
                        help='Skip Claude batch grading (keyword-only eval)')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Show detailed failure info')
    parser.add_argument('--output', default=None,
                        help='Output JSON file path')
    args = parser.parse_args()

    if not BENCHMARK_FILE.exists():
        print(f'  ERROR: Benchmark file not found: {BENCHMARK_FILE}')
        sys.exit(1)

    # Load benchmark cases
    cases = []
    with open(BENCHMARK_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                case = json.loads(line)
                if args.category and case.get('category') != args.category:
                    continue
                cases.append(case)

    if not cases:
        print(f'  ERROR: No benchmark cases loaded')
        sys.exit(1)

    print(f'  Loaded {len(cases)} benchmark cases')

    # Phase 1: Run model outputs
    results = run_evaluation(args.model, cases, verbose=args.verbose)

    # Phase 2: Claude grading via Batch API
    claude_grades = {}
    if not args.skip_batch:
        claude_grades = run_claude_grading(results)

    # Build and print report
    report = build_report(args.model, results, claude_grades)
    print_report(report)

    # Save report
    if args.output:
        output_path = Path(args.output)
    else:
        date_str = datetime.now().strftime('%Y-%m-%d')
        model_safe = args.model.replace('/', '_')
        output_path = EVAL_DIR / f'claude-eval-{model_safe}-{date_str}.json'

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f'\n  Report saved to: {output_path}')

    # Print pass/fail verdict
    kw_rate = report['summary']['keyword_pass_rate']
    cl_rate = report['summary'].get('claude_pass_rate')
    target = 85.0

    print(f'\n  {"=" * 50}')
    if cl_rate is not None:
        overall = (kw_rate + cl_rate) / 2
        verdict = '✓ TARGET MET' if overall >= target else '✗ BELOW TARGET'
        print(f'  Combined score: {overall:.1f}% (keyword {kw_rate}% + claude {cl_rate}%)')
    else:
        overall = kw_rate
        verdict = '✓ TARGET MET' if overall >= target else '✗ BELOW TARGET'
        print(f'  Keyword score: {overall:.1f}%')

    print(f'  Target: {target}%')
    print(f'  Verdict: {verdict}')
    print(f'  {"=" * 50}')


if __name__ == '__main__':
    main()
