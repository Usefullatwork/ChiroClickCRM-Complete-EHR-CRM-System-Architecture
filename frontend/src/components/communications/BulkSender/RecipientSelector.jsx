/**
 * RecipientSelector - Step 1: Communication type toggle + patient filter
 * Sub-component of BulkSender
 */

import { Mail, MessageSquare } from 'lucide-react';
import PatientFilter from '../PatientFilter';

export default function RecipientSelector({
  communicationType,
  setCommunicationType,
  selectedPatients,
  setSelectedPatients,
  patientsData,
  patientsLoading,
  language,
  t,
}) {
  return (
    <div className="space-y-4">
      {/* Communication Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.communicationType}
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCommunicationType('SMS');
              setSelectedPatients([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              communicationType === 'SMS'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.sms}
          </button>
          <button
            onClick={() => {
              setCommunicationType('EMAIL');
              setSelectedPatients([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              communicationType === 'EMAIL'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-4 h-4" />
            {t.email}
          </button>
        </div>
      </div>

      {/* Patient Filter */}
      <PatientFilter
        patients={patientsData?.data?.patients || []}
        selectedPatients={selectedPatients}
        onSelectionChange={setSelectedPatients}
        communicationType={communicationType}
        language={language}
        isLoading={patientsLoading}
        showConsentFilter={true}
        maxSelection={1000}
      />
    </div>
  );
}
