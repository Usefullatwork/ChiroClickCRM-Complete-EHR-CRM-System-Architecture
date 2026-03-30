/**
 * PatientSummaryCard Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Module-level mocks (BEFORE component import)
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

vi.mock('../../../lib/utils', () => ({
  calculateAge: (dob) => {
    if (!dob) return null;
    return 34;
  },
}));

import PatientSummaryCard from '../../../components/patients/PatientSummaryCard';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const basePatient = {
  first_name: 'Ola',
  last_name: 'Nordmann',
  date_of_birth: '1990-01-15',
  gender: 'Mann',
  solvit_id: 'S-12345',
  phone: '+4712345678',
  red_flags: [],
  allergies: [],
  current_medications: [],
  main_problem: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PatientSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // NULL / EMPTY STATE
  // ========================================================================

  describe('Null state', () => {
    it('should return null when patient is undefined', () => {
      const { container } = render(
        <MemoryRouter>
          <PatientSummaryCard patient={undefined} patientId="1" />
        </MemoryRouter>
      );
      expect(container.innerHTML).toBe('');
    });

    it('should return null when patient is null', () => {
      const { container } = render(
        <MemoryRouter>
          <PatientSummaryCard patient={null} patientId="1" />
        </MemoryRouter>
      );
      expect(container.innerHTML).toBe('');
    });
  });

  // ========================================================================
  // DEMOGRAPHICS
  // ========================================================================

  describe('Demographics', () => {
    it('should display patient full name', () => {
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={basePatient} patientId="1" />
        </MemoryRouter>
      );
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    it('should display age, gender, and solvit ID in one line', () => {
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={basePatient} patientId="1" />
        </MemoryRouter>
      );
      // All three appear in a single <p> element
      const infoLine = screen.getByText(/34.*Mann.*S-12345/);
      expect(infoLine).toBeInTheDocument();
    });

    it('should display phone number', () => {
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={basePatient} patientId="1" />
        </MemoryRouter>
      );
      expect(screen.getByText('+4712345678')).toBeInTheDocument();
    });

    it('should not display phone section when phone is missing', () => {
      const patientNoPhone = { ...basePatient, phone: null };
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={patientNoPhone} patientId="1" />
        </MemoryRouter>
      );
      expect(screen.queryByText('+4712345678')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // NAVIGATION BUTTONS
  // ========================================================================

  describe('Navigation', () => {
    it('should navigate to new appointment on calendar button click', () => {
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={basePatient} patientId="42" />
        </MemoryRouter>
      );
      const btn = screen.getByLabelText('nextAppointment');
      fireEvent.click(btn);
      expect(mockNavigate).toHaveBeenCalledWith('/appointments/new?patient=42');
    });

    it('should navigate to encounter on journal button click', () => {
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={basePatient} patientId="42" />
        </MemoryRouter>
      );
      const btn = screen.getByLabelText('newVisit');
      fireEvent.click(btn);
      expect(mockNavigate).toHaveBeenCalledWith('/patients/42/encounter');
    });
  });

  // ========================================================================
  // CLINICAL STATUS BADGES
  // ========================================================================

  describe('Clinical badges', () => {
    it('should show red flags badge when red flags exist', () => {
      const patient = { ...basePatient, red_flags: ['Cauda equina', 'Night pain'] };
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={patient} patientId="1" />
        </MemoryRouter>
      );
      // The badge text "2 sidebar.redFlags" is split by an icon element,
      // so we search for the surrounding span which contains both text nodes
      const badge = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && /2\s+sidebar\.redFlags/.test(element.textContent);
      });
      expect(badge).toBeInTheDocument();
    });

    it('should show allergies when present', () => {
      const patient = { ...basePatient, allergies: ['Penicillin', 'Ibuprofen'] };
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={patient} patientId="1" />
        </MemoryRouter>
      );
      expect(screen.getByText(/Penicillin, Ibuprofen/)).toBeInTheDocument();
    });

    it('should show medication count when medications exist', () => {
      const patient = { ...basePatient, current_medications: ['Paracet', 'Ibux'] };
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={patient} patientId="1" />
        </MemoryRouter>
      );
      // Badge shows "2 medications"
      expect(screen.getByText(/2 medications/)).toBeInTheDocument();
    });

    it('should show main problem badge', () => {
      const patient = { ...basePatient, main_problem: 'Korsryggsmerte' };
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={patient} patientId="1" />
        </MemoryRouter>
      );
      expect(screen.getByText('Korsryggsmerte')).toBeInTheDocument();
    });

    it('should not render badges section when all clinical data is empty', () => {
      render(
        <MemoryRouter>
          <PatientSummaryCard patient={basePatient} patientId="1" />
        </MemoryRouter>
      );
      // No badge text should appear
      expect(screen.queryByText(/Røde flagg/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Korsryggsmerte/)).not.toBeInTheDocument();
    });
  });
});
