/**
 * CRMSettings Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/api', () => ({
  crmAPI: {
    getSettings: vi.fn().mockResolvedValue({ data: {} }),
    updateSettings: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

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

vi.mock('../../../components/crm-settings', () => ({
  CheckinSettings: ({ settings }) => (
    <div data-testid="checkin-settings">Checkin: {settings?.inactiveDays}</div>
  ),
  ScheduledDatesSettings: ({ scheduledDates }) => (
    <div data-testid="scheduled-settings">Scheduled: {scheduledDates?.length}</div>
  ),
  LifecycleSettings: ({ settings }) => (
    <div data-testid="lifecycle-settings">Lifecycle: {settings?.newPatientDays}</div>
  ),
  NotificationSettings: ({ settings }) => (
    <div data-testid="notification-settings">
      Notifications: {settings?.appointmentReminderHours}
    </div>
  ),
  AutomationSettings: () => <div data-testid="automation-settings">Automation</div>,
}));

import CRMSettings from '../../../components/crm/CRMSettings';

describe('CRMSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    render(<CRMSettings />);
    expect(screen.getByText('Laster innstillinger...')).toBeInTheDocument();
  });

  it('renders header and section navigation after loading', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByText('CRM Innstillinger')).toBeInTheDocument();
    });
    expect(screen.getByText('Innsjekking')).toBeInTheDocument();
    expect(screen.getByText('Planlagte Utsendelser')).toBeInTheDocument();
    expect(screen.getByText('Livssyklus')).toBeInTheDocument();
    expect(screen.getByText('Varsler')).toBeInTheDocument();
    expect(screen.getByText('Automatisering')).toBeInTheDocument();
  });

  it('renders checkin settings by default', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByTestId('checkin-settings')).toBeInTheDocument();
    });
  });

  it('switches to lifecycle section when clicked', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByText('Livssyklus')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Livssyklus'));
    await waitFor(() => {
      expect(screen.getByTestId('lifecycle-settings')).toBeInTheDocument();
    });
  });

  it('switches to notification section when clicked', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByText('Varsler')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Varsler'));
    await waitFor(() => {
      expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
    });
  });

  it('switches to automation section when clicked', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByText('Automatisering')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Automatisering'));
    await waitFor(() => {
      expect(screen.getByTestId('automation-settings')).toBeInTheDocument();
    });
  });

  it('switches to scheduled dates section when clicked', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByText('Planlagte Utsendelser')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Planlagte Utsendelser'));
    await waitFor(() => {
      expect(screen.getByTestId('scheduled-settings')).toBeInTheDocument();
    });
  });

  it('does not show save button when no changes', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByText('CRM Innstillinger')).toBeInTheDocument();
    });
    expect(screen.queryByText('Lagre Endringer')).not.toBeInTheDocument();
  });

  it('renders section descriptions', async () => {
    render(<CRMSettings />);
    await waitFor(() => {
      expect(screen.getByText('Automatisk oppfølging av inaktive pasienter')).toBeInTheDocument();
    });
  });
});
