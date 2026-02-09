/**
 * GDPR Patient Data Export Modal
 * Export patient data in compliance with GDPR Articles 15 & 20
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { gdprAPI } from '../services/api';
import { X, Download, Shield, FileText, Database, Loader2 } from 'lucide-react';
import toast from '../utils/toast';
import logger from '../utils/logger';

export default function GDPRExportModal({ patient, onClose }) {
  const [exportType, setExportType] = useState('data-access'); // 'data-access' or 'data-portability'
  const [exportedData, setExportedData] = useState(null);

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (type) => {
      if (type === 'data-access') {
        return gdprAPI.exportPatientData(patient.id);
      } else {
        return gdprAPI.exportDataPortability(patient.id);
      }
    },
    onSuccess: (response) => {
      setExportedData(response.data);
    },
    onError: (error) => {
      logger.error('Failed to export patient data:', error);
      toast.error(error.response?.data?.error || 'Failed to export patient data');
    },
  });

  const handleExport = () => {
    exportMutation.mutate(exportType);
  };

  const handleDownload = () => {
    if (!exportedData) return;

    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `patient_data_${patient.id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">GDPR Data Export</h2>
              <p className="text-sm text-gray-600">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!exportedData ? (
            <div className="space-y-6">
              {/* Export Type Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">GDPR Compliance</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Export patient data in accordance with GDPR regulations. Choose the
                      appropriate export type based on the patient's request.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Select Export Type</h4>

                {/* Article 15 - Right to Access */}
                <label
                  className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    exportType === 'data-access'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="exportType"
                      value="data-access"
                      checked={exportType === 'data-access'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h5 className="font-semibold text-gray-900">
                          Data Access Request (Article 15)
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Export all patient data including medical records, appointments,
                        communications, and consent history. Includes metadata and processing
                        information.
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Includes:</strong> Patient profile, clinical encounters,
                        appointments, communications, consent records, audit trail
                      </div>
                    </div>
                  </div>
                </label>

                {/* Article 20 - Data Portability */}
                <label
                  className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    exportType === 'data-portability'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="exportType"
                      value="data-portability"
                      checked={exportType === 'data-portability'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h5 className="font-semibold text-gray-900">
                          Data Portability (Article 20)
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Export patient data in a structured, machine-readable format for transfer to
                        another healthcare provider or service.
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Includes:</strong> Patient profile, clinical records, treatment
                        history (optimized for data transfer)
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Patient Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {patient.first_name} {patient.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">ID:</span>
                    <span className="ml-2 font-medium">{patient.solvit_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="ml-2 font-medium">
                      {new Date(patient.date_of_birth).toLocaleDateString('no-NO')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-medium">{patient.gender}</span>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {exportMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Export Patient Data
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Export Complete</h3>
                    <p className="text-sm text-gray-700">
                      Patient data has been successfully exported. Click the download button below
                      to save the JSON file.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <h4 className="font-semibold text-gray-900">Data Preview</h4>
                </div>
                <div className="p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="text-xs font-mono text-gray-700">
                    {JSON.stringify(exportedData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-5 h-5" />
                  Download JSON File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-600">
            Export processed in compliance with GDPR Articles 15 & 20
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
