/**
 * Macros Page Tests
 * Tests for the Macros page wrapper and its MacroManager child component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => {
      const map = {
        macros: 'Makroer',
        macrosDescription: 'Administrer kliniske tekstmakroer',
        searchMacros: 'Søk i makroer...',
        macroNamePlaceholder: 'f.eks. Nakkesmerter - Subjektiv',
        macroTextPlaceholder: 'Skriv inn makroteksten.',
        optional: 'Valgfritt',
        shortcutKeyPlaceholder: 'f.eks. Ctrl+Shift+N',
      };
      return map[key] || fallback || key;
    },
    lang: 'no',
  }),
}));

// Mock APIs
vi.mock('../../services/api', () => ({
  macrosAPI: {
    getMatrix: vi.fn(),
    search: vi.fn(),
    getFavorites: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    expand: vi.fn(),
    toggleFavorite: vi.fn(),
    recordUsage: vi.fn(),
  },
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Zap: () => <span>Zap</span>,
  Search: () => <span>Search</span>,
  Plus: () => <span>Plus</span>,
  Edit2: () => <span>Edit2</span>,
  Trash2: () => <span>Trash2</span>,
  Star: (props) => <span>Star</span>,
  X: () => <span>X</span>,
  Filter: () => <span>Filter</span>,
  Copy: () => <span>Copy</span>,
  Keyboard: () => <span>Keyboard</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronRight: () => <span>ChevronRight</span>,
}));

import Macros from '../../pages/Macros';
import { macrosAPI } from '../../services/api';
import toast from '../../utils/toast';

const mockMatrixData = {
  SOAP: {
    macros: [
      {
        id: 'm1',
        name: 'Nakkesmerter Subjektiv',
        text: 'Pasienten klager over nakkesmerter.',
        isFavorite: false,
        usageCount: 5,
      },
      {
        id: 'm2',
        name: 'Rygg Objektiv',
        text: 'Palpatorisk omhet i lumbalt.',
        soapSection: 'objective',
        isFavorite: true,
        usageCount: 12,
      },
    ],
    subcategories: {},
  },
  Treatment: {
    macros: [
      {
        id: 'm3',
        name: 'Manipulasjon',
        text: 'Manipulasjon av segmentet.',
        isFavorite: false,
        usageCount: 0,
        shortcutKey: 'Ctrl+M',
      },
    ],
    subcategories: {},
  },
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Macros Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    macrosAPI.getMatrix.mockResolvedValue({ data: { data: mockMatrixData } });
  });

  // ==========================================================================
  // HEADING & LAYOUT
  // ==========================================================================

  describe('Heading & Layout', () => {
    it('should render the page title', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Makroer')).toBeInTheDocument();
      });
    });

    it('should render the page description', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Administrer kliniske tekstmakroer')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // SEARCH & FILTER CONTROLS
  // ==========================================================================

  describe('Search & Filter Controls', () => {
    it('should show search input', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Søk i makroer...')).toBeInTheDocument();
      });
    });

    it('should show category filter dropdown', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });
    });

    it('should show the create new macro button', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Ny makro')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // MACRO LIST DISPLAY
  // ==========================================================================

  describe('Macro List Display', () => {
    it('should display macros grouped by category after loading', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter Subjektiv')).toBeInTheDocument();
        expect(screen.getByText('Rygg Objektiv')).toBeInTheDocument();
        expect(screen.getByText('Manipulasjon')).toBeInTheDocument();
      });
    });

    it('should display category headers for SOAP and Behandling', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        // SOAP appears both in filter dropdown option and as category header
        const soapElements = screen.getAllByText('SOAP');
        expect(soapElements.length).toBeGreaterThanOrEqual(2); // option + header
        // Behandling appears in filter dropdown and as category header
        const behandlingElements = screen.getAllByText('Behandling');
        expect(behandlingElements.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should display macro text content', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Pasienten klager over nakkesmerter.')).toBeInTheDocument();
        expect(screen.getByText('Palpatorisk omhet i lumbalt.')).toBeInTheDocument();
      });
    });

    it('should show usage count for macros that have been used', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Brukt 5 ganger')).toBeInTheDocument();
        expect(screen.getByText('Brukt 12 ganger')).toBeInTheDocument();
      });
    });

    it('should show category badge counts', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        // Verify category groups rendered with macros inside
        expect(screen.getByText('Nakkesmerter Subjektiv')).toBeInTheDocument();
        // Badge counts are rendered as numeric spans — verify at least one exists
        const badges = screen.getAllByText(/^[0-9]+$/);
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show keyboard shortcut hint when macros exist', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(
          screen.getByText(/Ctrl\+1 til Ctrl\+9 kopierer de forste 9 makroene raskt/)
        ).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // STAT CARDS
  // ==========================================================================

  describe('Stat Cards', () => {
    it('should show total macro count stat card', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Totalt makroer')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================

  describe('Empty State', () => {
    it('should show empty state when no macros exist', async () => {
      macrosAPI.getMatrix.mockResolvedValue({ data: { data: {} } });

      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Ingen makroer opprettet enda.')).toBeInTheDocument();
      });
    });

    it('should show create prompt in empty state', async () => {
      macrosAPI.getMatrix.mockResolvedValue({ data: { data: {} } });

      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Opprett din forste makro')).toBeInTheDocument();
      });
    });

    it('should show filter empty state when search has no results', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter Subjektiv')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Søk i makroer...');
      fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('Ingen makroer matcher filteret.')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe('Loading State', () => {
    it('should show loading indicator while fetching macros', () => {
      macrosAPI.getMatrix.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<Macros />);

      expect(screen.getByText('Laster makroer...')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // MACRO ACTION BUTTONS
  // ==========================================================================

  describe('Macro Action Buttons', () => {
    it('should render favorite buttons for each macro', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        const favoriteButtons = screen.getAllByTitle('Favoritt');
        expect(favoriteButtons.length).toBe(3);
      });
    });

    it('should render copy buttons for each macro', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        const copyButtons = screen.getAllByTitle('Kopier');
        expect(copyButtons.length).toBe(3);
      });
    });

    it('should render edit buttons for each macro', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        const editButtons = screen.getAllByTitle('Rediger');
        expect(editButtons.length).toBe(3);
      });
    });

    it('should render delete buttons for each macro', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Slett');
        expect(deleteButtons.length).toBe(3);
      });
    });
  });

  // ==========================================================================
  // SEARCH FILTERING
  // ==========================================================================

  describe('Search Filtering', () => {
    it('should filter macros by search query', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter Subjektiv')).toBeInTheDocument();
        expect(screen.getByText('Manipulasjon')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Søk i makroer...');
      fireEvent.change(searchInput, { target: { value: 'Nakke' } });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter Subjektiv')).toBeInTheDocument();
        expect(screen.queryByText('Manipulasjon')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // API INTEGRATION
  // ==========================================================================

  describe('API Integration', () => {
    it('should call getMatrix on mount', async () => {
      renderWithProviders(<Macros />);

      await waitFor(() => {
        expect(macrosAPI.getMatrix).toHaveBeenCalled();
      });
    });
  });
});
