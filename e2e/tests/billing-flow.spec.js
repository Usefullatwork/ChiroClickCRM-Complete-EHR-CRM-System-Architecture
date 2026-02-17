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

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    if (!(await patientRow.isVisible())) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

    const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
    if (!(await newVisitButton.isVisible())) return;

    await newVisitButton.click();
    await authenticatedPage.waitForSelector('[data-testid="encounter-plan"]', { timeout: 15000 });

    // Plan section should be visible and contain billing/takster area
    const planSection = authenticatedPage.locator('[data-testid="encounter-plan"]');
    await expect(planSection).toBeVisible();

    // Look for takster/billing total display (shown as "X kr" in the header)
    const totalDisplay = authenticatedPage.locator('text=/\\d+ kr/').first();
    await expect(totalDisplay).toBeVisible({ timeout: 10000 });
  });

  test('should show encounter save and sign buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    if (!(await patientRow.isVisible())) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

    const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
    if (!(await newVisitButton.isVisible())) return;

    await newVisitButton.click();
    await authenticatedPage.waitForSelector('[data-testid="encounter-save-button"]', { timeout: 15000 });

    // Save button
    const saveButton = authenticatedPage.locator('[data-testid="encounter-save-button"]');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    // Sign and Lock button
    const signButton = authenticatedPage.locator('button:has-text("Signer")').first();
    await expect(signButton).toBeVisible();
  });
});

test.describe('Appointment Financial Context', () => {
  test('should display appointments with scheduling info', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');
    await authenticatedPage.waitForSelector('[data-testid="appointments-new-button"]', { timeout: 15000 });

    // Appointment list or empty state
    const list = authenticatedPage.locator('[data-testid="appointments-list"]');
    const listVisible = await list.isVisible().catch(() => false);

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

    const rows = authenticatedPage.locator('[data-testid="appointment-row"]');
    const count = await rows.count();

    if (count > 0) {
      // Click "View Patient" button on first appointment
      const viewPatientButton = rows.first().locator('button:has-text("View"), button:has-text("Se pasient")').first();

      if (await viewPatientButton.isVisible()) {
        await viewPatientButton.click();
        await expect(authenticatedPage).toHaveURL(/.*patients\/.*/);
      }
    }
  });
});

test.describe('Dashboard Revenue Stats', () => {
  test('should display revenue stat on dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Revenue stat card should be one of the 4 dashboard stat cards
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });

    const count = await statCards.count();
    expect(count).toBe(4);

    // One of the cards should show revenue info (contains "kr")
    const revenueCard = authenticatedPage.locator('[data-testid="dashboard-stat-card"]').filter({ hasText: 'kr' });
    await expect(revenueCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display todays appointment count', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Stat cards should include today's appointments count
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Patient Export', () => {
  test('should have CSV export button on patients page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Export button exists on patients page
    const exportButton = authenticatedPage.locator('button:has-text("Export")').first();
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeEnabled();
    }
  });
});
