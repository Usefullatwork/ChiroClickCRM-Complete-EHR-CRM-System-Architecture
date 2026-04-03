/**
 * InviteUserModal Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InviteUserModal from '../../../components/settings/InviteUserModal';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('InviteUserModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    t: (key, fallback) => {
      const translations = {
        inviteUser: 'Inviter bruker',
        emailRequired: 'E-post er påkrevd',
        invalidEmail: 'Ugyldig e-postadresse',
        emailNotifications: 'E-post',
        role: 'Rolle',
        cancel: 'Avbryt',
      };
      return translations[key] || fallback || key;
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // OPEN / CLOSE
  // =========================================================================

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<InviteUserModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render modal when isOpen is true', () => {
    render(<InviteUserModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // =========================================================================
  // CONTENT
  // =========================================================================

  it('should display invite user title', () => {
    render(<InviteUserModal {...defaultProps} />);
    expect(screen.getByText('Inviter bruker')).toBeInTheDocument();
  });

  it('should render email input', () => {
    render(<InviteUserModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('bruker@eksempel.no');
    expect(emailInput).toBeInTheDocument();
  });

  it('should render role select with all roles', () => {
    render(<InviteUserModal {...defaultProps} />);
    const options = screen.getAllByRole('option');
    const roleValues = options.map((o) => o.value);
    expect(roleValues).toContain('PRACTITIONER');
    expect(roleValues).toContain('ADMIN');
    expect(roleValues).toContain('RECEPTIONIST');
  });

  // =========================================================================
  // FORM SUBMISSION
  // =========================================================================

  it('should call onSubmit with email and role on valid submit', () => {
    render(<InviteUserModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('bruker@eksempel.no');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form);
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      role: 'PRACTITIONER',
    });
  });

  it('should show error when email is empty on submit', () => {
    render(<InviteUserModal {...defaultProps} />);
    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form);
    expect(screen.getByText('E-post er påkrevd')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should show error for invalid email', () => {
    render(<InviteUserModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('bruker@eksempel.no');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form);
    expect(screen.getByText('Ugyldig e-postadresse')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should clear error when email is changed', () => {
    render(<InviteUserModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('bruker@eksempel.no');
    // Submit empty to trigger error
    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form);
    expect(screen.getByText('E-post er påkrevd')).toBeInTheDocument();
    // Type in a value
    fireEvent.change(emailInput, { target: { value: 'a' } });
    expect(screen.queryByText('E-post er påkrevd')).not.toBeInTheDocument();
  });

  // =========================================================================
  // ROLE SELECTION
  // =========================================================================

  it('should submit with selected role', () => {
    render(<InviteUserModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('bruker@eksempel.no');
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'ADMIN' } });
    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form);
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      email: 'admin@test.com',
      role: 'ADMIN',
    });
  });

  // =========================================================================
  // CLOSE BUTTON
  // =========================================================================

  it('should call onClose when close button is clicked', () => {
    render(<InviteUserModal {...defaultProps} />);
    const closeBtn = screen.getByText('Avbryt');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  it('should disable submit button when isLoading', () => {
    render(<InviteUserModal {...defaultProps} isLoading={true} />);
    const submitBtn = screen.getAllByRole('button').find((btn) => btn.type === 'submit');
    expect(submitBtn).toBeDisabled();
  });

  // =========================================================================
  // ACCESSIBILITY
  // =========================================================================

  it('should have aria-modal attribute', () => {
    render(<InviteUserModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-labelledby', () => {
    render(<InviteUserModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
