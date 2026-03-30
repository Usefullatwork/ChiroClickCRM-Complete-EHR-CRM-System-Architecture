/**
 * ModelsTab Component Tests
 * Tests model status rendering, actions, training data display, and test model UI
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'ADMIN' } }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModelsTab from '../../../components/training/ModelsTab';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

function createDefaultProps(overrides = {}) {
  return {
    statusQuery: {
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    },
    dataQuery: {
      isLoading: false,
    },
    status: {
      ollamaRunning: true,
      models: {
        'chiro-no': { exists: true, size: '8.1GB' },
        'chiro-fast': { exists: true, size: '4.2GB' },
        'chiro-medical': { exists: false },
      },
      missingModels: 1,
    },
    trainingData: {
      totalExamples: 5224,
      files: [
        { name: 'soap-notes.jsonl', examples: 3000, sizeKB: 1200 },
        { name: 'diagnosis.jsonl', examples: 2224, sizeKB: 800 },
      ],
      categories: {
        SOAP: 3000,
        Diagnosis: 2224,
      },
    },
    rebuildMutation: { isPending: false, mutate: vi.fn(), data: null, error: null },
    backupMutation: { isPending: false, mutate: vi.fn(), data: null, error: null },
    restoreMutation: { isPending: false, mutate: vi.fn(), data: null, error: null },
    addExamplesMutation: { isPending: false, mutate: vi.fn(), isSuccess: false, data: null },
    testMutation: { isPending: false, mutate: vi.fn(), isError: false, error: null },
    newExamples: '',
    setNewExamples: vi.fn(),
    testPrompt: '',
    setTestPrompt: vi.fn(),
    selectedTestModel: 'chiro-no',
    setSelectedTestModel: vi.fn(),
    testResult: null,
    ...overrides,
  };
}

describe('ModelsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Model Status Section', () => {
    it('should show Ollama running status', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Ollama: Kjorer')).toBeInTheDocument();
    });

    it('should show Ollama not running when offline', () => {
      const props = createDefaultProps({
        status: { ollamaRunning: false, models: {}, missingModels: 0 },
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Ollama: Ikke tilgjengelig')).toBeInTheDocument();
    });

    it('should show model cards with installed and missing states', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('chiro-no')).toBeInTheDocument();
      expect(screen.getByText('8.1GB')).toBeInTheDocument();
      expect(screen.getByText('chiro-fast')).toBeInTheDocument();
      expect(screen.getByText('Mangler')).toBeInTheDocument();
    });

    it('should show missing models warning', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText(/1 modell\(er\) mangler/)).toBeInTheDocument();
    });

    it('should show loading state when status is loading', () => {
      const props = createDefaultProps({
        statusQuery: { isLoading: true, isError: false, isFetching: false, refetch: vi.fn() },
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Laster...')).toBeInTheDocument();
    });

    it('should show error state when status fetch fails', () => {
      const props = createDefaultProps({
        statusQuery: {
          isLoading: false,
          isError: true,
          isFetching: false,
          error: { message: 'Connection refused' },
          refetch: vi.fn(),
        },
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Feil ved henting av status')).toBeInTheDocument();
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });
  });

  describe('Action Cards', () => {
    it('should render Rebuild, Backup, and Restore action cards', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Rebuild Models')).toBeInTheDocument();
      expect(screen.getByText('Backup Models')).toBeInTheDocument();
      expect(screen.getByText('Restore Models')).toBeInTheDocument();
    });

    it('should call rebuildMutation.mutate when Rebuild button clicked', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      fireEvent.click(screen.getByText('Rebuild'));
      expect(props.rebuildMutation.mutate).toHaveBeenCalled();
    });

    it('should call backupMutation.mutate when Backup button clicked', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      fireEvent.click(screen.getByText('Backup'));
      expect(props.backupMutation.mutate).toHaveBeenCalled();
    });

    it('should call restoreMutation.mutate when Restore button clicked', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      fireEvent.click(screen.getByText('Restore'));
      expect(props.restoreMutation.mutate).toHaveBeenCalled();
    });

    it('should disable buttons when mutations are pending', () => {
      const props = createDefaultProps({
        rebuildMutation: { isPending: true, mutate: vi.fn(), data: null, error: null },
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Bygger...')).toBeDisabled();
    });
  });

  describe('Training Data Section', () => {
    it('should display total examples count', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText(/5[\s\u00a0]?224/)).toBeInTheDocument();
    });

    it('should display file list with examples and sizes', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('soap-notes.jsonl')).toBeInTheDocument();
      expect(screen.getByText('diagnosis.jsonl')).toBeInTheDocument();
      expect(screen.getByText('1200 KB')).toBeInTheDocument();
    });

    it('should display category summary grid', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('SOAP')).toBeInTheDocument();
      expect(screen.getByText('Diagnosis')).toBeInTheDocument();
    });

    it('should show loading state when data is loading', () => {
      const props = createDefaultProps({
        dataQuery: { isLoading: true },
      });
      renderWithProviders(<ModelsTab {...props} />);

      // Second "Laster..." in the training data section
      const loadingElements = screen.getAllByText('Laster...');
      expect(loadingElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Add Examples', () => {
    it('should render textarea for adding examples', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Legg til eksempler (JSONL-format)')).toBeInTheDocument();
    });

    it('should disable add button when textarea is empty', () => {
      const props = createDefaultProps({ newExamples: '' });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Legg til')).toBeDisabled();
    });

    it('should enable add button when textarea has content', () => {
      const props = createDefaultProps({
        newExamples: '{"prompt": "test", "response": "test"}',
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Legg til')).not.toBeDisabled();
    });

    it('should show success message after adding examples', () => {
      const props = createDefaultProps({
        addExamplesMutation: {
          isPending: false,
          mutate: vi.fn(),
          isSuccess: true,
          data: { data: { data: { added: 5, errors: [] } } },
        },
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText(/Lagt til 5 eksempler/)).toBeInTheDocument();
    });
  });

  describe('Test Model Section', () => {
    it('should render model selector and test prompt input', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Test modell')).toBeInTheDocument();
      expect(screen.getByText('chiro-no (Primer)')).toBeInTheDocument();
    });

    it('should display test result when available', () => {
      const props = createDefaultProps({
        testResult: {
          model: 'chiro-no',
          prompt: 'Test prompt',
          response: 'Generated AI response text',
        },
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText('Generated AI response text')).toBeInTheDocument();
      expect(screen.getByText(/Modell: chiro-no/)).toBeInTheDocument();
    });

    it('should show error when test mutation fails', () => {
      const props = createDefaultProps({
        testMutation: {
          isPending: false,
          mutate: vi.fn(),
          isError: true,
          error: { message: 'Model not loaded' },
        },
      });
      renderWithProviders(<ModelsTab {...props} />);

      expect(screen.getByText(/Model not loaded/)).toBeInTheDocument();
    });
  });

  describe('Refresh Button', () => {
    it('should call refetch when Oppdater button is clicked', () => {
      const props = createDefaultProps();
      renderWithProviders(<ModelsTab {...props} />);

      fireEvent.click(screen.getByText('Oppdater'));
      expect(props.statusQuery.refetch).toHaveBeenCalled();
    });
  });
});
