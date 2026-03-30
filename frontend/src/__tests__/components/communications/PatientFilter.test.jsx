/**
 * PatientFilter Component Tests
 * Tests for patient selection and filtering in communications
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

import PatientFilter, {
  PatientFilterCompact,
} from '../../../components/communications/PatientFilter';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

const mockPatients = [
  {
    id: 1,
    firstName: 'Ola',
    lastName: 'Nordmann',
    phone: '+4712345678',
    email: 'ola@example.com',
    status: 'ACTIVE',
    category: 'REGULAR',
    consentSms: true,
    consentEmail: true,
    lastVisitDate: '2026-03-15',
  },
  {
    id: 2,
    firstName: 'Kari',
    lastName: 'Hansen',
    phone: '+4787654321',
    email: 'kari@example.com',
    status: 'ACTIVE',
    category: 'VIP',
    consentSms: true,
    consentEmail: false,
    lastVisitDate: '2026-02-01',
  },
  {
    id: 3,
    firstName: 'Per',
    lastName: 'Olsen',
    phone: null,
    email: 'per@example.com',
    status: 'INACTIVE',
    category: 'REGULAR',
    consentSms: true,
    consentEmail: true,
    lastVisitDate: '2025-06-01',
  },
  {
    id: 4,
    firstName: 'Anne',
    lastName: 'Berg',
    phone: '+4799887766',
    email: null,
    status: 'ACTIVE',
    category: 'FAMILY',
    consentSms: false,
    consentEmail: false,
    lastVisitDate: '2026-03-20',
  },
];

describe('PatientFilter Component', () => {
  const mockOnSelectionChange = vi.fn();
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render the search input in Norwegian', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );
      expect(screen.getByPlaceholderText('Sok etter pasienter...')).toBeInTheDocument();
    });

    it('should render search input in English when language is en', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          language="en"
        />
      );
      expect(screen.getByPlaceholderText('Search patients...')).toBeInTheDocument();
    });

    it('should render Velg Alle and Fjern Valg buttons', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );
      expect(screen.getByText('Velg Alle')).toBeInTheDocument();
      expect(screen.getByText('Fjern Valg')).toBeInTheDocument();
    });

    it('should show patient count', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[1]}
          onSelectionChange={mockOnSelectionChange}
        />
      );
      // Should show "1 av X pasienter"
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('pasienter')).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      renderWithRouter(
        <PatientFilter
          patients={[]}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          isLoading={true}
        />
      );
      // The loading spinner should be present
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show empty state when no patients match', () => {
      renderWithRouter(
        <PatientFilter
          patients={[]}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );
      expect(screen.getByText('Ingen pasienter matcher filtrene')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PATIENT LIST (filtered by default ACTIVE status + SMS consent)
  // ============================================================================

  describe('Patient List', () => {
    it('should display patients filtered by ACTIVE status by default', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          showConsentFilter={false}
        />
      );
      // ACTIVE patients: Ola (1), Kari (2), Anne (4). Per (3) is INACTIVE.
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.getByText('Anne Berg')).toBeInTheDocument();
      expect(screen.queryByText('Per Olsen')).not.toBeInTheDocument();
    });

    it('should filter out patients without SMS consent when consent required', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          communicationType="SMS"
          showConsentFilter={true}
        />
      );
      // SMS consent + phone required: Ola has both, Kari has both, Anne has consentSms=false
      // Per has no phone and is INACTIVE
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.queryByText('Anne Berg')).not.toBeInTheDocument();
    });

    it('should show patient phone number for SMS communication type', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          communicationType="SMS"
          showConsentFilter={false}
        />
      );
      expect(screen.getByText('+4712345678')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SEARCH
  // ============================================================================

  describe('Search', () => {
    it('should filter patients by search query', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          showConsentFilter={false}
        />
      );

      const searchInput = screen.getByPlaceholderText('Sok etter pasienter...');
      fireEvent.change(searchInput, { target: { value: 'Ola' } });

      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.queryByText('Kari Hansen')).not.toBeInTheDocument();
    });

    it('should search by phone number', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          showConsentFilter={false}
        />
      );

      const searchInput = screen.getByPlaceholderText('Sok etter pasienter...');
      fireEvent.change(searchInput, { target: { value: '87654321' } });

      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
    });

    it('should show clear button when search has text', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Sok etter pasienter...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // A clear (X) button should appear
      const clearButtons = document.querySelectorAll('button');
      const clearBtn = Array.from(clearButtons).find(
        (btn) => btn.querySelector('svg') && btn.closest('.relative')
      );
      expect(clearBtn).toBeTruthy();
    });
  });

  // ============================================================================
  // SELECTION
  // ============================================================================

  describe('Selection', () => {
    it('should call onSelectionChange when Select All is clicked', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          showConsentFilter={false}
        />
      );

      fireEvent.click(screen.getByText('Velg Alle'));

      expect(mockOnSelectionChange).toHaveBeenCalled();
      // Should receive IDs of filtered (ACTIVE) patients
      const calledWith = mockOnSelectionChange.mock.calls[0][0];
      expect(calledWith).toContain(1);
      expect(calledWith).toContain(2);
      expect(calledWith).toContain(4);
    });

    it('should call onSelectionChange with empty array when Clear Selection is clicked', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[1, 2]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('Fjern Valg'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should toggle individual patient selection', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          showConsentFilter={false}
        />
      );

      fireEvent.click(screen.getByText('Ola Nordmann'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith([1]);
    });

    it('should deselect a selected patient when clicked', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[1]}
          onSelectionChange={mockOnSelectionChange}
          showConsentFilter={false}
        />
      );

      fireEvent.click(screen.getByText('Ola Nordmann'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should show max selection warning when limit reached', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[1, 2, 3]}
          onSelectionChange={mockOnSelectionChange}
          maxSelection={3}
        />
      );

      expect(screen.getByText('Maksimalt 3 pasienter kan velges')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ADVANCED FILTERS
  // ============================================================================

  describe('Advanced Filters', () => {
    it('should toggle advanced filters panel', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('Filtre'));

      // Status filter labels should appear
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Aktiv')).toBeInTheDocument();
      expect(screen.getByText('Inaktiv')).toBeInTheDocument();
    });

    it('should show category filters when advanced filters are open', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('Filtre'));

      expect(screen.getByText('Kategori')).toBeInTheDocument();
      // "Fast pasient" appears in filter buttons AND in patient category badges, use getAllByText
      const fastPasientElements = screen.getAllByText('Fast pasient');
      expect(fastPasientElements.length).toBeGreaterThanOrEqual(1);
      // VIP also appears in both filter and patient badge
      const vipElements = screen.getAllByText('VIP');
      expect(vipElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show last visit presets when advanced filters are open', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('Filtre'));

      expect(screen.getByText('Siste 7 dager')).toBeInTheDocument();
      expect(screen.getByText('Siste 30 dager')).toBeInTheDocument();
    });

    it('should show consent filter checkbox', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
          showConsentFilter={true}
        />
      );

      fireEvent.click(screen.getByText('Filtre'));

      expect(screen.getByText(/Kun pasienter med samtykke/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SORT
  // ============================================================================

  describe('Sorting', () => {
    it('should render sort controls', () => {
      renderWithRouter(
        <PatientFilter
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('Sorter etter:')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PatientFilterCompact
  // ============================================================================

  describe('PatientFilterCompact', () => {
    it('should render compact search input', () => {
      renderWithRouter(
        <PatientFilterCompact
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );
      expect(screen.getByPlaceholderText('Sok...')).toBeInTheDocument();
    });

    it('should display patient names', () => {
      renderWithRouter(
        <PatientFilterCompact
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    it('should show selected count', () => {
      renderWithRouter(
        <PatientFilterCompact
          patients={mockPatients}
          selectedPatients={[1, 2]}
          onSelectionChange={mockOnSelectionChange}
        />
      );
      expect(screen.getByText('2 valgt')).toBeInTheDocument();
    });

    it('should filter patients by search in compact mode', () => {
      renderWithRouter(
        <PatientFilterCompact
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Sok...');
      fireEvent.change(searchInput, { target: { value: 'Kari' } });

      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
    });

    it('should call onSelectionChange when a patient is clicked in compact mode', () => {
      renderWithRouter(
        <PatientFilterCompact
          patients={mockPatients}
          selectedPatients={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('Ola Nordmann'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith([1]);
    });

    it('should show English labels when language is en', () => {
      renderWithRouter(
        <PatientFilterCompact
          patients={mockPatients}
          selectedPatients={[1]}
          onSelectionChange={mockOnSelectionChange}
          language="en"
        />
      );
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });
});
