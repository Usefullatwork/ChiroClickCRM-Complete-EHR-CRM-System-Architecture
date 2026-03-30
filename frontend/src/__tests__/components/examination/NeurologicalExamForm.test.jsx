/**
 * NeurologicalExamForm Component Tests
 *
 * Tests the examination/NeurologicalExam.jsx stub component.
 * This is a placeholder component with minimal UI — tests verify
 * it renders correctly and accepts its props without errors.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import NeurologicalExam from '../../../components/examination/NeurologicalExam';

describe('NeurologicalExam (examination stub)', () => {
  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  describe('Default Render', () => {
    it('should render the heading "Neurologisk undersokelse"', () => {
      render(<NeurologicalExam />);
      expect(screen.getByText('Neurologisk undersokelse')).toBeInTheDocument();
    });

    it('should render the placeholder text', () => {
      render(<NeurologicalExam />);
      expect(screen.getByText(/Full neurologisk undersokelse - kommer snart/i)).toBeInTheDocument();
    });

    it('should render as a bordered container', () => {
      const { container } = render(<NeurologicalExam />);
      const div = container.firstChild;
      expect(div.className).toContain('border');
      expect(div.className).toContain('rounded-lg');
    });

    it('should render with white background', () => {
      const { container } = render(<NeurologicalExam />);
      expect(container.firstChild.className).toContain('bg-white');
    });

    it('should have an h3 heading element', () => {
      render(<NeurologicalExam />);
      const heading = screen.getByText('Neurologisk undersokelse');
      expect(heading.tagName).toBe('H3');
    });

    it('should render descriptive paragraph text', () => {
      render(<NeurologicalExam />);
      const para = screen.getByText(/Full neurologisk undersokelse - kommer snart/);
      expect(para.tagName).toBe('P');
    });

    it('should accept patientId prop without error', () => {
      expect(() => render(<NeurologicalExam _patientId="patient-1" />)).not.toThrow();
    });

    it('should accept encounterId prop without error', () => {
      expect(() => render(<NeurologicalExam _encounterId="encounter-1" />)).not.toThrow();
    });

    it('should accept onDataChange callback prop without error', () => {
      const mockCallback = vi.fn();
      expect(() => render(<NeurologicalExam _onDataChange={mockCallback} />)).not.toThrow();
    });

    it('should render with all three props without error', () => {
      const mockCallback = vi.fn();
      expect(() =>
        render(
          <NeurologicalExam
            _patientId="patient-1"
            _encounterId="enc-1"
            _onDataChange={mockCallback}
          />
        )
      ).not.toThrow();
    });
  });
});
