/**
 * Authentication Setup for E2E Tests
 * Runs before test suites to create an authenticated browser state
 */

import { test as setup, expect } from '@playwright/test';

const STORAGE_STATE_PATH = './tests/.auth/user.json';
const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';
const APP_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

setup('authenticate', async ({ page }) => {
  // Login via real backend API
  const response = await page.request.post(`${API_BASE}/api/v1/auth/login`, {
    data: {
      email: 'admin@chiroclickcrm.no',
      password: 'admin123',
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    console.error(`Login failed with status ${response.status()}: ${body}`);
  }
  expect(response.ok()).toBeTruthy();

  // Navigate to app so cookie is associated with the frontend origin
  await page.goto(APP_BASE);
  await page.waitForLoadState('networkidle');

  // Save storage state (cookies + localStorage) for reuse by other test projects
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
