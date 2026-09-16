import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Activity, 
  Target, 
  ArrowRight, 
  Calendar, 
  User, 
  Award,
  Zap,
  ChevronRight,
  TrendingUp,
  Clock,
  Play,
  Users,
  Video,
  Film
} from 'lucide-react';
import { UserSession, AssessmentResult, FITNESS_COMPONENTS, PersonalGoal } from '../types';
import { cn, calculateBMI, getBMICategory } from '../utils';
import { Leaderboard } from './Leaderboard';
import { PersonalGoalsWidget } from './PersonalGoalsWidget';
import { FitnessLevelWidget } from './FitnessLevelWidget';
import { GamifiedMobileView } from './GamifiedMobileView';
import { calculateStudentFitnessLevel } from '../utils/fitnessLevel';
import { fetchStudentGoals } from '../services/goalService';
import { fetchWarmupVideos, WarmupVideo } from '../services/videoService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend
} from 'recharts';

interface StudentDashboardProps {
  session: UserSession;
  results: AssessmentResult[];
  sections: string[];
  onStartAssessment: () => void;
  onViewResults: () => void;
  onViewHistory?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  session, 
  results, 
  sections,
  onStartAssessment, 
  onViewResults,
  onViewHistory
}) => {
  const [peerAverages, setPeerAverages] = useState<Array<{ componentId: string; avgScore: number; avgConsistency: number }>>([]);
  const [loadingPeers, setLoadingPeers] = useState(true);
  const [demoVideos, setDemoVideos] = useState<WarmupVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [studentGoals, setStudentGoals] = useState<PersonalGoal[]>([]);
  const [dashboardView, setDashboardView] = useState<'classic' | 'game'>('game');

  useEffect(() => {
    const fetchPeerAverages = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/sections/averages', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setPeerAverages(data);
        }
      } catch (err) {
        console.error('Error fetching peer averages:', err);
      } finally {
        setLoadingPeers(false);
      }
    };

    const loadDemoVideos = async () => {
      try {
        const vids = await fetchWarmupVideos();
        setDemoVideos(vids);
      } catch (err) {
        console.error('Error loading demo videos:', err);
      } finally {
        setLoadingVideos(false);
      }
    };

    const loadGoals = async () => {
      try {
        const goals = await fetchStudentGoals();
        setStudentGoals(goals);
      } catch (err) {
        console.error('Error loading goals for level calculation:', err);
      }
    };

    fetchPeerAverages();
    loadDemoVideos();
    loadGoals();
  }, [session.section, session.studentCode]);

  // Compute live Fitness Level and XP information based on student assessments and improvements
  const levelInfo = React.useMemo(() => {
    return calculateStudentFitnessLevel(results, studentGoals);
  }, [results, studentGoals]);

  const completedCount = results.length;
  const totalCount = FITNESS_COMPONENTS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Calculate high-level scores if results exist
  const healthResults = results.filter(r => 
    FITNESS_COMPONENTS.find(c => c.id === r.componentId)?.category === 'Health-Related'
  );
  const skillResults = results.filter(r => 
    FITNESS_COMPONENTS.find(c => c.id === r.componentId)?.category === 'Skill-Related'
  );

  const avgHealth = healthResults.length > 0 
    ? Math.round(healthResults.reduce((acc, r) => acc + r.score, 0) / healthResults.length) 
    : null;
  
  const avgSkill = skillResults.length > 0 
    ? Math.round(skillResults.reduce((acc, r) => acc + r.score, 0) / skillResults.length) 
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 space-y-8 pb-20"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest">
            <Zap size={14} /> Welcome Back
          </div>
          <h1 className="text-4xl font-black text-neutral-900 tracking-tight">
            Hello, <span className="text-blue-600">{session.studentName}</span>
          </h1>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-neutral-100 shadow-sm text-sm font-bold text-neutral-600">
              <User size={14} className="text-blue-500" /> {session.studentCode}
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-neutral-100 shadow-sm text-sm font-bold text-neutral-600">
              <Calendar size={14} className="text-blue-500" /> Grade {session.grade}-{session.section}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Mode Switcher Pill */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-full border border-neutral-200/80 w-full sm:w-auto">
            <button
              onClick={() => setDashboardView('game')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2.5 rounded-full font-black text-xs transition-all flex items-center justify-center gap-1.5",
                dashboardView === 'game'
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              🎮 Arcade View
            </button>
            <button
              onClick={() => setDashboardView('classic')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2.5 rounded-full font-black text-xs transition-all flex items-center justify-center gap-1.5",
                dashboardView === 'classic'
                  ? "bg-white text-neutral-900 shadow-md border border-neutral-200"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              📊 Classic Dashboard
            </button>
          </div>

          {onViewHistory && (
            <button 
              onClick={onViewHistory}
              className="w-full sm:w-auto px-5 py-3.5 bg-white border border-neutral-200/90 text-neutral-800 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-neutral-50 transition-all shadow-sm active:scale-95 group"
            >
              <Clock size={16} className="text-blue-600 group-hover:rotate-12 transition-transform" />
              History
            </button>
          )}

          <button 
            onClick={onStartAssessment}
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-95 group"
          >
            <Play size={16} className="fill-current" />
            Start Assessment
          </button>
        </div>
      </div>

      {dashboardView === 'game' ? (
        <GamifiedMobileView 
          session={session}
          results={results}
          goals={studentGoals}
          onStartAssessment={(compId) => onStartAssessment()}
          onViewLeaderboard={onViewResults}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Stats Hub */}
        <div className="lg:col-span-2 space-y-8">
          {/* Fitness Level & XP Progress System */}
          <FitnessLevelWidget 
            levelInfo={levelInfo} 
            onStartAssessment={onStartAssessment} 
          />

          {/* Progress Overview Card */}
          <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <Activity size={200} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-neutral-900">Assessment Progress</h2>
                  <p className="text-neutral-500 font-medium">Keep going to unlock your full fitness profile.</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-blue-600">{progressPercent}%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-4 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="text-2xl font-black text-neutral-900">{completedCount}</div>
                  <div className="text-[10px] font-black uppercase text-neutral-400 mt-1">Completed</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="text-2xl font-black text-neutral-900">{totalCount - completedCount}</div>
                  <div className="text-[10px] font-black uppercase text-neutral-400 mt-1">Remaining</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 md:col-span-2 flex items-center justify-between group/btn cursor-pointer" onClick={onStartAssessment}>
                  <div>
                    <div className="text-sm font-bold text-blue-700">New Test</div>
                    <div className="text-[10px] font-bold text-blue-500">Available Now</div>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white group-hover/btn:scale-110 transition-transform">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Body Stats */}
            <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <User size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900">Body Stats</h3>
                <p className="text-sm text-neutral-500 font-medium">{session.height || '--'}cm • {session.weight || '--'}kg</p>
              </div>
              <div className="flex items-end justify-between pt-2">
                <div className="text-3xl font-black text-neutral-900">
                  {calculateBMI(session.height, session.weight)}<span className="text-sm text-neutral-400 font-bold ml-1">BMI</span>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  session.height ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-400"
                )}>
                  {getBMICategory(calculateBMI(session.height, session.weight)).label}
                </div>
              </div>
            </div>

            {/* Health Metrics */}
            <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  avgHealth ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"
                )}>
                  {avgHealth ? 'Active' : 'Pending'}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900">Health-Related</h3>
                <p className="text-sm text-neutral-500 font-medium">Strength, endurance, and flexibility.</p>
              </div>
              <div className="flex items-end justify-between pt-2">
                <div className="text-3xl font-black text-neutral-900">
                  {avgHealth || '--'}<span className="text-sm text-neutral-400 font-bold ml-1">/ 100</span>
                </div>
                <div className="text-xs font-bold text-red-500 flex items-center gap-1">
                  {healthResults.length} / 5 Tests
                </div>
              </div>
            </div>

            {/* Skill Metrics */}
            <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  avgSkill ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"
                )}>
                  {avgSkill ? 'Active' : 'Pending'}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900">Skill-Related</h3>
                <p className="text-sm text-neutral-500 font-medium">Agility, balance, and coordination.</p>
              </div>
              <div className="flex items-end justify-between pt-2">
                <div className="text-3xl font-black text-neutral-900">
                  {avgSkill || '--'}<span className="text-sm text-neutral-400 font-bold ml-1">/ 100</span>
                </div>
                <div className="text-xs font-bold text-purple-500 flex items-center gap-1">
                  {skillResults.length} / 5 Tests
                </div>
              </div>
            </div>
          </div>

          {/* Personal Goals & Target Tracker */}
          <PersonalGoalsWidget 
            onStartExercise={() => onStartAssessment()}
            studentId={session.studentCode || session.uid}
            studentName={session.studentName}
          />

          {/* Peer Average Comparison Panel */}
          <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl shadow-blue-900/5 space-y-6 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
                  <Users size={22} className="text-blue-600" /> Peer Average Comparison
                </h3>
                <p className="text-neutral-500 text-sm font-medium">
                  Compare your personal AI assessment scores against the live average for section <span className="font-bold text-neutral-800">{session.section || 'N/A'}</span>.
                </p>
              </div>
            </div>

            <div className="h-[280px] w-full bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={FITNESS_COMPONENTS.map(comp => {
                    const studentResult = results.find(r => r.componentId === comp.id);
                    const peerResult = peerAverages.find(pa => pa.componentId === comp.id);
                    return {
                      name: comp.name.replace(' Endurance', '').replace(' Strength', ''),
                      'Your Score': studentResult ? studentResult.score : 0,
                      'Peer Average': peerResult ? peerResult.avgScore : (comp.id === 'cardio' ? 74 : comp.id === 'strength' ? 68 : comp.id === 'endurance' ? 71 : 70)
                    };
                  })}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#737373', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#737373', fontSize: 10, fontWeight: 700 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  />
                  <RechartsLegend 
                    verticalAlign="top" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}
                  />
                  <Bar name="Your Score" dataKey="Your Score" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar name="Peer Average" dataKey="Peer Average" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-4 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Comparative Insights</h4>
                <p className="text-xs text-indigo-700 leading-normal">
                  Values represent normalized percentile-based scores calculated on pediatric guidelines. Zero-score bars represent categories you have not yet assessed in this session.
                </p>
              </div>
            </div>
          </div>

          {/* Warm-up & Demonstration Videos Showcase */}
          <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl shadow-blue-900/5 space-y-6 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
                  <Film size={22} className="text-indigo-600" /> Demonstration & Warm-up Videos
                </h3>
                <p className="text-neutral-500 text-sm font-medium">
                  Watch official PE faculty warm-up routines and exercise demonstrations to prepare for your physical test.
                </p>
              </div>
              <button
                onClick={onStartAssessment}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Play size={14} /> Start PE Warm-Up Routine
              </button>
            </div>

            {demoVideos.length === 0 ? (
              <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-neutral-400 font-medium text-xs">
                No videos currently assigned by faculty.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoVideos.map((vid) => (
                  <div key={vid.id} className="bg-neutral-50 rounded-2xl border border-neutral-200/80 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                    <div className="relative aspect-video bg-neutral-900 flex items-center justify-center overflow-hidden">
                      {vid.url.includes('youtube.com/embed') ? (
                        <iframe
                          src={vid.url}
                          title={vid.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : vid.url.startsWith('data:video') || vid.url.endsWith('.mp4') || vid.url.endsWith('.webm') ? (
                        <video src={vid.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <iframe
                          src={vid.url}
                          title={vid.title}
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                        {vid.duration}s
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {vid.category}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">PE Faculty</span>
                        </div>
                        <h4 className="font-bold text-neutral-900 text-sm leading-snug">{vid.title}</h4>
                        {vid.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{vid.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How ExerFit AI Works: Clean, Friendly & Easy to Understand */}
          <div className="bg-gradient-to-br from-neutral-900 via-indigo-950 to-neutral-900 p-8 rounded-[2rem] border border-neutral-800 shadow-2xl relative overflow-hidden text-white mt-8">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Award size={220} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <span className="text-cyan-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Zap size={14} /> Easy Guide
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">How ExerFit AI Measures Your Fitness</h2>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  ExerFit uses smart camera tracking to measure your physical fitness safely and accurately in three simple steps:
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-white">Interactive Fun Test</h4>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Follow fun on-screen targets, audio beeps, and visual cues while doing your standard PE fitness exercises.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-white">Smart Body Tracking</h4>
                  <p className="text-xs text-neutral-300 leading-normal">
                    The AI camera checks your posture, knee and elbow angles, and movement speed to count valid repetitions automatically.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-white">Instant Feedback & Score</h4>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Get an instant 0–100 score based on official DepEd and WHO physical fitness standards with tips to improve.
                  </p>
                </div>
              </div>

              {/* Score Guide Bar */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-bold text-neutral-300 mb-2">Score Meaning:</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl text-emerald-300 font-bold text-center">
                    90–100: Outstanding
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl text-blue-300 font-bold text-center">
                    80–89: Superior
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-xl text-indigo-300 font-bold text-center">
                    70–79: Proficient
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl text-amber-300 font-bold text-center">
                    60–69: Developing
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl text-rose-300 font-bold text-center col-span-2 sm:col-span-1">
                    &lt;60: Needs Practice
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Actions & History */}
        <div className="space-y-8">
          <Leaderboard 
            currentStudentId={session.studentCode} 
            sections={sections}
          />
          
          {/* Recent Activity Mini-List */}
          <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 space-y-6">
            <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" /> Recent Activity
            </h3>
            
            <div className="space-y-4">
              {results.length > 0 ? (
                results.slice(-3).reverse().map((result, idx) => {
                  const component = FITNESS_COMPONENTS.find(c => c.id === result.componentId);
                  return (
                    <div key={`recent-activity-${result.componentId || 'item'}-${result.date || idx}-${idx}`} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {result.score}
                      </div>
                      <div className="flex-grow">
                        <div className="text-sm font-bold text-neutral-800">{component?.name}</div>
                        <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-tight">
                          {new Date(result.date).toLocaleDateString()}
                        </div>
                      </div>
                      <TrendingUp size={14} className="text-green-500 opacity-50" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-neutral-400 font-medium italic">No recent activity found.</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {onViewHistory && (
                <button 
                  onClick={onViewHistory}
                  className="w-full py-3 bg-blue-50 text-blue-700 font-black rounded-xl text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={14} /> View All Assessment History
                </button>
              )}

              {results.length > 0 && (
                <button 
                  onClick={onViewResults}
                  className="w-full py-3 bg-neutral-50 text-neutral-600 font-bold rounded-xl text-xs hover:bg-neutral-100 transition-colors"
                >
                  View Summary Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </motion.div>
  );
};
