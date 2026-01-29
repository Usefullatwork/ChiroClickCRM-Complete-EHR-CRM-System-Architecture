/**
 * DirectionPopup - Shared popup component for direction/finding selection
 *
 * Used by both 2D and 3D spine components for consistent UX
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { STANDARD_DIRECTIONS, SI_DIRECTIONS, FINDING_TYPES } from '../hooks/useAnatomyClick';

export default function DirectionPopup({
  segment,
  position,
  templates = {},
  onSelect,
  onClose,
  mode = 'direction', // 'direction' for text insertion, 'finding' for examination
  language = 'NO'
}) {
  const popupRef = useRef(null);

  // Determine available directions
  const isSIJoint = segment?.startsWith('SI-') || segment?.includes('Ilium');
  const directions = useMemo(() => {
    const allDirections = isSIJoint
      ? [...STANDARD_DIRECTIONS, ...SI_DIRECTIONS]
      : STANDARD_DIRECTIONS;

    // If we have templates, filter to only those with templates
    const segmentTemplates = templates?.[segment] || [];
    if (segmentTemplates.length > 0) {
      const templateDirections = new Set(segmentTemplates.map(t => t.direction));
      return allDirections.filter(d => templateDirections.has(d.id));
    }

    return allDirections;
  }, [segment, templates, isSIJoint]);

  // Get template text for direction
  const getTemplateText = (directionId) => {
    const segmentTemplates = templates?.[segment] || [];
    const template = segmentTemplates.find(t => t.direction === directionId);
    return template?.text_template || `${segment} ${directionId}. `;
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!segment) return null;

  const positionStyle = {
    top: position.top,
    ...(position.left != null ? { left: position.left } : {}),
    ...(position.right != null ? { right: position.right } : {}),
    transform: 'translateY(-50%)'
  };

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden min-w-[160px]"
      style={positionStyle}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">{segment}</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Direction mode */}
      {mode === 'direction' && (
        <div className="p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {directions.map((dir) => (
              <button
                key={dir.id}
                onClick={() => {
                  onSelect(getTemplateText(dir.id));
                  onClose();
                }}
                className="px-2 py-2 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:bg-emerald-300 transition-colors"
                title={language === 'NO' ? dir.title : dir.titleEn}
              >
                {language === 'NO' ? dir.label : dir.labelEn}
              </button>
            ))}
          </div>

          {/* Quick hint */}
          <p className="text-[10px] text-slate-400 text-center mt-2">
            {language === 'NO' ? 'Klikk for å sette inn tekst' : 'Click to insert text'}
          </p>
        </div>
      )}

      {/* Finding mode */}
      {mode === 'finding' && (
        <div className="p-2 space-y-2">
          {Object.entries(FINDING_TYPES).map(([key, type]) => (
            <div key={key}>
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-[10px] font-medium text-slate-600">
                  {language === 'NO' ? type.labelNo : type.label}
                </span>
              </div>
              <div className="flex gap-1">
                {['left', 'right', 'bilateral', 'central'].map(side => (
                  <button
                    key={side}
                    onClick={() => {
                      onSelect({ segment, type: key, side });
                      onClose();
                    }}
                    className="flex-1 px-1.5 py-1 text-[10px] font-medium rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {side === 'left' ? 'V' :
                     side === 'right' ? 'H' :
                     side === 'bilateral' ? 'B' : 'S'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact direction buttons (inline, no popup)
export function InlineDirectionSelect({
  segment,
  templates = {},
  onSelect,
  language = 'NO'
}) {
  const isSIJoint = segment?.startsWith('SI-');
  const directions = isSIJoint
    ? [...STANDARD_DIRECTIONS, ...SI_DIRECTIONS]
    : STANDARD_DIRECTIONS;

  const getTemplateText = (directionId) => {
    const segmentTemplates = templates?.[segment] || [];
    const template = segmentTemplates.find(t => t.direction === directionId);
    return template?.text_template || `${segment} ${directionId}. `;
  };

  return (
    <div className="flex gap-0.5">
      {directions.slice(0, 5).map((dir) => (
        <button
          key={dir.id}
          onClick={() => onSelect(getTemplateText(dir.id))}
          className="w-6 h-6 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          title={language === 'NO' ? dir.title : dir.titleEn}
        >
          {language === 'NO' ? dir.label : dir.labelEn}
        </button>
      ))}
    </div>
  );
}
