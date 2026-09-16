import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { users, assessments, sections, personalGoals } from './schema.ts';
import { AssessmentResult } from '../types.ts';
import crypto from 'crypto';

// Hash raw passwords securely with salt using native Node crypto
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'fitness_salt_key!').digest('hex');
}

// In-memory resilient state for zero-config preview and fault-tolerant cloud execution
interface InMemoryUser {
  id: number;
  uid: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'superadmin';
  grade?: string;
  section?: string;
  studentCode?: string;
  teacherName?: string;
  createdAt: Date;
}

interface InMemoryAssessment {
  id: number;
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  componentId: string;
  score: number;
  rawResult: string;
  validReps: number;
  invalidReps: number;
  timestamp: Date;
}

export interface InMemoryGoal {
  id: number | string;
  studentId: string;
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  currentReps: number;
  unit: string;
  category: string;
  targetDate?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pre-seeded personal goals for students
export const inMemoryGoals: InMemoryGoal[] = [
  {
    id: 1,
    studentId: 'demo-student-01',
    exerciseId: 'push-ups',
    exerciseName: 'Push-ups',
    targetReps: 25,
    currentReps: 20,
    unit: 'reps',
    category: 'Strength',
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 2,
    studentId: 'demo-student-01',
    exerciseId: 'squats',
    exerciseName: 'Bodyweight Squats',
    targetReps: 35,
    currentReps: 35,
    unit: 'reps',
    category: 'Strength',
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0],
    completed: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: 3,
    studentId: 'demo-student-01',
    exerciseId: 'sit-ups',
    exerciseName: 'Sit-ups / Curl-ups',
    targetReps: 30,
    currentReps: 18,
    unit: 'reps',
    category: 'Endurance',
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: 4,
    studentId: 'demo-student-01',
    exerciseId: 'planks',
    exerciseName: 'Isometric Core Plank',
    targetReps: 60,
    currentReps: 45,
    unit: 'seconds',
    category: 'Endurance',
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
  }
];

// Pre-seeded sections
export const inMemorySections: string[] = [
  'Section A', 'Section B', 'Section C', 'STEM 1', 'STEM 2', 'Newton', 'Einstein', 'Pascal'
];

// Pre-seeded demo accounts
const defaultPassHash = hashPassword('password123');

export const inMemoryUsers: InMemoryUser[] = [
  {
    id: 1,
    uid: 'demo-superadmin-01',
    email: 'admin@demo.com',
    password: defaultPassHash,
    name: 'Chief Super Admin',
    role: 'superadmin',
    createdAt: new Date(),
  },
  {
    id: 2,
    uid: 'demo-faculty-01',
    email: 'teacher@demo.com',
    password: defaultPassHash,
    name: 'Prof. Maria Santos',
    role: 'teacher',
    grade: '11',
    section: 'Section A',
    createdAt: new Date(),
  },
  {
    id: 3,
    uid: 'demo-faculty-02',
    email: 'mendoza.teacher@demo.com',
    password: defaultPassHash,
    name: 'Prof. Roberto Mendoza',
    role: 'teacher',
    grade: '11',
    section: 'Section B',
    createdAt: new Date(),
  },
  {
    id: 4,
    uid: 'demo-faculty-03',
    email: 'garcia.teacher@demo.com',
    password: defaultPassHash,
    name: 'Dr. Elena Garcia',
    role: 'teacher',
    grade: '12',
    section: 'STEM 1, STEM 2',
    createdAt: new Date(),
  },
  {
    id: 5,
    uid: 'demo-student-01',
    email: 'student@demo.com',
    password: defaultPassHash,
    name: 'Demo Student',
    role: 'student',
    grade: '11',
    section: 'Section A',
    studentCode: 'STD-2026-001',
    createdAt: new Date(),
  },
  {
    id: 6,
    uid: 'demo-student-02',
    email: 'marcus@demo.com',
    password: defaultPassHash,
    name: 'Marcus Vance',
    role: 'student',
    grade: '11',
    section: 'Section A',
    studentCode: 'STD-2026-002',
    createdAt: new Date(),
  },
  {
    id: 7,
    uid: 'demo-student-03',
    email: 'chloe@demo.com',
    password: defaultPassHash,
    name: 'Chloe Alcantara',
    role: 'student',
    grade: '11',
    section: 'Section B',
    studentCode: 'STD-2026-003',
    createdAt: new Date(),
  },
  {
    id: 8,
    uid: 'demo-student-04',
    email: 'ethan@demo.com',
    password: defaultPassHash,
    name: 'Ethan Reyes',
    role: 'student',
    grade: '12',
    section: 'STEM 1',
    studentCode: 'STD-2026-004',
    createdAt: new Date(),
  },
  {
    id: 9,
    uid: 'demo-student-05',
    email: 'sophia@demo.com',
    password: defaultPassHash,
    name: 'Sophia Mendoza',
    role: 'student',
    grade: '10',
    section: 'Section C',
    studentCode: 'STD-2026-005',
    createdAt: new Date(),
  },
  {
    id: 10,
    uid: 'demo-student-06',
    email: 'gabriel@demo.com',
    password: defaultPassHash,
    name: 'Gabriel Torres',
    role: 'student',
    grade: '11',
    section: 'Section A',
    studentCode: 'STD-2026-006',
    createdAt: new Date(),
  }
];

// Seed realistic assessment benchmarks for leaderboard and analytics
export const inMemoryAssessments: InMemoryAssessment[] = [
  // Demo Student (demo-student-01) - Comprehensive Full Fitness Profile
  {
    id: 1,
    studentId: 'demo-student-01',
    studentName: 'Demo Student',
    grade: '11',
    section: 'Section A',
    componentId: 'strength',
    score: 92,
    rawResult: '30 reps',
    validReps: 30,
    invalidReps: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 2,
    studentId: 'demo-student-01',
    studentName: 'Demo Student',
    grade: '11',
    section: 'Section A',
    componentId: 'endurance',
    score: 94,
    rawResult: '36 reps',
    validReps: 36,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: 3,
    studentId: 'demo-student-01',
    studentName: 'Demo Student',
    grade: '11',
    section: 'Section A',
    componentId: 'cardio',
    score: 89,
    rawResult: '102 bpm',
    validReps: 120,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: 4,
    studentId: 'demo-student-01',
    studentName: 'Demo Student',
    grade: '11',
    section: 'Section A',
    componentId: 'flexibility',
    score: 88,
    rawResult: '40 cm',
    validReps: 1,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: 5,
    studentId: 'demo-student-01',
    studentName: 'Demo Student',
    grade: '11',
    section: 'Section A',
    componentId: 'power',
    score: 90,
    rawResult: '48 cm',
    validReps: 3,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 6,
    studentId: 'demo-student-01',
    studentName: 'Demo Student',
    grade: '11',
    section: 'Section A',
    componentId: 'balance',
    score: 91,
    rawResult: '42 sec',
    validReps: 1,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30),
  },
  {
    id: 7,
    studentId: 'demo-student-01',
    studentName: 'Demo Student',
    grade: '11',
    section: 'Section A',
    componentId: 'exercise-detection',
    score: 95,
    rawResult: '25 reps',
    validReps: 25,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36),
  },

  // Marcus Vance (demo-student-02)
  {
    id: 8,
    studentId: 'demo-student-02',
    studentName: 'Marcus Vance',
    grade: '11',
    section: 'Section A',
    componentId: 'strength',
    score: 95,
    rawResult: '32 reps',
    validReps: 32,
    invalidReps: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: 9,
    studentId: 'demo-student-02',
    studentName: 'Marcus Vance',
    grade: '11',
    section: 'Section A',
    componentId: 'cardio',
    score: 92,
    rawResult: '98 bpm',
    validReps: 120,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: 10,
    studentId: 'demo-student-02',
    studentName: 'Marcus Vance',
    grade: '11',
    section: 'Section A',
    componentId: 'power',
    score: 88,
    rawResult: '46 cm',
    validReps: 3,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10),
  },

  // Chloe Alcantara (demo-student-03)
  {
    id: 11,
    studentId: 'demo-student-03',
    studentName: 'Chloe Alcantara',
    grade: '11',
    section: 'Section B',
    componentId: 'endurance',
    score: 94,
    rawResult: '35 reps',
    validReps: 35,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7),
  },
  {
    id: 12,
    studentId: 'demo-student-03',
    studentName: 'Chloe Alcantara',
    grade: '11',
    section: 'Section B',
    componentId: 'flexibility',
    score: 88,
    rawResult: '42 cm',
    validReps: 1,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 11),
  },
  {
    id: 13,
    studentId: 'demo-student-03',
    studentName: 'Chloe Alcantara',
    grade: '11',
    section: 'Section B',
    componentId: 'balance',
    score: 93,
    rawResult: '48 sec',
    validReps: 1,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 15),
  },

  // Ethan Reyes (demo-student-04)
  {
    id: 14,
    studentId: 'demo-student-04',
    studentName: 'Ethan Reyes',
    grade: '12',
    section: 'STEM 1',
    componentId: 'power',
    score: 91,
    rawResult: '52 cm',
    validReps: 3,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14),
  },
  {
    id: 15,
    studentId: 'demo-student-04',
    studentName: 'Ethan Reyes',
    grade: '12',
    section: 'STEM 1',
    componentId: 'strength',
    score: 87,
    rawResult: '26 reps',
    validReps: 26,
    invalidReps: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18),
  },

  // Sophia Mendoza (demo-student-05)
  {
    id: 16,
    studentId: 'demo-student-05',
    studentName: 'Sophia Mendoza',
    grade: '10',
    section: 'Section C',
    componentId: 'balance',
    score: 89,
    rawResult: '45 sec',
    validReps: 1,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 16),
  },
  {
    id: 17,
    studentId: 'demo-student-05',
    studentName: 'Sophia Mendoza',
    grade: '10',
    section: 'Section C',
    componentId: 'flexibility',
    score: 92,
    rawResult: '44 cm',
    validReps: 1,
    invalidReps: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20),
  },

  // Gabriel Torres (demo-student-06)
  {
    id: 18,
    studentId: 'demo-student-06',
    studentName: 'Gabriel Torres',
    grade: '11',
    section: 'Section A',
    componentId: 'strength',
    score: 86,
    rawResult: '24 reps',
    validReps: 24,
    invalidReps: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
  },
  {
    id: 19,
    studentId: 'demo-student-06',
    studentName: 'Gabriel Torres',
    grade: '11',
    section: 'Section A',
    componentId: 'cardio',
    score: 85,
    rawResult: '110 bpm',
    validReps: 115,
    invalidReps: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
  }
];

// Local user registration (PostgreSQL + In-Memory Fallback)
export async function registerLocalUser(
  email: string,
  passwordRaw: string,
  name: string,
  role: 'student' | 'teacher' | 'superadmin',
  grade?: string,
  section?: string,
  studentCode?: string,
  teacherName?: string
) {
  const hashedPassword = hashPassword(passwordRaw);
  const normalizedEmail = email.toLowerCase().trim();

  // Check in-memory first for duplicates
  const existingInMem = inMemoryUsers.find(u => u.email === normalizedEmail);
  if (existingInMem) {
    throw new Error('An account with this email address already exists.');
  }

  const uid = crypto.randomUUID();
  const newUser: InMemoryUser = {
    id: inMemoryUsers.length + 1,
    uid,
    email: normalizedEmail,
    password: hashedPassword,
    name,
    role,
    grade,
    section,
    studentCode,
    teacherName,
    createdAt: new Date()
  };

  inMemoryUsers.push(newUser);

  try {
    const result = await db.insert(users)
      .values({
        uid,
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role,
        grade,
        section,
        studentCode,
        teacherName,
      })
      .returning();

    return result[0] || newUser;
  } catch (error: any) {
    if (error.code === '23505' || String(error).includes('unique')) {
      throw new Error('An account with this email address already exists.');
    }
    // Return in-memory user if DB is in fallback mode
    return newUser;
  }
}

// Fetch all registered teachers for student sign up dropdown
export async function fetchPublicTeachersList() {
  try {
    const teacherRecords = await db.select().from(users).where(eq(users.role, 'teacher'));
    if (teacherRecords && teacherRecords.length > 0) {
      return teacherRecords.map(t => ({
        uid: t.uid,
        name: t.name,
        section: t.section || '',
        grade: t.grade || ''
      }));
    }
  } catch (error) {
    // Fallback to memory
  }

  return inMemoryUsers
    .filter(u => u.role === 'teacher')
    .map(t => ({
      uid: t.uid,
      name: t.name,
      section: t.section || '',
      grade: t.grade || ''
    }));
}

// Local user authentication from PostgreSQL / In-Memory
export async function authenticateLocalUser(email: string, passwordRaw: string) {
  const hashedPassword = hashPassword(passwordRaw);
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    const user = result[0];
    if (user) {
      if (user.password !== hashedPassword) {
        throw new Error('Incorrect password.');
      }
      return user;
    }
  } catch (error: any) {
    if (error.message === 'Incorrect password.') throw error;
    // Database query failed, continue to in-memory check
  }

  // Fallback to in-memory store
  const inMemUser = inMemoryUsers.find(u => u.email === normalizedEmail);
  if (!inMemUser) {
    throw new Error('Account not found.');
  }
  if (inMemUser.password !== hashedPassword) {
    throw new Error('Incorrect password.');
  }
  return inMemUser;
}

// Get or create a user profile using safe upsert
export async function getOrCreateUser(
  uid: string,
  email: string,
  name: string,
  role: 'student' | 'teacher' | 'superadmin',
  grade?: string,
  section?: string,
  studentCode?: string,
  teacherName?: string
) {
  const normalizedEmail = email.toLowerCase().trim();

  // Upsert in-memory
  const existingIdx = inMemoryUsers.findIndex(u => u.uid === uid || u.email === normalizedEmail);
  if (existingIdx !== -1) {
    inMemoryUsers[existingIdx] = {
      ...inMemoryUsers[existingIdx],
      email: normalizedEmail,
      name,
      role,
      grade,
      section,
      studentCode,
      teacherName
    };
  } else {
    inMemoryUsers.push({
      id: inMemoryUsers.length + 1,
      uid,
      email: normalizedEmail,
      password: defaultPassHash,
      name,
      role,
      grade,
      section,
      studentCode,
      teacherName,
      createdAt: new Date()
    });
  }

  try {
    const result = await db.insert(users)
      .values({
        uid,
        email: normalizedEmail,
        name,
        role,
        grade,
        section,
        studentCode,
        teacherName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          name,
          role,
          grade,
          section,
          studentCode,
          teacherName,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    const fallbackUser = inMemoryUsers.find(u => u.uid === uid) || {
      id: 1, uid, email, name, role, grade, section, studentCode, teacherName, createdAt: new Date()
    };
    return fallbackUser;
  }
}

// Get user profile by UID
export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (result[0]) return result[0];
  } catch (error) {
    // Database query failed, continue to in-memory check
  }

  const inMemUser = inMemoryUsers.find(u => u.uid === uid);
  return inMemUser || null;
}

// Get all students and their historical assessments (scoped by allowedSections for teachers)
export async function fetchAllStudentsPerformance(allowedSections?: string[]) {
  try {
    let studentList = await db.select().from(users).where(eq(users.role, 'student'));
    if (allowedSections && allowedSections.length > 0) {
      studentList = studentList.filter(s => s.section && allowedSections.includes(s.section));
    }

    const assessmentList = await db.select().from(assessments).orderBy(desc(assessments.timestamp));

    if (studentList && studentList.length > 0) {
      return studentList.map(student => {
        const studentAssessments = assessmentList
          .filter(a => a.studentId === student.uid)
          .map(a => ({
            componentId: a.componentId,
            rawResult: a.rawResult,
            score: a.score,
            validReps: a.validReps,
            invalidReps: a.invalidReps,
            timestamp: a.timestamp,
          }));

        return {
          uid: student.uid,
          name: student.name,
          email: student.email,
          grade: student.grade || 'N/A',
          section: student.section || 'N/A',
          studentCode: student.studentCode || 'N/A',
          assessments: studentAssessments,
        };
      });
    }
  } catch (error) {
    // Graceful fallback to in-memory store
  }

  // In-memory fallback
  let studentList = inMemoryUsers.filter(u => u.role === 'student');
  if (allowedSections && allowedSections.length > 0) {
    studentList = studentList.filter(s => s.section && allowedSections.includes(s.section));
  }

  return studentList.map(student => {
    const studentAssessments = inMemoryAssessments
      .filter(a => a.studentId === student.uid)
      .map(a => ({
        componentId: a.componentId,
        rawResult: a.rawResult,
        score: a.score,
        validReps: a.validReps,
        invalidReps: a.invalidReps,
        timestamp: a.timestamp,
      }));

    return {
      uid: student.uid,
      name: student.name,
      email: student.email,
      grade: student.grade || 'N/A',
      section: student.section || 'N/A',
      studentCode: student.studentCode || 'N/A',
      assessments: studentAssessments,
    };
  });
}

// Get assessment history for a specific student
export async function fetchStudentAssessmentHistory(studentId: string) {
  try {
    const result = await db.select()
      .from(assessments)
      .where(eq(assessments.studentId, studentId))
      .orderBy(desc(assessments.timestamp));

    if (result && result.length > 0) {
      return result.map(a => ({
        id: a.id,
        studentId: a.studentId,
        studentName: a.studentName,
        grade: a.grade,
        section: a.section,
        componentId: a.componentId,
        score: a.score,
        rawResult: a.rawResult,
        validReps: a.validReps,
        invalidReps: a.invalidReps,
        timestamp: a.timestamp,
        date: a.timestamp instanceof Date ? a.timestamp.toISOString() : String(a.timestamp),
      }));
    }
  } catch (error) {
    // Database query failed, fallback to in-memory
  }

  return inMemoryAssessments
    .filter(a => a.studentId === studentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(a => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.studentName,
      grade: a.grade,
      section: a.section,
      componentId: a.componentId,
      score: a.score,
      rawResult: a.rawResult,
      validReps: a.validReps,
      invalidReps: a.invalidReps,
      timestamp: a.timestamp,
      date: a.timestamp instanceof Date ? a.timestamp.toISOString() : String(a.timestamp),
    }));
}

// Get all assessment history records with optional filters (for faculty and class logs)
export async function fetchAllAssessmentHistory(filters?: {
  grade?: string;
  section?: string;
  componentId?: string;
  studentId?: string;
  allowedSections?: string[];
}) {
  try {
    const conditions = [];
    if (filters?.studentId) {
      conditions.push(eq(assessments.studentId, filters.studentId));
    }
    if (filters?.grade && filters.grade !== 'All Grades') {
      conditions.push(eq(assessments.grade, filters.grade));
    }
    if (filters?.section && filters.section !== 'All Sections') {
      conditions.push(eq(assessments.section, filters.section));
    }
    if (filters?.componentId && filters.componentId !== 'All') {
      conditions.push(eq(assessments.componentId, filters.componentId));
    }

    let queryBuilder = db.select({
      id: assessments.id,
      studentId: assessments.studentId,
      studentName: assessments.studentName,
      grade: assessments.grade,
      section: assessments.section,
      componentId: assessments.componentId,
      score: assessments.score,
      rawResult: assessments.rawResult,
      validReps: assessments.validReps,
      invalidReps: assessments.invalidReps,
      timestamp: assessments.timestamp,
      studentCode: users.studentCode,
    })
    .from(assessments)
    .leftJoin(users, eq(assessments.studentId, users.uid));

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    let result = await queryBuilder.orderBy(desc(assessments.timestamp));

    if (filters?.allowedSections && filters.allowedSections.length > 0) {
      result = result.filter(r => r.section && filters.allowedSections!.includes(r.section));
    }

    if (result && result.length > 0) {
      return result.map(a => ({
        id: a.id,
        studentId: a.studentId,
        studentName: a.studentName,
        studentCode: a.studentCode || 'N/A',
        grade: a.grade,
        section: a.section,
        componentId: a.componentId,
        score: a.score,
        rawResult: a.rawResult,
        validReps: a.validReps,
        invalidReps: a.invalidReps,
        timestamp: a.timestamp,
        date: a.timestamp instanceof Date ? a.timestamp.toISOString() : String(a.timestamp),
      }));
    }
  } catch (error) {
    // Fallback to in-memory filter
  }

  return inMemoryAssessments
    .filter(a => {
      if (filters?.allowedSections && filters.allowedSections.length > 0 && !filters.allowedSections.includes(a.section)) return false;
      if (filters?.studentId && a.studentId !== filters.studentId) return false;
      if (filters?.grade && filters.grade !== 'All Grades' && a.grade !== filters.grade) return false;
      if (filters?.section && filters.section !== 'All Sections' && a.section !== filters.section) return false;
      if (filters?.componentId && filters.componentId !== 'All' && a.componentId !== filters.componentId) return false;
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(a => {
      const u = inMemoryUsers.find(user => user.uid === a.studentId);
      return {
        id: a.id,
        studentId: a.studentId,
        studentName: a.studentName,
        studentCode: u?.studentCode || 'N/A',
        grade: a.grade,
        section: a.section,
        componentId: a.componentId,
        score: a.score,
        rawResult: a.rawResult,
        validReps: a.validReps,
        invalidReps: a.invalidReps,
        timestamp: a.timestamp,
        date: a.timestamp instanceof Date ? a.timestamp.toISOString() : String(a.timestamp),
      };
    });
}

// -------------------------------------------------------------
// SUPER ADMIN OPERATIONS & TEACHER MANAGEMENT
// -------------------------------------------------------------

export function parseAssignedSections(sectionStr?: string): string[] {
  if (!sectionStr) return [];
  return sectionStr.split(',').map(s => s.trim()).filter(Boolean);
}

// Fetch all teachers with their assigned sections and student count
export async function fetchAllTeachers() {
  let teachersList: Array<{
    uid: string;
    name: string;
    email: string;
    grade?: string | null;
    section?: string | null;
    createdAt?: Date | string;
  }> = [];

  let studentsList: Array<{ uid: string; section?: string | null }> = [];

  try {
    const teachersResult = await db.select({
      uid: users.uid,
      name: users.name,
      email: users.email,
      grade: users.grade,
      section: users.section,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.role, 'teacher'));

    const studentsResult = await db.select({
      uid: users.uid,
      section: users.section,
    }).from(users).where(eq(users.role, 'student'));

    teachersList = teachersResult;
    studentsList = studentsResult;
  } catch (error) {
    // Fallback to in-memory
    teachersList = inMemoryUsers.filter(u => u.role === 'teacher');
    studentsList = inMemoryUsers.filter(u => u.role === 'student');
  }

  if (teachersList.length === 0) {
    teachersList = inMemoryUsers.filter(u => u.role === 'teacher');
  }
  if (studentsList.length === 0) {
    studentsList = inMemoryUsers.filter(u => u.role === 'student');
  }

  return teachersList.map(teacher => {
    const assigned = parseAssignedSections(teacher.section || '');
    const studentCount = studentsList.filter(s => s.section && assigned.includes(s.section)).length;
    return {
      uid: teacher.uid,
      name: teacher.name,
      email: teacher.email,
      grade: teacher.grade || '11',
      section: teacher.section || '',
      assignedSections: assigned,
      studentCount,
      createdAt: teacher.createdAt instanceof Date ? teacher.createdAt.toISOString() : String(teacher.createdAt || new Date().toISOString()),
    };
  });
}

// Create new Teacher Account by Super Admin
export async function createTeacherAccount(
  name: string,
  email: string,
  passwordRaw: string = 'password123',
  grade: string = '11',
  assignedSections: string[] | string = []
) {
  const sectionsStr = Array.isArray(assignedSections) ? assignedSections.join(', ') : assignedSections;
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = hashPassword(passwordRaw);

  const existingInMem = inMemoryUsers.find(u => u.email === normalizedEmail);
  if (existingInMem) {
    throw new Error('A teacher account with this email address already exists.');
  }

  const uid = crypto.randomUUID();
  const newTeacher: InMemoryUser = {
    id: inMemoryUsers.length + 1,
    uid,
    email: normalizedEmail,
    password: hashedPassword,
    name,
    role: 'teacher',
    grade,
    section: sectionsStr,
    createdAt: new Date(),
  };

  inMemoryUsers.push(newTeacher);

  try {
    const result = await db.insert(users)
      .values({
        uid,
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role: 'teacher',
        grade,
        section: sectionsStr,
      })
      .returning();

    const created = result[0] || newTeacher;
    return {
      uid: created.uid,
      name: created.name,
      email: created.email,
      grade: created.grade,
      section: created.section,
      assignedSections: parseAssignedSections(created.section || ''),
      studentCount: 0,
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
    };
  } catch (error: any) {
    if (error.code === '23505' || String(error).includes('unique')) {
      throw new Error('A teacher account with this email address already exists.');
    }
    return {
      uid: newTeacher.uid,
      name: newTeacher.name,
      email: newTeacher.email,
      grade: newTeacher.grade,
      section: newTeacher.section,
      assignedSections: parseAssignedSections(newTeacher.section || ''),
      studentCount: 0,
      createdAt: newTeacher.createdAt.toISOString(),
    };
  }
}

// Update Teacher's assigned sections & grade
export async function updateTeacherSections(uid: string, assignedSections: string[] | string, grade?: string) {
  const sectionsStr = Array.isArray(assignedSections) ? assignedSections.join(', ') : assignedSections;

  // Update in-memory
  const teacher = inMemoryUsers.find(u => u.uid === uid && u.role === 'teacher');
  if (teacher) {
    teacher.section = sectionsStr;
    if (grade) teacher.grade = grade;
  }

  try {
    const updateObj: Record<string, any> = { section: sectionsStr };
    if (grade) updateObj.grade = grade;

    const result = await db.update(users)
      .set(updateObj)
      .where(and(eq(users.uid, uid), eq(users.role, 'teacher')))
      .returning();

    const updated = result[0] || teacher;
    return {
      uid: updated.uid,
      name: updated.name,
      email: updated.email,
      grade: updated.grade,
      section: updated.section,
      assignedSections: parseAssignedSections(updated.section || ''),
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
    };
  } catch (error) {
    return {
      uid: teacher?.uid || uid,
      name: teacher?.name || 'Teacher',
      email: teacher?.email || '',
      grade: teacher?.grade || grade || '11',
      section: sectionsStr,
      assignedSections: parseAssignedSections(sectionsStr),
      createdAt: new Date().toISOString(),
    };
  }
}

// Delete Teacher Account
export async function deleteTeacherByUid(uid: string) {
  const idx = inMemoryUsers.findIndex(u => u.uid === uid && u.role === 'teacher');
  if (idx !== -1) {
    inMemoryUsers.splice(idx, 1);
  }

  try {
    await db.delete(users).where(and(eq(users.uid, uid), eq(users.role, 'teacher')));
    return { success: true };
  } catch (error) {
    return { success: true };
  }
}

// Delete Section
export async function deleteSectionByName(name: string) {
  const trimmed = name.trim();
  const secIdx = inMemorySections.indexOf(trimmed);
  if (secIdx !== -1) {
    inMemorySections.splice(secIdx, 1);
  }

  try {
    await db.delete(sections).where(eq(sections.name, trimmed));
    return { success: true };
  } catch (error) {
    return { success: true };
  }
}

// Get comprehensive Super Admin Overview & Section Matrix
export async function getSuperAdminOverview() {
  const allSections = await fetchAllSections();
  const allTeachers = await fetchAllTeachers();
  const allStudents = await fetchAllStudentsPerformance();
  const allAssessments = await fetchAllAssessmentHistory();

  const totalSections = allSections.length;
  const totalTeachers = allTeachers.length;
  const totalStudents = allStudents.length;
  const totalAssessments = allAssessments.length;

  const totalScoresSum = allAssessments.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
  const averageScore = totalAssessments > 0 ? Math.round(totalScoresSum / totalAssessments) : 0;

  // Build section directory matrix
  const sectionMatrix = allSections.map(secName => {
    // Assigned teachers for this section
    const assignedTeachers = allTeachers
      .filter(t => t.assignedSections.includes(secName))
      .map(t => ({ uid: t.uid, name: t.name, email: t.email }));

    // Students enrolled in this section
    const enrolledStudents = allStudents
      .filter(s => s.section === secName)
      .map(s => {
        const studentAssessments = s.assessments || [];
        const studentScoreSum = studentAssessments.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
        const avg = studentAssessments.length > 0 ? Math.round(studentScoreSum / studentAssessments.length) : 0;
        
        let lastActive = 'No assessments';
        if (studentAssessments.length > 0 && studentAssessments[0].timestamp) {
          lastActive = new Date(studentAssessments[0].timestamp).toLocaleDateString();
        }

        return {
          uid: s.uid,
          name: s.name,
          email: s.email,
          grade: s.grade,
          section: s.section,
          studentCode: s.studentCode,
          assessmentsCount: studentAssessments.length,
          averageScore: avg,
          lastActive,
        };
      });

    // Assessments in this section
    const secAssessments = allAssessments.filter(a => a.section === secName);
    const secScoreSum = secAssessments.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
    const secAvg = secAssessments.length > 0 ? Math.round(secScoreSum / secAssessments.length) : 0;

    // Detect grade from enrolled students or default
    const grade = enrolledStudents[0]?.grade || '11';

    return {
      sectionName: secName,
      grade,
      teachers: assignedTeachers,
      studentsCount: enrolledStudents.length,
      students: enrolledStudents,
      averageScore: secAvg,
    };
  });

  return {
    totalSections,
    totalTeachers,
    totalStudents,
    totalAssessments,
    averageScore,
    sections: sectionMatrix,
    teachers: allTeachers,
  };
}

// Delete specific assessment record by ID
export async function deleteAssessmentRecord(id: number, userUid: string, userRole: 'student' | 'teacher' | 'superadmin') {
  // In-memory delete
  const idx = inMemoryAssessments.findIndex(a => {
    if (a.id !== id) return false;
    if (userRole === 'teacher' || userRole === 'superadmin') return true;
    return a.studentId === userUid;
  });

  if (idx !== -1) {
    inMemoryAssessments.splice(idx, 1);
  }

  try {
    const condition = (userRole === 'teacher' || userRole === 'superadmin')
      ? eq(assessments.id, id)
      : and(eq(assessments.id, id), eq(assessments.studentId, userUid));

    await db.delete(assessments).where(condition);
    return { success: true };
  } catch (error) {
    return { success: true };
  }
}

// Save assessment result (PostgreSQL + In-Memory)
export async function saveAssessmentResult(
  studentId: string,
  studentName: string,
  grade: string,
  section: string,
  result: AssessmentResult
) {
  const newAssessment: InMemoryAssessment = {
    id: inMemoryAssessments.length + 1,
    studentId,
    studentName,
    grade,
    section,
    componentId: result.componentId,
    score: Number(result.score) || 0,
    rawResult: String(result.rawResult),
    validReps: Number(result.validReps) || 0,
    invalidReps: Number(result.invalidReps) || 0,
    timestamp: new Date(),
  };

  inMemoryAssessments.unshift(newAssessment);

  // Auto-progress any matching student goals
  try {
    const validCount = Number(result.validReps) || 0;
    if (validCount > 0) {
      await autoUpdateGoalFromAssessment(studentId, result.componentId, validCount);
    }
  } catch (goalErr) {
    console.warn('Auto goal update error:', goalErr);
  }

  try {
    const inserted = await db.insert(assessments)
      .values({
        studentId,
        studentName,
        grade,
        section,
        componentId: result.componentId,
        score: Number(result.score) || 0,
        rawResult: String(result.rawResult),
        validReps: Number(result.validReps) || 0,
        invalidReps: Number(result.invalidReps) || 0,
      })
      .returning();
    return inserted[0] || newAssessment;
  } catch (error) {
    return newAssessment;
  }
}

// -------------------------------------------------------------
// PERSONAL GOALS OPERATIONS
// -------------------------------------------------------------

export async function autoUpdateGoalFromAssessment(studentId: string, componentId: string, reps: number) {
  // Check in-memory goals
  const studentGoals = inMemoryGoals.filter(g => g.studentId === studentId);
  for (const g of studentGoals) {
    // Match by direct exerciseId or component mapping
    const isMatch = 
      g.exerciseId === componentId ||
      (componentId === 'strength' && (g.exerciseId === 'push-ups' || g.exerciseId === 'squats')) ||
      (componentId === 'endurance' && (g.exerciseId === 'sit-ups' || g.exerciseId === 'planks')) ||
      (componentId === 'cardio' && (g.exerciseId === 'cardio' || g.exerciseId === 'jumping-jacks' || g.exerciseId === 'high-knees'));

    if (isMatch) {
      g.currentReps = Math.max(g.currentReps, reps);
      if (g.currentReps >= g.targetReps) {
        g.completed = true;
      }
      g.updatedAt = new Date();
    }
  }

  try {
    const dbGoals = await db.select().from(personalGoals).where(eq(personalGoals.studentId, studentId));
    for (const g of dbGoals) {
      const isMatch = 
        g.exerciseId === componentId ||
        (componentId === 'strength' && (g.exerciseId === 'push-ups' || g.exerciseId === 'squats')) ||
        (componentId === 'endurance' && (g.exerciseId === 'sit-ups' || g.exerciseId === 'planks')) ||
        (componentId === 'cardio' && (g.exerciseId === 'cardio' || g.exerciseId === 'jumping-jacks' || g.exerciseId === 'high-knees'));

      if (isMatch) {
        const newCurrent = Math.max(g.currentReps, reps);
        const isCompleted = newCurrent >= g.targetReps ? 1 : 0;
        await db.update(personalGoals)
          .set({
            currentReps: newCurrent,
            completed: isCompleted,
            updatedAt: new Date()
          })
          .where(eq(personalGoals.id, g.id));
      }
    }
  } catch (err) {
    // Fallback to in-memory handled above
  }
}

export async function fetchStudentGoals(studentId: string) {
  try {
    const result = await db.select().from(personalGoals).where(eq(personalGoals.studentId, studentId)).orderBy(desc(personalGoals.createdAt));
    if (result && result.length > 0) {
      return result.map(g => ({
        id: g.id,
        studentId: g.studentId,
        exerciseId: g.exerciseId,
        exerciseName: g.exerciseName,
        targetReps: g.targetReps,
        currentReps: g.currentReps,
        unit: g.unit,
        category: g.category,
        targetDate: g.targetDate || undefined,
        completed: Boolean(g.completed),
        createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : String(g.createdAt),
        lastUpdated: g.updatedAt instanceof Date ? g.updatedAt.toISOString() : String(g.updatedAt),
      }));
    }
  } catch (error) {
    // Fallback to in-memory
  }

  return inMemoryGoals
    .filter(g => g.studentId === studentId)
    .map(g => ({
      id: g.id,
      studentId: g.studentId,
      exerciseId: g.exerciseId,
      exerciseName: g.exerciseName,
      targetReps: g.targetReps,
      currentReps: g.currentReps,
      unit: g.unit,
      category: g.category,
      targetDate: g.targetDate,
      completed: g.completed,
      createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : String(g.createdAt),
      lastUpdated: g.updatedAt instanceof Date ? g.updatedAt.toISOString() : String(g.updatedAt),
    }));
}

export async function createStudentGoal(studentId: string, data: {
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  currentReps?: number;
  unit?: string;
  category?: string;
  targetDate?: string;
}) {
  const current = Number(data.currentReps) || 0;
  const target = Math.max(1, Number(data.targetReps) || 10);
  const isCompleted = current >= target;

  const newGoal: InMemoryGoal = {
    id: Date.now(),
    studentId,
    exerciseId: data.exerciseId,
    exerciseName: data.exerciseName,
    targetReps: target,
    currentReps: current,
    unit: data.unit || 'reps',
    category: data.category || 'Strength',
    targetDate: data.targetDate,
    completed: isCompleted,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryGoals.unshift(newGoal);

  try {
    const inserted = await db.insert(personalGoals)
      .values({
        studentId,
        exerciseId: data.exerciseId,
        exerciseName: data.exerciseName,
        targetReps: target,
        currentReps: current,
        unit: data.unit || 'reps',
        category: data.category || 'Strength',
        targetDate: data.targetDate || null,
        completed: isCompleted ? 1 : 0,
      })
      .returning();

    if (inserted[0]) {
      return {
        id: inserted[0].id,
        studentId: inserted[0].studentId,
        exerciseId: inserted[0].exerciseId,
        exerciseName: inserted[0].exerciseName,
        targetReps: inserted[0].targetReps,
        currentReps: inserted[0].currentReps,
        unit: inserted[0].unit,
        category: inserted[0].category,
        targetDate: inserted[0].targetDate || undefined,
        completed: Boolean(inserted[0].completed),
        createdAt: inserted[0].createdAt.toISOString(),
        lastUpdated: inserted[0].updatedAt.toISOString(),
      };
    }
  } catch (error) {
    // Return in-memory version
  }

  return {
    ...newGoal,
    createdAt: newGoal.createdAt.toISOString(),
    lastUpdated: newGoal.updatedAt.toISOString(),
  };
}

export async function updateStudentGoal(
  goalId: number | string,
  studentId: string,
  updates: {
    targetReps?: number;
    currentReps?: number;
    completed?: boolean;
    targetDate?: string;
  }
) {
  const parsedId = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
  const inMem = inMemoryGoals.find(g => (g.id === goalId || g.id === parsedId) && g.studentId === studentId);
  
  if (inMem) {
    if (updates.targetReps !== undefined) inMem.targetReps = Math.max(1, Number(updates.targetReps));
    if (updates.currentReps !== undefined) inMem.currentReps = Math.max(0, Number(updates.currentReps));
    if (updates.completed !== undefined) inMem.completed = updates.completed;
    else if (inMem.currentReps >= inMem.targetReps) inMem.completed = true;
    if (updates.targetDate !== undefined) inMem.targetDate = updates.targetDate;
    inMem.updatedAt = new Date();
  }

  try {
    const numId = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
    const dbUpdates: any = { updatedAt: new Date() };
    if (updates.targetReps !== undefined) dbUpdates.targetReps = Math.max(1, Number(updates.targetReps));
    if (updates.currentReps !== undefined) dbUpdates.currentReps = Math.max(0, Number(updates.currentReps));
    if (updates.targetDate !== undefined) dbUpdates.targetDate = updates.targetDate;
    if (updates.completed !== undefined) {
      dbUpdates.completed = updates.completed ? 1 : 0;
    } else if (updates.currentReps !== undefined && inMem) {
      dbUpdates.completed = inMem.currentReps >= inMem.targetReps ? 1 : 0;
    }

    const updated = await db.update(personalGoals)
      .set(dbUpdates)
      .where(and(eq(personalGoals.id, numId), eq(personalGoals.studentId, studentId)))
      .returning();

    if (updated[0]) {
      return {
        id: updated[0].id,
        studentId: updated[0].studentId,
        exerciseId: updated[0].exerciseId,
        exerciseName: updated[0].exerciseName,
        targetReps: updated[0].targetReps,
        currentReps: updated[0].currentReps,
        unit: updated[0].unit,
        category: updated[0].category,
        targetDate: updated[0].targetDate || undefined,
        completed: Boolean(updated[0].completed),
        createdAt: updated[0].createdAt.toISOString(),
        lastUpdated: updated[0].updatedAt.toISOString(),
      };
    }
  } catch (error) {
    // Return in-memory
  }

  return inMem ? {
    ...inMem,
    createdAt: inMem.createdAt.toISOString(),
    lastUpdated: inMem.updatedAt.toISOString(),
  } : null;
}

export async function deleteStudentGoal(goalId: number | string, studentId: string) {
  const parsedId = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
  const idx = inMemoryGoals.findIndex(g => (g.id === goalId || g.id === parsedId) && g.studentId === studentId);
  if (idx !== -1) {
    inMemoryGoals.splice(idx, 1);
  }

  try {
    const numId = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
    await db.delete(personalGoals)
      .where(and(eq(personalGoals.id, numId), eq(personalGoals.studentId, studentId)));
    return { success: true };
  } catch (error) {
    return { success: true };
  }
}

export async function logGoalRepProgress(goalId: number | string, studentId: string, repsToAdd: number) {
  const parsedId = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
  const inMem = inMemoryGoals.find(g => (g.id === goalId || g.id === parsedId) && g.studentId === studentId);
  
  if (inMem) {
    inMem.currentReps = Math.max(0, inMem.currentReps + repsToAdd);
    if (inMem.currentReps >= inMem.targetReps) {
      inMem.completed = true;
    }
    inMem.updatedAt = new Date();
  }

  try {
    const numId = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
    const existing = await db.select().from(personalGoals)
      .where(and(eq(personalGoals.id, numId), eq(personalGoals.studentId, studentId)))
      .limit(1);

    if (existing[0]) {
      const newCurrent = Math.max(0, existing[0].currentReps + repsToAdd);
      const isCompleted = newCurrent >= existing[0].targetReps ? 1 : 0;

      const updated = await db.update(personalGoals)
        .set({
          currentReps: newCurrent,
          completed: isCompleted,
          updatedAt: new Date()
        })
        .where(eq(personalGoals.id, numId))
        .returning();

      if (updated[0]) {
        return {
          id: updated[0].id,
          studentId: updated[0].studentId,
          exerciseId: updated[0].exerciseId,
          exerciseName: updated[0].exerciseName,
          targetReps: updated[0].targetReps,
          currentReps: updated[0].currentReps,
          unit: updated[0].unit,
          category: updated[0].category,
          targetDate: updated[0].targetDate || undefined,
          completed: Boolean(updated[0].completed),
          createdAt: updated[0].createdAt.toISOString(),
          lastUpdated: updated[0].updatedAt.toISOString(),
        };
      }
    }
  } catch (error) {
    // Return in-memory
  }

  return inMem ? {
    ...inMem,
    createdAt: inMem.createdAt.toISOString(),
    lastUpdated: inMem.updatedAt.toISOString(),
  } : null;
}

// Save/add section dynamically
export async function createNewSection(name: string) {
  const trimmed = name.trim();
  if (!inMemorySections.includes(trimmed)) {
    inMemorySections.push(trimmed);
  }

  try {
    const inserted = await db.insert(sections)
      .values({ name: trimmed })
      .onConflictDoNothing()
      .returning();
    return inserted[0] || { name: trimmed };
  } catch (error) {
    return { name: trimmed };
  }
}

// Get all sections
export async function fetchAllSections() {
  try {
    const result = await db.select().from(sections);
    if (result && result.length > 0) {
      return result.map(s => s.name);
    }
  } catch (error) {
    // Fallback to in-memory sections
  }
  return inMemorySections;
}

// Update student grade and section
export async function updateUserClass(studentUid: string, grade: string, section: string) {
  const user = inMemoryUsers.find(u => u.uid === studentUid);
  if (user) {
    user.grade = grade;
    user.section = section;
  }

  inMemoryAssessments.forEach(a => {
    if (a.studentId === studentUid) {
      a.grade = grade;
      a.section = section;
    }
  });

  try {
    const updated = await db.update(users)
      .set({ grade, section })
      .where(eq(users.uid, studentUid))
      .returning();
    return updated[0] || user;
  } catch (error) {
    return user;
  }
}

// Calculate peer section averages
export async function getSectionAverages(sectionName: string) {
  try {
    const sectionAssessments = await db.select({
      componentId: assessments.componentId,
      score: assessments.score,
    })
    .from(assessments)
    .innerJoin(users, eq(assessments.studentId, users.uid))
    .where(eq(users.section, sectionName));

    if (sectionAssessments && sectionAssessments.length > 0) {
      const statsMap: Record<string, { totalScore: number; count: number }> = {};
      sectionAssessments.forEach(item => {
        if (!statsMap[item.componentId]) {
          statsMap[item.componentId] = { totalScore: 0, count: 0 };
        }
        statsMap[item.componentId].totalScore += item.score || 0;
        statsMap[item.componentId].count += 1;
      });

      return Object.keys(statsMap).map(cid => ({
        componentId: cid,
        avgScore: Math.round(statsMap[cid].totalScore / statsMap[cid].count),
        avgConsistency: 85
      }));
    }
  } catch (error) {
    // Fallback
  }

  const matched = inMemoryAssessments.filter(a => a.section === sectionName);
  const statsMap: Record<string, { totalScore: number; count: number }> = {};
  matched.forEach(item => {
    if (!statsMap[item.componentId]) {
      statsMap[item.componentId] = { totalScore: 0, count: 0 };
    }
    statsMap[item.componentId].totalScore += Number(item.score) || 0;
    statsMap[item.componentId].count += 1;
  });

  return Object.keys(statsMap).map(cid => ({
    componentId: cid,
    avgScore: Math.round(statsMap[cid].totalScore / statsMap[cid].count),
    avgConsistency: 85
  }));
}

// Compute in-memory leaderboard ranking
function computeInMemoryLeaderboard(limitCount: number = 10, gradeFilter?: string, sectionFilter?: string) {
  const filtered = inMemoryAssessments.filter(a => {
    if (gradeFilter && gradeFilter !== 'All Grades' && a.grade !== gradeFilter) return false;
    if (sectionFilter && sectionFilter !== 'All Sections' && a.section !== sectionFilter) return false;
    return true;
  });

  const studentMap = new Map<string, {
    studentId: string;
    studentName: string;
    grade: string;
    section: string;
    totalScoreSum: number;
    count: number;
    lastActive: string;
  }>();

  for (const item of filtered) {
    const existing = studentMap.get(item.studentId);
    const itemDate = item.timestamp instanceof Date ? item.timestamp.toISOString() : String(item.timestamp);
    if (!existing) {
      studentMap.set(item.studentId, {
        studentId: item.studentId,
        studentName: item.studentName,
        grade: item.grade,
        section: item.section,
        totalScoreSum: Number(item.score) || 0,
        count: 1,
        lastActive: itemDate,
      });
    } else {
      existing.totalScoreSum += Number(item.score) || 0;
      existing.count += 1;
      if (itemDate > existing.lastActive) {
        existing.lastActive = itemDate;
      }
    }
  }

  const result = Array.from(studentMap.values()).map(s => ({
    studentId: s.studentId,
    studentName: s.studentName,
    grade: s.grade,
    section: s.section,
    totalScore: Math.round(s.totalScoreSum / s.count),
    assessmentsCount: s.count,
    lastActive: s.lastActive,
  }));

  result.sort((a, b) => b.totalScore - a.totalScore);
  return result.slice(0, limitCount);
}

// Relational DB dynamic aggregation for Leaderboard (PostgreSQL + In-Memory Fallback)
export async function getLeaderboardRankings(limitCount: number = 10, gradeFilter?: string, sectionFilter?: string) {
  try {
    const conditions = [];
    if (gradeFilter && gradeFilter !== 'All Grades') {
      conditions.push(eq(assessments.grade, gradeFilter));
    }
    if (sectionFilter && sectionFilter !== 'All Sections') {
      conditions.push(eq(assessments.section, sectionFilter));
    }

    let queryBuilder = db.select({
      studentId: assessments.studentId,
      studentName: assessments.studentName,
      grade: assessments.grade,
      section: assessments.section,
      totalScore: sql<number>`ROUND(AVG(${assessments.score}))::int`,
      assessmentsCount: sql<number>`COUNT(*)::int`,
      lastActive: sql<string>`MAX(${assessments.timestamp})`,
    })
    .from(assessments);

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    const result = await queryBuilder
      .groupBy(assessments.studentId, assessments.studentName, assessments.grade, assessments.section)
      .orderBy(desc(sql`ROUND(AVG(${assessments.score}))`))
      .limit(limitCount);

    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    // Fall back to in-memory calculation
  }

  return computeInMemoryLeaderboard(limitCount, gradeFilter, sectionFilter);
}

// Delete user profile and all associated data
export async function deleteUserByUid(uid: string) {
  const userIdx = inMemoryUsers.findIndex(u => u.uid === uid);
  let deletedUser: InMemoryUser | null = null;
  if (userIdx !== -1) {
    deletedUser = inMemoryUsers.splice(userIdx, 1)[0];
  }

  // Clean up in-memory assessments
  for (let i = inMemoryAssessments.length - 1; i >= 0; i--) {
    if (inMemoryAssessments[i].studentId === uid) {
      inMemoryAssessments.splice(i, 1);
    }
  }

  try {
    await db.delete(assessments).where(eq(assessments.studentId, uid));
    const result = await db.delete(users).where(eq(users.uid, uid)).returning();
    return result[0] || deletedUser;
  } catch (error) {
    return deletedUser;
  }
}

// Automated table and schema initialization for both local and cloud databases
export async function initTablesIfNotExist() {
  try {
    const { pool } = await import('./index.ts');
    
    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        grade TEXT,
        section TEXT,
        student_code TEXT,
        teacher_name TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS users_uid_idx ON users(uid);
      CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
    `);

    // Create Sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS sections_name_idx ON sections(name);
    `);

    // Create Assessments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        student_name TEXT NOT NULL,
        grade TEXT NOT NULL,
        section TEXT NOT NULL,
        component_id TEXT NOT NULL,
        score DOUBLE PRECISION NOT NULL,
        raw_result TEXT NOT NULL,
        valid_reps DOUBLE PRECISION NOT NULL DEFAULT 0,
        invalid_reps DOUBLE PRECISION NOT NULL DEFAULT 0,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS assessments_student_idx ON assessments(student_id);
      CREATE INDEX IF NOT EXISTS assessments_grade_section_idx ON assessments(grade, section);
      CREATE INDEX IF NOT EXISTS assessments_timestamp_idx ON assessments(timestamp);
    `);

    // Create Warm-Up Videos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS warmup_videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'Warmup Routine',
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 15,
        created_by TEXT NOT NULL DEFAULT 'Faculty',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS warmup_videos_category_idx ON warmup_videos(category);
    `);

    // Create Personal Goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_goals (
        id SERIAL PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL,
        exercise_name TEXT NOT NULL,
        target_reps INTEGER NOT NULL,
        current_reps INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'reps',
        category TEXT NOT NULL DEFAULT 'Strength',
        target_date TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS personal_goals_student_idx ON personal_goals(student_id);
      CREATE INDEX IF NOT EXISTS personal_goals_exercise_idx ON personal_goals(exercise_id);
    `);

    console.log('✅ Database schema verified & tables initialized successfully.');

    // Seed default sections
    await seedSectionsIfEmpty();

    // Seed default warmup videos if empty
    await seedWarmupVideosIfEmpty();

    // Seed default users if empty
    await seedUsersIfEmpty();

    // Seed benchmark assessment history logs if empty
    await seedAssessmentsIfEmpty();

    // Seed sample personal goals if empty
    await seedPersonalGoalsIfEmpty();

  } catch (error) {
    console.log('ℹ️ Running with in-memory persistence layer.');
  }
}

export async function seedPersonalGoalsIfEmpty() {
  try {
    const { pool } = await import('./index.ts');
    const check = await pool.query('SELECT COUNT(*) FROM personal_goals');
    if (parseInt(check.rows[0].count, 10) === 0) {
      for (const g of inMemoryGoals) {
        await pool.query(`
          INSERT INTO personal_goals (student_id, exercise_id, exercise_name, target_reps, current_reps, unit, category, target_date, completed, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `, [
          g.studentId,
          g.exerciseId,
          g.exerciseName,
          g.targetReps,
          g.currentReps,
          g.unit,
          g.category,
          g.targetDate || null,
          g.completed ? 1 : 0,
          g.createdAt,
          g.updatedAt
        ]);
      }
      console.log('✅ Default personal goals seeded successfully into database.');
    }
  } catch (error) {
    console.warn('Notice seeding personal goals:', error);
  }
}

export async function seedUsersIfEmpty() {
  try {
    const { pool } = await import('./index.ts');
    const check = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(check.rows[0].count, 10) === 0) {
      for (const u of inMemoryUsers) {
        await pool.query(`
          INSERT INTO users (uid, email, password, name, role, grade, section, student_code, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (uid) DO NOTHING;
        `, [
          u.uid,
          u.email,
          u.password,
          u.name,
          u.role,
          u.grade || null,
          u.section || null,
          u.studentCode || null,
          u.createdAt
        ]);
      }
      console.log('✅ Demo users seeded successfully into database.');
    }
  } catch (error) {
    console.warn('Notice seeding users:', error);
  }
}

export async function seedAssessmentsIfEmpty() {
  try {
    const { pool } = await import('./index.ts');
    const check = await pool.query('SELECT COUNT(*) FROM assessments');
    if (parseInt(check.rows[0].count, 10) === 0) {
      for (const a of inMemoryAssessments) {
        await pool.query(`
          INSERT INTO assessments (student_id, student_name, grade, section, component_id, score, raw_result, valid_reps, invalid_reps, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        `, [
          a.studentId,
          a.studentName,
          a.grade,
          a.section,
          a.componentId,
          a.score,
          a.rawResult,
          a.validReps,
          a.invalidReps,
          a.timestamp
        ]);
      }
      console.log('✅ Benchmark assessment logs seeded successfully into database.');
    }
  } catch (error) {
    console.warn('Notice seeding assessments:', error);
  }
}

export async function seedWarmupVideosIfEmpty() {
  try {
    const { pool } = await import('./index.ts');
    const check = await pool.query('SELECT COUNT(*) FROM warmup_videos');
    if (parseInt(check.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO warmup_videos (title, description, category, type, url, duration, created_by)
        VALUES 
          ('March in Place', 'Lift your knees high while rhythmically swinging your arms.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/zL8D-m4aW5Y', 15, 'PE Faculty'),
          ('Arm Circles', 'Small circles moving forward, then larger reverse circles.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/S_7M_q8wRNo', 15, 'PE Faculty'),
          ('Side Steps & Reach', 'Step left to right, reaching arms overhead.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/S6z79_NAnX8', 15, 'PE Faculty'),
          ('Light Jogging', 'Bounce lightly on your toes with relaxed shoulders.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/mS_mP3wVb4g', 15, 'PE Faculty')
        ON CONFLICT DO NOTHING;
      `);
    }
  } catch (error) {
    // Graceful fallback
  }
}

export async function seedSectionsIfEmpty() {
  try {
    const existing = await db.select().from(sections).limit(1);
    if (existing.length === 0) {
      const defaultSections = [
        'Section A', 'Section B', 'Section C', 'STEM 1', 'STEM 2', 'Newton', 'Einstein', 'Pascal'
      ];
      await db.insert(sections).values(defaultSections.map(name => ({ name }))).onConflictDoNothing();
    }
  } catch (error) {
    // Graceful fallback
  }
}
