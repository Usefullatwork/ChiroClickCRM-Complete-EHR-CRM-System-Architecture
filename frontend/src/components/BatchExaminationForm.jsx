import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examinationsAPI } from '../services/api';
import { X, Save, CheckCircle, AlertTriangle, Zap, ListChecks } from 'lucide-react';

export default function BatchExaminationForm({
  encounterId,
  chiefComplaint,
  isOpen,
  onClose
}) {
  const queryClient = useQueryClient();
  const [selectedTemplateSet, setSelectedTemplateSet] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [findings, setFindings] = useState({});

  // Fetch template sets based on chief complaint
  const { data: templateSets } = useQuery({
    queryKey: ['template-sets', chiefComplaint],
    queryFn: () => {
      if (chiefComplaint) {
        return examinationsAPI.getTemplateSetsByComplaint(chiefComplaint, 'NO');
      }
      return examinationsAPI.getAllTemplateSets('NO');
    },
    enabled: isOpen,
  });

  // Fetch protocols for selected template set
  const { data: templateSetDetails } = useQuery({
    queryKey: ['template-set-details', selectedTemplateSet],
    queryFn: () => examinationsAPI.getTemplateSetById(selectedTemplateSet),
    enabled: !!selectedTemplateSet,
    onSuccess: (data) => {
      if (data?.data?.protocols) {
        setProtocols(data.data.protocols);
        // Initialize findings for all protocols
        const initialFindings = {};
        data.data.protocols.forEach(protocol => {
          initialFindings[protocol.id] = {
            result: 'not_tested',
            laterality: 'none',
            severity: '',
            findings_text: '',
            selected: true
          };
        });
        setFindings(initialFindings);
      }
    },
  });

  // Save batch findings mutation
  const saveBatchMutation = useMutation({
    mutationFn: (batchData) => examinationsAPI.createBatchFindings(batchData),
    onSuccess: () => {
      queryClient.invalidateQueries(['examination-findings', encounterId]);
      queryClient.invalidateQueries(['examination-summary', encounterId]);
      queryClient.invalidateQueries(['examination-red-flags', encounterId]);

      // Increment template set usage
      if (selectedTemplateSet) {
        examinationsAPI.incrementTemplateSetUsage(selectedTemplateSet);
      }

      onClose();
    },
  });

  const handleResultChange = (protocolId, field, value) => {
    setFindings(prev => ({
      ...prev,
      [protocolId]: {
        ...prev[protocolId],
        [field]: value
      }
    }));
  };

  const toggleProtocolSelection = (protocolId) => {
    setFindings(prev => ({
      ...prev,
      [protocolId]: {
        ...prev[protocolId],
        selected: !prev[protocolId].selected
      }
    }));
  };

  const markAllAsNormal = () => {
    const updatedFindings = {};
    Object.keys(findings).forEach(protocolId => {
      updatedFindings[protocolId] = {
        ...findings[protocolId],
        result: 'negative',
        severity: '',
        findings_text: 'Normal'
      };
    });
    setFindings(updatedFindings);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare batch data - only selected protocols
    const batchData = protocols
      .filter(protocol => findings[protocol.id]?.selected)
      .map(protocol => {
        const finding = findings[protocol.id];
        return {
          encounter_id: encounterId,
          protocol_id: protocol.id,
          body_region: protocol.body_region,
          category: protocol.category,
          test_name: protocol.test_name_no || protocol.test_name,
          result: finding.result,
          laterality: finding.laterality,
          severity: finding.severity,
          findings_text: finding.findings_text,
        };
      })
      .filter(finding => finding.result !== 'not_tested'); // Only save tested protocols

    if (batchData.length === 0) {
      alert('Please mark at least one test as tested');
      return;
    }

    saveBatchMutation.mutate(batchData);
  };

  const getResultBadgeColor = (result) => {
    switch (result) {
      case 'positive': return 'bg-red-100 text-red-800 border-red-300';
      case 'negative': return 'bg-green-100 text-green-800 border-green-300';
      case 'equivocal': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Hurtigregistrering - Flere undersøkelser</h3>
              </div>
              <p className="text-sm text-indigo-100">
                Velg en mal og registrer flere funn samtidig
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-indigo-700 rounded transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!selectedTemplateSet ? (
            // Template Set Selection
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-indigo-600" />
                Velg undersøkelsesmal:
              </h4>

              {templateSets?.data && templateSets.data.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {templateSets.data.map(set => (
                    <button
                      key={set.id}
                      onClick={() => setSelectedTemplateSet(set.id)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-900">
                          {set.set_name_no || set.set_name}
                        </h5>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {set.protocol_count || 0} tester
                        </span>
                      </div>
                      {set.description_no && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {set.description_no}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Ingen maler tilgjengelig</p>
                  <p className="text-xs text-gray-500 mt-1">Lukk og velg enkelttest i stedet</p>
                </div>
              )}
            </div>
          ) : (
            // Batch Finding Entry
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Back Button + Quick Actions */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplateSet(null);
                    setProtocols([]);
                    setFindings({});
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  ← Tilbake til maler
                </button>
                <button
                  type="button"
                  onClick={markAllAsNormal}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marker alle som normale
                </button>
              </div>

              {/* Protocol List */}
              <div className="space-y-2">
                {protocols.map((protocol, index) => (
                  <div
                    key={protocol.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      findings[protocol.id]?.selected
                        ? 'border-indigo-300 bg-white'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="px-4 py-3">
                      {/* Protocol Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={findings[protocol.id]?.selected || false}
                          onChange={() => toggleProtocolSelection(protocol.id)}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                            <h5 className="text-sm font-semibold text-gray-900">
                              {protocol.test_name_no || protocol.test_name}
                            </h5>
                            {protocol.is_red_flag && (
                              <AlertTriangle className="w-4 h-4 text-red-500" title="Red Flag" />
                            )}
                          </div>
                          {protocol.description_no && (
                            <p className="text-xs text-gray-600">{protocol.description_no}</p>
                          )}
                        </div>
                      </div>

                      {/* Quick Result Buttons */}
                      {findings[protocol.id]?.selected && (
                        <div className="ml-7 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Resultat
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { value: 'negative', label: 'Negativ', icon: CheckCircle, color: 'green' },
                                { value: 'positive', label: 'Positiv', icon: AlertTriangle, color: 'red' },
                                { value: 'equivocal', label: 'Uklar', icon: AlertTriangle, color: 'yellow' },
                              ].map(option => {
                                const Icon = option.icon;
                                const isSelected = findings[protocol.id]?.result === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleResultChange(protocol.id, 'result', option.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all ${
                                      isSelected
                                        ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-800`
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Laterality */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Lateralitet
                            </label>
                            <select
                              value={findings[protocol.id]?.laterality || 'none'}
                              onChange={(e) => handleResultChange(protocol.id, 'laterality', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="none">Ingen</option>
                              <option value="left">Venstre</option>
                              <option value="right">Høyre</option>
                              <option value="bilateral">Bilateral</option>
                            </select>
                          </div>

                          {/* Notes (only if positive) */}
                          {findings[protocol.id]?.result === 'positive' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Funn (valgfritt)
                              </label>
                              <textarea
                                value={findings[protocol.id]?.findings_text || ''}
                                onChange={(e) => handleResultChange(protocol.id, 'findings_text', e.target.value)}
                                rows="2"
                                placeholder="Beskriv positive funn..."
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {selectedTemplateSet && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {protocols.filter(p => findings[p.id]?.selected && findings[p.id]?.result !== 'not_tested').length} av {protocols.length} tester vil bli lagret
            </div>
            <div className="flex gap-3">
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
                disabled={saveBatchMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveBatchMutation.isLoading ? 'Lagrer...' : 'Lagre alle'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
