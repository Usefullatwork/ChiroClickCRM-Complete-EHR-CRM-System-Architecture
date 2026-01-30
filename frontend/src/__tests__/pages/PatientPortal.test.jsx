/**
 * PatientPortal Page Tests
 * Tests for the patient-facing exercise portal page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import PatientPortal from '../../pages/PatientPortal';
import { createMockPrescription, createMockExercise } from '../setup';

// Mock axios
vi.mock('axios');

// Mock useParams to return test token
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ token: 'test-portal-token-123' }),
  };
});

describe('PatientPortal Page', () => {
  const mockPrescription = {
    ...createMockPrescription(),
    clinicName: 'Oslo Kiropraktikk',
    clinicPhone: '+47 22 33 44 55',
    prescribedBy: 'Dr. Hansen',
    prescribedAt: new Date().toISOString(),
    patientInstructions: 'Utfor ovelsene 2 ganger daglig',
    exercises: [
      {
        ...createMockExercise(),
        id: 'pe-1',
        exerciseId: 'ex-1',
        name: 'Nakkestrekning',
        category: 'Nakke',
        difficultyLevel: 'beginner',
        sets: 3,
        reps: 10,
        instructions: 'Len hodet forsiktig til siden',
        videoUrl: 'https://player.vimeo.com/video/12345',
      },
      {
        ...createMockExercise(),
        id: 'pe-2',
        exerciseId: 'ex-2',
        name: 'Skulderrotasjon',
        category: 'Skulder',
        difficultyLevel: 'intermediate',
        sets: 2,
        reps: 15,
        instructions: 'Roter skuldrene i sirkler',
      },
    ],
  };

  const mockProgressHistory = [
    {
      exerciseId: 'ex-1',
      completedAt: new Date().toISOString(),
      setsCompleted: 3,
      repsCompleted: 10,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/portal/exercises/') && url.includes('/progress')) {
        return Promise.resolve({ data: { data: mockProgressHistory } });
      }
      if (url.includes('/portal/exercises/')) {
        return Promise.resolve({ data: { data: mockPrescription } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    axios.post.mockResolvedValue({ data: { success: true } });
  });

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      // Make the request hang
      axios.get.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<PatientPortal />);

      expect(screen.getByText('Laster ovelser...')).toBeInTheDocument();
    });

    it('should show loading animation', () => {
      axios.get.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<PatientPortal />);

      // Check for the loading spinner class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR STATE TESTS
  // ============================================================================

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      axios.get.mockRejectedValue({
        response: { data: { message: 'Ugyldig token' } },
      });

      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(
          screen.getByText('Ovelsene er ikke tilgjengelige')
        ).toBeInTheDocument();
      });
    });

    it('should show contact clinic message on error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(
          screen.getByText(/Kontakt klinikken for a fa en ny lenke/)
        ).toBeInTheDocument();
      });
    });

    it('should display custom error message from API', async () => {
      axios.get.mockRejectedValue({
        response: { data: { message: 'Lenken har utlopt' } },
      });

      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Lenken har utlopt')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // HEADER AND CLINIC INFO TESTS
  // ============================================================================

  describe('Header and Clinic Info', () => {
    it('should display clinic name', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText(mockPrescription.clinicName)).toBeInTheDocument();
      });
    });

    it('should display "Ditt ovelsesprogram" subtitle', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Ditt ovelsesprogram')).toBeInTheDocument();
      });
    });

    it('should display prescriber name', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(
          screen.getByText(`Foreskrevet av: ${mockPrescription.prescribedBy}`)
        ).toBeInTheDocument();
      });
    });

    it('should display clinic phone as clickable link', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        const phoneLink = screen.getByText(mockPrescription.clinicPhone);
        expect(phoneLink).toBeInTheDocument();
        expect(phoneLink.closest('a')).toHaveAttribute(
          'href',
          `tel:${mockPrescription.clinicPhone}`
        );
      });
    });

    it('should display patient instructions when provided', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Instruksjoner:')).toBeInTheDocument();
        expect(
          screen.getByText(mockPrescription.patientInstructions)
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PROGRESS TRACKING TESTS
  // ============================================================================

  describe('Progress Tracking', () => {
    it('should display progress bar', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Din fremgang i dag')).toBeInTheDocument();
      });
    });

    it('should show exercise completion count', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        // Should show "X / Y" format for completion
        expect(
          screen.getByText(
            `${mockProgressHistory.length} / ${mockPrescription.exercises.length}`
          )
        ).toBeInTheDocument();
      });
    });

    it('should update progress when exercise is marked complete', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
      });

      // The first exercise should show as completed based on mock progress
      const completedIndicator = document.querySelector('.bg-green-500');
      expect(completedIndicator).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EXERCISE LIST TESTS
  // ============================================================================

  describe('Exercise List', () => {
    it('should display exercise count in header', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(
          screen.getByText(`Ovelser (${mockPrescription.exercises.length})`)
        ).toBeInTheDocument();
      });
    });

    it('should render all exercises', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });
    });

    it('should display exercise category', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakke')).toBeInTheDocument();
        expect(screen.getByText('Skulder')).toBeInTheDocument();
      });
    });

    it('should display difficulty level in Norwegian', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nybegynner')).toBeInTheDocument();
        expect(screen.getByText('Middels')).toBeInTheDocument();
      });
    });

    it('should display sets and reps for each exercise', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('3 sett')).toBeInTheDocument();
        expect(screen.getByText('10 rep')).toBeInTheDocument();
      });
    });

    it('should show video indicator for exercises with video', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        const videoIndicators = screen.getAllByText('Video');
        expect(videoIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // EXERCISE EXPANSION TESTS
  // ============================================================================

  describe('Exercise Expansion', () => {
    it('should expand exercise to show details on click', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
      });

      // Find the clickable exercise header
      fireEvent.click(screen.getByText('Nakkestrekning'));

      await waitFor(() => {
        expect(screen.getByText('Instruksjoner')).toBeInTheDocument();
        expect(
          screen.getByText('Len hodet forsiktig til siden')
        ).toBeInTheDocument();
      });
    });

    it('should show video iframe when exercise is expanded', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nakkestrekning'));

      await waitFor(() => {
        const iframe = document.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
      });
    });

    it('should collapse exercise on second click', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
      });

      // Expand
      fireEvent.click(screen.getByText('Nakkestrekning'));

      await waitFor(() => {
        expect(screen.getByText('Instruksjoner')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(screen.getByText('Nakkestrekning'));

      await waitFor(() => {
        expect(screen.queryByText('Instruksjoner')).not.toBeInTheDocument();
      });
    });

    it('should show completion button when expanded', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));

      await waitFor(() => {
        expect(screen.getByText('Marker som fullfort')).toBeInTheDocument();
      });
    });

    it('should show "Fullfort i dag" for completed exercises', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
      });

      // Expand the completed exercise
      fireEvent.click(screen.getByText('Nakkestrekning'));

      await waitFor(() => {
        expect(screen.getByText('Fullfort i dag')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FEEDBACK MODAL TESTS
  // ============================================================================

  describe('Feedback Modal', () => {
    it('should open feedback modal when complete button is clicked', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      // Expand exercise
      fireEvent.click(screen.getByText('Skulderrotasjon'));

      await waitFor(() => {
        expect(screen.getByText('Marker som fullfort')).toBeInTheDocument();
      });

      // Click complete button
      fireEvent.click(screen.getByText('Marker som fullfort'));

      await waitFor(() => {
        expect(screen.getByText('Registrer fremgang')).toBeInTheDocument();
      });
    });

    it('should display exercise name in feedback modal', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Marker som fullfort'));
      });

      await waitFor(() => {
        // Modal should show exercise name
        const modalContent = document.querySelector('.fixed');
        expect(modalContent).toBeInTheDocument();
      });
    });

    it('should have sets completed input field', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));
      await waitFor(() => fireEvent.click(screen.getByText('Marker som fullfort')));

      await waitFor(() => {
        expect(screen.getByText('Sett fullfort')).toBeInTheDocument();
      });
    });

    it('should have reps completed input field', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));
      await waitFor(() => fireEvent.click(screen.getByText('Marker som fullfort')));

      await waitFor(() => {
        expect(screen.getByText('Repetisjoner')).toBeInTheDocument();
      });
    });

    it('should have difficulty rating buttons', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));
      await waitFor(() => fireEvent.click(screen.getByText('Marker som fullfort')));

      await waitFor(() => {
        expect(screen.getByText('Hvor vanskelig var ovelsen?')).toBeInTheDocument();
        // Check for rating buttons 1-5
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('should have pain rating slider', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));
      await waitFor(() => fireEvent.click(screen.getByText('Marker som fullfort')));

      await waitFor(() => {
        expect(screen.getByText('Smerteniva under ovelsen (0-10)')).toBeInTheDocument();
        const slider = document.querySelector('input[type="range"]');
        expect(slider).toBeInTheDocument();
      });
    });

    it('should close modal when X button is clicked', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));
      await waitFor(() => fireEvent.click(screen.getByText('Marker som fullfort')));

      await waitFor(() => {
        expect(screen.getByText('Registrer fremgang')).toBeInTheDocument();
      });

      // Find and click close button
      const closeButton = document.querySelector('button svg');
      if (closeButton) {
        fireEvent.click(closeButton.closest('button'));
      }

      await waitFor(() => {
        expect(screen.queryByText('Registrer fremgang')).not.toBeInTheDocument();
      });
    });

    it('should submit progress and close modal', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));
      await waitFor(() => fireEvent.click(screen.getByText('Marker som fullfort')));

      await waitFor(() => {
        expect(screen.getByText('Registrer fremgang')).toBeInTheDocument();
      });

      // Click submit button
      const submitButton = screen.getByRole('button', { name: 'Registrer fremgang' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // FOOTER TESTS
  // ============================================================================

  describe('Footer', () => {
    it('should display safety warning', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Stopp ovelsene hvis du opplever okt smerte og kontakt klinikken.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should display personalization message', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(
          screen.getByText('Dette programmet er personlig tilpasset deg.')
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // API INTEGRATION TESTS
  // ============================================================================

  describe('API Integration', () => {
    it('should fetch prescription data on mount', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/portal/exercises/')
        );
      });
    });

    it('should fetch progress history', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/progress')
        );
      });
    });

    it('should post progress when exercise is completed', async () => {
      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Skulderrotasjon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skulderrotasjon'));
      await waitFor(() => fireEvent.click(screen.getByText('Marker som fullfort')));

      await waitFor(() => {
        expect(screen.getByText('Registrer fremgang')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Registrer fremgang' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/progress'),
          expect.objectContaining({
            exerciseId: expect.any(String),
          })
        );
      });
    });
  });

  // ============================================================================
  // PRECAUTIONS AND CUSTOM INSTRUCTIONS TESTS
  // ============================================================================

  describe('Precautions and Custom Instructions', () => {
    it('should display precautions when exercise has them', async () => {
      const prescriptionWithPrecautions = {
        ...mockPrescription,
        exercises: [
          {
            ...mockPrescription.exercises[0],
            precautions: ['Stopp ved smerte', 'Ikke overanstreng'],
          },
        ],
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/progress')) {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: { data: prescriptionWithPrecautions } });
      });

      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nakkestrekning'));

      await waitFor(() => {
        expect(screen.getByText('Forsiktighetsregler')).toBeInTheDocument();
      });
    });

    it('should display custom instructions when provided', async () => {
      const prescriptionWithCustom = {
        ...mockPrescription,
        exercises: [
          {
            ...mockPrescription.exercises[0],
            customInstructions: 'Spesiell instruksjon for denne pasienten',
          },
        ],
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/progress')) {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: { data: prescriptionWithCustom } });
      });

      renderWithRouter(<PatientPortal />);

      await waitFor(() => {
        expect(screen.getByText('Nakkestrekning')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nakkestrekning'));

      await waitFor(() => {
        expect(screen.getByText('Spesielle instruksjoner')).toBeInTheDocument();
        expect(
          screen.getByText('Spesiell instruksjon for denne pasienten')
        ).toBeInTheDocument();
      });
    });
  });
});
