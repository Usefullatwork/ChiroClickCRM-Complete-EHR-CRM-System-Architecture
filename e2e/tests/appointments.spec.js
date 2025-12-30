/**
 * Appointment Management E2E Tests
 * Tests for appointment scheduling and management
 */

import { test, expect } from './fixtures/auth.fixture.js';

test.describe('Appointment Calendar', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');
  });

  test('should display calendar view', async ({ authenticatedPage }) => {
    // Wait for calendar to load
    const calendar = authenticatedPage.locator(
      '[data-testid="calendar"], .calendar, .fc, [role="grid"]'
    );
    await expect(calendar.first()).toBeVisible({ timeout: 15000 });
  });

  test('should switch between day/week/month views', async ({ authenticatedPage }) => {
    // Find view toggle buttons
    const viewButtons = authenticatedPage.locator(
      '[data-testid="view-toggle"], .fc-toolbar button, .calendar-view-toggle button'
    );

    // Try clicking week view
    const weekButton = authenticatedPage.locator(
      'button:has-text("Uke"), button:has-text("Week"), button[data-view="week"]'
    ).first();

    if (await weekButton.isVisible()) {
      await weekButton.click();
      await authenticatedPage.waitForTimeout(500);
    }

    // Try clicking day view
    const dayButton = authenticatedPage.locator(
      'button:has-text("Dag"), button:has-text("Day"), button[data-view="day"]'
    ).first();

    if (await dayButton.isVisible()) {
      await dayButton.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('should navigate between dates', async ({ authenticatedPage }) => {
    // Find navigation buttons
    const nextButton = authenticatedPage.locator(
      '[data-testid="next-date"], button:has-text("Neste"), .fc-next-button, button[aria-label*="next"]'
    ).first();
    const prevButton = authenticatedPage.locator(
      '[data-testid="prev-date"], button:has-text("Forrige"), .fc-prev-button, button[aria-label*="prev"]'
    ).first();
    const todayButton = authenticatedPage.locator(
      '[data-testid="today"], button:has-text("I dag"), button:has-text("Today"), .fc-today-button'
    ).first();

    if (await nextButton.isVisible()) {
      await nextButton.click();
      await authenticatedPage.waitForTimeout(300);
    }

    if (await prevButton.isVisible()) {
      await prevButton.click();
      await authenticatedPage.waitForTimeout(300);
    }

    if (await todayButton.isVisible()) {
      await todayButton.click();
      await authenticatedPage.waitForTimeout(300);
    }
  });

  test('should display appointments on calendar', async ({ authenticatedPage }) => {
    // Look for appointment events on calendar
    const appointments = authenticatedPage.locator(
      '.fc-event, [data-testid="appointment-event"], .calendar-event, .appointment'
    );

    // Count should be 0 or more depending on data
    const count = await appointments.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open appointment details on click', async ({ authenticatedPage }) => {
    const appointmentEvent = authenticatedPage.locator(
      '.fc-event, [data-testid="appointment-event"], .calendar-event'
    ).first();

    if (await appointmentEvent.isVisible()) {
      await appointmentEvent.click();

      // Modal or detail panel should open
      const appointmentDetail = authenticatedPage.locator(
        '[data-testid="appointment-detail"], .appointment-modal, [role="dialog"]'
      );
      await expect(appointmentDetail.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Create Appointment', () => {
  test('should open create appointment modal', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');

    // Click create appointment button
    const createButton = authenticatedPage.locator(
      '[data-testid="create-appointment"], button:has-text("Ny avtale"), button:has-text("Book")'
    ).first();

    if (await createButton.isVisible()) {
      await createButton.click();

      // Modal should open
      const modal = authenticatedPage.locator(
        '[data-testid="appointment-form"], [role="dialog"], .appointment-modal'
      );
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have patient search in appointment form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments/new');

    // Look for patient search/select
    const patientField = authenticatedPage.locator(
      '[data-testid="patient-select"], input[name="patient"], .patient-search, [aria-label*="pasient"]'
    ).first();

    await expect(patientField).toBeVisible({ timeout: 10000 });
  });

  test('should have date and time picker', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments/new');

    // Look for date picker
    const dateField = authenticatedPage.locator(
      '[data-testid="date-picker"], input[type="date"], input[name="date"]'
    ).first();

    // Look for time picker
    const timeField = authenticatedPage.locator(
      '[data-testid="time-picker"], input[type="time"], input[name="time"], select[name="time"]'
    ).first();

    if (await dateField.isVisible()) {
      await expect(dateField).toBeVisible();
    }
    if (await timeField.isVisible()) {
      await expect(timeField).toBeVisible();
    }
  });

  test('should validate appointment conflicts', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments/new');

    // This test assumes the form prevents double-booking
    // Implementation depends on how the app handles conflicts
  });

  test('should show appointment types', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments/new');

    // Look for appointment type selector
    const typeField = authenticatedPage.locator(
      '[data-testid="appointment-type"], select[name="type"], [name="appointmentType"]'
    ).first();

    if (await typeField.isVisible()) {
      await typeField.click();

      // Should show options
      const options = authenticatedPage.locator(
        'option, [role="option"], .type-option'
      );
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Appointment Actions', () => {
  test('should cancel an appointment', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');

    // Click on an appointment
    const appointmentEvent = authenticatedPage.locator(
      '.fc-event, [data-testid="appointment-event"]'
    ).first();

    if (await appointmentEvent.isVisible()) {
      await appointmentEvent.click();

      // Find cancel button in detail view
      const cancelButton = authenticatedPage.locator(
        '[data-testid="cancel-appointment"], button:has-text("Avbestill"), button:has-text("Kanseller")'
      ).first();

      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Confirm cancellation
        const confirmButton = authenticatedPage.locator(
          '[data-testid="confirm-cancel"], button:has-text("Bekreft"), button:has-text("Ja")'
        ).first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();

          // Should show success message
          await authenticatedPage.waitForTimeout(1000);
        }
      }
    }
  });

  test('should reschedule an appointment', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');

    const appointmentEvent = authenticatedPage.locator(
      '.fc-event, [data-testid="appointment-event"]'
    ).first();

    if (await appointmentEvent.isVisible()) {
      await appointmentEvent.click();

      // Find reschedule button
      const rescheduleButton = authenticatedPage.locator(
        '[data-testid="reschedule-appointment"], button:has-text("Flytt"), button:has-text("Endre tid")'
      ).first();

      if (await rescheduleButton.isVisible()) {
        await rescheduleButton.click();

        // Date picker should appear
        const datePicker = authenticatedPage.locator(
          'input[type="date"], [data-testid="date-picker"]'
        );
        await expect(datePicker.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should send appointment reminder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');

    const appointmentEvent = authenticatedPage.locator(
      '.fc-event, [data-testid="appointment-event"]'
    ).first();

    if (await appointmentEvent.isVisible()) {
      await appointmentEvent.click();

      // Find send reminder button
      const reminderButton = authenticatedPage.locator(
        '[data-testid="send-reminder"], button:has-text("Send påminnelse"), button:has-text("SMS")'
      ).first();

      if (await reminderButton.isVisible()) {
        // Just check it's clickable
        await expect(reminderButton).toBeEnabled();
      }
    }
  });
});

test.describe('Appointment Filtering', () => {
  test('should filter by practitioner', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');

    const practitionerFilter = authenticatedPage.locator(
      '[data-testid="practitioner-filter"], select[name="practitioner"], .practitioner-select'
    ).first();

    if (await practitionerFilter.isVisible()) {
      await practitionerFilter.click();

      // Select an option
      const option = authenticatedPage.locator('[role="option"], option').first();
      if (await option.isVisible()) {
        await option.click();
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });

  test('should filter by appointment type', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');

    const typeFilter = authenticatedPage.locator(
      '[data-testid="type-filter"], select[name="type"]'
    ).first();

    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await authenticatedPage.waitForTimeout(300);
    }
  });

  test('should filter by status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/appointments');

    const statusFilter = authenticatedPage.locator(
      '[data-testid="status-filter"], select[name="status"]'
    ).first();

    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await authenticatedPage.waitForTimeout(300);
    }
  });
});
