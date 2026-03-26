import { useEffect, useState } from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { subscriptionApi } from "../api/subscriptions";
import type { CalendarEvent } from "../types/subscription";
import RenewalCalendar from "../components/calendar/RenewalCalendar";

export default function CalendarPage() {
  const { subscriptions, loading, error } = useSubscriptions();
  const active = subscriptions.filter((s) => s.status === "active");

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    subscriptionApi
      .getCalendarEvents()
      .then((data) => {
        if (!cancelled) {
          setCalendarEvents(data.events);
        }
      })
      .catch(() => {
        // Calendar events are optional; fall back to subscriptions only
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || eventsLoading) {
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
      {active.length === 0 && calendarEvents.length === 0 ? (
        <p className="text-center text-slate-400">활성화된 구독이 없습니다.</p>
      ) : (
        <RenewalCalendar subscriptions={active} calendarEvents={calendarEvents} />
      )}
    </div>
  );
}
