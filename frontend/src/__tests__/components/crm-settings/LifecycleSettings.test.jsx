/**
 * LifecycleSettings Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import LifecycleSettings from '../../../components/crm-settings/LifecycleSettings';

const defaultSettings = {
  newPatientDays: 30,
  onboardingVisits: 3,
  atRiskDays: 45,
  inactiveDays: 90,
  lostDays: 180,
};

describe('LifecycleSettings', () => {
  let onChange;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it('renders the heading', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Livssyklusdefinisjoner')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText(/Definer når pasienter automatisk flyttes/)).toBeInTheDocument();
  });

  it('renders new patient days input', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByText('Ny pasient (dager)')).toBeInTheDocument();
  });

  it('renders onboarding visits input', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByText('Onboarding (antall besøk)')).toBeInTheDocument();
  });

  it('renders at risk days input', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
  });

  it('renders inactive days input', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('90')).toBeInTheDocument();
  });

  it('renders lost days input', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('180')).toBeInTheDocument();
  });

  it('renders visual lifecycle flow', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Livssyklusflyt:')).toBeInTheDocument();
    expect(screen.getByText(/Ny \(30d\)/)).toBeInTheDocument();
    expect(screen.getByText(/Onboarding \(3 besøk\)/)).toBeInTheDocument();
    expect(screen.getByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByText(/I Fare \(45d\)/)).toBeInTheDocument();
    expect(screen.getByText(/Inaktiv \(90d\)/)).toBeInTheDocument();
    expect(screen.getByText(/Tapt \(180d\)/)).toBeInTheDocument();
  });

  it('calls onChange when at risk days is changed', () => {
    render(<LifecycleSettings settings={defaultSettings} onChange={onChange} />);
    const atRiskInput = screen.getByDisplayValue('45');
    fireEvent.change(atRiskInput, { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ atRiskDays: 60 }));
  });
});
