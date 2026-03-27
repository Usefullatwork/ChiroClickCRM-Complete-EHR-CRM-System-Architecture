/**
 * AIFeedbackPanel Tests
 *
 * Tests the AI feedback panel with action buttons, star rating,
 * correction field, notes, and submission flow.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  X: () => <svg data-testid="x-icon" />,
  Edit3: () => <svg data-testid="edit-icon" />,
  Star: ({ className }) => <svg data-testid="star-icon" className={className} />,
  Clock: () => <svg data-testid="clock-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
  CheckCircle2: () => <svg data-testid="check-circle-icon" />,
  Send: () => <svg data-testid="send-icon" />,
}));

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

// Mock UI components
vi.mock('../../../components/ui/Card', () => ({
  Card: ({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardBody: ({ children, className }) => (
    <div data-testid="card-body" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, icon, ...props }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/Textarea', () => ({
  Textarea: vi
    .fn()
    .mockImplementation(({ value, onChange, placeholder, ...props }) => (
      <textarea value={value} onChange={onChange} placeholder={placeholder} {...props} />
    )),
}));

// Mock AISuggestionCard
vi.mock('../../../components/ai/AISuggestionCard', () => ({
  AISuggestionCard: ({ suggestion }) => (
    <div data-testid="ai-suggestion-card">{suggestion?.suggestionText}</div>
  ),
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { AIFeedbackPanel } from '../../../components/ai/AIFeedbackPanel';

const mockSuggestion = {
  id: 'sug-1',
  encounterId: 'enc-1',
  type: 'diagnosis',
  suggestionText: 'Consider lumbar disc herniation based on positive SLR test.',
  confidenceScore: 0.85,
  contextData: { tests: ['SLR'] },
};

describe('AIFeedbackPanel', () => {
  const onSubmitFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onSubmitFeedback.mockResolvedValue({});
  });

  it('should render the panel with title and suggestion card', () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    expect(screen.getByText('AI Suggestion')).toBeDefined();
    expect(screen.getByTestId('ai-suggestion-card')).toBeDefined();
    expect(screen.getByText(mockSuggestion.suggestionText)).toBeDefined();
  });

  it('should render Accept, Edit & Accept, and Reject buttons', () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    expect(screen.getByText('Accept')).toBeDefined();
    expect(screen.getByText('Edit & Accept')).toBeDefined();
    expect(screen.getByText('Reject')).toBeDefined();
  });

  it('should show star rating after selecting an action', () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    fireEvent.click(screen.getByText('Accept'));

    expect(screen.getByText('How helpful was this suggestion?')).toBeDefined();
    // 5 star buttons
    const stars = screen.getAllByTestId('star-icon');
    expect(stars.length).toBe(5);
  });

  it('should show correction field when Edit & Accept is clicked', () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    fireEvent.click(screen.getByText('Edit & Accept'));

    expect(screen.getByText('Your correction (optional)')).toBeDefined();
    const textarea = screen.getByPlaceholderText('Write your corrected version here...');
    expect(textarea).toBeDefined();
    expect(textarea.value).toBe(mockSuggestion.suggestionText);
  });

  it('should show submit button after action + rating', () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    // Select action
    fireEvent.click(screen.getByText('Accept'));

    // Select rating (click the 4th star)
    const starButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('[data-testid="star-icon"]'));
    fireEvent.click(starButtons[3]); // 4-star rating

    expect(screen.getByText('Submit Feedback')).toBeDefined();
  });

  it('should show notes textarea after selecting action and rating', () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    fireEvent.click(screen.getByText('Reject'));

    const starButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('[data-testid="star-icon"]'));
    fireEvent.click(starButtons[0]); // 1-star rating

    expect(screen.getByText('Additional notes')).toBeDefined();
    expect(screen.getByPlaceholderText('Add comments for future improvement...')).toBeDefined();
  });

  it('should call onSubmitFeedback with correct data on submit', async () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    // Accept
    fireEvent.click(screen.getByText('Accept'));

    // Rate 5 stars
    const starButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('[data-testid="star-icon"]'));
    fireEvent.click(starButtons[4]);

    // Submit
    fireEvent.click(screen.getByText('Submit Feedback'));

    await waitFor(() => {
      expect(onSubmitFeedback).toHaveBeenCalledTimes(1);
    });

    const call = onSubmitFeedback.mock.calls[0][0];
    expect(call.suggestionId).toBe('sug-1');
    expect(call.accepted).toBe(true);
    expect(call.correctionType).toBe('accepted_as_is');
    expect(call.userRating).toBe(5);
    expect(call.userCorrection).toBeNull();
    expect(call.confidenceScore).toBe(0.85);
    expect(call.timeToDecision).toBeGreaterThan(0);
  });

  it('should show thank-you state after successful submission', async () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    fireEvent.click(screen.getByText('Accept'));

    const starButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('[data-testid="star-icon"]'));
    fireEvent.click(starButtons[2]);

    fireEvent.click(screen.getByText('Submit Feedback'));

    await waitFor(() => {
      expect(screen.getByText('Thank you for your feedback!')).toBeDefined();
    });
  });

  it('should show time tracker when showTimeTracker is true', () => {
    render(
      <AIFeedbackPanel
        suggestion={mockSuggestion}
        onSubmitFeedback={onSubmitFeedback}
        showTimeTracker={true}
      />
    );

    expect(screen.getByText(/Time spent/)).toBeDefined();
  });

  it('should hide time tracker when showTimeTracker is false', () => {
    render(
      <AIFeedbackPanel
        suggestion={mockSuggestion}
        onSubmitFeedback={onSubmitFeedback}
        showTimeTracker={false}
      />
    );

    expect(screen.queryByText(/Time spent/)).toBeNull();
  });

  it('should submit rejection feedback with correctionType rejected', async () => {
    render(<AIFeedbackPanel suggestion={mockSuggestion} onSubmitFeedback={onSubmitFeedback} />);

    fireEvent.click(screen.getByText('Reject'));

    const starButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('[data-testid="star-icon"]'));
    fireEvent.click(starButtons[0]);

    fireEvent.click(screen.getByText('Submit Feedback'));

    await waitFor(() => {
      expect(onSubmitFeedback).toHaveBeenCalledTimes(1);
    });

    const call = onSubmitFeedback.mock.calls[0][0];
    expect(call.accepted).toBe(false);
    expect(call.correctionType).toBe('rejected');
  });
});
