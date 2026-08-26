import apiClient from "./client";

export type FeedbackType = "bug" | "suggestion" | "other";

/**
 * 브라우저·화면 정보를 함께 실어 보낸다.
 * "안 돼요" 한 줄만 오면 재현할 수가 없어서, 최소한 어디서 났는지는 남긴다.
 */
function collectClientInfo(): Record<string, string> {
  return {
    platform: "web",
    screen: window.location.pathname + window.location.search,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
  };
}

export const feedbackApi = {
  send: (type: FeedbackType, message: string) =>
    apiClient
      .post<{ sent: boolean }>("/feedback", {
        type,
        message,
        client: collectClientInfo(),
      })
      .then((r) => r.data),
};
