/**
 * AutomationSettings Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

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

import AutomationSettings from '../../../components/crm-settings/AutomationSettings';

describe('AutomationSettings', () => {
  it('renders the component heading', () => {
    render(<AutomationSettings />);
    expect(screen.getByText('Automatisering')).toBeInTheDocument();
  });

  it('renders the info banner about workflows', () => {
    render(<AutomationSettings />);
    expect(screen.getByText('Automatiske arbeidsflyter')).toBeInTheDocument();
  });

  it('renders general settings heading', () => {
    render(<AutomationSettings />);
    expect(screen.getByText('Generelle innstillinger')).toBeInTheDocument();
  });

  it('renders three checkboxes', () => {
    render(<AutomationSettings />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('renders enable all automations checkbox label', () => {
    render(<AutomationSettings />);
    expect(screen.getByText('Aktiver alle automatiseringer')).toBeInTheDocument();
  });

  it('renders log all actions checkbox label', () => {
    render(<AutomationSettings />);
    expect(screen.getByText('Logg alle automatiske handlinger')).toBeInTheDocument();
  });

  it('renders copy to clinic email checkbox label', () => {
    render(<AutomationSettings />);
    expect(screen.getByText('Send kopi av alle meldinger til klinikk-e-post')).toBeInTheDocument();
  });

  it('has enable all automations checked by default', () => {
    render(<AutomationSettings />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it('checkboxes are toggleable', () => {
    render(<AutomationSettings />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]);
    expect(checkboxes[2]).toBeChecked();
  });
});
