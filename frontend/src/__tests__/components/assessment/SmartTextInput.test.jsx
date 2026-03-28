/**
 * SmartTextInput Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock InlineAIButton to avoid its API_URL dependency
vi.mock('../../../components/assessment/InlineAIButton', () => ({
  default: ({ onTextGenerated, disabled }) => (
    <button
      data-testid="inline-ai-button"
      disabled={disabled}
      onClick={() => onTextGenerated('AI generated text')}
    >
      AI
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
}));

import SmartTextInput, {
  CHIEF_COMPLAINT_PHRASES,
  ONSET_PHRASES,
} from '../../../components/assessment/SmartTextInput';

describe('SmartTextInput', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a textarea', () => {
    render(<SmartTextInput value="" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('should render a label when provided', () => {
    render(<SmartTextInput label="Chief Complaint" value="" onChange={onChange} />);
    expect(screen.getByText('Chief Complaint')).toBeDefined();
  });

  it('should mark required fields with an asterisk', () => {
    render(<SmartTextInput label="Chief Complaint" value="" onChange={onChange} required={true} />);
    expect(screen.getByText('*')).toBeDefined();
  });

  it('should call onChange when text is typed', () => {
    render(<SmartTextInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Lower back pain' } });
    expect(onChange).toHaveBeenCalledWith('Lower back pain');
  });

  it('should show quick phrase chips when quickPhrases prop is provided', () => {
    const phrases = [
      { label: 'Lower back pain', text: 'Lower back pain' },
      { label: 'Neck pain', text: 'Neck pain' },
    ];
    render(<SmartTextInput value="" onChange={onChange} quickPhrases={phrases} />);
    expect(screen.getByText('Lower back pain')).toBeDefined();
    expect(screen.getByText('Neck pain')).toBeDefined();
  });

  it('should call onChange with phrase text when a quick phrase chip is clicked', () => {
    const phrases = [{ label: 'Lower back pain', text: 'Lower back pain' }];
    render(<SmartTextInput value="" onChange={onChange} quickPhrases={phrases} />);
    fireEvent.click(screen.getByText('Lower back pain'));
    expect(onChange).toHaveBeenCalledWith('Lower back pain');
  });

  it('should show clear button when value is non-empty', () => {
    render(<SmartTextInput value="some text" onChange={onChange} />);
    expect(screen.getByTestId('x-icon')).toBeDefined();
  });

  it('should NOT show clear button when value is empty', () => {
    render(<SmartTextInput value="" onChange={onChange} />);
    expect(screen.queryByTestId('x-icon')).toBeNull();
  });

  it('should call onChange with empty string when clear button is clicked', () => {
    render(<SmartTextInput value="existing text" onChange={onChange} />);
    // The clear button wraps the X icon
    const clearBtn = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should render the AI button when aiEnabled and aiFieldType are provided', () => {
    render(
      <SmartTextInput
        label="Subjective"
        value=""
        onChange={onChange}
        aiEnabled={true}
        aiFieldType="subjective"
      />
    );
    expect(screen.getByTestId('inline-ai-button')).toBeDefined();
  });

  it('should append AI-generated text to existing value', () => {
    render(
      <SmartTextInput
        label="Subjective"
        value="Existing note. "
        onChange={onChange}
        aiEnabled={true}
        aiFieldType="subjective"
      />
    );
    fireEvent.click(screen.getByTestId('inline-ai-button'));
    expect(onChange).toHaveBeenCalledWith('Existing note. AI generated text');
  });

  it('should show "more" dropdown button when quickPhrases has more than 6 items', () => {
    const manyPhrases = Array.from({ length: 10 }, (_, i) => ({
      label: `Phrase ${i + 1}`,
      text: `phrase text ${i + 1}`,
    }));
    render(<SmartTextInput value="" onChange={onChange} quickPhrases={manyPhrases} />);
    expect(screen.getByText('+4 more')).toBeDefined();
  });
});

describe('SmartTextInput exported phrase constants', () => {
  it('should export CHIEF_COMPLAINT_PHRASES with at least 5 entries', () => {
    expect(CHIEF_COMPLAINT_PHRASES.length).toBeGreaterThanOrEqual(5);
    expect(CHIEF_COMPLAINT_PHRASES[0]).toHaveProperty('label');
    expect(CHIEF_COMPLAINT_PHRASES[0]).toHaveProperty('text');
  });

  it('should export ONSET_PHRASES with at least 5 entries', () => {
    expect(ONSET_PHRASES.length).toBeGreaterThanOrEqual(5);
  });
});
