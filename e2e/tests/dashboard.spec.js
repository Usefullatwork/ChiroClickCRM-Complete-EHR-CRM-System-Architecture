/**
 * Dashboard E2E Tests
 * Tests for the main dashboard functionality
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
  });

  test('should display dashboard with key metrics', async ({ authenticatedPage }) => {
    // Check for main dashboard elements
    await expect(authenticatedPage.locator('h1, [data-testid="dashboard-title"]'))
      .toBeVisible({ timeout: 10000 });

    // Check for KPI cards
    const kpiSection = authenticatedPage.locator('[data-testid="kpi-section"], .kpi-cards, .dashboard-metrics');
    await expect(kpiSection).toBeVisible();
  });

  test('should display today\'s appointments', async ({ authenticatedPage }) => {
    // Look for appointments section
    const appointmentsSection = authenticatedPage.locator(
      '[data-testid="todays-appointments"], .appointments-today, text=I dag'
    );
    await expect(appointmentsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display recent patients', async ({ authenticatedPage }) => {
    // Look for recent patients section
    const patientsSection = authenticatedPage.locator(
      '[data-testid="recent-patients"], .recent-patients, text=Siste pasienter'
    );
    await expect(patientsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to patients page from dashboard', async ({ authenticatedPage }) => {
    // Click on patients link/button
    const patientsLink = authenticatedPage.locator(
      'a[href*="patients"], [data-testid="patients-link"], text=Pasienter'
    ).first();

    await patientsLink.click();
    await expect(authenticatedPage).toHaveURL(/.*patients.*/);
  });

  test('should navigate to appointments page from dashboard', async ({ authenticatedPage }) => {
    // Click on appointments link/button
    const appointmentsLink = authenticatedPage.locator(
      'a[href*="appointments"], [data-testid="appointments-link"], text=Avtaler'
    ).first();

    await appointmentsLink.click();
    await expect(authenticatedPage).toHaveURL(/.*appointments.*/);
  });

  test('should display loading state before data loads', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/dashboard/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/dashboard');

    // Check for loading spinner or skeleton
    const loadingIndicator = page.locator(
      '[data-testid="loading"], .loading-spinner, .skeleton, [role="progressbar"]'
    );

    // Loading should appear initially
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/dashboard/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');

    // Check for error message
    const errorMessage = page.locator(
      '[data-testid="error-message"], .error, text=feil, text=Error'
    );
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-friendly layout', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check that hamburger menu or mobile nav is visible
    const mobileNav = authenticatedPage.locator(
      '[data-testid="mobile-menu"], .hamburger-menu, button[aria-label*="menu"]'
    );

    // Dashboard should still be functional
    await expect(authenticatedPage.locator('h1, [data-testid="dashboard-title"]'))
      .toBeVisible({ timeout: 10000 });
  });
});
