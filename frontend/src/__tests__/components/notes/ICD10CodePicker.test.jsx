/**
 * ICD10CodePicker Component Tests
 * Tests code search, category expansion, selection, favorites, and accessibility.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  Search: () => null,
  X: (props) => <span {...props}>X</span>,
  ChevronDown: () => null,
  ChevronRight: () => null,
  Star: (props) => <span {...props}>Star</span>,
  Clock: () => null,
  CheckCircle: () => null,
}));

import ICD10CodePicker from '../../../components/notes/ICD10CodePicker';

function buildProps(overrides = {}) {
  return {
    onSelect: vi.fn(),
    onClose: vi.fn(),
    selectedCodes: [],
    ...overrides,
  };
}

describe('ICD10CodePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the header title', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    expect(screen.getByText('Velg ICD-10 kode')).toBeTruthy();
  });

  it('renders the search input', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    expect(screen.getByPlaceholderText(/kode eller beskrivelse/)).toBeTruthy();
  });

  it('renders the Ferdig (done) button', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    expect(screen.getByText('Ferdig')).toBeTruthy();
  });

  it('calls onClose when Ferdig is clicked', () => {
    const onClose = vi.fn();
    render(<ICD10CodePicker {...buildProps({ onClose })} />);
    fireEvent.click(screen.getByText('Ferdig'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<ICD10CodePicker {...buildProps({ onClose })} />);
    fireEvent.click(screen.getByLabelText('Lukk'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders spine category expanded by default', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    expect(screen.getByText('Rygglidelser')).toBeTruthy();
    expect(screen.getByText('M54.2')).toBeTruthy();
    expect(screen.getByText('Nakkesmerter')).toBeTruthy();
  });

  it('renders other categories collapsed', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    expect(screen.getByText('Hodepine')).toBeTruthy();
    expect(screen.queryByText('G44.2')).toBeNull();
  });

  it('expands a category on click', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    fireEvent.click(screen.getByText('Hodepine'));
    expect(screen.getByText('G44.2')).toBeTruthy();
    expect(screen.getByText('Spenningshodepine')).toBeTruthy();
  });

  it('filters codes on search', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    const input = screen.getByPlaceholderText(/kode eller beskrivelse/);
    fireEvent.change(input, { target: { value: 'M54.5' } });
    expect(screen.getByText('M54.5')).toBeTruthy();
    expect(screen.getByText('Korsryggsmerter')).toBeTruthy();
  });

  it('shows no results message for unmatched search', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    const input = screen.getByPlaceholderText(/kode eller beskrivelse/);
    fireEvent.change(input, { target: { value: 'ZZZZZ' } });
    expect(screen.getByText(/Ingen koder funnet/)).toBeTruthy();
  });

  it('calls onSelect when a code is clicked', () => {
    const onSelect = vi.fn();
    render(<ICD10CodePicker {...buildProps({ onSelect })} />);
    const codeButtons = screen.getAllByText('M54.2');
    fireEvent.click(codeButtons[0].closest('button'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'M54.2', descriptionNo: 'Nakkesmerter' })
    );
  });

  it('shows selected codes count in footer', () => {
    render(<ICD10CodePicker {...buildProps({ selectedCodes: ['M54.2', 'M54.5'] })} />);
    expect(screen.getByText('2 koder valgt')).toBeTruthy();
  });

  it('shows singular for 1 code selected', () => {
    render(<ICD10CodePicker {...buildProps({ selectedCodes: ['M54.2'] })} />);
    expect(screen.getByText('1 kode valgt')).toBeTruthy();
  });

  it('shows category code counts', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    expect(screen.getByText('16 koder')).toBeTruthy();
  });

  it('renders favorite toggle buttons with aria-label', () => {
    render(<ICD10CodePicker {...buildProps()} />);
    const favoriteButtons = screen.getAllByLabelText(/favoritter/);
    expect(favoriteButtons.length).toBeGreaterThan(0);
  });
});
