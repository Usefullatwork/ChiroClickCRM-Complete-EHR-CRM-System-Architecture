/**
 * Unit Tests for Patient Portal Service
 * Tests session management, document access, booking requests, and messaging
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

jest.unstable_mockModule('../../../src/services/communication/documentDelivery.js', () => ({
  generatePdf: jest.fn(),
  deliverDocument: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/communication/websocket.js', () => ({
  broadcastToOrg: jest.fn(),
  sendToUser: jest.fn(),
  getOnlineCount: jest.fn(),
  getIO: jest.fn(),
  initializeWebSocket: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/communication/notifications.js', () => ({
  notifyByRole: jest.fn().mockResolvedValue(undefined),
  createNotification: jest.fn(),
  getNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  NOTIFICATION_TYPES: {
    BOOKING_REQUEST: 'BOOKING_REQUEST',
    NEW_PATIENT_MESSAGE: 'NEW_PATIENT_MESSAGE',
  },
  default: {
    notifyByRole: jest.fn().mockResolvedValue(undefined),
    createNotification: jest.fn(),
    NOTIFICATION_TYPES: {
      BOOKING_REQUEST: 'BOOKING_REQUEST',
      NEW_PATIENT_MESSAGE: 'NEW_PATIENT_MESSAGE',
    },
  },
}));

// Import after mocking
const portalService = await import('../../../src/services/practice/patientPortal.js');
const { generatePdf } = await import('../../../src/services/communication/documentDelivery.js');
const { broadcastToOrg } = await import('../../../src/services/communication/websocket.js');
const { notifyByRole } = await import('../../../src/services/communication/notifications.js');

const PATIENT_ID = 'pat-001';
const ORG_ID = 'org-001';

describe('Patient Portal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // DEFAULT_COMM_PREFERENCES
  // =============================================================================

  describe('DEFAULT_COMM_PREFERENCES', () => {
    it('should export sensible defaults with marketing disabled', () => {
      const prefs = portalService.DEFAULT_COMM_PREFERENCES;
      expect(prefs.sms_enabled).toBe(true);
      expect(prefs.email_enabled).toBe(true);
      expect(prefs.reminder_enabled).toBe(true);
      expect(prefs.exercise_reminder_enabled).toBe(true);
      expect(prefs.recall_enabled).toBe(true);
      expect(prefs.marketing_enabled).toBe(false);
    });
  });

  // =============================================================================
  // AUTHENTICATE WITH PIN
  // =============================================================================

  describe('authenticateWithPIN', () => {
    it('should return INVALID_CREDENTIALS when patient is not found by id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.authenticateWithPIN('1234', PATIENT_ID, null, '127.0.0.1');

      expect(result).toEqual({ error: 'INVALID_CREDENTIALS' });
    });

    it('should return INVALID_CREDENTIALS when patient is not found by date of birth', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.authenticateWithPIN(
        '1234',
        null,
        '1990-01-01',
        '127.0.0.1'
      );

      expect(result).toEqual({ error: 'INVALID_CREDENTIALS' });
    });

    it('should return INVALID_PIN when existing PIN hash does not match', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: PATIENT_ID,
            first_name: 'Ola',
            last_name: 'Nordmann',
            email: 'ola@example.com',
            phone: '+4712345678',
            date_of_birth: '1990-01-01',
            organization_id: ORG_ID,
            portal_pin_hash: 'wronghash',
          },
        ],
      });

      const result = await portalService.authenticateWithPIN('0000', PATIENT_ID, null, '127.0.0.1');

      expect(result).toEqual({ error: 'INVALID_PIN' });
    });

    it('should return INVALID_PIN_FORMAT when first-time pin is not 4 digits', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: PATIENT_ID,
            first_name: 'Ola',
            last_name: 'Nordmann',
            email: 'ola@example.com',
            phone: '+4712345678',
            date_of_birth: '1990-01-01',
            organization_id: ORG_ID,
            portal_pin_hash: null,
          },
        ],
      });

      const result = await portalService.authenticateWithPIN('abc', PATIENT_ID, null, '127.0.0.1');

      expect(result).toEqual({ error: 'INVALID_PIN_FORMAT' });
    });

    it('should set PIN hash and return token on first-time 4-digit login', async () => {
      const patient = {
        id: PATIENT_ID,
        first_name: 'Ola',
        last_name: 'Nordmann',
        email: 'ola@example.com',
        phone: '+4712345678',
        date_of_birth: '1990-01-01',
        organization_id: ORG_ID,
        portal_pin_hash: null,
      };

      // 1: SELECT patient, 2: UPDATE pin hash, 3: INSERT session
      mockQuery
        .mockResolvedValueOnce({ rows: [patient] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await portalService.authenticateWithPIN('1234', PATIENT_ID, null, '127.0.0.1');

      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.patient.id).toBe(PATIENT_ID);
      expect(result.patient.firstName).toBe('Ola');
      // UPDATE call should have happened
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE patients SET portal_pin_hash'),
        expect.any(Array)
      );
    });

    it('should succeed in stateless mode when portal_sessions table is missing', async () => {
      const crypto = await import('crypto');
      const pin = '5678';
      const pinHash = crypto.default
        .createHash('sha256')
        .update(pin + PATIENT_ID)
        .digest('hex');

      const patient = {
        id: PATIENT_ID,
        first_name: 'Kari',
        last_name: 'Nordmann',
        email: 'kari@example.com',
        phone: '+4787654321',
        date_of_birth: '1985-06-15',
        organization_id: ORG_ID,
        portal_pin_hash: pinHash,
      };

      const tableError = new Error('relation "portal_sessions" does not exist');
      mockQuery.mockResolvedValueOnce({ rows: [patient] }).mockRejectedValueOnce(tableError);

      const result = await portalService.authenticateWithPIN(pin, PATIENT_ID, null, '127.0.0.1');

      expect(result.token).toBeDefined();
      expect(result.patient.id).toBe(PATIENT_ID);
    });
  });

  // =============================================================================
  // GET PROFILE
  // =============================================================================

  describe('getProfile', () => {
    it('should map portal patient fields to camelCase profile shape', () => {
      const portalPatient = {
        patient_id: PATIENT_ID,
        first_name: 'Ola',
        last_name: 'Nordmann',
        email: 'ola@example.com',
        phone: '+4712345678',
        date_of_birth: '1990-01-01',
      };

      const profile = portalService.getProfile(portalPatient);

      expect(profile).toEqual({
        id: PATIENT_ID,
        firstName: 'Ola',
        lastName: 'Nordmann',
        email: 'ola@example.com',
        phone: '+4712345678',
        dateOfBirth: '1990-01-01',
      });
    });
  });

  // =============================================================================
  // GET APPOINTMENTS
  // =============================================================================

  describe('getAppointments', () => {
    it('should return upcoming appointments for a patient', async () => {
      const rows = [
        { id: 'apt-1', appointment_date: '2026-04-01', status: 'confirmed' },
        { id: 'apt-2', appointment_date: '2026-04-15', status: 'confirmed' },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await portalService.getAppointments(PATIENT_ID, ORG_ID);

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM appointments'), [
        PATIENT_ID,
        ORG_ID,
      ]);
    });
  });

  // =============================================================================
  // GET AVAILABLE SLOTS
  // =============================================================================

  describe('getAvailableSlots', () => {
    it('should return 18 slots (08:00–16:30) with booked ones marked unavailable', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ appointment_time: '09:00:00', duration: 30 }],
      });

      const slots = await portalService.getAvailableSlots(ORG_ID, '2026-04-01', null);

      expect(slots).toHaveLength(18);
      const nineSlot = slots.find((s) => s.time === '09:00');
      const tenSlot = slots.find((s) => s.time === '10:00');
      expect(nineSlot.available).toBe(false);
      expect(tenSlot.available).toBe(true);
    });

    it('should filter by practitionerId when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await portalService.getAvailableSlots(ORG_ID, '2026-04-01', 'prac-99');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('AND practitioner_id = $3'), [
        ORG_ID,
        '2026-04-01',
        'prac-99',
      ]);
    });
  });

  // =============================================================================
  // REQUEST BOOKING
  // =============================================================================

  describe('requestBooking', () => {
    it('should insert booking request and return PENDING status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'req-1', status: 'PENDING' }],
      });

      const result = await portalService.requestBooking(PATIENT_ID, ORG_ID, 'Ola Nordmann', {
        preferredDate: '2026-04-10',
        preferredTime: '10:00',
        reason: 'Smerter i ryggen',
      });

      expect(result).toEqual({ id: 'req-1', status: 'PENDING' });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO portal_booking_requests'),
        expect.arrayContaining([PATIENT_ID, ORG_ID, '2026-04-10'])
      );
    });

    it('should broadcast to org and notify staff even if websocket fails', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'req-2', status: 'PENDING' }],
      });
      broadcastToOrg.mockImplementation(() => {
        throw new Error('ws down');
      });

      const result = await portalService.requestBooking(PATIENT_ID, ORG_ID, 'Kari Nordmann', {
        preferredDate: '2026-04-12',
        preferredTime: null,
        reason: null,
      });

      // Should not throw — errors are caught internally
      expect(result.status).toBe('PENDING');
    });
  });

  // =============================================================================
  // RESCHEDULE APPOINTMENT
  // =============================================================================

  describe('rescheduleAppointment', () => {
    it('should return NOT_FOUND when appointment does not belong to patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.rescheduleAppointment(
        PATIENT_ID,
        ORG_ID,
        'apt-999',
        'Ola Nordmann',
        { preferredDate: '2026-05-01', preferredTime: '11:00', reason: 'Kan ikke' }
      );

      expect(result).toEqual({ error: 'NOT_FOUND' });
    });

    it('should insert reschedule request and return PENDING', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'apt-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'req-3', status: 'PENDING' }] });

      const result = await portalService.rescheduleAppointment(
        PATIENT_ID,
        ORG_ID,
        'apt-1',
        'Ola Nordmann',
        { preferredDate: '2026-05-01', preferredTime: '11:00', reason: 'Jobb' }
      );

      expect(result).toEqual({ id: 'req-3', status: 'PENDING' });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('original_appointment_id'),
        expect.arrayContaining(['apt-1'])
      );
    });
  });

  // =============================================================================
  // CANCEL APPOINTMENT
  // =============================================================================

  describe('cancelAppointment', () => {
    it('should return NOT_FOUND when appointment does not belong to patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.cancelAppointment(
        PATIENT_ID,
        ORG_ID,
        'apt-999',
        'Ola Nordmann',
        'Annet'
      );

      expect(result).toEqual({ error: 'NOT_FOUND' });
    });

    it('should return ALREADY_CANCELLED when appointment is already cancelled', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'apt-1', status: 'cancelled' }] });

      const result = await portalService.cancelAppointment(
        PATIENT_ID,
        ORG_ID,
        'apt-1',
        'Ola Nordmann',
        'Syk'
      );

      expect(result).toEqual({ error: 'ALREADY_CANCELLED' });
    });

    it('should update appointment status to cancelled and return success', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'apt-1', status: 'confirmed' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await portalService.cancelAppointment(
        PATIENT_ID,
        ORG_ID,
        'apt-1',
        'Ola Nordmann',
        'Plutselig forhindret'
      );

      expect(result).toEqual({ success: true });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'cancelled'"),
        expect.arrayContaining(['apt-1'])
      );
    });
  });

  // =============================================================================
  // MESSAGES
  // =============================================================================

  describe('getMessages', () => {
    it('should return paginated messages with unread count', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'msg-1', subject: 'Spørsmål', is_read: false }] })
        .mockResolvedValueOnce({ rows: [{ total: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const result = await portalService.getMessages(PATIENT_ID, ORG_ID, 1, 10);

      expect(result.messages).toHaveLength(1);
      expect(result.unread_count).toBe(2);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 5 });
    });
  });

  describe('sendMessage', () => {
    it('should insert message and return the saved row', async () => {
      const savedMessage = {
        id: 'msg-10',
        patient_id: PATIENT_ID,
        organization_id: ORG_ID,
        sender_type: 'PATIENT',
        subject: 'Hei',
        body: 'Kan jeg endre timen?',
      };
      mockQuery.mockResolvedValueOnce({ rows: [savedMessage] });

      const result = await portalService.sendMessage(PATIENT_ID, ORG_ID, 'Ola Nordmann', {
        subject: 'Hei',
        body: 'Kan jeg endre timen?',
        parent_message_id: null,
      });

      expect(result).toEqual(savedMessage);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("'PATIENT'"),
        expect.any(Array)
      );
    });
  });

  describe('markMessageRead', () => {
    it('should update is_read and read_at for the given message', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await portalService.markMessageRead('msg-1', PATIENT_ID, ORG_ID);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SET is_read = true'), [
        'msg-1',
        PATIENT_ID,
        ORG_ID,
      ]);
    });
  });

  // =============================================================================
  // DOCUMENTS
  // =============================================================================

  describe('getDocuments', () => {
    it('should map document rows with expiry state and null token for expired docs', async () => {
      const past = new Date(Date.now() - 1000);
      const future = new Date(Date.now() + 86400000);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'doc-1',
            title: 'Behandlingssammendrag',
            document_type: 'treatment_summary',
            created_at: new Date(),
            token_expires_at: past,
            downloaded_at: null,
            download_token: 'tok-expired',
          },
          {
            id: 'doc-2',
            title: 'Sykmelding',
            document_type: 'sick_note',
            created_at: new Date(),
            token_expires_at: future,
            downloaded_at: null,
            download_token: 'tok-valid',
          },
        ],
      });

      const docs = await portalService.getDocuments(PATIENT_ID, ORG_ID);

      expect(docs).toHaveLength(2);
      expect(docs[0].expired).toBe(true);
      expect(docs[0].downloadToken).toBeNull();
      expect(docs[1].expired).toBe(false);
      expect(docs[1].downloadToken).toBe('tok-valid');
    });
  });

  describe('downloadDocument', () => {
    it('should return NOT_FOUND when token does not match any document', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.downloadDocument('bad-token');

      expect(result).toEqual({ error: 'NOT_FOUND' });
    });

    it('should return EXPIRED when token is past its expiry date', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'doc-1',
            document_type: 'treatment_summary',
            document_id: 'enc-1',
            organization_id: ORG_ID,
            token_expires_at: new Date(Date.now() - 1000),
          },
        ],
      });

      const result = await portalService.downloadDocument('expired-token');

      expect(result).toEqual({ error: 'EXPIRED' });
    });

    it('should return buffer and filename and mark document downloaded', async () => {
      const future = new Date(Date.now() + 86400000);
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'doc-2',
              document_type: 'sick_note',
              document_id: 'enc-5',
              organization_id: ORG_ID,
              token_expires_at: future,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      generatePdf.mockResolvedValueOnce({
        buffer: Buffer.from('pdf-bytes'),
        filename: 'sykmelding.pdf',
      });

      const result = await portalService.downloadDocument('valid-token');

      expect(result.buffer).toBeDefined();
      expect(result.filename).toBe('sykmelding.pdf');
      expect(result.documentId).toBe('doc-2');
      // Mark downloaded update
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SET downloaded_at = NOW()'), [
        'doc-2',
      ]);
    });
  });

  // =============================================================================
  // COMMUNICATION PREFERENCES
  // =============================================================================

  describe('getCommPreferences', () => {
    it('should return stored preferences when they exist', async () => {
      const stored = {
        sms_enabled: false,
        email_enabled: true,
        reminder_enabled: true,
        exercise_reminder_enabled: false,
        recall_enabled: true,
        marketing_enabled: false,
      };
      mockQuery.mockResolvedValueOnce({ rows: [stored] });

      const result = await portalService.getCommPreferences(PATIENT_ID);

      expect(result).toEqual(stored);
    });

    it('should return DEFAULT_COMM_PREFERENCES when no preferences exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await portalService.getCommPreferences(PATIENT_ID);

      expect(result).toEqual(portalService.DEFAULT_COMM_PREFERENCES);
    });
  });

  describe('updateCommPreferences', () => {
    it('should upsert preferences and return saved row', async () => {
      const saved = {
        patient_id: PATIENT_ID,
        organization_id: ORG_ID,
        sms_enabled: true,
        email_enabled: true,
        reminder_enabled: true,
        exercise_reminder_enabled: true,
        recall_enabled: true,
        marketing_enabled: false,
      };
      mockQuery.mockResolvedValueOnce({ rows: [saved] });

      const result = await portalService.updateCommPreferences(PATIENT_ID, ORG_ID, {
        sms_enabled: true,
        email_enabled: true,
        reminder_enabled: true,
        exercise_reminder_enabled: true,
        recall_enabled: true,
        marketing_enabled: false,
      });

      expect(result).toEqual(saved);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (patient_id) DO UPDATE'),
        expect.any(Array)
      );
    });
  });

  // =============================================================================
  // LOGOUT
  // =============================================================================

  describe('logout', () => {
    it('should delete the portal session by token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await portalService.logout('session-token-abc');

      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM portal_sessions WHERE token = $1', [
        'session-token-abc',
      ]);
    });
  });
});
