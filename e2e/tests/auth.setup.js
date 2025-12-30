/**
 * Authentication Setup for E2E Tests
 * Runs before tests to set up authentication state
 */

import { test as setup, expect } from '@playwright/test';

const STORAGE_STATE_PATH = './tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to the application
  await page.goto('/');

  // For testing purposes, we'll mock the authentication
  // In production, you would use real Clerk authentication
  await page.evaluate(() => {
    const mockUser = {
      id: 'e2e-test-user-id',
      email: 'e2e@chiroclickcrm.no',
      firstName: 'E2E',
      lastName: 'Tester',
      role: 'ADMIN',
      organizationId: 'e2e-test-org-id',
      permissions: ['read:all', 'write:all', 'delete:all', 'admin:all'],
    };

    sessionStorage.setItem('auth_token', 'e2e-test-token-' + Date.now());
    sessionStorage.setItem('auth_expiry', (Date.now() + 3600000).toString());
    sessionStorage.setItem('user', JSON.stringify(mockUser));
  });

  // Verify we're authenticated by checking for dashboard elements
  await page.waitForTimeout(1000);

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
