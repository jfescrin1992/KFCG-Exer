import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Trophy, 
  TrendingUp, 
  Award, 
  Flame, 
  Target, 
  ChevronRight, 
  Info, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight,
  Shield,
  Activity
} from 'lucide-react';
import { FitnessLevelInfo, FITNESS_TIERS } from '../types';
import { cn } from '../utils';

interface FitnessLevelWidgetProps {
  levelInfo: FitnessLevelInfo;
  onStartAssessment?: () => void;
}

export const FitnessLevelWidget: React.FC<FitnessLevelWidgetProps> = ({
  levelInfo,
  onStartAssessment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'tiers' | 'activity'>('tiers');

  const currentTier = FITNESS_TIERS.find(t => t.level === levelInfo.currentLevel) || FITNESS_TIERS[0];
  const nextTier = FITNESS_TIERS.find(t => t.level === levelInfo.currentLevel + 1);

  return (
    <>
      {/* Fitness Level Widget Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-[2rem] border border-neutral-800 shadow-2xl text-white relative overflow-hidden group">
        {/* Background ambient badge glow */}
        <div className="absolute top-0 right-0 p-6 text-8xl opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          {levelInfo.badge}
        </div>

        <div className="relative z-10 space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-3xl shadow-inner shrink-0">
                {levelInfo.badge}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                    <Zap size={13} className="fill-current" /> Student Fitness Level
                  </span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-300">
                    Tier {levelInfo.currentLevel}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                  Level {levelInfo.currentLevel}: {levelInfo.currentTitle}
                </h3>
              </div>
            </div>

            {/* Total XP Badge & Modal Trigger */}
            <div className="flex items-center gap-2.5">
              <div className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                <div>
                  <div className="text-lg font-black text-yellow-400 leading-tight">
                    {levelInfo.totalXp.toLocaleString()} <span className="text-xs font-bold text-neutral-300">XP</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-neutral-300 hover:text-white rounded-2xl transition-all border border-white/10"
                title="View XP Breakdown & Tiers"
              >
                <Info size={18} />
              </button>
            </div>
          </div>

          {/* Level Progress Bar & Next Tier Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <span>Progress to {nextTier ? `Level ${nextTier.level} (${nextTier.title})` : 'Max Level'}</span>
              </span>
              <span className="text-cyan-400 font-black">
                {nextTier ? `${levelInfo.xpInCurrentLevel} / ${levelInfo.xpNeededForNextLevel} XP (${levelInfo.levelProgressPercent}%)` : 'Mastery Achieved 🏆'}
              </span>
            </div>

            <div className="h-3.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.levelProgressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full shadow-lg shadow-cyan-500/30"
              />
            </div>
          </div>

          {/* Highlights & Bonus Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Target size={16} />
              </div>
              <div>
                <div className="text-sm font-black text-white">{levelInfo.completedTestsCount}</div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tests Done</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="text-sm font-black text-emerald-400">+{levelInfo.improvementBonusesEarned}</div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PR Boosts</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Flame size={16} />
              </div>
              <div>
                <div className="text-sm font-black text-amber-400">{levelInfo.streakCount}x</div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Streak</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Trophy size={16} />
              </div>
              <div>
                <div className="text-sm font-black text-purple-400">{levelInfo.completedGoalsCount}</div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Goals Hit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: XP Roadmap, Tier Ladder & History */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                    {levelInfo.badge}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-neutral-900">
                        Fitness Level System
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                        {levelInfo.totalXp} Total XP
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-medium">
                      Earn XP by completing AI assessments, breaking personal records, and completing goals.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl">
                <button
                  onClick={() => setActiveModalTab('tiers')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center",
                    activeModalTab === 'tiers' 
                      ? "bg-white text-neutral-900 shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  Level Tiers Ladder (1-8)
                </button>
                <button
                  onClick={() => setActiveModalTab('activity')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center",
                    activeModalTab === 'activity' 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  XP Activity History ({levelInfo.recentXpLogs.length})
                </button>
              </div>

              {/* Modal Body */}
              {activeModalTab === 'tiers' ? (
                <div className="space-y-4">
                  {/* How XP is earned card */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 space-y-2">
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-blue-600" /> How to Earn XP
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-blue-600 shrink-0" />
                        <span><strong>+100 XP</strong> per completed test</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-blue-600 shrink-0" />
                        <span><strong>+1 XP</strong> per score rating point</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span><strong>+75 XP</strong> Personal Record (Improvement)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-purple-600 shrink-0" />
                        <span><strong>+150 XP</strong> Personal Goal Achieved</span>
                      </div>
                    </div>
                  </div>

                  {/* Level Tiers List */}
                  <div className="space-y-2.5">
                    {FITNESS_TIERS.map((tier) => {
                      const isCurrent = tier.level === levelInfo.currentLevel;
                      const isUnlocked = levelInfo.totalXp >= tier.minXp;

                      return (
                        <div
                          key={tier.level}
                          className={cn(
                            "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
                            isCurrent
                              ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-sm"
                              : isUnlocked
                                ? "bg-neutral-50/80 border-neutral-200"
                                : "bg-neutral-50/40 border-neutral-100 opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-neutral-100 shrink-0">
                              {tier.badge}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-neutral-900">
                                  Level {tier.level}: {tier.title}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 font-medium">
                                {tier.perkDescription}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-neutral-800">
                              {tier.minXp} XP
                            </div>
                            <div className="text-[10px] font-bold text-neutral-400 uppercase">
                              {tier.maxXp >= 99999 ? 'and above' : `up to ${tier.maxXp} XP`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {levelInfo.recentXpLogs.length === 0 ? (
                    <div className="py-12 text-center text-neutral-400 text-xs font-medium">
                      No XP activity recorded yet. Take an AI fitness assessment to start earning XP!
                    </div>
                  ) : (
                    levelInfo.recentXpLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xl w-9 h-9 rounded-lg bg-white border border-neutral-200/80 flex items-center justify-center shrink-0">
                            {log.icon || '⚡'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-neutral-900">{log.title}</div>
                            <div className="text-[10px] text-neutral-500">{log.description}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-600">
                            +{log.xpEarned} XP
                          </span>
                          <div className="text-[9px] text-neutral-400">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
