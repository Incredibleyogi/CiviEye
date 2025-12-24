// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Helper to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('civiceye_token');
};

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Request failed',
        message: data.message,
      };
    }

    return {
      success: true,
      data,
      message: data.message,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Auth API
export const authApi = {
  signup: (data: { name: string; email: string; password: string; confirmPassword: string; lat?: number; lng?: number }) =>
    apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiRequest<{ token: string; user: unknown }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  verifyOtp: (data: { email: string; otp: string }) =>
    apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),

  resendOtp: (data: { email: string }) =>
    apiRequest('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),

  googleLogin: (data: { token: string }) =>
    apiRequest<{ token: string; user: { id: string; name: string; email: string; profilePic?: string } }>('/auth/google', { method: 'POST', body: JSON.stringify(data) }),
};

// Password API
export const passwordApi = {
  forgotPassword: (data: { email: string }) =>
    apiRequest('/password/forgot-password', { method: 'POST', body: JSON.stringify(data) }),

  resetPassword: (data: { token: string; password: string }) =>
    apiRequest('/password/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest('/password/change-password', { method: 'POST', body: JSON.stringify(data) }),
};

// Posts API
export interface CreatePostData {
  title: string;
  description: string;
  category: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  imageBase64?: string;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  duplicatePostId?: string;
  reason?: string[];
}

export const postsApi = {
  create: (data: CreatePostData) =>
    apiRequest('/posts/', { method: 'POST', body: JSON.stringify(data) }),

  getNearby: (params?: { lat?: number; lng?: number; radius?: number; category?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.lat) searchParams.append('lat', params.lat.toString());
    if (params?.lng) searchParams.append('lng', params.lng.toString());
    if (params?.radius) searchParams.append('radius', params.radius.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    return apiRequest(`/posts/nearby?${searchParams.toString()}`);
  },

  getById: (id: string) => apiRequest(`/posts/${id}`),

  getMyPosts: () => apiRequest('/posts/my-posts'),

  delete: (id: string) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),

  updateStatus: (id: string, status: string) =>
    apiRequest(`/posts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  like: (id: string) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),

  addComment: (id: string, comment: string) =>
    apiRequest(`/posts/${id}/comment`, { method: 'POST', body: JSON.stringify({ comment }) }),
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiRequest('/notifications'),

  markRead: (id: string) =>
    apiRequest('/notifications/mark-read', { method: 'POST', body: JSON.stringify({ notificationId: id }) }),
};

export { API_BASE_URL };
