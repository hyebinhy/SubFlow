import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Mail, Smartphone, User, WalletCards } from "lucide-react";
import { authApi } from "../api/auth";
import { notificationApi } from "../api/notifications";
import { useAuthStore } from "../store/authStore";
import type { NotificationSettings } from "../types/notification";

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
        toast.error("알림 설정을 불러오는데 실패했습니다.");
      });
  }, []);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const updated = await authApi.updateMe({ username });
      setUser(updated);
      toast.success("프로필이 업데이트되었습니다.");
    } catch {
      toast.error("프로필 업데이트에 실패했습니다.");
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
      toast.success("알림 설정이 저장되었습니다.");
    } catch {
      toast.error("알림 설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleBudgetSave = async () => {
    setSaving(true);
    try {
      const value = budgetMonthly.trim() === "" ? null : Number(budgetMonthly);
      if (value !== null && (Number.isNaN(value) || value <= 0)) {
        toast.error("올바른 금액을 입력해주세요.");
        setSaving(false);
        return;
      }
      const updated = await notificationApi.updateSettings({ budget_monthly: value });
      setNotifSettings(updated);
      setBudgetMonthly(updated.budget_monthly != null ? String(updated.budget_monthly) : "");
      toast.success("예산이 저장되었습니다.");
    } catch {
      toast.error("예산 저장에 실패했습니다.");
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
      toast.success("예산이 해제되었습니다.");
    } catch {
      toast.error("예산 해제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">설정</h2>
        <p className="mt-1 text-sm text-slate-400">계정, 알림, 예산 기준을 한 곳에서 관리합니다.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="glass p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">프로필</h3>
              <p className="text-xs text-slate-400">서비스에서 표시되는 기본 정보</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-500">이메일</label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="glass-input mt-1 block w-full rounded-lg px-3 py-2 text-slate-400 opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">사용자 이름</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={handleProfileSave} disabled={saving} className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50">
              저장
            </button>
          </div>
        </section>

        <section className="glass p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">알림 설정</h3>
              <p className="text-xs text-slate-400">결제 전에 받을 알림 기준</p>
            </div>
          </div>

          {notifSettings ? (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-500">결제일 알림</label>
                  <select
                    value={notifyDays}
                    onChange={(e) => setNotifyDays(Number(e.target.value))}
                    className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 5, 7, 14].map((day) => (
                      <option key={day} value={day}>
                        {day}일 전
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
                    이메일 {emailNotif ? "켜짐" : "꺼짐"}
                  </button>
                  <button
                    onClick={() => setPushNotif(!pushNotif)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                      pushNotif ? "bg-violet-100 text-violet-700 shadow-sm" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    앱 연동 {pushNotif ? "켜짐" : "꺼짐"}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button onClick={handleNotifSave} disabled={saving} className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50">
                  저장
                </button>
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
              <h3 className="text-lg font-semibold text-slate-900">월 예산 설정</h3>
              <p className="text-xs text-slate-400">대시보드 예산 소진율의 기준</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="block text-sm font-medium text-slate-500">월 예산</label>
              <input
                type="number"
                value={budgetMonthly}
                onChange={(e) => setBudgetMonthly(e.target.value)}
                placeholder="예: 150000"
                min="0"
                className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={handleBudgetSave} disabled={saving} className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50">
                저장
              </button>
              {notifSettings?.budget_monthly != null && (
                <button
                  onClick={handleBudgetClear}
                  disabled={saving}
                  className="btn-danger-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  해제
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="glass p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">현재 기준</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/50 p-4">
              <p className="text-xs text-slate-400">알림 시점</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{notifyDays}일 전</p>
            </div>
            <div className="rounded-2xl bg-white/50 p-4">
              <p className="text-xs text-slate-400">이메일</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{emailNotif ? "사용" : "미사용"}</p>
            </div>
            <div className="rounded-2xl bg-white/50 p-4">
              <p className="text-xs text-slate-400">앱 연동</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{pushNotif ? "사용" : "미사용"}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
