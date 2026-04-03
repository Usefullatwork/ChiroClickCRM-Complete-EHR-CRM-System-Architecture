import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

import {
  RedFlagBanner,
  RedFlagModal,
  InlineRedFlagIndicator,
  RedFlagSummaryCard,
} from '../../components/RedFlagWarning';

describe('RedFlagBanner', () => {
  it('returns null when no flags', () => {
    const { container } = render(<RedFlagBanner flags={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when flags is null', () => {
    const { container } = render(<RedFlagBanner flags={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders banner with critical flags', () => {
    const flags = [{ severity: 'CRITICAL', description: 'Cauda equina', category: 'Neuro' }];
    render(<RedFlagBanner flags={flags} onViewAll={vi.fn()} />);
    expect(screen.getByText('Kritiske røde flagg oppdaget!')).toBeInTheDocument();
  });

  it('renders banner with high-priority flags only', () => {
    const flags = [{ severity: 'HIGH', description: 'Progressive weakness', category: 'Neuro' }];
    render(<RedFlagBanner flags={flags} onViewAll={vi.fn()} />);
    expect(screen.getByText('Røde flagg oppdaget')).toBeInTheDocument();
  });

  it('renders "Se alle" button', () => {
    const flags = [{ severity: 'HIGH', description: 'Test', category: 'Test' }];
    render(<RedFlagBanner flags={flags} onViewAll={vi.fn()} />);
    expect(screen.getByText('Se alle')).toBeInTheDocument();
  });
});

describe('RedFlagModal', () => {
  const sampleFlags = [
    {
      id: 'f1',
      severity: 'CRITICAL',
      description: 'Saddle anesthesia',
      category: 'Neuro',
      details: 'Loss of sensation',
    },
    { id: 'f2', severity: 'HIGH', description: 'Progressive deficit', category: 'Neuro' },
  ];

  it('returns null when not open', () => {
    const { container } = render(
      <RedFlagModal isOpen={false} flags={sampleFlags} patientName="Test" onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when open', () => {
    render(<RedFlagModal isOpen={true} flags={sampleFlags} patientName="Ola" onClose={vi.fn()} />);
    expect(screen.getByText(/Røde Flagg/)).toBeInTheDocument();
    expect(screen.getByText('Pasient: Ola')).toBeInTheDocument();
  });

  it('renders grouped severity sections', () => {
    render(<RedFlagModal isOpen={true} flags={sampleFlags} patientName="Test" onClose={vi.fn()} />);
    expect(screen.getByText(/KRITISK/)).toBeInTheDocument();
    expect(screen.getByText(/HØY/)).toBeInTheDocument();
  });

  it('shows acknowledge all button', () => {
    render(<RedFlagModal isOpen={true} flags={sampleFlags} patientName="Test" onClose={vi.fn()} />);
    expect(screen.getByText('Bekreft alle vurdert')).toBeInTheDocument();
  });

  it('blocks close when critical flags unacknowledged', () => {
    render(<RedFlagModal isOpen={true} flags={sampleFlags} patientName="Test" onClose={vi.fn()} />);
    expect(screen.getByText('Vurder alle kritiske først')).toBeInTheDocument();
  });
});

describe('InlineRedFlagIndicator', () => {
  it('renders critical indicator', () => {
    const flag = { severity: 'CRITICAL', description: 'Test flag' };
    render(<InlineRedFlagIndicator flag={flag} />);
    expect(screen.getByText(/Kritisk!/)).toBeInTheDocument();
  });

  it('renders non-critical indicator', () => {
    const flag = { severity: 'HIGH', description: 'Test flag' };
    render(<InlineRedFlagIndicator flag={flag} />);
    expect(screen.getByText(/Rødt flagg/)).toBeInTheDocument();
  });

  it('shows flag description as title', () => {
    const flag = { severity: 'CRITICAL', description: 'Cauda equina' };
    render(<InlineRedFlagIndicator flag={flag} />);
    expect(screen.getByTitle('Cauda equina')).toBeInTheDocument();
  });
});

describe('RedFlagSummaryCard', () => {
  it('returns null when no flags', () => {
    const { container } = render(<RedFlagSummaryCard flags={[]} patientName="Test" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders summary card with flags', () => {
    const flags = [
      { severity: 'CRITICAL', description: 'Test' },
      { severity: 'HIGH', description: 'Other' },
    ];
    render(<RedFlagSummaryCard flags={flags} patientName="Kari" onClick={vi.fn()} />);
    expect(screen.getByText('Kari')).toBeInTheDocument();
    expect(screen.getByText(/1 kritisk/)).toBeInTheDocument();
  });
});
