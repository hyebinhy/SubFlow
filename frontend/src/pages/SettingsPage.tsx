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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    notificationApi.getSettings().then((s) => {
      setNotifSettings(s);
      setNotifyDays(s.notify_days_before);
      setEmailNotif(s.email_notifications);
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

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">설정</h2>

      {/* Profile */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">프로필</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              사용자 이름
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">알림 설정</h3>
        {notifSettings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                결제일 알림 (며칠 전)
              </label>
              <select
                value={notifyDays}
                onChange={(e) => setNotifyDays(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[1, 2, 3, 5, 7, 14].map((d) => (
                  <option key={d} value={d}>
                    {d}일 전
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
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
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
    </div>
  );
}
