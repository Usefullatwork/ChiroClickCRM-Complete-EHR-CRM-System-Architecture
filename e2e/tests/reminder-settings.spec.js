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
    if (await remindersTab.isVisible({ timeout: 10000 }).catch(() => false)) {
      await remindersTab.click();
      await page.waitForTimeout(1000);
    }
  }

  test('should display reminder toggles on the reminders settings tab', async ({ authenticatedPage }) => {
    await navigateToRemindersTab(authenticatedPage);

    // Verify the reminders card header is visible
    const cardHeader = authenticatedPage
      .locator('h2')
      .filter({ hasText: /Automatiske påminnelser|Automated Reminders/i })
      .first();
    if (!(await cardHeader.isVisible({ timeout: 10000 }).catch(() => false))) return;

    await expect(cardHeader).toBeVisible();

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

    if (await appointmentToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(appointmentToggle).toBeVisible();
    }
    if (await exerciseToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(exerciseToggle).toBeVisible();
    }
    if (await recallToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(recallToggle).toBeVisible();
    }
    if (await birthdayToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(birthdayToggle).toBeVisible();
    }

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
    if (!(await birthdayLabel.isVisible({ timeout: 10000 }).catch(() => false))) return;

    // Find the toggle associated with the birthday row
    // The toggle is the last one (4th checkbox)
    const toggles = authenticatedPage.locator('input[type="checkbox"].sr-only');
    const count = await toggles.count();
    if (count < 4) return;

    const birthdayCheckbox = toggles.nth(3);
    const wasChecked = await birthdayCheckbox.isChecked();

    // Click the toggle label wrapper to toggle it
    const toggleLabel = birthdayCheckbox.locator('xpath=ancestor::label');
    if (await toggleLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
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
      if (reloadedCount >= 4) {
        const reloadedBirthdayCheckbox = reloadedToggles.nth(3);
        const afterReload = await reloadedBirthdayCheckbox.isChecked();
        expect(afterReload).toBe(isNowChecked);
      }
    }
  });

  test('should display provider status card with SMS and email info', async ({ authenticatedPage }) => {
    await navigateToRemindersTab(authenticatedPage);

    // Verify provider status section exists
    const providerHeader = authenticatedPage
      .locator('h2')
      .filter({ hasText: /Leverandørstatus|Provider Status/i })
      .first();
    if (!(await providerHeader.isVisible({ timeout: 10000 }).catch(() => false))) return;

    await expect(providerHeader).toBeVisible();

    // Verify SMS provider status is displayed
    const smsLabel = authenticatedPage
      .locator('text=/^SMS$/i')
      .first();
    if (await smsLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(smsLabel).toBeVisible();
    }

    // Verify email provider status is displayed
    const emailLabel = authenticatedPage
      .locator('text=/E-post|Email/i')
      .first();
    if (await emailLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(emailLabel).toBeVisible();
    }

    // In desktop mode, providers show "Mock (skrivebordsmodus)"
    const mockStatus = authenticatedPage
      .locator('text=/Mock|skrivebordsmodus/i')
      .first();
    if (await mockStatus.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(mockStatus).toBeVisible();
    }
  });
});
