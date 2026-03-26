/**
 * Unit Tests for Scheduling Service
 * Tests conflict detection, slot generation, practitioner schedule, utilization,
 * booking validation, recurring dates, and recurring appointment creation.
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
const scheduling = await import('../../../src/services/scheduling.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a future ISO timestamp N hours from now */
function futureISO(hoursFromNow = 2) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

/** Build a future ISO timestamp N hours from now + durationMinutes */
function futureISOOffset(hoursFromNow = 2, durationMinutes = 30) {
  return new Date(
    Date.now() + hoursFromNow * 60 * 60 * 1000 + durationMinutes * 60 * 1000
  ).toISOString();
}

const ORG_ID = 'org-test-001';
const PRAC_ID = 'prac-test-001';
const PAT_ID = 'pat-test-001';

describe('Scheduling Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // checkConflicts
  // =========================================================================

  describe('checkConflicts', () => {
    it('should return empty array when no conflicts exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await scheduling.checkConflicts(
        ORG_ID,
        PRAC_ID,
        futureISO(2),
        futureISOOffset(2, 30)
      );

      expect(result).toEqual([]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return conflicting appointments when overlap exists', async () => {
      const conflict = {
        id: 'apt-conflict',
        start_time: futureISO(2),
        end_time: futureISOOffset(2, 30),
        appointment_type: 'INITIAL',
        status: 'SCHEDULED',
        patient_name: 'Ola Nordmann',
      };
      mockQuery.mockResolvedValueOnce({ rows: [conflict] });

      const result = await scheduling.checkConflicts(
        ORG_ID,
        PRAC_ID,
        futureISO(2),
        futureISOOffset(2, 30)
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('apt-conflict');
    });

    it('should append AND a.id != $5 when excludeAppointmentId is provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await scheduling.checkConflicts(
        ORG_ID,
        PRAC_ID,
        futureISO(2),
        futureISOOffset(2, 30),
        'exclude-apt-id'
      );

      const calledSql = mockQuery.mock.calls[0][0];
      const calledParams = mockQuery.mock.calls[0][1];
      expect(calledSql).toContain('$5');
      expect(calledParams).toContain('exclude-apt-id');
    });

    it('should throw and propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      await expect(
        scheduling.checkConflicts(ORG_ID, PRAC_ID, futureISO(2), futureISOOffset(2, 30))
      ).rejects.toThrow('DB connection lost');
    });
  });

  // =========================================================================
  // isSlotAvailable
  // =========================================================================

  describe('isSlotAvailable', () => {
    it('should return available:true when no conflicts', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await scheduling.isSlotAvailable(
        ORG_ID,
        PRAC_ID,
        futureISO(3),
        futureISOOffset(3, 30)
      );

      expect(result.available).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return available:false with conflict list when slot is taken', async () => {
      const conflict = { id: 'apt-taken', patient_name: 'Kari Nordmann' };
      mockQuery.mockResolvedValueOnce({ rows: [conflict] });

      const result = await scheduling.isSlotAvailable(
        ORG_ID,
        PRAC_ID,
        futureISO(3),
        futureISOOffset(3, 30)
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('apt-taken');
    });
  });

  // =========================================================================
  // getAvailableSlots
  // =========================================================================

  describe('getAvailableSlots', () => {
    it('should generate slots spanning work hours with default 30-min duration', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no booked slots

      // Use a fixed future date to avoid past-slot interference
      const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week ahead
      const result = await scheduling.getAvailableSlots(ORG_ID, PRAC_ID, date);

      // Default: 08:00 – 18:00 = 10 hours = 20 x 30-min slots
      expect(result).toHaveLength(20);
      expect(result[0]).toHaveProperty('start_time');
      expect(result[0]).toHaveProperty('end_time');
      expect(result[0]).toHaveProperty('available');
      expect(result[0]).toHaveProperty('is_past');
    });

    it('should mark booked slot as unavailable', async () => {
      const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(8, 0, 0, 0);

      const bookedStart = new Date(dayStart.getTime());
      const bookedEnd = new Date(dayStart.getTime() + 30 * 60 * 1000);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            start_time: bookedStart.toISOString(),
            end_time: bookedEnd.toISOString(),
          },
        ],
      });

      const result = await scheduling.getAvailableSlots(ORG_ID, PRAC_ID, date);

      // First slot (08:00–08:30) should be unavailable
      expect(result[0].available).toBe(false);
      // Second slot should remain available
      expect(result[1].available).toBe(true);
    });

    it('should respect custom slotDuration and workHours options', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const result = await scheduling.getAvailableSlots(ORG_ID, PRAC_ID, date, {
        slotDuration: 60,
        workStart: 9,
        workEnd: 17,
      });

      // 09:00 – 17:00 = 8 hours = 8 x 60-min slots
      expect(result).toHaveLength(8);
    });

    it('should mark past slots with is_past:true', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Use yesterday — all slots will be in the past
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await scheduling.getAvailableSlots(ORG_ID, PRAC_ID, yesterday);

      result.forEach((slot) => {
        expect(slot.is_past).toBe(true);
        expect(slot.available).toBe(false);
      });
    });

    it('should throw and propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query timeout'));

      const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await expect(scheduling.getAvailableSlots(ORG_ID, PRAC_ID, date)).rejects.toThrow(
        'Query timeout'
      );
    });
  });

  // =========================================================================
  // getAvailableSlotsMultiple
  // =========================================================================

  describe('getAvailableSlotsMultiple', () => {
    it('should return a map keyed by practitioner ID', async () => {
      // Two practitioners → two DB calls
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

      const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const result = await scheduling.getAvailableSlotsMultiple(ORG_ID, ['prac-1', 'prac-2'], date);

      expect(Object.keys(result)).toEqual(['prac-1', 'prac-2']);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // getPractitionerSchedule
  // =========================================================================

  describe('getPractitionerSchedule', () => {
    it('should return schedule rows ordered by start_time', async () => {
      const rows = [
        { id: 'apt-1', start_time: '2026-04-01T09:00:00Z', patient_name: 'Ola Nordmann' },
        { id: 'apt-2', start_time: '2026-04-01T10:00:00Z', patient_name: 'Kari Nordmann' },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await scheduling.getPractitionerSchedule(
        ORG_ID,
        PRAC_ID,
        new Date('2026-04-01T00:00:00Z'),
        new Date('2026-04-02T00:00:00Z')
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('apt-1');
    });

    it('should return empty array when no appointments in range', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await scheduling.getPractitionerSchedule(
        ORG_ID,
        PRAC_ID,
        new Date('2030-01-01'),
        new Date('2030-01-02')
      );

      expect(result).toEqual([]);
    });

    it('should throw and propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Schedule query failed'));

      await expect(
        scheduling.getPractitionerSchedule(
          ORG_ID,
          PRAC_ID,
          new Date('2026-04-01'),
          new Date('2026-04-02')
        )
      ).rejects.toThrow('Schedule query failed');
    });
  });

  // =========================================================================
  // getPractitionerUtilization
  // =========================================================================

  describe('getPractitionerUtilization', () => {
    it('should calculate utilization percent correctly', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ booked_minutes: '240', total_appointments: '8', completed: '6', no_shows: '1' }],
      });

      // 7 days × (18-8) hours × 60 min = 4200 available minutes
      const startDate = new Date('2026-04-01T00:00:00Z');
      const endDate = new Date('2026-04-08T00:00:00Z');
      const result = await scheduling.getPractitionerUtilization(
        ORG_ID,
        PRAC_ID,
        startDate,
        endDate
      );

      expect(result.booked_minutes).toBe(240);
      expect(result.total_appointments).toBe(8);
      expect(result.completed).toBe(6);
      expect(result.no_shows).toBe(1);
      expect(result.available_minutes).toBe(4200);
      expect(result.utilization_percent).toBe(Math.round((240 / 4200) * 100));
    });

    it('should return zeros when no appointments exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ booked_minutes: null, total_appointments: '0', completed: '0', no_shows: '0' }],
      });

      const result = await scheduling.getPractitionerUtilization(
        ORG_ID,
        PRAC_ID,
        new Date('2026-04-01'),
        new Date('2026-04-02')
      );

      expect(result.booked_minutes).toBe(0);
      expect(result.utilization_percent).toBe(0);
    });

    it('should throw and propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Utilization query failed'));

      await expect(
        scheduling.getPractitionerUtilization(
          ORG_ID,
          PRAC_ID,
          new Date('2026-04-01'),
          new Date('2026-04-02')
        )
      ).rejects.toThrow('Utilization query failed');
    });
  });

  // =========================================================================
  // validateBooking
  // =========================================================================

  describe('validateBooking', () => {
    it('should fail validation when required fields are missing', async () => {
      const result = await scheduling.validateBooking(ORG_ID, {});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('should fail validation when end_time is before start_time', async () => {
      const start = futureISO(4);
      const end = futureISO(3); // earlier than start

      // validateBooking still calls conflict checks even after time-logic errors
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // practitioner conflict check
        .mockResolvedValueOnce({ rows: [] }); // patient conflict check

      const result = await scheduling.validateBooking(ORG_ID, {
        practitioner_id: PRAC_ID,
        patient_id: PAT_ID,
        start_time: start,
        end_time: end,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('etter'))).toBe(true);
    });

    it('should fail validation when appointment is in the past', async () => {
      const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const pastEnd = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

      // validateBooking still calls conflict checks even after past-time error
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // practitioner conflict check
        .mockResolvedValueOnce({ rows: [] }); // patient conflict check

      const result = await scheduling.validateBooking(ORG_ID, {
        practitioner_id: PRAC_ID,
        patient_id: PAT_ID,
        start_time: pastStart,
        end_time: pastEnd,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('fortiden'))).toBe(true);
    });

    it('should fail validation when practitioner has a conflict', async () => {
      // First query = practitioner conflict check, second = patient conflict check
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'apt-conflict',
              patient_name: 'Ola Nordmann',
              start_time: futureISO(2),
              end_time: futureISOOffset(2, 30),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const result = await scheduling.validateBooking(ORG_ID, {
        practitioner_id: PRAC_ID,
        patient_id: PAT_ID,
        start_time: futureISO(2),
        end_time: futureISOOffset(2, 30),
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('konflikt'))).toBe(true);
    });

    it('should fail validation when patient already has appointment at same time', async () => {
      // First query (practitioner) = no conflict, second (patient) = conflict
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
        rows: [{ id: 'pat-conflict', practitioner_name: 'Dr. Hansen' }],
      });

      const result = await scheduling.validateBooking(ORG_ID, {
        practitioner_id: PRAC_ID,
        patient_id: PAT_ID,
        start_time: futureISO(2),
        end_time: futureISOOffset(2, 30),
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Pasienten'))).toBe(true);
    });

    it('should pass validation when all fields are valid and no conflicts', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // practitioner conflict
        .mockResolvedValueOnce({ rows: [] }); // patient conflict

      const result = await scheduling.validateBooking(ORG_ID, {
        practitioner_id: PRAC_ID,
        patient_id: PAT_ID,
        start_time: futureISO(5),
        end_time: futureISOOffset(5, 30),
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should include excludeAppointmentId in patient conflict query when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

      await scheduling.validateBooking(
        ORG_ID,
        {
          practitioner_id: PRAC_ID,
          patient_id: PAT_ID,
          start_time: futureISO(5),
          end_time: futureISOOffset(5, 30),
        },
        'exclude-apt-123'
      );

      const patientQuerySql = mockQuery.mock.calls[1][0];
      const patientQueryParams = mockQuery.mock.calls[1][1];
      expect(patientQuerySql).toContain('$5');
      expect(patientQueryParams).toContain('exclude-apt-123');
    });
  });

  // =========================================================================
  // generateRecurringDates
  // =========================================================================

  describe('generateRecurringDates', () => {
    it('should generate WEEKLY dates including the start date', () => {
      const start = new Date('2026-04-01T09:00:00Z');
      const end = new Date('2026-04-29T09:00:00Z');

      const dates = scheduling.generateRecurringDates(start, 'WEEKLY', end);

      // Apr 1, 8, 15, 22, 29 = 5 dates
      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new Date('2026-04-01T09:00:00Z'));
    });

    it('should generate DAILY dates', () => {
      const start = new Date('2026-04-01');
      const end = new Date('2026-04-05');

      const dates = scheduling.generateRecurringDates(start, 'DAILY', end);

      expect(dates).toHaveLength(5); // Apr 1, 2, 3, 4, 5
    });

    it('should generate BIWEEKLY dates (every 14 days)', () => {
      const start = new Date('2026-04-01');
      const end = new Date('2026-05-01');

      const dates = scheduling.generateRecurringDates(start, 'BIWEEKLY', end);

      // Apr 1, Apr 15, Apr 29 = 3 dates
      expect(dates).toHaveLength(3);
    });

    it('should generate MONTHLY dates using calendar month increments', () => {
      const start = new Date('2026-01-31');
      const end = new Date('2026-04-30');

      const dates = scheduling.generateRecurringDates(start, 'MONTHLY', end);

      // Jan 31, Feb 28 (overflow), Mar 28, Apr 28 ≤ Apr 30 → 4 dates
      expect(dates.length).toBeGreaterThanOrEqual(3);
    });

    it('should return only the start date when end is equal to start', () => {
      const start = new Date('2026-04-01');
      const end = new Date('2026-04-01');

      const dates = scheduling.generateRecurringDates(start, 'WEEKLY', end);

      expect(dates).toHaveLength(1);
    });

    it('should use 7-day interval for unknown patterns', () => {
      const start = new Date('2026-04-01');
      const end = new Date('2026-04-15');

      const dates = scheduling.generateRecurringDates(start, 'UNKNOWN_PATTERN', end);

      // Apr 1, Apr 8, Apr 15 = 3 dates (same as WEEKLY)
      expect(dates).toHaveLength(3);
    });
  });

  // =========================================================================
  // createRecurringAppointments
  // =========================================================================

  describe('createRecurringAppointments', () => {
    it('should return a result entry per recurring date', async () => {
      // Each validateBooking call makes 2 query calls (practitioner + patient conflict)
      // WEEKLY from Apr 7 to Apr 21 = 3 dates → 6 query calls total
      mockQuery.mockResolvedValue({ rows: [] }); // all slots free

      const base = {
        practitioner_id: PRAC_ID,
        patient_id: PAT_ID,
        start_time: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      };

      const recurringEnd = new Date(Date.now() + 22 * 24 * 60 * 60 * 1000);
      const results = await scheduling.createRecurringAppointments(
        ORG_ID,
        base,
        'WEEKLY',
        recurringEnd
      );

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]).toHaveProperty('date');
      expect(results[0]).toHaveProperty('valid');
      expect(results[0]).toHaveProperty('errors');
      expect(results[0]).toHaveProperty('data');
    });

    it('should mark occurrences with conflicts as invalid', async () => {
      // First occurrence: practitioner conflict detected
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'conflict-apt',
              patient_name: 'Conflict Patient',
              start_time: futureISO(200),
              end_time: futureISOOffset(200, 30),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const base = {
        practitioner_id: PRAC_ID,
        patient_id: PAT_ID,
        start_time: futureISO(200),
        end_time: futureISOOffset(200, 30),
      };

      const recurringEnd = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const results = await scheduling.createRecurringAppointments(
        ORG_ID,
        base,
        'DAILY',
        recurringEnd
      );

      const firstResult = results[0];
      expect(firstResult.valid).toBe(false);
    });
  });
});
