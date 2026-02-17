/**
 * Import Wizard Component
 *
 * Main import wizard with tabs for different import sources:
 * - Excel/CSV files
 * - vCard files
 * - Google Contacts
 * - Text paste
 *
 * Features:
 * - Tabbed interface for different import sources
 * - Progress tracking
 * - Import results summary
 * - Norwegian translations
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Users,
  Smartphone,
  CheckCircle2,
  _AlertCircle,
  X,
  Download,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody, _CardFooter } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { Modal } from '../ui/Modal';
import CSVColumnMapper from './CSVColumnMapper';
import VCardImport from './VCardImport';
import { api } from '../../api/client';

// Norwegian translations
const TRANSLATIONS = {
  en: {
    title: 'Import Patients',
    subtitle: 'Import patient data from various sources',
    tabs: {
      excel: 'Excel/CSV',
      vcard: 'vCard',
      google: 'Google Contacts',
      text: 'Paste Text',
    },
    steps: {
      select: 'Select Source',
      configure: 'Configure',
      review: 'Review',
      import: 'Import',
    },
    excelTab: {
      title: 'Import from Excel/CSV',
      description: 'Upload Excel (.xlsx, .xls) or CSV files',
      dropzone: 'Drop your file here or click to browse',
      supportedFormats: 'Supports Excel (.xlsx, .xls) and CSV files',
      downloadTemplate: 'Download Template',
      templateInfo: 'Download our template with all required columns and formatting',
    },
    googleTab: {
      title: 'Import from Google Contacts',
      description: 'Connect to your Google account to import contacts',
      connect: 'Connect to Google',
      connected: 'Connected',
      selectContacts: 'Select contacts to import',
      allContacts: 'All Contacts',
      selectGroup: 'Select a group',
      noGroups: 'No contact groups found',
      importSelected: 'Import Selected',
    },
    textTab: {
      title: 'Paste Patient Data',
      description: 'Copy and paste patient data from other sources',
      placeholder: 'Paste patient data here...',
      parseText: 'Parse Data',
      instructions:
        'Copy patient data from Solvit or Excel and paste below. Supports table format and single patient data.',
    },
    importResults: {
      title: 'Import Complete',
      imported: 'Imported',
      updated: 'Updated',
      skipped: 'Skipped',
      errors: 'Errors',
      viewErrors: 'View Errors',
      importMore: 'Import More',
      goToPatients: 'Go to Patients',
    },
    buttons: {
      cancel: 'Cancel',
      back: 'Back',
      next: 'Next',
      import: 'Import',
      close: 'Close',
    },
    importing: 'Importing...',
    processing: 'Processing...',
    noFile: 'No file selected',
    selectFile: 'Please select a file to import',
  },
  no: {
    title: 'Importer Pasienter',
    subtitle: 'Importer pasientdata fra forskjellige kilder',
    tabs: {
      excel: 'Excel/CSV',
      vcard: 'vCard',
      google: 'Google Kontakter',
      text: 'Lim inn Tekst',
    },
    steps: {
      select: 'Velg Kilde',
      configure: 'Konfigurer',
      review: 'Gjennomga',
      import: 'Importer',
    },
    excelTab: {
      title: 'Importer fra Excel/CSV',
      description: 'Last opp Excel (.xlsx, .xls) eller CSV-filer',
      dropzone: 'Slipp filen din her eller klikk for a bla',
      supportedFormats: 'Stotter Excel (.xlsx, .xls) og CSV-filer',
      downloadTemplate: 'Last ned Mal',
      templateInfo: 'Last ned var mal med alle nodvendige kolonner og formatering',
    },
    googleTab: {
      title: 'Importer fra Google Kontakter',
      description: 'Koble til Google-kontoen din for a importere kontakter',
      connect: 'Koble til Google',
      connected: 'Tilkoblet',
      selectContacts: 'Velg kontakter a importere',
      allContacts: 'Alle Kontakter',
      selectGroup: 'Velg en gruppe',
      noGroups: 'Ingen kontaktgrupper funnet',
      importSelected: 'Importer Valgte',
    },
    textTab: {
      title: 'Lim inn Pasientdata',
      description: 'Kopier og lim inn pasientdata fra andre kilder',
      placeholder: 'Lim inn pasientdata her...',
      parseText: 'Behandle Data',
      instructions:
        'Kopier pasientdata fra Solvit eller Excel og lim inn nedenfor. Stotter tabellformat og enkeltpasientdata.',
    },
    importResults: {
      title: 'Import Fullfort',
      imported: 'Importert',
      updated: 'Oppdatert',
      skipped: 'Hoppet over',
      errors: 'Feil',
      viewErrors: 'Se Feil',
      importMore: 'Importer Mer',
      goToPatients: 'Ga til Pasienter',
    },
    buttons: {
      cancel: 'Avbryt',
      back: 'Tilbake',
      next: 'Neste',
      import: 'Importer',
      close: 'Lukk',
    },
    importing: 'Importerer...',
    processing: 'Behandler...',
    noFile: 'Ingen fil valgt',
    selectFile: 'Vennligst velg en fil a importere',
  },
};

// Import source tabs configuration
const IMPORT_TABS = [
  { id: 'excel', icon: FileSpreadsheet, color: 'teal' },
  { id: 'vcard', icon: Smartphone, color: 'purple' },
  { id: 'google', icon: Users, color: 'blue' },
  { id: 'text', icon: FileText, color: 'orange' },
];

// =============================================================================
// IMPORT WIZARD COMPONENT
// =============================================================================

export default function ImportWizard({
  onClose,
  onImportComplete,
  language = 'no',
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('excel');
  const [step, setStep] = useState(1); // 1: select, 2: configure, 3: review, 4: results
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [mappedData, setMappedData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.no;

  // Import mutation for patients
  const importMutation = useMutation({
    mutationFn: async (patients) => {
      const response =
        (await api.patients.bulkCreate?.(patients)) ||
        Promise.all(patients.map((p) => api.patients.create(p)));
      return response;
    },
    onSuccess: (data) => {
      const results = {
        imported: Array.isArray(data) ? data.length : data?.imported || 0,
        updated: data?.updated || 0,
        skipped: data?.skipped || 0,
        errors: data?.errors || [],
      };
      setImportResults(results);
      setStep(4);
      onImportComplete?.(results);
    },
    onError: (error) => {
      setImportResults({
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [error.message],
      });
      setStep(4);
    },
  });

  // Handle file drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = useCallback((selectedFile) => {
    const isExcel = selectedFile.name.match(/\.(xlsx|xls)$/i);
    const isCsv = selectedFile.name.match(/\.csv$/i);

    if (isExcel || isCsv) {
      setFile(selectedFile);
      if (isCsv) {
        setStep(2); // Go to CSV mapper
      } else {
        // For Excel, we'd upload directly
        setStep(2);
      }
    }
  }, []);

  // Handle CSV mapping complete
  const handleMappingComplete = useCallback((result) => {
    setMappedData(result);
    setStep(3); // Go to review
  }, []);

  // Handle vCard import complete
  const handleVCardComplete = useCallback((patients) => {
    setMappedData({ data: patients, validation: { valid: patients, invalid: [], warnings: [] } });
    setStep(3);
  }, []);

  // Handle text parse
  const handleParseText = useCallback(async () => {
    // This would call the backend text parser
    try {
      const response = await api.import?.parseText?.(pastedText);
      if (response?.data) {
        setMappedData({ data: response.data, validation: response.validation });
        setStep(3);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  }, [pastedText]);

  // Handle import
  const handleImport = useCallback(() => {
    if (mappedData?.data) {
      importMutation.mutate(mappedData.data);
    }
  }, [mappedData, importMutation]);

  // Download template
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await api.import?.getTemplate?.();
      if (response) {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'patient_import_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  }, []);

  // Reset wizard
  const handleReset = useCallback(() => {
    setFile(null);
    setPastedText('');
    setMappedData(null);
    setImportResults(null);
    setStep(1);
  }, []);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'excel':
        return renderExcelTab();
      case 'vcard':
        return renderVCardTab();
      case 'google':
        return renderGoogleTab();
      case 'text':
        return renderTextTab();
      default:
        return null;
    }
  };

  // Excel/CSV tab
  const renderExcelTab = () => {
    if (step === 2 && file?.name.match(/\.csv$/i)) {
      return (
        <CSVColumnMapper
          onMappingComplete={handleMappingComplete}
          onCancel={() => {
            setFile(null);
            setStep(1);
          }}
          language={language}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Template download */}
        <Alert variant="info" title={t.excelTab.downloadTemplate}>
          <p className="mb-3">{t.excelTab.templateInfo}</p>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleDownloadTemplate}>
            {t.excelTab.downloadTemplate}
          </Button>
        </Alert>

        {/* File upload */}
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
          onClick={() => document.getElementById('excel-file-input')?.click()}
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            {file ? file.name : t.excelTab.dropzone}
          </p>
          <p className="text-sm text-slate-500">{t.excelTab.supportedFormats}</p>
          <input
            id="excel-file-input"
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* File info */}
        {file && (
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-teal-600" />
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={X} onClick={() => setFile(null)} />
                  <Button variant="primary" icon={ArrowRight} onClick={() => setStep(2)}>
                    {t.buttons.next}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    );
  };

  // vCard tab
  const renderVCardTab = () => {
    return (
      <VCardImport
        onImportComplete={handleVCardComplete}
        onCancel={() => setActiveTab('excel')}
        language={language}
      />
    );
  };

  // Google Contacts tab
  const renderGoogleTab = () => {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{t.googleTab.title}</h3>
        <p className="text-slate-500 mb-6">{t.googleTab.description}</p>
        <Button
          variant="primary"
          icon={Users}
          onClick={() => {
            // Would trigger Google OAuth flow
            window.location.href = '/api/auth/google/contacts';
          }}
        >
          {t.googleTab.connect}
        </Button>
      </div>
    );
  };

  // Text paste tab
  const renderTextTab = () => {
    return (
      <div className="space-y-4">
        <Alert variant="info">{t.textTab.instructions}</Alert>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t.textTab.title}</label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={t.textTab.placeholder}
            rows={12}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
          />
        </div>

        <Button
          variant="primary"
          onClick={handleParseText}
          disabled={!pastedText.trim()}
          className="w-full"
        >
          {t.textTab.parseText}
        </Button>
      </div>
    );
  };

  // Review step
  const renderReviewStep = () => {
    if (!mappedData) {
      return null;
    }

    const { data, validation } = mappedData;

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-teal-600">
              {validation?.valid?.length || data.length}
            </p>
            <p className="text-sm text-teal-700">Ready to Import</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{validation?.invalid?.length || 0}</p>
            <p className="text-sm text-red-700">{t.importResults.errors}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-600">{validation?.warnings?.length || 0}</p>
            <p className="text-sm text-amber-700">Warnings</p>
          </div>
        </div>

        {/* Data preview */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Data Preview</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">#</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.slice(0, 10).map((patient, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-2">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{patient.email || '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{patient.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => setStep(1)}>
            {t.buttons.back}
          </Button>
          <Button
            variant="primary"
            icon={importMutation.isPending ? Loader2 : CheckCircle2}
            onClick={handleImport}
            loading={importMutation.isPending}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? t.importing : t.buttons.import}
          </Button>
        </div>
      </div>
    );
  };

  // Results step
  const renderResultsStep = () => {
    if (!importResults) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Success header */}
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-teal-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900">{t.importResults.title}</h3>
        </div>

        {/* Result cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-teal-600">{importResults.imported}</p>
            <p className="text-sm text-teal-700">{t.importResults.imported}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{importResults.updated}</p>
            <p className="text-sm text-blue-700">{t.importResults.updated}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-600">{importResults.skipped}</p>
            <p className="text-sm text-amber-700">{t.importResults.skipped}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{importResults.errors.length}</p>
            <p className="text-sm text-red-700">{t.importResults.errors}</p>
          </div>
        </div>

        {/* Errors */}
        {importResults.errors.length > 0 && (
          <Alert variant="warning">
            <div className="flex items-center justify-between">
              <span>{importResults.errors.length} errors occurred during import</span>
              <Button variant="ghost" size="sm" onClick={() => setShowErrorsModal(true)}>
                {t.importResults.viewErrors}
              </Button>
            </div>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="secondary" onClick={handleReset}>
            {t.importResults.importMore}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose?.();
              window.location.href = '/patients';
            }}
          >
            {t.importResults.goToPatients}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-slate-500">{t.subtitle}</p>
          </div>
          {onClose && <Button variant="ghost" icon={X} onClick={onClose} />}
        </div>
      </div>

      {/* Step 1: Source selection */}
      {step === 1 && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {IMPORT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition-colors flex items-center gap-2
                  ${
                    activeTab === tab.id
                      ? `text-${tab.color}-600 border-b-2 border-${tab.color}-600`
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {t.tabs[tab.id]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <Card>
            <CardBody className="p-6">{renderTabContent()}</CardBody>
          </Card>
        </>
      )}

      {/* Step 2: Configure (CSV Mapper handles this) */}
      {step === 2 && activeTab === 'excel' && file?.name.match(/\.csv$/i) && (
        <CSVColumnMapper
          onMappingComplete={handleMappingComplete}
          onCancel={() => {
            setFile(null);
            setStep(1);
          }}
          language={language}
        />
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardBody className="p-6">{renderReviewStep()}</CardBody>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <Card>
          <CardBody className="p-6">{renderResultsStep()}</CardBody>
        </Card>
      )}

      {/* Errors Modal */}
      <Modal
        isOpen={showErrorsModal}
        onClose={() => setShowErrorsModal(false)}
        title={t.importResults.errors}
        size="md"
      >
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {importResults?.errors.map((error, idx) => (
            <div
              key={idx}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {error}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setShowErrorsModal(false)}>
            {t.buttons.close}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export { TRANSLATIONS, IMPORT_TABS };
