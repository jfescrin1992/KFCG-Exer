import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BarChart3, 
  Download, 
  TrendingUp, 
  ClipboardList, 
  LogOut, 
  Plus, 
  Loader2, 
  UserPlus, 
  CheckCircle2, 
  Video, 
  Upload, 
  Link, 
  Play, 
  Trash2, 
  Film, 
  Sparkles,
  LayoutDashboard,
  Trophy,
  Search,
  RefreshCw,
  ExternalLink,
  Layers,
  GraduationCap,
  AlertTriangle,
  X,
  Clock,
  FileText,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '../utils';
import { AssessmentResult, FITNESS_COMPONENTS } from '../types';
import { TeacherLeaderboard } from './TeacherLeaderboard';
import { fetchAllStudents, createStudent, deleteStudent, StudentPerformance } from '../services/teacherService';
import { UserProfile } from '../types';
import { fetchWarmupVideos, addWarmupVideo, deleteWarmupVideo, WarmupVideo } from '../services/videoService';
import { fetchAllAssessmentLogs, deleteAssessmentRecordApi } from '../services/historyService';

interface TeacherDashboardProps {
  sections: string[];
  teacherProfile?: UserProfile | null;
  onLogout: () => void;
}

type FacultyTab = 'overview' | 'students' | 'history' | 'videos' | 'leaderboard';

interface DeleteConfirmationState {
  type: 'student' | 'video';
  id: string | number;
  title: string;
  subtitle?: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ sections, teacherProfile, onLogout }) => {
  const [activeTab, setActiveTab] = useState<FacultyTab>('overview');
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Scoped handling sections for this teacher
  const teacherAssignedSections = React.useMemo(() => {
    if (!teacherProfile?.section) return [];
    return teacherProfile.section.split(',').map(s => s.trim()).filter(Boolean);
  }, [teacherProfile?.section]);

  const availableSections = React.useMemo(() => {
    if (teacherAssignedSections.length > 0) {
      return teacherAssignedSections;
    }
    return sections;
  }, [teacherAssignedSections, sections]);

  const [sectionFilter, setSectionFilter] = useState('All Sections');

  // Add New Student modal state
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('11');
  const [newStudentSection, setNewStudentSection] = useState(availableSections[0] || 'Section A');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [addStudentError, setAddStudentError] = useState('');
  const [addStudentSuccess, setAddStudentSuccess] = useState('');
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  // Student class editor modal state
  const [isEditingStudentClass, setIsEditingStudentClass] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentPerformance | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editError, setEditError] = useState('');

  // Demonstration & Warm-up Videos state
  const [videos, setVideos] = useState<WarmupVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoCategoryFilter, setVideoCategoryFilter] = useState('All');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoCategory, setVideoCategory] = useState('Warmup Routine');
  const [videoType, setVideoType] = useState<'link' | 'upload'>('link');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoDuration, setVideoDuration] = useState(15);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState('');
  const [videoError, setVideoError] = useState('');
  const [videoSuccess, setVideoSuccess] = useState('');
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<WarmupVideo | null>(null);

  // Unified Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmationState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Assessment History Logs state
  const [historyLogs, setHistoryLogs] = useState<AssessmentResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyGradeFilter, setHistoryGradeFilter] = useState('All Grades');
  const [historySectionFilter, setHistorySectionFilter] = useState('All Sections');
  const [historyComponentFilter, setHistoryComponentFilter] = useState('All');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedDetailLog, setSelectedDetailLog] = useState<AssessmentResult | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    loadVideos();
    loadHistoryLogs();
  }, []);

  const loadHistoryLogs = async () => {
    setLoadingHistory(true);
    try {
      const logs = await fetchAllAssessmentLogs();
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load assessment history logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExportHistoryCSV = () => {
    if (historyLogs.length === 0) return;

    const headers = [
      'Date & Time',
      'Student Name',
      'Student ID',
      'Grade',
      'Section',
      'Component ID',
      'Test Name',
      'Score (0-100)',
      'Raw Result',
      'Valid Reps',
      'Invalid Reps'
    ];

    const rows = historyLogs.map(r => {
      const comp = FITNESS_COMPONENTS.find(c => c.id === r.componentId);
      const dateStr = r.date || r.timestamp ? new Date(r.date || r.timestamp!).toISOString() : 'N/A';
      return [
        `"${dateStr}"`,
        `"${r.studentName || 'Student'}"`,
        `"${r.studentCode || r.studentId || 'N/A'}"`,
        `"${r.grade || '11'}"`,
        `"${r.section || ''}"`,
        `"${r.componentId}"`,
        `"${comp?.name || r.componentId}"`,
        r.score,
        `"${r.rawResult}"`,
        r.validReps || 0,
        r.invalidReps || 0
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExerFit_All_Assessment_History_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const videoList = await fetchWarmupVideos();
      setVideos(videoList);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading teacher dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      setAddStudentError('Student Name and Email are required.');
      return;
    }
    setAddStudentError('');
    setAddStudentSuccess('');
    setIsSubmittingStudent(true);

    try {
      const created = await createStudent({
        name: newStudentName.trim(),
        email: newStudentEmail.trim(),
        password: newStudentPassword.trim() || 'password123',
        grade: newStudentGrade,
        section: newStudentSection || (sections[0] || 'Section A'),
        studentCode: newStudentCode.trim() || undefined,
      });

      setStudents(prev => [created, ...prev]);
      setAddStudentSuccess(`Successfully registered student ${created.name}!`);
      
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPassword('');
      setNewStudentCode('');

      setTimeout(() => {
        setIsAddingStudent(false);
        setAddStudentSuccess('');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create student:', err);
      setAddStudentError(err.message || 'Failed to add new student.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
      setVideoError('File size is too large. Please select a video under 40MB.');
      return;
    }

    setSelectedFile(file);
    setVideoError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      setVideoError('Video Title is required.');
      return;
    }

    let finalUrl = videoUrlInput.trim();
    if (videoType === 'upload') {
      if (!uploadedDataUrl) {
        setVideoError('Please upload a video file or select a file.');
        return;
      }
      finalUrl = uploadedDataUrl;
    } else {
      if (!finalUrl) {
        setVideoError('Please enter a valid video link URL.');
        return;
      }
    }

    setVideoError('');
    setVideoSuccess('');
    setIsSubmittingVideo(true);

    try {
      const created = await addWarmupVideo({
        title: videoTitle.trim(),
        description: videoDesc.trim(),
        category: videoCategory,
        type: videoType,
        url: finalUrl,
        duration: videoDuration,
      });

      setVideos(prev => [created, ...prev]);
      setVideoSuccess(`Successfully added video "${created.title}"!`);

      setVideoTitle('');
      setVideoDesc('');
      setVideoUrlInput('');
      setSelectedFile(null);
      setUploadedDataUrl('');

      setTimeout(() => {
        setIsAddingVideo(false);
        setVideoSuccess('');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create video:', err);
      setVideoError(err.message || 'Failed to add demonstration video.');
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      if (deleteTarget.type === 'student') {
        await deleteStudent(String(deleteTarget.id));
        setStudents(prev => prev.filter(s => s.uid !== deleteTarget.id));
      } else if (deleteTarget.type === 'video') {
        await deleteWarmupVideo(Number(deleteTarget.id));
        setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err.message || 'Failed to delete item.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveStudentClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editGrade || !editSection) return;
    setEditError('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/users/update-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentUid: editingStudent.uid,
          grade: editGrade,
          section: editSection,
        }),
      });

      if (res.ok) {
        setStudents(prev => prev.map(s => {
          if (s.uid === editingStudent.uid) {
            return { ...s, grade: editGrade, section: editSection };
          }
          return s;
        }));
        setIsEditingStudentClass(false);
        setEditingStudent(null);
      } else {
        const errData = await res.json();
        setEditError(errData.error || 'Failed to update student class.');
      }
    } catch (err) {
      console.error('Save student class error:', err);
      setEditError('An error occurred while updating class details.');
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      alert('No student records available to export.');
      return;
    }

    const headers = ['Student ID', 'Full Name', 'Grade', 'Section', 'Email', 'Assessments Run', 'Average Fitness Score'];
    const rows = students.map(s => {
      const avgScore = s.assessments.length > 0
        ? Math.round(s.assessments.reduce((acc, a) => acc + (a.score || 0), 0) / s.assessments.length)
        : 0;
      return [
        `"${s.studentCode || s.uid}"`,
        `"${s.name}"`,
        `"${s.grade || '11'}"`,
        `"${s.section || ''}"`,
        `"${s.email}"`,
        s.assessments.length,
        avgScore
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExerFit_Student_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => {
    const gradeMatch = gradeFilter === 'All Grades' || s.grade === gradeFilter.replace('Grade ', '');
    const sectionMatch = sectionFilter === 'All Sections' || s.section === sectionFilter;
    const query = studentSearchQuery.toLowerCase().trim();
    const searchMatch = !query || 
      s.name.toLowerCase().includes(query) || 
      (s.studentCode && s.studentCode.toLowerCase().includes(query)) ||
      s.email.toLowerCase().includes(query);
    return gradeMatch && sectionMatch && searchMatch;
  });

  const filteredVideos = videos.filter(v => {
    if (videoCategoryFilter === 'All') return true;
    return v.category === videoCategoryFilter;
  });

  const getAverageScore = (student: StudentPerformance) => {
    if (!student.assessments || student.assessments.length === 0) return 0;
    return Math.round(student.assessments.reduce((acc, a) => acc + a.score, 0) / student.assessments.length);
  };

  const totalAssessments = students.reduce((acc, s) => acc + s.assessments.length, 0);
  const activeStudentsCount = students.filter(s => s.assessments.length > 0).length;
  const avgOverallScore = students.length > 0 
    ? Math.round(students.reduce((acc, s) => acc + getAverageScore(s), 0) / students.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-neutral-500 font-black uppercase tracking-widest text-xs">Synchronizing Faculty Portal...</p>
      </div>
    );
  }

  const videoCategoriesList = [
    'All',
    'Warmup Routine',
    'Cardiovascular Endurance',
    'Muscular Strength',
    'Muscular Endurance',
    'Flexibility',
    'Agility & Speed',
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      {/* Faculty Portal Header */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <GraduationCap size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Faculty Dashboard</h1>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-blue-200/50">
                Instructor Mode
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-xs text-neutral-500 font-medium">Physical Education & Health Analytics Management</p>
              {teacherAssignedSections.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-black">
                  <Layers size={11} className="text-emerald-600" />
                  Handling: {teacherAssignedSections.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors text-xs"
            title="Export to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button 
            onClick={onLogout}
            className="px-3.5 py-2.5 bg-neutral-100 text-neutral-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl flex items-center gap-1.5 transition-colors text-xs"
            title="Logout"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-1.5 shadow-sm flex flex-wrap items-center gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 select-none",
            activeTab === 'overview'
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
          )}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={cn(
            "flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 select-none",
            activeTab === 'students'
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
          )}
        >
          <Users size={16} />
          <span>Students & Records</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1",
            activeTab === 'students' ? "bg-white text-blue-600" : "bg-neutral-200 text-neutral-700"
          )}>
            {students.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            loadHistoryLogs();
          }}
          className={cn(
            "flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 select-none",
            activeTab === 'history'
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
          )}
        >
          <Clock size={16} />
          <span>Assessment History Logs</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1",
            activeTab === 'history' ? "bg-white text-blue-600" : "bg-neutral-200 text-neutral-700"
          )}>
            {historyLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={cn(
            "flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 select-none",
            activeTab === 'videos'
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
          )}
        >
          <Film size={16} />
          <span>Warm-up & Demo Videos</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1",
            activeTab === 'videos' ? "bg-white text-blue-600" : "bg-neutral-200 text-neutral-700"
          )}>
            {videos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            "flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 select-none",
            activeTab === 'leaderboard'
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
          )}
        >
          <Trophy size={16} />
          <span>Rankings & Leaderboard</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <motion.div 
          key="overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* High-level Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-3">
                <span className="font-black text-[11px] uppercase tracking-wider">Total Enrolled</span>
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-neutral-900">{students.length}</div>
              <div className="text-xs text-neutral-500 font-bold mt-2">
                Across {sections.length} Active Section{sections.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-3">
                <span className="font-black text-[11px] uppercase tracking-wider">Class Fitness Avg</span>
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-600">{avgOverallScore}<span className="text-lg text-neutral-400 font-bold">/100</span></div>
              <div className="text-xs text-neutral-500 font-bold mt-2">Composite Performance Index</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-3">
                <span className="font-black text-[11px] uppercase tracking-wider">Assessments Run</span>
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <BarChart3 size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-indigo-600">{totalAssessments}</div>
              <div className="text-xs text-neutral-500 font-bold mt-2">Completed AI Pose Tests</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-3">
                <span className="font-black text-[11px] uppercase tracking-wider">Active Videos</span>
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Film size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-amber-600">{videos.length}</div>
              <div className="text-xs text-neutral-500 font-bold mt-2">Demo & Warm-up Routines</div>
            </div>
          </div>

          {/* Quick Shortcuts & Class Distribution */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm space-y-4">
              <h3 className="font-black text-neutral-900 text-base flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" /> Quick Management
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => setActiveTab('students')}
                  className="w-full p-3 bg-neutral-50 hover:bg-blue-50/70 border border-neutral-200/70 rounded-2xl flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">Manage Students</div>
                      <div className="text-[11px] text-neutral-400">View performance & update class tracks</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-600">&rarr;</span>
                </button>

                <button
                  onClick={() => setActiveTab('videos')}
                  className="w-full p-3 bg-neutral-50 hover:bg-indigo-50/70 border border-neutral-200/70 rounded-2xl flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Film size={18} className="text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">Warm-up & Demo Videos</div>
                      <div className="text-[11px] text-neutral-400">Upload or link exercise tutorials</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-600">&rarr;</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="w-full p-3 bg-neutral-50 hover:bg-amber-50/70 border border-neutral-200/70 rounded-2xl flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Trophy size={18} className="text-amber-500" />
                    <div>
                      <div className="text-xs font-bold text-neutral-900">Section Leaderboards</div>
                      <div className="text-[11px] text-neutral-400">Class rankings & top athletic scores</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-600">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Section Breakdown */}
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-neutral-900 text-base flex items-center gap-2">
                  <Layers size={18} className="text-indigo-600" /> Class & Section Distribution
                </h3>
                <span className="text-[11px] font-bold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-lg">
                  Configured by Super Admin
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {sections.map((sectionName, idx) => {
                  const sectionStudents = students.filter(s => s.section === sectionName);
                  const sectionTests = sectionStudents.reduce((acc, s) => acc + s.assessments.length, 0);
                  const sectionAvg = sectionStudents.length > 0
                    ? Math.round(sectionStudents.reduce((acc, s) => acc + getAverageScore(s), 0) / sectionStudents.length)
                    : 0;

                  return (
                    <div key={`teacher-section-summary-${sectionName}-${idx}`} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-neutral-900 text-sm">{sectionName}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                          {sectionStudents.length} Students
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-200/50">
                        <span>Tests Run: <strong className="text-neutral-800">{sectionTests}</strong></span>
                        <span>Avg: <strong className="text-emerald-600">{sectionAvg}/100</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: STUDENTS & RECORDS */}
      {activeTab === 'students' && (
        <motion.div 
          key="students"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden"
        >
          {/* Table Header & Controls */}
          <div className="p-6 border-b border-neutral-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-neutral-900">Student Performance Records</h2>
                  <p className="text-xs text-neutral-500 font-medium">Search, filter, edit student tracks and monitor AI assessment scores.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-60">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search name, code, email..."
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select 
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Grades</option>
                {['7', '8', '9', '10', '11', '12'].map(g => (
                  <option key={`teacher-grade-opt-${g}`} value={`Grade ${g}`}>Grade {g}</option>
                ))}
              </select>

              <select 
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Sections</option>
                {availableSections.map((section, idx) => (
                  <option key={`teacher-sec-opt-${section}-${idx}`} value={section}>{section}</option>
                ))}
              </select>

              <button 
                onClick={loadData}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                title="Refresh Records"
              >
                <RefreshCw size={16} />
              </button>

              <button
                onClick={() => {
                  setAddStudentError('');
                  setAddStudentSuccess('');
                  setIsAddingStudent(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm text-xs"
              >
                <UserPlus size={15} />
                <span>Add Student</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200/60">
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider">Student Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider">Grade & Section</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider">Tests Done</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStudents.map((student, idx) => {
                  const avgScore = getAverageScore(student);
                  return (
                    <tr key={`teacher-student-row-${student.uid || student.studentCode || idx}-${idx}`} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900 text-sm">{student.name}</div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{student.studentCode || 'No Code'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-700 inline-block">
                          Grade {student.grade || '11'} • {student.section || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500 font-medium">{student.email}</td>
                      <td className="px-6 py-4">
                        <span className="font-black text-neutral-900 text-sm">{student.assessments.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "text-base font-black",
                          avgScore >= 80 ? "text-emerald-600" : avgScore >= 60 ? "text-blue-600" : "text-neutral-900"
                        )}>
                          {avgScore > 0 ? `${avgScore}/100` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                          student.assessments.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"
                        )}>
                          {student.assessments.length > 0 ? 'Assessed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingStudent(student);
                              setEditGrade(student.grade || '11');
                              setEditSection(student.section || '');
                              setIsEditingStudentClass(true);
                              setEditError('');
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition-all"
                          >
                            Edit Class
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'student',
                                id: student.uid,
                                title: student.name,
                                subtitle: `${student.studentCode ? student.studentCode + ' • ' : ''}Grade ${student.grade || '11'} (${student.section || 'Unassigned'}) • ${student.email}`,
                              });
                              setDeleteError('');
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl transition-all"
                            title="Delete Student"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-300 mx-auto mb-3">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-black text-neutral-900 mb-1">No Students Found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">Try adjusting your search query or grade/section filters.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 3: WARM-UP & DEMO VIDEOS */}
      {activeTab === 'videos' && (
        <motion.div 
          key="videos"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Film size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-neutral-900 tracking-tight">Warm-up & Demonstration Videos</h2>
                  <p className="text-xs text-neutral-500 font-medium">Upload or embed physical fitness routine videos for student exercises.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setVideoError('');
                  setVideoSuccess('');
                  setIsAddingVideo(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 text-xs"
              >
                <Plus size={16} /> Add Demonstration Video
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {videoCategoriesList.map(cat => (
                <button
                  key={`vid-cat-${cat}`}
                  onClick={() => setVideoCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    videoCategoryFilter === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loadingVideos ? (
              <div className="py-12 flex justify-center items-center gap-2 text-neutral-400 font-bold text-xs">
                <Loader2 className="animate-spin text-indigo-600" size={18} /> Loading video repository...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="py-16 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                <Video className="mx-auto text-neutral-300 mb-2" size={32} />
                <p className="text-sm font-bold text-neutral-700">No videos found for category "{videoCategoryFilter}"</p>
                <p className="text-xs text-neutral-400 mt-1">Click "Add Demonstration Video" to upload or embed video links.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredVideos.map((vid, idx) => (
                  <div key={`vid-item-${vid.id || idx}-${idx}`} className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden flex flex-col group hover:shadow-md transition-all">
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
                      <div className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                        {vid.type === 'upload' ? <Upload size={10} className="text-emerald-400" /> : <Link size={10} className="text-blue-400" />}
                        {vid.type === 'upload' ? 'Uploaded Video' : 'Web Link'}
                      </div>
                      <div className="absolute top-2 right-2 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        {vid.duration}s
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {vid.category}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">By {vid.createdBy}</span>
                        </div>
                        <h3 className="font-bold text-neutral-900 text-sm leading-snug">{vid.title}</h3>
                        {vid.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{vid.description}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-400">
                        <span className="text-[10px]">{new Date(vid.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewVideo(vid)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Play size={12} /> Play
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'video',
                                id: vid.id,
                                title: vid.title,
                                subtitle: `${vid.category} • ${vid.duration}s duration • By ${vid.createdBy}`,
                              });
                              setDeleteError('');
                            }}
                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Video"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 4: LEADERBOARD & RANKINGS */}
      {activeTab === 'leaderboard' && (
        <motion.div 
          key="leaderboard"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <TeacherLeaderboard sections={sections} />
        </motion.div>
      )}

      {/* TAB 3: ASSESSMENT HISTORY LOGS */}
      {activeTab === 'history' && (
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Metric Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="font-black text-[11px] uppercase tracking-wider">Total Tests Logged</span>
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-neutral-900">{historyLogs.length}</div>
              <div className="text-xs text-neutral-500 font-bold mt-1">Recorded AI Pose Sessions</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="font-black text-[11px] uppercase tracking-wider">Average Score</span>
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-600">
                {historyLogs.length > 0
                  ? Math.round(historyLogs.reduce((acc, r) => acc + (r.score || 0), 0) / historyLogs.length)
                  : 0}
                <span className="text-sm text-neutral-400 font-bold ml-1">/100</span>
              </div>
              <div className="text-xs text-neutral-500 font-bold mt-1">Mean Student Form Rating</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="font-black text-[11px] uppercase tracking-wider">Total Valid Reps</span>
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-indigo-600">
                {historyLogs.reduce((acc, r) => acc + (Number(r.validReps) || 0), 0)}
              </div>
              <div className="text-xs text-neutral-500 font-bold mt-1">Biomechanical Repetitions</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="font-black text-[11px] uppercase tracking-wider">Form Accuracy Rate</span>
                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Zap size={18} />
                </div>
              </div>
              <div className="text-4xl font-black text-purple-600">
                {(() => {
                  const val = historyLogs.reduce((acc, r) => acc + (Number(r.validReps) || 0), 0);
                  const inv = historyLogs.reduce((acc, r) => acc + (Number(r.invalidReps) || 0), 0);
                  return val + inv > 0 ? Math.round((val / (val + inv)) * 100) : 100;
                })()}%
              </div>
              <div className="text-xs text-neutral-500 font-bold mt-1">Movement Execution Quality</div>
            </div>
          </div>

          {/* Assessment History Filter & Logs Table Container */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" /> Historical Assessment Logs
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Chronological registry of every student test attempt with real-time pose estimation data and form scores.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={loadHistoryLogs}
                  className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
                  title="Refresh Logs"
                >
                  <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} /> Refresh
                </button>

                <button
                  onClick={handleExportHistoryCSV}
                  disabled={historyLogs.length === 0}
                  className={cn(
                    "px-4 py-2.5 bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors",
                    historyLogs.length > 0 ? "hover:bg-neutral-200" : "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Download size={14} /> Export Logs CSV
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search student or code..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={historyGradeFilter}
                onChange={e => setHistoryGradeFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Grades">All Grades</option>
                {['7', '8', '9', '10', '11', '12'].map(g => (
                  <option key={`hist-filter-grade-${g}`} value={g}>Grade {g}</option>
                ))}
              </select>

              <select
                value={historySectionFilter}
                onChange={e => setHistorySectionFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Sections">All Sections</option>
                {sections.map((s, idx) => (
                  <option key={`hist-filter-sec-${s}-${idx}`} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={historyComponentFilter}
                onChange={e => setHistoryComponentFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Fitness Tests</option>
                {FITNESS_COMPONENTS.map(c => (
                  <option key={`hist-filter-comp-${c.id}`} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Assessment Logs Table */}
            {loadingHistory ? (
              <div className="py-16 text-center text-neutral-400 font-bold text-xs flex items-center justify-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={18} /> Loading historical assessment logs...
              </div>
            ) : (() => {
              const filteredLogs = historyLogs.filter(log => {
                if (historyGradeFilter !== 'All Grades' && log.grade !== historyGradeFilter && log.grade !== `Grade ${historyGradeFilter}`) {
                  return false;
                }
                if (historySectionFilter !== 'All Sections' && log.section !== historySectionFilter) {
                  return false;
                }
                if (historyComponentFilter !== 'All') {
                  const compMatches = log.componentId === historyComponentFilter ||
                    (historyComponentFilter === 'strength' && log.componentId === 'push-up') ||
                    (historyComponentFilter === 'endurance' && log.componentId === 'curl-up') ||
                    (historyComponentFilter === 'cardio' && log.componentId === 'step-test') ||
                    (historyComponentFilter === 'flexibility' && log.componentId === 'sit-reach') ||
                    (historyComponentFilter === 'power' && log.componentId === 'vertical-jump') ||
                    (historyComponentFilter === 'balance' && log.componentId === 'balance-slst');
                  if (!compMatches) return false;
                }
                if (historySearchQuery.trim()) {
                  const q = historySearchQuery.toLowerCase();
                  const name = (log.studentName || '').toLowerCase();
                  const code = (log.studentCode || log.studentId || '').toLowerCase();
                  const comp = (log.componentId || '').toLowerCase();
                  if (!name.includes(q) && !code.includes(q) && !comp.includes(q)) {
                    return false;
                  }
                }
                return true;
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="py-16 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 space-y-2">
                    <Clock className="mx-auto text-neutral-300" size={32} />
                    <p className="text-sm font-bold text-neutral-700">No Assessment Records Found</p>
                    <p className="text-xs text-neutral-400">
                      {historyLogs.length === 0
                        ? 'No student assessment logs have been submitted to the database yet.'
                        : 'No records match the active search and filter options.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Student</th>
                        <th className="py-3 px-3">Grade & Section</th>
                        <th className="py-3 px-3">Fitness Test</th>
                        <th className="py-3 px-3 text-center">Score</th>
                        <th className="py-3 px-3 text-center">Raw Result</th>
                        <th className="py-3 px-3 text-center">Valid / Faults</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {filteredLogs.map((log, idx) => {
                        const comp = FITNESS_COMPONENTS.find(c => c.id === log.componentId);
                        const dateObj = log.date || log.timestamp ? new Date(log.date || log.timestamp!) : new Date();
                        const dateFormatted = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                        const timeFormatted = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                        const ratingColor = log.score >= 90
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : log.score >= 80
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : log.score >= 70
                          ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                          : log.score >= 60
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200';

                        return (
                          <tr key={`log-row-${log.id || idx}-${log.componentId}-${idx}`} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="py-3 px-3 font-medium text-neutral-500 whitespace-nowrap">
                              <div>{dateFormatted}</div>
                              <div className="text-[10px] text-neutral-400">{timeFormatted}</div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-neutral-900">{log.studentName || 'Student'}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">{log.studentCode || log.studentId || 'N/A'}</div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-bold text-neutral-700">Grade {log.grade || '11'}</span>
                              <div className="text-[10px] text-neutral-400">{log.section || 'General'}</div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-neutral-900">{comp?.name || log.componentId}</div>
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded">
                                {comp?.category || 'Health-Related'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className={cn('px-2.5 py-1 rounded-full text-xs font-black border', ratingColor)}>
                                {log.score}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-bold text-neutral-800">
                              {log.rawResult}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className="text-emerald-700 font-bold">{log.validReps ?? 0}</span>
                              <span className="text-neutral-300 mx-1">/</span>
                              <span className="text-rose-600 font-bold">{log.invalidReps ?? 0}</span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedDetailLog(log)}
                                  className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                  title="Inspect Biomechanical Details"
                                >
                                  <Info size={12} /> Inspect
                                </button>

                                {log.id && (
                                  <button
                                    onClick={async () => {
                                      if (window.confirm('Delete this assessment record from the database?')) {
                                        setDeletingLogId(log.id!);
                                        await deleteAssessmentRecordApi(log.id!);
                                        setHistoryLogs(prev => prev.filter(item => item.id !== log.id));
                                        setDeletingLogId(null);
                                      }
                                    }}
                                    disabled={deletingLogId === log.id}
                                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Assessment Record"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* Detail Biomechanical Assessment Inspection Modal */}
      <AnimatePresence>
        {selectedDetailLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900">
                      {FITNESS_COMPONENTS.find(c => c.id === selectedDetailLog.componentId)?.name || selectedDetailLog.componentId}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium">
                      Student: <strong className="text-neutral-800">{selectedDetailLog.studentName || 'Student'}</strong> (Grade {selectedDetailLog.grade}-{selectedDetailLog.section})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDetailLog(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-blue-600/15">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                      Student Score
                    </span>
                    <div className="text-4xl font-black">{selectedDetailLog.score} / 100</div>
                    <div className="text-xs text-blue-100 font-medium">
                      Standardized WHO / DepEd Assessment Score
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-xs text-blue-200">
                      {new Date(selectedDetailLog.date || selectedDetailLog.timestamp || Date.now()).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-bold text-white font-mono">
                      {selectedDetailLog.studentCode || 'STD-LOG'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                    <div className="text-[10px] font-black uppercase text-neutral-400">Exercise Result</div>
                    <div className="text-lg font-black text-neutral-900 mt-0.5">{selectedDetailLog.rawResult}</div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <div className="text-[10px] font-black uppercase text-emerald-600">Valid Reps</div>
                    <div className="text-lg font-black text-emerald-700 mt-0.5">{selectedDetailLog.validReps ?? 0}</div>
                  </div>

                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <div className="text-[10px] font-black uppercase text-rose-600">Form Faults</div>
                    <div className="text-lg font-black text-rose-700 mt-0.5">{selectedDetailLog.invalidReps ?? 0}</div>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                    <div className="text-[10px] font-black uppercase text-neutral-400">Consistency</div>
                    <div className="text-lg font-black text-neutral-900 mt-0.5">{selectedDetailLog.consistency ?? 88}%</div>
                  </div>
                </div>

                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-600" /> AI Form Analysis & Biomechanics
                  </h4>
                  <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span><strong>Body Alignment & Depth:</strong> Student completed full range of motion within standard guidelines.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span><strong>Tempo & Cadence:</strong> Smooth repetition rhythm with controlled eccentric/concentric phases.</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-neutral-100 transition-colors"
                >
                  <Download size={14} /> Print Record
                </button>

                <button
                  onClick={() => setSelectedDetailLog(null)}
                  className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Class Modal */}
      {isEditingStudentClass && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-black text-neutral-900">Edit Class Track</h3>
                <p className="text-xs text-neutral-500 font-medium">Update Grade & Section for <strong className="text-blue-600">{editingStudent.name}</strong></p>
              </div>
              <button 
                onClick={() => {
                  setIsEditingStudentClass(false);
                  setEditingStudent(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            {editError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveStudentClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-600">Grade</label>
                  <select
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
                    value={editGrade}
                    onChange={e => setEditGrade(e.target.value)}
                  >
                    {['7', '8', '9', '10', '11', '12'].map(g => (
                      <option key={`edit-student-modal-grade-${g}`} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-600">Section</label>
                  <select
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
                    value={editSection}
                    onChange={e => setEditSection(e.target.value)}
                  >
                    {availableSections.map((s, idx) => (
                      <option key={`edit-student-modal-sec-${s}-${idx}`} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditingStudentClass(false);
                    setEditingStudent(null);
                  }}
                  className="flex-1 py-3 text-neutral-500 font-bold text-xs hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add New Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/50 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 my-8"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-neutral-900">Add New Student</h3>
                  <p className="text-xs text-neutral-500 font-medium">Register student account into the school class database.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingStudent(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {addStudentError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                {addStudentError}
              </div>
            )}

            {addStudentSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} /> {addStudentSuccess}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Full Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Email Address *</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. maria@school.edu"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Grade Level</label>
                  <select
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold"
                    value={newStudentGrade}
                    onChange={e => setNewStudentGrade(e.target.value)}
                  >
                    {['7', '8', '9', '10', '11', '12'].map(g => (
                      <option key={`add-student-modal-grade-${g}`} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Section</label>
                  <select
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold"
                    value={newStudentSection}
                    onChange={e => setNewStudentSection(e.target.value)}
                  >
                    {availableSections.map((s, idx) => (
                      <option key={`add-student-modal-sec-${s}-${idx}`} value={s}>{s}</option>
                    ))}
                    {!availableSections.includes(newStudentSection) && newStudentSection && (
                      <option key={`add-student-modal-custom-${newStudentSection}`} value={newStudentSection}>{newStudentSection}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Password</label>
                  <input 
                    type="text"
                    placeholder="Default: password123"
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                    value={newStudentPassword}
                    onChange={e => setNewStudentPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Student ID / Code</label>
                  <input 
                    type="text"
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                    value={newStudentCode}
                    onChange={e => setNewStudentCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="flex-1 py-3 text-neutral-500 font-bold text-xs hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingStudent}
                  className="flex-1 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingStudent ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Create Student'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Demonstration Video Modal */}
      {isAddingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/50 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 my-8"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Video size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-neutral-900">Add Demonstration Video</h3>
                  <p className="text-xs text-neutral-500 font-medium">Upload a video or embed a YouTube routine.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingVideo(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {videoError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                {videoError}
              </div>
            )}

            {videoSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} /> {videoSuccess}
              </div>
            )}

            <form onSubmit={handleCreateVideo} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Video Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Dynamic High Knees Warm-up"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Category</label>
                  <select
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold"
                    value={videoCategory}
                    onChange={e => setVideoCategory(e.target.value)}
                  >
                    <option value="Warmup Routine">Warmup Routine</option>
                    <option value="Cardiovascular Endurance">Cardiovascular Endurance</option>
                    <option value="Muscular Strength">Muscular Strength</option>
                    <option value="Muscular Endurance">Muscular Endurance</option>
                    <option value="Flexibility">Flexibility</option>
                    <option value="Agility & Speed">Agility & Speed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Duration (seconds)</label>
                  <input 
                    type="number"
                    min="5"
                    max="300"
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    value={videoDuration}
                    onChange={e => setVideoDuration(parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Source Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVideoType('link')}
                    className={cn(
                      "py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all",
                      videoType === 'link' 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-neutral-500 hover:text-neutral-900"
                    )}
                  >
                    <Link size={13} /> YouTube / Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType('upload')}
                    className={cn(
                      "py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all",
                      videoType === 'upload' 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-neutral-500 hover:text-neutral-900"
                    )}
                  >
                    <Upload size={13} /> Video File
                  </button>
                </div>
              </div>

              {videoType === 'link' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Video URL (YouTube or MP4 link) *</label>
                  <input 
                    type="url"
                    required={videoType === 'link'}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    value={videoUrlInput}
                    onChange={e => setVideoUrlInput(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Upload Video File *</label>
                  <div className="border border-dashed border-neutral-300 rounded-xl p-4 text-center hover:bg-neutral-50 transition-colors relative cursor-pointer">
                    <input 
                      type="file" 
                      accept="video/*"
                      required={videoType === 'upload' && !uploadedDataUrl}
                      onChange={handleVideoFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-indigo-500 mb-1.5" size={22} />
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-neutral-900">{selectedFile.name}</p>
                        <p className="text-[10px] text-neutral-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-neutral-600">Select MP4, WebM (under 40MB)</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Exercise Description / Instructions</label>
                <textarea 
                  rows={2}
                  placeholder="Instructions for students..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium resize-none"
                  value={videoDesc}
                  onChange={e => setVideoDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddingVideo(false)}
                  className="flex-1 py-3 text-neutral-500 font-bold text-xs hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingVideo}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingVideo ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Add Video'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 text-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-neutral-800"
          >
            <div className="p-4 flex items-center justify-between border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800/60">
                  {previewVideo.category}
                </span>
                <h3 className="text-sm font-bold truncate max-w-sm">{previewVideo.title}</h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              {previewVideo.url.includes('youtube.com/embed') ? (
                <iframe
                  src={previewVideo.url}
                  title={previewVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : previewVideo.url.startsWith('data:video') || previewVideo.url.endsWith('.mp4') || previewVideo.url.endsWith('.webm') ? (
                <video src={previewVideo.url} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <iframe
                  src={previewVideo.url}
                  title={previewVideo.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              )}
            </div>

            {previewVideo.description && (
              <div className="p-4 bg-neutral-950 text-xs text-neutral-300">
                <p className="font-bold text-neutral-400 mb-1">Student Instructions:</p>
                <p>{previewVideo.description}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Unified Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-neutral-100 space-y-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-neutral-900 text-lg">
                  {deleteTarget.type === 'student' ? 'Delete Student Account?' : 'Delete Video?'}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {deleteTarget.type === 'student'
                    ? 'Are you sure you want to permanently delete this student? All their fitness assessments, scores, and activity records will be permanently removed.'
                    : 'Are you sure you want to delete this demonstration video from the warm-up library?'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-0.5">
              <div className="text-xs font-bold text-neutral-900 truncate">{deleteTarget.title}</div>
              {deleteTarget.subtitle && (
                <div className="text-[11px] text-neutral-500">{deleteTarget.subtitle}</div>
              )}
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button 
                type="button"
                onClick={() => {
                  if (!isDeleting) {
                    setDeleteTarget(null);
                    setDeleteError('');
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-3 text-neutral-600 font-bold text-xs hover:bg-neutral-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
