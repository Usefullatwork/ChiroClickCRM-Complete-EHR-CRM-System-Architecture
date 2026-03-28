/**
 * ExercisePrescription Page Tests
 * Tests for the exercise prescription builder page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// ============================================================================
// MOCKS — must be declared before any import that uses them
// ============================================================================

const mockNavigate = vi.fn();
let mockPatientId = 'patient-1';
let mockPrescriptionId = null;
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({
      patientId: mockPatientId,
      prescriptionId: mockPrescriptionId,
    }),
    useSearchParams: () => [mockSearchParams],
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

vi.mock('../../api/exercises', () => ({
  exercisesApi: {
    getExercises: vi.fn(),
    getCategories: vi.fn(),
    getTemplates: vi.fn(),
    getPrescriptionById: vi.fn(),
    createPrescription: vi.fn(),
    createTemplate: vi.fn(),
    sendEmail: vi.fn(),
    sendSMS: vi.fn(),
    generatePDF: vi.fn(),
  },
}));

// Mock child components to isolate page-level logic
vi.mock('../../components/exercises/PrescriptionBuilder', () => ({
  default: function MockPrescriptionBuilder({
    exercises,
    onRemove,
    onUpdate,
    onReorder,
    onAddClick,
  }) {
    return (
      <div data-testid="prescription-builder">
        <span data-testid="builder-exercise-count">{exercises.length}</span>
        {exercises.map((ex, i) => (
          <div key={ex.id || i} data-testid={`builder-exercise-${ex.id || i}`}>
            <span>{ex.name}</span>
            <button data-testid={`remove-exercise-${i}`} onClick={() => onRemove(i)}>
              Remove
            </button>
          </div>
        ))}
        <button data-testid="add-exercise-btn" onClick={onAddClick}>
          Add
        </button>
      </div>
    );
  },
}));

vi.mock('../../components/exercises/ExerciseSelector', () => ({
  default: function MockExerciseSelector({
    exercises,
    categories,
    selectedExercises,
    onSelectExercise,
    loading,
  }) {
    return (
      <div data-testid="exercise-selector">
        <span data-testid="selector-loading">{loading ? 'true' : 'false'}</span>
        <span data-testid="selector-exercise-count">{exercises.length}</span>
        {exercises.map((ex) => (
          <button
            key={ex.id}
            data-testid={`select-exercise-${ex.id}`}
            onClick={() => onSelectExercise(ex)}
          >
            {ex.name}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock('../../components/exercises/PrescriptionPreview', () => ({
  default: function MockPrescriptionPreview({ prescription, patientName, onClose }) {
    return (
      <div data-testid="prescription-preview">
        <span data-testid="preview-patient-name">{patientName}</span>
        <span data-testid="preview-exercise-count">{prescription.exercises?.length || 0}</span>
        <button data-testid="close-preview" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

vi.mock('../../components/exercises/TemplateSelector', () => ({
  default: function MockTemplateSelector({
    templates,
    onSelectTemplate,
    onSaveAsTemplate,
    currentExercises,
    loading,
  }) {
    return (
      <div data-testid="template-selector">
        <span data-testid="template-count">{templates.length}</span>
        {templates.map((tmpl) => (
          <button
            key={tmpl.id}
            data-testid={`select-template-${tmpl.id}`}
            onClick={() => onSelectTemplate(tmpl)}
          >
            {tmpl.name}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock('../../components/exercises/WeeklyScheduleView', () => ({
  default: function MockWeeklyScheduleView({ exercises }) {
    return (
      <div data-testid="weekly-schedule">
        <span data-testid="schedule-exercise-count">{exercises.length}</span>
      </div>
    );
  },
}));

// ============================================================================
// IMPORTS — after mocks
// ============================================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExercisePrescription from '../../pages/ExercisePrescription';
import { exercisesApi } from '../../api/exercises';

// ============================================================================
// TEST DATA
// ============================================================================

const mockExercises = [
  {
    id: 'ex-1',
    name: 'Kneboy',
    description: 'Squats for styrke',
    category: 'strengthening',
    sets_default: 3,
    reps_default: 12,
    hold_seconds: 0,
    frequency_per_day: 1,
    frequency_per_week: 5,
  },
  {
    id: 'ex-2',
    name: 'Planke',
    description: 'Core stabilitet',
    category: 'rehabilitation',
    sets_default: 3,
    reps_default: 1,
    hold_seconds: 30,
    frequency_per_day: 2,
    frequency_per_week: 7,
  },
  {
    id: 'ex-3',
    name: 'Brystpress',
    description: 'Bryst styrke',
    category: 'strengthening',
    sets_default: 4,
    reps_default: 8,
    hold_seconds: 0,
    frequency_per_day: 1,
    frequency_per_week: 3,
  },
];

const mockCategories = [
  { id: 'cat-1', name: 'Styrketrening' },
  { id: 'cat-2', name: 'Rehabilitering' },
];

const mockTemplates = [
  {
    id: 'tmpl-1',
    name: 'Rygg rehabilitering',
    exercises: [
      { exerciseId: 'ex-1', sets: 3, reps: 10 },
      { exerciseId: 'ex-2', sets: 3, reps: 1, holdSeconds: 30 },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('ExercisePrescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientId = 'patient-1';
    mockPrescriptionId = null;
    mockSearchParams = new URLSearchParams();

    // Default API responses
    exercisesApi.getExercises.mockResolvedValue({ data: { data: mockExercises } });
    exercisesApi.getCategories.mockResolvedValue({ data: { data: mockCategories } });
    exercisesApi.getTemplates.mockResolvedValue({ data: { data: mockTemplates } });
    exercisesApi.createPrescription.mockResolvedValue({ data: { id: 'rx-new-1' } });
    exercisesApi.getPrescriptionById.mockResolvedValue({ data: null });
  });

  it('renders without crashing and shows page title', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByText('Nytt treningsprogram')).toBeInTheDocument();
    });
  });

  it('shows edit title when prescriptionId is present', async () => {
    mockPrescriptionId = 'rx-existing-1';
    exercisesApi.getPrescriptionById.mockResolvedValue({
      data: {
        name: 'Test Program',
        patient_instructions: 'Do exercises daily',
        clinical_notes: '',
        start_date: '2025-01-01',
        end_date: '2025-02-01',
        delivery_method: 'email',
        exercises: [],
      },
    });

    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByText('Rediger treningsprogram')).toBeInTheDocument();
    });
  });

  it('displays patient name from search params', async () => {
    mockSearchParams = new URLSearchParams('patientName=Ola+Nordmann');
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });
  });

  it('renders exercise selector with exercises from API', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
      expect(screen.getByTestId('selector-exercise-count').textContent).toBe('3');
    });
  });

  it('renders prescription builder component', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('prescription-builder')).toBeInTheDocument();
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('0');
    });
  });

  it('adds an exercise when selected from the selector', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('select-exercise-ex-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));

    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('1');
    });
  });

  it('removes an exercise when toggled again in the selector', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('select-exercise-ex-1')).toBeInTheDocument();
    });

    // Add exercise
    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));
    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('1');
    });

    // Toggle same exercise to remove
    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));
    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('0');
    });
  });

  it('removes exercise via prescription builder remove button', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('select-exercise-ex-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));
    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('1');
    });

    fireEvent.click(screen.getByTestId('remove-exercise-0'));
    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('0');
    });
  });

  it('shows program details form with instruction fields', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByText('Programdetaljer')).toBeInTheDocument();
      expect(screen.getByText('Instruksjoner til pasient')).toBeInTheDocument();
      expect(screen.getByText('Kliniske notater (kun for journal)')).toBeInTheDocument();
      expect(screen.getByText('Startdato')).toBeInTheDocument();
      expect(screen.getByText('Sluttdato (valgfritt)')).toBeInTheDocument();
    });
  });

  it('shows save and send buttons in header', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByText('Lagre')).toBeInTheDocument();
      expect(screen.getByText('Send til pasient')).toBeInTheDocument();
      expect(screen.getByText('Forhåndsvis')).toBeInTheDocument();
    });
  });

  it('preview button is disabled when no exercises selected', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      const previewBtn = screen.getByText('Forhåndsvis').closest('button');
      expect(previewBtn).toBeDisabled();
    });
  });

  it('save button is disabled when no exercises selected', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      const saveBtn = screen.getByText('Lagre').closest('button');
      expect(saveBtn).toBeDisabled();
    });
  });

  it('opens preview modal when preview button is clicked with exercises', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('select-exercise-ex-1')).toBeInTheDocument();
    });

    // Add exercise first
    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));
    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('1');
    });

    // Click preview
    const previewBtn = screen.getByText('Forhåndsvis').closest('button');
    expect(previewBtn).not.toBeDisabled();
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getByTestId('prescription-preview')).toBeInTheDocument();
      expect(screen.getByTestId('preview-exercise-count').textContent).toBe('1');
    });
  });

  it('closes preview modal when close is clicked', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('select-exercise-ex-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));
    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('1');
    });

    fireEvent.click(screen.getByText('Forhåndsvis').closest('button'));
    await waitFor(() => {
      expect(screen.getByTestId('prescription-preview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('close-preview'));
    await waitFor(() => {
      expect(screen.queryByTestId('prescription-preview')).not.toBeInTheDocument();
    });
  });

  it('switches between right panel views (selector, templates, schedule)', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
    });

    // Switch to templates
    fireEvent.click(screen.getByText('Maler'));
    await waitFor(() => {
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
      expect(screen.queryByTestId('exercise-selector')).not.toBeInTheDocument();
    });

    // Switch to schedule
    fireEvent.click(screen.getByText('Ukeoversikt'));
    await waitFor(() => {
      expect(screen.getByTestId('weekly-schedule')).toBeInTheDocument();
      expect(screen.queryByTestId('template-selector')).not.toBeInTheDocument();
    });

    // Switch back to selector
    fireEvent.click(screen.getByText('Øvelsesbibliotek'));
    await waitFor(() => {
      expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
      expect(screen.queryByTestId('weekly-schedule')).not.toBeInTheDocument();
    });
  });

  it('displays exercise count and estimated time in header', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('select-exercise-ex-1')).toBeInTheDocument();
    });

    // Add two exercises
    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));
    fireEvent.click(screen.getByTestId('select-exercise-ex-2'));

    await waitFor(() => {
      expect(screen.getByTestId('builder-exercise-count').textContent).toBe('2');
    });
  });

  it('shows program overview summary when exercises are selected', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByTestId('select-exercise-ex-1')).toBeInTheDocument();
    });

    // No summary initially
    expect(screen.queryByText('Programoversikt')).not.toBeInTheDocument();

    // Add exercise
    fireEvent.click(screen.getByTestId('select-exercise-ex-1'));

    await waitFor(() => {
      expect(screen.getByText('Programoversikt')).toBeInTheDocument();
      expect(screen.getByText('Antall øvelser')).toBeInTheDocument();
      expect(screen.getByText('Estimert tid')).toBeInTheDocument();
      expect(screen.getByText('Varighet')).toBeInTheDocument();
    });
  });

  it('navigates back when back button is clicked', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByText('Nytt treningsprogram')).toBeInTheDocument();
    });

    // The back button is the first button in the header area
    const backButton = screen
      .getByText('Nytt treningsprogram')
      .closest('div')
      .parentElement.querySelector('button');
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows delivery options in send dropdown', async () => {
    renderWithProviders(<ExercisePrescription />);
    await waitFor(() => {
      expect(screen.getByText('Send til pasient')).toBeInTheDocument();
      expect(screen.getByText('Send på e-post')).toBeInTheDocument();
      expect(screen.getByText('Send SMS-lenke')).toBeInTheDocument();
      expect(screen.getByText('Last ned PDF')).toBeInTheDocument();
    });
  });
});
