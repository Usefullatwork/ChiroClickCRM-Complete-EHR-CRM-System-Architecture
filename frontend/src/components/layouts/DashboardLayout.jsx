import { Outlet, Link, useLocation } from 'react-router-dom'
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
  HeartHandshake
} from 'lucide-react'
import { useTranslation } from '../../i18n'
import LanguageSwitcher from '../LanguageSwitcher'

// Mock user for development
const devUser = {
  firstName: 'Mads',
  lastName: 'Admin',
  fullName: 'Mads Admin',
  imageUrl: null
}

const devOrganization = {
  name: 'ChiroClick Demo Clinic'
}

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
]

export default function DashboardLayout() {
  const location = useLocation()
  const { t } = useTranslation('navigation')

  // In dev mode without Clerk, use mock data
  const user = devUser
  const organization = devOrganization

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo & Organization */}
          <div className="px-4 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">ChiroClickCRM</h1>
            {organization && (
              <p className="text-xs text-gray-500 mt-1">{organization.name}</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <li key={item.key}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {t(item.key)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Language Switcher + User Profile */}
          <div className="border-t border-gray-200">
            <div className="px-4 py-3 flex justify-center">
              <LanguageSwitcher />
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.fullName || user?.firstName || 'Mads Admin'}
                  </p>
                  <p className="text-xs text-gray-500">{t('practitioner')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <Outlet />
      </div>
    </div>
  )
}
