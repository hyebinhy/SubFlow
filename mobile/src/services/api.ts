import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 웹: localhost OK / 모바일: PC의 실제 IP 필요
const API_BASE_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:8001/api/v1'
    : 'http://172.30.1.44:8001/api/v1'
  : 'https://api.subflow.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) await AsyncStorage.removeItem('access_token');
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, username: string) =>
    api.post('/auth/register', { email, password, username }),
  getMe: () => api.get('/auth/me'),
};

// ── Subscriptions ──
export const subscriptionAPI = {
  getAll: () => api.get('/subscriptions'),
  getById: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/subscriptions', data),
  createFromCatalog: (data: { service_id: number; plan_id: number }) =>
    api.post('/subscriptions/from-catalog', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/subscriptions/${id}`, data),
  cancel: (id: string) => api.delete(`/subscriptions/${id}`),
  getUpcoming: () => api.get('/subscriptions/upcoming'),
  getCalendarEvents: (year: number, month: number) =>
    api.get(`/subscriptions/calendar-events?year=${year}&month=${month}`),
  getTimeline: () => api.get('/subscriptions/timeline'),
  getHistory: (id: string) => api.get(`/subscriptions/${id}/history`),
};

// ── Analytics ──
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getCategoryBreakdown: () => api.get('/analytics/category-breakdown'),
  getSpendingTrend: () => api.get('/analytics/spending-trend'),
  getOverlaps: () => api.get('/analytics/overlaps'),
  getExchangeRateAlerts: () => api.get('/analytics/exchange-rate-alerts'),
  getTrials: () => api.get('/analytics/trials'),
  getSavingsSuggestions: () => api.get('/analytics/savings-suggestions'),
  getPriceChanges: () => api.get('/analytics/price-changes'),
  getBudgetStatus: () => api.get('/analytics/budget-status'),
};

// ── Services catalog ──
export const servicesAPI = {
  getAll: () => api.get('/services'),
  getPopular: () => api.get('/services/popular'),
  search: (q: string) => api.get(`/services/search?q=${q}`),
  getById: (id: number) => api.get(`/services/${id}`),
};

// ── Notifications ──
export const notificationAPI = {
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settings: Record<string, unknown>) =>
    api.put('/notifications/settings', settings),
  getUpcoming: () => api.get('/notifications/upcoming'),
};
