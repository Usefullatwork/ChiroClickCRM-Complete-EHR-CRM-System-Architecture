---
name: tdd
description: Test-driven development workflow. Activates when implementing new features or fixing bugs that need regression tests.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(cd backend && npm test *), Bash(cd frontend && npx vitest *), Bash(npx playwright test *)
---

# Test-Driven Development

Enforces the Red-Green-Refactor cycle for all new code.

## When This Skill Activates

- New feature implementation
- Bug fixes (write regression test FIRST)
- New API endpoints
- New React components with logic

## Phase 1: RED — Write the Failing Test

1. Identify what behavior needs to exist
2. Write a test that asserts that behavior
3. Run the test — it MUST fail
4. If the test passes without code changes, your test is wrong (it's testing something that already exists)

### Test Location Rules (ChiroClickEHR)

- Backend: `backend/__tests__/{module}/filename.test.js`
- Frontend: `frontend/src/__tests__/` or colocated `*.test.jsx`
- E2E: `e2e/tests/*.spec.js`

### Test Naming Convention

```javascript
describe('PatientService', () => {
  describe('getById', () => {
    it('should return patient when valid ID provided', async () => { ... });
    it('should return 404 when patient not found', async () => { ... });
    it('should return 403 when user lacks organization access', async () => { ... });
  });
});
```

## Phase 2: GREEN — Minimum Code to Pass

1. Write the MINIMUM code that makes the test pass
2. Do not add extra features, error handling, or optimizations yet
3. Run the test — it MUST pass now
4. Run the full related test suite to check for regressions

## Phase 3: REFACTOR — Clean Up

1. Now improve the code: extract functions, rename variables, add proper error handling
2. Run tests after EACH refactoring step
3. If any test breaks during refactoring, undo the last change
4. The refactored code must still pass all tests

## Anti-Patterns to Avoid

- Writing implementation first, tests after (not TDD)
- Writing tests that test implementation details (mock internals)
- Skipping Phase 1 because "you know it will fail"
- Writing multiple tests at once before implementing anything
- Making the test pass by hardcoding the expected value

## Integration with ChiroClickEHR

- Patient data routes: ALWAYS include auth tests (401/403)
- Audit-logged operations: ALWAYS verify audit_log entry
- AI endpoints: Mock Ollama responses, don't depend on live model
- Use `DEV_SKIP_AUTH=true` awareness — some tests need auth mocks even in dev mode
