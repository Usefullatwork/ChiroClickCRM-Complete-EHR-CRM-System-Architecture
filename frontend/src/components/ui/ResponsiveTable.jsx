/**
 * ResponsiveTable Component
 * Mobile-friendly table that adapts to different screen sizes
 *
 * Features:
 * - Horizontal scroll on mobile with fade indicators
 * - Card view option for small screens
 * - Sticky first column support
 * - Touch-friendly row actions
 * - Proper accessibility
 */

import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, ChevronUp, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import useMediaQuery from '../../hooks/useMediaQuery'

/**
 * ResponsiveTable Component
 * @param {Object} props - Component props
 * @param {Array} props.columns - Column definitions { key, label, width, sticky, hideOnMobile, render }
 * @param {Array} props.data - Table data
 * @param {Function} props.onRowClick - Callback when row is clicked
 * @param {Function} props.onView - View action callback
 * @param {Function} props.onEdit - Edit action callback
 * @param {Function} props.onDelete - Delete action callback
 * @param {string} props.emptyMessage - Message when no data
 * @param {boolean} props.loading - Loading state
 * @param {string} props.keyField - Unique key field for rows (default: 'id')
 * @param {string} props.mobileView - 'scroll' | 'cards' | 'auto'
 * @param {boolean} props.stickyHeader - Make header sticky
 * @param {boolean} props.striped - Striped rows
 */
export default function ResponsiveTable({
  columns = [],
  data = [],
  onRowClick,
  onView,
  onEdit,
  onDelete,
  emptyMessage = 'Ingen data funnet',
  loading = false,
  keyField = 'id',
  mobileView = 'auto',
  stickyHeader = true,
  striped = false,
  className = ''
}) {
  const { isMobile, isTablet } = useMediaQuery()
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [expandedRows, setExpandedRows] = useState(new Set())

  // Determine view mode
  const useCardView = mobileView === 'cards' || (mobileView === 'auto' && isMobile)

  // Check scroll position for fade indicators
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
      }
    }

    checkScroll()
    const element = scrollRef.current
    if (element) {
      element.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        element.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [data])

  // Filter columns for mobile
  const visibleColumns = isMobile
    ? columns.filter(col => !col.hideOnMobile)
    : columns

  // Toggle row expansion (for card view)
  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Has actions
  const hasActions = onView || onEdit || onDelete

  // Render loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-500">Laster data...</p>
        </div>
      </div>
    )
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      </div>
    )
  }

  // Card view for mobile
  if (useCardView) {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((row, rowIndex) => {
          const isExpanded = expandedRows.has(row[keyField])
          const primaryColumn = visibleColumns[0]
          const secondaryColumn = visibleColumns[1]

          return (
            <div
              key={row[keyField] || rowIndex}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Card Header - Always visible */}
              <button
                onClick={() => onRowClick ? onRowClick(row) : toggleRow(row[keyField])}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {primaryColumn && (
                    <div className="font-medium text-gray-900 truncate">
                      {primaryColumn.render
                        ? primaryColumn.render(row[primaryColumn.key], row)
                        : row[primaryColumn.key]}
                    </div>
                  )}
                  {secondaryColumn && (
                    <div className="text-sm text-gray-500 truncate mt-0.5">
                      {secondaryColumn.render
                        ? secondaryColumn.render(row[secondaryColumn.key], row)
                        : row[secondaryColumn.key]}
                    </div>
                  )}
                </div>

                {onRowClick ? (
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
              </button>

              {/* Card Content - Expandable */}
              {isExpanded && !onRowClick && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <dl className="space-y-2">
                    {visibleColumns.slice(2).map((col) => (
                      <div key={col.key} className="flex justify-between text-sm">
                        <dt className="text-gray-500">{col.label}</dt>
                        <dd className="text-gray-900 font-medium text-right">
                          {col.render
                            ? col.render(row[col.key], row)
                            : row[col.key] || '-'}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Actions */}
                  {hasActions && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                      {onView && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onView(row); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[44px]"
                        >
                          <Eye className="w-4 h-4" />
                          Vis
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[44px]"
                        >
                          <Edit className="w-4 h-4" />
                          Rediger
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                          className="flex items-center justify-center py-2.5 px-4 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors min-h-[44px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Standard scrollable table view
  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Scroll fade indicators */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain"
        style={{
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <table className="w-full min-w-full">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-gray-50 border-b border-gray-200">
              {visibleColumns.map((col, index) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
                    col.sticky ? 'sticky left-0 z-20 bg-gray-50' : ''
                  }`}
                  style={{
                    width: col.width,
                    minWidth: col.minWidth || (isMobile ? '120px' : undefined)
                  }}
                >
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-24 sm:w-32">
                  <span className="sr-only">Handlinger</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, rowIndex) => (
              <tr
                key={row[keyField] || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}
                  ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                  transition-colors
                `}
              >
                {visibleColumns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-gray-900 whitespace-nowrap ${
                      col.sticky ? 'sticky left-0 z-10 bg-inherit' : ''
                    } ${colIndex === 0 ? 'font-medium' : ''}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] || '-'}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {onView && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onView(row); }}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                          title="Vis"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                          title="Rediger"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                          title="Slett"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * ResponsiveDataList Component
 * Alternative list view optimized for mobile
 */
export function ResponsiveDataList({
  items = [],
  renderItem,
  emptyMessage = 'Ingen elementer funnet',
  loading = false,
  keyField = 'id',
  className = ''
}) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <div key={item[keyField] || index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

/**
 * Responsive grid wrapper that adjusts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = ''
}) {
  return (
    <div
      className={`
        grid gap-${gap}
        grid-cols-${cols.sm || 1}
        sm:grid-cols-${cols.sm || 1}
        md:grid-cols-${cols.md || 2}
        lg:grid-cols-${cols.lg || 3}
        xl:grid-cols-${cols.xl || 4}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

/**
 * Utility component for horizontal scroll containers
 */
export function HorizontalScroll({ children, className = '' }) {
  const scrollRef = useRef(null)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScroll({
          left: scrollLeft > 0,
          right: scrollLeft + clientWidth < scrollWidth - 1
        })
      }
    }

    checkScroll()
    const element = scrollRef.current
    if (element) {
      element.addEventListener('scroll', checkScroll)
      return () => element.removeEventListener('scroll', checkScroll)
    }
  }, [children])

  return (
    <div className={`relative ${className}`}>
      {canScroll.left && (
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      )}
      {canScroll.right && (
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      )}
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain flex gap-3 pb-2 -mx-4 px-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  )
}
