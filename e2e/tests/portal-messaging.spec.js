/**
 * Portal Messaging E2E Tests
 * Tests for patient portal inbox, compose, and staff-side message thread
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Portal Messages — Patient View', () => {
  test('should render messages inbox page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/messages');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // Verify page header renders (inbox view shows "Mine meldinger")
    const pageTitle = authenticatedPage
      .locator('h1')
      .filter({ hasText: /Mine meldinger|My Messages/i })
      .first();
    const emptyState = authenticatedPage
      .locator('text=/Ingen meldinger|No messages/i')
      .first();

    // At least the page title or empty state should be visible
    await expect(pageTitle.or(emptyState)).toBeVisible({ timeout: 10000 });

    // Verify "New message" button exists
    const newMessageButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Ny melding|New message/i })
      .first();
    await expect(newMessageButton).toBeVisible({ timeout: 5000 });
    await expect(newMessageButton).toBeEnabled();
  });

  test('should open compose view and display form fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/messages');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // Click "Ny melding" button to switch to compose view
    const newMessageButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Ny melding|New message/i })
      .first();
    await expect(newMessageButton).toBeVisible({ timeout: 5000 });

    await newMessageButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Verify compose form appears with subject and body inputs
    const subjectInput = authenticatedPage
      .locator('input[type="text"]')
      .first();
    const bodyTextarea = authenticatedPage
      .locator('textarea')
      .first();

    await expect(subjectInput).toBeVisible({ timeout: 5000 });
    await expect(bodyTextarea).toBeVisible({ timeout: 5000 });

    // Verify send button exists
    const sendButton = authenticatedPage
      .locator('button[type="submit"]')
      .first();
    await expect(sendButton).toBeVisible({ timeout: 3000 });
  });

  test('should enable send button when message body is filled', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/messages');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    const newMessageButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Ny melding|New message/i })
      .first();
    await expect(newMessageButton).toBeVisible({ timeout: 5000 });

    await newMessageButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Fill in the message body
    const bodyTextarea = authenticatedPage.locator('textarea').first();
    await expect(bodyTextarea).toBeVisible({ timeout: 5000 });

    await bodyTextarea.fill('Test melding fra E2E');
    await authenticatedPage.waitForTimeout(300);

    // Send button should now be enabled
    const sendButton = authenticatedPage
      .locator('button[type="submit"]')
      .first();
    await expect(sendButton).toBeVisible({ timeout: 3000 });
    await expect(sendButton).toBeEnabled();
  });
});

test.describe('Staff Messages — Patient Detail', () => {
  test('should display messages tab on patient detail page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });
    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    const hasPatients = await patientRow.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasPatients, 'No patients in seed data');

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

    // Look for a messages tab or section in patient detail
    const messagesTab = authenticatedPage
      .locator('button, [role="tab"]')
      .filter({ hasText: /Meldinger|Messages/i })
      .first();
    await expect(messagesTab).toBeVisible({ timeout: 5000 });

    await messagesTab.click();
    await authenticatedPage.waitForTimeout(1000);

    // After clicking messages tab, look for the message compose area or empty state
    const composeArea = authenticatedPage.locator('textarea').first();
    const emptyState = authenticatedPage
      .locator('text=/Ingen meldinger|No messages/i')
      .first();

    // Either the compose area or empty state should be visible
    await expect(composeArea.or(emptyState)).toBeVisible({ timeout: 5000 });
  });
});
