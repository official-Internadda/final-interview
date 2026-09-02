-- InternAdda SQL Schema for Supabase Postgres
-- Run this script in your Supabase SQL Editor to set up all tables and initial admin user

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    duration_minutes INTEGER DEFAULT 15,
    num_questions INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Candidate Attempts Table
CREATE TABLE IF NOT EXISTS candidate_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    score_percentage NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('passed', 'failed', 'disqualified', 'in_progress')),
    fraud_flags JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Question Logs Table
CREATE TABLE IF NOT EXISTS question_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES candidate_attempts(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    candidate_answer TEXT,
    ai_feedback TEXT,
    score NUMERIC DEFAULT 0,
    max_score NUMERIC DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_attempts_interview_id ON candidate_attempts(interview_id);
CREATE INDEX IF NOT EXISTS idx_question_logs_attempt_id ON question_logs(attempt_id);

-- Default Admin Seeding (Username: upforge | Password: Upforge@24/7)
INSERT INTO admins (username, password_hash)
VALUES ('upforge', '$2b$10$LpealkVv3XKyOpVhI8vPRum7Vbnxce/lVVi2sRH2efh.HyLdDOV2C')
ON CONFLICT (username) DO NOTHING;
