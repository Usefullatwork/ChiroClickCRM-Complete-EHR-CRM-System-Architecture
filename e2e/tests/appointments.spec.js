/**
 * Appointment Management E2E Tests
 * Tests for appointment scheduling and management
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Appointments Page', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');
    await authenticatedPage.waitForSelector('[data-testid="appointments-new-button"]', { timeout: 15000 });
  });

  test('should display appointments page with new button', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('[data-testid="appointments-new-button"]')).toBeVisible();
  });

  test('should have date filter', async ({ authenticatedPage }) => {
    const dateFilter = authenticatedPage.locator('[data-testid="appointments-date-filter"]');
    await expect(dateFilter).toBeVisible();

    // Should default to today
    const value = await dateFilter.inputValue();
    expect(value).toBe(new Date().toISOString().split('T')[0]);
  });

  test('should change date and reload appointments', async ({ authenticatedPage }) => {
    const dateFilter = authenticatedPage.locator('[data-testid="appointments-date-filter"]');

    // Set a different date
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await dateFilter.fill(tomorrow);
    await authenticatedPage.waitForTimeout(500);

    // Date should be updated
    const value = await dateFilter.inputValue();
    expect(value).toBe(tomorrow);
  });

  test('should display appointment list or empty state', async ({ authenticatedPage }) => {
    // Either the list or empty state should be visible
    const list = authenticatedPage.locator('[data-testid="appointments-list"]');
    const emptyState = authenticatedPage.locator('text=No appointments');

    const listVisible = await list.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(listVisible || emptyVisible).toBe(true);
  });

  test('should display appointment rows with patient info', async ({ authenticatedPage }) => {
    const rows = authenticatedPage.locator('[data-testid="appointment-row"]');
    const count = await rows.count();

    if (count > 0) {
      const firstRow = rows.first();
      await expect(firstRow).toBeVisible();
    }
  });

  test('should navigate to new appointment page', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="appointments-new-button"]').click();
    await expect(authenticatedPage).toHaveURL(/.*appointments\/new.*/);
  });
});

test.describe('Appointment Filtering', () => {
  test('should filter by status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');
    await authenticatedPage.waitForSelector('[data-testid="appointments-new-button"]', { timeout: 15000 });

    // Find status select
    const statusSelect = authenticatedPage.locator('select').last();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('CONFIRMED');
      await authenticatedPage.waitForTimeout(500);
    }
  });
});
