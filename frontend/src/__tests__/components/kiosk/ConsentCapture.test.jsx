/**
 * ConsentCapture Component Tests
 *
 * ConsentCapture.jsx does not exist as a standalone file.
 * CheckInConfirmation.jsx is the kiosk step closest in role
 * (confirmation + reset). These tests cover that component.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="check-circle">CheckCircle2</span>,
  Clock: () => <span>Clock</span>,
  MapPin: () => <span>MapPin</span>,
}));

import CheckInConfirmation from '../../../components/kiosk/CheckInConfirmation';

describe('CheckInConfirmation (ConsentCapture) Component', () => {
  let onReset;

  beforeEach(() => {
    onReset = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = (props = {}) =>
    render(<CheckInConfirmation onReset={onReset} lang="no" estimatedWaitMinutes={5} {...props} />);

  it('should render the Norwegian success title', () => {
    renderComponent();
    expect(screen.getByText('Innsjekking fullført!')).toBeInTheDocument();
  });

  it('should render in English when lang=en', () => {
    renderComponent({ lang: 'en' });
    expect(screen.getByText('Check-In Complete!')).toBeInTheDocument();
  });

  it('should render the waiting area message', () => {
    renderComponent();
    expect(screen.getByText('Vennligst ta plass i venterommet')).toBeInTheDocument();
  });

  it('should render the provider message', () => {
    renderComponent();
    expect(screen.getByText('Din behandler kommer snart')).toBeInTheDocument();
  });

  it('should display estimated wait minutes', () => {
    renderComponent({ estimatedWaitMinutes: 10 });
    expect(screen.getByText(/~10/)).toBeInTheDocument();
    expect(screen.getByText(/minutter/)).toBeInTheDocument();
  });

  it('should show the countdown timer text', () => {
    renderComponent();
    expect(screen.getByText(/Denne skjermen tilbakestilles om/)).toBeInTheDocument();
    expect(screen.getByText(/sekunder/)).toBeInTheDocument();
  });

  it('should render the new check-in button', () => {
    renderComponent();
    expect(screen.getByText('Ny innsjekking')).toBeInTheDocument();
  });

  it('should call onReset when new check-in button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Ny innsjekking'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('should call onReset automatically after countdown expires', () => {
    renderComponent();
    // Advance 15 one-second ticks
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(onReset).toHaveBeenCalled();
  });

  it('should render the check-circle success icon', () => {
    renderComponent();
    expect(screen.getByTestId('check-circle')).toBeInTheDocument();
  });
});
