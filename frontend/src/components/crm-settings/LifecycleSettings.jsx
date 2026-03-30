import { Users, ChevronRight } from 'lucide-react';

/**
 * Lifecycle threshold settings — defines when patients
 * automatically transition between lifecycle stages.
 */
const LifecycleSettings = ({ settings, onChange }) => {
  const update = (patch) => onChange({ ...settings, ...patch });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        Livssyklusdefinisjoner
      </h3>

      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Definer når pasienter automatisk flyttes mellom livssyklusstadier basert på aktivitet.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ny pasient (dager)
            </label>
            <input
              type="number"
              value={settings.newPatientDays}
              onChange={(e) => update({ newPatientDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pasient regnes som &quot;ny&quot; i {settings.newPatientDays} dager
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Onboarding (antall besøk)
            </label>
            <input
              type="number"
              value={settings.onboardingVisits}
              onChange={(e) => update({ onboardingVisits: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Onboarding varer til {settings.onboardingVisits} besøk
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I fare (dager uten besøk)
            </label>
            <input
              type="number"
              value={settings.atRiskDays}
              onChange={(e) => update({ atRiskDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inaktiv (dager uten besøk)
            </label>
            <input
              type="number"
              value={settings.inactiveDays}
              onChange={(e) => update({ inactiveDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tapt (dager uten besøk)
            </label>
            <input
              type="number"
              value={settings.lostDays}
              onChange={(e) => update({ lostDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Visual representation */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Livssyklusflyt:</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              Ny ({settings.newPatientDays}d)
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-300" />
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              Onboarding ({settings.onboardingVisits} besøk)
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-300" />
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Aktiv</span>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-300" />
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
              I Fare ({settings.atRiskDays}d)
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-300" />
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
              Inaktiv ({settings.inactiveDays}d)
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-300" />
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
              Tapt ({settings.lostDays}d)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifecycleSettings;
