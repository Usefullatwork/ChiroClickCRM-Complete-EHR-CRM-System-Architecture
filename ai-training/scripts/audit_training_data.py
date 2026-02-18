#!/usr/bin/env python3
"""
Training Data Quality Audit
Loads all processed datasets and checks for quality issues.

Usage:
    python scripts/audit_training_data.py
    python scripts/audit_training_data.py --fix  # Auto-remove bad examples
    python scripts/audit_training_data.py --dataset norwegian-clinical
"""

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# Norwegian characters (øæå) indicate Norwegian text
NORWEGIAN_CHARS = set('æøåÆØÅ')
# Minimum response length (chars) to be useful for training
MIN_RESPONSE_LENGTH = 20
# Maximum example length in chars (~tokens ≈ chars / 4)
MAX_EXAMPLE_CHARS = 16000  # ~4096 tokens
# Minimum example length
MIN_EXAMPLE_CHARS = 30

# Common contamination keywords (non-clinical)
CONTAMINATION_KEYWORDS = [
    'bubble.io', 'react.js', 'github.com', 'npm install', 'react component',
    'api endpoint', 'deployment pipeline', 'javascript', 'typescript',
    'docker compose', 'kubernetes', 'redux', 'tailwind css', 'prisma',
    'webpack config', 'next.js', 'node_modules',
    # Note: 'vite' excluded — it means "to know" in Norwegian (å vite)
    # Note: 'frontend'/'backend' excluded — too common in general usage
]

DATASETS = {
    'all-clean': 'General clinical (all)',
    'norwegian-clinical': 'Norwegian clinical specialist',
    'medical-safety': 'Medical safety & red flags',
    'quick-fields': 'Quick field autocomplete',
}


def load_jsonl(path):
    """Load JSONL file, return list of dicts."""
    examples = []
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                examples.append(json.loads(line))
            except json.JSONDecodeError as e:
                examples.append({'_error': str(e), '_line': i})
    return examples


def has_norwegian_chars(text):
    """Check if text contains Norwegian-specific characters."""
    return bool(NORWEGIAN_CHARS & set(text))


def detect_language(text):
    """Simple language detection based on character patterns."""
    norwegian_count = sum(1 for c in text if c in NORWEGIAN_CHARS)
    total_alpha = sum(1 for c in text if c.isalpha())
    if total_alpha == 0:
        return 'unknown'
    ratio = norwegian_count / total_alpha
    if ratio > 0.005:  # ~0.5% Norwegian chars → likely Norwegian
        return 'norwegian'
    # Check for common Norwegian words
    norwegian_words = ['og', 'er', 'det', 'som', 'på', 'med', 'den', 'til', 'av', 'for',
                       'pasient', 'smerte', 'behandling', 'vurdering', 'tiltak']
    words = text.lower().split()
    matches = sum(1 for w in words if w in norwegian_words)
    if matches >= 3:
        return 'norwegian'
    return 'english_or_other'


def check_chatml_format(example):
    """Validate ChatML format: messages array with system/user/assistant."""
    issues = []

    if 'messages' not in example:
        issues.append('missing_messages_key')
        return issues

    messages = example['messages']
    if not isinstance(messages, list):
        issues.append('messages_not_list')
        return issues

    if len(messages) < 2:
        issues.append(f'too_few_messages ({len(messages)})')
        return issues

    if len(messages) > 10:
        issues.append(f'too_many_messages ({len(messages)})')

    roles = [m.get('role', 'missing') for m in messages]

    # Check for system prompt
    if roles[0] != 'system':
        issues.append('no_system_prompt')

    # Check for assistant response
    if 'assistant' not in roles:
        issues.append('no_assistant_response')

    # Check for user message
    if 'user' not in roles:
        issues.append('no_user_message')

    # Check for empty content
    for m in messages:
        if not m.get('content', '').strip():
            issues.append(f'empty_{m.get("role", "unknown")}_content')

    return issues


def check_content_quality(example):
    """Check content quality of an example."""
    issues = []

    if 'messages' not in example:
        return issues

    messages = example['messages']

    # Get assistant response
    assistant_msgs = [m for m in messages if m.get('role') == 'assistant']
    if not assistant_msgs:
        return issues

    response = assistant_msgs[-1].get('content', '')

    # Truncated response
    if len(response) < MIN_RESPONSE_LENGTH:
        issues.append(f'short_response ({len(response)} chars)')

    # Total example length
    total_chars = sum(len(m.get('content', '')) for m in messages)
    if total_chars > MAX_EXAMPLE_CHARS:
        issues.append(f'too_long ({total_chars} chars, ~{total_chars//4} tokens)')
    if total_chars < MIN_EXAMPLE_CHARS:
        issues.append(f'too_short ({total_chars} chars)')

    # Check for contamination
    all_text = ' '.join(m.get('content', '') for m in messages).lower()
    for keyword in CONTAMINATION_KEYWORDS:
        if keyword in all_text:
            issues.append(f'contamination ({keyword})')
            break

    # Check for repetition (same sentence repeated 3+ times)
    sentences = re.split(r'[.!?]\s+', response)
    sentence_counts = Counter(s.strip() for s in sentences if len(s.strip()) > 10)
    for sentence, count in sentence_counts.items():
        if count >= 3:
            issues.append(f'repetition ({count}x)')
            break

    return issues


def check_language_consistency(example, expected_language='norwegian'):
    """Check if example matches expected language."""
    issues = []

    if 'messages' not in example:
        return issues

    messages = example['messages']
    assistant_msgs = [m for m in messages if m.get('role') == 'assistant']
    if not assistant_msgs:
        return issues

    response = assistant_msgs[-1].get('content', '')
    lang = detect_language(response)

    if expected_language == 'norwegian' and lang == 'english_or_other':
        # Double check — some clinical abbreviations look English
        if len(response) > 100:  # Only flag if response is substantial
            issues.append('possible_english_text')

    return issues


def find_duplicates(examples):
    """Find duplicate examples based on user message content."""
    seen = {}
    duplicates = []

    for i, ex in enumerate(examples):
        if 'messages' not in ex:
            continue
        user_msgs = [m for m in ex['messages'] if m.get('role') == 'user']
        if not user_msgs:
            continue
        key = user_msgs[0].get('content', '').strip()[:200]
        if key in seen:
            duplicates.append((i, seen[key], key[:80]))
        else:
            seen[key] = i

    return duplicates


def audit_dataset(data_dir, dataset_name, verbose=False):
    """Run full audit on a single dataset."""
    report = {
        'name': dataset_name,
        'splits': {},
        'issues': defaultdict(list),
        'stats': {},
    }

    total_examples = 0
    total_issues = 0
    all_examples = []

    for split in ['train', 'validation', 'test']:
        path = os.path.join(data_dir, f'{split}.jsonl')
        if not os.path.exists(path):
            report['splits'][split] = {'count': 0, 'error': 'file not found'}
            continue

        examples = load_jsonl(path)
        report['splits'][split] = {'count': len(examples)}
        total_examples += len(examples)
        all_examples.extend(examples)

        split_issues = 0
        response_lengths = []
        task_types = Counter()

        for i, ex in enumerate(examples):
            # Check for JSON parse errors
            if '_error' in ex:
                report['issues']['json_parse_error'].append(
                    f'{split}:{ex["_line"]} - {ex["_error"]}'
                )
                split_issues += 1
                continue

            # ChatML format check
            fmt_issues = check_chatml_format(ex)
            for issue in fmt_issues:
                report['issues'][issue].append(f'{split}:{i}')
                split_issues += 1

            # Content quality
            quality_issues = check_content_quality(ex)
            for issue in quality_issues:
                category = issue.split(' (')[0]
                report['issues'][category].append(f'{split}:{i} - {issue}')
                split_issues += 1

            # Language consistency (only for norwegian-clinical)
            if 'norwegian' in dataset_name.lower():
                lang_issues = check_language_consistency(ex, 'norwegian')
                for issue in lang_issues:
                    report['issues'][issue].append(f'{split}:{i}')
                    split_issues += 1

            # Collect stats
            if 'messages' in ex:
                assistant_msgs = [m for m in ex['messages'] if m.get('role') == 'assistant']
                if assistant_msgs:
                    resp_len = len(assistant_msgs[-1].get('content', ''))
                    response_lengths.append(resp_len)

                user_msgs = [m for m in ex['messages'] if m.get('role') == 'user']
                if user_msgs:
                    prompt = user_msgs[0].get('content', '').lower()
                    if 'soap' in prompt or 'subjektiv' in prompt or 'objektiv' in prompt:
                        task_types['soap'] += 1
                    elif 'diagnos' in prompt or 'icpc' in prompt or 'icd' in prompt:
                        task_types['diagnosis'] += 1
                    elif 'røde flagg' in prompt or 'red flag' in prompt:
                        task_types['red_flags'] += 1
                    elif 'sms' in prompt or 'melding' in prompt or 'kommunikasjon' in prompt:
                        task_types['communication'] += 1
                    elif 'brev' in prompt or 'henvisning' in prompt or 'sykemelding' in prompt:
                        task_types['letters'] += 1
                    elif 'felt' in prompt or 'autofullfør' in prompt or 'hovedklage' in prompt:
                        task_types['quick_fields'] += 1
                    else:
                        task_types['other'] += 1

        report['splits'][split]['issues'] = split_issues
        total_issues += split_issues

        if response_lengths:
            report['splits'][split]['response_stats'] = {
                'min': min(response_lengths),
                'max': max(response_lengths),
                'avg': round(sum(response_lengths) / len(response_lengths)),
                'median': sorted(response_lengths)[len(response_lengths) // 2],
            }

    # Cross-split duplicate check
    duplicates = find_duplicates(all_examples)
    if duplicates:
        for dup in duplicates[:20]:  # Cap at 20
            report['issues']['duplicate'].append(
                f'idx {dup[0]} == idx {dup[1]}: "{dup[2]}..."'
            )

    report['stats'] = {
        'total_examples': total_examples,
        'total_issues': total_issues,
        'issue_rate': round(total_issues / max(total_examples, 1) * 100, 1),
    }

    return report


def fix_dataset(data_dir, dataset_name):
    """Remove bad examples from dataset and rewrite files."""
    fixed_count = 0

    for split in ['train', 'validation', 'test']:
        path = os.path.join(data_dir, f'{split}.jsonl')
        if not os.path.exists(path):
            continue

        examples = load_jsonl(path)
        clean = []

        for ex in examples:
            if '_error' in ex:
                fixed_count += 1
                continue

            fmt_issues = check_chatml_format(ex)
            if any(i in ['missing_messages_key', 'messages_not_list', 'no_assistant_response']
                   for i in fmt_issues):
                fixed_count += 1
                continue

            quality_issues = check_content_quality(ex)
            if any('contamination' in i for i in quality_issues):
                fixed_count += 1
                continue

            if any('too_short' in i for i in quality_issues):
                fixed_count += 1
                continue

            clean.append(ex)

        # Write cleaned file
        backup_path = path + '.bak'
        os.rename(path, backup_path)
        with open(path, 'w', encoding='utf-8') as f:
            for ex in clean:
                f.write(json.dumps(ex, ensure_ascii=False) + '\n')

        print(f'  {split}: {len(examples)} → {len(clean)} (removed {len(examples) - len(clean)})')

    return fixed_count


def print_report(report):
    """Pretty-print an audit report."""
    print(f'\n{"=" * 60}')
    print(f'  DATASET: {report["name"]}')
    print(f'{"=" * 60}')

    # Split counts
    for split, info in report['splits'].items():
        count = info.get('count', 0)
        issues = info.get('issues', 0)
        status = 'OK' if issues == 0 else f'!! {issues} issues'
        print(f'  {split:12s}: {count:6d} examples  {status}')

        if 'response_stats' in info:
            stats = info['response_stats']
            print(f'                response length: min={stats["min"]}, avg={stats["avg"]}, '
                  f'max={stats["max"]}, median={stats["median"]}')

    # Summary
    s = report['stats']
    print(f'\n  Total: {s["total_examples"]} examples, {s["total_issues"]} issues '
          f'({s["issue_rate"]}% issue rate)')

    # Issues breakdown
    if report['issues']:
        print(f'\n  Issues:')
        for category, items in sorted(report['issues'].items(), key=lambda x: -len(x[1])):
            print(f'    {category}: {len(items)}')
            if len(items) <= 5:
                for item in items:
                    print(f'      → {item}')
            else:
                for item in items[:3]:
                    print(f'      → {item}')
                print(f'      ... and {len(items) - 3} more')
    else:
        print(f'\n  OK - No issues found!')


def main():
    parser = argparse.ArgumentParser(description='Audit training data quality')
    parser.add_argument('--fix', action='store_true', help='Auto-remove bad examples')
    parser.add_argument('--dataset', type=str, default=None,
                        help='Audit specific dataset (e.g., norwegian-clinical)')
    parser.add_argument('--verbose', action='store_true', help='Show detailed issues')
    parser.add_argument('--output', type=str, default=None,
                        help='Save report to JSON file')
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent / 'data' / 'processed'

    if not base_dir.exists():
        print(f'Error: Data directory not found: {base_dir}')
        sys.exit(1)

    datasets_to_audit = {}
    if args.dataset:
        if args.dataset in DATASETS:
            datasets_to_audit[args.dataset] = DATASETS[args.dataset]
        else:
            print(f'Unknown dataset: {args.dataset}')
            print(f'Available: {", ".join(DATASETS.keys())}')
            sys.exit(1)
    else:
        datasets_to_audit = DATASETS

    all_reports = {}
    total_examples = 0
    total_issues = 0

    for ds_name, ds_desc in datasets_to_audit.items():
        ds_dir = base_dir / ds_name
        if not ds_dir.exists():
            print(f'!! Dataset directory not found: {ds_dir}')
            continue

        report = audit_dataset(str(ds_dir), ds_name, verbose=args.verbose)
        all_reports[ds_name] = report
        print_report(report)
        total_examples += report['stats']['total_examples']
        total_issues += report['stats']['total_issues']

        if args.fix:
            print(f'\n  Fixing {ds_name}...')
            fixed = fix_dataset(str(ds_dir), ds_name)
            print(f'  Removed {fixed} bad examples')

    # Grand summary
    print(f'\n{"=" * 60}')
    print(f'  GRAND SUMMARY')
    print(f'{"=" * 60}')
    print(f'  Datasets audited: {len(all_reports)}')
    print(f'  Total examples: {total_examples}')
    print(f'  Total issues: {total_issues}')
    print(f'  Overall issue rate: {round(total_issues / max(total_examples, 1) * 100, 1)}%')

    # Save report
    if args.output:
        output_path = args.output
    else:
        output_path = str(base_dir.parent.parent / 'logs' / 'audit-report.json')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        # Convert defaultdicts to regular dicts for JSON
        serializable = {}
        for name, report in all_reports.items():
            r = dict(report)
            r['issues'] = {k: v for k, v in report['issues'].items()}
            serializable[name] = r
        json.dump(serializable, f, indent=2, ensure_ascii=False)

    print(f'\n  Report saved to: {output_path}')


if __name__ == '__main__':
    main()
