/**
 * Unit Tests for Portal Service (staff-facing patient portal data access)
 * Tests dashboard, appointments, exercises, outcomes, magic links, portal access,
 * booking request management, and patient messaging.
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
  getClient: jest.fn(),
  default: {
    query: mockQuery,
    transaction: mockTransaction,
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

jest.unstable_mockModule('../../../src/services/communication/communications.js', () => ({
  sendSMS: jest.fn(),
  sendEmail: jest.fn(),
  default: {
    sendSMS: jest.fn(),
    sendEmail: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/communication/pushNotification.js', () => ({
  sendPushToPatient: jest.fn(),
  default: {
    sendPushToPatient: jest.fn(),
  },
}));

const portalService = await import('../../../src/services/practice/portal.js');

const ORG_ID = 'org-001';
const PATIENT_ID = 'pat-001';
const USER_ID = 'user-001';

describe('Portal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // GET PATIENT DASHBOARD
  // =============================================================================

  describe('getPatientDashboard', () => {
    it('should return null when patient is not found in the organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.getPatientDashboard(ORG_ID, PATIENT_ID);

      expect(result).toBeNull();
    });

    it('should return dashboard with patient info and parsed counts', async () => {
      const patient = {
        id: PATIENT_ID,
        first_name: 'Ola',
        last_name: 'Nordmann',
        email: 'ola@example.com',
        phone: '+4712345678',
        date_of_birth: '1990-01-01',
        status: 'active',
        portal_enabled: true,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [patient] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const result = await portalService.getPatientDashboard(ORG_ID, PATIENT_ID);

      expect(result.patient).toEqual({
        id: PATIENT_ID,
        firstName: 'Ola',
        lastName: 'Nordmann',
        email: 'ola@example.com',
        phone: '+4712345678',
        dateOfBirth: '1990-01-01',
        status: 'active',
        portalEnabled: true,
      });
      expect(result.counts).toEqual({
        upcomingAppointments: 3,
        activeExercises: 5,
        outcomeSubmissions: 2,
      });
    });

    it('should default exercise and outcome counts to 0 when tables do not exist', async () => {
      const patient = {
        id: PATIENT_ID,
        first_name: 'Kari',
        last_name: 'Hansen',
        email: 'kari@example.com',
        phone: null,
        date_of_birth: '1985-06-15',
        status: 'active',
        portal_enabled: false,
      };

      const tableError = new Error('relation "patient_exercise_prescriptions" does not exist');

      mockQuery
        .mockResolvedValueOnce({ rows: [patient] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockRejectedValueOnce(tableError)
        .mockRejectedValueOnce(tableError);

      const result = await portalService.getPatientDashboard(ORG_ID, PATIENT_ID);

      expect(result.counts.activeExercises).toBe(0);
      expect(result.counts.outcomeSubmissions).toBe(0);
    });
  });

  // =============================================================================
  // GET PATIENT APPOINTMENTS
  // =============================================================================

  describe('getPatientAppointments', () => {
    it('should return all appointments when upcomingOnly is false', async () => {
      const rows = [
        { id: 'apt-1', appointment_date: '2026-01-01', status: 'completed' },
        { id: 'apt-2', appointment_date: '2026-04-01', status: 'confirmed' },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await portalService.getPatientAppointments(ORG_ID, PATIENT_ID, false);

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(expect.not.stringContaining('CURRENT_DATE'), [
        PATIENT_ID,
        ORG_ID,
      ]);
    });

    it('should filter to upcoming non-cancelled appointments when upcomingOnly is true', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await portalService.getPatientAppointments(ORG_ID, PATIENT_ID, true);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CURRENT_DATE'), [
        PATIENT_ID,
        ORG_ID,
      ]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("'cancelled'"),
        expect.any(Array)
      );
    });
  });

  // =============================================================================
  // CREATE PATIENT APPOINTMENT
  // =============================================================================

  describe('createPatientAppointment', () => {
    it('should return null when patient does not belong to the organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.createPatientAppointment(
        ORG_ID,
        PATIENT_ID,
        { appointment_date: '2026-04-10', appointment_time: '10:00', duration: 30 },
        USER_ID
      );

      expect(result).toBeNull();
    });

    it('should insert appointment with defaults and return the created row', async () => {
      const created = {
        id: 'apt-new',
        patient_id: PATIENT_ID,
        organization_id: ORG_ID,
        status: 'pending',
        duration: 30,
        visit_type: 'consultation',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: PATIENT_ID }] })
        .mockResolvedValueOnce({ rows: [created] });

      const result = await portalService.createPatientAppointment(
        ORG_ID,
        PATIENT_ID,
        { appointment_date: '2026-04-10', appointment_time: '10:00' },
        USER_ID
      );

      expect(result).toEqual(created);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO appointments'),
        expect.arrayContaining([PATIENT_ID, ORG_ID, '2026-04-10', '10:00', 30, 'consultation'])
      );
    });

    it('should use provided duration and visit_type when specified', async () => {
      const created = {
        id: 'apt-new2',
        duration: 60,
        visit_type: 'follow_up',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: PATIENT_ID }] })
        .mockResolvedValueOnce({ rows: [created] });

      const result = await portalService.createPatientAppointment(
        ORG_ID,
        PATIENT_ID,
        {
          appointment_date: '2026-04-15',
          appointment_time: '14:00',
          duration: 60,
          visit_type: 'follow_up',
        },
        USER_ID
      );

      expect(result).toEqual(created);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO appointments'),
        expect.arrayContaining([60, 'follow_up'])
      );
    });
  });

  // =============================================================================
  // GET PATIENT EXERCISES
  // =============================================================================

  describe('getPatientExercises', () => {
    it('should return active exercise prescriptions joined with library data', async () => {
      const rows = [
        { id: 'pep-1', exercise_id: 'ex-1', sets: 3, reps: 10, name: 'Plank', status: 'active' },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await portalService.getPatientExercises(ORG_ID, PATIENT_ID);

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('exercise_library'), [
        PATIENT_ID,
        ORG_ID,
      ]);
    });

    it('should return empty array when patient has no active exercises', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.getPatientExercises(ORG_ID, PATIENT_ID);

      expect(result).toEqual([]);
    });
  });

  // =============================================================================
  // GET PATIENT OUTCOMES
  // =============================================================================

  describe('getPatientOutcomes', () => {
    it('should return outcome submissions joined with questionnaire data', async () => {
      const rows = [
        { id: 'os-1', questionnaire_id: 'q-1', score: 14, name: 'NDI', submitted_at: new Date() },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await portalService.getPatientOutcomes(ORG_ID, PATIENT_ID);

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('outcome_submissions'), [
        PATIENT_ID,
        ORG_ID,
      ]);
    });
  });

  // =============================================================================
  // GENERATE MAGIC LINK
  // =============================================================================

  describe('generateMagicLink', () => {
    it('should return null when patient is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.generateMagicLink(ORG_ID, PATIENT_ID, '127.0.0.1');

      expect(result).toBeNull();
    });

    it('should return a token, expiry, and patient info when patient exists', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: PATIENT_ID, email: 'ola@example.com', first_name: 'Ola' }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const result = await portalService.generateMagicLink(ORG_ID, PATIENT_ID, '127.0.0.1');

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token).toHaveLength(64);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.patient).toEqual({ id: PATIENT_ID, firstName: 'Ola' });
    });

    it('should silently ignore missing portal_sessions table', async () => {
      const tableError = new Error('relation "portal_sessions" does not exist');

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: PATIENT_ID, email: 'ola@example.com', first_name: 'Ola' }],
        })
        .mockRejectedValueOnce(tableError);

      const result = await portalService.generateMagicLink(ORG_ID, PATIENT_ID, '127.0.0.1');

      expect(result.token).toBeDefined();
    });

    it('should rethrow unexpected database errors from portal_sessions insert', async () => {
      const dbError = new Error('connection refused');

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: PATIENT_ID, email: 'ola@example.com', first_name: 'Ola' }],
        })
        .mockRejectedValueOnce(dbError);

      await expect(
        portalService.generateMagicLink(ORG_ID, PATIENT_ID, '127.0.0.1')
      ).rejects.toThrow('connection refused');
    });
  });

  // =============================================================================
  // SET PORTAL ACCESS
  // =============================================================================

  describe('setPortalAccess', () => {
    it('should return null when patient does not belong to the organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.setPortalAccess(ORG_ID, PATIENT_ID, '1234');

      expect(result).toBeNull();
    });

    it('should hash the PIN and update the patient record', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: PATIENT_ID }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await portalService.setPortalAccess(ORG_ID, PATIENT_ID, '5678');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE patients SET portal_pin_hash'),
        expect.arrayContaining([PATIENT_ID])
      );
    });
  });

  // =============================================================================
  // LIST BOOKING REQUESTS
  // =============================================================================

  describe('listBookingRequests', () => {
    it('should return paginated booking requests with default page and limit', async () => {
      const rows = [{ id: 'req-1', status: 'PENDING', first_name: 'Ola' }];

      mockQuery.mockResolvedValueOnce({ rows }).mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const result = await portalService.listBookingRequests(ORG_ID);

      expect(result.requests).toEqual(rows);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should filter by status when status filter is provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await portalService.listBookingRequests(ORG_ID, { status: 'PENDING' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('pbr.status = $2'),
        expect.arrayContaining([ORG_ID, 'PENDING'])
      );
    });

    it('should honour custom page and limit pagination parameters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '50' }] });

      const result = await portalService.listBookingRequests(ORG_ID, { page: 3, limit: 10 });

      expect(result.pagination).toEqual({ page: 3, limit: 10, total: 50 });
    });
  });

  // =============================================================================
  // HANDLE BOOKING REQUEST
  // =============================================================================

  describe('handleBookingRequest', () => {
    it('should return null when booking request is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.handleBookingRequest(ORG_ID, 'req-999', 'approve', {
        appointment_date: '2026-04-10',
        appointment_time: '10:00',
        userId: USER_ID,
      });

      expect(result).toBeNull();
    });

    it('should use transaction for approve action and return CONFIRMED status', async () => {
      const bookingReq = {
        id: 'req-1',
        organization_id: ORG_ID,
        patient_id: PATIENT_ID,
        preferred_date: '2026-04-10',
        preferred_time_slot: '10:00',
        reason: 'Ryggsmerte',
        status: 'PENDING',
        handled_by: null,
        appointment_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [bookingReq] });

      const appointmentId = 'apt-created';
      mockTransaction.mockImplementation(async (fn) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rows: [{ id: appointmentId }] })
            .mockResolvedValueOnce({ rows: [] }),
        };
        return fn(mockClient);
      });

      const result = await portalService.handleBookingRequest(ORG_ID, 'req-1', 'approve', {
        appointment_date: '2026-04-10',
        appointment_time: '10:00',
        duration: 30,
        visit_type: 'consultation',
        userId: USER_ID,
      });

      expect(result.status).toBe('CONFIRMED');
      expect(result.appointment_id).toBe(appointmentId);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should reject by updating status to REJECTED without a transaction', async () => {
      const bookingReq = {
        id: 'req-2',
        organization_id: ORG_ID,
        patient_id: PATIENT_ID,
        preferred_date: '2026-04-15',
        preferred_time_slot: null,
        reason: 'Nakkesmerte',
        status: 'PENDING',
        handled_by: null,
        appointment_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [bookingReq] }).mockResolvedValueOnce({ rows: [] });

      const result = await portalService.handleBookingRequest(ORG_ID, 'req-2', 'reject', {
        userId: USER_ID,
      });

      expect(result.status).toBe('REJECTED');
      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'REJECTED'"),
        expect.arrayContaining([USER_ID, 'req-2'])
      );
    });
  });

  // =============================================================================
  // GET BOOKING REQUEST COUNT
  // =============================================================================

  describe('getBookingRequestCount', () => {
    it('should return the number of pending booking requests', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '7' }] });

      const result = await portalService.getBookingRequestCount(ORG_ID);

      expect(result).toBe(7);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("status = 'PENDING'"), [
        ORG_ID,
      ]);
    });
  });

  // =============================================================================
  // GET PATIENT MESSAGES
  // =============================================================================

  describe('getPatientMessages', () => {
    it('should return null when patient does not belong to the organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.getPatientMessages(ORG_ID, PATIENT_ID);

      expect(result).toBeNull();
    });

    it('should return paginated messages with total count', async () => {
      const messages = [{ id: 'msg-1', subject: 'Oppdatering', is_read: true }];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: PATIENT_ID }] })
        .mockResolvedValueOnce({ rows: messages })
        .mockResolvedValueOnce({ rows: [{ total: '10' }] });

      const result = await portalService.getPatientMessages(ORG_ID, PATIENT_ID, {
        page: 1,
        limit: 50,
      });

      expect(result.messages).toEqual(messages);
      expect(result.pagination).toEqual({ page: 1, limit: 50, total: 10 });
    });

    it('should use default page 1 and limit 50 when no pagination is provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: PATIENT_ID }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const result = await portalService.getPatientMessages(ORG_ID, PATIENT_ID);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
    });
  });

  // =============================================================================
  // SEND PATIENT MESSAGE
  // =============================================================================

  describe('sendPatientMessage', () => {
    it('should return null when patient does not belong to the organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.sendPatientMessage(
        ORG_ID,
        PATIENT_ID,
        { subject: 'Hei', body: 'Melding' },
        USER_ID
      );

      expect(result).toBeNull();
    });

    it('should insert message and return the saved row', async () => {
      const savedMessage = {
        id: 'msg-new',
        patient_id: PATIENT_ID,
        organization_id: ORG_ID,
        sender_type: 'CLINICIAN',
        subject: 'Timebekreftelse',
        body: 'Din time er bekreftet.',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: PATIENT_ID, phone: null, first_name: 'Ola' }] })
        .mockResolvedValueOnce({ rows: [savedMessage] });

      const result = await portalService.sendPatientMessage(
        ORG_ID,
        PATIENT_ID,
        { subject: 'Timebekreftelse', body: 'Din time er bekreftet.' },
        USER_ID
      );

      expect(result).toEqual(savedMessage);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("'CLINICIAN'"),
        expect.arrayContaining([PATIENT_ID, ORG_ID, USER_ID])
      );
    });

    it('should send SMS notification when patient has a phone number', async () => {
      const savedMessage = { id: 'msg-2', subject: 'Info', body: 'Noe viktig' };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: PATIENT_ID, phone: '+4712345678', first_name: 'Ola' }],
        })
        .mockResolvedValueOnce({ rows: [savedMessage] });

      const { sendSMS } = await import('../../../src/services/communication/communications.js');
      sendSMS.mockResolvedValueOnce({});

      await portalService.sendPatientMessage(
        ORG_ID,
        PATIENT_ID,
        { subject: 'Info', body: 'Noe viktig' },
        USER_ID
      );

      expect(sendSMS).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ to: '+4712345678' }),
        USER_ID
      );
    });

    it('should continue and return the saved message even when SMS sending fails', async () => {
      const savedMessage = { id: 'msg-3', subject: 'Test', body: 'Innhold' };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: PATIENT_ID, phone: '+4799999999', first_name: 'Kari' }],
        })
        .mockResolvedValueOnce({ rows: [savedMessage] });

      const { sendSMS } = await import('../../../src/services/communication/communications.js');
      sendSMS.mockRejectedValueOnce(new Error('Twilio down'));

      const result = await portalService.sendPatientMessage(
        ORG_ID,
        PATIENT_ID,
        { subject: 'Test', body: 'Innhold' },
        USER_ID
      );

      expect(result).toEqual(savedMessage);
    });
  });
});
