/**
 * VisualROMSelector Component
 *
 * Interactive body diagram for selecting regions and recording Range of Motion.
 * Click on body regions to add ROM measurements for specific areas.
 */

import React, { useState, useMemo } from 'react';
import { X, Plus, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

// ROM norms by region with Norwegian translations
const ROM_REGIONS = {
  cervical: {
    name: 'Cervical Spine',
    nameNo: 'Cervikalcolumna (nakke)',
    icon: '🦴',
    position: { top: '8%', left: '50%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 50 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 60 },
      { id: 'lat_flex_left', name: 'Left Lat Flex', nameNo: 'Lateral fleksjon V', normal: 45 },
      { id: 'lat_flex_right', name: 'Right Lat Flex', nameNo: 'Lateral fleksjon H', normal: 45 },
      { id: 'rotation_left', name: 'Left Rotation', nameNo: 'Rotasjon V', normal: 80 },
      { id: 'rotation_right', name: 'Right Rotation', nameNo: 'Rotasjon H', normal: 80 },
    ],
  },
  thoracic: {
    name: 'Thoracic Spine',
    nameNo: 'Thorakalcolumna (bryst)',
    icon: '🦴',
    position: { top: '22%', left: '50%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 40 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 25 },
      { id: 'rotation_left', name: 'Left Rotation', nameNo: 'Rotasjon V', normal: 35 },
      { id: 'rotation_right', name: 'Right Rotation', nameNo: 'Rotasjon H', normal: 35 },
    ],
  },
  lumbar: {
    name: 'Lumbar Spine',
    nameNo: 'Lumbalcolumna (korsrygg)',
    icon: '🦴',
    position: { top: '35%', left: '50%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 60 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 25 },
      { id: 'lat_flex_left', name: 'Left Lat Flex', nameNo: 'Lateral fleksjon V', normal: 25 },
      { id: 'lat_flex_right', name: 'Right Lat Flex', nameNo: 'Lateral fleksjon H', normal: 25 },
      { id: 'rotation_left', name: 'Left Rotation', nameNo: 'Rotasjon V', normal: 30 },
      { id: 'rotation_right', name: 'Right Rotation', nameNo: 'Rotasjon H', normal: 30 },
    ],
  },
  shoulder_left: {
    name: 'Left Shoulder',
    nameNo: 'Venstre skulder',
    icon: '💪',
    position: { top: '18%', left: '28%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 180 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 60 },
      { id: 'abduction', name: 'Abduction', nameNo: 'Abduksjon', normal: 180 },
      { id: 'adduction', name: 'Adduction', nameNo: 'Adduksjon', normal: 50 },
      { id: 'internal_rotation', name: 'Internal Rotation', nameNo: 'Intern rotasjon', normal: 70 },
      {
        id: 'external_rotation',
        name: 'External Rotation',
        nameNo: 'Ekstern rotasjon',
        normal: 90,
      },
    ],
  },
  shoulder_right: {
    name: 'Right Shoulder',
    nameNo: 'Høyre skulder',
    icon: '💪',
    position: { top: '18%', left: '72%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 180 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 60 },
      { id: 'abduction', name: 'Abduction', nameNo: 'Abduksjon', normal: 180 },
      { id: 'adduction', name: 'Adduction', nameNo: 'Adduksjon', normal: 50 },
      { id: 'internal_rotation', name: 'Internal Rotation', nameNo: 'Intern rotasjon', normal: 70 },
      {
        id: 'external_rotation',
        name: 'External Rotation',
        nameNo: 'Ekstern rotasjon',
        normal: 90,
      },
    ],
  },
  elbow_left: {
    name: 'Left Elbow',
    nameNo: 'Venstre albue',
    icon: '💪',
    position: { top: '32%', left: '22%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 145 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 0 },
      { id: 'pronation', name: 'Pronation', nameNo: 'Pronasjon', normal: 80 },
      { id: 'supination', name: 'Supination', nameNo: 'Supinasjon', normal: 80 },
    ],
  },
  elbow_right: {
    name: 'Right Elbow',
    nameNo: 'Høyre albue',
    icon: '💪',
    position: { top: '32%', left: '78%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 145 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 0 },
      { id: 'pronation', name: 'Pronation', nameNo: 'Pronasjon', normal: 80 },
      { id: 'supination', name: 'Supination', nameNo: 'Supinasjon', normal: 80 },
    ],
  },
  wrist_left: {
    name: 'Left Wrist',
    nameNo: 'Venstre håndledd',
    icon: '✋',
    position: { top: '45%', left: '18%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 80 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 70 },
      { id: 'radial_deviation', name: 'Radial Deviation', nameNo: 'Radial deviasjon', normal: 20 },
      { id: 'ulnar_deviation', name: 'Ulnar Deviation', nameNo: 'Ulnar deviasjon', normal: 30 },
    ],
  },
  wrist_right: {
    name: 'Right Wrist',
    nameNo: 'Høyre håndledd',
    icon: '✋',
    position: { top: '45%', left: '82%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 80 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 70 },
      { id: 'radial_deviation', name: 'Radial Deviation', nameNo: 'Radial deviasjon', normal: 20 },
      { id: 'ulnar_deviation', name: 'Ulnar Deviation', nameNo: 'Ulnar deviasjon', normal: 30 },
    ],
  },
  hip_left: {
    name: 'Left Hip',
    nameNo: 'Venstre hofte',
    icon: '🦵',
    position: { top: '45%', left: '40%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 120 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 30 },
      { id: 'abduction', name: 'Abduction', nameNo: 'Abduksjon', normal: 45 },
      { id: 'adduction', name: 'Adduction', nameNo: 'Adduksjon', normal: 30 },
      { id: 'internal_rotation', name: 'Internal Rotation', nameNo: 'Intern rotasjon', normal: 35 },
      {
        id: 'external_rotation',
        name: 'External Rotation',
        nameNo: 'Ekstern rotasjon',
        normal: 45,
      },
    ],
  },
  hip_right: {
    name: 'Right Hip',
    nameNo: 'Høyre hofte',
    icon: '🦵',
    position: { top: '45%', left: '60%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 120 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 30 },
      { id: 'abduction', name: 'Abduction', nameNo: 'Abduksjon', normal: 45 },
      { id: 'adduction', name: 'Adduction', nameNo: 'Adduksjon', normal: 30 },
      { id: 'internal_rotation', name: 'Internal Rotation', nameNo: 'Intern rotasjon', normal: 35 },
      {
        id: 'external_rotation',
        name: 'External Rotation',
        nameNo: 'Ekstern rotasjon',
        normal: 45,
      },
    ],
  },
  knee_left: {
    name: 'Left Knee',
    nameNo: 'Venstre kne',
    icon: '🦵',
    position: { top: '62%', left: '40%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 135 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 0 },
    ],
  },
  knee_right: {
    name: 'Right Knee',
    nameNo: 'Høyre kne',
    icon: '🦵',
    position: { top: '62%', left: '60%' },
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 135 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 0 },
    ],
  },
  ankle_left: {
    name: 'Left Ankle',
    nameNo: 'Venstre ankel',
    icon: '🦶',
    position: { top: '85%', left: '40%' },
    movements: [
      { id: 'dorsiflexion', name: 'Dorsiflexion', nameNo: 'Dorsalfleksjon', normal: 20 },
      { id: 'plantarflexion', name: 'Plantarflexion', nameNo: 'Plantarfleksjon', normal: 50 },
      { id: 'inversion', name: 'Inversion', nameNo: 'Inversjon', normal: 35 },
      { id: 'eversion', name: 'Eversion', nameNo: 'Eversjon', normal: 15 },
    ],
  },
  ankle_right: {
    name: 'Right Ankle',
    nameNo: 'Høyre ankel',
    icon: '🦶',
    position: { top: '85%', left: '60%' },
    movements: [
      { id: 'dorsiflexion', name: 'Dorsiflexion', nameNo: 'Dorsalfleksjon', normal: 20 },
      { id: 'plantarflexion', name: 'Plantarflexion', nameNo: 'Plantarfleksjon', normal: 50 },
      { id: 'inversion', name: 'Inversion', nameNo: 'Inversjon', normal: 35 },
      { id: 'eversion', name: 'Eversion', nameNo: 'Eversjon', normal: 15 },
    ],
  },
};

/**
 * Visual ROM Arc Slider - Draggable arc/bar for setting ROM angles
 */
function ROMArcSlider({ value, onChange, normal, readOnly, _movementName }) {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = React.useRef(null);

  const currentValue = value ? parseInt(value) : 0;
  const percentage = currentValue > 0 ? (currentValue / normal) * 100 : 0;

  // Color based on percentage
  const getColor = () => {
    if (percentage === 0) {
      return { fill: '#e5e7eb', stroke: '#9ca3af', text: '#6b7280' };
    }
    if (percentage < 70) {
      return { fill: '#fecaca', stroke: '#ef4444', text: '#dc2626' };
    }
    if (percentage < 90) {
      return { fill: '#fef3c7', stroke: '#f59e0b', text: '#d97706' };
    }
    return { fill: '#bbf7d0', stroke: '#22c55e', text: '#16a34a' };
  };

  const colors = getColor();

  // Arc dimensions
  const width = 80;
  const height = 50;
  const cx = width / 2;
  const cy = height - 5;
  const radius = 35;
  const innerRadius = 20;

  // Calculate arc based on normal max angle (scale to 180° arc display)
  const maxDisplayAngle = 180; // Full semicircle
  const currentDisplayAngle = (currentValue / Math.max(normal, 180)) * maxDisplayAngle;
  const normalDisplayAngle = (normal / Math.max(normal, 180)) * maxDisplayAngle;

  // Convert angle to radians (0 = left, 180 = right)
  const angleToPoint = (angle, r) => {
    const rad = ((180 - angle) * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * r,
      y: cy - Math.sin(rad) * r,
    };
  };

  // Create arc path for filled wedge
  const createArcPath = (startAngle, endAngle, outerR, innerR) => {
    const start = angleToPoint(startAngle, outerR);
    const end = angleToPoint(endAngle, outerR);
    const innerStart = angleToPoint(startAngle, innerR);
    const innerEnd = angleToPoint(endAngle, innerR);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

    return `
      M ${innerStart.x} ${innerStart.y}
      L ${start.x} ${start.y}
      A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y}
      L ${innerEnd.x} ${innerEnd.y}
      A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
      Z
    `;
  };

  // Handle drag
  const handleMouseMove = (e) => {
    if (!isDragging || readOnly) {
      return;
    }

    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to SVG coordinates
    const svgX = (x / rect.width) * width;
    const svgY = (y / rect.height) * height;

    // Calculate angle from center
    const dx = svgX - cx;
    const dy = cy - svgY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Convert to 0-180 range (left to right)
    angle = 180 - angle;
    if (angle < 0) {
      angle = 0;
    }
    if (angle > 180) {
      angle = 180;
    }

    // Convert display angle to actual ROM value
    const romValue = Math.round((angle / maxDisplayAngle) * Math.max(normal, 180));
    const clampedValue = Math.min(Math.max(romValue, 0), Math.max(normal * 1.2, 180)); // Allow slightly over normal

    onChange(clampedValue.toString());
  };

  const handleMouseDown = (e) => {
    if (readOnly) {
      return;
    }
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => setIsDragging(false);

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  // Handle point for the current angle
  const handlePoint = angleToPoint(currentDisplayAngle, radius + 5);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} select-none`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background arc (full range) */}
        <path
          d={createArcPath(0, maxDisplayAngle, radius, innerRadius)}
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="1"
        />

        {/* Normal range indicator */}
        <path
          d={createArcPath(0, normalDisplayAngle, radius, innerRadius)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="3,2"
          opacity="0.5"
        />

        {/* Current value arc */}
        {currentValue > 0 && (
          <path
            d={createArcPath(0, currentDisplayAngle, radius, innerRadius)}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="2"
          />
        )}

        {/* Handle */}
        {!readOnly && (
          <circle
            cx={handlePoint.x}
            cy={handlePoint.y}
            r={6}
            fill="white"
            stroke={colors.stroke}
            strokeWidth="2"
            className="cursor-grab active:cursor-grabbing"
          />
        )}

        {/* Center value display */}
        <text
          x={cx}
          y={cy - 8}
          fontSize="12"
          fontWeight="bold"
          fill={colors.text}
          textAnchor="middle"
        >
          {currentValue > 0 ? `${currentValue}°` : '—'}
        </text>

        {/* Normal value indicator */}
        <text x={cx} y={cy + 2} fontSize="7" fill="#9ca3af" textAnchor="middle">
          /{normal}°
        </text>
      </svg>
    </div>
  );
}

/**
 * ROM Input with visual feedback (legacy number input as fallback)
 */
function _ROMInput({ value, onChange, normal, readOnly }) {
  const percentage = value ? (parseInt(value) / normal) * 100 : null;
  const isRestricted = percentage !== null && percentage < 70;
  const isMildlyRestricted = percentage !== null && percentage >= 70 && percentage < 90;

  return (
    <div className="relative flex items-center gap-2">
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className={`w-16 px-2 py-1.5 text-center text-sm border rounded-lg
                   focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                   ${
                     isRestricted
                       ? 'border-red-400 bg-red-50 text-red-700'
                       : isMildlyRestricted
                         ? 'border-amber-400 bg-amber-50 text-amber-700'
                         : 'border-gray-300 bg-white'
                   }`}
        placeholder="—"
      />
      <span className="text-xs text-gray-400">°</span>
      {isRestricted && <AlertTriangle className="w-4 h-4 text-red-500" />}
      {percentage !== null && percentage >= 90 && (
        <CheckCircle className="w-4 h-4 text-green-500" />
      )}
    </div>
  );
}

/**
 * Single Region ROM Panel
 */
function RegionROMPanel({ _regionId, regionData, values = {}, onChange, onRemove, readOnly }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleMovementChange = (movementId, field, value) => {
    const newValues = {
      ...values,
      [movementId]: {
        ...(values[movementId] || {}),
        [field]: value,
      },
    };
    onChange(newValues);
  };

  // Calculate summary
  const summary = useMemo(() => {
    let measured = 0;
    let restricted = 0;
    let painful = 0;

    regionData.movements.forEach((movement) => {
      const mv = values[movement.id];
      if (mv?.value) {
        measured++;
        const percentage = (parseInt(mv.value) / movement.normal) * 100;
        if (percentage < 70) {
          restricted++;
        }
        if (mv.pain) {
          painful++;
        }
      }
    });

    return { measured, restricted, painful };
  }, [values, regionData.movements]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors
                   ${summary.restricted > 0 ? 'bg-red-50' : summary.measured > 0 ? 'bg-green-50' : 'bg-gray-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{regionData.icon}</span>
          <span className="font-medium text-gray-800">{regionData.nameNo}</span>
          {summary.measured > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full
                           ${summary.restricted > 0 ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}
            >
              {summary.measured} målt{summary.restricted > 0 && `, ${summary.restricted} redusert`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
              title="Fjern region"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {regionData.movements.map((movement) => {
              const mv = values[movement.id] || {};
              const percentage = mv.value ? (parseInt(mv.value) / movement.normal) * 100 : 0;
              const hasPain = mv.pain;

              return (
                <div
                  key={movement.id}
                  className={`p-3 rounded-lg border-2 transition-colors
                             ${
                               hasPain
                                 ? 'border-red-300 bg-red-50'
                                 : percentage > 0 && percentage < 70
                                   ? 'border-red-200 bg-red-50'
                                   : percentage >= 70 && percentage < 90
                                     ? 'border-amber-200 bg-amber-50'
                                     : percentage >= 90
                                       ? 'border-green-200 bg-green-50'
                                       : 'border-gray-200 bg-white'
                             }`}
                >
                  {/* Movement name */}
                  <div className="text-xs font-medium text-gray-600 text-center mb-2">
                    {movement.nameNo}
                  </div>

                  {/* Arc slider */}
                  <ROMArcSlider
                    value={mv.value}
                    onChange={(v) => handleMovementChange(movement.id, 'value', v)}
                    normal={movement.normal}
                    readOnly={readOnly}
                  />

                  {/* Pain toggle */}
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        !readOnly && handleMovementChange(movement.id, 'pain', !mv.pain)
                      }
                      disabled={readOnly}
                      className={`px-2 py-1 text-xs rounded-full transition-colors
                                 ${
                                   mv.pain
                                     ? 'bg-red-500 text-white'
                                     : 'bg-gray-100 text-gray-500 hover:bg-red-100'
                                 }`}
                    >
                      {mv.pain ? '⚡ Smerte' : '+ Smerte'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Clickable Body Diagram
 */
function BodyDiagram({ selectedRegions, onSelectRegion, availableRegions }) {
  return (
    <div className="relative w-48 h-80 mx-auto">
      {/* Simple body outline SVG */}
      <svg viewBox="0 0 100 180" className="w-full h-full">
        {/* Head */}
        <ellipse cx="50" cy="15" rx="12" ry="14" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />
        {/* Neck */}
        <rect x="45" y="27" width="10" height="8" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />
        {/* Torso */}
        <path d="M30 35 L70 35 L75 80 L25 80 Z" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />
        {/* Pelvis */}
        <path d="M25 80 L75 80 L72 100 L28 100 Z" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />
        {/* Left arm */}
        <path
          d="M30 35 L20 38 L12 65 L15 80 L20 80 L25 65 L30 45"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        {/* Right arm */}
        <path
          d="M70 35 L80 38 L88 65 L85 80 L80 80 L75 65 L70 45"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        {/* Left leg */}
        <path
          d="M32 100 L38 100 L40 140 L42 175 L35 175 L33 140 L28 100"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="1"
        />
        {/* Right leg */}
        <path
          d="M62 100 L68 100 L72 100 L67 140 L65 175 L58 175 L60 140 L62 100"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="1"
        />
      </svg>

      {/* Clickable region markers */}
      {Object.entries(ROM_REGIONS).map(([regionId, region]) => {
        const isSelected = selectedRegions.includes(regionId);
        const isAvailable = availableRegions.includes(regionId);

        return (
          <button
            key={regionId}
            onClick={() => onSelectRegion(regionId)}
            disabled={!isAvailable}
            className={`absolute w-6 h-6 rounded-full transform -translate-x-1/2 -translate-y-1/2
                       flex items-center justify-center text-xs font-bold transition-all
                       ${
                         isSelected
                           ? 'bg-teal-500 text-white scale-110 ring-2 ring-teal-300'
                           : isAvailable
                             ? 'bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-50 hover:scale-110'
                             : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                       }`}
            style={{ top: region.position.top, left: region.position.left }}
            title={region.nameNo}
          >
            {isSelected ? '✓' : '+'}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Main VisualROMSelector Component
 */
export default function VisualROMSelector({
  values = {},
  onChange,
  readOnly = false,
  onGenerateReport,
}) {
  const [showBodySelector, setShowBodySelector] = useState(false);

  // Get list of selected regions from values
  const selectedRegions = Object.keys(values);
  const _availableRegions = Object.keys(ROM_REGIONS).filter((r) => !selectedRegions.includes(r));

  const handleSelectRegion = (regionId) => {
    if (selectedRegions.includes(regionId)) {
      // Remove region
      const newValues = { ...values };
      delete newValues[regionId];
      onChange(newValues);
    } else {
      // Add region
      onChange({
        ...values,
        [regionId]: {},
      });
    }
  };

  const handleRegionChange = (regionId, regionValues) => {
    onChange({
      ...values,
      [regionId]: regionValues,
    });
  };

  const handleRemoveRegion = (regionId) => {
    const newValues = { ...values };
    delete newValues[regionId];
    onChange(newValues);
  };

  // Generate report
  const generateReport = () => {
    const lines = ['ROM-UNDERSØKELSE', '', `Dato: ${new Date().toLocaleDateString('nb-NO')}`, ''];

    let totalMeasured = 0;
    let totalRestricted = 0;

    Object.entries(values).forEach(([regionId, regionValues]) => {
      const region = ROM_REGIONS[regionId];
      if (!region) {
        return;
      }

      const findings = [];
      region.movements.forEach((movement) => {
        const mv = regionValues[movement.id];
        if (mv?.value) {
          totalMeasured++;
          const percentage = (parseInt(mv.value) / movement.normal) * 100;
          let status = '';
          if (percentage < 70) {
            status = ' (betydelig redusert)';
            totalRestricted++;
          } else if (percentage < 90) {
            status = ' (lett redusert)';
          }
          const pain = mv.pain ? ' + smerte' : '';
          findings.push(`  • ${movement.nameNo}: ${mv.value}°/${movement.normal}°${status}${pain}`);
        }
      });

      if (findings.length > 0) {
        lines.push(`${region.icon} ${region.nameNo}:`);
        lines.push(...findings);
        lines.push('');
      }
    });

    if (totalMeasured === 0) {
      lines.push('Ingen ROM-målinger registrert.');
    } else {
      lines.push('OPPSUMMERING:');
      lines.push(
        `Totalt ${totalMeasured} bevegelser målt, ${totalRestricted} med betydelig reduksjon.`
      );
    }

    return lines.join('\n');
  };

  // Calculate global summary
  const summary = useMemo(() => {
    let totalMeasured = 0;
    let totalRestricted = 0;
    let totalPainful = 0;

    Object.entries(values).forEach(([regionId, regionValues]) => {
      const region = ROM_REGIONS[regionId];
      if (!region) {
        return;
      }

      region.movements.forEach((movement) => {
        const mv = regionValues[movement.id];
        if (mv?.value) {
          totalMeasured++;
          const percentage = (parseInt(mv.value) / movement.normal) * 100;
          if (percentage < 70) {
            totalRestricted++;
          }
          if (mv.pain) {
            totalPainful++;
          }
        }
      });
    });

    return { totalMeasured, totalRestricted, totalPainful };
  }, [values]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Leddutslag (ROM)</h3>
          <p className="text-sm text-gray-500">Klikk på kroppen for å legge til regioner</p>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={() => setShowBodySelector(!showBodySelector)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg
                        hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Legg til region
            </button>
          )}
          {onGenerateReport && selectedRegions.length > 0 && (
            <button
              onClick={() => onGenerateReport(generateReport())}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg
                        hover:bg-blue-700 transition-colors"
            >
              Generer rapport
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {summary.totalMeasured > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{summary.totalMeasured} målinger</span>
          {summary.totalRestricted > 0 && (
            <span className="text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {summary.totalRestricted} betydelig redusert
            </span>
          )}
          {summary.totalPainful > 0 && (
            <span className="text-amber-600">{summary.totalPainful} med smerte</span>
          )}
        </div>
      )}

      {/* Body Selector Modal */}
      {showBodySelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Velg kroppsregion</h4>
              <button
                onClick={() => setShowBodySelector(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Klikk på + for å legge til en region, eller ✓ for å fjerne
            </p>

            <BodyDiagram
              selectedRegions={selectedRegions}
              onSelectRegion={handleSelectRegion}
              availableRegions={Object.keys(ROM_REGIONS)}
            />

            {/* Region list */}
            <div className="mt-4 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ROM_REGIONS).map(([regionId, region]) => {
                  const isSelected = selectedRegions.includes(regionId);
                  return (
                    <button
                      key={regionId}
                      onClick={() => handleSelectRegion(regionId)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors
                                ${
                                  isSelected
                                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                    >
                      <span className="mr-2">{region.icon}</span>
                      {region.nameNo.split(' ')[0]}
                      {region.nameNo.includes('Venstre') && ' V'}
                      {region.nameNo.includes('Høyre') && ' H'}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowBodySelector(false)}
              className="w-full mt-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Ferdig
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-400 rounded" />
          <span>&lt;70% = Betydelig redusert</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-100 border border-amber-400 rounded" />
          <span>70-90% = Lett redusert</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>&gt;90% = Normal</span>
        </div>
      </div>

      {/* Selected Region Panels */}
      {selectedRegions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="mb-2">Ingen regioner valgt</p>
          <p className="text-sm">Klikk "Legg til region" for å starte</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedRegions.map((regionId) => {
            const region = ROM_REGIONS[regionId];
            if (!region) {
              return null;
            }
            return (
              <RegionROMPanel
                key={regionId}
                regionId={regionId}
                regionData={region}
                values={values[regionId] || {}}
                onChange={(v) => handleRegionChange(regionId, v)}
                onRemove={() => handleRemoveRegion(regionId)}
                readOnly={readOnly}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
