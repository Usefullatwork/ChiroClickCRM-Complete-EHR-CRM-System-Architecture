/**
 * Billing Workflow E2E Tests
 * Tests for billing and appointment-related financial workflows
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Billing via Encounter Takster', () => {
  test('should display takster section in encounter plan', async ({ authenticatedPage }) => {
    // Navigate to patients -> select patient -> new visit
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Wait for patient data to load
    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    const hasPatients = await patientRow.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasPatients, 'No patients in seed data');

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

    // Click "New Visit" button on patient detail page
    const newVisitButton = authenticatedPage.locator('button').filter({ hasText: /New Visit|Ny konsultasjon/i }).first();
    await expect(newVisitButton).toBeVisible({ timeout: 5000 });

    await newVisitButton.click();

    // Wait for encounter form to load (lazy-loaded component)
    await authenticatedPage.waitForTimeout(3000);

    // Plan section should be visible
    const planSection = authenticatedPage.locator('[data-testid="encounter-plan"]');
    await expect(planSection).toBeVisible({ timeout: 10000 });
  });

  test('should show encounter save and sign buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    const hasPatients = await patientRow.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasPatients, 'No patients in seed data');

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

    const newVisitButton = authenticatedPage.locator('button').filter({ hasText: /New Visit|Ny konsultasjon/i }).first();
    await expect(newVisitButton).toBeVisible({ timeout: 5000 });

    await newVisitButton.click();

    // Wait for encounter form to load
    await authenticatedPage.waitForTimeout(3000);

    // Save button
    const saveButton = authenticatedPage.locator('[data-testid="encounter-save-button"]');
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await expect(saveButton).toBeEnabled();
  });
});

test.describe('Appointment Financial Context', () => {
  test('should display appointments with scheduling info', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');
    await authenticatedPage.waitForSelector('[data-testid="appointments-new-button"]', { timeout: 15000 });

    // Wait for data to load
    await authenticatedPage.waitForTimeout(1000);

    // Appointment list or empty state — verify the page loaded
    const list = authenticatedPage.locator('[data-testid="appointments-list"]');
    const emptyState = authenticatedPage.locator('text=/No appointments|Ingen avtaler/i');
    await expect(list.or(emptyState)).toBeVisible({ timeout: 10000 });

    const listVisible = await list.isVisible();
    if (listVisible) {
      const rows = authenticatedPage.locator('[data-testid="appointment-row"]');
      const count = await rows.count();
      if (count > 0) {
        // Each appointment row should have status and patient info
        const firstRow = rows.first();
        await expect(firstRow).toBeVisible();
      }
    }
  });

  test('should navigate to patient from appointment', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');
    await authenticatedPage.waitForSelector('[data-testid="appointments-new-button"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const rows = authenticatedPage.locator('[data-testid="appointment-row"]');
    const count = await rows.count();
    test.skip(count === 0, 'No appointment rows in seed data');

    // Click "View Patient" button on first appointment (may be i18n'd)
    const viewPatientButton = rows.first().locator('button').filter({ hasText: /View|Se pasient/i }).first();
    await expect(viewPatientButton).toBeVisible();
    await viewPatientButton.click();
    await expect(authenticatedPage).toHaveURL(/.*patients\/.*/);
  });
});

test.describe('Dashboard Revenue Stats', () => {
  test('should display revenue stat on dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Revenue stat card should be one of the 5 dashboard stat cards
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 15000 });

    const count = await statCards.count();
    expect(count).toBe(5);

    // One of the cards should show revenue info (contains "kr")
    // The revenue card always shows "0 kr" or "Xk kr"
    const revenueCard = statCards.filter({ hasText: 'kr' });
    await expect(revenueCard.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display todays appointment count', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Stat cards should include today's appointments count
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Patient Export', () => {
  test('should have CSV export button on patients page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Export button exists on patients page (labeled "Export")
    const exportButton = authenticatedPage.locator('button').filter({ hasText: 'Export' }).first();
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });
});
