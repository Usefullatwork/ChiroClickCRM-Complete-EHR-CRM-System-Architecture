import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PatientSearch from '../../components/PatientSearch';

describe('PatientSearch Component', () => {
  it('should render search input', () => {
    render(<PatientSearch onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText(/sok etter pasienter/i)).toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(<PatientSearch onSearch={onSearch} onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText(/sok etter pasienter/i);
    fireEvent.change(input, { target: { value: 'Ola' } });

    // Should not call immediately
    expect(onSearch).not.toHaveBeenCalled();

    // Fast-forward 300ms (debounce delay)
    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledWith('Ola');

    vi.useRealTimers();
  });

  it('should display search results', async () => {
    const mockPatients = [
      { id: '1', first_name: 'Ola', last_name: 'Nordmann' },
      { id: '2', first_name: 'Kari', last_name: 'Hansen' },
    ];

    render(<PatientSearch results={mockPatients} onSelect={vi.fn()} />);

    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
  });

  it('should call onSelect when patient is clicked', () => {
    const onSelect = vi.fn();
    const mockPatients = [{ id: '1', first_name: 'Ola', last_name: 'Nordmann' }];

    render(<PatientSearch results={mockPatients} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Ola Nordmann'));

    expect(onSelect).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('should show "No results" message when search returns empty', () => {
    render(<PatientSearch results={[]} onSelect={vi.fn()} searchPerformed={true} />);

    expect(screen.getByText(/ingen pasienter funnet/i)).toBeInTheDocument();
  });
});
