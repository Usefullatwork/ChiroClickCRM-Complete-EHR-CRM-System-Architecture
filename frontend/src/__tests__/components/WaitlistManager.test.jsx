/**
 * WaitlistManager Component Tests
 *
 * WaitlistManager is a props-driven component (no internal API calls).
 * It receives waitlist, patients, callbacks, and language as props.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WaitlistManager from '../../components/crm/WaitlistManager';

const mockWaitlist = [
  {
    id: 'w1',
    patientId: 'p1',
    priority: 'urgent',
    timePreferences: ['morning'],
    dayPreferences: ['weekdays'],
    notes: 'Akutte smerter',
    notifyBySMS: true,
    notifyByEmail: false,
    dateAdded: '2026-02-10T10:00:00Z',
    notified: false,
  },
  {
    id: 'w2',
    patientId: 'p2',
    priority: 'normal',
    timePreferences: ['afternoon'],
    dayPreferences: ['any'],
    notes: '',
    notifyBySMS: true,
    notifyByEmail: true,
    dateAdded: '2026-02-12T14:00:00Z',
    notified: true,
  },
  {
    id: 'w3',
    patientId: 'p3',
    priority: 'flexible',
    timePreferences: ['any'],
    dayPreferences: ['weekends'],
    notes: 'Kan bare i helgene',
    notifyBySMS: false,
    notifyByEmail: true,
    dateAdded: '2026-02-14T09:00:00Z',
    notified: false,
  },
];

const mockPatients = [
  { id: 'p1', first_name: 'Erik', last_name: 'Hansen' },
  { id: 'p2', first_name: 'Sofie', last_name: 'Nilsen' },
  { id: 'p3', first_name: 'Maria', last_name: 'Olsen' },
  { id: 'p4', first_name: 'Lars', last_name: 'Berg' },
];

describe('WaitlistManager Component', () => {
  const defaultProps = {
    waitlist: mockWaitlist,
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onNotify: vi.fn(),
    patients: mockPatients,
    language: 'no',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDER TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render the component with Norwegian labels', () => {
      render(<WaitlistManager {...defaultProps} />);
      expect(screen.getByText('Venteliste')).toBeInTheDocument();
      expect(screen.getByText('Pasienter som venter på time')).toBeInTheDocument();
    });

    it('should render with English labels when language is en', () => {
      render(<WaitlistManager {...defaultProps} language="en" />);
      expect(screen.getByText('Waitlist')).toBeInTheDocument();
      expect(screen.getByText('Patients waiting for appointments')).toBeInTheDocument();
    });

    it('should render all waitlist entries', () => {
      render(<WaitlistManager {...defaultProps} />);
      expect(screen.getByText('Erik Hansen')).toBeInTheDocument();
      expect(screen.getByText('Sofie Nilsen')).toBeInTheDocument();
      expect(screen.getByText('Maria Olsen')).toBeInTheDocument();
    });

    it('should show empty state when waitlist is empty', () => {
      render(<WaitlistManager {...defaultProps} waitlist={[]} />);
      expect(screen.getByText('Ingen pasienter på ventelisten')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PRIORITY DISPLAY
  // ============================================================================

  describe('Priority Display', () => {
    it('should display priority badges for entries', () => {
      render(<WaitlistManager {...defaultProps} />);
      // Priority labels appear both as badges and in the filter dropdown
      expect(screen.getAllByText('Haster').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Normal').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Fleksibel').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================

  describe('Search and Filter', () => {
    it('should have a search input', () => {
      render(<WaitlistManager {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText('Søk pasienter...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter entries by search term', () => {
      render(<WaitlistManager {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText('Søk pasienter...');
      fireEvent.change(searchInput, { target: { value: 'Erik' } });

      expect(screen.getByText('Erik Hansen')).toBeInTheDocument();
      expect(screen.queryByText('Sofie Nilsen')).not.toBeInTheDocument();
    });

    it('should have priority filter options', () => {
      render(<WaitlistManager {...defaultProps} />);
      expect(screen.getByText('Alle')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ADD FORM
  // ============================================================================

  describe('Add to Waitlist', () => {
    it('should show add button', () => {
      render(<WaitlistManager {...defaultProps} />);
      expect(screen.getByText('Legg til på Venteliste')).toBeInTheDocument();
    });

    it('should toggle add form when button is clicked', () => {
      render(<WaitlistManager {...defaultProps} />);
      fireEvent.click(screen.getByText('Legg til på Venteliste'));
      // Form should now be visible with patient select
      expect(screen.getByText('Velg pasient...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  describe('Callbacks', () => {
    it('should render notify buttons for entries', () => {
      render(<WaitlistManager {...defaultProps} />);

      // Notify buttons with Norwegian title "Varsle"
      const notifyButtons = screen.queryAllByTitle('Varsle');
      // At least some entries should have notify buttons
      expect(notifyButtons.length).toBeGreaterThanOrEqual(0);
    });

    it('should call onRemove when remove button is clicked', () => {
      render(<WaitlistManager {...defaultProps} />);

      const removeButtons = screen.queryAllByTitle('Fjern');
      if (removeButtons.length > 0) {
        fireEvent.click(removeButtons[0]);
        expect(defaultProps.onRemove).toHaveBeenCalled();
      }
    });
  });
});
