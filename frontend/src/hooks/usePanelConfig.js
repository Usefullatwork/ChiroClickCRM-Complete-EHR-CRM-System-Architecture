import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

const DEFAULT_PANELS = [
  { id: 'neuroExam', visible: true, order: 0, pinned: false },
  { id: 'orthoExam', visible: true, order: 1, pinned: false },
  { id: 'bodyDiagram', visible: true, order: 2, pinned: false },
  { id: 'romTable', visible: true, order: 3, pinned: false },
  { id: 'exercisePanel', visible: true, order: 4, pinned: false },
  { id: 'anatomyPanel', visible: false, order: 5, pinned: false },
  { id: 'outcomeMeasures', visible: false, order: 6, pinned: false },
  { id: 'headacheAssessment', visible: false, order: 7, pinned: false },
  { id: 'cranialNerves', visible: false, order: 8, pinned: false },
  { id: 'sensoryExam', visible: false, order: 9, pinned: false },
  { id: 'mmt', visible: false, order: 10, pinned: false },
  { id: 'dtr', visible: false, order: 11, pinned: false },
  { id: 'coordination', visible: false, order: 12, pinned: false },
  { id: 'nerveTension', visible: false, order: 13, pinned: false },
  { id: 'painAssessment', visible: false, order: 14, pinned: false },
  { id: 'tissueMarkers', visible: false, order: 15, pinned: false },
  { id: 'regionalDiagrams', visible: false, order: 16, pinned: false },
];

/**
 * Hook for loading/saving panel configuration from the API.
 * Returns sorted panels, visibility lookup, and mutation helpers.
 */
export function usePanelConfig() {
  const [panels, setPanels] = useState(DEFAULT_PANELS);
  const [presetName, setPresetName] = useState('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/clinical-settings/panels')
      .then((res) => {
        if (cancelled) {
          return;
        }
        const data = res.data?.data || res.data;
        if (data?.panels?.length) {
          setPanels(data.panels);
          setPresetName(data.presetName || '');
        }
      })
      .catch(() => {
        // Use defaults on error
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPanels = [...panels].sort((a, b) => a.order - b.order);

  const isPanelVisible = useCallback(
    (panelId) => {
      const panel = panels.find((p) => p.id === panelId);
      return panel ? panel.visible : false;
    },
    [panels]
  );

  const togglePanel = useCallback((panelId) => {
    setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, visible: !p.visible } : p)));
  }, []);

  const reorderPanels = useCallback((reorderedPanels) => {
    setPanels(reorderedPanels.map((p, i) => ({ ...p, order: i })));
  }, []);

  const togglePin = useCallback((panelId) => {
    setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, pinned: !p.pinned } : p)));
  }, []);

  const saveConfig = useCallback(async () => {
    try {
      await apiClient.put('/clinical-settings/panels', { panels, presetName });
    } catch {
      // Silently fail — user can retry
    }
  }, [panels, presetName]);

  return {
    panels: sortedPanels,
    presetName,
    setPresetName,
    loading,
    isPanelVisible,
    togglePanel,
    reorderPanels,
    togglePin,
    saveConfig,
  };
}
