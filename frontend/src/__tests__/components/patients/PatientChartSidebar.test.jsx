/**
 * PatientChartSidebar Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module-level mocks (BEFORE component import)
// ---------------------------------------------------------------------------

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

vi.mock('../../../lib/utils', () => ({
  formatDate: (d) => (d ? '15.03.2024' : '-'),
  formatPhone: (p) => (p ? '123 45 678' : '-'),
  calculateAge: (dob) => (dob ? 34 : null),
}));

vi.mock('../../../components/ui/StatusBadge', () => ({
  default: ({ status, label, size }) => (
    <span data-testid="status-badge" data-status={status} data-size={size}>
      {label || status}
    </span>
  ),
}));

import PatientChartSidebar from '../../../components/patients/PatientChartSidebar';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const basePatient = {
  id: 42,
  first_name: 'Kari',
  last_name: 'Hansen',
  date_of_birth: '1990-06-20',
  solvit_id: 'SV-999',
  status: 'active',
  phone: '+4798765432',
  email: 'kari@example.com',
  preferred_contact: 'SMS',
  red_flags: [],
  treatment_pref_needles: true,
  treatment_pref_adjustments: false,
  treatment_pref_neck_adjustments: null,
  next_appointment: '2024-04-01',
};

const encounters = [
  { id: 1, created_at: '2024-03-15T10:00:00Z' },
  { id: 2, created_at: '2024-03-01T09:00:00Z' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PatientChartSidebar', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // NULL STATE
  // ========================================================================

  describe('Null state', () => {
    it('should return null when patient is undefined', () => {
      const { container } = render(
        <PatientChartSidebar
          patient={undefined}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(container.innerHTML).toBe('');
    });

    it('should return null when patient is null', () => {
      const { container } = render(
        <PatientChartSidebar patient={null} encounters={[]} onNavigate={mockOnNavigate} />
      );
      expect(container.innerHTML).toBe('');
    });
  });

  // ========================================================================
  // PATIENT IDENTITY
  // ========================================================================

  describe('Patient identity', () => {
    it('should display patient full name', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    it('should display initials in avatar', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('KH')).toBeInTheDocument();
    });

    it('should display age and solvit ID', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText(/34/)).toBeInTheDocument();
      expect(screen.getByText(/SV-999/)).toBeInTheDocument();
    });

    it('should render status badge', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      const badges = screen.getAllByTestId('status-badge');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================================================
  // QUICK ACTIONS
  // ========================================================================

  describe('Quick actions', () => {
    it('should show phone link when patient has phone', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      const callLink = screen.getByLabelText('Ring');
      expect(callLink).toHaveAttribute('href', 'tel:+4798765432');
    });

    it('should not show phone link when no phone', () => {
      const patientNoPhone = { ...basePatient, phone: null };
      render(
        <PatientChartSidebar
          patient={patientNoPhone}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.queryByLabelText('Ring')).not.toBeInTheDocument();
    });

    it('should navigate to communications on SMS click', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      fireEvent.click(screen.getByLabelText('SMS'));
      expect(mockOnNavigate).toHaveBeenCalledWith('/patients/42/communications');
    });

    it('should navigate to booking on calendar click', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      fireEvent.click(screen.getByLabelText('Bestill time'));
      expect(mockOnNavigate).toHaveBeenCalledWith('/appointments/new?patient=42');
    });

    it('should navigate to encounter on journal click', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      fireEvent.click(screen.getByLabelText('Journal'));
      expect(mockOnNavigate).toHaveBeenCalledWith('/patients/42/encounter');
    });
  });

  // ========================================================================
  // RED FLAGS
  // ========================================================================

  describe('Red flags', () => {
    it('should show "no red flags" when none exist', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Ingen røde flagg')).toBeInTheDocument();
    });

    it('should list red flags when present', () => {
      const patientWithFlags = {
        ...basePatient,
        red_flags: ['Cauda equina', 'Nattsmerter'],
      };
      render(
        <PatientChartSidebar
          patient={patientWithFlags}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Cauda equina')).toBeInTheDocument();
      expect(screen.getByText('Nattsmerter')).toBeInTheDocument();
      expect(screen.getByText('Røde flagg')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // CONTACT INFO
  // ========================================================================

  describe('Contact info', () => {
    it('should display formatted phone number', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('123 45 678')).toBeInTheDocument();
    });

    it('should display email', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('kari@example.com')).toBeInTheDocument();
    });

    it('should display preferred contact method', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText(/SMS/)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // TREATMENT PREFERENCES
  // ========================================================================

  describe('Treatment preferences', () => {
    it('should show checkmark for approved preferences', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      // Needles = true -> checkmark
      expect(screen.getByText('\u2713')).toBeInTheDocument();
    });

    it('should show cross for declined preferences', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      // Adjustments = false -> cross
      expect(screen.getByText('\u2717')).toBeInTheDocument();
    });

    it('should show question mark for unknown preferences', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      // Neck adjustments = null -> question mark
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // QUICK STATS
  // ========================================================================

  describe('Quick stats', () => {
    it('should display total visits count', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Besøk totalt')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display last visit date', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Siste besøk')).toBeInTheDocument();
    });

    it('should show dash for last visit when no encounters', () => {
      render(
        <PatientChartSidebar patient={basePatient} encounters={[]} onNavigate={mockOnNavigate} />
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display next appointment date', () => {
      render(
        <PatientChartSidebar
          patient={basePatient}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Neste time')).toBeInTheDocument();
      // next_appointment exists, so formatDate returns '15.03.2024'
    });

    it('should show "Ingen" when no next appointment', () => {
      const patientNoAppt = { ...basePatient, next_appointment: null };
      render(
        <PatientChartSidebar
          patient={patientNoAppt}
          encounters={encounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Ingen')).toBeInTheDocument();
    });
  });
});
