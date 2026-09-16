import { AssessmentResult } from '../types';

export interface StudentPerformance {
  uid: string;
  name: string;
  email: string;
  grade: string;
  section: string;
  studentCode: string;
  assessments: AssessmentResult[];
}

export const fetchAllStudents = async (): Promise<StudentPerformance[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/students', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student analytics');
    }

    const data = await response.json();
    return data as StudentPerformance[];
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return [];
  }
};

export interface CreateStudentPayload {
  name: string;
  email: string;
  password?: string;
  grade?: string;
  section?: string;
  studentCode?: string;
}

export const createStudent = async (payload: CreateStudentPayload): Promise<StudentPerformance> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create student account');
  }

  const newStudent = await response.json();
  return {
    uid: newStudent.uid,
    name: newStudent.name,
    email: newStudent.email,
    grade: newStudent.grade || '11',
    section: newStudent.section || 'Section A',
    studentCode: newStudent.studentCode || `STD-${Date.now().toString().slice(-4)}`,
    assessments: [],
  };
};

export const deleteStudent = async (uid: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/students/${uid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete student account');
  }
};

export const updateUserClassApi = async (studentUid: string, grade: string, section: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/users/update-class', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ studentUid, grade, section }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update student class details');
  }
};


