/**
 * Appointments Service Tests
 * Tests scheduling, status management, conflicts, and statistics
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock database module
const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
  getClient: jest.fn(),
  transaction: jest.fn(),
  savepoint: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  pool: null,
  initPGlite: null,
  execSQL: null,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

let appointments;

beforeEach(async () => {
  jest.clearAllMocks();
  appointments = await import('../../src/services/appointments.js');
});

describe('Appointments Service', () => {
  // =========================================================================
  // getAppointmentById
  // =========================================================================
  describe('getAppointmentById', () => {
    test('should return appointment with patient and practitioner names', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'apt-1',
            patient_name: 'Ola Nordmann',
            practitioner_name: 'Dr. Hansen',
            status: 'SCHEDULED',
            start_time: '2026-02-15T10:00:00',
            end_time: '2026-02-15T10:30:00',
          },
        ],
      });

      const result = await appointments.getAppointmentById('org-1', 'apt-1');

      expect(result.id).toBe('apt-1');
      expect(result.patient_name).toBe('Ola Nordmann');
      expect(result.status).toBe('SCHEDULED');
    });

    test('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointments.getAppointmentById('org-1', 'nonexistent');
      expect(result).toBeNull();
    });

    test('should filter by organization_id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await appointments.getAppointmentById('org-1', 'apt-1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('organization_id = $1');
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('apt-1');
    });
  });

  // =========================================================================
  // createAppointment
  // =========================================================================
  describe('createAppointment', () => {
    test('should create appointment with SCHEDULED status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'apt-1',
            status: 'SCHEDULED',
            patient_id: 'patient-1',
            start_time: '2026-02-15T10:00:00',
            end_time: '2026-02-15T10:30:00',
          },
        ],
      });

      const result = await appointments.createAppointment('org-1', {
        patient_id: 'patient-1',
        practitioner_id: 'prac-1',
        start_time: '2026-02-15T10:00:00',
        end_time: '2026-02-15T10:30:00',
        appointment_type: 'follow_up',
      });

      expect(result.status).toBe('SCHEDULED');
      expect(result.id).toBe('apt-1');
    });

    test('should pass recurring fields as null when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.createAppointment('org-1', {
        patient_id: 'p',
        practitioner_id: 'pr',
        start_time: '2026-02-15T10:00:00',
        end_time: '2026-02-15T10:30:00',
        appointment_type: 'follow_up',
      });

      const params = mockQuery.mock.calls[0][1];
      // recurring_pattern and recurring_end_date should be null
      expect(params[7]).toBeNull();
      expect(params[8]).toBeNull();
    });

    test('should include recurring pattern when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.createAppointment('org-1', {
        patient_id: 'p',
        practitioner_id: 'pr',
        start_time: '2026-02-15T10:00:00',
        end_time: '2026-02-15T10:30:00',
        appointment_type: 'follow_up',
        recurring_pattern: 'weekly',
        recurring_end_date: '2026-05-15',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[7]).toBe('weekly');
      expect(params[8]).toBe('2026-05-15');
    });

    test('should include patient notes when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.createAppointment('org-1', {
        patient_id: 'p',
        practitioner_id: 'pr',
        start_time: '2026-02-15T10:00:00',
        end_time: '2026-02-15T10:30:00',
        appointment_type: 'initial',
        patient_notes: 'Low back pain for 2 weeks',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[9]).toBe('Low back pain for 2 weeks');
    });
  });

  // =========================================================================
  // updateAppointment
  // =========================================================================
  describe('updateAppointment', () => {
    test('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1', status: 'CONFIRMED' }],
      });

      const result = await appointments.updateAppointment('org-1', 'apt-1', {
        status: 'CONFIRMED',
      });

      expect(result.status).toBe('CONFIRMED');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('status = $3');
      expect(sql).toContain('updated_at = NOW()');
    });

    test('should throw on empty update', async () => {
      await expect(appointments.updateAppointment('org-1', 'apt-1', {})).rejects.toThrow(
        'No fields to update'
      );
    });

    test('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointments.updateAppointment('org-1', 'nonexistent', {
        status: 'CONFIRMED',
      });
      expect(result).toBeNull();
    });

    test('should allow updating multiple fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1' }],
      });

      await appointments.updateAppointment('org-1', 'apt-1', {
        start_time: '2026-02-20T14:00:00',
        end_time: '2026-02-20T14:30:00',
        patient_notes: 'Rescheduled',
      });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('start_time');
      expect(sql).toContain('end_time');
      expect(sql).toContain('patient_notes');
    });

    test('should reject unknown fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1' }],
      });

      // unknown_field should be ignored, leaving no valid fields
      await expect(
        appointments.updateAppointment('org-1', 'apt-1', {
          unknown_field: 'value',
        })
      ).rejects.toThrow('No fields to update');
    });
  });

  // =========================================================================
  // confirmAppointment
  // =========================================================================
  describe('confirmAppointment', () => {
    test('should confirm and record who confirmed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'apt-1',
            status: 'CONFIRMED',
            confirmed_at: '2026-02-10T12:00:00',
            confirmed_by: 'user-1',
          },
        ],
      });

      const result = await appointments.confirmAppointment('org-1', 'apt-1', 'user-1');

      expect(result.status).toBe('CONFIRMED');
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("status = 'CONFIRMED'");
      expect(sql).toContain('confirmed_at = NOW()');
      expect(params[2]).toBe('user-1');
    });

    test('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointments.confirmAppointment('org-1', 'nonexistent', 'user-1');
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // checkInAppointment
  // =========================================================================
  describe('checkInAppointment', () => {
    test('should check in and record time', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1', status: 'CHECKED_IN' }],
      });

      const result = await appointments.checkInAppointment('org-1', 'apt-1');

      expect(result.status).toBe('CHECKED_IN');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("status = 'CHECKED_IN'");
      expect(sql).toContain('checked_in_at = NOW()');
    });

    test('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointments.checkInAppointment('org-1', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // updateAppointmentStatus
  // =========================================================================
  describe('updateAppointmentStatus', () => {
    test('should update status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1', status: 'COMPLETED' }],
      });

      const result = await appointments.updateAppointmentStatus(
        'org-1',
        'apt-1',
        'COMPLETED',
        'user-1'
      );

      expect(result.status).toBe('COMPLETED');
    });

    test('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointments.updateAppointmentStatus('org-1', 'apt-1', 'COMPLETED', 'u');
      expect(result).toBeNull();
    });

    test('should use parameterized query for status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.updateAppointmentStatus('org-1', 'apt-1', 'NO_SHOW', 'user-1');

      const params = mockQuery.mock.calls[0][1];
      expect(params[2]).toBe('NO_SHOW');
    });
  });

  // =========================================================================
  // cancelAppointment
  // =========================================================================
  describe('cancelAppointment', () => {
    test('should cancel with reason', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1', status: 'CANCELLED', cancellation_reason: 'Patient request' }],
      });

      const result = await appointments.cancelAppointment(
        'org-1',
        'apt-1',
        'Patient request',
        'user-1'
      );

      expect(result.status).toBe('CANCELLED');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("status = 'CANCELLED'");
      expect(sql).toContain('cancelled_at = NOW()');
    });

    test('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointments.cancelAppointment('org-1', 'nonexistent', 'reason', 'u');
      expect(result).toBeNull();
    });

    test('should store cancellation reason', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.cancelAppointment('org-1', 'apt-1', 'Sick patient', 'user-1');

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('Sick patient');
    });
  });

  // =========================================================================
  // getAllAppointments
  // =========================================================================
  describe('getAllAppointments', () => {
    test('should return appointments for organization', async () => {
      // Count query
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] });
      // Data query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'apt-1', status: 'SCHEDULED' },
          { id: 'apt-2', status: 'CONFIRMED' },
          { id: 'apt-3', status: 'COMPLETED' },
        ],
      });

      const result = await appointments.getAllAppointments('org-1');

      expect(result.appointments).toHaveLength(3);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(3);
    });

    test('should filter by date', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.getAllAppointments('org-1', { startDate: '2026-02-15' });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('a.start_time >= $2');
      expect(params).toContain('2026-02-15');
    });

    test('should filter by practitioner', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.getAllAppointments('org-1', { practitionerId: 'prac-1' });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('prac-1');
    });

    test('should filter by status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.getAllAppointments('org-1', { status: 'SCHEDULED' });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('SCHEDULED');
    });

    test('should support pagination', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '50' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointments.getAllAppointments('org-1', { page: 3, limit: 10 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.pages).toBe(5);
    });
  });

  // =========================================================================
  // getAppointmentStats
  // =========================================================================
  describe('getAppointmentStats', () => {
    test('should return statistics for date range', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total: '50',
            scheduled: '10',
            confirmed: '15',
            completed: '20',
            cancelled: '3',
            no_show: '2',
          },
        ],
      });

      const result = await appointments.getAppointmentStats('org-1', '2026-01-01', '2026-01-31');

      expect(result).toBeDefined();
      expect(mockQuery.mock.calls[0][1]).toContain('org-1');
    });

    test('should use parameterized date range', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] });

      await appointments.getAppointmentStats('org-1', '2026-02-01', '2026-02-28');

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('2026-02-01');
      expect(params).toContain('2026-02-28');
    });
  });

  // =========================================================================
  // SQL injection prevention
  // =========================================================================
  describe('SQL injection prevention', () => {
    test('createAppointment should use parameterized query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.createAppointment('org-1', {
        patient_id: "'; DROP TABLE appointments; --",
        practitioner_id: 'prac-1',
        start_time: '2026-02-15T10:00:00',
        end_time: '2026-02-15T10:30:00',
        appointment_type: 'follow_up',
      });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('$1');
      expect(sql).not.toContain('DROP TABLE');
      expect(params[1]).toBe("'; DROP TABLE appointments; --");
    });

    test('updateAppointment should use parameterized query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] });

      await appointments.updateAppointment('org-1', 'apt-1', {
        patient_notes: "'; DROP TABLE appointments; --",
      });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).not.toContain('DROP TABLE');
    });
  });
});
