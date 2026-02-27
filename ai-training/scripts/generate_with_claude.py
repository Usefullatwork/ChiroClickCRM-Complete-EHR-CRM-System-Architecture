#!/usr/bin/env python3
"""
Claude-Powered Training Data Generator — ChiroClickCRM

Reads gap analysis output and generates high-quality training examples
using Claude Sonnet, targeting the weak categories identified in Phase 1.

Usage:
    python scripts/generate_with_claude.py
    python scripts/generate_with_claude.py --gap-report evaluation/gap-analysis.json
    python scripts/generate_with_claude.py --category icpc2_codes --count 50
    python scripts/generate_with_claude.py --dry-run

Requirements:
    pip install anthropic
    ANTHROPIC_API_KEY env var set

Output:
    data/claude-generated/batch-{date}.jsonl
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
GAP_REPORT = AI_TRAINING_DIR / 'evaluation' / 'gap-analysis.json'
OUTPUT_DIR = AI_TRAINING_DIR / 'data' / 'claude-generated'

# ============================================================
# GDPR: PII detection — refuse to process real patient data
# ============================================================

FNUMMER_PATTERN = re.compile(r'\b\d{6}\s?\d{5}\b')


def check_pii(text):
    """Refuse to process data containing fødselsnummer patterns."""
    if text and FNUMMER_PATTERN.search(text):
        raise ValueError("PII detected (fødselsnummer). Refusing to process.")


# ============================================================
# Category-specific generation prompts
# ============================================================

SYSTEM_PROMPT_BASE = (
    "Du er en ekspert på norsk klinisk dokumentasjon for kiropraktikk. "
    "Du genererer syntetiske treningseksempler for AI-modeller. "
    "VIKTIG: Alle eksempler må være 100% syntetiske — ingen reelle pasientdata. "
    "Bruk korrekt norsk medisinsk terminologi."
)

CATEGORY_PROMPTS = {
    'diagnosis_codes': {
        'system': (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            "Du er spesialist på ICPC-2 koder for kiropraktikk. "
            "Alle svar MÅ inneholde koder i format [A-Z]\\d{2} (f.eks. L03, N89, L92). "
            "Inkluder alltid kode OG norsk beskrivelse."
        ),
        'template': (
            "Generer {count} unike treningseksempler for ICPC-2 diagnosekoding.\n\n"
            "For hvert eksempel, lag JSON med:\n"
            '- "instruction": Et klinisk spørsmål som ber om ICPC-2 kode\n'
            '- "input": Kort pasientbeskrivelse (syntetisk)\n'
            '- "output": Svar med ICPC-2 kode(r) i format [A-Z]\\d{{2}}, norsk beskrivelse, '
            "og kort klinisk begrunnelse\n"
            '- "quality_score": 1-5 (selvvurdering)\n\n'
            "Varier mellom: korsrygg (L03/L86), nakke (L83), skulder (L92), "
            "hofte (L89), kne (L96), hodepine (N02/N89), svimmelhet (N17/H82), "
            "brystrygg (L04), ankel (L77), albue (L93).\n\n"
            "Svar som JSON-array. Hver output MÅ ha minst én kode i [A-Z]\\d{{2}} format."
        ),
        'target_count': 50,
    },
    'red_flags': {
        'system': (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            "Du er spesialist på medisinsk sikkerhetsvurdering. "
            "Alle svar MÅ klassifisere risikonivå (AKUTT/SUBAKUTT/OVERVÅK/TRYGT) "
            "og nevne relevante røde flagg."
        ),
        'template': (
            "Generer {count} treningseksempler for rødt-flagg vurdering.\n\n"
            "Miks mellom:\n"
            "- AKUTT (cauda equina, myelopati, vertebrobasilær): ~30%\n"
            "- SUBAKUTT (infeksjon, frakturrisiko, progressiv nevro): ~20%\n"
            "- OVERVÅK (uspesifikke varseltegn): ~20%\n"
            "- TRYGT (mekanisk, ingen røde flagg): ~30%\n\n"
            "For hvert eksempel, lag JSON med:\n"
            '- "instruction": "Vurder røde flagg: [klinisk scenario]"\n'
            '- "input": "" (scenario er i instruction)\n'
            '- "output": Vurdering med risikonivå, identifiserte flagg, og anbefaling\n'
            '- "quality_score": 1-5\n\n'
            "VIKTIG: TRYGT-scenarioer MÅ bruke ord som 'mekanisk', 'trygt', "
            "'ingen røde flagg'. AKUTT MÅ inkludere 'akutt' og 'henvisning'.\n\n"
            "Svar som JSON-array."
        ),
        'target_count': 50,
    },
    'soap_notes': {
        'system': (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            "Du er spesialist på SOAP-dokumentasjon for kiropraktikk. "
            "Bruk standard norsk SOAP-format: Subjektiv, Objektiv, Vurdering, Plan."
        ),
        'template': (
            "Generer {count} treningseksempler for SOAP-notat skriving.\n\n"
            "Varier mellom:\n"
            "- Subjektiv-del (S): pasientsymptomer, smertehistorie\n"
            "- Objektiv-del (O): undersøkelsesfunn, tester\n"
            "- Vurdering (A): klinisk resonnering, diagnose\n"
            "- Plan (P): behandlingsplan, oppfølging\n"
            "- Komplett SOAP: alle 4 deler\n\n"
            "For hvert eksempel:\n"
            '- "instruction": Beskriv hva som skal skrives\n'
            '- "input": Kliniske funn/kontekst\n'
            '- "output": SOAP-tekst på norsk med korrekt medisinsk terminologi\n'
            '- "quality_score": 1-5\n\n'
            "Bruk alltid overskriftene 'Subjektiv'/'Objektiv'/'Vurdering'/'Plan'.\n\n"
            "Svar som JSON-array."
        ),
        'target_count': 30,
    },
    'letters': {
        'system': (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            "Du er spesialist på medisinsk korrespondanse i norsk helsevesen. "
            "Alle brev MÅ nevne 'fastlege' og bruke formelt medisinsk norsk."
        ),
        'template': (
            "Generer {count} treningseksempler for medisinske brev.\n\n"
            "Typer:\n"
            "- Henvisning til spesialist (ortoped, nevrolog, revmatolog)\n"
            "- Epikriser til fastlege\n"
            "- Sykemelding/attester\n"
            "- Forsikringsrapporter\n"
            "- Oppfølgingsbrev til pasient\n\n"
            "For hvert eksempel:\n"
            '- "instruction": Beskriv brevet som skal skrives\n'
            '- "input": Relevant klinisk informasjon\n'
            '- "output": Komplett brev på formelt medisinsk norsk\n'
            '- "quality_score": 1-5\n\n'
            "VIKTIG: Alle brev til/fra fastlege MÅ bruke ordet 'fastlege'. "
            "Bruk formelt norsk (Til:, Fra:, Dato:, Vedr.:).\n\n"
            "Svar som JSON-array."
        ),
        'target_count': 20,
    },
    'norwegian_language': {
        'system': (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            "Du er spesialist på norsk medisinsk terminologi. "
            "Fokuser på korrekt bruk av norske medisinske fagtermer."
        ),
        'template': (
            "Generer {count} treningseksempler for norsk medisinsk terminologi.\n\n"
            "Typer:\n"
            "- Anatomisk terminologi (norske begreper for strukturer)\n"
            "- Klinisk beskrivelse med korrekt fagspråk\n"
            "- Oversettelse av internasjonale termer til norsk\n"
            "- Journalføring med standardisert norsk\n\n"
            "For hvert eksempel:\n"
            '- "instruction": Oppgave som krever norsk medisinsk terminologi\n'
            '- "input": Kontekst (valgfritt)\n'
            '- "output": Svar med korrekt norsk medisinsk fagspråk (æøå!)\n'
            '- "quality_score": 1-5\n\n'
            "MÅ bruke norske termer: nakkevirvelsøyle, brystvirvelsøyle, "
            "bekkenleddet, radikulopati, myelopati, tendinopati osv.\n"
            "ALDRI engelske alternativer som 'cervical spine', 'thoracic'.\n\n"
            "Svar som JSON-array."
        ),
        'target_count': 20,
    },
    'communication': {
        'system': (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            "Du er spesialist på pasientkommunikasjon for kiropraktikk. "
            "SMS-er MÅ være under 160 tegn. E-poster skal være korte og profesjonelle."
        ),
        'template': (
            "Generer {count} treningseksempler for pasientkommunikasjon.\n\n"
            "Typer:\n"
            "- SMS: timebekreftelse, påminnelse, avbestilling, ledig time\n"
            "- E-post: oppfølging, resultater, bursdagsmelding\n"
            "- Informasjonsskriv: øvelsesregimer, egenbehandlingsråd\n\n"
            "For hvert eksempel:\n"
            '- "instruction": Hva slags melding skal skrives\n'
            '- "input": Kontekst (tidspunkt, type, osv.)\n'
            '- "output": Ferdig melding\n'
            '- "quality_score": 1-5\n\n'
            "SMS-regler: maks 160 tegn, inkluder 'mvh [Klinikknavn]'.\n"
            "For avbestilling: bruk 'avbestill' eller 'kanseller'.\n"
            "For gratulasjon: bruk 'gratulerer' eller 'bursdag'.\n\n"
            "Svar som JSON-array."
        ),
        'target_count': 20,
    },
    'quick_fields': {
        'system': (
            f"{SYSTEM_PROMPT_BASE}\n\n"
            "Du genererer korte, presise kliniske felt-utfyllinger. "
            "Svarene skal være konsise (1-3 setninger)."
        ),
        'template': (
            "Generer {count} treningseksempler for raske kliniske felt-utfyllinger.\n\n"
            "Typer:\n"
            "- Hovedklage (chief complaint): 1-2 setninger\n"
            "- Smertebeskrivelse: lokalisasjon, karakter, intensitet\n"
            "- Debut/varighet: kort beskrivelse av start\n"
            "- Behandlingsmål: korte pasientmål\n\n"
            "For hvert eksempel:\n"
            '- "instruction": Hvilket felt skal fylles ut\n'
            '- "input": Klinisk kontekst\n'
            '- "output": Kort, presis utfylling (maks 200 tegn)\n'
            '- "quality_score": 1-5\n\n'
            "Svar som JSON-array."
        ),
        'target_count': 15,
    },
}


# ============================================================
# Claude API
# ============================================================

def get_claude_client():
    """Initialize Claude client."""
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


def generate_batch(client, category, count, gap_cases=None):
    """Generate a batch of training examples for a category using Claude."""
    config = CATEGORY_PROMPTS.get(category)
    if not config:
        print(f'  WARNING: Unknown category "{category}", skipping')
        return []

    system_prompt = config['system']
    user_prompt = config['template'].format(count=count)

    # Add gap-specific context if available
    if gap_cases:
        failing_ids = [c['id'] for c in gap_cases[:10]]
        gap_types = {}
        for c in gap_cases:
            for gt in c.get('gap_types', []):
                gap_types[gt] = gap_types.get(gt, 0) + 1

        user_prompt += (
            f"\n\nKONTEKST: Den lokale modellen feiler på disse sakene:\n"
            f"  IDs: {', '.join(failing_ids)}\n"
            f"  Feiltyper: {json.dumps(gap_types, ensure_ascii=False)}\n"
            f"Generer eksempler som spesifikt adresserer disse svakhetene."
        )

    print(f'  Generating {count} examples for {category}...')
    start = time.time()

    try:
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=4096,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_prompt}],
            temperature=0.7,
        )
        elapsed = round(time.time() - start, 1)
        text = ''.join(b.text for b in response.content if b.type == 'text')
    except Exception as e:
        print(f'  ERROR generating {category}: {e}')
        return []

    # Parse JSON array from response
    examples = parse_examples(text, category)
    print(f'  Generated {len(examples)} examples in {elapsed}s')
    return examples


def parse_examples(text, category):
    """Parse Claude's response into training examples."""
    examples = []

    # Try to find JSON array
    json_match = re.search(r'\[[\s\S]*\]', text)
    if json_match:
        try:
            raw = json.loads(json_match.group())
            if isinstance(raw, list):
                for item in raw:
                    example = validate_example(item, category)
                    if example:
                        examples.append(example)
                return examples
        except json.JSONDecodeError:
            pass

    # Fallback: try to find individual JSON objects
    for match in re.finditer(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text):
        try:
            item = json.loads(match.group())
            example = validate_example(item, category)
            if example:
                examples.append(example)
        except (json.JSONDecodeError, ValueError):
            continue

    return examples


def validate_example(item, category):
    """Validate and normalize a single training example."""
    if not isinstance(item, dict):
        return None

    instruction = item.get('instruction', '').strip()
    output = item.get('output', '').strip()

    if not instruction or not output:
        return None

    # PII check
    try:
        check_pii(instruction)
        check_pii(output)
        check_pii(item.get('input', ''))
    except ValueError:
        return None

    # Quality score
    quality = item.get('quality_score', 3)
    if isinstance(quality, str):
        try:
            quality = int(quality)
        except ValueError:
            quality = 3
    quality = max(1, min(5, quality))

    # Category-specific validation
    if category == 'diagnosis_codes':
        if not re.search(r'[A-Z]\d{2}', output):
            return None  # Must contain ICPC-2 code format

    return {
        'instruction': instruction,
        'input': item.get('input', '').strip(),
        'output': output,
        'category': category,
        'quality_score': quality,
        'source': 'claude_generated',
    }


def convert_to_chatml(example):
    """Convert a training example to ChatML format for LoRA training."""
    system_prompts = {
        'diagnosis_codes': 'Du er en diagnosekode-spesialist for kiropraktikk i Norge. Bruk ICPC-2 kodeverk.',
        'red_flags': 'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. Identifiser røde flagg og vurder alvorlighetsgrad.',
        'soap_notes': 'Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge.',
        'letters': 'Du er en norsk medisinsk korrespondanse-spesialist.',
        'norwegian_language': 'Du er en norsk språkspesialist for kiropraktisk dokumentasjon.',
        'communication': 'Du er en pasientkommunikasjonsspesialist for kiropraktikk i Norge.',
        'quick_fields': 'Du er en klinisk assistent for kiropraktorer i Norge. Gi korte, presise svar.',
    }

    system = system_prompts.get(example['category'],
                                'Du er en klinisk assistent for kiropraktorer i Norge.')

    user_content = example['instruction']
    if example.get('input'):
        user_content += f"\n\n{example['input']}"

    return {
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user_content},
            {'role': 'assistant', 'content': example['output']},
        ],
        'metadata': {
            'category': example['category'],
            'quality_score': example['quality_score'],
            'source': 'claude_generated',
        },
    }


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Claude-powered training data generation')
    parser.add_argument('--gap-report', default=str(GAP_REPORT),
                        help='Path to gap-analysis.json')
    parser.add_argument('--category', default=None,
                        help='Generate for specific category only')
    parser.add_argument('--count', type=int, default=None,
                        help='Override example count per category')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show what would be generated without calling Claude')
    parser.add_argument('--output-dir', default=str(OUTPUT_DIR),
                        help='Output directory for JSONL files')
    args = parser.parse_args()

    # Load gap report if available
    gap_report = None
    gap_path = Path(args.gap_report)
    if gap_path.exists():
        with open(gap_path, 'r', encoding='utf-8') as f:
            gap_report = json.load(f)
        print(f'  Loaded gap report: {gap_path}')
    else:
        print(f'  No gap report found at {gap_path} — generating default mix')

    # Determine categories and counts
    generation_plan = {}

    if args.category:
        # Single category mode
        cat = args.category
        count = args.count or CATEGORY_PROMPTS.get(cat, {}).get('target_count', 20)
        gap_cases = []
        if gap_report:
            cat_data = gap_report.get('by_category', {}).get(cat, {})
            gap_case_ids = set(cat_data.get('gap_cases', []))
            gap_cases = [c for c in gap_report.get('cases', []) if c['id'] in gap_case_ids]
        generation_plan[cat] = {'count': count, 'gap_cases': gap_cases}
    elif gap_report:
        # Use gap report to prioritize categories
        by_cat = gap_report.get('by_category', {})
        for cat, data in sorted(by_cat.items(), key=lambda x: x[1].get('ollama_pass_rate', 100)):
            if cat not in CATEGORY_PROMPTS:
                continue
            pass_rate = data.get('ollama_pass_rate', 100)
            gap_count = len(data.get('gap_cases', []))

            # Scale generation count by gap severity
            if pass_rate < 50:
                count = args.count or 50
            elif pass_rate < 70:
                count = args.count or 30
            elif pass_rate < 85:
                count = args.count or 20
            else:
                count = args.count or 10

            gap_case_ids = set(data.get('gap_cases', []))
            gap_cases = [c for c in gap_report.get('cases', []) if c['id'] in gap_case_ids]
            generation_plan[cat] = {'count': count, 'gap_cases': gap_cases}
    else:
        # Default generation for all categories
        for cat, config in CATEGORY_PROMPTS.items():
            count = args.count or config['target_count']
            generation_plan[cat] = {'count': count, 'gap_cases': []}

    # Display plan
    print(f'\n  Generation Plan:')
    print(f'  {"Category":<25s} {"Count":>6s} {"Gap Cases":>10s}')
    print(f'  {"─" * 45}')
    total_planned = 0
    for cat, plan in generation_plan.items():
        total_planned += plan['count']
        print(f'  {cat:<25s} {plan["count"]:>6d} {len(plan["gap_cases"]):>10d}')
    print(f'  {"─" * 45}')
    print(f'  {"TOTAL":<25s} {total_planned:>6d}')

    if args.dry_run:
        print('\n  DRY RUN — no examples generated')
        return

    # Generate
    client = get_claude_client()
    all_examples = []

    for cat, plan in generation_plan.items():
        examples = generate_batch(client, cat, plan['count'], plan['gap_cases'])
        all_examples.extend(examples)

        # Rate limiting between batches
        if len(generation_plan) > 1:
            time.sleep(1)

    if not all_examples:
        print('  WARNING: No examples generated')
        return

    # Convert to ChatML and save
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime('%Y-%m-%d')
    output_file = output_dir / f'batch-{date_str}.jsonl'

    # Raw examples (instruction/output format)
    raw_file = output_dir / f'raw-{date_str}.jsonl'
    with open(raw_file, 'w', encoding='utf-8') as f:
        for ex in all_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # ChatML format (for training)
    chatml_examples = [convert_to_chatml(ex) for ex in all_examples]
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in chatml_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # Summary
    category_counts = {}
    quality_scores = []
    for ex in all_examples:
        cat = ex['category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
        quality_scores.append(ex['quality_score'])

    avg_quality = sum(quality_scores) / max(len(quality_scores), 1)

    print(f'\n  {"=" * 50}')
    print(f'  GENERATION COMPLETE')
    print(f'  {"=" * 50}')
    print(f'  Total examples: {len(all_examples)}')
    print(f'  Avg quality:    {avg_quality:.1f}/5')
    print(f'  Categories:')
    for cat, count in sorted(category_counts.items()):
        print(f'    {cat:<25s} {count}')
    print(f'\n  Raw examples:   {raw_file}')
    print(f'  ChatML output:  {output_file}')
    print(f'\n  Next step:')
    print(f'    python scripts/generate_dpo_with_claude.py --gap-report {args.gap_report}')


if __name__ == '__main__':
    main()
