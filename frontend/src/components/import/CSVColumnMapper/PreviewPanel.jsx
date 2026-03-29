/**
 * PreviewPanel - Data preview table and mapped data preview modal content
 * Sub-component of CSVColumnMapper
 */

import { PATIENT_FIELDS } from './constants';

export function DataPreviewTable({ parsedData, mappings, getFieldLabel, t }) {
  if (!parsedData) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{t('preview', 'Forhandsvisning')}</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t('showing', 'Viser')} 5 {t('of', 'av')} {parsedData.rowCount} {t('rows', 'rader')}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {parsedData.headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left font-medium text-slate-700 whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>{header}</span>
                    {mappings[header] && (
                      <span className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                        {getFieldLabel(mappings[header])}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parsedData.rows.slice(0, 5).map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50">
                {parsedData.headers.map((header, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap"
                  >
                    {row[header] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MappedDataPreviewContent({ validation, mappings, getFieldLabel, t }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-teal-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-teal-600">{validation.valid.length}</p>
          <p className="text-sm text-teal-700">{t('parsedRows', 'Behandlede Rader')}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{validation.invalid.length}</p>
          <p className="text-sm text-red-700">{t('errors', 'Feil')}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-amber-600">{validation.warnings.length}</p>
          <p className="text-sm text-amber-700">{t('warnings', 'Advarsler')}</p>
        </div>
      </div>

      {/* Error list */}
      {validation.invalid.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">{t('errors', 'Feil')}</h4>
          <ul className="list-disc list-inside max-h-32 overflow-y-auto">
            {validation.invalid.slice(0, 10).map((item, idx) => (
              <li key={idx} className="text-sm text-red-700">
                {item.errors.join(', ')}
              </li>
            ))}
            {validation.invalid.length > 10 && (
              <li className="text-sm text-red-700">...and {validation.invalid.length - 10} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Data preview table */}
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Row</th>
              {PATIENT_FIELDS.filter((f) => Object.values(mappings).includes(f.field)).map((f) => (
                <th key={f.field} className="px-3 py-2 text-left font-medium text-slate-700">
                  {getFieldLabel(f.field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {validation.valid.slice(0, 20).map((patient, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                  {patient._sourceRowIndex}
                </td>
                {PATIENT_FIELDS.filter((f) => Object.values(mappings).includes(f.field)).map(
                  (f) => (
                    <td key={f.field} className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {patient[f.field] || '-'}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
