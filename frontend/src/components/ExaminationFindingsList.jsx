import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examinationsAPI } from '../services/api';
import { Edit2, Trash2, AlertTriangle, CheckCircle, XCircle, HelpCircle, FileText, Filter, Copy, Download } from 'lucide-react';
import StructuredExaminationForm from './StructuredExaminationForm';

export default function ExaminationFindingsList({ encounterId }) {
  const queryClient = useQueryClient();
  const [editingFinding, setEditingFinding] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState({});
  const [filterResult, setFilterResult] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch findings for this encounter
  const { data: findings, isLoading } = useQuery({
    queryKey: ['examination-findings', encounterId],
    queryFn: () => examinationsAPI.getFindingsByEncounter(encounterId),
    enabled: !!encounterId,
  });

  // Delete finding mutation
  const deleteFindingMutation = useMutation({
    mutationFn: (findingId) => examinationsAPI.deleteFinding(findingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['examination-findings', encounterId]);
      queryClient.invalidateQueries(['examination-summary', encounterId]);
      queryClient.invalidateQueries(['examination-red-flags', encounterId]);
    },
  });

  const handleEdit = (finding) => {
    setEditingFinding(finding);
    setShowEditForm(true);
  };

  const handleDelete = (findingId) => {
    if (window.confirm('Er du sikker på at du vil slette dette funnet?')) {
      deleteFindingMutation.mutate(findingId);
    }
  };

  const toggleRegion = (region) => {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'positive':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'negative':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'equivocal':
        return <HelpCircle className="w-4 h-4 text-yellow-500" />;
      case 'not_tested':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getResultText = (result) => {
    switch (result) {
      case 'positive': return 'Positiv';
      case 'negative': return 'Negativ';
      case 'equivocal': return 'Uklar';
      case 'not_tested': return 'Ikke testet';
      case 'unable_to_perform': return 'Ikke gjennomførbar';
      default: return result;
    }
  };

  const getSeverityBadge = (severity) => {
    if (!severity) return null;

    const colors = {
      mild: 'bg-yellow-100 text-yellow-800',
      moderate: 'bg-orange-100 text-orange-800',
      severe: 'bg-red-100 text-red-800',
    };

    const labels = {
      mild: 'Mild',
      moderate: 'Moderat',
      severe: 'Alvorlig',
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[severity]}`}>
        {labels[severity]}
      </span>
    );
  };

  const copyFindingToClipboard = (finding) => {
    const text = `${finding.test_name}: ${getResultText(finding.result)}${
      finding.findings_text ? ` - ${finding.findings_text}` : ''
    }`;
    navigator.clipboard.writeText(text);
    alert('Funn kopiert til utklippstavle');
  };

  const exportFindings = () => {
    if (!findings?.data || findings.data.length === 0) return;

    const text = findings.data
      .map(f => `${f.body_region} - ${f.test_name}: ${getResultText(f.result)}${
        f.findings_text ? ` - ${f.findings_text}` : ''
      }`)
      .join('\n');

    navigator.clipboard.writeText(text);
    alert('Alle funn kopiert til utklippstavle');
  };

  const filterFindings = (findingsData) => {
    if (!findingsData) return {};

    return Object.entries(findingsData).reduce((acc, [region, regionFindings]) => {
      // Filter by region
      if (filterRegion !== 'all' && region !== filterRegion) {
        return acc;
      }

      // Filter by result
      const filtered = regionFindings.filter(finding => {
        if (filterResult === 'all') return true;
        return finding.result === filterResult;
      });

      if (filtered.length > 0) {
        acc[region] = filtered;
      }

      return acc;
    }, {});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!findings?.data || findings.data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Ingen undersøkelsesfunn registrert</p>
        <p className="text-xs text-gray-500 mt-1">Bruk protokollvelgeren for å legge til funn</p>
      </div>
    );
  }

  // Group findings by body region
  const findingsByRegion = findings.data.reduce((acc, finding) => {
    const region = finding.body_region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(finding);
    return acc;
  }, {});

  // Apply filters
  const filteredFindings = filterFindings(findingsByRegion);
  const filteredCount = Object.values(filteredFindings).reduce((sum, arr) => sum + arr.length, 0);

  // Get unique regions for filter
  const availableRegions = Object.keys(findingsByRegion);

  return (
    <>
      <div className="space-y-4">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Undersøkelsesfunn ({filteredCount} av {findings.data.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filtrer
            </button>
            <button
              onClick={exportFindings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Eksporter
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Filtrer etter resultat
                </label>
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Alle resultater</option>
                  <option value="positive">Kun positive</option>
                  <option value="negative">Kun negative</option>
                  <option value="equivocal">Kun uklare</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Filtrer etter region
                </label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Alle regioner</option>
                  {availableRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {Object.entries(filteredFindings).map(([region, regionFindings]) => (
            <div key={region} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Region Header */}
              <button
                onClick={() => toggleRegion(region)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{region}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                    {regionFindings.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {regionFindings.some(f => f.result === 'positive') && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-400">
                    {expandedRegions[region] ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {/* Findings List */}
              {expandedRegions[region] && (
                <div className="divide-y divide-gray-200">
                  {regionFindings.map((finding) => (
                    <div key={finding.id} className="px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Test Name & Result */}
                          <div className="flex items-center gap-2 mb-2">
                            {getResultIcon(finding.result)}
                            <span className="text-sm font-medium text-gray-900">
                              {finding.test_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({getResultText(finding.result)})
                            </span>
                            {finding.laterality && finding.laterality !== 'none' && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {finding.laterality}
                              </span>
                            )}
                            {getSeverityBadge(finding.severity)}
                          </div>

                          {/* Category */}
                          <div className="text-xs text-gray-500 mb-2">
                            {finding.category}
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {finding.measurement_value && (
                              <div>
                                <span className="text-gray-500">Måling:</span>{' '}
                                <span className="text-gray-900 font-medium">
                                  {finding.measurement_value} {finding.measurement_unit}
                                </span>
                              </div>
                            )}
                            {finding.pain_score !== null && finding.pain_score !== undefined && (
                              <div>
                                <span className="text-gray-500">Smerte (NRS):</span>{' '}
                                <span className="text-gray-900 font-medium">
                                  {finding.pain_score}/10
                                </span>
                              </div>
                            )}
                            {finding.pain_location && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Lokalisering:</span>{' '}
                                <span className="text-gray-900">{finding.pain_location}</span>
                              </div>
                            )}
                          </div>

                          {/* Findings Text */}
                          {finding.findings_text && (
                            <div className="mt-2 text-sm text-gray-700 bg-blue-50 rounded p-2">
                              {finding.findings_text}
                            </div>
                          )}

                          {/* Clinician Notes */}
                          {finding.clinician_notes && (
                            <div className="mt-2 text-xs text-gray-600 italic">
                              <span className="font-medium">Notat:</span> {finding.clinician_notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => copyFindingToClipboard(finding)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Kopier"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(finding)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Rediger"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(finding.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Slett"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && editingFinding && (
        <StructuredExaminationForm
          protocol={{
            id: editingFinding.protocol_id,
            test_name: editingFinding.test_name,
            test_name_no: editingFinding.test_name,
            body_region: editingFinding.body_region,
            category: editingFinding.category,
            description_no: editingFinding.description_no,
            positive_indication_no: editingFinding.positive_indication_no,
          }}
          encounterId={encounterId}
          existingFinding={editingFinding}
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingFinding(null);
          }}
        />
      )}
    </>
  );
}
