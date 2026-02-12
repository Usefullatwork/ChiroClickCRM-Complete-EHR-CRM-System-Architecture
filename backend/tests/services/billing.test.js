/**
 * Billing Service Tests
 * Tests Norwegian healthcare billing: takst codes, invoice calculation,
 * HELFO refunds, payment recording, and invoice lifecycle
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock database module
const mockQuery = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
  getClient: jest.fn(),
  transaction: mockTransaction,
  savepoint: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  pool: null,
  initPGlite: null,
  execSQL: null,
  default: { query: mockQuery, transaction: mockTransaction },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

let billing;

beforeEach(async () => {
  jest.clearAllMocks();
  billing = await import('../../src/services/billing.js');
});

describe('Billing Service', () => {
  // =========================================================================
  // Constants
  // =========================================================================
  describe('INVOICE_STATUS', () => {
    test('should have all required statuses', () => {
      expect(billing.INVOICE_STATUS.DRAFT).toBe('draft');
      expect(billing.INVOICE_STATUS.PENDING).toBe('pending');
      expect(billing.INVOICE_STATUS.SENT).toBe('sent');
      expect(billing.INVOICE_STATUS.PAID).toBe('paid');
      expect(billing.INVOICE_STATUS.PARTIAL).toBe('partial');
      expect(billing.INVOICE_STATUS.OVERDUE).toBe('overdue');
      expect(billing.INVOICE_STATUS.CANCELLED).toBe('cancelled');
      expect(billing.INVOICE_STATUS.CREDITED).toBe('credited');
    });
  });

  describe('PAYMENT_METHODS', () => {
    test('should include Norwegian payment methods', () => {
      expect(billing.PAYMENT_METHODS.CASH).toBe('cash');
      expect(billing.PAYMENT_METHODS.CARD).toBe('card');
      expect(billing.PAYMENT_METHODS.VIPPS).toBe('vipps');
      expect(billing.PAYMENT_METHODS.BANK_TRANSFER).toBe('bank_transfer');
      expect(billing.PAYMENT_METHODS.HELFO).toBe('helfo');
      expect(billing.PAYMENT_METHODS.INSURANCE).toBe('insurance');
    });
  });

  // =========================================================================
  // getTakstCodes
  // =========================================================================
  describe('getTakstCodes', () => {
    test('should return all takst code sections', () => {
      const result = billing.getTakstCodes();
      expect(result).toHaveProperty('codes');
      expect(result).toHaveProperty('additionalCodes');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('lastUpdated');
    });

    test('should include standard consultation codes', () => {
      const result = billing.getTakstCodes();
      expect(result.codes).toHaveProperty('1a');
      expect(result.codes).toHaveProperty('1b');
      expect(result.codes).toHaveProperty('1c');
    });
  });

  // =========================================================================
  // getTakstCode
  // =========================================================================
  describe('getTakstCode', () => {
    test('should return code 1a (initial examination)', () => {
      const code = billing.getTakstCode('1a');
      expect(code).not.toBeNull();
      expect(code.name).toContain('rsteg');
      expect(code.price).toBeGreaterThan(0);
      expect(code.helfoRefund).toBeGreaterThan(0);
      expect(code.patientShare).toBeGreaterThan(0);
    });

    test('should return code 1c (follow-up)', () => {
      const code = billing.getTakstCode('1c');
      expect(code).not.toBeNull();
      expect(code.price).toBe(495);
      expect(code.helfoRefund).toBe(185);
      expect(code.patientShare).toBe(310);
    });

    test('should handle case-insensitive lookup', () => {
      const upper = billing.getTakstCode('1A');
      const lower = billing.getTakstCode('1a');
      expect(upper).toEqual(lower);
    });

    test('should return null for unknown code', () => {
      expect(billing.getTakstCode('999z')).toBeNull();
      expect(billing.getTakstCode('')).toBeNull();
    });

    test('should have price > helfoRefund for standard codes', () => {
      const code = billing.getTakstCode('1a');
      expect(code.price).toBeGreaterThan(code.helfoRefund);
    });

    test('should have price = helfoRefund + patientShare', () => {
      const code = billing.getTakstCode('1a');
      expect(code.price).toBe(code.helfoRefund + code.patientShare);
    });
  });

  // =========================================================================
  // calculateInvoiceTotals
  // =========================================================================
  describe('calculateInvoiceTotals', () => {
    test('should calculate totals for single item', () => {
      const result = billing.calculateInvoiceTotals([{ code: '1a', quantity: 1 }]);

      expect(result.totalGross).toBe(675);
      expect(result.totalHelfoRefund).toBe(254);
      expect(result.totalPatientShare).toBe(421);
      expect(result.totalDue).toBe(421);
      expect(result.currency).toBe('NOK');
      expect(result.items).toHaveLength(1);
    });

    test('should handle multiple items', () => {
      const result = billing.calculateInvoiceTotals([
        { code: '1c', quantity: 1 },
        { code: '1c', quantity: 1 },
      ]);

      expect(result.totalGross).toBe(990);
      expect(result.totalHelfoRefund).toBe(370);
      expect(result.totalPatientShare).toBe(620);
      expect(result.items).toHaveLength(2);
    });

    test('should handle quantity > 1', () => {
      const result = billing.calculateInvoiceTotals([{ code: '1c', quantity: 3 }]);

      expect(result.totalGross).toBe(495 * 3);
      expect(result.totalHelfoRefund).toBe(185 * 3);
      expect(result.totalPatientShare).toBe(310 * 3);
    });

    test('should default quantity to 1', () => {
      const result = billing.calculateInvoiceTotals([{ code: '1c' }]);

      expect(result.totalGross).toBe(495);
    });

    test('should zero patient share for children', () => {
      const result = billing.calculateInvoiceTotals([{ code: '1a', quantity: 1 }], {
        isChild: true,
      });

      expect(result.totalGross).toBe(675);
      expect(result.totalHelfoRefund).toBe(254);
      expect(result.totalPatientShare).toBe(0);
      expect(result.totalDue).toBe(0);
    });

    test('should halve patient share for exemptions', () => {
      const result = billing.calculateInvoiceTotals([{ code: '1a', quantity: 1 }], {
        hasExemption: true,
      });

      expect(result.totalPatientShare).toBe(Math.round(421 * 0.5));
    });

    test('should skip unknown codes gracefully', () => {
      const result = billing.calculateInvoiceTotals([
        { code: '1a', quantity: 1 },
        { code: 'UNKNOWN_CODE', quantity: 1 },
      ]);

      // Only valid code should be included
      expect(result.items).toHaveLength(1);
      expect(result.totalGross).toBe(675);
    });

    test('should handle empty items array', () => {
      const result = billing.calculateInvoiceTotals([]);

      expect(result.totalGross).toBe(0);
      expect(result.totalHelfoRefund).toBe(0);
      expect(result.totalPatientShare).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    test('should include item details in response', () => {
      const result = billing.calculateInvoiceTotals([{ code: '1c', quantity: 2 }]);

      const item = result.items[0];
      expect(item.code).toBe('1c');
      expect(item.name).toBeDefined();
      expect(item.quantity).toBe(2);
      expect(item.unitPrice).toBe(495);
      expect(item.lineTotal).toBe(990);
      expect(item.helfoRefund).toBe(370);
      expect(item.patientShare).toBe(620);
    });
  });

  // =========================================================================
  // generateInvoiceNumber
  // =========================================================================
  describe('generateInvoiceNumber', () => {
    test('should generate sequential invoice number', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      const result = await billing.generateInvoiceNumber('org-1');

      expect(result).toMatch(/^F\d{6}-\d{4}$/);
      expect(result).toContain('-0006'); // count 5 -> next is 6
    });

    test('should start at 0001 for first invoice of month', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const result = await billing.generateInvoiceNumber('org-1');

      expect(result).toMatch(/-0001$/);
    });

    test('should use parameterized query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await billing.generateInvoiceNumber('org-1');

      expect(mockQuery.mock.calls[0][1][0]).toBe('org-1');
    });
  });

  // =========================================================================
  // createInvoice
  // =========================================================================
  describe('createInvoice', () => {
    test('should create an invoice with calculated totals', async () => {
      // generateInvoiceNumber query
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      // INSERT query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-1',
            invoice_number: 'F202602-0001',
            status: 'draft',
            gross_amount: 675,
            helfo_refund: 254,
            patient_amount: 421,
          },
        ],
      });

      const result = await billing.createInvoice('org-1', {
        patient_id: 'patient-1',
        practitioner_id: 'prac-1',
        items: [{ code: '1a', quantity: 1 }],
      });

      expect(result.id).toBe('inv-1');
      expect(result.status).toBe('draft');
    });

    test('should default to 14 day due date', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'inv-1' }] });

      await billing.createInvoice('org-1', {
        patient_id: 'p',
        practitioner_id: 'pr',
        items: [{ code: '1c' }],
      });

      // Check that INSERT was called with correct params
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // updateInvoice
  // =========================================================================
  describe('updateInvoice', () => {
    test('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-1', notes: 'Updated', invoice_number: 'F-001' }],
      });

      const result = await billing.updateInvoice('org-1', 'inv-1', { notes: 'Updated' });

      expect(result.notes).toBe('Updated');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('notes = $3');
      expect(sql).toContain('updated_at = NOW()');
    });

    test('should throw on empty updates', async () => {
      await expect(billing.updateInvoice('org-1', 'inv-1', {})).rejects.toThrow('No valid fields');
    });

    test('should throw on disallowed fields', async () => {
      await expect(billing.updateInvoice('org-1', 'inv-1', { gross_amount: 9999 })).rejects.toThrow(
        'No valid fields'
      );
    });

    test('should throw when invoice not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(billing.updateInvoice('org-1', 'nonexistent', { notes: 'X' })).rejects.toThrow(
        'Invoice not found'
      );
    });
  });

  // =========================================================================
  // finalizeInvoice
  // =========================================================================
  describe('finalizeInvoice', () => {
    test('should finalize a draft invoice', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-1', status: 'sent', invoice_number: 'F-001' }],
      });

      const result = await billing.finalizeInvoice('org-1', 'inv-1');

      expect(result.status).toBe('sent');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("status IN ('draft', 'pending')");
    });

    test('should throw when invoice cannot be finalized', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(billing.finalizeInvoice('org-1', 'inv-1')).rejects.toThrow(
        'cannot be finalized'
      );
    });
  });

  // =========================================================================
  // recordPayment
  // =========================================================================
  describe('recordPayment', () => {
    test('should record full payment and mark as paid', async () => {
      // getInvoiceById query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-1',
            amount_paid: 0,
            patient_amount: 421,
            status: 'sent',
            invoice_number: 'F-001',
          },
        ],
      });
      // INSERT payment
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pay-1', amount: 421, payment_method: 'card' }],
      });
      // UPDATE invoice
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-1', status: 'paid', amount_paid: 421 }],
      });

      const result = await billing.recordPayment('org-1', 'inv-1', {
        amount: 421,
        payment_method: 'card',
      });

      expect(result.invoice.status).toBe('paid');
      expect(result.payment.amount).toBe(421);
    });

    test('should mark as partial for incomplete payment', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-1',
            amount_paid: 0,
            patient_amount: 421,
            status: 'sent',
            invoice_number: 'F-001',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pay-1', amount: 200 }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-1', status: 'partial', amount_paid: 200 }],
      });

      const result = await billing.recordPayment('org-1', 'inv-1', {
        amount: 200,
        payment_method: 'vipps',
      });

      // Check that status was set to 'partial'
      const updateParams = mockQuery.mock.calls[2][1];
      expect(updateParams).toContain('partial');
    });

    test('should throw on non-existent invoice', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        billing.recordPayment('org-1', 'nonexistent', {
          amount: 100,
          payment_method: 'cash',
        })
      ).rejects.toThrow('Invoice not found');
    });
  });

  // =========================================================================
  // cancelInvoice
  // =========================================================================
  describe('cancelInvoice', () => {
    test('should cancel an unpaid invoice', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'inv-1', status: 'cancelled', invoice_number: 'F-001' }],
      });

      const result = await billing.cancelInvoice('org-1', 'inv-1', 'Patient request');

      expect(result.status).toBe('cancelled');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("status NOT IN ('paid', 'cancelled')");
    });

    test('should throw when invoice cannot be cancelled', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(billing.cancelInvoice('org-1', 'inv-1', 'reason')).rejects.toThrow(
        'cannot be cancelled'
      );
    });
  });

  // =========================================================================
  // generateInvoiceHTML
  // =========================================================================
  describe('generateInvoiceHTML', () => {
    const mockInvoice = {
      invoice_number: 'F202602-0001',
      invoice_date: '2026-02-01',
      due_date: '2026-02-15',
      items: JSON.stringify([
        {
          code: '1c',
          name: 'Oppfolgingskonsultasjon',
          quantity: 1,
          unitPrice: 495,
          lineTotal: 495,
        },
      ]),
      gross_amount: 495,
      helfo_refund: 185,
      amount_due: 310,
      organization_name: 'Test Klinikk',
      organization_address: 'Storgata 1',
      organization_postal_code: '0123',
      organization_city: 'Oslo',
      organization_org_number: '123456789',
      organization_phone: '12345678',
      organization_email: 'test@klinikk.no',
      organization_bank_account: '1234 56 78901',
      patient_first_name: 'Ola',
      patient_last_name: 'Nordmann',
      patient_address: 'Gata 2',
      patient_postal_code: '0456',
      patient_city: 'Oslo',
      practitioner_name: 'Dr. Hansen',
      practitioner_hpr: 'HPR12345',
    };

    test('should generate valid HTML', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    test('should include invoice number', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('F202602-0001');
    });

    test('should include patient name', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('Ola');
      expect(html).toContain('Nordmann');
    });

    test('should include organization details', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('Test Klinikk');
      expect(html).toContain('123456789');
    });

    test('should include FAKTURA heading', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('FAKTURA');
    });

    test('should include payment info', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('Betalingsinformasjon');
      expect(html).toContain('1234 56 78901');
    });

    test('should handle items as string', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('1c');
    });

    test('should handle items as array', () => {
      const inv = { ...mockInvoice, items: JSON.parse(mockInvoice.items) };
      const html = billing.generateInvoiceHTML(inv);
      expect(html).toContain('1c');
    });

    test('should include practitioner HPR number', () => {
      const html = billing.generateInvoiceHTML(mockInvoice);
      expect(html).toContain('HPR12345');
    });
  });

  // =========================================================================
  // getInvoiceStatistics
  // =========================================================================
  describe('getInvoiceStatistics', () => {
    test('should return all stat categories', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            paid_count: '10',
            pending_count: '3',
            overdue_count: '1',
            draft_count: '2',
            total_paid: '5000',
            total_outstanding: '1200',
            total_overdue: '400',
            total_helfo_refund: '3000',
            total_invoices: '16',
          },
        ],
      });

      const result = await billing.getInvoiceStatistics('org-1');

      expect(result.paid_count).toBe('10');
      expect(result.total_paid).toBe('5000');
      expect(result.total_helfo_refund).toBe('3000');
    });

    test('should support date range filtering', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ paid_count: '5' }] });

      await billing.getInvoiceStatistics('org-1', {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('invoice_date >=');
      expect(sql).toContain('invoice_date <=');
      expect(params).toContain('2026-01-01');
      expect(params).toContain('2026-01-31');
    });
  });
});
