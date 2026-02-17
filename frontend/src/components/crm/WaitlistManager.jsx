/**
 * WaitlistManager Component
 *
 * Jane App-style "Super Smart Waitlist" for automatic appointment filling.
 * When a slot opens, the system can automatically notify waitlisted patients.
 *
 * Features:
 * - Add patients to waitlist with preferred times
 * - Priority levels (urgent, normal, flexible)
 * - Automatic SMS notification when slots open
 * - Time preference matching
 * - Bilingual support (EN/NO)
 */

import { useState } from 'react';
import { Clock, Phone, Plus, Send, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';

// Priority levels
export const PRIORITY_LEVELS = {
  URGENT: { value: 'urgent', label: { en: 'Urgent', no: 'Haster' }, color: 'red' },
  NORMAL: { value: 'normal', label: { en: 'Normal', no: 'Normal' }, color: 'blue' },
  FLEXIBLE: { value: 'flexible', label: { en: 'Flexible', no: 'Fleksibel' }, color: 'gray' },
};

// Time preferences
export const TIME_PREFERENCES = {
  MORNING: { value: 'morning', label: { en: 'Morning (8-12)', no: 'Morgen (8-12)' } },
  AFTERNOON: { value: 'afternoon', label: { en: 'Afternoon (12-16)', no: 'Ettermiddag (12-16)' } },
  EVENING: { value: 'evening', label: { en: 'Evening (16-20)', no: 'Kveld (16-20)' } },
  ANY: { value: 'any', label: { en: 'Any time', no: 'Når som helst' } },
};

// Day preferences
export const DAY_PREFERENCES = {
  WEEKDAYS: { value: 'weekdays', label: { en: 'Weekdays', no: 'Hverdager' } },
  WEEKENDS: { value: 'weekends', label: { en: 'Weekends', no: 'Helger' } },
  ANY: { value: 'any', label: { en: 'Any day', no: 'Hvilken som helst dag' } },
};

// =============================================================================
// WAITLIST MANAGER PANEL
// =============================================================================

export default function WaitlistManager({
  waitlist = [],
  onAdd,
  onRemove,
  onNotify,
  _onUpdate,
  patients = [],
  language = 'en',
  className = '',
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded'); // dateAdded, priority, name
  const [expandedId, setExpandedId] = useState(null);

  // New entry form state
  const [newEntry, setNewEntry] = useState({
    patientId: '',
    priority: 'normal',
    timePreferences: ['any'],
    dayPreferences: ['any'],
    notes: '',
    notifyBySMS: true,
    notifyByEmail: false,
  });

  const labels = {
    en: {
      title: 'Waitlist',
      subtitle: 'Patients waiting for appointments',
      addPatient: 'Add to Waitlist',
      search: 'Search patients...',
      filterBy: 'Filter by priority',
      all: 'All',
      sortBy: 'Sort by',
      dateAdded: 'Date Added',
      priority: 'Priority',
      name: 'Name',
      patient: 'Patient',
      selectPatient: 'Select patient...',
      timePreference: 'Time Preference',
      dayPreference: 'Day Preference',
      notes: 'Notes',
      notifyOptions: 'Notification Options',
      sms: 'SMS',
      email: 'Email',
      cancel: 'Cancel',
      add: 'Add to Waitlist',
      notify: 'Notify',
      remove: 'Remove',
      addedOn: 'Added',
      waitingSince: 'Waiting since',
      preferences: 'Preferences',
      noPatients: 'No patients on waitlist',
      notified: 'Notified',
      pending: 'Pending',
      slotAvailable: 'Slot Available!',
      sendNotification: 'Send Notification',
      notificationSent: 'Notification sent!',
    },
    no: {
      title: 'Venteliste',
      subtitle: 'Pasienter som venter på time',
      addPatient: 'Legg til på Venteliste',
      search: 'Søk pasienter...',
      filterBy: 'Filtrer etter prioritet',
      all: 'Alle',
      sortBy: 'Sorter etter',
      dateAdded: 'Dato lagt til',
      priority: 'Prioritet',
      name: 'Navn',
      patient: 'Pasient',
      selectPatient: 'Velg pasient...',
      timePreference: 'Tidsønske',
      dayPreference: 'Dagønske',
      notes: 'Notater',
      notifyOptions: 'Varselalternativer',
      sms: 'SMS',
      email: 'E-post',
      cancel: 'Avbryt',
      add: 'Legg til på Venteliste',
      notify: 'Varsle',
      remove: 'Fjern',
      addedOn: 'Lagt til',
      waitingSince: 'Venter siden',
      preferences: 'Preferanser',
      noPatients: 'Ingen pasienter på ventelisten',
      notified: 'Varslet',
      pending: 'Ventende',
      slotAvailable: 'Ledig time!',
      sendNotification: 'Send Varsel',
      notificationSent: 'Varsel sendt!',
    },
  };

  const t = labels[language] || labels.en;

  // Filter and sort waitlist
  const filteredWaitlist = waitlist
    .filter((entry) => {
      if (filterPriority !== 'all' && entry.priority !== filterPriority) {
        return false;
      }
      if (searchTerm) {
        const patient = patients.find((p) => p.id === entry.patientId);
        const name = patient ? `${patient.first_name} ${patient.last_name}`.toLowerCase() : '';
        return name.includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 0, normal: 1, flexible: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'name') {
        const patientA = patients.find((p) => p.id === a.patientId);
        const patientB = patients.find((p) => p.id === b.patientId);
        const nameA = patientA ? `${patientA.first_name} ${patientA.last_name}` : '';
        const nameB = patientB ? `${patientB.first_name} ${patientB.last_name}` : '';
        return nameA.localeCompare(nameB);
      }
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });

  const handleAdd = () => {
    if (!newEntry.patientId) {
      return;
    }

    onAdd?.({
      ...newEntry,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
      status: 'pending',
      notificationsSent: 0,
    });

    setNewEntry({
      patientId: '',
      priority: 'normal',
      timePreferences: ['any'],
      dayPreferences: ['any'],
      notes: '',
      notifyBySMS: true,
      notifyByEmail: false,
    });
    setShowAddForm(false);
  };

  const handleNotify = async (entry) => {
    const patient = patients.find((p) => p.id === entry.patientId);
    if (!patient) {
      return;
    }

    await onNotify?.(entry, {
      patient,
      message:
        language === 'en'
          ? `Hi ${patient.first_name}! A spot has opened up at our clinic. Reply YES to book.`
          : `Hei ${patient.first_name}! En time har blitt ledig på klinikken vår. Svar JA for å bestille.`,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysWaiting = (dateString) => {
    const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              {t.title}
            </h3>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t.addPatient}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t.all}</option>
            {Object.values(PRIORITY_LEVELS).map((level) => (
              <option key={level.value} value={level.value}>
                {level.label[language] || level.label.en}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="dateAdded">{t.dateAdded}</option>
            <option value="priority">{t.priority}</option>
            <option value="name">{t.name}</option>
          </select>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.patient}</label>
              <select
                value={newEntry.patientId}
                onChange={(e) => setNewEntry({ ...newEntry, patientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.selectPatient}</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.priority}</label>
                <select
                  value={newEntry.priority}
                  onChange={(e) => setNewEntry({ ...newEntry, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(PRIORITY_LEVELS).map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label[language] || level.label.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.timePreference}
                </label>
                <select
                  value={newEntry.timePreferences[0]}
                  onChange={(e) => setNewEntry({ ...newEntry, timePreferences: [e.target.value] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(TIME_PREFERENCES).map((pref) => (
                    <option key={pref.value} value={pref.value}>
                      {pref.label[language] || pref.label.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.dayPreference}
                </label>
                <select
                  value={newEntry.dayPreferences[0]}
                  onChange={(e) => setNewEntry({ ...newEntry, dayPreferences: [e.target.value] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(DAY_PREFERENCES).map((pref) => (
                    <option key={pref.value} value={pref.value}>
                      {pref.label[language] || pref.label.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
              <input
                type="text"
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.notifyOptions}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEntry.notifyBySMS}
                    onChange={(e) => setNewEntry({ ...newEntry, notifyBySMS: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{t.sms}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEntry.notifyByEmail}
                    onChange={(e) => setNewEntry({ ...newEntry, notifyByEmail: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{t.email}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAdd}
                disabled={!newEntry.patientId}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {filteredWaitlist.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t.noPatients}</p>
          </div>
        ) : (
          filteredWaitlist.map((entry) => {
            const patient = patients.find((p) => p.id === entry.patientId);
            const priority =
              PRIORITY_LEVELS[entry.priority.toUpperCase()] || PRIORITY_LEVELS.NORMAL;
            const isExpanded = expandedId === entry.id;
            const daysWaiting = getDaysWaiting(entry.dateAdded);

            return (
              <div key={entry.id} className="px-6 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${priority.color}-500`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.waitingSince} {formatDate(entry.dateAdded)} ({daysWaiting}{' '}
                        {language === 'no' ? 'dager' : 'days'})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full
                      ${
                        priority.color === 'red'
                          ? 'bg-red-100 text-red-700'
                          : priority.color === 'blue'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {priority.label[language] || priority.label.en}
                    </span>

                    <button
                      onClick={() => handleNotify(entry)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title={t.notify}
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onRemove?.(entry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      title={t.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pl-5 space-y-2 text-sm">
                    <div className="flex gap-4">
                      <span className="text-gray-500">{t.timePreference}:</span>
                      <span>
                        {entry.timePreferences
                          ?.map((p) => TIME_PREFERENCES[p.toUpperCase()]?.label[language] || p)
                          .join(', ')}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-gray-500">{t.dayPreference}:</span>
                      <span>
                        {entry.dayPreferences
                          ?.map((p) => DAY_PREFERENCES[p.toUpperCase()]?.label[language] || p)
                          .join(', ')}
                      </span>
                    </div>
                    {entry.notes && (
                      <div className="flex gap-4">
                        <span className="text-gray-500">{t.notes}:</span>
                        <span>{entry.notes}</span>
                      </div>
                    )}
                    {patient?.phone && (
                      <div className="flex gap-4">
                        <span className="text-gray-500">
                          <Phone className="w-4 h-4 inline" />
                        </span>
                        <span>{patient.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WAITLIST COMPACT - For sidebar/dashboard display
// =============================================================================

export function WaitlistCompact({
  waitlist = [],
  patients = [],
  onNotify,
  language = 'en',
  className = '',
}) {
  const labels = {
    en: { title: 'Waitlist', count: 'waiting', notify: 'Notify' },
    no: { title: 'Venteliste', count: 'venter', notify: 'Varsle' },
  };

  const t = labels[language] || labels.en;
  const urgentCount = waitlist.filter((e) => e.priority === 'urgent').length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          {t.title}
        </h4>
        <span className="text-sm text-gray-500">
          {waitlist.length} {t.count}
          {urgentCount > 0 && <span className="ml-1 text-red-500">({urgentCount} urgent)</span>}
        </span>
      </div>

      <div className="space-y-2">
        {waitlist.slice(0, 5).map((entry) => {
          const patient = patients.find((p) => p.id === entry.patientId);
          return (
            <div key={entry.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate">
                {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
              </span>
              <button
                onClick={() => onNotify?.(entry)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t.notify}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
