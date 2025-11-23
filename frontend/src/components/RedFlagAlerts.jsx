import { useQuery } from '@tanstack/react-query';
import { examinationsAPI } from '../services/api';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function RedFlagAlerts({ encounterId }) {
  const [dismissed, setDismissed] = useState(false);

  // Fetch red flags for this encounter
  const { data: redFlags, isLoading } = useQuery({
    queryKey: ['examination-red-flags', encounterId],
    queryFn: () => examinationsAPI.getRedFlags(encounterId),
    enabled: !!encounterId,
    refetchInterval: 10000, // Refetch every 10 seconds while component is mounted
  });

  if (isLoading || dismissed) return null;

  if (!redFlags?.data || redFlags.data.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md overflow-hidden animate-pulse-slow">
      {/* Header */}
      <div className="px-4 py-3 bg-red-100 border-b border-red-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-sm font-bold text-red-900">
            ⚠️ RØDE FLAGG OPPDAGET ({redFlags.data.length})
          </h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-red-200 rounded transition-colors"
          title="Lukk varsel (varselet vil vises igjen ved neste oppdatering)"
        >
          <X className="w-4 h-4 text-red-700" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm font-medium text-red-900">
          Følgende undersøkelser indikerer alvorlig patologi som krever umiddelbar oppmerksomhet:
        </p>

        <div className="space-y-3">
          {redFlags.data.map((redFlag, index) => (
            <div
              key={index}
              className="bg-white border border-red-200 rounded-lg p-3 shadow-sm"
            >
              {/* Test Name */}
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900">
                    {redFlag.test_name}
                  </h4>
                  {redFlag.severity && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                      {redFlag.severity === 'severe' ? 'Alvorlig' :
                       redFlag.severity === 'moderate' ? 'Moderat' : 'Mild'}
                    </span>
                  )}
                </div>
              </div>

              {/* Finding */}
              {redFlag.finding && (
                <div className="mb-2 pl-6">
                  <p className="text-xs font-medium text-gray-700 mb-1">Funn:</p>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">
                    {redFlag.finding}
                  </p>
                </div>
              )}

              {/* Red Flag Criteria */}
              {redFlag.red_flag_criteria && (
                <div className="pl-6">
                  <p className="text-xs font-medium text-gray-700 mb-1">Betydning:</p>
                  <p className="text-sm text-red-800 bg-red-50 rounded p-2 border border-red-200">
                    {redFlag.red_flag_criteria}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Recommendations */}
        <div className="bg-red-600 text-white rounded-lg p-3 mt-4">
          <p className="text-sm font-bold mb-2">📋 Anbefalte tiltak:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Vurder umiddelbar henvisning til spesialist</li>
            <li>Dokumenter funn grundig i journalen</li>
            <li>Informer pasienten om funnene</li>
            <li>Følg opp med bildediagnostikk om nødvendig</li>
            <li>Vurder akutt innleggelse hvis indisert</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
