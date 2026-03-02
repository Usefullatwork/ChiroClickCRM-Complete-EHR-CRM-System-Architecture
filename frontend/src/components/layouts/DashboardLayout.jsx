import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Kanban,
  MessageSquare,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Upload,
  Brain,
  Shield,
  BookOpen,
  Settings,
  User,
  HeartHandshake,
  Menu,
  X,
  Zap,
  Search,
  UserPlus,
  CalendarPlus,
  FileText,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from '../LanguageSwitcher';
import DesktopStatusBar from '../desktop/DesktopStatusBar';
import useTheme from '../../hooks/useTheme';
import CommandPalette from '../common/CommandPalette';
import NotificationDropdown from '../common/NotificationDropdown';

// Mock user for development
const devUser = {
  firstName: 'Mads',
  lastName: 'Admin',
  fullName: 'Mads Admin',
  imageUrl: null,
};

const devOrganization = {
  name: 'ChiroClick Demo Clinic',
};

// Full list kept for export compatibility
const NAV_ITEMS = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'patients', href: '/patients', icon: Users },
  { key: 'calendar', href: '/calendar', icon: CalendarDays },
  { key: 'patientFlow', href: '/patient-flow', icon: Kanban },
  { key: 'appointments', href: '/appointments', icon: Calendar },
  { key: 'communications', href: '/communications', icon: MessageSquare },
  { key: 'followUps', href: '/follow-ups', icon: CheckCircle2 },
  { key: 'crm', href: '/crm', icon: HeartHandshake },
  { key: 'financial', href: '/financial', icon: DollarSign },
  { key: 'kpi', href: '/kpi', icon: TrendingUp },
  { key: 'macros', href: '/macros', icon: Zap },
  { key: 'templates', href: '/templates', icon: BookOpen },
  { key: 'import', href: '/import', icon: Upload },
  { key: 'aiTraining', href: '/training', icon: Brain },
  { key: 'auditLogs', href: '/audit-logs', icon: Shield },
  { key: 'settings', href: '/settings', icon: Settings },
];

export { NAV_ITEMS };

// Grouped navigation: Core items visible in sidebar
const CORE_NAV = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'patients', href: '/patients', icon: Users },
  { key: 'calendar', href: '/calendar', icon: CalendarDays },
  { key: 'patientFlow', href: '/patient-flow', icon: Kanban },
  { key: 'communications', href: '/communications', icon: MessageSquare },
  { key: 'followUps', href: '/follow-ups', icon: CheckCircle2 },
  { key: 'financial', href: '/financial', icon: DollarSign },
];

// Admin items separated visually
const ADMIN_NAV = [
  { key: 'crm', href: '/crm', icon: HeartHandshake },
  { key: 'macros', href: '/macros', icon: Zap },
  { key: 'aiTraining', href: '/training', icon: Brain },
  { key: 'settings', href: '/settings', icon: Settings },
];

// Hidden from sidebar, accessible via command palette:
// appointments, kpi, templates, import, auditLogs

function NavItem({ item, isActive, onClick, t }) {
  const active = isActive(item.href);
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'border-l-[3px] border-teal-600 bg-teal-50/60 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 ml-0 pl-[9px]'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-teal-600 dark:text-teal-400' : ''}`} />
        {t(item.key)}
      </Link>
    </li>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('navigation');
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const user = devUser;
  const organization = devOrganization;

  const isActive = useCallback(
    (href) => {
      if (href === '/') return location.pathname === '/';
      return location.pathname.startsWith(href);
    },
    [location.pathname]
  );

  // Global Ctrl+K handler for command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">ChiroClickCRM</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-200"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <NotificationDropdown />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-200"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile slide-out overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ChiroClickCRM</h2>
              {organization && (
                <p className="text-xs text-gray-500 dark:text-gray-200 mt-0.5">
                  {organization.name}
                </p>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-200"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
            <ul className="space-y-1">
              {CORE_NAV.map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  onClick={() => setMobileMenuOpen(false)}
                  t={t}
                />
              ))}
            </ul>
            <div className="my-3 mx-3 border-t border-gray-200 dark:border-gray-700" />
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Admin
            </p>
            <ul className="space-y-1">
              {ADMIN_NAV.map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  onClick={() => setMobileMenuOpen(false)}
                  t={t}
                />
              ))}
            </ul>
          </nav>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-200"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? '\u2600' : '\u263E'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.fullName || user?.firstName || 'Mads Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-200">{t('practitioner')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          {/* Logo & Organization */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ChiroClickCRM</h1>
            {organization && (
              <p className="text-xs text-gray-500 dark:text-gray-200 mt-1">{organization.name}</p>
            )}
          </div>

          {/* Navigation - Core */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
            <ul className="space-y-0.5">
              {CORE_NAV.map((item) => (
                <NavItem key={item.key} item={item} isActive={isActive} t={t} />
              ))}
            </ul>

            {/* Admin separator */}
            <div className="my-3 mx-3 border-t border-gray-200 dark:border-gray-700" />
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Admin
            </p>
            <ul className="space-y-0.5">
              {ADMIN_NAV.map((item) => (
                <NavItem key={item.key} item={item} isActive={isActive} t={t} />
              ))}
            </ul>
          </nav>

          {/* Language Switcher + Dark Mode + User Profile */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 flex items-center justify-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-200"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? '\u2600' : '\u263E'}
              </button>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.fullName || user?.firstName || 'Mads Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-200">{t('practitioner')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Desktop top bar with quick actions */}
      <div className="hidden md:flex md:ml-64 items-center justify-between px-6 h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        {/* Search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>{t('searchPlaceholder', 'Sok...')}</span>
          <kbd className="ml-4 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick actions + notifications */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/patients/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('newPatient')}
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden lg:inline">{t('newPatient')}</span>
          </button>
          <button
            onClick={() => navigate('/calendar?new=true')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('newAppointment')}
          >
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden lg:inline">{t('newAppointment')}</span>
          </button>
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('encounter', 'Ny journal')}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">{t('encounter', 'Ny journal')}</span>
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          <NotificationDropdown />
        </div>
      </div>

      {/* Main content - full width on mobile, with left margin on desktop */}
      <div id="main-content" className="md:ml-64 flex-1">
        <Outlet />
      </div>

      {/* Desktop status bar */}
      <div className="md:ml-64">
        <DesktopStatusBar />
      </div>

      {/* Command Palette - global overlay */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}
