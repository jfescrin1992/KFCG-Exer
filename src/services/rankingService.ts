import { AssessmentResult } from '../types';

export interface RankingEntry {
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  totalScore: number;
  assessmentsCount: number;
  lastActive: string;
}

export const saveAssessment = async (
  studentUid: string, 
  studentName: string, 
  grade: string,
  section: string,
  result: AssessmentResult
) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/assessments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        studentName,
        grade,
        section,
        result
      })
    });
    if (!response.ok) {
      console.warn('Notice saving assessment to database (status ' + response.status + ')');
    }
  } catch (error) {
    console.warn("Notice saving assessment:", error);
  }
};

export const getLeaderboard = async (
  limitCount: number = 10, 
  gradeFilter?: string, 
  sectionFilter?: string
): Promise<RankingEntry[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', String(limitCount));
    if (gradeFilter && gradeFilter !== 'All Grades') {
      params.append('grade', gradeFilter);
    }
    if (sectionFilter && sectionFilter !== 'All Sections') {
      params.append('section', sectionFilter);
    }

    const response = await fetch(`/api/leaderboard?${params.toString()}`);
    if (!response.ok) {
      console.warn('Notice fetching leaderboard (status ' + response.status + ')');
      return [];
    }
    const rankings = await response.json();
    return (Array.isArray(rankings) ? rankings : []) as RankingEntry[];
  } catch (error) {
    console.warn("Notice fetching leaderboard:", error);
    return [];
  }
};
