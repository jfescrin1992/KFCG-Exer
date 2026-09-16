import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Sparkles, 
  Trophy, 
  Flame, 
  Zap, 
  Target, 
  CheckCircle2, 
  Lock, 
  Play, 
  Star, 
  Crown, 
  Gift, 
  Award, 
  ShieldCheck, 
  ChevronRight,
  RefreshCw,
  Heart,
  TrendingUp,
  Dumbbell,
  Compass
} from 'lucide-react';
import { AssessmentResult, PersonalGoal, FITNESS_COMPONENTS, UserSession, FITNESS_TIERS } from '../types';
import { calculateStudentFitnessLevel } from '../utils/fitnessLevel';
import { cn } from '../utils';

interface GamifiedMobileViewProps {
  session: UserSession;
  results: AssessmentResult[];
  goals: PersonalGoal[];
  onStartAssessment: (componentId?: string) => void;
  onViewLeaderboard: () => void;
  onViewGoals?: () => void;
}

interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed?: boolean;
  category: 'daily' | 'weekly' | 'boss';
}

export const GamifiedMobileView: React.FC<GamifiedMobileViewProps> = ({
  session,
  results,
  goals,
  onStartAssessment,
  onViewLeaderboard,
}) => {
  const levelInfo = calculateStudentFitnessLevel(results, goals);
  const [activeTab, setActiveTab] = useState<'map' | 'quests' | 'bosses'>('map');
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({});
  const [bonusXpClaimed, setBonusXpClaimed] = useState(0);

  // Derive Quests dynamically based on student activity
  const totalTests = results.length;
  const completedGoalsCount = goals.filter(g => g.completed || g.currentReps >= g.targetReps).length;
  
  const dailyQuests: DailyQuest[] = [
    {
      id: 'quest-1',
      title: 'Daily Warm-up & Test',
      description: 'Complete 1 AI physical assessment test today',
      xpReward: 100,
      icon: '⚡',
      progress: Math.min(1, totalTests),
      maxProgress: 1,
      completed: totalTests >= 1,
      category: 'daily'
    },
    {
      id: 'quest-2',
      title: 'Strength Master',
      description: 'Perform a Push-up or Squat AI assessment',
      xpReward: 150,
      icon: '💪',
      progress: results.some(r => r.componentId === 'push-ups' || r.componentId === 'squats') ? 1 : 0,
      maxProgress: 1,
      completed: results.some(r => r.componentId === 'push-ups' || r.componentId === 'squats'),
      category: 'daily'
    },
    {
      id: 'quest-3',
      title: 'Goal Slayer',
      description: 'Set and reach 1 personal exercise target goal',
      xpReward: 200,
      icon: '🎯',
      progress: Math.min(1, completedGoalsCount),
      maxProgress: 1,
      completed: completedGoalsCount >= 1,
      category: 'weekly'
    },
    {
      id: 'quest-4',
      title: 'DepEd Fitness Triathlon',
      description: 'Complete assessments across 3 different fitness components',
      xpReward: 300,
      icon: '👑',
      progress: Math.min(3, new Set(results.map(r => r.componentId)).size),
      maxProgress: 3,
      completed: new Set(results.map(r => r.componentId)).size >= 3,
      category: 'boss'
    }
  ];

  const handleClaimQuest = (questId: string, xp: number) => {
    setClaimedQuests(prev => ({ ...prev, [questId]: true }));
    setBonusXpClaimed(prev => prev + xp);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Game Mobile HUD Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-neutral-900 to-slate-900 p-5 rounded-[2rem] border border-indigo-900/60 shadow-2xl text-white relative overflow-hidden">
        {/* Ambient sparkle graphics */}
        <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
          <Gamepad2 size={160} />
        </div>

        <div className="relative z-10 space-y-4">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between gap-2">
            {/* Level Badge Pill */}
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-inner">
              <span className="text-xl">{levelInfo.badge}</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  Level {levelInfo.currentLevel}
                </div>
                <div className="text-xs font-black text-white leading-tight">
                  {levelInfo.currentTitle}
                </div>
              </div>
            </div>

            {/* Game Stats (Hearts, Streak, Gems) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full text-amber-300 text-xs font-black">
                <Flame size={14} className="fill-current text-amber-400" />
                <span>{levelInfo.streakCount}x</span>
              </div>

              <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-full text-cyan-300 text-xs font-black">
                <Sparkles size={14} className="text-cyan-400" />
                <span>{(levelInfo.totalXp + bonusXpClaimed).toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* XP Level Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-neutral-300 flex items-center gap-1">
                <Trophy size={13} className="text-yellow-400" />
                <span>Quest Level Progress</span>
              </span>
              <span className="text-cyan-400 font-black">
                {levelInfo.levelProgressPercent}% to Lvl {levelInfo.currentLevel + 1}
              </span>
            </div>

            <div className="h-4 bg-black/40 rounded-full p-0.5 border border-white/15 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.levelProgressPercent}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full shadow-lg shadow-cyan-500/40 relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </motion.div>
            </div>
          </div>

          {/* Direct CTA Launch Arena */}
          <button
            onClick={() => onStartAssessment()}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-98 text-white font-black rounded-2xl text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all"
          >
            <Play size={18} className="fill-current" />
            ENTER AI TEST ARENA (+100 XP)
          </button>
        </div>
      </div>

      {/* Gamified View Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-md">
        <button
          onClick={() => setActiveTab('map')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
            activeTab === 'map'
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
              : "text-neutral-400 hover:text-white"
          )}
        >
          <Gamepad2 size={15} /> Quest Map
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 relative",
            activeTab === 'quests'
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
              : "text-neutral-400 hover:text-white"
          )}
        >
          <Gift size={15} /> Daily Quests
          {dailyQuests.some(q => q.completed && !claimedQuests[q.id]) && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute top-1 right-3" />
          )}
        </button>
        <button
          onClick={() => onViewLeaderboard()}
          className="py-2.5 px-4 rounded-xl text-xs font-black text-amber-400 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-1.5"
        >
          <Crown size={15} /> Ranks
        </button>
      </div>

      {/* TAB CONTENT 1: QUEST MAP (Level Roadmap Nodes) */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Compass size={16} className="text-blue-600" /> Fitness Arena Levels
            </h3>
            <span className="text-xs text-neutral-500 font-bold">
              {FITNESS_COMPONENTS.filter(c => results.some(r => r.componentId === c.id)).length} / {FITNESS_COMPONENTS.length} Unlocked
            </span>
          </div>

          {/* Vertical Winding Level Map Nodes */}
          <div className="relative space-y-4 px-2">
            {/* Connecting Track Line */}
            <div className="absolute top-6 bottom-6 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-b from-blue-500 via-indigo-500 to-neutral-300 rounded-full z-0" />

            {FITNESS_COMPONENTS.map((comp, idx) => {
              const hasCompleted = results.some(r => r.componentId === comp.id);
              const bestScore = results
                .filter(r => r.componentId === comp.id)
                .reduce((max, curr) => Math.max(max, Number(curr.score) || 0), 0);
              const isLocked = idx > 0 && !results.some(r => r.componentId === FITNESS_COMPONENTS[idx - 1].id) && !hasCompleted;

              // Alternate left/right offset for winding game map effect
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={comp.id}
                  className={cn(
                    "relative z-10 flex items-center gap-4",
                    isEven ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  {/* Quest Card Node */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStartAssessment(comp.id)}
                    className={cn(
                      "flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-lg relative overflow-hidden",
                      hasCompleted
                        ? "bg-gradient-to-br from-neutral-900 to-indigo-950 border-indigo-500 text-white"
                        : isLocked
                          ? "bg-neutral-100 border-neutral-200 text-neutral-400 opacity-60"
                          : "bg-white border-blue-500 text-neutral-900 ring-4 ring-blue-500/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                            hasCompleted ? "bg-indigo-500/30 text-indigo-300" : "bg-blue-100 text-blue-700"
                          )}>
                            Stage {idx + 1}
                          </span>
                          {hasCompleted && (
                            <span className="text-amber-400 text-xs font-black flex items-center gap-0.5">
                              <Star size={12} className="fill-current" /> {bestScore} pts
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-sm leading-tight">{comp.name}</h4>
                        <p className={cn(
                          "text-xs line-clamp-1",
                          hasCompleted ? "text-neutral-400" : "text-neutral-500"
                        )}>
                          {comp.description}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isLocked ? (
                          <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-400 flex items-center justify-center">
                            <Lock size={18} />
                          </div>
                        ) : (
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-md transition-transform group-hover:scale-110",
                            hasCompleted ? "bg-indigo-600" : "bg-blue-600 animate-pulse"
                          )}>
                            <Play size={18} className="fill-current ml-0.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Node Circle Indicator on Track */}
                  <div className={cn(
                    "w-10 h-10 rounded-full border-4 flex items-center justify-center font-black text-xs shrink-0 z-20 shadow-md",
                    hasCompleted
                      ? "bg-indigo-600 border-white text-white shadow-indigo-500/40"
                      : isLocked
                        ? "bg-neutral-300 border-neutral-100 text-neutral-600"
                        : "bg-cyan-400 border-white text-neutral-900 animate-bounce"
                  )}>
                    {hasCompleted ? '✓' : idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DAILY QUESTS */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Gift size={16} className="text-amber-500" /> Active Fitness Quests
            </h3>
            <span className="text-xs text-neutral-500 font-bold">
              Resets Daily
            </span>
          </div>

          <div className="space-y-3">
            {dailyQuests.map((quest) => {
              const isClaimed = claimedQuests[quest.id];

              return (
                <div
                  key={quest.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all space-y-3",
                    quest.completed
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-sm"
                      : "bg-white border-neutral-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl w-12 h-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm shrink-0">
                        {quest.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-neutral-900">{quest.title}</h4>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                            +{quest.xpReward} XP
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 font-medium">{quest.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quest Progress Bar & Action */}
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-200/60">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                        <span>Progress</span>
                        <span>{quest.progress} / {quest.maxProgress}</span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>

                    {quest.completed ? (
                      isClaimed ? (
                        <span className="px-3 py-1.5 bg-neutral-200 text-neutral-600 font-bold text-xs rounded-xl flex items-center gap-1">
                          <CheckCircle2 size={14} /> Claimed
                        </span>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleClaimQuest(quest.id, quest.xpReward)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-1.5 animate-bounce"
                        >
                          <Sparkles size={14} /> Claim +{quest.xpReward} XP
                        </motion.button>
                      )
                    ) : (
                      <button
                        onClick={() => onStartAssessment()}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-colors"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
