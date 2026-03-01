---
name: overnight-sweep
description: Orchestrates a weekly automated compliance and quality sweep. Use to run the full 6-pass analysis (security, PHI, compliance, accessibility, test gaps, code quality) and generate a prioritized report.
allowed-tools: Read, Grep, Glob, Bash(npm audit *), Bash(npm run test *), Bash(npx jest *)
---

# Weekly Improvement Sweep

Run all 6 passes in order. Generate a single report file.

## Pass 1: Security (npm audit)

- Run `npm audit --audit-level=moderate`
- List HIGH and CRITICAL vulnerabilities with package name and severity
- Note if vulnerability affects production vs dev dependencies

## Pass 2: PHI Leak Detection

- Scan for fødselsnummer patterns (/\b\d{11}\b/) in non-test source files
- Check console.log/logger calls referencing patient/health variables
- Check API error handlers for patient data exposure
- Check for SELECT \* on patient-related tables

## Pass 3: Normen/GDPR Compliance

- Verify all patient data routes have auth middleware
- Verify all patient mutations write to audit_log
- Check for http:// URLs in config
- Verify API responses filter patient fields

## Pass 4: WCAG 2.1 AA Accessibility

- Run any existing a11y tests
- Check for missing alt text, form labels, lang="nb"
- Check color contrast compliance

## Pass 5: Test Coverage Gaps

- Identify patient data routes without test files
- Check auth/authorization function test coverage
- Check audit logging test coverage
- List 5 most critical untested files

## Pass 6: Code Quality

- Find functions > 100 lines
- Find duplicated logic worth extracting
- Find TODO/FIXME/HACK comments
- Check for TypeScript 'any' in patient data paths

## Output

Write report to `reports/weekly/sweep-YYYY-MM-DD.md` with all findings prioritized by severity.
