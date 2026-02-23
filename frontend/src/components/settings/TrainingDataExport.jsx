/**
 * Training Data Export Component
 * Allows admins to export anonymized AI feedback data as JSONL for model retraining.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Shield, Database, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../../services/api';

export default function TrainingDataExport() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const {
    data: statsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['training-export-stats'],
    queryFn: () => apiClient.get('/training/export/stats'),
    retry: 1,
  });

  const stats = statsResponse?.data?.data;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await apiClient.get('/training/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `training-export-${new Date().toISOString().slice(0, 10)}.jsonl`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Eksport feilet');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <Database className="w-5 h-5 text-purple-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Eksporter treningsdata
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
            Last ned anonymisert AI-feedback som JSONL for re-trening av modeller
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Stats */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Laster statistikk...
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            Kunne ikke hente statistikk
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Totalt med feedback</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {stats.sft_available}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">SFT-eksempler</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {stats.dpo_available}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">DPO-par</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.rejected}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Avvist</p>
            </div>
          </div>
        )}

        {/* Privacy disclaimer */}
        <div className="flex items-start gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-800 dark:text-purple-300">
            All data anonymiseres automatisk. Fodselsnumre, navn, telefonnumre og e-postadresser
            fjernes for eksport.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading || !stats?.total}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading ? 'Eksporterer...' : 'Last ned JSONL'}
        </button>
      </div>
    </div>
  );
}
