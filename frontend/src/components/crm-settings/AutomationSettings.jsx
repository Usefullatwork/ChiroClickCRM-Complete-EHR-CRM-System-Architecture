import { Zap } from 'lucide-react';

/**
 * General automation settings — master toggles for
 * workflow automation, logging, and clinic-email copies.
 */
const AutomationSettings = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-500" />
        Automatisering
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-medium text-blue-800 mb-2">Automatiske arbeidsflyter</p>
          <p className="text-sm text-blue-600">
            Konfigurer detaljerte arbeidsflyter i &quot;Automatiseringer&quot;-seksjonen i
            CRM-menyen.
          </p>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Generelle innstillinger</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm">Aktiver alle automatiseringer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm">Logg alle automatiske handlinger</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm">Send kopi av alle meldinger til klinikk-e-post</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationSettings;
