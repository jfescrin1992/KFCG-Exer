/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FitnessCategory = 'Health-Related' | 'Skill-Related';

export type UserRole = 'student' | 'teacher' | 'superadmin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: string;
  section?: string;
  studentCode?: string;
  teacherName?: string;
  createdAt?: string;
}

export interface FitnessComponent {
  id: string;
  name: string;
  category: FitnessCategory;
  description: string;
  gameTitle: string;
  instructions: string[];
}

export interface UserSession {
  studentCode: string;
  studentName: string;
  grade: string;
  section: string;
  age: string;
  gender: string;
  height?: string; // in cm
  weight?: string; // in kg
  date: string;
}

export interface AssessmentResult {
  id?: number;
  componentId: string;
  rawResult: string | number;
  score: number;
  unit?: string;
  validReps?: number;
  invalidReps?: number;
  frequency?: number; // Steps per minute
  consistency?: number; // Consistency percentage
  duration?: number; // Seconds
  date?: string;
  timestamp?: string | Date;
  studentId?: string;
  studentName?: string;
  grade?: string;
  section?: string;
  studentCode?: string;
  faultsDetected?: string[];
  formAccuracy?: number;
}

export interface PersonalGoal {
  id: string | number;
  studentId: string;
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  currentReps: number;
  unit: string; // 'reps' | 'seconds' | 'cycles'
  category?: string;
  targetDate?: string;
  completed: boolean;
  createdAt: string;
  lastUpdated?: string;
}

export interface GoalExerciseOption {
  id: string;
  name: string;
  category: string;
  defaultTarget: number;
  unit: string;
  icon: string;
  description: string;
  recommendedTargets: { beginner: number; intermediate: number; advanced: number };
}

export const GOAL_EXERCISE_OPTIONS: GoalExerciseOption[] = [
  {
    id: 'push-ups',
    name: 'Push-ups',
    category: 'Strength',
    defaultTarget: 25,
    unit: 'reps',
    icon: '🏋️',
    description: 'Upper body chest, triceps and anterior shoulder pressing power',
    recommendedTargets: { beginner: 15, intermediate: 25, advanced: 40 }
  },
  {
    id: 'squats',
    name: 'Bodyweight Squats',
    category: 'Strength',
    defaultTarget: 35,
    unit: 'reps',
    icon: '🦵',
    description: 'Lower body quadriceps, glutes and hamstrings endurance',
    recommendedTargets: { beginner: 20, intermediate: 35, advanced: 60 }
  },
  {
    id: 'sit-ups',
    name: 'Sit-ups / Curl-ups',
    category: 'Endurance',
    defaultTarget: 30,
    unit: 'reps',
    icon: '⚡',
    description: 'Abdominal core endurance and spinal flexion control',
    recommendedTargets: { beginner: 20, intermediate: 30, advanced: 50 }
  },
  {
    id: 'lunges',
    name: 'Walking / Split Lunges',
    category: 'Strength',
    defaultTarget: 30,
    unit: 'reps',
    icon: '🏃',
    description: 'Unilateral leg strength, hip mobility and knee stability',
    recommendedTargets: { beginner: 16, intermediate: 30, advanced: 50 }
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'Cardio',
    defaultTarget: 50,
    unit: 'reps',
    icon: '⭐',
    description: 'Cardiovascular conditioning and full-body coordination',
    recommendedTargets: { beginner: 30, intermediate: 50, advanced: 100 }
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    category: 'Cardio',
    defaultTarget: 60,
    unit: 'reps',
    icon: '🔥',
    description: 'Dynamic hip flexor speed and cardiovascular endurance',
    recommendedTargets: { beginner: 40, intermediate: 60, advanced: 120 }
  },
  {
    id: 'burpees',
    name: 'Full Body Burpees',
    category: 'Full Body',
    defaultTarget: 15,
    unit: 'reps',
    icon: '💥',
    description: 'Intense metabolic conditioning and explosive power',
    recommendedTargets: { beginner: 10, intermediate: 15, advanced: 30 }
  },
  {
    id: 'planks',
    name: 'Isometric Core Plank',
    category: 'Endurance',
    defaultTarget: 60,
    unit: 'seconds',
    icon: '🛡️',
    description: 'Static core stability and spinal anti-extension endurance',
    recommendedTargets: { beginner: 30, intermediate: 60, advanced: 120 }
  },
  {
    id: 'cardio',
    name: 'Cardio Step & March',
    category: 'Cardio',
    defaultTarget: 80,
    unit: 'reps',
    icon: '❤️',
    description: 'Aerobic fitness and cardiovascular endurance rhythm',
    recommendedTargets: { beginner: 50, intermediate: 80, advanced: 150 }
  }
];

export interface FitnessData {
  session: UserSession;
  results: AssessmentResult[];
}

export const FITNESS_COMPONENTS: FitnessComponent[] = [
  // Health-Related
  {
    id: 'exercise-detection',
    name: 'AI Exercise Detection & Rep Counter',
    category: 'Health-Related',
    description: 'Auto-recognize Push-ups, Squats, Sit-ups, Lunges, Jumping jacks, Planks, High knees, & Burpees with real-time form detection.',
    gameTitle: 'AI Exercise Recognition & Rep Counter',
    instructions: [
      'Choose any of the 8 exercises or leave on Auto-Detect',
      'Perform the exercise facing the camera with full movement range',
      'The AI will count valid repetitions and alert on incorrect form'
    ]
  },
  {
    id: 'cardio',
    name: 'Cardiovascular Endurance',
    category: 'Health-Related',
    description: 'Ability of the heart and lungs to supply oxygen during exercise.',
    gameTitle: 'Cardio Challenge',
    instructions: ['March or jog in place', 'Stay within the frame', 'Keep a steady rhythm']
  },
  {
    id: 'strength',
    name: 'Muscular Strength',
    category: 'Health-Related',
    description: 'Maximum force a muscle can exert.',
    gameTitle: 'Power Push',
    instructions: ['Keep body straight', 'Lower chest to floor', 'Push back up fully']
  },
  {
    id: 'endurance',
    name: 'Muscular Endurance',
    category: 'Health-Related',
    description: 'Ability of muscles to perform repetitive contractions.',
    gameTitle: 'Core Challenge',
    instructions: ['Lie on your back', 'Knees bent', 'Curl up towards knees']
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    category: 'Health-Related',
    description: 'Range of motion around a joint.',
    gameTitle: 'Reach the Target',
    instructions: ['Sit with legs straight', 'Reach forward slowly', 'Hold your furthest point']
  },
  {
    id: 'body-comp',
    name: 'Body Composition',
    category: 'Health-Related',
    description: 'Proportion of fat and non-fat mass in your body.',
    gameTitle: 'Know Your Body',
    instructions: ['Stand straight', 'Face the camera', 'Follow posture guidelines']
  },
  // Skill-Related
  {
    id: 'agility',
    name: 'Agility',
    category: 'Skill-Related',
    description: 'Ability to change direction quickly.',
    gameTitle: 'Escape the Obstacles',
    instructions: ['Move left and right', 'Avoid virtual targets', 'Stay responsive']
  },
  {
    id: 'balance',
    name: 'Balance',
    category: 'Skill-Related',
    description: 'Ability to maintain equilibrium.',
    gameTitle: 'Balance Master',
    instructions: ['Stand on one leg', 'Keep your center steady', 'Hold as long as possible']
  },
  {
    id: 'coordination',
    name: 'Coordination',
    category: 'Skill-Related',
    description: 'Ability to use senses together with body parts.',
    gameTitle: 'Target Catch',
    instructions: ['Watch the virtual targets', 'Touch them as quickly as they appear']
  },
  {
    id: 'power',
    name: 'Power',
    category: 'Skill-Related',
    description: 'Ability to exert maximum force quickly.',
    gameTitle: 'Jump Power',
    instructions: ['Stand ready', 'Perform a maximum vertical jump', 'Land safely']
  },
  {
    id: 'reaction',
    name: 'Reaction Time',
    category: 'Skill-Related',
    description: 'Time taken to respond to a stimulus.',
    gameTitle: 'Quick React',
    instructions: ['Watch for the red target', 'Perform the movement immediately', 'Repeat for all trials']
  }
];

// -------------------------------------------------------------
// FITNESS LEVEL & XP SYSTEM TYPES
// -------------------------------------------------------------

export interface FitnessTier {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  badge: string;
  color: string;
  accentColor: string;
  perkDescription: string;
}

export interface XpActivityLog {
  id: string;
  type: 'assessment_completion' | 'performance_score' | 'score_improvement' | 'goal_achievement' | 'consistency_streak';
  title: string;
  xpEarned: number;
  description: string;
  timestamp: string;
  icon?: string;
}

export interface FitnessLevelInfo {
  currentLevel: number;
  currentTitle: string;
  badge: string;
  totalXp: number;
  currentTierMinXp: number;
  nextTierMinXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  levelProgressPercent: number;
  streakCount: number;
  improvementBonusesEarned: number;
  completedTestsCount: number;
  completedGoalsCount: number;
  recentXpLogs: XpActivityLog[];
  color: string;
}

export const FITNESS_TIERS: FitnessTier[] = [
  {
    level: 1,
    title: 'Fitness Novice',
    minXp: 0,
    maxXp: 249,
    badge: '🌱',
    color: 'from-slate-500 to-slate-700',
    accentColor: 'text-slate-600 bg-slate-100 border-slate-200',
    perkDescription: 'Starting your fitness journey with ExerFit AI.'
  },
  {
    level: 2,
    title: 'Active Starter',
    minXp: 250,
    maxXp: 599,
    badge: '🥉',
    color: 'from-amber-600 to-amber-800',
    accentColor: 'text-amber-700 bg-amber-50 border-amber-200',
    perkDescription: 'Bronze Tier unlocked: Developing core motor stamina.'
  },
  {
    level: 3,
    title: 'Fitness Challenger',
    minXp: 600,
    maxXp: 1099,
    badge: '🥈',
    color: 'from-blue-500 to-blue-700',
    accentColor: 'text-blue-700 bg-blue-50 border-blue-200',
    perkDescription: 'Silver Tier: Consistently completing multiple fitness components.'
  },
  {
    level: 4,
    title: 'Agile Athlete',
    minXp: 1100,
    maxXp: 1799,
    badge: '🥇',
    color: 'from-emerald-500 to-emerald-700',
    accentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    perkDescription: 'Gold Tier: Strong technique and demonstrated performance gains.'
  },
  {
    level: 5,
    title: 'Conditioned Performer',
    minXp: 1800,
    maxXp: 2699,
    badge: '💎',
    color: 'from-indigo-600 to-purple-700',
    accentColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    perkDescription: 'Platinum Tier: Exceptional endurance and muscle strength proficiency.'
  },
  {
    level: 6,
    title: 'PE Varsity',
    minXp: 2700,
    maxXp: 3799,
    badge: '⚡',
    color: 'from-amber-500 to-orange-600',
    accentColor: 'text-orange-700 bg-orange-50 border-orange-200',
    perkDescription: 'Varsity Standard: Superior fitness metrics across DepEd domains.'
  },
  {
    level: 7,
    title: 'Elite Champion',
    minXp: 3800,
    maxXp: 5099,
    badge: '👑',
    color: 'from-rose-500 to-pink-600',
    accentColor: 'text-rose-700 bg-rose-50 border-rose-200',
    perkDescription: 'Elite Tier: Exemplary dedication, personal goals, and peak scores.'
  },
  {
    level: 8,
    title: 'Master of Fitness',
    minXp: 5100,
    maxXp: 999999,
    badge: '🏆',
    color: 'from-yellow-400 via-amber-500 to-yellow-600',
    accentColor: 'text-amber-800 bg-amber-100 border-amber-300',
    perkDescription: 'Supreme Tier: Maximum fitness mastery, consistency, and athletic leadership.'
  }
];

