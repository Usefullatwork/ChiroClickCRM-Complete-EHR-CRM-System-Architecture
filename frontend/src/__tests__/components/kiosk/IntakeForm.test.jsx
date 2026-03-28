/**
 * IntakeForm Component Tests
 *
 * Tests health questionnaire kiosk step: yes/no questions,
 * consent checkboxes, submit gating, and onNext/onBack callbacks.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  ArrowRight: () => <span>ArrowRight</span>,
  ArrowLeft: () => <span>ArrowLeft</span>,
  CheckSquare: () => <span data-testid="check-square">CheckSquare</span>,
  Square: () => <span data-testid="square">Square</span>,
}));

import IntakeForm from '../../../components/kiosk/IntakeForm';

describe('IntakeForm Component', () => {
  let onNext;
  let onBack;

  beforeEach(() => {
    onNext = vi.fn();
    onBack = vi.fn();
  });

  const renderForm = (props = {}) =>
    render(<IntakeForm onNext={onNext} onBack={onBack} lang="no" {...props} />);

  it('should render the Norwegian title and subtitle', () => {
    renderForm();
    expect(screen.getByText('Helseskjema')).toBeInTheDocument();
    expect(screen.getByText('Vennligst svar pa noen sporsmal om din helse')).toBeInTheDocument();
  });

  it('should render all four health questions', () => {
    renderForm();
    expect(screen.getByText('Har du noen allergier?')).toBeInTheDocument();
    expect(screen.getByText('Bruker du noen medisiner?')).toBeInTheDocument();
    expect(screen.getByText('Har du hatt noen operasjoner de siste 5 arene?')).toBeInTheDocument();
    expect(screen.getByText('Er du gravid eller kan du vaere gravid?')).toBeInTheDocument();
  });

  it('should render in English when lang=en', () => {
    renderForm({ lang: 'en' });
    expect(screen.getByText('Health Questionnaire')).toBeInTheDocument();
    expect(screen.getByText('Do you have any allergies?')).toBeInTheDocument();
  });

  it('should have submit button disabled until all questions answered and both consents checked', () => {
    renderForm();
    const submitBtn = screen.getByText('Send og fortsett').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('should enable submit button after all answers and consents are provided', () => {
    renderForm();

    // Answer all four questions — each question has Ja/Nei buttons
    const neiBtns = screen.getAllByText('Nei');

    // allergies = Nei, medications = Nei, surgeries = Nei, pregnant = Nei
    fireEvent.click(neiBtns[0]);
    fireEvent.click(neiBtns[1]);
    fireEvent.click(neiBtns[2]);
    fireEvent.click(neiBtns[3]);

    // Click both consent labels directly
    fireEvent.click(screen.getByText('Jeg samtykker til kiropraktisk undersokelse og behandling'));
    fireEvent.click(screen.getByText('Jeg har lest og aksepterer personvernerkleringen'));

    const submitBtn = screen.getByText('Send og fortsett').closest('button');
    expect(submitBtn).not.toBeDisabled();
  });

  it('should show detail textarea when Yes is selected for allergies', () => {
    renderForm();
    const jaBtns = screen.getAllByText('Ja');
    fireEvent.click(jaBtns[0]); // allergies = Yes
    expect(screen.getByPlaceholderText('Vennligst spesifiser...')).toBeInTheDocument();
  });

  it('should call onBack when Back button is clicked', () => {
    renderForm();
    fireEvent.click(screen.getByText('Tilbake'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should call onNext with form data including healthHistory and consent fields', () => {
    renderForm();

    const neiBtns = screen.getAllByText('Nei');
    fireEvent.click(neiBtns[0]);
    fireEvent.click(neiBtns[1]);
    fireEvent.click(neiBtns[2]);
    fireEvent.click(neiBtns[3]);

    fireEvent.click(screen.getByText('Jeg samtykker til kiropraktisk undersokelse og behandling'));
    fireEvent.click(screen.getByText('Jeg har lest og aksepterer personvernerkleringen'));

    fireEvent.click(screen.getByText('Send og fortsett'));

    expect(onNext).toHaveBeenCalledTimes(1);
    const arg = onNext.mock.calls[0][0];
    expect(arg).toHaveProperty('healthHistory');
    expect(arg).toHaveProperty('consentExam', true);
    expect(arg).toHaveProperty('consentPrivacy', true);
    expect(arg).toHaveProperty('completedAt');
  });

  it('should not call onNext when submit is disabled', () => {
    renderForm();
    // Only answer two questions — not enough to enable submit
    const neiBtns = screen.getAllByText('Nei');
    fireEvent.click(neiBtns[0]);
    fireEvent.click(neiBtns[1]);

    const submitBtn = screen.getByText('Send og fortsett').closest('button');
    expect(submitBtn).toBeDisabled();
    fireEvent.click(submitBtn);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('should render consent text labels', () => {
    renderForm();
    expect(
      screen.getByText('Jeg samtykker til kiropraktisk undersokelse og behandling')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Jeg har lest og aksepterer personvernerkleringen')
    ).toBeInTheDocument();
  });
});
