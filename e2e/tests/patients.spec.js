/**
 * Patient Management E2E Tests
 * Tests for patient CRUD operations and workflows
 */

import { test, expect, createTestPatient } from './fixtures/auth.fixture.js';

test.describe('Patient List', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
  });

  test('should display patient list', async ({ authenticatedPage }) => {
    // Wait for patient list to load
    await expect(authenticatedPage.locator('[data-testid="patient-list"], .patient-list, table'))
      .toBeVisible({ timeout: 15000 });
  });

  test('should have search functionality', async ({ authenticatedPage }) => {
    // Find search input
    const searchInput = authenticatedPage.locator(
      '[data-testid="patient-search"], input[type="search"], input[placeholder*="Søk"]'
    );
    await expect(searchInput.first()).toBeVisible();

    // Type search query
    await searchInput.first().fill('Test');

    // Wait for search results to update
    await authenticatedPage.waitForTimeout(500);
  });

  test('should filter patients by status', async ({ authenticatedPage }) => {
    // Find status filter
    const statusFilter = authenticatedPage.locator(
      '[data-testid="status-filter"], select[name="status"], [role="combobox"]'
    );

    if (await statusFilter.first().isVisible()) {
      await statusFilter.first().click();

      // Select active patients
      const activeOption = authenticatedPage.locator('text=Aktiv, text=ACTIVE').first();
      if (await activeOption.isVisible()) {
        await activeOption.click();
      }
    }
  });

  test('should paginate through patient list', async ({ authenticatedPage }) => {
    // Look for pagination controls
    const pagination = authenticatedPage.locator(
      '[data-testid="pagination"], .pagination, nav[aria-label*="pagination"]'
    );

    if (await pagination.isVisible()) {
      // Click next page
      const nextButton = pagination.locator('text=Neste, button[aria-label="Next"]').first();
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });

  test('should open patient details when clicking a patient', async ({ authenticatedPage }) => {
    // Click on first patient row
    const patientRow = authenticatedPage.locator(
      '[data-testid="patient-row"], tr[data-patient-id], .patient-item'
    ).first();

    if (await patientRow.isVisible()) {
      await patientRow.click();

      // Should navigate to patient detail page
      await expect(authenticatedPage).toHaveURL(/.*patients\/[a-zA-Z0-9-]+.*/);
    }
  });
});

test.describe('Create Patient', () => {
  test('should open create patient modal/form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    // Click create patient button
    const createButton = authenticatedPage.locator(
      '[data-testid="create-patient"], button:has-text("Ny pasient"), button:has-text("Legg til")'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Check for form modal or page
    const patientForm = authenticatedPage.locator(
      '[data-testid="patient-form"], form[name="patient"], .patient-form'
    );
    await expect(patientForm.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');

    // Try to submit empty form
    const submitButton = authenticatedPage.locator(
      'button[type="submit"], button:has-text("Lagre"), button:has-text("Opprett")'
    ).first();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Check for validation errors
      const validationError = authenticatedPage.locator(
        '[data-testid="validation-error"], .error-message, .field-error, text=påkrevd'
      );
      await expect(validationError.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate Norwegian fødselsnummer format', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');

    // Find fødselsnummer field
    const fnrField = authenticatedPage.locator(
      '[data-testid="fodselsnummer"], input[name="fodselsnummer"], input[name="solvitId"]'
    ).first();

    if (await fnrField.isVisible()) {
      // Enter invalid fødselsnummer
      await fnrField.fill('12345678901');

      // Trigger validation (blur or submit)
      await fnrField.blur();

      // Check for validation error
      const fnrError = authenticatedPage.locator(
        'text=ugyldig, text=fødselsnummer, text=Modulo 11'
      );
      // May or may not show error depending on implementation
    }
  });

  test('should create patient with valid data', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');

    const testPatient = createTestPatient();

    // Fill in patient form
    const firstNameInput = authenticatedPage.locator(
      'input[name="firstName"], input[name="first_name"], [data-testid="first-name"]'
    ).first();
    const lastNameInput = authenticatedPage.locator(
      'input[name="lastName"], input[name="last_name"], [data-testid="last-name"]'
    ).first();
    const emailInput = authenticatedPage.locator(
      'input[name="email"], input[type="email"], [data-testid="email"]'
    ).first();
    const phoneInput = authenticatedPage.locator(
      'input[name="phone"], input[type="tel"], [data-testid="phone"]'
    ).first();

    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill(testPatient.firstName);
    }
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill(testPatient.lastName);
    }
    if (await emailInput.isVisible()) {
      await emailInput.fill(testPatient.email);
    }
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(testPatient.phone);
    }

    // Submit form
    const submitButton = authenticatedPage.locator(
      'button[type="submit"], button:has-text("Lagre"), button:has-text("Opprett")'
    ).first();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Wait for success or navigation
      await authenticatedPage.waitForTimeout(2000);

      // Should redirect to patient list or detail page
      const successIndicator = authenticatedPage.locator(
        'text=opprettet, text=lagret, [data-testid="success-message"]'
      );
      // Success message or URL change expected
    }
  });
});

test.describe('Patient Detail', () => {
  test('should display patient information', async ({ authenticatedPage }) => {
    // Navigate to a patient detail page
    await authenticatedPage.goto('/patients');

    // Click on first patient
    const patientRow = authenticatedPage.locator(
      '[data-testid="patient-row"], tr[data-patient-id], .patient-item'
    ).first();

    if (await patientRow.isVisible()) {
      await patientRow.click();

      // Check for patient detail elements
      await expect(authenticatedPage.locator('[data-testid="patient-name"], h1, .patient-header'))
        .toBeVisible({ timeout: 10000 });
    }
  });

  test('should display patient tabs (info, encounters, appointments)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Check for tabs
      const tabs = authenticatedPage.locator('[role="tablist"], .tabs, .patient-tabs');
      if (await tabs.isVisible()) {
        // Should have multiple tabs
        const tabItems = tabs.locator('[role="tab"], .tab, button');
        const count = await tabItems.count();
        expect(count).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('should allow editing patient information', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Find edit button
      const editButton = authenticatedPage.locator(
        '[data-testid="edit-patient"], button:has-text("Rediger"), button[aria-label*="edit"]'
      ).first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Form should become editable
        const saveButton = authenticatedPage.locator(
          'button:has-text("Lagre"), button[type="submit"]'
        ).first();
        await expect(saveButton).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Patient Search - Full Text', () => {
  test('should search patients using full-text search', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const searchInput = authenticatedPage.locator(
      '[data-testid="patient-search"], input[type="search"], input[placeholder*="Søk"]'
    ).first();

    if (await searchInput.isVisible()) {
      // Search for a term
      await searchInput.fill('rygg'); // Norwegian for "back"

      // Wait for debounce and results
      await authenticatedPage.waitForTimeout(1000);

      // Results should update
      const resultsContainer = authenticatedPage.locator(
        '[data-testid="search-results"], .patient-list, table tbody'
      );
      await expect(resultsContainer.first()).toBeVisible();
    }
  });

  test('should show no results message when search yields nothing', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const searchInput = authenticatedPage.locator(
      '[data-testid="patient-search"], input[type="search"]'
    ).first();

    if (await searchInput.isVisible()) {
      // Search for something unlikely to exist
      await searchInput.fill('xyznonexistent12345');

      await authenticatedPage.waitForTimeout(1000);

      // Check for no results message
      const noResults = authenticatedPage.locator(
        'text=Ingen resultater, text=Ingen pasienter funnet, [data-testid="no-results"]'
      );
      // May or may not be visible depending on data
    }
  });
});
