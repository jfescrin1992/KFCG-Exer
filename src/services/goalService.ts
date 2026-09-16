import { PersonalGoal } from '../types';

export const fetchStudentGoals = async (): Promise<PersonalGoal[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/goals', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch goals (status ${response.status})`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Error fetching student goals:', error);
    return [];
  }
};

export const createStudentGoal = async (goalData: {
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  currentReps?: number;
  unit?: string;
  category?: string;
  targetDate?: string;
}): Promise<PersonalGoal | null> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(goalData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create personal goal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

export const updateStudentGoal = async (
  goalId: string | number,
  updates: {
    targetReps?: number;
    currentReps?: number;
    completed?: boolean;
    targetDate?: string;
  }
): Promise<PersonalGoal | null> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update personal goal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteStudentGoal = async (goalId: string | number): Promise<boolean> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/goals/${goalId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting goal:', error);
    return false;
  }
};

export const logGoalRepProgress = async (
  goalId: string | number,
  reps: number
): Promise<PersonalGoal | null> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/goals/${goalId}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reps }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to log repetition progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging rep progress:', error);
    throw error;
  }
};
