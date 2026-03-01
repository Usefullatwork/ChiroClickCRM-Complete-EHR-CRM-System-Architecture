---
name: phi-check
description: Detects Protected Health Information leaks in code. Auto-activates when reviewing code that handles patient data, fødselsnummer, diagnoses, medical records, or health information. Use when checking for PHI exposure in logs, API responses, or error messages.
allowed-tools: Read, Grep, Glob
---

# PHI Leak Detection for Norwegian Healthcare

## Norwegian PHI Identifiers to Detect

- **Fødselsnummer**: 11 digits (DDMMYYIIIKK). Regex: `/\b\d{11}\b/`
- **D-nummer**: First digit is 4-7 (temporary residents)
- **H-nummer**: Third digit is 4-7 (emergency IDs)
- **HPR-nummer**: 7-9 digit health personnel registry number

## Scan Patterns

1. Search all `.js`, `.ts`, `.jsx`, `.tsx` files for:
   - `console.log` or `logger.*` calls containing patient/health variable references
   - Error handlers that pass raw error objects to responses (may contain patient data in message)
   - API responses returning patient objects without field filtering
   - URL construction with patient identifiers as query parameters
   - Fødselsnummer patterns in non-test source files

2. Check Express middleware chain for patient routes:
   - Verify sanitization middleware exists before response
   - Verify error handling middleware strips sensitive data in production

## Report Format

List each finding with file path, line number, the problematic code, and specific fix.
