/**
 * DataCurationTab Component Tests
 * Tests stats display, filters, feedback table, bulk actions, and pagination
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  curationAPI: {
    getFeedback: vi.fn(),
    getStats: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    bulk: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'ADMIN' } }),
}));

// Mock the hooks with controllable return values
const mockFeedbackData = { data: [], totalPages: 1 };
const mockStatsData = null;
const mockApproveMutate = vi.fn();
const mockRejectMutate = vi.fn();
const mockBulkMutate = vi.fn();

vi.mock('../../../hooks/useAITraining', () => ({
  useCurationFeedback: () => ({
    data: mockFeedbackData,
    isLoading: false,
  }),
  useCurationStats: () => ({
    data: mockStatsData,
  }),
  useApproveFeedback: () => ({
    mutate: mockApproveMutate,
    isPending: false,
  }),
  useRejectFeedback: () => ({
    mutate: mockRejectMutate,
    isPending: false,
  }),
  useBulkCurationAction: () => ({
    mutate: mockBulkMutate,
    isPending: false,
  }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DataCurationTab from '../../../components/training/DataCurationTab';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('DataCurationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data to defaults
    mockFeedbackData.data = [];
    mockFeedbackData.totalPages = 1;
  });

  describe('Empty State', () => {
    it('should show empty message when no feedback exists', () => {
      renderWithProviders(<DataCurationTab />);

      expect(
        screen.getByText('Ingen tilbakemeldinger funnet med valgte filtre.')
      ).toBeInTheDocument();
    });
  });

  describe('Filters', () => {
    it('should render type filter dropdown', () => {
      renderWithProviders(<DataCurationTab />);

      // The type filter defaults to empty (all types)
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2); // type + status + rating
    });

    it('should render status filter with default pending', () => {
      renderWithProviders(<DataCurationTab />);

      const selects = screen.getAllByRole('combobox');
      // One of the selects should have 'pending' as value
      const statusSelect = selects.find((s) => s.value === 'pending');
      expect(statusSelect).toBeTruthy();
    });

    it('should render date range inputs', () => {
      renderWithProviders(<DataCurationTab />);

      const dateInputs = screen.getAllByDisplayValue('');
      // At least the two date inputs exist
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Feedback Table', () => {
    it('should render feedback rows when data exists', () => {
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Patient reports lower back pain since yesterday',
          user_correction: 'Patient reports lower back pain since two days ago',
          user_rating: 4,
          confidence_score: 0.88,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      expect(screen.getByText('soap_subjective')).toBeInTheDocument();
      expect(screen.getByText('4/5')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Test',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Korreksjon')).toBeInTheDocument();
      expect(screen.getByText('Vurdering')).toBeInTheDocument();
      expect(screen.getByText('Handlinger')).toBeInTheDocument();
    });

    it('should truncate long text in table cells', () => {
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'soap_subjective',
          original_suggestion:
            'This is a very long original suggestion text that should be truncated because it exceeds the maximum display length allowed in the table cell',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      expect(screen.getByText(/This is a very long.*\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Row Actions', () => {
    it('should render approve, edit, and reject buttons for each row', () => {
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Test suggestion',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      expect(screen.getByTitle('Godkjenn')).toBeInTheDocument();
      expect(screen.getByTitle('Rediger og godkjenn')).toBeInTheDocument();
      expect(screen.getByTitle('Avvis')).toBeInTheDocument();
    });

    it('should call approveMutation when approve button is clicked', () => {
      mockFeedbackData.data = [
        {
          id: 42,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Test suggestion',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      fireEvent.click(screen.getByTitle('Godkjenn'));
      expect(mockApproveMutate).toHaveBeenCalledWith({ id: 42 });
    });

    it('should call rejectMutation when reject button is clicked', () => {
      mockFeedbackData.data = [
        {
          id: 42,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Test suggestion',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      fireEvent.click(screen.getByTitle('Avvis'));
      expect(mockRejectMutate).toHaveBeenCalledWith(42);
    });
  });

  describe('Expand Row', () => {
    it('should expand row to show full content when clicked', () => {
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Full original text here',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
          model_name: 'chiro-no',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      // Click the expand button (the truncated text)
      const expandButton = screen.getByRole('button', { name: /Full original text here/ });
      fireEvent.click(expandButton);

      expect(screen.getByText('Original forslag')).toBeInTheDocument();
      expect(screen.getByText('Brukerens korreksjon')).toBeInTheDocument();
      expect(screen.getByText(/Modell: chiro-no/)).toBeInTheDocument();
    });
  });

  describe('Select and Bulk Actions', () => {
    it('should show bulk action bar when items are selected', () => {
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Test 1',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
        {
          id: 2,
          suggestion_type: 'soap_objective',
          original_suggestion: 'Test 2',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T11:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      // Click the individual checkbox for first row
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // index 0 is "select all"

      expect(screen.getByText(/1 valgt/)).toBeInTheDocument();
      expect(screen.getByText('Godkjenn alle')).toBeInTheDocument();
      expect(screen.getByText('Avvis alle')).toBeInTheDocument();
    });

    it('should select all items when header checkbox is clicked', () => {
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Test 1',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
        {
          id: 2,
          suggestion_type: 'soap_objective',
          original_suggestion: 'Test 2',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T11:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // select all

      expect(screen.getByText(/2 valgt/)).toBeInTheDocument();
    });

    it('should call bulkMutation with approve when Godkjenn alle is clicked', () => {
      mockFeedbackData.data = [
        {
          id: 10,
          suggestion_type: 'soap_subjective',
          original_suggestion: 'Test 1',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // select item

      fireEvent.click(screen.getByText('Godkjenn alle'));
      expect(mockBulkMutate).toHaveBeenCalledWith({
        ids: [10],
        action: 'approve',
      });
    });
  });

  describe('Pagination', () => {
    it('should not show pagination when only one page', () => {
      mockFeedbackData.totalPages = 1;
      renderWithProviders(<DataCurationTab />);

      expect(screen.queryByText('Forrige')).not.toBeInTheDocument();
      expect(screen.queryByText('Neste')).not.toBeInTheDocument();
    });

    it('should show pagination controls when multiple pages exist', () => {
      mockFeedbackData.totalPages = 3;
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'test',
          original_suggestion: 'Test',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      expect(screen.getByText('Forrige')).toBeInTheDocument();
      expect(screen.getByText('Neste')).toBeInTheDocument();
      expect(screen.getByText(/Side 1 av 3/)).toBeInTheDocument();
    });

    it('should disable Previous button on first page', () => {
      mockFeedbackData.totalPages = 3;
      mockFeedbackData.data = [
        {
          id: 1,
          suggestion_type: 'test',
          original_suggestion: 'Test',
          user_correction: null,
          user_rating: null,
          confidence_score: null,
          created_at: '2024-03-15T10:00:00Z',
        },
      ];

      renderWithProviders(<DataCurationTab />);

      expect(screen.getByText('Forrige')).toBeDisabled();
    });
  });
});
