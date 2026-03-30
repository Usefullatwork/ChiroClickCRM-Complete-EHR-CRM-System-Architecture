/**
 * CranialNervePanel Component
 *
 * Complete cranial nerve examination panel (CN I-XII) with OSCE-style
 * checklist items, bilateral testing, and clinical findings documentation.
 *
 * Based on standardized neurological examination protocols.
 *
 * Orchestrator — sub-modules in ./CranialNervePanel/
 */

import { useMemo, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, MinusCircle, Info } from 'lucide-react';

import { CRANIAL_NERVES, FINDING_STATES } from './CranialNervePanel/cranialNerveData';
import NerveTestCard from './CranialNervePanel/NerveTestCard';
import QuickScreeningPanel from './CranialNervePanel/QuickScreeningPanel';

/**
 * Main CranialNervePanel component
 */
export default function CranialNervePanel({
  values = {},
  onChange,
  lang = 'no',
  _readOnly = false,
  showDescription = true,
  onGenerateNarrative,
  defaultExpanded = [],
}) {
  const [expandedNerves, setExpandedNerves] = useState(new Set(defaultExpanded));
  const [expandAll, setExpandAll] = useState(false);

  const toggleNerve = (nerveId) => {
    const newExpanded = new Set(expandedNerves);
    if (newExpanded.has(nerveId)) {
      newExpanded.delete(nerveId);
    } else {
      newExpanded.add(nerveId);
    }
    setExpandedNerves(newExpanded);
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedNerves(new Set());
    } else {
      setExpandedNerves(new Set(CRANIAL_NERVES.map((n) => n.id)));
    }
    setExpandAll(!expandAll);
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    let tested = 0;
    let normal = 0;
    let abnormal = 0;
    let equivocal = 0;

    CRANIAL_NERVES.forEach((nerve) => {
      nerve.tests.forEach((test) => {
        const leftKey = `${nerve.id}_${test.id}_left`;
        const rightKey = `${nerve.id}_${test.id}_right`;

        [leftKey, rightKey].forEach((key) => {
          if (values[key] && values[key] !== 'NT') {
            tested++;
            if (values[key] === 'normal') {
              normal++;
            } else if (values[key] === 'abnormal') {
              abnormal++;
            } else if (values[key] === 'equivocal') {
              equivocal++;
            }
          }
        });
      });
    });

    return { tested, normal, abnormal, equivocal };
  }, [values]);

  // Generate narrative text
  const generateNarrative = useMemo(() => {
    const abnormalFindings = [];

    CRANIAL_NERVES.forEach((nerve) => {
      const nerveFindings = [];

      nerve.tests.forEach((test) => {
        const leftKey = `${nerve.id}_${test.id}_left`;
        const rightKey = `${nerve.id}_${test.id}_right`;
        const leftVal = values[leftKey];
        const rightVal = values[rightKey];

        if (leftVal === 'abnormal' || rightVal === 'abnormal') {
          const testName = lang === 'no' ? test.nameNo : test.name;
          let finding = testName;

          if (nerve.bilateral) {
            if (leftVal === 'abnormal' && rightVal === 'abnormal') {
              finding += ` (${lang === 'no' ? 'bilateralt patologisk' : 'bilateral abnormal'})`;
            } else if (leftVal === 'abnormal') {
              finding += ` (${lang === 'no' ? 'venstre patologisk' : 'left abnormal'})`;
            } else {
              finding += ` (${lang === 'no' ? 'høyre patologisk' : 'right abnormal'})`;
            }
          } else {
            finding += ` (${lang === 'no' ? 'patologisk' : 'abnormal'})`;
          }

          nerveFindings.push(finding);
        }
      });

      if (nerveFindings.length > 0) {
        const nerveName = `CN ${nerve.number} (${lang === 'no' ? nerve.nameNo : nerve.name})`;
        abnormalFindings.push(`${nerveName}: ${nerveFindings.join(', ')}`);
      }
    });

    if (abnormalFindings.length === 0) {
      return lang === 'no'
        ? 'Hjernenerveundersøkelse: Alle testede hjernenerver innen normalgrenser.'
        : 'Cranial Nerve Examination: All tested cranial nerves within normal limits.';
    }

    const prefix = lang === 'no' ? 'Hjernenerveundersøkelse:' : 'Cranial Nerve Examination:';
    return `${prefix} ${abnormalFindings.join('. ')}.`;
  }, [values, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no'
              ? 'Hjernenerveundersøkelse (CN I-XII)'
              : 'Cranial Nerve Examination (CN I-XII)'}
          </h3>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.normal > 0 && (
                <span className="text-green-600 ml-2">
                  • {summary.normal} {lang === 'no' ? 'normale' : 'normal'}
                </span>
              )}
              {summary.abnormal > 0 && (
                <span className="text-red-600 ml-2">
                  • {summary.abnormal} {lang === 'no' ? 'patologiske' : 'abnormal'}
                </span>
              )}
              {summary.equivocal > 0 && (
                <span className="text-amber-600 ml-2">
                  • {summary.equivocal} {lang === 'no' ? 'usikre' : 'equivocal'}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 rounded-lg
                      hover:bg-gray-50 transition-colors"
          >
            {expandAll
              ? lang === 'no'
                ? 'Lukk alle'
                : 'Collapse All'
              : lang === 'no'
                ? 'Åpne alle'
                : 'Expand All'}
          </button>

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
      </div>

      {/* Quick Screening */}
      <QuickScreeningPanel values={values} onChange={onChange} lang={lang} />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>{lang === 'no' ? 'Normal' : 'Normal'}</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-red-500" />
          <span>{lang === 'no' ? 'Patologisk' : 'Abnormal'}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>{lang === 'no' ? 'Usikker' : 'Equivocal'}</span>
        </div>
        <div className="flex items-center gap-1">
          <MinusCircle className="w-3 h-3 text-gray-400 dark:text-gray-300" />
          <span>{lang === 'no' ? 'Ikke testet' : 'Not Tested'}</span>
        </div>
      </div>

      {/* Cranial Nerve Sections */}
      <div className="space-y-2">
        {CRANIAL_NERVES.map((nerve) => (
          <NerveTestCard
            key={nerve.id}
            nerve={nerve}
            values={values}
            onChange={onChange}
            lang={lang}
            expanded={expandedNerves.has(nerve.id)}
            onToggle={() => toggleNerve(nerve.id)}
            showDescription={showDescription}
          />
        ))}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">{lang === 'no' ? 'Klinisk tips' : 'Clinical Tips'}</p>
          <ul className="mt-1 space-y-0.5 text-blue-600">
            <li>
              •{' '}
              {lang === 'no'
                ? 'Klikk på status-knappen for å bla gjennom: IT → Normal → Patologisk → Usikker'
                : 'Click status button to cycle through: NT → Normal → Abnormal → Equivocal'}
            </li>
            <li>
              •{' '}
              {lang === 'no'
                ? 'CN II, III, IV, VI testes sammen med øyebevegelser'
                : 'CN II, III, IV, VI tested together with eye movements'}
            </li>
            <li>
              •{' '}
              {lang === 'no'
                ? 'CN IX og X testes sammen med svelgfunksjon'
                : 'CN IX and X tested together with swallowing function'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Export cranial nerve data for use in other components
export { CRANIAL_NERVES, FINDING_STATES };
