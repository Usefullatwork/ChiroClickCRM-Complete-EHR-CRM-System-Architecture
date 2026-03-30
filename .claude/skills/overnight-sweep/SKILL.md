---
name: overnight-sweep
description: Orchestrates the full weekly improvement sweep. Run with /overnight-sweep or activate when asked about automated code improvement, weekly scan, or overnight analysis.
allowed-tools: Read, Grep, Glob, Bash(npm audit *), Bash(npm run test *), Bash(npx vitest *), Bash(git log *), Bash(git diff *)
user-invocable: true
model: opus
effort: high
---

# Weekly Improvement Sweep — ChiroClickCRM

Execute ALL passes in order. Write results to `reports/weekly/sweep-YYYY-MM-DD.md`.

## Pass 1: CRITICAL — Security Vulnerabilities

```bash
npm audit --audit-level=moderate 2>/dev/null
cd frontend && npm audit --audit-level=moderate 2>/dev/null
```

List HIGH and CRITICAL only. Include package name, version, vulnerability, and whether it's a production dependency.

## Pass 2: CRITICAL — PHI Leak Scan

Run the phi-check skill scans. Report every finding.

## Pass 3: HIGH — Normen/GDPR Compliance

Run compliance-audit skill checks. Report every failure.

## Pass 4: HIGH — Test Results

```bash
cd backend && npm test -- --no-coverage 2>&1 | tail -5
cd frontend && npx vitest run 2>&1 | tail -5
```

Report pass/fail counts. If any fail, list them.

## Pass 5: HIGH — Test Coverage Gaps

Run test-analyzer agent. Focus on patient data routes, auth, and audit logging.

## Pass 6: MEDIUM — Accessibility

Search for WCAG violations in JSX files:

- Missing alt attributes on images
- Form inputs without labels
- Missing aria attributes on interactive elements
- lang attribute verification

## Pass 7: MEDIUM — Code Quality

- Functions > 80 lines (candidates for splitting)
- Duplicated logic across files
- TODO/FIXME/HACK comments
- Unused exports and dead code

## Pass 8: LOW — Norwegian UI Consistency

- Mixed Norwegian/English in UI strings
- Inconsistent date/time formatting
- Missing translations

## Pass 9: MEDIUM — Tech Debt Scan

Run the `/tech-debt` command scans:

- Hardcoded Norwegian strings (i18n debt vs 676 baseline)
- TODO/FIXME/HACK comments
- Files >500 lines, functions >80 lines
- Skipped tests without explanation

## Pass 10: LOW — Dependency Audit

Run the `/dep-audit` command:

- `npm audit` on backend and frontend
- Check for outdated major versions
- Flag copyleft licenses in production deps

## Pass 11: LOW — i18n Coverage

Run the `/i18n-scan` command:

- Count hardcoded Norwegian strings in frontend
- Compare against 676-string baseline
- Report regression or progress

## REPORT FORMAT

Write the full report to `reports/weekly/sweep-{date}.md` with:

1. Executive summary (5 lines max)
2. CRITICAL findings (fix this week)
3. HIGH findings (fix within 2 weeks)
4. MEDIUM findings (fix when convenient)
5. LOW findings (backlog)
6. Test summary: backend X/Y, frontend X/Y
7. Comparison with last sweep (if previous report exists)
