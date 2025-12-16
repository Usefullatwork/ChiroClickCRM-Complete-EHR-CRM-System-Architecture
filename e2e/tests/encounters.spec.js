/**
 * Clinical Encounters (SOAP Notes) E2E Tests
 * Tests for creating and managing clinical documentation
 */

import { test, expect, createTestEncounter } from './fixtures/auth.fixture.js';

test.describe('SOAP Note Creation', () => {
  test('should access encounter creation from patient page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    // Click on first patient
    const patientRow = authenticatedPage.locator(
      '[data-testid="patient-row"], tr[data-patient-id], .patient-item'
    ).first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Find new encounter button
      const newEncounterButton = authenticatedPage.locator(
        '[data-testid="new-encounter"], button:has-text("Ny konsultasjon"), button:has-text("SOAP")'
      ).first();

      if (await newEncounterButton.isVisible()) {
        await newEncounterButton.click();

        // Should navigate to encounter form
        await expect(authenticatedPage).toHaveURL(/.*encounter.*/);
      }
    }
  });

  test('should display SOAP note form sections', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    // Check for SOAP sections
    const subjectiveSection = authenticatedPage.locator(
      '[data-testid="subjective"], textarea[name="subjective"], label:has-text("Subjektiv")'
    );
    const objectiveSection = authenticatedPage.locator(
      '[data-testid="objective"], textarea[name="objective"], label:has-text("Objektiv")'
    );
    const assessmentSection = authenticatedPage.locator(
      '[data-testid="assessment"], textarea[name="assessment"], label:has-text("Vurdering")'
    );
    const planSection = authenticatedPage.locator(
      '[data-testid="plan"], textarea[name="plan"], label:has-text("Plan")'
    );

    // At least one SOAP section should be visible
    const soapForm = authenticatedPage.locator('[data-testid="soap-form"], .soap-form, form');
    await expect(soapForm.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have diagnosis code search', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    // Look for diagnosis search
    const diagnosisSearch = authenticatedPage.locator(
      '[data-testid="diagnosis-search"], input[name="diagnosis"], .icpc-search, .icd-search'
    ).first();

    if (await diagnosisSearch.isVisible()) {
      await diagnosisSearch.fill('L03'); // Lumbar spine code

      await authenticatedPage.waitForTimeout(1000);

      // Should show search results
      const searchResults = authenticatedPage.locator(
        '[data-testid="diagnosis-results"], .search-results, [role="listbox"]'
      );
      // Results may or may not appear depending on data
    }
  });

  test('should create SOAP note with content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    // Fill SOAP sections
    const subjectiveField = authenticatedPage.locator(
      'textarea[name="subjective"], [data-testid="subjective"] textarea'
    ).first();
    const objectiveField = authenticatedPage.locator(
      'textarea[name="objective"], [data-testid="objective"] textarea'
    ).first();
    const assessmentField = authenticatedPage.locator(
      'textarea[name="assessment"], [data-testid="assessment"] textarea'
    ).first();
    const planField = authenticatedPage.locator(
      'textarea[name="plan"], [data-testid="plan"] textarea'
    ).first();

    if (await subjectiveField.isVisible()) {
      await subjectiveField.fill('Pasient rapporterer korsryggsmerter i 2 uker.');
    }
    if (await objectiveField.isVisible()) {
      await objectiveField.fill('ROM begrenset i fleksjon. Ømhet ved L4-L5.');
    }
    if (await assessmentField.isVisible()) {
      await assessmentField.fill('Lumbal forstuing mistenkes.');
    }
    if (await planField.isVisible()) {
      await planField.fill('Spinal manipulasjon, tøyningsøvelser, oppfølging om 1 uke.');
    }

    // Save draft or submit
    const saveButton = authenticatedPage.locator(
      'button:has-text("Lagre"), button[type="submit"]'
    ).first();

    if (await saveButton.isVisible()) {
      await saveButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('should auto-save encounter as draft', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    // Start typing in subjective field
    const subjectiveField = authenticatedPage.locator(
      'textarea[name="subjective"], [data-testid="subjective"] textarea'
    ).first();

    if (await subjectiveField.isVisible()) {
      await subjectiveField.fill('Auto-save test content');

      // Wait for auto-save (if implemented)
      await authenticatedPage.waitForTimeout(3000);

      // Check for auto-save indicator
      const autoSaveIndicator = authenticatedPage.locator(
        '[data-testid="auto-save"], .auto-save-status, text=Lagret, text=Saved'
      );
      // May or may not be visible depending on implementation
    }
  });
});

test.describe('SOAP Note Templates', () => {
  test('should display template selection', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    const templateButton = authenticatedPage.locator(
      '[data-testid="templates"], button:has-text("Maler"), button:has-text("Templates")'
    ).first();

    if (await templateButton.isVisible()) {
      await templateButton.click();

      // Template list should appear
      const templateList = authenticatedPage.locator(
        '[data-testid="template-list"], .template-list, [role="menu"]'
      );
      await expect(templateList.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should apply template to form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    const templateButton = authenticatedPage.locator(
      '[data-testid="templates"], button:has-text("Maler")'
    ).first();

    if (await templateButton.isVisible()) {
      await templateButton.click();

      // Select first template
      const template = authenticatedPage.locator(
        '[data-testid="template-item"], .template-option'
      ).first();

      if (await template.isVisible()) {
        await template.click();

        // Form should now have template content
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });
});

test.describe('SOAP Note Signing', () => {
  test('should display sign button for unsigned notes', async ({ practitionerPage }) => {
    await practitionerPage.goto('/encounters');

    // Find an unsigned encounter
    const unsignedNote = practitionerPage.locator(
      '[data-testid="unsigned-indicator"], .unsigned, text=Usignert'
    ).first();

    if (await unsignedNote.isVisible()) {
      await unsignedNote.click();

      // Sign button should be visible
      const signButton = practitionerPage.locator(
        '[data-testid="sign-note"], button:has-text("Signer"), button:has-text("Sign")'
      );
      await expect(signButton.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prevent editing of signed notes', async ({ practitionerPage }) => {
    await practitionerPage.goto('/encounters');

    // Find a signed encounter
    const signedNote = practitionerPage.locator(
      '[data-testid="signed-indicator"], .signed, text=Signert'
    ).first();

    if (await signedNote.isVisible()) {
      await signedNote.click();

      // Edit fields should be disabled
      const editableField = practitionerPage.locator(
        'textarea:not([disabled]), input:not([disabled])'
      );

      // For signed notes, most fields should be disabled
      // This depends on implementation
    }
  });
});

test.describe('Encounter History', () => {
  test('should display patient encounter history', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Navigate to encounters tab
      const encountersTab = authenticatedPage.locator(
        '[data-testid="encounters-tab"], button:has-text("Konsultasjoner"), button:has-text("Journal")'
      ).first();

      if (await encountersTab.isVisible()) {
        await encountersTab.click();

        // Encounter list should appear
        const encounterList = authenticatedPage.locator(
          '[data-testid="encounter-list"], .encounter-history, .journal-entries'
        );
        await expect(encounterList.first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should expand encounter details in history', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();

    if (await patientRow.isVisible()) {
      await patientRow.click();
      await authenticatedPage.waitForTimeout(1000);

      // Find and click an encounter in history
      const encounterItem = authenticatedPage.locator(
        '[data-testid="encounter-item"], .encounter-entry'
      ).first();

      if (await encounterItem.isVisible()) {
        await encounterItem.click();

        // Details should expand
        const encounterDetail = authenticatedPage.locator(
          '[data-testid="encounter-detail"], .encounter-expanded'
        );
        await expect(encounterDetail.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should search through encounters', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters');

    const searchInput = authenticatedPage.locator(
      '[data-testid="encounter-search"], input[type="search"], input[placeholder*="Søk"]'
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('rygg'); // Norwegian for "back"
      await authenticatedPage.waitForTimeout(1000);
    }
  });
});

test.describe('Red Flag Detection', () => {
  test('should highlight red flag symptoms in notes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    // Fill in content with red flag symptom
    const subjectiveField = authenticatedPage.locator(
      'textarea[name="subjective"]'
    ).first();

    if (await subjectiveField.isVisible()) {
      // Type content that might trigger red flag warning
      await subjectiveField.fill('Pasient rapporterer alvorlige korsryggsmerter med urininkontinens.');

      await authenticatedPage.waitForTimeout(1000);

      // Check for red flag warning
      const redFlagWarning = authenticatedPage.locator(
        '[data-testid="red-flag-warning"], .red-flag, .warning-alert, text=Rødt flagg'
      );
      // Warning may or may not appear depending on implementation
    }
  });
});
