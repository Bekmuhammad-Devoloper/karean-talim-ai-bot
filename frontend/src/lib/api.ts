import axios from 'axios';

// Production da domen orqali, development da localhost
export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser da - joriy domen orqali API ga murojaat
    const origin = window.location.origin;
    // Frontend port 3001, backend port 3000
    if (origin.includes('localhost:3001')) {
      return 'http://localhost:3000';
    }
    return origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // telegram-login sahifasida redirect qilmaymiz
        const isTelegramLogin = window.location.pathname.includes('telegram-login');
        if (!isTelegramLogin) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }).then(res => res.data),
  telegramLogin: (code: string) =>
    api.post('/api/auth/telegram-login', { code }).then(res => res.data),
  getProfile: () => api.get('/api/auth/profile').then(res => res.data),
};

// Stats
export const statsApi = {
  getDashboard: () => api.get('/api/stats/dashboard').then(res => res.data),
  getRecentRequests: (limit?: number) =>
    api.get('/api/stats/recent-requests', { params: { limit } }).then(res => res.data),
  getTopUsers: (limit?: number) =>
    api.get('/api/stats/top-users', { params: { limit } }).then(res => res.data),
  getDaily: (days?: number) =>
    api.get('/api/stats/daily', { params: { days } }).then(res => res.data),
  // Korean Bot Stats
  getKoreanDashboard: () => api.get('/api/stats/korean/dashboard').then(res => res.data),
  getKoreanTopUsers: (limit?: number) =>
    api.get('/api/stats/korean/top-users', { params: { limit } }).then(res => res.data),
};

// Channels
export const channelsApi = {
  getAll: () => api.get('/api/channels').then(res => res.data),
  getById: (id: number) => api.get(`/api/channels/${id}`).then(res => res.data),
  getInfo: (username: string) => api.get('/api/channels/info', { params: { username } }).then(res => res.data),
  create: (data: any) => api.post('/api/channels', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/api/channels/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/channels/${id}`).then(res => res.data),
  toggleMandatory: (id: number) => api.post(`/api/channels/${id}/toggle-mandatory`).then(res => res.data),
  toggleActive: (id: number) => api.post(`/api/channels/${id}/toggle-active`).then(res => res.data),
};

// Posts
export const postsApi = {
  getAll: () => api.get('/api/posts').then(res => res.data),
  getById: (id: number) => api.get(`/api/posts/${id}`).then(res => res.data),
  getStats: () => api.get('/api/posts/stats').then(res => res.data),
  create: (data: any) => api.post('/api/posts', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/api/posts/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/posts/${id}`).then(res => res.data),
  send: (id: number, channelId: string) =>
    api.post(`/api/posts/${id}/send`, { channelId }).then(res => res.data),
  broadcast: (id: number) =>
    api.post(`/api/posts/${id}/broadcast`).then(res => res.data),
  schedule: (id: number, scheduledAt: string, broadcastToUsers?: boolean) =>
    api.post(`/api/posts/${id}/schedule`, { scheduledAt, broadcastToUsers }).then(res => res.data),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/posts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
};

export default api;
