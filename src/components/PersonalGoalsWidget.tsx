import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Trophy, 
  Trash2, 
  Edit3, 
  Play, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Dumbbell, 
  Activity, 
  X, 
  PlusCircle, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { PersonalGoal, GOAL_EXERCISE_OPTIONS, GoalExerciseOption } from '../types';
import { fetchStudentGoals, createStudentGoal, updateStudentGoal, deleteStudentGoal, logGoalRepProgress } from '../services/goalService';
import { cn } from '../utils';

interface PersonalGoalsWidgetProps {
  onStartExercise?: (exerciseId: string) => void;
  studentId?: string;
  studentName?: string;
}

export const PersonalGoalsWidget: React.FC<PersonalGoalsWidgetProps> = ({
  onStartExercise,
  studentId,
  studentName,
}) => {
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null);
  
  // Form State
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(GOAL_EXERCISE_OPTIONS[0].id);
  const [targetReps, setTargetReps] = useState<number>(GOAL_EXERCISE_OPTIONS[0].defaultTarget);
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  // Quick Log Feedback
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await fetchStudentGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load personal goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [studentId]);

  const selectedExerciseInfo: GoalExerciseOption = 
    GOAL_EXERCISE_OPTIONS.find(e => e.id === selectedExerciseId) || GOAL_EXERCISE_OPTIONS[0];

  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setSelectedExerciseId(GOAL_EXERCISE_OPTIONS[0].id);
    setTargetReps(GOAL_EXERCISE_OPTIONS[0].defaultTarget);
    setCurrentReps(0);
    setTargetDate('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: PersonalGoal) => {
    setEditingGoal(goal);
    setSelectedExerciseId(goal.exerciseId);
    setTargetReps(goal.targetReps);
    setCurrentReps(goal.currentReps);
    setTargetDate(goal.targetDate || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSelectExercise = (exId: string) => {
    setSelectedExerciseId(exId);
    const ex = GOAL_EXERCISE_OPTIONS.find(e => e.id === exId);
    if (ex && !editingGoal) {
      setTargetReps(ex.defaultTarget);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetReps <= 0) {
      setFormError('Target count must be at least 1 repetition or second.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingGoal) {
        const updated = await updateStudentGoal(editingGoal.id, {
          targetReps: Number(targetReps),
          currentReps: Number(currentReps),
          targetDate: targetDate || undefined,
          completed: Number(currentReps) >= Number(targetReps),
        });

        if (updated) {
          setGoals(prev => prev.map(g => g.id === editingGoal.id ? updated : g));
          if (updated.completed && !editingGoal.completed) {
            setCelebrationMsg(`🎉 Congratulations! You achieved your target for ${updated.exerciseName}!`);
            setTimeout(() => setCelebrationMsg(null), 6000);
          }
        }
      } else {
        const created = await createStudentGoal({
          exerciseId: selectedExerciseInfo.id,
          exerciseName: selectedExerciseInfo.name,
          targetReps: Number(targetReps),
          currentReps: Number(currentReps),
          unit: selectedExerciseInfo.unit,
          category: selectedExerciseInfo.category,
          targetDate: targetDate || undefined,
        });

        if (created) {
          setGoals(prev => [created, ...prev]);
          if (created.completed) {
            setCelebrationMsg(`🎉 Awesome! New goal for ${created.exerciseName} achieved!`);
            setTimeout(() => setCelebrationMsg(null), 6000);
          }
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save goal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string | number) => {
    if (!window.confirm('Are you sure you want to remove this personal goal?')) return;
    try {
      const ok = await deleteStudentGoal(goalId);
      if (ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId));
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleQuickAddReps = async (goal: PersonalGoal, amount: number) => {
    try {
      const updated = await logGoalRepProgress(goal.id, amount);
      if (updated) {
        setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
        if (updated.completed && !goal.completed) {
          setCelebrationMsg(`🎯 Milestone reached! You hit your target for ${updated.exerciseName}!`);
          setTimeout(() => setCelebrationMsg(null), 6000);
        }
      }
    } catch (err) {
      console.error('Failed to log reps:', err);
    }
  };

  // Filtered goals
  const filteredGoals = goals.filter(goal => {
    if (activeTab === 'in-progress') return !goal.completed;
    if (activeTab === 'completed') return goal.completed;
    return true;
  });

  const completedCount = goals.filter(g => g.completed).length;
  const inProgressCount = goals.length - completedCount;
  const overallProgressPercent = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + Math.min(100, (g.currentReps / g.targetReps) * 100), 0) / goals.length)
    : 0;

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl shadow-blue-900/5 space-y-6 relative overflow-hidden">
      {/* Background Decorative Icon */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 pointer-events-none">
        <Target size={220} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
            <Target size={15} /> Personal Fitness Targets
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
            Personal Goals
          </h2>
          <p className="text-neutral-500 text-sm font-medium">
            Set target repetition counts for specific exercises and track your completion progress.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Set New Goal</span>
        </button>
      </div>

      {/* Celebration Banner */}
      <AnimatePresence>
        {celebrationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-bold shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-emerald-600 shrink-0" />
              <span>{celebrationMsg}</span>
            </div>
            <button 
              onClick={() => setCelebrationMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
          <div className="text-2xl font-black text-neutral-900">{goals.length}</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mt-0.5">Total Goals</div>
        </div>
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
          <div className="text-2xl font-black text-emerald-700 flex items-center gap-1.5">
            {completedCount}
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mt-0.5">Achieved</div>
        </div>
        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
          <div className="text-2xl font-black text-blue-700">{inProgressCount}</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 mt-0.5">In Progress</div>
        </div>
        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
          <div className="text-2xl font-black text-indigo-700">{overallProgressPercent}%</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mt-0.5">Avg Completion</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'all' 
                ? "bg-white text-neutral-900 shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            All ({goals.length})
          </button>
          <button
            onClick={() => setActiveTab('in-progress')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'in-progress' 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'completed' 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            Achieved 🏆 ({completedCount})
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="py-12 text-center text-neutral-400 text-sm font-medium animate-pulse">
          Loading personal goals...
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="py-12 px-6 text-center bg-neutral-50/80 rounded-3xl border border-dashed border-neutral-200 space-y-3">
          <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <h3 className="text-base font-black text-neutral-800">
            {activeTab === 'completed' 
              ? 'No achieved goals yet' 
              : activeTab === 'in-progress' 
                ? 'No goals currently in progress' 
                : 'No personal exercise goals set'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto font-medium">
            Challenge yourself by setting target repetition goals for Push-ups, Squats, Sit-ups, Planks, and more.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const exInfo = GOAL_EXERCISE_OPTIONS.find(e => e.id === goal.exerciseId);
            const percent = Math.min(100, Math.round((goal.currentReps / goal.targetReps) * 100));
            const isCompleted = goal.completed || goal.currentReps >= goal.targetReps;
            const remaining = Math.max(0, goal.targetReps - goal.currentReps);

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-5 rounded-2xl border transition-all relative flex flex-col justify-between group",
                  isCompleted 
                    ? "bg-gradient-to-br from-emerald-50/40 via-white to-neutral-50/50 border-emerald-200/80 shadow-sm" 
                    : "bg-white border-neutral-200/80 hover:border-blue-200 hover:shadow-md"
                )}
              >
                <div>
                  {/* Top exercise bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm",
                        isCompleted ? "bg-emerald-100 border border-emerald-200" : "bg-blue-50 border border-blue-100"
                      )}>
                        {exInfo?.icon || '🎯'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-neutral-900 leading-tight">
                            {goal.exerciseName}
                          </h4>
                          {isCompleted && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={10} /> Completed
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          {goal.category || 'Fitness Goal'} • {goal.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(goal)}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Goal"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Numbers */}
                  <div className="flex items-baseline justify-between pt-1 mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn(
                        "text-2xl font-black",
                        isCompleted ? "text-emerald-600" : "text-neutral-900"
                      )}>
                        {goal.currentReps}
                      </span>
                      <span className="text-xs font-bold text-neutral-400">
                        / {goal.targetReps} {goal.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-sm font-black",
                        isCompleted ? "text-emerald-600" : percent >= 75 ? "text-indigo-600" : "text-blue-600"
                      )}>
                        {percent}%
                      </span>
                      {!isCompleted && remaining > 0 && (
                        <div className="text-[10px] font-bold text-neutral-400">
                          {remaining} {goal.unit} to go
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full",
                        isCompleted 
                          ? "bg-emerald-500" 
                          : percent >= 75 
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600" 
                            : "bg-blue-600"
                      )}
                    />
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Quick Rep Logging */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mr-0.5">
                      Log:
                    </span>
                    <button
                      onClick={() => handleQuickAddReps(goal, 1)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 font-black rounded-lg text-[11px] transition-colors"
                      title="Add 1 repetition"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuickAddReps(goal, 5)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 font-black rounded-lg text-[11px] transition-colors"
                      title="Add 5 repetitions"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleQuickAddReps(goal, 10)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 font-black rounded-lg text-[11px] transition-colors"
                      title="Add 10 repetitions"
                    >
                      +10
                    </button>
                  </div>

                  {/* Test & Practice link */}
                  {onStartExercise && (
                    <button
                      onClick={() => onStartExercise(goal.exerciseId)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm",
                        isCompleted 
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700" 
                          : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                      )}
                    >
                      <Play size={12} className="fill-current" />
                      <span>Test with AI</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: Set / Edit Personal Goal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-900">
                      {editingGoal ? 'Edit Personal Goal' : 'Set New Personal Goal'}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      Select an exercise and define your target repetition count.
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

              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveGoal} className="space-y-5">
                {/* Exercise Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
                    Select Exercise
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GOAL_EXERCISE_OPTIONS.map((ex) => {
                      const isSelected = selectedExerciseId === ex.id;
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handleSelectExercise(ex.id)}
                          className={cn(
                            "p-3 rounded-xl border text-left flex flex-col justify-between transition-all",
                            isSelected 
                              ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm" 
                              : "bg-neutral-50/60 border-neutral-200/80 hover:bg-neutral-100/70"
                          )}
                        >
                          <div className="text-xl mb-1">{ex.icon}</div>
                          <div className="text-xs font-bold text-neutral-900 leading-tight">
                            {ex.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
                            {ex.category}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Repetitions Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
                      Target {selectedExerciseInfo.unit === 'seconds' ? 'Duration (Seconds)' : 'Repetitions'}
                    </label>
                    <span className="text-[10px] text-neutral-400 font-bold">
                      Recommended: {selectedExerciseInfo.recommendedTargets.intermediate} {selectedExerciseInfo.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={targetReps || ''}
                      onChange={(e) => setTargetReps(Math.max(1, parseInt(e.targetReps || e.target.value, 10) || 0))}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      placeholder="e.g. 25"
                      required
                    />
                    <span className="text-sm font-bold text-neutral-500 shrink-0">
                      {selectedExerciseInfo.unit}
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTargetReps(selectedExerciseInfo.recommendedTargets.beginner)}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[10px] rounded-lg transition-colors"
                    >
                      Beginner ({selectedExerciseInfo.recommendedTargets.beginner})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetReps(selectedExerciseInfo.recommendedTargets.intermediate)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg transition-colors"
                    >
                      Intermediate ({selectedExerciseInfo.recommendedTargets.intermediate})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetReps(selectedExerciseInfo.recommendedTargets.advanced)}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[10px] rounded-lg transition-colors"
                    >
                      Advanced ({selectedExerciseInfo.recommendedTargets.advanced})
                    </button>
                  </div>
                </div>

                {/* Current Progress Starting Reps */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
                    Current Completed {selectedExerciseInfo.unit}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={currentReps}
                    onChange={(e) => setCurrentReps(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    placeholder="0"
                  />
                  <p className="text-[10px] text-neutral-400 font-medium">
                    This will also automatically update when you complete AI fitness assessments.
                  </p>
                </div>

                {/* Optional Target Date */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
                    Target Completion Date <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Submit / Cancel buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Target size={14} />
                    <span>{submitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Set Goal'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
