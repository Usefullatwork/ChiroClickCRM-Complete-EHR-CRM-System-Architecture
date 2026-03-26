/**
 * Unit Tests for Patient Portal Controller — Audit Logging
 * Verifies that every patient action emits a logAction call with the
 * correct action type, resourceType, and patient identity.
 */

import { jest } from '@jest/globals';

// --- Mock auditLog service ---
const mockLogAction = jest.fn().mockResolvedValue(null);

jest.unstable_mockModule('../../../src/services/auditLog.js', () => ({
  logAction: mockLogAction,
  default: { logAction: mockLogAction },
}));

// --- Mock patientPortal service ---
const mockService = {
  getProfile: jest.fn(),
  getAppointments: jest.fn(),
  getExercises: jest.fn(),
  logExerciseCompliance: jest.fn(),
  getAvailableSlots: jest.fn(),
  requestBooking: jest.fn(),
  rescheduleAppointment: jest.fn(),
  cancelAppointment: jest.fn(),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  markMessageRead: jest.fn(),
  getDocuments: jest.fn(),
  downloadDocument: jest.fn(),
  getCommPreferences: jest.fn(),
  updateCommPreferences: jest.fn(),
  logout: jest.fn(),
  DEFAULT_COMM_PREFERENCES: { email: true, sms: true, push: true },
};

jest.unstable_mockModule('../../../src/services/patientPortal.js', () => mockService);

// --- Mock logger ---
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const ctrl = await import('../../../src/controllers/patientPortal.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PATIENT_ID = 'patient-uuid-001';
const ORG_ID = 'org-uuid-001';

function makePortalReq(overrides = {}) {
  return {
    portalPatient: {
      patient_id: PATIENT_ID,
      organization_id: ORG_ID,
      first_name: 'Ola',
      last_name: 'Nordmann',
      ...overrides.portalPatient,
    },
    ip: '127.0.0.1',
    query: {},
    params: {},
    body: {},
    cookies: {},
    headers: {},
    ...overrides,
  };
}

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    setHeader: jest.fn(),
    send: jest.fn(),
    clearCookie: jest.fn(),
    cookie: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Patient Portal Controller — audit logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getAppointments
  // -------------------------------------------------------------------------

  describe('getAppointments', () => {
    it('should call logAction with portal.appointments.read on success', async () => {
      mockService.getAppointments.mockResolvedValue([]);
      const req = makePortalReq();
      const res = makeRes();

      await ctrl.getAppointments(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.appointments.read',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'portal_appointments',
          resourceId: PATIENT_ID,
          ipAddress: '127.0.0.1',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // logExerciseCompliance
  // -------------------------------------------------------------------------

  describe('logExerciseCompliance', () => {
    it('should call logAction with portal.exercise.compliance.create on success', async () => {
      const prescriptionId = 'rx-uuid-001';
      mockService.logExerciseCompliance.mockResolvedValue({ id: 'compliance-001' });
      const req = makePortalReq({
        params: { id: prescriptionId },
        body: { completed: true, pain_level: 3 },
      });
      const res = makeRes();

      await ctrl.logExerciseCompliance(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.exercise.compliance.create',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'exercise_compliance',
          resourceId: prescriptionId,
          ipAddress: '127.0.0.1',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // requestBooking
  // -------------------------------------------------------------------------

  describe('requestBooking', () => {
    it('should call logAction with portal.booking.create on success', async () => {
      mockService.requestBooking.mockResolvedValue({ id: 'booking-001' });
      const req = makePortalReq({
        body: { preferredDate: '2026-04-01', preferredTime: '10:00', reason: 'Follow-up' },
      });
      const res = makeRes();

      await ctrl.requestBooking(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.booking.create',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'booking_request',
          resourceId: 'booking-001',
          ipAddress: '127.0.0.1',
          metadata: expect.objectContaining({
            preferredDate: '2026-04-01',
            preferredTime: '10:00',
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // rescheduleAppointment
  // -------------------------------------------------------------------------

  describe('rescheduleAppointment', () => {
    it('should call logAction with portal.appointment.reschedule on success', async () => {
      const apptId = 'appt-uuid-001';
      mockService.rescheduleAppointment.mockResolvedValue({ id: apptId, status: 'pending' });
      const req = makePortalReq({
        params: { id: apptId },
        body: { preferredDate: '2026-05-01', preferredTime: '14:00' },
      });
      const res = makeRes();

      await ctrl.rescheduleAppointment(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.appointment.reschedule',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'appointment',
          resourceId: apptId,
          ipAddress: '127.0.0.1',
        })
      );
    });

    it('should NOT call logAction when appointment is NOT_FOUND', async () => {
      mockService.rescheduleAppointment.mockResolvedValue({ error: 'NOT_FOUND' });
      const req = makePortalReq({
        params: { id: 'missing-appt' },
        body: { preferredDate: '2026-05-01', preferredTime: '14:00' },
      });
      const res = makeRes();

      await ctrl.rescheduleAppointment(req, res);

      expect(mockLogAction).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // cancelAppointment
  // -------------------------------------------------------------------------

  describe('cancelAppointment', () => {
    it('should call logAction with portal.appointment.cancel on success', async () => {
      const apptId = 'appt-uuid-002';
      mockService.cancelAppointment.mockResolvedValue({ id: apptId, status: 'cancelled' });
      const req = makePortalReq({
        params: { id: apptId },
        body: { reason: 'Cannot attend' },
      });
      const res = makeRes();

      await ctrl.cancelAppointment(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.appointment.cancel',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'appointment',
          resourceId: apptId,
          ipAddress: '127.0.0.1',
          metadata: expect.objectContaining({ reason: 'Cannot attend' }),
        })
      );
    });

    it('should NOT call logAction when appointment is NOT_FOUND', async () => {
      mockService.cancelAppointment.mockResolvedValue({ error: 'NOT_FOUND' });
      const req = makePortalReq({ params: { id: 'missing' }, body: { reason: 'test' } });
      const res = makeRes();

      await ctrl.cancelAppointment(req, res);

      expect(mockLogAction).not.toHaveBeenCalled();
    });

    it('should NOT call logAction when appointment is ALREADY_CANCELLED', async () => {
      mockService.cancelAppointment.mockResolvedValue({ error: 'ALREADY_CANCELLED' });
      const req = makePortalReq({ params: { id: 'cancelled-appt' }, body: { reason: 'test' } });
      const res = makeRes();

      await ctrl.cancelAppointment(req, res);

      expect(mockLogAction).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getMessages
  // -------------------------------------------------------------------------

  describe('getMessages', () => {
    it('should call logAction with portal.messages.read on success', async () => {
      mockService.getMessages.mockResolvedValue({
        messages: [],
        unread_count: 0,
        pagination: { page: 1, limit: 20, total: 0 },
      });
      const req = makePortalReq({ query: { page: '2', limit: '10' } });
      const res = makeRes();

      await ctrl.getMessages(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.messages.read',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'portal_messages',
          resourceId: PATIENT_ID,
          ipAddress: '127.0.0.1',
          metadata: expect.objectContaining({ page: 2, limit: 10 }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // sendMessage
  // -------------------------------------------------------------------------

  describe('sendMessage', () => {
    it('should call logAction with portal.message.create on success', async () => {
      mockService.sendMessage.mockResolvedValue({ id: 'msg-001', body: 'Hello' });
      const req = makePortalReq({ body: { subject: 'Question', body: 'Hello' } });
      const res = makeRes();

      await ctrl.sendMessage(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.message.create',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'portal_message',
          resourceId: 'msg-001',
          ipAddress: '127.0.0.1',
          metadata: expect.objectContaining({ subject: 'Question' }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // markMessageRead
  // -------------------------------------------------------------------------

  describe('markMessageRead', () => {
    it('should call logAction with portal.message.read on success', async () => {
      const msgId = 'msg-uuid-007';
      mockService.markMessageRead.mockResolvedValue(undefined);
      const req = makePortalReq({ params: { id: msgId } });
      const res = makeRes();

      await ctrl.markMessageRead(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.message.read',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'portal_message',
          resourceId: msgId,
          ipAddress: '127.0.0.1',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // getDocuments
  // -------------------------------------------------------------------------

  describe('getDocuments', () => {
    it('should call logAction with portal.documents.read on success', async () => {
      mockService.getDocuments.mockResolvedValue([{ id: 'doc-001' }, { id: 'doc-002' }]);
      const req = makePortalReq();
      const res = makeRes();

      await ctrl.getDocuments(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.documents.read',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'portal_documents',
          resourceId: PATIENT_ID,
          ipAddress: '127.0.0.1',
          metadata: expect.objectContaining({ count: 2 }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // getCommPreferences
  // -------------------------------------------------------------------------

  describe('getCommPreferences', () => {
    it('should call logAction with portal.comm_preferences.read on success', async () => {
      mockService.getCommPreferences.mockResolvedValue({ email: true, sms: false });
      const req = makePortalReq();
      const res = makeRes();

      await ctrl.getCommPreferences(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.comm_preferences.read',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'comm_preferences',
          resourceId: PATIENT_ID,
          ipAddress: '127.0.0.1',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // updateCommPreferences
  // -------------------------------------------------------------------------

  describe('updateCommPreferences', () => {
    it('should call logAction with portal.comm_preferences.update on success', async () => {
      mockService.updateCommPreferences.mockResolvedValue({ email: false, sms: true });
      const req = makePortalReq({ body: { email: false, sms: true } });
      const res = makeRes();

      await ctrl.updateCommPreferences(req, res);

      expect(mockLogAction).toHaveBeenCalledTimes(1);
      expect(mockLogAction).toHaveBeenCalledWith(
        'portal.comm_preferences.update',
        PATIENT_ID,
        expect.objectContaining({
          resourceType: 'comm_preferences',
          resourceId: PATIENT_ID,
          ipAddress: '127.0.0.1',
        })
      );
    });
  });
});
