/**
 * Progress Service
 * API calls for workout logging, streaks, and achievements
 */

import { get, post, WorkoutLog, UserAchievement, ApiResponse } from './api';

// Types
export interface LogWorkoutData {
  programExerciseId: string;
  setsCompleted?: number;
  repsCompleted?: number;
  weightKg?: number;
  holdSecondsCompleted?: number;
  rirActual?: number;
  painRating?: number;
  difficultyRating?: number;
  sorenessRating?: number;
  notes?: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
  streakStartDate?: string;
}

export interface ComplianceData {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface PainTrendData {
  date: string;
  averagePain: number;
  workoutsLogged: number;
}

export interface ProgressStats {
  totalWorkouts: number;
  totalExercises: number;
  totalMinutes: number;
  averageComplianceRate: number;
  averagePainRating: number;
  streakInfo: StreakInfo;
  weeklyStats: {
    workouts: number;
    exercises: number;
    compliance: number;
  };
  monthlyStats: {
    workouts: number;
    exercises: number;
    compliance: number;
  };
}

export interface Achievement {
  id: string;
  type: string;
  name: string;
  nameNorwegian: string;
  description: string;
  descriptionNorwegian: string;
  icon: string;
  requirement: number;
  progress: number;
  earned: boolean;
  earnedAt?: string;
}

// Log a workout
export async function logWorkout(data: LogWorkoutData): Promise<ApiResponse<WorkoutLog>> {
  return post<WorkoutLog>('/mobile/log', data);
}

// Log multiple workouts (batch)
export async function logWorkoutBatch(data: LogWorkoutData[]): Promise<ApiResponse<WorkoutLog[]>> {
  return post<WorkoutLog[]>('/mobile/log/batch', { workouts: data });
}

// Get workout history
export async function getWorkoutHistory(
  page = 1,
  pageSize = 50
): Promise<ApiResponse<WorkoutLog[]>> {
  return get<WorkoutLog[]>(`/mobile/workouts?page=${page}&pageSize=${pageSize}`);
}

// Get workout logs for specific exercise
export async function getExerciseLogs(
  exerciseId: string,
  limit = 10
): Promise<ApiResponse<WorkoutLog[]>> {
  return get<WorkoutLog[]>(`/mobile/exercises/${exerciseId}/logs?limit=${limit}`);
}

// Get workout logs for specific date range
export async function getWorkoutLogsByDateRange(
  startDate: string,
  endDate: string
): Promise<ApiResponse<WorkoutLog[]>> {
  return get<WorkoutLog[]>(`/mobile/workouts?startDate=${startDate}&endDate=${endDate}`);
}

// Get streak info
export async function getStreakInfo(): Promise<ApiResponse<StreakInfo>> {
  return get<StreakInfo>('/mobile/progress/streak');
}

// Get compliance data for chart
export async function getComplianceData(
  period: 'week' | 'month' | 'year' = 'week'
): Promise<ApiResponse<ComplianceData[]>> {
  return get<ComplianceData[]>(`/mobile/progress/compliance?period=${period}`);
}

// Get pain trend data for chart
export async function getPainTrendData(
  period: 'week' | 'month' | '3months' | 'year' = 'month'
): Promise<ApiResponse<PainTrendData[]>> {
  return get<PainTrendData[]>(`/mobile/progress/pain-trend?period=${period}`);
}

// Get overall progress stats
export async function getProgressStats(): Promise<ApiResponse<ProgressStats>> {
  return get<ProgressStats>('/mobile/progress/stats');
}

// Get all achievements (with progress)
export async function getAchievements(): Promise<ApiResponse<Achievement[]>> {
  return get<Achievement[]>('/mobile/progress/achievements');
}

// Get earned achievements only
export async function getEarnedAchievements(): Promise<ApiResponse<UserAchievement[]>> {
  return get<UserAchievement[]>('/mobile/progress/achievements/earned');
}

// Check for new achievements (call after workout log)
export async function checkAchievements(): Promise<ApiResponse<Achievement[]>> {
  return post<Achievement[]>('/mobile/progress/achievements/check');
}

// Get exercise progress (weight/reps over time)
export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  history: {
    date: string;
    weightKg?: number;
    reps?: number;
    sets?: number;
    volume?: number; // sets * reps * weight
  }[];
  personalBests: {
    maxWeight?: number;
    maxReps?: number;
    maxVolume?: number;
  };
}

export async function getExerciseProgress(exerciseId: string): Promise<ApiResponse<ExerciseProgress>> {
  return get<ExerciseProgress>(`/mobile/progress/exercise/${exerciseId}`);
}

// Get strength progress overview
export interface StrengthProgress {
  muscleGroup: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    currentMax: number;
    previousMax: number;
    progressPercent: number;
  }[];
}

export async function getStrengthProgress(): Promise<ApiResponse<StrengthProgress[]>> {
  return get<StrengthProgress[]>('/mobile/progress/strength');
}

// Submit pain rating (standalone, not tied to exercise)
export async function submitPainRating(data: {
  rating: number;
  location?: string;
  notes?: string;
}): Promise<ApiResponse<void>> {
  return post('/mobile/progress/pain-rating', data);
}

// Get pain ratings history
export interface PainRating {
  id: string;
  rating: number;
  location?: string;
  notes?: string;
  createdAt: string;
}

export async function getPainRatings(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<PainRating[]>> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const query = params.toString();
  return get<PainRating[]>(`/mobile/progress/pain-ratings${query ? `?${query}` : ''}`);
}

// Export progress data (for sharing with clinician)
export async function exportProgress(
  format: 'pdf' | 'json' = 'pdf'
): Promise<ApiResponse<{ url: string }>> {
  return post<{ url: string }>('/mobile/progress/export', { format });
}

export default {
  logWorkout,
  logWorkoutBatch,
  getWorkoutHistory,
  getExerciseLogs,
  getWorkoutLogsByDateRange,
  getStreakInfo,
  getComplianceData,
  getPainTrendData,
  getProgressStats,
  getAchievements,
  getEarnedAchievements,
  checkAchievements,
  getExerciseProgress,
  getStrengthProgress,
  submitPainRating,
  getPainRatings,
  exportProgress
};
