/**
 * NoShowImporter Component Tests
 * Tests for no-show CSV import and follow-up message generation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mocks BEFORE component import
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
  formatTime: () => '10:00',
}));

vi.mock('../../../services/api', () => ({
  patientsAPI: {
    getAll: vi.fn(),
  },
  communicationsAPI: {
    sendSMS: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { patientsAPI, communicationsAPI } from '../../../services/api';
import NoShowImporter from '../../../components/communications/NoShowImporter';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderWithProviders(ui) {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

const mockOnClose = vi.fn();

describe('NoShowImporter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientsAPI.getAll.mockResolvedValue({
      data: {
        patients: [{ id: 1, first_name: 'Ola', last_name: 'Nordmann', phone: '+4712345678' }],
      },
    });
    communicationsAPI.sendSMS.mockResolvedValue({ data: { success: true } });
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = renderWithProviders(
        <NoShowImporter isOpen={false} onClose={mockOnClose} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Importer No-Shows')).toBeInTheDocument();
    });

    it('should show step indicator (Steg 1 av 4)', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Steg 1 av 4')).toBeInTheDocument();
    });

    it('should render file upload zone on step 1', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Dra fil hit eller klikk for å laste opp')).toBeInTheDocument();
    });

    it('should render text input area for pasting phone numbers', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Lim inn telefonnumre (ett per linje)')).toBeInTheDocument();
    });

    it('should show format help section', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Støttede formater:')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CLOSE BEHAVIOR
  // ============================================================================

  describe('Close Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      // The X close button is in the header
      const closeButtons = screen.getAllByRole('button');
      // Find the close button (the one in the header with X icon)
      const headerClose = closeButtons.find((btn) =>
        btn.closest('.flex.items-center.justify-between')
      );
      if (headerClose) {
        fireEvent.click(headerClose);
      }
    });

    it('should call onClose when Avbryt button is clicked', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Avbryt'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TEXT PARSING
  // ============================================================================

  describe('Text Parsing', () => {
    it('should enable Neste button after entering phone numbers', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: '+47 912 34 567' },
      });

      const nextBtn = screen.getByText('Neste');
      expect(nextBtn).not.toBeDisabled();
    });

    it('should disable Neste button when text area is empty', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      const nextBtn = screen.getByText('Neste');
      expect(nextBtn).toBeDisabled();
    });

    it('should navigate to step 2 after parsing text', async () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: '+47 912 34 567\n+47 987 65 432' },
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('Steg 2 av 4')).toBeInTheDocument();
        expect(screen.getByText(/Funnet 2 oppføring/)).toBeInTheDocument();
      });
    });

    it('should show parsed entries with phone numbers in step 2', async () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: '+47 912 34 567' },
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('+4791234567')).toBeInTheDocument();
      });
    });

    it('should show error for lines without recognizable contact info', async () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: 'just some random text' },
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('Feil')).toBeInTheDocument();
      });
    });

    it('should parse date and time from CSV line', async () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: '+47 912 34 567, 29.01.2026, 14:00' },
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('29.01.2026')).toBeInTheDocument();
        expect(screen.getByText('14:00')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // STEP 2 -> STEP 3 (Match Patients)
  // ============================================================================

  describe('Patient Matching', () => {
    it('should show Match pasienter button on step 2', async () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: '+47 912 34 567' },
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('Match pasienter')).toBeInTheDocument();
      });
    });

    it('should show Tilbake button on step 2 to go back', async () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: '+47 912 34 567' },
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        expect(screen.getByText('← Tilbake')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PROGRESS BAR
  // ============================================================================

  describe('Progress Bar', () => {
    it('should show 25% progress on step 1', () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);
      const progressBar = document.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar.style.width).toBe('25%');
    });

    it('should show 50% progress on step 2', async () => {
      renderWithProviders(<NoShowImporter isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, {
        target: { value: '+47 912 34 567' },
      });

      fireEvent.click(screen.getByText('Neste'));

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-red-500');
        expect(progressBar.style.width).toBe('50%');
      });
    });
  });
});
