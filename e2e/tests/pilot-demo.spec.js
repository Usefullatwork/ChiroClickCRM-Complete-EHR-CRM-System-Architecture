/**
 * Pilot Demo E2E Tests
 * 5 critical flows that must work for chiropractor demos.
 * Assumes demo-patients.sql has been seeded (50 patients in the demo org).
 */

import { test, expect } from './fixtures/auth.fixture.js';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// 1. Login → Dashboard loads with stats
// ---------------------------------------------------------------------------
test.describe('Demo Flow 1: Dashboard', () => {
  test('should show dashboard with patient stats after login', async ({ authenticatedPage: page }) => {
    // Dashboard should show stat cards
    const statsSection = page.locator('[data-testid="stat-cards"], .stat-card, .dashboard-stats').first();
    await expect(statsSection).toBeVisible({ timeout: 15000 });

    // Should show at least one stat value (patient count, appointments, etc.)
    const statValues = page.locator('.stat-value, [data-testid="stat-value"], .stat-card h3, .stat-card .value');
    await expect(statValues.first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Navigate to patients → list renders with searchable names
// ---------------------------------------------------------------------------
test.describe('Demo Flow 2: Patient List', () => {
  test('should display patient list and support search', async ({ authenticatedPage: page }) => {
    // Navigate to patients
    await page.click('a[href*="patient"], [data-testid="nav-patients"], nav >> text=Pasienter');
    await page.waitForLoadState('networkidle');

    // Patient list should render
    const patientList = page.locator(
      'table tbody tr, [data-testid="patient-row"], .patient-list-item, .patient-card'
    );
    await expect(patientList.first()).toBeVisible({ timeout: 10000 });

    // Search for a known demo patient name
    const searchInput = page.locator(
      'input[placeholder*="søk" i], input[placeholder*="search" i], input[type="search"], [data-testid="patient-search"]'
    );
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Nilsen');
    await page.waitForTimeout(500); // debounce
    // At least one Nilsen should appear (Bente Nilsen from demo data)
    const results = page.locator('table tbody tr, .patient-list-item, .patient-card');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Open a patient detail → tabs load (contact, clinical, visits)
// ---------------------------------------------------------------------------
test.describe('Demo Flow 3: Patient Detail', () => {
  test('should open patient detail with info tabs', async ({ authenticatedPage: page }) => {
    // Navigate to patients
    await page.click('a[href*="patient"], [data-testid="nav-patients"], nav >> text=Pasienter');
    await page.waitForLoadState('networkidle');

    // Click first patient row
    const firstPatient = page.locator(
      'table tbody tr, [data-testid="patient-row"], .patient-list-item'
    ).first();
    await expect(firstPatient).toBeVisible({ timeout: 10000 });
    await firstPatient.click();
    await page.waitForLoadState('networkidle');

    // Patient detail should show name
    const patientName = page.locator(
      'h1, h2, [data-testid="patient-name"], .patient-header .name'
    ).first();
    await expect(patientName).toBeVisible({ timeout: 5000 });

    // Tab navigation should exist (contact info, clinical, visits)
    const tabs = page.locator(
      '[role="tablist"], .tab-navigation, .patient-tabs'
    );
    await expect(tabs).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 4. Create a new SOAP encounter (navigate to new encounter form)
// ---------------------------------------------------------------------------
test.describe('Demo Flow 4: New Encounter', () => {
  test('should navigate to encounter creation form', async ({ authenticatedPage: page }) => {
    // Navigate to patients
    await page.click('a[href*="patient"], [data-testid="nav-patients"], nav >> text=Pasienter');
    await page.waitForLoadState('networkidle');

    // Click first patient
    const firstPatient = page.locator(
      'table tbody tr, [data-testid="patient-row"], .patient-list-item'
    ).first();
    await expect(firstPatient).toBeVisible({ timeout: 10000 });
    await firstPatient.click();
    await page.waitForLoadState('networkidle');

    // Find and click "New encounter" or "Ny konsultasjon" button
    const newEncounterBtn = page.locator(
      'button:has-text("Ny konsultasjon"), button:has-text("New encounter"), button:has-text("SOAP"), [data-testid="new-encounter"]'
    );
    await expect(newEncounterBtn).toBeVisible({ timeout: 5000 });
    await newEncounterBtn.click();
    await page.waitForLoadState('networkidle');

    // SOAP form fields should appear
    const soapSection = page.locator(
      'textarea, [data-testid="soap-subjective"], .soap-form, .encounter-form'
    ).first();
    await expect(soapSection).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 5. Appointment calendar renders with scheduled appointments
// ---------------------------------------------------------------------------
test.describe('Demo Flow 5: Appointments', () => {
  test('should display appointment schedule view', async ({ authenticatedPage: page }) => {
    // Navigate to appointments/calendar
    await page.click(
      'a[href*="appointment"], a[href*="calendar"], [data-testid="nav-appointments"], nav >> text=Timebestilling'
    );
    await page.waitForLoadState('networkidle');

    // Calendar or appointment list should render
    const scheduleView = page.locator(
      '.calendar, .schedule, [data-testid="appointment-list"], .appointment-card, .fc-view, table'
    ).first();
    await expect(scheduleView).toBeVisible({ timeout: 10000 });

    // Should have a "New appointment" or "Ny time" action
    const newApptBtn = page.locator(
      'button:has-text("Ny time"), button:has-text("New appointment"), button:has-text("Bestill"), [data-testid="new-appointment"]'
    );
    await expect(newApptBtn).toBeVisible({ timeout: 5000 });
  });
});
