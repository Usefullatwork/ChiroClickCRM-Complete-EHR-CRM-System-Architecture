---
description: Scans the codebase for tech debt indicators and outputs a prioritized report.
---

Scan the ChiroClickEHR codebase for technical debt.

$ARGUMENTS

## Scans to Run

### 1. i18n Debt (CRITICAL for this project)
Search frontend JSX/JS files for hardcoded Norwegian strings (quoted text containing ae, oe, aa, or common Norwegian words like "Lagre", "Avbryt", "Slett", "Opprett").
Exclude: test files, translation JSON files, CLAUDE.md, comments.
Compare count against the 676-string baseline in CLAUDE.md.

### 2. TODO/FIXME/HACK Comments
```bash
cd backend && grep -rn "TODO\|FIXME\|HACK" src/ --include="*.js" | head -30
cd frontend && grep -rn "TODO\|FIXME\|HACK" src/ --include="*.{js,jsx}" | head -30
```
Categorize by severity: HACK > FIXME > TODO.

### 3. Long Files (>500 lines)
```bash
find backend/src frontend/src -name "*.js" -o -name "*.jsx" | xargs wc -l | sort -rn | head -20
```
Flag files exceeding the 500-line limit from coding-style.md.

### 4. Long Functions (>80 lines)
Use grep to find function definitions and count lines between opening/closing braces.
Focus on backend services and frontend components.

### 5. Skipped Tests
```bash
grep -rn "test\.skip\|it\.skip\|describe\.skip\|xit\|xdescribe" backend/__tests__/ frontend/src/__tests__/ --include="*.{js,jsx}" | head -20
```
Flag any skip without a TODO comment explaining why.

### 6. Known Debt from CLAUDE.md
Read the "Known Tech Debt" section in CLAUDE.md and verify each item still exists.

## Output Format

Write report to `reports/tech-debt-{date}.md`:

```
# Tech Debt Report — {date}

## Summary
- i18n: X hardcoded strings (baseline: 676)
- TODOs: X items (Y HACK, Z FIXME)
- Long files: X over 500 lines
- Long functions: X over 80 lines
- Skipped tests: X without explanation

## CRITICAL
[items requiring immediate attention]

## HIGH
[items to address in next sprint]

## MEDIUM
[items to address when convenient]

## LOW
[backlog items]
```
