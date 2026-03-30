/**
 * CRMOverview Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE component import
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
    getBilingual: (obj) => obj?.['no'] || obj?.['en'] || obj,
  }),
}));

import CRMOverview from '../../../components/crm/CRMOverview';

const mockOverviewStats = {
  newLeads: 12,
  activePatients: 245,
  atRiskPatients: 8,
  avgNPS: 72,
  pendingReferrals: 3,
  waitlistCount: 15,
};

const mockSetActiveModule = vi.fn();

describe('CRMOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four stat cards with correct values', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders stat card labels from translation keys', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('Nye Leads')).toBeInTheDocument();
    expect(screen.getByText('Aktive Pasienter')).toBeInTheDocument();
    expect(screen.getByText('I Faresonen')).toBeInTheDocument();
    expect(screen.getByText('NPS Score')).toBeInTheDocument();
  });

  it('renders Lead Pipeline section with pipeline bars', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('Lead Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Nye')).toBeInTheDocument();
    expect(screen.getByText('Kontaktet')).toBeInTheDocument();
    expect(screen.getByText('Booket')).toBeInTheDocument();
    expect(screen.getByText('Konvertert')).toBeInTheDocument();
  });

  it('renders Recent Messages section with message previews', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('Siste Meldinger')).toBeInTheDocument();
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Ole Hansen')).toBeInTheDocument();
    expect(screen.getByText('Anna Berg')).toBeInTheDocument();
  });

  it('renders Pending Referrals section', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('Ventende Henvisninger')).toBeInTheDocument();
    // Referral names: "referred" is main text, referrer is in "fra {referrer}"
    expect(screen.getByText('Lise Olsen')).toBeInTheDocument();
    expect(screen.getByText('Martin Berg')).toBeInTheDocument();
    expect(screen.getByText(/fra Per Olsen/)).toBeInTheDocument();
    expect(screen.getByText(/ventende belønninger/)).toBeInTheDocument();
  });

  it('renders Active Campaigns section with campaign previews', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('Aktive Kampanjer')).toBeInTheDocument();
    expect(screen.getByText('Vi savner deg')).toBeInTheDocument();
    expect(screen.getByText('Bursdag Januar')).toBeInTheDocument();
  });

  it('renders Automation Status section with workflow items', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('Automatisering')).toBeInTheDocument();
    expect(screen.getByText('Velkomstsekvens')).toBeInTheDocument();
    expect(screen.getByText('30-dagers sjekk')).toBeInTheDocument();
    expect(screen.getByText('Bursdagshilsen')).toBeInTheDocument();
  });

  it('renders Waitlist section with count', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('Venteliste')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('pasienter venter')).toBeInTheDocument();
  });

  it('shows at-risk patients alert when atRiskPatients > 0', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    expect(screen.getByText('8 pasienter i faresonen')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Disse pasientene har ikke vært innom på over 6 uker. Vurder å sende en påminnelse.'
      )
    ).toBeInTheDocument();
  });

  it('does not show at-risk alert when atRiskPatients is 0', () => {
    const stats = { ...mockOverviewStats, atRiskPatients: 0 };
    render(<CRMOverview overviewStats={stats} setActiveModule={mockSetActiveModule} />);
    expect(screen.queryByText('pasienter i faresonen')).not.toBeInTheDocument();
  });

  it('navigates to leads module when "Se alle" is clicked on pipeline', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    // Multiple "Se alle" buttons, get all and click first one (pipeline)
    const viewAllButtons = screen.getAllByText(/Se alle/);
    fireEvent.click(viewAllButtons[0]);
    expect(mockSetActiveModule).toHaveBeenCalledWith('leads');
  });

  it('navigates to communications module when messages "Se alle" is clicked', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    const viewAllButtons = screen.getAllByText(/Se alle/);
    fireEvent.click(viewAllButtons[1]);
    expect(mockSetActiveModule).toHaveBeenCalledWith('communications');
  });

  it('navigates to lifecycle when "Se pasienter" is clicked on at-risk alert', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    fireEvent.click(screen.getByText('Se pasienter'));
    expect(mockSetActiveModule).toHaveBeenCalledWith('lifecycle');
  });

  it('renders campaign response rates correctly', () => {
    render(<CRMOverview overviewStats={mockOverviewStats} setActiveModule={mockSetActiveModule} />);
    // "Vi savner deg" campaign: 23/127 = 18% respons
    expect(screen.getByText('18% respons')).toBeInTheDocument();
    // "Bursdag Januar" campaign: 12/45 = 27% respons
    expect(screen.getByText('27% respons')).toBeInTheDocument();
  });
});
