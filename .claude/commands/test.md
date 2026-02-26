---
name: test
description: Run tests for backend, frontend, or all. Usage: /test [backend|frontend|all]
---

Run the ChiroClickCRM test suite. Target: $ARGUMENTS (default: all)

## Determine Target

Parse the argument: `$ARGUMENTS`

- If empty or "all" → run both backend and frontend
- If "backend" → run only backend
- If "frontend" → run only frontend
- If "e2e" → run Playwright E2E tests

## Run Tests

Execute `bash scripts/check-tests.sh $ARGUMENTS`

For E2E specifically:

```bash
cd e2e && npx playwright test
```

## Report Results

Summarize:

- Total tests / suites
- Pass / fail counts
- Any new failures (compare against known counts: 1794 backend, 589 frontend)
- Known expected failures: 9 PGlite/Ollama-dependent backend suites
