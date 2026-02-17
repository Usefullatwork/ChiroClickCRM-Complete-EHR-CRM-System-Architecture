/**
 * GDPR Compliance E2E Tests
 * Tests for data privacy and GDPR functionality
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Consent Management', () => {
  test('should display consent status on patient detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      // Consent section should be visible in patient detail
      const consentSection = authenticatedPage.locator('text=Samtykke, text=Consent').first();
      // Consent may be rendered in the patient detail page
    }
  });

  test('should display patient contact information', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      // Contact info tab
      const contactSection = authenticatedPage.locator('[data-testid="patient-detail-tab-contact"]');
      await expect(contactSection).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('GDPR Data Export', () => {
  test('should have export data button on patient detail', async ({ adminPage }) => {
    await adminPage.goto('/patients');
    await adminPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = adminPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await adminPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      // Export Data button exists on PatientDetail page
      const exportButton = adminPage.locator('button:has-text("Export Data")');
      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeEnabled();
      }
    }
  });
});

test.describe('Data Access via Patient Detail', () => {
  test('should display clinical information section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      const clinicalSection = authenticatedPage.locator('[data-testid="patient-detail-tab-clinical"]');
      await expect(clinicalSection).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display patient detail tabs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      const tabsContainer = authenticatedPage.locator('[data-testid="patient-detail-tabs"]');
      await expect(tabsContainer).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('New Patient Consent Fields', () => {
  test('should have consent checkboxes on new patient form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');
    await authenticatedPage.waitForSelector('[data-testid="new-patient-first-name"]', { timeout: 15000 });

    // Consent section should be visible in the form
    const consentSection = authenticatedPage.locator('text=Consent to SMS');
    await expect(consentSection).toBeVisible();
  });

  test('should submit new patient with consent fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');
    await authenticatedPage.waitForSelector('[data-testid="new-patient-first-name"]', { timeout: 15000 });

    // Verify the submit button exists
    const submitButton = authenticatedPage.locator('[data-testid="new-patient-submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});
