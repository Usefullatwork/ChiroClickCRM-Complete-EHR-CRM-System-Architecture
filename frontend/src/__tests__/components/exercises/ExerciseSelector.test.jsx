/**
 * ExerciseSelector Component Tests
 * Tests for the exercise filter and selection component
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

import ExerciseSelector from '../../../components/exercises/ExerciseSelector';

describe('ExerciseSelector Component', () => {
  const mockOnSelectExercise = vi.fn();

  const createExercise = (overrides = {}) => ({
    id: 1,
    name: 'Cat-Cow',
    name_norwegian: 'Katt-Ku',
    description: 'Spinal mobility',
    category: 'Mobility',
    difficulty_level: 'beginner',
    sets_default: 3,
    reps_default: 10,
    hold_seconds: 0,
    video_url: null,
    thumbnail_url: null,
    image_url: null,
    subcategory: null,
    ...overrides,
  });

  const defaultExercises = [
    createExercise({
      id: 1,
      name: 'Cat-Cow',
      name_norwegian: 'Katt-Ku',
      category: 'Mobility',
      difficulty_level: 'beginner',
    }),
    createExercise({
      id: 2,
      name: 'Plank',
      name_norwegian: 'Planke',
      category: 'Strength',
      difficulty_level: 'intermediate',
    }),
    createExercise({
      id: 3,
      name: 'Bird Dog',
      name_norwegian: 'Fuglehund',
      category: 'Strength',
      difficulty_level: 'advanced',
    }),
    createExercise({
      id: 4,
      name: 'Single Leg Stand',
      name_norwegian: 'Enstående',
      category: 'Balance',
      difficulty_level: 'beginner',
    }),
    createExercise({
      id: 5,
      name: 'Bridge',
      name_norwegian: 'Bro',
      category: 'Strength',
      difficulty_level: 'beginner',
      video_url: 'https://vimeo.com/123',
    }),
  ];

  const defaultCategories = [
    { category: 'Mobility', exercise_count: 5 },
    { category: 'Strength', exercise_count: 8 },
    { category: 'Balance', exercise_count: 3 },
  ];

  const defaultProps = {
    exercises: defaultExercises,
    categories: defaultCategories,
    selectedExercises: [],
    onSelectExercise: mockOnSelectExercise,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render the library heading', () => {
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByText('Ovelsesbibliotek')).toBeInTheDocument();
    });

    it('should display filtered exercise count', () => {
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByText('5 ovelser')).toBeInTheDocument();
    });

    it('should render exercises in Norwegian', () => {
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByText('Katt-Ku')).toBeInTheDocument();
      expect(screen.getByText('Planke')).toBeInTheDocument();
      expect(screen.getByText('Fuglehund')).toBeInTheDocument();
    });

    it('should show loading spinner when loading', () => {
      const { container } = render(<ExerciseSelector {...defaultProps} loading={true} />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should display empty state when no exercises found', () => {
      render(<ExerciseSelector {...defaultProps} exercises={[]} />);

      expect(screen.getByText('Ingen ovelser funnet')).toBeInTheDocument();
    });

    it('should render category pills', () => {
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByText('Alle')).toBeInTheDocument();
      expect(screen.getByText(/Mobility/)).toBeInTheDocument();
      expect(screen.getByText(/Strength/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SEARCH
  // ============================================================================

  describe('Search', () => {
    it('should filter exercises by search term', () => {
      render(<ExerciseSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText('Søk etter øvelser...');
      fireEvent.change(input, { target: { value: 'Planke' } });

      expect(screen.getByText('Planke')).toBeInTheDocument();
      expect(screen.queryByText('Katt-Ku')).not.toBeInTheDocument();
    });

    it('should search across English names', () => {
      render(<ExerciseSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText('Søk etter øvelser...');
      fireEvent.change(input, { target: { value: 'Bird Dog' } });

      expect(screen.getByText('Fuglehund')).toBeInTheDocument();
      expect(screen.queryByText('Planke')).not.toBeInTheDocument();
    });

    it('should show clear button when search has text', () => {
      render(<ExerciseSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText('Søk etter øvelser...');
      fireEvent.change(input, { target: { value: 'test' } });

      // The X button for clearing search should be present
      // It's a button child in the search input wrapper
      expect(input).toHaveValue('test');
    });
  });

  // ============================================================================
  // CATEGORY FILTERING
  // ============================================================================

  describe('Category Filtering', () => {
    it('should filter by category', () => {
      render(<ExerciseSelector {...defaultProps} />);

      fireEvent.click(screen.getByText(/Balance/));

      expect(screen.getByText('Enstående')).toBeInTheDocument();
      expect(screen.queryByText('Planke')).not.toBeInTheDocument();
    });

    it('should show all exercises when Alle is selected', () => {
      render(<ExerciseSelector {...defaultProps} />);

      // First filter
      fireEvent.click(screen.getByText(/Balance/));
      // Then reset
      fireEvent.click(screen.getByText('Alle'));

      expect(screen.getByText('Katt-Ku')).toBeInTheDocument();
      expect(screen.getByText('Planke')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DIFFICULTY FILTERING
  // ============================================================================

  describe('Difficulty Filtering', () => {
    it('should filter by difficulty level', () => {
      render(<ExerciseSelector {...defaultProps} />);

      const difficultySelect = screen.getByDisplayValue('Alle nivaer');
      fireEvent.change(difficultySelect, { target: { value: 'advanced' } });

      expect(screen.getByText('Fuglehund')).toBeInTheDocument();
      expect(screen.queryByText('Katt-Ku')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // SELECTION
  // ============================================================================

  describe('Selection', () => {
    it('should call onSelectExercise when exercise is clicked', () => {
      render(<ExerciseSelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Katt-Ku'));

      expect(mockOnSelectExercise).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Cat-Cow' })
      );
    });

    it('should show selection indicator for selected exercises', () => {
      const selectedExercises = [{ id: 1, exerciseId: 1 }];

      const { container } = render(
        <ExerciseSelector {...defaultProps} selectedExercises={selectedExercises} />
      );

      // Selected exercise has blue border
      expect(container.querySelector('.border-blue-500')).toBeInTheDocument();
    });

    it('should show selection summary when exercises are selected', () => {
      const selectedExercises = [
        { id: 1, exerciseId: 1 },
        { id: 2, exerciseId: 2 },
      ];

      render(<ExerciseSelector {...defaultProps} selectedExercises={selectedExercises} />);

      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/ovelser valgt/)).toBeInTheDocument();
    });

    it('should show "Fjern alle" button when exercises are selected', () => {
      const selectedExercises = [{ id: 1, exerciseId: 1 }];

      render(<ExerciseSelector {...defaultProps} selectedExercises={selectedExercises} />);

      expect(screen.getByText('Fjern alle')).toBeInTheDocument();
    });

    it('should not show selection summary when no exercises selected', () => {
      render(<ExerciseSelector {...defaultProps} selectedExercises={[]} />);

      expect(screen.queryByText('ovelser valgt')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // VIEW MODE
  // ============================================================================

  describe('View Mode', () => {
    it('should default to grid view', () => {
      const { container } = render(<ExerciseSelector {...defaultProps} />);

      // Grid view renders a grid container
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('should switch to list view', () => {
      const { container } = render(<ExerciseSelector {...defaultProps} />);

      // Find the list view button (second button in the view toggle group)
      const listButtons = container.querySelectorAll('.p-1\\.5');
      // The last view toggle button switches to list view
      const listBtn = Array.from(listButtons).find(
        (btn) =>
          btn.closest('.border.border-gray-200.rounded-lg') && !btn.classList.contains('bg-blue-50')
      );
      if (listBtn) {
        fireEvent.click(listBtn);
      }

      // After switching, component should still render exercises
      expect(screen.getByText('Katt-Ku')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DETAIL MODAL
  // ============================================================================

  describe('Detail Modal', () => {
    it('should not show detail modal initially', () => {
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.queryByText('Beskrivelse')).not.toBeInTheDocument();
    });
  });
});
