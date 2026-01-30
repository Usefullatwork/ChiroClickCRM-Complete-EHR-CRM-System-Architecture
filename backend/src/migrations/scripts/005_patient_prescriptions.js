/**
 * Migration: Patient Exercise Prescriptions
 * Adds tables for exercise prescriptions, logs, and programs
 */

export const up = async (client) => {
  await client.query(`
    -- Create patient exercise prescriptions table
    CREATE TABLE IF NOT EXISTS patient_exercise_prescriptions (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      exercise_id INTEGER REFERENCES exercise_library(id) ON DELETE SET NULL,
      prescribed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      hold_seconds INTEGER,
      frequency VARCHAR(50) DEFAULT 'daily',
      duration_weeks INTEGER DEFAULT 4,
      notes TEXT,
      is_active BOOLEAN DEFAULT true,
      prescribed_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    );

    -- Indexes for prescription queries
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id
    ON patient_exercise_prescriptions(patient_id);

    CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_by
    ON patient_exercise_prescriptions(prescribed_by);

    CREATE INDEX IF NOT EXISTS idx_prescriptions_active
    ON patient_exercise_prescriptions(is_active) WHERE is_active = true;

    CREATE INDEX IF NOT EXISTS idx_prescriptions_expires
    ON patient_exercise_prescriptions(expires_at) WHERE expires_at IS NOT NULL;

    -- Create patient exercise logs table
    CREATE TABLE IF NOT EXISTS patient_exercise_logs (
      id SERIAL PRIMARY KEY,
      prescription_id INTEGER REFERENCES patient_exercise_prescriptions(id) ON DELETE CASCADE,
      completed_at TIMESTAMP DEFAULT NOW(),
      pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
      difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
      notes TEXT
    );

    -- Indexes for log queries
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_prescription
    ON patient_exercise_logs(prescription_id);

    CREATE INDEX IF NOT EXISTS idx_exercise_logs_completed
    ON patient_exercise_logs(completed_at DESC);

    -- Create prescription programs table
    CREATE TABLE IF NOT EXISTS prescription_programs (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_template BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Indexes for program queries
    CREATE INDEX IF NOT EXISTS idx_programs_organization
    ON prescription_programs(organization_id);

    CREATE INDEX IF NOT EXISTS idx_programs_template
    ON prescription_programs(is_template) WHERE is_template = true;

    CREATE INDEX IF NOT EXISTS idx_programs_created_by
    ON prescription_programs(created_by);

    -- Create prescription program exercises table
    CREATE TABLE IF NOT EXISTS prescription_program_exercises (
      id SERIAL PRIMARY KEY,
      program_id INTEGER REFERENCES prescription_programs(id) ON DELETE CASCADE,
      exercise_id INTEGER REFERENCES exercise_library(id) ON DELETE CASCADE,
      order_index INTEGER,
      sets INTEGER,
      reps INTEGER,
      notes TEXT
    );

    -- Indexes for program exercises
    CREATE INDEX IF NOT EXISTS idx_program_exercises_program
    ON prescription_program_exercises(program_id);

    CREATE INDEX IF NOT EXISTS idx_program_exercises_order
    ON prescription_program_exercises(program_id, order_index);

    -- Comments for documentation
    COMMENT ON TABLE patient_exercise_prescriptions IS 'Stores exercise prescriptions assigned to patients';
    COMMENT ON TABLE patient_exercise_logs IS 'Tracks patient completion of prescribed exercises';
    COMMENT ON TABLE prescription_programs IS 'Reusable exercise program templates';
    COMMENT ON TABLE prescription_program_exercises IS 'Exercises within a prescription program';
  `);
};

export const down = async (client) => {
  await client.query(`
    -- Drop tables in reverse order due to foreign key constraints
    DROP TABLE IF EXISTS prescription_program_exercises;
    DROP TABLE IF EXISTS prescription_programs;
    DROP TABLE IF EXISTS patient_exercise_logs;
    DROP TABLE IF EXISTS patient_exercise_prescriptions;
  `);
};
