/**
 * IntegrationSettings Component Tests
 *
 * Tests integration cards: SolvIt, Google Drive, Google Contacts, Stripe, API Access
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}));

vi.mock('lucide-react', () => ({
  Key: () => <span>Key</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  Download: () => <span>Download</span>,
  Info: () => <span>Info</span>,
  Clock: () => <span>Clock</span>,
}));

import IntegrationSettings from '../../../components/settings/IntegrationSettings';

const mockT = (key, fallback) => {
  const map = {
    solvitIntegration: 'SolvIt Integrasjon',
    solvitDesc: 'Koble til SolvIt journalsystem',
    googleDriveIntegration: 'Google Drive',
    googleDriveDesc: 'Sikkerhetskopi av dokumenter',
    stripeIntegration: 'Stripe Betaling',
    stripeDesc: 'Online betaling for pasienter',
    apiAccess: 'API-tilgang',
    apiAccessDesc: 'Programmatisk tilgang til data',
    apiComingSoon: 'API kommer snart',
    apiComingSoonDesc: 'REST API for integrasjoner er under utvikling',
  };
  return map[key] || fallback || key;
};

const renderWithProviders = (props = {}) => {
  return render(
    <BrowserRouter>
      <IntegrationSettings t={mockT} {...props} />
    </BrowserRouter>
  );
};

describe('IntegrationSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should render the SolvIt integration card', () => {
    renderWithProviders();
    expect(screen.getByText('SolvIt Integrasjon')).toBeInTheDocument();
    expect(screen.getByText('Koble til SolvIt journalsystem')).toBeInTheDocument();
  });

  it('should show not configured status for SolvIt', () => {
    renderWithProviders();
    // tCommon('notConfigured') returns the key string from mock; fallback in component
    // uses || which won't trigger since the key string is truthy
    expect(screen.getByText('notConfigured')).toBeInTheDocument();
  });

  it('should show SOLVIT_API_KEY instruction', () => {
    renderWithProviders();
    expect(screen.getByText('SOLVIT_API_KEY')).toBeInTheDocument();
  });

  it('should render Google Drive integration card', () => {
    renderWithProviders();
    expect(screen.getByText('Google Drive')).toBeInTheDocument();
    expect(screen.getByText('Sikkerhetskopi av dokumenter')).toBeInTheDocument();
  });

  it('should show not available status for Google Drive', () => {
    renderWithProviders();
    // tCommon('notAvailable') returns the key string from mock
    expect(screen.getByText('notAvailable')).toBeInTheDocument();
  });

  it('should render Google Contacts export section', () => {
    renderWithProviders();
    expect(screen.getByText('Google Kontakter')).toBeInTheDocument();
    expect(screen.getByText('Last ned kontakter som .vcf')).toBeInTheDocument();
  });

  it('should render Stripe integration card with Planlagt status', () => {
    renderWithProviders();
    expect(screen.getByText('Stripe Betaling')).toBeInTheDocument();
    expect(screen.getByText('Planlagt')).toBeInTheDocument();
  });

  it('should render API access card', () => {
    renderWithProviders();
    expect(screen.getByText('API-tilgang')).toBeInTheDocument();
    expect(screen.getByText('API kommer snart')).toBeInTheDocument();
  });

  it('should trigger VCF export when download button is clicked', async () => {
    const mockBlob = new Blob(['vcf-data'], { type: 'text/vcard' });
    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    renderWithProviders();
    const downloadBtn = screen.getByText('Last ned kontakter som .vcf');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/patients/export/vcf', {
        credentials: 'include',
      });
    });
  });

  it('should handle VCF export failure gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));
    renderWithProviders();
    const downloadBtn = screen.getByText('Last ned kontakter som .vcf');
    // Should not throw
    fireEvent.click(downloadBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should show desktop mode info for Google Drive', () => {
    renderWithProviders();
    expect(screen.getByText(/Ikke tilgjengelig i skrivebordsmodus/)).toBeInTheDocument();
  });
});
