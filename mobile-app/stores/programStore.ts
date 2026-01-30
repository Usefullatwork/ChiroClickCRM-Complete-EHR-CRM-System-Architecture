/**
 * Program Store
 * Manages coaching programs, enrollments, and workout logs
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { programApi, workoutApi, Program, Enrollment, TodayExercise, WorkoutLog } from '../services/api';

interface ProgramState {
  // Data
  availablePrograms: Program[];
  enrolledPrograms: Enrollment[];
  todayExercises: TodayExercise[];
  workoutLogs: WorkoutLog[];

  // UI State
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  selectedProgram: Program | null;
  selectedEnrollment: Enrollment | null;

  // Cache
  lastFetched: {
    programs?: number;
    enrollments?: number;
    today?: number;
  };

  // Streak data
  currentStreak: number;
  longestStreak: number;

  // Actions
  fetchAvailablePrograms: () => Promise<void>;
  fetchMyPrograms: () => Promise<void>;
  fetchTodayExercises: () => Promise<void>;
  enrollInProgram: (programId: string) => Promise<void>;
  unenrollFromProgram: (enrollmentId: string) => Promise<void>;
  logWorkout: (exerciseId: string, data: Partial<WorkoutLog>) => Promise<void>;
  setSelectedProgram: (program: Program | null) => void;
  setSelectedEnrollment: (enrollment: Enrollment | null) => void;
  getEnrollmentForProgram: (programId: string) => Enrollment | undefined;
  getTodayProgress: () => { completed: number; total: number; percentage: number };
  refreshAll: () => Promise<void>;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      // Initial State
      availablePrograms: [],
      enrolledPrograms: [],
      todayExercises: [],
      workoutLogs: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      selectedProgram: null,
      selectedEnrollment: null,
      lastFetched: {},
      currentStreak: 0,
      longestStreak: 0,

      // Fetch available programs
      fetchAvailablePrograms: async () => {
        const { lastFetched } = get();

        // Check cache
        if (lastFetched.programs && Date.now() - lastFetched.programs < CACHE_EXPIRY) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const programs = await programApi.getAll();

          set({
            availablePrograms: programs,
            isLoading: false,
            lastFetched: { ...lastFetched, programs: Date.now() }
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke hente programmer',
            isLoading: false
          });
        }
      },

      // Fetch enrolled programs
      fetchMyPrograms: async () => {
        const { lastFetched } = get();

        if (lastFetched.enrollments && Date.now() - lastFetched.enrollments < CACHE_EXPIRY) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const enrollments = await programApi.getMyPrograms();

          set({
            enrolledPrograms: enrollments,
            isLoading: false,
            lastFetched: { ...lastFetched, enrollments: Date.now() }
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke hente dine programmer',
            isLoading: false
          });
        }
      },

      // Fetch today's exercises
      fetchTodayExercises: async () => {
        set({ isLoading: true, error: null });

        try {
          const today = await workoutApi.getToday();

          set({
            todayExercises: today.exercises,
            currentStreak: today.streak || 0,
            longestStreak: today.longestStreak || 0,
            isLoading: false,
            lastFetched: { ...get().lastFetched, today: Date.now() }
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke hente dagens øvelser',
            isLoading: false
          });
        }
      },

      // Enroll in a program
      enrollInProgram: async (programId: string) => {
        set({ isLoading: true, error: null });

        try {
          const enrollment = await programApi.enroll(programId);

          set(state => ({
            enrolledPrograms: [...state.enrolledPrograms, enrollment],
            isLoading: false
          }));

          // Refresh today's exercises
          get().fetchTodayExercises();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke melde deg på program',
            isLoading: false
          });
          throw error;
        }
      },

      // Unenroll from a program
      unenrollFromProgram: async (enrollmentId: string) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Implement API call
          // await programApi.unenroll(enrollmentId);

          set(state => ({
            enrolledPrograms: state.enrolledPrograms.filter(e => e.id !== enrollmentId),
            isLoading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke melde deg av program',
            isLoading: false
          });
          throw error;
        }
      },

      // Log workout completion
      logWorkout: async (exerciseId: string, data: Partial<WorkoutLog>) => {
        set({ isSyncing: true, error: null });

        try {
          await workoutApi.log({
            programExerciseId: exerciseId,
            ...data
          });

          // Mark exercise as completed locally
          set(state => ({
            todayExercises: state.todayExercises.map(ex =>
              ex.programExerciseId === exerciseId
                ? { ...ex, completed: true }
                : ex
            ),
            isSyncing: false
          }));

          // Refresh to get updated streak
          setTimeout(() => get().fetchTodayExercises(), 500);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke lagre treningslogg',
            isSyncing: false
          });
          throw error;
        }
      },

      // Set selected program
      setSelectedProgram: (program: Program | null) => {
        set({ selectedProgram: program });
      },

      // Set selected enrollment
      setSelectedEnrollment: (enrollment: Enrollment | null) => {
        set({ selectedEnrollment: enrollment });
      },

      // Get enrollment for a specific program
      getEnrollmentForProgram: (programId: string) => {
        const { enrolledPrograms } = get();
        return enrolledPrograms.find(e => e.programId === programId);
      },

      // Get today's progress
      getTodayProgress: () => {
        const { todayExercises } = get();
        const total = todayExercises.length;
        const completed = todayExercises.filter(e => e.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percentage };
      },

      // Refresh all data
      refreshAll: async () => {
        set({ lastFetched: {} });
        await Promise.all([
          get().fetchAvailablePrograms(),
          get().fetchMyPrograms(),
          get().fetchTodayExercises()
        ]);
      }
    }),
    {
      name: 'chiroclick-program-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enrolledPrograms: state.enrolledPrograms,
        todayExercises: state.todayExercises,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastFetched: state.lastFetched
      })
    }
  )
);

export default useProgramStore;
