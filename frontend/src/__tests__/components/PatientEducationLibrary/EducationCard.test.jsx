import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import EducationCard from '../../../components/PatientEducationLibrary/EducationCard';

const mockMaterial = {
  id: 'ed-1',
  title: 'Understanding Low Back Pain',
  category: 'Spine Health',
  readingLevel: 'Easy',
  estimatedTime: '5 min',
  content: 'Back pain is common...',
};

describe('EducationCard', () => {
  it('renders material title', () => {
    render(<EducationCard material={mockMaterial} onClick={vi.fn()} />);
    expect(screen.getByText('Understanding Low Back Pain')).toBeInTheDocument();
  });

  it('renders material category', () => {
    render(<EducationCard material={mockMaterial} onClick={vi.fn()} />);
    expect(screen.getByText('Spine Health')).toBeInTheDocument();
  });

  it('renders reading level', () => {
    render(<EducationCard material={mockMaterial} onClick={vi.fn()} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('renders estimated time', () => {
    render(<EducationCard material={mockMaterial} onClick={vi.fn()} />);
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<EducationCard material={mockMaterial} onClick={onClick} />);
    fireEvent.click(screen.getByText('Understanding Low Back Pain'));
    expect(onClick).toHaveBeenCalledWith(mockMaterial);
  });

  it('has role="button" for accessibility', () => {
    render(<EducationCard material={mockMaterial} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has aria-label with material title', () => {
    render(<EducationCard material={mockMaterial} onClick={vi.fn()} />);
    expect(screen.getByLabelText('Vis materiale: Understanding Low Back Pain')).toBeInTheDocument();
  });

  it('supports keyboard activation with Enter', () => {
    const onClick = vi.fn();
    render(<EducationCard material={mockMaterial} onClick={onClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith(mockMaterial);
  });

  it('supports keyboard activation with Space', () => {
    const onClick = vi.fn();
    render(<EducationCard material={mockMaterial} onClick={onClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledWith(mockMaterial);
  });

  it('has tabIndex=0 for keyboard focus', () => {
    render(<EducationCard material={mockMaterial} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });
});
