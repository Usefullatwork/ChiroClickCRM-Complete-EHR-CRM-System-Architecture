/**
 * Mobile Workouts Service
 * Business logic for daily workouts, logging, progress, streaks, and achievements
 */

import { query } from '../config/database.js';

/**
 * Get today's workout across all active enrollments
 * @param {string} mobileUserId - Mobile user UUID
 * @returns {object} { date, dayOfWeek, programs[] }
 */
export async function getTodayWorkout(mobileUserId) {
  const dayOfWeek = new Date().getDay() || 7; // 1-7 (Monday-Sunday)

  const result = await query(
    `SELECT
      e.id as enrollment_id,
      e.current_week,
      e.current_day,
      p.id as program_id,
      p.name as program_name,
      p.name_norwegian as program_name_norwegian,
      pw.id as week_id,
      pw.focus_area,
      pe.id as program_exercise_id,
      pe.sets,
      pe.reps,
      pe.hold_seconds,
      pe.rest_seconds,
      pe.rir_target,
      pe.notes as exercise_notes,
      ex.id as exercise_id,
      ex.name as exercise_name,
      ex.name_norwegian as exercise_name_norwegian,
      ex.video_url,
      ex.thumbnail_url,
      ex.category,
      ex.instructions_norwegian,
      (
        SELECT COUNT(*) FROM workout_logs wl
        WHERE wl.program_exercise_id = pe.id
        AND wl.mobile_user_id = $1
        AND DATE(wl.completed_at) = CURRENT_DATE
      ) > 0 as completed_today
    FROM user_program_enrollments e
    JOIN coaching_programs p ON p.id = e.program_id
    JOIN program_weeks pw ON pw.program_id = p.id AND pw.week_number = e.current_week
    JOIN program_exercises pe ON pe.program_week_id = pw.id AND pe.day_of_week = $2
    JOIN exercise_library ex ON ex.id = pe.exercise_id
    WHERE e.mobile_user_id = $1 AND e.status = 'active'
    ORDER BY p.name, pe.order_index`,
    [mobileUserId, dayOfWeek]
  );

  // Group by program
  const programsMap = new Map();
  for (const row of result.rows) {
    if (!programsMap.has(row.program_id)) {
      programsMap.set(row.program_id, {
        programId: row.program_id,
        programName: row.program_name,
        programNameNorwegian: row.program_name_norwegian,
        enrollmentId: row.enrollment_id,
        currentWeek: row.current_week,
        weekFocus: row.focus_area,
        exercises: [],
      });
    }
    programsMap.get(row.program_id).exercises.push({
      programExerciseId: row.program_exercise_id,
      exerciseId: row.exercise_id,
      name: row.exercise_name,
      nameNorwegian: row.exercise_name_norwegian,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      category: row.category,
      instructions: row.instructions_norwegian,
      sets: row.sets,
      reps: row.reps,
      holdSeconds: row.hold_seconds,
      restSeconds: row.rest_seconds,
      rirTarget: row.rir_target,
      notes: row.exercise_notes,
      completedToday: row.completed_today,
    });
  }

  return {
    date: new Date().toISOString().split('T')[0],
    dayOfWeek,
    programs: Array.from(programsMap.values()),
  };
}

/**
 * Log a completed exercise set
 * @param {string} mobileUserId - Mobile user UUID
 * @param {object} workoutData - Exercise log data
 * @returns {object} The created workout log record
 */
export async function logWorkout(mobileUserId, workoutData) {
  const {
    programExerciseId,
    exerciseId,
    enrollmentId,
    setsCompleted,
    repsCompleted,
    weightKg,
    holdSecondsCompleted,
    rirActual,
    painRating,
    difficultyRating,
    sorenessRating,
    notes,
  } = workoutData;

  const result = await query(
    `INSERT INTO workout_logs (
      mobile_user_id, enrollment_id, program_exercise_id, exercise_id,
      sets_completed, reps_completed, weight_kg, hold_seconds_completed,
      rir_actual, pain_rating, difficulty_rating, soreness_rating, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      mobileUserId,
      enrollmentId,
      programExerciseId,
      exerciseId,
      setsCompleted,
      repsCompleted,
      weightKg,
      holdSecondsCompleted,
      rirActual,
      painRating,
      difficultyRating,
      sorenessRating,
      notes,
    ]
  );

  // Update streak
  await updateStreak(mobileUserId);

  return result.rows[0];
}

/**
 * Get user progress statistics
 * @param {string} mobileUserId - Mobile user UUID
 * @param {number} days - Number of past days to include
 * @returns {object} { streak, workoutsByDate, totalStats }
 */
export async function getProgress(mobileUserId, days = 30) {
  const workoutsByDate = await query(
    `SELECT
      DATE(completed_at) as date,
      COUNT(*) as workout_count,
      AVG(pain_rating) as avg_pain,
      AVG(difficulty_rating) as avg_difficulty
    FROM workout_logs
    WHERE mobile_user_id = $1
    AND completed_at > NOW() - make_interval(days => $2)
    GROUP BY DATE(completed_at)
    ORDER BY date DESC`,
    [mobileUserId, parseInt(days)]
  );

  const streakResult = await query(`SELECT * FROM user_streaks WHERE mobile_user_id = $1`, [
    mobileUserId,
  ]);

  const totalStats = await query(
    `SELECT
      COUNT(*) as total_workouts,
      COUNT(DISTINCT DATE(completed_at)) as active_days,
      AVG(pain_rating) as avg_pain_overall
    FROM workout_logs
    WHERE mobile_user_id = $1`,
    [mobileUserId]
  );

  return {
    streak: streakResult.rows[0] || { current_streak: 0, longest_streak: 0 },
    workoutsByDate: workoutsByDate.rows,
    totalStats: totalStats.rows[0],
  };
}

/**
 * Get user achievements
 * @param {string} mobileUserId - Mobile user UUID
 * @returns {Array} Array of achievement records
 */
export async function getAchievements(mobileUserId) {
  const result = await query(
    `SELECT * FROM user_achievements
     WHERE mobile_user_id = $1
     ORDER BY earned_at DESC`,
    [mobileUserId]
  );
  return result.rows;
}

/**
 * Update user streak after logging workout
 */
async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];

  const streakResult = await query(`SELECT * FROM user_streaks WHERE mobile_user_id = $1`, [
    userId,
  ]);

  if (streakResult.rows.length === 0) {
    await query(
      `INSERT INTO user_streaks (mobile_user_id, current_streak, longest_streak, last_workout_date, streak_start_date)
       VALUES ($1, 1, 1, $2, $2)`,
      [userId, today]
    );
    return;
  }

  const streak = streakResult.rows[0];
  const lastWorkout = streak.last_workout_date
    ? new Date(streak.last_workout_date).toISOString().split('T')[0]
    : null;

  if (lastWorkout === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak, newLongest, streakStart;

  if (lastWorkout === yesterdayStr) {
    newStreak = streak.current_streak + 1;
    newLongest = Math.max(newStreak, streak.longest_streak);
    streakStart = streak.streak_start_date;
  } else {
    newStreak = 1;
    newLongest = streak.longest_streak;
    streakStart = today;
  }

  await query(
    `UPDATE user_streaks
     SET current_streak = $1, longest_streak = $2, last_workout_date = $3, streak_start_date = $4, updated_at = NOW()
     WHERE mobile_user_id = $5`,
    [newStreak, newLongest, today, streakStart, userId]
  );

  await checkStreakAchievements(userId, newStreak);
}

/**
 * Check and award streak achievements
 */
async function checkStreakAchievements(userId, streak) {
  const milestones = [
    { days: 7, type: 'streak_7', name: '7-Day Streak' },
    { days: 14, type: 'streak_14', name: '2-Week Streak' },
    { days: 30, type: 'streak_30', name: 'Monthly Master' },
    { days: 60, type: 'streak_60', name: '2-Month Champion' },
    { days: 100, type: 'streak_100', name: 'Century Streak' },
  ];

  for (const milestone of milestones) {
    if (streak >= milestone.days) {
      await query(
        `INSERT INTO user_achievements (mobile_user_id, achievement_type, achievement_name, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (mobile_user_id, achievement_type, achievement_name) DO NOTHING`,
        [
          userId,
          milestone.type,
          milestone.name,
          `Completed ${milestone.days} consecutive days of workouts!`,
        ]
      );
    }
  }
}
