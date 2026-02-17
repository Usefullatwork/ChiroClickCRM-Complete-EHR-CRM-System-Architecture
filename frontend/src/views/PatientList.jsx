import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, User, Phone, Mail, Calendar, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { usePatients } from '../hooks/usePatients';
import { maskFodselsnummer, calculateAge } from '../utils/norwegianIdValidation';

/**
 * Patient List View
 *
 * Displays searchable/filterable list of all patients
 * Features:
 * - Real-time search
 * - Status filtering
 * - Pagination
 * - Click to view patient details
 */
export const PatientList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch patients with filters
  const { data, isLoading, error } = usePatients({
    page,
    limit,
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const patients = data?.patients || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalCount = data?.pagination?.total || 0;

  const handlePatientClick = (patientId) => {
    navigate(`/patients/${patientId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'ARCHIVED':
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
              <p className="text-sm text-slate-600 mt-1">
                {totalCount} total patient{totalCount !== 1 ? 's' : ''}
              </p>
            </div>

            <Button variant="primary" onClick={() => navigate('/patients/new')} icon={Plus}>
              New Patient
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <Card.Body>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    type="text"
                    placeholder="Search by name, fødselsnummer, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1); // Reset to page 1 on search
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card>
            <Card.Body>
              <div className="text-center py-8 text-red-600">
                <p className="font-medium">Error loading patients</p>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
            </Card.Body>
          </Card>
        ) : patients.length === 0 ? (
          <Card>
            <Card.Body>
              <div className="text-center py-12 text-slate-500">
                <User size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No patients found</p>
                <p className="text-sm mt-1">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'Get started by registering your first patient'}
                </p>
                {!searchQuery && (
                  <Button
                    variant="primary"
                    onClick={() => navigate('/patients/new')}
                    icon={Plus}
                    className="mt-4"
                  >
                    Register New Patient
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => {
              const age = patient.fodselsnummer ? calculateAge(patient.fodselsnummer) : null;

              return (
                <Card
                  key={patient.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-teal-300"
                  onClick={() => handlePatientClick(patient.id)}
                >
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      {/* Patient Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-lg font-semibold text-teal-700">
                            {patient.firstName?.[0]}
                            {patient.lastName?.[0]}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-slate-900 truncate">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <Badge variant={getStatusColor(patient.status)}>{patient.status}</Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                            {patient.fodselsnummer && (
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                <span className="font-mono">
                                  {maskFodselsnummer(patient.fodselsnummer, 6, 0)}
                                </span>
                                {age !== null && (
                                  <span className="text-slate-400">({age} years)</span>
                                )}
                              </div>
                            )}

                            {patient.phone && (
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                <span>{patient.phone}</span>
                              </div>
                            )}

                            {patient.email && (
                              <div className="flex items-center gap-1">
                                <Mail size={14} />
                                <span>{patient.email}</span>
                              </div>
                            )}

                            {patient.lastVisit && (
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>
                                  Last visit:{' '}
                                  {new Date(patient.lastVisit).toLocaleDateString('nb-NO')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight size={20} className="text-slate-400" />
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of{' '}
              {totalCount} patients
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded ${
                        page === pageNum
                          ? 'bg-teal-600 text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
