import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PortalMessages from '../../pages/portal/PortalMessages';

vi.mock('../../services/api', () => ({
  patientPortalAPI: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markMessageRead: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key }),
}));

vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { patientPortalAPI } from '../../services/api';

describe('PortalMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    patientPortalAPI.getMessages.mockReturnValue(new Promise(() => {}));
    render(<PortalMessages />);
    // The Loader2 spinner renders as an SVG with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('shows empty state when no messages', async () => {
    patientPortalAPI.getMessages.mockResolvedValue({
      data: { messages: [], unread_count: 0 },
    });
    render(<PortalMessages />);
    await waitFor(() => {
      expect(screen.getByText('Ingen meldinger')).toBeTruthy();
    });
    expect(screen.getByText('Meldinger fra klinikken vises her')).toBeTruthy();
  });

  it('renders message list after loading', async () => {
    patientPortalAPI.getMessages.mockResolvedValue({
      data: {
        messages: [
          {
            id: '1',
            sender_type: 'CLINIC',
            subject: 'Velkommen',
            body: 'Hei, velkommen til klinikken',
            is_read: false,
            created_at: '2026-03-19T10:00:00Z',
          },
          {
            id: '2',
            sender_type: 'PATIENT',
            subject: 'Takk',
            body: 'Takk for info',
            is_read: true,
            created_at: '2026-03-19T11:00:00Z',
          },
        ],
        unread_count: 1,
      },
    });
    render(<PortalMessages />);
    await waitFor(() => {
      expect(screen.getByText('Velkommen')).toBeTruthy();
    });
    expect(screen.getByText('Takk')).toBeTruthy();
  });

  it('shows compose form when "Ny melding" clicked', async () => {
    patientPortalAPI.getMessages.mockResolvedValue({
      data: { messages: [], unread_count: 0 },
    });
    render(<PortalMessages />);
    await waitFor(() => {
      expect(screen.getByText('Ingen meldinger')).toBeTruthy();
    });
    // Click the "Ny melding" button in the header
    const newMsgButtons = screen.getAllByText('Ny melding');
    fireEvent.click(newMsgButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Emne')).toBeTruthy();
    });
    expect(screen.getByText('Melding')).toBeTruthy();
    expect(screen.getByText('Send')).toBeTruthy();
  });

  it('shows error state when loading fails', async () => {
    patientPortalAPI.getMessages.mockRejectedValue(new Error('Network error'));
    render(<PortalMessages />);
    await waitFor(() => {
      expect(screen.getByText('Kunne ikke laste meldinger')).toBeTruthy();
    });
  });
});
