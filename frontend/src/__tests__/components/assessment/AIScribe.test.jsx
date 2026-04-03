/**
 * AIScribe Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIScribeButton } from '../../../components/assessment/AIScribe';

vi.mock('../../../services/aiService', () => ({
  checkOllamaStatus: vi.fn().mockResolvedValue({ connected: false }),
  parseTranscriptionToSOAP: vi.fn().mockResolvedValue({ sections: {} }),
  createSpeechRecognition: vi.fn().mockReturnValue(null),
}));
vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

describe('AIScribeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<AIScribeButton onTranscript={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it('should render with disabled state', () => {
    const { container } = render(<AIScribeButton onTranscript={vi.fn()} disabled={true} />);
    expect(container).toBeTruthy();
  });

  it('should render with Norwegian language', () => {
    const { container } = render(<AIScribeButton onTranscript={vi.fn()} language="no" />);
    expect(container).toBeTruthy();
  });
});
