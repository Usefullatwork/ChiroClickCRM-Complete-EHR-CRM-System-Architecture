/**
 * NerveTestCard - Individual cranial nerve section with test items
 *
 * Contains FindingToggle, TestItem, and CranialNerveSection components
 * for displaying and interacting with cranial nerve examination data.
 */

import { useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { FINDING_STATES } from './cranialNerveData';

/**
 * Finding toggle button component
 */
function FindingToggle({ value, onChange, disabled = false, lang = 'no' }) {
  const states = [
    { ...FINDING_STATES.NOT_TESTED, icon: MinusCircle },
    { ...FINDING_STATES.NORMAL, icon: CheckCircle },
    { ...FINDING_STATES.ABNORMAL, icon: XCircle },
    { ...FINDING_STATES.EQUIVOCAL, icon: AlertTriangle },
  ];

  const currentIndex = states.findIndex((s) => s.value === value) || 0;
  const current = states[currentIndex] || states[0];
  const Icon = current.icon;

  const handleClick = () => {
    if (disabled) {
      return;
    }
    const nextIndex = (currentIndex + 1) % states.length;
    onChange(states[nextIndex].value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                 border transition-colors ${current.color}
                 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
    >
      <Icon className="w-3 h-3" />
      <span>{lang === 'no' ? current.labelNo : current.label}</span>
    </button>
  );
}

/**
 * Individual test item row
 */
function TestItem({ test, nerve, values, onChange, lang, showDescription = true }) {
  const leftKey = `${nerve.id}_${test.id}_left`;
  const rightKey = `${nerve.id}_${test.id}_right`;

  const leftValue = values[leftKey] || 'NT';
  const rightValue = values[rightKey] || 'NT';

  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">
          {lang === 'no' ? test.nameNo : test.name}
        </p>
        {showDescription && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {lang === 'no' ? test.descriptionNo : test.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {nerve.bilateral ? (
          <>
            <div className="text-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-300 block mb-0.5">
                {lang === 'no' ? 'V' : 'L'}
              </span>
              <FindingToggle
                value={leftValue}
                onChange={(v) => handleChange(leftKey, v)}
                lang={lang}
              />
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-300 block mb-0.5">
                {lang === 'no' ? 'H' : 'R'}
              </span>
              <FindingToggle
                value={rightValue}
                onChange={(v) => handleChange(rightKey, v)}
                lang={lang}
              />
            </div>
          </>
        ) : (
          <FindingToggle value={leftValue} onChange={(v) => handleChange(leftKey, v)} lang={lang} />
        )}
      </div>
    </div>
  );
}

/**
 * Single cranial nerve section
 */
export default function NerveTestCard({
  nerve,
  values,
  onChange,
  lang,
  expanded,
  onToggle,
  showDescription,
}) {
  const Icon = nerve.icon;

  const abnormalCount = useMemo(() => {
    let count = 0;
    nerve.tests.forEach((test) => {
      const leftKey = `${nerve.id}_${test.id}_left`;
      const rightKey = `${nerve.id}_${test.id}_right`;
      if (values[leftKey] === 'abnormal') {
        count++;
      }
      if (nerve.bilateral && values[rightKey] === 'abnormal') {
        count++;
      }
    });
    return count;
  }, [values, nerve]);

  const testedCount = useMemo(() => {
    let count = 0;
    nerve.tests.forEach((test) => {
      const leftKey = `${nerve.id}_${test.id}_left`;
      const rightKey = `${nerve.id}_${test.id}_right`;
      if (values[leftKey] && values[leftKey] !== 'NT') {
        count++;
      }
      if (nerve.bilateral && values[rightKey] && values[rightKey] !== 'NT') {
        count++;
      }
    });
    return count;
  }, [values, nerve]);

  return (
    <div
      className={`border rounded-lg overflow-hidden
                    ${abnormalCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50
                   hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${abnormalCount > 0 ? 'bg-red-100' : 'bg-teal-100'}`}
          >
            <Icon className={`w-4 h-4 ${abnormalCount > 0 ? 'text-red-600' : 'text-teal-600'}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">CN {nerve.number}</span>
              <span className="font-medium text-gray-700">
                {lang === 'no' ? nerve.nameNo : nerve.name}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'no' ? nerve.functionNo : nerve.function}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {testedCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {testedCount} {lang === 'no' ? 'testet' : 'tested'}
            </span>
          )}
          {abnormalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              {abnormalCount} {lang === 'no' ? 'patologisk' : 'abnormal'}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="space-y-1">
            {nerve.tests.map((test) => (
              <TestItem
                key={test.id}
                test={test}
                nerve={nerve}
                values={values}
                onChange={onChange}
                lang={lang}
                showDescription={showDescription}
              />
            ))}
          </div>

          {nerve.redFlags && nerve.redFlags.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 text-red-700 text-xs font-medium mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{lang === 'no' ? 'Røde flagg' : 'Red Flags'}</span>
              </div>
              <ul className="text-xs text-red-600 space-y-0.5">
                {(lang === 'no' ? nerve.redFlagsNo : nerve.redFlags).map((flag, idx) => (
                  <li key={idx}>• {flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3">
            <textarea
              value={values[`${nerve.id}_notes`] || ''}
              onChange={(e) => onChange({ ...values, [`${nerve.id}_notes`]: e.target.value })}
              placeholder={lang === 'no' ? 'Kliniske notater...' : 'Clinical notes...'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                        focus:ring-1 focus:ring-teal-500 focus:border-teal-500
                        resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
