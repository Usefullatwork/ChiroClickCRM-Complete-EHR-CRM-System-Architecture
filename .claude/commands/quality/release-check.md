---
description: Pre-release compliance gate. Run before any push to production. Blocks release if CRITICAL issues found.
---

Run a full pre-release check:

1. Run ALL tests (backend, frontend, E2E) — ALL must pass
2. Run compliance-scanner agent on the entire codebase
3. Run phi-check skill
4. Run `/dep-audit` (npm audit + license check + outdated packages)
5. Check git status for uncommitted changes
6. Verify CLAUDE.md is up to date
7. If on desktop branch: run `/electron-verify` for build artifact checks
8. Run WCAG spot-check on recently modified UI components

If ANY CRITICAL finding exists, output:

```
RELEASE BLOCKED
Reason: [specific critical finding]
Fix required before release.
```

If all clear, output:

```
RELEASE APPROVED
Tests: backend X/Y, frontend X/Y, E2E X/Y
Security: No critical vulnerabilities
Compliance: No critical violations
PHI: No leaks detected
```
