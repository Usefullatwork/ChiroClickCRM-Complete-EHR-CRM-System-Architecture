#!/usr/bin/env python3
"""
Convert ChiroClick training data from prompt/response format to ChatML format.

Usage:
    python convert_to_chatml.py

Input:  ../raw/*.jsonl (prompt/response pairs)
Output: ../processed/{train,validation,test}.jsonl (ChatML format)
"""

import json
import random
from pathlib import Path
from typing import List, Dict

# System prompts for different documentation types
SYSTEM_PROMPTS = {
    'soap': """Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge.
Generer noyaktige, profesjonelle SOAP-notater som folger norske kliniske retningslinjer.
Bruk korrekt norsk medisinsk terminologi og ICD-10/ICPC-2 koder.
Strukturer svarene dine med tydelige S (Subjektiv), O (Objektiv), A (Analyse/Diagnose), og P (Plan) seksjoner.""",

    'clinical_fields': """Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge.
Generer presise kliniske felt-innhold basert pa pasientinformasjon.
Bruk profesjonell norsk medisinsk terminologi.
Vær konsis men fullstendig i beskrivelsene.""",

    'letter': """Du er en spesialist pa medisinsk korrespondanse for kiropraktorer i Norge.
Skriv profesjonelle henvisningsbrev, erklæringer og rapporter pa norsk.
Folg standard norsk brevformat og inkluder alle nodvendige kliniske detaljer.
Bruk formal, men tilgjengelig sprak.""",

    'communication': """Du er en pasientkommunikasjonsspesialist for kiropraktikk.
Skriv profesjonelle, empatiske meldinger til pasienter pa norsk.
Tilpass tonen etter kontekst (direktemelding, paminnelse, oppfolging).
Vær vennlig men profesjonell.""",
}

# Map filenames to documentation types
FILE_TYPE_MAP = {
    'training-data.jsonl': 'soap',
    'clinical-fields-training.jsonl': 'clinical_fields',
    'letters-training.jsonl': 'letter',
    'communication-tones-training.jsonl': 'communication',
    'training-expansion.jsonl': 'soap',
}


def detect_doc_type(prompt: str, filename: str) -> str:
    """Detect document type from prompt content or filename."""
    # Use filename mapping first
    for key, doc_type in FILE_TYPE_MAP.items():
        if key in filename:
            return doc_type

    # Fallback to content detection
    prompt_lower = prompt.lower()
    if any(word in prompt_lower for word in ['soap', 'subjektiv', 'objektiv', 'diagnose']):
        return 'soap'
    elif any(word in prompt_lower for word in ['brev', 'henvisning', 'erklæring', 'rapport']):
        return 'letter'
    elif any(word in prompt_lower for word in ['sms', 'melding', 'pasient', 'påminnelse']):
        return 'communication'
    else:
        return 'soap'


def convert_to_chatml(prompt: str, response: str, doc_type: str) -> Dict:
    """Convert a prompt/response pair to ChatML format."""
    system_prompt = SYSTEM_PROMPTS.get(doc_type, SYSTEM_PROMPTS['soap'])

    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt.strip()},
            {"role": "assistant", "content": response.strip()}
        ]
    }


def process_file(input_path: Path) -> List[Dict]:
    """Process a single JSONL file and return ChatML formatted examples."""
    examples = []
    filename = input_path.name

    print(f"  Processing: {filename}")

    with open(input_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                data = json.loads(line)

                # Handle different input formats
                if 'prompt' in data and 'response' in data:
                    prompt = data['prompt']
                    response = data['response']
                elif 'input' in data and 'output' in data:
                    prompt = data['input']
                    response = data['output']
                elif 'instruction' in data and 'response' in data:
                    prompt = data['instruction']
                    if 'input' in data and data['input']:
                        prompt = f"{prompt}\n\n{data['input']}"
                    response = data['response']
                else:
                    print(f"    Warning: Unknown format at line {line_num}, skipping")
                    continue

                doc_type = detect_doc_type(prompt, filename)
                chatml = convert_to_chatml(prompt, response, doc_type)
                examples.append(chatml)

            except json.JSONDecodeError as e:
                print(f"    Warning: JSON parse error at line {line_num}: {e}")
                continue

    print(f"    Converted {len(examples)} examples")
    return examples


def validate_example(example: Dict) -> bool:
    """Validate a ChatML example."""
    try:
        messages = example.get('messages', [])
        if len(messages) != 3:
            return False
        if messages[0]['role'] != 'system':
            return False
        if messages[1]['role'] != 'user':
            return False
        if messages[2]['role'] != 'assistant':
            return False
        # Check for non-empty content
        if not all(m.get('content', '').strip() for m in messages):
            return False
        return True
    except Exception:
        return False


def main():
    # Paths
    script_dir = Path(__file__).parent
    raw_dir = script_dir.parent / 'raw'
    processed_dir = script_dir.parent / 'processed'

    processed_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("ChiroClick Training Data Converter")
    print("=" * 60)
    print(f"Input directory:  {raw_dir}")
    print(f"Output directory: {processed_dir}")
    print()

    # Collect all examples
    all_examples = []

    jsonl_files = list(raw_dir.glob('*.jsonl'))
    if not jsonl_files:
        print("ERROR: No JSONL files found in raw directory!")
        return

    print(f"Found {len(jsonl_files)} JSONL files:")
    for f in jsonl_files:
        print(f"  - {f.name}")
    print()

    print("Converting files...")
    for jsonl_file in jsonl_files:
        examples = process_file(jsonl_file)
        all_examples.extend(examples)

    print()
    print(f"Total examples collected: {len(all_examples)}")

    # Validate
    valid_examples = [ex for ex in all_examples if validate_example(ex)]
    invalid_count = len(all_examples) - len(valid_examples)
    if invalid_count > 0:
        print(f"Removed {invalid_count} invalid examples")

    print(f"Valid examples: {len(valid_examples)}")

    # Shuffle for randomization
    random.seed(42)  # Reproducible split
    random.shuffle(valid_examples)

    # Split: 80% train, 10% validation, 10% test
    n = len(valid_examples)
    train_end = int(n * 0.8)
    val_end = int(n * 0.9)

    splits = {
        'train.jsonl': valid_examples[:train_end],
        'validation.jsonl': valid_examples[train_end:val_end],
        'test.jsonl': valid_examples[val_end:]
    }

    print()
    print("Writing output files...")
    for filename, data in splits.items():
        output_path = processed_dir / filename
        with open(output_path, 'w', encoding='utf-8') as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        print(f"  {filename}: {len(data)} examples")

    # Summary
    print()
    print("=" * 60)
    print("CONVERSION COMPLETE")
    print("=" * 60)
    print(f"Train:      {len(splits['train.jsonl']):,} examples (80%)")
    print(f"Validation: {len(splits['validation.jsonl']):,} examples (10%)")
    print(f"Test:       {len(splits['test.jsonl']):,} examples (10%)")
    print()
    print("Next steps:")
    print("  1. Review processed files for quality")
    print("  2. Run: python ../training/train_lora.py --model mistral")


if __name__ == '__main__':
    main()
