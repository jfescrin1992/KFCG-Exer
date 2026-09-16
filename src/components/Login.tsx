import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Shield, Mail, ArrowRight, Hash, GraduationCap, School } from 'lucide-react';
import { cn } from '../utils';
import { loginUser, registerUser, loginDemoUser, fetchPublicTeachers, UserProfile } from '../services/authService';

interface LoginProps {
  onLogin: (profile: UserProfile) => void;
  sections: string[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, sections }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [teachersList, setTeachersList] = useState<Array<{ uid: string; name: string; section?: string }>>([
    { uid: 'demo-faculty-01', name: 'Prof. Maria Santos' },
    { uid: 'demo-faculty-02', name: 'Prof. Roberto Mendoza' },
    { uid: 'demo-faculty-03', name: 'Dr. Elena Garcia' },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    lrn: '',
    teacherName: 'Prof. Maria Santos',
    grade: '11',
    section: sections[0] || 'Section A',
  });

  useEffect(() => {
    fetchPublicTeachers().then(teachers => {
      if (teachers && teachers.length > 0) {
        setTeachersList(teachers);
        setFormData(prev => ({
          ...prev,
          teacherName: teachers[0].name
        }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const profile = await loginUser(formData.email, formData.password);
        onLogin(profile);
      } else {
        // Validation for Student Registration
        if (!formData.name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!formData.lrn.trim()) {
          throw new Error('Please enter your 12-digit Learner Reference Number (LRN).');
        }
        if (!formData.teacherName) {
          throw new Error('Please select your assigned PE teacher.');
        }

        const profile = await registerUser(formData.email, formData.password, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: 'student',
          grade: formData.grade,
          section: formData.section,
          studentCode: formData.lrn.trim(),
          teacherName: formData.teacherName,
        });
        onLogin(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (type: 'student' | 'teacher' | 'superadmin') => {
    setError('');
    setLoading(true);
    try {
      const profile = await loginDemoUser(type);
      onLogin(profile);
    } catch (err: any) {
      setError(`Demo access unavailable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-neutral-200/90 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5"
      >
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/30">
            {authMode === 'register' ? <GraduationCap size={32} /> : <Shield size={32} />}
          </div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">KFCG ExerFit</h1>
          {authMode === 'register' ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-700 text-xs font-black uppercase tracking-wider">
              <span>🎓</span> Student Registration Only
            </div>
          ) : (
            <p className="text-neutral-500 font-medium text-sm mt-1">
              Welcome back to your fitness portal
            </p>
          )}
        </div>

        {/* Quick Demo Access (Only on Login) */}
        {authMode === 'login' && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px bg-neutral-100 flex-1"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Quick Demo Access</span>
              <span className="h-px bg-neutral-100 flex-1"></span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group"
              >
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                  <User size={16} />
                </div>
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('teacher')}
                className="flex flex-col items-center gap-2 p-3 bg-neutral-900 rounded-2xl border border-neutral-800 hover:bg-black transition-all group"
              >
                <div className="w-8 h-8 bg-neutral-800 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <Shield size={16} />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('superadmin')}
                className="flex flex-col items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200/80 hover:bg-amber-100 transition-all group"
              >
                <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <Lock size={16} />
                </div>
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">Admin</span>
              </button>
            </div>

            <div className="relative py-2 flex items-center gap-2">
              <div className="h-px bg-neutral-100 flex-1"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Or enter credentials</span>
              <div className="h-px bg-neutral-100 flex-1"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl text-center shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 ml-1">Student Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* LRN Number */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 ml-1 flex items-center justify-between">
                  <span>Learner Reference Number (LRN)</span>
                  <span className="text-[10px] text-blue-600 font-bold">12 Digits</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="e.g. 123456789012"
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-sm tracking-wide"
                    value={formData.lrn}
                    onChange={(e) => setFormData({ ...formData, lrn: e.target.value })}
                  />
                </div>
              </div>

              {/* Assigned PE Teacher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 ml-1">Assigned PE Teacher</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={18} />
                  <select 
                    required
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm appearance-none cursor-pointer"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  >
                    {teachersList.map((t) => (
                      <option key={`teacher-opt-${t.uid}`} value={t.name}>
                        {t.name} {t.section ? `(${t.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grade & Section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 ml-1">Grade Level</label>
                  <select 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm cursor-pointer"
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  >
                    {['7', '8', '9', '10', '11', '12'].map(g => (
                      <option key={`login-grade-opt-${g}`} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 ml-1">Section</label>
                  <select 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm cursor-pointer"
                    value={formData.section}
                    onChange={e => setFormData({...formData, section: e.target.value})}
                  >
                    {sections.map((s, idx) => (
                      <option key={`login-sec-opt-${s}-${idx}`} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="email"
                required
                placeholder="e.g. student@school.edu.ph"
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 text-sm"
          >
            {loading ? 'Processing...' : authMode === 'login' ? 'Login to Portal' : 'Register Student Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
          <button
            onClick={() => {
              setError('');
              setAuthMode(authMode === 'login' ? 'register' : 'login');
            }}
            className="text-xs font-bold text-neutral-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
          >
            {authMode === 'login' ? (
              <>Are you a student looking to sign up? <span className="text-blue-600 font-black">Register here</span></>
            ) : (
              <>Already registered? <span className="text-blue-600 font-black">Sign in here</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
