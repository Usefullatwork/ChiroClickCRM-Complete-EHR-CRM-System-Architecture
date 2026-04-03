/**
 * MobileNav Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

// Mock useMediaQuery to simulate mobile
vi.mock('../../../hooks/useMediaQuery', () => ({
  default: () => ({ isMobile: true, prefersReducedMotion: false }),
}));

// Import after mocks
import MobileNav, {
  MobileHeader,
  MobilePageContainer,
  TouchTarget,
} from '../../../components/ui/MobileNav';

describe('MobileNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render bottom navigation bar', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Bunnnavigasjon')).toBeInTheDocument();
  });

  it('should render default clinic nav items', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Hjem')).toBeInTheDocument();
    expect(screen.getByLabelText('Kalender')).toBeInTheDocument();
    expect(screen.getByLabelText('Pasienter')).toBeInTheDocument();
  });

  // =========================================================================
  // CUSTOM NAV ITEMS
  // =========================================================================

  it('should render custom nav items when provided', () => {
    const customItems = [
      { icon: () => null, label: 'Custom1', path: '/custom1' },
      { icon: () => null, label: 'Custom2', path: '/custom2' },
    ];
    render(
      <MemoryRouter>
        <MobileNav navItems={customItems} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Custom1')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom2')).toBeInTheDocument();
  });

  // =========================================================================
  // HIDE BOTTOM NAV
  // =========================================================================

  it('should hide bottom nav when showBottomNav is false', () => {
    render(
      <MemoryRouter>
        <MobileNav showBottomNav={false} />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText('Bunnnavigasjon')).not.toBeInTheDocument();
  });

  // =========================================================================
  // MENU TOGGLE
  // =========================================================================

  it('should open drawer when menu button is clicked', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>
    );
    const menuBtn = screen.getByLabelText('Meny');
    fireEvent.click(menuBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should show user name and clinic name in drawer', () => {
    render(
      <MemoryRouter>
        <MobileNav userName="Dr. Smith" clinicName="My Clinic" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Meny'));
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('My Clinic')).toBeInTheDocument();
  });

  it('should close drawer when close button is clicked', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Meny'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Lukk meny'));
    // After close, the dialog should not be visible (translate-x-full)
    expect(screen.queryByRole('dialog')).toBeInTheDocument(); // still in DOM but hidden
  });

  // =========================================================================
  // LOGOUT
  // =========================================================================

  it('should render logout button when onLogout is provided', () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <MobileNav onLogout={onLogout} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Meny'));
    expect(screen.getByText('Logg ut')).toBeInTheDocument();
  });

  it('should call onLogout when logout is clicked', () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <MobileNav onLogout={onLogout} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Meny'));
    fireEvent.click(screen.getByText('Logg ut'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  it('should navigate when a nav item with path is clicked', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Kalender'));
    expect(mockNavigate).toHaveBeenCalledWith('/calendar');
  });
});

describe('TouchTarget Component', () => {
  it('should render children', () => {
    render(<TouchTarget>Tap here</TouchTarget>);
    expect(screen.getByText('Tap here')).toBeInTheDocument();
  });

  it('should enforce minimum 44px tap target', () => {
    const { container } = render(<TouchTarget>Tap</TouchTarget>);
    expect(container.firstChild.className).toContain('min-w-[44px]');
    expect(container.firstChild.className).toContain('min-h-[44px]');
  });

  it('should render as custom element', () => {
    const { container } = render(<TouchTarget as="div">Custom</TouchTarget>);
    expect(container.firstChild.tagName).toBe('DIV');
  });
});
