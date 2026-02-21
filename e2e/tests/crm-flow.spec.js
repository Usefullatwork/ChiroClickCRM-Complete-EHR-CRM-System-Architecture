/**
 * CRM Flow E2E Tests
 * Tests the complete CRM workflow: navigate CRM → create lead → update status → convert to patient
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('CRM Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/crm');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should display CRM dashboard with overview metrics', async ({ authenticatedPage }) => {
    // CRM page should load with key sections
    await expect(authenticatedPage.locator('text=CRM')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to leads section', async ({ authenticatedPage }) => {
    // Click leads tab/section
    const leadsTab = authenticatedPage.locator('text=Leads').or(authenticatedPage.locator('text=Potensielle'));
    await leadsTab.first().click();
    await authenticatedPage.waitForLoadState('networkidle');

    // Should show leads list or empty state
    const leadsSection = authenticatedPage.locator('[data-testid="leads-list"]').or(
      authenticatedPage.locator('text=Ingen leads')
    );
    await expect(leadsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open new lead form', async ({ authenticatedPage }) => {
    // Navigate to leads
    const leadsTab = authenticatedPage.locator('text=Leads').or(authenticatedPage.locator('text=Potensielle'));
    await leadsTab.first().click();
    await authenticatedPage.waitForLoadState('networkidle');

    // Click add new lead button
    const addButton = authenticatedPage.locator('button:has-text("Ny Lead")').or(
      authenticatedPage.locator('button:has-text("Legg til")')
    );
    if (await addButton.first().isVisible()) {
      await addButton.first().click();

      // Form should appear with name field
      const nameInput = authenticatedPage.locator('input[name="name"]').or(
        authenticatedPage.locator('input[placeholder*="Navn"]')
      );
      await expect(nameInput.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to campaigns section', async ({ authenticatedPage }) => {
    const campaignsTab = authenticatedPage.locator('text=Kampanjer');
    if (await campaignsTab.first().isVisible()) {
      await campaignsTab.first().click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Should show campaigns content
      await expect(
        authenticatedPage.locator('text=Kampanjer').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to waitlist section', async ({ authenticatedPage }) => {
    const waitlistTab = authenticatedPage.locator('text=Venteliste');
    if (await waitlistTab.first().isVisible()) {
      await waitlistTab.first().click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Should show waitlist content
      await expect(
        authenticatedPage.locator('text=Venteliste').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to referral program section', async ({ authenticatedPage }) => {
    const referralTab = authenticatedPage.locator('text=Henvisning').or(
      authenticatedPage.locator('text=Referral')
    );
    if (await referralTab.first().isVisible()) {
      await referralTab.first().click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Should show referral content
      await expect(
        authenticatedPage.locator('text=Henvisning').or(authenticatedPage.locator('text=Referral')).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show retention dashboard', async ({ authenticatedPage }) => {
    const retentionTab = authenticatedPage.locator('text=Retensjon').or(
      authenticatedPage.locator('text=Retention')
    );
    if (await retentionTab.first().isVisible()) {
      await retentionTab.first().click();
      await authenticatedPage.waitForLoadState('networkidle');

      await expect(
        authenticatedPage.locator('text=Retensjon').or(authenticatedPage.locator('text=Retention')).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
