/**
 * Advanced Patient Search Modal
 * Comprehensive patient search with multiple filter criteria
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import { X, Search, Calendar, User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';

export default function AdvancedPatientSearch({ onClose, onSelect }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    ageMin: '',
    ageMax: '',
    gender: '',
    city: '',
    consent_treatment: '',
    consent_marketing: '',
    has_active_consent: '',
    last_visit_from: '',
    last_visit_to: '',
    should_be_followed_up: '',
  });

  // Fetch patients with advanced filters
  const {
    data: resultsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['advanced-patient-search', filters],
    queryFn: () =>
      patientsAPI.getAll({
        search: filters.search || undefined,
        ageMin: filters.ageMin || undefined,
        ageMax: filters.ageMax || undefined,
        gender: filters.gender || undefined,
        city: filters.city || undefined,
        consent_treatment: filters.consent_treatment || undefined,
        consent_marketing: filters.consent_marketing || undefined,
        has_active_consent: filters.has_active_consent || undefined,
        last_visit_from: filters.last_visit_from || undefined,
        last_visit_to: filters.last_visit_to || undefined,
        should_be_followed_up: filters.should_be_followed_up || undefined,
        limit: 50,
      }),
    enabled: false, // Only fetch when user clicks search
  });

  const patients = resultsData?.data?.patients || [];

  const handleSearch = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      ageMin: '',
      ageMax: '',
      gender: '',
      city: '',
      consent_treatment: '',
      consent_marketing: '',
      has_active_consent: '',
      last_visit_from: '',
      last_visit_to: '',
      should_be_followed_up: '',
    });
  };

  const handlePatientClick = (patient) => {
    if (onSelect) {
      onSelect(patient);
      onClose();
    } else {
      navigate(`/patients/${patient.id}`);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Avansert pasientsok"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Advanced Patient Search</h2>
              <p className="text-sm text-gray-600">Search patients using multiple criteria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Lukk sok"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Search */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name, Email, or Phone
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
              <input
                type="number"
                placeholder="e.g., 18"
                value={filters.ageMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, ageMin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
              <input
                type="number"
                placeholder="e.g., 65"
                value={filters.ageMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, ageMax: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="e.g., Oslo"
                  value={filters.city}
                  onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Last Visit Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Visit From
              </label>
              <input
                type="date"
                value={filters.last_visit_from}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, last_visit_from: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Visit To</label>
              <input
                type="date"
                value={filters.last_visit_to}
                onChange={(e) => setFilters((prev) => ({ ...prev, last_visit_to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Consent Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Consent
              </label>
              <select
                value={filters.consent_treatment}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, consent_treatment: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Consented</option>
                <option value="false">Not Consented</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marketing Consent
              </label>
              <select
                value={filters.consent_marketing}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, consent_marketing: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Consented</option>
                <option value="false">Not Consented</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Required
              </label>
              <select
                value={filters.should_be_followed_up}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, should_be_followed_up: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {!resultsData ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Angi sokekriterier og klikk Sok for a finne pasienter</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Soker...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Ingen pasienter funnet med dine kriterier</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Fant {patients.length} pasient{patients.length !== 1 ? 'er' : ''}
              </div>
              <div className="space-y-3">
                {patients.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() => handlePatientClick(patient)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {patient.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {patient.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {patient.city || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Age: {patient.age || 'N/A'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {patient.consent_treatment && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Treatment Consent
                              </span>
                            )}
                            {patient.should_be_followed_up && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                Follow-up Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
