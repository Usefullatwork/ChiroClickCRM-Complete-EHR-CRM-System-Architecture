/**
 * Patient Exercises Page
 * Viser og administrerer pasientens tilpassede treningsprogram
 *
 * Displays and manages patient's customized exercise programs
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Search, ChevronRight } from 'lucide-react';

/**
 * PatientExercises Component
 * Hovedkomponent for treningsprogram-oversikt
 *
 * @returns {JSX.Element} Patient exercises management page
 */
export default function PatientExercises() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const _queryClient = useQueryClient();

  // State for filters and search
  // Tilstand for filtrering og sok
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Placeholder for exercise programs data
  // Plassholder for treningsprogram-data
  const exercisePrograms = [];
  const isLoading = false;

  /**
   * Handle creating new exercise prescription
   * Handterer opprettelse av ny treningsforskrivning
   */
  const handleCreatePrescription = () => {
    navigate(`/patients/${patientId}/exercises/new`);
  };

  /**
   * Handle viewing exercise details
   * Handterer visning av treningsdetaljer
   */
  const handleViewExercise = (exerciseId) => {
    navigate(`/exercises/${exerciseId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header / Overskrift */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Treningsprogram</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administrer pasientens treningsprogram og ovelser
          </p>
        </div>
        <button
          onClick={handleCreatePrescription}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ny forskrivning
        </button>
      </div>

      {/* Search and Filters / Sok og filtre */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Sok etter ovelser..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle statuser</option>
            <option value="active">Aktive</option>
            <option value="completed">Fullfort</option>
            <option value="paused">Pauset</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle kategorier</option>
            <option value="rehabilitation">Rehabilitering</option>
            <option value="strengthening">Styrketrening</option>
            <option value="mobility">Mobilitet</option>
            <option value="vestibular">Vestibular</option>
          </select>
        </div>
      </div>

      {/* Exercise Programs List / Liste over treningsprogrammer */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">Laster treningsprogrammer...</p>
          </div>
        ) : exercisePrograms.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {exercisePrograms.map((program) => (
              <div
                key={program.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewExercise(program.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-500">{program.exerciseCount} ovelser</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Ingen treningsprogrammer</h3>
            <p className="text-sm text-gray-500 mb-4">
              Opprett et nytt treningsprogram for denne pasienten
            </p>
            <button
              onClick={handleCreatePrescription}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Opprett treningsprogram
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
