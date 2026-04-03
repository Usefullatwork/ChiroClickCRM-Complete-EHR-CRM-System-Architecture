/**
 * OrganizationSettings Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrganizationSettings from '../../../components/settings/OrganizationSettings';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));
vi.mock('../../../lib/utils', () => ({
  formatDate: (date, fmt) => '01.01.2026 10:00',
}));
vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('OrganizationSettings Component', () => {
  const t = (key, fallback) => {
    const translations = {
      organizationInfo: 'Organisasjonsinformasjon',
      edit: 'Rediger',
      cancel: 'Avbryt',
      save: 'Lagre',
      saving: 'Lagrer...',
      orgName: 'Organisasjonsnavn',
      email: 'E-post',
      clinicPhone: 'Telefon',
      website: 'Nettside',
      clinicAddress: 'Adresse',
      created: 'Opprettet',
      kioskTitle: 'Kioskmodus',
      kioskDescription: 'Selvbetjening for pasienter',
      kioskLaunchDescription: 'Start kiosk for pasienter i venterommet',
      kioskFeature1: 'Innsjekking',
      kioskFeature2: 'Skjemautfylling',
      kioskFeature3: 'Samtykke',
      kioskFeature4: 'Betalingsstatus',
      launchKiosk: 'Start kiosk',
      copyKioskUrl: 'Kopier URL',
      kioskUrlCopied: 'URL kopiert',
      fullscreenTip: 'Tips',
      fullscreenDescription: 'Bruk {key} for fullskjerm',
    };
    return translations[key] || fallback || key;
  };

  const organization = {
    name: 'Test Clinic',
    email: 'clinic@test.com',
    phone: '+47 12345678',
    website: 'https://testclinic.no',
    address: 'Testveien 1, 0001 Oslo',
    created_at: '2026-01-01T10:00:00Z',
  };

  const defaultProps = {
    t,
    organization,
    orgLoading: false,
    editMode: false,
    formData: {},
    setFormData: vi.fn(),
    handleEdit: vi.fn(),
    handleCancel: vi.fn(),
    handleSave: vi.fn(),
    updateOrgMutation: { isLoading: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BASIC RENDERING (VIEW MODE)
  // =========================================================================

  it('should render organization info heading', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('Organisasjonsinformasjon')).toBeInTheDocument();
  });

  it('should display organization name', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });

  it('should display email', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('clinic@test.com')).toBeInTheDocument();
  });

  it('should display phone', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('+47 12345678')).toBeInTheDocument();
  });

  it('should display website', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('https://testclinic.no')).toBeInTheDocument();
  });

  it('should display address', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('Testveien 1, 0001 Oslo')).toBeInTheDocument();
  });

  it('should show created date', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText(/Opprettet/)).toBeInTheDocument();
  });

  // =========================================================================
  // EDIT BUTTON
  // =========================================================================

  it('should show edit button in view mode', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('Rediger')).toBeInTheDocument();
  });

  it('should call handleEdit when edit button is clicked', () => {
    render(<OrganizationSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Rediger'));
    expect(defaultProps.handleEdit).toHaveBeenCalledWith(organization);
  });

  // =========================================================================
  // EDIT MODE
  // =========================================================================

  it('should show form fields in edit mode', () => {
    render(
      <OrganizationSettings
        {...defaultProps}
        editMode={true}
        formData={{
          name: 'Test Clinic',
          email: 'clinic@test.com',
          phone: '',
          website: '',
          address: '',
        }}
      />
    );
    // Should have input fields
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('should show save and cancel buttons in edit mode', () => {
    render(
      <OrganizationSettings
        {...defaultProps}
        editMode={true}
        formData={{ name: '', email: '', phone: '', website: '', address: '' }}
      />
    );
    expect(screen.getByText('Lagre')).toBeInTheDocument();
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
  });

  it('should call handleSave when save is clicked', () => {
    render(
      <OrganizationSettings
        {...defaultProps}
        editMode={true}
        formData={{ name: 'New Name', email: '', phone: '', website: '', address: '' }}
      />
    );
    fireEvent.click(screen.getByText('Lagre'));
    expect(defaultProps.handleSave).toHaveBeenCalledTimes(1);
  });

  it('should call handleCancel when cancel is clicked', () => {
    render(
      <OrganizationSettings
        {...defaultProps}
        editMode={true}
        formData={{ name: '', email: '', phone: '', website: '', address: '' }}
      />
    );
    fireEvent.click(screen.getByText('Avbryt'));
    expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  it('should show loading spinner when orgLoading is true', () => {
    const { container } = render(<OrganizationSettings {...defaultProps} orgLoading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should not render content when orgLoading is true', () => {
    render(<OrganizationSettings {...defaultProps} orgLoading={true} />);
    expect(screen.queryByText('Organisasjonsinformasjon')).not.toBeInTheDocument();
  });

  // =========================================================================
  // KIOSK SECTION
  // =========================================================================

  it('should render kiosk mode section', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('Kioskmodus')).toBeInTheDocument();
  });

  it('should render kiosk features list', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('Innsjekking')).toBeInTheDocument();
    expect(screen.getByText('Skjemautfylling')).toBeInTheDocument();
    expect(screen.getByText('Samtykke')).toBeInTheDocument();
  });

  it('should render launch kiosk button', () => {
    render(<OrganizationSettings {...defaultProps} />);
    expect(screen.getByText('Start kiosk')).toBeInTheDocument();
  });
});
