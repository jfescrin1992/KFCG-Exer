import { AssessmentResult } from '../types';

export interface TeacherRecord {
  uid: string;
  name: string;
  email: string;
  grade?: string;
  section?: string;
  assignedSections: string[];
  studentCount?: number;
  createdAt?: string;
}

export interface SectionStudentInfo {
  uid: string;
  name: string;
  email: string;
  grade: string;
  section: string;
  studentCode: string;
  assessmentsCount: number;
  averageScore: number;
  lastActive?: string;
}

export interface SectionOverviewItem {
  sectionName: string;
  grade: string;
  teachers: Array<{ uid: string; name: string; email: string }>;
  studentsCount: number;
  students: SectionStudentInfo[];
  averageScore: number;
}

export interface SuperAdminOverview {
  totalSections: number;
  totalTeachers: number;
  totalStudents: number;
  totalAssessments: number;
  averageScore: number;
  sections: SectionOverviewItem[];
  teachers: TeacherRecord[];
}

export interface CreateTeacherPayload {
  name: string;
  email: string;
  password?: string;
  grade?: string;
  assignedSections: string[] | string;
}

export const fetchSuperAdminOverview = async (): Promise<SuperAdminOverview> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/admin/overview', {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch admin overview');
  }

  return await response.json();
};

export const fetchAllTeachersList = async (): Promise<TeacherRecord[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/admin/teachers', {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch teachers list');
  }

  return await response.json();
};

export const createTeacherAccount = async (payload: CreateTeacherPayload): Promise<TeacherRecord> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/admin/teachers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create teacher account');
  }

  return await response.json();
};

export const updateTeacherAssignments = async (
  uid: string, 
  assignedSections: string[] | string,
  grade?: string
): Promise<TeacherRecord> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/admin/teachers/${uid}/sections`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ assignedSections, grade }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update teacher assigned sections');
  }

  return await response.json();
};

export const deleteTeacherAccount = async (uid: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/admin/teachers/${uid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete teacher account');
  }
};

export const deleteSectionApi = async (name: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/sections/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete section');
  }
};
