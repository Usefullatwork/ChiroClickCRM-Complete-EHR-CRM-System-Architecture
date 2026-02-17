/**
 * AnatomyProvider - Context provider for shared anatomy visualization state
 *
 * Manages:
 * - Active view mode (2D/3D)
 * - Findings across all anatomy components
 * - Template data from API
 * - Text insertion callback
 */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { spineTemplatesAPI } from '../../services/api';

const AnatomyContext = createContext(null);

// View modes
export const VIEW_MODES = {
  SVG_2D: '2d',
  THREE_3D: '3d',
  HYBRID: 'hybrid', // Side-by-side
};

// Default findings structure
const defaultFindings = {
  spine: {}, // { "C5_subluxation_left": { vertebra, type, side, timestamp } }
  body: [], // ["lower_back", "r_shoulder"]
  painMarkers: [], // [{ x, y, view, type, intensity }]
};

export function AnatomyProvider({
  children,
  onInsertText,
  initialFindings = defaultFindings,
  language = 'NO',
}) {
  // View state
  const [viewMode, setViewMode] = useState(VIEW_MODES.SVG_2D);
  const [activeView, setActiveView] = useState('anterior'); // anterior, posterior, lateral

  // Findings state
  const [findings, setFindings] = useState(initialFindings);

  // Fetch templates from API
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['spine-templates', 'grouped', language],
    queryFn: () => spineTemplatesAPI.getGrouped(language),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: 1,
  });

  const templates = useMemo(() => {
    return templatesData?.data?.data || {};
  }, [templatesData]);

  // Spine findings management
  const addSpineFinding = useCallback((vertebra, type, side) => {
    const key = `${vertebra}_${type}_${side}`;
    setFindings((prev) => ({
      ...prev,
      spine: {
        ...prev.spine,
        [key]: {
          vertebra,
          type,
          side,
          timestamp: new Date().toISOString(),
        },
      },
    }));
  }, []);

  const removeSpineFinding = useCallback((vertebra, type, side) => {
    const key = `${vertebra}_${type}_${side}`;
    setFindings((prev) => {
      const newSpine = { ...prev.spine };
      delete newSpine[key];
      return { ...prev, spine: newSpine };
    });
  }, []);

  const toggleSpineFinding = useCallback((vertebra, type, side) => {
    const key = `${vertebra}_${type}_${side}`;
    setFindings((prev) => {
      if (prev.spine[key]) {
        const newSpine = { ...prev.spine };
        delete newSpine[key];
        return { ...prev, spine: newSpine };
      } else {
        return {
          ...prev,
          spine: {
            ...prev.spine,
            [key]: {
              vertebra,
              type,
              side,
              timestamp: new Date().toISOString(),
            },
          },
        };
      }
    });
  }, []);

  // Body region management
  const toggleBodyRegion = useCallback((regionId) => {
    setFindings((prev) => {
      const isSelected = prev.body.includes(regionId);
      return {
        ...prev,
        body: isSelected ? prev.body.filter((r) => r !== regionId) : [...prev.body, regionId],
      };
    });
  }, []);

  // Pain marker management
  const addPainMarker = useCallback((marker) => {
    setFindings((prev) => ({
      ...prev,
      painMarkers: [
        ...prev.painMarkers,
        {
          ...marker,
          id: Date.now(),
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const removePainMarker = useCallback((markerId) => {
    setFindings((prev) => ({
      ...prev,
      painMarkers: prev.painMarkers.filter((m) => m.id !== markerId),
    }));
  }, []);

  // Clear all findings
  const clearAllFindings = useCallback(() => {
    setFindings(defaultFindings);
  }, []);

  // Clear specific category
  const clearSpineFindings = useCallback(() => {
    setFindings((prev) => ({ ...prev, spine: {} }));
  }, []);

  const clearBodyRegions = useCallback(() => {
    setFindings((prev) => ({ ...prev, body: [] }));
  }, []);

  const clearPainMarkers = useCallback(() => {
    setFindings((prev) => ({ ...prev, painMarkers: [] }));
  }, []);

  // Generate clinical narrative from findings
  const generateNarrative = useCallback(() => {
    const narratives = [];
    const spineFindings = Object.values(findings.spine);

    if (spineFindings.length > 0) {
      // Group by type
      const grouped = {};
      spineFindings.forEach((f) => {
        if (!grouped[f.type]) {
          grouped[f.type] = [];
        }
        grouped[f.type].push(f);
      });

      // Subluxations
      if (grouped.subluxation) {
        const items = grouped.subluxation.map(
          (f) => `${f.side !== 'central' ? `${f.side} ` : ''}${f.vertebra}`
        );
        narratives.push(`Subluksasjoner/Restriksjoner: ${items.join(', ')}`);
      }

      // Fixations
      if (grouped.fixation) {
        const items = grouped.fixation.map((f) => f.vertebra);
        narratives.push(`Fiksasjoner: ${items.join(', ')}`);
      }

      // Tenderness
      if (grouped.tenderness) {
        const items = grouped.tenderness.map(
          (f) => `${f.side !== 'central' ? `${f.side} ` : ''}${f.vertebra}`
        );
        narratives.push(`Ømhet/Palpasjonssmerte: ${items.join(', ')}`);
      }
    }

    if (findings.body.length > 0) {
      narratives.push(`Smertelokalisasjon: ${findings.body.join(', ')}`);
    }

    return narratives;
  }, [findings]);

  // Helper to check if vertebra has any finding
  const hasSpineFinding = useCallback(
    (vertebra) => {
      return Object.values(findings.spine).some((f) => f.vertebra === vertebra);
    },
    [findings.spine]
  );

  // Get all findings for a vertebra
  const getVertebraFindings = useCallback(
    (vertebra) => {
      return Object.values(findings.spine).filter((f) => f.vertebra === vertebra);
    },
    [findings.spine]
  );

  const value = {
    // View state
    viewMode,
    setViewMode,
    activeView,
    setActiveView,

    // Templates
    templates,
    templatesLoading,

    // Findings
    findings,
    setFindings,

    // Spine operations
    addSpineFinding,
    removeSpineFinding,
    toggleSpineFinding,
    hasSpineFinding,
    getVertebraFindings,

    // Body operations
    toggleBodyRegion,

    // Pain marker operations
    addPainMarker,
    removePainMarker,

    // Clear operations
    clearAllFindings,
    clearSpineFindings,
    clearBodyRegions,
    clearPainMarkers,

    // Narrative
    generateNarrative,

    // Text insertion
    onInsertText,
    language,
  };

  return <AnatomyContext.Provider value={value}>{children}</AnatomyContext.Provider>;
}

export function useAnatomy() {
  const context = useContext(AnatomyContext);
  if (!context) {
    throw new Error('useAnatomy must be used within an AnatomyProvider');
  }
  return context;
}

export default AnatomyProvider;
