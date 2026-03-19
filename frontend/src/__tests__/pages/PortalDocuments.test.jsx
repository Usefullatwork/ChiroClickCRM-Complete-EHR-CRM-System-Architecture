/**
 * PortalDocuments Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock the api module
vi.mock('../../services/api', () => ({
  patientPortalAPI: {
    getDocuments: vi.fn(),
    downloadDocument: vi.fn(),
  },
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    scope: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import PortalDocuments from '../../pages/portal/PortalDocuments';
import { patientPortalAPI } from '../../services/api';

const renderPage = () => {
  return render(
    <BrowserRouter>
      <PortalDocuments />
    </BrowserRouter>
  );
};

describe('PortalDocuments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no documents', async () => {
    patientPortalAPI.getDocuments.mockResolvedValue({ data: { documents: [] } });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ingen dokumenter ennå')).toBeDefined();
    });
  });

  it('should render document list', async () => {
    patientPortalAPI.getDocuments.mockResolvedValue({
      data: {
        documents: [
          {
            id: 'doc-1',
            title: 'Behandlingssammendrag',
            documentType: 'treatment_summary',
            createdAt: '2026-03-19T10:00:00Z',
            expired: false,
            downloadedAt: null,
            downloadToken: 'token-123',
          },
        ],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Behandlingssammendrag').length).toBeGreaterThan(0);
    });
  });

  it('should show expired state for expired documents', async () => {
    patientPortalAPI.getDocuments.mockResolvedValue({
      data: {
        documents: [
          {
            id: 'doc-2',
            title: 'Henvisning',
            documentType: 'referral_letter',
            createdAt: '2026-03-10T10:00:00Z',
            expired: true,
            downloadedAt: null,
            downloadToken: null,
          },
        ],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Utløpt')).toBeDefined();
    });
  });

  it('should show loading state initially', () => {
    patientPortalAPI.getDocuments.mockReturnValue(new Promise(() => {})); // never resolves

    renderPage();

    expect(screen.getByText('Laster dokumenter...')).toBeDefined();
  });

  it('should show error state on failure', async () => {
    patientPortalAPI.getDocuments.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Kunne ikke laste dokumenter')).toBeDefined();
    });
  });
});
