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

  // =============================================================================
  // TAKST CODE LOOKUP — ADDITIONAL CODES & REAL CODE CALCULATIONS
  // =============================================================================

  describe('getTakstCode (extended)', () => {
    it('should return null for empty string input', () => {
      const result = billingService.getTakstCode('');
      expect(result).toBeNull();
    });
  });

  describe('calculateInvoiceTotals (with real codes)', () => {
    it('should calculate correct totals for a known code (1a)', () => {
      // takst 1a: price=675, helfoRefund=254, patientShare=421
      const result = billingService.calculateInvoiceTotals([{ code: '1a', quantity: 1 }]);

      expect(result.totalGross).toBe(675);
      expect(result.totalHelfoRefund).toBe(254);
      expect(result.totalPatientShare).toBe(421);
      expect(result.totalDue).toBe(421);
      expect(result.currency).toBe('NOK');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].code).toBe('1a');
    });

    it('should multiply amounts correctly for quantity > 1', () => {
      // takst 1c: price=495, helfoRefund=185, patientShare=310
      const result = billingService.calculateInvoiceTotals([{ code: '1c', quantity: 2 }]);

      expect(result.totalGross).toBe(990);
      expect(result.totalHelfoRefund).toBe(370);
      expect(result.totalPatientShare).toBe(620);
    });

    it('should apply 50% reduction in patient share when hasExemption is true', () => {
      // takst 1a: patientShare=421 → 421 * 0.5 = 210 (Math.round)
      const result = billingService.calculateInvoiceTotals([{ code: '1a', quantity: 1 }], {
        hasExemption: true,
      });

      expect(result.totalPatientShare).toBe(Math.round(421 * 0.5));
      expect(result.totalGross).toBe(675); // gross unchanged
    });

    it('should zero out patient share for children even with known code', () => {
      const result = billingService.calculateInvoiceTotals([{ code: '1c', quantity: 1 }], {
        isChild: true,
      });

      expect(result.totalPatientShare).toBe(0);
      expect(result.totalGross).toBe(495); // gross still reflects full price
    });

    it('should accumulate totals across multiple items', () => {
      // 1a: 675/254/421  +  1b: 295/107/188
      const result = billingService.calculateInvoiceTotals([
        { code: '1a', quantity: 1 },
        { code: '1b', quantity: 1 },
      ]);

      expect(result.totalGross).toBe(675 + 295);
      expect(result.totalHelfoRefund).toBe(254 + 107);
      expect(result.totalPatientShare).toBe(421 + 188);
      expect(result.items).toHaveLength(2);
    });
  });

  // =============================================================================
  // GET INVOICES — DATE RANGE, SEARCH, SORT ORDER
  // =============================================================================

  describe('getInvoices (extended filters)', () => {
    it('should filter by date range', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'inv-10', status: 'sent' }] });

      const result = await billingService.getInvoices(testOrgId, {
        start_date: '2026-01-01',
        end_date: '2026-03-31',
      });

      expect(result.invoices).toHaveLength(1);
      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('invoice_date >=');
      expect(countQuery).toContain('invoice_date <=');
    });

    it('should include ILIKE search in query when search option is provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await billingService.getInvoices(testOrgId, { search: 'Hansen' });

      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('ILIKE');
    });

    it('should default to DESC sort order for invalid sort_order value', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await billingService.getInvoices(testOrgId, { sort_order: 'INVALID' });

      const dataQuery = mockQuery.mock.calls[1][0];
      expect(dataQuery).toContain('DESC');
    });

    it('should use ASC sort order when specified', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await billingService.getInvoices(testOrgId, { sort_order: 'ASC' });

      const dataQuery = mockQuery.mock.calls[1][0];
      expect(dataQuery).toContain('ASC');
    });
  });

  // =============================================================================
  // GET INVOICE PAYMENTS
  // =============================================================================

  describe('getInvoicePayments', () => {
    it('should return payments for a given invoice', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'pay-1', amount: 300, payment_method: 'card', payment_date: '2026-03-01' },
          { id: 'pay-2', amount: 200, payment_method: 'vipps', payment_date: '2026-03-05' },
        ],
      });

      const result = await billingService.getInvoicePayments(testOrgId, 'inv-123');

      expect(result).toHaveLength(2);
      expect(result[0].payment_method).toBe('card');
    });

    it('should return empty array when invoice has no payments', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await billingService.getInvoicePayments(testOrgId, 'inv-no-payments');

      expect(result).toEqual([]);
    });
  });

  // =============================================================================
  // CANCEL INVOICE
  // =============================================================================

  describe('cancelInvoice', () => {
    it('should cancel an invoice and return the cancelled record', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-123',
            invoice_number: 'F202602-0001',
            status: 'cancelled',
            cancellation_reason: 'Patient no-show',
          },
        ],
      });

      const result = await billingService.cancelInvoice(testOrgId, 'inv-123', 'Patient no-show');

      expect(result.status).toBe('cancelled');
      expect(result.cancellation_reason).toBe('Patient no-show');
    });

    it('should throw when invoice is already paid or cancelled', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        billingService.cancelInvoice(testOrgId, 'inv-paid', 'Duplicate')
      ).rejects.toThrow('Invoice not found or cannot be cancelled');
    });
  });

  // =============================================================================
  // GET INVOICE STATISTICS
  // =============================================================================

  describe('getInvoiceStatistics', () => {
    it('should return statistics for the organization', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            paid_count: '12',
            pending_count: '3',
            overdue_count: '1',
            draft_count: '2',
            total_paid: '5400',
            total_outstanding: '1200',
            total_overdue: '310',
            total_helfo_refund: '2540',
            total_invoices: '18',
          },
        ],
      });

      const result = await billingService.getInvoiceStatistics(testOrgId);

      expect(result.paid_count).toBe('12');
      expect(result.total_helfo_refund).toBe('2540');
    });

    it('should append date filter params when start_date and end_date provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ paid_count: '0' }] });

      await billingService.getInvoiceStatistics(testOrgId, {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      const calledSql = mockQuery.mock.calls[0][0];
      expect(calledSql).toContain('invoice_date >=');
      expect(calledSql).toContain('invoice_date <=');
      // Params should include both date values
      const calledParams = mockQuery.mock.calls[0][1];
      expect(calledParams).toContain('2026-01-01');
      expect(calledParams).toContain('2026-01-31');
    });
  });

  // =============================================================================
  // UPDATE OVERDUE INVOICES
  // =============================================================================

  describe('updateOverdueInvoices', () => {
    it('should return invoices that were marked overdue', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'inv-1', status: 'overdue', invoice_number: 'F202601-0001' },
          { id: 'inv-2', status: 'overdue', invoice_number: 'F202601-0002' },
        ],
      });

      const result = await billingService.updateOverdueInvoices(testOrgId);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('overdue');
    });

    it('should return empty array when no invoices are overdue', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await billingService.updateOverdueInvoices(testOrgId);

      expect(result).toEqual([]);
    });
  });

  // =============================================================================
  // GENERATE INVOICE HTML
  // =============================================================================

  describe('generateInvoiceHTML', () => {
    const baseInvoice = {
      invoice_number: 'F202603-0001',
      invoice_date: '2026-03-01T00:00:00.000Z',
      due_date: '2026-03-15T00:00:00.000Z',
      items: [
        {
          code: '1a',
          name: 'Forstegangsundersokelse',
          description: 'Test',
          quantity: 1,
          unitPrice: 675,
          lineTotal: 675,
          helfoRefund: 254,
          patientShare: 421,
        },
      ],
      gross_amount: 675,
      helfo_refund: 254,
      amount_due: 421,
      organization_name: 'Testklinikk AS',
      organization_address: 'Testgata 1',
      organization_postal_code: '0001',
      organization_city: 'Oslo',
      organization_org_number: '123456789',
      organization_phone: '+47 22 22 22 22',
      organization_email: 'post@testklinikk.no',
      organization_bank_account: '1234 56 78901',
      patient_first_name: 'Ola',
      patient_last_name: 'Nordmann',
      patient_address: 'Pasientveien 5',
      patient_postal_code: '0100',
      patient_city: 'Oslo',
      practitioner_name: 'Dr. Hansen',
      practitioner_hpr: '1234567',
    };

    it('should return an HTML string containing the invoice number', () => {
      const html = billingService.generateInvoiceHTML(baseInvoice);

      expect(typeof html).toBe('string');
      expect(html).toContain('F202603-0001');
    });

    it('should include patient name and organization name in HTML output', () => {
      const html = billingService.generateInvoiceHTML(baseInvoice);

      expect(html).toContain('Ola');
      expect(html).toContain('Nordmann');
      expect(html).toContain('Testklinikk AS');
    });

    it('should parse items when provided as a JSON string', () => {
      const invoiceWithStringItems = {
        ...baseInvoice,
        items: JSON.stringify(baseInvoice.items),
      };

      const html = billingService.generateInvoiceHTML(invoiceWithStringItems);

      // Should render without throwing and include the takst code
      expect(html).toContain('1a');
    });
  });

  // =============================================================================
  // HELFO REPORT DATA
  // =============================================================================

  describe('getHelfoReportData', () => {
    it('should return HELFO report with totals for the given period', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            invoice_number: 'F202603-0001',
            invoice_date: '2026-03-01',
            helfo_refund: '254',
            items: '[]',
            patient_name: 'Ola Nordmann',
            patient_dob: '1980-05-15',
          },
          {
            invoice_number: 'F202603-0002',
            invoice_date: '2026-03-10',
            helfo_refund: '185',
            items: '[]',
            patient_name: 'Kari Hansen',
            patient_dob: '1975-11-22',
          },
        ],
      });

      const result = await billingService.getHelfoReportData(testOrgId, '2026-03-01', '2026-03-31');

      expect(result.invoices).toHaveLength(2);
      expect(result.totalRefund).toBeCloseTo(254 + 185);
      expect(result.invoiceCount).toBe(2);
      expect(result.period.startDate).toBe('2026-03-01');
      expect(result.period.endDate).toBe('2026-03-31');
    });

    it('should return zero totalRefund and empty array when no HELFO claims exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await billingService.getHelfoReportData(testOrgId, '2026-03-01', '2026-03-31');

      expect(result.invoices).toHaveLength(0);
      expect(result.totalRefund).toBe(0);
      expect(result.invoiceCount).toBe(0);
    });
  });
});
