/**
 * AISettings Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AISettings from '../../../components/assessment/AISettings';

vi.mock('../../../services/aiService', () => ({
  getAIConfig: vi.fn().mockReturnValue({
    baseUrl: 'http://localhost:11434',
    model: 'test-model',
    temperature: 0.7,
    maxTokens: 512,
  }),
  saveAIConfig: vi.fn(),
  checkOllamaStatus: vi.fn().mockResolvedValue({ connected: false, models: [] }),
  generateText: vi.fn().mockResolvedValue({ text: 'test' }),
}));

describe('AISettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<AISettings />);
    expect(container).toBeTruthy();
  });

  it('should render with English language', () => {
    const { container } = render(<AISettings language="en" />);
    expect(container).toBeTruthy();
  });

  it('should accept an onClose callback', () => {
    const mockClose = vi.fn();
    const { container } = render(<AISettings onClose={mockClose} />);
    expect(container).toBeTruthy();
  });
});
