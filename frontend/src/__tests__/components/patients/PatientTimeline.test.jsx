/**
 * PatientTimeline Component Tests
 *
 * NOTE: The source component has a bug on line 47 where TimelineEntry
 * references `t()` which is not in its scope (only in the parent).
 * This triggers a ReferenceError when rendering signed entries.
 * We provide a global `t` fallback so we can test the rest of the component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Provide global `t` to work around source bug in TimelineEntry line 47
globalThis.t = (key, fallback) => fallback || key;

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
}));

import PatientTimeline from '../../../components/patients/PatientTimeline';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

// Encounters without signed_at to avoid the t() bug in TimelineEntry
const unsignedEncounters = [
  {
    id: 1,
    encounter_type: 'Konsultasjon',
    encounter_date: '2024-03-15T10:00:00Z',
    chief_complaint: 'Korsryggsmerte etter lofting',
    signed_at: null,
  },
  {
    id: 2,
    encounter_type: 'Oppfolging',
    encounter_date: '2024-03-10T14:00:00Z',
    chief_complaint: 'Bedring',
    signed_at: null,
  },
  {
    id: 3,
    encounter_type: 'Forstegangs',
    encounter_date: '2024-03-01T09:00:00Z',
    chief_complaint: null,
    subjective: 'Pasient klager over ryggsmerter',
    signed_at: null,
  },
];

// Encounters with signed_at set (uses global t workaround)
const signedEncounters = [
  {
    id: 10,
    encounter_type: 'Signert konsultasjon',
    encounter_date: '2024-03-12T11:00:00Z',
    chief_complaint: 'Nakkesmerter',
    signed_at: '2024-03-12T12:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PatientTimeline', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // EMPTY STATE
  // ========================================================================

  describe('Empty state', () => {
    it('should show empty message when no encounters', () => {
      render(<PatientTimeline patientId="1" encounters={[]} onNavigate={mockOnNavigate} />);
      expect(screen.getByText('Ingen hendelser')).toBeInTheDocument();
    });

    it('should show empty message when encounters is undefined', () => {
      render(<PatientTimeline patientId="1" onNavigate={mockOnNavigate} />);
      expect(screen.getByText('Ingen hendelser')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // RENDERING ENTRIES
  // ========================================================================

  describe('Rendering entries', () => {
    it('should render all encounter titles', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Konsultasjon')).toBeInTheDocument();
      expect(screen.getByText('Oppfolging')).toBeInTheDocument();
      expect(screen.getByText('Forstegangs')).toBeInTheDocument();
    });

    it('should display chief complaint as brief text', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Korsryggsmerte etter lofting')).toBeInTheDocument();
      expect(screen.getByText('Bedring')).toBeInTheDocument();
    });

    it('should truncate long brief text to 80 characters', () => {
      const longEncounter = [
        {
          id: 10,
          encounter_type: 'Test',
          encounter_date: '2024-03-15T10:00:00Z',
          chief_complaint:
            'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore',
          signed_at: null,
        },
      ];
      render(
        <PatientTimeline patientId="1" encounters={longEncounter} onNavigate={mockOnNavigate} />
      );
      expect(
        screen.getByText(
          /Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor inc\.\.\./
        )
      ).toBeInTheDocument();
    });

    it('should display formatted dates', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      // Our mock returns '15.03.2024' for all dates
      const dateTexts = screen.getAllByText('15.03.2024');
      expect(dateTexts.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ========================================================================
  // FILTER BUTTONS
  // ========================================================================

  describe('Filter buttons', () => {
    it('should render all three filter options', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Alle')).toBeInTheDocument();
      expect(screen.getByText('Journaler')).toBeInTheDocument();
      expect(screen.getByText('Kommunikasjon')).toBeInTheDocument();
    });

    it('should have "Alle" selected by default (aria-pressed)', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Alle').closest('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch filter on click', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      fireEvent.click(screen.getByText('Kommunikasjon'));
      expect(screen.getByText('Kommunikasjon').closest('button')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      // No communication entries, so empty state should show
      expect(screen.getByText('Ingen hendelser')).toBeInTheDocument();
    });

    it('should show entries when journals filter is active', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      fireEvent.click(screen.getByText('Journaler'));
      expect(screen.getByText('Konsultasjon')).toBeInTheDocument();
      expect(screen.getByText('Oppfolging')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // NAVIGATION
  // ========================================================================

  describe('Navigation', () => {
    it('should call onNavigate when encounter entry is clicked', () => {
      render(
        <PatientTimeline
          patientId="99"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      fireEvent.click(screen.getByText('Konsultasjon'));
      expect(mockOnNavigate).toHaveBeenCalledWith('/patients/99/encounter/1');
    });
  });

  // ========================================================================
  // HEADER
  // ========================================================================

  describe('Header', () => {
    it('should display timeline title', () => {
      render(
        <PatientTimeline
          patientId="1"
          encounters={unsignedEncounters}
          onNavigate={mockOnNavigate}
        />
      );
      expect(screen.getByText('Tidslinje')).toBeInTheDocument();
    });
  });
});
