/**
 * CommunicationHistory Component Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE component import
vi.mock('../../../services/api', () => ({
  crmAPI: {
    getCommunications: vi.fn(),
    logCommunication: vi.fn(),
  },
}));

vi.mock('../../../utils/toast', () => ({
  default: { error: vi.fn(), success: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('../../../utils/logger', () => ({
  default: { scope: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }), error: vi.fn() },
}));

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
    getBilingual: (obj) => obj?.['no'] || obj?.['en'] || obj,
  }),
}));

import { crmAPI } from '../../../services/api';
import CommunicationHistory from '../../../components/crm/CommunicationHistory';

const mockCommunications = [
  {
    id: 'c1',
    patient_id: 'p1',
    patient_name: 'Kari Nordmann',
    type: 'EMAIL',
    direction: 'OUTBOUND',
    subject: 'Påminnelse om time',
    content: 'Hei Kari, dette er en påminnelse om din time...',
    status: 'DELIVERED',
    sent_at: '2026-03-25T10:30:00Z',
    sent_by: 'Dr. Hansen',
    campaign_name: null,
    attachments: null,
    duration: null,
  },
  {
    id: 'c2',
    patient_id: 'p2',
    patient_name: 'Ole Hansen',
    type: 'SMS',
    direction: 'OUTBOUND',
    subject: null,
    content: 'Husk time i morgen kl 14:00',
    status: 'SENT',
    sent_at: '2026-03-25T14:00:00Z',
    sent_by: 'System',
    campaign_name: 'Påminnelser',
    attachments: null,
    duration: null,
  },
  {
    id: 'c3',
    patient_id: 'p3',
    patient_name: 'Anna Berg',
    type: 'PHONE',
    direction: 'OUTBOUND',
    subject: 'Oppfølgingssamtale',
    content: 'Ringt for å sjekke status etter behandling',
    status: 'COMPLETED',
    sent_at: '2026-03-24T09:15:00Z',
    sent_by: 'Dr. Hansen',
    campaign_name: null,
    attachments: null,
    duration: '5:30',
  },
  {
    id: 'c4',
    patient_id: 'p1',
    patient_name: 'Kari Nordmann',
    type: 'EMAIL',
    direction: 'OUTBOUND',
    subject: 'Behandlingsplan vedlagt',
    content: 'Her er din oppdaterte behandlingsplan',
    status: 'OPENED',
    sent_at: '2026-03-20T11:00:00Z',
    sent_by: 'Dr. Hansen',
    campaign_name: null,
    attachments: ['behandlingsplan.pdf'],
    duration: null,
  },
];

describe('CommunicationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crmAPI.getCommunications.mockResolvedValue({
      data: { communications: mockCommunications },
    });
  });

  it('shows loading spinner initially', () => {
    crmAPI.getCommunications.mockReturnValue(new Promise(() => {}));
    render(<CommunicationHistory />);
    expect(screen.getByText('Laster kommunikasjonslogg...')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    crmAPI.getCommunications.mockRejectedValue(new Error('Connection failed'));
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
    expect(screen.getByText('Prøv igjen')).toBeInTheDocument();
  });

  it('renders the title and subtitle after loading', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getByText('All kommunikasjon med pasienter på ett sted')).toBeInTheDocument();
  });

  it('renders stat cards with correct counts', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    // Stat card labels
    expect(screen.getByText('Totalt')).toBeInTheDocument();
    expect(screen.getByText('E-poster')).toBeInTheDocument();
    expect(screen.getByText('Samtaler')).toBeInTheDocument();
    expect(screen.getByText('Denne Uken')).toBeInTheDocument();
    // Numbers may appear multiple times (stat cards + comm items), use getAllByText
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('renders communication items with patient names', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Kari Nordmann')).toHaveLength(2);
    expect(screen.getByText('Ole Hansen')).toBeInTheDocument();
    expect(screen.getByText('Anna Berg')).toBeInTheDocument();
  });

  it('renders communication subjects', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getByText('Påminnelse om time')).toBeInTheDocument();
    expect(screen.getByText('Oppfølgingssamtale')).toBeInTheDocument();
    expect(screen.getByText('Behandlingsplan vedlagt')).toBeInTheDocument();
  });

  it('renders status badges for communications', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getByText('Levert')).toBeInTheDocument();
    expect(screen.getByText('Sendt')).toBeInTheDocument();
    expect(screen.getByText('Fullført')).toBeInTheDocument();
    expect(screen.getByText('Åpnet')).toBeInTheDocument();
  });

  it('renders communication type filter buttons', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    // Filter buttons - some labels may appear multiple times (filter + new message form types)
    expect(screen.getAllByText('Alle').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('E-post').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SMS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Telefon').length).toBeGreaterThanOrEqual(1);
  });

  it('filters by search term', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('Søk etter pasient eller emne...');
    fireEvent.change(searchInput, { target: { value: 'Anna' } });
    expect(screen.getByText('Anna Berg')).toBeInTheDocument();
    expect(screen.queryByText('Ole Hansen')).not.toBeInTheDocument();
  });

  it('opens new message modal when button is clicked', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ny Melding'));
    // Modal should be visible with form fields
    expect(screen.getByText('Meldingstype')).toBeInTheDocument();
    expect(screen.getByText('Pasient')).toBeInTheDocument();
    expect(screen.getByText('Emne')).toBeInTheDocument();
    expect(screen.getByText('Vedlegg')).toBeInTheDocument();
  });

  it('closes new message modal when cancel is clicked', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Ny Melding'));
    expect(screen.getByText('Meldingstype')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Avbryt'));
    expect(screen.queryByText('Meldingstype')).not.toBeInTheDocument();
  });

  it('shows campaign badge on communications from campaigns', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getByText('Påminnelser')).toBeInTheDocument();
  });

  it('shows attachment file names', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getByText('behandlingsplan.pdf')).toBeInTheDocument();
  });

  it('shows call duration for phone communications', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getByText('5:30')).toBeInTheDocument();
  });

  it('shows sent-by information', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Dr. Hansen').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('calls getCommunications on mount', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(crmAPI.getCommunications).toHaveBeenCalledTimes(1);
    });
  });

  it('renders Export button', async () => {
    render(<CommunicationHistory />);
    await waitFor(() => {
      expect(screen.getByText('Kommunikasjonslogg')).toBeInTheDocument();
    });
    expect(screen.getByText('Eksporter')).toBeInTheDocument();
  });
});
