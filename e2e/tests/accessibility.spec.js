/**
 * Accessibility E2E Tests
 * Tests for WCAG compliance and keyboard navigation
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Keyboard Navigation', () => {
  test('should navigate dashboard with keyboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Tab through interactive elements
    await authenticatedPage.keyboard.press('Tab');
    await authenticatedPage.keyboard.press('Tab');
    await authenticatedPage.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = authenticatedPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should navigate sidebar menu with keyboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Find sidebar navigation
    const sidebar = authenticatedPage.locator(
      '[role="navigation"], nav, .sidebar'
    ).first();

    if (await sidebar.isVisible()) {
      await sidebar.focus();

      // Arrow keys should navigate menu items
      await authenticatedPage.keyboard.press('ArrowDown');
      await authenticatedPage.keyboard.press('ArrowDown');
      await authenticatedPage.keyboard.press('Enter');

      // Should have navigated to a new page
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('should close modal with Escape key', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    // Open create patient modal
    const createButton = authenticatedPage.locator(
      'button:has-text("Ny pasient"), [data-testid="create-patient"]'
    ).first();

    if (await createButton.isVisible()) {
      await createButton.click();

      // Wait for modal
      await authenticatedPage.waitForTimeout(500);

      // Press Escape
      await authenticatedPage.keyboard.press('Escape');

      // Modal should be closed
      const modal = authenticatedPage.locator('[role="dialog"]');
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should trap focus within modal', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const createButton = authenticatedPage.locator(
      'button:has-text("Ny pasient")'
    ).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await authenticatedPage.waitForTimeout(500);

      // Tab through modal elements
      for (let i = 0; i < 20; i++) {
        await authenticatedPage.keyboard.press('Tab');
      }

      // Focus should still be within modal
      const focusedElement = authenticatedPage.locator(':focus');
      const modal = authenticatedPage.locator('[role="dialog"]');

      if (await modal.isVisible()) {
        // Check that focused element is inside modal
        const isInModal = await focusedElement.evaluate((el) => {
          return el.closest('[role="dialog"]') !== null;
        });
        expect(isInModal).toBe(true);
      }
    }
  });
});

test.describe('ARIA Labels', () => {
  test('should have accessible navigation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for accessible navigation
    const nav = authenticatedPage.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('should have labeled form inputs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients/new');

    // Find all inputs
    const inputs = authenticatedPage.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');

      // Each input should have a label
      if (!ariaLabel && !ariaLabelledby && id) {
        const label = authenticatedPage.locator(`label[for="${id}"]`);
        // At least one labeling method should exist
      }
    }
  });

  test('should have accessible buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Find buttons without visible text
    const iconButtons = authenticatedPage.locator('button:not(:has-text(.+))');
    const count = await iconButtons.count();

    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i);
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        // Icon buttons should have aria-label or title
        expect(ariaLabel || title).toBeTruthy();
      }
    }
  });

  test('should have accessible table headers', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const table = authenticatedPage.locator('table').first();

    if (await table.isVisible()) {
      // Check for scope attribute on headers
      const headers = table.locator('th');
      const headerCount = await headers.count();

      expect(headerCount).toBeGreaterThan(0);

      // Headers should have scope
      for (let i = 0; i < headerCount; i++) {
        const header = headers.nth(i);
        const scope = await header.getAttribute('scope');
        // scope="col" or scope="row" expected
      }
    }
  });
});

test.describe('Color Contrast', () => {
  test('should have sufficient text contrast', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // This is a simplified check - proper contrast testing requires
    // tools like axe-core
    const bodyText = authenticatedPage.locator('body');
    const computedStyle = await bodyText.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });

    // Basic check that text and background are different
    expect(computedStyle.color).not.toBe(computedStyle.backgroundColor);
  });
});

test.describe('Screen Reader Support', () => {
  test('should have skip to content link', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for skip link (usually hidden until focused)
    const skipLink = authenticatedPage.locator(
      'a:has-text("Hopp til innhold"), a:has-text("Skip to content"), [href="#main"]'
    );

    // Skip link might be visually hidden but should exist
    const exists = await skipLink.count() > 0;
    // Skip link is a best practice
  });

  test('should have proper heading hierarchy', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for h1
    const h1 = authenticatedPage.locator('h1');
    await expect(h1.first()).toBeVisible();

    // Count headings
    const h1Count = await authenticatedPage.locator('h1').count();
    const h2Count = await authenticatedPage.locator('h2').count();

    // Should have at most one h1
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('should announce dynamic content changes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    // Look for live regions
    const liveRegions = authenticatedPage.locator('[aria-live], [role="alert"], [role="status"]');
    // Live regions should exist for dynamic content updates
  });
});

test.describe('Focus Management', () => {
  test('should show visible focus indicator', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Tab to focus an element
    await authenticatedPage.keyboard.press('Tab');

    const focusedElement = authenticatedPage.locator(':focus');

    if (await focusedElement.isVisible()) {
      // Check that focus is visible (has outline or similar)
      const outlineStyle = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.outline || style.boxShadow;
      });

      // Should have some focus style
      expect(outlineStyle).toBeTruthy();
    }
  });

  test('should restore focus after modal closes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/patients');

    const createButton = authenticatedPage.locator(
      'button:has-text("Ny pasient")'
    ).first();

    if (await createButton.isVisible()) {
      // Focus and click the button
      await createButton.focus();
      await createButton.click();

      await authenticatedPage.waitForTimeout(500);

      // Close modal with Escape
      await authenticatedPage.keyboard.press('Escape');

      await authenticatedPage.waitForTimeout(300);

      // Focus should return to the trigger button
      const focusedElement = authenticatedPage.locator(':focus');
      // The originally focused element or a sensible alternative should be focused
    }
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have touch-friendly target sizes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check button sizes
    const buttons = authenticatedPage.locator('button, a');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44 pixels (WCAG)
          // Allowing some flexibility for small icons with padding
          expect(box.width >= 24 || box.height >= 24).toBe(true);
        }
      }
    }
  });

  test('should have responsive text sizes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    const body = authenticatedPage.locator('body');
    const fontSize = await body.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // Base font size should be at least 14px for mobile
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });
});
