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
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });

    const count = await statCards.count();
    expect(count).toBe(4);
  });

  test('should display todays schedule chart area', async ({ authenticatedPage }) => {
    const chart = authenticatedPage.locator('[data-testid="dashboard-chart"]');
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test('should display follow-up patients section', async ({ authenticatedPage }) => {
    const recentPatients = authenticatedPage.locator('[data-testid="dashboard-recent-patients"]');
    await expect(recentPatients).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to patients page from quick actions', async ({ authenticatedPage }) => {
    // Find the "New Patient" quick action button
    const newPatientAction = authenticatedPage.locator('button:has-text("New Patient"), button:has-text("Ny pasient")').first();

    if (await newPatientAction.isVisible()) {
      await newPatientAction.click();
      await expect(authenticatedPage).toHaveURL(/.*patients\/new.*/);
    }
  });

  test('should navigate to appointments from schedule', async ({ authenticatedPage }) => {
    // Click "View All" in schedule section
    const viewAllLink = authenticatedPage.locator('[data-testid="dashboard-chart"] a, [data-testid="dashboard-chart"] button').filter({ hasText: /View All|Se alle/i }).first();

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

    // Stat cards should still be visible
    const statCards = authenticatedPage.locator('[data-testid="dashboard-stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });
  });
});
