#!/usr/bin/env python3
"""Audit ICPC-2 code coverage across all training data."""
import json
import re
from pathlib import Path
from collections import Counter

MINED_DIR = Path(__file__).parent.parent / "data" / "mined"

# Common chiropractic ICPC-2 codes — the ones we care about most
TARGET_CODES = {
    # Musculoskeletal L-codes
    "L01": "Nakkesymptom",
    "L02": "Ryggsymptom",
    "L03": "Korsryggsmerter",
    "L04": "Brystsøylesymptom",
    "L05": "Flankesymptom/bein",
    "L08": "Skuldersymptom",
    "L10": "Albuesymptom",
    "L12": "Hånd/håndleddsymptom",
    "L13": "Hoftesymptom",
    "L14": "Beinsymptom",
    "L15": "Knesymptom",
    "L16": "Ankelsymptom",
    "L17": "Fotsymptom",
    "L18": "Muskelsmerter/fibromyalgi",
    "L19": "Annet muskelsymptom",
    "L76": "Brudd/fraktur",
    "L77": "Forstuing ankel",
    "L78": "Forstuing kne",
    "L79": "Forstuing annen",
    "L83": "Nakkesyndrom",
    "L84": "Ryggsyndrom uten utstråling",
    "L86": "Ryggsyndrom med utstråling",
    "L87": "Bursitt/tendinitt",
    "L89": "Hofteartrose",
    "L90": "Kneartrose",
    "L91": "Artrose annen",
    "L92": "Skuldersyndrom",
    "L93": "Tennisalbue",
    "L94": "Perifer enthesopati",
    "L96": "Akutt indre kneskade",
    "L98": "Fotlidelse",
    "L99": "Annen MSK",
    # Neurological N-codes
    "N01": "Hodepine",
    "N02": "Spenningshodepine",
    "N17": "Svimmelhet",
    "N89": "Migrene",
    "N93": "Karpaltunnel",
    "N94": "Perifer nevritt",
    # Other relevant
    "H82": "BPPV/vestibulær",
    "D20": "Kjeve/munn",
}

code_counter = Counter()
file_counts = {}

# Scan all mined JSONL files
for f in sorted(MINED_DIR.glob("*.jsonl")):
    local_counts = Counter()
    with open(f, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            text = line  # search raw JSON text
            for code in TARGET_CODES:
                if code in text:
                    local_counts[code] += 1
                    code_counter[code] += 1
    file_counts[f.name] = local_counts

# Report
print("=" * 70)
print("ICPC-2 CODE COVERAGE ACROSS ALL MINED DATA")
print("=" * 70)

# Sort by count (ascending = weakest first)
for code in sorted(TARGET_CODES.keys(), key=lambda c: code_counter.get(c, 0)):
    count = code_counter.get(code, 0)
    name = TARGET_CODES[code]
    if count == 0:
        status = "MISSING"
    elif count < 5:
        status = "CRITICAL"
    elif count < 15:
        status = "LOW"
    else:
        status = "OK"
    print(f"  [{status:8s}] {code}: {count:4d} examples  ({name})")

# Summary stats
missing = [c for c in TARGET_CODES if code_counter.get(c, 0) == 0]
critical = [c for c in TARGET_CODES if 0 < code_counter.get(c, 0) < 5]
low = [c for c in TARGET_CODES if 5 <= code_counter.get(c, 0) < 15]

print(f"\n--- Summary ---")
print(f"  MISSING ({len(missing)}): {', '.join(missing)}")
print(f"  CRITICAL <5 ({len(critical)}): {', '.join(critical)}")
print(f"  LOW 5-14 ({len(low)}): {', '.join(low)}")
print(f"  OK 15+ ({len(TARGET_CODES) - len(missing) - len(critical) - len(low)})")
