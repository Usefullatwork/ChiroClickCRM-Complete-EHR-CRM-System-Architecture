/**
 * Exercise Store
 * Manages exercise library, favorites, and search
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseApi, Exercise } from '../services/api';

interface ExerciseFilters {
  category?: string;
  bodyRegion?: string;
  difficulty?: string;
  search?: string;
}

interface ExerciseState {
  // Data
  exercises: Exercise[];
  categories: string[];
  bodyRegions: string[];
  favorites: string[]; // exercise IDs
  recentlyViewed: string[]; // exercise IDs

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: ExerciseFilters;
  selectedExercise: Exercise | null;

  // Cache
  lastFetched: number | null;
  cacheExpiry: number; // milliseconds

  // Actions
  fetchExercises: (forceRefresh?: boolean) => Promise<void>;
  fetchExerciseById: (id: string) => Promise<Exercise | null>;
  searchExercises: (query: string) => Promise<void>;
  setFilters: (filters: ExerciseFilters) => void;
  clearFilters: () => void;
  toggleFavorite: (exerciseId: string) => void;
  addToRecentlyViewed: (exerciseId: string) => void;
  setSelectedExercise: (exercise: Exercise | null) => void;
  getFilteredExercises: () => Exercise[];
  getFavoriteExercises: () => Exercise[];
  getRecentlyViewedExercises: () => Exercise[];
}

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const MAX_RECENTLY_VIEWED = 20;

export const useExerciseStore = create<ExerciseState>()(
  persist(
    (set, get) => ({
      // Initial State
      exercises: [],
      categories: [],
      bodyRegions: [],
      favorites: [],
      recentlyViewed: [],
      isLoading: false,
      error: null,
      filters: {},
      selectedExercise: null,
      lastFetched: null,
      cacheExpiry: CACHE_EXPIRY,

      // Fetch all exercises
      fetchExercises: async (forceRefresh = false) => {
        const { lastFetched, cacheExpiry, exercises } = get();

        // Check if cache is still valid
        if (
          !forceRefresh &&
          lastFetched &&
          Date.now() - lastFetched < cacheExpiry &&
          exercises.length > 0
        ) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const data = await exerciseApi.getAll();

          // Extract unique categories and body regions
          const categories = [...new Set(data.map(e => e.category).filter(Boolean))];
          const bodyRegions = [...new Set(data.map(e => e.bodyRegion).filter(Boolean))];

          set({
            exercises: data,
            categories: categories as string[],
            bodyRegions: bodyRegions as string[],
            isLoading: false,
            lastFetched: Date.now()
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke hente øvelser',
            isLoading: false
          });
        }
      },

      // Fetch single exercise by ID
      fetchExerciseById: async (id: string) => {
        const { exercises } = get();

        // Check local cache first
        const cached = exercises.find(e => e.id === id);
        if (cached) {
          set({ selectedExercise: cached });
          return cached;
        }

        try {
          const exercise = await exerciseApi.getById(id);
          set({ selectedExercise: exercise });
          return exercise;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kunne ikke hente øvelse'
          });
          return null;
        }
      },

      // Search exercises
      searchExercises: async (query: string) => {
        set({ filters: { ...get().filters, search: query } });

        if (query.length < 2) return;

        set({ isLoading: true, error: null });

        try {
          const results = await exerciseApi.search(query);
          // Don't replace all exercises, just filter display
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Søk feilet',
            isLoading: false
          });
        }
      },

      // Set filters
      setFilters: (filters: ExerciseFilters) => {
        set({ filters: { ...get().filters, ...filters } });
      },

      // Clear all filters
      clearFilters: () => {
        set({ filters: {} });
      },

      // Toggle favorite status
      toggleFavorite: (exerciseId: string) => {
        const { favorites } = get();
        const isFavorite = favorites.includes(exerciseId);

        set({
          favorites: isFavorite
            ? favorites.filter(id => id !== exerciseId)
            : [...favorites, exerciseId]
        });
      },

      // Add to recently viewed
      addToRecentlyViewed: (exerciseId: string) => {
        const { recentlyViewed } = get();

        // Remove if already exists, then add to front
        const filtered = recentlyViewed.filter(id => id !== exerciseId);
        const updated = [exerciseId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);

        set({ recentlyViewed: updated });
      },

      // Set selected exercise
      setSelectedExercise: (exercise: Exercise | null) => {
        set({ selectedExercise: exercise });
      },

      // Get filtered exercises
      getFilteredExercises: () => {
        const { exercises, filters } = get();

        return exercises.filter(exercise => {
          // Category filter
          if (filters.category && exercise.category !== filters.category) {
            return false;
          }

          // Body region filter
          if (filters.bodyRegion && exercise.bodyRegion !== filters.bodyRegion) {
            return false;
          }

          // Difficulty filter
          if (filters.difficulty && exercise.difficultyLevel !== filters.difficulty) {
            return false;
          }

          // Search filter
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const name = (exercise.nameNorwegian || exercise.name || '').toLowerCase();
            const description = (exercise.descriptionNorwegian || exercise.description || '').toLowerCase();

            if (!name.includes(search) && !description.includes(search)) {
              return false;
            }
          }

          return true;
        });
      },

      // Get favorite exercises
      getFavoriteExercises: () => {
        const { exercises, favorites } = get();
        return exercises.filter(e => favorites.includes(e.id));
      },

      // Get recently viewed exercises
      getRecentlyViewedExercises: () => {
        const { exercises, recentlyViewed } = get();
        return recentlyViewed
          .map(id => exercises.find(e => e.id === id))
          .filter((e): e is Exercise => e !== undefined);
      }
    }),
    {
      name: 'chiroclick-exercise-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        exercises: state.exercises,
        categories: state.categories,
        bodyRegions: state.bodyRegions,
        favorites: state.favorites,
        recentlyViewed: state.recentlyViewed,
        lastFetched: state.lastFetched
      })
    }
  )
);

export default useExerciseStore;
