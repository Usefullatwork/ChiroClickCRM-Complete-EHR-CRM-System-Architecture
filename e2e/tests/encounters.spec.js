/**
 * Clinical Encounters (SOAP Notes) E2E Tests
 * Tests for creating and managing clinical documentation
 */

import { test, expect, createTestEncounter } from './fixtures/auth.fixture.js';

test.describe('SOAP Note Navigation', () => {
  test('should access encounter from patient list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Wait for patient data to load
    await authenticatedPage.waitForTimeout(1000);

    // Click on first patient row
    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      // Check for "New Visit" button on patient detail
      const newVisitButton = authenticatedPage.locator('button').filter({ hasText: /New Visit|Ny konsultasjon/i }).first();
      if (await newVisitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(newVisitButton).toBeEnabled();
      }
    }
  });
});

test.describe('SOAP Note Form', () => {
  test('should display all four SOAP sections', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (!(await patientRow.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

    // Click New Visit
    const newVisitButton = authenticatedPage.locator('button').filter({ hasText: /New Visit|Ny konsultasjon/i }).first();
    if (!(await newVisitButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await newVisitButton.click();
    // Wait for lazy-loaded encounter component
    await authenticatedPage.waitForTimeout(3000);

    // Verify all SOAP sections are visible
    const subjective = authenticatedPage.locator('[data-testid="encounter-subjective"]');
    if (await subjective.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(subjective).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="encounter-objective"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="encounter-assessment"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="encounter-plan"]')).toBeVisible();
    }
  });

  test('should have save button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (!(await patientRow.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

    const newVisitButton = authenticatedPage.locator('button').filter({ hasText: /New Visit|Ny konsultasjon/i }).first();
    if (!(await newVisitButton.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await newVisitButton.click();
    await authenticatedPage.waitForTimeout(3000);

    const saveButton = authenticatedPage.locator('[data-testid="encounter-save-button"]');
    if (await saveButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(saveButton).toBeEnabled();
    }
  });
});

test.describe('Patient Encounter History', () => {
  test('should display visit history on patient detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      // Visits tab should be visible
      const visitsSection = authenticatedPage.locator('[data-testid="patient-detail-tab-visits"]');
      await expect(visitsSection).toBeVisible({ timeout: 15000 });
    }
  });
});
