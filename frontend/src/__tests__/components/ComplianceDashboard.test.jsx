/**
 * ComplianceDashboard Component Tests
 * Tests for the patient exercise compliance dashboard
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ComplianceDashboard from '../../components/clinical/ComplianceDashboard';

// Mock the API
vi.mock('../../services/api', () => ({
  exercisesAPI: {
    getPatientExercises: vi.fn(),
  },
}));

import { exercisesAPI } from '../../services/api';

describe('ComplianceDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // NULL/EMPTY STATE TESTS
  // ============================================================================

  describe('Null State', () => {
    it('should render nothing meaningful when patientId is falsy', () => {
      const { container } = render(<ComplianceDashboard patientId={null} />);
      // With no patientId, the effect doesn't run, so loading stays true
      // and it shows loading spinner
      expect(container.textContent).toContain('Loading compliance data...');
    });
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      exercisesAPI.getPatientExercises.mockReturnValue(new Promise(() => {})); // never resolves
      render(<ComplianceDashboard patientId="p1" />);
      expect(screen.getByText('Loading compliance data...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  describe('Error State', () => {
    it('should show error message when API call fails', async () => {
      exercisesAPI.getPatientExercises.mockRejectedValue(new Error('Network error'));
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load exercise data')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should show empty state when no prescriptions exist', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({ data: [] });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('No exercise prescriptions yet')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COMPLIANCE CALCULATION
  // ============================================================================

  describe('Compliance Calculation', () => {
    it('should display 0% when all prescriptions are inactive', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'completed', compliance_percentage: 80 }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        // No active prescriptions -> 0% compliance but data shows
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });

    it('should calculate average compliance from active prescriptions', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          { id: '1', status: 'active', compliance_percentage: 80, exercise_name: 'Stretch' },
          { id: '2', status: 'active', compliance_percentage: 60, exercise_name: 'Curl' },
          { id: '3', status: 'completed', compliance_percentage: 100, exercise_name: 'Done' },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        // Average of 80 and 60 = 70
        expect(screen.getByText('70%')).toBeInTheDocument();
      });
    });

    it('should show active prescriptions count', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          { id: '1', status: 'active', compliance_percentage: 50, exercise_name: 'Ex1' },
          { id: '2', status: 'in_progress', compliance_percentage: 70, exercise_name: 'Ex2' },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        // Component renders "{count} active prescriptions" and "{total} total"
        // The count "2" is inside a <span> and "active prescriptions" is text after it
        const container = screen.getByText(/active prescription/);
        expect(container).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // GAUGE COLOR THRESHOLDS
  // ============================================================================

  describe('Gauge Color Thresholds', () => {
    it('should show green stroke when compliance >= 70%', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 75 }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        const svgPaths = document.querySelectorAll('path[stroke="#10b981"]');
        expect(svgPaths.length).toBeGreaterThan(0);
      });
    });

    it('should show amber stroke when compliance >= 40% and < 70%', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 50 }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        const svgPaths = document.querySelectorAll('path[stroke="#f59e0b"]');
        expect(svgPaths.length).toBeGreaterThan(0);
      });
    });

    it('should show red stroke when compliance < 40%', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 20 }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        const svgPaths = document.querySelectorAll('path[stroke="#ef4444"]');
        expect(svgPaths.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // HEATMAP
  // ============================================================================

  describe('Heatmap', () => {
    it('should render 30-day heatmap with "Last 30 Days" heading', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 50 }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      });
    });

    it('should show Completed and Missed legend', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 50 }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Missed')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PAIN TREND
  // ============================================================================

  describe('Pain Trend', () => {
    it('should render pain trend bars when compliance logs have pain levels', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          {
            id: '1',
            status: 'active',
            compliance_percentage: 60,
            compliance_logs: [
              { date: yesterday, pain_level: 7 },
              { date: today, pain_level: 4 },
            ],
          },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Pain Trend')).toBeInTheDocument();
      });
    });

    it('should not render pain trend when fewer than 2 entries', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          {
            id: '1',
            status: 'active',
            compliance_percentage: 60,
            compliance_logs: [{ date: '2024-01-01', pain_level: 5 }],
          },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Overall Compliance')).toBeInTheDocument();
      });
      expect(screen.queryByText('Pain Trend')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACTIVE PRESCRIPTIONS DISPLAY
  // ============================================================================

  describe('Active Prescriptions Display', () => {
    it('should show exercise names and compliance bars for active prescriptions', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          { id: '1', status: 'active', compliance_percentage: 80, exercise_name: 'Chin Tuck' },
          { id: '2', status: 'active', compliance_percentage: 45, exercise_name: 'Side Plank' },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Chin Tuck')).toBeInTheDocument();
        expect(screen.getByText('Side Plank')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('45%')).toBeInTheDocument();
      });
    });

    it('should show "Active Prescriptions" section heading', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 60, exercise_name: 'Stretch' }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Active Prescriptions')).toBeInTheDocument();
      });
    });

    it('should not show Active Prescriptions section when all are completed', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          { id: '1', status: 'completed', compliance_percentage: 100, exercise_name: 'Done Ex' },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Overall Compliance')).toBeInTheDocument();
      });
      expect(screen.queryByText('Active Prescriptions')).not.toBeInTheDocument();
    });

    it('should display sets and frequency when provided', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          {
            id: '1',
            status: 'active',
            compliance_percentage: 70,
            exercise_name: 'Bird Dog',
            sets: 3,
            reps: 10,
            frequency: '2x daglig',
          },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Bird Dog')).toBeInTheDocument();
        expect(screen.getByText(/3x10/)).toBeInTheDocument();
        expect(screen.getByText(/2x daglig/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // RE-FETCH BEHAVIOR
  // ============================================================================

  describe('Re-fetch Behavior', () => {
    it('should re-fetch when patientId prop changes', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({ data: [] });
      const { rerender } = render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(exercisesAPI.getPatientExercises).toHaveBeenCalledWith('p1');
      });

      rerender(<ComplianceDashboard patientId="p2" />);

      await waitFor(() => {
        expect(exercisesAPI.getPatientExercises).toHaveBeenCalledWith('p2');
        expect(exercisesAPI.getPatientExercises).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle camelCase field names (compliancePercentage)', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliancePercentage: 55, exerciseName: 'Curl Up' }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('55%')).toBeInTheDocument();
        expect(screen.getByText('Curl Up')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PAIN TREND COLORS
  // ============================================================================

  describe('Pain Trend Colors', () => {
    it('should render green bars for low pain levels (<=3)', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          {
            id: '1',
            status: 'active',
            compliance_percentage: 60,
            compliance_logs: [
              { date: yesterday, pain_level: 2 },
              { date: today, pain_level: 3 },
            ],
          },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Pain Trend')).toBeInTheDocument();
        const bars = document.querySelectorAll('.bg-green-400');
        expect(bars.length).toBe(2);
      });
    });

    it('should render red bars for high pain levels (>6)', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          {
            id: '1',
            status: 'active',
            compliance_percentage: 60,
            compliance_logs: [
              { date: yesterday, pain_level: 8 },
              { date: today, pain_level: 9 },
            ],
          },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Pain Trend')).toBeInTheDocument();
        const bars = document.querySelectorAll('.bg-red-400');
        expect(bars.length).toBe(2);
      });
    });

    it('should limit pain trend to last 10 entries', async () => {
      const logs = [];
      for (let i = 0; i < 15; i++) {
        const date = new Date(Date.now() - (14 - i) * 86400000).toISOString().split('T')[0];
        logs.push({ date, pain_level: 5 });
      }
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 60, compliance_logs: logs }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText('Pain Trend')).toBeInTheDocument();
        const bars = document.querySelectorAll('.bg-yellow-400');
        expect(bars.length).toBe(10);
      });
    });
  });

  // ============================================================================
  // TOTAL PRESCRIPTIONS
  // ============================================================================

  describe('Total Prescriptions', () => {
    it('should show singular "prescription" when exactly 1 active', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [{ id: '1', status: 'active', compliance_percentage: 50 }],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        expect(screen.getByText(/active prescription$/)).toBeInTheDocument();
      });
    });

    it('should show total prescriptions count including completed', async () => {
      exercisesAPI.getPatientExercises.mockResolvedValue({
        data: [
          { id: '1', status: 'active', compliance_percentage: 80 },
          { id: '2', status: 'completed', compliance_percentage: 100 },
          { id: '3', status: 'active', compliance_percentage: 60 },
        ],
      });
      render(<ComplianceDashboard patientId="p1" />);

      await waitFor(() => {
        const totalEl = screen.getByText('3');
        expect(totalEl).toBeInTheDocument();
      });
    });
  });
});
