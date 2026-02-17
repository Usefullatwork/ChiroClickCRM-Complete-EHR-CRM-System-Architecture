/**
 * EnhancedClinicalSidebar - Upgraded clinical documentation sidebar
 *
 * Replaces the basic QuickPalpationSpine with an enhanced anatomy
 * visualization system that supports:
 * - Quick text insertion (original functionality)
 * - 2D anatomical spine diagram
 * - 3D interactive spine viewer
 * - Body pain mapping
 *
 * The sidebar maintains the same click-to-insert-text workflow
 * while providing professional anatomical visualizations.
 */
import _React, { useState, useCallback } from 'react';
import { Layers, Box, User, ChevronDown, ChevronUp, Settings, _X } from 'lucide-react';
import QuickPalpationSpine from './QuickPalpationSpine';
import { EnhancedSpineDiagram, Spine3DViewer, EnhancedBodyDiagram, _VIEW_MODES } from '../anatomy';

// Sidebar view modes
const SIDEBAR_MODES = {
  QUICK: 'quick', // Original quick palpation buttons
  SPINE_2D: 'spine2d', // Enhanced 2D spine diagram
  SPINE_3D: 'spine3d', // 3D spine viewer
  BODY: 'body', // Body pain mapping
};

const MODE_CONFIG = {
  [SIDEBAR_MODES.QUICK]: {
    label: 'Hurtig',
    shortLabel: 'Q',
    icon: Settings,
    description: 'Hurtig knapp-basert',
  },
  [SIDEBAR_MODES.SPINE_2D]: {
    label: '2D Spine',
    shortLabel: '2D',
    icon: Layers,
    description: 'Anatomisk 2D diagram',
  },
  [SIDEBAR_MODES.SPINE_3D]: {
    label: '3D Spine',
    shortLabel: '3D',
    icon: Box,
    description: '3D interaktiv visning',
  },
  [SIDEBAR_MODES.BODY]: {
    label: 'Kropp',
    shortLabel: 'B',
    icon: User,
    description: 'Smertelokalisering',
  },
};

export default function EnhancedClinicalSidebar({
  onInsertText,
  disabled = false,
  spineFindings = {},
  onSpineFindingsChange,
  bodyRegions = [],
  onBodyRegionsChange,
  templates = {},
  initialMode = SIDEBAR_MODES.QUICK,
  className = '',
}) {
  const [mode, setMode] = useState(initialMode);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Handle text insertion (works for all modes)
  const handleTextInsert = useCallback(
    (text) => {
      if (!disabled && onInsertText) {
        onInsertText(text);
      }
    },
    [disabled, onInsertText]
  );

  // Handle body region click (for text insertion)
  const handleBodyRegionClick = useCallback(
    (regionData) => {
      if (!disabled && onInsertText) {
        // Generate text from region click
        const text = `Smerte: ${regionData.label}. `;
        onInsertText(text);
      }
    },
    [disabled, onInsertText]
  );

  // Render the active view
  const renderView = () => {
    if (!isExpanded) {
      return null;
    }

    switch (mode) {
      case SIDEBAR_MODES.QUICK:
        return <QuickPalpationSpine onInsertText={handleTextInsert} disabled={disabled} />;

      case SIDEBAR_MODES.SPINE_2D:
        return (
          <div className="h-full overflow-auto">
            <EnhancedSpineDiagram
              findings={spineFindings}
              onChange={onSpineFindingsChange}
              onInsertText={handleTextInsert}
              templates={templates}
              showNarrative={false}
              showLegend={false}
              compact={true}
              className="border-0 rounded-none"
            />
          </div>
        );

      case SIDEBAR_MODES.SPINE_3D:
        return (
          <div className="h-full">
            <Spine3DViewer
              findings={spineFindings}
              onChange={onSpineFindingsChange}
              onInsertText={handleTextInsert}
              templates={templates}
              className="border-0 rounded-none h-full"
            />
          </div>
        );

      case SIDEBAR_MODES.BODY:
        return (
          <div className="h-full overflow-auto">
            <EnhancedBodyDiagram
              selectedRegions={bodyRegions}
              onChange={onBodyRegionsChange}
              onRegionClick={handleBodyRegionClick}
              showLabels={false}
              showQuickSelect={true}
              compact={true}
              className="border-0 rounded-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const currentConfig = MODE_CONFIG[mode];
  const CurrentIcon = currentConfig.icon;

  if (disabled) {
    return null;
  }

  return (
    <div className={`bg-white border-l border-slate-200 h-full flex flex-col ${className}`}>
      {/* Header with mode toggle */}
      <div className="flex-shrink-0 border-b border-slate-200">
        {/* Main header */}
        <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrentIcon className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-800">PALPASJON</h3>
              <p className="text-[10px] text-slate-500">{currentConfig.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Mode selector toggle */}
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className={`p-1 rounded transition-colors ${
                showModeSelector
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title="Bytt visning"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Collapse toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-slate-600"
              title={isExpanded ? 'Minimer' : 'Utvid'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mode selector dropdown */}
        {showModeSelector && (
          <div className="px-2 py-2 bg-slate-50 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(MODE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = mode === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setMode(key);
                      setShowModeSelector(false);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium">{config.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowModeSelector(false)}
              className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600"
            >
              Lukk
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">{renderView()}</div>

      {/* Footer hint */}
      {isExpanded && (
        <div className="flex-shrink-0 px-2 py-1.5 bg-slate-50 border-t border-slate-200">
          <p className="text-[9px] text-slate-400 text-center">
            {mode === SIDEBAR_MODES.QUICK && 'Klikk segment → Velg retning → Tekst settes inn'}
            {mode === SIDEBAR_MODES.SPINE_2D && 'Klikk vertebra for å dokumentere funn'}
            {mode === SIDEBAR_MODES.SPINE_3D && 'Roter med mus • Klikk for å velge'}
            {mode === SIDEBAR_MODES.BODY && 'Klikk område for å dokumentere smerte'}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact mode selector bar (can be placed above sidebar)
export function SidebarModeBar({ mode, onModeChange, disabled }) {
  if (disabled) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-lg">
      {Object.entries(MODE_CONFIG).map(([key, config]) => {
        const Icon = config.icon;
        const isActive = mode === key;

        return (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`p-1.5 rounded transition-colors ${
              isActive
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title={config.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

export { SIDEBAR_MODES };
