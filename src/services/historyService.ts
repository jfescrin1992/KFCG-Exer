import { AssessmentResult } from '../types';

export interface HistoryFilterParams {
  grade?: string;
  section?: string;
  componentId?: string;
  studentId?: string;
}

export const fetchMyAssessmentHistory = async (): Promise<AssessmentResult[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/assessments/history', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch history (status ${response.status})`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Error fetching assessment history:', error);
    return [];
  }
};

export const fetchAllAssessmentLogs = async (
  filters?: HistoryFilterParams
): Promise<AssessmentResult[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    const params = new URLSearchParams();
    if (filters?.grade && filters.grade !== 'All Grades') {
      params.append('grade', filters.grade);
    }
    if (filters?.section && filters.section !== 'All Sections') {
      params.append('section', filters.section);
    }
    if (filters?.componentId && filters.componentId !== 'All') {
      params.append('componentId', filters.componentId);
    }
    if (filters?.studentId) {
      params.append('studentId', filters.studentId);
    }

    const response = await fetch(`/api/assessments/all-history?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch all assessment logs (status ${response.status})`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Error fetching all assessment logs:', error);
    return [];
  }
};

export const deleteAssessmentRecordApi = async (id: number): Promise<boolean> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/assessments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting assessment record:', error);
    return false;
  }
};
