/**
 * Mobile API Routes
 * All endpoints for the ChiroClick mobile app
 */

const express = require('express');
const router = express.Router();
const mobileAuth = require('../services/mobileAuth');
// Logger - noop fallback avoids raw console usage
const noop = () => {};
const fallbackLogger = { info: noop, error: noop, warn: noop, debug: noop };
let logger = fallbackLogger;
try {
  const mod = require('../utils/logger');
  logger = mod.default || mod;
} catch {
  // Logger not available in CJS context; structured logging disabled
}

/**
 * Middleware to verify mobile JWT token
 */
const authenticateMobile = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = mobileAuth.verifyAccessToken(token);

    req.mobileUser = {
      id: decoded.userId,
      phone: decoded.phone,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

/**
 * POST /api/v1/mobile/auth/send-otp
 * Send OTP code to phone number
 */
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await mobileAuth.sendOTP(req.db, phoneNumber);
    res.json(result);
  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/mobile/auth/verify-otp
 * Verify OTP and login/register user
 */
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const result = await mobileAuth.verifyOTP(req.db, phoneNumber, code);
    res.json(result);
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/mobile/auth/google
 * Login with Google
 */
router.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const result = await mobileAuth.verifyGoogleToken(req.db, idToken);
    res.json(result);
  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/mobile/auth/apple
 * Login with Apple
 */
router.post('/auth/apple', async (req, res) => {
  try {
    const { identityToken, user } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: 'Identity token is required' });
    }

    const result = await mobileAuth.verifyAppleToken(req.db, identityToken, user);
    res.json(result);
  } catch (error) {
    logger.error('Apple auth error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/mobile/auth/refresh
 * Refresh access token
 */
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await mobileAuth.refreshAccessToken(req.db, refreshToken);
    res.json(result);
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/v1/mobile/auth/logout
 * Logout (revoke refresh token)
 */
router.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await mobileAuth.revokeToken(req.db, refreshToken);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Logout error:', error);
    res.json({ success: true }); // Always return success for logout
  }
});

// ============================================
// USER PROFILE ROUTES
// ============================================

/**
 * GET /api/v1/mobile/me
 * Get current user profile
 */
router.get('/me', authenticateMobile, async (req, res) => {
  try {
    const user = await mobileAuth.getUserById(req.db, req.mobileUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get streak info
    const streakResult = await req.db.query(
      `
      SELECT * FROM user_streaks WHERE mobile_user_id = $1
    `,
      [req.mobileUser.id]
    );

    const streak = streakResult.rows[0] || { current_streak: 0, longest_streak: 0 };

    res.json({
      ...user,
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PATCH /api/v1/mobile/me
 * Update user profile
 */
router.patch('/me', authenticateMobile, async (req, res) => {
  try {
    const user = await mobileAuth.updateProfile(req.db, req.mobileUser.id, req.body);
    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// DEVICE TOKEN ROUTES (Push Notifications)
// ============================================

/**
 * POST /api/v1/mobile/device-token
 * Register device token for push notifications
 */
router.post('/device-token', authenticateMobile, async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    await mobileAuth.registerDeviceToken(req.db, req.mobileUser.id, token, deviceInfo);
    res.json({ success: true });
  } catch (error) {
    logger.error('Register device token error:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

/**
 * DELETE /api/v1/mobile/device-token
 * Unregister device token
 */
router.delete('/device-token', authenticateMobile, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    await mobileAuth.unregisterDeviceToken(req.db, req.mobileUser.id, token);
    res.json({ success: true });
  } catch (error) {
    logger.error('Unregister device token error:', error);
    res.status(500).json({ error: 'Failed to unregister device token' });
  }
});

// ============================================
// EXERCISE LIBRARY ROUTES
// ============================================

/**
 * GET /api/v1/mobile/exercises
 * Get all exercises (with filtering)
 */
router.get('/exercises', authenticateMobile, async (req, res) => {
  try {
    const { category, bodyRegion, difficulty, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        id, name, name_norwegian, description, description_norwegian,
        category, subcategory, body_region, difficulty_level,
        instructions, instructions_norwegian,
        sets_default, reps_default, hold_seconds,
        video_url, thumbnail_url, image_url,
        tags
      FROM exercise_library
      WHERE is_active = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (bodyRegion) {
      query += ` AND body_region = $${paramIndex}`;
      params.push(bodyRegion);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty_level = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        name ILIKE $${paramIndex} OR
        name_norwegian ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex} OR
        description_norwegian ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY name_norwegian, name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await req.db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM exercise_library WHERE is_active = TRUE`;
    // Add same filters for count...

    res.json({
      exercises: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    logger.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to get exercises' });
  }
});

/**
 * GET /api/v1/mobile/exercises/:id
 * Get single exercise details
 */
router.get('/exercises/:id', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(
      `
      SELECT * FROM exercise_library
      WHERE id = $1 AND is_active = TRUE
    `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get exercise error:', error);
    res.status(500).json({ error: 'Failed to get exercise' });
  }
});

/**
 * GET /api/v1/mobile/exercises/categories
 * Get exercise categories
 */
router.get('/exercise-categories', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM exercise_library
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY category
    `);

    res.json(result.rows);
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// ============================================
// PROGRAM ROUTES
// ============================================

/**
 * GET /api/v1/mobile/programs
 * Get available programs
 */
router.get('/programs', authenticateMobile, async (req, res) => {
  try {
    const { type, difficulty, search } = req.query;

    let query = `
      SELECT
        p.*,
        u.first_name || ' ' || u.last_name as created_by_name,
        (SELECT COUNT(*) FROM user_program_enrollments WHERE program_id = p.id) as enrollment_count
      FROM coaching_programs p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.is_active = TRUE AND p.is_public = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND p.program_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND p.difficulty_level = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.name_norwegian ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await req.db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

/**
 * GET /api/v1/mobile/programs/:id
 * Get program details with weeks and exercises
 */
router.get('/programs/:id', authenticateMobile, async (req, res) => {
  try {
    // Get program
    const programResult = await req.db.query(
      `
      SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name
      FROM coaching_programs p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.id = $1 AND p.is_active = TRUE
    `,
      [req.params.id]
    );

    if (programResult.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const program = programResult.rows[0];

    // Get weeks with exercises
    const weeksResult = await req.db.query(
      `
      SELECT
        pw.*,
        json_agg(
          json_build_object(
            'id', pe.id,
            'exerciseId', pe.exercise_id,
            'dayOfWeek', pe.day_of_week,
            'orderIndex', pe.order_index,
            'sets', pe.sets,
            'reps', pe.reps,
            'holdSeconds', pe.hold_seconds,
            'restSeconds', pe.rest_seconds,
            'rirTarget', pe.rir_target,
            'notes', pe.notes,
            'exercise', json_build_object(
              'id', e.id,
              'name', e.name,
              'nameNorwegian', e.name_norwegian,
              'videoUrl', e.video_url,
              'thumbnailUrl', e.thumbnail_url,
              'category', e.category
            )
          ) ORDER BY pe.day_of_week, pe.order_index
        ) FILTER (WHERE pe.id IS NOT NULL) as exercises
      FROM program_weeks pw
      LEFT JOIN program_exercises pe ON pe.program_week_id = pw.id
      LEFT JOIN exercise_library e ON e.id = pe.exercise_id
      WHERE pw.program_id = $1
      GROUP BY pw.id
      ORDER BY pw.week_number
    `,
      [req.params.id]
    );

    // Check if user is enrolled
    const enrollmentResult = await req.db.query(
      `
      SELECT * FROM user_program_enrollments
      WHERE mobile_user_id = $1 AND program_id = $2 AND status = 'active'
    `,
      [req.mobileUser.id, req.params.id]
    );

    res.json({
      ...program,
      weeks: weeksResult.rows,
      isEnrolled: enrollmentResult.rows.length > 0,
      enrollment: enrollmentResult.rows[0] || null,
    });
  } catch (error) {
    logger.error('Get program error:', error);
    res.status(500).json({ error: 'Failed to get program' });
  }
});

/**
 * POST /api/v1/mobile/programs/:id/enroll
 * Enroll in a program
 */
router.post('/programs/:id/enroll', authenticateMobile, async (req, res) => {
  try {
    // Check if already enrolled
    const existingResult = await req.db.query(
      `
      SELECT * FROM user_program_enrollments
      WHERE mobile_user_id = $1 AND program_id = $2 AND status = 'active'
    `,
      [req.mobileUser.id, req.params.id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this program' });
    }

    // Create enrollment
    const result = await req.db.query(
      `
      INSERT INTO user_program_enrollments (mobile_user_id, program_id)
      VALUES ($1, $2)
      RETURNING *
    `,
      [req.mobileUser.id, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in program' });
  }
});

/**
 * GET /api/v1/mobile/my-programs
 * Get user's enrolled programs
 */
router.get('/my-programs', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(
      `
      SELECT
        e.*,
        p.name, p.name_norwegian, p.description, p.description_norwegian,
        p.program_type, p.duration_weeks, p.difficulty_level, p.cover_image_url
      FROM user_program_enrollments e
      JOIN coaching_programs p ON p.id = e.program_id
      WHERE e.mobile_user_id = $1
      ORDER BY e.status = 'active' DESC, e.started_at DESC
    `,
      [req.mobileUser.id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get my programs error:', error);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

// ============================================
// TODAY'S WORKOUT ROUTES
// ============================================

/**
 * GET /api/v1/mobile/today
 * Get today's workout based on active programs
 */
router.get('/today', authenticateMobile, async (req, res) => {
  try {
    const dayOfWeek = new Date().getDay() || 7; // 1-7 (Monday-Sunday)

    // Get active enrollments with today's exercises
    const result = await req.db.query(
      `
      SELECT
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
      ORDER BY p.name, pe.order_index
    `,
      [req.mobileUser.id, dayOfWeek]
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

    res.json({
      date: new Date().toISOString().split('T')[0],
      dayOfWeek,
      programs: Array.from(programsMap.values()),
    });
  } catch (error) {
    logger.error('Get today error:', error);
    res.status(500).json({ error: 'Failed to get today workout' });
  }
});

// ============================================
// WORKOUT LOGGING ROUTES
// ============================================

/**
 * POST /api/v1/mobile/log
 * Log a completed exercise
 */
router.post('/log', authenticateMobile, async (req, res) => {
  try {
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
    } = req.body;

    const result = await req.db.query(
      `
      INSERT INTO workout_logs (
        mobile_user_id, enrollment_id, program_exercise_id, exercise_id,
        sets_completed, reps_completed, weight_kg, hold_seconds_completed,
        rir_actual, pain_rating, difficulty_rating, soreness_rating, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [
        req.mobileUser.id,
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
    await updateStreak(req.db, req.mobileUser.id);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Log workout error:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

/**
 * GET /api/v1/mobile/progress
 * Get user progress statistics
 */
router.get('/progress', authenticateMobile, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get workout counts by date
    const workoutsByDate = await req.db.query(
      `
      SELECT
        DATE(completed_at) as date,
        COUNT(*) as workout_count,
        AVG(pain_rating) as avg_pain,
        AVG(difficulty_rating) as avg_difficulty
      FROM workout_logs
      WHERE mobile_user_id = $1
      AND completed_at > NOW() - make_interval(days => $2)
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `,
      [req.mobileUser.id, parseInt(days)]
    );

    // Get streak info
    const streakResult = await req.db.query(
      `
      SELECT * FROM user_streaks WHERE mobile_user_id = $1
    `,
      [req.mobileUser.id]
    );

    // Get total stats
    const totalStats = await req.db.query(
      `
      SELECT
        COUNT(*) as total_workouts,
        COUNT(DISTINCT DATE(completed_at)) as active_days,
        AVG(pain_rating) as avg_pain_overall
      FROM workout_logs
      WHERE mobile_user_id = $1
    `,
      [req.mobileUser.id]
    );

    res.json({
      streak: streakResult.rows[0] || { current_streak: 0, longest_streak: 0 },
      workoutsByDate: workoutsByDate.rows,
      totalStats: totalStats.rows[0],
    });
  } catch (error) {
    logger.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * GET /api/v1/mobile/achievements
 * Get user achievements
 */
router.get('/achievements', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(
      `
      SELECT * FROM user_achievements
      WHERE mobile_user_id = $1
      ORDER BY earned_at DESC
    `,
      [req.mobileUser.id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// ============================================
// SOCIAL LINKS ROUTES
// ============================================

/**
 * GET /api/v1/mobile/social-links
 * Get clinician social links
 */
router.get('/social-links', authenticateMobile, async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT
        sl.*,
        u.first_name || ' ' || u.last_name as clinician_name
      FROM social_links sl
      JOIN users u ON u.id = sl.user_id
      WHERE sl.is_public = TRUE
      ORDER BY u.first_name, sl.platform
    `);

    // Group by clinician
    const cliniciansMap = new Map();
    for (const row of result.rows) {
      if (!cliniciansMap.has(row.user_id)) {
        cliniciansMap.set(row.user_id, {
          userId: row.user_id,
          name: row.clinician_name,
          links: [],
        });
      }
      cliniciansMap.get(row.user_id).links.push({
        platform: row.platform,
        url: row.profile_url,
        displayName: row.display_name,
      });
    }

    res.json(Array.from(cliniciansMap.values()));
  } catch (error) {
    logger.error('Get social links error:', error);
    res.status(500).json({ error: 'Failed to get social links' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update user streak after logging workout
 */
async function updateStreak(db, userId) {
  const today = new Date().toISOString().split('T')[0];

  // Get current streak info
  const streakResult = await db.query(
    `
    SELECT * FROM user_streaks WHERE mobile_user_id = $1
  `,
    [userId]
  );

  if (streakResult.rows.length === 0) {
    // Initialize streak
    await db.query(
      `
      INSERT INTO user_streaks (mobile_user_id, current_streak, longest_streak, last_workout_date, streak_start_date)
      VALUES ($1, 1, 1, $2, $2)
    `,
      [userId, today]
    );
    return;
  }

  const streak = streakResult.rows[0];
  const lastWorkout = streak.last_workout_date
    ? new Date(streak.last_workout_date).toISOString().split('T')[0]
    : null;

  if (lastWorkout === today) {
    // Already worked out today
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak, newLongest, streakStart;

  if (lastWorkout === yesterdayStr) {
    // Continuing streak
    newStreak = streak.current_streak + 1;
    newLongest = Math.max(newStreak, streak.longest_streak);
    streakStart = streak.streak_start_date;
  } else {
    // Streak broken, start new
    newStreak = 1;
    newLongest = streak.longest_streak;
    streakStart = today;
  }

  await db.query(
    `
    UPDATE user_streaks
    SET current_streak = $1, longest_streak = $2, last_workout_date = $3, streak_start_date = $4, updated_at = NOW()
    WHERE mobile_user_id = $5
  `,
    [newStreak, newLongest, today, streakStart, userId]
  );

  // Check for streak achievements
  await checkStreakAchievements(db, userId, newStreak);
}

/**
 * Check and award streak achievements
 */
async function checkStreakAchievements(db, userId, streak) {
  const milestones = [
    { days: 7, type: 'streak_7', name: '7-Day Streak' },
    { days: 14, type: 'streak_14', name: '2-Week Streak' },
    { days: 30, type: 'streak_30', name: 'Monthly Master' },
    { days: 60, type: 'streak_60', name: '2-Month Champion' },
    { days: 100, type: 'streak_100', name: 'Century Streak' },
  ];

  for (const milestone of milestones) {
    if (streak >= milestone.days) {
      await db.query(
        `
        INSERT INTO user_achievements (mobile_user_id, achievement_type, achievement_name, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (mobile_user_id, achievement_type, achievement_name) DO NOTHING
      `,
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

module.exports = router;
