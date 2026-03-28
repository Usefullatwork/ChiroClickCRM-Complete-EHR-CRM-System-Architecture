/**
 * ExercisePanel Component Tests
 * Tests for the combined exercise prescription panel
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock API
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock ExerciseLibrary child
vi.mock('../../../components/exercises/ExerciseLibrary', () => ({
  default: function MockExerciseLibrary({ onSelectExercise, loading }) {
    return (
      <div data-testid="exercise-library">
        {loading && <span data-testid="library-loading">Loading...</span>}
        <button
          data-testid="select-exercise-btn"
          onClick={() =>
            onSelectExercise({
              id: 10,
              name: 'Test Exercise',
              sets_default: 3,
              reps_default: 12,
              hold_seconds: 0,
              frequency_per_day: 1,
              frequency_per_week: 7,
            })
          }
        >
          Select Exercise
        </button>
      </div>
    );
  },
}));

// Mock ExercisePrescription child
vi.mock('../../../components/exercises/ExercisePrescription', () => ({
  default: function MockExercisePrescription({ selectedExercises, onSave, saving, sending }) {
    return (
      <div data-testid="exercise-prescription">
        <span data-testid="selected-count">{selectedExercises.length}</span>
        {saving && <span data-testid="saving">Saving...</span>}
        {sending && <span data-testid="sending">Sending...</span>}
        <button
          data-testid="save-btn"
          onClick={() => onSave({ patientId: 1, exercises: selectedExercises })}
        >
          Save
        </button>
      </div>
    );
  },
}));

import ExercisePanel from '../../../components/exercises/ExercisePanel';
import api from '../../../services/api';

describe('ExercisePanel Component', () => {
  const mockPatient = {
    id: 1,
    first_name: 'Ola',
    last_name: 'Nordmann',
  };

  const defaultProps = {
    patient: mockPatient,
    encounterId: 100,
    isOpen: true,
    onClose: vi.fn(),
    onPrescriptionSaved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: [] } });
    api.post.mockResolvedValue({ data: { data: { id: 1 } } });
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(<ExercisePanel {...defaultProps} isOpen={false} />);

      expect(container.innerHTML).toBe('');
    });

    it('should render the panel header when isOpen', () => {
      render(<ExercisePanel {...defaultProps} />);

      expect(screen.getByText('Øvelsesprogram')).toBeInTheDocument();
    });

    it('should display patient name in header', () => {
      render(<ExercisePanel {...defaultProps} />);

      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    it('should render ExerciseLibrary and ExercisePrescription', () => {
      render(<ExercisePanel {...defaultProps} />);

      expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      expect(screen.getByTestId('exercise-prescription')).toBeInTheDocument();
    });

    it('should render as a dialog with modal role', () => {
      render(<ExercisePanel {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  describe('Data Loading', () => {
    it('should load exercises when panel opens', async () => {
      render(<ExercisePanel {...defaultProps} />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/exercises', {
          params: { limit: 500 },
        });
      });
    });

    it('should load categories when panel opens', async () => {
      render(<ExercisePanel {...defaultProps} />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/exercises/categories');
      });
    });

    it('should display error message when exercises fail to load', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      render(<ExercisePanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Kunne ikke laste øvelser')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EXERCISE SELECTION
  // ============================================================================

  describe('Exercise Selection', () => {
    it('should add exercise to selection when clicked', async () => {
      render(<ExercisePanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
      });
    });
  });

  // ============================================================================
  // CLOSE PANEL
  // ============================================================================

  describe('Close Panel', () => {
    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(<ExercisePanel {...defaultProps} />);

      const backdrop = container.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // PDF HANDOUT
  // ============================================================================

  describe('PDF Handout', () => {
    it('should render PDF-handout button', () => {
      render(<ExercisePanel {...defaultProps} />);

      expect(screen.getByText('PDF-handout')).toBeInTheDocument();
    });

    it('should disable PDF button when no patient', () => {
      render(<ExercisePanel {...defaultProps} patient={null} />);

      const pdfBtn = screen.getByTitle('Last ned PDF-handout');
      expect(pdfBtn).toBeDisabled();
    });
  });
});
