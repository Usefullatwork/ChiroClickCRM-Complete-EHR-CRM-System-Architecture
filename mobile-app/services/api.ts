/**
 * API Client for ChiroClick Mobile App
 * Handles all HTTP requests to the backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1/mobile';

interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let tokenStorage: TokenStorage | null = null;

/**
 * Initialize token storage from AsyncStorage
 */
export async function initializeAuth(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem('auth_tokens');
    if (stored) {
      tokenStorage = JSON.parse(stored);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    return false;
  }
}

/**
 * Store auth tokens
 */
export async function storeTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<void> {
  tokenStorage = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000
  };
  await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokenStorage));
}

/**
 * Clear auth tokens (logout)
 */
export async function clearTokens(): Promise<void> {
  tokenStorage = null;
  await AsyncStorage.removeItem('auth_tokens');
}

/**
 * Get current access token (refresh if needed)
 */
async function getAccessToken(): Promise<string | null> {
  if (!tokenStorage) {
    await initializeAuth();
  }

  if (!tokenStorage) {
    return null;
  }

  // Check if token is about to expire (within 1 minute)
  if (tokenStorage.expiresAt < Date.now() + 60000) {
    // Refresh token
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokenStorage.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        tokenStorage.accessToken = data.accessToken;
        tokenStorage.expiresAt = Date.now() + data.expiresIn * 1000;
        await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokenStorage));
      } else {
        // Refresh failed, clear tokens
        await clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearTokens();
      return null;
    }
  }

  return tokenStorage.accessToken;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

/**
 * Make unauthenticated API request (for auth endpoints)
 */
async function publicRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  sendOTP: (phoneNumber: string) =>
    publicRequest<{ success: boolean; expiresIn: number }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    }),

  verifyOTP: (phoneNumber: string, code: string) =>
    publicRequest<{
      user: User;
      tokens: { accessToken: string; refreshToken: string; expiresIn: number };
      isNewUser: boolean;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code })
    }),

  googleSignIn: (idToken: string) =>
    publicRequest<{
      user: User;
      tokens: { accessToken: string; refreshToken: string; expiresIn: number };
      isNewUser: boolean;
    }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    }),

  appleSignIn: (identityToken: string, user?: any) =>
    publicRequest<{
      user: User;
      tokens: { accessToken: string; refreshToken: string; expiresIn: number };
      isNewUser: boolean;
    }>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ identityToken, user })
    }),

  logout: (refreshToken: string) =>
    publicRequest<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    })
};

// ============================================
// USER API
// ============================================

export const userApi = {
  getProfile: () => apiRequest<User & { currentStreak: number; longestStreak: number }>('/me'),

  updateProfile: (updates: Partial<User>) =>
    apiRequest<User>('/me', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  registerDeviceToken: (token: string, deviceInfo?: object) =>
    apiRequest<{ success: boolean }>('/device-token', {
      method: 'POST',
      body: JSON.stringify({ token, deviceInfo })
    }),

  unregisterDeviceToken: (token: string) =>
    apiRequest<{ success: boolean }>('/device-token', {
      method: 'DELETE',
      body: JSON.stringify({ token })
    })
};

// ============================================
// EXERCISE API
// ============================================

export const exerciseApi = {
  getExercises: (params?: {
    category?: string;
    bodyRegion?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ exercises: Exercise[]; total: number }>(`/exercises?${queryParams}`);
  },

  getExercise: (id: string) => apiRequest<Exercise>(`/exercises/${id}`),

  getCategories: () => apiRequest<{ category: string; count: number }[]>('/exercise-categories')
};

// ============================================
// PROGRAM API
// ============================================

export const programApi = {
  getPrograms: (params?: { type?: string; difficulty?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<Program[]>(`/programs?${queryParams}`);
  },

  getProgram: (id: string) =>
    apiRequest<Program & { weeks: ProgramWeek[]; isEnrolled: boolean; enrollment: Enrollment | null }>(
      `/programs/${id}`
    ),

  enrollInProgram: (programId: string) =>
    apiRequest<Enrollment>(`/programs/${programId}/enroll`, { method: 'POST' }),

  getMyPrograms: () => apiRequest<(Enrollment & Program)[]>('/my-programs')
};

// ============================================
// WORKOUT API
// ============================================

export const workoutApi = {
  getTodayWorkout: () =>
    apiRequest<{
      date: string;
      dayOfWeek: number;
      programs: TodayProgram[];
    }>('/today'),

  logExercise: (data: {
    programExerciseId?: string;
    exerciseId?: string;
    enrollmentId?: string;
    setsCompleted?: number;
    repsCompleted?: number;
    weightKg?: number;
    holdSecondsCompleted?: number;
    rirActual?: number;
    painRating?: number;
    difficultyRating?: number;
    sorenessRating?: number;
    notes?: string;
  }) =>
    apiRequest<WorkoutLog>('/log', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getProgress: (days?: number) =>
    apiRequest<{
      streak: { current_streak: number; longest_streak: number };
      workoutsByDate: { date: string; workout_count: number; avg_pain: number }[];
      totalStats: { total_workouts: number; active_days: number; avg_pain_overall: number };
    }>(`/progress?days=${days || 30}`),

  getAchievements: () => apiRequest<Achievement[]>('/achievements')
};

// ============================================
// SOCIAL API
// ============================================

export const socialApi = {
  getSocialLinks: () =>
    apiRequest<{ userId: string; name: string; links: { platform: string; url: string; displayName: string }[] }[]>(
      '/social-links'
    )
};

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  phoneNumber: string;
  phoneVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  notificationTime: string;
  notificationEnabled: boolean;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  name_norwegian?: string;
  description?: string;
  description_norwegian?: string;
  category: string;
  subcategory?: string;
  body_region?: string;
  difficulty_level?: string;
  instructions?: string;
  instructions_norwegian?: string;
  sets_default?: number;
  reps_default?: number;
  hold_seconds?: number;
  video_url?: string;
  thumbnail_url?: string;
  image_url?: string;
  tags?: string[];
}

export interface Program {
  id: string;
  name: string;
  name_norwegian?: string;
  description?: string;
  description_norwegian?: string;
  program_type: string;
  duration_weeks: number;
  difficulty_level?: string;
  cover_image_url?: string;
  created_by_name?: string;
  enrollment_count?: number;
}

export interface ProgramWeek {
  id: string;
  week_number: number;
  focus_area?: string;
  notes?: string;
  is_deload: boolean;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  exerciseId: string;
  dayOfWeek: number;
  orderIndex: number;
  sets?: number;
  reps?: string;
  holdSeconds?: number;
  restSeconds?: number;
  rirTarget?: number;
  notes?: string;
  exercise: {
    id: string;
    name: string;
    nameNorwegian?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    category: string;
  };
}

export interface Enrollment {
  id: string;
  mobile_user_id: string;
  program_id: string;
  current_week: number;
  current_day: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
}

export interface TodayProgram {
  programId: string;
  programName: string;
  programNameNorwegian?: string;
  enrollmentId: string;
  currentWeek: number;
  weekFocus?: string;
  exercises: TodayExercise[];
}

export interface TodayExercise {
  programExerciseId: string;
  exerciseId: string;
  name: string;
  nameNorwegian?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  category: string;
  instructions?: string;
  sets?: number;
  reps?: string;
  holdSeconds?: number;
  restSeconds?: number;
  rirTarget?: number;
  notes?: string;
  completedToday: boolean;
}

export interface WorkoutLog {
  id: string;
  mobile_user_id: string;
  completed_at: string;
  sets_completed?: number;
  reps_completed?: number;
  weight_kg?: number;
  pain_rating?: number;
  difficulty_rating?: number;
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description?: string;
  earned_at: string;
  metadata?: object;
}
