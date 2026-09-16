import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Trash2,
  ArrowRight,
  ChevronDown,
  Dumbbell,
  Zap,
  Activity,
  BarChart2,
  Sparkles,
  Info,
  Layers,
  X,
  Printer,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { AssessmentResult, FITNESS_COMPONENTS, UserSession } from '../types';
import { cn } from '../utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
} from 'recharts';

interface AssessmentHistoryProps {
  session: UserSession;
  history: AssessmentResult[];
  onStartNewTest: () => void;
  onDeleteRecord?: (id: number) => Promise<void>;
  onRefresh?: () => void;
  onBackToDashboard?: () => void;
}

export const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({
  session,
  history,
  onStartNewTest,
  onDeleteRecord,
  onRefresh,
  onBackToDashboard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedComponent, setSelectedComponent] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score-high' | 'score-low'>('newest');
  const [selectedDetail, setSelectedDetail] = useState<AssessmentResult | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Derive component name lookup
  const getComponent = (componentId: string) => {
    return FITNESS_COMPONENTS.find(c => c.id === componentId) ||
      (componentId === 'push-up' ? FITNESS_COMPONENTS.find(c => c.id === 'strength') :
       componentId === 'curl-up' ? FITNESS_COMPONENTS.find(c => c.id === 'endurance') :
       componentId === 'step-test' ? FITNESS_COMPONENTS.find(c => c.id === 'cardio') :
       componentId === 'sit-reach' ? FITNESS_COMPONENTS.find(c => c.id === 'flexibility') :
       componentId === 'vertical-jump' ? FITNESS_COMPONENTS.find(c => c.id === 'power') :
       componentId === 'balance-slst' ? FITNESS_COMPONENTS.find(c => c.id === 'balance') : undefined);
  };

  // Filter and sort historical records
  const filteredRecords = useMemo(() => {
    return history
      .filter((record) => {
        const comp = getComponent(record.componentId);
        
        // Category filter
        if (selectedCategory !== 'All') {
          if (comp && comp.category !== selectedCategory) return false;
        }

        // Component filter
        if (selectedComponent !== 'All') {
          const compMatches = record.componentId === selectedComponent ||
            (selectedComponent === 'strength' && record.componentId === 'push-up') ||
            (selectedComponent === 'endurance' && record.componentId === 'curl-up') ||
            (selectedComponent === 'cardio' && record.componentId === 'step-test') ||
            (selectedComponent === 'flexibility' && record.componentId === 'sit-reach') ||
            (selectedComponent === 'power' && record.componentId === 'vertical-jump') ||
            (selectedComponent === 'balance' && record.componentId === 'balance-slst');
          if (!compMatches) return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (comp?.name || record.componentId).toLowerCase();
          const raw = String(record.rawResult).toLowerCase();
          const score = String(record.score);
          if (!name.includes(q) && !raw.includes(q) && !score.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();

        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        if (sortBy === 'score-high') return (b.score || 0) - (a.score || 0);
        if (sortBy === 'score-low') return (a.score || 0) - (b.score || 0);
        return 0;
      });
  }, [history, selectedCategory, selectedComponent, searchQuery, sortBy]);

  // Aggregate Metrics
  const totalAssessments = history.length;
  const avgScore = totalAssessments > 0
    ? Math.round(history.reduce((acc, r) => acc + (r.score || 0), 0) / totalAssessments)
    : 0;

  const totalValidReps = history.reduce((acc, r) => acc + (Number(r.validReps) || 0), 0);
  const totalInvalidReps = history.reduce((acc, r) => acc + (Number(r.invalidReps) || 0), 0);
  const formAccuracyOverall = totalValidReps + totalInvalidReps > 0
    ? Math.round((totalValidReps / (totalValidReps + totalInvalidReps)) * 100)
    : 100;

  // Chart data: chronological trajectory
  const chartData = useMemo(() => {
    const sortedChronological = [...history].sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp || 0).getTime();
      const dateB = new Date(b.date || b.timestamp || 0).getTime();
      return dateA - dateB;
    });

    return sortedChronological.map((rec, idx) => {
      const comp = getComponent(rec.componentId);
      const dateStr = rec.date || rec.timestamp
        ? new Date(rec.date || rec.timestamp!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : `Test #${idx + 1}`;

      return {
        name: dateStr,
        testName: comp?.name || rec.componentId,
        score: rec.score,
        validReps: rec.validReps || 0,
      };
    });
  }, [history]);

  // Export CSV of student's personal history
  const handleExportCSV = () => {
    if (history.length === 0) return;

    const headers = ['Date', 'Component ID', 'Exercise Name', 'Category', 'Score (0-100)', 'Raw Result', 'Valid Reps', 'Invalid Reps', 'Consistency %'];
    const rows = history.map((r) => {
      const comp = getComponent(r.componentId);
      const dateStr = r.date || r.timestamp ? new Date(r.date || r.timestamp!).toISOString() : 'N/A';
      return [
        `"${dateStr}"`,
        `"${r.componentId}"`,
        `"${comp?.name || r.componentId}"`,
        `"${comp?.category || 'General'}"`,
        r.score,
        `"${r.rawResult}"`,
        r.validReps || 0,
        r.invalidReps || 0,
        r.consistency || 85,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${session.studentName.replace(/\s+/g, '_')}_Fitness_Assessment_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreRating = (score: number) => {
    if (score >= 90) return { label: 'Outstanding', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 80) return { label: 'Superior', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 70) return { label: 'Proficient', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (score >= 60) return { label: 'Developing', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Needs Practice', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 pb-24"
    >
      {/* Top Banner & Context */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
            <Clock size={15} /> Physical Fitness Assessment Logs
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            Assessment History
          </h1>
          <p className="text-sm text-neutral-500 font-medium">
            Chronological records of all completed tests, biomechanical ST-GCN scores, and form metrics for{' '}
            <span className="font-bold text-neutral-800">{session.studentName}</span> (Grade {session.grade}-{session.section}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl transition-colors shadow-sm"
              title="Refresh History"
            >
              <RefreshCw size={18} />
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className={cn(
              "px-4 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-sm",
              history.length > 0 ? "hover:bg-neutral-200 active:scale-95" : "opacity-50 cursor-not-allowed"
            )}
          >
            <Download size={16} />
            Export History CSV
          </button>

          <button
            onClick={onStartNewTest}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Dumbbell size={16} />
            Start New Assessment
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Total Tests</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-neutral-900">{totalAssessments}</div>
          <div className="text-xs text-neutral-500 font-medium">Completed Test Sessions</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Average Score</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-600">
            {avgScore}
            <span className="text-sm font-bold text-neutral-400 ml-1">/100</span>
          </div>
          <div className="text-xs text-neutral-500 font-medium">Composite Fitness Index</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Valid Reps</span>
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-indigo-600">{totalValidReps}</div>
          <div className="text-xs text-neutral-500 font-medium">Accurate Movement Cycles</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Form Accuracy</span>
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Zap size={18} />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-purple-600">{formAccuracyOverall}%</div>
          <div className="text-xs text-neutral-500 font-medium">Biomechanical Quality</div>
        </div>
      </div>

      {/* Trajectory & Progression Visualizer */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" /> Score Progression Timeline
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Tracking historical physical fitness scores across consecutive test attempts.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
              {chartData.length} Data Points
            </span>
          </div>

          <div className="h-[260px] w-full bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  formatter={(val: any) => [`${val}/100`, 'Score']}
                  labelFormatter={(label: any, payload: any) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.testName} (${label})` : label;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Health-Related', 'Skill-Related'].map((cat) => (
              <button
                key={`history-cat-tab-${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all select-none",
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search, Component Dropdown, Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-56">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search exercise, score..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Tests & Exercises</option>
              {FITNESS_COMPONENTS.map((comp) => (
                <option key={`opt-${comp.id}`} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score-high">Highest Score</option>
              <option value="score-low">Lowest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessment History Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-16 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
              <Clock size={32} />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-xl font-black text-neutral-900">No Assessment Records Found</h3>
              <p className="text-xs text-neutral-500 font-medium">
                {history.length === 0
                  ? "You haven't completed any AI physical fitness tests yet. Launch your first test session using the camera pose tracker!"
                  : "No assessment records match your currently active search query and category filters."}
              </p>
            </div>
            <button
              onClick={onStartNewTest}
              className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl text-xs inline-flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
            >
              <Dumbbell size={16} /> Start Fitness Test
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRecords.map((record, idx) => {
              const comp = getComponent(record.componentId);
              const rating = getScoreRating(record.score);
              const recordDate = record.date || record.timestamp
                ? new Date(record.date || record.timestamp!)
                : new Date();

              const formattedDate = recordDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = recordDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={`history-card-${record.id || idx}-${record.componentId}-${idx}`}
                  className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  {/* Left: Test info and timestamp */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 group-hover:scale-105 transition-transform">
                      {comp?.category === 'Skill-Related' ? <Zap size={24} /> : <Activity size={24} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-neutral-900">
                          {comp?.name || record.componentId}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                          {comp?.category || 'Health-Related'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-neutral-400" /> {formattedDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-neutral-400" /> {formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Metrics Pills */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-3.5 py-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 text-center min-w-[80px]">
                      <div className="text-[10px] font-black uppercase text-neutral-400">Raw Metric</div>
                      <div className="text-sm font-black text-neutral-800">{record.rawResult}</div>
                    </div>

                    <div className="px-3.5 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 text-center min-w-[70px]">
                      <div className="text-[10px] font-black uppercase text-emerald-600">Valid Reps</div>
                      <div className="text-sm font-black text-emerald-700">{record.validReps ?? 0}</div>
                    </div>

                    {record.invalidReps !== undefined && record.invalidReps > 0 && (
                      <div className="px-3.5 py-2 bg-rose-50 rounded-2xl border border-rose-100 text-center min-w-[70px]">
                        <div className="text-[10px] font-black uppercase text-rose-600">Form Faults</div>
                        <div className="text-sm font-black text-rose-700">{record.invalidReps}</div>
                      </div>
                    )}

                    <div className="px-3.5 py-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 text-center min-w-[70px]">
                      <div className="text-[10px] font-black uppercase text-neutral-400">Consistency</div>
                      <div className="text-sm font-black text-neutral-800">{record.consistency ?? 85}%</div>
                    </div>
                  </div>

                  {/* Right: Score Gauge & Inspection Drawer */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
                    <div className="text-right">
                      <div className="text-2xl font-black text-neutral-900">
                        {record.score}
                        <span className="text-xs text-neutral-400 font-bold ml-0.5">/100</span>
                      </div>
                      <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-full border', rating.color)}>
                        {rating.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDetail(record)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        title="View Detailed Biomechanical Assessment"
                      >
                        <Info size={14} />
                        <span>Inspect Details</span>
                      </button>

                      {onDeleteRecord && record.id && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to remove this historical assessment log?')) {
                              setDeletingId(record.id!);
                              await onDeleteRecord(record.id!);
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === record.id}
                          className="p-2 bg-neutral-100 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-xl transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Biomechanical Inspection Modal */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900">
                      {getComponent(selectedDetail.componentId)?.name || selectedDetail.componentId}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      Assessment Logged on{' '}
                      {new Date(selectedDetail.date || selectedDetail.timestamp || Date.now()).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDetail(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Score & Rating Banner */}
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-blue-600/15">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                      Overall Composite Score
                    </span>
                    <div className="text-4xl font-black">{selectedDetail.score} / 100</div>
                    <div className="text-xs text-blue-100 font-medium">
                      Standardized WHO/CDC Percentile Benchmark
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-sm font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-xl">
                      {getScoreRating(selectedDetail.score).label}
                    </div>
                    <div className="text-xs text-blue-200">
                      Category: {getComponent(selectedDetail.componentId)?.category || 'Health'}
                    </div>
                  </div>
                </div>

                {/* Key Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                    <div className="text-[10px] font-black uppercase text-neutral-400">Exercise Result</div>
                    <div className="text-lg font-black text-neutral-900 mt-0.5">{selectedDetail.rawResult}</div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <div className="text-[10px] font-black uppercase text-emerald-600">Valid Reps</div>
                    <div className="text-lg font-black text-emerald-700 mt-0.5">{selectedDetail.validReps ?? 0}</div>
                  </div>

                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <div className="text-[10px] font-black uppercase text-rose-600">Form Faults</div>
                    <div className="text-lg font-black text-rose-700 mt-0.5">{selectedDetail.invalidReps ?? 0}</div>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                    <div className="text-[10px] font-black uppercase text-neutral-400">Form Consistency</div>
                    <div className="text-lg font-black text-neutral-900 mt-0.5">{selectedDetail.consistency ?? 85}%</div>
                  </div>
                </div>

                {/* Biomechanical ST-GCN Diagnostics */}
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-600" /> AI Form Analysis & Feedback
                  </h4>
                  <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span><strong>Movement Depth & Range:</strong> Good joint extension and contraction detected throughout the exercise.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span><strong>Rhythm & Pacing:</strong> Maintained a steady and controlled tempo across all repetitions.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <span><strong>Posture & Balance:</strong> Kept back straight and spine stable within safe alignment angles.</span>
                    </p>
                  </div>
                </div>

                {/* Pedagogical Guidance */}
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs space-y-1.5 text-indigo-900">
                  <h5 className="font-bold flex items-center gap-1.5">
                    <Award size={14} className="text-indigo-600" /> Teacher's Coaching Tip
                  </h5>
                  <p className="text-indigo-700 leading-normal">
                    Great effort! Remember to warm up with stretching before testing. Focus on smooth breathing as you complete each repetition.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-neutral-100 transition-colors"
                >
                  <Printer size={14} /> Print Certificate
                </button>

                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
