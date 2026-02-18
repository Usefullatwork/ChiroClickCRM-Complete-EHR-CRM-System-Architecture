#!/usr/bin/env python3
"""
Model Evaluation Script — ChiroClickCRM AI Models

Runs benchmark cases against models via Ollama API and measures:
- Keyword presence/absence (clinical terms)
- Norwegian language quality (øæå usage)
- Response length (within expected range)
- Latency (ms)
- ROUGE-L against reference answers

Usage:
    python evaluation/evaluate.py --model chiro-norwegian-lora
    python evaluation/evaluate.py --model chiro-norwegian-lora --compare --model-b chiro-norwegian
    python evaluation/evaluate.py --model chiro-no --save-baseline
"""

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'requests', '-q'])
    import requests

OLLAMA_URL = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')
EVAL_DIR = Path(__file__).parent
BENCHMARK_FILE = EVAL_DIR / 'benchmark_cases.jsonl'
BASELINE_DIR = EVAL_DIR / 'baseline'

NORWEGIAN_CHARS = set('æøåÆØÅ')


def load_benchmark():
    """Load benchmark cases from JSONL file."""
    cases = []
    with open(BENCHMARK_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                cases.append(json.loads(line))
    return cases


def query_ollama(model, prompt, system_prompt=None, max_tokens=500, temperature=0.3):
    """Send a prompt to Ollama and return response + latency."""
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


def compute_rouge_l(reference, hypothesis):
    """Compute ROUGE-L F1 score between reference and hypothesis."""
    if not reference or not hypothesis:
        return 0.0

    ref_words = reference.lower().split()
    hyp_words = hypothesis.lower().split()

    if not ref_words or not hyp_words:
        return 0.0

    # LCS using dynamic programming
    m, n = len(ref_words), len(hyp_words)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if ref_words[i - 1] == hyp_words[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    lcs_length = dp[m][n]

    if lcs_length == 0:
        return 0.0

    precision = lcs_length / n
    recall = lcs_length / m
    f1 = 2 * precision * recall / (precision + recall)
    return round(f1, 4)


def norwegian_char_rate(text):
    """Calculate the rate of Norwegian-specific characters in text."""
    alpha_chars = sum(1 for c in text if c.isalpha())
    if alpha_chars == 0:
        return 0.0
    norwegian_count = sum(1 for c in text if c in NORWEGIAN_CHARS)
    return round(norwegian_count / alpha_chars, 4)


def evaluate_case(case, response, latency_ms):
    """Evaluate a single benchmark case against the model response."""
    result = {
        'id': case.get('id', 'unknown'),
        'category': case.get('category', 'unknown'),
        'description': case.get('description', ''),
        'latency_ms': latency_ms,
        'response_length': len(response) if response else 0,
        'checks': {},
        'passed': True,
    }

    if response is None:
        result['passed'] = False
        result['error'] = 'no_response'
        return result

    # 1. Keyword presence
    required_keywords = case.get('required_keywords', [])
    if required_keywords:
        present = []
        missing = []
        for kw in required_keywords:
            if kw.lower() in response.lower():
                present.append(kw)
            else:
                missing.append(kw)
        result['checks']['keywords_present'] = {
            'pass': len(missing) == 0,
            'present': present,
            'missing': missing,
            'score': len(present) / len(required_keywords) if required_keywords else 1.0,
        }
        if missing:
            result['passed'] = False

    # 2. Keyword absence (hallucination check)
    forbidden_keywords = case.get('forbidden_keywords', [])
    if forbidden_keywords:
        found = [kw for kw in forbidden_keywords if kw.lower() in response.lower()]
        result['checks']['keywords_absent'] = {
            'pass': len(found) == 0,
            'found_forbidden': found,
        }
        if found:
            result['passed'] = False

    # 3. Norwegian language quality
    if case.get('expect_norwegian', True):
        rate = norwegian_char_rate(response)
        result['checks']['norwegian_quality'] = {
            'pass': rate > 0.001,  # At least 0.1% Norwegian chars
            'char_rate': rate,
            'has_norwegian_chars': rate > 0,
        }
        # Don't fail on this — some clinical abbreviations are international

    # 4. Response length range
    min_len = case.get('min_response_length', 10)
    max_len = case.get('max_response_length', 5000)
    in_range = min_len <= len(response) <= max_len
    result['checks']['response_length'] = {
        'pass': in_range,
        'actual': len(response),
        'expected_range': [min_len, max_len],
    }
    if not in_range:
        result['passed'] = False

    # 5. ROUGE-L against reference
    reference = case.get('reference_answer', '')
    if reference:
        rouge_l = compute_rouge_l(reference, response)
        result['checks']['rouge_l'] = {
            'score': rouge_l,
            'pass': rouge_l > 0.1,  # Minimum similarity threshold
        }

    # 6. Custom validators
    if case.get('must_contain_code_format'):
        # Check for ICD-10 or ICPC-2 code format
        import re
        has_code = bool(re.search(r'[A-Z]\d{2}(\.\d)?', response))
        result['checks']['code_format'] = {
            'pass': has_code,
            'description': 'Contains ICD-10/ICPC-2 format code',
        }
        if not has_code:
            result['passed'] = False

    return result


def run_evaluation(model, cases, verbose=False):
    """Run full evaluation of a model against all benchmark cases."""
    results = []
    categories = defaultdict(lambda: {'total': 0, 'passed': 0, 'latencies': []})

    print(f'\n  Evaluating model: {model}')
    print(f'  Cases: {len(cases)}')
    print(f'  {"─" * 50}')

    for i, case in enumerate(cases, 1):
        prompt = case.get('prompt', '')
        system_prompt = case.get('system_prompt', None)
        max_tokens = case.get('max_tokens', 500)

        response, latency, error = query_ollama(
            model, prompt, system_prompt, max_tokens
        )

        if error:
            print(f'  [{i}/{len(cases)}] ✗ {case.get("id", "?")} — ERROR: {error}')
            result = {
                'id': case.get('id', 'unknown'),
                'category': case.get('category', 'unknown'),
                'passed': False,
                'error': error,
                'latency_ms': latency,
            }
        else:
            result = evaluate_case(case, response, latency)
            status = '✓' if result['passed'] else '✗'
            print(f'  [{i}/{len(cases)}] {status} {case.get("id", "?")} '
                  f'({latency}ms, {len(response)} chars)')

            if verbose and not result['passed']:
                for check_name, check_data in result.get('checks', {}).items():
                    if not check_data.get('pass', True):
                        print(f'         FAIL: {check_name} — {check_data}')

        result['response_preview'] = (response[:200] + '...') if response and len(response) > 200 else response
        results.append(result)

        cat = case.get('category', 'unknown')
        categories[cat]['total'] += 1
        if result.get('passed'):
            categories[cat]['passed'] += 1
        categories[cat]['latencies'].append(latency)

    return results, dict(categories)


def print_summary(model, results, categories):
    """Print evaluation summary."""
    total = len(results)
    passed = sum(1 for r in results if r.get('passed'))
    latencies = [r['latency_ms'] for r in results if r.get('latency_ms', 0) > 0]

    print(f'\n  {"=" * 50}')
    print(f'  MODEL: {model}')
    print(f'  {"=" * 50}')
    print(f'  Pass rate: {passed}/{total} ({round(passed/max(total,1)*100, 1)}%)')

    if latencies:
        avg_latency = round(sum(latencies) / len(latencies))
        print(f'  Avg latency: {avg_latency}ms')
        print(f'  Min/Max latency: {min(latencies)}ms / {max(latencies)}ms')

    # Per-category breakdown
    print(f'\n  Category breakdown:')
    for cat, data in sorted(categories.items()):
        rate = round(data['passed'] / max(data['total'], 1) * 100, 1)
        avg_lat = round(sum(data['latencies']) / max(len(data['latencies']), 1))
        status = '✓' if data['passed'] == data['total'] else '◐'
        print(f'    {status} {cat:25s} {data["passed"]}/{data["total"]} ({rate}%) avg {avg_lat}ms')

    # ROUGE-L scores
    rouge_scores = [
        r['checks']['rouge_l']['score']
        for r in results
        if 'checks' in r and 'rouge_l' in r.get('checks', {})
    ]
    if rouge_scores:
        avg_rouge = round(sum(rouge_scores) / len(rouge_scores), 4)
        print(f'\n  Avg ROUGE-L: {avg_rouge}')

    return {
        'model': model,
        'total': total,
        'passed': passed,
        'pass_rate': round(passed / max(total, 1) * 100, 1),
        'avg_latency_ms': round(sum(latencies) / max(len(latencies), 1)) if latencies else 0,
        'categories': categories,
        'avg_rouge_l': round(sum(rouge_scores) / len(rouge_scores), 4) if rouge_scores else None,
    }


def compare_models(summary_a, summary_b):
    """Compare two model evaluation summaries."""
    print(f'\n  {"=" * 60}')
    print(f'  COMPARISON: {summary_a["model"]} vs {summary_b["model"]}')
    print(f'  {"=" * 60}')

    metrics = [
        ('Pass rate', f'{summary_a["pass_rate"]}%', f'{summary_b["pass_rate"]}%'),
        ('Avg latency', f'{summary_a["avg_latency_ms"]}ms', f'{summary_b["avg_latency_ms"]}ms'),
    ]

    if summary_a.get('avg_rouge_l') and summary_b.get('avg_rouge_l'):
        metrics.append(('Avg ROUGE-L', str(summary_a['avg_rouge_l']), str(summary_b['avg_rouge_l'])))

    print(f'\n  {"Metric":20s} {"Model A":15s} {"Model B":15s} {"Winner":10s}')
    print(f'  {"─" * 60}')

    for name, val_a, val_b in metrics:
        # Determine winner (higher is better for pass rate and ROUGE, lower for latency)
        if 'latency' in name.lower():
            winner = 'A' if float(val_a.rstrip('ms%')) < float(val_b.rstrip('ms%')) else 'B'
        else:
            winner = 'A' if float(val_a.rstrip('ms%')) > float(val_b.rstrip('ms%')) else 'B'
        winner_name = summary_a['model'] if winner == 'A' else summary_b['model']
        print(f'  {name:20s} {val_a:15s} {val_b:15s} {winner_name:10s}')

    # Category comparison
    all_cats = set(list(summary_a.get('categories', {}).keys()) +
                   list(summary_b.get('categories', {}).keys()))

    if all_cats:
        print(f'\n  Category comparison:')
        for cat in sorted(all_cats):
            cat_a = summary_a.get('categories', {}).get(cat, {'passed': 0, 'total': 0})
            cat_b = summary_b.get('categories', {}).get(cat, {'passed': 0, 'total': 0})
            rate_a = round(cat_a['passed'] / max(cat_a['total'], 1) * 100, 1)
            rate_b = round(cat_b['passed'] / max(cat_b['total'], 1) * 100, 1)
            winner = '←' if rate_a > rate_b else ('→' if rate_b > rate_a else '=')
            print(f'    {cat:25s}  {rate_a:5.1f}%  {winner}  {rate_b:5.1f}%')


def main():
    parser = argparse.ArgumentParser(description='Evaluate AI models against benchmark')
    parser.add_argument('--model', required=True, help='Model to evaluate (e.g., chiro-norwegian-lora)')
    parser.add_argument('--model-b', default=None, help='Second model for comparison')
    parser.add_argument('--compare', action='store_true', help='Enable comparison mode')
    parser.add_argument('--save-baseline', action='store_true', help='Save results as baseline')
    parser.add_argument('--verbose', action='store_true', help='Show detailed failures')
    parser.add_argument('--category', default=None, help='Only run cases from this category')
    parser.add_argument('--output', default=None, help='Save results to JSON file')
    args = parser.parse_args()

    if not BENCHMARK_FILE.exists():
        print(f'Error: Benchmark file not found: {BENCHMARK_FILE}')
        print('Run this first: create benchmark_cases.jsonl')
        sys.exit(1)

    # Check Ollama is running
    try:
        resp = requests.get(f'{OLLAMA_URL}/api/tags', timeout=5)
        models = [m['name'].split(':')[0] for m in resp.json().get('models', [])]
        print(f'  Ollama models available: {", ".join(models)}')
    except Exception as e:
        print(f'Error: Ollama not available at {OLLAMA_URL}: {e}')
        print('Start Ollama first: ollama serve')
        sys.exit(1)

    cases = load_benchmark()
    print(f'  Loaded {len(cases)} benchmark cases')

    # Filter by category
    if args.category:
        cases = [c for c in cases if c.get('category') == args.category]
        print(f'  Filtered to {len(cases)} cases in category: {args.category}')

    if not cases:
        print('No benchmark cases to evaluate!')
        sys.exit(1)

    # Evaluate model A
    results_a, cats_a = run_evaluation(args.model, cases, verbose=args.verbose)
    summary_a = print_summary(args.model, results_a, cats_a)

    # Evaluate model B if comparison mode
    summary_b = None
    if args.compare and args.model_b:
        results_b, cats_b = run_evaluation(args.model_b, cases, verbose=args.verbose)
        summary_b = print_summary(args.model_b, results_b, cats_b)
        compare_models(summary_a, summary_b)

    # Save results
    output_data = {
        'model_a': {
            'model': args.model,
            'summary': summary_a,
            'results': results_a,
        },
    }
    if summary_b:
        output_data['model_b'] = {
            'model': args.model_b,
            'summary': summary_b,
        }

    if args.save_baseline:
        os.makedirs(BASELINE_DIR, exist_ok=True)
        baseline_path = BASELINE_DIR / f'{args.model.replace("/", "_")}.json'
        with open(baseline_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f'\n  Baseline saved to: {baseline_path}')

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f'\n  Results saved to: {args.output}')


if __name__ == '__main__':
    main()
