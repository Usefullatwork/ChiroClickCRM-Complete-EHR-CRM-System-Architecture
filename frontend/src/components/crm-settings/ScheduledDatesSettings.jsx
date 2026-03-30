import { useState } from 'react';
import { Calendar, Clock, Mail, MessageSquare, Plus, Trash2, Edit } from 'lucide-react';
import { useTranslation } from '../../i18n';

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Alle pasienter' },
  { value: 'ACTIVE', label: 'Aktive pasienter' },
  { value: 'NEW', label: 'Nye pasienter (siste 30 dager)' },
  { value: 'AT_RISK', label: 'Pasienter i fare' },
  { value: 'INACTIVE', label: 'Inaktive pasienter' },
  { value: 'VIP', label: 'VIP pasienter' },
];

const EMPTY_SCHEDULE = {
  name: '',
  date: '',
  time: '10:00',
  targetAudience: 'ALL',
  channel: 'EMAIL',
  template: '',
  enabled: true,
};

/**
 * Scheduled dates / campaign settings panel — manages planned
 * dispatches (newsletters, seasonal tips, holiday greetings).
 */
const ScheduledDatesSettings = ({ scheduledDates, onAdd, onDelete, onToggle, onEdit }) => {
  const { t } = useTranslation('crm');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ ...EMPTY_SCHEDULE });

  const handleAdd = () => {
    if (!newSchedule.name || !newSchedule.date) return;
    onAdd({ ...newSchedule, id: Date.now() });
    setNewSchedule({ ...EMPTY_SCHEDULE });
    setShowAddModal(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Planlagte Utsendelser
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Legg til
        </button>
      </div>

      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Planlegg når du vil sende ut informasjon til pasientene dine. Perfekt for nyhetsbrev,
        sesongbaserte tips, eller helligdagshilsener.
      </p>

      {/* Scheduled list */}
      <div className="space-y-3">
        {scheduledDates.map((schedule) => (
          <ScheduleRow
            key={schedule.id}
            schedule={schedule}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {scheduledDates.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Ingen planlagte utsendelser</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-500 hover:underline"
            >
              Legg til din første
            </button>
          </div>
        )}
      </div>

      {/* Add schedule modal */}
      {showAddModal && (
        <AddScheduleModal
          newSchedule={newSchedule}
          setNewSchedule={setNewSchedule}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
          t={t}
        />
      )}
    </div>
  );
};

/* ---- Sub-components ---- */

function ScheduleRow({ schedule, onToggle, onEdit, onDelete }) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        schedule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onToggle(schedule.id)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              schedule.enabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
                schedule.enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <div>
            <p
              className={`font-medium ${schedule.enabled ? 'text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {schedule.name}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(schedule.date).toLocaleDateString('nb-NO')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {schedule.time}
              </span>
              <span className="flex items-center gap-1">
                {schedule.channel === 'EMAIL' ? (
                  <Mail className="w-3 h-3" />
                ) : (
                  <MessageSquare className="w-3 h-3" />
                )}
                {schedule.channel}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                {AUDIENCE_OPTIONS.find((a) => a.value === schedule.targetAudience)?.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(schedule)}
            className="p-2 text-gray-400 dark:text-gray-300 hover:text-blue-500 rounded-lg"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-500 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddScheduleModal({ newSchedule, setNewSchedule, onAdd, onClose, t }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Ny Planlagt Utsendelse</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
            <input
              type="text"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('campaignNamePlaceholder', "F.eks. 'Nyhetsbrev Februar'")}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dato</label>
              <input
                type="date"
                value={newSchedule.date}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tid</label>
              <input
                type="time"
                value={newSchedule.time}
                onChange={(e) => setNewSchedule((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Målgruppe</label>
            <select
              value={newSchedule.targetAudience}
              onChange={(e) =>
                setNewSchedule((prev) => ({ ...prev, targetAudience: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
            <div className="flex gap-2">
              {['EMAIL', 'SMS'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => setNewSchedule((prev) => ({ ...prev, channel }))}
                  className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    newSchedule.channel === channel
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  {channel === 'EMAIL' ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {channel === 'EMAIL' ? 'E-post' : 'SMS'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Avbryt
          </button>
          <button
            onClick={onAdd}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Legg til
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScheduledDatesSettings;
