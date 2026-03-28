import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useFeatureModule } from '../../context/FeatureModuleContext';
import { Package, Lock } from 'lucide-react';

const MODULE_CONFIG = [
  { id: 'core_ehr', locked: true, tier: 'BASIC' },
  { id: 'clinical_ai', locked: false, tier: 'PRO' },
  { id: 'exercise_rx', locked: false, tier: 'PRO' },
  { id: 'patient_portal', locked: false, tier: 'PRO' },
  { id: 'crm_marketing', locked: false, tier: 'ENTERPRISE' },
  { id: 'advanced_clinical', locked: false, tier: 'ENTERPRISE' },
  { id: 'analytics_reporting', locked: false, tier: 'PRO' },
  { id: 'multi_location', locked: false, tier: 'ENTERPRISE' },
];

export default function ModuleManager() {
  const { t } = useTranslation('settings');
  const { modules, updateModules } = useFeatureModule();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (moduleId) => {
    if (moduleId === 'core_ehr') {
      return;
    }

    const newValue = !modules[moduleId];
    const updated = { ...modules, [moduleId]: newValue };

    setSaving(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const orgId = localStorage.getItem('organizationId');
      const res = await fetch(`${API_URL}/organizations/${orgId}/modules`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: updated }),
      });

      if (res.ok) {
        updateModules(updated);
      }
    } catch {
      // Revert on failure — state unchanged since we only update on success
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('moduleManagement', 'Module Management')}
        </h3>
      </div>

      <div className="space-y-3">
        {MODULE_CONFIG.map((mod) => (
          <div
            key={mod.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 flex-1">
              {mod.locked && <Lock className="w-4 h-4 text-gray-400" />}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {t(`module_${mod.id}`, mod.id.replace(/_/g, ' '))}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(`module_${mod.id}_desc`, '')}
                </p>
                {mod.tier !== 'BASIC' && (
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    {mod.tier}
                  </span>
                )}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={modules[mod.id] || false}
                onChange={() => handleToggle(mod.id)}
                disabled={mod.locked || saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-teal-600 peer-disabled:opacity-50" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
