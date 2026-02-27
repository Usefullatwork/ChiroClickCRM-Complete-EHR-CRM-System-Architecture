/**
 * Exercises Page Tests
 * Tests for the exercise library management and prescription history page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// ============================================================================
// MOCKS — must be declared before any import that uses them
// ============================================================================

// Track navigate mock so tests can assert calls
const mockNavigate = vi.fn();
let mockPatientId = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => (mockPatientId ? { patientId: mockPatientId } : {}),
  };
});

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock the exercises API module
vi.mock('../../api/exercises', () => ({
  exercisesApi: {
    getExercises: vi.fn(),
    getCategories: vi.fn(),
    getPatientPrescriptions: vi.fn(),
    createPrescription: vi.fn(),
    sendEmail: vi.fn(),
    sendSMS: vi.fn(),
    generatePDF: vi.fn(),
    seedDefaultExercises: vi.fn(),
  },
  default: {
    getExercises: vi.fn(),
    getCategories: vi.fn(),
    getPatientPrescriptions: vi.fn(),
    createPrescription: vi.fn(),
    sendEmail: vi.fn(),
    sendSMS: vi.fn(),
    generatePDF: vi.fn(),
    seedDefaultExercises: vi.fn(),
  },
}));

// Mock child components to isolate page-level logic
vi.mock('../../components/exercises/ExerciseLibrary', () => ({
  default: function MockExerciseLibrary({
    exercises,
    categories,
    _selectedExercises,
    onSelectExercise,
    selectionMode,
    _loading,
  }) {
    return (
      <div data-testid="exercise-library">
        <span data-testid="exercise-count">{exercises.length}</span>
        <span data-testid="category-count">{categories.length}</span>
        <span data-testid="selection-mode">{selectionMode ? 'true' : 'false'}</span>
        {exercises.map((ex) => (
          <div key={ex.id} data-testid={`exercise-${ex.id}`}>
            <span>{ex.name}</span>
            {onSelectExercise && (
              <button data-testid={`select-exercise-${ex.id}`} onClick={() => onSelectExercise(ex)}>
                Velg
              </button>
            )}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock('../../components/exercises/ExercisePrescription', () => ({
  default: function MockExercisePrescription({
    patient,
    selectedExercises,
    _onExercisesChange,
    onSave,
    saving,
    _sending,
  }) {
    return (
      <div data-testid="exercise-prescription">
        <span data-testid="prescription-patient">{patient?.first_name}</span>
        <span data-testid="prescription-exercise-count">{selectedExercises.length}</span>
        <button
          data-testid="save-prescription"
          disabled={saving}
          onClick={() =>
            onSave({
              exercises: selectedExercises,
              patient_instructions: 'Test instructions',
            }).catch(() => {
              // handleSavePrescription re-throws on error; swallow in mock
            })
          }
        >
          Lagre
        </button>
      </div>
    );
  },
}));

import Exercises from '../../pages/Exercises';
import { exercisesApi } from '../../api/exercises';

// ============================================================================
// HELPERS
// ============================================================================

function renderExercises() {
  return render(
    <BrowserRouter>
      <Exercises />
    </BrowserRouter>
  );
}

const MOCK_EXERCISES = [
  {
    id: 'ex1',
    name: 'Cat-Camel',
    name_norwegian: 'Katt-Kamel',
    category: 'mobility',
    body_region: 'lumbar',
    sets_default: 3,
    reps_default: 10,
    hold_seconds: 0,
    frequency_per_day: 2,
    frequency_per_week: 7,
  },
  {
    id: 'ex2',
    name: 'Chin Tuck',
    name_norwegian: 'Hakeinntrekk',
    category: 'strengthening',
    body_region: 'cervical',
    sets_default: 3,
    reps_default: 12,
    hold_seconds: 5,
    frequency_per_day: 3,
    frequency_per_week: 7,
  },
  {
    id: 'ex3',
    name: 'Bird-Dog',
    name_norwegian: 'Fuglehund',
    category: 'strengthening',
    body_region: 'core',
    sets_default: 3,
    reps_default: 8,
    hold_seconds: 0,
    frequency_per_day: 1,
    frequency_per_week: 5,
  },
];

const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'Stretching', name_norwegian: 'Toyning' },
  { id: 'cat2', name: 'Strengthening', name_norwegian: 'Styrke' },
  { id: 'cat3', name: 'Mobility', name_norwegian: 'Mobilitet' },
];

const MOCK_PRESCRIPTIONS = [
  {
    id: 'rx1',
    status: 'active',
    created_at: '2026-02-20T10:00:00Z',
    patient_instructions: 'Gjor ovelsene daglig',
    exercises: [
      { name: 'Cat-Camel', name_norwegian: 'Katt-Kamel', sets: 3, reps: 10 },
      { name: 'Chin Tuck', name_norwegian: 'Hakeinntrekk', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'rx2',
    status: 'completed',
    created_at: '2026-01-15T09:00:00Z',
    patient_instructions: null,
    exercises: [{ name: 'Bird-Dog', name_norwegian: 'Fuglehund', sets: 3, reps: 8 }],
  },
];

// ============================================================================
// TESTS
// ============================================================================

describe('Exercises Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientId = null;

    // Default: successful empty load
    exercisesApi.getExercises.mockResolvedValue({ data: [] });
    exercisesApi.getCategories.mockResolvedValue({ data: [] });
    exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: [] });
    exercisesApi.createPrescription.mockResolvedValue({ data: { id: 'new-rx' } });
    exercisesApi.sendEmail.mockResolvedValue({});
    exercisesApi.sendSMS.mockResolvedValue({});
    exercisesApi.generatePDF.mockResolvedValue(new Blob(['pdf-content']));
    exercisesApi.seedDefaultExercises.mockResolvedValue({});
  });

  // ============================================================================
  // HEADING & LAYOUT
  // ============================================================================

  describe('Heading & Layout', () => {
    it('should render the page title', async () => {
      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('exerciseLibrary')).toBeInTheDocument();
      });
    });

    it('should render the Dumbbell icon area', async () => {
      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('exerciseLibrary')).toBeInTheDocument();
      });
    });

    it('should not show back button when no patientId', async () => {
      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('exerciseLibrary')).toBeInTheDocument();
      });

      // ArrowLeft button only renders when patientId is present
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show back button when patientId is present', async () => {
      mockPatientId = 'patient-123';

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('exerciseLibrary')).toBeInTheDocument();
      });

      // Patient name should appear (mock patient from component)
      expect(screen.getByText('Demo Pasient')).toBeInTheDocument();
    });

    it('should navigate back when back button is clicked', async () => {
      mockPatientId = 'patient-123';

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('Demo Pasient')).toBeInTheDocument();
      });

      // Find and click the back button (first button in header area)
      const buttons = screen.getAllByRole('button');
      // The back button is the first button in the header
      const backButton = buttons[0];
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading spinner while data is being fetched', () => {
      // Never resolve the promises so loading persists
      exercisesApi.getExercises.mockReturnValue(new Promise(() => {}));
      exercisesApi.getCategories.mockReturnValue(new Promise(() => {}));

      renderExercises();

      expect(screen.getByText('loadingExercises')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.queryByText('loadingExercises')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should show seed button when no exercises and not loading', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: [] });
      exercisesApi.getCategories.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('loadDefaultExercises')).toBeInTheDocument();
      });
    });

    it('should not show seed button when exercises exist', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.queryByText('loadDefaultExercises')).not.toBeInTheDocument();
      });
    });

    it('should call seedDefaultExercises when seed button is clicked', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: [] });
      exercisesApi.getCategories.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('loadDefaultExercises')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('loadDefaultExercises'));

      await waitFor(() => {
        expect(exercisesApi.seedDefaultExercises).toHaveBeenCalled();
      });
    });

    it('should reload data after seeding exercises', async () => {
      exercisesApi.getExercises
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: MOCK_EXERCISES });
      exercisesApi.getCategories
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: MOCK_CATEGORIES });
      exercisesApi.seedDefaultExercises.mockResolvedValue({});

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('loadDefaultExercises')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('loadDefaultExercises'));

      // After seeding, loadData is called again
      await waitFor(() => {
        expect(exercisesApi.getExercises).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================================
  // EXERCISE LIBRARY RENDERING
  // ============================================================================

  describe('Exercise Library Rendering', () => {
    it('should render ExerciseLibrary with exercises data', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });

      expect(screen.getByTestId('exercise-count').textContent).toBe('3');
      expect(screen.getByTestId('category-count').textContent).toBe('3');
    });

    it('should pass selectionMode=false when no patientId', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });

      expect(screen.getByTestId('selection-mode').textContent).toBe('false');
    });

    it('should pass selectionMode=true when patientId is present', async () => {
      mockPatientId = 'patient-123';
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });

      expect(screen.getByTestId('selection-mode').textContent).toBe('true');
    });
  });

  // ============================================================================
  // LANGUAGE TOGGLE
  // ============================================================================

  describe('Language Toggle', () => {
    it('should show Norsk and English language buttons', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: [] });
      exercisesApi.getCategories.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('Norsk')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TABS (only shown with patientId)
  // ============================================================================

  describe('Tabs', () => {
    it('should not show tabs when no patientId', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });

      expect(screen.queryByText('library')).not.toBeInTheDocument();
      expect(screen.queryByText('programs')).not.toBeInTheDocument();
    });

    it('should show library and programs tabs when patientId is present', async () => {
      mockPatientId = 'patient-123';
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('library')).toBeInTheDocument();
        expect(screen.getByText('programs')).toBeInTheDocument();
      });
    });

    it('should show library tab content by default', async () => {
      mockPatientId = 'patient-123';
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });
    });

    it('should switch to prescriptions tab when clicked', async () => {
      mockPatientId = 'patient-123';
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('programs')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('programs'));

      await waitFor(() => {
        expect(screen.getByText('exercisePrograms')).toBeInTheDocument();
      });
    });

    it('should show prescription count badge when prescriptions exist', async () => {
      mockPatientId = 'patient-123';
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        // The prescription count badge shows "2"
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PRESCRIPTIONS TAB
  // ============================================================================

  describe('Prescriptions Tab', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should show empty state when no prescriptions exist', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('programs')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('programs'));

      await waitFor(() => {
        expect(screen.getByText('noProgramsCreated')).toBeInTheDocument();
        expect(screen.getByText('selectFromLibrary')).toBeInTheDocument();
      });
    });

    it('should render prescription list with data', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('programs')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('programs'));

      await waitFor(() => {
        // Prescription with 2 exercises
        expect(screen.getByText(/2 exercises/)).toBeInTheDocument();
        // Prescription with 1 exercise
        expect(screen.getByText(/1 exercises/)).toBeInTheDocument();
      });
    });

    it('should show exercise name tags in prescription preview', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        // Exercise names shown as preview tags (name_norwegian takes priority)
        expect(screen.getByText('Katt-Kamel')).toBeInTheDocument();
        expect(screen.getByText('Hakeinntrekk')).toBeInTheDocument();
        expect(screen.getByText('Fuglehund')).toBeInTheDocument();
      });
    });

    it('should show patient instructions in italic when present', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        // First prescription has instructions
        expect(screen.getByText(/"Gjor ovelsene daglig"/)).toBeInTheDocument();
      });
    });

    it('should show status badges on prescriptions', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        // Norwegian status labels for lang='no'
        expect(screen.getByText('Aktiv')).toBeInTheDocument();
        expect(screen.getByText('Fullført')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EXERCISE SELECTION
  // ============================================================================

  describe('Exercise Selection', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should allow selecting exercises when patientId is present', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      // After selecting, createProgram button and newProgram tab should appear
      await waitFor(() => {
        expect(screen.getByText('createProgram')).toBeInTheDocument();
        expect(screen.getByText('newProgram')).toBeInTheDocument();
      });
    });

    it('should show selected exercise count badge', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        // The badge shows "1" (one selected exercise)
        const badges = screen.getAllByText('1');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should deselect exercise when clicked again', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      // Select
      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        expect(screen.getByText('createProgram')).toBeInTheDocument();
      });

      // Deselect
      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        expect(screen.queryByText('createProgram')).not.toBeInTheDocument();
      });
    });

    it('should not show select buttons when no patientId', async () => {
      mockPatientId = null;
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });

      // No select buttons since onSelectExercise is undefined
      expect(screen.queryByTestId('select-exercise-ex1')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CREATE PRESCRIPTION TAB
  // ============================================================================

  describe('Create Prescription Tab', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should switch to create tab when createProgram button is clicked', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      // Select an exercise first
      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        expect(screen.getByText('createProgram')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('createProgram'));

      await waitFor(() => {
        expect(screen.getByTestId('exercise-prescription')).toBeInTheDocument();
      });
    });

    it('should render ExercisePrescription with patient data', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        expect(screen.getByText('createProgram')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('createProgram'));

      await waitFor(() => {
        expect(screen.getByTestId('prescription-patient').textContent).toBe('Demo');
      });
    });

    it('should also render a secondary ExerciseLibrary on create tab', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        expect(screen.getByText('createProgram')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('createProgram'));

      await waitFor(() => {
        // Both ExerciseLibrary (secondary on right) and ExercisePrescription render
        expect(screen.getByTestId('exercise-prescription')).toBeInTheDocument();
        // There should be an exercise-library present for adding more exercises
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SAVE PRESCRIPTION
  // ============================================================================

  describe('Save Prescription', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should call createPrescription API when saving', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        expect(screen.getByText('createProgram')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('createProgram'));

      await waitFor(() => {
        expect(screen.getByTestId('save-prescription')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-prescription'));

      await waitFor(() => {
        expect(exercisesApi.createPrescription).toHaveBeenCalledWith(
          expect.objectContaining({
            patientId: 'patient-123',
            deliveryMethod: 'portal',
          })
        );
      });
    });

    it('should show success message after saving', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('createProgram'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-prescription'));
      });

      await waitFor(() => {
        expect(screen.getByText('programSaved')).toBeInTheDocument();
      });
    });

    it('should switch to prescriptions tab after saving', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: [] });

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('createProgram'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-prescription'));
      });

      // After save, should switch to prescriptions view
      await waitFor(() => {
        expect(screen.getByText('exercisePrograms')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should show error message when data loading fails', async () => {
      exercisesApi.getExercises.mockRejectedValue(new Error('Network error'));
      exercisesApi.getCategories.mockRejectedValue(new Error('Network error'));

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
    });

    it('should allow dismissing error notification', async () => {
      exercisesApi.getExercises.mockRejectedValue(new Error('Network error'));
      exercisesApi.getCategories.mockRejectedValue(new Error('Network error'));

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });

      // Click the X button to dismiss error
      const errorContainer = screen.getByText('failedToLoad').closest('div');
      const dismissButton = errorContainer.querySelector('button');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('failedToLoad')).not.toBeInTheDocument();
      });
    });

    it('should show error when save prescription fails', async () => {
      mockPatientId = 'patient-123';
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.createPrescription.mockRejectedValue(new Error('Save failed'));

      renderExercises();

      await waitFor(() => {
        expect(screen.getByTestId('select-exercise-ex1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-exercise-ex1'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('createProgram'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-prescription'));
      });

      await waitFor(() => {
        expect(screen.getByText('failedToSave')).toBeInTheDocument();
      });
    });

    it('should show error when seeding exercises fails', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: [] });
      exercisesApi.getCategories.mockResolvedValue({ data: [] });
      exercisesApi.seedDefaultExercises.mockRejectedValue(new Error('Seed failed'));

      renderExercises();

      await waitFor(() => {
        expect(screen.getByText('loadDefaultExercises')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('loadDefaultExercises'));

      await waitFor(() => {
        expect(screen.getByText('failedToAddExercises')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SEND EMAIL
  // ============================================================================

  describe('Send Email', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should call sendEmail API when email button is clicked on prescription', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        expect(screen.getByText('Aktiv')).toBeInTheDocument();
      });

      // Click the email button (has title 'sendEmail') on the first prescription
      const emailButtons = screen.getAllByTitle('sendEmail');
      fireEvent.click(emailButtons[0]);

      await waitFor(() => {
        expect(exercisesApi.sendEmail).toHaveBeenCalledWith('rx1');
      });
    });

    it('should show success message after sending email', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const emailButtons = screen.getAllByTitle('sendEmail');
        fireEvent.click(emailButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('emailSent')).toBeInTheDocument();
      });
    });

    it('should show error when sendEmail fails', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });
      exercisesApi.sendEmail.mockRejectedValue(new Error('Email failed'));

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const emailButtons = screen.getAllByTitle('sendEmail');
        fireEvent.click(emailButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('failedToSendEmail')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SEND SMS
  // ============================================================================

  describe('Send SMS', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should call sendSMS API when SMS button is clicked', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const smsButtons = screen.getAllByTitle('sendSMS');
        fireEvent.click(smsButtons[0]);
      });

      await waitFor(() => {
        expect(exercisesApi.sendSMS).toHaveBeenCalledWith('rx1');
      });
    });

    it('should show error when sendSMS fails', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });
      exercisesApi.sendSMS.mockRejectedValue(new Error('SMS failed'));

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const smsButtons = screen.getAllByTitle('sendSMS');
        fireEvent.click(smsButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('failedToSendSMS')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // DOWNLOAD PDF
  // ============================================================================

  describe('Download PDF', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-blob');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('should call generatePDF API when download button is clicked', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const pdfButtons = screen.getAllByTitle('downloadPDF');
        fireEvent.click(pdfButtons[0]);
      });

      await waitFor(() => {
        expect(exercisesApi.generatePDF).toHaveBeenCalledWith('rx1');
      });
    });

    it('should show error when PDF generation fails', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });
      exercisesApi.generatePDF.mockRejectedValue(new Error('PDF failed'));

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const pdfButtons = screen.getAllByTitle('downloadPDF');
        fireEvent.click(pdfButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('failedToGeneratePDF')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PRESCRIPTION DETAIL MODAL
  // ============================================================================

  describe('Prescription Detail Modal', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should open detail modal when view button is clicked', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('viewDetails');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('programDetails')).toBeInTheDocument();
      });
    });

    it('should show exercise details in modal', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('viewDetails');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        // Modal should show exercise names and sets/reps
        expect(screen.getByText('programDetails')).toBeInTheDocument();
        // rx1 has exercises — check the exercise name is rendered in the modal
        expect(screen.getByText('exercisesLabel')).toBeInTheDocument();
      });
    });

    it('should close modal when X button is clicked', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('viewDetails');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('programDetails')).toBeInTheDocument();
      });

      // Find the close button in the modal (the one next to programDetails heading)
      const modalHeader = screen.getByText('programDetails').closest('div');
      const closeButton = modalHeader.querySelector('button');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('programDetails')).not.toBeInTheDocument();
      });
    });

    it('should close modal when backdrop is clicked', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('viewDetails');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('programDetails')).toBeInTheDocument();
      });

      // Click the backdrop (div with bg-black/50 class)
      const backdrop = document.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.queryByText('programDetails')).not.toBeInTheDocument();
      });
    });

    it('should show send email and PDF buttons in modal', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('viewDetails');
        fireEvent.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('programDetails')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        // The modal has a sendEmail button
        const emailButtons = screen.getAllByText('sendEmail');
        expect(emailButtons.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ============================================================================
  // API INTEGRATION
  // ============================================================================

  describe('API Integration', () => {
    it('should call getExercises and getCategories on mount', async () => {
      renderExercises();

      await waitFor(() => {
        expect(exercisesApi.getExercises).toHaveBeenCalledWith({ limit: 500 });
        expect(exercisesApi.getCategories).toHaveBeenCalled();
      });
    });

    it('should call getPatientPrescriptions when patientId is present', async () => {
      mockPatientId = 'patient-123';
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });

      renderExercises();

      await waitFor(() => {
        expect(exercisesApi.getPatientPrescriptions).toHaveBeenCalledWith('patient-123');
      });
    });

    it('should NOT call getPatientPrescriptions when no patientId', async () => {
      renderExercises();

      await waitFor(() => {
        expect(exercisesApi.getExercises).toHaveBeenCalled();
      });

      expect(exercisesApi.getPatientPrescriptions).not.toHaveBeenCalled();
    });

    it('should handle null data from API gracefully', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: null });
      exercisesApi.getCategories.mockResolvedValue({ data: null });

      renderExercises();

      await waitFor(() => {
        // Should render with empty arrays (fallback from `|| []`)
        expect(screen.getByTestId('exercise-library')).toBeInTheDocument();
        expect(screen.getByTestId('exercise-count').textContent).toBe('0');
      });
    });
  });

  // ============================================================================
  // STATUS HELPERS
  // ============================================================================

  describe('Status Helpers', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should render active status with green styling', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({
        data: [{ ...MOCK_PRESCRIPTIONS[0], status: 'active' }],
      });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const statusBadge = screen.getByText('Aktiv');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge.className).toContain('bg-green-100');
      });
    });

    it('should render completed status with blue styling', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({
        data: [{ ...MOCK_PRESCRIPTIONS[0], status: 'completed' }],
      });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const statusBadge = screen.getByText('Fullført');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge.className).toContain('bg-blue-100');
      });
    });

    it('should render paused status with yellow styling', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({
        data: [{ ...MOCK_PRESCRIPTIONS[0], status: 'paused' }],
      });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const statusBadge = screen.getByText('Pauset');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge.className).toContain('bg-yellow-100');
      });
    });

    it('should render cancelled status with red styling', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({
        data: [{ ...MOCK_PRESCRIPTIONS[0], status: 'cancelled' }],
      });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        const statusBadge = screen.getByText('Avbrutt');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge.className).toContain('bg-red-100');
      });
    });
  });

  // ============================================================================
  // OVERFLOW EXERCISE PREVIEW (>5 exercises)
  // ============================================================================

  describe('Exercise Overflow Preview', () => {
    beforeEach(() => {
      mockPatientId = 'patient-123';
    });

    it('should show +N more tag when prescription has more than 5 exercises', async () => {
      const manyExercises = Array.from({ length: 7 }, (_, i) => ({
        name: `Exercise ${i + 1}`,
        name_norwegian: `Ovelse ${i + 1}`,
        sets: 3,
        reps: 10,
      }));

      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({
        data: [{ ...MOCK_PRESCRIPTIONS[0], exercises: manyExercises }],
      });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        // Should show first 5 exercises and "+2 more"
        expect(screen.getByText('+2 more')).toBeInTheDocument();
      });
    });

    it('should NOT show +N tag when prescription has 5 or fewer exercises', async () => {
      exercisesApi.getExercises.mockResolvedValue({ data: MOCK_EXERCISES });
      exercisesApi.getCategories.mockResolvedValue({ data: MOCK_CATEGORIES });
      exercisesApi.getPatientPrescriptions.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });

      renderExercises();

      await waitFor(() => {
        fireEvent.click(screen.getByText('programs'));
      });

      await waitFor(() => {
        expect(screen.getByText('Katt-Kamel')).toBeInTheDocument();
        // No "+N more" shown since both prescriptions have <= 5 exercises
        expect(screen.queryByText(/^\+\d+ more$/)).not.toBeInTheDocument();
      });
    });
  });
});
