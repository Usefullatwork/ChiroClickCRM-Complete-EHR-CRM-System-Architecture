/**
 * AnatomyViewer - Combined 2D/3D anatomy visualization component
 *
 * Provides a unified interface for spine and body visualization
 * with the ability to switch between 2D SVG and 3D WebGL modes.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { spineTemplatesAPI } from '../../services/api';
import { Layers, Box, User, Activity, RotateCcw, Settings } from 'lucide-react';

// Import anatomy components
import EnhancedSpineDiagram, { CompactSpineDiagram } from './spine/EnhancedSpineDiagram';
import Spine3DViewer, { CompactSpine3D } from './spine/Spine3DViewer';
import EnhancedBodyDiagram, { CompactBodyDiagram } from './body/EnhancedBodyDiagram';

// View modes
export const VIEW_MODES = {
  SPINE_2D: 'spine_2d',
  SPINE_3D: 'spine_3d',
  BODY_2D: 'body_2d',
  COMBINED: 'combined'
};

// Mode configurations
const MODE_CONFIG = {
  [VIEW_MODES.SPINE_2D]: {
    label: 'Ryggrad 2D',
    icon: Layers,
    description: 'SVG ryggraddiagram'
  },
  [VIEW_MODES.SPINE_3D]: {
    label: 'Ryggrad 3D',
    icon: Box,
    description: '3D interaktiv modell'
  },
  [VIEW_MODES.BODY_2D]: {
    label: 'Kropp',
    icon: User,
    description: 'Kroppskart for smertelokalisering'
  },
  [VIEW_MODES.COMBINED]: {
    label: 'Kombinert',
    icon: Activity,
    description: 'Ryggrad og kropp side om side'
  }
};

export default function AnatomyViewer({
  // Mode
  initialMode = VIEW_MODES.SPINE_2D,
  allowModeSwitch = true,
  allowedModes = Object.values(VIEW_MODES),

  // Findings state
  spineFindings = {},
  onSpineFindingsChange,
  bodyRegions = [],
  onBodyRegionsChange,

  // Text insertion
  onInsertText,

  // Display options
  showNarrative = true,
  showLegend = true,
  compact = false,
  language = 'NO',

  className = ''
}) {
  const [mode, setMode] = useState(initialMode);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['spine-templates', 'grouped', language],
    queryFn: () => spineTemplatesAPI.getGrouped(language),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: 1
  });

  const templates = useMemo(() => {
    return templatesData?.data?.data || {};
  }, [templatesData]);

  // Filter allowed modes
  const availableModes = useMemo(() => {
    return allowedModes.filter(m => Object.values(VIEW_MODES).includes(m));
  }, [allowedModes]);

  // Handle mode change
  const handleModeChange = useCallback((newMode) => {
    if (availableModes.includes(newMode)) {
      setMode(newMode);
    }
  }, [availableModes]);

  // Clear all findings
  const handleClearAll = useCallback(() => {
    if (onSpineFindingsChange) {
      onSpineFindingsChange({});
    }
    if (onBodyRegionsChange) {
      onBodyRegionsChange([]);
    }
  }, [onSpineFindingsChange, onBodyRegionsChange]);

  // Count total findings
  const totalFindings = Object.keys(spineFindings).length + bodyRegions.length;

  // Render the active view
  const renderView = () => {
    switch (mode) {
      case VIEW_MODES.SPINE_2D:
        return compact ? (
          <CompactSpineDiagram
            findings={spineFindings}
            onChange={onSpineFindingsChange}
            onInsertText={onInsertText}
            templates={templates}
          />
        ) : (
          <EnhancedSpineDiagram
            findings={spineFindings}
            onChange={onSpineFindingsChange}
            onInsertText={onInsertText}
            templates={templates}
            showNarrative={showNarrative}
            showLegend={showLegend}
          />
        );

      case VIEW_MODES.SPINE_3D:
        return compact ? (
          <CompactSpine3D
            findings={spineFindings}
            onInsertText={onInsertText}
            templates={templates}
          />
        ) : (
          <Spine3DViewer
            findings={spineFindings}
            onChange={onSpineFindingsChange}
            onInsertText={onInsertText}
            templates={templates}
          />
        );

      case VIEW_MODES.BODY_2D:
        return compact ? (
          <CompactBodyDiagram
            selectedRegions={bodyRegions}
            onChange={onBodyRegionsChange}
          />
        ) : (
          <EnhancedBodyDiagram
            selectedRegions={bodyRegions}
            onChange={onBodyRegionsChange}
            showLabels={showNarrative}
          />
        );

      case VIEW_MODES.COMBINED:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EnhancedSpineDiagram
              findings={spineFindings}
              onChange={onSpineFindingsChange}
              onInsertText={onInsertText}
              templates={templates}
              showNarrative={false}
              showLegend={false}
              compact={true}
            />
            <EnhancedBodyDiagram
              selectedRegions={bodyRegions}
              onChange={onBodyRegionsChange}
              showLabels={false}
              compact={true}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Compact mode - minimal header
  if (compact) {
    return (
      <div className={`bg-white rounded-lg ${className}`}>
        {/* Minimal mode toggle */}
        {allowModeSwitch && availableModes.length > 1 && (
          <div className="flex items-center justify-center gap-1 p-2 border-b border-gray-100">
            {availableModes.map(m => {
              const config = MODE_CONFIG[m];
              const Icon = config.icon;
              return (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`p-1.5 rounded transition-colors ${
                    mode === m
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title={config.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}

        {/* View content */}
        {templatesLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          renderView()
        )}
      </div>
    );
  }

  // Full mode with header
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Anatomisk Visualisering</h3>
          </div>

          {totalFindings > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {totalFindings} funn
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          {allowModeSwitch && availableModes.length > 1 && (
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              {availableModes.map(m => {
                const config = MODE_CONFIG[m];
                const Icon = config.icon;
                return (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      mode === m
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={config.description}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Clear button */}
          {totalFindings > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="Nullstill alle funn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nullstill</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${
              showSettings ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Innstillinger"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-slate-50 border-b border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showNarrative}
                onChange={() => {}}
                className="rounded text-emerald-600"
              />
              <span className="text-gray-600">Vis narrativ</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={() => {}}
                className="rounded text-emerald-600"
              />
              <span className="text-gray-600">Vis forklaring</span>
            </label>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="p-4">
        {templatesLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
              <span className="text-sm text-gray-500">Laster maler...</span>
            </div>
          </div>
        ) : (
          renderView()
        )}
      </div>

      {/* Combined narrative footer */}
      {showNarrative && mode === VIEW_MODES.COMBINED && (totalFindings > 0) && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-2">
            Sammendrag av funn:
          </label>
          <div className="space-y-1 text-sm text-green-900">
            {Object.keys(spineFindings).length > 0 && (
              <p>• Spinalfunn: {Object.values(spineFindings).map(f => `${f.vertebra} (${f.type})`).join(', ')}</p>
            )}
            {bodyRegions.length > 0 && (
              <p>• Smerteområder: {bodyRegions.join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Preset configurations for common use cases
export function ExaminationAnatomyViewer(props) {
  return (
    <AnatomyViewer
      {...props}
      allowedModes={[VIEW_MODES.SPINE_2D, VIEW_MODES.SPINE_3D, VIEW_MODES.BODY_2D]}
      showNarrative={true}
      showLegend={true}
    />
  );
}

export function TreatmentAnatomyViewer(props) {
  return (
    <AnatomyViewer
      {...props}
      allowedModes={[VIEW_MODES.SPINE_2D, VIEW_MODES.SPINE_3D]}
      showNarrative={false}
      showLegend={false}
    />
  );
}

export function QuickPalpationViewer(props) {
  return (
    <AnatomyViewer
      {...props}
      initialMode={VIEW_MODES.SPINE_2D}
      allowModeSwitch={false}
      showNarrative={false}
      showLegend={false}
      compact={true}
    />
  );
}
