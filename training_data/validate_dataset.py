#!/usr/bin/env python3
"""
Validate JSONL training dataset for clinical cases
"""

import json
import sys
from pathlib import Path

def validate_jsonl(file_path):
    """Validate JSONL file format and content"""

    if not Path(file_path).exists():
        print(f"❌ File not found: {file_path}")
        return False

    print(f"📁 Validating: {file_path}\n")

    errors = []
    warnings = []
    valid_examples = 0

    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                warnings.append(f"Line {line_num}: Empty line")
                continue

            try:
                data = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"Line {line_num}: Invalid JSON - {e}")
                continue

            # Check required fields
            if 'prompt' not in data:
                errors.append(f"Line {line_num}: Missing 'prompt' field")
            elif not isinstance(data['prompt'], str) or len(data['prompt']) < 10:
                warnings.append(f"Line {line_num}: Prompt too short or invalid")

            if 'response' not in data:
                errors.append(f"Line {line_num}: Missing 'response' field")
            elif not isinstance(data['response'], str) or len(data['response']) < 10:
                warnings.append(f"Line {line_num}: Response too short or invalid")

            # Check for potential PII leakage (basic check)
            combined_text = f"{data.get('prompt', '')} {data.get('response', '')}"

            # Check for potential phone numbers (8 consecutive digits)
            if any(word.isdigit() and len(word) >= 8 for word in combined_text.split()):
                warnings.append(f"Line {line_num}: Possible phone number detected")

            # Check for email patterns
            if '@' in combined_text and '.' in combined_text:
                warnings.append(f"Line {line_num}: Possible email detected")

            valid_examples += 1

    # Print results
    print(f"✅ Valid examples: {valid_examples}")

    if errors:
        print(f"\n❌ Errors ({len(errors)}):")
        for error in errors[:10]:  # Show first 10 errors
            print(f"   {error}")
        if len(errors) > 10:
            print(f"   ... and {len(errors) - 10} more")

    if warnings:
        print(f"\n⚠️  Warnings ({len(warnings)}):")
        for warning in warnings[:10]:  # Show first 10 warnings
            print(f"   {warning}")
        if len(warnings) > 10:
            print(f"   ... and {len(warnings) - 10} more")

    if not errors and not warnings:
        print("\n✨ Dataset is clean and ready for training!")
        return True
    elif not errors:
        print("\n✅ Dataset is valid (with warnings)")
        return True
    else:
        print("\n❌ Dataset has errors that need fixing")
        return False

def analyze_dataset(file_path):
    """Analyze dataset statistics"""

    print(f"\n📊 Dataset Statistics\n")

    total_prompts = 0
    total_responses = 0
    prompt_lengths = []
    response_lengths = []

    categories = {
        'rygg': 0,
        'nakke': 0,
        'skulder': 0,
        'hofte': 0,
        'kne': 0,
        'albue': 0,
        'annet': 0
    }

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            try:
                data = json.loads(line)
                prompt = data.get('prompt', '')
                response = data.get('response', '')

                total_prompts += 1
                prompt_lengths.append(len(prompt))
                response_lengths.append(len(response))

                # Categorize
                combined = (prompt + response).lower()
                if 'rygg' in combined or 'lumbal' in combined or 'korsrygg' in combined:
                    categories['rygg'] += 1
                elif 'nakke' in combined or 'cervikal' in combined or 'hodepine' in combined:
                    categories['nakke'] += 1
                elif 'skulder' in combined or 'deltoid' in combined:
                    categories['skulder'] += 1
                elif 'hofte' in combined or 'gluteus' in combined or 'bekken' in combined:
                    categories['hofte'] += 1
                elif 'kne' in combined or 'patella' in combined:
                    categories['kne'] += 1
                elif 'albue' in combined or 'epikondyl' in combined:
                    categories['albue'] += 1
                else:
                    categories['annet'] += 1

            except json.JSONDecodeError:
                continue

    if prompt_lengths:
        print(f"Total examples: {total_prompts}")
        print(f"\nPrompt statistics:")
        print(f"  Average length: {sum(prompt_lengths) / len(prompt_lengths):.0f} characters")
        print(f"  Min length: {min(prompt_lengths)} characters")
        print(f"  Max length: {max(prompt_lengths)} characters")

        print(f"\nResponse statistics:")
        print(f"  Average length: {sum(response_lengths) / len(response_lengths):.0f} characters")
        print(f"  Min length: {min(response_lengths)} characters")
        print(f"  Max length: {max(response_lengths)} characters")

        print(f"\nCategories:")
        for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                percentage = (count / total_prompts) * 100
                print(f"  {category.capitalize()}: {count} ({percentage:.1f}%)")

if __name__ == '__main__':
    file_path = sys.argv[1] if len(sys.argv) > 1 else 'clinical_cases_katrine.jsonl'

    print("=" * 60)
    print("🏥 Clinical Dataset Validator")
    print("=" * 60 + "\n")

    is_valid = validate_jsonl(file_path)
    analyze_dataset(file_path)

    print("\n" + "=" * 60)

    sys.exit(0 if is_valid else 1)
