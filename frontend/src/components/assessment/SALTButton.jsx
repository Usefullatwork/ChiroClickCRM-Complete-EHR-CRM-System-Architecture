import { useState } from 'react';
import { Copy, Clock, ChevronDown, Check, AlertCircle } from 'lucide-react';

/**
 * SALT - Same As Last Treatment
 *
 * ChiroTouch's critical efficiency feature that clones the previous visit's
 * findings, allowing the doctor to only edit what has changed.
 *
 * Features:
 * - Clone previous visit's subjective complaints
 * - Clone objective findings and spinal listings
 * - Clone treatment performed
 * - Strip date-specific data
 * - Show "50% improvement" style quick modifiers
 */

// Quick improvement modifiers
const IMPROVEMENT_MODIFIERS = [
  { label: 'No change', value: 'Patient reports no change since last visit.' },
  { label: '25% better', value: 'Patient reports approximately 25% improvement since last visit.' },
  { label: '50% better', value: 'Patient reports approximately 50% improvement since last visit.' },
  { label: '75% better', value: 'Patient reports approximately 75% improvement since last visit.' },
  { label: 'Much better', value: 'Patient reports significant improvement since last visit.' },
  { label: 'Slightly worse', value: 'Patient reports slight worsening of symptoms since last visit.' },
  { label: 'Much worse', value: 'Patient reports significant worsening of symptoms since last visit.' },
  { label: 'New complaint', value: 'Patient presents with a new complaint in addition to ongoing issues.' },
];

// Sections that can be cloned
const CLONE_SECTIONS = [
  { id: 'subjective', label: 'Subjective', icon: '💬' },
  { id: 'objective', label: 'Objective', icon: '🔍' },
  { id: 'spinal_findings', label: 'Spinal Findings', icon: '🦴' },
  { id: 'treatments', label: 'Treatments', icon: '🩺' },
  { id: 'exercises', label: 'Exercises', icon: '🏃' },
  { id: 'diagnoses', label: 'Diagnoses', icon: '📋' },
];

export default function SALTButton({
  previousEncounter,
  onApply,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState(
    CLONE_SECTIONS.map(s => s.id)
  );
  const [selectedModifier, setSelectedModifier] = useState(null);
  const [applied, setApplied] = useState(false);

  const toggleSection = (sectionId) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleApply = () => {
    if (!previousEncounter) return;

    // Build cloned data based on selected sections
    const clonedData = {};

    if (selectedSections.includes('subjective')) {
      clonedData.subjective = {
        ...previousEncounter.subjective,
        // Prepend improvement modifier if selected
        chief_complaint: selectedModifier
          ? `${selectedModifier}\n\n${previousEncounter.subjective?.chief_complaint || ''}`
          : previousEncounter.subjective?.chief_complaint || ''
      };
      clonedData.pain_locations = previousEncounter.pain_locations || [];
      clonedData.pain_qualities = previousEncounter.pain_qualities || [];
      clonedData.aggravating_factors_selected = previousEncounter.aggravating_factors_selected || [];
      clonedData.relieving_factors_selected = previousEncounter.relieving_factors_selected || [];
    }

    if (selectedSections.includes('objective')) {
      clonedData.objective = previousEncounter.objective || {};
      clonedData.observation_findings = previousEncounter.observation_findings || [];
      clonedData.palpation_findings = previousEncounter.palpation_findings || [];
      clonedData.rom_findings = previousEncounter.rom_findings || [];
      clonedData.ortho_tests_selected = previousEncounter.ortho_tests_selected || [];
      clonedData.neuro_tests_selected = previousEncounter.neuro_tests_selected || [];
    }

    if (selectedSections.includes('spinal_findings')) {
      clonedData.spinal_findings = previousEncounter.spinal_findings || {};
    }

    if (selectedSections.includes('treatments')) {
      clonedData.treatments_selected = previousEncounter.treatments_selected || [];
      clonedData.plan = {
        ...clonedData.plan,
        treatment: previousEncounter.plan?.treatment || ''
      };
    }

    if (selectedSections.includes('exercises')) {
      clonedData.exercises_selected = previousEncounter.exercises_selected || [];
      clonedData.plan = {
        ...clonedData.plan,
        exercises: previousEncounter.plan?.exercises || ''
      };
    }

    if (selectedSections.includes('diagnoses')) {
      clonedData.icpc_codes = previousEncounter.icpc_codes || [];
      clonedData.icd10_codes = previousEncounter.icd10_codes || [];
    }

    onApply(clonedData);
    setApplied(true);
    setIsOpen(false);

    // Reset applied state after animation
    setTimeout(() => setApplied(false), 2000);
  };

  const previousDate = previousEncounter?.encounter_date
    ? new Date(previousEncounter.encounter_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || !previousEncounter}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${applied
            ? 'bg-green-600 text-white'
            : disabled || !previousEncounter
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow'
          }
        `}
        title={previousEncounter ? `Clone from ${previousDate}` : 'No previous encounter'}
      >
        {applied ? (
          <>
            <Check className="w-4 h-4" />
            Applied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            SALT
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && previousEncounter && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl">
            <h3 className="font-semibold text-white">Same As Last Treatment</h3>
            <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              Cloning from {previousDate}
            </p>
          </div>

          {/* Improvement Modifier */}
          <div className="px-4 py-3 border-b border-gray-100">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Patient Status Update
            </label>
            <div className="grid grid-cols-2 gap-1">
              {IMPROVEMENT_MODIFIERS.map((mod) => (
                <button
                  key={mod.label}
                  onClick={() => setSelectedModifier(
                    selectedModifier === mod.value ? null : mod.value
                  )}
                  className={`
                    px-2 py-1.5 text-xs rounded-lg transition-colors text-left
                    ${selectedModifier === mod.value
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                >
                  {mod.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section Selection */}
          <div className="px-4 py-3 border-b border-gray-100">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Sections to Clone
            </label>
            <div className="space-y-1">
              {CLONE_SECTIONS.map((section) => {
                const hasData = checkSectionHasData(previousEncounter, section.id);
                return (
                  <label
                    key={section.id}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                      ${selectedSections.includes(section.id)
                        ? 'bg-amber-50'
                        : 'hover:bg-gray-50'
                      }
                      ${!hasData ? 'opacity-50' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      disabled={!hasData}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm">{section.icon}</span>
                    <span className="text-sm text-gray-700">{section.label}</span>
                    {!hasData && (
                      <span className="ml-auto text-xs text-gray-400">(empty)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preview of what will be cloned */}
          <div className="px-4 py-3 bg-gray-50 rounded-b-xl">
            <div className="flex items-start gap-2 text-xs text-gray-500 mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>This will populate fields with data from the previous visit. You can edit after applying.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={selectedSections.length === 0}
                className="flex-1 px-3 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply SALT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to check if a section has data
function checkSectionHasData(encounter, sectionId) {
  if (!encounter) return false;

  switch (sectionId) {
    case 'subjective':
      return !!(
        encounter.subjective?.chief_complaint ||
        encounter.subjective?.history ||
        encounter.pain_locations?.length
      );
    case 'objective':
      return !!(
        encounter.objective?.observation ||
        encounter.observation_findings?.length ||
        encounter.palpation_findings?.length
      );
    case 'spinal_findings':
      return !!(
        encounter.spinal_findings &&
        Object.keys(encounter.spinal_findings).length > 0
      );
    case 'treatments':
      return !!(
        encounter.treatments_selected?.length ||
        encounter.plan?.treatment
      );
    case 'exercises':
      return !!(
        encounter.exercises_selected?.length ||
        encounter.plan?.exercises
      );
    case 'diagnoses':
      return !!(
        encounter.icpc_codes?.length ||
        encounter.icd10_codes?.length
      );
    default:
      return false;
  }
}

// Compact version for toolbar
export function SALTButtonCompact({ previousEncounter, onApply }) {
  const [applied, setApplied] = useState(false);

  const handleQuickApply = () => {
    if (!previousEncounter) return;

    // Quick apply - clone everything
    const clonedData = {
      subjective: previousEncounter.subjective || {},
      objective: previousEncounter.objective || {},
      spinal_findings: previousEncounter.spinal_findings || {},
      pain_locations: previousEncounter.pain_locations || [],
      pain_qualities: previousEncounter.pain_qualities || [],
      aggravating_factors_selected: previousEncounter.aggravating_factors_selected || [],
      relieving_factors_selected: previousEncounter.relieving_factors_selected || [],
      observation_findings: previousEncounter.observation_findings || [],
      palpation_findings: previousEncounter.palpation_findings || [],
      rom_findings: previousEncounter.rom_findings || [],
      ortho_tests_selected: previousEncounter.ortho_tests_selected || [],
      neuro_tests_selected: previousEncounter.neuro_tests_selected || [],
      treatments_selected: previousEncounter.treatments_selected || [],
      exercises_selected: previousEncounter.exercises_selected || [],
      icpc_codes: previousEncounter.icpc_codes || [],
      icd10_codes: previousEncounter.icd10_codes || []
    };

    onApply(clonedData);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <button
      onClick={handleQuickApply}
      disabled={!previousEncounter}
      className={`
        p-2 rounded-lg transition-colors
        ${applied
          ? 'bg-green-100 text-green-600'
          : previousEncounter
            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }
      `}
      title="Same As Last Treatment"
    >
      {applied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
    </button>
  );
}
