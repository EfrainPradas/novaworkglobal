import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import BadgeService from '../services/badgeService.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Initialize Badge Service
const badgeService = new BadgeService();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

// Monday Ritual - Set Weekly Goals
router.post('/monday-ritual/goals', authenticateToken, async (req, res) => {
  try {
    const {
      primary_goal,
      secondary_goals,
      focus_areas,
      weekly_commitments,
      week_start_date
    } = req.body;

    const userId = req.user.id;
    const weekStartDate = week_start_date || getWeekStart(new Date());

    // Check if goals already exist for this week
    const { data: existingGoals } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .single();

    let result;
    if (existingGoals) {
      // Update existing goals
      result = await supabase
        .from('weekly_goals')
        .update({
          primary_goal,
          secondary_goals,
          focus_areas,
          weekly_commitments,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGoals.id)
        .select()
        .single();
    } else {
      // Create new goals
      result = await supabase
        .from('weekly_goals')
        .insert({
          user_id: userId,
          week_start_date: weekStartDate,
          primary_goal,
          secondary_goals,
          focus_areas,
          weekly_commitments,
          status: 'active'
        })
        .select()
        .single();
    }

    // Award badge for consistency (if user has goals for 4+ consecutive weeks)
    await checkConsistencyBadge(userId);

    res.json({
      success: true,
      data: result.data,
      message: existingGoals ? 'Goals updated successfully' : 'Goals set successfully'
    });

  } catch (error) {
    console.error('Error setting Monday goals:', error);
    res.status(500).json({ error: 'Failed to set goals', details: error.message });
  }
});

// Friday Ritual - Weekly Reflection
router.post('/friday-ritual/reflection', authenticateToken, async (req, res) => {
  try {
    const {
      accomplishments,
      challenges,
      lessons_learned,
      mood_rating,
      satisfaction_score,
      week_start_date
    } = req.body;

    const userId = req.user.id;
    const weekStartDate = week_start_date || getWeekStart(new Date());

    // Create or update reflection
    const result = await supabase
      .from('weekly_reflections')
      .upsert({
        user_id: userId,
        week_start_date: weekStartDate,
        accomplishments,
        challenges,
        lessons_learned,
        mood_rating,
        satisfaction_score,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_start_date'
      })
      .select()
      .single();

    // Update goals status to completed
    await supabase
      .from('weekly_goals')
      .update({ status: 'completed' })
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate);

    // Award badges
    await awardReflectionBadges(userId);

    res.json({
      success: true,
      data: result.data,
      message: 'Reflection saved successfully'
    });

  } catch (error) {
    console.error('Error saving reflection:', error);
    res.status(500).json({ error: 'Failed to save reflection', details: error.message });
  }
});

// Get Weekly Progress
router.get('/weekly-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { week_start_date } = req.query;
    const weekStartDate = week_start_date || getWeekStart(new Date());

    // Get goals for the week
    const { data: goals } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .single();

    // Get reflection for the week
    const { data: reflection } = await supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .single();

    // Get user streak
    const streak = await getUserStreak(userId);

    res.json({
      success: true,
      data: {
        goals,
        reflection,
        streak,
        week_status: reflection ? 'completed' : (goals ? 'in_progress' : 'not_started')
      }
    });

  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress', details: error.message });
  }
});

// Get User Stats & Gamification
router.get('/user-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get completed weeks count
    const { count: completedWeeks } = await supabase
      .from('weekly_reflections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Get current streak
    const streak = await getUserStreak(userId);

    // Get user badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (
          id,
          name,
          description,
          icon,
          rarity
        )
      `)
      .eq('user_id', userId);

    // Get next milestones
    const nextMilestones = getNextMilestones(completedWeeks, streak);

    res.json({
      success: true,
      data: {
        completed_weeks: completedWeeks,
        current_streak: streak,
        badges: badges || [],
        next_milestones: nextMilestones
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// AI Sentiment Analysis Endpoint
router.post('/ai/analyze-sentiment', authenticateToken, async (req, res) => {
  try {
    const { text, user_id, week_start_date } = req.body;

    if (!text || !user_id || !week_start_date) {
      return res.status(400).json({ error: 'Missing required fields: text, user_id, week_start_date' });
    }

    console.log('🧠 Starting sentiment analysis for user:', user_id);

    // Prepare AI analysis prompt
    const analysisPrompt = `
Analyze the following weekly reflection for sentiment, emotional state, and key themes:

USER REFLECTION:
${text}

ANALYSIS TASKS:
1. Determine overall sentiment: positive, neutral, or negative
2. Identify emotional state: energized, motivated, tired, stressed, optimistic, etc.
3. Extract key themes: career_development, learning, networking, job_search, interview_prep, personal_growth, health, relationships, etc.
4. Generate 2-3 personalized recommendations based on patterns

RESPONSE FORMAT (JSON only):
{
  "overall_sentiment": "positive|neutral|negative",
  "emotional_state": "emotional_state_description",
  "confidence": 0.85,
  "key_themes": ["theme1", "theme2", "theme3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "emotional_indicators": {
    "energy_trend": "increasing|stable|decreasing",
    "motivation_trend": "increasing|stable|decreasing",
    "stress_level": "low|medium|high"
  }
}
`;

    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model: process.env.AI_FAST_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach and emotional intelligence analyst. Analyze weekly reflections to provide insights and personalized recommendations. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0].message.content;

    let sentimentAnalysis;
    try {
      sentimentAnalysis = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback analysis
      sentimentAnalysis = {
        overall_sentiment: 'neutral',
        emotional_state: 'balanced',
        confidence: 0.5,
        key_themes: ['personal_growth'],
        recommendations: ['Continue reflecting on your progress'],
        emotional_indicators: {
          energy_trend: 'stable',
          motivation_trend: 'stable',
          stress_level: 'medium'
        }
      };
    }

    console.log('✅ Sentiment analysis completed:', sentimentAnalysis);

    res.json({
      success: true,
      sentiment_analysis: sentimentAnalysis,
      analysis_date: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sentiment analysis:', error);

    // Return fallback analysis if AI fails
    const fallbackAnalysis = {
      overall_sentiment: 'neutral',
      emotional_state: 'processing',
      confidence: 0.5,
      key_themes: ['self_reflection'],
      recommendations: ['Continue your weekly reflection practice'],
      emotional_indicators: {
        energy_trend: 'stable',
        motivation_trend: 'stable',
        stress_level: 'medium'
      }
    };

    res.json({
      success: true,
      sentiment_analysis: fallbackAnalysis,
      note: 'Fallback analysis used due to AI service unavailable'
    });
  }
});

// Get Weekly Progress Summary
router.get('/progress/:week_start_date', authenticateToken, async (req, res) => {
  try {
    const { week_start_date } = req.params;
    const user_id = req.user.id;

    console.log('📊 Loading weekly progress for user:', user_id, 'week:', week_start_date);

    // Get weekly goals
    const { data: goals, error: goalsError } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', user_id)
      .eq('week_start_date', week_start_date)
      .maybeSingle();

    if (goalsError) throw goalsError;

    // Get weekly progress
    const { data: progress, error: progressError } = await supabase
      .from('weekly_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('week_start_date', week_start_date);

    if (progressError) throw progressError;

    // Get Friday reflection
    const { data: reflection, error: reflectionError } = await supabase
      .from('friday_reflections')
      .select('*')
      .eq('user_id', user_id)
      .eq('week_start_date', week_start_date)
      .maybeSingle();

    if (reflectionError) throw reflectionError;

    // Get user streaks
    const { data: streaks, error: streaksError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (streaksError) throw streaksError;

    res.json({
      success: true,
      data: {
        goals,
        progress: progress || [],
        reflection,
        streaks: streaks || {
          current_goal_streak: 0,
          current_reflection_streak: 0,
          longest_goal_streak: 0,
          longest_reflection_streak: 0,
          total_weeks_completed: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error loading weekly progress:', error);
    res.status(500).json({ error: 'Failed to load weekly progress', details: error.message });
  }
});

// Save Weekly Progress
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { week_start_date, day_of_week, goal_id, progress_percentage, progress_notes, completed } = req.body;

    console.log('💾 Saving weekly progress for user:', user_id);

    const { data, error } = await supabase
      .from('weekly_progress')
      .upsert({
        user_id,
        week_start_date,
        day_of_week,
        goal_id,
        progress_percentage: progress_percentage || 0,
        progress_notes: progress_notes || '',
        completed: completed || false
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Error saving weekly progress:', error);
    res.status(500).json({ error: 'Failed to save weekly progress', details: error.message });
  }
});

// Get User Badges
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    console.log('🏆 Loading badges for user:', user_id);

    // Get user badges with details
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', user_id);

    if (userBadgesError) throw userBadgesError;

    // Get available badges not yet earned
    const { data: availableBadges, error: availableBadgesError } = await supabase
      .from('badges')
      .select('*')
      .not('id', 'in', `(${userBadges?.map(ub => ub.badge_id).join(',') || ''})`);

    if (availableBadgesError) throw availableBadgesError;

    res.json({
      success: true,
      data: {
        earned: userBadges || [],
        available: availableBadges || []
      }
    });

  } catch (error) {
    console.error('❌ Error loading badges:', error);
    res.status(500).json({ error: 'Failed to load badges', details: error.message });
  }
});

// Award Badge to User
router.post('/badges/:badge_code/award', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { badge_code } = req.params;

    console.log('🏅 Awarding badge', badge_code, 'to user:', user_id);

    // Get badge details
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .eq('badge_code', badge_code)
      .single();

    if (badgeError || !badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    // Check if user already has this badge
    const { data: existingBadge, error: existingError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user_id)
      .eq('badge_id', badge.id)
      .maybeSingle();

    if (existingBadge) {
      return res.status(400).json({ error: 'Badge already earned' });
    }

    // Award badge
    const { data: userBadge, error: awardError } = await supabase
      .from('user_badges')
      .insert({
        user_id,
        badge_id: badge.id
      })
      .select(`
        *,
        badge:badges(*)
      `)
      .single();

    if (awardError) throw awardError;

    res.json({
      success: true,
      data: userBadge,
      message: `🎉 Congratulations! You've earned the "${badge.badge_name}" badge!`
    });

  } catch (error) {
    console.error('❌ Error awarding badge:', error);
    res.status(500).json({ error: 'Failed to award badge', details: error.message });
  }
});

// Check and award badges automatically
router.post('/check-badges', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { action, additional_data } = req.body;

    console.log('🏆 Checking badges for action:', action, 'user:', user_id);

    const newlyEarnedBadges = await badgeService.checkAndAwardBadges(user_id, action, additional_data);

    if (newlyEarnedBadges.length > 0) {
      console.log(`🎉 User ${user_id} earned ${newlyEarnedBadges.length} new badges!`);
    }

    res.json({
      success: true,
      newly_earned_badges: newlyEarnedBadges,
      message: newlyEarnedBadges.length > 0
        ? `🎉 Congratulations! You earned ${newlyEarnedBadges.length} new badge(s)!`
        : 'No new badges earned at this time.'
    });

  } catch (error) {
    console.error('❌ Error checking badges:', error);
    res.status(500).json({ error: 'Failed to check badges', details: error.message });
  }
});

// Get next badge milestones for progress tracking
router.get('/next-milestones', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const nextMilestones = await badgeService.getNextBadgeMilestones(user_id);

    res.json({
      success: true,
      data: nextMilestones
    });

  } catch (error) {
    console.error('❌ Error getting next milestones:', error);
    res.status(500).json({ error: 'Failed to get next milestones', details: error.message });
  }
});

// Helper Functions

// Get week start date (Monday)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

// Get user streak (consecutive weeks with reflections)
async function getUserStreak(userId) {
  try {
    const { data: reflections } = await supabase
      .from('weekly_reflections')
      .select('week_start_date')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false });

    if (!reflections || reflections.length === 0) return 0;

    let streak = 0;
    const sortedWeeks = reflections.map(r => r.week_start_date).sort().reverse();

    for (let i = 0; i < sortedWeeks.length; i++) {
      const expectedWeek = getWeekStart(new Date());
      expectedWeek.setDate(expectedWeek.getDate() - (i * 7));
      const expectedWeekStr = expectedWeek.toISOString().split('T')[0];

      if (sortedWeeks[i] === expectedWeekStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

// Check and award consistency badge
async function checkConsistencyBadge(userId) {
  try {
    const streak = await getUserStreak(userId);

    if (streak >= 4) {
      // Award "Consistent Champion" badge
      await awardBadge(userId, 'consistent_champion');
    }
  } catch (error) {
    console.error('Error checking consistency badge:', error);
  }
}

// Award badge to user
async function awardBadge(userId, badgeType) {
  try {
    // Get badge info
    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('type', badgeType)
      .single();

    if (!badge) return;

    // Check if user already has this badge
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single();

    if (existingBadge) return;

    // Award badge
    await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badge.id,
        earned_at: new Date().toISOString()
      });

    console.log(`🏆 Badge awarded: ${badge.name} to user ${userId}`);
  } catch (error) {
    console.error('Error awarding badge:', error);
  }
}

// Award reflection badges
async function awardReflectionBadges(userId) {
  try {
    const { count: totalReflections } = await supabase
      .from('weekly_reflections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    const streak = await getUserStreak(userId);

    // Award badges based on achievements
    if (totalReflections >= 1) await awardBadge(userId, 'first_reflection');
    if (totalReflections >= 4) await awardBadge(userId, 'monthly_reviewer');
    if (totalReflections >= 12) await awardBadge(userId, 'quarterly_champion');
    if (totalReflections >= 52) await awardBadge(userId, 'yearly_veteran');

    if (streak >= 4) await awardBadge(userId, 'consistent_champion');
    if (streak >= 12) await awardBadge(userId, 'quarter_streak');
    if (streak >= 26) await awardBadge(userId, 'half_year_streak');

  } catch (error) {
    console.error('Error awarding reflection badges:', error);
  }
}

// Get next milestones
function getNextMilestones(completedWeeks, currentStreak) {
  const milestones = [];

  // Week milestones
  if (completedWeeks < 1) milestones.push({ type: 'weeks', target: 1, description: 'Complete your first week' });
  if (completedWeeks < 4) milestones.push({ type: 'weeks', target: 4, description: 'Complete 4 weeks (Monthly)' });
  if (completedWeeks < 12) milestones.push({ type: 'weeks', target: 12, description: 'Complete 12 weeks (Quarterly)' });
  if (completedWeeks < 26) milestones.push({ type: 'weeks', target: 26, description: 'Complete 26 weeks (Half Year)' });
  if (completedWeeks < 52) milestones.push({ type: 'weeks', target: 52, description: 'Complete 52 weeks (Full Year)' });

  // Streak milestones
  if (currentStreak < 4) milestones.push({ type: 'streak', target: 4, description: '4-week streak' });
  if (currentStreak < 8) milestones.push({ type: 'streak', target: 8, description: '8-week streak' });
  if (currentStreak < 12) milestones.push({ type: 'streak', target: 12, description: '12-week streak (3 months)' });

  return milestones.slice(0, 3); // Return next 3 milestones
}

export default router;