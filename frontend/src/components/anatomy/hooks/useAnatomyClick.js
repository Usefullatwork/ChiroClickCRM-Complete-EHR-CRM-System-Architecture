/**
 * useAnatomyClick - Hook for handling anatomy region clicks and text insertion
 *
 * Provides unified click handling for both 2D and 3D anatomy components.
 * Manages popup state, direction selection, and template text insertion.
 */
import { useState, useCallback, useMemo } from 'react';

// Standard directions for most segments
export const STANDARD_DIRECTIONS = [
  { id: 'left', label: 'V', labelEn: 'L', title: 'Venstre', titleEn: 'Left' },
  { id: 'right', label: 'H', labelEn: 'R', title: 'Høyre', titleEn: 'Right' },
  { id: 'bilateral', label: 'B', labelEn: 'B', title: 'Bilateral', titleEn: 'Bilateral' },
  { id: 'posterior', label: 'P', labelEn: 'P', title: 'Posterior', titleEn: 'Posterior' },
  { id: 'anterior', label: 'A', labelEn: 'A', title: 'Anterior', titleEn: 'Anterior' }
];

// Additional directions for SI joints
export const SI_DIRECTIONS = [
  { id: 'superior', label: 'S', labelEn: 'S', title: 'Superior', titleEn: 'Superior' },
  { id: 'inferior', label: 'I', labelEn: 'I', title: 'Inferior', titleEn: 'Inferior' },
  { id: 'inflare', label: 'In', labelEn: 'In', title: 'Inflare', titleEn: 'Inflare' },
  { id: 'outflare', label: 'Out', labelEn: 'Out', title: 'Outflare', titleEn: 'Outflare' }
];

// Finding types for examination
export const FINDING_TYPES = {
  subluxation: { label: 'Subluxation', labelNo: 'Subluksasjon', color: '#EF4444', abbrev: 'SUB' },
  fixation: { label: 'Fixation', labelNo: 'Fiksasjon', color: '#F97316', abbrev: 'FIX' },
  restriction: { label: 'Restriction', labelNo: 'Restriksjon', color: '#EAB308', abbrev: 'REST' },
  tenderness: { label: 'Tenderness', labelNo: 'Ømhet', color: '#A855F7', abbrev: 'TTP' },
  spasm: { label: 'Muscle Spasm', labelNo: 'Muskelspasme', color: '#3B82F6', abbrev: 'SP' },
  hypermobility: { label: 'Hypermobility', labelNo: 'Hypermobilitet', color: '#10B981', abbrev: 'HYP' }
};

/**
 * Get directions available for a specific segment
 */
export function getDirectionsForSegment(segment) {
  const isSIJoint = segment?.startsWith('SI') || segment?.includes('Ilium');
  return isSIJoint
    ? [...STANDARD_DIRECTIONS, ...SI_DIRECTIONS]
    : STANDARD_DIRECTIONS;
}

/**
 * Main hook for anatomy click handling
 */
export default function useAnatomyClick({
  templates = {},
  onInsertText,
  language = 'NO'
}) {
  const [activeSegment, setActiveSegment] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, right: null });
  const [recentSegments, setRecentSegments] = useState([]);

  // Handle segment click - show direction popup
  const handleSegmentClick = useCallback((segment, event, containerRef) => {
    if (!segment) return;

    // Calculate popup position relative to container
    if (event && containerRef?.current) {
      const targetRect = event.currentTarget?.getBoundingClientRect() ||
                        { top: event.clientY, left: event.clientX, right: event.clientX, height: 0 };
      const containerRect = containerRef.current.getBoundingClientRect();

      // Determine if popup should appear on left or right
      const isLeftSide = targetRect.left < containerRect.left + containerRect.width / 2;

      setPopupPosition({
        top: targetRect.top - containerRect.top + targetRect.height / 2,
        left: isLeftSide ? targetRect.right - containerRect.left + 8 : null,
        right: isLeftSide ? null : containerRect.right - targetRect.left + 8
      });
    }

    setActiveSegment(segment);
  }, []);

  // Handle direction selection - insert text
  const handleDirectionSelect = useCallback((direction) => {
    if (!activeSegment || !onInsertText) return;

    // Get template text for this segment + direction
    const segmentTemplates = templates?.[activeSegment] || [];
    const template = segmentTemplates.find(t => t.direction === direction);
    const text = template?.text_template || `${activeSegment} ${direction}. `;

    onInsertText(text);

    // Track recent segment for visual feedback
    setRecentSegments(prev => {
      const updated = [activeSegment, ...prev.filter(s => s !== activeSegment)].slice(0, 5);
      return updated;
    });

    // Clear highlight after delay
    setTimeout(() => {
      setRecentSegments(prev => prev.filter(s => s !== activeSegment));
    }, 2000);

    setActiveSegment(null);
  }, [activeSegment, templates, onInsertText]);

  // Close popup
  const closePopup = useCallback(() => {
    setActiveSegment(null);
  }, []);

  // Check if segment was recently used
  const isRecentSegment = useCallback((segment) => {
    return recentSegments.includes(segment);
  }, [recentSegments]);

  // Get available directions for active segment
  const availableDirections = useMemo(() => {
    if (!activeSegment) return [];

    const segmentTemplates = templates?.[activeSegment] || [];
    const templateDirections = new Set(segmentTemplates.map(t => t.direction));
    const allDirections = getDirectionsForSegment(activeSegment);

    // If we have templates, filter to only available directions
    // Otherwise, return all standard directions
    if (segmentTemplates.length > 0) {
      return allDirections.filter(d => templateDirections.has(d.id));
    }

    return STANDARD_DIRECTIONS;
  }, [activeSegment, templates]);

  return {
    activeSegment,
    popupPosition,
    recentSegments,
    availableDirections,
    handleSegmentClick,
    handleDirectionSelect,
    closePopup,
    isRecentSegment
  };
}
