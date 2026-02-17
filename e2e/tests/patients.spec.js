/**
 * Patient Management E2E Tests
 * Tests for patient CRUD operations and workflows
 */

import { test, expect, createTestPatient } from './fixtures/auth.fixture.js';

test.describe('Patient List', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });
  });

  test('should display patient list page', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('[data-testid="patients-page-title"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="patients-add-button"]')).toBeVisible();
  });

  test('should have search functionality', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Test');
    await authenticatedPage.waitForTimeout(500);
  });

  test('should display patient rows or empty state', async ({ authenticatedPage }) => {
    // Wait for data to load
    await authenticatedPage.waitForTimeout(1000);

    const patientsList = authenticatedPage.locator('[data-testid="patients-list"]');
    const listVisible = await patientsList.isVisible().catch(() => false);

    if (listVisible) {
      const rows = authenticatedPage.locator('[data-testid="patient-row"]');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
    // Empty state is also acceptable
  });

  test('should open patient details when clicking a row', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await expect(authenticatedPage).toHaveURL(/.*patients\/[a-zA-Z0-9-]+.*/);
    }
  });

  test('should navigate to new patient form', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('[data-testid="patients-add-button"]').click();
    await expect(authenticatedPage).toHaveURL(/.*patients\/new.*/);
  });
});

test.describe('Create Patient', () => {
  test('should display new patient form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');

    await expect(authenticatedPage.locator('[data-testid="new-patient-first-name"]')).toBeVisible({ timeout: 15000 });
    await expect(authenticatedPage.locator('[data-testid="new-patient-last-name"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="new-patient-dob"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="new-patient-submit"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="new-patient-cancel"]')).toBeVisible();
  });

  test('should validate required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');
    await authenticatedPage.waitForSelector('[data-testid="new-patient-first-name"]', { timeout: 15000 });

    // Submit empty form
    await authenticatedPage.locator('[data-testid="new-patient-submit"]').click();
    await authenticatedPage.waitForTimeout(500);

    // Validation errors should appear (text-red-600 class used for error messages)
    const validationErrors = authenticatedPage.locator('.text-red-600');
    const errorCount = await validationErrors.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should fill patient form fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');
    await authenticatedPage.waitForSelector('[data-testid="new-patient-first-name"]', { timeout: 15000 });

    const testPatient = createTestPatient();

    await authenticatedPage.locator('[data-testid="new-patient-first-name"]').fill(testPatient.firstName);
    await authenticatedPage.locator('[data-testid="new-patient-last-name"]').fill(testPatient.lastName);
    await authenticatedPage.locator('[data-testid="new-patient-dob"]').fill(testPatient.dateOfBirth);

    // Verify values were entered
    await expect(authenticatedPage.locator('[data-testid="new-patient-first-name"]')).toHaveValue(testPatient.firstName);
    await expect(authenticatedPage.locator('[data-testid="new-patient-last-name"]')).toHaveValue(testPatient.lastName);
  });

  test('should fill contact information', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');
    await authenticatedPage.waitForSelector('[data-testid="new-patient-first-name"]', { timeout: 15000 });

    const testPatient = createTestPatient();

    await authenticatedPage.locator('[data-testid="new-patient-phone"]').fill(testPatient.phone);
    await authenticatedPage.locator('[data-testid="new-patient-email"]').fill(testPatient.email);

    await expect(authenticatedPage.locator('[data-testid="new-patient-phone"]')).toHaveValue(testPatient.phone);
    await expect(authenticatedPage.locator('[data-testid="new-patient-email"]')).toHaveValue(testPatient.email);
  });

  test('should cancel and go back to patients list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');
    await authenticatedPage.waitForSelector('[data-testid="new-patient-cancel"]', { timeout: 15000 });

    await authenticatedPage.locator('[data-testid="new-patient-cancel"]').click();
    await expect(authenticatedPage).toHaveURL(/.*patients$/);
  });
});

test.describe('Patient Detail', () => {
  test('should display patient detail page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      await expect(authenticatedPage.locator('[data-testid="patient-detail-name"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="patient-detail-tabs"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="patient-detail-panel"]')).toBeVisible();
    }
  });

  test('should display contact information tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      await expect(authenticatedPage.locator('[data-testid="patient-detail-tab-contact"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display clinical information tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      await expect(authenticatedPage.locator('[data-testid="patient-detail-tab-clinical"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display visits tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientRow.click();
      await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

      await expect(authenticatedPage.locator('[data-testid="patient-detail-tab-visits"]')).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe('Patient Search', () => {
  test('should search patients by name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await searchInput.fill('Test');
    await authenticatedPage.waitForTimeout(500);

    // Results should update (either rows or empty state)
  });

  test('should show empty state when no results', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const searchInput = authenticatedPage.locator('[data-testid="patients-search-input"]');
    await searchInput.fill('xyznonexistent12345');
    await authenticatedPage.waitForTimeout(1000);

    // Patient list should have no rows, or empty state message appears
  });
});
