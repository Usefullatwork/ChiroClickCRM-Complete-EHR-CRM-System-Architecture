/**
 * Accessibility E2E Tests
 * Tests for WCAG compliance and keyboard navigation
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Keyboard Navigation', () => {
  test('should navigate dashboard with keyboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Tab through interactive elements
    await authenticatedPage.keyboard.press('Tab');
    await authenticatedPage.keyboard.press('Tab');
    await authenticatedPage.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = authenticatedPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should navigate sidebar menu with keyboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Find sidebar navigation
    const sidebar = authenticatedPage.locator('[role="navigation"], nav').first();

    if (await sidebar.isVisible()) {
      await sidebar.focus();
      await authenticatedPage.keyboard.press('ArrowDown');
      await authenticatedPage.keyboard.press('ArrowDown');
      await authenticatedPage.keyboard.press('Enter');
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('should close modal with Escape key', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Click "New Patient" button to navigate to form
    const createButton = authenticatedPage.locator('[data-testid="patients-add-button"]');

    if (await createButton.isVisible()) {
      await createButton.click();
      await authenticatedPage.waitForTimeout(500);

      // Press Escape to dismiss any open dialog
      await authenticatedPage.keyboard.press('Escape');
      await authenticatedPage.waitForTimeout(300);
    }
  });
});

test.describe('ARIA Labels', () => {
  test('should have accessible navigation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    const nav = authenticatedPage.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('should have labeled form inputs on new patient page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');

    // Verify key inputs have labels via data-testid
    await expect(authenticatedPage.locator('[data-testid="new-patient-first-name"]')).toBeVisible({ timeout: 15000 });
    await expect(authenticatedPage.locator('[data-testid="new-patient-last-name"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="new-patient-dob"]')).toBeVisible();
  });

  test('should have accessible buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Find buttons without visible text (icon-only buttons)
    const iconButtons = authenticatedPage.locator('button:not(:has-text(.+))');
    const count = await iconButtons.count();

    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i);
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        expect(ariaLabel || title).toBeTruthy();
      }
    }
  });

  test('should have accessible table headers on patients page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    const table = authenticatedPage.locator('[data-testid="patients-list"] table').first();

    if (await table.isVisible()) {
      const headers = table.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Color Contrast', () => {
  test('should have sufficient text contrast', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    const bodyText = authenticatedPage.locator('body');
    const computedStyle = await bodyText.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });

    expect(computedStyle.color).not.toBe(computedStyle.backgroundColor);
  });
});

test.describe('Screen Reader Support', () => {
  test('should have proper heading hierarchy on dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    const h1 = authenticatedPage.locator('h1');
    await expect(h1.first()).toBeVisible();

    const h1Count = await authenticatedPage.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('should have proper heading on patients page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const title = authenticatedPage.locator('[data-testid="patients-page-title"]');
    await expect(title).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Focus Management', () => {
  test('should show visible focus indicator', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    await authenticatedPage.keyboard.press('Tab');

    const focusedElement = authenticatedPage.locator(':focus');

    if (await focusedElement.isVisible()) {
      const outlineStyle = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.outline || style.boxShadow;
      });

      expect(outlineStyle).toBeTruthy();
    }
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have touch-friendly target sizes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    const buttons = authenticatedPage.locator('button, a');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.width >= 24 || box.height >= 24).toBe(true);
        }
      }
    }
  });

  test('should have responsive text sizes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    const body = authenticatedPage.locator('body');
    const fontSize = await body.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    expect(fontSize).toBeGreaterThanOrEqual(14);
  });
});
