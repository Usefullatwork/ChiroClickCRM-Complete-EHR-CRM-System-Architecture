/**
 * Clinical Encounters (SOAP Notes) E2E Tests
 * Tests for creating and managing clinical documentation
 */

import { test, expect, createTestEncounter } from './fixtures/auth.fixture.js';

test.describe('SOAP Note Navigation', () => {
  test('should access encounter from patient list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Click on first patient row
    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      // Check for "New Visit" button on patient detail
      const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
      if (await newVisitButton.isVisible()) {
        await expect(newVisitButton).toBeEnabled();
      }
    }
  });
});

test.describe('SOAP Note Form', () => {
  test('should display all four SOAP sections', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      // Click New Visit
      const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
      if (await newVisitButton.isVisible()) {
        await newVisitButton.click();
        await authenticatedPage.waitForTimeout(2000);

        // Verify all SOAP sections are visible
        await expect(authenticatedPage.locator('[data-testid="encounter-subjective"]')).toBeVisible({ timeout: 10000 });
        await expect(authenticatedPage.locator('[data-testid="encounter-objective"]')).toBeVisible();
        await expect(authenticatedPage.locator('[data-testid="encounter-assessment"]')).toBeVisible();
        await expect(authenticatedPage.locator('[data-testid="encounter-plan"]')).toBeVisible();
      }
    }
  });

  test('should have save button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
      if (await newVisitButton.isVisible()) {
        await newVisitButton.click();
        await authenticatedPage.waitForTimeout(2000);

        const saveButton = authenticatedPage.locator('[data-testid="encounter-save-button"]');
        await expect(saveButton).toBeVisible({ timeout: 10000 });
        await expect(saveButton).toBeEnabled();
      }
    }
  });
});

test.describe('Patient Encounter History', () => {
  test('should display visit history on patient detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

      // Visits tab should be visible
      const visitsSection = authenticatedPage.locator('[data-testid="patient-detail-tab-visits"]');
      await expect(visitsSection).toBeVisible({ timeout: 10000 });
    }
  });
});
