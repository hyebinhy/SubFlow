import { useCallback } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { t as translate } from "../i18n/translations";

/**
 * 한국어 원문을 그대로 키로 쓴다. 사전에 없는 문구는 한국어가 그대로 나오므로
 * 번역을 점진적으로 채워도 화면이 깨지지 않는다.
 *
 *   const { t } = useTranslation();
 *   <h1>{t("구독 관리")}</h1>
 *   <p>{t("{n}건", { n: 3 })}</p>
 */
export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  const toggleLanguage = useSettingsStore((s) => s.toggleLanguage);

  const t = useCallback(
    (ko: string, params?: Record<string, string | number>) => translate(ko, language, params),
    [language]
  );

  return { t, language, toggleLanguage };
}
