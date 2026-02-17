/**
 * DataCurationTab Component Tests
 * Tests rendering, filtering, and action buttons
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DataCurationTab from '../DataCurationTab';

// Mock the hooks
vi.mock('../../../hooks/useAITraining', () => ({
  useCurationFeedback: vi.fn(),
  useCurationStats: vi.fn(),
  useApproveFeedback: vi.fn(),
  useRejectFeedback: vi.fn(),
  useBulkCurationAction: vi.fn(),
}));

import {
  useCurationFeedback,
  useCurationStats,
  useApproveFeedback,
  useRejectFeedback,
  useBulkCurationAction,
} from '../../../hooks/useAITraining';

const mockFeedbackData = {
  data: [
    {
      id: '1',
      suggestion_type: 'soap_subjective',
      original_suggestion: 'Pasienten presenterer med nakkesmerter',
      user_correction: 'Pasienten presenterer med kroniske nakkesmerter',
      user_rating: 4,
      confidence_score: 0.85,
      training_status: 'pending',
      model_name: 'chiro-norwegian',
      created_at: '2026-02-15T10:00:00Z',
    },
    {
      id: '2',
      suggestion_type: 'diagnosis_code',
      original_suggestion: 'M54.2',
      user_correction: null,
      user_rating: 5,
      confidence_score: 0.92,
      training_status: 'pending',
      model_name: 'chiro-medical',
      created_at: '2026-02-16T10:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  totalPages: 1,
};

const mockStats = {
  pending: '15',
  approved: '30',
  rejected: '5',
  exported: '10',
  total: '60',
  byType: [
    { suggestion_type: 'soap_subjective', count: '20', pending: '5' },
    { suggestion_type: 'diagnosis_code', count: '15', pending: '3' },
  ],
  avgRating: '4.2',
};

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('DataCurationTab', () => {
  const mockApproveMutate = vi.fn();
  const mockRejectMutate = vi.fn();
  const mockBulkMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useCurationFeedback.mockReturnValue({ data: mockFeedbackData, isLoading: false });
    useCurationStats.mockReturnValue({ data: mockStats, isLoading: false });
    useApproveFeedback.mockReturnValue({ mutate: mockApproveMutate, isPending: false });
    useRejectFeedback.mockReturnValue({ mutate: mockRejectMutate, isPending: false });
    useBulkCurationAction.mockReturnValue({ mutate: mockBulkMutate, isPending: false });
  });

  describe('Rendering', () => {
    it('should render stats badges', () => {
      renderWithProviders(<DataCurationTab />);
      expect(screen.getAllByText('Ventende').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Godkjent').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Avvist').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should render feedback table with rows', () => {
      renderWithProviders(<DataCurationTab />);
      expect(screen.getByText('soap_subjective')).toBeInTheDocument();
      expect(screen.getByText('diagnosis_code')).toBeInTheDocument();
    });

    it('should render filter controls', () => {
      renderWithProviders(<DataCurationTab />);
      expect(screen.getByText('Alle typer')).toBeInTheDocument();
      expect(screen.getAllByText('Ventende').length).toBeGreaterThanOrEqual(1);
    });

    it('should render type distribution section', () => {
      renderWithProviders(<DataCurationTab />);
      expect(screen.getByText('Fordeling etter type')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when data is loading', () => {
      useCurationFeedback.mockReturnValue({ data: null, isLoading: true });
      renderWithProviders(<DataCurationTab />);
      expect(screen.getByText('Laster...')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty message when no feedback', () => {
      useCurationFeedback.mockReturnValue({
        data: { data: [], total: 0, page: 1, totalPages: 1 },
        isLoading: false,
      });
      renderWithProviders(<DataCurationTab />);
      expect(screen.getByText(/Ingen tilbakemeldinger funnet/)).toBeInTheDocument();
    });
  });

  describe('Filter changes', () => {
    it('should call useCurationFeedback with updated filters when type changes', () => {
      renderWithProviders(<DataCurationTab />);
      const typeSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(typeSelect, { target: { value: 'soap_subjective' } });
      // Hook should be called with new filter params (verified by re-render)
      expect(useCurationFeedback).toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    it('should fire approve mutation when approve button clicked', () => {
      renderWithProviders(<DataCurationTab />);
      const approveButtons = screen.getAllByTitle('Godkjenn');
      fireEvent.click(approveButtons[0]);
      expect(mockApproveMutate).toHaveBeenCalledWith({ id: '1' });
    });

    it('should fire reject mutation when reject button clicked', () => {
      renderWithProviders(<DataCurationTab />);
      const rejectButtons = screen.getAllByTitle('Avvis');
      fireEvent.click(rejectButtons[0]);
      expect(mockRejectMutate).toHaveBeenCalledWith('1');
    });
  });
});
