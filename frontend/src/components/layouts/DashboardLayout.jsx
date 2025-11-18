import { Outlet, Link, useLocation } from 'react-router-dom'
import { UserButton, useUser, useOrganization } from '@clerk/clerk-react'
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Upload,
  Settings
} from 'lucide-react'

export default function DashboardLayout() {
  const location = useLocation()
  const { user } = useUser()
  const { organization } = useOrganization()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Communications', href: '/communications', icon: MessageSquare },
    { name: 'Follow-ups', href: '/follow-ups', icon: CheckCircle2 },
    { name: 'KPI', href: '/kpi', icon: TrendingUp },
    { name: 'Import', href: '/import', icon: Upload },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

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
              {navigation.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-xs text-gray-500">Practitioner</p>
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
