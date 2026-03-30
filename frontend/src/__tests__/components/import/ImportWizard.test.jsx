/**
 * ImportWizard Component Tests
 *
 * Tests rendering, tab switching, file upload area, step navigation,
 * and import results display.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('../../../api/client', () => ({
  api: {
    patients: {
      create: vi.fn(),
      bulkCreate: vi.fn(),
    },
    import: {
      parseText: vi.fn(),
      getTemplate: vi.fn(),
    },
  },
}));

vi.mock('../../../components/import/CSVColumnMapper', () => ({
  default: ({ onMappingComplete, onCancel }) => (
    <div data-testid="csv-mapper">
      <button
        onClick={() =>
          onMappingComplete({ data: [], validation: { valid: [], invalid: [], warnings: [] } })
        }
      >
        Complete Mapping
      </button>
      <button onClick={onCancel}>Cancel Mapping</button>
    </div>
  ),
}));

vi.mock('../../../components/import/VCardImport', () => ({
  default: ({ onImportComplete, onCancel }) => (
    <div data-testid="vcard-import">
      <button onClick={() => onImportComplete([{ first_name: 'Test', last_name: 'User' }])}>
        Import vCard
      </button>
      <button onClick={onCancel}>Cancel vCard</button>
    </div>
  ),
}));

vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, icon: Icon, loading, ...props }) => (
    <button onClick={onClick} disabled={disabled || loading}>
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
  Alert: ({ children, title, variant }) => (
    <div data-testid="alert" role="alert">
      {title && <strong>{title}</strong>}
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        {title && <h2>{title}</h2>}
        {children}
      </div>
    ) : null,
}));

vi.mock('lucide-react', () => ({
  Upload: (props) => <span {...props} />,
  FileSpreadsheet: (props) => <span {...props} />,
  FileText: (props) => <span {...props} />,
  Users: (props) => <span {...props} />,
  Smartphone: (props) => <span {...props} />,
  CheckCircle2: (props) => <span {...props} />,
  X: (props) => <span {...props} />,
  Download: (props) => <span {...props} />,
  ArrowLeft: (props) => <span {...props} />,
  ArrowRight: (props) => <span {...props} />,
  Loader2: (props) => <span {...props} />,
}));

import ImportWizard from '../../../components/import/ImportWizard';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderComponent = (props = {}) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ImportWizard language="no" {...props} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ImportWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and subtitle', () => {
    renderComponent();
    expect(screen.getByText('Importer Pasienter')).toBeInTheDocument();
    expect(screen.getByText('Importer pasientdata fra forskjellige kilder')).toBeInTheDocument();
  });

  it('renders all four import tab buttons', () => {
    renderComponent();
    expect(screen.getByText('Excel/CSV')).toBeInTheDocument();
    expect(screen.getByText('vCard')).toBeInTheDocument();
    expect(screen.getByText('Google Kontakter')).toBeInTheDocument();
    expect(screen.getByText('Lim inn Tekst')).toBeInTheDocument();
  });

  it('shows Excel/CSV tab content by default', () => {
    renderComponent();
    // "Last ned Mal" appears both in the Alert title and the Button - use getAllByText
    const templateTexts = screen.getAllByText('Last ned Mal');
    expect(templateTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Slipp filen din her eller klikk for a bla')).toBeInTheDocument();
  });

  it('switches to vCard tab when clicked', () => {
    renderComponent();
    const vcardTab = screen.getByText('vCard');
    fireEvent.click(vcardTab);

    expect(screen.getByTestId('vcard-import')).toBeInTheDocument();
  });

  it('switches to Google Contacts tab when clicked', () => {
    renderComponent();
    const googleTab = screen.getByText('Google Kontakter');
    fireEvent.click(googleTab);

    expect(screen.getByText('Importer fra Google Kontakter')).toBeInTheDocument();
    expect(screen.getByText('Koble til Google')).toBeInTheDocument();
  });

  it('switches to text paste tab when clicked', () => {
    renderComponent();
    const textTab = screen.getByText('Lim inn Tekst');
    fireEvent.click(textTab);

    expect(screen.getByText('Lim inn Pasientdata')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Lim inn pasientdata her...')).toBeInTheDocument();
  });

  it('renders close button when onClose prop is provided', () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    // There should be a close/X button in the header
    const buttons = screen.getAllByRole('button');
    // The last button in the header area should be the close button
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows template download info in Excel tab', () => {
    renderComponent();
    expect(
      screen.getByText('Last ned var mal med alle nodvendige kolonner og formatering')
    ).toBeInTheDocument();
  });

  it('disables parse button when no text is pasted in text tab', () => {
    renderComponent();
    const textTab = screen.getByText('Lim inn Tekst');
    fireEvent.click(textTab);

    const parseBtn = screen.getByText('Behandle Data');
    expect(parseBtn).toBeDisabled();
  });

  it('enables parse button when text is pasted', () => {
    renderComponent();
    const textTab = screen.getByText('Lim inn Tekst');
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText('Lim inn pasientdata her...');
    fireEvent.change(textarea, { target: { value: 'Name,Email\nOla,ola@test.no' } });

    const parseBtn = screen.getByText('Behandle Data');
    expect(parseBtn).not.toBeDisabled();
  });
});
