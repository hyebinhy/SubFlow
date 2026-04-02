import { useSettingsStore } from '../store/settingsStore';
import { t, TranslationKey } from '../i18n/translations';

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);

  return {
    t: (key: TranslationKey, params?: Record<string, string | number>) => t(key, language, params),
    language,
  };
}
