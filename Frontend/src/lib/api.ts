// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Socket.IO server origin (API url without the trailing "/api")
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

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
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
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
      success: data.success ?? true,
      data: data.data ?? data,
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

// Multipart form request for file uploads
async function apiFormRequest<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Note: Don't set Content-Type for FormData, browser sets it with boundary
      },
      body: formData,
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
      success: data.success ?? true,
      data: data.data ?? data,
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

// Profile API
export const profileApi = {
  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) =>
    apiRequest('/auth/update-profile', { method: 'PUT', body: JSON.stringify(data) }),

  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFormRequest('/auth/profile/avatar', formData);
  },

  getCurrentUser: () => apiRequest('/auth/me'),
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
  imageFile?: File;
  imageBase64?: string;
}

export interface PostsResponse {
  posts: unknown[];
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  duplicatePostId?: string;
  reason?: string[];
}

// Helper to create FormData for multipart upload
async function createPostFormData(data: CreatePostData): Promise<FormData> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('category', data.category);
  formData.append('address', data.address);
  formData.append('location', JSON.stringify(data.location));

  // If imageBase64 is provided, convert to File
  if (data.imageBase64 && !data.imageFile) {
    const response = await fetch(data.imageBase64);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
    formData.append('media', file);
  } else if (data.imageFile) {
    formData.append('media', data.imageFile);
  }

  return formData;
}

export const postsApi = {
  create: async (data: CreatePostData) => {
    const formData = await createPostFormData(data);
    return apiFormRequest('/posts/', formData);
  },

  // FIX: Return type includes { posts: [...] } structure
  getNearby: (params?: { lat?: number; lng?: number; radius?: number; category?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.lat) searchParams.append('lat', params.lat.toString());
    if (params?.lng) searchParams.append('lng', params.lng.toString());
    if (params?.radius) searchParams.append('radius', params.radius.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    const queryString = searchParams.toString();
    return apiRequest<PostsResponse>(`/posts/${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => apiRequest(`/posts/${id}`),

  // FIX: Return type includes { posts: [...] } structure
  getMyPosts: () => apiRequest<PostsResponse>('/posts/my-posts'),

  delete: (id: string) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),

  updateStatus: (id: string, status: string) =>
    apiRequest(`/posts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  like: (id: string) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),

  // FIX: Backend route is /:id/comment (singular), not /comments
  addComment: (id: string, text: string) =>
    apiRequest(`/posts/${id}/comment`, { method: 'POST', body: JSON.stringify({ text }) }),

  getComments: (id: string) => apiRequest(`/posts/${id}/comments`),
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiRequest('/notifications'),

  markRead: (id: string) =>
    apiRequest('/notifications/mark-read', { method: 'POST', body: JSON.stringify({ ids: [id] }) }),

  markMultipleRead: (ids: string[]) =>
    apiRequest('/notifications/mark-read', { method: 'POST', body: JSON.stringify({ ids }) }),

  getCount: () => apiRequest('/notifications/count'),
};

export { API_BASE_URL };
