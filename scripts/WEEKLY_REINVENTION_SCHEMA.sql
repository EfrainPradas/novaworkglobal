-- ============================================================================
-- SPRINT 10: WEEKLY REINVENTION CYCLE
-- ============================================================================

-- Weekly Goals Table
CREATE TABLE weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Start of the week (Monday)
  goal_1 TEXT,
  goal_1_priority INTEGER DEFAULT 1, -- 1-10 priority
  goal_1_category TEXT, -- job_search, learning, networking, applications, interviews
  goal_2 TEXT,
  goal_2_priority INTEGER DEFAULT 1,
  goal_2_category TEXT,
  goal_3 TEXT,
  goal_3_priority INTEGER DEFAULT 1,
  goal_3_category TEXT,
  goal_4 TEXT,
  goal_4_priority INTEGER DEFAULT 1,
  goal_4_category TEXT,
  goal_5 TEXT,
  goal_5_priority INTEGER DEFAULT 1,
  goal_5_category TEXT,
  overall_focus TEXT, -- Main theme for the week
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

COMMENT ON TABLE weekly_goals IS 'Weekly goal setting for Monday ritual';
COMMENT ON COLUMN weekly_goals.week_start_date IS 'Monday date for the week';
COMMENT ON COLUMN weekly_goals.goal_1_category IS 'Categories: job_search, learning, networking, applications, interviews, personal_brand';

-- Weekly Progress Tracking
CREATE TABLE weekly_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE REFERENCES weekly_goals(week_start_date),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  goal_id INTEGER CHECK (goal_id BETWEEN 1 AND 5),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  progress_notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date, day_of_week, goal_id)
);

COMMENT ON TABLE weekly_progress IS 'Daily progress tracking for weekly goals';

-- Friday Reflection Table
CREATE TABLE friday_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE REFERENCES weekly_goals(week_start_date),
  overall_week_rating INTEGER CHECK (overall_week_rating BETWEEN 1 AND 10), -- 1=terrible, 10=amazing
  wins TEXT[], -- Array of accomplishments this week
  challenges TEXT[], -- Array of obstacles faced
  lessons_learned TEXT[], -- Key insights from the week
  sentiment_analysis JSONB, -- AI-analyzed sentiment data
  next_week_focus TEXT, -- What to focus on next week
  gratitude_notes TEXT, -- What they're grateful for
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

COMMENT ON TABLE friday_reflections IS 'Friday ritual reflections and sentiment analysis';
COMMENT ON COLUMN friday_reflections.sentiment_analysis IS 'AI-powered sentiment analysis results';

-- Gamification: Streaks & Badges
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_goal_streak INTEGER DEFAULT 0, -- Consecutive weeks with goals set
  current_reflection_streak INTEGER DEFAULT 0, -- Consecutive weeks with reflections
  longest_goal_streak INTEGER DEFAULT 0,
  longest_reflection_streak INTEGER DEFAULT 0,
  total_weeks_completed INTEGER DEFAULT 0,
  last_goal_date DATE,
  last_reflection_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_streaks IS 'Gamification: Track user streaks and consistency';

-- Badges System
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_code TEXT UNIQUE NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT, -- Emoji or icon name
  badge_category TEXT, -- consistency, achievement, milestone, special
  criteria JSONB, -- Rules to earn this badge
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE badges IS 'Gamification badges and achievements';

-- User Badges Earned
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

COMMENT ON TABLE user_badges IS 'Badges earned by users';

-- Insert initial badges
INSERT INTO badges (badge_code, badge_name, badge_description, badge_icon, badge_category, criteria) VALUES
('first_week', 'First Week', 'Completed your first weekly goal setting cycle', '🎯', 'milestone', '{"type": "weekly_goals", "count": 1}'),
('week_streak_4', 'Monthly Consistency', '4 consecutive weeks of goal setting', '🔥', 'consistency', '{"type": "goal_streak", "count": 4}'),
('week_streak_12', 'Quarter Master', '12 consecutive weeks of goal setting', '💪', 'consistency', '{"type": "goal_streak", "count": 12}'),
('reflection_pro', 'Self-Aware', 'Completed 10 Friday reflections', '🧠', 'achievement', '{"type": "reflections", "count": 10}'),
('goal_crusher', 'Goal Crusher', 'Achieved 90%+ goal completion rate for a week', '⚡', 'achievement', '{"type": "completion_rate", "threshold": 90}'),
('perfect_week', 'Perfect Week', '100% goal completion in a week', '💯', 'achievement', '{"type": "completion_rate", "threshold": 100}'),
('early_bird', 'Early Bird', 'Set Monday goals before 9 AM for 4 weeks', '🐦', 'consistency', '{"type": "early_goals", "time": "09:00", "count": 4}'),
('sentiment_master', 'Emotionally Intelligent', 'Complete 20 sentiment-analyzed reflections', '📊', 'achievement', '{"type": "sentiment_analysis", "count": 20}');

-- Indexes for performance
CREATE INDEX idx_weekly_goals_user_week ON weekly_goals(user_id, week_start_date);
CREATE INDEX idx_weekly_progress_user_week ON weekly_progress(user_id, week_start_date);
CREATE INDEX idx_friday_reflections_user_week ON friday_reflections(user_id, week_start_date);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);