/**
 * Training Page Tests
 * Tests for AI model training pipeline management page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock services/api — trainingAPI
vi.mock('../../services/api', () => ({
  trainingAPI: {
    getStatus: vi.fn(),
    getData: vi.fn(),
    rebuild: vi.fn(),
    backup: vi.fn(),
    restore: vi.fn(),
    addExamples: vi.fn(),
    testModel: vi.fn(),
  },
  default: { get: vi.fn(), post: vi.fn() },
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock training tab components
vi.mock('../../components/training', () => ({
  ModelsTab: ({ status, trainingData }) => (
    <div data-testid="models-tab">
      <span data-testid="model-status">{status ? 'has-status' : 'no-status'}</span>
      <span data-testid="training-data">{trainingData ? 'has-data' : 'no-data'}</span>
    </div>
  ),
}));

vi.mock('../../components/training/AnalyticsTab', () => ({
  default: () => <div data-testid="analytics-tab">Analytics</div>,
}));

vi.mock('../../components/training/DataCurationTab', () => ({
  default: () => <div data-testid="data-curation-tab">DataCuration</div>,
}));

vi.mock('../../components/training/PipelineTab', () => ({
  default: () => <div data-testid="pipeline-tab">Pipeline</div>,
}));

vi.mock('../../components/training/PlaygroundTab', () => ({
  default: () => <div data-testid="playground-tab">Playground</div>,
}));

import Training from '../../pages/Training';
import { trainingAPI } from '../../services/api';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Training />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Training Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    trainingAPI.getStatus.mockResolvedValue({
      data: {
        data: {
          activeModel: 'chiro-no-sft-dpo-v6',
          status: 'ready',
          totalExamples: 5224,
        },
      },
    });
    trainingAPI.getData.mockResolvedValue({
      data: {
        data: {
          sftExamples: 5224,
          dpoExamples: 916,
        },
      },
    });
  });

  it('should render the AI model management heading', () => {
    renderPage();

    expect(screen.getByText('aiModelManagement')).toBeInTheDocument();
  });

  it('should render four tab buttons', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /tabModels/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tabDataCuration/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tabTraining/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tabPlayground/i })).toBeInTheDocument();
  });

  it('should show models tab by default', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('models-tab')).toBeInTheDocument();
    });
  });

  it('should fetch status and data on mount', async () => {
    renderPage();

    await waitFor(() => {
      expect(trainingAPI.getStatus).toHaveBeenCalled();
      expect(trainingAPI.getData).toHaveBeenCalled();
    });
  });

  it('should switch to data curation tab on click', async () => {
    renderPage();

    const curationTab = screen.getByRole('button', { name: /tabDataCuration/i });
    fireEvent.click(curationTab);

    await waitFor(() => {
      expect(screen.getByTestId('data-curation-tab')).toBeInTheDocument();
    });
  });

  it('should switch to pipeline tab on click', async () => {
    renderPage();

    const pipelineTab = screen.getByRole('button', { name: /tabTraining/i });
    fireEvent.click(pipelineTab);

    await waitFor(() => {
      expect(screen.getByTestId('pipeline-tab')).toBeInTheDocument();
    });
  });

  it('should switch to playground tab on click', async () => {
    renderPage();

    const playgroundTab = screen.getByRole('button', { name: /tabPlayground/i });
    fireEvent.click(playgroundTab);

    await waitFor(() => {
      expect(screen.getByTestId('playground-tab')).toBeInTheDocument();
    });
  });
});
