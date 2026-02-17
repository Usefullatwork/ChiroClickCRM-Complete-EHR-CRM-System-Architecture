/**
 * EnhancedBodyDiagram - Professional body diagram using react-body-highlighter
 *
 * Features:
 * - Anatomically accurate SVG body model
 * - Front/Back/Side view toggle
 * - Click regions for pain documentation
 * - Muscle group highlighting
 * - Integration with text insertion system
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import Model from 'react-body-highlighter';
import { RotateCcw, User } from 'lucide-react';

// Map our region IDs to react-body-highlighter muscle names
const REGION_TO_MUSCLES = {
  // Head/Neck
  head: ['head'],
  neck_front: ['neck'],
  neck_back: ['trapezius'],

  // Shoulders
  r_shoulder: ['right-deltoid', 'right-trapezius'],
  l_shoulder: ['left-deltoid', 'left-trapezius'],

  // Arms
  r_arm_upper: ['right-biceps', 'right-triceps'],
  l_arm_upper: ['left-biceps', 'left-triceps'],
  r_arm_lower: ['right-forearm'],
  l_arm_lower: ['left-forearm'],
  r_hand: ['right-hand'],
  l_hand: ['left-hand'],

  // Torso front
  chest: ['chest'],
  abdomen: ['abs', 'obliques'],

  // Torso back
  upper_back: ['upper-back', 'trapezius'],
  mid_back: ['back'],
  lower_back: ['lower-back'],

  // Pelvis
  r_hip: ['right-gluteal'],
  l_hip: ['left-gluteal'],
  r_glute: ['right-gluteal'],
  l_glute: ['left-gluteal'],

  // Legs
  r_thigh: ['right-quadriceps', 'right-adductor'],
  l_thigh: ['left-quadriceps', 'left-adductor'],
  r_hamstring: ['right-hamstring'],
  l_hamstring: ['left-hamstring'],
  r_knee: ['right-quadriceps'],
  l_knee: ['left-quadriceps'],
  r_leg: ['right-tibialis', 'right-calves'],
  l_leg: ['left-tibialis', 'left-calves'],
  r_calf: ['right-calves'],
  l_calf: ['left-calves'],
  r_foot: ['right-foot'],
  l_foot: ['left-foot'],
};

// Norwegian labels for regions
const REGION_LABELS = {
  head: 'Hode',
  neck_front: 'Nakke (foran)',
  neck_back: 'Cervical',
  r_shoulder: 'Høyre skulder',
  l_shoulder: 'Venstre skulder',
  r_arm_upper: 'Høyre overarm',
  l_arm_upper: 'Venstre overarm',
  r_arm_lower: 'Høyre underarm',
  l_arm_lower: 'Venstre underarm',
  r_hand: 'Høyre hånd',
  l_hand: 'Venstre hånd',
  chest: 'Bryst',
  abdomen: 'Mage',
  upper_back: 'Thoracal',
  mid_back: 'Midtre rygg',
  lower_back: 'Lumbal',
  r_hip: 'Høyre hofte',
  l_hip: 'Venstre hofte',
  r_glute: 'Høyre sete',
  l_glute: 'Venstre sete',
  r_thigh: 'Høyre lår',
  l_thigh: 'Venstre lår',
  r_hamstring: 'Høyre hamstring',
  l_hamstring: 'Venstre hamstring',
  r_knee: 'Høyre kne',
  l_knee: 'Venstre kne',
  r_leg: 'Høyre legg',
  l_leg: 'Venstre legg',
  r_calf: 'Høyre legg',
  l_calf: 'Venstre legg',
  r_foot: 'Høyre fot',
  l_foot: 'Venstre fot',
};

// Chiropractic-specific region groupings
const CHIRO_REGIONS = {
  spine: ['neck_back', 'upper_back', 'mid_back', 'lower_back'],
  upper_extremity: [
    'r_shoulder',
    'l_shoulder',
    'r_arm_upper',
    'l_arm_upper',
    'r_arm_lower',
    'l_arm_lower',
    'r_hand',
    'l_hand',
  ],
  lower_extremity: [
    'r_hip',
    'l_hip',
    'r_thigh',
    'l_thigh',
    'r_knee',
    'l_knee',
    'r_leg',
    'l_leg',
    'r_foot',
    'l_foot',
  ],
  pelvis: ['r_glute', 'l_glute', 'r_hip', 'l_hip'],
};

export default function EnhancedBodyDiagram({
  selectedRegions = [],
  onChange,
  onRegionClick,
  showLabels = true,
  showQuickSelect = true,
  compact = false,
  className = '',
}) {
  const [view, setView] = useState('anterior'); // anterior, posterior
  const [hoveredMuscle, _setHoveredMuscle] = useState(null);
  const containerRef = useRef(null);

  // Convert selected regions to highlight data for react-body-highlighter
  const highlightData = useMemo(() => {
    const data = [];

    selectedRegions.forEach((regionId) => {
      const muscles = REGION_TO_MUSCLES[regionId] || [regionId];
      muscles.forEach((muscle) => {
        // Check if already in data
        const existing = data.find((d) => d.name === muscle);
        if (!existing) {
          data.push({
            name: muscle,
            muscles: [muscle],
          });
        }
      });
    });

    return data;
  }, [selectedRegions]);

  // Handle click on body part
  const handleClick = useCallback(
    (data) => {
      const muscleName = data.muscle;

      // Find which region this muscle belongs to
      let regionId = null;
      for (const [region, muscles] of Object.entries(REGION_TO_MUSCLES)) {
        if (muscles.includes(muscleName)) {
          regionId = region;
          break;
        }
      }

      if (!regionId) {
        regionId = muscleName; // Use muscle name as fallback
      }

      // If onRegionClick provided, use it for popup flow
      if (onRegionClick) {
        onRegionClick({
          regionId,
          muscle: muscleName,
          label: REGION_LABELS[regionId] || regionId,
          view,
        });
        return;
      }

      // Otherwise toggle selection
      if (onChange) {
        const isSelected = selectedRegions.includes(regionId);
        if (isSelected) {
          onChange(selectedRegions.filter((r) => r !== regionId));
        } else {
          onChange([...selectedRegions, regionId]);
        }
      }
    },
    [selectedRegions, onChange, onRegionClick, view]
  );

  // Toggle region selection
  const toggleRegion = useCallback(
    (regionId) => {
      if (!onChange) {
        return;
      }

      const isSelected = selectedRegions.includes(regionId);
      if (isSelected) {
        onChange(selectedRegions.filter((r) => r !== regionId));
      } else {
        onChange([...selectedRegions, regionId]);
      }
    },
    [selectedRegions, onChange]
  );

  // Clear all
  const clearAll = useCallback(() => {
    if (onChange) {
      onChange([]);
    }
  }, [onChange]);

  // Generate location text
  const generateLocationText = useCallback(() => {
    if (selectedRegions.length === 0) {
      return '';
    }
    return selectedRegions.map((r) => REGION_LABELS[r] || r).join(', ');
  }, [selectedRegions]);

  // Quick select buttons for common chiropractic regions
  const quickSelectRegions = [
    { id: 'neck_back', label: 'Cervical' },
    { id: 'upper_back', label: 'Thoracal' },
    { id: 'lower_back', label: 'Lumbal' },
    { id: 'r_shoulder', label: 'H. Skulder' },
    { id: 'l_shoulder', label: 'V. Skulder' },
    { id: 'r_hip', label: 'H. Hofte' },
    { id: 'l_hip', label: 'V. Hofte' },
  ];

  return (
    <div ref={containerRef} className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-gray-900">Smertelokalisasjon</h3>
          {selectedRegions.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {selectedRegions.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
            <button
              onClick={() => setView('anterior')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === 'anterior' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Foran
            </button>
            <button
              onClick={() => setView('posterior')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === 'posterior' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Bak
            </button>
          </div>

          {/* Clear Button */}
          {selectedRegions.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800"
              title="Fjern alle"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className={compact ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}>
        {/* Body Model */}
        <div className={`${compact ? '' : 'lg:col-span-2'} p-4 flex justify-center items-center`}>
          <div className="relative" style={{ maxWidth: '280px' }}>
            <Model
              data={highlightData}
              onClick={handleClick}
              type={view}
              highlightedColors={['#EF4444', '#F97316', '#EAB308']} // Red, Orange, Yellow
              bodyColor="#E5E7EB"
              style={{ width: '100%', maxWidth: '280px' }}
            />

            {/* Hovered muscle tooltip */}
            {hoveredMuscle && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg shadow-lg z-10">
                {REGION_LABELS[hoveredMuscle] || hoveredMuscle}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        {!compact && (
          <div className="p-4 border-l border-gray-200">
            {/* Quick Select */}
            {showQuickSelect && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Hurtigvalg</h4>
                <div className="flex flex-wrap gap-1.5">
                  {quickSelectRegions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => toggleRegion(region.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                        selectedRegions.includes(region.id)
                          ? 'bg-red-100 border border-red-300 text-red-800'
                          : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Regions */}
            {selectedRegions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Valgte områder</h4>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {selectedRegions.map((regionId) => (
                    <span
                      key={regionId}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full"
                    >
                      {REGION_LABELS[regionId] || regionId}
                      <button onClick={() => toggleRegion(regionId)} className="hover:text-red-600">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Region Groups */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Regioner</h4>
              <div className="space-y-2">
                {Object.entries(CHIRO_REGIONS).map(([groupName, regions]) => (
                  <div key={groupName}>
                    <span className="text-xs text-gray-400 uppercase">
                      {groupName === 'spine'
                        ? 'Ryggrad'
                        : groupName === 'upper_extremity'
                          ? 'Overekstremitet'
                          : groupName === 'lower_extremity'
                            ? 'Underekstremitet'
                            : 'Bekken'}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {regions.slice(0, 4).map((regionId) => (
                        <button
                          key={regionId}
                          onClick={() => toggleRegion(regionId)}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-all ${
                            selectedRegions.includes(regionId)
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {REGION_LABELS[regionId]?.split(' ').pop() || regionId}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Text Output */}
      {selectedRegions.length > 0 && showLabels && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-1">
            Smertelokalisasjon:
          </label>
          <p className="text-sm text-green-900">{generateLocationText()}</p>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar use
export function CompactBodyDiagram({ selectedRegions = [], onChange, onRegionClick }) {
  return (
    <EnhancedBodyDiagram
      selectedRegions={selectedRegions}
      onChange={onChange}
      onRegionClick={onRegionClick}
      showLabels={false}
      showQuickSelect={false}
      compact={true}
      className="border-0"
    />
  );
}
