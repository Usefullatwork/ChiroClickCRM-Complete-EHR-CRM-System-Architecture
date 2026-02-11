import { create } from 'zustand';

const useAppStore = create((set) => ({
  // User info
  user: null,
  setUser: (user) => set({ user }),

  // Organization settings
  orgSettings: null,
  setOrgSettings: (orgSettings) => set({ orgSettings }),

  // UI preferences
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  language: 'nb',
  setLanguage: (language) => set({ language }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

export default useAppStore;
