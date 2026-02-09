import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from '../LanguageSwitcher';
import DesktopStatusBar from '../desktop/DesktopStatusBar';
import useTheme from '../../hooks/useTheme';

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
  { key: 'templates', href: '/templates', icon: BookOpen },
  { key: 'import', href: '/import', icon: Upload },
  { key: 'aiTraining', href: '/training', icon: Brain },
  { key: 'auditLogs', href: '/audit-logs', icon: Shield },
  { key: 'settings', href: '/settings', icon: Settings },
];

export { NAV_ITEMS };

export default function DashboardLayout() {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = devUser;
  const organization = devOrganization;

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">ChiroClickCRM</h1>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-200"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
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
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
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
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
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

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      to={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
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
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Main content - full width on mobile, with left margin on desktop */}
      <div id="main-content" className="md:ml-64 flex-1">
        <Outlet />
      </div>

      {/* Desktop status bar */}
      <div className="md:ml-64">
        <DesktopStatusBar />
      </div>
    </div>
  );
}
