/**
 * PipelineTab Component Tests
 * Tests pipeline status rendering, trigger, and history
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PipelineTab from '../PipelineTab';

vi.mock('../../../hooks/useAITraining', () => ({
  useRetrainingStatus: vi.fn(),
  useRetrainingHistory: vi.fn(),
  useTriggerRetraining: vi.fn(),
  useRollbackModel: vi.fn(),
  useRLAIFStats: vi.fn(),
  useGeneratePreferencePairs: vi.fn(),
}));

import {
  useRetrainingStatus,
  useRetrainingHistory,
  useTriggerRetraining,
  useRollbackModel,
  useRLAIFStats,
  useGeneratePreferencePairs,
} from '../../../hooks/useAITraining';

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('PipelineTab', () => {
  const mockTriggerMutate = vi.fn();
  const mockRollbackMutate = vi.fn();
  const mockGenerateMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useRetrainingStatus.mockReturnValue({ data: { status: 'idle' }, isLoading: false });
    useRetrainingHistory.mockReturnValue({
      data: [
        {
          id: '1',
          trigger_type: 'manual',
          training_samples_count: 500,
          status: 'completed',
          created_at: '2026-02-15T10:00:00Z',
          test_results: { accuracy: 0.89 },
        },
      ],
      isLoading: false,
    });
    useTriggerRetraining.mockReturnValue({
      mutate: mockTriggerMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
    });
    useRollbackModel.mockReturnValue({ mutate: mockRollbackMutate, isPending: false });
    useRLAIFStats.mockReturnValue({
      data: { totalPairs: 120, totalEvaluations: 50, avgQualityScore: 0.82 },
      isLoading: false,
    });
    useGeneratePreferencePairs.mockReturnValue({
      mutate: mockGenerateMutate,
      isPending: false,
      isSuccess: false,
    });
  });

  describe('Rendering', () => {
    it('should render idle status banner', () => {
      renderWithProviders(<PipelineTab />);
      expect(screen.getByText('Pipeline ledig')).toBeInTheDocument();
    });

    it('should render running status when pipeline is active', () => {
      useRetrainingStatus.mockReturnValue({
        data: { status: 'in_progress', currentStep: 'build' },
        isLoading: false,
      });
      renderWithProviders(<PipelineTab />);
      expect(screen.getByText('Treningspipeline kjorer...')).toBeInTheDocument();
    });

    it('should render failed status', () => {
      useRetrainingStatus.mockReturnValue({
        data: { status: 'failed', currentStep: 'test' },
        isLoading: false,
      });
      renderWithProviders(<PipelineTab />);
      expect(screen.getByText('Siste kjoring feilet')).toBeInTheDocument();
    });

    it('should render trigger card with model selector', () => {
      renderWithProviders(<PipelineTab />);
      expect(screen.getByRole('button', { name: /Start trening/ })).toBeInTheDocument();
      expect(screen.getByText('Alle modeller')).toBeInTheDocument();
    });

    it('should render history table', () => {
      renderWithProviders(<PipelineTab />);
      expect(screen.getByText('Treningshistorikk')).toBeInTheDocument();
      expect(screen.getByText('manual')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('should render RLAIF section with stats', () => {
      renderWithProviders(<PipelineTab />);
      expect(screen.getByText('RLAIF (AI-assistert feedback)')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should fire trigger mutation when start button clicked', () => {
      renderWithProviders(<PipelineTab />);
      const startBtn = screen.getByRole('button', { name: /Start trening/ });
      fireEvent.click(startBtn);
      expect(mockTriggerMutate).toHaveBeenCalledWith({ dryRun: false });
    });

    it('should include dryRun flag when checkbox checked', () => {
      renderWithProviders(<PipelineTab />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const startBtn = screen.getByRole('button', { name: /Start trening/ });
      fireEvent.click(startBtn);
      expect(mockTriggerMutate).toHaveBeenCalledWith({ dryRun: true });
    });

    it('should disable start button when pipeline is running', () => {
      useRetrainingStatus.mockReturnValue({
        data: { status: 'in_progress', currentStep: 'export' },
        isLoading: false,
      });
      renderWithProviders(<PipelineTab />);
      const startBtn = screen.getByRole('button', { name: /Start trening|Starter/ });
      expect(startBtn).toBeDisabled();
    });
  });

  describe('Empty history', () => {
    it('should show empty message when no history', () => {
      useRetrainingHistory.mockReturnValue({ data: [], isLoading: false });
      renderWithProviders(<PipelineTab />);
      expect(screen.getByText('Ingen tidligere treningskjoringer.')).toBeInTheDocument();
    });
  });
});
