# Testing Rules

## When Tests Are Required
- Every new function or endpoint gets at least one test
- Every bug fix gets a regression test BEFORE the fix (TDD)
- Every route handling patient data gets auth tests (401/403)
- Every audit-logged operation gets a test verifying the log entry

## Test Quality
- Test behavior, not implementation (assert outputs, not internal calls)
- One assertion concept per test (multiple expects are fine if testing one behavior)
- Test names describe the scenario: `should return 401 when token is missing`
- No `test.skip` without a TODO comment explaining why

## Test Organization
- Backend: `backend/__tests__/` mirroring `backend/src/` structure
- Frontend: `frontend/src/__tests__/` or colocated `*.test.js` files
- E2E: `e2e/tests/` with Playwright

## Running Tests
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npx vitest --run`
- E2E: `npx playwright test`
- Single file: `cd backend && npm test -- --testPathPattern=filename`

## Known Limitations
- PGlite WASM crashes under parallel suites — expected, not a regression
- Ollama-dependent tests skip when Ollama is offline — expected
- Vitest v1 hangs in CI — handled by timeout wrapper
