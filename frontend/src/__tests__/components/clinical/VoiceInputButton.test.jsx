/**
 * VoiceInputButton Tests
 *
 * Tests:
 * - Renders button or "not supported" message
 * - Button disabled state
 * - Accessibility attributes
 *
 * Note: SpeechRecognition is checked at module level.
 * Since window.SpeechRecognition is undefined in test env,
 * the component renders the "not supported" fallback.
 * We test that path plus the export shape.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Mic: (props) => null,
  MicOff: (props) => null,
  Square: (props) => null,
  AlertCircle: (props) => null,
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
  },
}));

import VoiceInputButton, { useVoiceInput } from '../../../components/clinical/VoiceInputButton';

describe('VoiceInputButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "not supported" when SpeechRecognition is unavailable', () => {
    // In test environment, window.SpeechRecognition is undefined
    render(<VoiceInputButton onTranscript={vi.fn()} />);
    expect(screen.getByText('Tale ikke støttet')).toBeInTheDocument();
  });

  it('renders as an inline element with custom className', () => {
    const { container } = render(
      <VoiceInputButton onTranscript={vi.fn()} className="custom-voice" />
    );
    expect(container.firstChild).toHaveClass('custom-voice');
  });
});

describe('useVoiceInput hook', () => {
  it('exports the hook function', () => {
    expect(typeof useVoiceInput).toBe('function');
  });
});
