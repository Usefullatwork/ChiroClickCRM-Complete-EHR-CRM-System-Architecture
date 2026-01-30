/**
 * BodyChartPanel - Enhanced Interactive Body Chart
 *
 * Features:
 * - Multiple body views (front, back, left, right, head, hands, feet)
 * - Click-to-mark pain/symptom locations
 * - Symptom type selection (pain, numbness, tingling, etc.)
 * - Pain intensity with VAS scale
 * - Bilingual support (Norwegian/English)
 * - Narrative generation for documentation
 * - Drawing tools for annotation
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  RotateCcw, ZoomIn, ZoomOut, Palette, Save, FileText,
  Circle, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';

// Bilingual labels
const LABELS = {
  en: {
    title: 'Body Chart',
    painLocation: 'Pain Location',
    symptomType: 'Symptom Type',
    intensity: 'Intensity',
    front: 'Front',
    back: 'Back',
    leftSide: 'Left',
    rightSide: 'Right',
    head: 'Head/Neck',
    hands: 'Hands',
    feet: 'Feet',
    clear: 'Clear',
    clearAll: 'Clear All',
    save: 'Save',
    generateNarrative: 'Generate Narrative',
    noMarkers: 'Click on the body diagram to mark symptom locations',
    markerLegend: 'Marker Legend',
    addDescription: 'Add description...',
    selectedRegions: 'Selected Regions',
    symptoms: {
      pain: 'Pain',
      aching: 'Aching',
      sharp: 'Sharp',
      burning: 'Burning',
      numbness: 'Numbness',
      tingling: 'Tingling',
      weakness: 'Weakness',
      stiffness: 'Stiffness',
      swelling: 'Swelling',
      tenderness: 'Tenderness'
    },
    regions: {
      head: 'Head',
      neck: 'Neck',
      cervical: 'Cervical Spine',
      thoracic: 'Thoracic Spine',
      lumbar: 'Lumbar Spine',
      sacrum: 'Sacrum',
      coccyx: 'Coccyx',
      r_shoulder: 'Right Shoulder',
      l_shoulder: 'Left Shoulder',
      r_arm_upper: 'Right Upper Arm',
      l_arm_upper: 'Left Upper Arm',
      r_elbow: 'Right Elbow',
      l_elbow: 'Left Elbow',
      r_forearm: 'Right Forearm',
      l_forearm: 'Left Forearm',
      r_wrist: 'Right Wrist',
      l_wrist: 'Left Wrist',
      r_hand: 'Right Hand',
      l_hand: 'Left Hand',
      chest: 'Chest',
      abdomen: 'Abdomen',
      r_hip: 'Right Hip',
      l_hip: 'Left Hip',
      r_si: 'Right SI Joint',
      l_si: 'Left SI Joint',
      r_glute: 'Right Gluteal',
      l_glute: 'Left Gluteal',
      r_thigh: 'Right Thigh',
      l_thigh: 'Left Thigh',
      r_knee: 'Right Knee',
      l_knee: 'Left Knee',
      r_lower_leg: 'Right Lower Leg',
      l_lower_leg: 'Left Lower Leg',
      r_ankle: 'Right Ankle',
      l_ankle: 'Left Ankle',
      r_foot: 'Right Foot',
      l_foot: 'Left Foot'
    }
  },
  no: {
    title: 'Kroppskart',
    painLocation: 'Smertested',
    symptomType: 'Symptomtype',
    intensity: 'Intensitet',
    front: 'Foran',
    back: 'Bak',
    leftSide: 'Venstre',
    rightSide: 'Høyre',
    head: 'Hode/Nakke',
    hands: 'Hender',
    feet: 'Føtter',
    clear: 'Fjern',
    clearAll: 'Fjern Alle',
    save: 'Lagre',
    generateNarrative: 'Generer Narrativ',
    noMarkers: 'Klikk på kroppsdiagrammet for å markere symptomsteder',
    markerLegend: 'Markørforklaring',
    addDescription: 'Legg til beskrivelse...',
    selectedRegions: 'Valgte Områder',
    symptoms: {
      pain: 'Smerte',
      aching: 'Verkende',
      sharp: 'Stikkende',
      burning: 'Brennende',
      numbness: 'Nummenhet',
      tingling: 'Prikking',
      weakness: 'Svakhet',
      stiffness: 'Stivhet',
      swelling: 'Hevelse',
      tenderness: 'Ømhet'
    },
    regions: {
      head: 'Hode',
      neck: 'Nakke',
      cervical: 'Cervikalcolumna',
      thoracic: 'Thorakalcolumna',
      lumbar: 'Lumbalcolumna',
      sacrum: 'Sacrum',
      coccyx: 'Coccyx',
      r_shoulder: 'Høyre Skulder',
      l_shoulder: 'Venstre Skulder',
      r_arm_upper: 'Høyre Overarm',
      l_arm_upper: 'Venstre Overarm',
      r_elbow: 'Høyre Albue',
      l_elbow: 'Venstre Albue',
      r_forearm: 'Høyre Underarm',
      l_forearm: 'Venstre Underarm',
      r_wrist: 'Høyre Håndledd',
      l_wrist: 'Venstre Håndledd',
      r_hand: 'Høyre Hånd',
      l_hand: 'Venstre Hånd',
      chest: 'Bryst',
      abdomen: 'Mage',
      r_hip: 'Høyre Hofte',
      l_hip: 'Venstre Hofte',
      r_si: 'Høyre SI-ledd',
      l_si: 'Venstre SI-ledd',
      r_glute: 'Høyre Sete',
      l_glute: 'Venstre Sete',
      r_thigh: 'Høyre Lår',
      l_thigh: 'Venstre Lår',
      r_knee: 'Høyre Kne',
      l_knee: 'Venstre Kne',
      r_lower_leg: 'Høyre Legg',
      l_lower_leg: 'Venstre Legg',
      r_ankle: 'Høyre Ankel',
      l_ankle: 'Venstre Ankel',
      r_foot: 'Høyre Fot',
      l_foot: 'Venstre Fot'
    }
  }
};

// Symptom type colors
const SYMPTOM_COLORS = {
  pain: '#EF4444',      // Red
  aching: '#F97316',    // Orange
  sharp: '#DC2626',     // Dark Red
  burning: '#F59E0B',   // Amber
  numbness: '#3B82F6',  // Blue
  tingling: '#8B5CF6',  // Purple
  weakness: '#6B7280',  // Gray
  stiffness: '#10B981', // Green
  swelling: '#EC4899',  // Pink
  tenderness: '#F472B6' // Light Pink
};

// Body region definitions with clickable areas
const BODY_REGIONS = {
  front: [
    { id: 'head', cx: 100, cy: 40, rx: 25, ry: 30 },
    { id: 'neck', cx: 100, cy: 85, rx: 12, ry: 15 },
    { id: 'r_shoulder', cx: 55, cy: 110, rx: 20, ry: 15 },
    { id: 'l_shoulder', cx: 145, cy: 110, rx: 20, ry: 15 },
    { id: 'chest', cx: 100, cy: 140, rx: 35, ry: 30 },
    { id: 'r_arm_upper', cx: 35, cy: 150, rx: 12, ry: 30 },
    { id: 'l_arm_upper', cx: 165, cy: 150, rx: 12, ry: 30 },
    { id: 'r_elbow', cx: 30, cy: 190, rx: 10, ry: 12 },
    { id: 'l_elbow', cx: 170, cy: 190, rx: 10, ry: 12 },
    { id: 'abdomen', cx: 100, cy: 190, rx: 30, ry: 25 },
    { id: 'r_forearm', cx: 25, cy: 225, rx: 10, ry: 25 },
    { id: 'l_forearm', cx: 175, cy: 225, rx: 10, ry: 25 },
    { id: 'r_hip', cx: 75, cy: 230, rx: 18, ry: 15 },
    { id: 'l_hip', cx: 125, cy: 230, rx: 18, ry: 15 },
    { id: 'r_hand', cx: 20, cy: 270, rx: 10, ry: 15 },
    { id: 'l_hand', cx: 180, cy: 270, rx: 10, ry: 15 },
    { id: 'r_thigh', cx: 75, cy: 290, rx: 18, ry: 40 },
    { id: 'l_thigh', cx: 125, cy: 290, rx: 18, ry: 40 },
    { id: 'r_knee', cx: 75, cy: 345, rx: 15, ry: 15 },
    { id: 'l_knee', cx: 125, cy: 345, rx: 15, ry: 15 },
    { id: 'r_lower_leg', cx: 75, cy: 395, rx: 12, ry: 35 },
    { id: 'l_lower_leg', cx: 125, cy: 395, rx: 12, ry: 35 },
    { id: 'r_ankle', cx: 75, cy: 440, rx: 10, ry: 10 },
    { id: 'l_ankle', cx: 125, cy: 440, rx: 10, ry: 10 },
    { id: 'r_foot', cx: 70, cy: 465, rx: 15, ry: 12 },
    { id: 'l_foot', cx: 130, cy: 465, rx: 15, ry: 12 }
  ],
  back: [
    { id: 'head', cx: 100, cy: 40, rx: 25, ry: 30 },
    { id: 'cervical', cx: 100, cy: 90, rx: 15, ry: 20 },
    { id: 'r_shoulder', cx: 55, cy: 110, rx: 20, ry: 15 },
    { id: 'l_shoulder', cx: 145, cy: 110, rx: 20, ry: 15 },
    { id: 'thoracic', cx: 100, cy: 140, rx: 25, ry: 35 },
    { id: 'r_arm_upper', cx: 35, cy: 150, rx: 12, ry: 30 },
    { id: 'l_arm_upper', cx: 165, cy: 150, rx: 12, ry: 30 },
    { id: 'lumbar', cx: 100, cy: 195, rx: 22, ry: 25 },
    { id: 'r_forearm', cx: 25, cy: 225, rx: 10, ry: 25 },
    { id: 'l_forearm', cx: 175, cy: 225, rx: 10, ry: 25 },
    { id: 'sacrum', cx: 100, cy: 235, rx: 18, ry: 15 },
    { id: 'r_si', cx: 80, cy: 240, rx: 10, ry: 10 },
    { id: 'l_si', cx: 120, cy: 240, rx: 10, ry: 10 },
    { id: 'r_glute', cx: 75, cy: 265, rx: 20, ry: 18 },
    { id: 'l_glute', cx: 125, cy: 265, rx: 20, ry: 18 },
    { id: 'r_hand', cx: 20, cy: 270, rx: 10, ry: 15 },
    { id: 'l_hand', cx: 180, cy: 270, rx: 10, ry: 15 },
    { id: 'r_thigh', cx: 75, cy: 315, rx: 18, ry: 35 },
    { id: 'l_thigh', cx: 125, cy: 315, rx: 18, ry: 35 },
    { id: 'r_knee', cx: 75, cy: 360, rx: 15, ry: 12 },
    { id: 'l_knee', cx: 125, cy: 360, rx: 15, ry: 12 },
    { id: 'r_lower_leg', cx: 75, cy: 400, rx: 12, ry: 30 },
    { id: 'l_lower_leg', cx: 125, cy: 400, rx: 12, ry: 30 },
    { id: 'r_ankle', cx: 75, cy: 445, rx: 10, ry: 10 },
    { id: 'l_ankle', cx: 125, cy: 445, rx: 10, ry: 10 },
    { id: 'r_foot', cx: 70, cy: 470, rx: 15, ry: 12 },
    { id: 'l_foot', cx: 130, cy: 470, rx: 15, ry: 12 }
  ]
};

// SVG body outline paths
const BODY_OUTLINES = {
  front: `
    M100,15 C125,15 140,30 140,55 C140,75 125,90 100,90 C75,90 60,75 60,55 C60,30 75,15 100,15
    M100,90 L100,100
    M65,105 Q45,110 40,125 L30,180 L25,230 L20,280
    M135,105 Q155,110 160,125 L170,180 L175,230 L180,280
    M65,105 L65,130 Q65,200 70,220 L70,250 L65,350 L60,430 L55,480
    M135,105 L135,130 Q135,200 130,220 L130,250 L135,350 L140,430 L145,480
    M70,220 Q100,240 130,220
  `,
  back: `
    M100,15 C125,15 140,30 140,55 C140,75 125,90 100,90 C75,90 60,75 60,55 C60,30 75,15 100,15
    M100,90 L100,100
    M85,100 L85,220 M115,100 L115,220 M100,100 L100,250
    M65,105 Q45,110 40,125 L30,180 L25,230 L20,280
    M135,105 Q155,110 160,125 L170,180 L175,230 L180,280
    M65,105 L65,130 Q65,200 70,220 L70,250 Q75,280 75,300 L70,380 L65,440 L60,490
    M135,105 L135,130 Q135,200 130,220 L130,250 Q125,280 125,300 L130,380 L135,440 L140,490
  `
};

export default function BodyChartPanel({
  value = { markers: [], selectedRegions: [] },
  onChange,
  onGenerateNarrative,
  lang = 'en',
  showNarrative = true,
  className = ''
}) {
  const [view, setView] = useState('front');
  const [selectedSymptom, setSelectedSymptom] = useState('pain');
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [showDetails, setShowDetails] = useState(false);

  const t = LABELS[lang] || LABELS.en;

  // Get markers for current view
  const currentMarkers = useMemo(() =>
    (value.markers || []).filter(m => m.view === view),
    [value.markers, view]
  );

  // Handle region click
  const handleRegionClick = useCallback((regionId) => {
    const existingMarkerIndex = (value.markers || []).findIndex(
      m => m.regionId === regionId && m.view === view
    );

    let newMarkers;
    if (existingMarkerIndex >= 0) {
      // Remove existing marker
      newMarkers = value.markers.filter((_, i) => i !== existingMarkerIndex);
    } else {
      // Add new marker
      const newMarker = {
        id: Date.now(),
        regionId,
        view,
        symptom: selectedSymptom,
        intensity,
        description: ''
      };
      newMarkers = [...(value.markers || []), newMarker];
    }

    onChange({ ...value, markers: newMarkers });
  }, [value, view, selectedSymptom, intensity, onChange]);

  // Update marker description
  const updateMarkerDescription = useCallback((markerId, description) => {
    const newMarkers = (value.markers || []).map(m =>
      m.id === markerId ? { ...m, description } : m
    );
    onChange({ ...value, markers: newMarkers });
  }, [value, onChange]);

  // Remove marker
  const removeMarker = useCallback((markerId) => {
    const newMarkers = (value.markers || []).filter(m => m.id !== markerId);
    onChange({ ...value, markers: newMarkers });
  }, [value, onChange]);

  // Clear all markers
  const clearAll = useCallback(() => {
    onChange({ markers: [], selectedRegions: [] });
  }, [onChange]);

  // Check if region has marker
  const hasMarker = useCallback((regionId) => {
    return (value.markers || []).some(m => m.regionId === regionId && m.view === view);
  }, [value.markers, view]);

  // Get marker for region
  const getMarker = useCallback((regionId) => {
    return (value.markers || []).find(m => m.regionId === regionId && m.view === view);
  }, [value.markers, view]);

  // Generate narrative text
  const generateNarrative = useCallback(() => {
    if (!value.markers || value.markers.length === 0) return '';

    const groupedByView = {};
    value.markers.forEach(m => {
      if (!groupedByView[m.view]) groupedByView[m.view] = [];
      groupedByView[m.view].push(m);
    });

    const parts = [];

    Object.entries(groupedByView).forEach(([viewKey, markers]) => {
      const viewLabel = t[viewKey] || viewKey;
      const regionDescriptions = markers.map(m => {
        const regionLabel = t.regions[m.regionId] || m.regionId;
        const symptomLabel = t.symptoms[m.symptom] || m.symptom;
        let desc = `${regionLabel} (${symptomLabel}`;
        if (m.intensity) desc += `, ${m.intensity}/10`;
        desc += ')';
        if (m.description) desc += `: ${m.description}`;
        return desc;
      });

      parts.push(`${viewLabel}: ${regionDescriptions.join('; ')}`);
    });

    return lang === 'no'
      ? `Pasient markerer følgende symptomområder: ${parts.join('. ')}.`
      : `Patient marks the following symptom areas: ${parts.join('. ')}.`;
  }, [value.markers, t, lang]);

  // Handle narrative generation
  const handleGenerateNarrative = useCallback(() => {
    const narrative = generateNarrative();
    if (onGenerateNarrative) {
      onGenerateNarrative(narrative);
    }
  }, [generateNarrative, onGenerateNarrative]);

  const regions = BODY_REGIONS[view] || BODY_REGIONS.front;
  const outline = BODY_OUTLINES[view] || BODY_OUTLINES.front;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {['front', 'back'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t[v === 'front' ? 'front' : 'back']}
                </button>
              ))}
            </div>

            {/* Clear button */}
            {value.markers?.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t.clearAll}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Symptom selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.symptomType}
            </label>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(SYMPTOM_COLORS).map(([symptom, color]) => (
                <button
                  key={symptom}
                  onClick={() => setSelectedSymptom(symptom)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg border transition-all ${
                    selectedSymptom === symptom
                      ? 'border-gray-800 bg-gray-100 font-medium'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {t.symptoms[symptom]}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.intensity}: <span className="text-blue-600 font-bold">{intensity}/10</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Body diagram */}
        <div className="flex justify-center items-start">
          <svg
            viewBox="0 0 200 500"
            className="w-full max-w-[200px] h-auto"
          >
            {/* Body outline */}
            <path
              d={outline}
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Clickable regions */}
            {regions.map(region => {
              const marker = getMarker(region.id);
              const isHovered = hoveredRegion === region.id;

              return (
                <g key={region.id}>
                  <ellipse
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    fill={marker ? SYMPTOM_COLORS[marker.symptom] : isHovered ? '#BFDBFE' : 'transparent'}
                    fillOpacity={marker ? 0.6 : isHovered ? 0.5 : 0}
                    stroke={marker ? SYMPTOM_COLORS[marker.symptom] : isHovered ? '#3B82F6' : 'transparent'}
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onClick={() => handleRegionClick(region.id)}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  />
                  {marker && (
                    <text
                      x={region.cx}
                      y={region.cy + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {marker.intensity}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Marker legend / list */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">{t.markerLegend}</h4>

          {currentMarkers.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{t.noMarkers}</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {currentMarkers.map(marker => (
                <div
                  key={marker.id}
                  className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: SYMPTOM_COLORS[marker.symptom] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {t.regions[marker.regionId] || marker.regionId}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t.symptoms[marker.symptom]} ({marker.intensity}/10)
                      </span>
                    </div>
                    <input
                      type="text"
                      value={marker.description || ''}
                      onChange={(e) => updateMarkerDescription(marker.id, e.target.value)}
                      placeholder={t.addDescription}
                      className="mt-1 w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => removeMarker(marker.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Generate narrative button */}
          {showNarrative && value.markers?.length > 0 && (
            <button
              onClick={handleGenerateNarrative}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t.generateNarrative}
            </button>
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredRegion && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50">
          {t.regions[hoveredRegion] || hoveredRegion}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
export function BodyChartCompact({
  value = { markers: [] },
  view = 'front',
  onClick,
  lang = 'en',
  className = ''
}) {
  const t = LABELS[lang] || LABELS.en;
  const regions = BODY_REGIONS[view] || BODY_REGIONS.front;
  const outline = BODY_OUTLINES[view] || BODY_OUTLINES.front;
  const viewMarkers = (value.markers || []).filter(m => m.view === view);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-2 cursor-pointer hover:border-blue-400 transition-colors ${className}`}
      onClick={onClick}
    >
      <svg viewBox="0 0 200 500" className="w-full h-32">
        <path
          d={outline}
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="1.5"
        />
        {regions.map(region => {
          const marker = viewMarkers.find(m => m.regionId === region.id);
          if (!marker) return null;

          return (
            <ellipse
              key={region.id}
              cx={region.cx}
              cy={region.cy}
              rx={region.rx * 0.8}
              ry={region.ry * 0.8}
              fill={SYMPTOM_COLORS[marker.symptom]}
              fillOpacity={0.7}
            />
          );
        })}
      </svg>
      <p className="text-xs text-center text-gray-500 mt-1">
        {t[view]} ({viewMarkers.length})
      </p>
    </div>
  );
}

// Quick region buttons for common areas
export function QuickRegionButtons({
  value = { markers: [] },
  onChange,
  symptom = 'pain',
  lang = 'en',
  className = ''
}) {
  const t = LABELS[lang] || LABELS.en;

  const quickRegions = [
    { id: 'cervical', view: 'back' },
    { id: 'thoracic', view: 'back' },
    { id: 'lumbar', view: 'back' },
    { id: 'sacrum', view: 'back' },
    { id: 'r_shoulder', view: 'front' },
    { id: 'l_shoulder', view: 'front' },
    { id: 'r_hip', view: 'front' },
    { id: 'l_hip', view: 'front' },
    { id: 'head', view: 'front' }
  ];

  const toggleRegion = (region) => {
    const existingIndex = (value.markers || []).findIndex(
      m => m.regionId === region.id && m.view === region.view
    );

    let newMarkers;
    if (existingIndex >= 0) {
      newMarkers = value.markers.filter((_, i) => i !== existingIndex);
    } else {
      newMarkers = [...(value.markers || []), {
        id: Date.now(),
        regionId: region.id,
        view: region.view,
        symptom,
        intensity: 5,
        description: ''
      }];
    }

    onChange({ ...value, markers: newMarkers });
  };

  const isSelected = (region) => {
    return (value.markers || []).some(
      m => m.regionId === region.id && m.view === region.view
    );
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {quickRegions.map(region => (
        <button
          key={`${region.view}-${region.id}`}
          onClick={() => toggleRegion(region)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
            isSelected(region)
              ? 'bg-red-100 border-red-300 text-red-800'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {t.regions[region.id]}
        </button>
      ))}
    </div>
  );
}

// Export for use in other components
export { SYMPTOM_COLORS, BODY_REGIONS, LABELS as BODY_CHART_LABELS };
