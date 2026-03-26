import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/auth";
import { notificationApi } from "../api/notifications";
import type { NotificationSettings } from "../types/notification";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? "");
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [notifyDays, setNotifyDays] = useState(3);
  const [emailNotif, setEmailNotif] = useState(true);
  const [budgetMonthly, setBudgetMonthly] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    notificationApi.getSettings().then((s) => {
      setNotifSettings(s);
      setNotifyDays(s.notify_days_before);
      setEmailNotif(s.email_notifications);
      setBudgetMonthly(s.budget_monthly != null ? String(s.budget_monthly) : "");
    }).catch(() => {
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
      if (value !== null && (isNaN(value) || value <= 0)) {
        toast.error("올바른 금액을 입력해주세요.");
        setSaving(false);
        return;
      }
      const updated = await notificationApi.updateSettings({
        budget_monthly: value,
      });
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
      const updated = await notificationApi.updateSettings({
        budget_monthly: null,
      });
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
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">설정</h2>

      {/* Profile */}
      <div className="glass p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">프로필</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500">
              이메일
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 text-slate-400 opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">
              사용자 이름
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">알림 설정</h3>
        {notifSettings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500">
                결제일 알림 (며칠 전)
              </label>
              <select
                value={notifyDays}
                onChange={(e) => setNotifyDays(Number(e.target.value))}
                className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[1, 2, 3, 5, 7, 14].map((d) => (
                  <option key={d} value={d}>
                    {d}일 전
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                이메일 알림
              </span>
              <button
                onClick={() => setEmailNotif(!emailNotif)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  emailNotif ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    emailNotif ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleNotifSave}
              disabled={saving}
              className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              저장
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Budget Settings */}
      <div className="glass p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">월 예산 설정</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500">
              월 예산 (원)
            </label>
            <input
              type="number"
              value={budgetMonthly}
              onChange={(e) => setBudgetMonthly(e.target.value)}
              placeholder="예: 150000"
              min="0"
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              예산을 설정하면 대시보드에서 지출 현황을 한눈에 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBudgetSave}
              disabled={saving}
              className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              저장
            </button>
            {notifSettings?.budget_monthly != null && (
              <button
                onClick={handleBudgetClear}
                disabled={saving}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                예산 해제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
