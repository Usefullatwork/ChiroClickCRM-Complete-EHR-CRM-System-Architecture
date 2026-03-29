/**
 * ImportProgress - File upload area and file info bar
 * Sub-component of CSVColumnMapper
 */

import { useRef } from 'react';
import { Upload, FileSpreadsheet, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card, CardBody } from '../../ui/Card';

export function FileUploadArea({ dragActive, handleDrag, handleDrop, handleFileChange, t }) {
  const fileInputRef = useRef(null);

  return (
    <Card>
      <CardBody>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
            ${
              dragActive
                ? 'border-teal-500 bg-teal-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            {t('dropHere', 'Slipp CSV-fil her eller klikk for \u00e5 bla')}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t(
              'supportedCsvFormats',
              'St\u00f8tter .csv-filer med komma, semikolon eller tab-separatorer'
            )}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />
          <Button variant="secondary" icon={FileSpreadsheet}>
            {t('uploadFile', 'Last opp CSV-fil')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function FileInfoBar({ file, parsedData, onAutoDetect, onClearMappings, onReset, t }) {
  return (
    <Card>
      <CardBody className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-teal-600" />
            <div>
              <p className="font-medium text-slate-900">{file?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {parsedData.rowCount} {t('rows', 'rader')} | {parsedData.headers.length}{' '}
                {t('csvColumn', 'CSV-kolonne').toLowerCase()}s
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={onAutoDetect}>
              {t('autoDetect', 'Auto-Oppdag')}
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={onClearMappings}>
              {t('clearMappings', 'Fjern Alle')}
            </Button>
            <Button variant="ghost" size="sm" icon={X} onClick={onReset}>
              {t('cancel', 'Avbryt')}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
