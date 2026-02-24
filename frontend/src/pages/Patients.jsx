import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsAPI } from '../services/api';
import { formatDate, formatPhone, calculateAge } from '../lib/utils';
import { Search, Plus, Download, Upload, X, Loader2, UserPlus } from 'lucide-react';
import { useTranslation } from '../i18n';
import { PatientsTableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import toast from '../utils/toast';

// Risk indicator colors based on patient status + recency
function getRiskDot(patient) {
  if (patient.status === 'INACTIVE' || patient.status === 'DECEASED') {
    return 'bg-gray-400';
  }
  if (patient.last_visit_date) {
    const daysSince = Math.floor(
      (Date.now() - new Date(patient.last_visit_date).getTime()) / 86400000
    );
    if (daysSince > 90) {
      return 'bg-red-500';
    } // at-risk
    if (daysSince > 30) {
      return 'bg-yellow-500';
    } // overdue
  }
  return 'bg-green-500'; // active
}

export default function Patients() {
  const navigate = useNavigate();
  const { t } = useTranslation('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    sortBy: 'last_name',
    sortOrder: 'asc',
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce search input with searching indicator
  useEffect(() => {
    if (searchTerm !== debouncedSearch) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setIsSearching(false);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch patients
  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', page, limit, debouncedSearch, filters],
    queryFn: () =>
      patientsAPI.getAll({
        page,
        limit,
        search: debouncedSearch,
        ...filters,
      }),
    keepPreviousData: true,
  });

  const patients = data?.data?.patients || [];
  const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: '' }));
    setPage(1);
  };

  const handleSort = (column) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    if (!patients || patients.length === 0) {
      toast.warning(t('noExportData'));
      return;
    }
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Date of Birth',
      'Status',
      'Category',
      'Total Visits',
      'Last Visit',
    ];
    const csvRows = [headers.join(',')];
    patients.forEach((p) => {
      csvRows.push(
        [
          p.solvit_id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.date_of_birth,
          p.status,
          p.category,
          p.total_visits || 0,
          p.last_visit_date || '',
        ]
          .map((f) => `"${f || ''}"`)
          .join(',')
      );
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active filter chips
  const activeFilters = [];
  if (filters.status) {
    activeFilters.push({ key: 'status', label: filters.status });
  }
  if (filters.category) {
    activeFilters.push({ key: 'category', label: filters.category });
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            data-testid="patients-page-title"
            className="text-2xl font-semibold text-gray-900 dark:text-white"
          >
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {pagination.total} {t('totalPatients').toLowerCase()}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            onClick={() => navigate('/import')}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            data-testid="patients-add-button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            onClick={() => navigate('/patients/new')}
          >
            <Plus className="w-4 h-4" />
            {t('newPatient')}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            )}
            <input
              type="text"
              placeholder={t('searchPatients')}
              data-testid="patients-search-input"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <select
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">{t('allStatuses')}</option>
            <option value="ACTIVE">{t('active')}</option>
            <option value="INACTIVE">{t('inactive')}</option>
            <option value="FINISHED">{t('finished')}</option>
          </select>

          <select
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">{t('allCategories')}</option>
            <option value="OSLO">Oslo</option>
            <option value="OUTSIDE_OSLO">Utenfor Oslo</option>
            <option value="TRAVELING">Tilreisende</option>
            <option value="REFERRED">Henvist</option>
          </select>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('filters')}:</span>
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-full"
              >
                {f.label}
                <button
                  onClick={() => clearFilter(f.key)}
                  className="p-0.5 rounded-full hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, status: '', category: '' }));
                setPage(1);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {t('clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* Patient Table */}
      {isLoading ? (
        <PatientsTableSkeleton rows={10} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-400 text-sm">
            {t('loadError')}: {error.message}
          </p>
        </div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={debouncedSearch ? t('noSearchResults') : t('noPatients')}
          description={
            debouncedSearch
              ? t('noSearchResultsDesc').replace('{query}', debouncedSearch)
              : t('noPatientsDesc')
          }
          action={
            !debouncedSearch && (
              <button
                onClick={() => navigate('/patients/new')}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                + {t('newPatient')}
              </button>
            )
          }
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-16"
        />
      ) : (
        <>
          <div
            data-testid="patients-list"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm overflow-hidden"
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th
                    className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('last_name')}
                  >
                    {t('name')}
                    {filters.sortBy === 'last_name' && (
                      <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('age')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('contact')}
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('last_visit_date')}
                  >
                    {t('lastVisit')}
                    {filters.sortBy === 'last_visit_date' && (
                      <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('totalVisits')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    data-testid="patient-row"
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {/* Risk indicator dot */}
                        <span
                          className={`w-2 h-2 rounded-full ${getRiskDot(patient)} flex-shrink-0`}
                          title={patient.status}
                        />
                        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                          <span className="text-teal-700 dark:text-teal-300 text-xs font-semibold">
                            {patient.first_name?.[0]}
                            {patient.last_name?.[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-xs text-gray-400">{patient.solvit_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {calculateAge(patient.date_of_birth) || '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[200px]">
                        {patient.email || '-'}
                      </div>
                      <div className="text-xs text-gray-400">{formatPhone(patient.phone)}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(patient.last_visit_date)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {patient.total_visits || 0}
                      </span>
                      {patient.upcoming_appointments > 0 && (
                        <span className="ml-1.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                          +{patient.upcoming_appointments}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge
                        status={patient.status?.toLowerCase() || 'active'}
                        label={patient.status}
                        size="xs"
                      />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 px-2 py-1 rounded hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}/encounter`);
                        }}
                      >
                        {t('newVisit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} av{' '}
                {pagination.total}
              </p>
              <div className="flex gap-1.5">
                <button
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 transition-colors"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('previous')}
                </button>
                {[...Array(pagination.pages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          pageNum === page
                            ? 'text-white bg-teal-600'
                            : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 transition-colors"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
