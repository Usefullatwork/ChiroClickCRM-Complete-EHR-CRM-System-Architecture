/**
 * PatientFilter Component
 *
 * Reusable filter component for selecting patients based on various criteria.
 * Used in bulk communication, recall campaigns, and reporting.
 *
 * Features:
 * - Filter by status, category, last visit date
 * - Search by name, phone, email
 * - Consent filtering (SMS/Email)
 * - Multi-select with select all/none
 * - Norwegian translations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  Check,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// Patient status options
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: { en: 'Active', no: 'Aktiv' }, color: 'green' },
  { value: 'INACTIVE', label: { en: 'Inactive', no: 'Inaktiv' }, color: 'gray' },
  { value: 'PROSPECTIVE', label: { en: 'Prospective', no: 'Potensiell' }, color: 'blue' },
  { value: 'ARCHIVED', label: { en: 'Archived', no: 'Arkivert' }, color: 'yellow' },
];

// Patient category options
const CATEGORY_OPTIONS = [
  { value: 'REGULAR', label: { en: 'Regular', no: 'Fast pasient' } },
  { value: 'VIP', label: { en: 'VIP', no: 'VIP' } },
  { value: 'FAMILY', label: { en: 'Family', no: 'Familie' } },
  { value: 'EMPLOYEE', label: { en: 'Employee', no: 'Ansatt' } },
  { value: 'INSURANCE', label: { en: 'Insurance', no: 'Forsikring' } },
];

// Last visit presets
const LAST_VISIT_PRESETS = [
  { value: '7', label: { en: 'Last 7 days', no: 'Siste 7 dager' } },
  { value: '30', label: { en: 'Last 30 days', no: 'Siste 30 dager' } },
  { value: '90', label: { en: 'Last 90 days', no: 'Siste 90 dager' } },
  { value: '180', label: { en: 'Last 6 months', no: 'Siste 6 maneder' } },
  { value: '365', label: { en: 'Last year', no: 'Siste ar' } },
  { value: 'over30', label: { en: 'Over 30 days ago', no: 'Over 30 dager siden' } },
  { value: 'over90', label: { en: 'Over 90 days ago', no: 'Over 90 dager siden' } },
  { value: 'over180', label: { en: 'Over 6 months ago', no: 'Over 6 maneder siden' } },
];

export default function PatientFilter({
  patients = [],
  selectedPatients = [],
  onSelectionChange,
  onFiltersChange,
  communicationType = 'SMS',
  language = 'no',
  isLoading = false,
  showConsentFilter = true,
  maxSelection = 1000,
  className = '',
}) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(['ACTIVE']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [lastVisitPreset, setLastVisitPreset] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [requireConsent, setRequireConsent] = useState(true);

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('lastName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Labels
  const labels = {
    en: {
      search: 'Search patients...',
      filters: 'Filters',
      advancedFilters: 'Advanced Filters',
      status: 'Status',
      category: 'Category',
      lastVisit: 'Last Visit',
      customDateRange: 'Custom Date Range',
      from: 'From',
      to: 'To',
      requireConsent: 'Only patients with consent',
      selectAll: 'Select All',
      selectNone: 'Clear Selection',
      selected: 'selected',
      of: 'of',
      patients: 'patients',
      noPatients: 'No patients match your filters',
      noContact: 'No contact info',
      noConsent: 'No consent',
      lastVisitDate: 'Last visit',
      refresh: 'Refresh',
      sortBy: 'Sort by',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      lastVisitSort: 'Last Visit',
      maxSelectionWarning: `Maximum ${maxSelection} patients can be selected`,
    },
    no: {
      search: 'Sok etter pasienter...',
      filters: 'Filtre',
      advancedFilters: 'Avanserte Filtre',
      status: 'Status',
      category: 'Kategori',
      lastVisit: 'Siste Besok',
      customDateRange: 'Egendefinert Datoperiode',
      from: 'Fra',
      to: 'Til',
      requireConsent: 'Kun pasienter med samtykke',
      selectAll: 'Velg Alle',
      selectNone: 'Fjern Valg',
      selected: 'valgt',
      of: 'av',
      patients: 'pasienter',
      noPatients: 'Ingen pasienter matcher filtrene',
      noContact: 'Ingen kontaktinfo',
      noConsent: 'Ingen samtykke',
      lastVisitDate: 'Siste besok',
      refresh: 'Oppdater',
      sortBy: 'Sorter etter',
      name: 'Navn',
      phone: 'Telefon',
      email: 'E-post',
      lastVisitSort: 'Siste Besok',
      maxSelectionWarning: `Maksimalt ${maxSelection} pasienter kan velges`,
    },
  };

  const t = labels[language] || labels.no;

  // Calculate date range from preset
  const getDateRangeFromPreset = useCallback((preset) => {
    const now = new Date();
    let from = null;
    let to = null;

    switch (preset) {
      case '7':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case '30':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case '90':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case '180':
        from = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case '365':
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case 'over30':
        to = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'over90':
        to = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'over180':
        to = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        break;
    }

    return { from, to };
  }, []);

  // Filter patients based on all criteria
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatus.length > 0) {
      result = result.filter((p) => selectedStatus.includes(p.status));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // Last visit filter
    if (lastVisitPreset) {
      const { from, to } = getDateRangeFromPreset(lastVisitPreset);
      result = result.filter((p) => {
        if (!p.lastVisitDate) {
          return false;
        }
        const visitDate = new Date(p.lastVisitDate);
        if (from && visitDate < from) {
          return false;
        }
        if (to && visitDate > to) {
          return false;
        }
        return true;
      });
    } else if (customDateFrom || customDateTo) {
      result = result.filter((p) => {
        if (!p.lastVisitDate) {
          return false;
        }
        const visitDate = new Date(p.lastVisitDate);
        if (customDateFrom && visitDate < new Date(customDateFrom)) {
          return false;
        }
        if (customDateTo && visitDate > new Date(customDateTo)) {
          return false;
        }
        return true;
      });
    }

    // Consent filter
    if (requireConsent && showConsentFilter) {
      if (communicationType === 'SMS') {
        result = result.filter((p) => p.phone && p.consentSms !== false);
      } else if (communicationType === 'EMAIL') {
        result = result.filter((p) => p.email && p.consentEmail !== false);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'lastName':
          comparison = (a.lastName || '').localeCompare(b.lastName || '');
          break;
        case 'firstName':
          comparison = (a.firstName || '').localeCompare(b.firstName || '');
          break;
        case 'lastVisit':
          comparison = new Date(a.lastVisitDate || 0) - new Date(b.lastVisitDate || 0);
          break;
        default:
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    patients,
    searchQuery,
    selectedStatus,
    selectedCategories,
    lastVisitPreset,
    customDateFrom,
    customDateTo,
    requireConsent,
    showConsentFilter,
    communicationType,
    sortBy,
    sortOrder,
    getDateRangeFromPreset,
  ]);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        search: searchQuery,
        status: selectedStatus,
        categories: selectedCategories,
        lastVisitPreset,
        customDateFrom,
        customDateTo,
        requireConsent,
        filteredCount: filteredPatients.length,
      });
    }
  }, [
    searchQuery,
    selectedStatus,
    selectedCategories,
    lastVisitPreset,
    customDateFrom,
    customDateTo,
    requireConsent,
    filteredPatients.length,
    onFiltersChange,
  ]);

  // Selection handlers
  const handleSelectAll = () => {
    const idsToSelect = filteredPatients.slice(0, maxSelection).map((p) => p.id);
    onSelectionChange?.(idsToSelect);
  };

  const handleSelectNone = () => {
    onSelectionChange?.([]);
  };

  const handleTogglePatient = (patientId) => {
    const isSelected = selectedPatients.includes(patientId);
    if (isSelected) {
      onSelectionChange?.(selectedPatients.filter((id) => id !== patientId));
    } else if (selectedPatients.length < maxSelection) {
      onSelectionChange?.([...selectedPatients, patientId]);
    }
  };

  const handleStatusToggle = (status) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus(['ACTIVE']);
    setSelectedCategories([]);
    setLastVisitPreset('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setRequireConsent(true);
  };

  // Check if patient has valid contact for communication type
  const hasValidContact = (patient) => {
    if (communicationType === 'SMS') {
      return patient.phone && patient.consentSms !== false;
    }
    return patient.email && patient.consentEmail !== false;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Search and Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showAdvancedFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t.filters}
            {showAdvancedFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Clear Filters */}
          {(searchQuery ||
            selectedStatus.length !== 1 ||
            selectedStatus[0] !== 'ACTIVE' ||
            selectedCategories.length > 0 ||
            lastVisitPreset ||
            customDateFrom ||
            customDateTo) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-500 hover:text-gray-700"
              title={language === 'no' ? 'Nullstill filtre' : 'Clear filters'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.status}</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusToggle(status.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedStatus.includes(status.value)
                        ? `bg-${status.color}-100 text-${status.color}-800 border-${status.color}-200 border`
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {status.label[language] || status.label.no}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.category}</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryToggle(category.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategories.includes(category.value)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {category.label[language] || category.label.no}
                  </button>
                ))}
              </div>
            </div>

            {/* Last Visit Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.lastVisit}</label>
              <div className="flex flex-wrap gap-2">
                {LAST_VISIT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setLastVisitPreset(lastVisitPreset === preset.value ? '' : preset.value);
                      setCustomDateFrom('');
                      setCustomDateTo('');
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      lastVisitPreset === preset.value
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label[language] || preset.label.no}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">{t.customDateRange}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => {
                      setCustomDateFrom(e.target.value);
                      setLastVisitPreset('');
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => {
                      setCustomDateTo(e.target.value);
                      setLastVisitPreset('');
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Consent Filter */}
            {showConsentFilter && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireConsent}
                    onChange={(e) => setRequireConsent(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t.requireConsent} ({communicationType})
                  </span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Controls */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            disabled={filteredPatients.length === 0}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            <CheckSquare className="w-4 h-4" />
            {t.selectAll}
          </button>
          <button
            onClick={handleSelectNone}
            disabled={selectedPatients.length === 0}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400"
          >
            <Square className="w-4 h-4" />
            {t.selectNone}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{t.sortBy}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-0 bg-transparent text-gray-700 font-medium focus:ring-0"
            >
              <option value="lastName">{t.name}</option>
              <option value="lastVisit">{t.lastVisitSort}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-gray-500 hover:text-gray-700"
            >
              {sortOrder === 'asc' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Selection Counter */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">{selectedPatients.length}</span>
            <span>{t.of}</span>
            <span>{filteredPatients.length}</span>
            <span>{t.patients}</span>
          </div>
        </div>
      </div>

      {/* Max Selection Warning */}
      {selectedPatients.length >= maxSelection && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4" />
          {t.maxSelectionWarning}
        </div>
      )}

      {/* Patient List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-8 h-8 mb-2 opacity-50" />
            <p>{t.noPatients}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => {
              const isSelected = selectedPatients.includes(patient.id);
              const canContact = hasValidContact(patient);

              return (
                <div
                  key={patient.id}
                  onClick={() => canContact && handleTogglePatient(patient.id)}
                  className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                    canContact ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                  } ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : canContact
                          ? 'border-gray-300'
                          : 'border-gray-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </span>
                      {patient.category && (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                          {CATEGORY_OPTIONS.find((c) => c.value === patient.category)?.label[
                            language
                          ] || patient.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      {communicationType === 'SMS' ? (
                        patient.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </span>
                        ) : (
                          <span className="text-red-500">{t.noContact}</span>
                        )
                      ) : patient.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {patient.email}
                        </span>
                      ) : (
                        <span className="text-red-500">{t.noContact}</span>
                      )}
                      {patient.lastVisitDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(patient.lastVisitDate).toLocaleDateString(
                            language === 'no' ? 'nb-NO' : 'en-US'
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Consent Warning */}
                  {!canContact && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      {communicationType === 'SMS' && !patient.phone
                        ? t.noContact
                        : communicationType === 'EMAIL' && !patient.email
                          ? t.noContact
                          : t.noConsent}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for embedding in other components
export function PatientFilterCompact({
  patients = [],
  selectedPatients = [],
  onSelectionChange,
  _communicationType = 'SMS',
  language = 'no',
  className = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const labels = {
    en: { search: 'Search...', selected: 'selected' },
    no: { search: 'Sok...', selected: 'valgt' },
  };
  const t = labels[language] || labels.no;

  const filteredPatients = useMemo(() => {
    if (!searchQuery) {
      return patients;
    }
    const query = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.phone?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <div className="p-2 border-b border-gray-200">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.search}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
        />
      </div>
      <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-100">
        {filteredPatients.slice(0, 50).map((patient) => {
          const isSelected = selectedPatients.includes(patient.id);
          return (
            <div
              key={patient.id}
              onClick={() => {
                if (isSelected) {
                  onSelectionChange?.(selectedPatients.filter((id) => id !== patient.id));
                } else {
                  onSelectionChange?.([...selectedPatients, patient.id]);
                }
              }}
              className={`px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm">
                {patient.firstName} {patient.lastName}
              </span>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
        {selectedPatients.length} {t.selected}
      </div>
    </div>
  );
}
