#!/usr/bin/env python3
"""
Mine clinical content from TheBackROM website for LoRA training data.

Extracts:
- FAQ Q&A pairs from JSON-LD FAQPage schema
- Red flag content from red-flag-alert boxes
- Section content (symptoms, causes, treatment, diagnosis)
- Summary/key points from premium-summary-card
- Condition descriptions from condition-card divs

Outputs ChatML format compatible with train_unsloth.py
"""

import json
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


# ============================================================
# HTML Text Extraction
# ============================================================

class HTMLTextExtractor(HTMLParser):
    """Extract text content from HTML, stripping tags."""

    def __init__(self):
        super().__init__()
        self._text = []
        self._skip = False
        self._skip_tags = {'script', 'style', 'noscript'}

    def handle_starttag(self, tag, attrs):
        if tag in self._skip_tags:
            self._skip = True

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._skip = False
        if tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4', 'br', 'div'):
            self._text.append('\n')

    def handle_data(self, data):
        if not self._skip:
            self._text.append(data)

    def get_text(self):
        return ''.join(self._text).strip()


def html_to_text(html_str):
    """Convert HTML string to plain text."""
    extractor = HTMLTextExtractor()
    extractor.feed(html_str)
    text = extractor.get_text()
    # Normalize whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


# ============================================================
# Content Extractors
# ============================================================

def extract_faq_from_jsonld(html_content):
    """Extract FAQ Q&A pairs from JSON-LD FAQPage schema."""
    faqs = []
    # Find all JSON-LD blocks
    pattern = r'<script\s+type="application/ld\+json">\s*(.*?)\s*</script>'
    matches = re.findall(pattern, html_content, re.DOTALL)

    for match in matches:
        try:
            data = json.loads(match)
            if data.get('@type') == 'FAQPage' and 'mainEntity' in data:
                for item in data['mainEntity']:
                    if item.get('@type') == 'Question':
                        q = item.get('name', '').strip()
                        a = item.get('acceptedAnswer', {}).get('text', '').strip()
                        if q and a:
                            faqs.append({'question': q, 'answer': a})
        except (json.JSONDecodeError, KeyError, TypeError):
            continue

    return faqs


def extract_red_flags(html_content):
    """Extract red flag alert content."""
    flags = []
    pattern = r'<div\s+class="red-flag-alert">(.*?)</div>'
    matches = re.findall(pattern, html_content, re.DOTALL)

    for match in matches:
        text = html_to_text(match)
        if text and len(text) > 20:
            flags.append(text)

    return flags


def extract_sections(html_content):
    """Extract numbered clinical sections from hub-section divs."""
    sections = []
    # Match sections with id like s1, s2, etc. or named sections
    pattern = r'<section\s+(?:class="hub-section"\s+)?id="([^"]*)"[^>]*class="hub-section"[^>]*>(.*?)</section>'
    # More flexible pattern
    pattern = r'<section[^>]*class="hub-section"[^>]*>(.*?)</section>'
    matches = re.findall(pattern, html_content, re.DOTALL)

    for match in matches:
        # Extract section header
        header_match = re.search(r'<h2>(.*?)</h2>', match, re.DOTALL)
        if header_match:
            title = html_to_text(header_match.group(1))
            content = html_to_text(match)
            # Remove the section number prefix
            content = re.sub(r'^\d+\s*\n', '', content)
            if content and len(content) > 50:
                sections.append({
                    'title': title,
                    'content': content
                })

    return sections


def extract_summary(html_content):
    """Extract key points from premium-summary-card."""
    pattern = r'<div\s+class="premium-summary-card">(.*?)</div>'
    matches = re.findall(pattern, html_content, re.DOTALL)

    summaries = []
    for match in matches:
        text = html_to_text(match)
        if text and len(text) > 20:
            summaries.append(text)

    return summaries


def extract_condition_cards(html_content):
    """Extract condition descriptions from condition-card divs."""
    cards = []
    pattern = r'<div\s+class="condition-card">(.*?)</div>\s*</div>|<div\s+class="condition-card">(.*?)</div>'
    # Simpler approach: get all condition-card content
    pattern = r'<div\s+class="condition-card">(.*?)</div>\s*(?=<div|</section)'
    matches = re.findall(pattern, html_content, re.DOTALL)

    for match in matches:
        h3_match = re.search(r'<h3>(.*?)</h3>', match, re.DOTALL)
        if h3_match:
            title = html_to_text(h3_match.group(1))
            content = html_to_text(match)
            if content and len(content) > 30:
                cards.append({
                    'title': title,
                    'content': content
                })

    return cards


def extract_page_title(html_content):
    """Extract the main page title from h1."""
    match = re.search(r'<h1>(.*?)</h1>', html_content, re.DOTALL)
    if match:
        return html_to_text(match.group(1))
    return None


def extract_intro(html_content):
    """Extract intro text."""
    pattern = r'<div\s+class="intro-text">(.*?)</div>'
    matches = re.findall(pattern, html_content, re.DOTALL)

    intros = []
    for match in matches:
        text = html_to_text(match)
        if text and len(text) > 30:
            intros.append(text)

    return intros


def detect_language(html_content):
    """Detect if page is Norwegian or English."""
    lang_match = re.search(r'<html\s+lang="([^"]+)"', html_content)
    if lang_match:
        lang = lang_match.group(1).lower()
        if lang in ('nb', 'no', 'nn'):
            return 'no'
        elif lang == 'en':
            return 'en'
    return 'no'  # default


# ============================================================
# Training Example Generators
# ============================================================

SYSTEM_PROMPTS = {
    'norwegian_soap': (
        'Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. '
        'Generer nøyaktige, profesjonelle SOAP-notater og klinisk dokumentasjon. '
        'Bruk korrekt norsk medisinsk terminologi.'
    ),
    'medical_safety': (
        'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. '
        'Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. '
        'Prioriter alltid pasientsikkerhet.'
    ),
    'quick_field': (
        'Du er en rask klinisk tekstassistent. '
        'Generer korte, presise kliniske tekstfelt for kiropraktisk dokumentasjon.'
    ),
    'general': (
        'Du er en klinisk dokumentasjonsassistent for kiropraktorer. '
        'Generer profesjonell medisinsk dokumentasjon.'
    ),
    'en_general': (
        'You are a clinical documentation assistant for chiropractors. '
        'Generate professional medical documentation.'
    ),
    'en_medical': (
        'You are a medical safety advisor for chiropractic. '
        'Identify red flags, provide differential diagnosis and clinical reasoning. '
        'Always prioritize patient safety.'
    ),
}


def make_example(system, user, assistant):
    """Create a ChatML training example."""
    msgs = [{"role": "user", "content": user}, {"role": "assistant", "content": assistant}]
    if system:
        msgs.insert(0, {"role": "system", "content": system})
    return {"messages": msgs}


def generate_faq_examples(faqs, page_title, lang='no'):
    """Generate training examples from FAQ pairs."""
    examples = []
    for faq in faqs:
        q = faq['question']
        a = faq['answer']

        if lang == 'no':
            # Norwegian FAQ example
            user_prompt = f"Pasient spør: \"{q}\""
            examples.append(make_example(
                SYSTEM_PROMPTS['norwegian_soap'],
                user_prompt,
                a
            ))

            # Also generate a quick-field version
            user_prompt_short = f"Svar kort på pasientspørsmål: {q}"
            short_answer = a[:200] + ('...' if len(a) > 200 else '')
            examples.append(make_example(
                SYSTEM_PROMPTS['quick_field'],
                user_prompt_short,
                short_answer
            ))
        else:
            # English FAQ example
            user_prompt = f"Patient asks: \"{q}\""
            examples.append(make_example(
                SYSTEM_PROMPTS['en_general'],
                user_prompt,
                a
            ))

    return examples


def generate_red_flag_examples(red_flags, page_title, lang='no'):
    """Generate training examples from red flag content."""
    examples = []
    for flag_text in red_flags:
        if lang == 'no':
            # Red flag detection example
            user_prompt = f"Identifiser røde flagg for {page_title}:"
            examples.append(make_example(
                SYSTEM_PROMPTS['medical_safety'],
                user_prompt,
                flag_text
            ))

            # Also generate a scenario-based example
            user_prompt2 = f"Hvilke faresignaler bør man være oppmerksom på ved {page_title}?"
            examples.append(make_example(
                SYSTEM_PROMPTS['medical_safety'],
                user_prompt2,
                flag_text
            ))
        else:
            user_prompt = f"Identify red flags for {page_title}:"
            examples.append(make_example(
                SYSTEM_PROMPTS['en_medical'],
                user_prompt,
                flag_text
            ))

    return examples


def generate_section_examples(sections, page_title, lang='no'):
    """Generate training examples from clinical sections."""
    examples = []

    section_type_map_no = {
        'symptom': ['symptom', 'kjennetegn', 'tegn', 'plager'],
        'årsak': ['årsak', 'forårsak', 'grunn', 'utløs'],
        'behandling': ['behandling', 'terapi', 'kiropraktikk', 'manuell'],
        'diagnose': ['diagnose', 'diagnostikk', 'undersøk', 'tester'],
        'prognose': ['prognose', 'varighet', 'bedring', 'forløp'],
        'røde_flagg': ['røde flagg', 'faresignal', 'advarsel', 'akutt'],
    }

    section_type_map_en = {
        'symptoms': ['symptom', 'signs', 'characteristics'],
        'causes': ['cause', 'etiology', 'reason'],
        'treatment': ['treatment', 'therapy', 'chiropractic', 'manual'],
        'diagnosis': ['diagnosis', 'diagnostic', 'examination', 'tests'],
        'prognosis': ['prognosis', 'duration', 'recovery', 'outlook'],
        'red_flags': ['red flag', 'warning', 'emergency', 'urgent'],
    }

    for section in sections:
        title_lower = section['title'].lower()
        content = section['content']

        # Skip very short sections
        if len(content) < 100:
            continue

        # Truncate very long sections
        if len(content) > 1500:
            content = content[:1500] + '...'

        if lang == 'no':
            # Determine section type
            for stype, keywords in section_type_map_no.items():
                if any(kw in title_lower for kw in keywords):
                    if stype == 'symptom':
                        user_prompt = f"Beskriv symptomer og kjennetegn for {page_title}."
                        examples.append(make_example(SYSTEM_PROMPTS['norwegian_soap'], user_prompt, content))
                    elif stype == 'årsak':
                        user_prompt = f"Hva forårsaker {page_title}?"
                        examples.append(make_example(SYSTEM_PROMPTS['norwegian_soap'], user_prompt, content))
                    elif stype == 'behandling':
                        user_prompt = f"Beskriv behandlingsalternativer for {page_title}."
                        examples.append(make_example(SYSTEM_PROMPTS['norwegian_soap'], user_prompt, content))
                    elif stype == 'diagnose':
                        user_prompt = f"Hvordan diagnostiseres {page_title}?"
                        examples.append(make_example(SYSTEM_PROMPTS['norwegian_soap'], user_prompt, content))
                    elif stype == 'prognose':
                        user_prompt = f"Hva er prognosen for {page_title}?"
                        examples.append(make_example(SYSTEM_PROMPTS['norwegian_soap'], user_prompt, content))
                    elif stype == 'røde_flagg':
                        user_prompt = f"Vurder røde flagg for {page_title}."
                        examples.append(make_example(SYSTEM_PROMPTS['medical_safety'], user_prompt, content))
                    break
            else:
                # Generic section
                user_prompt = f"Beskriv {section['title']} for {page_title}."
                examples.append(make_example(SYSTEM_PROMPTS['norwegian_soap'], user_prompt, content))
        else:
            for stype, keywords in section_type_map_en.items():
                if any(kw in title_lower for kw in keywords):
                    if stype == 'symptoms':
                        user_prompt = f"Describe symptoms and signs of {page_title}."
                        examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, content))
                    elif stype == 'causes':
                        user_prompt = f"What causes {page_title}?"
                        examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, content))
                    elif stype == 'treatment':
                        user_prompt = f"Describe treatment options for {page_title}."
                        examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, content))
                    elif stype == 'diagnosis':
                        user_prompt = f"How is {page_title} diagnosed?"
                        examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, content))
                    elif stype == 'prognosis':
                        user_prompt = f"What is the prognosis for {page_title}?"
                        examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, content))
                    elif stype == 'red_flags':
                        user_prompt = f"Identify red flags for {page_title}."
                        examples.append(make_example(SYSTEM_PROMPTS['en_medical'], user_prompt, content))
                    break
            else:
                user_prompt = f"Describe {section['title']} for {page_title}."
                examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, content))

    return examples


def generate_summary_examples(summaries, page_title, lang='no'):
    """Generate quick-field examples from summary cards."""
    examples = []
    for summary in summaries:
        if lang == 'no':
            user_prompt = f"Gi en kort oppsummering av {page_title}."
            examples.append(make_example(SYSTEM_PROMPTS['quick_field'], user_prompt, summary))
        else:
            user_prompt = f"Give a brief summary of {page_title}."
            examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, summary))
    return examples


def generate_condition_card_examples(cards, page_title, lang='no'):
    """Generate examples from condition description cards."""
    examples = []
    for card in cards:
        if lang == 'no':
            user_prompt = f"Beskriv {card['title']} i kontekst av {page_title}."
            examples.append(make_example(SYSTEM_PROMPTS['norwegian_soap'], user_prompt, card['content']))
        else:
            user_prompt = f"Describe {card['title']} in the context of {page_title}."
            examples.append(make_example(SYSTEM_PROMPTS['en_general'], user_prompt, card['content']))
    return examples


def generate_soap_from_condition(page_title, intro, sections, lang='no'):
    """Generate synthetic SOAP note examples from condition content."""
    examples = []

    if not intro or lang != 'no':
        return examples

    # Create a subjective note example from intro
    intro_text = intro[0] if intro else ''
    if intro_text and len(intro_text) > 50:
        # Trim to reasonable SOAP note length
        subjective = intro_text[:500]
        user_prompt = f"Skriv subjektiv del av SOAP-notat for en pasient med {page_title}."
        examples.append(make_example(
            SYSTEM_PROMPTS['norwegian_soap'],
            user_prompt,
            subjective
        ))

    # Create assessment examples from diagnosis sections
    for section in sections:
        title_lower = section['title'].lower()
        if any(kw in title_lower for kw in ['diagnos', 'vurder', 'differensial']):
            content = section['content'][:600]
            user_prompt = f"Skriv vurderingsdelen av et SOAP-notat for {page_title}."
            examples.append(make_example(
                SYSTEM_PROMPTS['norwegian_soap'],
                user_prompt,
                content
            ))
            break

    # Create plan example from treatment sections
    for section in sections:
        title_lower = section['title'].lower()
        if any(kw in title_lower for kw in ['behandl', 'plan', 'terapi']):
            content = section['content'][:600]
            user_prompt = f"Skriv behandlingsplan for {page_title}."
            examples.append(make_example(
                SYSTEM_PROMPTS['norwegian_soap'],
                user_prompt,
                content
            ))
            break

    return examples


# ============================================================
# Main Processing
# ============================================================

def process_file(filepath):
    """Process a single HTML file and return training examples."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, FileNotFoundError):
        return []

    lang = detect_language(content)
    page_title = extract_page_title(content)
    if not page_title:
        return []

    examples = []

    # Extract and generate from FAQs
    faqs = extract_faq_from_jsonld(content)
    examples.extend(generate_faq_examples(faqs, page_title, lang))

    # Extract and generate from red flags
    red_flags = extract_red_flags(content)
    examples.extend(generate_red_flag_examples(red_flags, page_title, lang))

    # Extract and generate from sections
    sections = extract_sections(content)
    examples.extend(generate_section_examples(sections, page_title, lang))

    # Extract and generate from summaries
    summaries = extract_summary(content)
    examples.extend(generate_summary_examples(summaries, page_title, lang))

    # Extract and generate from condition cards
    cards = extract_condition_cards(content)
    examples.extend(generate_condition_card_examples(cards, page_title, lang))

    # Generate SOAP-style examples (Norwegian only)
    intros = extract_intro(content)
    examples.extend(generate_soap_from_condition(page_title, intros, sections, lang))

    return examples


def find_html_files(website_dir):
    """Find all condition HTML files in the website."""
    files = []

    # Norwegian condition pages
    plager_dir = Path(website_dir) / 'plager'
    if plager_dir.exists():
        for f in plager_dir.rglob('*.html'):
            files.append(f)

    # English condition pages
    en_dir = Path(website_dir) / 'en' / 'conditions'
    if en_dir.exists():
        for f in en_dir.rglob('*.html'):
            files.append(f)

    # Also check blog posts for clinical content
    blogg_dir = Path(website_dir) / 'blogg'
    if blogg_dir.exists():
        for f in blogg_dir.glob('*.html'):
            if f.name != 'index.html':
                files.append(f)

    en_blog_dir = Path(website_dir) / 'en' / 'blog'
    if en_blog_dir.exists():
        for f in en_blog_dir.glob('*.html'):
            if f.name != 'index.html':
                files.append(f)

    return files


def main():
    # Default website path
    website_dir = r'E:\0 - 0 - Totall Clarity\0 - 0 - Nettside code – Kopi\website'

    # Allow override via command line
    if len(sys.argv) > 1:
        website_dir = sys.argv[1]

    if not Path(website_dir).exists():
        print(f"ERROR: Website directory not found: {website_dir}")
        sys.exit(1)

    # Output directory
    script_dir = Path(__file__).parent.parent
    output_dir = script_dir / 'data' / 'mined'
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Mining content from: {website_dir}")
    print(f"Output directory: {output_dir}")

    # Find all HTML files
    html_files = find_html_files(website_dir)
    print(f"Found {len(html_files)} HTML files")

    all_examples = []
    no_examples = []
    en_examples = []
    medical_examples = []
    quick_examples = []

    for filepath in sorted(html_files):
        examples = process_file(filepath)
        all_examples.extend(examples)

        for ex in examples:
            msgs = ex['messages']
            system_msg = msgs[0]['content'] if msgs[0]['role'] == 'system' else ''

            # Categorize by model target
            if 'sikkerhetsrådgiver' in system_msg or 'safety advisor' in system_msg:
                medical_examples.append(ex)
            elif 'rask klinisk' in system_msg:
                quick_examples.append(ex)

            # Language split
            if any(kw in system_msg for kw in ['norsk', 'Norge', 'kiropraktikk', 'dokumentasjonsspesialist', 'kiropraktorer']):
                no_examples.append(ex)
            elif 'You are' in system_msg:
                en_examples.append(ex)
            else:
                no_examples.append(ex)

    print(f"\nTotal examples extracted: {len(all_examples)}")
    print(f"  Norwegian: {len(no_examples)}")
    print(f"  English: {len(en_examples)}")
    print(f"  Medical safety: {len(medical_examples)}")
    print(f"  Quick fields: {len(quick_examples)}")

    # Write output files
    def write_jsonl(path, data):
        with open(path, 'w', encoding='utf-8') as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')

    write_jsonl(output_dir / 'all-mined.jsonl', all_examples)
    write_jsonl(output_dir / 'norwegian-mined.jsonl', no_examples)
    write_jsonl(output_dir / 'english-mined.jsonl', en_examples)
    write_jsonl(output_dir / 'medical-safety-mined.jsonl', medical_examples)
    write_jsonl(output_dir / 'quick-fields-mined.jsonl', quick_examples)

    print(f"\nFiles written to {output_dir}:")
    print(f"  all-mined.jsonl ({len(all_examples)} examples)")
    print(f"  norwegian-mined.jsonl ({len(no_examples)} examples)")
    print(f"  english-mined.jsonl ({len(en_examples)} examples)")
    print(f"  medical-safety-mined.jsonl ({len(medical_examples)} examples)")
    print(f"  quick-fields-mined.jsonl ({len(quick_examples)} examples)")

    # Print a few sample examples for verification
    print("\n--- Sample Norwegian example ---")
    if no_examples:
        print(json.dumps(no_examples[0], ensure_ascii=False, indent=2)[:500])

    print("\n--- Sample Medical example ---")
    if medical_examples:
        print(json.dumps(medical_examples[0], ensure_ascii=False, indent=2)[:500])


if __name__ == '__main__':
    main()
