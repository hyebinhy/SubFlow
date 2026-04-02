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

  setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
  setEmailEnabled: (enabled) => set({ emailEnabled: enabled }),
  setDaysBefore: (days) => set({ daysBefore: days }),
  setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),

  loadSettings: async () => {
    const lang = await AsyncStorage.getItem('language');
    const curr = await AsyncStorage.getItem('currency');
    set({
      language: (lang as Language) || 'en',
      currency: curr || 'KRW',
    });
  },
}));
