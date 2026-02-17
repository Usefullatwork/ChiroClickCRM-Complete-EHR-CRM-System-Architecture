import { useNavigate } from 'react-router-dom';
import { Calendar, Phone, FileText, AlertTriangle, Pill, Activity, User } from 'lucide-react';
import { calculateAge } from '../../lib/utils';
import { useTranslation } from '../../i18n';

export default function PatientSummaryCard({ patient, patientId }) {
  const navigate = useNavigate();
  const { _t } = useTranslation('patients');

  if (!patient) {
    return null;
  }

  const age = calculateAge(patient.date_of_birth);
  const hasRedFlags = patient.red_flags && patient.red_flags.length > 0;
  const hasAllergies = patient.allergies && patient.allergies.length > 0;
  const hasMeds = patient.current_medications && patient.current_medications.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Avatar & Demographics */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {age ? `${age} years` : ''}
              {patient.gender ? ` - ${patient.gender}` : ''}
              {patient.solvit_id ? ` - ID: ${patient.solvit_id}` : ''}
            </p>
            {patient.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5" /> {patient.phone}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/appointments/new?patient=${patientId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            aria-label="New appointment"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Appointment</span>
          </button>
          <button
            onClick={() => navigate(`/patients/${patientId}/encounter`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors"
            aria-label="New clinical encounter"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Encounter</span>
          </button>
        </div>
      </div>

      {/* Clinical Status Badges */}
      {(hasRedFlags || hasAllergies || hasMeds || patient.main_problem) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hasRedFlags && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {patient.red_flags.length} Red Flag{patient.red_flags.length > 1 ? 's' : ''}
            </span>
          )}
          {hasAllergies && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              Allergies: {patient.allergies.join(', ')}
            </span>
          )}
          {hasMeds && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
              <Pill className="w-3.5 h-3.5" />
              {patient.current_medications.length} Medication
              {patient.current_medications.length > 1 ? 's' : ''}
            </span>
          )}
          {patient.main_problem && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
              <Activity className="w-3.5 h-3.5" />
              {patient.main_problem}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
