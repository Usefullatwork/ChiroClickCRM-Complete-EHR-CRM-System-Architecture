/**
 * useMediaQuery Hook
 * Custom hook for responsive design logic
 *
 * Provides easy access to media query states for responsive breakpoints.
 * Supports Tailwind CSS default breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
 *
 * @example
 * const { isMobile, isTablet, isDesktop } = useMediaQuery()
 * const isLargeScreen = useMediaQueryValue('(min-width: 1024px)')
 */

import { useState, useEffect, useCallback } from 'react'

// Tailwind CSS default breakpoints
export const BREAKPOINTS = {
  xs: 320,    // Extra small phones
  sm: 640,    // Small phones (landscape)
  md: 768,    // Tablets
  lg: 1024,   // Small laptops/tablets landscape
  xl: 1280,   // Desktops
  '2xl': 1536 // Large desktops
}

// Common device queries
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  touch: '(pointer: coarse)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)'
}

/**
 * Check if a media query matches
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the query matches
 */
const getMatches = (query) => {
  // Prevent SSR issues
  if (typeof window !== 'undefined') {
    return window.matchMedia(query).matches
  }
  return false
}

/**
 * Hook to check a single media query
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the query matches
 */
export function useMediaQueryValue(query) {
  const [matches, setMatches] = useState(() => getMatches(query))

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)

    const handleChange = (event) => {
      setMatches(event.matches)
    }

    // Set initial value
    setMatches(mediaQueryList.matches)

    // Modern browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange)
      return () => mediaQueryList.removeEventListener('change', handleChange)
    } else {
      // Legacy browsers (Safari < 14)
      mediaQueryList.addListener(handleChange)
      return () => mediaQueryList.removeListener(handleChange)
    }
  }, [query])

  return matches
}

/**
 * Main hook providing all common responsive breakpoints
 * @returns {Object} Object containing various responsive states
 */
export default function useMediaQuery() {
  // Core breakpoint states
  const isMobile = useMediaQueryValue(MEDIA_QUERIES.mobile)
  const isTablet = useMediaQueryValue(MEDIA_QUERIES.tablet)
  const isDesktop = useMediaQueryValue(MEDIA_QUERIES.desktop)

  // Device capabilities
  const isTouchDevice = useMediaQueryValue(MEDIA_QUERIES.touch)
  const prefersReducedMotion = useMediaQueryValue(MEDIA_QUERIES.reducedMotion)
  const prefersDarkMode = useMediaQueryValue(MEDIA_QUERIES.darkMode)

  // Orientation
  const isPortrait = useMediaQueryValue(MEDIA_QUERIES.portrait)
  const isLandscape = useMediaQueryValue(MEDIA_QUERIES.landscape)

  // Granular breakpoints (min-width based, like Tailwind)
  const isSmUp = useMediaQueryValue(`(min-width: ${BREAKPOINTS.sm}px)`)
  const isMdUp = useMediaQueryValue(`(min-width: ${BREAKPOINTS.md}px)`)
  const isLgUp = useMediaQueryValue(`(min-width: ${BREAKPOINTS.lg}px)`)
  const isXlUp = useMediaQueryValue(`(min-width: ${BREAKPOINTS.xl}px)`)
  const is2xlUp = useMediaQueryValue(`(min-width: ${BREAKPOINTS['2xl']}px)`)

  // Utility function to get current breakpoint name
  const getCurrentBreakpoint = useCallback(() => {
    if (is2xlUp) return '2xl'
    if (isXlUp) return 'xl'
    if (isLgUp) return 'lg'
    if (isMdUp) return 'md'
    if (isSmUp) return 'sm'
    return 'xs'
  }, [isSmUp, isMdUp, isLgUp, isXlUp, is2xlUp])

  return {
    // Primary device types
    isMobile,
    isTablet,
    isDesktop,

    // Tailwind-style breakpoints (min-width)
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
    is2xlUp,

    // Device capabilities
    isTouchDevice,
    prefersReducedMotion,
    prefersDarkMode,

    // Orientation
    isPortrait,
    isLandscape,

    // Utilities
    getCurrentBreakpoint,
    breakpoint: getCurrentBreakpoint(),

    // Raw breakpoint values for custom logic
    breakpoints: BREAKPOINTS
  }
}

/**
 * Hook to get window dimensions (with debounce for performance)
 * @param {number} delay - Debounce delay in ms (default: 100)
 * @returns {Object} Window width and height
 */
export function useWindowSize(delay = 100) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  useEffect(() => {
    let timeoutId = null

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }, delay)
    }

    window.addEventListener('resize', handleResize)

    // Set initial size
    handleResize()

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [delay])

  return windowSize
}

/**
 * Hook to detect if element is in viewport
 * Useful for lazy loading and animations
 * @param {RefObject} ref - React ref to the element
 * @param {Object} options - IntersectionObserver options
 * @returns {boolean} Whether element is in viewport
 */
export function useInViewport(ref, options = {}) {
  const [isInViewport, setIsInViewport] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isInViewport
}

/**
 * Hook to detect scroll direction
 * Useful for hiding/showing navigation on scroll
 * @returns {Object} Scroll direction and position
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up')
  const [scrollY, setScrollY] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setScrollDirection('down')
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up')
      }

      setScrollY(currentScrollY)
      setIsScrolled(currentScrollY > 10)
      lastScrollY = currentScrollY
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll)

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { scrollDirection, scrollY, isScrolled }
}
