/**
 * Authentication Fixtures for E2E Tests
 * Provides authenticated user contexts
 */

import { test as base, expect } from '@playwright/test';

// Extend base test with authentication fixtures
export const test = base.extend({
  // Authenticated page context
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Check if already authenticated (session cookie)
    const isAuthenticated = await page.evaluate(() => {
      return !!sessionStorage.getItem('auth_token');
    }).catch(() => false);

    if (!isAuthenticated) {
      // Mock authentication for testing
      await page.evaluate(() => {
        // Set mock auth token
        sessionStorage.setItem('auth_token', 'test-token-' + Date.now());
        sessionStorage.setItem('auth_expiry', (Date.now() + 3600000).toString());
        sessionStorage.setItem('user', JSON.stringify({
          id: 'test-user-id',
          email: 'test@chiroclickcrm.no',
          firstName: 'Test',
          lastName: 'User',
          role: 'ADMIN',
          organizationId: 'test-org-id',
        }));
      });
    }

    // Wait for auth to be recognized
    await page.waitForTimeout(500);

    await use(page);
  },

  // Admin user context
  adminPage: async ({ page }, use) => {
    await page.goto('/');

    await page.evaluate(() => {
      sessionStorage.setItem('auth_token', 'admin-test-token-' + Date.now());
      sessionStorage.setItem('auth_expiry', (Date.now() + 3600000).toString());
      sessionStorage.setItem('user', JSON.stringify({
        id: 'admin-user-id',
        email: 'admin@chiroclickcrm.no',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: 'test-org-id',
        permissions: ['read:all', 'write:all', 'delete:all', 'admin:all'],
      }));
    });

    await page.waitForTimeout(500);
    await use(page);
  },

  // Practitioner user context
  practitionerPage: async ({ page }, use) => {
    await page.goto('/');

    await page.evaluate(() => {
      sessionStorage.setItem('auth_token', 'practitioner-test-token-' + Date.now());
      sessionStorage.setItem('auth_expiry', (Date.now() + 3600000).toString());
      sessionStorage.setItem('user', JSON.stringify({
        id: 'practitioner-user-id',
        email: 'practitioner@chiroclickcrm.no',
        firstName: 'Dr.',
        lastName: 'Practitioner',
        role: 'PRACTITIONER',
        organizationId: 'test-org-id',
        permissions: ['read:patients', 'write:encounters', 'read:appointments'],
      }));
    });

    await page.waitForTimeout(500);
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
