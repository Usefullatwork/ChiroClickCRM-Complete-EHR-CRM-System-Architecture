/**
 * QuickPalpationSpine - Quick-Click Spine Palpation with Direction Selection
 *
 * Click segment → direction buttons appear inline → click direction → text inserted
 * Simple two-click flow, no mouse movement needed.
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

// Spine segment configuration
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
    segments: ['Sacrum', 'SI-V', 'SI-H']
  },
  muscle: {
    label: 'MUSKEL',
    segments: ['C-para', 'T-para', 'L-para', 'QL', 'Piriformis']
  }
};

// Direction options
const DIRECTIONS = [
  { id: 'left', label: 'V', title: 'Venstre' },
  { id: 'right', label: 'H', title: 'Høyre' },
  { id: 'bilateral', label: 'B', title: 'Bilateral' }
];

// Text templates for each segment + direction
const getRestrictionText = (segment, direction) => {
  const segmentNames = {
    'C0-C1': 'Occiput-atlas (C0-C1)',
    'C1': 'Atlas (C1)',
    'C2': 'Axis (C2)',
    'Sacrum': 'Sacrum',
    'SI-V': 'SI-ledd venstre',
    'SI-H': 'SI-ledd høyre',
    'C-para': 'Cervical paraspinal muskulatur',
    'T-para': 'Thoracal paraspinal muskulatur',
    'L-para': 'Lumbal paraspinal muskulatur',
    'QL': 'Quadratus lumborum',
    'Piriformis': 'Piriformis'
  };

  const directionText = {
    'left': 'venstre',
    'right': 'høyre',
    'bilateral': 'bilateral'
  };

  const name = segmentNames[segment] || segment;
  const dir = directionText[direction] || '';

  return `${name} restriksjon ${dir}. `;
};

/**
 * Main QuickPalpationSpine Component
 */
export const QuickPalpationSpine = ({ onInsertText, disabled = false }) => {
  const [activeSegment, setActiveSegment] = useState(null);
  const [recentSegments, setRecentSegments] = useState([]);
  const [expandedRegions, setExpandedRegions] = useState({ cervical: true, thoracic: true, lumbar: true });

  // Click segment to show direction options
  const handleSegmentClick = useCallback((segment) => {
    if (disabled) return;
    setActiveSegment(activeSegment === segment ? null : segment);
  }, [disabled, activeSegment]);

  // Click direction to insert text
  const handleDirectionClick = useCallback((direction) => {
    if (!activeSegment || disabled) return;

    const text = getRestrictionText(activeSegment, direction);
    if (onInsertText) {
      onInsertText(text);
    }

    // Brief highlight feedback
    const seg = activeSegment;
    setRecentSegments(prev => [...new Set([seg, ...prev])].slice(0, 3));
    setTimeout(() => {
      setRecentSegments(prev => prev.filter(s => s !== seg));
    }, 1500);

    // Close direction picker
    setActiveSegment(null);
  }, [activeSegment, disabled, onInsertText]);

  const toggleRegion = (region) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  if (disabled) return null;

  return (
    <div className="bg-white border-l border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 bg-emerald-50">
        <h3 className="text-sm font-bold text-emerald-800">PALPASJON</h3>
        <p className="text-[10px] text-emerald-600">Klikk segment → velg retning</p>
      </div>

      {/* Direction picker - shows when segment is selected */}
      {activeSegment && (
        <div className="px-2 py-2 bg-emerald-100 border-b border-emerald-200 flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800">{activeSegment}:</span>
          {DIRECTIONS.map((dir) => (
            <button
              key={dir.id}
              onClick={() => handleDirectionClick(dir.id)}
              className="px-3 py-1.5 text-xs font-bold rounded bg-white text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm"
              title={dir.title}
            >
              {dir.label}
            </button>
          ))}
          <button
            onClick={() => setActiveSegment(null)}
            className="ml-auto p-1 text-emerald-600 hover:text-emerald-800"
            title="Lukk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Spine regions */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(SPINE_REGIONS).map(([key, region]) => (
          <div key={key} className="border-b border-slate-100">
            {/* Region header */}
            <button
              onClick={() => toggleRegion(key)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <span>{region.label}</span>
              {expandedRegions[key] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {/* Segments */}
            {expandedRegions[key] && (
              <div className="px-2 pb-2 flex flex-wrap gap-1">
                {region.segments.map((segment) => {
                  const isActive = activeSegment === segment;
                  const isRecent = recentSegments.includes(segment);
                  const displayName = segment
                    .replace('C0-C1', 'Occ')
                    .replace('Sacrum', 'Sac')
                    .replace('C-para', 'C-p')
                    .replace('T-para', 'T-p')
                    .replace('L-para', 'L-p')
                    .replace('Piriformis', 'Piri');

                  return (
                    <button
                      key={segment}
                      onClick={() => handleSegmentClick(segment)}
                      className={`
                        px-2 py-1 text-xs font-medium rounded transition-all cursor-pointer
                        ${isActive
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                          : isRecent
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700'
                        }
                      `}
                      title={`Klikk for å velge retning`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="px-2 py-1 bg-slate-50 border-t border-slate-100">
        <p className="text-[9px] text-slate-400 text-center">
          1. Klikk segment → 2. Klikk V/H/B
        </p>
      </div>
    </div>
  );
};

export default QuickPalpationSpine;
