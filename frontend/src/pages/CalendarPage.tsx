import { useSubscriptions } from "../hooks/useSubscriptions";
import RenewalCalendar from "../components/calendar/RenewalCalendar";

export default function CalendarPage() {
  const { subscriptions, loading } = useSubscriptions();
  const active = subscriptions.filter((s) => s.status === "active");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">결제 캘린더</h2>
      <div className="max-w-2xl">
        <RenewalCalendar subscriptions={active} />
      </div>
    </div>
  );
}
