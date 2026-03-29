import { Clock, MessageSquare, Mail } from 'lucide-react';

/**
 * Check-in settings panel — configures automatic follow-up
 * for inactive patients (channel, timing, message template).
 */
const CheckinSettings = ({ settings, onChange }) => {
  const update = (patch) => onChange({ ...settings, ...patch });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" />
        Innsjekking - Automatisk Oppfølging
      </h3>

      <div className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Aktiver automatisk innsjekking</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send automatisk melding til pasienter som ikke har vært her på en stund
            </p>
          </div>
          <button
            onClick={() => update({ enabled: !settings.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className={`space-y-4 ${!settings.enabled && 'opacity-50 pointer-events-none'}`}>
          {/* Inactive days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Antall dager uten besøk før innsjekking
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.inactiveDays}
                onChange={(e) => update({ inactiveDays: parseInt(e.target.value) })}
                min={7}
                max={180}
                className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500 dark:text-gray-400">dager</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pasienter som ikke har besøkt klinikken på {settings.inactiveDays} dager vil motta en
              melding
            </p>
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kommunikasjonskanal
            </label>
            <div className="flex gap-2">
              {['SMS', 'EMAIL'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => update({ channel })}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    settings.channel === channel
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  {channel === 'SMS' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {channel === 'SMS' ? 'SMS' : 'E-post'}
                </button>
              ))}
            </div>
          </div>

          {/* Send time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sendetidspunkt</label>
            <input
              type="time"
              value={settings.sendTime}
              onChange={(e) => update({ sendTime: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Message template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meldingsmal</label>
            <textarea
              value={settings.messageTemplate}
              onChange={(e) => update({ messageTemplate: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tilgjengelige variabler: {'{name}'}, {'{first_name}'}, {'{booking_link}'},{' '}
              {'{clinic_name}'}
            </p>
          </div>

          {/* Max attempts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maks antall forsøk
              </label>
              <input
                type="number"
                value={settings.maxAttempts}
                onChange={(e) => update({ maxAttempts: parseInt(e.target.value) })}
                min={1}
                max={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dager mellom forsøk
              </label>
              <input
                type="number"
                value={settings.daysBetweenAttempts}
                onChange={(e) => update({ daysBetweenAttempts: parseInt(e.target.value) })}
                min={1}
                max={30}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Exclude weekends */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.excludeWeekends}
              onChange={(e) => update({ excludeWeekends: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Ikke send på helger</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CheckinSettings;
