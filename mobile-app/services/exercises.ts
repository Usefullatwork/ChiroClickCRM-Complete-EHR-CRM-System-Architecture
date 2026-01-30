/**
 * Exercise Service
 * API calls for exercise library
 */

import { get, Exercise, ApiResponse, PaginatedResponse } from './api';

// Types
export interface ExerciseFilters {
  search?: string;
  category?: string;
  bodyRegion?: string;
  difficultyLevel?: string;
  equipment?: string;
  muscleGroup?: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  nameNorwegian?: string;
  exerciseCount: number;
}

// Get all exercises
export async function getExercises(
  filters?: ExerciseFilters,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<PaginatedResponse<Exercise>>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.bodyRegion) params.append('bodyRegion', filters.bodyRegion);
  if (filters?.difficultyLevel) params.append('difficultyLevel', filters.difficultyLevel);
  if (filters?.equipment) params.append('equipment', filters.equipment);
  if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup);

  return get<PaginatedResponse<Exercise>>(`/mobile/exercises?${params.toString()}`);
}

// Get single exercise by ID
export async function getExerciseById(id: string): Promise<ApiResponse<Exercise>> {
  return get<Exercise>(`/mobile/exercises/${id}`);
}

// Get exercise categories
export async function getCategories(): Promise<ApiResponse<ExerciseCategory[]>> {
  return get<ExerciseCategory[]>('/mobile/exercises/categories');
}

// Get body regions
export async function getBodyRegions(): Promise<ApiResponse<string[]>> {
  return get<string[]>('/mobile/exercises/body-regions');
}

// Get difficulty levels
export async function getDifficultyLevels(): Promise<ApiResponse<string[]>> {
  return get<string[]>('/mobile/exercises/difficulty-levels');
}

// Get featured exercises (for home screen)
export async function getFeaturedExercises(): Promise<ApiResponse<Exercise[]>> {
  return get<Exercise[]>('/mobile/exercises/featured');
}

// Get related exercises
export async function getRelatedExercises(exerciseId: string): Promise<ApiResponse<Exercise[]>> {
  return get<Exercise[]>(`/mobile/exercises/${exerciseId}/related`);
}

// Search exercises (quick search)
export async function searchExercises(query: string): Promise<ApiResponse<Exercise[]>> {
  return get<Exercise[]>(`/mobile/exercises/search?q=${encodeURIComponent(query)}`);
}

// Get user favorites
export async function getFavorites(): Promise<ApiResponse<Exercise[]>> {
  return get<Exercise[]>('/mobile/exercises/favorites');
}

// Add to favorites
export async function addToFavorites(exerciseId: string): Promise<ApiResponse<void>> {
  const { post } = await import('./api');
  return post(`/mobile/exercises/${exerciseId}/favorite`);
}

// Remove from favorites
export async function removeFromFavorites(exerciseId: string): Promise<ApiResponse<void>> {
  const { del } = await import('./api');
  return del(`/mobile/exercises/${exerciseId}/favorite`);
}

// Get recently viewed exercises
export async function getRecentlyViewed(): Promise<ApiResponse<Exercise[]>> {
  return get<Exercise[]>('/mobile/exercises/recently-viewed');
}

// Mark exercise as viewed
export async function markAsViewed(exerciseId: string): Promise<ApiResponse<void>> {
  const { post } = await import('./api');
  return post(`/mobile/exercises/${exerciseId}/view`);
}

// Get video info (for offline download)
export interface VideoInfo {
  url: string;
  duration: number;
  quality: string;
  size: number;
}

export async function getVideoInfo(exerciseId: string): Promise<ApiResponse<VideoInfo>> {
  return get<VideoInfo>(`/mobile/exercises/${exerciseId}/video-info`);
}

export default {
  getExercises,
  getExerciseById,
  getCategories,
  getBodyRegions,
  getDifficultyLevels,
  getFeaturedExercises,
  getRelatedExercises,
  searchExercises,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getRecentlyViewed,
  markAsViewed,
  getVideoInfo
};
