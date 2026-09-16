export type UserRole = 'student' | 'teacher' | 'superadmin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: string;
  section?: string;
  studentCode?: string;
  teacherName?: string;
  createdAt: string;
}

export const fetchPublicTeachers = async (): Promise<Array<{ uid: string; name: string; section?: string; grade?: string }>> => {
  try {
    const res = await fetch('/api/teachers/list');
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
};

export const registerUser = async (
  email: string, 
  password: string, 
  profile: Omit<UserProfile, 'uid' | 'createdAt'>
) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      name: profile.name,
      role: 'student',
      grade: profile.grade,
      section: profile.section,
      studentCode: profile.studentCode,
      teacherName: profile.teacherName
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Registration failed');
  }

  const data = await response.json();
  localStorage.setItem('auth_token', data.token);
  return data.user as UserProfile;
};

export const loginUser = async (email: string, password: string): Promise<UserProfile> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Invalid email or password');
  }

  const data = await response.json();
  localStorage.setItem('auth_token', data.token);
  return data.user as UserProfile;
};

export const loginDemoUser = async (role: 'student' | 'teacher' | 'superadmin'): Promise<UserProfile> => {
  const response = await fetch('/api/auth/demo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Demo login failed');
  }

  const data = await response.json();
  localStorage.setItem('auth_token', data.token);
  return data.user as UserProfile;
};

export const logoutUser = async () => {
  localStorage.removeItem('auth_token');
};

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem('auth_token');
      return null;
    }

    return await response.json() as UserProfile;
  } catch (error) {
    console.error('Failed to restore user session:', error);
    return null;
  }
};
