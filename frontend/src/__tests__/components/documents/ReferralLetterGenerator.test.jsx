/**
 * ReferralLetterGenerator Component Tests
 *
 * Tests rendering, referral type switching, priority selection,
 * preview toggle, and save callback.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('lucide-react', () => ({
  FileText: (props) => <span data-testid="icon-filetext" {...props} />,
  User: (props) => <span data-testid="icon-user" {...props} />,
  Building2: (props) => <span data-testid="icon-building" {...props} />,
  Send: (props) => <span data-testid="icon-send" {...props} />,
  Stethoscope: (props) => <span data-testid="icon-stethoscope" {...props} />,
  ImageIcon: (props) => <span data-testid="icon-image" {...props} />,
  Activity: (props) => <span data-testid="icon-activity" {...props} />,
  ChevronDown: (props) => <span data-testid="icon-chevdown" {...props} />,
  ChevronUp: (props) => <span data-testid="icon-chevup" {...props} />,
  Printer: (props) => <span data-testid="icon-printer" {...props} />,
  Copy: (props) => <span data-testid="icon-copy" {...props} />,
  AlertCircle: (props) => <span data-testid="icon-alertcircle" {...props} />,
  Clock: (props) => <span data-testid="icon-clock" {...props} />,
  FileDown: (props) => <span data-testid="icon-filedown" {...props} />,
}));

vi.mock('../../../services/api/billing', () => ({
  pdfAPI: {
    generateReferralLetter: vi.fn(),
  },
}));

import ReferralLetterGenerator from '../../../components/documents/ReferralLetterGenerator';

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <ReferralLetterGenerator {...props} />
    </BrowserRouter>
  );
};

describe('ReferralLetterGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the referral title and subtitle', () => {
    renderComponent();
    expect(screen.getByText('Henvisning')).toBeInTheDocument();
    expect(screen.getByText('Profesjonell medisinsk henvisning')).toBeInTheDocument();
  });

  it('renders referral type buttons for all types', () => {
    renderComponent();
    expect(screen.getByText('Fastlege')).toBeInTheDocument();
    expect(screen.getByText('Ortoped')).toBeInTheDocument();
    expect(screen.getByText('Nevrolog')).toBeInTheDocument();
    expect(screen.getByText('Bildediagnostikk')).toBeInTheDocument();
    expect(screen.getByText('Fysioterapeut')).toBeInTheDocument();
  });

  it('renders priority buttons', () => {
    renderComponent();
    expect(screen.getByText('Rutinemessig')).toBeInTheDocument();
    expect(screen.getByText('Snart (2-4 uker)')).toBeInTheDocument();
    expect(screen.getByText('Haster')).toBeInTheDocument();
  });

  it('switches referral type when a type button is clicked', () => {
    renderComponent();

    // Click radiology type (only one exists initially - the tab button)
    const radiologyBtn = screen.getByText('Bildediagnostikk');
    fireEvent.click(radiologyBtn);

    // After clicking, the imaging section title also shows 'Bildediagnostikk'
    // so there should be 2 instances (the tab button + the section title)
    const allInstances = screen.getAllByText('Bildediagnostikk');
    expect(allInstances.length).toBeGreaterThanOrEqual(2);
  });

  it('shows imaging section only for radiology referral type', () => {
    renderComponent();

    // Default type is 'gp' - no imaging section
    expect(screen.queryByText('Type undersøkelse')).not.toBeInTheDocument();

    // Switch to radiology
    const radiologyBtn = screen.getByText('Bildediagnostikk');
    fireEvent.click(radiologyBtn);

    // Imaging section should appear
    expect(screen.getByText('Type undersøkelse')).toBeInTheDocument();
  });

  it('pre-fills patient data when patientData prop is provided', () => {
    const patientData = {
      name: 'Per Hansen',
      personalId: '01019912345',
    };
    renderComponent({ patientData });

    expect(screen.getByDisplayValue('Per Hansen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('01019912345')).toBeInTheDocument();
  });

  it('pre-fills sender data when senderData prop is provided', () => {
    const senderData = {
      name: 'Dr. Kirsten',
      hprNumber: 'HPR-99999',
    };
    renderComponent({ senderData });

    // Sender section is defaultOpen=false, open it
    const senderButton = screen.getByText('Fra');
    fireEvent.click(senderButton);

    expect(screen.getByDisplayValue('Dr. Kirsten')).toBeInTheDocument();
    expect(screen.getByDisplayValue('HPR-99999')).toBeInTheDocument();
  });

  it('toggles preview mode when Forhåndsvis is clicked', () => {
    renderComponent();
    const previewButton = screen.getByText('Forhåndsvis');

    // Click to show preview
    fireEvent.click(previewButton);
    expect(screen.getByText(/HENVISNING/)).toBeInTheDocument();

    // Click again to return to edit mode
    fireEvent.click(previewButton);
    expect(screen.getByText('Pasientopplysninger')).toBeInTheDocument();
  });

  it('calls onSave when the save button is clicked', () => {
    const onSave = vi.fn();
    renderComponent({ onSave });

    const saveButton = screen.getByText('Lagre');
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'gp',
        priority: 'routine',
        patient: expect.any(Object),
        clinical: expect.any(Object),
        sender: expect.any(Object),
      })
    );
  });

  it('renders footer action buttons (copy, print, save)', () => {
    renderComponent();
    expect(screen.getByText('Kopier')).toBeInTheDocument();
    expect(screen.getByText('Skriv ut')).toBeInTheDocument();
    expect(screen.getByText('Lagre')).toBeInTheDocument();
  });

  it('selects urgent priority and applies correct styling', () => {
    renderComponent();
    const urgentBtn = screen.getByText('Haster');
    fireEvent.click(urgentBtn);

    // Urgent button should have ring-red styling
    expect(urgentBtn.className).toContain('ring-red');
  });
});
