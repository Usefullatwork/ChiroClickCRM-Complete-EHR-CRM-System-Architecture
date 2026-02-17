/**
 * Authentication Fixtures for E2E Tests
 * Provides authenticated user contexts via real backend login
 */

import { test as base, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';
const APP_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

/**
 * Perform real login via backend API and set the session cookie
 * on the page's browser context.
 */
async function loginViaAPI(page, email, password) {
  // POST to real backend login endpoint
  const response = await page.request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status()}): ${body}`);
  }

  const data = await response.json();

  // The backend sets an httpOnly 'session' cookie in the response.
  // Playwright's page.request automatically handles cookies for the context.
  // Navigate to the app so the cookie is sent on subsequent requests.
  await page.goto(APP_BASE);

  // Wait for the app to recognize auth and render the dashboard
  await page.waitForLoadState('networkidle');

  return data;
}

// Extend base test with authentication fixtures
// NOTE: The 'setup' project (auth.setup.js) already logs in and saves
// cookies to storageState. The chromium project loads that storageState,
// so each test context already has valid session cookies. These fixtures
// just navigate to the app — no need to re-login (avoids rate limiting).
export const test = base.extend({
  // Authenticated page context (admin user) — uses storageState cookies
  authenticatedPage: async ({ page }, use) => {
    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  // Admin user context — uses storageState cookies
  adminPage: async ({ page }, use) => {
    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  // Practitioner user context — needs separate login (different user)
  practitionerPage: async ({ page }, use) => {
    await loginViaAPI(page, 'kiropraktor@chiroclickcrm.no', 'admin123');
    await use(page);
  },
});

export { expect };

/**
 * Test data factory for creating test patients
 */
export const createTestPatient = () => ({
  firstName: `Test${Date.now()}`,
  lastName: 'Patient',
  email: `test.patient.${Date.now()}@example.com`,
  phone: '+47 99 99 99 99',
  dateOfBirth: '1990-01-15',
  address: {
    street: 'Testgata 123',
    city: 'Oslo',
    postalCode: '0150',
  },
  status: 'ACTIVE',
});

/**
 * Test data factory for creating test appointments
 */
export const createTestAppointment = (patientId) => ({
  patientId,
  date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
  time: '10:00',
  duration: 30,
  type: 'CONSULTATION',
  notes: 'E2E Test Appointment',
});

/**
 * Test data factory for creating SOAP notes
 */
export const createTestEncounter = (patientId) => ({
  patientId,
  encounterType: 'CONSULTATION',
  subjective: 'Patient reports lower back pain for 2 weeks.',
  objective: 'Range of motion limited. Tenderness at L4-L5.',
  assessment: 'Lumbar strain suspected.',
  plan: 'Spinal manipulation, stretching exercises, follow-up in 1 week.',
  icpcCodes: ['L03'],
});
