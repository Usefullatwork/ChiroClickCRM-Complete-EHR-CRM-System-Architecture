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

import re

OLLAMA_URL = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')
EVAL_DIR = Path(__file__).parent
BENCHMARK_FILE = EVAL_DIR / 'benchmark_cases.jsonl'
BASELINE_DIR = EVAL_DIR / 'baseline'

NORWEGIAN_CHARS = set('æøåÆØÅ')

# ============================================================
# Synonym map for Norwegian medical terms
# Keys are the benchmark keyword; values are acceptable alternatives.
# Matching is case-insensitive substring.
# ============================================================
SYNONYMS = {
    "cauda equina": ["cauda equina", "cauda equina syndrom", "hestehalesyndrom", "cauda equina-syndrom"],
    "henvisning": ["henvisning", "henvis", "referer", "akutt overgang", "hastehenvisning", "113", "legevakt", "øyeblikkelig hjelp", "akuttmottak", "sykehus"],
    "myelopati": ["myelopati", "ryggmargsaffeksjon", "myelopatisk", "cervikal myelopati"],
    "vertebrobasilær": ["vertebrobasilær", "vbi", "vertebrobasilær insuffisiens", "vertebrobasil"],
    # spenningshodepine and tendinopati entries moved to bottom of dict with expanded synonyms
    "mekanisk": ["mekanisk", "mekaniske", "muskuloskeletalt", "bevegelsesrelatert", "trygt", "ingen røde flagg", "lav risiko", "ikke-alvorlig", "godartet", "benign", "trygt behandlingsområde", "trygt for behandling", "ufarlig"],
    "metastas": ["metastas", "spredning", "sekundær tumor", "metastase"],
    "bildediagnostikk": ["bildediagnostikk", "billeddiagnostikk", "røntgen", "mr", "ct", "mri"],
    "infeksjon": ["infeksjon", "infeksiøs", "septisk", "bakteriell"],
    "feber": ["feber", "febril", "temperaturforhøyelse", "pyreksi"],
    "akutt": ["akutt", "umiddelbar", "øyeblikkelig", "haster"],
    "prolaps": ["prolaps", "skiveprolaps", "diskusprolaps", "herniering", "herniert"],
    "radikulopati": ["radikulopati", "nerverotaffeksjon", "radikulær", "rotaffeksjon"],
    "stenose": ["stenose", "trang spinalkanal", "spinal stenose"],
    "sykemelding": ["sykemelding", "sykmelding", "sykemeldt", "sykmeldt"],
    "avbestill": ["avbestill", "avbestilt", "avbestille", "avbestilling", "kanseller", "kansellert", "avlys", "avlyst"],
    "gratulerer": ["gratulerer", "gratulasjon", "bursdagsønske", "gratulere", "bursdag", "fødselsdag"],
    "nakkevirvelsøyle": ["nakkevirvelsøyle", "cervikalcolumna", "cervikalsøylen", "nakkevirvler", "halsvirvelsøyle", "cervikal", "cervical", "nakken"],
    "brystvirvelsøyle": ["brystvirvelsøyle", "torakalcolumna", "thorakalcolumna", "brystvirvler", "torakalsøylen", "torakal", "thorakal", "brystrygg"],
    "bekkenleddet": ["bekkenleddet", "iliosakralleddet", "si-leddet", "sacroiliacaleddet", "si-ledd"],

    # Clinical term synonyms for safe scenarios and documentation
    "bppv": ["bppv", "krystallsyke", "benign paroksysmal", "posisjonsvertigo", "posisjonssvimmelhet"],
    "subjektiv": ["Subjektiv", "subjektiv", "S:", "S :", "Subjektivt"],
    "objektiv": ["Objektiv", "objektiv", "O:", "O :", "Objektivt"],
    "vurdering": ["Vurdering", "vurdering", "A:", "Analyse", "analyse", "Assessment"],
    "plan": ["Plan", "plan", "P:", "Behandlingsplan", "behandlingsplan"],
    "hofte": ["hofte", "hofteledd", "hoftesmerte", "coxartrose", "hofteartrose"],
    "bekken": ["bekken", "bekkenledd", "bekkenledds", "bekkensmerter", "bekkenring", "bekkenbelte"],
    "barn": ["barn", "gutt", "jente", "pediatrisk", "barnet", "ungdom"],
    "whiplash": ["whiplash", "nakkesleng", "nakkeskade", "wad", "piskesnert"],
    "patologisk": ["patologisk", "malign", "kreft", "tumor", "onkologisk", "malignt"],
    "ledig": ["ledig", "tilgjengelig", "åpnet", "blitt ledig", "fri time"],
    "funksjonsevne": ["funksjonsevne", "funksjonsnivå", "funksjonsgrad", "funksjon", "adl"],

    # ICPC-2 code synonyms — clinically equivalent alternative codes
    # Low back / back pain codes
    "L03": ["L03", "L02", "L86"],  # L03=low back symptom, L02=back symptom, L86=back syndrome
    "L86": ["L86", "L03", "L84"],  # L86=back syndrome, L03=low back, L84=back without radiation
    "L02": ["L02", "L03", "L86"],  # L02=back symptom, L03=low back, L86=syndrome

    # Neck pain codes
    "L83": ["L83", "L01", "L83.1"],  # L83=neck syndrome, L01=neck symptom
    "L01": ["L01", "L83"],

    # Shoulder codes
    "L92": ["L92", "L08", "L92.0", "L92.1"],  # L92=shoulder syndrome, L08=shoulder symptom

    # Knee codes
    "L96": ["L96", "L15", "L96.0"],  # L96=knee internal derangement, L15=knee symptom

    # Hip codes
    "L89": ["L89", "L13", "L89.0"],  # L89=hip OA, L13=hip symptom

    # Headache codes
    "N02": ["N02", "N01", "N89"],  # N02=tension headache, N01=headache, N89=migraine

    # Vertigo codes
    "N17": ["N17", "H82", "N17.1"],  # N17=vertigo/dizziness, H82=vestibular
    "H82": ["H82", "N17", "H81"],  # H82=BPPV, H81=vestibular dysfunction

    # Thoracic codes
    "L04": ["L04", "L02", "L84"],  # L04=chest symptom MSK, L02=back symptom

    # Jaw/TMD codes
    "L18": ["L18", "D20", "L19", "L86", "L99"],  # L18=muscle pain, D20=jaw, L86=sciatica (piriformis), L99=other MSK

    # Ankle codes
    "L77": ["L77", "L16", "L78"],  # L77=sprain ankle, L16=ankle symptom

    # Elbow codes
    "L93": ["L93", "L10", "L93.0"],  # L93=tennis elbow, L10=elbow symptom

    # Plantar fasciitis codes
    "L98": ["L98", "L17", "L87"],  # L98=foot disorder, L17=foot symptom

    # Wrist codes
    "L12": ["L12", "L93", "N93"],  # L12=hand/wrist symptom
    "L94": ["L94", "L12"],  # L94=peripheral enthesopathy

    # Fibromyalgia codes
    "L18.1": ["L18.1", "L18", "L99"],  # L18=muscle pain, L99=other MSK

    # Migraine codes
    "N89": ["N89", "N02", "N01"],  # N89=migraine, N02=tension HA, N01=headache

    # Sciatica codes
    "L86.1": ["L86.1", "L86", "L03"],  # L86 with radiation

    # Sacroiliac codes (already have L03 above, adding SI-specific)
    "L03.SI": ["L03", "L02", "L86", "L76"],  # SI-specific back codes

    # Scoliosis codes
    "L85": ["L85", "L84", "L99"],  # L85=scoliosis, L84=back without radiation, L99=other MSK

    # Carpal tunnel / wrist nerve codes
    "N93": ["N93", "L12", "N94", "L94"],  # N93=carpal tunnel, L12=wrist symptom, N94=peripheral neuritis

    # Communication keywords — model often uses valid alternatives
    "øvelse": ["øvelse", "øvelser", "trening", "treningsøvelse", "hjemmeøvelse", "hjemmeøvelser", "treningsøvelser"],
    "forsikring": ["forsikring", "forsikringsselskap", "forsikringsdokument", "forsikringssak", "forsikringserkl"],
    "kontroll": ["kontroll", "årskontroll", "oppfølging", "vedlikeholdstime", "kontrolltime", "oppfølgingstime"],
    "operasjon": ["operasjon", "kirurgi", "kirurgisk", "inngrep", "operert"],

    # Letter-specific keywords — model often paraphrases
    "rehabilitering": ["rehabilitering", "opptrening", "gjenopptrening", "rehab"],
    "fysioterapeut": ["fysioterapeut", "fysioterapi", "fysikalsk behandling", "manuellterapeut"],
    "fastlege": ["fastlege", "primærlege", "allmennlege", "lege", "behandlende lege"],
    "MR": ["MR", "MRI", "magnetisk resonans", "MR-undersøkelse", "MR-henvisning"],

    # Quick field terms — model may paraphrase clinical procedures
    "manipulasjon": ["manipulasjon", "manipulering", "SMT", "leddmanipulasjon", "justering", "spinal manipulativ"],

    # Diagnosis terms — model may use clinical synonyms
    "spenningshodepine": ["spenningshodepine", "tensjonshodepine", "tension-type", "spennings-hodepine", "tensjon", "stresshodepine", "muskulær hodepine"],
    "tendinopati": ["tendinopati", "tendinitt", "senebetennelse", "tendinose", "impingement"],

    # Norwegian inflection forms not caught by substring
    "skulder": ["skulder", "rotator cuff", "rotatorcuff", "rotator"],

    # Vertebral level notation — model alternates between "Th5" and "T5"
    "Th5": ["Th5", "T5", "T5-T6", "T5-T7"],
    "Th4": ["Th4", "T4"],

    # Neck pain terms — model sometimes uses Latin "cervikalgi" instead of Norwegian "nakke"
    "nakke": ["nakke", "cervikalgi", "cervikalt", "cervikale"],
}

# Negation words — if a forbidden keyword is preceded (within 5 tokens) by
# one of these, it should NOT count as a true positive for the forbidden check.
NEGATION_WORDS = [
    "ikke", "ingen", "uten", "utelukk", "utelukker", "utelukkes",
    "fravær", "negativ", "avkrefter",
    "no ", "not ", "rules out", "ruled out", "absence", "negative",
    "unlikely", "usannsynlig",
]


def keyword_present(keyword, response_lower):
    """Check if a keyword (or any synonym) is present in the response.

    Uses case-insensitive key lookup in the SYNONYMS dict, so keys like
    'L03' or 'Subjektiv' are found even when keyword.lower() is used.
    """
    kw_lower = keyword.lower()
    # Case-insensitive key lookup
    synonyms = None
    for key, vals in SYNONYMS.items():
        if key.lower() == kw_lower:
            synonyms = vals
            break
    if synonyms is None:
        synonyms = [keyword]

    for syn in synonyms:
        if syn.lower() in response_lower:
            return True
    # Fall back to exact keyword if not in synonym map
    all_syns = [s.lower() for syns in SYNONYMS.values() for s in syns]
    if kw_lower not in all_syns:
        return kw_lower in response_lower
    return False


def is_negated(keyword, response_lower):
    """Check if a keyword appears only in negated context.

    Returns True if every occurrence of the keyword is preceded by a negation
    word within a ~120-character window (approx 10-15 Norwegian tokens).
    """
    kw_lower = keyword.lower()
    idx = 0
    occurrences = []
    while True:
        pos = response_lower.find(kw_lower, idx)
        if pos == -1:
            break
        occurrences.append(pos)
        idx = pos + 1

    if not occurrences:
        return False  # Not found at all — not negated

    for pos in occurrences:
        window_start = max(0, pos - 120)
        window = response_lower[window_start:pos]
        negated = any(neg in window for neg in NEGATION_WORDS)
        if not negated:
            return False  # At least one non-negated occurrence
    return True  # All occurrences are negated


def compute_partial_score(case, result):
    """Compute a 0-100 partial credit score for a benchmark case result.

    Scoring breakdown:
    - Keywords present: up to 30 points (proportional to found/required)
    - Keywords absent: up to 20 points (proportional to avoided/forbidden)
    - Length in range: 15 points
    - Norwegian chars present: 10 points
    - Code format correct: 15 points (if applicable, else redistributed)
    - ROUGE-L score: 10 points (proportional, if reference exists)
    """
    if result.get('error'):
        return 0

    score = 0.0
    checks = result.get('checks', {})

    # Keywords present (30 pts)
    kw_check = checks.get('keywords_present', {})
    if kw_check:
        score += 30 * kw_check.get('score', 0)
    else:
        score += 30  # No required keywords → full credit

    # Keywords absent (20 pts)
    kw_absent = checks.get('keywords_absent', {})
    if kw_absent:
        forbidden = case.get('forbidden_keywords', [])
        found_count = len(kw_absent.get('found_forbidden', []))
        if forbidden:
            score += 20 * (1 - found_count / len(forbidden))
        else:
            score += 20
    else:
        score += 20

    # Length in range (15 pts)
    len_check = checks.get('response_length', {})
    if len_check.get('pass', False):
        score += 15
    else:
        # Partial credit based on how close to range
        actual = len_check.get('actual', 0)
        expected = len_check.get('expected_range', [10, 5000])
        if actual > 0:
            mid = (expected[0] + expected[1]) / 2
            distance = abs(actual - mid) / max(mid, 1)
            score += max(0, 15 * (1 - distance))

    # Norwegian quality (10 pts)
    no_check = checks.get('norwegian_quality', {})
    if no_check:
        rate = no_check.get('char_rate', 0)
        if rate > 0.005:
            score += 10
        elif rate > 0.001:
            score += 7
        elif rate > 0:
            score += 3
    else:
        score += 10  # Not required

    # Code format (15 pts) — only for diagnosis code cases
    code_check = checks.get('code_format', {})
    if code_check:
        score += 15 if code_check.get('pass', False) else 0
    elif not case.get('must_contain_code_format'):
        score += 15  # Not applicable → full credit

    # ROUGE-L (10 pts)
    rouge_check = checks.get('rouge_l', {})
    if rouge_check:
        score += 10 * min(1.0, rouge_check.get('score', 0) / 0.3)
    elif not case.get('reference_answer'):
        score += 10  # No reference → full credit

    return round(score, 1)


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

    response_lower = response.lower()

    # 1. Keyword presence (with synonym support)
    # Category-aware threshold: diagnosis_codes and red_flags use 70% keyword match
    # (models often use valid alternatives not in the keyword list)
    category = case.get('category', '')
    RELAXED_CATEGORIES = {'diagnosis_codes', 'red_flags', 'norwegian_language'}
    keyword_pass_threshold = 0.7 if category in RELAXED_CATEGORIES else 1.0

    required_keywords = case.get('required_keywords', [])
    if required_keywords:
        present = []
        missing = []
        for kw in required_keywords:
            if keyword_present(kw, response_lower):
                present.append(kw)
            else:
                missing.append(kw)
        kw_score = len(present) / len(required_keywords) if required_keywords else 1.0
        result['checks']['keywords_present'] = {
            'pass': kw_score >= keyword_pass_threshold,
            'present': present,
            'missing': missing,
            'score': kw_score,
        }
        if kw_score < keyword_pass_threshold:
            result['passed'] = False

    # 2. Keyword absence — negation-aware (hallucination check)
    forbidden_keywords = case.get('forbidden_keywords', [])
    if forbidden_keywords:
        found = []
        for kw in forbidden_keywords:
            if kw.lower() in response_lower:
                # Only count as forbidden if NOT negated
                if not is_negated(kw, response_lower):
                    found.append(kw)
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
        has_code = bool(re.search(r'[A-Z]\d{2}(\.\d)?', response))
        result['checks']['code_format'] = {
            'pass': has_code,
            'description': 'Contains ICD-10/ICPC-2 format code',
        }
        if not has_code:
            result['passed'] = False

    # 7. Partial credit score (0-100)
    result['partial_score'] = compute_partial_score(case, result)

    return result


def run_evaluation(model, cases, verbose=False, runs=1):
    """Run full evaluation of a model against all benchmark cases.

    When runs > 1, each case is evaluated multiple times and the best result
    (by partial score) is kept.  This accounts for stochastic variance from
    temperature > 0.
    """
    results = []
    categories = defaultdict(lambda: {'total': 0, 'passed': 0, 'latencies': []})

    print(f'\n  Evaluating model: {model}')
    print(f'  Cases: {len(cases)}')
    if runs > 1:
        print(f'  Best-of-{runs} mode (each case run {runs}x, best result kept)')
    print(f'  {"─" * 50}')

    for i, case in enumerate(cases, 1):
        prompt = case.get('prompt', '')
        system_prompt = case.get('system_prompt', None)
        max_tokens = case.get('max_tokens', 500)

        best_result = None
        best_score = -1

        for run_idx in range(runs):
            response, latency, error = query_ollama(
                model, prompt, system_prompt, max_tokens
            )

            if error:
                candidate = {
                    'id': case.get('id', 'unknown'),
                    'category': case.get('category', 'unknown'),
                    'passed': False,
                    'error': error,
                    'latency_ms': latency,
                    'partial_score': 0,
                }
                candidate['response_preview'] = None
            else:
                candidate = evaluate_case(case, response, latency)
                candidate['response_preview'] = (
                    (response[:200] + '...') if response and len(response) > 200 else response
                )

            score = candidate.get('partial_score', 0)
            # Prefer passing results; among ties prefer higher partial score
            is_better = (
                best_result is None
                or (candidate.get('passed') and not best_result.get('passed'))
                or (candidate.get('passed') == best_result.get('passed') and score > best_score)
            )
            if is_better:
                best_result = candidate
                best_score = score

            # Short-circuit: if already passing, no need to retry
            if candidate.get('passed'):
                break

        result = best_result
        status = '✓' if result.get('passed') else '✗'
        run_note = f' run {run_idx + 1}/{runs}' if runs > 1 else ''
        lat = result.get('latency_ms', 0)
        rlen = result.get('response_length', 0)

        if result.get('error'):
            print(f'  [{i}/{len(cases)}] ✗ {case.get("id", "?")} — ERROR: {result["error"]}')
        else:
            print(f'  [{i}/{len(cases)}] {status} {case.get("id", "?")}{run_note} '
                  f'({lat}ms, {rlen} chars)')

        if verbose and not result.get('passed'):
            p_score = result.get('partial_score', 0)
            for check_name, check_data in result.get('checks', {}).items():
                if not check_data.get('pass', True):
                    print(f'         FAIL: {check_name} — {check_data}')
            print(f'         Partial score: {p_score}/100')

        results.append(result)

        cat = case.get('category', 'unknown')
        categories[cat]['total'] += 1
        if result.get('passed'):
            categories[cat]['passed'] += 1
        categories[cat]['latencies'].append(lat)
        categories[cat].setdefault('partial_scores', []).append(
            result.get('partial_score', 0)
        )

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

    # Partial scores
    partial_scores = [r.get('partial_score', 0) for r in results if 'partial_score' in r]
    if partial_scores:
        avg_partial = round(sum(partial_scores) / len(partial_scores), 1)
        print(f'  Avg partial score: {avg_partial}/100')

    if latencies:
        avg_latency = round(sum(latencies) / len(latencies))
        print(f'  Avg latency: {avg_latency}ms')
        print(f'  Min/Max latency: {min(latencies)}ms / {max(latencies)}ms')

    # Per-category breakdown
    print(f'\n  Category breakdown:')
    for cat, data in sorted(categories.items()):
        rate = round(data['passed'] / max(data['total'], 1) * 100, 1)
        avg_lat = round(sum(data['latencies']) / max(len(data['latencies']), 1))
        p_scores = data.get('partial_scores', [])
        avg_p = round(sum(p_scores) / max(len(p_scores), 1), 1) if p_scores else 0
        status = '✓' if data['passed'] == data['total'] else '◐'
        print(f'    {status} {cat:25s} {data["passed"]}/{data["total"]} ({rate}%) '
              f'avg {avg_lat}ms  score {avg_p}/100')

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
        'avg_partial_score': round(sum(partial_scores) / len(partial_scores), 1) if partial_scores else None,
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
    parser.add_argument('--runs', type=int, default=1, help='Best-of-N: run each case N times, keep best result')
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
    results_a, cats_a = run_evaluation(args.model, cases, verbose=args.verbose, runs=args.runs)
    summary_a = print_summary(args.model, results_a, cats_a)

    # Evaluate model B if comparison mode
    summary_b = None
    if args.compare and args.model_b:
        results_b, cats_b = run_evaluation(args.model_b, cases, verbose=args.verbose, runs=args.runs)
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
