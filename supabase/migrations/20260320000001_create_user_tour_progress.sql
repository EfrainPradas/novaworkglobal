-- Migration: Create user tour progress table
-- Purpose: Track user's tour completion status per page/tour

CREATE TABLE IF NOT EXISTS user_tour_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    current_step INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    CONSTRAINT unique_user_tour UNIQUE (user_id, tour_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_user_id ON user_tour_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_tour_id ON user_tour_progress(tour_id);
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_status ON user_tour_progress(status);

-- Enable RLS
ALTER TABLE user_tour_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tour progress"
    ON user_tour_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tour progress"
    ON user_tour_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour progress"
    ON user_tour_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_user_tour_progress_updated_at
    BEFORE UPDATE ON user_tour_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
