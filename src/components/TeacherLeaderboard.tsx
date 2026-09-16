import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, User, Calendar, Activity, ArrowRight } from 'lucide-react';
import { getLeaderboard, RankingEntry } from '../services/rankingService';

interface TeacherLeaderboardProps {
  sections?: string[];
}

export const TeacherLeaderboard: React.FC<TeacherLeaderboardProps> = ({ sections = [] }) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [sectionFilter, setSectionFilter] = useState('All Sections');

  const fetchRankings = async () => {
    setLoading(true);
    const data = await getLeaderboard(20, gradeFilter, sectionFilter);
    setRankings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRankings();
  }, [gradeFilter, sectionFilter]);

  const availableSections = sections.length > 0 ? sections : ['Section A', 'Section B', 'Section C', 'STEM 1', 'STEM 2'];

  return (
    <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Trophy size={24} className="text-yellow-500" /> Top Performing Students
          </h3>
          <p className="text-sm text-neutral-500 font-medium italic">Ranked by average assessment performance score.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-white px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-blue-500/20"
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
            className="bg-white px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>All Sections</option>
            {availableSections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-8">
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={`teacher-leaderboard-skeleton-${i}`} className="h-16 w-full bg-neutral-50 rounded-2xl animate-pulse" />
            ))
          ) : rankings.length > 0 ? (
            rankings.map((entry, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={`teacher-rank-${entry.studentId || 'std'}-${idx}`}
                className="flex items-center gap-6 p-4 rounded-2xl hover:bg-neutral-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center font-black text-xl text-neutral-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  #{idx + 1}
                </div>

                <div className="flex-1">
                  <div className="text-lg font-black text-neutral-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                    {entry.studentName}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">
                    <span className="flex items-center gap-1.5"><User size={12} /> {entry.studentId}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-500">{entry.grade} • {entry.section}</span>
                    <span className="flex items-center gap-1.5"><Activity size={12} /> {entry.assessmentsCount} Tests</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-neutral-900 tabular-nums">
                    {entry.totalScore}
                  </div>
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Avg Fitness Score
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-neutral-50 rounded-[2rem] border border-dashed border-neutral-200">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-neutral-300 mx-auto shadow-sm mb-4">
                <Trophy size={32} />
              </div>
              <h4 className="text-lg font-black text-neutral-900">No Ranking Data</h4>
              <p className="text-neutral-500 font-medium">As students complete assessments, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
