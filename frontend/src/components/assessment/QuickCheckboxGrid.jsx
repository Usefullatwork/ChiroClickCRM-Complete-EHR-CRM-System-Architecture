import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * QuickCheckboxGrid - A fast, click-based assessment component
 * Inspired by ChiroTouch and Jane App's quick-select patterns
 *
 * Features:
 * - Checkbox grids for common findings
 * - Collapsible categories
 * - Multi-select support
 * - Generates structured text output
 */
export default function QuickCheckboxGrid({
  title,
  categories,
  selectedValues = [],
  onChange,
  columns = 3,
  showGeneratedText = true,
  className = ''
}) {
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(categories).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleValue = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const selectAll = (category) => {
    const categoryItems = categories[category];
    const allSelected = categoryItems.every(item => selectedValues.includes(item.value));

    if (allSelected) {
      // Deselect all in category
      onChange(selectedValues.filter(v => !categoryItems.some(item => item.value === v)));
    } else {
      // Select all in category
      const newValues = [...selectedValues];
      categoryItems.forEach(item => {
        if (!newValues.includes(item.value)) {
          newValues.push(item.value);
        }
      });
      onChange(newValues);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  // Generate human-readable text from selections
  const generateText = () => {
    if (selectedValues.length === 0) return '';

    const groupedSelections = {};
    Object.entries(categories).forEach(([categoryName, items]) => {
      const selected = items.filter(item => selectedValues.includes(item.value));
      if (selected.length > 0) {
        groupedSelections[categoryName] = selected.map(item => item.label);
      }
    });

    return Object.entries(groupedSelections)
      .map(([category, items]) => `${category}: ${items.join(', ')}`)
      .join('. ');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {selectedValues.length} selected
          </span>
          {selectedValues.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100">
        {Object.entries(categories).map(([categoryName, items]) => {
          const isExpanded = expandedCategories[categoryName];
          const selectedCount = items.filter(item => selectedValues.includes(item.value)).length;
          const allSelected = items.length > 0 && selectedCount === items.length;

          return (
            <div key={categoryName}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryName)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{categoryName}</span>
                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAll(categoryName);
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      allSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Category Items */}
              {isExpanded && (
                <div className={`px-4 pb-3 grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                  {items.map(item => {
                    const isSelected = selectedValues.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        onClick={() => toggleValue(item.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Generated Text Output */}
      {showGeneratedText && selectedValues.length > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-1">
            Generated Documentation:
          </label>
          <p className="text-sm text-green-900">{generateText()}</p>
        </div>
      )}
    </div>
  );
}

// Pre-built assessment configurations for chiropractic use
export const PAIN_QUALITY_OPTIONS = {
  'Pain Type': [
    { value: 'sharp', label: 'Sharp' },
    { value: 'dull', label: 'Dull' },
    { value: 'aching', label: 'Aching' },
    { value: 'burning', label: 'Burning' },
    { value: 'throbbing', label: 'Throbbing' },
    { value: 'stabbing', label: 'Stabbing' },
  ],
  'Pain Pattern': [
    { value: 'constant', label: 'Constant' },
    { value: 'intermittent', label: 'Intermittent' },
    { value: 'radiating', label: 'Radiating' },
    { value: 'localized', label: 'Localized' },
    { value: 'referred', label: 'Referred' },
    { value: 'numbness', label: 'Numbness/Tingling' },
  ]
};

export const AGGRAVATING_FACTORS_OPTIONS = {
  'Positions': [
    { value: 'sitting', label: 'Sitting' },
    { value: 'standing', label: 'Standing' },
    { value: 'lying', label: 'Lying down' },
    { value: 'walking', label: 'Walking' },
  ],
  'Movements': [
    { value: 'bending_forward', label: 'Bending forward' },
    { value: 'bending_backward', label: 'Bending backward' },
    { value: 'twisting', label: 'Twisting' },
    { value: 'lifting', label: 'Lifting' },
    { value: 'reaching', label: 'Reaching overhead' },
  ],
  'Activities': [
    { value: 'prolonged_sitting', label: 'Prolonged sitting' },
    { value: 'driving', label: 'Driving' },
    { value: 'computer_work', label: 'Computer work' },
    { value: 'physical_activity', label: 'Physical activity' },
    { value: 'coughing', label: 'Coughing/Sneezing' },
  ]
};

export const RELIEVING_FACTORS_OPTIONS = {
  'Positions': [
    { value: 'rest', label: 'Rest' },
    { value: 'lying_down', label: 'Lying down' },
    { value: 'sitting', label: 'Sitting' },
    { value: 'standing', label: 'Standing' },
    { value: 'position_change', label: 'Changing position' },
  ],
  'Treatments': [
    { value: 'heat', label: 'Heat' },
    { value: 'ice', label: 'Ice' },
    { value: 'medication', label: 'Medication' },
    { value: 'stretching', label: 'Stretching' },
    { value: 'massage', label: 'Massage' },
  ]
};

export const OBSERVATION_FINDINGS_OPTIONS = {
  'Posture': [
    { value: 'forward_head', label: 'Forward head posture' },
    { value: 'rounded_shoulders', label: 'Rounded shoulders' },
    { value: 'increased_kyphosis', label: 'Increased thoracic kyphosis' },
    { value: 'increased_lordosis', label: 'Increased lumbar lordosis' },
    { value: 'decreased_lordosis', label: 'Decreased lumbar lordosis' },
    { value: 'scoliosis', label: 'Scoliosis' },
    { value: 'pelvic_tilt', label: 'Pelvic tilt' },
    { value: 'leg_length_diff', label: 'Leg length discrepancy' },
  ],
  'Gait': [
    { value: 'gait_normal', label: 'Normal gait' },
    { value: 'antalgic_gait', label: 'Antalgic gait' },
    { value: 'limping', label: 'Limping' },
    { value: 'shuffling', label: 'Shuffling' },
    { value: 'guarded_movement', label: 'Guarded movement' },
  ],
  'Appearance': [
    { value: 'swelling', label: 'Swelling' },
    { value: 'bruising', label: 'Bruising' },
    { value: 'muscle_atrophy', label: 'Muscle atrophy' },
    { value: 'muscle_spasm', label: 'Visible muscle spasm' },
    { value: 'skin_changes', label: 'Skin changes' },
  ]
};

export const PALPATION_FINDINGS_OPTIONS = {
  'Muscle Findings': [
    { value: 'tenderness', label: 'Point tenderness' },
    { value: 'muscle_tension', label: 'Muscle tension/hypertonicity' },
    { value: 'trigger_points', label: 'Trigger points' },
    { value: 'muscle_spasm', label: 'Muscle spasm' },
    { value: 'taut_bands', label: 'Taut bands' },
  ],
  'Joint Findings': [
    { value: 'joint_tenderness', label: 'Joint tenderness' },
    { value: 'decreased_mobility', label: 'Decreased joint mobility' },
    { value: 'hypermobility', label: 'Joint hypermobility' },
    { value: 'crepitus', label: 'Crepitus' },
    { value: 'joint_swelling', label: 'Joint swelling' },
  ],
  'Tissue Quality': [
    { value: 'warm', label: 'Warm to touch' },
    { value: 'cool', label: 'Cool to touch' },
    { value: 'edema', label: 'Edema' },
    { value: 'fibrosis', label: 'Fibrotic changes' },
  ]
};

export const ROM_FINDINGS_OPTIONS = {
  'Cervical Spine': [
    { value: 'c_flex_reduced', label: 'Flexion reduced' },
    { value: 'c_ext_reduced', label: 'Extension reduced' },
    { value: 'c_lat_flex_r_reduced', label: 'R lateral flexion reduced' },
    { value: 'c_lat_flex_l_reduced', label: 'L lateral flexion reduced' },
    { value: 'c_rot_r_reduced', label: 'R rotation reduced' },
    { value: 'c_rot_l_reduced', label: 'L rotation reduced' },
  ],
  'Lumbar Spine': [
    { value: 'l_flex_reduced', label: 'Flexion reduced' },
    { value: 'l_ext_reduced', label: 'Extension reduced' },
    { value: 'l_lat_flex_r_reduced', label: 'R lateral flexion reduced' },
    { value: 'l_lat_flex_l_reduced', label: 'L lateral flexion reduced' },
    { value: 'l_rot_r_reduced', label: 'R rotation reduced' },
    { value: 'l_rot_l_reduced', label: 'L rotation reduced' },
  ],
  'Pain Response': [
    { value: 'pain_at_end_range', label: 'Pain at end range' },
    { value: 'pain_throughout', label: 'Pain throughout range' },
    { value: 'deviation', label: 'Deviation during movement' },
    { value: 'centralization', label: 'Centralization' },
    { value: 'peripheralization', label: 'Peripheralization' },
  ]
};

export const ORTHO_TESTS_OPTIONS = {
  'Lumbar Tests': [
    { value: 'slr_pos_r', label: 'SLR positive R' },
    { value: 'slr_pos_l', label: 'SLR positive L' },
    { value: 'slr_neg', label: 'SLR negative bilateral' },
    { value: 'kemps_pos_r', label: "Kemp's positive R" },
    { value: 'kemps_pos_l', label: "Kemp's positive L" },
    { value: 'kemps_neg', label: "Kemp's negative" },
    { value: 'valsalva_pos', label: 'Valsalva positive' },
    { value: 'milgram_pos', label: "Milgram's positive" },
  ],
  'Cervical Tests': [
    { value: 'spurling_pos_r', label: "Spurling's positive R" },
    { value: 'spurling_pos_l', label: "Spurling's positive L" },
    { value: 'spurling_neg', label: "Spurling's negative" },
    { value: 'distraction_pos', label: 'Distraction positive' },
    { value: 'compression_pos', label: 'Compression positive' },
    { value: 'shoulder_abduction', label: 'Shoulder abduction relief' },
  ],
  'SI Joint Tests': [
    { value: 'faber_pos_r', label: 'FABER positive R' },
    { value: 'faber_pos_l', label: 'FABER positive L' },
    { value: 'gaenslen_pos', label: "Gaenslen's positive" },
    { value: 'si_compression_pos', label: 'SI compression positive' },
    { value: 'si_distraction_pos', label: 'SI distraction positive' },
  ]
};

export const NEURO_TESTS_OPTIONS = {
  'Reflexes': [
    { value: 'reflex_normal', label: 'Reflexes normal' },
    { value: 'reflex_diminished', label: 'Reflexes diminished' },
    { value: 'reflex_hyperactive', label: 'Reflexes hyperactive' },
    { value: 'achilles_diminished', label: 'Achilles diminished' },
    { value: 'patellar_diminished', label: 'Patellar diminished' },
    { value: 'biceps_diminished', label: 'Biceps diminished' },
    { value: 'triceps_diminished', label: 'Triceps diminished' },
  ],
  'Sensation': [
    { value: 'sensation_normal', label: 'Sensation normal' },
    { value: 'sensation_diminished', label: 'Sensation diminished' },
    { value: 'dermatomal_deficit', label: 'Dermatomal deficit' },
    { value: 'paresthesia', label: 'Paresthesia' },
  ],
  'Motor Strength': [
    { value: 'strength_normal', label: 'Motor strength normal' },
    { value: 'strength_reduced', label: 'Motor strength reduced' },
    { value: 'myotomal_weakness', label: 'Myotomal weakness' },
    { value: 'foot_drop', label: 'Foot drop' },
    { value: 'grip_weakness', label: 'Grip weakness' },
  ]
};

export const TREATMENT_OPTIONS = {
  'Manipulation': [
    { value: 'hvla_cervical', label: 'HVLA - Cervical' },
    { value: 'hvla_thoracic', label: 'HVLA - Thoracic' },
    { value: 'hvla_lumbar', label: 'HVLA - Lumbar' },
    { value: 'hvla_si', label: 'HVLA - SI Joint' },
    { value: 'mobilization', label: 'Joint mobilization' },
    { value: 'drop_technique', label: 'Drop technique' },
    { value: 'activator', label: 'Activator technique' },
    { value: 'flexion_distraction', label: 'Flexion-distraction' },
  ],
  'Soft Tissue': [
    { value: 'myofascial_release', label: 'Myofascial release' },
    { value: 'trigger_point', label: 'Trigger point therapy' },
    { value: 'massage', label: 'Massage therapy' },
    { value: 'iastm', label: 'IASTM/Graston' },
    { value: 'cupping', label: 'Cupping therapy' },
    { value: 'dry_needling', label: 'Dry needling' },
    { value: 'stretching', label: 'Assisted stretching' },
  ],
  'Modalities': [
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'electrical_stim', label: 'Electrical stimulation' },
    { value: 'tens', label: 'TENS' },
    { value: 'heat_therapy', label: 'Heat therapy' },
    { value: 'ice_therapy', label: 'Ice/cryotherapy' },
    { value: 'laser_therapy', label: 'Laser therapy' },
    { value: 'traction', label: 'Traction' },
  ]
};

export const EXERCISE_OPTIONS = {
  'Stretches': [
    { value: 'neck_stretches', label: 'Neck stretches' },
    { value: 'upper_trap_stretch', label: 'Upper trap stretch' },
    { value: 'levator_scap_stretch', label: 'Levator scapulae stretch' },
    { value: 'cat_cow', label: 'Cat-cow stretch' },
    { value: 'knee_to_chest', label: 'Knee to chest' },
    { value: 'piriformis_stretch', label: 'Piriformis stretch' },
    { value: 'hip_flexor_stretch', label: 'Hip flexor stretch' },
    { value: 'hamstring_stretch', label: 'Hamstring stretch' },
  ],
  'Strengthening': [
    { value: 'chin_tucks', label: 'Chin tucks' },
    { value: 'scapular_retraction', label: 'Scapular retraction' },
    { value: 'core_bracing', label: 'Core bracing/activation' },
    { value: 'bird_dog', label: 'Bird-dog exercise' },
    { value: 'dead_bug', label: 'Dead bug exercise' },
    { value: 'bridges', label: 'Glute bridges' },
    { value: 'planks', label: 'Plank variations' },
    { value: 'clamshells', label: 'Clamshells' },
  ],
  'General Advice': [
    { value: 'postural_correction', label: 'Postural correction' },
    { value: 'ergonomic_advice', label: 'Ergonomic setup advice' },
    { value: 'activity_modification', label: 'Activity modification' },
    { value: 'walking_program', label: 'Walking program' },
    { value: 'ice_at_home', label: 'Ice application at home' },
    { value: 'heat_at_home', label: 'Heat application at home' },
  ]
};
