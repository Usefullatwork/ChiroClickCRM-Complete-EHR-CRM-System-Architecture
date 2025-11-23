import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examinationsAPI } from '../services/api';
import { Search, ChevronRight, ChevronDown, X, AlertTriangle, Stethoscope } from 'lucide-react';

export default function ExaminationProtocolPicker({ onSelectProtocol, isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Fetch body regions
  const { data: bodyRegions } = useQuery({
    queryKey: ['examination-body-regions'],
    queryFn: () => examinationsAPI.getBodyRegions('NO'),
  });

  // Fetch protocols by region
  const { data: protocolsByRegion, isLoading: regionsLoading } = useQuery({
    queryKey: ['examination-protocols-region', selectedRegion],
    queryFn: () => examinationsAPI.getProtocolsByRegion(selectedRegion, 'NO'),
    enabled: !!selectedRegion && searchQuery.length < 2,
  });

  // Search protocols
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['examination-protocols-search', searchQuery],
    queryFn: () => examinationsAPI.searchProtocols(searchQuery, 'NO', 50),
    enabled: searchQuery.length >= 2,
  });

  const handleProtocolClick = (protocol) => {
    onSelectProtocol(protocol);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const renderProtocolItem = (protocol) => (
    <div
      key={protocol.id}
      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group border-b border-gray-100 last:border-b-0"
      onClick={() => handleProtocolClick(protocol)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 truncate">
              {protocol.test_name_no || protocol.test_name}
            </span>
            {protocol.is_red_flag && (
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" title="Red Flag Test" />
            )}
          </div>
          {protocol.description_no && (
            <p className="text-xs text-gray-600 line-clamp-2 ml-6">
              {protocol.description_no}
            </p>
          )}
          {protocol.positive_indication_no && (
            <p className="text-xs text-blue-600 mt-1 ml-6">
              <span className="font-medium">Positiv:</span> {protocol.positive_indication_no}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSearchResults = () => {
    if (!searchResults?.data) return null;

    return (
      <div className="divide-y divide-gray-200">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-600">
            {searchResults.data.length} resultater for "{searchQuery}"
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {searchResults.data.map(protocol => renderProtocolItem(protocol))}
        </div>
      </div>
    );
  };

  const renderProtocolsByRegion = () => {
    if (!protocolsByRegion?.data) return null;

    const grouped = protocolsByRegion.data;

    return (
      <div className="divide-y divide-gray-200">
        {Object.entries(grouped).map(([category, protocols]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gray-50 border-b border-gray-200"
            >
              <span className="text-sm font-medium text-gray-900">{category}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{protocols.length}</span>
                {expandedCategories[category] ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedCategories[category] && (
              <div className="bg-white">
                {protocols.map(protocol => renderProtocolItem(protocol))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBodyRegions = () => {
    if (!bodyRegions?.data) return null;

    return (
      <div className="divide-y divide-gray-200">
        {bodyRegions.data.map((region) => (
          <button
            key={region}
            onClick={() => {
              setSelectedRegion(region);
              setExpandedCategories({});
            }}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
              selectedRegion === region ? 'bg-blue-50' : ''
            }`}
          >
            <span className="text-sm font-medium text-gray-900">{region}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Undersøkelsesprotokoll</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk etter undersøkelser..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
          />
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedRegion && searchQuery.length < 2 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm">
          <button
            onClick={() => setSelectedRegion(null)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Tilbake til regioner
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{selectedRegion}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {(searchLoading || regionsLoading) ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : searchQuery.length >= 2 ? (
          renderSearchResults()
        ) : selectedRegion ? (
          renderProtocolsByRegion()
        ) : (
          renderBodyRegions()
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Velg en undersøkelse for å legge til funn
        </p>
      </div>
    </div>
  );
}
