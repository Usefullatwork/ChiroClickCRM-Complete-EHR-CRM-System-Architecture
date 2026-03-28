/**
 * Unit Tests for Financial Service
 * Tests revenue calculation, outstanding balances, financial metrics, and invoice number generation
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
const service = await import('../../../src/services/financial.js');

describe('Financial Service', () => {
  const testOrgId = 'org-test-001';
  const testMetricId = 'metric-test-001';
  const testPatientId = 'patient-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // GET ALL FINANCIAL METRICS
  // =============================================================================

  describe('getAllFinancialMetrics', () => {
    it('should return paginated metrics with default options', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'metric-1', patient_name: 'Ola Nordmann', gross_amount: 500 },
          { id: 'metric-2', patient_name: 'Kari Hansen', gross_amount: 350 },
          { id: 'metric-3', patient_name: 'Per Larsen', gross_amount: 700 },
        ],
      });

      const result = await service.getAllFinancialMetrics(testOrgId);

      expect(result.metrics).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.pages).toBe(1);
    });

    it('should apply date range filters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'metric-1', gross_amount: 500 }] });

      await service.getAllFinancialMetrics(testOrgId, {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });

      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('created_at >=');
      expect(countQuery).toContain('created_at <=');
      expect(mockQuery.mock.calls[0][1]).toContain('2025-01-01');
      expect(mockQuery.mock.calls[0][1]).toContain('2025-12-31');
    });

    it('should filter by patientId', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'metric-1' }, { id: 'metric-2' }] });

      await service.getAllFinancialMetrics(testOrgId, { patientId: testPatientId });

      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('patient_id');
      expect(mockQuery.mock.calls[0][1]).toContain(testPatientId);
    });

    it('should filter by paymentStatus', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'metric-1', payment_status: 'PENDING' }] });

      await service.getAllFinancialMetrics(testOrgId, { paymentStatus: 'PENDING' });

      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('payment_status');
      expect(mockQuery.mock.calls[0][1]).toContain('PENDING');
    });

    it('should calculate correct pagination values', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '105' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.getAllFinancialMetrics(testOrgId, { page: 2, limit: 25 });

      expect(result.pagination.total).toBe(105);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(25);
      expect(result.pagination.pages).toBe(5);
    });
  });

  // =============================================================================
  // GET FINANCIAL METRIC BY ID
  // =============================================================================

  describe('getFinancialMetricById', () => {
    it('should return metric with patient details', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testMetricId,
            patient_name: 'Ola Nordmann',
            solvit_id: 'SOL-001',
            phone: '+47 99 99 99 99',
            email: 'ola@example.com',
            gross_amount: 500,
          },
        ],
      });

      const result = await service.getFinancialMetricById(testOrgId, testMetricId);

      expect(result).toBeDefined();
      expect(result.id).toBe(testMetricId);
      expect(result.patient_name).toBe('Ola Nordmann');
    });

    it('should return null for non-existent metric', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.getFinancialMetricById(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should scope query to organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getFinancialMetricById(testOrgId, testMetricId);

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain(testOrgId);
      expect(queryParams).toContain(testMetricId);
    });
  });

  // =============================================================================
  // CREATE FINANCIAL METRIC
  // =============================================================================

  describe('createFinancialMetric', () => {
    it('should create a financial metric with required fields', async () => {
      const metricData = {
        patient_id: testPatientId,
        encounter_id: 'enc-001',
        treatment_codes: [{ code: 'A01', description: 'Consultation', price: 350 }],
        gross_amount: 350,
        insurance_amount: 200,
        patient_amount: 150,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testMetricId,
            organization_id: testOrgId,
            patient_id: testPatientId,
            encounter_id: 'enc-001',
            gross_amount: 350,
            insurance_amount: 200,
            patient_amount: 150,
            payment_status: 'PENDING',
          },
        ],
      });

      const result = await service.createFinancialMetric(testOrgId, metricData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testMetricId);
      expect(result.payment_status).toBe('PENDING');
    });

    it('should use default payment_status of PENDING', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testMetricId, payment_status: 'PENDING' }],
      });

      await service.createFinancialMetric(testOrgId, {
        patient_id: testPatientId,
        encounter_id: 'enc-001',
        treatment_codes: [],
        gross_amount: 500,
        insurance_amount: 0,
        patient_amount: 500,
      });

      const insertParams = mockQuery.mock.calls[0][1];
      expect(insertParams).toContain('PENDING');
    });

    it('should serialize treatment_codes as JSON', async () => {
      const treatmentCodes = [{ code: 'A01', price: 350 }];
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testMetricId }],
      });

      await service.createFinancialMetric(testOrgId, {
        patient_id: testPatientId,
        encounter_id: 'enc-001',
        treatment_codes: treatmentCodes,
        gross_amount: 350,
        insurance_amount: 0,
        patient_amount: 350,
      });

      const insertParams = mockQuery.mock.calls[0][1];
      expect(insertParams).toContain(JSON.stringify(treatmentCodes));
    });
  });

  // =============================================================================
  // UPDATE PAYMENT STATUS
  // =============================================================================

  describe('updatePaymentStatus', () => {
    it('should update payment status only when minimal fields provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testMetricId, payment_status: 'PAID' }],
      });

      const result = await service.updatePaymentStatus(testOrgId, testMetricId, {
        payment_status: 'PAID',
      });

      expect(result.payment_status).toBe('PAID');
    });

    it('should include payment_method when provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testMetricId, payment_status: 'PAID', payment_method: 'card' }],
      });

      await service.updatePaymentStatus(testOrgId, testMetricId, {
        payment_status: 'PAID',
        payment_method: 'card',
      });

      const queryText = mockQuery.mock.calls[0][0];
      expect(queryText).toContain('payment_method');
      expect(mockQuery.mock.calls[0][1]).toContain('card');
    });

    it('should include paid_at and notes when provided', async () => {
      const paidAt = '2025-06-15T10:00:00Z';
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testMetricId, payment_status: 'PAID' }],
      });

      await service.updatePaymentStatus(testOrgId, testMetricId, {
        payment_status: 'PAID',
        paid_at: paidAt,
        notes: 'Paid via bank transfer',
      });

      const queryText = mockQuery.mock.calls[0][0];
      expect(queryText).toContain('paid_at');
      expect(queryText).toContain('notes');
    });

    it('should throw when metric is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.updatePaymentStatus(testOrgId, 'non-existent', { payment_status: 'PAID' })
      ).rejects.toThrow('Financial metric not found');
    });
  });

  // =============================================================================
  // RECORD PAYMENT
  // =============================================================================

  describe('recordPayment', () => {
    it('should record a payment and mark metric as PAID', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: testMetricId,
            payment_status: 'PAID',
            payment_method: 'card',
            paid_amount: 500,
          },
        ],
      });

      const result = await service.recordPayment(testOrgId, testMetricId, {
        amount: 500,
        payment_method: 'card',
        notes: 'Paid in full',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testMetricId);
    });

    it('should throw when metric is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.recordPayment(testOrgId, 'non-existent', {
          amount: 200,
          payment_method: 'cash',
        })
      ).rejects.toThrow('Financial metric not found');
    });

    it('should handle empty notes gracefully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testMetricId, payment_status: 'PAID' }],
      });

      const result = await service.recordPayment(testOrgId, testMetricId, {
        amount: 300,
        payment_method: 'vipps',
      });

      expect(result).toBeDefined();
    });
  });

  // =============================================================================
  // GET REVENUE SUMMARY
  // =============================================================================

  describe('getRevenueSummary', () => {
    it('should return aggregated revenue summary', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_transactions: '10',
            total_gross: '5000',
            total_insurance: '2000',
            total_patient: '3000',
            paid_count: '7',
            pending_count: '2',
            cancelled_count: '1',
            collected_amount: '2100',
            outstanding_amount: '600',
          },
        ],
      });

      const result = await service.getRevenueSummary(testOrgId, '2025-01-01', '2025-12-31');

      expect(result).toBeDefined();
      expect(result.total_transactions).toBe('10');
      expect(result.total_gross).toBe('5000');
      expect(result.collected_amount).toBe('2100');
      expect(result.outstanding_amount).toBe('600');
    });

    it('should pass date range to query', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_transactions: '0', total_gross: null }],
      });

      await service.getRevenueSummary(testOrgId, '2025-01-01', '2025-06-30');

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain('2025-01-01');
      expect(queryParams).toContain('2025-06-30');
      expect(queryParams).toContain(testOrgId);
    });
  });

  // =============================================================================
  // GET REVENUE BY TREATMENT CODE
  // =============================================================================

  describe('getRevenueByTreatmentCode', () => {
    it('should return treatment code revenue breakdown', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            treatment_code: 'A01',
            description: 'Consultation',
            usage_count: '15',
            total_revenue: '5250',
          },
          {
            treatment_code: 'B02',
            description: 'Follow-up',
            usage_count: '8',
            total_revenue: '1600',
          },
        ],
      });

      const result = await service.getRevenueByTreatmentCode(testOrgId, '2025-01-01', '2025-12-31');

      expect(result).toHaveLength(2);
      expect(result[0].treatment_code).toBe('A01');
      expect(result[0].total_revenue).toBe('5250');
    });

    it('should apply custom limit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getRevenueByTreatmentCode(testOrgId, '2025-01-01', '2025-12-31', 5);

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain(5);
    });

    it('should default to limit of 10', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getRevenueByTreatmentCode(testOrgId, '2025-01-01', '2025-12-31');

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain(10);
    });
  });

  // =============================================================================
  // GET PAYMENT METHOD BREAKDOWN
  // =============================================================================

  describe('getPaymentMethodBreakdown', () => {
    it('should return breakdown grouped by payment method', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { payment_method: 'card', transaction_count: '20', total_amount: '8000' },
          { payment_method: 'vipps', transaction_count: '10', total_amount: '3500' },
          { payment_method: 'cash', transaction_count: '5', total_amount: '1200' },
        ],
      });

      const result = await service.getPaymentMethodBreakdown(testOrgId, '2025-01-01', '2025-12-31');

      expect(result).toHaveLength(3);
      expect(result[0].payment_method).toBe('card');
      expect(result[0].total_amount).toBe('8000');
    });

    it('should only include PAID transactions', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getPaymentMethodBreakdown(testOrgId, '2025-01-01', '2025-12-31');

      const queryText = mockQuery.mock.calls[0][0];
      expect(queryText).toContain("'PAID'");
    });
  });

  // =============================================================================
  // GET OUTSTANDING INVOICES
  // =============================================================================

  describe('getOutstandingInvoices', () => {
    it('should return all PENDING invoices with days outstanding', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'metric-1',
            patient_name: 'Ola Nordmann',
            patient_amount: 500,
            days_outstanding: 14,
            payment_status: 'PENDING',
          },
          {
            id: 'metric-2',
            patient_name: 'Kari Hansen',
            patient_amount: 350,
            days_outstanding: 45,
            payment_status: 'PENDING',
          },
        ],
      });

      const result = await service.getOutstandingInvoices(testOrgId);

      expect(result).toHaveLength(2);
      expect(result[0].days_outstanding).toBe(14);
      expect(result[1].days_outstanding).toBe(45);
    });

    it('should return empty array when no outstanding invoices', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.getOutstandingInvoices(testOrgId);

      expect(result).toHaveLength(0);
    });

    it('should scope query to organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getOutstandingInvoices(testOrgId);

      expect(mockQuery.mock.calls[0][1]).toContain(testOrgId);
    });
  });

  // =============================================================================
  // GET PATIENT PAYMENT HISTORY
  // =============================================================================

  describe('getPatientPaymentHistory', () => {
    it('should return payment history for a specific patient', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'metric-1',
            patient_id: testPatientId,
            gross_amount: 500,
            encounter_date: '2025-03-01',
          },
          {
            id: 'metric-2',
            patient_id: testPatientId,
            gross_amount: 350,
            encounter_date: '2025-02-15',
          },
        ],
      });

      const result = await service.getPatientPaymentHistory(testOrgId, testPatientId);

      expect(result).toHaveLength(2);
      expect(result[0].patient_id).toBe(testPatientId);
    });

    it('should scope to both organization and patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getPatientPaymentHistory(testOrgId, testPatientId);

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain(testOrgId);
      expect(queryParams).toContain(testPatientId);
    });
  });

  // =============================================================================
  // GENERATE INVOICE NUMBER
  // =============================================================================

  describe('generateInvoiceNumber', () => {
    it('should generate an invoice number with correct format', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const result = await service.generateInvoiceNumber(testOrgId);

      const currentYear = new Date().getFullYear();
      expect(result).toMatch(new RegExp(`^INV-${currentYear}-\\d{5}$`));
    });

    it('should increment sequence based on existing invoices', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '9' }] });

      const result = await service.generateInvoiceNumber(testOrgId);

      expect(result).toMatch(/-00010$/);
    });

    it('should pad sequence number to 5 digits', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const result = await service.generateInvoiceNumber(testOrgId);

      const parts = result.split('-');
      expect(parts[2]).toHaveLength(5);
    });

    it('should scope count query to organization and current year', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await service.generateInvoiceNumber(testOrgId);

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain(testOrgId);
      expect(queryParams).toContain(new Date().getFullYear());
    });
  });

  // =============================================================================
  // GET DAILY REVENUE CHART
  // =============================================================================

  describe('getDailyRevenueChart', () => {
    it('should return daily revenue data points', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            date: '2025-03-01',
            transaction_count: '3',
            gross_revenue: '1500',
            patient_revenue: '900',
            insurance_revenue: '600',
          },
          {
            date: '2025-03-02',
            transaction_count: '5',
            gross_revenue: '2500',
            patient_revenue: '1500',
            insurance_revenue: '1000',
          },
        ],
      });

      const result = await service.getDailyRevenueChart(testOrgId, '2025-03-01', '2025-03-31');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2025-03-01');
      expect(result[0].gross_revenue).toBe('1500');
    });

    it('should exclude CANCELLED transactions', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getDailyRevenueChart(testOrgId, '2025-03-01', '2025-03-31');

      const queryText = mockQuery.mock.calls[0][0];
      expect(queryText).toContain("'CANCELLED'");
    });

    it('should return empty array when no data in range', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.getDailyRevenueChart(testOrgId, '2020-01-01', '2020-01-31');

      expect(result).toHaveLength(0);
    });
  });
});
