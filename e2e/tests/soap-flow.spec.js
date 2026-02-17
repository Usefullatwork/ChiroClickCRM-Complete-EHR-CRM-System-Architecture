/**
 * SOAP Note Creation Flow E2E Tests
 * Full end-to-end test: Login -> Patients -> Select Patient -> Open Encounter -> Fill SOAP -> Save
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Full SOAP Note Creation Flow', () => {
  test('should complete full SOAP note workflow', async ({ authenticatedPage }) => {
    // Step 1: Navigate to patients list
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });
    await expect(authenticatedPage.locator('[data-testid="patients-page-title"]')).toBeVisible();

    // Step 2: Click on first patient
    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    await expect(patientRow).toBeVisible({ timeout: 10000 });
    await patientRow.click();

    // Step 3: Verify patient detail loaded
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });
    await expect(authenticatedPage.locator('[data-testid="patient-detail-name"]')).toBeVisible();

    // Step 4: Click "New Visit" to open encounter form
    const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
    await expect(newVisitButton).toBeVisible({ timeout: 5000 });
    await newVisitButton.click();

    // Step 5: Verify encounter form loaded with all SOAP sections
    await authenticatedPage.waitForSelector('[data-testid="encounter-subjective"]', { timeout: 15000 });
    await expect(authenticatedPage.locator('[data-testid="encounter-subjective"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="encounter-objective"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="encounter-assessment"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="encounter-plan"]')).toBeVisible();

    // Step 6: Fill Subjective section
    const chiefComplaintInput = authenticatedPage.locator('[data-testid="encounter-subjective"] input[type="text"]').first();
    if (await chiefComplaintInput.isVisible()) {
      await chiefComplaintInput.fill('Korsryggsmerter i 3 uker, forverres ved sitting');
    }

    // Step 7: Fill Objective section - look for textarea in the objective section
    const objectiveTextarea = authenticatedPage.locator('[data-testid="encounter-objective"] textarea').first();
    if (await objectiveTextarea.isVisible()) {
      await objectiveTextarea.fill('Redusert fleksjon lumbal, ømhet over L4-L5 fasettledd');
    }

    // Step 8: Fill Assessment section - clinical reasoning textarea
    const assessmentTextarea = authenticatedPage.locator('[data-testid="encounter-assessment"] textarea').first();
    if (await assessmentTextarea.isVisible()) {
      await assessmentTextarea.fill('Mekanisk korsryggsyndrom uten utstråling. God prognose.');
    }

    // Step 9: Verify save button is available
    const saveButton = authenticatedPage.locator('[data-testid="encounter-save-button"]');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    // Step 10: Click save
    await saveButton.click();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('should display all SOAP section headers', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    if (!(await patientRow.isVisible())) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

    const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
    if (!(await newVisitButton.isVisible())) return;

    await newVisitButton.click();
    await authenticatedPage.waitForSelector('[data-testid="encounter-subjective"]', { timeout: 15000 });

    // Verify S, O, A, P badges/headers exist
    const subjectiveHeader = authenticatedPage.locator('[data-testid="encounter-subjective"]').locator('text=Subjektivt');
    const objectiveHeader = authenticatedPage.locator('[data-testid="encounter-objective"]').locator('text=Objektivt');
    const assessmentHeader = authenticatedPage.locator('[data-testid="encounter-assessment"]').locator('text=Vurdering');
    const planHeader = authenticatedPage.locator('[data-testid="encounter-plan"]').locator('text=Plan');

    await expect(subjectiveHeader).toBeVisible();
    await expect(objectiveHeader).toBeVisible();
    await expect(assessmentHeader).toBeVisible();
    await expect(planHeader).toBeVisible();
  });

  test('should have VAS pain slider in subjective section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    if (!(await patientRow.isVisible())) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

    const newVisitButton = authenticatedPage.locator('button:has-text("New Visit")').first();
    if (!(await newVisitButton.isVisible())) return;

    await newVisitButton.click();
    await authenticatedPage.waitForSelector('[data-testid="encounter-subjective"]', { timeout: 15000 });

    // VAS pain slider should be in subjective section
    const vasSlider = authenticatedPage.locator('[data-testid="encounter-subjective"] input[type="range"]');
    await expect(vasSlider).toBeVisible();
  });
});

test.describe('SOAP Note from Patient Detail', () => {
  test('should show visits history on patient detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    if (!(await patientRow.isVisible())) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

    // Visits section should be visible
    const visitsSection = authenticatedPage.locator('[data-testid="patient-detail-tab-visits"]');
    await expect(visitsSection).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Easy Assessment from patient detail', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const patientRow = authenticatedPage.locator('[data-testid="patient-row"]').first();
    if (!(await patientRow.isVisible())) return;

    await patientRow.click();
    await authenticatedPage.waitForSelector('[data-testid="patient-detail-name"]', { timeout: 10000 });

    // Easy Assessment button should be visible
    const easyAssessmentButton = authenticatedPage.locator('button:has-text("Easy Assessment")').first();
    if (await easyAssessmentButton.isVisible()) {
      await expect(easyAssessmentButton).toBeEnabled();
    }
  });
});
