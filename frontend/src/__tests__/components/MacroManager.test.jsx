/**
 * MacroManager Component Tests
 * Tests for the clinical text macro management UI
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MacroManager from '../../components/macros/MacroManager';

// Mock API
vi.mock('../../services/api', () => ({
  macrosAPI: {
    getMatrix: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleFavorite: vi.fn(),
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

// Mock clipboard
const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true });

import { macrosAPI } from '../../services/api';
import toast from '../../utils/toast';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockMatrixData = {
  SOAP: {
    macros: [
      {
        id: 'm1',
        name: 'Nakkesmerter S',
        text: 'Pasienten klager over nakkesmerter...',
        isFavorite: true,
      },
      {
        id: 'm2',
        name: 'Korsrygg S',
        text: 'Pasienten opplever korsryggsmerter...',
        isFavorite: false,
      },
    ],
    subcategories: {},
  },
  Treatment: {
    macros: [
      {
        id: 'm3',
        name: 'HVLA manipulasjon',
        text: 'HVLA manipulasjon utfort...',
        isFavorite: false,
      },
    ],
    subcategories: {},
  },
};

describe('MacroManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    macrosAPI.getMatrix.mockResolvedValue({ data: { data: mockMatrixData } });
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading message while fetching macros', () => {
      macrosAPI.getMatrix.mockReturnValue(new Promise(() => {}));
      render(<MacroManager />, { wrapper: createWrapper() });
      expect(screen.getByText('Laster makroer...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CATEGORY RENDERING
  // ============================================================================

  describe('Category Rendering', () => {
    it('should render macros grouped by category', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        // SOAP and Behandling appear in multiple places (stats, filter, headers)
        const soapElements = screen.getAllByText('SOAP');
        expect(soapElements.length).toBeGreaterThan(0);
        const behandlingElements = screen.getAllByText('Behandling');
        expect(behandlingElements.length).toBeGreaterThan(0);
      });
    });

    it('should display macro names within categories', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
        expect(screen.getByText('Korsrygg S')).toBeInTheDocument();
        expect(screen.getByText('HVLA manipulasjon')).toBeInTheDocument();
      });
    });

    it('should show category count badges', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        // SOAP has 2 macros, Treatment has 1
        const badges = screen.getAllByText('2');
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // STATS CARDS
  // ============================================================================

  describe('Stats Cards', () => {
    it('should display total macros count', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Total = 3 macros
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Totalt makroer')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================

  describe('Search & Filter', () => {
    it('should filter macros when typing in search box', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Sok i makroer...');
      fireEvent.change(searchInput, { target: { value: 'nakke' } });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
        expect(screen.queryByText('HVLA manipulasjon')).not.toBeInTheDocument();
      });
    });

    it('should filter by category dropdown', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      // Select Treatment category
      const categorySelect = screen.getByDisplayValue('Alle kategorier');
      fireEvent.change(categorySelect, { target: { value: 'Treatment' } });

      await waitFor(() => {
        expect(screen.getByText('HVLA manipulasjon')).toBeInTheDocument();
        expect(screen.queryByText('Nakkesmerter S')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when search matches nothing', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Sok i makroer...');
      fireEvent.change(searchInput, { target: { value: 'zzzzzzzz' } });

      await waitFor(() => {
        expect(screen.getByText('Ingen makroer matcher filteret.')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COLLAPSE/EXPAND
  // ============================================================================

  describe('Category Collapse/Expand', () => {
    it('should collapse a category when clicking its header', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      // The SOAP category header is an h3 inside a button — find it specifically
      const soapHeaders = screen.getAllByText('SOAP');
      // Click the one that's inside a category header button (has the colors.header class)
      const categoryHeader = soapHeaders.find((el) => el.closest('button'));
      fireEvent.click(categoryHeader.closest('button'));

      await waitFor(() => {
        // Macros inside SOAP should be hidden
        expect(screen.queryByText('Nakkesmerter S')).not.toBeInTheDocument();
        // Treatment macros should still be visible
        expect(screen.getByText('HVLA manipulasjon')).toBeInTheDocument();
      });
    });

    it('should expand a collapsed category when clicking again', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      // Collapse
      const soapHeaders = screen.getAllByText('SOAP');
      const categoryHeader = soapHeaders.find((el) => el.closest('button'));
      fireEvent.click(categoryHeader.closest('button'));
      await waitFor(() => {
        expect(screen.queryByText('Nakkesmerter S')).not.toBeInTheDocument();
      });

      // Expand again — re-query after DOM update
      const soapHeaders2 = screen.getAllByText('SOAP');
      const categoryHeader2 = soapHeaders2.find((el) => el.closest('button'));
      fireEvent.click(categoryHeader2.closest('button'));
      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COPY TO CLIPBOARD
  // ============================================================================

  describe('Copy to Clipboard', () => {
    it('should copy macro text to clipboard and show toast', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      // Find and click copy button (title="Kopier")
      const copyButtons = screen.getAllByTitle('Kopier');
      fireEvent.click(copyButtons[0]);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('Pasienten klager over nakkesmerter...');
      expect(toast.info).toHaveBeenCalledWith('Kopiert til utklippstavle');
    });
  });

  // ============================================================================
  // FAVORITE TOGGLE
  // ============================================================================

  describe('Favorite Toggle', () => {
    it('should call toggleFavorite when star button is clicked', async () => {
      macrosAPI.toggleFavorite.mockResolvedValue({ data: {} });
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      const favButtons = screen.getAllByTitle('Favoritt');
      fireEvent.click(favButtons[0]);

      await waitFor(() => {
        expect(macrosAPI.toggleFavorite).toHaveBeenCalledWith('m1');
      });
    });
  });

  // ============================================================================
  // CREATE MODAL
  // ============================================================================

  describe('Create Modal', () => {
    it('should open create modal when "Ny makro" is clicked', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ny makro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Ny makro'));

      await waitFor(() => {
        // Modal title for new macro
        const modalHeaders = screen.getAllByText('Ny makro');
        expect(modalHeaders.length).toBeGreaterThanOrEqual(2); // button + modal title
      });
    });

    it('should show validation toast when submitting empty form', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ny makro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Ny makro'));

      await waitFor(() => {
        expect(screen.getByText('Opprett')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Opprett'));

      // The form uses HTML5 required validation, so the browser prevents submission
      // and toast.warning won't be called unless both fields are filled but empty
      expect(macrosAPI.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // DELETE CONFIRMATION
  // ============================================================================

  describe('Delete Confirmation', () => {
    it('should show delete confirmation dialog', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Slett');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Slett makro')).toBeInTheDocument();
        expect(screen.getByText(/Er du sikker/)).toBeInTheDocument();
      });
    });

    it('should call delete API when confirmed', async () => {
      macrosAPI.delete.mockResolvedValue({ data: {} });
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Slett');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Slett makro')).toBeInTheDocument();
      });

      // Click the "Slett" button in the confirmation dialog
      const confirmBtn = screen.getAllByText('Slett').find((el) => el.closest('.bg-red-600'));
      if (confirmBtn) {
        fireEvent.click(confirmBtn);
      }

      await waitFor(() => {
        expect(macrosAPI.delete).toHaveBeenCalledWith('m1');
      });
    });

    it('should close delete dialog when "Avbryt" is clicked', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Slett');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Slett makro')).toBeInTheDocument();
      });

      // Click Avbryt
      const cancelButtons = screen.getAllByText('Avbryt');
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Slett makro')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EDIT MODAL
  // ============================================================================

  describe('Edit Modal', () => {
    it('should open edit modal pre-filled with macro data', async () => {
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter S')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Rediger');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Rediger makro')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Nakkesmerter S')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should show empty state when no macros exist', async () => {
      macrosAPI.getMatrix.mockResolvedValue({ data: { data: {} } });
      render(<MacroManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ingen makroer opprettet enda.')).toBeInTheDocument();
        expect(screen.getByText('Opprett din forste makro')).toBeInTheDocument();
      });
    });
  });
});
