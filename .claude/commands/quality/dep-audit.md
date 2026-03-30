---
description: Audits npm dependencies for security vulnerabilities, outdated packages, and license concerns.
---

Run a comprehensive dependency audit on both backend and frontend.

## Scans

### 1. Security Vulnerabilities

```bash
cd backend && npm audit --json 2>/dev/null
cd frontend && npm audit --json 2>/dev/null
```

Parse JSON output. Report CRITICAL and HIGH vulnerabilities with:

- Package name and version
- Vulnerability description
- Whether it's a production dependency
- Fix available? (`npm audit fix --dry-run`)

### 2. Outdated Packages

```bash
cd backend && npm outdated 2>/dev/null
cd frontend && npm outdated 2>/dev/null
```

Flag major version bumps separately from minor/patch.

### 3. License Compliance

```bash
cd backend && npx license-checker --json 2>/dev/null | node -p "Object.entries(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))).filter(([k,v])=>/GPL|AGPL|SSPL/.test(v.licenses)).map(([k,v])=>k+': '+v.licenses).join('\n')"
```

Healthcare software risk: GPL/AGPL in production deps = potential compliance issue.
Flag any copyleft license in production (not dev) dependencies.

### 4. Known CVE Check

Cross-reference critical packages (express, jsonwebtoken, bcrypt, pg, helmet) against their latest versions.

## Output Format

```
# Dependency Audit — {date}

## CRITICAL (Security)
[vulnerabilities with known exploits]

## HIGH (Outdated Major)
[packages with major version behind]

## MEDIUM (License Concerns)
[copyleft licenses in prod deps]

## LOW (Outdated Minor)
[packages with minor/patch updates available]

## Summary
Backend: X critical, Y high, Z medium
Frontend: X critical, Y high, Z medium
Action required: [yes/no]
```

## Integration

This command is also called as part of `/release-check`.
