#!/usr/bin/env python3
"""
ChiroClickCRM v4 Training Data Preparer

Curated dataset preparation that fixes v3's dilution problem.
Forks clean_and_prepare.py with:
  1. Metadata preservation through filtering
  2. Per-task-type caps for website-conditions-v2 data in general-clinical
  3. 3x upsampling for high-value synthetic files
  4. Output to data/processed-v4/

Root cause of v3 regression: all ~8K website-conditions-v2 examples were dumped
into general-clinical, diluting ICPC-2 (65%→5%) and red flag (81%→39%) signals.
Fix: cap low-value task types, keep high-value ones uncapped, upsample 3x.

Usage:
    python prepare_v4.py
    python prepare_v4.py --output-dir ../data/processed-v4
"""

import json
import os
import re
import hashlib
import argparse
import random
from pathlib import Path
from collections import defaultdict

# ============================================================
# Configuration
# ============================================================

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
DEFAULT_INPUT_DIRS = [
    AI_TRAINING_DIR / "data" / "raw",
    AI_TRAINING_DIR / "data" / "mined",
    AI_TRAINING_DIR / "merged",
    AI_TRAINING_DIR / "data",
    AI_TRAINING_DIR,
]
DEFAULT_OUTPUT_DIR = AI_TRAINING_DIR / "data" / "processed-v4"

# ============================================================
# v4-specific: Task-type caps for website-conditions-v2 data
# Applied ONLY to general-clinical dataset to prevent dilution
# ============================================================

V4_TASK_TYPE_CAPS = {
    "patient_education": 300,       # Down from 1,172 — low clinical value, main dilution source
    "patient_communication": 500,   # Down from 2,710 — useful but oversupplied
    "clinical_summary": 400,        # Down from 987 — moderate value
    "red_flag_analysis": None,      # NO CAP — extremely valuable (1,973 examples kept)
    "differential_diagnosis": None, # NO CAP — directly tested (1,120 examples kept)
}

# Website-conditions-v2 source identifier
WEBSITE_V2_SOURCE = "website-conditions-v2.jsonl"

# v4 upsampling: 3x for high-value synthetic data (was 2x in v2)
V4_UPSAMPLE_FACTOR = 3
V4_UPSAMPLE_PATTERNS = [
    "red-flags-v2-synthetic.jsonl",
    "icpc2-v2-synthetic.jsonl",
    "icpc2-v3-targeted.jsonl",
    "comms-norwegian-v2-synthetic.jsonl",
]

# Keywords that indicate non-clinical contamination
CONTAMINATION_KEYWORDS = [
    "bubble.io", "bubble io", "react", "github", "codespaces",
    "npm", "component", "api endpoint", "deployment", "webpack",
    "javascript", "typescript", "frontend", "backend", "docker",
    "kubernetes", "redux", "vite", "tailwind", "prisma",
    "node.js", "express.js", "postgresql", "mongodb",
    "css", "html tag", "div class", "import from",
    "useState", "useEffect", "jsx", "tsx",
    "git commit", "git push", "pull request",
    "sprint planning", "agile", "scrum",
    "budget", "pricing tier", "subscription",
    "marketing strategy", "social media",
    "development plan", "hybrid development",
    "desktop ehr", "from bubble",
]

# Clinical patterns that indicate valid data
CLINICAL_PATTERNS = [
    r"soap", r"notat", r"pasient", r"smerte", r"behandling",
    r"diagnos", r"klinisk", r"undersøkelse", r"cervical",
    r"lumbal", r"thorakal", r"skulder", r"hofte", r"nakke",
    r"korsrygg", r"hodepine", r"r[øo]de flagg", r"red flag",
    r"differensial", r"palpasjon", r"trigger",
    r"mobilisering", r"manipulasjon", r"øvelse",
    r"VAS\s+\d", r"ROM\b", r"SLR\b", r"Spurling",
    r"ICD-?10", r"ICPC-?2", r"M\d{2}\.\d",
    r"hovedklage", r"chief complaint",
    r"subjektiv", r"objektiv", r"vurdering", r"plan",
    r"referral", r"henvisning", r"sykemelding", r"attest",
    r"kiropraktor", r"chiropract",
    r"nerverot", r"radikulopati", r"stenose", r"prolaps",
    r"fascett", r"facett", r"diskus",
    r"ortoped", r"nevrolog", r"fysioterapi",
    r"SMS.*p[åa]minnelse", r"appointment.*remind",
    r"tone.*direct|tone.*empatisk|tone.*profesjonell",
    r"NorHiT", r"Coombes", r"Cochrane", r"NICE",
]

CLINICAL_RE = re.compile("|".join(CLINICAL_PATTERNS), re.IGNORECASE)

# Model-specific category keywords
CATEGORY_KEYWORDS = {
    "quick-fields": [
        r"generer hovedklage", r"generer .* felt",
        r"chief complaint", r"autocomplete",
        r"clinical.?field", r"klinisk felt",
        r"kort .* generering", r"quick",
        r"generer .* for pasient", r"generer .* for patient",
        r"completion", r"generate .* field",
        r"SMS", r"påminnelse", r"reminder",
        r"ICPC", r"ICD",
        r"tone", r"direkte", r"empatisk", r"profesjonell",
    ],
    "medical-safety": [
        r"r[øo]de flagg", r"red flag", r"differensial",
        r"klinisk resonnering", r"clinical reasoning",
        r"sikkerhet", r"safety", r"alvorlig",
        r"cauda equina", r"fraktur", r"malignitet",
        r"infeksjon", r"vaskulær", r"nevrologisk utfall",
        r"diagnos", r"patologi", r"undersøkelse",
        r"test.*positiv", r"test.*negativ",
        r"nevro", r"ortoped", r"Spurling", r"SLR",
        r"stenose", r"prolaps", r"radikulopati",
    ],
    "norwegian-clinical": [
        r"SOAP", r"notat", r"subjektiv", r"objektiv",
        r"vurdering", r"plan", r"behandling",
        r"palpasjon", r"mobilisering", r"manipulasjon",
        r"kiropraktor", r"klinikk",
        r"henvisning", r"sykemelding", r"attest",
        r"brev", r"letter", r"referral",
    ],
}

CATEGORY_RES = {
    k: re.compile("|".join(v), re.IGNORECASE)
    for k, v in CATEGORY_KEYWORDS.items()
}


# ============================================================
# Data Loading
# ============================================================

def load_jsonl(filepath):
    """Load a JSONL file, returning list of parsed objects."""
    items = []
    errors = 0
    with open(filepath, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                items.append(json.loads(line))
            except json.JSONDecodeError:
                errors += 1
    return items, errors


def discover_jsonl_files(input_dirs):
    """Find all JSONL files across input directories, avoiding duplicates."""
    seen_names = set()
    files = []
    for d in input_dirs:
        if not d.exists():
            continue
        for f in sorted(d.glob("*.jsonl")):
            name = f.name
            if name not in seen_names:
                seen_names.add(name)
                files.append(f)
    return files


# ============================================================
# Format Conversion to ChatML
# ============================================================

def to_chatml(item):
    """Convert any format to ChatML messages list. Returns None if invalid."""
    if "messages" in item:
        msgs = item["messages"]
        if isinstance(msgs, list) and len(msgs) >= 2:
            valid = all(
                isinstance(m, dict) and "role" in m and "content" in m
                for m in msgs
            )
            if valid:
                return msgs
        return None

    if "prompt" in item and "response" in item:
        system_msg = _get_system_prompt(item)
        user_content = item["prompt"].strip()
        assistant_content = item["response"].strip()
        if user_content and assistant_content:
            msgs = []
            if system_msg:
                msgs.append({"role": "system", "content": system_msg})
            msgs.append({"role": "user", "content": user_content})
            msgs.append({"role": "assistant", "content": assistant_content})
            return msgs
        return None

    if "prompt" in item and "completion" in item:
        system_msg = _get_system_prompt(item)
        user_content = item["prompt"].strip()
        assistant_content = item["completion"].strip()
        if user_content and assistant_content:
            msgs = []
            if system_msg:
                msgs.append({"role": "system", "content": system_msg})
            msgs.append({"role": "user", "content": user_content})
            msgs.append({"role": "assistant", "content": assistant_content})
            return msgs
        return None

    if "instruction" in item:
        system_msg = _get_system_prompt(item)
        instruction = item["instruction"].strip()
        inp = item.get("input", "").strip()
        output = item.get("output", item.get("response", "")).strip()
        if instruction and output:
            user_content = f"{instruction}\n{inp}" if inp else instruction
            msgs = []
            if system_msg:
                msgs.append({"role": "system", "content": system_msg})
            msgs.append({"role": "user", "content": user_content})
            msgs.append({"role": "assistant", "content": output})
            return msgs
        return None

    return None


def _get_system_prompt(item):
    """Extract system prompt based on model type or explicit field."""
    if "system" in item and item["system"]:
        return item["system"].strip()

    model = item.get("model", "").lower()
    item_type = item.get("type", "").lower()

    if model == "norwegian" or item_type in ("referral_letter", "letter"):
        return (
            "Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. "
            "Generer nøyaktige, profesjonelle kliniske dokumenter med korrekt norsk medisinsk terminologi."
        )
    elif model == "medical":
        return (
            "Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. "
            "Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. "
            "Prioriter alltid pasientsikkerhet."
        )
    elif model == "fast":
        return (
            "Du er en rask klinisk tekstassistent. "
            "Generer korte, presise kliniske tekstfelt for kiropraktisk dokumentasjon."
        )

    return None


# ============================================================
# Quality Filtering (v4: preserves metadata!)
# ============================================================

def is_contaminated(messages):
    """Check if messages contain non-clinical content."""
    full_text = " ".join(m["content"] for m in messages).lower()
    for keyword in CONTAMINATION_KEYWORDS:
        if keyword in full_text:
            clinical_matches = len(CLINICAL_RE.findall(full_text))
            if clinical_matches < 2:
                return True
    return False


def is_echo_response(messages):
    """Check if assistant just echoes the user input."""
    user_msgs = [m["content"].strip() for m in messages if m["role"] == "user"]
    asst_msgs = [m["content"].strip() for m in messages if m["role"] == "assistant"]
    if not user_msgs or not asst_msgs:
        return True
    for u, a in zip(user_msgs, asst_msgs):
        if u == a:
            return True
        shorter, longer = (u, a) if len(u) < len(a) else (a, u)
        if shorter and shorter in longer and len(shorter) / max(len(longer), 1) > 0.8:
            return True
    return False


def is_too_short(messages, min_chars=50):
    """Check if assistant response is too short."""
    asst_msgs = [m["content"].strip() for m in messages if m["role"] == "assistant"]
    if not asst_msgs:
        return True
    return all(len(a) < min_chars for a in asst_msgs)


def content_hash(messages):
    """Create a hash for deduplication."""
    text = "||".join(
        f"{m['role']}:{m['content'].strip()}"
        for m in messages
        if m["role"] in ("user", "assistant")
    )
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def filter_examples(examples, source_name=""):
    """Apply all quality filters. Returns (kept, stats).

    v4 FIX: Preserves _source and metadata through filtering!
    """
    stats = defaultdict(int)
    stats["total"] = len(examples)
    kept = []
    seen_hashes = set()

    for ex in examples:
        messages = to_chatml(ex)
        if messages is None:
            stats["invalid_format"] += 1
            continue

        h = content_hash(messages)
        if h in seen_hashes:
            stats["duplicate"] += 1
            continue
        seen_hashes.add(h)

        if is_echo_response(messages):
            stats["echo_response"] += 1
            continue

        if is_too_short(messages, min_chars=30):
            stats["too_short"] += 1
            continue

        if is_contaminated(messages):
            stats["contaminated"] += 1
            continue

        # v4 FIX: preserve _source and metadata (v2 script discarded these!)
        kept.append({
            "messages": messages,
            "_source": ex.get("_source", ""),
            "_metadata": ex.get("metadata", {}),
        })
        stats["kept"] += 1

    return kept, dict(stats)


# ============================================================
# v4: Task-Type Capping for General-Clinical
# ============================================================

def apply_task_type_caps(examples, caps, seed=42):
    """Cap website-conditions-v2 examples by task_type in general-clinical.

    Separates examples into:
    - non_website: kept as-is (no caps)
    - website_by_task_type: capped per V4_TASK_TYPE_CAPS

    Returns: recombined list, cap_stats dict
    """
    rng = random.Random(seed)
    non_website = []
    website_by_type = defaultdict(list)

    for ex in examples:
        source = ex.get("_source", "")
        if WEBSITE_V2_SOURCE in source:
            task_type = ex.get("_metadata", {}).get("task_type", "unknown")
            website_by_type[task_type].append(ex)
        else:
            non_website.append(ex)

    cap_stats = {
        "non_website_count": len(non_website),
        "website_before_caps": sum(len(v) for v in website_by_type.values()),
    }

    # Apply caps
    capped_website = []
    for task_type, exs in sorted(website_by_type.items()):
        cap = caps.get(task_type)
        before = len(exs)
        if cap is not None and len(exs) > cap:
            rng.shuffle(exs)
            exs = exs[:cap]
        capped_website.extend(exs)
        after = len(exs)
        cap_label = str(cap) if cap is not None else "uncapped"
        cap_stats[f"website_{task_type}"] = f"{before} -> {after} (cap={cap_label})"

    cap_stats["website_after_caps"] = len(capped_website)
    cap_stats["total_after_caps"] = len(non_website) + len(capped_website)

    return non_website + capped_website, cap_stats


# ============================================================
# Categorization for Model-Specific Datasets
# ============================================================

def categorize_example(example):
    """Assign category tags to an example for model-specific datasets."""
    messages = example["messages"]
    full_text = " ".join(m["content"] for m in messages)
    categories = set()

    for cat_name, cat_re in CATEGORY_RES.items():
        if cat_re.search(full_text):
            categories.add(cat_name)

    # Default: everything goes to general
    categories.add("general-clinical")

    return categories


# ============================================================
# Train/Val/Test Split
# ============================================================

def split_dataset(examples, train_ratio=0.80, val_ratio=0.10, seed=42):
    """Split examples into train/validation/test sets."""
    rng = random.Random(seed)
    shuffled = list(examples)
    rng.shuffle(shuffled)

    n = len(shuffled)
    n_train = max(1, int(n * train_ratio))
    n_val = max(1, int(n * val_ratio))

    train = shuffled[:n_train]
    val = shuffled[n_train:n_train + n_val]
    test = shuffled[n_train + n_val:]

    if not test and len(val) > 1:
        test = [val.pop()]

    return train, val, test


def save_jsonl(items, filepath):
    """Save list of dicts as JSONL. Strips internal metadata before saving."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        for item in items:
            # Only save messages (strip _source, _metadata used for capping)
            out = {"messages": item["messages"]}
            f.write(json.dumps(out, ensure_ascii=False) + "\n")


# ============================================================
# Main Pipeline
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Prepare v4 curated training data")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR,
                        help="Output directory for processed data")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for splits")
    args = parser.parse_args()

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("ChiroClickCRM v4 Curated Data Preparer")
    print("=" * 60)

    # ── Phase 1: Discover and load all JSONL files ──
    print("\n[Phase 1] Discovering data files...")
    jsonl_files = discover_jsonl_files(DEFAULT_INPUT_DIRS)
    print(f"Found {len(jsonl_files)} JSONL files:")

    all_raw = []
    file_stats = {}
    for f in jsonl_files:
        items, errors = load_jsonl(f)
        rel = f.relative_to(AI_TRAINING_DIR)
        file_stats[str(rel)] = {"loaded": len(items), "errors": errors}
        print(f"  {rel}: {len(items)} items ({errors} parse errors)")
        for item in items:
            item["_source"] = str(rel)
        all_raw.extend(items)

    print(f"\nTotal raw items: {len(all_raw)}")

    # ── Phase 2: Filter and clean (preserving metadata) ──
    print("\n[Phase 2] Filtering and cleaning...")
    clean, stats = filter_examples(all_raw)
    print(f"\nFilter results:")
    for k, v in sorted(stats.items()):
        print(f"  {k}: {v}")

    # ── Phase 2.5: Upsample v4 high-quality data (3x, was 2x in v2) ──
    v4_upsampled = 0
    for d in DEFAULT_INPUT_DIRS:
        if not d.exists():
            continue
        for f in sorted(d.glob("*.jsonl")):
            if any(pat in f.name for pat in V4_UPSAMPLE_PATTERNS):
                items, _ = load_jsonl(f)
                for item in items:
                    msgs = to_chatml(item)
                    if msgs and not is_too_short(msgs, min_chars=30):
                        for _ in range(V4_UPSAMPLE_FACTOR):
                            clean.append({
                                "messages": msgs,
                                "_source": item.get("_source", f.name),
                                "_metadata": item.get("metadata", {}),
                            })
                            v4_upsampled += 1

    if v4_upsampled:
        print(f"\n[Phase 2.5] Upsampled v4 data (3x): +{v4_upsampled} examples")
        print(f"Total after upsampling: {len(clean)}")

    # ── Phase 3: Categorize ──
    print(f"\n[Phase 3] Categorizing {len(clean)} clean examples...")
    categorized = defaultdict(list)
    for ex in clean:
        cats = categorize_example(ex)
        for cat in cats:
            categorized[cat].append(ex)

    print("Category counts (before caps):")
    for cat, items in sorted(categorized.items()):
        print(f"  {cat}: {len(items)}")

    # ── Phase 3.5 (v4 NEW): Apply task-type caps to general-clinical ──
    print("\n[Phase 3.5] Applying task-type caps to general-clinical...")
    gc_before = len(categorized["general-clinical"])
    categorized["general-clinical"], cap_stats = apply_task_type_caps(
        categorized["general-clinical"], V4_TASK_TYPE_CAPS, seed=args.seed
    )
    gc_after = len(categorized["general-clinical"])
    print(f"  general-clinical: {gc_before} -> {gc_after}")
    for k, v in sorted(cap_stats.items()):
        print(f"    {k}: {v}")

    # ── Phase 4: Create datasets and split ──
    print("\n[Phase 4] Creating model-specific datasets...")

    datasets = {
        "all-clean": clean,
        "quick-fields": categorized.get("quick-fields", []),
        "medical-safety": categorized.get("medical-safety", []),
        "norwegian-clinical": categorized.get("norwegian-clinical", []),
        "general-clinical": categorized.get("general-clinical", []),
    }

    summary = {}
    for name, data in datasets.items():
        if not data:
            print(f"  {name}: EMPTY - skipping")
            continue

        # Deduplicate within this dataset
        seen = set()
        unique = []
        for ex in data:
            h = content_hash(ex["messages"])
            if h not in seen:
                seen.add(h)
                unique.append(ex)

        train, val, test = split_dataset(unique, seed=args.seed)

        ds_dir = output_dir / name
        save_jsonl(train, ds_dir / "train.jsonl")
        save_jsonl(val, ds_dir / "validation.jsonl")
        if test:
            save_jsonl(test, ds_dir / "test.jsonl")

        summary[name] = {
            "total": len(unique),
            "train": len(train),
            "validation": len(val),
            "test": len(test),
        }
        print(f"  {name}: {len(unique)} total -> train={len(train)}, val={len(val)}, test={len(test)}")

    # ── Phase 5: Composition analysis for general-clinical ──
    print("\n[Phase 5] Composition analysis (general-clinical train)...")
    gc_train_dir = output_dir / "general-clinical" / "train.jsonl"
    if gc_train_dir.exists():
        gc_train_items, _ = load_jsonl(gc_train_dir)
        total_gc = len(gc_train_items)
        # Estimate composition by content patterns
        red_flag_count = 0
        icpc_count = 0
        patient_edu_count = 0
        for item in gc_train_items:
            text = " ".join(m["content"] for m in item["messages"]).lower()
            if re.search(r"r[øo]de flagg|red flag|cauda equina|akutt|alvorlig", text):
                red_flag_count += 1
            if re.search(r"icpc|icd-?10|diagnose.*kode|kode.*diagnose", text):
                icpc_count += 1
            if re.search(r"pasientinformasjon|hva er|symptomer.*inkluderer|behandling.*inkluderer", text):
                patient_edu_count += 1

        rf_pct = red_flag_count / max(total_gc, 1) * 100
        icpc_pct = icpc_count / max(total_gc, 1) * 100
        edu_pct = patient_edu_count / max(total_gc, 1) * 100

        print(f"  Total general-clinical train: {total_gc}")
        print(f"  Red flag content:    {red_flag_count} ({rf_pct:.1f}%)")
        print(f"  ICPC-2 content:      {icpc_count} ({icpc_pct:.1f}%)")
        print(f"  Patient education:   {patient_edu_count} ({edu_pct:.1f}%)")
        print(f"  RF + ICPC combined:  {rf_pct + icpc_pct:.1f}%")

        # Verification checks
        checks_pass = True
        if rf_pct + icpc_pct < 15:
            print(f"  WARNING: RF + ICPC ({rf_pct + icpc_pct:.1f}%) < 15% target")
            checks_pass = False
        else:
            print(f"  OK: RF + ICPC ({rf_pct + icpc_pct:.1f}%) >= 15% target")

        if edu_pct > 5:
            print(f"  WARNING: Patient education ({edu_pct:.1f}%) > 5% target")
            checks_pass = False
        else:
            print(f"  OK: Patient education ({edu_pct:.1f}%) <= 5% target")

        if 9000 <= total_gc <= 12000:
            print(f"  OK: Total {total_gc} in range [9K, 12K]")
        else:
            print(f"  INFO: Total {total_gc} outside [9K, 12K] range (may be fine)")

    # ── Phase 6: Write summary report ──
    report_path = output_dir / "data-report.json"
    report = {
        "version": "v4",
        "file_stats": file_stats,
        "filter_stats": stats,
        "v4_caps": {k: v for k, v in V4_TASK_TYPE_CAPS.items()},
        "v4_upsample_factor": V4_UPSAMPLE_FACTOR,
        "v4_upsample_patterns": V4_UPSAMPLE_PATTERNS,
        "v4_cap_stats": cap_stats,
        "datasets": summary,
    }
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nReport saved: {report_path}")

    txt_path = output_dir / "data-report.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("ChiroClickCRM v4 Curated Training Data Report\n")
        f.write("=" * 50 + "\n\n")
        f.write("v4 Strategy: Task-type caps + 3x upsampling\n")
        f.write(f"Upsample factor: {V4_UPSAMPLE_FACTOR}x\n")
        f.write(f"Task-type caps: {json.dumps(V4_TASK_TYPE_CAPS)}\n\n")
        f.write("Source Files:\n")
        for fname, fstats in file_stats.items():
            f.write(f"  {fname}: {fstats['loaded']} items\n")
        f.write(f"\nTotal raw: {stats.get('total', 0)}\n")
        f.write(f"Kept after filtering: {stats.get('kept', 0)}\n")
        f.write(f"Removed - invalid format: {stats.get('invalid_format', 0)}\n")
        f.write(f"Removed - duplicates: {stats.get('duplicate', 0)}\n")
        f.write(f"Removed - echo responses: {stats.get('echo_response', 0)}\n")
        f.write(f"Removed - too short: {stats.get('too_short', 0)}\n")
        f.write(f"Removed - contaminated: {stats.get('contaminated', 0)}\n")
        f.write(f"\nv4 Cap Stats:\n")
        for k, v in sorted(cap_stats.items()):
            f.write(f"  {k}: {v}\n")
        f.write(f"\nDatasets:\n")
        for name, ds in summary.items():
            f.write(f"  {name}: {ds['total']} (train={ds['train']}, val={ds['validation']}, test={ds['test']})\n")
    print(f"Text report saved: {txt_path}")

    print("\n" + "=" * 60)
    print(f"DONE - {stats.get('kept', 0)} clean examples, {len(summary)} datasets")
    print(f"v4 caps removed {gc_before - gc_after} diluting examples from general-clinical")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    exit(main())
