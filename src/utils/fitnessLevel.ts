import { AssessmentResult, PersonalGoal, FitnessLevelInfo, FITNESS_TIERS, FitnessTier, XpActivityLog } from '../types';

/**
 * Calculates a student's total XP, Fitness Level, tier progress, and detailed XP activity breakdown.
 * Awards XP for:
 * 1. Base Assessment Completion (+100 XP)
 * 2. Performance Score (+1 XP per score point, up to 100 XP)
 * 3. Consistent Improvement (+75 XP when beating previous personal best for that exercise/component)
 * 4. Practice Consistency / Streak (+50 XP per streak milestone)
 * 5. Personal Goal Accomplishment (+150 XP per achieved goal)
 */
export function calculateStudentFitnessLevel(
  results: AssessmentResult[] = [],
  goals: PersonalGoal[] = []
): FitnessLevelInfo {
  let totalXp = 0;
  let streakCount = 0;
  let improvementBonusesEarned = 0;
  const xpLogs: XpActivityLog[] = [];

  // Track previous best scores by component for improvement bonus calculations
  const bestScoreByComponent: Record<string, number> = {};

  // Sort assessments chronologically (oldest to newest) to track progressive improvements
  const sortedAssessments = [...results].sort((a, b) => {
    const timeA = new Date(a.date || a.timestamp || 0).getTime();
    const timeB = new Date(b.date || b.timestamp || 0).getTime();
    return timeA - timeB;
  });

  let lastAssessmentTime: number | null = null;

  sortedAssessments.forEach((assessment, index) => {
    const compId = assessment.componentId;
    const score = Number(assessment.score) || 0;
    const rawDate = assessment.date || assessment.timestamp || new Date().toISOString();
    const dateStr = rawDate instanceof Date ? rawDate.toISOString() : String(rawDate);
    const currTime = new Date(dateStr).getTime();

    // 1. Base Assessment Completion XP (+100 XP)
    const baseCompletionXp = 100;
    totalXp += baseCompletionXp;
    xpLogs.unshift({
      id: `xp-comp-${assessment.id || index}-${currTime}`,
      type: 'assessment_completion',
      title: `${assessment.componentId.toUpperCase()} Assessment`,
      xpEarned: baseCompletionXp,
      description: 'Completed physical fitness assessment test.',
      timestamp: dateStr,
      icon: '🎯'
    });

    // 2. Score Performance XP (+1 XP per score point)
    if (score > 0) {
      const scoreXp = Math.round(score);
      totalXp += scoreXp;
      xpLogs.unshift({
        id: `xp-score-${assessment.id || index}-${currTime}`,
        type: 'performance_score',
        title: `Performance Bonus (${score} pts)`,
        xpEarned: scoreXp,
        description: `Score rating bonus for ${assessment.componentId}.`,
        timestamp: dateStr,
        icon: '⚡'
      });
    }

    // 3. Consistent Improvement Bonus (+75 XP)
    const prevBest = bestScoreByComponent[compId];
    if (prevBest !== undefined && score > prevBest) {
      const improvementXp = 75;
      totalXp += improvementXp;
      improvementBonusesEarned += 1;
      const diff = Math.round(score - prevBest);
      xpLogs.unshift({
        id: `xp-improve-${assessment.id || index}-${currTime}`,
        type: 'score_improvement',
        title: `Personal Record (+${diff} pts)`,
        xpEarned: improvementXp,
        description: `Broke previous best score on ${assessment.componentId}!`,
        timestamp: dateStr,
        icon: '📈'
      });
    }

    // Update best score for this component
    bestScoreByComponent[compId] = Math.max(bestScoreByComponent[compId] || 0, score);

    // 4. Consistency / Frequency Streak Bonus
    if (lastAssessmentTime !== null) {
      const daysDiff = (currTime - lastAssessmentTime) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 4) {
        streakCount += 1;
        if (streakCount >= 2) {
          const streakXp = 50;
          totalXp += streakXp;
          xpLogs.unshift({
            id: `xp-streak-${assessment.id || index}-${currTime}`,
            type: 'consistency_streak',
            title: `Consistency Streak (${streakCount} Tests)`,
            xpEarned: streakXp,
            description: 'Maintained consecutive workout & testing frequency.',
            timestamp: dateStr,
            icon: '🔥'
          });
        }
      } else {
        streakCount = 1;
      }
    } else {
      streakCount = 1;
    }
    lastAssessmentTime = currTime;
  });

  // 5. Personal Goals XP (+150 XP per completed goal)
  const completedGoals = goals.filter(g => g.completed || g.currentReps >= g.targetReps);
  completedGoals.forEach((goal) => {
    const goalXp = 150;
    totalXp += goalXp;
    const rawGoalDate = goal.lastUpdated || goal.createdAt || new Date().toISOString();
    const goalDateStr = typeof rawGoalDate === 'string' ? rawGoalDate : String(rawGoalDate);
    xpLogs.unshift({
      id: `xp-goal-${goal.id}`,
      type: 'goal_achievement',
      title: `Goal Achieved: ${goal.exerciseName}`,
      xpEarned: goalXp,
      description: `Target of ${goal.targetReps} ${goal.unit} reached!`,
      timestamp: goalDateStr,
      icon: '🏆'
    });
  });

  // Determine Current Tier and Next Tier
  let currentTier: FitnessTier = FITNESS_TIERS[0];
  let nextTier: FitnessTier | null = FITNESS_TIERS[1] || null;

  for (let i = 0; i < FITNESS_TIERS.length; i++) {
    const tier = FITNESS_TIERS[i];
    if (totalXp >= tier.minXp) {
      currentTier = tier;
      nextTier = FITNESS_TIERS[i + 1] || null;
    }
  }

  // Calculate Progress towards next level
  let xpInCurrentLevel = totalXp - currentTier.minXp;
  let xpNeededForNextLevel = nextTier ? (nextTier.minXp - currentTier.minXp) : 1000;
  let levelProgressPercent = nextTier 
    ? Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)))
    : 100;

  return {
    currentLevel: currentTier.level,
    currentTitle: currentTier.title,
    badge: currentTier.badge,
    totalXp,
    currentTierMinXp: currentTier.minXp,
    nextTierMinXp: nextTier ? nextTier.minXp : currentTier.maxXp,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    levelProgressPercent,
    streakCount,
    improvementBonusesEarned,
    completedTestsCount: sortedAssessments.length,
    completedGoalsCount: completedGoals.length,
    recentXpLogs: xpLogs.slice(0, 15),
    color: currentTier.color,
  };
}
