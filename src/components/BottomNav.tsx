import React from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Flame, 
  ShieldCheck, 
  Trophy, 
  FileText, 
  GraduationCap,
  Clock
} from 'lucide-react';
import { cn } from '../utils';

export type NavModule = 
  | 'student-dashboard' 
  | 'assessment-select' 
  | 'history'
  | 'warmup' 
  | 'safety' 
  | 'calibration'
  | 'leaderboard' 
  | 'dashboard' 
  | 'teacher-dashboard'
  | 'superadmin-dashboard';

interface BottomNavProps {
  currentPhase: string;
  onSelectPhase: (phase: NavModule) => void;
  userRole?: 'student' | 'teacher' | 'superadmin';
  completedResultsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPhase,
  onSelectPhase,
  userRole = 'student',
  completedResultsCount = 0,
}) => {
  if (userRole === 'superadmin') {
    return null;
  }
  // If in active assessment session, we render in minimal mode to not obscure camera
  const isAssessing = currentPhase === 'assessing';

  const navItems = [
    {
      id: userRole === 'teacher' ? 'teacher-dashboard' : 'student-dashboard',
      label: userRole === 'teacher' ? 'Faculty' : 'Home',
      shortLabel: userRole === 'teacher' ? 'Faculty' : 'Home',
      icon: userRole === 'teacher' ? GraduationCap : LayoutDashboard,
      activeMatch: ['student-dashboard', 'teacher-dashboard'],
    },
    {
      id: 'assessment-select',
      label: 'Fitness Tests',
      shortLabel: 'Tests',
      icon: Dumbbell,
      activeMatch: ['assessment-select', 'assessing'],
      badge: completedResultsCount > 0 ? `${completedResultsCount}` : undefined,
    },
    {
      id: 'history',
      label: 'History & Logs',
      shortLabel: 'History',
      icon: Clock,
      activeMatch: ['history'],
    },
    {
      id: 'warmup',
      label: 'Warm-up & Demo',
      shortLabel: 'Warm-up',
      icon: Flame,
      activeMatch: ['warmup'],
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      shortLabel: 'Ranks',
      icon: Trophy,
      activeMatch: ['leaderboard'],
    },
    {
      id: 'dashboard',
      label: 'Results & Report',
      shortLabel: 'Report',
      icon: FileText,
      activeMatch: ['dashboard'],
    },
  ];

  if (isAssessing) {
    return (
      <nav 
        aria-label="Assessment Navigation"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900/90 backdrop-blur-md text-white rounded-full border border-neutral-700/60 shadow-xl flex items-center gap-3 text-xs font-bold"
      >
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Test in Progress</span>
        </div>
        <div className="h-3.5 w-px bg-neutral-700" />
        <button
          onClick={() => onSelectPhase('assessment-select')}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          Exit Assessment
        </button>
      </nav>
    );
  }

  return (
    <nav 
      aria-label="Main App Navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-2xl shadow-blue-950/15 rounded-2xl p-1.5 flex items-center justify-around gap-1 transition-all">
        {navItems.map((item) => {
          const isActive = item.activeMatch.includes(currentPhase);
          const Icon = item.icon;

          return (
            <button
              key={`bottom-nav-${item.id}`}
              onClick={() => onSelectPhase(item.id as NavModule)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-xs font-bold transition-all select-none min-h-[48px]",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]"
                  : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80 active:scale-95"
              )}
            >
              <div className="relative">
                <Icon size={18} className={cn("transition-transform", isActive && "scale-110")} />
                {item.badge && (
                  <span className={cn(
                    "absolute -top-1.5 -right-2.5 text-[9px] font-black px-1.5 py-0.2 rounded-full border shadow-sm",
                    isActive
                      ? "bg-white text-blue-600 border-blue-600"
                      : "bg-blue-600 text-white border-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap hidden sm:inline-block">
                {item.label}
              </span>
              <span className="text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap sm:hidden">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
