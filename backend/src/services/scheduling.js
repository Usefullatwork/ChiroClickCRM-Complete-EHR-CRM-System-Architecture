/**
 * Scheduling Service
 * Booking logic with conflict detection and availability management
 *
 * Features:
 * - Conflict detection (no double-booking)
 * - Availability slot generation
 * - Work hours management
 * - Practitioner schedule validation
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// =============================================================================
// DEFAULT WORK HOURS (can be overridden per organization/practitioner)
// =============================================================================

const DEFAULT_WORK_HOURS = {
  start: 8, // 08:00
  end: 18, // 18:00
  slotDuration: 30, // minutes
};

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * Check for scheduling conflicts for a practitioner
 * Returns any overlapping appointments
 *
 * @param {string} organizationId - Organization ID
 * @param {string} practitionerId - Practitioner ID
 * @param {Date} startTime - Proposed start time
 * @param {Date} endTime - Proposed end time
 * @param {string} excludeAppointmentId - Appointment ID to exclude (for updates)
 * @returns {Array} - List of conflicting appointments
 */
export const checkConflicts = async (
  organizationId,
  practitionerId,
  startTime,
  endTime,
  excludeAppointmentId = null
) => {
  try {
    let sql = `
      SELECT
        a.id,
        a.start_time,
        a.end_time,
        a.appointment_type,
        a.status,
        p.first_name || ' ' || p.last_name as patient_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.organization_id = $1
        AND a.practitioner_id = $2
        AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
        AND (
          (a.start_time < $4 AND a.end_time > $3)
        )
    `;

    const params = [organizationId, practitionerId, startTime, endTime];

    if (excludeAppointmentId) {
      sql += ` AND a.id != $5`;
      params.push(excludeAppointmentId);
    }

    const result = await query(sql, params);

    if (result.rows.length > 0) {
      logger.warn('Scheduling conflict detected:', {
        organizationId,
        practitionerId,
        proposedStart: startTime,
        proposedEnd: endTime,
        conflicts: result.rows.length,
      });
    }

    return result.rows;
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    throw error;
  }
};

/**
 * Check if a time slot is available for booking
 * Returns boolean and any conflict details
 *
 * @param {string} organizationId - Organization ID
 * @param {string} practitionerId - Practitioner ID
 * @param {Date} startTime - Proposed start time
 * @param {Date} endTime - Proposed end time
 * @param {string} excludeAppointmentId - Appointment ID to exclude
 * @returns {Object} - { available: boolean, conflicts: Array }
 */
export const isSlotAvailable = async (
  organizationId,
  practitionerId,
  startTime,
  endTime,
  excludeAppointmentId = null
) => {
  const conflicts = await checkConflicts(
    organizationId,
    practitionerId,
    startTime,
    endTime,
    excludeAppointmentId
  );

  return {
    available: conflicts.length === 0,
    conflicts,
  };
};

// =============================================================================
// AVAILABILITY GENERATION
// =============================================================================

/**
 * Get available time slots for a practitioner on a specific date
 *
 * @param {string} organizationId - Organization ID
 * @param {string} practitionerId - Practitioner ID
 * @param {Date} date - Date to check availability
 * @param {Object} options - Options (slotDuration, workHours)
 * @returns {Array} - List of available time slots
 */
export const getAvailableSlots = async (organizationId, practitionerId, date, options = {}) => {
  const {
    slotDuration = DEFAULT_WORK_HOURS.slotDuration,
    workStart = DEFAULT_WORK_HOURS.start,
    workEnd = DEFAULT_WORK_HOURS.end,
  } = options;

  try {
    // Get start and end of the day
    const dayStart = new Date(date);
    dayStart.setHours(workStart, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(workEnd, 0, 0, 0);

    // Get all appointments for this practitioner on this day
    const result = await query(
      `SELECT start_time, end_time
       FROM appointments
       WHERE organization_id = $1
         AND practitioner_id = $2
         AND start_time >= $3
         AND start_time < $4
         AND status NOT IN ('CANCELLED', 'NO_SHOW')
       ORDER BY start_time`,
      [organizationId, practitionerId, dayStart.toISOString(), dayEnd.toISOString()]
    );

    const bookedSlots = result.rows.map((row) => ({
      start: new Date(row.start_time),
      end: new Date(row.end_time),
    }));

    // Generate all possible slots
    const allSlots = [];
    const slotMs = slotDuration * 60 * 1000;

    for (let time = dayStart.getTime(); time < dayEnd.getTime(); time += slotMs) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time + slotMs);

      // Check if slot is available
      const isBooked = bookedSlots.some(
        (booked) => slotStart < booked.end && slotEnd > booked.start
      );

      // Don't include slots in the past
      const isPast = slotStart < new Date();

      allSlots.push({
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        available: !isBooked && !isPast,
        is_past: isPast,
      });
    }

    return allSlots;
  } catch (error) {
    logger.error('Error getting available slots:', error);
    throw error;
  }
};

/**
 * Get available slots for multiple practitioners
 * Useful for finding any available practitioner
 *
 * @param {string} organizationId - Organization ID
 * @param {Array} practitionerIds - List of practitioner IDs
 * @param {Date} date - Date to check
 * @param {Object} options - Options
 * @returns {Object} - Map of practitioner ID to available slots
 */
export const getAvailableSlotsMultiple = async (
  organizationId,
  practitionerIds,
  date,
  options = {}
) => {
  const results = {};

  for (const practitionerId of practitionerIds) {
    results[practitionerId] = await getAvailableSlots(
      organizationId,
      practitionerId,
      date,
      options
    );
  }

  return results;
};

// =============================================================================
// PRACTITIONER SCHEDULE MANAGEMENT
// =============================================================================

/**
 * Get practitioner's schedule/appointments for a date range
 *
 * @param {string} organizationId - Organization ID
 * @param {string} practitionerId - Practitioner ID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Array} - List of appointments
 */
export const getPractitionerSchedule = async (
  organizationId,
  practitionerId,
  startDate,
  endDate
) => {
  try {
    const result = await query(
      `SELECT
        a.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.phone as patient_phone,
        p.email as patient_email
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.organization_id = $1
         AND a.practitioner_id = $2
         AND a.start_time >= $3
         AND a.start_time < $4
         AND a.status NOT IN ('CANCELLED')
       ORDER BY a.start_time`,
      [organizationId, practitionerId, startDate, endDate]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting practitioner schedule:', error);
    throw error;
  }
};

/**
 * Get practitioner utilization for a date range
 *
 * @param {string} organizationId - Organization ID
 * @param {string} practitionerId - Practitioner ID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {Object} options - Work hours options
 * @returns {Object} - Utilization statistics
 */
export const getPractitionerUtilization = async (
  organizationId,
  practitionerId,
  startDate,
  endDate,
  options = {}
) => {
  const { workStart = DEFAULT_WORK_HOURS.start, workEnd = DEFAULT_WORK_HOURS.end } = options;

  try {
    // Get total minutes of appointments
    const result = await query(
      `SELECT
        SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60) as booked_minutes,
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_shows
       FROM appointments
       WHERE organization_id = $1
         AND practitioner_id = $2
         AND start_time >= $3
         AND start_time < $4
         AND status NOT IN ('CANCELLED')`,
      [organizationId, practitionerId, startDate, endDate]
    );

    // Calculate available minutes (work hours per day * number of days)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const hoursPerDay = workEnd - workStart;
    const totalAvailableMinutes = days * hoursPerDay * 60;

    const bookedMinutes = parseFloat(result.rows[0]?.booked_minutes) || 0;

    return {
      total_appointments: parseInt(result.rows[0]?.total_appointments) || 0,
      completed: parseInt(result.rows[0]?.completed) || 0,
      no_shows: parseInt(result.rows[0]?.no_shows) || 0,
      booked_minutes: bookedMinutes,
      available_minutes: totalAvailableMinutes,
      utilization_percent:
        totalAvailableMinutes > 0 ? Math.round((bookedMinutes / totalAvailableMinutes) * 100) : 0,
    };
  } catch (error) {
    logger.error('Error getting practitioner utilization:', error);
    throw error;
  }
};

// =============================================================================
// BOOKING VALIDATION
// =============================================================================

/**
 * Validate a booking request
 * Checks all business rules before allowing booking
 *
 * @param {string} organizationId - Organization ID
 * @param {Object} bookingData - Booking request data
 * @param {string} excludeAppointmentId - Appointment ID to exclude (for updates)
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateBooking = async (organizationId, bookingData, excludeAppointmentId = null) => {
  const errors = [];

  const { practitioner_id, start_time, end_time, patient_id } = bookingData;

  // Validate required fields
  if (!practitioner_id) {
    errors.push('Behandler er p&aring;krevd');
  }
  if (!start_time) {
    errors.push('Starttid er p&aring;krevd');
  }
  if (!end_time) {
    errors.push('Sluttid er p&aring;krevd');
  }
  if (!patient_id) {
    errors.push('Pasient er p&aring;krevd');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Parse dates
  const startDate = new Date(start_time);
  const endDate = new Date(end_time);

  // Validate time logic
  if (endDate <= startDate) {
    errors.push('Sluttid m&aring; v&aelig;re etter starttid');
  }

  // Check if appointment is in the past
  if (startDate < new Date()) {
    errors.push('Kan ikke booke avtaler i fortiden');
  }

  // Check for conflicts
  if (practitioner_id && startDate && endDate) {
    const availability = await isSlotAvailable(
      organizationId,
      practitioner_id,
      start_time,
      end_time,
      excludeAppointmentId
    );

    if (!availability.available) {
      errors.push('Tidspunktet er ikke tilgjengelig - konflikt med eksisterende avtale');
      errors.push(
        ...availability.conflicts.map(
          (c) =>
            `Konflikt: ${c.patient_name} ${new Date(c.start_time).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })} - ${new Date(c.end_time).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
        )
      );
    }
  }

  // Check if patient already has appointment at this time
  if (patient_id && startDate && endDate) {
    const patientConflict = await query(
      `SELECT
        a.id,
        a.start_time,
        a.end_time,
        u.first_name || ' ' || u.last_name as practitioner_name
       FROM appointments a
       LEFT JOIN users u ON u.id = a.practitioner_id
       WHERE a.organization_id = $1
         AND a.patient_id = $2
         AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
         AND (a.start_time < $4 AND a.end_time > $3)
         ${excludeAppointmentId ? 'AND a.id != $5' : ''}`,
      excludeAppointmentId
        ? [organizationId, patient_id, start_time, end_time, excludeAppointmentId]
        : [organizationId, patient_id, start_time, end_time]
    );

    if (patientConflict.rows.length > 0) {
      errors.push('Pasienten har allerede en avtale p&aring; dette tidspunktet');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// =============================================================================
// RECURRING APPOINTMENTS
// =============================================================================

/**
 * Generate recurring appointment dates
 *
 * @param {Date} startDate - First appointment date
 * @param {string} pattern - Recurrence pattern (DAILY, WEEKLY, BIWEEKLY, MONTHLY)
 * @param {Date} endDate - Last date for recurring appointments
 * @returns {Array} - List of dates for recurring appointments
 */
export const generateRecurringDates = (startDate, pattern, endDate) => {
  const dates = [new Date(startDate)];
  let currentDate = new Date(startDate);

  const intervalDays = {
    DAILY: 1,
    WEEKLY: 7,
    BIWEEKLY: 14,
    MONTHLY: 30, // Approximate
  };

  const interval = intervalDays[pattern] || 7;

  while (currentDate < endDate) {
    if (pattern === 'MONTHLY') {
      // For monthly, add one month instead of days
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    } else {
      currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
    }

    if (currentDate <= endDate) {
      dates.push(new Date(currentDate));
    }
  }

  return dates;
};

/**
 * Create recurring appointments
 *
 * @param {string} organizationId - Organization ID
 * @param {Object} baseAppointment - Base appointment data
 * @param {string} pattern - Recurrence pattern
 * @param {Date} recurringEndDate - End date for recurrence
 * @returns {Array} - List of created appointments or conflicts
 */
export const createRecurringAppointments = async (
  organizationId,
  baseAppointment,
  pattern,
  recurringEndDate
) => {
  const startDate = new Date(baseAppointment.start_time);
  const endDate = new Date(baseAppointment.end_time);
  const duration = endDate - startDate;

  const recurringDates = generateRecurringDates(startDate, pattern, recurringEndDate);
  const results = [];

  for (const date of recurringDates) {
    const appointmentStart = new Date(date);
    appointmentStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

    const appointmentEnd = new Date(appointmentStart.getTime() + duration);

    const appointmentData = {
      ...baseAppointment,
      start_time: appointmentStart.toISOString(),
      end_time: appointmentEnd.toISOString(),
      recurring_pattern: pattern,
      recurring_end_date: recurringEndDate,
    };

    // Validate each occurrence
    const validation = await validateBooking(organizationId, appointmentData);

    results.push({
      date: appointmentStart.toISOString(),
      valid: validation.valid,
      errors: validation.errors,
      data: appointmentData,
    });
  }

  return results;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  checkConflicts,
  isSlotAvailable,
  getAvailableSlots,
  getAvailableSlotsMultiple,
  getPractitionerSchedule,
  getPractitionerUtilization,
  validateBooking,
  generateRecurringDates,
  createRecurringAppointments,
  DEFAULT_WORK_HOURS,
};
