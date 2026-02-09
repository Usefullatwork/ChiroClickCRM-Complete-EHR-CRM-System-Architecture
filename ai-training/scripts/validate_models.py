#!/usr/bin/env python3
"""
ChiroClickCRM - Post-Training Model Validation

Tests each trained LoRA model via Ollama with standardized clinical prompts
and logs quality scores.

Usage:
    python validate_models.py
    python validate_models.py --log-dir ../logs
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding for Norwegian characters and Unicode spinners
if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ============================================================
# Test Cases
# ============================================================

MODELS_TO_TEST = [
    "chiro-fast-lora",
    "chiro-medical-lora",
    "chiro-norwegian-lora",
    "chiro-no-lora",
]

# Also test originals for comparison
ORIGINAL_MODELS = [
    "chiro-fast",
    "chiro-medical",
    "chiro-norwegian",
    "chiro-no",
]

TEST_PROMPTS = {
    "soap_generation": {
        "prompt": "Skriv SOAP-notat for: 40 år mann med akutte nakkesmerter og hodepine etter bilulykke for 2 dager siden.",
        "expected_sections": ["S:", "O:", "A:", "P:"],
        "expected_keywords": ["nakkesmerter", "hodepine", "bilulykke", "VAS", "behandling"],
        "min_length": 200,
    },
    "red_flag_detection": {
        "prompt": "Vurder røde flagg: 65 år mann med nye ryggsmerter, vekttap 8 kg siste 2 måneder, nattsmerter som vekker ham.",
        "expected_keywords": ["røde flagg", "malignitet", "vekttap", "natt", "henvisning"],
        "min_length": 100,
    },
    "quick_field_generation": {
        "prompt": "Generer hovedklage for pasient med korsryggsmerter og utstråling til venstre ben.",
        "expected_keywords": ["korsrygg", "utstråling", "ben"],
        "min_length": 50,
        "max_length": 500,
    },
    "differential_diagnosis": {
        "prompt": "Generer differensialdiagnostikk for skuldersmerte med nattsmerter og stivhet.",
        "expected_keywords": ["differensial", "skulder"],
        "min_length": 100,
    },
    "norwegian_quality": {
        "prompt": "Skriv en kort behandlingsoppsummering for en pasient med cervikal fasettleddsrestriksjoner.",
        "expected_keywords": ["behandling", "cervikal", "fasett"],
        "min_length": 100,
    },
}


# ============================================================
# Ollama Interface
# ============================================================

def check_ollama():
    """Check if Ollama is running and return available models."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True, text=True, timeout=10, encoding='utf-8',
            errors='replace',
        )
        if result.returncode != 0:
            return False, []

        models = []
        for line in result.stdout.strip().split("\n")[1:]:  # Skip header
            if line.strip():
                model_name = line.split()[0]
                models.append(model_name)
        return True, models
    except Exception as e:
        print(f"Ollama check failed: {e}")
        return False, []


def sanitize_text(text):
    """Remove non-printable/braille spinner characters that break Windows console."""
    if not text:
        return text
    # Keep ASCII printable, Norwegian chars, and common Unicode but strip spinners/braille
    return ''.join(c for c in text if c.isprintable() or c in '\n\r\t')


def query_model(model_name, prompt, timeout=120):
    """Send a prompt to an Ollama model and return the response."""
    try:
        start = time.time()
        result = subprocess.run(
            ["ollama", "run", model_name, prompt],
            capture_output=True, text=True, timeout=timeout, encoding='utf-8',
            errors='replace',
        )
        elapsed = time.time() - start

        if result.returncode != 0:
            return None, elapsed, sanitize_text(result.stderr.strip())

        return sanitize_text(result.stdout.strip()), elapsed, None
    except subprocess.TimeoutExpired:
        return None, timeout, "Timeout"
    except Exception as e:
        return None, 0, str(e)


# ============================================================
# Scoring
# ============================================================

def score_response(response, test_config):
    """Score a model response against expected criteria."""
    if response is None:
        return {"score": 0, "issues": ["No response"]}

    score = 0
    max_score = 0
    issues = []

    # Length check
    max_score += 20
    min_len = test_config.get("min_length", 50)
    max_len = test_config.get("max_length", 5000)

    if len(response) >= min_len:
        score += 10
    else:
        issues.append(f"Too short ({len(response)} < {min_len})")

    if len(response) <= max_len:
        score += 10
    else:
        issues.append(f"Too long ({len(response)} > {max_len})")

    # Expected sections (SOAP)
    if "expected_sections" in test_config:
        for section in test_config["expected_sections"]:
            max_score += 10
            if section.lower() in response.lower():
                score += 10
            else:
                issues.append(f"Missing section: {section}")

    # Expected keywords
    if "expected_keywords" in test_config:
        for kw in test_config["expected_keywords"]:
            max_score += 5
            if kw.lower() in response.lower():
                score += 5
            else:
                issues.append(f"Missing keyword: {kw}")

    # Norwegian character check (should contain ø, æ, å)
    max_score += 10
    norwegian_chars = sum(1 for c in response if c in "øæåØÆÅ")
    if norwegian_chars > 0:
        score += 10
    else:
        issues.append("No Norwegian characters (ø, æ, å)")

    # Normalize to 0-100
    normalized = int(100 * score / max_score) if max_score > 0 else 0

    return {
        "score": normalized,
        "raw_score": score,
        "max_score": max_score,
        "response_length": len(response),
        "issues": issues,
    }


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Validate ChiroClickCRM AI models")
    parser.add_argument("--log-dir", type=Path, default=Path("../logs"))
    parser.add_argument("--timeout", type=int, default=120, help="Per-query timeout in seconds")
    args = parser.parse_args()

    log_dir = args.log_dir.resolve()
    log_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("ChiroClickCRM Model Validation")
    print("=" * 60)

    # Check Ollama
    ollama_ok, available_models = check_ollama()
    if not ollama_ok:
        print("ERROR: Ollama is not running. Start it with: ollama serve")
        return 1

    print(f"Available models: {len(available_models)}")

    # Determine which models to test
    all_models = MODELS_TO_TEST + ORIGINAL_MODELS
    testable = [m for m in all_models if any(m in am for am in available_models)]
    print(f"Models to test: {testable}")

    if not testable:
        print("No trainable models found in Ollama. Skipping validation.")
        return 0

    # Run tests
    results = {}
    for model in testable:
        print(f"\n--- Testing: {model} ---")
        model_results = {}

        for test_name, test_config in TEST_PROMPTS.items():
            print(f"  {test_name}...", end=" ", flush=True)
            response, elapsed, error = query_model(
                model, test_config["prompt"], timeout=args.timeout
            )

            if error:
                print(f"ERROR ({error})")
                model_results[test_name] = {
                    "score": 0,
                    "error": error,
                    "elapsed": elapsed,
                }
            else:
                scoring = score_response(response, test_config)
                scoring["elapsed"] = round(elapsed, 1)
                scoring["response_preview"] = response[:200] + "..." if len(response) > 200 else response
                model_results[test_name] = scoring
                print(f"Score: {scoring['score']}/100 ({elapsed:.1f}s)")

        # Calculate average score
        scores = [r.get("score", 0) for r in model_results.values()]
        avg_score = sum(scores) / len(scores) if scores else 0
        model_results["_average"] = round(avg_score, 1)
        results[model] = model_results

        print(f"  Average: {avg_score:.1f}/100")

    # Comparison summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"{'Model':<25} {'Average Score':<15} {'Status'}")
    print("-" * 55)

    for model, model_results in results.items():
        avg = model_results.get("_average", 0)
        status = "GOOD" if avg >= 60 else "FAIR" if avg >= 40 else "POOR"
        is_lora = "-lora" in model
        tag = " [LoRA]" if is_lora else " [Original]"
        print(f"  {model:<23} {avg:>6.1f}/100     {status}{tag}")

    # Compare LoRA vs originals
    print("\n--- LoRA vs Original Comparison ---")
    for base_name in ["chiro-fast", "chiro-medical", "chiro-norwegian", "chiro-no"]:
        lora = f"{base_name}-lora"
        if base_name in results and lora in results:
            orig_avg = results[base_name].get("_average", 0)
            lora_avg = results[lora].get("_average", 0)
            diff = lora_avg - orig_avg
            direction = "+" if diff > 0 else ""
            print(f"  {base_name}: Original={orig_avg:.1f}, LoRA={lora_avg:.1f} ({direction}{diff:.1f})")

    # Save results
    report_path = log_dir / f"validation-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nDetailed results saved: {report_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
