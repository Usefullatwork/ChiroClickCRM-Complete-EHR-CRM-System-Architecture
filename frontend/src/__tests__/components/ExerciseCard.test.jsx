/**
 * ExerciseCard Component Tests
 * Tests for the exercise card component used in patient portal and prescriptions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import _userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExerciseCard from '../../components/patient/ExerciseCard';
import { createMockExercise } from '../setup';

describe('ExerciseCard Component', () => {
  const mockExercise = createMockExercise();
  const mockOnComplete = vi.fn();
  const mockOnViewDetails = vi.fn();
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // DEFAULT VARIANT TESTS
  // ============================================================================

  describe('Default Variant', () => {
    it('should render exercise name', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      expect(screen.getByText(mockExercise.name)).toBeInTheDocument();
    });

    it('should display exercise category', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      expect(screen.getByText(mockExercise.category)).toBeInTheDocument();
    });

    it('should show sets and reps', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      expect(screen.getByText(`${mockExercise.sets} sett`)).toBeInTheDocument();
      expect(screen.getByText(`${mockExercise.reps} rep`)).toBeInTheDocument();
    });

    it('should show hold time when specified', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      expect(screen.getByText(`Hold ${mockExercise.holdSeconds} sek`)).toBeInTheDocument();
    });

    it('should display difficulty badge with correct label', () => {
      render(<ExerciseCard exercise={mockExercise} />);
      // beginner maps to 'Nybegynner'
      expect(screen.getByText('Nybegynner')).toBeInTheDocument();
    });

    it('should display "Middels" for intermediate difficulty', () => {
      const intermediateExercise = createMockExercise({ difficultyLevel: 'intermediate' });
      render(<ExerciseCard exercise={intermediateExercise} />);
      expect(screen.getByText('Middels')).toBeInTheDocument();
    });

    it('should display "Avansert" for advanced difficulty', () => {
      const advancedExercise = createMockExercise({ difficultyLevel: 'advanced' });
      render(<ExerciseCard exercise={advancedExercise} />);
      expect(screen.getByText('Avansert')).toBeInTheDocument();
    });

    it('should expand on click to show instructions', async () => {
      render(<ExerciseCard exercise={mockExercise} />);

      // Click to expand
      fireEvent.click(screen.getByText(mockExercise.name));

      // Instructions should be visible
      await waitFor(() => {
        expect(screen.getByText('Instruksjoner')).toBeInTheDocument();
        expect(screen.getByText(mockExercise.instructions)).toBeInTheDocument();
      });
    });

    it('should show precautions when expanded', async () => {
      render(<ExerciseCard exercise={mockExercise} />);

      // Click to expand
      fireEvent.click(screen.getByText(mockExercise.name));

      await waitFor(() => {
        expect(screen.getByText('Forsiktighetsregler')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking expanded card', async () => {
      render(<ExerciseCard exercise={mockExercise} />);

      // Click to expand
      fireEvent.click(screen.getByText(mockExercise.name));

      // Verify expanded
      await waitFor(() => {
        expect(screen.getByText('Instruksjoner')).toBeInTheDocument();
      });

      // Click to collapse
      fireEvent.click(screen.getByText(mockExercise.name));

      // Instructions should not be visible
      await waitFor(() => {
        expect(screen.queryByText('Instruksjoner')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COMPLETION STATE TESTS
  // ============================================================================

  describe('Completion State', () => {
    it('should show not completed state by default', () => {
      render(<ExerciseCard exercise={mockExercise} />);

      // Should not have the completed styling
      const card = screen.getByText(mockExercise.name).closest('div');
      expect(card).not.toHaveClass('border-green-300');
    });

    it('should show completed state when completed prop is true', () => {
      render(<ExerciseCard exercise={mockExercise} completed={true} />);

      // Should show check icon - verify the card has green styling
      const container = document.querySelector('.bg-green-500');
      expect(container).toBeInTheDocument();
    });

    it('should show completed state when completedToday prop is true', () => {
      render(<ExerciseCard exercise={mockExercise} completedToday={true} />);

      const container = document.querySelector('.bg-green-500');
      expect(container).toBeInTheDocument();
    });

    it('should show completed state when exercise.completedToday is true', () => {
      const completedExercise = createMockExercise({ completedToday: true });
      render(<ExerciseCard exercise={completedExercise} />);

      const container = document.querySelector('.bg-green-500');
      expect(container).toBeInTheDocument();
    });

    it('should call onComplete when complete button is clicked', async () => {
      render(
        <ExerciseCard exercise={mockExercise} onComplete={mockOnComplete} showActions={true} />
      );

      // Expand the card
      fireEvent.click(screen.getByText(mockExercise.name));

      // Find and click the complete button
      await waitFor(() => {
        const completeButton = screen.getByText('Marker som fullfort');
        expect(completeButton).toBeInTheDocument();
        fireEvent.click(completeButton);
      });

      expect(mockOnComplete).toHaveBeenCalledWith(mockExercise.id);
    });

    it('should show "Fullfort" text when completed', async () => {
      render(<ExerciseCard exercise={mockExercise} completed={true} showActions={true} />);

      // Expand the card
      fireEvent.click(screen.getByText(mockExercise.name));

      await waitFor(() => {
        expect(screen.getByText('Fullfort')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COMPACT VARIANT TESTS
  // ============================================================================

  describe('Compact Variant', () => {
    it('should render in compact mode', () => {
      render(<ExerciseCard exercise={mockExercise} compact={true} />);
      expect(screen.getByText(mockExercise.name)).toBeInTheDocument();
    });

    it('should show video indicator in compact mode', () => {
      render(<ExerciseCard exercise={mockExercise} compact={true} />);
      expect(screen.getByText('Video')).toBeInTheDocument();
    });

    it('should call onClick when compact card is clicked', () => {
      render(<ExerciseCard exercise={mockExercise} compact={true} onClick={mockOnClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledWith(mockExercise);
    });

    it('should show completion check in compact mode', () => {
      render(<ExerciseCard exercise={mockExercise} compact={true} completed={true} />);

      // Check for green background indicating completion
      const container = document.querySelector('.bg-green-500');
      expect(container).toBeInTheDocument();
    });
  });

  // ============================================================================
  // THUMBNAIL VARIANT TESTS
  // ============================================================================

  describe('Thumbnail Variant', () => {
    it('should render in thumbnail mode', () => {
      render(<ExerciseCard exercise={mockExercise} variant="thumbnail" />);
      expect(screen.getByText(mockExercise.name)).toBeInTheDocument();
    });

    it('should display thumbnail image when available', () => {
      render(<ExerciseCard exercise={mockExercise} variant="thumbnail" />);
      const img = screen.getByAltText(mockExercise.name);
      expect(img).toHaveAttribute('src', mockExercise.thumbnailUrl);
    });

    it('should show video badge in thumbnail mode', () => {
      render(<ExerciseCard exercise={mockExercise} variant="thumbnail" />);
      expect(screen.getByText('Video')).toBeInTheDocument();
    });

    it('should call onClick when thumbnail card is clicked', () => {
      render(<ExerciseCard exercise={mockExercise} variant="thumbnail" onClick={mockOnClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledWith(mockExercise);
    });

    it('should show completion badge in thumbnail mode', () => {
      render(<ExerciseCard exercise={mockExercise} variant="thumbnail" completed={true} />);

      // Should show green completion badge
      const badge = document.querySelector('.bg-green-500');
      expect(badge).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACTION BUTTON TESTS
  // ============================================================================

  describe('Action Buttons', () => {
    it('should show action buttons by default', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={mockOnComplete} />);

      // Expand the card
      fireEvent.click(screen.getByText(mockExercise.name));

      await waitFor(() => {
        expect(screen.getByText('Marker som fullfort')).toBeInTheDocument();
      });
    });

    it('should hide action buttons when showActions is false', async () => {
      render(
        <ExerciseCard exercise={mockExercise} showActions={false} onComplete={mockOnComplete} />
      );

      // Expand the card
      fireEvent.click(screen.getByText(mockExercise.name));

      await waitFor(() => {
        expect(screen.queryByText('Marker som fullfort')).not.toBeInTheDocument();
      });
    });

    it('should show details button when onViewDetails is provided', async () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          showActions={true}
          onComplete={mockOnComplete}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Expand the card
      fireEvent.click(screen.getByText(mockExercise.name));

      await waitFor(() => {
        expect(screen.getByText('Detaljer')).toBeInTheDocument();
      });
    });

    it('should call onViewDetails when details button is clicked', async () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          showActions={true}
          onComplete={mockOnComplete}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Expand the card
      fireEvent.click(screen.getByText(mockExercise.name));

      await waitFor(() => {
        const detailsButton = screen.getByText('Detaljer');
        fireEvent.click(detailsButton);
      });

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockExercise.id);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing exercise data gracefully', () => {
      render(<ExerciseCard exercise={{}} />);
      expect(screen.getByText('Ukjent ovelse')).toBeInTheDocument();
    });

    it('should handle null exercise gracefully', () => {
      render(<ExerciseCard exercise={null} />);
      expect(screen.getByText('Ukjent ovelse')).toBeInTheDocument();
    });

    it('should handle exercise without video URL', () => {
      const exerciseNoVideo = createMockExercise({ videoUrl: null });
      render(<ExerciseCard exercise={exerciseNoVideo} compact={true} />);
      expect(screen.queryByText('Video')).not.toBeInTheDocument();
    });

    it('should handle exercise without image URL', () => {
      const exerciseNoImage = createMockExercise({
        imageUrl: null,
        thumbnailUrl: null,
        videoUrl: null,
      });
      render(<ExerciseCard exercise={exerciseNoImage} variant="thumbnail" />);
      // Should show default dumbbell icon container
      expect(screen.getByText(exerciseNoImage.name)).toBeInTheDocument();
    });

    it('should handle exercise without hold seconds', () => {
      const exerciseNoHold = createMockExercise({ holdSeconds: null });
      render(<ExerciseCard exercise={exerciseNoHold} />);
      expect(screen.queryByText(/Hold/)).not.toBeInTheDocument();
    });

    it('should show custom instructions when provided', async () => {
      const exerciseWithCustom = createMockExercise({
        customInstructions: 'Spesielle instruksjoner for denne pasienten',
      });
      render(<ExerciseCard exercise={exerciseWithCustom} />);

      // Expand the card
      fireEvent.click(screen.getByText(exerciseWithCustom.name));

      await waitFor(() => {
        expect(screen.getByText('Spesielle instruksjoner')).toBeInTheDocument();
        expect(screen.getByText('Spesielle instruksjoner for denne pasienten')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // VIDEO FUNCTIONALITY TESTS
  // ============================================================================

  describe('Video Functionality', () => {
    it('should render video iframe when expanded', async () => {
      render(<ExerciseCard exercise={mockExercise} />);

      // Expand the card
      fireEvent.click(screen.getByText(mockExercise.name));

      await waitFor(() => {
        const iframe = document.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('src', mockExercise.videoUrl);
      });
    });

    it('should show image instead of video when no video URL', async () => {
      const exerciseWithImage = createMockExercise({ videoUrl: null });
      render(<ExerciseCard exercise={exerciseWithImage} />);

      // Expand the card
      fireEvent.click(screen.getByText(exerciseWithImage.name));

      await waitFor(() => {
        const img = document.querySelector(`img[alt="${exerciseWithImage.name}"]`);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', exerciseWithImage.imageUrl);
      });
    });
  });
});
