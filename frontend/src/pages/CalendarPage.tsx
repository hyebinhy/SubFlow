import { useSubscriptions } from "../hooks/useSubscriptions";
import RenewalCalendar from "../components/calendar/RenewalCalendar";

export default function CalendarPage() {
  const { subscriptions, loading, error } = useSubscriptions();
  const active = subscriptions.filter((s) => s.status === "active");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">결제 캘린더</h2>
      {active.length === 0 ? (
        <p className="text-center text-slate-400">활성화된 구독이 없습니다.</p>
      ) : (
        <RenewalCalendar subscriptions={active} />
      )}
    </div>
  );
}
