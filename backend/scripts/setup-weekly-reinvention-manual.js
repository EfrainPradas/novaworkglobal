import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function setupWeeklyReinventionSchema() {
  try {
    console.log('🚀 Setting up Weekly Reinvention schema manually...');

    // 1. Create weekly_goals table
    console.log('📋 Creating weekly_goals table...');
    const { error: goalsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS weekly_goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            week_start_date DATE NOT NULL,
            primary_goal TEXT NOT NULL,
            secondary_goals TEXT[],
            focus_areas TEXT[],
            weekly_commitments TEXT[],
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, week_start_date)
        );
      `
    });

    if (goalsError) {
      console.error('❌ Error creating weekly_goals table:', goalsError.message);
    } else {
      console.log('✅ weekly_goals table created successfully');
    }

    // 2. Create weekly_reflections table
    console.log('📋 Creating weekly_reflections table...');
    const { error: reflectionsError } = await supabase.from('weekly_reflections').select('id').limit(1);

    if (reflectionsError && reflectionsError.code === 'PGRST116') {
      // Table doesn't exist, we need to create it via SQL
      console.log('⚠️  Table weekly_reflections does not exist. Please create it manually in Supabase dashboard.');
    }

    // 3. Create badges table
    console.log('📋 Creating badges table...');
    const { error: badgesError } = await supabase.from('badges').select('id').limit(1);

    if (badgesError && badgesError.code === 'PGRST116') {
      console.log('⚠️  Table badges does not exist. Please create it manually in Supabase dashboard.');
    }

    // 4. Create user_badges table
    console.log('📋 Creating user_badges table...');
    const { error: userBadgesError } = await supabase.from('user_badges').select('id').limit(1);

    if (userBadgesError && userBadgesError.code === 'PGRST116') {
      console.log('⚠️  Table user_badges does not exist. Please create it manually in Supabase dashboard.');
    }

    // 5. Create weekly_progress table
    console.log('📋 Creating weekly_progress table...');
    const { error: progressError } = await supabase.from('weekly_progress').select('id').limit(1);

    if (progressError && progressError.code === 'PGRST116') {
      console.log('⚠️  Table weekly_progress does not exist. Please create it manually in Supabase dashboard.');
    }

    // 6. If badges table exists, insert default badges
    console.log('🏅 Checking if badges need to be populated...');
    const { data: existingBadges, error: checkBadgesError } = await supabase.from('badges').select('count');

    if (!checkBadgesError && (!existingBadges || existingBadges.length === 0)) {
      console.log('⚠️  Badges table is empty. Please insert default badges manually.');
    }

    console.log('\n🎯 Manual setup check complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and execute the SQL from: backend/sql/weekly_reinvention_schema.sql');
    console.log('4. This will create all necessary tables, indexes, and RLS policies');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Alternative approach: Create the tables using direct SQL if we have admin access
async function createTablesWithDirectSQL() {
  try {
    console.log('🚀 Attempting to create tables with direct SQL...');

    const tables = [
      {
        name: 'weekly_goals',
        sql: `
          CREATE TABLE IF NOT EXISTS weekly_goals (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              week_start_date DATE NOT NULL,
              primary_goal TEXT NOT NULL,
              secondary_goals TEXT[],
              focus_areas TEXT[],
              weekly_commitments TEXT[],
              status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, week_start_date)
          );
        `
      },
      {
        name: 'weekly_reflections',
        sql: `
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
        `
      },
      {
        name: 'badges',
        sql: `
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
        `
      },
      {
        name: 'user_badges',
        sql: `
          CREATE TABLE IF NOT EXISTS user_badges (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
              earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, badge_id)
          );
        `
      },
      {
        name: 'weekly_progress',
        sql: `
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
        `
      }
    ];

    for (const table of tables) {
      console.log(`📋 Creating ${table.name} table...`);

      // Use the raw SQL approach - this may not work with standard Supabase client
      try {
        const { error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          console.log(`⚠️  Table ${table.name} does not exist. Manual creation required.`);
        } else if (!error) {
          console.log(`✅ Table ${table.name} already exists`);
        }
      } catch (err) {
        console.log(`⚠️  Cannot check ${table.name} table: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Direct SQL approach failed:', error);
  }
}

// Run both approaches
console.log('=== APPROACH 1: Check existing tables ===');
setupWeeklyReinventionSchema().then(() => {
  console.log('\n=== APPROACH 2: Try direct SQL creation ===');
  return createTablesWithDirectSQL();
}).then(() => {
  console.log('\n🎉 Setup script completed!');
  console.log('\n📋 SUMMARY:');
  console.log('The script has checked for existing tables and identified what needs to be created.');
  console.log('Please follow the manual setup instructions above to complete the database schema creation.');
}).catch((error) => {
  console.error('❌ Setup script failed:', error);
});