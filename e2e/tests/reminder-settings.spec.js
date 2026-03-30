/**
 * Automated Reminders Settings E2E Tests
 * Tests for the reminder toggles, persistence, and provider status display
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Automated Reminders Settings', () => {
  /**
   * Navigate to Settings page and click the "Automatiske paminnelser" tab
   */
  async function navigateToRemindersTab(page) {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click the reminders tab
    const remindersTab = page
      .locator('button')
      .filter({ hasText: /Automatiske påminnelser|Automated Reminders/i })
      .first();
    await expect(remindersTab).toBeVisible({ timeout: 10000 });
    await remindersTab.click();
    await page.waitForTimeout(1000);
  }

  test('should display reminder toggles on the reminders settings tab', async ({ authenticatedPage }) => {
    await navigateToRemindersTab(authenticatedPage);

    // Verify the reminders card header is visible
    const cardHeader = authenticatedPage
      .locator('h2')
      .filter({ hasText: /Automatiske påminnelser|Automated Reminders/i })
      .first();
    await expect(cardHeader).toBeVisible({ timeout: 10000 });

    // Verify all four toggle labels are rendered
    const appointmentToggle = authenticatedPage
      .locator('text=/Timepåminnelser|Appointment reminders/i')
      .first();
    const exerciseToggle = authenticatedPage
      .locator('text=/Øvelsespåminnelser|Exercise reminders/i')
      .first();
    const recallToggle = authenticatedPage
      .locator('text=/Recall-bestillingslenke|Recall booking/i')
      .first();
    const birthdayToggle = authenticatedPage
      .locator('text=/Bursdagshilsen|Birthday/i')
      .first();

    await expect(appointmentToggle).toBeVisible({ timeout: 5000 });
    await expect(exerciseToggle).toBeVisible({ timeout: 5000 });
    await expect(recallToggle).toBeVisible({ timeout: 5000 });
    await expect(birthdayToggle).toBeVisible({ timeout: 5000 });

    // Verify there are 4 checkbox toggles in the reminders section
    const toggleCheckboxes = authenticatedPage.locator('input[type="checkbox"].sr-only');
    const count = await toggleCheckboxes.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should toggle a reminder and verify state change persists after reload', async ({ authenticatedPage }) => {
    await navigateToRemindersTab(authenticatedPage);

    // Find the birthday toggle (defaults to OFF, safest to toggle)
    const birthdayLabel = authenticatedPage
      .locator('text=/Bursdagshilsen|Birthday/i')
      .first();
    await expect(birthdayLabel).toBeVisible({ timeout: 10000 });

    // Find the toggle associated with the birthday row
    // The toggle is the last one (4th checkbox)
    const toggles = authenticatedPage.locator('input[type="checkbox"].sr-only');
    const count = await toggles.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const birthdayCheckbox = toggles.nth(3);
    const wasChecked = await birthdayCheckbox.isChecked();

    // Click the toggle label wrapper to toggle it
    const toggleLabel = birthdayCheckbox.locator('xpath=ancestor::label');
    await expect(toggleLabel).toBeVisible({ timeout: 3000 });
    await toggleLabel.click();
    await authenticatedPage.waitForTimeout(1500); // Wait for mutation to complete

    // Verify the checkbox state changed
    const isNowChecked = await birthdayCheckbox.isChecked();
    expect(isNowChecked).not.toBe(wasChecked);

    // Reload and re-navigate to verify persistence
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    await navigateToRemindersTab(authenticatedPage);

    // Re-find the toggles after reload
    const reloadedToggles = authenticatedPage.locator('input[type="checkbox"].sr-only');
    const reloadedCount = await reloadedToggles.count();
    expect(reloadedCount).toBeGreaterThanOrEqual(4);

    const reloadedBirthdayCheckbox = reloadedToggles.nth(3);
    const afterReload = await reloadedBirthdayCheckbox.isChecked();
    expect(afterReload).toBe(isNowChecked);
  });

  test('should display provider status card with SMS and email info', async ({ authenticatedPage }) => {
    await navigateToRemindersTab(authenticatedPage);

    // Verify provider status section exists
    const providerHeader = authenticatedPage
      .locator('h2')
      .filter({ hasText: /Leverandørstatus|Provider Status/i })
      .first();
    await expect(providerHeader).toBeVisible({ timeout: 10000 });

    // Verify SMS provider status is displayed
    const smsLabel = authenticatedPage
      .locator('text=/^SMS$/i')
      .first();
    await expect(smsLabel).toBeVisible({ timeout: 5000 });

    // Verify email provider status is displayed
    const emailLabel = authenticatedPage
      .locator('text=/E-post|Email/i')
      .first();
    await expect(emailLabel).toBeVisible({ timeout: 5000 });

    // In desktop mode, providers show "Mock (skrivebordsmodus)"
    const mockStatus = authenticatedPage
      .locator('text=/Mock|skrivebordsmodus/i')
      .first();
    await expect(mockStatus).toBeVisible({ timeout: 5000 });
  });
});
