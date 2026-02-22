#!/usr/bin/env python3
"""Quick data quality validator for all mined JSONL files."""
import json
import os
from pathlib import Path

MINED_DIR = Path(__file__).parent.parent / "data" / "mined"
DPO_DIR = Path(__file__).parent.parent / "data" / "dpo"

def validate_jsonl(filepath):
    errors = 0
    empties = 0
    total = 0
    with open(filepath, "r", encoding="utf-8") as fh:
        for i, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            total += 1
            try:
                obj = json.loads(line)
                msgs = obj.get("messages", [])
                if msgs:
                    for m in msgs:
                        if not m.get("content", "").strip():
                            empties += 1
                            print(f"  EMPTY content at line {i}")
                            break
                elif not obj.get("prompt") and not obj.get("instruction"):
                    empties += 1
                    print(f"  NO content at line {i}")
            except json.JSONDecodeError:
                errors += 1
                print(f"  MALFORMED JSON at line {i}")
    return total, errors, empties

print("=" * 60)
print("DATA QUALITY VALIDATION")
print("=" * 60)

grand_total = 0
grand_errors = 0
grand_empties = 0

# Validate mined data
print(f"\n--- Mined data: {MINED_DIR} ---")
for f in sorted(MINED_DIR.glob("*.jsonl")):
    total, errors, empties = validate_jsonl(f)
    grand_total += total
    grand_errors += errors
    grand_empties += empties
    status = "OK" if errors == 0 and empties == 0 else "ISSUES"
    print(f"  [{status}] {f.name}: {total} items, {errors} errors, {empties} empties")

# Validate DPO data
print(f"\n--- DPO data: {DPO_DIR} ---")
for f in sorted(DPO_DIR.glob("*.jsonl")):
    total, errors, empties = validate_jsonl(f)
    grand_total += total
    grand_errors += errors
    grand_empties += empties

    # Check DPO format
    with open(f, "r", encoding="utf-8") as fh:
        for i, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            keys = set(obj.keys())
            if not {"prompt", "chosen", "rejected"}.issubset(keys):
                print(f"  MISSING DPO keys at line {i}: has {keys}")
                break

    status = "OK" if errors == 0 and empties == 0 else "ISSUES"
    print(f"  [{status}] {f.name}: {total} items, {errors} errors, {empties} empties")

# Check v2 synthetic files exist
print(f"\n--- V2 synthetic files (for upsampling) ---")
v2_files = [
    "red-flags-v2-synthetic.jsonl",
    "icpc2-v2-synthetic.jsonl",
    "comms-norwegian-v2-synthetic.jsonl",
]
for v2 in v2_files:
    path = MINED_DIR / v2
    if path.exists():
        with open(path, "r", encoding="utf-8") as fh:
            count = sum(1 for l in fh if l.strip())
        print(f"  [EXISTS] {v2}: {count} examples (will be 2x upsampled)")
    else:
        print(f"  [MISSING] {v2}")

# ICPC-2 code coverage check
print(f"\n--- ICPC-2 code coverage in icpc2-v2-synthetic.jsonl ---")
icpc2_file = MINED_DIR / "icpc2-v2-synthetic.jsonl"
if icpc2_file.exists():
    import re
    code_counts = {}
    target_codes = ["L01", "L02", "L03", "L04", "L05", "L83", "L84", "L86", "L92", "L93", "L96", "N01", "N02", "N89", "H82"]
    with open(icpc2_file, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            text = json.dumps(obj, ensure_ascii=False)
            for code in target_codes:
                if code in text:
                    code_counts[code] = code_counts.get(code, 0) + 1

    for code in target_codes:
        count = code_counts.get(code, 0)
        status = "GOOD" if count >= 5 else ("LOW" if count >= 1 else "MISSING")
        print(f"  [{status}] {code}: {count} examples")

print(f"\n{'=' * 60}")
print(f"TOTALS: {grand_total} items, {grand_errors} errors, {grand_empties} empties")
print(f"{'=' * 60}")
