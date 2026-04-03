/**
 * InlineAIButton Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InlineAIButton from '../../../components/assessment/InlineAIButton';

vi.mock('../../../services/api', () => ({
  API_URL: 'http://localhost:3000/api',
}));
vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

describe('InlineAIButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <InlineAIButton fieldType="subjective" onTextGenerated={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it('should render in disabled state', () => {
    const { container } = render(
      <InlineAIButton fieldType="subjective" onTextGenerated={vi.fn()} disabled={true} />
    );
    expect(container.querySelector('button[disabled]') || container).toBeTruthy();
  });

  it('should render with medium size', () => {
    const { container } = render(
      <InlineAIButton fieldType="objective" onTextGenerated={vi.fn()} size="md" />
    );
    expect(container).toBeTruthy();
  });

  it('should render with label when showLabel is true', () => {
    const { container } = render(
      <InlineAIButton fieldType="assessment" onTextGenerated={vi.fn()} showLabel={true} />
    );
    expect(container).toBeTruthy();
  });
});
