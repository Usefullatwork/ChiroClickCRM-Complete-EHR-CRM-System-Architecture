/**
 * AIImageAnalysis Component Tests
 * Tests rendering, file selection, type selector, submit button states
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIImageAnalysis from '../AIImageAnalysis';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    language: 'no',
    lang: 'no',
  }),
}));

describe('AIImageAnalysis', () => {
  const mockOnAnalyze = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the title', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      expect(screen.getByText('Bildeanalyse')).toBeInTheDocument();
    });

    it('should render the analysis type selector', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      expect(screen.getByText('Analysetype')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should render all analysis type options', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      expect(screen.getByText('Rontgen')).toBeInTheDocument();
      expect(screen.getByText('MR')).toBeInTheDocument();
      expect(screen.getByText('Holdning')).toBeInTheDocument();
      expect(screen.getByText('Generell')).toBeInTheDocument();
    });

    it('should render drop zone when no image selected', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      expect(
        screen.getByText('Dra og slipp bilde her, eller klikk for a velge')
      ).toBeInTheDocument();
    });

    it('should have a hidden file input', () => {
      const { container } = render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.style.display).toBe('none');
    });

    it('should not show analyze button when no image', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      expect(screen.queryByText('Analyser bilde')).not.toBeInTheDocument();
    });
  });

  describe('Analysis type selection', () => {
    it('should default to general type', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      const select = screen.getByRole('combobox');
      expect(select.value).toBe('general');
    });

    it('should allow changing analysis type', async () => {
      const user = userEvent.setup();
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'xray');
      expect(select.value).toBe('xray');
    });
  });

  describe('Result display', () => {
    it('should display analysis result when available', () => {
      const result = { analysis: 'Normal cervical lordose. Ingen patologiske funn.' };
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} result={result} />);
      expect(
        screen.getByText('Normal cervical lordose. Ingen patologiske funn.')
      ).toBeInTheDocument();
    });

    it('should display disclaimer with result', () => {
      const result = { analysis: 'Some analysis text' };
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} result={result} />);
      expect(screen.getByText(/kvalifisert helsepersonell/)).toBeInTheDocument();
    });

    it('should not display result section when no result', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      expect(screen.queryByText(/kvalifisert helsepersonell/)).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show analyzing text when loading', async () => {
      // Simulate having an image selected by providing a result to indicate loading
      const { container, rerender } = render(
        <AIImageAnalysis onAnalyze={mockOnAnalyze} isLoading={false} />
      );

      // Select a file to show the analyze button
      const file = new File(['test'], 'xray.jpg', { type: 'image/jpeg' });
      const fileInput = container.querySelector('input[type="file"]');

      // Mock FileReader
      const mockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        result: 'data:image/jpeg;base64,dGVzdA==',
      };
      vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader);

      fireEvent.change(fileInput, { target: { files: [file] } });
      // Trigger the onload callback
      mockReader.onload({ target: { result: mockReader.result } });

      // Now rerender with loading
      rerender(<AIImageAnalysis onAnalyze={mockOnAnalyze} isLoading={true} />);

      expect(screen.getByText('Analyserer...')).toBeInTheDocument();
    });
  });

  describe('Drag and drop', () => {
    it('should handle dragOver event', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      const dropzone = screen
        .getByText('Dra og slipp bilde her, eller klikk for a velge')
        .closest('div');

      fireEvent.dragOver(dropzone, { preventDefault: vi.fn() });
      // The border should change color (visual only, tested by absence of errors)
    });

    it('should handle dragLeave event', () => {
      render(<AIImageAnalysis onAnalyze={mockOnAnalyze} />);
      const dropzone = screen
        .getByText('Dra og slipp bilde her, eller klikk for a velge')
        .closest('div');

      fireEvent.dragLeave(dropzone);
      // No errors expected
    });
  });
});
