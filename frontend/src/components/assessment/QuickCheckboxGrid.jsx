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
  className = '',
}) {
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(categories).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleValue = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const selectAll = (category) => {
    const categoryItems = categories[category];
    const allSelected = categoryItems.every((item) => selectedValues.includes(item.value));

    if (allSelected) {
      // Deselect all in category
      onChange(selectedValues.filter((v) => !categoryItems.some((item) => item.value === v)));
    } else {
      // Select all in category
      const newValues = [...selectedValues];
      categoryItems.forEach((item) => {
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
    if (selectedValues.length === 0) {
      return '';
    }

    const groupedSelections = {};
    Object.entries(categories).forEach(([categoryName, items]) => {
      const selected = items.filter((item) => selectedValues.includes(item.value));
      if (selected.length > 0) {
        groupedSelections[categoryName] = selected.map((item) => item.label);
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
          <span className="text-sm text-gray-500">{selectedValues.length} selected</span>
          {selectedValues.length > 0 && (
            <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-800">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100">
        {Object.entries(categories).map(([categoryName, items]) => {
          const isExpanded = expandedCategories[categoryName];
          const selectedCount = items.filter((item) => selectedValues.includes(item.value)).length;
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
                <div
                  className={`px-4 pb-3 grid gap-2`}
                  style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {items.map((item) => {
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
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}
                        >
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
  ],
};

export const AGGRAVATING_FACTORS_OPTIONS = {
  Positions: [
    { value: 'sitting', label: 'Sitting' },
    { value: 'standing', label: 'Standing' },
    { value: 'lying', label: 'Lying down' },
    { value: 'walking', label: 'Walking' },
  ],
  Movements: [
    { value: 'bending_forward', label: 'Bending forward' },
    { value: 'bending_backward', label: 'Bending backward' },
    { value: 'twisting', label: 'Twisting' },
    { value: 'lifting', label: 'Lifting' },
    { value: 'reaching', label: 'Reaching overhead' },
  ],
  Activities: [
    { value: 'prolonged_sitting', label: 'Prolonged sitting' },
    { value: 'driving', label: 'Driving' },
    { value: 'computer_work', label: 'Computer work' },
    { value: 'physical_activity', label: 'Physical activity' },
    { value: 'coughing', label: 'Coughing/Sneezing' },
  ],
};

export const RELIEVING_FACTORS_OPTIONS = {
  Positions: [
    { value: 'rest', label: 'Rest' },
    { value: 'lying_down', label: 'Lying down' },
    { value: 'sitting', label: 'Sitting' },
    { value: 'standing', label: 'Standing' },
    { value: 'position_change', label: 'Changing position' },
  ],
  Treatments: [
    { value: 'heat', label: 'Heat' },
    { value: 'ice', label: 'Ice' },
    { value: 'medication', label: 'Medication' },
    { value: 'stretching', label: 'Stretching' },
    { value: 'massage', label: 'Massage' },
  ],
};

export const OBSERVATION_FINDINGS_OPTIONS = {
  Posture: [
    { value: 'forward_head', label: 'Forward head posture' },
    { value: 'rounded_shoulders', label: 'Rounded shoulders' },
    { value: 'increased_kyphosis', label: 'Increased thoracic kyphosis' },
    { value: 'increased_lordosis', label: 'Increased lumbar lordosis' },
    { value: 'decreased_lordosis', label: 'Decreased lumbar lordosis' },
    { value: 'scoliosis', label: 'Scoliosis' },
    { value: 'pelvic_tilt', label: 'Pelvic tilt' },
    { value: 'leg_length_diff', label: 'Leg length discrepancy' },
  ],
  Gait: [
    { value: 'gait_normal', label: 'Normal gait' },
    { value: 'antalgic_gait', label: 'Antalgic gait' },
    { value: 'limping', label: 'Limping' },
    { value: 'shuffling', label: 'Shuffling' },
    { value: 'guarded_movement', label: 'Guarded movement' },
  ],
  Appearance: [
    { value: 'swelling', label: 'Swelling' },
    { value: 'bruising', label: 'Bruising' },
    { value: 'muscle_atrophy', label: 'Muscle atrophy' },
    { value: 'muscle_spasm', label: 'Visible muscle spasm' },
    { value: 'skin_changes', label: 'Skin changes' },
  ],
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
  ],
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
  ],
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
  ],
};

export const NEURO_TESTS_OPTIONS = {
  Reflexes: [
    { value: 'reflex_normal', label: 'Reflexes normal' },
    { value: 'reflex_diminished', label: 'Reflexes diminished' },
    { value: 'reflex_hyperactive', label: 'Reflexes hyperactive' },
    { value: 'achilles_diminished', label: 'Achilles diminished' },
    { value: 'patellar_diminished', label: 'Patellar diminished' },
    { value: 'biceps_diminished', label: 'Biceps diminished' },
    { value: 'triceps_diminished', label: 'Triceps diminished' },
  ],
  Sensation: [
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
  ],
};

export const TREATMENT_OPTIONS = {
  Manipulation: [
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
  Modalities: [
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'electrical_stim', label: 'Electrical stimulation' },
    { value: 'tens', label: 'TENS' },
    { value: 'heat_therapy', label: 'Heat therapy' },
    { value: 'ice_therapy', label: 'Ice/cryotherapy' },
    { value: 'laser_therapy', label: 'Laser therapy' },
    { value: 'traction', label: 'Traction' },
  ],
};

export const EXERCISE_OPTIONS = {
  Stretches: [
    { value: 'neck_stretches', label: 'Neck stretches' },
    { value: 'upper_trap_stretch', label: 'Upper trap stretch' },
    { value: 'levator_scap_stretch', label: 'Levator scapulae stretch' },
    { value: 'cat_cow', label: 'Cat-cow stretch' },
    { value: 'knee_to_chest', label: 'Knee to chest' },
    { value: 'piriformis_stretch', label: 'Piriformis stretch' },
    { value: 'hip_flexor_stretch', label: 'Hip flexor stretch' },
    { value: 'hamstring_stretch', label: 'Hamstring stretch' },
  ],
  Strengthening: [
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
  ],
};

// ============================================================================
// SHOULDER & ARM ASSESSMENT OPTIONS
// ============================================================================

export const SHOULDER_ROM_OPTIONS = {
  'Active ROM': [
    { value: 'sh_flex_normal', label: 'Flexion 180° normal' },
    { value: 'sh_flex_reduced', label: 'Flexion reduced' },
    { value: 'sh_ext_normal', label: 'Extension 50° normal' },
    { value: 'sh_ext_reduced', label: 'Extension reduced' },
    { value: 'sh_abd_normal', label: 'Abduction 180° normal' },
    { value: 'sh_abd_reduced', label: 'Abduction reduced' },
    { value: 'sh_add_normal', label: 'Adduction 35° normal' },
    { value: 'sh_er_normal', label: 'External rotation 80° normal' },
    { value: 'sh_er_reduced', label: 'External rotation reduced' },
    { value: 'sh_ir_normal', label: 'Internal rotation 90° normal' },
    { value: 'sh_ir_reduced', label: 'Internal rotation reduced' },
    { value: 'sh_hadd_normal', label: 'Horizontal adduction 130° normal' },
    { value: 'sh_habd_normal', label: 'Horizontal abduction 30° normal' },
  ],
  'Scapulohumeral Rhythm': [
    { value: 'sh_rhythm_normal', label: 'Normal 2:1 rhythm' },
    { value: 'sh_rhythm_altered', label: 'Altered rhythm' },
    { value: 'sh_hiking', label: 'Shoulder hiking present' },
    { value: 'sh_winging', label: 'Scapular winging present' },
  ],
  'Pain Response': [
    { value: 'sh_painful_arc', label: 'Painful arc 60-120°' },
    { value: 'sh_pain_end_range', label: 'Pain at end range' },
    { value: 'sh_pain_throughout', label: 'Pain throughout range' },
    { value: 'sh_crepitus', label: 'Crepitus with motion' },
  ],
};

export const SHOULDER_IMPINGEMENT_OPTIONS = {
  'Impingement Tests': [
    { value: 'hawkins_neg', label: 'Hawkins-Kennedy negative' },
    { value: 'hawkins_pos', label: 'Hawkins-Kennedy POSITIVE' },
    { value: 'neer_neg', label: "Neer's test negative" },
    { value: 'neer_pos', label: "Neer's test POSITIVE" },
    { value: 'painful_arc_neg', label: 'Painful arc negative' },
    { value: 'painful_arc_pos', label: 'Painful arc POSITIVE (60-120°)' },
    { value: 'cross_body_neg', label: 'Cross-body adduction negative' },
    { value: 'cross_body_pos', label: 'Cross-body adduction POSITIVE' },
  ],
  'Clinical Findings': [
    { value: 'imp_lateral_pain', label: 'Lateral shoulder pain' },
    { value: 'imp_overhead_pain', label: 'Pain with overhead activities' },
    { value: 'imp_night_pain', label: 'Night pain present' },
    { value: 'imp_weakness', label: 'Weakness with abduction' },
  ],
};

export const SHOULDER_ROTATOR_CUFF_OPTIONS = {
  'Supraspinatus Tests': [
    { value: 'empty_can_neg', label: "Empty Can/Jobe's negative" },
    { value: 'empty_can_pos', label: "Empty Can/Jobe's POSITIVE" },
    { value: 'full_can_neg', label: 'Full Can test negative' },
    { value: 'full_can_pos', label: 'Full Can test POSITIVE' },
    { value: 'drop_arm_neg', label: "Codman's Arm Drop negative" },
    { value: 'drop_arm_pos', label: "Codman's Arm Drop POSITIVE" },
  ],
  'Subscapularis Tests': [
    { value: 'lift_off_neg', label: 'Lift-Off test negative' },
    { value: 'lift_off_pos', label: 'Lift-Off test POSITIVE' },
    { value: 'bear_hug_neg', label: 'Bear-Hug test negative' },
    { value: 'bear_hug_pos', label: 'Bear-Hug test POSITIVE' },
    { value: 'ir_lag_neg', label: 'Internal rotation lag negative' },
    { value: 'ir_lag_pos', label: 'Internal rotation lag POSITIVE' },
    { value: 'napoleon_neg', label: 'Napoleon/Belly press negative' },
    { value: 'napoleon_pos', label: 'Napoleon/Belly press POSITIVE' },
  ],
  'Infraspinatus/Teres Minor': [
    { value: 'er_lag_neg', label: 'External rotation lag negative' },
    { value: 'er_lag_pos', label: 'External rotation lag POSITIVE' },
    { value: 'hornblower_neg', label: "Hornblower's sign negative" },
    { value: 'hornblower_pos', label: "Hornblower's sign POSITIVE" },
    { value: 'resist_er_normal', label: 'Resisted ER normal strength' },
    { value: 'resist_er_weak', label: 'Resisted ER weak/painful' },
  ],
};

export const SHOULDER_INSTABILITY_OPTIONS = {
  'Anterior Instability': [
    { value: 'ant_appr_neg', label: 'Anterior apprehension negative' },
    { value: 'ant_appr_pos', label: 'Anterior apprehension POSITIVE' },
    { value: 'relocation_neg', label: 'Relocation test negative' },
    { value: 'relocation_pos', label: 'Relocation test POSITIVE' },
    { value: 'release_neg', label: 'Release maneuver negative' },
    { value: 'release_pos', label: 'Release maneuver POSITIVE' },
    { value: 'load_shift_ant_neg', label: 'Load & Shift anterior negative' },
    { value: 'load_shift_ant_pos', label: 'Load & Shift anterior POSITIVE' },
  ],
  'Posterior Instability': [
    { value: 'post_appr_neg', label: 'Posterior apprehension negative' },
    { value: 'post_appr_pos', label: 'Posterior apprehension POSITIVE' },
    { value: 'load_shift_post_neg', label: 'Load & Shift posterior negative' },
    { value: 'load_shift_post_pos', label: 'Load & Shift posterior POSITIVE' },
    { value: 'norwood_neg', label: "Norwood's drawer negative" },
    { value: 'norwood_pos', label: "Norwood's drawer POSITIVE" },
  ],
  'Inferior Instability': [
    { value: 'sulcus_neg', label: 'Sulcus sign negative' },
    { value: 'sulcus_pos', label: 'Sulcus sign POSITIVE' },
    { value: 'feagin_neg', label: "Feagin's test negative" },
    { value: 'feagin_pos', label: "Feagin's test POSITIVE" },
  ],
};

export const SHOULDER_LABRAL_OPTIONS = {
  'SLAP Lesion Tests': [
    { value: 'obrien_neg', label: "O'Brien's test negative" },
    { value: 'obrien_pos', label: "O'Brien's test POSITIVE" },
    { value: 'clunk_neg', label: 'Clunk test negative' },
    { value: 'clunk_pos', label: 'Clunk test POSITIVE' },
    { value: 'crank_neg', label: 'Crank test negative' },
    { value: 'crank_pos', label: 'Crank test POSITIVE' },
    { value: 'biceps_load_neg', label: 'Biceps Load Test II negative' },
    { value: 'biceps_load_pos', label: 'Biceps Load Test II POSITIVE' },
    { value: 'passive_comp_neg', label: 'Passive compression negative' },
    { value: 'passive_comp_pos', label: 'Passive compression POSITIVE' },
  ],
  'Clinical Findings': [
    { value: 'labral_clicking', label: 'Clicking with motion' },
    { value: 'labral_catching', label: 'Catching/locking sensation' },
    { value: 'labral_instability', label: 'Sense of instability' },
    { value: 'labral_overhead_pain', label: 'Pain with overhead activities' },
  ],
};

export const SHOULDER_BICEPS_OPTIONS = {
  'Biceps Tendon Tests': [
    { value: 'speed_neg', label: "Speed's test negative" },
    { value: 'speed_pos', label: "Speed's test POSITIVE" },
    { value: 'yergason_neg', label: "Yergason's test negative" },
    { value: 'yergason_pos', label: "Yergason's test POSITIVE" },
    { value: 'hyperext_neg', label: 'Hyperextension test negative' },
    { value: 'hyperext_pos', label: 'Hyperextension test POSITIVE' },
  ],
  'Clinical Findings': [
    { value: 'biceps_groove_tender', label: 'Bicipital groove tenderness' },
    { value: 'biceps_snapping', label: 'Snapping/clicking present' },
    { value: 'biceps_anterior_pain', label: 'Anterior shoulder pain' },
  ],
};

export const SHOULDER_AC_JOINT_OPTIONS = {
  'AC Joint Tests': [
    { value: 'ac_shear_neg', label: 'AC shear test negative' },
    { value: 'ac_shear_pos', label: 'AC shear test POSITIVE' },
    { value: 'piano_key_neg', label: 'Piano key sign negative' },
    { value: 'piano_key_pos', label: 'Piano key sign POSITIVE' },
    { value: 'horiz_add_neg', label: 'Horizontal adduction negative' },
    { value: 'horiz_add_pos', label: 'Horizontal adduction POSITIVE' },
    { value: 'ac_ext_neg', label: 'AC resisted extension negative' },
    { value: 'ac_ext_pos', label: 'AC resisted extension POSITIVE' },
  ],
  Classification: [
    { value: 'ac_type_1', label: 'Type 1 - AC capsule only' },
    { value: 'ac_type_2', label: 'Type 2 - Partial CC ligament' },
    { value: 'ac_type_3', label: 'Type 3 - Complete separation' },
  ],
  'Clinical Findings': [
    { value: 'ac_step_defect', label: 'Step defect visible' },
    { value: 'ac_tenderness', label: 'AC joint tenderness' },
    { value: 'ac_swelling', label: 'AC joint swelling' },
  ],
};

export const SHOULDER_FROZEN_OPTIONS = {
  'ROM Pattern (Capsular)': [
    { value: 'frozen_er_limited', label: 'External rotation limited (most)' },
    { value: 'frozen_abd_limited', label: 'Abduction limited' },
    { value: 'frozen_ir_limited', label: 'Internal rotation limited' },
    { value: 'frozen_flex_limited', label: 'Flexion limited (least)' },
    { value: 'frozen_capsular_pattern', label: 'Capsular pattern confirmed' },
  ],
  'Stage Assessment': [
    { value: 'frozen_painful_stage', label: 'Painful stage (early)' },
    { value: 'frozen_frozen_stage', label: 'Frozen stage (restricted ROM)' },
    { value: 'frozen_thawing_stage', label: 'Thawing stage (improving)' },
  ],
  'Functional Limitations': [
    { value: 'frozen_overhead_limit', label: 'Unable to reach overhead' },
    { value: 'frozen_back_limit', label: 'Unable to reach behind back' },
    { value: 'frozen_dressing', label: 'Difficulty dressing' },
    { value: 'frozen_sleep', label: 'Sleep disruption' },
  ],
};

// ============================================================================
// ELBOW & FOREARM ASSESSMENT OPTIONS
// ============================================================================

export const ELBOW_ROM_OPTIONS = {
  'Active ROM': [
    { value: 'elb_flex_normal', label: 'Flexion 150° normal' },
    { value: 'elb_flex_reduced', label: 'Flexion reduced' },
    { value: 'elb_ext_normal', label: 'Extension 0° normal' },
    { value: 'elb_ext_reduced', label: 'Extension reduced' },
    { value: 'elb_pron_normal', label: 'Pronation 90° normal' },
    { value: 'elb_pron_reduced', label: 'Pronation reduced' },
    { value: 'elb_sup_normal', label: 'Supination 90° normal' },
    { value: 'elb_sup_reduced', label: 'Supination reduced' },
  ],
  'Carrying Angle': [
    { value: 'elb_angle_normal', label: 'Carrying angle normal (5-15°)' },
    { value: 'elb_cubitus_valgus', label: 'Cubitus valgus (>15°)' },
    { value: 'elb_cubitus_varus', label: 'Cubitus varus (<5°)' },
  ],
  'End Feel': [
    { value: 'elb_endfeel_normal', label: 'Normal end feel' },
    { value: 'elb_endfeel_boggy', label: 'Boggy (joint effusion)' },
    { value: 'elb_endfeel_myospasm', label: 'Myospasm' },
    { value: 'elb_endfeel_springy', label: 'Springy block (loose body)' },
  ],
};

export const ELBOW_LATERAL_EPICONDYLITIS_OPTIONS = {
  'Lateral Epicondylitis Tests': [
    { value: 'cozen_neg', label: "Cozen's test negative" },
    { value: 'cozen_pos', label: "Cozen's test POSITIVE" },
    { value: 'mill_neg', label: "Mill's test negative" },
    { value: 'mill_pos', label: "Mill's test POSITIVE" },
    { value: 'mid_finger_ext_neg', label: 'Middle finger extension negative' },
    { value: 'mid_finger_ext_pos', label: 'Middle finger extension POSITIVE' },
    { value: 'book_test_neg', label: 'Book test negative' },
    { value: 'book_test_pos', label: 'Book test POSITIVE' },
    { value: 'resist_sup_neg', label: 'Resisted supination negative' },
    { value: 'resist_sup_pos', label: 'Resisted supination POSITIVE' },
  ],
  'Clinical Findings': [
    { value: 'lat_epic_tender', label: 'Lateral epicondyle tenderness' },
    { value: 'lat_epic_ecrb_tender', label: 'ECRB origin tenderness' },
    { value: 'lat_epic_grip_weak', label: 'Grip strength decreased' },
    { value: 'lat_epic_ext_pain', label: 'Pain with wrist extension' },
  ],
};

export const ELBOW_MEDIAL_EPICONDYLITIS_OPTIONS = {
  'Medial Epicondylitis Tests': [
    { value: 'rev_cozen_neg', label: "Reverse Cozen's negative" },
    { value: 'rev_cozen_pos', label: "Reverse Cozen's POSITIVE" },
    { value: 'rev_mill_neg', label: "Reverse Mill's negative" },
    { value: 'rev_mill_pos', label: "Reverse Mill's POSITIVE" },
    { value: 'valgus_stress_neg', label: 'Valgus stress test negative' },
    { value: 'valgus_stress_pos', label: 'Valgus stress test POSITIVE' },
  ],
  'Clinical Findings': [
    { value: 'med_epic_tender', label: 'Medial epicondyle tenderness' },
    { value: 'med_epic_flexor_tender', label: 'Common flexor tendon tender' },
    { value: 'med_epic_grip_weak', label: 'Grip strength decreased' },
    { value: 'med_epic_flex_pain', label: 'Pain with wrist flexion' },
    { value: 'med_epic_4th_5th_tingling', label: '4th/5th finger tingling' },
  ],
};

export const ELBOW_STABILITY_OPTIONS = {
  'Ligament Stability': [
    { value: 'valgus_0_neg', label: 'Valgus stress 0° negative' },
    { value: 'valgus_0_pos', label: 'Valgus stress 0° POSITIVE' },
    { value: 'valgus_30_neg', label: 'Valgus stress 30° negative' },
    { value: 'valgus_30_pos', label: 'Valgus stress 30° POSITIVE (UCL)' },
    { value: 'varus_0_neg', label: 'Varus stress 0° negative' },
    { value: 'varus_0_pos', label: 'Varus stress 0° POSITIVE' },
    { value: 'varus_30_neg', label: 'Varus stress 30° negative' },
    { value: 'varus_30_pos', label: 'Varus stress 30° POSITIVE (LCL)' },
  ],
  'UCL Specific': [
    { value: 'moving_valgus_neg', label: 'Moving valgus stress negative' },
    { value: 'moving_valgus_pos', label: 'Moving valgus stress POSITIVE' },
    { value: 'milking_maneuver_neg', label: 'Milking maneuver negative' },
    { value: 'milking_maneuver_pos', label: 'Milking maneuver POSITIVE' },
  ],
  'UCL Grading': [
    { value: 'ucl_grade_1', label: 'Grade I - slight stretch' },
    { value: 'ucl_grade_2', label: 'Grade II - partial tear' },
    { value: 'ucl_grade_3', label: 'Grade III - full rupture' },
  ],
};

export const ELBOW_CUBITAL_TUNNEL_OPTIONS = {
  'Cubital Tunnel Tests': [
    { value: 'elbow_flex_test_neg', label: 'Elbow flexion test negative' },
    { value: 'elbow_flex_test_pos', label: 'Elbow flexion test POSITIVE' },
    { value: 'froment_neg', label: "Froment's sign negative" },
    { value: 'froment_pos', label: "Froment's sign POSITIVE" },
    { value: 'tinel_elbow_neg', label: "Tinel's at elbow negative" },
    { value: 'tinel_elbow_pos', label: "Tinel's at elbow POSITIVE" },
    { value: 'pressure_provoc_neg', label: 'Pressure provocation negative' },
    { value: 'pressure_provoc_pos', label: 'Pressure provocation POSITIVE' },
    { value: 'wartenberg_neg', label: 'Wartenberg sign negative' },
    { value: 'wartenberg_pos', label: 'Wartenberg sign POSITIVE' },
  ],
  'Clinical Findings': [
    { value: 'cubital_4th_5th_numb', label: '4th/5th finger numbness' },
    { value: 'cubital_medial_hand_numb', label: 'Medial hand numbness' },
    { value: 'cubital_intrinsic_weak', label: 'Intrinsic hand weakness' },
    { value: 'cubital_grip_weak', label: 'Grip weakness' },
    { value: 'cubital_claw_hand', label: 'Claw/bishop hand deformity' },
    { value: 'cubital_atrophy', label: 'Intrinsic muscle atrophy' },
  ],
};

export const ELBOW_BURSITIS_OPTIONS = {
  'Olecranon Bursitis Findings': [
    { value: 'bursa_swelling', label: 'Focal olecranon swelling' },
    { value: 'bursa_goose_egg', label: 'Goose egg appearance' },
    { value: 'bursa_tender', label: 'Tender to palpation' },
    { value: 'bursa_warm_red', label: 'Warm & red (suspect infection)' },
    { value: 'bursa_fluctuant', label: 'Fluctuant swelling' },
    { value: 'bursa_rom_limited', label: 'ROM limited at end flexion' },
    { value: 'bursa_trauma_hx', label: 'History of trauma present' },
  ],
  'Differential Considerations': [
    { value: 'bursa_septic_suspect', label: 'Suspect septic bursitis' },
    { value: 'bursa_gout_suspect', label: 'Suspect gouty arthritis' },
    { value: 'bursa_ra_suspect', label: 'Suspect rheumatoid arthritis' },
    { value: 'bursa_simple', label: 'Simple traumatic bursitis' },
  ],
};

export const SHOULDER_TREATMENT_OPTIONS = {
  'Manual Therapy': [
    { value: 'sh_tx_soft_tissue', label: 'Soft tissue release' },
    { value: 'sh_tx_mfr', label: 'Myofascial release' },
    { value: 'sh_tx_trigger_pt', label: 'Trigger point therapy' },
    { value: 'sh_tx_cross_friction', label: 'Cross-friction massage' },
    { value: 'sh_tx_pin_stretch', label: 'Pin & stretch techniques' },
    { value: 'sh_tx_gh_mob', label: 'GH joint mobilization' },
    { value: 'sh_tx_ac_mob', label: 'AC joint mobilization' },
    { value: 'sh_tx_sc_mob', label: 'SC joint mobilization' },
    { value: 'sh_tx_scapula_mob', label: 'Scapular mobilization' },
    { value: 'sh_tx_cspine_manip', label: 'Cervical spine manipulation' },
    { value: 'sh_tx_tspine_manip', label: 'Thoracic spine manipulation' },
  ],
  Modalities: [
    { value: 'sh_tx_ultrasound', label: 'Ultrasound therapy' },
    { value: 'sh_tx_tens', label: 'TENS' },
    { value: 'sh_tx_ifc', label: 'Interferential current' },
    { value: 'sh_tx_laser', label: 'Low-level laser therapy' },
    { value: 'sh_tx_ice', label: 'Cryotherapy' },
    { value: 'sh_tx_heat', label: 'Heat therapy' },
  ],
  'Exercise Prescription': [
    { value: 'sh_ex_pendulum', label: 'Pendulum exercises (Codman)' },
    { value: 'sh_ex_prom', label: 'Passive ROM exercises' },
    { value: 'sh_ex_aarom', label: 'Active-assisted ROM' },
    { value: 'sh_ex_isometric', label: 'Isometric strengthening' },
    { value: 'sh_ex_rotator_cuff', label: 'Rotator cuff exercises' },
    { value: 'sh_ex_scap_stab', label: 'Scapular stabilization' },
    { value: 'sh_ex_wall_slides', label: 'Wall slides' },
    { value: 'sh_ex_doorway', label: 'Doorway stretches' },
    { value: 'sh_ex_ityw', label: 'Prone I-T-Y-W exercises' },
    { value: 'sh_ex_brugger', label: "Brügger's exercises" },
  ],
};

export const ELBOW_TREATMENT_OPTIONS = {
  'Manual Therapy': [
    { value: 'elb_tx_soft_tissue', label: 'Soft tissue release' },
    { value: 'elb_tx_trigger_pt', label: 'Trigger point therapy' },
    { value: 'elb_tx_cross_friction', label: 'Cross-friction massage' },
    { value: 'elb_tx_ice_massage', label: 'Ice massage' },
    { value: 'elb_tx_elbow_mob', label: 'Elbow joint mobilization' },
    { value: 'elb_tx_wrist_mob', label: 'Wrist mobilization' },
    { value: 'elb_tx_cspine_manip', label: 'Cervical spine manipulation' },
    { value: 'elb_tx_tspine_manip', label: 'Thoracic spine manipulation' },
  ],
  Modalities: [
    { value: 'elb_tx_ultrasound', label: 'Therapeutic ultrasound' },
    { value: 'elb_tx_iontophoresis', label: 'Iontophoresis with NSAIDs' },
    { value: 'elb_tx_laser', label: 'Low-level laser (904nm)' },
    { value: 'elb_tx_tens', label: 'TENS' },
    { value: 'elb_tx_ice', label: 'Cryotherapy' },
    { value: 'elb_tx_heat', label: 'Heat therapy' },
  ],
  'Bracing/Support': [
    { value: 'elb_counterforce', label: 'Counterforce brace/strap' },
    { value: 'elb_wrist_brace', label: 'Wrist extension brace' },
    { value: 'elb_sling', label: 'Sling (short-term)' },
  ],
  'Exercise Prescription': [
    { value: 'elb_ex_wrist_curls', label: 'Wrist curls' },
    { value: 'elb_ex_rev_curls', label: 'Reverse wrist curls' },
    { value: 'elb_ex_pronation_sup', label: 'Pronation/supination' },
    { value: 'elb_ex_finger_ext', label: 'Finger extension exercises' },
    { value: 'elb_ex_grip', label: 'Grip strengthening' },
    { value: 'elb_ex_eccentric', label: 'Eccentric exercises' },
    { value: 'elb_ex_ext_stretch', label: 'Wrist extensor stretch' },
    { value: 'elb_ex_flex_stretch', label: 'Wrist flexor stretch' },
  ],
};
