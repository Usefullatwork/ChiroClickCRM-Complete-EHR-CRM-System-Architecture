import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FeatureModuleContext = createContext(null);

const ALL_MODULES_ENABLED = {
  core_ehr: true,
  clinical_ai: true,
  exercise_rx: true,
  patient_portal: true,
  crm_marketing: true,
  advanced_clinical: true,
  analytics_reporting: true,
  multi_location: true,
};

export function FeatureModuleProvider({ children }) {
  const [modules, setModules] = useState(ALL_MODULES_ENABLED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDesktop =
      import.meta.env.VITE_DEV_SKIP_AUTH === 'true' || !import.meta.env.VITE_API_URL;

    if (isDesktop) {
      setModules(ALL_MODULES_ENABLED);
      setLoading(false);
      return;
    }

    const fetchModules = async () => {
      try {
        const orgId = localStorage.getItem('organizationId');
        if (!orgId) {
          setLoading(false);
          return;
        }
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${API_URL}/organizations/current`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const orgData = data.data || data;
          const enabledModules = orgData.settings?.enabled_modules || ALL_MODULES_ENABLED;
          setModules(enabledModules);
        }
      } catch {
        // Fall back to all enabled
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const isModuleEnabled = useCallback(
    (moduleName) => {
      if (moduleName === 'core_ehr') return true;
      return modules[moduleName] === true;
    },
    [modules]
  );

  const updateModules = useCallback((newModules) => {
    setModules((prev) => ({ ...prev, ...newModules }));
  }, []);

  return (
    <FeatureModuleContext.Provider value={{ modules, isModuleEnabled, loading, updateModules }}>
      {children}
    </FeatureModuleContext.Provider>
  );
}

export function useFeatureModule() {
  const ctx = useContext(FeatureModuleContext);
  if (!ctx) {
    return {
      modules: ALL_MODULES_ENABLED,
      isModuleEnabled: () => true,
      loading: false,
      updateModules: () => {},
    };
  }
  return ctx;
}
