/**
 * ActivatorMethodPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivatorMethodPanel from '../../../components/examination/ActivatorMethodPanel';

// Uses internal LABELS — no i18n mock needed

describe('ActivatorMethodPanel', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Norwegian title by default', () => {
    render(<ActivatorMethodPanel values={{}} onChange={mockOnChange} />);
    expect(screen.getByText('Aktivator Metode')).toBeInTheDocument();
  });

  it('should render the English title when lang is en', () => {
    render(<ActivatorMethodPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Activator Method')).toBeInTheDocument();
  });

  it('should render category sections', () => {
    render(<ActivatorMethodPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Leg Length Analysis')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Head Tests')).toBeInTheDocument();
    expect(screen.getByText('Palpation Screening')).toBeInTheDocument();
  });

  it('should show generate text button when onGenerateNarrative is provided', () => {
    const mockGenerate = vi.fn();
    render(
      <ActivatorMethodPanel
        values={{}}
        onChange={mockOnChange}
        lang="en"
        onGenerateNarrative={mockGenerate}
      />
    );
    const btn = screen.getByText('Generate Text');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockGenerate).toHaveBeenCalled();
  });

  it('should show clinical notes section', () => {
    render(<ActivatorMethodPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Activator Protocol:')).toBeInTheDocument();
  });
});
