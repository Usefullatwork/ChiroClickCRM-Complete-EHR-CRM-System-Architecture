import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import EducationSearch from '../../../components/PatientEducationLibrary/EducationSearch';

describe('EducationSearch', () => {
  const defaultProps = {
    searchTerm: '',
    setSearchTerm: vi.fn(),
    selectedCategory: 'all',
    setSelectedCategory: vi.fn(),
    categories: ['all', 'Spine Health', 'Exercises', 'Nutrition'],
  };

  beforeEach(() => {
    defaultProps.setSearchTerm.mockClear();
    defaultProps.setSelectedCategory.mockClear();
  });

  it('renders the search input', () => {
    render(<EducationSearch {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search education materials...')).toBeInTheDocument();
  });

  it('renders all category buttons', () => {
    render(<EducationSearch {...defaultProps} />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Spine Health')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
  });

  it('calls setSearchTerm when typing in search', () => {
    render(<EducationSearch {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search education materials...');
    fireEvent.change(input, { target: { value: 'back pain' } });
    expect(defaultProps.setSearchTerm).toHaveBeenCalledWith('back pain');
  });

  it('calls setSelectedCategory when category button is clicked', () => {
    render(<EducationSearch {...defaultProps} />);
    fireEvent.click(screen.getByText('Spine Health'));
    expect(defaultProps.setSelectedCategory).toHaveBeenCalledWith('Spine Health');
  });

  it('highlights the active category', () => {
    render(<EducationSearch {...defaultProps} selectedCategory="Exercises" />);
    const exercisesBtn = screen.getByText('Exercises');
    expect(exercisesBtn.className).toContain('active');
  });

  it('shows "all" category as "All Categories"', () => {
    render(<EducationSearch {...defaultProps} />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders search input with current search term', () => {
    render(<EducationSearch {...defaultProps} searchTerm="ergonomics" />);
    const input = screen.getByPlaceholderText('Search education materials...');
    expect(input.value).toBe('ergonomics');
  });

  it('renders correct number of category buttons', () => {
    render(<EducationSearch {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });
});
