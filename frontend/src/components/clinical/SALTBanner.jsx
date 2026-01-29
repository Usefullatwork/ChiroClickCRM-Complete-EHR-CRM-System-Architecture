/**
 * SALTBanner - Same As Last Time prompt
 * Shows when a similar previous encounter is found
 */

import React from 'react';
import { ClipboardCopy, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function SALTBanner({
  previousEncounter,
  onApplyAll,
  onApplySection,
  onDismiss,
  isExpanded,
  onToggleExpand
}) {
  if (!previousEncounter) return null;

  const encounterDate = new Date(previousEncounter.encounter_date);
  const daysSince = Math.floor(
    (new Date() - encounterDate) / (1000 * 60 * 60 * 24)
  );

  const formatDate = (date) => {
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl mb-4 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <ClipboardCopy className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-900">
              Lignende konsultasjon funnet
            </p>
            <p className="text-sm text-blue-700">
              {formatDate(encounterDate)} ({daysSince} {daysSince === 1 ? 'dag' : 'dager'} siden)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onApplyAll}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Bruk alt
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title={isExpanded ? 'Skjul detaljer' : 'Vis detaljer'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expandable sections */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-200 pt-3">
          <p className="text-xs text-blue-600 mb-3 font-medium">
            Velg hvilke seksjoner du vil kopiere:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['subjective', 'objective', 'assessment', 'plan'].map((section) => {
              const labels = {
                subjective: 'Subjektivt',
                objective: 'Objektivt',
                assessment: 'Vurdering',
                plan: 'Plan'
              };
              const colors = {
                subjective: 'blue',
                objective: 'emerald',
                assessment: 'amber',
                plan: 'purple'
              };
              const hasContent = previousEncounter[section] &&
                Object.values(previousEncounter[section]).some(v => v && v.length > 0);

              if (!hasContent) return null;

              return (
                <button
                  key={section}
                  onClick={() => onApplySection(section)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors
                    bg-${colors[section]}-50 border-${colors[section]}-200
                    text-${colors[section]}-700 hover:bg-${colors[section]}-100`}
                >
                  {labels[section]}
                </button>
              );
            })}
          </div>

          {/* Preview */}
          {previousEncounter.subjective?.chief_complaint && (
            <div className="mt-3 p-2 bg-white rounded-lg border border-blue-100">
              <p className="text-xs text-gray-500 mb-1">Hovedklage fra forrige:</p>
              <p className="text-sm text-gray-700">
                {previousEncounter.subjective.chief_complaint}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
