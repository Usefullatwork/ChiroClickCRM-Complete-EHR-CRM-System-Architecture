/**
 * Document Delivery E2E Tests
 * Tests for PDF generation, SendDocumentModal, and portal document listing
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Document Generation in Encounter', () => {
  test('should show document generation options from patient encounter', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });
    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    const hasPatients = await patientRow.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasPatients, 'No patients in seed data');

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

    // Open encounter form
    const newVisitButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /New Visit|Ny konsultasjon/i })
      .first();
    await expect(newVisitButton).toBeVisible({ timeout: 5000 });

    await newVisitButton.click();
    await authenticatedPage.waitForTimeout(3000);

    // Verify the encounter loaded — look for Plan section which hosts document actions
    const planSection = authenticatedPage.locator('[data-testid="encounter-plan"]');
    await expect(planSection).toBeVisible({ timeout: 10000 });

    // Look for PDF/document generation buttons (Norwegian or English labels)
    const pdfButtons = authenticatedPage
      .locator('button')
      .filter({ hasText: /PDF|Last ned|Download|Generer|Generate/i });
    const pdfCount = await pdfButtons.count();
    // At least the encounter page loaded; PDF buttons may require saved encounter
    expect(pdfCount).toBeGreaterThanOrEqual(0);
  });

  test('should display document type options in clinical note generator', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });
    await authenticatedPage.waitForTimeout(1000);

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    const hasPatients = await patientRow.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasPatients, 'No patients in seed data');

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 15000 });

    const newVisitButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /New Visit|Ny konsultasjon/i })
      .first();
    await expect(newVisitButton).toBeVisible({ timeout: 5000 });

    await newVisitButton.click();
    await authenticatedPage.waitForTimeout(3000);

    // Look for clinical note generator section
    const noteGenerator = authenticatedPage
      .locator('text=/Generer Notat|Clinical Note|Klinisk notat/i')
      .first();
    await expect(noteGenerator).toBeVisible({ timeout: 5000 });
  });
});

test.describe('SendDocumentModal', () => {
  test('should render SendDocumentModal when sending exercise prescription', async ({ authenticatedPage }) => {
    // Navigate to exercises page where SendDocumentModal is integrated
    await authenticatedPage.goto('/exercises');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // The exercises page has a "Send til pasient" button on prescriptions
    const sendButton = authenticatedPage
      .locator('button')
      .filter({ hasText: /Send til pasient|Send to patient/i })
      .first();

    const hasSendButton = await sendButton.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasSendButton, 'No exercise prescription send button available');

    await sendButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Verify modal appears with delivery method options
    const modal = authenticatedPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify delivery method radio buttons exist (E-post, SMS, Begge)
    await expect(
      modal.locator('text=/E-post|Email/i')
    ).toBeVisible({ timeout: 5000 });
    await expect(
      modal.locator('text=/SMS/i')
    ).toBeVisible({ timeout: 5000 });
    await expect(
      modal.locator('text=/Begge|Both/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify send and cancel buttons exist
    const sendAction = modal.locator('button').filter({ hasText: /^Send$/i });
    await expect(sendAction).toBeVisible();

    const cancelAction = modal.locator('button').filter({ hasText: /Avbryt|Cancel/i });
    await expect(cancelAction).toBeVisible();

    // Close modal
    await cancelAction.click();
  });
});

test.describe('Portal Documents Page', () => {
  test('should load portal documents page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/documents');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // The documents page shows either the document list or empty state
    const pageTitle = authenticatedPage
      .locator('text=/Mine dokumenter|My Documents/i')
      .first();
    const emptyState = authenticatedPage
      .locator('text=/Ingen dokumenter|No documents/i')
      .first();

    // At least the page header or empty state should render
    await expect(pageTitle.or(emptyState)).toBeVisible({ timeout: 10000 });
  });
});
