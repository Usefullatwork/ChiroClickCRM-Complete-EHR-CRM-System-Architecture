import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock api module
vi.mock('../../services/api', () => ({
  getApiBaseUrl: () => 'http://localhost:3000',
}));

import Setup from '../../pages/Setup';

describe('Setup Wizard', () => {
  let onComplete;

  beforeEach(() => {
    onComplete = vi.fn();
    global.fetch = vi.fn();
  });

  const renderSetup = () => render(<Setup onComplete={onComplete} />);

  // ===========================================================================
  // STEP NAVIGATION
  // ===========================================================================

  it('should render the welcome step initially', () => {
    renderSetup();
    expect(screen.getByText('ChiroClickCRM')).toBeInTheDocument();
    expect(screen.getByText(/Velkommen til ditt nye journalsystem/)).toBeInTheDocument();
  });

  it('should navigate through all 5 steps', () => {
    renderSetup();

    // Step 0: Welcome → Neste
    fireEvent.click(screen.getByText('Neste'));

    // Step 1: Klinikk
    expect(screen.getByText('Klinikkinformasjon')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Min Kiropraktorklinikk'), {
      target: { value: 'Test Klinikk' },
    });
    fireEvent.click(screen.getByText('Neste'));

    // Step 2: Brukerkonto
    expect(screen.getByText('Din brukerkonto')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Ola Nordmann'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('ola@klinikken.no'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minst 8 tegn'), {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(screen.getByText('Neste'));

    // Step 3: AI
    expect(screen.getByText('AI-assistent')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Neste'));

    // Step 4: Done
    expect(screen.getByText('Alt klart!')).toBeInTheDocument();
    expect(screen.getByText('Start ChiroClickCRM')).toBeInTheDocument();
  });

  it('should navigate back with Tilbake button', () => {
    renderSetup();

    // Go to step 1
    fireEvent.click(screen.getByText('Neste'));
    expect(screen.getByText('Klinikkinformasjon')).toBeInTheDocument();

    // Go back
    fireEvent.click(screen.getByText('Tilbake'));
    expect(screen.getByText(/Velkommen til ditt nye journalsystem/)).toBeInTheDocument();
  });

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  it('should validate required clinic name on step 1', () => {
    renderSetup();

    // Go to step 1
    fireEvent.click(screen.getByText('Neste'));

    // Try to advance without clinic name
    fireEvent.click(screen.getByText('Neste'));
    expect(screen.getByText('Klinikknavn er påkrevd')).toBeInTheDocument();

    // Should still be on step 1
    expect(screen.getByText('Klinikkinformasjon')).toBeInTheDocument();
  });

  it('should validate required user fields on step 2', () => {
    renderSetup();

    // Navigate to step 2
    fireEvent.click(screen.getByText('Neste')); // → step 1
    fireEvent.change(screen.getByPlaceholderText('Min Kiropraktorklinikk'), {
      target: { value: 'Test Klinikk' },
    });
    fireEvent.click(screen.getByText('Neste')); // → step 2

    // Try to advance without user fields
    fireEvent.click(screen.getByText('Neste'));

    expect(screen.getByText('Navn er påkrevd')).toBeInTheDocument();
    expect(screen.getByText('E-post er påkrevd')).toBeInTheDocument();
    expect(screen.getByText('Passord er påkrevd')).toBeInTheDocument();
  });

  it('should validate email format on step 2', () => {
    renderSetup();

    // Navigate to step 2
    fireEvent.click(screen.getByText('Neste'));
    fireEvent.change(screen.getByPlaceholderText('Min Kiropraktorklinikk'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Neste'));

    // Fill invalid email
    fireEvent.change(screen.getByPlaceholderText('Ola Nordmann'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('ola@klinikken.no'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minst 8 tegn'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByText('Neste'));

    expect(screen.getByText('Ugyldig e-postadresse')).toBeInTheDocument();
  });

  it('should validate password length on step 2', () => {
    renderSetup();

    // Navigate to step 2
    fireEvent.click(screen.getByText('Neste'));
    fireEvent.change(screen.getByPlaceholderText('Min Kiropraktorklinikk'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Neste'));

    // Fill short password
    fireEvent.change(screen.getByPlaceholderText('Ola Nordmann'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('ola@klinikken.no'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minst 8 tegn'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByText('Neste'));

    expect(screen.getByText('Passord må være minst 8 tegn')).toBeInTheDocument();
  });

  // ===========================================================================
  // SUBMIT
  // ===========================================================================

  it('should call onComplete after successful setup', async () => {
    // First mock: Ollama status check (triggered when entering AI step)
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // Second mock: actual setup POST
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Setup completed', user: {} }),
    });

    renderSetup();

    // Navigate through all steps with valid data
    fireEvent.click(screen.getByText('Neste')); // → step 1
    fireEvent.change(screen.getByPlaceholderText('Min Kiropraktorklinikk'), {
      target: { value: 'Test Klinikk' },
    });
    fireEvent.click(screen.getByText('Neste')); // → step 2
    fireEvent.change(screen.getByPlaceholderText('Ola Nordmann'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('ola@klinikken.no'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minst 8 tegn'), {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(screen.getByText('Neste')); // → step 3
    fireEvent.click(screen.getByText('Neste')); // → step 4

    // Submit
    fireEvent.click(screen.getByText('Start ChiroClickCRM'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    // Verify the fetch was called with correct URL and data
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/setup',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
  });

  it('should show error on failed submission', async () => {
    // First mock: Ollama status check (triggered when entering AI step)
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // Second mock: setup POST that fails
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Password too weak' }),
    });

    renderSetup();

    // Navigate through all steps
    fireEvent.click(screen.getByText('Neste'));
    fireEvent.change(screen.getByPlaceholderText('Min Kiropraktorklinikk'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Neste'));
    fireEvent.change(screen.getByPlaceholderText('Ola Nordmann'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('ola@klinikken.no'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minst 8 tegn'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByText('Neste'));
    fireEvent.click(screen.getByText('Neste'));

    // Submit
    fireEvent.click(screen.getByText('Start ChiroClickCRM'));

    await waitFor(() => {
      expect(screen.getByText('Password too weak')).toBeInTheDocument();
    });

    // onComplete should NOT have been called
    expect(onComplete).not.toHaveBeenCalled();
  });

  // ===========================================================================
  // SKIP
  // ===========================================================================

  it('should call skip endpoint and complete when skip is clicked', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });

    renderSetup();

    // Skip button is on step 0
    fireEvent.click(screen.getByText('Hopp over oppsett'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/skip-setup',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      );
      expect(onComplete).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // AI MODELS
  // ===========================================================================

  it('should show updated model names on AI step', () => {
    // Mock Ollama status check
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    renderSetup();

    // Navigate to AI step
    fireEvent.click(screen.getByText('Neste')); // → step 1
    fireEvent.change(screen.getByPlaceholderText('Min Kiropraktorklinikk'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Neste')); // → step 2
    fireEvent.change(screen.getByPlaceholderText('Ola Nordmann'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('ola@klinikken.no'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minst 8 tegn'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByText('Neste')); // → step 3

    // Should show current model names
    expect(screen.getByText(/chiro-no-sft-dpo-v6/)).toBeInTheDocument();
    expect(screen.getByText(/chiro-fast/)).toBeInTheDocument();
    expect(screen.getByText(/chiro-medical/)).toBeInTheDocument();
  });
});
