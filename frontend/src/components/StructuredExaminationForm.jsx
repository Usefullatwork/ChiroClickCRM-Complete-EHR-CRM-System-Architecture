import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { examinationsAPI } from '../services/api';
import { X, Save, AlertTriangle, Info } from 'lucide-react';

export default function StructuredExaminationForm({
  protocol,
  encounterId,
  isOpen,
  onClose,
  existingFinding = null,
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    result: existingFinding?.result || 'not_tested',
    laterality: existingFinding?.laterality || 'none',
    severity: existingFinding?.severity || '',
    findings_text: existingFinding?.findings_text || '',
    clinician_notes: existingFinding?.clinician_notes || '',
    measurement_value: existingFinding?.measurement_value || '',
    measurement_unit: existingFinding?.measurement_unit || '',
    pain_score: existingFinding?.pain_score || '',
    pain_location: existingFinding?.pain_location || '',
  });

  // Create or update finding mutation
  const saveFindingMutation = useMutation({
    mutationFn: (data) => {
      if (existingFinding) {
        return examinationsAPI.updateFinding(existingFinding.id, data);
      } else {
        return examinationsAPI.createFinding({
          ...data,
          encounter_id: encounterId,
          protocol_id: protocol.id,
          body_region: protocol.body_region,
          category: protocol.category,
          test_name: protocol.test_name_no || protocol.test_name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['examination-findings', encounterId]);
      queryClient.invalidateQueries(['examination-summary', encounterId]);
      queryClient.invalidateQueries(['examination-red-flags', encounterId]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveFindingMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen || !protocol) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">
                  {protocol.test_name_no || protocol.test_name}
                </h3>
                {protocol.is_red_flag && (
                  <AlertTriangle className="w-5 h-5 text-yellow-300" title="Red Flag Test" />
                )}
              </div>
              <p className="text-sm text-blue-100">
                {protocol.body_region} • {protocol.category}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-700 rounded transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Test Information */}
            {protocol.description_no && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Beskrivelse</p>
                    <p className="text-sm text-blue-800">{protocol.description_no}</p>
                  </div>
                </div>
              </div>
            )}

            {protocol.positive_indication_no && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Positiv indikasjon</p>
                    <p className="text-sm text-amber-800">{protocol.positive_indication_no}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resultat *</label>
              <select
                value={formData.result}
                onChange={(e) => handleChange('result', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="not_tested">Ikke testet</option>
                <option value="negative">Negativ</option>
                <option value="positive">Positiv</option>
                <option value="equivocal">Uklar</option>
                <option value="unable_to_perform">Ikke gjennomførbar</option>
              </select>
            </div>

            {/* Laterality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lateralitet</label>
              <select
                value={formData.laterality}
                onChange={(e) => handleChange('laterality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Ingen</option>
                <option value="left">Venstre</option>
                <option value="right">Høyre</option>
                <option value="bilateral">Bilateral</option>
              </select>
            </div>

            {/* Severity (if positive) */}
            {formData.result === 'positive' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alvorlighetsgrad
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => handleChange('severity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ikke angitt</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderat</option>
                  <option value="severe">Alvorlig</option>
                </select>
              </div>
            )}

            {/* Measurements */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Måling (verdi)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.measurement_value}
                  onChange={(e) => handleChange('measurement_value', e.target.value)}
                  placeholder="f.eks. 45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enhet</label>
                <input
                  type="text"
                  value={formData.measurement_unit}
                  onChange={(e) => handleChange('measurement_unit', e.target.value)}
                  placeholder="f.eks. grader, mm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Pain Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smerteskår (NRS 0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.pain_score}
                onChange={(e) => handleChange('pain_score', e.target.value)}
                placeholder="0-10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pain Location (if pain score provided) */}
            {formData.pain_score && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Smertelokalisering
                </label>
                <input
                  type="text"
                  value={formData.pain_location}
                  onChange={(e) => handleChange('pain_location', e.target.value)}
                  placeholder="Beskriv hvor smerten oppstod"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Findings Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funn (detaljer)
              </label>
              <textarea
                value={formData.findings_text}
                onChange={(e) => handleChange('findings_text', e.target.value)}
                rows="3"
                placeholder="Beskriv funnene..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clinician Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Klinikernotater
              </label>
              <textarea
                value={formData.clinician_notes}
                onChange={(e) => handleChange('clinician_notes', e.target.value)}
                rows="3"
                placeholder="Ekstra notater..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saveFindingMutation.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saveFindingMutation.isLoading ? 'Lagrer...' : existingFinding ? 'Oppdater' : 'Lagre'}
          </button>
        </div>
      </div>
    </div>
  );
}
