# Weekly Reinvention Database Setup Instructions

## Quick Setup (5 minutes)

The Weekly Reinvention feature needs 5 database tables. We found that `weekly_goals` already exists, but we need to create the remaining 4 tables.

### Step 1: Go to Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar

### Step 2: Create Missing Tables
Copy and execute this SQL in the SQL Editor:

```sql
-- Weekly Reflections Table (Friday Ritual)
CREATE TABLE IF NOT EXISTS weekly_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    accomplishments TEXT NOT NULL,
    challenges TEXT NOT NULL,
    lessons_learned TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

-- Badges Table (Gamification)
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL UNIQUE,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges Table (Earned Badges)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Weekly Progress Table (Daily check-ins)
CREATE TABLE IF NOT EXISTS weekly_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    goal_id UUID REFERENCES weekly_goals(id) ON DELETE SET NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    progress_notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Insert Default Badges
Execute this SQL to populate the badges table:

```sql
INSERT INTO badges (name, description, icon, type, rarity, points) VALUES
('First Reflection', 'Complete your first weekly reflection', '🎯', 'first_reflection', 'common', 10),
('Weekly Warrior', 'Complete a full week cycle', '⚔️', 'weekly_warrior', 'common', 25),
('Monthly Reviewer', 'Complete 4 weeks of reflections', '📅', 'monthly_reviewer', 'rare', 50),
('Quarter Champion', 'Complete 12 weeks of reflections', '🏆', 'quarterly_champion', 'rare', 100),
('Consistent Champion', 'Maintain a 4+ week streak', '🔥', 'consistent_champion', 'rare', 75),
('Half Year Streak', 'Maintain a 26-week streak', '💪', 'half_year_streak', 'epic', 200),
('Yearly Veteran', 'Complete 52 weeks of reflections', '🌟', 'yearly_veteran', 'legendary', 500),
('Quarter Streak', 'Maintain a 12-week streak', '🎖️', 'quarter_streak', 'epic', 150),
('Goal Getter', 'Complete all weekly commitments', '✅', 'goal_getter', 'common', 30);
```

### Step 4: Enable Security (RLS)
Execute this SQL to enable Row Level Security:

```sql
-- Enable Row Level Security (RLS)
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own weekly reflections" ON weekly_reflections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reflections" ON weekly_reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reflections" ON weekly_reflections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly reflections" ON weekly_reflections
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all badges" ON badges
    FOR SELECT USING (true);

CREATE POLICY "Users can view own weekly progress" ON weekly_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly progress" ON weekly_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly progress" ON weekly_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly progress" ON weekly_progress
    FOR DELETE USING (auth.uid() = user_id);
```

### Step 5: Create Indexes (Optional but recommended)
```sql
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_week ON weekly_reflections(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_user_week ON weekly_progress(user_id, week_start_date);
```

### Verification
After running these SQL commands, the Weekly Reinvention feature will be fully functional! You can verify by:

1. Check that all tables exist: `weekly_goals`, `weekly_reflections`, `badges`, `user_badges`, `weekly_progress`
2. Verify badges are populated: `SELECT COUNT(*) FROM badges;` should return 9
3. Test the frontend Weekly Reinvention features

## Troubleshooting

If you encounter any errors:
- Make sure you're using the correct Supabase project
- Check that you have admin permissions
- Verify the SQL syntax matches exactly
- Contact support if issues persist