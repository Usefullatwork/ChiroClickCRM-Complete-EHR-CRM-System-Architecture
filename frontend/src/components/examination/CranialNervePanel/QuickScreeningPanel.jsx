/**
 * QuickScreeningPanel - Quick screening panel for common cranial nerve tests
 *
 * Provides a rapid overview of key screening tests with a "set all normal" button.
 */

export default function QuickScreeningPanel({ values, onChange, lang }) {
  const screeningTests = [
    { nerveId: 'cn2', testId: 'visual_acuity', label: 'Visual Acuity', labelNo: 'Visus' },
    { nerveId: 'cn3', testId: 'pupil_direct', label: 'Pupils', labelNo: 'Pupiller' },
    {
      nerveId: 'cn5',
      testId: 'sensation_v1',
      label: 'V1-V3 Sensation',
      labelNo: 'V1-V3 Sensibilitet',
    },
    { nerveId: 'cn7', testId: 'show_teeth', label: 'Facial Symmetry', labelNo: 'Ansiktssymmetri' },
    { nerveId: 'cn8', testId: 'whisper_test', label: 'Hearing', labelNo: 'Hørsel' },
    {
      nerveId: 'cn9',
      testId: 'gag_reflex_afferent',
      label: 'Gag Reflex',
      labelNo: 'Brekningsrefleks',
    },
    { nerveId: 'cn11', testId: 'trapezius_strength', label: 'Trapezius', labelNo: 'Trapezius' },
    { nerveId: 'cn12', testId: 'tongue_protrusion', label: 'Tongue', labelNo: 'Tunge' },
  ];

  const setAllNormal = () => {
    const updates = {};
    screeningTests.forEach(({ nerveId, testId }) => {
      updates[`${nerveId}_${testId}_left`] = 'normal';
      updates[`${nerveId}_${testId}_right`] = 'normal';
    });
    onChange({ ...values, ...updates });
  };

  return (
    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-teal-800">
          {lang === 'no' ? 'Hurtigscreening' : 'Quick Screening'}
        </span>
        <button
          type="button"
          onClick={setAllNormal}
          className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          {lang === 'no' ? 'Alle normale' : 'All Normal'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {screeningTests.map(({ nerveId, testId, label, labelNo }) => {
          const leftKey = `${nerveId}_${testId}_left`;
          const isNormal = values[leftKey] === 'normal';
          const isAbnormal = values[leftKey] === 'abnormal';

          return (
            <div
              key={`${nerveId}_${testId}`}
              className={`px-2 py-1 rounded text-xs
                         ${
                           isNormal
                             ? 'bg-green-100 text-green-700'
                             : isAbnormal
                               ? 'bg-red-100 text-red-700'
                               : 'bg-gray-100 text-gray-600 dark:text-gray-300'
                         }`}
            >
              {lang === 'no' ? labelNo : label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
