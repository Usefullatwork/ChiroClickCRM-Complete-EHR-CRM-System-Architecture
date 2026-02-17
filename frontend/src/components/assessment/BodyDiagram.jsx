import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * BodyDiagram - Interactive body region selector for pain location
 * Inspired by DrChrono's visual charting and Jane App's body charts
 *
 * Features:
 * - Click to select pain regions
 * - Front/Back view toggle
 * - Laterality selection (left/right/bilateral)
 * - Generates structured location data
 */
export default function BodyDiagram({
  selectedRegions = [],
  onChange,
  showLabels = true,
  className = '',
}) {
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const toggleRegion = (regionId) => {
    const isSelected = selectedRegions.includes(regionId);
    if (isSelected) {
      onChange(selectedRegions.filter((r) => r !== regionId));
    } else {
      onChange([...selectedRegions, regionId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const getRegionColor = (regionId) => {
    if (selectedRegions.includes(regionId)) {
      return 'fill-red-400 stroke-red-600';
    }
    if (hoveredRegion === regionId) {
      return 'fill-blue-200 stroke-blue-400';
    }
    return 'fill-gray-100 stroke-gray-300';
  };

  // Body region definitions with SVG paths
  const frontRegions = [
    {
      id: 'head',
      label: 'Head',
      path: 'M100,10 Q130,10 130,40 Q130,70 100,70 Q70,70 70,40 Q70,10 100,10',
    },
    { id: 'neck_front', label: 'Neck', path: 'M90,70 L110,70 L115,95 L85,95 Z' },
    { id: 'r_shoulder', label: 'R Shoulder', path: 'M55,95 Q35,100 35,115 L55,125 L70,105 Z' },
    { id: 'l_shoulder', label: 'L Shoulder', path: 'M145,95 Q165,100 165,115 L145,125 L130,105 Z' },
    { id: 'chest', label: 'Chest', path: 'M70,95 L130,95 L135,150 L65,150 Z' },
    { id: 'abdomen', label: 'Abdomen', path: 'M70,150 L130,150 L125,200 L75,200 Z' },
    { id: 'r_arm_upper', label: 'R Upper Arm', path: 'M35,115 L55,125 L50,170 L30,165 Z' },
    { id: 'l_arm_upper', label: 'L Upper Arm', path: 'M165,115 L145,125 L150,170 L170,165 Z' },
    { id: 'r_arm_lower', label: 'R Forearm', path: 'M30,165 L50,170 L45,220 L25,215 Z' },
    { id: 'l_arm_lower', label: 'L Forearm', path: 'M170,165 L150,170 L155,220 L175,215 Z' },
    { id: 'r_hand', label: 'R Hand', path: 'M25,215 L45,220 L40,250 L20,245 Z' },
    { id: 'l_hand', label: 'L Hand', path: 'M175,215 L155,220 L160,250 L180,245 Z' },
    { id: 'r_hip', label: 'R Hip', path: 'M75,200 L100,200 L95,230 L70,230 Z' },
    { id: 'l_hip', label: 'L Hip', path: 'M100,200 L125,200 L130,230 L105,230 Z' },
    { id: 'r_thigh', label: 'R Thigh', path: 'M70,230 L95,230 L90,310 L65,310 Z' },
    { id: 'l_thigh', label: 'L Thigh', path: 'M105,230 L130,230 L135,310 L110,310 Z' },
    { id: 'r_knee', label: 'R Knee', path: 'M65,310 L90,310 L88,340 L63,340 Z' },
    { id: 'l_knee', label: 'L Knee', path: 'M110,310 L135,310 L137,340 L112,340 Z' },
    { id: 'r_leg', label: 'R Lower Leg', path: 'M63,340 L88,340 L85,410 L60,410 Z' },
    { id: 'l_leg', label: 'L Lower Leg', path: 'M112,340 L137,340 L140,410 L115,410 Z' },
    { id: 'r_foot', label: 'R Foot', path: 'M60,410 L85,410 L83,440 L55,440 Z' },
    { id: 'l_foot', label: 'L Foot', path: 'M115,410 L140,410 L145,440 L117,440 Z' },
  ];

  const backRegions = [
    {
      id: 'head_back',
      label: 'Head',
      path: 'M100,10 Q130,10 130,40 Q130,70 100,70 Q70,70 70,40 Q70,10 100,10',
    },
    { id: 'neck_back', label: 'Cervical', path: 'M85,70 L115,70 L118,100 L82,100 Z' },
    { id: 'r_shoulder_back', label: 'R Shoulder', path: 'M55,95 Q35,100 35,115 L55,125 L68,105 Z' },
    {
      id: 'l_shoulder_back',
      label: 'L Shoulder',
      path: 'M145,95 Q165,100 165,115 L145,125 L132,105 Z',
    },
    { id: 'upper_back', label: 'Thoracic', path: 'M68,100 L132,100 L135,155 L65,155 Z' },
    { id: 'mid_back', label: 'Mid Back', path: 'M65,155 L135,155 L130,185 L70,185 Z' },
    { id: 'lower_back', label: 'Lumbar', path: 'M70,185 L130,185 L125,210 L75,210 Z' },
    { id: 'sacrum', label: 'Sacrum', path: 'M80,210 L120,210 L115,235 L85,235 Z' },
    { id: 'r_si', label: 'R SI Joint', path: 'M75,210 L80,210 L85,235 L70,235 Z' },
    { id: 'l_si', label: 'L SI Joint', path: 'M120,210 L125,210 L130,235 L115,235 Z' },
    { id: 'r_glute', label: 'R Glute', path: 'M70,235 L100,235 L95,275 L65,275 Z' },
    { id: 'l_glute', label: 'L Glute', path: 'M100,235 L130,235 L135,275 L105,275 Z' },
    { id: 'r_arm_back_upper', label: 'R Upper Arm', path: 'M35,115 L55,125 L50,170 L30,165 Z' },
    { id: 'l_arm_back_upper', label: 'L Upper Arm', path: 'M165,115 L145,125 L150,170 L170,165 Z' },
    { id: 'r_arm_back_lower', label: 'R Forearm', path: 'M30,165 L50,170 L45,220 L25,215 Z' },
    { id: 'l_arm_back_lower', label: 'L Forearm', path: 'M170,165 L150,170 L155,220 L175,215 Z' },
    { id: 'r_hamstring', label: 'R Hamstring', path: 'M65,275 L95,275 L90,340 L63,340 Z' },
    { id: 'l_hamstring', label: 'L Hamstring', path: 'M105,275 L135,275 L137,340 L110,340 Z' },
    { id: 'r_calf', label: 'R Calf', path: 'M63,340 L90,340 L85,410 L60,410 Z' },
    { id: 'l_calf', label: 'L Calf', path: 'M110,340 L137,340 L140,410 L115,410 Z' },
    { id: 'r_heel', label: 'R Heel', path: 'M60,410 L85,410 L83,440 L55,440 Z' },
    { id: 'l_heel', label: 'L Heel', path: 'M115,410 L140,410 L145,440 L117,440 Z' },
  ];

  const regions = view === 'front' ? frontRegions : backRegions;

  // Generate text from selections
  const generateLocationText = () => {
    if (selectedRegions.length === 0) {
      return '';
    }
    const allRegions = [...frontRegions, ...backRegions];
    const labels = selectedRegions.map((id) => {
      const region = allRegions.find((r) => r.id === id);
      return region?.label || id;
    });
    return labels.join(', ');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h3 className="font-medium text-gray-900">Pain Location</h3>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
            <button
              onClick={() => setView('front')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === 'front' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setView('back')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === 'back' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Back
            </button>
          </div>

          {/* Clear Button */}
          {selectedRegions.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Body Diagram */}
      <div className="p-4 flex justify-center">
        <svg viewBox="0 0 200 460" className="w-48 h-auto" style={{ maxHeight: '350px' }}>
          {/* Background silhouette */}
          <ellipse cx="100" cy="40" rx="30" ry="35" className="fill-gray-200 stroke-gray-300" />
          <rect
            x="70"
            y="70"
            width="60"
            height="130"
            rx="5"
            className="fill-gray-200 stroke-gray-300"
          />
          <rect
            x="30"
            y="110"
            width="25"
            height="110"
            rx="3"
            className="fill-gray-200 stroke-gray-300"
          />
          <rect
            x="145"
            y="110"
            width="25"
            height="110"
            rx="3"
            className="fill-gray-200 stroke-gray-300"
          />
          <rect
            x="65"
            y="200"
            width="30"
            height="180"
            rx="3"
            className="fill-gray-200 stroke-gray-300"
          />
          <rect
            x="105"
            y="200"
            width="30"
            height="180"
            rx="3"
            className="fill-gray-200 stroke-gray-300"
          />

          {/* Clickable regions */}
          {regions.map((region) => (
            <g key={region.id}>
              <path
                d={region.path}
                className={`cursor-pointer transition-colors ${getRegionColor(region.id)}`}
                strokeWidth="2"
                onClick={() => toggleRegion(region.id)}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            </g>
          ))}

          {/* Hover label */}
          {hoveredRegion && (
            <g>
              <rect x="50" y="0" width="100" height="20" rx="4" className="fill-gray-800" />
              <text x="100" y="14" textAnchor="middle" className="fill-white text-xs font-medium">
                {regions.find((r) => r.id === hoveredRegion)?.label || hoveredRegion}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Selected Regions Pills */}
      {selectedRegions.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {selectedRegions.map((regionId) => {
              const region = [...frontRegions, ...backRegions].find((r) => r.id === regionId);
              return (
                <span
                  key={regionId}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full"
                >
                  {region?.label || regionId}
                  <button onClick={() => toggleRegion(regionId)} className="hover:text-red-600">
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated Text Output */}
      {selectedRegions.length > 0 && showLabels && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-1">Pain Location:</label>
          <p className="text-sm text-green-900">{generateLocationText()}</p>
        </div>
      )}
    </div>
  );
}

// Quick select buttons for common regions
export function QuickRegionSelect({ onChange, selectedRegions = [] }) {
  const commonRegions = [
    { id: 'neck_back', label: 'Cervical' },
    { id: 'upper_back', label: 'Thoracic' },
    { id: 'lower_back', label: 'Lumbar' },
    { id: 'sacrum', label: 'Sacrum' },
    { id: 'r_si', label: 'R SI' },
    { id: 'l_si', label: 'L SI' },
    { id: 'r_shoulder', label: 'R Shoulder' },
    { id: 'l_shoulder', label: 'L Shoulder' },
    { id: 'head', label: 'Head' },
    { id: 'r_hip', label: 'R Hip' },
    { id: 'l_hip', label: 'L Hip' },
  ];

  const toggleRegion = (regionId) => {
    const isSelected = selectedRegions.includes(regionId);
    if (isSelected) {
      onChange(selectedRegions.filter((r) => r !== regionId));
    } else {
      onChange([...selectedRegions, regionId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {commonRegions.map((region) => (
        <button
          key={region.id}
          onClick={() => toggleRegion(region.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
            selectedRegions.includes(region.id)
              ? 'bg-red-100 border-red-300 text-red-800'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {region.label}
        </button>
      ))}
    </div>
  );
}
