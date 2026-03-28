/**
 * ExerciseLibrary Component Tests
 * Tests for the exercise browsing, searching, and filtering component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n (custom module)
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock useMediaQuery hook
vi.mock('../../../hooks/useMediaQuery', () => ({
  default: () => ({
    isMobile: false,
    _isTablet: false,
    prefersReducedMotion: false,
  }),
}));

// Mock VimeoPlayer child component
vi.mock('../../../components/exercises/VimeoPlayer', () => ({
  default: function MockVimeoPlayer({ title, onClose }) {
    return (
      <div data-testid="vimeo-player">
        <span>{title}</span>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

import ExerciseLibrary from '../../../components/exercises/ExerciseLibrary';

// Test data factories
const createExercise = (overrides = {}) => ({
  id: 1,
  name: 'Cat-Cow Stretch',
  name_norwegian: 'Katt-Ku Strekk',
  description: 'Spinal mobility exercise',
  category: 'Mobility',
  body_region: 'Lower Back',
  difficulty_level: 'beginner',
  sets_default: 3,
  reps_default: 10,
  hold_seconds: 0,
  video_url: null,
  thumbnail_url: null,
  image_url: null,
  instructions: 'Start on all fours',
  instructions_norwegian: 'Start pa alle fire',
  precautions: [],
  ...overrides,
});

const createCategory = (name, count) => ({
  category: name,
  exercise_count: count,
});

const defaultCategories = [
  createCategory('Mobility', 5),
  createCategory('Strength', 8),
  createCategory('Balance', 3),
];

describe('ExerciseLibrary Component', () => {
  const mockOnSelectExercise = vi.fn();
  const mockOnCreateExercise = vi.fn();
  const mockOnEditExercise = vi.fn();
  const mockOnDeleteExercise = vi.fn();

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
      body_region: 'Hip',
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render the library heading', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      expect(screen.getByText('Øvelsesbibliotek')).toBeInTheDocument();
    });

    it('should display exercise count', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      expect(screen.getByText(`(${defaultExercises.length})`)).toBeInTheDocument();
    });

    it('should render exercise names in Norwegian', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      expect(screen.getByText('Katt-Ku')).toBeInTheDocument();
      expect(screen.getByText('Planke')).toBeInTheDocument();
    });

    it('should show the loading spinner when loading is true', () => {
      const { container } = render(
        <ExerciseLibrary
          exercises={[]}
          categories={[]}
          loading={true}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should display empty state when no exercises match', () => {
      render(
        <ExerciseLibrary
          exercises={[]}
          categories={[]}
          loading={false}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      expect(screen.getByText('Ingen øvelser funnet')).toBeInTheDocument();
    });

    it('should render category filter pills', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      expect(screen.getByText('Alle')).toBeInTheDocument();
      expect(screen.getByText('Mobility (5)')).toBeInTheDocument();
      expect(screen.getByText('Strength (8)')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SEARCH
  // ============================================================================

  describe('Search', () => {
    it('should filter exercises by search term', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      const searchInput = screen.getByPlaceholderText('Søk etter øvelser...');
      fireEvent.change(searchInput, { target: { value: 'Planke' } });

      expect(screen.getByText('Planke')).toBeInTheDocument();
      expect(screen.queryByText('Katt-Ku')).not.toBeInTheDocument();
    });

    it('should search by English name', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      const searchInput = screen.getByPlaceholderText('Søk etter øvelser...');
      fireEvent.change(searchInput, { target: { value: 'Bird Dog' } });

      expect(screen.getByText('Fuglehund')).toBeInTheDocument();
      expect(screen.queryByText('Planke')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CATEGORY FILTERING
  // ============================================================================

  describe('Category Filtering', () => {
    it('should filter by category when clicking a category pill', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      fireEvent.click(screen.getByText('Balance (3)'));

      expect(screen.getByText('Enstående')).toBeInTheDocument();
      expect(screen.queryByText('Planke')).not.toBeInTheDocument();
    });

    it('should show all exercises when "Alle" is selected', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      // First filter by category
      fireEvent.click(screen.getByText('Balance (3)'));
      // Then reset
      fireEvent.click(screen.getByText('Alle'));

      expect(screen.getByText('Katt-Ku')).toBeInTheDocument();
      expect(screen.getByText('Planke')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SELECTION
  // ============================================================================

  describe('Selection', () => {
    it('should call onSelectExercise when clicking an exercise', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
          selectionMode={true}
        />
      );

      fireEvent.click(screen.getByText('Katt-Ku'));

      expect(mockOnSelectExercise).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Cat-Cow' })
      );
    });

    it('should show selection indicator for selected exercises', () => {
      const selectedExercises = [{ id: 1, exerciseId: 1 }];

      const { container } = render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
          selectedExercises={selectedExercises}
          selectionMode={true}
        />
      );

      // Selected exercise card should have blue border styling
      const selectedCard = container.querySelector('.border-blue-500');
      expect(selectedCard).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CREATE BUTTON
  // ============================================================================

  describe('Create Button', () => {
    it('should render create button when onCreateExercise is provided', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
          onCreateExercise={mockOnCreateExercise}
        />
      );

      expect(screen.getByText('Ny øvelse')).toBeInTheDocument();
    });

    it('should not render create button when onCreateExercise is absent', () => {
      render(
        <ExerciseLibrary
          exercises={defaultExercises}
          categories={defaultCategories}
          onSelectExercise={mockOnSelectExercise}
        />
      );

      expect(screen.queryByText('Ny øvelse')).not.toBeInTheDocument();
    });
  });
});
