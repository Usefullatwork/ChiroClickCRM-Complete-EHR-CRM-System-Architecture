/**
 * CSVColumnMapper Component Tests
 *
 * Tests rendering, file upload, auto-detection of column mappings,
 * mapping changes, required field validation, and apply callback.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} data-testid={props['data-testid']}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/Card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardBody: ({ children }) => <div data-testid="card-body">{children}</div>,
}));

vi.mock('../../../components/ui/Alert', () => ({
  Alert: ({ children, title }) => (
    <div data-testid="alert" role="alert">
      {title && <strong>{title}</strong>}
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/Input', () => ({
  Input: (props) => <input data-testid="input" {...props} />,
}));

vi.mock('../../../components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title }) =>
    isOpen ? (
      <div data-testid="modal">
        {title && <h2>{title}</h2>}
        {children}
      </div>
    ) : null,
}));

vi.mock('lucide-react', () => ({
  Upload: (props) => <span data-testid="icon-upload" {...props} />,
  FileSpreadsheet: (props) => <span data-testid="icon-spreadsheet" {...props} />,
  ArrowRight: (props) => <span data-testid="icon-arrowright" {...props} />,
  Check: (props) => <span data-testid="icon-check" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  AlertTriangle: (props) => <span data-testid="icon-alert" {...props} />,
  Save: (props) => <span data-testid="icon-save" {...props} />,
  FolderOpen: (props) => <span data-testid="icon-folder" {...props} />,
  RefreshCw: (props) => <span data-testid="icon-refresh" {...props} />,
  GripVertical: (props) => <span data-testid="icon-grip" {...props} />,
  Trash2: (props) => <span data-testid="icon-trash" {...props} />,
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
  CheckCircle2: (props) => <span data-testid="icon-checkcircle" {...props} />,
}));

import CSVColumnMapper, { PATIENT_FIELDS } from '../../../components/import/CSVColumnMapper';

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <CSVColumnMapper onMappingComplete={vi.fn()} onCancel={vi.fn()} {...props} />
    </BrowserRouter>
  );
};

// Helper to simulate file upload via FileReader
const createCSVFile = (content, name = 'test.csv') => {
  return new File([content], name, { type: 'text/csv' });
};

describe('CSVColumnMapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the title and subtitle', () => {
    renderComponent();
    expect(screen.getByText('CSV Kolonnekartlegger')).toBeInTheDocument();
    expect(screen.getByText('Koble CSV-kolonner til pasientfelt')).toBeInTheDocument();
  });

  it('renders the file upload area when no file is loaded', () => {
    renderComponent();
    expect(screen.getByText('Slipp CSV-fil her eller klikk for å bla')).toBeInTheDocument();
    expect(
      screen.getByText('Støtter .csv-filer med komma, semikolon eller tab-separatorer')
    ).toBeInTheDocument();
  });

  it('renders Load Template button', () => {
    renderComponent();
    expect(screen.getByText('Last Mal')).toBeInTheDocument();
  });

  it('exports PATIENT_FIELDS with required and optional fields', () => {
    expect(PATIENT_FIELDS).toBeDefined();
    expect(Array.isArray(PATIENT_FIELDS)).toBe(true);

    const requiredFields = PATIENT_FIELDS.filter((f) => f.required);
    expect(requiredFields.length).toBeGreaterThanOrEqual(2); // first_name, last_name
    expect(requiredFields.map((f) => f.field)).toContain('first_name');
    expect(requiredFields.map((f) => f.field)).toContain('last_name');
  });

  it('parses CSV file and shows data preview after upload', async () => {
    renderComponent();

    const csvContent =
      'first_name,last_name,email\nOla,Nordmann,ola@test.no\nKari,Hansen,kari@test.no';
    const file = createCSVFile(csvContent);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    // Simulate file selection
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    // Wait for FileReader to process
    await waitFor(() => {
      // After parsing, the file name should be shown
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
  });

  it('auto-detects column mappings from standard header names', async () => {
    renderComponent();

    const csvContent = 'fornavn,etternavn,epost,mobil\nOla,Nordmann,ola@test.no,99887766';
    const file = createCSVFile(csvContent);

    const fileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    // After auto-detection, mapped columns show their target field labels
    // in multiple places (preview header badge, column list, patient fields panel).
    // Use getAllByText since each mapped label appears multiple times.
    expect(screen.getAllByText('Fornavn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Etternavn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('E-post').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onMappingComplete when apply button is clicked', async () => {
    const onMappingComplete = vi.fn();
    renderComponent({ onMappingComplete });

    const csvContent = 'first_name,last_name,email\nOla,Nordmann,ola@test.no';
    const file = createCSVFile(csvContent);

    const fileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    // Find and click the apply button
    const applyButton = screen.getByText('Bruk Kobling');
    fireEvent.click(applyButton);

    expect(onMappingComplete).toHaveBeenCalledTimes(1);
    expect(onMappingComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        mappings: expect.any(Object),
        data: expect.any(Array),
        validation: expect.any(Object),
      })
    );
  });

  it('rejects non-CSV files with an error message', async () => {
    renderComponent();

    const file = new File(['not csv content'], 'data.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Ugyldig filformat')).toBeInTheDocument();
    });
  });
});
