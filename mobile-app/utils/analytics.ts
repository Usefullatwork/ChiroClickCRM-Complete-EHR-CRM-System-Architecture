/**
 * Analytics Utilities
 * Event tracking for user behavior
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_QUEUE_KEY = 'chiroclick-analytics-queue';
const ANALYTICS_USER_KEY = 'chiroclick-analytics-user';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

interface UserProperties {
  userId?: string;
  displayName?: string;
  email?: string;
  createdAt?: string;
  [key: string]: any;
}

let currentSessionId: string = generateSessionId();
let analyticsEnabled: boolean = true;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Start a new analytics session
 */
export function startSession(): void {
  currentSessionId = generateSessionId();
  trackEvent('session_start');
}

/**
 * End the current analytics session
 */
export function endSession(): void {
  trackEvent('session_end');
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  name: string,
  properties?: Record<string, any>
): Promise<void> {
  if (!analyticsEnabled) return;

  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: Date.now(),
    sessionId: currentSessionId
  };

  try {
    // Add to queue
    const queue = await getEventQueue();
    queue.push(event);
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));

    // Flush if queue is large enough
    if (queue.length >= 10) {
      await flushEvents();
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Track screen view
 */
export function trackScreenView(screenName: string, properties?: Record<string, any>): void {
  trackEvent('screen_view', {
    screen_name: screenName,
    ...properties
  });
}

/**
 * Track exercise-related events
 */
export const ExerciseEvents = {
  viewed: (exerciseId: string, exerciseName: string) =>
    trackEvent('exercise_viewed', { exercise_id: exerciseId, exercise_name: exerciseName }),

  completed: (exerciseId: string, exerciseName: string, duration?: number) =>
    trackEvent('exercise_completed', { exercise_id: exerciseId, exercise_name: exerciseName, duration }),

  skipped: (exerciseId: string, exerciseName: string, reason?: string) =>
    trackEvent('exercise_skipped', { exercise_id: exerciseId, exercise_name: exerciseName, reason }),

  favorited: (exerciseId: string, exerciseName: string) =>
    trackEvent('exercise_favorited', { exercise_id: exerciseId, exercise_name: exerciseName }),

  unfavorited: (exerciseId: string, exerciseName: string) =>
    trackEvent('exercise_unfavorited', { exercise_id: exerciseId, exercise_name: exerciseName }),

  videoPlayed: (exerciseId: string, videoId: string) =>
    trackEvent('exercise_video_played', { exercise_id: exerciseId, video_id: videoId }),

  searched: (query: string, resultsCount: number) =>
    trackEvent('exercise_searched', { query, results_count: resultsCount }),

  filtered: (filters: Record<string, any>) =>
    trackEvent('exercise_filtered', filters)
};

/**
 * Track program-related events
 */
export const ProgramEvents = {
  viewed: (programId: string, programName: string) =>
    trackEvent('program_viewed', { program_id: programId, program_name: programName }),

  enrolled: (programId: string, programName: string) =>
    trackEvent('program_enrolled', { program_id: programId, program_name: programName }),

  unenrolled: (programId: string, programName: string, reason?: string) =>
    trackEvent('program_unenrolled', { program_id: programId, program_name: programName, reason }),

  weekStarted: (programId: string, weekNumber: number) =>
    trackEvent('program_week_started', { program_id: programId, week_number: weekNumber }),

  weekCompleted: (programId: string, weekNumber: number, completionRate: number) =>
    trackEvent('program_week_completed', { program_id: programId, week_number: weekNumber, completion_rate: completionRate }),

  completed: (programId: string, programName: string, durationDays: number) =>
    trackEvent('program_completed', { program_id: programId, program_name: programName, duration_days: durationDays })
};

/**
 * Track workout-related events
 */
export const WorkoutEvents = {
  started: (exerciseCount: number) =>
    trackEvent('workout_started', { exercise_count: exerciseCount }),

  completed: (exerciseCount: number, duration: number, completionRate: number) =>
    trackEvent('workout_completed', { exercise_count: exerciseCount, duration, completion_rate: completionRate }),

  paused: (atExercise: number, totalExercises: number) =>
    trackEvent('workout_paused', { at_exercise: atExercise, total_exercises: totalExercises }),

  resumed: (atExercise: number, totalExercises: number) =>
    trackEvent('workout_resumed', { at_exercise: atExercise, total_exercises: totalExercises }),

  logged: (exerciseId: string, painRating?: number, difficultyRating?: number) =>
    trackEvent('workout_logged', { exercise_id: exerciseId, pain_rating: painRating, difficulty_rating: difficultyRating })
};

/**
 * Track streak events
 */
export const StreakEvents = {
  maintained: (streakDays: number) =>
    trackEvent('streak_maintained', { streak_days: streakDays }),

  milestone: (streakDays: number) =>
    trackEvent('streak_milestone', { streak_days: streakDays }),

  broken: (previousStreak: number) =>
    trackEvent('streak_broken', { previous_streak: previousStreak }),

  recovered: (newStreak: number) =>
    trackEvent('streak_recovered', { new_streak: newStreak })
};

/**
 * Track authentication events
 */
export const AuthEvents = {
  loginStarted: (method: string) =>
    trackEvent('login_started', { method }),

  loginCompleted: (method: string) =>
    trackEvent('login_completed', { method }),

  loginFailed: (method: string, error: string) =>
    trackEvent('login_failed', { method, error }),

  logout: () =>
    trackEvent('logout'),

  profileUpdated: (fields: string[]) =>
    trackEvent('profile_updated', { fields })
};

/**
 * Set user properties
 */
export async function setUserProperties(properties: UserProperties): Promise<void> {
  try {
    const existing = await getUserProperties();
    const updated = { ...existing, ...properties };
    await AsyncStorage.setItem(ANALYTICS_USER_KEY, JSON.stringify(updated));

    trackEvent('user_properties_updated', properties);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
}

/**
 * Get user properties
 */
export async function getUserProperties(): Promise<UserProperties> {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_USER_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
}

/**
 * Clear user properties (on logout)
 */
export async function clearUserProperties(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANALYTICS_USER_KEY);
  } catch (error) {
    console.error('Error clearing user properties:', error);
  }
}

/**
 * Get event queue
 */
async function getEventQueue(): Promise<AnalyticsEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Flush events to server
 */
export async function flushEvents(): Promise<void> {
  try {
    const queue = await getEventQueue();
    if (queue.length === 0) return;

    const userProperties = await getUserProperties();

    // TODO: Send to analytics backend
    // await api.post('/api/v1/mobile/analytics', {
    //   events: queue,
    //   user: userProperties
    // });

    // For now, just log to console in development
    if (__DEV__) {
      console.log('Analytics events:', queue.length);
    }

    // Clear queue after successful send
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error flushing analytics:', error);
  }
}

/**
 * Enable/disable analytics
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  analyticsEnabled = enabled;
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}

export default {
  startSession,
  endSession,
  trackEvent,
  trackScreenView,
  ExerciseEvents,
  ProgramEvents,
  WorkoutEvents,
  StreakEvents,
  AuthEvents,
  setUserProperties,
  getUserProperties,
  clearUserProperties,
  flushEvents,
  setAnalyticsEnabled,
  isAnalyticsEnabled
};
