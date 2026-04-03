/**
 * TemplateVariableModal Tests
 *
 * Tests:
 * - Modal renders with variables
 * - Variable inputs
 * - Insert (confirm) action
 * - Cancel action
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  X: (props) => null,
}));

// Mock the Modal component
vi.mock('../../../components/ui/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children, size }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    );
  },
}));

import TemplateVariableModal from '../../../components/clinical/TemplateVariableModal';

describe('TemplateVariableModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    variables: ['patient_name', 'diagnosis_code', 'treatment_date'],
    content: 'Pasient: {{patient_name}}, Diagnose: {{diagnosis_code}}, Dato: {{treatment_date}}',
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<TemplateVariableModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders the modal with title', () => {
    render(<TemplateVariableModal {...defaultProps} />);
    expect(screen.getByText('Fyll inn variabler')).toBeInTheDocument();
  });

  it('renders input fields for each variable', () => {
    render(<TemplateVariableModal {...defaultProps} />);
    expect(screen.getByLabelText('patient name')).toBeInTheDocument();
    expect(screen.getByLabelText('diagnosis code')).toBeInTheDocument();
    expect(screen.getByLabelText('treatment date')).toBeInTheDocument();
  });

  it('renders placeholder text for each input', () => {
    render(<TemplateVariableModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Skriv inn patient name...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Skriv inn diagnosis code...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Skriv inn treatment date...')).toBeInTheDocument();
  });

  it('renders Avbryt (cancel) and Sett inn (insert) buttons', () => {
    render(<TemplateVariableModal {...defaultProps} />);
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
    expect(screen.getByText('Sett inn')).toBeInTheDocument();
  });

  it('calls onClose when Avbryt is clicked', () => {
    render(<TemplateVariableModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Avbryt'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onConfirm with substituted content when Sett inn is clicked', () => {
    render(<TemplateVariableModal {...defaultProps} />);

    // Fill in values
    fireEvent.change(screen.getByLabelText('patient name'), {
      target: { value: 'Ola Nordmann' },
    });
    fireEvent.change(screen.getByLabelText('diagnosis code'), {
      target: { value: 'L84' },
    });
    fireEvent.change(screen.getByLabelText('treatment date'), {
      target: { value: '02.03.2026' },
    });

    fireEvent.click(screen.getByText('Sett inn'));

    expect(defaultProps.onConfirm).toHaveBeenCalledWith(
      'Pasient: Ola Nordmann, Diagnose: L84, Dato: 02.03.2026'
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('keeps template placeholder when value is empty', () => {
    render(<TemplateVariableModal {...defaultProps} />);

    // Only fill in patient_name, leave others empty
    fireEvent.change(screen.getByLabelText('patient name'), {
      target: { value: 'Test' },
    });

    fireEvent.click(screen.getByText('Sett inn'));

    expect(defaultProps.onConfirm).toHaveBeenCalledWith(
      'Pasient: Test, Diagnose: {{diagnosis_code}}, Dato: {{treatment_date}}'
    );
  });
});
