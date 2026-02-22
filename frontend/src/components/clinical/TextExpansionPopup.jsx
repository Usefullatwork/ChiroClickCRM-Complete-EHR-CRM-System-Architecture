/**
 * TextExpansionPopup - Floating dropdown for "/" template expansion
 *
 * Positioned at the cursor using a mirror-div technique.
 * Norwegian UI labels, category badges, max 8 results.
 */

import { useRef, useEffect, useCallback } from 'react';
import { Command } from 'lucide-react';

// Category badge colors
const CATEGORY_COLORS = {
  Subjektiv: 'bg-blue-100 text-blue-700',
  Objektiv: 'bg-emerald-100 text-emerald-700',
  Vurdering: 'bg-amber-100 text-amber-700',
  Plan: 'bg-purple-100 text-purple-700',
  Behandling: 'bg-rose-100 text-rose-700',
  Respons: 'bg-cyan-100 text-cyan-700',
};

const DEFAULT_BADGE = 'bg-gray-100 text-gray-600';

/**
 * Calculate caret pixel position inside a textarea using a mirror div.
 */
function getCaretCoordinates(textarea) {
  if (!textarea) return { top: 0, left: 0 };

  const mirror = document.createElement('div');
  const style = window.getComputedStyle(textarea);

  // Copy all relevant styles
  const props = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'wordSpacing',
    'textIndent',
    'textTransform',
    'whiteSpace',
    'wordWrap',
    'overflowWrap',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'boxSizing',
  ];
  props.forEach((p) => {
    mirror.style[p] = style[p];
  });

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.overflow = 'hidden';
  mirror.style.width = `${textarea.offsetWidth}px`;
  mirror.style.height = 'auto';

  // Insert text up to cursor, then a marker span
  const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
  mirror.textContent = textBeforeCursor;

  const marker = document.createElement('span');
  marker.textContent = '|';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  const coords = {
    top: markerRect.top - mirrorRect.top - textarea.scrollTop,
    left: markerRect.left - mirrorRect.left,
  };

  document.body.removeChild(mirror);
  return coords;
}

export default function TextExpansionPopup({
  suggestions,
  isOpen,
  onSelect,
  searchTerm,
  selectedIndex,
  inputRef,
  onClose,
}) {
  const menuRef = useRef(null);
  const posRef = useRef({ top: 0, left: 0 });

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Recalculate position when open/searchTerm changes
  useEffect(() => {
    if (!isOpen || !inputRef?.current) return;

    const textarea = inputRef.current;
    const rect = textarea.getBoundingClientRect();
    const caret = getCaretCoordinates(textarea);

    // Position below the caret line
    const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
    posRef.current = {
      top: rect.top + window.scrollY + caret.top + lineHeight + 4,
      left: rect.left + window.scrollX + caret.left,
    };
  }, [isOpen, searchTerm, inputRef]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const selected = menuRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, isOpen]);

  if (!isOpen || suggestions.length === 0) return null;

  // Group by category
  const grouped = {};
  suggestions.forEach((tmpl, idx) => {
    const cat = tmpl.category || 'Annet';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...tmpl, _idx: idx });
  });

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200"
      style={{ top: posRef.current.top, left: posRef.current.left }}
    >
      {/* Header */}
      <div className="sticky top-0 px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <Command className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">Maler ({suggestions.length})</span>
        <span className="ml-auto text-xs text-gray-400">Tab for å sette inn</span>
      </div>

      {/* Grouped results */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">{category}</div>
          {items.map((tmpl) => (
            <button
              key={tmpl.id || tmpl.shortcut}
              data-selected={tmpl._idx === selectedIndex}
              onClick={() => onSelect(tmpl)}
              className={`
                w-full px-3 py-2 text-left transition-colors
                ${tmpl._idx === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  /{tmpl.shortcut}
                </code>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLORS[tmpl.category] || DEFAULT_BADGE}`}
                >
                  {tmpl.category}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-gray-500 truncate">
                {tmpl.name} — {(tmpl.preview || tmpl.text || '').substring(0, 50)}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
