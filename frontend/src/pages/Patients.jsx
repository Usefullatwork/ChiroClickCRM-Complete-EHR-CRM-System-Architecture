import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsAPI } from '../services/api';
import { formatDate, formatPhone, calculateAge, getStatusColor, debounce } from '../lib/utils';
import { Search, Plus, Filter, Download, Upload } from 'lucide-react';

export default function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    sortBy: 'last_name',
    sortOrder: 'asc'
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
    queryFn: () => patientsAPI.getAll({
      page,
      limit,
      search: debouncedSearch,
      ...filters
    }),
    keepPreviousData: true
  });

  const patients = data?.data?.patients || [];
  const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} total patients
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => {/* TODO: Export functionality */}}
          >
            <Download size={20} />
            Export
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => {/* TODO: Import functionality */}}
          >
            <Upload size={20} />
            Import
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            onClick={() => navigate('/patients/new')}
          >
            <Plus size={20} />
            New Patient
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search patients by name, email, phone, or SolvIt ID..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading patients...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading patients: {error.message}</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No patients found</p>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('last_name')}
                  >
                    Name
                    {filters.sortBy === 'last_name' && (
                      <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('last_visit_date')}
                  >
                    Last Visit
                    {filters.sortBy === 'last_visit_date' && (
                      <span className="ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.solvit_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateAge(patient.date_of_birth) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.email || '-'}</div>
                      <div className="text-sm text-gray-500">{formatPhone(patient.phone)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(patient.last_visit_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.total_visits || 0}</div>
                      {patient.upcoming_appointments > 0 && (
                        <div className="text-xs text-blue-600">
                          {patient.upcoming_appointments} upcoming
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                      {patient.category && (
                        <div className="text-xs text-gray-500 mt-1">{patient.category}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}`);
                        }}
                      >
                        View
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
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
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>

              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
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
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={pageNum} className="px-2 py-2">...</span>;
                  }
                  return null;
                })}

                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
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
