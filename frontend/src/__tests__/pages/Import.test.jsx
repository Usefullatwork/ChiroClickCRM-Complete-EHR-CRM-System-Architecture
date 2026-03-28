/**
 * Import Page Tests
 * Tests for Excel upload, text parsing, and data import functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock services/api (default export = apiClient)
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  appointmentsAPI: {},
  patientsAPI: {},
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import Import from '../../pages/Import';
import apiClient from '../../services/api';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Import />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Import Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the import patients heading', () => {
    renderPage();

    expect(screen.getByText('importPatients')).toBeInTheDocument();
  });

  it('should render Excel upload tab by default', () => {
    renderPage();

    expect(screen.getByText('excelUpload')).toBeInTheDocument();
    expect(screen.getByText('needTemplate')).toBeInTheDocument();
  });

  it('should render paste text tab button', () => {
    renderPage();

    expect(screen.getByText('pasteText')).toBeInTheDocument();
  });

  it('should switch to text paste tab on click', () => {
    renderPage();

    const textTab = screen.getByRole('button', { name: /pasteText/i });
    fireEvent.click(textTab);

    expect(screen.getByText('pastePatientData')).toBeInTheDocument();
  });

  it('should render file drop zone on Excel tab', () => {
    renderPage();

    expect(screen.getByText('dropFileHere')).toBeInTheDocument();
  });

  it('should render download template button', () => {
    renderPage();

    const templateBtn = screen.getByRole('button', { name: 'downloadTemplate' });
    expect(templateBtn).toBeInTheDocument();
  });

  it('should call API to download template when button is clicked', async () => {
    // Patch URL.createObjectURL before rendering so the download function doesn't throw
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    apiClient.get.mockResolvedValue({ data: new Blob(['template']) });

    renderPage();

    const templateBtn = screen.getByRole('button', { name: 'downloadTemplate' });
    fireEvent.click(templateBtn);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/import/patients/template',
        expect.objectContaining({ responseType: 'blob' })
      );
    });
  });

  it('should render parse button disabled when text area is empty', () => {
    renderPage();

    const textTab = screen.getByRole('button', { name: /pasteText/i });
    fireEvent.click(textTab);

    const parseBtn = screen.getByRole('button', { name: 'parseData' });
    expect(parseBtn).toBeDisabled();
  });

  it('should enable parse button when text is entered', () => {
    renderPage();

    const textTab = screen.getByRole('button', { name: /pasteText/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText('pasteHere');
    fireEvent.change(textarea, { target: { value: 'Ola Nordmann\t+47 123 45 678' } });

    const parseBtn = screen.getByRole('button', { name: 'parseData' });
    expect(parseBtn).not.toBeDisabled();
  });
});
