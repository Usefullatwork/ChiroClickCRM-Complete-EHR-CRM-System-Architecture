import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API module
vi.mock('../../services/api', () => ({
  templatesAPI: {
    getByCategory: vi.fn(),
    toggleFavorite: vi.fn(),
    incrementUsage: vi.fn(),
  },
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
}));

import Templates from '../../pages/Templates';
import { templatesAPI } from '../../services/api';

const mockTemplates = {
  data: {
    categories: [
      {
        category: 'Ortopedisk',
        templates: [
          {
            id: 1,
            name: 'Skulderundersøkelse',
            description: 'Standard skulder-protokoll',
            category: 'Ortopedisk',
            is_favorite: true,
            usage_count: 12,
            language: 'NO',
            fields: { region: 'shoulder' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-03-15T00:00:00Z',
          },
          {
            id: 2,
            name: 'Kneundersøkelse',
            description: 'Standard kne-protokoll',
            category: 'Ortopedisk',
            is_favorite: false,
            usage_count: 5,
            language: 'NO',
            fields: { region: 'knee' },
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-03-10T00:00:00Z',
          },
        ],
      },
      {
        category: 'Nevrologisk',
        templates: [
          {
            id: 3,
            name: 'Nevrologisk screening',
            description: 'Nevroundersøkelse komplett',
            category: 'Nevrologisk',
            is_favorite: false,
            usage_count: 8,
            language: 'NO',
            fields: { region: 'neuro' },
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-03-12T00:00:00Z',
          },
        ],
      },
    ],
  },
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('Templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    templatesAPI.getByCategory.mockResolvedValue(mockTemplates);
    templatesAPI.toggleFavorite.mockResolvedValue({ data: { success: true } });
    templatesAPI.incrementUsage.mockResolvedValue({ data: { success: true } });
  });

  it('renders without crashing', async () => {
    renderWithProviders(<Templates />);
    expect(screen.getByText('clinicalTemplates')).toBeInTheDocument();
  });

  it('displays the page header and subtitle', async () => {
    renderWithProviders(<Templates />);
    expect(screen.getByText('clinicalTemplates')).toBeInTheDocument();
    expect(screen.getByText('templatesSubtitle')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    templatesAPI.getByCategory.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Templates />);
    expect(screen.getByText('loadingTemplates')).toBeInTheDocument();
  });

  it('renders template cards after data loads', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });
    expect(screen.getByText('Kneundersøkelse')).toBeInTheDocument();
    expect(screen.getByText('Nevrologisk screening')).toBeInTheDocument();
  });

  it('displays stats cards with correct counts', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });
    // Total templates = 3
    expect(screen.getByText('totalTemplates')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // Favorites = 1
    expect(screen.getByText('favorites')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    // Most used = 12
    expect(screen.getByText('mostUsed')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    // Categories = 2
    expect(screen.getByText('categories')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('has a search input field', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('searchTemplates');
    expect(searchInput).toBeInTheDocument();
  });

  it('filters templates by search term', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('searchTemplates');
    fireEvent.change(searchInput, { target: { value: 'Skulder' } });

    expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    expect(screen.queryByText('Kneundersøkelse')).not.toBeInTheDocument();
    expect(screen.queryByText('Nevrologisk screening')).not.toBeInTheDocument();
  });

  it('has a category filter dropdown with all categories', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('allCategories');
    expect(categorySelect).toBeInTheDocument();

    // Category options should be present
    const options = categorySelect.querySelectorAll('option');
    expect(options.length).toBe(3); // "All" + 2 categories
  });

  it('filters templates by category selection', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('allCategories');
    fireEvent.change(categorySelect, { target: { value: 'Nevrologisk' } });

    expect(screen.getByText('Nevrologisk screening')).toBeInTheDocument();
    expect(screen.queryByText('Skulderundersøkelse')).not.toBeInTheDocument();
    expect(screen.queryByText('Kneundersøkelse')).not.toBeInTheDocument();
  });

  it('shows empty state when no templates match search', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('searchTemplates');
    fireEvent.change(searchInput, { target: { value: 'nonexistent template xyz' } });

    expect(screen.getByText('noTemplatesFound')).toBeInTheDocument();
  });

  it('opens detail modal when clicking a template card', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Skulderundersøkelse'));

    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('templateFields')).toBeInTheDocument();
      expect(screen.getByText('copyTemplate')).toBeInTheDocument();
    });
  });

  it('has view mode toggle buttons (grid/list)', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });

    // There should be 2 view mode buttons (grid + list) in the header
    const buttons = screen.getAllByRole('button');
    // At least 2 buttons for grid/list toggle exist
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('switches to list view when list button is clicked', async () => {
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('Skulderundersøkelse')).toBeInTheDocument();
    });

    // Find and click the list view button (second toggle button)
    const buttons = screen.getAllByRole('button');
    // The list view button is the second button in the header area
    const listButton = buttons[1];
    fireEvent.click(listButton);

    // In list view, we should see table headers
    await waitFor(() => {
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('usageCount')).toBeInTheDocument();
      expect(screen.getByText('actions')).toBeInTheDocument();
    });
  });

  it('shows empty state when API returns no categories', async () => {
    templatesAPI.getByCategory.mockResolvedValue({ data: { categories: [] } });
    renderWithProviders(<Templates />);
    await waitFor(() => {
      expect(screen.getByText('noTemplatesFound')).toBeInTheDocument();
    });
  });
});
