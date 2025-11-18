import { Outlet, Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

export default function DashboardLayout() {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Patients', href: '/patients', icon: '👥' },
    { name: 'Appointments', href: '/appointments', icon: '📅' },
    { name: 'Communications', href: '/communications', icon: '💬' },
    { name: 'Follow-ups', href: '/follow-ups', icon: '✅' },
    { name: 'KPI', href: '/kpi', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b">
            <h1 className="text-xl font-bold text-blue-600">ChiroClickCRM</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-3 text-xl">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              <UserButton afterSignOutUrl="/" />
              <span className="ml-3 text-sm text-gray-700">Account</span>
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
