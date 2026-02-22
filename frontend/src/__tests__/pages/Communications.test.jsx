/**
 * Communications Page Tests (SMSConversation / BulkCommunication equivalent)
 *
 * Tests compose, message type toggle, patient search, templates, history
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  communicationsAPI: {
    getTemplates: vi.fn(),
    getAll: vi.fn(),
    sendSMS: vi.fn(),
    sendEmail: vi.fn(),
  },
  patientsAPI: {
    search: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        title: 'Communications',
        subtitle: 'Send and manage patient communications',
        compose: 'Compose',
        history: 'History',
        messageType: 'Message Type',
        recipient: 'Recipient',
        message: 'Message',
        searchPatients: 'Search patients...',
        searching: 'Searching...',
        noPatientsFound: 'No patients found',
        noEmailOnFile: 'No email on file',
        typeMessageSms: 'Type your SMS message...',
        typeMessageEmail: 'Type your email message...',
        logMessage: 'Log Message',
        logging: 'Logging...',
        loggedSuccess: '{type} logged successfully',
        logFailed: 'Failed to log {type}',
        selectPatientWarning: 'Please select a patient first',
        enterMessageWarning: 'Please enter a message',
        copyToClipboard: 'Copy to Clipboard',
        copied: 'Copied!',
        messageTemplates: 'Message Templates',
        noTemplates: 'No templates available',
        allMessages: 'All Messages',
        smsOnly: 'SMS Only',
        emailOnly: 'Email Only',
        loadingHistory: 'Loading history...',
        noMessagesSent: 'No messages sent yet',
        templateLabel: 'Template',
        byLabel: 'By',
        system: 'System',
        charactersRemaining: '{count} characters remaining',
        smsCount: '{count} SMS message',
        smsCountPlural: '{count} SMS messages',
        smsNote: 'SMS messages are logged for records only.',
        sendEmail: 'Send Email',
      };
      return map[key] || key;
    },
    lang: 'no',
  }),
  formatDate: () => '15. feb 2026',
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  default: { scope: () => ({ error: vi.fn() }), error: vi.fn() },
}));

vi.mock('../../lib/utils', () => ({
  formatPhone: (p) => p || '-',
}));

vi.mock('lucide-react', () => ({
  MessageSquare: () => <span>MessageSquare</span>,
  Send: () => <span>Send</span>,
  Copy: () => <span>Copy</span>,
  Check: () => <span>Check</span>,
  Search: () => <span>Search</span>,
  X: () => <span>X</span>,
  FileText: () => <span>FileText</span>,
  Clock: () => <span>Clock</span>,
  User: () => <span>User</span>,
  Filter: () => <span>Filter</span>,
  Mail: () => <span>Mail</span>,
  Smartphone: () => <span>Smartphone</span>,
}));

import Communications from '../../pages/Communications';
import { communicationsAPI, patientsAPI } from '../../services/api';

const mockTemplates = [
  {
    id: 't1',
    name: 'Pamelsebekreftelse',
    type: 'SMS',
    content: 'Hei {{first_name}}, din time er bekreftet.',
  },
  {
    id: 't2',
    name: 'Oppfolgings-epost',
    type: 'EMAIL',
    content: 'Hei {{full_name}}, takk for ditt besok.',
  },
];

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

describe('Communications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    communicationsAPI.getTemplates.mockResolvedValue({ data: { templates: mockTemplates } });
    communicationsAPI.getAll.mockResolvedValue({ data: { communications: [] } });
    patientsAPI.search.mockResolvedValue({ data: { patients: [] } });
  });

  it('should render the page title', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByText('Communications')).toBeInTheDocument();
    expect(screen.getByText('Send and manage patient communications')).toBeInTheDocument();
  });

  it('should show Compose and History tabs', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByText('Compose')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should show SMS and Email type selectors', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByText('SMS')).toBeInTheDocument();
    // The Email label is derived from the sendEmail translation with "Send " replaced
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should show patient search input', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByPlaceholderText('Search patients...')).toBeInTheDocument();
  });

  it('should show message textarea', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByPlaceholderText('Type your SMS message...')).toBeInTheDocument();
  });

  it('should display SMS character counter', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByText('160 characters remaining')).toBeInTheDocument();
  });

  it('should show Copy to Clipboard button', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
  });

  it('should show Log Message button', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByText('Log Message')).toBeInTheDocument();
  });

  it('should show message templates section', async () => {
    renderWithProviders(<Communications />);

    await waitFor(() => {
      expect(screen.getByText('Message Templates')).toBeInTheDocument();
    });
  });

  it('should switch to History tab and show filter', async () => {
    renderWithProviders(<Communications />);

    fireEvent.click(screen.getByText('History'));

    await waitFor(() => {
      expect(screen.getByText('All Messages')).toBeInTheDocument();
    });
  });

  it('should show SMS note disclaimer', () => {
    renderWithProviders(<Communications />);
    expect(screen.getByText('SMS messages are logged for records only.')).toBeInTheDocument();
  });
});
