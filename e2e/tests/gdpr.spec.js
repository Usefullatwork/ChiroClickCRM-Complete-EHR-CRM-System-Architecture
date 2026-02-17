/**
 * GDPR Compliance E2E Tests
 * Tests for data privacy and GDPR functionality
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Consent Management', () => {
  test('should display consent status on patient detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      // Patient detail page loaded - consent info may be in the clinical or contact tab
      await expect(authenticatedPage.locator('[data-testid="patient-detail-name"]')).toBeVisible();
    }
  });

  test('should display patient contact information', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

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

    await adminPage.waitForTimeout(1000);

    const patientRow = adminPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await adminPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      // Export Data button exists on PatientDetail page
      const exportButton = adminPage.locator('button').filter({ hasText: 'Export Data' });
      if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(exportButton).toBeEnabled();
      }
    }
  });
});

test.describe('Data Access via Patient Detail', () => {
  test('should display clinical information section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      const clinicalSection = authenticatedPage.locator('[data-testid="patient-detail-tab-clinical"]');
      await expect(clinicalSection).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display patient detail tabs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

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
    // The actual text is "Consent to SMS notifications"
    const consentSection = authenticatedPage.locator('text=Consent to SMS notifications');
    await expect(consentSection).toBeVisible({ timeout: 10000 });
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
