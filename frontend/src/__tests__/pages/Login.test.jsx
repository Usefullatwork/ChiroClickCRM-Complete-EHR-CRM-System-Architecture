import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock API
vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    devLogin: vi.fn(),
  },
  setOrganizationId: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Mock i18n (CUSTOM useTranslation from ../../i18n, NOT react-i18next)
vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

import Login from '../../pages/Login';
import { authAPI, setOrganizationId } from '../../services/api';
import { toast } from 'sonner';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Login />);
    expect(screen.getByText('Sign in to your account')).toBeTruthy();
  });

  it('renders email and password input fields', () => {
    render(<Login />);
    expect(screen.getByTestId('login-email-input')).toBeTruthy();
    expect(screen.getByTestId('login-password-input')).toBeTruthy();
  });

  it('renders the submit button with correct text', () => {
    render(<Login />);
    const button = screen.getByTestId('login-submit-button');
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Sign in');
  });

  it('renders the ChiroClick EHR brand name', () => {
    render(<Login />);
    expect(screen.getByText('ChiroClick EHR')).toBeTruthy();
  });

  it('updates email field on user input', () => {
    render(<Login />);
    const emailInput = screen.getByTestId('login-email-input');
    fireEvent.change(emailInput, { target: { value: 'admin@test.no' } });
    expect(emailInput.value).toBe('admin@test.no');
  });

  it('updates password field on user input', () => {
    render(<Login />);
    const passwordInput = screen.getByTestId('login-password-input');
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    expect(passwordInput.value).toBe('secret123');
  });

  it('calls authAPI.login on form submission', async () => {
    authAPI.login.mockResolvedValue({
      data: { user: { organizationId: 'org-1' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'admin@chiroclickehr.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'admin123' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'admin@chiroclickehr.no',
        password: 'admin123',
      });
    });
  });

  it('shows loading state during submission', async () => {
    // Keep the login promise pending
    authAPI.login.mockReturnValue(new Promise(() => {}));

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'admin@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-submit-button').textContent).toBe('Signing in...');
      expect(screen.getByTestId('login-submit-button').disabled).toBe(true);
    });
  });

  it('navigates to home on successful login', async () => {
    authAPI.login.mockResolvedValue({
      data: { user: { organizationId: 'org-1' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'admin@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows success toast on successful login', async () => {
    authAPI.login.mockResolvedValue({
      data: { user: { organizationId: 'org-1' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'admin@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Successfully logged in');
    });
  });

  it('sets organization ID from response (camelCase)', async () => {
    authAPI.login.mockResolvedValue({
      data: { user: { organizationId: 'org-camel' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'admin@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(setOrganizationId).toHaveBeenCalledWith('org-camel');
    });
  });

  it('sets organization ID from response (snake_case fallback)', async () => {
    authAPI.login.mockResolvedValue({
      data: { user: { organization_id: 'org-snake' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'admin@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(setOrganizationId).toHaveBeenCalledWith('org-snake');
    });
  });

  it('displays error message on login failure', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'wrong@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('login-error-message');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('Invalid credentials');
    });
  });

  it('shows toast error on login failure', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'wrong@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows fallback error message when response has no message', async () => {
    authAPI.login.mockRejectedValue(new Error('Network error'));

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'admin@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('login-error-message');
      expect(errorEl.textContent).toContain('Failed to login');
    });
  });

  it('re-enables submit button after failed login', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'wrong@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-submit-button').disabled).toBe(false);
      expect(screen.getByTestId('login-submit-button').textContent).toBe('Sign in');
    });
  });

  it('does not navigate on failed login', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'wrong@test.no' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error-message')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
