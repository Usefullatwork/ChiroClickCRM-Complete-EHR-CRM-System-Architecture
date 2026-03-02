---
name: phi-check
description: Detects Protected Health Information leaks in code. Auto-activates when reviewing code that handles patient data, fødselsnummer, diagnoses, medical records, journal entries, or health information.
---

# PHI Leak Detection for Norwegian Healthcare

## Norwegian PHI Identifiers

- **Fødselsnummer**: 11 digits (DDMMYYIIIKK). Regex: `/\b\d{11}\b/`
- **D-nummer**: First digit 4-7 (foreign residents)
- **H-nummer**: Third digit 4-7 (emergency IDs)
- **HPR-nummer**: 7-9 digit health personnel registry number

## Scan Commands

```bash
# Find 11-digit patterns in source files (not tests, not node_modules)
grep -rn '\b[0-9]\{11\}\b' --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=__tests__ --exclude-dir=dist .

# Find console.log with patient-related variables
grep -rn 'console\.log.*\(.*\(patient\|pasient\|fødsel\|diagnos\|journal\|icpc\)' --include='*.js' --include='*.jsx' --exclude-dir=node_modules .

# Find SELECT * on patient tables
grep -rn 'SELECT \*.*FROM.*\(patient\|appointment\|journal\|diagnos\|audit\)' --include='*.js' --exclude-dir=node_modules .

# Find patient data in URL construction
grep -rn '\(req\.params\|req\.query\).*\(fødsel\|patient_id\|pasient\)' --include='*.js' --exclude-dir=node_modules .
```

Report every finding with file, line, code snippet, severity, and fix.
