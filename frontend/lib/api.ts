import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // Skip adding token for login and register requests
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      return config;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Create a new axios instance to avoid interceptor loops
        const refreshResponse = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          {
            params: { refresh_token: refreshToken },
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        const { access_token, refresh_token } = refreshResponse.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError: unknown) {
        const errorData = refreshError instanceof Error ? refreshError.message : 'Unknown error';
        console.error('Token refresh failed:', errorData);

        // Refresh failed, clear tokens and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Only redirect if we're not already on the login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    user_type?: string;
  }) => api.post('/api/v1/auth/register', data),

  login: (data: { username: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    return api.post('/api/v1/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  getCurrentUser: () => api.get('/api/v1/auth/me'),

  logout: () => api.post('/api/v1/auth/logout'),
};

// Content API
export const contentAPI = {
  generate: (data: { topic: string; auto_approve?: boolean }) =>
    api.post('/api/v1/content/generate', data),

  create: (data: {
    topic: string;
    facebook_caption?: string;
    instagram_caption?: string;
    linkedin_caption?: string;
    pinterest_caption?: string;
    twitter_caption?: string;
    threads_caption?: string;
    image_prompt?: string;
    image_caption?: string;
    image_url?: string;
    auto_approve?: boolean;
  }) => {
    console.log('[API] contentAPI.create called with data:', data);
    console.log('[API] Data keys:', Object.keys(data));
    return api.post('/api/v1/content/create', data);
  },

  list: (params?: { skip?: number; limit?: number; status_filter?: string }) =>
    api.get('/api/v1/content/', { params }),

  get: (id: number) => api.get(`/api/v1/content/${id}`),

  approve: (id: number, data: { approved: boolean; feedback?: string }) =>
    api.post(`/api/v1/content/${id}/approve`, data),

  regenerateCaptions: (id: number) =>
    api.post(`/api/v1/content/${id}/regenerate-captions`),

  regenerateImage: (id: number) =>
    api.post(`/api/v1/content/${id}/regenerate-image`),

  delete: (id: number) => api.delete(`/api/v1/content/${id}`),

  embedCaption: (data: {
    image_url: string;
    caption: string;
    position?: string;
    font_size?: number;
    text_color?: string;
    text_opacity?: number;
    bg_color?: string;
    bg_opacity?: number;
    padding?: number;
    max_width_ratio?: number;
    font_family?: string;
  }) => api.post('/api/v1/content/embed-caption', data),
};

// Social Accounts API
export const socialAccountsAPI = {
  connect: (data: {
    platform: string;
    username?: string;
    access_token: string;
    refresh_token?: string;
    platform_user_id?: string;
    display_name?: string;
    platform_data?: Record<string, unknown>;
  }) => api.post('/api/v1/social-accounts/', data),

  getFacebookPages: (data: {
    access_token: string;
  }) => api.post('/api/v1/social-accounts/facebook/pages', data),

  connectWithToken: (data: {
    platform: 'facebook' | 'instagram';
    access_token: string;
    page_id?: string;
    instagram_business_account_id?: string;
  }) => api.post('/api/v1/social-accounts/token/connect', data),

  testToken: (data: {
    platform: 'facebook' | 'instagram';
    access_token: string;
    page_id?: string;
    instagram_business_account_id?: string;
  }) => api.post('/api/v1/social-accounts/token/test', data),

  list: (params?: { platform?: string; active_only?: boolean }) =>
    api.get('/api/v1/social-accounts/', { params }),

  get: (id: number) => api.get(`/api/v1/social-accounts/${id}`),

  update: (
    id: number,
    data: {
      access_token?: string;
      refresh_token?: string;
      is_active?: boolean;
      platform_data?: Record<string, unknown>;
    }
  ) => api.put(`/api/v1/social-accounts/${id}`, data),

  disconnect: (id: number) => api.delete(`/api/v1/social-accounts/${id}`),

  verify: (id: number) => api.post(`/api/v1/social-accounts/${id}/verify`),

  getAvailablePlatforms: () => api.get('/api/v1/social-accounts/platforms/available'),
};

// OAuth API
export const oauthAPI = {
  getAuthorizeUrl: async (platform: string) => {
    const resp = await api.get(`/api/v1/oauth/${platform}/authorize`);
    return resp.data as { authorize_url: string };
  },
};

// Posts API
export const postsAPI = {
  create: (data: {
    content_id: number;
    platforms: string[];
    scheduled_for?: string;
  }) => api.post('/api/v1/posts/', data),

  list: (params?: {
    skip?: number;
    limit?: number;
    platform?: string;
    status_filter?: string;
  }) => api.get('/api/v1/posts/', { params }),

  get: (id: number) => api.get(`/api/v1/posts/${id}`),

  retry: (id: number) => api.post(`/api/v1/posts/${id}/retry`),

  getStats: (id: number) => api.get(`/api/v1/posts/${id}/stats`),

  delete: (id: number) => api.delete(`/api/v1/posts/${id}`),
};

export default api;