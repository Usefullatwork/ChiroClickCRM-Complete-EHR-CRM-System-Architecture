/**
 * Setup Wizard E2E Tests
 * Tests the first-run setup wizard flow in a real browser
 *
 * Prerequisites: backend + frontend running, NODE_ENV !== 'production'
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';

test.describe.serial('Setup Wizard', () => {
  test.beforeAll(async ({ request }) => {
    // Reset setup status so the wizard appears
    const res = await request.post(`${API_BASE}/api/v1/auth/reset-setup`);
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    // Clean up: skip setup so other test suites aren't affected
    await request.post(`${API_BASE}/api/v1/auth/skip-setup`).catch(() => {});
  });

  test('wizard appears on fresh app load', async ({ page }) => {
    await page.goto('/');

    // Welcome step should be visible
    await expect(page.locator('text=ChiroClickCRM')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Velkommen til ditt nye journalsystem')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Neste' })).toBeVisible();
  });

  test('password rules are enforced on step 2', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Neste' })).toBeVisible({ timeout: 15000 });

    // Step 0 → Step 1
    await page.getByRole('button', { name: 'Neste' }).click();
    await expect(page.locator('text=Klinikkinformasjon')).toBeVisible();

    // Fill clinic name and advance
    await page.fill('input[placeholder="Min Kiropraktorklinikk"]', 'E2E Klinikk');
    await page.getByRole('button', { name: 'Neste' }).click();

    // Step 2: User account
    await expect(page.locator('text=Din brukerkonto')).toBeVisible();

    // Fill name and email
    await page.fill('input[placeholder="Ola Nordmann"]', 'E2E Tester');
    await page.fill('input[placeholder="ola@klinikken.no"]', 'e2e@test.com');

    // Type a password that's 8+ chars but missing uppercase and number
    await page.fill('input[placeholder="Minst 8 tegn"]', 'abcdefgh');
    await page.getByRole('button', { name: 'Neste' }).click();

    // Should show composite error about missing uppercase + number
    await expect(page.locator('text=/stor bokstav/')).toBeVisible();
    await expect(page.locator('text=/minst ett tall/')).toBeVisible();

    // Should still be on step 2
    await expect(page.locator('text=Din brukerkonto')).toBeVisible();
  });

  test('full flow completes and reaches dashboard', async ({ page }) => {
    // Reset again for a clean run
    const res = await page.request.post(`${API_BASE}/api/v1/auth/reset-setup`);
    expect(res.ok()).toBeTruthy();

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Neste' })).toBeVisible({ timeout: 15000 });

    // Step 0: Welcome → Next
    await page.getByRole('button', { name: 'Neste' }).click();

    // Step 1: Clinic info
    await page.fill('input[placeholder="Min Kiropraktorklinikk"]', 'E2E Test Klinikk');
    await page.fill('input[placeholder="Storgata 1, 0001 Oslo"]', 'E2E-gata 42');
    await page.getByRole('button', { name: 'Neste' }).click();

    // Step 2: User account
    await page.fill('input[placeholder="Ola Nordmann"]', 'E2E Bruker');
    await page.fill('input[placeholder="ola@klinikken.no"]', `e2e${Date.now()}@test.com`);
    await page.fill('input[placeholder="Minst 8 tegn"]', 'SecureE2E1!');
    await page.getByRole('button', { name: 'Neste' }).click();

    // Step 3: AI models → Next
    await expect(page.locator('text=AI-assistent')).toBeVisible();
    await page.getByRole('button', { name: 'Neste' }).click();

    // Step 4: Done
    await expect(page.locator('text=Alt klart!')).toBeVisible();
    await page.getByRole('button', { name: 'Start ChiroClickCRM' }).click();

    // Wizard should disappear and main app should load
    await expect(page.locator('text=Alt klart!')).not.toBeVisible({ timeout: 30000 });
    await page.waitForURL('**/', { timeout: 10000 });
  });

  test('skip flow bypasses wizard', async ({ request, page }) => {
    // Reset via APIRequestContext (bypasses page origin rate limits)
    const res = await request.post(`${API_BASE}/api/v1/auth/reset-setup`);
    if (!res.ok()) {
      // Rate-limited — wait and retry once
      await page.waitForTimeout(2000);
      const retry = await request.post(`${API_BASE}/api/v1/auth/reset-setup`);
      expect(retry.ok()).toBeTruthy();
    }

    await page.goto('/');
    await expect(page.locator('text=Velkommen til ditt nye journalsystem')).toBeVisible({
      timeout: 15000,
    });

    // Click skip button
    await page.getByRole('button', { name: 'Hopp over oppsett' }).click();

    // Wizard should disappear — either dashboard loads or login appears
    await expect(page.locator('text=Velkommen til ditt nye journalsystem')).not.toBeVisible({
      timeout: 15000,
    });
  });
});
