/**
 * ExerciseSettings Component Tests
 *
 * Tests exercise library management: search, filters, create/edit modal, delete
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  exercisesAPI: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getCategories: vi.fn(),
    getBodyRegions: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../components/ui/ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('lucide-react', () => ({
  Dumbbell: () => <span>Dumbbell</span>,
  Search: () => <span>Search</span>,
  Plus: () => <span>Plus</span>,
  Edit3: () => <span>Edit3</span>,
  Trash2: () => <span>Trash2</span>,
  Video: () => <span>Video</span>,
  Image: () => <span>Image</span>,
  X: () => <span>X</span>,
  Check: () => <span>Check</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  Loader2: () => <span>Loader2</span>,
  Save: () => <span>Save</span>,
}));

import ExerciseSettings from '../../../components/settings/ExerciseSettings';
import { exercisesAPI } from '../../../services/api';

const mockExercises = [
  {
    id: 1,
    name_no: 'Kne til bryst',
    name_en: 'Knee to Chest',
    category: 'stretching',
    body_region: 'lumbar',
    difficulty: 'beginner',
    video_url: 'https://youtube.com/watch?v=abc123',
    image_url: 'https://example.com/img.jpg',
    is_global: false,
  },
  {
    id: 2,
    name_no: 'Planke',
    name_en: 'Plank',
    category: 'strengthening',
    body_region: 'core',
    difficulty: 'intermediate',
    video_url: '',
    image_url: '',
    is_global: true,
  },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (props = {}) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ExerciseSettings lang="no" {...props} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ExerciseSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exercisesAPI.getAll.mockResolvedValue({
      data: { exercises: mockExercises },
    });
    exercisesAPI.getCategories.mockResolvedValue({
      data: { categories: ['stretching', 'strengthening', 'mobility'] },
    });
    exercisesAPI.getBodyRegions.mockResolvedValue({
      data: { bodyRegions: ['cervical', 'lumbar', 'core'] },
    });
  });

  it('should render the exercise library header', async () => {
    renderWithProviders();
    expect(screen.getByText('Øvelsesbibliotek')).toBeInTheDocument();
    expect(screen.getByText('Administrer øvelser, legg til videoer og bilder')).toBeInTheDocument();
  });

  it('should render the new exercise button', () => {
    renderWithProviders();
    expect(screen.getByText('Ny øvelse')).toBeInTheDocument();
  });

  it('should render search input', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText('Søk etter øvelser...')).toBeInTheDocument();
  });

  it('should display exercises after loading', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Kne til bryst')).toBeInTheDocument();
    });
    expect(screen.getByText('Planke')).toBeInTheDocument();
  });

  it('should show empty state when no exercises match', async () => {
    exercisesAPI.getAll.mockResolvedValue({ data: { exercises: [] } });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Ingen øvelser lagt til ennå')).toBeInTheDocument();
    });
  });

  it('should open create modal when new exercise button is clicked', async () => {
    renderWithProviders();
    const newBtn = screen.getByText('Ny øvelse');
    fireEvent.click(newBtn);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('f.eks. Kne til bryst tøyning')).toBeInTheDocument();
    });
  });

  it('should show category filter dropdown', () => {
    renderWithProviders();
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Alle kategorier')).toBeInTheDocument();
    expect(screen.getByText('Alle regioner')).toBeInTheDocument();
  });

  it('should not show delete button for global exercises', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Planke')).toBeInTheDocument();
    });
    // Global exercises should not have a delete button
    // Only the non-global exercise (Kne til bryst) should have trash
    const editButtons = screen.getAllByTitle('Rediger');
    expect(editButtons.length).toBe(2);
    const deleteButtons = screen.getAllByTitle('Slett');
    expect(deleteButtons.length).toBe(1);
  });

  it('should update search input value', () => {
    renderWithProviders();
    const searchInput = screen.getByPlaceholderText('Søk etter øvelser...');
    fireEvent.change(searchInput, { target: { value: 'Planke' } });
    expect(searchInput.value).toBe('Planke');
  });
});
