import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import PatientFlowBoard from '../../components/PatientFlowBoard';

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

describe('PatientFlowBoard', () => {
  it('renders the board title', () => {
    render(<PatientFlowBoard />, { wrapper });
    expect(screen.getByText('Pasientflyt')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<PatientFlowBoard />, { wrapper });
    expect(screen.getByText('Dra kort for å oppdatere status')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    render(<PatientFlowBoard />, { wrapper });
    expect(screen.getByText('Oppdater')).toBeInTheDocument();
  });

  it('renders all 5 column headers', () => {
    render(<PatientFlowBoard />, { wrapper });
    expect(screen.getByText('statusScheduled')).toBeInTheDocument();
    expect(screen.getByText('statusConfirmed')).toBeInTheDocument();
    expect(screen.getByText('statusArrived')).toBeInTheDocument();
    expect(screen.getByText('statusInProgress')).toBeInTheDocument();
    expect(screen.getByText('statusCompleted')).toBeInTheDocument();
  });

  it('renders empty columns with no-patients message', () => {
    render(<PatientFlowBoard appointments={[]} />, { wrapper });
    const emptyMessages = screen.getAllByText('Ingen pasienter');
    expect(emptyMessages.length).toBe(5);
  });

  it('renders appointment cards in correct columns', () => {
    const appointments = [
      {
        id: 'a1',
        status: 'SCHEDULED',
        patientName: 'Kari Nordmann',
        startTime: '2025-06-15T09:00:00Z',
        appointmentType: 'INITIAL',
      },
      {
        id: 'a2',
        status: 'ARRIVED',
        patientName: 'Per Hansen',
        startTime: '2025-06-15T10:00:00Z',
        appointmentType: 'FOLLOWUP',
      },
    ];

    render(<PatientFlowBoard appointments={appointments} />, { wrapper });
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Per Hansen')).toBeInTheDocument();
  });

  it('displays stats pills', () => {
    const appointments = [
      { id: 'a1', status: 'COMPLETED', patientName: 'Test', startTime: '2025-06-15T09:00:00Z' },
    ];
    render(<PatientFlowBoard appointments={appointments} />, { wrapper });
    expect(screen.getByText(/I dag/)).toBeInTheDocument();
    expect(screen.getByText(/Venter/)).toBeInTheDocument();
    expect(screen.getByText(/Ferdig/)).toBeInTheDocument();
  });
});
