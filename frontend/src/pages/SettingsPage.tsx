import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bell, LifeBuoy, Mail, Smartphone, User, WalletCards } from "lucide-react";
import { authApi } from "../api/auth";
import { notificationApi } from "../api/notifications";
import { feedbackApi, type FeedbackType } from "../api/feedback";
import { useAuthStore } from "../store/authStore";
import type { NotificationSettings } from "../types/notification";
import { tr } from "../i18n/translations";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? "");
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [notifyDays, setNotifyDays] = useState(3);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [budgetMonthly, setBudgetMonthly] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    notificationApi
      .getSettings()
      .then((settings) => {
        setNotifSettings(settings);
        setNotifyDays(settings.notify_days_before);
        setEmailNotif(settings.email_notifications);
        setPushNotif(settings.push_notifications);
        setBudgetMonthly(settings.budget_monthly != null ? String(settings.budget_monthly) : "");
      })
      .catch(() => {
        toast.error(tr("알림 설정을 불러오는데 실패했습니다."));
      });
  }, []);

  // ── 오류 신고 ──
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const handleFeedbackSend = async () => {
    if (feedbackMessage.trim().length < 5) {
      toast.error(tr("5자 이상 입력해주세요."));
      return;
    }
    setSendingFeedback(true);
    try {
      await feedbackApi.send(feedbackType, feedbackMessage.trim());
      // 발송 실패도 서버가 로그로 받아 두므로 사용자에겐 접수됐다고 알린다
      toast.success(tr("보내주셔서 감사합니다. 확인 후 반영하겠습니다."));
      setFeedbackMessage("");
    } catch {
      toast.error(tr("잠시 후 다시 시도해주세요."));
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const updated = await authApi.updateMe({ username });
      setUser(updated);
      toast.success(tr("프로필이 업데이트되었습니다."));
    } catch {
      toast.error(tr("프로필 업데이트에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const handleNotifSave = async () => {
    setSaving(true);
    try {
      const updated = await notificationApi.updateSettings({
        notify_days_before: notifyDays,
        email_notifications: emailNotif,
        push_notifications: pushNotif,
      });
      setNotifSettings(updated);
      toast.success(tr("알림 설정이 저장되었습니다."));
    } catch {
      toast.error(tr("알림 설정 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const handleBudgetSave = async () => {
    setSaving(true);
    try {
      const value = budgetMonthly.trim() === "" ? null : Number(budgetMonthly);
      if (value !== null && (Number.isNaN(value) || value <= 0)) {
        toast.error(tr("올바른 금액을 입력해주세요."));
        setSaving(false);
        return;
      }
      const updated = await notificationApi.updateSettings({ budget_monthly: value });
      setNotifSettings(updated);
      setBudgetMonthly(updated.budget_monthly != null ? String(updated.budget_monthly) : "");
      toast.success(tr("예산이 저장되었습니다."));
    } catch {
      toast.error(tr("예산 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const handleBudgetClear = async () => {
    setSaving(true);
    try {
      const updated = await notificationApi.updateSettings({ budget_monthly: null });
      setNotifSettings(updated);
      setBudgetMonthly("");
      toast.success(tr("예산이 해제되었습니다."));
    } catch {
      toast.error(tr("예산 해제에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{tr("설정")}</h2>
        <p className="mt-1 text-sm text-slate-400">{tr("계정, 알림, 예산 기준을 한 곳에서 관리합니다.")}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="glass p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{tr("프로필")}</h3>
              <p className="text-xs text-slate-400">{tr("서비스에서 표시되는 기본 정보")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-500">{tr("이메일")}</label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="glass-input mt-1 block w-full rounded-lg px-3 py-2 text-slate-400 opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">{tr("사용자 이름")}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={handleProfileSave} disabled={saving} className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50">{tr("저장")}</button>
          </div>
        </section>

        <section className="glass p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{tr("알림 설정")}</h3>
              <p className="text-xs text-slate-400">{tr("결제 전에 받을 알림 기준")}</p>
            </div>
          </div>

          {notifSettings ? (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-500">{tr("결제일 알림")}</label>
                  <select
                    value={notifyDays}
                    onChange={(e) => setNotifyDays(Number(e.target.value))}
                    className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 5, 7, 14].map((day) => (
                      <option key={day} value={day}>
                        {tr("결제 {n}일 전", { n: day })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEmailNotif(!emailNotif)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                      emailNotif ? "bg-indigo-100 text-indigo-700 shadow-sm" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    {tr("이메일")} {emailNotif ? tr("켜짐") : tr("꺼짐")}
                  </button>
                  <button
                    onClick={() => setPushNotif(!pushNotif)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                      pushNotif ? "bg-violet-100 text-violet-700 shadow-sm" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    {tr("앱 연동")} {pushNotif ? tr("켜짐") : tr("꺼짐")}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button onClick={handleNotifSave} disabled={saving} className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50">{tr("저장")}</button>
              </div>
            </>
          ) : (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          )}
        </section>

        <section className="glass p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-700">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{tr("월 예산 설정")}</h3>
              <p className="text-xs text-slate-400">{tr("대시보드 예산 소진율의 기준")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="block text-sm font-medium text-slate-500">{tr("월 예산")}</label>
              <input
                type="number"
                value={budgetMonthly}
                onChange={(e) => setBudgetMonthly(e.target.value)}
                placeholder={tr("예: 150000")}
                min="0"
                className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={handleBudgetSave} disabled={saving} className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50">{tr("저장")}</button>
              {notifSettings?.budget_monthly != null && (
                <button
                  onClick={handleBudgetClear}
                  disabled={saving}
                  className="btn-danger-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
                >{tr("해제")}</button>
              )}
            </div>
          </div>
        </section>

        <section className="glass p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">{tr("현재 기준")}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/50 p-4">
              <p className="text-xs text-slate-400">{tr("알림 시점")}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{tr("결제 {n}일 전", { n: notifyDays })}</p>
            </div>
            <div className="rounded-2xl bg-white/50 p-4">
              <p className="text-xs text-slate-400">{tr("이메일")}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{emailNotif ? tr("사용") : tr("미사용")}</p>
            </div>
            <div className="rounded-2xl bg-white/50 p-4">
              <p className="text-xs text-slate-400">{tr("앱 연동")}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{pushNotif ? tr("사용") : tr("미사용")}</p>
            </div>
          </div>
        </section>

        <section className="glass p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{tr("오류 신고·의견 보내기")}</h3>
              <p className="text-xs text-slate-400">{tr("불편한 점을 알려주시면 직접 확인합니다")}</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {(["bug", "suggestion", "other"] as FeedbackType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFeedbackType(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  feedbackType === t
                    ? "bg-indigo-600 text-white"
                    : "glass text-slate-500 hover:bg-white/40"
                }`}
              >
                {t === "bug" ? tr("오류") : t === "suggestion" ? tr("개선 의견") : tr("기타")}
              </button>
            ))}
          </div>

          <textarea
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder={tr("어떤 화면에서 무엇을 하다가 생긴 일인지 적어주시면 큰 도움이 됩니다.")}
            className="glass-input mt-3 block w-full resize-none rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {tr("보고 있는 화면과 브라우저 정보가 함께 전송됩니다.")}
            </p>
            <button
              onClick={handleFeedbackSend}
              disabled={sendingFeedback}
              className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {sendingFeedback ? tr("보내는 중...") : tr("보내기")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
