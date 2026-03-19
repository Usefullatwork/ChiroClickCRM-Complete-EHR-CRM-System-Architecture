/**
 * Stress Navigation E2E Tests
 * Rapid clicks, fast navigation, modal cycling — verify no crashes
 */
import { test, expect } from './fixtures/auth.fixture.js';

const APP_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Stress Navigation', () => {
  test('should survive rapid sidebar link clicks', async ({ authenticatedPage: page }) => {
    const sidebarLinks = [
      '/dashboard',
      '/patients',
      '/appointments',
      '/encounters',
      '/financial',
    ];

    // Click through sidebar links rapidly (<200ms intervals)
    for (let round = 0; round < 3; round++) {
      for (const link of sidebarLinks) {
        await page.goto(`${APP_BASE}${link}`, { waitUntil: 'commit' });
        await page.waitForTimeout(100);
      }
    }

    // Verify the app is still responsive
    await page.goto(`${APP_BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should survive opening patient detail and immediately navigating away', async ({
    authenticatedPage: page,
  }) => {
    // Go to patients list
    await page.goto(`${APP_BASE}/patients`);
    await page.waitForLoadState('networkidle');

    // Try clicking a patient row and immediately navigating away
    const patientRows = page.locator('tr[data-patient-id], a[href*="/patients/"]');
    const count = await patientRows.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        await patientRows.nth(i).click();
        await page.waitForTimeout(50);
        await page.goto(`${APP_BASE}/patients`, { waitUntil: 'commit' });
        await page.waitForTimeout(50);
      }
    }

    // Verify app still works
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should survive rapid modal open/close cycling', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${APP_BASE}/patients`);
    await page.waitForLoadState('networkidle');

    // Look for any "add" or "new" button that opens a modal
    const addButton = page.locator(
      'button:has-text("Ny"), button:has-text("Legg til"), button:has-text("New"), button[aria-label*="add"]'
    );

    if ((await addButton.count()) > 0) {
      for (let i = 0; i < 5; i++) {
        await addButton.first().click();
        await page.waitForTimeout(100);

        // Close via Escape key
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
    }

    // Verify no crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not crash on rapid back/forward navigation', async ({
    authenticatedPage: page,
  }) => {
    // Navigate to several pages to build history
    const pages = ['/dashboard', '/patients', '/appointments', '/financial', '/dashboard'];
    for (const p of pages) {
      await page.goto(`${APP_BASE}${p}`, { waitUntil: 'commit' });
      await page.waitForTimeout(200);
    }

    // Rapid back/forward
    for (let i = 0; i < 5; i++) {
      await page.goBack();
      await page.waitForTimeout(100);
    }
    for (let i = 0; i < 5; i++) {
      await page.goForward();
      await page.waitForTimeout(100);
    }

    // Verify app still renders
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not crash on rapid tab/section switching', async ({
    authenticatedPage: page,
  }) => {
    // Navigate to a page with tabs (e.g., patient detail or encounters)
    await page.goto(`${APP_BASE}/encounters`);
    await page.waitForLoadState('networkidle');

    // Look for tab buttons
    const tabs = page.locator('[role="tab"], button[data-tab], .tab-button');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < tabCount; i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(50);
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });
});
