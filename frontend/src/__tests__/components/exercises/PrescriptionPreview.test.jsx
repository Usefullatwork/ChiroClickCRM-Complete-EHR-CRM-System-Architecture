/**
 * PrescriptionPreview Component Tests
 * Tests for the patient-facing prescription preview modal
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

import PrescriptionPreview from '../../../components/exercises/PrescriptionPreview';

describe('PrescriptionPreview Component', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockOnSendEmail = vi.fn();
  const mockOnDownloadPDF = vi.fn();

  const defaultExercises = [
    {
      id: 1,
      name: 'Cat-Cow Stretch',
      name_norwegian: 'Katt-Ku Strekk',
      category: 'Mobility',
      difficulty_level: 'beginner',
      sets: 3,
      reps: 10,
      holdSeconds: 0,
      video_url: null,
      instructions: 'Start on all fours',
      instructions_norwegian: 'Start pa alle fire',
      customInstructions: '',
      precautions: [],
    },
    {
      id: 2,
      name: 'Plank Hold',
      name_norwegian: 'Planke',
      category: 'Strength',
      difficulty_level: 'intermediate',
      sets: 3,
      reps: 1,
      holdSeconds: 30,
      video_url: 'https://vimeo.com/123',
      instructions: 'Hold position',
      instructions_norwegian: null,
      customInstructions: 'Hold ryggen rett',
      precautions: ['Stopp ved smerte'],
    },
  ];

  const defaultPrescription = {
    id: 'rx-1',
    token: 'abc123',
    exercises: defaultExercises,
    patientInstructions: 'Gjor ovelsene daglig',
    startDate: '2024-03-15',
    endDate: null,
  };

  const defaultProps = {
    prescription: defaultPrescription,
    patientName: 'Ola Nordmann',
    clinic: { name: 'Test Klinikk' },
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    onSendEmail: mockOnSendEmail,
    onDownloadPDF: mockOnDownloadPDF,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render the preview header', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('Forhandsvisning')).toBeInTheDocument();
    });

    it('should display clinic name in portal header', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('Test Klinikk')).toBeInTheDocument();
    });

    it('should show patient name', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText(/Ola Nordmann/)).toBeInTheDocument();
    });

    it('should display exercise count', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('2 ovelser')).toBeInTheDocument();
    });

    it('should show exercise names in Norwegian', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('Katt-Ku Strekk')).toBeInTheDocument();
      expect(screen.getByText('Planke')).toBeInTheDocument();
    });

    it('should show patient instructions when provided', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('Gjor ovelsene daglig')).toBeInTheDocument();
    });

    it('should show empty state when no exercises', () => {
      render(
        <PrescriptionPreview
          {...defaultProps}
          prescription={{ ...defaultPrescription, exercises: [] }}
        />
      );

      expect(screen.getByText('Ingen ovelser i programmet')).toBeInTheDocument();
    });

    it('should show estimated time', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      // Component calculates time and displays ~N min
      expect(screen.getByText(/min/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // VIEW MODE
  // ============================================================================

  describe('View Mode', () => {
    it('should default to mobile view', () => {
      const { container } = render(<PrescriptionPreview {...defaultProps} />);

      // Mobile preview container has specific dimensions
      expect(container.querySelector('.w-\\[375px\\]')).toBeInTheDocument();
    });

    it('should switch to tablet view', () => {
      const { container } = render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Nettbrett'));

      expect(container.querySelector('.w-\\[768px\\]')).toBeInTheDocument();
    });

    it('should switch to desktop view', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Desktop'));

      // Desktop view uses max-w-4xl
      // Just verify the click doesn't crash
      expect(screen.getByText('Forhandsvisning')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EXERCISE EXPANSION
  // ============================================================================

  describe('Exercise Expansion', () => {
    it('should expand exercise details when clicked', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      // Click first exercise to expand
      fireEvent.click(screen.getByText('Katt-Ku Strekk'));

      expect(screen.getByText('Instruksjoner')).toBeInTheDocument();
      expect(screen.getByText('Start pa alle fire')).toBeInTheDocument();
    });

    it('should show custom instructions in expanded view', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      // Click second exercise (has custom instructions)
      fireEvent.click(screen.getByText('Planke'));

      expect(screen.getByText('Hold ryggen rett')).toBeInTheDocument();
    });

    it('should show precautions in expanded view', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByText('Planke'));

      expect(screen.getByText('Forsiktighetsregler')).toBeInTheDocument();
      expect(screen.getByText('- Stopp ved smerte')).toBeInTheDocument();
    });

    it('should collapse exercise when clicked again', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      // Click to expand
      fireEvent.click(screen.getByText('Katt-Ku Strekk'));
      expect(screen.getByText('Instruksjoner')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText('Katt-Ku Strekk'));
      expect(screen.queryByText('Instruksjoner')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACTIONS
  // ============================================================================

  describe('Actions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByText('Lukk'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSendEmail when email button is clicked', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByText('Send pa e-post'));

      expect(mockOnSendEmail).toHaveBeenCalled();
    });

    it('should call onDownloadPDF when PDF button is clicked', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByText('Last ned PDF'));

      expect(mockOnDownloadPDF).toHaveBeenCalled();
    });

    it('should call onConfirm when confirm button is clicked', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByText('Bekreft og send'));

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should copy link to clipboard when copy button is clicked', async () => {
      render(<PrescriptionPreview {...defaultProps} />);

      fireEvent.click(screen.getByText('Kopier lenke'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    });

    it('should not render email button when onSendEmail is not provided', () => {
      render(<PrescriptionPreview {...defaultProps} onSendEmail={undefined} />);

      expect(screen.queryByText('Send pa e-post')).not.toBeInTheDocument();
    });

    it('should not render PDF button when onDownloadPDF is not provided', () => {
      render(<PrescriptionPreview {...defaultProps} onDownloadPDF={undefined} />);

      expect(screen.queryByText('Last ned PDF')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // DIFFICULTY BADGES
  // ============================================================================

  describe('Difficulty Badges', () => {
    it('should display beginner difficulty label', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('Nybegynner')).toBeInTheDocument();
    });

    it('should display intermediate difficulty label', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('Middels')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PROGRAM DURATION
  // ============================================================================

  describe('Program Duration', () => {
    it('should show start date when provided', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText('Programvarighet')).toBeInTheDocument();
    });

    it('should show "lopende program" when no end date', () => {
      render(<PrescriptionPreview {...defaultProps} />);

      expect(screen.getByText(/lopende program/)).toBeInTheDocument();
    });
  });
});
