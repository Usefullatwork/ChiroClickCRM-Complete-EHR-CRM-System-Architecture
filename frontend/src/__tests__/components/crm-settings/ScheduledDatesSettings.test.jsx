/**
 * ScheduledDatesSettings Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
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

import ScheduledDatesSettings from '../../../components/crm-settings/ScheduledDatesSettings';

const mockSchedules = [
  {
    id: 1,
    name: 'Nyhetsbrev Januar',
    date: '2026-01-15',
    time: '10:00',
    targetAudience: 'ALL',
    channel: 'EMAIL',
    template: 'newsletter_january',
    enabled: true,
  },
  {
    id: 2,
    name: 'Påminnelse Vinterøvelser',
    date: '2026-02-01',
    time: '09:00',
    targetAudience: 'ACTIVE',
    channel: 'EMAIL',
    template: 'winter_exercises',
    enabled: false,
  },
];

describe('ScheduledDatesSettings', () => {
  let onAdd, onDelete, onToggle, onEdit;

  beforeEach(() => {
    onAdd = vi.fn();
    onDelete = vi.fn();
    onToggle = vi.fn();
    onEdit = vi.fn();
  });

  it('renders the heading', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={mockSchedules}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Planlagte Utsendelser')).toBeInTheDocument();
  });

  it('renders Legg til button', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={mockSchedules}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Legg til')).toBeInTheDocument();
  });

  it('renders schedule names', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={mockSchedules}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Nyhetsbrev Januar')).toBeInTheDocument();
    expect(screen.getByText('Påminnelse Vinterøvelser')).toBeInTheDocument();
  });

  it('renders empty state when no schedules', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={[]}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Ingen planlagte utsendelser')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={mockSchedules}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText(/Planlegg når du vil sende ut informasjon/)).toBeInTheDocument();
  });

  it('renders audience labels for schedules', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={mockSchedules}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Alle pasienter')).toBeInTheDocument();
    expect(screen.getByText('Aktive pasienter')).toBeInTheDocument();
  });

  it('opens add modal when Legg til is clicked', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={mockSchedules}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    fireEvent.click(screen.getByText('Legg til'));
    expect(screen.getByText('Ny Planlagt Utsendelse')).toBeInTheDocument();
  });

  it('renders add modal with form fields', () => {
    render(
      <ScheduledDatesSettings
        scheduledDates={mockSchedules}
        onAdd={onAdd}
        onDelete={onDelete}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
    fireEvent.click(screen.getByText('Legg til'));
    expect(screen.getByText('Navn')).toBeInTheDocument();
    expect(screen.getByText('Dato')).toBeInTheDocument();
    expect(screen.getByText('Tid')).toBeInTheDocument();
    expect(screen.getByText('Målgruppe')).toBeInTheDocument();
    expect(screen.getByText('Kanal')).toBeInTheDocument();
  });
});
