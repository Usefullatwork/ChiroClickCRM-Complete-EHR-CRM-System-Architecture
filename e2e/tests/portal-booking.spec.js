/**
 * Portal Booking E2E Tests
 * Tests for patient portal appointment booking and staff booking request management
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Portal Booking — Patient View', () => {
  test('should render portal appointments page with request button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/appointments');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // Verify page header renders
    const pageTitle = authenticatedPage
      .locator('h1')
      .filter({ hasText: /Mine timer|My Appointments/i })
      .first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Verify "Request appointment" button exists
    const requestButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Be om time|Request/i })
      .first();
    await expect(requestButton).toBeVisible({ timeout: 5000 });
    await expect(requestButton).toBeEnabled();
  });

  test('should open booking request form and show date picker', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/appointments');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // Click request appointment button
    const requestButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Be om time|Request/i })
      .first();
    await expect(requestButton).toBeVisible({ timeout: 5000 });

    await requestButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Verify date input appears in the request form
    const dateInput = authenticatedPage.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5000 });

    // Verify the "select time" prompt appears before selecting a date
    const selectDateFirst = authenticatedPage
      .locator('text=/Velg dato først|Select date first/i')
      .first();
    await expect.soft(selectDateFirst).toBeVisible({ timeout: 3000 });
  });

  test('should select a date and show slot loading or available slots', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/appointments');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    const requestButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Be om time|Request/i })
      .first();
    await expect(requestButton).toBeVisible({ timeout: 5000 });

    await requestButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Fill in a future date
    const dateInput = authenticatedPage.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5000 });

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await dateInput.fill(tomorrow);
    await authenticatedPage.waitForTimeout(1000);

    // After selecting a date, expect either slot loading, available slots, or "no slots" message
    const loadingSlots = authenticatedPage
      .locator('text=/Laster ledige tider|Loading slots/i')
      .first();
    const noSlots = authenticatedPage
      .locator('text=/Ingen ledige tider|No available slots/i')
      .first();
    const slotButtons = authenticatedPage.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });

    // One of these outcomes should occur after setting a date
    const slotsCount = await slotButtons.count();
    if (slotsCount === 0) {
      // If no slot buttons, then loading or "no slots" message should be visible
      await expect(loadingSlots.or(noSlots)).toBeVisible({ timeout: 5000 });
    } else {
      await expect(slotButtons.first()).toBeVisible();
    }
  });

  test('should show submit button in booking form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/appointments');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    const requestButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Be om time|Request/i })
      .first();
    await expect(requestButton).toBeVisible({ timeout: 5000 });

    await requestButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Verify the submit/send request button exists
    const submitButton = authenticatedPage
      .locator('button[type="submit"]')
      .filter({ hasText: /Send forespørsel|Send request/i })
      .first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Verify reason textarea exists
    const reasonInput = authenticatedPage.locator('textarea').first();
    await expect(reasonInput).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Staff Booking Requests View', () => {
  test('should display booking requests component on appointments page', async ({ authenticatedPage }) => {
    // BookingRequests is rendered within the staff appointments or portal admin area
    await authenticatedPage.goto('/appointments');
    await authenticatedPage.waitForSelector('[data-testid="appointments-new-button"]', { timeout: 15000 });

    // Look for booking requests tab or filter (PENDING/Ventende)
    const pendingFilter = authenticatedPage
      .locator('button')
      .filter({ hasText: /Ventende|Pending/i })
      .first();

    await expect.soft(pendingFilter).toBeVisible({ timeout: 5000 });
  });
});
