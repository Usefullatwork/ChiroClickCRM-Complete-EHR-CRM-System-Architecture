---
description: Scans Swagger-annotated endpoints and compares against test files to find coverage gaps.
---

Find API endpoints that lack test coverage.

## Steps

### 1. Discover All Endpoints

```bash
grep -rn "@swagger" backend/src/routes/ --include="*.js" -A 5 | grep -E "get|post|put|patch|delete"
```

Also parse `backend/src/routes/*.js` for `router.get/post/put/patch/delete` calls.
Expected: ~109 endpoints (per CLAUDE.md Swagger count).

### 2. Discover All API Tests

```bash
grep -rn "request(app)" backend/__tests__/ --include="*.js" -l
```

For each test file, extract the HTTP methods and paths being tested.

### 3. Cross-Reference

For each endpoint, check if there's at least one test that:

- Calls the correct HTTP method + path
- Tests the success case (2xx)
- Tests auth failure (401 — missing token)
- Tests authorization failure (403 — wrong role/org)
- Tests validation failure (400 — bad input)

### 4. Report Format

```
# API Coverage Report — {date}

## Summary
- Total endpoints: X
- Endpoints with tests: Y (Z%)
- Endpoints without ANY test: W

## Missing Coverage (by priority)

### CRITICAL — Patient Data Endpoints Without Auth Tests
[list]

### HIGH — Endpoints With No Tests At All
[list]

### MEDIUM — Endpoints Missing Error Case Tests
[list with specific missing cases]

### LOW — Endpoints Missing Only Edge Cases
[list]
```

### 5. Suggested Test Skeletons

For each CRITICAL or HIGH gap, output a test skeleton:

```javascript
describe("METHOD /api/v1/path", () => {
  it("should return 200 with valid data", async () => {
    // TODO: implement
  });
  it("should return 401 without auth token", async () => {
    // TODO: implement
  });
});
```

Write report to `reports/api-coverage-{date}.md`.
