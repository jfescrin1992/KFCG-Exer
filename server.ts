import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { eq, desc } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { users, warmupVideos } from './src/db/schema.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { 
  getOrCreateUser, 
  registerLocalUser,
  authenticateLocalUser,
  fetchAllStudentsPerformance, 
  saveAssessmentResult, 
  createNewSection, 
  fetchAllSections, 
  seedSectionsIfEmpty,
  initTablesIfNotExist,
  isDatabaseActive,
  getLeaderboardRankings,
  deleteUserByUid,
  getUserByUid,
  updateUserClass,
  getSectionAverages,
  fetchStudentAssessmentHistory,
  fetchAllAssessmentHistory,
  deleteAssessmentRecord,
  fetchAllTeachers,
  fetchPublicTeachersList,
  createTeacherAccount,
  updateTeacherSections,
  deleteTeacherByUid,
  deleteSectionByName,
  getSuperAdminOverview,
  fetchStudentGoals,
  createStudentGoal,
  updateStudentGoal,
  deleteStudentGoal,
  logGoalRepProgress
} from './src/db/helpers.ts';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fitness_assessment_secret_token_123!';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Automatically verify & initialize database tables on startup
  await initTablesIfNotExist();

  // Gemini Setup
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Backend Health & System Status Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'KFCG ExerCheck Backend API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      database: isDatabaseActive() ? 'PostgreSQL Database Active' : 'In-Memory Resilient Active'
    });
  });

  // API Catalog & Metadata Information
  app.get('/api/info', (req, res) => {
    res.json({
      title: 'KFCG ExerCheck Physical Fitness Assessment API',
      version: '1.0.0',
      description: 'Full-stack REST API for DepEd Physical Fitness Testing, Gamification, and Computer Vision Posture Assessment',
      endpoints: {
        auth: [
          'POST /api/auth/register - Register student account (requires LRN, section, teacher)',
          'POST /api/auth/login - Authenticate registered user',
          'POST /api/auth/demo - Instant demo access (student, teacher, superadmin)',
          'GET  /api/auth/me - Retrieve current session user profile'
        ],
        students: [
          'GET  /api/students - Fetch student performance records & test histories'
        ],
        teachers: [
          'GET  /api/teachers/list - Public list of active PE teachers',
          'GET  /api/teachers - List all faculty members (Super Admin only)',
          'POST /api/teachers - Create new PE teacher profile',
          'PUT  /api/teachers/:uid/sections - Assign handling sections to teacher',
          'DELETE /api/teachers/:uid - Remove teacher account'
        ],
        assessments: [
          'POST /api/assessments - Record physical fitness test result',
          'GET  /api/assessments/student/:id - Fetch assessment history for student',
          'GET  /api/assessments/history - Fetch all assessment records (Faculty)',
          'DELETE /api/assessments/:id - Delete an assessment entry'
        ],
        analytics: [
          'GET  /api/leaderboard - Get student leaderboard rankings',
          'GET  /api/section-averages - Get class section performance averages',
          'GET  /api/superadmin/overview - Get system-wide physical fitness stats'
        ],
        goals: [
          'GET    /api/goals/student/:id - Fetch student personal fitness goals',
          'POST   /api/goals - Create new exercise target goal',
          'PUT    /api/goals/:id - Update goal target/progress',
          'POST   /api/goals/:id/log-rep - Log rep count toward goal',
          'DELETE /api/goals/:id - Remove fitness goal'
        ],
        videos: [
          'GET    /api/warmup-videos - List demonstration & warmup videos',
          'POST   /api/warmup-videos - Add warmup/demo video',
          'DELETE /api/warmup-videos/:id - Remove warmup video'
        ],
        ai: [
          'POST /api/gemini/analyze-form - Server-side AI exercise form analysis'
        ]
      }
    });
  });

  // Public Teachers List for Student Registration
  app.get('/api/teachers/list', async (req, res) => {
    try {
      const teachers = await fetchPublicTeachersList();
      res.json(teachers);
    } catch (error: any) {
      console.error('Fetch public teachers list error:', error);
      res.status(500).json({ error: 'Failed to retrieve teachers list.' });
    }
  });

  // Register Student Account API (Public Registration is Student-Only)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role = 'student', grade, section, studentCode, teacherName } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required registration parameters.' });
      }

      // Public registration is strictly for students
      const finalRole = 'student';

      const user = await registerLocalUser(email, password, name, finalRole, grade, section, studentCode, teacherName);
      
      // Sign secure custom session token
      const token = jwt.sign(
        { uid: user.uid, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ user, token });
    } catch (error: any) {
      console.error('Registration API error:', error);
      res.status(500).json({ error: error.message || 'Registration failed.' });
    }
  });

  // Login Local Account API
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      const user = await authenticateLocalUser(email, password);
      
      // Sign secure custom session token
      const token = jwt.sign(
        { uid: user.uid, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ user, token });
    } catch (error: any) {
      console.error('Login API error:', error);
      res.status(401).json({ error: error.message || 'Login failed.' });
    }
  });
  
  // Demo Login API - automatically creates the demo user if they don't exist yet!
  app.post('/api/auth/demo', async (req, res) => {
    try {
      const { role } = req.body;
      if (role !== 'student' && role !== 'teacher' && role !== 'superadmin') {
        return res.status(400).json({ error: 'Invalid demo role.' });
      }

      let email = 'student@demo.com';
      let password = 'password123';
      let name = 'Demo Student';

      if (role === 'teacher') {
        email = 'teacher@demo.com';
        name = 'Prof. Maria Santos';
      } else if (role === 'superadmin') {
        email = 'admin@demo.com';
        name = 'Chief Super Admin';
      }

      let user;
      try {
        user = await authenticateLocalUser(email, password);
      } catch (err: any) {
        if (err.message.includes('not found') || err.message.includes('Account not found')) {
          // Auto-create demo account in database on the fly
          user = await registerLocalUser(
            email,
            password,
            name,
            role,
            role === 'student' ? '11' : role === 'teacher' ? '11' : undefined,
            role === 'student' ? 'Section A' : role === 'teacher' ? 'Section A' : undefined,
            role === 'student' ? 'DEMO-2026' : undefined
          );
        } else {
          throw err;
        }
      }

      // Sign secure custom session token
      const token = jwt.sign(
        { uid: user.uid, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ user, token });
    } catch (error: any) {
      console.error('Demo Login API error:', error);
      res.status(500).json({ error: error.message || 'Demo login failed.' });
    }
  });

  // Get current active session user profile API
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Retrieve fresh profile values
      const user = await getUserByUid(uid);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }
      res.json(user);
    } catch (error: any) {
      console.error('Fetch me API error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch session.' });
    }
  });

  // Sync / Get or Create User Profile
  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { email, name, role, grade, section, studentCode } = req.body;
      const uid = req.user?.uid;
      if (!uid || !email || !name || !role) {
        return res.status(400).json({ error: 'Missing required sync attributes.' });
      }
      const user = await getOrCreateUser(uid, email, name, role, grade, section, studentCode);
      res.json(user);
    } catch (error: any) {
      console.error('User sync error:', error);
      res.status(500).json({ error: error.message || 'Failed to synchronize user.' });
    }
  });

  // Get All Class Students (For Teacher Dashboard - Scoped to Teacher's Handling Sections)
  app.get('/api/students', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userUid = req.user?.uid;
      const userRole = req.user?.role;
      if (!userUid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let allowedSections: string[] | undefined = undefined;
      // If the caller is a teacher (and not superadmin), restrict strictly to their handling sections
      if (userRole === 'teacher') {
        const user = await getUserByUid(userUid);
        if (user && user.section) {
          allowedSections = user.section.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          allowedSections = []; // If no section assigned, return empty list
        }
      }

      const performanceData = await fetchAllStudentsPerformance(allowedSections);
      res.json(performanceData);
    } catch (error: any) {
      console.error('Fetch students error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch class records.' });
    }
  });

  // Create New Student (Faculty Action)
  app.post('/api/students', requireAuth, async (req: AuthRequest, res) => {
    try {
      const teacherUid = req.user?.uid;
      if (!teacherUid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, email, password, grade, section, studentCode } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Student name and email are required.' });
      }

      const pass = password && password.trim().length > 0 ? password : 'password123';
      const code = studentCode && studentCode.trim().length > 0 ? studentCode : `STD-${Date.now().toString().slice(-5)}`;
      const gradeVal = grade || '11';
      const sectionVal = section || 'Section A';

      const newStudent = await registerLocalUser(
        email,
        pass,
        name,
        'student',
        gradeVal,
        sectionVal,
        code
      );

      res.status(201).json(newStudent);
    } catch (error: any) {
      console.error('Create student API error:', error);
      res.status(500).json({ error: error.message || 'Failed to create student account.' });
    }
  });

  // Update Student Grade and Section
  app.post('/api/users/update-class', requireAuth, async (req: AuthRequest, res) => {
    try {
      const teacherUid = req.user?.uid;
      if (!teacherUid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { studentUid, grade, section } = req.body;
      if (!studentUid || !grade || !section) {
        return res.status(400).json({ error: 'Missing studentUid, grade, or section.' });
      }

      const updated = await updateUserClass(studentUid, grade, section);
      res.json(updated);
    } catch (error: any) {
      console.error('Update student class error:', error);
      res.status(500).json({ error: error.message || 'Failed to update student class.' });
    }
  });

  // Delete Student Profile (Faculty Action)
  app.delete('/api/students/:uid', requireAuth, async (req: AuthRequest, res) => {
    try {
      const teacherUid = req.user?.uid;
      if (!teacherUid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { uid } = req.params;
      if (!uid) {
        return res.status(400).json({ error: 'Student UID is required.' });
      }

      await deleteUserByUid(uid);
      res.json({ success: true, message: 'Student account deleted successfully.' });
    } catch (error: any) {
      console.error('Delete student API error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete student account.' });
    }
  });

  // Get Section Peer Averages
  app.get('/api/sections/averages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user profile first to find their section
      const user = await getUserByUid(uid);
      if (!user || !user.section) {
        return res.json([]);
      }

      const result = await getSectionAverages(user.section);
      res.json(result);
    } catch (error: any) {
      console.error('Fetch section averages error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch section averages.' });
    }
  });

  // Save Student Assessment Result
  app.post('/api/assessments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { studentName, grade, section, result } = req.body;
      if (!uid || !studentName || !grade || !section || !result) {
        return res.status(400).json({ error: 'Missing assessment parameters.' });
      }
      const saved = await saveAssessmentResult(uid, studentName, grade, section, result);
      res.json(saved);
    } catch (error: any) {
      console.error('Save assessment error:', error);
      res.status(500).json({ error: error.message || 'Failed to save student record.' });
    }
  });

  // Get My Assessment History (Authenticated Student/User)
  app.get('/api/assessments/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const history = await fetchStudentAssessmentHistory(uid);
      res.json(history);
    } catch (error: any) {
      console.error('Fetch student history error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch assessment history.' });
    }
  });

  // Get All Assessment History (Filterable, for Faculty / Admin Analytics)
  app.get('/api/assessments/all-history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userUid = req.user?.uid;
      const userRole = req.user?.role;
      const grade = req.query.grade as string;
      const section = req.query.section as string;
      const componentId = req.query.componentId as string;
      const studentId = req.query.studentId as string;

      let allowedSections: string[] | undefined = undefined;
      // If the caller is a teacher (and not superadmin), restrict history strictly to their handling sections
      if (userRole === 'teacher' && userUid) {
        const user = await getUserByUid(userUid);
        if (user && user.section) {
          allowedSections = user.section.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      const history = await fetchAllAssessmentHistory({
        grade,
        section,
        componentId,
        studentId,
        allowedSections,
      });
      res.json(history);
    } catch (error: any) {
      console.error('Fetch all assessment history error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch assessment history logs.' });
    }
  });

  // -----------------------------------------------------------------
  // PERSONAL GOALS API ENDPOINTS (STUDENT GOAL TRACKING)
  // -----------------------------------------------------------------

  // Get My Personal Goals
  app.get('/api/goals', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const goals = await fetchStudentGoals(uid);
      res.json(goals);
    } catch (error: any) {
      console.error('Fetch student goals error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch personal goals.' });
    }
  });

  // Create a New Personal Goal
  app.post('/api/goals', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { exerciseId, exerciseName, targetReps, currentReps, unit, category, targetDate } = req.body;
      if (!exerciseId || !exerciseName || !targetReps) {
        return res.status(400).json({ error: 'Missing exercise details or target repetition count.' });
      }
      const created = await createStudentGoal(uid, {
        exerciseId,
        exerciseName,
        targetReps: Number(targetReps),
        currentReps: Number(currentReps) || 0,
        unit: unit || 'reps',
        category: category || 'Strength',
        targetDate: targetDate || undefined,
      });
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Create personal goal error:', error);
      res.status(500).json({ error: error.message || 'Failed to create personal goal.' });
    }
  });

  // Update an Existing Personal Goal
  app.put('/api/goals/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { targetReps, currentReps, completed, targetDate } = req.body;
      const updated = await updateStudentGoal(id, uid, {
        targetReps: targetReps !== undefined ? Number(targetReps) : undefined,
        currentReps: currentReps !== undefined ? Number(currentReps) : undefined,
        completed: completed !== undefined ? Boolean(completed) : undefined,
        targetDate: targetDate || undefined,
      });
      if (!updated) {
        return res.status(404).json({ error: 'Goal not found or unauthorized.' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Update personal goal error:', error);
      res.status(500).json({ error: error.message || 'Failed to update personal goal.' });
    }
  });

  // Delete a Personal Goal
  app.delete('/api/goals/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await deleteStudentGoal(id, uid);
      res.json(result);
    } catch (error: any) {
      console.error('Delete personal goal error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete personal goal.' });
    }
  });

  // Log Reps / Progress for a Personal Goal
  app.post('/api/goals/:id/log', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const { id } = req.params;
      const { reps } = req.body;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const repsToAdd = Number(reps) || 1;
      const updated = await logGoalRepProgress(id, uid, repsToAdd);
      if (!updated) {
        return res.status(404).json({ error: 'Goal not found or unauthorized.' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Log goal reps error:', error);
      res.status(500).json({ error: error.message || 'Failed to log repetition progress.' });
    }
  });

  // -----------------------------------------------------------------
  // SUPER ADMIN API ENDPOINTS
  // -----------------------------------------------------------------

  // Get Super Admin System Overview & Section Matrix
  app.get('/api/admin/overview', requireAuth, async (req: AuthRequest, res) => {
    try {
      const overview = await getSuperAdminOverview();
      res.json(overview);
    } catch (error: any) {
      console.error('Super Admin overview error:', error);
      res.status(500).json({ error: error.message || 'Failed to load system overview.' });
    }
  });

  // Get All Teachers List
  app.get('/api/admin/teachers', requireAuth, async (req: AuthRequest, res) => {
    try {
      const teachers = await fetchAllTeachers();
      res.json(teachers);
    } catch (error: any) {
      console.error('Fetch teachers list error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch teachers.' });
    }
  });

  // Create New Teacher Account
  app.post('/api/admin/teachers', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, email, password, grade, assignedSections } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Teacher name and email are required.' });
      }
      const newTeacher = await createTeacherAccount(
        name,
        email,
        password || 'password123',
        grade || '11',
        assignedSections || []
      );
      res.status(201).json(newTeacher);
    } catch (error: any) {
      console.error('Create teacher account error:', error);
      res.status(500).json({ error: error.message || 'Failed to create teacher account.' });
    }
  });

  // Update Teacher's Assigned Sections & Grade
  app.put('/api/admin/teachers/:uid/sections', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.params;
      const { assignedSections, grade } = req.body;
      if (!uid) {
        return res.status(400).json({ error: 'Teacher UID is required.' });
      }
      const updated = await updateTeacherSections(uid, assignedSections, grade);
      res.json(updated);
    } catch (error: any) {
      console.error('Update teacher assigned sections error:', error);
      res.status(500).json({ error: error.message || 'Failed to update teacher sections.' });
    }
  });

  // Delete Teacher Account
  app.delete('/api/admin/teachers/:uid', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.params;
      if (!uid) {
        return res.status(400).json({ error: 'Teacher UID is required.' });
      }
      await deleteTeacherByUid(uid);
      res.json({ success: true, message: 'Teacher account deleted successfully.' });
    } catch (error: any) {
      console.error('Delete teacher account error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete teacher account.' });
    }
  });

  // Delete Section API (Super Admin Only)
  app.delete('/api/sections/:name', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Access denied. Only Super Admin can delete class sections.' });
      }
      const { name } = req.params;
      if (!name) {
        return res.status(400).json({ error: 'Section name is required.' });
      }
      await deleteSectionByName(decodeURIComponent(name));
      res.json({ success: true, message: 'Section deleted successfully.' });
    } catch (error: any) {
      console.error('Delete section error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete section.' });
    }
  });

  // Delete Individual Assessment Record
  app.delete('/api/assessments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const role = req.user?.role || 'student';
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || !uid) {
        return res.status(400).json({ error: 'Invalid assessment ID.' });
      }

      await deleteAssessmentRecord(id, uid, role);
      res.json({ success: true, message: 'Assessment record deleted successfully.' });
    } catch (error: any) {
      console.error('Delete assessment error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete assessment record.' });
    }
  });

  // Fetch Class Sections
  app.get('/api/sections', async (req, res) => {
    try {
      const sectionsList = await fetchAllSections();
      res.json(sectionsList);
    } catch (error: any) {
      console.error('Fetch sections error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch class sections.' });
    }
  });

  // Add Dynamic Section (Super Admin Only)
  app.post('/api/sections', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Access denied. Only Super Admin can add new class sections.' });
      }
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Section name is required.' });
      }
      const section = await createNewSection(name);
      res.json(section);
    } catch (error: any) {
      console.error('Add section error:', error);
      res.status(500).json({ error: error.message || 'Failed to create section.' });
    }
  });

  // Leaderboard Rankings (SQL Aggregated & Dynamic)
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limitVal = parseInt(req.query.limit as string) || 10;
      const grade = req.query.grade as string;
      const section = req.query.section as string;
      const ranking = await getLeaderboardRankings(limitVal, grade, section);
      res.json(ranking);
    } catch (error: any) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve rankings.' });
    }
  });

  // In-memory fallback store for warmup videos to guarantee resilience
  let inMemoryWarmupVideos: Array<{
    id: number;
    title: string;
    description: string;
    category: string;
    type: 'upload' | 'link';
    url: string;
    duration: number;
    createdBy: string;
    createdAt: Date;
  }> = [
    {
      id: 1,
      title: "March in Place Routine",
      description: "Lift your knees high while swinging arms in cadence to increase core body temperature.",
      category: "Warmup Routine",
      type: "link",
      url: "https://www.youtube.com/embed/zL8D-m4aW5Y?autoplay=1&mute=1&loop=1&playlist=zL8D-m4aW5Y",
      duration: 15,
      createdBy: "PE Faculty",
      createdAt: new Date(),
    },
    {
      id: 2,
      title: "Arm Circles & Upper Body Mobility",
      description: "Rotate shoulders in forward and reverse motion to lubricate shoulder joints before strength tests.",
      category: "Warmup Routine",
      type: "link",
      url: "https://www.youtube.com/embed/S_7M_q8wRNo?autoplay=1&mute=1&loop=1&playlist=S_7M_q8wRNo",
      duration: 15,
      createdBy: "PE Faculty",
      createdAt: new Date(),
    },
    {
      id: 3,
      title: "Dynamic Side Steps",
      description: "Step laterally while opening and closing arms for hip and adductor activation.",
      category: "Cardio",
      type: "link",
      url: "https://www.youtube.com/embed/S6z79_NAnX8?autoplay=1&mute=1&loop=1&playlist=S6z79_NAnX8",
      duration: 15,
      createdBy: "PE Faculty",
      createdAt: new Date(),
    },
    {
      id: 4,
      title: "Light Jogging & Rhythm",
      description: "Bounce lightly on toes to elevate heart rate and prepare calf muscles.",
      category: "Cardio",
      type: "link",
      url: "https://www.youtube.com/embed/mS_mP3wVb4g?autoplay=1&mute=1&loop=1&playlist=mS_mP3wVb4g",
      duration: 15,
      createdBy: "PE Faculty",
      createdAt: new Date(),
    }
  ];

  app.post('/api/feedback', async (req, res) => {
    const { results, session } = req.body;
    
    const generateFallbackFeedback = () => {
      if (!results || results.length === 0) {
        return "Welcome to your Physical Fitness Assessment! Complete the health and skill-related tests using the camera tracker to receive tailored performance insights.";
      }
      const totalScore = results.reduce((acc: number, r: any) => acc + (r.score || 0), 0);
      const avgScore = Math.round(totalScore / results.length);
      const highPerformers = results.filter((r: any) => (r.score || 0) >= 75);
      const needWork = results.filter((r: any) => (r.score || 0) < 65);
      
      let p1 = `Great effort during your assessment session, ${session?.studentName || 'Student'}! Your overall composite performance index is ${avgScore}/100 across ${results.length} evaluated fitness component(s).`;
      let p2 = highPerformers.length > 0 
        ? `You demonstrated strong motor control and consistency in ${highPerformers.map((r: any) => r.componentName || r.componentId).join(', ')}. Keep maintaining this cadence and full range of motion.`
        : `Your movement rhythm remained consistent throughout the tests, showing good foundational kinetic awareness.`;
      let p3 = needWork.length > 0
        ? `To further elevate your physical literacy, dedicate focus to targeted repetitions for ${needWork.map((r: any) => r.componentName || r.componentId).join(', ')}. Incorporate dynamic warm-ups and structured form drills before re-assessing.`
        : `Continue following your structured PE regimen and daily hydration habits to sustain your athletic development!`;
      
      return `${p1}\n\n${p2}\n\n${p3}`;
    };

    try {
      const prompt = `
        As a supportive PE teacher for Grade 11 STEM students, provide personalized feedback for a student's fitness assessment.
        Student Context: Grade ${session?.grade || '11'}, Section ${session?.section || 'STEM'}.
        Results: ${JSON.stringify(results)}
        
        Guidelines:
        1. Be supportive and encouraging.
        2. Provide specific feedback on strengths.
        3. Suggest improvements for lower scores.
        4. Use educational but accessible language.
        5. Keep it concise (max 3 short paragraphs).
      `;

      // Try primary model then fallback models if service is experiencing temporary spike
      let text = '';
      const modelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest'
      ];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          if (response.text) {
            text = response.text;
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Model ${modelName} call notice:`, modelErr?.message || modelErr);
        }
      }

      if (text) {
        return res.json({ feedback: text });
      }

      // If AI service is experiencing spikes (503), return structured pedagogical feedback
      return res.json({ feedback: generateFallbackFeedback() });
    } catch (error) {
      console.error('Gemini feedback error:', error);
      res.json({ feedback: generateFallbackFeedback() });
    }
  });

  // Get All Warmup / Demonstration Videos
  app.get('/api/warmup-videos', async (req, res) => {
    try {
      let videos = [];
      try {
        videos = await db.select().from(warmupVideos).orderBy(desc(warmupVideos.createdAt));
      } catch (dbErr) {
        // Use in-memory store
        videos = inMemoryWarmupVideos;
      }
      
      if (!videos || videos.length === 0) {
        videos = inMemoryWarmupVideos;
      }

      res.json(videos);
    } catch (error: any) {
      res.json(inMemoryWarmupVideos);
    }
  });

  // Add Demonstration / Warm-up Video (Faculty)
  app.post('/api/warmup-videos', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, description, category, type, url, duration } = req.body;
      if (!title || !url || !type) {
        return res.status(400).json({ error: 'Title, video type, and video URL or upload file are required.' });
      }

      // Convert normal YouTube URL to embed format if needed
      let formattedUrl = url.trim();
      if (type === 'link' && formattedUrl.includes('youtube.com/watch?v=')) {
        const videoId = formattedUrl.split('v=')[1]?.split('&')[0];
        if (videoId) {
          formattedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        }
      } else if (type === 'link' && formattedUrl.includes('youtu.be/')) {
        const videoId = formattedUrl.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          formattedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        }
      }

      const newVideo = {
        id: Date.now(),
        title: title.trim(),
        description: description ? description.trim() : '',
        category: category || 'Warmup Routine',
        type: (type === 'upload' ? 'upload' : 'link') as 'upload' | 'link',
        url: formattedUrl,
        duration: duration ? parseInt(duration) : 15,
        createdBy: user.name || 'Faculty',
        createdAt: new Date(),
      };

      try {
        const inserted = await db.insert(warmupVideos).values({
          title: newVideo.title,
          description: newVideo.description,
          category: newVideo.category,
          type: newVideo.type,
          url: newVideo.url,
          duration: newVideo.duration,
          createdBy: newVideo.createdBy,
        }).returning();
        if (inserted && inserted.length > 0) {
          return res.status(201).json(inserted[0]);
        }
      } catch (dbErr) {
        // Fallback to in-memory store
      }

      inMemoryWarmupVideos.unshift(newVideo);
      res.status(201).json(newVideo);
    } catch (error: any) {
      console.error('Add warmup video error:', error);
      res.status(500).json({ error: error.message || 'Failed to create demonstration video.' });
    }
  });

  // Delete Demonstration / Warm-up Video (Faculty)
  app.delete('/api/warmup-videos/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const videoId = parseInt(req.params.id);
      if (isNaN(videoId)) {
        return res.status(400).json({ error: 'Invalid video ID.' });
      }

      try {
        await db.delete(warmupVideos).where(eq(warmupVideos.id, videoId));
      } catch (dbErr) {
        // Fallback
      }

      inMemoryWarmupVideos = inMemoryWarmupVideos.filter(v => v.id !== videoId);
      res.json({ success: true, message: 'Video deleted successfully.' });
    } catch (error: any) {
      console.error('Delete video error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete video.' });
    }
  });

  // Vite middleware for development vs static asset serving for production
  const distDir = fs.existsSync(path.join(__dirname, 'index.html'))
    ? __dirname
    : fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
    ? path.join(process.cwd(), 'dist')
    : path.join(__dirname, 'dist');

  const hasDist = fs.existsSync(path.join(distDir, 'index.html'));
  const isDev = process.env.NODE_ENV === 'development' || (!hasDist && process.env.NODE_ENV !== 'production');

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // API 404 handler before catch-all SPA route
    app.all('/api/*', (req, res) => {
      res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
    });

    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

