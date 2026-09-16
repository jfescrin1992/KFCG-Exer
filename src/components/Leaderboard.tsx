import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Award, TrendingUp, User, RefreshCw } from 'lucide-react';
import { getLeaderboard, RankingEntry } from '../services/rankingService';
import { cn } from '../utils';

interface LeaderboardProps {
  currentStudentId?: string;
  initialGrade?: string;
  initialSection?: string;
  sections?: string[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  currentStudentId, 
  initialGrade = 'All Grades', 
  initialSection = 'All Sections',
  sections = []
}) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gradeFilter, setGradeFilter] = useState(initialGrade);
  const [sectionFilter, setSectionFilter] = useState(initialSection);

  const fetchRankings = useCallback(async () => {
    setIsRefreshing(true);
    const data = await getLeaderboard(50, gradeFilter, sectionFilter); 
    setRankings(data);
    setLoading(false);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [gradeFilter, sectionFilter]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-neutral-100 p-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-neutral-100 rounded-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={`leaderboard-loading-skeleton-${i}`} className="h-16 w-full bg-neutral-50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const topRankings = rankings.slice(0, 5);
  const myRankIndex = rankings.findIndex(r => r.studentId === currentStudentId);
  const isMyRankInTop5 = myRankIndex !== -1 && myRankIndex < 5;
  const myRankingEntry = myRankIndex !== -1 ? rankings[myRankIndex] : null;

  const availableSections = sections.length > 0 ? sections : ['Section A', 'Section B', 'Section C', 'STEM 1', 'STEM 2'];

  return (
    <div className="bg-white rounded-[2rem] border border-neutral-100 p-8 shadow-xl shadow-blue-900/5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" /> Student Rankings
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchRankings()}
            className={cn(
              "p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-all",
              isRefreshing && "animate-spin text-blue-500"
            )}
            title="Refresh Rankings"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select 
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-50 px-2 py-2 rounded-xl border-none focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option>All Grades</option>
          <option>Grade 7</option>
          <option>Grade 8</option>
          <option>Grade 9</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>
        <select 
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-50 px-2 py-2 rounded-xl border-none focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option>All Sections</option>
          {availableSections.map((section, idx) => (
            <option key={`leaderboard-sec-${section}-${idx}`} value={section}>{section}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {topRankings.length > 0 ? (
          <>
            {topRankings.map((entry, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={`leaderboard-rank-${entry.studentId || 'std'}-${idx}`}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                  entry.studentId === currentStudentId 
                    ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20" 
                    : "bg-neutral-50 border-transparent hover:border-blue-100 hover:bg-white"
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  {idx === 0 ? (
                    <Trophy size={24} className={entry.studentId === currentStudentId ? "text-white" : "text-yellow-500"} />
                  ) : idx === 1 ? (
                    <Medal size={24} className={entry.studentId === currentStudentId ? "text-white/80" : "text-neutral-400"} />
                  ) : idx === 2 ? (
                    <Medal size={24} className={entry.studentId === currentStudentId ? "text-white/80" : "text-orange-400"} />
                  ) : (
                    <span className={cn(
                      "text-lg font-black",
                      entry.studentId === currentStudentId ? "text-white/60" : "text-neutral-300"
                    )}>#{idx + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-black truncate uppercase tracking-tight transition-colors",
                    entry.studentId === currentStudentId ? "text-white" : "text-neutral-900 group-hover:text-blue-600"
                  )}>
                    {entry.studentName} {entry.studentId === currentStudentId && "(You)"}
                  </div>
                  <div className={cn(
                    "text-[10px] font-bold flex items-center gap-2",
                    entry.studentId === currentStudentId ? "text-white/70" : "text-neutral-400"
                  )}>
                    <span className="flex items-center gap-1"><User size={10} /> {entry.studentId}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-black/5">{entry.grade} - {entry.section}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={cn(
                    "text-xl font-black tabular-nums",
                    entry.studentId === currentStudentId ? "text-white" : "text-neutral-900"
                  )}>
                    {entry.totalScore}
                  </div>
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-tighter",
                    entry.studentId === currentStudentId ? "text-white/70" : "text-blue-500"
                  )}>
                    Avg Score
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Your Rank Row if not in top 5 */}
            {!isMyRankInTop5 && myRankingEntry && (
              <>
                <div className="flex justify-center py-1">
                  <div className="h-1 w-1 bg-neutral-200 rounded-full mx-0.5" />
                  <div className="h-1 w-1 bg-neutral-200 rounded-full mx-0.5" />
                  <div className="h-1 w-1 bg-neutral-200 rounded-full mx-0.5" />
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20 group"
                >
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-black text-white/60">#{myRankIndex + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate uppercase tracking-tight text-white">
                      {myRankingEntry.studentName} (You)
                    </div>
                    <div className="text-[10px] font-bold flex items-center gap-2 text-white/70">
                      <span className="flex items-center gap-1"><User size={10} /> {myRankingEntry.studentId}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-white/10">{myRankingEntry.grade} - {myRankingEntry.section}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black tabular-nums text-white">
                      {myRankingEntry.totalScore}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-tighter text-white/70">
                      Avg Score
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-300 mx-auto">
              <Award size={24} />
            </div>
            <p className="text-sm text-neutral-400 font-medium italic">
              No rankings available yet.<br/>Complete a test to start the board!
            </p>
          </div>
        )}
      </div>

      <button className="w-full py-4 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all">
        View Full Leaderboard
      </button>
    </div>
  );
};
