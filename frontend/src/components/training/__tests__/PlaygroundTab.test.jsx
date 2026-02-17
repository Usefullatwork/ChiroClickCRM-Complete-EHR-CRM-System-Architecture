/**
 * PlaygroundTab Component Tests
 * Tests prompt input, model selection, and test execution
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlaygroundTab from '../PlaygroundTab';

// Mock the API
vi.mock('../../../services/api', () => ({
  trainingAPI: {
    testModel: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            model: 'chiro-no',
            prompt: 'test prompt',
            response: 'Generated response text',
            latency_ms: 245,
          },
        },
      })
    ),
  },
}));

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('PlaygroundTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render prompt textarea', () => {
      renderWithProviders(<PlaygroundTab />);
      expect(screen.getByPlaceholderText(/Skriv en prompt/)).toBeInTheDocument();
    });

    it('should render model selector', () => {
      renderWithProviders(<PlaygroundTab />);
      expect(screen.getByText('chiro-no (Standard)')).toBeInTheDocument();
    });

    it('should render preset prompt buttons', () => {
      renderWithProviders(<PlaygroundTab />);
      expect(screen.getByText('SOAP nakkesmerter')).toBeInTheDocument();
      expect(screen.getByText('Diagnosekoder')).toBeInTheDocument();
      expect(screen.getByText('Red flag analyse')).toBeInTheDocument();
      expect(screen.getByText('Norsk medisinsk')).toBeInTheDocument();
    });

    it('should render mode toggle (Enkelt / Side-by-side)', () => {
      renderWithProviders(<PlaygroundTab />);
      expect(screen.getByText('Enkelt')).toBeInTheDocument();
      expect(screen.getByText('Side-by-side')).toBeInTheDocument();
    });

    it('should render run button', () => {
      renderWithProviders(<PlaygroundTab />);
      expect(screen.getByText(/Kjor test/)).toBeInTheDocument();
    });
  });

  describe('Preset prompts', () => {
    it('should populate textarea when preset is clicked', () => {
      renderWithProviders(<PlaygroundTab />);
      const presetBtn = screen.getByText('SOAP nakkesmerter');
      fireEvent.click(presetBtn);
      const textarea = screen.getByPlaceholderText(/Skriv en prompt/);
      expect(textarea.value).toContain('nakkesmerter');
    });
  });

  describe('Mode toggle', () => {
    it('should show second model selector in side-by-side mode', () => {
      renderWithProviders(<PlaygroundTab />);
      const sideBySideBtn = screen.getByText('Side-by-side');
      fireEvent.click(sideBySideBtn);
      expect(screen.getByText('vs')).toBeInTheDocument();
    });
  });

  describe('Run button', () => {
    it('should be disabled when textarea is empty', () => {
      renderWithProviders(<PlaygroundTab />);
      const runBtn = screen.getByText(/Kjor test/);
      expect(runBtn).toBeDisabled();
    });

    it('should be enabled when textarea has content', () => {
      renderWithProviders(<PlaygroundTab />);
      const textarea = screen.getByPlaceholderText(/Skriv en prompt/);
      fireEvent.change(textarea, { target: { value: 'Test prompt text' } });
      const runBtn = screen.getByText(/Kjor test/);
      expect(runBtn).not.toBeDisabled();
    });
  });
});
