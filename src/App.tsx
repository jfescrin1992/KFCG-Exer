/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession, FitnessData, FITNESS_COMPONENTS, AssessmentResult } from './types';
import { Login } from './components/Login';
import { SafetyCheck } from './components/SafetyCheck';
import { Calibration } from './components/Calibration';
import { WarmUp } from './components/WarmUp';
import { Assessment } from './components/Assessment';
import { AssessmentResults } from './components/AssessmentResults';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { Leaderboard } from './components/Leaderboard';
import { AssessmentHistory } from './components/AssessmentHistory';
import { BottomNav, NavModule } from './components/BottomNav';
import { ThesisDefenseModal } from './components/ThesisDefenseModal';
import { Activity, Layout, Info, LogOut, Loader2, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';
import { saveAssessment } from './services/rankingService';
import { getCurrentUser, logoutUser, UserProfile } from './services/authService';
import { fetchAllStudents } from './services/teacherService';
import { fetchMyAssessmentHistory, deleteAssessmentRecordApi } from './services/historyService';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';

type AppPhase = 'login' | 'student-dashboard' | 'safety' | 'calibration' | 'warmup' | 'assessment-select' | 'assessing' | 'dashboard' | 'teacher-dashboard' | 'superadmin-dashboard' | 'leaderboard' | 'history';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('login');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [historyList, setHistoryList] = useState<AssessmentResult[]>([]);
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const [sections, setSections] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [showThesisModal, setShowThesisModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadStudentHistory = async () => {
    try {
      const list = await fetchMyAssessmentHistory();
      setHistoryList(list);
      if (list && list.length > 0) {
        setResults(prev => (prev.length > 0 ? prev : list));
      }
    } catch (error) {
      console.error('Error fetching student assessment history:', error);
    }
  };

  useEffect(() => {
    const checkAuthAndSections = async () => {
      try {
        // Load class sections from PostgreSQL
        const sectionsRes = await fetch('/api/sections');
        if (sectionsRes.ok) {
          const sectionData = await sectionsRes.json();
          if (sectionData && sectionData.length > 0) {
            setSections(sectionData);
          }
        }

        const profile = await getCurrentUser();
        if (profile) {
          handleUserLogin(profile);
        }
      } catch (error) {
        console.error('Initialization check error:', error);
      } finally {
        setInitializing(false);
      }
    };
    checkAuthAndSections();
  }, []);

  const handleUserLogin = async (profile: UserProfile) => {
    setUserProfile(profile);
    if (profile.role === 'superadmin') {
      setPhase('superadmin-dashboard');
    } else if (profile.role === 'teacher') {
      setPhase('teacher-dashboard');
    } else {
      // Map UserProfile to UserSession for student
      setSession({
        studentCode: profile.studentCode || profile.uid,
        studentName: profile.name,
        grade: profile.grade || '11',
        section: profile.section || 'N/A',
        age: '17',
        gender: 'Male',
        height: '170',
        weight: '60',
        date: new Date().toISOString(),
      });

      // Fetch historical results for student
      await loadStudentHistory();
      setPhase('student-dashboard');
    }
  };

  const handleAddSection = async (name: string) => {
    if (!sections.includes(name)) {
      setSections([...sections, name]);
      try {
        const token = localStorage.getItem('auth_token');
        await fetch('/api/sections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ name })
        });
      } catch (error) {
        console.error('Failed to save section to database:', error);
      }
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logoutUser();
    setUserProfile(null);
    setSession(null);
    setResults([]);
    setHistoryList([]);
    setPhase('login');
  };

  const handleAssessmentComplete = async (result: AssessmentResult) => {
    const updatedResults = [...results.filter(r => r.componentId !== result.componentId), result];
    setResults(updatedResults);
    setActiveComponentId(null);
    setPhase('assessment-select');

    // Save to Database
    if (userProfile && session) {
      await saveAssessment(
        userProfile.uid, 
        session.studentName, 
        session.grade, 
        session.section, 
        result
      );
      await loadStudentHistory();
    }
  };

  const generateFeedback = async (currentResults: AssessmentResult[]) => {
    if (!session) return;
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: currentResults, session }),
      });
      const data = await response.json();
      setAiFeedback(data.feedback);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const goToDashboard = () => {
    setPhase('dashboard');
    generateFeedback(results);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-neutral-500 font-black uppercase tracking-widest text-xs">Initializing Secure Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-blue-100">
      {/* Global Navbar */}
      <nav className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Activity size={24} />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-neutral-900">KFCG <span className="text-blue-600">ExerFit</span></span>
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400">AI Fitness Assessment</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowThesisModal(true)}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Open Academic Thesis Defense Hub"
            >
              <GraduationCap size={16} className="text-blue-600" />
              <span className="hidden sm:inline">Thesis Defense Hub</span>
            </button>

            {userProfile && (
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-neutral-800">{userProfile.name}</span>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                    {userProfile.role === 'superadmin' ? 'Super Admin' : userProfile.role === 'teacher' ? 'Faculty Admin' : (userProfile.studentCode || 'Student')}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="py-12 pb-28">
        <AnimatePresence mode="wait">
          {phase === 'login' && <Login key="login" onLogin={handleUserLogin} sections={sections} />}
          
          {phase === 'superadmin-dashboard' && userProfile?.role === 'superadmin' && (
            <SuperAdminDashboard
              key="superadmin-dashboard"
              sections={sections}
              onAddSection={handleAddSection}
              onLogout={handleLogout}
            />
          )}

          {phase === 'student-dashboard' && session && (
            <StudentDashboard 
              key="student-dashboard"
              session={session}
              results={results}
              sections={sections}
              onStartAssessment={() => setPhase('safety')}
              onViewResults={() => setPhase('dashboard')}
              onViewHistory={() => {
                loadStudentHistory();
                setPhase('history');
              }}
            />
          )}

          {phase === 'history' && session && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto px-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Assessment History & Logs</h2>
                  <p className="text-sm text-neutral-500">Your personal physical fitness test records, valid repetitions, and biomechanical scores.</p>
                </div>
                <button
                  onClick={() => setPhase('student-dashboard')}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs hover:bg-neutral-200 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>

              <AssessmentHistory
                session={session}
                history={historyList.length > 0 ? historyList : results}
                onStartNewTest={() => setPhase('safety')}
                onDeleteRecord={async (id) => {
                  await deleteAssessmentRecordApi(id);
                  await loadStudentHistory();
                }}
                onRefresh={loadStudentHistory}
                onBackToDashboard={() => setPhase('student-dashboard')}
              />
            </motion.div>
          )}

          {phase === 'safety' && <SafetyCheck key="safety" onConfirm={() => setPhase('calibration')} onCancel={() => setPhase('student-dashboard')} />}
          
          {phase === 'calibration' && <Calibration key="calibration" onComplete={() => setPhase('warmup')} onCancel={() => setPhase('student-dashboard')} />}
          
          {phase === 'warmup' && <WarmUp key="warmup" onComplete={() => setPhase('assessment-select')} onCancel={() => setPhase('student-dashboard')} />}

          {phase === 'leaderboard' && (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto px-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Leaderboard & Rankings</h2>
                  <p className="text-sm text-neutral-500">Live rankings and physical fitness scores aggregated across all sections.</p>
                </div>
                <button
                  onClick={() => setPhase(userProfile?.role === 'superadmin' ? 'superadmin-dashboard' : userProfile?.role === 'teacher' ? 'teacher-dashboard' : 'student-dashboard')}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs hover:bg-neutral-200 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
              <Leaderboard 
                currentStudentId={userProfile?.uid}
                initialGrade={session?.grade || 'All Grades'}
                initialSection={session?.section || 'All Sections'}
                sections={sections}
              />
            </motion.div>
          )}

          {phase === 'teacher-dashboard' && userProfile?.role === 'teacher' && (
            <TeacherDashboard 
              key="teacher-dashboard" 
              sections={sections}
              teacherProfile={userProfile}
              onLogout={handleLogout} 
            />
          )}

          {phase === 'assessment-select' && (
            <motion.div 
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto px-6 space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black tracking-tight text-neutral-900">Select Assessment</h2>
                <p className="text-neutral-500">Complete at least one assessment from each category for a full report.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {['Health-Related', 'Skill-Related'].map((cat) => (
                  <div key={`category-group-${cat}`} className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 px-2 flex items-center gap-2">
                      <Layout size={14} /> {cat}
                    </h3>
                    <div className="grid gap-4">
                      {FITNESS_COMPONENTS.filter(c => c.category === cat).map(comp => {
                        const hasResult = results.some(r => r.componentId === comp.id);
                        return (
                          <button
                            key={`select-comp-${comp.id}`}
                            onClick={() => {
                              setActiveComponentId(comp.id);
                              setPhase('assessing');
                            }}
                            className={cn(
                              "group text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between",
                              hasResult 
                                ? "bg-white border-green-500 shadow-sm" 
                                : "bg-white border-neutral-100 hover:border-blue-400 hover:shadow-xl shadow-sm"
                            )}
                          >
                            <div className="space-y-1">
                              <h4 className="text-xl font-bold text-neutral-800">{comp.name}</h4>
                              <p className="text-sm text-neutral-500 line-clamp-1">{comp.description}</p>
                            </div>
                            {hasResult ? (
                              <div className="bg-green-100 p-2 rounded-full text-green-600">
                                <CheckCircle size={24} />
                              </div>
                            ) : (
                              <div className="bg-neutral-50 p-2 rounded-full text-neutral-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <ArrowRight size={24} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-12 flex flex-col items-center gap-4">
                <button
                  onClick={goToDashboard}
                  disabled={results.length === 0}
                  className={cn(
                    "px-16 py-5 rounded-3xl font-black text-lg transition-all shadow-2xl w-full max-w-sm",
                    results.length > 0 
                      ? "bg-neutral-900 text-white hover:bg-black shadow-black/20" 
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  )}
                >
                  Generate Final Report
                </button>
                <button
                  onClick={() => setPhase('student-dashboard')}
                  className="text-neutral-400 font-bold hover:text-neutral-900 transition-colors uppercase tracking-widest text-sm"
                >
                  Return to Home
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'assessing' && activeComponentId && (
            <Assessment
              key="assessing"
              component={FITNESS_COMPONENTS.find(c => c.id === activeComponentId)!}
              session={session || undefined}
              onComplete={handleAssessmentComplete}
              onCancel={() => setPhase('assessment-select')}
            />
          )}

          {phase === 'dashboard' && session && (
            <div className="space-y-8 max-w-7xl mx-auto px-6">
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setPhase('student-dashboard')}
                  className="px-6 py-2 bg-white border border-neutral-200 rounded-xl font-bold text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  Back to Dashboard
                </button>
              </div>
              <AssessmentResults key="results" data={{ session, results }} feedback={aiFeedback} />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Info Bar */}
      <footer className="py-12 border-t border-neutral-200 mt-12 bg-white mb-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-neutral-400 text-sm">
          <div className="flex items-center gap-2">
            <Info size={16} /> Teacher Project: Development, Validation, and Comparative Evaluation
          </div>
          <div className="flex gap-8 font-medium">
            <span className="hover:text-neutral-900 cursor-help transition-colors">Grade 11 STEM Focus</span>
            <span className="hover:text-neutral-900 cursor-help transition-colors">AI Pose Detection</span>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Navigation Bar (Students Only) */}
      {userProfile && userProfile.role === 'student' && phase !== 'login' && (
        <BottomNav
          currentPhase={phase}
          onSelectPhase={(targetPhase) => {
            if (targetPhase === 'dashboard') {
              goToDashboard();
            } else if (targetPhase === 'history') {
              loadStudentHistory();
              setPhase('history');
            } else {
              setPhase(targetPhase);
            }
          }}
          userRole={userProfile.role}
          completedResultsCount={results.length}
        />
      )}

      {/* Thesis Defense Hub Modal */}
      <ThesisDefenseModal 
        isOpen={showThesisModal} 
        onClose={() => setShowThesisModal(false)} 
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        userName={userProfile?.name}
        userRole={userProfile?.role}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}

function CheckCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

