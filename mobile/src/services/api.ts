import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api/v1'
  : 'https://api.subflow.app/api/v1'; // 프로덕션 URL은 나중에 변경

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT 토큰 인터셉터
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (email: string, password: string, username: string) =>
    api.post('/auth/register', { email, password, username }),
};

// Subscriptions
export const subscriptionAPI = {
  getAll: () => api.get('/subscriptions'),
  getById: (id: string) => api.get(`/subscriptions/${id}`),
  cancel: (id: string) => api.patch(`/subscriptions/${id}/cancel`),
};

// Analytics
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getSpendingByCategory: () => api.get('/analytics/spending-by-category'),
  getSpendingTrend: () => api.get('/analytics/spending-trend'),
};

// Services catalog
export const servicesAPI = {
  getAll: () => api.get('/services'),
  getPopular: () => api.get('/services/popular'),
};

// Notifications
export const notificationAPI = {
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settings: Record<string, unknown>) =>
    api.put('/notifications/settings', settings),
};
