/**
 * Program Service
 * API calls for coaching programs and enrollments
 */

import { get, post, put, del, Program, ProgramWeek, Enrollment, ApiResponse, PaginatedResponse } from './api';

// Types
export interface ProgramFilters {
  programType?: string;
  difficultyLevel?: string;
  minWeeks?: number;
  maxWeeks?: number;
}

export interface ProgramWithWeeks extends Program {
  weeks: ProgramWeek[];
}

export interface TodayExercise {
  id: string;
  exerciseId: string;
  name: string;
  nameNorwegian?: string;
  thumbnailUrl?: string;
  sets?: number;
  reps?: string;
  holdSeconds?: number;
  restSeconds?: number;
  rirTarget?: number;
  notes?: string;
  completed: boolean;
  completedAt?: string;
}

export interface TodaySchedule {
  date: string;
  programId: string;
  programName: string;
  weekNumber: number;
  dayNumber: number;
  exercises: TodayExercise[];
  totalExercises: number;
  completedExercises: number;
}

// Get available programs
export async function getPrograms(
  filters?: ProgramFilters,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<PaginatedResponse<Program>>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  if (filters?.programType) params.append('programType', filters.programType);
  if (filters?.difficultyLevel) params.append('difficultyLevel', filters.difficultyLevel);
  if (filters?.minWeeks) params.append('minWeeks', filters.minWeeks.toString());
  if (filters?.maxWeeks) params.append('maxWeeks', filters.maxWeeks.toString());

  return get<PaginatedResponse<Program>>(`/mobile/programs?${params.toString()}`);
}

// Get single program with weeks
export async function getProgramById(id: string): Promise<ApiResponse<ProgramWithWeeks>> {
  return get<ProgramWithWeeks>(`/mobile/programs/${id}`);
}

// Get program types
export async function getProgramTypes(): Promise<ApiResponse<string[]>> {
  return get<string[]>('/mobile/programs/types');
}

// Enroll in program
export async function enrollInProgram(programId: string): Promise<ApiResponse<Enrollment>> {
  return post<Enrollment>(`/mobile/programs/${programId}/enroll`);
}

// Unenroll from program
export async function unenrollFromProgram(programId: string): Promise<ApiResponse<void>> {
  return del(`/mobile/programs/${programId}/enroll`);
}

// Get user's enrolled programs
export async function getMyPrograms(): Promise<ApiResponse<Enrollment[]>> {
  return get<Enrollment[]>('/mobile/my-programs');
}

// Get enrollment for specific program
export async function getEnrollment(programId: string): Promise<ApiResponse<Enrollment | null>> {
  return get<Enrollment | null>(`/mobile/programs/${programId}/enrollment`);
}

// Update enrollment (pause, resume)
export async function updateEnrollment(
  programId: string,
  data: { status?: string; currentWeek?: number }
): Promise<ApiResponse<Enrollment>> {
  return put<Enrollment>(`/mobile/programs/${programId}/enrollment`, data);
}

// Get today's workout
export async function getTodaySchedule(): Promise<ApiResponse<TodaySchedule | null>> {
  return get<TodaySchedule | null>('/mobile/today');
}

// Get schedule for specific date
export async function getScheduleForDate(date: string): Promise<ApiResponse<TodaySchedule | null>> {
  return get<TodaySchedule | null>(`/mobile/schedule/${date}`);
}

// Get week schedule
export async function getWeekSchedule(
  programId: string,
  weekNumber: number
): Promise<ApiResponse<ProgramWeek>> {
  return get<ProgramWeek>(`/mobile/programs/${programId}/weeks/${weekNumber}`);
}

// Advance to next week
export async function advanceToNextWeek(programId: string): Promise<ApiResponse<Enrollment>> {
  return post<Enrollment>(`/mobile/programs/${programId}/advance-week`);
}

// Get program progress summary
export interface ProgramProgress {
  programId: string;
  programName: string;
  currentWeek: number;
  totalWeeks: number;
  completionPercentage: number;
  exercisesCompleted: number;
  totalExercises: number;
  streak: number;
  lastWorkoutDate?: string;
}

export async function getProgramProgress(programId: string): Promise<ApiResponse<ProgramProgress>> {
  return get<ProgramProgress>(`/mobile/programs/${programId}/progress`);
}

// Get all program progress (for enrolled programs)
export async function getAllProgramProgress(): Promise<ApiResponse<ProgramProgress[]>> {
  return get<ProgramProgress[]>('/mobile/my-programs/progress');
}

// Featured programs (for discovery)
export async function getFeaturedPrograms(): Promise<ApiResponse<Program[]>> {
  return get<Program[]>('/mobile/programs/featured');
}

// Recommended programs based on user activity
export async function getRecommendedPrograms(): Promise<ApiResponse<Program[]>> {
  return get<Program[]>('/mobile/programs/recommended');
}

export default {
  getPrograms,
  getProgramById,
  getProgramTypes,
  enrollInProgram,
  unenrollFromProgram,
  getMyPrograms,
  getEnrollment,
  updateEnrollment,
  getTodaySchedule,
  getScheduleForDate,
  getWeekSchedule,
  advanceToNextWeek,
  getProgramProgress,
  getAllProgramProgress,
  getFeaturedPrograms,
  getRecommendedPrograms
};
