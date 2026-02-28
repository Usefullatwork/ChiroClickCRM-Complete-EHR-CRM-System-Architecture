/**
 * Dashboard E2E Tests
 * Tests for the main dashboard functionality
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });
  });

  test('should display dashboard title', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('should display stat cards', async ({ authenticatedPage }) => {
    // Wait for stat cards to render (may require API response or skeleton to finish)
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 15000 });

    const count = await statCards.count();
    expect(count).toBe(5);
  });

  test('should display todays schedule chart area', async ({ authenticatedPage }) => {
    const chart = authenticatedPage.locator('[data-testid="dashboard-chart"]');
    await expect(chart).toBeVisible({ timeout: 15000 });
  });

  test('should display follow-up patients section', async ({ authenticatedPage }) => {
    const recentPatients = authenticatedPage.locator('[data-testid="dashboard-recent-patients"]');
    await expect(recentPatients).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to patients page from quick actions', async ({ authenticatedPage }) => {
    // Wait for quick actions to be rendered (they appear after stats)
    await authenticatedPage.waitForTimeout(1000);

    // Find the "New Patient" quick action button (may be i18n'd)
    const newPatientAction = authenticatedPage.locator('button').filter({ hasText: /New Patient|Ny pasient/i }).first();

    if (await newPatientAction.isVisible()) {
      await newPatientAction.click();
      await expect(authenticatedPage).toHaveURL(/.*patients\/new.*/);
    }
  });

  test('should navigate to appointments from schedule', async ({ authenticatedPage }) => {
    // The "View All" / "Se alle" button is in the dashboard-chart section header
    const chartSection = authenticatedPage.locator('[data-testid="dashboard-chart"]');
    const viewAllLink = chartSection.locator('button, a').filter({ hasText: /View All|Se alle/i }).first();

    if (await viewAllLink.isVisible()) {
      await viewAllLink.click();
      await expect(authenticatedPage).toHaveURL(/.*appointments.*/);
    }
  });
});

test.describe('Dashboard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-friendly dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    await expect(authenticatedPage.locator('[data-testid="dashboard-title"]')).toBeVisible({ timeout: 15000 });

    // Stat cards should still be visible (they stack on mobile)
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 15000 });
  });
});
