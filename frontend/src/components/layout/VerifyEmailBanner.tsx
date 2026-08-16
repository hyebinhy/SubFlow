import { useState } from "react";
import { MailWarning } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { tr } from "../../i18n/translations";

/**
 * 이메일 미확인 안내. 앱 사용을 막지는 않고, 알림 메일이 나가지 않는다는 사실만
 * 알린다(가입 후 인증 방식). 닫으면 이 세션 동안 다시 뜨지 않는다.
 */
export default function VerifyEmailBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.email_verified || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await authApi.resendVerification();
      toast.success(tr("인증 메일을 다시 보냈습니다."));
    } catch {
      toast.error(tr("잠시 후 다시 시도해주세요."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-3">
      <MailWarning className="h-5 w-5 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-900">
        {tr("이메일 주소가 아직 확인되지 않았습니다. 확인 전에는 결제일 알림 메일이 발송되지 않습니다.")}
      </p>
      <button
        onClick={resend}
        disabled={sending}
        className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
      >
        {sending ? tr("보내는 중...") : tr("인증 메일 다시 받기")}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs font-medium text-amber-700 hover:underline"
      >
        {tr("나중에")}
      </button>
    </div>
  );
}
