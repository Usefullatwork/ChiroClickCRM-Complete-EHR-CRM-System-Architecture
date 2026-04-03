/**
 * NotificationSettings Component Tests
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

import NotificationSettings from '../../../components/crm-settings/NotificationSettings';

const defaultSettings = {
  appointmentReminder: true,
  appointmentReminderHours: 24,
  followUpAfterVisit: true,
  followUpHours: 48,
  birthdayGreeting: true,
  birthdayChannel: 'EMAIL',
  npsAfterVisit: true,
  npsAfterVisits: 3,
};

describe('NotificationSettings', () => {
  let onChange;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it('renders the heading', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Automatiske Varsler')).toBeInTheDocument();
  });

  it('renders appointment reminder card', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Timepåminnelse')).toBeInTheDocument();
    expect(screen.getByText('Send påminnelse før avtalt time')).toBeInTheDocument();
  });

  it('renders follow-up card', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Oppfølging etter besøk')).toBeInTheDocument();
  });

  it('renders birthday greeting card', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('Bursdagshilsen')).toBeInTheDocument();
  });

  it('renders NPS survey card', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByText('NPS undersøkelse')).toBeInTheDocument();
  });

  it('renders appointment reminder hours input', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('24')).toBeInTheDocument();
    expect(screen.getByText('timer før timen')).toBeInTheDocument();
  });

  it('renders follow-up hours input', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('48')).toBeInTheDocument();
    expect(screen.getByText('timer etter besøk')).toBeInTheDocument();
  });

  it('renders NPS visits input', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByText('besøk')).toBeInTheDocument();
  });

  it('calls onChange when appointment reminder is toggled', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    const toggleButtons = screen
      .getByText('Timepåminnelse')
      .closest('div.p-4')
      .querySelector('button');
    fireEvent.click(toggleButtons);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ appointmentReminder: false }));
  });

  it('calls onChange when hours value changes', () => {
    render(<NotificationSettings settings={defaultSettings} onChange={onChange} />);
    const hoursInput = screen.getByDisplayValue('24');
    fireEvent.change(hoursInput, { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentReminderHours: 12 })
    );
  });
});
