# Testing Patterns

**Analysis Date:** 2026-01-21

## Test Framework

**Backend Runner:**

- Jest 29.7
- Config: `backend/jest.config.js`
- Requires `--experimental-vm-modules` flag for ES modules

**Frontend Runner:**

- Vitest 1.1
- Config: `frontend/vitest.config.js`
- Built-in Vite integration

**E2E Runner:**

- Playwright
- Config: `e2e/playwright.config.js`

**Assertion Library:**

- Jest built-in expect (backend)
- Vitest built-in expect (frontend)
- Testing Library matchers (`@testing-library/jest-dom`)

**Run Commands:**

```bash
# Root commands
npm test                        # Run all tests (backend + frontend)
npm run test:coverage           # Coverage for both

# Backend
cd backend
npm test                        # Run all backend tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run test:services          # Services tests only
npm run test:routes            # Routes tests only

# Frontend
cd frontend
npm test                        # Run all frontend tests
npm run test:watch             # Watch mode (vitest default)
npm run test:ui                # Vitest UI
npm run test:coverage          # Coverage report
npm run test:components        # Components tests only
npm run test:pages             # Pages tests only
```

## Test File Organization

**Location:**

- Backend: `backend/src/**/__tests__/*.test.js` (co-located with source)
- Frontend: `frontend/src/**/__tests__/*.test.jsx` (co-located)
- E2E: `e2e/tests/*.spec.js` (separate directory)

**Naming:**

- Unit tests: `{module}.test.js`
- E2E tests: `{feature}.spec.js`
- Mocks: `__mocks__/{module}.js`

**Structure:**

```
backend/
  src/
    config/
      __mocks__/
        database.js          # Database mock
    utils/
      __mocks__/
        logger.js           # Logger mock

frontend/
  src/
    components/
      anatomy/
        __tests__/
          BodyChart.test.jsx  # Component tests

e2e/
  tests/
    accessibility.spec.js     # Accessibility tests
    api.spec.js              # API tests
    appointments.spec.js     # Appointments flow
    dashboard.spec.js        # Dashboard tests
    encounters.spec.js       # Clinical encounters
    gdpr.spec.js            # GDPR compliance
    patients.spec.js        # Patient management
    search.spec.js          # Search functionality
```

## Test Structure

**Suite Organization (Backend):**

```javascript
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

describe("PatientService", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe("getPatient", () => {
    it("should return patient when found", async () => {
      // arrange
      const mockPatient = { id: "123", name: "Test" };

      // act
      const result = await service.getPatient("123");

      // assert
      expect(result).toEqual(mockPatient);
    });

    it("should throw when patient not found", async () => {
      await expect(service.getPatient("invalid")).rejects.toThrow();
    });
  });
});
```

**Suite Organization (Frontend):**

```javascript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Dashboard", () => {
  it("renders dashboard title", () => {
    render(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("handles button click", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByText("Success")).toBeInTheDocument();
  });
});
```

**Patterns:**

- `beforeEach` to reset state and mocks
- `afterEach` for cleanup if needed
- Arrange/Act/Assert structure
- One assertion focus per test

## Mocking

**Framework:**

- Jest `jest.mock()` for backend
- Vitest `vi.mock()` for frontend

**Backend Mocking:**

```javascript
// Mock database
jest.mock("../config/database.js", () => ({
  query: jest.fn(),
}));

// Mock external service
jest.mock("../services/sms.js", () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
}));
```

**Frontend Mocking:**

```javascript
import { vi } from "vitest";

// Mock API
vi.mock("../services/api", () => ({
  getPatients: vi.fn().mockResolvedValue([]),
}));

// Mock Clerk
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: true, userId: "test" }),
}));
```

**What to Mock:**

- Database queries (`backend/src/config/database.js`)
- External services (SMS, email, AI)
- Authentication (Clerk)
- HTTP requests (axios)
- File system operations

**What NOT to Mock:**

- Business logic under test
- Validation functions
- Pure utility functions

## Fixtures and Factories

**Test Data:**

```javascript
// Factory pattern
function createTestPatient(overrides = {}) {
  return {
    id: "test-patient-id",
    first_name: "Test",
    last_name: "Patient",
    organization_id: "test-org",
    ...overrides,
  };
}

// Usage
const patient = createTestPatient({ first_name: "John" });
```

**Location:**

- Inline in test files for simple data
- Shared fixtures not commonly used

## Coverage

**Requirements:**

- No enforced coverage target
- Coverage tracked for awareness

**Configuration:**

- Backend: Jest coverage (`--coverage`)
- Frontend: Vitest coverage with c8 (`@vitest/coverage-v8`)

**View Coverage:**

```bash
# Backend
cd backend && npm run test:coverage
open coverage/lcov-report/index.html

# Frontend
cd frontend && npm run test:coverage
open coverage/index.html
```

## Test Types

**Unit Tests:**

- Scope: Single function or component in isolation
- Mocking: Mock all external dependencies
- Location: `__tests__/` directories
- Examples: Service functions, React components, utilities

**Integration Tests:**

- Scope: Multiple modules working together
- Mocking: Mock external boundaries (DB, APIs)
- Framework: Supertest for API routes
- Examples: Route handlers with validation

**E2E Tests:**

- Framework: Playwright
- Scope: Full user flows in browser
- Location: `e2e/tests/`
- Test files: `accessibility.spec.js`, `api.spec.js`, `appointments.spec.js`, `dashboard.spec.js`, `encounters.spec.js`, `gdpr.spec.js`, `patients.spec.js`, `search.spec.js`

## Common Patterns

**Async Testing:**

```javascript
it("should handle async operation", async () => {
  const result = await asyncFunction();
  expect(result).toBe("expected");
});
```

**Error Testing:**

```javascript
// Sync error
it("should throw on invalid input", () => {
  expect(() => validate(null)).toThrow("Invalid input");
});

// Async error
it("should reject on failure", async () => {
  await expect(asyncCall()).rejects.toThrow("Error message");
});
```

**API Testing (Supertest):**

```javascript
import request from "supertest";
import app from "../server.js";

describe("GET /api/v1/patients", () => {
  it("should return patients list", async () => {
    const response = await request(app)
      .get("/api/v1/patients")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
```

**React Testing Library:**

```javascript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("submits form correctly", async () => {
  const user = userEvent.setup();
  render(<PatientForm onSubmit={mockSubmit} />);

  await user.type(screen.getByLabelText("Name"), "John");
  await user.click(screen.getByRole("button", { name: /save/i }));

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({ name: "John" });
  });
});
```

**Snapshot Testing:**

- Not commonly used
- Prefer explicit assertions

---

_Testing analysis: 2026-01-21_
_Update when test patterns change_
