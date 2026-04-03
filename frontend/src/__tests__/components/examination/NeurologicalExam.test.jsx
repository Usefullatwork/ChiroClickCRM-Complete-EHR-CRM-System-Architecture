/**
 * NeurologicalExam Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NeurologicalExam from '../../../components/examination/NeurologicalExam';

describe('NeurologicalExam', () => {
  it('should render the Norwegian heading', () => {
    render(<NeurologicalExam />);
    expect(screen.getByText('Neurologisk undersokelse')).toBeInTheDocument();
  });

  it('should render placeholder text indicating coming soon', () => {
    render(<NeurologicalExam />);
    expect(screen.getByText('Full neurologisk undersokelse - kommer snart.')).toBeInTheDocument();
  });

  it('should render with a white background container', () => {
    const { container } = render(<NeurologicalExam />);
    const panel = container.querySelector('.bg-white');
    expect(panel).toBeInTheDocument();
  });
});
