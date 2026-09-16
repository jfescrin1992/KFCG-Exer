export interface WarmupVideo {
  id: number;
  title: string;
  description?: string;
  category: string;
  type: 'link' | 'upload';
  url: string;
  duration: number;
  createdBy: string;
  createdAt: string;
}

export interface AddVideoPayload {
  title: string;
  description?: string;
  category: string;
  type: 'link' | 'upload';
  url: string;
  duration?: number;
}

export const fetchWarmupVideos = async (): Promise<WarmupVideo[]> => {
  const response = await fetch('/api/warmup-videos');
  if (!response.ok) {
    throw new Error('Failed to fetch demonstration videos');
  }
  return response.json();
};

export const addWarmupVideo = async (payload: AddVideoPayload): Promise<WarmupVideo> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/warmup-videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add demonstration video');
  }

  return response.json();
};

export const deleteWarmupVideo = async (id: number): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/warmup-videos/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete demonstration video');
  }
};
