import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        // 토큰으로 유저 정보 가져오기
        const res = await api.get('/auth/me');
        set({ token, user: res.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.removeItem('access_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { access_token } = res.data;
    await AsyncStorage.setItem('access_token', access_token);

    // 유저 정보 가져오기
    const userRes = await api.get('/auth/me');
    set({ token: access_token, user: userRes.data, isAuthenticated: true });
  },

  register: async (email: string, password: string, username: string) => {
    await authAPI.register(email, password, username);
    // 가입 후 자동 로그인
    await get().login(email, password);
  },

  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
