/**
 * OutcomeHistory Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/outcomes/questionnaires', () => ({
  QUESTIONNAIRES: {
    NDI: {
      name: { en: 'Neck Disability Index', no: 'Nakke Funksjonsindeks' },
      shortName: 'NDI',
      scoring: {
        mcid: 10,
        interpretation: [
          { min: 0, max: 20, label: { en: 'None', no: 'Ingen' }, color: 'green' },
          { min: 21, max: 40, label: { en: 'Mild', no: 'Mild' }, color: 'yellow' },
          { min: 41, max: 60, label: { en: 'Moderate', no: 'Moderat' }, color: 'orange' },
          { min: 61, max: 100, label: { en: 'Severe', no: 'Alvorlig' }, color: 'red' },
        ],
      },
    },
  },
  calculateChange: (baseline, current, mcid) => ({
    absoluteChange: baseline - current,
    clinicallySignificant: Math.abs(baseline - current) >= mcid,
    significance: baseline > current ? 'improved' : 'worsened',
  }),
}));

vi.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      {
        get: (_, name) => {
          if (name === '__esModule') return false;
          return (props) => null;
        },
      }
    )
);

import OutcomeHistory from '../../../components/outcomes/OutcomeHistory';

const mockHistory = {
  NDI: [
    { id: 1, date: '2024-01-02', score: 34, percentage: 68 },
    { id: 2, date: '2024-01-16', score: 28, percentage: 56 },
    { id: 3, date: '2024-01-30', score: 22, percentage: 44 },
  ],
};

describe('OutcomeHistory', () => {
  it('renders the heading', () => {
    render(<OutcomeHistory history={mockHistory} lang="en" />);
    expect(screen.getByText('Outcome History')).toBeInTheDocument();
  });

  it('renders Norwegian heading', () => {
    render(<OutcomeHistory history={mockHistory} lang="no" />);
    expect(screen.getByText('Utfallshistorikk')).toBeInTheDocument();
  });

  it('renders summary cards in cards view mode', () => {
    render(<OutcomeHistory history={mockHistory} lang="en" />);
    expect(screen.getByText('Neck Disability Index')).toBeInTheDocument();
  });

  it('renders assessment count', () => {
    render(<OutcomeHistory history={mockHistory} lang="en" />);
    expect(screen.getByText('3 assessments')).toBeInTheDocument();
  });

  it('renders baseline score', () => {
    render(<OutcomeHistory history={mockHistory} lang="en" />);
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('renders latest score', () => {
    render(<OutcomeHistory history={mockHistory} lang="en" />);
    expect(screen.getByText('44%')).toBeInTheDocument();
  });

  it('renders empty state when no history', () => {
    render(<OutcomeHistory history={{}} lang="en" />);
    expect(screen.getByText('No outcome measures recorded yet')).toBeInTheDocument();
  });

  it('renders Start New Assessment button when no data', () => {
    const onStartNew = vi.fn();
    render(<OutcomeHistory history={{}} lang="en" onStartNew={onStartNew} />);
    fireEvent.click(screen.getByText('Start New Assessment'));
    expect(onStartNew).toHaveBeenCalled();
  });

  it('renders view toggle buttons', () => {
    render(<OutcomeHistory history={mockHistory} lang="en" />);
    expect(screen.getByText('Cards')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('renders measure filter dropdown', () => {
    render(<OutcomeHistory history={mockHistory} lang="en" />);
    expect(screen.getByText('All Measures')).toBeInTheDocument();
  });
});
