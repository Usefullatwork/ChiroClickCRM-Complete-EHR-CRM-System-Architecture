/**
 * ROMTable Component
 *
 * Range of Motion table for cervical and lumbar spine measurements.
 * Displays normal values and highlights restrictions.
 * Features draggable arc sliders for visual ROM input.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// Normal ROM values
const ROM_NORMS = {
  cervical: {
    name: 'Cervical',
    nameNo: 'Cervikalcolumna',
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 50 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 60 },
      { id: 'lat_flex_left', name: 'Left Lat Flex', nameNo: 'Lateral fleksjon V', normal: 45 },
      { id: 'lat_flex_right', name: 'Right Lat Flex', nameNo: 'Lateral fleksjon H', normal: 45 },
      { id: 'rotation_left', name: 'Left Rotation', nameNo: 'Rotasjon V', normal: 80 },
      { id: 'rotation_right', name: 'Right Rotation', nameNo: 'Rotasjon H', normal: 80 }
    ]
  },
  lumbar: {
    name: 'Lumbar',
    nameNo: 'Lumbalcolumna',
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 60 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 25 },
      { id: 'lat_flex_left', name: 'Left Lat Flex', nameNo: 'Lateral fleksjon V', normal: 25 },
      { id: 'lat_flex_right', name: 'Right Lat Flex', nameNo: 'Lateral fleksjon H', normal: 25 },
      { id: 'rotation_left', name: 'Left Rotation', nameNo: 'Rotasjon V', normal: 30 },
      { id: 'rotation_right', name: 'Right Rotation', nameNo: 'Rotasjon H', normal: 30 }
    ]
  },
  shoulder: {
    name: 'Shoulder',
    nameNo: 'Skulder',
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 180 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 60 },
      { id: 'abduction', name: 'Abduction', nameNo: 'Abduksjon', normal: 180 },
      { id: 'adduction', name: 'Adduction', nameNo: 'Adduksjon', normal: 50 },
      { id: 'internal_rotation', name: 'Internal Rotation', nameNo: 'Intern rotasjon', normal: 70 },
      { id: 'external_rotation', name: 'External Rotation', nameNo: 'Ekstern rotasjon', normal: 90 }
    ]
  },
  hip: {
    name: 'Hip',
    nameNo: 'Hofte',
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 120 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 30 },
      { id: 'abduction', name: 'Abduction', nameNo: 'Abduksjon', normal: 45 },
      { id: 'adduction', name: 'Adduction', nameNo: 'Adduksjon', normal: 30 },
      { id: 'internal_rotation', name: 'Internal Rotation', nameNo: 'Intern rotasjon', normal: 35 },
      { id: 'external_rotation', name: 'External Rotation', nameNo: 'Ekstern rotasjon', normal: 45 }
    ]
  },
  knee: {
    name: 'Knee',
    nameNo: 'Kne',
    movements: [
      { id: 'flexion', name: 'Flexion', nameNo: 'Fleksjon', normal: 135 },
      { id: 'extension', name: 'Extension', nameNo: 'Ekstensjon', normal: 0 }
    ]
  },
  ankle: {
    name: 'Ankle',
    nameNo: 'Ankel',
    movements: [
      { id: 'dorsiflexion', name: 'Dorsiflexion', nameNo: 'Dorsalfleksjon', normal: 20 },
      { id: 'plantarflexion', name: 'Plantarflexion', nameNo: 'Plantarfleksjon', normal: 50 },
      { id: 'inversion', name: 'Inversion', nameNo: 'Inversjon', normal: 35 },
      { id: 'eversion', name: 'Eversion', nameNo: 'Eversjon', normal: 15 }
    ]
  }
};

/**
 * Visual ROM Arc Slider - Draggable arc/bar for setting ROM angles
 */
function ROMArcSlider({ value, onChange, normal, readOnly }) {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);

  const currentValue = value ? parseInt(value) : 0;
  const percentage = currentValue > 0 ? (currentValue / normal) * 100 : 0;

  // Color based on percentage
  const getColor = () => {
    if (percentage === 0) return { fill: '#e5e7eb', stroke: '#9ca3af', text: '#6b7280' };
    if (percentage < 70) return { fill: '#fecaca', stroke: '#ef4444', text: '#dc2626' };
    if (percentage < 90) return { fill: '#fef3c7', stroke: '#f59e0b', text: '#d97706' };
    return { fill: '#bbf7d0', stroke: '#22c55e', text: '#16a34a' };
  };

  const colors = getColor();

  // Arc dimensions
  const width = 70;
  const height = 45;
  const cx = width / 2;
  const cy = height - 5;
  const radius = 30;
  const innerRadius = 16;

  // Calculate arc based on normal max angle (scale to 180° arc display)
  const maxDisplayAngle = 180;
  const currentDisplayAngle = (currentValue / Math.max(normal, 180)) * maxDisplayAngle;
  const normalDisplayAngle = (normal / Math.max(normal, 180)) * maxDisplayAngle;

  // Convert angle to radians (0 = left, 180 = right)
  const angleToPoint = (angle, r) => {
    const rad = ((180 - angle) * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * r,
      y: cy - Math.sin(rad) * r
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
    if (!isDragging || readOnly) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const svgX = (x / rect.width) * width;
    const svgY = (y / rect.height) * height;

    const dx = svgX - cx;
    const dy = cy - svgY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    angle = 180 - angle;
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;

    const romValue = Math.round((angle / maxDisplayAngle) * Math.max(normal, 180));
    const clampedValue = Math.min(Math.max(romValue, 0), Math.max(normal * 1.2, 180));

    onChange(clampedValue.toString());
  };

  const handleMouseDown = (e) => {
    if (readOnly) return;
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
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

  const handlePoint = angleToPoint(currentDisplayAngle, radius + 4);

  return (
    <div className="flex flex-col items-center">
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
        {/* Background arc */}
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
          strokeWidth="1.5"
          strokeDasharray="2,2"
          opacity="0.4"
        />

        {/* Current value arc */}
        {currentValue > 0 && (
          <path
            d={createArcPath(0, currentDisplayAngle, radius, innerRadius)}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
        )}

        {/* Handle */}
        {!readOnly && (
          <circle
            cx={handlePoint.x}
            cy={handlePoint.y}
            r={5}
            fill="white"
            stroke={colors.stroke}
            strokeWidth="2"
            className="cursor-grab active:cursor-grabbing"
          />
        )}

        {/* Value display */}
        <text
          x={cx}
          y={cy - 6}
          fontSize="11"
          fontWeight="bold"
          fill={colors.text}
          textAnchor="middle"
        >
          {currentValue > 0 ? `${currentValue}°` : '—'}
        </text>
      </svg>
    </div>
  );
}

/**
 * Single ROM input cell (legacy fallback)
 */
function ROMInput({ value, onChange, normal, readOnly }) {
  const percentage = value ? (parseInt(value) / normal) * 100 : null;
  const isRestricted = percentage !== null && percentage < 70;
  const isMildlyRestricted = percentage !== null && percentage >= 70 && percentage < 90;

  return (
    <div className="relative">
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className={`w-16 px-2 py-1 text-center text-sm border rounded
                   focus:ring-1 focus:ring-teal-500 focus:border-teal-500
                   ${isRestricted
                     ? 'border-red-300 bg-red-50 text-red-700'
                     : isMildlyRestricted
                       ? 'border-amber-300 bg-amber-50 text-amber-700'
                       : 'border-gray-300'}`}
        placeholder="°"
      />
      {isRestricted && (
        <AlertTriangle className="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
      )}
    </div>
  );
}

/**
 * Single region ROM table
 */
function RegionROMTable({ region, values = {}, onChange, lang = 'no', readOnly = false, side = null }) {
  const regionData = ROM_NORMS[region];
  if (!regionData) return null;

  const handleChange = (movementId, value) => {
    const key = side ? `${movementId}_${side}` : movementId;
    onChange({
      ...values,
      [key]: value
    });
  };

  const getValue = (movementId) => {
    const key = side ? `${movementId}_${side}` : movementId;
    return values[key] || '';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <h4 className="font-medium text-sm text-gray-700">
          {lang === 'no' ? regionData.nameNo : regionData.name}
          {side && ` (${side === 'left' ? 'V' : 'H'})`}
        </h4>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {regionData.movements.map((movement) => {
            const currentVal = getValue(movement.id);
            const percentage = currentVal ? (parseInt(currentVal) / movement.normal) * 100 : 0;
            const hasPain = values[`${movement.id}_pain`];

            return (
              <div
                key={movement.id}
                className={`p-2 rounded-lg border transition-colors
                           ${hasPain ? 'border-red-300 bg-red-50' :
                             percentage > 0 && percentage < 70 ? 'border-red-200 bg-red-50' :
                             percentage >= 70 && percentage < 90 ? 'border-amber-200 bg-amber-50' :
                             percentage >= 90 ? 'border-green-200 bg-green-50' :
                             'border-gray-200 bg-white'}`}
              >
                {/* Movement name */}
                <div className="text-xs font-medium text-gray-600 text-center mb-1 truncate">
                  {lang === 'no' ? movement.nameNo : movement.name}
                </div>

                {/* Arc slider */}
                <ROMArcSlider
                  value={currentVal}
                  onChange={(val) => handleChange(movement.id, val)}
                  normal={movement.normal}
                  readOnly={readOnly}
                />

                {/* Normal value label */}
                <div className="text-[10px] text-gray-400 text-center">
                  Normal: {movement.normal}°
                </div>

                {/* Pain toggle */}
                <div className="flex justify-center mt-1">
                  <button
                    type="button"
                    onClick={() => !readOnly && handleChange(`${movement.id}_pain`, !hasPain)}
                    disabled={readOnly}
                    className={`px-2 py-0.5 text-[10px] rounded-full transition-colors
                               ${hasPain
                                 ? 'bg-red-500 text-white'
                                 : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'}`}
                  >
                    {hasPain ? '⚡ Smerte' : '+ Smerte'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Main ROMTable component
 */
export default function ROMTable({
  values = {},
  onChange,
  regions = ['cervical', 'lumbar'],
  lang = 'no',
  readOnly = false,
  showBilateral = false,
  onGenerateNarrative
}) {
  // Generate narrative from ROM values
  const generateNarrative = useMemo(() => {
    const findings = [];

    regions.forEach(region => {
      const regionData = ROM_NORMS[region];
      if (!regionData) return;

      const regionFindings = [];
      const regionValues = values[region] || {};

      regionData.movements.forEach(movement => {
        const measured = regionValues[movement.id];
        if (!measured) return;

        const percentage = (parseInt(measured) / movement.normal) * 100;
        const hasPain = regionValues[`${movement.id}_pain`];

        if (percentage < 70) {
          regionFindings.push(`${lang === 'no' ? movement.nameNo : movement.name}: ${measured}° (betydelig redusert)${hasPain ? ' med smerte' : ''}`);
        } else if (percentage < 90) {
          regionFindings.push(`${lang === 'no' ? movement.nameNo : movement.name}: ${measured}° (lett redusert)${hasPain ? ' med smerte' : ''}`);
        } else if (hasPain) {
          regionFindings.push(`${lang === 'no' ? movement.nameNo : movement.name}: ${measured}° med smerte`);
        }
      });

      if (regionFindings.length > 0) {
        const regionName = lang === 'no' ? regionData.nameNo : regionData.name;
        findings.push(`${regionName} ROM: ${regionFindings.join(', ')}`);
      }
    });

    if (findings.length === 0) {
      return lang === 'no' ? 'ROM: Alle bevegelser innen normalområdet.' : 'ROM: All movements within normal limits.';
    }

    return findings.join('. ') + '.';
  }, [values, regions, lang]);

  const handleRegionChange = (region, regionValues) => {
    onChange({
      ...values,
      [region]: regionValues
    });
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    let total = 0;
    let restricted = 0;
    let painful = 0;

    regions.forEach(region => {
      const regionData = ROM_NORMS[region];
      if (!regionData) return;

      const regionValues = values[region] || {};

      regionData.movements.forEach(movement => {
        const measured = regionValues[movement.id];
        if (measured) {
          total++;
          const percentage = (parseInt(measured) / movement.normal) * 100;
          if (percentage < 70) restricted++;
          if (regionValues[`${movement.id}_pain`]) painful++;
        }
      });
    });

    return { total, restricted, painful };
  }, [values, regions]);

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Leddutslag (ROM)' : 'Range of Motion'}
          </h3>
          {summary.total > 0 && (
            <p className="text-sm text-gray-500">
              {summary.total} {lang === 'no' ? 'målinger' : 'measurements'}
              {summary.restricted > 0 && (
                <span className="text-red-600 ml-2">
                  • {summary.restricted} {lang === 'no' ? 'redusert' : 'restricted'}
                </span>
              )}
              {summary.painful > 0 && (
                <span className="text-amber-600 ml-2">
                  • {summary.painful} {lang === 'no' ? 'med smerte' : 'painful'}
                </span>
              )}
            </p>
          )}
        </div>

        {onGenerateNarrative && (
          <button
            onClick={() => onGenerateNarrative(generateNarrative)}
            className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg
                      hover:bg-teal-700 transition-colors"
          >
            {lang === 'no' ? 'Generer tekst' : 'Generate Text'}
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
          <span>&lt;70% = {lang === 'no' ? 'Betydelig redusert' : 'Significantly restricted'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded" />
          <span>70-90% = {lang === 'no' ? 'Lett redusert' : 'Mildly restricted'}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>&gt;90% = {lang === 'no' ? 'Normal' : 'Normal'}</span>
        </div>
      </div>

      {/* ROM Tables */}
      <div className={`grid gap-4 ${regions.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {regions.map(region => (
          <RegionROMTable
            key={region}
            region={region}
            values={values[region] || {}}
            onChange={(v) => handleRegionChange(region, v)}
            lang={lang}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Bilateral option for extremities */}
      {showBilateral && regions.some(r => ['shoulder', 'hip', 'knee', 'ankle'].includes(r)) && (
        <div className="grid md:grid-cols-2 gap-4">
          {regions.filter(r => ['shoulder', 'hip', 'knee', 'ankle'].includes(r)).map(region => (
            <React.Fragment key={region}>
              <RegionROMTable
                region={region}
                values={values[`${region}_left`] || {}}
                onChange={(v) => handleRegionChange(`${region}_left`, v)}
                lang={lang}
                readOnly={readOnly}
                side="left"
              />
              <RegionROMTable
                region={region}
                values={values[`${region}_right`] || {}}
                onChange={(v) => handleRegionChange(`${region}_right`, v)}
                lang={lang}
                readOnly={readOnly}
                side="right"
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
