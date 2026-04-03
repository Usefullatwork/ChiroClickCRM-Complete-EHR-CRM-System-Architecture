/**
 * Breadcrumbs Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumbs from '../../../components/common/Breadcrumbs';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

// Mock useLocation to control the pathname
const mockPathname = vi.fn().mockReturnValue('/patients/123');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: mockPathname() }),
  };
});

describe('Breadcrumbs Component', () => {
  const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

  // =========================================================================
  // EXPLICIT ITEMS
  // =========================================================================

  it('should render explicit breadcrumb items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Patients', href: '/patients' },
      { label: 'John Doe', href: '/patients/123' },
    ];
    renderWithRouter(<Breadcrumbs items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render last item as current page (not a link)', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Settings', href: '/settings' },
    ];
    renderWithRouter(<Breadcrumbs items={items} />);
    const current = screen.getByText('Settings');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('should render earlier items as links', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Patients', href: '/patients' },
      { label: 'Detail', href: '/patients/1' },
    ];
    renderWithRouter(<Breadcrumbs items={items} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  // =========================================================================
  // NAV ELEMENT
  // =========================================================================

  it('should render as a nav element with aria-label', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Page', href: '/page' },
    ];
    renderWithRouter(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  // =========================================================================
  // SINGLE ITEM
  // =========================================================================

  it('should render nothing when only one breadcrumb', () => {
    const items = [{ label: 'Home', href: '/' }];
    const { container } = renderWithRouter(<Breadcrumbs items={items} />);
    expect(container.innerHTML).toBe('');
  });

  // =========================================================================
  // AUTO-GENERATED FROM PATH
  // =========================================================================

  it('should auto-generate breadcrumbs from pathname when no items provided', () => {
    mockPathname.mockReturnValue('/patients/settings');
    renderWithRouter(<Breadcrumbs />);
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('patients')).toBeInTheDocument();
    expect(screen.getByText('settings')).toBeInTheDocument();
  });
});
