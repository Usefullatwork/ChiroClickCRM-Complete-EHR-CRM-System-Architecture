/**
 * OutcomeMeasures Tests
 *
 * Tests:
 * - Renders component
 * - Questionnaire type selector
 * - NPRS form display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  ClipboardList: (props) => null,
  Check: (props) => null,
  AlertCircle: (props) => null,
}));

vi.mock('../../../services/api', () => ({
  outcomesAPI: {
    submitQuestionnaire: vi
      .fn()
      .mockResolvedValue({
        data: { scoring: { score: 5, maxScore: 10, percentage: 50, severity: 'Moderate' } },
      }),
  },
}));

import OutcomeMeasures from '../../../components/clinical/OutcomeMeasures';

describe('OutcomeMeasures', () => {
  const defaultProps = {
    patientId: 'patient-1',
    encounterId: 'encounter-1',
    onSubmitted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Outcome Measures heading', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    expect(screen.getByText('Outcome Measures')).toBeInTheDocument();
  });

  it('renders the questionnaire type selector', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('has NPRS selected by default', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('NPRS');
  });

  it('renders all questionnaire type options', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(5);
    expect(options.map((o) => o.value)).toEqual(['NPRS', 'VAS', 'ODI', 'NDI', 'DASH']);
  });

  it('renders NPRS pain level buttons (0-10)', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    // NPRS shows 11 buttons (0-10)
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('shows pain description after selecting a value', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    const button5 = screen.getByText('5');
    fireEvent.click(button5);
    // Text is split across elements, so use a function matcher
    expect(
      screen.getByText(
        (content, element) =>
          element?.className?.includes('font-medium') &&
          element?.textContent?.includes('Selected:') &&
          element?.textContent?.includes('5') &&
          element?.textContent?.includes('/10')
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Moderate pain/)).toBeInTheDocument();
  });

  it('renders Submit NPRS button', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    expect(screen.getByText('Submit NPRS')).toBeInTheDocument();
  });

  it('has Submit button disabled when no value selected', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    const submitBtn = screen.getByText('Submit NPRS');
    expect(submitBtn).toBeDisabled();
  });

  it('enables Submit button after selecting a pain value', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    fireEvent.click(screen.getByText('3'));
    const submitBtn = screen.getByText('Submit NPRS');
    expect(submitBtn).not.toBeDisabled();
  });

  it('switches to VAS form when VAS is selected', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'VAS' } });
    expect(screen.getByText(/Drag the slider/)).toBeInTheDocument();
    expect(screen.getByText('Submit VAS')).toBeInTheDocument();
  });

  it('switches to ODI form when ODI is selected', () => {
    render(<OutcomeMeasures {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ODI' } });
    expect(screen.getByText('Submit ODI')).toBeInTheDocument();
    expect(screen.getByText(/Pain Intensity/)).toBeInTheDocument();
  });
});
