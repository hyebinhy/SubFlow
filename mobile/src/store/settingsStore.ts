import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../i18n/translations';

interface SettingsState {
  language: Language;
  currency: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  daysBefore: number;
  monthlyBudget: number | null;

  setLanguage: (lang: Language) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setPushEnabled: (enabled: boolean) => void;
  setEmailEnabled: (enabled: boolean) => void;
  setDaysBefore: (days: number) => void;
  setMonthlyBudget: (budget: number | null) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  currency: 'KRW',
  pushEnabled: true,
  emailEnabled: false,
  daysBefore: 3,
  monthlyBudget: 70000,

  setLanguage: async (lang: Language) => {
    await AsyncStorage.setItem('language', lang);
    set({ language: lang });
  },

  setCurrency: async (currency: string) => {
    await AsyncStorage.setItem('currency', currency);
    set({ currency });
  },

  setPushEnabled: (enabled) => {
    AsyncStorage.setItem('pushEnabled', String(enabled));
    set({ pushEnabled: enabled });
  },
  setEmailEnabled: (enabled) => {
    AsyncStorage.setItem('emailEnabled', String(enabled));
    set({ emailEnabled: enabled });
  },
  setDaysBefore: (days) => {
    AsyncStorage.setItem('daysBefore', String(days));
    set({ daysBefore: days });
  },
  setMonthlyBudget: (budget) => {
    if (budget !== null) AsyncStorage.setItem('monthlyBudget', String(budget));
    else AsyncStorage.removeItem('monthlyBudget');
    set({ monthlyBudget: budget });
  },

  loadSettings: async () => {
    const lang = await AsyncStorage.getItem('language');
    const curr = await AsyncStorage.getItem('currency');
    const push = await AsyncStorage.getItem('pushEnabled');
    const email = await AsyncStorage.getItem('emailEnabled');
    const days = await AsyncStorage.getItem('daysBefore');
    const budget = await AsyncStorage.getItem('monthlyBudget');
    set({
      language: (lang as Language) || 'en',
      currency: curr || 'KRW',
      pushEnabled: push !== null ? push === 'true' : true,
      emailEnabled: email !== null ? email === 'true' : false,
      daysBefore: days !== null ? Number(days) : 3,
      monthlyBudget: budget !== null ? Number(budget) : 70000,
    });
  },
}));
