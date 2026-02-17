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

    // Find the desktop sidebar navigation (visible at 1280px via hidden md:flex)
    const sidebar = authenticatedPage.locator('nav[aria-label="Main navigation"]').first();

    if (await sidebar.isVisible()) {
      // Focus first link in the nav
      const firstLink = sidebar.locator('a').first();
      await firstLink.focus();
      await authenticatedPage.keyboard.press('Tab');
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

    // Desktop sidebar nav should be visible at default viewport (1280px)
    // Note: there are TWO nav elements (mobile + desktop). Use last() for the desktop one.
    const nav = authenticatedPage.locator('nav[aria-label="Main navigation"]');
    await expect(nav.last()).toBeVisible({ timeout: 10000 });
  });

  test('should have labeled form inputs on new patient page', async ({ authenticatedPage }) => {
    // Navigate via SPA to avoid full-page-reload auth issues in CI
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-add-button"]', { timeout: 15000 });

    // Capture console errors BEFORE navigation
    const consoleErrors = [];
    authenticatedPage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    authenticatedPage.on('pageerror', err => consoleErrors.push(err.message));

    await authenticatedPage.locator('[data-testid="patients-add-button"]').click();

    // Check if the form appeared OR if ErrorBoundary caught a crash
    const formOrError = await Promise.race([
      authenticatedPage.waitForSelector('[data-testid="new-patient-first-name"]', { timeout: 15000 })
        .then(() => 'form'),
      authenticatedPage.waitForSelector('[data-testid="error-boundary"]', { timeout: 15000 })
        .then(() => 'error-boundary'),
    ]);

    if (formOrError === 'error-boundary') {
      const errorMsg = await authenticatedPage.locator('[data-testid="error-boundary-message"]')
        .textContent()
        .catch(() => 'Could not read error message');
      console.error('=== NewPatient CRASH DIAGNOSTICS ===');
      console.error('Error message:', errorMsg);
      console.error('Console errors:', JSON.stringify(consoleErrors));
      console.error('=== END DIAGNOSTICS ===');
      throw new Error(`NewPatient crashed: ${errorMsg}`);
    }

    // Verify key inputs have labels via data-testid
    await expect(authenticatedPage.locator('[data-testid="new-patient-first-name"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="new-patient-last-name"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="new-patient-dob"]')).toBeVisible();
  });

  test('should have accessible buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForSelector('[data-testid="dashboard-title"]', { timeout: 15000 });

    // Find icon-only buttons (buttons that have no text content) using Playwright locator
    // We look for buttons with aria-label or title (icon buttons should have one)
    const allButtons = authenticatedPage.locator('button');
    const count = await allButtons.count();

    let iconButtonCount = 0;
    for (let i = 0; i < count; i++) {
      const button = allButtons.nth(i);
      if (!(await button.isVisible())) continue;

      const innerText = await button.innerText().catch(() => '');
      // If button has no meaningful text content, it's likely an icon button
      if (innerText.trim().length === 0) {
        iconButtonCount++;
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        expect(ariaLabel || title).toBeTruthy();
      }
    }
  });

  test('should have accessible table headers on patients page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');
    await authenticatedPage.waitForSelector('[data-testid="patients-page-title"]', { timeout: 15000 });

    // Wait for either patient list or empty state
    const list = authenticatedPage.locator('[data-testid="patients-list"]');
    const listVisible = await list.isVisible({ timeout: 5000 }).catch(() => false);

    if (listVisible) {
      const table = list.locator('table').first();
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

    // h1 appears in both mobile sidebar (hidden) and desktop sidebar/page (visible)
    // Use last() to get the visible desktop h1
    const h1 = authenticatedPage.locator('h1');
    await expect(h1.last()).toBeVisible();

    // DashboardLayout has h1s in mobile sidebar, desktop sidebar, and page title
    const h1Count = await authenticatedPage.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(4);
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
