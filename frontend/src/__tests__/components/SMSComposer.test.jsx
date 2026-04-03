import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock(
  'lucide-react',
  () => new Proxy({}, { get: (_, name) => (props) => <span data-testid={`icon-${name}`} /> })
);

import SMSComposer from '../../components/SMSComposer';

describe('SMSComposer', () => {
  const defaultProps = {
    recipientPhone: '+4712345678',
    recipientName: 'Kari Nordmann',
    onSend: vi.fn().mockResolvedValue({}),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onSend.mockClear();
    defaultProps.onCancel.mockClear();
  });

  it('renders the SMS header', () => {
    render(<SMSComposer {...defaultProps} />);
    expect(screen.getByText('Send SMS')).toBeInTheDocument();
  });

  it('displays recipient info', () => {
    render(<SMSComposer {...defaultProps} />);
    expect(screen.getByText(/Kari Nordmann.*\+4712345678/)).toBeInTheDocument();
  });

  it('renders message textarea', () => {
    render(<SMSComposer {...defaultProps} />);
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
  });

  it('shows character count', () => {
    render(<SMSComposer {...defaultProps} />);
    expect(screen.getByText(/0 \/ 1600 characters/)).toBeInTheDocument();
  });

  it('updates character count on input', () => {
    render(<SMSComposer {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Type your message here...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(screen.getByText(/5 \/ 1600 characters/)).toBeInTheDocument();
  });

  it('renders Copy Message button', () => {
    render(<SMSComposer {...defaultProps} />);
    expect(screen.getByText('Copy Message')).toBeInTheDocument();
  });

  it('renders Send via Phone Link button', () => {
    render(<SMSComposer {...defaultProps} />);
    expect(screen.getByText('Send via Phone Link')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<SMSComposer {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<SMSComposer {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('disables buttons when message is empty', () => {
    render(<SMSComposer {...defaultProps} />);
    const copyBtn = screen.getByText('Copy Message').closest('button');
    expect(copyBtn).toBeDisabled();
  });

  it('shows segment warning for long messages', () => {
    render(<SMSComposer {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Type your message here...');
    fireEvent.change(textarea, { target: { value: 'A'.repeat(200) } });
    expect(screen.getByText(/will be split into 2 parts/)).toBeInTheDocument();
  });
});
