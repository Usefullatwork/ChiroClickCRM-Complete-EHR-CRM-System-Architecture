/**
 * ColumnMappingTable - CSV column to patient field mapping interface
 * Sub-component of CSVColumnMapper
 */

import { ArrowRight, Check, X, AlertTriangle, GripVertical } from 'lucide-react';

export default function ColumnMappingTable({
  parsedData,
  mappings,
  groupedFields,
  draggedColumn,
  handleColumnDragStart,
  setDraggedColumn,
  handleMappingChange,
  handleFieldDrop,
  getFieldLabel,
  getGroupLabel,
  t,
}) {
  if (!parsedData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CSV Columns */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{t('csvColumn', 'CSV-kolonne')}s</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('dragDrop', 'Dra og slipp for a omorganisere')}
          </p>
        </div>
        <div className="p-4 space-y-2">
          {parsedData.headers.map((header) => (
            <div
              key={header}
              draggable
              onDragStart={() => handleColumnDragStart(header)}
              onDragEnd={() => setDraggedColumn(null)}
              className={`p-3 border rounded-lg cursor-move transition-colors
                ${
                  mappings[header]
                    ? 'bg-teal-50 border-teal-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }
                ${draggedColumn === header ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                  <span className="font-medium text-slate-700">{header}</span>
                </div>
                <div className="flex items-center gap-2">
                  {mappings[header] ? (
                    <>
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                      <span className="text-sm text-teal-700 font-medium">
                        {getFieldLabel(mappings[header])}
                      </span>
                      <button
                        onClick={() => handleMappingChange(header, null)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <X className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                      </button>
                    </>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="text-sm border-slate-200 rounded focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">{t('selectField', 'Velg felt...')}</option>
                      {Object.entries(groupedFields).map(([group, fields]) => (
                        <optgroup key={group} label={getGroupLabel(group)}>
                          {fields.map((field) => (
                            <option
                              key={field.field}
                              value={field.field}
                              disabled={Object.values(mappings).includes(field.field)}
                            >
                              {getFieldLabel(field.field)}
                              {field.required ? ' *' : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('sampleData', 'Eksempeldata')}: {parsedData.rows[0]?.[header] || '-'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Fields */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{t('patientField', 'Pasientfelt')}s</h3>
        </div>
        <div className="p-4 space-y-4">
          {Object.entries(groupedFields).map(([group, fields]) => (
            <div key={group}>
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                {getGroupLabel(group)}
              </h4>
              <div className="space-y-1">
                {fields.map((field) => {
                  const isMapped = Object.values(mappings).includes(field.field);
                  const mappedFromColumn = Object.keys(mappings).find(
                    (k) => mappings[k] === field.field
                  );

                  return (
                    <div
                      key={field.field}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleFieldDrop(field.field)}
                      className={`p-2 rounded-lg border transition-colors
                        ${
                          isMapped
                            ? 'bg-teal-50 border-teal-200'
                            : field.required
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-slate-200'
                        }
                        ${draggedColumn && !isMapped ? 'border-dashed border-teal-400' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isMapped ? (
                            <Check className="w-4 h-4 text-teal-600" />
                          ) : field.required ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className={`text-sm ${field.required ? 'font-medium' : ''}`}>
                            {getFieldLabel(field.field)}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        </div>
                        {isMapped && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {mappedFromColumn}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
