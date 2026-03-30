/**
 * PrescriptionCard Component Tests
 * Tests for the individual exercise card in prescription view
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

import PrescriptionCard from '../../../components/exercises/PrescriptionCard';

describe('PrescriptionCard Component', () => {
  const mockOnToggleExpand = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnMoveUp = vi.fn();
  const mockOnMoveDown = vi.fn();

  const defaultExercise = {
    id: 1,
    name: 'Cat-Cow Stretch',
    name_norwegian: 'Katt-Ku Strekk',
    category: 'Mobility',
    difficulty_level: 'beginner',
    sets: 3,
    reps: 10,
    holdSeconds: 0,
    hold_seconds: 0,
    frequencyPerDay: 1,
    frequencyPerWeek: 7,
    video_url: null,
    instructions: 'Start on all fours',
    instructions_norwegian: 'Start pa alle fire',
    customInstructions: '',
    precautions: [],
  };

  const defaultProps = {
    exercise: defaultExercise,
    index: 0,
    isExpanded: false,
    onToggleExpand: mockOnToggleExpand,
    onUpdate: mockOnUpdate,
    onRemove: mockOnRemove,
    onMoveUp: mockOnMoveUp,
    onMoveDown: mockOnMoveDown,
    canMoveUp: true,
    canMoveDown: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render the exercise name in Norwegian', () => {
      render(<PrescriptionCard {...defaultProps} />);

      expect(screen.getByText('Katt-Ku Strekk')).toBeInTheDocument();
    });

    it('should display the order number (1-indexed)', () => {
      render(<PrescriptionCard {...defaultProps} index={2} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display the exercise category', () => {
      render(<PrescriptionCard {...defaultProps} />);

      expect(screen.getByText('Mobility')).toBeInTheDocument();
    });

    it('should show difficulty badge with correct label', () => {
      render(<PrescriptionCard {...defaultProps} />);

      expect(screen.getByText('Nybegynner')).toBeInTheDocument();
    });

    it('should show intermediate difficulty label', () => {
      render(
        <PrescriptionCard
          {...defaultProps}
          exercise={{ ...defaultExercise, difficulty_level: 'intermediate' }}
        />
      );

      expect(screen.getByText('Middels')).toBeInTheDocument();
    });

    it('should show advanced difficulty label', () => {
      render(
        <PrescriptionCard
          {...defaultProps}
          exercise={{ ...defaultExercise, difficulty_level: 'advanced' }}
        />
      );

      expect(screen.getByText('Avansert')).toBeInTheDocument();
    });

    it('should show Video indicator when video_url is present', () => {
      render(
        <PrescriptionCard
          {...defaultProps}
          exercise={{ ...defaultExercise, video_url: 'https://vimeo.com/123' }}
        />
      );

      expect(screen.getByText('Video')).toBeInTheDocument();
    });

    it('should not show Video indicator when video_url is absent', () => {
      render(<PrescriptionCard {...defaultProps} />);

      expect(screen.queryByText('Video')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // SET/REP CONTROLS
  // ============================================================================

  describe('Sets and Reps Controls', () => {
    it('should display current sets value', () => {
      const { container } = render(<PrescriptionCard {...defaultProps} />);

      const setsInput = container.querySelector('input[type="number"]');
      expect(setsInput).toHaveValue(3);
    });

    it('should call onUpdate when sets input changes', () => {
      const { container } = render(<PrescriptionCard {...defaultProps} />);

      const inputs = container.querySelectorAll('input[type="number"]');
      // First input is sets
      fireEvent.change(inputs[0], { target: { value: '5' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('sets', 5);
    });

    it('should call onUpdate when reps input changes', () => {
      const { container } = render(<PrescriptionCard {...defaultProps} />);

      const inputs = container.querySelectorAll('input[type="number"]');
      // Second input is reps
      fireEvent.change(inputs[1], { target: { value: '15' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('reps', 15);
    });
  });

  // ============================================================================
  // MOVE AND REMOVE ACTIONS
  // ============================================================================

  describe('Move and Remove Actions', () => {
    it('should call onMoveUp when move up button is clicked', () => {
      render(<PrescriptionCard {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Flytt opp'));

      expect(mockOnMoveUp).toHaveBeenCalled();
    });

    it('should call onMoveDown when move down button is clicked', () => {
      render(<PrescriptionCard {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Flytt ned'));

      expect(mockOnMoveDown).toHaveBeenCalled();
    });

    it('should disable move up when canMoveUp is false', () => {
      render(<PrescriptionCard {...defaultProps} canMoveUp={false} />);

      expect(screen.getByTitle('Flytt opp')).toBeDisabled();
    });

    it('should disable move down when canMoveDown is false', () => {
      render(<PrescriptionCard {...defaultProps} canMoveDown={false} />);

      expect(screen.getByTitle('Flytt ned')).toBeDisabled();
    });

    it('should call onRemove when remove button is clicked', () => {
      render(<PrescriptionCard {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Fjern'));

      expect(mockOnRemove).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EXPANDED DETAILS
  // ============================================================================

  describe('Expanded Details', () => {
    it('should not show expanded content when isExpanded is false', () => {
      render(<PrescriptionCard {...defaultProps} isExpanded={false} />);

      expect(screen.queryByText('Standard instruksjoner')).not.toBeInTheDocument();
    });

    it('should show instructions when expanded', () => {
      render(<PrescriptionCard {...defaultProps} isExpanded={true} />);

      expect(screen.getByText('Standard instruksjoner')).toBeInTheDocument();
      expect(screen.getByText('Start pa alle fire')).toBeInTheDocument();
    });

    it('should show custom instructions textarea when expanded', () => {
      render(<PrescriptionCard {...defaultProps} isExpanded={true} />);

      expect(screen.getByText('Spesielle instruksjoner til pasienten')).toBeInTheDocument();
    });

    it('should show precautions when expanded and precautions exist', () => {
      render(
        <PrescriptionCard
          {...defaultProps}
          isExpanded={true}
          exercise={{
            ...defaultExercise,
            precautions: ['Stopp ved smerte', 'Ikke overanstreng'],
          }}
        />
      );

      expect(screen.getByText('Forsiktighetsregler')).toBeInTheDocument();
      expect(screen.getByText('Stopp ved smerte')).toBeInTheDocument();
      expect(screen.getByText('Ikke overanstreng')).toBeInTheDocument();
    });

    it('should call onToggleExpand when edit button is clicked', () => {
      render(<PrescriptionCard {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Rediger'));

      expect(mockOnToggleExpand).toHaveBeenCalled();
    });

    it('should show weekly frequency buttons when expanded', () => {
      render(<PrescriptionCard {...defaultProps} isExpanded={true} />);

      expect(screen.getByText('Ukentlig frekvens')).toBeInTheDocument();
      expect(screen.getByText('dager per uke')).toBeInTheDocument();
      // Days 2-7 are unambiguous (1 conflicts with order number)
      for (let day = 2; day <= 7; day++) {
        expect(screen.getByText(String(day))).toBeInTheDocument();
      }
    });

    it('should call onUpdate when weekly frequency button is clicked', () => {
      render(<PrescriptionCard {...defaultProps} isExpanded={true} />);

      fireEvent.click(screen.getByText('5'));

      expect(mockOnUpdate).toHaveBeenCalledWith('frequencyPerWeek', 5);
    });
  });

  // ============================================================================
  // HOLD SECONDS
  // ============================================================================

  describe('Hold Seconds', () => {
    it('should show hold seconds control when exercise has hold time', () => {
      render(
        <PrescriptionCard
          {...defaultProps}
          exercise={{ ...defaultExercise, holdSeconds: 30, hold_seconds: 30 }}
        />
      );

      // Should have a third number input for hold seconds
      const { container } = render(
        <PrescriptionCard
          {...defaultProps}
          exercise={{ ...defaultExercise, holdSeconds: 30, hold_seconds: 30 }}
        />
      );

      // "sek" label should appear
      expect(screen.getAllByText('sek').length).toBeGreaterThan(0);
    });

    it('should not show hold seconds when hold time is zero', () => {
      render(<PrescriptionCard {...defaultProps} />);

      expect(screen.queryByText('sek')).not.toBeInTheDocument();
    });
  });
});
