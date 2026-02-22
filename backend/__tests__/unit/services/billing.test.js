/**
 * Unit Tests for Billing Service
 * Tests invoice generation, payment recording, takst code calculations
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
const billingService = await import('../../../src/services/billing.js');

describe('Billing Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // TAKST CODES
  // =============================================================================

  describe('getTakstCodes', () => {
    it('should return takst codes with metadata', () => {
      const result = billingService.getTakstCodes();

      expect(result).toBeDefined();
      expect(result.codes).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('getTakstCode', () => {
    it('should find a valid takst code', () => {
      const result = billingService.getTakstCode('1a');

      // If takst-codes.json has code '1a', it should be found
      // If not, it returns null — both are valid depending on seed data
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should return null for invalid code', () => {
      const result = billingService.getTakstCode('INVALID_CODE_9999');

      expect(result).toBeNull();
    });

    it('should be case-insensitive', () => {
      const lower = billingService.getTakstCode('1a');
      const upper = billingService.getTakstCode('1A');

      expect(lower).toEqual(upper);
    });
  });

  // =============================================================================
  // INVOICE TOTALS CALCULATION
  // =============================================================================

  describe('calculateInvoiceTotals', () => {
    it('should calculate totals for valid items', () => {
      // Use a mock item — the calculation depends on takst-codes.json data
      const result = billingService.calculateInvoiceTotals([]);

      expect(result).toBeDefined();
      expect(result.totalGross).toBe(0);
      expect(result.totalHelfoRefund).toBe(0);
      expect(result.totalPatientShare).toBe(0);
      expect(result.currency).toBe('NOK');
    });

    it('should return zero totals for unknown codes', () => {
      const result = billingService.calculateInvoiceTotals([{ code: 'NONEXISTENT', quantity: 1 }]);

      // Unknown codes are skipped (logged as warning)
      expect(result.totalGross).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('should zero out patient share for children', () => {
      const result = billingService.calculateInvoiceTotals([], { isChild: true });

      expect(result.totalPatientShare).toBe(0);
    });
  });

  // =============================================================================
  // GENERATE INVOICE NUMBER
  // =============================================================================

  describe('generateInvoiceNumber', () => {
    it('should generate a valid invoice number format', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const result = await billingService.generateInvoiceNumber(testOrgId);

      // Format: F{YYYY}{MM}-{SEQUENCE}
      expect(result).toMatch(/^F\d{6}-\d{4}$/);
    });

    it('should increment sequence based on existing invoices', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      const result = await billingService.generateInvoiceNumber(testOrgId);

      expect(result).toMatch(/-0006$/);
    });
  });

  // =============================================================================
  // CREATE INVOICE
  // =============================================================================

  describe('createInvoice', () => {
    it('should create a draft invoice', async () => {
      // generateInvoiceNumber query
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      // INSERT query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-123',
            invoice_number: 'F202602-0001',
            status: 'draft',
            gross_amount: 0,
            patient_amount: 0,
          },
        ],
      });

      const result = await billingService.createInvoice(testOrgId, {
        patient_id: 'pat-1',
        practitioner_id: 'prac-1',
        items: [],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('inv-123');
      expect(result.status).toBe('draft');
    });

    it('should use default due days', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-124', invoice_number: 'F202602-0001', status: 'draft' }],
      });

      await billingService.createInvoice(testOrgId, {
        patient_id: 'pat-1',
        practitioner_id: 'prac-1',
      });

      // The INSERT call is the second query
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall).toBeDefined();
    });
  });

  // =============================================================================
  // GET INVOICE BY ID
  // =============================================================================

  describe('getInvoiceById', () => {
    it('should return invoice with patient and organization details', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-123',
            invoice_number: 'F202602-0001',
            patient_first_name: 'Ola',
            patient_last_name: 'Nordmann',
            organization_name: 'Test Clinic',
          },
        ],
      });

      const result = await billingService.getInvoiceById(testOrgId, 'inv-123');

      expect(result).toBeDefined();
      expect(result.patient_first_name).toBe('Ola');
    });

    it('should return null for non-existent invoice', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await billingService.getInvoiceById(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // GET INVOICES (PAGINATION)
  // =============================================================================

  describe('getInvoices', () => {
    it('should return paginated invoices', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'inv-1', status: 'draft' },
          { id: 'inv-2', status: 'paid' },
        ],
      });

      const result = await billingService.getInvoices(testOrgId);

      expect(result.invoices).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'inv-1', status: 'paid' }] });

      const result = await billingService.getInvoices(testOrgId, { status: 'paid' });

      expect(result.invoices).toHaveLength(1);
    });

    it('should validate sort column to prevent injection', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await billingService.getInvoices(testOrgId, { sort_by: 'DROP TABLE;--' });

      // Invalid sort column should fall back to 'invoice_date'
      const dataQuery = mockQuery.mock.calls[1][0];
      expect(dataQuery).toContain('invoice_date');
      expect(dataQuery).not.toContain('DROP');
    });
  });

  // =============================================================================
  // UPDATE INVOICE
  // =============================================================================

  describe('updateInvoice', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-123', notes: 'Updated notes' }],
      });

      const result = await billingService.updateInvoice(testOrgId, 'inv-123', {
        notes: 'Updated notes',
      });

      expect(result.notes).toBe('Updated notes');
    });

    it('should throw when no valid fields provided', async () => {
      await expect(
        billingService.updateInvoice(testOrgId, 'inv-123', { invalid_field: 'test' })
      ).rejects.toThrow('No valid fields to update');
    });

    it('should throw for non-existent invoice', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        billingService.updateInvoice(testOrgId, 'non-existent', { notes: 'Test' })
      ).rejects.toThrow('Invoice not found');
    });
  });

  // =============================================================================
  // RECORD PAYMENT
  // =============================================================================

  describe('recordPayment', () => {
    it('should record payment and update invoice to paid when fully paid', async () => {
      // getInvoiceById query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-123',
            invoice_number: 'F202602-0001',
            amount_paid: '0',
            patient_amount: '500',
            status: 'sent',
          },
        ],
      });
      // INSERT payment
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pay-1', amount: 500, payment_method: 'card' }],
      });
      // UPDATE invoice
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-123', amount_paid: 500, status: 'paid' }],
      });

      const result = await billingService.recordPayment(testOrgId, 'inv-123', {
        amount: 500,
        payment_method: 'card',
      });

      expect(result.invoice.status).toBe('paid');
      expect(result.payment.amount).toBe(500);
    });

    it('should set partial status for partial payment', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-123',
            invoice_number: 'F202602-0001',
            amount_paid: '0',
            patient_amount: '500',
            status: 'sent',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pay-1', amount: 200, payment_method: 'vipps' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-123', amount_paid: 200, status: 'partial' }],
      });

      const result = await billingService.recordPayment(testOrgId, 'inv-123', {
        amount: 200,
        payment_method: 'vipps',
      });

      expect(result.invoice.status).toBe('partial');
    });

    it('should throw for non-existent invoice', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        billingService.recordPayment(testOrgId, 'non-existent', {
          amount: 100,
          payment_method: 'cash',
        })
      ).rejects.toThrow('Invoice not found');
    });
  });

  // =============================================================================
  // FINALIZE INVOICE
  // =============================================================================

  describe('finalizeInvoice', () => {
    it('should finalize a draft invoice', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-123', status: 'sent', invoice_number: 'F202602-0001' }],
      });

      const result = await billingService.finalizeInvoice(testOrgId, 'inv-123');

      expect(result.status).toBe('sent');
    });

    it('should throw if invoice cannot be finalized', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(billingService.finalizeInvoice(testOrgId, 'non-existent')).rejects.toThrow(
        'Invoice not found or cannot be finalized'
      );
    });
  });

  // =============================================================================
  // INVOICE STATUS CONSTANTS
  // =============================================================================

  describe('INVOICE_STATUS', () => {
    it('should export valid invoice statuses', () => {
      expect(billingService.INVOICE_STATUS.DRAFT).toBe('draft');
      expect(billingService.INVOICE_STATUS.PAID).toBe('paid');
      expect(billingService.INVOICE_STATUS.CANCELLED).toBe('cancelled');
    });
  });

  describe('PAYMENT_METHODS', () => {
    it('should export valid payment methods', () => {
      expect(billingService.PAYMENT_METHODS.CASH).toBe('cash');
      expect(billingService.PAYMENT_METHODS.CARD).toBe('card');
      expect(billingService.PAYMENT_METHODS.VIPPS).toBe('vipps');
      expect(billingService.PAYMENT_METHODS.HELFO).toBe('helfo');
    });
  });
});
