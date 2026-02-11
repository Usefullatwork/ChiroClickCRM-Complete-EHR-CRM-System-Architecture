import { create } from 'zustand';

const usePatientStore = create((set) => ({
  // Current patient context
  currentPatient: null,
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  clearCurrentPatient: () => set({ currentPatient: null }),

  // Recent patients list
  recentPatients: [],
  addRecentPatient: (patient) =>
    set((state) => {
      const filtered = state.recentPatients.filter((p) => p.id !== patient.id);
      return { recentPatients: [patient, ...filtered].slice(0, 10) };
    }),
}));

export default usePatientStore;
