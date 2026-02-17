/**
 * Import Page
 * Excel upload, text parsing, and data import
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import apiClient from '../services/api';
import { useTranslation } from '../i18n';
import toast from '../utils/toast';

export default function Import() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState('excel'); // 'excel' | 'text'
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [importResults, setImportResults] = useState(null);

  // Excel upload mutation
  const uploadExcelMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await apiClient.post('/import/patients/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setImportResults(data);
      setFile(null);
    },
  });

  // Text parsing mutation
  const parseTextMutation = useMutation({
    mutationFn: async (text) => {
      const response = await apiClient.post('/import/patients/parse-text', { text });
      return response.data;
    },
    onSuccess: (data) => {
      setParsedData(data.data);
    },
  });

  // Import parsed patients mutation
  const importPatientsMutation = useMutation({
    mutationFn: async (patients) => {
      const response = await apiClient.post('/import/patients/text', { patients });
      return response.data;
    },
    onSuccess: (data) => {
      setImportResults(data);
      setPastedText('');
      setParsedData(null);
    },
  });

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error(t('invalidFileType'));
      return;
    }

    setFile(selectedFile);
    setImportResults(null);
  };

  const handleUploadExcel = () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('skipDuplicates', 'true');
    formData.append('updateExisting', 'false');
    formData.append('dryRun', 'false');

    uploadExcelMutation.mutate(formData);
  };

  const handleParseText = () => {
    if (!pastedText.trim()) {
      return;
    }
    parseTextMutation.mutate(pastedText);
  };

  const handleImportParsed = () => {
    if (!parsedData) {
      return;
    }

    const patients = parsedData.type === 'table' ? parsedData.patients : [parsedData.patient];

    importPatientsMutation.mutate(patients);
  };

  const downloadTemplate = async () => {
    try {
      const response = await apiClient.get('/import/patients/template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'patient_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(t('failedDownloadTemplate'));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('importPatients')}</h1>
        <p className="text-gray-600">{t('importSubtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('excel')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'excel'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {t('excelUpload')}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'text'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('pasteText')}
          </div>
        </button>
      </div>

      {/* Excel Upload Tab */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">{t('needTemplate')}</h3>
                <p className="text-sm text-blue-800 mb-3">{t('downloadTemplateDesc')}</p>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {t('downloadTemplate')}
                </button>
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {file ? file.name : t('dropFileHere')}
            </p>
            <p className="text-sm text-gray-500 mb-4">{t('supportsFormats')}</p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {t('browseFiles')}
            </label>
          </div>

          {/* File Info */}
          {file && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleUploadExcel}
                  disabled={uploadExcelMutation.isPending}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadExcelMutation.isPending ? t('uploading') : t('uploadAndImport')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Paste Tab */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">{t('howToUse')}</h3>
                <p className="text-sm text-blue-800">{t('howToUseDesc')}</p>
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('pastePatientData')}
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={t('pasteHere')}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Parse Button */}
          <button
            onClick={handleParseText}
            disabled={!pastedText.trim() || parseTextMutation.isPending}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {parseTextMutation.isPending ? t('parsing') : t('parseData')}
          </button>

          {/* Preview Parsed Data */}
          {parsedData && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('preview')}</h3>

              {parsedData.type === 'table' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('foundPatients').replace('{count}', parsedData.patients.length)}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">ID</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Phone</th>
                          <th className="px-3 py-2 text-left">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedData.patients.slice(0, 5).map((patient, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{patient.solvit_id}</td>
                            <td className="px-3 py-2">
                              {patient.first_name} {patient.last_name}
                            </td>
                            <td className="px-3 py-2">{patient.phone}</td>
                            <td className="px-3 py-2">{patient.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.patients.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {t('andMore').replace('{count}', parsedData.patients.length - 5)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Name:</strong> {parsedData.patient.first_name}{' '}
                    {parsedData.patient.last_name}
                  </p>
                  {parsedData.patient.phone && (
                    <p>
                      <strong>Phone:</strong> {parsedData.patient.phone}
                    </p>
                  )}
                  {parsedData.patient.email && (
                    <p>
                      <strong>Email:</strong> {parsedData.patient.email}
                    </p>
                  )}
                  {parsedData.patient.address_street && (
                    <p>
                      <strong>Address:</strong> {parsedData.patient.address_street}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleImportParsed}
                disabled={importPatientsMutation.isPending}
                className="mt-4 w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {importPatientsMutation.isPending ? t('importing') : t('importToDatabase')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">{t('importComplete')}</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {importResults.data?.imported || 0}
              </p>
              <p className="text-sm text-gray-600">{t('imported')}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{importResults.data?.updated || 0}</p>
              <p className="text-sm text-gray-600">{t('updated')}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {importResults.data?.skipped || 0}
              </p>
              <p className="text-sm text-gray-600">{t('skipped')}</p>
            </div>
          </div>

          {importResults.data?.errors && importResults.data.errors.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">{t('errors')}</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {importResults.data.errors.map((error, idx) => (
                  <p key={idx} className="text-sm text-red-600">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setImportResults(null);
              setParsedData(null);
              setFile(null);
            }}
            className="mt-4 w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('importMore')}
          </button>
        </div>
      )}
    </div>
  );
}
