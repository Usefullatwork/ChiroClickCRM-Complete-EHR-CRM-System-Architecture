/**
 * IntakeParser Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntakeParserButton } from '../../../components/assessment/IntakeParser';

vi.mock('../../../services/aiService', () => ({
  checkOllamaStatus: vi.fn().mockResolvedValue({ connected: false }),
  parseIntakeToSubjective: vi.fn().mockResolvedValue({ success: false }),
  getAIConfig: vi.fn().mockReturnValue({ model: 'test' }),
}));
vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

describe('IntakeParserButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<IntakeParserButton intakeData={{}} onGenerate={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it('should render in disabled state', () => {
    const { container } = render(
      <IntakeParserButton intakeData={{}} onGenerate={vi.fn()} disabled={true} />
    );
    expect(container).toBeTruthy();
  });

  it('should render with Norwegian language', () => {
    const { container } = render(
      <IntakeParserButton intakeData={{}} onGenerate={vi.fn()} language="no" />
    );
    expect(container).toBeTruthy();
  });
});
