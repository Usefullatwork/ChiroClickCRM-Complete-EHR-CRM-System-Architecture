/**
 * QuickCheckboxGrid Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuickCheckboxGrid from '../../../components/assessment/QuickCheckboxGrid';

const TEST_CATEGORIES = {
  'Pain Type': [
    { value: 'sharp', label: 'Sharp' },
    { value: 'dull', label: 'Dull' },
    { value: 'aching', label: 'Aching' },
  ],
  Pattern: [
    { value: 'constant', label: 'Constant' },
    { value: 'intermittent', label: 'Intermittent' },
  ],
};

describe('QuickCheckboxGrid', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the title', () => {
    render(
      <QuickCheckboxGrid
        title="Pain Quality"
        categories={TEST_CATEGORIES}
        selectedValues={[]}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('Pain Quality')).toBeInTheDocument();
  });

  it('should render category names', () => {
    render(
      <QuickCheckboxGrid
        title="Test"
        categories={TEST_CATEGORIES}
        selectedValues={[]}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('Pain Type')).toBeInTheDocument();
    expect(screen.getByText('Pattern')).toBeInTheDocument();
  });

  it('should render item labels', () => {
    render(
      <QuickCheckboxGrid
        title="Test"
        categories={TEST_CATEGORIES}
        selectedValues={[]}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('Sharp')).toBeInTheDocument();
    expect(screen.getByText('Dull')).toBeInTheDocument();
    expect(screen.getByText('Constant')).toBeInTheDocument();
  });

  it('should show selected count', () => {
    render(
      <QuickCheckboxGrid
        title="Test"
        categories={TEST_CATEGORIES}
        selectedValues={['sharp', 'dull']}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('should call onChange when an item is clicked', () => {
    render(
      <QuickCheckboxGrid
        title="Test"
        categories={TEST_CATEGORIES}
        selectedValues={[]}
        onChange={mockOnChange}
      />
    );
    fireEvent.click(screen.getByText('Sharp'));
    expect(mockOnChange).toHaveBeenCalledWith(['sharp']);
  });

  it('should show generated text when items are selected', () => {
    render(
      <QuickCheckboxGrid
        title="Test"
        categories={TEST_CATEGORIES}
        selectedValues={['sharp', 'constant']}
        onChange={mockOnChange}
        showGeneratedText={true}
      />
    );
    expect(screen.getByText('Generated Documentation:')).toBeInTheDocument();
  });

  it('should clear all when clear button is clicked', () => {
    render(
      <QuickCheckboxGrid
        title="Test"
        categories={TEST_CATEGORIES}
        selectedValues={['sharp']}
        onChange={mockOnChange}
      />
    );
    fireEvent.click(screen.getByText('Clear'));
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});
