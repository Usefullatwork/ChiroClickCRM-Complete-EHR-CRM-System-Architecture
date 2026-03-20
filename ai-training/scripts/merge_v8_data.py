#!/usr/bin/env python3
"""
Merge training data into processed-v8/ for the v8 weekend training sprint.

SFT merge:
  - data/processed-v7/combined-sft/ (5,144 train + 572 val)
  - data/raw/v21-communication-training.jsonl (80 lines)
  - data/raw/v8-targeted-training.jsonl (~100 lines)
  → data/processed-v8/combined-sft/ (train.jsonl + validation.jsonl)

DPO merge:
  - data/dpo-v7/ (860 train + 96 val) — {prompt:[msgs], chosen:[msgs], rejected:[msgs]}
  - data/dpo/v21-communication-dpo.jsonl (20 lines) — {messages:[msgs], chosen, rejected} → convert
  - data/dpo/v7_safety.jsonl (36 lines) — {prompt:"str", chosen:"str", rejected:"str"}
  → data/processed-v8/combined-dpo/ (train.jsonl + validation.jsonl)

Usage:
    python scripts/merge_v8_data.py
    python scripts/merge_v8_data.py --dry-run
"""

import json
import os
import random
import sys
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

random.seed(42)

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_DIR = SCRIPT_DIR.parent

# Source paths
V7_SFT_TRAIN = AI_DIR / "data" / "processed-v7" / "combined-sft" / "train.jsonl"
V7_SFT_VAL = AI_DIR / "data" / "processed-v7" / "combined-sft" / "validation.jsonl"
V21_COMMS_SFT = AI_DIR / "data" / "raw" / "v21-communication-training.jsonl"
V8_TARGETED = AI_DIR / "data" / "raw" / "v8-targeted-training.jsonl"

V7_DPO_TRAIN = AI_DIR / "data" / "dpo-v7" / "train.jsonl"
V7_DPO_VAL = AI_DIR / "data" / "dpo-v7" / "validation.jsonl"
V21_COMMS_DPO = AI_DIR / "data" / "dpo" / "v21-communication-dpo.jsonl"
V7_SAFETY_DPO = AI_DIR / "data" / "dpo" / "v7_safety.jsonl"

# Output paths
OUT_SFT_DIR = AI_DIR / "data" / "processed-v8" / "combined-sft"
OUT_DPO_DIR = AI_DIR / "data" / "processed-v8" / "combined-dpo"


def read_jsonl(path):
    """Read a JSONL file into a list of dicts."""
    items = []
    if not path.exists():
        print(f"  WARNING: File not found: {path}")
        return items
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                items.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"  ERROR: Malformed JSON at {path.name}:{i}: {e}")
    return items


def write_jsonl(items, path):
    """Write a list of dicts to a JSONL file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    print(f"  Written: {path.name} ({len(items)} lines)")


def validate_sft_item(item, source=""):
    """Validate a single SFT item has ChatML format."""
    msgs = item.get("messages", [])
    if not msgs:
        return False, f"No messages field ({source})"
    for m in msgs:
        if "role" not in m or "content" not in m:
            return False, f"Message missing role/content ({source})"
        if not m["content"].strip():
            return False, f"Empty content for role={m['role']} ({source})"
    return True, ""


def validate_dpo_item(item, source=""):
    """Validate a single DPO item has prompt/chosen/rejected."""
    if "prompt" not in item:
        return False, f"Missing 'prompt' key ({source})"
    if "chosen" not in item:
        return False, f"Missing 'chosen' key ({source})"
    if "rejected" not in item:
        return False, f"Missing 'rejected' key ({source})"
    return True, ""


def convert_v21_dpo(item):
    """Convert {messages, chosen, rejected} → {prompt, chosen, rejected}.

    v21 format:
      messages: [{role:system, content:...}, {role:user, content:...}]
      chosen: [{role:assistant, content:...}]
      rejected: [{role:assistant, content:...}]

    Target format (what DPOTrainer expects):
      prompt: [{role:system, content:...}, {role:user, content:...}]
      chosen: [{role:assistant, content:...}]
      rejected: [{role:assistant, content:...}]
    """
    if "messages" in item and "prompt" not in item:
        msgs = item["messages"]
        # Extract system + user messages (exclude assistant turns)
        prompt_msgs = [m for m in msgs if m.get("role") in ("system", "user")]
        return {
            "prompt": prompt_msgs,
            "chosen": item["chosen"],
            "rejected": item["rejected"],
        }
    return item


def merge_sft():
    """Merge all SFT data into processed-v8."""
    print("\n" + "=" * 60)
    print("  SFT DATA MERGE")
    print("=" * 60)

    # Load v7 base data
    v7_train = read_jsonl(V7_SFT_TRAIN)
    v7_val = read_jsonl(V7_SFT_VAL)
    print(f"  v7 SFT: {len(v7_train)} train, {len(v7_val)} val")

    # Load new SFT data
    v21_comms = read_jsonl(V21_COMMS_SFT)
    v8_targeted = read_jsonl(V8_TARGETED)
    print(f"  v21 comms: {len(v21_comms)} examples")
    print(f"  v8 targeted: {len(v8_targeted)} examples")

    # Validate new data
    new_data = v21_comms + v8_targeted
    valid_new = []
    for i, item in enumerate(new_data):
        ok, err = validate_sft_item(item, f"new[{i}]")
        if ok:
            valid_new.append(item)
        else:
            print(f"  SKIP: {err}")

    print(f"  Valid new examples: {len(valid_new)}")

    # Split new data 90/10
    random.shuffle(valid_new)
    split_idx = int(len(valid_new) * 0.9)
    new_train = valid_new[:split_idx]
    new_val = valid_new[split_idx:]

    print(f"  New split: {len(new_train)} train, {len(new_val)} val")

    # Combine
    all_train = v7_train + new_train
    all_val = v7_val + new_val

    # Shuffle training data
    random.shuffle(all_train)

    print(f"  Combined: {len(all_train)} train, {len(all_val)} val")

    # Write output
    write_jsonl(all_train, OUT_SFT_DIR / "train.jsonl")
    write_jsonl(all_val, OUT_SFT_DIR / "validation.jsonl")

    return len(all_train), len(all_val)


def merge_dpo():
    """Merge all DPO data into processed-v8."""
    print("\n" + "=" * 60)
    print("  DPO DATA MERGE")
    print("=" * 60)

    # Load v7 base data
    v7_train = read_jsonl(V7_DPO_TRAIN)
    v7_val = read_jsonl(V7_DPO_VAL)
    print(f"  v7 DPO: {len(v7_train)} train, {len(v7_val)} val")

    # Load and convert v21 communication DPO
    v21_raw = read_jsonl(V21_COMMS_DPO)
    v21_converted = [convert_v21_dpo(item) for item in v21_raw]
    print(f"  v21 comms DPO: {len(v21_converted)} examples (converted messages→prompt)")

    # Load v7 safety DPO (already in correct format)
    v7_safety = read_jsonl(V7_SAFETY_DPO)
    print(f"  v7 safety DPO: {len(v7_safety)} examples")

    # Combine new data
    new_dpo = v21_converted + v7_safety

    # Validate all new data
    valid_new = []
    for i, item in enumerate(new_dpo):
        ok, err = validate_dpo_item(item, f"new_dpo[{i}]")
        if ok:
            valid_new.append(item)
        else:
            print(f"  SKIP: {err}")

    print(f"  Valid new DPO: {len(valid_new)}")

    # Split new data 90/10
    random.shuffle(valid_new)
    split_idx = int(len(valid_new) * 0.9)
    new_train = valid_new[:split_idx]
    new_val = valid_new[split_idx:]

    # Combine with v7 base
    all_train = v7_train + new_train
    all_val = v7_val + new_val

    random.shuffle(all_train)

    print(f"  Combined: {len(all_train)} train, {len(all_val)} val")

    # Write output
    write_jsonl(all_train, OUT_DPO_DIR / "train.jsonl")
    write_jsonl(all_val, OUT_DPO_DIR / "validation.jsonl")

    return len(all_train), len(all_val)


def verify_output():
    """Verify all output files are valid JSONL with correct schemas."""
    print("\n" + "=" * 60)
    print("  VERIFICATION")
    print("=" * 60)

    all_ok = True

    # Check SFT files
    for name in ["train.jsonl", "validation.jsonl"]:
        path = OUT_SFT_DIR / name
        if not path.exists():
            print(f"  FAIL: {path} not found")
            all_ok = False
            continue

        items = read_jsonl(path)
        errors = 0
        for i, item in enumerate(items):
            ok, err = validate_sft_item(item, f"sft/{name}:{i+1}")
            if not ok:
                errors += 1
                if errors <= 3:
                    print(f"  FAIL: {err}")

        status = "OK" if errors == 0 else f"FAIL ({errors} errors)"
        print(f"  SFT {name}: {len(items)} items [{status}]")
        if errors > 0:
            all_ok = False

    # Check DPO files
    for name in ["train.jsonl", "validation.jsonl"]:
        path = OUT_DPO_DIR / name
        if not path.exists():
            print(f"  FAIL: {path} not found")
            all_ok = False
            continue

        items = read_jsonl(path)
        errors = 0
        for i, item in enumerate(items):
            ok, err = validate_dpo_item(item, f"dpo/{name}:{i+1}")
            if not ok:
                errors += 1
                if errors <= 3:
                    print(f"  FAIL: {err}")

        status = "OK" if errors == 0 else f"FAIL ({errors} errors)"
        print(f"  DPO {name}: {len(items)} items [{status}]")
        if errors > 0:
            all_ok = False

    return all_ok


def main():
    dry_run = "--dry-run" in sys.argv

    print("=" * 60)
    print("  ChiroClick v8 Data Merge")
    print("=" * 60)

    if dry_run:
        print("  DRY RUN — checking sources only, no output written")
        print()
        for label, path in [
            ("v7 SFT train", V7_SFT_TRAIN),
            ("v7 SFT val", V7_SFT_VAL),
            ("v21 comms SFT", V21_COMMS_SFT),
            ("v8 targeted", V8_TARGETED),
            ("v7 DPO train", V7_DPO_TRAIN),
            ("v7 DPO val", V7_DPO_VAL),
            ("v21 comms DPO", V21_COMMS_DPO),
            ("v7 safety DPO", V7_SAFETY_DPO),
        ]:
            exists = path.exists()
            count = len(read_jsonl(path)) if exists else 0
            status = f"{count} lines" if exists else "NOT FOUND"
            print(f"  {'OK' if exists else 'XX'} {label}: {status}")
        return 0

    # Merge SFT
    sft_train, sft_val = merge_sft()

    # Merge DPO
    dpo_train, dpo_val = merge_dpo()

    # Verify
    ok = verify_output()

    # Summary
    print("\n" + "=" * 60)
    print("  MERGE SUMMARY")
    print("=" * 60)
    print(f"  SFT: {sft_train} train + {sft_val} val = {sft_train + sft_val}")
    print(f"  DPO: {dpo_train} train + {dpo_val} val = {dpo_train + dpo_val}")
    print(f"  Output: {OUT_SFT_DIR}")
    print(f"          {OUT_DPO_DIR}")
    print(f"  Status: {'ALL OK' if ok else 'ERRORS FOUND'}")
    print("=" * 60)

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
