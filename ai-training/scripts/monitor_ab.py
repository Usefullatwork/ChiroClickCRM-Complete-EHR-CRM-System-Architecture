#!/usr/bin/env python3
"""
A/B Test Monitoring Script — ChiroClickCRM

Queries the ai_feedback table to compare acceptance rates between
base models and LoRA variants. Outputs a report with statistical
significance testing.

Usage:
    python scripts/monitor_ab.py
    python scripts/monitor_ab.py --days 30
    python scripts/monitor_ab.py --model chiro-norwegian
    python scripts/monitor_ab.py --format csv
"""

import argparse
import json
import math
import os
import sys
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'requests', '-q'])
    import requests

# Backend API configuration
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:3000')
API_BASE = f'{BACKEND_URL}/api/v1'

# Model pairs: base → LoRA variant
MODEL_PAIRS = {
    'chiro-no': 'chiro-no-lora',
    'chiro-norwegian': 'chiro-norwegian-lora',
    'chiro-medical': 'chiro-medical-lora',
    'chiro-fast': 'chiro-fast-lora',
}


def login(email=None, password=None):
    """Login and return session cookie. Uses AB_EMAIL/AB_PASSWORD env vars or defaults."""
    email = email or os.environ.get('AB_EMAIL', 'admin@chiroclickcrm.no')
    password = password or os.environ.get('AB_PASSWORD', 'admin123')
    try:
        resp = requests.post(f'{API_BASE}/auth/login', json={
            'email': email,
            'password': password,
        }, timeout=10)
        if resp.status_code == 200:
            return resp.cookies
        return None
    except Exception:
        return None


def fetch_feedback(cookies, days=7, model_filter=None):
    """Fetch AI feedback from the backend API."""
    try:
        params = {'days': days}
        if model_filter:
            params['model'] = model_filter

        resp = requests.get(f'{API_BASE}/ai-feedback/performance',
                          cookies=cookies, params=params, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception as e:
        print(f'  Warning: Could not fetch feedback data: {e}')
        return None


def fetch_feedback_export(cookies, days=7):
    """Export raw feedback data for detailed analysis."""
    try:
        params = {'format': 'json', 'days': days}
        resp = requests.get(f'{API_BASE}/ai-feedback/feedback/export',
                          cookies=cookies, params=params, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception as e:
        print(f'  Warning: Could not export feedback: {e}')
        return None


def compute_z_test(n1, p1, n2, p2):
    """Two-proportion z-test for comparing acceptance rates."""
    if n1 == 0 or n2 == 0:
        return None, None

    # Pooled proportion
    p_pool = (n1 * p1 + n2 * p2) / (n1 + n2)

    if p_pool == 0 or p_pool == 1:
        return 0, 1.0

    # Standard error
    se = math.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))

    if se == 0:
        return 0, 1.0

    # Z-statistic
    z = (p1 - p2) / se

    # Two-tailed p-value (approximation using normal CDF)
    p_value = 2 * (1 - norm_cdf(abs(z)))

    return round(z, 3), round(p_value, 4)


def norm_cdf(x):
    """Standard normal CDF approximation (Abramowitz & Stegun)."""
    a1 = 0.254829592
    a2 = -0.284496736
    a3 = 1.421413741
    a4 = -1.453152027
    a5 = 1.061405429
    p = 0.3275911

    sign = 1
    if x < 0:
        sign = -1
    x = abs(x) / math.sqrt(2)

    t = 1.0 / (1.0 + p * x)
    y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)


def analyze_ab_results(feedback_data):
    """Analyze A/B test results from feedback data."""
    if not feedback_data:
        return {}

    # Group by model
    model_stats = {}

    items = feedback_data if isinstance(feedback_data, list) else feedback_data.get('items', [])

    for item in items:
        model = item.get('model_name', item.get('model', 'unknown'))
        if model not in model_stats:
            model_stats[model] = {
                'total': 0,
                'accepted': 0,
                'rejected': 0,
                'modified': 0,
                'ratings': [],
                'latencies': [],
            }

        stats = model_stats[model]
        stats['total'] += 1

        if item.get('accepted'):
            stats['accepted'] += 1
        elif item.get('correction_type') == 'rejected':
            stats['rejected'] += 1
        else:
            stats['modified'] += 1

        if item.get('rating'):
            stats['ratings'].append(item['rating'])
        if item.get('time_to_decision'):
            stats['latencies'].append(item['time_to_decision'])

    return model_stats


def print_report(model_stats, days):
    """Print formatted A/B test report."""
    print(f'\n{"=" * 70}')
    print(f'  A/B TEST MONITORING REPORT — Last {days} days')
    print(f'  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    print(f'{"=" * 70}')

    if not model_stats:
        print(f'\n  No feedback data available.')
        print(f'  Make sure the backend is running and has feedback entries.')
        return

    # Summary table
    print(f'\n  {"Model":<25s} {"Total":>6s} {"Accept":>7s} {"Modify":>7s} {"Reject":>7s} {"Rate":>6s} {"Avg★":>5s}')
    print(f'  {"─" * 65}')

    for model, stats in sorted(model_stats.items()):
        total = stats['total']
        accept_rate = round(stats['accepted'] / max(total, 1) * 100, 1)
        avg_rating = round(sum(stats['ratings']) / max(len(stats['ratings']), 1), 1) if stats['ratings'] else '-'

        print(f'  {model:<25s} {total:>6d} {stats["accepted"]:>7d} {stats["modified"]:>7d} '
              f'{stats["rejected"]:>7d} {accept_rate:>5.1f}% {avg_rating:>5s}')

    # Pairwise comparisons
    print(f'\n  PAIRWISE COMPARISONS (Base vs LoRA):')
    print(f'  {"─" * 65}')

    for base, lora in MODEL_PAIRS.items():
        base_stats = model_stats.get(base)
        lora_stats = model_stats.get(lora)

        if not base_stats or not lora_stats:
            continue

        base_rate = base_stats['accepted'] / max(base_stats['total'], 1)
        lora_rate = lora_stats['accepted'] / max(lora_stats['total'], 1)
        diff = round((lora_rate - base_rate) * 100, 1)

        z, p_value = compute_z_test(
            base_stats['total'], base_rate,
            lora_stats['total'], lora_rate
        )

        significant = p_value is not None and p_value < 0.05
        sig_marker = ' ***' if significant else ''

        winner = 'LoRA' if diff > 0 else ('Base' if diff < 0 else 'Tie')
        print(f'\n  {base} vs {lora}:')
        print(f'    Base:  {base_stats["total"]} samples, {round(base_rate*100,1)}% acceptance')
        print(f'    LoRA:  {lora_stats["total"]} samples, {round(lora_rate*100,1)}% acceptance')
        print(f'    Diff:  {diff:+.1f}% ({winner}){sig_marker}')

        if z is not None:
            print(f'    Z={z}, p={p_value} {"(significant)" if significant else "(not significant)"}')

        # Sample size warning
        min_samples = min(base_stats['total'], lora_stats['total'])
        if min_samples < 30:
            print(f'    ⚠ Low sample size ({min_samples}) — need ≥30 for reliable comparison')

    # Rollback recommendations
    print(f'\n  RECOMMENDATIONS:')
    print(f'  {"─" * 65}')

    for base, lora in MODEL_PAIRS.items():
        base_stats = model_stats.get(base)
        lora_stats = model_stats.get(lora)

        if not base_stats or not lora_stats:
            continue

        base_rate = base_stats['accepted'] / max(base_stats['total'], 1)
        lora_rate = lora_stats['accepted'] / max(lora_stats['total'], 1)
        min_samples = min(base_stats['total'], lora_stats['total'])

        if min_samples < 30:
            print(f'  {lora}: INSUFFICIENT DATA — collect more feedback')
        elif lora_rate < base_rate - 0.05:  # >5% worse
            print(f'  {lora}: ⚠ ROLLBACK RECOMMENDED — {round((base_rate-lora_rate)*100,1)}% worse than base')
        elif lora_rate > base_rate + 0.05:  # >5% better
            print(f'  {lora}: ✓ PROMOTE — {round((lora_rate-base_rate)*100,1)}% better than base')
        else:
            print(f'  {lora}: ◐ CONTINUE TESTING — no significant difference yet')


def export_csv(model_stats, days, output_path):
    """Export results as CSV."""
    import csv
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['model', 'total', 'accepted', 'modified', 'rejected',
                        'acceptance_rate', 'avg_rating', 'period_days'])

        for model, stats in sorted(model_stats.items()):
            total = stats['total']
            accept_rate = round(stats['accepted'] / max(total, 1) * 100, 1)
            avg_rating = round(sum(stats['ratings']) / max(len(stats['ratings']), 1), 1) if stats['ratings'] else 0

            writer.writerow([model, total, stats['accepted'], stats['modified'],
                           stats['rejected'], accept_rate, avg_rating, days])

    print(f'\n  CSV exported to: {output_path}')


def main():
    parser = argparse.ArgumentParser(description='Monitor A/B test results for AI models')
    parser.add_argument('--days', type=int, default=7, help='Number of days to analyze (default: 7)')
    parser.add_argument('--model', type=str, default=None, help='Filter by model name')
    parser.add_argument('--format', choices=['text', 'csv', 'json'], default='text',
                       help='Output format')
    parser.add_argument('--output', type=str, default=None, help='Output file path')
    parser.add_argument('--no-login', action='store_true',
                       help='Skip login (use with already-exported data)')
    args = parser.parse_args()

    print(f'  A/B Test Monitor — ChiroClickCRM')
    print(f'  Analyzing last {args.days} days...')

    # Try to login and fetch data
    cookies = None
    if not args.no_login:
        cookies = login()
        if not cookies:
            print(f'  Warning: Could not login to backend. Using mock data analysis.')

    # Fetch feedback data
    feedback_data = None
    if cookies:
        feedback_data = fetch_feedback_export(cookies, args.days)

    if not feedback_data:
        print(f'\n  No feedback data available from backend.')
        print(f'  This script requires the backend to be running with feedback data.')
        print(f'  To populate feedback, use the application and rate AI suggestions.')
        print(f'\n  Alternatively, check the /ai-feedback/performance endpoint manually:')
        print(f'  curl -b cookies.txt {API_BASE}/ai-feedback/performance')
        return

    # Analyze
    model_stats = analyze_ab_results(feedback_data)

    if args.format == 'text':
        print_report(model_stats, args.days)
    elif args.format == 'csv':
        output_path = args.output or f'ab-results-{args.days}d.csv'
        export_csv(model_stats, args.days, output_path)
    elif args.format == 'json':
        output_path = args.output or f'ab-results-{args.days}d.json'
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'period_days': args.days,
                'generated': datetime.now().isoformat(),
                'models': model_stats,
            }, f, indent=2, ensure_ascii=False, default=str)
        print(f'\n  JSON exported to: {output_path}')


if __name__ == '__main__':
    main()
