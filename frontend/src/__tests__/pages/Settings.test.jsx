/**
 * Settings Page (CRMSettings) Tests
 *
 * Tests settings tabs, organization data, clinical prefs, and save
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  organizationAPI: {
    getCurrent: vi.fn(),
    update: vi.fn(),
    getUsers: vi.fn(),
    inviteUser: vi.fn(),
  },
  usersAPI: {
    getCurrent: vi.fn(),
    update: vi.fn(),
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        settings: 'Settings',
        title: 'Settings',
        manageSettings: 'Manage your clinic settings',
        organization: 'Organization',
        profile: 'Profile',
        users: 'Brukere',
        notifications: 'Notifications',
        integrations: 'Integrations',
        aiAssistant: 'AI-assistent',
        clinical: 'Clinical',
        exercises: 'Exercises',
        orgUpdatedSuccess: 'Organization updated',
        orgUpdateFailed: 'Failed to update organization',
        profileUpdatedSuccess: 'Profile updated',
        profileUpdateFailed: 'Failed to update profile',
        userInvitedSuccess: 'User invited',
        userInviteFailed: 'Failed to invite user',
        enterEmailToInvite: 'Enter email to invite',
        enterRole: 'Enter role',
      };
      return map[key] || key;
    },
    lang: 'no',
  }),
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../components/common/Breadcrumbs', () => ({
  default: () => <nav data-testid="breadcrumbs">Breadcrumbs</nav>,
}));

// Mock lazy-loaded settings components
vi.mock('../../components/settings/OrganizationSettings', () => ({
  default: () => <div data-testid="org-settings">Organization Settings</div>,
}));

vi.mock('../../components/settings/ProfileSettings', () => ({
  default: () => <div data-testid="profile-settings">Profile Settings</div>,
}));

vi.mock('../../components/settings/UserManagement', () => ({
  default: () => <div data-testid="user-management">User Management</div>,
}));

vi.mock('../../components/settings/NotificationSettings', () => ({
  default: () => <div data-testid="notification-settings">Notification Settings</div>,
}));

vi.mock('../../components/settings/IntegrationSettings', () => ({
  default: () => <div data-testid="integration-settings">Integration Settings</div>,
}));

vi.mock('../../components/AISettings', () => ({
  default: () => <div data-testid="ai-settings">AI Settings</div>,
}));

vi.mock('../../components/settings/ClinicalSettings', () => ({
  default: () => <div data-testid="clinical-settings">Clinical Settings</div>,
}));

vi.mock('../../components/settings/ExerciseSettings', () => ({
  default: () => <div data-testid="exercise-settings">Exercise Settings</div>,
}));

vi.mock('lucide-react', () => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') {
          return true;
        }
        const Stub = (props) => <span {...props}>{String(prop)}</span>;
        Stub.displayName = String(prop);
        return Stub;
      },
    }
  );
});

import Settings from '../../pages/Settings';
import { organizationAPI, usersAPI } from '../../services/api';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizationAPI.getCurrent.mockResolvedValue({
      data: {
        organization: {
          id: 'org-1',
          name: 'KFA Majorstuen',
          email: 'post@kfamajor.no',
          phone: '+4722334455',
        },
      },
    });
    usersAPI.getCurrentUser.mockResolvedValue({
      data: {
        id: 'u1',
        full_name: 'Dr. Mads',
        email: 'mads@chiroclick.no',
        role: 'ADMIN',
      },
    });
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  it('should render settings page with breadcrumbs', () => {
    renderWithProviders(<Settings />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('should show all settings tabs', () => {
    renderWithProviders(<Settings />);
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Brukere')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
    expect(screen.getByText('AI-assistent')).toBeInTheDocument();
    expect(screen.getByText('Clinical')).toBeInTheDocument();
    // Exercises tab uses Norwegian text when lang=no
    expect(screen.getByText('Øvelser')).toBeInTheDocument();
  });

  it('should show Organization tab content by default', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByTestId('org-settings')).toBeInTheDocument();
    });
  });

  it('should switch to Profile tab when clicked', async () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByText('Profile'));

    await waitFor(() => {
      expect(screen.getByTestId('profile-settings')).toBeInTheDocument();
    });
  });

  it('should switch to Users tab when clicked', async () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByText('Brukere'));

    await waitFor(() => {
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });
  });

  it('should switch to Clinical tab when clicked', async () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByText('Clinical'));

    await waitFor(() => {
      expect(screen.getByTestId('clinical-settings')).toBeInTheDocument();
    });
  });

  it('should switch to AI tab when clicked', async () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByText('AI-assistent'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-settings')).toBeInTheDocument();
    });
  });

  it('should switch to Notifications tab when clicked', async () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByText('Notifications'));

    await waitFor(() => {
      expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
    });
  });

  it('should switch to Exercises tab when clicked', async () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByText('Øvelser'));

    await waitFor(() => {
      expect(screen.getByTestId('exercise-settings')).toBeInTheDocument();
    });
  });

  it('should fetch organization data on mount', () => {
    renderWithProviders(<Settings />);
    expect(organizationAPI.getCurrent).toHaveBeenCalled();
  });
});
