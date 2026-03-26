/**
 * ChiefComplaint Component Tests
 *
 * Tests ChiefComplaintCapture: complaint selection, multi-select,
 * custom text, narrative generation, and navigation callbacks.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
  MessageSquare: () => <span>MessageSquare</span>,
}));

import ChiefComplaintCapture from '../../../components/kiosk/ChiefComplaintCapture';

describe('ChiefComplaintCapture Component', () => {
  let onNext;
  let onBack;

  beforeEach(() => {
    onNext = vi.fn();
    onBack = vi.fn();
  });

  const renderComponent = (props = {}) =>
    render(<ChiefComplaintCapture onNext={onNext} onBack={onBack} lang="no" {...props} />);

  it('should render the Norwegian title', () => {
    renderComponent();
    expect(screen.getByText('Hva er grunnen til besøket?')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    renderComponent();
    expect(screen.getByText('Velg alle som passer')).toBeInTheDocument();
  });

  it('should render in English when lang=en', () => {
    renderComponent({ lang: 'en' });
    expect(screen.getByText('What brings you in today?')).toBeInTheDocument();
    expect(screen.getByText('Select all that apply')).toBeInTheDocument();
  });

  it('should render common complaint buttons', () => {
    renderComponent();
    expect(screen.getByText('Korsryggssmerter')).toBeInTheDocument();
    expect(screen.getByText('Nakkesmerter/stivhet')).toBeInTheDocument();
    expect(screen.getByText('Hodepine')).toBeInTheDocument();
    expect(screen.getByText('Skuldersmerter')).toBeInTheDocument();
  });

  const getContinueBtn = () =>
    screen
      .getAllByRole('button')
      .find((b) => b.className.includes('bg-teal-600') && !b.className.includes('p-4'));

  it('should have the continue button disabled when nothing is selected', () => {
    renderComponent();
    expect(getContinueBtn()).toBeDisabled();
  });

  it('should enable continue button after selecting a complaint', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Korsryggssmerter'));
    expect(getContinueBtn()).not.toBeDisabled();
  });

  it('should support multi-select: two complaints can be selected simultaneously', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Korsryggssmerter'));
    fireEvent.click(screen.getByText('Hodepine'));
    fireEvent.click(getContinueBtn());

    expect(onNext).toHaveBeenCalledTimes(1);
    const arg = onNext.mock.calls[0][0];
    expect(arg.complaintCategories).toContain('low_back');
    expect(arg.complaintCategories).toContain('headache');
  });

  it('should toggle a complaint off when clicked twice', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Korsryggssmerter'));
    fireEvent.click(screen.getByText('Korsryggssmerter')); // deselect
    expect(getContinueBtn()).toBeDisabled();
  });

  it('should show custom text area when "Annet..." is selected', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Annet...'));
    expect(screen.getByPlaceholderText('Beskriv ditt problem...')).toBeInTheDocument();
  });

  it('should include custom text in narrative when onNext is called', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Annet...'));
    const textarea = screen.getByPlaceholderText('Beskriv ditt problem...');
    fireEvent.change(textarea, { target: { value: 'Vondt i tå' } });
    fireEvent.click(getContinueBtn());

    expect(onNext).toHaveBeenCalledTimes(1);
    const arg = onNext.mock.calls[0][0];
    expect(arg.chiefComplaint).toBe('Vondt i tå');
    expect(arg.narrative).toContain('Vondt i tå');
  });

  it('should call onBack when back button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Tilbake'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should generate Norwegian narrative from selected complaint labels', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Korsryggssmerter'));
    fireEvent.click(getContinueBtn());

    const arg = onNext.mock.calls[0][0];
    expect(arg.narrative).toContain('Korsryggssmerter');
    expect(arg.narrative).toMatch(/Pasient kommer inn for/);
  });
});
