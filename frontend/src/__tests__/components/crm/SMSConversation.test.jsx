/**
 * SMSConversation Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/messagingService', () => ({
  getConversations: vi.fn().mockReturnValue({}),
  sendSMS: vi.fn().mockResolvedValue({}),
  markConversationRead: vi.fn(),
  formatNorwegianPhone: vi.fn((phone) => phone),
  MESSAGE_STATUS: { DELIVERED: 'DELIVERED', SENT: 'SENT', FAILED: 'FAILED' },
  DEFAULT_TEMPLATES: {},
  formatMessage: vi.fn((msg) => msg),
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

import SMSConversation, {
  UnreadBadge,
  ConversationPreview,
} from '../../../components/crm/SMSConversation';

describe('SMSConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the conversation panel with title', () => {
    render(<SMSConversation language="en" />);
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('renders Norwegian title when language is no', () => {
    render(<SMSConversation language="no" />);
    expect(screen.getByText('Meldinger')).toBeInTheDocument();
  });

  it('shows empty state when no conversations', () => {
    render(<SMSConversation language="en" />);
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('shows select conversation prompt when none selected', () => {
    render(<SMSConversation language="en" />);
    expect(screen.getByText('Select a conversation to start messaging')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<SMSConversation language="en" />);
    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
  });

  it('renders Norwegian search placeholder', () => {
    render(<SMSConversation language="no" />);
    expect(screen.getByPlaceholderText('Søk i samtaler...')).toBeInTheDocument();
  });
});

describe('UnreadBadge', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<UnreadBadge />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ConversationPreview', () => {
  it('renders the preview widget with title', () => {
    render(<ConversationPreview language="en" />);
    expect(screen.getByText('Recent Messages')).toBeInTheDocument();
  });

  it('renders Norwegian title', () => {
    render(<ConversationPreview language="no" />);
    expect(screen.getByText('Nylige Meldinger')).toBeInTheDocument();
  });
});
