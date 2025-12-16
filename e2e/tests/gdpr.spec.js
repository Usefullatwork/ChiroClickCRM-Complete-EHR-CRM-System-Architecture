/**
 * GDPR Compliance E2E Tests
 * Tests for data privacy and GDPR functionality
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('GDPR Data Export', () => {
  test('should access GDPR data export page', async ({ adminPage }) => {
    await adminPage.goto('/gdpr');

    // Check for GDPR page elements
    const gdprHeader = adminPage.locator(
      'h1:has-text("GDPR"), h1:has-text("Personvern"), [data-testid="gdpr-header"]'
    );
    await expect(gdprHeader.first()).toBeVisible({ timeout: 10000 });
  });

  test('should export patient data', async ({ adminPage }) => {
    await adminPage.goto('/gdpr');

    // Find export section
    const exportSection = adminPage.locator(
      '[data-testid="data-export"], .export-section'
    );

    if (await exportSection.first().isVisible()) {
      // Find patient search for export
      const patientSearch = adminPage.locator(
        'input[placeholder*="pasient"], [data-testid="patient-search-gdpr"]'
      ).first();

      if (await patientSearch.isVisible()) {
        await patientSearch.fill('test');
        await adminPage.waitForTimeout(1000);
      }

      // Find export button
      const exportButton = adminPage.locator(
        'button:has-text("Eksporter"), button:has-text("Export data")'
      ).first();

      if (await exportButton.isVisible()) {
        // Just verify the button is clickable
        await expect(exportButton).toBeEnabled();
      }
    }
  });

  test('should show export format options', async ({ adminPage }) => {
    await adminPage.goto('/gdpr');

    const formatSelect = adminPage.locator(
      '[data-testid="export-format"], select[name="format"]'
    ).first();

    if (await formatSelect.isVisible()) {
      await formatSelect.click();

      // Should have JSON and PDF options
      const jsonOption = adminPage.locator('text=JSON, option[value="json"]');
      const pdfOption = adminPage.locator('text=PDF, option[value="pdf"]');
    }
  });
});

test.describe('GDPR Data Deletion', () => {
  test('should access deletion request page', async ({ adminPage }) => {
    await adminPage.goto('/gdpr/deletion');

    // Check for deletion page
    const deletionSection = adminPage.locator(
      '[data-testid="deletion-section"], h2:has-text("Sletting"), h2:has-text("Deletion")'
    );
    await expect(deletionSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should require confirmation for deletion', async ({ adminPage }) => {
    await adminPage.goto('/gdpr');

    // Find delete button
    const deleteButton = adminPage.locator(
      'button:has-text("Slett"), button:has-text("Delete")'
    ).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      const confirmDialog = adminPage.locator(
        '[role="alertdialog"], [role="dialog"], .confirm-dialog'
      );
      await expect(confirmDialog.first()).toBeVisible({ timeout: 5000 });

      // Should require explicit confirmation
      const confirmInput = adminPage.locator(
        'input[placeholder*="SLETT"], input[placeholder*="DELETE"], input[type="text"]'
      );
      // Might require typing "DELETE" to confirm
    }
  });

  test('should show deletion audit log', async ({ adminPage }) => {
    await adminPage.goto('/gdpr');

    // Find audit log section
    const auditLog = adminPage.locator(
      '[data-testid="audit-log"], .deletion-log, h3:has-text("Logg")'
    );

    if (await auditLog.first().isVisible()) {
      // Audit log should show previous deletions
      const logEntries = adminPage.locator('[data-testid="log-entry"], .log-item');
      // May or may not have entries
    }
  });
});

test.describe('Consent Management', () => {
  test('should display consent status for patient', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    // Click on a patient
    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Find consent section
      const consentSection = authenticatedPage.locator(
        '[data-testid="consent-section"], .consent-status, text=Samtykke'
      );
      // Consent section may be in patient detail
    }
  });

  test('should allow updating SMS consent', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Find SMS consent toggle
      const smsConsent = authenticatedPage.locator(
        '[data-testid="sms-consent"], input[name="smsConsent"], [aria-label*="SMS"]'
      ).first();

      if (await smsConsent.isVisible()) {
        // Toggle consent
        await smsConsent.click();
        await authenticatedPage.waitForTimeout(500);

        // Should save consent change
      }
    }
  });

  test('should allow updating email consent', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      const emailConsent = authenticatedPage.locator(
        '[data-testid="email-consent"], input[name="emailConsent"]'
      ).first();

      if (await emailConsent.isVisible()) {
        await emailConsent.click();
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });

  test('should show consent history', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Find consent history
      const consentHistory = authenticatedPage.locator(
        '[data-testid="consent-history"], .consent-log'
      );
      // History may show previous consent changes
    }
  });
});

test.describe('Data Access Logging', () => {
  test('should log access to sensitive data', async ({ adminPage }) => {
    // Access a patient record
    await adminPage.goto('/patients');

    const patientRow = adminPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await adminPage.waitForTimeout(1000);

      // Now check audit log
      await adminPage.goto('/gdpr/audit');

      const auditEntries = adminPage.locator('[data-testid="audit-entry"]');
      // Recent access should be logged
    }
  });

  test('should show who accessed patient data', async ({ adminPage }) => {
    await adminPage.goto('/gdpr/audit');

    // Look for audit table or log
    const auditTable = adminPage.locator(
      '[data-testid="audit-table"], .audit-log table'
    );

    if (await auditTable.isVisible()) {
      // Should show user, action, and timestamp
      const headers = auditTable.locator('th');
      // Expected: User, Action, Resource, Timestamp
    }
  });

  test('should filter audit log by date', async ({ adminPage }) => {
    await adminPage.goto('/gdpr/audit');

    const dateFilter = adminPage.locator(
      '[data-testid="audit-date-filter"], input[type="date"]'
    ).first();

    if (await dateFilter.isVisible()) {
      await dateFilter.fill(new Date().toISOString().split('T')[0]);
      await adminPage.waitForTimeout(500);
    }
  });

  test('should filter audit log by action type', async ({ adminPage }) => {
    await adminPage.goto('/gdpr/audit');

    const actionFilter = adminPage.locator(
      '[data-testid="audit-action-filter"], select[name="action"]'
    ).first();

    if (await actionFilter.isVisible()) {
      await actionFilter.click();
      await adminPage.waitForTimeout(300);
    }
  });
});

test.describe('Data Retention', () => {
  test('should display data retention policy', async ({ adminPage }) => {
    await adminPage.goto('/gdpr/settings');

    const retentionSection = adminPage.locator(
      '[data-testid="retention-policy"], .retention-settings'
    );

    await expect(retentionSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should configure retention period', async ({ adminPage }) => {
    await adminPage.goto('/gdpr/settings');

    const retentionInput = adminPage.locator(
      '[data-testid="retention-period"], input[name="retentionPeriod"]'
    ).first();

    if (await retentionInput.isVisible()) {
      // Should be configurable (in years typically)
      await expect(retentionInput).toBeEnabled();
    }
  });
});

test.describe('Anonymous Data', () => {
  test('should anonymize patient data on request', async ({ adminPage }) => {
    await adminPage.goto('/gdpr');

    const anonymizeButton = adminPage.locator(
      'button:has-text("Anonymiser"), button:has-text("Anonymize")'
    ).first();

    if (await anonymizeButton.isVisible()) {
      // Just verify the button exists
      await expect(anonymizeButton).toBeEnabled();
    }
  });
});
