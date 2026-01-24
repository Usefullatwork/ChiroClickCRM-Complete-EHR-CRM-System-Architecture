/**
 * QuickPalpationSpine - Quick-Click Spine Text Insertion Component
 *
 * A compact, always-visible right sidebar component for rapid palpation documentation.
 * Click a spine segment, select direction from popup, text is inserted into palpation field.
 *
 * Features:
 * - Compact vertical spine layout organized by region
 * - Hover over segment shows direction popup
 * - Click direction inserts pre-programmed Norwegian clinical text
 * - Visual feedback for recently used segments
 * - Loads templates from API (with defaults fallback)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { spineTemplatesAPI } from '../../services/api';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// Spine segment configuration (display purposes)
const SPINE_REGIONS = {
  cervical: {
    label: 'CERVICAL',
    segments: ['C0-C1', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']
  },
  thoracic: {
    label: 'THORACIC',
    segments: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
  },
  lumbar: {
    label: 'LUMBAR',
    segments: ['L1', 'L2', 'L3', 'L4', 'L5']
  },
  sacral: {
    label: 'SACRAL',
    segments: ['Sacrum', 'SI-L', 'SI-R', 'Coccyx']
  },
  muscle: {
    label: 'MUSKEL',
    segments: ['C-para', 'T-para', 'L-para', 'QL', 'Piriformis']
  }
};

// Direction buttons configuration
const DIRECTIONS = [
  { id: 'left', label: 'V', title: 'Venstre' },
  { id: 'right', label: 'H', title: 'Høyre' },
  { id: 'bilateral', label: 'B', title: 'Bilateral' },
  { id: 'posterior', label: 'P', title: 'Posterior' },
  { id: 'anterior', label: 'A', title: 'Anterior' }
];

// Additional directions for SI joints
const SI_DIRECTIONS = [
  { id: 'superior', label: 'S', title: 'Superior' },
  { id: 'inferior', label: 'I', title: 'Inferior' },
  { id: 'inflare', label: 'In', title: 'Inflare' },
  { id: 'outflare', label: 'Out', title: 'Outflare' }
];

/**
 * Direction Popup Component
 */
const DirectionPopup = ({ segment, templates, onSelect, onClose, position }) => {
  const popupRef = useRef(null);

  // Get available directions for this segment from templates
  const availableDirections = useMemo(() => {
    const segmentTemplates = templates?.[segment] || [];
    const directionSet = new Set(segmentTemplates.map(t => t.direction));

    // Determine which direction set to use
    const isSI = segment.startsWith('SI-');
    const baseDirections = DIRECTIONS.filter(d => directionSet.has(d.id));
    const extraDirections = isSI ? SI_DIRECTIONS.filter(d => directionSet.has(d.id)) : [];

    return [...baseDirections, ...extraDirections];
  }, [segment, templates]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Find template text for direction
  const getTemplateText = (direction) => {
    const segmentTemplates = templates?.[segment] || [];
    const template = segmentTemplates.find(t => t.direction === direction);
    return template?.text_template || `${segment} ${direction}. `;
  };

  if (availableDirections.length === 0) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-2 min-w-[140px]"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="text-xs font-semibold text-slate-600 mb-1.5 px-1">
        {segment}
      </div>
      <div className="flex flex-wrap gap-1">
        {availableDirections.map((dir) => (
          <button
            key={dir.id}
            onClick={() => {
              onSelect(getTemplateText(dir.id));
              onClose();
            }}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
            title={dir.title}
          >
            {dir.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Spine Segment Button
 */
const SegmentButton = ({ segment, isRecent, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-1 text-xs font-medium rounded transition-all
        ${isRecent
          ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
          : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700'
        }
      `}
      title={`Klikk for retningsvalg`}
    >
      {segment.replace('C0-C1', 'Occ').replace('Sacrum', 'S').replace('Coccyx', 'Cx')}
    </button>
  );
};

/**
 * Region Section
 */
const RegionSection = ({ region, segments, templates, recentSegments, onSegmentClick, expandedRegion, onToggleRegion }) => {
  const isExpanded = expandedRegion === region.label;
  const hasTemplates = segments.some(seg => templates?.[seg]?.length > 0);

  if (!hasTemplates) return null;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => onToggleRegion(region.label)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
      >
        <span>{region.label}</span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {isExpanded && (
        <div className="px-2 pb-2 flex flex-wrap gap-1">
          {segments.map((segment) => {
            const hasTemplate = templates?.[segment]?.length > 0;
            if (!hasTemplate) return null;
            return (
              <SegmentButton
                key={segment}
                segment={segment}
                isRecent={recentSegments.includes(segment)}
                onClick={(e) => onSegmentClick(segment, e)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Main QuickPalpationSpine Component
 */
export const QuickPalpationSpine = ({ onInsertText, disabled = false }) => {
  const [activeSegment, setActiveSegment] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [recentSegments, setRecentSegments] = useState([]);
  const [expandedRegion, setExpandedRegion] = useState('CERVICAL');
  const containerRef = useRef(null);

  // Fetch templates from API
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['spine-templates', 'grouped'],
    queryFn: () => spineTemplatesAPI.getGrouped('NO'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 30 * 60 * 1000
  });

  const templates = templatesData?.data?.data || {};

  // Handle segment click - show direction popup
  const handleSegmentClick = useCallback((segment, event) => {
    if (disabled) return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    setPopupPosition({
      top: rect.top - containerRect.top + rect.height / 2,
      left: rect.right - containerRect.left + 8
    });
    setActiveSegment(segment);
  }, [disabled]);

  // Handle direction selection
  const handleDirectionSelect = useCallback((text) => {
    if (onInsertText) {
      onInsertText(text);
    }

    // Track recent segment
    setRecentSegments(prev => {
      const updated = [activeSegment, ...prev.filter(s => s !== activeSegment)].slice(0, 5);
      return updated;
    });

    // Clear after brief highlight
    setTimeout(() => {
      setRecentSegments(prev => prev.filter(s => s !== activeSegment));
    }, 2000);
  }, [activeSegment, onInsertText]);

  // Close popup
  const handleClosePopup = useCallback(() => {
    setActiveSegment(null);
  }, []);

  // Toggle region expansion
  const handleToggleRegion = useCallback((regionLabel) => {
    setExpandedRegion(prev => prev === regionLabel ? null : regionLabel);
  }, []);

  if (disabled) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative bg-white border-l border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
        <h3 className="text-sm font-semibold text-emerald-800">PALPASJON</h3>
        <p className="text-[10px] text-slate-500">Rask-klikk</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Spine regions */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto">
          {Object.entries(SPINE_REGIONS).map(([key, region]) => (
            <RegionSection
              key={key}
              region={region}
              segments={region.segments}
              templates={templates}
              recentSegments={recentSegments}
              onSegmentClick={handleSegmentClick}
              expandedRegion={expandedRegion}
              onToggleRegion={handleToggleRegion}
            />
          ))}
        </div>
      )}

      {/* Direction popup */}
      {activeSegment && (
        <DirectionPopup
          segment={activeSegment}
          templates={templates}
          onSelect={handleDirectionSelect}
          onClose={handleClosePopup}
          position={popupPosition}
        />
      )}

      {/* Usage hint */}
      <div className="px-2 py-1.5 bg-slate-50 border-t border-slate-200">
        <p className="text-[9px] text-slate-400 text-center">
          Klikk segment → Velg retning → Tekst settes inn
        </p>
      </div>
    </div>
  );
};

export default QuickPalpationSpine;
