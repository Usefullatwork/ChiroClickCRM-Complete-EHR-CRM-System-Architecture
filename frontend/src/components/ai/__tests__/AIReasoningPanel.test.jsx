/**
 * AIReasoningPanel Component Tests
 * Tests rendering, loading state, reasoning toggle, bilingual labels
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIReasoningPanel from '../AIReasoningPanel';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    language: 'no',
    lang: 'no',
  }),
}));

describe('AIReasoningPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when no data and not loading', () => {
      const { container } = render(<AIReasoningPanel />);
      expect(container.querySelector('.ai-reasoning-panel')).toBeNull();
    });

    it('should display loading state', () => {
      render(<AIReasoningPanel isLoading={true} />);
      expect(screen.getByText('Analyserer...')).toBeInTheDocument();
    });

    it('should display answer text', () => {
      render(<AIReasoningPanel answer="Diagnose: L86 Lumbal diskussyndrom" />);
      expect(screen.getByText('Diagnose: L86 Lumbal diskussyndrom')).toBeInTheDocument();
    });

    it('should display conclusion heading', () => {
      render(<AIReasoningPanel answer="Some answer" />);
      expect(screen.getByText('Konklusjon')).toBeInTheDocument();
    });

    it('should not show reasoning by default', () => {
      render(<AIReasoningPanel reasoning="Step 1: Consider symptoms" answer="Final diagnosis" />);
      expect(screen.queryByText('Step 1: Consider symptoms')).not.toBeInTheDocument();
    });

    it('should show toggle button when reasoning is present', () => {
      render(<AIReasoningPanel reasoning="Step 1: Consider symptoms" answer="Final diagnosis" />);
      expect(screen.getByText('Vis resonnering')).toBeInTheDocument();
    });

    it('should not show toggle button when no reasoning', () => {
      render(<AIReasoningPanel answer="Just an answer" />);
      expect(screen.queryByText('Vis resonnering')).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should toggle reasoning visibility on button click', async () => {
      const user = userEvent.setup();
      render(
        <AIReasoningPanel reasoning="Step 1: Evaluate patient data" answer="Diagnosis result" />
      );

      // Reasoning hidden initially
      expect(screen.queryByText('Step 1: Evaluate patient data')).not.toBeInTheDocument();

      // Click to show
      await user.click(screen.getByText('Vis resonnering'));
      expect(screen.getByText('Step 1: Evaluate patient data')).toBeInTheDocument();
      expect(screen.getByText('Skjul resonnering')).toBeInTheDocument();

      // Click to hide
      await user.click(screen.getByText('Skjul resonnering'));
      expect(screen.queryByText('Step 1: Evaluate patient data')).not.toBeInTheDocument();
    });

    it('should show reasoning heading when expanded', async () => {
      const user = userEvent.setup();
      render(<AIReasoningPanel reasoning="Clinical reasoning content" answer="Answer" />);

      await user.click(screen.getByText('Vis resonnering'));
      expect(screen.getByText('Klinisk resonnering')).toBeInTheDocument();
    });
  });

  describe('Bilingual support', () => {
    it('should render Norwegian labels by default', () => {
      render(<AIReasoningPanel reasoning="Reasoning" answer="Answer" isLoading={false} />);
      expect(screen.getByText('Konklusjon')).toBeInTheDocument();
      expect(screen.getByText('Vis resonnering')).toBeInTheDocument();
    });
  });
});
