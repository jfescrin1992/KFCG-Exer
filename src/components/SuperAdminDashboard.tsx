import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Users,
  Layers,
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Filter,
  BarChart3,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Activity,
  FileText,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { cn } from '../utils';
import {
  SuperAdminOverview,
  TeacherRecord,
  SectionOverviewItem,
  SectionStudentInfo,
  fetchSuperAdminOverview,
  createTeacherAccount,
  updateTeacherAssignments,
  deleteTeacherAccount,
  deleteSectionApi
} from '../services/adminService';
import { createStudent, deleteStudent, updateUserClassApi } from '../services/teacherService';
import { fetchAllAssessmentLogs, deleteAssessmentRecordApi } from '../services/historyService';
import { AssessmentResult, FITNESS_COMPONENTS } from '../types';

interface SuperAdminDashboardProps {
  sections: string[];
  onAddSection: (name: string) => void;
  onLogout: () => void;
}

type AdminTab = 'sections' | 'teachers' | 'students' | 'history';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  sections,
  onAddSection,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('sections');
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('All');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('All');

  // Add Teacher Modal
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [newTeacherGrade, setNewTeacherGrade] = useState('11');
  const [newTeacherSections, setNewTeacherSections] = useState<string[]>([]);
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [teacherModalError, setTeacherModalError] = useState('');
  const [teacherModalSuccess, setTeacherModalSuccess] = useState('');

  // Edit Teacher Modal
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [editTeacherGrade, setEditTeacherGrade] = useState('11');
  const [editTeacherSections, setEditTeacherSections] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Add Section Modal
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionNameInput, setNewSectionNameInput] = useState('');
  const [newSectionGradeInput, setNewSectionGradeInput] = useState('11');

  // Add Student Modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('11');
  const [newStudentSection, setNewStudentSection] = useState(sections[0] || 'Section A');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [studentModalError, setStudentModalError] = useState('');
  const [studentModalSuccess, setStudentModalSuccess] = useState('');

  // Edit Student Class Modal
  const [editingStudent, setEditingStudent] = useState<SectionStudentInfo | null>(null);
  const [editStudentGrade, setEditStudentGrade] = useState('11');
  const [editStudentSection, setEditStudentSection] = useState('');
  const [editStudentSubmitting, setEditStudentSubmitting] = useState(false);

  // History logs
  const [historyLogs, setHistoryLogs] = useState<AssessmentResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySectionFilter, setHistorySectionFilter] = useState('All');
  const [historyCompFilter, setHistoryCompFilter] = useState('All');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'teacher' | 'student' | 'section';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchSuperAdminOverview();
      setOverview(data);
    } catch (error) {
      console.error('Failed to load Super Admin overview:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const logs = await fetchAllAssessmentLogs();
      setHistoryLogs(logs);
    } catch (error) {
      console.error('Failed to load history logs:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
    loadHistory();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
    loadHistory();
  };

  // Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherEmail.trim()) {
      setTeacherModalError('Name and email are required.');
      return;
    }

    setTeacherSubmitting(true);
    setTeacherModalError('');
    setTeacherModalSuccess('');

    try {
      await createTeacherAccount({
        name: newTeacherName.trim(),
        email: newTeacherEmail.trim(),
        password: newTeacherPassword.trim() || 'password123',
        grade: newTeacherGrade,
        assignedSections: newTeacherSections
      });

      setTeacherModalSuccess(`Teacher account created and assigned to ${newTeacherSections.length} section(s).`);
      setTimeout(() => {
        setIsAddTeacherOpen(false);
        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherPassword('');
        setNewTeacherSections([]);
        setTeacherModalSuccess('');
      }, 1200);
      await loadData();
    } catch (err: any) {
      setTeacherModalError(err.message || 'Failed to create teacher account.');
    } finally {
      setTeacherSubmitting(false);
    }
  };

  // Open Edit Teacher
  const handleOpenEditTeacher = (t: TeacherRecord) => {
    setEditingTeacher(t);
    setEditTeacherGrade(t.grade || '11');
    setEditTeacherSections(t.assignedSections || []);
    setEditModalError('');
  };

  // Save Edit Teacher
  const handleSaveTeacherAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setEditSubmitting(true);
    setEditModalError('');

    try {
      await updateTeacherAssignments(editingTeacher.uid, editTeacherSections, editTeacherGrade);
      setEditingTeacher(null);
      await loadData();
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update teacher sections.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      setStudentModalError('Name and email are required.');
      return;
    }

    setStudentSubmitting(true);
    setStudentModalError('');
    setStudentModalSuccess('');

    try {
      await createStudent({
        name: newStudentName.trim(),
        email: newStudentEmail.trim(),
        grade: newStudentGrade,
        section: newStudentSection,
        studentCode: newStudentCode.trim() || `STD-${Date.now().toString().slice(-4)}`
      });

      setStudentModalSuccess(`Student enrolled in ${newStudentSection}.`);
      setTimeout(() => {
        setIsAddStudentOpen(false);
        setNewStudentName('');
        setNewStudentEmail('');
        setNewStudentCode('');
        setStudentModalSuccess('');
      }, 1200);
      await loadData();
    } catch (err: any) {
      setStudentModalError(err.message || 'Failed to create student.');
    } finally {
      setStudentSubmitting(false);
    }
  };

  // Save Edit Student Class
  const handleSaveStudentClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setEditStudentSubmitting(true);
    try {
      await updateUserClassApi(editingStudent.uid, editStudentGrade, editStudentSection);
      setEditingStudent(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update student class:', err);
    } finally {
      setEditStudentSubmitting(false);
    }
  };

  // Add Section
  const handleAddSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionNameInput.trim()) return;
    const fullName = `Grade ${newSectionGradeInput} - ${newSectionNameInput.trim()}`;
    onAddSection(fullName);
    setNewSectionNameInput('');
    setIsAddSectionOpen(false);
    setTimeout(loadData, 500);
  };

  // Delete Target Confirm
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'teacher') {
        await deleteTeacherAccount(deleteTarget.id);
      } else if (deleteTarget.type === 'student') {
        await deleteStudent(deleteTarget.id);
      } else if (deleteTarget.type === 'section') {
        await deleteSectionApi(deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!historyLogs.length) return;
    const headers = ['Date', 'Student Name', 'Student ID', 'Grade', 'Section', 'Component', 'Score', 'Valid Reps', 'Invalid Reps'];
    const rows = historyLogs.map(log => [
      `"${log.date ? new Date(log.date).toISOString().slice(0, 10) : 'N/A'}"`,
      `"${log.studentName || 'Student'}"`,
      `"${log.studentCode || log.studentId || 'N/A'}"`,
      `"${log.grade || '11'}"`,
      `"${log.section || 'N/A'}"`,
      `"${log.componentId}"`,
      log.score,
      log.validReps || 0,
      log.invalidReps || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ExerFit_SuperAdmin_Institutional_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Flattened all students for master list
  const allEnrolledStudents: SectionStudentInfo[] = useMemo(() => {
    if (!overview?.sections) return [];
    const map = new Map<string, SectionStudentInfo>();
    overview.sections.forEach(sec => {
      sec.students.forEach(st => {
        map.set(st.uid, st);
      });
    });
    return Array.from(map.values());
  }, [overview]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return allEnrolledStudents.filter(st => {
      const matchSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSection = selectedSectionFilter === 'All' || st.section === selectedSectionFilter;
      const matchGrade = selectedGradeFilter === 'All' || st.grade === selectedGradeFilter;
      return matchSearch && matchSection && matchGrade;
    });
  }, [allEnrolledStudents, searchQuery, selectedSectionFilter, selectedGradeFilter]);

  // Section list from overview + props
  const allAvailableSections = useMemo(() => {
    const list = new Set<string>(sections);
    overview?.sections.forEach(s => list.add(s.sectionName));
    return Array.from(list);
  }, [sections, overview]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Loading Super Admin Control Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest">
              <ShieldAlert size={14} /> Super Admin Privilege
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Institutional Faculty & Section Matrix</h1>
            <p className="text-neutral-400 text-sm max-w-2xl font-medium">
              Oversee school-wide physical fitness assessments, assign faculty to designated sections, and monitor student performance across all classes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-3.5 bg-neutral-800/80 hover:bg-neutral-700 text-white border border-neutral-700 rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2 text-xs font-bold"
              title="Refresh Records"
            >
              <RefreshCw size={16} className={cn(refreshing && "animate-spin text-blue-400")} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 pt-8 border-t border-neutral-800">
          <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/50">
            <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Layers size={14} className="text-blue-400" /> Sections
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{overview?.totalSections || 0}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Active Class Sections</div>
          </div>

          <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/50">
            <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Users size={14} className="text-amber-400" /> Faculty
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{overview?.totalTeachers || 0}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Assigned Teachers</div>
          </div>

          <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/50">
            <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <GraduationCap size={14} className="text-emerald-400" /> Students
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{overview?.totalStudents || 0}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Enrolled Roster</div>
          </div>

          <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/50">
            <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Activity size={14} className="text-indigo-400" /> Assessments
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{overview?.totalAssessments || 0}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Completed Tests</div>
          </div>

          <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/50 col-span-2 sm:col-span-1">
            <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Award size={14} className="text-purple-400" /> School Average
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{overview?.averageScore || 0}%</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Institutional Rating</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('sections')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-wider",
            activeTab === 'sections'
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <Layers size={16} />
          <span>Sections & Assignments ({overview?.sections?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-wider",
            activeTab === 'teachers'
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <Users size={16} />
          <span>Faculty Directory ({overview?.teachers?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-wider",
            activeTab === 'students'
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <GraduationCap size={16} />
          <span>Master Student Roster ({allEnrolledStudents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-wider",
            activeTab === 'history'
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <FileText size={16} />
          <span>School Assessment Audit ({historyLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: SECTIONS & FACULTY ALLOCATION MATRIX */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-neutral-900">Section Matrix & Assigned Faculty</h2>
              <p className="text-xs text-neutral-500">Each card reflects one class section, its assigned faculty supervisor, and enrolled students.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddTeacherOpen(true)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <UserPlus size={14} /> Assign Faculty
              </button>
              <button
                onClick={() => setIsAddSectionOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
              >
                <Plus size={14} /> Add New Section
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {overview?.sections && overview.sections.length > 0 ? (
              overview.sections.map((sec, idx) => (
                <div
                  key={`sec-card-${sec.sectionName}-${idx}`}
                  className="bg-white border border-neutral-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Section Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                          {sec.grade ? `Grade ${sec.grade}` : 'Senior High'}
                        </span>
                        <h3 className="text-xl font-black text-neutral-900 mt-2 tracking-tight">{sec.sectionName}</h3>
                      </div>
                      <button
                        onClick={() => setDeleteTarget({ type: 'section', id: sec.sectionName, name: sec.sectionName })}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Assigned Teachers */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                        <UserCheck size={12} className="text-blue-500" /> Assigned Faculty:
                      </div>
                      {sec.teachers && sec.teachers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {sec.teachers.map((t) => (
                            <div
                              key={`sec-t-${t.uid}`}
                              className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 flex items-center gap-1.5"
                            >
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                                {t.name.slice(0, 1).toUpperCase()}
                              </div>
                              <span>{t.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-800 font-medium flex items-center justify-between">
                          <span>No faculty assigned yet</span>
                          <button
                            onClick={() => setIsAddTeacherOpen(true)}
                            className="text-blue-600 hover:underline font-bold text-[11px]"
                          >
                            Assign Teacher
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-center">
                      <div className="p-3 bg-neutral-50 rounded-xl">
                        <div className="text-xs text-neutral-400 font-bold uppercase">Students</div>
                        <div className="text-lg font-black text-neutral-900">{sec.studentsCount}</div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-xl">
                        <div className="text-xs text-neutral-400 font-bold uppercase">Avg Score</div>
                        <div className="text-lg font-black text-blue-600">{sec.averageScore}%</div>
                      </div>
                    </div>

                    {/* Enrolled Students preview */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        Enrolled Students ({sec.students.length})
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {sec.students.length > 0 ? (
                          sec.students.map((st) => (
                            <div
                              key={`sec-st-${st.uid}`}
                              className="flex items-center justify-between p-2 bg-neutral-50 rounded-xl text-xs hover:bg-neutral-100 transition-colors"
                            >
                              <div className="truncate mr-2">
                                <span className="font-bold text-neutral-800">{st.name}</span>
                                <span className="text-[10px] text-neutral-400 block font-mono">{st.studentCode}</span>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                <span className="font-black text-neutral-900">{st.averageScore}%</span>
                                <span className="text-[10px] text-neutral-400 block">{st.assessmentsCount} tests</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-neutral-400 italic py-2 text-center">
                            No students registered in this section.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        setSelectedSectionFilter(sec.sectionName);
                        setActiveTab('students');
                      }}
                      className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Manage Roster</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-12 bg-white border border-neutral-200 rounded-[2rem] text-center space-y-4">
                <Layers className="mx-auto text-neutral-300" size={48} />
                <h3 className="text-lg font-bold text-neutral-800">No Class Sections Created</h3>
                <p className="text-sm text-neutral-500">Create your initial sections to begin organizing teachers and students.</p>
                <button
                  onClick={() => setIsAddSectionOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
                >
                  Create First Section
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY DIRECTORY & SECTION ALLOCATION */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-neutral-900">Faculty Roster & Section Assignments</h2>
              <p className="text-xs text-neutral-500">
                Configure faculty accounts and dictate exactly which class section(s) each teacher is permitted to view.
              </p>
            </div>
            <button
              onClick={() => setIsAddTeacherOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <UserPlus size={14} /> Add New Teacher
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 pl-6">Faculty Member</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Grade Level</th>
                    <th className="p-4">Assigned Sections (Handling)</th>
                    <th className="p-4 text-center">Assigned Students</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {overview?.teachers && overview.teachers.length > 0 ? (
                    overview.teachers.map((t) => (
                      <tr key={`teacher-row-${t.uid}`} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                              {t.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 text-sm">{t.name}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">UID: {t.uid.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-neutral-600">{t.email}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded-lg font-bold">
                            Grade {t.grade || '11'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {t.assignedSections && t.assignedSections.length > 0 ? (
                              t.assignedSections.map((sec, i) => (
                                <span
                                  key={`t-sec-${t.uid}-${i}`}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg text-[11px] font-bold"
                                >
                                  {sec}
                                </span>
                              ))
                            ) : (
                              <span className="text-neutral-400 italic">No section assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-3 py-1 bg-neutral-100 rounded-full font-black text-neutral-800">
                            {t.studentCount || 0}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditTeacher(t)}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                              title="Edit Section Assignment"
                            >
                              <Edit2 size={13} />
                              <span>Assign Sections</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'teacher', id: t.uid, name: t.name })}
                              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Faculty Account"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400">
                        No faculty accounts found. Add a teacher to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER STUDENT ROSTER */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-neutral-900">Master Student Directory</h2>
              <p className="text-xs text-neutral-500">Full institutional roster across all sections and grades.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <UserPlus size={14} /> Add Student
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white border border-neutral-200 rounded-2xl shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Search by student name, code, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All Sections ({allAvailableSections.length})</option>
                {allAvailableSections.map((sec, idx) => (
                  <option key={`st-filt-sec-${sec}-${idx}`} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All Grades</option>
                {['7', '8', '9', '10', '11', '12'].map((g) => (
                  <option key={`st-filt-g-${g}`} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-neutral-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 pl-6">Student</th>
                    <th className="p-4">Student ID / Code</th>
                    <th className="p-4">Grade & Section</th>
                    <th className="p-4 text-center">Tests Taken</th>
                    <th className="p-4 text-center">Fitness Average</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st) => (
                      <tr key={`master-st-row-${st.uid}`} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {st.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900">{st.name}</div>
                              <div className="text-[10px] text-neutral-400">{st.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-neutral-700">{st.studentCode}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded-lg font-bold">
                            Grade {st.grade} - {st.section}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-neutral-700">{st.assessmentsCount}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full font-black",
                            st.averageScore >= 80 ? "bg-emerald-50 text-emerald-700" :
                            st.averageScore >= 60 ? "bg-blue-50 text-blue-700" :
                            "bg-amber-50 text-amber-700"
                          )}>
                            {st.averageScore}%
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingStudent(st);
                                setEditStudentGrade(st.grade);
                                setEditStudentSection(st.section);
                              }}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                              title="Reassign Student Section"
                            >
                              <Edit2 size={12} />
                              <span>Reassign</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'student', id: st.uid, name: st.name })}
                              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Student Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400">
                        No students matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOL-WIDE AUDIT LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-neutral-900">Institutional Physical Fitness Logs</h2>
              <p className="text-xs text-neutral-500">Live audit trail of every test executed across the entire institution.</p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={historyLogs.length === 0}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download size={14} /> Export Institutional CSV
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white border border-neutral-200 rounded-2xl shadow-sm">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">Filter by Section</label>
              <select
                value={historySectionFilter}
                onChange={(e) => setHistorySectionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All Sections</option>
                {allAvailableSections.map((s, idx) => (
                  <option key={`hist-sec-opt-${s}-${idx}`} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">Filter by Component</label>
              <select
                value={historyCompFilter}
                onChange={(e) => setHistoryCompFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All Test Components</option>
                {FITNESS_COMPONENTS.map((c) => (
                  <option key={`hist-c-${c.id}`} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white border border-neutral-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 pl-6">Timestamp</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Section</th>
                    <th className="p-4">Test Component</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-center">Valid / Invalid</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {historyLogs
                    .filter(log => {
                      const matchSec = historySectionFilter === 'All' || log.section === historySectionFilter;
                      const matchComp = historyCompFilter === 'All' || log.componentId === historyCompFilter;
                      return matchSec && matchComp;
                    })
                    .map((log) => {
                      const comp = FITNESS_COMPONENTS.find(c => c.id === log.componentId);
                      return (
                        <tr key={`log-row-${log.id || Math.random()}`} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="p-4 pl-6 text-neutral-500 font-mono text-[11px]">
                            {log.date ? new Date(log.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-neutral-900">{log.studentName || 'Student'}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">{log.studentCode || log.studentId}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded-lg font-bold">
                              {log.section || 'Unassigned'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-neutral-800">{comp?.name || log.componentId}</td>
                          <td className="p-4 text-center">
                            <span className="font-black text-blue-600 text-sm">{log.score}%</span>
                          </td>
                          <td className="p-4 text-center font-bold">
                            <span className="text-emerald-600">{log.validReps || 0}</span>
                            <span className="text-neutral-300 mx-1">/</span>
                            <span className="text-red-500">{log.invalidReps || 0}</span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {log.id && (
                              <button
                                onClick={async () => {
                                  await deleteAssessmentRecordApi(log.id!);
                                  await loadHistory();
                                  await loadData();
                                }}
                                className="p-2 text-neutral-400 hover:text-red-600 rounded-xl transition-colors"
                                title="Delete Test Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. ADD TEACHER MODAL */}
      <AnimatePresence>
        {isAddTeacherOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full border border-neutral-200 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900">Create Faculty Account</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Assign designated handling sections to this teacher.</p>
                </div>
                <button
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {teacherModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                  {teacherModalError}
                </div>
              )}
              {teacherModalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold">
                  {teacherModalSuccess}
                </div>
              )}

              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. Juan Reyes"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="reyes@school.edu"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Password</label>
                    <input
                      type="text"
                      placeholder="password123"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Primary Grade Level</label>
                  <select
                    value={newTeacherGrade}
                    onChange={(e) => setNewTeacherGrade(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {['7', '8', '9', '10', '11', '12'].map((g) => (
                      <option key={`new-t-g-${g}`} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                {/* Section Allocation Checkboxes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Assign Handling Sections ({newTeacherSections.length} selected)
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">Teacher can only see assigned sections</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-neutral-200 rounded-2xl p-3 space-y-2 bg-neutral-50">
                    {allAvailableSections.map((sec, idx) => {
                      const isChecked = newTeacherSections.includes(sec);
                      return (
                        <label
                          key={`chk-sec-${sec}-${idx}`}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                            isChecked
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-neutral-800 border-neutral-200 hover:border-blue-300"
                          )}
                        >
                          <span>{sec}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTeacherSections([...newTeacherSections, sec]);
                              } else {
                                setNewTeacherSections(newTeacherSections.filter((s) => s !== sec));
                              }
                            }}
                            className="hidden"
                          />
                          {isChecked && <CheckCircle2 size={16} className="text-white" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddTeacherOpen(false)}
                    className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={teacherSubmitting}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {teacherSubmitting ? 'Creating...' : 'Create & Assign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. EDIT TEACHER SECTIONS MODAL */}
      <AnimatePresence>
        {editingTeacher && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full border border-neutral-200 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900">Manage Section Allocation</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Faculty: <span className="font-bold text-neutral-900">{editingTeacher.name}</span></p>
                </div>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {editModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                  {editModalError}
                </div>
              )}

              <form onSubmit={handleSaveTeacherAssignments} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Grade Level</label>
                  <select
                    value={editTeacherGrade}
                    onChange={(e) => setEditTeacherGrade(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {['7', '8', '9', '10', '11', '12'].map((g) => (
                      <option key={`edit-t-g-${g}`} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Permitted Sections ({editTeacherSections.length} selected)
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">Scoped in Teacher Dashboard</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto border border-neutral-200 rounded-2xl p-3 space-y-2 bg-neutral-50">
                    {allAvailableSections.map((sec, idx) => {
                      const isChecked = editTeacherSections.includes(sec);
                      return (
                        <label
                          key={`chk-edit-sec-${sec}-${idx}`}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                            isChecked
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-neutral-800 border-neutral-200 hover:border-blue-300"
                          )}
                        >
                          <span>{sec}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditTeacherSections([...editTeacherSections, sec]);
                              } else {
                                setEditTeacherSections(editTeacherSections.filter((s) => s !== sec));
                              }
                            }}
                            className="hidden"
                          />
                          {isChecked && <CheckCircle2 size={16} className="text-white" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    {editSubmitting ? 'Updating...' : 'Save Assignments'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ADD SECTION MODAL */}
      <AnimatePresence>
        {isAddSectionOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-neutral-200 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900">Add New Section</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Define a new class section for faculty assignment.</p>
                </div>
                <button
                  onClick={() => setIsAddSectionOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSectionSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Grade Level</label>
                  <select
                    value={newSectionGradeInput}
                    onChange={(e) => setNewSectionGradeInput(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {['7', '8', '9', '10', '11', '12'].map((g) => (
                      <option key={`new-sec-g-${g}`} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Section Name / Strand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STEM Einstein, Newton, Section C"
                    value={newSectionNameInput}
                    onChange={(e) => setNewSectionNameInput(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddSectionOpen(false)}
                    className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-neutral-900 hover:bg-black text-white font-bold rounded-2xl text-xs shadow-lg"
                  >
                    Create Section
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ADD STUDENT MODAL */}
      <AnimatePresence>
        {isAddStudentOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full border border-neutral-200 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900">Enroll Student</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Register a new learner in a specific class section.</p>
                </div>
                <button
                  onClick={() => setIsAddStudentOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {studentModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                  {studentModalError}
                </div>
              )}
              {studentModalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold">
                  {studentModalSuccess}
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Student Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clarissa Cruz"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="maria@student.edu"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Student ID / Code</label>
                    <input
                      type="text"
                      placeholder="e.g. STD-2026-001"
                      value={newStudentCode}
                      onChange={(e) => setNewStudentCode(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Grade</label>
                    <select
                      value={newStudentGrade}
                      onChange={(e) => setNewStudentGrade(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {['7', '8', '9', '10', '11', '12'].map((g) => (
                        <option key={`new-st-g-${g}`} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Class Section</label>
                    <select
                      value={newStudentSection}
                      onChange={(e) => setNewStudentSection(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {allAvailableSections.map((sec, idx) => (
                        <option key={`new-st-sec-${sec}-${idx}`} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={studentSubmitting}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    {studentSubmitting ? 'Enrolling...' : 'Enroll Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. EDIT STUDENT CLASS MODAL */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-neutral-200 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900">Reassign Student Section</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Student: <span className="font-bold text-neutral-900">{editingStudent.name}</span></p>
                </div>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveStudentClass} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Grade</label>
                  <select
                    value={editStudentGrade}
                    onChange={(e) => setEditStudentGrade(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {['7', '8', '9', '10', '11', '12'].map((g) => (
                      <option key={`edit-st-g-${g}`} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">New Target Section</label>
                  <select
                    value={editStudentSection}
                    onChange={(e) => setEditStudentSection(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {allAvailableSections.map((sec, idx) => (
                      <option key={`edit-st-sec-${sec}-${idx}`} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editStudentSubmitting}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs disabled:opacity-50 shadow-lg"
                  >
                    {editStudentSubmitting ? 'Updating...' : 'Save Reassignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-neutral-200 shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-neutral-900">Confirm Deletion</h3>
                <p className="text-xs text-neutral-500">
                  Are you sure you want to permanently delete this {deleteTarget.type}: <span className="font-bold text-neutral-900">{deleteTarget.name}</span>?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs disabled:opacity-50 shadow-lg shadow-red-600/20"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
