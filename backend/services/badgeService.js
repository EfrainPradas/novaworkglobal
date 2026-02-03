import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

class BadgeService {
  constructor() {
    this.badgeCriteria = {
      // Weekly Goals Badges
      'first_week': {
        description: 'Complete your first weekly goal setting',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.countWeeklyGoals(userId) === 1
      },
      'week_streak_4': {
        description: 'Maintain a 4-week goal setting streak',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.getGoalStreak(userId) === 4
      },
      'week_streak_12': {
        description: 'Maintain a 12-week goal setting streak',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.getGoalStreak(userId) === 12
      },
      'week_streak_24': {
        description: 'Maintain a 24-week goal setting streak (6 months!)',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.getGoalStreak(userId) === 24
      },
      'week_streak_52': {
        description: 'Maintain a 52-week goal setting streak (1 year!)',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.getGoalStreak(userId) === 52
      },

      // Reflection Badges
      'reflection_pro': {
        description: 'Complete 10 Friday reflections',
        check: async (userId, action) => action === 'friday_reflection' && await this.countReflections(userId) === 10
      },
      'reflection_master': {
        description: 'Complete 25 Friday reflections',
        check: async (userId, action) => action === 'friday_reflection' && await this.countReflections(userId) === 25
      },
      'reflection_legend': {
        description: 'Complete 50 Friday reflections',
        check: async (userId, action) => action === 'friday_reflection' && await this.countReflections(userId) === 50
      },

      // Performance Badges
      'goal_crusher': {
        description: 'Achieve 90%+ goal completion rate for a week',
        check: async (userId, action) => action === 'weekly_progress' && await this.hasHighCompletionRate(userId, 90)
      },
      'perfect_week': {
        description: 'Achieve 100% goal completion in a week',
        check: async (userId, action) => action === 'weekly_progress' && await this.hasHighCompletionRate(userId, 100)
      },
      'high_performer': {
        description: 'Maintain an average week rating of 8+ for 4 weeks',
        check: async (userId, action) => action === 'friday_reflection' && await this.hasHighAverageRating(userId, 8, 4)
      },

      // Consistency Badges
      'early_bird': {
        description: 'Set Monday goals before 9 AM for 4 weeks',
        check: async (userId, action) => action === 'weekly_goals_early' && await this.hasEarlyGoals(userId, 4)
      },
      'consistency_king': {
        description: 'Complete both Monday and Friday rituals for 8 consecutive weeks',
        check: async (userId, action) => action === 'weekly_complete' && await this.hasCompleteWeeks(userId, 8)
      },
      'never_miss': {
        description: 'Complete both rituals for 12 consecutive weeks',
        check: async (userId, action) => action === 'weekly_complete' && await this.hasCompleteWeeks(userId, 12)
      },

      // AI & Insights Badges
      'sentiment_master': {
        description: 'Complete 20 sentiment-analyzed reflections',
        check: async (userId, action) => action === 'friday_reflection' && await this.countAnalyzedReflections(userId) === 20
      },
      'ai_enthusiast': {
        description: 'Use AI sentiment analysis for 10 consecutive reflections',
        check: async (userId, action) => action === 'friday_reflection' && await this.hasConsecutiveAIAnalysis(userId, 10)
      },

      // Milestone Badges
      'goals_25': {
        description: 'Set 25 total weekly goals',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.countTotalGoals(userId) >= 25
      },
      'goals_50': {
        description: 'Set 50 total weekly goals',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.countTotalGoals(userId) >= 50
      },
      'goals_100': {
        description: 'Set 100 total weekly goals',
        check: async (userId, action) => action === 'weekly_goals_set' && await this.countTotalGoals(userId) >= 100
      },

      // Special Achievement Badges
      'breakthrough_week': {
        description: 'Achieve a week rating of 10/10',
        check: async (userId, action) => action === 'friday_reflection' && await this.hasPerfectWeek(userId)
      },
      'resilience_master': {
        description: 'Maintain streak through challenging weeks',
        check: async (userId, action) => action === 'streak_maintained' && await this.hasResilience(userId)
      }
    };
  }

  // Helper methods for badge criteria checking
  async countWeeklyGoals(userId) {
    const { count } = await supabase
      .from('weekly_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return count || 0;
  }

  async getGoalStreak(userId) {
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('current_goal_streak')
      .eq('user_id', userId)
      .single();
    return streaks?.current_goal_streak || 0;
  }

  async countReflections(userId) {
    const { count } = await supabase
      .from('friday_reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return count || 0;
  }

  async hasHighCompletionRate(userId, threshold) {
    // This would need progress tracking data
    // For now, return false as we need to implement progress tracking first
    return false;
  }

  async hasHighAverageRating(userId, ratingThreshold, weeksCount) {
    const { data: reflections } = await supabase
      .from('friday_reflections')
      .select('overall_week_rating')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })
      .limit(weeksCount);

    if (!reflections || reflections.length < weeksCount) return false;

    const averageRating = reflections.reduce((sum, r) => sum + r.overall_week_rating, 0) / reflections.length;
    return averageRating >= ratingThreshold;
  }

  async hasEarlyGoals(userId, weeksCount) {
    // This would need timestamp data for when goals were set
    // For now, return false as we need to track goal setting times
    return false;
  }

  async hasCompleteWeeks(userId, weeksCount) {
    // Get recent weeks where both goals and reflections are complete
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - (weeksCount * 7));

    const { data: goals } = await supabase
      .from('weekly_goals')
      .select('week_start_date')
      .eq('user_id', userId)
      .gte('week_start_date', fourWeeksAgo.toISOString().split('T')[0]);

    const { data: reflections } = await supabase
      .from('friday_reflections')
      .select('week_start_date')
      .eq('user_id', userId)
      .gte('week_start_date', fourWeeksAgo.toISOString().split('T')[0]);

    if (!goals || !reflections) return false;

    const goalWeeks = new Set(goals.map(g => g.week_start_date));
    const reflectionWeeks = new Set(reflections.map(r => r.week_start_date));

    // Count weeks that have both goals and reflections
    let completeWeeks = 0;
    for (const week of goalWeeks) {
      if (reflectionWeeks.has(week)) {
        completeWeeks++;
      }
    }

    return completeWeeks >= weeksCount;
  }

  async countAnalyzedReflections(userId) {
    const { count } = await supabase
      .from('friday_reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('sentiment_analysis', 'is', null);
    return count || 0;
  }

  async hasConsecutiveAIAnalysis(userId, weeksCount) {
    const { data: reflections } = await supabase
      .from('friday_reflections')
      .select('week_start_date, sentiment_analysis')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })
      .limit(weeksCount);

    if (!reflections || reflections.length < weeksCount) return false;

    return reflections.every(r => r.sentiment_analysis !== null);
  }

  async countTotalGoals(userId) {
    const { data: goals } = await supabase
      .from('weekly_goals')
      .select('goal_1', 'goal_2', 'goal_3', 'goal_4', 'goal_5')
      .eq('user_id', userId);

    if (!goals) return 0;

    let totalGoals = 0;
    goals.forEach(week => {
      for (let i = 1; i <= 5; i++) {
        if (week[`goal_${i}`]) {
          totalGoals++;
        }
      }
    });

    return totalGoals;
  }

  async hasPerfectWeek(userId) {
    const { data: reflections } = await supabase
      .from('friday_reflections')
      .select('overall_week_rating')
      .eq('user_id', userId);

    if (!reflections) return false;

    return reflections.some(r => r.overall_week_rating === 10);
  }

  async hasResilience(userId) {
    // This would be a complex check for maintaining streak through challenging weeks
    // For now, return false
    return false;
  }

  // Main method to check and award badges
  async checkAndAwardBadges(userId, action, additionalData = {}) {
    console.log(`🏆 Checking badges for user ${userId}, action: ${action}`);

    try {
      // Get all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');

      if (badgesError) throw badgesError;

      // Get user's existing badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      if (userBadgesError) throw userBadgesError;

      const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const newlyEarnedBadges = [];

      // Check each badge criterion
      for (const badge of allBadges) {
        if (earnedBadgeIds.has(badge.id)) continue; // Skip already earned badges

        const criterion = this.badgeCriteria[badge.badge_code];
        if (!criterion) continue; // Skip if no criterion defined

        const shouldAward = await criterion.check(userId, action, additionalData);
        if (shouldAward) {
          await this.awardBadge(userId, badge.id);
          newlyEarnedBadges.push(badge);
          console.log(`🎉 Badge earned: ${badge.badge_name} by user ${userId}`);
        }
      }

      return newlyEarnedBadges;

    } catch (error) {
      console.error('❌ Error checking badges:', error);
      return [];
    }
  }

  async awardBadge(userId, badgeId) {
    const { error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Get badge suggestions for next milestones
  async getNextBadgeMilestones(userId) {
    try {
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId);

      const earnedCodes = new Set(userBadges?.map(ub => ub.badge.badge_code) || []);

      // Get progress towards various badges
      const progress = {
        goalStreak: await this.getGoalStreak(userId),
        reflectionCount: await this.countReflections(userId),
        totalGoals: await this.countTotalGoals(userId),
        aiAnalysisCount: await this.countAnalyzedReflections(userId)
      };

      const nextBadges = [];

      // Check next streak badges
      if (progress.goalStreak < 4 && !earnedCodes.has('week_streak_4')) {
        nextBadges.push({
          badge_code: 'week_streak_4',
          progress: progress.goalStreak,
          total: 4,
          type: 'streak'
        });
      } else if (progress.goalStreak < 12 && !earnedCodes.has('week_streak_12')) {
        nextBadges.push({
          badge_code: 'week_streak_12',
          progress: progress.goalStreak,
          total: 12,
          type: 'streak'
        });
      }

      // Check next reflection badges
      if (progress.reflectionCount < 10 && !earnedCodes.has('reflection_pro')) {
        nextBadges.push({
          badge_code: 'reflection_pro',
          progress: progress.reflectionCount,
          total: 10,
          type: 'reflections'
        });
      }

      // Check next total goals badges
      if (progress.totalGoals < 25 && !earnedCodes.has('goals_25')) {
        nextBadges.push({
          badge_code: 'goals_25',
          progress: progress.totalGoals,
          total: 25,
          type: 'total_goals'
        });
      } else if (progress.totalGoals < 50 && !earnedCodes.has('goals_50')) {
        nextBadges.push({
          badge_code: 'goals_50',
          progress: progress.totalGoals,
          total: 50,
          type: 'total_goals'
        });
      }

      return nextBadges;

    } catch (error) {
      console.error('❌ Error getting next badge milestones:', error);
      return [];
    }
  }
}

export default BadgeService;