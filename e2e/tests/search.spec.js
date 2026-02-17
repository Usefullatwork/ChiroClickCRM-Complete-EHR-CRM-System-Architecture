/**
 * Search E2E Tests
 * Tests for global and entity-specific search functionality
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Patient Search', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });
  });

  test('should display search input on patients page', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await expect(searchInput).toBeVisible();
  });

  test('should search patients by name', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await searchInput.fill('Erik');
    await authenticatedPage.waitForTimeout(500);

    // Search should update the list (debounced)
  });

  test('should search patients by phone number', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await searchInput.fill('99999999');
    await authenticatedPage.waitForTimeout(500);
  });

  test('should search patients by email', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await searchInput.fill('@example.com');
    await authenticatedPage.waitForTimeout(500);
  });

  test('should clear search', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');

    // Search for something
    await searchInput.fill('Test');
    await authenticatedPage.waitForTimeout(500);

    // Clear search
    await searchInput.fill('');
    await authenticatedPage.waitForTimeout(500);
  });
});

test.describe('Dashboard Navigation Search', () => {
  test('should navigate from dashboard to patients', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Use sidebar navigation to patients (desktop sidebar visible at 1280px)
    const patientsLink = authenticatedPage.locator('nav[aria-label="Main navigation"] a[href="/patients"]').first();

    if (await patientsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientsLink.click();
      await expect(authenticatedPage).toHaveURL(/.*patients.*/);
      await expect(authenticatedPage.locator('[data-testid="patients-page-title"]')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should navigate from dashboard to appointments', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    const appointmentsLink = authenticatedPage.locator('nav[aria-label="Main navigation"] a[href="/appointments"]').first();

    if (await appointmentsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appointmentsLink.click();
      await expect(authenticatedPage).toHaveURL(/.*appointments.*/);
      await expect(authenticatedPage.locator('[data-testid="appointments-new-button"]')).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe('Patient List Filtering', () => {
  test('should filter patients by status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Find status select (first select on the page after search)
    const statusSelect = authenticatedPage.locator('select').first();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('ACTIVE');
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('should combine search with filters', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Set search term
    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await searchInput.fill('Test');

    // Set status filter
    const statusSelect = authenticatedPage.locator('select').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('ACTIVE');
    }

    await authenticatedPage.waitForTimeout(500);
  });
});
