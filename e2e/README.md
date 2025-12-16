# ChiroClickCRM E2E Tests

End-to-end tests for ChiroClickCRM using [Playwright](https://playwright.dev/).

## Setup

```bash
cd e2e
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests for specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile

# Debug tests
npm run test:debug

# Generate test code by recording actions
npm run codegen
```

## Test Structure

```
e2e/
├── playwright.config.js    # Playwright configuration
├── package.json
├── tests/
│   ├── fixtures/
│   │   └── auth.fixture.js # Authentication fixtures
│   ├── auth.setup.js       # Authentication setup
│   ├── dashboard.spec.js   # Dashboard tests
│   ├── patients.spec.js    # Patient management tests
│   ├── appointments.spec.js # Appointment scheduling tests
│   ├── encounters.spec.js  # SOAP note tests
│   ├── search.spec.js      # Full-text search tests
│   ├── accessibility.spec.js # A11y tests
│   ├── gdpr.spec.js        # GDPR compliance tests
│   └── api.spec.js         # API endpoint tests
└── test-results/           # Test output (gitignored)
```

## Test Categories

### Dashboard Tests
- KPI display
- Today's appointments
- Recent patients
- Navigation

### Patient Management Tests
- Patient list and search
- Create/edit patients
- Patient details
- Fødselsnummer validation

### Appointment Tests
- Calendar views
- Create/reschedule appointments
- Appointment filtering
- Send reminders

### SOAP Note Tests
- Create clinical encounters
- SOAP form sections
- Diagnosis code search
- Templates
- Signing workflow

### Search Tests
- Global search
- Patient search
- Diagnosis code search
- Encounter search
- Autocomplete

### Accessibility Tests
- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support

### GDPR Tests
- Data export
- Data deletion
- Consent management
- Audit logging

## Configuration

Set environment variables:

```bash
# .env
PLAYWRIGHT_BASE_URL=http://localhost:5173
API_URL=http://localhost:3000/api/v1
```

## CI Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Run E2E Tests
  run: |
    cd e2e
    npm ci
    npx playwright install --with-deps
    npm test
```

## Writing Tests

Use the provided fixtures for authenticated contexts:

```javascript
import { test, expect } from './fixtures/auth.fixture.js';

test('example test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage.locator('h1')).toBeVisible();
});
```

## Test Data

Use factories for consistent test data:

```javascript
import { createTestPatient, createTestAppointment } from './fixtures/auth.fixture.js';

const patient = createTestPatient();
const appointment = createTestAppointment(patientId);
```

## Reports

After running tests:

```bash
# Open HTML report
npm run test:report
```

Reports are generated in `playwright-report/`.

## Debugging

```bash
# Run specific test in debug mode
npx playwright test --debug patients.spec.js

# Show trace viewer for failed test
npx playwright show-trace test-results/path-to-trace.zip
```

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Keep tests independent** - each test should work in isolation
3. **Use page objects** for complex pages
4. **Mock external services** in CI
5. **Run tests in parallel** when possible
6. **Clean up test data** after tests
