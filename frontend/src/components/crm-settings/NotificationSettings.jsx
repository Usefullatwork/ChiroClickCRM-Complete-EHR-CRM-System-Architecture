import { Bell } from 'lucide-react';

/**
 * Notification settings panel — toggles and configures automatic
 * notifications (appointment reminders, follow-ups, birthday, NPS).
 */
const NotificationSettings = ({ settings, onChange }) => {
  const update = (patch) => onChange({ ...settings, ...patch });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-500" />
        Automatiske Varsler
      </h3>

      <div className="space-y-6">
        {/* Appointment reminder */}
        <NotificationCard
          title="Timepåminnelse"
          description="Send påminnelse før avtalt time"
          enabled={settings.appointmentReminder}
          onToggle={() => update({ appointmentReminder: !settings.appointmentReminder })}
        >
          {settings.appointmentReminder && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Send</span>
              <input
                type="number"
                value={settings.appointmentReminderHours}
                onChange={(e) => update({ appointmentReminderHours: parseInt(e.target.value) })}
                className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">timer før timen</span>
            </div>
          )}
        </NotificationCard>

        {/* Follow-up after visit */}
        <NotificationCard
          title="Oppfølging etter besøk"
          description="Send melding for å sjekke hvordan det går"
          enabled={settings.followUpAfterVisit}
          onToggle={() => update({ followUpAfterVisit: !settings.followUpAfterVisit })}
        >
          {settings.followUpAfterVisit && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Send</span>
              <input
                type="number"
                value={settings.followUpHours}
                onChange={(e) => update({ followUpHours: parseInt(e.target.value) })}
                className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">timer etter besøk</span>
            </div>
          )}
        </NotificationCard>

        {/* Birthday greeting */}
        <NotificationCard
          title="Bursdagshilsen"
          description="Send automatisk hilsen på pasientens bursdag"
          enabled={settings.birthdayGreeting}
          onToggle={() => update({ birthdayGreeting: !settings.birthdayGreeting })}
        />

        {/* NPS after visits */}
        <NotificationCard
          title="NPS undersøkelse"
          description="Send tilfredshetundersøkelse etter behandlingsserier"
          enabled={settings.npsAfterVisit}
          onToggle={() => update({ npsAfterVisit: !settings.npsAfterVisit })}
        >
          {settings.npsAfterVisit && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Send etter hver</span>
              <input
                type="number"
                value={settings.npsAfterVisits}
                onChange={(e) => update({ npsAfterVisits: parseInt(e.target.value) })}
                className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">besøk</span>
            </div>
          )}
        </NotificationCard>
      </div>
    </div>
  );
};

/* ---- Reusable toggle card ---- */

function NotificationCard({ title, description, enabled, onToggle, children }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {children}
    </div>
  );
}

export default NotificationSettings;
