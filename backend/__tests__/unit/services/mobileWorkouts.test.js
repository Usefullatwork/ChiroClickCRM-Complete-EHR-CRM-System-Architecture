/**
 * Unit Tests for Mobile Workouts Service
 * Tests workout retrieval, logging, progress, streaks, and achievements
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
  default: {
    query: mockQuery,
    transaction: mockTransaction,
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
const { getTodayWorkout, logWorkout, getProgress, getAchievements } =
  await import('../../../src/services/mobileWorkouts.js');

const MOBILE_USER_ID = 'mobile-user-001';
const ENROLLMENT_ID = 'enrollment-001';
const PROGRAM_EXERCISE_ID = 'pe-001';
const EXERCISE_ID = 'ex-001';
const PROGRAM_ID = 'prog-001';

describe('Mobile Workouts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default transaction mock: invokes callback with a mock client
    mockTransaction.mockImplementation(async (callback) => {
      const client = { query: mockClientQuery };
      return await callback(client);
    });
  });

  // ==========================================================================
  // getTodayWorkout
  // ==========================================================================

  describe('getTodayWorkout', () => {
    it('should return empty programs when no active enrollments exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getTodayWorkout(MOBILE_USER_ID);

      expect(result.date).toBeDefined();
      expect(result.dayOfWeek).toBeGreaterThanOrEqual(1);
      expect(result.dayOfWeek).toBeLessThanOrEqual(7);
      expect(result.programs).toEqual([]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM user_program_enrollments'),
        [MOBILE_USER_ID, expect.any(Number)]
      );
    });

    it('should group exercises by program', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            enrollment_id: ENROLLMENT_ID,
            current_week: 2,
            current_day: 3,
            program_id: PROGRAM_ID,
            program_name: 'Lower Back Rehab',
            program_name_norwegian: 'Korsrygg Rehabilitering',
            week_id: 'w-1',
            focus_area: 'Core stability',
            program_exercise_id: PROGRAM_EXERCISE_ID,
            sets: 3,
            reps: 12,
            hold_seconds: null,
            rest_seconds: 60,
            rir_target: 2,
            exercise_notes: 'Focus on form',
            exercise_id: EXERCISE_ID,
            exercise_name: 'Bird Dog',
            exercise_name_norwegian: 'Fuglehund',
            video_url: 'https://example.com/video.mp4',
            thumbnail_url: 'https://example.com/thumb.jpg',
            category: 'core',
            instructions_norwegian: 'Hold ryggen rett',
            completed_today: false,
          },
          {
            enrollment_id: ENROLLMENT_ID,
            current_week: 2,
            current_day: 3,
            program_id: PROGRAM_ID,
            program_name: 'Lower Back Rehab',
            program_name_norwegian: 'Korsrygg Rehabilitering',
            week_id: 'w-1',
            focus_area: 'Core stability',
            program_exercise_id: 'pe-002',
            sets: 2,
            reps: 10,
            hold_seconds: 30,
            rest_seconds: 45,
            rir_target: null,
            exercise_notes: null,
            exercise_id: 'ex-002',
            exercise_name: 'Dead Bug',
            exercise_name_norwegian: 'Død Bille',
            video_url: null,
            thumbnail_url: null,
            category: 'core',
            instructions_norwegian: 'Pust ut ved bevegelse',
            completed_today: true,
          },
        ],
      });

      const result = await getTodayWorkout(MOBILE_USER_ID);

      expect(result.programs).toHaveLength(1);
      const program = result.programs[0];
      expect(program.programId).toBe(PROGRAM_ID);
      expect(program.programName).toBe('Lower Back Rehab');
      expect(program.programNameNorwegian).toBe('Korsrygg Rehabilitering');
      expect(program.currentWeek).toBe(2);
      expect(program.weekFocus).toBe('Core stability');
      expect(program.exercises).toHaveLength(2);
    });

    it('should separate exercises from different programs', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            enrollment_id: ENROLLMENT_ID,
            current_week: 1,
            current_day: 1,
            program_id: PROGRAM_ID,
            program_name: 'Program A',
            program_name_norwegian: 'Program A',
            week_id: 'w-1',
            focus_area: 'Mobility',
            program_exercise_id: PROGRAM_EXERCISE_ID,
            sets: 3,
            reps: 10,
            hold_seconds: null,
            rest_seconds: 60,
            rir_target: null,
            exercise_notes: null,
            exercise_id: EXERCISE_ID,
            exercise_name: 'Stretch A',
            exercise_name_norwegian: 'Tøyning A',
            video_url: null,
            thumbnail_url: null,
            category: 'mobility',
            instructions_norwegian: null,
            completed_today: false,
          },
          {
            enrollment_id: 'enrollment-002',
            current_week: 3,
            current_day: 1,
            program_id: 'prog-002',
            program_name: 'Program B',
            program_name_norwegian: 'Program B',
            week_id: 'w-2',
            focus_area: 'Strength',
            program_exercise_id: 'pe-003',
            sets: 4,
            reps: 8,
            hold_seconds: null,
            rest_seconds: 90,
            rir_target: 3,
            exercise_notes: 'Heavy',
            exercise_id: 'ex-003',
            exercise_name: 'Squat',
            exercise_name_norwegian: 'Knebøy',
            video_url: null,
            thumbnail_url: null,
            category: 'strength',
            instructions_norwegian: null,
            completed_today: false,
          },
        ],
      });

      const result = await getTodayWorkout(MOBILE_USER_ID);

      expect(result.programs).toHaveLength(2);
      expect(result.programs[0].programId).toBe(PROGRAM_ID);
      expect(result.programs[0].exercises).toHaveLength(1);
      expect(result.programs[1].programId).toBe('prog-002');
      expect(result.programs[1].exercises).toHaveLength(1);
    });

    it('should map exercise fields correctly', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            enrollment_id: ENROLLMENT_ID,
            current_week: 1,
            current_day: 1,
            program_id: PROGRAM_ID,
            program_name: 'Test',
            program_name_norwegian: 'Test',
            week_id: 'w-1',
            focus_area: 'Test',
            program_exercise_id: PROGRAM_EXERCISE_ID,
            sets: 3,
            reps: 12,
            hold_seconds: 30,
            rest_seconds: 60,
            rir_target: 2,
            exercise_notes: 'Slow tempo',
            exercise_id: EXERCISE_ID,
            exercise_name: 'Plank',
            exercise_name_norwegian: 'Planke',
            video_url: 'https://vid.example.com/plank.mp4',
            thumbnail_url: 'https://img.example.com/plank.jpg',
            category: 'core',
            instructions_norwegian: 'Hold kroppen rett',
            completed_today: true,
          },
        ],
      });

      const result = await getTodayWorkout(MOBILE_USER_ID);

      const exercise = result.programs[0].exercises[0];
      expect(exercise.programExerciseId).toBe(PROGRAM_EXERCISE_ID);
      expect(exercise.exerciseId).toBe(EXERCISE_ID);
      expect(exercise.name).toBe('Plank');
      expect(exercise.nameNorwegian).toBe('Planke');
      expect(exercise.videoUrl).toBe('https://vid.example.com/plank.mp4');
      expect(exercise.thumbnailUrl).toBe('https://img.example.com/plank.jpg');
      expect(exercise.category).toBe('core');
      expect(exercise.instructions).toBe('Hold kroppen rett');
      expect(exercise.sets).toBe(3);
      expect(exercise.reps).toBe(12);
      expect(exercise.holdSeconds).toBe(30);
      expect(exercise.restSeconds).toBe(60);
      expect(exercise.rirTarget).toBe(2);
      expect(exercise.notes).toBe('Slow tempo');
      expect(exercise.completedToday).toBe(true);
    });
  });

  // ==========================================================================
  // logWorkout
  // ==========================================================================

  describe('logWorkout', () => {
    const workoutData = {
      programExerciseId: PROGRAM_EXERCISE_ID,
      exerciseId: EXERCISE_ID,
      enrollmentId: ENROLLMENT_ID,
      setsCompleted: 3,
      repsCompleted: 12,
      weightKg: 20,
      holdSecondsCompleted: null,
      rirActual: 2,
      painRating: 3,
      difficultyRating: 7,
      sorenessRating: 4,
      notes: 'Felt good',
    };

    it('should insert a workout log and return the created record', async () => {
      const insertedRow = {
        id: 'log-001',
        mobile_user_id: MOBILE_USER_ID,
        ...workoutData,
        completed_at: '2026-03-27T10:00:00Z',
      };

      // First client.query: INSERT workout_log
      mockClientQuery.mockResolvedValueOnce({ rows: [insertedRow] });
      // Second client.query: SELECT user_streaks (updateStreak - no existing streak)
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // Third client.query: INSERT user_streaks (new streak)
      mockClientQuery.mockResolvedValueOnce({ rows: [] });

      const result = await logWorkout(MOBILE_USER_ID, workoutData);

      expect(result).toEqual(insertedRow);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockClientQuery).toHaveBeenCalledTimes(3);

      // Verify INSERT was called with correct params
      const insertCall = mockClientQuery.mock.calls[0];
      expect(insertCall[0]).toContain('INSERT INTO workout_logs');
      expect(insertCall[1]).toEqual([
        MOBILE_USER_ID,
        ENROLLMENT_ID,
        PROGRAM_EXERCISE_ID,
        EXERCISE_ID,
        3, // setsCompleted
        12, // repsCompleted
        20, // weightKg
        null, // holdSecondsCompleted
        2, // rirActual
        3, // painRating
        7, // difficultyRating
        4, // sorenessRating
        'Felt good',
      ]);
    });

    it('should call updateStreak within the transaction', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // updateStreak: existing streak with yesterday's date
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // Insert new streak
      mockClientQuery.mockResolvedValueOnce({ rows: [] });

      await logWorkout(MOBILE_USER_ID, workoutData);

      // Verify streak-related queries were made on the transaction client
      const streakCall = mockClientQuery.mock.calls[1];
      expect(streakCall[0]).toContain('user_streaks');
      expect(streakCall[1]).toEqual([MOBILE_USER_ID]);
    });

    it('should propagate transaction errors', async () => {
      mockTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

      await expect(logWorkout(MOBILE_USER_ID, workoutData)).rejects.toThrow('Transaction failed');
    });
  });

  // ==========================================================================
  // Streak Logic (tested indirectly via logWorkout)
  // ==========================================================================

  describe('Streak tracking (via logWorkout)', () => {
    const workoutData = {
      programExerciseId: PROGRAM_EXERCISE_ID,
      exerciseId: EXERCISE_ID,
      enrollmentId: ENROLLMENT_ID,
      setsCompleted: 3,
      repsCompleted: 10,
      weightKg: null,
      holdSecondsCompleted: null,
      rirActual: null,
      painRating: 2,
      difficultyRating: 5,
      sorenessRating: 3,
      notes: null,
    };

    it('should create a new streak record when none exists', async () => {
      // INSERT workout log
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // SELECT user_streaks - none found
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // INSERT user_streaks
      mockClientQuery.mockResolvedValueOnce({ rows: [] });

      await logWorkout(MOBILE_USER_ID, workoutData);

      const insertStreakCall = mockClientQuery.mock.calls[2];
      expect(insertStreakCall[0]).toContain('INSERT INTO user_streaks');
      expect(insertStreakCall[1][0]).toBe(MOBILE_USER_ID);
      // current_streak and longest_streak should be 1
    });

    it('should not update streak when already logged today', async () => {
      const today = new Date().toISOString().split('T')[0];

      // INSERT workout log
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // SELECT user_streaks - already logged today
      mockClientQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'streak-1',
            mobile_user_id: MOBILE_USER_ID,
            current_streak: 5,
            longest_streak: 10,
            last_workout_date: today,
            streak_start_date: '2026-03-20',
            updated_at: new Date().toISOString(),
          },
        ],
      });

      await logWorkout(MOBILE_USER_ID, workoutData);

      // Only 2 client queries: INSERT log + SELECT streak (no UPDATE)
      expect(mockClientQuery).toHaveBeenCalledTimes(2);
    });

    it('should increment streak when last workout was yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // INSERT workout log
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // SELECT user_streaks
      mockClientQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'streak-1',
            mobile_user_id: MOBILE_USER_ID,
            current_streak: 5,
            longest_streak: 10,
            last_workout_date: yesterdayStr,
            streak_start_date: '2026-03-01',
            updated_at: new Date().toISOString(),
          },
        ],
      });
      // UPDATE user_streaks
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // checkStreakAchievements queries (no milestones met at streak=6)
      // No INSERT for achievements since 6 < 7

      await logWorkout(MOBILE_USER_ID, workoutData);

      const updateCall = mockClientQuery.mock.calls[2];
      expect(updateCall[0]).toContain('UPDATE user_streaks');
      // newStreak = 5 + 1 = 6
      expect(updateCall[1][0]).toBe(6);
      // newLongest = max(6, 10) = 10
      expect(updateCall[1][1]).toBe(10);
    });

    it('should reset streak to 1 when gap is more than one day', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      // INSERT workout log
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // SELECT user_streaks
      mockClientQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'streak-1',
            mobile_user_id: MOBILE_USER_ID,
            current_streak: 15,
            longest_streak: 20,
            last_workout_date: threeDaysAgoStr,
            streak_start_date: '2026-02-15',
            updated_at: new Date().toISOString(),
          },
        ],
      });
      // UPDATE user_streaks
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // No achievement inserts (streak reset to 1, no milestones)

      await logWorkout(MOBILE_USER_ID, workoutData);

      const updateCall = mockClientQuery.mock.calls[2];
      expect(updateCall[0]).toContain('UPDATE user_streaks');
      // newStreak = 1 (reset)
      expect(updateCall[1][0]).toBe(1);
      // newLongest stays at 20
      expect(updateCall[1][1]).toBe(20);
    });

    it('should update longest_streak when current surpasses it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // INSERT workout log
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // SELECT user_streaks - current equals longest
      mockClientQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'streak-1',
            mobile_user_id: MOBILE_USER_ID,
            current_streak: 10,
            longest_streak: 10,
            last_workout_date: yesterdayStr,
            streak_start_date: '2026-03-01',
            updated_at: new Date().toISOString(),
          },
        ],
      });
      // UPDATE user_streaks
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // checkStreakAchievements: streak=11 >= 7 milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [] });

      await logWorkout(MOBILE_USER_ID, workoutData);

      const updateCall = mockClientQuery.mock.calls[2];
      // newStreak = 10 + 1 = 11
      expect(updateCall[1][0]).toBe(11);
      // newLongest = max(11, 10) = 11
      expect(updateCall[1][1]).toBe(11);
    });
  });

  // ==========================================================================
  // Achievements (tested indirectly via logWorkout)
  // ==========================================================================

  describe('Achievement awarding (via logWorkout)', () => {
    const workoutData = {
      programExerciseId: PROGRAM_EXERCISE_ID,
      exerciseId: EXERCISE_ID,
      enrollmentId: ENROLLMENT_ID,
      setsCompleted: 3,
      repsCompleted: 10,
      weightKg: null,
      holdSecondsCompleted: null,
      rirActual: null,
      painRating: 2,
      difficultyRating: 5,
      sorenessRating: 3,
      notes: null,
    };

    it('should award 7-day streak achievement when streak reaches 7', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // INSERT workout log
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // SELECT user_streaks - current is 6
      mockClientQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'streak-1',
            mobile_user_id: MOBILE_USER_ID,
            current_streak: 6,
            longest_streak: 6,
            last_workout_date: yesterdayStr,
            streak_start_date: '2026-03-20',
            updated_at: new Date().toISOString(),
          },
        ],
      });
      // UPDATE user_streaks
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // INSERT achievement for streak_7 milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [] });

      await logWorkout(MOBILE_USER_ID, workoutData);

      // Verify achievement INSERT was called
      const achievementCall = mockClientQuery.mock.calls[3];
      expect(achievementCall[0]).toContain('INSERT INTO user_achievements');
      expect(achievementCall[1]).toContain('streak_7');
      expect(achievementCall[1]).toContain('7-Day Streak');
    });

    it('should award multiple achievements when streak hits higher milestones', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // INSERT workout log
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'log-001' }] });
      // SELECT user_streaks - current is 29, about to become 30
      mockClientQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'streak-1',
            mobile_user_id: MOBILE_USER_ID,
            current_streak: 29,
            longest_streak: 29,
            last_workout_date: yesterdayStr,
            streak_start_date: '2026-02-25',
            updated_at: new Date().toISOString(),
          },
        ],
      });
      // UPDATE user_streaks
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // streak=30 >= 7, 14, 30 milestones => 3 INSERT calls
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // streak_7
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // streak_14
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // streak_30

      await logWorkout(MOBILE_USER_ID, workoutData);

      // 1 insert log + 1 select streak + 1 update streak + 3 achievements = 6
      expect(mockClientQuery).toHaveBeenCalledTimes(6);

      // Verify the three achievement types
      const achievementTypes = [3, 4, 5].map((i) => mockClientQuery.mock.calls[i][1][1]);
      expect(achievementTypes).toContain('streak_7');
      expect(achievementTypes).toContain('streak_14');
      expect(achievementTypes).toContain('streak_30');
    });
  });

  // ==========================================================================
  // getProgress
  // ==========================================================================

  describe('getProgress', () => {
    it('should return progress stats with default 30-day window', async () => {
      // workoutsByDate query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { date: '2026-03-27', workout_count: 3, avg_pain: 2.5, avg_difficulty: 6.0 },
          { date: '2026-03-26', workout_count: 4, avg_pain: 3.0, avg_difficulty: 5.5 },
        ],
      });
      // streak query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'streak-1',
            mobile_user_id: MOBILE_USER_ID,
            current_streak: 5,
            longest_streak: 14,
            last_workout_date: '2026-03-27',
            streak_start_date: '2026-03-23',
            updated_at: '2026-03-27T10:00:00Z',
          },
        ],
      });
      // totalStats query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_workouts: 45, active_days: 20, avg_pain_overall: 2.8 }],
      });

      const result = await getProgress(MOBILE_USER_ID);

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(result.workoutsByDate).toHaveLength(2);
      expect(result.streak.current_streak).toBe(5);
      expect(result.streak.longest_streak).toBe(14);
      expect(result.totalStats.total_workouts).toBe(45);
      // Verify default days parameter is passed as integer
      expect(mockQuery.mock.calls[0][1]).toEqual([MOBILE_USER_ID, 30]);
    });

    it('should accept custom days parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_workouts: 0, active_days: 0, avg_pain_overall: null }],
      });

      const result = await getProgress(MOBILE_USER_ID, 7);

      expect(mockQuery.mock.calls[0][1]).toEqual([MOBILE_USER_ID, 7]);
    });

    it('should return default streak when no streak record exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No streak
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_workouts: 0, active_days: 0, avg_pain_overall: null }],
      });

      const result = await getProgress(MOBILE_USER_ID);

      expect(result.streak).toEqual({ current_streak: 0, longest_streak: 0 });
    });
  });

  // ==========================================================================
  // getAchievements
  // ==========================================================================

  describe('getAchievements', () => {
    it('should return all achievements for user ordered by earned_at DESC', async () => {
      const achievements = [
        {
          id: 'ach-2',
          mobile_user_id: MOBILE_USER_ID,
          achievement_type: 'streak_14',
          achievement_name: '2-Week Streak',
          description: 'Completed 14 consecutive days of workouts!',
          earned_at: '2026-03-27T10:00:00Z',
          metadata: null,
          notified: false,
        },
        {
          id: 'ach-1',
          mobile_user_id: MOBILE_USER_ID,
          achievement_type: 'streak_7',
          achievement_name: '7-Day Streak',
          description: 'Completed 7 consecutive days of workouts!',
          earned_at: '2026-03-20T10:00:00Z',
          metadata: null,
          notified: true,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: achievements });

      const result = await getAchievements(MOBILE_USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0].achievement_type).toBe('streak_14');
      expect(result[1].achievement_type).toBe('streak_7');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM user_achievements'), [
        MOBILE_USER_ID,
      ]);
    });

    it('should return empty array when user has no achievements', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getAchievements(MOBILE_USER_ID);

      expect(result).toEqual([]);
    });
  });
});
