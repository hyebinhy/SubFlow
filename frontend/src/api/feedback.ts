import apiClient from "./client";

export type FeedbackType = "bug" | "suggestion" | "other";

export interface ClientInfo {
  platform: string;
  screen: string;
  browser: string;
  viewport: string;
  language: string;
}

/** 브라우저 이름만 추려 낸다. UA 원문은 서버가 따로 기록한다. */
function browserName(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "기타";
}

/**
 * 신고와 함께 보내는 정보. 화면에도 그대로 보여 주기 때문에
 * "무엇이 전송되는지 모르겠다"는 상태가 생기지 않는다.
 */
export function collectClientInfo(): ClientInfo {
  return {
    platform: "web",
    screen: window.location.pathname + window.location.search,
    browser: browserName(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
  };
}

/** 첨부 상한. 서버도 같은 값으로 다시 잰다. */
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 1600;

/**
 * 스크린샷을 메일에 실을 수 있는 크기로 줄여 base64로 만든다.
 *
 * 4K 화면을 통째로 캡처하면 8MB를 넘겨 그냥 거절당한다. 긴 변을 1600px로
 * 맞추고 JPEG로 다시 그리면 대개 수백 KB로 떨어지는데, 글자를 읽고 화면을
 * 알아보는 데는 충분하다.
 */
export function prepareScreenshot(
  file: File
): Promise<{ filename: string; content_base64: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 첨부할 수 있습니다."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지를 처리하지 못했습니다."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      // base64는 원본보다 약 4/3 크다
      if ((base64.length * 3) / 4 > MAX_ATTACHMENT_BYTES) {
        reject(new Error("이미지가 너무 큽니다."));
        return;
      }
      resolve({ filename: file.name.replace(/\.[^.]+$/, "") + ".jpg", content_base64: base64 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    img.src = url;
  });
}

export const feedbackApi = {
  send: (
    type: FeedbackType,
    message: string,
    screenshot?: { filename: string; content_base64: string } | null
  ) =>
    apiClient
      .post<{ sent: boolean }>("/feedback", {
        type,
        message,
        client: collectClientInfo(),
        screenshot: screenshot ?? null,
      })
      .then((r) => r.data),
};
