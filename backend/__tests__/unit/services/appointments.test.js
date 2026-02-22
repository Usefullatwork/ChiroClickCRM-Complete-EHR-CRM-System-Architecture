/**
 * Unit Tests for Appointments Service
 * Tests appointment CRUD, status transitions, conflict detection, and statistics
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
    queryWithTenant: jest.fn(),
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
const appointmentsService = await import('../../../src/services/appointments.js');

describe('Appointments Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // GET APPOINTMENT BY ID
  // =============================================================================

  describe('getAppointmentById', () => {
    it('should return appointment with patient and practitioner details', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'apt-123',
            organization_id: testOrgId,
            patient_id: 'pat-1',
            practitioner_id: 'prac-1',
            patient_name: 'Ola Nordmann',
            practitioner_name: 'Dr. Hansen',
            start_time: '2026-02-22T10:00:00Z',
            end_time: '2026-02-22T10:30:00Z',
            status: 'SCHEDULED',
          },
        ],
      });

      const result = await appointmentsService.getAppointmentById(testOrgId, 'apt-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('apt-123');
      expect(result.patient_name).toBe('Ola Nordmann');
      expect(result.practitioner_name).toBe('Dr. Hansen');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointmentsService.getAppointmentById(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(appointmentsService.getAppointmentById(testOrgId, 'apt-123')).rejects.toThrow(
        'DB error'
      );
    });
  });

  // =============================================================================
  // CREATE APPOINTMENT
  // =============================================================================

  describe('createAppointment', () => {
    it('should create an appointment with all required fields', async () => {
      const newAppointment = {
        id: 'apt-new',
        organization_id: testOrgId,
        patient_id: 'pat-1',
        practitioner_id: 'prac-1',
        start_time: '2026-02-23T09:00:00Z',
        end_time: '2026-02-23T09:30:00Z',
        appointment_type: 'INITIAL',
        status: 'SCHEDULED',
      };

      mockQuery.mockResolvedValueOnce({ rows: [newAppointment] });

      const result = await appointmentsService.createAppointment(testOrgId, {
        patient_id: 'pat-1',
        practitioner_id: 'prac-1',
        start_time: '2026-02-23T09:00:00Z',
        end_time: '2026-02-23T09:30:00Z',
        appointment_type: 'INITIAL',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('apt-new');
      expect(result.status).toBe('SCHEDULED');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle optional fields (recurring, notes)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'apt-recurring',
            recurring_pattern: 'weekly',
            patient_notes: 'Prefer mornings',
          },
        ],
      });

      const result = await appointmentsService.createAppointment(testOrgId, {
        patient_id: 'pat-1',
        practitioner_id: 'prac-1',
        start_time: '2026-02-23T09:00:00Z',
        end_time: '2026-02-23T09:30:00Z',
        appointment_type: 'FOLLOWUP',
        recurring_pattern: 'weekly',
        patient_notes: 'Prefer mornings',
      });

      expect(result.recurring_pattern).toBe('weekly');
      expect(result.patient_notes).toBe('Prefer mornings');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        appointmentsService.createAppointment(testOrgId, {
          patient_id: 'pat-1',
          practitioner_id: 'prac-1',
          start_time: '2026-02-23T09:00:00Z',
          end_time: '2026-02-23T09:30:00Z',
          appointment_type: 'INITIAL',
        })
      ).rejects.toThrow('Insert failed');
    });
  });

  // =============================================================================
  // UPDATE APPOINTMENT
  // =============================================================================

  describe('updateAppointment', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'apt-123',
            status: 'CONFIRMED',
            patient_notes: 'Updated notes',
          },
        ],
      });

      const result = await appointmentsService.updateAppointment(testOrgId, 'apt-123', {
        status: 'CONFIRMED',
        patient_notes: 'Updated notes',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('CONFIRMED');
    });

    it('should throw when no valid fields provided', async () => {
      await expect(
        appointmentsService.updateAppointment(testOrgId, 'apt-123', {
          invalid_field: 'value',
        })
      ).rejects.toThrow('No fields to update');
    });

    it('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointmentsService.updateAppointment(testOrgId, 'non-existent', {
        status: 'CONFIRMED',
      });

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // GET ALL APPOINTMENTS (PAGINATION & FILTERS)
  // =============================================================================

  describe('getAllAppointments', () => {
    it('should return paginated appointments with defaults', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'apt-1', status: 'SCHEDULED' },
          { id: 'apt-2', status: 'CONFIRMED' },
          { id: 'apt-3', status: 'COMPLETED' },
        ],
      });

      const result = await appointmentsService.getAllAppointments(testOrgId);

      expect(result.appointments).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by practitioner', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'apt-1', practitioner_id: 'prac-1' }] });

      const result = await appointmentsService.getAllAppointments(testOrgId, {
        practitionerId: 'prac-1',
      });

      expect(result.appointments).toHaveLength(1);
      const countQuery = mockQuery.mock.calls[0];
      expect(countQuery[1]).toContain('prac-1');
    });

    it('should filter by status', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'apt-1' }, { id: 'apt-2' }] });

      await appointmentsService.getAllAppointments(testOrgId, { status: 'SCHEDULED' });

      const countQuery = mockQuery.mock.calls[0];
      expect(countQuery[1]).toContain('SCHEDULED');
    });

    it('should filter by date range', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] });

      await appointmentsService.getAllAppointments(testOrgId, {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('2026-02-01');
      expect(countParams).toContain('2026-02-28');
    });

    it('should handle empty result', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await appointmentsService.getAllAppointments(testOrgId);

      expect(result.appointments).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  // =============================================================================
  // STATUS TRANSITIONS
  // =============================================================================

  describe('confirmAppointment', () => {
    it('should confirm an appointment', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-123', status: 'CONFIRMED', confirmed_at: '2026-02-22T08:00:00Z' }],
      });

      const result = await appointmentsService.confirmAppointment(testOrgId, 'apt-123', 'user-1');

      expect(result).toBeDefined();
      expect(result.status).toBe('CONFIRMED');
    });

    it('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointmentsService.confirmAppointment(
        testOrgId,
        'non-existent',
        'user-1'
      );

      expect(result).toBeNull();
    });
  });

  describe('checkInAppointment', () => {
    it('should check in an appointment', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-123', status: 'CHECKED_IN', checked_in_at: '2026-02-22T09:55:00Z' }],
      });

      const result = await appointmentsService.checkInAppointment(testOrgId, 'apt-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('CHECKED_IN');
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel an appointment with reason', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'apt-123',
            status: 'CANCELLED',
            cancellation_reason: 'Patient request',
          },
        ],
      });

      const result = await appointmentsService.cancelAppointment(
        testOrgId,
        'apt-123',
        'Patient request',
        'user-1'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('CANCELLED');
      expect(result.cancellation_reason).toBe('Patient request');
    });

    it('should return null for non-existent appointment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await appointmentsService.cancelAppointment(
        testOrgId,
        'non-existent',
        'Test',
        'user-1'
      );

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // APPOINTMENT STATS
  // =============================================================================

  describe('getAppointmentStats', () => {
    it('should return appointment statistics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total: '20',
            completed: '15',
            no_shows: '2',
            cancelled: '3',
            confirmed: '18',
          },
        ],
      });

      const result = await appointmentsService.getAppointmentStats(
        testOrgId,
        '2026-02-01',
        '2026-02-28'
      );

      expect(result.total).toBe('20');
      expect(result.completed).toBe('15');
      expect(result.no_shows).toBe('2');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Stats error'));

      await expect(
        appointmentsService.getAppointmentStats(testOrgId, '2026-02-01', '2026-02-28')
      ).rejects.toThrow('Stats error');
    });
  });
});
