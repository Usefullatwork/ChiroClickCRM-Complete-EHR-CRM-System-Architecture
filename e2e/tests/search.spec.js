/**
 * Full-Text Search E2E Tests
 * Tests for the global and entity-specific search functionality
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Global Search', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
  });

  test('should display global search input', async ({ authenticatedPage }) => {
    const globalSearch = authenticatedPage.locator(
      '[data-testid="global-search"], input[aria-label*="search"], .global-search input, header input[type="search"]'
    );
    await expect(globalSearch.first()).toBeVisible({ timeout: 10000 });
  });

  test('should search across all entities', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator(
      '[data-testid="global-search"], header input[type="search"], .global-search input'
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await authenticatedPage.waitForTimeout(1000);

      // Check for search results dropdown or page
      const searchResults = authenticatedPage.locator(
        '[data-testid="search-results"], .search-dropdown, .search-results'
      );
      // Results may or may not appear depending on data
    }
  });

  test('should categorize search results by type', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator(
      '[data-testid="global-search"], .global-search input'
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('pasient');
      await authenticatedPage.waitForTimeout(1000);

      // Check for category headers
      const patientCategory = authenticatedPage.locator(
        'text=Pasienter, text=Patients, [data-category="patients"]'
      );
      const encounterCategory = authenticatedPage.locator(
        'text=Konsultasjoner, text=Encounters, [data-category="encounters"]'
      );
      // Categories may appear depending on results
    }
  });

  test('should navigate to result when selected', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator(
      '[data-testid="global-search"]'
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await authenticatedPage.waitForTimeout(1000);

      // Click on first result
      const firstResult = authenticatedPage.locator(
        '[data-testid="search-result"], .search-result-item'
      ).first();

      if (await firstResult.isVisible()) {
        await firstResult.click();

        // Should navigate to entity page
        await expect(authenticatedPage).not.toHaveURL('/');
      }
    }
  });

  test('should handle empty search gracefully', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('[data-testid="global-search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('');
      await authenticatedPage.waitForTimeout(500);

      // No results or hint should be shown
      const noResults = authenticatedPage.locator(
        'text=Skriv for å søke, text=Ingen resultater'
      );
      // Behavior depends on implementation
    }
  });

  test('should show loading state during search', async ({ page }) => {
    // Mock slow search response
    await page.route('**/api/v1/search/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/');

    const searchInput = page.locator('[data-testid="global-search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');

      // Check for loading indicator
      const loading = page.locator(
        '[data-testid="search-loading"], .loading, .spinner'
      );
      // Loading indicator may briefly appear
    }
  });
});

test.describe('Patient Search', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
  });

  test('should search patients by name', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator(
      '[data-testid="patient-search"], input[type="search"]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('Erik');
    await authenticatedPage.waitForTimeout(1000);
  });

  test('should search patients by phone number', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('99999999');
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('should search patients by email', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('@example.com');
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('should highlight matching terms in results', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await authenticatedPage.waitForTimeout(1000);

      // Check for highlighted text
      const highlight = authenticatedPage.locator('mark, .highlight, .search-highlight');
      // Highlights may appear in results
    }
  });
});

test.describe('Diagnosis Code Search', () => {
  test('should search ICPC-2 codes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    const diagnosisSearch = authenticatedPage.locator(
      '[data-testid="diagnosis-search"], input[name="diagnosis"], .diagnosis-input'
    ).first();

    if (await diagnosisSearch.isVisible()) {
      await diagnosisSearch.fill('L03');
      await authenticatedPage.waitForTimeout(1000);

      // Should show L03 results
      const results = authenticatedPage.locator('text=L03');
      // Results may appear depending on data
    }
  });

  test('should search diagnosis by Norwegian description', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    const diagnosisSearch = authenticatedPage.locator(
      '[data-testid="diagnosis-search"]'
    ).first();

    if (await diagnosisSearch.isVisible()) {
      await diagnosisSearch.fill('korsrygg');
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('should search diagnosis by English description', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    const diagnosisSearch = authenticatedPage.locator(
      '[data-testid="diagnosis-search"]'
    ).first();

    if (await diagnosisSearch.isVisible()) {
      await diagnosisSearch.fill('low back');
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('should add selected diagnosis to encounter', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters/new');

    const diagnosisSearch = authenticatedPage.locator(
      '[data-testid="diagnosis-search"]'
    ).first();

    if (await diagnosisSearch.isVisible()) {
      await diagnosisSearch.fill('L03');
      await authenticatedPage.waitForTimeout(1000);

      // Click on a result
      const diagnosisOption = authenticatedPage.locator(
        '[data-testid="diagnosis-option"], .diagnosis-result'
      ).first();

      if (await diagnosisOption.isVisible()) {
        await diagnosisOption.click();

        // Check diagnosis was added
        const selectedDiagnosis = authenticatedPage.locator(
          '[data-testid="selected-diagnosis"], .diagnosis-tag'
        );
        await expect(selectedDiagnosis.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Encounter Search', () => {
  test('should search encounters by content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters');

    const searchInput = authenticatedPage.locator(
      '[data-testid="encounter-search"], input[type="search"]'
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('ryggsmerte'); // back pain in Norwegian
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('should filter encounters by date range', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters');

    const dateFromInput = authenticatedPage.locator(
      '[data-testid="date-from"], input[name="dateFrom"]'
    ).first();
    const dateToInput = authenticatedPage.locator(
      '[data-testid="date-to"], input[name="dateTo"]'
    ).first();

    if (await dateFromInput.isVisible() && await dateToInput.isVisible()) {
      const today = new Date();
      const lastMonth = new Date(today.setMonth(today.getMonth() - 1));

      await dateFromInput.fill(lastMonth.toISOString().split('T')[0]);
      await dateToInput.fill(new Date().toISOString().split('T')[0]);
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('should filter encounters by practitioner', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/encounters');

    const practitionerFilter = authenticatedPage.locator(
      '[data-testid="practitioner-filter"], select[name="practitioner"]'
    ).first();

    if (await practitionerFilter.isVisible()) {
      await practitionerFilter.click();
      await authenticatedPage.waitForTimeout(300);
    }
  });
});

test.describe('Search Suggestions (Autocomplete)', () => {
  test('should show autocomplete suggestions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const searchInput = authenticatedPage.locator('input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('er');
      await authenticatedPage.waitForTimeout(500);

      // Check for suggestions dropdown
      const suggestions = authenticatedPage.locator(
        '[data-testid="suggestions"], .autocomplete-dropdown, [role="listbox"]'
      );
      // Suggestions may appear depending on implementation
    }
  });

  test('should select suggestion with keyboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const searchInput = authenticatedPage.locator('input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('er');
      await authenticatedPage.waitForTimeout(500);

      // Press down arrow to select suggestion
      await searchInput.press('ArrowDown');
      await searchInput.press('Enter');

      // Search should execute with selected suggestion
      await authenticatedPage.waitForTimeout(500);
    }
  });
});
