import { create } from "zustand";
import type { Language } from "../i18n/translations";

const STORAGE_KEY = "subflow-lang";

// 한국어가 기본. 브라우저 언어와 무관하게 ko로 시작하고,
// 사용자가 헤더에서 바꾼 선택만 기억한다.
function detectLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "ko";
}

interface SettingsState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: detectLanguage(),

  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    (globalThis as { __subflowLang?: Language }).__subflowLang = language;
    set({ language });
  },

  toggleLanguage: () => get().setLanguage(get().language === "ko" ? "en" : "ko"),
}));

const initial = useSettingsStore.getState().language;
document.documentElement.lang = initial;
// 훅 없이 쓰는 tr()이 읽어가는 값. 스토어와 항상 같이 움직인다.
(globalThis as { __subflowLang?: Language }).__subflowLang = initial;
