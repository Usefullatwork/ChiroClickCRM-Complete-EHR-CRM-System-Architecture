import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsAPI } from '../services/api';
import { formatDate, formatPhone, calculateAge, getStatusColor, debounce } from '../lib/utils';
import { Search, Plus, Filter, Download, Upload } from 'lucide-react';
import { useTranslation } from '../i18n';
import { PatientsTableSkeleton } from '../components/ui/Skeleton';
import toast from '../utils/toast';

export default function Patients() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    sortBy: 'last_name',
    sortOrder: 'asc',
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search
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

  const handleSort = (column) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    if (!patients || patients.length === 0) {
      toast.warning('No patients to export');
      return;
    }

    // Create CSV content
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

    patients.forEach((patient) => {
      const row = [
        patient.solvit_id || '',
        patient.first_name || '',
        patient.last_name || '',
        patient.email || '',
        patient.phone || '',
        patient.date_of_birth || '',
        patient.status || '',
        patient.category || '',
        patient.total_visits || 0,
        patient.last_visit_date || '',
      ];
      csvRows.push(row.map((field) => `"${field}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    navigate('/import');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            data-testid="patients-page-title"
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-200 mt-1">
            {pagination.total} {t('totalPatients').toLowerCase()}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={handleExport}
          >
            <Download size={20} />
            Export
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={handleImport}
          >
            <Upload size={20} />
            Import
          </button>
          <button
            data-testid="patients-add-button"
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            onClick={() => navigate('/patients/new')}
          >
            <Plus size={20} />
            {t('newPatient')}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={t('searchPatients')}
            data-testid="patients-search-input"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="FINISHED">Finished</option>
            <option value="DECEASED">Deceased</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="OSLO">Oslo</option>
            <option value="OUTSIDE_OSLO">Outside Oslo</option>
            <option value="TRAVELING">Traveling</option>
            <option value="REFERRED">Referred</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      {isLoading ? (
        <PatientsTableSkeleton rows={10} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading patients: {error.message}</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-white text-lg">{t('noPatients')}</p>
          <p className="text-gray-500 dark:text-gray-200 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div
            data-testid="patients-list"
            className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden"
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('last_name')}
                  >
                    Name
                    {filters.sortBy === 'last_name' && (
                      <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Contact
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('last_visit_date')}
                  >
                    {t('lastVisit')}
                    {filters.sortBy === 'last_visit_date' && (
                      <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    {t('totalVisits')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    data-testid="patient-row"
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {patient.first_name[0]}
                              {patient.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-200">
                            ID: {patient.solvit_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {calculateAge(patient.date_of_birth) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {patient.email || '-'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-200">
                        {formatPhone(patient.phone)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(patient.last_visit_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {patient.total_visits || 0}
                      </div>
                      {patient.upcoming_appointments > 0 && (
                        <div className="text-xs text-blue-600">
                          {patient.upcoming_appointments} upcoming
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(patient.status)}`}
                      >
                        {patient.status}
                      </span>
                      {patient.category && (
                        <div className="text-xs text-gray-500 dark:text-gray-200 mt-1">
                          {patient.category}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}`);
                        }}
                      >
                        View
                      </button>
                      <button
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}/encounter`);
                        }}
                      >
                        New Visit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700 dark:text-white">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </div>

              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>

                {/* Page numbers */}
                {[...Array(pagination.pages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show first, last, current, and adjacent pages
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          pageNum === page
                            ? 'text-white bg-blue-600'
                            : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <span key={pageNum} className="px-2 py-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
