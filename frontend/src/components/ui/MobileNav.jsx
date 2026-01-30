/**
 * MobileNav Component
 * Mobile-optimized navigation with bottom tab bar and slide-out menu
 *
 * Features:
 * - Bottom navigation bar for primary actions (iOS/Android style)
 * - Slide-out drawer menu for secondary navigation
 * - Touch-friendly with 44px minimum tap targets
 * - Smooth animations with reduced motion support
 * - Safe area insets for notched devices
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  Home,
  Calendar,
  Users,
  Dumbbell,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Bell,
  Search,
  FileText,
  BarChart3,
  HelpCircle,
  Phone
} from 'lucide-react'
import useMediaQuery from '../../hooks/useMediaQuery'

/**
 * MobileNav Component
 * @param {Object} props - Component props
 * @param {Array} props.navItems - Primary navigation items for bottom bar
 * @param {Array} props.menuItems - Secondary menu items for drawer
 * @param {string} props.userName - Current user name
 * @param {string} props.clinicName - Clinic name
 * @param {Function} props.onLogout - Logout callback
 * @param {boolean} props.showBottomNav - Show bottom navigation bar
 * @param {string} props.variant - 'clinic' | 'portal' (patient portal)
 */
export default function MobileNav({
  navItems = [],
  menuItems = [],
  userName = '',
  clinicName = '',
  onLogout,
  showBottomNav = true,
  variant = 'clinic'
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, prefersReducedMotion } = useMediaQuery()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [touchStart, setTouchStart] = useState(null)

  // Default navigation items for clinic staff
  const defaultClinicNav = [
    { icon: Home, label: 'Hjem', path: '/dashboard' },
    { icon: Calendar, label: 'Kalender', path: '/calendar' },
    { icon: Users, label: 'Pasienter', path: '/patients' },
    { icon: FileText, label: 'Notater', path: '/notes' },
    { icon: Menu, label: 'Meny', action: 'menu' }
  ]

  // Default navigation items for patient portal
  const defaultPortalNav = [
    { icon: Dumbbell, label: 'Ovelser', path: '/portal/ovelser' },
    { icon: Calendar, label: 'Timer', path: '/portal/timer' },
    { icon: User, label: 'Profil', path: '/portal/profil' },
    { icon: Phone, label: 'Kontakt', action: 'contact' }
  ]

  // Use provided items or defaults
  const bottomNavItems = navItems.length > 0
    ? navItems
    : (variant === 'portal' ? defaultPortalNav : defaultClinicNav)

  // Default menu items
  const defaultMenuItems = [
    { icon: BarChart3, label: 'Statistikk', path: '/statistics' },
    { icon: Dumbbell, label: 'Ovelsesbibliotek', path: '/exercises' },
    { icon: Settings, label: 'Innstillinger', path: '/settings' },
    { icon: HelpCircle, label: 'Hjelp', path: '/help' }
  ]

  const drawerMenuItems = menuItems.length > 0 ? menuItems : defaultMenuItems

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Handle swipe to close
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    if (!touchStart) return

    const currentTouch = e.touches[0].clientX
    const diff = touchStart - currentTouch

    // Swipe left to close (on the menu itself)
    if (diff > 50) {
      setIsMenuOpen(false)
      setTouchStart(null)
    }
  }

  const handleTouchEnd = () => {
    setTouchStart(null)
  }

  // Check if path is active
  const isActive = (path) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Handle nav item click
  const handleNavClick = (item) => {
    if (item.action === 'menu') {
      setIsMenuOpen(true)
    } else if (item.action === 'contact') {
      // Could open a contact modal or call
      window.location.href = 'tel:+4712345678'
    } else if (item.path) {
      navigate(item.path)
    } else if (item.onClick) {
      item.onClick()
    }
  }

  // Don't render on desktop
  if (!isMobile) return null

  return (
    <>
      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <div className="flex items-stretch justify-around">
            {bottomNavItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <button
                  key={index}
                  onClick={() => handleNavClick(item)}
                  className={`flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-colors ${
                    active
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                  }`}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className={`w-6 h-6 ${active ? 'text-blue-600' : ''}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className={`text-xs mt-1 ${active ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div
          className={`fixed inset-0 z-50 bg-black/50 ${
            prefersReducedMotion ? '' : 'transition-opacity duration-300'
          }`}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Menu Drawer */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-[320px] bg-white shadow-2xl transform ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } ${prefersReducedMotion ? '' : 'transition-transform duration-300 ease-out'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Navigasjonsmeny"
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            {userName && (
              <p className="font-semibold text-gray-900 truncate">{userName}</p>
            )}
            {clinicName && (
              <p className="text-sm text-gray-500 truncate">{clinicName}</p>
            )}
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Lukk meny"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Search (optional) */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Sok..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-2 py-2">
            {drawerMenuItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (item.path) navigate(item.path)
                    else if (item.onClick) item.onClick()
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors min-h-[48px] ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-gray-200" />

          {/* Logout */}
          {onLogout && (
            <div className="px-2 py-2">
              <button
                onClick={() => {
                  onLogout()
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors min-h-[48px]"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Logg ut</span>
              </button>
            </div>
          )}
        </div>

        {/* Menu Footer */}
        <div
          className="p-4 border-t border-gray-200 bg-gray-50 text-center text-xs text-gray-500"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'
          }}
        >
          <p>ChiroClick CRM</p>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      {showBottomNav && (
        <div
          className="h-[56px]"
          style={{
            height: 'calc(56px + env(safe-area-inset-bottom, 0px))'
          }}
        />
      )}
    </>
  )
}

/**
 * MobileHeader Component
 * Sticky header optimized for mobile
 */
export function MobileHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  showBack = false,
  onBack,
  className = ''
}) {
  const navigate = useNavigate()
  const { prefersReducedMotion } = useMediaQuery()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      className={`sticky top-0 z-30 bg-white border-b border-gray-200 safe-area-inset-top ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Action */}
        <div className="w-12 flex justify-start">
          {showBack ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Tilbake"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
          ) : leftAction ? (
            leftAction
          ) : null}
        </div>

        {/* Title */}
        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className="font-semibold text-gray-900 truncate text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        {/* Right Action */}
        <div className="w-12 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  )
}

/**
 * MobilePageContainer Component
 * Container with proper spacing for mobile nav
 */
export function MobilePageContainer({
  children,
  hasBottomNav = true,
  hasHeader = true,
  className = ''
}) {
  return (
    <div
      className={`min-h-screen bg-gray-50 ${className}`}
      style={{
        paddingBottom: hasBottomNav
          ? 'calc(56px + env(safe-area-inset-bottom, 0px))'
          : 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {children}
    </div>
  )
}

/**
 * TouchTarget Component
 * Ensures minimum 44px touch target size
 */
export function TouchTarget({
  children,
  as: Component = 'button',
  className = '',
  ...props
}) {
  return (
    <Component
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
