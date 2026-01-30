/**
 * Mobile App Database Migration
 * Creates tables for mobile user authentication, coaching programs, and workout tracking
 */

const up = `
-- Mobile users (patients with phone auth)
CREATE TABLE IF NOT EXISTS mobile_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  google_id VARCHAR(255) UNIQUE,
  apple_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  device_tokens TEXT[] DEFAULT '{}',
  preferred_language VARCHAR(10) DEFAULT 'no',
  notification_time TIME DEFAULT '08:00',
  notification_enabled BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) DEFAULT 'Europe/Oslo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_phone CHECK (phone_number ~ '^\\+[0-9]{8,15}$')
);

-- OTP verification codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

-- Coaching programs (templates)
CREATE TABLE IF NOT EXISTS coaching_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_norwegian VARCHAR(200),
  description TEXT,
  description_norwegian TEXT,
  program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('rehabilitation', 'hypertrophy', 'strength', 'mobility', 'vestibular')),
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0 AND duration_weeks <= 52),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Program weeks with daily schedules
CREATE TABLE IF NOT EXISTS program_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES coaching_programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  focus_area VARCHAR(100),
  notes TEXT,
  notes_norwegian TEXT,
  is_deload BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, week_number)
);

-- Program exercises per week/day
CREATE TABLE IF NOT EXISTS program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_week_id UUID NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  order_index INTEGER NOT NULL DEFAULT 0,
  sets INTEGER CHECK (sets > 0),
  reps VARCHAR(20), -- "8-12" or "10" or "AMRAP"
  hold_seconds INTEGER CHECK (hold_seconds >= 0),
  rest_seconds INTEGER DEFAULT 60 CHECK (rest_seconds >= 0),
  rir_target INTEGER CHECK (rir_target >= 0 AND rir_target <= 5), -- Reps in Reserve
  notes TEXT,
  notes_norwegian TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User program enrollments
CREATE TABLE IF NOT EXISTS user_program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES coaching_programs(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id), -- clinician (null if self-enrolled)
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_week INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  paused_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mobile_user_id, program_id, started_at)
);

-- Workout logs (daily completions)
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES user_program_enrollments(id) ON DELETE SET NULL,
  program_exercise_id UUID REFERENCES program_exercises(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_kg DECIMAL(6,2),
  hold_seconds_completed INTEGER,
  rir_actual INTEGER CHECK (rir_actual >= 0 AND rir_actual <= 10),
  pain_rating INTEGER CHECK (pain_rating >= 0 AND pain_rating <= 10),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  soreness_rating INTEGER CHECK (soreness_rating >= 1 AND soreness_rating <= 5),
  notes TEXT,
  synced_at TIMESTAMP WITH TIME ZONE, -- For offline sync tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User streaks and achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  notified BOOLEAN DEFAULT FALSE,
  UNIQUE(mobile_user_id, achievement_type, achievement_name)
);

-- User streaks tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  streak_start_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mobile_user_id)
);

-- Social links for clinicians
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter', 'website')),
  profile_url TEXT NOT NULL,
  display_name VARCHAR(100),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Mobile refresh tokens
CREATE TABLE IF NOT EXISTS mobile_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mobile_users_phone ON mobile_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_mobile_users_google ON mobile_users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mobile_users_apple ON mobile_users(apple_id) WHERE apple_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone_number, expires_at);
CREATE INDEX IF NOT EXISTS idx_coaching_programs_org ON coaching_programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_coaching_programs_type ON coaching_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_program_weeks_program ON program_weeks(program_id);
CREATE INDEX IF NOT EXISTS idx_program_exercises_week ON program_exercises(program_week_id);
CREATE INDEX IF NOT EXISTS idx_program_exercises_day ON program_exercises(program_week_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON user_program_enrollments(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON user_program_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(mobile_user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_social_links_user ON social_links(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON mobile_refresh_tokens(mobile_user_id);

-- Full-text search for programs
CREATE INDEX IF NOT EXISTS idx_programs_search ON coaching_programs USING gin(
  to_tsvector('norwegian', coalesce(name, '') || ' ' || coalesce(name_norwegian, '') || ' ' || coalesce(description, ''))
);
`;

const down = `
DROP INDEX IF EXISTS idx_programs_search;
DROP INDEX IF EXISTS idx_refresh_tokens_user;
DROP INDEX IF EXISTS idx_social_links_user;
DROP INDEX IF EXISTS idx_streaks_user;
DROP INDEX IF EXISTS idx_achievements_user;
DROP INDEX IF EXISTS idx_workout_logs_date;
DROP INDEX IF EXISTS idx_workout_logs_user;
DROP INDEX IF EXISTS idx_enrollments_status;
DROP INDEX IF EXISTS idx_enrollments_user;
DROP INDEX IF EXISTS idx_program_exercises_day;
DROP INDEX IF EXISTS idx_program_exercises_week;
DROP INDEX IF EXISTS idx_program_weeks_program;
DROP INDEX IF EXISTS idx_coaching_programs_type;
DROP INDEX IF EXISTS idx_coaching_programs_org;
DROP INDEX IF EXISTS idx_otp_codes_phone;
DROP INDEX IF EXISTS idx_mobile_users_apple;
DROP INDEX IF EXISTS idx_mobile_users_google;
DROP INDEX IF EXISTS idx_mobile_users_phone;

DROP TABLE IF EXISTS mobile_refresh_tokens;
DROP TABLE IF EXISTS social_links;
DROP TABLE IF EXISTS user_streaks;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS workout_logs;
DROP TABLE IF EXISTS user_program_enrollments;
DROP TABLE IF EXISTS program_exercises;
DROP TABLE IF EXISTS program_weeks;
DROP TABLE IF EXISTS coaching_programs;
DROP TABLE IF EXISTS otp_codes;
DROP TABLE IF EXISTS mobile_users;
`;

module.exports = { up, down };
