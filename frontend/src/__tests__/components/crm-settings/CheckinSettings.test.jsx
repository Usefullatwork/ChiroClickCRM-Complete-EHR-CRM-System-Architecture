/**
 * CheckinSettings Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import CheckinSettings from '../../../components/crm-settings/CheckinSettings';

const defaultSettings = {
  enabled: true,
  inactiveDays: 30,
  messageTemplate: 'Hei {name}! Vi savner deg!',
  channel: 'SMS',
  sendTime: '10:00',
  excludeWeekends: true,
  maxAttempts: 2,
  daysBetweenAttempts: 7,
};

describe('CheckinSettings', () => {
  let onChange;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it('renders the heading', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Innsjekking - Automatisk Oppfølging')).toBeInTheDocument();
  });

  it('renders enable toggle', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Aktiver automatisk innsjekking')).toBeInTheDocument();
  });

  it('renders inactive days input with current value', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    const input = screen.getByDisplayValue('30');
    expect(input).toBeInTheDocument();
  });

  it('renders channel buttons', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('E-post')).toBeInTheDocument();
  });

  it('renders send time input', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('10:00')).toBeInTheDocument();
  });

  it('renders message template textarea', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('Hei {name}! Vi savner deg!')).toBeInTheDocument();
  });

  it('renders max attempts input', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('renders exclude weekends checkbox', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Ikke send på helger')).toBeInTheDocument();
  });

  it('calls onChange when channel is switched', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    fireEvent.click(screen.getByText('E-post'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ channel: 'EMAIL' }));
  });

  it('calls onChange when toggle is clicked', () => {
    render(<CheckinSettings settings={defaultSettings} onChange={onChange} />);
    const toggleButton = screen
      .getByText('Aktiver automatisk innsjekking')
      .closest('div')
      .querySelector('button');
    fireEvent.click(toggleButton);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('disables form fields when not enabled', () => {
    render(
      <CheckinSettings settings={{ ...defaultSettings, enabled: false }} onChange={onChange} />
    );
    const disabledSection = screen
      .getByText('Antall dager uten besøk før innsjekking')
      .closest('div.space-y-4');
    expect(disabledSection).toHaveClass('opacity-50');
  });
});
